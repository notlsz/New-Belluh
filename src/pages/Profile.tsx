
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, LoveNote, Goal, Circle, CircleStatus, JournalEntry, Mood, RelationshipReceipt, ColorTheme } from '../types';
import { Settings, Heart, Plus, X, Trash2, Shield, ChevronRight, Users, Check, Send, Trophy, Activity, Lock, Flame, Download, CheckCircle2, Mail, Archive, Star, FileText, Film, Edit3, Camera, UserPlus, LogOut, Infinity, ArrowRight, Play, Receipt, Share2, Instagram, Facebook, Copy, MessageCircle, Twitter, Camera as CameraIcon, Link as LinkIcon, Upload, Calendar, Clock, Gift, MoreHorizontal, PenLine, Sparkles, Maximize2, Eye, EyeOff, MoveDiagonal, RefreshCw, Palette } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { generateRelationshipReceipt } from '../services/geminiService';
import { THEMES } from '../constants';

interface ProfileProps {
  user: User;
  entries?: JournalEntry[]; 
  streak?: number;
  onLogout?: () => void;
  onCircleChange: (circleId: string) => void;
  onCreateCircle?: (name: string) => void; 
  onArchiveCircle?: (circleId: string) => void;
  onRenameCircle?: (circleId: string, newName: string) => void;
  onTriggerPremium?: () => void;
  onUpdateUser: (updates: Partial<User>) => void;
  onShowLegal: (type: 'tos' | 'privacy') => void;
  onViewArtifact: (type: 'reel' | 'letter') => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  pendingInvites?: { id: string; inviter: { id: string; name: string; avatar: string; } }[];
  onAcceptInvite?: (id: string) => void;
  onDeclineInvite?: (id: string) => void;
}

// Updated Pastel Palette
const RECEIPT_COLORS = [
    { name: 'Classic', hex: '#ffffff', text: 'text-slate-900', border: 'border-slate-200' },
    { name: 'Blush', hex: '#ffe4e6', text: 'text-rose-950', border: 'border-rose-200' }, 
    { name: 'Miami', hex: '#cffafe', text: 'text-cyan-950', border: 'border-cyan-200' }, 
    { name: 'Matcha', hex: '#dcfce7', text: 'text-emerald-950', border: 'border-emerald-200' }, 
    { name: 'Lavender', hex: '#f3e8ff', text: 'text-purple-950', border: 'border-purple-200' }, 
    { name: 'Cream', hex: '#fef3c7', text: 'text-amber-950', border: 'border-amber-200' }, 
];

interface CircleCardProps {
  circle: Circle;
  isActive: boolean;
  onClick: () => void;
  user: User;
  onEdit: (circle: Circle) => void;
}

const CircleCard: React.FC<CircleCardProps> = ({ circle, isActive, onClick, onEdit }) => {
    const dotColor = circle.status === CircleStatus.Archived ? 'bg-yellow-400' : 'bg-[#f0addd]'; 
    return (
        <div onClick={onClick} className={`w-[240px] h-[140px] rounded-[1.8rem] p-6 flex flex-col justify-between cursor-pointer transition-all duration-500 relative overflow-hidden group shrink-0 snap-start ${isActive ? 'bg-white shadow-apple scale-[1.05] z-10 translate-y-[-4px]' : 'bg-white border border-slate-100 opacity-80'}`}>
            <div className="flex justify-between items-start relative z-10">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all ${isActive ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-500'}`}>{circle.name[0]}</div>
                {isActive && <div className={`w-3 h-3 ${dotColor} rounded-full animate-pulse border border-white`}></div>}
            </div>
            <div className="relative z-10">
                <h4 className={`font-bold text-lg leading-tight mb-1 truncate ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{circle.name}</h4>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{(circle.type as any)}</span>
                    {(circle.members.length > 2) && <span className="text-[10px] font-bold bg-slate-100 px-1.5 rounded text-slate-500">+{circle.members.length-1}</span>}
                </div>
            </div>
            {isActive && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(circle); }} 
                    className="absolute top-4 right-4 bg-slate-50 text-slate-400 p-2 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                    <MoreHorizontal size={14} />
                </button>
            )}
        </div>
    );
};

// ... (Helper functions omitted for brevity, logic remains same) ...
const getRelativeDisplay = (date: Date, type: 'past' | 'future' | 'auto') => {
    if (!date || isNaN(date.getTime())) return '--';
    const now = new Date();
    const d1 = new Date(date); d1.setHours(0,0,0,0);
    const d2 = new Date(now); d2.setHours(0,0,0,0);
    const diffTime = d1.getTime() - d2.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (type === 'future' || (type === 'auto' && diffDays > 0)) return `${Math.abs(diffDays)} Days Away`;
    return `${Math.abs(diffDays)} Days Ago`;
};

// --- FactCard & StatCard Components (Unchanged) ---
const FactCard = ({ id, label, date, setDate, isEditing, icon: Icon, theme, config, onToggleHidden, onCycleSize, mode = 'past' }: any) => {
    // ... (same as previous)
    const themes: any = {
        blue: "bg-blue-50 border-blue-100 text-blue-900 hover:shadow-blue-100/50",
        rose: "bg-rose-50 border-rose-100 text-rose-900 hover:shadow-rose-100/50",
        purple: "bg-purple-50 border-purple-100 text-purple-900 hover:shadow-purple-100/50",
        amber: "bg-amber-50 border-amber-100 text-amber-900 hover:shadow-amber-100/50",
        orange: "bg-orange-50 border-orange-100 text-orange-900 hover:shadow-orange-100/50",
        slate: "bg-slate-900 border-slate-800 text-white hover:shadow-slate-200/50"
    };
    const currentTheme = themes[theme] || themes.blue;
    let sizeClasses = "col-span-1 h-48"; 
    if (config.size === 'wide') sizeClasses = "col-span-2 h-48";
    if (config.size === 'tall') sizeClasses = "col-span-1 h-[25rem] row-span-2";
    if (config.size === 'big') sizeClasses = "col-span-2 h-[25rem] row-span-2";
    if (config.hidden && !isEditing) return null;
    return (
        <div className={`relative overflow-hidden rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:shadow-xl border ${currentTheme} ${sizeClasses} group ${config.hidden ? 'opacity-50 grayscale border-dashed' : ''}`}>
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full blur-2xl transition-all group-hover:scale-150"></div>
            <Icon className="absolute -bottom-6 -right-6 w-32 h-32 opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-500 rotate-12" />
            <div className="relative z-10 flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 flex items-center gap-2">{label} {isEditing && <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></div>}</span>
                {isEditing && (
                    <div className="flex gap-1">
                        <button onClick={() => onCycleSize(id)} className="p-1.5 bg-black/10 hover:bg-black/20 rounded-full text-current transition-colors"><MoveDiagonal size={12} /></button>
                        <button onClick={() => onToggleHidden(id)} className="p-1.5 bg-black/10 hover:bg-black/20 rounded-full text-current transition-colors">{config.hidden ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                    </div>
                )}
            </div>
            <div className="relative z-10">
                {isEditing ? (
                    <div className="bg-white/30 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-sm mt-2">
                        <input type="date" value={date instanceof Date && !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : ''} onChange={(e) => { if (e.target.value) { const newDate = new Date(e.target.value); if (!isNaN(newDate.getTime())) setDate(newDate); } }} className="w-full bg-transparent border-none text-lg font-bold outline-none text-inherit p-0 focus:ring-0 cursor-pointer font-serif"/>
                    </div>
                ) : (
                    <>
                        <div className={`${config.size === 'big' || config.size === 'wide' ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'} font-serif font-medium tracking-tight leading-tight mb-1`}>{date instanceof Date ? getRelativeDisplay(date, mode) : '--'}</div>
                        <div className="text-sm font-medium opacity-60">{date instanceof Date ? date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</div>
                    </>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ id, label, value, subtext, icon: Icon, theme, config, onToggleHidden, onCycleSize, isEditing }: any) => {
    // ... (same as previous)
    const themes: any = { slate: "bg-slate-900 text-white shadow-xl shadow-slate-200/50", white: "bg-white text-slate-900 border border-slate-100 shadow-sm" };
    const currentTheme = themes[theme] || themes.white;
    let sizeClasses = "col-span-1 h-48"; 
    if (config.size === 'wide') sizeClasses = "col-span-2 h-48";
    if (config.size === 'tall') sizeClasses = "col-span-1 h-[25rem] row-span-2";
    if (config.size === 'big') sizeClasses = "col-span-2 h-[25rem] row-span-2";
    if (config.hidden && !isEditing) return null;
    return (
        <div className={`relative overflow-hidden rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:shadow-xl ${currentTheme} ${sizeClasses} group ${config.hidden ? 'opacity-50 grayscale border-dashed border-2 border-slate-300' : ''}`}>
             <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full pointer-events-none"></div>
             <Icon className={`absolute -bottom-4 -right-4 w-24 h-24 transition-all duration-500 rotate-12 ${theme === 'slate' ? 'opacity-[0.05] text-white' : 'opacity-[0.05] text-slate-900'}`} />
             <div className="relative z-10 flex justify-between items-start">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'slate' ? 'text-slate-400' : 'text-slate-400'}`}>{label}</span>
                {isEditing && (
                    <div className="flex gap-1">
                        <button onClick={() => onCycleSize(id)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-current transition-colors"><MoveDiagonal size={12} /></button>
                        <button onClick={() => onToggleHidden(id)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-current transition-colors">{config.hidden ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                    </div>
                )}
             </div>
             <div className="relative z-10">
                 <div className={`${config.size === 'big' || config.size === 'wide' ? 'text-5xl md:text-6xl' : 'text-4xl md:text-5xl'} font-serif font-medium tracking-tighter leading-none mb-2`}>{value}</div>
                 <div className={`text-xs font-bold uppercase tracking-wider ${theme === 'slate' ? 'text-slate-400' : 'text-slate-400'}`}>{subtext}</div>
             </div>
        </div>
    );
};

const Profile: React.FC<ProfileProps> = ({ user, entries = [], streak = 0, onLogout, onCircleChange, onCreateCircle, onArchiveCircle, onRenameCircle, onUpdateUser, onShowLegal, onViewArtifact, onShowToast, pendingInvites = [], onAcceptInvite, onDeclineInvite, onTriggerPremium }) => {
  const [activeTab, setActiveTab] = useState<'us' | 'me'>('us');
  const [activeCircleId, setActiveCircleId] = useState(user.activeCircleId);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [isCreatingCircle, setIsCreatingCircle] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'searching' | 'sent' | 'not-found'>('idle');
  const [invitingCircleId, setInvitingCircleId] = useState<string | null>(null);
  
  // Circle Editing State
  const [editingCircle, setEditingCircle] = useState<Circle | null>(null);
  const [editCircleName, setEditCircleName] = useState('');

  // Editable Facts State
  const [facts, setFacts] = useState({ firstMet: new Date(), firstKiss: new Date(), firstDate: new Date(), partnerBday: new Date(), anniversary: new Date() });
  const [factConfigs, setFactConfigs] = useState<Record<string, { size: 'standard' | 'wide' | 'tall' | 'big'; hidden: boolean }>>({
      timeTogether: { size: 'standard', hidden: false }, nextAnniversary: { size: 'standard', hidden: false }, firstMet: { size: 'standard', hidden: false }, firstKiss: { size: 'standard', hidden: false }, firstDate: { size: 'standard', hidden: false }, partnerBday: { size: 'standard', hidden: false }, anniversary: { size: 'standard', hidden: false }, 
  });
  const [isEditingFacts, setIsEditingFacts] = useState(false);

  // Avatar Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Receipt State
  const [receiptData, setReceiptData] = useState<RelationshipReceipt | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [receiptColorIdx, setReceiptColorIdx] = useState(0);

  const activeCircle = user.circles.find(c => c.id === activeCircleId);
  const activeCircles = user.circles.filter(c => c.status === CircleStatus.Active);
  const archivedCircles = user.circles.filter(c => c.status === CircleStatus.Archived);

  const synergyScore = useMemo(() => {
      if (entries.length === 0) return 85; 
      const recentEntries = entries.slice(0, 15);
      let score = 80;
      recentEntries.forEach(e => {
          if (e.mood === Mood.Romantic || e.mood === Mood.Amazing) score += 4;
          if (e.mood === Mood.Good || e.mood === Mood.Grateful || e.mood === Mood.Playful) score += 2;
          if (e.mood === Mood.Stressed || e.mood === Mood.Anxious) score -= 3;
      });
      return Math.min(100, Math.max(0, score));
  }, [entries]);

  const totalMemoriesUs = entries.length;
  const totalMemoriesMe = entries.filter(e => e.userId === user.id).length;
  const pulseStatus = synergyScore >= 80 ? { text: "Deeply Connected", color: "text-[#f0addd]" } : { text: "Steady Growth", color: "text-slate-600" };

  useEffect(() => {
    if (user.relationshipFacts) {
        try {
            const parsed = JSON.parse(user.relationshipFacts);
            setFacts({
                firstMet: parsed.firstMet ? new Date(parsed.firstMet) : new Date(),
                firstKiss: parsed.firstKiss ? new Date(parsed.firstKiss) : new Date(),
                firstDate: parsed.firstDate ? new Date(parsed.firstDate) : new Date(),
                partnerBday: parsed.partnerBday ? new Date(parsed.partnerBday) : new Date(),
                anniversary: parsed.anniversary ? new Date(parsed.anniversary) : new Date(),
            });
            if (parsed.configs) setFactConfigs(prev => ({...prev, ...parsed.configs}));
        } catch (e) { console.error("Failed to parse relationship facts", e); }
    } else if (activeCircle?.startDate) {
        const start = new Date(activeCircle.startDate);
        setFacts(prev => ({ ...prev, firstMet: start, anniversary: start }));
    }
  }, [user.relationshipFacts, activeCircle?.id]);

  const handleCircleSwitch = (id: string) => { setActiveCircleId(id); onCircleChange(id); };
  const handleEditCircleOpen = (circle: Circle) => { setEditingCircle(circle); setEditCircleName(circle.name); };
  const handleTriggerInvite = (circleId: string) => { setInvitingCircleId(circleId); setShowInviteModal(true); setEditingCircle(null); };
  const handleCreateCircle = () => { if (newCircleName.trim() && onCreateCircle) { onCreateCircle(newCircleName); setIsCreatingCircle(false); setNewCircleName(''); } };
  
  const handleRenameSubmit = () => {
      if (editingCircle && editCircleName.trim() && onRenameCircle) {
          onRenameCircle(editingCircle.id, editCircleName);
          setEditingCircle(null);
      }
  };

  const handleArchiveSubmit = () => {
      if (editingCircle && onArchiveCircle) {
          onArchiveCircle(editingCircle.id);
          setEditingCircle(null);
      }
  };

  const handleSaveProfile = () => { onUpdateUser({ name: editName, avatar: editAvatar }); setIsEditingProfile(false); };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;
          const { error } = await supabase.storage.from('journal-media').upload(fileName, file, { upsert: true });
          if (error) throw error;
          const { data } = supabase.storage.from('journal-media').getPublicUrl(fileName);
          const publicUrl = data.publicUrl + '?t=' + Date.now();
          setEditAvatar(publicUrl);
          onShowToast("Photo uploaded successfully", "success");
      } catch (error) { console.error("Upload failed:", error); onShowToast("Failed to upload photo", "error"); } finally { setIsUploading(false); }
  };

  const handleGenerateReceipt = async () => {
      setGeneratingReceipt(true); setShowReceipt(true);
      if (!receiptData) {
          const data = await generateRelationshipReceipt(entries, `${user.name} & ${user.partnerName || 'Partner'}`);
          setReceiptData(data);
      }
      setGeneratingReceipt(false);
  };

  const handleShare = async (platform?: 'whatsapp' | 'twitter' | 'copy') => {
      if (!receiptData) return;
      const shareText = `🧾 RELATIONSHIP RECEIPT\n\n${receiptData.merchantName}\nDate: ${receiptData.date}\nTotal: ${receiptData.total}\n\n"${receiptData.footerQuote}"\n\nGenerated by Belluh AI`;
      if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
      else if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
      else if (platform === 'copy') { await navigator.clipboard.writeText(shareText); onShowToast("Receipt copied to clipboard!", "success"); }
      else if (navigator.share) await navigator.share({ title: 'Relationship Receipt', text: shareText, url: window.location.href });
      else handleShare('copy');
  };

  const handleCopyInviteLink = async () => {
      const inviteUrl = `${window.location.origin}?invite=${user.id}`;
      try { await navigator.clipboard.writeText(inviteUrl); onShowToast("Invite link copied!", "success"); } catch (err) { onShowToast("Failed to copy link.", "error"); }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail.trim() || !invitingCircleId) return;
      
      setInviteStatus('searching');
      try {
          const { data: profiles } = await supabase.from('profiles').select('id').ilike('email', inviteEmail.trim());
          if (!profiles || profiles.length === 0) { setInviteStatus('not-found'); return; }
          const partnerId = profiles[0].id;
          if (partnerId === user.id) { onShowToast("You cannot invite yourself!", "error"); setInviteStatus('idle'); return; }

          const { error } = await supabase.from('partner_connections').insert({ user_id: user.id, partner_id: partnerId, status: 'pending' });
          if (error && error.code !== '23505') { console.error(error); onShowToast('Failed to send invite: ' + error.message, 'error'); setInviteStatus('idle'); return; }
          
          // --- MULTI-PARTNER LOGIC ---
          // If inviting to a specific circle, also create a system_circle_member entry to link them to this specific group context
          if (invitingCircleId) {
              await supabase.from('journal_entries').insert({
                  user_id: user.id,
                  type: 'Milestone',
                  tags: ['system_circle_member', `circle:${invitingCircleId}`, `member:${partnerId}`],
                  content: 'Added new member',
                  is_shared: true,
                  date: new Date().toISOString()
              });
          }

          setInviteStatus('sent');
          onShowToast('Invite sent!', 'success');
          setTimeout(() => { setShowInviteModal(false); setInviteStatus('idle'); setInviteEmail(''); }, 2000);
          
      } catch (err) { console.error(err); setInviteStatus('idle'); }
  };

  const saveFacts = async () => {
    setIsEditingFacts(false);
    const payload = { firstMet: facts.firstMet.toISOString(), firstKiss: facts.firstKiss.toISOString(), firstDate: facts.firstDate.toISOString(), partnerBday: facts.partnerBday.toISOString(), anniversary: facts.anniversary.toISOString(), configs: factConfigs };
    const factsText = JSON.stringify(payload);
    try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;
        const { data: existingFacts } = await supabase.from('journal_entries').select('id').eq('user_id', currentUser.id).contains('tags', ['system_facts']).maybeSingle();
        if (existingFacts) await supabase.from('journal_entries').update({ content: factsText }).eq('id', existingFacts.id);
        else await supabase.from('journal_entries').insert({ user_id: currentUser.id, content: factsText, type: 'Milestone', tags: ['system_facts', `circle:${activeCircleId}`], is_shared: true, date: new Date().toISOString() });
        onUpdateUser({ relationshipFacts: factsText });
        onShowToast("Relationship facts saved", "success");
    } catch (e) { console.error("Error saving facts:", e); onShowToast("Failed to save facts", "error"); }
  };

  const cycleSize = (id: string) => { setFactConfigs(prev => { const sizes: ('standard' | 'wide' | 'tall' | 'big')[] = ['standard', 'wide', 'tall', 'big']; const current = prev[id]?.size || 'standard'; const next = sizes[(sizes.indexOf(current) + 1) % sizes.length]; return { ...prev, [id]: { ...prev[id], size: next } }; }); };
  const toggleHidden = (id: string) => { setFactConfigs(prev => ({ ...prev, [id]: { ...prev[id], hidden: !prev[id].hidden } })); };
  const currentColor = RECEIPT_COLORS[receiptColorIdx];

  // Dynamic Members for "Us" Display
  const activeMembers = useMemo(() => {
      if (!activeCircle || !activeCircle.memberProfiles || activeCircle.memberProfiles.length === 0) {
          return [
              { id: user.id, name: user.name, avatar: user.avatar },
              { id: 'p1', name: user.partnerName || 'Partner', avatar: user.partnerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.partnerName}` }
          ];
      }
      return activeCircle.memberProfiles;
  }, [activeCircle, user]);

  return (
    <div className="pb-32 pt-10 px-0 max-w-4xl mx-auto min-h-screen bg-paper">
      <div className="px-6 flex justify-end mb-8">
          <button onClick={() => setShowSettingsModal(true)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-soft border border-slate-50"><Settings size={20} /></button>
      </div>
      
      {/* ... rest of the component (omitted for brevity, assume unchanged logic) ... */}
      <div className="px-6 mb-10 flex justify-center">
          <div className="bg-white border border-slate-100 p-1 rounded-full flex w-[180px] shadow-sm">
              <button onClick={() => setActiveTab('us')} className={`flex-1 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'us' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Us</button>
              <button onClick={() => setActiveTab('me')} className={`flex-1 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'me' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Me</button>
          </div>
      </div>

      {pendingInvites && pendingInvites.length > 0 && (
          <div className="px-6 mb-8 animate-slide-up">
              <div className="bg-belluh-50 border border-belluh-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                      <Mail size={16} className="text-belluh-600" />
                      <h3 className="text-xs font-bold text-belluh-800 uppercase tracking-widest">Pending Invite</h3>
                  </div>
                  {pendingInvites.map(invite => (
                      <div key={invite.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <img src={invite.inviter.avatar} alt="Inviter" className="w-10 h-10 rounded-full bg-slate-100 object-cover" />
                              <div>
                                  <p className="text-sm font-bold text-slate-900">Connect with {invite.inviter.name}</p>
                                  <p className="text-xs text-slate-500">{invite.inviter.name} wants to link journals</p>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => onDeclineInvite && onDeclineInvite(invite.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"><X size={18} /></button>
                              <button onClick={() => onAcceptInvite && onAcceptInvite(invite.id)} className="p-2 bg-slate-900 text-white hover:bg-green-600 rounded-full transition-colors shadow-md"><Check size={18} /></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'us' ? (
          <div className="animate-fade-in space-y-12">
              
              {activeCircle?.status === CircleStatus.Archived ? (
                  <div className="px-6">
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
                          <Archive size={20} className="text-amber-500" />
                          <p className="text-sm text-amber-900">You are viewing an archived relationship. This space is read-only.</p>
                      </div>
                  </div>
              ) : activeCircleId === 'constellation' ? (
                  <div className="px-6">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
                          <Star size={20} className="text-belluh-300 fill-belluh-300" />
                          <div>
                            <h3 className="text-sm font-bold text-white">The Constellation</h3>
                            <p className="text-xs text-slate-400">Viewing your entire universe of moments across all chapters.</p>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="px-6">
                      {/* DYNAMIC AVATAR STACK FOR MULTI-PARTNER SUPPORT */}
                      <div className="flex flex-col items-center justify-center pt-4">
                          <div className="relative flex items-center justify-center">
                              {activeMembers.map((member, index) => (
                                  <React.Fragment key={member.id}>
                                      <div className={`w-28 h-28 rounded-full border-[5px] border-white shadow-apple overflow-hidden bg-white z-[${10-index}] ${index > 0 ? '-ml-6' : ''}`}>
                                          <img src={member.avatar} className="w-full h-full object-cover" alt={member.name} />
                                      </div>
                                      {/* Only show infinity if exactly 2 people, between them */}
                                      {activeMembers.length === 2 && index === 0 && (
                                          <div className="w-12 h-12 bg-white rounded-full shadow-lg border border-slate-50 text-[#f0addd] flex items-center justify-center z-20 absolute left-1/2 -translate-x-1/2">
                                              <Infinity size={22} strokeWidth={2.5} />
                                          </div>
                                      )}
                                  </React.Fragment>
                              ))}
                          </div>
                          <h2 className="text-4xl font-serif text-slate-900 mt-8 tracking-tight text-center px-4">
                              {activeMembers.map(m => m.name.split(' ')[0]).join(' & ')}
                          </h2>
                          <div className="mt-8 flex flex-wrap justify-center gap-3">
                                <div className="px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 flex items-center gap-2"><Flame size={14} className="text-orange-500 fill-orange-500" /><span className="text-xs font-bold">{streak} Day Streak</span></div>
                                <div className="px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 flex items-center gap-2"><Activity size={14} className="text-[#f0addd]" /><span className="text-xs font-bold">{synergyScore}% Synergy</span></div>
                                <div className="px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 flex items-center gap-2"><Trophy size={14} className="text-yellow-500" /><span className="text-xs font-bold">{totalMemoriesUs} Memories</span></div>
                          </div>
                      </div>
                      
                      <div className="text-center mt-12 mb-12">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Current Resonance</p>
                          <h3 className={`text-3xl font-serif ${pulseStatus.color}`}>{pulseStatus.text}</h3>
                      </div>

                      {/* Relationship Facts Grid */}
                      {activeCircle && (
                          <div className="mb-12 relative group/facts">
                              <div className="flex items-center justify-between mb-6">
                                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Relationship Facts</h3>
                                  <button onClick={() => isEditingFacts ? saveFacts() : setIsEditingFacts(true)} className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all flex items-center gap-2 ${isEditingFacts ? 'bg-slate-900 text-white shadow-lg scale-105' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
                                      {isEditingFacts ? <><Check size={14} /> Done</> : <><Edit3 size={14} /> Customize</>}
                                  </button>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-auto">
                                  <StatCard id="timeTogether" label="Time Together" value={!isNaN(facts.firstMet.getTime()) ? `${Math.floor((new Date().getTime() - facts.firstMet.getTime()) / (1000 * 60 * 60 * 24))}d` : '--'} subtext="And counting" icon={Clock} theme="slate" config={factConfigs.timeTogether} onToggleHidden={toggleHidden} onCycleSize={cycleSize} isEditing={isEditingFacts} />
                                  <StatCard id="nextAnniversary" label="Next Anniversary" value={(() => { if (isNaN(facts.anniversary.getTime())) return '--'; const now = new Date(); const next = new Date(facts.anniversary); next.setFullYear(now.getFullYear()); if (next < now) next.setFullYear(now.getFullYear() + 1); return `${Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))}`; })()} subtext="Days Away" icon={Infinity} theme="white" config={factConfigs.nextAnniversary} onToggleHidden={toggleHidden} onCycleSize={cycleSize} isEditing={isEditingFacts} />
                                  <FactCard id="firstMet" label="First Met" date={facts.firstMet} setDate={(d: Date) => setFacts({...facts, firstMet: d})} isEditing={isEditingFacts} icon={Users} theme="blue" config={factConfigs.firstMet} onToggleHidden={toggleHidden} onCycleSize={cycleSize} mode="past" />
                                  <FactCard id="firstKiss" label="First Kiss" date={facts.firstKiss} setDate={(d: Date) => setFacts({...facts, firstKiss: d})} isEditing={isEditingFacts} icon={Heart} theme="rose" config={factConfigs.firstKiss} onToggleHidden={toggleHidden} onCycleSize={cycleSize} mode="past" />
                                  <FactCard id="firstDate" label="First Date" date={facts.firstDate} setDate={(d: Date) => setFacts({...facts, firstDate: d})} isEditing={isEditingFacts} icon={Calendar} theme="purple" config={factConfigs.firstDate} onToggleHidden={toggleHidden} onCycleSize={cycleSize} mode="past" />
                                  <FactCard id="anniversary" label="Anniversary" date={facts.anniversary} setDate={(d: Date) => setFacts({...facts, anniversary: d})} isEditing={isEditingFacts} icon={Sparkles} theme="amber" config={factConfigs.anniversary} onToggleHidden={toggleHidden} onCycleSize={cycleSize} mode="future" />
                                  <FactCard id="partnerBday" label="Partner B-Day" date={facts.partnerBday} setDate={(d: Date) => setFacts({...facts, partnerBday: d})} isEditing={isEditingFacts} icon={Gift} theme="orange" config={factConfigs.partnerBday} onToggleHidden={toggleHidden} onCycleSize={cycleSize} mode="future" />
                              </div>
                              {isEditingFacts && Object.values(factConfigs).some((c: any) => c.hidden) && (
                                  <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Hidden Items</p>
                                      <div className="flex gap-2 flex-wrap">
                                          {Object.entries(factConfigs).filter(([_, c]: [string, any]) => c.hidden).map(([key, _]) => (
                                              <button key={key} onClick={() => toggleHidden(key)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2"><Eye size={12} /> Restore {key}</button>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                      
                      {/* Artifact Grid */}
                      <div className="grid grid-cols-2 gap-4">
                          <div onClick={() => onViewArtifact('letter')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col aspect-square justify-between cursor-pointer hover:shadow-md transition-shadow">
                              <Mail size={24} className="text-[#f0addd]" />
                              <div>
                                  <h4 className="font-serif text-lg text-slate-900 font-bold">Future Letter</h4>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Unlock 2030</p>
                              </div>
                          </div>
                          <div onClick={() => onViewArtifact('reel')} className="bg-slate-900 p-6 rounded-[2rem] shadow-lg flex flex-col aspect-square justify-between cursor-pointer hover:scale-[1.02] transition-transform">
                              <Film size={24} className="text-white" />
                              <div>
                                  <h4 className="font-serif text-lg text-white font-bold">Chapter Reel</h4>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Highlights</p>
                              </div>
                          </div>
                          <div onClick={handleGenerateReceipt} className="col-span-2 bg-[#f0addd] p-6 rounded-[2rem] shadow-lg flex items-center justify-between cursor-pointer hover:bg-[#e57ec3] transition-colors relative overflow-hidden group">
                               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
                               <div className="relative z-10 flex items-center gap-4">
                                   <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                                       <Receipt size={24} />
                                   </div>
                                   <div className="text-white">
                                       <h4 className="font-serif text-xl font-bold">Print Receipt</h4>
                                       <p className="text-xs font-medium opacity-80">Generate your relationship invoice</p>
                                   </div>
                               </div>
                               <ArrowRight className="text-white" size={20} />
                          </div>
                      </div>
                  </div>
              )}
          </div>
      ) : (
          <div className="px-6 animate-fade-in pb-20">
              <div className="flex flex-col items-center mb-12">
                  <div className="w-32 h-32 rounded-full border-[6px] border-white shadow-2xl overflow-hidden mb-6"><img src={user.avatar} className="w-full h-full object-cover" /></div>
                  <h2 className="text-3xl font-serif text-slate-900 tracking-tight">{user.name}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{totalMemoriesMe} Memories Created</p>
                  <button onClick={() => setIsEditingProfile(true)} className="mt-4 text-xs font-bold text-belluh-400 uppercase tracking-widest hover:text-belluh-600 transition-colors bg-belluh-50 px-4 py-2 rounded-full">Edit Profile</button>
              </div>

              {/* Circles */}
              <div className="mb-12">
                   <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                             <Users size={16} className="text-slate-900" />
                             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Circles</h3>
                        </div>
                   </div>

                   <div className="flex gap-4 overflow-x-auto pb-6 pt-8 -mx-6 px-6 no-scrollbar snap-x items-center">
                       <div 
                           onClick={() => setIsCreatingCircle(!isCreatingCircle)}
                           className="w-[240px] h-[140px] shrink-0 rounded-[1.8rem] bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-slate-500 hover:bg-slate-50 transition-all duration-300 group snap-start shadow-sm hover:shadow-md"
                       >
                           <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 transition-colors mb-3">
                               <Plus size={24} />
                           </div>
                           <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800">New Circle</span>
                       </div>

                       {isCreatingCircle && (
                            <div className="w-[240px] h-[140px] shrink-0 bg-white p-4 rounded-[1.8rem] shadow-xl border border-slate-100 flex flex-col justify-between animate-scale-in snap-start">
                                <input type="text" value={newCircleName} onChange={(e) => setNewCircleName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateCircle()} placeholder="Circle Name..." className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold mb-2" autoFocus />
                                <div className="flex gap-2">
                                    <button onClick={() => setIsCreatingCircle(false)} className="flex-1 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                                    <button onClick={handleCreateCircle} disabled={!newCircleName.trim()} className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-black disabled:opacity-50">Create</button>
                                </div>
                            </div>
                       )}

                       {activeCircles.map(circle => (
                           <CircleCard key={circle.id} circle={circle} isActive={activeCircleId === circle.id} onClick={() => handleCircleSwitch(circle.id)} user={user} onEdit={handleEditCircleOpen} />
                       ))}
                   </div>
                   
                   {archivedCircles.length > 0 && (
                       <div className="mt-8">
                           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Past Chapters</h3>
                           <div className="flex gap-4 overflow-x-auto pb-6 pt-8 -mx-6 px-6 no-scrollbar snap-x items-center">
                                {archivedCircles.map(circle => (
                                    <div key={circle.id} className="opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                                        <CircleCard circle={circle} isActive={activeCircleId === circle.id} onClick={() => handleCircleSwitch(circle.id)} user={user} onEdit={handleEditCircleOpen} />
                                    </div>
                                ))}
                           </div>
                       </div>
                   )}

                   <div className="mt-8">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pl-1">Your Story</h3>
                      <button onClick={() => handleCircleSwitch('constellation')} className={`w-full relative overflow-hidden rounded-[1.8rem] p-6 text-left group transition-all duration-300 ${activeCircleId === 'constellation' ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'bg-slate-900 text-white shadow-md hover:shadow-xl hover:scale-[1.01]'}`}>
                           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] group-hover:bg-white/10 transition-colors pointer-events-none"></div>
                           <div className="absolute bottom-0 left-0 w-40 h-40 bg-belluh-500/30 rounded-full blur-[60px] pointer-events-none"></div>
                           <div className="relative z-10 flex items-center justify-between">
                               <div>
                                   <div className="flex items-center gap-2 mb-2">
                                       <Star size={16} className={activeCircleId === 'constellation' ? "text-belluh-300 fill-belluh-300" : "text-belluh-300"} />
                                       <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">The Constellation</span>
                                   </div>
                                   <h4 className="text-xl font-serif">All Your Stars Aligned</h4>
                                   <p className="text-xs text-slate-400 mt-1 max-w-xs">A combined timeline of every relationship, every moment, and every lesson learned.</p>
                               </div>
                               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors"><ChevronRight size={20} /></div>
                           </div>
                      </button>
                   </div>
              </div>
          </div>
      )}

      {/* Edit Circle Modal */}
      {editingCircle && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setEditingCircle(null)}>
              <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-serif text-xl text-slate-900">Manage Circle</h3>
                      <button onClick={() => setEditingCircle(null)}><X size={20} className="text-slate-400"/></button>
                  </div>
                  <div className="space-y-6">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Name</label>
                          <div className="flex gap-2">
                              <input type="text" value={editCircleName} onChange={(e) => setEditCircleName(e.target.value)} className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-belluh-200" />
                              <button onClick={handleRenameSubmit} disabled={!editCircleName.trim() || editCircleName === editingCircle.name} className="bg-slate-900 text-white p-3 rounded-xl disabled:opacity-50 hover:bg-black transition-colors"><Check size={18} /></button>
                          </div>
                      </div>
                      <div className="space-y-3">
                          {editingCircle.status === CircleStatus.Active && (
                              <button onClick={() => handleTriggerInvite(editingCircle.id)} className="w-full bg-belluh-50 text-belluh-600 border border-belluh-200 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-belluh-100 transition-all text-sm">
                                  <UserPlus size={16} /> <span>Invite Partner</span>
                              </button>
                          )}
                          <button onClick={handleArchiveSubmit} className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm border ${editingCircle.status === CircleStatus.Archived ? 'bg-slate-900 text-white hover:bg-black border-transparent' : 'bg-white text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-50'}`}>
                              {editingCircle.status === CircleStatus.Archived ? <RefreshCw size={16} /> : <Archive size={16} />}
                              <span>{editingCircle.status === CircleStatus.Archived ? 'Restore Circle' : 'Archive Circle'}</span>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Settings Dialog Overlay */}
      {showSettingsModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowSettingsModal(false)}>
              <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                  <h3 className="font-serif text-2xl mb-8 text-slate-900">Settings</h3>
                  
                  {/* Theme Selector */}
                  <div className="mb-8">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Palette size={14} /> Color Theme
                      </p>
                      <div className="flex gap-2 flex-wrap">
                          {Object.keys(THEMES).map((themeKey) => (
                              <button
                                key={themeKey}
                                onClick={() => onUpdateUser({ settings: { ...user.settings, colorTheme: themeKey as ColorTheme } })}
                                className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${user.settings.colorTheme === themeKey ? 'border-slate-900 shadow-lg scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: THEMES[themeKey as ColorTheme][300] }}
                                title={themeKey.charAt(0).toUpperCase() + themeKey.slice(1)}
                              />
                          ))}
                      </div>
                  </div>

                  <div className="space-y-1">
                    <button onClick={() => onShowLegal('tos')} className="w-full py-3 flex items-center justify-between text-slate-500 hover:bg-slate-50 rounded-xl px-2"><span className="text-sm font-bold">Terms of Service</span><ChevronRight size={16} /></button>
                    <button onClick={() => onShowLegal('privacy')} className="w-full py-3 flex items-center justify-between text-slate-500 hover:bg-slate-50 rounded-xl px-2"><span className="text-sm font-bold">Privacy Policy</span><ChevronRight size={16} /></button>
                    <button onClick={onLogout} className="w-full py-3 flex items-center justify-between text-slate-500 hover:bg-slate-50 rounded-xl px-2"><span className="text-sm font-bold">Log Out</span><LogOut size={16} /></button>
                  </div>
                  <button onClick={() => setShowSettingsModal(false)} className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-bold">Done</button>
              </div>
          </div>
      )}

      {/* ... Other Modals (Receipt, Invite, EditProfile) kept as is ... */}
      {/* Receipt Modal */}
      {showReceipt && (
           <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowReceipt(false)}>
               {generatingReceipt || !receiptData ? (
                   <div className="flex flex-col items-center gap-6 text-white animate-pulse">
                       <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md"><Receipt size={40} className="text-white/80" /></div>
                       <p className="font-bold tracking-[0.2em] uppercase text-xs text-white/60">Calculations in progress...</p>
                   </div>
               ) : (
                   <div className="flex flex-col items-center gap-6 animate-slide-up w-full max-w-[360px]" onClick={e => e.stopPropagation()}>
                       <div className="w-full max-h-[65vh] overflow-y-auto no-scrollbar overflow-x-visible px-2 pb-4 pt-2">
                           <div className="w-[340px] relative shadow-2xl transition-all duration-500 mx-auto" style={{ filter: 'drop-shadow(0px 20px 30px rgba(0,0,0,0.3))' }}>
                                <div className={`relative w-full p-8 pb-12 transition-colors duration-500 ${currentColor.text}`} style={{ backgroundColor: currentColor.hex }}>
                                    <div className="absolute top-0 left-0 w-full h-3 -mt-3" style={{ background: `radial-gradient(circle at 10px 10px, ${currentColor.hex} 10px, transparent 10.5px)`, backgroundSize: '20px 20px', backgroundPosition: 'top center', transform: 'rotate(180deg)' }}></div>
                                    <div className="flex flex-col items-center mb-8 relative z-10">
                                         <div className="w-12 h-12 border-2 border-current rounded-full flex items-center justify-center mb-4 opacity-80"><Infinity size={24} /></div>
                                         <h2 className="font-mono text-xl font-bold uppercase tracking-widest text-center leading-tight mb-2">{receiptData.merchantName}</h2>
                                         <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">{receiptData.date} • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                    <div className="border-b border-dashed border-current opacity-30 mb-6"></div>
                                    <div className="space-y-4 font-mono text-xs mb-8">
                                        {receiptData.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start gap-4">
                                                <div className="flex gap-2"><span className="opacity-50">{item.qty}</span><span className="uppercase font-bold tracking-tight">{item.desc}</span></div>
                                                <span className="font-bold whitespace-nowrap">{item.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-b border-dashed border-current opacity-30 mb-6"></div>
                                    <div className="space-y-2 font-mono text-xs mb-8">
                                        <div className="flex justify-between"><span className="opacity-60 uppercase">Subtotal</span><span>{receiptData.subtotal}</span></div>
                                        <div className="flex justify-between"><span className="opacity-60 uppercase">Emotional Tax</span><span>{receiptData.tax}</span></div>
                                        <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t border-dashed border-current border-opacity-30"><span>TOTAL</span><span>{receiptData.total}</span></div>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-mono text-[10px] uppercase opacity-60 mb-6 max-w-[200px] mx-auto leading-relaxed">"{receiptData.footerQuote}"</p>
                                        <div className="h-10 w-4/5 mx-auto opacity-80 mix-blend-multiply" style={{ background: `repeating-linear-gradient(90deg, currentColor 0px, currentColor 2px, transparent 2px, transparent 4px, currentColor 4px, currentColor 5px, transparent 5px, transparent 8px, currentColor 8px, currentColor 11px, transparent 11px, transparent 12px)` }}></div>
                                        <p className="font-mono text-[8px] uppercase tracking-[0.3em] mt-2 opacity-40">Thank You For Shopping</p>
                                    </div>
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
                                    <div className="absolute bottom-0 left-0 w-full h-3 -mb-3" style={{ background: `radial-gradient(circle at 10px 0, ${currentColor.hex} 10px, transparent 10.5px)`, backgroundSize: '20px 10px', backgroundRepeat: 'repeat-x' }}></div>
                                </div>
                           </div>
                       </div>
                       <div className="flex flex-col items-center gap-6 w-full animate-fade-in shrink-0" style={{ animationDelay: '0.2s' }}>
                           <div className="flex gap-3 bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 overflow-x-auto max-w-full">
                               {RECEIPT_COLORS.map((color, idx) => (
                                   <button key={idx} onClick={() => setReceiptColorIdx(idx)} className={`w-8 h-8 rounded-full border-2 shrink-0 transition-all ${receiptColorIdx === idx ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'}`} style={{ backgroundColor: color.hex }} title={color.name} />
                               ))}
                           </div>
                           <div className="flex gap-4">
                               <button onClick={() => handleShare()} className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-full font-bold text-sm shadow-xl hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"><Share2 size={16} /><span>Share</span></button>
                               <div className="flex gap-2">
                                   <button onClick={() => handleShare('copy')} className="w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-all backdrop-blur-md border border-white/10"><CameraIcon size={20} /></button>
                                   <button onClick={() => handleShare('twitter')} className="w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-all backdrop-blur-md border border-white/10"><Twitter size={20} /></button>
                                   <button onClick={() => handleShare('whatsapp')} className="w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-all backdrop-blur-md border border-white/10"><MessageCircle size={20} /></button>
                               </div>
                           </div>
                       </div>
                   </div>
               )}
           </div>
      )}

      {/* Partner Invite Modal Dialog */}
      {showInviteModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowInviteModal(false)}>
              <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif text-2xl text-slate-900">Invite Partner</h3>
                    <button onClick={() => setShowInviteModal(false)}><X size={20} className="text-slate-400"/></button>
                  </div>
                  <p className="text-slate-500 text-sm mb-6">Share a link or invite via email to connect your journals.</p>
                  
                  {inviteStatus === 'sent' ? (
                      <div className="text-center py-6 animate-pop">
                          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32}/></div>
                          <p className="font-bold text-slate-900">Invite Sent!</p>
                      </div>
                  ) : (
                      <div className="space-y-6">
                          <button onClick={handleCopyInviteLink} className="w-full bg-belluh-50 text-belluh-600 border border-belluh-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-belluh-100 transition-all"><LinkIcon size={16} /><span>Copy Invite Link</span></button>
                          <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div><div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-slate-400 font-medium">OR VIA EMAIL</span></div></div>
                          <form onSubmit={handleInviteSubmit} className="space-y-4">
                              <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="partner@email.com" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-belluh-200" />
                              {inviteStatus === 'not-found' && <p className="text-rose-500 text-xs font-bold px-1">User not found. Send them the link instead!</p>}
                              <button type="submit" disabled={inviteStatus === 'searching'} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2">
                                  {inviteStatus === 'searching' ? <Loader2 size={18} className="animate-spin" /> : <><span>Send Invite</span> <Send size={16} /></>}
                              </button>
                          </form>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Profile Modification Modal */}
      {isEditingProfile && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setIsEditingProfile(false)}>
              <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
                  <h3 className="font-serif text-2xl mb-8 text-slate-900">Edit Profile</h3>
                  <div className="space-y-6">
                      <div className="flex flex-col items-center">
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                              <img src={editAvatar} className={`w-24 h-24 rounded-full border-4 border-slate-50 shadow-sm object-cover transition-opacity ${isUploading ? 'opacity-50' : ''}`} alt="Profile" />
                              <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload size={20} className="text-white" /></div>
                              {isUploading && <div className="absolute inset-0 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-slate-900" /></div>}
                          </div>
                          <div className="flex items-center gap-4 mt-4">
                              <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-full">Upload Photo</button>
                              <button onClick={() => setEditAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`)} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-full">Shuffle Art</button>
                          </div>
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-900 ml-1">Name</label>
                          <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-belluh-200" />
                      </div>
                  </div>
                  <button onClick={handleSaveProfile} className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-bold">Save Changes</button>
              </div>
          </div>
      )}
    </div>
  );
};

// Inline helper components
const Loader2 = ({ size, className }: { size: number, className?: string }) => (<div className={`animate-spin ${className}`} style={{ width: size, height: size }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg></div>);

export default Profile;
