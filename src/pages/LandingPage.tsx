

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Activity, TrendingUp, Lock, Fingerprint, Menu, X, Heart } from 'lucide-react';
import { ORGANIZATIONS } from '../constants';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onShowLegal: (type: 'tos' | 'privacy') => void;
  onGoToAbout: () => void;
}

const LogoItem = ({ org }: { org: typeof ORGANIZATIONS[0] }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <span className="text-sm font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap px-4 font-sans opacity-60 hover:opacity-100 transition-opacity">
        {org.name}
      </span>
    );
  }

  return (
    <img 
      src={org.logo || `https://logo.clearbit.com/${org.domain}`} 
      alt={org.name} 
      onError={(e) => {
          const target = e.currentTarget;
          // Try clearbit if custom logo failed
          if (org.logo && !target.src.includes('clearbit')) {
             target.src = `https://logo.clearbit.com/${org.domain}`;
          } else {
             setError(true);
          }
      }}
      className="max-h-12 max-w-full w-auto opacity-40 hover:opacity-100 hover:scale-110 transition-all duration-500 grayscale hover:grayscale-0 object-contain" 
    />
  );
};

const LogoMarquee = () => (
  <div className="w-full py-20 overflow-hidden relative z-20 bg-[#F8FDFF]/80 backdrop-blur-md border-y border-[#CDE9F2]">
    <div className="text-center mb-10 px-4">
      <span className="text-[10px] md:text-xs font-bold text-slate-400 tracking-[0.2em] md:tracking-[0.3em] uppercase md:border-b md:border-[#CDE9F2] md:pb-3">
        Used independently by couples at selective companies and schools
      </span>
    </div>
    
    <div className="relative flex overflow-hidden group">
      <div className="absolute inset-y-0 left-0 w-24 md:w-32 bg-gradient-to-r from-[#F8FDFF] z-10" />
      <div className="absolute inset-y-0 right-0 w-24 md:w-32 bg-gradient-to-l from-[#F8FDFF] z-10" />
      <div className="flex animate-marquee items-center w-max group-hover:[animation-play-state:paused]">
        {[...ORGANIZATIONS, ...ORGANIZATIONS].map((org, i) => (
          <div key={i} className="mx-8 md:mx-12 shrink-0 flex items-center justify-center h-16 w-32">
             <LogoItem org={org} />
          </div>
        ))}
      </div>
    </div>

    <div className="text-center mt-8">
      <span className="text-[10px] text-slate-300 font-medium tracking-wide uppercase">
        * Not affiliated with or endorsed by these organizations
      </span>
    </div>
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onShowLegal, onGoToAbout }) => {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  // Lock body scroll when menu is open
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

  const scrollToSection = (id: string) => {
      setIsMenuOpen(false);
      const element = document.getElementById(id);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
      }
  };

  const menuItems = [
      { label: 'Features', action: () => scrollToSection('features') },
      { label: 'Privacy', action: () => { toggleMenu(); onShowLegal('privacy'); } },
      { label: 'Stories', action: () => scrollToSection('stories') },
      { label: 'Our Why', action: () => { toggleMenu(); onGoToAbout(); } }
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 font-sans selection:bg-[#f0addd] selection:text-white overflow-x-hidden relative">
      
      {/* --- Ambient Cloud Background Layers --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#CDE9F2]/30 rounded-full blur-[120px] animate-float opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#f0addd]/20 rounded-full blur-[130px] animate-pulse-slow opacity-50"></div>
          <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-white rounded-full blur-[80px] animate-breathing opacity-80 mix-blend-overlay"></div>
      </div>

      {/* Floating Pill Navbar - Scroll Aware */}
      <div className={`fixed top-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-2xl z-50 transition-all duration-500 transform ${isNavVisible ? 'translate-y-0 opacity-100' : '-translate-y-[150%] opacity-0'}`}>
        <nav className="bg-white/80 backdrop-blur-xl rounded-full shadow-lg shadow-slate-200/50 border border-white px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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

      {/* Full Screen Menu Overlay - Clean Design */}
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

      {/* Hero Section */}
      <section className="relative z-10 pt-44 pb-20 md:pt-56 md:pb-32 px-6">
         <div className="max-w-4xl mx-auto text-center animate-slide-up">
             
             <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 border border-white rounded-full shadow-sm mb-8 animate-fade-in hover:shadow-md transition-shadow cursor-default backdrop-blur-sm">
                 <div className="w-1.5 h-1.5 bg-[#f0addd] rounded-full animate-pulse"></div>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">The World's First Intelligent Love Journal</span>
             </div>
             
             <h1 className="text-5xl md:text-7xl font-serif font-medium leading-[1.1] mb-8 text-slate-900 tracking-tight drop-shadow-sm">
                 <span className="text-[#f0addd]">Love,</span> <span className="italic font-serif text-[#9bbecb]">understood.</span>
             </h1>
             
             <p className="text-xl md:text-2xl text-slate-500 font-light leading-relaxed max-w-2xl mx-auto mb-12">
                 Capture memories, track emotional patterns, and deepen intimacy with the world's first AI relationship companion.
             </p>

             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <button 
                    onClick={onGetStarted}
                    className="w-full sm:w-auto px-10 py-4 bg-[#f0addd] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#e57ec3] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#f0addd]/30"
                 >
                     <span>Start Your Journey</span>
                     <ArrowRight size={16} />
                 </button>
                 <button 
                    onClick={onLogin}
                    className="w-full sm:w-auto px-10 py-4 bg-white/80 backdrop-blur-sm text-slate-600 border border-white rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-white hover:text-[#f0addd] hover:shadow-lg transition-all"
                 >
                     I have an account
                 </button>
             </div>
         </div>
      </section>

      {/* Marquee Section */}
      <LogoMarquee />

      {/* Visual Demo Section */}
      <section className="relative z-10 px-6 pb-24 pt-32">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                   <h2 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 mb-6 tracking-tighter">
                      Intelligence, applied to intimacy.
                   </h2>
                   <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-light">
                      Belluh turns thousands of small moments into a cohesive understanding of your shared life.
                   </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[600px]">
                  
                  {/* Card 1: The AI Analysis */}
                  <div className="md:col-span-8 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] flex flex-col justify-between relative overflow-hidden group hover:scale-[1.005] transition-all duration-700 min-h-[400px]">
                      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#CDE9F2]/30 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
                      
                      <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-8">
                              <div className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm text-[#f0addd]">
                                  <Sparkles size={18} className="fill-[#f0addd]" />
                              </div>
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Weekly Insight</span>
                          </div>

                          <h3 className="text-3xl md:text-5xl font-serif text-slate-900 leading-[1.15] mb-6 tracking-tight">
                              "You navigate conflict with silence. But this week, you chose <span className="text-[#f0addd] underline decoration-[#f0addd]/30 underline-offset-4 decoration-4">words</span>."
                          </h3>
                          
                          <p className="text-lg text-slate-500 leading-relaxed max-w-2xl font-light">
                              Belluh detected a shift in your communication pattern on Tuesday. By expressing fear instead of withdrawing, your connection synergy increased by 40%.
                          </p>
                      </div>

                      <div className="relative z-10 mt-12 md:mt-0 flex flex-col md:flex-row md:items-center gap-6">
                          <button className="px-8 py-4 bg-slate-50 hover:bg-slate-100 rounded-full text-sm font-bold text-slate-900 transition-colors flex items-center justify-center gap-2 border border-slate-100">
                              View Analysis <ArrowRight size={16} />
                          </button>
                          <div className="flex items-center gap-2 text-slate-400">
                              <Activity size={16} className="text-[#CDE9F2]" />
                              <span className="text-xs font-medium">Generated from 14 entries</span>
                          </div>
                      </div>
                  </div>

                  {/* Right Column Stack */}
                  <div className="md:col-span-4 flex flex-col gap-6">
                      
                      {/* Card 2: The Metric */}
                      <div className="flex-1 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] flex flex-col justify-between relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500 min-h-[250px]">
                          
                          <div className="relative z-10 flex justify-between items-start">
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Synergy Score</span>
                              <div className="px-3 py-1 bg-[#f0addd]/10 text-[#c06ba5] rounded-full text-[10px] font-bold flex items-center gap-1">
                                  <TrendingUp size={12} /> +12%
                              </div>
                          </div>

                          <div className="relative z-10 flex items-end gap-2 h-24 mb-2 mt-4">
                              {[20, 45, 30, 60, 45, 80, 70, 50, 90, 85].map((h, i) => (
                                  <div 
                                    key={i} 
                                    className={`flex-1 rounded-t-sm transition-all duration-700 hover:opacity-100 ${i % 2 === 0 ? 'bg-[#CDE9F2]' : 'bg-[#f0addd]'}`} 
                                    style={{ height: `${h}%`, opacity: 0.6 + (i/20) }}
                                  ></div>
                              ))}
                          </div>

                          <div className="relative z-10">
                              <div className="text-6xl font-sans font-semibold tracking-tighter text-slate-900">94</div>
                              <p className="text-sm text-slate-500 mt-1 font-medium">Exceptional Harmony</p>
                          </div>
                      </div>

                  </div>
              </div>
          </div>
      </section>

      {/* Visual Demo Section - Apple Style Immersive Cards */}
      <section id="features" className="relative z-10 py-32 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto space-y-32">
            
            {/* Feature 1: Intelligence - The "Hero" Feature */}
            <div className="group relative bg-white rounded-[3rem] p-8 md:p-20 shadow-2xl shadow-slate-200/50 border border-white overflow-hidden transition-transform duration-700 hover:scale-[1.01]">
                {/* Subtle Theme Glow */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-[#f0addd]/20 to-transparent rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                
                <div className="relative z-10 md:w-2/3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full mb-8">
                         <Sparkles size={14} className="text-[#f0addd]" />
                         <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Pattern Recognition</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-serif font-semibold tracking-tighter text-slate-900 mb-6">
                        It sees what <br/> <span className="text-[#9bbecb]">you might miss.</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-slate-500 leading-relaxed font-light max-w-lg">
                        Emotional velocity. Connection cadence. Belluh analyzes the unspoken rhythm of your relationship.
                    </p>
                </div>
                
                {/* Visual: Simulated Interface */}
                <div className="mt-16 md:absolute md:top-1/2 md:right-20 md:-translate-y-1/2 md:w-96">
                     <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-apple transform rotate-3 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-105">
                          <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 rounded-full bg-[#f0addd] flex items-center justify-center text-white"><Sparkles size={14}/></div>
                              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Insight Detected</div>
                          </div>
                          <p className="font-serif text-lg leading-relaxed text-slate-800">
                              "You withdraw when stressed, but your partner responds best to shared quiet time. Try sitting together in silence."
                          </p>
                     </div>
                </div>
            </div>

            {/* Feature 2: Privacy - Light Blue Cloud Theme */}
            <div className="group relative bg-[#CDE9F2] rounded-[3rem] p-8 md:p-20 shadow-2xl overflow-hidden text-slate-900 transition-transform duration-700 hover:scale-[1.01]">
                 {/* Cloud Animations - Background */}
                 <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-white/40 rounded-full blur-[80px] pointer-events-none animate-float"></div>
                 <div className="absolute bottom-[-10%] left-[-20%] w-[500px] h-[500px] bg-white/30 rounded-full blur-[60px] pointer-events-none animate-pulse-slow"></div>

                 <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 md:gap-24">
                     <div className="flex-1 text-center md:text-left">
                         <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full mb-8 border border-white/40 shadow-sm">
                             <Lock size={14} className="text-cyan-700" />
                             <span className="text-xs font-bold uppercase tracking-widest text-cyan-900">Private Vault</span>
                         </div>
                         <h2 className="text-5xl md:text-7xl font-serif font-semibold tracking-tighter text-cyan-950 mb-6">
                             Your safe <br/> <span className="text-cyan-700">haven.</span>
                         </h2>
                         <p className="text-xl md:text-2xl text-cyan-900/80 leading-relaxed font-light">
                             AES-256 encryption. Zero knowledge architecture. What happens in Belluh, stays in Belluh.
                         </p>
                     </div>
                     
                     <div className="relative w-80 h-80 flex items-center justify-center">
                          <div className="relative animate-float">
                                {/* Glow */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/50 blur-[70px] rounded-full"></div>
                                
                                {/* Cloud Body */}
                                <div className="relative z-10 filter drop-shadow-[0_15px_35px_rgba(50,120,160,0.15)]">
                                    <div className="relative w-72 h-56">
                                        {/* Layer 1: Base Puffs */}
                                        <div className="absolute bottom-0 left-4 w-32 h-32 bg-white rounded-full"></div>
                                        <div className="absolute bottom-2 right-4 w-36 h-36 bg-white rounded-full"></div>
                                        
                                        {/* Layer 2: Top Puffs */}
                                        <div className="absolute bottom-12 left-16 w-40 h-40 bg-white rounded-full"></div>
                                        <div className="absolute bottom-8 right-24 w-28 h-28 bg-white rounded-full"></div>

                                        {/* Layer 3: Soften Edges */}
                                        <div className="absolute bottom-4 left-10 w-52 h-20 bg-white blur-lg rounded-full"></div>
                                    </div>
                                </div>
                                
                                {/* Aesthetic Sparkles */}
                                <Sparkles className="absolute -top-4 right-10 text-white w-8 h-8 animate-pulse fill-white/60 drop-shadow-sm" />
                                <Sparkles className="absolute bottom-10 -left-6 text-white w-5 h-5 animate-pulse delay-700 fill-white/60 drop-shadow-sm" />
                          </div>
                     </div>
                 </div>
            </div>

            {/* Feature 3: Adaptive Persona */}
            <div className="w-full">
                 {/* Card A: Adaptation */}
                 <div className="bg-[#fcfcfc] rounded-[3rem] p-10 md:p-16 border border-slate-100 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#f0addd]/20 to-transparent rounded-bl-full opacity-0 transition-opacity group-hover:opacity-100 duration-700"></div>
                      
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-8 border border-slate-100 shadow-sm">
                          <Fingerprint size={24} className="text-slate-900"/>
                      </div>
                      
                      <h3 className="text-3xl md:text-4xl font-serif font-semibold text-slate-900 mb-4 tracking-tight">It learns you.</h3>
                      <p className="text-lg text-slate-500 leading-relaxed mb-8">
                          From "Hemingway" brevity to "Woolf" introspection. The AI adapts its voice to match yours.
                      </p>
                      
                      <div className="flex gap-2 flex-wrap">
                          <span className="px-4 py-2 bg-white border border-slate-100 rounded-full text-xs font-bold text-slate-500 shadow-sm">Kafka Mode</span>
                          <span className="px-4 py-2 bg-white border border-slate-100 rounded-full text-xs font-bold text-slate-500 shadow-sm">Fitzgerald Mode</span>
                      </div>
                 </div>
            </div>

        </div>
      </section>

      {/* Infinite Marquee Section */}
      <section id="stories" className="relative z-10 py-24 overflow-hidden bg-white/50 backdrop-blur-sm border-t border-slate-50">
        <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
            <h2 className="text-4xl md:text-6xl font-serif font-semibold text-slate-900 mb-6 tracking-tighter">Every moment counts.</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
                From the big milestones to the quiet Sunday mornings, Belluh keeps your story alive.
            </p>
        </div>
        
        <div className="relative w-full overflow-hidden mask-gradient-x py-4">
             <div className="flex gap-8 animate-marquee whitespace-nowrap mb-8">
                 {[1,2,3,4,5,1,2,3,4,5].map((i, idx) => (
                     <div key={idx} className="w-[340px] h-[220px] bg-[#f7d8ee] rounded-3xl border border-black/5 flex-shrink-0 p-8 flex flex-col justify-between hover:scale-[1.02] transition-all cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] group">
                         <div className="flex justify-between items-start">
                             <span className="text-5xl opacity-40 text-white font-serif leading-none">❝</span>
                         </div>
                         <p className="font-serif text-[#5e1c43] text-lg leading-relaxed whitespace-normal line-clamp-3 group-hover:text-black transition-colors">
                             {i === 1 ? "The way you look at me when I'm cooking... it felt like home." : 
                              i === 2 ? "I never want to forget the sound of your laugh in the rain." :
                              i === 3 ? "Found that old ticket stub from our first date." :
                              i === 4 ? "Just a quiet morning with coffee and you. Perfect." :
                              "We stayed up way too late talking about the future."}
                         </p>
                         <div className="flex items-center gap-2 pt-4 border-t border-black/5">
                             <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                             <div className="text-[10px] font-bold uppercase text-[#831843] tracking-widest">Entry #{100 + idx}</div>
                         </div>
                     </div>
                 ))}
             </div>
        </div>
      </section>
      
      <section className="relative z-10 py-24 px-6 text-center">
          <div className="max-w-3xl mx-auto">
              <div className="w-16 h-16 bg-[#f0addd]/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse-slow">
                  <Heart size={24} className="text-[#f0addd] fill-[#f0addd]" />
              </div>
              <blockquote className="text-3xl md:text-5xl font-serif text-slate-900 leading-tight mb-10 drop-shadow-sm">
                  "It feels like a therapist and a best friend combined. It saved our communication."
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full overflow-hidden shadow-md border border-white">
                      <img 
                        src="https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=100&q=80" 
                        alt="Sarah & Tom" 
                        className="w-full h-full object-cover"
                      />
                  </div>
                  <div className="text-left">
                      <div className="text-sm font-bold text-slate-900">Sarah & Tom</div>
                      <div className="text-[10px] text-[#f0addd] font-bold uppercase tracking-widest">Early Adopters</div>
                  </div>
              </div>
          </div>
      </section>

      <footer className="relative z-10 py-10 bg-white border-t border-slate-50">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
               <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
      
      <style>{`
        .mask-gradient-x {
            mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
        }
        .animate-marquee {
            animation: marquee 40s linear infinite;
        }
        .animate-marquee-reverse {
            animation: marquee-reverse 40s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;