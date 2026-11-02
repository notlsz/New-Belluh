// belluh.com/research, laid out like hinge.co/labs: Belluh Research, the science behind the product. The studies cited
// are real, peer-reviewed papers, linked by DOI.
import React from 'react';
import { Emoji } from '../../lib/emoji3d';
import { useUi } from '../../i18n';
import table from '../../i18n/ui/companyPages';
import { Shell, SplitHero, Wrap, Eyebrow, Big, Body, Reveal, Ring, Numbered, Photo, Pill, ShareBar, Dark, go, BLUE, type PageProps } from './kit';

const METHODS = ['📚', '💬', '💡'];
// Recent, peer-reviewed studies (2018 to 2025), each checked against Crossref or PubMed. `paper` is the original
// title, kept in its own language; the card copy describes the finding modestly and is localized in companyPages.
const PAPERS = [
  { photo: '/milestones/first-kiss.webp', kicker: 'PNAS, 2020', by: 'Joel et al.', doi: '10.1073/pnas.1917036117', paper: 'Machine learning uncovers the most robust self-report predictors of relationship quality across 43 longitudinal couples studies' },
  { photo: '/moments/couch-hug.webp', kicker: 'Emotion, 2022', by: 'Chang, Dwyer & Algoe', doi: '10.1037/emo0001020', paper: 'Better together: Integrative analysis of behavioral gratitude in close relationships using the three-factorial interpersonal emotions (TIE) framework' },
  { photo: '/milestones/just-married.webp', kicker: 'Social and Personality Psychology Compass, 2018', by: 'Peters, Reis & Gable', doi: '10.1111/spc3.12407', paper: 'Making the good even better: A review and theoretical model of interpersonal capitalization' },
  { photo: '/milestones/78th-trip.webp', kicker: 'Journal of Personality and Social Psychology, 2019', by: 'Muise et al.', doi: '10.1037/pspi0000148', paper: 'Broadening your horizons: Self-expanding activities promote desire and satisfaction in established romantic relationships' },
  { photo: '/moments/paris-seine.webp', kicker: 'Journal of the Association for Consumer Research, 2019', by: 'Garcia-Rada, Sezer & Norton', doi: '10.1086/702761', paper: 'Rituals and Nuptials: The Emotional and Relational Consequences of Relationship Rituals' },
  { photo: '/milestones/30th-anniversary.webp', kicker: 'The Gerontologist, 2022', by: 'Mroz et al.', doi: '10.1093/geront/gnac053', paper: 'When Harry Met Sally: Older Adult Spouses’ First Encounter Reminiscing and Well-Being' },
  { photo: '/moments/rainy-campus.webp', kicker: 'Couple and Family Psychology: Research and Practice, 2021', by: 'Rodriguez, Stewart & Neighbors', doi: '10.1037/cfp0000173', paper: 'Effects of a brief web-based interpersonal conflict cognitive reappraisal expressive-writing intervention on changes in romantic conflict during COVID-19 quarantine' },
  { photo: '/moments/bus-ride.webp', kicker: 'Journal of Social and Personal Relationships, 2021', by: 'Holtzman et al.', doi: '10.1177/02654075211043296', paper: 'Long-distance texting: Text messaging is linked with higher relationship satisfaction in long-distance relationships' },
  { photo: '/moments/couch-kiss.webp', kicker: 'PLOS Mental Health, 2025', by: 'Hatch et al.', doi: '10.1371/journal.pmen.0000145', paper: 'When ELIZA meets therapists: A Turing test for the heart and mind' },
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
        <Reveal><h2 className="font-serif text-[2.5rem] md:text-[3.25rem] tracking-[-0.02em] font-bold">{C.scienceTitle}<sup className="ml-1 text-[14px] font-sans font-normal" style={{ color: BLUE }}>({papers.length})</sup></h2>
          <p className="mt-4 max-w-[520px] text-[15px] leading-[1.6] text-[#1a1a1a]/75">{C.scienceNote}</p></Reveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-14">
          {papers.map((x, i) => (
            <Reveal key={x.doi} delay={i * 90} className="h-full">
              <a href={`https://doi.org/${x.doi}`} target="_blank" rel="noopener noreferrer" title={x.paper} className="group flex h-full flex-col items-start">
                <div className="aspect-[16/9] w-full overflow-hidden rounded-md"><img src={x.photo} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" /></div>
                <p className="mt-4 text-[13px] font-semibold" style={{ color: BLUE }}>{x.kicker}</p>
                <h3 className="mt-2 font-serif text-[1.5rem] leading-snug tracking-tight">{x.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.6] text-[#1a1a1a]/75">{x.body}</p>
                <span className="mt-auto pt-4"><span className="inline-flex h-8 items-center px-3.5 rounded-full bg-[#1a1a1a]/[0.06] text-[13px]">{x.by} ↗</span></span>
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
