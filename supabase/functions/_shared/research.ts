// Research behind Bella's answers. When someone asks how relationships, people or habits work ("is it normal to argue
// this much?", "does long distance last?", "how do we fight better?"), Bella looks at what studies actually found and
// cites them, instead of guessing or reciting self-help. Sources, all free: OpenAlex when OPENALEX_API_KEY is set (250M+
// works), Europe PMC (psychology, health and behavior, no key), Semantic Scholar (one-line summaries; S2_API_KEY
// optional). Results are merged and reranked: on-topic titles, reviews and meta-analyses, well cited, and recent.
// Parsing and ranking are pure, so they're unit-tested in Node.

export type Topic = 'relationships' | 'behavior' | 'health';

export interface Paper {
  title: string;
  year: number | null;
  authors: string;          // "Gottman JM, Levenson RW" or "Gottman et al."
  venue: string | null;     // the journal
  url: string;              // the DOI, or the paper's page
  summary: string;          // a one-line summary, or the opening of the abstract
  citations: number;
  kind: 'meta-analysis' | 'review' | 'study';
  source: 'openalex' | 'europepmc' | 'semanticscholar';
  text?: string;            // the whole abstract, for ranking only
}

const env = (k: string) => { try { return (globalThis as any).Deno?.env.get(k) ?? undefined; } catch { return undefined; } };
const clean = (s: unknown) => (typeof s === 'string' ? s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '');
const firstSentences = (s: string, max = 420) => {
  const t = clean(s).replace(/^(abstract|background|objective|objectives|purpose|introduction)[:.]?\s*/i, '');
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '));
  return (end > 120 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '…');
};
const authorsShort = (names: string[]) => (names.length > 2 ? `${names[0]} et al.` : names.join(', '));
const doiUrl = (doi: unknown) => (typeof doi === 'string' && doi ? (doi.startsWith('http') ? doi : `https://doi.org/${doi}`) : null);
const kindOf = (types: string[], title: string): Paper['kind'] => {
  const t = `${types.join(' ')} ${title}`.toLowerCase();
  if (/meta-?analy/.test(t)) return 'meta-analysis';
  if (/\breview\b|systematic/.test(t)) return 'review';
  return 'study';
};

/** OpenAlex keeps abstracts as word positions; put the words back in order. */
export function abstractFromIndex(idx: unknown): string {
  if (!idx || typeof idx !== 'object') return '';
  const words: [number, string][] = [];
  for (const [w, at] of Object.entries(idx as Record<string, number[]>)) for (const i of at ?? []) words.push([i, w]);
  return words.sort((a, b) => a[0] - b[0]).map(x => x[1]).join(' ');
}

export function parseOpenAlex(json: unknown): Paper[] {
  const r = (json as any)?.results;
  return (Array.isArray(r) ? r : []).flatMap((w: any): Paper[] => {
    const title = clean(w?.title ?? w?.display_name);
    const url = doiUrl(w?.doi) ?? (typeof w?.id === 'string' ? w.id : null);
    if (!title || !url) return [];
    const abstract = abstractFromIndex(w?.abstract_inverted_index);
    return [{
      title, year: Number(w?.publication_year) || null, url, source: 'openalex',
      authors: authorsShort((w?.authorships ?? []).map((a: any) => a?.author?.display_name).filter(Boolean)),
      venue: w?.primary_location?.source?.display_name ?? null, summary: firstSentences(abstract), text: clean(abstract), citations: Number(w?.cited_by_count) || 0,
      kind: kindOf([String(w?.type ?? '')], title),
    }];
  });
}

export function parseEuropePmc(json: unknown): Paper[] {
  const r = (json as any)?.resultList?.result;
  return (Array.isArray(r) ? r : []).flatMap((x: any): Paper[] => {
    const title = clean(x?.title).replace(/\.$/, '');
    const url = doiUrl(x?.doi) ?? (x?.pmid ? `https://europepmc.org/article/MED/${x.pmid}` : x?.id ? `https://europepmc.org/article/${x.source}/${x.id}` : null);
    if (!title || !url) return [];
    const types: string[] = x?.pubTypeList?.pubType ?? (x?.pubType ? [x.pubType] : []);
    const names = String(x?.authorString ?? '').replace(/\.$/, '').split(/,\s*/).filter(Boolean);
    return [{
      title, year: Number(x?.pubYear) || null, url, source: 'europepmc', authors: authorsShort(names),
      venue: x?.journalInfo?.journal?.title ?? x?.journalTitle ?? null, summary: firstSentences(x?.abstractText ?? ''), text: clean(x?.abstractText),
      citations: Number(x?.citedByCount) || 0, kind: kindOf(Array.isArray(types) ? types : [String(types)], title),
    }];
  });
}

export function parseSemanticScholar(json: unknown): Paper[] {
  const r = (json as any)?.data;
  return (Array.isArray(r) ? r : []).flatMap((p: any): Paper[] => {
    const title = clean(p?.title);
    const url = doiUrl(p?.externalIds?.DOI) ?? p?.url ?? null;
    if (!title || !url) return [];
    return [{
      title, year: Number(p?.year) || null, url, source: 'semanticscholar',
      authors: authorsShort((p?.authors ?? []).map((a: any) => a?.name).filter(Boolean)), venue: p?.venue || null,
      summary: clean(p?.tldr?.text) || firstSentences(p?.abstract ?? ''), text: clean(`${p?.tldr?.text ?? ''} ${p?.abstract ?? ''}`), citations: Number(p?.citationCount) || 0,
      kind: kindOf(p?.publicationTypes ?? [], title),
    }];
  });
}

/**
 * Best first: on the topic (keywords in the title), reviews and meta-analyses over single studies, well cited, recent,
 * and with something to read. Duplicates across sources (same DOI or title) are kept once.
 */
const ABOUT_LOVE = /romantic|couple|marital|marri|dyadic|spous|dating|\blove\b|close relationship|partner|intimacy|intimate/i;
// Clinical and lab-science journals: a "long-distance relationship" there is between gut bacteria and the immune system
const FAR_FIELD = /urolog|orthop|surg|immunol|oncolog|cardio|sports med|radiol|dermatol|ophthalm|dental|nephrol|gastro|microb|cell|molecular|genet|neuroimag|pharmac|veterin|plant|ecolog|chem|physic/i;

export function rankPapers(papers: Paper[], keywords: string[], now = new Date(), limit = 4, topic: Topic = 'relationships'): Paper[] {
  const seen = new Set<string>();
  const kws = keywords.map(k => k.toLowerCase()).filter(k => k.length > 2);
  const year = now.getUTCFullYear();
  const score = (p: Paper) => {
    const t = p.title.toLowerCase(), all = `${t} ${(p.text ?? p.summary).toLowerCase()}`;
    const onTopic = kws.filter(k => t.includes(k)).length * 3 + kws.filter(k => all.includes(k)).length;
    const age = p.year ? year - p.year : 30;
    return onTopic + (p.kind === 'meta-analysis' ? 5 : p.kind === 'review' ? 3 : 0) + Math.log10(p.citations + 1) * 2
      + (age <= 3 ? 2 : age <= 10 ? 1 : 0) + (p.summary.length > 60 ? 1 : -3) + (/editorial|erratum|correction|comment on/i.test(p.title) ? -6 : 0);
  };
  const covers = (p: Paper) => { const all = `${p.title} ${p.text ?? p.summary}`.toLowerCase(); return kws.every(k => all.includes(k.replace(/s$/, ''))); };
  const onTopic = (p: Paper) => topic !== 'relationships' || ABOUT_LOVE.test(p.title);
  const pool = papers.filter(p => onTopic(p) && !FAR_FIELD.test(p.venue ?? '')).length >= 2 ? papers.filter(p => onTopic(p) && !FAR_FIELD.test(p.venue ?? '')) : papers;
  const full = pool.filter(covers);
  return (full.length >= 2 ? full : pool)
    .filter(p => {
      // The same study as a preprint and as a paper: same DOI, or the same title give or take "the" and punctuation
      const k = p.url.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
      const tk = p.title.toLowerCase().replace(/\b(the|a|an)\b/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 50);
      if (seen.has(k) || seen.has(tk)) return false;
      seen.add(k); seen.add(tk); return true;
    })
    .map(p => ({ p, s: score(p) })).sort((a, b) => b.s - a.s).slice(0, limit).map(x => x.p);
}

/** Europe PMC wants field searches; each keyword must appear in the title or abstract. */
// For relationship questions the paper has to be about relationships: a word like these in its title
const ANCHOR: Record<Topic, string | null> = {
  // (not "relationship" alone: "the relationship between X and Y" is how half of medicine titles its papers)
  relationships: '(TITLE:romantic OR TITLE:couple OR TITLE:couples OR TITLE:marital OR TITLE:marriage OR TITLE:married OR TITLE:dyadic OR TITLE:spouses OR TITLE:dating OR TITLE:love OR TITLE:"close relationships" OR TITLE:"romantic partners" OR TITLE:"long-distance relationships")',
  behavior: null, health: null,
};
export function europePmcQuery(keywords: string[], fromYear: number, toYear: number, topic: Topic = 'relationships'): string {
  const terms = keywords.map(k => k.replace(/["()]/g, '').trim()).filter(k => k.length > 1).slice(0, 5)
    .map(k => `(TITLE:"${k}" OR ABSTRACT:"${k}")`);
  return [...terms, ...(ANCHOR[topic] ? [ANCHOR[topic]] : []), `PUB_YEAR:[${fromYear} TO ${toYear}]`, 'HAS_ABSTRACT:y'].join(' AND ');
}

/** Studies on what they asked: up to four, with what each found in a line. Recent asks for the last few years only. */
export async function findResearch(keywords: string[], opts: { recent?: boolean; topic?: Topic } = {}, fetchImpl: typeof fetch = fetch, now = new Date()): Promise<Paper[]> {
  const kws = keywords.map(k => String(k).replace(/\s+/g, ' ').trim()).filter(k => k.length > 1).slice(0, 5);
  if (!kws.length) return [];
  const to = now.getUTCFullYear(), from = opts.recent ? to - 3 : to - 20;
  const q = kws.join(' ');
  const get = async (url: string, headers: Record<string, string> = {}) => {
    try { const r = await fetchImpl(url, { headers: { 'User-Agent': 'Belluh/1.0 (hello@belluh.com)', ...headers }, signal: AbortSignal.timeout(7000) }); return r.ok ? await r.json() : null; } catch { return null; }
  };
  const tasks: Promise<Paper[]>[] = [];
  const oa = env('OPENALEX_API_KEY');
  if (oa) tasks.push(get(`https://api.openalex.org/works?search=${encodeURIComponent(q)}&filter=has_abstract:true,from_publication_date:${from}-01-01&per-page=15&api_key=${encodeURIComponent(oa)}`).then(parseOpenAlex));
  tasks.push(get(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(europePmcQuery(kws, from, to, opts.topic ?? 'relationships'))}&format=json&resultType=core&pageSize=15`).then(parseEuropePmc));
  const s2 = env('S2_API_KEY');
  tasks.push(get(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(q)}&limit=12&year=${from}-${to}&fields=title,year,authors,venue,citationCount,externalIds,url,tldr,abstract,publicationTypes`, s2 ? { 'x-api-key': s2 } : {}).then(parseSemanticScholar));
  const all = (await Promise.all(tasks)).flat();
  return rankPapers(all, kws, now, 4, opts.topic ?? 'relationships').map(({ text: _t, ...p }) => p);
}
