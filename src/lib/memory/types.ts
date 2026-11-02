// Belluh Memory: the camera roll as a memory layer, after Rollup (tryrollup.com). This file is the contract between
// the on-device engine (index, search, people, interests, facets, places, the agent's tools) and everything that uses
// it (query and profile through the server agent, Our Passport, Bella). Photos and the index never leave the device:
// search runs on the device; query and profile send only the question or schema and the TEXT results of tools that
// run on the device; places sends only ~1 km cells (0.01 degree). Nothing is stored on the server.

export type MediaType = 'photo' | 'screenshot' | 'video';

/** What to index. Mirrors Rollup's IndexOptions, adapted to the web. */
export interface IndexOptions {
  /** growing: keep adding, never drop; sliding: keep only the last `months` */
  window: { kind: 'growing' | 'sliding'; months: number };
  mediaTypes: MediaType[];
  /** food: only food photos, much faster, search only knows food */
  focus: 'everything' | 'food';
  /** Resolve venues, cuisines, neighborhoods and cities by sending ~1 km cells to Belluh's server. Off: country and nearest city on the device only, nothing sent. */
  places: boolean;
  /** Read text in images (menus, signs, screenshots) on the device */
  readText: boolean;
  /** Group faces on the device. Biometric: off unless the person consents. */
  people: boolean;
  /** Cap; the oldest are dropped beyond it */
  maxPhotos?: number | null;
}

export interface IndexSummary {
  photos: number; screenshots: number; videos: number;
  located: number;          // with a location
  from: string | null;      // ISO date of the oldest indexed item
  to: string | null;        // ISO date of the newest
}

export interface IndexingProgress {
  step: 'downloadingModels' | 'reading' | 'understanding' | 'places' | 'people' | 'finishing';
  indexed: number; total: number;
  /** Search, query and profile work once this is true; newest first, older ones fill in */
  searchable: boolean;
  secondsLeft?: number | null;
}

export type IndexingState =
  | { type: 'notStarted' }
  | { type: 'downloadingModels'; fraction: number }
  | { type: 'indexing'; progress: IndexingProgress }
  | { type: 'paused'; summary: IndexSummary }
  | { type: 'ready'; summary: IndexSummary }
  | { type: 'unfinished'; summary: IndexSummary; reason: string }
  | { type: 'failed'; error: MemoryErrorCode };

export const isSearchable = (s: IndexingState) =>
  s.type === 'ready' || s.type === 'paused' || s.type === 'unfinished' || (s.type === 'indexing' && s.progress.searchable);

export interface Location {
  neighborhood?: string | null; city?: string | null; metro?: string | null;
  country?: string | null; countryCode?: string | null;
  /** Rounded to 3 decimals (~100 m); exact coordinates stay in the index on the device */
  lat: number; lng: number;
}

export interface PlaceMatch { name: string; kind: string; cuisine?: string | null }

/** Kinds of photos kept out of query, facets, people and interests (search still returns them, flagged) */
export type Sensitivity = 'id' | 'payment' | 'credential' | 'health' | 'nudity';

/** One indexed item, as the device knows it. `id` is a stable local id (hash of the file); it means nothing off this device. */
export interface IndexedItem {
  id: string;
  date: string | null;            // ISO, from EXIF or the file
  timeZone?: string | null;
  mediaType: MediaType;
  isFavorite?: boolean;
  location?: Location | null;
  places: PlaceMatch[];
  cuisines: string[];
  labels: { name: string; p: number }[];
  text?: string | null;           // text read from the image
  sensitivity: Sensitivity | null;
  people: string[];               // Person ids, when people indexing is on
}

export interface SearchPlan {
  operation: 'search' | 'count';
  retrievalIntent: 'visual' | 'place' | 'date' | 'text' | 'mixed';
  dateRange?: { from: string; to: string } | null;
  places?: string[];
  mediaType?: MediaType | null;
  visualText?: string | null;     // what's left to match against the image
  sort: 'relevance' | 'newest' | 'oldest';
}

export interface SearchResult extends IndexedItem {
  score: number;
  relevance: 'high' | 'medium' | 'low';
  matchedText?: string | null;
  matchReasons: string[];
  duplicates: string[];           // other shots of the same moment, grouped into this one
}

export interface SearchResults { query: string; plan: SearchPlan; results: SearchResult[] }

export interface Facet { kind: 'label' | 'placeType' | 'cuisine' | 'food' | 'city' | 'country'; name: string; count: number; samples: string[] }

export interface Interest {
  name: string; kind: 'activity' | 'food' | 'music' | 'travel' | 'place' | 'other';
  status: 'active' | 'emerging' | 'lapsed';
  count: number; first: string; last: string;
  /** How much more often than a typical adult's camera roll, when known */
  vsTypical?: number | null;
  samples: string[];
}

export interface Person { id: string; name?: string | null; photos: number; cover: string }

export interface Answer { text: string; assetIdentifiers: string[]; declined: boolean }
export type QueryUpdate =
  | { type: 'progress'; text: string }
  | { type: 'partialAnswer'; text: string }   // replaces the previous partial; empty means back to reading the index
  | { type: 'answer'; answer: Answer };

/** A JSON Schema subset, as in Rollup: object root with properties; type, properties, required, items, enum, description, title, additionalProperties:false. Max 5 levels, 100 fields, 32 KB. */
export type JsonSchema = Record<string, unknown>;
export interface Profile { json: Record<string, unknown>; evidence: Record<string, string[]>; refused: { pointer: string; reason: string }[] }

export type MemoryErrorCode = 'noIndex' | 'notStarted' | 'unsupported' | 'storageFull' | 'modelDownloadFailed' | 'network' | 'declined' | 'invalidSchema' | 'notConsented' | 'rateLimited' | 'cancelled' | 'internal';
export class MemoryError extends Error { constructor(public code: MemoryErrorCode, message?: string) { super(message ?? code); } }

/** The tools the server agent may call. They run on the device against the index and return text only. */
export type ToolName =
  | 'search_photos'      // { query, limit? } -> matching items as text lines (date, place, labels, text)
  | 'list_places'        // { kind?, city?, from?, to?, limit? } -> places with visit counts
  | 'list_visits'        // { place, from?, to? } -> dated visits to a place
  | 'count_days'         // { query?, place?, from?, to? } -> number of distinct days
  | 'timeline'           // { from?, to?, granularity: 'month' | 'week' } -> counts and top places per period
  | 'facets'             // { limit? } -> largest groups
  | 'interests'          // { window?: 'now' | 'lifetime' } -> interests
  | 'trips';             // { from?, to? } -> trips away from home with dates and places

export interface ToolCall { name: ToolName; args: Record<string, unknown> }
/** What a tool returns: text the server may see, plus the local ids behind it (never sent, kept for evidence) */
export interface ToolResult { text: string; ids: string[] }

/** The on-device engine. One per browser profile; everything lives in IndexedDB. */
export interface MemoryEngine {
  readonly options: IndexOptions;
  setOptions(o: Partial<IndexOptions>): Promise<void>;
  state(): IndexingState;
  onState(cb: (s: IndexingState) => void): () => void;
  /** Add photos the person picked (the web can't read the whole library). Starts or continues indexing. */
  addFiles(files: FileList | File[]): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  summary(): Promise<IndexSummary>;
  search(query: string, opts?: { people?: string[]; limit?: number }): Promise<SearchResults>;
  item(id: string): Promise<IndexedItem | null>;
  /** A small preview kept on the device, for showing results */
  thumbnail(id: string): Promise<Blob | null>;
  people(includeAll?: boolean): Promise<Person[]>;
  photosOf(personId: string): Promise<SearchResult[]>;
  namePerson(personId: string, name: string | null): Promise<void>;
  interests(window?: 'now' | 'lifetime', includeAll?: boolean): Promise<Interest[]>;
  facets(limit?: number, samples?: number): Promise<Facet[]>;
  /** Run one agent tool on the device. Sensitive items are always left out. */
  runTool(call: ToolCall): Promise<ToolResult>;
  /** Delete the index and everything derived; keep downloaded models and options */
  deleteIndex(): Promise<void>;
  /** Delete everything Belluh Memory keeps on this device, models included */
  reset(): Promise<void>;
}
