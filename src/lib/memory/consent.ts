// Belluh Memory's permissions, after Rollup's privacy guide. Asked separately from the cookie choices:
//   ai       AI answers from your photos: dates, places, labels and text read from images go to Belluh and its AI
//            provider (Google Gemini) to answer, and are not stored. Asked once, before the first query or profile.
//   places   naming places: ~1 km areas where photos were taken go to Belluh's server
//   people   grouping faces on this device (biometric): off unless the person agrees
// Kept on this device (localStorage), like the index itself: the app sends consent: true only while ai is on, and the
// memory-agent refuses any call without it. Belluh is for adults; Memory is never offered to anyone under 18.

export interface MemoryConsent { ai: boolean; places: boolean; people: boolean; aiAt: string | null; peopleAt: string | null }
export const MEMORY_CONSENT_KEY = 'belluh_memory_consent';
export const MEMORY_CONSENT_EVENT = 'belluh:memory-consent';
const OFF: MemoryConsent = { ai: false, places: false, people: false, aiAt: null, peopleAt: null };

export function getMemoryConsent(): MemoryConsent {
  try {
    const c = JSON.parse(localStorage.getItem(MEMORY_CONSENT_KEY) ?? 'null');
    if (c && typeof c === 'object') return { ...OFF, ai: c.ai === true, places: c.places === true, people: c.people === true, aiAt: c.aiAt ?? null, peopleAt: c.peopleAt ?? null };
  } catch { /* storage off: nothing allowed */ }
  return { ...OFF };
}

export function setMemoryConsent(next: Partial<MemoryConsent>, now = new Date().toISOString()): MemoryConsent {
  const prev = getMemoryConsent();
  const c: MemoryConsent = {
    ...prev, ...next,
    aiAt: next.ai === true && !prev.ai ? now : next.ai === false ? null : prev.aiAt,
    peopleAt: next.people === true && !prev.people ? now : next.people === false ? null : prev.peopleAt,
  };
  try { localStorage.setItem(MEMORY_CONSENT_KEY, JSON.stringify(c)); } catch { /* storage off: applies for this visit */ }
  try { window.dispatchEvent(new CustomEvent(MEMORY_CONSENT_EVENT, { detail: c })); } catch { /* no window */ }
  return c;
}

/** May the app call the memory agent right now? */
export const aiAllowed = () => getMemoryConsent().ai;
