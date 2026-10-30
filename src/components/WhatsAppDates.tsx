import { useI18n } from '../i18n';
import React, { useEffect, useState, useCallback } from 'react';
import { MessageCircle, MessageSquare, Send, Trash2, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Belluh's WhatsApp Business number, digits only, e.g. 15551234567. Set VITE_BELLUH_WHATSAPP_NUMBER in Vercel.
const BELLUH_NUMBER: string = ((import.meta as any).env?.VITE_BELLUH_WHATSAPP_NUMBER || '').replace(/\D/g, '');

// Belluh's SMS number (Twilio), e.g. +15551234567. Set VITE_BELLUH_SMS_NUMBER in Vercel. Either, both or neither can be set.
const SMS_NUMBER: string = (() => { const d = ((import.meta as any).env?.VITE_BELLUH_SMS_NUMBER || '').replace(/\D/g, ''); return d ? '+' + d : ''; })();
const smsHref = (code: string) => `sms:${SMS_NUMBER}?&body=${encodeURIComponent(`LINK ${code}`)}`;
const waHref = (code: string) => `https://wa.me/${BELLUH_NUMBER}?text=${encodeURIComponent(`LINK ${code}`)}`;

// Belluh's Telegram bot username (from @BotFather), e.g. BelluhBot. Set VITE_BELLUH_TELEGRAM_BOT in Vercel. No business number needed.
const TG_BOT: string = ((import.meta as any).env?.VITE_BELLUH_TELEGRAM_BOT || '').replace(/^@/, '').replace(/[^A-Za-z0-9_]/g, '');
const tgHref = (code: string) => `https://t.me/${TG_BOT}?start=${code}`;

// Belluh's iMessage number (Linq), e.g. +15551234567. Set VITE_BELLUH_IMESSAGE_NUMBER in Vercel. Messages sends it as iMessage.
const IMESSAGE_NUMBER: string = (() => { const d = ((import.meta as any).env?.VITE_BELLUH_IMESSAGE_NUMBER || '').replace(/\D/g, ''); return d ? '+' + d : ''; })();
const imHref = (code: string) => `sms:${IMESSAGE_NUMBER}?&body=${encodeURIComponent(`LINK ${code}`)}`;

// Belluh's LINE Official Account ID, e.g. @belluh. Set VITE_BELLUH_LINE_ID in Vercel. LINE is how couples in Japan message.
const LINE_ID: string = (() => { const v = ((import.meta as any).env?.VITE_BELLUH_LINE_ID || '').trim().replace(/[^@A-Za-z0-9._-]/g, ''); return v ? (v.startsWith('@') ? v : '@' + v) : ''; })();
const lineHref = (code: string) => `https://line.me/R/oaMessage/${encodeURIComponent(LINE_ID)}/?${encodeURIComponent(`LINK ${code}`)}`;

type Via = 'whatsapp' | 'sms' | 'telegram' | 'imessage' | 'line';
/** The apps people text on where they live come first: LINE in Japan, WhatsApp in Europe, iMessage and SMS in the US. */
function channelOrder(): Via[] {
  let tz = '', lang = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''; lang = (navigator.language || '').toLowerCase(); } catch { /* defaults */ }
  if (tz === 'Asia/Tokyo' || lang.startsWith('ja')) return ['line', 'imessage', 'whatsapp', 'sms', 'telegram'];
  if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Indiana|Kentucky)/.test(tz) || tz === 'Pacific/Honolulu') return ['imessage', 'sms', 'whatsapp', 'telegram', 'line'];
  return ['whatsapp', 'imessage', 'telegram', 'sms', 'line'];
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Occasion {
  id: string;
  source_message?: string | null;
  label: string;
  month: number;
  day: number;
  year: number | null;
  repeats_yearly: boolean;
  source: 'app' | Via;
  mentioned_at: string;
}

function daysUntil(o: Occasion): number | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const at = (y: number) => new Date(y, o.month - 1, Math.min(o.day, new Date(y, o.month, 0).getDate()));
  let next: Date;
  if (o.repeats_yearly) {
    next = at(today.getFullYear());
    if (next < today) next = at(today.getFullYear() + 1);
  } else {
    if (o.year == null) return null;
    next = at(o.year);
    if (next < today) return null;
  }
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

const WhatsAppDates: React.FC<{ onShowToast: (m: string, t: 'success' | 'error' | 'info') => void }> = ({ onShowToast }) => {
  const { d: { app: { me: M } }, f: fill } = useI18n();
  const [available, setAvailable] = useState(true);
  const [phone, setPhone] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [copied, setCopied] = useState(false);
  const [via, setVia] = useState<Via>('whatsapp');

  const load = useCallback(async () => {
    const [{ data: link, error: linkErr }, { data: occ, error: occErr }] = await Promise.all([
      supabase.from('whatsapp_links').select('phone_e164').maybeSingle(),
      supabase.from('occasions').select('id, label, month, day, year, repeats_yearly, source, source_message, mentioned_at'),
    ]);
    if (linkErr || occErr) { setAvailable(false); return; } // feature not set up on this database yet
    setPhone(link?.phone_e164 ?? null);
    setOccasions((occ ?? []) as Occasion[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  // While a code is showing, check every few seconds whether WhatsApp confirmed it
  useEffect(() => {
    if (!code || phone) return;
    const t = setInterval(load, 4000);
    const stop = setTimeout(() => setCode(null), 30 * 60 * 1000);
    return () => { clearInterval(t); clearTimeout(stop); };
  }, [code, phone, load]);

  useEffect(() => { if (phone && code) { setCode(null); onShowToast('Connected. Text Bella any date.', 'success'); } }, [phone, code, onShowToast]);

  const [readyCode, setReadyCode] = useState<string | null>(null);
  // Get a fresh code ready ahead of time, so one tap opens WhatsApp with "LINK <code>" already typed
  const prepare = useCallback(async () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { data, error } = await supabase.rpc('request_whatsapp_link', { p_timezone: tz });
    if (!error && data) setReadyCode(data as string);
  }, []);
  useEffect(() => {
    if (!available || phone || (!BELLUH_NUMBER && !SMS_NUMBER && !TG_BOT)) return;
    prepare();
    const t = setInterval(prepare, 25 * 60 * 1000); // codes last 30 minutes
    return () => clearInterval(t);
  }, [available, phone, prepare]);

  const connect = async (channel: Via = 'whatsapp') => {
    setVia(channel);
    if (readyCode) { setCode(readyCode); return; } // the link itself opens WhatsApp or Messages
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { data, error } = await supabase.rpc('request_whatsapp_link', { p_timezone: tz });
    if (error || !data) { onShowToast("Couldn't start setup. Try again.", 'error'); return; }
    setCode(data as string);
  };

  const disconnect = async () => {
    const { error } = await supabase.from('whatsapp_links').delete().not('user_id', 'is', null);
    if (error) { onShowToast("Couldn't disconnect.", 'error'); return; }
    setPhone(null);
    onShowToast('Disconnected. Belluh will stop texting you.', 'success');
  };

  const remove = async (o: Occasion) => {
    const { error } = await supabase.from('occasions').delete().eq('id', o.id);
    if (error) { onShowToast("Couldn't remove that date.", 'error'); return; }
    setOccasions(prev => prev.filter(x => x.id !== o.id));
  };

  if (!available) return null;

  const sorted = occasions
    .map(o => ({ o, days: daysUntil(o) }))
    .filter(x => x.days !== null)
    .sort((a, b) => (a.days as number) - (b.days as number));

  const openLink = !code ? null : via === 'line' && LINE_ID ? lineHref(code) : via === 'imessage' && IMESSAGE_NUMBER ? imHref(code) : via === 'telegram' && TG_BOT ? tgHref(code) : via === 'sms' && SMS_NUMBER ? smsHref(code) : BELLUH_NUMBER ? waHref(code) : null;
  const appName = via === 'line' ? 'LINE' : via === 'telegram' ? 'Telegram' : via === 'sms' || via === 'imessage' ? 'Messages' : 'WhatsApp';
  const btn = 'shrink-0 h-11 px-5 rounded-full font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors bg-white text-slate-900 border border-slate-200 hover:border-slate-400';

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-xl text-slate-900 pl-1">{M.textBella}</h3>
        {phone && <button onClick={disconnect} className="text-xs font-bold text-slate-400 hover:text-slate-700">Disconnect texting</button>}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        {!phone && !code && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-serif text-lg text-slate-900">{M.textTitle}</p>
              <p className="text-sm text-slate-500 mt-1">{M.textBody}</p>
            </div>
            {BELLUH_NUMBER || SMS_NUMBER || TG_BOT || IMESSAGE_NUMBER || LINE_ID ? (
              <div className="flex flex-wrap gap-2">
                {channelOrder().map(id => {
                  const c = {
                    line: { on: !!LINE_ID, href: lineHref, label: fill(M.connect, { app: 'LINE' }), icon: <MessageCircle size={17} className="text-[#06C755]" />, external: true },
                    imessage: { on: !!IMESSAGE_NUMBER, href: imHref, label: fill(M.connect, { app: 'iMessage' }), icon: <MessageCircle size={17} className="text-[#0A84FF]" />, external: false },
                    whatsapp: { on: !!BELLUH_NUMBER, href: waHref, label: fill(M.connect, { app: 'WhatsApp' }), icon: <MessageCircle size={17} className="text-[#25D366]" />, external: true },
                    telegram: { on: !!TG_BOT, href: tgHref, label: fill(M.connect, { app: 'Telegram' }), icon: <Send size={16} className="text-[#229ED9]" />, external: true },
                    sms: { on: !!SMS_NUMBER, href: smsHref, label: M.connectText, icon: <MessageSquare size={16} className="text-[#3f7486]" />, external: false },
                  }[id];
                  if (!c.on) return null;
                  return readyCode ? (
                    <a key={id} href={c.href(readyCode)} target={c.external ? '_blank' : undefined} rel="noreferrer" onClick={() => connect(id)} className={btn}>{c.icon} {c.label}</a>
                  ) : (
                    <button key={id} onClick={() => connect(id)} className={btn}>{c.icon} {c.label}</button>
                  );
                })}
              </div>
            ) : (
              <span className="shrink-0 px-4 py-2 rounded-full bg-slate-50 text-slate-400 text-xs font-bold">Texting Belluh is coming soon</span>
            )}
          </div>
        )}

        {!phone && code && (
          <div className="text-center py-2">
            <p className="text-sm text-slate-500">{openLink && via === 'telegram' ? 'Telegram should have opened. Tap Start and you\'re connected. Or send this:' : openLink ? `${appName} should have opened with this message ready. Just tap send:` : `Send this to Belluh on ${appName}:`}</p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-bold tracking-[0.2em] text-slate-900">LINK {code}</span>
              <button
                aria-label="Copy code"
                onClick={async () => { try { await navigator.clipboard.writeText(`LINK ${code}`); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } }}
                className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            {openLink && (
              <a href={openLink} target={via === 'sms' || via === 'imessage' ? undefined : '_blank'} rel="noreferrer" className={`inline-flex mt-5 px-6 py-3 ${via === 'line' ? 'bg-[#06C755]' : via === 'imessage' ? 'bg-[#0A84FF]' : via === 'sms' ? 'bg-slate-900' : via === 'telegram' ? 'bg-[#229ED9]' : 'bg-[#25D366]'} text-white rounded-full font-bold text-sm items-center gap-2 hover:brightness-105`}>
                <MessageCircle size={16} /> Open {appName}
              </a>
            )}
            <p className="text-xs text-slate-400 mt-4">The code works for 30 minutes. This page updates once it's connected.</p>
          </div>
        )}

        {phone && (
          <p className="text-sm text-slate-500 mb-2">
            Connected to {phone.startsWith('tg:') ? 'Telegram' : phone.startsWith('line:') ? 'LINE' : phone}. Text Bella anything: a date, a plan, "remind me to book dinner Friday". Send LIST anytime to see your dates.
          </p>
        )}

        {sorted.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100">
            {sorted.map(({ o, days }) => (
              <li key={o.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-serif text-slate-900 truncate">{o.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {MONTHS[o.month - 1]} {o.day}{!o.repeats_yearly && o.year ? `, ${o.year}` : ''}
                    {', '}{days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}
                    {'. '}{o.source_message === 'Planned together in Belluh' ? 'Planned together.' : o.source_message === 'From your About us dates' ? 'From your facts.' : `You told us ${new Date(o.mentioned_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}.`}
                  </p>
                </div>
                <button aria-label={`Remove ${o.label}`} onClick={() => remove(o)} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WhatsAppDates;
