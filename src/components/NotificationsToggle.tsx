import React, { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { pushState, enablePush, disablePush, pushAvailable, type PushState } from '../services/push';
import { trackEvent } from '../services/analytics';

const COPY: Record<PushState, string> = {
  on: "On for this device. You'll hear when your partner sends a plan or a note, on Sunday and Wednesday, and before your dates.",
  off: 'Hear when your partner sends a plan or a note, on Sunday and Wednesday, and before your dates.',
  blocked: 'Notifications are blocked for Belluh in this browser. Allow them in the browser’s site settings, then try again.',
  'needs-install': 'On iPhone, add Belluh to your Home Screen first (Share → Add to Home Screen), then turn notifications on from there.',
  unsupported: "This browser can't show notifications. Connect WhatsApp or text above instead.",
};

const NotificationsToggle: React.FC<{ onShowToast: (m: string, t: 'success' | 'error' | 'info') => void }> = ({ onShowToast }) => {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<PushState>('off');
  const [busy, setBusy] = useState(false);
  useEffect(() => { pushAvailable().then(ok => { setReady(ok); if (ok) pushState().then(setState).catch(() => setState('unsupported')); }); }, []);
  if (!ready) return null;

  const toggle = async () => {
    setBusy(true);
    try {
      const next = state === 'on' ? await disablePush() : await enablePush();
      setState(next);
      trackEvent('push_toggled', { state: next });
      if (next === 'on') onShowToast('Notifications are on', 'success');
      if (next === 'blocked') onShowToast('Notifications are blocked in this browser', 'error');
    } catch { onShowToast("Couldn't turn on notifications. Try again.", 'error'); }
    setBusy(false);
  };
  const canToggle = state === 'on' || state === 'off';

  return (
    <div className="mb-12">
      <h3 className="font-serif text-xl text-slate-900 pl-1 mb-4">Notifications</h3>
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex items-start gap-4">
        <div className={`w-6 pt-0.5 flex justify-center shrink-0 ${state === 'on' ? 'text-[#e58fc9]' : 'text-slate-400'}`}>
          {state === 'on' ? <Bell size={18} /> : <BellOff size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-lg text-slate-900">Notifications on this device</p>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{COPY[state]}</p>
        </div>
        {canToggle && (
          <button role="switch" aria-checked={state === 'on'} aria-label="Notifications on this device" disabled={busy} onClick={toggle}
            className={`shrink-0 mt-1 w-12 h-7 rounded-full relative transition-colors disabled:opacity-60 ${state === 'on' ? 'bg-slate-900' : 'bg-slate-200'}`}>
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${state === 'on' ? 'left-6' : 'left-1'}`} />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationsToggle;
