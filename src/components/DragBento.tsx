// A bento you arrange like iPhone apps: while editing, tiles wiggle; press and drag one (a long press on phones) and it
// follows your finger, the others make room as it passes over them; drag the grip on a tile's corner to make it wider,
// narrower, taller or shorter. Sizes are in columns of a 6-column grid on laptops (2 to 6) and rows (1 or 2); on phones
// the grid has 2 columns and anything 4 or wider takes the whole row.
import React, { useEffect, useRef, useState } from 'react';

export interface BentoItem { id: string; w: number; h: number; node: React.ReactNode }

const ROW = 150, GAP = 12;
const useWide = () => {
  const q = typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)') : null;
  const [wide, setWide] = useState(!!q?.matches);
  useEffect(() => { if (!q) return; const on = () => setWide(q.matches); q.addEventListener('change', on); return () => q.removeEventListener('change', on); }, []);
  return wide;
};

const DragBento: React.FC<{
  items: BentoItem[];
  editing: boolean;
  onMove: (dragId: string, overId: string) => void;
  onSize: (id: string, w: number, h: number) => void;
  resizeLabel: string;
  head?: React.ReactNode;
  tail?: React.ReactNode;
}> = ({ items, editing, onMove, onSize, resizeLabel, head, tail }) => {
  const wide = useWide();
  const cols = wide ? 6 : 2;
  const grid = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const drag = useRef<{ id: string; grabX: number; grabY: number; x: number; y: number; el: HTMLElement; last: string | null } | null>(null);
  const press = useRef<{ timer: number; x: number; y: number } | null>(null);

  // While dragging, the page must not scroll under the finger
  useEffect(() => {
    const stop = (e: TouchEvent) => { if (drag.current) e.preventDefault(); };
    document.addEventListener('touchmove', stop, { passive: false });
    return () => document.removeEventListener('touchmove', stop);
  }, []);

  const follow = () => {
    const d = drag.current; if (!d) return;
    d.el.style.transform = '';
    const r = d.el.getBoundingClientRect();
    d.el.style.transform = `translate(${d.x - d.grabX - r.left}px, ${d.y - d.grabY - r.top}px) scale(1.04)`;
  };
  // After the tiles reflow around it, keep the dragged tile under the finger
  useEffect(() => { follow(); });

  const begin = (id: string, el: HTMLElement, x: number, y: number) => {
    const r = el.getBoundingClientRect();
    drag.current = { id, el, grabX: x - r.left, grabY: y - r.top, x, y, last: null };
    setDragId(id);
    navigator.vibrate?.(10);
  };
  const end = () => {
    if (press.current) { clearTimeout(press.current.timer); press.current = null; }
    const d = drag.current; if (!d) return;
    d.el.style.transform = ''; drag.current = null; setDragId(null);
  };

  const onDown = (id: string) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (!editing || e.button > 0) return;
    if ((e.target as HTMLElement).closest('input, textarea, select, button, [data-resize]')) return;
    const el = e.currentTarget;
    if (e.pointerType === 'mouse') { press.current = { timer: 0, x: e.clientX, y: e.clientY }; (press.current as any).id = id; (press.current as any).el = el; return; }
    // Touch: a long press picks the tile up, like an iPhone app; moving first means they're scrolling
    const x = e.clientX, y = e.clientY;
    press.current = { x, y, timer: window.setTimeout(() => { press.current = null; begin(id, el, x, y); }, 280) };
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const p = press.current as any;
      if (p && !drag.current) {
        const far = Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6;
        if (far && e.pointerType === 'mouse' && p.id) { press.current = null; begin(p.id, p.el, p.x, p.y); }
        else if (far) { clearTimeout(p.timer); press.current = null; }
      }
      const d = drag.current; if (!d) return;
      d.x = e.clientX; d.y = e.clientY; follow();
      const over = document.elementsFromPoint(e.clientX, e.clientY).map(n => (n as HTMLElement).closest?.('[data-tile]') as HTMLElement | null).find(n => n && n.dataset.tile !== d.id);
      const oid = over?.dataset.tile ?? null;
      if (oid && oid !== d.last) { d.last = oid; onMove(d.id, oid); }
      if (!oid) d.last = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); };
  }, [onMove]);

  // The corner grip: drag it to change how many columns and rows the tile takes
  const resize = (it: BentoItem) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault(); e.stopPropagation();
    const g = grid.current, tile = (e.currentTarget as HTMLElement).closest('[data-tile]') as HTMLElement | null;
    if (!g || !tile) return;
    const unit = (g.clientWidth + GAP) / cols, r = tile.getBoundingClientRect(), sx = e.clientX, sy = e.clientY;
    const handle = e.currentTarget; handle.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const span = Math.max(wide ? 2 : 1, Math.min(cols, Math.round((r.width + ev.clientX - sx + GAP) / unit)));
      const w = wide ? span : span >= 2 ? 6 : Math.min(it.w, 3);
      const h = Math.max(1, Math.min(2, Math.round((r.height + ev.clientY - sy + GAP) / (ROW + GAP))));
      onSize(it.id, w, h);
    };
    const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); handle.removeEventListener('pointercancel', up); };
    handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', up); handle.addEventListener('pointercancel', up);
  };

  return (
    <div ref={grid} className="grid grid-flow-row-dense" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: `minmax(${ROW}px, auto)`, gap: GAP }}>
      <style>{`
        @keyframes bento-jiggle { from { transform: rotate(-0.7deg); } to { transform: rotate(0.7deg); } }
        .bento-jiggle { animation: bento-jiggle .26s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .bento-jiggle { animation: none; } }
      `}</style>
      {head}
      {items.map((it, i) => (
        <div key={it.id} data-tile={it.id} onPointerDown={onDown(it.id)}
          className={`relative ${editing ? 'cursor-grab select-none' : ''} ${dragId === it.id ? 'z-30 cursor-grabbing drop-shadow-[0_24px_30px_rgba(15,23,42,0.25)]' : ''}`}
          style={{ gridColumn: `span ${wide ? Math.min(6, Math.max(2, it.w)) : it.w >= 4 ? 2 : 1}`, gridRow: `span ${it.h}`, transition: dragId === it.id ? 'none' : undefined }}>
          <div className={`h-full ${editing && dragId !== it.id ? 'bento-jiggle' : ''}`} style={{ animationDelay: `${-(i % 4) * 0.07}s` }}>{it.node}</div>
          {editing && (
            <button type="button" data-resize aria-label={resizeLabel} onPointerDown={resize(it)}
              className="absolute bottom-1.5 right-1.5 w-9 h-9 flex items-end justify-end p-2 cursor-nwse-resize" style={{ touchAction: 'none' }}>
              <span className="block w-4 h-4 rounded-br-[10px] border-b-[3.5px] border-r-[3.5px] border-slate-900/45" />
            </button>
          )}
        </div>
      ))}
      {tail}
    </div>
  );
};

export default DragBento;
