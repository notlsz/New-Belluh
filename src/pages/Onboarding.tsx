
import React, { useState, useEffect } from 'react';
import { Sparkles, Lock, ArrowRight, Heart, Mail, UserPlus, CheckCircle2, RefreshCw, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface OnboardingProps {
  onComplete: (partnerName: string, firstEntry: string) => void;
}

const PLACEHOLDERS = [
    "They made me coffee...",
    "The way they laughed...",
    "How they listened when I was stressed...",
    "A quiet moment we shared...",
    "The look they gave me...",
    "How safe I feel with them...",
    "Their patience with me today...",
    "A text that made me smile..."
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0);
  const [partnerName, setPartnerName] = useState('');
  const [entry, setEntry] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  // Invite State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'searching' | 'sent' | 'error' | 'not-found'>('idle');

  // Rotating Placeholders Logic
  useEffect(() => {
      if (step === 2 && !entry) {
          const interval = setInterval(() => {
              setPlaceholderIndex(i => (i + 1) % PLACEHOLDERS.length);
          }, 3000);
          return () => clearInterval(interval);
      }
  }, [step, entry]);

  const handleShufflePrompt = (e: React.MouseEvent) => {
      e.preventDefault();
      setPlaceholderIndex(i => (i + 1) % PLACEHOLDERS.length);
  };

  const handlePartnerNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (partnerName.trim()) setStep(2);
  };

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entry.trim()) {
      setIsAnimating(true);
      setTimeout(() => setStep(3), 2000); 
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail.trim()) return;
      
      setInviteStatus('searching');
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("No user");

          // 1. Look up profile by email (RLS allows this)
          // Uses .ilike for case-insensitive email matching
          // Exact match on the server; no wildcard search over other people's emails
          const { data: partnerId } = await supabase.rpc('find_user_by_email', { p_email: inviteEmail.trim() });

          if (!partnerId) {
              setInviteStatus('not-found');
              return;
          }
          if (partnerId === user.id) {
              alert("You cannot invite yourself!");
              setInviteStatus('idle');
              return;
          }

          // 2. Insert Pending Connection
          const { error } = await supabase.from('partner_connections').insert({
              user_id: user.id,
              partner_id: partnerId,
              status: 'pending' // In-app invite only
          });

          if (error) {
              // likely duplicate key or similar; log but proceed
              console.error(error);
          }
          
          setInviteStatus('sent');
          setTimeout(() => finish(), 2000);
          
      } catch (err) {
          console.error(err);
          setInviteStatus('error');
      }
  };

  const finish = () => {
    onComplete(partnerName, entry);
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 md:p-8 relative overflow-hidden">
      {/* Soft brand light, the same as the landing page */}
      <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-[#CDE9F2]/50 blur-[110px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-32 w-[520px] h-[520px] rounded-full bg-[#f0addd]/25 blur-[120px] pointer-events-none"></div>
      <div className="relative z-10 w-full flex flex-col items-center">

      {/* Step 0: Welcome & Trust */}
      {step === 0 && (
        <div className="w-full max-w-md md:max-w-lg mx-auto text-center animate-slide-up">
          <div className="relative w-20 h-20 mx-auto mb-8 [@media(max-height:720px)]:hidden">
            <div className="absolute inset-0 rounded-full bg-[#f0addd]/40 blur-xl animate-pulse"></div>
            <div className="relative w-20 h-20 rounded-full bg-white border border-white shadow-[0_20px_50px_-12px_rgba(240,173,221,0.6)] flex items-center justify-center">
              <Lock size={28} strokeWidth={1.75} className="text-[#f0addd]" />
            </div>
          </div>

          <h1 className="text-[2.6rem] md:text-6xl font-serif leading-[1.1] tracking-tight mb-5">
            <span className="text-[#9bbecb]">Your story,</span><br />
            <span className="text-[#f0addd] italic">kept between you.</span>
          </h1>
          <p className="text-lg text-slate-500 font-light leading-relaxed mb-8 max-w-sm mx-auto">
            A private journal for the two of you, and an AI that knows you both.
          </p>

          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] px-2 text-left mb-8 divide-y divide-slate-100">
            {[
              { icon: <Lock size={16} />, title: 'Just me, when you want', text: 'Mark any entry Just me and only you can read it.' },
              { icon: <Heart size={16} />, title: 'Shared with your partner', text: 'Everything else lands in the story you write together.' },
              { icon: <EyeOff size={16} />, title: 'Belluh keeps secrets too', text: 'It never tells your partner what you wrote privately.' },
            ].map(r => (
              <div key={r.title} className="flex items-start gap-4 px-4 py-4 [@media(max-height:720px)]:py-3">
                <div className="w-10 h-10 rounded-full bg-[#CDE9F2]/60 text-[#3f7486] flex items-center justify-center shrink-0">{r.icon}</div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-slate-900">{r.title}</p>
                  <p className="text-sm text-slate-500 leading-relaxed mt-0.5">{r.text}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full bg-[#f0addd] text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#e57ec3] transition-all shadow-xl shadow-[#f0addd]/30 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span>Begin</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Step 1: Partner Name */}
      {step === 1 && (
        <form onSubmit={handlePartnerNameSubmit} className="w-full max-w-md animate-slide-up">
           <label className="block text-xs font-bold text-belluh-400 uppercase tracking-widest mb-6 text-center">Let's begin</label>
           <h2 className="text-3xl font-serif text-slate-900 mb-8 text-center">What do you call your partner?</h2>
           <input 
             autoFocus
             type="text" 
             value={partnerName}
             onChange={(e) => setPartnerName(e.target.value)}
             placeholder="Name or nickname..."
             className="w-full bg-transparent border-b-2 border-slate-200 py-4 text-center text-3xl font-serif text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-belluh-300 transition-colors"
           />
           <button 
             type="submit" 
             disabled={!partnerName.trim()}
             className="mt-12 w-full bg-[#f0addd] text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-belluh-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow hover:shadow-lg hover:-translate-y-1"
           >
             <span>Continue</span>
             <ArrowRight size={16} />
           </button>
        </form>
      )}

      {/* Step 2: Magic Prompt */}
      {step === 2 && (
        <form onSubmit={handleEntrySubmit} className="w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-center gap-2 mb-6 opacity-60">
                <Heart size={14} className="fill-belluh-300 text-belluh-300" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">First Magic Moment</span>
            </div>
           <h2 className="text-3xl font-serif text-slate-900 mb-6 text-center leading-tight">
             Tell me one thing you love about {partnerName} today.
           </h2>
           <div className="relative mb-8">
               <textarea 
                 autoFocus
                 value={entry}
                 onChange={(e) => setEntry(e.target.value)}
                 placeholder={PLACEHOLDERS[placeholderIndex]}
                 rows={3}
                 className="w-full bg-slate-50 p-6 rounded-3xl text-xl font-serif text-slate-900 placeholder:text-slate-300 focus:outline-none resize-none"
               />
               <button 
                   type="button"
                   onClick={handleShufflePrompt}
                   className="absolute right-4 bottom-4 p-2 text-slate-400 hover:text-belluh-400 bg-white rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
                   title="Shuffle Idea"
               >
                   <RefreshCw size={16} />
               </button>
           </div>
           
           <button 
             type="submit" 
             disabled={!entry.trim() || isAnimating}
             className="w-full bg-belluh-300 text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-belluh-400 transition-all shadow-glow disabled:opacity-50"
           >
             {isAnimating ? (
                <>
                    <Sparkles size={18} className="animate-spin" />
                    <span>Analyzing...</span>
                </>
             ) : (
                <>
                    <span>Create Magic</span>
                    <Sparkles size={18} />
                </>
             )}
           </button>
        </form>
      )}

      {/* Step 3: The Aha Moment */}
      {step === 3 && (
        <div className="w-full max-w-md animate-scale-in text-center">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-apple border border-slate-50 relative overflow-hidden">
                {/* AI Glow Background */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-belluh-100 rounded-full blur-3xl opacity-50"></div>
                
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-belluh-50 rounded-full flex items-center justify-center mx-auto mb-4 text-belluh-500">
                        <Sparkles size={24} />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">I've saved this forever.</h3>
                    <p className="text-slate-600 font-serif italic mb-6">
                        "Tonight, I will gently remind {partnerName} about this moment. It might just make their day."
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-8">
                         <div className="h-px bg-slate-100 w-12"></div>
                         <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Belluh Promise</span>
                         <div className="h-px bg-slate-100 w-12"></div>
                    </div>
                    <button 
                        onClick={() => setStep(4)}
                        className="w-full bg-[#f0addd] text-white py-3 rounded-2xl font-bold hover:bg-belluh-400 transition-transform active:scale-95 shadow-lg shadow-belluh-200/50 flex items-center justify-center gap-2"
                    >
                        <span>Continue</span>
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Step 4: Simple Invite (New) */}
      {step === 4 && (
        <div className="w-full max-w-md animate-slide-up">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 text-center relative overflow-hidden">
                
                <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <UserPlus size={28} />
                </div>

                <h2 className="text-2xl font-serif text-slate-900 mb-3">Invite {partnerName}</h2>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed px-4">
                   Enter their email to send an in-app invite. They must have a Belluh account.
                </p>

                {inviteStatus === 'sent' ? (
                    <div className="py-8 animate-pop">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} className="text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Invite Created!</h3>
                        <p className="text-sm text-slate-500 mt-2">They'll see it when they log in.</p>
                    </div>
                ) : (
                    <form onSubmit={handleInviteSubmit} className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="email" 
                                required
                                autoFocus
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder={`${partnerName.toLowerCase() || 'partner'}@email.com`}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-belluh-200 transition-all"
                            />
                        </div>

                        {inviteStatus === 'not-found' && (
                            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold">
                                User not found. Ask them to create an account first!
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={inviteStatus === 'searching'}
                            className="w-full bg-[#f0addd] text-white py-4 rounded-xl font-bold hover:bg-belluh-400 transition-all shadow-lg active:scale-95 disabled:opacity-70"
                        >
                            {inviteStatus === 'searching' ? 'Connecting...' : 'Send Invite'}
                        </button>
                    </form>
                )}

                {inviteStatus !== 'sent' && (
                    <button 
                        onClick={finish} 
                        className="mt-6 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                    >
                        Skip for now
                    </button>
                )}
            </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default Onboarding;
