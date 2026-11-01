// Google Analytics 4 and Mixpanel, loaded only when someone allows "Improving Belluh" in the Privacy Preference
// Center (off until chosen in the EEA, UK and Switzerland; off when the browser sends Global Privacy Control).
// Each tool loads only when its key is set in the environment: VITE_GA_MEASUREMENT_ID (G-XXXXXXX) and
// VITE_MIXPANEL_TOKEN (optionally VITE_MIXPANEL_API_HOST, e.g. https://api-eu.mixpanel.com for an EU project).
// No advertising features: Google signals and ad personalization are off, and nothing is used for ads.
import { canStore, honorsGpc, CONSENT_EVENT } from './consent';

const GA_ID = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID as string | undefined;
const MP_TOKEN = (import.meta as any).env?.VITE_MIXPANEL_TOKEN as string | undefined;
const MP_HOST = (import.meta as any).env?.VITE_MIXPANEL_API_HOST as string | undefined;

declare global { interface Window { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; [k: `ga-disable-${string}`]: boolean } }

let gaLoaded = false, mp: any = null, mpLoading: Promise<any> | null = null;
const allowed = () => canStore('usage') && !honorsGpc();

function loadGa() {
  if (!GA_ID || gaLoaded || typeof document === 'undefined') return;
  gaLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer!.push(arguments); };
  // Consent Mode v2: analytics only, never ads
  window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false, send_page_view: false });
  const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}
async function loadMp() {
  if (!MP_TOKEN) return null;
  if (mp) return mp;
  mpLoading ??= import('mixpanel-browser').then(m => {
    const lib = (m as any).default ?? m;
    lib.init(MP_TOKEN, { api_host: MP_HOST || undefined, persistence: 'localStorage', track_pageview: false, ip: false, property_blacklist: ['$current_url_search'] });
    mp = lib; return lib;
  }).catch(() => null);
  return mpLoading;
}

/** Turn the tools on or off to match the person's current choice */
export function syncTrackers() {
  const on = allowed();
  if (GA_ID) {
    (window as any)[`ga-disable-${GA_ID}`] = !on;
    if (on) loadGa(); else if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
  }
  if (MP_TOKEN) {
    if (on) loadMp().then(l => l?.opt_in_tracking?.());
    else if (mp) { mp.opt_out_tracking(); mp.reset(); }
  }
}

export function pageView(path = typeof location !== 'undefined' ? location.pathname : '/') {
  if (!allowed()) return;
  // Never send query strings or hashes: they can carry invite codes and private ids
  if (GA_ID && window.gtag) window.gtag('event', 'page_view', { page_path: path, page_location: `${location.origin}${path}` });
  if (MP_TOKEN) loadMp().then(l => l?.track('Page view', { path }));
}

export function sendEvent(name: string, props: Record<string, unknown> = {}) {
  if (!allowed()) return;
  // Only plain values go out: no free text a person wrote
  const safe: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props)) if (typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'string' && v.length <= 60)) safe[k] = v;
  if (GA_ID && window.gtag) window.gtag('event', name.replace(/[^a-z0-9_]/gi, '_').slice(0, 40), safe);
  if (MP_TOKEN) loadMp().then(l => l?.track(name, safe));
}

/** Link events to a signed-in person by their random Belluh id only (never name or email) */
export function identify(userId: string | null) {
  if (!allowed() || !userId) return;
  if (GA_ID && window.gtag) window.gtag('config', GA_ID, { user_id: userId, send_page_view: false });
  if (MP_TOKEN) loadMp().then(l => l?.identify(userId));
}

let started = false;
export function startTrackers() {
  if (started || typeof window === 'undefined') return;
  started = true;
  syncTrackers(); pageView();
  window.addEventListener(CONSENT_EVENT, () => { syncTrackers(); pageView(); });
  window.addEventListener('popstate', () => pageView());
  const push = history.pushState.bind(history);
  history.pushState = (...a: Parameters<History['pushState']>) => { push(...a); setTimeout(() => pageView(), 0); };
}
