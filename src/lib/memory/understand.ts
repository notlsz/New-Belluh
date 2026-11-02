// The engine's side of the understanding worker (worker.ts): starts it, loads the models, and turns calls into
// messages. The worker is its own chunk, fetched only when Memory indexes or searches by image.

import type { Understander, Understood } from './engine.ts';
import type { WorkerIn, WorkerOut } from './worker.ts';
import { LABELS, SENSITIVE, promptOf } from './vocab.ts';

export async function workerUnderstander(opts: { vision?: 'fp16' | 'fp32' } = {}): Promise<Understander> {
  const w = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module', name: 'belluh-memory' });
  let seq = 0;
  const waiting = new Map<string, { ok: (v: any) => void; no: (e: Error) => void }>();
  let onProgress: ((mb: number, total: number) => void) | null = null;
  let loaded: { ok: (v: any) => void; no: (e: Error) => void } | null = null;
  // One image at a time: the worker is single-threaded and this keeps memory flat
  let chain: Promise<unknown> = Promise.resolve();
  w.onmessage = (e: MessageEvent<WorkerOut>) => {
    const m = e.data;
    if (m.type === 'progress') onProgress?.(m.loaded, m.total);
    else if (m.type === 'loaded') loaded?.ok(m);
    else if (m.type === 'image' || m.type === 'text') { waiting.get(m.id)?.ok(m); waiting.delete(m.id); }
    else if (m.type === 'error') {
      const err = new Error(m.message);
      if (m.id && waiting.has(m.id)) { waiting.get(m.id)!.no(err); waiting.delete(m.id); } else loaded?.no(err);
    }
  };
  w.onerror = e => { const err = new Error(e.message || 'worker'); loaded?.no(err); waiting.forEach(p => p.no(err)); waiting.clear(); };
  const call = <T>(msg: WorkerIn, transfer: Transferable[] = []) => new Promise<T>((ok, no) => {
    waiting.set((msg as any).id, { ok, no });
    w.postMessage(msg, transfer);
  });

  return {
    load({ faces, onProgress: p, cache }) {
      onProgress = p;
      return new Promise((ok, no) => {
        loaded = { ok: (m: Extract<WorkerOut, { type: 'loaded' }>) => ok({ promptMatrix: m.promptMatrix, vision: m.vision }), no };
        w.postMessage({ type: 'load', vision: opts.vision ?? 'fp16', prompts: LABELS.map(promptOf), promptCache: cache?.labels ?? null, sensitive: SENSITIVE, sensCache: cache?.sens ?? null, faces } satisfies WorkerIn);
      });
    },
    image(work, faces) {
      const run = async (): Promise<Understood> => {
        const bitmap = work instanceof Blob ? await createImageBitmap(work) : work;
        const id = `i${++seq}`;
        const m = await call<Extract<WorkerOut, { type: 'image' }>>({ type: 'image', id, bitmap, faces }, [bitmap]);
        return { vec: m.vec, sims: m.sims, sens: m.sens, faces: m.faces };
      };
      const p = chain.then(run, run);
      chain = p.catch(() => {});
      return p;
    },
    async text(text) {
      const id = `t${++seq}`;
      const m = await call<Extract<WorkerOut, { type: 'text' }>>({ type: 'text', id, text });
      return m.vec;
    },
    dispose() { w.terminate(); waiting.clear(); },
  };
}
