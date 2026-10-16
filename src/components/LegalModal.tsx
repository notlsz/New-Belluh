import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, ArrowUp, ChevronDown } from 'lucide-react';
import { TOS_TEXT } from '../data/Terms';
import { PRIVACY_POLICY_TEXT } from '../data/PrivacyPolicy';

interface LegalModalProps {
  type: 'tos' | 'privacy';
  onClose: () => void;
}

type Block = { kind: 'p' | 'item'; text: string } | { kind: 'sub'; num: string; title: string } | { kind: 'table'; rows: string[] };
type Section = { num: string; title: string; id: string; blocks: Block[] };

const ACRONYMS = new Set(['AI', 'U.S.', 'CCPA', 'CPRA', 'GDPR', 'EU', 'UK', 'COPPA', 'IP', 'SMS', 'API']);
/** "AI-GENERATED INSIGHTS AND DISCLAIMERS" becomes "AI-generated insights and disclaimers". */
function sentenceCase(s: string): string {
  const words = s.trim().split(/\s+/).map((w, i) => {
    const parts = w.split('-').map((p, j) => {
      const bare = p.replace(/[^A-Za-z.]/g, '');
      if (ACRONYMS.has(bare.toUpperCase())) return p.toUpperCase();
      const low = p.toLowerCase();
      return i === 0 && j === 0 ? low.charAt(0).toUpperCase() + low.slice(1) : low;
    });
    return parts.join('-');
  });
  return words.join(' ');
}

/** Turns the plain legal text into numbered sections, subsections, paragraphs, list lines and tables. */
function parse(text: string): { effective: string | null; sections: Section[]; intro: Block[] } {
  const lines = text.split('\n').map(l => l.trim());
  let effective: string | null = null;
  const sections: Section[] = [];
  const intro: Block[] = [];
  let cur: Section | null = null;
  const push = (b: Block) => (cur ? cur.blocks : intro).push(b);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (i === 0 && /TERMS OF SERVICE|PRIVACY POLICY/i.test(line)) continue;
    const eff = /^(?:Effective Date|Last Updated):\s*(.+)$/i.exec(line);
    if (eff) { effective = eff[1]; continue; }
    const sec = /^(\d+)\.\s+([A-Z0-9'’&,\-\s/()]+)$/.exec(line);
    if (sec) {
      const title = sentenceCase(sec[2]);
      cur = { num: sec[1], title, id: `s-${sec[1]}`, blocks: [] };
      sections.push(cur);
      continue;
    }
    const sub = /^(\d+\.\d+)\s+(.+)$/.exec(line);
    if (sub && sub[2].length < 90) { push({ kind: 'sub', num: sub[1], title: sub[2] }); continue; }
    if (line.includes(': Collected (')) {
      const rows = [line];
      while (i + 1 < lines.length && lines[i + 1].includes(': Collected (')) rows.push(lines[++i]);
      push({ kind: 'table', rows });
      continue;
    }
    // Lines that end a clause ("...;" or "...; and") read as list lines
    if (/;(\s*(and|or))?$/.test(line) || (/^[A-Z]/.test(line) && line.length < 140 && /[.;:]$/.test(line) === false)) {
      push({ kind: 'item', text: line.replace(/^[•\-]\s*/, '') });
      continue;
    }
    push({ kind: 'p', text: line.replace(/^[•\-]\s*/, '') });
  }
  return { effective, sections, intro };
}

const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const scroller = useRef<HTMLDivElement>(null);
  // Switch between the two documents without closing
  const [doc, setDoc] = useState<'tos' | 'privacy'>(type);
  const title = doc === 'tos' ? 'Terms of Service' : 'Privacy Policy';
  const { effective, sections, intro } = useMemo(() => parse(doc === 'tos' ? TOS_TEXT : PRIVACY_POLICY_TEXT), [doc]);
  const [active, setActive] = useState(sections[0]?.id ?? '');
  const [progress, setProgress] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const minutes = useMemo(() => Math.max(1, Math.round((doc === 'tos' ? TOS_TEXT : PRIVACY_POLICY_TEXT).split(/\s+/).length / 230)), [doc]);
  useEffect(() => { setActive(sections[0]?.id ?? ''); scroller.current?.scrollTo({ top: 0 }); setProgress(0); }, [doc]);
  const onScroll = () => { const el = scroller.current; if (el) setProgress(el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  // Highlight the section you're reading in the contents
  useEffect(() => {
    const root = scroller.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(items => {
      const top = items.filter(i => i.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (top) setActive(top.target.id);
    }, { root, rootMargin: '0px 0px -70% 0px' });
    sections.forEach(s => { const el = document.getElementById(s.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [sections]);

  const go = (id: string) => { setTocOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const current = sections.find(s => s.id === active) ?? sections[0];

  const renderBlock = (b: Block, k: number) => {
    if (b.kind === 'sub') return (
      <h4 key={k} className="mt-8 mb-3 flex gap-3 items-baseline text-lg font-semibold text-slate-900">
        <span className="font-serif text-[#9bbecb] tabular-nums">{b.num}</span><span>{b.title}</span>
      </h4>
    );
    if (b.kind === 'item') return <p key={k} className="ml-1 pl-4 border-l-2 border-[#CDE9F2] text-[16px] leading-relaxed text-slate-600 py-0.5 mb-2.5">{b.text}</p>;
    if (b.kind === 'table') return (
      <div key={k} className="my-7 overflow-x-auto rounded-2xl bg-[#F8FAFB]">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <th className="px-5 py-4">Category</th><th className="px-5 py-4">Collected</th><th className="px-5 py-4">Sold or shared</th>
            </tr>
          </thead>
          <tbody>
            {b.rows.map((row, r) => {
              const [cat, data = ''] = row.split(': ');
              const col = /Collected \((.*?)\)/.exec(data)?.[1] ?? '';
              const sold = /Sold\/Shared \((.*?)\)/.exec(data)?.[1] ?? '';
              const pill = (v: string, good: boolean) => <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${good ? 'bg-[#CDE9F2]/60 text-[#2f6578]' : 'bg-white text-slate-500'}`}>{v}</span>;
              return (
                <tr key={r} className={r % 2 ? 'bg-white/60' : ''}>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{cat}</td>
                  <td className="px-5 py-3.5">{pill(col, /^yes/i.test(col))}</td>
                  <td className="px-5 py-3.5">{pill(sold, /^no/i.test(sold))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
    return <p key={k} className="text-[16px] leading-relaxed text-slate-600 mb-4">{b.text}</p>;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm animate-fade-in sm:p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="relative h-full w-full max-w-6xl mx-auto bg-white sm:rounded-[2rem] shadow-2xl overflow-hidden flex" onClick={e => e.stopPropagation()}>

        {/* Contents */}
        <aside className="relative hidden md:flex w-80 shrink-0 flex-col p-10 pr-6 overflow-y-auto">
          <p className="font-serif text-xl font-bold text-[#9bbecb]">Belluh</p>
          <div role="tablist" aria-label="Document" className="mt-7 p-1 rounded-full bg-slate-100/80 flex text-[13px] font-semibold">
            {([['tos', 'Terms'], ['privacy', 'Privacy']] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={doc === k} onClick={() => setDoc(k)} className={`flex-1 h-9 rounded-full transition-all ${doc === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{l}</button>
            ))}
          </div>
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Contents</p>
          <nav className="space-y-0.5">
            {sections.map(s => (
              <button key={s.id} onClick={() => go(s.id)} className={`w-full text-left flex gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${active === s.id ? 'bg-slate-50 text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-900'}`}>
                <span className={`w-5 shrink-0 tabular-nums font-serif ${active === s.id ? 'text-[#f0addd]' : 'text-[#9bbecb]'}`}>{s.num}</span>
                <span className="min-w-0">{s.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Document */}
        <div ref={scroller} onScroll={onScroll} className="relative flex-1 overflow-y-auto scroll-smooth">
          <div className="sticky top-0 z-20 h-[3px] bg-transparent" aria-hidden="true"><div className="h-full bg-gradient-to-r from-[#9bbecb] to-[#f0addd] transition-[width] duration-150" style={{ width: `${progress * 100}%` }} /></div>
          <button onClick={onClose} aria-label="Close" className="sticky top-0 float-right z-10 m-4 md:m-6 p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <X size={24} />
          </button>
          <article className="max-w-3xl px-6 md:px-14 pt-12 md:pt-20 pb-28">
            {/* Phones: switch documents here */}
            <div role="tablist" aria-label="Document" className="md:hidden mb-8 inline-flex p-1 rounded-full bg-slate-100/80 text-[13px] font-semibold">
              {([['tos', 'Terms'], ['privacy', 'Privacy']] as const).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={doc === k} onClick={() => setDoc(k)} className={`h-9 px-5 rounded-full transition-all ${doc === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{l}</button>
              ))}
            </div>
            <h1 className="font-serif text-5xl md:text-6xl tracking-tight text-slate-900 leading-[1.05]">{title}</h1>
            <p className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-slate-400">{effective && <span>Effective {effective}</span>}<span>{minutes} minute read</span></p>
            {intro.map(renderBlock)}

            {/* Phones: where you are, and every section a tap away */}
            {current && (
              <div className="md:hidden sticky top-3 z-10 mt-8">
                <button onClick={() => setTocOpen(o => !o)} aria-expanded={tocOpen} className="w-full h-12 px-4 rounded-full bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_12px_30px_-16px_rgba(15,23,42,0.35)] flex items-center gap-3 text-left text-[15px]">
                  <span className="font-serif text-[#9bbecb] tabular-nums">{current.num}</span>
                  <span className="flex-1 min-w-0 truncate text-slate-800 font-medium">{current.title}</span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform ${tocOpen ? 'rotate-180' : ''}`} />
                </button>
                {tocOpen && (
                  <nav className="mt-2 max-h-[55vh] overflow-y-auto rounded-3xl bg-white border border-slate-100 shadow-xl p-3 animate-scale-in">
                    {sections.map(s => (
                      <button key={s.id} onClick={() => go(s.id)} className={`w-full text-left flex gap-3 rounded-2xl px-3 py-2.5 text-[15px] ${active === s.id ? 'bg-slate-50 text-slate-900 font-semibold' : 'text-slate-600'}`}>
                        <span className="w-6 shrink-0 font-serif text-[#9bbecb] tabular-nums">{s.num}</span>{s.title}
                      </button>
                    ))}
                  </nav>
                )}
              </div>
            )}

            {sections.map(s => (
              <section key={s.id} id={s.id} className="scroll-mt-6 pt-14 md:pt-16">
                <div className="flex items-baseline gap-4 mb-5">
                  <span className="font-serif text-4xl md:text-5xl text-[#CDE9F2] tabular-nums leading-none">{s.num}</span>
                  <h2 className="font-serif text-2xl md:text-3xl tracking-tight text-slate-900">{s.title}</h2>
                </div>
                {s.blocks.map(renderBlock)}
              </section>
            ))}

            <div className="mt-20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button onClick={onClose} className="px-7 py-3.5 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-black transition-colors">I understand</button>
              <button onClick={() => scroller.current?.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-900">
                <ArrowUp size={16} /> Back to top
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
