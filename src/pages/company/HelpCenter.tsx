// belluh.com/faq as a help center, after help.hinge.co: "How can we help?" over a big search that filters as you type,
// topics as cards, a topic's articles, an article with a way back, promoted articles, and a way to reach us. The FAQ
// answers come from the main dictionaries; the other articles describe what the app does today, and the button and tab
// names inside them are filled from the app's own strings, so they always match what the reader sees.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, X } from 'lucide-react';
import { useI18n, useUi } from '../../i18n';
import table from '../../i18n/ui/helpCenter';
import profileUi from '../../i18n/ui/profile';
import studioUi from '../../i18n/ui/studio';
import guidesUi from '../../i18n/ui/guides';
import deviceUi from '../../i18n/ui/deviceSettings';
import mapUi from '../../i18n/ui/map';
import { Emoji } from '../../lib/emoji3d';
import { Shell, Wrap, Reveal, Pill, go, BLUE, type PageProps } from './kit';

type Own = Extract<keyof (typeof table)['en']['a'], string>;
type Ref = Own | `faq-${number}`;
type CatId = Extract<keyof (typeof table)['en']['cats'], string>;

// Which articles sit in which topic, in reading order. faq-N is the Nth answer of the main FAQ.
const CATS: { id: CatId; emoji: string; items: Ref[] }[] = [
  { id: 'start', emoji: '👋', items: ['faq-2', 'faq-1', 'firstEntry', 'tabs', 'language'] },
  { id: 'partner', emoji: '💞', items: ['invite', 'faq-3', 'usThread', 'circles', 'archive'] },
  { id: 'bella', emoji: '✨', items: ['faq-4', 'faq-5', 'asksFirst', 'reachOut', 'faq-6', 'textSetup', 'faq-7', 'forget'] },
  { id: 'plans', emoji: '📅', items: ['planTogether', 'yourDates', 'calendar', 'weekly', 'goals'] },
  { id: 'map', emoji: '🗺️', items: ['loveMap', 'makeGuide', 'shareGuide', 'community'] },
  { id: 'profile', emoji: '🎨', items: ['customize', 'blocks', 'littleThings', 'theme', 'notifications'] },
  { id: 'privacy', emoji: '🔒', items: ['faq-0', 'sharedOrPrivate', 'faq-8', 'guidesPrivacy', 'report'] },
  { id: 'account', emoji: '💳', items: ['faq-9', 'faq-10', 'logout'] },
];
const PROMOTED: Ref[] = ['faq-0', 'invite', 'planTogether', 'shareGuide', 'textSetup', 'faq-9'];
const TINT = '#EEF4F6';

type View = { kind: 'home' } | { kind: 'cat'; id: CatId } | { kind: 'article'; id: Ref };
const readHash = (): View => {
  let h = ''; try { h = decodeURIComponent(window.location.hash.slice(1)); } catch { /* bad hash */ }
  const [k, v] = h.split('=');
  if (k === 'c' && CATS.some(c => c.id === v)) return { kind: 'cat', id: v as CatId };
  if (k === 'a' && v && CATS.some(c => c.items.includes(v as Ref))) return { kind: 'article', id: v as Ref };
  return { kind: 'home' };
};
const fold = (s: string) => s.toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const Row: React.FC<{ title: string; onClick: () => void }> = ({ title, onClick }) => (
  <li>
    <button onClick={onClick} className="group -mx-4 px-4 py-4 rounded-xl flex items-center justify-between gap-4 text-left text-[17px] leading-[1.4] hover:bg-[#1a1a1a]/[0.04] transition-colors" style={{ width: 'calc(100% + 2rem)' }}>
      <span className="min-w-0">{title}</span>
      <ChevronRight size={18} className="shrink-0 opacity-35 group-hover:opacity-80 transition-opacity" aria-hidden />
    </button>
  </li>
);

const HelpCenter: React.FC<PageProps> = (p) => {
  const H = useUi(table);
  const P = useUi(profileUi), S = useUi(studioUi), G = useUi(guidesUi), D = useUi(deviceUi), M = useUi(mapUi);
  const { d, f, textApps } = useI18n();
  const [view, setView] = useState<View>(readHash);
  const [q, setQ] = useState('');
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => { setView(readHash()); setQ(''); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const open = (v: View) => {
    const hash = v.kind === 'home' ? '' : `#${v.kind === 'cat' ? 'c' : 'a'}=${v.id}`;
    if (window.location.hash !== hash) window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    setView(v); setQ('');
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  // The app's own names for its tabs and buttons, so an article says exactly what the reader will tap
  const names = useMemo(() => ({
    story: d.app.tabs.story, capture: d.app.tabs.capture, us: d.app.tabs.us, me: d.app.tabs.me, map: M.tab,
    invite: P.invitePartner, manage: P.manageCircle, appearance: P.appearance, account: P.account, logout: P.logOut,
    customize: S.customize, guides: G.guidesTab, newGuide: G.newGuide, community: G.community,
    visUs: G.vis.us, visLink: G.vis.link, visPublic: G.vis.public, calendarAdd: D.calendar.add,
    addDates: d.app.me.inviteButton, edit: d.common.edit, quiet: d.app.act.quiet, normal: d.app.act.normal, more: d.app.act.more,
    textBella: d.app.me.textBella, apps: textApps,
  }), [d, M, P, S, G, D, textApps]);

  const article = (id: Ref): { q: string; a: string } | null => {
    if (id.startsWith('faq-')) { const it = d.faq.items[Number(id.slice(4))]; return it ? { q: f(it.q, names), a: f(it.a, names) } : null; }
    const it = H.a[id as Own]; return it ? { q: f(it.q, names), a: f(it.a, names) } : null;
  };
  const catOf = (id: Ref) => CATS.find(c => c.items.includes(id)) ?? CATS[0];
  const catTitle = (id: CatId) => f(H.cats[id].title, names);
  const live = (items: Ref[]) => items.filter(id => article(id));
  const count = (n: number) => (n === 1 ? H.articleOne : f(H.articles, { n }));

  const query = q.trim();
  const results = useMemo(() => {
    if (!query) return [];
    const terms = fold(query).split(/\s+/).filter(Boolean);
    const seen = new Set<Ref>();
    return CATS.flatMap(c => c.items).filter(id => {
      if (seen.has(id)) return false; seen.add(id);
      const it = article(id); if (!it) return false;
      const hay = fold(`${it.q} ${it.a} ${catTitle(catOf(id).id)}`);
      return terms.every(t => hay.includes(t));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, H, d, names]);

  const Crumbs: React.FC<{ cat?: CatId }> = ({ cat }) => (
    <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-[#1a1a1a]/60" aria-label={H.home}>
      <button onClick={() => open({ kind: 'home' })} className="hover:text-[#1a1a1a] transition-colors">{H.home}</button>
      {cat && <><ChevronRight size={15} className="opacity-50" aria-hidden /><button onClick={() => open({ kind: 'cat', id: cat })} className="hover:text-[#1a1a1a] transition-colors">{catTitle(cat)}</button></>}
    </nav>
  );

  const docTitle = view.kind === 'article' ? (article(view.id)?.q ?? H.docTitle) : view.kind === 'cat' ? `${catTitle(view.id)} | ${H.docTitle}` : H.docTitle;

  return (
    <Shell {...p} title={docTitle}>
      {/* How can we help, over a search that filters as you type */}
      <section style={{ background: TINT }}>
        <Wrap className="py-16 md:py-24">
          <Reveal>
            <h1 className="font-serif font-semibold text-[2.75rem] leading-[1.04] md:text-[4.5rem] md:leading-[1] tracking-[-0.025em]">{H.heroTitle}</h1>
            <div className="relative mt-8 md:mt-10 max-w-[760px]">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none"><Emoji e="🔍" size={22} /></span>
              <input
                type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={H.searchPh} aria-label={H.searchLabel}
                className="w-full h-16 md:h-[72px] rounded-full bg-white pl-16 pr-14 text-[17px] md:text-[19px] border border-[#1a1a1a]/10 outline-none focus:border-[#1a1a1a]/40 transition-colors [&::-webkit-search-cancel-button]:hidden"
              />
              {q && (
                <button onClick={() => setQ('')} aria-label={H.clear} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-colors">
                  <X size={20} aria-hidden />
                </button>
              )}
            </div>
          </Reveal>
        </Wrap>
      </section>

      <div ref={top} className="scroll-mt-[72px]" />
      <Wrap className="py-14 md:py-20">
        {query ? (
          <section aria-live="polite">
            <h2 className="font-serif text-[1.75rem] md:text-[2.25rem] leading-[1.15] tracking-[-0.01em]">{f(H.results, { q: query })}</h2>
            <p className="mt-2 text-[15px] text-[#1a1a1a]/55">{count(results.length)}</p>
            {results.length
              ? <ul className="mt-6 max-w-[820px]">{results.map(id => <Row key={id} title={article(id)!.q} onClick={() => open({ kind: 'article', id })} />)}</ul>
              : <p className="mt-6 max-w-[620px] text-[17px] leading-[1.6] text-[#1a1a1a]/75">{f(H.noResults, { q: query })}</p>}
          </section>
        ) : view.kind === 'article' ? (() => {
          const it = article(view.id)!; const c = catOf(view.id);
          const others = live(c.items).filter(id => id !== view.id);
          return (
            <article className="max-w-[760px]">
              <Crumbs cat={c.id} />
              <button onClick={() => open({ kind: 'cat', id: c.id })} className="mt-8 inline-flex h-6 items-center gap-2 text-[15px] font-semibold hover:opacity-60 transition-opacity">
                <ArrowLeft size={17} aria-hidden />{f(H.backTo, { name: catTitle(c.id) })}
              </button>
              <h1 className="mt-6 font-serif text-[2.25rem] md:text-[3rem] leading-[1.1] tracking-[-0.02em] [text-wrap:balance]">{it.q}</h1>
              <p className="mt-6 text-[18px] leading-[1.7] text-[#1a1a1a]/85">{it.a}</p>
              {others.length > 0 && (
                <div className="mt-16">
                  <h2 className="text-[17px] font-semibold">{f(H.more, { name: catTitle(c.id) })}</h2>
                  <ul className="mt-3">{others.map(id => <Row key={id} title={article(id)!.q} onClick={() => open({ kind: 'article', id })} />)}</ul>
                </div>
              )}
            </article>
          );
        })() : view.kind === 'cat' ? (() => {
          const c = CATS.find(x => x.id === view.id)!; const items = live(c.items);
          return (
            <section className="max-w-[820px]">
              <Crumbs />
              <div className="mt-8 flex items-center gap-4">
                <Emoji e={c.emoji} size={48} />
                <h1 className="font-serif text-[2.25rem] md:text-[3rem] leading-[1.1] tracking-[-0.02em]">{catTitle(c.id)}</h1>
              </div>
              <p className="mt-4 text-[17px] text-[#1a1a1a]/65">{f(H.cats[c.id].blurb, names)}</p>
              <p className="mt-1 text-[15px]" style={{ color: BLUE }}>{count(items.length)}</p>
              <ul className="mt-8">{items.map(id => <Row key={id} title={article(id)!.q} onClick={() => open({ kind: 'article', id })} />)}</ul>
            </section>
          );
        })() : (
          <>
            <h2 className="font-serif text-[1.75rem] md:text-[2.25rem] leading-[1.15] tracking-[-0.01em]">{H.topics}</h2>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-4 md:gap-5">
              {CATS.map((c, i) => (
                <Reveal key={c.id} delay={(i % 4) * 60} className="h-full">
                  <button onClick={() => open({ kind: 'cat', id: c.id })} className="h-full w-full flex flex-col text-left rounded-[20px] bg-white border border-[#1a1a1a]/10 p-6 md:p-7 hover:border-[#1a1a1a]/30 hover:-translate-y-0.5 transition-all">
                    <Emoji e={c.emoji} size={44} />
                    <span className="mt-6 text-[19px] font-semibold leading-[1.25]">{catTitle(c.id)}</span>
                    <span className="mt-2 text-[15px] leading-[1.5] text-[#1a1a1a]/65">{f(H.cats[c.id].blurb, names)}</span>
                    <span className="mt-auto pt-6 text-[14px]" style={{ color: BLUE }}>{count(live(c.items).length)}</span>
                  </button>
                </Reveal>
              ))}
            </div>

            <section className="mt-20 md:mt-28">
              <h2 className="font-serif text-[1.75rem] md:text-[2.25rem] leading-[1.15] tracking-[-0.01em]">{H.promoted}</h2>
              <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-16">
                {live(PROMOTED).map(id => <Row key={id} title={article(id)!.q} onClick={() => open({ kind: 'article', id })} />)}
              </ul>
            </section>
          </>
        )}

        {/* Still need help */}
        <section className="mt-20 md:mt-28 rounded-[20px] px-7 py-10 md:px-12 md:py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6" style={{ background: TINT }}>
          <div className="flex items-center gap-5">
            <Emoji e="💌" size={44} />
            <div>
              <h2 className="font-serif text-[1.75rem] md:text-[2rem] leading-[1.15]">{H.stillTitle}</h2>
              <p className="mt-1 text-[16px] text-[#1a1a1a]/70">{H.stillBody}</p>
            </div>
          </div>
          <div className="shrink-0"><Pill onClick={() => go('/contact')}>{H.contact}</Pill></div>
        </section>
      </Wrap>
    </Shell>
  );
};

export default HelpCenter;
