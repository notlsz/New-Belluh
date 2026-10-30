import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CalendarDays, Copy, Check } from 'lucide-react';
import { belluhAgent } from '../services/belluhAgent';

// Subscribe once; plans you make together and the dates Belluh remembers stay in your own calendar.
const CalendarSync: React.FC<{ onShowToast: (m: string, t: 'success' | 'error' | 'info') => void }> = ({ onShowToast }) => {
  const [feed, setFeed] = useState<{ https: string; webcal: string; google: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  // Hidden until the backend has calendars (the table answers, even if empty), so the button never fails
  const [ready, setReady] = useState(false);
  useEffect(() => { supabase.from('calendar_feeds').select('user_id').limit(1).then(({ error }) => setReady(!error)); }, []);

  const load = async (reset = false) => {
    setBusy(true);
    const f = await belluhAgent.calendarFeed(reset);
    setBusy(false);
    if (!f) { onShowToast("Couldn't set up the calendar link. Try again.", 'error'); return; }
    setFeed(f);
    if (reset) onShowToast('New calendar link made. The old one stopped working.', 'success');
  };
  const copy = async () => {
    if (!feed) return;
    try { await navigator.clipboard.writeText(feed.https); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* the link is visible to select */ }
  };

  if (!ready) return null;

  return (
    <div className="mb-12">
      <h3 className="font-serif text-xl text-slate-900 pl-1 mb-4">Your calendar</h3>
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        {!feed ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <p className="font-serif text-lg text-slate-900">Put your plans and dates in your calendar.</p>
              <p className="text-sm text-slate-500 mt-1">Subscribe once in Google, Apple or Outlook Calendar. New plans and dates appear on their own.</p>
            </div>
            <button disabled={busy} onClick={() => load()} className="shrink-0 px-6 py-3 bg-slate-900 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              <CalendarDays size={16} /> Add to my calendar
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap gap-2">
              <a href={feed.google} target="_blank" rel="noreferrer" className="px-4 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-400">Google Calendar</a>
              <a href={feed.webcal} className="px-4 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-400">Apple Calendar</a>
              <button onClick={copy} className="px-4 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-400 flex items-center gap-1.5">
                {copied ? <Check size={14} /> : <Copy size={14} />} Copy link for Outlook
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-400 break-all select-all">{feed.https}</p>
            <p className="mt-2 text-xs text-slate-400">This link is private to you. <button onClick={() => load(true)} className="underline hover:text-slate-600">Make a new link</button> if you shared it by mistake.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarSync;
