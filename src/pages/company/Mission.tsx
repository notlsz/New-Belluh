// belluh.com/mission, laid out like hinge.co/mission: what Belluh is for, what we value, how we work, what makes the
// product different, where it started, and who we're looking for. Everything said about the product is what it does.
import React from 'react';
import { useUi } from '../../i18n';
import table from '../../i18n/ui/companyPages';
import { Shell, SplitHero, Wrap, Eyebrow, Big, Body, Reveal, Arrow, Swash, Numbered, Lined, Dark, Photo, Pill, ShareBar, go, type PageProps } from './kit';

const Mission: React.FC<PageProps> = (p) => {
  const C = useUi(table).mission;
  return (
  <Shell {...p} current="mission" title={C.title}>
    <SplitHero photo="/milestones/just-married.webp" alt={C.heroAlt} side="left">
      <Big as="h1" className="font-bold">{C.heroTitle}</Big>
    </SplitHero>

    {/* The mission, in two halves with an arrow between them */}
    <section className="pt-6 pb-24 md:py-36">
      <Wrap className="md:px-[12%]">
        <Reveal><Eyebrow>{C.todayEyebrow}</Eyebrow><Big className="max-w-[12ch] md:max-w-[14ch]">{C.todayA}</Big></Reveal>
        <div className="mt-6 md:mt-0 md:ml-[38%]"><Arrow className="md:ml-[-5rem]" /></div>
        <Reveal delay={150} className="mt-4 md:ml-[46%]"><Big className="max-w-[15ch]">{C.todayB}</Big></Reveal>
      </Wrap>
    </section>

    {/* Values on a dark band, with giant numerals */}
    <Dark>
      <Wrap>
        <Reveal className="max-w-[640px]">
          <Eyebrow dark>{C.valuesEyebrow}</Eyebrow>
          <h2 className="font-serif text-[2rem] md:text-[2.75rem] leading-[1.12] tracking-tight">{C.valuesTitle}</h2>
          <Body className="mt-6 text-white/80">{C.valuesBody1}</Body>
          <Body className="mt-4 text-white/80">{C.valuesBody2}</Body>
        </Reveal>
        <div className="mt-16 md:mt-24"><Numbered items={C.values} dark giant /></div>
      </Wrap>
    </Dark>

    {/* Principles: a statement and a photo off the right edge, then four numbered rules */}
    <section className="pt-20 md:pt-28">
      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10">
        <Wrap className="md:pr-0 md:mr-0 w-full"><Reveal>
          <Eyebrow>{C.principlesEyebrow}</Eyebrow><Big>{C.principlesTitle}</Big>
          <Body className="mt-6 text-[#1a1a1a]/75 max-w-[420px]">{C.principlesBody}</Body>
        </Reveal></Wrap>
        <div className="h-[340px] md:h-[540px] pl-5 md:pl-0"><Photo src="/milestones/first-kiss.webp" alt={C.principlesAlt} bleed="right" /></div>
      </div>
      <Wrap className="py-20 md:py-28"><Numbered items={C.principles} /></Wrap>
    </section>

    {/* What makes the product different */}
    <Dark>
      <Wrap>
        <Reveal><Eyebrow dark>{C.approachEyebrow}</Eyebrow><Big>{C.approachTitle}</Big></Reveal>
        <div className="mt-14 md:mt-20"><Lined items={C.difference} dark /></div>
      </Wrap>
    </Dark>

    {/* Where it started */}
    <section className="py-24 md:py-32 overflow-hidden">
      <Wrap className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center md:px-[8%]">
        <Reveal>
          <Eyebrow>{C.storyEyebrow}</Eyebrow>
          <Big><Swash>{C.storySwash}</Swash> {C.storyRest}</Big>
          <Arrow className="mt-10 ml-[40%] hidden md:block" />
          <Body className="mt-8 md:mt-4 max-w-[380px] text-[#1a1a1a]/80">{C.storyBody}</Body>
          <div className="mt-8"><Pill onClick={() => go('/about')}>{C.storyCta}</Pill></div>
        </Reveal>
        <Reveal delay={150}>
          <div className="relative mx-auto w-full max-w-[460px] aspect-[4/5]">
            <img src="/milestones/30th-anniversary.webp" alt={C.storyAlt1} loading="lazy" className="absolute right-0 top-0 w-[78%] h-[78%] object-cover rounded-md rotate-[3deg] shadow-[0_40px_80px_-30px_rgba(26,26,26,0.45)]" />
            <img src="/milestones/first-date.webp" alt={C.storyAlt2} loading="lazy" className="absolute left-0 bottom-0 w-[58%] h-[58%] object-cover rounded-md -rotate-[4deg] border-[6px] border-white shadow-[0_30px_60px_-24px_rgba(26,26,26,0.5)]" />
          </div>
        </Reveal>
      </Wrap>
    </section>

    <Dark className="!py-0"><Wrap><ShareBar text={C.share} /></Wrap></Dark>
  </Shell>
  );
};

export default Mission;
