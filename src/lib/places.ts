// Where an entry was written, for the love map. Off until they turn it on; then a photo's own GPS wins (it says where
// the picture was taken), else where the phone is as they write. Rounded to about 10 m.
const KEY = 'belluh_places';
export const placesOn = () => { try { return localStorage.getItem(KEY) === 'on'; } catch { return false; } };
export const setPlacesOn = (on: boolean) => { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* storage off */ } };
const round = (x: number) => Math.round(x * 1e4) / 1e4;
const ok = (lat: unknown, lng: unknown) => typeof lat === 'number' && typeof lng === 'number' && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

export async function photoPlace(file: File): Promise<{ lat: number; lng: number } | null> {
  try {
    const { gps } = await import('exifr');
    const g = await gps(file);
    return g && ok(g.latitude, g.longitude) ? { lat: round(g.latitude), lng: round(g.longitude) } : null;
  } catch { return null; }
}

export function herePlace(timeout = 6000): Promise<{ lat: number; lng: number } | null> {
  return new Promise(resolve => {
    if (!('geolocation' in navigator)) return resolve(null);
    const t = setTimeout(() => resolve(null), timeout + 500);
    navigator.geolocation.getCurrentPosition(
      p => { clearTimeout(t); resolve(ok(p.coords.latitude, p.coords.longitude) ? { lat: round(p.coords.latitude), lng: round(p.coords.longitude) } : null); },
      () => { clearTimeout(t); resolve(null); },
      { enableHighAccuracy: false, timeout, maximumAge: 5 * 60_000 },
    );
  });
}

/** Where to pin this entry, or nothing if places are off or nothing is known. */
export async function whereFor(photo: File | null): Promise<{ lat: number; lng: number } | null> {
  if (!placesOn()) return null;
  return (photo ? await photoPlace(photo) : null) ?? await herePlace();
}
