import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { ArrowRight, X } from 'lucide-react';
import SiteNav from '../components/SiteNav';
import SiteFooter from '../components/SiteFooter';
import BelluhOrb from '../components/BelluhOrb';

interface AboutProps {
  onBack: () => void;
  onGetStarted: () => void;
  onLogin: () => void;
  onShowLegal?: (type: 'tos' | 'privacy') => void;
  onGoToCareers?: () => void;
}

const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

// Fades a paragraph in once, as it scrolls into view
const TextReveal: React.FC<{ children: ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || reducedMotion()) { setIsVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); }
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

const CHAPTERS = [
  { id: 'moment', title: 'The moment' },
  { id: 'realization', title: 'The realization' },
  { id: 'tools', title: 'The problem with tools' },
  { id: 'why', title: 'Why Belluh' },
];

// The evening, itemized. An illustration of the story, in the spirit of Belluh's own keepsake receipt.
const RECEIPT: [string, string][] = [
  ['Shrimp, freshly weighed', '1'],
  ['Words said without speaking', '10,000'],
  ['Questions that kept me up', '1'],
  ['Seconds at the crosswalk', '50'],
  ['Times she looked back', '13'],
];

export const Receipt: React.FC = () => (
  <figure className="relative mx-auto w-full max-w-[340px] rotate-[2.5deg] transition-transform duration-700 hover:rotate-0" aria-label="The evening, itemized as a receipt">
    <div style={{ clipPath: 'polygon(0 0,100% 0,100% calc(100% - 10px),95% 100%,90% calc(100% - 10px),85% 100%,80% calc(100% - 10px),75% 100%,70% calc(100% - 10px),65% 100%,60% calc(100% - 10px),55% 100%,50% calc(100% - 10px),45% 100%,40% calc(100% - 10px),35% 100%,30% calc(100% - 10px),25% 100%,20% calc(100% - 10px),15% 100%,10% calc(100% - 10px),5% 100%,0 calc(100% - 10px))' }} className="relative bg-white px-7 pt-8 pb-10 font-mono text-[13px] leading-relaxed text-slate-700 shadow-[0_40px_80px_-30px_rgba(63,116,134,0.45)]">
      <p className="text-center font-bold tracking-[0.25em] text-slate-900">THE SUPERMARKET</p>
      <p className="text-center text-[11px] tracking-[0.2em] text-slate-400">ONE EVENING, AISLE BY AISLE</p>
      <div className="mt-7 space-y-2.5">
        {RECEIPT.map(([what, qty]) => (
          <div key={what} className="flex items-baseline gap-3">
            <span className="flex-1 min-w-0">{what}</span>
            <span className="tabular-nums text-slate-900">{qty}</span>
          </div>
        ))}
      </div>
      <div className="mt-7 flex items-baseline gap-3 font-bold text-slate-900">
        <span className="flex-1">TOTAL</span>
        <span className="text-[#e58fc9]">Someone to share it with</span>
      </div>
      <p className="mt-7 text-center text-[11px] tracking-[0.2em] text-slate-400">NO RETURNS. KEEP THE MEMORY.</p>
      <div className="mt-4 mx-auto flex h-10 w-48 items-stretch justify-center gap-[2px]" aria-hidden="true">
        {[3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 3, 1].map((w, i) => (
          <span key={i} className="bg-slate-800" style={{ width: w }} />
        ))}
      </div>
    </div>
  </figure>
);

const Chapter: React.FC<{ n: number; id: string; title: string }> = ({ n, id, title }) => (
  <TextReveal>
    <h2 className="pt-20 md:pt-28 mb-8 flex items-baseline gap-4 font-serif text-3xl md:text-4xl tracking-tight text-slate-900">
      {title}
    </h2>
  </TextReveal>
);

const About: React.FC<AboutProps> = ({ onBack, onGetStarted, onLogin, onShowLegal = () => {}, onGoToCareers = () => {} }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [active, setActive] = useState(CHAPTERS[0].id);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(docHeight > 0 ? Math.min(Math.max(window.scrollY / docHeight, 0), 1) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Its own name in the browser tab
  useEffect(() => {
    const before = document.title;
    document.title = 'The Supermarket Moment | Belluh';
    return () => { document.title = before; };
  }, []);

  // Highlight the chapter you're reading: the last one whose heading has passed the top third of the screen
  useEffect(() => {
    const onScroll = () => {
      const line = window.innerHeight * 0.35;
      let current = CHAPTERS[0].id;
      for (const c of CHAPTERS) { const el = document.getElementById(c.id); if (el && el.getBoundingClientRect().top <= line) current = c.id; }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#CDE9F2] selection:text-slate-900 animate-fade-in">
      {/* Reading progress */}
      <div className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-[#9bbecb] to-[#f0addd] z-[60]" style={{ width: `${scrollProgress * 100}%` }} />

      <SiteNav
        links={[
          { label: 'Home', onClick: onBack },
          { label: 'Our Why', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }), current: true },
          { label: 'Careers', onClick: onGoToCareers },
        ]}
        onHome={onBack}
        onLogin={onLogin}
        onGetStarted={onGetStarted}
        onMenu={() => setMenuOpen(true)}
      />

      {/* Menu on phones */}
      <div className={`fixed inset-0 z-[100] bg-white transition-opacity duration-500 ${menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="flex h-16 items-center justify-between px-5">
          <span className="font-serif text-[22px] font-bold tracking-tight text-[#9bbecb]">Belluh</span>
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="-mr-2 p-2 text-slate-700"><X size={24} /></button>
        </div>
        <nav className="px-7 pt-10 flex flex-col items-start gap-5">
          {[
            { label: 'Home', go: onBack },
            { label: 'Our Why', go: () => window.scrollTo({ top: 0 }) },
            { label: 'Careers', go: onGoToCareers },
            { label: 'Log in', go: onLogin },
          ].map(l => (
            <button key={l.label} onClick={() => { setMenuOpen(false); l.go(); }} className="font-serif text-5xl tracking-tight text-slate-300 hover:text-[#9bbecb] transition-colors">{l.label}</button>
          ))}
        </nav>
      </div>

      <main>
        {/* Hero: the original Supermarket Moment opening */}
        <section className="px-6 md:px-8 pt-32 md:pt-40">
          <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[220px_1fr] lg:gap-x-20">
          <div className="lg:col-start-2 max-w-[680px] mb-16 md:mb-20">
            <div className="flex items-center gap-3 mb-8 animate-slide-up">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Founding Story</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter leading-[1.05] mb-8 text-[#1a1a1a] animate-slide-up" style={{ animationDelay: '0.1s' }}>
              The Supermarket Moment.
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 font-normal leading-relaxed max-w-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Why we are building tools for remembrance in an age of perfect documentation.
            </p>
          </div>

          {/* Visual anchor, drifting slowly as you scroll */}
          <div className="lg:col-span-2 mb-6 md:mb-8 overflow-hidden rounded-[2px] animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="aspect-[4/3] sm:aspect-[21/9] w-full overflow-hidden">
              <img
                src="/images/supermarket-1800.webp"
                srcSet="/images/supermarket-900.webp 900w, /images/supermarket-1800.webp 1800w"
                sizes="(min-width: 1216px) 1152px, 100vw"
                width={1800} height={1350}
                alt="A long supermarket aisle under bright lights, in black and white"
                {...({ fetchpriority: "high" } as any)}
                className="w-full h-full object-cover grayscale contrast-[1.2] opacity-90 scale-105 transition-transform duration-[2s] hover:scale-110"
                style={reducedMotion() ? undefined : { transform: `scale(${1.05 + scrollProgress * 0.1})` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 text-center">Acme Market, C. 2025</p>
          </div>
          </div>
        </section>

        {/* Story */}
        <div className="px-6 md:px-8 pb-8 md:pb-16">
          <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[220px_1fr] lg:gap-20">
            {/* Chapters, on laptops */}
            <aside className="hidden lg:block">
              <nav className="sticky top-32 pt-24" aria-label="Chapters">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-5">Chapters</p>
                {CHAPTERS.map((c, i) => (
                  <button key={c.id} onClick={() => go(c.id)} className={`w-full text-left flex gap-3 py-2 text-[15px] transition-colors ${active === c.id ? 'text-slate-900 font-medium' : 'text-slate-400 hover:text-slate-700'}`}>
                    {c.title}
                  </button>
                ))}
              </nav>
            </aside>

            <article className="max-w-[680px] font-serif text-[1.125rem] md:text-[1.3rem] leading-[1.9] text-slate-700 [&_p]:mb-7">
              <section id="moment" className="scroll-mt-24">
                <Chapter n={1} id="moment" title="The moment" />
                <TextReveal>
                  <p className="text-slate-900">
                    <span className="float-left mr-3 mt-1.5 font-serif text-[5.2rem] leading-[0.8] text-[#9bbecb]">E</span>
                    ven before checkout at Acme, we had already exchanged what felt like 10,000 words. Our gaze locked. Brief glances. Obvious, eluding. Like children sneaking chocolate. Aisle after aisle, our eyes locked onto another. Almost touching.
                  </p>
                </TextReveal>
                <TextReveal><p>My hand brushed the label on my newly weighed shrimp. The chill from the ice lingering on my fingertips. Paired with a droning hum of the central AC mixed with the faint squeak of a cart the aisle beside us.</p></TextReveal>
                <TextReveal><p>We pretended to study the same objects. Shoulder to shoulder. Stealing glances at each other's faces.</p></TextReveal>
                <TextReveal><p>Eventually I told her I wanted to make shrimp scampi. Her questions were curious, careful. She cared. She listened. One question stayed with me. I could not answer it until 2 a.m., lying awake, under the silence of my room, the weight of the night pressing in.</p></TextReveal>

                <TextReveal>
                  <blockquote className="my-16 md:my-20 lg:-mr-28">
                    <span className="block font-serif text-7xl leading-none text-[#f0addd] -mb-4" aria-hidden="true">&ldquo;</span>
                    <p className="!mb-0 font-serif italic text-[2rem] md:text-5xl leading-[1.15] tracking-tight text-slate-900">If you could only pick one: perfection or someone to share it with?</p>
                  </blockquote>
                </TextReveal>

                <TextReveal><p className="text-slate-900">I realized I need someone to share it with.</p></TextReveal>
                <TextReveal><p>Her navy cardigan caught the wind. Her red handbag swung like a pendulum, hope and fear, forward and back. Somewhere, a cart wheel squeaked. The world narrowed between us. Fifty seconds stretched like years. A block and a half down usually takes four minutes. With her, it felt like nothing.</p></TextReveal>
                <TextReveal><p>Before Gutmann she turned one last time. I counted thirteen. The final smile carried hope and sorrow. I knew it would stay with me. It said what words could not. The faint trace of her perfume lingered in the air long after she walked away.</p></TextReveal>
              </section>

              <section id="realization" className="scroll-mt-24">
                <Chapter n={2} id="realization" title="The realization" />
                <TextReveal><p>I couldn't sleep that night. I kept coming back to that question. "If you could only pick one: perfection or someone to share it with?"</p></TextReveal>
                <TextReveal><p>And I'm lying there in the dark thinking. What if I've been wrong about everything? What if all this time, building something perfect, alone in my room, iterating endlessly, chasing some impossible standard. What if that was just another way of being alone?</p></TextReveal>
                <TextReveal><p>I'd convinced myself that solitude was ambition. That if I could just build the right thing, create the right product, then it wouldn't matter that I was alone. Then maybe I'd be enough.</p></TextReveal>
                <TextReveal><p className="text-slate-900">But the moment I saw her, everything broke. And it was the best thing that ever happened to me.</p></TextReveal>
                <TextReveal><p>I started thinking: love isn't always built in the big moments. We often mistake it for the proposal, the first kiss. But it's not. It's built in the supermarket. It's built in how someone listens when you talk about shrimp. It's built in a question asked at 2 a.m. that you can't stop thinking about.</p></TextReveal>
                <TextReveal><p>Most of us have lived this moment. Not in a supermarket necessarily. Maybe at a coffee shop, or on a walk where you lost track of time, or just in a conversation that felt like it made time slow down. That moment when she did something, intentionally or not, that melted your heart in the process.</p></TextReveal>
              </section>

              <section id="tools" className="scroll-mt-24">
                <Chapter n={3} id="tools" title="The problem with tools" />
                <TextReveal><p>We have tools for everything. We have photos. Calendars. Voice memos. Videos. A thousand different ways to capture the surface of our lives. You can pull up your phone right now and see what you did a year ago. But try to remember why it mattered. Try to remember the feeling. Try to access the moment when you looked at someone and thought, <span className="italic">"This person. This one. Out of everyone in the world, this person."</span></p></TextReveal>
                <TextReveal>
                  <p className="text-slate-900">We can't. <mark className="bg-[#f0addd]/25 text-slate-900 px-1 rounded-sm">We've built a world of perfect documentation and zero remembrance.</mark></p>
                </TextReveal>
                <TextReveal><p>So what happens? You lose it. Slowly. Unknowingly. And then one day you're sitting across from the person you chose, and you're not sure why anymore. You're not sure who they are. You're not sure why you said yes.</p></TextReveal>
                <TextReveal><p className="text-slate-900">You become strangers. And you call it life.</p></TextReveal>
              </section>

              <section id="why" className="scroll-mt-24">
                <Chapter n={4} id="why" title="Why Belluh" />
                <TextReveal><p>I didn't set out to build an AI love journal. I don't wake up thinking about journals.</p></TextReveal>
                <TextReveal><p>But that night, after she left, after I couldn't sleep, after I couldn't stop thinking about that question, I understood something.</p></TextReveal>
                <TextReveal><p>You don't need AI to fall in love. People have been falling in love forever, without any help. It's the most natural thing we do. You are built for it.</p></TextReveal>
                <TextReveal><p>Yet you have nothing helping you capture the bits and pieces of your relationship. Not just the Instagram highlights, but the supermarket moments too.</p></TextReveal>
                <TextReveal><p>And then, when you need it. When you are at your next anniversary. When doubt creeps in, when you've forgotten, when you're tired and wondering if this is worth it. You can return to those moments. You can read them. You can feel them again. You can remember.</p></TextReveal>
                <TextReveal><p className="text-slate-900">That's why I'm building this.</p></TextReveal>
                <TextReveal><p className="!mt-10 font-serif italic text-3xl text-[#9bbecb]">— Jimmy</p></TextReveal>
              </section>
            </article>
          </div>
        </div>

        {/* The ending answers the story's question */}
        <section className="relative overflow-hidden px-6 md:px-8 py-28 md:py-40 bg-gradient-to-b from-white via-[#CDE9F2]/30 to-white">
          <div className="max-w-3xl mx-auto text-center">
            <TextReveal>
              <p className="font-serif italic text-lg md:text-xl text-slate-500 [text-wrap:balance]">Perfection, or someone to share it with?</p>
            </TextReveal>
            <TextReveal delay={100}>
              <h2 className="mt-6 font-serif text-[2.2rem] min-[400px]:text-[2.6rem] sm:text-5xl md:text-7xl leading-[1.05] tracking-tight text-slate-900">
                <span className="whitespace-nowrap">Choose someone</span><br />
                <span className="italic text-[#f0addd] whitespace-nowrap">to share it with.</span>
              </h2>
            </TextReveal>
            <TextReveal delay={200}>
              <p className="mt-8 mx-auto max-w-xl text-lg md:text-xl font-light leading-relaxed text-slate-500 [text-wrap:pretty]">
                Your supermarket moment is happening somewhere this week. Write one line about it tonight, and you'll still be able to find it years from now.
              </p>
            </TextReveal>
            <TextReveal delay={300}>
              <div className="mt-14 flex flex-col items-center gap-6">
                <BelluhOrb size={88} />
                <button onClick={onGetStarted} className="group inline-flex items-center gap-3 rounded-full bg-slate-900 px-9 py-4 text-base font-bold text-white transition-all hover:bg-black active:scale-95">
                  Begin your story <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
                <p className="text-sm text-slate-400">Already joined? <button onClick={onLogin} className="text-slate-600 hover:text-slate-900 underline decoration-slate-300 underline-offset-4">Log in</button></p>
              </div>
            </TextReveal>
          </div>
        </section>
      </main>

      <SiteFooter
        onTop={onBack}
        onSection={(id) => { onBack(); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 350); }}
        onGetStarted={onGetStarted}
        onLogin={onLogin}
        onShowLegal={onShowLegal}
        onGoToAbout={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onGoToCareers={onGoToCareers}
      />
    </div>
  );
};

export default About;
