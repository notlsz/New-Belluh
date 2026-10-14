import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { supabase } from './lib/supabaseClient';
import { useAdminAccess } from './hooks/useAdminAccess';
import { trackEvent } from './services/analytics';
import { belluhAgent } from './services/belluhAgent';
import { resolveMedia, repairLegacyUrl } from './services/media';
import { computeStreak, hideLockedAnswer, questionForDay } from './lib/daily';

import Acquisition from './pages/Acquisition';
import Report from './pages/Report';

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
  const loadedUserId = useRef<string | null>(null);
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Added loading state to prevent flash
  const [isOnboarding, setIsOnboarding] = useState(false);
  
  // View State for Unauthenticated Users ('landing' | 'auth' | 'about' | 'careers' | 'acquisition' | 'report')
  const getInitialAuthView = () => {
    const path = window.location.pathname;
    if (path.startsWith('/report')) return 'report';
    if (path.startsWith('/we-have-been-acquired')) return 'acquisition';
    if (path.startsWith('/careers')) return 'careers';
    if (path === '/about') return 'about';
    return 'landing';
  };
  const [authView, setAuthView] = useState<'landing' | 'auth' | 'about' | 'careers' | 'acquisition' | 'report'>(getInitialAuthView());
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  
  // App State
  // A notification opens straight to the Belluh tab (?tab=belluh), then the address is tidied
  const [currentTab, setCurrentTab] = useState(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('tab') !== 'belluh') return 'timeline';
      url.searchParams.delete('tab');
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
      return 'ai-coach';
    } catch { return 'timeline'; }
  });
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
  const askBelluh = (message: string) => { setBelluhAsk(message || null); setBelluhReply(null); setNewFromBelluh(false); setCurrentTab('ai-coach'); };
  const [inviteOffer, setInviteOffer] = useState<{ token: string; name: string } | null>(null);
  const currentTabRef = useRef(currentTab);
  useEffect(() => { currentTabRef.current = currentTab; if (currentTab === 'ai-coach') setBelluhReply(null); }, [currentTab]);
  const [inviteBusy, setInviteBusy] = useState(false);

  const answerInvite = async (accept: boolean) => {
    if (!inviteOffer) return;
    setInviteBusy(true);
    if (accept) {
      const { error } = await supabase.rpc('accept_partner_invite', { p_token: inviteOffer.token });
      if (error) showNotification("That invite link has expired or was already used. Ask for a new one.", "error");
      else {
        showNotification(`You're connected with ${inviteOffer.name}.`, "success");
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
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
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
      else if (path === '/about') setAuthView('about');
      else setAuthView('landing');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    if (authView === 'landing' && path !== '/') window.history.pushState({}, '', '/');
    else if (authView === 'about' && path !== '/about') window.history.pushState({}, '', '/about');
    else if (authView === 'careers' && !path.startsWith('/careers')) window.history.pushState({}, '', '/careers');
    else if (authView === 'acquisition' && !path.startsWith('/we-have-been-acquired')) window.history.pushState({}, '', '/we-have-been-acquired');
    else if (authView === 'report' && !path.startsWith('/report')) window.history.pushState({}, '', '/report');
  }, [authView]);

  // --- Auth Helpers ---

  const resetUserState = () => {
      setIsAuthenticated(false);
      setEntries([]);
      setStreak(0);
      setUser({
          id: '',
          name: '',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
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

  const loadUserData = async (sessionUser: any) => {
      try {
        trackEvent('app_opened', { source: 'web' });

        // --- HANDLE INVITE LINKS (Persistent) ---
        const params = new URLSearchParams(window.location.search);
        let inviteToken = params.get('invite');
        try { if (!inviteToken) inviteToken = localStorage.getItem('pending_invite_id'); } catch { /* storage blocked */ }

        // Invite links carry a one-time token. We ask before connecting: opening a link alone never links accounts.
        if (inviteToken) {
            const { data: inviterName, error: previewError } = await supabase.rpc('preview_partner_invite', { p_token: inviteToken });
            const rpcMissing = !!previewError && /could not find the function|PGRST202/i.test(`${previewError.message} ${(previewError as any).code ?? ''}`);
            const isLegacyUserId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inviteToken);
            if (inviterName) {
                setInviteOffer({ token: inviteToken, name: inviterName as string });
            } else if (rpcMissing && isLegacyUserId && inviteToken !== sessionUser.id) {
                // Before the new invite system is installed: send a request the other person must accept
                const { error: reqError } = await supabase.from('partner_connections')
                    .insert({ user_id: sessionUser.id, partner_id: inviteToken, status: 'pending' });
                if (!reqError || reqError.code === '23505') showNotification("Request sent. It connects once they accept it in their profile.", "success");
                try { localStorage.removeItem('pending_invite_id'); } catch { /* ignore */ }
            } else {
                showNotification("That invite link has expired or was already used. Ask for a new one.", "error");
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

        // 1. Fetch User Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sessionUser.id)
            .maybeSingle();

        // 2. Fetch Active Partner Connections
        const { data: connections } = await supabase
            .from('partner_connections')
            .select('*')
            .eq('status', 'connected')
            .or(`user_id.eq.${sessionUser.id},partner_id.eq.${sessionUser.id}`);
        
        let connectedUserIds: string[] = [];
        if (connections && connections.length > 0) {
            connectedUserIds = connections.map((c: any) => c.user_id === sessionUser.id ? c.partner_id : c.user_id);
        }

        // 3. Fetch All Journal Entries (Content + System Data)
        const initialUserIds = [sessionUser.id, ...connectedUserIds];
        const { data: dbEntries } = await supabase
            .from('journal_entries')
            .select('*')
            .in('user_id', initialUserIds)
            .order('created_at', { ascending: false });

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
        
        // 4. Fetch Profiles for ALL relevant users
        const allProfileIds = [...new Set([...initialUserIds, ...extendedMemberIds])];
        const { data: allProfiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', allProfileIds);
        
        const connectedProfiles = allProfiles?.filter((p: any) => connectedUserIds.includes(p.id)) || [];
        const myProfile = allProfiles?.find((p: any) => p.id === sessionUser.id);

        // 5. Build Circles
        const newCircles: any[] = [];
        const myFirstName = myProfile?.full_name?.trim().split(' ')[0] || sessionUser.email?.split('@')[0] || 'Me';
        
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
                const memberEntries = dbEntries.filter((e: any) => 
                    e.tags && e.tags.includes('system_circle_member') && e.tags.includes(`circle:${circleId}`)
                );
                memberEntries.forEach((m: any) => {
                    const tag = m.tags.find((t: string) => t.startsWith('member:'));
                    if (tag) members.push(tag.split(':')[1]);
                });
            }
            return members;
        };

        if (connectedProfiles.length > 0) {
            connectedProfiles.forEach((pProfile, index) => {
                const partnerFirstName = pProfile.full_name?.trim().split(' ')[0] || 'Partner';
                let circleName = `${myFirstName} & ${partnerFirstName}`;
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
                        name: prof?.full_name || 'Unknown',
                        avatar: prof?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mid}`
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
                    avatar: pProfile.avatar_url,
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
                    name: prof?.full_name || 'Unknown',
                    avatar: prof?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mid}`
                };
            });

             newCircles.push({
                id: circleId,
                name: meta.name || `${myFirstName}'s Space`,
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
                        name: prof?.full_name || 'Unknown',
                        avatar: prof?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mid}`
                    };
                });
                const isArchived = e.tags && e.tags.includes('status:archived');
                newCircles.push({
                    id: e.id,
                    name: e.title || 'Untitled Circle',
                    type: CircleType.Custom,
                    status: isArchived ? CircleStatus.Archived : CircleStatus.Active,
                    members: allMembers,
                    memberProfiles: profiles,
                    themeColor: e.content || '#cbd5e1', 
                    startDate: new Date(e.created_at)
                });
            });
        }

        const { data: pendingRows } = await supabase
            .from('partner_connections')
            .select('*')
            .eq('partner_id', sessionUser.id)
            .eq('status', 'pending');
        
        if (pendingRows && pendingRows.length > 0) {
            const inviterIds = pendingRows.map((r: any) => r.user_id);
            const { data: inviters } = await supabase.from('profiles').select('*').in('id', inviterIds);
            const invites: PendingInvite[] = pendingRows.map((r: any) => {
                const inviter = inviters?.find((p: any) => p.id === r.user_id);
                return {
                    id: r.id,
                    inviter: {
                        id: inviter?.id || r.user_id,
                        name: inviter?.full_name || 'Unknown User',
                        avatar: inviter?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.user_id}`
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
            let authorName = 'Unknown';
            let authorAvatar = '';

            const authorProfile = allProfiles?.find((p: any) => p.id === e.user_id);
            if (authorProfile) {
                authorName = isMine ? (myProfile?.full_name || 'Me') : authorProfile.full_name;
                authorAvatar = authorProfile.avatar_url;
            } else {
                authorName = isMine ? 'Me' : 'Friend';
                authorAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${e.user_id}`;
            }

            const circleTag = e.tags && Array.isArray(e.tags) ? e.tags.find((t: string) => t.startsWith('circle:')) : null;
            const entryCircleId = circleTag ? circleTag.split(':')[1] : 'c1';

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
                audioUrl: repairLegacyUrl(e.audio_url)
            };
        });
        // Private voice notes and photos get fresh links each time the journal loads
        const links = await resolveMedia(mappedEntries.flatMap(e => [e.mediaUrl, e.audioUrl]));
        setEntries(mappedEntries.map(e => ({
            ...e,
            mediaUrl: e.mediaUrl && links.get(e.mediaUrl) || (e.mediaUrl?.startsWith('sb://') ? undefined : e.mediaUrl),
            audioUrl: e.audioUrl && links.get(e.audioUrl) || (e.audioUrl?.startsWith('sb://') ? undefined : e.audioUrl),
        })));

        // Streak = consecutive days with at least one entry of yours, counting back from today (or yesterday)
        setStreak(computeStreak(mappedEntries.filter(e => e.userId === sessionUser.id).map(e => e.timestamp)));

        const primaryPartner = connectedProfiles.length > 0 ? connectedProfiles[0] : null;
        const displayPartnerName = myProfile?.partner_name || primaryPartner?.full_name || undefined;

        // Parse user settings if available in profile (assuming we store them later, for now defaults)
        // Here we just use default, could expand profile table to store settings JSON
        
        setUser(prev => ({ 
            ...prev, 
            id: sessionUser.id, 
            name: myProfile?.full_name || sessionUser.email?.split('@')[0] || 'User',
            avatar: myProfile?.avatar_url || prev.avatar,
            partnerName: displayPartnerName,
            partnerAvatar: primaryPartner?.avatar_url || undefined,
            circles: newCircles as any,
            // Stay in the circle you were in, if it still exists
            activeCircleId: newCircles.some((c: any) => c.id === prev.activeCircleId) ? prev.activeCircleId : 'c1',
            isPremium: false,
            settings: { ...CURRENT_USER.settings, ...loadSavedSettings() },
            hasCompletedOnboarding: !!displayPartnerName,
            relationshipFacts: relationshipFacts
        }));
        
        if (!displayPartnerName && !primaryPartner) {
           setIsOnboarding(true);
        } else {
            setIsOnboarding(false);
        }
        
        setIsAuthenticated(true);
      } catch (err) {
          console.error("Failed to load user data", err);
      } finally {
          setIsLoading(false);
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
        // Token refreshes happen every hour and must not reload everything or reset your place
        if (event === 'SIGNED_IN') {
            if (session?.user && mounted && loadedUserId.current !== session.user.id) {
                loadedUserId.current = session.user.id;
                loadUserData(session.user);
            }
        } else if (event === 'SIGNED_OUT') {
            loadedUserId.current = null;
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
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    
    // 1. Update Profile
    await supabase.from('profiles').update({ partner_name: partnerName }).eq('id', currentUser.id);
    
    // 2. Insert Entry
    const { data: entryData } = await supabase.from('journal_entries').insert([{
        user_id: currentUser.id,
        content: firstEntry,
        type: 'Freeform', 
        is_shared: false, 
        is_favorite: false,
        tags: ['onboarding', 'first_magic_moment', 'circle:c1'], 
        date: new Date().toISOString()
    }]).select().single();
    
    // 3. Update Local State
    setUser(prev => ({ ...prev, partnerName, hasCompletedOnboarding: true }));
    
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

    setIsOnboarding(false);
    setShowIntro(true); 
    // loadUserData(currentUser) call removed to prevent state race condition
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
      showNotification('Profile updated', 'success');
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
          showNotification('New circle created!', 'success');
          loadUserData(currentUser);
      } else {
          showNotification('Failed to create circle.', 'error');
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
              showNotification('Circle renamed', 'success');
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
          if (renameError) { showNotification("Couldn't rename the circle. Try again.", 'error'); return; }
          
          setUser(prev => ({
              ...prev,
              circles: prev.circles.map(c => c.id === circleId ? { ...c, name: newName } : c)
          }));
          showNotification('Circle renamed', 'success');
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
      showNotification(isArchiving ? 'Circle archived' : 'Circle restored', 'success');
  };

  const handleAcceptInvite = async (connectionId: string) => {
      setPendingInvites(prev => prev.filter(i => i.id !== connectionId));
      try {
          const { error } = await supabase
              .from('partner_connections')
              .update({ status: 'connected' })
              .eq('id', connectionId);
          if (error) throw error;
          showNotification('Invite accepted!', 'success');
          const { data: { user } } = await supabase.auth.getUser();
          if (user) loadUserData(user);
      } catch (error) {
          showNotification('Failed to accept', 'error');
          const { data: { user } } = await supabase.auth.getUser();
          if (user) loadUserData(user);
      }
  };

  const handleDeclineInvite = async (connectionId: string) => {
      setPendingInvites(prev => prev.filter(i => i.id !== connectionId));
      try {
          await supabase.from('partner_connections').delete().eq('id', connectionId);
          showNotification('Invite declined', 'success');
      } catch (error) {
          showNotification('Failed to decline', 'error');
      }
  };

  const handleCompose = (prompt?: string) => {
      setComposePrompt(prompt);
      setIsComposeOpen(true);
  };

  const handleAddEntry = async (content: string, mood: Mood | undefined, type: EntryType, prompt?: string, isPrivate?: boolean, audioUrl?: string, mediaUrl?: string) => {
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
        showNotification('Memory captured!', 'success');
        // Belluh may have something to add. Quietly skipped if it doesn't, or if the agent isn't deployed.
        belluhAgent.react(data.id).then(res => { if (res?.message?.body && currentTabRef.current !== 'ai-coach') setBelluhReply(res.message.body); });
    } else {
        showNotification('Failed to save.', 'error');
    }
  };

  const handleUpdateEntry = async (entryId: string, newContent: string) => {
    const { error } = await supabase.from('journal_entries').update({ content: newContent }).eq('id', entryId);
    if (!error) {
        setEntries(prev => prev.map(e => e.id === entryId ? { ...e, content: newContent } : e));
        showNotification('Entry updated', 'success');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
      const { error } = await supabase.from('journal_entries').delete().eq('id', entryId);
      if (!error) {
        setEntries(prev => prev.filter(e => e.id !== entryId));
        showNotification('Entry deleted', 'success');
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
  if (isLoading) return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center"><Sparkles className="text-belluh-300 w-10 h-10 mb-4 animate-pulse" /></div>;
  if (showAdmin && isUserAdmin) return <AdminMetrics onBack={() => setShowAdmin(false)} />;

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
            <About 
                onBack={() => setAuthView('landing')} 
                onGetStarted={() => { setAuthMode('signup'); setAuthView('auth'); }} 
                onLogin={() => { setAuthMode('login'); setAuthView('auth'); }} 
            />
          );
      }

      if (authView === 'careers') {
          return (
            <Careers 
                onBack={() => setAuthView('landing')} 
                onGetStarted={() => { setAuthMode('signup'); setAuthView('auth'); }} 
                onLogin={() => { setAuthMode('login'); setAuthView('auth'); }} 
                onShowLegal={(type) => setLegalModalOpen(type)}
                onGoToAbout={() => setAuthView('about')}
            />
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
            <div className="w-14 h-14 rounded-full bg-[#f7d8ee] flex items-center justify-center mx-auto mb-5"><Sparkles size={22} className="text-[#d46aa9]" /></div>
            <h2 className="font-serif text-2xl text-slate-900 mb-3">Connect with {inviteOffer.name}?</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-7">You'll each see the entries the other chooses to share. Private entries stay private. You can disconnect anytime.</p>
            <button disabled={inviteBusy} onClick={() => answerInvite(true)} className="w-full py-4 rounded-full bg-[#f0addd] text-white font-bold hover:bg-[#e57ec3] disabled:opacity-60">Connect</button>
            <button disabled={inviteBusy} onClick={() => answerInvite(false)} className="w-full py-3 mt-2 text-sm font-bold text-slate-400 hover:text-slate-700">Not now</button>
          </div>
        </div>
      ) : null;

  if (isOnboarding) return <>{inviteModal}<Onboarding onComplete={handleOnboardingComplete} /></>;

  return (
    <div className="bg-paper min-h-screen text-slate-800 font-sans selection:bg-belluh-100 selection:text-belluh-900 overflow-x-hidden animate-fade-in">
      {currentTab === 'timeline' && <Timeline entries={entries.filter(e => user.activeCircleId === 'constellation' || e.circleId === user.activeCircleId)} currentUserId={user.id} partnerName={user.partnerName} onTriggerPremium={handleTriggerPremium} activeCircleId={user.activeCircleId} circles={user.circles} onCircleChange={handleCircleChange} onLikeEntry={handleLikeEntry} onCompose={handleCompose} onDeleteEntry={handleDeleteEntry} onUpdateEntry={handleUpdateEntry} streak={streak} onAskBelluh={askBelluh} onOpenBelluh={() => askBelluh('')} />}
      {currentTab === 'ai-coach' && <AICoach insights={MOCK_INSIGHTS} entryTexts={readableEntries.map(e => e.content)} onTriggerPremium={handleTriggerPremium} userName={user.name} initialMessage={belluhAsk} onInitialMessageSent={() => setBelluhAsk(null)} />}
      {currentTab === 'profile' && <Profile user={user} entries={readableEntries} streak={streak} onCircleChange={handleCircleChange} onCreateCircle={handleCreateCircle} onArchiveCircle={handleArchiveCircle} onRenameCircle={handleRenameCircle} onLogout={handleLogout} onUpdateUser={handleUpdateUser} onShowLegal={(type) => setLegalModalOpen(type)} onViewArtifact={(type) => setArtifactModalOpen(type)} onShowToast={showNotification} pendingInvites={pendingInvites} onAcceptInvite={handleAcceptInvite} onDeclineInvite={handleDeclineInvite} />}
      
      {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      {inviteModal}
      {belluhReply && currentTab !== 'ai-coach' && !isComposeOpen && (
        <div className="fixed bottom-28 left-0 right-0 px-6 z-[55] flex justify-center animate-slide-up">
          <div className="max-w-[360px] w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-900/10 border border-white p-4 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-belluh-600 flex items-center justify-center text-white shrink-0"><Sparkles size={14} /></div>
            <button className="text-left flex-1" onClick={() => { setBelluhReply(null); setCurrentTab('ai-coach'); }}>
              <p className="text-xs font-bold text-slate-400">Belluh</p>
              <p className="font-serif text-[15px] leading-snug text-slate-800 line-clamp-3">{belluhReply}</p>
              <p className="text-xs font-bold text-belluh-500 mt-1.5">Reply</p>
            </button>
            <button aria-label="Dismiss" onClick={() => setBelluhReply(null)} className="text-slate-300 hover:text-slate-500 self-start"><X size={16} /></button>
          </div>
        </div>
      )}
      <TabBar currentTab={currentTab} badges={{ 'ai-coach': unreadNotes > 0 || newFromBelluh }} onTabChange={(tab) => { trackEvent('tab_changed', { tab }); if (tab === 'ai-coach') { setUnreadNotes(0); setNewFromBelluh(false); setBelluhReply(null); } setCurrentTab(tab); }} onCompose={() => handleCompose()} />
      {isComposeOpen && <div className="fixed inset-0 z-[60] bg-paper animate-slide-up"><button onClick={() => setIsComposeOpen(false)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 z-50 transition-colors"><X size={20} /></button><Journal onAddEntry={handleAddEntry} partnerName={user.partnerName || 'Partner'} onTriggerPremium={handleTriggerPremium} initialPrompt={composePrompt} userName={user.name} partnerHasEntry={partnerHasEntry} /></div>}
      
      {showIntro && <IntroGuide onClose={() => setShowIntro(false)} />}

      {legalModalOpen && <LegalModal type={legalModalOpen} onClose={() => setLegalModalOpen(null)} />}
      
      {artifactModalOpen && <ArtifactModal type={artifactModalOpen} onClose={() => setArtifactModalOpen(null)} entries={readableEntries} currentUserId={user.id} userName={user.name} partnerName={user.partnerName || 'Partner'} />}
      {showPremiumOverlay && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowPremiumOverlay(false)}><div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center relative overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}><div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-belluh-300 via-purple-300 to-indigo-300" /><div className="w-20 h-20 bg-belluh-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-apple animate-float"><Sparkles size={32} className="text-belluh-500" /></div><h2 className="text-3xl font-serif text-slate-900 mb-3 tracking-tight">Belluh Premium</h2><p className="text-slate-500 mb-8 text-sm leading-relaxed font-medium">Unlock deeper intimacy.</p><button onClick={() => setShowPremiumOverlay(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-black transition-transform active:scale-95 shadow-xl shadow-slate-200">Start Free Trial</button><button onClick={() => setShowPremiumOverlay(false)} className="w-full py-3 text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest">Maybe Later</button></div></div>}
    </div>
  );
};

export default App;