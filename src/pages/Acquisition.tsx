import React from 'react';

const Acquisition: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#111111] font-sans selection:bg-slate-200 relative overflow-hidden py-24 px-6 md:px-12 flex flex-col justify-center">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500&display=swap');
                .signature-font { font-family: 'Caveat', cursive; }
            `}</style>
            
            <div className="max-w-[700px] mx-auto w-full relative z-10 animate-fade-in">
                <header className="mb-20">
                    <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-[#111111] mb-8 leading-[1.1]">
                        What's next for{" "}
                        <span className="relative inline-block whitespace-nowrap">
                            <svg 
                                viewBox="0 0 100 120" 
                                className="absolute bottom-[83%] md:bottom-[86%] left-[0%] h-[0.85em] w-auto pointer-events-none z-10 text-[#111111]"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M30 120 C30 90, 40 70, 40 60 C40 50, 60 50, 60 60 C60 70, 70 90, 70 120 Z" />
                                <ellipse cx="50" cy="50" rx="35" ry="30" />
                                <path d="M18 40 L25 10 L40 25 Z" />
                                <path d="M82 40 L75 10 L60 25 Z" />
                                <ellipse cx="35" cy="48" rx="10" ry="14" fill="white" />
                                <ellipse cx="65" cy="48" rx="10" ry="14" fill="white" />
                                <ellipse cx="38" cy="48" rx="3" ry="6" fill="black" />
                                <ellipse cx="62" cy="48" rx="3" ry="6" fill="black" />
                                <ellipse cx="50" cy="55" rx="2" ry="1.5" fill="white" />
                                <line x1="0" y1="55" x2="20" y2="52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="0" y1="62" x2="20" y2="58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="0" y1="69" x2="20" y2="64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="100" y1="55" x2="80" y2="52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="100" y1="62" x2="80" y2="58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="100" y1="69" x2="80" y2="64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Belluh
                        </span>
                    </h1>
                    <p className="text-sm font-mono text-slate-500 tracking-wider">
                        June 9, 2026
                    </p>
                </header>

                <div className="text-lg md:text-[21px] text-[#222222] leading-[1.65] font-serif space-y-8">
                    <p>
                        Today we are announcing that Belluh has been acquired by Match Group, Inc. (NASDAQ: MTCH).
                    </p>
                    <p>
                        I originally wrote the first lines of code for Belluh for my own relationship. Looking at the landscape of consumer technology, I saw a market ruthlessly engineered for the frictionless beginning, optimized entirely for the quick fling and algorithmic matching. There was a glaring void of tools designed to do the actual hard work: fostering and building an enduring, lifelong relationship.
                    </p>
                    <p>
                        We needed a sanctuary, not another feed.
                    </p>
                    <p>
                        Marcel Proust famously observed that our deepest memories are involuntary, like the sudden, flooding recollection brought on by the taste of a madeleine dipped in tea. This involuntary resurrection of the past forms the bedrock of human intimacy. Yet, in an era structured around ephemeral content and vanishing messages, we are systematically destroying the architecture of our own reminiscence. 
                    </p>
                    <p>
                        Belluh was built to be the antidote. We wanted to safe-keep the profound, quiet moments of a shared life, preserving them with absolute privacy so they could be tasted again decades from now.
                    </p>
                    <p>
                        Over the past year, we have watched couples use Belluh to rebuild unbroken trust, bridge thousands of miles of physical distance, and fall in love all over again. The stories we received validated every long night of engineering.
                    </p>
                    <p>
                        But to meaningfully shift the trajectory of human connection on a global level, we realized our sanctuary needed scale. Match Group brings the compounding infrastructure to reach millions. They have spent the last decade mastering the mechanics of how to bring people together; they now share our uncompromising vision for how to keep them together over a lifetime. 
                    </p>
                    <p>
                        The core team is staying. We are not winding down. The product remains strictly unchanged, except it will finally receive the immense resources it has always required. Your journals, your memories, and your encrypted spaces remain exactly that: yours.
                    </p>
                    <p>
                        Thank you to every couple who trusted us with their most vulnerable moments. You gave this product its heartbeat. 
                    </p>
                    <p>
                        We cannot wait to show you what we build next.
                    </p>
                    
                    <div className="pt-8 pb-4">
                        <p className="text-[#555] italic mb-6">With everything I have,</p>
                        <p className="signature-font text-[3.5rem] tracking-tight text-[#111] rotate-[-2deg] origin-left drop-shadow-sm">Jimmy</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-32 max-w-[700px] w-full mx-auto border-t border-slate-200 pt-8 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>© 2026 BELLUH</span>
                <a href="/" className="hover:text-[#111] transition-colors">RETURN HOME →</a>
            </div>
        </div>
    );
};

export default Acquisition;
