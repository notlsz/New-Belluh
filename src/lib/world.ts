// The world's countries (Natural Earth 1:110m via world-atlas), prepared once: shapes that cross the date line (Russia's
// far east, Fiji) are split into an eastern and a western half so they draw on a globe and on a flat map. Also: which
// country a point is in, and a flat SVG path of the world for small maps.
import { feature, mesh } from 'topojson-client';
import world from 'world-atlas/countries-110m.json';

export const COUNTRIES = feature(world as any, (world as any).objects.countries) as any;
(() => {
  const wraps = (ring: number[][]) => ring.some((pt, i) => i > 0 && Math.abs(pt[0] - ring[i - 1][0]) > 180);
  const half = (ring: number[][], east: boolean) => ring.map(([lng, lat]) => [east ? (lng < 0 ? 180 : lng) : (lng > 0 ? -180 : lng), lat]);
  const fix = (polys: number[][][][]) => polys.flatMap(poly => wraps(poly[0]) ? [poly.map(r => half(r, true)), poly.map(r => half(r, false))] : [poly]);
  COUNTRIES.features.forEach((f: any) => {
    const g = f.geometry; if (!g) return;
    if (g.type === 'Polygon' && wraps(g.coordinates[0])) f.geometry = { type: 'MultiPolygon', coordinates: fix([g.coordinates]) };
    else if (g.type === 'MultiPolygon') g.coordinates = fix(g.coordinates);
  });
})();

/** Only the lines between two countries (no coastlines doubled, no cut along the date line) */
export const BORDERS = mesh(world as any, (world as any).objects.countries, (a: any, b: any) => a !== b) as any;

const polysOf = (f: any): number[][][][] => f.geometry?.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry?.coordinates ?? [];
const inRing = (pt: number[], ring: number[][]) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; };

/** The country (its English name) a point is in, if any */
export function countryOf(lng: number, lat: number): string | null {
  for (const f of COUNTRIES.features as any[]) if (polysOf(f).some(poly => inRing([lng, lat], poly[0]))) return f.properties.name;
  return null;
}

/** The world as flat SVG paths (equirectangular), one per country, for small maps */
export function worldPaths(w: number, h: number): { name: string; d: string }[] {
  const x = (lng: number) => ((lng + 180) / 360 * w).toFixed(1), y = (lat: number) => ((90 - lat) / 180 * h).toFixed(1);
  return (COUNTRIES.features as any[]).filter(f => f.properties.name !== 'Antarctica').map(f => ({
    name: f.properties.name,
    d: polysOf(f).map(poly => poly.map(ring => 'M' + ring.map(([a, b]) => `${x(a)},${y(b)}`).join('L') + 'Z').join('')).join(''),
  }));
}

/** How many countries there are on the map (for "% of the world") */
export const COUNTRY_COUNT = (COUNTRIES.features as any[]).filter(f => f.properties.name !== 'Antarctica').length;
