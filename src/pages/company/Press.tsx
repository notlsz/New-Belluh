// belluh.com/press, laid out like hinge.co/press-resources: a big serif title, who to write to on the left, and on the
// right a stack of brand assets, each with a preview, a download and its file type, then the colors and the boilerplate.
// Every file here is in /public.
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useI18n, useUi } from '../../i18n';
import table from '../../i18n/ui/pressPage';
import { Shell, Wrap, Eyebrow, Reveal, Pill, type PageProps } from './kit';

const PRESS_EMAIL = 'elizabeth@belluh.com';
const ASSETS = [
  { id: 'logo', href: '/dragonfly.png', file: 'belluh-mark.png', type: 'PNG' },
  { id: 'icon', href: '/icon-512.png', file: 'belluh-app-icon.png', type: 'PNG' },
  { id: 'lifestyle', href: '/milestones/first-date.webp', file: 'belluh-lifestyle.webp', type: 'WEBP' },
  { id: 'social', href: '/og.png', file: 'belluh-social.png', type: 'PNG' },
] as const;
const COLORS = [{ id: 'blue', hex: '#9BBECB' }, { id: 'pink', hex: '#F0ADDD' }] as const;

const save = (href: string, file: string) => {
  const a = document.createElement('a'); a.href = href; a.download = file; document.body.appendChild(a); a.click(); a.remove();
};

const outline = 'inline-flex h-11 items-center gap-2 px-5 rounded-full border border-[#1a1a1a] text-[15px] font-semibold transition-colors hover:bg-[#1a1a1a] hover:text-white';

const Block: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Reveal>
    <section>
      <h2 className="font-serif text-[1.75rem] md:text-[2.1rem] leading-[1.15] tracking-[-0.01em]">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  </Reveal>
);

const Press: React.FC<PageProps> = (p) => {
  const T = useUi(table);
  const { f } = useI18n();
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(c => (c === key ? null : c)), 1800); } catch { /* the text is on the page */ }
  };
  // One click, every asset: each file downloads in turn
  const downloadAll = () => ASSETS.forEach((a, i) => setTimeout(() => save(a.href, a.file), i * 350));

  const preview: Record<(typeof ASSETS)[number]['id'], React.ReactNode> = {
    logo: (
      <div className="flex items-center gap-3 md:gap-4">
        <img src="/dragonfly.png" alt="" className="w-16 h-16 md:w-24 md:h-24" />
        <span className="font-serif font-semibold text-[3rem] md:text-[4.5rem] leading-none tracking-[-0.02em]">Belluh</span>
      </div>
    ),
    icon: <img src="/icon-512.png" alt="" className="w-28 h-28 md:w-40 md:h-40 rounded-[22%] shadow-[0_20px_40px_-20px_rgba(26,26,26,0.45)]" />,
    lifestyle: <img src="/milestones/first-date.webp" alt="" loading="lazy" className="w-full h-full object-cover" />,
    social: <img src="/og.png" alt="" loading="lazy" className="w-[86%] h-auto rounded-lg shadow-[0_20px_40px_-24px_rgba(26,26,26,0.45)]" />,
  };

  return (
    <Shell {...p} title={T.docTitle}>
      <Wrap className="pt-14 md:pt-24 pb-24 md:pb-36">
        <Reveal><h1 className="font-serif font-semibold text-[3rem] leading-[1.02] md:text-[5.75rem] md:leading-[0.98] tracking-[-0.03em]">{T.title}</h1></Reveal>

        <div className="mt-14 md:mt-24 grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-16 lg:gap-24">
          {/* Who to write to */}
          <aside className="lg:sticky lg:top-[112px] self-start">
            <Reveal>
              <Eyebrow>{T.inquiriesEyebrow}</Eyebrow>
              <p className="font-serif text-[2rem] md:text-[2.6rem] leading-[1.12] tracking-[-0.015em] max-w-[16ch] [text-wrap:balance]">{T.inquiriesLine}</p>
              <a href={`mailto:${PRESS_EMAIL}`} aria-label={T.emailLabel} className="mt-6 inline-block text-[17px] underline underline-offset-4 decoration-[#1a1a1a]/30 hover:decoration-[#1a1a1a]">{PRESS_EMAIL}</a>
              <div className="mt-8"><Pill onClick={downloadAll}><Download size={17} aria-hidden />{T.kit}</Pill></div>
            </Reveal>
          </aside>

          {/* The assets */}
          <div className="space-y-16 md:space-y-20">
            {ASSETS.map(a => {
              const A = T.assets[a.id];
              return (
                <Block key={a.id} title={A.title}>
                  <div role="img" aria-label={A.alt} className="rounded-[20px] bg-[#F2F1EE] aspect-[16/10] flex items-center justify-center overflow-hidden">{preview[a.id]}</div>
                  <div className="mt-5 flex items-center justify-between gap-4">
                    <a href={a.href} download={a.file} aria-label={f(T.downloadOf, { name: A.title })} className={outline}><Download size={17} aria-hidden />{T.download}</a>
                    <span className="text-[15px] leading-none text-[#1a1a1a]/55">{a.type}</span>
                  </div>
                </Block>
              );
            })}

            <Block title={T.colorsTitle}>
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {COLORS.map(c => (
                  <div key={c.id} className="min-w-0">
                    <div className="rounded-[20px] aspect-[4/3]" style={{ background: c.hex }} />
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-[15px] font-semibold truncate">{T[c.id]}</span>
                      <button onClick={() => copy(c.hex, c.hex)} aria-label={f(T.copyHex, { hex: c.hex })} className="text-[15px] tabular-nums text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors">{copied === c.hex ? T.copied : c.hex}</button>
                    </div>
                  </div>
                ))}
              </div>
            </Block>

            <Block title={T.aboutTitle}>
              <p className="text-[17px] md:text-[18px] leading-[1.7] text-[#1a1a1a]/80 max-w-[640px]">{T.about}</p>
              <p className="mt-4 text-[15px] leading-[1.6] text-[#1a1a1a]/60">{T.nameNote}</p>
              <div className="mt-6"><button onClick={() => copy('about', T.about)} className={outline}>{copied === 'about' ? T.copied : T.copy}</button></div>
            </Block>
          </div>
        </div>
      </Wrap>
    </Shell>
  );
};

export default Press;
