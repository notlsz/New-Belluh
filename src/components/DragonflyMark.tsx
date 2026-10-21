import React, { useEffect, useState } from 'react';

/**
 * Belluh's mark: the water dragonfly from the app icon. It sends a ripple through the water when it first appears
 * and every time it's tapped, like a stone dropped in a pond.
 */
const DragonflyMark: React.FC<{ size?: number; className?: string; rippleOnMount?: boolean }> = ({ size = 24, className = '', rippleOnMount = true }) => {
  const [waves, setWaves] = useState<number[]>([]);
  const splash = () => {
    const id = Date.now() + Math.random();
    setWaves(w => [...w.slice(-2), id]);
    setTimeout(() => setWaves(w => w.filter(x => x !== id)), 1300);
  };
  useEffect(() => {
    if (!rippleOnMount) return;
    let seen = false;
    try { seen = sessionStorage.getItem('belluh_mark_ripple') === '1'; sessionStorage.setItem('belluh_mark_ripple', '1'); } catch { /* storage off */ }
    if (!seen) { const t = setTimeout(splash, 250); return () => clearTimeout(t); }
  }, [rippleOnMount]);
  return (
    <span className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }} onPointerDown={splash} aria-hidden="true">
      {waves.map(id => (
        <span key={id} className="belluh-ripple absolute inset-0 rounded-full pointer-events-none" />
      ))}
      <img src="/dragonfly.png?v=1" alt="" width={size} height={size} draggable={false} className="relative w-full h-full object-contain select-none belluh-mark" />
    </span>
  );
};

export default DragonflyMark;
