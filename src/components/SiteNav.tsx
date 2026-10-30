import { useI18n } from '../i18n';
import React, { useEffect, useState } from 'react';
import DragonflyMark from './DragonflyMark';

// The top bar for the public pages, modeled on devin.ai: 60px, flat, links on laptops, the menu button on phones.
const SiteNav: React.FC<{
  links: { label: string; onClick: () => void; current?: boolean; section?: string }[];
  onHome: () => void;
  onLogin: () => void;
  onGetStarted: () => void;
  onMenu: () => void;
}> = ({ links, onHome, onLogin, onGetStarted, onMenu }) => {
  const { d } = useI18n();
  const [inView, setInView] = useState<string | null>(null);
  // On the landing page, the link for the section you're looking at is the one that's lit
  const sections = links.map(l => l.section).filter(Boolean).join(',');
  useEffect(() => {
    if (!sections || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(items => {
      const hit = items.filter(i => i.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setInView(hit.target.id);
    }, { rootMargin: '-45% 0px -50% 0px' });
    const els = sections.split(',').map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    els.forEach(el => io.observe(el));
    const top = () => { if (window.scrollY < 200) setInView(null); };
    window.addEventListener('scroll', top, { passive: true });
    return () => { io.disconnect(); window.removeEventListener('scroll', top); };
  }, [sections]);
  // Flat and compact, like devin.ai: a quiet solid bar, small regular-weight links that light up on hover, a black pill to start
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#fcfcfc]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto h-[60px] px-4 md:px-6 flex items-center gap-6">
        <button onClick={onHome} className="flex items-center gap-2 shrink-0 h-9 pl-1 pr-2" aria-label="Belluh home">
          <DragonflyMark size={26} />
          <span className="font-serif text-[21px] font-bold tracking-tight text-[#9bbecb]">Belluh</span>
        </button>
        <nav className="hidden md:flex items-center">
          {links.map(l => {
            const on = l.current || (!!l.section && l.section === inView);
            return (
              <button key={l.label} onClick={l.onClick} aria-current={on ? (l.current ? 'page' : 'location') : undefined} className={`h-8 px-3 rounded-full text-[14px] transition-colors duration-200 hover:bg-black/[0.05] ${on ? 'text-black' : 'text-slate-600 hover:text-black'}`}>
                {l.label}
              </button>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={onLogin} className="hidden md:inline-flex h-8 items-center px-3 rounded-full text-[14px] whitespace-nowrap text-slate-800 hover:bg-black/[0.05] transition-colors">{d.common.logIn}</button>
          <button onClick={onGetStarted} className="h-8 px-3.5 inline-flex items-center whitespace-nowrap rounded-full bg-black text-white text-[14px] hover:bg-slate-800 transition-colors">{d.common.startFree}</button>
          <button onClick={onMenu} aria-label="Open menu" className="md:hidden ml-1 -mr-1 h-9 w-9 inline-flex items-center justify-center text-slate-900">
            <svg width="22" height="12" viewBox="0 0 22 12" fill="none" aria-hidden="true"><path d="M1 1h20M1 11h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default SiteNav;
