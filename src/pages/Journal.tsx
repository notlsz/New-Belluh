
import React, { useState, useRef } from 'react';
import { EntryType, Mood } from '../types';
import { DAILY_PROMPTS, MOOD_EMOJIS } from '../constants';
import { Mic, Image as ImageIcon, Send, X, Loader2, Music, CheckCircle2, Lock, Globe } from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';
import { supabase } from '../lib/supabaseClient';

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
  const [dailyPrompt] = useState(initialPrompt || DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [step, setStep] = useState<'write' | 'mood' | 'success'>('write');
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // New state to track upload independently
  const [hasImage, setHasImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNext = () => {
      if(content.trim() || hasImage || audioUrl) setStep('mood');
  }

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

                // 2. Kick off Upload (Background)
                const fileName = `voice-notes/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                supabase.storage
                    .from('journal-media')
                    .upload(fileName, audioBlob, { contentType: finalMimeType })
                    .then(({ data, error }) => {
                        if (!error && data) {
                            const { data: publicUrlData } = supabase.storage
                                .from('journal-media')
                                .getPublicUrl(fileName);
                            setAudioUrl(publicUrlData.publicUrl);
                        } else {
                            console.error('Upload failed:', error);
                        }
                    })
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
      } else {
          fileInputRef.current?.click();
      }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
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
  }

  const handleFinalSubmit = () => {
       onAddEntry(
           content, 
           selectedMood, 
           hasImage ? EntryType.Photo : (audioUrl ? EntryType.Voice : EntryType.Prompt), 
           dailyPrompt, 
           isPrivate, 
           audioUrl || undefined, 
           imagePreview || undefined
       );
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
               {!isPrivate ? `Belluh will remind ${partnerName} tonight.` : "Saved to your private vault."}
           </p>
        </div>
      ) : (
        <div className="relative flex-1 flex flex-col">
            <div className={`transition-all duration-500 flex-1 flex flex-col ${step === 'write' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none absolute inset-0'}`}>
                <div className="mb-8 mt-4">
                    <p className="text-xs font-bold text-belluh-400 uppercase tracking-widest mb-3">Daily Ritual</p>
                    <p className="text-2xl text-slate-800 font-serif leading-tight">{dailyPrompt}</p>
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
                    {(audioUrl || isUploading) && !isRecording && (
                        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-slide-up">
                            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white">
                                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
                            </div>
                            <div className="flex-1 text-xs font-bold">
                                {isUploading ? "Syncing Audio..." : "Voice Note Ready"}
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
                <div className="mt-auto pt-6 flex items-center justify-between">
                    <div className="flex gap-2">
                         <button onClick={handleMicClick} disabled={isBusy} className={`h-12 px-5 rounded-full flex items-center gap-2 transition-all ${isRecording ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-500'}`}>
                            {isRecording ? <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> : (isTranscribing ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />)}
                        </button>
                        {!isRecording && !isBusy && <button onClick={handleImageClick} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${hasImage ? 'bg-belluh-50 text-belluh-600' : 'bg-slate-50 text-slate-500'}`}><ImageIcon size={18} /></button>}
                    </div>
                    {(content.trim() || hasImage || audioUrl) && !isRecording && !isBusy && (
                        <button onClick={handleNext} className="h-12 px-8 bg-slate-900 text-white rounded-full font-bold text-sm flex items-center gap-2">
                            <span>Next</span> <Send size={14} />
                        </button>
                    )}
                </div>
            </div>
            <div className={`transition-all duration-500 flex flex-col h-full ${step === 'mood' ? 'opacity-100 scale-100 z-10' : 'opacity-0 translate-x-10 pointer-events-none absolute inset-0'}`}>
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="text-slate-800 font-serif text-2xl">How did this feel?</h3>
                    <button onClick={() => setStep('write')} className="text-xs font-bold text-slate-400 uppercase tracking-widest">Back</button>
                 </div>
                 <div className="grid grid-cols-4 gap-4 mb-auto">
                    {Object.values(Mood).map((m) => (
                        <button key={m} onClick={() => setSelectedMood(m)} className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${selectedMood === m ? 'bg-white shadow-apple ring-2 ring-belluh-300' : 'bg-slate-50/50'}`}>
                        <span className="text-3xl">{MOOD_EMOJIS[m]}</span>
                        </button>
                    ))}
                 </div>
                 <div className="space-y-4 mb-8">
                     <div className="bg-slate-50 p-1.5 rounded-xl flex">
                         <button onClick={() => setIsPrivate(false)} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${!isPrivate ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}><Globe size={14} className="inline mr-2" />Share</button>
                         <button onClick={() => setIsPrivate(true)} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${isPrivate ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}><Lock size={14} className="inline mr-2" />Private</button>
                     </div>
                 </div>
                 <button onClick={handleFinalSubmit} disabled={!selectedMood} className={`w-full py-4 rounded-full font-bold text-sm shadow-xl flex items-center justify-center gap-2 ${selectedMood ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-300'}`}>
                    <span>Save to Story</span> <Send size={16} />
                 </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Journal;