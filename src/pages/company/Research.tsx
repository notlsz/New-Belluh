// belluh.com/research, laid out like hinge.co/labs: Belluh Research, the science behind the product. The studies cited
// are real, peer-reviewed papers (the same three Bella cites on the landing page), linked by DOI.
import React from 'react';
import { Emoji } from '../../lib/emoji3d';
import { useUi } from '../../i18n';
import table from '../../i18n/ui/companyPages';
import { Shell, SplitHero, Wrap, Eyebrow, Big, Body, Reveal, Ring, Numbered, Photo, Pill, ShareBar, Dark, go, BLUE, type PageProps } from './kit';

const METHODS = ['📚', '💬', '💡'];
const PAPERS = [
  { photo: '/milestones/first-kiss.webp', kicker: 'Family Process, 2004', by: 'Driver & Gottman', doi: '10.1111/j.1545-5300.2004.00024.x' },
  { photo: '/milestones/just-married.webp', kicker: 'Journal of Personality and Social Psychology, 2004', by: 'Gable, Reis, Impett & Asher', doi: '10.1037/0022-3514.87.2.228' },
  { photo: '/milestones/78th-trip.webp', kicker: 'Journal of Personality and Social Psychology, 2000', by: 'Aron, Norman, Aron, McKenna & Heyman', doi: '10.1037/0022-3514.78.2.273' },
  { photo: '/milestones/first-date.webp', kicker: 'Personal Relationships, 2010', by: 'Algoe, Gable & Maisel', doi: '10.1111/j.1475-6811.2010.01273.x' },
  { photo: '/milestones/first-baby.webp', kicker: 'Psychological Science, 2006', by: 'Coan, Schaefer & Davidson', doi: '10.1111/j.1467-9280.2006.01832.x' },
  { photo: '/milestones/30th-anniversary.webp', kicker: 'Journal of Personality and Social Psychology, 1996', by: 'Murray, Holmes & Griffin', doi: '10.1037/0022-3514.70.1.79' },
];

const Research: React.FC<PageProps> = (p) => {
  const C = useUi(table).research;
  const papers = PAPERS.map((x, i) => ({ ...x, ...C.papers[i] }));
  return (
  <Shell {...p} current="research" title={C.title} hiring={{ eyebrow: C.hiringEyebrow, line: C.hiringLine, cta: C.hiringCta, to: '/mission' }}>
    <SplitHero photo="/milestones/30th-anniversary.webp" alt={C.heroAlt} side="right">
      <p className="mb-6 text-[22px] tracking-tight"><span className="font-serif font-bold">Belluh</span><span className="font-light">Research</span></p>
      <Big as="h1" className="font-bold max-w-[12ch]">{C.heroTitle}</Big>
    </SplitHero>

    {/* The mission */}
    <section className="py-24 md:py-32">
      <Wrap className="md:px-[12%]">
        <Reveal><Eyebrow>{C.missionEyebrow}</Eyebrow><Big className="max-w-[13ch]">{C.missionBefore}<Ring>{C.missionRing}</Ring>{C.missionAfter}</Big></Reveal>
        <Reveal delay={150} className="mt-10 md:mt-12 md:ml-[46%] max-w-[440px]"><Body className="text-[#1a1a1a]/80">{C.missionBody}</Body></Reveal>
      </Wrap>
    </section>
    <div className="h-[60svh] md:h-[760px]"><img src="/milestones/first-baby.webp" alt={C.babyAlt} loading="lazy" className="w-full h-full object-cover" /></div>

    {/* The focus */}
    <section className="py-24 md:py-32">
      <Wrap>
        <Reveal className="max-w-[560px]"><Eyebrow>{C.focusEyebrow}</Eyebrow><Big>{C.focusTitle}</Big>
          <Body className="mt-6 text-[15px] text-[#1a1a1a]/75">{C.focusBody}</Body></Reveal>
        <div className="mt-16 md:mt-20"><Numbered items={C.focus.slice(0, 4)} /></div>
        <div className="mt-12 md:mt-16 md:w-1/4"><Numbered items={[C.focus[4]]} start={5} /></div>
      </Wrap>
    </section>

    {/* How we work: a photo off the left edge, the methods beside it */}
    <section className="pb-24 md:pb-32">
      <div className="grid grid-cols-1 md:grid-cols-[42%_1fr] items-center gap-12 md:gap-20">
        <div className="h-[420px] md:h-[660px] pr-5 md:pr-0"><Photo src="/milestones/first-date.webp" alt={C.methodsAlt} bleed="left" /></div>
        <div className="px-5 md:pl-0 md:pr-20"><Reveal>
          <Eyebrow>{C.methodsEyebrow}</Eyebrow><Big>{C.methodsTitle}</Big>
          <Body className="mt-6 text-[15px] text-[#1a1a1a]/75 max-w-[520px]">{C.methodsBody}</Body>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-6">
            {METHODS.map((e, i) => <div key={e}><Emoji e={e} size={40} /><p className="mt-3 text-[14px] leading-snug">{C.methods[i]}</p></div>)}
          </div>
        </Reveal></div>
      </div>
    </section>

    {/* The studies */}
    <section className="pb-24 md:pb-32">
      <Wrap>
        <Reveal><h2 className="font-serif text-[2.5rem] md:text-[3.25rem] tracking-[-0.02em] font-bold">{C.scienceTitle}<sup className="ml-1 text-[14px] font-sans font-normal" style={{ color: BLUE }}>({papers.length})</sup></h2></Reveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-14">
          {papers.map((x, i) => (
            <Reveal key={x.doi} delay={i * 90}>
              <a href={`https://doi.org/${x.doi}`} target="_blank" rel="noopener noreferrer" className="group block">
                <div className="aspect-[16/9] overflow-hidden rounded-md"><img src={x.photo} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" /></div>
                <p className="mt-4 text-[13px] font-semibold" style={{ color: BLUE }}>{x.kicker}</p>
                <h3 className="mt-2 font-serif text-[1.5rem] leading-snug tracking-tight">{x.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.6] text-[#1a1a1a]/75">{x.body}</p>
                <span className="mt-4 inline-flex h-8 items-center px-3.5 rounded-full bg-[#1a1a1a]/[0.06] text-[13px]">{x.by} ↗</span>
              </a>
            </Reveal>
          ))}
        </div>
      </Wrap>
    </section>

    <ShareBar text={C.share} />
  </Shell>
  );
};

export default Research;
