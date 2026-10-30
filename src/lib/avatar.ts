// Generated avatars stay friendly: the cartoon generator otherwise picks any mouth and eyes, including a green
// tongue, x-ed out eyes or tears, which read as a glitch on a love journal. Applied to new and already-saved avatars.
const CALM = 'mouth=smile,default,twinkle&eyes=default,happy,wink&eyebrows=default,defaultNatural,raisedExcitedNatural&facialHairProbability=0&accessoriesProbability=0';

export function calmAvatar(url: string | null | undefined): string | undefined {
  if (!url) return url ?? undefined;
  if (!/api\.dicebear\.com\/[^/]+\/avataaars\//.test(url) || /[?&]mouth=/.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${CALM}`;
}

export const avatarFor = (seed: string) => calmAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`)!;
