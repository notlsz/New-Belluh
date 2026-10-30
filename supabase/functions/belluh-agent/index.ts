// The Belluh agent. One ongoing thread per person; remembers, saves dates, and carries approved notes between partners.
// Deploy with: supabase functions deploy belluh-agent   (JWT verification ON: only signed-in users can call it)
//
// POST body: { action: 'history' }
//            { action: 'chat', message: string, mode?: 'chat' | 'mediate' }
//            { action: 'react', entry_id: string }
//            { action: 'send_note', draft_id: string, text?: string }
//            { action: 'discard_note', draft_id: string }
//            { action: 'checkin', action_id: string, status: 'done' | 'not_yet' | 'skipped' }
//            { action: 'offer_respond', message_id: string, accept: boolean }
//            { action: 'booking', booking_id: string, done: boolean }   ("I booked it" / "Not now")
//            { action: 'ideas' }   what Bella could take on now
//            { action: 'goal_log', goal_id, amount } / { action: 'goal_stop', goal_id } / { action: 'watch_stop', watch_id }

import { cleanReply, REACT_INSTRUCTION } from '../_shared/agent.ts';
import { jsonAnswer } from '../_shared/gemini.ts';
import { db, loadCtx, buildSystem, addMessage, history, weekView, type Ctx } from '../_shared/agentdb.ts';
import { chat, underLimit, sendNote, planRespond, planCancel, checkin, ownPhoto, usHistory, usSend, offerRespond, bookingDone, placeCall, type Result } from '../_shared/agentcore.ts';
import { ideasFor, goalLog, goalStop, watchStop } from '../_shared/goalsdb.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const out = (r: Result) => json(r.body, r.status);

async function react(ctx: Ctx, entryId: string) {
  if (!(await underLimit(ctx.userId))) return { message: null };
  const { data: entry } = await db.from('journal_entries').select('id, user_id, content, is_shared, photo_url')
    .eq('id', entryId).maybeSingle();
  if (!entry || entry.user_id !== ctx.userId || (!entry.content?.trim() && !entry.photo_url)) return { message: null };
  const system = await buildSystem(ctx);
  const photo = await ownPhoto(ctx.userId, entry.photo_url);
  const out = await jsonAnswer(system, `${REACT_INSTRUCTION}\n\nEntry:\n${(entry.content ?? '').slice(0, 3000)}${photo ? '\n(Their photo is attached.)' : ''}`,
    { type: 'OBJECT', properties: { reply: { type: 'STRING' } }, required: ['reply'] }, photo ? [photo] : []) as { reply?: string } | null;
  const reply = cleanReply(out?.reply ?? '');
  if (reply.length < 8) return { message: null };
  return { message: await addMessage(ctx.userId, 'belluh', reply, { entry_id: entryId }) };
}

function validTimeZone(tz: unknown): string | null {
  if (typeof tz !== 'string' || tz.length > 64) return null;
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return tz; } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // Identify the caller from their own login token
  const auth = req.headers.get('Authorization') ?? '';
  const { data: { user } } = await db.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
  if (!user) return json({ error: 'Not signed in' }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Bad JSON' }, 400); }
  const tz = validTimeZone(body.timezone) ?? 'America/New_York';
  const ctx = await loadCtx(user.id, tz);

  try {
    switch (body.action) {
      case 'history': {
        // Remember the person's time zone so the weekly loop arrives at their Sunday morning
        await db.from('agent_settings').upsert({ user_id: user.id, timezone: tz, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        return json({ messages: await history(user.id), partner_name: ctx.partnerName, week: await weekView(ctx).catch(() => null) });
      }
      case 'checkin': return out(await checkin(ctx, String(body.action_id ?? ''), String(body.status ?? '')));
      case 'plan_respond': return out(await planRespond(ctx, String(body.plan_id ?? ''), body.option_id ? String(body.option_id) : null, String(body.note ?? '')));
      case 'plan_cancel': return out(await planCancel(ctx, String(body.plan_id ?? '')));
      case 'chat': return json(await chat(ctx, String(body.message ?? ''), body.mode === 'mediate' ? 'mediate' : 'chat', 'app', typeof body.photo === 'string' ? body.photo : null));
      case 'react': return json(await react(ctx, String(body.entry_id ?? '')));
      case 'offer_respond': return out(await offerRespond(ctx, String(body.message_id ?? ''), body.accept === true));
      case 'booking': return out(await bookingDone(ctx, String(body.booking_id ?? ''), body.done !== false));
      case 'booking_call': return out(await placeCall(ctx, String(body.booking_id ?? '')));
      case 'us_history': return out(await usHistory(ctx));
      case 'us_send': return out(await usSend(ctx, String(body.message ?? ''), body.ask_belluh !== false));
      case 'ideas': return json(await ideasFor(ctx));
      case 'goal_log': return out(await goalLog(ctx, String(body.goal_id ?? ''), Number(body.amount)));
      case 'goal_stop': return out(await goalStop(ctx, String(body.goal_id ?? '')));
      case 'watch_stop': return out(await watchStop(ctx, String(body.watch_id ?? '')));
      case 'send_note': return out(await sendNote(ctx, String(body.draft_id ?? ''), typeof body.text === 'string' ? body.text : undefined));
      case 'discard_note': {
        const { data: d } = await db.from('agent_messages').select('user_id, role, meta').eq('id', String(body.draft_id ?? '')).maybeSingle();
        if (!d || d.user_id !== user.id || d.role !== 'note_draft') return json({ error: 'Draft not found' }, 404);
        await db.from('agent_messages').update({ meta: { ...(d.meta as object), status: 'discarded' } }).eq('id', String(body.draft_id));
        return json({ ok: true });
      }
      default: return json({ error: 'Unknown action' }, 400);
    }
  } catch (e) {
    console.error('belluh-agent error', e);
    return json({ error: 'Something went wrong' }, 500);
  }
});
