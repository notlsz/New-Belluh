// Belluh Memory's light entry point: safe to import anywhere, loads nothing heavy. The engine (engine.ts) is fetched
// only when something asks for it, and the models only once the person turns Memory on and indexing starts.
//
// On the web, the person picks what is indexed: pickFiles() opens the photo picker (photos and videos, many at once);
// on desktop Chrome and Edge, pickFolder() reads a whole folder. Nothing reads a camera roll on its own, and indexing
// only runs while Belluh is open.

import { useEffect, useState } from 'react';
import type { IndexingState, MemoryEngine } from './types.ts';
import { MEMORY_ON_FLAG as FLAG } from './constants.ts';

export * from './types.ts';

/** Whether Memory is on in this browser: set when the person first adds photos, cleared by deleteIndex and reset */
export function memoryEnabled(): boolean {
  try { return localStorage.getItem(FLAG) === '1'; } catch { return false; }
}
export function setMemoryEnabled(on: boolean): void {
  try { if (on) localStorage.setItem(FLAG, '1'); else localStorage.removeItem(FLAG); } catch { /* private mode: off */ }
}

/** Whether this browser can run the engine: IndexedDB, module workers, WebAssembly, image decoding off the page */
export function memorySupported(): boolean {
  const g = globalThis as any;
  return typeof window !== 'undefined' && !!g.indexedDB && typeof g.Worker === 'function' && typeof g.WebAssembly === 'object'
    && typeof g.createImageBitmap === 'function' && typeof g.OffscreenCanvas === 'function' && !!g.crypto?.subtle;
}

let enginePromise: Promise<MemoryEngine> | null = null;
/** The engine for this browser profile, loaded on first use */
export function getMemory(): Promise<MemoryEngine> {
  enginePromise ??= import('./engine.ts').then(m => m.getEngine());
  return enginePromise;
}

/** The contract's entry point (engineRef.ts): the real engine where the browser supports it, null otherwise */
export async function getMemoryEngine(): Promise<MemoryEngine | null> {
  if (!memorySupported()) return null;
  try { return await getMemory(); } catch { return null; }
}

/** Hands picked files to Memory when it is on; does nothing (and loads nothing) when it is off */
export function feedMemory(files: File[] | FileList): void {
  if (!memoryEnabled() || !memorySupported()) return;
  const list = Array.from(files);
  if (!list.length) return;
  void getMemory().then(m => m.addFiles(list)).catch(e => console.warn('belluh memory: could not add photos', e));
}

/** The indexing state, live. null until the engine has loaded. Loads the engine (not the models). */
export function useMemoryState(enabled = true): IndexingState | null {
  const [s, setS] = useState<IndexingState | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let off: (() => void) | null = null, gone = false;
    void getMemory().then(m => { if (!gone) off = m.onState(setS); });
    return () => { gone = true; off?.(); };
  }, [enabled]);
  return s;
}

export const MEDIA_ACCEPT = 'image/*,video/*';
const MEDIA_RE = /\.(jpe?g|heic|heif|png|webp|gif|avif|tiff?|mov|mp4|m4v|webm)$/i;

/** Opens the system picker for photos and videos (many at once). Resolves to what was picked, [] when cancelled. */
export function pickFiles(o: { folder?: boolean } = {}): Promise<File[]> {
  return new Promise(ok => {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = MEDIA_ACCEPT;
    if (o.folder) (input as any).webkitdirectory = true;
    input.style.display = 'none';
    input.onchange = () => { ok(Array.from(input.files ?? []).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/') || MEDIA_RE.test(f.name))); input.remove(); };
    (input as any).oncancel = () => { ok([]); input.remove(); };
    document.body.appendChild(input);
    input.click();
  });
}

/** Whether this browser can read a whole folder (desktop Chrome and Edge) */
export const canPickFolder = () => typeof window !== 'undefined' && ('showDirectoryPicker' in window || 'webkitdirectory' in document.createElement('input'));

/** Reads every photo and video in a folder the person chooses, subfolders included (File System Access API, else webkitdirectory) */
export async function pickFolder(): Promise<File[]> {
  const w = window as any;
  if (!w.showDirectoryPicker) return pickFiles({ folder: true });
  let dir: any;
  try { dir = await w.showDirectoryPicker({ id: 'belluh-memory', mode: 'read', startIn: 'pictures' }); } catch { return []; }
  const out: File[] = [];
  const walk = async (d: any, depth: number) => {
    for await (const h of d.values()) {
      if (h.kind === 'file' && MEDIA_RE.test(h.name)) out.push(await h.getFile());
      else if (h.kind === 'directory' && depth < 6 && !h.name.startsWith('.')) await walk(h, depth + 1);
    }
  };
  await walk(dir, 0);
  return out;
}
