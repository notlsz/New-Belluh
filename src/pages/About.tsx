// belluh.com/about, laid out like hinge.co/our-story: a big serif title, the supermarket photo running off the left edge
// beside the founding letter (four chapters, a pulled quote circled by hand, a signature), then who Bella is, then the
// story's question answered on a dark band next to the evening's receipt. The words are the original letter's.
import React, { useEffect } from 'react';
import { useI18n, useUi } from '../i18n';
import table from '../i18n/ui/aboutPage';
import { Shell, Wrap, Eyebrow, Big, Reveal, Dark, Pill, Arrow, BLUE, INK } from './company/kit';

interface AboutProps {
  onBack: () => void;
  onGetStarted: () => void;
  onLogin: () => void;
  onShowLegal?: (type: 'tos' | 'privacy') => void;
  onGoToCareers?: () => void;
}

// A real hand for the signature, loaded once
const SIG_FONT = 'https://fonts.googleapis.com/css2?family=Mrs+Saint+Delafield&display=swap';

// The evening, itemized. An illustration of the story, in the spirit of Belluh's own keepsake receipt.
const QTY = [1, 10000, 1, 50, 13];
const BARS = [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 3, 1];

export const Receipt: React.FC = () => {
  const R = useUi(table).receipt;
  const { num } = useI18n();
  return (
    <figure className="relative mx-auto w-full max-w-[340px] rotate-[2.5deg] transition-transform duration-700 hover:rotate-0" aria-label={R.label}>
      <div style={{ clipPath: 'polygon(0 0,100% 0,100% calc(100% - 10px),95% 100%,90% calc(100% - 10px),85% 100%,80% calc(100% - 10px),75% 100%,70% calc(100% - 10px),65% 100%,60% calc(100% - 10px),55% 100%,50% calc(100% - 10px),45% 100%,40% calc(100% - 10px),35% 100%,30% calc(100% - 10px),25% 100%,20% calc(100% - 10px),15% 100%,10% calc(100% - 10px),5% 100%,0 calc(100% - 10px))' }} className="relative bg-white px-7 pt-8 pb-10 font-mono text-[13px] leading-relaxed text-slate-700 shadow-[0_40px_80px_-30px_rgba(63,116,134,0.45)]">
        <p className="text-center font-bold tracking-[0.25em] text-slate-900">{R.store}</p>
        <p className="text-center text-[11px] tracking-[0.2em] text-slate-400">{R.sub}</p>
        <div className="mt-7 space-y-2.5">
          {R.items.map((what, i) => (
            <div key={i} className="flex items-baseline gap-3">
              <span className="flex-1 min-w-0">{what}</span>
              <span className="tabular-nums text-slate-900">{num(QTY[i] ?? 1)}</span>
            </div>
          ))}
        </div>
        <div className="mt-7 flex items-baseline gap-3 font-bold text-slate-900">
          <span className="flex-1">{R.total}</span>
          <span className="text-right text-[#e58fc9]">{R.totalValue}</span>
        </div>
        <p className="mt-7 text-center text-[11px] tracking-[0.2em] text-slate-400">{R.footer}</p>
        <div className="mt-4 mx-auto flex h-10 w-48 items-stretch justify-center gap-[2px]" aria-hidden="true">
          {BARS.map((w, i) => <span key={i} className="bg-slate-800" style={{ width: w }} />)}
        </div>
      </div>
    </figure>
  );
};

// A hand-drawn ellipse around a phrase, in Belluh blue. Drawn as an inline background that is cloned onto each line, so
// a long phrase (German, French) that wraps on a phone gets a ring per line and the punctuation stays beside it.
const RING = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 80' preserveAspectRatio='none'><path d='M150 8C96-2 18 6 6 36c-10 26 50 40 112 38 58-2 86-18 76-38C184 12 132 4 90 8' fill='none' stroke='${BLUE}' stroke-width='2.2' stroke-linecap='round' vector-effect='non-scaling-stroke'/></svg>`)}")`;
const Ellipse: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="px-[0.45em] py-[0.32em] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]" style={{ backgroundImage: RING, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' }}>{children}</span>
);

// A chapter of the letter: a large serif numeral on its own line, like a year on a timeline, then its title
const Chapter: React.FC<{ n: number; id: string; title: string; children: React.ReactNode }> = ({ n, id, title, children }) => (
  <section id={id} className={`scroll-mt-28 ${n > 1 ? 'pt-16 md:pt-24' : ''}`}>
    <Reveal>
      <p className="font-serif text-[3.5rem] md:text-[4.5rem] leading-none tracking-[-0.03em]" style={{ color: BLUE }}>{n}</p>
      <h2 className="mt-4 font-serif text-[2rem] md:text-[2.6rem] leading-[1.1] tracking-[-0.015em]">{title}</h2>
    </Reveal>
    <div className="mt-8 space-y-6">{children}</div>
  </section>
);

const P: React.FC<{ children: React.ReactNode; strong?: boolean }> = ({ children, strong }) => (
  <Reveal><p className={`text-[17px] md:text-[18px] leading-[1.7] ${strong ? 'text-[#1a1a1a] font-medium' : 'text-[#1a1a1a]/80'}`}>{children}</p></Reveal>
);

const Pulled: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Reveal><p className="py-6 md:py-10 font-serif text-[1.75rem] md:text-[2.5rem] leading-[1.42] tracking-[-0.015em] text-[#1a1a1a]">{children}</p></Reveal>
);

const About: React.FC<AboutProps> = (p) => {
  const A = useUi(table);
  const onShowLegal = p.onShowLegal ?? (() => {});
  useEffect(() => { if (document.getElementById('about-sig-font')) return; const l = document.createElement('link'); l.id = 'about-sig-font'; l.rel = 'stylesheet'; l.href = SIG_FONT; document.head.appendChild(l); }, []);

  return (
    <Shell onGetStarted={p.onGetStarted} onLogin={p.onLogin} onShowLegal={onShowLegal} current="why" title={A.docTitle}>
      {/* The title, big and bold at the top left */}
      <Wrap className="pt-14 md:pt-24 pb-12 md:pb-20">
        <Reveal>
          <h1 className="font-serif font-semibold text-[3rem] leading-[1.02] md:text-[5.75rem] md:leading-[0.98] tracking-[-0.03em] max-w-[14ch] [text-wrap:balance]">{A.title}</h1>
          <p className="mt-6 md:mt-8 max-w-[560px] text-[19px] md:text-[21px] leading-[1.5] text-[#1a1a1a]/70">{A.lede}</p>
        </Reveal>
      </Wrap>

      {/* The letter: the photo runs off the left edge and stays beside you as you read */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="pr-5 md:pr-12 lg:pr-16">
          <figure className="md:sticky md:top-[96px]">
            <div className="h-[56svh] md:h-[calc(100svh-150px)] md:max-h-[820px] overflow-hidden rounded-r-[20px]">
              <img
                src="/images/supermarket-1800.webp"
                srcSet="/images/supermarket-900.webp 900w, /images/supermarket-1800.webp 1800w"
                sizes="(min-width: 768px) 50vw, 100vw"
                width={1800} height={1350}
                alt={A.photoAlt}
                {...({ fetchpriority: 'high' } as Record<string, string>)}
                className="w-full h-full object-cover grayscale contrast-[1.2]"
              />
            </div>
            <figcaption className="mt-3 pl-5 md:pl-20 text-[13px] text-[#1a1a1a]/50">{A.caption}</figcaption>
          </figure>
        </div>

        <article className="px-5 md:pl-0 md:pr-20 lg:pr-[9vw] pt-14 md:pt-0 pb-24 md:pb-36 max-w-[720px]">
          <Reveal><Eyebrow>{A.eyebrow}</Eyebrow></Reveal>

          <Chapter n={1} id="moment" title={A.chapters.moment}>
            {A.moment.map((t, i) => <P key={i} strong={i === 0}>{t}</P>)}
            <Pulled>{A.quoteBefore}<Ellipse>{A.quoteRing}</Ellipse>{A.quoteAfter}</Pulled>
            <P strong>{A.realized}</P>
            {A.momentAfter.map((t, i) => <P key={i}>{t}</P>)}
          </Chapter>

          <Chapter n={2} id="realization" title={A.chapters.realization}>
            {A.realization.map((t, i) => <P key={i} strong={i === 3}>{t}</P>)}
          </Chapter>

          <Chapter n={3} id="tools" title={A.chapters.tools}>
            <P>{A.tools.before}<span className="italic">{A.tools.quote}</span></P>
            <Pulled>{A.tools.cant} <span style={{ color: BLUE }}>{A.tools.mark}</span></Pulled>
            {A.tools.after.map((t, i) => <P key={i} strong={i === A.tools.after.length - 1}>{t}</P>)}
          </Chapter>

          <Chapter n={4} id="why" title={A.chapters.why}>
            {A.why.map((t, i) => <P key={i} strong={i === A.why.length - 1}>{t}</P>)}
            <Reveal>
              <div className="pt-6">
                <p className="text-[4rem] md:text-[4.75rem] leading-[1.1]" style={{ fontFamily: "'Mrs Saint Delafield', cursive", color: INK }} aria-hidden>{A.signature}</p>
                <p className="mt-1 text-[15px] text-[#1a1a1a]/60">{A.signature}</p>
              </div>
            </Reveal>
          </Chapter>
        </article>
      </section>

      {/* Who is Bella, and where the name comes from */}
      <section className="py-24 md:py-32" style={{ background: '#EEF4F6' }}>
        <Wrap className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-20 items-center">
          <Reveal>
            <Eyebrow>{A.bella.eyebrow}</Eyebrow>
            <Big>{A.bella.title}</Big>
            <div className="mt-8 space-y-5 max-w-[520px]">
              {A.bella.body.map((t, i) => <p key={i} className="text-[17px] md:text-[18px] leading-[1.7] text-[#1a1a1a]/80">{t}</p>)}
              <p className="text-[17px] md:text-[18px] leading-[1.7] text-[#1a1a1a]/80"><span className="font-semibold text-[#1a1a1a]">{A.bella.funLabel}</span> {A.bella.fun}</p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="relative mx-auto w-full max-w-[460px] aspect-square rounded-[20px] bg-white flex flex-col justify-center px-10 md:px-14" aria-hidden>
              <p className="font-serif italic text-[3rem] md:text-[3.75rem] leading-none text-[#1a1a1a]/40">bella</p>
              <Arrow className="mt-4 ml-[30%]" />
              <p className="mt-4 self-end font-serif font-semibold text-[3.5rem] md:text-[4.5rem] leading-none tracking-[-0.02em]"><Ellipse>Belluh</Ellipse></p>
            </div>
          </Reveal>
        </Wrap>
      </section>

      {/* The story's question, answered, beside the evening's receipt */}
      <Dark className="overflow-hidden">
        <Wrap className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-center">
          <Reveal>
            <p className="font-serif italic text-[19px] md:text-[21px] text-white/65 [text-wrap:balance]">{A.end.question}</p>
            <Big className="mt-5">{A.end.line1}<br /><span className="italic" style={{ color: '#F0ADDD' }}>{A.end.line2}</span></Big>
            <p className="mt-8 max-w-[480px] text-[17px] md:text-[18px] leading-[1.65] text-white/75">{A.end.body}</p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Pill light onClick={p.onGetStarted}>{A.end.cta}</Pill>
              <span className="inline-flex h-11 items-center gap-1.5 text-[15px] text-white/60">{A.end.joined}
                <button onClick={p.onLogin} className="text-white underline underline-offset-4 decoration-white/40 hover:decoration-white">{A.end.login}</button>
              </span>
            </div>
          </Reveal>
          <Reveal delay={150}><Receipt /></Reveal>
        </Wrap>
      </Dark>
    </Shell>
  );
};

export default About;
