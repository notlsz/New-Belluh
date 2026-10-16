

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Lock, Menu, X, ChevronDown } from 'lucide-react';
import { rememberCta } from '../services/analytics';
import BelluhOrb from '../components/BelluhOrb';
import BelluhSpeech from '../components/BelluhSpeech';
import LandingDemos from '../components/LandingDemos';
import SiteFooter from '../components/SiteFooter';
import SiteNav from '../components/SiteNav';
import { belluh, type BelluhState } from '../lib/belluhPresence';
import { ORGANIZATIONS } from '../constants';
import { BRAND_MARKS } from '../data/brandMarks';

const FAQ = [
  { q: 'Can my partner read my private entries?', a: 'No. Every entry is shared or private, your call. Your partner never sees your private entries, and neither does their Belluh.' },
  { q: 'What does Belluh actually do?', a: 'It remembers what matters to you both, plans dates your partner can accept with one tap, gets the date-night reservation, the honeymoon and the flowers ready to book, reminds you before birthdays and anniversaries, sends the reminders you ask for, helps you find the words for a note, and every Sunday gives you one insight and one small thing to try together.' },
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

// Example entries for the stories strip, each with what Belluh does with it
const MOMENTS = [
  { when: 'Tuesday, 8:12 pm', text: "The way you look at me when I'm cooking... it felt like home.", belluh: 'saved it to what matters to you' },
  { when: 'Saturday, 4:47 pm', text: 'I never want to forget the sound of your laugh in the rain.', belluh: 'kept it for your anniversary' },
  { when: 'Sunday, 11:03 am', text: 'Found that old ticket stub from our first date.', belluh: 'added it to your first date' },
  { when: 'Saturday, 9:20 am', text: 'Just a quiet morning with coffee and you. Perfect.', belluh: 'kept it for your week in review' },
  { when: 'Friday, 1:14 am', text: 'We stayed up way too late talking about the future.', belluh: 'remembered the plans you made' },
];
const MOMENT_TONES = ['bg-white', 'bg-[#fdf0f8]', 'bg-[#eef7fa]'];

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

// Universities get one row and companies the other
const isUniversity = (domain: string) => /\.(edu|ac\.uk|ca)$/.test(domain);

type Org = { name: string; domain: string; logo?: string };

// Real logos (grey until you hover, like before). If one ever fails to load, the brand's mark or name stands in.
const LogoItem = ({ org }: { org: Org }) => {
  const [failed, setFailed] = useState(false);
  const mark = BRAND_MARKS[org.domain];
  if (org.logo && !failed) {
    return (
      <img src={org.logo} alt={org.name} title={org.name} loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)}
        className="h-10 md:h-12 w-auto max-w-[130px] md:max-w-[150px] object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition duration-500 select-none" />
    );
  }
  if (isUniversity(org.domain) && !mark) {
    return <span className="font-serif text-[1.6rem] md:text-[1.85rem] tracking-tight whitespace-nowrap text-slate-400">{org.name}</span>;
  }
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap text-slate-400 hover:text-slate-900 transition-colors duration-300">
      {mark && <svg viewBox="0 0 24 24" className="h-6 w-6 md:h-7 md:w-7 shrink-0 fill-current" aria-hidden="true"><path d={mark} /></svg>}
      <span className="text-lg md:text-xl font-semibold tracking-tight">{org.name}</span>
    </span>
  );
};

const FADE_X = { WebkitMaskImage: 'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)', maskImage: 'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)' } as React.CSSProperties;

const MarqueeRow = ({ orgs, reverse = false, speed = 60 }: { orgs: Org[]; reverse?: boolean; speed?: number }) => {
  // Two identical halves, so sliding by half loops without a seam; short lists are repeated to fill wide screens
  const half = Array.from({ length: Math.max(1, Math.ceil(12 / orgs.length)) }, () => orgs).flat();
  return (
    <div className="relative flex overflow-hidden group" style={FADE_X}>
      <div className={`flex items-center w-max ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} group-hover:[animation-play-state:paused]`} style={{ animationDuration: `${speed}s` }}>
        {[...half, ...half].map((org, i) => (
          <div key={i} aria-hidden={i >= half.length ? true : undefined} className="shrink-0 px-7 md:px-10 flex items-center h-16">
            <LogoItem org={org} />
          </div>
        ))}
      </div>
    </div>
  );
};

const LogoMarquee = ({ title, orgs, note }: { title: string; orgs: Org[]; note: string; repeat?: number }) => {
  const schools = orgs.filter(o => isUniversity(o.domain));
  const others = orgs.filter(o => !isUniversity(o.domain));
  return (
    <section className="w-full py-20 md:py-24 relative z-20" aria-label={title}>
      <p className="text-center mb-10 md:mb-12 px-4 text-[11px] md:text-xs font-bold text-slate-400 tracking-[0.25em] uppercase">{title}</p>
      <div className="space-y-6 md:space-y-8">
        {schools.length > 0 && <MarqueeRow orgs={schools} reverse speed={70} />}
        {others.length > 0 && <MarqueeRow orgs={others} speed={schools.length ? 80 : 45} />}
      </div>
      <p className="text-center mt-10 px-4 text-[10px] text-slate-300 font-medium tracking-wide uppercase">{note}</p>
    </section>
  );
};


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
              <div className="mb-8">
                <div className="flex justify-center md:justify-start gap-6 md:gap-8">
                  {STATES.map(st => (
                    <span key={st.key} className={`text-xs md:text-sm font-bold uppercase tracking-[0.18em] transition-colors duration-500 ${state === st.key ? 'text-[#3f7486]' : 'text-slate-300'}`}>{st.label}</span>
                  ))}
                </div>
                <p className="mt-3 min-h-[1.5rem] text-slate-500">{(STATES.find(st => st.key === state) ?? { text: 'Type below and watch the water listen.' }).text}</p>
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
      { label: 'Stories', action: () => scrollToSection('stories') },
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

      {/* Top bar */}
      <SiteNav
          links={[
              { label: 'Meet Belluh', onClick: () => scrollToSection('meet'), section: 'meet' },
              { label: 'What it does', onClick: () => scrollToSection('features'), section: 'features' },
              { label: 'Inside', onClick: () => scrollToSection('inside'), section: 'inside' },
              { label: 'Stories', onClick: () => scrollToSection('stories'), section: 'stories' },
              { label: 'FAQ', onClick: () => scrollToSection('faq'), section: 'faq' },
          ]}
          onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onLogin={onLogin}
          onGetStarted={() => { rememberCta('nav'); onGetStarted(); }}
          onMenu={toggleMenu}
      />

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
      <section className="hero-wrap relative z-10 min-h-[100svh] flex flex-col items-center justify-center pt-28 pb-24 px-6">
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
         {/* The real app, peeking up from the bottom of the first screen on laptops */}
         <button onClick={() => scrollToSection('inside')} aria-label="See inside Belluh" className="hero-peek absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[170px] overflow-hidden group">
             <div className="absolute inset-x-0 -bottom-6 h-24 bg-gradient-to-t from-[#fcfcfc] to-transparent z-10 pointer-events-none"></div>
             <div className="transition-transform duration-700 group-hover:-translate-y-3">
                 <PhoneFrame src="/screens/us.webp" alt="Belluh planning a ramen night for Maya and Dan in their shared thread" />
             </div>
         </button>
         <div className="hero-cue absolute bottom-6 md:bottom-8 inset-x-0 flex justify-center">
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

      {/* Infinite Marquee Section */}
      <section id="stories" className="relative z-10 py-24 md:py-32 overflow-hidden scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6 mb-14 md:mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9bbecb] mb-5">The kind of thing you'll write</p>
                <h2 className="font-serif text-5xl md:text-7xl tracking-tight text-slate-900 leading-[1.02]">Every <span className="italic text-[#f0addd]">moment</span><br className="hidden md:block" /> counts.</h2>
            </div>
            <p className="text-slate-500 text-lg md:text-xl font-light leading-relaxed max-w-sm md:text-right">
                From the big milestones to the quiet Sunday mornings, Belluh keeps your story alive.
            </p>
        </div>

        <div>
            {[MOMENTS].map((row, r) => (
                <div key={r} className="relative flex overflow-hidden group py-12 -my-9" style={FADE_X}>
                    <div className={`flex w-max ${r ? 'animate-marquee-reverse' : 'animate-marquee'} group-hover:[animation-play-state:paused]`} style={{ animationDuration: r ? '75s' : '65s' }}>
                        {[...row, ...row].map((m, i) => (
                            <article key={i} aria-hidden={i >= row.length ? true : undefined} className={`shrink-0 mx-3 md:mx-4 w-[290px] md:w-[360px] rounded-[1.75rem] p-7 md:p-8 flex flex-col shadow-[0_18px_40px_-24px_rgba(15,23,42,0.25)] transition-transform duration-500 hover:-translate-y-1.5 hover:rotate-0 ${MOMENT_TONES[i % 3]} ${i % 2 ? 'rotate-[0.8deg]' : '-rotate-[0.8deg]'}`}>
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{m.when}</p>
                                <p className="mt-5 flex-1 font-serif text-xl md:text-[1.4rem] leading-snug text-slate-800 whitespace-normal">{m.text}</p>
                                <p className="mt-7 text-sm text-slate-500 whitespace-normal"><span className="font-serif font-bold text-[#7fa7b6]">Belluh</span>&ensp;{m.belluh}</p>
                            </article>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </section>
      
      {/* Why Belluh exists, in Jimmy's words (from the Our Why page) */}
      <section id="why" className="relative z-10 px-6 py-24 md:py-32 scroll-mt-24">
          <div className="max-w-3xl mx-auto text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9bbecb] mb-8">Why Belluh exists</p>
              <blockquote className="font-serif text-3xl md:text-5xl leading-[1.15] tracking-tight text-slate-900">
                  "We've built a world of perfect documentation and <span className="text-[#f0addd] italic">zero remembrance.</span>"
              </blockquote>
              <p className="mt-8 text-lg md:text-xl text-slate-500 font-light leading-relaxed max-w-2xl mx-auto">
                  "Love isn't always built in the big moments. ... It's built in the supermarket. It's built in how someone listens when you talk about shrimp."
              </p>
              <p className="mt-6 font-serif text-lg italic text-slate-700">— Jimmy</p>
              <button onClick={onGoToAbout} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#f0addd] transition-colors">
                  Read the whole story <ArrowRight size={15} />
              </button>
          </div>
      </section>

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

      <SiteFooter
          onTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onSection={scrollToSection}
          onGetStarted={() => { rememberCta('footer'); onGetStarted(); }}
          onLogin={onLogin}
          onShowLegal={onShowLegal}
          onGoToAbout={onGoToAbout}
          onGoToCareers={onGoToCareers}
      />
      
      <style>{`
        .hero-peek { display: none; }
        @media (min-width: 768px) and (min-height: 820px) { .hero-peek { display: block; } .hero-cue { display: none; } .hero-wrap { padding-bottom: 200px; padding-top: 96px; } }
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