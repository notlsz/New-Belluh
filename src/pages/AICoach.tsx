
import React, { useState, useEffect, useRef } from 'react';
import { Insight, ChatMessage, RelationshipArchetype, UserPersona } from '../types';
import { chatWithBelluh, generateDailyReflection, getRelationshipArchetype, softenConflictMessage, detectPersonaFromEntries } from '../services/geminiService';
import { belluhAgent, AgentMessage, WeekView } from '../services/belluhAgent';
import WeeklyCard from '../components/WeeklyCard';
import PlanCard from '../components/PlanCard';
import UsThread from '../components/UsThread';
import BelluhActions from '../components/BelluhActions';
import { Sparkles, Wand2, Activity, ArrowUp, Heart, Check, X, Brain, Trash2, ImagePlus } from 'lucide-react';
import { uploadPrivate, resolveMedia } from '../services/media';
import { supabase } from '../lib/supabaseClient';
import { trackEvent } from '../services/analytics';

interface AICoachProps {
  insights: Insight[];
  entryTexts: string[];
  onTriggerPremium: () => void;
  userName?: string;
  /** A question asked from elsewhere in the app (the home "Ask Belluh" bar, an entry card), sent on open. */
  initialMessage?: string | null;
  onInitialMessageSent?: () => void;
  /** Opens the journal composer with a prompt ("How was ramen night?"). */
  onCompose?: (prompt: string) => void;
  /** Which conversation to open: "me" (just you and Belluh) or "us" (with your partner). Defaults to the last one used. */
  initialSpace?: 'me' | 'us';
  /** Shown as a panel over Home (from the Ask Belluh bar) rather than as its own tab. */
  inSheet?: boolean;
  onClose?: () => void;
}

/** A new reply appears word by word, quickly, so it reads like Belluh is talking rather than a block landing. */
const Reveal: React.FC<{ text: string; onTick?: () => void }> = ({ text, onTick }) => {
  const words = text.split(/(\s+)/);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= words.length) return;
    const t = setTimeout(() => { setN(x => Math.min(words.length, x + 3)); onTick?.(); }, 28);
    return () => clearTimeout(t);
  }, [n, words.length]);
  return <>{words.slice(0, n).join('')}{n < words.length && <span className="inline-block w-1.5 h-4 align-middle ml-0.5 bg-belluh-300/70 animate-pulse rounded-sm" />}</>;
};

const firstName = (n?: string) => (n ?? '').trim().split(/\s+/)[0] || '';

const BelluhAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-belluh-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
    <Sparkles size={14} />
  </div>
);

// A note Belluh drafted for your partner. Nothing is sent until you tap Send.
const NoteDraft: React.FC<{ msg: AgentMessage; onSend: (id: string, text: string) => Promise<void>; onDiscard: (id: string) => Promise<void> }> = ({ msg, onSend, onDiscard }) => {
  const [text, setText] = useState(msg.body);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const fit = () => {
      const el = boxRef.current;
      if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight + 2}px`; }
    };
    fit();
    // Re-measure once the serif font has loaded, or the last line gets clipped
    (document as any).fonts?.ready?.then(fit);
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [text]);
  const status = msg.meta?.status ?? 'draft';
  const to = msg.meta?.to_name || 'your partner';

  if (status === 'sent') {
    return (
      <div className="ml-12 max-w-[85%] rounded-3xl border border-belluh-100 bg-belluh-50/40 p-5">
        <p className="font-serif text-[16px] leading-relaxed text-slate-700 whitespace-pre-wrap">{msg.body}</p>
        <p className="mt-3 text-xs font-bold text-belluh-500 flex items-center gap-1.5"><Check size={12} /> Sent to {to}</p>
      </div>
    );
  }
  if (status === 'discarded') {
    return <p className="ml-12 text-xs text-slate-300 italic">Note to {to} not sent.</p>;
  }
  return (
    <div className="ml-12 max-w-[85%] rounded-3xl border border-belluh-200 bg-white shadow-sm p-5">
      <p className="text-xs font-bold text-slate-400 mb-2">Note to {to}</p>
      <textarea
        ref={boxRef}
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
        className="w-full resize-none overflow-hidden bg-belluh-50/40 rounded-2xl p-4 font-serif text-[16px] leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-belluh-100"
      />
      <div className="mt-3 flex items-center gap-2">
        <button
          disabled={busy || !text.trim()}
          onClick={async () => { setBusy(true); await onSend(msg.id, text); setBusy(false); }}
          className="px-5 py-2.5 rounded-full bg-belluh-600 text-white text-sm font-bold hover:bg-belluh-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Heart size={14} className="fill-white" /> Send to {to}
        </button>
        <button
          disabled={busy}
          onClick={async () => { setBusy(true); await onDiscard(msg.id); setBusy(false); }}
          className="px-4 py-2.5 rounded-full text-sm font-bold text-slate-400 hover:text-slate-700"
        >
          Don't send
        </button>
      </div>
    </div>
  );
};

const AICoach: React.FC<AICoachProps> = ({ insights, entryTexts, onTriggerPremium, userName, initialMessage, onInitialMessageSent, onCompose, initialSpace, inSheet, onClose }) => {
  // 'agent' = server-side Belluh with memory; 'legacy' = the original in-browser chat, used if the agent isn't deployed
  const [mode, setMode] = useState<'loading' | 'agent' | 'legacy'>('loading');
  const [partnerName, setPartnerName] = useState<string | null>(null);
  // "Just you" (your own conversation with Belluh) or "Us" (you, your partner and Belluh together)
  const [space, setSpace] = useState<'me' | 'us'>(() => { if (initialSpace) return initialSpace; try { return localStorage.getItem('belluh_space') === 'us' ? 'us' : 'me'; } catch { return 'me'; } });
  const pickSpace = (s: 'me' | 'us') => { setSpace(s); try { localStorage.setItem('belluh_space', s); } catch { /* ignore */ } };
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [memories, setMemories] = useState<{ id: string; fact: string }[] | null>(null);
  const [week, setWeek] = useState<WeekView | null>(null);

  const [reflection, setReflection] = useState<string>('');
  const [archetype, setArchetype] = useState<RelationshipArchetype | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isConflictMode, setIsConflictMode] = useState(false);
  const [detectedPersona, setDetectedPersona] = useState<UserPersona>(UserPersona.Woolf);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  // A photo to send with the next message (Belluh looks at it), and links for photos already in the thread
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const [photoLinks, setPhotoLinks] = useState<Map<string, string>>(new Map());
  const [revealIds, setRevealIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Prefer the agent; fall back to the original chat if it isn't available. Runs once per visit to the tab.
  const entryTextsRef = useRef(entryTexts);
  entryTextsRef.current = entryTexts;
  const initialRef = useRef({ message: initialMessage, done: onInitialMessageSent });
  useEffect(() => {
    const entryTexts = entryTextsRef.current;
    let cancelled = false;
    (async () => {
      const h = await belluhAgent.history();
      if (cancelled) return;
      if (h) {
        setAgentMessages(h.messages);
        setPartnerName(h.partner_name);
        setWeek(h.week ?? null);
        setMode('agent');
        belluhAgent.markNotesRead();
        belluhAgent.markBelluhSeen();
        const first = initialRef.current;
        if (first.message) {
          first.done?.();
          setIsTyping(true);
          sendAgentRef.current?.(first.message).finally(() => setIsTyping(false));
        }
        return;
      }
      setMode('legacy');
      const dummyEntries: any[] = entryTexts.map(text => ({ content: text, timestamp: new Date(), authorName: 'User' }));
      const persona = await detectPersonaFromEntries(dummyEntries);
      if (cancelled) return;
      setDetectedPersona(persona);
      setReflection(await generateDailyReflection(entryTexts, persona));
      setArchetype(await getRelationshipArchetype(entryTexts));
      let initialMsg = "Hello. I'm Belluh. I've been reading your story. How are you feeling today?";
      switch (persona) {
        case UserPersona.Kafka: initialMsg = "I've analyzed your recent entries. I notice a pattern of anxiety following moments of closeness. Shall we unpack that?"; break;
        case UserPersona.Hemingway: initialMsg = "I've reviewed the log. Ready to process."; break;
        case UserPersona.Nietzsche: initialMsg = "You are asking big questions. Let's see if the answers are already in your writing."; break;
        case UserPersona.Fitzgerald: initialMsg = "Your journal reads like a novel. Let's look at the latest chapter together."; break;
        case UserPersona.Camus: initialMsg = "Life is made of fleeting moments. Let's examine the ones you've captured."; break;
      }
      setMessages([{ id: '1', role: 'model', text: initialMsg, timestamp: new Date() }]);
      const first = initialRef.current;
      if (first.message) { first.done?.(); sendLegacyRef.current?.(first.message); }
    })();
    return () => { cancelled = true; belluhAgent.markBelluhSeen(); };
  }, []);

  const didInitialScroll = useRef(false);
  useEffect(() => {
      const behavior: ScrollBehavior = didInitialScroll.current ? 'smooth' : 'auto';
      const go = () => messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
      go();
      // Fonts and auto-sized note boxes can change heights after the first scroll
      (document as any).fonts?.ready?.then(() => setTimeout(go, 50));
      if (agentMessages.length || messages.length) didInitialScroll.current = true;
  }, [messages, agentMessages, isTyping]);

  const calculateSentimentScore = (text: string) => {
    const angryWords = ['hate', 'stupid', 'always', 'never', 'disgusting', 'worst', 'annoying'];
    const count = angryWords.filter(w => text.toLowerCase().includes(w)).length;
    return Math.max(-1, -0.2 * count);
  };

  const sendAgent = async (text: string, attached: { file: File; preview: string } | null = null) => {
    const mediate = isConflictMode;
    const temp: AgentMessage = { id: `tmp-${Date.now()}`, role: 'user', body: text, meta: attached ? { photo_preview: attached.preview } : {}, created_at: new Date().toISOString() };
    setAgentMessages(prev => [...prev, temp]);
    trackEvent(mediate ? 'conflict_mode_used' : 'chat_message_sent', { agent: true, photo: !!attached });
    let ref: string | null = null;
    if (attached) {
      const ext = (attached.file.name.split('.').pop() || 'jpg').toLowerCase();
      ref = await uploadPrivate('photos', attached.file, ext, attached.file.type || 'image/jpeg');
      if (ref) setPhotoLinks(prev => new Map(prev).set(ref!, attached.preview));
    }
    const res = await belluhAgent.chat(text, mediate ? 'mediate' : 'chat', ref);
    if (res?.messages?.length) setRevealIds(prev => { const n = new Set(prev); res.messages.forEach(m => { if (m.role === 'belluh') n.add(m.id); }); return n; });
    setAgentMessages(prev => {
      const rest = prev.filter(m => m.id !== temp.id);
      if (res?.messages?.length) return [...rest, ...res.messages];
      return [...rest, temp, { id: `err-${Date.now()}`, role: 'belluh', body: "I couldn't reach my thoughts just now. Try sending that again in a moment.", meta: {}, created_at: new Date().toISOString() }];
    });
    setIsConflictMode(false);
  };

  const sendAgentRef = useRef(sendAgent);
  sendAgentRef.current = sendAgent;

  const sendLegacy = async (originalInput: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: originalInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    if (isConflictMode) {
        trackEvent('conflict_mode_used', { input_length: originalInput.length });
        try {
            const mediationAdvice = await softenConflictMessage(originalInput);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                supabase.from('conflict_logs').insert({
                    user_id: user.id, original_input: originalInput, ai_suggestion: mediationAdvice,
                    sentiment_score: calculateSentimentScore(originalInput)
                }).then(({ error }) => { if (error) console.error("Failed to log conflict data:", error); });
            }
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: mediationAdvice, timestamp: new Date() }]);
        } catch (e) { console.error(e); } finally { setIsConflictMode(false); }
        return;
    }
    trackEvent('chat_message_sent', { persona: detectedPersona });
    const historyForAI = messages.map(m => ({ role: m.role, text: m.text }));
    const aiResponseText = await chatWithBelluh(originalInput, historyForAI, detectedPersona);
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: aiResponseText, timestamp: new Date() }]);
  };

  const sendLegacyRef = useRef(sendLegacy);
  sendLegacyRef.current = sendLegacy;

  const handleSendMessage = async () => {
    if ((!chatInput.trim() && !photo) || isTyping) return;
    const text = chatInput;
    const attached = photo;
    setChatInput(''); setPhoto(null);
    setIsTyping(true);
    try {
      if (mode === 'agent') await sendAgent(text, attached); else await sendLegacy(text);
    } finally { setIsTyping(false); }
  };

  // Photos already in the thread get short-lived links
  useEffect(() => {
    const refs = agentMessages.map(m => m.meta?.photo).filter((r: unknown): r is string => typeof r === 'string' && !photoLinks.has(r));
    if (!refs.length) return;
    resolveMedia(refs).then(found => { if (found.size) setPhotoLinks(prev => new Map([...prev, ...found])); });
  }, [agentMessages]);

  const handleSendNote = async (id: string, text: string) => {
    const ok = await belluhAgent.sendNote(id, text);
    if (ok) setAgentMessages(prev => prev.map(m => m.id === id ? { ...m, body: text.trim(), meta: { ...m.meta, status: 'sent' } } : m));
  };
  const handleDiscardNote = async (id: string) => {
    const ok = await belluhAgent.discardNote(id);
    if (ok) setAgentMessages(prev => prev.map(m => m.id === id ? { ...m, meta: { ...m.meta, status: 'discarded' } } : m));
  };

  const onWeekChange = (w: WeekView, added: AgentMessage[]) => {
    setWeek(w);
    if (added.length) setAgentMessages(prev => [...prev, ...added]);
  };
  // The check-in buttons sit under the latest weekly message only
  const weeklyCardOn = week ? [...agentMessages].reverse().find(m => m.meta?.action_id === week.id && (m.meta?.kind === 'weekly' || m.meta?.kind === 'checkin'))?.id : undefined;

  const openMemories = async () => setMemories(await belluhAgent.memories());

  // Ways in, from what Belluh knows, until the person has started talking to it
  const starters: string[] = mode !== 'agent' || agentMessages.some(m => m.role === 'user') ? [] : [
    ...(partnerName ? [`What's been on ${partnerName}'s mind lately?`, `Help me say something to ${partnerName}`] : ['What patterns do you see in my journal?']),
    ...(week && !week.mine ? [`How do we make time for this week's thing?`] : []),
    partnerName ? 'Plan something small for us this weekend' : 'What should I write about today?',
  ];
  const sendNow = async (text: string) => {
    if (isTyping) return;
    setIsTyping(true);
    try { await sendAgent(text); } finally { setIsTyping(false); }
  };

  const me = firstName(userName);
  const spaceSwitch = (
    <div role="tablist" aria-label="Conversation" className="flex items-center bg-slate-100 rounded-full p-0.5 text-xs font-bold">
      <button role="tab" aria-selected={space === 'me'} onClick={() => pickSpace('me')} className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${space === 'me' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Just you</button>
      <button role="tab" aria-selected={space === 'us'} onClick={() => { pickSpace('us'); trackEvent('us_opened'); }} className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${space === 'us' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>You &amp; {partnerName}</button>
    </div>
  );

  const closeBtn = inSheet && onClose ? (
    <button aria-label="Close" onClick={onClose} className="ml-auto w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"><X size={16} /></button>
  ) : null;

  const greeting = partnerName
    ? `Hi${me ? ` ${me}` : ''}. I've read your journal, and the entries ${partnerName} shares with you. Tell me what's on your mind, ask me about a pattern, or ask me to help you say something to ${partnerName}.`
    : `Hi${me ? ` ${me}` : ''}. I've read your journal. Tell me what's on your mind, or ask me about a pattern you've noticed.`;

  if (mode === 'agent' && partnerName && space === 'us') {
    return <UsThread partnerName={partnerName} myName={userName} header={
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          {!inSheet && <><span className="text-sm font-bold font-serif text-belluh-900">Belluh</span><span className="text-belluh-200">/</span></>}{spaceSwitch}
          {closeBtn}
        </div>
      </div>
    } inSheet={inSheet} />;
  }

  return (
    <div className={`flex flex-col ${inSheet ? 'h-full' : 'h-screen'} bg-white text-slate-900 font-sans selection:bg-belluh-100`}>

       {/* Minimal Header */}
       <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-transparent">
         <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 p-1.5 rounded-lg">
                {!inSheet && <><span className="text-sm font-bold font-serif text-belluh-900">Belluh</span>
                <span className="text-belluh-200">/</span></>}
                {mode === 'agent' && partnerName ? spaceSwitch : (
                <span className="text-sm font-medium text-slate-500">
                  {mode === 'agent' ? 'Just you' : `${detectedPersona} Mode`}
                </span>)}
            </div>
            <div className="flex items-center gap-2">
              {isConflictMode && (
                  <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                      Conflict Mediator Active
                  </div>
              )}
              {mode === 'agent' && (
                <button onClick={openMemories} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-50">
                  <Brain size={14} /> Memory
                </button>
              )}
              {closeBtn}
            </div>
         </div>
       </div>

       {/* Chat Area */}
       <div className="flex-1 overflow-y-auto">
           <div className="max-w-3xl mx-auto px-4 pt-10 pb-4 space-y-8">

               {mode === 'loading' && (
                 <div className="flex gap-4 md:gap-6 animate-fade-in"><BelluhAvatar /><div className="h-4 w-40 mt-3 rounded-full bg-slate-100 animate-pulse" /></div>
               )}

               {/* Agent thread */}
               {mode === 'agent' && agentMessages.length === 0 && (
                 <div className="flex gap-4 md:gap-6 animate-slide-up"><BelluhAvatar /><p className="font-serif text-lg leading-relaxed text-slate-900">{greeting}</p></div>
               )}

               {mode === 'agent' && agentMessages.map(msg => {
                 if (msg.role === 'plan' && msg.meta?.plan_id) return (
                   <div key={msg.id} className="animate-slide-up flex gap-4 md:gap-6">
                     <BelluhAvatar />
                     <div className="flex-1 min-w-0 max-w-[85%] md:max-w-[80%]"><PlanCard planId={msg.meta.plan_id} partnerName={partnerName} /></div>
                   </div>
                 );
                 if (msg.role === 'note_draft') return <NoteDraft key={msg.id} msg={msg} onSend={handleSendNote} onDiscard={handleDiscardNote} />;
                 if (msg.role === 'partner_note') return (
                   <div key={msg.id} className="animate-slide-up flex gap-4 md:gap-6">
                     <div className="w-8 h-8 rounded-full bg-[#f7d8ee] flex items-center justify-center text-[#831843] shrink-0 mt-1"><Heart size={14} className="fill-[#f0addd] text-[#f0addd]" /></div>
                     <div className="max-w-[85%] rounded-3xl bg-[#f7d8ee] p-5">
                       <p className="text-xs font-bold text-[#831843] mb-2">From {msg.meta?.from_name || 'your partner'}, via Belluh</p>
                       <p className="font-serif text-[17px] leading-relaxed text-[#5e1c43] whitespace-pre-wrap">{msg.body}</p>
                     </div>
                   </div>
                 );
                 if (msg.role === 'user') return (
                   <div key={msg.id} className="group animate-slide-up flex justify-end">
                     <div className={`max-w-[85%] md:max-w-[80%] rounded-3xl p-5 md:p-6 text-[16px] leading-relaxed ${msg.meta?.mode === 'mediate' ? 'bg-rose-50 text-slate-800' : 'bg-slate-100 text-slate-800'}`}>
                       {(msg.meta?.photo_preview || (msg.meta?.photo && photoLinks.get(msg.meta.photo))) && (
                         <img src={msg.meta.photo_preview || photoLinks.get(msg.meta.photo)} alt="Your photo" className="mb-2 max-h-64 w-auto rounded-2xl object-cover" />
                       )}
                       {!(msg.meta?.photo || msg.meta?.photo_preview) || msg.body !== '(sent a photo)' ? <p className="font-medium whitespace-pre-wrap">{msg.body}</p> : null}
                       {(msg.meta as any)?.channel && <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">via {(msg.meta as any).channel === 'sms' ? 'text' : (msg.meta as any).channel === 'telegram' ? 'Telegram' : 'WhatsApp'}</p>}
                     </div>
                   </div>
                 );
                 return (
                   <div key={msg.id} className="group animate-slide-up flex gap-4 md:gap-6">
                     <BelluhAvatar />
                     <div className="max-w-[85%] md:max-w-[80%]">
                       {msg.meta?.entry_id && <p className="text-xs font-bold text-slate-300 mb-1">About your latest entry</p>}
                       {msg.meta?.kind === 'weekly' && <p className="text-xs font-bold text-slate-300 mb-1">Your week, from Belluh</p>}
                       {msg.meta?.kind === 'offer' && <p className="text-xs font-bold text-slate-300 mb-1">Belluh noticed</p>}
                       {msg.meta?.kind === 'remind' && <p className="text-xs font-bold text-slate-300 mb-1">Reminder you asked for</p>}
                       <p className="font-serif text-lg leading-relaxed text-slate-900 whitespace-pre-wrap">{revealIds.has(msg.id) ? <Reveal text={msg.body} onTick={() => messagesEndRef.current?.scrollIntoView({ block: 'end' })} /> : msg.body}</p>
                       {Array.isArray(msg.meta?.saved) && msg.meta.saved.length > 0 && (
                         <button onClick={openMemories} className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 text-left">
                           <Brain size={12} /> Saved to memory: {msg.meta.saved.join(', ')}
                         </button>
                       )}
                       <BelluhActions msg={msg} partnerName={partnerName} onCompose={onCompose} onBusy={setIsTyping} onAdded={(added, updated) => {
                         if (added.length) setRevealIds(prev => { const n = new Set(prev); added.forEach(m => { if (m.role === 'belluh') n.add(m.id); }); return n; });
                         setAgentMessages(prev => [...prev.map(m => (m.id === updated.id ? updated : m)), ...added]);
                       }} />
                       {week && msg.id === weeklyCardOn && <div className="mt-4"><WeeklyCard week={week} onChange={onWeekChange} compact /></div>}
                     </div>
                   </div>
                 );
               })}

               {/* Original chat, used only if the agent isn't available */}
               {mode === 'legacy' && reflection && messages.length === 1 && (
                   <div className="mb-12 animate-fade-in bg-belluh-50/50 p-6 rounded-3xl border border-belluh-100">
                        <div className="flex items-center gap-2 mb-3 text-belluh-400">
                            <Activity size={14} />
                            <span className="text-xs font-bold uppercase tracking-widest">Current Context</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-serif text-belluh-900 leading-relaxed italic opacity-90">
                            "{reflection.replace(/[*#]/g, '').trim()}"
                        </h2>
                   </div>
               )}

               {mode === 'legacy' && messages.map((msg) => (
                   <div key={msg.id} className={`group animate-slide-up ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                       <div className={`max-w-[85%] md:max-w-[80%] rounded-3xl p-5 md:p-6 text-[16px] leading-relaxed ${msg.role === 'user' ? 'bg-slate-100 text-slate-800' : 'bg-transparent text-slate-900 pl-0'}`}>
                           {msg.role === 'model' ? (
                               <div className="flex gap-4 md:gap-6">
                                   <BelluhAvatar />
                                   <div className="prose prose-slate prose-p:font-serif prose-p:text-lg prose-p:leading-relaxed max-w-none whitespace-pre-wrap">
                                       <p>{msg.text.replace(/[*#]/g, '')}</p>
                                   </div>
                               </div>
                           ) : (
                               <p className="font-medium">{msg.text}</p>
                           )}
                       </div>
                   </div>
               ))}

                {isTyping && (
                    <div className="flex gap-4 md:gap-6 animate-fade-in pl-0">
                        <BelluhAvatar />
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className="w-1.5 h-1.5 bg-belluh-300 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-belluh-300 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></span>
                            <span className="w-1.5 h-1.5 bg-belluh-300 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></span>
                            <span className="ml-2 text-xs font-bold text-slate-300">{agentMessages[agentMessages.length - 1]?.meta?.photo_preview ? 'Looking at your photo' : isConflictMode ? 'Finding the words' : 'Thinking'}</span>
                        </div>
                    </div>
                )}
                {/* Spacer the height of the input and tab bar, so the newest message is never hidden behind them */}
                <div ref={messagesEndRef} aria-hidden="true" className="h-72" />
           </div>
       </div>

       {/* Input Area */}
       <div className={`fixed bottom-0 left-0 right-0 p-4 ${inSheet ? 'pb-6' : 'pb-28'} bg-gradient-to-t from-white via-white to-transparent pt-12 z-40`}>
            <div className="max-w-2xl mx-auto relative flex flex-col">
                <div className="flex flex-wrap items-center gap-2 mb-3 pl-1">
                    {starters.map(t => (
                        <button key={t} onClick={() => sendNow(t)} disabled={isTyping}
                            className="shrink-0 py-1.5 px-4 rounded-full bg-white border border-belluh-100 text-xs font-bold text-belluh-900 hover:bg-belluh-50 disabled:opacity-50 shadow-sm">
                            {t}
                        </button>
                    ))}
                    <button
                        onClick={() => setIsConflictMode(!isConflictMode)}
                        className={`shrink-0 py-1.5 px-4 rounded-full transition-all duration-300 flex items-center gap-2 shadow-sm border text-xs font-bold uppercase tracking-wide ${isConflictMode ? 'bg-rose-50 text-rose-600 border-rose-100 ring-2 ring-rose-50 translate-y-1' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                        <Wand2 size={14} className={isConflictMode ? "animate-pulse" : ""} />
                        <span>{isConflictMode ? 'Mediation Active' : 'Mediate Conflict'}</span>
                    </button>
                </div>

                {photo && (
                    <div className="mb-2 ml-2 relative inline-block">
                        <img src={photo.preview} alt="Photo to send" className="h-20 w-20 object-cover rounded-2xl border border-slate-100 shadow-sm" />
                        <button aria-label="Remove photo" onClick={() => setPhoto(null)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center"><X size={12} /></button>
                    </div>
                )}
                <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setPhoto({ file: f, preview: URL.createObjectURL(f) }); e.target.value = ''; }} />
                <div className={`w-full relative rounded-[2rem] shadow-2xl transition-all duration-300 border flex items-center p-2 pr-3 min-h-[64px] bg-white ${isConflictMode ? 'shadow-rose-100/50 border-rose-100' : 'shadow-slate-200/50 border-slate-200 focus-within:shadow-belluh-200/60 focus-within:border-belluh-200'}`}>
                    <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        placeholder={isConflictMode ? "What happened? Be honest..." : "Message Belluh..."}
                        className="w-full bg-transparent border-none px-6 py-3 max-h-32 resize-none focus:outline-none text-slate-800 placeholder:text-slate-400 text-[16px] leading-relaxed self-center"
                        rows={1}
                        style={{ overflow: 'hidden' }}
                    />
                    {mode === 'agent' && (
                        <button aria-label="Add a photo" title="Show Belluh a photo" onClick={() => photoInput.current?.click()} disabled={isTyping}
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-slate-400 hover:text-belluh-600 hover:bg-belluh-50 transition-colors">
                            <ImagePlus size={19} />
                        </button>
                    )}
                    <button
                        aria-label="Send"
                        onClick={handleSendMessage}
                        disabled={(!chatInput.trim() && !photo) || isTyping}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ml-2 ${chatInput.trim() || photo ? 'bg-belluh-600 text-white hover:bg-belluh-700 active:scale-95' : 'bg-slate-100 text-slate-300'}`}
                    >
                        <ArrowUp size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <p className="text-center text-[10px] text-slate-300 mt-3 font-medium w-full">
                    {mode === 'agent' && partnerName ? `Belluh never sees ${partnerName}'s private entries. ` : ''}Belluh can make mistakes. Trust your heart.
                </p>
            </div>
       </div>

       {/* What Belluh remembers */}
       {memories && (
         <div className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in" onClick={() => setMemories(null)}>
           <div className="bg-white rounded-[2rem] w-full max-w-md max-h-[75vh] overflow-y-auto p-6 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
             <div className="flex items-center justify-between mb-1">
               <h3 className="font-serif text-xl text-slate-900">What Belluh remembers</h3>
               <button onClick={() => setMemories(null)} aria-label="Close" className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-500"><X size={18} /></button>
             </div>
             <p className="text-sm text-slate-500 mb-5">Only you see this. Remove anything, or tell Belluh "forget that" in the chat.</p>
             {memories.length === 0 && <p className="text-sm text-slate-400 italic">Nothing yet. Belluh saves lasting things you tell it, like what helps after a hard day.</p>}
             <ul className="divide-y divide-slate-100">
               {memories.map(m => (
                 <li key={m.id} className="flex items-start justify-between gap-3 py-3">
                   <p className="font-serif text-[15px] text-slate-800 leading-relaxed">{m.fact}</p>
                   <button
                     aria-label="Forget"
                     onClick={async () => { if (await belluhAgent.forget(m.id)) setMemories(prev => prev?.filter(x => x.id !== m.id) ?? null); }}
                     className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                   >
                     <Trash2 size={14} />
                   </button>
                 </li>
               ))}
             </ul>
           </div>
         </div>
       )}
    </div>
  );
};

export default AICoach;
