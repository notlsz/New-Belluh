// The home screen until your partner joins: Belluh is for two, so the one thing to do is bring your person.
// {name} is what you call your partner; the NoName lines are used when Belluh doesn't know it yet.
import type { UiTable } from '../ui';

const en = {
  title: 'Belluh is for two.',
  sub: 'Everything here happens between you and {name}: one story you both write, a question you answer together, and Bella, who knows you both.',
  subNoName: 'Everything here happens between the two of you: one story you both write, a question you answer together, and Bella, who knows you both.',
  send: 'Send {name} your link',
  sendNoName: 'Send your link',
  making: 'Making your link…',
  copied: 'Link copied. Send it however you two talk.',
  shared: 'Sent. This page opens up the moment they join.',
  error: 'Couldn’t make a link right now. Try again in a moment.',
  unlock: 'What opens when they join',
  cards: [
    { t: 'One story, two pens', b: 'You both write. Bella keeps every page, and remembers.' },
    { t: 'Today’s question', b: 'You both answer. Neither sees the other’s until both of you do.' },
    { t: 'Bella, for both of you', b: 'Dates, flowers and gifts, planned by someone who knows you two.' },
  ],
  surprise: 'Planning a surprise first? Ask Bella',
  lookAround: 'Look around first',
  invitedYou: '{name} invited you',
  accept: 'Accept',
  decline: 'Not now',
};

const ja: typeof en = {
  title: 'Belluhは、ふたりのためのもの。',
  sub: 'ここで起きることは、すべてあなたと{name}さんのあいだのこと。ふたりで書くひとつの物語、一緒に答える今日の質問、そしてふたりを知っているBella。',
  subNoName: 'ここで起きることは、すべてふたりのあいだのこと。ふたりで書くひとつの物語、一緒に答える今日の質問、そしてふたりを知っているBella。',
  send: '{name}さんにリンクを送る',
  sendNoName: 'リンクを送る',
  making: 'リンクをつくっています…',
  copied: 'リンクをコピーしました。いつものアプリで送ってください。',
  shared: '送りました。相手が参加したら、このページが開きます。',
  error: 'いまはリンクをつくれませんでした。少ししてからもう一度どうぞ。',
  unlock: '参加すると開くもの',
  cards: [
    { t: 'ひとつの物語、ふたりのペン', b: 'ふたりで書いて、Bellaがすべてのページを覚えています。' },
    { t: '今日の質問', b: 'ふたりとも答えるまで、相手の答えは見えません。' },
    { t: 'ふたりのためのBella', b: 'デートも花も贈り物も、ふたりを知っている誰かが考えます。' },
  ],
  surprise: '先にサプライズを考えたい？ Bellaに聞く',
  lookAround: 'まずは見てみる',
  invitedYou: '{name}さんから招待が届いています',
  accept: '参加する',
  decline: 'あとで',
};

const fr: typeof en = {
  title: 'Belluh, c’est à deux.',
  sub: 'Tout se passe ici entre vous et {name} : une histoire que vous écrivez à deux, une question à laquelle vous répondez ensemble, et Bella, qui vous connaît tous les deux.',
  subNoName: 'Tout se passe ici entre vous deux : une histoire que vous écrivez à deux, une question à laquelle vous répondez ensemble, et Bella, qui vous connaît tous les deux.',
  send: 'Envoyer votre lien à {name}',
  sendNoName: 'Envoyer votre lien',
  making: 'Création de votre lien…',
  copied: 'Lien copié. Envoyez-le là où vous vous parlez.',
  shared: 'Envoyé. Cette page s’ouvre dès que l’autre vous rejoint.',
  error: 'Impossible de créer un lien pour l’instant. Réessayez dans un moment.',
  unlock: 'Ce qui s’ouvre quand l’autre vous rejoint',
  cards: [
    { t: 'Une histoire, deux plumes', b: 'Vous écrivez tous les deux. Bella garde chaque page, et s’en souvient.' },
    { t: 'La question du jour', b: 'Vous répondez tous les deux. Aucun ne voit la réponse de l’autre avant d’avoir répondu.' },
    { t: 'Bella, pour vous deux', b: 'Dîners, fleurs et cadeaux, préparés par quelqu’un qui vous connaît.' },
  ],
  surprise: 'Une surprise à préparer d’abord ? Demandez à Bella',
  lookAround: 'Jeter un œil d’abord',
  invitedYou: '{name} vous a invité',
  accept: 'Accepter',
  decline: 'Plus tard',
};

const it: typeof en = {
  title: 'Belluh è per due.',
  sub: 'Qui tutto succede tra te e {name}: una storia che scrivete insieme, una domanda a cui rispondete insieme, e Bella, che vi conosce tutti e due.',
  subNoName: 'Qui tutto succede tra voi due: una storia che scrivete insieme, una domanda a cui rispondete insieme, e Bella, che vi conosce tutti e due.',
  send: 'Manda il tuo link a {name}',
  sendNoName: 'Manda il tuo link',
  making: 'Sto creando il tuo link…',
  copied: 'Link copiato. Mandalo dove vi scrivete di solito.',
  shared: 'Inviato. Questa pagina si apre appena entra.',
  error: 'Non riesco a creare il link adesso. Riprova tra un attimo.',
  unlock: 'Cosa si apre quando entra',
  cards: [
    { t: 'Una storia, due penne', b: 'Scrivete tutti e due. Bella custodisce ogni pagina, e ricorda.' },
    { t: 'La domanda di oggi', b: 'Rispondete tutti e due. Nessuno vede la risposta dell’altro finché non rispondete entrambi.' },
    { t: 'Bella, per tutti e due', b: 'Cene, fiori e regali, pensati da qualcuno che vi conosce.' },
  ],
  surprise: 'Prima vuoi preparare una sorpresa? Chiedi a Bella',
  lookAround: 'Prima dai un’occhiata',
  invitedYou: '{name} ti ha invitato',
  accept: 'Accetta',
  decline: 'Non ora',
};

const pt: typeof en = {
  title: 'O Belluh é para dois.',
  sub: 'Tudo aqui acontece entre você e {name}: uma história que vocês escrevem juntos, uma pergunta que respondem juntos, e a Bella, que conhece vocês dois.',
  subNoName: 'Tudo aqui acontece entre vocês dois: uma história que escrevem juntos, uma pergunta que respondem juntos, e a Bella, que conhece vocês dois.',
  send: 'Mandar seu link para {name}',
  sendNoName: 'Mandar seu link',
  making: 'Criando seu link…',
  copied: 'Link copiado. Mande onde vocês conversam.',
  shared: 'Enviado. Esta página se abre assim que a pessoa entrar.',
  error: 'Não deu para criar o link agora. Tente de novo daqui a pouco.',
  unlock: 'O que se abre quando a pessoa entrar',
  cards: [
    { t: 'Uma história, duas mãos', b: 'Vocês dois escrevem. A Bella guarda cada página, e lembra.' },
    { t: 'A pergunta do dia', b: 'Vocês dois respondem. Ninguém vê a resposta do outro até os dois responderem.' },
    { t: 'A Bella, para vocês dois', b: 'Encontros, flores e presentes, planejados por quem conhece vocês.' },
  ],
  surprise: 'Quer preparar uma surpresa antes? Pergunte à Bella',
  lookAround: 'Dar uma olhada antes',
  invitedYou: '{name} convidou você',
  accept: 'Aceitar',
  decline: 'Agora não',
};

const zh: typeof en = {
  title: 'Belluh，是两个人的。',
  sub: '这里发生的一切，都在你和{name}之间：一起写的一个故事，一起回答的每日一问，还有同时了解你们俩的 Bella。',
  subNoName: '这里发生的一切，都在你们两个人之间：一起写的一个故事，一起回答的每日一问，还有同时了解你们俩的 Bella。',
  send: '把链接发给{name}',
  sendNoName: '发送你的链接',
  making: '正在生成链接…',
  copied: '链接已复制，用你们常聊天的应用发给 TA 吧。',
  shared: '已发送。TA 一加入，这一页就会打开。',
  error: '暂时无法生成链接，请稍后再试。',
  unlock: 'TA 加入后会打开',
  cards: [
    { t: '一个故事，两支笔', b: '你们一起写，Bella 记住每一页。' },
    { t: '每日一问', b: '两个人都回答之后，才能看到对方的答案。' },
    { t: '属于你们俩的 Bella', b: '约会、鲜花和礼物，由了解你们的人来安排。' },
  ],
  surprise: '想先准备一个惊喜？问问 Bella',
  lookAround: '先随便看看',
  invitedYou: '{name}邀请了你',
  accept: '接受',
  decline: '稍后',
};

const de: typeof en = {
  title: 'Belluh ist für zwei.',
  sub: 'Alles hier passiert zwischen dir und {name}: eine Geschichte, die ihr zusammen schreibt, eine Frage, die ihr zusammen beantwortet, und Bella, die euch beide kennt.',
  subNoName: 'Alles hier passiert zwischen euch beiden: eine Geschichte, die ihr zusammen schreibt, eine Frage, die ihr zusammen beantwortet, und Bella, die euch beide kennt.',
  send: 'Schick {name} deinen Link',
  sendNoName: 'Schick deinen Link',
  making: 'Dein Link wird erstellt…',
  copied: 'Link kopiert. Schick ihn dort, wo ihr euch schreibt.',
  shared: 'Gesendet. Diese Seite öffnet sich, sobald die andere Person da ist.',
  error: 'Gerade konnte kein Link erstellt werden. Versuch es gleich noch einmal.',
  unlock: 'Was sich öffnet, wenn die andere Person da ist',
  cards: [
    { t: 'Eine Geschichte, zwei Federn', b: 'Ihr schreibt beide. Bella hebt jede Seite auf und erinnert sich.' },
    { t: 'Die Frage des Tages', b: 'Ihr antwortet beide. Keiner sieht die Antwort des anderen, bis ihr beide geantwortet habt.' },
    { t: 'Bella, für euch beide', b: 'Dates, Blumen und Geschenke, geplant von jemandem, der euch kennt.' },
  ],
  surprise: 'Erst eine Überraschung planen? Frag Bella',
  lookAround: 'Erst mal umsehen',
  invitedYou: '{name} hat dich eingeladen',
  accept: 'Annehmen',
  decline: 'Nicht jetzt',
};

const es: typeof en = {
  title: 'Belluh es para dos.',
  sub: 'Todo aquí pasa entre tú y {name}: una historia que escribís juntos, una pregunta que respondéis juntos, y Bella, que os conoce a los dos.',
  subNoName: 'Todo aquí pasa entre vosotros dos: una historia que escribís juntos, una pregunta que respondéis juntos, y Bella, que os conoce a los dos.',
  send: 'Envía tu enlace a {name}',
  sendNoName: 'Envía tu enlace',
  making: 'Creando tu enlace…',
  copied: 'Enlace copiado. Envíalo por donde habléis.',
  shared: 'Enviado. Esta página se abre en cuanto entre.',
  error: 'Ahora no se pudo crear el enlace. Inténtalo de nuevo en un momento.',
  unlock: 'Lo que se abre cuando entre',
  cards: [
    { t: 'Una historia, dos plumas', b: 'Escribís los dos. Bella guarda cada página, y la recuerda.' },
    { t: 'La pregunta del día', b: 'Respondéis los dos. Nadie ve la respuesta del otro hasta que los dos respondáis.' },
    { t: 'Bella, para los dos', b: 'Citas, flores y regalos, pensados por alguien que os conoce.' },
  ],
  surprise: '¿Quieres preparar una sorpresa antes? Pregúntale a Bella',
  lookAround: 'Echar un vistazo primero',
  invitedYou: '{name} te ha invitado',
  accept: 'Aceptar',
  decline: 'Ahora no',
};

const ko: typeof en = {
  title: 'Belluh는 두 사람을 위한 곳이에요.',
  sub: '여기서 일어나는 모든 일은 당신과 {name} 님 사이의 일이에요. 함께 쓰는 하나의 이야기, 함께 답하는 오늘의 질문, 그리고 두 사람을 모두 아는 Bella.',
  subNoName: '여기서 일어나는 모든 일은 두 사람 사이의 일이에요. 함께 쓰는 하나의 이야기, 함께 답하는 오늘의 질문, 그리고 두 사람을 모두 아는 Bella.',
  send: '{name} 님에게 링크 보내기',
  sendNoName: '링크 보내기',
  making: '링크를 만드는 중…',
  copied: '링크를 복사했어요. 평소 대화하는 앱으로 보내 주세요.',
  shared: '보냈어요. 상대가 들어오면 이 페이지가 열려요.',
  error: '지금은 링크를 만들 수 없어요. 잠시 후 다시 해 주세요.',
  unlock: '상대가 들어오면 열리는 것',
  cards: [
    { t: '하나의 이야기, 두 개의 펜', b: '둘이 함께 쓰고, Bella가 모든 페이지를 기억해요.' },
    { t: '오늘의 질문', b: '둘 다 답하기 전에는 서로의 답을 볼 수 없어요.' },
    { t: '두 사람을 위한 Bella', b: '데이트, 꽃, 선물까지, 두 사람을 아는 누군가가 준비해요.' },
  ],
  surprise: '먼저 깜짝 이벤트를 준비하고 싶나요? Bella에게 물어보기',
  lookAround: '먼저 둘러보기',
  invitedYou: '{name} 님이 초대했어요',
  accept: '수락',
  decline: '나중에',
};

// Mexico: ustedes, not vosotros
const esMX: Partial<typeof en> = {
  sub: 'Todo aquí pasa entre tú y {name}: una historia que escriben juntos, una pregunta que responden juntos, y Bella, que los conoce a los dos.',
  subNoName: 'Todo aquí pasa entre ustedes dos: una historia que escriben juntos, una pregunta que responden juntos, y Bella, que los conoce a los dos.',
  send: 'Mándale tu link a {name}',
  sendNoName: 'Manda tu link',
  making: 'Creando tu link…',
  copied: 'Link copiado. Mándalo por donde platiquen.',
  cards: [
    { t: 'Una historia, dos plumas', b: 'Escriben los dos. Bella guarda cada página, y la recuerda.' },
    { t: 'La pregunta del día', b: 'Responden los dos. Nadie ve la respuesta del otro hasta que los dos respondan.' },
    { t: 'Bella, para los dos', b: 'Citas, flores y regalos, pensados por alguien que los conoce.' },
  ],
  invitedYou: '{name} te invitó',
};

// Portugal: the European forms
const ptPT: Partial<typeof en> = {
  sub: 'Tudo aqui acontece entre si e {name}: uma história que escrevem juntos, uma pergunta a que respondem juntos, e a Bella, que vos conhece aos dois.',
  subNoName: 'Tudo aqui acontece entre vocês os dois: uma história que escrevem juntos, uma pergunta a que respondem juntos, e a Bella, que vos conhece aos dois.',
  send: 'Enviar a sua ligação a {name}',
  sendNoName: 'Enviar a sua ligação',
  making: 'A criar a sua ligação…',
  copied: 'Ligação copiada. Envie-a por onde costumam falar.',
  shared: 'Enviado. Esta página abre-se assim que a pessoa entrar.',
  error: 'Não foi possível criar a ligação agora. Tente novamente daqui a pouco.',
  surprise: 'Quer preparar uma surpresa primeiro? Pergunte à Bella',
  lookAround: 'Espreitar primeiro',
  invitedYou: '{name} convidou-o',
};

const t: UiTable<typeof en> = { en, ja, fr, it, pt, zh, de, es, ko, 'es-MX': esMX, 'pt-PT': ptPT };
export default t;
