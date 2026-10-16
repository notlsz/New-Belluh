import React, { useEffect, useRef } from 'react';
import { belluh, belluhWater, lightWater } from '../lib/belluhPresence';
import { createPond, type Pond } from '../lib/pond';

/**
 * Belluh's presence: a living body of light-blue water. Its whole surface ripples and it slowly reshapes itself; it
 * shows what Belluh is doing (listening, thinking, talking word by word) and can take any shape someone asks for.
 * Every orb on screen draws the same water (one WebGL render per frame, so one or ten cost the same).
 * Without WebGL it falls back to the 2D pond; with reduced motion it moves slowly.
 */

type Entry = { canvas: HTMLCanvasElement; thinking: boolean; visible: boolean };
const live = new Set<Entry>();
const byCanvas = new Map<Element, Entry>();
const ponds: Partial<Record<'calm' | 'thinking', Pond>> = {};
const pond = (kind: 'calm' | 'thinking') => (ponds[kind] ??= createPond(110, kind === 'thinking' ? 650 : 2000));
let running = false;
let last = 0, lastDraw = 0;
let cost = 0, costFrames = 0;
const MAX_WATER = lightWater ? 300 : 560; // same cap as the shared water
const FRAME_GAP = lightWater ? 1000 / 30 - 2 : 0; // phones: 30 frames a second is plenty for water, and half the work
const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

// Only orbs on screen are drawn; when none are, the water rests
const seen = typeof IntersectionObserver !== 'undefined'
  ? new IntersectionObserver(items => items.forEach(it => { const e = byCanvas.get(it.target); if (e) e.visible = it.isIntersecting; }), { rootMargin: '120px' })
  : null;

function paint(canvas: HTMLCanvasElement, img: CanvasImageSource) {
  const c = canvas.getContext('2d');
  if (!c) return;
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.imageSmoothingQuality = 'high';
  c.drawImage(img, 0, 0, canvas.width, canvas.height);
}

function frame(now: number) {
  if (!live.size) { running = false; last = 0; return; }
  requestAnimationFrame(frame);
  if (document.hidden || now - lastDraw < FRAME_GAP) return;
  const shown = [...live].filter(o => o.visible);
  if (!shown.length) { last = now; return; }
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
  last = now; lastDraw = now;
  const water = belluhWater();
  if (water) {
    const t0 = performance.now();
    water.frame(reduced() ? dt * 0.3 : dt);
    shown.forEach(o => paint(o.canvas, water.canvas));
    // If drawing takes too long on this device, draw fewer pixels, but never so few that the water goes soft:
    // the floor is most of what the biggest orb on screen needs. When there's headroom again, sharpen back up.
    cost += performance.now() - t0;
    if (++costFrames === 30) {
      const avg = cost / 30;
      const need = Math.min(MAX_WATER, Math.max(...shown.map(o => o.canvas.width)));
      const floor = Math.max(150, Math.round(need * 0.75));
      if (avg > (lightWater ? 14 : 10) && water.size > floor) water.resize(Math.max(floor, water.size * 0.85));
      else if (avg < (lightWater ? 7 : 5) && water.size < need) water.resize(Math.min(need, water.size * 1.15));
      cost = 0; costFrames = 0;
    }
  } else {
    const used = new Set(shown.map(o => (o.thinking ? 'thinking' : 'calm') as 'calm' | 'thinking'));
    used.forEach(k => pond(k).tick(now));
    shown.forEach(o => paint(o.canvas, pond(o.thinking ? 'thinking' : 'calm').canvas));
  }
}

type OrbProps = {
  size?: number;
  thinking?: boolean;
  className?: string;
  /** Makes the orb a button (tapping it ripples the water); give it a label for screen readers. */
  onTap?: () => void;
  label?: string;
};

const BelluhOrb: React.FC<OrbProps> = ({ size = 24, thinking = false, className = '', onTap, label }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const webgl = !!belluhWater();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const px = Math.round(size * (webgl ? 1.4 : 1) * dpr); // the water's canvas overhangs the orb so the water itself fills it
    canvas.width = px; canvas.height = px;
    if (webgl) belluh.ensureResolution(px);
    const entry: Entry = { canvas, thinking, visible: !seen };
    live.add(entry);
    byCanvas.set(canvas, entry);
    seen?.observe(canvas);
    const release = thinking ? belluh.holdThinking() : null;
    if (!running) { running = true; requestAnimationFrame(frame); }
    return () => { live.delete(entry); byCanvas.delete(canvas); seen?.unobserve(canvas); release?.(); };
  }, [size, thinking, webgl]);
  return (
    <span
      className={`belluh-orb ${webgl ? 'is-3d' : ''} ${thinking ? 'is-thinking' : ''} ${onTap ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: size, height: size }}
      {...(onTap
        ? { role: 'button', tabIndex: 0, 'aria-label': label || 'Belluh', onClick: () => { belluh.key(); onTap(); }, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); belluh.key(); onTap(); } } }
        : { 'aria-hidden': true })}
    >
      <span className="belluh-orb-glow" />
      <canvas ref={ref} className="belluh-orb-water" />
      {!webgl && <span className="belluh-orb-shine" />}
    </span>
  );
};

export default BelluhOrb;
