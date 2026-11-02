// Skip the blank page, after Rollup: pick photos of the two of you and Belluh reads when and where each was taken,
// on this device, then offers your places, trips and firsts to keep. No photo is uploaded; thumbnails are drawn from
// the files in memory and forgotten when this closes. Only what is ticked is saved, as a caption, a day and a place
// rounded to about 100 m. Loaded only when opened (the EXIF reader comes with it).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n, useUi } from '../i18n';
import ui from '../i18n/ui/photoStory';
import { Emoji } from '../lib/emoji3d';
import { countryOf } from '../lib/world';
import { countryName } from '../lib/countryCodes';
import { buildStory, suggest, rowsFor, type Shot, type Story, type Suggestion, type EntryRow, type OccasionRow, type DayPart } from '../lib/photoStory';

export interface PhotoStoryPlan { entries: EntryRow[]; occasions: OccasionRow[] }
interface Props {
  userId: string;
  circleId: string;
  partnerName?: string;
  onClose: () => void;
  /** Saves the rows; resolves to how many were saved (0 when it failed). */
  onSave: (plan: PhotoStoryPlan) => Promise<number>;
  onOpenMap?: () => void;
}

const isImage = (f: File) => f.type.startsWith('image/') || /\.(jpe?g|heic|heif|png|webp|tiff?)$/i.test(f.name);
const okDate = (d: unknown): d is Date => d instanceof Date && !isNaN(+d) && d.getFullYear() > 1990 && +d < Date.now() + 86_400_000;

async function readShot(file: File, id: string, parse: (f: File, o: any) => Promise<any>): Promise<Shot> {
  try {
    const x = await parse(file, { tiff: true, exif: true, gps: true, ifd1: false, xmp: false, icc: false, iptc: false, jfif: false, ihdr: false, pick: ['DateTimeOriginal', 'CreateDate', 'GPSLatitude', 'GPSLongitude', 'GPSLatitudeRef', 'GPSLongitudeRef'] });
    const when = okDate(x?.DateTimeOriginal) ? x.DateTimeOriginal : okDate(x?.CreateDate) ? x.CreateDate : null;
    const lat = typeof x?.latitude === 'number' ? x.latitude : null, lng = typeof x?.longitude === 'number' ? x.longitude : null;
    return { id, t: when ? +when : null, lat, lng };
  } catch { return { id, t: null, lat: null, lng: null }; }
}

const EMOJI_PART: Record<DayPart, string> = { morning: '🌅', afternoon: '☀️', evening: '🍷', night: '🌙' };

const PhotoStory: React.FC<Props> = ({ userId, circleId, partnerName, onClose, onSave, onOpenMap }) => {
  const T = useUi(ui);
  const { f, date, num, lang } = useI18n();
  const [stage, setStage] = useState<'pick' | 'reading' | 'review' | 'empty' | 'saved'>('pick');
  const [progress, setProgress] = useState({ n: 0, total: 0 });
  const [story, setStory] = useState<Story | null>(null);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [shared, setShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedN, setSavedN] = useState(0);
  const [failed, setFailed] = useState(false);
  const files = useRef(new Map<string, File>());
  const urls = useRef(new Map<string, string>());
  const input = useRef<HTMLInputElement>(null);
  const partner = (partnerName || '').trim().split(' ')[0];

  // Thumbnails live only in this browser tab, and go when it closes
  useEffect(() => () => { urls.current.forEach(u => URL.revokeObjectURL(u)); urls.current.clear(); files.current.clear(); }, []);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose, saving]);
  const thumb = (id: string | undefined) => {
    if (!id) return null;
    const have = urls.current.get(id); if (have) return have;
    const file = files.current.get(id); if (!file) return null;
    const u = URL.createObjectURL(file); urls.current.set(id, u); return u;
  };

  const pick = async (list: FileList | null) => {
    const chosen = [...(list ?? [])].filter(isImage);
    if (!chosen.length) return;
    urls.current.forEach(u => URL.revokeObjectURL(u)); urls.current.clear(); files.current.clear();
    setStage('reading'); setProgress({ n: 0, total: chosen.length }); setFailed(false);
    const { parse } = await import('exifr');
    const shots: Shot[] = new Array(chosen.length);
    let next = 0, done = 0;
    // A few at a time: the reader only looks at the first bytes of each file, so even a thousand photos take seconds
    const worker = async () => {
      while (next < chosen.length) {
        const i = next++, id = `f${i}`;
        files.current.set(id, chosen[i]);
        shots[i] = await readShot(chosen[i], id, parse as any);
        done++;
        if (done % 8 === 0 || done === chosen.length) setProgress({ n: done, total: chosen.length });
      }
    };
    await Promise.all(Array.from({ length: Math.min(6, chosen.length) }, worker));
    const s = buildStory(shots, { countryOf });
    const sug = suggest(s);
    setStory(s); setItems(sug); setCaptions({});
    setStage(sug.length ? 'review' : 'empty');
  };

  const where = (country: string | null) => country ? countryName(country, lang) : T.somewhere;
  const defaultCaption = (s: Suggestion): string => {
    if (s.kind === 'trip') return s.trip.days === 1 ? f(T.tripCaption1, { place: where(s.trip.country) }) : f(T.tripCaption, { place: where(s.trip.country), n: num(s.trip.days) });
    if (s.kind === 'pin') return f(T.pinCaption, { place: where(s.place.country), n: num(s.place.visits) });
    if (s.kind === 'together') return T.togetherLabel;
    return f(T.firstTripLabel, { place: where(s.trip.country) });
  };
  const caption = (s: Suggestion) => captions[s.id] ?? defaultCaption(s);
  const toggle = (id: string) => setItems(list => list.map(x => x.id === id ? { ...x, on: !x.on } : x));
  const ticked = items.filter(x => x.on).length;

  const save = async () => {
    if (!ticked || saving) return;
    setSaving(true); setFailed(false);
    const plan = rowsFor(items, { userId, circleId, shared, caption, label: caption });
    const n = await onSave(plan).catch(() => 0);
    setSaving(false);
    if (!n) { setFailed(true); return; }
    setSavedN(n); setStage('saved');
    // The photos aren't needed any more
    urls.current.forEach(u => URL.revokeObjectURL(u)); urls.current.clear(); files.current.clear();
  };

  const monthYear = (t: number) => date(new Date(t), { month: 'short', year: 'numeric' });
  const fullDay = (t: number) => date(new Date(t), { year: 'numeric', month: 'long', day: 'numeric' });
  const range = (a: number, b: number) => {
    const x = new Date(a), y = new Date(b);
    return x.toDateString() === y.toDateString() ? fullDay(a) : `${date(x, { month: 'short', day: 'numeric' })} ${'–'} ${date(y, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const timeline = useMemo(() => story ? story.trips.slice().sort((a, b) => a.start - b.start) : [], [story]);
  const groups: { key: string; title: string; emoji: string; list: Suggestion[] }[] = [
    { key: 'trip', title: T.forJournal, emoji: '✈️', list: items.filter(x => x.kind === 'trip') },
    { key: 'pin', title: T.forMap, emoji: '📍', list: items.filter(x => x.kind === 'pin') },
    { key: 'dates', title: T.forBella, emoji: '💞', list: items.filter(x => x.kind === 'together' || x.kind === 'firstTrip') },
  ].filter(g => g.list.length);

  // Plain functions, not components: a component made inside render would remount on every keystroke in a caption
  const check = (on: boolean, id: string, label: string) => (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={() => toggle(id)}
      className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[15px] font-black transition-colors ${on ? 'bg-[#9bbecb] text-white' : 'bg-white border-2 border-slate-200 text-transparent'}`}>✓&#xFE0E;</button>
  );

  const row = (s: Suggestion) => {
    const pic = s.kind === 'trip' ? thumb(s.trip.shots[0]) : s.kind === 'pin' ? thumb(s.place.shots[0]) : null;
    const when = s.kind === 'trip' ? range(s.trip.start, s.trip.end) : s.kind === 'pin' ? (s.place.first != null ? f(T.since, { date: monthYear(s.place.first) }) : '') : fullDay(s.kind === 'together' ? s.t : s.trip.start);
    const question = s.kind === 'together' ? T.togetherQ : s.kind === 'firstTrip' ? T.firstTripQ : null;
    return (
      <li key={s.id} className={`min-h-[68px] rounded-2xl px-3 py-2.5 flex items-center gap-3 transition-colors ${s.on ? 'bg-[#eef5f7]' : 'bg-slate-50'}`}>
        {check(s.on, s.id, caption(s))}
        {pic ? <img src={pic} alt="" className="shrink-0 w-12 h-12 rounded-xl object-cover" /> : <span className="shrink-0 w-12 h-12 flex items-center justify-center"><Emoji e={s.kind === 'pin' ? '📍' : s.kind === 'trip' ? '✈️' : s.kind === 'together' ? '💞' : '🗺️'} size={34} /></span>}
        <div className="min-w-0 flex-1">
          {question ? <p className="text-[15px] font-bold text-slate-900 leading-snug">{question}</p>
            : <input value={caption(s)} onChange={e => setCaptions(c => ({ ...c, [s.id]: e.target.value }))} maxLength={120} aria-label={T.captionLabel}
                className="w-full bg-transparent text-[15px] font-bold text-slate-900 leading-snug rounded-md focus:outline-none focus:bg-white truncate" />}
          <p className="text-[13px] text-slate-500 leading-snug truncate">{when}</p>
        </div>
      </li>
    );
  };

  const r = story?.rhythm;
  const facts: { e: string; label: string; value: string }[] = [];
  if (r?.first != null) facts.push({ e: '✨', label: T.firstPhoto, value: fullDay(r.first) });
  if (r?.topMonths[0]) facts.push({ e: '🗓️', label: T.busiest, value: date(new Date(r.topMonths[0].year, r.topMonths[0].month - 1, 1), { month: 'long', year: 'numeric' }) });
  if (r?.favorite) facts.push({ e: EMOJI_PART[r.favorite.part], label: T.favorite, value: T.times[r.favorite.weekend ? 'weekend' : 'weekday'][r.favorite.part] });
  if (r?.recurring[0]) facts.push({ e: '🔄', label: where(r.recurring[0].country), value: f(T.sameSpot, { n: num(r.recurring[0].visits) }) });

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/40 flex items-end md:items-center justify-center md:p-6 animate-fade-in" role="dialog" aria-modal="true" aria-label={T.title}>
      <div className="relative w-full md:max-w-[680px] h-[100svh] md:h-auto md:max-h-[90vh] bg-white md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
        <div className="shrink-0 h-16 px-4 md:px-6 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-[#5e9db3] inline-flex items-center gap-2"><Emoji e="🔒" size={16} />{T.privateShort}</span>
          <button type="button" onClick={onClose} disabled={saving} aria-label={T.close} className="w-11 h-11 -mr-2 flex items-center justify-center text-slate-400 hover:text-slate-900 text-2xl leading-none">×</button>
        </div>
        <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={e => { pick(e.target.files); e.target.value = ''; }} data-testid="photo-input" />

        {stage === 'pick' && (
          <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 pt-4 flex flex-col items-center text-center">
            <Emoji e="📸" size={88} style={{ transform: 'rotate(-6deg)' }} />
            <h2 className="mt-6 font-serif text-[1.9rem] md:text-[2.2rem] leading-tight text-slate-900">{T.title}</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-600">{T.sub}</p>
            <p className="mt-6 max-w-md rounded-2xl bg-[#eef5f7] px-4 py-3 text-[14px] leading-snug text-slate-700 flex items-center gap-3 text-left"><Emoji e="🔒" size={22} className="shrink-0" />{T.private}</p>
            <button type="button" onClick={() => input.current?.click()} className="mt-8 w-full max-w-sm h-14 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-[15px] inline-flex items-center justify-center gap-2"><Emoji e="📸" size={20} />{T.choose}</button>
            <button type="button" onClick={onClose} className="mt-3 h-11 px-5 text-sm font-bold text-slate-500 hover:text-slate-900">{T.notNow}</button>
          </div>
        )}

        {stage === 'reading' && (
          <div className="flex-1 px-6 md:px-10 pb-16 flex flex-col items-center justify-center text-center">
            <Emoji e="📸" size={64} className="animate-pulse-slow" />
            <p className="mt-6 font-serif text-xl text-slate-900">{f(T.reading, { n: num(progress.n), total: num(progress.total) })}</p>
            <div className="mt-5 w-full max-w-xs h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.n}>
              <div className="h-full rounded-full bg-[#9bbecb] transition-[width] duration-300" style={{ width: `${progress.total ? (progress.n / progress.total) * 100 : 0}%` }} />
            </div>
            <p className="mt-4 text-[13px] text-slate-500">{T.readingNote}</p>
          </div>
        )}

        {stage === 'empty' && (
          <div className="flex-1 px-6 md:px-10 pb-16 flex flex-col items-center justify-center text-center">
            <Emoji e="🗺️" size={64} />
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-slate-600">{T.nothing}</p>
            <button type="button" onClick={() => input.current?.click()} className="mt-6 h-12 px-6 rounded-full bg-slate-900 text-white font-bold text-sm">{T.again}</button>
          </div>
        )}

        {stage === 'review' && story && r && (
          <>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-6 pb-6" data-testid="photo-review">
              <h2 className="font-serif text-[1.7rem] md:text-[2rem] leading-tight text-slate-900">{T.storyTitle}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-slate-500">
                <span><b className="text-slate-900">{num(r.total)}</b> {r.total === 1 ? T.photo : T.photos}</span>
                <span><b className="text-slate-900">{num(story.places.length)}</b> {story.places.length === 1 ? T.place : T.places}</span>
                <span><b className="text-slate-900">{num(story.trips.length)}</b> {story.trips.length === 1 ? T.trip : T.trips}</span>
              </div>
              {r.total - r.located > 0 && <p className="mt-1 text-[13px] text-slate-400">{r.total - r.located === 1 ? T.noPlace1 : f(T.noPlace, { n: num(r.total - r.located) })}</p>}

              {/* Your trips in a row, oldest first, like Rollup's timeline */}
              {timeline.length > 0 && (
                <div className="mt-5 -mx-4 md:-mx-6 px-4 md:px-6 flex gap-3 overflow-x-auto pb-2 snap-x scroll-px-4 md:scroll-px-6" aria-label={T.forJournal}>
                  {timeline.map(t => {
                    const pic = thumb(t.shots[0]);
                    return (
                      <div key={t.id} className="snap-start shrink-0 w-[148px]">
                        <p className="h-5 text-[12px] font-semibold text-slate-400 leading-5">{monthYear(t.start)}</p>
                        <div className="mt-1 w-[148px] h-[110px] rounded-2xl bg-[#fde9e1] overflow-hidden flex items-center justify-center">
                          {pic ? <img src={pic} alt="" className="w-full h-full object-cover" /> : <Emoji e="✈️" size={40} />}
                        </div>
                        <p className="mt-1.5 text-[14px] font-bold text-slate-900 leading-snug truncate">{t.days === 1 ? f(T.tripCaption1, { place: where(t.country) }) : f(T.tripCaption, { place: where(t.country), n: num(t.days) })}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {facts.length > 0 && (
                <ul className="mt-5 grid grid-cols-2 gap-2">
                  {facts.map(x => (
                    <li key={x.label + x.value} className="min-h-[76px] rounded-2xl bg-[#fdf1ec] px-3 py-3 flex items-center gap-3">
                      <Emoji e={x.e} size={30} className="shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-[12px] font-semibold text-slate-500 leading-snug">{x.label}</span>
                        <span className="block text-[14px] font-bold text-slate-900 leading-snug">{x.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {groups.map(g => (
                <section key={g.key} className="mt-7">
                  <h3 className="h-7 flex items-center gap-2 text-[16px] font-bold text-slate-900"><Emoji e={g.emoji} size={20} />{g.title}</h3>
                  {g.key === 'dates' && <p className="text-[13px] text-slate-500">{T.yearly}</p>}
                  <ul className="mt-2.5 space-y-2">{g.list.map(row)}</ul>
                </section>
              ))}
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white px-4 md:px-6 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              {failed && <p className="mb-2 text-[13px] text-rose-600">{T.failed}</p>}
              <div className="flex items-center gap-2">
                <div role="radiogroup" aria-label={T.whoSees} className="h-12 p-1 rounded-full bg-slate-100 grid grid-cols-2 flex-1 min-w-0 text-[13px] font-bold">
                  {[false, true].map(v => (
                    <button key={String(v)} type="button" role="radio" aria-checked={shared === v} onClick={() => setShared(v)}
                      className={`h-10 px-2 rounded-full truncate ${shared === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                      {v ? (partner ? f(T.bothNamed, { name: partner }) : T.both) : T.justMe}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={save} disabled={!ticked || saving} className="shrink-0 h-12 px-5 rounded-full bg-slate-900 hover:bg-black text-white text-[14px] font-bold disabled:opacity-40">
                  {saving ? T.saving : ticked === 1 ? T.save1 : f(T.save, { n: num(ticked) })}
                </button>
              </div>
            </div>
          </>
        )}

        {stage === 'saved' && (
          <div className="flex-1 px-6 md:px-10 pb-16 flex flex-col items-center justify-center text-center">
            <Emoji e="✅" size={64} />
            <h2 className="mt-6 font-serif text-2xl text-slate-900">{T.saved}</h2>
            <p className="mt-2 text-[15px] text-slate-600">{f(T.savedSub, { n: num(savedN) })}</p>
            <div className="mt-8 flex items-center gap-2">
              {onOpenMap && <button type="button" onClick={() => { onOpenMap(); onClose(); }} className="h-12 px-6 rounded-full bg-slate-900 text-white font-bold text-sm inline-flex items-center gap-2"><Emoji e="🗺️" size={18} />{T.openMap}</button>}
              <button type="button" onClick={onClose} className="h-12 px-6 rounded-full bg-slate-100 text-slate-800 font-bold text-sm">{T.done}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoStory;
