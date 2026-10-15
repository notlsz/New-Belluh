import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import BelluhOrb from './BelluhOrb';

// The top bar for the public pages: flat and full width, like devin.ai and cognition.com. Clear over the hero, a
// soft white backdrop once you scroll. Links on laptops; the menu button on phones.
const SiteNav: React.FC<{
  links: { label: string; onClick: () => void; current?: boolean }[];
  onHome: () => void;
  onLogin: () => void;
  onGetStarted: () => void;
  onMenu: () => void;
}> = ({ links, onHome, onLogin, onGetStarted, onMenu }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto h-16 md:h-[72px] px-5 md:px-8 flex items-center gap-8">
        <button onClick={onHome} className="flex items-center gap-2 shrink-0" aria-label="Belluh home">
          <BelluhOrb size={22} />
          <span className="font-serif text-[22px] font-bold tracking-tight text-[#9bbecb]">Belluh</span>
        </button>
        <nav className="hidden md:flex items-center gap-7 text-[15px] text-slate-500">
          {links.map(l => (
            <button key={l.label} onClick={l.onClick} aria-current={l.current ? 'page' : undefined} className={`transition-colors hover:text-slate-900 ${l.current ? 'text-slate-900' : ''}`}>{l.label}</button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <button onClick={onLogin} className="hidden md:inline-flex h-10 items-center px-3 text-[15px] text-slate-600 hover:text-slate-900 transition-colors">Log in</button>
          <button onClick={onGetStarted} className="h-9 md:h-10 px-4 md:px-5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-black transition-colors">Start free</button>
          <button onClick={onMenu} aria-label="Open menu" className="md:hidden -mr-2 p-2 text-slate-700">
            <Menu size={22} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default SiteNav;
