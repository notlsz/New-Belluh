// The one place the app reaches the on-device engine. src/lib/memory/index.ts belongs to the engine; this reads it
// lazily so the engine (models, IndexedDB) loads only when Memory is opened, and tolerates how index.ts names it.
import type { MemoryEngine } from './types';

let cached: Promise<MemoryEngine | null> | null = null;

export function loadEngine(): Promise<MemoryEngine | null> {
  if (!cached) cached = import('./index').then(async (m: any) => {
    const get = m.getMemoryEngine ?? m.getEngine ?? m.memoryEngine ?? m.engine ?? m.default;
    const e = typeof get === 'function' ? await get() : await get;
    return (e && typeof e.runTool === 'function') ? e as MemoryEngine : null;
  }).catch(() => null);
  return cached;
}

/** For the dev harness and tests: use this engine instead */
export function setEngineForHarness(e: MemoryEngine | null): void { cached = Promise.resolve(e); }
