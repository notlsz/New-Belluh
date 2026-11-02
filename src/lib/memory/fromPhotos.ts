// What "From your photos" shows, read on this device: the gaps since the couple's last date and the screenshots that
// look like plans. The last date comes from Belluh (plans you both said yes to, things you booked); everything else
// comes from the index through engine.list() and engine.interests(), and nothing here is sent anywhere.
import { useEffect, useState } from 'react';
import type { IndexingState, MemoryEngine } from './types';
import { isSearchable } from './types';
import { gapsBetweenDates, lastDateOf, type DateMark, type Gaps } from './gaps';
import { screenshotPlans, type ShotPlan } from './screenshots';

export interface FromPhotos { gaps: Gaps | null; shots: ShotPlan[] }

/** The couple's last date, from Belluh's plans and bookings (both are readable by the two of you) */
export async function loadLastDate(now = Date.now()): Promise<DateMark | null> {
  try {
    const { supabase } = await import('../supabaseClient');
    const [p, b] = await Promise.all([
      supabase.from('plans').select('status, title, chosen_option, options').eq('status', 'confirmed').order('created_at', { ascending: false }).limit(30),
      supabase.from('bookings').select('kind, status, title, starts_at').eq('status', 'booked').lte('starts_at', new Date(now).toISOString()).order('starts_at', { ascending: false }).limit(30),
    ]);
    return lastDateOf((p.data ?? []) as any[], (b.data ?? []) as any[], now);
  } catch { return null; }
}

export async function readFromPhotos(engine: MemoryEngine, last: DateMark | null, now = Date.now()): Promise<FromPhotos> {
  if (!engine.list || !isSearchable(engine.state())) return { gaps: null, shots: [] };
  const [all, shots, interests] = await Promise.all([
    engine.list({ limit: 2000 }),
    engine.list({ mediaType: 'screenshot', limit: 300 }),
    engine.interests('now').catch(() => []),
  ]);
  return { gaps: gapsBetweenDates(all, { last, now, interests }), shots: screenshotPlans(shots, 8) };
}

/** Both, live: refreshed when indexing settles. null until read; empty when Memory is off. */
export function useFromPhotos(engine: MemoryEngine | null | undefined, opts: { lastDate?: () => Promise<DateMark | null> } = {}): FromPhotos | null {
  const [data, setData] = useState<FromPhotos | null>(null);
  const [state, setState] = useState<IndexingState | null>(null);
  useEffect(() => { if (!engine) return; setState(engine.state()); return engine.onState(setState); }, [engine]);
  const ready = !!state && isSearchable(state);
  const settled = state?.type ?? null;
  useEffect(() => {
    if (!engine || !ready) { setData(engine === null ? { gaps: null, shots: [] } : null); return; }
    let live = true;
    (opts.lastDate ?? loadLastDate)().then(last => readFromPhotos(engine, last)).then(d => { if (live) setData(d); }).catch(() => { if (live) setData({ gaps: null, shots: [] }); });
    return () => { live = false; };
  }, [engine, ready, settled]);
  return data;
}
