// Keep adding, after Rollup's `updatesAutomatically`, as far as the web allows: on desktop Chrome and Edge the person
// picks a folder once (File System Access API); Belluh keeps the folder's handle in this browser (IndexedDB) and, each
// time they come back to Belluh, reads only the photos and videos that are new or changed in it and adds them to the
// index. A browser asks again for permission when it wants to; then a tap on "Allow" continues. Nothing is uploaded:
// the files are read on this device, like any picked photo. Hidden where the API is missing (Safari, Firefox, phones).

const DB = 'belluh-memory-folder';
const STORE = 'folder';
const MEDIA_RE = /\.(jpe?g|heic|heif|png|webp|gif|avif|tiff?|mov|mp4|m4v|webm)$/i;
/** At most this many new files per visit, newest first; the rest come next time */
export const PER_VISIT = 1500;
/** Not more often than this while the tab keeps coming back into view */
export const RESCAN_MS = 10 * 60_000;

export interface FolderState { name: string; addedAt: number; lastScan: number | null; lastAdded: number; seen: Record<string, string> }
export type FolderPermission = 'granted' | 'prompt' | 'denied' | 'none';

/** Desktop Chrome and Edge: a real directory picker with handles that can be kept */
export function folderSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  if (typeof w.showDirectoryPicker !== 'function' || typeof w.FileSystemHandle !== 'function') return false;
  // Phones and tablets: no folders of photos to keep
  const mobile = (navigator as any).userAgentData?.mobile ?? /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  return !mobile;
}

function open(idb: IDBFactory = indexedDB, name = DB): Promise<IDBDatabase> {
  return new Promise((ok, no) => {
    const r = idb.open(name, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); };
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T> | void, idb?: IDBFactory): Promise<T | undefined> {
  const db = await open(idb);
  try {
    return await new Promise<T | undefined>((ok, no) => {
      const t = db.transaction(STORE, mode); const r = f(t.objectStore(STORE));
      t.oncomplete = () => ok(r ? r.result : undefined); t.onerror = () => no(t.error);
    });
  } finally { db.close(); }
}

export async function savedFolder(idb?: IDBFactory): Promise<{ handle: any; state: FolderState } | null> {
  try {
    const handle = await tx<any>('readonly', s => s.get('handle'), idb);
    const state = await tx<FolderState>('readonly', s => s.get('state'), idb);
    return handle && state ? { handle, state } : null;
  } catch { return null; }
}
async function saveState(state: FolderState, idb?: IDBFactory) { await tx('readwrite', s => { s.put(state, 'state'); }, idb); }

/** Forget the folder: nothing is read from it again. What was already indexed stays (delete the index to remove it). */
export async function forgetFolder(idb?: IDBFactory): Promise<void> {
  try { await tx('readwrite', s => { s.delete('handle'); s.delete('state'); }, idb); } catch { /* nothing kept */ }
}

export async function permissionOf(handle: any): Promise<FolderPermission> {
  if (!handle?.queryPermission) return 'none';
  try { return await handle.queryPermission({ mode: 'read' }); } catch { return 'denied'; }
}
/** Needs a tap: browsers only ask from a user action */
export async function askPermission(handle: any): Promise<FolderPermission> {
  try { return await handle.requestPermission({ mode: 'read' }); } catch { return 'denied'; }
}

/** A file's identity in the folder: where it is, its size and when it changed. Nothing about what it shows. */
export const fileKey = (f: { size: number; lastModified: number }) => `${f.size}:${f.lastModified}`;

/** Walks the folder (subfolders up to 6 deep, hidden ones skipped) and returns the media files not seen before, newest first */
export async function newFiles(dir: any, seen: Record<string, string>, limit = PER_VISIT): Promise<{ files: File[]; seen: Record<string, string>; more: number }> {
  const found: { path: string; file: File }[] = [];
  const walk = async (d: any, prefix: string, depth: number) => {
    for await (const h of d.values()) {
      if (h.name.startsWith('.')) continue;
      if (h.kind === 'file' && MEDIA_RE.test(h.name)) {
        const path = prefix + h.name;
        const file: File = await h.getFile();
        if (seen[path] !== fileKey(file)) found.push({ path, file });
      } else if (h.kind === 'directory' && depth < 6) await walk(h, `${prefix}${h.name}/`, depth + 1);
    }
  };
  await walk(dir, '', 0);
  found.sort((a, b) => b.file.lastModified - a.file.lastModified);
  const take = found.slice(0, limit);
  const next = { ...seen };
  for (const f of take) next[f.path] = fileKey(f.file);
  return { files: take.map(f => f.file), seen: next, more: found.length - take.length };
}

/** Opens the folder picker and keeps the folder. Resolves to its name, or null when cancelled. */
export async function chooseFolder(idb?: IDBFactory): Promise<string | null> {
  const w = window as any;
  let handle: any;
  try { handle = await w.showDirectoryPicker({ id: 'belluh-memory', mode: 'read', startIn: 'pictures' }); } catch { return null; }
  const state: FolderState = { name: String(handle.name ?? '').slice(0, 120), addedAt: Date.now(), lastScan: null, lastAdded: 0, seen: {} };
  await tx('readwrite', s => { s.put(handle, 'handle'); s.put(state, 'state'); }, idb);
  return state.name;
}

/**
 * Reads what is new in the kept folder and hands it to the engine. `interactive` (from a tap) may ask for permission;
 * otherwise, without permission, it does nothing and says so. Returns how many files were added.
 */
export async function scanFolder(addFiles: (files: File[]) => Promise<void>, o: { interactive?: boolean; force?: boolean; now?: number; idb?: IDBFactory; kept?: { handle: any; state: FolderState } | null; save?: (s: FolderState) => Promise<void> } = {}): Promise<{ added: number; permission: FolderPermission; more: number }> {
  const kept = o.kept !== undefined ? o.kept : await savedFolder(o.idb);
  if (!kept) return { added: 0, permission: 'none', more: 0 };
  const now = o.now ?? Date.now();
  let perm = await permissionOf(kept.handle);
  if (perm === 'prompt' && o.interactive) perm = await askPermission(kept.handle);
  if (perm !== 'granted') return { added: 0, permission: perm, more: 0 };
  if (!o.force && kept.state.lastScan && now - kept.state.lastScan < RESCAN_MS) return { added: 0, permission: perm, more: 0 };
  const { files, seen, more } = await newFiles(kept.handle, kept.state.seen);
  const next: FolderState = { ...kept.state, seen, lastScan: now, lastAdded: files.length };
  if (o.save) await o.save(next); else await saveState(next, o.idb);
  if (o.kept) o.kept.state = next;
  // Handed over, not waited for: indexing runs on while the person uses Belluh
  if (files.length) void Promise.resolve(addFiles(files)).catch(() => {});
  return { added: files.length, permission: perm, more };
}
