// belluh.com links open the app (Universal Links on iOS, App Links on Android): an invite (?invite=...), Our
// Afterglow (/afterglow) or any page. The app reads where it is when it starts, so a link loads that page in place.

const HOSTS = new Set(['belluh.com', 'www.belluh.com']);

/** The page inside the app for a link, or null when it isn't one of Belluh's */
export function inAppPath(link: string): string | null {
  let u: URL;
  try { u = new URL(link); } catch { return null; }
  if (u.protocol !== 'https:' || !HOSTS.has(u.hostname.toLowerCase())) return null;
  // Files the site serves on its own (the association files, images) stay on the web
  if (u.pathname.startsWith('/.well-known/')) return null;
  return `${u.pathname || '/'}${u.search}${u.hash}`;
}

export interface LinkDeps {
  current: () => string;
  go: (path: string) => void;
}

/** Opens a link's page unless the app is already there */
export function openLink(link: string, d: LinkDeps): boolean {
  const path = inAppPath(link);
  if (!path || path === d.current()) return false;
  d.go(path);
  return true;
}

const here = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;
const load = (path: string) => window.location.assign(path);

/** The link that launched the app, and every link after */
export async function listenForLinks(): Promise<void> {
  const { App } = await import('@capacitor/app');
  const d = { current: here, go: load };
  await App.addListener('appUrlOpen', e => { openLink(e.url, d); });
  try { const l = await App.getLaunchUrl(); if (l?.url) openLink(l.url, d); } catch { /* launched from the icon */ }
}
