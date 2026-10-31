// belluh.com/research, laid out like hinge.co/labs: Belluh Research, the science behind the product. The studies cited
// are real, peer-reviewed papers (the same three Bella cites on the landing page), linked by DOI.
import React from 'react';
import { Emoji } from '../../lib/emoji3d';
import { Shell, SplitHero, Wrap, Eyebrow, Big, Body, Reveal, Ring, Numbered, Photo, Pill, ShareBar, Dark, go, BLUE, type PageProps } from './kit';

const FOCUS = [
  { title: 'Small moments', body: 'The tiny bids for attention, a look, a “come see this”, and what happens when they’re met. Belluh is built to notice them.' },
  { title: 'Good news, shared', body: 'How a partner responds to good news shapes how close two people feel. We study how to make celebrating each other easy.' },
  { title: 'New things, together', body: 'Novelty keeps couples close, even decades in. We study what makes a plan feel new, and how to make the next one happen.' },
  { title: 'Remembering', body: 'Your story is worth keeping. We study which moments matter most to look back on, and how to bring them back at the right time.' },
  { title: 'Time back', body: 'Every minute in an app is a minute not spent together. We study how to do more for couples while asking less of their attention.' },
];
const METHODS = [
  { e: '📚', label: 'Peer-reviewed research' },
  { e: '💬', label: 'Couples’ feedback' },
  { e: '💡', label: 'Small, careful experiments' },
];
const PAPERS = [
  { photo: '/milestones/first-kiss.webp', kicker: 'Family Process, 2004', title: 'Turn toward the small things', body: 'Couples who respond to each other’s everyday bids for attention are happier and fight more kindly.', by: 'Driver & Gottman', doi: '10.1111/j.1545-5300.2004.00024.x' },
  { photo: '/milestones/just-married.webp', kicker: 'Journal of Personality and Social Psychology, 2004', title: 'Celebrate the good news', body: 'How you react when your partner shares something good predicts how close you feel, more than how you handle the bad.', by: 'Gable, Reis, Impett & Asher', doi: '10.1037/0022-3514.87.2.228' },
  { photo: '/milestones/78th-trip.webp', kicker: 'Journal of Personality and Social Psychology, 2000', title: 'Do something new together', body: 'Trying new, exciting things as a pair lifts relationship satisfaction, even years in.', by: 'Aron, Norman, Aron, McKenna & Heyman', doi: '10.1037/0022-3514.78.2.273' },
];

const Research: React.FC<PageProps> = (p) => (
  <Shell {...p} current="research" title="Belluh Research">
    <SplitHero photo="/milestones/30th-anniversary.webp" alt="A couple on their 30th anniversary" side="right">
      <p className="mb-6 text-[22px] tracking-tight"><span className="font-serif font-bold">Belluh</span><span className="font-light">Research</span></p>
      <Big as="h1" className="font-bold max-w-[12ch]">Research to help love last.</Big>
    </SplitHero>

    {/* The mission */}
    <section className="py-24 md:py-32">
      <Wrap className="md:px-[12%]">
        <Reveal><Eyebrow>The mission</Eyebrow><Big className="max-w-[13ch]">Love, studied with <Ring>care</Ring>.</Big></Reveal>
        <Reveal delay={150} className="mt-10 md:mt-12 md:ml-[46%] max-w-[440px]"><Body className="text-[#1a1a1a]/80">Decades of research say love lasts in small, ordinary moments. Belluh Research turns that science into the things Belluh does for you, and Bella will show you the studies whenever you ask.</Body></Reveal>
      </Wrap>
    </section>
    <div className="h-[60svh] md:h-[760px]"><img src="/milestones/first-baby.webp" alt="A couple with their first baby" loading="lazy" className="w-full h-full object-cover" /></div>

    {/* The focus */}
    <section className="py-24 md:py-32">
      <Wrap>
        <Reveal className="max-w-[560px]"><Eyebrow>The focus</Eyebrow><Big>What we study.</Big>
          <Body className="mt-6 text-[15px] text-[#1a1a1a]/75">From the first date to the fiftieth anniversary, we look at the moments that make a difference, so Belluh can help with the ones that matter most.</Body></Reveal>
        <div className="mt-16 md:mt-20"><Numbered items={FOCUS.slice(0, 4)} /></div>
        <div className="mt-12 md:mt-16 md:w-1/4"><Numbered items={[FOCUS[4]]} start={5} /></div>
      </Wrap>
    </section>

    {/* How we work: a photo off the left edge, the methods beside it */}
    <section className="pb-24 md:pb-32">
      <div className="grid grid-cols-1 md:grid-cols-[42%_1fr] items-center gap-12 md:gap-20">
        <div className="h-[420px] md:h-[660px] pr-5 md:pr-0"><Photo src="/milestones/first-date.webp" alt="Two people on a first date" bleed="left" /></div>
        <div className="px-5 md:pl-0 md:pr-20"><Reveal>
          <Eyebrow>Research methods</Eyebrow><Big>The lab</Big>
          <Body className="mt-6 text-[15px] text-[#1a1a1a]/75 max-w-[520px]">We bring relationship science together with what couples tell us and careful product experiments.</Body>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-6">
            {METHODS.map(m => <div key={m.label}><Emoji e={m.e} size={40} /><p className="mt-3 text-[14px] leading-snug">{m.label}</p></div>)}
          </div>
        </Reveal></div>
      </div>
    </section>

    {/* The studies */}
    <section className="pb-24 md:pb-32">
      <Wrap>
        <Reveal><h2 className="font-serif text-[2.5rem] md:text-[3.25rem] tracking-[-0.02em] font-bold">The science<sup className="ml-1 text-[14px] font-sans font-normal" style={{ color: BLUE }}>({PAPERS.length})</sup></h2></Reveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-14">
          {PAPERS.map((x, i) => (
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

    <ShareBar text="Belluh Research: the science of helping love last." />
    <Dark>
      <Wrap><Reveal><Eyebrow dark>About Belluh</Eyebrow><Big>Learn more about how Belluh does things.</Big><div className="mt-8"><Pill light onClick={() => go('/mission')}>Get to know Belluh</Pill></div></Reveal></Wrap>
    </Dark>
  </Shell>
);

export default Research;
