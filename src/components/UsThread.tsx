import React, { useEffect, useRef, useState } from 'react';
import BelluhOrb from './BelluhOrb';
import { ArrowUp, Sparkles, ExternalLink } from 'lucide-react';
import { belluhAgent, type UsMessage } from '../services/belluhAgent';
import PlanCard from './PlanCard';
import { trackEvent } from '../services/analytics';

/** "Us": the two of you and Belluh in one conversation. Belluh only knows what you both share. */
const UsThread: React.FC<{ partnerName: string; myName?: string | null; header: React.ReactNode; inSheet?: boolean }> = ({ partnerName, myName, header, inSheet }) => {
  const [messages, setMessages] = useState<UsMessage[] | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [ask, setAsk] = useState(true);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const lastId = useRef<string | null>(null);

  const load = async () => {
    const r = await belluhAgent.usHistory();
    if (r) setMessages(r.messages);
  };
  useEffect(() => {
    belluhAgent.myId().then(setMe);
    load();
    // New messages from your partner show up while you're here
    const iv = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 5000);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    const last = messages?.[messages.length - 1]?.id ?? null;
    if (last && last !== lastId.current) {
      const first = lastId.current === null;
      lastId.current = last;
      const go = () => end.current?.scrollIntoView({ block: 'end', behavior: first ? 'auto' : 'smooth' });
      requestAnimationFrame(go);
      // Plan cards load their details a moment later and grow; follow them down
      const t1 = setTimeout(go, 500), t2 = setTimeout(go, 1500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [messages]);

  const send = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setText(''); setBusy(true);
    const temp: UsMessage = { id: `tmp-${Date.now()}`, author: me, role: 'user', body: t, meta: {}, created_at: new Date().toISOString() };
    setMessages(prev => [...(prev ?? []), temp]);
    trackEvent('us_message_sent', { ask_belluh: ask });
    const r = await belluhAgent.usSend(t, ask);
    setMessages(prev => {
      const rest = (prev ?? []).filter(m => m.id !== temp.id);
      return r?.messages?.length ? [...rest, ...r.messages] : [...rest, temp, { id: `err-${Date.now()}`, author: null, role: 'belluh', body: "That didn't send. Try again in a moment.", meta: {}, created_at: new Date().toISOString() }];
    });
    setBusy(false);
  };

  const who = (m: UsMessage) => (m.role !== 'user' ? 'belluh' : m.author === me ? 'me' : 'partner');
  const myFirst = (myName || 'You').split(' ')[0];

  return (
    <div className={`flex flex-col ${inSheet ? 'h-full' : 'h-screen'} bg-white text-slate-900`}>
      {header}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-6 pt-6 space-y-4">
          {messages === null && <div className="h-20 rounded-3xl bg-slate-50 animate-pulse" />}
          {messages !== null && messages.length === 0 && (
            <div className="text-center py-10 px-6">
              <div className="mx-auto w-fit"><BelluhOrb size={48} /></div>
              <p className="mt-4 font-serif text-xl text-slate-900">You, {partnerName} and Bella</p>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">Plan together, decide together, ask Bella together. Bella here only knows what you've both shared, never anyone's private entries.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {['Plan a date night for us this week', 'What have we both been writing about?', 'Give us something small to try tonight'].map(s => (
                  <button key={s} onClick={() => setText(s)} className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-[#9bbecb] hover:text-[#3f7486]">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages?.map(m => {
            const w = who(m);
            if (m.role === 'plan') return <div key={m.id} className="pl-10"><PlanCard planId={m.meta?.plan_id} partnerName={partnerName} /></div>;
            return (
              <div key={m.id} className={`flex items-end gap-2 animate-slide-up ${w === 'me' ? 'justify-end' : ''}`}>
                {w === 'belluh' && (
                  <div className="w-8 shrink-0 pb-3 flex justify-center"><BelluhOrb size={22} /></div>
                )}
                <div className={`max-w-[80%] rounded-3xl px-4 py-3 ${w === 'me' ? 'bg-slate-100 rounded-br-lg' : w === 'partner' ? 'bg-[#eef8fb] rounded-bl-lg' : 'bg-white border border-slate-100 rounded-bl-lg'}`}>
                  {w === 'partner' && <p className="text-[12px] font-semibold text-[#3f7486] mb-1">{partnerName}</p>}
                  <p className={`whitespace-pre-wrap ${w === 'belluh' ? 'font-serif text-[16px] leading-relaxed text-slate-900' : 'text-[15px] text-slate-800'}`}>{m.body}</p>
                  {w === 'belluh' && Array.isArray(m.meta?.links) && m.meta.links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.meta.links.map((l: { label: string; url: string }) => (
                        <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-[#f0addd] hover:text-[#831843]">
                          {l.label} <ExternalLink size={12} className="text-slate-300" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {busy && ask && (
            <div className="flex items-center gap-3 pl-1.5 text-xs font-bold text-slate-400">
              <BelluhOrb size={20} thinking /> Bella is thinking
            </div>
          )}
          <div ref={end} className="h-64" aria-hidden="true" />
        </div>
      </div>
      <div className={`fixed ${inSheet ? 'bottom-4' : 'bottom-24 md:bottom-28 lg:bottom-6 lg:left-[var(--sidebar-w,16rem)]'} left-0 right-0 z-20 px-4 pt-8 bg-gradient-to-t from-belluh-25 via-belluh-25 to-transparent`}>
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-[10px] text-slate-400 mb-2">{myFirst} and {partnerName} both see this. Belluh only knows what you've both shared.</p>
          <div className="w-full rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-200 bg-white flex items-center p-2 pr-3 min-h-[60px] focus-within:border-belluh-200">
            <button type="button" onClick={() => setAsk(!ask)} aria-pressed={ask} title={ask ? 'Belluh will answer' : `Just to ${partnerName}`}
              className={`shrink-0 h-9 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors ${ask ? 'bg-[#9bbecb] text-white' : 'bg-slate-100 text-slate-500'}`}>
              <Sparkles size={13} /> {ask ? 'Bella' : 'Off'}
            </button>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={1}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={ask ? `Ask Bella, with ${partnerName}…` : `Message ${partnerName}…`}
              aria-label={`Message ${partnerName} and Bella`}
              className="flex-1 bg-transparent border-none px-3 py-2 max-h-32 resize-none focus:outline-none text-[16px] text-slate-800 placeholder:text-slate-400" style={{ overflow: 'hidden' }} />
            <button aria-label="Send to Us" onClick={send} disabled={!text.trim() || busy}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${text.trim() ? 'bg-[#9bbecb] text-white' : 'bg-slate-100 text-slate-300'}`}>
              <ArrowUp size={19} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsThread;
