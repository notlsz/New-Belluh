// The song, the movie or show, and the book on a profile. Search finds the real thing with its real cover (Apple's
// catalog, Wikipedia, TVmaze, Open Library, Google Books). Songs work like Instagram's music sticker: album art, title,
// artist, and a 30-second preview to tap and play. Movies, shows and books work like Letterboxd and Goodreads: a rating
// in half stars, a heart for the ones you love, where you are with it, and a line about it.
import React, { useEffect, useRef, useState } from 'react';
import { findSongs, findMovies, findBooks, type Found } from '../services/look';

export type MediaKind = 'music' | 'movie' | 'book';
export interface MediaStrings { songPh: string; rate: string; loved: string; reviewPh: string; play: string; pause: string; none: string; useTyped: string; watched: string; toWatch: string; read: string; reading: string; toRead: string; onRepeat: string; change: string }
type Data = Record<string, string>;

const FIND: Record<MediaKind, (q: string) => Promise<Found[]>> = { music: findSongs, movie: findMovies, book: findBooks };

const Search: React.FC<{ kind: MediaKind; placeholder: string; S: MediaStrings; onPick: (d: Data) => void; autoFocus?: boolean }> = ({ kind, placeholder, S, onPick, autoFocus }) => {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<Found[] | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (q.trim().length < 2) { setRes(null); return; }
    let live = true; setBusy(true);
    const t = setTimeout(() => FIND[kind](q).then(r => { if (live) { setRes(r); setBusy(false); } }), 320);
    return () => { live = false; clearTimeout(t); };
  }, [q, kind]);
  const pick = (x: Found) => { onPick({ title: x.title, by: kind === 'movie' ? '' : x.by, year: x.year, cover: x.cover ?? '', preview: x.preview ?? '', url: x.url ?? '', kind: x.kind ?? '' }); setQ(''); setRes(null); };
  const square = kind === 'music';
  return (
    <div className="relative">
      <input value={q} onChange={e => setQ(e.target.value)} autoFocus={autoFocus} placeholder={placeholder} aria-label={placeholder}
        onKeyDown={e => { if (e.key === 'Enter') { if (res?.[0]) pick(res[0]); else if (q.trim()) onPick({ title: q.trim().slice(0, 80) }); } }}
        className="w-full h-11 rounded-xl bg-white px-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9bbecb]" />
      {busy && <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin" aria-hidden />}
      {res && (
        <div className="absolute z-30 inset-x-0 top-12 rounded-2xl bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.45)] border border-slate-100 max-h-80 overflow-y-auto p-1">
          {res.map((x, i) => (
            <button key={i} type="button" onClick={() => pick(x)} className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-50">
              {x.cover ? <img src={x.cover} alt="" className={`shrink-0 object-cover shadow-sm ${square ? 'w-11 h-11 rounded-md' : 'w-9 h-[54px] rounded'}`} /> : <span className={`shrink-0 bg-slate-100 ${square ? 'w-11 h-11 rounded-md' : 'w-9 h-[54px] rounded'}`} />}
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold text-slate-900 truncate">{x.title}</span>
                <span className="block text-[12px] text-slate-500 truncate">{[x.by && x.by !== x.year ? x.by : '', x.year].filter(Boolean).join(', ')}</span>
              </span>
            </button>
          ))}
          {res.length === 0 && <p className="px-3 py-3 text-[13px] text-slate-500">{S.none}</p>}
          {q.trim() && <button type="button" onClick={() => { onPick({ title: q.trim().slice(0, 80) }); setQ(''); setRes(null); }} className="w-full px-3 py-2.5 rounded-xl text-left text-[13px] font-semibold text-[#3f7486] hover:bg-slate-50">{S.useTyped.replace('{q}', q.trim())}</button>}
        </div>
      )}
    </div>
  );
};

// Half stars, like Letterboxd: tap the left half of a star for a half
export const Stars: React.FC<{ value: number; onChange?: (v: number) => void; label: string; size?: number; dark?: boolean }> = ({ value, onChange, label, size = 22, dark }) => (
  <div className="inline-flex items-center gap-0.5" role={onChange ? 'radiogroup' : 'img'} aria-label={`${label}: ${value}/5`}>
    {[1, 2, 3, 4, 5].map(n => {
      const fill = value >= n ? 1 : value >= n - 0.5 ? 0.5 : 0;
      return (
        <span key={n} className="relative inline-block" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className="absolute inset-0"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill={dark ? 'rgba(255,255,255,.18)' : '#e2e8f0'} /></svg>
          <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0)` }}><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="#f5b83d" /></svg>
          {onChange && <>
            <button type="button" aria-label={`${n - 0.5}`} onClick={() => onChange(value === n - 0.5 ? 0 : n - 0.5)} className="absolute left-0 top-0 h-full w-1/2" />
            <button type="button" aria-label={`${n}`} onClick={() => onChange(value === n ? 0 : n)} className="absolute right-0 top-0 h-full w-1/2" />
          </>}
        </span>
      );
    })}
  </div>
);

const Heart: React.FC<{ on: boolean; onToggle?: () => void; label: string }> = ({ on, onToggle, label }) => {
  const icon = <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill={on ? '#ec4899' : 'none'} stroke={on ? '#ec4899' : '#94a3b8'} strokeWidth="1.8" /></svg>;
  return onToggle ? <button type="button" onClick={onToggle} aria-pressed={on} aria-label={label} className="inline-flex items-center justify-center w-9 h-9">{icon}</button> : on ? <span role="img" aria-label={label} className="inline-flex items-center justify-center w-9 h-9">{icon}</span> : null;
};

// One preview plays at a time across the page
let playing: HTMLAudioElement | null = null;
const Preview: React.FC<{ src: string; S: MediaStrings; dark: boolean }> = ({ src, S, dark }) => {
  const a = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);
  const [t, setT] = useState(0);
  useEffect(() => () => { a.current?.pause(); }, []);
  const toggle = () => {
    if (!a.current) { a.current = new Audio(src); a.current.ontimeupdate = () => setT(a.current!.currentTime / (a.current!.duration || 30)); a.current.onended = () => { setOn(false); setT(0); }; a.current.onpause = () => setOn(false); a.current.onplay = () => setOn(true); }
    if (on) a.current.pause(); else { if (playing && playing !== a.current) playing.pause(); playing = a.current; a.current.play().catch(() => {}); }
  };
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={toggle} aria-label={on ? S.pause : S.play} className={`shrink-0 w-11 h-11 rounded-full inline-flex items-center justify-center ${dark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}>
        {on ? <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><rect x="2" y="1" width="3.5" height="12" rx="1" fill="currentColor" /><rect x="8.5" y="1" width="3.5" height="12" rx="1" fill="currentColor" /></svg>
          : <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M3 1.5v11l9.5-5.5z" fill="currentColor" /></svg>}
      </button>
      {/* A little waveform that fills as it plays, like the music sticker */}
      <div className="flex-1 flex items-center gap-[3px] h-8" aria-hidden>
        {Array.from({ length: 28 }, (_, i) => <span key={i} className="flex-1 rounded-full transition-colors" style={{ height: `${30 + Math.abs(Math.sin(i * 1.7) * 70)}%`, background: i / 28 <= t && (on || t > 0) ? (dark ? '#fff' : '#0f172a') : (dark ? 'rgba(255,255,255,.3)' : '#cbd5e1') }} />)}
      </div>
    </div>
  );
};

const MediaBlock: React.FC<{ kind: MediaKind; data: Data; editing: boolean; dark: boolean; label: React.ReactNode; placeholder: string; S: MediaStrings; set: (d: Data) => void }> = ({ kind, data, editing, dark, label, placeholder, S, set }) => {
  const title = data.title, by = data.by ?? data.artist ?? data.author ?? '', cover = data.cover || data.poster || '';
  const rating = Number(data.rating || 0), loved = data.loved === '1';
  const [changing, setChanging] = useState(!title);
  const ink = dark ? 'text-white' : 'text-slate-900', sub = dark ? 'text-white/70' : 'text-slate-500';
  const statuses = kind === 'movie' ? [['watched', S.watched], ['toWatch', S.toWatch]] : kind === 'book' ? [['read', S.read], ['reading', S.reading], ['toRead', S.toRead]] : [['onRepeat', S.onRepeat]];
  const statusLabel = statuses.find(([k]) => k === data.status)?.[1];
  const square = kind === 'music';
  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">{label}{editing && title && !changing && <button type="button" onClick={() => setChanging(true)} className={`text-[12px] font-bold ${sub} hover:underline`}>{S.change}</button>}</div>
      {editing && (changing || !title) && <Search kind={kind} placeholder={placeholder} S={S} autoFocus={!!title} onPick={d => { set({ title: d.title, by: d.by ?? '', year: d.year ?? '', cover: d.cover ?? '', preview: d.preview ?? '', url: d.url ?? '', kind: d.kind ?? '', artist: '', author: '', poster: '' }); setChanging(false); }} />}
      {title && (
        <div className={`flex gap-4 ${square ? 'items-center' : 'items-start'} min-h-0`}>
          {cover ? <img src={cover} alt="" className={`shrink-0 object-cover shadow-[0_12px_24px_-12px_rgba(15,23,42,0.6)] ${square ? 'w-20 h-20 rounded-xl' : 'w-[84px] h-[126px] rounded-lg'}`} /> : <span className={`shrink-0 ${dark ? 'bg-white/10' : 'bg-slate-100'} ${square ? 'w-20 h-20 rounded-xl' : 'w-[84px] h-[126px] rounded-lg'}`} />}
          <div className="min-w-0 flex-1">
            <p className={`font-serif text-[1.15rem] leading-snug ${ink} [overflow-wrap:anywhere]`}>{title}</p>
            <p className={`mt-0.5 text-[13px] font-semibold ${sub} truncate`}>{[by, data.year].filter(Boolean).join(', ')}</p>
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              {(editing || rating > 0) && <Stars value={rating} label={S.rate} onChange={editing ? v => set({ rating: String(v) }) : undefined} dark={dark} size={20} />}
              <Heart on={loved} label={S.loved} onToggle={editing ? () => set({ loved: loved ? '' : '1' }) : undefined} />
            </div>
            {!editing && statusLabel && <span className={`mt-1 inline-flex h-7 items-center px-2.5 rounded-full text-[12px] font-bold ${dark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>{statusLabel}</span>}
          </div>
        </div>
      )}
      {title && kind === 'music' && data.preview && <Preview src={data.preview} S={S} dark={dark} />}
      {title && editing && (
        <div className="flex flex-wrap gap-1.5">
          {statuses.map(([k, l]) => <button key={k} type="button" onClick={() => set({ status: data.status === k ? '' : k })} className={`h-8 px-3 rounded-full text-[12px] font-bold ${data.status === k ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>{l}</button>)}
        </div>
      )}
      {title && (editing
        ? <input value={data.review ?? ''} onChange={e => set({ review: e.target.value.slice(0, 160) })} placeholder={S.reviewPh} aria-label={S.reviewPh} className="w-full h-10 rounded-xl bg-white px-3 text-[14px] text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9bbecb]" />
        : data.review && <p className={`font-serif italic text-[15px] leading-snug ${ink} [text-wrap:pretty]`}>“{data.review}”</p>)}
    </div>
  );
};

export default MediaBlock;
