import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseEuropePmc, parseOpenAlex, parseSemanticScholar, rankPapers, europePmcQuery, abstractFromIndex, findResearch } from '../supabase/functions/_shared/research.ts';
import { validateToolCall, systemPrompt } from '../supabase/functions/_shared/agent.ts';

const epmc = JSON.parse(fs.readFileSync(new URL('./fixtures-research-epmc.json', import.meta.url), 'utf8'));

test('Europe PMC (a real response): papers with year, authors, journal, a readable summary and a link', () => {
  const ps = parseEuropePmc(epmc);
  assert.ok(ps.length >= 5);
  for (const p of ps) {
    assert.match(p.url, /^https:\/\/(doi\.org|europepmc\.org)\//);
    assert.ok(!/<\w+>/.test(p.summary), 'no HTML left in summaries');
    assert.ok(p.summary.length <= 430);
  }
});

test('Relationship questions return relationship research, not a gut-microbiome paper with the same words', () => {
  const ranked = rankPapers(parseEuropePmc(epmc), ['long-distance'], new Date('2026-10-30'));
  assert.ok(ranked.length >= 2 && ranked.length <= 4);
  for (const p of ranked) assert.match(p.title, /romantic|couple|relationship|partner|dyadic|marital/i);
  assert.ok(!ranked.some(p => /microbio|immun/i.test(`${p.title} ${p.venue}`)));
  const titles = ranked.map(p => p.title.toLowerCase().replace(/\b(the|a|an)\b/g, '').replace(/[^a-z]/g, '').slice(0, 50));
  assert.equal(new Set(titles).size, titles.length, 'a preprint and its paper count once');
});

test('Ranking: meta-analyses and reviews first, then cited and recent work; editorials sink', () => {
  const base = { venue: 'Journal of Family Psychology', url: '', authors: 'X', source: 'europepmc' as const, summary: 'Couples who repair conflict quickly report higher satisfaction over time in this sample.' };
  const ps = [
    { ...base, title: 'Conflict repair in couples: a small study', year: 2024, citations: 3, kind: 'study' as const, url: 'https://doi.org/1' },
    { ...base, title: 'Conflict repair in couples: a meta-analysis', year: 2016, citations: 400, kind: 'meta-analysis' as const, url: 'https://doi.org/2' },
    { ...base, title: 'Editorial: conflict repair in couples', year: 2025, citations: 0, kind: 'study' as const, url: 'https://doi.org/3' },
  ];
  assert.deepEqual(rankPapers(ps, ['conflict', 'repair'], new Date('2026-10-30')).map(p => p.url), ['https://doi.org/2', 'https://doi.org/1', 'https://doi.org/3']);
});

test('OpenAlex and Semantic Scholar shapes', () => {
  assert.equal(abstractFromIndex({ Couples: [0], argue: [1], less: [2] }), 'Couples argue less');
  const oa = parseOpenAlex({ results: [{ id: 'https://openalex.org/W1', title: 'Gratitude in couples: a meta-analysis', publication_year: 2023, doi: 'https://doi.org/10.1/x', cited_by_count: 50, type: 'article', authorships: [{ author: { display_name: 'A' } }, { author: { display_name: 'B' } }, { author: { display_name: 'C' } }], primary_location: { source: { display_name: 'Psych Bulletin' } }, abstract_inverted_index: { Gratitude: [0], helps: [1] } }] });
  assert.deepEqual([oa[0].authors, oa[0].kind, oa[0].url, oa[0].summary], ['A et al.', 'meta-analysis', 'https://doi.org/10.1/x', 'Gratitude helps']);
  const s2 = parseSemanticScholar({ data: [{ title: 'Texting and satisfaction', year: 2021, authors: [{ name: 'Holtzman' }], citationCount: 8, externalIds: { DOI: '10.2/y' }, tldr: { text: 'More texting, more satisfaction in long-distance couples.' }, publicationTypes: ['JournalArticle'] }] });
  assert.deepEqual([s2[0].url, s2[0].summary, s2[0].kind], ['https://doi.org/10.2/y', 'More texting, more satisfaction in long-distance couples.', 'study']);
});

test('The search: every keyword in the title or abstract, about couples, within the years asked', () => {
  const q = europePmcQuery(['conflict', 'repair'], 2023, 2026);
  assert.match(q, /\(TITLE:"conflict" OR ABSTRACT:"conflict"\) AND \(TITLE:"repair" OR ABSTRACT:"repair"\)/);
  assert.match(q, /TITLE:romantic/);
  assert.ok(!/TITLE:relationship\b/.test(q), '"relationship" alone is too common in medical titles');
  assert.match(q, /PUB_YEAR:\[2023 TO 2026\] AND HAS_ABSTRACT:y$/);
  assert.ok(!europePmcQuery(['sleep'], 2020, 2026, 'health').includes('romantic'));
});

test('findResearch: sources that fail are skipped, never crash', async () => {
  const fake = (async (url: string) => (String(url).includes('europepmc') ? new Response(JSON.stringify(epmc)) : new Response('{"message":"Too Many Requests"}', { status: 429 }))) as typeof fetch;
  const ps = await findResearch(['long-distance'], {}, fake, new Date('2026-10-30'));
  assert.ok(ps.length >= 2);
  assert.ok(ps.every(p => !('text' in p)), 'full abstracts stay internal');
  assert.deepEqual(await findResearch([], {}, fake), []);
  const down = (async () => { throw new Error('offline'); }) as typeof fetch;
  assert.deepEqual(await findResearch(['love'], {}, down), []);
});

test('Bella: the research tool and how she uses it', () => {
  assert.deepEqual(validateToolCall('find_research', { keywords: ['conflict', ' repair attempts '], recent: true }), { name: 'find_research', keywords: ['conflict', 'repair attempts'], topic: 'relationships', recent: true });
  assert.equal(validateToolCall('find_research', { keywords: [] }), null);
  const p = systemPrompt({ myName: 'Maya', partnerName: 'Dan', memories: [], entries: '', dates: '', today: '2026-10-30' });
  assert.match(p, /find_research/);
  assert.match(p, /correlation isn't cause/);
  assert.match(p, /Never use research to diagnose/);
});
