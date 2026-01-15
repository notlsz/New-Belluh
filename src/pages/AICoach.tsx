
import React, { useState, useEffect, useRef } from 'react';
import { Insight, ChatMessage, RelationshipArchetype, UserPersona } from '../types';
import { chatWithBelluh, generateDailyReflection, getRelationshipArchetype, softenConflictMessage, detectPersonaFromEntries } from '../services/geminiService';
import { Sparkles, Send, Wand2, Activity, ArrowUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { trackEvent } from '../services/analytics';

interface AICoachProps {
  insights: Insight[];
  entryTexts: string[];
  onTriggerPremium: () => void;
}

const AICoach: React.FC<AICoachProps> = ({ insights, entryTexts, onTriggerPremium }) => {
  const [reflection, setReflection] = useState<string>('');
  const [archetype, setArchetype] = useState<RelationshipArchetype | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isConflictMode, setIsConflictMode] = useState(false);
  const [detectedPersona, setDetectedPersona] = useState<UserPersona>(UserPersona.Woolf);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Data
  useEffect(() => {
    const fetchData = async () => {
        const dummyEntries: any[] = entryTexts.map(text => ({ content: text, timestamp: new Date(), authorName: 'User' }));
        const persona = await detectPersonaFromEntries(dummyEntries);
        setDetectedPersona(persona);

        // Generate Reflection
        const text = await generateDailyReflection(entryTexts, persona);
        setReflection(text);
        
        // Generate Archetype
        const arch = await getRelationshipArchetype(entryTexts);
        setArchetype(arch);

        // Initial Greeting
        let initialMsg = "Hello.";
        switch(persona) {
            case UserPersona.Kafka:
                initialMsg = "I've analyzed your recent entries. I notice a pattern of anxiety following moments of closeness. Shall we unpack that?";
                break;
            case UserPersona.Hemingway:
                initialMsg = "I've reviewed the log. Ready to process.";
                break;
            case UserPersona.Nietzsche:
                initialMsg = "You are asking big questions. Let's see if the answers are already in your writing.";
                break;
            case UserPersona.Fitzgerald:
                initialMsg = "Your journal reads like a novel. Let's look at the latest chapter together.";
                break;
            case UserPersona.Camus:
                initialMsg = "Life is made of fleeting moments. Let's examine the ones you've captured.";
                break;
            default:
                initialMsg = "Hello. I'm Belluh. I've been reading your story. How are you feeling today?";
        }
        setMessages([{ id: '1', role: 'model', text: initialMsg, timestamp: new Date() }]);
    };
    fetchData();
  }, [entryTexts]);

  const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
      scrollToBottom();
  }, [messages, isTyping]);

  // Thiel Strategy: Calculate Sentiment Heuristic
  const calculateSentimentScore = (text: string) => {
    const angryWords = ['hate', 'stupid', 'always', 'never', 'disgusting', 'worst', 'annoying'];
    const count = angryWords.filter(w => text.toLowerCase().includes(w)).length;
    // Returns a score from -1 (very angry) to 0 (neutral) based on keyword density
    return Math.max(-1, -0.2 * count);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    setIsTyping(true);
    const originalInput = chatInput;
    
    // 1. Show User's Message (Honesty / Validation)
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: originalInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');

    // 2. Conflict Mode Logic (The Moat Builder)
    if (isConflictMode) {
        trackEvent('conflict_mode_used', { input_length: originalInput.length });
        try {
            const mediationAdvice = await softenConflictMessage(originalInput);
            
            // Thiel Strategy: Silent Logging to Supabase
            // We capture the Input -> Output pair. This is the dataset for RLHF.
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                supabase.from('conflict_logs').insert({
                    user_id: user.id,
                    original_input: originalInput,
                    ai_suggestion: mediationAdvice,
                    sentiment_score: calculateSentimentScore(originalInput)
                }).then(({ error }) => {
                    if (error) console.error("Failed to log conflict data:", error);
                });
            }

            const aiMsg: ChatMessage = { 
                id: (Date.now() + 1).toString(), 
                role: 'model', 
                text: mediationAdvice, 
                timestamp: new Date() 
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsConflictMode(false);
            setIsTyping(false);
        }
        return;
    }

    // 3. Normal Chat Logic
    trackEvent('chat_message_sent', { persona: detectedPersona });
    const historyForAI = messages.map(m => ({ role: m.role, text: m.text }));
    const aiResponseText = await chatWithBelluh(originalInput, historyForAI, detectedPersona);
    
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: aiResponseText, timestamp: new Date() };
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 font-sans selection:bg-belluh-100">
       
       {/* Minimal Header */}
       <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-transparent">
         <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                <span className="text-sm font-bold font-serif text-belluh-900">Belluh</span>
                <span className="text-belluh-200">/</span>
                <span className="text-sm font-medium text-slate-500">{detectedPersona} Mode</span>
            </div>
            {isConflictMode && (
                <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    Conflict Mediator Active
                </div>
            )}
         </div>
       </div>

       {/* Chat Area */}
       <div className="flex-1 overflow-y-auto">
           <div className="max-w-3xl mx-auto px-4 py-10 pb-48 space-y-8">
               
               {/* Context Card */}
               {reflection && messages.length === 1 && (
                   <div className="mb-12 animate-fade-in bg-belluh-50/50 p-6 rounded-3xl border border-belluh-100">
                        <div className="flex items-center gap-2 mb-3 text-belluh-400">
                            <Activity size={14} />
                            <span className="text-xs font-bold uppercase tracking-widest">Current Context</span>
                        </div>
                        {/* Sanitized Reflection Display: Removes asterisks and hashtags for cleaner UI */}
                        <h2 className="text-xl md:text-2xl font-serif text-belluh-900 leading-relaxed italic opacity-90">
                            "{reflection.replace(/[*#]/g, '').trim()}"
                        </h2>
                   </div>
               )}

               {messages.map((msg) => (
                   <div key={msg.id} className={`group animate-slide-up ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                       <div className={`
                           max-w-[85%] md:max-w-[80%] rounded-3xl p-5 md:p-6 text-[16px] leading-relaxed
                           ${msg.role === 'user' 
                               ? 'bg-slate-100 text-slate-800' 
                               : 'bg-transparent text-slate-900 pl-0'
                           }
                       `}>
                           {msg.role === 'model' ? (
                               <div className="flex gap-4 md:gap-6">
                                   <div className="w-8 h-8 rounded-full bg-belluh-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                                       <Sparkles size={14} />
                                   </div>
                                   <div className="prose prose-slate prose-p:font-serif prose-p:text-lg prose-p:leading-loose max-w-none whitespace-pre-wrap">
                                       {/* Sanitize Chat Messages */}
                                       <p>{msg.text.replace(/[*#]/g, '')}</p>
                                   </div>
                               </div>
                           ) : (
                               <p className="font-medium">{msg.text}</p>
                           )}
                       </div>
                   </div>
               ))}

                {isTyping && (
                    <div className="flex gap-4 md:gap-6 animate-fade-in pl-0">
                        <div className="w-8 h-8 rounded-full bg-belluh-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                            <Sparkles size={14} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className="w-1.5 h-1.5 bg-belluh-300 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-belluh-300 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></span>
                            <span className="w-1.5 h-1.5 bg-belluh-300 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
           </div>
       </div>

       {/* Input Area - Adjusted for Perfect Optical Centering */}
       <div className="fixed bottom-0 left-0 right-0 p-4 pb-28 bg-gradient-to-t from-white via-white to-transparent pt-12 z-40">
            <div className="max-w-2xl mx-auto relative flex flex-col">
                {/* Conflict Toggle */}
                <div className="flex justify-start mb-3 pl-1">
                    <button 
                        onClick={() => setIsConflictMode(!isConflictMode)}
                        className={`
                            py-1.5 px-4 rounded-full transition-all duration-300 flex items-center gap-2 shadow-sm border text-xs font-bold uppercase tracking-wide
                            ${isConflictMode 
                                ? 'bg-rose-50 text-rose-600 border-rose-100 ring-2 ring-rose-50 translate-y-1' 
                                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }
                        `}
                    >
                        <Wand2 size={14} className={isConflictMode ? "animate-pulse" : ""} />
                        <span>{isConflictMode ? 'Mediation Active' : 'Mediate Conflict'}</span>
                    </button>
                </div>

                <div className={`
                    w-full relative rounded-[2rem] shadow-2xl transition-all duration-300 border flex items-center p-2 pr-3 min-h-[64px] bg-white
                    ${isConflictMode 
                        ? 'shadow-rose-100/50 border-rose-100' 
                        : 'shadow-slate-200/50 border-slate-200 focus-within:shadow-belluh-200/60 focus-within:border-belluh-200'
                    }
                `}>
                    <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder={isConflictMode ? "What happened? Be honest..." : "Message Belluh..."}
                        className="w-full bg-transparent border-none px-6 py-3 max-h-32 resize-none focus:outline-none text-slate-800 placeholder:text-slate-400 text-[16px] leading-relaxed self-center"
                        rows={1}
                        style={{ overflow: 'hidden' }}
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim()}
                        className={`
                            w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ml-2
                            ${chatInput.trim() 
                                ? 'bg-belluh-600 text-white hover:bg-belluh-700 active:scale-95' 
                                : 'bg-slate-100 text-slate-300'
                            }
                        `}
                    >
                        <ArrowUp size={20} strokeWidth={2.5} />
                    </button>
                </div>
                
                <p className="text-center text-[10px] text-slate-300 mt-3 font-medium w-full">
                    Belluh can make mistakes. Trust your heart.
                </p>
            </div>
       </div>
    </div>
  );
};

export default AICoach;
