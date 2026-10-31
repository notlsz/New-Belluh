import { calmAvatar, avatarFor } from './lib/avatar';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import BelluhOrb from './components/BelluhOrb';
import DragonflyMark from './components/DragonflyMark';
const LoveMap = React.lazy(() => import('./pages/LoveMap'));
const GuidePage = React.lazy(() => import('./pages/GuidePage'));
const MissionPage = React.lazy(() => import('./pages/company/Mission'));
const ImpactPage = React.lazy(() => import('./pages/company/Impact'));
const ResearchPage = React.lazy(() => import('./pages/company/Research'));
const guideSlug = window.location.pathname.match(/^\/g\/([a-z0-9]{6,32})\/?$/i)?.[1] ?? null;
import TabBar from './components/TabBar';
import Journal from './pages/Journal';
import Timeline from './pages/Timeline';
import AICoach from './pages/AICoach';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import Careers from './pages/Careers';
import AdminMetrics from './pages/AdminMetrics';
import LegalModal from './components/LegalModal';
import ArtifactModal from './components/ArtifactModal';
import IntroGuide from './components/IntroGuide'; // Import the new guide
import { CURRENT_USER, MOCK_INSIGHTS, THEMES, DAILY_PROMPTS } from './constants';
import { JournalEntry, EntryType, Mood, User, CircleType, CircleStatus, ColorTheme } from './types';
import { Sparkles, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { supabase, readAs } from './lib/supabaseClient';
import { useAdminAccess } from './hooks/useAdminAccess';
import { trackEvent, flushCta } from './services/analytics';
import { belluhAgent } from './services/belluhAgent';
import { belluh } from './lib/belluhPresence';
import { resolveMedia, repairLegacyUrl } from './services/media';
import { computeStreak, hideLockedAnswer, questionForDay } from './lib/daily';

import Acquisition from './pages/Acquisition';
import Report from './pages/Report';
import { useI18n, useUi } from './i18n';
import shell from './i18n/ui/shell';

// Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-slate-900 text-white',
    error: 'bg-rose-500 text-white',
    info: 'bg-belluh-300 text-slate-900',
  };

  const Icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  };

  const Icon = Icons[type];

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl animate-slide-up ${bgColors[type]}`}>
      <Icon size={18} strokeWidth={2.5} />
      <span className="text-sm font-bold">{message}</span>
    </div>
  );
};


// Types for Invite Handling
type PendingInvite = {
  id: string; // Connection ID
  inviter: {
    id: string;
    name: string;
    avatar: string;
  }
};

// Theme and other settings are remembered on this device
const SETTINGS_KEY = 'belluh_settings';
const loadSavedSettings = (): Record<string, unknown> => {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; }
};

const App: React.FC = () => {
  const { f } = useI18n();
  const T = useUi(shell).app;
  const loadedUserId = useRef<string | null>(null);
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Added loading state to prevent flash
  const [opening, setOpening] = useState(false); // signed in, journal on its way
  // Laptops: the side panel can fold down to its icons, and stays the way you left it
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => { try { return localStorage.getItem('belluh_sidebar') === 'collapsed'; } catch { return false; } });
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', sidebarCollapsed ? '5rem' : '16rem');
    try { localStorage.setItem('belluh_sidebar', sidebarCollapsed ? 'collapsed' : 'open'); } catch { /* storage off */ }
  }, [sidebarCollapsed]);
  const [isOnboarding, setIsOnboarding] = useState(false);
  
  // View State for Unauthenticated Users ('landing' | 'auth' | 'about' | 'careers' | 'acquisition' | 'report' | 'mission' | 'impact' | 'research')
  const getInitialAuthView = () => {
    const path = window.location.pathname;
    if (path.startsWith('/report')) return 'report';
    if (path.startsWith('/we-have-been-acquired')) return 'acquisition';
    if (path.startsWith('/careers')) return 'careers';
    if (path === '/mission') return 'mission';
    if (path === '/impact') return 'impact';
    if (path === '/research') return 'research';
    if (path === '/about') return 'about';
    if (path === '/login' || path === '/signup') return 'auth';
    return 'landing';
  };
  const [authView, setAuthView] = useState<'landing' | 'auth' | 'about' | 'careers' | 'acquisition' | 'report' | 'mission' | 'impact' | 'research'>(getInitialAuthView());
  const [recovering, setRecovering] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(window.location.pathname === '/login' ? 'login' : 'signup');
  // Where Log in / Start free was pressed, so Back on the login page returns there
  const lastPublicView = useRef<'landing' | 'about' | 'careers' | 'mission' | 'impact' | 'research'>('landing');
  useEffect(() => { if (authView !== 'auth' && authView !== 'acquisition' && authView !== 'report') lastPublicView.current = authView; }, [authView]);
  
  // App State
  // A notification opens Home with Belluh's panel up (?tab=belluh), then the address is tidied
  const [openedFromLink] = useState(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('tab') !== 'belluh') return false;
      url.searchParams.delete('tab');
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
      return true;
    } catch { return false; }
  });
  const [currentTab, setCurrentTab] = useState('timeline');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composePrompt, setComposePrompt] = useState<string | undefined>(undefined);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  // What Belluh's features may read: everything you can see, minus your partner's locked answer to today's question
  const readableEntries = useMemo(() => hideLockedAnswer(entries, loadedUserId.current ?? '', questionForDay(DAILY_PROMPTS)), [entries]);
  const [streak, setStreak] = useState(0);
  
  // Intro Guide State
  const [showIntro, setShowIntro] = useState(false);
  
  // Pending Invites State
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  
  // Notification State
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  // Belluh's short reply after you write, and notes from your partner waiting in the Belluh tab
  const [belluhReply, setBelluhReply] = useState<string | null>(null);
  const [unreadNotes, setUnreadNotes] = useState(0);
  const [newFromBelluh, setNewFromBelluh] = useState(false);
  // A question asked from Home or an entry card, waiting for the Belluh tab to send it
  const [belluhAsk, setBelluhAsk] = useState<string | null>(null);
  // Asking Belluh from Home opens the conversation as a panel over Home, instead of sending you to another tab
  const [belluhSheet, setBelluhSheet] = useState(openedFromLink);
  const askBelluh = (message: string) => { setBelluhAsk(message || null); setBelluhReply(null); setNewFromBelluh(false); setBelluhSheet(true); };
  // A question asked on the landing page before signing up: Bella answers it once they're in
  useEffect(() => {
    if (!isAuthenticated || isLoading || isOnboarding) return;
    let q: string | null = null;
    try { q = localStorage.getItem('belluh_pending_ask'); localStorage.removeItem('belluh_pending_ask'); } catch { /* storage off */ }
    if (q && q.trim()) askBelluh(q.trim());
  }, [isAuthenticated, isLoading, isOnboarding]);
  useEffect(() => {
    if (!belluhSheet) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setBelluhSheet(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [belluhSheet]);
  // With a partner connected, the tab is "Us": the two of you and Belluh together
  const [hasPartner, setHasPartner] = useState(false);
  // The tab opens where the news is: your own thread when a note or something from Belluh is waiting, otherwise Us
  const [tabSpace, setTabSpace] = useState<'me' | 'us'>('us');
  const [inviteOffer, setInviteOffer] = useState<{ token: string; name: string } | null>(null);
  const currentTabRef = useRef(currentTab);
  useEffect(() => { currentTabRef.current = currentTab; if (currentTab === 'ai-coach') setBelluhReply(null); }, [currentTab]);
  const [inviteBusy, setInviteBusy] = useState(false);

  const answerInvite = async (accept: boolean) => {
    if (!inviteOffer) return;
    setInviteBusy(true);
    if (accept) {
      const { error } = await supabase.rpc('accept_partner_invite', { p_token: inviteOffer.token });
      if (error) showNotification(T.inviteExpired, "error");
      else {
        showNotification(f(T.connectedWith, { name: inviteOffer.name }), "success");
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) loadUserData(u);
      }
    }
    try { localStorage.removeItem('pending_invite_id'); } catch { /* ignore */ }
    setInviteOffer(null);
    setInviteBusy(false);
  };
  useEffect(() => {
    if (!isAuthenticated) return;
    supabase.auth.getUser().then(({ data: { user: u } }) => { if (u) belluhAgent.saveTimeZone(u.id); });
    supabase.from('partner_connections').select('id').eq('status', 'connected').limit(1).then(({ data }) => setHasPartner(!!data?.length));
    const check = () => {
      belluhAgent.unreadNotes().then(setUnreadNotes);
      belluhAgent.hasNewFromBelluh().then(setNewFromBelluh);
    };
    check();
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, [isAuthenticated]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
  };

  // Initialize with empty user state for fresh start
  const [user, setUser] = useState<User>({
      id: '',
      name: '',
      avatar: avatarFor('guest'),
      partnerName: undefined,
      circles: [],
      isPremium: false,
      joinDate: new Date(),
      activeCircleId: 'c1',
      settings: { ...CURRENT_USER.settings, ...loadSavedSettings() } as any,
      hasCompletedOnboarding: false,
      detectedPersona: CURRENT_USER.detectedPersona
  });
  
  const [showPremiumOverlay, setShowPremiumOverlay] = useState(false);

  // Legal Modal State
  const [legalModalOpen, setLegalModalOpen] = useState<'tos' | 'privacy' | null>(null);
  
  // Artifact Modal State
  const [artifactModalOpen, setArtifactModalOpen] = useState<'reel' | 'letter' | null>(null);

  // STEALTH ADMIN ACCESS HOOK
  const { showAdmin, setShowAdmin, isUserAdmin } = useAdminAccess(user.id);

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    const theme = THEMES[user.settings.colorTheme] || THEMES.pink;
    
    // Set colors
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--color-belluh-${key}`, value as string);
    });

    // Helper for RGB shadow glow
    const hex = theme[300] as string; // e.g., #f0addd
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    root.style.setProperty('--color-belluh-300-rgb', `${r}, ${g}, ${b}`);

  }, [user.settings.colorTheme]);

  // Sync authView with URL
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/we-have-been-acquired')) setAuthView('acquisition');
      else if (path.startsWith('/careers')) setAuthView('careers');
      else if (path === '/mission' || path === '/impact' || path === '/research') setAuthView(path.slice(1) as 'mission');
      else if (path === '/about') setAuthView('about');
      else if (path === '/login' || path === '/signup') { setAuthMode(path === '/login' ? 'login' : 'signup'); setAuthView('auth'); }
      else setAuthView('landing');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    if (guideSlug) return;
    if (authView === 'landing' && path !== '/') window.history.pushState({}, '', '/');
    else if (authView === 'about' && path !== '/about') window.history.pushState({}, '', '/about');
    else if (authView === 'careers' && !path.startsWith('/careers')) window.history.pushState({}, '', '/careers');
    else if ((authView === 'mission' || authView === 'impact' || authView === 'research') && path !== `/${authView}`) window.history.pushState({}, '', `/${authView}`);
    else if (authView === 'acquisition' && !path.startsWith('/we-have-been-acquired')) window.history.pushState({}, '', '/we-have-been-acquired');
    else if (authView === 'report' && !path.startsWith('/report')) window.history.pushState({}, '', '/report');
    else if (authView === 'auth' && !isAuthenticated && path !== '/login' && path !== '/signup') window.history.pushState({}, '', authMode === 'login' ? '/login' : '/signup');
  }, [authView]);
  // Once signed in, the address no longer says /login
  useEffect(() => {
    if (isAuthenticated && (window.location.pathname === '/login' || window.location.pathname === '/signup')) window.history.replaceState({}, '', '/');
  }, [isAuthenticated]);

  // --- Auth Helpers ---

  const resetUserState = () => {
      setIsAuthenticated(false);
      setEntries([]);
      setStreak(0);
      setUser({
          id: '',
          name: '',
          avatar: avatarFor('guest'),
          partnerName: undefined,
          circles: [],
          isPremium: false,
          joinDate: new Date(),
          activeCircleId: 'c1',
          settings: { ...CURRENT_USER.settings, ...loadSavedSettings() } as any,
          hasCompletedOnboarding: false,
          detectedPersona: CURRENT_USER.detectedPersona
      });
      setIsLoading(false);
  };

  // The latest login Supabase handed us, straight from its sign-in answer
  const lastSession = useRef<any>(null);
  const loadUserData = async (sessionUser: any, attempt = 1): Promise<void> => {
      // Which step it reached, so a load that stalls says where (recorded after 12 seconds)
      let stage = 'start';
      const stall = setTimeout(() => { trackEvent('load_stalled', { attempt, stage }); }, 12000);
      try {
        // Only read the journal once this browser really holds the login: a request sent without it is treated
        // as a logged-out visitor, which the database refuses
        // Every read below carries that login explicitly, from Supabase's own sign-in answer if the browser's saved
        // copy isn't readable yet, so it can never go out as a logged-out visitor
        const { data: { session: live } } = await supabase.auth.getSession();
        const token = (live?.user?.id === sessionUser.id ? live?.access_token : null) ?? (lastSession.current?.user?.id === sessionUser.id ? lastSession.current?.access_token : null);
        if (!token) throw new Error('no login token yet');
        const db = readAs(token);
        trackEvent('app_opened', { source: 'web' });

        // --- HANDLE INVITE LINKS (Persistent) ---
        const params = new URLSearchParams(window.location.search);
        let inviteToken = params.get('invite');
        try { if (!inviteToken) inviteToken = localStorage.getItem('pending_invite_id'); } catch { /* storage blocked */ }

        // Invite links carry a one-time token. We ask before connecting: opening a link alone never links accounts.
        if (inviteToken) {
            const { data: inviterName, error: previewError } = await db.rpc('preview_partner_invite', { p_token: inviteToken });
            const rpcMissing = !!previewError && /could not find the function|PGRST202/i.test(`${previewError.message} ${(previewError as any).code ?? ''}`);
            const isLegacyUserId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inviteToken);
            if (inviterName) {
                setInviteOffer({ token: inviteToken, name: inviterName as string });
            } else if (rpcMissing && isLegacyUserId && inviteToken !== sessionUser.id) {
                // Before the new invite system is installed: send a request the other person must accept
                const { error: reqError } = await db.from('partner_connections')
                    .insert({ user_id: sessionUser.id, partner_id: inviteToken, status: 'pending' });
                if (!reqError || reqError.code === '23505') showNotification(T.requestSent, "success");
                try { localStorage.removeItem('pending_invite_id'); } catch { /* ignore */ }
            } else {
                showNotification(T.inviteExpired, "error");
                try { localStorage.removeItem('pending_invite_id'); } catch { /* ignore */ }
            }
        }

        try {
            const url = new URL(window.location.href);
            if (url.searchParams.has('invite')) {
                url.searchParams.delete('invite');
                window.history.replaceState({}, document.title, url.toString());
            }
        } catch (e) { console.debug(e); }

        stage = 'profile';
        // 1. Fetch User Profile
        const { data: profile } = await db
            .from('profiles')
            .select('*')
            .eq('id', sessionUser.id)
            .maybeSingle();

        stage = 'connections';
        // 2. Fetch Active Partner Connections
        const { data: connections, error: connectionsError } = await db
            .from('partner_connections')
            .select('*')
            .eq('status', 'connected')
            .or(`user_id.eq.${sessionUser.id},partner_id.eq.${sessionUser.id}`);
        
        if (connectionsError) throw new Error(`partners: ${connectionsError.message}`);
        // Each partner once (a connection can exist in both directions), oldest first: your first partner is
        // always chapter "c1", the way your entries were tagged when you wrote them
        let connectedUserIds: string[] = [];
        if (connections && connections.length > 0) {
            const sorted = [...connections].sort((a: any, b: any) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')));
            connectedUserIds = [...new Set(sorted.map((c: any) => String(c.user_id === sessionUser.id ? c.partner_id : c.user_id).toLowerCase()))];
        }

        stage = 'entries';
        // 3. Fetch All Journal Entries (Content + System Data)
        const initialUserIds = [sessionUser.id, ...connectedUserIds];
        // Everything but the photos, which some older entries store inline (hundreds of KB each): they follow right
        // after the journal is on screen
        const { data: dbEntries, error: entriesError } = await db
            .from('journal_entries')
            .select('id, user_id, content, title, mood, type, is_shared, is_favorite, tags, audio_url, date, created_at, lat, lng, place')
            .in('user_id', initialUserIds)
            .order('created_at', { ascending: false });
        // A failed read must never look like an empty journal: try again rather than showing nothing
        if (entriesError) throw new Error(`journal: ${entriesError.message}`);

        let extendedMemberIds: string[] = [];
        if (dbEntries) {
             const memberEntries = dbEntries.filter((e: any) => e.tags && e.tags.includes('system_circle_member'));
             memberEntries.forEach((m: any) => {
                 const memberTag = m.tags.find((t: string) => t.startsWith('member:'));
                 if (memberTag) {
                     const mid = memberTag.split(':')[1];
                     if (mid && !initialUserIds.includes(mid)) extendedMemberIds.push(mid);
                 }
             });
        }
        
        stage = 'profiles';
        // 4. Fetch Profiles for ALL relevant users
        const allProfileIds = [...new Set([...initialUserIds, ...extendedMemberIds])];
        const { data: allProfiles } = await db
            .from('profiles')
            .select('*')
            .in('id', allProfileIds);
        
        // In the order you connected, so chapters never swap places between visits
        const connectedProfiles = connectedUserIds.map(id => allProfiles?.find((p: any) => String(p.id).toLowerCase() === id)).filter(Boolean) as any[];
        const myProfile = allProfiles?.find((p: any) => p.id === sessionUser.id);

        stage = 'circles';
        // 5. Build Circles
        const newCircles: any[] = [];
        const myFirstName = myProfile?.full_name?.trim().split(' ')[0] || sessionUser.email?.split('@')[0] || T.me;
        
        const getCircleMetadata = (circleId: string) => {
            const isMeta = (e: any) => e.tags && e.tags.includes('system_circle_metadata') && e.tags.includes(`circle:${circleId}`);
            // Your own setting for this circle wins; otherwise use your partner's
            const metaEntry = dbEntries?.find((e: any) => isMeta(e) && e.user_id === sessionUser.id)
                ?? dbEntries?.find((e: any) => isMeta(e));
            return {
                name: metaEntry?.title, // Overridden name
                isArchived: metaEntry?.tags?.includes('status:archived') // Overridden status
            };
        };

        const getExtraMembers = (circleId: string) => {
            const members: string[] = [];
            if (dbEntries) {
                // "c1" and "partner_…" are your own names for your chapters (your partner's "c1" is a different
                // chapter), so only the people you added count there
                const mineOnly = circleId === 'c1' || circleId.startsWith('partner_');
                const memberEntries = dbEntries.filter((e: any) =>
                    e.tags && e.tags.includes('system_circle_member') && e.tags.includes(`circle:${circleId}`) && (!mineOnly || e.user_id === sessionUser.id)
                );
                memberEntries.forEach((m: any) => {
                    const tag = m.tags.find((t: string) => t.startsWith('member:'));
                    if (tag) members.push(tag.split(':')[1].toLowerCase());
                });
            }
            return members;
        };

        // Your first chapter is with your first partner, unless you added that partner into it yourself: then it
        // was built around the next one (that's how it looked when you added them), and stays that way
        const addedToFirst = new Set(getExtraMembers('c1'));
        const firstIdx = connectedProfiles.findIndex((pp: any) => !addedToFirst.has(String(pp.id).toLowerCase()));
        if (firstIdx > 0) connectedProfiles.unshift(...connectedProfiles.splice(firstIdx, 1));

        if (connectedProfiles.length > 0) {
            connectedProfiles.forEach((pProfile, index) => {
                const partnerFirstName = pProfile.full_name?.trim().split(' ')[0] || T.partner;
                let circleName = f(T.pairName, { me: myFirstName, partner: partnerFirstName });
                const circleId = index === 0 ? 'c1' : `partner_${pProfile.id}`;
                const meta = getCircleMetadata(circleId);
                if (meta.name) circleName = meta.name;

                const baseMembers = [sessionUser.id, pProfile.id];
                const extraMembers = getExtraMembers(circleId);
                const allMembers = [...new Set([...baseMembers, ...extraMembers])];

                const profiles = allMembers.map(mid => {
                    const prof = allProfiles?.find((p: any) => p.id === mid);
                    return {
                        id: mid,
                        name: prof?.full_name || T.unknown,
                        avatar: calmAvatar(prof?.avatar_url) || avatarFor(mid)
                    };
                });

                newCircles.push({
                    id: circleId,
                    name: circleName,
                    type: CircleType.Couple as any,
                    status: meta.isArchived ? CircleStatus.Archived : CircleStatus.Active,
                    members: allMembers,
                    memberProfiles: profiles,
                    themeColor: '#f0addd',
                    avatar: calmAvatar(pProfile.avatar_url) ?? pProfile.avatar_url,
                    startDate: new Date()
                });
            });
        } else {
             const circleId = 'c1';
             const meta = getCircleMetadata(circleId);
             const extraMembers = getExtraMembers(circleId);
             const allMembers = [...new Set([sessionUser.id, ...extraMembers])];
             const profiles = allMembers.map(mid => {
                const prof = allProfiles?.find((p: any) => p.id === mid);
                return {
                    id: mid,
                    name: prof?.full_name || T.unknown,
                    avatar: calmAvatar(prof?.avatar_url) || avatarFor(mid)
                };
            });

             newCircles.push({
                id: circleId,
                name: meta.name || f(T.ownSpace, { name: myFirstName }),
                type: CircleType.Custom as any,
                status: meta.isArchived ? CircleStatus.Archived : CircleStatus.Active,
                members: allMembers,
                memberProfiles: profiles,
                themeColor: '#cbd5e1'
             });
        }

        if (dbEntries) {
            const systemEntries = dbEntries.filter((e: any) => e.tags && e.tags.includes('system_circle_def'));
            systemEntries.forEach((e: any) => {
                const baseMembers = [e.user_id]; 
                const extraMembers = getExtraMembers(e.id);
                const allMembers = [...new Set([...baseMembers, ...extraMembers])];
                const profiles = allMembers.map(mid => {
                    const prof = allProfiles?.find((p: any) => p.id === mid);
                    return {
                        id: mid,
                        name: prof?.full_name || T.unknown,
                        avatar: calmAvatar(prof?.avatar_url) || avatarFor(mid)
                    };
                });
                const isArchived = e.tags && e.tags.includes('status:archived');
                newCircles.push({
                    id: e.id,
                    name: e.title || T.untitledCircle,
                    type: CircleType.Custom,
                    status: isArchived ? CircleStatus.Archived : CircleStatus.Active,
                    members: allMembers,
                    memberProfiles: profiles,
                    themeColor: e.content || '#cbd5e1', 
                    startDate: new Date(e.created_at)
                });
            });
        }

        stage = 'pending';
        const { data: pendingRows } = await db
            .from('partner_connections')
            .select('*')
            .eq('partner_id', sessionUser.id)
            .eq('status', 'pending');
        
        if (pendingRows && pendingRows.length > 0) {
            const inviterIds = pendingRows.map((r: any) => r.user_id);
            const { data: inviters } = await db.from('profiles').select('*').in('id', inviterIds);
            const invites: PendingInvite[] = pendingRows.map((r: any) => {
                const inviter = inviters?.find((p: any) => p.id === r.user_id);
                return {
                    id: r.id,
                    inviter: {
                        id: inviter?.id || r.user_id,
                        name: inviter?.full_name || T.unknownUser,
                        avatar: calmAvatar(inviter?.avatar_url) || avatarFor(r.user_id)
                    }
                };
            });
            setPendingInvites(invites);
        } else {
            setPendingInvites([]);
        }

        let relationshipFacts = '';
        if (dbEntries) {
            const factsEntry = dbEntries.find((e: any) => e.tags && e.tags.includes('system_facts'));
            if (factsEntry) relationshipFacts = factsEntry.content;
        }

        // Partner → the chapter you share with them
        const chapterOf = new Map<string, string>();
        newCircles.forEach((c: any) => { if (c.type === CircleType.Couple) c.members.filter((m: string) => m !== sessionUser.id).forEach((m: string) => { if (!chapterOf.has(String(m).toLowerCase())) chapterOf.set(String(m).toLowerCase(), c.id); }); });

        const contentEntries = dbEntries ? dbEntries.filter((e: any) => 
            // Never show another person's private entries
            (e.user_id === sessionUser.id || e.is_shared) &&
            (!e.tags || (
                !e.tags.includes('system_circle_def') && 
                !e.tags.includes('system_circle_member') &&
                !e.tags.includes('system_facts') &&
                !e.tags.includes('system_circle_metadata')
            ))
        ) : [];
        
        const mappedEntries: JournalEntry[] = contentEntries.map((e: any) => {
            const isMine = e.user_id === sessionUser.id;
            let authorName = T.unknown;
            let authorAvatar = '';

            const authorProfile = allProfiles?.find((p: any) => p.id === e.user_id);
            if (authorProfile) {
                authorName = isMine ? (myProfile?.full_name || T.me) : authorProfile.full_name;
                authorAvatar = calmAvatar(authorProfile.avatar_url) || avatarFor(e.user_id);
            } else {
                authorName = isMine ? T.me : T.friend;
                authorAvatar = avatarFor(e.user_id);
            }

            // Which chapter it belongs to. A partner's entry belongs to your chapter with them, whatever they tagged
            // on their side (their "c1" is their first partner, not necessarily you). Older apps wrote ids in capitals.
            const circleTag = e.tags && Array.isArray(e.tags) ? e.tags.find((t: string) => t.startsWith('circle:')) : null;
            const tagged = circleTag ? circleTag.slice('circle:'.length) : 'c1';
            const norm = (id: string) => /^(partner_)?[0-9a-f-]{36}$/i.test(id) ? id.toLowerCase() : id;
            let entryCircleId = norm(tagged);
            if (!isMine) {
                const theirs = chapterOf.get(String(e.user_id).toLowerCase());
                const custom = newCircles.some((c: any) => c.id === entryCircleId && c.type === CircleType.Custom && c.members.includes(e.user_id));
                if (theirs && !custom) entryCircleId = theirs;
            }
            // Never lose an entry: a chapter id that no longer exists (a partner who is now your first chapter, say)
            // goes to the chapter with that partner, or else your first chapter
            if (!newCircles.some((c: any) => c.id === entryCircleId)) {
                const pid = entryCircleId.startsWith('partner_') ? entryCircleId.slice('partner_'.length) : String(e.user_id).toLowerCase();
                entryCircleId = chapterOf.get(pid) ?? 'c1';
            }

            return {
                id: e.id,
                userId: e.user_id,
                authorName,
                authorAvatar,
                content: e.content || '',
                timestamp: new Date(e.created_at),
                type: e.type as EntryType,
                mood: e.mood as Mood,
                prompt: e.title,
                isPrivate: !e.is_shared,
                circleId: entryCircleId, 
                likes: e.is_favorite ? 1 : 0, 
                isLiked: e.is_favorite,
                mediaUrl: repairLegacyUrl(e.photo_url),
                audioUrl: repairLegacyUrl(e.audio_url),
                lat: typeof e.lat === 'number' ? e.lat : undefined,
                lng: typeof e.lng === 'number' ? e.lng : undefined,
                location: e.place || undefined,
            };
        });
        stage = 'media';
        // Private voice notes and photos get fresh links each time the journal loads
        // Never let slow storage hold up the journal: entries show, and media fills in what it can
        // The journal shows now; photos and private voice-note links fill in a moment later
        setEntries(mappedEntries.map(e => ({ ...e, mediaUrl: undefined, audioUrl: e.audioUrl?.startsWith('sb://') ? undefined : e.audioUrl })));
        const shownIds = new Set(mappedEntries.map(e => e.id));
        const audioRefs = mappedEntries.filter(e => e.audioUrl?.startsWith('sb://')).map(e => [e.id, e.audioUrl!] as const);
        void (async () => {
            try {
                const { data: photoRows } = await db.from('journal_entries').select('id, photo_url').in('user_id', initialUserIds).not('photo_url', 'is', null);
                const photos = new Map<string, string>();
                (photoRows ?? []).forEach((r: any) => { const u = repairLegacyUrl(r.photo_url); if (u && shownIds.has(r.id)) photos.set(r.id, u); });
                const links = await resolveMedia([...photos.values(), ...audioRefs.map(([, a]) => a)]).catch(() => new Map<string, string>());
                const audio = new Map(audioRefs.map(([id, a]) => [id, links.get(a)]));
                setEntries(prev => prev.map(e => {
                    const p = photos.get(e.id);
                    const mediaUrl = p ? (p.startsWith('sb://') ? links.get(p) : p) : e.mediaUrl;
                    return { ...e, mediaUrl, audioUrl: audio.get(e.id) ?? e.audioUrl };
                }));
            } catch (err: any) { trackEvent('media_failed', { message: String(err?.message ?? err).slice(0, 200) }); }
        })();

        // Streak = consecutive days with at least one entry of yours, counting back from today (or yesterday)
        setStreak(computeStreak(mappedEntries.filter(e => e.userId === sessionUser.id).map(e => e.timestamp)));

        const primaryPartner = connectedProfiles.length > 0 ? connectedProfiles[0] : null;
        const displayPartnerName = myProfile?.partner_name || primaryPartner?.full_name || undefined;

        // Parse user settings if available in profile (assuming we store them later, for now defaults)
        // Here we just use default, could expand profile table to store settings JSON
        
        setUser(prev => ({ 
            ...prev, 
            id: sessionUser.id, 
            name: myProfile?.full_name || sessionUser.email?.split('@')[0] || T.user,
            avatar: calmAvatar(myProfile?.avatar_url) || prev.avatar,
            partnerName: displayPartnerName,
            partnerAvatar: calmAvatar(primaryPartner?.avatar_url) || undefined,
            circles: newCircles as any,
            // Stay in the circle you were in, if it still exists
            activeCircleId: newCircles.some((c: any) => c.id === prev.activeCircleId) ? prev.activeCircleId : 'c1',
            isPremium: false,
            settings: { ...CURRENT_USER.settings, ...loadSavedSettings() },
            hasCompletedOnboarding: !!displayPartnerName,
            relationshipFacts: relationshipFacts
        }));
        
        // Onboarding is only for someone new: an account made in the last day, no partner named or connected, nothing written yet, and not finished before
        let onboardedHere = false;
        try { onboardedHere = localStorage.getItem(`belluh_onboarded:${sessionUser.id}`) === '1'; } catch { /* storage blocked */ }
        const hasWritten = mappedEntries.some(e => e.userId === sessionUser.id);
        const createdAt = Date.parse((sessionUser as any).created_at ?? '');
        const oldAccount = Number.isFinite(createdAt) && Date.now() - createdAt > 24 * 3600_000;
        setIsOnboarding(!oldAccount && !displayPartnerName && !primaryPartner && !hasWritten && !onboardedHere);
        
        // Belluh looks the way they left it: the shape saved on the account, on any device
        try {
            const { data: st } = await db.from('agent_settings').select('shape').eq('user_id', sessionUser.id).maybeSingle();
            const here = belluh.savedHere();
            if (st && 'shape' in st && st.shape) belluh.restore(st.shape as any);
            else if (here) await db.from('agent_settings').upsert({ user_id: sessionUser.id, shape: here, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
            // (a Supabase query only runs once it's awaited or .then-ed)
            belluh.keepOnAccount(saved => { readAs(lastSession.current?.access_token ?? token).from('agent_settings').upsert({ user_id: sessionUser.id, shape: saved, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).then(({ error }) => { if (error) trackEvent('shape_save_failed', { message: error.message.slice(0, 200) }); }); });
        } catch { /* the shape is a nicety: never hold up the journal */ }

        stage = 'done';
        setIsAuthenticated(true);
        trackEvent('load_done', { attempt, entries: mappedEntries.length });
      } catch (err: any) {
          console.error("Failed to load user data", err);
          // Record exactly what broke (no journal text), so it can be fixed
          let exp = 0; try { exp = JSON.parse(atob(String(lastSession.current?.access_token ?? '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp ?? 0; } catch { /* none */ }
          let storageOk = true; try { localStorage.setItem('belluh_probe', 'x'.repeat(2048)); localStorage.removeItem('belluh_probe'); } catch { storageOk = false; }
          trackEvent('load_failed', { attempt, stage, has_login: !!lastSession.current, token_exp_in_s: exp ? exp - Math.floor(Date.now() / 1000) : null, storage_ok: storageOk, message: String(err?.message ?? err).slice(0, 300), stack: String(err?.stack ?? '').slice(0, 1200) });
          if (attempt < 5) { await new Promise(r => setTimeout(r, 700 * attempt)); return loadUserData(sessionUser, attempt + 1); }
          // Let the next "Log in" try again instead of being ignored
          loadedUserId.current = null;
          showNotification(T.loadFailed, "error");
      } finally {
          clearTimeout(stall);
          setIsLoading(false); setOpening(false);
      }
  };

  // Keep an invite token from the link while the visitor signs up or logs in
  useEffect(() => {
    try {
      const token = new URLSearchParams(window.location.search).get('invite');
      if (token) localStorage.setItem('pending_invite_id', token);
    } catch { /* storage blocked */ }
  }, []);

  // Initialize Supabase Auth & Data
  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        lastSession.current = session ?? null;
        // Token refreshes happen every hour and must not reload everything or reset your place
        if (event === 'SIGNED_IN') {
            if (session?.user && mounted && loadedUserId.current !== session.user.id) {
                loadedUserId.current = session.user.id;
                const u = session.user;
                // The moment the login is accepted, leave the login screen: the journal opens in front of them
                setOpening(true); setIsLoading(true);
                setTimeout(() => loadUserData(u), 0);
                setTimeout(flushCta, 1500); // which landing button brought them in
            }
        } else if (event === 'PASSWORD_RECOVERY') {
            if (mounted) setRecovering(true);
            if (session?.user && mounted && loadedUserId.current !== session.user.id) { loadedUserId.current = session.user.id; const u = session.user; setTimeout(() => loadUserData(u), 0); }
        } else if (event === 'SIGNED_OUT') {
            loadedUserId.current = null;
            belluh.keepOnAccount(null);
            if (mounted) resetUserState();
        }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user && mounted && loadedUserId.current !== session.user.id) {
            loadedUserId.current = session.user.id;
            loadUserData(session.user);
        }
        else if (!session?.user && mounted) setIsLoading(false);
    });

    return () => { 
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  const partnerHasEntry = useMemo(() => {
    const today = new Date();
    return entries.some(e => 
        e.userId !== user.id && 
        e.circleId === user.activeCircleId &&
        e.timestamp.getDate() === today.getDate() && 
        e.timestamp.getMonth() === today.getMonth() &&
        e.timestamp.getFullYear() === today.getFullYear()
    );
  }, [entries, user.id, user.activeCircleId]);

  const handleTriggerPremium = () => {
    trackEvent('premium_trigger_clicked');
    setShowPremiumOverlay(true);
  };

  const handleLogin = () => {};

  const handleLogout = async () => {
      try {
        await supabase.auth.signOut();
      } finally {
        resetUserState();
      }
  };

  const handleOnboardingComplete = async (partnerName: string, firstEntry: string) => {
    // Whatever happens below, onboarding is done: it never shows again for this person
    try { if (user.id) localStorage.setItem(`belluh_onboarded:${user.id}`, '1'); } catch { /* storage blocked */ }
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      try { localStorage.setItem(`belluh_onboarded:${currentUser.id}`, '1'); } catch { /* storage blocked */ }

      // 1. Save their partner's name, creating the profile if sign-up didn't (Google sign-in, confirming by email)
      if (partnerName) await supabase.from('profiles').upsert({ id: currentUser.id, partner_name: partnerName }, { onConflict: 'id' });

      // 2. Insert Entry
      const { data: entryData } = !firstEntry ? { data: null } : await supabase.from('journal_entries').insert([{
          user_id: currentUser.id,
          content: firstEntry,
          type: 'Freeform', 
          is_shared: false, 
          is_favorite: false,
          tags: ['onboarding', 'first_magic_moment', 'circle:c1'], 
          date: new Date().toISOString()
      }]).select().single();
    
      // 3. Update Local State
      setUser(prev => ({ ...prev, partnerName: partnerName || prev.partnerName, hasCompletedOnboarding: true }));
    
      if (entryData) {
          const newEntry: JournalEntry = {
              id: entryData.id,
              userId: currentUser.id,
              authorName: user.name,
              authorAvatar: user.avatar,
              content: firstEntry,
              timestamp: new Date(entryData.created_at),
              type: EntryType.Freeform,
              mood: undefined,
              prompt: undefined,
              isPrivate: true,
              circleId: 'c1',
              likes: 0,
              isLiked: false
          };
          setEntries(prev => [newEntry, ...prev]);
      }

    } catch (err) {
      console.error('Finishing onboarding', err);
    } finally {
      setIsOnboarding(false);
      setShowIntro(true);
    }
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
      if (updates.relationshipFacts) {
          setUser(prev => ({ ...prev, ...updates }));
          return;
      }
      
      // Theme Update
      if (updates.settings) {
          setUser(prev => {
              const settings = { ...prev.settings, ...updates.settings };
              try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* storage blocked */ }
              return { ...prev, settings };
          });
          return;
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const updatePayload: any = {
          id: currentUser.id,
          email: currentUser.email,
          full_name: updates.name !== undefined ? updates.name : user.name,
          avatar_url: updates.avatar !== undefined ? updates.avatar : user.avatar
      };

      await supabase.from('profiles').upsert(updatePayload);
      setUser(prev => ({ ...prev, name: updatePayload.full_name, avatar: updatePayload.avatar_url }));
      showNotification(T.profileUpdated, 'success');
  };

  const handleCreateCircle = async (name: string) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      const { error } = await supabase.from('journal_entries').insert([{
          user_id: currentUser.id,
          title: name,
          content: randomColor, 
          type: 'Milestone', 
          tags: ['system_circle_def'], 
          is_shared: false,
          date: new Date().toISOString()
      }]);

      if (!error) {
          showNotification(T.circleCreated, 'success');
          loadUserData(currentUser);
      } else {
          showNotification(T.circleCreateFailed, 'error');
      }
  };

  const handleRenameCircle = async (circleId: string, newName: string) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const isCustom = user.circles.find(c => c.id === circleId && c.type === CircleType.Custom && !c.id.startsWith('c1') && !c.id.startsWith('partner_'));

      if (isCustom) {
          const { error } = await supabase.from('journal_entries').update({ title: newName }).eq('id', circleId);
          if (!error) {
              setUser(prev => ({
                  ...prev,
                  circles: prev.circles.map(c => c.id === circleId ? { ...c, name: newName } : c)
              }));
              showNotification(T.circleRenamed, 'success');
          }
      } else {
          const { data: existingMeta } = await supabase
            .from('journal_entries')
            .select('id, tags')
            .eq('user_id', currentUser.id)
            .contains('tags', ['system_circle_metadata', `circle:${circleId}`])
            .limit(1)
            .maybeSingle();

          let renameError: unknown = null;
          if (existingMeta) {
              ({ error: renameError } = await supabase.from('journal_entries').update({ title: newName }).eq('id', existingMeta.id));
          } else {
              ({ error: renameError } = await supabase.from('journal_entries').insert([{
                  user_id: currentUser.id,
                  title: newName,
                  type: 'Milestone',
                  tags: ['system_circle_metadata', `circle:${circleId}`],
                  is_shared: true,
                  date: new Date().toISOString()
              }]));
          }
          if (renameError) { showNotification(T.renameFailed, 'error'); return; }
          
          setUser(prev => ({
              ...prev,
              circles: prev.circles.map(c => c.id === circleId ? { ...c, name: newName } : c)
          }));
          showNotification(T.circleRenamed, 'success');
      }
  };

  const handleArchiveCircle = async (circleId: string) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const circle = user.circles.find(c => c.id === circleId);
      if (!circle) return;
      
      const isArchiving = circle.status === CircleStatus.Active;
      const newStatus = isArchiving ? CircleStatus.Archived : CircleStatus.Active;

      const isCustom = circle.type === CircleType.Custom && !circle.id.startsWith('c1') && !circle.id.startsWith('partner_');

      if (isCustom) {
          const { data: entry } = await supabase.from('journal_entries').select('tags').eq('id', circleId).single();
          if (entry) {
              let newTags = entry.tags || [];
              if (isArchiving) newTags.push('status:archived');
              else newTags = newTags.filter((t: string) => t !== 'status:archived');
              await supabase.from('journal_entries').update({ tags: newTags }).eq('id', circleId);
          }
      } else {
          const { data: existingMeta } = await supabase
            .from('journal_entries')
            .select('id, tags')
            .eq('user_id', currentUser.id)
            .contains('tags', ['system_circle_metadata', `circle:${circleId}`])
            .limit(1)
            .maybeSingle();

          if (existingMeta) {
              let newTags = existingMeta.tags || [];
              if (isArchiving) newTags.push('status:archived');
              else newTags = newTags.filter((t: string) => t !== 'status:archived');
              await supabase.from('journal_entries').update({ tags: newTags }).eq('id', existingMeta.id);
          } else {
              await supabase.from('journal_entries').insert([{
                  user_id: currentUser.id,
                  type: 'Milestone',
                  tags: ['system_circle_metadata', `circle:${circleId}`, ...(isArchiving ? ['status:archived'] : [])],
                  is_shared: true,
                  date: new Date().toISOString()
              }]);
          }
      }

      setUser(prev => ({
          ...prev,
          circles: prev.circles.map(c => c.id === circleId ? { ...c, status: newStatus } : c)
      }));
      showNotification(isArchiving ? T.circleArchived : T.circleRestored, 'success');
  };

  const handleAcceptInvite = async (connectionId: string) => {
      setPendingInvites(prev => prev.filter(i => i.id !== connectionId));
      try {
          const { error } = await supabase
              .from('partner_connections')
              .update({ status: 'connected' })
              .eq('id', connectionId);
          if (error) throw error;
          showNotification(T.inviteAccepted, 'success');
          const { data: { user } } = await supabase.auth.getUser();
          if (user) loadUserData(user);
      } catch (error) {
          showNotification(T.acceptFailed, 'error');
          const { data: { user } } = await supabase.auth.getUser();
          if (user) loadUserData(user);
      }
  };

  const handleDeclineInvite = async (connectionId: string) => {
      setPendingInvites(prev => prev.filter(i => i.id !== connectionId));
      try {
          await supabase.from('partner_connections').delete().eq('id', connectionId);
          showNotification(T.inviteDeclined, 'success');
      } catch (error) {
          showNotification(T.declineFailed, 'error');
      }
  };

  const handleCompose = (prompt?: string) => {
      setComposePrompt(prompt);
      setIsComposeOpen(true);
  };

  const handleAddEntry = async (content: string, mood: Mood | undefined, type: EntryType, prompt?: string, isPrivate?: boolean, audioUrl?: string, mediaUrl?: string, where?: { lat: number; lng: number } | null) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    // Store storage references (never links that expire); resolve them for display
    const links = await resolveMedia([audioUrl, mediaUrl]);
    const showAudio = audioUrl ? links.get(audioUrl) ?? (audioUrl.startsWith('sb://') ? undefined : audioUrl) : undefined;
    const showPhoto = mediaUrl ? links.get(mediaUrl) ?? (mediaUrl.startsWith('sb://') ? undefined : mediaUrl) : undefined;

    const { data, error } = await supabase.from('journal_entries').insert([{
        user_id: currentUser.id,
        content,
        type,
        mood,
        title: prompt,
        is_shared: !isPrivate,
        audio_url: audioUrl ?? null,
        photo_url: mediaUrl ?? null,
        ...(where ? { lat: where.lat, lng: where.lng } : {}),
        date: new Date().toISOString(),
        tags: [`circle:${user.activeCircleId}`] 
    }]).select().single();

    if (data && !error) {
         trackEvent('journal_entry_created', { type, mood });
         const newEntry: JournalEntry = {
            id: data.id,
            userId: currentUser.id,
            authorName: user.name,
            authorAvatar: user.avatar,
            content,
            timestamp: new Date(data.created_at),
            type,
            mood,
            prompt,
            isPrivate: isPrivate || false,
            circleId: user.activeCircleId, 
            likes: 0,
            isLiked: false,
            lat: where?.lat, lng: where?.lng,
            audioUrl: showAudio,
            mediaUrl: showPhoto
        };
        setEntries(prev => {
            const next = [newEntry, ...prev];
            setStreak(computeStreak(next.filter(e => e.userId === currentUser.id).map(e => e.timestamp)));
            return next;
        });
        setIsComposeOpen(false); 
        setComposePrompt(undefined);
        showNotification(T.memoryCaptured, 'success');
        // Belluh may have something to add. Quietly skipped if it doesn't, or if the agent isn't deployed.
        belluhAgent.react(data.id).then(res => {
          if (!res?.message?.body) return;
          // On Home it appears right under the entry; elsewhere, as a small card
          window.dispatchEvent(new CustomEvent('belluh:entry-reply', { detail: res.message }));
          if (currentTabRef.current !== 'ai-coach' && currentTabRef.current !== 'timeline') setBelluhReply(res.message.body);
        });
    } else {
        showNotification(T.saveFailed, 'error');
    }
  };

  const handleUpdateEntry = async (entryId: string, newContent: string) => {
    const { error } = await supabase.from('journal_entries').update({ content: newContent }).eq('id', entryId);
    if (!error) {
        setEntries(prev => prev.map(e => e.id === entryId ? { ...e, content: newContent } : e));
        showNotification(T.entryUpdated, 'success');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
      const { error } = await supabase.from('journal_entries').delete().eq('id', entryId);
      if (!error) {
        setEntries(prev => prev.filter(e => e.id !== entryId));
        showNotification(T.entryDeleted, 'success');
      }
  };

  const handleLikeEntry = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    const newLikedState = !entry.isLiked;
    
    setEntries(prevEntries => prevEntries.map(e => {
      if (e.id === entryId) {
        return { ...e, isLiked: newLikedState, likes: (e.likes || 0) + (newLikedState ? 1 : -1) };
      }
      return e;
    }));

    await supabase.from('journal_entries').update({ is_favorite: newLikedState }).eq('id', entryId);
  };

  const handleCircleChange = (circleId: string) => setUser({...user, activeCircleId: circleId});

  // --- Rendering ---
  // A shared guide (belluh.com/g/<link>) opens for anyone, signed in or not
  if (guideSlug) return <React.Suspense fallback={<div className="min-h-screen bg-[#fdf0e9]" />}><GuidePage slug={guideSlug} /></React.Suspense>;
  if (isLoading) return <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center gap-5" role="status" aria-label={T.opening}><DragonflyMark size={64} rippleOnMount={false} className="animate-pulse" />{opening && <p className="text-sm text-slate-400">{T.opening}</p>}</div>;
  if (showAdmin && isUserAdmin) return <AdminMetrics onBack={() => setShowAdmin(false)} />;

  // The company pages are for everyone, signed in or not
  if (authView === 'mission' || authView === 'impact' || authView === 'research') {
      const Page = { mission: MissionPage, impact: ImpactPage, research: ResearchPage }[authView];
      return (
        <>
          <React.Suspense fallback={<div className="min-h-screen bg-[#fffefd]" />}>
            <Page onGetStarted={() => { setAuthMode('signup'); setAuthView('auth'); }} onLogin={() => { setAuthMode('login'); setAuthView('auth'); }} onShowLegal={(type) => setLegalModalOpen(type)} />
          </React.Suspense>
          {legalModalOpen && <LegalModal type={legalModalOpen} onClose={() => setLegalModalOpen(null)} />}
        </>
      );
  }

  if (!isAuthenticated) {
      if (authView === 'landing') {
          return (
              <>
                <LandingPage 
                    onGetStarted={() => { setAuthMode('signup'); setAuthView('auth'); }} 
                    onLogin={() => { setAuthMode('login'); setAuthView('auth'); }} 
                    onShowLegal={(type) => setLegalModalOpen(type)} 
                    onGoToAbout={() => setAuthView('about')} 
                    onGoToCareers={() => setAuthView('careers')}
                />
                {legalModalOpen && <LegalModal type={legalModalOpen} onClose={() => setLegalModalOpen(null)} />}
                {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
              </>
          );
      }
      
      if (authView === 'about') {
          return (
            <>
            <About 
                onBack={() => setAuthView('landing')} 
                onGetStarted={() => { setAuthMode('signup'); setAuthView('auth'); }} 
                onLogin={() => { setAuthMode('login'); setAuthView('auth'); }} 
                onShowLegal={(type) => setLegalModalOpen(type)}
                onGoToCareers={() => setAuthView('careers')}
            />
            {legalModalOpen && <LegalModal type={legalModalOpen} onClose={() => setLegalModalOpen(null)} />}
            </>
          );
      }

      if (authView === 'careers') {
          return (
            <>
            <Careers 
                onBack={() => setAuthView('landing')} 
                onGetStarted={() => { setAuthMode('signup'); setAuthView('auth'); }} 
                onLogin={() => { setAuthMode('login'); setAuthView('auth'); }} 
                onShowLegal={(type) => setLegalModalOpen(type)}
                onGoToAbout={() => setAuthView('about')}
            />
            {legalModalOpen && <LegalModal type={legalModalOpen} onClose={() => setLegalModalOpen(null)} />}
            </>
          );
      }

      if (authView === 'acquisition') {
          return <Acquisition />;
      }
      
      if (authView === 'report') {
          return <Report />;
      }

      // 'auth' view
      return (
        <>
            <Auth 
                initialView={authMode}
                onBack={() => setAuthView(lastPublicView.current)}
                onLogin={handleLogin} 
                onShowLegal={(type) => setLegalModalOpen(type)} 
                onShowToast={showNotification} 
            />
            {legalModalOpen && <LegalModal type={legalModalOpen} onClose={() => setLegalModalOpen(null)} />}
            {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
        </>
      );
  }

  // Shown over any screen, including onboarding, so someone who signs up from a link is asked right away
  const inviteModal = inviteOffer ? (
        <div className="fixed inset-0 z-[150] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 text-center shadow-2xl animate-scale-in">
            <div className="w-fit mx-auto mb-5 text-[#9bbecb]" aria-hidden="true"><Sparkles size={30} strokeWidth={1.5} /></div>
            <h2 className="font-serif text-2xl text-slate-900 mb-3">{f(T.inviteTitle, { name: inviteOffer.name })}</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-7">{T.inviteBody}</p>
            <button disabled={inviteBusy} onClick={() => answerInvite(true)} className="w-full py-4 rounded-full bg-[#f0addd] text-white font-bold hover:bg-[#e57ec3] disabled:opacity-60">{T.connect}</button>
            <button disabled={inviteBusy} onClick={() => answerInvite(false)} className="w-full py-3 mt-2 text-sm font-bold text-slate-400 hover:text-slate-700">{T.notNow}</button>
          </div>
        </div>
      ) : null;

  // After a password reset link: choose the new one
  const recoveryModal = recovering ? (
        <div className="fixed inset-0 z-[160] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <form className="bg-white rounded-[2rem] max-w-sm w-full p-8 shadow-2xl animate-scale-in" onSubmit={async e => {
              e.preventDefault();
              const ok = newPassword.length >= 8 && /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
              if (!ok) { showNotification(T.passwordRule, 'error'); return; }
              const { error } = await supabase.auth.updateUser({ password: newPassword });
              if (error) { showNotification(error.message, 'error'); return; }
              setRecovering(false); setNewPassword(''); showNotification(T.passwordUpdated, 'success');
          }}>
            <h2 className="font-serif text-2xl text-slate-900">{T.newPasswordTitle}</h2>
            <p className="mt-2 text-sm text-slate-500">{T.passwordHint}</p>
            <input type="password" autoComplete="new-password" autoFocus value={newPassword} onChange={e => setNewPassword(e.target.value)} aria-label={T.newPasswordLabel} className="mt-6 w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[16px] focus:outline-none focus:ring-4 focus:ring-[#CDE9F2]/70 focus:border-[#9bbecb]" />
            <button type="submit" className="mt-5 w-full h-12 rounded-full bg-slate-900 text-white font-bold text-sm hover:bg-black">{T.savePassword}</button>
            <button type="button" onClick={() => setRecovering(false)} className="mt-2 w-full h-10 text-sm font-semibold text-slate-400 hover:text-slate-700">{T.notNow}</button>
          </form>
        </div>
      ) : null;

  if (isOnboarding) return <>{inviteModal}{recoveryModal}<Onboarding onComplete={handleOnboardingComplete} /></>;

  return (
    <div data-app className="bg-paper min-h-screen text-slate-800 font-sans selection:bg-belluh-100 selection:text-belluh-900 overflow-x-hidden animate-fade-in lg:pl-[var(--sidebar-w,16rem)] lg:transition-[padding] lg:duration-300">
      {currentTab === 'timeline' && <Timeline entries={entries.filter(e => user.activeCircleId === 'constellation' || e.circleId === user.activeCircleId)} currentUserId={user.id} partnerName={user.partnerName} avatars={hasPartner ? [user.avatar, calmAvatar(user.partnerAvatar) || avatarFor(user.partnerName || 'partner')] : [user.avatar]} onTriggerPremium={handleTriggerPremium} activeCircleId={user.activeCircleId} circles={user.circles} onCircleChange={handleCircleChange} onLikeEntry={handleLikeEntry} onCompose={handleCompose} onDeleteEntry={handleDeleteEntry} onUpdateEntry={handleUpdateEntry} streak={streak} onAskBelluh={askBelluh} onOpenBelluh={() => askBelluh('')} />}
      {currentTab === 'map' && <React.Suspense fallback={<div className="fixed inset-0 bg-[#fbe3f1]" />}><LoveMap entries={readableEntries.filter(e => user.activeCircleId === 'constellation' || e.circleId === user.activeCircleId)} currentUserId={user.id} myName={user.name} /></React.Suspense>}
      {currentTab === 'ai-coach' && <AICoach insights={MOCK_INSIGHTS} entryTexts={readableEntries.map(e => e.content)} onTriggerPremium={handleTriggerPremium} userName={user.name} initialMessage={belluhAsk} onInitialMessageSent={() => setBelluhAsk(null)} onCompose={(prompt) => handleCompose(prompt)} initialSpace={hasPartner ? tabSpace : undefined} />}
      {belluhSheet && (
        <div className="fixed inset-0 z-[70] bg-paper animate-slide-up" role="dialog" aria-label="Bella">
          <AICoach insights={MOCK_INSIGHTS} entryTexts={readableEntries.map(e => e.content)} onTriggerPremium={handleTriggerPremium} userName={user.name} initialMessage={belluhAsk} onInitialMessageSent={() => setBelluhAsk(null)} onCompose={(prompt) => { setBelluhSheet(false); handleCompose(prompt); }} initialSpace="me" inSheet onClose={() => setBelluhSheet(false)} />
        </div>
      )}
      {currentTab === 'profile' && <Profile user={user} entries={readableEntries} streak={streak} onCircleChange={handleCircleChange} onCreateCircle={handleCreateCircle} onArchiveCircle={handleArchiveCircle} onRenameCircle={handleRenameCircle} onLogout={handleLogout} onUpdateUser={handleUpdateUser} onShowLegal={(type) => setLegalModalOpen(type)} onViewArtifact={(type) => setArtifactModalOpen(type)} onShowToast={showNotification} pendingInvites={pendingInvites} onAcceptInvite={handleAcceptInvite} onDeclineInvite={handleDeclineInvite} />}
      
      {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      {inviteModal}
      {recoveryModal}
      {belluhReply && currentTab !== 'ai-coach' && !isComposeOpen && (
        <div className="fixed bottom-28 left-0 right-0 px-6 z-[55] flex justify-center animate-slide-up lg:bottom-8 lg:left-[var(--sidebar-w,16rem)]">
          <div className="max-w-[360px] w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-900/10 border border-white p-4 flex gap-3">
            <div className="shrink-0 pt-0.5"><BelluhOrb size={24} /></div>
            <button className="text-left flex-1" onClick={() => { setBelluhReply(null); setCurrentTab('ai-coach'); }}>
              <p className="text-xs font-bold text-slate-400">Belluh</p>
              <p className="font-serif text-[15px] leading-snug text-slate-800 line-clamp-3">{belluhReply}</p>
              <p className="text-xs font-bold text-belluh-500 mt-1.5">{T.reply}</p>
            </button>
            <button aria-label={T.dismiss} onClick={() => setBelluhReply(null)} className="text-slate-300 hover:text-slate-500 self-start"><X size={16} /></button>
          </div>
        </div>
      )}
      <TabBar currentTab={currentTab} usTab={hasPartner} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} badges={{ 'ai-coach': unreadNotes > 0 || newFromBelluh }} onTabChange={(tab) => { trackEvent('tab_changed', { tab }); if (tab === 'ai-coach') { setTabSpace(unreadNotes > 0 || newFromBelluh ? 'me' : 'us'); setUnreadNotes(0); setNewFromBelluh(false); setBelluhReply(null); } setCurrentTab(tab); }} onCompose={() => handleCompose()} />
      {isComposeOpen && <div className="fixed inset-0 z-[60] bg-paper animate-slide-up"><button onClick={() => setIsComposeOpen(false)} aria-label={T.close} className="absolute top-5 right-4 w-11 h-11 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 z-50 transition-colors"><X size={22} /></button><Journal onAddEntry={handleAddEntry} partnerName={user.partnerName || ''} onTriggerPremium={handleTriggerPremium} initialPrompt={composePrompt} userName={user.name} partnerHasEntry={partnerHasEntry} /></div>}
      
      {showIntro && <IntroGuide onClose={() => setShowIntro(false)} />}

      {legalModalOpen && <LegalModal type={legalModalOpen} onClose={() => setLegalModalOpen(null)} />}
      
      {artifactModalOpen && <ArtifactModal type={artifactModalOpen} onClose={() => setArtifactModalOpen(null)} entries={readableEntries} currentUserId={user.id} userName={user.name} partnerName={user.partnerName || T.partner} />}
      {showPremiumOverlay && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowPremiumOverlay(false)}><div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center relative overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}><div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-belluh-300 via-purple-300 to-indigo-300" /><div className="w-20 h-20 bg-belluh-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-apple animate-float"><Sparkles size={32} className="text-belluh-500" /></div><h2 className="text-3xl font-serif text-slate-900 mb-3 tracking-tight">Belluh Premium</h2><p className="text-slate-500 mb-8 text-sm leading-relaxed font-medium">{T.premiumBody}</p><button onClick={() => setShowPremiumOverlay(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-black transition-transform active:scale-95 shadow-xl shadow-slate-200">{T.startTrial}</button><button onClick={() => setShowPremiumOverlay(false)} className="w-full py-3 text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest">{T.maybeLater}</button></div></div>}
    </div>
  );
};

export default App;