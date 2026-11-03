// Belluh Memory's on-device engine, after Rollup (tryrollup.com), adapted to the web. It implements MemoryEngine
// (types.ts) over IndexedDB in this browser profile.
//
// What the web allows, said plainly: a web page can't read the whole camera roll or index in the background. The
// person picks photos (or, on desktop Chrome, a folder) and the engine indexes those, newest first, so search works
// while older ones fill in. Picking more later adds to the index (a growing window); the same photo picked twice is
// indexed once (content hash). Indexing runs while the page is open; closing it stops the run, and the next visit
// continues from what was read (the state says `unfinished`, reason `interrupted`).
//
// Privacy: photos, previews, embeddings, labels, text read from images, faces and exact coordinates stay in this
// browser. The only thing sent anywhere is, with `places` on, the 0.01 degree cells photos were taken in, to Belluh's
// memory-places function (deduped, sorted, never per photo, no times). Models are downloaded from the Hugging Face CDN
// and tesseract's CDN; nothing is uploaded to them.

import {
  MemoryError, type IndexOptions, type IndexSummary, type IndexingState, type IndexedItem, type MemoryEngine, type MediaType,
  type SearchResult, type Sensitivity, type ToolCall, type ToolResult, type Interest, type Facet, type Person, type ListOptions,
  type IndexedBatch,
} from './types.ts';
import { detectEvents, itemEvents, lookupCandidates, lookupRequest, visitsOf, eventsTool, type EventHit, type EventRec } from './events.ts';
import { cleanReport, worthReporting, REPORTS_MAX, type RunReport, type RunTrigger, type Stage } from './reports.ts';
import { buildStory } from '../photoStory.ts';
import { parseQuery } from './query.ts';
import { rank, knownPlaces, facets as facetsOf, interests as interestsOf, assignFaces, mergeClusters, peopleOf, resolvePerson, runTool as runToolOn, listItems, publicItem, usable, capped, LABEL_MIN, type Rec, type Cluster, type FaceRec, type SearchResultsX, type InterestX, type PersonX } from './logic.ts';
import { cellOf, cellsFor, matchVenue, nearestCity, r3, type Cities, type CellPlaces } from './geo.ts';
import { LABELS, LABEL_BY_NAME, SENSITIVE, promptOf, sensitiveText } from './vocab.ts';
import { labelsFrom, sensitivityFrom } from './scoring.ts';
import { openDb, deleteDb, type Db } from './idb.ts';
import type { Reader, ReadFile } from './reader.ts';
import type { Ocr } from './ocr.ts';
import { MEMORY_ON_FLAG } from './constants.ts';
import type { MemoryErrorCode } from './types.ts';

function flagOn(on: boolean) {
  try { if (on) localStorage.setItem(MEMORY_ON_FLAG, '1'); else localStorage.removeItem(MEMORY_ON_FLAG); } catch { /* no storage here */ }
}

export const DEFAULT_OPTIONS: IndexOptions = {
  // Growing: everything the person picks, back 20 years from the first index, is kept; nothing ages out
  window: { kind: 'growing', months: 240 },
  mediaTypes: ['photo', 'screenshot', 'video'],
  focus: 'everything',
  places: false,
  readText: true,
  people: false,
  events: false,
  maxPhotos: null,
};

/** Options beyond the contract (backward compatible additions) */
export interface IndexOptionsX extends IndexOptions {
  /** Also read text in photos that look like they hold some (menus, signs, tickets). Off: screenshots only. */
  readTextPhotos?: boolean;
}

/** What the image model gives the engine for one image */
export interface Understood {
  vec: Float32Array;
  /** Cosine similarity to each vocabulary prompt (LABELS order) and to each sensitive prompt (SENSITIVE order, flattened) */
  sims: Float32Array; sens: Float32Array;
  faces: { box: [number, number, number, number]; score: number; emb: Float32Array }[];
}
export interface Understander {
  /** Downloads and loads the models; reports MB loaded of total */
  load(o: { faces: boolean; onProgress: (loadedMB: number, totalMB: number) => void; cache?: { labels: Float32Array; sens: Float32Array } | null }): Promise<{ promptMatrix: Float32Array | null; vision?: string }>;
  image(work: ImageBitmap | Blob, faces: boolean): Promise<Understood>;
  text(text: string): Promise<Float32Array>;
  dispose(): void;
}

export interface EngineDeps {
  idb?: IDBFactory;
  dbName?: string;
  reader?: Reader;
  understander?: Understander | (() => Promise<Understander>);
  ocr?: (lang: string) => Promise<Ocr>;
  cities?: () => Promise<Cities>;
  countryOf?: (lng: number, lat: number) => string | null;
  /** Sends cells to memory-places; only cells, nothing else */
  places?: (cells: string[]) => Promise<CellPlaces[]>;
  /** Sends visits to memory-events (with the lookup on): a cell, venue names and local times each; one answer per visit */
  events?: (visits: { cell: string; venues: string[]; start: string; end: string }[]) => Promise<(EventHit | null)[]>;
  /** Called with each run's report (counts and timings only); the default sends it only when the person allows it */
  sendReport?: (r: RunReport) => Promise<unknown>;
  now?: () => number;
  uiLang?: () => string;
  /** Model caches to delete on reset() (Cache Storage names) */
  modelCaches?: string[];
  /** Called after deleteIndex() and reset(): the native app forgets where it got to in the photo library */
  onDeleted?: () => Promise<void> | void;
}

export const MODEL_NOTES = {
  /** What the first run downloads, in MB, for the state UI */
  imageModelMB: 22.9 + 42.8 + 2.5,
  runtimeMB: 21.6,
  peopleMB: 10.1,
  textReadingMB: 11,
};

const ITEM_KEYS = ['items', 'vectors', 'thumbs', 'faces'] as const;
const BATCH = 12;
const PLACES_CHUNK = 64;
const PLACES_TTL = 30 * 86_400_000;
const EVENTS_CHUNK = 20;
const EVENTS_TTL = 30 * 86_400_000;
const EVENTS_MAX_PER_RUN = 200;

type Pending = { id: string; file?: File; work?: ImageBitmap | null };

export class BrowserMemoryEngine implements MemoryEngine {
  private _options: IndexOptionsX = { ...DEFAULT_OPTIONS };
  private st: IndexingState = { type: 'notStarted' };
  private listeners = new Set<(s: IndexingState) => void>();
  private db: Db | null = null;
  private ready: Promise<void> | null = null;
  private items = new Map<string, Rec>();
  private vectors = new Map<string, Float32Array>();
  private clusters: Cluster[] = [];
  private paused = false;
  private firstBuilt: number | null = null;
  private queue: Pending[] = [];
  private files = new Map<string, File>();
  private run: Promise<void> | null = null;
  private stop = false;
  private model: Understander | null = null;
  private modelLoading: Promise<Understander> | null = null;
  private promptMatrix: Float32Array | null = null;
  private textCache = new Map<string, Float32Array>();
  private ocr: Ocr | null = null;
  private citiesP: Promise<Cities> | null = null;
  private skipped = 0; private failed = 0;
  private nextPerson = 1;
  private lastError: string | null = null;
  private eventList: EventRec[] = [];
  private lookups = new Map<string, { at: number; hit: EventHit | null }>();
  private batchListeners = new Set<(b: IndexedBatch) => void>();
  private trigger: RunTrigger = 'reopen';
  private searches = 0;
  private home: { n: number; at: { lat: number; lng: number } | null } | null = null;
  /** The report of the run under way: counts and timings only */
  private rep: (RunReport & { t0: number; stageAt: number; stage: Stage | null }) | null = null;
  /** Which image model is loaded, and at what precision (fp16, or fp32 where the browser can't run fp16) */
  modelInfo: { id: string; vision: string | null } | null = null;

  private deps: EngineDeps;
  constructor(deps: EngineDeps = {}) { this.deps = deps; }

  get options(): IndexOptions { return this._options; }
  /** What the first run downloads, in bytes (image model and runtime, plus faces and text reading when on), for the state UI */
  get modelDownloadBytes(): number {
    const mb = MODEL_NOTES.imageModelMB + MODEL_NOTES.runtimeMB + (this._options.people ? MODEL_NOTES.peopleMB : 0) + (this._options.readText ? MODEL_NOTES.textReadingMB : 0);
    return Math.round(mb * 1e6);
  }
  private now() { return this.deps.now?.() ?? Date.now(); }

  // ------------------------------------------------------------------------------------------------------- lifecycle

  private init(): Promise<void> {
    this.ready ??= (async () => {
      this.db = await openDb(this.deps.idb ?? indexedDB, this.deps.dbName);
      const opts = await this.db.get<IndexOptionsX>('meta', 'options');
      if (opts) this._options = { ...DEFAULT_OPTIONS, ...opts };
      this.paused = !!(await this.db.get<boolean>('meta', 'paused'));
      this.firstBuilt = (await this.db.get<number>('meta', 'firstBuilt')) ?? null;
      for (const [k, v] of await this.db.all<Rec>('items')) this.items.set(k, v);
      for (const [k, v] of await this.db.all<Float32Array>('vectors')) this.vectors.set(k, v);
      const ps = await this.db.get<{ clusters: Cluster[]; next: number }>('meta', 'people');
      if (ps) { this.clusters = ps.clusters; this.nextPerson = ps.next; }
      for (const [k, v] of Object.entries((await this.db.get<Record<string, { at: number; hit: EventHit | null }>>('meta', 'eventLookups')) ?? {})) this.lookups.set(k, v);
      this.eventList = (await this.db.get<EventRec[]>('meta', 'events')) ?? [];
      this.settle();
    })();
    return this.ready;
  }

  /** The state when nothing is running */
  private async summaryState(): Promise<IndexingState> { return this.idleState(); }
  private idleState(): IndexingState {
    const summary = this.summaryNow();
    if (!this.items.size) return { type: 'notStarted' };
    if (this.paused) return { type: 'paused', summary };
    const waiting = [...this.items.values()].filter(r => r.stage === 'read').length;
    if (this.lastError) return { type: 'unfinished', summary, reason: 'failed' };
    if (waiting) return { type: 'unfinished', summary, reason: this.queue.length ? 'waiting' : 'interrupted' };
    return { type: 'ready', summary };
  }
  private settle() { this.setState(this.idleState()); }

  private setState(s: IndexingState) {
    this.st = s;
    for (const cb of this.listeners) { try { cb(s); } catch { /* a listener's problem */ } }
  }
  state(): IndexingState { return this.st; }
  onState(cb: (s: IndexingState) => void): () => void {
    this.listeners.add(cb);
    cb(this.st);
    void this.init();
    return () => { this.listeners.delete(cb); };
  }
  /** Resolves once the stored index is loaded (state reflects it) */
  async open(): Promise<IndexingState> { await this.init(); return this.st; }

  async setOptions(o: Partial<IndexOptionsX>): Promise<void> {
    await this.init();
    const before = this._options;
    this._options = { ...before, ...o };
    await this.db!.put('meta', 'options', this._options);
    const changed = (k: keyof IndexOptionsX) => JSON.stringify(before[k]) !== JSON.stringify(this._options[k]);
    // As in Rollup: the change applies to the index in place; places and people are rebuilt
    if (changed('mediaTypes') || changed('window') || changed('maxPhotos') || changed('focus')) await this.prune();
    if (changed('places')) {
      for (const r of this.items.values()) { r.placesResolved = false; r.places = []; r.cuisines = []; if (r.location) { r.location.neighborhood = null; r.location.metro = null; } }
      await this.saveItems([...this.items.values()]);
    }
    if (changed('events') || (changed('places') && !this._options.places)) {
      // As in Rollup: turning the lookup on or off rebuilds what it found; off forgets every lookup
      this.lookups.clear(); await this.db!.del('meta', 'eventLookups');
      await this.refreshEvents();
    }
    if (changed('people') && !this._options.people) {
      this.clusters = []; this.nextPerson = 1;
      for (const r of this.items.values()) r.people = [];
      await this.db!.clear('faces'); await this.db!.del('meta', 'people');
      await this.saveItems([...this.items.values()]);
    }
    if ((changed('places') && this._options.places) || (changed('people') && this._options.people) || (changed('events') && this._options.events) || changed('focus')) { this.trigger = 'options'; this.kick(); }
    else if (!this.run) this.settle();
  }

  async addFiles(files: FileList | File[], o: { source?: 'picked' | 'folder' | 'library' } = {}): Promise<void> {
    // Copy first: a FileList is live, and pickers clear their input (value = '') right after handing it over
    const list = Array.from(files);
    if (!this.run) this.trigger = o.source ?? 'picked';
    await this.init();
    if (!this.firstBuilt) { this.firstBuilt = this.now(); await this.db!.put('meta', 'firstBuilt', this.firstBuilt); }
    flagOn(true);
    for (const f of list) this.queue.push({ id: '', file: f });
    this.kick();
    await this.run;
  }

  async pause(): Promise<void> {
    await this.init();
    this.paused = true; this.stop = true;
    await this.db!.put('meta', 'paused', true);
    await this.run;
    this.settle();
  }
  async resume(): Promise<void> {
    await this.init();
    this.paused = false;
    await this.db!.put('meta', 'paused', false);
    this.lastError = null;
    this.trigger = 'resume';
    this.kick();
  }
  /** Waits for the run under way, if any (tests and the harness) */
  async idle(): Promise<void> { await this.run; }

  private kick() {
    if (this.run) return;
    if (this.paused) {
      // Paused: picked files are read and kept as waiting, nothing is understood until resume()
      if (this.queue.some(p => p.file)) this.run = this.readQueued().finally(() => { this.run = null; this.settle(); });
      else this.settle();
      return;
    }
    this.stop = false;
    this.beginReport();
    let error: MemoryErrorCode | null = null;
    this.run = this.runAll().catch(e => {
      this.lastError = String((e as any)?.message ?? e);
      const code = e instanceof MemoryError ? e.code : /quota|storage/i.test(this.lastError) ? 'storageFull' : 'internal';
      error = code;
      if (!this.items.size || code === 'modelDownloadFailed') this.setState({ type: 'failed', error: code });
      console.warn('belluh memory:', e);
    }).finally(async () => {
      this.run = null;
      if (this.st.type !== 'failed') this.settle();
      await this.endReport(error).catch(() => {});
      if (!this.paused && !this.stop && this.queue.some(p => p.file)) this.kick();
    });
  }

  // ------------------------------------------------------------------------------------------------------------ runs

  // ----------------------------------------------------------------------------------------------------- run reports

  private beginReport() {
    const t = this.now();
    this.rep = { ...cleanReport({}), trigger: this.trigger, t0: t, stageAt: t, stage: null };
    this.trigger = 'reopen';
  }
  private stage(s: Stage | null) {
    const r = this.rep; if (!r) return;
    const t = this.now();
    if (r.stage) r.stages[r.stage] = Math.round(((r.stages[r.stage] ?? 0) + (t - r.stageAt) / 1000) * 10) / 10;
    r.stage = s; r.stageAt = t;
  }
  private count(k: 'read' | 'skipped' | 'failed' | 'located' | 'understood' | 'labels' | 'textRead' | 'placeCells' | 'eventLookups', n = 1) { if (this.rep) this.rep[k] += n; }
  private async endReport(error: MemoryErrorCode | null) {
    const r = this.rep; if (!r || !this.db) return;
    this.stage(null); this.rep = null;
    const waiting = [...this.items.values()].filter(x => x.stage === 'read').length;
    const report = cleanReport({
      ...r, at: new Date(this.now()).toISOString(), seconds: (this.now() - r.t0) / 1000, error,
      outcome: error ? 'failed' : this.paused ? 'paused' : this.stop ? 'stopped' : waiting ? 'unfinished' : 'ready',
      events: this.eventList.filter(e => !e.upcoming).length, indexTotal: this.items.size, remaining: waiting, searches: this.searches,
    } as any);
    if (!worthReporting(report)) return;
    this.searches = 0;
    const list = [report, ...((await this.db.get<RunReport[]>('meta', 'reports')) ?? [])].slice(0, REPORTS_MAX);
    await this.db.put('meta', 'reports', list);
    const send = this.deps.sendReport ?? (typeof window !== 'undefined' ? async (x: RunReport) => (await import('./reports.ts')).sendRunReport(x) : null);
    if (send) void Promise.resolve(send(report)).catch(() => {});
  }
  /** The last runs, newest first: counts and timings only, kept on this device */
  async reports(): Promise<RunReport[]> { await this.init(); return (await this.db!.get<RunReport[]>('meta', 'reports')) ?? []; }

  onBatch(cb: (b: IndexedBatch) => void): () => void { this.batchListeners.add(cb); return () => { this.batchListeners.delete(cb); }; }
  private emitBatch(ids: string[], indexed: number, total: number) {
    if (!ids.length) return;
    const ok = ids.filter(id => { const r = this.items.get(id); return r && usable(r); });
    for (const cb of this.batchListeners) { try { cb({ ids: ok, indexed, total }); } catch { /* a listener's problem */ } }
  }

  private progress(step: 'downloadingModels' | 'reading' | 'understanding' | 'places' | 'people' | 'finishing', indexed: number, total: number, started?: number) {
    const searchable = [...this.items.values()].some(r => r.stage === 'understood') || (step !== 'reading' && this.items.size > 0);
    let secondsLeft: number | null = null;
    if (started && indexed > 0 && total > indexed) secondsLeft = Math.round(((this.now() - started) / 1000) / indexed * (total - indexed));
    this.setState({ type: 'indexing', progress: { step, indexed, total, searchable, secondsLeft } });
  }

  private async readQueued(): Promise<void> {
    const todo = this.queue.filter(p => p.file);
    this.queue = this.queue.filter(p => !p.file);
    const reader = this.deps.reader ?? (await import('./reader.ts')).browserReader();
    if (todo.length) this.stage('reading');
    let n = 0;
    const total = todo.length;
    const one = async (p: Pending) => {
      const f = p.file!;
      try {
        const kind: MediaType | null = f.type.startsWith('video/') || /\.(mov|mp4|m4v|webm)$/i.test(f.name) ? 'video' : 'photo';
        if (kind === 'video' && !this._options.mediaTypes.includes('video')) { this.skipped++; this.count('skipped'); return; }
        const got = await reader.read(f);
        if (!got) { this.skipped++; this.count('skipped'); return; }
        if (!this._options.mediaTypes.includes(got.mediaType) || (this._options.focus === 'food' && got.mediaType === 'screenshot')) { got.work?.close?.(); this.skipped++; this.count('skipped'); return; }
        if (!this.inWindow(got.wall)) { got.work?.close?.(); this.skipped++; this.count('skipped'); return; }
        const have = this.items.get(got.id);
        if (have) {
          // Picked again: keep the file around if it still needs understanding
          if (have.stage === 'read') { this.files.set(got.id, f); this.queue.push({ id: got.id, file: undefined, work: got.work }); } else got.work?.close?.();
          return;
        }
        const rec = await this.recordOf(got);
        this.items.set(rec.id, rec);
        this.count('read'); if (rec.location) this.count('located');
        this.files.set(rec.id, f);
        await this.db!.put('items', rec.id, rec);
        if (got.thumb) { try { await this.db!.put('thumbs', rec.id, got.thumb); } catch { /* a preview is optional */ } }
        this.queue.push({ id: rec.id, work: got.work });
      } catch (e) {
        this.failed++; this.count('failed');
        if (/quota/i.test(String(e))) throw new MemoryError('storageFull');
      } finally {
        n++;
        if (n % 4 === 0 || n === total) this.progress('reading', n, total);
      }
    };
    // A few at a time: decoding is the slow part
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(3, todo.length) }, async () => { while (next < todo.length) await one(todo[next++]); }));
    await this.prune();
  }

  private inWindow(wall: number | null): boolean {
    if (wall == null) return true;
    const w = this._options.window;
    const from = (w.kind === 'growing' ? (this.firstBuilt ?? this.now()) : this.now()) - w.months * 30.44 * 86_400_000;
    return wall >= from;
  }

  /** Drops what the options no longer take: media types, the window, food focus, the cap (oldest first) */
  private async prune() {
    const drop: string[] = [];
    for (const r of this.items.values()) {
      if (!this._options.mediaTypes.includes(r.mediaType) || !this.inWindow(r.wall)) drop.push(r.id);
      else if (this._options.focus === 'food' && (r.mediaType === 'screenshot' || (r.stage === 'understood' && !isFood(r)))) drop.push(r.id);
    }
    const cap = this._options.maxPhotos;
    if (cap && this.items.size - drop.length > cap) {
      const left = [...this.items.values()].filter(r => !drop.includes(r.id)).sort((a, b) => (a.wall ?? 0) - (b.wall ?? 0));
      drop.push(...left.slice(0, left.length - cap).map(r => r.id));
    }
    if (drop.length) await this.remove(drop);
  }

  private async remove(ids: string[]) {
    for (const id of ids) { this.items.delete(id); this.vectors.delete(id); this.files.delete(id); }
    for (const s of ITEM_KEYS) await this.db!.delMany(s, ids);
    const gone = new Set(ids);
    this.queue = this.queue.filter(p => !gone.has(p.id));
    if (this.clusters.length) {
      for (const c of this.clusters) c.faces = c.faces.filter(f => !gone.has(f.item));
      this.clusters = this.clusters.filter(c => c.faces.length);
      await this.savePeople();
    }
  }

  private async recordOf(g: ReadFile): Promise<Rec> {
    const rec: Rec = {
      id: g.id, date: g.date, timeZone: g.timeZone, mediaType: g.mediaType, isFavorite: false,
      location: null, places: [], cuisines: [], labels: [], text: null, sensitivity: null, people: [],
      wall: g.wall, exact: g.lat != null && g.lng != null ? { lat: g.lat, lng: g.lng } : null,
      w: g.w, h: g.h, stage: 'read', addedAt: this.now(),
    };
    if (rec.exact) rec.location = await this.placeOnDevice(rec.exact.lat, rec.exact.lng);
    return rec;
  }

  private cities(): Promise<Cities> {
    this.citiesP ??= this.deps.cities ? this.deps.cities() : (async () => {
      const [{ parseCities }, raw] = await Promise.all([import('./geo.ts'), import('./data/cities15000.txt?raw')]);
      return parseCities((raw as any).default as string);
    })();
    return this.citiesP;
  }
  private async countryOf(lng: number, lat: number): Promise<string | null> {
    if (this.deps.countryOf) return this.deps.countryOf(lng, lat);
    const w = await import('../world.ts');
    return w.countryOf(lng, lat);
  }

  /** Country and nearest city of 15,000+ within 75 km, from geography on the device. Nothing is sent. */
  private async placeOnDevice(lat: number, lng: number) {
    let city: { name: string; cc: string } | null = null;
    try { city = nearestCity(await this.cities(), lat, lng, 75); } catch { city = null; }
    const mapName = await this.countryOf(lng, lat).catch(() => null);
    const { COUNTRY_CODE } = await import('../countryCodes.ts');
    const cc = (mapName && COUNTRY_CODE[mapName]) || city?.cc || null;
    let country = mapName;
    if (cc) { try { country = new Intl.DisplayNames(['en'], { type: 'region' }).of(cc) ?? mapName; } catch { /* keep the map's name */ } }
    return { city: city?.name ?? null, country: country ?? null, countryCode: cc, neighborhood: null, metro: null, lat: r3(lat), lng: r3(lng) };
  }

  private async getModel(): Promise<Understander> {
    if (this.model) return this.model;
    this.modelLoading ??= (async () => {
      const u = typeof this.deps.understander === 'function' ? await this.deps.understander()
        : this.deps.understander ?? await (await import('./understand.ts')).workerUnderstander();
      let lastFrac = -1;
      try {
        const cache = await this.bundledPrompts();
        const { promptMatrix, vision } = await u.load({
          faces: this._options.people, cache,
          onProgress: (mb, total) => {
            if (this.rep) this.rep.modelMB = Math.round(total || mb);
            const fraction = Math.min(0.99, total ? mb / total : 0);
            if (fraction - lastFrac >= 0.01 && this.run) { lastFrac = fraction; this.setState({ type: 'downloadingModels', fraction }); }
          },
        });
        if (promptMatrix) this.promptMatrix = promptMatrix;
        this.modelInfo = { id: (await import('./constants.ts')).MODEL_ID, vision: vision ?? null };
      } catch (e) {
        this.modelLoading = null;
        u.dispose();
        throw new MemoryError(/fetch|network|download|Failed to/i.test(String(e)) ? 'modelDownloadFailed' : 'internal', String((e as any)?.message ?? e));
      }
      this.model = u;
      return u;
    })();
    return this.modelLoading;
  }

  /** The vocabulary's embeddings shipped with the app, when they match this vocabulary and model */
  private async bundledPrompts(): Promise<{ labels: Float32Array; sens: Float32Array } | null> {
    if (this.deps.understander) return null;
    try {
      const [{ decodePrompts, vocabKey }, raw] = await Promise.all([import('./prompts.ts'), import('./data/prompts.txt?raw')]);
      const d = decodePrompts((raw as any).default as string);
      if (!d || d.key !== vocabKey()) return null;
      const n = LABELS.length * d.dim;
      return { labels: d.rows.slice(0, n), sens: d.rows.slice(n) };
    } catch { return null; }
  }

  private async runAll(): Promise<void> {
    await this.readQueued();
    if (this.stop) return;
    const started = this.now();
    // Newest first, so the latest photos are searchable while older ones fill in
    const todo = [...this.items.values()].filter(r => r.stage === 'read').sort((a, b) => (b.wall ?? 0) - (a.wall ?? 0));
    const total = this.items.size;
    let indexed = total - todo.length;
    const works = new Map(this.queue.filter(p => p.work).map(p => [p.id, p.work!] as const));
    this.queue = [];
    if (todo.length || (this._options.people && [...this.items.values()].some(r => r.stage === 'understood' && !r.people.length && !(r as any).facesDone))) {
      this.stage('models');
      const model = await this.getModel();
      this.stage('understanding');
      this.progress('understanding', indexed, total, started);
      const ocrWant: Rec[] = [];
      const faceRecs: FaceRec[] = [];
      let batch: Rec[] = [];
      for (const r of todo) {
        if (this.stop) break;
        let work: ImageBitmap | Blob | null = works.get(r.id) ?? null;
        works.delete(r.id);
        if (!work) work = (await this.db!.get<Blob>('thumbs', r.id)) ?? null;
        if (!work) { this.failed++; this.count('failed'); continue; }
        let u: Understood;
        try { u = await model.image(work, this._options.people); }
        catch { this.failed++; this.count('failed'); continue; }
        this.apply(r, u);
        this.count('understood'); this.count('labels', r.labels.filter(l => l.p >= LABEL_MIN).length);
        if (this._options.people) { u.faces.forEach(f => faceRecs.push({ item: r.id, box: f.box, emb: f.emb, score: f.score })); (r as any).facesDone = true; }
        if (this.wantsText(r, u)) ocrWant.push(r);
        batch.push(r);
        indexed++;
        if (batch.length >= BATCH) { await this.saveBatch(batch); this.emitBatch(batch.map(x => x.id), indexed, total); batch = []; this.progress('understanding', indexed, total, started); }
      }
      await this.saveBatch(batch);
      this.emitBatch(batch.map(x => x.id), indexed, total);
      works.forEach(w => (w as ImageBitmap).close?.());
      if (this._options.focus === 'food') await this.prune();
      if (!this.stop && ocrWant.length) { this.stage('text'); await this.readText(ocrWant, indexed, total); }
      if (!this.stop && this._options.people) { this.stage('people'); await this.peoplePass(faceRecs, model); }
    }
    if (!this.stop && this._options.places) { this.stage('places'); await this.placesPass(); }
    if (!this.stop) { this.stage('events'); await this.eventsPass(); }
    this.stage(null);
    if (this.stop || !this.items.size) return;
    this.progress('finishing', this.items.size, this.items.size);
    // The files themselves aren't needed once understood
    for (const [id] of this.files) if (this.items.get(id)?.stage !== 'read') this.files.delete(id);
  }

  private apply(r: Rec, u: Understood) {
    this.vectors.set(r.id, u.vec);
    r.labels = labelsFrom(u.sims);
    const s = sensitivityFrom(u.sens, u.sims);
    r.sensitivity = s.kind;
    (r as any).sensCandidate = s.candidate;
    r.stage = 'understood';
  }

  private wantsText(r: Rec, u: Understood): boolean {
    if (!this._options.readText || !this.files.has(r.id)) return false;
    if (r.mediaType === 'screenshot') return true;
    if ((r as any).sensCandidate) return true;   // let the words decide
    if (!(this._options as IndexOptionsX).readTextPhotos || r.mediaType !== 'photo') return false;
    return r.labels.some(l => l.p >= 0.15 && LABEL_BY_NAME.get(l.name)?.text);
  }

  private async readText(list: Rec[], indexed: number, total: number) {
    try {
      this.ocr ??= await (this.deps.ocr ?? (async (lang: string) => (await import('./ocr.ts')).browserOcr(lang)))(this.deps.uiLang?.() ?? (typeof navigator !== 'undefined' ? navigator.language : 'en'));
    } catch { return; }   // reading text is optional; search still works without it
    const done: Rec[] = [];
    for (const r of list) {
      if (this.stop) break;
      const f = this.files.get(r.id);
      if (!f) continue;
      try {
        const text = await this.ocr.read(f);
        r.text = text || null;
        r.textRead = true;
        this.count('textRead');
        const s = sensitiveText(text);
        if (s && !r.sensitivity) r.sensitivity = s;
        done.push(r);
      } catch { /* one unreadable image */ }
      if (done.length % 4 === 0) this.progress('understanding', indexed, total);
    }
    await this.saveItems(done);
  }

  private async saveBatch(batch: Rec[]) {
    if (!batch.length) return;
    await this.db!.putMany('items', batch.map(r => [r.id, r]));
    await this.db!.putMany('vectors', batch.map(r => [r.id, this.vectors.get(r.id)!]).filter(([, v]) => v) as [string, unknown][]);
  }
  private async saveItems(list: Rec[]) { await this.db!.putMany('items', list.map(r => [r.id, r])); }

  // ---------------------------------------------------------------------------------------------------------- places

  private async placesPass() {
    const want = [...this.items.values()].filter(r => r.exact && !r.placesResolved);
    if (!want.length) return;
    const cells = cellsFor(want.map(r => r.exact!));
    this.progress('places', 0, cells.length);
    const got = new Map<string, CellPlaces>();
    const missing: string[] = [];
    for (const c of cells) {
      const hit = await this.db!.get<{ at: number; data: CellPlaces }>('places', c);
      if (hit && this.now() - hit.at < PLACES_TTL) got.set(c, hit.data); else missing.push(c);
    }
    const fetcher = this.deps.places ?? defaultPlacesFetcher;
    for (let i = 0; i < missing.length && !this.stop; i += PLACES_CHUNK) {
      const chunk = missing.slice(i, i + PLACES_CHUNK);
      this.count('placeCells', chunk.length);
      let res: CellPlaces[] = [];
      try { res = await fetcher(chunk); }
      catch (e) { if (/429|rate/i.test(String(e))) break; continue; }   // no network: country and city stay from the device
      const at = this.now();
      await this.db!.putMany('places', res.filter(x => chunk.includes(x.cell)).map(x => [x.cell, { at, data: x }]));
      res.forEach(x => got.set(x.cell, x));
      this.progress('places', Math.min(cells.length, got.size), cells.length);
    }
    const changed: Rec[] = [];
    for (const r of want) {
      const c = got.get(cellOf(r.exact!.lat, r.exact!.lng));
      if (!c) continue;
      // Venues just over a cell's edge belong to the neighbouring cell's list too
      const near = neighbors(r.exact!.lat, r.exact!.lng).flatMap(k => got.get(k)?.venues ?? []);
      const groups = [...new Set(r.labels.filter(l => l.p >= LABEL_MIN).map(l => LABEL_BY_NAME.get(l.name)?.group).filter(Boolean) as string[])];
      const v = matchVenue(r.exact!, [...c.venues, ...near], groups);
      r.places = v ? [{ name: v.name, kind: v.kind, cuisine: v.cuisine ?? null }] : [];
      const foodish = groups.includes('food') || groups.includes('drink');
      r.cuisines = v?.cuisine && foodish ? v.cuisine.split(';').map(x => x.trim().replace(/_/g, ' ')).filter(Boolean).slice(0, 3) : [];
      r.location = { ...(r.location ?? { lat: r3(r.exact!.lat), lng: r3(r.exact!.lng) }),
        neighborhood: c.neighborhood ?? null, city: c.city ?? r.location?.city ?? null, metro: c.metro ?? null,
        country: r.location?.country ?? c.country ?? null, countryCode: r.location?.countryCode ?? c.countryCode ?? null };
      r.placesResolved = true;
      changed.push(r);
    }
    await this.saveItems(changed);
  }

  // ---------------------------------------------------------------------------------------------------------- events

  /**
   * Events from what the photos show and tickets, always on the device; with the lookup on (and places), the visits
   * that look like an event are asked about: per visit only its cell, the event venues in it and its local times.
   */
  private async eventsPass() {
    if (this._options.events && this._options.places) {
      const visits = visitsOf([...this.items.values()]);
      const cellVenues = new Map<string, { name: string; kind: string }[]>();
      for (const v of visits) if (v.cell && !cellVenues.has(v.cell)) {
        const hit = await this.db!.get<{ at: number; data: CellPlaces }>('places', v.cell);
        cellVenues.set(v.cell, hit?.data.venues ?? []);
      }
      const now = this.now();
      const want = lookupCandidates(visits, v => cellVenues.get(v.cell!) ?? [])
        .filter(c => { const l = this.lookups.get(c.visit.key); return !l || (l.hit === null && now - l.at > EVENTS_TTL); })
        .slice(0, EVENTS_MAX_PER_RUN);
      const fetcher = this.deps.events ?? defaultEventsFetcher;
      for (let i = 0; i < want.length && !this.stop; i += EVENTS_CHUNK) {
        const chunk = want.slice(i, i + EVENTS_CHUNK);
        this.progress('places', i, want.length);
        let res: (EventHit | null)[];
        try { res = await fetcher(chunk.map(lookupRequest)); }
        catch (e) { if (/429|rate/i.test(String(e))) break; continue; }   // no network: events from photos and tickets stay
        this.count('eventLookups', chunk.length);
        chunk.forEach((c, j) => this.lookups.set(c.visit.key, { at: now, hit: res[j] ?? null }));
      }
      if (want.length) await this.db!.put('meta', 'eventLookups', Object.fromEntries(this.lookups));
    }
    await this.refreshEvents();
  }

  /** Recomputes events from the index (and the lookups kept), and marks each item that belongs to one */
  private async refreshEvents() {
    const lookups = new Map([...this.lookups].map(([k, v]) => [k, v.hit] as const));
    this.eventList = detectEvents([...this.items.values()], { now: this.now(), lookups });
    const by = itemEvents(this.eventList);
    const changed: Rec[] = [];
    for (const r of this.items.values()) {
      const next = by.get(r.id) ?? null;
      if (JSON.stringify(next) !== JSON.stringify(r.event ?? null)) { r.event = next; changed.push(r); }
    }
    await this.saveItems(changed);
    await this.db!.put('meta', 'events', this.eventList);
  }

  async events(): Promise<EventRec[]> { await this.init(); return this.eventList; }

  // ---------------------------------------------------------------------------------------------------------- people

  private async peoplePass(fresh: FaceRec[], model: Understander) {
    // Items understood before people was turned on: find their faces from the stored previews
    const older = [...this.items.values()].filter(r => r.stage === 'understood' && !(r as any).facesDone);
    let i = 0;
    for (const r of older) {
      if (this.stop) return;
      const thumb = await this.db!.get<Blob>('thumbs', r.id);
      if (thumb) { try { const u = await model.image(thumb, true); u.faces.forEach(f => fresh.push({ item: r.id, box: f.box, emb: f.emb, score: f.score })); } catch { /* skip */ } }
      (r as any).facesDone = true;
      if (++i % 8 === 0) this.progress('people', i, older.length);
    }
    if (older.length) await this.saveItems(older);
    if (!fresh.length) return;
    this.progress('people', older.length, older.length);
    await this.db!.putMany('faces', groupBy(fresh, f => f.item).map(([k, fs]) => [k, fs]));
    this.clusters = mergeClusters(assignFaces(this.clusters, fresh, () => `p${this.nextPerson++}`));
    await this.applyPeople();
  }
  private async applyPeople() {
    const by = new Map<string, Set<string>>();
    for (const c of this.clusters) for (const f of c.faces) { const s = by.get(f.item) ?? new Set(); s.add(c.id); by.set(f.item, s); }
    const changed: Rec[] = [];
    for (const r of this.items.values()) {
      const next = [...(by.get(r.id) ?? [])].sort();
      if (next.join() !== r.people.join()) { r.people = next; changed.push(r); }
    }
    await this.saveItems(changed);
    await this.savePeople();
  }
  private async savePeople() { await this.db!.put('meta', 'people', { clusters: this.clusters, next: this.nextPerson }); }

  // ------------------------------------------------------------------------------------------------------------ reads

  async summary(): Promise<IndexSummary> { await this.init(); return this.summaryNow(); }
  private summaryNow(): IndexSummary {
    let photos = 0, screenshots = 0, videos = 0, located = 0; let from: string | null = null, to: string | null = null;
    for (const r of this.items.values()) {
      if (r.mediaType === 'photo') photos++; else if (r.mediaType === 'screenshot') screenshots++; else videos++;
      if (r.location) located++;
      if (r.date) { if (!from || r.date < from) from = r.date; if (!to || r.date > to) to = r.date; }
    }
    return { photos, screenshots, videos, located, from, to };
  }

  private async textVec(text: string): Promise<Float32Array | null> {
    const key = text.toLowerCase();
    const hit = this.textCache.get(key);
    if (hit) return hit;
    if (!this.vectors.size) return null;
    try {
      const m = await this.getModel();
      const v = await m.text(`a photo of ${text}.`);
      if (this.textCache.size > 200) this.textCache.clear();
      this.textCache.set(key, v);
      return v;
    } catch { return null; }   // without the model, search still reads dates, places, labels and text
  }

  async search(query: string, opts: { people?: string[]; limit?: number } = {}): Promise<SearchResultsX> {
    await this.init();
    if (!this.items.size) throw new MemoryError('noIndex', 'Nothing is indexed yet.');
    const all = [...this.items.values()];
    const plan = parseQuery(query, { now: this.now(), known: knownPlaces(all) });
    const textVec = plan.visualText ? await this.textVec(plan.visualText) : null;
    const people = opts.people?.map(p => resolvePerson(this.clusters, p)?.id ?? p);
    this.searches++;
    return rank({ items: all, vectors: this.vectors, plan, query, textVec, people, limit: opts.limit, home: this.homeAt() });
  }

  /** Home, as the place with the most located days (photoStory), recomputed when the index changes size */
  private homeAt(): { lat: number; lng: number } | null {
    if (this.home && this.home.n === this.items.size) return this.home.at;
    const shots = [...this.items.values()].filter(r => r.wall != null && (r.exact || r.location)).map(r => ({ id: r.id, t: r.wall, lat: r.exact?.lat ?? r.location!.lat, lng: r.exact?.lng ?? r.location!.lng }));
    let at: { lat: number; lng: number } | null = null;
    try { const h = buildStory(shots).home; at = h ? { lat: h.lat, lng: h.lng } : null; } catch { at = null; }
    this.home = { n: this.items.size, at };
    return at;
  }

  async item(id: string): Promise<IndexedItem | null> { await this.init(); const r = this.items.get(id); return r ? publicItem(r) : null; }
  async thumbnail(id: string): Promise<Blob | null> { await this.init(); return (await this.db!.get<Blob>('thumbs', id)) ?? null; }

  async people(includeAll = false): Promise<Person[]> {
    await this.init();
    if (!this._options.people) return [];
    return peopleOf(this.clusters, this.items, includeAll) as PersonX[];
  }
  async photosOf(personId: string): Promise<SearchResult[]> {
    await this.init();
    const c = resolvePerson(this.clusters, personId);
    if (!c) return [];
    const ids = new Set(c.faces.map(f => f.item));
    return [...this.items.values()].filter(r => ids.has(r.id) && usable(r)).sort((a, b) => (b.wall ?? 0) - (a.wall ?? 0))
      .map(r => ({ ...publicItem(r), score: 1, relevance: 'high', matchedText: null, matchReasons: ['person'], duplicates: [] }));
  }
  async namePerson(personId: string, name: string | null): Promise<void> {
    await this.init();
    const c = resolvePerson(this.clusters, personId);
    if (!c) throw new MemoryError('internal', 'No such person');
    c.name = name?.trim() ? name.trim().slice(0, 60) : null;   // kept on this device only
    await this.savePeople();
  }
  async interests(window: 'now' | 'lifetime' = 'now', includeAll = false): Promise<Interest[]> {
    await this.init();
    return interestsOf([...this.items.values()], this.now(), window, includeAll) as InterestX[];
  }
  async facets(limit = 16, samples = 4): Promise<Facet[]> {
    await this.init();
    if (!this.items.size) throw new MemoryError('noIndex');
    return facetsOf([...this.items.values()], this.vectors, limit, samples);
  }
  async runTool(call: ToolCall): Promise<ToolResult> {
    await this.init();
    if (!this.items.size) return { text: 'Nothing is indexed yet.', ids: [] };
    if (call.name === 'events') return eventsTool(this.eventList, call.args ?? {}, capped);
    const countryOf = this.deps.countryOf ?? (await import('../world.ts')).countryOf;
    return runToolOn(call, {
      items: [...this.items.values()], vectors: this.vectors, now: this.now(), countryOf,
      search: (q, limit) => this.search(q, { limit }),
    });
  }

  async list(o: ListOptions = {}): Promise<IndexedItem[]> {
    await this.init();
    return listItems([...this.items.values()], o).map(publicItem);
  }

  // ---------------------------------------------------------------------------------------------------------- delete

  async deleteIndex(): Promise<void> {
    await this.init();
    this.stop = true; await this.run;
    this.queue = []; this.files.clear();
    this.items.clear(); this.vectors.clear(); this.clusters = []; this.nextPerson = 1; this.textCache.clear();
    this.skipped = 0; this.failed = 0; this.lastError = null;
    this.eventList = []; this.lookups.clear(); this.home = null;
    // Keeps models, place data, options and a pause, as Rollup does
    await this.db!.clear('items', 'vectors', 'thumbs', 'faces');
    await this.db!.del('meta', 'people'); await this.db!.del('meta', 'firstBuilt');
    await this.db!.del('meta', 'events'); await this.db!.del('meta', 'eventLookups');
    this.firstBuilt = null;
    flagOn(false);
    try { await this.deps.onDeleted?.(); } catch { /* the native side forgets on its own next time */ }
    this.setState({ type: 'notStarted' });
  }

  async reset(): Promise<void> {
    await this.init();
    this.stop = true; await this.run;
    this.model?.dispose(); this.model = null; this.modelLoading = null;
    await this.ocr?.close().catch(() => {}); this.ocr = null;
    this.queue = []; this.files.clear(); this.items.clear(); this.vectors.clear(); this.clusters = []; this.textCache.clear();
    this.promptMatrix = null; this.firstBuilt = null; this.paused = false; this.lastError = null; this.nextPerson = 1;
    this.eventList = []; this.lookups.clear(); this.home = null; this.searches = 0;
    this._options = { ...DEFAULT_OPTIONS };
    this.db!.close(); this.db = null;
    const idb = this.deps.idb ?? indexedDB;
    await deleteDb(idb, this.deps.dbName);
    // The folder chosen for Keep adding, and what was read from it
    try { await deleteDb(idb, `${this.deps.dbName ?? 'belluh-memory'}-folder`); } catch { /* none */ }
    // Downloaded models (Cache Storage) and tesseract's language data (its own IndexedDB store)
    const { MODEL_CACHE } = await import('./constants.ts');
    for (const name of this.deps.modelCaches ?? ['transformers-cache', MODEL_CACHE]) { try { await caches?.delete(name); } catch { /* no Cache Storage here */ } }
    try { await deleteTessCache(idb); } catch { /* nothing cached */ }
    this.ready = null;
    flagOn(false);
    try { await this.deps.onDeleted?.(); } catch { /* the native side forgets on its own next time */ }
    await this.init();
    this.setState({ type: 'notStarted' });
  }
}

// ---------------------------------------------------------------------------------------------------------- helpers

const isFood = (r: Rec) => r.labels.some(l => l.p >= LABEL_MIN && ['food', 'drink'].includes(LABEL_BY_NAME.get(l.name)?.group ?? ''));
function groupBy<T>(xs: T[], k: (x: T) => string): [string, T[]][] { const m = new Map<string, T[]>(); xs.forEach(x => m.set(k(x), [...(m.get(k(x)) ?? []), x])); return [...m.entries()]; }
function neighbors(lat: number, lng: number): string[] {
  const out: string[] = [];
  for (const a of [-0.01, 0, 0.01]) for (const b of [-0.01, 0, 0.01]) if (a || b) out.push(cellOf(lat + a, lng + b));
  return out;
}

/** tesseract.js keeps language data in idb-keyval's "keyval-store" under our cache path; remove only those keys */
async function deleteTessCache(idb: IDBFactory) {
  const { TESS_CACHE } = await import('./constants.ts');
  await new Promise<void>((ok) => {
    const open = idb.open('keyval-store');
    open.onupgradeneeded = () => { open.transaction?.abort(); ok(); };
    open.onerror = () => ok();
    open.onsuccess = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('keyval')) { db.close(); ok(); return; }
      const t = db.transaction('keyval', 'readwrite'); const st = t.objectStore('keyval');
      const keys = st.getAllKeys();
      keys.onsuccess = () => { for (const k of keys.result) if (String(k).startsWith(TESS_CACHE)) st.delete(k); };
      t.oncomplete = () => { db.close(); ok(); }; t.onerror = () => { db.close(); ok(); };
    };
  });
}

/** Sends only cells to Belluh's memory-places function, signed in; nothing about photos or times */
async function defaultPlacesFetcher(cells: string[]): Promise<CellPlaces[]> {
  const { supabase } = await import('../supabaseClient.ts');
  const { data, error } = await supabase.functions.invoke('memory-places', { body: { cells } });
  if (error) throw error;
  return Array.isArray(data?.cells) ? data.cells : [];
}

/** Sends visits to Belluh's memory-events function, signed in: per visit a cell, venue names and local times only */
async function defaultEventsFetcher(visits: { cell: string; venues: string[]; start: string; end: string }[]): Promise<(EventHit | null)[]> {
  const { supabase } = await import('../supabaseClient.ts');
  const { data, error } = await supabase.functions.invoke('memory-events', { body: { visits } });
  if (error) throw error;
  const out: (EventHit | null)[] = visits.map(() => null);
  for (const r of Array.isArray(data?.visits) ? data.visits : []) if (Number.isInteger(r?.i) && r.i >= 0 && r.i < out.length && r.hit?.name) out[r.i] = r.hit;
  return out;
}

let singleton: BrowserMemoryEngine | null = null;
export function createMemoryEngine(deps?: EngineDeps): BrowserMemoryEngine { return new BrowserMemoryEngine(deps); }
/** The engine for this profile; deps apply only to the first call (the native app passes its photo reader) */
export function getEngine(deps?: EngineDeps): BrowserMemoryEngine { singleton ??= new BrowserMemoryEngine(deps); return singleton; }
export const memory: MemoryEngine = new Proxy({} as MemoryEngine, { get: (_t, k) => { const e = getEngine() as any; const v = e[k]; return typeof v === 'function' ? v.bind(e) : v; } });
