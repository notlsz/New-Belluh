import React, { useEffect, useState } from 'react';
import DragonflyMark from './DragonflyMark';
import { useUi } from '../i18n';
import strings from '../i18n/ui/privacyCenter';
import { hasChosen, inGdprRegion, setConsent, openPrivacyCenter, CONSENT_EVENT } from '../lib/consent';

/**
 * First-visit choice for people in the EEA, the UK and Switzerland (GDPR asks first). Everywhere else there is no
 * banner: US privacy laws are opt out, so the footer's "Your privacy choices" opens the center instead.
 * Hides for good once a choice is saved here, in the center, or on the account.
 */
const ConsentBanner: React.FC = () => {
  const T = useUi(strings);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!hasChosen() && inGdprRegion());
    const hide = () => setShow(false);
    window.addEventListener(CONSENT_EVENT, hide);
    return () => window.removeEventListener(CONSENT_EVENT, hide);
  }, []);

  if (!show) return null;
  return (
    <div role="region" aria-label={T.title} className="fixed inset-x-0 bottom-0 z-[90] p-3 sm:p-5 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl bg-white rounded-[2rem] border border-slate-100 shadow-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <DragonflyMark size={28} rippleOnMount={false} />
          <p className="text-sm text-slate-600 leading-relaxed">{T.bannerText}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={openPrivacyCenter} className="h-11 px-4 rounded-full text-sm font-semibold text-slate-700 hover:text-slate-900 whitespace-nowrap">{T.manageChoices}</button>
          <button type="button" onClick={() => setConsent({ preferences: false, usage: false, saleOptOut: true }, 'banner')}
            className="h-11 px-5 rounded-full border border-slate-300 text-sm font-semibold text-slate-900 hover:bg-slate-50 whitespace-nowrap">{T.rejectAll}</button>
          <button type="button" onClick={() => setConsent({ preferences: true, usage: true }, 'banner')}
            className="h-11 px-5 rounded-full bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 whitespace-nowrap">{T.acceptAll}</button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
