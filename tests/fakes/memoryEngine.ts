// An in-memory MemoryEngine for tests and the dev harness: a handful of indexed photos and text tools over them.
// It follows the contract in src/lib/memory/types.ts; the real engine lives in src/lib/memory (on-device index).
import type { IndexOptions, IndexedItem, IndexingState, MemoryEngine, SearchResults, ToolCall, ToolResult, Interest, Facet, Person, SearchResult } from '../../src/lib/memory/types.ts';

const item = (id: string, date: string, city: string, country: string, place: string | null, kind: string, labels: string[], extra: Partial<IndexedItem> = {}): IndexedItem => ({
  id, date, mediaType: 'photo', location: { city, country, lat: 0, lng: 0 }, places: place ? [{ name: place, kind }] : [],
  cuisines: [], labels: labels.map(name => ({ name, p: 0.9 })), text: null, sensitivity: null, people: [], ...extra,
});

export const FAKE_ITEMS: IndexedItem[] = [
  item('p1', '2025-05-03T09:12:00Z', 'Lisbon', 'Portugal', 'Time Out Market', 'food hall', ['seafood', 'market']),
  item('p2', '2025-05-04T20:40:00Z', 'Lisbon', 'Portugal', 'Cervejaria Ramiro', 'restaurant', ['seafood', 'dinner'], { cuisines: ['Portuguese'] }),
  item('p3', '2024-09-14T21:00:00Z', 'Brooklyn', 'United States', 'Elsewhere', 'venue', ['concert', 'crowd']),
  item('p4', '2025-02-08T08:05:00Z', 'Brooklyn', 'United States', 'Cha Cha Matcha', 'cafe', ['matcha', 'drink']),
  item('p5', '2025-03-15T07:30:00Z', 'Brooklyn', 'United States', 'Prospect Park', 'park', ['running', 'sunrise']),
  item('p6', '2025-03-22T07:20:00Z', 'Brooklyn', 'United States', 'Prospect Park', 'park', ['running']),
  item('p7', '2024-04-10T12:00:00Z', 'Tokyo', 'Japan', 'Ichiran Shibuya', 'restaurant', ['ramen'], { cuisines: ['Japanese'] }),
  item('p8', '2025-01-02T12:00:00Z', 'Brooklyn', 'United States', 'City Clinic', 'clinic', ['waiting room'], { sensitivity: 'health' }),
];

const line = (i: IndexedItem) => `${i.date?.slice(0, 10)} ${i.location?.city ?? ''}${i.places[0] ? `, ${i.places[0].name}` : ''} (${i.labels.map(l => l.name).join(', ')})`;
const visible = () => FAKE_ITEMS.filter(i => !i.sensitivity);
const inRange = (i: IndexedItem, a: Record<string, unknown>) => (!a.from || (i.date ?? '') >= String(a.from)) && (!a.to || (i.date ?? '').slice(0, 10) <= String(a.to));
const matches = (i: IndexedItem, q: string) => { const t = q.toLowerCase(); return [i.location?.city, ...i.places.map(p => p.name), ...i.labels.map(l => l.name), ...i.cuisines].some(x => x && (t.includes(x.toLowerCase()) || x.toLowerCase().includes(t))); };

export function fakeEngine(over: Partial<MemoryEngine> = {}): MemoryEngine & { calls: ToolCall[] } {
  let options: IndexOptions = { window: { kind: 'growing', months: 0 }, mediaTypes: ['photo'], focus: 'everything', places: true, readText: true, people: false };
  let state: IndexingState = { type: 'ready', summary: { photos: FAKE_ITEMS.length, screenshots: 0, videos: 0, located: FAKE_ITEMS.length, from: '2024-04-10', to: '2025-05-04' } };
  const listeners = new Set<(s: IndexingState) => void>();
  const setState = (s: IndexingState) => { state = s; listeners.forEach(l => l(s)); };
  const calls: ToolCall[] = [];
  const asResult = (items: IndexedItem[]): ToolResult => ({ text: items.map(line).join('\n') || 'Nothing found.', ids: items.map(i => i.id) });
  const e: MemoryEngine & { calls: ToolCall[] } = {
    calls,
    get options() { return options; },
    async setOptions(o) { options = { ...options, ...o }; },
    state: () => state,
    onState(cb) { listeners.add(cb); return () => listeners.delete(cb); },
    async addFiles() { setState({ type: 'indexing', progress: { step: 'understanding', indexed: 3, total: 8, searchable: true, secondsLeft: 20 } }); },
    async pause() { setState({ type: 'paused', summary: (state as any).summary ?? { photos: 3, screenshots: 0, videos: 0, located: 3, from: null, to: null } }); },
    async resume() { setState({ type: 'ready', summary: { photos: FAKE_ITEMS.length, screenshots: 0, videos: 0, located: FAKE_ITEMS.length, from: '2024-04-10', to: '2025-05-04' } }); },
    async summary() { return (state as any).summary; },
    async search(query, opts): Promise<SearchResults> {
      const results: SearchResult[] = FAKE_ITEMS.filter(i => matches(i, query)).slice(0, opts?.limit ?? 50).map(i => ({ ...i, score: 0.9, relevance: 'high', matchReasons: ['label'], duplicates: [] }));
      return { query, plan: { operation: 'search', retrievalIntent: 'mixed', sort: 'relevance' }, results };
    },
    async item(id) { return FAKE_ITEMS.find(i => i.id === id) ?? null; },
    async thumbnail() { return null; },
    async people(): Promise<Person[]> { return []; },
    async photosOf() { return []; },
    async namePerson() {},
    async interests(): Promise<Interest[]> {
      return [{ name: 'Running', kind: 'activity', status: 'active', count: 2, first: '2025-03-15', last: '2025-03-22', samples: ['p5', 'p6'] },
        { name: 'Seafood', kind: 'food', status: 'active', count: 2, first: '2025-05-03', last: '2025-05-04', samples: ['p1', 'p2'] }];
    },
    async facets(): Promise<Facet[]> { return [{ kind: 'city', name: 'Brooklyn', count: 4, samples: ['p4', 'p5'] }]; },
    async runTool(call) {
      calls.push(call);
      const a = call.args ?? {};
      switch (call.name) {
        case 'search_photos': return asResult(visible().filter(i => matches(i, String(a.query ?? ''))));
        case 'list_places': {
          const byPlace = new Map<string, IndexedItem[]>();
          for (const i of visible().filter(i => inRange(i, a) && (!a.city || i.location?.city === a.city))) for (const p of i.places) byPlace.set(p.name, [...(byPlace.get(p.name) ?? []), i]);
          const rows = [...byPlace.entries()].sort((x, y) => y[1].length - x[1].length);
          return { text: rows.map(([n, is]) => `${n}, ${is[0].location?.city}: ${is.length} visits`).join('\n'), ids: rows.map(([, is]) => is[0].id) };
        }
        case 'list_visits': return asResult(visible().filter(i => i.places.some(p => p.name === a.place) || i.location?.city === a.place));
        case 'count_days': return { text: `${new Set(visible().filter(i => inRange(i, a) && (!a.query || matches(i, String(a.query)))).map(i => i.date?.slice(0, 10))).size} days`, ids: [] };
        case 'trips': {
          const trips = visible().filter(i => i.location?.city !== 'Brooklyn' && inRange(i, a));
          return asResult(trips);
        }
        case 'timeline': return { text: '2025-05: 2 photos, Lisbon\n2025-03: 2 photos, Prospect Park', ids: ['p1', 'p5'] };
        case 'facets': return { text: 'Brooklyn: 4 photos\nseafood: 2 photos', ids: ['p4', 'p1'] };
        case 'interests': return { text: 'Running, active since 2025-03, 2 days\nSeafood, active since 2025-05, 2 days', ids: ['p5', 'p1'] };
        default: return { text: 'Unknown tool.', ids: [] };
      }
    },
    async deleteIndex() { setState({ type: 'notStarted' }); },
    async reset() { setState({ type: 'notStarted' }); },
    ...over,
  };
  return e;
}
