// The love map, after Zenly, amo and Pampam: every entry, photo and voice note pinned where it happened, on a cartoon
// world. Zoomed out it's a globe of candy-colored countries floating in a pink sky; zoomed in, pastel streets and parks
// from OpenFreeMap. The world shapes ship with the app, so the globe always draws even if the street tiles can't load.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { COUNTRIES, BORDERS, countryOf } from '../lib/world';
import { useI18n, useUi } from '../i18n';
import mapUi from '../i18n/ui/map';
import { EntryType, type JournalEntry } from '../types';
import { MOOD_EMOJIS } from '../constants';
import { herePlace, placesOn, setPlacesOn } from '../lib/places';
import { Emoji, emojiSrc } from '../lib/emoji3d';
import SolarSystem, { type SolarSystemHandle } from '../components/SolarSystem';

const OCEAN = '#c6d8eb', LAND = '#fdf0e9', ROAD = '#f7cdb2', ROAD_MAIN = '#f3b994';
const PALETTE = ['#ffd6a8', '#ffc4dc', '#c9f0b4', '#ffeb99', '#dccbff', '#b9e8f7'];
// Places on the map as emoji stickers, the way Pampam does it
const POI: Record<string, string> = { cafe: '☕', restaurant: '🍜', fast_food: '🍔', bar: '🍷', beer: '🍺', bakery: '🥐', ice_cream: '🍦', park: '🌳', garden: '🌷', museum: '🖼️', art_gallery: '🎨', cinema: '🎬', theatre: '🎭', music: '🎵', clothing_store: '👗', zoo: '🦒', aquarium: '🐠', castle: '🏰', attraction: '🎡', stadium: '🏟️', beach: '🏖️', campsite: '⛺', airport: '✈️', harbor: '⛵', florist: '💐', place_of_worship: '⛩️', playground: '🛝', swimming: '🏊', viewpoint: '🌅' };

function styleFor(lang: string): StyleSpecification {
  const name: any = ['coalesce', ['get', `name:${lang}`], ['get', 'name']];
  return {
    version: 8,
    projection: { type: 'globe' },
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      world: { type: 'geojson', data: COUNTRIES },
      // Only the lines between two countries: no coastlines doubled, no cut along the date line
      borders: { type: 'geojson', data: BORDERS },
      sea: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]] } } as any },
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>' },
    },
    layers: [
      // One soft blush for everything, like Pampam: the land, the roads in a deeper blush, pale water with a few drawn
      // waves, faint parks. No buildings, no white or yellow roads. The color is saved for your own pins.
      { id: 'bg', type: 'background', paint: { 'background-color': ['interpolate', ['linear'], ['zoom'], 4.8, OCEAN, 6, LAND] } },
      { id: 'countries', type: 'fill', source: 'world', paint: { 'fill-color': LAND, 'fill-antialias': false, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 4.8, 1, 6, 0] } },
      // The countries you've been to together glow pink, like a scratch map
      { id: 'visited', type: 'fill', source: 'world', filter: ['in', ['get', 'name'], ['literal', []]], paint: { 'fill-color': '#f6b3cc', 'fill-antialias': false, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 4.8, 1, 6, 0] } },
      { id: 'borders', type: 'line', source: 'borders', paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 0, 0.8, 4, 1.8], 'line-opacity': ['interpolate', ['linear'], ['zoom'], 4.8, 1, 6, 0] } },
      { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', minzoom: 6, paint: { 'fill-color': '#e2ecd3' } },
      { id: 'green', type: 'fill', source: 'omt', 'source-layer': 'landcover', minzoom: 6, filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood', 'forest']]], paint: { 'fill-color': '#e7efd9', 'fill-opacity': 0.9 } },
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', minzoom: 4.5, paint: { 'fill-color': OCEAN, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 4.5, 0, 5.5, 1] } },
      { id: 'waves', type: 'fill', source: 'omt', 'source-layer': 'water', minzoom: 9, paint: { 'fill-pattern': 'pat:waves' } },
      { id: 'water-edge', type: 'line', source: 'omt', 'source-layer': 'water', minzoom: 9, paint: { 'line-color': '#a9c1db', 'line-width': 1 } },
      { id: 'river', type: 'line', source: 'omt', 'source-layer': 'waterway', minzoom: 9, paint: { 'line-color': OCEAN, 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1, 16, 4] } },
      { id: 'road-minor', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 10.5, filter: ['in', ['get', 'class'], ['literal', ['tertiary', 'minor', 'street']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ROAD, 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 11, 0.6, 17, 6] } },
      { id: 'road-main', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 7, filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ROAD_MAIN, 'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 7, 0.8, 17, 10] } },
      { id: 'rail', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 12, filter: ['==', ['get', 'class'], 'rail'], paint: { 'line-color': ROAD, 'line-width': 1, 'line-dasharray': [3, 3] } },
      { id: 'road-label', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 13, filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary']]], layout: { 'symbol-placement': 'line', 'text-field': name, 'text-font': ['Noto Sans Regular'], 'text-size': 11 }, paint: { 'text-color': '#c99a85', 'text-halo-color': LAND, 'text-halo-width': 1.5 } },
      { id: 'place', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 5, filter: ['in', ['get', 'class'], ['literal', ['city', 'town', 'suburb', 'quarter']]], layout: { 'text-field': name, 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 5, 12, 14, 17], 'text-max-width': 8 }, paint: { 'text-color': '#b98563', 'text-halo-color': LAND, 'text-halo-width': 1.5 } },
      { id: 'country-label', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 1, maxzoom: 6, filter: ['==', ['get', 'class'], 'country'], layout: { 'text-field': name, 'text-font': ['Noto Sans Bold'], 'text-size': 11 }, paint: { 'text-color': '#b08f80', 'text-halo-color': '#ffffff', 'text-halo-width': 1.2 } },
    ],
  };
}

// The 3D place stickers, fetched as soon as the map opens so they're ready by the time you zoom into streets
const POI_IMG = new Map<string, HTMLImageElement>();
[...new Set(Object.values(POI))].forEach(e => { const src = emojiSrc(e); if (!src) return; const im = new Image(); im.onload = () => POI_IMG.set(e, im); im.src = src; });

// Pampam's water: a few small, thin wave marks in a deeper blue, far apart
function waveTile(): ImageData {
  const w = 300, h = 220, c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d')!; x.strokeStyle = '#a3c3e2'; x.lineWidth = 3; x.lineCap = 'round';
  const wave = (cx: number, cy: number) => { x.beginPath(); x.moveTo(cx - 15, cy); x.bezierCurveTo(cx - 9, cy - 7, cx - 3, cy - 7, cx, cy); x.bezierCurveTo(cx + 3, cy + 7, cx + 9, cy + 7, cx + 15, cy); x.stroke(); };
  wave(60, 50); wave(210, 160);
  return x.getImageData(0, 0, w, h);
}

/** A memory's name on the map: its place if we know it, else the first few words */
const titleOf = (e: JournalEntry) => {
  if (e.location) return e.location;
  const words = (e.content || '').replace(/\s+/g, ' ').trim().split(' ');
  const t = words.slice(0, 4).join(' ');
  return t ? (words.length > 4 ? t + '…' : t) : '';
};

const emojiFor = (e: JournalEntry) => e.type === EntryType.Voice || e.audioUrl ? '🎙️' : e.type === EntryType.Photo ? '📸' : (e.mood && (MOOD_EMOJIS as any)[e.mood]) || '💌';

interface Props { entries: JournalEntry[]; currentUserId: string }

const LoveMap: React.FC<Props> = ({ entries, currentUserId }) => {
  const { lang, f, date } = useI18n();
  const T = useUi(mapUi);
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [open, setOpen] = useState<JournalEntry[] | null>(null);
  const [on, setOn] = useState(placesOn());
  const [note, setNote] = useState('');
  const [far, setFar] = useState(true);
  const [q, setQ] = useState('');
  // Phones: the panel is a sheet at the bottom, folded down until you open it
  const [sheet, setSheet] = useState(false);
  // Zoomed all the way out, the sky becomes space: stars, the Moon, planets, a satellite, a rocket
  const [space, setSpace] = useState(false);
  const sky = useRef<SolarSystemHandle>(null);
  // The welcome card says its piece, then gets out of the way (or as soon as they touch the map)
  const [hint, setHint] = useState(true);
  const [hintTurn, setHintTurn] = useState(0);
  useEffect(() => { setHint(true); const t = setTimeout(() => setHint(false), hintTurn ? 3000 : 4000); return () => clearTimeout(t); }, [hintTurn]);

  // Entries at the same spot (about 100 m) share one bubble
  const groups = useMemo(() => {
    const m = new Map<string, JournalEntry[]>();
    entries.filter(e => typeof e.lat === 'number' && typeof e.lng === 'number').forEach(e => {
      const k = `${e.lat!.toFixed(3)},${e.lng!.toFixed(3)}`;
      m.set(k, [...(m.get(k) ?? []), e]);
    });
    return [...m.values()].map(g => g.sort((a, b) => +b.timestamp - +a.timestamp));
  }, [entries]);

  const fit = (animate = true) => {
    const map = mapRef.current; if (!map || !groups.length) return;
    const lngs = groups.map(g => g[0].lng!);
    // Places on opposite sides of the world: show the globe turned to the latest one
    if (Math.max(...lngs) - Math.min(...lngs) > 120) {
      const last = [...groups].sort((x, y) => +y[0].timestamp - +x[0].timestamp)[0][0];
      map.flyTo({ center: [last.lng!, last.lat! - 8], zoom: 1.7, duration: animate ? 1800 : 0 });
      return;
    }
    const b = new maplibregl.LngLatBounds();
    groups.forEach(g => b.extend([g[0].lng!, g[0].lat!]));
    map.fitBounds(b, { padding: { top: 140, bottom: 200, left: 60, right: 60 }, maxZoom: 13, duration: animate ? 1600 : 0 });
  };

  useEffect(() => {
    if (!box.current) return;
    const map = new maplibregl.Map({ container: box.current, style: styleFor(lang), center: [10, 25], zoom: 1.25, minZoom: -1.2, attributionControl: { compact: true }, maxPitch: 60 });
    mapRef.current = map;
    (window as any).__belluhMap = map; // for screenshots and debugging
    // An empty globe spins slowly, like a toy, until it's touched
    let spinning = true;
    const stop = () => { spinning = false; };
    map.on('mousedown', stop); map.on('touchstart', stop); map.on('wheel', stop);
    const away = () => setHint(false);
    map.on('dragstart', away); map.on('click', away); map.on('wheel', away);
    const spin = () => { if (!spinning || !mapRef.current) return; if (map.getZoom() < 3) map.easeTo({ center: [map.getCenter().lng - 12, map.getCenter().lat], duration: 1200, easing: t => t }); };
    map.on('moveend', spin);
    map.on('load', () => { if (!groups.length) spin(); else spinning = false; });
    // Draw each place's emoji as a little sticker (a white outline and a soft shadow) the first time it's needed
    map.on('styleimagemissing', (ev: any) => {
      const id: string = ev.id;
      if (id === 'pat:waves' && !map.hasImage(id)) { map.addImage(id, waveTile(), { pixelRatio: 2 }); return; }
      if (!id.startsWith('e:') || map.hasImage(id)) return;
      const [, sub, cls] = id.split(':');
      const emoji = POI[sub] ?? POI[cls];
      const size = 96, c = document.createElement('canvas'); c.width = c.height = size;
      const x = c.getContext('2d')!;
      if (!emoji) { map.addImage(id, { width: 1, height: 1, data: new Uint8Array(4) }); return; }
      const pic = POI_IMG.get(emoji);
      if (pic) {
        // A white sticker edge: the picture's silhouette in white, nudged around it, under a soft shadow
        const sil = document.createElement('canvas'); sil.width = sil.height = 76;
        const sx = sil.getContext('2d')!; sx.drawImage(pic, 0, 0, 76, 76); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#fff'; sx.fillRect(0, 0, 76, 76);
        x.shadowColor = 'rgba(15,23,42,0.22)'; x.shadowBlur = 8; x.shadowOffsetY = 4;
        for (const [dx, dy] of [[-4, 0], [4, 0], [0, -4], [0, 4], [-3, -3], [3, 3], [-3, 3], [3, -3]]) x.drawImage(sil, 10 + dx, 8 + dy);
        x.shadowColor = 'transparent'; x.drawImage(pic, 10, 8, 76, 76);
        map.addImage(id, x.getImageData(0, 0, size, size), { pixelRatio: 2 });
        return;
      }
      x.font = '64px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.shadowColor = 'rgba(15,23,42,0.22)'; x.shadowBlur = 8; x.shadowOffsetY = 4;
      for (const [dx, dy] of [[-4, 0], [4, 0], [0, -4], [0, 4], [-3, -3], [3, 3], [-3, 3], [3, -3]]) { x.fillStyle = '#fff'; x.fillText(emoji, size / 2 + dx, size / 2 + 4 + dy); }
      x.shadowColor = 'transparent'; x.fillText(emoji, size / 2, size / 2 + 4);
      map.addImage(id, x.getImageData(0, 0, size, size), { pixelRatio: 2 });
    });
    const zoomed = () => { const z = map.getZoom(); setFar(z < 3.2); setSpace(z < 1.15); };
    map.on('zoom', zoomed);
    // Turning the globe turns the sky behind it
    map.on('move', () => { const c = map.getCenter(); sky.current?.turn(c.lng, c.lat); });
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Which countries you've pinned something in (ray casting on the world shapes)
  const visited = useMemo(() => [...new Set(groups.map(g => countryOf(g[0].lng!, g[0].lat!)).filter(Boolean) as string[])], [groups]);
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    const set = () => { if (map.getLayer('visited')) map.setFilter('visited', ['in', ['get', 'name'], ['literal', visited]]); };
    if (map.isStyleLoaded()) set(); else map.once('load', set);
  }, [visited]);

  const fitted = useRef(false);
  // The bubbles: a photo if there is one, else an emoji; pink for you, blue for your partner
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (groups.length && !fitted.current) { fitted.current = true; const go = () => setTimeout(() => fit(), 400); if (map.loaded()) go(); else map.once('load', go); }
    const markers = groups.map(g => {
      const e = g[0], mine = e.userId === currentUserId;
      const root = document.createElement('div');
      const el = document.createElement('button');
      el.type = 'button';
      root.appendChild(el);
      el.setAttribute('aria-label', `${date(e.timestamp, { month: 'short', day: 'numeric' })}${g.length > 1 ? ` (${g.length})` : ''}`);
      el.className = 'belluh-pin';
      el.style.setProperty('--tilt', `${(e.id.charCodeAt(0) % 3 - 1) * 4}deg`);
      const add = (tag: string, cls: string, set: (n: any) => void, parent: HTMLElement = el) => { const n = document.createElement(tag); if (cls) n.className = cls; set(n); parent.appendChild(n); return n; };
      // A sticker (the photo, or the moment's 3D emoji) with a white edge, like Pampam's pins, and a bold label under it
      const stk = add('span', 'belluh-pin-stk', () => {});
      if (e.mediaUrl) add('img', 'belluh-pin-photo', n => { n.src = e.mediaUrl; n.alt = ''; }, stk);
      else if (emojiSrc(emojiFor(e))) add('img', 'belluh-pin-emoji', n => { n.src = emojiSrc(emojiFor(e)); n.alt = ''; }, stk);
      else add('span', 'belluh-pin-emoji', n => { n.textContent = emojiFor(e); }, stk);
      if (e.authorAvatar) add('img', 'belluh-pin-face', n => { n.src = e.authorAvatar; n.alt = ''; n.style.borderColor = mine ? '#f6b3cc' : '#a9d3ea'; }, stk);
      if (g.length > 1) add('span', 'belluh-pin-count', n => { n.textContent = String(g.length); }, stk);
      // A little calendar on the pin, like Pampam's event pins: the month in red, the day underneath
      add('span', 'belluh-pin-cal', n => { const m = document.createElement('b'); m.textContent = date(e.timestamp, { month: 'short' }).replace('.', ''); const d = document.createElement('i'); d.textContent = String(e.timestamp.getDate()); n.append(m, d); }, stk);
      add('span', 'belluh-pin-label', n => { n.textContent = titleOf(e); });
      el.onclick = (ev) => { ev.stopPropagation(); setOpen(g); setSheet(true); map.easeTo({ center: [e.lng!, e.lat!], zoom: Math.max(map.getZoom(), 14), duration: 1000 }); };
      return new maplibregl.Marker({ element: root, anchor: 'bottom' }).setLngLat([e.lng!, e.lat!]).addTo(map);
    });
    // Our path: a dotted pink line through your places, in the order they happened
    const path = [...groups].sort((a, b) => +a[0].timestamp - +b[0].timestamp).map(g => [g[0].lng!, g[0].lat!]);
    const draw = () => {
      const data: any = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: path } };
      const src = map.getSource('path') as any;
      if (src) src.setData(data);
      else if (path.length > 1) {
        map.addSource('path', { type: 'geojson', data });
        map.addLayer({ id: 'path', type: 'line', source: 'path', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#e58bb4', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 2.5, 12, 4.5], 'line-dasharray': [0.2, 2.2], 'line-opacity': 0.9 } });
      }
    };
    if (map.isStyleLoaded()) draw(); else map.once('load', draw);
    return () => markers.forEach(m => m.remove());
  }, [groups, currentUserId, date]);

  const turnOn = async () => {
    setPlacesOn(true); setOn(true); setNote('');
    const here = await herePlace();
    setHintTurn(n => n + 1);
    if (!here) { setNote(T.denied); return; }
    mapRef.current?.flyTo({ center: [here.lng, here.lat], zoom: 12.5, duration: 2600 });
  };

  return (
    <div className="fixed inset-0 z-10 lg:left-[var(--sidebar-w,16rem)] transition-colors duration-1000" style={{ background: space ? '#0b0a1d' : '#fbe3f1' }}>
      <style>{`
        .belluh-pin { display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: 0; padding: 0; cursor: pointer; transition: scale .3s cubic-bezier(.34,1.56,.64,1); animation: belluh-pop .6s cubic-bezier(.34,1.56,.64,1) both; }
        .belluh-pin:hover { scale: 1.12; } .belluh-pin:active { scale: .92; }
        .belluh-pin-stk { position: relative; display: block; rotate: var(--tilt, 0deg); }
        .belluh-pin-emoji { display: block; width: 46px; height: 46px; font-size: 40px; line-height: 46px; filter: drop-shadow(2.5px 0 0 #fff) drop-shadow(-2.5px 0 0 #fff) drop-shadow(0 2.5px 0 #fff) drop-shadow(0 -2.5px 0 #fff) drop-shadow(0 6px 8px rgba(15,23,42,.22)); }
        .belluh-pin-photo { display: block; width: 50px; height: 50px; object-fit: cover; border-radius: 14px; border: 3px solid #fff; box-shadow: 0 8px 16px -6px rgba(15,23,42,.35); }
        .belluh-pin-face { position: absolute; right: -9px; bottom: -5px; width: 22px; height: 22px; border-radius: 9999px; border: 2.5px solid #fff; background: #fde7f3; object-fit: cover; }
        .belluh-pin-label { font: 700 13px/1.15 Inter, system-ui, sans-serif; color: #2a2230; max-width: 120px; text-align: center; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; text-shadow: 0 0 2px #fff, 0 0 2px #fff, 0 0 3px #fff, 0 0 4px #fff; }
        .belluh-pin-cal { position: absolute; top: -10px; right: -14px; width: 24px; border-radius: 6px; background: #fff; box-shadow: 0 2px 6px rgba(15,23,42,.25); overflow: hidden; text-align: center; font-family: Inter, system-ui, sans-serif; }
        .belluh-pin-cal b { display: block; background: #e5484d; color: #fff; font-size: 7.5px; line-height: 10px; font-weight: 800; text-transform: uppercase; }
        .belluh-pin-cal i { display: block; font-style: normal; color: #1e1b24; font-size: 11px; line-height: 13px; font-weight: 800; }
        .belluh-pin-count { position: absolute; bottom: -6px; left: -10px; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 9999px; background: #1e293b; color: #fff; font: 700 12px/22px Inter, system-ui, sans-serif; border: 2px solid #fff; }
        @keyframes belluh-twinkle { 0%, 100% { opacity: .25; } 50% { opacity: 1; } }
        .belluh-star { animation: belluh-twinkle 3.2s ease-in-out infinite; box-shadow: 0 0 6px rgba(255,255,255,.8); }
        @keyframes belluh-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .belluh-orbit { width: 0; height: 0; animation: belluh-orbit 38s linear infinite; }
        @keyframes belluh-rocket { 0% { transform: translate(-15vw, 105vh) rotate(0deg); } 100% { transform: translate(110vw, -20vh) rotate(0deg); } }
        .belluh-rocket { left: 0; top: 0; animation: belluh-rocket 16s linear infinite; animation-delay: -5s; }
        @keyframes belluh-comet { 0% { transform: translate(-10vw, 8vh); opacity: 0; } 8% { opacity: 1; } 60% { opacity: 1; } 100% { transform: translate(105vw, 48vh); opacity: 0; } }
        .belluh-comet { left: 0; top: 0; animation: belluh-comet 11s ease-in infinite; animation-delay: -3s; }
        @media (prefers-reduced-motion: reduce) { .belluh-star, .belluh-orbit, .belluh-rocket, .belluh-comet { animation: none; } }
        .maplibregl-ctrl-attrib { font-size: 10px; } .maplibregl-ctrl-bottom-right { bottom: 92px; } @media (min-width: 1024px) { .maplibregl-ctrl-bottom-right { bottom: 0; } }
      `}</style>
      <SolarSystem ref={sky} visible={space} />
      <div className="absolute inset-0"><div ref={box} style={{ width: '100%', height: '100%' }} /></div>
      {/* A toy globe: clouds and sparkles drift around it while you're zoomed out */}
      <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-700 ${far && !space ? 'opacity-100' : 'opacity-0'}`}>
        {[['☁️', '8%', '24%', 50, 0], ['☁️', '78%', '66%', 52, -1.5], ['✨', '84%', '20%', 24, -2]].map(([e, l, t, s, d], i) => (
          <span key={i} className="absolute belluh-float" style={{ left: l as string, top: t as string, animationDelay: `${d}s`, animationDuration: `${5 + i % 3}s` }}><Emoji e={e as string} size={(s as number) * 1.15} /></span>
        ))}
      </div>

      {/* The two ways to look: the whole world, or your places */}
      <div className="absolute z-10 top-0 right-0 px-4 md:px-6 pt-5 md:pt-6 flex items-center gap-2 pointer-events-none">
        <button type="button" onClick={() => mapRef.current?.flyTo({ zoom: 0.7, pitch: 0, bearing: 0, duration: 2200 })} className="pointer-events-auto h-12 px-4 rounded-full bg-white/90 backdrop-blur-xl border border-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.5)] inline-flex items-center gap-2 text-sm font-bold text-slate-800"><Emoji e="🌍" size={24} /><span className="hidden sm:inline">{T.globe}</span></button>
        {groups.length > 0 && <button type="button" onClick={() => fit()} className="pointer-events-auto h-12 px-4 rounded-full bg-white/90 backdrop-blur-xl border border-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.5)] inline-flex items-center gap-2 text-sm font-bold text-slate-800"><Emoji e="💞" size={24} /><span className="hidden sm:inline">{T.ours}</span></button>}
      </div>

      {/* The guide, after Pampam: a card on the left on laptops, a sheet at the bottom on phones. A cover photo, the
          title, search, your memories by month, and a memory's page with its date on a little calendar. */}
      {(() => {
        const pinned = groups.flat().sort((a, b) => +b.timestamp - +a.timestamp);
        const needle = q.trim().toLowerCase();
        const shown = needle ? pinned.filter(e => `${titleOf(e)} ${e.content} ${e.location ?? ''}`.toLowerCase().includes(needle)) : pinned;
        const months: [string, JournalEntry[]][] = [];
        shown.forEach(e => { const k = date(e.timestamp, { month: 'long', year: 'numeric' }); const last = months[months.length - 1]; if (last && last[0] === k) last[1].push(e); else months.push([k, [e]]); });
        const cover = pinned.find(e => e.mediaUrl)?.mediaUrl;
        const go = (e: JournalEntry) => { const g = groups.find(x => x.includes(e)) ?? [e]; setOpen(g); mapRef.current?.easeTo({ center: [e.lng!, e.lat!], zoom: Math.max(mapRef.current.getZoom(), 14), duration: 1000 }); };
        const Thumb = ({ e, big = false }: { e: JournalEntry; big?: boolean }) => e.mediaUrl
          ? <img src={e.mediaUrl} alt="" className={`${big ? 'w-12 h-12' : 'w-11 h-11'} shrink-0 rounded-xl object-cover border-2 border-white shadow-sm`} />
          : <span className="shrink-0 w-11 h-11 flex items-center justify-center"><Emoji e={emojiFor(e)} size={36} /></span>;
        const cal = (e: JournalEntry) => (
          <span className="absolute left-3 -bottom-6 w-14 rounded-xl bg-white shadow-[0_6px_16px_-6px_rgba(15,23,42,0.35)] overflow-hidden text-center">
            <span className="block bg-[#e5484d] text-white text-[11px] font-extrabold uppercase leading-[18px]">{date(e.timestamp, { month: 'short' }).replace('.', '')}</span>
            <span className="block text-[22px] font-extrabold text-slate-900 leading-[32px]">{e.timestamp.getDate()}</span>
          </span>
        );
        const body = open ? (
          <div className="px-4 pb-5">
            {open.map((e, i) => (
              <div key={e.id} className={i ? 'mt-8' : ''}>
                <div className="relative">
                  {e.mediaUrl ? <img src={e.mediaUrl} alt={T.photo} className="w-full h-44 object-cover rounded-2xl" /> : <div className="w-full h-32 rounded-2xl bg-[#fde9e1] flex items-center justify-center"><Emoji e={emojiFor(e)} size={64} /></div>}
                  {cal(e)}
                </div>
                <h2 className="mt-9 text-xl font-bold text-slate-900 leading-snug">{titleOf(e) || T.photo}</h2>
                <p className="mt-3 text-[12px] font-semibold text-slate-400">{T.dateLabel}</p>
                <p className="text-[15px] text-slate-800">{date(e.timestamp, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                {(e.location || countryOf(e.lng!, e.lat!)) && <><p className="mt-3 text-[12px] font-semibold text-slate-400">{T.placeLabel}</p><p className="text-[15px] text-slate-800">{e.location || countryOf(e.lng!, e.lat!)}</p></>}
                <div className="mt-4 flex items-center gap-2"><img src={e.authorAvatar} alt="" className="w-7 h-7 rounded-full bg-[#fde7f3] object-cover" /><span className="text-sm font-bold text-slate-700">{e.userId === currentUserId ? T.you : e.authorName}</span></div>
                {e.content && <p className="mt-3 font-serif text-[16px] leading-relaxed text-slate-800 whitespace-pre-line">{e.content}</p>}
                {e.audioUrl && <audio controls src={e.audioUrl} className="mt-3 w-full" aria-label={T.voice} />}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 pb-5">
            <div className="relative h-36 rounded-2xl overflow-hidden bg-[#fde9e1] flex items-center justify-center">
              {cover ? <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <Emoji e="🗺️" size={72} style={{ transform: 'rotate(-8deg)' }} />}
            </div>
            <h1 className="mt-4 font-serif text-[1.7rem] leading-tight text-slate-900">{T.title}</h1>
            <p className="mt-1 text-[15px] text-slate-500">{groups.length === 1 ? T.place : f(T.places, { n: groups.length })}</p>
            {pinned.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-[#fdf1ec] p-4">
                <p className="font-bold text-slate-900">{T.emptyTitle}</p>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{T.emptyBody}</p>
                {!on ? <button type="button" onClick={turnOn} className="mt-3 h-11 px-5 rounded-full bg-[#5e9db3] hover:bg-[#4f8ea4] text-white text-sm font-bold inline-flex items-center gap-2"><Emoji e="📍" size={18} />{T.turnOn}</button>
                  : <p className="mt-3 text-sm font-bold text-[#3f8aa3] inline-flex items-center gap-1.5"><Emoji e="✅" size={16} /> {T.pinned}</p>}
                {note && <p className="mt-2 text-[13px] text-slate-500">{note}</p>}
              </div>
            ) : months.length === 0 ? <p className="mt-6 text-sm text-slate-400">{T.noResults}</p> : months.map(([m, list]) => (
              <section key={m} className="mt-6">
                <h3 className="flex items-center justify-between text-[17px] font-bold text-slate-900">{m}<span className="text-slate-400 font-normal">→&#xFE0E;</span></h3>
                <div className="mt-2.5 space-y-2">
                  {list.map(e => (
                    <button key={e.id} type="button" onClick={() => go(e)} className="w-full text-left rounded-2xl bg-[#fdf1ec] hover:bg-[#fbe6dd] p-3 flex items-center gap-3">
                      <Thumb e={e} />
                      <span className="min-w-0">
                        <span className="block text-[15px] font-bold text-slate-900 truncate">{titleOf(e) || T.photo}</span>
                        <span className="block text-[13px] text-slate-500 line-clamp-2 leading-snug">{e.content || date(e.timestamp, { month: 'long', day: 'numeric' })}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        );
        return (
          <div className={`absolute z-20 flex flex-col rounded-[1.75rem] bg-white border border-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.4)] overflow-hidden transition-[max-height] duration-500
            inset-x-3 bottom-[104px] ${sheet ? 'max-h-[62vh]' : 'max-h-[64px]'}
            md:inset-x-auto md:left-5 md:top-5 md:bottom-5 md:w-[340px] md:max-h-none`}>
            <div className="shrink-0 p-3 flex items-center gap-2">
              {open ? <button type="button" onClick={() => setOpen(null)} aria-label={T.back} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 text-xl font-bold">←&#xFE0E;</button> : null}
              <label className="flex-1 h-10 rounded-full bg-slate-100 flex items-center gap-2 px-3.5" onFocus={() => setSheet(true)}>
                <Emoji e="🔍" size={16} />
                <input value={q} onChange={ev => { setQ(ev.target.value); setOpen(null); }} placeholder={T.search} aria-label={T.search} className="flex-1 min-w-0 bg-transparent text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none" />
              </label>
              <button type="button" onClick={() => setSheet(v => !v)} aria-label={sheet ? T.close : T.title} className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-slate-500 text-lg font-bold">{sheet ? '⌄' : '⌃'}</button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">{body}</div>
          </div>
        );
      })()}
    </div>
  );
};

export default LoveMap;
