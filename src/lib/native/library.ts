// Keep adding, in the app: with photo access, Belluh reads the library in batches when it opens and each time it comes
// back to the front (at most every ten minutes), newest first and then back through the engine's window. The
// background task (BGProcessingTask on iOS, WorkManager on Android) prepares new photos in between so these runs are
// quick. A batch is marked done only after the engine has it, so nothing is skipped if Belluh is closed mid-run.

import type { MemoryEngine } from '../memory/types.ts';
import { BelluhPhotos, assetFile, type BelluhPhotosPlugin, type NativeAsset, type PhotoAccess } from './photos.ts';

export const BATCH = 60;
export const PER_VISIT = 1500;
export const RESCAN_MS = 10 * 60_000;

export interface SyncDeps {
  plugin: Pick<BelluhPhotosPlugin, 'nextBatch' | 'commit'>;
  addFiles: (files: File[]) => Promise<void>;
  /** Reads a copy from the app's cache */
  load: (path: string) => Promise<Blob>;
  makeFile?: (a: NativeAsset, b: Blob) => File;
  notBefore?: number;
  limit?: number;
  max?: number;
  shouldStop?: () => boolean;
}

/** Reads batches until the library is caught up or this visit's share is done. Returns how many were added. */
export async function syncLibrary(d: SyncDeps): Promise<{ added: number; more: boolean }> {
  const limit = d.limit ?? BATCH, max = d.max ?? PER_VISIT, make = d.makeFile ?? assetFile;
  let added = 0, more = true, seen = 0;
  while (more && seen < max && !d.shouldStop?.()) {
    const b = await d.plugin.nextBatch({ limit, notBefore: d.notBefore });
    const files: File[] = [];
    for (const a of b.assets ?? []) {
      try { files.push(make(a, await d.load(a.path))); } catch { /* a copy that went missing: the next visit reads it again */ }
    }
    if (files.length) await d.addFiles(files);
    await d.plugin.commit({ cursor: b.cursor ?? {}, ids: (b.assets ?? []).map(a => a.id) });
    added += files.length;
    seen += (b.assets ?? []).length;
    more = !!b.more;
    // Nothing came back and nothing moved: done, whatever "more" says
    if (!(b.assets ?? []).length && !Object.keys(b.cursor ?? {}).length) break;
  }
  return { added, more };
}

/** The engine's window as a date: photos older than this are not read */
export function notBeforeOf(engine: Pick<MemoryEngine, 'options'>, firstBuilt: number | null, now = Date.now()): number | undefined {
  const w = (engine.options as any)?.window as { kind?: string; months?: number } | undefined;
  if (!w?.months) return undefined;
  const from = w.kind === 'growing' ? (firstBuilt ?? now) : now;
  return Math.round(from - w.months * 30.44 * 86_400_000);
}

// --------------------------------------------------------------------------------------------- wired to the app

const listeners = new Set<() => void>();
export const onLibraryChange = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
const changed = () => listeners.forEach(f => { try { f(); } catch { /* a screen's problem */ } });

let last = 0, running: Promise<{ added: number; more: boolean } | null> | null = null, started = false;
export let lastResult: { added: number; at: number } | null = null;

const loadCopy = async (path: string) => {
  const { Capacitor } = await import('@capacitor/core');
  const r = await fetch(Capacitor.convertFileSrc(path));
  if (!r.ok) throw new Error(`copy ${r.status}`);
  return r.blob();
};

export async function photoAccess(plugin: Pick<BelluhPhotosPlugin, 'checkPermissions'> = BelluhPhotos): Promise<PhotoAccess> {
  try { return (await plugin.checkPermissions()).photos; } catch { return 'denied'; }
}

/** One visit's reading, if Memory is on and photos are allowed. force: skip the ten-minute wait. */
export function runLibrary(o: { force?: boolean } = {}): Promise<{ added: number; more: boolean } | null> {
  if (running) return running;
  if (!o.force && Date.now() - last < RESCAN_MS) return Promise.resolve(null);
  running = (async () => {
    const { memoryEnabled, getMemory } = await import('../memory/index.ts');
    if (!memoryEnabled()) return null;
    const access = await photoAccess();
    if (access !== 'granted' && access !== 'limited') return null;
    const engine = await getMemory();
    if (engine.state().type === 'paused') return null;
    // A growing window starts from the first index, which is about now the first time; the engine checks each photo too
    const notBefore = notBeforeOf(engine, null);
    await BelluhPhotos.setBackground({ enabled: true, notBefore }).catch(() => {});
    last = Date.now();
    const add = (files: File[]) => (engine as unknown as { addFiles(f: File[], o: { source: 'library' }): Promise<void> }).addFiles(files, { source: 'library' });
    const r = await syncLibrary({ plugin: BelluhPhotos, addFiles: add, load: loadCopy, notBefore, shouldStop: () => engine.state().type === 'paused' });
    lastResult = { added: r.added, at: Date.now() };
    return r;
  })().catch(e => { console.warn('belluh memory: could not read the photo library', e); return null; })
    .finally(() => { running = null; changed(); });
  return running;
}

/** When Belluh opens and each time it comes back to the front */
export function startLibrary(): void {
  if (started || typeof document === 'undefined') return;
  started = true;
  // Images shared to Belluh while Memory was off
  void import('./share.ts').then(m => m.flushShares()).catch(() => {});
  const go = () => { if (document.visibilityState === 'visible') void runLibrary(); };
  go();
  document.addEventListener('visibilitychange', go);
}

/** Memory deleted or reset on this phone: forget where reading got to, stop the background task */
export async function forgetLibrary(plugin: Pick<BelluhPhotosPlugin, 'reset'> = BelluhPhotos): Promise<void> {
  last = 0; lastResult = null;
  try { await plugin.reset(); } catch { /* not the app */ }
  changed();
}
