import test from 'node:test';
import assert from 'node:assert/strict';
import { mergePassports, cleanPassport, bellaPassportBlock, bellaSections, type StoredPassport } from '../supabase/functions/_shared/passport.ts';
import { storedFromDraft, toMarkdown, toJson, forAssistant, evidenceMap, draftFromStored } from '../src/lib/memory/passport.ts';

const maya: StoredPassport = cleanPassport({
  title: 'Sunrise runner, ramen regular',
  sections: { music: ['House shows, monthly'], food: ['Ramen at Ichiran', 'Matcha most mornings'], travel: ['Lisbon twice'], firsts: ['First trip to Japan, April 2024'] },
  share_partner: { food: true, travel: true, firsts: false, music: false },
  share_bella: { food: true, music: true },
});
const dan = { title: 'Concert goer, ramen regular', sections: { food: ['ramen at Ichiran!', 'Tacos on Fridays'], music: ['Jazz at Smalls'] }, share_partner: { food: true, music: true } };

test('Us: only what each chose to share, the same line once and marked as both', () => {
  const m = mergePassports(maya, dan);
  assert.deepEqual(m.sections.food, [{ text: 'Ramen at Ichiran', who: 'both' }, { text: 'Matcha most mornings', who: 'me' }, { text: 'Tacos on Fridays', who: 'partner' }]);
  assert.deepEqual(m.sections.travel, [{ text: 'Lisbon twice', who: 'me' }]);
  assert.deepEqual(m.sections.music, [{ text: 'Jazz at Smalls', who: 'partner' }], 'my music is not shared with my partner');
  assert.equal(m.sections.firsts, undefined, 'firsts are not shared');
  assert.equal(m.title, 'Sunrise runner, Concert goer');
  // A section their flags say is off never shows, even if it arrived
  assert.equal(mergePassports(null, { ...dan, share_partner: { food: true } }).sections.music, undefined);
  assert.deepEqual(mergePassports(null, null), { title: null, sections: {}, mine: [], theirs: [] });
});

test('Saving keeps only approved text: known sections, short lines, no duplicates, no dots or em dashes, flags as booleans', () => {
  const c = cleanPassport({ title: 'x', sections: { food: ['Ramen', 'ramen', '', 'Sushi — omakase'], health: ['nope'], music: [] }, share_partner: { food: 'yes', travel: true } });
  assert.deepEqual(c.sections, { food: ['Ramen', 'Sushi , omakase'] });
  assert.equal(c.share_partner.food, false);
  assert.equal(c.share_partner.travel, true);
  assert.equal((c.sections as any).health, undefined);
});

test('Bella sees only sections shared with her; the partner\'s only when shared with both', () => {
  const partner = cleanPassport({ ...dan, share_bella: { food: true, music: true }, share_partner: { food: true } });
  const block = bellaPassportBlock(maya, partner, 'Maya', 'Dan')!;
  assert.match(block, /Maya \(Sunrise runner, ramen regular\):\n- Music: House shows, monthly\n- Food: Ramen at Ichiran; Matcha most mornings/);
  assert.match(block, /Dan .*:\n- Food: ramen at Ichiran!; Tacos on Fridays/);
  assert.ok(!/Jazz/.test(block), 'Dan shares music with Bella but not with Maya');
  assert.ok(!/Lisbon/.test(block), 'travel is not shared with Bella');
  assert.deepEqual(bellaSections(maya), ['music', 'food']);
  assert.equal(bellaPassportBlock(null, null, 'Maya', null), null);
});

test('Bring it anywhere: Markdown, JSON and a text for ChatGPT or Claude, text only; photos stay on the device', () => {
  const d = draftFromStored(maya, { 'food:Ramen at Ichiran': ['p7'] });
  assert.deepEqual(d.sections.food[0].evidence, ['p7']);
  assert.deepEqual(evidenceMap(d), { 'food:Ramen at Ichiran': ['p7'] });
  const s = storedFromDraft(d, { share_partner: maya.share_partner, share_bella: maya.share_bella });
  assert.ok(!JSON.stringify(s).includes('p7'));
  const L = { heading: '{name}’s Locket', sections: { music: 'Music', food: 'Food', travel: 'Travel', places: 'Places', rhythm: 'Rhythm', firsts: 'Firsts' }, footer: 'Made with Belluh', aiIntro: 'This is {name}’s Passport.' };
  const md = toMarkdown(s, 'Maya', L);
  assert.match(md, /^# Maya’s Locket\n\n\*Sunrise runner, ramen regular\*\n\n## Music\n- House shows, monthly/);
  assert.ok(!md.includes('## Places'));
  assert.equal(JSON.parse(toJson(s, 'Maya')).sections.food[1], 'Matcha most mornings');
  assert.match(forAssistant(s, 'Maya', L), /^This is Maya’s Passport\.\n\n# Maya/);
});

test('The QR code to show your partner: smallest version that fits, quiet zone, too long refused', async () => {
  const { qrMatrix, qrPath } = await import('../src/lib/qr.ts');
  assert.equal(qrMatrix('hi')!.length, 21);
  assert.equal(qrMatrix('https://belluh.com/locket')!.length, 25);
  assert.equal(qrMatrix('x'.repeat(214)), null);
  const m = qrMatrix('https://belluh.com/locket')!;
  // Finder pattern corners are dark, the separator ring light
  assert.ok(m[0][0] && m[6][6] && !m[7][7] && m[0][24] && m[24][0]);
  assert.equal(qrPath(m).size, 29);
});
