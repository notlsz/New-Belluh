import React, { useState } from 'react';
import { ExternalLink, PenLine, ArrowUpRight, CalendarCheck, Gift, Flower2, UtensilsCrossed, Plane, Ticket, Check, Lock, Phone } from 'lucide-react';
import { belluhAgent, AgentMessage } from '../services/belluhAgent';
import PlanCard from './PlanCard';
import { trackEvent } from '../services/analytics';

/** "+14085550134" → "(408) 555-0134"; other countries stay as they are. */
const prettyPhone = (e164: string) => {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
};

/**
 * What Belluh did or offers, under its message: links it prepared (a table to book, gifts to buy), a yes or not now
 * on something it noticed, a plan still waiting on you, or "write about it" after a plan happened.
 */
const BelluhActions: React.FC<{
  msg: AgentMessage;
  partnerName?: string | null;
  onAdded?: (added: AgentMessage[], updated: AgentMessage) => void;
  onCompose?: (prompt: string) => void;
  onBusy?: (busy: boolean) => void;
}> = ({ msg, partnerName, onAdded, onCompose, onBusy }) => {
  const [status, setStatus] = useState<string | undefined>(msg.meta?.status);
  const [busy, setBusy] = useState(false);
  // Real products Belluh found (Shopify brands), each opening the shop's checkout with it in the cart
  const products: { title: string; price: string; seller: string; image: string | null; url: string }[] = Array.isArray(msg.meta?.products) ? msg.meta.products.filter((p: any) => typeof p?.url === 'string' && p.url.startsWith('https://')) : [];
  const links: { label: string; url: string }[] = (Array.isArray(msg.meta?.links) ? msg.meta.links : []).filter((l: any) => !products.some(p => p.url === l.url));
  const kind = msg.meta?.kind;
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
      {products.length > 0 && (
        <div className="mt-2 -mx-2 px-2 pt-1 pb-5 -mb-3 flex gap-3 overflow-x-auto no-scrollbar">
          {products.map(p => (
            <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('belluh_product_opened', { seller: p.seller.slice(0, 40) })}
              className="group shrink-0 w-[220px] rounded-2xl bg-white border border-slate-100 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] hover:shadow-[0_16px_36px_-18px_rgba(63,116,134,0.45)] transition-shadow overflow-hidden">
              <div className="aspect-[4/3] bg-[#F8FAFB] overflow-hidden">
                {p.image ? <img src={p.image} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : null}
              </div>
              <div className="p-3.5">
                <p className="text-[13px] font-semibold text-slate-900 leading-snug line-clamp-2">{p.title}</p>
                <p className="mt-1 text-xs text-slate-400 truncate">{p.seller}</p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="font-serif text-base text-slate-900">{p.price}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#3f7486]">Checkout <ArrowUpRight size={13} /></span>
                </div>
              </div>
            </a>
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
                    {c.call.status === 'calling' ? `Belluh is on the phone with ${c.call.place}…`
                      : c.call.status === 'failed' ? `Called ${c.call.place}: ${c.call.note ?? "they couldn't fit you in"}.`
                      : <>{c.call.place} <a href={`tel:${c.call.phone}`} className="font-semibold text-[#3f7486] hover:underline">{prettyPhone(c.call.phone)}</a></>}
                  </p>
                )}
                {c.surprise && c.status !== 'booked' && <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-400"><Lock size={11} /> A surprise. {partnerName ?? 'Your partner'} won't see this.</p>}
              </div>
            </div>
            {c.status === 'booked' ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#3f7486]"><Check size={14} /> Done{c.when ? '. In your calendar, with a reminder.' : '. Belluh will remember.'}</p>
            ) : c.call?.status === 'calling' ? null : (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {c.call?.status === 'ready' && (
                  <button disabled={cardBusy === c.id} onClick={() => callFor(c.id)} className="h-9 px-3.5 rounded-full bg-slate-900 text-white text-xs font-bold disabled:opacity-60 inline-flex items-center gap-1.5">
                    <Phone size={13} /> {cardBusy === c.id ? 'Calling…' : 'Call for me'}
                  </button>
                )}
                {c.call?.status !== 'calling' && (
                  <button disabled={cardBusy === c.id} onClick={() => markBooking(c.id, true)} className={c.call?.status === 'ready' ? 'h-9 px-3.5 rounded-full border border-slate-200 text-slate-700 text-xs font-bold disabled:opacity-60' : 'h-9 px-4 rounded-full bg-slate-900 text-white text-xs font-bold disabled:opacity-60'}>
                    {cardBusy === c.id && c.call?.status !== 'ready' ? 'Saving…' : c.label}
                  </button>
                )}
                {c.call?.status !== 'calling' && (
                  <button disabled={cardBusy === c.id} onClick={() => markBooking(c.id, false)} className="h-9 px-1 rounded-full text-xs font-bold text-slate-400 hover:text-slate-700">Not now</button>
                )}
                <span className="ml-auto text-[11px] text-slate-400 hidden sm:block">Tap once it's done</span>
              </div>
            )}
          </div>
        );
      })}
      {kind === 'offer' && status === 'open' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button disabled={busy} onClick={() => answer(true)} className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold disabled:opacity-60">
            {busy ? 'On it…' : 'Help me plan it'}
          </button>
          <button disabled={busy} onClick={() => answer(false)} className="px-4 py-2.5 rounded-full text-sm font-bold text-slate-400 hover:text-slate-700">Not now</button>
        </div>
      )}
      {kind === 'offer' && status === 'dismissed' && <p className="mt-2 text-xs text-slate-300">Okay, not now.</p>}
      {kind === 'plan_nudge' && msg.meta?.plan_id && <div className="mt-3"><PlanCard planId={msg.meta.plan_id} partnerName={partnerName ?? null} /></div>}
      {kind === 'after_plan' && onCompose && (
        <button onClick={() => onCompose(msg.meta?.prompt || 'How was it?')} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-[#f0addd] shadow-sm">
          <PenLine size={14} /> Write about it
        </button>
      )}
    </>
  );
};

export default BelluhActions;
