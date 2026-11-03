// Keep adding, wired to the app: when Memory is on in this browser and a folder was kept (desktop Chrome and Edge),
// read what is new in it when Belluh opens and each time its tab comes back into view (at most every ten minutes).
// Without permission it waits quietly; Memory settings and the Afterglow page show "Allow" for a tap.
import { memoryEnabled, getMemory } from './index.ts';
import { folderSupported, scanFolder, savedFolder } from './folder.ts';

let started = false;
const listeners = new Set<() => void>();
/** Something changed (a scan ran): let the screens that show the folder refresh */
export const onFolderChange = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
export const folderChanged = () => listeners.forEach(f => { try { f(); } catch { /* a screen's problem */ } });

export async function runKeepAdding(o: { interactive?: boolean; force?: boolean } = {}) {
  if (!memoryEnabled() || !folderSupported()) return null;
  if (!(await savedFolder())) return null;
  const engine = await getMemory();
  const add = (engine as unknown as { addFiles(f: File[], o?: { source: 'folder' }): Promise<void> }).addFiles.bind(engine);
  const r = await scanFolder(files => add(files, { source: 'folder' }), o);
  folderChanged();
  return r;
}

export function startKeepAdding(): void {
  if (started || typeof document === 'undefined' || !memoryEnabled() || !folderSupported()) return;
  started = true;
  const go = () => { if (document.visibilityState === 'visible') void runKeepAdding().catch(() => {}); };
  go();
  document.addEventListener('visibilitychange', go);
}
