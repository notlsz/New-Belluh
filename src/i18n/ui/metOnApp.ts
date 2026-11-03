// The landing line for couples who met on an app: "{app} finds love. Belluh keeps it." The app is the one that
// leads where the reader lives, and only where naming it is safe; elsewhere the line says "dating apps".
import type { UiTable } from '../ui';

const en = {
  brand: '{app} finds love. Belluh keeps it.',
  generic: 'Dating apps find love. Belluh keeps it.',
  sub: 'Bring your story from the app you met on: the day you matched, your first message, your first date. Read on your phone, nothing uploaded.',
  cta: 'Bring your story',
};

const t: UiTable<typeof en> = {
  en,
  ja: { brand: '{app}は出会いをくれる。Belluhは、その恋を守る。', generic: 'マッチングアプリは出会いをくれる。Belluhは、その恋を守る。', sub: '出会ったアプリから、ふたりの物語を。マッチした日、最初のメッセージ、初デート。読み込みは端末の中だけで、何もアップロードしません。', cta: 'ふたりの物語を持ってくる' },
  fr: { brand: '{app} fait naître l’amour. Belluh le fait durer.', generic: 'Les applis de rencontre font naître l’amour. Belluh le fait durer.', sub: 'Ramenez votre histoire depuis l’appli où vous vous êtes rencontrés : le jour du match, le premier message, le premier rendez-vous. Lu sur votre téléphone, rien n’est envoyé.', cta: 'Ramener notre histoire' },
  it: { brand: '{app} fa nascere l’amore. Belluh lo fa durare.', generic: 'Le app di incontri fanno nascere l’amore. Belluh lo fa durare.', sub: 'Porta qui la vostra storia dall’app dove vi siete conosciuti: il giorno del match, il primo messaggio, il primo appuntamento. Letto sul tuo telefono, niente viene caricato.', cta: 'Porta la vostra storia' },
  pt: { brand: '{app} encontra o amor. O Belluh cuida dele.', generic: 'Apps de namoro encontram o amor. O Belluh cuida dele.', sub: 'Traga a história de vocês do app onde se conheceram: o dia do match, a primeira mensagem, o primeiro encontro. Lido no seu celular, nada é enviado.', cta: 'Trazer nossa história' },
  zh: { brand: '{app}负责相遇，Belluh 负责未来。', generic: '交友软件负责相遇，Belluh 负责未来。', sub: '把你们在交友软件上的故事带过来：配对的那天、第一条消息、第一次约会。只在你的手机上读取，不上传任何内容。', cta: '带上你们的故事' },
  de: { brand: '{app} findet die Liebe. Belluh hält sie.', generic: 'Dating-Apps finden die Liebe. Belluh hält sie.', sub: 'Holt eure Geschichte aus der App, in der ihr euch kennengelernt habt: der Tag des Matches, die erste Nachricht, das erste Date. Gelesen auf deinem Handy, nichts wird hochgeladen.', cta: 'Eure Geschichte holen' },
  es: { brand: '{app} encuentra el amor. Belluh lo cuida.', generic: 'Las apps de citas encuentran el amor. Belluh lo cuida.', sub: 'Trae vuestra historia desde la app donde os conocisteis: el día del match, el primer mensaje, la primera cita. Se lee en tu móvil, no se sube nada.', cta: 'Traer nuestra historia' },
  ko: { brand: '{app}은 사랑을 찾아 주고, Belluh는 그 사랑을 지켜요.', generic: '데이팅 앱은 사랑을 찾아 주고, Belluh는 그 사랑을 지켜요.', sub: '처음 만난 앱에서 두 사람의 이야기를 가져오세요. 매칭된 날, 첫 메시지, 첫 데이트까지. 휴대폰 안에서만 읽고, 아무것도 올리지 않아요.', cta: '우리 이야기 가져오기' },
  'es-MX': { sub: 'Trae su historia desde la app donde se conocieron: el día del match, el primer mensaje, la primera cita. Se lee en tu celular, no se sube nada.' },
  'pt-PT': { sub: 'Traga a vossa história da app onde se conheceram: o dia do match, a primeira mensagem, o primeiro encontro. Lido no seu telemóvel, nada é enviado.', cta: 'Trazer a nossa história' },
};
export default t;
