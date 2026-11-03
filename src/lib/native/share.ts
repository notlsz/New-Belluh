// Share to Belluh (Android now; iOS needs a Share Extension, see docs/native-app.md): a screenshot of a restaurant,
// a ticket or a bag shared from any app goes into Belluh Memory on this phone, where "every screenshot is a plan"
// reads it. With Memory off, shared images wait on the device until it is turned on. Nothing is uploaded.

import type { SharedFile } from './photos.ts';

const KEY = 'belluh_shared_pending';
const MAX_PENDING = 40;

export function pendingShares(): SharedFile[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(v) ? v.filter(x => typeof x?.path === 'string') : []; } catch { return []; }
}
function setPending(list: SharedFile[]) {
  try { if (list.length) localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_PENDING))); else localStorage.removeItem(KEY); } catch { /* storage off */ }
}

/** Shared images named so the engine reads them as screenshots (their text becomes plans) */
export function sharedFile(f: SharedFile, blob: Blob, i: number, now = Date.now()): File {
  const ext = (f.mimeType.split('/')[1] ?? 'png').replace('jpeg', 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'png';
  return new File([blob], `Screenshot shared ${i + 1}.${ext}`, { type: f.mimeType || 'image/png', lastModified: now });
}

export interface ShareDeps {
  memoryOn: () => boolean;
  load: (path: string) => Promise<Blob>;
  add: (files: File[]) => Promise<void>;
}

/** Adds shared images to Memory when it is on; otherwise keeps them for later. Returns how many were added. */
export async function receiveShared(files: SharedFile[], d: ShareDeps): Promise<number> {
  const all = [...pendingShares(), ...files];
  if (!all.length) return 0;
  if (!d.memoryOn()) { setPending(all); return 0; }
  const out: File[] = [];
  for (const [i, f] of all.entries()) { try { out.push(sharedFile(f, await d.load(f.path), i)); } catch { /* gone from the cache */ } }
  setPending([]);
  if (out.length) await d.add(out);
  return out.length;
}

async function deps(): Promise<ShareDeps> {
  const [{ Capacitor }, mem] = await Promise.all([import('@capacitor/core'), import('../memory/index.ts')]);
  return {
    memoryOn: () => mem.memoryEnabled() && mem.memorySupported(),
    load: async p => { const r = await fetch(Capacitor.convertFileSrc(p)); if (!r.ok) throw new Error(String(r.status)); return r.blob(); },
    add: async files => { const e = await mem.getMemory(); await (e as unknown as { addFiles(f: File[], o: { source: 'picked' }): Promise<void> }).addFiles(files, { source: 'picked' }); },
  };
}

/** Shares that arrived before the page was listening, and every one after */
export async function listenForShares(): Promise<void> {
  const { BelluhPhotos } = await import('./photos.ts');
  const d = await deps();
  await BelluhPhotos.addListener('shared', e => { void receiveShared(e?.files ?? [], d).catch(() => {}); });
  try { const s = await BelluhPhotos.getShared(); await receiveShared(s?.files ?? [], d); } catch { /* nothing shared */ }
}

/** Memory was just turned on: add what was shared while it was off */
export async function flushShares(): Promise<number> {
  if (!pendingShares().length) return 0;
  return receiveShared([], await deps());
}
