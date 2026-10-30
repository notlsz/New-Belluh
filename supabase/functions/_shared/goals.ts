// Goals two people work toward together: saving for something (a trip to Kyoto), a habit (a date night every week, a
// walk without phones), or a budget (dates and gifts under 200 a month). Habits and budgets count toward this week or
// this month and start over when it turns. Pure logic, unit-tested in Node.

import type { LocalDate } from './occasions.ts';

export type GoalKind = 'save' | 'habit' | 'budget';
export interface Goal {
  id?: string; kind: GoalKind; title: string; target: number; progress: number;
  currency: string | null; period: 'week' | 'month' | null; period_key: string | null; due_on: string | null; status?: string;
  steps?: Step[];          // the action plan: a few steps Bella broke it into
}
export interface Step { text: string; done: boolean }

/** Two to six short steps, in their words; anything else is dropped. */
export function cleanSteps(x: unknown): Step[] {
  return (Array.isArray(x) ? x : []).map(v => (typeof v === 'string' ? v : (v as any)?.text)).filter((v): v is string => typeof v === 'string')
    .map(v => v.replace(/\s+/g, ' ').trim().slice(0, 80)).filter(v => v.length >= 3).slice(0, 6).map(text => ({ text, done: false }));
}

/** The step to do next, if there's a plan. */
export const nextStep = (g: Goal): string | null => g.steps?.find(x => !x.done)?.text ?? null;

/** The money people there use, for saving and budgets. */
export const CURRENCY: Record<string, string> = {
  US: 'USD', CA: 'CAD', GB: 'GBP', JP: 'JPY', CN: 'CNY', HK: 'HKD', TW: 'TWD', KR: 'KRW', SG: 'SGD', IN: 'INR', AE: 'AED',
  FR: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR', MX: 'MXN', BR: 'BRL', AU: 'AUD', CH: 'CHF',
};

const pad = (n: number) => String(n).padStart(2, '0');

/** ISO week ("2026-W44"), which is how most of the world numbers weeks (Monday first). */
export function isoWeek(x: LocalDate): string {
  const t = new Date(Date.UTC(x.y, x.m - 1, x.d));
  const day = (t.getUTCDay() + 6) % 7;            // Monday 0
  t.setUTCDate(t.getUTCDate() - day + 3);         // the Thursday of this week decides its year
  const y = t.getUTCFullYear();
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const wk = 1 + Math.round(((t.getTime() - jan4.getTime()) / 86_400_000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return `${y}-W${pad(wk)}`;
}

export function periodKey(period: Goal['period'], today: LocalDate): string | null {
  return period === 'week' ? isoWeek(today) : period === 'month' ? `${today.y}-${pad(today.m)}` : null;
}

/** A goal from what Bella was asked, or null when it doesn't make sense. */
export function validateGoal(a: Record<string, unknown>, country: string, today: LocalDate): Goal | null {
  const kind = a.kind === 'save' || a.kind === 'habit' || a.kind === 'budget' ? a.kind : null;
  const title = typeof a.title === 'string' ? a.title.replace(/\s+/g, ' ').trim().slice(0, 80) : '';
  const target = Number(a.target);
  if (!kind || title.length < 2 || !Number.isFinite(target) || target <= 0 || target > 10_000_000) return null;
  // A habit is counted in times; "every day" for a week is at most 7, for a month at most 31
  const period = kind === 'save' ? null : a.period === 'month' ? 'month' : 'week';
  if (kind === 'habit' && (!Number.isInteger(target) || target > (period === 'week' ? 7 : 31))) return null;
  const cur = typeof a.currency === 'string' && /^[A-Za-z]{3}$/.test(a.currency) ? a.currency.toUpperCase() : CURRENCY[country] ?? 'USD';
  let due: string | null = null;
  if (typeof a.due_on === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.due_on)) {
    const [y, m, d] = a.due_on.split('-').map(Number);
    const ok = m >= 1 && m <= 12 && d >= 1 && d <= 31 && Date.UTC(y, m - 1, d) > Date.UTC(today.y, today.m - 1, today.d) && y <= today.y + 10;
    if (ok) due = a.due_on;
  }
  return { kind, title, target, progress: 0, currency: kind === 'habit' ? null : cur, period, period_key: periodKey(period, today), due_on: kind === 'save' ? due : null, steps: cleanSteps(a.steps) };
}

/** This week's or month's progress: what was logged in an earlier one no longer counts. */
export function current(g: Goal, today: LocalDate): number {
  if (!g.period) return g.progress;
  return g.period_key === periodKey(g.period, today) ? g.progress : 0;
}

/** Adds to a goal (an amount saved or spent, or one more time they did it). Returns the new progress and its period. */
export function logProgress(g: Goal, amount: number, today: LocalDate): { progress: number; period_key: string | null; done: boolean } | null {
  if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 10_000_000) return null;
  if (g.kind === 'habit' && !Number.isInteger(amount)) return null;
  const progress = Math.max(0, Math.round((current(g, today) + amount) * 100) / 100);
  return { progress, period_key: periodKey(g.period, today), done: g.kind === 'save' && progress >= g.target };
}

/** How it's going, in a line Bella can read (and say back): "Kyoto trip: saved 1,200 of 3,000 EUR, due 2027-04-01". */
export function goalLine(g: Goal, today: LocalDate): string {
  const step = nextStep(g);
  return goalLineBare(g, today) + (step ? `; next step: ${step}` : '');
}
function goalLineBare(g: Goal, today: LocalDate): string {
  const now = current(g, today), n = (x: number) => x.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (g.kind === 'save') {
    const left = g.due_on ? Math.max(1, Math.round((Date.UTC(+g.due_on.slice(0, 4), +g.due_on.slice(5, 7) - 1, +g.due_on.slice(8, 10)) - Date.UTC(today.y, today.m - 1, today.d)) / (30.44 * 86_400_000))) : null;
    const perMonth = left && now < g.target ? `, about ${n(Math.ceil((g.target - now) / left))} a month to make it` : '';
    return `${g.title}: saved ${n(now)} of ${n(g.target)} ${g.currency ?? ''}${g.due_on ? `, by ${g.due_on}` : ''}${perMonth}`.replace(/ ,/g, ',');
  }
  if (g.kind === 'habit') return `${g.title}: ${n(now)} of ${n(g.target)} times this ${g.period}`;
  return `${g.title}: spent ${n(now)} of ${n(g.target)} ${g.currency ?? ''} this ${g.period}${now > g.target ? ' (over)' : ''}`;
}
