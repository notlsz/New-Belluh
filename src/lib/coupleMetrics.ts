// The numbers that say whether Belluh works as a couples product: are both people showing up? Pure, unit-tested.

export interface CoupleRow { user_id: string; partner_id: string; connected_at: string | null }
export interface EntryRow { user_id: string; created_at: string }
export interface CoupleMetrics {
  couples: number;            // connected couples
  bothActive7d: number;       // couples where both wrote in the last 7 days
  bothActiveRate: number;     // bothActive7d / couples, 0..100
  week1Both: number | null;   // of couples connected 8+ days ago with a known date: % where both wrote in their first 7 days
}

const DAY = 86_400_000;

export function coupleMetrics(rows: CoupleRow[], entries: EntryRow[], now = Date.now()): CoupleMetrics {
  // One couple per pair, whichever way round the connection was stored
  const pairs = new Map<string, CoupleRow>();
  for (const r of rows) {
    if (!r.user_id || !r.partner_id || r.user_id === r.partner_id) continue;
    const k = [r.user_id, r.partner_id].sort().join(':');
    const had = pairs.get(k);
    if (!had || (r.connected_at && (!had.connected_at || r.connected_at < had.connected_at))) pairs.set(k, r);
  }
  const byUser = new Map<string, number[]>();
  for (const e of entries) { const t = Date.parse(e.created_at); if (!Number.isNaN(t)) (byUser.get(e.user_id) ?? byUser.set(e.user_id, []).get(e.user_id)!).push(t); }
  const wrote = (u: string, from: number, to: number) => (byUser.get(u) ?? []).some(t => t >= from && t < to);

  let both7 = 0, cohort = 0, cohortBoth = 0;
  for (const c of pairs.values()) {
    if (wrote(c.user_id, now - 7 * DAY, now + DAY) && wrote(c.partner_id, now - 7 * DAY, now + DAY)) both7++;
    const at = c.connected_at ? Date.parse(c.connected_at) : NaN;
    if (!Number.isNaN(at) && at <= now - 8 * DAY) {
      cohort++;
      if (wrote(c.user_id, at, at + 7 * DAY) && wrote(c.partner_id, at, at + 7 * DAY)) cohortBoth++;
    }
  }
  const n = pairs.size;
  return {
    couples: n,
    bothActive7d: both7,
    bothActiveRate: n ? Math.round((both7 / n) * 100) : 0,
    week1Both: cohort ? Math.round((cohortBoth / cohort) * 100) : null,
  };
}
