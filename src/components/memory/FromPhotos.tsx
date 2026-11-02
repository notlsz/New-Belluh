// "From your photos": the gaps between your dates (after Rollup's gaps between visits: the last date, the small
// moments since, then the next date) and your screenshots as plans (after "Every screenshot is a plan"). Both are read
// on this device. Nothing is sent until the person says yes: the next date sends the short gaps summary, a screenshot
// sends only the words read from it, never the image, and both only with AI answers from photos allowed.
import React, { useState } from 'react';
import { useI18n, useUi } from '../../i18n';
import strings from '../../i18n/ui/fromPhotos';
import type { MemoryEngine } from '../../lib/memory/types';
import type { Gaps, GapMoment } from '../../lib/memory/gaps';
import { SHOT_EMOJI, type ShotPlan } from '../../lib/memory/screenshots';
import { aiAllowed } from '../../lib/memory/consent';
import { Emoji } from '../../lib/emoji3d';
import MemoryConsent from './MemoryConsent';
import { Sheet, Thumb, btnDark, btnSoft, card, fillT } from './bits';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** One row of the timeline: the date, then a picture or an emoji, then the words. Every row lines up on the same columns. */
const Row: React.FC<{ when: string; pic: React.ReactNode; children: React.ReactNode }> = ({ when, pic, children }) => (
  <div className="flex items-center gap-3 min-h-[56px]">
    <span className="w-14 shrink-0 text-[13px] font-bold text-slate-400 tabular-nums">{when}</span>
    <span className="w-11 h-11 shrink-0 flex items-center justify-center">{pic}</span>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

export const GapsTimeline: React.FC<{ gaps: Gaps; engine: MemoryEngine | null; onNextDate?: () => void; busy?: boolean }> = ({ gaps, engine, onNextDate, busy }) => {
  const T = useUi(strings).gaps;
  const { date } = useI18n();
  const short = (d: string) => date(new Date(`${d}T12:00:00`), { month: 'short', day: 'numeric' });
  const caption = (m: GapMoment) => m.kind === 'trip' && m.days > 1 ? fillT(T.tripDays, { place: m.name, n: m.days }) : cap(m.name);
  return (
    <div>
      <Row when={short(gaps.since)} pic={<Emoji e="💞" size={28} />}>
        <p className="text-xs font-bold text-[#3f7486]">{gaps.noDate ? fillT(T.start, { n: 30 }) : T.lastDate}</p>
        <p className="text-[15px] font-semibold text-slate-900 truncate">{gaps.noDate ? T.noDateTitle : gaps.lastTitle || T.lastDate}</p>
      </Row>
      {gaps.moments.map(m => (
        <Row key={`${m.day}-${m.name}`} when={short(m.day)} pic={<Thumb engine={engine} id={m.id} className="w-11 h-11 rounded-xl" />}>
          <p className="text-[15px] text-slate-800 leading-snug truncate">{caption(m)}</p>
        </Row>
      ))}
      {gaps.newInterests.length > 0 && (
        <Row when="" pic={<Emoji e="🌱" size={26} />}>
          <p className="text-[15px] text-slate-800 leading-snug">{fillT(T.newLately, { list: gaps.newInterests.map(cap).join(', ') })}</p>
        </Row>
      )}
      <Row when="" pic={<Emoji e="✨" size={28} />}>
        <p className="text-xs font-bold text-[#b0457f]">{T.nextDate}</p>
        <p className="text-[15px] font-semibold text-slate-900 leading-snug">{T.nextBody}</p>
      </Row>
      {onNextDate && (
        <button type="button" disabled={busy} onClick={onNextDate} className={`${btnDark} mt-3 w-full sm:w-auto`}>
          <Emoji e="💌" size={18} />{T.plan}
        </button>
      )}
    </div>
  );
};

export const ShotCards: React.FC<{ shots: ShotPlan[]; engine: MemoryEngine | null; onPick: (s: ShotPlan) => void; busy?: boolean; bleed?: string }> = ({ shots, engine, onPick, busy, bleed = '-mx-5 px-5 scroll-px-5 sm:-mx-6 sm:px-6 sm:scroll-px-6' }) => {
  const T = useUi(strings).shots;
  const label = { dine: T.dine, buy: T.buy, attend: T.attend, trip: T.trip };
  const action = { dine: T.actionDine, buy: T.actionBuy, attend: T.actionAttend, trip: T.actionTrip };
  return (
    <div className={`flex gap-3 overflow-x-auto no-scrollbar snap-x ${bleed} pb-2`}>
      {shots.map(s => (
        <div key={s.id} className="snap-start shrink-0 w-[216px] h-[296px] flex flex-col rounded-[1.5rem] bg-[#f4f8fa] p-3">
          <Thumb engine={engine} id={s.id} className="w-full h-28 rounded-2xl" />
          <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#3f7486] leading-none"><Emoji e={SHOT_EMOJI[s.intent]} size={16} />{label[s.intent]}</p>
          <p className="mt-1.5 font-serif text-[17px] leading-snug text-slate-900 line-clamp-2">{s.subject}</p>
          <p className="mt-1 text-sm text-slate-500 leading-snug line-clamp-2">{action[s.intent]}</p>
          <button type="button" disabled={busy} onClick={() => onPick(s)} className="mt-auto h-10 w-full rounded-full bg-white text-sm font-semibold text-slate-900 hover:bg-[#e3eef2] disabled:opacity-40 transition-colors">{T.plan}</button>
        </div>
      ))}
    </div>
  );
};

/** The person's yes for one screenshot: exactly the words that would go to Bella, and never the image */
export const ShotConsent: React.FC<{ shot: ShotPlan; engine: MemoryEngine | null; onYes: () => void; onClose: () => void }> = ({ shot, engine, onYes, onClose }) => {
  const T = useUi(strings);
  return (
    <Sheet title={T.consent.title} onClose={onClose} closeLabel={T.close}
      footer={<div className="flex items-center gap-3">
        <button type="button" onClick={onClose} className={`flex-1 ${btnSoft}`}>{T.consent.no}</button>
        <button type="button" onClick={onYes} className={`flex-1 ${btnDark}`}>{T.consent.yes}</button>
      </div>}>
      <div className="flex items-center gap-3 pt-2">
        <Thumb engine={engine} id={shot.id} className="w-14 h-14 rounded-xl" />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#3f7486] leading-none"><Emoji e={SHOT_EMOJI[shot.intent]} size={16} />{T.shots[shot.intent]}</p>
          <p className="mt-1 font-serif text-lg text-slate-900 leading-snug truncate">{shot.subject}</p>
        </div>
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm text-slate-600 leading-relaxed"><Emoji e="🔒" size={16} className="shrink-0" />{T.consent.body}</p>
      <p className="mt-3 max-h-48 overflow-y-auto rounded-2xl bg-[#f4f8fa] p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{shot.text}</p>
    </Sheet>
  );
};

/**
 * Both sections, with the asking built in: AI answers from photos first (once), then this screenshot's own yes.
 * onNextDate gets the gaps summary to send; onPlanShot gets the screenshot to send.
 */
export const FromPhotosPanel: React.FC<{
  gaps: Gaps | null; shots: ShotPlan[]; engine: MemoryEngine | null;
  onNextDate?: (summary: string) => void; onPlanShot: (s: ShotPlan) => void; busy?: boolean; framed?: boolean; local?: boolean;
}> = ({ gaps, shots, engine, onNextDate, onPlanShot, busy, framed = true, local = true }) => {
  const T = useUi(strings);
  const [consentFor, setConsentFor] = useState<(() => void) | null>(null);
  const [shot, setShot] = useState<ShotPlan | null>(null);
  const withAi = (fn: () => void) => { if (aiAllowed()) fn(); else setConsentFor(() => fn); };
  const box = framed ? `${card} p-5 sm:p-6` : '';
  return (
    <div className="flex flex-col gap-4">
      <section className={box} aria-label={T.gaps.title}>
        <h3 className="flex items-center gap-2 font-serif text-lg text-slate-900"><Emoji e="🗓️" size={22} />{T.gaps.title}</h3>
        <div className="mt-2">
          {gaps ? <GapsTimeline gaps={gaps} engine={engine} busy={busy} onNextDate={onNextDate ? () => withAi(() => onNextDate(gaps.summary)) : undefined} />
            : <p className="text-[15px] text-slate-400 leading-relaxed">{T.gaps.none}</p>}
        </div>
      </section>
      <section className={box} aria-label={T.shots.title}>
        <h3 className="flex items-center gap-2 font-serif text-lg text-slate-900"><Emoji e="📸" size={22} />{T.shots.title}</h3>
        <p className="text-sm text-slate-500 mt-1 mb-3">{T.shots.sub}</p>
        {shots.length ? <ShotCards shots={shots} engine={engine} busy={busy} bleed={framed ? undefined : '-mx-6 px-6 scroll-px-6'} onPick={s => withAi(() => setShot(s))} />
          : <p className="text-[15px] text-slate-400 leading-relaxed">{T.shots.none}</p>}
      </section>
      {local && <p className="flex items-center gap-2 text-sm text-slate-500 px-2"><Emoji e="🔒" size={14} className="shrink-0" />{T.local}</p>}
      {consentFor && <MemoryConsent onClose={() => setConsentFor(null)} onAllow={() => { const f = consentFor; setConsentFor(null); f(); }} />}
      {shot && <ShotConsent shot={shot} engine={engine} onClose={() => setShot(null)} onYes={() => { const s = shot; setShot(null); onPlanShot(s); }} />}
    </div>
  );
};

/** The photos behind one of Bella's answers, from this device's index */
export const CitedPhotos: React.FC<{ ids: string[]; engine: MemoryEngine | null }> = ({ ids, engine }) => {
  const T = useUi(strings);
  if (!ids.length || !engine) return null;
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        {ids.slice(0, 4).map(id => <Thumb key={id} engine={engine} id={id} className="w-16 h-16 rounded-2xl" />)}
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400"><Emoji e="📷" size={13} />{T.cites}</p>
    </div>
  );
};
