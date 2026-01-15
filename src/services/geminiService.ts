
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { JournalEntry, Insight, RelationshipArchetype, UserPersona, RelationshipReceipt, RelationshipForecast } from "../types";

// Helper to initialize AI client just-in-time
const getAI = () => {
  // Configured via vite.config.ts define
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("Belluh AI Error: API Key is missing. Please check your Vercel Environment Variables.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

// Helper to handle errors gracefully
const handleGeminiError = (error: any, fallback: any) => {
  const isRateLimit = error?.status === 429 || error?.code === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED");
  
  if (isRateLimit) {
    console.warn("Belluh AI: Rate limit exceeded. Using fallback data for this request.");
  } else {
    console.error("Gemini API Error:", error);
  }
  return fallback;
};

// Retry helper with exponential backoff for rate limits
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || error?.code === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED");
    const isServerSide = error?.status >= 500;

    if ((isRateLimit || isServerSide) && retries > 0) {
      // Exponential backoff: 2s -> 4s -> 8s with jitter
      const waitTime = delay * 2 + Math.floor(Math.random() * 500); 
      // console.debug(`Belluh AI: Retrying operation in ${waitTime}ms... (${retries} attempts left)`);
      await new Promise(r => setTimeout(r, waitTime));
      return retryOperation(operation, retries - 1, waitTime);
    }
    throw error;
  }
}

export const generateFutureLetter = async (entries: JournalEntry[], userName: string, partnerName: string): Promise<string> => {
  const context = entries.slice(0, 20).map(e => e.content).join('\n');
  try {
    const prompt = `You are writing a letter from Future ${userName} & ${partnerName} (5 years from now) looking back at where they are today. Based on their current journal entries, extrapolate what their relationship will look like if they continue on this exact trajectory without change.

If the entries show:
- Strong communication, love, positivity, growth → Write about a thriving, deepening partnership
- Distance, less talking, arguments, doubt, coldness → Write about a relationship that drifted apart or ended, serving as a wake-up call
- Mixed signals or uncertainty → Write about a relationship at a crossroads

Make it deeply personal. Mimic their writing style. Be honest but compassionate. This should feel like a genuine letter from their future selves—a reality check or affirmation of where they're headed.

Do not use asterisks, hashtags, or markdown. Make it feel handwritten and authentic.

Entries:
${context}`;

    const response = await retryOperation<GenerateContentResponse>(() => 
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      })
    );
    return response.text || "The future is unwritten. What will you choose?";
  } catch (e) {
    return handleGeminiError(e, "A letter to your future selves...");
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const aiPromise = retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio,
              },
            },
            { text: "Transcribe the following audio exactly as spoken. Return ONLY the verbatim transcript. Do not add any introductory or concluding remarks. Do not summarize. Do not use markdown formatting. Just the raw text of what was said." },
          ]
        }
      })
    );

    // Add 15-second timeout to prevent hanging UI
    const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Transcription timed out")), 15000)
    );

    const response = await Promise.race([aiPromise, timeoutPromise]);
    return response.text || "";
  } catch (e) {
    return handleGeminiError(e, "");
  }
};

export const askBelluhAboutJournal = async (query: string, entries: JournalEntry[]): Promise<string> => {
  try {
    const context = entries.slice(0, 30).map(e => `[${e.authorName}]: ${e.content}`).join('\n');
    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Context:\n${context}\n\nQuestion: ${query}`
      })
    );
    return response.text || "I'm not sure, but your bond seems strong.";
  } catch (e) {
    return handleGeminiError(e, "I'm listening...");
  }
};

export const generateRelationshipSummary = async (entries: JournalEntry[]): Promise<string> => {
  try {
    const context = entries.slice(0, 20).map(e => e.content).join('\n');
    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a concise, 2-3 sentence summary of the relationship's current state based on these entries. Be honest but compassionate. Focus on the core emotional trajectory (growing closer, drifting, conflict, or harmony). Keep it brief and glanceable. Do not use hashtags, asterisks, or markdown formatting. Just pure text.\n\nContext:\n${context}`
      })
    );
    return response.text || "You are walking through something together.";
  } catch (e) {
    return handleGeminiError(e, "A moment in your journey...");
  }
};

export const detectPatterns = async (entries: JournalEntry[]): Promise<Insight[]> => {
  try {
    // Require at least some context
    if (entries.length === 0) return [];

    // Pass IDs in context so AI can reference them in relatedEntryIds
    // Increased context window to 50 entries to catch older patterns
    const context = entries.slice(0, 50).map(e => `ID: ${e.id} | Date: ${e.timestamp.toDateString()} | Content: ${e.content}`).join('\n');
    
    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Identify patterns in these entries. Return as JSON array of objects. 
        For 'relatedEntryIds', you MUST pick 1-3 specific 'ID's from the provided list that are the strongest evidence for that pattern.
        
        Entries:
        ${context}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                type: { 
                  type: Type.STRING,
                  enum: ['Weekly', 'Pattern', 'Suggestion', 'Growth', 'Pulse', 'Archetype', 'Spiral', 'Nostalgia']
                },
                relatedEntryIds: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                }
              },
              required: ['id', 'title', 'content', 'type', 'relatedEntryIds']
            }
          }
        }
      })
    );
    
    // Robust cleanup to ensure valid JSON parsing even if model returns markdown block
    const rawText = response.text || "[]";
    const cleanText = rawText.replace(/```json\n?|\n?```/g, '').trim();
    
    return JSON.parse(cleanText);
  } catch (e) {
    return handleGeminiError(e, []);
  }
};

export const chatWithBelluh = async (message: string, history: { role: string, text: string }[], persona: UserPersona): Promise<string> => {
  try {
    const context = history.map(h => `${h.role === 'model' ? 'Belluh' : 'User'}: ${h.text}`).join('\n');
    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Persona Style: ${persona}\n\nRecent History:\n${context}\n\nUser: ${message}\nBelluh (Use plain text only, no markdown, no asterisks):`
      })
    );
    // Strip markdown artifacts
    const raw = response.text || "Tell me more.";
    return raw.replace(/[*#_]/g, '').trim();
  } catch (e) {
    return handleGeminiError(e, "I'm here for you.");
  }
};

export const generateDailyReflection = async (entryTexts: string[], persona: UserPersona): Promise<string> => {
  try {
    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a concise, 1-2 sentence reflection based on these entries using the ${persona} persona. Output plain text only. Do not use asterisks, bolding, hashtags, or headers.\n\nEntries:\n${entryTexts.join('\n')}`
      })
    );
    const text = response.text || "Reflecting on your day...";
    // Robust sanitization against Markdown artifacts
    return text.replace(/[*#_]/g, '').trim();
  } catch (e) {
    return "A moment of reflection.";
  }
};

export const getRelationshipArchetype = async (entryTexts: string[]): Promise<RelationshipArchetype> => {
  try {
    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Determine the archetype for this relationship based on these entries:\n\n${entryTexts.slice(0, 10).join('\n')}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              strength: { type: Type.STRING },
              growthArea: { type: Type.STRING }
            },
            required: ['name', 'description', 'strength', 'growthArea']
          }
        }
      })
    );
    
    // Cleanup
    const rawText = response.text || "{}";
    const cleanText = rawText.replace(/```json\n?|\n?```/g, '').trim();
    
    return JSON.parse(cleanText);
  } catch (e) {
    return {
      name: "Partners",
      description: "Walking together",
      strength: "Resilience",
      growthArea: "Communication",
    };
  }
};

export const softenConflictMessage = async (text: string): Promise<string> => {
  try {
    const prompt = `You are a wise, empathetic friend helping a couple communicate. The user is upset and wants to say: "${text}".

1. First, validate their feeling in one short sentence (e.g., "I hear that you're hurt," or "It makes sense you're frustrated").
2. Then, provide 3 distinct options to help them express this need without attacking, formatted clearly:
   - Option A: Vulnerable (Focus on "I feel" and the underlying need)
   - Option B: Constructive (Focus on the solution/future)
   - Option C: Low-Key (Casual but clear, for lower tension)

Return ONLY plain text. Do NOT use markdown. Do NOT use asterisks (*), bolding (**), or bullet points. Use simple numbering or newlines. Keep the tone warm and supportive.`;

    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      })
    );
    
    // Force strip any remaining markdown artifacts to ensure clean "friend-like" text
    let cleanText = response.text || "Let's take a breath and try to say that with love.";
    cleanText = cleanText.replace(/\*\*/g, '').replace(/\*/g, '').replace(/###/g, '');
    
    return cleanText;
  } catch (e) {
    return "I can see you're upset. Maybe try starting with 'I feel...' instead of 'You always...'";
  }
};

export const detectPersonaFromEntries = async (entries: any[]): Promise<UserPersona> => {
  try {
    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Match this writing style to ONE of: Kafka, Hemingway, Nietzsche, Fitzgerald, Camus, or Woolf. Return ONLY the name, nothing else.\n\n${entries
          .slice(0, 5)
          .map(e => e.content)
          .join('\n')}`
      })
    );
    const match = response.text?.trim();
    return (match as UserPersona) || UserPersona.Woolf;
  } catch (e) {
    return UserPersona.Woolf;
  }
};

// --- THIEL UPGRADE: VIRAL DISTRIBUTION ENGINE ---
export const generateRelationshipReceipt = async (entries: JournalEntry[], coupleName: string): Promise<RelationshipReceipt> => {
    try {
        const context = entries.slice(0, 20).map(e => e.content).join('\n');
        
        const response = await retryOperation<GenerateContentResponse>(() => 
            getAI().models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Generate a funny, witty 'Relationship Receipt' based on these journal entries for ${coupleName}. 
                It should look like a store receipt of their love life.
                Items should be abstract emotional transactions (e.g., 'Late Night Talks', 'Patience', 'Bad Puns').
                Price should be abstract values (e.g., '3 hrs sleep', 'Priceless', '1 Headache').
                
                Context: ${context}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            merchantName: { type: Type.STRING },
                            date: { type: Type.STRING },
                            items: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        qty: { type: Type.NUMBER },
                                        desc: { type: Type.STRING },
                                        price: { type: Type.STRING },
                                    },
                                    required: ['qty', 'desc', 'price']
                                }
                            },
                            subtotal: { type: Type.STRING },
                            tax: { type: Type.STRING },
                            total: { type: Type.STRING },
                            footerQuote: { type: Type.STRING }
                        },
                        required: ['merchantName', 'items', 'total', 'footerQuote']
                    }
                }
            })
        );
        
        const rawText = response.text || "{}";
        const cleanText = rawText.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleanText);

    } catch (e) {
        // Fallback Receipt
        return {
            merchantName: "Belluh Inc.",
            date: new Date().toLocaleDateString(),
            items: [
                { qty: 1, desc: "Technical Difficulty", price: "$0.00" },
                { qty: 100, desc: "Love", price: "Priceless" }
            ],
            subtotal: "Infinite",
            tax: "0.00",
            total: "Forever",
            footerQuote: "Love is the only currency."
        };
    }
};

// --- THIEL UPGRADE: PROPRIETARY INTELLIGENCE ENGINE ---
export const generateRelationshipForecast = async (entries: JournalEntry[]): Promise<RelationshipForecast> => {
    try {
        const context = entries.slice(0, 15).map(e => `${e.timestamp.toDateString()}: ${e.mood} - ${e.content}`).join('\n');
        
        const response = await retryOperation<GenerateContentResponse>(() => 
            getAI().models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Analyze the 'Emotional Velocity' and 'Sentiment Volatility' of these entries to predict the relationship 'weather' for the next 3 days.
                Be analytical like a data scientist but empathetic like a friend.
                
                Context: ${context}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            weather: { 
                                type: Type.STRING, 
                                enum: ['Sunny', 'Cloudy', 'Stormy', 'Clear Skies']
                            },
                            temperature: { type: Type.NUMBER, description: "0-100 Synergy Score" },
                            forecast: { type: Type.STRING },
                            velocity: { 
                                type: Type.STRING,
                                enum: ['Accelerating', 'Stable', 'Decelerating']
                            }
                        },
                        required: ['weather', 'temperature', 'forecast', 'velocity']
                    }
                }
            })
        );
         const rawText = response.text || "{}";
         const cleanText = rawText.replace(/```json\n?|\n?```/g, '').trim();
         return JSON.parse(cleanText);

    } catch (e) {
        return {
            weather: 'Clear Skies',
            temperature: 85,
            forecast: "Data unavailable, but the horizon looks bright.",
            velocity: 'Stable'
        };
    }
}
