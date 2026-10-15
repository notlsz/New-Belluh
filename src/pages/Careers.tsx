import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowUpRight, Menu, X, ChevronLeft, Globe, Zap, Mail, Copy, Check } from 'lucide-react';
import BelluhOrb from '../components/BelluhOrb';
import SiteFooter from '../components/SiteFooter';
import SiteNav from '../components/SiteNav';

interface CareersProps {
  onBack: () => void;
  onGetStarted: () => void;
  onLogin: () => void;
  onShowLegal: (type: 'tos' | 'privacy') => void;
  onGoToAbout: () => void;
}

const APPLY = 'elizabeth@belluh.com';

const PRINCIPLES = [
  { title: 'Spikes over résumés', text: "We prioritize life experience over work experience. Skills can be taught, but perspectives are difficult to shape." },
  { title: 'Reject consensus', text: 'Chase non-obvious secrets, be creative, and hold a unique lens on the world.' },
  { title: 'Epic missions', text: 'Fellows get grants up to $50K and go on missions nationwide, with a direct path to a full-time role.' },
];

const SPIKES = ['Top 30 Valorant NA', 'U.S. Boxing Top 3', 'Built a videogame at 12 with 350K+ players', 'Top 100 of 700K in a photography contest', 'Competitive athlete', 'IMO gold', 'Self-taught plumber', 'Ironman 70.3 finisher', 'Florist selling 50+ flower types', 'Philosophy blogger with 30K monthly readers', 'Former YC founders', 'A Thiel fellow', 'A Rhodes scholar', 'A Schwarzman scholar', 'Cycled across continental Europe', '500+ skydives'];

const Careers: React.FC<CareersProps> = ({ onBack, onGetStarted, onLogin, onShowLegal, onGoToAbout }) => {
  const [copied, setCopied] = useState(false);
  const copyEmail = async () => { try { await navigator.clipboard.writeText(APPLY); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* the address is on screen */ } };
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(
    window.location.pathname === '/careers/fellows' ? 'fellow' : null
  );
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/careers/fellows') {
        setSelectedRole('fellow');
      } else {
        setSelectedRole(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    if (selectedRole === 'fellow' && path !== '/careers/fellows') {
      window.history.pushState({}, '', '/careers/fellows');
    } else if (selectedRole === null && path === '/careers/fellows') {
      window.history.pushState({}, '', '/careers');
    }
  }, [selectedRole]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
      if (isMenuOpen) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = 'unset';
      }
      return () => {
          document.body.style.overflow = 'unset';
      };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const menuItems = [
      { label: 'Home', action: () => { toggleMenu(); onBack(); } },
      { label: 'Our Why', action: () => { toggleMenu(); onGoToAbout(); } },
      { label: 'Privacy', action: () => { toggleMenu(); onShowLegal('privacy'); } }
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 font-sans selection:bg-[#f0addd] selection:text-white overflow-x-hidden relative flex flex-col">
      
      {/* --- Ambient Cloud Background Layers --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#CDE9F2]/30 rounded-full blur-[120px] animate-float opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#f0addd]/20 rounded-full blur-[130px] animate-pulse-slow opacity-50"></div>
          <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-white rounded-full blur-[80px] animate-breathing opacity-80 mix-blend-overlay"></div>
      </div>

      {/* Top bar */}
      <SiteNav
          links={[
              { label: 'Home', onClick: onBack },
              { label: 'Our Why', onClick: onGoToAbout },
              { label: 'Careers', onClick: () => { setSelectedRole(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }, current: true },
          ]}
          onHome={onBack}
          onLogin={onLogin}
          onGetStarted={onGetStarted}
          onMenu={toggleMenu}
      />

      {/* Full Screen Menu Overlay */}
      <div className={`fixed inset-0 z-[100] bg-white overflow-y-auto overscroll-contain transition-all duration-700 ease-[cubic-bezier(0.32,0.725,0,1)] ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
          <div className="flex flex-col min-h-full p-6 md:p-10 relative max-w-7xl mx-auto w-full">
               <div className="flex justify-between items-center mb-6 md:mb-8">
                   <span className="font-serif text-2xl font-bold tracking-tight text-[#9bbecb]">Belluh</span>
                   <button 
                    onClick={toggleMenu}
                    className="bg-slate-50 text-slate-900 w-12 h-12 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-100"
                   >
                       <X size={24} strokeWidth={2} />
                   </button>
               </div>

               <div className="flex-1 flex flex-col justify-center items-start gap-3 md:gap-5 py-2 animate-slide-up pl-2">
                   {menuItems.map((item, idx) => (
                       <button 
                         key={idx}
                         onClick={item.action}
                         className="group relative flex items-start gap-6 text-left transition-all duration-500 w-full md:w-auto"
                       >
                           <span className="text-xs font-bold font-sans text-slate-200 group-hover:text-[#9bbecb] mt-1 md:mt-2 transition-colors duration-300">{idx + 1}</span>
                           <span style={{ fontSize: 'clamp(2rem, min(9vw, 6vh), 6rem)' }} className="font-serif font-medium text-slate-300 group-hover:text-[#9bbecb] tracking-tighter transition-colors duration-300 leading-[0.9] group-hover:translate-x-2 transform">
                               {item.label}
                           </span>
                       </button>
                   ))}
               </div>

               <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-auto pt-6 w-full max-w-md md:max-w-xl animate-fade-in">
                   <button 
                       onClick={() => { toggleMenu(); onLogin(); }}
                       className="w-full py-3.5 md:py-4 rounded-full bg-slate-50 font-bold text-slate-900 hover:bg-slate-100 transition-colors text-lg border border-slate-100"
                   >
                       Sign In
                   </button>
                   <button 
                       onClick={() => { toggleMenu(); onGetStarted(); }}
                       className="w-full py-3.5 md:py-4 rounded-full bg-[#9bbecb] text-white font-bold hover:bg-[#8aaab7] transition-colors shadow-xl text-lg flex items-center justify-center gap-2"
                   >
                       Join Belluh <ArrowRight size={18} />
                   </button>
               </div>
          </div>
      </div>

      {selectedRole === 'fellow' ? (
        <section className="relative z-10 pt-36 md:pt-44 pb-28 px-6 flex-1">
          <div className="max-w-3xl mx-auto w-full animate-slide-up">
              <button onClick={() => setSelectedRole(null)} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-900 transition-colors mb-14 text-sm font-bold">
                  <ChevronLeft size={16} /> All roles
              </button>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9bbecb] mb-5">Growth, Marketing, Suggestion Maker</p>
              <h1 className="text-5xl md:text-7xl font-serif leading-[1.05] tracking-tight text-slate-900 mb-7">Belluh Fellow</h1>
              <div className="flex flex-wrap gap-2 mb-14">
                  <span className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 flex items-center gap-1.5"><Globe size={14} /> Hybrid</span>
                  <span className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 flex items-center gap-1.5"><Zap size={14} /> Full-time</span>
                  <span className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600">Grants up to $50K</span>
              </div>

              <p className="font-serif text-2xl md:text-3xl leading-snug text-slate-900 mb-10">
                  We're building Belluh. AI that spots relationship drift 3 weeks early. We work with fun people who excel anywhere.
              </p>
              <div className="space-y-6 text-lg text-slate-600 font-light leading-relaxed">
                  <p>They reject consensus, chase non-obvious secrets, are creative, and hold a unique lens on the world. We prioritize life experience over work experience. Skills can be taught, but perspectives are difficult to shape. We want to see spikes regardless of what you do.</p>
                  <p className="font-medium text-slate-900">No hard criteria. If you have spikes, you'll know.</p>
                  <p>We provide grants for fellows up to $50K, sending you on epic missions nationwide. For top performers, there is a direct path to a full-time role with a $200K salary.</p>
              </div>

              <div className="mt-14">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-5">Previously successful collaborators</p>
                  <div className="flex flex-wrap gap-2">
                      {SPIKES.map(x => <span key={x} className="px-3.5 py-2 rounded-full bg-white border border-slate-100 shadow-sm text-sm text-slate-600">{x}</span>)}
                  </div>
              </div>

              <div className="mt-16 rounded-[2rem] bg-white/90 backdrop-blur-xl border border-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)] p-8 md:p-10">
                  <p className="font-serif text-2xl md:text-3xl text-slate-900">Insanely different? We want to meet you.</p>
                  <p className="mt-3 text-slate-500">Send us an email with what makes you uniquely spiked.</p>
                  <div className="mt-7 flex flex-col sm:flex-row gap-3">
                      <a href={`mailto:${APPLY}?subject=Belluh%20Fellow`} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-black transition-colors">
                          <Mail size={16} /> Email {APPLY}
                      </a>
                      <button onClick={copyEmail} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 rounded-full font-bold text-sm text-slate-700 hover:border-slate-300 transition-colors">
                          {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy address</>}
                      </button>
                  </div>
              </div>
          </div>
        </section>
      ) : (
        <>
          {/* Hero */}
          <section className="relative z-10 pt-40 md:pt-52 pb-20 md:pb-28 px-6">
             <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto] items-end gap-10 animate-slide-up">
                 <div>
                     <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9bbecb] mb-6">Careers</p>
                     <h1 className="text-[2.6rem] sm:text-6xl md:text-8xl font-serif leading-[1.04] tracking-tight">
                         <span className="text-[#9bbecb]">Build the future of</span><br /><span className="text-[#f0addd] italic">intimacy.</span>
                     </h1>
                     <p className="mt-8 text-xl md:text-2xl text-slate-500 font-light leading-relaxed max-w-2xl">
                         Join a small, passionate team dedicated to helping couples connect deeper through thoughtful AI.
                     </p>
                     <button onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })} className="mt-10 inline-flex items-center gap-2 h-12 px-6 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-black transition-colors">
                         See open roles <ArrowRight size={16} />
                     </button>
                 </div>
                 <div className="hidden md:block pb-4">
                     <BelluhOrb size={190} onTap={() => {}} label="Belluh. Tap to make a ripple." />
                 </div>
             </div>
          </section>

          {/* The numbers */}
          <section className="relative z-10 px-6 pb-20 md:pb-28">
              <div className="max-w-6xl mx-auto flex flex-wrap gap-x-16 gap-y-8">
                  {[
                      { big: '$50K', small: 'Grants for fellows' },
                      { big: '$200K', small: 'Full-time path for top performers' },
                      { big: 'Nationwide', small: 'Epic missions, hybrid team' },
                  ].map(x => (
                      <div key={x.big}>
                          <p className="font-serif text-5xl md:text-7xl tracking-tight text-slate-900">{x.big}</p>
                          <p className="mt-2 text-slate-500">{x.small}</p>
                      </div>
                  ))}
              </div>
          </section>

          {/* Who has built with us */}
          <section className="relative z-10 pb-24 md:pb-32 overflow-hidden">
              <div className="max-w-6xl mx-auto px-6 mb-8">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Previously successful collaborators</p>
              </div>
              <div className="space-y-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
                  {[SPIKES.slice(0, 8), SPIKES.slice(8)].map((row, r) => (
                      <div key={r} className="flex w-max gap-3" style={{ animation: `careers-marquee ${r ? 46 : 38}s linear infinite ${r ? 'reverse' : ''}` }}>
                          {[...row, ...row, ...row].map((x, i) => (
                              <span key={i} className="shrink-0 px-5 py-3 rounded-full bg-white border border-slate-100 shadow-sm font-serif text-lg text-slate-700 whitespace-nowrap">{x}</span>
                          ))}
                      </div>
                  ))}
              </div>
              <style>{`@keyframes careers-marquee { from { transform: translateX(0); } to { transform: translateX(-33.333%); } } @media (prefers-reduced-motion: reduce) { [style*="careers-marquee"] { animation: none !important; } }`}</style>
          </section>

          {/* How we work */}
          <section className="relative z-10 px-6 pb-24 md:pb-32">
              <div className="max-w-6xl mx-auto">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-10">How we work</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
                      {PRINCIPLES.map((p, i) => (
                          <div key={p.title}>
                              <p className="font-serif text-5xl text-[#CDE9F2] leading-none">{i + 1}</p>
                              <h3 className="mt-5 font-serif text-2xl md:text-3xl text-slate-900 tracking-tight">{p.title}</h3>
                              <p className="mt-3 text-slate-500 font-light leading-relaxed text-lg">{p.text}</p>
                          </div>
                      ))}
                  </div>
              </div>
          </section>

          {/* Open roles */}
          <section id="roles" className="relative z-10 px-6 pb-28 md:pb-36 flex-1 scroll-mt-28">
              <div className="max-w-6xl mx-auto">
                  <div className="flex items-baseline justify-between gap-4 mb-8">
                      <h2 className="text-3xl md:text-5xl font-serif tracking-tight text-slate-900">Open roles</h2>
                      <span className="text-sm text-slate-400">1 role</span>
                  </div>
                  <button onClick={() => setSelectedRole('fellow')} className="w-full text-left group rounded-[2rem] bg-white/90 backdrop-blur-xl border border-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.18)] hover:shadow-[0_30px_70px_-25px_rgba(63,116,134,0.4)] transition-all duration-500 p-7 md:p-10 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] items-center gap-5 md:gap-10">
                      <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">Growth, Marketing, Suggestion Maker</p>
                          <h3 className="font-serif text-3xl md:text-4xl tracking-tight text-slate-900 group-hover:text-[#9bbecb] transition-colors">Belluh Fellow</h3>
                          <p className="mt-2 text-slate-500 font-light">We want to see spikes regardless of what you do.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1.5 bg-slate-50 rounded-full text-xs font-bold text-slate-500 flex items-center gap-1.5"><Globe size={14} /> Hybrid</span>
                          <span className="px-3 py-1.5 bg-slate-50 rounded-full text-xs font-bold text-slate-500 flex items-center gap-1.5"><Zap size={14} /> Full-time</span>
                      </div>
                      <ArrowUpRight size={28} strokeWidth={1.5} className="text-slate-300 group-hover:text-slate-900 group-hover:-translate-y-1 group-hover:translate-x-1 transition-all duration-300 hidden md:block" />
                  </button>
                  <p className="mt-8 text-slate-500">Don't see your role? Write to <a href={`mailto:${APPLY}`} className="font-bold text-slate-800 underline decoration-slate-300 underline-offset-4">{APPLY}</a> anyway.</p>
              </div>
          </section>
        </>
      )}

      <SiteFooter
          onTop={onBack}
          onSection={(id) => { onBack(); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 350); }}
          onGetStarted={onGetStarted}
          onLogin={onLogin}
          onShowLegal={onShowLegal}
          onGoToAbout={onGoToAbout}
          onGoToCareers={() => { setSelectedRole(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      />
    </div>
  );
};

export default Careers;
