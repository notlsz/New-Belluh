import React, { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { pushState, enablePush, disablePush, pushAvailable, type PushState } from '../services/push';
import { trackEvent } from '../services/analytics';
import { useUi } from '../i18n';
import deviceSettings from '../i18n/ui/deviceSettings';

const NotificationsToggle: React.FC<{ onShowToast: (m: string, t: 'success' | 'error' | 'info') => void }> = ({ onShowToast }) => {
  const T = useUi(deviceSettings).push;
  const COPY: Record<PushState, string> = { on: T.on, off: T.off, blocked: T.blocked, 'needs-install': T.needsInstall, unsupported: T.unsupported };
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
      if (next === 'on') onShowToast(T.turnedOn, 'success');
      if (next === 'blocked') onShowToast(T.blockedToast, 'error');
    } catch { onShowToast(T.failed, 'error'); }
    setBusy(false);
  };
  const canToggle = state === 'on' || state === 'off';

  return (
    <div className="mb-12">
      <h3 className="font-serif text-xl text-slate-900 pl-1 mb-4">{T.title}</h3>
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex items-start gap-4">
        <div className={`w-6 pt-0.5 flex justify-center shrink-0 ${state === 'on' ? 'text-[#e58fc9]' : 'text-slate-400'}`}>
          {state === 'on' ? <Bell size={18} /> : <BellOff size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-lg text-slate-900">{T.rowTitle}</p>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{COPY[state]}</p>
        </div>
        {canToggle && (
          <button role="switch" aria-checked={state === 'on'} aria-label={T.rowTitle} disabled={busy} onClick={toggle}
            className={`shrink-0 mt-1 w-12 h-7 rounded-full relative transition-colors disabled:opacity-60 ${state === 'on' ? 'bg-slate-900' : 'bg-slate-200'}`}>
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${state === 'on' ? 'left-6' : 'left-1'}`} />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationsToggle;
