// When Belluh reaches out on its own, beyond the weekly loop and date reminders. Pure logic, unit-tested in Node.
//   Plan ahead:   10 to 14 days before a birthday or anniversary with nothing planned around it, Belluh offers to handle it.
//   Follow up:    a plan your partner proposed that you haven't answered in a day and a half gets one nudge.
//   The morning after: once a plan you made together has happened, "how was it?", and your answer can go in the journal.

import { nextOccurrence, daysBetween, formatMonthDay, isoDate, type LocalDate, type StoredOccasion } from './occasions.ts';
import { localDateOf, type PlanOption } from './plans.ts';

export interface OfferOccasion extends StoredOccasion { id: string }
export interface NudgePlan {
  id: string; created_by: string; partner_id: string; title: string; status: string;
  options: PlanOption[]; chosen_option: string | null; created_at: string;
}

const PLAN_AHEAD = { from: 10, to: 14 };
const BIG_DAYS = new Set(['birthday', 'anniversary']);

/** The soonest birthday or anniversary 10 to 14 days away that has no plan within two days of it. */
export function occasionToOffer(occasions: OfferOccasion[], plans: NudgePlan[], today: LocalDate, timeZone: string):
  { key: string; occasion: OfferOccasion; date: LocalDate; days: number } | null {
  const planned = plans.filter(p => p.status === 'confirmed').map(p => {
    const o = p.options.find(x => x.id === p.chosen_option);
    return o ? localDateOf(o.starts_at, timeZone) : null;
  }).filter((d): d is LocalDate => !!d);
  const candidates = occasions
    .filter(o => BIG_DAYS.has(String(o.kind)))
    .map(o => ({ occasion: o, date: nextOccurrence(o, today) }))
    .filter((x): x is { occasion: OfferOccasion; date: LocalDate } => !!x.date)
    .map(x => ({ ...x, days: daysBetween(today, x.date) }))
    .filter(x => x.days >= PLAN_AHEAD.from && x.days <= PLAN_AHEAD.to)
    .filter(x => !planned.some(d => Math.abs(daysBetween(d, x.date)) <= 2))
    .sort((a, b) => a.days - b.days);
  const c = candidates[0];
  return c ? { key: `${c.occasion.id}:${isoDate(c.date)}`, ...c } : null;
}

/** What Belluh says when it offers, if the model has nothing more specific. */
export function offerFallback(label: string, days: number, date: LocalDate): string {
  return `${label} is in ${days} days, on ${formatMonthDay(date.m, date.d)}. Want me to help plan it? I can line up a place and a few gift ideas from what you've both written.`;
}

/** What accepting the offer asks Belluh, in the person's words. */
export function offerAsk(label: string, date: LocalDate): string {
  return `Help me plan something for ${label} on ${formatMonthDay(date.m, date.d)}: somewhere to go and a few gift ideas.`;
}

/** Plans waiting on this person's answer for 36 hours to 7 days. */
export function plansToNudge(plans: NudgePlan[], userId: string, now = new Date()): NudgePlan[] {
  return plans.filter(p => {
    if (p.status !== 'proposed' || p.partner_id !== userId) return false;
    const age = now.getTime() - new Date(p.created_at).getTime();
    const stillAhead = p.options.some(o => new Date(o.starts_at).getTime() > now.getTime() + 3 * 3600_000);
    return age >= 36 * 3600_000 && age <= 7 * 86_400_000 && stillAhead;
  });
}

/** Plans this person made with their partner that ended 8 to 48 hours ago. */
export function plansJustHappened(plans: NudgePlan[], userId: string, now = new Date()): NudgePlan[] {
  return plans.filter(p => {
    if (p.status !== 'confirmed' || (p.created_by !== userId && p.partner_id !== userId)) return false;
    const o = p.options.find(x => x.id === p.chosen_option);
    if (!o) return false;
    const ended = new Date(o.starts_at).getTime() + (o.minutes ?? 120) * 60_000;
    const since = now.getTime() - ended;
    return since >= 8 * 3600_000 && since <= 48 * 3600_000;
  });
}

/** Proactive messages only arrive in the daytime (10am to 9pm local), never at night. */
export const daytime = (hour: number) => hour >= 10 && hour < 21;
