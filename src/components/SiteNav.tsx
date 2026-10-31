import { useI18n, useUi } from '../i18n';
import siteUi from '../i18n/ui/site';
import React, { useEffect, useRef, useState } from 'react';
import DragonflyMark from './DragonflyMark';
import { go } from '../lib/go';

export type SitePage = 'mission' | 'impact' | 'research' | 'careers' | 'why' | 'home';

// The top bar for the public pages, after hinge.co: a quiet 72px white bar, the company pages on the left (Mission,
// Impact, Research), the mark dead center, Careers and getting started on the right. The page you're on wears a small
// dot under its name. It slips away as you scroll down to read and comes back the moment you scroll up. On phones:
// the menu on the left, the mark in the middle, Start free on the right, and the menu opens to the whole screen.
const SiteNav: React.FC<{
  links?: { label: string; onClick: () => void; current?: boolean; section?: string }[];
  current?: SitePage;
  onHome: () => void;
  onLogin: () => void;
  onGetStarted: () => void;
  onMenu?: () => void;
}> = ({ links = [], current, onHome, onLogin, onGetStarted }) => {
  const { d } = useI18n();
  const T = useUi(siteUi);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    const on = () => { const y = window.scrollY; setHidden(y > 120 && y > last.current + 2 ? true : y < last.current - 2 || y < 120 ? false : hidden); last.current = y; };
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [hidden]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [open]);

  const page = (id: SitePage, label: string, path: string) => ({ id, label, path });
  const left = [page('mission', T.mission, '/mission'), page('impact', T.impact, '/impact'), page('research', T.research, '/research')];
  const all = [...left, page('careers', T.careers, '/careers'), page('why', T.why, '/about')];
  const Link = ({ p }: { p: { id: SitePage; label: string; path: string } }) => (
    <a href={p.path} onClick={e => { e.preventDefault(); go(p.path); }} aria-current={current === p.id ? 'page' : undefined}
      className="relative h-10 px-3 inline-flex items-center text-[14px] text-[#1a1a1a] hover:opacity-60 transition-opacity">
      {p.label}
      {current === p.id && <span aria-hidden className="absolute left-1/2 bottom-1 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-[#1a1a1a]" />}
    </a>
  );
  const Mark = () => (
    <a href="/" onClick={e => { e.preventDefault(); if (current === 'home') onHome(); else go('/'); }} className="flex items-center gap-1.5" aria-label="Belluh home">
      <DragonflyMark size={28} />
      <span className="font-serif text-[24px] font-bold tracking-tight text-[#1a1a1a]">Belluh</span>
    </a>
  );

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 h-[72px] bg-[#fffefd] transition-transform duration-300 ease-out" style={{ transform: hidden && !open ? 'translateY(-100%)' : 'none' }}>
        <div className="relative h-full max-w-[1440px] mx-auto px-5 md:px-10 grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center">
            <button onClick={() => setOpen(true)} aria-label={T.menu} aria-expanded={open} className="md:hidden -ml-2 w-11 h-11 inline-flex items-center justify-center text-[#1a1a1a]">
              <svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden="true"><path d="M1 1h24M1 11h24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
            <nav className="hidden md:flex items-center -ml-3" aria-label="Belluh">{left.map(p => <Link key={p.id} p={p} />)}</nav>
          </div>
          <Mark />
          <div className="flex items-center justify-end gap-1">
            <span className="hidden md:inline-flex"><Link p={all[3]} /></span>
            <button onClick={onLogin} className="hidden md:inline-flex h-10 px-3 items-center text-[14px] text-[#1a1a1a] hover:opacity-60 transition-opacity">{d.common.logIn}</button>
            <button onClick={onGetStarted} className="h-10 px-4 md:ml-2 inline-flex items-center whitespace-nowrap rounded-full bg-[#1a1a1a] text-white text-[14px] font-semibold hover:bg-black transition-colors">{d.common.startFree}</button>
          </div>
        </div>
      </header>

      {/* The menu, the whole screen */}
      <div role="dialog" aria-modal="true" aria-label={T.menu} className={`fixed inset-0 z-[100] bg-[#fffefd] overflow-y-auto transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none invisible'}`}>
        <div className="min-h-full max-w-[1440px] mx-auto px-5 md:px-10 flex flex-col">
          <div className="h-[72px] grid grid-cols-[1fr_auto_1fr] items-center">
            <button onClick={() => setOpen(false)} aria-label={T.close} className="-ml-2 w-11 h-11 inline-flex items-center justify-center text-[#1a1a1a]">
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3l14 14M17 3L3 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
            <Mark />
            <span />
          </div>
          <nav className="pt-8 flex flex-col items-start gap-1" aria-label={T.menu}>
            {all.map(p => (
              <a key={p.id} href={p.path} onClick={e => { e.preventDefault(); setOpen(false); go(p.path); }} aria-current={current === p.id ? 'page' : undefined}
                className="font-serif text-[2.6rem] leading-[1.15] tracking-tight text-[#1a1a1a] hover:opacity-60 transition-opacity inline-flex items-center gap-3">
                {p.label}{current === p.id && <span aria-hidden className="w-2 h-2 rounded-full bg-[#1a1a1a]" />}
              </a>
            ))}
          </nav>
          {links.length > 0 && (
            <div className="mt-10">
              <p className="text-[13px] text-slate-500 mb-3">{T.onThisPage}</p>
              <div className="flex flex-wrap gap-2">{links.map(l => <button key={l.label} onClick={() => { setOpen(false); setTimeout(l.onClick, 50); }} className="h-10 px-4 rounded-full border border-[#1a1a1a]/15 text-[15px] text-[#1a1a1a]">{l.label}</button>)}</div>
            </div>
          )}
          <div className="mt-auto py-8 grid grid-cols-2 gap-3">
            <button onClick={() => { setOpen(false); onLogin(); }} className="h-12 rounded-full border border-[#1a1a1a]/20 text-[16px] font-semibold text-[#1a1a1a]">{d.common.logIn}</button>
            <button onClick={() => { setOpen(false); onGetStarted(); }} className="h-12 rounded-full bg-[#1a1a1a] text-white text-[16px] font-semibold">{d.common.startFree}</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SiteNav;
