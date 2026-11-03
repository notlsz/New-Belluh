// "Tinder finds love. Belluh keeps it." The app named is the one that leads in the reader's country, and only where
// naming a rival is plainly allowed and means something (US-style markets, Brazil, Mexico, China with Tantan).
// Elsewhere (EU, Japan, Korea and the rest) the line says "dating apps", so nothing reads as a claim about a brand.
import React from 'react';
import { useI18n, useUi } from '../i18n';
import strings from '../i18n/ui/metOnApp';

const LEADING_APP: Record<string, string> = {
  US: 'Tinder', CA: 'Tinder', GB: 'Tinder', AU: 'Tinder', NZ: 'Tinder', IE: 'Tinder', IN: 'Tinder', SG: 'Tinder',
  BR: 'Tinder', MX: 'Tinder', CN: '探探',
};

/** The app to name for this reader, or null to say "dating apps" */
export function leadingApp(country: string, lang: string): string | null {
  const app = LEADING_APP[country];
  if (!app) return null;
  if (app === '探探') return lang === 'zh' ? app : null;      // Tantan means nothing outside Chinese
  return app;
}

const MetOnApp: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const T = useUi(strings);
  const { f, country, lang } = useI18n();
  const app = leadingApp(country, lang);
  return (
    <section className="relative z-10 px-6 py-20 md:py-28">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-serif text-[2.3rem] md:text-[3.6rem] leading-[1.07] tracking-tight text-slate-900 [text-wrap:balance]">{app ? f(T.brand, { app }) : T.generic}</h2>
        <p className="mt-6 text-[17px] md:text-lg text-slate-500 leading-relaxed max-w-xl mx-auto [text-wrap:pretty]">{T.sub}</p>
        <button type="button" onClick={onStart} className="mt-9 px-8 py-4 rounded-full bg-slate-900 text-white text-[15px] font-bold hover:bg-black transition-colors">{T.cta}</button>
      </div>
    </section>
  );
};

export default MetOnApp;
