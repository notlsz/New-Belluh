// The partner's yes. When one of them brings their "how we met" from a dating app, the lines that may be the other's
// words wait here: the partner reads them and approves (they join the shared story) or declines (they're forgotten).
// The one who brought them sees that they're waiting. Shown at the top of the journal while anything is pending.
import React, { useEffect, useState } from 'react';
import { useI18n, useUi } from '../i18n';
import ui from '../i18n/ui/howWeMet';
import { Emoji } from '../lib/emoji3d';
import { approvalsFor, type StoryApproval } from '../lib/storyApproval';

interface Props {
  me: string;
  partnerId: string | null;
  partnerName?: string;
  /** After an approval, so the new entry shows */
  onChanged?: () => void;
  /** For the dev harness: the rows and the decision instead of the database */
  load?: () => Promise<StoryApproval[]>;
  decideFn?: (id: string, approve: boolean) => Promise<unknown>;
}

const StoryApprovals: React.FC<Props> = ({ me, partnerId, partnerName, onChanged, load, decideFn }) => {
  const T = useUi(ui);
  const { f, num } = useI18n();
  const [rows, setRows] = useState<StoryApproval[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const partner = (partnerName || '').trim().split(' ')[0];
  useEffect(() => {
    let live = true;
    (load ?? (() => import('../services/storyApprovals').then(m => m.listApprovals())))().then(r => { if (live) setRows(r); }).catch(() => {});
    return () => { live = false; };
  }, [load, me]);
  const { toDecide, waiting } = approvalsFor(rows, me, owner => (owner === partnerId ? me : null));
  if (!toDecide.length && !waiting.length) return null;

  const decide = async (id: string, approve: boolean) => {
    setBusy(id);
    try {
      await (decideFn ?? ((i: string, a: boolean) => import('../services/storyApprovals').then(m => m.decideApproval(i, a))))(id, approve);
      setRows(list => list.filter(r => r.id !== id));
      if (approve) onChanged?.();
    } catch { /* stays, so they can try again */ }
    setBusy(null);
  };
  const waitingLines = waiting.reduce((n, a) => n + a.lines.length, 0);

  return (
    <div className="space-y-3" data-testid="story-approvals">
      {toDecide.map(a => (
        <section key={a.id} className="rounded-[2rem] bg-white border border-[#f0addd]/60 shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-3">
            <Emoji e="💞" size={36} className="shrink-0" />
            <h3 className="font-serif text-lg md:text-xl text-slate-900 leading-snug">{partner ? f(T.approveTitle, { name: partner }) : T.approveTitleNoName}</h3>
          </div>
          <p className="mt-2 text-[14px] leading-snug text-slate-500">{T.approveBody}</p>
          <ul className="mt-3 space-y-2">
            {a.lines.map((l, i) => <li key={i} className="rounded-2xl bg-[#fdf1f8] px-4 py-3 font-serif text-[15px] text-slate-800 leading-snug">“{l}”</li>)}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" disabled={busy === a.id} onClick={() => decide(a.id, true)} className="h-12 rounded-full bg-slate-900 hover:bg-black text-white text-[14px] font-bold disabled:opacity-50">{T.yes}</button>
            <button type="button" disabled={busy === a.id} onClick={() => decide(a.id, false)} className="h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-[14px] font-bold disabled:opacity-50">{T.no}</button>
          </div>
        </section>
      ))}
      {waitingLines > 0 && (
        <p className="flex items-center gap-2 px-2 text-[14px] text-slate-500"><Emoji e="⏳" size={18} className="shrink-0" />
          {partner ? (waitingLines === 1 ? f(T.waiting1, { name: partner }) : f(T.waiting, { name: partner, n: num(waitingLines) })) : f(T.waitingNoName, { n: num(waitingLines) })}
        </p>
      )}
    </div>
  );
};

export default StoryApprovals;
