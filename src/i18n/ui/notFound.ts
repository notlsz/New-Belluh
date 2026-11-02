// The 404 page: one line, one way back
import type { UiTable } from '../ui';

const en = { title: 'Page not found', line: 'Looks like this page stood us up.', sub: 'It might have moved, or the link has a typo. Let’s get you somewhere better.', back: 'Back to Belluh', alt: 'A table for two, one candle lit, one chair still waiting' };
const t: UiTable<typeof en> = {
  en,
  ja: { title: 'ページが見つかりません', line: 'このページに、すっぽかされちゃったみたい。', sub: '移動したか、リンクがちょっと違うのかも。もっといい場所へご案内します。', back: 'Belluhに戻る', alt: 'ふたり用のテーブル。キャンドルが一本、椅子がひとつ待っている' },
  fr: { title: 'Page introuvable', line: 'On dirait que cette page nous a posé un lapin.', sub: 'Elle a peut-être déménagé, ou le lien contient une coquille. On vous ramène quelque part de mieux.', back: 'Retour à Belluh', alt: 'Une table pour deux, une bougie allumée, une chaise qui attend encore' },
  it: { title: 'Pagina non trovata', line: 'Sembra che questa pagina ci abbia dato buca.', sub: 'Forse si è spostata, o il link ha un errore. Ti portiamo in un posto migliore.', back: 'Torna a Belluh', alt: 'Un tavolo per due, una candela accesa, una sedia che aspetta ancora' },
  pt: { title: 'Página não encontrada', line: 'Parece que esta página deu um bolo na gente.', sub: 'Ela pode ter mudado de lugar, ou o link tem um erro. Vamos te levar para um lugar melhor.', back: 'Voltar para o Belluh', alt: 'Uma mesa para dois, uma vela acesa, uma cadeira ainda esperando' },
  zh: { title: '页面不存在', line: '这个页面好像放了我们鸽子。', sub: '它可能搬家了，或者链接有个小错。我们带你去个更好的地方。', back: '回到 Belluh', alt: '一张双人桌，一支蜡烛亮着，一把椅子还在等' },
  de: { title: 'Seite nicht gefunden', line: 'Diese Seite hat uns wohl versetzt.', sub: 'Vielleicht ist sie umgezogen, oder im Link steckt ein Tippfehler. Wir bringen dich an einen schöneren Ort.', back: 'Zurück zu Belluh', alt: 'Ein Tisch für zwei, eine Kerze brennt, ein Stuhl wartet noch' },
  es: { title: 'Página no encontrada', line: 'Parece que esta página nos ha dado plantón.', sub: 'Puede que se haya movido o que el enlace tenga un error. Te llevamos a un sitio mejor.', back: 'Volver a Belluh', alt: 'Una mesa para dos, una vela encendida, una silla que sigue esperando' },
  ko: {
    title: '페이지를 찾을 수 없어요',
    line: '이 페이지, 우리를 바람맞혔나 봐요.',
    sub: '주소가 바뀌었거나 링크에 오타가 있을 수 있어요. 더 좋은 곳으로 안내할게요.',
    back: 'Belluh로 돌아가기',
    alt: '2인용 테이블, 켜진 촛불 하나, 아직 기다리는 의자 하나',
  },
  'es-MX': { line: 'Parece que esta página nos dejó plantados.' },
  'pt-PT': { line: 'Parece que esta página nos deixou pendurados.', sub: 'Pode ter mudado de sítio, ou a ligação tem um erro. Vamos levá-lo a um sítio melhor.' },
};
export default t;
