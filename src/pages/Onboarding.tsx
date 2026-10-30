import React, { useState, useEffect, useRef } from 'react';
import { Lock, ArrowRight, Heart, EyeOff, RefreshCw, Link2, Mail, Check, Copy } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import BelluhOrb from '../components/BelluhOrb';
import BelluhSpeech from '../components/BelluhSpeech';
import { belluh } from '../lib/belluhPresence';

interface OnboardingProps {
  onComplete: (partnerName: string, firstEntry: string) => void | Promise<void>;
}

const PLACEHOLDERS = [
  'They made me coffee...',
  'The way they laughed...',
  'How they listened when I was stressed...',
  'A quiet moment we shared...',
  'The look they gave me...',
  'How safe I feel with them...',
  'Their patience with me today...',
  'A text that made me smile...',
];

// What Belluh says when you tap it on the welcome screen
const TAPS = ['That tickles.', "I'm made of water. Every word I say moves me.", 'Later, ask me to become anything. A cat, a lighthouse, the first letter of their name.', 'Ready when you are.'];

const STEPS = ['Welcome', 'Your partner', 'First words', 'Saved', 'Invite'];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [partnerName, setPartnerName] = useState('');
  const [entry, setEntry] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [line, setLine] = useState({ id: 0, text: "Hi. I'm Bella." });
  const [moment, setMoment] = useState<'none' | 'named' | 'keeping'>('none');
  const [taps, setTaps] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const releaseRef = useRef<null | (() => void)>(null);

  // Invite
  const [link, setLink] = useState<string | null>(null);
  const [linkState, setLinkState] = useState<'idle' | 'making' | 'copied' | 'shared' | 'error'>('idle');
  const [showEmail, setShowEmail] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'searching' | 'sent' | 'error' | 'not-found' | 'self'>('idle');

  const name = partnerName.trim();
  const say = (text: string) => setLine(l => ({ id: l.id + 1, text }));

  useEffect(() => { belluh.prefetch(); return () => { releaseRef.current?.(); }; }, []);

  useEffect(() => {
    if (step === 2 && !entry) {
      const interval = setInterval(() => setPlaceholderIndex(i => (i + 1) % PLACEHOLDERS.length), 3000);
      return () => clearInterval(interval);
    }
  }, [step, entry]);

  const go = (next: number, text: string) => { setStep(next); say(text); };

  const tapOrb = () => {
    if (step !== 0) return;
    say(TAPS[taps % TAPS.length]);
    setTaps(t => t + 1);
  };

  const handleName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || moment !== 'none') return;
    // A little moment: the water becomes a heart, then on to the first entry
    belluh.become({ emoji: '❤️' }, 'heart', false);
    setMoment('named');
    say(`${name}. I like them already.`);
    setTimeout(() => {
      setMoment('none');
      belluh.become('water', 'water', false);
      go(2, `Tell me one thing you love about ${name} today.`);
    }, 2600);
  };

  const handleEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry.trim() || moment !== 'none') return;
    setMoment('keeping');
    releaseRef.current = belluh.holdThinking();
    setTimeout(() => {
      releaseRef.current?.(); releaseRef.current = null;
      setMoment('none');
      go(3, "I've saved this forever.");
    }, 1800);
  };

  // A one-time invite link (works even if they aren't on Belluh yet)
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

  const shareLink = async () => {
    setLinkState('making');
    const url = await makeLink().catch(() => null);
    if (!url) { setLinkState('error'); return; }
    const text = `Join me on Belluh, our journal for two: ${url}`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Belluh', text, url }); setLinkState('shared'); say(`Sent. I'll tell you when ${name || 'they'} joins.`); return; }
    } catch (err: any) {
      if (err?.name === 'AbortError') { setLinkState('idle'); return; }
    }
    try { await navigator.clipboard.writeText(url); setLinkState('copied'); say(`Copied. Send it to ${name || 'them'} however you like.`); }
    catch { setLinkState('idle'); } // the link is on screen to copy by hand
  };

  const copyLink = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setLinkState('copied'); } catch { /* selectable below */ }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteStatus('searching');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      const { data: partnerId } = await supabase.rpc('find_user_by_email', { p_email: inviteEmail.trim() });
      if (!partnerId) { setInviteStatus('not-found'); return; }
      if (partnerId === user.id) { setInviteStatus('self'); return; }
      const { error } = await supabase.from('partner_connections').insert({ user_id: user.id, partner_id: partnerId, status: 'pending' });
      if (error && error.code !== '23505') throw error;
      setInviteStatus('sent');
      say(`Invite sent. ${name || 'They'} will see it next time they open Belluh.`);
    } catch (err) {
      console.error(err);
      setInviteStatus('error');
    }
  };

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    belluh.become('water', 'water', false);
    try { await onComplete(name, entry.trim()); }
    finally { setFinishing(false); }
  };

  const invited = inviteStatus === 'sent' || !!link;
  const short = typeof window !== 'undefined' && window.innerHeight < 860;
  const orbSize = step === 0 ? (short ? 100 : 132) : step === 3 ? (short ? 104 : 120) : 92;

  return (
    <div className="min-h-[100svh] bg-paper flex flex-col items-center px-6 pt-6 pb-10 md:pb-14 relative overflow-hidden">
      <style>{`
        @keyframes ob-rise { from { opacity: 0; transform: translateY(28px) scale(.7); } to { opacity: 1; transform: none; } }
        @keyframes ob-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes ob-drop { 0% { opacity: 0; transform: translate(0,0) scale(.4); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1); } }
        @keyframes ob-drift { 0%,100% { transform: translate(0,0); } 50% { transform: translate(3%, -4%); } }
        .ob-rise { animation: ob-rise .9s cubic-bezier(.2,.9,.25,1.15) both; }
        .ob-in { animation: ob-in .6s ease-out both; }
        .ob-drop { position: absolute; left: 50%; top: 50%; width: 10px; height: 10px; margin: -5px; border-radius: 9999px; animation: ob-drop 1.4s cubic-bezier(.15,.7,.3,1) both; }
        .ob-drift { animation: ob-drift 14s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .ob-rise, .ob-in, .ob-drop, .ob-drift { animation: none !important; } .ob-drop { display: none; } }
      `}</style>

      {/* Soft brand light, the same as the landing page, drifting slowly */}
      <div className="ob-drift absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-[#CDE9F2]/60 blur-[110px] pointer-events-none"></div>
      <div className="ob-drift absolute -bottom-40 -right-32 w-[560px] h-[560px] rounded-full bg-[#f0addd]/30 blur-[120px] pointer-events-none" style={{ animationDelay: '-7s' }}></div>

      {/* Progress: four steps, filled as you go */}
      <div className="relative z-10 w-full max-w-md flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
        {STEPS.map((s, i) => (
          <div key={s} className="h-1 flex-1 rounded-full bg-slate-200/70 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#9bbecb] to-[#f0addd] transition-all duration-700 ease-out" style={{ width: i <= step ? '100%' : '0%' }} />
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center">
        {/* Belluh, present through every step */}
        <div className="relative ob-rise mt-6 mb-4">
          <div className={`absolute inset-[-30%] rounded-full bg-[radial-gradient(circle,rgba(205,233,242,0.95)_0%,rgba(205,233,242,0)_65%)] blur-2xl pointer-events-none transition-transform duration-700 ${moment !== 'none' || step === 3 ? 'scale-125' : 'scale-100'}`}></div>
          {(moment === 'named' || step === 3) && (
            <div key={`${step}-${moment}`} aria-hidden="true">
              {Array.from({ length: 14 }, (_, i) => {
                const a = (i / 14) * Math.PI * 2, r = 90 + (i % 3) * 26;
                return <span key={i} className="ob-drop" style={{ ['--dx' as any]: `${Math.cos(a) * r}px`, ['--dy' as any]: `${Math.sin(a) * r}px`, background: i % 2 ? '#f0addd' : '#9bbecb', animationDelay: `${(i % 4) * 60}ms`, width: 6 + (i % 3) * 3, height: 6 + (i % 3) * 3 } as React.CSSProperties} />;
              })}
            </div>
          )}
          <BelluhOrb size={orbSize} onTap={tapOrb} label="Bella" />
        </div>
        <p className="min-h-[2rem] mb-6 text-center font-serif text-lg md:text-xl text-slate-600 max-w-sm" aria-live="polite">
          <BelluhSpeech key={line.id} text={line.text} delay={line.id === 0 ? 600 : 0} />
        </p>

        {/* Step 0: welcome and trust */}
        {step === 0 && (
          <div className="w-full max-w-md md:max-w-lg mx-auto text-center">
            <h1 className="ob-in text-[2.5rem] md:text-6xl font-serif leading-[1.08] tracking-tight mb-4" style={{ animationDelay: '.5s' }}>
              <span className="text-[#9bbecb]">Your story,</span><br />
              <span className="text-[#f0addd] italic">kept between you.</span>
            </h1>
            <p className="ob-in text-lg text-slate-500 font-light leading-relaxed mb-7 max-w-sm mx-auto" style={{ animationDelay: '.7s' }}>
              A private journal for the two of you, and an AI that knows you both.
            </p>
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] px-2 py-1.5 text-left mb-7">
              {[
                { icon: <Lock size={18} strokeWidth={1.75} />, title: 'Just me, when you want', text: 'Mark any entry Just me and only you can read it.' },
                { icon: <Heart size={18} strokeWidth={1.75} />, title: 'Shared with your partner', text: 'Everything else lands in the story you write together.' },
                { icon: <EyeOff size={18} strokeWidth={1.75} />, title: 'Belluh keeps secrets too', text: 'It never tells your partner what you wrote privately.' },
              ].map((r, i) => (
                <div key={r.title} className="ob-in flex items-start gap-4 px-5 py-3.5 [@media(max-height:860px)]:py-2.5" style={{ animationDelay: `${0.9 + i * 0.15}s` }}>
                  <div className="w-5 pt-0.5 text-[#9bbecb] shrink-0">{r.icon}</div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-slate-900">{r.title}</p>
                    <p className="text-sm text-slate-500 leading-relaxed mt-0.5">{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => go(1, 'First things first.')}
              className="ob-in w-full bg-slate-900 text-white h-14 rounded-full font-bold text-[15px] hover:bg-black shadow-[0_18px_40px_-18px_rgba(15,23,42,0.6)] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ animationDelay: '1.4s' }}
            >
              <span>Begin</span>
              <ArrowRight size={16} />
            </button>
            <p className="ob-in mt-4 text-xs text-slate-400" style={{ animationDelay: '1.6s' }}>Tip: tap Belluh.</p>
          </div>
        )}

        {/* Step 1: partner's name */}
        {step === 1 && (
          <form onSubmit={handleName} className="w-full max-w-md ob-in">
            <h2 className="text-3xl md:text-4xl font-serif text-slate-900 mb-8 text-center">What do you call your partner?</h2>
            <input
              autoFocus
              type="text"
              value={partnerName}
              onChange={(e) => { setPartnerName(e.target.value); belluh.key(); }}
              placeholder="Name or nickname"
              maxLength={40}
              disabled={moment !== 'none'}
              className="w-full bg-transparent border-b-2 border-slate-200 py-4 text-center text-4xl font-serif italic text-[#f0addd] placeholder:not-italic placeholder:text-slate-300 focus:outline-none focus:border-[#9bbecb] transition-colors"
            />
            <button
              type="submit"
              disabled={!name || moment !== 'none'}
              className="mt-12 w-full bg-slate-900 text-white h-14 rounded-full font-bold text-[15px] hover:bg-black shadow-[0_18px_40px_-18px_rgba(15,23,42,0.6)] flex items-center justify-center gap-2 transition-all disabled:opacity-25 disabled:shadow-none disabled:cursor-not-allowed hover:-translate-y-0.5"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Step 2: first words */}
        {step === 2 && (
          <form onSubmit={handleEntry} className="w-full max-w-md ob-in">
            <div className="relative mb-6">
              <textarea
                autoFocus
                value={entry}
                onChange={(e) => { setEntry(e.target.value); belluh.key(); }}
                placeholder={PLACEHOLDERS[placeholderIndex]}
                rows={4}
                disabled={moment !== 'none'}
                className="w-full bg-white/80 backdrop-blur-xl border border-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] p-6 pr-14 rounded-3xl text-xl font-serif text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#CDE9F2] resize-none"
              />
              <button
                type="button"
                onClick={() => setPlaceholderIndex(i => (i + 1) % PLACEHOLDERS.length)}
                className="absolute right-4 bottom-4 p-2 text-slate-400 hover:text-[#9bbecb] transition-colors active:scale-95"
                title="Another idea"
                aria-label="Show another idea"
              >
                <RefreshCw size={18} />
              </button>
            </div>
            <button
              type="submit"
              disabled={!entry.trim() || moment !== 'none'}
              className="w-full bg-slate-900 text-white h-14 rounded-full font-bold text-[15px] hover:bg-black shadow-[0_18px_40px_-18px_rgba(15,23,42,0.6)] flex items-center justify-center gap-2 transition-all disabled:opacity-25 disabled:shadow-none"
            >
              {moment === 'keeping' ? <span>Keeping it safe...</span> : <><span>Keep it</span><ArrowRight size={16} /></>}
            </button>
            <p className="mt-4 text-center text-xs text-slate-400">Only you can see this one. You choose what to share later.</p>
          </form>
        )}

        {/* Step 3: the first page */}
        {step === 3 && (
          <div className="w-full max-w-md ob-in text-center">
            <div className="bg-white/85 backdrop-blur-xl p-7 md:p-8 rounded-[2.5rem] shadow-[0_30px_80px_-30px_rgba(63,116,134,0.4)] border border-white relative overflow-hidden">
              <p className="text-[13px] font-semibold text-[#9bbecb] mb-4">Page one of your story</p>
              <p className="font-serif text-xl md:text-2xl leading-relaxed text-slate-800">"{entry.trim()}"</p>
              <p className="mt-6 text-sm text-slate-500 leading-relaxed">
                Every Sunday Belluh reads what you both write and brings you one small thing to try together.
              </p>
            </div>
            <button
              onClick={() => go(4, `Belluh is better with ${name || 'two'}.`)}
              className="mt-7 w-full bg-slate-900 text-white h-14 rounded-full font-bold text-[15px] hover:bg-black shadow-[0_18px_40px_-18px_rgba(15,23,42,0.6)] transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 4: invite */}
        {step === 4 && (
          <div className="w-full max-w-md ob-in text-center">
            <h2 className="text-3xl md:text-4xl font-serif text-slate-900 mb-3">Bring {name || 'your partner'} in.</h2>
            <p className="text-slate-500 mb-7 leading-relaxed">Send them your link. When they join, your journals connect and Bella knows you both.</p>

            <button
              onClick={shareLink}
              disabled={linkState === 'making'}
              className="w-full bg-slate-900 text-white h-14 rounded-full font-bold text-[15px] hover:bg-black shadow-[0_18px_40px_-18px_rgba(15,23,42,0.6)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {linkState === 'copied' || linkState === 'shared' ? <><Check size={18} /><span>{linkState === 'copied' ? 'Link copied' : 'Link sent'}</span></> : <><Link2 size={18} /><span>{linkState === 'making' ? 'Making your link...' : `Send ${name || 'them'} your link`}</span></>}
            </button>
            {linkState === 'error' && <p className="mt-3 text-sm text-rose-500">Couldn't make a link just now. Try again, or invite by email.</p>}
            {link && (
              <div className="mt-3 flex items-center gap-2 bg-white/80 border border-white rounded-2xl pl-4 pr-1.5 py-1.5 shadow-sm">
                <span className="flex-1 min-w-0 truncate text-left text-sm text-slate-500 select-all">{link}</span>
                <button onClick={copyLink} aria-label="Copy link" className="shrink-0 p-2 text-slate-400 hover:text-[#9bbecb]"><Copy size={16} /></button>
              </div>
            )}

            {!showEmail ? (
              <button onClick={() => setShowEmail(true)} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                <Mail size={15} /> Already on Belluh? Invite by email
              </button>
            ) : inviteStatus === 'sent' ? (
              <p className="mt-5 text-sm font-bold text-[#3f7486] flex items-center justify-center gap-2"><Check size={16} /> Invite sent. They'll see it when they open Belluh.</p>
            ) : (
              <form onSubmit={handleInviteSubmit} className="mt-5 flex gap-2">
                <input
                  type="email"
                  required
                  autoFocus
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteStatus('idle'); }}
                  placeholder={`${(name || 'partner').toLowerCase().replace(/\s+/g, '')}@email.com`}
                  aria-label="Their email"
                  className="flex-1 min-w-0 bg-white/80 border border-white rounded-full px-5 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#CDE9F2]"
                />
                <button type="submit" disabled={inviteStatus === 'searching'} className="shrink-0 px-5 rounded-full bg-slate-900 text-white text-sm font-bold disabled:opacity-60">
                  {inviteStatus === 'searching' ? 'Sending...' : 'Invite'}
                </button>
              </form>
            )}
            {inviteStatus === 'not-found' && <p className="mt-3 text-sm text-slate-500">They're not on Belluh yet. Send them your link instead, it works for new accounts.</p>}
            {inviteStatus === 'self' && <p className="mt-3 text-sm text-slate-500">That's your own email. Try theirs.</p>}
            {inviteStatus === 'error' && <p className="mt-3 text-sm text-rose-500">Couldn't send that invite. Try again, or send your link.</p>}

            <button
              onClick={finish}
              disabled={finishing}
              className={`mt-8 w-full py-4 rounded-full font-bold transition-all active:scale-[0.98] disabled:opacity-60 ${invited ? 'bg-slate-900 text-white hover:bg-black shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {finishing ? 'Opening your journal...' : invited ? 'Start writing' : 'Skip for now'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
