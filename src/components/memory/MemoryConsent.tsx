// The permission Rollup's privacy guide asks for, before the first query or profile: what is sent, to whom, that it
// is not stored, and how to turn it off. Allow or Not now; nothing is sent until Allow.
import React from 'react';
import { useUi } from '../../i18n';
import strings from '../../i18n/ui/passport';
import { setMemoryConsent } from '../../lib/memory/consent';
import { Emoji } from '../../lib/emoji3d';
import { Sheet, btnDark, btnSoft } from './bits';

const MemoryConsent: React.FC<{ onAllow: () => void; onClose: () => void }> = ({ onAllow, onClose }) => {
  const T = useUi(strings);
  const C = T.consent;
  return (
    <Sheet title={C.title} onClose={onClose} closeLabel={T.settingsSheet.close}
      footer={<div className="flex items-center gap-3">
        <button type="button" onClick={onClose} className={`flex-1 ${btnSoft}`}>{C.notNow}</button>
        <button type="button" onClick={() => { setMemoryConsent({ ai: true }); onAllow(); }} className={`flex-1 ${btnDark}`}>{C.allow}</button>
      </div>}>
      <div className="flex flex-col gap-4 pt-2">
        {[['📷', C.body1], ['🔒', C.body2], ['⚙️', C.body3], ['🙂', C.adults]].map(([e, t]) => (
          <div key={e} className="flex items-center gap-3">
            <Emoji e={e} size={26} className="shrink-0" />
            <p className="text-[15px] text-slate-600 leading-relaxed">{t}</p>
          </div>
        ))}
      </div>
    </Sheet>
  );
};
export default MemoryConsent;
