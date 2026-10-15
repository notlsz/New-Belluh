import React, { useState } from 'react';
import { ExternalLink, PenLine } from 'lucide-react';
import { belluhAgent, AgentMessage } from '../services/belluhAgent';
import PlanCard from './PlanCard';
import { trackEvent } from '../services/analytics';

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
  const links: { label: string; url: string }[] = Array.isArray(msg.meta?.links) ? msg.meta.links : [];
  const kind = msg.meta?.kind;

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
