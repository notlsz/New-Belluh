// A shared guide at belluh.com/g/<link>, for anyone: the map with its places, and a card like Pampam's with the title,
// who made it, and each place. Opens without an account; a button invites them to make their own.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useI18n, useUi } from '../i18n';
import guidesUi from '../i18n/ui/guides';
import { styleFor } from './LoveMap';
import { Emoji, emojiSrc } from '../lib/emoji3d';
import { countryOf } from '../lib/world';
import { guides as api, type Guide } from '../services/guides';
import DragonflyMark from '../components/DragonflyMark';

const GuidePage: React.FC<{ slug: string }> = ({ slug }) => {
  const { lang, f } = useI18n();
  const T = useUi(guidesUi);
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [g, setG] = useState<Guide | null | undefined>(undefined);
  useEffect(() => { api.bySlug(slug).then(x => { setG(x); if (x) document.title = `${x.emoji} ${x.title} | Belluh`; }); }, [slug]);
  const countries = useMemo(() => g ? g.places.filter(p => p.kind === 'country').map(p => countryOf(p.lng, p.lat) ?? p.name) : [], [g]);

  useEffect(() => {
    if (!box.current || !g) return;
    const map = new maplibregl.Map({ container: box.current, style: styleFor(lang), center: [10, 25], zoom: 1.3, attributionControl: { compact: true } });
    mapRef.current = map;
    map.on('load', () => {
      if (map.getLayer('visited')) map.setFilter('visited', ['in', ['get', 'name'], ['literal', countries]]);
      g.places.filter(p => p.kind === 'place').forEach(p => {
        const el = document.createElement('div'); el.className = 'gp-pin';
        const src = emojiSrc(p.emoji || '📍'); const pic = document.createElement(src ? 'img' : 'span') as any;
        if (src) pic.src = src; else pic.textContent = p.emoji || '📍';
        const label = document.createElement('span'); label.textContent = p.name;
        el.append(pic, label);
        new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.lng, p.lat]).addTo(map);
      });
      if (g.places.length === 1) map.jumpTo({ center: [g.places[0].lng, g.places[0].lat], zoom: g.places[0].kind === 'country' ? 3.5 : 13 });
      else if (g.places.length) { const b = new maplibregl.LngLatBounds(); g.places.forEach(p => b.extend([p.lng, p.lat])); map.fitBounds(b, { padding: { top: 80, bottom: window.innerWidth >= 768 ? 80 : Math.round(window.innerHeight * 0.58), left: window.innerWidth >= 768 ? 420 : 40, right: 60 }, maxZoom: 14, duration: 0 }); }
    });
    return () => map.remove();
  }, [g]);

  if (g === undefined) return <div className="min-h-screen bg-[#fdf0e9]" />;
  if (g === null) return (
    <div className="min-h-screen bg-[#fdf0e9] flex flex-col items-center justify-center gap-5 px-6 text-center">
      <Emoji e="🔒" size={64} />
      <p className="text-lg text-slate-700">{T.notFound}</p>
      <a href="/" className="h-12 px-6 rounded-full bg-[#5e9db3] text-white font-bold inline-flex items-center">{T.makeYours}</a>
    </div>
  );
  return (
    <div className="fixed inset-0 bg-[#fdf0e9]">
      <style>{`
        .gp-pin { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .gp-pin img, .gp-pin > span:first-child { width: 44px; height: 44px; font-size: 38px; line-height: 44px; filter: drop-shadow(2.5px 0 0 #fff) drop-shadow(-2.5px 0 0 #fff) drop-shadow(0 2.5px 0 #fff) drop-shadow(0 -2.5px 0 #fff) drop-shadow(0 6px 8px rgba(15,23,42,.22)); }
        .gp-pin > span:last-child { font: 700 13px/1.15 Inter, system-ui, sans-serif; color: #2a2230; max-width: 120px; text-align: center; text-shadow: 0 0 2px #fff, 0 0 2px #fff, 0 0 3px #fff, 0 0 4px #fff; }
      `}</style>
      <div className="absolute inset-0"><div ref={box} style={{ width: '100%', height: '100%' }} /></div>
      <div className="absolute z-10 inset-x-3 bottom-3 max-h-[55vh] md:inset-x-auto md:left-5 md:top-5 md:bottom-5 md:w-[360px] md:max-h-none flex flex-col rounded-[1.75rem] bg-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.4)] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5">
          <a href="/" className="inline-flex items-center gap-2"><DragonflyMark size={24} /><span className="font-serif text-lg font-bold text-[#9bbecb]">Belluh</span></a>
          <div className="mt-5 flex items-center gap-3"><Emoji e={g.emoji} size={48} /><h1 className="text-2xl font-bold text-slate-900 leading-tight">{g.title}</h1></div>
          {g.author_name && <p className="mt-2 text-[13px] font-semibold text-slate-400">{f(T.by, { name: g.author_name })}</p>}
          {g.description && <p className="mt-3 text-[15px] text-slate-600 leading-relaxed">{g.description}</p>}
          <div className="mt-5 space-y-2">
            {g.places.map(p => (
              <button key={p.id} type="button" onClick={() => mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: p.kind === 'country' ? 4 : 15, duration: 1200 })} className="w-full text-left rounded-2xl bg-[#fdf1ec] hover:bg-[#fbe6dd] p-3 flex items-center gap-3">
                <span className="w-10 h-10 shrink-0 flex items-center justify-center"><Emoji e={p.emoji || '📍'} size={32} /></span>
                <span className="min-w-0"><span className="block text-[15px] font-bold text-slate-900 truncate">{p.name}</span>{p.note ? <span className="block text-[13px] text-slate-500 line-clamp-2">{p.note}</span> : p.kind === 'place' && p.country && <span className="block text-[12px] text-slate-500 truncate">{p.country}</span>}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="shrink-0 p-4">
          <a href="/signup" className="h-12 w-full rounded-full bg-[#5e9db3] hover:bg-[#4f8ea4] text-white font-bold inline-flex items-center justify-center gap-2"><Emoji e="💞" size={20} />{T.makeYours}</a>
        </div>
      </div>
    </div>
  );
};

export default GuidePage;
