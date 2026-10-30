
import React, { useState } from 'react';
import { BookHeart, PenLine, ArrowRight, Check } from 'lucide-react';
import BelluhOrb from './BelluhOrb';

interface IntroGuideProps {
  onClose: () => void;
}

const IntroGuide: React.FC<IntroGuideProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <BookHeart size={52} strokeWidth={1.5} className="text-[#f0addd]" />,
      title: "Your story",
      desc: "Every entry, note and photo the two of you keep lives here, newest first.",
      highlight: "Home"
    },
    {
      icon: <PenLine size={52} strokeWidth={1.5} className="text-[#9bbecb]" />,
      title: "Write a few lines",
      desc: "Tap the plus to write. Keep it to yourself with Just me, or share it with your partner. A minute a day is plenty.",
      highlight: "The plus button"
    },
    {
      icon: <BelluhOrb size={76} />,
      title: "Ask Belluh",
      desc: "Ask anything from the bar on Home. Belluh plans dates, remembers the little things, and becomes anything you ask it to.",
      highlight: "Ask Belluh, on Home"
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
        
        {/* Progress */}
        <div className="flex gap-1.5 w-28 mb-10" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#9bbecb] to-[#f0addd] transition-all duration-500" style={{ width: i <= step ? '100%' : '0%' }} />
            </div>
          ))}
        </div>

        {/* Icon */}
        <div key={step} className="h-24 flex items-center justify-center mb-6 animate-scale-in">
           {steps[step].icon}
        </div>

        {/* Content */}
        <h2 className="text-3xl font-serif font-bold text-slate-900 mb-4 tracking-tight leading-tight">
          {steps[step].title}
        </h2>
        <p className="text-lg text-slate-500 leading-relaxed font-medium mb-2">
          {steps[step].desc}
        </p>
        
        <p className="text-[13px] font-semibold text-[#f0addd] mb-10 mt-auto">
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
