

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
  }
};

export interface Organization {
  name: string;
  domain: string;
  logo?: string;
}

export const ORGANIZATIONS: Organization[] = [
  // Universities
  { 
    name: 'Oxford', 
    domain: 'ox.ac.uk',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/University_of_Oxford.svg/1024px-University_of_Oxford.svg.png'
  },
  { 
    name: 'Harvard', 
    domain: 'harvard.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Harvard_University_shield.png/1024px-Harvard_University_shield.png'
  },
  { 
    name: 'Yale', 
    domain: 'yale.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Yale_University_Shield_1.svg/1024px-Yale_University_Shield_1.svg.png'
  },
  { 
    name: 'Princeton', 
    domain: 'princeton.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Princeton_seal.svg/1024px-Princeton_seal.svg.png'
  },
  { 
    name: 'Penn', 
    domain: 'upenn.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/UPenn_shield_with_banner.svg/1024px-UPenn_shield_with_banner.svg.png'
  },
  { 
    name: 'Cornell', 
    domain: 'cornell.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Cornell_University_seal.svg/1024px-Cornell_University_seal.svg.png'
  },
  { 
    name: 'USC', 
    domain: 'usc.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/USC_Trojans_logo.svg/1024px-USC_Trojans_logo.svg.png'
  },
  { 
    name: 'UCLA', 
    domain: 'ucla.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/UCLA_Bruins_primary_logo.svg/1024px-UCLA_Bruins_primary_logo.svg.png'
  },
  { 
    name: 'Cal', 
    domain: 'berkeley.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Seal_of_University_of_California%2C_Berkeley.svg/1024px-Seal_of_University_of_California%2C_Berkeley.svg.png'
  },
  { 
    name: 'UNC', 
    domain: 'unc.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/North_Carolina_Tar_Heels_logo.svg/1024px-North_Carolina_Tar_Heels_logo.svg.png'
  },
  { 
    name: 'UMich', 
    domain: 'umich.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Michigan_Wolverines_logo.svg/1024px-Michigan_Wolverines_logo.svg.png'
  },
  { 
    name: 'Waterloo', 
    domain: 'uwaterloo.ca',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/University_of_Waterloo_seal.svg/1024px-University_of_Waterloo_seal.svg.png'
  },
  { 
    name: 'U of T', 
    domain: 'utoronto.ca',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Utoronto_coa.svg/1024px-Utoronto_coa.svg.png'
  },
  { 
    name: 'Rutgers', 
    domain: 'rutgers.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Rutgers_Scarlet_Knights_logo.svg/1024px-Rutgers_Scarlet_Knights_logo.svg.png'
  },
  {
    name: 'Duke',
    domain: 'duke.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Duke_University_logo.svg/1024px-Duke_University_logo.svg.png'
  },
  {
    name: 'Stanford',
    domain: 'stanford.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Stanford_Cardinal_logo.svg'
  },
  {
    name: 'UChicago',
    domain: 'uchicago.edu',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/79/University_of_Chicago_shield.svg/1024px-University_of_Chicago_shield.svg.png'
  },
  // Tech & Finance
  {
    name: 'Amazon',
    domain: 'amazon.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png'
  },
  {
    name: 'Microsoft',
    domain: 'microsoft.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/1024px-Microsoft_logo_%282012%29.svg.png'
  },
  { 
    name: 'Google', 
    domain: 'google.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1024px-Google_2015_logo.svg.png'
  },
  { 
    name: 'Meta', 
    domain: 'meta.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/1024px-Meta_Platforms_Inc._logo.svg.png'
  },
  { 
    name: 'OpenAI', 
    domain: 'openai.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1024px-OpenAI_Logo.svg.png'
  },
  { 
    name: 'Perplexity', 
    domain: 'perplexity.ai', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Perplexity_AI_logo.svg/1024px-Perplexity_AI_logo.svg.png'
  },
  { 
    name: 'Apple', 
    domain: 'apple.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1024px-Apple_logo_black.svg.png'
  },
  { 
    name: 'NVIDIA', 
    domain: 'nvidia.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Nvidia_logo.svg/1024px-Nvidia_logo.svg.png'
  },
  { 
    name: 'Palantir', 
    domain: 'palantir.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Palantir_Technologies_logo.svg/1024px-Palantir_Technologies_logo.svg.png'
  },
  { 
    name: 'Jane Street', 
    domain: 'janestreet.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Jane_Street_Capital_Logo.svg/1024px-Jane_Street_Capital_Logo.svg.png'
  },
  { 
    name: 'Goldman Sachs', 
    domain: 'goldmansachs.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Goldman_Sachs.svg/1024px-Goldman_Sachs.svg.png'
  },
  { 
    name: 'Coinbase', 
    domain: 'coinbase.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Coinbase.svg/1024px-Coinbase.svg.png'
  },
  { 
    name: 'Stripe', 
    domain: 'stripe.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/1024px-Stripe_Logo%2C_revised_2016.svg.png'
  },
  { 
    name: 'Airbnb', 
    domain: 'airbnb.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Airbnb_Logo_B%C3%A9lo.svg/1024px-Airbnb_Logo_B%C3%A9lo.svg.png'
  },
  { 
    name: 'Uber', 
    domain: 'uber.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Uber_logo_2018.png/1024px-Uber_logo_2018.png'
  },
  { 
    name: 'Lyft', 
    domain: 'lyft.com',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Lyft_logo.svg/1024px-Lyft_logo.svg.png'
  },
  { 
    name: 'TikTok', 
    domain: 'tiktok.com',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/1024px-TikTok_logo.svg.png'
  },
  { 
    name: 'Snapchat', 
    domain: 'snapchat.com',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c4/Snapchat_logo.svg/1024px-Snapchat_logo.svg.png'
  },
  { 
    name: 'Discord', 
    domain: 'discord.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/98/Discord_logo.svg/1024px-Discord_logo.svg.png'
  },
  { 
    name: 'Spotify', 
    domain: 'spotify.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Spotify_logo_with_text.svg/1024px-Spotify_logo_with_text.svg.png'
  },
  { 
    name: 'HP', 
    domain: 'hp.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HP_logo_2012.svg/1024px-HP_logo_2012.svg.png'
  },
  { 
    name: 'Nike', 
    domain: 'nike.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1024px-Logo_NIKE.svg.png'
  },
  { 
    name: 'Adidas', 
    domain: 'adidas.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/1024px-Adidas_Logo.svg.png'
  },
  { 
    name: 'Under Armour', 
    domain: 'underarmour.com', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Under_armour_logo.svg/1024px-Under_armour_logo.svg.png'
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