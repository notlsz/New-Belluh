

import { User, JournalEntry, EntryType, Mood, Insight, Circle, CircleType, CircleStatus, UserPersona, ColorTheme } from './types';

export const THEMES: Record<ColorTheme, Record<number, string>> = {
  pink: {
    25: '#FFFCFD', 50: '#FFF5F7', 100: '#FFE4E9', 200: '#FFD0DB', 300: '#FFC5D3', 400: '#FFB0C0', 500: '#FF90A5', 600: '#E11D48', 900: '#881337'
  },
  blue: {
    25: '#F8FBFF', 50: '#F0F7FF', 100: '#E0F0FF', 200: '#D0E8FF', 300: '#BFD7FF', 400: '#93C5FD', 500: '#60A5FA', 600: '#2563EB', 900: '#1E3A8A'
  },
  green: {
    25: '#F9FCFA', 50: '#F2FBF5', 100: '#E6F7EB', 200: '#DCFCE7', 300: '#D4F4CD', 400: '#86EFAC', 500: '#4ADE80', 600: '#16A34A', 900: '#14532D'
  },
  peach: {
    25: '#FFFAF8', 50: '#FFF8F4', 100: '#FFF1E6', 200: '#FFE5D0', 300: '#FFD6A5', 400: '#FDBA74', 500: '#FB923C', 600: '#EA580C', 900: '#7C2D12'
  },
  lavender: {
    25: '#FBF9FF', 50: '#F7F4FF', 100: '#F3E8FF', 200: '#E9D5FF', 300: '#D8B4FE', 400: '#C084FC', 500: '#A855F7', 600: '#9333EA', 900: '#581C87'
  },
  butter: {
    25: '#FFFEFA', 50: '#FFFDF2', 100: '#FFF9DB', 200: '#FEF08A', 300: '#FFF1B8', 400: '#FACC15', 500: '#EAB308', 600: '#CA8A04', 900: '#713F12'
  },
  // More pastels: each a soft wash for the page and panels (25 to 100), a pastel accent (300) and deeper tones for text
  mint: {
    25: '#F8FDFB', 50: '#F0FBF6', 100: '#DDF5EA', 200: '#C3EEDB', 300: '#B5EAD7', 400: '#7DD3B4', 500: '#3FB68F', 600: '#1F8F6C', 900: '#0F4A38'
  },
  sky: {
    25: '#F7FCFE', 50: '#EEF8FC', 100: '#DCF0F8', 200: '#C5E6F3', 300: '#CDE9F2', 400: '#9BBECB', 500: '#6FA3B6', 600: '#3F7486', 900: '#1E3A44'
  },
  lilac: {
    25: '#FDFAFE', 50: '#F9F3FC', 100: '#F1E4F8', 200: '#E6D0F2', 300: '#DCC6F0', 400: '#C3A2E6', 500: '#A47BD6', 600: '#7E52B8', 900: '#40285E'
  },
  coral: {
    25: '#FFFAF9', 50: '#FFF3F1', 100: '#FFE3DE', 200: '#FFCFC6', 300: '#FFC1B6', 400: '#FF9D8C', 500: '#F7765F', 600: '#D9533C', 900: '#6E2519'
  },
  sage: {
    25: '#FAFCF9', 50: '#F3F7F1', 100: '#E5EEE1', 200: '#D3E2CC', 300: '#C9DBC0', 400: '#A3C196', 500: '#7FA46E', 600: '#5A7E4B', 900: '#2D4025'
  },
  periwinkle: {
    25: '#FAFAFF', 50: '#F3F4FF', 100: '#E4E7FE', 200: '#D2D7FC', 300: '#C7CEFA', 400: '#A1ABF3', 500: '#7A86E8', 600: '#5560CC', 900: '#272D66'
  },
  apricot: {
    25: '#FFFCF8', 50: '#FFF7EE', 100: '#FFEDD9', 200: '#FFE0BF', 300: '#FFD8B0', 400: '#FFBA7A', 500: '#F79A45', 600: '#D5771F', 900: '#6B3A0C'
  },
  seafoam: {
    25: '#F7FDFC', 50: '#EEFBF8', 100: '#D8F5EF', 200: '#BDEDE3', 300: '#B2E8DE', 400: '#78D4C3', 500: '#3BB8A2', 600: '#1E907E', 900: '#0E4840'
  },
  rose: {
    25: '#FFFAFC', 50: '#FEF2F7', 100: '#FCE2EE', 200: '#F9CCE1', 300: '#F0ADDD', 400: '#E78BC9', 500: '#D965AF', 600: '#B4428C', 900: '#5A1F45'
  },
  sand: {
    25: '#FDFCFA', 50: '#FAF7F2', 100: '#F3EDE3', 200: '#EAE1D1', 300: '#E3D7C3', 400: '#CDBA9A', 500: '#B19870', 600: '#8A734F', 900: '#463A27'
  }
};

export interface Organization {
  name: string;
  domain: string;
  logo?: string;
}

// Logos are served from belluh.com itself (public/logos), copied from Wikimedia Commons. Hotlinking Wikimedia got
// rate-limited (429) under load, which is why some logos used to fall back to plain text.
export const ORGANIZATIONS: Organization[] = [
  // Universities
  { 
    name: 'Oxford',
    domain: 'ox.ac.uk',
    logo: '/logos/ox-ac-uk.png'
  },
  { 
    name: 'Harvard',
    domain: 'harvard.edu',
    logo: '/logos/harvard-edu.png'
  },
  { 
    name: 'Yale',
    domain: 'yale.edu',
    logo: '/logos/yale-edu.png'
  },
  { 
    name: 'Princeton',
    domain: 'princeton.edu',
    logo: '/logos/princeton-edu.png'
  },
  { 
    name: 'Penn',
    domain: 'upenn.edu',
    logo: '/logos/upenn-edu.png'
  },
  { 
    name: 'Cornell',
    domain: 'cornell.edu',
    logo: '/logos/cornell-edu.png'
  },
  { 
    name: 'USC',
    domain: 'usc.edu',
    logo: '/logos/usc-edu.png'
  },
  { 
    name: 'UCLA',
    domain: 'ucla.edu',
    logo: '/logos/ucla-edu.png'
  },
  { 
    name: 'Cal',
    domain: 'berkeley.edu',
    logo: '/logos/berkeley-edu.png'
  },
  { 
    name: 'UNC',
    domain: 'unc.edu',
    logo: '/logos/unc-edu.png'
  },
  { 
    name: 'UMich',
    domain: 'umich.edu',
    logo: '/logos/umich-edu.png'
  },
  { 
    name: 'Waterloo',
    domain: 'uwaterloo.ca',
    logo: '/logos/uwaterloo-ca.png'
  },
  { 
    name: 'U of T',
    domain: 'utoronto.ca',
    logo: '/logos/utoronto-ca.png'
  },
  { 
    name: 'Rutgers',
    domain: 'rutgers.edu',
    logo: '/logos/rutgers-edu.png'
  },
  {
    name: 'Duke',
    domain: 'duke.edu',
    logo: '/logos/duke-edu.png'
  },
  {
    name: 'Stanford',
    domain: 'stanford.edu',
    logo: '/logos/stanford-edu.png'
  },
  {
    name: 'UChicago',
    domain: 'uchicago.edu',
    logo: '/logos/uchicago-edu.png'
  },
  // Tech & Finance
  {
    name: 'Amazon',
    domain: 'amazon.com',
    logo: '/logos/amazon-com.png'
  },
  {
    name: 'Microsoft',
    domain: 'microsoft.com',
    logo: '/logos/microsoft-com.png'
  },
  { 
    name: 'Google',
    domain: 'google.com',
    logo: '/logos/google-com.png'
  },
  { 
    name: 'Meta',
    domain: 'meta.com',
    logo: '/logos/meta-com.png'
  },
  { 
    name: 'OpenAI',
    domain: 'openai.com',
    logo: '/logos/openai-com.png'
  },
  { 
    name: 'Perplexity',
    domain: 'perplexity.ai',
    logo: '/logos/perplexity-ai.png'
  },
  { 
    name: 'Apple',
    domain: 'apple.com',
    logo: '/logos/apple-com.png'
  },
  { 
    name: 'NVIDIA',
    domain: 'nvidia.com',
    logo: '/logos/nvidia-com.png'
  },
  { 
    name: 'Palantir',
    domain: 'palantir.com',
    logo: '/logos/palantir-com.png'
  },
  { 
    name: 'Jane Street',
    domain: 'janestreet.com',
    logo: '/logos/janestreet-com.png'
  },
  { 
    name: 'Goldman Sachs',
    domain: 'goldmansachs.com',
    logo: '/logos/goldmansachs-com.png'
  },
  { 
    name: 'Coinbase',
    domain: 'coinbase.com',
    logo: '/logos/coinbase-com.png'
  },
  { 
    name: 'Stripe',
    domain: 'stripe.com',
    logo: '/logos/stripe-com.png'
  },
  { 
    name: 'Airbnb',
    domain: 'airbnb.com',
    logo: '/logos/airbnb-com.png'
  },
  { 
    name: 'Uber',
    domain: 'uber.com',
    logo: '/logos/uber-com.png'
  },
  { 
    name: 'Lyft',
    domain: 'lyft.com',
    logo: '/logos/lyft-com.png'
  },
  { 
    name: 'TikTok',
    domain: 'tiktok.com',
    logo: '/logos/tiktok-com.png'
  },
  { 
    name: 'Snapchat',
    domain: 'snapchat.com',
    logo: '/logos/snapchat-com.png'
  },
  { 
    name: 'Discord',
    domain: 'discord.com',
    logo: '/logos/discord-com.png'
  },
  { 
    name: 'Spotify',
    domain: 'spotify.com',
    logo: '/logos/spotify-com.png'
  },
  { 
    name: 'HP',
    domain: 'hp.com',
    logo: '/logos/hp-com.png'
  },
  { 
    name: 'Nike',
    domain: 'nike.com',
    logo: '/logos/nike-com.png'
  },
  { 
    name: 'Adidas',
    domain: 'adidas.com',
    logo: '/logos/adidas-com.png'
  },
  { 
    name: 'Under Armour',
    domain: 'underarmour.com',
    logo: '/logos/underarmour-com.png'
  },
];

export const MOCK_CIRCLES: Circle[] = [
  {
    id: 'c1',
    name: 'Alex & Jamie',
    type: CircleType.Couple,
    status: CircleStatus.Active,
    members: ['u1', 'u2'],
    themeColor: '#f0addd',
    avatar: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=150&q=80',
    startDate: new Date('2024-02-14')
  },
  {
    id: 'c2',
    name: 'The Fam',
    type: CircleType.Family,
    status: CircleStatus.Active,
    members: ['u1', 'u3', 'u4'],
    themeColor: '#93c5fd',
    avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=150&q=80',
    startDate: new Date('2023-01-01')
  },
  {
    id: 'c_ex',
    name: 'Alex & Taylor',
    type: CircleType.Couple,
    status: CircleStatus.Archived,
    members: ['u1', 'ux'],
    themeColor: '#cbd5e1',
    avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=150&q=80',
    startDate: new Date('2022-01-01'),
    endDate: new Date('2023-12-01')
  }
];

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Alex',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  partnerName: 'Jamie',
  partnerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
  circles: MOCK_CIRCLES,
  isPremium: true,
  joinDate: new Date('2024-02-14'),
  activeCircleId: 'c1',
  settings: {
    notifications: true,
    biometricLock: false,
    theme: 'light',
    colorTheme: 'pink',
    dailyReminderTime: '20:00'
  },
  hasCompletedOnboarding: false, 
  detectedPersona: UserPersona.Undetected
};

export const MOCK_ENTRIES: JournalEntry[] = [
  {
    id: 'e1',
    userId: 'u1',
    authorName: 'Alex',
    authorAvatar: CURRENT_USER.avatar,
    content: 'We found that tiny jazz bar in the West Village. The way you looked at me when the sax started playing... I never want to forget that. It felt like time stopped.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
    type: EntryType.Freeform,
    mood: Mood.Romantic,
    circleId: 'c1',
    isPrivate: false,
    location: 'West Village, NYC',
    likes: 2,
    isLiked: true
  },
  {
    id: 'e2',
    userId: 'u2', // Partner
    authorName: 'Jamie',
    authorAvatar: CURRENT_USER.partnerAvatar || '',
    content: 'I felt really heard when we talked about our summer plans. Thank you for listening to my worries about taking time off. It means the world.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    type: EntryType.Prompt,
    prompt: 'When did you feel most connected today?',
    mood: Mood.Grateful,
    circleId: 'c1',
    isPrivate: false,
    likes: 1,
    isLiked: false
  },
  {
    id: 'e2b',
    userId: 'u1', // Current User answering SAME prompt
    authorName: 'Alex',
    authorAvatar: CURRENT_USER.avatar,
    content: 'When we were cooking dinner and you bumped into me and just held me for a second. Simple but perfect.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4.5), // similar time
    type: EntryType.Prompt,
    prompt: 'When did you feel most connected today?',
    mood: Mood.Romantic,
    circleId: 'c1',
    isPrivate: false,
    likes: 4,
    isLiked: true
  },
  // ANXIOUS ENTRIES (Kafka Mode) - Trigger Spiral Detection
  {
    id: 'e3',
    userId: 'u1',
    authorName: 'Alex',
    authorAvatar: CURRENT_USER.avatar,
    content: 'I feel like Jamie is pulling away again. The texts are shorter. Did I say something wrong yesterday?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    type: EntryType.Freeform,
    mood: Mood.Anxious,
    circleId: 'c1', 
    isPrivate: true, 
    likes: 0,
    isLiked: false
  },
  {
    id: 'e3b',
    userId: 'u1',
    authorName: 'Alex',
    authorAvatar: CURRENT_USER.avatar,
    content: 'Still worried about the distance. It feels like the silence is loud.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    type: EntryType.Freeform,
    mood: Mood.Anxious,
    circleId: 'c1',
    isPrivate: true,
    likes: 0,
    isLiked: false
  },
  {
    id: 'e3c',
    userId: 'u1',
    authorName: 'Alex',
    authorAvatar: CURRENT_USER.avatar,
    content: 'Why do I always feel this fear when things are going well? I am scared of ruining it.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    type: EntryType.Freeform,
    mood: Mood.Anxious,
    circleId: 'c1',
    isPrivate: true,
    likes: 0,
    isLiked: false
  },
  {
    id: 'e4',
    userId: 'u1',
    authorName: 'Alex',
    authorAvatar: CURRENT_USER.avatar,
    content: '',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    type: EntryType.Photo,
    // Updated to Locust Walk image
    mediaUrl: '/locust-walk.jpg',
    prompt: 'A moment of joy',
    circleId: 'c1',
    isPrivate: false,
    likes: 12,
    isLiked: true
  },
  // PAST RELATIONSHIP ENTRIES
  {
    id: 'ex1',
    userId: 'u1',
    authorName: 'Alex',
    authorAvatar: CURRENT_USER.avatar,
    content: 'The end. It hurts, but I know it is for the best. We grew apart.',
    timestamp: new Date('2023-12-01'),
    type: EntryType.Freeform,
    mood: Mood.Stressed,
    circleId: 'c_ex',
    isPrivate: true,
    likes: 0
  }
];

export const MOCK_INSIGHTS: Insight[] = [
  {
    id: 'i1',
    title: 'Growth Loop',
    content: 'This week, you both mentioned "calm" and "home" frequently. You are building a sanctuary together.',
    type: 'Growth',
    date: new Date(),
    actionLabel: 'View'
  }
];

export const DAILY_PROMPTS = [
  "What's one tiny moment from today you want to remember?",
  "How did your partner make you smile today?",
  "What is one thing you are grateful for right now?",
  "Reflect on a challenge you overcame together recently.",
  "What is your favorite memory of us from last year?",
  "Describe your partner in three words today.",
  "What's a new adventure you want to take together?"
];

export const MOOD_EMOJIS: Record<string, string> = {
  [Mood.Amazing]: '🤩',
  [Mood.Good]: '😊',
  [Mood.Neutral]: '😐',
  [Mood.Tired]: '😴',
  [Mood.Stressed]: '😰',
  [Mood.Romantic]: '🥰',
  [Mood.Grateful]: '🙏',
  [Mood.Playful]: '😜',
  [Mood.Anxious]: '🌪️',
};

// ... (Legal Text omitted for brevity, unchanged) ...
export const TOS_TEXT = `BELLUH AI - TERMS OF SERVICE...`;
export const PRIVACY_POLICY_TEXT = `BELLUH AI - PRIVACY POLICY...`;