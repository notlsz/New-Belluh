// Home until your partner joins. Belluh is for two, so the one thing to do here is bring your person: a link to send,
// what opens once they're in, and a way to plan a surprise with Bella in the meantime.
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useI18n, useUi } from '../i18n';
import strings from '../i18n/ui/inviteFirst';
import onboarding from '../i18n/ui/onboarding';
import { Emoji } from '../lib/emoji3d';

interface Pending { id: string; inviter: { id: string; name: string; avatar: string } }
interface Props {
  partnerName?: string | null;
  pendingInvites?: Pending[];
  onAcceptInvite?: (id: string) => void;
  onDeclineInvite?: (id: string) => void;
  onAskBella: () => void;
  onLookAround: () => void;
}

const CARD_EMOJI = ['📖', '💬', '✨'];

const InviteFirst: React.FC<Props> = ({ partnerName, pendingInvites = [], onAcceptInvite, onDeclineInvite, onAskBella, onLookAround }) => {
  const T = useUi(strings);
  const O = useUi(onboarding);
  const { f } = useI18n();
  const name = partnerName?.trim() || '';
  const [state, setState] = useState<'idle' | 'making' | 'copied' | 'shared' | 'error'>('idle');
  const [link, setLink] = useState<string | null>(null);

  const makeLink = async (): Promise<string | null> => {
    if (link) return link;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: token, error } = await supabase.rpc('create_partner_invite');
    const legacy = !!error && /could not find the function|PGRST202/i.test(`${error.message} ${(error as any).code ?? ''}`);
    if (!legacy && (error || !token)) return null;
    const url = `${window.location.origin}/?invite=${legacy ? user.id : token}`;
    setLink(url);
    return url;
  };

  const send = async () => {
    setState('making');
    const url = await makeLink().catch(() => null);
    if (!url) { setState('error'); return; }
    const text = f(O.shareText, { url });
    try {
      if (navigator.share) { await navigator.share({ title: 'Belluh', text, url }); setState('shared'); return; }
    } catch (err: any) {
      if (err?.name === 'AbortError') { setState('idle'); return; }
    }
    try { await navigator.clipboard.writeText(url); setState('copied'); } catch { setState('idle'); }
  };

  const status = state === 'making' ? T.making : state === 'copied' ? T.copied : state === 'shared' ? T.shared : state === 'error' ? T.error : null;

  return (
    <main className="min-h-screen bg-paper px-6 pt-20 pb-16 md:pt-28 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        {pendingInvites.map(inv => (
          <div key={inv.id} className="mb-8 rounded-2xl bg-white border border-slate-100 p-4 flex items-center gap-3">
            <img src={inv.inviter.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-100 shrink-0" />
            <p className="flex-1 text-[15px] font-semibold text-slate-800">{f(T.invitedYou, { name: inv.inviter.name })}</p>
            <button onClick={() => onDeclineInvite?.(inv.id)} className="h-10 px-4 rounded-full text-sm font-semibold text-slate-400 hover:text-slate-700">{T.decline}</button>
            <button onClick={() => onAcceptInvite?.(inv.id)} className="h-10 px-5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-black">{T.accept}</button>
          </div>
        ))}

        <h1 className="font-serif text-[2.4rem] md:text-[3.6rem] leading-[1.06] tracking-tight text-slate-900 [text-wrap:balance]">{T.title}</h1>
        <p className="mt-5 max-w-xl text-[17px] md:text-lg leading-relaxed text-slate-500 [text-wrap:pretty]">{name ? f(T.sub, { name }) : T.subNoName}</p>

        <div className="mt-9 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
          <button onClick={send} disabled={state === 'making'}
            className="h-14 px-8 rounded-full bg-[#5e9db3] hover:bg-[#4f8ea4] text-white text-[16px] font-bold inline-flex items-center justify-center gap-2.5 shadow-[0_14px_30px_-14px_rgba(63,116,134,0.8)] disabled:opacity-70">
            <Emoji e="💌" size={22} />{name ? f(T.send, { name }) : T.sendNoName}
          </button>
          <p aria-live="polite" className={`text-sm leading-snug ${state === 'error' ? 'text-[#b4537f]' : 'text-slate-500'}`}>{status}</p>
        </div>
        {link && state === 'copied' && <p className="mt-3 text-xs text-slate-400 break-all select-all">{link}</p>}

        <p className="mt-16 text-[11px] md:text-xs font-bold tracking-[0.2em] uppercase text-slate-400">{T.unlock}</p>
        <ul className="mt-6 flex flex-col gap-7 max-w-xl">
          {T.cards.map((c, i) => (
            <li key={i} className="flex items-start gap-5">
              <Emoji e={CARD_EMOJI[i]} size={36} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-serif text-[1.3rem] leading-snug text-slate-900">{c.t}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-slate-500">{c.b}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
          <button onClick={onAskBella} className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#3f7486] hover:text-[#2f5f70]">
            <Emoji e="🎁" size={20} />{T.surprise}
          </button>
          <button onClick={onLookAround} className="text-[15px] font-semibold text-slate-400 hover:text-slate-600 text-left">{T.lookAround}</button>
        </div>
      </div>
    </main>
  );
};

export default InviteFirst;
