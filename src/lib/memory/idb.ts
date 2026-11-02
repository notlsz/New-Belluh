// A tiny IndexedDB wrapper for Belluh Memory. Everything the engine keeps lives in one database in this browser
// profile ("belluh-memory"); nothing in it is ever sent anywhere.

export const DB_NAME = 'belluh-memory';
export const STORES = ['items', 'vectors', 'thumbs', 'faces', 'meta', 'places'] as const;
export type StoreName = typeof STORES[number];

const req = <T>(r: IDBRequest<T>) => new Promise<T>((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });

export interface Db {
  get<T = unknown>(s: StoreName, k: string): Promise<T | undefined>;
  put(s: StoreName, k: string, v: unknown): Promise<void>;
  putMany(s: StoreName, rows: [string, unknown][]): Promise<void>;
  del(s: StoreName, k: string): Promise<void>;
  delMany(s: StoreName, keys: string[]): Promise<void>;
  all<T = unknown>(s: StoreName): Promise<[string, T][]>;
  clear(...s: StoreName[]): Promise<void>;
  close(): void;
}

export async function openDb(idb: IDBFactory = indexedDB, name = DB_NAME): Promise<Db> {
  const open = idb.open(name, 1);
  open.onupgradeneeded = () => { for (const s of STORES) if (!open.result.objectStoreNames.contains(s)) open.result.createObjectStore(s); };
  const db = await req(open);
  // Another tab deleting the database (reset) closes ours instead of blocking it
  db.onversionchange = () => db.close();
  const tx = (s: StoreName | StoreName[], mode: IDBTransactionMode) => db.transaction(s, mode);
  const done = (t: IDBTransaction) => new Promise<void>((ok, no) => { t.oncomplete = () => ok(); t.onerror = () => no(t.error); t.onabort = () => no(t.error ?? new Error('aborted')); });
  return {
    get: (s, k) => req(tx(s, 'readonly').objectStore(s).get(k)),
    async put(s, k, v) { const t = tx(s, 'readwrite'); t.objectStore(s).put(v, k); await done(t); },
    async putMany(s, rows) { if (!rows.length) return; const t = tx(s, 'readwrite'); const st = t.objectStore(s); for (const [k, v] of rows) st.put(v, k); await done(t); },
    async del(s, k) { const t = tx(s, 'readwrite'); t.objectStore(s).delete(k); await done(t); },
    async delMany(s, keys) { if (!keys.length) return; const t = tx(s, 'readwrite'); const st = t.objectStore(s); for (const k of keys) st.delete(k); await done(t); },
    async all(s) {
      const st = tx(s, 'readonly').objectStore(s);
      const [keys, vals] = await Promise.all([req(st.getAllKeys()), req(st.getAll())]);
      return keys.map((k, i) => [String(k), vals[i]] as [string, any]);
    },
    async clear(...ss) { const t = tx(ss, 'readwrite'); for (const s of ss) t.objectStore(s).clear(); await done(t); },
    close: () => db.close(),
  };
}

export function deleteDb(idb: IDBFactory = indexedDB, name = DB_NAME): Promise<void> {
  return new Promise((ok, no) => { const r = idb.deleteDatabase(name); r.onsuccess = () => ok(); r.onerror = () => no(r.error); r.onblocked = () => ok(); });
}
