// Privacy choices (GDPR, UK GDPR, Swiss FADP, CCPA/CPRA and the other US state laws), kept in one place.
// Belluh has no ads and no third-party tracking. What a person can choose:
//   necessary    always on: sign-in session, security, the private links to their photos and voice notes
//   preferences  convenience settings saved in this browser (language, time zone cache, sidebar, layout, theme)
//   usage        first-party product events for signed-in people (services/analytics.ts writes to analytics_events)
//   saleSharing  the US "sale or sharing" opt out; Global Privacy Control turns it on by itself
// The record lives in localStorage ('belluh_consent', versioned) and, when signed in, in public.privacy_consent.

import { detect } from '../i18n/core.ts';

export type Category = 'necessary' | 'preferences' | 'usage' | 'saleSharing';
export type Region = 'gdpr' | 'other';

export interface Consent {
  version: number;
  updatedAt: string;          // ISO timestamp of the choice
  preferences: boolean;
  usage: boolean;
  saleOptOut: boolean;        // true: do not sell or share
  gpc: boolean;               // Global Privacy Control was on when this was saved
  region: Region;
  source: 'banner' | 'center' | 'gpc' | 'server';
}
export type Choices = Pick<Consent, 'preferences' | 'usage' | 'saleOptOut'>;

export const CONSENT_KEY = 'belluh_consent';
export const CONSENT_VERSION = 1;
export const CONSENT_EVENT = 'belluh:consent';             // fired on window with the new Consent as detail
export const PRIVACY_CENTER_EVENT = 'belluh:privacy-center'; // dispatch on window to open the center
/** Convenience settings that only stay in the browser when preferences are on; cleared when they are turned off. */
export const PREFERENCE_KEYS = ['belluh_lang', 'belluh_sidebar', 'belluh_settings', 'belluh_space', 'belluh_shape', 'belluh_tz'];

const GDPR_COUNTRIES = new Set(['GB', 'CH', 'FR', 'IT', 'ES', 'PT']);
const EUROPE_TZ = /^(Europe\/|Atlantic\/(Canary|Madeira|Azores|Reykjavik|Faroe|Faeroe)$|Arctic\/Longyearbyen$)/;

/** Global Privacy Control: a browser signal that means "do not sell or share my data". */
export function honorsGpc(): boolean {
  try { return (navigator as any).globalPrivacyControl === true; } catch { return false; }
}

/** EEA, UK or Switzerland, from the browser's time zone (any Europe/* zone) and Belluh's own country detection. */
export function inGdprRegion(languages?: readonly string[], timeZone?: string): boolean {
  let langs = languages, tz = timeZone;
  try {
    if (!langs) langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    if (tz === undefined) tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch { /* defaults below */ }
  tz = tz ?? '';
  if (EUROPE_TZ.test(tz)) return true;
  return GDPR_COUNTRIES.has(detect(langs ?? ['en-US'], tz).country);
}

function read(): Consent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (!c || c.version !== CONSENT_VERSION || typeof c.preferences !== 'boolean') return null;
    return c as Consent;
  } catch { return null; }
}

/** Has this browser saved a choice yet? (The banner shows until it has.) */
export const hasChosen = () => read() !== null;

/** What applies before anyone chooses: preferences on (they are settings the person asked for), product events off in
 *  the GDPR region until they say yes, on elsewhere (opt out), and sale or sharing off whenever GPC is on. */
export function defaults(region: Region = inGdprRegion() ? 'gdpr' : 'other'): Consent {
  const gpc = honorsGpc();
  return { version: CONSENT_VERSION, updatedAt: '', preferences: true, usage: region !== 'gdpr', saleOptOut: gpc, gpc, region, source: gpc ? 'gpc' : 'center' };
}

/** The choice in force: what was saved, or the defaults. GPC always wins for sale or sharing. */
export function getConsent(): Consent {
  const c = read() ?? defaults();
  return honorsGpc() ? { ...c, saleOptOut: true, gpc: true } : c;
}

/** May Belluh keep or use data in this category? Wrap localStorage writes of convenience settings with it. */
export function canStore(category: Category): boolean {
  if (category === 'necessary') return true;
  const c = getConsent();
  if (category === 'preferences') return c.preferences;
  if (category === 'usage') return c.usage;
  return !c.saleOptOut;
}

/** Saves a choice on this device, clears convenience settings if preferences went off, tells the app, and keeps a copy
 *  on the account when signed in. */
export function setConsent(choices: Partial<Choices>, source: Consent['source'] = 'center', at = new Date().toISOString()): Consent {
  const prev = getConsent();
  const gpc = honorsGpc();
  const next: Consent = {
    version: CONSENT_VERSION, updatedAt: at,
    preferences: choices.preferences ?? prev.preferences,
    usage: choices.usage ?? prev.usage,
    saleOptOut: gpc ? true : (choices.saleOptOut ?? prev.saleOptOut),
    gpc, region: inGdprRegion() ? 'gdpr' : 'other', source,
  };
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(next)); } catch { /* storage off: applies for this visit */ }
  if (!next.preferences) for (const k of PREFERENCE_KEYS) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
  try { window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: next })); } catch { /* no window */ }
  if (source !== 'server') void saveToAccount(next);
  return next;
}

/** Copies the choice to public.privacy_consent for the signed-in person (best effort). */
export async function saveToAccount(c: Consent = getConsent()): Promise<void> {
  try {
    const { supabase } = await import('./supabaseClient');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from('privacy_consent').upsert({ user_id: session.user.id, consent: c, updated_at: c.updatedAt || new Date().toISOString() }, { onConflict: 'user_id' });
  } catch { /* offline or table not there yet */ }
}

/** Brings a choice saved on the account to this browser when it is newer than the one here (e.g. a new device). */
export async function loadFromAccount(): Promise<Consent | null> {
  try {
    const { supabase } = await import('./supabaseClient');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const { data } = await supabase.from('privacy_consent').select('consent, updated_at').eq('user_id', session.user.id).maybeSingle();
    const remote = data?.consent as Consent | undefined;
    if (!remote || remote.version !== CONSENT_VERSION) return null;
    const local = read();
    if (local && local.updatedAt >= (remote.updatedAt || '')) { if (local.updatedAt > (remote.updatedAt || '')) void saveToAccount(local); return local; }
    return setConsent(remote, 'server', remote.updatedAt);
  } catch { return null; }
}

/** Opens the Privacy Preference Center from anywhere (footer "Your privacy choices", Settings, the banner). */
export function openPrivacyCenter(): void {
  try { window.dispatchEvent(new Event(PRIVACY_CENTER_EVENT)); } catch { /* no window */ }
}
