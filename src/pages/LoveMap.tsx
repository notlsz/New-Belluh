// The love map, after Zenly, amo and Pampam: every entry, photo and voice note pinned where it happened, on a cartoon
// world. Zoomed out it's a globe of candy-colored countries floating in a pink sky; zoomed in, pastel streets and parks
// from OpenFreeMap. The world shapes ship with the app, so the globe always draws even if the street tiles can't load.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { feature, mesh } from 'topojson-client';
import world from 'world-atlas/countries-110m.json';
import { useI18n, useUi } from '../i18n';
import mapUi from '../i18n/ui/map';
import { EntryType, type JournalEntry } from '../types';
import { MOOD_EMOJIS } from '../constants';
import { herePlace, placesOn, setPlacesOn } from '../lib/places';
import { Emoji, emojiSrc } from '../lib/emoji3d';
import SolarSystem, { type SolarSystemHandle } from '../components/SolarSystem';

const OCEAN = '#7fd0f5', LAND = '#fff6e3';
const PALETTE = ['#ffd6a8', '#ffc4dc', '#c9f0b4', '#ffeb99', '#dccbff', '#b9e8f7'];
// Places on the map as emoji stickers, the way Pampam does it
const POI: Record<string, string> = { cafe: '☕', restaurant: '🍜', fast_food: '🍔', bar: '🍷', beer: '🍺', bakery: '🥐', ice_cream: '🍦', park: '🌳', garden: '🌷', museum: '🖼️', art_gallery: '🎨', cinema: '🎬', theatre: '🎭', music: '🎵', clothing_store: '👗', zoo: '🦒', aquarium: '🐠', castle: '🏰', attraction: '🎡', stadium: '🏟️', beach: '🏖️', campsite: '⛺', airport: '✈️', harbor: '⛵', florist: '💐', place_of_worship: '⛩️', playground: '🛝', swimming: '🏊', viewpoint: '🌅' };

// The world's countries, prepared once
const COUNTRIES = feature(world as any, (world as any).objects.countries) as any;
(() => {
  // Shapes that cross the date line (Russia's far east, Fiji) would draw a line around the whole globe. Split each one
  // into its eastern and western half, each pinned to the date line, so the whole country still shows.
  const wraps = (ring: number[][]) => ring.some((pt, i) => i > 0 && Math.abs(pt[0] - ring[i - 1][0]) > 180);
  const half = (ring: number[][], east: boolean) => ring.map(([lng, lat]) => [east ? (lng < 0 ? 180 : lng) : (lng > 0 ? -180 : lng), lat]);
  const fix = (polys: number[][][][]) => polys.flatMap(poly => wraps(poly[0]) ? [poly.map(r => half(r, true)), poly.map(r => half(r, false))] : [poly]);
  COUNTRIES.features.forEach((f: any, i: number) => {
    f.properties = { ...f.properties, c: i % PALETTE.length };
    const g = f.geometry; if (!g) return;
    if (g.type === 'Polygon' && wraps(g.coordinates[0])) f.geometry = { type: 'MultiPolygon', coordinates: fix([g.coordinates]) };
    else if (g.type === 'MultiPolygon') g.coordinates = fix(g.coordinates);
  });
})();

function styleFor(lang: string): StyleSpecification {
  const countries = COUNTRIES;
  const name: any = ['coalesce', ['get', `name:${lang}`], ['get', 'name']];
  return {
    version: 8,
    projection: { type: 'globe' },
    // Soft, even light so the toy buildings stay pastel on every side
    light: { anchor: 'viewport', color: '#ffffff', intensity: 0.12, position: [1.2, 210, 30] },
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      world: { type: 'geojson', data: countries },
      // Only the lines between two countries: no coastlines doubled, no cut along the date line
      borders: { type: 'geojson', data: mesh(world as any, (world as any).objects.countries, (a: any, b: any) => a !== b) as any },
      sea: { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]] } } as any },
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>' },
    },
    layers: [
      // Ocean far out, land up close (the street tiles draw the water on top)
      { id: 'bg', type: 'background', paint: { 'background-color': ['interpolate', ['linear'], ['zoom'], 4.8, OCEAN, 6, LAND] } },
      { id: 'countries', type: 'fill', source: 'world', paint: { 'fill-color': '#fff3df', 'fill-antialias': false, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 4.8, 1, 6, 0] } },
      // The countries you've been to together glow pink, like a scratch map
      { id: 'visited', type: 'fill', source: 'world', filter: ['in', ['get', 'name'], ['literal', []]], paint: { 'fill-color': '#ffbfd8', 'fill-antialias': false, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 4.8, 1, 6, 0] } },
      { id: 'borders', type: 'line', source: 'borders', paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 0, 1, 4, 2.5], 'line-opacity': ['interpolate', ['linear'], ['zoom'], 4.8, 1, 6, 0] } },
      { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', minzoom: 5, paint: { 'fill-color': '#a8e38a' } },
      { id: 'park-edge', type: 'line', source: 'omt', 'source-layer': 'park', minzoom: 11, paint: { 'line-color': '#8fd36b', 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 1.5, 16, 4] } },
      { id: 'green', type: 'fill', source: 'omt', 'source-layer': 'landcover', minzoom: 5, filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood', 'farmland']]], paint: { 'fill-color': '#d4f2c0', 'fill-opacity': 0.85 } },
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', minzoom: 4.5, paint: { 'fill-color': OCEAN, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 4.5, 0, 5.5, 1] } },
      // A cartoon edge on the water, like a drawn shoreline
      // Cartoon water: a light band just inside the shore and a deeper drawn edge, like Pampam
      { id: 'water-shine', type: 'line', source: 'omt', 'source-layer': 'water', minzoom: 9, paint: { 'line-color': '#c4eefc', 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 3, 16, 14], 'line-offset': ['interpolate', ['linear'], ['zoom'], 9, 1.5, 16, 7] } },
      { id: 'water-edge', type: 'line', source: 'omt', 'source-layer': 'water', minzoom: 9, paint: { 'line-color': '#45b4e6', 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.4, 16, 3.5] } },
      { id: 'river', type: 'line', source: 'omt', 'source-layer': 'waterway', minzoom: 8, paint: { 'line-color': OCEAN, 'line-width': 2.5 } },
      // Toy-town buildings: soft pastel blocks that stand up when the map tilts
      // Toy-town buildings in soft pastels, standing up as the city tilts
      { id: 'building', type: 'fill-extrusion', source: 'omt', 'source-layer': 'building', minzoom: 13.5, filter: ['>=', ['coalesce', ['get', 'render_height'], 0], 6], paint: { 'fill-extrusion-color': ['match', ['%', ['to-number', ['coalesce', ['get', 'render_height'], 0]], 5], 0, '#ffd3e4', 1, '#e3d6fb', 2, '#ffe2bf', 3, '#cdeedd', '#d3eaf8'], 'fill-extrusion-height': ['*', ['coalesce', ['get', 'render_height'], 8], 0.8], 'fill-extrusion-base': 0, 'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 13.5, 0, 14.5, 0.95], 'fill-extrusion-vertical-gradient': true } },
      { id: 'road-case', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 9, filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'street']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#f0e2cf', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 9, 2.2, 16, 24] } },
      { id: 'road', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 9, filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'street']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 9, 1.4, 16, 20] } },
      { id: 'main-road-case', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 9, filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#f2c25c', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 9, 2.6, 16, 28] } },
      { id: 'main-road', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 9, filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary']]], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffe48f', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 9, 1.6, 16, 22] } },
      { id: 'place', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 5, filter: ['in', ['get', 'class'], ['literal', ['city', 'town', 'suburb']]], layout: { 'text-field': name, 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 5, 11, 14, 15] }, paint: { 'text-color': '#7a6a8c', 'text-halo-color': '#ffffff', 'text-halo-width': 2 } },
      // Cafés, parks, museums...: emoji stickers, drawn on demand (see styleimagemissing)
      { id: 'poi', type: 'symbol', source: 'omt', 'source-layer': 'poi', minzoom: 15, filter: ['<=', ['get', 'rank'], 6], layout: { 'icon-image': ['concat', 'e:', ['coalesce', ['get', 'subclass'], ''], ':', ['get', 'class']], 'icon-size': ['interpolate', ['linear'], ['zoom'], 14, 0.42, 18, 0.62], 'icon-allow-overlap': false, 'icon-padding': 22 } },
      { id: 'country-label', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 1, maxzoom: 6, filter: ['==', ['get', 'class'], 'country'], layout: { 'text-field': name, 'text-font': ['Noto Sans Bold'], 'text-size': 11 }, paint: { 'text-color': '#9a8aa8', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 } },
    ],
  };
}

// The 3D place stickers, fetched as soon as the map opens so they're ready by the time you zoom into streets
const POI_IMG = new Map<string, HTMLImageElement>();
[...new Set(Object.values(POI))].forEach(e => { const src = emojiSrc(e); if (!src) return; const im = new Image(); im.onload = () => POI_IMG.set(e, im); im.src = src; });

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
    const zoomed = () => { const z = map.getZoom(); setFar(z < 3.2); setSpace(z < 0.85); };
    map.on('zoom', zoomed);
    map.on('zoomend', () => {
      const z = map.getZoom(), p = map.getPitch();
      if (z >= 13 && p < 20) map.easeTo({ pitch: 48, duration: 900 });
      else if (z < 8 && p > 0) map.easeTo({ pitch: 0, bearing: 0, duration: 900 });
    });
    // Turning the globe turns the sky behind it
    map.on('move', () => { const c = map.getCenter(); sky.current?.turn(c.lng, c.lat); });
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Which countries you've pinned something in (ray casting on the world shapes)
  const visited = useMemo(() => {
    const inRing = (pt: number[], ring: number[][]) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
    const names = new Set<string>();
    for (const g of groups) {
      const pt = [g[0].lng!, g[0].lat!];
      for (const f of COUNTRIES.features as any[]) {
        const polys = f.geometry?.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry?.coordinates ?? [];
        if (polys.some((poly: number[][][]) => inRing(pt, poly[0]))) { names.add(f.properties.name); break; }
      }
    }
    return [...names];
  }, [groups]);
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
      el.style.setProperty('--ring', mine ? '#f28cc6' : '#7cc3dc');
      el.style.setProperty('--tilt', `${(e.id.charCodeAt(0) % 3 - 1) * 5}deg`);
      const add = (tag: string, cls: string, set: (n: any) => void) => { const n = document.createElement(tag); if (cls) n.className = cls; set(n); el.appendChild(n); };
      if (e.mediaUrl) add('img', 'belluh-pin-photo', n => { n.src = e.mediaUrl; n.alt = ''; });
      else if (emojiSrc(emojiFor(e))) add('img', 'belluh-pin-emoji', n => { n.src = emojiSrc(emojiFor(e)); n.alt = ''; });
      else add('span', 'belluh-pin-emoji', n => { n.textContent = emojiFor(e); });
      if (e.authorAvatar) add('img', 'belluh-pin-face', n => { n.src = e.authorAvatar; n.alt = ''; });
      if (g.length > 1) add('span', 'belluh-pin-count', n => { n.textContent = String(g.length); });
      el.onclick = (ev) => { ev.stopPropagation(); setOpen(g); map.easeTo({ center: [e.lng!, e.lat!], zoom: Math.max(map.getZoom(), 15.5), pitch: 50, bearing: -12, duration: 1200 }); };
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
        map.addLayer({ id: 'path', type: 'line', source: 'path', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#f28cc6', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 2.5, 12, 4.5], 'line-dasharray': [0.2, 2.2], 'line-opacity': 0.9 } });
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
        .belluh-pin { width: 52px; height: 52px; rotate: var(--tilt, -4deg); border-radius: 9999px; background: #fff; border: 3px solid var(--ring); box-shadow: 0 12px 24px -10px rgba(15,23,42,.45); display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer; transition: scale .3s cubic-bezier(.34,1.56,.64,1); animation: belluh-pop .6s cubic-bezier(.34,1.56,.64,1) both; }
        .belluh-pin:hover { scale: 1.15; rotate: 0deg; } .belluh-pin:active { scale: .92; }
        .belluh-pin::after { content: ''; position: absolute; bottom: -9px; left: 50%; translate: -50% 0; border: 7px solid transparent; border-top-color: var(--ring); border-bottom: 0; }
        .belluh-pin-photo { width: 100%; height: 100%; object-fit: cover; border-radius: 9999px; }
        .belluh-pin-emoji { font-size: 31px; line-height: 1; } img.belluh-pin-emoji { width: 30px; height: 30px; }
        .belluh-pin-face { position: absolute; right: -8px; bottom: -6px; width: 24px; height: 24px; border-radius: 9999px; border: 2.5px solid #fff; background: #fde7f3; object-fit: cover; }
        .belluh-pin-count { position: absolute; top: -8px; right: -8px; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 9999px; background: #1e293b; color: #fff; font: 700 12px/22px Inter, system-ui, sans-serif; border: 2px solid #fff; }
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

      {/* Title and the two ways to look: the whole world, or your places */}
      <div className="absolute z-10 top-0 inset-x-0 px-4 md:px-6 pt-5 md:pt-6 flex items-start justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto rounded-[1.6rem] bg-white/85 backdrop-blur-xl border border-white shadow-[0_18px_40px_-22px_rgba(196,88,159,0.5)] px-5 py-3.5">
          <h1 className="font-serif text-[1.6rem] md:text-3xl leading-none text-slate-900">{T.title}</h1>
          <p className="mt-1.5 text-[13px] font-bold text-[#c4589f] inline-flex items-center gap-1.5"><Emoji e="📍" size={16} /> {groups.length === 1 ? T.place : f(T.places, { n: groups.length })}</p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button type="button" onClick={() => mapRef.current?.flyTo({ zoom: 1.25, pitch: 0, bearing: 0, duration: 2200 })} className="h-12 px-4 rounded-full bg-white/85 backdrop-blur-xl border border-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.5)] inline-flex items-center gap-2 text-sm font-bold text-slate-800"><Emoji e="🌍" size={24} /><span className="hidden sm:inline">{T.globe}</span></button>
          {groups.length > 0 && <button type="button" onClick={() => fit()} className="h-12 px-4 rounded-full bg-white/85 backdrop-blur-xl border border-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.5)] inline-flex items-center gap-2 text-sm font-bold text-slate-800"><Emoji e="💞" size={24} /><span className="hidden sm:inline">{T.ours}</span></button>}
        </div>
      </div>

      {/* Nothing pinned yet: a card for a few seconds, then just a small pill if places are still off */}
      {groups.length === 0 && !open && (
        <div className="absolute z-10 inset-x-0 bottom-32 md:bottom-36 lg:bottom-10 px-5 flex justify-center pointer-events-none">
          <div className={`relative w-full max-w-sm rounded-[2rem] bg-white/90 backdrop-blur-xl border border-white shadow-[0_24px_50px_-24px_rgba(196,88,159,0.6)] p-6 text-center transition-all duration-500 ${hint ? 'opacity-100 translate-y-0 pointer-events-auto belluh-pop' : 'opacity-0 translate-y-6'}`} aria-hidden={!hint}>
            <button type="button" onClick={() => setHint(false)} aria-label={T.close} className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 font-bold">✕&#xFE0E;</button>
            <Emoji e="🗺️" size={56} style={{ transform: 'rotate(-8deg)' }} />
            <h2 className="mt-3 font-serif text-2xl text-slate-900">{T.emptyTitle}</h2>
            <p className="mt-2 text-[15px] text-slate-500 leading-relaxed [text-wrap:pretty]">{T.emptyBody}</p>
            {!on ? (
              <button type="button" onClick={turnOn} className="mt-5 h-12 px-6 rounded-full bg-[#5e9db3] hover:bg-[#4f8ea4] text-white font-bold inline-flex items-center gap-2 shadow-[0_12px_24px_-12px_rgba(63,116,134,0.7)]"><Emoji e="📍" size={20} />{T.turnOn}</button>
            ) : (
              <p className="mt-4 text-sm font-bold text-[#3f8aa3] inline-flex items-center gap-1.5"><Emoji e="✅" size={18} /> {T.pinned}</p>
            )}
            {note && <p className="mt-3 text-[13px] text-slate-500">{note}</p>}
          </div>
          {!hint && !on && (
            <button type="button" onClick={turnOn} className="belluh-pop pointer-events-auto absolute bottom-0 h-12 px-5 rounded-full bg-white/90 backdrop-blur-xl border border-white shadow-[0_14px_30px_-16px_rgba(15,23,42,0.45)] inline-flex items-center gap-2 text-sm font-bold text-slate-800"><Emoji e="📍" size={20} />{T.turnOn}</button>
          )}
        </div>
      )}

      {/* What happened here */}
      {open && (
        <div className="absolute z-10 inset-x-0 bottom-28 md:bottom-32 lg:bottom-8 px-4 flex justify-center">
          <div className="belluh-pop w-full max-w-md max-h-[52vh] overflow-y-auto rounded-[2rem] bg-white/95 backdrop-blur-xl border border-white shadow-[0_24px_50px_-20px_rgba(15,23,42,0.45)] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-bold text-slate-400">{open[0].location || date(open[0].timestamp, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <button type="button" onClick={() => setOpen(null)} aria-label={T.close} className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 font-bold">✕&#xFE0E;</button>
            </div>
            <div className="space-y-5">
              {open.map(e => (
                <div key={e.id}>
                  <div className="flex items-center gap-2.5">
                    <img src={e.authorAvatar} alt="" className="w-8 h-8 rounded-full bg-[#fde7f3] object-cover" />
                    <p className="text-sm font-bold text-slate-800">{e.userId === currentUserId ? T.you : e.authorName}</p>
                    <p className="text-[13px] text-slate-400">{date(e.timestamp, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                    <Emoji e={emojiFor(e)} size={24} className="ml-auto" />
                  </div>
                  {e.mediaUrl && <img src={e.mediaUrl} alt={T.photo} className="mt-3 w-full max-h-72 object-cover rounded-[1.4rem]" />}
                  {e.content && <p className="mt-3 font-serif text-[17px] leading-relaxed text-slate-800 whitespace-pre-line">{e.content}</p>}
                  {e.audioUrl && <audio controls src={e.audioUrl} className="mt-3 w-full" aria-label={T.voice} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoveMap;
