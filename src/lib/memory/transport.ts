// How the app reaches the memory-agent edge function: one POST per step, the reply read as NDJSON while it streams.
import { supabase, supabaseUrl } from '../supabaseClient';
import { ndjson, type ServerEvent, type Transport } from './agent';

export const httpTransport: Transport = async function* (body, signal) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { yield { type: 'error', code: 'unauthorized', message: 'Not signed in' } as ServerEvent; return; }
  let res: Response;
  try {
    res = await fetch(`${supabaseUrl}/functions/v1/memory-agent`, {
      method: 'POST', signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, apikey: (supabase as any).supabaseKey ?? '' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (signal.aborted) return;
    yield { type: 'error', code: 'agent_unavailable', message: 'No connection' } as ServerEvent; return;
  }
  if (!res.body) { yield { type: 'error', code: 'agent_unavailable', message: `HTTP ${res.status}` } as ServerEvent; return; }
  yield* ndjson(res.body, signal);
};
