// Reading text in images on the device (screenshots always, when `readText` is on; menus, signs and tickets too with
// `readTextPhotos`), with tesseract.js in its own Web Worker. Loaded only when needed. Language data comes from
// tesseract's CDN on first use (English plus the app's language) and is kept in this browser's IndexedDB under
// TESS_CACHE, which reset() deletes.

import { TESS_CACHE } from './constants.ts';
export { TESS_CACHE };

export interface Ocr { read(image: Blob | ImageBitmap): Promise<string>; close(): Promise<void> }


/** Tesseract's trained data for the app's languages */
export function ocrLangs(uiLang: string): string[] {
  const l = uiLang.toLowerCase();
  const map: Record<string, string> = { de: 'deu', es: 'spa', fr: 'fra', it: 'ita', ja: 'jpn', ko: 'kor', pt: 'por', zh: /tw|hk|hant/.test(l) ? 'chi_tra' : 'chi_sim' };
  const own = map[l.slice(0, 2)];
  return own ? ['eng', own] : ['eng'];
}

export async function browserOcr(uiLang: string): Promise<Ocr> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(ocrLangs(uiLang), 1, { cachePath: TESS_CACHE, logger: () => {} } as any);
  return {
    async read(image) {
      // Tesseract reads a canvas or a Blob; a bitmap is drawn to a canvas first
      let src: any = image;
      if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
        const c = new OffscreenCanvas(image.width, image.height); c.getContext('2d')!.drawImage(image, 0, 0);
        src = await c.convertToBlob({ type: 'image/png' });
      }
      const { data } = await worker.recognize(src);
      // Keep words read with some confidence; tesseract invents letters in photos without text
      const words = (data as any).words as { text: string; confidence: number }[] | undefined;
      const text = words?.length ? words.filter(w => w.confidence >= 60).map(w => w.text).join(' ') : data.text;
      return text.replace(/\s+/g, ' ').trim().slice(0, 4000);
    },
    close: () => worker.terminate().then(() => {}),
  };
}
