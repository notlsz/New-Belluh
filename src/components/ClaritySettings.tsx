import React, { useState } from 'react';
import { useUi } from '../i18n';
import strings from '../i18n/ui/clarity';
import { Emoji } from '../lib/emoji3d';
import { clarityApi } from '../services/clarity';

// Clarity in Settings: off by default. Turning it on comes after a short explanation; turning it off deletes what it
// keeps. The name is neutral on purpose, so a partner glancing at Settings sees nothing that stands out.
export default function ClaritySettings({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  const T = useUi(strings);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const turnOn = async () => { setBusy(true); const r = await clarityApi.on(); setBusy(false); if (r) { setReading(false); onChange(true); } };
  const turnOff = async () => { if (!window.confirm(T.confirmOff)) return; setBusy(true); const r = await clarityApi.off(); setBusy(false); if (r) onChange(false); };
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <Emoji e="🫧" size={28} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-slate-900">{T.name}{on ? <span className="ml-2 text-[13px] font-semibold text-[#3f7486]">{T.on}</span> : null}</p>
          <p className="text-sm text-slate-500">{T.settingsBody}</p>
        </div>
        {on
          ? <button onClick={turnOff} disabled={busy} className="shrink-0 h-9 px-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-40">{T.turnOff}</button>
          : !reading && <button onClick={() => setReading(true)} className="shrink-0 h-9 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold">{T.turnOn}</button>}
      </div>
      {reading && !on && (
        <div className="mt-4 rounded-2xl bg-white border border-slate-100 p-5">
          <p className="font-serif text-lg text-slate-900 mb-3">{T.introTitle}</p>
          <div className="flex flex-col gap-2.5 mb-5">{T.intro.map((line, i) => <p key={i} className="text-[14px] leading-relaxed text-slate-600">{line}</p>)}</div>
          <div className="flex items-center gap-2">
            <button onClick={turnOn} disabled={busy} className="h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-40">{T.confirmOn}</button>
            <button onClick={() => setReading(false)} className="h-10 px-4 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50">{T.notNow}</button>
          </div>
        </div>
      )}
    </div>
  );
}
