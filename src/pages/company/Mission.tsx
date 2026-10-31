// belluh.com/mission, laid out like hinge.co/mission: what Belluh is for, what we value, how we work, what makes the
// product different, where it started, and who we're looking for. Everything said about the product is what it does.
import React from 'react';
import { Shell, SplitHero, Wrap, Eyebrow, Big, Body, Reveal, Arrow, Swash, Numbered, Lined, Dark, Photo, Pill, ShareBar, HiringLine, go, type PageProps } from './kit';

const VALUES = [
  { title: 'Presence', body: 'We build for the time you spend with each other, not the time you spend in an app. If Belluh is working, you’re looking up.' },
  { title: 'Care', body: 'Your memories are the most personal thing you’ll ever trust us with. We treat them that way, every time we touch them.' },
  { title: 'Courage', body: 'Love is brave. Building something new for it should be too. We take swings, and we say so when we miss.' },
];
const PRINCIPLES = [
  { title: 'Start with real evenings', body: 'Every idea begins with a real couple on a real night: the forgotten anniversary, the date that almost didn’t happen. Not with a feature list.' },
  { title: 'Fewer, better things', body: 'We would rather do a few things beautifully than many things fine. Saying no keeps Belluh calm.' },
  { title: 'Private by default', body: 'Your journal is for the two of you. Sharing anything, a guide, a page, a photo, is always your choice.' },
  { title: 'Earn it every day', body: 'Nobody needs another app. We have to be worth opening, and worth closing so you can go live it.' },
];
const DIFFERENCE = [
  { title: 'Bella remembers', body: 'Birthdays, firsts, their coffee order, the restaurant from your third date. Bella keeps the details so you can keep your attention on each other.' },
  { title: 'Plans with one ask', body: 'Ask for “Friday at 6 for our anniversary” and Bella comes back with ideas and a plan, not a list of tabs.' },
  { title: 'A story you write together', body: 'Photos, voice notes and words, from both of you, in one shared journal that only the two of you can open.' },
  { title: 'Your love map', body: 'Every memory pinned where it happened, on a map that zooms all the way out to the planets.' },
  { title: 'Guides worth sharing', body: 'Your favorite date spots, food, bars or whole countries, kept private, shared with friends by link, or posted for every couple.' },
  { title: 'Dates that keep themselves', body: 'How long you’ve been together, the next anniversary, the days that matter, counted for you and synced to your calendar.' },
  { title: 'A weekly look back', body: 'Once a week, a short, warm look at what you shared, so the good moments don’t slip by.' },
  { title: 'A profile that’s you', body: 'Music, books, voice notes, stickers, drawings and colors, anywhere you like. Your partner sees the you that you made.' },
];

const Mission: React.FC<PageProps> = (p) => (
  <Shell {...p} current="mission" title="Our Mission">
    <SplitHero photo="/milestones/just-married.webp" alt="A couple just married, laughing in the back of a car" side="left">
      <Big as="h1" className="font-bold">At the heart of Belluh.</Big>
    </SplitHero>

    {/* The mission, in two halves with an arrow between them */}
    <section className="pt-6 pb-24 md:py-36">
      <Wrap className="md:px-[12%]">
        <Reveal><Eyebrow>Belluh today</Eyebrow><Big className="max-w-[12ch] md:max-w-[14ch]">We want to help love last</Big></Reveal>
        <div className="mt-6 md:mt-0 md:ml-[38%]"><Arrow className="md:ml-[-5rem]" /></div>
        <Reveal delay={150} className="mt-4 md:ml-[46%]"><Big className="max-w-[13ch]">by keeping the small, everyday moments that hold two people close.</Big></Reveal>
      </Wrap>
    </section>

    {/* Values on a dark band, with giant numerals */}
    <Dark>
      <Wrap>
        <Reveal className="max-w-[640px]">
          <Eyebrow dark>Our values</Eyebrow>
          <h2 className="font-serif text-[2rem] md:text-[2.75rem] leading-[1.12] tracking-tight">Relationships are the whole point.</h2>
          <Body className="mt-6 text-white/80">Not only the romantic kind. Nothing hard gets built alone, so we hold ourselves to the same things we hope for between the two of you.</Body>
          <Body className="mt-4 text-white/80">Three values guide how we do that.</Body>
        </Reveal>
        <div className="mt-16 md:mt-24"><Numbered items={VALUES} dark giant /></div>
      </Wrap>
    </Dark>

    {/* Principles: a statement and a photo off the right edge, then four numbered rules */}
    <section className="pt-20 md:pt-28">
      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10">
        <Wrap className="md:pr-0 md:mr-0 w-full"><Reveal>
          <Eyebrow>Our principles</Eyebrow><Big>We put our values to work.</Big>
          <Body className="mt-6 text-[#1a1a1a]/75 max-w-[420px]">Principles turn what we believe into what we do, with every decision, big or small.</Body>
        </Reveal></Wrap>
        <div className="h-[340px] md:h-[540px] pl-5 md:pl-0"><Photo src="/milestones/first-kiss.webp" alt="A first kiss" bleed="right" /></div>
      </div>
      <Wrap className="py-20 md:py-28"><Numbered items={PRINCIPLES} /></Wrap>
    </section>

    {/* What makes the product different */}
    <Dark>
      <Wrap>
        <Reveal><Eyebrow dark>Our approach</Eyebrow><Big>The Belluh difference</Big></Reveal>
        <div className="mt-14 md:mt-20"><Lined items={DIFFERENCE} dark /></div>
      </Wrap>
    </Dark>

    {/* Where it started */}
    <section className="py-24 md:py-32 overflow-hidden">
      <Wrap className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center md:px-[8%]">
        <Reveal>
          <Eyebrow>Our story</Eyebrow>
          <Big><Swash>Why</Swash> we built it</Big>
          <Arrow className="mt-10 ml-[40%] hidden md:block" />
          <Body className="mt-8 md:mt-4 max-w-[380px] text-[#1a1a1a]/80">Belluh started with one ordinary evening in a supermarket, and a question that wouldn’t go away. It’s a short read, and it’s the reason for everything on this page.</Body>
          <div className="mt-8"><Pill onClick={() => go('/about')}>Read our why</Pill></div>
        </Reveal>
        <Reveal delay={150}>
          <div className="relative mx-auto w-full max-w-[460px] aspect-[4/5]">
            <img src="/milestones/30th-anniversary.webp" alt="A couple on their 30th anniversary" loading="lazy" className="absolute right-0 top-0 w-[78%] h-[78%] object-cover rounded-md rotate-[3deg] shadow-[0_40px_80px_-30px_rgba(26,26,26,0.45)]" />
            <img src="/milestones/first-date.webp" alt="A first date" loading="lazy" className="absolute left-0 bottom-0 w-[58%] h-[58%] object-cover rounded-md -rotate-[4deg] border-[6px] border-white shadow-[0_30px_60px_-24px_rgba(26,26,26,0.5)]" />
          </div>
        </Reveal>
      </Wrap>
    </section>

    <Dark className="!py-0"><Wrap><ShareBar text="Belluh: helping love last." /></Wrap></Dark>
    <HiringLine />
  </Shell>
);

export default Mission;
