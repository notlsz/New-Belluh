import React, { useEffect, useRef } from 'react';
import { createPond, type Pond } from '../lib/pond';

/**
 * Belluh's presence: a small pond of light-blue water. Stones drop in the middle and real ripples spread, cross and
 * fade (a live wave simulation, shared by every sphere on screen, so it costs about the same with one or ten).
 * While Belluh is thinking, stones fall faster. With reduced motion it shows one still frame.
 */

const ponds: Partial<Record<'calm' | 'thinking', Pond>> = {};
const live = new Set<{ canvas: HTMLCanvasElement; thinking: boolean }>();
let running = false;
const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const pond = (kind: 'calm' | 'thinking') => (ponds[kind] ??= createPond(110, kind === 'thinking' ? 650 : 2000));

function frame(now: number) {
  if (!live.size) { running = false; return; }
  if (!document.hidden) {
    const used = new Set<'calm' | 'thinking'>([...live].map(o => (o.thinking ? 'thinking' : 'calm')));
    used.forEach(k => pond(k).tick(now));
    live.forEach(o => {
      const c = o.canvas.getContext('2d');
      if (!c) return;
      c.clearRect(0, 0, o.canvas.width, o.canvas.height);
      c.imageSmoothingQuality = 'high';
      c.drawImage(pond(o.thinking ? 'thinking' : 'calm').canvas, 0, 0, o.canvas.width, o.canvas.height);
    });
  }
  if (reduced()) { running = false; return; }
  requestAnimationFrame(frame);
}

const BelluhOrb: React.FC<{ size?: number; thinking?: boolean; className?: string }> = ({ size = 24, thinking = false, className = '' }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr); canvas.height = Math.round(size * dpr);
    const entry = { canvas, thinking };
    live.add(entry);
    if (reduced()) { const p = pond(thinking ? 'thinking' : 'calm'); for (let i = 0; i < 40; i++) p.tick(performance.now() + i); }
    if (!running) { running = true; requestAnimationFrame(frame); }
    return () => { live.delete(entry); };
  }, [size, thinking]);
  return (
    <span className={`belluh-orb ${thinking ? 'is-thinking' : ''} ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <span className="belluh-orb-glow" />
      <canvas ref={ref} className="belluh-orb-water" />
      <span className="belluh-orb-shine" />
    </span>
  );
};

export default BelluhOrb;
