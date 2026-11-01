// belluh.com/careers, with the strengths of hinge.co/careers: a strip of photos and one line of purpose up top, how
// we work on a dark band, the numbers that are true, who has built with us, what you get (opened one at a time), how
// hiring goes step by step, the open roles by team with a filter, and a last question. Every figure here is one we
// already publish: grants up to $50K, a $200K full-time path, drift spotted 3 weeks early.
import React, { useEffect, useState } from 'react';
import { Emoji } from '../lib/emoji3d';
import { Shell, Wrap, Eyebrow, Big, Body, Reveal, Numbered, Dark, Pill, ShareBar, BLUE, type PageProps } from './company/kit';

interface CareersProps extends PageProps { onBack?: () => void; onGoToAbout?: () => void }

const APPLY = 'elizabeth@belluh.com';
const PRINCIPLES = [
  { title: 'Spikes over résumés', body: 'We prioritize life experience over work experience. Skills can be taught, but perspectives are difficult to shape.' },
  { title: 'Reject consensus', body: 'Chase non-obvious secrets, be creative, and hold a unique lens on the world.' },
  { title: 'Epic missions', body: 'Real problems, real couples, and the room to go solve them, wherever that takes you.' },
  { title: 'No bureaucracy', body: 'Nobody wins an argument with “because I’m senior.” The best idea wins, whoever has it.' },
];
const SPIKES = ['Top 30 Valorant NA', 'U.S. Boxing Top 3', 'Built a videogame at 12 with 350K+ players', 'Top 100 of 700K in a photography contest', 'Competitive athlete', 'IMO gold', 'Self-taught plumber', 'Ironman 70.3 finisher', 'Florist selling 50+ flower types', 'Philosophy blogger with 30K monthly readers', 'Former YC founders', 'A Thiel fellow', 'A Rhodes scholar', 'A Schwarzman scholar', 'Cycled across continental Europe', '500+ skydives'];
// What everyone at Belluh gets. Details vary by role and location.
const PERKS = [
  { title: 'Hybrid and remote work', body: 'Work where you do your best work, and get together when it matters.' },
  { title: 'Dating', body: 'We build for love, so we make room for yours. Date nights are on us.' },
  { title: 'Retirement', body: 'A retirement plan to help you save for later, starting now.' },
  { title: 'Meals', body: 'Lunch and snacks on us when we’re together.' },
  { title: 'Health insurance', body: 'Medical, dental and vision coverage for you and your family.' },
  { title: 'Community service', body: 'Paid time to give back to the causes you care about.' },
  { title: 'Paid time off', body: 'Time off to rest, travel and be with the people you love.' },
  { title: 'Commuting', body: 'Help with the cost of getting to and from work.' },
  { title: 'Parental leave and planning', body: 'Paid leave for new parents, and support for growing your family.' },
  { title: 'Pets', body: 'Support for the pets who are part of your family.' },
  { title: 'Wellness', body: 'Support for your body and your mind, from fitness to mental health.' },
  { title: 'Legal coverage', body: 'Help with life’s legal moments, from a lease to a will.' },
  { title: 'Professional growth', body: 'A budget to learn, and work that stretches you every week.' },
  { title: 'Fertility support', body: 'Support for every path to building a family.' },
];
// Only numbers that are true go here
const TEAM_NUMBERS = [
  { big: '0', sup: '', small: 'arguments settled by “because I’m senior.” The best idea wins, whoever has it.' },
  { big: '8', sup: '', small: 'languages Belluh already speaks to couples in, from Japanese to Portuguese.' },
  { big: '350K', sup: '+*', small: 'players on a game one of our collaborators built at 12. Spikes, not résumés.' },
];
const FELLOW_NUMBERS = [{ big: '$50K', small: 'in grants for each fellow, at most' }, { big: '$200K', small: 'salary on the full-time path for top performers' }, { big: '3 wks', small: 'how early Belluh spots a couple drifting apart' }];
const STEPS = [
  { e: '✉️', title: 'Tell us your spikes.', body: `Send an email to ${APPLY} with what makes you uniquely spiked. A few lines and a link or two is plenty.` },
  { e: '📞', title: 'A call to get to know each other.', body: 'A conversation about you, what you want to do, and why Belluh. Bring your questions, it should be a good fit for both of us.' },
  { e: '🚀', title: 'Your first mission.', body: 'Fellows start with a mission: real work, with a grant behind it, so we both see what it’s like to build together.' },
  { e: '🤝', title: 'The path to full-time.', body: 'For top performers, a direct path to a full-time role.' },
];
const ROLES = [{ team: 'Growth', about: 'Gets Belluh to every couple who would love it.', roles: [{ id: 'fellow', title: 'Belluh Fellow', where: 'Hybrid, full-time' }] }];

const Careers: React.FC<CareersProps> = (p) => {
  const [fellow, setFellow] = useState(window.location.pathname === '/careers/fellows');
  const [perk, setPerk] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [team, setTeam] = useState('all');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const on = () => setFellow(window.location.pathname === '/careers/fellows');
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);
  const open = (v: boolean) => { window.history.pushState({}, '', v ? '/careers/fellows' : '/careers'); setFellow(v); window.scrollTo({ top: 0 }); };
  const copy = async () => { try { await navigator.clipboard.writeText(APPLY); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* the address is on screen */ } };

  if (fellow) return (
    <Shell {...p} current="careers" title="Belluh Fellow">
      <section className="pt-16 md:pt-24 pb-28">
        <Wrap className="max-w-[920px]">
          <button onClick={() => open(false)} className="mb-12 text-[15px] hover:opacity-60">← All roles</button>
          <Eyebrow>Growth, Marketing, Suggestion Maker</Eyebrow>
          <Big as="h1" className="font-bold">Belluh Fellow</Big>
          <div className="mt-6 flex flex-wrap gap-2">{['Hybrid', 'Full-time', 'Grants up to $50K'].map(x => <span key={x} className="h-8 px-3.5 inline-flex items-center rounded-full border border-[#1a1a1a]/15 text-[13px]">{x}</span>)}</div>
          <p className="mt-12 font-serif text-[1.6rem] md:text-[2rem] leading-snug tracking-tight">We’re building Belluh. AI that spots relationship drift 3 weeks early. We work with fun people who excel anywhere.</p>
          <div className="mt-8 space-y-5 text-[17px] leading-[1.7] text-[#1a1a1a]/80">
            <p>They reject consensus, chase non-obvious secrets, are creative, and hold a unique lens on the world. We prioritize life experience over work experience. Skills can be taught, but perspectives are difficult to shape. We want to see spikes regardless of what you do.</p>
            <p className="font-semibold text-[#1a1a1a]">No hard criteria. If you have spikes, you’ll know.</p>
            <p>We provide grants for fellows up to $50K, sending you on epic missions nationwide. For top performers, there is a direct path to a full-time role with a $200K salary.</p>
          </div>
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {FELLOW_NUMBERS.map(x => <div key={x.big}><p className="font-serif text-[3.25rem] leading-none tracking-[-0.03em] whitespace-nowrap">{x.big}</p><p className="mt-3 text-[15px] leading-snug text-[#1a1a1a]/75">{x.small}</p></div>)}
          </div>
          <p className="mt-14 mb-4 text-[15px]" style={{ color: BLUE }}>Previously successful collaborators</p>
          <div className="flex flex-wrap gap-2">{SPIKES.map(x => <span key={x} className="px-3.5 py-2 rounded-full bg-white border border-[#1a1a1a]/10 text-[14px]">{x}</span>)}</div>
          <div className="mt-16 rounded-xl p-8 md:p-10 text-white" style={{ background: '#1a1a1a' }}>
            <p className="font-serif text-[1.75rem] md:text-[2.2rem] tracking-tight">Insanely different? We want to meet you.</p>
            <p className="mt-3 text-white/75">Send us an email with what makes you uniquely spiked.</p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Pill light href={`mailto:${APPLY}?subject=Belluh%20Fellow`}>Email {APPLY}</Pill>
              <button onClick={copy} className="h-11 px-5 rounded-full border border-white/30 text-[15px] font-semibold">{copied ? 'Copied' : 'Copy address'}</button>
            </div>
          </div>
        </Wrap>
      </section>
    </Shell>
  );

  const shown = ROLES.filter(r => team === 'all' || r.team === team);
  const photos = ['just-married', 'first-date', '78th-trip', 'first-kiss', '30th-anniversary', 'first-baby'];
  return (
    <Shell {...p} current="careers" title="Careers" hiring={{ eyebrow: 'About us', line: 'Sound like you?', cta: 'Get to know us', to: '/mission' }}>
      {/* A drifting strip of photos, then the line */}
      <section className="pt-8 md:pt-10 overflow-hidden">
        <div className="flex w-max gap-4 md:gap-5 careers-strip" aria-hidden>
          {[...photos, ...photos].map((ph, i) => (
            <img key={i} src={`/milestones/${ph}.webp`} alt="" loading={i < 6 ? 'eager' : 'lazy'} className="h-[150px] md:h-[220px] aspect-[4/3] object-cover rounded-md" style={{ marginTop: i % 3 === 1 ? 14 : 0 }} />
          ))}
        </div>
        <style>{`@keyframes careers-strip { to { transform: translateX(-50%); } } .careers-strip { animation: careers-strip 70s linear infinite; } @media (prefers-reduced-motion: reduce) { .careers-strip { animation: none; } }`}</style>
        <Wrap className="py-16 md:py-24"><Reveal>
          <Big as="h1" className="font-bold max-w-[14ch]">Help more love last.</Big>
          <Body className="mt-6 max-w-[520px] text-[#1a1a1a]/75">Join a small, passionate team helping couples connect deeper through thoughtful AI.</Body>
          <div className="mt-8"><Pill onClick={() => document.getElementById('openings')?.scrollIntoView({ behavior: 'smooth' })}>Find openings</Pill></div>
        </Reveal></Wrap>
      </section>

      {/* How we work */}
      <Dark>
        <Wrap>
          <Reveal className="max-w-[560px]"><Eyebrow dark>How we work</Eyebrow><Big>Spikes inspire everything.</Big>
            <Body className="mt-6 text-[15px] text-white/80">The best teams are made of people who are extraordinary at something, anything. Here’s what that means day to day.</Body></Reveal>
          <div className="mt-16 md:mt-20"><Numbered items={PRINCIPLES} dark /></div>
        </Wrap>
      </Dark>

      {/* By the numbers, laid out like hinge.co: a heading on the left, big figures on the right */}
      <section className="py-20 md:py-28">
        <Wrap className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16 items-start">
          <Reveal><Eyebrow>How we compare</Eyebrow><Big className="!text-[2.25rem] md:!text-[2.75rem]">Belluh by the numbers</Big></Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-10 gap-y-12">
            {TEAM_NUMBERS.map((x, i) => (
              <Reveal key={x.small} delay={i * 90}>
                <p className="font-serif text-[4.5rem] md:text-[clamp(3.5rem,5.6vw,5.5rem)] leading-none tracking-[-0.03em] whitespace-nowrap">{x.big}{x.sup && <sup className="ml-1 align-top text-[1rem] font-sans font-semibold" style={{ color: BLUE }}>{x.sup}</sup>}</p>
                <p className="mt-4 text-[15px] leading-snug text-[#1a1a1a]/75 max-w-[240px]">{x.small}</p>
              </Reveal>
            ))}
          </div>
          <p className="lg:col-start-2 -mt-4 text-[12px] leading-snug text-[#1a1a1a]/55 max-w-[260px]">* From our previously successful collaborators, below.</p>
        </Wrap>
      </section>

      {/* Who has built with us */}
      <section className="pb-20 md:pb-28 overflow-hidden">
        <Wrap><p className="mb-8 text-[15px]" style={{ color: BLUE }}>Previously successful collaborators</p></Wrap>
        <div className="space-y-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          {[SPIKES.slice(0, 8), SPIKES.slice(8)].map((row, r) => (
            <div key={r} className="flex w-max gap-3" style={{ animation: `careers-marquee ${r ? 46 : 38}s linear infinite ${r ? 'reverse' : ''}` }}>
              {[...row, ...row, ...row].map((x, i) => <span key={i} className="shrink-0 px-5 py-3 rounded-full bg-white border border-[#1a1a1a]/10 font-serif text-lg whitespace-nowrap">{x}</span>)}
            </div>
          ))}
        </div>
        <style>{`@keyframes careers-marquee { from { transform: translateX(0); } to { transform: translateX(-33.333%); } } @media (prefers-reduced-motion: reduce) { [style*="careers-marquee"] { animation: none !important; } }`}</style>
      </section>

      {/* What you get, opened one at a time */}
      <Dark>
        <Wrap>
          <Reveal><Eyebrow dark>Perks and benefits</Eyebrow><Big>Do the best work of your life.</Big><p className="mt-4 text-[14px] text-white/60">Benefits vary by role and location.</p></Reveal>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-x-8">
            {PERKS.map((x, i) => (
              <div key={x.title} className="border-t border-white/20">
                <button onClick={() => setPerk(perk === i ? null : i)} aria-expanded={perk === i} className="w-full h-16 flex items-center justify-between text-left text-[17px] font-semibold">
                  {x.title}<span className={`text-2xl font-light transition-transform duration-300 ${perk === i ? 'rotate-45' : ''}`} aria-hidden>+</span>
                </button>
                <div className={`grid transition-all duration-300 ${perk === i ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0'}`}><p className="overflow-hidden text-[15px] leading-[1.6] text-white/75">{x.body}</p></div>
              </div>
            ))}
          </div>
        </Wrap>
      </Dark>

      {/* How hiring goes */}
      <section className="py-24 md:py-32">
        <Wrap className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
          <Reveal><Eyebrow>Hiring process</Eyebrow><Big>No hoops. Here’s exactly how it goes.</Big></Reveal>
          <ol className="space-y-2">
            {STEPS.map((x, i) => (
              <li key={x.title}>
                <button onClick={() => setStep(i)} aria-expanded={step === i} className={`w-full text-left py-4 transition-opacity ${step === i ? '' : 'opacity-45 hover:opacity-75'}`}>
                  <span className="block" aria-hidden><Emoji e={x.e} size={30} /></span>
                  <span className="mt-3 block text-[20px] font-semibold">{x.title}</span>
                  {step === i && <span className="mt-3 block text-[15px] leading-[1.6] text-[#1a1a1a]/75">{x.body}</span>}
                </button>
              </li>
            ))}
          </ol>
        </Wrap>
      </section>

      {/* Openings */}
      <section id="openings" className="pb-24 md:pb-32 scroll-mt-24">
        <Wrap>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal><Eyebrow>Openings</Eyebrow><Big>We’re hiring.</Big></Reveal>
            <label className="flex items-center gap-3 text-[13px] text-[#1a1a1a]/60">Filter by:
              <select value={team} onChange={e => setTeam(e.target.value)} className="h-10 rounded-full border border-[#1a1a1a]/30 bg-transparent px-4 text-[14px] text-[#1a1a1a]">
                <option value="all">All teams</option>{ROLES.map(r => <option key={r.team} value={r.team}>{r.team}</option>)}
              </select>
            </label>
          </div>
          {shown.map(r => (
            <div key={r.team} className="mt-16 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8">
              <div><h3 className="font-serif text-[2rem] tracking-tight">{r.team}<sup className="ml-1 text-[12px] font-sans" style={{ color: BLUE }}>({String(r.roles.length).padStart(2, '0')})</sup></h3><p className="mt-3 text-[15px] text-[#1a1a1a]/75 max-w-[260px]">{r.about}</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {r.roles.map(x => (
                  <button key={x.id} onClick={() => open(true)} className="group text-left border-t border-[#1a1a1a]/15 pt-4 pb-8 flex items-start justify-between gap-4">
                    <span><span className="block text-[17px] group-hover:underline underline-offset-4">{x.title}</span><span className="block mt-1 text-[13px]" style={{ color: BLUE }}>{x.where}</span></span>
                    <span className="text-xl transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden>↗</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="mt-10 text-[15px] text-[#1a1a1a]/75">Don’t see your role? Write to <a href={`mailto:${APPLY}`} className="font-semibold text-[#1a1a1a] underline underline-offset-4">{APPLY}</a> anyway.</p>
        </Wrap>
      </section>

      <ShareBar text="Help more love last. Belluh is hiring." />
    </Shell>
  );
};

export default Careers;
