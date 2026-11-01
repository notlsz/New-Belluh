// Belluh's icons are 3D emoji, soft and glossy like Airbnb's and Pampam's: Microsoft's Fluent Emoji 3D (MIT license,
// github.com/microsoft/fluentui-emoji), saved as small webp files in public/emoji, named by code point. The same picture
// on every phone and computer; an emoji we don't have falls back to the system one.
import React from 'react';

const HAVE = new Set(["1f92a", "1f430", "1f607", "1f608", "1f47e", "1f341", "1f389", "1f37f", "1f4fa", "1f58d", "270d", "2195", "1f90d", "1f308", "1f380", "1f319", "1f352", "1f9f8", "1f984", "1f33b", "1f370", "1f451", "1f3a7", "1f340", "1f98b", "1fae7", "2744", "1faa9", "1f431", "1f353", "1f436", "1f4ce", "1f3f3", "1f9f3", "26f0", "1f3e8", "1f50d", "1fa90", "1f315", "1f6f0", "1f680", "2604", "1f31f", "1f6f8", "1f311", "1f52d", "1f305", "1f30a", "1f30d", "1f327", "1f32a", "1f333", "1f337", "1f338", "1f354", "1f35c", "1f35d", "1f363", "1f366", "1f377", "1f37a", "1f37d", "1f381", "1f382", "1f399", "1f39f", "1f3a1", "1f3a8", "1f3ac", "1f3ad", "1f3af", "1f3b5", "1f3b6", "1f3c6", "1f3ca", "1f3d6", "1f3df", "1f3f0", "1f420", "1f426", "1f437", "1f440", "1f44b", "1f457", "1f45b", "1f48c", "1f48d", "1f490", "1f497", "1f49e", "1f4a1", "1f4ab", "1f4ac", "1f4ad", "1f4b3", "1f4c4", "1f4c5", "1f4c6", "1f4c8", "1f4ca", "1f4cb", "1f4cd", "1f4d6", "1f4d8", "1f4da", "1f4de", "1f4e4", "1f4e5", "1f4e8", "1f4f5", "1f4f7", "1f4f8", "1f504", "1f512", "1f514", "1f515", "1f517", "1f525", "1f570", "1f58a", "1f5bc", "1f5c4", "1f5d1", "1f5d3", "1f5fa", "1f60a", "1f610", "1f61c", "1f630", "1f634", "1f642", "1f648", "1f64f", "1f686", "1f697", "1f6a8", "1f6ab", "1f6cd", "1f6dd", "1f6e1", "1f929", "1f942", "1f950", "1f958", "1f970", "1f97e", "1f992", "1f9e0", "1f9ec", "1f9ed", "1f9fa", "1f9fe", "1fa84", "1fac2", "1faf6", "23f0", "23f3", "23f8", "23f9", "2600", "2601", "2611", "2615", "2699", "26a0", "26a1", "26c5", "26e9", "26f5", "26fa", "2705", "2708", "2709", "270f", "2728", "2b50"]);

export const emojiKey = (e: string) => [...String(e ?? '').replace(/\uFE0F/g, '')].map(c => c.codePointAt(0)!.toString(16)).join('-');
export const emojiSrc = (e: string | null | undefined): string | null => {
  if (!e) return null; const k = emojiKey(e); return HAVE.has(k) ? `/emoji/${k}.webp` : null; };

/** One emoji as a 3D picture, sized like the text around it unless given a size. */
export const Emoji: React.FC<{ e: string | null | undefined; size?: number | string; className?: string; style?: React.CSSProperties; label?: string }> = ({ e, size = '1.15em', className = '', style, label }) => {
  // A mood or sticker we don't know (older entries saved other words) shows nothing, never breaks the screen
  if (!e) return null;
  const src = emojiSrc(e);
  const dim = typeof size === 'number' ? `${size}px` : size;
  if (!src) return <span role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={`inline-block leading-none ${className}`} style={{ fontSize: dim, ...style }}>{e}</span>;
  return <img src={src} alt={label ?? ''} aria-hidden={label ? undefined : true} draggable={false} className={`inline-block select-none align-[-0.18em] ${className}`} style={{ width: dim, height: dim, ...style }} />;
};
