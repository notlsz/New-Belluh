// Run reports, after Rollup's `sendsRunReports`: after each indexing run the engine keeps a short report on this device,
// counts and timings only (photos read, skipped, located, labels found, seconds, model download size), shown in Memory
// settings. It never holds a photo, a label's name, a place, text, a name or an id.
//
// Sent to Belluh only when the person turns on "Share run reports" in Memory settings AND allows "Improving Belluh" in
// the Privacy Center; then the same counts go to the memory-report function, which stores them with no user or device
// column and deletes them after 90 days. Nothing is sent to Google Analytics, Mixpanel or anyone else.


export { cleanReport, STAGES, type RunReport, type RunTrigger, type RunOutcome, type Stage } from '../../../supabase/functions/_shared/memoryreport.ts';
import { cleanReport, type RunReport } from '../../../supabase/functions/_shared/memoryreport.ts';

/** Did the run do anything worth a report (a run that only settled state does not count) */
export const worthReporting = (r: RunReport) => r.read + r.understood + r.textRead + r.placeCells + r.eventLookups + r.failed > 0 || r.outcome === 'failed';

export const REPORTS_MAX = 20;

/** May a report leave this device? The Memory switch and the Privacy Center's "Improving Belluh" must both be on. */
export async function diagnosticsAllowed(): Promise<boolean> {
  try {
    const [{ getMemoryConsent }, { canStore }] = await Promise.all([import('./consent.ts'), import('../consent.ts')]);
    return getMemoryConsent().diagnostics && canStore('usage');
  } catch { return false; }
}

/** Sends one report, counts only, to Belluh's memory-report function when allowed. Never throws. */
export async function sendRunReport(r: RunReport, o: { allowed?: () => Promise<boolean>; post?: (body: RunReport) => Promise<void> } = {}): Promise<boolean> {
  try {
    if (!(await (o.allowed ?? diagnosticsAllowed)())) return false;
    const body = cleanReport(r as any);
    if (o.post) await o.post(body);
    else {
      const { supabase } = await import('../supabaseClient.ts');
      const { error } = await supabase.functions.invoke('memory-report', { body });
      if (error) return false;
    }
    return true;
  } catch { return false; }
}
