import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Menu, X, ChevronLeft, Globe, Zap } from 'lucide-react';

interface CareersProps {
  onBack: () => void;
  onGetStarted: () => void;
  onLogin: () => void;
  onShowLegal: (type: 'tos' | 'privacy') => void;
  onGoToAbout: () => void;
}

const Careers: React.FC<CareersProps> = ({ onBack, onGetStarted, onLogin, onShowLegal, onGoToAbout }) => {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const lastScrollY = useRef(0);

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

      {/* Floating Pill Navbar - Scroll Aware */}
      <div className={`fixed top-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-2xl z-50 transition-all duration-500 transform ${isNavVisible ? 'translate-y-0 opacity-100' : '-translate-y-[150%] opacity-0'}`}>
        <nav className="bg-white/80 backdrop-blur-xl rounded-full shadow-lg shadow-slate-200/50 border border-white px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
                <span className="font-serif text-xl font-bold tracking-tight text-[#9bbecb] drop-shadow-sm" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>Belluh</span>
            </div>

            <button 
                onClick={toggleMenu}
                className="bg-[#CDE9F2] text-cyan-900 w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-lg"
            >
                <Menu size={20} strokeWidth={2.5} />
            </button>
        </nav>
      </div>

      {/* Full Screen Menu Overlay */}
      <div className={`fixed inset-0 z-[100] bg-white transition-all duration-700 ease-[cubic-bezier(0.32,0.725,0,1)] ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
          <div className="flex flex-col h-full p-6 md:p-12 relative max-w-7xl mx-auto w-full">
               <div className="flex justify-between items-center mb-12">
                   <span className="font-serif text-2xl font-bold tracking-tight text-[#9bbecb]">Belluh</span>
                   <button 
                    onClick={toggleMenu}
                    className="bg-slate-50 text-slate-900 w-12 h-12 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-100"
                   >
                       <X size={24} strokeWidth={2} />
                   </button>
               </div>

               <div className="flex-1 flex flex-col justify-center items-start gap-4 md:gap-8 animate-slide-up pl-2">
                   {menuItems.map((item, idx) => (
                       <button 
                         key={idx}
                         onClick={item.action}
                         className="group relative flex items-start gap-6 text-left transition-all duration-500 w-full md:w-auto"
                       >
                           <span className="text-xs font-bold font-sans text-slate-200 group-hover:text-[#9bbecb] mt-2 md:mt-4 transition-colors duration-300">0{idx + 1}</span>
                           <span className="text-5xl md:text-8xl font-serif font-medium text-slate-300 group-hover:text-[#9bbecb] tracking-tighter transition-colors duration-300 leading-[0.9] group-hover:translate-x-2 transform">
                               {item.label}
                           </span>
                       </button>
                   ))}
               </div>

               <div className="flex flex-col gap-4 mt-auto pt-8 w-full max-w-md animate-fade-in">
                   <button 
                       onClick={() => { toggleMenu(); onLogin(); }}
                       className="w-full py-4 rounded-full bg-slate-50 font-bold text-slate-900 hover:bg-slate-100 transition-colors text-lg border border-slate-100"
                   >
                       Sign In
                   </button>
                   <button 
                       onClick={() => { toggleMenu(); onGetStarted(); }}
                       className="w-full py-4 rounded-full bg-[#9bbecb] text-white font-bold hover:bg-[#8aaab7] transition-colors shadow-xl text-lg flex items-center justify-center gap-2"
                   >
                       Join Belluh <ArrowRight size={18} />
                   </button>
               </div>
          </div>
      </div>

      {selectedRole === 'fellow' ? (
        <section className="relative z-10 pt-32 pb-32 px-6 flex-1 flex flex-col">
          <div className="max-w-3xl mx-auto w-full animate-slide-up mt-12">
              <button 
                onClick={() => setSelectedRole(null)}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-12 font-bold text-sm uppercase tracking-widest"
              >
                  <ChevronLeft size={16} /> Back to Roles
              </button>

              <div className="mb-12">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 border border-white rounded-full shadow-sm mb-6">
                      <div className="w-1.5 h-1.5 bg-[#f0addd] rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Growth, Marketing, Suggestion Maker</span>
                  </div>
                  <h1 className="text-5xl md:text-6xl font-serif font-medium leading-[1.1] mb-6 text-slate-900 tracking-tight">
                      Belluh Fellow
                  </h1>
              </div>

              <div className="prose prose-lg prose-slate max-w-none font-light leading-relaxed">
                  <p className="text-xl text-slate-700 font-medium mb-8">
                      We're building Belluh. AI that spots relationship drift 3 weeks early. We work with fun people who excel anywhere.
                  </p>

                  <p className="mb-6">
                      They reject consensus, chase non-obvious secrets, are creative, and hold a unique lens on the world. We prioritize life experience over work experience. Skills can be taught, but perspectives are difficult to shape. We want to see spikes regardless of what you do.
                  </p>

                  <p className="mb-6">
                      Examples of previously successful collaborators: Top 30 Valorant NA, U.S. Boxing Top 3, built a videogame at 12 with 350K+ players, Top 100/700K photography contest, competitive athlete, IMO gold, self-taught plumber, Ironman 70.3 finisher, florist selling 50+ flower types, philosophy blogger with 30K monthly readers, former YC founders, a Thiel fellow, a Rhodes scholar, a Schwarzman scholar, cyclist crossing continental Europe, 500+ skydives.
                  </p>

                  <p className="mb-8 font-medium text-slate-900">
                      No hard criteria. If you have spikes, you'll know.
                  </p>

                  <p className="mb-12">
                      Path to receive invitations to insane missions country-wide. Insanely different? We want to meet you.
                  </p>

                  <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">How to apply</h3>
                      <p className="text-slate-500 mb-6">Send us an email with what makes you uniquely spiked.</p>
                      <a 
                        href="mailto:elizabeth@belluh.com"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl"
                      >
                          Email elizabeth@belluh.com <ArrowRight size={16} />
                      </a>
                  </div>
              </div>
          </div>
        </section>
      ) : (
        <>
          {/* Hero Section */}
          <section className="relative z-10 pt-44 pb-20 md:pt-56 md:pb-32 px-6">
             <div className="max-w-4xl mx-auto text-center animate-slide-up">
                 
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 border border-white rounded-full shadow-sm mb-8 animate-fade-in hover:shadow-md transition-shadow cursor-default backdrop-blur-sm">
                     <div className="w-1.5 h-1.5 bg-[#f0addd] rounded-full animate-pulse"></div>
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">WE'RE HIRING</span>
                 </div>
                 
                 <h1 className="text-5xl md:text-7xl font-serif font-medium leading-[1.1] mb-8 text-slate-900 tracking-tight drop-shadow-sm">
                     <span className="text-[#9bbecb]">Build the future of</span> <br/> <span className="text-[#f0addd] italic">intimacy.</span>
                 </h1>
                 
                 <p className="text-xl md:text-2xl text-slate-500 font-light leading-relaxed max-w-2xl mx-auto mb-12">
                     Join a small, passionate team dedicated to helping couples connect deeper through thoughtful AI.
                 </p>
             </div>
          </section>

          {/* Open Roles Section */}
          <section className="relative z-10 px-6 pb-32 flex-1">
              <div className="max-w-4xl mx-auto">
                  <div className="mb-12 flex items-center gap-4">
                      <h2 className="text-3xl font-serif font-bold text-slate-900">Open Roles</h2>
                      <div className="h-px bg-slate-200 flex-1"></div>
                  </div>

                  {/* Belluh Fellow List Item */}
                  <div 
                    onClick={() => setSelectedRole('fellow')}
                    className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm hover:shadow-xl relative overflow-hidden group hover:scale-[1.01] transition-all duration-500 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-[#CDE9F2]/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                      
                      <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-[#f0addd]">
                                  <Sparkles size={14} className="fill-[#f0addd]" />
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Growth, Marketing, Suggestion Maker</span>
                          </div>
                          <h3 className="text-2xl md:text-3xl font-serif text-slate-900 tracking-tight mb-2 group-hover:text-[#9bbecb] transition-colors">
                              Belluh Fellow
                          </h3>
                          <p className="text-slate-500 font-light">We want to see spikes regardless of what you do.</p>
                      </div>

                      <div className="relative z-10 flex items-center gap-4">
                          <div className="flex gap-2">
                              <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                  <Globe size={14} /> Remote
                              </span>
                              <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                  <Zap size={14} /> Full-time
                              </span>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                              <ArrowRight size={18} />
                          </div>
                      </div>
                  </div>
              </div>
          </section>
        </>
      )}

      <footer className="relative z-10 py-10 bg-white border-t border-slate-50 mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
               <button 
                  onClick={onBack}
                  className="flex items-center gap-2 group transition-all duration-300 hover:opacity-80"
               >
                    <Sparkles size={18} className="text-[#f0addd] fill-[#f0addd]/20 transition-transform group-hover:rotate-12" />
                    <span className="font-serif font-bold text-slate-600 tracking-tight group-hover:text-slate-900 transition-colors">Belluh AI</span>
               </button>

               <div className="flex gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
                   <button onClick={() => onShowLegal('tos')} className="hover:text-slate-600 transition-colors">Terms</button>
                   <button onClick={() => onShowLegal('privacy')} className="hover:text-slate-600 transition-colors">Privacy</button>
               </div>

               <div className="text-xs text-slate-400 font-bold tracking-wide">
                   © 2026 Belluh Inc.
               </div>
          </div>
      </footer>
    </div>
  );
};

export default Careers;
