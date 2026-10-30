import React, { useState } from 'react';
import { ExternalLink, ShoppingBag, PenLine, ArrowUpRight, CalendarCheck, Gift, Flower2, UtensilsCrossed, Plane, Ticket, Check, Lock, Phone, MapPin, Clock } from 'lucide-react';
import { belluhAgent, AgentMessage } from '../services/belluhAgent';
import PlanCard from './PlanCard';
import { prettyPhone } from '../lib/phone';
import { trackEvent } from '../services/analytics';
import { useI18n } from '../i18n';


/**
 * What Belluh did or offers, under its message: links it prepared (a table to book, gifts to buy), a yes or not now
 * on something it noticed, a plan still waiting on you, or "write about it" after a plan happened.
 */
const BelluhActions: React.FC<{
  msg: AgentMessage;
  partnerName?: string | null;
  onAdded?: (added: AgentMessage[], updated: AgentMessage) => void;
  onCompose?: (prompt: string) => void;
  /** Puts a request to Bella in the chat box, for them to finish (a day and time) and send. */
  onAsk?: (prompt: string) => void;
  onBusy?: (busy: boolean) => void;
}> = ({ msg, partnerName, onAdded, onCompose, onAsk, onBusy }) => {
  const { d, f } = useI18n(); const A = d.app.acts;
  const [status, setStatus] = useState<string | undefined>(msg.meta?.status);
  const [busy, setBusy] = useState(false);
  // Orders they said no to, remembered on this device so they stay closed
  const [denied, setDenied] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('belluh_denied') || '[]'); } catch { return []; } });
  const deny = (url: string) => { const next = [...denied, url].slice(-50); setDenied(next); trackEvent('belluh_order_denied'); try { localStorage.setItem('belluh_denied', JSON.stringify(next)); } catch { /* storage off */ } };
  // Real products Belluh found (Shopify brands), each opening the shop's checkout with it in the cart
  const products: { title: string; price: string; seller: string; image: string | null; url: string; total?: string; deliversTo?: string; ready?: boolean }[] = Array.isArray(msg.meta?.products) ? msg.meta.products.filter((p: any) => typeof p?.url === 'string' && p.url.startsWith('https://')) : [];
  const links: { label: string; url: string }[] = (Array.isArray(msg.meta?.links) ? msg.meta.links : []).filter((l: any) => !products.some(p => p.url === l.url));
  const kind = msg.meta?.kind;
  // Real places Bella found for a plan, each one tap from booking or directions
  type SpotCard = { name: string; kind: string; address: string | null; phone: string | null; website: string | null; hours: string | null; map: string; bookable: boolean };
  const spots: SpotCard[] = Array.isArray(msg.meta?.spots) ? msg.meta.spots.filter((x: any) => typeof x?.name === 'string' && typeof x?.map === 'string' && x.map.startsWith('https://')) : [];
  // What Belluh got ready, waiting for "I booked it" so it can go in the calendar, the reminders and the journal
  type Card = { id: string; kind: string; title: string; when: string | null; surprise: boolean; label: string; status: string; call?: { place: string; phone: string; status: string; note?: string } };
  const [cards, setCards] = useState<Card[]>(Array.isArray(msg.meta?.bookings) ? msg.meta.bookings : []);
  const [cardBusy, setCardBusy] = useState<string | null>(null);
  const markBooking = async (id: string, done: boolean) => {
    setCardBusy(id);
    trackEvent(done ? 'booking_done' : 'booking_dismissed', { kind: cards.find(c => c.id === id)?.kind });
    const r = await belluhAgent.bookingDone(id, done);
    setCardBusy(null);
    if (!r) return;
    const next = cards.map(c => c.id === id ? { ...c, status: done ? 'booked' : 'dismissed' } : c);
    setCards(next);
    onAdded?.(r.message ? [r.message] : [], { ...msg, meta: { ...msg.meta, bookings: next } });
  };

  // "Call for me": Belluh phones the restaurant; what they said comes back as a message (and to their phone)
  const callFor = async (id: string) => {
    setCardBusy(id);
    trackEvent('booking_call', {});
    const r = await belluhAgent.bookingCall(id);
    setCardBusy(null);
    if (!r) return;
    const next = r.called ? cards.map(c => c.id === id && c.call ? { ...c, call: { ...c.call, status: 'calling' } } : c) : cards;
    setCards(next);
    onAdded?.(r.message ? [r.message] : [], { ...msg, meta: { ...msg.meta, bookings: next } });
  };

  const answer = async (accept: boolean) => {
    setBusy(true); onBusy?.(true);
    trackEvent(accept ? 'offer_accepted' : 'offer_dismissed', { kind });
    const r = await belluhAgent.offerRespond(msg.id, accept);
    const next = r ? (accept ? 'accepted' : 'dismissed') : status;
    setStatus(next);
    setBusy(false); onBusy?.(false);
    onAdded?.(r?.messages ?? [], { ...msg, meta: { ...msg.meta, status: next } });
  };

  return (
    <>
      {/* An order Bella got ready: nothing is spent until they allow it, and they pay on the shop's own page */}
      {products.filter(p => p.ready).slice(0, 1).map(p => denied.includes(p.url)
        ? <p key={p.url} className="mt-2 text-xs text-slate-400">{A.denied}</p>
        : (
        <div key={p.url} className="mt-3 max-w-md rounded-2xl bg-white border border-slate-100 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] p-4">
          <div className="flex items-start gap-3">
            <ShoppingBag size={18} className="mt-0.5 shrink-0 text-[#9bbecb]" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 leading-snug">{f(A.orderAt, { seller: p.seller })}</p>
              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{f(A.checkTerms, { seller: p.seller })}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#F8FAFB] p-2.5">
            {p.image && <div className="w-16 h-16 shrink-0 rounded-lg bg-white overflow-hidden"><img src={p.image} alt="" loading="lazy" className="w-full h-full object-cover" /></div>}
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 leading-snug line-clamp-2">{p.title}</p>
              {p.deliversTo && <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{f(A.deliversTo, { place: p.deliversTo })}</p>}
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-sm text-slate-500">{A.estTotal}</span>
            <span className="font-serif text-lg text-slate-900">{p.total ?? p.price}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => deny(p.url)} className="h-11 rounded-full bg-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-200">{A.deny}</button>
            <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('belluh_order_allowed', { seller: p.seller.slice(0, 40) })}
              className="h-11 rounded-full bg-slate-900 text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 hover:bg-black">{A.allow} <ArrowUpRight size={14} /></a>
          </div>
        </div>
      ))}
      {products.filter(p => !p.ready).length > 0 && (
        <div className="mt-2 -mx-2 px-2 pt-1 pb-5 -mb-3 flex gap-3 overflow-x-auto no-scrollbar">
          {products.filter(p => !p.ready).map(p => (
            <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('belluh_product_opened', { seller: p.seller.slice(0, 40) })}
              className="group shrink-0 w-[220px] rounded-2xl bg-white border border-slate-100 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] hover:shadow-[0_16px_36px_-18px_rgba(63,116,134,0.45)] transition-shadow overflow-hidden">
              <div className="aspect-[4/3] bg-[#F8FAFB] overflow-hidden">
                {p.image ? <img src={p.image} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : null}
              </div>
              <div className="p-3.5">
                <p className="text-[13px] font-semibold text-slate-900 leading-snug line-clamp-2">{p.title}</p>
                <p className="mt-1 text-xs text-slate-400 truncate">{p.seller}</p>
                {p.ready && p.deliversTo && <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">To {p.deliversTo}</p>}
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="font-serif text-base text-slate-900">{p.ready && p.total ? p.total : p.price}{p.ready && <span className="ml-1 font-sans text-[11px] text-slate-400">{A.withTax}</span>}</span>
                  {p.ready
                    ? <span className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-slate-900 text-white text-xs font-bold">{A.reviewPay}</span>
                    : <span className="inline-flex items-center gap-1 text-xs font-bold text-[#3f7486]">{A.checkout} <ArrowUpRight size={13} /></span>}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
      {spots.length > 0 && (
        <div className="mt-2 -mx-2 px-2 pt-1 pb-5 -mb-3 flex gap-3 overflow-x-auto no-scrollbar">
          {spots.map(x => (
            <div key={`${x.name}|${x.address}`} className="shrink-0 w-[268px] rounded-2xl bg-white border border-slate-100 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] p-4 flex flex-col">
              <p className="font-serif text-[17px] leading-snug text-slate-900 line-clamp-2">{x.name}</p>
              <p className="mt-1 text-xs font-semibold text-[#3f7486]">{x.kind}</p>
              {x.address && <p className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-500 leading-snug"><MapPin size={13} className="mt-px shrink-0 text-slate-300" /><span className="line-clamp-2">{x.address}</span></p>}
              {x.hours && <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500"><Clock size={13} className="shrink-0 text-slate-300" /><span className="truncate">{x.hours}</span></p>}
              <div className="mt-auto pt-4 flex items-center gap-1.5">
                {x.bookable && onAsk && (
                  <button onClick={() => { trackEvent('belluh_spot_reserve', {}); onAsk(`Book us a table at ${x.name}${x.address ? `, ${x.address}` : ''}, for 2, at `); }}
                    className="h-9 px-3.5 rounded-full bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-black">{A.reserve}</button>
                )}
                <a href={x.map} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('belluh_spot_map', {})}
                  className="h-9 px-3 rounded-full border border-slate-200 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 hover:border-slate-400">{A.map} <ArrowUpRight size={13} /></a>
                {x.phone && <a href={`tel:${x.phone}`} aria-label={f(A.callPlace, { name: x.name })} className="h-9 px-3 rounded-full border border-slate-200 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 hover:border-slate-400"><Phone size={13} />Call</a>}
              </div>
            </div>
          ))}
        </div>
      )}
      {links.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {links.map(l => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('belluh_link_opened', { label: l.label.slice(0, 40) })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-[#f0addd] hover:text-[#831843] shadow-sm">
              {l.label} <ExternalLink size={13} className="text-slate-300" />
            </a>
          ))}
        </div>
      )}
      {cards.filter(c => c.status !== 'dismissed').map(c => {
        const Icon = { table: CalendarCheck, trip: Plane, flowers: Flower2, gift: Gift, dinner: UtensilsCrossed, experience: Ticket }[c.kind] ?? CalendarCheck;
        return (
          <div key={c.id} className="mt-3 max-w-md rounded-2xl bg-white border border-slate-100 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] px-4 py-3.5">
            <div className="flex items-start gap-3">
              <Icon size={18} className="mt-0.5 shrink-0 text-[#9bbecb]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 leading-snug">{c.title}</p>
                {c.when && <p className="mt-0.5 text-xs text-slate-500">{c.when}</p>}
                {c.call && c.status !== 'booked' && (
                  <p className="mt-1 text-xs text-slate-500">
                    {c.call.status === 'calling' ? f(A.onPhone, { place: c.call.place })
                      : c.call.status === 'failed' ? f(A.called, { place: c.call.place, note: c.call.note ?? A.noFit })
                      : <>{c.call.place} <a href={`tel:${c.call.phone}`} className="font-semibold text-[#3f7486] hover:underline">{prettyPhone(c.call.phone)}</a></>}
                  </p>
                )}
                {c.surprise && c.status !== 'booked' && <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-400"><Lock size={11} /> {f(A.surprise, { partner: partnerName ?? A.yourPartner })}</p>}
              </div>
            </div>
            {c.status === 'booked' ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#3f7486]"><Check size={14} /> {c.when ? A.doneCal : A.doneMem}</p>
            ) : c.call?.status === 'calling' ? null : (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {c.call?.status === 'ready' && (
                  <button disabled={cardBusy === c.id} onClick={() => callFor(c.id)} className="h-9 px-3.5 rounded-full bg-slate-900 text-white text-xs font-bold disabled:opacity-60 inline-flex items-center gap-1.5">
                    <Phone size={13} /> {cardBusy === c.id ? A.calling : A.callForMe}
                  </button>
                )}
                {c.call?.status !== 'calling' && (
                  <button disabled={cardBusy === c.id} onClick={() => markBooking(c.id, true)} className={c.call?.status === 'ready' ? 'h-9 px-3.5 rounded-full border border-slate-200 text-slate-700 text-xs font-bold disabled:opacity-60' : 'h-9 px-4 rounded-full bg-slate-900 text-white text-xs font-bold disabled:opacity-60'}>
                    {cardBusy === c.id && c.call?.status !== 'ready' ? A.saving : c.label}
                  </button>
                )}
                {c.call?.status !== 'calling' && (
                  <button disabled={cardBusy === c.id} onClick={() => markBooking(c.id, false)} className="h-9 px-1 rounded-full text-xs font-bold text-slate-400 hover:text-slate-700">{A.notNow}</button>
                )}
                <span className="ml-auto text-[11px] text-slate-400 hidden sm:block">{A.tapDone}</span>
              </div>
            )}
          </div>
        );
      })}
      {kind === 'offer' && status === 'open' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button disabled={busy} onClick={() => answer(true)} className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold disabled:opacity-60">
            {busy ? A.onIt : A.helpPlan}
          </button>
          <button disabled={busy} onClick={() => answer(false)} className="px-4 py-2.5 rounded-full text-sm font-bold text-slate-400 hover:text-slate-700">{A.notNow}</button>
        </div>
      )}
      {kind === 'offer' && status === 'dismissed' && <p className="mt-2 text-xs text-slate-300">{A.okayNot}</p>}
      {kind === 'plan_nudge' && msg.meta?.plan_id && <div className="mt-3"><PlanCard planId={msg.meta.plan_id} partnerName={partnerName ?? null} /></div>}
      {kind === 'after_plan' && onCompose && (
        <button onClick={() => onCompose(msg.meta?.prompt || A.howWasIt)} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-[#f0addd] shadow-sm">
          <PenLine size={14} /> {d.app.writeAboutIt}
        </button>
      )}
    </>
  );
};

export default BelluhActions;
