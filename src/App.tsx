import React, { useState, useMemo, useEffect } from 'react';
import TabBar from './components/TabBar';
import Journal from './pages/Journal';
import Timeline from './pages/Timeline';
import AICoach from './pages/AICoach';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import AdminMetrics from './pages/AdminMetrics';
import LegalModal from './components/LegalModal';
import ArtifactModal from './components/ArtifactModal';
import { CURRENT_USER, MOCK_INSIGHTS, THEMES } from './constants';
import { JournalEntry, EntryType, Mood, User, CircleType, CircleStatus, ColorTheme } from './types';
import { Sparkles, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { useAdminAccess } from './hooks/useAdminAccess';
import { trackEvent } from './services/analytics';

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

// Generate signed URLs for secure media access
const getSignedStorageUrl = async (bucketName: string, filePath: string, expirySeconds = 3600) => {
  if (!filePath) return null;
  
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expirySeconds);
    
    if (error) {
      console.error(`Error creating signed URL for ${bucketName}/${filePath}:`, error);
      return null;
    }
    
    return data?.signedUrl;
  } catch (err) {
    console.error('Failed to get signed URL:', err);
    return null;
  }
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

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Added loading state to prevent flash
  const [isOnboarding, setIsOnboarding] = useState(false);
  
  // View State for Unauthenticated Users ('landing' | 'auth' | 'about')
  const [authView, setAuthView] = useState<'landing' | 'auth' | 'about'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  
  // App State
  const [currentTab, setCurrentTab] = useState('timeline');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composePrompt, setComposePrompt] = useState<string | undefined>(undefined);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [streak, setStreak] = useState(0);
  
  // Pending Invites State
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  
  // Notification State
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

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
      settings: CURRENT_USER.settings,
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
          settings: CURRENT_USER.settings,
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
        let inviteId = params.get('invite');
        if (!inviteId) inviteId = localStorage.getItem('pending_invite_id');

        if (inviteId && inviteId !== sessionUser.id) {
            const { data: existing } = await supabase
                .from('partner_connections')
                .select('*')
                .or(`and(user_id.eq.${inviteId},partner_id.eq.${sessionUser.id}),and(user_id.eq.${sessionUser.id},partner_id.eq.${inviteId})`);
            
            if (!existing || existing.length === 0) {
                await supabase.from('partner_connections').insert({
                    user_id: inviteId,
                    partner_id: sessionUser.id,
                    status: 'pending'
                });
                showNotification("Invite received! Check your profile.", "success");
            }
            localStorage.removeItem('pending_invite_id');
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
            const metaEntry = dbEntries?.find((e: any) => 
                e.tags && e.tags.includes('system_circle_metadata') && e.tags.includes(`circle:${circleId}`)
            );
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
            !e.tags || (
                !e.tags.includes('system_circle_def') && 
                !e.tags.includes('system_circle_member') &&
                !e.tags.includes('system_facts') &&
                !e.tags.includes('system_circle_metadata')
            )
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
                mediaUrl: e.photo_url,
                audioUrl: e.audio_url
            };
        });
        setEntries(mappedEntries);

        const currentStreak = myProfile?.journal_streak || 0;
        setStreak(currentStreak);

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
            activeCircleId: 'c1', 
            isPremium: false,
            settings: CURRENT_USER.settings, // In a real app, merge with saved settings
            hasCompletedOnboarding: !!displayPartnerName,
            relationshipFacts: relationshipFacts
        }));
        
        setIsOnboarding(false);
        setIsAuthenticated(true);
      } catch (err) {
          console.error("Failed to load user data", err);
      } finally {
          setIsLoading(false);
      }
  };

  // Initialize Supabase Auth & Data
  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.user && mounted) {
                loadUserData(session.user);
            }
        } else if (event === 'SIGNED_OUT') {
            if (mounted) resetUserState();
        }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user && mounted) loadUserData(session.user);
        else if (mounted) setIsLoading(false);
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
    
    await supabase.from('profiles').update({ partner_name: partnerName }).eq('id', currentUser.id);
    await supabase.from('journal_entries').insert([{
        user_id: currentUser.id,
        content: firstEntry,
        type: 'Freeform', 
        is_shared: false, 
        is_favorite: false,
        tags: ['onboarding', 'first_magic_moment', 'circle:c1'], 
        date: new Date().toISOString()
    }]);
    
    setUser(prev => ({ ...prev, partnerName, hasCompletedOnboarding: true }));
    setIsOnboarding(false);
    loadUserData(currentUser);
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
      if (updates.relationshipFacts) {
          setUser(prev => ({ ...prev, ...updates }));
          return;
      }
      
      // Theme Update
      if (updates.settings) {
          setUser(prev => ({ ...prev, settings: { ...prev.settings, ...updates.settings } }));
          // Ideally save to DB here
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
            .contains('tags', ['system_circle_metadata', `circle:${circleId}`])
            .maybeSingle();

          if (existingMeta) {
              await supabase.from('journal_entries').update({ title: newName }).eq('id', existingMeta.id);
          } else {
              await supabase.from('journal_entries').insert([{
                  user_id: currentUser.id,
                  title: newName,
                  type: 'Milestone',
                  tags: ['system_circle_metadata', `circle:${circleId}`],
                  is_shared: true,
                  date: new Date().toISOString()
              }]);
          }
          
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
            .contains('tags', ['system_circle_metadata', `circle:${circleId}`])
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
                  tags: ['system_circle_metadata', `circle:${circleId}`, isArchiving ? 'status:archived' : ''],
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

    let signedAudioUrl = audioUrl;
    let signedPhotoUrl = mediaUrl;

    if (audioUrl && !audioUrl.includes('?token=')) {
        const fileName = audioUrl.split('/').pop();
        if (fileName) signedAudioUrl = await getSignedStorageUrl('journal-media', fileName, 3600);
    }
    if (mediaUrl && !mediaUrl.includes('?token=') && !mediaUrl.startsWith('data:')) {
        const fileName = mediaUrl.split('/').pop();
        if (fileName) signedPhotoUrl = await getSignedStorageUrl('journal-media', fileName, 3600);
    }

    const { data, error } = await supabase.from('journal_entries').insert([{
        user_id: currentUser.id,
        content,
        type,
        mood,
        title: prompt,
        is_shared: !isPrivate,
        audio_url: signedAudioUrl,
        photo_url: signedPhotoUrl,
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
            audioUrl: signedAudioUrl || undefined,
            mediaUrl: signedPhotoUrl || undefined
        };
        setEntries(prev => [newEntry, ...prev]);
        setIsComposeOpen(false); 
        setComposePrompt(undefined);
        showNotification('Memory captured!', 'success');
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

  if (isOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <div className="bg-paper min-h-screen text-slate-800 font-sans selection:bg-belluh-100 selection:text-belluh-900 overflow-x-hidden animate-fade-in">
      {currentTab === 'timeline' && <Timeline entries={entries.filter(e => user.activeCircleId === 'constellation' || e.circleId === user.activeCircleId)} currentUserId={user.id} onTriggerPremium={handleTriggerPremium} activeCircleId={user.activeCircleId} circles={user.circles} onCircleChange={handleCircleChange} onLikeEntry={handleLikeEntry} onCompose={handleCompose} onDeleteEntry={handleDeleteEntry} onUpdateEntry={handleUpdateEntry} streak={streak} />}
      {currentTab === 'ai-coach' && <AICoach insights={MOCK_INSIGHTS} entryTexts={entries.map(e => e.content)} onTriggerPremium={handleTriggerPremium} />}
      {currentTab === 'profile' && <Profile user={user} entries={entries} streak={streak} onCircleChange={handleCircleChange} onCreateCircle={handleCreateCircle} onArchiveCircle={handleArchiveCircle} onRenameCircle={handleRenameCircle} onLogout={handleLogout} onUpdateUser={handleUpdateUser} onShowLegal={(type) => setLegalModalOpen(type)} onViewArtifact={(type) => setArtifactModalOpen(type)} onShowToast={showNotification} pendingInvites={pendingInvites} onAcceptInvite={handleAcceptInvite} onDeclineInvite={handleDeclineInvite} />}
      
      {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      <TabBar currentTab={currentTab} onTabChange={(tab) => { trackEvent('tab_changed', { tab }); setCurrentTab(tab); }} onCompose={() => handleCompose()} />
      {isComposeOpen && <div className="fixed inset-0 z-[60] bg-paper animate-slide-up"><button onClick={() => setIsComposeOpen(false)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 z-50 transition-colors"><X size={20} /></button><Journal onAddEntry={handleAddEntry} partnerName={user.partnerName || 'Partner'} onTriggerPremium={handleTriggerPremium} initialPrompt={composePrompt} userName={user.name} partnerHasEntry={partnerHasEntry} /></div>}
      
      {legalModalOpen && <LegalModal type={legalModalOpen} onClose={() => setLegalModalOpen(null)} />}
      
      {artifactModalOpen && <ArtifactModal type={artifactModalOpen} onClose={() => setArtifactModalOpen(null)} entries={entries} currentUserId={user.id} userName={user.name} partnerName={user.partnerName || 'Partner'} />}
      {showPremiumOverlay && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowPremiumOverlay(false)}><div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center relative overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}><div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-belluh-300 via-purple-300 to-indigo-300" /><div className="w-20 h-20 bg-belluh-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-apple animate-float"><Sparkles size={32} className="text-belluh-500" /></div><h2 className="text-3xl font-serif text-slate-900 mb-3 tracking-tight">Belluh Premium</h2><p className="text-slate-500 mb-8 text-sm leading-relaxed font-medium">Unlock deeper intimacy.</p><button onClick={() => setShowPremiumOverlay(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-black transition-transform active:scale-95 shadow-xl shadow-slate-200">Start Free Trial</button><button onClick={() => setShowPremiumOverlay(false)} className="w-full py-3 text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest">Maybe Later</button></div></div>}
    </div>
  );
};

export default App;