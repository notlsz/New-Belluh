// Discreet mode (docs/growth/global-decisions.md): on by default in the markets that criminalise same-sex relations,
// opt-in everywhere else. While it's on, anything that could out a couple stays out of what they share by default:
// for now, which dating app they met on. A choice saved on this device (belluh_discreet: on or off) wins over the
// default; it never reaches analytics. Pure apart from the storage read, so it's unit-tested.

/** The 22 accessible top-100 markets that criminalise same-sex relations, from global-decisions.md */
export const DISCREET_DEFAULT = new Set(['AE', 'SA', 'MY', 'ID', 'EG', 'QA', 'KW', 'BD', 'PK', 'UZ', 'NG', 'OM', 'DZ', 'MA', 'IQ', 'LK', 'GH', 'KE', 'TN', 'JM', 'LB', 'BN']);

const KEY = 'belluh_discreet';

/** On when the person turned it on, or when they live where it's the default and haven't turned it off */
export function discreetOn(country: string | null | undefined, saved: string | null): boolean {
  if (saved === 'on') return true;
  if (saved === 'off') return false;
  return DISCREET_DEFAULT.has(String(country ?? '').toUpperCase());
}

export function readDiscreet(country: string | null | undefined): boolean {
  let saved: string | null = null;
  try { saved = localStorage.getItem(KEY); } catch { /* storage off */ }
  return discreetOn(country, saved);
}
