// Ideas: what Bella could take on for them right now, before they think to ask. A birthday in two weeks, White Day
// coming up in Japan, day 1,000 together, something their partner said they'd love, a plan nobody answered, a goal
// falling behind, a while since their last date. Returned as data, not sentences, so the app says each one in the
// reader's language; tapping one asks Bella to do it. Pure logic, unit-tested in Node.

import { daysBetween, nextOccurrence, type LocalDate } from './occasions.ts';
import { togetherSince, loveDaysSoon, type DatedOccasion } from './jarvis.ts';
import { current, type Goal } from './goals.ts';

export type Idea =
  | { kind: 'occasion'; key: string; label: string; inDays: number }
  | { kind: 'love_day'; key: string; name: string; local?: string; inDays: number }
  | { kind: 'milestone'; key: string; day: number; inDays: number }
  | { kind: 'wish'; key: string; fact: string }
  | { kind: 'plan_waiting'; key: string; title: string }
  | { kind: 'goal'; key: string; title: string; goalKind: Goal['kind']; now: number; target: number; currency: string | null }
  | { kind: 'watching'; key: string; what: string }
  | { kind: 'novelty'; key: string; days: number | null };

export interface IdeasInput {
  occasions: (DatedOccasion & { kind?: string | null; repeats_yearly?: boolean | null })[];
  country: string;
  memories: string[];                 // what Bella remembers (some are things their partner loves or wants)
  waitingPlans: { id: string; title: string }[];
  goals: Goal[];
  watches: { id: string; what: string }[];
  lastTogether: string | null;        // the last date they did together (ISO), if any
}

// "Dan wants to see the northern lights", "she loves peonies", "always wanted to try omakase"
const WISH = /\b(wants?|wanted|would love|'d love|loves|dreams? of|wish(es)?|bucket list|has always|always wanted|been meaning to|someday)\b/i;

export function buildIdeas(x: IdeasInput, today: LocalDate, limit = 6): Idea[] {
  const out: (Idea & { rank: number })[] = [];

  // Their own dates: birthdays and anniversaries in the next three weeks, soonest first
  // (a saved trip or dinner is already a plan; "a table, a gift and the words" is for the days that are about them)
  const people = /birthday|anniversary|turns \d|geburtstag|anniversaire|compleanno|anivers[aá]rio|誕生日|記念日|生日|纪念日/i;
  const sameDay = new Set<string>(), sameWho = new Set<string>();
  for (const o of x.occasions) {
    if (!['birthday', 'anniversary', 'first_date', 'first_met'].includes(o.kind ?? '') && !people.test(o.label)) continue;
    const next = nextOccurrence({ month: o.month, day: o.day, year: o.year, repeats_yearly: o.repeats_yearly ?? true }, today);
    if (!next) continue;
    const inDays = daysBetween(today, next);
    // One idea per day, and per person's birthday ("Dan's birthday" and "Dan turns 30" are the same thing)
    const who = o.kind === 'birthday' || /birthday|turns \d/i.test(o.label) ? (o.label.match(/^[\p{L}]+/u)?.[0] ?? '').toLowerCase() : '';
    if (sameDay.has(`${next.m}-${next.d}`) || (who && sameWho.has(who))) continue;
    if (inDays < 0 || inDays > 21) continue;
    sameDay.add(`${next.m}-${next.d}`); if (who) sameWho.add(who);
    out.push({ kind: 'occasion', key: `occ:${o.label}:${next.y}`, label: o.label, inDays, rank: inDays });
  }

  // The days couples there celebrate, a month ahead (two weeks before, things book up)
  for (const d of loveDaysSoon(x.country, today, 30)) out.push({ kind: 'love_day', key: `love:${d.name}:${d.on.y}`, name: d.name, ...(d.local ? { local: d.local } : {}), inDays: d.inDays, rank: d.inDays + 3 });

  // Day counts: the next round hundred or thousand within a month
  const t = togetherSince(x.occasions);
  if (t) {
    const day = daysBetween(t.start, today) + 1;
    const next = day < 1000 ? Math.ceil(day / 100) * 100 : Math.ceil(day / 500) * 500;
    const inDays = next - day;
    if (day >= 1 && inDays >= 0 && inDays <= 30) out.push({ kind: 'milestone', key: `day:${next}`, day: next, inDays, rank: inDays + 1 });
  }

  // Something their partner would love, one at a time, a different one each day
  const wishes = x.memories.filter(m => WISH.test(m)).slice(0, 20);
  if (wishes.length) { const w = wishes[(today.y * 372 + today.m * 31 + today.d) % wishes.length]; out.push({ kind: 'wish', key: `wish:${w.slice(0, 40)}`, fact: w, rank: 12 }); }

  for (const p of x.waitingPlans.slice(0, 2)) out.push({ kind: 'plan_waiting', key: `plan:${p.id}`, title: p.title, rank: 2 });

  // A goal that needs a push: saving behind pace, a habit not done yet this week, a budget nearly spent
  for (const g of x.goals.filter(g => (g.status ?? 'active') === 'active')) {
    const now = current(g, today);
    const behind = g.kind === 'habit' ? now < g.target : g.kind === 'budget' ? now >= g.target * 0.8 : now < g.target;
    if (behind) out.push({ kind: 'goal', key: `goal:${g.id ?? g.title}`, title: g.title, goalKind: g.kind, now, target: g.target, currency: g.currency, rank: g.kind === 'budget' ? 6 : 14 });
  }

  for (const w of x.watches.slice(0, 2)) out.push({ kind: 'watching', key: `watch:${w.id}`, what: w.what, rank: 20 });

  // A while since they did something together: two weeks, or never through Belluh
  const since = x.lastTogether ? Math.floor((Date.UTC(today.y, today.m - 1, today.d) - Date.parse(x.lastTogether)) / 86_400_000) : null;
  if (since == null || since >= 14) out.push({ kind: 'novelty', key: `novelty:${today.y}-${today.m}`, days: since, rank: since == null ? 18 : 8 });

  const seen = new Set<string>();
  return out.sort((a, b) => a.rank - b.rank)
    .filter(i => !seen.has(i.key) && (seen.add(i.key), true))
    .slice(0, limit)
    .map(({ rank: _r, ...i }) => i as Idea);
}
