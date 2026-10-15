// Belluh is one presence, so every orb on screen is the same water: thinking, listening, talking and its shape
// show wherever Belluh appears. This owns that one water body; BelluhOrb draws it.
import { createBelluhWater, type BelluhWater, type ShapeSpec } from './belluhWater';

const RENDER = 200; // px: the largest orb (48px, drawn 1.4x for the overhang) on a 3x screen
const KEY = 'belluh_shape';

/** A shape Belluh chose (from the take_shape tool): back to water, an emoji, or an SVG path in a 100x100 box. */
export type AgentShape = { water: true } | { label?: string; emoji?: string; path?: string };

/** What Belluh is doing right now, as people see it. */
export type BelluhState = 'idle' | 'listening' | 'thinking' | 'talking';

let water: BelluhWater | null | undefined;
let thinking = 0;
let talking = 0;
let heardAt = 0;
let quiet: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<(s: BelluhState) => void>();

function current(): BelluhState {
  // Working on something new wins over finishing the last reply
  if (thinking > 0) return 'thinking';
  if (talking > 0) return 'talking';
  return Date.now() - heardAt < 1200 ? 'listening' : 'idle';
}

function settle() {
  const state = current();
  water?.setState(state === 'listening' ? 'idle' : state); // the water shows listening through each keystroke's ring
  mark('belluhState', state);
  listeners.forEach(fn => fn(state));
}

/** Belluh's state and shape on the page root (data-belluh-state, data-belluh-shape), for styling and tests. */
function mark(key: 'belluhState' | 'belluhShape' | 'belluhHeard', value: string) {
  try { document.documentElement.dataset[key] = value; } catch { /* no document */ }
}

function remember(spec: ShapeSpec | 'water', label: string) {
  try {
    if (spec === 'water') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify({ spec, label }));
  } catch { /* storage off: the shape just won't survive a reload */ }
}

/**
 * True when WebGL would run on the CPU (no usable GPU): the 3D water would make the whole app sluggish there, so it
 * shows the light 2D water instead. localStorage belluh_water=force overrides this (used by the orb test).
 */
function softwareOnly(): boolean {
  try {
    if (localStorage.getItem('belluh_water') === 'force') return false;
    const g = document.createElement('canvas').getContext('webgl');
    if (!g) return true;
    const info = g.getExtension('WEBGL_debug_renderer_info');
    const name = String(info ? g.getParameter(info.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER));
    g.getExtension('WEBGL_lose_context')?.loseContext();
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch { return false; }
}

/** The shared water body, or null if this device can't draw it (then orbs fall back to the 2D pond). */
export function belluhWater(): BelluhWater | null {
  if (water !== undefined) return water;
  try { water = softwareOnly() ? null : createBelluhWater(RENDER); } catch { water = null; }
  if (water) {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved?.spec && water.setShape(saved.spec, saved.label)) mark('belluhShape', saved.label);
    } catch { /* nothing saved */ }
  }
  return water;
}

export const belluh = {
  /** While something is waiting on Belluh: the ripples circle fast and the water glows. Returns the release. */
  holdThinking(): () => void {
    thinking++; settle();
    let done = false;
    return () => { if (!done) { done = true; thinking--; settle(); } };
  },
  /** Someone typed to Belluh: a small ring runs up the front of the water. */
  key() {
    belluhWater()?.key();
    heardAt = Date.now();
    mark('belluhHeard', String(heardAt));
    settle();
    clearTimeout(quiet);
    quiet = setTimeout(settle, 1250);
  },
  /** What Belluh is doing now, and a way to follow it. subscribe returns the unsubscribe. */
  state: (): BelluhState => current(),
  subscribe(fn: (s: BelluhState) => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; },
  /** Make sure the shared water is drawn sharply enough for an orb this many device pixels wide. */
  ensureResolution(px: number) {
    const w = belluhWater();
    const want = Math.min(640, Math.round(px));
    if (w && w.size < want) w.resize(want);
  },
  /** Belluh starts saying something; every word() moves the water. Returns the stop. */
  talk(): () => void {
    talking++; settle();
    let done = false;
    return () => { if (!done) { done = true; talking--; settle(); } };
  },
  word(w: string) { belluhWater()?.word(w); },
  /** Take a shape now. Returns false if it couldn't be drawn. */
  become(spec: ShapeSpec | 'water', label = 'shape', keep = true): boolean {
    const w = belluhWater();
    if (!w || !w.setShape(spec, label)) return false;
    if (keep) remember(spec, label);
    mark('belluhShape', spec === 'water' ? 'water' : label);
    return true;
  },
  /** A shape Belluh picked itself, from its reply. */
  applyAgentShape(shape: AgentShape | null | undefined): boolean {
    if (!shape || typeof shape !== 'object') return false;
    if ('water' in shape && shape.water) return belluh.become('water');
    const s = shape as { label?: string; emoji?: string; path?: string };
    const label = String(s.label || 'shape').slice(0, 40);
    if (s.emoji && belluh.become({ emoji: String(s.emoji).slice(0, 16) }, label)) return true;
    if (typeof s.path === 'string' && /^[MLCQZHVSTAmlcqzhvsta0-9.,\s-]{10,4000}$/.test(s.path)) return belluh.become({ path: s.path }, label);
    return false;
  },
  /** If a message asks for a shape Belluh knows, take it instantly (before the reply arrives). */
  async fromMessage(text: string): Promise<boolean> {
    if (!belluhWater()) return false;
    const { shapeRequest, instantShape } = await import('./shapeWords');
    const ask = shapeRequest(text);
    if (!ask) return false;
    const spec = instantShape(ask);
    return spec ? belluh.become(spec, 'water' in ask ? 'water' : ask.subject) : false;
  },
  /**
   * For places without a conversation (the landing page): if the text asks for a shape, take it when Belluh knows it.
   * Says whether a shape was asked for, whether it was taken, and what was asked for.
   */
  async tryShape(text: string): Promise<{ asked: boolean; done: boolean; subject: string }> {
    const { shapeRequest, instantShape } = await import('./shapeWords');
    const ask = shapeRequest(text);
    if (!ask) return { asked: false, done: false, subject: '' };
    const subject = 'water' in ask ? 'water' : ask.subject;
    const spec = instantShape(ask);
    return { asked: true, done: !!spec && belluh.become(spec, subject), subject };
  },
  /** Load the shape dictionary ahead of time, so the first request is instant too. */
  prefetch() { import('./shapeWords').catch(() => {}); },
};
