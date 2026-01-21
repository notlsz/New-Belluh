
import React, { useState } from 'react';
import { BookHeart, Plus, Sparkles, ArrowRight, Check } from 'lucide-react';

interface IntroGuideProps {
  onClose: () => void;
}

const IntroGuide: React.FC<IntroGuideProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <BookHeart size={48} className="text-[#f0addd]" />,
      title: "Your Timeline",
      desc: "This is your story. Every memory, note, and photo lives here forever. Scroll up to see your history.",
      highlight: "Bottom Left Tab"
    },
    {
      icon: <Plus size={48} className="text-white" />,
      bg: "bg-slate-900",
      title: "Capture Moments",
      desc: "Tap the big plus button to save a memory. Aim for one a day. It takes 30 seconds.",
      highlight: "Center Button"
    },
    {
      icon: <Sparkles size={48} className="text-belluh-500" />,
      title: "Meet Belluh",
      desc: "Your AI relationship coach. Ask it anything like 'How are we doing?' or 'Find that restaurant we loved'.",
      highlight: "Bottom Right Tab"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center animate-scale-in">
        
        {/* Progress Dots */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-slate-900 w-6' : 'bg-slate-200'}`} />
          ))}
        </div>

        {/* Icon */}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-xl transition-all duration-500 ${steps[step].bg || 'bg-slate-50'}`}>
           {steps[step].icon}
        </div>

        {/* Content */}
        <h2 className="text-3xl font-serif font-bold text-slate-900 mb-4 tracking-tight leading-tight">
          {steps[step].title}
        </h2>
        <p className="text-lg text-slate-500 leading-relaxed font-medium mb-2">
          {steps[step].desc}
        </p>
        
        <p className="text-xs font-bold uppercase tracking-widest text-[#f0addd] mb-10 mt-auto">
            {steps[step].highlight}
        </p>

        {/* Button */}
        <button 
          onClick={handleNext}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
        >
          {step === steps.length - 1 ? (
            <><span>Let's Go</span> <Check size={18} /></>
          ) : (
            <><span>Next</span> <ArrowRight size={18} /></>
          )}
        </button>

      </div>
    </div>
  );
};

export default IntroGuide;
