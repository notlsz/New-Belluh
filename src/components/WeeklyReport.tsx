import React, { useMemo } from 'react';
import { X, Activity, Zap, TrendingUp, Heart, ArrowRight } from 'lucide-react';
import { JournalEntry, Mood } from '../types';

interface WeeklyReportProps {
  onClose: () => void;
  onTryRitual: (prompt: string) => void;
  entries?: JournalEntry[];
}

const LOVE_LANGUAGES = {
  words: ['said', 'told', 'text', 'letter', 'note', 'wrote', 'words', 'speak', 'talk', 'voice', 'heard', 'listen'],
  touch: ['hold', 'hug', 'kiss', 'cuddle', 'sex', 'hand', 'touch', 'embrace', 'skin', 'body', 'physical'],
  time: ['walk', 'dinner', 'movie', 'date', 'time', 'together', 'sat', 'stayed', 'moment', 'adventure', 'trip'],
  service: ['cooked', 'cleaned', 'helped', 'fixed', 'made', 'chore', 'errand', 'drive', 'drove', 'support'],
  gifts: ['bought', 'gift', 'surprise', 'gave', 'present', 'flower', 'treat', 'got me']
};

const WeeklyReport: React.FC<WeeklyReportProps> = ({ onClose, onTryRitual, entries = [] }) => {
  
  const stats = useMemo(() => {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Filter entries
      const currentEntries = entries.filter(e => new Date(e.timestamp) >= oneWeekAgo);
      const previousEntries = entries.filter(e => new Date(e.timestamp) >= twoWeeksAgo && new Date(e.timestamp) < oneWeekAgo);

      // --- 1. Velocity Analysis ---
      const count = currentEntries.length;
      const positiveMoods = [Mood.Amazing, Mood.Good, Mood.Romantic, Mood.Grateful, Mood.Playful];
      const negativeMoods = [Mood.Stressed, Mood.Anxious, Mood.Tired];
      
      const posCount = currentEntries.filter(e => e.mood && positiveMoods.includes(e.mood)).length;
      const negCount = currentEntries.filter(e => e.mood && negativeMoods.includes(e.mood)).length;
      
      let velocityTitle = "Balanced Flow";
      let velocityDesc = "You are maintaining a consistent rhythm.";
      let velocityColor = "text-slate-900";
      
      if (count === 0) {
          velocityTitle = "Silent Week";
          velocityDesc = "No entries yet. Start a ritual to reconnect.";
      } else if (posCount > count * 0.6) {
          velocityTitle = "High Frequency of Joy";
          velocityDesc = "Pattern: Celebrating small wins.";
      } else if (negCount > count * 0.5) {
          velocityTitle = "Processing Mode";
          velocityDesc = "Pattern: Processing emotions safely.";
          velocityColor = "text-orange-600";
      }

      // --- 2. Intimacy Correlation ---
      // Proxies: Gratitude (Grateful mood or text) vs Intimacy (Romantic mood or text)
      const getGratitude = (list: JournalEntry[]) => list.filter(e => e.mood === Mood.Grateful || e.content.toLowerCase().includes('grateful') || e.content.toLowerCase().includes('thank')).length;
      const getIntimacy = (list: JournalEntry[]) => list.filter(e => e.mood === Mood.Romantic || e.content.toLowerCase().includes('love') || e.content.toLowerCase().includes('close') || e.content.toLowerCase().includes('connect')).length;

      const currG = getGratitude(currentEntries);
      const prevG = getGratitude(previousEntries);
      const currI = getIntimacy(currentEntries);
      const prevI = getIntimacy(previousEntries);

      const pctChange = (curr: number, prev: number) => {
           if (prev === 0) return curr > 0 ? 100 : 0;
           return Math.round(((curr - prev) / prev) * 100);
      };

      const gChange = pctChange(currG, prevG);
      const iChange = pctChange(currI, prevI);
      
      let correlationDesc = "Intimacy and gratitude are tracking steadily.";
      if (count > 0) {
          if (gChange < -10 && iChange < -10) {
              correlationDesc = `Gratitude skips correlate with intimacy drop ${Math.abs(iChange)}%.`;
          } else if (gChange > 10 && iChange > 10) {
              correlationDesc = `Gratitude spike of ${gChange}% correlates with deepening intimacy.`;
          } else if (gChange > 10 && iChange <= 0) {
              correlationDesc = "Gratitude is rising, intimacy will follow.";
          }
      }

      // --- 3. Love Language Drift ---
      const getLLScores = (list: JournalEntry[]) => {
           const s: Record<string, number> = { words: 0, touch: 0, time: 0, service: 0, gifts: 0 };
           let t = 0;
           list.forEach(e => {
               const txt = e.content.toLowerCase();
               if (LOVE_LANGUAGES.words.some(w => txt.includes(w))) s.words++;
               if (LOVE_LANGUAGES.touch.some(w => txt.includes(w))) s.touch++;
               if (LOVE_LANGUAGES.time.some(w => txt.includes(w))) s.time++;
               if (LOVE_LANGUAGES.service.some(w => txt.includes(w))) s.service++;
               if (LOVE_LANGUAGES.gifts.some(w => txt.includes(w))) s.gifts++;
           });
           t = Object.values(s).reduce((a,b) => a+b, 0);
           return { scores: s, total: t };
      };

      const currLL = getLLScores(currentEntries);
      // Use previous week OR overall entries as baseline if previous week is empty
      const baselineEntries = previousEntries.length > 0 ? previousEntries : entries; 
      const prevLL = getLLScores(baselineEntries);

      const llChanges = Object.keys(currLL.scores).map(k => {
           const cs = currLL.total ? (currLL.scores[k] / currLL.total) * 100 : 0;
           const ps = prevLL.total ? (prevLL.scores[k] / prevLL.total) * 100 : 0;
           const change = Math.round(cs - ps);
           // Capitalize key
           const label = k.charAt(0).toUpperCase() + k.slice(1);
           return { key: k, label, change, val: Math.round(cs) };
      }).sort((a,b) => Math.abs(b.change) - Math.abs(a.change));
      
      const topDrifts = llChanges.slice(0, 2);
      const driftDesc = (currLL.total > 0 && Math.abs(topDrifts[0].change) > 10) 
        ? "Your love languages drifted." 
        : "Your love languages are stable.";

      return {
          velocityTitle,
          velocityDesc,
          velocityColor,
          recentCount: count,
          gratitudeChange: gChange,
          intimacyChange: iChange,
          correlationDesc,
          topDrifts,
          driftDesc,
          hasData: count > 0
      };

  }, [entries]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden animate-scale-in flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 pb-4 relative z-10 bg-white">
           <button onClick={onClose} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
              <X size={20} className="text-slate-400" />
           </button>
           
           <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-belluh-50 text-belluh-600 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">
                Real-Time Analysis
              </span>
              <span className="text-slate-300 text-xs">•</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stats.recentCount} New Signals</span>
           </div>
           <h2 className="text-3xl font-serif text-slate-900 leading-tight">Our Report</h2>
           <p className="text-slate-500 text-sm mt-2">Synced with your latest journal entries.</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-2 space-y-8 no-scrollbar">
            
            {/* Insight 1: Communication Velocity */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Activity size={80} className="text-slate-400" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Zap size={16} className="text-orange-400 fill-orange-400" />
                        Communication Velocity
                    </h3>
                    
                    {/* Visual Graph (Abstract) */}
                    <div className="h-24 flex items-end gap-2 mb-4 px-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                        {[40, 60, 30, 80, 20, 90, 45].map((h, i) => (
                            <div key={i} className="flex-1 bg-slate-200 rounded-t-lg relative group/bar hover:bg-belluh-300 transition-colors" style={{ height: `${stats.hasData ? h : 10}%` }}>
                            </div>
                        ))}
                    </div>

                    <p className={`font-serif text-lg leading-relaxed ${stats.velocityColor}`}>
                        "{stats.velocityDesc} <br/>
                        <span className="bg-slate-200 text-slate-600 px-1 text-sm font-sans font-bold">Based on {stats.recentCount} recent logs.</span>"
                    </p>
                </div>
            </div>

            {/* Insight 2: Intimacy Correlation */}
            <div className="bg-[#CDE9F2] rounded-3xl p-6 text-cyan-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                <div className="relative z-10">
                    <h3 className="text-sm font-bold text-cyan-800 mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-cyan-700" />
                        Intimacy Correlation
                    </h3>
                    
                    <div className="flex items-center justify-between mb-6">
                         <div className="text-center">
                             <div className={`text-3xl font-bold mb-1 ${stats.gratitudeChange < 0 ? 'text-cyan-700 opacity-60' : 'text-cyan-950'}`}>
                                {stats.gratitudeChange > 0 ? '+' : ''}{stats.gratitudeChange}%
                             </div>
                             <div className="text-[10px] text-cyan-700 uppercase tracking-widest">Gratitude</div>
                         </div>
                         <div className="h-px bg-cyan-800/20 flex-1 mx-4"></div>
                         <div className="text-center">
                             <div className={`text-3xl font-bold mb-1 drop-shadow-sm ${stats.intimacyChange < 0 ? 'text-cyan-700 opacity-60' : 'text-[#f0addd]'}`} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                {stats.intimacyChange > 0 ? '+' : ''}{stats.intimacyChange}%
                             </div>
                             <div className="text-[10px] text-cyan-700 uppercase tracking-widest">Intimacy</div>
                         </div>
                    </div>

                    <p className="font-serif text-lg leading-relaxed text-cyan-900 opacity-90">
                        "{stats.correlationDesc}"
                    </p>
                    <button 
                        onClick={() => onTryRitual("Write down 3 specific things you are grateful for about your partner right now.")}
                        className="mt-4 w-full py-3 bg-white/40 hover:bg-white/60 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 text-cyan-900"
                    >
                        Try this ritual <ArrowRight size={12} />
                    </button>
                </div>
            </div>

            {/* Insight 3: Love Language Drift */}
            <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100">
                <h3 className="text-sm font-bold text-rose-900 mb-4 flex items-center gap-2">
                    <Heart size={16} className="text-rose-500 fill-rose-500" />
                    Love Language Drift
                </h3>

                <p className="font-serif text-lg leading-relaxed text-slate-800 mb-4">
                    "{stats.driftDesc}"
                </p>
                <div className="flex gap-2 flex-wrap">
                    {stats.topDrifts.map(drift => (
                         <span key={drift.key} className="text-xs bg-white px-2 py-1 rounded-md border border-rose-100 text-rose-600 font-bold">
                             {drift.label} {drift.change > 0 ? '+' : ''}{drift.change}%
                         </span>
                    ))}
                    {stats.topDrifts.length === 0 && (
                        <span className="text-xs bg-white px-2 py-1 rounded-md border border-rose-100 text-slate-400 font-bold">No drift detected</span>
                    )}
                </div>
                <button 
                    onClick={() => onTryRitual("What is one thing I could do this week that would make you feel most loved?")}
                    className="mt-4 text-xs font-bold text-rose-600 uppercase tracking-wider hover:underline"
                >
                    Recalibrate?
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default WeeklyReport;