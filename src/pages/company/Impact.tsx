// belluh.com/impact, laid out like hinge.co/onemorehour: Belluh Together, the work beyond the app to get couples off
// their phones and out into the world, one evening at a time. It asks groups to get in touch; it promises no money.
import React from 'react';
import { Shell, SplitHero, Wrap, Eyebrow, Big, Body, Reveal, Lined, Photo, Pill, ShareBar, go, type PageProps } from './kit';

const MAIL = 'elizabeth@belluh.com';
const WORK = [
  { title: 'Guides, by couples, for couples', body: 'Any couple can turn the places they love into a guide, the date spots, the food, the bars, the whole trip, and share it with friends or with every couple on Belluh.', link: { label: 'See how guides work', onClick: () => go('/') } },
  { title: 'Built on relationship science', body: 'What we make starts from decades of peer-reviewed research on what keeps couples close. Read the studies behind it.', link: { label: 'Visit Belluh Research', onClick: () => go('/research') } },
  { title: 'Plans that end in a place', body: 'Ask Belluh for an anniversary, a Friday night or a weekend away and the answer is somewhere to go together, not something to scroll.' },
  { title: 'Free to start', body: 'Every couple can start Belluh for free. Keeping your story together shouldn’t depend on what you can pay.' },
];

const Impact: React.FC<PageProps> = (p) => (
  <Shell {...p} current="impact" title="Belluh Together">
    <SplitHero photo="/milestones/first-date.webp" alt="Two people on a first date" side="right">
      <p className="mb-6 font-serif text-[22px] tracking-tight">Belluh Together</p>
      <Big as="h1" className="max-w-[15ch]">An impact initiative to help love last, one evening at a time.</Big>
    </SplitHero>

    {/* The why, on a block of color */}
    <section className="py-16 md:py-24" style={{ background: '#cde9f2' }}>
      <Wrap><Reveal className="max-w-[1100px] space-y-6 font-serif text-[1.35rem] md:text-[1.75rem] leading-[1.4] tracking-tight">
        <p>We’re on a mission to help love last. And we know that takes more than a good app. It takes the in-between stuff: the standing date night, the dance class you keep going back to, the friends who make room at the table for both of you.</p>
        <p>That’s why, through Belluh Together, we want to back the people and places that bring couples together in person, and build campaigns that make it easier to show up for each other.</p>
      </Reveal></Wrap>
    </section>

    {/* The ask: groups get in touch */}
    <section className="pt-24 md:pt-32">
      <Wrap><Reveal className="max-w-[980px]">
        <Big>Tell us what you’re building</Big>
        <Body className="mt-8 text-[#1a1a1a]/80">You’ve made something couples keep coming back to. The supper club where strangers become regulars. The Tuesday salsa class that’s really about the walk home. The run club where two people met, and the board-game night where they still go together. If you bring couples together in real life, we want to hear about it, and find ways to help.</Body>
        <Body className="mt-4 text-[#1a1a1a]/80">Tell us what you’ve built. We read every note.</Body>
        <div className="mt-8"><Pill href={`mailto:${MAIL}?subject=${encodeURIComponent('Belluh Together')}`}>Tell us about your group</Pill></div>
      </Reveal></Wrap>
      <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-2"><div className="hidden md:block" /><div className="h-[380px] md:h-[620px] pl-5 md:pl-0"><Photo src="/milestones/78th-trip.webp" alt="A couple on their 78th trip together" bleed="right" /></div></div>
    </section>

    {/* What we're already doing */}
    <section className="py-24 md:py-36">
      <Wrap>
        <Reveal><Big className="max-w-[12ch] mb-14 md:mb-20">What we’re doing now</Big></Reveal>
        <Lined items={WORK} />
      </Wrap>
    </section>

    {/* A full-bleed photo with the initiative's name turning in a circle */}
    <section className="relative h-[70svh] md:h-[720px] overflow-hidden" aria-label="Belluh Together">
      <img src="/milestones/30th-anniversary.webp" alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/15" />
      <svg viewBox="0 0 300 300" className="impact-spin absolute left-1/2 top-1/2 w-[260px] h-[260px] md:w-[340px] md:h-[340px] -translate-x-1/2 -translate-y-1/2 text-white" aria-hidden>
        <defs><path id="ring" d="M150 150 m-110 0 a110 110 0 1 1 220 0 a110 110 0 1 1 -220 0" /></defs>
        <text fill="currentColor" style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 36, letterSpacing: 2 }}><textPath href="#ring">Belluh Together   Belluh Together   </textPath></text>
      </svg>
      <style>{`@keyframes impact-spin { to { transform: translate(-50%, -50%) rotate(360deg); } } .impact-spin { animation: impact-spin 40s linear infinite; } @media (prefers-reduced-motion: reduce) { .impact-spin { animation: none; } }`}</style>
    </section>

    <ShareBar text="Belluh Together: helping love last, one evening at a time." />
  </Shell>
);

export default Impact;
