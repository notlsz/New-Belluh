

export enum Mood {
  Amazing = 'Amazing',
  Good = 'Good',
  Neutral = 'Neutral',
  Tired = 'Tired',
  Stressed = 'Stressed',
  Romantic = 'Romantic',
  Grateful = 'Grateful',
  Playful = 'Playful',
  Anxious = 'Anxious', // Added for Kafka users
}

export enum EntryType {
  Prompt = 'Prompt',
  Freeform = 'Freeform',
  Voice = 'Voice',
  Photo = 'Photo',
  Milestone = 'Milestone',
}

export enum CircleType {
  Couple = 'Couple',
  Family = 'Family',
  Friends = 'Friends',
  Custom = 'Custom',
}

export enum CircleStatus {
  Active = 'Active',
  Archived = 'Archived',
}

export enum UserPersona {
  Kafka = 'Kafka', // Anxious, frequent, text-heavy, spiral-prone
  Hemingway = 'Hemingway', // Minimalist, factual, avoidant
  Nietzsche = 'Nietzsche', // Philosophical, streaks, growth-focused
  Fitzgerald = 'Fitzgerald', // Romantic, photo-heavy, nostalgic
  Camus = 'Camus', // Ephemeral, voice, moment-based, situationship
  Woolf = 'Woolf', // Literary, introspective (Default)
  Undetected = 'Undetected'
}

export interface Circle {
  id: string;
  name: string;
  type: CircleType;
  status: CircleStatus;
  members: string[]; // User IDs
  memberProfiles?: { id: string; name: string; avatar: string }[]; // Rich profile data
  themeColor?: string;
  avatar?: string;
  startDate?: Date;
  endDate?: Date;
}

export type ColorTheme = 'pink' | 'blue' | 'green' | 'peach' | 'lavender' | 'butter';

export interface UserSettings {
  notifications: boolean;
  biometricLock: boolean;
  theme: 'light' | 'dark' | 'system';
  colorTheme: ColorTheme;
  dailyReminderTime: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  partnerName?: string | null;
  partnerAvatar?: string;
  circles: Circle[];
  isPremium: boolean;
  joinDate: Date;
  activeCircleId: string;
  settings: UserSettings;
  hasCompletedOnboarding: boolean;
  detectedPersona: UserPersona; // The AI adapts to this
  relationshipFacts?: string; // Stored as JSON string
}

export interface JournalEntry {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: Date;
  type: EntryType;
  mood?: Mood;
  prompt?: string;
  mediaUrl?: string; // For photos
  audioUrl?: string; // For voice
  isPrivate: boolean;
  circleId: string;
  location?: string;
  likes?: number;
  isLiked?: boolean;
}

export interface RelationshipArchetype {
  name: string; // e.g., "Explorer + Anchor"
  description: string;
  strength: string;
  growthArea: string;
  
}

export interface Insight {
  id: string;
  title: string;
  content: string;
  type: 'Weekly' | 'Pattern' | 'Suggestion' | 'Growth' | 'Pulse' | 'Archetype' | 'Spiral' | 'Nostalgia';
  date: Date;
  actionLabel?: string;
  score?: number; // For Pulse metrics
  archetype?: RelationshipArchetype;
  relatedEntryIds?: string[]; // IDs of entries that triggered this pattern
}

export interface LoveLanguageStats {
  wordsOfAffirmation: number;
  qualityTime: number;
  receivingGifts: number;
  actsOfService: number;
  physicalTouch: number;
  primary: string;
  insight: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface LoveNote {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: Date;
  forUserId: string;
  authorId: string;
  style?: 'classic' | 'modern' | 'handwritten';
  circleId: string;
}

export interface Goal {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: Date;
}

// Thiel Distribution Strategy: The Viral Artifact
export interface RelationshipReceipt {
  merchantName: string; // "The Love Store" or "Belluh HQ"
  date: string;
  items: {
    qty: number;
    desc: string; // "Patience during movie selection"
    price: string; // "Priceless" or "2 hrs"
  }[];
  subtotal: string;
  tax: string; // "10% Stress"
  total: string; // "Infinite"
  footerQuote: string; // Witty AI generated footer
}

// Thiel Engineering Strategy: Predictive Data
export interface RelationshipForecast {
  weather: 'Sunny' | 'Cloudy' | 'Stormy' | 'Clear Skies';
  temperature: number; // 0-100 Synergy
  forecast: string; // "High probability of deep conversation this weekend based on rising intimacy velocity."
  velocity: 'Accelerating' | 'Stable' | 'Decelerating';
}

// Thiel Moat Strategy: The Truth Table
export interface ConflictLog {
  id: string;
  original_input: string;
  ai_suggestion: string;
  sentiment_score: number;
  created_at: string;
}

export interface PeaceMetrics {
  totalInteractions: number;
  averageSentiment: number;
  uniqueUsers: number;
  weeklyActiveUsers: number;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_name: string;
  properties: any;
  created_at: string;
}