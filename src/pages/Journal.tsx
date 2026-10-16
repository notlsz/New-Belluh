
import React, { useState, useRef } from 'react';
import { EntryType, Mood } from '../types';
import { DAILY_PROMPTS, MOOD_EMOJIS } from '../constants';
import { questionForDay } from '../lib/daily';
import { Mic, Image as ImageIcon, X, Loader2, Lock, Users, ArrowRight, ArrowUp } from 'lucide-react';
import BelluhOrb from '../components/BelluhOrb';
import { transcribeAudio } from '../services/geminiService';
import { uploadPrivate } from '../services/media';

interface JournalProps {
  onAddEntry: (content: string, mood: Mood | undefined, type: EntryType, prompt?: string, isPrivate?: boolean, audioUrl?: string, mediaUrl?: string) => void;
  partnerName: string;
  onTriggerPremium: () => void;
  initialPrompt?: string;
  userName?: string;
  partnerHasEntry?: boolean;
}

const Journal: React.FC<JournalProps> = ({ onAddEntry, partnerName, onTriggerPremium, initialPrompt }) => {
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | undefined>(undefined);
  // "+" opens a blank page; today's question is one tap away. Opening from the question card starts on it.
  const todaysQuestion = questionForDay(DAILY_PROMPTS);
  const [dailyPrompt, setDailyPrompt] = useState<string | null>(initialPrompt || null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [step, setStep] = useState<'write' | 'success'>('write');
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // New state to track upload independently
  const [hasImage, setHasImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Intelligent MIME type detection
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
            ? 'audio/mp4' 
            : 'audio/webm';
      
      // Sam Altman Fix: Set lower bitrate (64kbps) for faster upload/transcription speed
      const options: MediaRecorderOptions = { 
          mimeType,
          audioBitsPerSecond: 64000 
      };

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;

        const finalMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const fileExt = finalMimeType.includes('mp4') ? 'mp4' : 'webm';
        
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
        const reader = new FileReader();
        
        // Block interaction immediately
        setIsTranscribing(true);
        setIsUploading(true);

        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            if (reader.result) {
                const fullDataUrl = reader.result as string;
                const base64Audio = fullDataUrl.split(',')[1];
                
                // 1. Kick off Transcription (Priority for User Feedback)
                transcribeAudio(base64Audio, finalMimeType)
                    .then(text => {
                        setContent(prev => prev + (prev ? ' ' : '') + text);
                    })
                    .catch(err => {
                        console.error("Transcription failed", err);
                    })
                    .finally(() => {
                        setIsTranscribing(false); // Unblock text input ASAP
                    });

                // 2. Upload to private storage in the background; the entry keeps a reference, not a link that expires
                uploadPrivate('voice', audioBlob, fileExt, finalMimeType)
                    .then(ref => { if (ref) setAudioUrl(ref); else setUploadFailed(true); })
                    .finally(() => {
                        setIsUploading(false); // Unblock Next button
                    });
            }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleMicClick = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };

  const handleImageClick = () => {
      if (hasImage) {
          setHasImage(false);
          setImagePreview(null);
          setPhotoFile(null);
      } else {
          fileInputRef.current?.click();
      }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          setPhotoFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
              setImagePreview(reader.result as string);
              setHasImage(true);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleDeleteAudio = () => {
      setAudioUrl(null);
      setUploadFailed(false);
  }

  const handleFinalSubmit = async () => {
       if (isSaving) return;
       setIsSaving(true);
       // Photos go to private storage instead of being stuffed into the database as text
       let photoRef: string | undefined;
       if (hasImage && photoFile) {
           const ext = (photoFile.name.split('.').pop() || 'jpg').toLowerCase();
           photoRef = (await uploadPrivate('photos', photoFile, ext, photoFile.type || 'image/jpeg')) ?? undefined;
       }
       onAddEntry(
           content, 
           selectedMood, 
           hasImage ? EntryType.Photo : (audioUrl ? EntryType.Voice : (dailyPrompt ? EntryType.Prompt : EntryType.Freeform)), 
           dailyPrompt ?? undefined, 
           isPrivate, 
           audioUrl || undefined, 
           photoRef ?? (hasImage ? imagePreview || undefined : undefined)
       );
       setIsSaving(false);
       setStep('success');
  };

  const isBusy = isTranscribing || isUploading;

  return (
    <div className="pb-32 pt-16 px-6 max-w-xl mx-auto h-full flex flex-col relative overflow-hidden">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-belluh-300/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      {step === 'success' ? (
        <div className="flex-1 flex flex-col items-center justify-center animate-scale-in">
           <div className="mb-8"><BelluhOrb size={96} /></div>
           <h2 className="text-3xl font-serif text-slate-900 mb-3 text-center">Moment captured</h2>
           <p className="text-slate-500 text-[15px] text-center max-w-xs leading-relaxed">
               {!isPrivate ? `Shared with ${partnerName || 'your partner'}.` : "Saved just for you."}
           </p>
        </div>
      ) : (
        <div className="relative flex-1 flex flex-col">
            <div className={`transition-all duration-500 flex-1 flex flex-col ${step === 'write' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none absolute inset-0'}`}>
                <div className="mb-6 mt-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9bbecb] mb-3">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    {dailyPrompt ? (
                        <>
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#e58fc9] mb-2">{dailyPrompt === todaysQuestion ? "Today's question" : 'Prompt'}</p>
                            <p className="text-[1.75rem] text-slate-900 font-serif leading-tight">{dailyPrompt}</p>
                            <button type="button" onClick={() => setDailyPrompt(null)} className="mt-3 text-sm font-semibold text-slate-400 hover:text-slate-800 transition-colors">Write freely instead</button>
                        </>
                    ) : (
                        <>
                            <p className="text-[1.75rem] text-slate-900 font-serif leading-tight">What's on your mind?</p>
                            <button type="button" onClick={() => setDailyPrompt(todaysQuestion)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#3f7486] hover:text-slate-900 transition-colors">Answer today's question instead <ArrowRight size={14} /></button>
                        </>
                    )}
                </div>
                <div className="space-y-4 mb-4">
                    {hasImage && imagePreview && (
                        <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-sm animate-scale-in group">
                            <img src={imagePreview} alt="Attached" className="w-full h-full object-cover" />
                            <button onClick={handleImageClick} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full backdrop-blur-md">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    {/* Audio Status Indicator */}
                    {(audioUrl || isUploading || uploadFailed) && !isRecording && (
                        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-slide-up">
                            <span className="text-slate-700">{isUploading ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}</span>
                            <div className="flex-1 text-xs font-bold">
                                {isUploading ? "Saving voice note..." : uploadFailed ? "Couldn't save the recording. Your words are kept above." : "Voice note ready"}
                            </div>
                            {!isUploading && (
                                <button onClick={handleDeleteAudio} className="p-2 text-slate-400 hover:text-red-400">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={isTranscribing ? "Transcribing your thoughts..." : "A line or two is enough."}
                    className="w-full min-h-[10rem] bg-transparent text-slate-800 placeholder:text-slate-300 focus:outline-none resize-none font-serif text-xl leading-relaxed flex-1 transition-opacity duration-300"
                    style={{ opacity: isTranscribing ? 0.5 : 1 }}
                    autoFocus
                    disabled={isTranscribing}
                />
                {/* One step: mood is optional, sharing is one tap, Save is right here */}
                <div className="mt-auto pt-4">
                    <p className="text-xs text-slate-400 mb-2">How did it feel? <span className="text-slate-300">Optional</span></p>
                    <div className="grid grid-cols-9 gap-0.5 pb-4" role="group" aria-label="How does it feel? Optional">
                        {Object.values(Mood).map((m) => (
                            <button key={m} type="button" aria-label={m} aria-pressed={selectedMood === m} title={m}
                                onClick={() => setSelectedMood(selectedMood === m ? undefined : m)}
                                className={`justify-self-center w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[1.3rem] transition-all ${selectedMood === m ? 'bg-white shadow-md ring-2 ring-[#f0addd] scale-110' : selectedMood ? 'opacity-40 hover:opacity-100' : 'hover:scale-110'}`}>
                                {MOOD_EMOJIS[m]}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-0.5 items-center min-w-0">
                            <button onClick={handleMicClick} disabled={isBusy} aria-label={isRecording ? 'Stop recording' : 'Record a voice note'} className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-[#fdf0f8] text-[#e58fc9]' : 'text-slate-500 hover:bg-slate-100'}`}>
                                {isRecording ? <div className="w-2.5 h-2.5 bg-[#e58fc9] rounded-sm animate-pulse" /> : (isTranscribing ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />)}
                            </button>
                            {!isRecording && !isBusy && <button onClick={handleImageClick} aria-label="Add a photo" className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all ${hasImage ? 'text-[#e58fc9]' : 'text-slate-500 hover:bg-slate-100'}`}><ImageIcon size={18} /></button>}
                            <div role="radiogroup" aria-label="Who sees this" className="h-11 shrink-0 p-1 rounded-full bg-slate-100/80 flex items-center text-xs font-bold">
                                <button type="button" role="radio" aria-checked={!isPrivate} onClick={() => setIsPrivate(false)} className={`h-9 px-3 rounded-full inline-flex items-center gap-1.5 transition-all ${!isPrivate ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><Users size={13} /> {(partnerName || '').split(' ')[0] ? `With ${(partnerName || '').split(' ')[0]}` : 'Shared'}</button>
                                <button type="button" role="radio" aria-checked={isPrivate} onClick={() => setIsPrivate(true)} className={`h-9 px-3 rounded-full inline-flex items-center gap-1.5 transition-all ${isPrivate ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><Lock size={13} /> Just me</button>
                            </div>
                        </div>
                        {!isRecording && !isBusy && (
                            <button onClick={handleFinalSubmit} disabled={isSaving || !(content.trim() || hasImage || audioUrl)} aria-label="Save to Story" className="h-11 w-11 sm:w-auto sm:px-5 bg-slate-900 text-white rounded-full font-bold text-sm inline-flex items-center justify-center gap-2 shrink-0 transition-opacity disabled:opacity-25">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><span className="hidden sm:inline">Save to Story</span><ArrowUp size={17} /></>}
                            </button>
                        )}
                    </div>
                    <p className="mt-3 text-xs text-slate-400">{isPrivate ? `Only you can see this. Belluh never shows it to ${partnerName || 'your partner'}.` : `${partnerName || 'Your partner'} will see this.`}</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Journal;