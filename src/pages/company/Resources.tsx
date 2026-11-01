// The pages behind the footer, one for each resource and policy a company like Belluh owes the people who use it:
// newsroom, your stories, contact, safety, how Belluh works, the not-so-frequent questions, your privacy choices,
// accessibility. Security, cookies and consumer health data have their own legal pages (LegalPage.tsx). All in Belluh's own words,
// and only what is true of Belluh today. Policies point to the Privacy Policy and Terms, which govern.
import React from 'react';
import { useI18n, useUi } from '../../i18n';
import pagesUi, { type Slug, type PartT } from '../../i18n/ui/resourcePages';
import { Shell, Wrap, Eyebrow, Big, Body, Reveal, Pill, go, BLUE, type PageProps } from './kit';

// The structure stays here: where each link goes, which address it writes to, which file it downloads. The words are
// in src/i18n/ui/resourcePages.ts. A link with `addr` shows its email address as its label; every other link takes the
// next label from its part's `links`, in order.
const HELLO = 'elizabeth@belluh.com', PRIVACY = 'privacy@belluh.com';
type Subject = keyof typeof pagesUi.en.subjects;
type Target = { to?: string; href?: string; mail?: string; subject?: Subject; addr?: boolean };
type Shape = { links?: Record<number, Target[]>; cta?: Target; updated?: boolean; dates?: Date[] };
const mail = (to: string, subject: string) => `mailto:${to}?subject=${encodeURIComponent(subject)}`;
const UPDATED = new Date(2026, 10, 1);
const NOV = new Date(2026, 10, 1), OCT = new Date(2026, 9, 1);

const SHAPE: Record<Slug, Shape> = {
  newsroom: { dates: [NOV, NOV, OCT, OCT], links: { 1: [{ to: '/research' }] }, cta: { to: '/press' } },
  stories: { cta: { mail: HELLO, subject: 'story' } },
  contact: { links: { 0: [{ mail: HELLO, subject: 'help', addr: true }], 1: [{ mail: PRIVACY, subject: 'privacy', addr: true }], 2: [{ to: '/press' }, { to: '/impact' }, { to: '/careers' }] } },
  'safety-tips': {},
  'how-belluh-works': { links: { 3: [{ to: '/research' }] } },
  nfaq: {},
  'privacy-choices': { updated: true, links: { 1: [{ mail: PRIVACY, subject: 'data' }], 2: [{ mail: PRIVACY, subject: 'optOut' }] } },
  accessibility: { updated: true, links: { 2: [{ mail: HELLO, subject: 'accessibility' }] } },
};
export const SLUGS = Object.keys(SHAPE) as Slug[];

type Link = { label: string; href?: string; to?: string };
const LinkRow: React.FC<{ l: Link }> = ({ l }) => l.to
  ? <button onClick={() => go(l.to!)} className="text-[16px] font-semibold underline underline-offset-4 hover:opacity-60">{l.label}</button>
  : <a href={l.href} className="text-[16px] font-semibold underline underline-offset-4 hover:opacity-60">{l.label}</a>;

const ResourcePage: React.FC<PageProps & { slug: string }> = ({ slug, ...p }) => {
  const { d, f, date, tag } = useI18n();
  // "novembre 2026" opens a heading in French, Italian, Spanish and Portuguese, so it takes a capital there
  const month = (x: Date, first: boolean) => { const m = date(x, { month: 'long', year: 'numeric' }); return first ? m.charAt(0).toLocaleUpperCase(tag) + m.slice(1) : m; };
  const P = useUi(pagesUi);
  const key: Slug = slug in SHAPE ? slug as Slug : 'contact';
  const doc = P.docs[key], shape = SHAPE[key];
  const href = (x: Target) => x.mail ? mail(x.mail, x.subject ? P.subjects[x.subject] : '') : x.href;
  const linksOf = (x: PartT, i: number): Link[] => {
    let n = 0;
    return (shape.links?.[i] ?? []).map(tg => ({ label: tg.addr && tg.mail ? tg.mail : x.links?.[n++] ?? '', to: tg.to, href: href(tg) }));
  };
  const parts = doc.parts.map((x, i) => ({ ...x, h: x.h && shape.dates?.[i] ? f(x.h, { date: month(shape.dates[i], x.h.startsWith('{date}')) }) : x.h, links: linksOf(x, i) }));
  const cta = doc.cta && shape.cta ? { label: doc.cta, to: shape.cta.to, href: href(shape.cta) } : null;
  // "The {privacy} and {terms} govern", with each name a button, in the reader's word order
  const closing = P.closing.split(/(\{privacy\}|\{terms\})/).map((bit, i) =>
    bit === '{privacy}' ? <button key={i} onClick={() => p.onShowLegal('privacy')} className="underline underline-offset-2">{d.footer.privacyPolicy}</button>
    : bit === '{terms}' ? <button key={i} onClick={() => p.onShowLegal('tos')} className="underline underline-offset-2">{d.footer.terms}</button>
    : <React.Fragment key={i}>{bit}</React.Fragment>);
  return (
    <Shell {...p} title={doc.eyebrow}>
      <section className="pt-16 md:pt-28 pb-24 md:pb-32">
        <Wrap className="max-w-[1040px]">
          <Reveal>
            <Eyebrow>{doc.eyebrow}</Eyebrow>
            <Big as="h1" className="font-bold max-w-[18ch]">{doc.title}</Big>
            <Body className="mt-6 text-[19px] text-[#1a1a1a]/75 max-w-[640px]">{doc.lede}</Body>
            {shape.updated && <p className="mt-4 text-[13px]" style={{ color: BLUE }}>{f(P.updated, { date: date(UPDATED, { year: 'numeric', month: 'long', day: 'numeric' }) })}</p>}
          </Reveal>
          <div className="mt-16 md:mt-20 space-y-12 md:space-y-14">
            {parts.map((x, i) => (
              <Reveal key={i} delay={Math.min(i, 4) * 60}>
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-3 md:gap-12">
                  {x.h && <h2 className="font-serif text-[1.6rem] md:text-[1.75rem] leading-snug tracking-tight">{x.h}</h2>}
                  <div className="space-y-4 max-w-[620px]">
                    {x.p?.map((t, k) => <Body key={k} className="text-[#1a1a1a]/80">{t}</Body>)}
                    {'list' in x && x.list && <ul className="space-y-3">{x.list.map(t => <li key={t} className="text-[17px] leading-[1.6] text-[#1a1a1a]/80">{t}</li>)}</ul>}
                    {x.links.length > 0 && <div className="flex flex-wrap gap-x-6 gap-y-2">{x.links.map(l => <LinkRow key={l.label} l={l} />)}</div>}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          {cta && <div className="mt-16">{cta.to ? <Pill onClick={() => go(cta.to!)}>{cta.label}</Pill> : <Pill href={cta.href}>{cta.label}</Pill>}</div>}
          {shape.updated && <p className="mt-16 text-[14px] text-[#1a1a1a]/60">{closing}</p>}
        </Wrap>
      </section>
    </Shell>
  );
};

export default ResourcePage;
