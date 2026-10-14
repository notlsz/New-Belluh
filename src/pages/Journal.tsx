
import React, { useState, useRef } from 'react';
import { EntryType, Mood } from '../types';
import { DAILY_PROMPTS, MOOD_EMOJIS } from '../constants';
import { questionForDay } from '../lib/daily';
import { Mic, Image as ImageIcon, Send, X, Loader2, Music, CheckCircle2, Lock, Globe } from 'lucide-react';
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
           <div className="relative mb-8">
              <div className="w-24 h-24 bg-belluh-50 rounded-full flex items-center justify-center animate-pulse-slow">
                 <CheckCircle2 size={40} className="text-belluh-400" />
              </div>
           </div>
           <h2 className="text-3xl font-serif text-slate-900 mb-3 text-center">Moment Captured</h2>
           <p className="text-slate-500 text-sm font-medium tracking-wide text-center max-w-xs leading-relaxed">
               {!isPrivate ? `Shared with ${partnerName || 'your partner'}.` : "Saved just for you."}
           </p>
        </div>
      ) : (
        <div className="relative flex-1 flex flex-col">
            <div className={`transition-all duration-500 flex-1 flex flex-col ${step === 'write' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none absolute inset-0'}`}>
                <div className="mb-8 mt-4">
                    {dailyPrompt ? (
                        <>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-belluh-400 uppercase tracking-widest">{dailyPrompt === todaysQuestion ? "Today's question" : 'Prompt'}</p>
                                <button type="button" onClick={() => setDailyPrompt(null)} className="text-xs font-bold text-slate-400 hover:text-slate-700">Write freely instead</button>
                            </div>
                            <p className="text-2xl text-slate-800 font-serif leading-tight">{dailyPrompt}</p>
                        </>
                    ) : (
                        <>
                            <p className="text-2xl text-slate-800 font-serif leading-tight">What's on your mind?</p>
                            <button type="button" onClick={() => setDailyPrompt(todaysQuestion)} className="mt-3 px-3.5 py-1.5 rounded-full bg-belluh-50 border border-belluh-100 text-xs font-bold text-belluh-900 hover:bg-belluh-100">Answer today's question instead</button>
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
                            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white">
                                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
                            </div>
                            <div className="flex-1 text-xs font-bold">
                                {isUploading ? "Saving voice note..." : uploadFailed ? "Couldn't save the recording. Your words are kept above." : "Voice Note Ready"}
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
                    placeholder={isTranscribing ? "Transcribing your thoughts..." : "Start typing..."}
                    className="w-full bg-transparent text-slate-800 placeholder:text-slate-300 focus:outline-none resize-none font-serif text-xl leading-relaxed flex-1 transition-opacity duration-300"
                    style={{ opacity: isTranscribing ? 0.5 : 1 }}
                    autoFocus
                    disabled={isTranscribing}
                />
                {/* One step: mood is optional, sharing is one tap, Save is right here */}
                <div className="mt-auto pt-4">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1" role="group" aria-label="How does it feel? Optional">
                        {Object.values(Mood).map((m) => (
                            <button key={m} type="button" aria-label={m} aria-pressed={selectedMood === m} title={m}
                                onClick={() => setSelectedMood(selectedMood === m ? undefined : m)}
                                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${selectedMood === m ? 'bg-white shadow-apple ring-2 ring-belluh-300 scale-110' : 'bg-slate-50 opacity-70 hover:opacity-100'}`}>
                                {MOOD_EMOJIS[m]}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1.5 items-center min-w-0">
                            <button onClick={handleMicClick} disabled={isBusy} aria-label={isRecording ? 'Stop recording' : 'Record a voice note'} className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-500'}`}>
                                {isRecording ? <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> : (isTranscribing ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />)}
                            </button>
                            {!isRecording && !isBusy && <button onClick={handleImageClick} aria-label="Add a photo" className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all ${hasImage ? 'bg-belluh-50 text-belluh-600' : 'bg-slate-50 text-slate-500'}`}><ImageIcon size={18} /></button>}
                            <button type="button" onClick={() => setIsPrivate(!isPrivate)} aria-pressed={isPrivate}
                                className={`h-11 px-3.5 shrink-0 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${isPrivate ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500'}`}>
                                {isPrivate ? <><Lock size={13} /> Just me</> : <><Globe size={13} /> Shared</>}
                            </button>
                        </div>
                        {(content.trim() || hasImage || audioUrl) && !isRecording && !isBusy && (
                            <button onClick={handleFinalSubmit} disabled={isSaving} aria-label="Save to Story" className="h-11 px-5 bg-slate-900 text-white rounded-full font-bold text-sm flex items-center gap-2 shrink-0 disabled:opacity-60">
                                <span>{isSaving ? 'Saving…' : <><span className="sm:hidden">Save</span><span className="hidden sm:inline">Save to Story</span></>}</span> <Send size={14} />
                            </button>
                        )}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">{isPrivate ? `Only you can see this. Belluh never shows it to ${partnerName || 'your partner'}.` : `${partnerName || 'Your partner'} will see this.`}</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Journal;