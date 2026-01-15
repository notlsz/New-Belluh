import React, { useState, useEffect } from 'react';
import { X, Play, Mail, Sparkles, Lock } from 'lucide-react';
import { JournalEntry } from '../types';
import { generateFutureLetter } from '../services/geminiService';

interface ArtifactModalProps {
  type: 'reel' | 'letter';
  onClose: () => void;
  entries: JournalEntry[];
  currentUserId: string;
  userName: string;
  partnerName: string;
}

const ArtifactModal: React.FC<ArtifactModalProps> = ({ type, onClose, entries, currentUserId, userName, partnerName }) => {
  // Reel State
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // Letter State
  const [letterContent, setLetterContent] = useState<string | null>(null);
  const [isLoadingLetter, setIsLoadingLetter] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Filter entries for the Reel (Entries with media or significant text)
  const reelEntries = entries.filter(e => e.mediaUrl || e.content.length > 50).slice(0, 10);
  const currentEntry = reelEntries[currentReelIndex];

  // Letter Generation & Loading Animation
  useEffect(() => {
    if (type === 'letter' && !letterContent) {
        setIsLoadingLetter(true);
        
        // Simulate sophisticated loading steps
        const steps = setInterval(() => {
            setLoadingStep(prev => (prev < 4 ? prev + 1 : prev));
        }, 1500);

        generateFutureLetter(entries, userName, partnerName).then(text => {
            setLetterContent(text);
            setIsLoadingLetter(false);
            clearInterval(steps);
        });
        
        return () => clearInterval(steps);
    }
  }, [type, entries, partnerName, userName, letterContent]);

  // Reel Auto-Advance
  useEffect(() => {
      if (type !== 'reel' || !isPlaying) return;
      
      const interval = setInterval(() => {
          setProgress(prev => {
              if (prev >= 100) {
                  if (currentReelIndex < reelEntries.length - 1) {
                      setCurrentReelIndex(curr => curr + 1);
                      return 0;
                  } else {
                      setIsPlaying(false);
                      return 100;
                  }
              }
              return prev + 1; // 100 steps * 50ms = 5000ms duration
          });
      }, 50);

      return () => clearInterval(interval);
  }, [type, isPlaying, currentReelIndex, reelEntries.length]);

  const handleNextReel = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (currentReelIndex < reelEntries.length - 1) {
          setCurrentReelIndex(prev => prev + 1);
          setProgress(0);
      } else {
          onClose();
      }
  };

  const handlePrevReel = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (currentReelIndex > 0) {
          setCurrentReelIndex(prev => prev - 1);
          setProgress(0);
      }
  };

  // Dynamic Date 5 years in future
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 5);
  const displayDate = futureDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in" onClick={onClose}>
      <div 
        className={`bg-white md:rounded-[2rem] w-full max-w-3xl shadow-2xl relative overflow-hidden flex flex-col transition-all duration-700 ${type === 'reel' ? 'h-full md:h-[90vh] md:aspect-[9/16] bg-[#CDE9F2]' : 'h-full md:h-[85vh]'}`} 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className={`absolute top-6 right-6 z-50 p-2 rounded-full transition-colors ${type === 'reel' ? 'bg-white/40 hover:bg-white text-slate-900 backdrop-blur-md shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100'}`}>
            <X size={20} />
        </button>

        {type === 'reel' ? (
            // Chapter Reel UI - Light Theme #CDE9F2
            <div className="relative w-full h-full flex flex-col bg-[#CDE9F2] group" onClick={() => setIsPlaying(!isPlaying)}>
                {/* Progress Bars */}
                <div className="absolute top-4 left-4 right-4 z-40 flex gap-1.5 h-1">
                    {reelEntries.map((_, idx) => (
                        <div key={idx} className="flex-1 bg-white/50 rounded-full overflow-hidden h-full">
                            <div 
                                className="h-full bg-[#f0addd] transition-all duration-75 ease-linear"
                                style={{ 
                                    width: idx < currentReelIndex ? '100%' : idx === currentReelIndex ? `${progress}%` : '0%' 
                                }}
                            ></div>
                        </div>
                    ))}
                </div>

                {/* Navigation Overlay */}
                <div className="absolute inset-0 z-30 flex">
                    <div className="w-1/3 h-full cursor-pointer" onClick={handlePrevReel}></div>
                    <div className="w-1/3 h-full cursor-pointer flex items-center justify-center">
                        {!isPlaying && <div className="bg-white/80 p-5 rounded-full backdrop-blur-md animate-scale-in shadow-xl"><Play size={24} className="fill-slate-900 text-slate-900 ml-1"/></div>}
                    </div>
                    <div className="w-1/3 h-full cursor-pointer" onClick={handleNextReel}></div>
                </div>

                {currentEntry ? (
                    <>
                        {/* Background Media */}
                        {currentEntry.mediaUrl ? (
                            <div className="absolute inset-0 bg-[#CDE9F2]">
                                <img 
                                    src={currentEntry.mediaUrl} 
                                    className="absolute inset-0 w-full h-full object-cover animate-fade-in opacity-90"
                                    alt="Memory"
                                />
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#CDE9F2] to-[#e0f7fa] animate-fade-in">
                                <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/40 rounded-full blur-[100px]"></div>
                            </div>
                        )}
                        
                        {/* Gradient Overlay - Light Fade */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90 pointer-events-none"></div>

                        {/* Content */}
                        <div className="absolute top-12 left-6 z-20 flex items-center gap-3">
                             <img src={currentEntry.authorAvatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100" alt={currentEntry.authorName} />
                             <div>
                                 <p className={`text-sm font-bold shadow-sm ${currentEntry.mediaUrl ? 'text-white drop-shadow-md' : 'text-slate-900'}`}>{currentEntry.authorName}</p>
                                 <p className={`text-[10px] font-bold uppercase tracking-widest ${currentEntry.mediaUrl ? 'text-white/90 drop-shadow-md' : 'text-slate-500'}`}>{currentEntry.timestamp.toLocaleDateString()}</p>
                             </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 z-20">
                            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-white/80 backdrop-blur-md rounded-full border border-white shadow-sm">
                                <Sparkles size={10} className="text-[#f0addd]" />
                                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Memory Highlight</span>
                            </div>
                            <h2 className="text-2xl font-serif text-slate-900 leading-relaxed drop-shadow-sm">
                                "{currentEntry.content}"
                            </h2>
                            {currentEntry.prompt && (
                                <p className="text-slate-600 text-sm mt-4 font-medium border-l-2 border-[#f0addd] pl-3">
                                    {currentEntry.prompt}
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                     <div className="flex items-center justify-center h-full text-slate-500">
                         <p>No highlights available yet.</p>
                     </div>
                )}
            </div>
        ) : (
            // Future Letter UI - Clean, OpenAI-inspired, Serif
            <div className="flex flex-col h-full bg-white text-slate-900 relative">
                
                {isLoadingLetter ? (
                     <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                         <div className="w-16 h-16 mb-8 relative flex items-center justify-center">
                             <div className="absolute inset-0 bg-[#f0addd] rounded-full animate-ping opacity-20"></div>
                             <div className="relative z-10 w-12 h-12 bg-black rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                             </div>
                         </div>
                         <div className="space-y-4">
                             <p className="font-serif text-sm text-slate-900 font-semibold animate-pulse tracking-wide">
                                 {loadingStep === 0 && "Connecting to timeline..."}
                                 {loadingStep === 1 && "Predicting trajectory..."}
                                 {loadingStep === 2 && "Synthesizing emotional patterns..."}
                                 {loadingStep >= 3 && "Drafting letter..."}
                             </p>
                         </div>
                     </div>
                ) : (
                     // Using flex-1 and overflow-y-auto here forces this container to take up available space
                     // and scroll internally, ensuring the scrollbar appears on the modal, not the body.
                     <div className="flex-1 overflow-y-auto bg-white">
                         <div className="max-w-2xl mx-auto px-8 md:px-16 py-16 md:py-20 pb-40">
                             {/* OpenAI Style Header */}
                             <div className="mb-12 text-center md:text-left">
                                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full mb-8">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Unlocks: {displayDate}</span>
                                 </div>
                                 <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-[1.2] mb-6">
                                     A Letter from <br/> <span className="text-slate-400 italic">{userName} & {partnerName}</span>
                                 </h1>
                                 <div className="w-16 h-1 bg-[#f0addd] rounded-full mb-8 md:mx-0 mx-auto"></div>
                             </div>
                             
                             {/* Body - Merriweather, high readability */}
                             <div className="prose prose-lg prose-slate max-w-none font-serif text-slate-800 leading-[2.2] whitespace-pre-wrap selection:bg-[#f0addd] selection:text-white">
                                 {letterContent}
                             </div>
                             
                             {/* Footer Area */}
                             <div className="mt-20 pt-10 border-t border-slate-100 flex items-center justify-between opacity-60">
                                 <div className="flex items-center gap-2">
                                     <Sparkles size={14} className="text-[#f0addd]" />
                                     <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Belluh Prediction Engine</span>
                                 </div>
                             </div>
                         </div>
                     </div>
                )}
                
                {/* Floating Footer Button - Stays fixed at bottom of modal */}
                {!isLoadingLetter && (
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white/95 to-transparent z-20 flex justify-center pointer-events-none">
                        <button 
                            onClick={onClose}
                            className="pointer-events-auto bg-black text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-slate-900 transition-all shadow-2xl hover:scale-[1.02] active:scale-95 flex items-center gap-2 backdrop-blur-xl"
                        >
                            <Lock size={14} />
                            <span>Seal in Vault</span>
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ArtifactModal;