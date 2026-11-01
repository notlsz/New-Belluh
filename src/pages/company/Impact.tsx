// belluh.com/impact, laid out like hinge.co/onemorehour: Belluh Together, the work beyond the app to get couples off
// their phones and out into the world, one evening at a time. It asks groups to get in touch; it promises no money.
import React from 'react';
import { useUi } from '../../i18n';
import table from '../../i18n/ui/companyPages';
import { Shell, SplitHero, Wrap, Eyebrow, Big, Body, Reveal, Lined, Photo, Pill, ShareBar, go, type PageProps } from './kit';

const MAIL = 'elizabeth@belluh.com';

const Impact: React.FC<PageProps> = (p) => {
  const C = useUi(table).impact;
  const links = [{ label: C.workLinks[0], onClick: () => go('/') }, { label: C.workLinks[1], onClick: () => go('/research') }];
  const work = C.work.map((w, i) => (links[i] ? { ...w, link: links[i] } : w));
  return (
  <Shell {...p} current="impact" title={C.title}>
    <SplitHero photo="/milestones/first-date.webp" alt={C.heroAlt} side="right">
      <p className="mb-6 font-serif text-[22px] tracking-tight">{C.title}</p>
      <Big as="h1" className="max-w-[15ch]">{C.heroTitle}</Big>
    </SplitHero>

    {/* The why, on a block of color */}
    <section className="py-16 md:py-24" style={{ background: '#cde9f2' }}>
      <Wrap><Reveal className="max-w-[1100px] space-y-6 font-serif text-[1.35rem] md:text-[1.75rem] leading-[1.4] tracking-tight">
        <p>{C.why1}</p>
        <p>{C.why2}</p>
      </Reveal></Wrap>
    </section>

    {/* The ask: groups get in touch */}
    <section className="pt-24 md:pt-32">
      <Wrap><Reveal className="max-w-[980px]">
        <Big>{C.askTitle}</Big>
        <Body className="mt-8 text-[#1a1a1a]/80">{C.askBody}</Body>
        <Body className="mt-4 text-[#1a1a1a]/80">{C.askBody2}</Body>
        <div className="mt-8"><Pill href={`mailto:${MAIL}?subject=${encodeURIComponent('Belluh Together')}`}>{C.askCta}</Pill></div>
      </Reveal></Wrap>
      <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-2"><div className="hidden md:block" /><div className="h-[380px] md:h-[620px] pl-5 md:pl-0"><Photo src="/milestones/78th-trip.webp" alt={C.photoAlt} bleed="right" /></div></div>
    </section>

    {/* What we're already doing */}
    <section className="py-24 md:py-36">
      <Wrap>
        <Reveal><Big className="max-w-[12ch] mb-14 md:mb-20">{C.nowTitle}</Big></Reveal>
        <Lined items={work} />
      </Wrap>
    </section>

    {/* A full-bleed photo with the initiative's name turning in a circle */}
    <section className="relative h-[70svh] md:h-[720px] overflow-hidden" aria-label={C.title}>
      <img src="/milestones/30th-anniversary.webp" alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/15" />
      <svg viewBox="0 0 300 300" className="impact-spin absolute left-1/2 top-1/2 w-[260px] h-[260px] md:w-[340px] md:h-[340px] -translate-x-1/2 -translate-y-1/2 text-white" aria-hidden>
        <defs><path id="ring" d="M150 150 m-110 0 a110 110 0 1 1 220 0 a110 110 0 1 1 -220 0" /></defs>
        <text fill="currentColor" style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 36, letterSpacing: 2 }}><textPath href="#ring">{C.ring}</textPath></text>
      </svg>
      <style>{`@keyframes impact-spin { to { transform: translate(-50%, -50%) rotate(360deg); } } .impact-spin { animation: impact-spin 40s linear infinite; } @media (prefers-reduced-motion: reduce) { .impact-spin { animation: none; } }`}</style>
    </section>

    <ShareBar text={C.share} />
  </Shell>
  );
};

export default Impact;
