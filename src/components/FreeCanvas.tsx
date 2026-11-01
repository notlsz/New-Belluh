// The free canvas over a profile, after amo: anything goes anywhere. Stickers, photos, your own words in any font and
// color, and drawings in your own hand. Drag to move; pinch with two fingers (or the buttons, or the mouse wheel) to
// resize and turn; double-tap to remove. x is % of the width so it holds across phone and laptop, y is px from the top.
import React, { useEffect, useRef, useState } from 'react';
import { Emoji } from '../lib/emoji3d';
import type { Layer, NameFont, Shape } from '../services/look';
import { FaceSprite } from './FaceRecorder';

export const FONT: Record<NameFont, React.CSSProperties> = {
  serif: { fontFamily: 'Merriweather, Georgia, serif' },
  rounded: { fontFamily: 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif', fontWeight: 800 },
  bold: { fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 900, letterSpacing: '-0.03em' },
  script: { fontFamily: '"Caveat", cursive', fontWeight: 700 },
};
export const INK = ['#0f172a', '#ffffff', '#8f2a66', '#2f6b80', '#5b3fa0', '#3d6b2c', '#8a5300', '#e5484d', '#4f5ff0', '#f59e0b', '#ec4899', '#10b981'];
const OUTLINE = 'drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 8px 10px rgba(15,23,42,.25))';
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const path = (pts: [number, number][]) => pts.length ? `M${pts.map(p => p.join(' ')).join(' L')}` : '';

export interface Strings { typeHere: string; bigger: string; smaller: string; turnL: string; turnR: string; front: string; del: string; pill: string; dup?: string; opacity?: string; fill?: string }

const SHAPE_PATH: Record<Shape, string> = {
  rect: 'M4 4h112v112H4z', ellipse: 'M60 4a56 56 0 1 0 0.01 0z', line: 'M6 60h108', arrow: 'M6 60h100M84 38l24 22-24 22',
  heart: 'M60 108S10 78 10 42a25 25 0 0 1 50-6 25 25 0 0 1 50 6c0 36-50 66-50 66z', star: 'M60 6l15 34 37 3-28 24 9 36-33-20-33 20 9-36L8 43l37-3z',
};
export const ShapeSvg: React.FC<{ shape: Shape; fill: string; w?: number; h?: number }> = ({ shape, fill, w = 120, h = 120 }) => {
  const stroke = shape === 'line' || shape === 'arrow';
  return <svg viewBox="0 0 120 120" width={w} height={h} preserveAspectRatio="none" className="block overflow-visible"><path d={SHAPE_PATH[shape]} fill={stroke ? 'none' : fill} stroke={stroke ? fill : 'none'} strokeWidth={stroke ? 8 : 0} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /></svg>;
};

const FreeCanvas: React.FC<{
  layers: Layer[]; editing: boolean; height: number; pen: { on: boolean; color: string; w: number };
  onChange: (fn: (l: Layer[]) => Layer[]) => void; show: (u?: string) => string | undefined; S: Strings;
}> = ({ layers, editing, height, pen, onChange, show, S }) => {
  const box = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [live, setLive] = useState<[number, number][] | null>(null);
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ id: string; x0: number; y0: number; lx: number; ly: number; d0: number; a0: number; s0: number; r0: number } | null>(null);

  useEffect(() => { if (!editing) setSel(null); }, [editing]);
  // Whatever was just added is picked up, ready to move, and words are ready to type
  const count = useRef(layers.length);
  useEffect(() => {
    const last = layers[layers.length - 1];
    if (editing && layers.length > count.current && last && last.k !== 'draw') setSel(last.id);
    count.current = layers.length;
  }, [layers.length]);
  // Tapping anywhere else lets go of the selected piece
  useEffect(() => {
    const off = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest?.('[data-layer], [data-ltool]')) setSel(null); };
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, []);

  const patch = (id: string, p: Partial<Layer>) => onChange(ls => ls.map(l => l.id === id ? { ...l, ...p } : l));
  const top = () => Math.max(0, ...layers.map(l => l.z)) + 1;
  const local = (cx: number, cy: number): [number, number] => { const r = box.current!.getBoundingClientRect(); return [clamp((cx - r.left) / r.width * 100, 0, 100), clamp(cy - r.top, 0, r.height)]; };

  const down = (l: Layer) => (e: React.PointerEvent<HTMLElement>) => {
    if (!editing || pen.on) return;
    e.preventDefault(); e.stopPropagation();
    const el = e.currentTarget as HTMLElement, now = Date.now();
    if (touches.current.size === 0 && now - Number(el.dataset.tap || 0) < 300) { onChange(ls => ls.filter(x => x.id !== l.id)); setSel(null); return; }
    el.dataset.tap = String(now);
    el.setPointerCapture(e.pointerId);
    touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setSel(l.id);
    const pts = [...touches.current.values()];
    const [a, b] = pts.length > 1 ? pts : [pts[0], pts[0]];
    gesture.current = { id: l.id, x0: a.x, y0: a.y, lx: l.x, ly: l.y, d0: Math.hypot(b.x - a.x, b.y - a.y) || 1, a0: Math.atan2(b.y - a.y, b.x - a.x), s0: l.s, r0: l.r };
  };
  const move = (e: React.PointerEvent<HTMLElement>) => {
    const g = gesture.current; if (!g || !touches.current.has(e.pointerId)) return;
    touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...touches.current.values()];
    if (pts.length > 1) {
      const [a, b] = pts;
      patch(g.id, { s: clamp(g.s0 * Math.hypot(b.x - a.x, b.y - a.y) / g.d0, 0.3, 6), r: Math.round(g.r0 + (Math.atan2(b.y - a.y, b.x - a.x) - g.a0) * 180 / Math.PI) });
    } else {
      const r = box.current!.getBoundingClientRect();
      patch(g.id, { x: clamp(g.lx + (e.clientX - g.x0) / r.width * 100, 0, 100), y: clamp(g.ly + e.clientY - g.y0, 0, r.height) });
    }
  };
  const up = (e: React.PointerEvent<HTMLElement>) => {
    touches.current.delete(e.pointerId);
    const g = gesture.current, l = layers.find(x => x.id === g?.id);
    // One finger lifted from a pinch: carry on dragging from here
    if (g && l && touches.current.size === 1) { const [p] = [...touches.current.values()]; gesture.current = { ...g, x0: p.x, y0: p.y, lx: l.x, ly: l.y, s0: l.s, r0: l.r }; }
    if (touches.current.size === 0) gesture.current = null;
  };
  const wheel = (l: Layer) => (e: React.WheelEvent) => { if (!editing || sel !== l.id) return; e.preventDefault(); patch(l.id, { s: clamp(l.s * (e.deltaY < 0 ? 1.08 : 0.92), 0.3, 6) }); };

  // Drawing with your finger or mouse
  const drawDown = (e: React.PointerEvent<HTMLDivElement>) => { e.preventDefault(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); const [x, y] = local(e.clientX, e.clientY); setLive([[Math.round(x * 10), Math.round(y)]]); };
  const drawMove = (e: React.PointerEvent<HTMLDivElement>) => { if (!live) return; const [x, y] = local(e.clientX, e.clientY); setLive(p => p && [...p, [Math.round(x * 10), Math.round(y)]]); };
  const drawUp = () => { if (live && live.length > 1) { const z = top(); onChange(ls => [...ls, { id: Math.random().toString(36).slice(2, 10), k: 'draw' as const, x: 0, y: 0, r: 0, s: 1, z, pts: live.length > 600 ? live.filter((_, i) => i % 2 === 0) : live, color: pen.color, w: pen.w }].slice(-120)); } setLive(null); };

  const s = layers.find(l => l.id === sel);
  const btn = 'w-9 h-9 rounded-full hover:bg-slate-100 text-[15px] font-bold text-slate-700 flex items-center justify-center';
  const draws = layers.filter(l => l.k === 'draw');

  return (
    <div ref={box} className="absolute inset-0 z-30 pointer-events-none">
      <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox={`0 0 1000 ${Math.max(1, height)}`} preserveAspectRatio="none" aria-hidden>
        {[...draws.map(d => ({ id: d.id, pts: d.pts ?? [], c: d.color, w: d.w })), ...(live ? [{ id: 'live', pts: live, c: pen.color, w: pen.w }] : [])].map(d =>
          <path key={d.id} d={path(d.pts)} fill="none" stroke={d.c} strokeWidth={d.w} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />)}
      </svg>
      {layers.filter(l => l.k !== 'draw' && (editing || l.k !== 'text' || l.text?.trim())).sort((a, b) => a.z - b.z).map(l => {
        const ph = l.k === 'photo' || l.k === 'video' ? show(l.photo) : undefined;
        return (
          <div key={l.id} data-layer onPointerDown={down(l)} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onWheel={wheel(l)}
            className={`absolute ${editing && !pen.on ? 'pointer-events-auto cursor-grab' : ''} ${sel === l.id ? 'outline-dashed outline-2 outline-offset-4 outline-slate-900/40 rounded-xl' : ''}`}
            style={{ left: `${l.x}%`, top: l.y, zIndex: l.z, opacity: l.op ?? 1, transform: `translate(-50%, -50%) rotate(${l.r}deg) scale(${l.s})`, touchAction: editing ? 'none' : undefined }}>
            {l.k === 'emoji' && <span className="block" style={{ filter: OUTLINE }}><Emoji e={l.e!} size={64} /></span>}
            {l.k === 'photo' && (ph ? <img src={ph} alt="" draggable={false} className="w-28 h-28 object-cover rounded-2xl border-[5px] border-white shadow-[0_12px_24px_-10px_rgba(15,23,42,0.55)]" /> : <span className="block w-28 h-28 rounded-2xl bg-white/70" />)}
            {l.k === 'face' && l.face && (show(l.face.ref) ? <FaceSprite src={show(l.face.ref)!} face={l.face} size={150} style={{ filter: OUTLINE }} /> : <span className="block w-[150px] h-[150px]" />)}
            {l.k === 'shape' && <ShapeSvg shape={l.shape ?? 'rect'} fill={l.color ?? '#9bbecb'} w={l.sw ?? 120} h={l.sh ?? 120} />}
            {l.k === 'video' && (ph ? <video src={ph} autoPlay muted loop playsInline className="w-56 rounded-2xl border-[5px] border-white shadow-[0_12px_24px_-10px_rgba(15,23,42,0.55)] pointer-events-none" /> : <span className="block w-56 h-36 rounded-2xl bg-white/70" />)}
            {l.k === 'text' && <span className={`block whitespace-pre text-[28px] leading-tight ${l.bg ? 'px-4 py-1.5 rounded-2xl bg-white shadow-[0_10px_20px_-10px_rgba(15,23,42,0.45)]' : ''}`} style={{ ...FONT[l.font ?? 'script'], color: l.color ?? '#0f172a', textShadow: l.bg ? undefined : '0 2px 10px rgba(255,255,255,.6)' }}>{l.text || S.typeHere}</span>}
          </div>
        );
      })}
      {editing && pen.on && <div className="absolute inset-0 pointer-events-auto cursor-crosshair" style={{ touchAction: 'none', zIndex: 9999 }} onPointerDown={drawDown} onPointerMove={drawMove} onPointerUp={drawUp} onPointerCancel={drawUp} />}
      {/* The selected piece's tools, just above it */}
      {editing && s && !pen.on && (
        <div data-ltool className="absolute pointer-events-auto -translate-x-1/2 rounded-2xl bg-white shadow-[0_16px_40px_-14px_rgba(15,23,42,0.5)] border border-slate-100 p-1.5" style={{ left: `${clamp(s.x, 18, 82)}%`, top: Math.max(0, s.y - 70 * s.s - 64), zIndex: 10000, minWidth: s.k === 'text' ? 280 : undefined }}>
          {s.k === 'text' && (
            <div className="p-1 space-y-1.5">
              <input autoFocus value={s.text ?? ''} onChange={e => patch(s.id, { text: e.target.value.slice(0, 80) })} placeholder={S.typeHere} className="w-full h-9 rounded-xl bg-slate-100 px-3 text-[15px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#9bbecb]" />
              <div className="flex gap-1">{(Object.keys(FONT) as NameFont[]).map(f => <button key={f} type="button" onClick={() => patch(s.id, { font: f })} className={`flex-1 h-8 rounded-lg text-[15px] ${(s.font ?? 'script') === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`} style={FONT[f]}>Aa</button>)}
                <button type="button" onClick={() => patch(s.id, { bg: !s.bg })} aria-label={S.pill} title={S.pill} className={`h-8 px-2 rounded-lg text-[13px] font-bold ${s.bg ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>▢</button></div>
              <div className="flex flex-wrap gap-1">{INK.map(c => <button key={c} type="button" onClick={() => patch(s.id, { color: c })} aria-label={c} className={`w-6 h-6 rounded-full border ${s.color === c ? 'ring-2 ring-slate-900 ring-offset-1' : 'border-slate-200'}`} style={{ background: c }} />)}</div>
            </div>
          )}
          {s.k === 'shape' && <div className="p-1 flex flex-wrap gap-1 max-w-[260px]">{INK.map(c => <button key={c} type="button" onClick={() => patch(s.id, { color: c })} aria-label={c} className={`w-6 h-6 rounded-full border ${s.color === c ? 'ring-2 ring-slate-900 ring-offset-1' : 'border-slate-200'}`} style={{ background: c }} />)}</div>}
          <label className="px-2 pt-1 flex items-center gap-2 text-[12px] font-semibold text-slate-500">{S.opacity}<input type="range" min={0.15} max={1} step={0.05} value={s.op ?? 1} onChange={e => patch(s.id, { op: +e.target.value })} className="flex-1 accent-slate-900" /></label>
          <div className="flex items-center justify-center">
            <button type="button" className={btn} aria-label={S.smaller} title={S.smaller} onClick={() => patch(s.id, { s: clamp(s.s / 1.15, 0.3, 6) })}>−</button>
            <button type="button" className={btn} aria-label={S.bigger} title={S.bigger} onClick={() => patch(s.id, { s: clamp(s.s * 1.15, 0.3, 6) })}>+</button>
            <button type="button" className={btn} aria-label={S.turnL} title={S.turnL} onClick={() => patch(s.id, { r: s.r - 15 })}>↺</button>
            <button type="button" className={btn} aria-label={S.turnR} title={S.turnR} onClick={() => patch(s.id, { r: s.r + 15 })}>↻</button>
            <button type="button" className={btn} aria-label={S.front} title={S.front} onClick={() => patch(s.id, { z: top() })}>⇡</button>
            <button type="button" className={btn} aria-label={S.dup} title={S.dup} onClick={() => { const id = Math.random().toString(36).slice(2, 10); onChange(ls => [...ls, { ...s, id, x: clamp(s.x + 4, 0, 100), y: s.y + 24, z: top() }]); setSel(id); }}>⧉</button>
            <button type="button" className={`${btn} text-[#e5484d]`} aria-label={S.del} title={S.del} onClick={() => { onChange(ls => ls.filter(x => x.id !== s.id)); setSel(null); }}>✕&#xFE0E;</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreeCanvas;
