// The screenshot path, for apps with no usable export (most Chinese, Korean and Japanese apps): the person picks
// screenshots of the match screen and the first messages, the text is read on this device (tesseract.js, as Belluh
// Memory does), and this file finds the app, the day and the chat lines. Nobody can tell from a screenshot who wrote a
// line, so every chat line counts as possibly the partner's and waits for their yes. Pure (the reader is passed in).

import { ticketDate } from './memory/events.ts';
import { appInText, type DatingApp } from './datingApps.ts';
import { looksPrivate } from './memory/screenshots.ts';
import type { ChatLine } from './datingImport.ts';

/** "It's a match" and its cousins, in the languages Belluh speaks and the apps people screenshot */
const MATCH = /it'?s a match|you matched|matched with|new match|you and .{1,30} (liked|matched)|c'est un match|vous avez matché|es un match|hicisteis match|é um match|deu match|è un match|ihr habt ein match|es ist ein match|マッチング(しました|成立)|マッチしました|配对成功|配對成功|你们互相喜欢|互相喜欢|매칭(되었|성공|됐)|서로 좋아요/i;
// Phone and app chrome that is not part of the conversation
const CHROME = /^(\d{1,2}[:.]\d{2}(\s?[ap]m)?|\d{1,3}\s?%|lte|5g|4g|wi-?fi|type a message|send|send a message|say something nice|message|chat|matches|messages|keep swiping|send a like|aa|gif|back|today|yesterday|seen|read|delivered|送信|メッセージを入力|发送|发消息|輸入訊息|메시지 입력|보내기|écrire un message|envoyer|scrivi un messaggio|invia|nachricht schreiben|senden|escribe un mensaje|enviar|escreva uma mensagem)$/i;

export interface ShotRead { app: DatingApp | null; isMatch: boolean; day: string | null; lines: string[] }

const p2 = (n: number) => String(n).padStart(2, '0');
const localDay = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };

/** A date the text shows. Chats are about the past: a date without a year that lands after the screenshot is last year's. */
export function pastDay(text: string, takenAt: number | null): string | null {
  const d = ticketDate(text, takenAt);
  if (!d) return null;
  const ref = takenAt ?? Date.now();
  let [y, m, day] = d.split('-').map(Number);
  while (Date.UTC(y, m - 1, day) > ref + 86_400_000 && y > 2000) y--;
  return `${y}-${p2(m)}-${p2(day)}`;
}

/** One screenshot's lines of text, read into the app, whether it's the match screen, the day it shows, and chat lines */
export function readDatingShot(lines: string[], takenAt: number | null, prefer: string[] = []): ShotRead {
  const text = lines.join('\n');
  const app = appInText(text, prefer);
  const isMatch = MATCH.test(text);
  const day = pastDay(text, takenAt);
  const chat = lines
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(l => l.replace(/\s/g, '').length >= 2 && l.length <= 300)
    .filter(l => !CHROME.test(l) && !MATCH.test(l) && !(app && app.marks.test(l) && l.length < 24))
    .filter(l => !pastDay(l, takenAt) || /\p{L}{3,}.*\p{L}{3,}/u.test(l.replace(/\d/g, '')))
    .filter(l => !looksPrivate(l))
    .filter(l => /\p{L}/u.test(l));
  return { app, isMatch, day, lines: chat };
}

export interface ShotsStory { app: DatingApp | null; matchedDay: string | null; firstDay: string | null; lines: ChatLine[] }

/** Several screenshots into one story: the app most of them name, the match screen's day, and their chat lines in order */
export function storyFromShots(shots: { lines: string[]; takenAt: number | null }[], prefer: string[] = []): ShotsStory {
  const reads = shots.map(s => ({ ...readDatingShot(s.lines, s.takenAt, prefer), takenAt: s.takenAt }))
    .sort((x, y) => (x.takenAt ?? 0) - (y.takenAt ?? 0));
  const votes = new Map<string, { app: DatingApp; n: number }>();
  for (const r of reads) if (r.app) votes.set(r.app.id, { app: r.app, n: (votes.get(r.app.id)?.n ?? 0) + 1 });
  const app = [...votes.values()].sort((x, y) => y.n - x.n)[0]?.app ?? null;
  const match = reads.find(r => r.isMatch);
  // The match screen's own date, else the day that screenshot was taken (people screenshot a match when it happens)
  const matchedDay = match ? (match.day ?? (match.takenAt ? localDay(match.takenAt) : null)) : null;
  const days = reads.map(r => r.day).filter((d): d is string => !!d).sort();
  const seen = new Set<string>();
  const lines: ChatLine[] = [];
  for (const r of reads) for (const t of r.lines) {
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    lines.push({ at: r.day ? Date.parse(`${r.day}T12:00:00Z`) : r.takenAt, text: t, mine: null });
  }
  return { app, matchedDay, firstDay: days[0] ?? matchedDay, lines: lines.slice(0, 40) };
}

/** Reads a screenshot's text as lines on this device. Loaded only when the screenshot path is opened. */
export async function shotReader(uiLang: string, country?: string | null): Promise<{ read(img: Blob): Promise<string[]>; close(): Promise<void> }> {
  const [{ createWorker }, { ocrLangs, TESS_CACHE }] = await Promise.all([import('tesseract.js'), import('./memory/ocr.ts')]);
  // The local apps' language too: a Japanese app on a phone set to English still writes マッチング
  const local: Record<string, string> = { JP: 'jpn', CN: 'chi_sim', HK: 'chi_tra', KR: 'kor' };
  const extra = local[String(country ?? '').toUpperCase()];
  const langs = [...new Set([...ocrLangs(uiLang), ...(extra ? [extra] : [])])];
  const worker = await createWorker(langs, 1, { cachePath: TESS_CACHE, logger: () => {} } as any);
  return {
    async read(img) {
      const { data } = await worker.recognize(img);
      const ls = ((data as any).lines as { text: string; confidence: number }[] | undefined) ?? String(data.text ?? '').split('\n').map(text => ({ text, confidence: 100 }));
      return ls.filter(l => l.confidence >= 55).map(l => l.text.trim()).filter(Boolean).slice(0, 80);
    },
    close: () => worker.terminate().then(() => {}),
  };
}
