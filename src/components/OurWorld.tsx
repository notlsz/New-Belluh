// The couple's world on the Us page, after amo's profile: a scratch map (where you've been together, and how much of
// the world that is, in a big blue bubble) and your top places ranked like amo's top songs.
import React, { useMemo } from 'react';
import { useI18n, useUi } from '../i18n';
import ourWorld from '../i18n/ui/ourWorld';
import { Emoji } from '../lib/emoji3d';
import { worldPaths, countryOf, COUNTRY_COUNT } from '../lib/world';
import { EntryType, type JournalEntry } from '../types';
import { MOOD_EMOJIS } from '../constants';

const W = 720, H = 360;
let PATHS: { name: string; d: string }[] | null = null;
const emojiFor = (e: JournalEntry) => e.type === EntryType.Voice || e.audioUrl ? '🎙️' : e.type === EntryType.Photo ? '📸' : (e.mood && (MOOD_EMOJIS as any)[e.mood]) || '💌';
const titleOf = (e: JournalEntry) => {
  if (e.location) return e.location;
  const words = (e.content || '').replace(/\s+/g, ' ').trim().split(' ');
  const t = words.slice(0, 4).join(' ');
  return t ? (words.length > 4 ? t + '…' : t) : '';
};
// amo's rank numbers: each place its own color
const RANK = ['#ff4fa3', '#9aa3b2', '#f08a3e', '#5b7cfa'];

const OurWorld: React.FC<{ entries: JournalEntry[] }> = ({ entries }) => {
  const { f, num } = useI18n() as any;
  const T = useUi(ourWorld);
  PATHS ??= worldPaths(W, H);
  const { visited, places } = useMemo(() => {
    const pinned = entries.filter(e => typeof e.lat === 'number' && typeof e.lng === 'number');
    const byPlace = new Map<string, JournalEntry[]>();
    pinned.forEach(e => { const k = `${e.lat!.toFixed(2)},${e.lng!.toFixed(2)}`; byPlace.set(k, [...(byPlace.get(k) ?? []), e]); });
    const places = [...byPlace.values()].map(list => {
      const sorted = [...list].sort((a, b) => +b.timestamp - +a.timestamp);
      return { list: sorted, country: countryOf(sorted[0].lng!, sorted[0].lat!) };
    }).sort((a, b) => b.list.length - a.list.length || +b.list[0].timestamp - +a.list[0].timestamp);
    return { visited: new Set(places.map(p => p.country).filter(Boolean) as string[]), places };
  }, [entries]);
  const pct = visited.size / COUNTRY_COUNT * 100;
  const fmt = (n: number) => (typeof num === 'function' ? num(n) : String(n));

  return (
    <div className="space-y-6">
      {/* The scratch map: the world in soft white on amo's blue, your countries scratched off in pink */}
      <div className="relative rounded-[2rem] bg-[#4f5ff0] overflow-hidden p-5 pb-6">
        <h3 className="font-serif text-xl text-white">{T.scratch}</h3>
        <svg viewBox={`0 14 ${W} 290`} className="mt-3 w-full h-auto" aria-hidden>
          {PATHS.map(p => <path key={p.name} d={p.d} fill={visited.has(p.name) ? '#ffc2dc' : 'rgba(255,255,255,0.22)'} stroke={visited.has(p.name) ? '#fff' : 'none'} strokeWidth={visited.has(p.name) ? 1.2 : 0} />)}
        </svg>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="belluh-pop rounded-[1.4rem] bg-white px-5 py-3 shadow-[0_14px_30px_-14px_rgba(20,30,120,0.6)]">
            <p className="text-[2rem] leading-none font-extrabold tracking-tight text-[#3446e6] tabular-nums">{pct < 10 ? pct.toFixed(1) : Math.round(pct)}<span className="text-lg align-top">%</span></p>
            <p className="mt-1 text-[13px] font-bold text-[#3446e6]/80">{T.ofWorld}</p>
          </div>
          <div className="text-right text-white">
            <p className="text-[15px] font-bold">{visited.size === 1 ? T.country : f(T.countries, { n: fmt(visited.size) })}</p>
            <p className="mt-0.5 text-[15px] font-bold opacity-80">{places.length === 1 ? T.place : f(T.places, { n: fmt(places.length) })}</p>
          </div>
        </div>
      </div>

      {/* Your top places, ranked like amo's top songs */}
      <div>
        <h3 className="flex items-center gap-2 font-serif text-xl text-slate-900"><Emoji e="📍" size={26} /> {T.top}</h3>
        {places.length === 0 ? (
          <p className="mt-3 rounded-[1.6rem] bg-slate-100 p-5 text-[15px] text-slate-500">{T.empty}</p>
        ) : (
          <ol className="mt-3 rounded-[1.75rem] bg-slate-100 p-2.5 space-y-1">
            {places.slice(0, 6).map((p, i) => {
              const e = p.list[0];
              return (
                <li key={i} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-white/70">
                  <span className="w-9 shrink-0 text-center text-[1.35rem] font-black italic tabular-nums" style={{ color: RANK[Math.min(i, 3)], WebkitTextStroke: '0.5px rgba(255,255,255,0.8)' }}>#{i + 1}</span>
                  {e.mediaUrl ? <img src={e.mediaUrl} alt="" className="w-12 h-12 shrink-0 rounded-xl object-cover border-2 border-white shadow-sm" /> : <span className="w-12 h-12 shrink-0 rounded-xl bg-white flex items-center justify-center shadow-sm"><Emoji e={emojiFor(e)} size={30} /></span>}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold text-slate-900 truncate">{titleOf(e) || p.country || '—'}</span>
                    <span className="block text-[12px] font-semibold uppercase tracking-wide text-slate-400 truncate">{p.country ?? ''}</span>
                  </span>
                  <span className="shrink-0 text-[13px] font-bold text-slate-500">{p.list.length === 1 ? T.memory : f(T.memories, { n: fmt(p.list.length) })}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
};

export default OurWorld;
