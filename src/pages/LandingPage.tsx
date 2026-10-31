

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Lock, Menu, X, ChevronDown, Heart, MessageCircle, CalendarCheck, Plus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Receipt } from './About';
import { rememberCta } from '../services/analytics';
import { supabaseUrl } from '../lib/supabaseClient';
import BelluhOrb from '../components/BelluhOrb';
import BellaAtWork from '../components/BellaAtWork';
import BelluhSpeech from '../components/BelluhSpeech';
import SiteFooter from '../components/SiteFooter';
import SiteNav from '../components/SiteNav';
import DragonflyMark from '../components/DragonflyMark';
import { belluh } from '../lib/belluhPresence';
import { useI18n, useUi } from '../i18n';
import science from '../i18n/ui/science';


// Priced from what a couple costs to run, not from what the market will bear: AI for both partners, texting, the odd
// restaurant call and hosting come to roughly $1.80 a month for an active couple and $3.60 for a heavy one. $7.77
// covers the heavy couple with about 80% left over after payment fees, and an average couple at well over that.
/**
 * Give a couple a year of Duo. The gift is a paper envelope, lined in the occasion's colour, with the card standing half
 * out of it and filling in as you type. Giving slides the card in, closes the flap and addresses the front. Set
 * VITE_GIFT_CHECKOUT_URL to a checkout and the button pays; until then the gift comes to us by email.
 */
const OCCASION_INK = [
  { ink: '#4a7aa3', stripe: '#5b8cb5' }, { ink: '#a8693f', stripe: '#bb7b50' }, { ink: '#b4547f', stripe: '#c96894' },
  { ink: '#3f7486', stripe: '#4f8aa0' }, { ink: '#5f7d66', stripe: '#6f9077' }, { ink: '#6b4a82', stripe: '#7d5a96' },
];
type Occasion = { label: string; note: string; ink: string; stripe: string };
const GIFT_CHECKOUT = (import.meta as any).env?.VITE_GIFT_CHECKOUT_URL as string | undefined;
const PAPER = '#fbf8f3';

function GiftEnvelope({ tone, names, note, from, opens, given, mailed = false }: { tone: Occasion; names: string; note: string; from: string; opens: string | null; given: boolean; mailed?: boolean }) {
  const { d, f } = useI18n();
  const g = d.gift;
  const liner = `repeating-linear-gradient(135deg, ${tone.ink} 0 10px, ${tone.stripe} 10px 20px)`;
  const ease = 'cubic-bezier(.65,0,.35,1)';
  return (
    <div className="relative mx-auto w-full max-w-[460px] aspect-[460/610] sm:aspect-[460/540]" aria-label={g.preview}>
      {/* Flap: open and lined behind the card, then it folds down over the front once the card is in */}
      <div className="absolute inset-x-0 origin-bottom" style={{ top: '22%', height: '26.2%', zIndex: 5, clipPath: 'polygon(0 100%, 50% 0, 100% 100%)', background: liner, transform: given ? 'scaleY(0)' : 'scaleY(1)', transition: `transform 380ms ease-in ${given ? '800ms' : '0ms'}, background 700ms` }} />
      <div className="absolute inset-x-0 origin-top" style={{ top: '47.8%', height: '26%', zIndex: 30, filter: 'drop-shadow(0 6px 8px rgba(15,23,42,0.10))', transform: given ? 'scaleY(1)' : 'scaleY(0)', transition: `transform 420ms ease-out ${given ? '1180ms' : '0ms'}` }}>
        <div className="absolute inset-0" style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)', background: 'linear-gradient(180deg, #f3ede3, #f8f4ec)' }} />
      </div>
      {/* Back of the envelope, lined */}
      <div className="absolute inset-x-0 bottom-0 rounded-b-md" style={{ top: '48%', background: liner, transition: 'background 700ms', zIndex: 6 }} />
      {/* The card */}
      <div className="absolute rounded-md bg-[#fffdf9] px-7 pt-7 text-center" style={{ left: '7%', right: '7%', top: '4%', height: '50%', zIndex: 10, boxShadow: '0 1px 0 rgba(0,0,0,0.03), 0 18px 40px -24px rgba(15,23,42,0.35), inset 0 0 0 1px #eee7dc', transform: given ? 'translateY(88%)' : 'translateY(0)', transition: `transform 900ms ${ease}` }}>
        <div className="flex justify-center"><DragonflyMark size={24} rippleOnMount={false} /></div>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.3em] transition-colors duration-700" style={{ color: tone.ink }}>{g.yearFor}</p>
        <p className={`mt-2 font-serif text-[1.7rem] md:text-[2.1rem] leading-[1.1] tracking-tight break-words ${names ? 'text-slate-900' : 'text-slate-300'}`}>{names || `${d.common.me} & ${d.common.partner}`}</p>
        <p className="mt-3 font-serif italic text-[15px] md:text-base leading-relaxed text-slate-500 line-clamp-2">{note}</p>
        <p className="mt-2 font-serif text-sm text-slate-400">— {from || g.you}</p>
      </div>
      {/* A postage stamp, top right of the front, when it's going by mail */}
      <div aria-hidden="true" className="absolute w-[12%] aspect-[4/5] bg-white p-[4px] transition-all duration-500" style={{ right: '6%', top: '52%', zIndex: 35, opacity: mailed ? 1 : 0, transform: mailed ? 'rotate(4deg) scale(1)' : 'rotate(14deg) scale(0.6)', boxShadow: '0 2px 6px rgba(15,23,42,0.14), inset 0 0 0 1px rgba(15,23,42,0.06)', outline: '2px dotted #fff', outlineOffset: '-1px' }}>
        <div className="h-full w-full flex items-center justify-center transition-colors duration-700" style={{ background: tone.ink }}><img src="/dragonfly.png?v=1" alt="" className="w-[62%] brightness-0 invert opacity-90" /></div>
      </div>
      {/* Front pocket, with the side folds meeting in a V */}
      <div className="absolute inset-x-0 bottom-0" style={{ top: '48%', zIndex: 20, filter: 'drop-shadow(0 -1px 0 rgba(15,23,42,0.06)) drop-shadow(0 30px 40px rgba(15,23,42,0.12))' }}>
        <div className="absolute inset-0 rounded-b-md" style={{ clipPath: 'polygon(0 0, 50% 46%, 100% 0, 100% 100%, 0 100%)', background: `linear-gradient(180deg, ${PAPER}, #f4efe6)` }} />
        <div className="absolute inset-0" style={{ clipPath: 'polygon(0 0, 50% 46%, 0 100%)', background: 'linear-gradient(90deg, rgba(15,23,42,0.035), transparent)' }} />
        <div className="absolute inset-0" style={{ clipPath: 'polygon(100% 0, 50% 46%, 100% 100%)', background: 'linear-gradient(270deg, rgba(15,23,42,0.035), transparent)' }} />
        <div className="absolute inset-x-0 bottom-[14%] text-center px-8 transition-opacity duration-700" style={{ opacity: given ? 1 : 0, transitionDelay: given ? '1600ms' : '0ms' }}>
          <p className="font-serif italic text-2xl md:text-[1.75rem] text-slate-800 break-words">{names}</p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: tone.ink }}>{opens ? f(g.toBeOpened, { day: opens }) : g.withLove}</p>
        </div>
      </div>
    </div>
  );
}

type Delivery = 'email' | 'them' | 'me';
const MAIL_DAYS = 7; // a card in the mail needs about a week
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;


/** A small month calendar: days before `min` are out, the chosen day takes the occasion's colour. */
function GiftCalendar({ min, value, ink, onPick }: { min: Date; value: string; ink: string; onPick: (k: string) => void }) {
  const { d, date, tag } = useI18n();
  // Weeks start on the day they do there: Sunday in the US, Japan and Brazil, Monday in most of Europe
  const weekStart = (() => { try { const w = (new (Intl as any).Locale(tag) as any).weekInfo ?? (new (Intl as any).Locale(tag) as any).getWeekInfo?.(); if (w?.firstDay) return w.firstDay % 7; } catch { /* older browsers */ } return /-(US|CA|JP|BR|IL)$/.test(tag) ? 0 : 1; })();
  const letters = Array.from({ length: 7 }, (_, i) => date(new Date(2024, 0, 7 + weekStart + i), { weekday: 'narrow' }));
  const [view, setView] = React.useState(() => { const d = value ? new Date(`${value}T12:00:00`) : min; return new Date(d.getFullYear(), d.getMonth(), 1); });
  const first = (view.getDay() - weekStart + 7) % 7;
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const minKey = dayKey(min);
  const canBack = view > new Date(min.getFullYear(), min.getMonth(), 1);
  return (
    <div className="mt-3 w-full max-w-[300px] rounded-3xl bg-white border border-slate-100 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => canBack && setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} disabled={!canBack} aria-label={d.gift.prevMonth} className="h-8 w-8 inline-flex items-center justify-center text-slate-500 disabled:opacity-20 hover:text-slate-900"><ChevronLeft size={18} /></button>
        <p className="text-sm font-semibold text-slate-900">{date(view, { month: 'long', year: 'numeric' })}</p>
        <button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} aria-label={d.gift.nextMonth} className="h-8 w-8 inline-flex items-center justify-center text-slate-500 hover:text-slate-900"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 mb-1">{letters.map((l, i) => <span key={i} className="h-7 leading-7">{l}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: first }, (_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const k = dayKey(new Date(view.getFullYear(), view.getMonth(), i + 1));
          const off = k < minKey, on = k === value;
          return (
            <button key={k} disabled={off} onClick={() => onPick(k)}
              className={`h-9 rounded-xl text-sm transition-colors ${on ? 'text-white font-semibold' : off ? 'text-slate-200' : 'text-slate-700 hover:bg-slate-100'}`}
              style={on ? { background: ink } : undefined}>{i + 1}</button>
          );
        })}
      </div>
    </div>
  );
}

const GIFTS_GIVEN = 17945;

/** Counts up to the number of gifts given when it scrolls into view. */
function GiftCount() {
  const { num } = useI18n();
  const ref = React.useRef<HTMLSpanElement>(null);
  const [n, setN] = React.useState(GIFTS_GIVEN);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch { /* fine */ }
    setN(Math.round(GIFTS_GIVEN * 0.9));
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now(), from = Math.round(GIFTS_GIVEN * 0.9);
      const tick = (t: number) => { const k = Math.min(1, (t - start) / 1600); setN(Math.round(from + (GIFTS_GIVEN - from) * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return <span ref={ref} className="tabular-nums">{num(n)}</span>;
}

function GiftSection() {
  const { d, f, date } = useI18n();
  const g = d.gift;
  const OCCASIONS: Occasion[] = g.occasions.map((o, i) => ({ ...o, ...OCCASION_INK[i % OCCASION_INK.length] }));
  const prettyDay = (k: string) => date(new Date(`${k}T12:00:00`), { weekday: 'long', month: 'long', day: 'numeric' });
  const [step, setStep] = React.useState(0);
  const [one, setOne] = React.useState('');
  const [two, setTwo] = React.useState('');
  const [occasion, setOccasion] = React.useState(0);
  const [note, setNote] = React.useState<string | null>(null);
  const [editingNote, setEditingNote] = React.useState(false);
  const [delivery, setDelivery] = React.useState<Delivery | null>(null);
  const [address, setAddress] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [myEmail, setMyEmail] = React.useState('');
  const [when, setWhen] = React.useState('');
  const [picking, setPicking] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [failed, setFailed] = React.useState('');
  const [given, setGiven] = React.useState(false);
  const scroller = React.useRef<HTMLDivElement>(null);
  const tone = OCCASIONS[occasion];
  const shownNote = (note ?? tone.note).trim() || tone.note;
  const names = [one.trim(), two.trim()].filter(Boolean).join(' & ');
  const mail = delivery === 'them' || delivery === 'me';
  const minDay = new Date(); minDay.setDate(minDay.getDate() + (mail ? MAIL_DAYS : 0));
  const opens = when ? prettyDay(when) : null;
  const okEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  const detailsReady = okEmail(email) && from.trim() && okEmail(myEmail);

  React.useEffect(() => { const el = scroller.current; if (el && step > 0) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }, [step, given, picking, delivery]);

  const go = (n: number) => { setPicking(false); setStep(n); };
  const reset = () => { setGiven(false); setOne(''); setTwo(''); setNote(null); setDelivery(null); setAddress(''); setEmail(''); setWhen(''); setFailed(''); go(0); };

  const give = async () => {
    if (!detailsReady || sending) return;
    setSending(true); setFailed('');
    rememberCta('gift');
    try {
      const r = await fetch(`${supabaseUrl}/functions/v1/belluh-gift`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerOne: one, partnerTwo: two, recipientEmail: email, giverName: from, giverEmail: myEmail, occasion: tone.label, note: shownNote, delivery, address: mail ? address : '', deliverOn: when || null }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.id) throw new Error(j?.error || 'failed');
      if (GIFT_CHECKOUT) window.open(`${GIFT_CHECKOUT}${GIFT_CHECKOUT.includes('?') ? '&' : '?'}client_reference_id=${j.id}&prefilled_email=${encodeURIComponent(myEmail.trim())}`, '_blank', 'noopener');
      setGiven(true);
    } catch (e: any) {
      setFailed(e?.message && e.message !== 'failed' ? e.message : g.failed);
    } finally { setSending(false); }
  };

  const deliveryLabel = delivery === 'email' ? g.email : delivery === 'them' ? g.mailThem : g.mailMeLong;
  const turns: { b: string; you?: string; at: number }[] = [
    { b: g.who, you: step > 0 ? names : undefined, at: 0 },
    { b: g.what, you: step > 1 ? tone.label : undefined, at: 1 },
    { b: g.how, you: step > 2 ? (mail ? `${deliveryLabel}: ${address}` : deliveryLabel) : undefined, at: 2 },
    { b: f(g.last, { one: one.trim() || g.them, two: two.trim() || g.theirPerson }), at: 3 },
  ].filter(t => t.at <= step);

  const composer = 'h-12 flex-1 min-w-0 rounded-full bg-slate-50 border border-slate-200 px-4 md:px-5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors';
  const next = 'h-12 shrink-0 px-5 rounded-full bg-slate-900 text-white text-sm font-bold inline-flex items-center gap-1.5 hover:bg-black disabled:opacity-25 transition-colors';
  const chip = 'h-10 px-4 rounded-full border text-sm font-semibold transition-colors';
  const plainChip = `${chip} bg-white border-slate-200 text-slate-700 hover:border-slate-900`;

  const reply = (() => {
    if (given) return <button onClick={reset} className="h-12 px-5 rounded-full border border-slate-200 text-sm font-bold text-slate-800 hover:border-slate-400 transition-colors">{g.another}</button>;
    if (step === 0) return (
      <form onSubmit={e => { e.preventDefault(); if (one.trim() && two.trim()) go(1); }} className="flex items-center gap-2">
        <input value={one} onChange={e => setOne(e.target.value.slice(0, 40))} placeholder={d.common.me} aria-label={d.common.me} className={composer} />
        <span className="font-serif italic text-xl text-[#f0addd]">&amp;</span>
        <input value={two} onChange={e => setTwo(e.target.value.slice(0, 40))} placeholder={d.common.partner} aria-label={d.common.partner} className={composer} />
        <button disabled={!(one.trim() && two.trim())} className={next}>{d.common.next}</button>
      </form>);
    if (step === 1) return (
      <div className="flex flex-wrap gap-2">{OCCASIONS.map((o, i) => (
        <button key={o.label} onClick={() => { setOccasion(i); setNote(null); go(2); }} className={plainChip}>{o.label}</button>
      ))}</div>);
    if (step === 2) return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(['email', 'them', 'me'] as Delivery[]).map(x => (
            <button key={x} onClick={() => { setDelivery(x); setWhen(''); if (x === 'email') go(3); }}
              className={delivery === x ? `${chip} text-white border-transparent` : plainChip} style={delivery === x ? { background: tone.ink } : undefined}>
              {x === 'email' ? g.email : x === 'them' ? g.mailThem : g.mailMe}
            </button>
          ))}
        </div>
        {mail && (
          <form onSubmit={e => { e.preventDefault(); if (address.trim().length >= 8) go(3); }} className="flex items-center gap-2 animate-[fadeUp_.3s_ease-out]">
            <input autoFocus value={address} onChange={e => setAddress(e.target.value.slice(0, 200))} placeholder={delivery === 'them' ? g.theirAddress : g.yourAddress} autoComplete={delivery === 'me' ? 'street-address' : 'off'} aria-label={delivery === 'them' ? g.theirAddress : g.yourAddress} className={composer} />
            <button disabled={address.trim().length < 8} className={next}>{d.common.next}</button>
          </form>
        )}
      </div>);
    return (
      <div className="space-y-2.5">
        <input type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={f(g.theirEmail, { one: one.trim() || g.their, two: two.trim() || g.partnerWord })} aria-label={f(g.theirEmail, { one: one.trim() || g.their, two: two.trim() || g.partnerWord })} className={`${composer} w-full`} />
        <div className="flex gap-2">
          <input value={from} onChange={e => setFrom(e.target.value.slice(0, 40))} placeholder={g.yourName} autoComplete="given-name" aria-label={g.yourName} className={composer} />
          <input type="email" inputMode="email" value={myEmail} onChange={e => setMyEmail(e.target.value)} placeholder={g.yourEmail} autoComplete="email" aria-label={g.yourEmail} className={composer} />
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-sm text-slate-400 mr-1">{g.arrives}</span>
          <button onClick={() => { setWhen(''); setPicking(false); }} className={!when && !picking ? `${chip} text-white border-transparent` : plainChip} style={!when && !picking ? { background: tone.ink } : undefined}>{mail ? g.asap : g.rightAway}</button>
          <button onClick={() => setPicking(p => !p)} className={when || picking ? `${chip} text-white border-transparent` : plainChip} style={when || picking ? { background: tone.ink } : undefined}>
            <span className="inline-flex items-center gap-2"><CalendarCheck size={15} />{opens ? date(new Date(`${when}T12:00:00`), { month: 'short', day: 'numeric' }) : g.pickDay}</span>
          </button>
        </div>
        {picking && <GiftCalendar min={minDay} value={when} ink={tone.ink} onPick={k => { setWhen(k); setPicking(false); }} />}
        <button onClick={give} disabled={!detailsReady || sending}
          className="group mt-2 h-14 w-full rounded-full bg-slate-900 text-white text-[15px] font-bold inline-flex items-center justify-center gap-2 hover:bg-black disabled:opacity-25 transition-colors">
          {sending ? g.sealing : <>{f(g.give, { price: g.price })} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></>}
        </button>
        {failed && <p className="text-sm text-[#b4547f] text-center" role="alert">{failed}</p>}
      </div>);
  })();

  return (
    <section id="gift" className="relative z-10 px-6 py-20 md:py-28 scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-serif text-5xl md:text-6xl tracking-tight leading-[1.02]">
            <span className="text-slate-900">{g.title1}</span><br /><span className="text-slate-900">{g.title2}</span>
          </h2>
          <p className="mt-6 text-lg text-slate-500 font-light leading-relaxed">{g.sub}</p>
          <p className="mt-7 inline-flex items-baseline gap-2 text-slate-500"><span className="font-serif text-2xl text-slate-900"><GiftCount /></span><span className="text-[15px]">{g.given}</span></p>
        </div>

        <div className="mt-14 md:mt-16 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          <div className="relative rounded-[2rem] bg-white border border-white shadow-[0_40px_100px_-40px_rgba(15,23,42,0.35)] overflow-hidden">
            <div className="flex items-center justify-between px-6 md:px-7 pt-5 pb-4 border-b border-slate-100">
              <span className="inline-flex items-center gap-2.5"><BelluhOrb size={22} /><span className="font-serif text-[17px] text-slate-900">Bella</span></span>
              <span className="text-sm text-slate-500"><span className="font-semibold text-slate-900">{g.price}</span> {g.priceLine}</span>
            </div>
            <div ref={scroller} className="h-[300px] md:h-[360px] overflow-y-auto overscroll-contain px-5 md:px-7 py-6 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <div className="shrink-0 pt-0.5"><BelluhOrb size={24} /></div>
                <p className="font-serif text-[15px] md:text-base leading-relaxed text-slate-800">{g.hello}</p>
              </div>
              {turns.map((t, i) => (
                <React.Fragment key={t.at}>
                  <div className={`flex gap-3 items-start ${t.at > 0 ? 'animate-[fadeUp_.45s_ease-out]' : ''}`}>
                    <div className="shrink-0 pt-0.5"><BelluhOrb size={24} /></div>
                    <p className="font-serif text-[15px] md:text-base leading-relaxed text-slate-800">{i === turns.length - 1 && t.at > 0 && !given ? <BelluhSpeech text={t.b} pace={1.8} /> : t.b}</p>
                  </div>
                  {t.you && (
                    <button onClick={() => !given && go(t.at)} title={given ? undefined : g.changeThis} className="self-end max-w-[85%] rounded-3xl rounded-br-lg bg-slate-100 px-4 py-2.5 text-left text-[15px] text-slate-800 hover:bg-slate-200/70 transition-colors animate-[fadeUp_.35s_ease-out] break-words">{t.you}</button>
                  )}
                </React.Fragment>
              ))}
              {given && (
                <div className="flex gap-3 items-start animate-[fadeUp_.45s_ease-out]" role="status">
                  <div className="shrink-0 pt-0.5"><BelluhOrb size={24} /></div>
                  <div>
                    <p className="font-serif text-[15px] md:text-base leading-relaxed text-slate-800"><BelluhSpeech text={f(g.thanks, { from: from.trim(), names })} pace={1.8} /></p>
                    <p className="mt-2 text-sm text-slate-400">{GIFT_CHECKOUT ? g.payTab : f(g.payEmail, { email: myEmail.trim(), when: opens ? f(g.onDay, { day: opens }) : g.rightAfter })}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 md:px-7 pb-5 pt-4 border-t border-slate-100">{reply}</div>
          </div>

          <div className="order-first lg:order-none">
            <GiftEnvelope tone={tone} names={names} note={shownNote} from={from.trim()} opens={opens} given={given} mailed={mail} />
            <div className="mt-6 text-center">
              {editingNote && !given ? (
                <form onSubmit={e => { e.preventDefault(); setEditingNote(false); }} className="flex items-center gap-2 max-w-md mx-auto">
                  <input autoFocus value={note ?? tone.note} onChange={e => setNote(e.target.value.slice(0, 140))} aria-label={g.yourNote} className={`${composer} font-serif italic`} />
                  <button className={next}>{d.common.done}</button>
                </form>
              ) : !given ? (
                <button onClick={() => setEditingNote(true)} className="text-sm font-semibold text-[#3f7486] hover:text-slate-900 transition-colors">{g.writeNote}</button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



// A real app screen in a phone frame; sizes scale with the phone's width
// The three screens in Inside Belluh, left to right
const INSIDE_SCREENS = ['/screens/write.webp', '/screens/us.webp', '/screens/home.webp'];

const PhoneFrame: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = '' }) => (
  <div className={`[container-type:inline-size] ${className}`}>
    <div className="rounded-[15cqw] bg-[#0f172a] p-[2.6cqw] shadow-[0_50px_100px_-30px_rgba(15,23,42,0.45),0_30px_80px_-30px_rgba(240,173,221,0.55)] ring-1 ring-black/5">
      <img src={src} alt={alt} width={390} height={898} decoding="async" className="block w-full h-auto rounded-[12.6cqw]" />
    </div>
  </div>
);

const FaqItem: React.FC<{ q: string; a: string; open: boolean; onToggle: () => void }> = ({ q, a, open, onToggle }) => (
  <div className={`rounded-[1.5rem] transition-colors duration-300 ${open ? 'bg-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.3)]' : 'hover:bg-white/60'}`}>
    <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between gap-6 text-left px-5 md:px-7 py-5 md:py-6">
      <span className={`font-serif text-xl md:text-2xl tracking-tight transition-colors ${open ? 'text-slate-900' : 'text-slate-700'}`}>{q}</span>
      <Plus size={20} className={`shrink-0 text-[#9bbecb] transition-transform duration-300 ${open ? 'rotate-45 text-[#e58fc9]' : ''}`} />
    </button>
    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
      <div className="overflow-hidden">
        <p className="px-5 md:px-7 pb-6 -mt-1 text-[16px] md:text-[17px] text-slate-500 leading-relaxed max-w-2xl">{a}</p>
      </div>
    </div>
  </div>
);

// Example entries for the stories strip, each with what Belluh does with it
const MOMENT_TONES = ['bg-white', 'bg-[#fdf0f8]', 'bg-[#eef7fa]'];

// Edges that fade out, for the scrolling stories strip
const FADE_X = { WebkitMaskImage: 'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)', maskImage: 'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)' } as React.CSSProperties;

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onShowLegal: (type: 'tos' | 'privacy') => void;
  onGoToAbout: () => void;
  onGoToCareers: () => void;
}

// Tap Belluh and it becomes something else, then back to water
const FUN_SHAPES = ['🦒', '🐈', '🐬', '🦋', '🦖', '🌻', '🚀', '❤️'];
function useShapeTap() {
  const { d } = useI18n();
  const [n, setN] = useState(-1);
  const cur = useRef(-1);
  const tap = () => {
    const next = cur.current + 1 >= FUN_SHAPES.length ? -1 : cur.current + 1;
    if (next < 0) belluh.become('water', 'water', false);
    else belluh.become({ emoji: FUN_SHAPES[next] }, d.common.shapes[next] ?? '', false);
    cur.current = next; setN(next);
  };
  return { tap, label: n < 0 ? null : d.common.shapes[n] ?? '' };
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onShowLegal, onGoToAbout, onGoToCareers }) => {
  const { d, f, country, textApps, lang } = useI18n();
  const c = d.common, n_ = d.nav;
  const FAQ = d.faq.items.map(x => ({ q: x.q, a: f(x.a, { apps: textApps }) }));
  const PLANS = d.pricing.plans.map((p, i) => ({ ...p, featured: i === 1, team: i === 2, items: p.items.map(it => f(it, { apps: textApps })) }));
  const MOMENTS = d.stories.moments;
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const heroTap = useShapeTap();
  const cjk = lang === 'ja' || lang === 'zh';
  const heroLong = (d.hero.line1 + d.hero.line2).length > 34;
  const SC = useUi(science);
  // The hero plays once: Bella asks, "Plan it" is tapped, the plan appears. Reduced motion shows the end straight away.
  const [heroStep, setHeroStep] = useState(0);
  useEffect(() => {
    let reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* old browser */ }
    if (reduce) { setHeroStep(2); return; }
    const a = setTimeout(() => setHeroStep(1), 1900), b = setTimeout(() => setHeroStep(2), 2500);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  const ctaTap = useShapeTap();
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  useEffect(() => { const onR = () => setIsDesktop(window.innerWidth >= 768); window.addEventListener('resize', onR); return () => window.removeEventListener('resize', onR); }, []);
  const heroSize = () => (typeof window === 'undefined' ? 150 : window.innerWidth >= 1024 ? Math.min(168, Math.round(window.innerHeight * 0.19)) : window.innerWidth >= 640 ? 150 : 104);
  const [heroOrb, setHeroOrb] = useState(heroSize);
  useEffect(() => {
    const onR = () => setHeroOrb(heroSize());
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setPastHero(currentScrollY > window.innerHeight * 0.6);
      
      setIsNavVisible(true);
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
      if (isMenuOpen) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = 'unset';
      }
      return () => {
          document.body.style.overflow = 'unset';
      };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const scrollToSection = (id: string) => {
      setIsMenuOpen(false);
      const element = document.getElementById(id);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
      }
  };

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const menuItems = [
      { label: n_.meet, action: () => scrollToSection('at-work') },
      { label: n_.inside, action: () => scrollToSection('inside') },
      { label: n_.stories, action: () => scrollToSection('stories') },
      { label: n_.pricing, action: () => scrollToSection('pricing') },
      { label: n_.faq, action: () => scrollToSection('faq') },
      { label: n_.privacy, action: () => { toggleMenu(); onShowLegal('privacy'); } },
      { label: n_.why, action: () => { toggleMenu(); onGoToAbout(); } },
      { label: n_.careers, action: () => { toggleMenu(); onGoToCareers(); } }
  ];

  // Bella, live: she notices, offers, and once you say yes the plan is in both calendars
  const heroCard = (
                 <div className="relative mt-5 mx-auto max-w-[440px] rounded-[1.75rem] bg-white/90 backdrop-blur-xl border border-white shadow-[0_30px_70px_-30px_rgba(15,23,42,0.35)] p-5 sm:p-6 text-left" style={{ animation: 'slideUp 0.8s 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
                     <div className="flex items-center gap-2.5"><BelluhOrb size={24} /><span className="text-[13px] font-bold text-slate-900">Bella</span><span className="ml-auto text-[11px] font-medium text-slate-400">{c.now}</span></div>
                     <p className="mt-3 font-serif text-[16px] sm:text-[17px] leading-snug text-slate-800">{f(d.hero.cardBella, { partner: c.partner })}</p>
                     <div className="mt-4 flex items-center gap-2">
                         <span className={`h-9 px-4 inline-flex items-center gap-1.5 rounded-full text-xs font-bold transition-all duration-300 ${heroStep >= 1 ? 'bg-[#3f7486] text-white scale-[0.97]' : 'bg-slate-900 text-white'}`}>{heroStep >= 1 && <Check size={13} />}{d.hero.planIt}</span>
                         <span className={`h-9 px-3 inline-flex items-center text-xs font-semibold transition-opacity duration-300 ${heroStep >= 1 ? 'opacity-0' : 'text-slate-400'}`}>{d.hero.notNow}</span>
                     </div>
                     <div className={`grid transition-[grid-template-rows,opacity,margin] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${heroStep >= 2 ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                         <div className="overflow-hidden">
                             <div className="rounded-2xl bg-[#f3f8fa] border border-[#dcebf0] p-4">
                                 <p className="text-[13px] font-semibold text-[#e58fc9]">{f(d.hero.cardPlanLabel, { partner: c.partner })}</p>
                                 <p className="mt-1 font-serif text-[16px] text-slate-900">{d.hero.cardPlanTitle}</p>
                                 <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#3f7486]"><CalendarCheck size={14} /> {d.hero.cardPlanWhen}</p>
                             </div>
                         </div>
                     </div>
                 </div>
  );
  const heroScene = (
             <div className="relative mx-auto w-full max-w-[440px]" style={{ animation: 'slideUp 1s 0.15s cubic-bezier(0.16,1,0.3,1) both' }}>
                 <div className="absolute left-1/2 top-[18%] -translate-x-1/2 w-[130%] aspect-square rounded-full bg-[radial-gradient(circle,rgba(205,233,242,0.9)_0%,rgba(240,173,221,0.16)_42%,rgba(255,255,255,0)_68%)] blur-2xl animate-breathing pointer-events-none" />
                 <div className="relative flex flex-col items-center">
                     <BelluhOrb size={heroOrb} onTap={heroTap.tap} label={c.bellaTapLabel} />
                     <p className="mt-2.5 h-5 text-xs font-semibold tracking-wide text-slate-400" aria-live="polite">{heroTap.label ? f(c.tapAgain, { shape: heroTap.label }) : c.tapBella}</p>
                 </div>
                 {heroCard}
             </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 font-sans selection:bg-[#f0addd] selection:text-white overflow-x-hidden relative">
      
      {/* --- Ambient Cloud Background Layers --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#CDE9F2]/30 rounded-full blur-[120px] animate-float opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#f0addd]/20 rounded-full blur-[130px] animate-pulse-slow opacity-50"></div>
          <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-white rounded-full blur-[80px] animate-breathing opacity-80 mix-blend-overlay"></div>
      </div>

      {/* Top bar */}
      <SiteNav
          links={[
              { label: n_.meet, onClick: () => scrollToSection('at-work'), section: 'at-work' },
              { label: n_.inside, onClick: () => scrollToSection('inside'), section: 'inside' },
              { label: n_.stories, onClick: () => scrollToSection('stories'), section: 'stories' },
              { label: n_.pricing, onClick: () => scrollToSection('pricing'), section: 'pricing' },
              { label: n_.faq, onClick: () => scrollToSection('faq'), section: 'faq' },
          ]}
          onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onLogin={onLogin}
          onGetStarted={() => { rememberCta('nav'); onGetStarted(); }}
          onMenu={toggleMenu}
      />

      {/* Full Screen Menu Overlay - Clean Design */}
      <div className={`fixed inset-0 z-[100] bg-white overflow-y-auto overscroll-contain transition-all duration-700 ease-[cubic-bezier(0.32,0.725,0,1)] ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
          <div className="flex flex-col min-h-full p-6 md:p-10 relative max-w-7xl mx-auto w-full">
               <div className="flex justify-between items-center mb-6 md:mb-8">
                   <span className="font-serif text-2xl font-bold tracking-tight text-[#9bbecb]">Belluh</span>
                   <button 
                    onClick={toggleMenu}
                    className="bg-slate-50 text-slate-900 w-12 h-12 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-100"
                   >
                       <X size={24} strokeWidth={2} />
                   </button>
               </div>

               <div className="flex-1 flex flex-col justify-center items-start gap-3 md:gap-5 py-2 animate-slide-up pl-2">
                   {menuItems.map((item, idx) => (
                       <button 
                         key={idx}
                         onClick={item.action}
                         className="group relative flex items-start gap-6 text-left transition-all duration-500 w-full md:w-auto"
                       >
                           <span className="text-xs font-bold font-sans text-slate-200 group-hover:text-[#9bbecb] mt-1 md:mt-2 transition-colors duration-300">{idx + 1}</span>
                           <span style={{ fontSize: 'clamp(2rem, min(9vw, 6vh), 6rem)' }} className="font-serif font-medium text-slate-300 group-hover:text-[#9bbecb] tracking-tighter transition-colors duration-300 leading-[0.9] group-hover:translate-x-2 transform">
                               {item.label}
                           </span>
                       </button>
                   ))}
               </div>

               <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-auto pt-6 w-full max-w-md md:max-w-xl animate-fade-in">
                   <button 
                       onClick={() => { toggleMenu(); onLogin(); }}
                       className="w-full py-3.5 md:py-4 rounded-full bg-slate-50 font-bold text-slate-900 hover:bg-slate-100 transition-colors text-lg border border-slate-100"
                   >
                       {c.signIn}
                   </button>
                   <button 
                       onClick={() => { toggleMenu(); rememberCta('menu'); onGetStarted(); }}
                       className="w-full py-3.5 md:py-4 rounded-full bg-[#9bbecb] text-white font-bold hover:bg-[#8aaab7] transition-colors shadow-xl text-lg flex items-center justify-center gap-2"
                   >
                       {c.startFree} <ArrowRight size={18} />
                   </button>
               </div>
          </div>
      </div>

      {/* Hero: the problem in one line, then Bella solving it before they ask: she speaks first, they say yes, it's ready */}
      <section className="relative z-10 h-[100svh] min-h-[600px] lg:min-h-[700px] flex items-center pt-[72px] pb-16 px-6 overflow-hidden">
         <div className="w-full max-w-7xl mx-auto md:px-6 grid grid-cols-1 lg:grid-cols-[1.08fr_1fr] items-center gap-12 lg:gap-10">
             <div className="text-center lg:text-left" style={{ animation: 'slideUp 0.9s cubic-bezier(0.16,1,0.3,1) both' }}>
                 {/* On phones the first screen gets Bella herself, the way Hinge leads with a face */}
                 <div className="lg:hidden flex flex-col items-center mb-7">
                     <BelluhOrb size={92} onTap={heroTap.tap} label={c.bellaTapLabel} />
                     <p className="mt-2 h-4 text-[11px] font-semibold tracking-wide text-slate-400" aria-live="polite">{heroTap.label ? f(c.tapAgain, { shape: heroTap.label }) : c.tapBella}</p>
                 </div>
                 {/* Chinese and Japanese break between phrases and stand upright (italic is a fake slant there); long lines step down a size */}
                 <h1 lang={lang} style={cjk ? { wordBreak: 'auto-phrase' as any } : undefined}
                     className={`font-serif text-slate-900 ${cjk ? 'tracking-normal leading-[1.2] text-[2.2rem] sm:text-6xl xl:text-[4.1rem]' : `tracking-[-0.02em] leading-[1.02] [text-wrap:balance] ${heroLong ? 'text-[2.6rem] sm:text-6xl xl:text-[4.5rem]' : 'text-[2.9rem] sm:text-7xl xl:text-[5.4rem]'}`}`}>
                     {d.hero.line1}<br />
                     <span className={`${cjk ? '' : 'italic '}text-[#e58fc9]`}>
                         {cjk ? d.hero.line2.split(/(?<=[、，])/).map((part, i) => <React.Fragment key={i}>{i > 0 && <br />}{part}</React.Fragment>) : d.hero.line2}
                     </span>
                 </h1>
                 <p className="mt-6 sm:mt-7 text-[17px] md:text-xl text-slate-600 leading-relaxed max-w-[34rem] mx-auto lg:mx-0 [text-wrap:pretty]">{d.hero.sub}</p>
                 <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3">
                     <button onClick={() => { rememberCta('hero'); onGetStarted(); }} className="group w-full sm:w-auto h-14 px-8 rounded-full bg-slate-900 text-white text-[15px] font-bold inline-flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-[0_18px_40px_-18px_rgba(15,23,42,0.6)]">
                         {c.startFree} <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                     </button>
                     <button onClick={onLogin} className="w-full sm:w-auto h-12 sm:h-14 px-7 rounded-full text-[15px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors">
                         {c.haveAccount}
                     </button>
                 </div>
                 <div className="mt-6 sm:mt-8 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-[13px] sm:text-sm text-slate-500">
                     <span className="inline-flex items-center gap-2"><Heart size={15} className="text-[#e58fc9]" /> {d.hero.chipFree}</span>
                     <span className="inline-flex items-center gap-2"><Lock size={15} className="text-[#9bbecb]" /> {d.hero.chipPrivate}</span>
                     <span className="inline-flex items-center gap-2"><MessageCircle size={15} className="text-[#9bbecb]" /> {d.hero.chipText}</span>
                 </div>
             </div>

             <div className="hidden lg:block">{heroScene}</div>
         </div>
         <button type="button" onClick={() => window.scrollTo({ top: window.innerHeight - 56, behavior: 'smooth' })} aria-label={d.nav.meet} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-700 animate-bounce"><ChevronDown size={26} /></button>
      </section>

      {/* On phones, Bella's scene comes right after the first screen */}
      <div className="lg:hidden relative z-10 px-6 pt-4 pb-16">{heroCard}</div>

      {/* The promise, in one line (what Hinge does best: a mission you can feel) */}
      <section className="relative z-10 px-6 pt-10 pb-6 md:pt-16">
          <div className="max-w-4xl mx-auto text-center">
              <p className="font-serif text-[2rem] md:text-[3.2rem] leading-[1.1] tracking-tight text-slate-900 [text-wrap:balance]">{SC.missionLine}</p>
              <p className="mt-5 text-[17px] md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto [text-wrap:pretty]">{SC.missionSub}</p>
          </div>
      </section>

      <BellaAtWork />

      {/* Real app screens */}
      <section id="inside" className="relative z-10 px-6 pb-28 scroll-mt-24">
          <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-serif text-center leading-tight mb-4 drop-shadow-sm">
                  <span className="text-slate-900">{d.inside.title}</span>
              </h2>
              <p className="text-center text-lg text-slate-500 font-light mb-12">{d.inside.sub}</p>

              <div className="group relative md:h-[760px] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border border-white bg-gradient-to-b from-white/70 to-[#fdf2f9]/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)]">
                  <div className="absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full bg-[#CDE9F2]/70 blur-[110px] pointer-events-none"></div>
                  <div className="absolute -bottom-48 -right-32 w-[620px] h-[620px] rounded-full bg-[#f0addd]/35 blur-[120px] pointer-events-none"></div>

                  {/* Three real screens side by side, each fully in view; on phones they swipe */}
                  <div className="relative flex md:justify-center items-start gap-5 md:gap-12 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar px-[calc(50%-125px)] md:px-10 pt-10 md:pt-16 pb-8 md:pb-0">
                      {INSIDE_SCREENS.map((src, i) => (
                          <figure key={src} className={`snap-center shrink-0 w-[250px] ${i === 1 ? 'md:w-[316px] relative z-10' : 'md:w-[280px] md:mt-20'} transition-transform duration-700 ${i === 0 ? 'md:-rotate-[4deg] md:group-hover:-rotate-[5deg] md:group-hover:-translate-x-1' : i === 2 ? 'md:rotate-[4deg] md:group-hover:rotate-[5deg] md:group-hover:translate-x-1' : 'md:group-hover:-translate-y-2'}`}>
                              <PhoneFrame src={src} alt={d.inside.captions[i]} />
                              <figcaption className="md:hidden mt-4 text-center text-sm font-semibold text-slate-600">{d.inside.captions[i]}</figcaption>
                          </figure>
                      ))}
                  </div>
              </div>

              <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-3">
                  <div className="w-full max-w-[340px] rounded-3xl bg-white border border-slate-100 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)] p-3.5 flex gap-3">
                      <div className="shrink-0 pt-0.5"><BelluhOrb size={32} /></div>
                      <div className="min-w-0">
                          <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-slate-900">Bella</span><span className="text-xs text-slate-400">{c.now}</span></div>
                          <p className="text-[13px] md:text-sm text-slate-600 leading-snug mt-0.5">{f(d.inside.picked, { partner: c.partner })}</p>
                      </div>
                  </div>
                  <div className="inline-flex items-center gap-2.5 rounded-full bg-white border border-slate-100 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)] px-5 py-3.5">
                      <Lock size={16} className="text-[#3f7486]" />
                      <span className="text-sm font-bold text-slate-700">{d.inside.private}</span>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-14 px-2">
                  {d.inside.steps.map((s, i) => (
                      <div key={i}>
                          <p className="text-xs font-bold tracking-widest text-[#f0addd]">{i + 1}</p>
                          <p className="mt-2 font-serif text-2xl text-slate-900">{s.title}</p>
                          <p className="mt-2 text-slate-500 font-light leading-relaxed">{s.text}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Marquee Section */}

      {/* Infinite Marquee Section */}
      <section id="stories" className="relative z-10 py-20 md:py-28 overflow-hidden scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6 mb-14 md:mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
                <h2 className="font-serif text-5xl md:text-7xl tracking-tight text-slate-900 leading-[1.02]">{d.stories.title1}<br className="hidden md:block" /> <span className="whitespace-nowrap">{d.stories.title2}</span></h2>
            </div>
            <p className="text-slate-500 text-lg md:text-xl font-light leading-relaxed max-w-sm md:text-right">
                {d.stories.sub}
            </p>
        </div>

        <div>
            {[MOMENTS].map((row, r) => (
                <div key={r} className="relative flex overflow-hidden group py-12 -my-9" style={FADE_X}>
                    <div className={`flex w-max ${r ? 'animate-marquee-reverse' : 'animate-marquee'} group-hover:[animation-play-state:paused]`} style={{ animationDuration: r ? '75s' : '65s', willChange: 'transform', backfaceVisibility: 'hidden' }}>
                        {[...row, ...row].map((m, i) => (
                            <article key={i} aria-hidden={i >= row.length ? true : undefined} className={`shrink-0 mx-3 md:mx-4 w-[300px] md:w-[380px] min-h-[300px] rounded-[1.75rem] p-7 md:p-8 flex flex-col shadow-[0_18px_40px_-24px_rgba(15,23,42,0.25)] transition-transform duration-500 hover:-translate-y-1.5 hover:rotate-0 ${MOMENT_TONES[i % 3]} ${i % 2 ? 'rotate-[0.8deg]' : '-rotate-[0.8deg]'}`}>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{m.when}</p>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">{i % 5 === 3 ? <><Lock size={11} /> {c.justMe}</> : c.shared}</span>
                                </div>
                                <p className="mt-5 flex-1 font-serif text-xl md:text-[1.45rem] leading-snug text-slate-800 whitespace-normal">{m.text}</p>
                                <div className="mt-7 flex items-start gap-2.5 rounded-2xl bg-white/70 px-3.5 py-3 whitespace-normal">
                                    <BelluhOrb size={18} className="mt-0.5" />
                                    <p className="text-[13px] leading-snug text-slate-600"><span className="font-serif font-bold text-[#7fa7b6]">Bella</span> {m.bella}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </section>
      
      {/* Relationship science (Hinge's "love scientists", but with the actual studies, which Bella cites when asked) */}
      <section id="science" className="relative z-10 px-6 py-20 md:py-28 scroll-mt-24">
          <div className="max-w-6xl mx-auto">
              <h2 className="font-serif text-[2.1rem] md:text-5xl leading-tight tracking-tight text-slate-900 text-center [text-wrap:balance]">{SC.title}</h2>
              <p className="mt-5 text-[17px] md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto text-center [text-wrap:pretty]">{SC.sub}</p>
              <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                  {SC.findings.map(x => (
                      <div key={x.title} className="h-full flex flex-col rounded-[1.75rem] bg-white/80 border border-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.35)] p-7">
                          <p className="font-serif text-[1.35rem] leading-snug text-slate-900">{x.title}</p>
                          <p className="mt-3 text-[15px] text-slate-600 leading-relaxed flex-1">{x.body}</p>
                          <p className="mt-6 text-xs font-semibold text-[#3f7486]">{x.source}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Why Belluh exists, in Jimmy's words, next to the evening it started with */}
      <section id="why" className="relative z-10 px-6 py-20 md:py-28 scroll-mt-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] items-center gap-16 lg:gap-20">
              <div>
                  <span className="block font-serif text-8xl leading-[0.5] text-[#f0addd] select-none" aria-hidden="true">&ldquo;</span>
                  <blockquote className="mt-2 font-serif text-[2.1rem] md:text-[3.4rem] leading-[1.1] tracking-tight text-slate-900">
                      {d.why.quote}
                  </blockquote>
                  <p className="mt-8 text-lg md:text-xl text-slate-500 font-light leading-relaxed max-w-xl">
                      {d.why.body}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                      <p className="font-serif text-2xl italic text-[#9bbecb]">{d.why.by}</p>
                      <button onClick={onGoToAbout} className="group inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors">
                          {d.why.read} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                      </button>
                  </div>
              </div>
              <button onClick={onGoToAbout} aria-label={d.why.readLabel} className="block w-full max-w-[340px] mx-auto lg:mr-0">
                  <Receipt />
              </button>
          </div>
      </section>

      {/* Pricing: the shared memory is the product; you pay for Belluh doing more with it */}
      <section id="pricing" className="relative z-10 px-6 py-20 md:py-28 scroll-mt-24">
          <div className="max-w-6xl mx-auto">
              <div className="max-w-2xl">
                  <h2 className="font-serif text-5xl md:text-6xl tracking-tight leading-[1.02]">
                      <span className="text-slate-900">{d.pricing.title1}</span><br /><span className="text-slate-900">{d.pricing.title2}</span>
                  </h2>
                  <p className="mt-6 text-lg text-slate-500 font-light leading-relaxed">{d.pricing.sub}</p>
              </div>
              <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
                  {PLANS.map(plan => (
                      <div key={plan.name} className={`relative rounded-[2rem] p-8 flex flex-col ${plan.featured ? 'bg-white border-2 border-slate-900 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]' : 'bg-white/70 border border-slate-100'}`}>
                          {plan.featured && <span className="absolute -top-3 left-8 h-6 px-3 rounded-full bg-slate-900 text-white text-[11px] font-bold tracking-wide inline-flex items-center">{d.pricing.mostCouples}</span>}
                          <p className="font-serif text-2xl text-slate-900">{plan.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{plan.blurb}</p>
                          <p className="mt-7 flex items-baseline gap-2 flex-wrap"><span className={`font-serif ${plan.team ? 'text-3xl' : 'text-5xl'} text-slate-900 tracking-tight`}>{plan.price}</span><span className="text-sm text-slate-400">{plan.per}</span></p>
                          {plan.alt ? <p className="mt-1 text-sm text-[#3f7486] font-semibold">{plan.alt}</p> : <p className="mt-1 text-sm">&nbsp;</p>}
                          <ul className="mt-7 space-y-3 flex-1">
                              {plan.items.map(it => <li key={it} className="flex items-start gap-3 text-[15px] text-slate-600"><Check size={17} className="mt-0.5 shrink-0 text-[#9bbecb]" />{it}</li>)}
                          </ul>
                          {plan.team ? (
                              <a href="mailto:hello@belluh.com?subject=Belluh%20for%20teams" className="mt-8 h-12 rounded-full border border-slate-200 text-slate-800 text-sm font-bold inline-flex items-center justify-center gap-2 hover:border-slate-400 transition-colors">{plan.cta} <ArrowRight size={15} /></a>
                          ) : (
                              <button onClick={() => { rememberCta(`pricing-${['free', 'duo', 'teams'][PLANS.indexOf(plan)] ?? 'plan'}`); onGetStarted(); }} className={`mt-8 h-12 rounded-full text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors ${plan.featured ? 'bg-slate-900 text-white hover:bg-black' : 'bg-white border border-slate-200 text-slate-800 hover:border-slate-400'}`}>{plan.cta} <ArrowRight size={15} /></button>
                          )}
                      </div>
                  ))}
              </div>
              <p className="mt-8 text-sm text-slate-400">{d.pricing.note}{country !== 'US' ? ` ${d.pricing.billedUsd}` : ''}</p>
          </div>
      </section>

      <GiftSection />

      {/* FAQ */}
      <section id="faq" className="relative z-10 px-6 py-20 md:py-28 scroll-mt-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-start">
              <div className="lg:sticky lg:top-28">
                  <h2 className="font-serif text-5xl md:text-6xl tracking-tight leading-[1.02]">
                      <span className="text-slate-900">{d.faq.title}</span>
                  </h2>
                  <p className="mt-6 text-lg text-slate-500 font-light leading-relaxed max-w-sm">{d.faq.sub}</p>
                  <button onClick={() => { rememberCta('faq'); onGetStarted(); }} className="mt-7 group inline-flex items-center gap-2 h-11 px-5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-black transition-colors">{c.startFree} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></button>
              </div>
              <div className="space-y-1.5 -mx-5 md:mx-0">
                  {FAQ.map((f, i) => <FaqItem key={f.q} q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />)}
              </div>
          </div>
      </section>

      {/* The last word before the footer */}
      <section className="relative z-10 px-6 pb-24 md:pb-32">
          <div className="relative max-w-6xl mx-auto overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-[#eef7fa] via-white to-[#fdf0f8] border border-white shadow-[0_40px_100px_-50px_rgba(63,116,134,0.5)]">
              <div className="absolute -top-32 -right-24 w-[460px] h-[460px] rounded-full bg-[#CDE9F2]/60 blur-[100px] pointer-events-none" />
              <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-10 px-8 py-14 md:px-16 md:py-20">
                  <div className="text-center md:text-left">
                      <h2 className="font-serif text-5xl md:text-7xl tracking-tight leading-[1.0]">
                          <span className="text-[#9bbecb]">{d.cta.line1}</span><br /><span className="text-[#f0addd] italic">{d.cta.line2}</span>
                      </h2>
                      <p className="mt-6 text-lg md:text-xl text-slate-500 font-light leading-relaxed max-w-lg mx-auto md:mx-0">{d.cta.sub}</p>
                      <div className="mt-9 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                          <button onClick={() => { rememberCta('final'); onGetStarted(); }} className="group w-full sm:w-auto h-14 px-8 rounded-full bg-slate-900 text-white text-[15px] font-bold inline-flex items-center justify-center gap-2 hover:bg-black transition-colors">{c.startFree} <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" /></button>
                          <button onClick={onLogin} className="w-full sm:w-auto h-14 px-7 rounded-full text-[15px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white transition-colors">{c.haveAccount}</button>
                      </div>
                  </div>
                  <div className="flex flex-col items-center">
                      <BelluhOrb size={isDesktop ? 220 : 150} onTap={ctaTap.tap} label={c.bellaTapLabel} />
                      <p className="mt-3 h-5 text-xs font-semibold text-slate-400" aria-live="polite">{ctaTap.label ? f(c.tapAgain, { shape: ctaTap.label }) : c.tapBella}</p>
                  </div>
              </div>
          </div>
      </section>

      <SiteFooter
          onTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onSection={scrollToSection}
          onGetStarted={() => { rememberCta('footer'); onGetStarted(); }}
          onLogin={onLogin}
          onShowLegal={onShowLegal}
          onGoToAbout={onGoToAbout}
          onGoToCareers={onGoToCareers}
      />
      
      <style>{`
        .mask-gradient-x {
            mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
      `}</style>
    </div>
  );
};

export default LandingPage;