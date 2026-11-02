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
  // Korea texts on KakaoTalk, which Belluh can't reach yet; plain texts and iMessage are the next most used
  if (tz === 'Asia/Seoul' || lang.startsWith('ko')) return ['sms', 'imessage', 'telegram', 'whatsapp', 'line'];
  if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Indiana|Kentucky)/.test(tz) || tz === 'Pacific/Honolulu') return ['imessage', 'sms', 'whatsapp', 'telegram', 'line'];
  return ['whatsapp', 'imessage', 'telegram', 'sms', 'line'];
}


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

const WhatsAppDates: React.FC<{ onShowToast: (m: string, t: 'success' | 'error' | 'info') => void; compact?: boolean }> = ({ onShowToast, compact }) => {
  const { d: { app: { me: M, tx: T, plate: P } }, f: fill, date: fmtDate } = useI18n();
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

  useEffect(() => { if (phone && code) { setCode(null); onShowToast(T.okConnected, 'success'); } }, [phone, code, onShowToast]);

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
    if (error || !data) { onShowToast(T.failSetup, 'error'); return; }
    setCode(data as string);
  };

  const disconnect = async () => {
    const { error } = await supabase.from('whatsapp_links').delete().not('user_id', 'is', null);
    if (error) { onShowToast(T.failDisconnect, 'error'); return; }
    setPhone(null);
    onShowToast(T.disconnected, 'success');
  };

  const remove = async (o: Occasion) => {
    const { error } = await supabase.from('occasions').delete().eq('id', o.id);
    if (error) { onShowToast(T.failRemove, 'error'); return; }
    setOccasions(prev => prev.filter(x => x.id !== o.id));
  };

  if (!available) return null;

  const sorted = occasions
    .map(o => ({ o, days: daysUntil(o) }))
    .filter(x => x.days !== null)
    .sort((a, b) => (a.days as number) - (b.days as number));

  const openLink = !code ? null : via === 'line' && LINE_ID ? lineHref(code) : via === 'imessage' && IMESSAGE_NUMBER ? imHref(code) : via === 'telegram' && TG_BOT ? tgHref(code) : via === 'sms' && SMS_NUMBER ? smsHref(code) : BELLUH_NUMBER ? waHref(code) : null;
  const appName = via === 'line' ? 'LINE' : via === 'telegram' ? 'Telegram' : via === 'sms' || via === 'imessage' ? T.messages : 'WhatsApp';
  const btn = 'shrink-0 h-11 px-5 rounded-full font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors bg-white text-slate-900 border border-slate-200 hover:border-slate-400';

  return (
    <div className={compact ? '' : 'mb-12'}>
      <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-4'}`}>
        <h3 className={compact ? 'text-[13px] font-semibold text-slate-400' : 'font-serif text-xl text-slate-900 pl-1'}>{M.textBella}</h3>
        {phone && <button onClick={disconnect} className="text-xs font-bold text-slate-400 hover:text-slate-700">{T.disconnect}</button>}
      </div>

      <div className={compact ? '' : 'bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6'}>
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
              <span className="shrink-0 px-4 py-2 rounded-full bg-slate-50 text-slate-400 text-xs font-bold">{T.soon}</span>
            )}
          </div>
        )}

        {!phone && code && (
          <div className="text-center py-2">
            <p className="text-sm text-slate-500">{openLink && via === 'telegram' ? T.openedTg : openLink ? fill(T.opened, { app: appName }) : fill(T.sendTo, { app: appName })}</p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-bold tracking-[0.2em] text-slate-900">LINK {code}</span>
              <button
                aria-label={T.copy}
                onClick={async () => { try { await navigator.clipboard.writeText(`LINK ${code}`); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } }}
                className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            {openLink && (
              <a href={openLink} target={via === 'sms' || via === 'imessage' ? undefined : '_blank'} rel="noreferrer" className={`inline-flex mt-5 px-6 py-3 ${via === 'line' ? 'bg-[#06C755]' : via === 'imessage' ? 'bg-[#0A84FF]' : via === 'sms' ? 'bg-slate-900' : via === 'telegram' ? 'bg-[#229ED9]' : 'bg-[#25D366]'} text-white rounded-full font-bold text-sm items-center gap-2 hover:brightness-105`}>
                <MessageCircle size={16} /> {fill(T.openApp, { app: appName })}
              </a>
            )}
            <p className="text-xs text-slate-400 mt-4">{T.codeWorks}</p>
          </div>
        )}

        {phone && (
          <p className="text-sm text-slate-500 mb-2 leading-relaxed">
            {fill(T.connectedTo, { where: phone.startsWith('tg:') ? 'Telegram' : phone.startsWith('line:') ? 'LINE' : phone })}
          </p>
        )}

        {!compact && sorted.length > 0 && (
          <ul className="mt-4 space-y-1">
            {sorted.map(({ o, days }) => (
              <li key={o.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-serif text-slate-900 truncate">{o.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {fill(P.withDate, { line: fmtDate(new Date(o.year && !o.repeats_yearly ? o.year : 2000, o.month - 1, o.day), { month: 'long', day: 'numeric', ...(!o.repeats_yearly && o.year ? { year: 'numeric' } : {}) }), by: days === 0 ? P.today : days === 1 ? P.tomorrow : fill(P.inDays, { n: days as number }) })}
                    {' '}{o.source_message === 'Planned together in Belluh' ? T.planned : o.source_message === 'From your About us dates' ? T.fromFacts : fill(T.toldUs, { date: fmtDate(new Date(o.mentioned_at), { month: 'short', day: 'numeric', year: 'numeric' }) })}
                  </p>
                </div>
                <button aria-label={fill(T.remove, { label: o.label })} onClick={() => remove(o)} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50">
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
