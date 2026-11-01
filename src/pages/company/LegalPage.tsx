// Belluh's legal pages, laid out the way hinge.co lays out theirs: a big serif title over one narrow reading column,
// set a little left of center on wide screens, with plain section headings, bold sub-questions, italic notes,
// underlined links, a numbered contents list on the long policies and simple tables on hairlines.
// Privacy Policy and Terms render the binding English texts (parsed like the legal modal does); the Cookie Policy,
// Consumer Health Data Privacy Policy and Security page are written in full in every language (legalPages.ts).
import React, { useEffect, useMemo } from 'react';
import { Shell, BLUE, INK, go, type PageProps } from './kit';
import { useI18n, useUi } from '../../i18n';
import ui, { type Item, type Policy } from '../../i18n/ui/legalPages';
import { parse, type Block } from '../../components/LegalModal';
import { TOS_TEXT } from '../../data/Terms';
import { PRIVACY_POLICY_TEXT } from '../../data/PrivacyPolicy';
import { supabaseUrl } from '../../lib/supabaseClient';

export type LegalDoc = 'privacy' | 'terms' | 'cookies' | 'consumer-health-data' | 'security';

const PRIVACY_MAIL = 'privacy@belluh.com', SECURITY_MAIL = 'elizabeth@belluh.com';
const UPDATED = new Date(2026, 10, 1);
const PINK = '#f0addd', SKY = '#9bbecb';

// What Belluh keeps in the browser, by cookie table row (Strictly necessary, Preferences, Measurement, Advertising).
// Names are code, so they aren't translated. Keep in step with `grep -rn localStorage src`.
const AUTH_KEY = (() => { try { return `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`; } catch { return 'sb-auth-token'; } })();
const STORED: string[][] = [
  [AUTH_KEY, 'pending_invite_id', 'belluh_pending_ask'],
  ['belluh_lang', 'belluh_tz', 'belluh_sidebar', 'belluh_space', 'belluh_settings', 'belluh_places', 'belluh_shape', 'belluh_dismissed', 'belluh_denied', 'belluh_seen_at', 'belluh_onboarded', 'belluh_mark_ripple'],
  ['belluh_cta', '_ga', '_ga_<id>', 'mp_<token>_mixpanel'],
  [],
];

const P = 'text-[16px] leading-[1.65] text-[#1a1a1a]/85';
const H2 = 'mt-14 text-[20px] leading-[1.35] font-medium tracking-[-0.005em]';
const LINK = 'underline underline-offset-[3px] decoration-1 hover:opacity-70 transition-opacity';

/** One reading column, about 640px, starting near x=400 on a 1440px screen; centered on phones and tablets. */
const Column: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-[1440px] mx-auto px-5 md:px-10">
    <div className="max-w-[640px] mx-auto lg:mx-0 lg:ml-[26%] xl:ml-[360px]">{children}</div>
  </div>
);

/** Text with {tokens} swapped for links, in the reader's word order. */
const Rich: React.FC<{ text: string; tokens: Record<string, React.ReactNode> }> = ({ text, tokens }) => (
  <>{text.split(/(\{\w+\})/).map((bit, i) => {
    const k = /^\{(\w+)\}$/.exec(bit)?.[1];
    return <React.Fragment key={i}>{k && k in tokens ? tokens[k] : bit}</React.Fragment>;
  })}</>
);

/** Email addresses in the English legal texts become links. */
const Linkify: React.FC<{ text: string }> = ({ text }) => (
  <>{text.split(/([a-z0-9._-]+@belluh\.com)/i).map((bit, i) => i % 2
    ? <a key={i} href={`mailto:${bit}`} className={LINK} style={{ color: BLUE }}>{bit}</a>
    : <React.Fragment key={i}>{bit}</React.Fragment>)}</>
);

const Table: React.FC<{ head: string[]; rows: React.ReactNode[][] }> = ({ head, rows }) => (
  <div className="mt-6 -mx-5 px-5 md:mx-0 md:px-0 overflow-x-auto">
    <table className="w-full min-w-[480px] md:min-w-0 text-left border-collapse">
      <thead>
        <tr className="border-b border-[#1a1a1a]/25">{head.map(h => <th key={h} scope="col" className="py-3 pr-6 last:pr-0 align-bottom text-[14px] leading-[1.4] font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-[#1a1a1a]/10 align-top">
            {r.map((c, j) => <td key={j} className={`py-4 pr-6 last:pr-0 text-[15px] leading-[1.6] ${j === 0 ? 'font-medium w-[32%]' : 'text-[#1a1a1a]/85'}`}>{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Original drawings: an open journal with a padlock in front, and two round badges
const star = (x: number, y: number, r: number) => `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
const JournalArt: React.FC<{ label: string }> = ({ label }) => (
  <svg viewBox="0 0 640 360" role="img" aria-label={label} className="block w-full h-auto">
    <ellipse cx="320" cy="312" rx="214" ry="12" fill="#cfe2e8" />
    <path d="M138 118Q229 96 320 122Q411 96 502 118L502 298Q411 278 320 304Q229 278 138 298Z" fill={SKY} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <path d="M150 106Q237 84 320 110L320 288Q237 266 150 284Z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <path d="M490 106Q403 84 320 110L320 288Q403 266 490 284Z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    {[0, 1, 2, 3].map(k => <path key={k} d={`M174 ${140 + k * 26}Q238 ${126 + k * 26} 298 ${144 + k * 26}`} stroke={INK} strokeOpacity=".22" strokeWidth="3" strokeLinecap="round" fill="none" />)}
    {[0, 1, 2].map(k => <path key={k} d={`M342 ${144 + k * 26}Q402 ${126 + k * 26} 466 ${140 + k * 26}`} stroke={INK} strokeOpacity=".22" strokeWidth="3" strokeLinecap="round" fill="none" />)}
    <path d="M206 262c-13-9-21-16-21-25a10.5 10.5 0 0 1 21-3a10.5 10.5 0 0 1 21 3c0 9-8 16-21 25z" fill={PINK} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M398 206V180a32 32 0 0 1 64 0V206" fill="none" stroke={INK} strokeWidth="10" strokeLinecap="round" />
    <rect x="378" y="198" width="104" height="90" rx="18" fill={PINK} stroke={INK} strokeWidth="3" />
    <circle cx="430" cy="236" r="10" fill={INK} />
    <rect x="425.5" y="240" width="9" height="24" rx="4.5" fill={INK} />
    <path d={star(530, 92, 14)} fill={BLUE} />
    <path d={star(104, 176, 10)} fill={BLUE} />
    <path d={star(552, 214, 8)} fill={PINK} />
  </svg>
);
const Badge: React.FC<{ cx: number; label: string; color: string }> = ({ cx, label, color }) => (
  <g>
    <path d={`M${cx - 30} 176L${cx - 48} 254L${cx - 24} 240L${cx - 10} 262L${cx + 2} 186Z`} fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <path d={`M${cx + 30} 176L${cx + 48} 254L${cx + 24} 240L${cx + 10} 262L${cx - 2} 186Z`} fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <circle cx={cx} cy="130" r="82" fill="#fff" stroke={INK} strokeWidth="3" />
    <circle cx={cx} cy="130" r="68" fill="none" stroke={color} strokeWidth="3" />
    <path d={star(cx, 94, 9)} fill={color} />
    <text x={cx} y="132" textAnchor="middle" dominantBaseline="central" fontFamily="'DM Sans', system-ui, sans-serif" fontWeight="600" fontSize="34" letterSpacing="1.5" fill={INK}>{label}</text>
    <path d={`M${cx - 12} 164l8 8l16 -16`} fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
const BadgesArt: React.FC<{ label: string }> = ({ label }) => (
  <svg viewBox="0 0 640 290" role="img" aria-label={label} className="block w-full h-auto">
    <Badge cx={220} label="GDPR" color={SKY} />
    <Badge cx={420} label="CCPA" color={PINK} />
    <path d={star(96, 70, 11)} fill={BLUE} />
    <path d={star(548, 226, 9)} fill={BLUE} />
  </svg>
);

const LegalPage: React.FC<PageProps & { doc: LegalDoc }> = ({ doc, ...p }) => {
  const U = useUi(ui);
  const { f, date, lang } = useI18n();
  const long = (d: Date) => date(d, { year: 'numeric', month: 'long', day: 'numeric' });
  const updated = f(U.updated, { date: long(UPDATED) });

  // Open at the section in the address (#s-7), otherwise at the top
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) { window.scrollTo({ top: 0 }); return; }
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 60);
    return () => clearTimeout(t);
  }, [doc]);

  const mail = (to: string, subject: string) => <a href={`mailto:${to}?subject=${encodeURIComponent(subject)}`} className={LINK} style={{ color: BLUE }}>{to}</a>;
  const page = (path: string, label: string) => <a href={path} onClick={e => { e.preventDefault(); go(path); }} className={LINK} style={{ color: BLUE }}>{label}</a>;
  const tokens = (subject: string, to = PRIVACY_MAIL): Record<string, React.ReactNode> => ({
    center: <button type="button" onClick={() => window.dispatchEvent(new Event('belluh:privacy-center'))} className={LINK} style={{ color: BLUE }}>{U.links.center}</button>,
    privacy: page('/privacy', U.links.privacy),
    terms: page('/terms', U.links.terms),
    choices: page('/privacy-choices', U.links.choices),
    email: mail(to, subject),
  });

  const item = (it: Item, k: number, tk: Record<string, React.ReactNode>, stored?: string[][]) => {
    if (typeof it === 'string') return <p key={k} className={`mt-4 ${P}`}><Rich text={it} tokens={tk} /></p>;
    if ('q' in it) return <p key={k} className="mt-8 text-[16px] leading-[1.5] font-semibold">{it.q}</p>;
    if ('note' in it) return <p key={k} className={`mt-4 italic ${P}`}><Rich text={it.note} tokens={tk} /></p>;
    if ('list' in it) return (
      <ul key={k} className="mt-4 space-y-3">
        {it.list.map((x, i) => <li key={i} className={`pl-5 border-l border-[#1a1a1a]/15 ${P}`}><Rich text={x} tokens={tk} /></li>)}
      </ul>
    );
    return <Table key={k} head={it.table.head} rows={it.table.rows.map((r, i) => [r[0], (
      <>{r[1]}{stored && <span className="mt-2 block text-[13px] leading-[1.55] text-[#1a1a1a]/60">{U.storedAs}: {stored[i]?.length ? stored[i].map((n, j) => <React.Fragment key={n}>{j > 0 && ', '}<code className="font-mono text-[12.5px] [overflow-wrap:anywhere]">{n}</code></React.Fragment>) : U.none}</span>}</>
    )])} />;
  };

  const heading = (children: React.ReactNode, line: string) => (
    <>
      <h1 className="font-serif font-semibold text-[2.125rem] leading-[1.1] sm:text-[2.75rem] sm:leading-[1.06] md:text-[3.5rem] [word-break:auto-phrase] [overflow-wrap:anywhere] md:leading-[1.04] tracking-[-0.02em] [text-wrap:balance]">{children}</h1>
      <p className="mt-5 text-[14px] text-[#1a1a1a]/60">{line}</p>
    </>
  );

  // Privacy Policy and Terms: the binding English text, numbered sections and a contents list
  const legal = useMemo(() => doc === 'privacy' || doc === 'terms' ? parse(doc === 'privacy' ? PRIVACY_POLICY_TEXT : TOS_TEXT) : null, [doc]);
  const block = (b: Block, k: number) => {
    if (b.kind === 'sub') return <h3 key={k} className="mt-9 text-[16px] leading-[1.45] font-semibold">{b.num} {b.title}</h3>;
    if (b.kind === 'table') return <Table key={k} head={[U.ccpa.category, U.ccpa.collected, U.ccpa.sold]} rows={b.rows.map(row => {
      const [cat, data = ''] = row.split(': ');
      return [cat, /Collected \((.*?)\)/.exec(data)?.[1] ?? '', /Sold\/Shared \((.*?)\)/.exec(data)?.[1] ?? ''];
    })} />;
    if (b.kind === 'item') return <p key={k} className={`mt-2.5 pl-5 border-l border-[#1a1a1a]/15 ${P}`}><Linkify text={b.text} /></p>;
    // "Account Information:" and "How to Opt Out:" read as the bold questions they are
    if (/:$/.test(b.text) && b.text.length < 80) return <p key={k} className="mt-7 text-[16px] leading-[1.5] font-semibold">{b.text}</p>;
    return <p key={k} className={`mt-4 ${P}`}><Linkify text={b.text} /></p>;
  };
  const jump = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    try { window.history.replaceState(window.history.state, '', `#${id}`); } catch { /* the scroll is enough */ }
  };

  const titleOf: Record<LegalDoc, string> = { privacy: U.titles.privacy, terms: U.titles.terms, cookies: U.cookies.title, 'consumer-health-data': U.health.title, security: U.security.title };
  const title = titleOf[doc];

  let body: React.ReactNode;
  if (legal) {
    const eff = legal.effective ? (() => { const d = new Date(legal.effective!); return Number.isNaN(d.getTime()) ? legal.effective! : long(d); })() : null;
    body = (
      <>
        {heading(title, eff ? f(U.effective, { date: eff }) : updated)}
        {lang !== 'en' && <p className={`mt-6 italic ${P}`}>{U.bindingNote}</p>}
        {legal.intro.map(block)}
        <nav aria-labelledby="legal-contents" className="mt-12">
          <h2 id="legal-contents" className="text-[20px] leading-[1.35] font-medium">{U.contents}</h2>
          <ol className="mt-5 space-y-2.5">
            {legal.sections.map(s => (
              <li key={s.id} className="flex items-baseline gap-2 text-[16px] leading-[1.5]">
                <span className="w-7 shrink-0 tabular-nums text-[#1a1a1a]/55">{s.num}.</span>
                <a href={`#${s.id}`} onClick={e => jump(e, s.id)} className={LINK} style={{ color: BLUE }}>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>
        {legal.sections.map(s => (
          <section key={s.id} id={s.id} className="scroll-mt-28">
            <h2 className={H2}>{s.num}. {s.title}</h2>
            {s.blocks.map(block)}
          </section>
        ))}
      </>
    );
  } else if (doc === 'security') {
    const S = U.security, tk = tokens(U.subjects.security, SECURITY_MAIL);
    body = (
      <>
        {heading(title, updated)}
        <p className="mt-6 text-[19px] leading-[1.55] text-[#1a1a1a]/80">{S.lede}</p>
        <figure className="mt-12 rounded-[28px] overflow-hidden" style={{ background: '#e7f0f3' }}><JournalArt label={S.art} /></figure>
        <p className={`mt-12 ${P}`}>{S.intro}</p>
        <div className="mt-2">
          {S.practices.map(x => (
            <div key={x.h} className="mt-7">
              <h3 className="text-[16px] leading-[1.45] font-semibold">{x.h}</h3>
              <p className={`mt-1.5 ${P}`}>{x.p}</p>
            </div>
          ))}
        </div>
        <h2 className={H2}>{S.complianceH}</h2>
        <figure className="mt-6 rounded-[28px] overflow-hidden px-6 md:px-12 py-8" style={{ background: '#fcf0f7' }}><BadgesArt label={S.badgesArt} /></figure>
        {S.compliance.map((x, i) => <p key={i} className={`mt-6 ${P}`}><Rich text={x} tokens={tk} /></p>)}
        <p className={`mt-4 italic ${P}`}>{S.note}</p>
        <h2 className={H2}>{S.contactH}</h2>
        <p className={`mt-4 ${P}`}><Rich text={S.contact} tokens={tk} /></p>
      </>
    );
  } else {
    const isCookies = doc === 'cookies';
    const D: Policy = isCookies ? U.cookies : U.health;
    const tk = tokens(isCookies ? U.subjects.cookies : U.subjects.health);
    body = (
      <>
        {heading(title, updated)}
        <div className="mt-4">{D.intro.map((x, i) => item(x, i, tk))}</div>
        {D.sections.map((s, i) => (
          <section key={i}>
            <h2 className={H2}>{s.h}</h2>
            {s.items.map((x, k) => item(x, k, tk, isCookies && typeof x === 'object' && 'table' in x ? STORED : undefined))}
          </section>
        ))}
      </>
    );
  }

  return (
    <Shell {...p} title={title}>
      <article className="pt-14 md:pt-24 pb-24 md:pb-36">
        <Column>{body}</Column>
      </article>
    </Shell>
  );
};

export default LegalPage;
