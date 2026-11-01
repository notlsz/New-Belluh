
import { useI18n, useUi } from '../i18n';
import profile from '../i18n/ui/profile';
import { calmAvatar, avatarFor } from '../lib/avatar';
import { Emoji } from '../lib/emoji3d';
import bentoUi from '../i18n/ui/bento';
// The couple's own tiles: favorites, dislikes, their song, anything
type CustomTile = { id: string; title: string; value: string; emoji: string; size: TileSize; w?: number; h?: number };
type TileSize = 'S' | 'M' | 'L';
const CUSTOM_EMOJI = ['🌷', '🍣', '🎵', '🙅', '☕', '🐶', '🎬', '✨', '🍕', '💐', '🎁', '📚'];
const TILE_COLORS = [{ bg: 'bg-[#fde7f3]', ink: 'text-[#8f2a66]' }, { bg: 'bg-[#e1f1f7]', ink: 'text-[#2f6b80]' }, { bg: 'bg-[#fff1d6]', ink: 'text-[#8a5300]' }, { bg: 'bg-[#ede7fb]', ink: 'text-[#5b3fa0]' }, { bg: 'bg-[#e3f5dc]', ink: 'text-[#3d6b2c]' }, { bg: 'bg-[#ffe4d6]', ink: 'text-[#8f3f1c]' }];
import DragBento, { type BentoItem } from '../components/DragBento';
import ProfileStudio from '../components/ProfileStudio';
const OurWorld = React.lazy(() => import('../components/OurWorld'));
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, LoveNote, Goal, Circle, CircleStatus, JournalEntry, Mood, RelationshipReceipt, ColorTheme } from '../types';
import { Settings, Heart, Plus, X, Trash2, Shield, ChevronRight, Users, Check, Send, Trophy, Activity, Lock, Flame, Download, CheckCircle2, Mail, Archive, Star, FileText, Film, Edit3, Camera, UserPlus, LogOut, Infinity, ArrowRight, Play, Receipt, Share2, Instagram, Facebook, Copy, MessageCircle, Twitter, Camera as CameraIcon, Link as LinkIcon, Upload, Calendar, Clock, Gift, MoreHorizontal, PenLine, Sparkles, Maximize2, Eye, EyeOff, MoveDiagonal, RefreshCw, Palette } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { generateRelationshipReceipt } from '../services/geminiService';
import { THEMES } from '../constants';
import WhatsAppDates from '../components/WhatsAppDates';
import CalendarSync from '../components/CalendarSync';
import YourData from '../components/YourData';
import NotificationsToggle from '../components/NotificationsToggle';
import { parseFactDate, ymdString } from '../../supabase/functions/_shared/facts';

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
                    <span className="text-[12px] font-semibold text-slate-400">{(circle.type as any)}</span>
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

const NO_DATE = () => new Date(NaN);
const FROM_PROFILE = 'From your About us dates';
const isSet = (d?: Date) => d instanceof Date && !isNaN(d.getTime());
const toInput = (d: Date) => isSet(d) ? ymdString({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }) : '';
const fromInput = (v: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : NO_DATE(); };
const fromStored = (v: unknown) => { const x = parseFactDate(v); return x ? new Date(x.y, x.m - 1, x.d) : NO_DATE(); };
/** Next time a yearly date comes round (for birthdays and anniversaries). */
const nextYearly = (d: Date) => { const now = new Date(); now.setHours(0,0,0,0); const n = new Date(now.getFullYear(), d.getMonth(), d.getDate()); if (n < now) n.setFullYear(now.getFullYear() + 1); return n; };
const getRelativeDisplay = (date: Date, type: 'past' | 'future' | 'auto') => {
    if (!isSet(date)) return '--';
    if (type === 'future') date = nextYearly(date);
    const now = new Date();
    const d1 = new Date(date); d1.setHours(0,0,0,0);
    const d2 = new Date(now); d2.setHours(0,0,0,0);
    const diffTime = d1.getTime() - d2.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0 && type !== 'future') {
        const ago = -diffDays;
        if (ago >= 365) { const y = Math.floor(ago / 365.25); return `${y} ${y === 1 ? 'year' : 'years'} ago`; }
        if (ago >= 60) return `${Math.floor(ago / 30.44)} months ago`;
    }
    if (type === 'future' || (type === 'auto' && diffDays > 0)) return `${Math.abs(diffDays)} Days Away`;
    return `${Math.abs(diffDays)} Days Ago`;
};

// --- FactCard & StatCard Components (Unchanged) ---
const FactCard = ({ id, label, date, setDate, isEditing, icon: Icon, theme, config, onToggleHidden, onCycleSize, mode = 'past', onAdd }: any) => {
    // ... (same as previous)
    const themes: any = {
        blue: "bg-[#eef7fa] border-[#CDE9F2] text-[#2f6578] hover:shadow-[#CDE9F2]/60",
        rose: "bg-[#fdf0f8] border-[#f7d8ee] text-[#9d3f78] hover:shadow-[#f7d8ee]/60",
        purple: "bg-white border-[#CDE9F2] text-[#2f6578] hover:shadow-[#CDE9F2]/60",
        amber: "bg-[#fdf0f8] border-[#f7d8ee] text-[#9d3f78] hover:shadow-[#f7d8ee]/60",
        orange: "bg-[#eef7fa] border-[#CDE9F2] text-[#2f6578] hover:shadow-[#CDE9F2]/60",
        slate: "bg-gradient-to-br from-[#3f7486] to-[#9bbecb] border-transparent text-white hover:shadow-[#9bbecb]/50"
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
                <span className="text-[12px] font-semibold opacity-70 flex items-center gap-2">{label} {isEditing && <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></div>}</span>
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
                        <input type="date" aria-label={label} value={toInput(date)} onChange={(e) => setDate(fromInput(e.target.value))} className="w-full bg-transparent border-none text-lg font-bold outline-none text-inherit p-0 focus:ring-0 cursor-pointer font-serif"/>
                    </div>
                ) : (
                    !isSet(date) ? (
                        <button type="button" onClick={onAdd} className="text-lg font-serif font-medium opacity-60 hover:opacity-100 underline-offset-4 hover:underline">Add date</button>
                    ) : (
                    <>
                        {/* Past dates lead with the day itself; upcoming ones lead with the countdown */}
                        <div className={`${config.size === 'big' || config.size === 'wide' ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'} font-serif font-medium tracking-tight leading-tight mb-1`}>{mode === 'past' ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : getRelativeDisplay(date, mode)}</div>
                        <div className="text-sm font-medium opacity-70">{mode === 'past' ? `${date.getFullYear()} (${getRelativeDisplay(date, mode).replace(' years ago', ' yrs ago').replace(' year ago', ' yr ago').replace(' months ago', ' mo ago')})` : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                    </>
                    )
                )}
            </div>
        </div>
    );
};

const StatCard = ({ id, label, value, subtext, icon: Icon, theme, config, onToggleHidden, onCycleSize, isEditing }: any) => {
    // ... (same as previous)
    const themes: any = { slate: "bg-gradient-to-br from-[#3f7486] to-[#9bbecb] text-white shadow-xl shadow-[#9bbecb]/30", white: "bg-white text-slate-900 border border-[#f7d8ee] shadow-sm" };
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
                <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'slate' ? 'text-white/80' : 'text-slate-400'}`}>{label}</span>
                {isEditing && (
                    <div className="flex gap-1">
                        <button onClick={() => onCycleSize(id)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-current transition-colors"><MoveDiagonal size={12} /></button>
                        <button onClick={() => onToggleHidden(id)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-current transition-colors">{config.hidden ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                    </div>
                )}
             </div>
             <div className="relative z-10">
                 <div className={`${config.size === 'big' || config.size === 'wide' ? 'text-5xl md:text-6xl' : 'text-4xl md:text-5xl'} font-serif font-medium tracking-tighter leading-none mb-2`}>{value}</div>
                 <div className={`text-xs font-bold uppercase tracking-wider ${theme === 'slate' ? 'text-white/80' : 'text-slate-400'}`}>{subtext}</div>
             </div>
        </div>
    );
};

const Profile: React.FC<ProfileProps> = ({ user, entries = [], streak = 0, onLogout, onCircleChange, onCreateCircle, onArchiveCircle, onRenameCircle, onUpdateUser, onShowLegal, onViewArtifact, onShowToast, pendingInvites = [], onAcceptInvite, onDeclineInvite, onTriggerPremium }) => {
  const { d: L, f: fill, date: fmtDate, num, tag, textApps } = useI18n();
  const M = L.app.me;
  const T = useUi(profile);
  /** "4 years ago", "in 12 days", "2年前", "dans 12 jours": past dates count back, birthdays count to the next one. */
  const relative = (when: Date, mode: 'past' | 'future') => {
    const target = mode === 'future' ? nextYearly(when) : when;
    const a = new Date(target); a.setHours(0, 0, 0, 0);
    const b = new Date(); b.setHours(0, 0, 0, 0);
    const days = Math.round((a.getTime() - b.getTime()) / 86400000);
    try {
      const rtf = new Intl.RelativeTimeFormat(tag, { numeric: 'auto' });
      if (Math.abs(days) >= 365 && mode === 'past') return rtf.format(-Math.floor(-days / 365.25), 'year');
      if (Math.abs(days) >= 60 && mode === 'past') return rtf.format(-Math.floor(-days / 30.44), 'month');
      return rtf.format(days, 'day');
    } catch { return days === 0 ? M.today : days === 1 ? M.tomorrow : days > 0 ? fill(M.inDays, { d: days }) : fill(M.daysAgo, { d: -days }); }
  };
  const [activeTab, setActiveTab] = useState<'us' | 'me'>('us');
  const [activeCircleId, setActiveCircleId] = useState(user.activeCircleId);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  // The Settings shortcut shows once the dates backend is deployed
  const [datesReady, setDatesReady] = useState(false);
  useEffect(() => { supabase.from('occasions').select('id').limit(1).then(({ error }) => setDatesReady(!error)); }, []);
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
  const [facts, setFacts] = useState({ firstMet: NO_DATE(), firstKiss: NO_DATE(), firstDate: NO_DATE(), partnerBday: NO_DATE(), anniversary: NO_DATE() });
  const [factConfigs, setFactConfigs] = useState<Record<string, { size: string; hidden: boolean }>>({
      timeTogether: { size: 'standard', hidden: false }, nextAnniversary: { size: 'standard', hidden: false }, firstMet: { size: 'standard', hidden: false }, firstKiss: { size: 'standard', hidden: false }, firstDate: { size: 'standard', hidden: false }, partnerBday: { size: 'standard', hidden: false }, anniversary: { size: 'standard', hidden: false }, 
  });
  const [isEditingFacts, setIsEditingFacts] = useState(false);
  const [customs, setCustoms] = useState<CustomTile[]>([]);
  const [tileOrder, setTileOrder] = useState<string[]>([]);
  const B = useUi(bentoUi);

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


  const totalMemoriesUs = entries.length;
  const totalMemoriesMe = entries.filter(e => e.userId === user.id).length;
  const sharedThisMonth = useMemo(() => {
      const now = new Date();
      return entries.filter(e => { const d = new Date(e.timestamp as any); return !e.isPrivate && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); }).length;
  }, [entries]);

  useEffect(() => {
    if (user.relationshipFacts) {
        try {
            const parsed = JSON.parse(user.relationshipFacts);
            setFacts({
                firstMet: fromStored(parsed.firstMet),
                firstKiss: fromStored(parsed.firstKiss),
                firstDate: fromStored(parsed.firstDate),
                partnerBday: fromStored(parsed.partnerBday),
                anniversary: fromStored(parsed.anniversary),
            });
            if (parsed.configs) setFactConfigs(prev => ({...prev, ...parsed.configs}));
            if (Array.isArray(parsed.order)) setTileOrder(parsed.order.filter((x: any) => typeof x === 'string').slice(0, 60));
            if (Array.isArray(parsed.custom)) setCustoms(parsed.custom.filter((c: any) => c && typeof c.title === 'string').slice(0, 24));
        } catch (e) { console.error("Failed to parse relationship facts", e); }
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
          const fileExt = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'jpg';
          const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;
          const { error } = await supabase.storage.from('journal-media').upload(fileName, file, { upsert: false });
          if (error) throw error;
          const { data } = supabase.storage.from('journal-media').getPublicUrl(fileName);
          const publicUrl = data.publicUrl + '?t=' + Date.now();
          setEditAvatar(publicUrl);
          onShowToast(T.photoUploaded, "success");
      } catch (error) { console.error("Upload failed:", error); onShowToast(T.photoFailed, "error"); } finally { setIsUploading(false); }
  };

  const handleGenerateReceipt = async () => {
      setGeneratingReceipt(true); setShowReceipt(true);
      if (!receiptData) {
          const data = await generateRelationshipReceipt(entries, `${user.name} & ${user.partnerName || T.partner}`);
          setReceiptData(data);
      }
      setGeneratingReceipt(false);
  };

  const handleShare = async (platform?: 'whatsapp' | 'twitter' | 'copy') => {
      if (!receiptData) return;
      const shareText = `🧾 ${T.shareHeading}\n\n${receiptData.merchantName}\n${fill(T.shareDate, { date: receiptData.date })}\n${fill(T.shareTotal, { total: receiptData.total })}\n\n"${receiptData.footerQuote}"\n\n${T.shareFooter}`;
      if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
      else if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
      else if (platform === 'copy') { await navigator.clipboard.writeText(shareText); onShowToast(T.receiptCopied, "success"); }
      else if (navigator.share) await navigator.share({ title: T.shareTitle, text: shareText, url: window.location.href });
      else handleShare('copy');
  };

  const handleCopyInviteLink = async () => {
      // One-time link; it no longer contains your account ID
      const { data: token, error } = await supabase.rpc('create_partner_invite');
      // Until the new invite system is installed, fall back to a request link they must accept
      const legacy = !!error && /could not find the function|PGRST202/i.test(`${error.message} ${(error as any).code ?? ''}`);
      if (!legacy && (error || !token)) { onShowToast(T.inviteLinkFailed, "error"); return; }
      const inviteUrl = `${window.location.origin}/?invite=${legacy ? user.id : token}`;
      try { await navigator.clipboard.writeText(inviteUrl); onShowToast(legacy ? T.inviteLinkCopied : T.inviteLinkCopiedOnce, "success"); } catch (err) { onShowToast(T.linkCopyFailed, "error"); }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail.trim() || !invitingCircleId) return;
      
      setInviteStatus('searching');
      try {
          const { data: partnerId } = await supabase.rpc('find_user_by_email', { p_email: inviteEmail.trim() });
          if (!partnerId) { setInviteStatus('not-found'); return; }
          if (partnerId === user.id) { onShowToast(T.cantInviteSelf, "error"); setInviteStatus('idle'); return; }

          const { error } = await supabase.from('partner_connections').insert({ user_id: user.id, partner_id: partnerId, status: 'pending' });
          if (error && error.code !== '23505') { console.error(error); onShowToast(fill(T.inviteFailed, { error: error.message }), 'error'); setInviteStatus('idle'); return; }
          
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
          onShowToast(T.inviteSent, 'success');
          setTimeout(() => { setShowInviteModal(false); setInviteStatus('idle'); setInviteEmail(''); }, 2000);
          
      } catch (err) { console.error(err); setInviteStatus('idle'); }
  };

  const saveFacts = async () => {
    setIsEditingFacts(false);
    const keep = (d: Date) => (isSet(d) ? toInput(d) : null);
    const payload = { firstMet: keep(facts.firstMet), firstKiss: keep(facts.firstKiss), firstDate: keep(facts.firstDate), partnerBday: keep(facts.partnerBday), anniversary: keep(facts.anniversary), configs: factConfigs };
    const factsText = JSON.stringify({ ...payload, order: tileOrder, custom: customs.filter(c => c.title.trim() || c.value.trim()).map(c => ({ ...c, title: c.title.slice(0, 40), value: c.value.slice(0, 160) })) });
    try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;
        const { data: existingFacts } = await supabase.from('journal_entries').select('id').eq('user_id', currentUser.id).contains('tags', ['system_facts']).maybeSingle();
        if (existingFacts) await supabase.from('journal_entries').update({ content: factsText }).eq('id', existingFacts.id);
        else await supabase.from('journal_entries').insert({ user_id: currentUser.id, content: factsText, type: 'Milestone', tags: ['system_facts', `circle:${activeCircleId}`], is_shared: true, date: new Date().toISOString() });
        onUpdateUser({ relationshipFacts: factsText });
        await syncFactDates(currentUser.id);
        onShowToast(M.saved, "success");
    } catch (e) { console.error("Error saving facts:", e); onShowToast(T.factsFailed, "error"); }
  };

  // The yearly ones become dates Belluh reminds you about (in the app and on WhatsApp), like any date you tell it.
  const syncFactDates = async (uid: string) => {
    const partnerFirst = (user.partnerName || activeMembers.find(m => m.id !== user.id)?.name || '').split(' ')[0];
    const wanted: { kind: string; label: string; d: Date }[] = [
      { kind: 'anniversary', label: T.ourAnniversary, d: facts.anniversary },
      { kind: 'birthday', label: partnerFirst ? fill(M.birthday, { partner: partnerFirst }) : M.partnerBirthday, d: facts.partnerBday },
      { kind: 'first_date', label: T.ourFirstDate, d: facts.firstDate },
    ];
    try {
      await supabase.from('occasions').delete().eq('user_id', uid).eq('source_message', FROM_PROFILE);
      const rows = wanted.filter(w => isSet(w.d)).map(w => ({
        user_id: uid, kind: w.kind, label: w.label, month: w.d.getMonth() + 1, day: w.d.getDate(), year: w.d.getFullYear(),
        repeats_yearly: true, source: 'app', source_message: FROM_PROFILE,
      }));
      // one at a time, so a date already saved another way (same label and day) is simply skipped
      for (const r of rows) await supabase.from('occasions').insert(r);
    } catch (e) { console.error('Could not sync dates', e); }
  };

  const cycleSize = (id: string) => { setFactConfigs(prev => { const sizes: string[] = ['standard', 'wide', 'tall', 'big']; const current = prev[id]?.size || 'standard'; const next = sizes[(sizes.indexOf(current) + 1) % sizes.length]; return { ...prev, [id]: { ...prev[id], size: next } }; }); };
  const toggleHidden = (id: string) => { setFactConfigs(prev => ({ ...prev, [id]: { ...prev[id], hidden: !prev[id].hidden } })); };
  const currentColor = RECEIPT_COLORS[receiptColorIdx];

  // Dynamic Members for "Us" Display
  const activeMembers = useMemo(() => {
      if (!activeCircle || !activeCircle.memberProfiles || activeCircle.memberProfiles.length === 0) {
          return [
              { id: user.id, name: user.name, avatar: user.avatar },
              { id: 'p1', name: user.partnerName || T.partner, avatar: calmAvatar(user.partnerAvatar) || avatarFor(user.partnerName || 'partner') }
          ];
      }
      return activeCircle.memberProfiles;
  }, [activeCircle, user]);

  return (
    <div className="pb-32 pt-10 px-0 max-w-4xl mx-auto min-h-screen bg-paper">
      <div className="px-6 mb-10 flex items-center justify-between">
          <div role="tablist" aria-label={T.whosePage} className="p-1 rounded-full bg-slate-100/80 flex text-sm font-semibold">
              <button role="tab" aria-selected={activeTab === 'us'} onClick={() => setActiveTab('us')} className={`h-9 px-5 rounded-full transition-all ${activeTab === 'us' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{M.us}</button>
              <button role="tab" aria-selected={activeTab === 'me'} onClick={() => setActiveTab('me')} className={`h-9 px-5 rounded-full transition-all ${activeTab === 'me' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{M.me}</button>
          </div>
          <button onClick={() => setShowSettingsModal(true)} aria-label={T.settings} className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Settings size={21} /></button>
      </div>

      {pendingInvites && pendingInvites.length > 0 && (
          <div className="px-6 mb-8 animate-slide-up">
              <div className="bg-belluh-50 border border-belluh-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                      <Mail size={16} className="text-belluh-600" />
                      <h3 className="text-[13px] font-semibold text-belluh-800">{T.pendingInvite}</h3>
                  </div>
                  {pendingInvites.map(invite => (
                      <div key={invite.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <img src={invite.inviter.avatar} alt={T.inviterAlt} className="w-10 h-10 rounded-full bg-slate-100 object-cover" />
                              <div>
                                  <p className="text-sm font-bold text-slate-900">{fill(T.connectWith, { name: invite.inviter.name })}</p>
                                  <p className="text-xs text-slate-500">{fill(T.wantsToLink, { name: invite.inviter.name })}</p>
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
                          <p className="text-sm text-amber-900">{T.archivedNotice}</p>
                      </div>
                  </div>
              ) : activeCircleId === 'constellation' ? (
                  <div className="px-6">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
                          <Star size={20} className="text-belluh-300 fill-belluh-300" />
                          <div>
                            <h3 className="text-sm font-bold text-white">{T.constellation}</h3>
                            <p className="text-xs text-slate-400">{T.constellationBody}</p>
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
                                      <div className={`relative ${activeMembers.length <= 2 ? 'w-24 h-24 md:w-28 md:h-28' : activeMembers.length <= 4 ? 'w-20 h-20 md:w-24 md:h-24' : 'w-16 h-16 md:w-20 md:h-20'} rounded-full ring-[5px] ring-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)] overflow-hidden bg-[#eef7fa] belluh-float belluh-wiggle ${index > 0 ? (activeMembers.length <= 4 ? '-ml-5' : '-ml-4') : ''}`} style={{ zIndex: 20 - index, ['--r' as any]: index % 2 ? '5deg' : '-5deg', animationDelay: `${index * -1.3}s` }}>
                                          <img src={member.avatar} className="w-full h-full object-cover" alt={member.name} />
                                      </div>
                                  </React.Fragment>
                              ))}
                          </div>
                          <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mt-7 tracking-tight text-center px-4">
                              {activeMembers.map(m => m.name.split(' ')[0]).join(' & ')}
                          </h2>
                          <div className="mt-7 grid grid-cols-3 gap-2.5 md:gap-3 w-full max-w-md text-center">
                                {[
                                    { n: streak, label: streak === 1 ? M.dayInRow : M.daysInRow, e: '🔥', c: 'bg-[#fff1d6] text-[#8a5300]', r: '-3deg' },
                                    { n: sharedThisMonth, label: M.sharedMonth, e: '💌', c: 'bg-[#fde7f3] text-[#9d2d6f]', r: '2deg' },
                                    { n: totalMemoriesUs, label: totalMemoriesUs === 1 ? M.memory : M.memories, e: '📸', c: 'bg-[#e1f1f7] text-[#2f6b80]', r: '-2deg' },
                                ].map((x, i) => (
                                    <div key={x.label} className={`belluh-pop rounded-[1.6rem] px-2 pt-3.5 pb-3.5 flex flex-col items-center ${x.c}`} style={{ animationDelay: `${120 + i * 80}ms` }}>
                                        <Emoji e={x.e} size={32} style={{ transform: `rotate(${x.r})` }} />
                                        <p className="mt-2 font-serif text-[1.9rem] leading-none tabular-nums">{x.n}</p>
                                        <p className="mt-1.5 text-[11.5px] font-semibold leading-tight opacity-80 [text-wrap:balance]">{x.label}</p>
                                    </div>
                                ))}
                          </div>
                      </div>
                      
                      <div className="mt-10 mb-12"><React.Suspense fallback={null}><OurWorld entries={entries} /></React.Suspense></div>

                      {/* Relationship Facts Grid */}
                      {activeCircle && (
                          <div className="mb-12 relative group/facts">
                              <div className="flex items-center justify-between mb-6">
                                  <h3 className="font-serif text-xl text-slate-900 pl-1">{M.yourDates}</h3>
                                  <button onClick={() => isEditingFacts ? saveFacts() : setIsEditingFacts(true)} className={`h-9 px-4 rounded-full text-sm font-semibold transition-colors inline-flex items-center gap-1.5 ${isEditingFacts ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
                                      {isEditingFacts ? <><Check size={15} /> {L.common.done}</> : <><Edit3 size={15} /> {L.common.edit}</>}
                                  </button>
                              </div>
                              {(() => {
                                  const partnerFirst = (user.partnerName || activeMembers.find(m => m.id !== user.id)?.name || '').split(' ')[0];
                                  const rows = [
                                      { key: 'anniversary', label: M.together, icon: Sparkles, mode: 'past' as const },
                                      { key: 'firstMet', label: M.firstMet, icon: Users, mode: 'past' as const },
                                      { key: 'firstDate', label: M.firstDate, icon: Calendar, mode: 'past' as const },
                                      { key: 'firstKiss', label: M.firstKiss, icon: Heart, mode: 'past' as const },
                                      { key: 'partnerBday', label: partnerFirst ? fill(M.birthday, { partner: partnerFirst }) : M.partnerBirthday, icon: Gift, mode: 'future' as const },
                                  ];
                                  const f = facts as Record<string, Date>;
                                  const from = isSet(facts.anniversary) ? facts.anniversary : facts.firstMet;
                                  const days = isSet(from) ? Math.floor((Date.now() - from.getTime()) / 86400000) + 1 : null;
                                  const nextAnniv = isSet(facts.anniversary) ? getRelativeDisplay(facts.anniversary, 'future') : null;
                                  const anySet = rows.some(r => isSet(f[r.key]));
                                  if (!anySet && !isEditingFacts) return (
                                      <div className="rounded-[2rem] bg-white border border-slate-100 p-7 text-center">
                                          <Heart size={22} className="mx-auto text-[#f0addd]" />
                                          <p className="mt-4 font-serif text-2xl text-slate-900">{M.inviteTitle}</p>
                                          <p className="mt-2 text-[15px] text-slate-500 leading-relaxed max-w-sm mx-auto">{M.inviteBody}</p>
                                          <button onClick={() => setIsEditingFacts(true)} className="mt-6 h-11 px-6 rounded-full bg-[#5e9db3] text-white text-sm font-semibold hover:bg-[#4f8ea4]">{M.inviteButton}</button>
                                      </div>
                                  );
                                  // A bento of your dates, after Pampam and Zenly: a big "days together" tile, then a tile per date,
                                  // each its own solid pastel with a 3D emoji. Tiles side by side are the same size.
                                  const TILE: Record<string, { e: string; bg: string; ink: string; w: number }> = {
                                      anniversary: { e: '💞', ...TILE_COLORS[0], w: 2 },
                                      firstMet: { e: '🫂', ...TILE_COLORS[1], w: 2 },
                                      firstDate: { e: '🥂', ...TILE_COLORS[2], w: 2 },
                                      firstKiss: { e: '💗', ...TILE_COLORS[3], w: 3 },
                                      partnerBday: { e: '🎂', ...TILE_COLORS[4], w: 3 },
                                  };
                                  const LEGACY: Record<string, number> = { S: 2, M: 3, L: 6 };
                                  const dims = (key: string, fallbackW: number) => { const c: any = factConfigs[key] ?? {}; return { w: c.w ?? LEGACY[c.size] ?? fallbackW, h: c.h ?? 1 }; };
                                  const updateCustom = (id: string, p: Partial<CustomTile>) => setCustoms(cs => cs.map(c => c.id === id ? { ...c, ...p } : c));
                                  const addCustom = (title: string) => { setCustoms(cs => [...cs, { id: Math.random().toString(36).slice(2, 10), title, value: '', emoji: CUSTOM_EMOJI[cs.length % CUSTOM_EMOJI.length], size: 'S', w: 2, h: 1 }]); setIsEditingFacts(true); };
                                  const items: BentoItem[] = [
                                      ...rows.map(r => {
                                          const d = f[r.key], t = TILE[r.key];
                                          return { id: r.key, ...dims(r.key, t.w), node: (
                                              <div className={`h-full ${t.bg} rounded-[1.75rem] p-5 flex flex-col justify-between gap-4`}>
                                                  <Emoji e={t.e} size={40} />
                                                  <div className="min-w-0">
                                                      <p className={`text-[13px] font-bold ${t.ink}`}>{r.label}</p>
                                                      {isEditingFacts ? (
                                                          <input type="date" aria-label={r.label} value={toInput(d)} onChange={e => setFacts({ ...facts, [r.key]: fromInput(e.target.value) })} className="mt-2 h-10 w-full rounded-xl border border-white bg-white/80 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9bbecb]" />
                                                      ) : isSet(d) ? (
                                                          <>
                                                              <p className="mt-1 font-serif text-[1.12rem] sm:text-[1.35rem] leading-tight text-slate-900 whitespace-nowrap">{fmtDate(d, { month: 'short', day: 'numeric', year: r.mode === 'past' ? 'numeric' : undefined })}</p>
                                                              <p className={`mt-0.5 text-xs font-semibold opacity-75 ${t.ink}`}>{relative(d, r.mode)}</p>
                                                          </>
                                                      ) : (
                                                          <button onClick={() => setIsEditingFacts(true)} className={`mt-1 text-[15px] font-bold ${t.ink} hover:opacity-70`}>+&#xFE0E; {L.common.add}</button>
                                                      )}
                                                  </div>
                                              </div>
                                          ) };
                                      }),
                                      ...customs.filter(c => isEditingFacts || c.title.trim() || c.value.trim()).map((c, i) => {
                                          const col = TILE_COLORS[(i + 5) % TILE_COLORS.length];
                                          return { id: c.id, w: c.w ?? LEGACY[c.size] ?? 2, h: c.h ?? 1, node: (
                                              <div className={`relative h-full ${col.bg} rounded-[1.75rem] p-5 flex flex-col justify-between gap-4`}>
                                                  {isEditingFacts
                                                      ? <button type="button" onClick={() => updateCustom(c.id, { emoji: CUSTOM_EMOJI[(CUSTOM_EMOJI.indexOf(c.emoji) + 1) % CUSTOM_EMOJI.length] })} aria-label={B.emoji} className="self-start"><Emoji e={c.emoji} size={40} /></button>
                                                      : <Emoji e={c.emoji} size={40} />}
                                                  {isEditingFacts && <button type="button" onClick={() => setCustoms(cs => cs.filter(x => x.id !== c.id))} aria-label={B.remove} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 text-slate-500 hover:text-slate-900 font-bold">✕&#xFE0E;</button>}
                                                  {isEditingFacts ? (
                                                      <div className="space-y-2">
                                                          <input value={c.title} onChange={e => updateCustom(c.id, { title: e.target.value.slice(0, 40) })} placeholder={B.titlePh} aria-label={B.titlePh} className={`w-full h-9 rounded-xl bg-white/80 px-3 text-[13px] font-bold ${col.ink} placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9bbecb]`} />
                                                          <input value={c.value} onChange={e => updateCustom(c.id, { value: e.target.value.slice(0, 160) })} placeholder={B.valuePh} aria-label={B.valuePh} className="w-full h-10 rounded-xl bg-white/80 px-3 font-serif text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9bbecb]" />
                                                      </div>
                                                  ) : (
                                                      <div className="min-w-0">
                                                          <p className={`text-[13px] font-bold ${col.ink}`}>{c.title}</p>
                                                          <p className="mt-1 font-serif text-[1.12rem] sm:text-[1.35rem] leading-snug text-slate-900 [text-wrap:pretty]">{c.value}</p>
                                                      </div>
                                                  )}
                                              </div>
                                          ) };
                                      }),
                                  ];
                                  // The order they arranged, with anything new at the end
                                  const rank = (id: string) => { const k = tileOrder.indexOf(id); return k < 0 ? 1000 + items.findIndex(x => x.id === id) : k; };
                                  items.sort((a, b) => rank(a.id) - rank(b.id));
                                  const move = (dragId: string, overId: string) => {
                                      const ids = items.map(x => x.id).filter(x => x !== dragId);
                                      ids.splice(ids.indexOf(overId) + (items.findIndex(x => x.id === dragId) < items.findIndex(x => x.id === overId) ? 1 : 0), 0, dragId);
                                      setTileOrder(ids);
                                  };
                                  const resize = (id: string, w: number, h: number) => {
                                      if (customs.some(c => c.id === id)) updateCustom(id, { w, h });
                                      else setFactConfigs(prev => ({ ...prev, [id]: { ...(prev[id] ?? { hidden: false, size: 'standard' }), w, h } as any }));
                                  };
                                  return (
                                      <DragBento items={items} editing={isEditingFacts} onMove={move} onSize={resize} resizeLabel={B.size}
                                          head={days !== null && !isEditingFacts ? (
                                              <div className="belluh-pop rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.25)] p-6 flex items-center gap-5" style={{ gridColumn: '1 / -1' }}>
                                                  <Emoji e="🥰" size={60} />
                                                  <div className="min-w-0">
                                                      <p className="font-serif text-5xl text-slate-900 tracking-tight leading-none tabular-nums">{num(days)}</p>
                                                      <p className="mt-1.5 text-[15px] font-semibold text-slate-500">{days === 1 ? M.dayTogether : M.daysTogether}</p>
                                                      {(() => {
                                                          // The next moment worth marking: a 100-day milestone (day 100, day 1,000) or the anniversary, whichever comes first
                                                          const mark = days < 1000 ? Math.ceil((days + 1) / 100) * 100 : Math.ceil((days + 1) / 1000) * 1000;
                                                          const toMark = mark - days;
                                                          const annivIn = nextAnniv === 'Today' ? 0 : nextAnniv === 'Tomorrow' ? 1 : nextAnniv ? parseInt(nextAnniv, 10) : NaN;
                                                          const line = !isNaN(annivIn) && annivIn <= toMark
                                                              ? (annivIn === 0 ? M.anniversaryToday : fill(M.anniversaryIn, { d: annivIn, days: annivIn === 1 ? M.day : M.days }))
                                                              : fill(M.dayIn, { n: num(mark), d: toMark, days: toMark === 1 ? M.day : M.days });
                                                          return <p className="mt-1 text-sm font-semibold text-[#3f7486]">{line}</p>;
                                                      })()}
                                                  </div>
                                              </div>
                                          ) : null}
                                          tail={
                                              <div className="rounded-[1.75rem] border-2 border-dashed border-slate-200 p-4" style={{ gridColumn: '1 / -1' }}>
                                                  <p className="text-[13px] font-bold text-slate-500 inline-flex items-center gap-1.5"><span className="text-base leading-none">+&#xFE0E;</span> {B.addOwn}</p>
                                                  <div className="mt-2.5 flex flex-wrap gap-2">
                                                      {B.ideas.filter(x => !customs.some(c => c.title === x)).map(x => (
                                                          <button key={x} type="button" onClick={() => addCustom(x)} className="h-9 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[13px] font-semibold text-slate-700">{x}</button>
                                                      ))}
                                                      <button type="button" onClick={() => addCustom('')} className="h-9 w-9 rounded-full bg-slate-900 text-white text-lg font-bold" aria-label={B.addOwn}>+&#xFE0E;</button>
                                                  </div>
                                              </div>
                                          } />
                                  );
                              })()}
                          </div>
                      )}

                      {datesReady && <button onClick={() => setShowSettingsModal(true)} className="w-full mb-12 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 flex items-center justify-between text-left hover:border-slate-200 transition-colors">
                          <div>
                              <p className="font-serif text-lg text-slate-900">{T.connectedTitle}</p>
                              <p className="text-sm text-slate-500 mt-0.5">{fill(T.connectedBody, { apps: textApps })}</p>
                          </div>
                          <ChevronRight size={18} className="text-slate-300 shrink-0" />
                      </button>}
                      
                      {/* Keepsakes */}
                      <h3 className="font-serif text-xl text-slate-900 pl-1 mb-4">{T.keepsakes}</h3>
                      <div className="grid grid-cols-2 gap-4">
                          <div onClick={() => onViewArtifact('letter')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col aspect-square justify-between cursor-pointer hover:shadow-md transition-shadow">
                              <Mail size={24} className="text-[#f0addd]" />
                              <div>
                                  <h4 className="font-serif text-lg text-slate-900 font-bold">{T.futureLetter}</h4>
                                  <p className="text-[12px] text-slate-400 font-semibold mt-1">{fill(T.opensIn, { year: 2030 })}</p>
                              </div>
                          </div>
                          <div onClick={() => onViewArtifact('reel')} className="bg-gradient-to-br from-[#3f7486] to-[#9bbecb] p-6 rounded-[2rem] shadow-lg shadow-[#9bbecb]/30 flex flex-col aspect-square justify-between cursor-pointer hover:scale-[1.02] transition-transform">
                              <Film size={24} className="text-white" />
                              <div>
                                  <h4 className="font-serif text-lg text-white font-bold">{T.chapterReel}</h4>
                                  <p className="text-[12px] text-white/75 font-semibold mt-1">{T.highlights}</p>
                              </div>
                          </div>
                          <div onClick={handleGenerateReceipt} className="col-span-2 bg-[#fdf0f8] border border-[#f7d8ee] p-6 rounded-[2rem] flex items-center justify-between cursor-pointer hover:shadow-lg hover:shadow-[#f7d8ee]/60 transition-shadow relative overflow-hidden group">
                               <div className="relative z-10 flex items-center gap-4">
                                   <Receipt size={24} className="text-[#e58fc9] shrink-0" />
                                   <div className="text-[#9d3f78]">
                                       <h4 className="font-serif text-xl font-bold">{T.printReceipt}</h4>
                                       <p className="text-xs font-medium text-[#9d3f78]/70">{T.receiptSub}</p>
                                   </div>
                               </div>
                               <ArrowRight className="text-[#e58fc9] group-hover:translate-x-0.5 transition-transform" size={20} />
                          </div>
                      </div>
                  </div>
              )}
          </div>
      ) : (
          <div className="px-6 animate-fade-in pb-20">
              <ProfileStudio userId={user.id} name={user.name} avatar={user.avatar} subtitle={`${totalMemoriesMe} ${totalMemoriesMe === 1 ? M.memory : M.memories}`}
                memoryPhotos={entries.filter(e => e.userId === user.id && e.mediaUrl && !/\.(webm|mp3|m4a|ogg|wav|mp4|mov)(\?|$)/i.test(e.mediaUrl)).map(e => e.mediaUrl!).slice(0, 24)}
                onEditProfile={() => setIsEditingProfile(true)} editLabel={T.editProfile} />

              {/* Circles: the people you keep a journal with */}
              <h3 className="font-serif text-xl text-slate-900 pl-1 mb-4">{T.yourCircles}</h3>
              <div className="rounded-[2rem] bg-white border border-slate-100 shadow-sm px-6 py-1 mb-10">
                  {activeCircles.map(circle => (
                      <div key={circle.id} className="flex items-center gap-4 py-4">
                          <button onClick={() => handleCircleSwitch(circle.id)} className="flex-1 min-w-0 text-left group">
                              <span className="block font-serif text-lg text-slate-900 truncate">{circle.name}</span>
                              <span className="block text-sm text-slate-400">{activeCircleId === circle.id ? <span className="text-[#3f7486] font-semibold">{T.openNow}</span> : (T.circleTypes[circle.type as keyof typeof T.circleTypes] || circle.type || T.circle)}{circle.members.length > 2 ? fill(T.people, { n: circle.members.length }) : ''}</span>
                          </button>
                          <button onClick={() => handleEditCircleOpen(circle)} aria-label={fill(T.manageNamed, { name: circle.name })} className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"><MoreHorizontal size={18} /></button>
                      </div>
                  ))}
                  {isCreatingCircle ? (
                      <div className="flex items-center gap-2 py-3">
                          <input type="text" value={newCircleName} onChange={(e) => setNewCircleName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateCircle()} placeholder={T.nameCircle} className="flex-1 min-w-0 h-11 bg-slate-50 rounded-full px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#9bbecb]" autoFocus />
                          <button onClick={() => setIsCreatingCircle(false)} className="h-11 px-3 rounded-full text-sm font-semibold text-slate-500 hover:bg-slate-100">{T.cancel}</button>
                          <button onClick={handleCreateCircle} disabled={!newCircleName.trim()} className="h-11 px-4 rounded-full bg-slate-900 text-white text-sm font-semibold disabled:opacity-30">{T.create}</button>
                      </div>
                  ) : (
                      <button onClick={() => setIsCreatingCircle(true)} className="w-full flex items-center gap-2 py-4 text-left text-[15px] font-semibold text-[#3f7486] hover:text-slate-900 transition-colors"><Plus size={17} /> {T.newCircle}</button>
                  )}
              </div>

              {archivedCircles.length > 0 && (
                  <>
                      <h3 className="font-serif text-xl text-slate-900 pl-1 mb-4">{T.pastChapters}</h3>
                      <div className="rounded-[2rem] bg-white border border-slate-100 shadow-sm px-6 py-1 mb-10">
                          {archivedCircles.map(circle => (
                              <div key={circle.id} className="flex items-center gap-4 py-4">
                                  <button onClick={() => handleCircleSwitch(circle.id)} className="flex-1 min-w-0 text-left">
                                      <span className="block font-serif text-lg text-slate-500 truncate">{circle.name}</span>
                                      <span className="block text-sm text-slate-400">{T.keptReadOnly}</span>
                                  </button>
                                  <button onClick={() => handleEditCircleOpen(circle)} aria-label={fill(T.manageNamed, { name: circle.name })} className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"><MoreHorizontal size={18} /></button>
                              </div>
                          ))}
                      </div>
                  </>
              )}

              <h3 className="font-serif text-xl text-slate-900 pl-1 mb-4">{T.yourStory}</h3>
              <button onClick={() => handleCircleSwitch('constellation')} className="w-full rounded-[2rem] bg-white border border-slate-100 shadow-sm px-6 py-5 flex items-center gap-4 text-left group">
                  <Star size={20} className="shrink-0 text-[#9bbecb]" />
                  <span className="flex-1 min-w-0">
                      <span className="block font-serif text-lg text-slate-900">{T.everyMoment}</span>
                      <span className="block text-sm text-slate-400">{T.allCircles}</span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
              </button>
          </div>
      )}

      {/* Edit Circle Modal */}
      {editingCircle && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setEditingCircle(null)}>
              <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-serif text-xl text-slate-900">{T.manageCircle}</h3>
                      <button onClick={() => setEditingCircle(null)}><X size={20} className="text-slate-400"/></button>
                  </div>
                  <div className="space-y-6">
                      <div>
                          <label className="text-[13px] font-semibold text-slate-400 mb-2 block">{T.name}</label>
                          <div className="flex gap-2">
                              <input type="text" value={editCircleName} onChange={(e) => setEditCircleName(e.target.value)} className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-belluh-200" />
                              <button onClick={handleRenameSubmit} disabled={!editCircleName.trim() || editCircleName === editingCircle.name} className="bg-slate-900 text-white p-3 rounded-xl disabled:opacity-50 hover:bg-black transition-colors"><Check size={18} /></button>
                          </div>
                      </div>
                      <div className="space-y-3">
                          {editingCircle.status === CircleStatus.Active && (
                              <button onClick={() => handleTriggerInvite(editingCircle.id)} className="w-full bg-belluh-50 text-belluh-600 border border-belluh-200 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-belluh-100 transition-all text-sm">
                                  <UserPlus size={16} /> <span>{T.invitePartner}</span>
                              </button>
                          )}
                          <button onClick={handleArchiveSubmit} className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm border ${editingCircle.status === CircleStatus.Archived ? 'bg-slate-900 text-white hover:bg-black border-transparent' : 'bg-white text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-50'}`}>
                              {editingCircle.status === CircleStatus.Archived ? <RefreshCw size={16} /> : <Archive size={16} />}
                              <span>{editingCircle.status === CircleStatus.Archived ? T.restoreCircle : T.archiveCircle}</span>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Settings Dialog Overlay */}
      {showSettingsModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center md:p-6" onClick={() => setShowSettingsModal(false)}>
              <div className="bg-paper rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 md:p-8 w-full md:max-w-lg max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="font-serif text-2xl mb-8 text-slate-900">{T.settings}</h3>

                  {/* Connected: texting Belluh and calendars */}
                  <WhatsAppDates onShowToast={onShowToast} />
                  <NotificationsToggle onShowToast={onShowToast} />
                  <CalendarSync onShowToast={onShowToast} />
                  <YourData />
                  
                  {/* Theme Selector */}
                  <div className="mb-8">
                      <p className="text-[13px] font-semibold text-slate-400 mb-4 flex items-center gap-2">
                          <Palette size={14} /> {T.appearance}
                      </p>
                      <p className="text-sm text-slate-500 mb-4">{T.appearanceBody}</p>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-x-2 gap-y-4">
                          {Object.keys(THEMES).map((themeKey) => {
                              const on = (user.settings.colorTheme || 'pink') === themeKey;
                              const name = T.themes[themeKey as keyof typeof T.themes] || themeKey.charAt(0).toUpperCase() + themeKey.slice(1);
                              return (
                                  <button
                                    key={themeKey}
                                    onClick={() => onUpdateUser({ settings: { ...user.settings, colorTheme: themeKey as ColorTheme } })}
                                    aria-label={fill(T.themeLabel, { name })}
                                    aria-pressed={on}
                                    className="flex flex-col items-center gap-1.5 group"
                                  >
                                    <span className={`w-11 h-11 rounded-full transition-transform group-hover:scale-105 group-active:scale-95 ${on ? 'ring-2 ring-offset-2 ring-slate-900' : 'ring-1 ring-black/5'}`}
                                      style={{ background: `linear-gradient(135deg, ${THEMES[themeKey as ColorTheme][100]}, ${THEMES[themeKey as ColorTheme][300]})` }} />
                                    <span className={`text-[11px] ${on ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>{name}</span>
                                  </button>
                              );
                          })}
                      </div>
                  </div>

                  <p className="text-[13px] font-semibold text-slate-400 mb-2">{T.account}</p>
                  <div className="space-y-1">
                    <button onClick={() => onShowLegal('tos')} className="w-full py-3 flex items-center justify-between text-slate-500 hover:bg-slate-50 rounded-xl px-2"><span className="text-sm font-bold">{T.terms}</span><ChevronRight size={16} /></button>
                    <button onClick={() => onShowLegal('privacy')} className="w-full py-3 flex items-center justify-between text-slate-500 hover:bg-slate-50 rounded-xl px-2"><span className="text-sm font-bold">{T.privacy}</span><ChevronRight size={16} /></button>
                    <button onClick={onLogout} className="w-full py-3 flex items-center justify-between text-slate-500 hover:bg-slate-50 rounded-xl px-2"><span className="text-sm font-bold">{T.logOut}</span><LogOut size={16} /></button>
                  </div>
                  <button onClick={() => setShowSettingsModal(false)} className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-bold">{L.common.done}</button>
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
                       <p className="font-semibold text-[13px] text-white/60">{T.workingItOut}</p>
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
                                         <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">{receiptData.date}, {new Date().toLocaleTimeString(tag, {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                    <div className="border-b border-dashed border-current opacity-30 mb-6"></div>
                                    <div className="space-y-4 font-mono text-xs mb-8">
                                        {receiptData.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start gap-4">
                                                <div className="flex gap-2"><span className="opacity-50">{item.qty}</span><span className="font-semibold tracking-tight">{item.desc}</span></div>
                                                <span className="font-bold whitespace-nowrap">{item.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-b border-dashed border-current opacity-30 mb-6"></div>
                                    <div className="space-y-2 font-mono text-xs mb-8">
                                        <div className="flex justify-between"><span className="opacity-60">{T.subtotal}</span><span>{receiptData.subtotal}</span></div>
                                        <div className="flex justify-between"><span className="opacity-60">{T.emotionalTax}</span><span>{receiptData.tax}</span></div>
                                        <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t border-dashed border-current border-opacity-30"><span>{T.total}</span><span>{receiptData.total}</span></div>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-mono text-[10px] uppercase opacity-60 mb-6 max-w-[200px] mx-auto leading-relaxed">"{receiptData.footerQuote}"</p>
                                        <div className="h-10 w-4/5 mx-auto opacity-80 mix-blend-multiply" style={{ background: `repeating-linear-gradient(90deg, currentColor 0px, currentColor 2px, transparent 2px, transparent 4px, currentColor 4px, currentColor 5px, transparent 5px, transparent 8px, currentColor 8px, currentColor 11px, transparent 11px, transparent 12px)` }}></div>
                                        <p className="font-mono text-[8px] uppercase tracking-[0.3em] mt-2 opacity-40">{T.thankYou}</p>
                                    </div>
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
                                    <div className="absolute bottom-0 left-0 w-full h-3 -mb-3" style={{ background: `radial-gradient(circle at 10px 0, ${currentColor.hex} 10px, transparent 10.5px)`, backgroundSize: '20px 10px', backgroundRepeat: 'repeat-x' }}></div>
                                </div>
                           </div>
                       </div>
                       <div className="flex flex-col items-center gap-6 w-full animate-fade-in shrink-0" style={{ animationDelay: '0.2s' }}>
                           <div className="flex gap-3 bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 overflow-x-auto max-w-full">
                               {RECEIPT_COLORS.map((color, idx) => (
                                   <button key={idx} onClick={() => setReceiptColorIdx(idx)} className={`w-8 h-8 rounded-full border-2 shrink-0 transition-all ${receiptColorIdx === idx ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'}`} style={{ backgroundColor: color.hex }} title={T.colors[color.name as keyof typeof T.colors] || color.name} />
                               ))}
                           </div>
                           <div className="flex gap-4">
                               <button onClick={() => handleShare()} className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-full font-bold text-sm shadow-xl hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all"><Share2 size={16} /><span>{T.share}</span></button>
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
                    <h3 className="font-serif text-2xl text-slate-900">{T.invitePartner}</h3>
                    <button onClick={() => setShowInviteModal(false)}><X size={20} className="text-slate-400"/></button>
                  </div>
                  <p className="text-slate-500 text-sm mb-6">{T.inviteBody}</p>
                  
                  {inviteStatus === 'sent' ? (
                      <div className="text-center py-6 animate-pop">
                          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32}/></div>
                          <p className="font-bold text-slate-900">{T.inviteSent}</p>
                      </div>
                  ) : (
                      <div className="space-y-6">
                          <button onClick={handleCopyInviteLink} className="w-full bg-belluh-50 text-belluh-600 border border-belluh-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-belluh-100 transition-all"><LinkIcon size={16} /><span>{T.copyInviteLink}</span></button>
                          <p className="text-center text-xs text-slate-400 font-medium">{T.orViaEmail}</p>
                          <form onSubmit={handleInviteSubmit} className="space-y-4">
                              <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder={T.emailPlaceholder} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-belluh-200" />
                              {inviteStatus === 'not-found' && <p className="text-rose-500 text-xs font-bold px-1">{T.userNotFound}</p>}
                              <button type="submit" disabled={inviteStatus === 'searching'} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2">
                                  {inviteStatus === 'searching' ? <Loader2 size={18} className="animate-spin" /> : <><span>{T.sendInvite}</span> <Send size={16} /></>}
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
                  <h3 className="font-serif text-2xl mb-8 text-slate-900">{T.editProfile}</h3>
                  <div className="space-y-6">
                      <div className="flex flex-col items-center">
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                              <img src={editAvatar} className={`w-24 h-24 rounded-full border-4 border-slate-50 shadow-sm object-cover transition-opacity ${isUploading ? 'opacity-50' : ''}`} alt={T.profileAlt} />
                              <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload size={20} className="text-white" /></div>
                              {isUploading && <div className="absolute inset-0 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-slate-900" /></div>}
                          </div>
                          <div className="flex items-center gap-4 mt-4">
                              <button onClick={() => fileInputRef.current?.click()} className="text-[12px] font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-full">{T.uploadPhoto}</button>
                              <button onClick={() => setEditAvatar(avatarFor(String(Date.now())))} className="text-[12px] font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-full">{T.shuffleArt}</button>
                          </div>
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-900 ml-1">{T.name}</label>
                          <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-belluh-200" />
                      </div>
                  </div>
                  <button onClick={handleSaveProfile} className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-bold">{T.saveChanges}</button>
              </div>
          </div>
      )}
    </div>
  );
};

// Inline helper components
const Loader2 = ({ size, className }: { size: number, className?: string }) => (<div className={`animate-spin ${className}`} style={{ width: size, height: size }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg></div>);

export default Profile;
