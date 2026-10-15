import React from 'react';
import { ArrowRight } from 'lucide-react';
import BelluhOrb from './BelluhOrb';

// The site footer, shared by the landing page, Careers and Our Why. Section links scroll on the landing page and
// go home first everywhere else.
const SiteFooter: React.FC<{
  onTop: () => void;
  onSection: (id: string) => void;
  onGetStarted: () => void;
  onLogin: () => void;
  onShowLegal: (type: 'tos' | 'privacy') => void;
  onGoToAbout: () => void;
  onGoToCareers: () => void;
}> = ({ onTop, onSection, onGetStarted, onLogin, onShowLegal, onGoToAbout, onGoToCareers }) => (
  <footer className="relative z-10 overflow-hidden bg-[#F8FAFB]">
      <div className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-12">
              <div className="col-span-2 md:col-span-5">
                  <button onClick={onTop} className="flex items-center gap-2.5" aria-label="Belluh home">
                      <BelluhOrb size={30} />
                      <span className="font-serif text-2xl font-bold tracking-tight text-[#9bbecb]">Belluh</span>
                  </button>
                  <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-slate-500">The AI journal for couples. Write a few lines a day. Belluh remembers, plans, and reminds you both.</p>
                  <button onClick={onGetStarted} className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-slate-900 px-5 text-sm font-bold text-white transition-colors hover:bg-black">
                      Start free <ArrowRight size={15} />
                  </button>
              </div>
              {[
                  { title: 'Product', links: [['Meet Belluh', () => onSection('meet')], ['What it does', () => onSection('features')], ['Inside', () => onSection('inside')], ['Stories', () => onSection('stories')], ['FAQ', () => onSection('faq')]] },
                  { title: 'Company', links: [['Our Why', onGoToAbout], ['Careers', onGoToCareers], ['Log in', onLogin]] },
                  { title: 'Legal', links: [['Terms of Service', () => onShowLegal('tos')], ['Privacy Policy', () => onShowLegal('privacy')]] },
              ].map(col => (
                  <div key={col.title} className="md:col-span-2 last:md:col-span-3">
                      <p className="mb-5 text-sm font-bold text-slate-900">{col.title}</p>
                      <ul className="space-y-3.5">
                          {col.links.map(([label, go]) => (
                              <li key={label as string}><button onClick={go as () => void} className="text-[15px] text-slate-500 transition-colors hover:text-slate-900">{label as string}</button></li>
                          ))}
                      </ul>
                  </div>
              ))}
          </div>
          {/* Signature, bottom left */}
          <div className="mt-20 md:mt-24 inline-grid grid-cols-[auto_auto] items-center gap-x-3 gap-y-1 text-[#9bbecb] font-medium uppercase tracking-[0.08em] text-[17px] md:text-[22px] leading-tight select-none" aria-label="Made for two, by the team at Belluh, 2026">
              <div className="row-span-2 flex items-center gap-1.5" aria-hidden="true">
                  <svg viewBox="0 0 100 100" className="h-12 w-12 md:h-16 md:w-16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round"><path d="M44.8 13.0 A5.2 5.2 0 1 0 55.2 13.0 A5.2 5.2 0 1 0 44.8 13.0 Z M50.0 20.0 A8.0 5.8 90.0 1 0 50.0 36.0 A8.0 5.8 90.0 1 0 50.0 20.0 Z M53.4 33 L46.6 33 L47.7 89 Q50 95.5 52.3 89 Z M48.0 22.0 A21.5 6.4 12.1 1 0 6.0 13.0 A21.5 6.4 12.1 1 0 48.0 22.0 Z M52.0 22.0 A21.5 6.4 167.9 1 0 94.0 13.0 A21.5 6.4 167.9 1 0 52.0 22.0 Z M48.0 28.0 A20.4 6.0 162.9 1 0 9.0 40.0 A20.4 6.0 162.9 1 0 48.0 28.0 Z M52.0 28.0 A20.4 6.0 17.1 1 0 91.0 40.0 A20.4 6.0 17.1 1 0 52.0 28.0 Z" /></svg>
                  <svg viewBox="0 0 48 48" className="h-12 w-12 md:h-16 md:w-16" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="24" r="13" /><circle cx="30" cy="24" r="13" /></svg>
              </div>
              <span>Made for two</span>
              <span>&rarr; By the team at</span>
              <span className="col-span-2 mt-1">&copy;2026 // Belluh</span>
          </div>
      </div>
  </footer>
);

export default SiteFooter;
