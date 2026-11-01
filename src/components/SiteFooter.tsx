import React from 'react';
import { ArrowRight } from 'lucide-react';
import BelluhOrb from './BelluhOrb';
import { belluh } from '../lib/belluhPresence';
import { useI18n, useUi, LANGS, type Lang } from '../i18n';
import siteUi from '../i18n/ui/site';
import footerUi from '../i18n/ui/footerLinks';
import LangPicker from './LangPicker';
import { go as goTo } from '../lib/go';

// The site footer, shared by the landing page, Careers and Our Why. Section links scroll on the landing page and
// go home first everywhere else. Phones: the brand on its own row, then two link columns. Tablets: four equal link
// columns under the brand. Desktop: a wider brand column and four equal link columns, wide enough that the longest
// label in any language wraps at most once, always left-aligned.
const SiteFooter: React.FC<{
  onTop: () => void;
  onSection: (id: string) => void;
  onGetStarted: () => void;
  onLogin: () => void;
  onShowLegal: (type: 'tos' | 'privacy') => void;
  onGoToAbout: () => void;
  onGoToCareers: () => void;
}> = ({ onTop, onSection, onGetStarted, onLogin, onShowLegal, onGoToAbout, onGoToCareers }) => {
  const { d, lang, setLang } = useI18n();
  const t = d.footer, n = d.nav, S = useUi(siteUi), F = useUi(footerUi);
  return (
  <footer className="relative z-10 overflow-hidden bg-[#F8FAFB]">
      <div className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] gap-x-8 gap-y-12">
              <div className="col-span-2 md:col-span-4 lg:col-span-1 lg:pr-6">
                  <button onClick={onTop} className="flex items-center gap-2.5" aria-label={F.home}>
                      <BelluhOrb size={30} />
                      <span className="font-serif text-2xl font-bold tracking-tight text-[#9bbecb]">Belluh</span>
                  </button>
                  <p className="mt-6 max-w-sm font-serif text-2xl md:text-[1.75rem] leading-snug tracking-tight text-slate-800">{t.line1} <span className="italic text-[#e58fc9]">{t.line2}</span></p>
                  <button onClick={onGetStarted} className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-slate-900 px-5 text-sm font-bold text-white transition-colors hover:bg-black">
                      {d.common.startFree} <ArrowRight size={15} />
                  </button>
              </div>
              {[
                  { title: t.product, links: [[n.meet, () => onSection('at-work')], [n.inside, () => onSection('inside')], [n.stories, () => onSection('stories')], [n.pricing, () => onSection('pricing')], [n.faq, () => onSection('faq')]] },
                  { title: t.company, links: [[S.mission, () => goTo('/mission')], [S.impact, () => goTo('/impact')], [S.research, () => goTo('/research')], [n.why, onGoToAbout], [n.careers, onGoToCareers], [d.common.logIn, onLogin]] },
                  { title: F.resources, links: [[F.newsroom, () => goTo('/newsroom')], [F.stories, () => goTo('/stories')], [F.safetyTips, () => goTo('/safety-tips')], [F.trust, () => goTo('/trust-and-safety')], [F.press, () => goTo('/press')], [F.howItWorks, () => goTo('/how-belluh-works')], [F.nfaq, () => goTo('/nfaq')], [F.contact, () => goTo('/contact')]] },
                  { title: t.legal, links: [[F.security, () => goTo('/security')], [t.terms, () => onShowLegal('tos')], [t.privacyPolicy, () => onShowLegal('privacy')], [F.cookies, () => goTo('/cookies')], [F.healthData, () => goTo('/consumer-health-data')], [F.privacyChoices, () => goTo('/privacy-choices')], [F.accessibility, () => goTo('/accessibility')]] },
              ].map(col => (
                  <div key={col.title} className="min-w-0">
                      <p className="mb-5 text-sm leading-5 font-bold text-slate-900">{col.title}</p>
                      <ul className="space-y-3.5">
                          {col.links.map(([label, go]) => (
                              <li key={label as string}><button onClick={go as () => void} className="block w-full text-left text-[15px] leading-[1.35] break-words text-slate-500 transition-all hover:text-slate-900 hover:translate-x-0.5">{label as string}</button></li>
                          ))}
                      </ul>
                  </div>
              ))}
          </div>
          <div className="mt-20 md:mt-24 flex flex-col-reverse md:flex-row md:items-end md:justify-between gap-12">
          {/* Signature, bottom left */}
          <div className="inline-grid grid-cols-[auto_auto] items-center gap-x-3 gap-y-1 text-[#9bbecb] font-medium uppercase tracking-[0.08em] text-[17px] md:text-[22px] leading-tight select-none" aria-label={`${t.madeForTwo}, ${t.byTeam} Belluh, 2026`}>
              <div className="row-span-2 flex items-center gap-1.5" aria-hidden="true">
                  <svg viewBox="0 0 100 100" className="h-12 w-12 md:h-16 md:w-16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round"><path d="M44.8 13.0 A5.2 5.2 0 1 0 55.2 13.0 A5.2 5.2 0 1 0 44.8 13.0 Z M50.0 20.0 A8.0 5.8 90.0 1 0 50.0 36.0 A8.0 5.8 90.0 1 0 50.0 20.0 Z M53.4 33 L46.6 33 L47.7 89 Q50 95.5 52.3 89 Z M48.0 22.0 A21.5 6.4 12.1 1 0 6.0 13.0 A21.5 6.4 12.1 1 0 48.0 22.0 Z M52.0 22.0 A21.5 6.4 167.9 1 0 94.0 13.0 A21.5 6.4 167.9 1 0 52.0 22.0 Z M48.0 28.0 A20.4 6.0 162.9 1 0 9.0 40.0 A20.4 6.0 162.9 1 0 48.0 28.0 Z M52.0 28.0 A20.4 6.0 17.1 1 0 91.0 40.0 A20.4 6.0 17.1 1 0 52.0 28.0 Z" /></svg>
                  <svg viewBox="0 0 48 48" className="h-12 w-12 md:h-16 md:w-16" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="24" r="13" /><circle cx="30" cy="24" r="13" /></svg>
              </div>
              <span>{t.madeForTwo}</span>
              <span>&rarr; {t.byTeam}</span>
              <span className="col-span-2 mt-1">&copy;2026 // Belluh</span>
          </div>
          {/* Belluh is here, bottom right: tap it and the water ripples */}
          <button onClick={() => belluh.key()} className="group self-start md:self-auto inline-flex items-center gap-3 h-14 pl-2 pr-5 rounded-full bg-white border border-slate-100 shadow-[0_14px_36px_-20px_rgba(15,23,42,0.35)] hover:shadow-[0_18px_40px_-18px_rgba(63,116,134,0.45)] transition-shadow">
              <BelluhOrb size={40} />
              <span className="text-left leading-tight">
                  <span className="block text-sm font-semibold text-slate-900">{t.here}</span>
                  <span className="block text-xs text-slate-400 group-hover:text-[#3f7486] transition-colors">{t.ripple}</span>
              </span>
          </button>
          </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 pb-10 -mt-4">
          <LangPicker label={t.language} />
      </div>
  </footer>
  );
};

export default SiteFooter;
