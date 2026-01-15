
import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface AboutProps {
  onBack: () => void;
  onGetStarted: () => void;
  onLogin: () => void;
}

// Internal Component for Scroll Reveal Animations
const TextReveal: React.FC<{ children: ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Only animate once
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div 
            ref={ref} 
            className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

const About: React.FC<AboutProps> = ({ onBack, onGetStarted, onLogin }) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    document.body.style.overflow = 'unset';

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = docHeight > 0 ? scrollTop / docHeight : 0;
      setScrollProgress(Math.min(Math.max(scroll, 0), 1));
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans selection:bg-[#CDE9F2] selection:text-[#0f172a] animate-fade-in">
       
       {/* Reading Progress Bar */}
       <div className="fixed top-0 left-0 h-1 bg-[#1a1a1a] z-[60] transition-all duration-100 ease-out opacity-10" style={{ width: `${scrollProgress * 100}%` }}></div>

       {/* Navigation */}
       <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl transition-all border-b border-transparent">
          <div className="max-w-screen-xl mx-auto px-6 h-20 flex items-center justify-between">
             <button 
                onClick={onBack} 
                className="group flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors"
             >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium text-sm tracking-wide">Back to Belluh</span>
             </button>
             
             {/* Fade-in Title on Scroll */}
             <div 
                className="font-sans font-bold text-sm tracking-tight text-slate-900 opacity-0 transition-opacity duration-500" 
                style={{ opacity: scrollProgress > 0.05 ? 1 : 0 }}
             >
                The Supermarket Moment
             </div>
             
             <button 
                onClick={onGetStarted}
                className="hidden md:flex bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-bold items-center gap-2 hover:bg-black transition-all hover:scale-105 active:scale-95"
                style={{ opacity: scrollProgress > 0.1 ? 1 : 0, transition: 'opacity 0.3s' }}
             >
                 Begin <ArrowRight size={12} />
             </button>
             <div className="md:hidden w-10"></div>
          </div>
       </header>

       <main className="pt-32 pb-40 px-6 md:px-12">
          {/* Hero Section */}
          <div className="max-w-3xl mx-auto mb-16 md:mb-20">
              <div className="flex items-center gap-3 mb-8 animate-slide-up">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]"></div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Founding Story</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter leading-[1.05] mb-8 text-[#1a1a1a] animate-slide-up" style={{ animationDelay: '0.1s' }}>
                The Supermarket Moment.
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 font-normal leading-relaxed max-w-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
                Why we are building tools for remembrance in an age of perfect documentation.
              </p>
          </div>

          {/* Visual Anchor - Parallax Effect */}
          <div className="max-w-4xl mx-auto mb-24 md:mb-32 overflow-hidden rounded-[2px] animate-fade-in" style={{ animationDelay: '0.4s' }}>
             <div className="aspect-[21/9] w-full overflow-hidden">
                 <img 
                    src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=2000&auto=format&fit=crop" 
                    alt="Abstract blurred motion in a supermarket" 
                    className="w-full h-full object-cover grayscale contrast-[1.2] opacity-90 scale-105 transition-transform duration-[2s] hover:scale-110"
                    style={{ transform: `scale(${1 + scrollProgress * 0.1})` }}
                 />
             </div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 text-center">Acme Market, C. 2025</p>
          </div>

          {/* Article Content */}
          <article className="max-w-2xl mx-auto font-serif text-[1.125rem] md:text-[1.25rem] leading-[2] text-[#2d2d2d] space-y-8">
             <TextReveal>
                 <p className="text-[#1a1a1a]">
                    <span className="float-left text-[4.5rem] leading-[0.8] font-bold mr-3 mt-2 font-sans text-slate-900 tracking-tighter">E</span>
                    ven before checkout at Acme, we had already exchanged what felt like 10,000 words. Our gaze locked. Brief glances. Obvious, eluding. Like children sneaking chocolate. Aisle after aisle, our eyes locked onto another. Almost touching.
                 </p>
             </TextReveal>

             <TextReveal delay={100}>
                <p>My hand brushed the label on my newly weighed shrimp. The chill from the ice lingering on my fingertips. Paired with a droning hum of the central AC mixed with the faint squeak of a cart the aisle beside us.</p>
             </TextReveal>

             <TextReveal delay={100}>
                <p>We pretended to study the same objects. Shoulder to shoulder. Stealing glances at each other's faces.</p>
             </TextReveal>

             <TextReveal>
                <p>Eventually I told her I wanted to make shrimp scampi. Her questions were curious, careful. She cared. She listened. One question stayed with me. I could not answer it until 2 a.m., lying awake, under the silence of my room, the weight of the night pressing in.</p>
             </TextReveal>

             {/* Quote Update - High Impact */}
             <TextReveal>
                 <div className="my-20 relative group cursor-default pl-8 border-l-2 border-[#1a1a1a]">
                    <p className="text-3xl md:text-5xl font-sans font-medium leading-[1.15] text-[#1a1a1a] tracking-tight mb-4">
                        "If you could only pick one: perfection or someone to share it with?"
                    </p>
                 </div>
             </TextReveal>

             <TextReveal>
                <p>I realized I need someone to share it with.</p>
             </TextReveal>

             <TextReveal>
                <p>Her navy cardigan caught the wind. Her red handbag swung like a pendulum, hope and fear, forward and back. Somewhere, a cart wheel squeaked. The world narrowed between us. Fifty seconds stretched like years. A block and a half down usually takes four minutes. With her, it felt like nothing.</p>
             </TextReveal>

             <TextReveal>
                <p>Before Gutmann she turned one last time. I counted thirteen. The final smile carried hope and sorrow. I knew it would stay with me. It said what words could not. The faint trace of her perfume lingered in the air long after she walked away.</p>
             </TextReveal>

             <div className="h-px w-full bg-slate-100 my-16"></div>

             <TextReveal>
                <h3 className="font-sans font-bold text-2xl mb-6 text-[#1a1a1a] tracking-tight">The Realization</h3>
             </TextReveal>

             <TextReveal>
                <p>I couldn't sleep that night. I keep coming back to that question. "If you could only pick one: perfection or someone to share it with?"</p>
             </TextReveal>

             <TextReveal>
                 <p>And I'm lying there in the dark thinking. What if I've been wrong about everything? What if all this time, building something perfect, alone in my room, iterating endlessly, chasing some impossible standard. What if that was just another way of being alone?</p>
             </TextReveal>

             <TextReveal>
                 <p>I'd convinced myself that solitude was ambition. That if I could just build the right thing, create the right product, then it wouldn't matter that I was alone. Then maybe I'd be enough.</p>
             </TextReveal>

             <TextReveal>
                <p className="font-medium text-[#1a1a1a]">But the moment I saw her, everything broke. And it was the best thing that ever happened to me.</p>
             </TextReveal>

             <TextReveal>
                <p>I started thinking: Love isn't always built in the big moments. We often mistake it for the proposal, the first kiss. But it's not. It's built in the supermarket. It's built in how someone listens when you talk about shrimp. It's built in a question asked at 2 a.m. that you can't stop thinking about.</p>
             </TextReveal>

             <TextReveal>
                <p>Most of us have lived this moment. Not in a supermarket necessarily. Maybe at a coffee shop, or on a walk where you lost track of time, or just in a conversation that felt like it made time slow down. That moment when she did something intentionally or unintentionally melting your heart in the process.</p>
             </TextReveal>

             <TextReveal>
                 <h3 className="font-sans font-bold text-2xl mt-16 mb-6 text-[#1a1a1a] tracking-tight">The Problem with Tools</h3>
             </TextReveal>

             <TextReveal>
                 <p>We have tools for everything. We have photos. Calendars. Voice memos. Videos. A thousand different ways to capture the surface of our lives. You can pull up your phone right now and see what you did a year ago. But try to remember why it mattered. Try to remember the feeling. Try to access the moment when you looked at someone and thought, <span className="italic">"This person. This one. Out of everyone in the world, this person."</span></p>
             </TextReveal>

             <TextReveal>
                <p>We can't. <span className="underline decoration-[#CDE9F2] decoration-4 underline-offset-4 decoration-skip-ink">We've built a world of perfect documentation and zero remembrance.</span></p>
             </TextReveal>

             <TextReveal>
                 <p>So what happens? You lose it. Slowly. Unknowingly. And then one day you're sitting across from the person you chose, and you're not sure why anymore. You're not sure who they are. You're not sure who they are. You're not sure why you said yes.</p>
             </TextReveal>

             <TextReveal>
                <p>You become strangers. And you call it life.</p>
             </TextReveal>

             <div className="h-px w-full bg-slate-100 my-16"></div>

             <TextReveal>
                <h3 className="font-sans font-bold text-2xl mb-6 text-[#1a1a1a] tracking-tight">Why Belluh?</h3>
             </TextReveal>

             <TextReveal>
                <p>I didn't set out to build an AI love journal. I don't wake up thinking about journals.</p>
             </TextReveal>

             <TextReveal>
                <p>But that night, after she left, after I couldn't sleep, after I couldn't stop thinking about that question. I understood something.</p>
             </TextReveal>

             <TextReveal>
                <p>You don't need AI to fall in love. People have been falling in love forever, without any help. It's the most natural thing we do. You are built for it.</p>
             </TextReveal>

             <TextReveal>
                <p>Yet you have nothing helping you capture the bits & pieces in your relationship.</p>
             </TextReveal>
             
             <TextReveal>
                <p>Not just the Instagram highlights but also the supermarket moments.</p>
             </TextReveal>

             <TextReveal>
                <p>And then, when you need it. When you are at your next anniversary. When doubt creeps in, when you've forgotten, when you're tired and wondering if this is worth it. You can return to those moments. You can read them. You can feel them again. You can remember.</p>
             </TextReveal>

             <TextReveal>
                <p>That's why I'm building this.</p>
             </TextReveal>

             <TextReveal>
                 <div className="mt-24 p-10 bg-slate-50 border-t border-slate-100">
                     <p className="font-sans text-xl md:text-3xl font-medium text-[#1a1a1a] mb-6 tracking-tight leading-tight">
                         "Love and remembrance really go hand in hand."
                     </p>
                     <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-serif font-bold italic text-sm">B</div>
                         <div className="text-xs font-sans text-slate-500 font-bold uppercase tracking-widest">
                             The Belluh Philosophy
                         </div>
                     </div>
                 </div>
             </TextReveal>

             <TextReveal>
                 <div className="mt-16 text-center opacity-80">
                    <p className="font-serif text-lg italic text-slate-600 mb-2">"I recognize only one duty, and that is to love"</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">— Albert Camus</p>
                 </div>
             </TextReveal>

             {/* Conversion CTA */}
             <TextReveal>
                 <div className="mt-24 flex flex-col items-center justify-center space-y-6">
                     <div className="w-px h-16 bg-slate-200"></div>
                     <button 
                        onClick={onGetStarted}
                        className="group relative px-10 py-5 bg-[#1a1a1a] text-white rounded-full font-sans font-bold text-lg tracking-wide hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-2xl overflow-hidden"
                     >
                         <span className="relative z-10 flex items-center gap-3">
                             Begin Your Story <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                         </span>
                         <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                     </button>
                     <div className="flex items-center gap-1 text-sm text-slate-400 font-medium">
                         <span>Already joined?</span>
                         <button onClick={onLogin} className="hover:text-slate-900 transition-colors underline decoration-slate-300 underline-offset-4">Sign in</button>
                     </div>
                 </div>
             </TextReveal>
          </article>
       </main>
    </div>
  );
};

export default About;
