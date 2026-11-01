import React, { useState } from 'react';
import { Download, SlidersHorizontal, FileText, Trash2 } from 'lucide-react';
import LegalModal from './LegalModal';
import { useUi } from '../i18n';
import strings from '../i18n/ui/privacyCenter';
import { supabase } from '../lib/supabaseClient';
import { openPrivacyCenter, CONSENT_KEY } from '../lib/consent';

// Everything the signed-in person can read about themselves, table by table (GDPR access and portability, CCPA right
// to know). Each filter keeps it to rows that are theirs or that they share with their partner; RLS enforces the rest.
type Filter = { eq: string } | { or: string[] };
const TABLES: [string, Filter][] = [
  ['profiles', { eq: 'id' }],
  ['journal_entries', { eq: 'user_id' }],            // includes the facts Belluh keeps (tag system_facts)
  ['partner_connections', { or: ['user_id', 'partner_id'] }],
  ['partner_invites', { eq: 'inviter' }],
  ['partner_notes', { or: ['from_user', 'to_user'] }],
  ['occasions', { eq: 'user_id' }],
  ['plans', { or: ['created_by', 'partner_id'] }],
  ['couple_goals', { or: ['created_by', 'partner_id'] }],
  ['bookings', { or: ['user_id', 'partner_id'] }],
  ['us_messages', { or: ['user_a', 'user_b'] }],
  ['weekly_actions', { or: ['user_a', 'user_b'] }],
  ['weekly_checkins', { eq: 'user_id' }],
  ['agent_settings', { eq: 'user_id' }],
  ['agent_messages', { eq: 'user_id' }],
  ['agent_memories', { eq: 'user_id' }],
  ['agent_activity', { eq: 'user_id' }],
  ['personal_reminders', { eq: 'user_id' }],
  ['watches', { eq: 'user_id' }],
  ['whatsapp_links', { eq: 'user_id' }],
  ['whatsapp_messages', { eq: 'user_id' }],
  ['push_subscriptions', { eq: 'user_id' }],
  ['calendar_feeds', { eq: 'user_id' }],
  ['conflict_logs', { eq: 'user_id' }],
  ['profile_looks', { eq: 'user_id' }],
  ['guides', { eq: 'user_id' }],
  ['privacy_consent', { eq: 'user_id' }],
];
const PAGE = 1000, MAX_PAGES = 50;

async function readAll(table: string, filter: Filter, uid: string, extra?: (q: any) => any): Promise<unknown[] | { error: string }> {
  const rows: unknown[] = [];
  for (let p = 0; p < MAX_PAGES; p++) {
    let q: any = supabase.from(table).select('*');
    q = 'eq' in filter ? q.eq(filter.eq, uid) : q.or(filter.or.map(c => `${c}.eq.${uid}`).join(','));
    if (extra) q = extra(q);
    const { data, error } = await q.range(p * PAGE, p * PAGE + PAGE - 1);
    if (error) return { error: error.message };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

/** Builds the export: account details, every table above, the guides' places, and this browser's privacy choice. */
export async function exportMyData(): Promise<Record<string, unknown>> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not signed in');
  const out: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    format: 'Belluh data export, version 1. Photos and voice notes are listed by link inside your entries.',
    account: { id: user.id, email: user.email, phone: user.phone, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at, user_metadata: user.user_metadata, identities: (user.identities ?? []).map(i => ({ provider: i.provider, created_at: i.created_at })) },
  };
  const tables: Record<string, unknown> = {};
  const results = await Promise.all(TABLES.map(([t, f]) => readAll(t, f, user.id)));
  TABLES.forEach(([t], i) => { const r = results[i]; if (Array.isArray(r) ? r.length : !/does not exist|schema cache|permission/i.test(r.error)) tables[t] = r; });
  const guideIds = Array.isArray(tables.guides) ? (tables.guides as { id: string }[]).map(g => g.id) : [];
  if (guideIds.length) {
    const { data } = await supabase.from('guide_places').select('*').in('guide_id', guideIds);
    tables.guide_places = data ?? [];
  }
  out.tables = tables;
  try { out.this_browser = { privacy_choices: JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null') }; } catch { /* storage off */ }
  return out;
}

function downloadJson(data: unknown, name: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

interface Props {
  /** Show the Privacy Policy your own way; without it this section opens the policy itself. */
  onShowPolicy?: () => void;
  /** After the account is deleted. Default: sign out on this device and go to the home page. */
  onDeleted?: () => void;
}

const pill = 'h-10 px-5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-50';

/** "Your data" for Settings: download a copy, privacy choices, the policy, and deleting the account. */
const YourData: React.FC<Props> = ({ onShowPolicy, onDeleted }) => {
  const T = useUi(strings);
  const [dl, setDl] = useState<'idle' | 'busy' | 'done' | 'fail'>('idle');
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [del, setDel] = useState<'idle' | 'busy' | 'fail'>('idle');
  const [policy, setPolicy] = useState(false);

  const download = async () => {
    setDl('busy');
    try { downloadJson(await exportMyData(), `belluh-my-data-${new Date().toISOString().slice(0, 10)}.json`); setDl('done'); }
    catch { setDl('fail'); }
  };

  const matches = typed.trim().toLocaleUpperCase() === T.deleteWord.toLocaleUpperCase();
  const remove = async () => {
    if (!matches) return;
    setDel('busy');
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', { body: { confirm: true } });
      if (error || !data?.deleted) throw error ?? new Error('Not deleted');
      try { Object.keys(localStorage).filter(k => k.startsWith('belluh_') || k.startsWith('pending_')).forEach(k => localStorage.removeItem(k)); } catch { /* storage off */ }
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      if (onDeleted) onDeleted(); else window.location.assign('/');
    } catch { setDel('fail'); }
  };

  const status = dl === 'busy' ? T.downloading : dl === 'done' ? T.downloadDone : dl === 'fail' ? T.downloadFail : T.downloadBody;
  const Row: React.FC<{ icon: React.ReactNode; title: string; body: string; children?: React.ReactNode; tone?: string }> = ({ icon, title, body, children, tone }) => (
    <div className="flex items-center gap-4 py-3">
      <span className={`w-6 flex justify-center shrink-0 ${tone ?? 'text-slate-500'}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-serif text-lg text-slate-900 leading-snug">{title}</p>
        <p className="text-sm text-slate-500 mt-0.5 leading-relaxed" aria-live="polite">{body}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div className="mb-12">
      {policy && <LegalModal type="privacy" onClose={() => setPolicy(false)} />}
      <h3 className="font-serif text-xl text-slate-900 pl-1 mb-1">{T.dataTitle}</h3>
      <p className="text-sm text-slate-500 pl-1 mb-4 leading-relaxed">{T.dataIntro}</p>
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm px-6 py-3">
        <Row icon={<Download size={18} />} title={T.downloadTitle} body={status}>
          <button type="button" onClick={download} disabled={dl === 'busy'} className={`${pill} bg-slate-900 text-white hover:bg-slate-800`}>{T.downloadBtn}</button>
        </Row>
        <Row icon={<SlidersHorizontal size={18} />} title={T.choicesTitle} body={T.choicesBody}>
          <button type="button" onClick={openPrivacyCenter} className={`${pill} border border-slate-300 text-slate-900 hover:bg-slate-50`}>{T.choicesBtn}</button>
        </Row>
        <Row icon={<FileText size={18} />} title={T.policyTitle} body={T.policyBody}>
          <button type="button" onClick={() => (onShowPolicy ? onShowPolicy() : setPolicy(true))} className={`${pill} border border-slate-300 text-slate-900 hover:bg-slate-50`}>{T.policyBtn}</button>
        </Row>
        <Row icon={<Trash2 size={18} />} title={T.deleteTitle} body={T.deleteBody} tone="text-slate-500">
          {!confirming && <button type="button" onClick={() => setConfirming(true)} className={`${pill} border border-slate-300 text-slate-900 hover:bg-slate-50`}>{T.deleteBtn}</button>}
        </Row>
        {confirming && (
          <div className="pl-10 pb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="belluh-delete-confirm">{T.deleteConfirmLabel.replace('{word}', T.deleteWord)}</label>
            <div className="flex flex-wrap items-center gap-2">
              <input id="belluh-delete-confirm" value={typed} onChange={e => setTyped(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false}
                className="h-10 flex-1 min-w-[10rem] rounded-full border border-slate-300 px-4 text-sm text-slate-900 outline-none focus:border-slate-900" />
              <button type="button" onClick={() => { setConfirming(false); setTyped(''); setDel('idle'); }} className={`${pill} text-slate-600 hover:text-slate-900`}>{T.cancel}</button>
              <button type="button" onClick={remove} disabled={!matches || del === 'busy'} className={`${pill} bg-slate-900 text-white hover:bg-slate-800`}>{del === 'busy' ? T.deleting : T.deleteFinal}</button>
            </div>
            {del === 'fail' && <p className="text-sm text-slate-700 mt-2" role="alert">{T.deleteFail}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default YourData;
