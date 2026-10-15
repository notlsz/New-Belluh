

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Lock, Menu, X, ChevronDown } from 'lucide-react';
import { rememberCta } from '../services/analytics';
import BelluhOrb from '../components/BelluhOrb';
import BelluhSpeech from '../components/BelluhSpeech';
import LandingDemos from '../components/LandingDemos';
import { belluh, type BelluhState } from '../lib/belluhPresence';
import { ORGANIZATIONS } from '../constants';

const FAQ = [
  { q: 'Can my partner read my private entries?', a: 'No. Every entry is shared or private, your call. Your partner never sees your private entries, and neither does their Belluh.' },
  { q: 'What does Belluh actually do?', a: 'It remembers what matters to you both, plans dates your partner can accept with one tap, gets a table ready to book, reminds you before birthdays and anniversaries, sends the reminders you ask for, helps you find the words for a note, and every Sunday gives you one insight and one small thing to try together.' },
  { q: 'Do we both need to sign up?', a: "Belluh is made for two, so it's best together. You can start on your own and send your partner the link whenever you're ready." },
  { q: 'Is Belluh an AI girlfriend or boyfriend?', a: "No. Belluh doesn't flirt or play a partner. It works for the two of you and points you back to each other." },
  { q: 'Can I use it from WhatsApp or text?', a: "Yes. Connect WhatsApp, SMS or Telegram in Settings with one tap and text Belluh like you'd talk to it in the app. Same Belluh, same memory." },
  { q: 'Why is Belluh made of water?', a: "So you can see what it's doing. It ripples when you type, swirls while it thinks, and moves with every word it says. Ask it to become something, a cat, a lighthouse, the first letter of your name, and it takes that shape." },
  { q: 'What happens to my data?', a: "Your entries are encrypted in storage and in transit, and never sold. Belluh's replies are written by Google's Gemini models, which process your entries to write them." },
  { q: 'Is it free?', a: 'Yes, Belluh is free to start.' },
];

const STEPS = [
  { n: '1', title: 'Write a few lines', text: 'A minute a day each. Keep it private, or share it with your partner.' },
  { n: '2', title: 'Belluh connects the dots', text: 'Every Sunday, one small thing to try, drawn from what you both wrote.' },
  { n: '3', title: 'Plan it together', text: 'Ask in your shared thread. Belluh suggests times, and your partner picks one.' },
];

// A real app screen in a phone frame; sizes scale with the phone's width
const PhoneFrame: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = '' }) => (
  <div className={`[container-type:inline-size] ${className}`}>
    <div className="rounded-[15cqw] bg-[#0f172a] p-[2.6cqw] shadow-[0_50px_100px_-30px_rgba(15,23,42,0.45),0_30px_80px_-30px_rgba(240,173,221,0.55)] ring-1 ring-black/5">
      <img src={src} alt={alt} width={390} height={898} loading="lazy" className="block w-full h-auto rounded-[12.6cqw]" />
    </div>
  </div>
);

const FaqItem: React.FC<{ q: string; a: string; open: boolean; onToggle: () => void }> = ({ q, a, open, onToggle }) => (
  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <button onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between gap-4 text-left px-6 md:px-8 py-5 md:py-6">
      <span className="font-serif text-lg md:text-xl text-slate-900">{q}</span>
      <ChevronDown size={20} className={`shrink-0 text-[#9bbecb] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <p className="px-6 md:px-8 pb-6 -mt-1 text-slate-500 leading-relaxed">{a}</p>}
  </div>
);

// What Belluh connects to, shown in the second scrolling strip
const INTEGRATIONS = [
  { name: 'WhatsApp', domain: 'whatsapp.com' },
  { name: 'Google Calendar', domain: 'calendar.google.com' },
  { name: 'Apple iCloud', domain: 'icloud.com' },
  { name: 'Outlook', domain: 'outlook.live.com' },
  { name: 'Gemini', domain: 'gemini.google.com' },
];

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onShowLegal: (type: 'tos' | 'privacy') => void;
  onGoToAbout: () => void;
  onGoToCareers: () => void;
}

const LogoItem = ({ org }: { org: { name: string; domain: string } }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <span className="text-sm font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap px-4 font-sans opacity-60 hover:opacity-100 transition-opacity">
        {org.name}
      </span>
    );
  }

  return (
    <img 
      src={`https://www.google.com/s2/favicons?domain=${org.domain}&sz=128`} 
      alt={org.name} 
      onError={() => setError(true)}
      className="max-h-12 max-w-full w-auto opacity-40 hover:opacity-100 hover:scale-110 transition-all duration-500 grayscale hover:grayscale-0 object-contain" 
    />
  );
};

const LogoMarquee = ({ title, orgs, note, repeat = 2 }: { title: string; orgs: { name: string; domain: string }[]; note: string; repeat?: number }) => (
  <div className="w-full py-20 overflow-hidden relative z-20 bg-[#F8FDFF]/80 backdrop-blur-md border-y border-[#CDE9F2]">
    <div className="text-center mb-10 px-4">
      <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-[0.2em] md:tracking-[0.3em] uppercase md:border-b md:border-[#CDE9F2] md:pb-3">
        {title}
      </span>
    </div>
    
    <div className="relative flex overflow-hidden group">
      <div className="absolute inset-y-0 left-0 w-24 md:w-32 bg-gradient-to-r from-[#F8FDFF] z-10" />
      <div className="absolute inset-y-0 right-0 w-24 md:w-32 bg-gradient-to-l from-[#F8FDFF] z-10" />
      <div className="flex animate-marquee items-center w-max group-hover:[animation-play-state:paused]">
        {Array.from({ length: repeat }, () => orgs).flat().map((org, i) => (
          <div key={i} className="mx-8 md:mx-12 shrink-0 flex items-center justify-center h-16 w-32">
             <LogoItem org={org} />
          </div>
        ))}
      </div>
    </div>

    <div className="text-center mt-8">
      <span className="text-[10px] text-slate-300 font-medium tracking-wide uppercase">
        {note}
      </span>
    </div>
  </div>
);


// Tap Belluh and it becomes something else, then back to water
const FUN_SHAPES: { emoji: string; label: string }[] = [
  { emoji: '🦒', label: 'giraffe' }, { emoji: '🐈', label: 'cat' }, { emoji: '🐬', label: 'dolphin' }, { emoji: '🦋', label: 'butterfly' },
  { emoji: '🦖', label: 'dinosaur' }, { emoji: '🌻', label: 'sunflower' }, { emoji: '🚀', label: 'rocket' }, { emoji: '❤️', label: 'heart' },
];
function useShapeTap() {
  const [n, setN] = useState(-1);
  const cur = useRef(-1);
  const tap = () => {
    const next = cur.current + 1 >= FUN_SHAPES.length ? -1 : cur.current + 1;
    if (next < 0) belluh.become('water', 'water', false);
    else belluh.become({ emoji: FUN_SHAPES[next].emoji }, FUN_SHAPES[next].label, false);
    cur.current = next; setN(next);
  };
  return { tap, label: n < 0 ? null : FUN_SHAPES[n].label };
}

const TRY_EXAMPLES = ['turn into a cat', 'become a sunflower', 'turn into the letter J', 'become a rocket', 'turn into a dolphin', 'become a heart'];
const withArticle = (thing: string) => (/^(the|a|an)\s/i.test(thing) ? thing : `${/^[aeiou]/i.test(thing) ? 'an' : 'a'} ${thing}`);

// Belluh, live: it listens as you type, thinks, talks word by word, and becomes what you ask for
const MeetBelluh: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const [state, setState] = useState<BelluhState>(belluh.state());
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState({ id: 0, text: "Hi, I'm Belluh. Ask me to become anything." });
  const [hint, setHint] = useState(0);
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  useEffect(() => belluh.subscribe(setState), []);
  useEffect(() => { belluh.prefetch(); const onR = () => setWide(window.innerWidth >= 768); window.addEventListener('resize', onR); return () => window.removeEventListener('resize', onR); }, []);
  useEffect(() => { const t = setInterval(() => setHint(h => (h + 1) % TRY_EXAMPLES.length), 2600); return () => clearInterval(t); }, []);
  const say = (t: string) => setReply(r => ({ id: r.id + 1, text: t }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    setText(''); setBusy(true);
    const release = belluh.holdThinking();
    const res = await belluh.tryShape(t).catch(() => ({ asked: false, done: false, subject: '' }));
    await new Promise(r => setTimeout(r, 650));
    release(); setBusy(false);
    if (res.asked && res.subject === 'water') say("Back to water. This is where I'm most myself.");
    else if (res.done) say(`Here I am as ${withArticle(res.subject)}. Still water, just a different shape.`);
    else if (res.asked) say(`Sign up and I'll draw ${withArticle(res.subject)} for you. Here I only know everyday things.`);
    else say('In the app I plan your dates, remember the little things and write with you both. Here, ask me to become something.');
  };

  const STATES: { key: BelluhState; label: string; text: string }[] = [
    { key: 'listening', label: 'Listening', text: 'Every key you type ripples the water.' },
    { key: 'thinking', label: 'Thinking', text: 'The ripples circle and it glows from inside.' },
    { key: 'talking', label: 'Talking', text: 'Every word it says moves the water.' },
  ];

  return (
    <section id="meet" className="relative z-10 px-6 pt-20 pb-8 scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border border-white bg-gradient-to-br from-white via-[#F4FAFC] to-[#fdf2f9] shadow-[0_30px_80px_-30px_rgba(63,116,134,0.35)]">
          <div className="absolute -top-40 -left-24 w-[520px] h-[520px] rounded-full bg-[#CDE9F2]/70 blur-[110px] pointer-events-none"></div>
          <div className="absolute -bottom-48 right-[-10%] w-[560px] h-[560px] rounded-full bg-[#f0addd]/25 blur-[120px] pointer-events-none"></div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 items-center gap-6 md:gap-10 p-8 md:p-16">
            <div className="flex flex-col items-center order-1">
              <div className="relative">
                <div className="absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(205,233,242,0.9)_0%,rgba(205,233,242,0)_65%)] blur-2xl animate-breathing pointer-events-none"></div>
                <BelluhOrb size={wide ? 300 : 210} onTap={() => {}} label="Belluh. Tap to make a ripple." />
              </div>
              <p className="mt-6 min-h-[3.5rem] max-w-sm text-center font-serif text-xl md:text-2xl leading-snug text-slate-800" aria-live="polite">
                <BelluhSpeech key={reply.id} text={reply.text} />
              </p>
            </div>
            <div className="order-2 text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-serif leading-[1.05] tracking-tight mb-5 drop-shadow-sm">
                <span className="text-[#9bbecb]">Meet</span> <span className="text-[#f0addd] italic">Belluh.</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-500 font-light leading-relaxed mb-8 max-w-md mx-auto md:mx-0">
                Your relationship's assistant, made of living water. You can see it listen, think and talk, and it becomes anything you ask for.
              </p>
              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8 text-left">
                {STATES.map(st => (
                  <div key={st.key} className={`rounded-2xl px-3 py-3 md:px-4 md:py-4 transition-all duration-500 ${state === st.key ? 'bg-white shadow-[0_12px_30px_-12px_rgba(63,116,134,0.45)] -translate-y-0.5' : 'bg-white/40'}`}>
                    <p className={`text-[11px] md:text-xs font-bold uppercase tracking-widest transition-colors duration-500 ${state === st.key ? 'text-[#3f7486]' : 'text-slate-400'}`}>{st.label}</p>
                    <p className="hidden md:block mt-1.5 text-sm text-slate-500 leading-snug">{st.text}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={submit} className="flex items-center gap-2 bg-white rounded-full border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.18)] p-1.5 pl-5 focus-within:border-[#CDE9F2] focus-within:shadow-[0_20px_50px_-15px_rgba(155,190,203,0.6)] transition-all">
                <input
                  value={text}
                  onChange={e => { setText(e.target.value); belluh.key(); }}
                  placeholder={`Try: ${TRY_EXAMPLES[hint]}`}
                  aria-label="Say something to Belluh"
                  maxLength={80}
                  className="flex-1 min-w-0 bg-transparent py-2.5 text-[16px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                <button type="submit" disabled={busy || !text.trim()} className="shrink-0 h-11 px-5 rounded-full bg-[#9bbecb] text-white text-sm font-bold hover:bg-[#8aaab7] disabled:opacity-50 transition-all active:scale-95">Ask</button>
              </form>
              <button onClick={() => { rememberCta('meet'); onGetStarted(); }} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#f0addd] transition-colors">
                Bring Belluh home <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onShowLegal, onGoToAbout, onGoToCareers }) => {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const heroTap = useShapeTap();
  const ctaTap = useShapeTap();
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  useEffect(() => { const onR = () => setIsDesktop(window.innerWidth >= 768); window.addEventListener('resize', onR); return () => window.removeEventListener('resize', onR); }, []);
  const [heroOrb, setHeroOrb] = useState(() => (typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerHeight >= 760 ? 150 : 104));
  useEffect(() => {
    const onR = () => setHeroOrb(window.innerWidth >= 768 && window.innerHeight >= 760 ? 150 : 104);
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
      { label: 'Meet Belluh', action: () => scrollToSection('meet') },
      { label: 'What it does', action: () => scrollToSection('features') },
      { label: 'Inside', action: () => scrollToSection('inside') },
      { label: 'FAQ', action: () => scrollToSection('faq') },
      { label: 'Privacy', action: () => { toggleMenu(); onShowLegal('privacy'); } },
      { label: 'Our Why', action: () => { toggleMenu(); onGoToAbout(); } },
      { label: 'Careers', action: () => { toggleMenu(); onGoToCareers(); } }
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 font-sans selection:bg-[#f0addd] selection:text-white overflow-x-hidden relative">
      
      {/* --- Ambient Cloud Background Layers --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#CDE9F2]/30 rounded-full blur-[120px] animate-float opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#f0addd]/20 rounded-full blur-[130px] animate-pulse-slow opacity-50"></div>
          <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-white rounded-full blur-[80px] animate-breathing opacity-80 mix-blend-overlay"></div>
      </div>

      {/* Floating Pill Navbar - Scroll Aware */}
      <div className={`fixed top-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[min(64rem,calc(100%-3rem))] md:max-w-none z-50 transition-all duration-500 transform ${isNavVisible ? 'translate-y-0 opacity-100' : '-translate-y-[150%] opacity-0'}`}>
        <nav className="bg-white/90 backdrop-blur-xl rounded-full shadow-lg shadow-slate-200/50 border border-white px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <span className="font-serif text-xl font-bold tracking-tight text-[#9bbecb] drop-shadow-sm" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>Belluh</span>
            </div>

            <div className="hidden md:flex items-center gap-1 text-sm font-bold text-slate-500">
                {[['Meet Belluh', 'meet'], ['What it does', 'features'], ['Inside', 'inside'], ['FAQ', 'faq']].map(([label, id]) => (
                    <button key={id} onClick={() => scrollToSection(id)} className="px-3 py-2 rounded-full hover:text-slate-900 hover:bg-slate-50 transition-colors">{label}</button>
                ))}
            </div>

            <div className="flex items-center gap-2">
            <button onClick={onLogin} className="hidden md:inline-flex h-10 items-center px-4 rounded-full text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Log in</button>
            <button
                onClick={() => { rememberCta('nav'); onGetStarted(); }}
                tabIndex={pastHero || isDesktop ? 0 : -1}
                aria-hidden={!pastHero && !isDesktop}
                className={`overflow-hidden whitespace-nowrap h-10 bg-[#f0addd] text-white rounded-full font-bold text-sm hover:bg-[#e57ec3] shadow-md shadow-[#f0addd]/30 transition-all duration-500 md:max-w-[140px] md:px-5 md:opacity-100 md:pointer-events-auto ${pastHero ? 'max-w-[140px] px-5 opacity-100' : 'max-w-0 px-0 opacity-0 pointer-events-none'}`}
            >
                Start free
            </button>
            <button 
                onClick={toggleMenu}
                aria-label="Open menu"
                className="md:hidden bg-[#CDE9F2] text-cyan-900 w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-lg"
            >
                <Menu size={20} strokeWidth={2.5} />
            </button>
            </div>
        </nav>
      </div>

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
                       Sign In
                   </button>
                   <button 
                       onClick={() => { toggleMenu(); rememberCta('menu'); onGetStarted(); }}
                       className="w-full py-3.5 md:py-4 rounded-full bg-[#9bbecb] text-white font-bold hover:bg-[#8aaab7] transition-colors shadow-xl text-lg flex items-center justify-center gap-2"
                   >
                       Start free <ArrowRight size={18} />
                   </button>
               </div>
          </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-[100svh] flex flex-col items-center justify-center pt-28 pb-24 px-6">
         <div className="w-full max-w-4xl mx-auto text-center animate-slide-up">
             <div className="flex flex-col items-center mb-4 md:mb-6">
                 <BelluhOrb size={heroOrb} onTap={heroTap.tap} label="Belluh. Tap to change its shape." />
                 <p className="mt-2 h-5 text-xs font-bold tracking-wide text-slate-400 transition-opacity" aria-live="polite">
                     {heroTap.label ? `A ${heroTap.label}. Tap again.` : 'Tap me'}
                 </p>
             </div>
             <h1 className="text-5xl md:text-7xl font-serif font-medium leading-[1.1] mb-6 text-slate-900 tracking-tight drop-shadow-sm">
                 <span className="text-[#9bbecb]">The AI journal</span> <br /> <span className="text-[#f0addd] italic">for couples.</span>
             </h1>
             
             <p className="text-xl md:text-2xl text-slate-500 font-light leading-relaxed max-w-2xl mx-auto mb-8 min-h-[3.75rem] md:min-h-0">
                 <BelluhSpeech text="Write a few lines a day. Belluh remembers, plans, and reminds you both." delay={700} />
             </p>

             <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                 <button 
                    onClick={() => { rememberCta('hero'); onGetStarted(); }}
                    className="w-full sm:w-auto px-10 py-4 bg-[#f0addd] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#e57ec3] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#f0addd]/30"
                 >
                     <span>Start Your Journey</span>
                     <ArrowRight size={16} />
                 </button>
                 <button 
                    onClick={onLogin}
                    className="w-auto px-6 py-2 sm:px-10 sm:py-4 sm:bg-white/80 sm:backdrop-blur-sm text-slate-600 sm:border sm:border-white rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-white hover:text-[#f0addd] sm:hover:shadow-lg transition-all"
                 >
                     I have an account
                 </button>
             </div>
             <p className="mt-5 text-sm text-slate-400">Free to start. Bring your partner whenever you're ready.</p>
         </div>
         <div className="absolute bottom-6 md:bottom-8 inset-x-0 flex justify-center">
             <button onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })} aria-label="Scroll down" className="w-11 h-11 rounded-full flex items-center justify-center text-[#9bbecb] hover:text-[#f0addd] transition-colors animate-bounce">
                 <ChevronDown size={24} />
             </button>
         </div>
      </section>

      {/* Where Belluh's couples are */}
      <LogoMarquee title="Used by couples at" orgs={ORGANIZATIONS} note="* Used independently by individuals. Not affiliated with these organizations." />

      <MeetBelluh onGetStarted={onGetStarted} />

      <LandingDemos onShowPrivacy={() => onShowLegal('privacy')} />

      {/* Real app screens */}
      <section id="inside" className="relative z-10 px-6 pb-28 scroll-mt-24">
          <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-serif text-center leading-tight mb-4 drop-shadow-sm">
                  <span className="text-[#9bbecb]">Inside</span> <span className="text-[#f0addd] italic">Belluh.</span>
              </h2>
              <p className="text-center text-lg text-slate-500 font-light mb-12">Real screens from the app, with a sample couple.</p>

              <div className="group relative h-[560px] md:h-[780px] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border border-white bg-gradient-to-b from-white/70 to-[#fdf2f9]/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)]">
                  <div className="absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full bg-[#CDE9F2]/70 blur-[110px] pointer-events-none"></div>
                  <div className="absolute -bottom-48 -right-32 w-[620px] h-[620px] rounded-full bg-[#f0addd]/35 blur-[120px] pointer-events-none"></div>

                  <div className="absolute inset-x-0 top-10 md:top-16 flex justify-center">
                      <div className="relative w-[220px] md:w-[330px]">
                          <PhoneFrame src="/screens/write.webp" alt="Maya writing a few lines about her day" className="absolute top-12 md:top-20 right-[58%] md:right-[68%] w-[80%] -rotate-[7deg] origin-bottom-right transition-transform duration-700 group-hover:-rotate-[9deg] group-hover:-translate-x-2" />
                          <PhoneFrame src="/screens/home.webp" alt="Home, where Belluh offers to plan an anniversary, asks how a date went, and shows a reminder" className="absolute top-12 md:top-20 left-[58%] md:left-[68%] w-[80%] rotate-[7deg] origin-bottom-left transition-transform duration-700 group-hover:rotate-[9deg] group-hover:translate-x-2" />
                          <PhoneFrame src="/screens/us.webp" alt="Belluh planning a ramen night for Maya and Dan in their shared thread" className="relative z-10 transition-transform duration-700 group-hover:-translate-y-2" />
                      </div>
                  </div>

                  <div className="absolute z-20 bottom-6 inset-x-5 mx-auto max-w-[290px] md:max-w-[320px] md:inset-x-auto md:bottom-auto md:top-28 md:right-[6%] md:mx-0 rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)] p-3 md:p-4 flex gap-3">
                      <div className="shrink-0 pt-0.5"><BelluhOrb size={34} /></div>
                      <div className="min-w-0">
                          <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-slate-900">Belluh</span><span className="text-xs text-slate-400">now</span></div>
                          <p className="text-[13px] md:text-sm text-slate-600 leading-snug mt-0.5">Dan picked Friday at 7:00 PM for "Ramen, then the night market".</p>
                      </div>
                  </div>

                  <div className="hidden md:flex absolute z-20 bottom-24 left-[6%] items-center gap-2.5 rounded-full bg-white/85 backdrop-blur-xl border border-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] px-5 py-3">
                      <Lock size={16} className="text-[#3f7486]" />
                      <span className="text-sm font-bold text-slate-700">Private entries stay private</span>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-14 px-2">
                  {STEPS.map(s => (
                      <div key={s.n}>
                          <p className="text-xs font-bold tracking-widest text-[#f0addd]">{s.n}</p>
                          <p className="mt-2 font-serif text-2xl text-slate-900">{s.title}</p>
                          <p className="mt-2 text-slate-500 font-light leading-relaxed">{s.text}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Marquee Section */}
      <LogoMarquee title="Works with" orgs={INTEGRATIONS} note="* Trademarks belong to their owners." repeat={6} />

      {/* FAQ */}
      <section id="faq" className="relative z-10 pt-24 px-6 scroll-mt-24">
          <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-serif text-center leading-tight mb-12 drop-shadow-sm">
                  <span className="text-[#9bbecb]">Questions,</span> <span className="text-[#f0addd] italic">answered.</span>
              </h2>
              <div className="space-y-3">
                  {FAQ.map((f, i) => <FaqItem key={f.q} q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />)}
              </div>
          </div>
      </section>

      <section className="relative z-10 py-24 px-6 text-center">
          <div className="max-w-3xl mx-auto">
              <div className="flex justify-center mb-8">
                  <BelluhOrb size={88} onTap={ctaTap.tap} label="Belluh. Tap to change its shape." />
              </div>
              <h2 className="text-3xl md:text-5xl font-serif text-slate-900 leading-tight mb-6 drop-shadow-sm">
                  <span className="text-[#9bbecb]">Start tonight.</span> <span className="text-[#f0addd] italic">Together.</span>
              </h2>
              <p className="text-xl text-slate-500 font-light leading-relaxed mb-10">Write one line about today and send your partner the link. Your first insight arrives on Sunday.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button onClick={() => { rememberCta('final'); onGetStarted(); }} className="w-full sm:w-auto px-10 py-4 bg-[#f0addd] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#e57ec3] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#f0addd]/30">
                      <span>Start Your Journey</span><ArrowRight size={16} />
                  </button>
                  <button onClick={onLogin} className="w-full sm:w-auto px-10 py-4 bg-white/80 backdrop-blur-sm text-slate-600 border border-white rounded-full font-bold text-sm hover:bg-white hover:text-[#f0addd] hover:shadow-lg transition-all">
                      I have an account
                  </button>
              </div>
          </div>
      </section>

      <footer className="relative z-10 py-10 bg-white border-t border-slate-50">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
               <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="flex items-center gap-2 group transition-all duration-300 hover:opacity-80"
               >
                    <BelluhOrb size={20} />
                    <span className="font-serif font-bold text-slate-600 tracking-tight group-hover:text-slate-900 transition-colors">Belluh</span>
               </button>

               <div className="flex gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
                   <button onClick={onGoToCareers} className="hover:text-slate-600 transition-colors">Careers</button>
                   <button onClick={onGoToAbout} className="hover:text-slate-600 transition-colors">About</button>
                   <button onClick={() => onShowLegal('tos')} className="hover:text-slate-600 transition-colors">Terms</button>
                   <button onClick={() => onShowLegal('privacy')} className="hover:text-slate-600 transition-colors">Privacy</button>
               </div>

               <div className="text-xs text-slate-400 font-bold tracking-wide">
                   © 2026 Belluh Inc.
               </div>
          </div>
      </footer>
      
      <style>{`
        .mask-gradient-x {
            mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
        }
        .animate-marquee {
            animation: marquee 40s linear infinite;
        }
        .animate-marquee-reverse {
            animation: marquee-reverse 40s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;