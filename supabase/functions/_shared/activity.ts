// Bella's activity: what she did and what she has planned, so nothing she does is out of sight. Each entry is the
// action (a tool name, or something she did on her own) and a few words of what it was about, in the person's own
// words. The app says the action in the reader's language. Pure, unit-tested in Node.

const s = (x: unknown) => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim() : '');
const join = (...xs: unknown[]) => xs.map(s).filter(Boolean).join(', ');

/** A few words on what an action was about. Never the text of a private note or journal entry. */
export function activityDetail(name: string, args: Record<string, unknown> | undefined): string | null {
  const a = args ?? {};
  let d = '';
  switch (name) {
    case 'find_table': d = join(a.what, a.where, a.when, a.people ? `${a.people} people` : ''); break;
    case 'plan_trip': d = join(a.to, a.depart, a.return); break;
    case 'send_flowers': d = join(a.what, a.deliver_on); break;
    case 'gift_ideas': d = Array.isArray(a.ideas) ? a.ideas.map(s).filter(Boolean).slice(0, 3).join(', ') : ''; break;
    case 'buy_item': d = s(a.item); break;
    case 'order_food': d = join(a.what, a.from); break;
    case 'order_groceries': d = Array.isArray(a.items) ? a.items.map(s).filter(Boolean).slice(0, 4).join(', ') : ''; break;
    case 'book_ride': d = s(a.to); break;
    case 'find_experience': d = join(a.what, a.where); break;
    case 'shop_style': d = join(Array.isArray(a.pieces) ? a.pieces.join(', ') : a.pieces, a.style); break;
    case 'find_spots': d = join(a.what, a.where); break;
    case 'find_research': d = Array.isArray(a.keywords) ? a.keywords.map(s).join(', ') : ''; break;
    case 'mood_playlist': d = s(a.vibe); break;
    case 'remember_fact': d = s(a.fact); break;
    case 'forget_memory': case 'forget_date': d = s(a.query); break;
    case 'save_date': d = s(a.label); break;
    case 'remind_me': d = s(a.text); break;
    case 'plan_with_partner': d = s(a.title); break;
    case 'set_goal': d = s(a.title); break;
    case 'log_goal': d = join(a.goal, a.amount); break;
    case 'watch_for': d = join(a.what, a.place); break;
    case 'set_country': d = s(a.country); break;
    case 'set_proactivity': d = s(a.level); break;
    case 'set_reminders': d = a.on === true ? 'on' : a.on === false ? 'off' : ''; break;
    case 'take_shape': d = s(a.label); break;
    // Their words to their partner and their journal stay out of the log: the log says it happened, not what it said
    default: d = '';
  }
  return d ? d.slice(0, 200) : null;
}

/** Things Bella does on her own, logged next to the tools she runs when asked. */
export const OWN_ACTIONS = ['sent_reminder', 'watch_found', 'offered_plan', 'nudged_plan', 'asked_how_it_went', 'weekly_note'] as const;

export type Proactivity = 'quiet' | 'normal' | 'more';
export const proactivityOf = (x: unknown): Proactivity => (x === 'quiet' || x === 'more' ? x : 'normal');

/** Which of Bella's own messages go out at each level. What they asked for (reminders, watches) always does. */
export function mayReachOut(level: Proactivity, kind: 'offer' | 'plan_nudge' | 'after_plan' | 'reminder' | 'watch'): boolean {
  if (kind === 'reminder' || kind === 'watch') return true;
  if (level === 'quiet') return false;
  return true;
}

/** How far ahead Bella offers to plan a birthday or anniversary: two weeks, or three when they want more. */
export const offerWindow = (level: Proactivity): [number, number] => (level === 'more' ? [10, 21] : [10, 14]);
