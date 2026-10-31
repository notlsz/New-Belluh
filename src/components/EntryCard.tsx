
import { useI18n, useUi, localQuestion } from '../i18n';
import journalEntry from '../i18n/ui/journalEntry';
import { Emoji } from '../lib/emoji3d';
import React, { useState, useRef } from 'react';
import { JournalEntry } from '../types';
import { MOOD_EMOJIS } from '../constants';
import { Lock, Heart, MapPin, Play, Pause, Sparkles, Pencil, Trash2, Check, X, Users } from 'lucide-react';

interface EntryCardProps {
  entry: JournalEntry;
  isCurrentUser: boolean;
  onLike?: (id: string) => void;
  onAskBelluh?: () => void;
  onDelete?: () => void;
  onUpdate?: (content: string) => void;
  showContext?: boolean;
  circleName?: string;
  circleColor?: string;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, isCurrentUser, onLike, onAskBelluh, onDelete, onUpdate, showContext, circleName, circleColor }) => {
  const { d, date, tag } = useI18n();
  const J = useUi(journalEntry), T = J.entry;
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(entry.content);

  // Month and day on two lines, written the way they are where the reader lives (Nov / 2, nov. / 2, 11月 / 2日)
  const monthStr = date(entry.timestamp, { month: 'short' });
  const dayStr = date(entry.timestamp, { day: 'numeric' });
  
  let timeStr: string;
  try { timeStr = entry.timestamp.toLocaleTimeString(tag, { hour: 'numeric', minute: '2-digit' }); } catch { timeStr = entry.timestamp.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }

  const togglePlay = () => {
      if (!entry.audioUrl) return;

      if (!audioRef.current) {
          audioRef.current = new Audio(entry.audioUrl);
          audioRef.current.onended = () => setIsPlaying(false);
      }
      
      if (isPlaying) {
          audioRef.current.pause();
      } else {
          audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
  };

  const handleSave = () => {
      if (onUpdate && editedContent.trim() !== entry.content) {
          onUpdate(editedContent);
      }
      setIsEditing(false);
  };

  const handleCancel = () => {
      setEditedContent(entry.content);
      setIsEditing(false);
  };

  return (
    <div className="mb-8 w-full animate-fade-in relative group">
      {/* Date Marker (Side) */}
      <div className="absolute -left-20 top-6 w-12 flex flex-col items-end opacity-40 group-hover:opacity-100 transition-opacity pr-2">
        <span className="text-[12px] font-semibold text-slate-400 leading-none">{monthStr}</span>
        <span className="text-sm font-serif font-bold text-slate-800 leading-none mt-1">{dayStr}</span>
      </div>

      {/* Main Card - Minimalist/OpenAI style */}
      <div className={`
          relative p-6 rounded-[1.5rem] transition-all duration-300
          ${entry.isPrivate 
            ? 'bg-[#fafafa] border border-dashed border-slate-200' 
            : isCurrentUser 
                ? 'bg-white border border-belluh-100 hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-0.5'
                : 'bg-belluh-50 border border-belluh-100 hover:shadow-xl hover:shadow-cyan-100/40 hover:-translate-y-0.5' // Distinct background for partner
          }
      `}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4 relative z-10">
           <div className="flex items-center gap-3">
              <img src={entry.authorAvatar} alt={entry.authorName} className={`w-10 h-10 rounded-full shadow-sm object-cover ring-2 ring-white ${entry.isPrivate ? 'grayscale opacity-60' : ''}`} />
              <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 tracking-tight">{entry.authorName}</span>
                      {!isCurrentUser && !entry.isPrivate && (
                          <span className="px-2 py-0.5 rounded-full bg-[#CDE9F2]/70 text-[#2f6578] text-[10px] font-bold">{T.partner}</span>
                      )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">{timeStr}</span>
                    {showContext && circleName && (
                        <>
                            <span className="text-[12px] font-semibold text-slate-500 flex items-center gap-1">
                                {circleName}
                            </span>
                        </>
                    )}
                  </div>
              </div>
              {/* Private Indicator */}
              {entry.isPrivate && (
                <div className="ml-2 flex items-center gap-1 text-slate-300 pointer-events-none select-none bg-slate-100/50 px-2 py-0.5 rounded-md" title={T.privateToYou}>
                    <Lock size={10} />
                    <span className="text-[12px] font-semibold hidden sm:inline">{T.vault}</span>
                </div>
              )}
           </div>
           <div className="flex items-center gap-3 pr-2">
              {entry.mood && MOOD_EMOJIS[entry.mood] && (
                  <span className="text-2xl grayscale-[0.5] group-hover:grayscale-0 transition-all opacity-80" title={J.moods[entry.mood.toLowerCase() as keyof typeof J.moods] ?? entry.mood}><Emoji e={MOOD_EMOJIS[entry.mood]} size={28} /></span>
              )}
           </div>
        </div>

        {/* Prompt */}
        {entry.prompt && (
          <div className="mb-4 relative z-10 pl-1 border-l-2 border-belluh-100 py-1">
            <p className="text-[12px] font-semibold text-belluh-400 mb-1 opacity-80">{T.prompt}</p>
            <p className="text-sm font-medium text-slate-500 leading-snug">{localQuestion(d, entry.prompt)}</p>
          </div>
        )}

        {/* Media */}
        {entry.mediaUrl && (
            <div className="mb-5 rounded-2xl overflow-hidden relative group/media cursor-pointer z-10 bg-slate-50 border border-slate-100">
                <img src={entry.mediaUrl} alt={T.memoryAlt} className={`w-full h-auto max-h-96 object-cover transition-transform duration-700 group-hover/media:scale-[1.02] ${entry.isPrivate ? 'grayscale-[0.5]' : ''}`} />
            </div>
        )}
        
        {/* Functional Voice Note */}
        {entry.audioUrl && (
            <div className="mb-5 bg-[#fafafa] p-4 rounded-2xl flex items-center gap-4 border border-slate-100 z-10 relative group/audio hover:bg-slate-50 transition-colors">
                <button 
                    onClick={togglePlay}
                    aria-label={isPlaying ? T.pause : T.play}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all active:scale-90 ${isPlaying ? 'bg-belluh-400' : 'bg-slate-900 hover:bg-black'}`}
                >
                    {isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="ml-0.5 fill-current" />}
                </button>
                <div className="flex-1 h-8 flex items-center gap-0.5 opacity-40">
                    {[...Array(30)].map((_, i) => (
                        <div key={i} className={`w-0.5 rounded-full transition-all duration-300 ${isPlaying ? 'bg-belluh-400 animate-pulse' : 'bg-slate-800'}`} style={{ height: `${Math.random() * 20 + 4}px`, opacity: Math.random() > 0.5 ? 1 : 0.5 }}></div>
                    ))}
                </div>
                <span className="text-[9px] font-bold text-slate-400 tracking-widest bg-white px-2 py-1 rounded-md border border-slate-100">{T.voice}</span>
            </div>
        )}

        {/* Content - View Mode vs Edit Mode */}
        <div className="relative z-10">
            {isEditing ? (
                <textarea 
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full bg-slate-50 p-3 rounded-xl border border-belluh-200 focus:outline-none focus:ring-2 focus:ring-belluh-100 font-serif text-[16px] leading-[1.8] resize-none"
                    rows={Math.max(3, editedContent.split('\n').length)}
                    autoFocus
                />
            ) : (
                entry.content && (
                    <p className={`font-serif text-[16px] leading-[1.8] whitespace-pre-wrap antialiased ${entry.isPrivate ? 'text-slate-600 italic' : 'text-slate-800'}`}>
                        {entry.content}
                    </p>
                )
            )}
        </div>
        
        {/* Footer Actions */}
        <div className="mt-4 -mb-2 flex justify-between items-center relative z-10">
           {/* Location / Meta */}
           <div className="flex items-center gap-2">
               {entry.location ? (
                   <div className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-default bg-slate-50 px-2 py-1 rounded-md">
                       <MapPin size={10} />
                       <span className="text-[12px] font-semibold">{entry.location}</span>
                   </div>
               ) : <div></div>}
           </div>

           <div className="flex items-center gap-1">
               {/* Author Actions (Edit/Delete) - Only if editing is supported and authorized */}
               {isCurrentUser && (
                   <div className="flex items-center gap-0.5">
                       {isEditing ? (
                           <>
                                <button onClick={handleSave} aria-label={T.save} className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-black transition-colors" title={T.save}>
                                    <Check size={15} />
                                </button>
                                <button onClick={handleCancel} aria-label={T.cancel} className="w-9 h-9 inline-flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors" title={T.cancel}>
                                    <X size={15} />
                                </button>
                           </>
                       ) : (
                           <>
                                <button onClick={() => setIsEditing(true)} aria-label={T.edit} className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors" title={T.edit}>
                                    <Pencil size={15} />
                                </button>
                                <button onClick={onDelete} aria-label={T.delete} className="w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors" title={T.delete}>
                                    <Trash2 size={15} />
                                </button>
                           </>
                       )}
                   </div>
               )}

               {/* Ask Belluh Button */}
               {onAskBelluh && !entry.isPrivate && (
                   <button
                        onClick={onAskBelluh}
                        className="h-9 inline-flex items-center gap-1.5 px-3 rounded-full text-slate-500 hover:text-[#2f6578] hover:bg-[#CDE9F2]/40 transition-colors"
                        title={T.askAbout}
                   >
                       <Sparkles size={15} />
                       <span className="text-[13px] font-semibold whitespace-nowrap">{T.ask}</span>
                   </button>
               )}

               <button 
                  onClick={() => onLike && onLike(entry.id)}
                  aria-label={entry.isLiked ? T.unlike : T.like}
                  className={`h-9 min-w-[2.25rem] inline-flex items-center justify-center gap-1.5 px-2.5 rounded-full transition-colors duration-300 ${
                      entry.isLiked 
                      ? 'text-belluh-500 bg-belluh-50' 
                      : 'text-slate-400 hover:text-belluh-500 hover:bg-belluh-50'
                  }`}
               >
                  <Heart size={16} className={`transition-transform active:scale-75 ${entry.isLiked ? 'fill-current' : ''}`} />
                  {(entry.likes || 0) > 0 && <span className="text-[10px] font-bold">{entry.likes}</span>}
               </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EntryCard;