// Belluh Memory run reports, the shape both sides agree on: counts and timings of one indexing run, nothing else.
// cleanReport keeps exactly these fields in these shapes, on the device before sending and on the server before keeping.

type MemoryErrorCode = 'noIndex' | 'notStarted' | 'unsupported' | 'storageFull' | 'modelDownloadFailed' | 'network' | 'declined' | 'invalidSchema' | 'notConsented' | 'rateLimited' | 'cancelled' | 'internal';

export type RunTrigger = 'picked' | 'folder' | 'resume' | 'options' | 'reopen';
export type RunOutcome = 'ready' | 'paused' | 'stopped' | 'unfinished' | 'failed';
export const STAGES = ['models', 'reading', 'understanding', 'text', 'places', 'events', 'people'] as const;
export type Stage = typeof STAGES[number];

export interface RunReport {
  at: string;                 // when the run ended, to the minute (ISO)
  trigger: RunTrigger;
  outcome: RunOutcome;
  error: MemoryErrorCode | null;
  seconds: number;
  read: number;               // photos and videos newly read into the index
  skipped: number;            // left out by the options (media type, window, food focus) or unreadable
  failed: number;
  located: number;            // of those read, with a location
  understood: number;         // seen by the image model this run
  labels: number;             // labels found on them (a count, never their names)
  textRead: number;           // images whose text was read
  placeCells: number;         // ~1 km cells asked about (with places on)
  eventLookups: number;       // visits looked up (with the event lookup on)
  events: number;             // events in the index after the run
  indexTotal: number;         // items the index holds
  remaining: number;          // items still waiting to be understood
  searches: number;           // searches since the last run (a count, never what was searched)
  modelMB: number;            // models downloaded or loaded this run, in MB
  stages: Partial<Record<Stage, number>>;   // seconds per stage
}

const INT = (x: unknown, max = 1e7) => { const n = Math.round(Number(x)); return Number.isFinite(n) && n >= 0 ? Math.min(max, n) : 0; };
const SEC = (x: unknown) => { const n = Number(x); return Number.isFinite(n) && n >= 0 ? Math.min(86_400, Math.round(n * 10) / 10) : 0; };
const TRIGGERS: RunTrigger[] = ['picked', 'folder', 'resume', 'options', 'reopen'];
const OUTCOMES: RunOutcome[] = ['ready', 'paused', 'stopped', 'unfinished', 'failed'];
const ERRORS: MemoryErrorCode[] = ['noIndex', 'notStarted', 'unsupported', 'storageFull', 'modelDownloadFailed', 'network', 'declined', 'invalidSchema', 'notConsented', 'rateLimited', 'cancelled', 'internal'];

/** Exactly the fields a report may hold, in their shapes: anything else is dropped. Used on the device and the server. */
export function cleanReport(r: Partial<RunReport> & Record<string, unknown>): RunReport {
  const at = typeof r.at === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(r.at) ? r.at.slice(0, 16) : new Date().toISOString().slice(0, 16);
  const stages: Partial<Record<Stage, number>> = {};
  if (r.stages && typeof r.stages === 'object') for (const s of STAGES) { const v = (r.stages as any)[s]; if (v != null) stages[s] = SEC(v); }
  return {
    at, trigger: TRIGGERS.includes(r.trigger as RunTrigger) ? r.trigger as RunTrigger : 'picked',
    outcome: OUTCOMES.includes(r.outcome as RunOutcome) ? r.outcome as RunOutcome : 'ready',
    error: ERRORS.includes(r.error as MemoryErrorCode) ? r.error as MemoryErrorCode : null,
    seconds: SEC(r.seconds), read: INT(r.read), skipped: INT(r.skipped), failed: INT(r.failed), located: INT(r.located),
    understood: INT(r.understood), labels: INT(r.labels), textRead: INT(r.textRead), placeCells: INT(r.placeCells),
    eventLookups: INT(r.eventLookups), events: INT(r.events), indexTotal: INT(r.indexTotal), remaining: INT(r.remaining),
    searches: INT(r.searches), modelMB: INT(r.modelMB, 10_000), stages,
  };
}

