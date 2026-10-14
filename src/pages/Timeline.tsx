import React, { useMemo, useState, useEffect } from 'react';
import { JournalEntry, Circle, Insight, CircleStatus, RelationshipForecast } from '../types';
import EntryCard from '../components/EntryCard';
import WeeklyReport from '../components/WeeklyReport';
import { ChevronDown, Plus, Sparkles, PenLine, Flame, X, Loader2, ArrowRight, Waves, Quote, Archive, Star, BookOpen, History, CloudSun, CloudRain, Sun, Zap, Eye, EyeOff } from 'lucide-react';
import { DAILY_PROMPTS } from '../constants';
import { questionForDay, isSameDay, hideLockedAnswer } from '../lib/daily';
import { askBelluhAboutJournal, generateRelationshipForecast, detectPatterns } from '../services/geminiService';
import { trackEvent } from '../services/analytics';
import { belluhAgent, type WeekView, type AgentMessage } from '../services/belluhAgent';
import WeeklyCard from '../components/WeeklyCard';
import PlanCard from '../components/PlanCard';
import OurWeeks from '../components/OurWeeks';

interface TimelineProps {
  entries: JournalEntry[];
  currentUserId: string;
  partnerName?: string;
  onTriggerPremium: () => void;
  activeCircleId: string;
  circles: Circle[];
  onCircleChange: (circleId: string) => void;
  onLikeEntry: (id: string) => void;
  onCompose: (prompt?: string) => void;
  onSearch?: (query: string) => void; 
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (id: string, content: string) => void;
  streak: number;
  /** Opens the Belluh conversation with this message (one Belluh, one memory). */
  onAskBelluh?: (message: string) => void;
  /** Opens the Belluh conversation. */
  onOpenBelluh?: () => void;
}

const Timeline: React.FC<TimelineProps> = ({ entries, currentUserId, partnerName, activeCircleId, circles, onCircleChange, onLikeEntry, onCompose, onSearch: _onSearch, onDeleteEntry, onUpdateEntry, streak, onAskBelluh, onOpenBelluh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCircleMenuOpen, setIsCircleMenuOpen] = useState(false);
  // Same question for both of you today
  const [todaysPrompt] = useState(() => questionForDay(DAILY_PROMPTS));
  // Home stays fresh: coming back to the app (or a new Belluh message) reloads the week, plans and Belluh's latest word
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => { if (document.visibilityState !== 'hidden') setTick(t => t + 1); };
    window.addEventListener('focus', bump);
    document.addEventListener('visibilitychange', bump);
    window.addEventListener('belluh:refresh', bump);
    const iv = setInterval(bump, 120000);
    return () => { window.removeEventListener('focus', bump); document.removeEventListener('visibilitychange', bump); window.removeEventListener('belluh:refresh', bump); clearInterval(iv); };
  }, []);
  // This week's one thing to try together (from Belluh's Sunday message)
  const [week, setWeek] = useState<WeekView | null>(null);
  useEffect(() => {
    let cancelled = false;
    const first = (partnerName || '').trim().split(/\s+/)[0] || null;
    belluhAgent.thisWeek(currentUserId, first).then(w => { if (!cancelled) setWeek(w); }).catch(() => {});
    return () => { cancelled = true; };
  }, [currentUserId, partnerName, tick]);
  const today = new Date();
  const myAnswer = entries.find(e => e.userId === currentUserId && e.prompt === todaysPrompt && isSameDay(e.timestamp, today));
  const partnerAnswer = entries.find(e => e.userId !== currentUserId && !e.isPrivate && e.prompt === todaysPrompt && isSameDay(e.timestamp, today));
  const partnerFirst = (partnerAnswer?.authorName || '').split(' ')[0] || 'Your partner';
  const hasPartnerInCircle = (circles.find(c => c.id === activeCircleId)?.members?.length ?? 0) > 1;

  const [isSearching, setIsSearching] = useState(false);
  const [searchAnswer, setSearchAnswer] = useState<string | null>(null);
  
  // Forecast State (Thiel Upgrade: Predictive Intelligence)
  const [forecast, setForecast] = useState<RelationshipForecast | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);

  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [detectedPatterns, setDetectedPatterns] = useState<Insight[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Insight | null>(null);
  const [showPatterns, setShowPatterns] = useState(true);

  const isConstellation = activeCircleId === 'constellation';
  const activeCircle = isConstellation ? null : circles.find(c => c.id === activeCircleId);
  const isArchived = activeCircle?.status === CircleStatus.Archived;

  // Belluh's latest word sits at the top of Home. Once Belluh is live, it replaces the older
  // one-off forecast and pattern cards, so there is one Belluh with one memory.
  const [belluhLive, setBelluhLive] = useState<boolean | null>(null);
  const [homePlans, setHomePlans] = useState<{ id: string }[]>([]);
  useEffect(() => { belluhAgent.homePlans().then(setHomePlans).catch(() => {}); }, [currentUserId, tick]);
  const [latest, setLatest] = useState<AgentMessage | null>(null);
  useEffect(() => {
    let cancelled = false;
    belluhAgent.latest().then(r => { if (!cancelled) { setBelluhLive(r.live); setLatest(r.message); } }).catch(() => setBelluhLive(false));
    return () => { cancelled = true; };
  }, [currentUserId, week?.id, week?.mine, tick]);

  // Run pattern detection when entries change (only before Belluh is live)
  useEffect(() => {
    if (belluhLive !== false) return;
    const runDetection = async () => {
        const readable = hideLockedAnswer(entries, currentUserId, todaysPrompt);
        const patterns = await detectPatterns(readable);
        setDetectedPatterns(patterns);
        
        // Auto-generate forecast if we have enough data (Simulating "Always On" OS)
        if (readable.length > 5) {
            setIsLoadingForecast(true);
            const data = await generateRelationshipForecast(readable);
            setForecast(data);
            setIsLoadingForecast(false);
        }
    };
    runDetection();
  }, [entries, belluhLive]);

  const hasUserPostedToday = useMemo(() => {
      const today = new Date();
      return entries.some(e => e.userId === currentUserId && e.timestamp.toDateString() === today.toDateString());
  }, [entries, currentUserId]);

  const filteredEntries = useMemo(() => {
    // Your partner's answer to today's question stays hidden until you've answered too
    let result = !myAnswer && partnerAnswer ? entries.filter(e => e.id !== partnerAnswer.id) : entries;
    if (searchQuery.trim() && !searchAnswer) { 
        const query = searchQuery.toLowerCase();
        result = result.filter(e => e.content.toLowerCase().includes(query) || e.authorName.toLowerCase().includes(query));
    }
    return result;
  }, [entries, searchQuery, searchAnswer, myAnswer?.id, partnerAnswer?.id]);

  const groupedItems = useMemo(() => {
    const sorted = [...filteredEntries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const items: (JournalEntry | { type: 'header', title: string } | { type: 'pattern', data: Insight })[] = [];
    
    // Mix in patterns if enabled
    const processedIds = new Set<string>();
    let lastMonthStr = '';

    // Insert detected patterns at the top for visibility
    if (!searchQuery && sorted.length > 0 && !isArchived && showPatterns && belluhLive === false) {
        detectedPatterns.forEach(p => {
            items.push({ type: 'pattern', data: p });
        });
    }

    sorted.forEach(entry => {
        if (processedIds.has(entry.id)) return;

        // Group by Month Year for the divider
        const entryMonthStr = entry.timestamp.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        if (entryMonthStr !== lastMonthStr) {
            items.push({ type: 'header', title: entryMonthStr });
            lastMonthStr = entryMonthStr;
        }

        items.push(entry);
        processedIds.add(entry.id);
    });

    return items;
  }, [filteredEntries, detectedPatterns, searchQuery, isArchived, showPatterns, belluhLive]);

  const ask = async (question: string) => {
    if (!question.trim()) return;
    trackEvent('timeline_search', { query_length: question.length, agent: !!onAskBelluh });
    // Questions go to the same Belluh you talk to in the Belluh tab, with its memory and context
    if (onAskBelluh) { setSearchQuery(''); onAskBelluh(question.trim()); return; }
    setIsSearching(true); setSearchAnswer(null);
    const answer = await askBelluhAboutJournal(question, hideLockedAnswer(entries, currentUserId, todaysPrompt));
    setSearchAnswer(answer); setIsSearching(false);
  };
  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); ask(searchQuery); };

  const handleAskAboutEntry = (entry: JournalEntry) => {
      const when = entry.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const whose = entry.userId === currentUserId ? 'my' : `${entry.authorName.split(' ')[0]}'s`;
      const excerpt = entry.content.replace(/\s+/g, ' ').slice(0, 220);
      ask(`About ${whose} entry from ${when}: "${excerpt}${entry.content.length > 220 ? '…' : ''}" What do you notice?`);
  };

  const getWeatherIcon = (type?: string) => {
      switch(type) {
          case 'Stormy': return <CloudRain className="text-slate-500" />;
          case 'Cloudy': return <CloudSun className="text-slate-400" />;
          case 'Sunny': return <Sun className="text-amber-400" />;
          case 'Clear Skies': return <Zap className="text-blue-400" />;
          default: return <Sparkles className="text-belluh-300" />;
      }
  };

  return (
    <div className="min-h-screen bg-white">
       <div className="pb-32 pt-0 px-0 max-w-2xl md:max-w-3xl mx-auto">
       {/* Weekly Report Modal Overlay */}
       {showWeeklyReport && belluhLive && (
           <OurWeeks onClose={() => setShowWeeklyReport(false)} partnerName={(partnerName || '').split(' ')[0] || null} />
       )}
       {showWeeklyReport && !belluhLive && (
           <WeeklyReport 
             onClose={() => setShowWeeklyReport(false)} 
             onTryRitual={(prompt) => {
                 onCompose(prompt);
                 setShowWeeklyReport(false);
                 trackEvent('report_ritual_accepted');
             }} 
             entries={entries}
           />
       )}

       {/* Pattern Detail Modal */}
       {selectedPattern && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={() => setSelectedPattern(null)}>
               <div className="bg-white rounded-[2rem] w-full max-w-lg mx-4 md:mx-auto shadow-2xl overflow-hidden animate-scale-in relative flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                    {/* Floating Close Button - Always visible on top right */}
                    <button 
                        onClick={() => setSelectedPattern(null)} 
                        className="absolute top-4 right-4 z-30 p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-slate-500 hover:text-slate-900 shadow-sm backdrop-blur-sm"
                    >
                        <X size={20} />
                    </button>

                    {/* Scrollable Container */}
                    <div className="overflow-y-auto h-full flex flex-col">
                        
                        {/* Header Section - Background matches type */}
                        <div className={`p-6 md:p-8 relative shrink-0 ${selectedPattern.type === 'Spiral' ? 'bg-[#CDE9F2] text-cyan-950' : 'bg-belluh-50 text-slate-900'}`}>
                            {selectedPattern.type === 'Spiral' && <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-[80px] pointer-events-none"></div>}
                            
                            <div className="flex items-center gap-3 mb-6 relative z-10 pr-10">
                                {selectedPattern.type === 'Spiral' ? (
                                    <div className="w-10 h-10 rounded-full bg-cyan-900/10 flex items-center justify-center"><Waves size={20} className="text-cyan-900"/></div>
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"><History size={20} className="text-belluh-500"/></div>
                                )}
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedPattern.type === 'Spiral' ? 'text-cyan-800' : 'text-belluh-600'}`}>
                                    {selectedPattern.title}
                                </span>
                            </div>
                            
                            <h2 className={`text-2xl md:text-3xl font-serif relative z-10 leading-tight ${selectedPattern.type === 'Spiral' ? 'text-cyan-950' : 'text-slate-900'}`}>
                                {selectedPattern.content}
                            </h2>
                        </div>

                        {/* Body Content */}
                        <div className="p-6 md:p-8 bg-white flex-1">
                            {/* EVIDENCE SECTION */}
                            <div className="mb-8">
                                <h4 className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-4 ml-1">The Evidence</h4>
                                <div className="space-y-3">
                                    {selectedPattern.relatedEntryIds && selectedPattern.relatedEntryIds.length > 0 ? (
                                        selectedPattern.relatedEntryIds.slice(0, 2).map(id => {
                                            const entry = entries.find(e => e.id === id);
                                            if (!entry) return null;
                                            return (
                                                <div key={id} className="group p-5 rounded-[1.25rem] bg-[#f8fafc] border border-slate-100 flex gap-4 items-start hover:bg-[#f1f5f9] hover:border-slate-200 transition-all duration-300">
                                                    <div className="shrink-0 mt-0.5">
                                                        <Quote size={20} className="text-slate-300 fill-slate-300" strokeWidth={0} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[15px] font-serif text-slate-600 italic leading-relaxed mb-2.5">
                                                            "{entry.content.substring(0, 100)}{entry.content.length > 100 ? '...' : ''}"
                                                        </p>
                                                        <p className="text-[11px] font-bold text-[#94a3b8] group-hover:text-[#64748B] transition-colors uppercase tracking-wide">
                                                            {entry.timestamp.toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <p className="text-sm text-slate-400 italic ml-1">Pattern detected from aggregate behavioral data.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-belluh-50/50 p-5 md:p-6 rounded-2xl border border-belluh-100 flex items-start gap-4 mb-4">
                                <Sparkles size={20} className="text-belluh-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-1">Belluh's Advice</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {selectedPattern.type === 'Spiral' 
                                            ? "This pattern often appears when you feel disconnected. Try sharing a small, vulnerable truth with your partner today instead of withdrawing." 
                                            : "You are building a beautiful reservoir of shared meaning. Keep reinforcing this positive loop."}
                                    </p>
                                </div>
                            </div>
                            
                            <button onClick={() => setSelectedPattern(null)} className="w-full mt-4 bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-black transition-transform active:scale-95 shadow-lg">
                                Acknowledged
                            </button>
                        </div>
                    </div>
               </div>
           </div>
       )}

       {/* Redesigned Header */}
       <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-transparent transition-all duration-300">
          <div className="px-6 pt-8 pb-4 max-w-3xl mx-auto">
             <div className="flex items-start justify-between mb-6">
                <div className="relative">
                    <button 
                        onClick={() => setIsCircleMenuOpen(!isCircleMenuOpen)}
                        className="text-left group focus:outline-none"
                    >
                        <h1 className="font-serif text-3xl md:text-4xl text-slate-900 leading-tight group-hover:opacity-70 transition-opacity flex items-center gap-2">
                            {isConstellation ? "My Constellation" : activeCircle?.name}
                            {isArchived && <Archive size={20} className="text-slate-300" />}
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-belluh-400">
                                {isConstellation ? "All Memories" : "Shared Journal"}
                             </span>
                             <ChevronDown size={12} className={`text-slate-300 transition-transform duration-300 ${isCircleMenuOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </button>

                    {isCircleMenuOpen && (
                        <div className="absolute top-full left-0 mt-4 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-2 w-72 animate-scale-in z-50 origin-top-left ring-1 ring-black/5 max-h-[60vh] overflow-y-auto">
                            <div className="text-[10px] font-bold text-slate-400 px-3 py-2 uppercase tracking-widest">Active Circles</div>
                            {circles.filter(c => c.status === CircleStatus.Active).map(c => (
                                <button key={c.id} className="w-full p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-center gap-3 text-left group" onClick={() => { onCircleChange(c.id); setIsCircleMenuOpen(false); }}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${activeCircleId === c.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white border border-slate-200'}`}>
                                        {c.name[0]}
                                    </div>
                                    <span className={`font-medium text-sm ${activeCircleId === c.id ? 'text-slate-900' : 'text-slate-600'}`}>{c.name}</span>
                                    {activeCircleId === c.id && <div className="ml-auto w-1.5 h-1.5 bg-belluh-300 rounded-full"></div>}
                                </button>
                            ))}
                            {circles.some(c => c.status === CircleStatus.Archived) && (
                                <>
                                    <div className="text-[10px] font-bold text-slate-400 px-3 py-2 mt-2 uppercase tracking-widest border-t border-slate-50">Past Chapters</div>
                                    {circles.filter(c => c.status === CircleStatus.Archived).map(c => (
                                        <button key={c.id} className="w-full p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-center gap-3 text-left group grayscale opacity-80" onClick={() => { onCircleChange(c.id); setIsCircleMenuOpen(false); }}>
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                                                {c.name[0]}
                                            </div>
                                            <span className="font-medium text-sm text-slate-500">{c.name}</span>
                                        </button>
                                    ))}
                                </>
                            )}
                            {/* Constellation Option */}
                            <div className="text-[10px] font-bold text-slate-400 px-3 py-2 mt-2 uppercase tracking-widest border-t border-slate-50">Universal</div>
                            <button className="w-full p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-center gap-3 text-left group" onClick={() => { onCircleChange('constellation'); setIsCircleMenuOpen(false); }}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${isConstellation ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white border border-slate-200'}`}>
                                    <Star size={14} className={isConstellation ? "fill-current" : ""} />
                                </div>
                                <span className={`font-medium text-sm ${isConstellation ? 'text-slate-900' : 'text-slate-600'}`}>My Constellation</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                     <button
                        onClick={() => setShowPatterns(!showPatterns)}
                        className={`w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center transition-all group shadow-sm ${showPatterns ? 'bg-belluh-50 text-belluh-500 border-belluh-100' : 'bg-white text-slate-400 hover:text-slate-600'}`}
                        title={showPatterns ? "Hide Belluh's cards" : "Show Belluh's cards"} aria-label={showPatterns ? "Hide Belluh's cards" : "Show Belluh's cards"} aria-pressed={!showPatterns}
                     >
                        {showPatterns ? <Eye size={20} strokeWidth={1.5} /> : <EyeOff size={20} strokeWidth={1.5} />}
                     </button>
                     {!isConstellation && (
                         <button 
                            onClick={() => { setShowWeeklyReport(true); trackEvent('weekly_report_opened'); }}
                            aria-label="Our weeks" title="Our weeks"
                            className="h-12 min-w-[3rem] px-3.5 rounded-full bg-white border border-slate-100 flex items-center justify-center gap-2 text-slate-400 hover:text-belluh-500 hover:border-belluh-200 shadow-sm transition-all group"
                         >
                            <BookOpen size={20} strokeWidth={1.5} className="group-hover:scale-110 transition-transform"/>
                            <span className="hidden md:inline text-xs font-bold text-slate-500">Our weeks</span>
                         </button>
                     )}
                </div>
             </div>

             {/* Belluh's latest word to you */}
             {belluhLive && latest && !(latest.meta?.kind === 'weekly' && week) && !isConstellation && !isArchived && showPatterns && (
                 <button type="button" onClick={() => onOpenBelluh?.()} className="w-full text-left mb-6 animate-scale-in group">
                     <div className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-float flex items-start gap-4 relative overflow-hidden group-hover:shadow-lg transition-shadow">
                         <div className="absolute top-0 left-0 w-1 h-full bg-[#f0addd]"></div>
                         <div className="w-10 h-10 rounded-full bg-belluh-600 flex items-center justify-center text-white shrink-0"><Sparkles size={16} /></div>
                         <div className="min-w-0">
                             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{latest.meta?.kind === 'weekly' ? 'Belluh · your week' : latest.meta?.kind === 'checkin' ? 'Belluh · check-in' : latest.meta?.kind === 'reminder' ? 'Belluh · reminder' : 'Belluh'}</span>
                             <p className="mt-1 text-[15px] font-serif text-slate-800 leading-snug line-clamp-3">{latest.body}</p>
                             <span className="mt-2 inline-block text-xs font-bold text-belluh-500">Reply</span>
                         </div>
                     </div>
                 </button>
             )}

             {/* Forecast (before Belluh is live) */}
             {belluhLive === false && forecast && !isConstellation && !isArchived && showPatterns && (
                 <div className="mb-6 animate-scale-in">
                     <div className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-float flex items-center gap-5 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-1 h-full bg-[#f0addd]"></div>
                         <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center shrink-0">
                             {isLoadingForecast ? <Loader2 size={20} className="animate-spin text-slate-400" /> : getWeatherIcon(forecast.weather)}
                         </div>
                         <div>
                             <div className="flex items-center gap-2 mb-1">
                                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Belluh Forecast</span>
                                 <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">{forecast.velocity} Velocity</span>
                             </div>
                             <p className="text-sm font-serif text-slate-800 leading-snug">{forecast.forecast}</p>
                         </div>
                     </div>
                 </div>
             )}

             {/* Ask Belluh Search */}
             <form 
                onSubmit={handleSearchSubmit} 
                className={`relative bg-white rounded-3xl transition-all duration-300 flex items-center px-4 py-4 ${
                    isSearching || searchAnswer || searchQuery 
                    ? 'shadow-2xl shadow-slate-200/50 ring-1 ring-slate-100 transform -translate-y-1' 
                    : 'shadow-float hover:shadow-lg border border-transparent'
                }`}
             >
                <div className="mr-3">{isSearching ? <Loader2 size={18} className="animate-spin text-belluh-400" /> : <Sparkles size={18} className="text-belluh-300" />}</div>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isArchived ? "Search past memories..." : isConstellation ? "Search across all constellations..." : "Ask Belluh..."} className="flex-1 bg-transparent text-[16px] focus:outline-none font-normal placeholder:text-slate-400" />
                {searchQuery && <button type="button" onClick={() => { setSearchQuery(''); setSearchAnswer(null); }}><X size={16} className="text-slate-400" /></button>}
             </form>

             {/* Search Result Display */}
             {searchAnswer && <div className="mt-4 animate-slide-up bg-white rounded-3xl p-8 shadow-2xl border border-slate-50 relative overflow-hidden"><div className="absolute top-0 left-0 w-1.5 h-full bg-belluh-300"></div><p className="text-slate-800 font-serif leading-relaxed text-lg">{searchAnswer}</p></div>}
          </div>
       </div>

       <div className="relative min-h-[400px]">
          {/* Timeline Stem */}
          <div className="absolute left-14 md:left-20 top-0 bottom-0 w-px bg-slate-100"></div>

          {/* Today: what needs you now, before the story */}
          {!isArchived && !isConstellation && (
              <div className="relative pl-20 md:pl-24 pr-6 mb-5 flex items-center gap-3">
                  <span className="text-[10px] font-bold text-belluh-400 uppercase tracking-widest">Today</span>
                  <div className="h-px bg-slate-100 flex-1"></div>
              </div>
          )}

          {/* Plans: one waiting for you to pick a time, or one coming up */}
          {homePlans.length > 0 && !isArchived && !isConstellation && (
              <div className="relative pl-20 md:pl-24 pr-6 mb-10 animate-slide-up space-y-4">
                  <div className="absolute left-14 md:left-20 top-8 w-2 h-2 bg-[#f0addd] border-[2px] border-[#fcfcfc] rounded-full z-10 -translate-x-[3.5px]"></div>
                  {homePlans.slice(0, 2).map(p => <PlanCard key={p.id} planId={p.id} partnerName={(partnerName || '').split(' ')[0] || null} />)}
              </div>
          )}

          {/* This week's thing to try together: one tap to check in */}
          {week && !isArchived && !isConstellation && (
              <div className="relative pl-20 md:pl-24 pr-6 mb-10 animate-slide-up">
                  <div className="absolute left-14 md:left-20 top-8 w-2 h-2 bg-[#9bbecb] border-[2px] border-[#fcfcfc] rounded-full z-10 -translate-x-[3.5px]"></div>
                  <WeeklyCard week={week} onChange={w => setWeek(w)} />
              </div>
          )}

          {/* Today's question: you both answer; your partner's answer opens once you've written yours */}
          {!isArchived && !isConstellation && (
              <div className="relative pl-20 md:pl-24 pr-6 mb-16 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <div className="absolute left-14 md:left-20 top-8 w-2 h-2 bg-belluh-300 border-[2px] border-[#fcfcfc] rounded-full z-10 shadow-glow -translate-x-[3.5px]"></div>

                  {!myAnswer ? (
                  <button onClick={() => { trackEvent('daily_question_opened', { partner_answered: !!partnerAnswer }); onCompose(todaysPrompt); }} className="w-full text-left group">
                      <div className="bg-white border border-slate-100 shadow-sm hover:shadow-lg rounded-[2rem] p-8 transition-all duration-500 relative overflow-hidden group-hover:border-belluh-100 group-hover:-translate-y-1">
                          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><PenLine size={80} className="rotate-12" /></div>
                          <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-4">
                                  <span className="bg-belluh-50 text-belluh-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Today's Question</span>
                              </div>
                              <h3 className="font-serif text-2xl text-slate-800 leading-tight mb-6 group-hover:text-belluh-600 transition-colors">
                                  {todaysPrompt}
                              </h3>
                              {partnerAnswer && (
                                  <div className="mb-6 rounded-2xl bg-[#f7d8ee]/60 p-4">
                                      <p className="text-xs font-bold text-[#831843] mb-2">{partnerFirst} answered</p>
                                      <div className="space-y-2 py-1" aria-hidden="true">
                                          <div className="h-2.5 rounded-full bg-[#f0addd]/50 w-11/12" />
                                          <div className="h-2.5 rounded-full bg-[#f0addd]/50 w-8/12" />
                                      </div>
                                      <p className="text-xs text-[#831843]/80 mt-2">Write yours to see it.</p>
                                  </div>
                              )}
                              <div className="flex items-center gap-3 text-sm font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:shadow-sm"><Plus size={18} /></div>
                                  <span>{partnerAnswer ? 'Answer to unlock' : 'Tap to answer'}</span>
                              </div>
                          </div>
                      </div>
                  </button>
                  ) : (
                  <div className="w-full bg-white border border-slate-100 shadow-sm rounded-[2rem] p-8">
                      <div className="flex items-center gap-2 mb-4">
                          <span className="bg-belluh-50 text-belluh-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Today's Question</span>
                      </div>
                      <h3 className="font-serif text-xl text-slate-800 leading-tight mb-5">{todaysPrompt}</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-slate-50 p-4">
                              <p className="text-xs font-bold text-slate-400 mb-2">You</p>
                              <p className="font-serif text-[15px] text-slate-700 leading-relaxed line-clamp-5">{myAnswer.content || 'Answered with a photo or voice note'}</p>
                          </div>
                          {partnerAnswer ? (
                              <div className="rounded-2xl bg-[#f7d8ee] p-4 animate-scale-in">
                                  <p className="text-xs font-bold text-[#831843] mb-2">{partnerFirst}</p>
                                  <p className="font-serif text-[15px] text-[#5e1c43] leading-relaxed line-clamp-5">{partnerAnswer.content || 'Answered with a photo or voice note'}</p>
                              </div>
                          ) : (
                              <div className="rounded-2xl border border-dashed border-slate-200 p-4 flex items-center">
                                  <p className="text-sm text-slate-400">{hasPartnerInCircle ? "Your partner hasn't answered yet. You'll see theirs here." : 'Invite your partner from the Me tab to answer together.'}</p>
                              </div>
                          )}
                      </div>
                  </div>
                  )}
              </div>
          )}

          {/* Timeline Feed */}
          {groupedItems.map((item, index) => {
              // Header with Custom Centered Design
              if ('type' in item && item.type === 'header') {
                  return (
                      <div key={`header-${index}`} className="relative pl-20 md:pl-24 pr-6 mb-8 mt-12 flex items-center opacity-60">
                           <div className="h-px bg-slate-200 flex-1"></div>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">
                               {item.title}
                           </span>
                           <div className="h-px bg-slate-200 flex-1"></div>
                      </div>
                  );
              }

              // Pattern / Spiral Card (The "Kafka" Feature)
              if ('type' in item && item.type === 'pattern') {
                  const pattern = item.data as Insight;
                  const isSpiral = pattern.type === 'Spiral';
                  
                  return (
                    <div key={pattern.id} className="relative pl-20 md:pl-24 pr-6 mb-8 animate-pop">
                        <div className="absolute left-14 md:left-20 top-8 w-2 h-2 bg-white border-[2px] border-slate-200 rounded-full z-10 ring-4 ring-[#fcfcfc] -translate-x-[3.5px]"></div>
                        
                        <div 
                            onClick={() => setSelectedPattern(pattern)}
                            className={`w-full rounded-[2rem] p-8 shadow-xl relative overflow-hidden group cursor-pointer hover:scale-[1.01] transition-transform ${isSpiral ? 'bg-[#CDE9F2] text-cyan-950' : 'bg-white border border-belluh-100'}`}
                        >
                             {/* Abstract Background Art */}
                             {isSpiral && (
                                 <div className="absolute -right-20 -top-20 w-60 h-60 bg-white/40 rounded-full blur-[80px]"></div>
                             )}
                             {!isSpiral && (
                                 <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-belluh-100 rounded-full blur-[60px] opacity-60"></div>
                             )}

                             <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    {isSpiral ? (
                                        <div className="w-8 h-8 rounded-full bg-cyan-900/10 flex items-center justify-center">
                                            <Waves size={16} className="text-cyan-900" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-belluh-50 flex items-center justify-center">
                                            <History size={16} className="text-belluh-500" />
                                        </div>
                                    )}
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isSpiral ? 'text-cyan-800' : 'text-belluh-500'}`}>
                                        {pattern.title}
                                    </span>
                                </div>
                                
                                <p className={`font-serif text-xl leading-relaxed mb-6 ${isSpiral ? 'text-cyan-950' : 'text-slate-800'}`}>
                                    {pattern.content}
                                </p>
                                
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPattern(pattern);
                                    }}
                                    className={`text-xs font-bold px-5 py-3 rounded-full transition-all flex items-center gap-2 ${isSpiral ? 'bg-white/60 text-cyan-950 hover:bg-white' : 'bg-belluh-50 text-belluh-900 hover:bg-belluh-100'}`}
                                >
                                    {pattern.actionLabel || 'Understand Why'}
                                    <ArrowRight size={14} />
                                </button>
                             </div>
                        </div>
                    </div>
                  )
              }

              // Standard Entry
              const entry = item as JournalEntry;
              const sourceCircle = circles.find(c => c.id === entry.circleId);

              return (
                  <div key={entry.id} className="relative pl-20 md:pl-24 pr-6 group transition-[padding] duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="absolute left-14 md:left-20 top-8 w-2 h-2 bg-white border-[2px] border-slate-200 rounded-full z-10 shadow-sm group-hover:border-belluh-300 group-hover:scale-110 transition-all duration-300 ring-4 ring-[#fcfcfc] -translate-x-[3.5px]"></div>
                    <div className="w-full">
                        <EntryCard 
                            entry={entry} 
                            isCurrentUser={entry.userId === currentUserId} 
                            onLike={isArchived ? undefined : onLikeEntry}
                            onAskBelluh={() => handleAskAboutEntry(entry)}
                            onDelete={isArchived ? undefined : () => onDeleteEntry(entry.id)}
                            onUpdate={isArchived ? undefined : (content) => onUpdateEntry(entry.id, content)}
                            showContext={isConstellation}
                            circleName={sourceCircle?.name}
                            circleColor={sourceCircle?.themeColor}
                        />
                    </div>
                  </div>
              );
          })}
       </div>
       </div>
    </div>
  );
};

export default Timeline;