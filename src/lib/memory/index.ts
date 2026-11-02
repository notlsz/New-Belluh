// Belluh Memory's entry point. The on-device engine (src/lib/memory/engine*, built separately) replaces this getter;
// until it lands, Memory reports that it isn't available on this device and nothing else changes.
import type { MemoryEngine } from './types';

export async function getMemoryEngine(): Promise<MemoryEngine | null> {
  return null;
}
