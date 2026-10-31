// Guides inside the map, after Pampam: your guides and the community's, and a guide's own page where you name it, add
// places or countries by searching, and share it (just the two of you, anyone with the link, or everyone on Belluh).
// While a guide is open its places are the pins on the map, and its countries light up on the globe.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useI18n, useUi } from '../i18n';
import guidesUi from '../i18n/ui/guides';
import { Emoji, emojiSrc } from '../lib/emoji3d';
import { countryOf } from '../lib/world';
import { guides as api, guideUrl, searchPlaces, KIND_EMOJI, type Guide, type GuideKind, type Found, type Visibility } from '../services/guides';

interface Props {
  me: string;
  myName: string | null;
  map: () => maplibregl.Map | null;
  /** A guide is open: show only its pins, and light up these countries (null when closed) */
  onFocus: (countries: string[] | null) => void;
}

const KINDS: GuideKind[] = ['travel', 'food', 'bars', 'countries', 'other'];

const GuidesPanel: React.FC<Props> = ({ me, myName, map, onFocus }) => {
  const { f, lang } = useI18n();
  const T = useUi(guidesUi);
  const [ours, setOurs] = useState<Guide[] | null>(null);
  const [community, setCommunity] = useState<Guide[]>([]);
  const [open, setOpen] = useState<Guide | null>(null);
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Found[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const mine = !!open && (ours ?? []).some(g => g.id === open.id);

  const load = () => { api.ours().then(setOurs); api.community(me).then(setCommunity); };
  useEffect(load, [me]);

  // Search places as they type, near where the map is looking
  useEffect(() => {
    if (q.trim().length < 2) { setFound([]); return; }
    setBusy(true);
    const t = setTimeout(async () => { const c = map()?.getCenter(); setFound(await searchPlaces(q, c ? { lat: c.lat, lng: c.lng } : undefined, lang)); setBusy(false); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  // The open guide's places as pins: a 3D sticker and a bold name, like Pampam
  const countries = useMemo(() => open ? [...new Set(open.places.filter(p => p.kind === 'country').map(p => countryOf(p.lng, p.lat) ?? p.name))] : null, [open]);
  useEffect(() => {
    onFocus(countries);
    const m = map(); if (!m || !open) return;
    const markers = open.places.filter(p => p.kind === 'place').map(p => {
      const el = document.createElement('div'); el.className = 'belluh-pin guide-pin';
      const stk = document.createElement('span'); stk.className = 'belluh-pin-stk';
      const src = emojiSrc(p.emoji || '📍');
      const pic = document.createElement(src ? 'img' : 'span') as any; pic.className = 'belluh-pin-emoji';
      if (src) { pic.src = src; pic.alt = ''; } else pic.textContent = p.emoji || '📍';
      stk.appendChild(pic); el.appendChild(stk);
      const label = document.createElement('span'); label.className = 'belluh-pin-label'; label.textContent = p.name; el.appendChild(label);
      return new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.lng, p.lat]).addTo(m);
    });
    return () => markers.forEach(x => x.remove());
  }, [open]);
  useEffect(() => () => onFocus(null), []);

  const frame = (g: Guide) => {
    const m = map(); if (!m || !g.places.length) return;
    if (g.places.length === 1) { m.flyTo({ center: [g.places[0].lng, g.places[0].lat], zoom: g.places[0].kind === 'country' ? 3.5 : 13, duration: 1400 }); return; }
    const b = new maplibregl.LngLatBounds(); g.places.forEach(p => b.extend([p.lng, p.lat]));
    m.fitBounds(b, { padding: { top: 120, bottom: 160, left: window.innerWidth >= 768 ? 400 : 50, right: 60 }, maxZoom: 14, duration: 1400 });
  };
  const show = (g: Guide) => { setOpen(g); setQ(''); setFound([]); frame(g); };

  const create = async () => {
    const g = await api.create({ title: T.untitled, emoji: '🗺️', kind: 'travel', author_name: myName });
    if (g) { setOurs(o => [g, ...(o ?? [])]); show(g); }
  };
  const patch = (p: Partial<Guide>) => {
    if (!open) return;
    const next = { ...open, ...p }; setOpen(next); setOurs(o => (o ?? []).map(g => g.id === next.id ? next : g));
    api.update(open.id, p as any);
  };
  const add = async (x: Found) => {
    if (!open) return;
    const p = await api.addPlace(open.id, { name: x.name, kind: x.kind, country: x.country, lat: x.lat, lng: x.lng, emoji: x.emoji }, open.places.length);
    if (!p) return;
    const next = { ...open, places: [...open.places, p] }; setOpen(next); setOurs(o => (o ?? []).map(g => g.id === next.id ? next : g));
    setQ(''); setFound([]); frame(next);
  };
  const drop = async (id: string) => {
    if (!open || !(await api.removePlace(id))) return;
    const next = { ...open, places: open.places.filter(p => p.id !== id) }; setOpen(next); setOurs(o => (o ?? []).map(g => g.id === next.id ? next : g));
  };
  const share = async (how: 'copy' | 'x' | 'native') => {
    if (!open) return;
    if (open.visibility === 'us') patch({ visibility: 'link' });
    const url = guideUrl(open.slug), text = `${open.emoji} ${open.title}`;
    if (how === 'x') window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener');
    else if (how === 'native' && navigator.share) navigator.share({ title: text, url }).catch(() => {});
    else { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard off */ } }
  };

  const Row = ({ g }: { g: Guide }) => (
    <button type="button" onClick={() => show(g)} className="w-full text-left rounded-2xl bg-[#fdf1ec] hover:bg-[#fbe6dd] p-3 flex items-center gap-3">
      <span className="w-11 h-11 shrink-0 flex items-center justify-center"><Emoji e={g.emoji} size={36} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-slate-900 truncate">{g.title}</span>
        <span className="block text-[13px] text-slate-500 truncate">{g.places.length === 1 ? T.place : f(T.places, { n: g.places.length })}{g.author_name && g.user_id !== me ? `, ${f(T.by, { name: g.author_name })}` : ''}</span>
      </span>
      {g.visibility !== 'us' && <Emoji e={g.visibility === 'public' ? '🌍' : '🔗'} size={18} />}
    </button>
  );

  if (open) return (
    <div className="px-4 pb-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => { setOpen(null); load(); }} aria-label="←" className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 text-xl font-bold">←&#xFE0E;</button>
        <Emoji e={open.emoji} size={40} />
        {mine
          ? <input value={open.title} onChange={e => patch({ title: e.target.value.slice(0, 80) || T.untitled })} aria-label={T.titlePh} placeholder={T.titlePh} className="min-w-0 flex-1 text-xl font-bold text-slate-900 bg-transparent focus:outline-none" />
          : <h2 className="min-w-0 flex-1 text-xl font-bold text-slate-900">{open.title}</h2>}
      </div>
      {mine ? (
        <>
          <textarea value={open.description ?? ''} onChange={e => patch({ description: e.target.value.slice(0, 600) })} placeholder={T.descPh} rows={2} className="mt-3 w-full resize-none rounded-2xl bg-slate-50 px-3.5 py-2.5 text-[15px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9bbecb]" />
          <div className="mt-3 flex flex-wrap gap-2">
            {KINDS.map(k => (
              <button key={k} type="button" onClick={() => patch({ kind: k, emoji: KIND_EMOJI[k] })} className={`h-9 px-3 rounded-full inline-flex items-center gap-1.5 text-[13px] font-bold ${open.kind === k ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Emoji e={KIND_EMOJI[k]} size={16} />{T.kinds[k]}</button>
            ))}
          </div>
        </>
      ) : (
        <>
          {open.description && <p className="mt-3 text-[15px] text-slate-600 leading-relaxed">{open.description}</p>}
          {open.author_name && <p className="mt-2 text-[13px] font-semibold text-slate-400">{f(T.by, { name: open.author_name })}</p>}
        </>
      )}

      {mine && (
        <div className="mt-5 relative">
          <label className="h-11 rounded-full bg-slate-100 flex items-center gap-2 px-3.5">
            <Emoji e="🔍" size={16} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={T.addPlace} aria-label={T.addPlace} className="flex-1 min-w-0 bg-transparent text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none" />
          </label>
          {(found.length > 0 || (busy && q.length > 1)) && (
            <div className="mt-2 rounded-2xl border border-slate-100 bg-white shadow-[0_12px_30px_-18px_rgba(15,23,42,0.4)] overflow-hidden">
              {busy && !found.length ? <p className="px-4 py-3 text-sm text-slate-400">{T.searching}</p> : found.map((x, i) => (
                <button key={i} type="button" onClick={() => add(x)} className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-[#fdf1ec]">
                  <Emoji e={x.emoji} size={24} />
                  <span className="min-w-0"><span className="block text-[15px] font-semibold text-slate-900 truncate">{x.name}</span>{x.detail && <span className="block text-[12px] text-slate-500 truncate">{x.detail}</span>}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {open.places.map(p => (
          <div key={p.id} className="rounded-2xl bg-[#fdf1ec] p-3 flex items-center gap-3">
            <button type="button" onClick={() => map()?.flyTo({ center: [p.lng, p.lat], zoom: p.kind === 'country' ? 4 : 15, duration: 1200 })} className="min-w-0 flex-1 flex items-center gap-3 text-left">
              <span className="w-10 h-10 shrink-0 flex items-center justify-center"><Emoji e={p.emoji || '📍'} size={32} /></span>
              <span className="min-w-0"><span className="block text-[15px] font-bold text-slate-900 truncate">{p.name}</span>{p.kind === 'place' && p.country && <span className="block text-[12px] text-slate-500 truncate">{p.country}</span>}</span>
            </button>
            {mine && <button type="button" onClick={() => drop(p.id)} aria-label={T.remove} className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 font-bold">✕&#xFE0E;</button>}
          </div>
        ))}
      </div>

      {/* Share it: who can see it, then the link anywhere (Instagram, X, messages) */}
      <div className="mt-6">
        <h3 className="text-[17px] font-bold text-slate-900">{T.share}</h3>
        {mine && (
          <div className="mt-2.5 grid grid-cols-1 gap-2">
            {(['us', 'link', 'public'] as Visibility[]).map(v => (
              <button key={v} type="button" onClick={() => patch({ visibility: v })} className={`text-left rounded-2xl px-3.5 py-2.5 border-2 ${open.visibility === v ? 'border-[#5e9db3] bg-[#eef6f9]' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}>
                <span className="flex items-center gap-2 text-[15px] font-bold text-slate-900"><Emoji e={v === 'us' ? '🔒' : v === 'link' ? '🔗' : '🌍'} size={18} />{T.vis[v]}</span>
                <span className="block mt-0.5 text-[13px] text-slate-500">{T.visHint[v]}</span>
              </button>
            ))}
          </div>
        )}
        {(open.visibility !== 'us' || mine) && (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => share('copy')} className="h-10 px-4 rounded-full bg-[#5e9db3] hover:bg-[#4f8ea4] text-white text-sm font-bold inline-flex items-center gap-2"><Emoji e="🔗" size={16} />{copied ? T.copied : T.copy}</button>
              <button type="button" onClick={() => share('x')} className="h-10 px-4 rounded-full bg-slate-900 hover:bg-black text-white text-sm font-bold inline-flex items-center">{T.shareX}</button>
              {typeof navigator !== 'undefined' && 'share' in navigator && <button type="button" onClick={() => share('native')} className="h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold inline-flex items-center gap-2"><Emoji e="📤" size={16} />{T.shareMore}</button>}
            </div>
            <p className="mt-2 text-[12px] text-slate-400">{T.igHint}</p>
          </>
        )}
        {mine && <button type="button" onClick={async () => { if (await api.remove(open.id)) { setOurs(o => (o ?? []).filter(g => g.id !== open.id)); setOpen(null); } }} className="mt-5 text-[13px] font-semibold text-slate-400 hover:text-red-500">{T.del}</button>}
      </div>
    </div>
  );

  return (
    <div className="px-4 pb-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-bold text-slate-900">{T.ours}</h3>
        <button type="button" onClick={create} className="h-9 px-3.5 rounded-full bg-[#5e9db3] hover:bg-[#4f8ea4] text-white text-[13px] font-bold inline-flex items-center gap-1.5"><span className="text-base leading-none">+&#xFE0E;</span>{T.newGuide}</button>
      </div>
      <div className="mt-2.5 space-y-2">
        {ours === null ? <div className="h-16 rounded-2xl bg-slate-50 animate-pulse" /> : ours.length === 0
          ? <p className="rounded-2xl bg-[#fdf1ec] p-4 text-sm text-slate-600 leading-relaxed">{T.noGuides}</p>
          : ours.map(g => <Row key={g.id} g={g} />)}
      </div>
      {community.length > 0 && (
        <>
          <h3 className="mt-6 text-[17px] font-bold text-slate-900">{T.community}</h3>
          <div className="mt-2.5 space-y-2">{community.map(g => <Row key={g.id} g={g} />)}</div>
        </>
      )}
    </div>
  );
};

export default GuidesPanel;
