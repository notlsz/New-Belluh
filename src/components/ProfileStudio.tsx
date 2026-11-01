// Your profile, made by you, after amo: a banner (a color, a pattern or a photo), any background, your own colors and
// name style, an avatar effect like Discord's (hearts circling, sparkles, a flower crown, fire, snow...), stickers you
// drop anywhere and drag around (3D stickers, or photos from your memories), and blocks you arrange like iPhone apps:
// the song you can't stop playing (Spotify and Apple Music links play right there), the book you're reading, photos,
// voice notes, words, links. Everything saves as you go.
//
// The designers' brief: Chesky, make it feel like a home you decorate, not a form. Jobs, one Customize button, one
// panel, everything live, no save button. Paul Smith, let people be loud: any color, stickers at any angle. Rams, the
// default stays calm and every addition is a deliberate choice. Ive, the details move: effects breathe, stickers lift
// when you touch them, tiles wiggle while you arrange them.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useUi } from '../i18n';
import studioUi from '../i18n/ui/studio';
import { Emoji, emojiSrc } from '../lib/emoji3d';
import DragBento, { type BentoItem } from './DragBento';
import MediaBlock from './MediaBlocks';
import FreeCanvas, { FONT, INK } from './FreeCanvas';
import FaceRecorder, { FaceSprite } from './FaceRecorder';
import { ShapeSvg } from './FreeCanvas';
import { Decoration, ProfileEffect, InkName, NamePad, DECOS, PFX, FX_CSS, isDeco } from './ProfileFx';
import { uploadPrivate, resolveMedia, isPrivateRef } from '../services/media';
import { loadLook, saveLook, musicEmbed, DEFAULT_LOOK, type Look, type Block, type BlockType, type Effect, type Pattern, type NameFont, type Layer } from '../services/look';

const SWATCHES = ['#fdfbfb', '#fde7f3', '#ffd6e7', '#fff1d6', '#ffe48f', '#e3f5dc', '#c9f0b4', '#cde9f2', '#9bbecb', '#dccbff', '#ede7fb', '#ffd6a8', '#f6b3cc', '#5e9db3', '#4f5ff0', '#0f172a'];
const BLOCK_COLORS = ['#ffffff', '#fde7f3', '#e1f1f7', '#fff1d6', '#ede7fb', '#e3f5dc', '#ffe4d6', '#0f172a'];
const STICKERS = ['💗', '✨', '🌸', '🔥', '⭐', '🌈', '🍓', '🎀', '🌙', '🍒', '🧸', '🦄', '🌻', '🍰', '👑', '🎧', '🍀', '🦋', '🫧', '❄️', '🪩', '💌', '🐶', '🐱', '☕', '🍜', '🎬', '📷', '🌊', '⚡'];
const EFFECTS: { id: Effect; e: string }[] = [
  { id: 'none', e: '🚫' }, { id: 'glow', e: '💡' }, { id: 'hearts', e: '💗' }, { id: 'sparkles', e: '✨' }, { id: 'flowers', e: '🌸' },
  { id: 'fire', e: '🔥' }, { id: 'stars', e: '⭐' }, { id: 'snow', e: '❄️' }, { id: 'bubbles', e: '🫧' }, { id: 'butterflies', e: '🦋' },
];
// Patterns are one soft white over the banner's own color: a texture, not a second color
const PATTERN: Record<Pattern, string> = {
  none: 'none',
  dots: 'radial-gradient(rgba(255,255,255,.5) 2.5px, transparent 3px) 0 0 / 22px 22px',
  hearts: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34"><path d="M17 26s-8-5-8-10.5A4.5 4.5 0 0 1 17 13a4.5 4.5 0 0 1 8 2.5C25 21 17 26 17 26z" fill="rgba(255,255,255,0.45)"/></svg>')}") 0 0 / 34px 34px`,
  stars: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><path d="M20 9l3 7 7 .6-5.4 4.6 1.7 7L20 24.4 13.7 28.2l1.7-7L10 16.6l7-.6z" fill="rgba(255,255,255,0.45)"/></svg>')}") 0 0 / 40px 40px`,
  checks: 'conic-gradient(rgba(255,255,255,.35) 25%, transparent 0 50%, rgba(255,255,255,.35) 0 75%, transparent 0) 0 0 / 32px 32px',
  stripes: 'repeating-linear-gradient(-45deg, rgba(255,255,255,.32) 0 10px, transparent 10px 22px)',
};
const uid = () => Math.random().toString(36).slice(2, 10);
const safeUrl = (u: string) => /^https?:\/\//i.test(u.trim()) ? u.trim() : '';

// Discord-style effects around the avatar, drawn with the 3D emoji
const AvatarFx: React.FC<{ effect: Effect; accent: string }> = ({ effect, accent }) => {
  if (effect === 'none') return null;
  if (isDeco(effect)) return <Decoration effect={effect} accent={accent} />;
  if (effect === 'glow') return <span aria-hidden className="pfx-glow absolute -inset-2 rounded-full pointer-events-none" style={{ boxShadow: `0 0 0 4px ${accent}, 0 0 28px 8px ${accent}` }} />;
  const e = EFFECTS.find(x => x.id === effect)!.e;
  if (effect === 'flowers') return <span aria-hidden className="absolute inset-0 pointer-events-none">{[-70, -35, 0, 35, 70].map((a, i) => <span key={i} className="pfx-bob absolute left-1/2 top-1/2" style={{ transform: `rotate(${a}deg) translateY(-62px) rotate(${-a}deg)`, marginLeft: -13, marginTop: -13, animationDelay: `${-i * 0.3}s` }}><Emoji e={e} size={26} /></span>)}</span>;
  if (effect === 'fire') return <span aria-hidden className="absolute inset-0 pointer-events-none">{[110, 135, 160, 180, 200, 225, 250].map((a, i) => <span key={i} className="pfx-flicker absolute left-1/2 top-1/2" style={{ transform: `rotate(${a}deg) translateY(-60px) rotate(${-a}deg)`, marginLeft: -12, marginTop: -12, animationDelay: `${-i * 0.13}s` }}><Emoji e={e} size={24} /></span>)}</span>;
  if (effect === 'snow') return <span aria-hidden className="absolute -inset-8 overflow-hidden rounded-full pointer-events-none">{[8, 26, 44, 62, 80, 92].map((l, i) => <span key={i} className="pfx-fall absolute -top-6" style={{ left: `${l}%`, animationDelay: `${-i * 0.7}s`, animationDuration: `${3.2 + (i % 3)}s` }}><Emoji e={e} size={14 + (i % 3) * 4} /></span>)}</span>;
  if (effect === 'sparkles') return <span aria-hidden className="absolute inset-0 pointer-events-none">{[20, 95, 160, 230, 300].map((a, i) => <span key={i} className="pfx-twinkle absolute left-1/2 top-1/2" style={{ transform: `rotate(${a}deg) translateY(-${58 + (i % 2) * 8}px) rotate(${-a}deg)`, marginLeft: -11, marginTop: -11, animationDelay: `${-i * 0.4}s` }}><Emoji e={e} size={22} /></span>)}</span>;
  // Hearts, stars, bubbles, butterflies: a little ring of them, slowly circling
  return <span aria-hidden className="pfx-orbit absolute inset-0 pointer-events-none">{[0, 60, 120, 180, 240, 300].map((a, i) => <span key={i} className="absolute left-1/2 top-1/2" style={{ transform: `rotate(${a}deg) translateY(-74px) rotate(${-a}deg)`, marginLeft: -11, marginTop: -11 }}><Emoji e={e} size={22} /></span>)}</span>;
};

const ProfileStudio: React.FC<{ userId: string; name: string; avatar: string; subtitle: string; memoryPhotos: string[]; onEditProfile: () => void; editLabel: string }> = ({ userId, name, avatar, subtitle, memoryPhotos, onEditProfile, editLabel }) => {
  const T = useUi(studioUi);
  const [look, setLook] = useState<Look>(DEFAULT_LOOK);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<keyof typeof T.tabs>('look');
  const [links, setLinks] = useState<Map<string, string>>(new Map());
  const [savedAt, setSavedAt] = useState(0);
  const board = useRef<HTMLDivElement>(null);
  const [boardH, setBoardH] = useState(0);
  const [mini, setMini] = useState(false);
  const [pad, setPad] = useState(false);
  const [rec, setRec] = useState(false);
  const [pen, setPen] = useState({ on: false, color: '#e5484d', w: 6 });
  useEffect(() => { const el = board.current; if (!el) return; const ro = new ResizeObserver(() => setBoardH(el.offsetHeight)); ro.observe(el); return () => ro.disconnect(); }, []);
  useEffect(() => { if (!editing) setPen(p => ({ ...p, on: false })); }, [editing]);
  // Editing starts with the top of your profile in view, above the panel
  useEffect(() => { if (editing && board.current) window.scrollTo({ top: Math.max(0, window.scrollY + board.current.getBoundingClientRect().top - 24), behavior: 'smooth' }); }, [editing]);
  // A new block slides into view above the panel
  const blockCount = useRef(look.blocks.length);
  useEffect(() => {
    if (editing && look.blocks.length > blockCount.current) setTimeout(() => { const tiles = board.current?.querySelectorAll('[data-tile]'); const el = tiles?.[tiles.length - 1] as HTMLElement | undefined; if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 90, behavior: 'smooth' }); }, 60);
    blockCount.current = look.blocks.length;
  }, [look.blocks.length]);

  useEffect(() => { loadLook(userId).then(l => { setLook(l); setLoaded(true); }); }, [userId]);
  // Private photos and voice notes get short-lived links to show them
  const refs = useMemo(() => [look.bannerPhoto, look.bgPhoto, ...look.layers.map(s => s.photo), ...look.layers.map(s => s.face?.ref), look.face?.ref, ...look.blocks.map(b => b.data.ref)].filter(isPrivateRef), [look]);
  useEffect(() => { const missing = refs.filter(r => !links.has(r)); if (missing.length) resolveMedia(missing).then(m => setLinks(prev => new Map([...prev, ...m]))); }, [refs.join('|')]);
  const show = (u?: string | null) => (u ? (isPrivateRef(u) ? links.get(u) : u) : undefined);

  // Save as they go
  useEffect(() => {
    if (!loaded || !editing) return;
    const t = setTimeout(() => saveLook(userId, look).then(ok => ok && setSavedAt(Date.now())), 700);
    return () => clearTimeout(t);
  }, [look]);
  useEffect(() => {
    if ((look.nameFont !== 'script' && !look.layers.some(l => l.k === 'text')) || document.getElementById('caveat-font')) return;
    const l = document.createElement('link'); l.id = 'caveat-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap'; document.head.appendChild(l);
  }, [look.nameFont, look.layers.length]);

  const set = (p: Partial<Look>) => setLook(l => ({ ...l, ...p }));
  const setBlock = (id: string, p: Partial<Block>) => setLook(l => ({ ...l, blocks: l.blocks.map(b => b.id === id ? { ...b, ...p, data: { ...b.data, ...(p.data ?? {}) } } : b) }));
  const addBlock = (type: BlockType) => setLook(l => ({ ...l, blocks: [...l.blocks, { id: uid(), type, w: type === 'text' || type === 'voice' ? 4 : type === 'music' || type === 'movie' || type === 'book' ? 3 : 2, h: type === 'photo' || type === 'book' || type === 'movie' || type === 'music' ? 2 : 1, color: '#ffffff', data: {} }] }));
  const upload = async (file: File, kind: 'photos' | 'voice' = 'photos') => {
    const ext = (file.name.split('.').pop() || (kind === 'voice' ? 'webm' : 'jpg')).toLowerCase();
    const ref = await uploadPrivate(kind, file, ext, file.type || (kind === 'voice' ? 'audio/webm' : 'image/jpeg'));
    if (ref && isPrivateRef(ref)) { const m = await resolveMedia([ref]); setLinks(prev => new Map([...prev, ...m])); }
    return ref;
  };
  const pick = (cb: (f: File) => void, accept = 'image/*') => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => i.files?.[0] && cb(i.files[0]); i.click(); };

  // Anything on the canvas lands in view, a little off-center and tilted, on top of everything else
  const setLayers = (fn: (l: Layer[]) => Layer[]) => setLook(l => ({ ...l, layers: fn(l.layers) }));
  const addLayer = (p: Partial<Layer>) => setLook(l => {
    const r = board.current?.getBoundingClientRect(), h = r?.height ?? 600;
    const y = Math.round(Math.max(60, Math.min(h - 60, (window.innerHeight * 0.32) - (r?.top ?? 0) + Math.random() * 80)));
    const z = Math.max(0, ...l.layers.map(x => x.z)) + 1;
    return { ...l, layers: [...l.layers, { id: uid(), k: 'emoji' as const, x: 12 + Math.random() * 76, y, r: Math.round(Math.random() * 24 - 12), s: 1, z, ...p }].slice(-120) };
  });
  const blank = () => { if (!window.confirm(T.cv.blankSure)) return; set({ blank: true, bannerPhoto: null, bannerPattern: 'none', bannerColor: '#ffffff', bg: '#ffffff', bgPhoto: null, effect: 'none', bio: '', blocks: [], stickers: [], layers: [], extra: 520, nameFont: look.nameFont }); };

  const Field = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`w-full h-10 rounded-xl bg-white/85 px-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9bbecb] ${p.className ?? ''}`} />;

  const blockBody = (b: Block) => {
    const dark = b.color === '#0f172a', ink = dark ? 'text-white' : 'text-slate-900', sub = dark ? 'text-white/70' : 'text-slate-500';
    const label = (e: string) => <p className={`text-[12px] font-bold uppercase tracking-wide ${sub} inline-flex items-center gap-1.5`}><Emoji e={e} size={16} />{T.blocks[b.type]}</p>;
    if (b.type === 'music' && b.data.url && !b.data.title && musicEmbed(b.data.url)) {
      const emb = musicEmbed(b.data.url)!;
      return <div className="h-full flex flex-col gap-2">{label('🎧')}<iframe title={T.blocks.music} src={emb.src} height={Math.min(emb.h, 232)} className="w-full rounded-xl border-0" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" /></div>;
    }
    if (b.type === 'music' || b.type === 'movie' || b.type === 'book') {
      const kind = b.type;
      return <MediaBlock kind={kind} data={b.data} editing={editing} dark={dark} S={T.media}
        label={label(kind === 'music' ? '🎧' : kind === 'movie' ? '🍿' : '📚')}
        placeholder={kind === 'music' ? T.media.songPh : kind === 'movie' ? T.fx.moviePh : T.bookPh}
        set={d => setBlock(b.id, { data: d })} />;
    }
    if (b.type === 'photo') {
      const src = show(b.data.ref);
      return (
        <div className="absolute inset-0">
          {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Emoji e="📸" size={44} /></div>}
          {editing && <button type="button" onClick={() => pick(async f => { const ref = await upload(f); if (ref) setBlock(b.id, { data: { ref } }); })} className="absolute left-3 bottom-3 h-9 px-3.5 rounded-full bg-white/90 text-[13px] font-bold text-slate-800">{T.upload}</button>}
        </div>
      );
    }
    if (b.type === 'voice') return <VoiceBlock b={b} editing={editing} label={label('🎙️')} src={show(b.data.ref)} T={T} onRef={async blob => { const ref = await upload(new File([blob], 'voice.webm', { type: blob.type || 'audio/webm' }), 'voice'); if (ref) setBlock(b.id, { data: { ref } }); }} />;
    if (b.type === 'link') {
      const url = safeUrl(b.data.url || '');
      return (
        <div className="h-full flex flex-col gap-2">
          {label('🔗')}
          {editing ? <div className="space-y-1.5"><Field value={b.data.label ?? ''} onChange={e => setBlock(b.id, { data: { label: e.target.value.slice(0, 60) } })} placeholder={T.linkLabelPh} /><Field value={b.data.url ?? ''} onChange={e => setBlock(b.id, { data: { url: e.target.value.slice(0, 300) } })} placeholder="https://" /></div>
            : url && <a href={url} target="_blank" rel="noopener noreferrer" className={`mt-auto font-serif text-xl leading-snug underline decoration-2 underline-offset-4 ${ink}`}>{b.data.label || new URL(url).hostname}</a>}
        </div>
      );
    }
    return (
      <div className="h-full flex flex-col gap-2">
        {label('💭')}
        {editing ? <textarea value={b.data.text ?? ''} onChange={e => setBlock(b.id, { data: { text: e.target.value.slice(0, 400) } })} placeholder={T.textPh} rows={3} className="w-full flex-1 resize-none rounded-xl bg-white/85 px-3 py-2 font-serif text-[16px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9bbecb]" />
          : <p className={`font-serif text-[1.25rem] leading-snug ${ink} whitespace-pre-line [text-wrap:pretty]`}>{b.data.text}</p>}
      </div>
    );
  };

  const filled = (b: Block) => b.type === 'music' ? !!(b.data.url || b.data.title) : b.type === 'book' || b.type === 'movie' ? !!b.data.title : b.type === 'photo' || b.type === 'voice' ? !!b.data.ref : b.type === 'link' ? !!safeUrl(b.data.url || '') : !!b.data.text?.trim();
  const items: BentoItem[] = look.blocks.filter(b => editing || filled(b)).map(b => ({
    id: b.id, w: b.w, h: b.h, node: (
      <div className={`relative h-full rounded-[1.75rem] p-5 overflow-hidden ${b.color === '#ffffff' ? 'border border-slate-100 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.25)]' : ''}`} style={{ background: b.color }}>
        {blockBody(b)}
        {editing && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10">
            <div className="h-8 px-1.5 rounded-full bg-white/90 flex items-center gap-1">
              {BLOCK_COLORS.map(c => <button key={c} type="button" onClick={() => setBlock(b.id, { color: c })} aria-label={c} className={`w-5 h-5 rounded-full border ${b.color === c ? 'ring-2 ring-slate-900 ring-offset-1' : 'border-slate-200'}`} style={{ background: c }} />)}
            </div>
            <button type="button" onClick={() => set({ blocks: look.blocks.filter(x => x.id !== b.id) })} aria-label={T.remove} className="w-8 h-8 rounded-full bg-white/90 text-slate-500 hover:text-slate-900 font-bold">✕&#xFE0E;</button>
          </div>
        )}
      </div>
    ),
  }));

  const bannerPhoto = show(look.bannerPhoto), bgPhoto = show(look.bgPhoto);
  const Swatches = ({ value, onPick, list = SWATCHES }: { value: string; onPick: (c: string) => void; list?: string[] }) => (
    <div className="flex flex-wrap items-center gap-2">
      {list.map(c => <button key={c} type="button" onClick={() => onPick(c)} aria-label={c} className={`w-8 h-8 rounded-full border ${value === c ? 'ring-2 ring-slate-900 ring-offset-2' : 'border-slate-200'}`} style={{ background: c }} />)}
      <label className="h-8 px-2.5 rounded-full bg-slate-100 text-[12px] font-bold text-slate-600 inline-flex items-center gap-1.5 cursor-pointer"><input type="color" value={value} onChange={e => onPick(e.target.value)} className="w-5 h-5 rounded-full border-0 p-0 bg-transparent cursor-pointer" />{T.custom}</label>
    </div>
  );
  const H = ({ children }: { children: React.ReactNode }) => <p className="mt-4 first:mt-0 mb-2 text-[12px] font-bold uppercase tracking-wide text-slate-400">{children}</p>;

  return (
    <div className={`relative -mx-2 md:mx-0 mb-12 rounded-[2rem] p-2 md:p-3 transition-colors ${editing ? 'pb-[52vh] md:pb-[48vh]' : ''}`} style={{ background: bgPhoto ? `center / cover no-repeat url("${bgPhoto}")` : look.bg }}>
      <style>{FX_CSS}</style>
      <ProfileEffect fx={look.pfx} accent={look.accent} />
      <style>{`
        @keyframes pfx-orbit { to { transform: rotate(360deg); } } .pfx-orbit { animation: pfx-orbit 14s linear infinite; }
        @keyframes pfx-glow { 0%, 100% { opacity: .55; } 50% { opacity: 1; } } .pfx-glow { animation: pfx-glow 2.4s ease-in-out infinite; }
        @keyframes pfx-twinkle { 0%, 100% { opacity: .2; scale: .6; } 50% { opacity: 1; scale: 1.1; } } .pfx-twinkle { animation: pfx-twinkle 1.8s ease-in-out infinite; }
        @keyframes pfx-bob { 0%, 100% { translate: 0 0; } 50% { translate: 0 -3px; } } .pfx-bob { animation: pfx-bob 2.6s ease-in-out infinite; }
        @keyframes pfx-flicker { 0%, 100% { scale: 1; } 50% { scale: 1.25 1.4; } } .pfx-flicker { animation: pfx-flicker .5s ease-in-out infinite; transform-origin: bottom; }
        @keyframes pfx-fall { from { translate: 0 -10px; } to { translate: 12px 200px; } } .pfx-fall { animation: pfx-fall 4s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .pfx-orbit, .pfx-glow, .pfx-twinkle, .pfx-bob, .pfx-flicker, .pfx-fall { animation: none; } }
      `}</style>
      <div ref={board} className="relative rounded-[1.75rem]" style={{ paddingBottom: look.extra, minHeight: look.bare ? 1100 : undefined, background: look.bare && editing ? 'radial-gradient(#d7dee6 1.2px, transparent 1.4px) 0 0 / 22px 22px' : undefined }}>
        <button type="button" onClick={() => { setEditing(v => !v); if (editing) saveLook(userId, look); }}
          className="absolute top-3 right-3 z-40 h-10 px-4 rounded-full bg-white/90 backdrop-blur text-[14px] font-bold text-slate-900 inline-flex items-center gap-2 shadow-[0_8px_20px_-10px_rgba(15,23,42,0.5)]">
          {editing ? <>✓&#xFE0E; {T.done}</> : <><Emoji e="🎨" size={18} />{T.customize}</>}
        </button>
        {/* Banner */}
        {!look.blank && !look.bare && <div className="relative h-40 md:h-56 rounded-[1.75rem] overflow-hidden" style={{ background: look.bannerColor }}>
          {bannerPhoto ? <img src={bannerPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0" style={{ background: PATTERN[look.bannerPattern] }} />}
        </div>}
        {/* Avatar with its effect, name, a line about you */}
        {!look.bare && <div className={`flex flex-col items-center relative z-10 ${look.blank ? 'pt-16' : '-mt-14 md:-mt-16'}`}>
          <div className="relative w-28 h-28 md:w-32 md:h-32">
            {look.facePfp && look.face && show(look.face.ref)
              ? <button type="button" onClick={() => editing ? setRec(true) : onEditProfile()} aria-label={editLabel} className="relative block w-full h-full"><FaceSprite src={show(look.face.ref)!} face={look.face} size={160} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[56%]" style={{ filter: 'drop-shadow(4px 0 0 #fff) drop-shadow(-4px 0 0 #fff) drop-shadow(0 4px 0 #fff) drop-shadow(0 -4px 0 #fff) drop-shadow(0 14px 18px rgba(15,23,42,.28))' }} /></button>
              : <button type="button" onClick={onEditProfile} aria-label={editLabel} className="relative block w-full h-full rounded-full ring-[5px] ring-white overflow-hidden bg-[#eef7fa] shadow-[0_18px_40px_-18px_rgba(15,23,42,0.45)]"><img src={avatar} alt={name} className="w-full h-full object-cover" /></button>}
            <AvatarFx effect={look.effect} accent={look.accent} />
          </div>
          {look.nameInk?.strokes.length
            ? <h2 className="mt-4 flex justify-center"><InkName ink={look.nameInk} label={name} /></h2>
            : <h2 className="mt-5 text-4xl md:text-5xl tracking-tight text-center px-4 leading-tight" style={{ ...FONT[look.nameFont], color: look.nameColor }}>{name}</h2>}
          {editing
            ? <input value={look.bio} onChange={e => set({ bio: e.target.value.slice(0, 140) })} placeholder={T.bioPh} aria-label={T.bioPh} className="mt-3 w-full max-w-md h-11 rounded-full bg-white/85 px-4 text-center text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9bbecb]" />
            : look.bio && <p className="mt-2 max-w-md text-center text-[16px] leading-relaxed" style={{ color: look.nameColor, opacity: 0.75 }}>{look.bio}</p>}
          <p className="mt-2 text-sm font-semibold" style={{ color: look.accent }}>{subtitle}</p>
        </div>}

      {/* Blocks, arranged like iPhone apps */}
      {!look.bare && <div className="mt-8 px-1 md:px-2">
        {items.length > 0
          ? <DragBento items={items} editing={editing} resizeLabel={T.customize} onMove={(d, o) => setLook(l => { const ids = l.blocks.map(b => b.id); const from = ids.indexOf(d), to = ids.indexOf(o); const next = [...l.blocks]; const [x] = next.splice(from, 1); next.splice(to, 0, x); return { ...l, blocks: next }; })} onSize={(id, w, h) => setBlock(id, { w, h })} />
          : !look.blank && <button type="button" onClick={() => { setEditing(true); setTab('add'); }} className="w-full rounded-[1.75rem] border-2 border-dashed border-slate-200 bg-white/60 p-6 text-center text-[15px] text-slate-500 hover:border-slate-300">{T.empty}</button>}
      </div>}
        <FreeCanvas layers={look.layers} editing={editing} height={boardH} pen={pen} onChange={setLayers} show={u => show(u)} S={{ ...T.cv, dup: T.face.dup, opacity: T.face.opacity }} />
      </div>

      {/* The studio: one panel, everything live */}
      {rec && <FaceRecorder S={T.face} onClose={() => setRec(false)} resolve={u => show(u)}
        upload={async (b, ext, type) => { const ref = await uploadPrivate('photos', b, ext, type); if (ref && isPrivateRef(ref)) { const m = await resolveMedia([ref]); setLinks(prev => new Map([...prev, ...m])); } return ref; }}
        onDone={(face, as) => { setRec(false); if (as === 'pfp') set({ face, facePfp: true }); else addLayer({ k: 'face', face, s: 1, r: 0 }); }} />}
      {pad && <NamePad color={look.nameColor} initial={look.nameInk} S={T.fx} onClose={() => setPad(false)} onSave={ink => { set({ nameInk: ink }); setPad(false); }} />}
      {/* Drawing takes the whole screen: just the pen, its colors and sizes */}
      {editing && pen.on && (
        <div data-ltool className="fixed z-[60] inset-x-3 bottom-[100px] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-6 rounded-[1.5rem] bg-white shadow-[0_30px_70px_-20px_rgba(15,23,42,0.45)] border border-slate-100 p-2 flex items-center gap-2 overflow-x-auto [scrollbar-width:none]">
          {INK.slice(0, 9).map(c => <button key={c} type="button" onClick={() => setPen(p => ({ ...p, color: c }))} aria-label={c} className={`shrink-0 w-7 h-7 rounded-full border ${pen.color === c ? 'ring-2 ring-slate-900 ring-offset-2' : 'border-slate-200'}`} style={{ background: c }} />)}
          {[3, 8, 18].map(w => <button key={w} type="button" onClick={() => setPen(p => ({ ...p, w }))} aria-label={`${w}`} className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${pen.w === w ? 'ring-2 ring-slate-900' : ''}`}><span className="rounded-full" style={{ width: w + 2, height: w + 2, background: pen.color }} /></button>)}
          <button type="button" onClick={() => setPen(p => ({ ...p, on: false }))} className="shrink-0 ml-auto h-10 px-4 rounded-full bg-slate-900 text-white text-[14px] font-bold">{T.cv.stopDraw}</button>
        </div>
      )}
      {editing && !pen.on && (
        <div className="fixed z-[60] inset-x-3 bottom-[100px] md:inset-x-auto md:left-[calc(50%+var(--sidebar-w,0px)/2)] md:-translate-x-1/2 md:bottom-6 md:w-[min(760px,calc(100vw-var(--sidebar-w,0px)-48px))] max-h-[48vh] md:max-h-[46vh] flex flex-col rounded-[2rem] bg-white shadow-[0_30px_70px_-20px_rgba(15,23,42,0.45)] border border-slate-100 overflow-hidden">
          <div className="shrink-0 p-2.5 flex md:justify-center gap-1 overflow-x-auto [scrollbar-width:none]">
            {(Object.keys(T.tabs) as (keyof typeof T.tabs)[]).map(k => (
              <button key={k} type="button" onClick={() => { setMini(m => tab === k ? !m : false); setTab(k); }} className={`shrink-0 h-10 md:h-11 px-4 md:px-5 rounded-full text-[14px] md:text-[15px] font-bold ${tab === k ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{T.tabs[k]}</button>
            ))}
            <span className={`ml-auto shrink-0 self-center pr-2 text-[12px] font-semibold text-emerald-600 transition-opacity ${Date.now() - savedAt < 2500 ? 'opacity-100' : 'opacity-0'}`}>{T.saved}</span>
          </div>
          {!mini && <div className="flex-1 overflow-y-auto px-4 pb-4">
            {tab === 'look' && <>
              <H>{T.face.pfp}</H>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => set({ facePfp: false })} className={`h-14 rounded-2xl inline-flex items-center justify-center gap-2 text-[15px] font-bold ${!look.facePfp ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`}><Emoji e="🖼️" size={22} />{T.face.photo}</button>
                <button type="button" onClick={() => look.face ? set({ facePfp: true }) : setRec(true)} className={`h-14 rounded-2xl inline-flex items-center justify-center gap-2 text-[15px] font-bold ${look.facePfp ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`}><Emoji e="🤪" size={22} />{T.face.yourFace}</button>
              </div>
              <button type="button" onClick={() => setRec(true)} className="mt-2 w-full h-11 rounded-2xl bg-slate-100 text-[14px] font-bold text-slate-700 inline-flex items-center justify-center gap-2"><Emoji e="📸" size={18} />{T.face.record}</button>
              <H>{T.background}</H><Swatches value={look.bg} onPick={c => set({ bg: c, bgPhoto: null })} />
              <div className="mt-2 flex gap-2"><button type="button" onClick={() => pick(async f => { const ref = await upload(f); if (ref) set({ bgPhoto: ref }); })} className="h-9 px-3.5 rounded-full bg-slate-100 text-[13px] font-bold text-slate-700 inline-flex items-center gap-1.5"><Emoji e="🖼️" size={16} />{T.upload}</button>{look.bgPhoto && <button type="button" onClick={() => set({ bgPhoto: null })} className="h-9 px-3 rounded-full text-[13px] font-semibold text-slate-500">{T.remove}</button>}</div>
              <H>{T.accent}</H><Swatches value={look.accent} onPick={c => set({ accent: c })} list={INK} />
              <H>{T.nameColor}</H><Swatches value={look.nameColor} onPick={c => set({ nameColor: c })} list={INK} />
              <H>{T.font}</H>
              <div className="grid grid-cols-2 gap-2">{(Object.keys(T.fonts) as NameFont[]).map(k => <button key={k} type="button" onClick={() => set({ nameFont: k, nameInk: null })} className={`h-12 rounded-2xl text-xl ${look.nameFont === k && !look.nameInk ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`} style={FONT[k]}>{T.fonts[k]}</button>)}</div>
              <button type="button" onClick={() => setPad(true)} className={`mt-2 w-full h-12 rounded-2xl text-[15px] font-bold inline-flex items-center justify-center gap-2 ${look.nameInk ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`}><Emoji e="✍️" size={22} />{T.fx.writeName}</button>
            </>}
            {tab === 'banner' && <>
              <H>{T.background}</H><Swatches value={look.bannerColor} onPick={c => set({ bannerColor: c, bannerPhoto: null })} />
              <H>{T.pattern}</H>
              <div className="grid grid-cols-3 gap-2">{(Object.keys(T.patterns) as Pattern[]).map(k => <button key={k} type="button" onClick={() => set({ bannerPattern: k, bannerPhoto: null })} className={`h-14 rounded-2xl text-[12px] font-bold flex items-end p-2 ${look.bannerPattern === k && !look.bannerPhoto ? 'ring-2 ring-slate-900 ring-offset-2' : ''}`} style={{ background: `${PATTERN[k] === 'none' ? '' : PATTERN[k] + ', '}${look.bannerColor}` }}><span className="px-1.5 rounded bg-white/85 text-slate-800">{T.patterns[k]}</span></button>)}</div>
              <H>{T.photo}</H>
              <div className="flex gap-2"><button type="button" onClick={() => pick(async f => { const ref = await upload(f); if (ref) set({ bannerPhoto: ref }); })} className="h-9 px-3.5 rounded-full bg-slate-100 text-[13px] font-bold text-slate-700 inline-flex items-center gap-1.5"><Emoji e="🖼️" size={16} />{T.upload}</button>{look.bannerPhoto && <button type="button" onClick={() => set({ bannerPhoto: null })} className="h-9 px-3 rounded-full text-[13px] font-semibold text-slate-500">{T.remove}</button>}</div>
            </>}
            {tab === 'effects' && <>
              <H>{T.fx.decoTitle}</H>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">{[...EFFECTS, ...DECOS].map(x => <button key={x.id} type="button" onClick={() => set({ effect: x.id })} className={`h-20 rounded-2xl flex flex-col items-center justify-center gap-1 text-[12px] font-bold ${look.effect === x.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}><Emoji e={x.e} size={28} />{(T.effects as Record<string, string>)[x.id] ?? (T.fx.deco as Record<string, string>)[x.id]}</button>)}</div>
              <H>{T.fx.pfxTitle}</H>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">{PFX.map(x => <button key={x.id} type="button" onClick={() => set({ pfx: x.id })} className={`h-20 rounded-2xl flex flex-col items-center justify-center gap-1 text-[12px] font-bold ${look.pfx === x.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}><Emoji e={x.e} size={28} />{T.fx.pfx[x.id]}</button>)}</div>
            </>}
            {tab === 'stickers' && <>
              <p className="pt-1 text-[13px] text-slate-500">{T.cv.hint}</p>
              <div className="mt-3 grid grid-cols-6 gap-1.5">{STICKERS.map(e => <button key={e} type="button" onClick={() => addLayer({ k: 'emoji', e })} className="aspect-square rounded-xl hover:bg-slate-100 flex items-center justify-center"><Emoji e={e} size={32} /></button>)}</div>
              {memoryPhotos.length > 0 && <><H>{T.fromMemories}</H><div className="grid grid-cols-4 gap-2">{memoryPhotos.slice(0, 12).map(p => <button key={p} type="button" onClick={() => addLayer({ k: 'photo', photo: p })} className="aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm"><img src={show(p) ?? p} alt="" className="w-full h-full object-cover" /></button>)}</div></>}
            </>}
            {tab === 'canvas' && <>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button type="button" onClick={() => setRec(true)} className="h-14 rounded-2xl bg-slate-900 text-white flex items-center gap-2.5 px-3.5 text-[14px] font-bold"><Emoji e="🤪" size={24} />{T.face.record}</button>
                <button type="button" onClick={() => pick(async f => { if (f.size > 40e6) return; const ext = (f.name.split('.').pop() || 'mp4').toLowerCase(); const ref = await uploadPrivate('photos', f, ext, f.type || 'video/mp4'); if (ref) { if (isPrivateRef(ref)) { const m = await resolveMedia([ref]); setLinks(prev => new Map([...prev, ...m])); } addLayer({ k: 'video', photo: ref }); } }, 'video/*')} className="h-14 rounded-2xl bg-slate-100 flex items-center gap-2.5 px-3.5 text-[14px] font-bold text-slate-800"><Emoji e="🎬" size={24} />{T.face.video}</button>
              </div>
              <H>{T.face.shapes}</H>
              <div className="grid grid-cols-6 gap-1.5 mb-1">{(['rect', 'ellipse', 'heart', 'star', 'line', 'arrow'] as const).map(sh => <button key={sh} type="button" onClick={() => addLayer({ k: 'shape', shape: sh, color: look.accent, sw: 120, sh: sh === 'line' || sh === 'arrow' ? 40 : 120 })} aria-label={sh} className="aspect-square rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><ShapeSvg shape={sh} fill="#0f172a" w={28} h={28} /></button>)}</div>
              <p className="pt-1 text-[13px] text-slate-500">{T.cv.hint}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setPen(p => ({ ...p, on: !p.on }))} className={`h-14 rounded-2xl flex items-center gap-2.5 px-3.5 text-[14px] font-bold ${pen.on ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`}><Emoji e="🖍️" size={24} />{pen.on ? T.cv.stopDraw : T.cv.draw}</button>
                <button type="button" onClick={() => { setPen(p => ({ ...p, on: false })); addLayer({ k: 'text', text: '', font: 'script', color: look.nameColor, s: 1, r: -4 }); }} className="h-14 rounded-2xl bg-slate-100 flex items-center gap-2.5 px-3.5 text-[14px] font-bold text-slate-800"><Emoji e="✍️" size={24} />{T.cv.text}</button>
                <button type="button" onClick={() => pick(async f => { const ref = await upload(f); if (ref) addLayer({ k: 'photo', photo: ref }); })} className="h-14 rounded-2xl bg-slate-100 flex items-center gap-2.5 px-3.5 text-[14px] font-bold text-slate-800"><Emoji e="📸" size={24} />{T.cv.photo}</button>
                <button type="button" onClick={() => set({ extra: Math.min(3000, look.extra + 320) })} className="h-14 rounded-2xl bg-slate-100 flex items-center gap-2.5 px-3.5 text-[14px] font-bold text-slate-800"><Emoji e="↕️" size={24} />{T.cv.more}</button>
              </div>
              {pen.on && <div className="mt-3 rounded-2xl bg-slate-50 p-3 space-y-2.5">
                <div className="flex flex-wrap gap-1.5">{INK.map(c => <button key={c} type="button" onClick={() => setPen(p => ({ ...p, color: c }))} aria-label={c} className={`w-7 h-7 rounded-full border ${pen.color === c ? 'ring-2 ring-slate-900 ring-offset-2' : 'border-slate-200'}`} style={{ background: c }} />)}<label className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 cursor-pointer"><input type="color" value={pen.color} onChange={e => setPen(p => ({ ...p, color: e.target.value }))} className="w-10 h-10 -m-1.5 cursor-pointer" /></label></div>
                <div className="flex items-center gap-2">{[3, 6, 12, 24].map(w => <button key={w} type="button" onClick={() => setPen(p => ({ ...p, w }))} aria-label={`${w}`} className={`w-11 h-11 rounded-xl flex items-center justify-center ${pen.w === w ? 'bg-white ring-2 ring-slate-900' : 'bg-white'}`}><span className="rounded-full" style={{ width: w + 2, height: w + 2, background: pen.color }} /></button>)}</div>
              </div>}
              <div className="mt-4 flex flex-wrap gap-2">
                {look.layers.some(l => l.k === 'draw') && <button type="button" onClick={() => setLayers(ls => ls.filter(l => l.k !== 'draw'))} className="h-9 px-3.5 rounded-full bg-slate-100 text-[13px] font-bold text-slate-700">{T.cv.clearDraw}</button>}
                {look.extra > 0 && <button type="button" onClick={() => set({ extra: Math.max(0, look.extra - 320) })} className="h-9 px-3.5 rounded-full bg-slate-100 text-[13px] font-bold text-slate-700">−</button>}
                <button type="button" onClick={() => { if (window.confirm(T.face.bareSure)) set({ bare: true, blank: true, bannerPhoto: null, bg: '#ffffff', bgPhoto: null, effect: 'none', pfx: 'none', blocks: [], layers: [], extra: 0 }); }} className="h-9 px-3.5 rounded-full bg-slate-900 text-white text-[13px] font-bold inline-flex items-center gap-1.5"><Emoji e="🤍" size={16} />{T.face.bare}</button>
                {look.bare && <button type="button" onClick={() => set({ bare: false })} className="h-9 px-3.5 rounded-full bg-slate-100 text-[13px] font-bold text-slate-700">{T.face.pfp} +</button>}
                <button type="button" onClick={blank} className="h-9 px-3.5 rounded-full border-2 border-dashed border-slate-300 text-[13px] font-bold text-slate-700 inline-flex items-center gap-1.5"><Emoji e="🤍" size={16} />{T.cv.blank}</button>
                {look.blank && <button type="button" onClick={() => set({ blank: false, bannerPattern: 'dots', bannerColor: '#cde9f2' })} className="h-9 px-3.5 rounded-full bg-slate-100 text-[13px] font-bold text-slate-700">{T.tabs.banner} +</button>}
              </div>
            </>}
            {tab === 'add' && (
              <div className="grid grid-cols-2 gap-2 pt-1">{(Object.keys(T.blocks) as BlockType[]).map(k => <button key={k} type="button" onClick={() => addBlock(k)} className="h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center gap-3 px-4 text-[15px] font-bold text-slate-800"><Emoji e={{ music: '🎧', movie: '🍿', book: '📚', photo: '📸', voice: '🎙️', text: '💭', link: '🔗' }[k]} size={28} />{T.blocks[k]}</button>)}</div>
            )}
          </div>}
        </div>
      )}
    </div>
  );
};



const VoiceBlock: React.FC<{ b: Block; editing: boolean; label: React.ReactNode; src?: string; T: any; onRef: (blob: Blob) => void }> = ({ editing, label, src, T, onRef }) => {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream), parts: Blob[] = [];
      r.ondataavailable = e => parts.push(e.data);
      r.onstop = () => { stream.getTracks().forEach(t => t.stop()); onRef(new Blob(parts, { type: r.mimeType || 'audio/webm' })); setRec(null); };
      r.start(); setRec(r);
    } catch { /* no microphone */ }
  };
  return (
    <div className="h-full flex flex-col gap-2">
      {label}
      {src && <audio controls src={src} className="w-full mt-auto" />}
      {editing && <button type="button" onClick={() => rec ? rec.stop() : start()} className={`self-start h-10 px-4 rounded-full text-[14px] font-bold inline-flex items-center gap-2 ${rec ? 'bg-[#e5484d] text-white' : 'bg-white/90 text-slate-800'}`}><Emoji e="🎙️" size={18} />{rec ? `${T.stop} · ${T.listening}`.replace(' · ', ', ') : T.record}</button>}
    </div>
  );
};

export default ProfileStudio;
