// The iOS and Android apps: Belluh Memory reads the phone's photo library (with real dates and places) instead of a
// picked folder. Same row as Keep adding: a 3D emoji, a title and a line, then the buttons, all on one axis.
import React, { useCallback, useEffect, useState } from 'react';
import { useI18n, useUi } from '../../i18n';
import strings from '../../i18n/ui/nativeLibrary';
import type { MemoryEngine } from '../../lib/memory/types';
import type { PhotoAccess } from '../../lib/native/photos';
import { Emoji } from '../../lib/emoji3d';
import { btnSoft, btnQuiet, fillT } from './bits';

export const NativeLibrary: React.FC<{ engine: MemoryEngine | null }> = ({ engine }) => {
  const T = useUi(strings);
  const { num } = useI18n();
  const [access, setAccess] = useState<PhotoAccess | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { photoAccess } = await import('../../lib/native/library');
    setAccess(await photoAccess());
  }, []);
  useEffect(() => {
    void load();
    let off = () => {};
    import('../../lib/native/library').then(m => { off = m.onLibraryChange(() => void load()); });
    // Coming back from Settings or the system's photo picker
    const back = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', back);
    return () => { off(); document.removeEventListener('visibilitychange', back); };
  }, [load]);
  if (!engine || !access) return null;

  const read = async () => {
    setBusy(true); setNote(T.reading);
    try {
      const m = await import('../../lib/native/library');
      const r = await m.runLibrary({ force: true });
      setNote(r ? (r.added ? fillT(T.added, { n: num(r.added) }) : T.none) : null);
    } finally { setBusy(false); void load(); }
  };
  const allow = async () => {
    const { BelluhPhotos } = await import('../../lib/native/photos');
    const got = (await BelluhPhotos.requestPermissions().catch(() => ({ photos: 'denied' as PhotoAccess }))).photos;
    setAccess(got);
    if (got !== 'granted' && got !== 'limited') return;
    const mem = await import('../../lib/memory');
    mem.setMemoryEnabled(true);
    mem.startKeepAdding();
    await read();
  };
  const choose = async () => {
    const { BelluhPhotos } = await import('../../lib/native/photos');
    await BelluhPhotos.manageLimited().catch(() => {});
    await read();
  };
  const settings = async () => { const { BelluhPhotos } = await import('../../lib/native/photos'); await BelluhPhotos.openSettings().catch(() => {}); };

  const on = access === 'granted' || access === 'limited';
  const body = note ?? (access === 'granted' ? T.on : access === 'limited' ? T.limited : access === 'denied' ? T.denied : T.body);
  const btn = `${btnSoft} h-10 px-4 text-sm`;
  return (
    <div className="py-3">
      <div className="flex items-center gap-4">
        <Emoji e="📸" size={26} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 leading-snug">{T.title}</p>
          <p className="text-sm text-slate-500 leading-relaxed mt-0.5" aria-live="polite">{body}</p>
        </div>
      </div>
      <div className="mt-3 ml-[42px] flex flex-wrap items-center gap-2">
        {access === 'prompt' && <button type="button" className={btn} onClick={allow}>{T.allow}</button>}
        {access === 'denied' && <button type="button" className={btn} onClick={settings}>{T.settings}</button>}
        {on && <button type="button" className={btn} disabled={busy} onClick={read}>{T.now}</button>}
        {access === 'limited' && <button type="button" className={btnQuiet} disabled={busy} onClick={choose}>{T.choose}</button>}
      </div>
    </div>
  );
};
