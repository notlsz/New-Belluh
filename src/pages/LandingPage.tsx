import React, { useState, useEffect } from 'react';
import { ArrowRight, Menu, X, Lock, CalendarHeart, MessageCircle, BellRing, Sparkles, PenLine, Heart, Check, ChevronDown, ShieldCheck, Mail } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onShowLegal: (type: 'tos' | 'privacy') => void;
  onGoToAbout: () => void;
  onGoToCareers: () => void;
}

// Brand: #f0addd pink, #CDE9F2 sky, #9bbecb slate-blue. Text uses deeper shades of the same hues so it stays readable.
const INK_PINK = '#b4447f';
const INK_BLUE = '#3f7486';

const Avatar: React.FC<{ letter: string; tone: 'pink' | 'blue' | 'belluh' }> = ({ letter, tone }) => (
  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${tone === 'pink' ? 'bg-[#f7d8ee] text-[#7a1f55]' : tone === 'blue' ? 'bg-[#CDE9F2] text-[#2d5a68]' : 'bg-[#e11d63] text-white'}`}>
    {tone === 'belluh' ? <Sparkles size={13} /> : letter}
  </div>
);

/** The real "Us" conversation, drawn in the app's own style: both partners and Belluh in one thread. */
const UsThreadMock: React.FC = () => (
  <div className="relative mx-auto w-full max-w-[360px]">
    <div className="absolute -inset-6 bg-gradient-to-br from-[#f0addd]/30 via-white/0 to-[#CDE9F2]/50 blur-2xl rounded-[3rem]" aria-hidden="true" />
    <div className="relative bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/70 p-5 text-left">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-50">
        <div>
          <p className="font-serif text-[15px] text-slate-900">Us</p>
          <p className="text-[11px] text-slate-500">Maya, Dan and Belluh</p>
        </div>
        <div className="flex -space-x-2"><Avatar letter="M" tone="pink" /><Avatar letter="D" tone="blue" /><Avatar letter="" tone="belluh" /></div>
      </div>
      <div className="space-y-3 text-[13.5px] leading-snug">
        <div className="flex gap-2 items-end"><Avatar letter="M" tone="pink" /><p className="bg-[#fdf2f9] text-slate-800 rounded-2xl rounded-bl-md px-3 py-2">Belluh, can you plan something for this week? We've both been slammed.</p></div>
        <div className="flex gap-2 items-end"><Avatar letter="" tone="belluh" />
          <div className="bg-slate-50 rounded-2xl rounded-bl-md px-3 py-2 text-slate-800">
            <p>You both wrote about missing the Thai place. Dan, which works?</p>
            <div className="mt-2 rounded-xl bg-white border border-[#f0addd]/60 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a1f55]">Dinner at the Thai place</p>
              <div className="mt-1.5 grid gap-1.5">
                <span className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px]">Fri, Oct 16 · 7:00 PM<span className="font-bold text-[#7a1f55]">Pick</span></span>
                <span className="flex items-center justify-between rounded-lg bg-slate-900 text-white px-2.5 py-1.5 text-[12px]">Sat, Oct 17 · 7:00 PM<Check size={13} /></span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-end justify-end"><p className="bg-[#eef8fb] text-slate-800 rounded-2xl rounded-br-md px-3 py-2">Saturday. I'll book it.</p><Avatar letter="D" tone="blue" /></div>
        <div className="flex gap-2 items-end"><Avatar letter="" tone="belluh" /><p className="bg-slate-50 text-slate-800 rounded-2xl rounded-bl-md px-3 py-2">Set. It's in your dates, one tap from your calendars, and I'll remind you both Saturday morning.</p></div>
      </div>
    </div>
  </div>
);

const FEATURES = [
  { icon: CalendarHeart, title: 'Plans the date', body: 'Ask Belluh for a night out. It suggests times, your partner taps one, and it\'s one tap from both your calendars, with a reminder.' },
  { icon: Heart, title: 'Remembers both of you', body: 'What helps after a hard day. Whose birthday is next. What you both keep writing about. It never forgets the small things.' },
  { icon: Mail, title: 'Helps you say it', body: 'Stuck on how to say something? Belluh drafts it in your voice. Nothing reaches your partner until you tap Send.' },
  { icon: Sparkles, title: 'One true thing, every Sunday', body: 'Belluh reads the week from both sides and gives you one insight and one small thing to try together.' },
  { icon: MessageCircle, title: 'Text it, too', body: 'Talk to Belluh on WhatsApp or by text. Same Belluh, same memory. Reply 1, 2 or 3 to pick a time.' },
  { icon: BellRing, title: 'Nudges, not noise', body: 'A heads-up when your partner sends a plan or a note, a week before every date that matters, and nothing else.' },
];

const STEPS = [
  { icon: PenLine, title: 'Write a line a day', body: 'A thought, a photo, a voice note. Share it with your partner or keep it to yourself.' },
  { icon: Sparkles, title: 'Belluh connects both sides', body: 'It sees what you each share and notices what neither of you can see from inside it.' },
  { icon: CalendarHeart, title: 'It does the follow-through', body: 'Plans, reminders, the right words at the right time. You just show up.' },
];

const FAQ = [
  { q: 'Is Belluh an AI girlfriend or boyfriend?', a: "No. Belluh has no avatar and doesn't flirt. It works for the two of you and points you back to each other." },
  { q: 'Can my partner read my private entries?', a: 'No. Private entries are yours alone. Belluh never shows them to your partner and never uses them in anything your partner sees.' },
  { q: 'What does Belluh actually do?', a: 'It remembers what matters, plans dates your partner can accept with one tap, puts them one tap from your calendars, reminds you before birthdays and anniversaries, drafts notes you approve, and sends one insight every Sunday.' },
  { q: 'Do we both need to join?', a: "Belluh is built for two, so it's best together. You can start alone and invite your partner with a link whenever you're ready." },
  { q: 'Can I use it from WhatsApp or text?', a: 'Yes. Connect in Settings with one tap. Texting Belluh is the same Belluh as in the app, with the same memory.' },
  { q: 'What happens to my data?', a: "Entries are encrypted in transit and at rest and never sold. Belluh's replies are written by Google's Gemini models, which process your entries to write them." },
];

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onShowLegal, onGoToAbout, onGoToCareers }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > 520);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  const menuItems = [
    { label: 'How it works', action: () => scrollToSection('how') },
    { label: 'Features', action: () => scrollToSection('features') },
    { label: 'Privacy', action: () => scrollToSection('privacy') },
    { label: 'Questions', action: () => scrollToSection('faq') },
    { label: 'Our why', action: () => { setIsMenuOpen(false); onGoToAbout(); } },
  ];

  const PrimaryCTA: React.FC<{ label?: string; className?: string }> = ({ label = 'Start free', className = '' }) => (
    <button onClick={onGetStarted}
      className={`group h-14 px-8 bg-[#f0addd] text-[#4a0f33] rounded-full font-bold text-[15px] hover:bg-[#ea97cf] active:scale-[0.98] transition-all shadow-lg shadow-[#f0addd]/40 flex items-center justify-center gap-2 ${className}`}>
      <span>{label}</span><ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
    </button>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 font-sans selection:bg-[#f0addd] selection:text-[#4a0f33] overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#CDE9F2]/30 rounded-full blur-[120px] animate-float opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#f0addd]/20 rounded-full blur-[130px] animate-pulse-slow opacity-50" />
      </div>

      {/* Nav */}
      <div className="fixed top-5 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-3xl z-50">
        <nav className="bg-white/90 backdrop-blur-xl rounded-full shadow-lg shadow-slate-200/50 border border-white pl-6 pr-3 py-2.5 flex items-center justify-between" aria-label="Main">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="font-serif text-xl font-bold tracking-tight" style={{ color: INK_BLUE }}>Belluh</button>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button onClick={() => scrollToSection('how')} className="hover:text-slate-900">How it works</button>
            <button onClick={() => scrollToSection('features')} className="hover:text-slate-900">Features</button>
            <button onClick={() => scrollToSection('privacy')} className="hover:text-slate-900">Privacy</button>
            <button onClick={onLogin} className="hover:text-slate-900">Sign in</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onGetStarted} tabIndex={pastHero ? 0 : -1} aria-hidden={!pastHero}
              className={`overflow-hidden whitespace-nowrap h-10 bg-[#f0addd] text-[#4a0f33] rounded-full font-bold text-sm hover:bg-[#ea97cf] transition-all duration-500 ${pastHero ? 'max-w-[140px] px-5 opacity-100' : 'max-w-0 px-0 opacity-0 pointer-events-none'}`}>
              Start free
            </button>
            <button onClick={() => setIsMenuOpen(true)} aria-label="Open menu" className="md:hidden bg-[#CDE9F2] text-[#1f4b59] w-10 h-10 rounded-full flex items-center justify-center">
              <Menu size={20} strokeWidth={2.5} />
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-[100] bg-white transition-all duration-500 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`} aria-hidden={!isMenuOpen}>
        <div className="flex flex-col h-full p-6">
          <div className="flex justify-between items-center mb-10">
            <span className="font-serif text-2xl font-bold" style={{ color: INK_BLUE }}>Belluh</span>
            <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu" className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center border border-slate-100"><X size={22} /></button>
          </div>
          <div className="flex-1 flex flex-col gap-5">
            {menuItems.map(item => (
              <button key={item.label} onClick={item.action} className="text-left text-4xl font-serif text-slate-800 hover:text-[#3f7486]">{item.label}</button>
            ))}
          </div>
          <div className="flex flex-col gap-3 pt-6">
            <button onClick={() => { setIsMenuOpen(false); onLogin(); }} className="w-full py-4 rounded-full bg-slate-50 font-bold text-slate-900 border border-slate-100">Sign in</button>
            <button onClick={() => { setIsMenuOpen(false); onGetStarted(); }} className="w-full py-4 rounded-full bg-[#f0addd] text-[#4a0f33] font-bold flex items-center justify-center gap-2">Start free <ArrowRight size={18} /></button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative z-10 pt-32 md:pt-40 pb-16 md:pb-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1.1fr_1fr] gap-14 md:gap-10 items-center">
          <div className="text-center md:text-left animate-slide-up">
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] mb-6" style={{ color: INK_PINK }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#f0addd]" /> The AI for two
            </p>
            <h1 className="text-[2.75rem] leading-[1.05] md:text-7xl md:leading-[1.02] font-serif font-medium tracking-tight text-slate-900">
              One AI that works for <span className="italic" style={{ color: INK_PINK }}>both</span> of you.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed max-w-xl mx-auto md:mx-0">
              You each write a little. Belluh remembers what matters, plans the date, reminds you both, and tells you one true thing every Sunday.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <PrimaryCTA />
              <button onClick={onLogin} className="h-14 px-8 rounded-full font-bold text-[15px] text-slate-800 bg-white border border-slate-200 hover:border-slate-300 transition-colors">I have an account</button>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 justify-center md:justify-start text-sm text-slate-500">
              <li className="flex items-center gap-1.5"><Check size={15} style={{ color: INK_BLUE }} /> Free to start</li>
              <li className="flex items-center gap-1.5"><Check size={15} style={{ color: INK_BLUE }} /> Works on WhatsApp and text</li>
              <li className="flex items-center gap-1.5"><Lock size={14} style={{ color: INK_BLUE }} /> Private entries stay private</li>
            </ul>
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <UsThreadMock />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 px-6 py-20 md:py-28 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-center" style={{ color: INK_BLUE }}>How it works</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-serif text-center text-slate-900 tracking-tight">A minute a day. Belluh does the rest.</h2>
          <ol className="mt-14 grid md:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="bg-white rounded-[2rem] border border-slate-100 p-7 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[#CDE9F2]/60 flex items-center justify-center" style={{ color: INK_BLUE }}><s.icon size={18} /></span>
                  <span className="text-xs font-bold text-slate-400">Step {i + 1}</span>
                </div>
                <h3 className="mt-5 font-serif text-2xl text-slate-900">{s.title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Sunday insight, the original magic */}
      <section className="relative z-10 px-6 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 md:p-14 grid md:grid-cols-[1.3fr_1fr] gap-10 items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: INK_PINK }}>Every Sunday</p>
            <blockquote className="mt-4 font-serif text-3xl md:text-[2.6rem] leading-[1.15] text-slate-900">
              “You both wrote about dinner going quiet this week. Try a twenty-minute walk after, phones at home.”
            </blockquote>
            <p className="mt-5 text-slate-600 leading-relaxed max-w-lg">One insight from both sides of your week, and one small thing to try together. Midweek, a one-tap check-in. Next Sunday builds on how it went.</p>
          </div>
          <div className="rounded-[2rem] border border-[#CDE9F2] bg-gradient-to-br from-white to-[#CDE9F2]/40 p-6">
            <span className="bg-[#CDE9F2] text-[#1f4b59] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">This week, together</span>
            <p className="mt-4 font-serif text-xl text-slate-800 leading-snug">Take a twenty-minute walk after dinner, phones at home.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <span className="px-3.5 py-2 rounded-full bg-slate-900 text-white font-bold flex items-center gap-1.5"><Check size={14} /> We did it</span>
              <span className="px-3.5 py-2 rounded-full text-slate-500 font-bold">Not yet</span>
            </div>
            <p className="mt-4 text-xs text-slate-500">Dan did it too · 3 weeks in a row, together</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-20 md:py-28 bg-white/60 border-y border-slate-100 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-center" style={{ color: INK_BLUE }}>What Belluh does</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-serif text-center text-slate-900 tracking-tight">Not a chatbot. A third teammate.</h2>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-[2rem] border border-slate-100 p-7 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <span className="w-11 h-11 rounded-2xl bg-[#fdf2f9] flex items-center justify-center" style={{ color: INK_PINK }}><f.icon size={20} /></span>
                <h3 className="mt-5 font-serif text-xl text-slate-900">{f.title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed text-[15px]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="relative z-10 px-6 py-20 md:py-28 scroll-mt-24">
        <div className="max-w-6xl mx-auto rounded-[2.5rem] bg-[#CDE9F2]/60 border border-[#CDE9F2] p-8 md:p-14 grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-[#1f4b59]"><ShieldCheck size={13} /> Private by design</p>
            <h2 className="mt-5 text-4xl md:text-5xl font-serif text-[#12313b] tracking-tight leading-[1.08]">Some things are just yours.</h2>
            <p className="mt-5 text-[#24505e] text-lg leading-relaxed">Mark any entry private and it stays yours: your partner never sees it, and Belluh never uses it in anything your partner sees. Everything is encrypted in transit and at rest, and never sold.</p>
            <p className="mt-4 text-sm text-[#2f5d6b]">Belluh's replies are written by Google's Gemini models, which process your entries to write them. <button onClick={() => onShowLegal('privacy')} className="font-bold underline underline-offset-4">Privacy policy</button></p>
          </div>
          <ul className="grid gap-3">
            {['Shared or private, every entry', "Your partner's private entries never reach your Belluh", 'Notes reach your partner only when you tap Send', 'Turn off texts or notifications any time'].map(t => (
              <li key={t} className="flex items-start gap-3 bg-white/85 rounded-2xl px-4 py-3.5 text-[15px] text-slate-800"><Lock size={16} className="mt-0.5 shrink-0 text-[#1f4b59]" />{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Not a companion */}
      <section className="relative z-10 px-6 pb-20 md:pb-28">
        <div className="max-w-3xl mx-auto text-center">
          <Heart className="mx-auto" size={22} style={{ color: INK_PINK }} />
          <h2 className="mt-4 text-3xl md:text-4xl font-serif text-slate-900 tracking-tight">Belluh isn't trying to be your partner.</h2>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">No avatar, no flirting, no affection meter. Belluh works for the two of you, and every answer points you back to each other.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 px-6 pb-20 md:pb-28 scroll-mt-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif text-slate-900 tracking-tight text-center">Questions</h2>
          <div className="mt-10 divide-y divide-slate-100 bg-white rounded-[2rem] border border-slate-100">
            {FAQ.map((f, i) => (
              <div key={f.q}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}
                  className="w-full flex items-center justify-between gap-4 text-left px-6 md:px-8 py-5">
                  <span className="font-serif text-lg text-slate-900">{f.q}</span>
                  <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <p className="px-6 md:px-8 pb-6 -mt-1 text-slate-600 leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 pb-24 md:pb-32">
        <div className="max-w-4xl mx-auto text-center rounded-[2.5rem] bg-gradient-to-br from-[#fdf2f9] to-[#eef8fb] border border-white shadow-xl shadow-slate-200/40 px-6 py-16 md:py-20">
          <h2 className="text-4xl md:text-6xl font-serif text-slate-900 tracking-tight">Start tonight. <span className="italic" style={{ color: INK_PINK }}>Together.</span></h2>
          <p className="mt-5 text-lg text-slate-600 max-w-xl mx-auto">Write one line about today and send your partner the link. Belluh takes it from there.</p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <PrimaryCTA />
            <button onClick={onLogin} className="h-14 px-8 rounded-full font-bold text-[15px] text-slate-800 bg-white border border-slate-200 hover:border-slate-300">I have an account</button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-10 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-5 text-sm text-slate-500">
          <span className="font-serif font-bold" style={{ color: INK_BLUE }}>Belluh</span>
          <div className="flex gap-6">
            <button onClick={onGoToAbout} className="hover:text-slate-800">About</button>
            <button onClick={onGoToCareers} className="hover:text-slate-800">Careers</button>
            <button onClick={() => onShowLegal('tos')} className="hover:text-slate-800">Terms</button>
            <button onClick={() => onShowLegal('privacy')} className="hover:text-slate-800">Privacy</button>
          </div>
          <span>© 2026 Belluh Inc.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
