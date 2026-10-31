// The old belluh.com's strongest points, brought back honestly: "Love, understood.", the weekly insight, and three
// abilities (patterns, a private safe haven, a voice that learns you). No invented testimonials or numbers.
import type { UiTable } from '../ui';

const en = {
  title: 'Love, understood.',
  sub: 'Belluh turns a thousand small moments into a clear picture of your life together.',
  insightLabel: 'Weekly insight',
  insight: '“You go quiet when things get hard. This week, you chose words instead.”',
  insightFrom: 'From 14 entries you both shared',
  abilities: [
    { title: 'It sees what you might miss.', body: 'The rhythm under your days: when you pull away, what brings you back, what each of you needs when it’s hard. Bella notices, gently.' },
    { title: 'Your safe haven.', body: 'Private entries stay yours: never shown to your partner and encrypted at rest. Share only what you choose.' },
    { title: 'It learns you.', body: 'Spare and short or long and searching, Bella writes back in your voice, and drafts notes that sound like you.' },
  ],
};

const es = {
  title: 'El amor, entendido.',
  sub: 'Belluh convierte mil pequeños momentos en una imagen clara de vuestra vida juntos.',
  insightLabel: 'Lo de esta semana',
  insight: '“Cuando las cosas se ponen difíciles, te callas. Esta semana, elegiste hablar.”',
  insightFrom: 'De 14 entradas que compartisteis',
  abilities: [
    { title: 'Ve lo que se te escapa.', body: 'El ritmo bajo vuestros días: cuándo te alejas, qué os vuelve a unir, qué necesita cada uno cuando cuesta. Bella se da cuenta, con cuidado.' },
    { title: 'Tu refugio.', body: 'Tus entradas privadas son tuyas: tu pareja nunca las ve y se guardan cifradas. Compartes solo lo que quieres.' },
    { title: 'Aprende cómo eres.', body: 'Breve y directo o largo y pensativo, Bella te responde con tu voz y te prepara mensajes que suenan a ti.' },
  ],
};

const understood: UiTable<typeof en> = {
  en,
  ja: {
    title: '愛を、わかってくれる。',
    sub: 'Belluhは、たくさんの小さな瞬間を、ふたりの暮らしのはっきりした姿に変えていきます。',
    insightLabel: '今週の気づき',
    insight: '「つらいとき、あなたは黙りがち。でも今週は、言葉を選びましたね。」',
    insightFrom: 'ふたりが共有した14件の日記から',
    abilities: [
      { title: '見落としがちなことに、気づく。', body: '距離ができるとき、また近づくきっかけ、つらいときにそれぞれが必要なもの。日々の奥にあるリズムに、Bellaはそっと気づきます。' },
      { title: 'あなたの、安心できる場所。', body: '非公開の日記はあなただけのもの。相手に見せることはなく、暗号化して保管します。共有するのは、選んだものだけ。' },
      { title: 'あなたを、知っていく。', body: '短くさらりとでも、長くじっくりでも。Bellaはあなたの言葉づかいで返し、あなたらしいメッセージを下書きします。' },
    ],
  },
  fr: {
    title: 'L’amour, compris.',
    sub: 'Belluh fait de mille petits moments une image claire de votre vie à deux.',
    insightLabel: 'Ce qui ressort cette semaine',
    insight: '« Quand ça devient dur, tu te tais. Cette semaine, tu as choisi les mots. »',
    insightFrom: 'D’après 14 notes que vous avez partagées',
    abilities: [
      { title: 'Elle voit ce qui pourrait t’échapper.', body: 'Le rythme sous vos journées : quand tu t’éloignes, ce qui vous rapproche, ce dont chacun a besoin quand c’est dur. Bella le remarque, doucement.' },
      { title: 'Ton refuge.', body: 'Tes notes privées restent à toi : jamais montrées à l’autre et chiffrées au repos. Tu partages seulement ce que tu choisis.' },
      { title: 'Elle apprend qui tu es.', body: 'Bref et sobre ou long et introspectif, Bella te répond avec ta voix et rédige des mots qui te ressemblent.' },
    ],
  },
  it: {
    title: 'L’amore, capito.',
    sub: 'Belluh trasforma mille piccoli momenti in un quadro chiaro della vostra vita insieme.',
    insightLabel: 'Lo spunto della settimana',
    insight: '“Quando le cose si fanno difficili, ti chiudi nel silenzio. Questa settimana hai scelto le parole.”',
    insightFrom: 'Da 14 pagine che avete condiviso',
    abilities: [
      { title: 'Vede quello che potresti non notare.', body: 'Il ritmo sotto le vostre giornate: quando ti allontani, cosa vi riavvicina, di cosa ha bisogno ciascuno quando è dura. Bella se ne accorge, con delicatezza.' },
      { title: 'Il tuo rifugio.', body: 'Le pagine private restano tue: mai mostrate all’altra persona e cifrate quando sono salvate. Condividi solo ciò che scegli.' },
      { title: 'Impara chi sei.', body: 'Breve e asciutto o lungo e riflessivo, Bella ti risponde con la tua voce e scrive messaggi che suonano come te.' },
    ],
  },
  pt: {
    title: 'O amor, entendido.',
    sub: 'O Belluh transforma mil pequenos momentos num retrato claro da vida de vocês juntos.',
    insightLabel: 'O destaque da semana',
    insight: '“Quando as coisas ficam difíceis, você se cala. Esta semana, você escolheu as palavras.”',
    insightFrom: 'A partir de 14 registros que vocês compartilharam',
    abilities: [
      { title: 'Ela vê o que passa batido.', body: 'O ritmo por trás dos dias: quando você se afasta, o que aproxima vocês de novo, do que cada um precisa quando está difícil. A Bella percebe, com carinho.' },
      { title: 'Seu porto seguro.', body: 'Os registros privados são só seus: nunca aparecem pro seu amor e ficam criptografados. Você compartilha só o que quiser.' },
      { title: 'Ela aprende quem você é.', body: 'Curto e direto ou longo e reflexivo, a Bella responde no seu jeito de escrever e rascunha recados com a sua cara.' },
    ],
  },
  zh: {
    title: '爱，被读懂。',
    sub: 'Belluh 把无数个小瞬间，拼成你们共同生活的清晰模样。',
    insightLabel: '本周发现',
    insight: '“遇到难事，你总是沉默。但这周，你选择了开口。”',
    insightFrom: '来自你们共同分享的 14 篇日记',
    abilities: [
      { title: '看见你可能忽略的。', body: '日子底下的节奏：你什么时候会退开，什么让你们重新靠近，难的时候各自需要什么。Bella 会温柔地察觉。' },
      { title: '你的避风港。', body: '私密日记只属于你：不会给对方看，存储时全程加密。分享什么，由你决定。' },
      { title: '它会懂你。', body: '无论简短利落还是长篇细腻，Bella 都用你的语气回应，帮你写出像你自己说的话。' },
    ],
  },
  de: {
    title: 'Liebe, verstanden.',
    sub: 'Belluh macht aus tausend kleinen Momenten ein klares Bild eures gemeinsamen Lebens.',
    insightLabel: 'Erkenntnis der Woche',
    insight: '«Wenn es schwierig wird, wirst du still. Diese Woche hast du Worte gewählt.»',
    insightFrom: 'Aus 14 Einträgen, die ihr geteilt habt',
    abilities: [
      { title: 'Sie sieht, was dir entgehen könnte.', body: 'Der Rhythmus unter euren Tagen: wann du dich zurückziehst, was euch zurückbringt, was jeder braucht, wenn es schwer ist. Bella merkt es, behutsam.' },
      { title: 'Dein sicherer Ort.', body: 'Private Einträge bleiben deine: nie für deinen Schatz sichtbar und verschlüsselt gespeichert. Du teilst nur, was du willst.' },
      { title: 'Sie lernt dich kennen.', body: 'Knapp und schlicht oder lang und suchend: Bella antwortet in deiner Sprache und entwirft Nachrichten, die nach dir klingen.' },
    ],
  },
  es,
  'es-MX': {
    sub: 'Belluh convierte mil pequeños momentos en una imagen clara de su vida juntos.',
    insightFrom: 'De 14 entradas que compartieron',
    abilities: [
      { title: 'Ve lo que se te escapa.', body: 'El ritmo detrás de sus días: cuándo te alejas, qué los vuelve a unir, qué necesita cada quien cuando está difícil. Bella se da cuenta, con cuidado.' },
      es.abilities[1],
      es.abilities[2],
    ],
  },
  'pt-PT': {
    title: 'O amor, compreendido.',
    sub: 'O Belluh transforma mil pequenos momentos num retrato claro da vossa vida a dois.',
    insightLabel: 'O destaque da semana',
    insight: '“Quando as coisas ficam difíceis, ficas calado. Esta semana, escolheste as palavras.”',
    insightFrom: 'A partir de 14 registos que partilharam',
    abilities: [
      { title: 'Vê o que te pode escapar.', body: 'O ritmo por trás dos dias: quando te afastas, o que vos volta a aproximar, do que cada um precisa quando custa. A Bella repara, com cuidado.' },
      { title: 'O teu porto de abrigo.', body: 'Os registos privados são teus: nunca aparecem à tua cara-metade e ficam encriptados. Partilhas só o que quiseres.' },
      { title: 'Aprende quem és.', body: 'Curto e direto ou longo e reflexivo, a Bella responde à tua maneira e prepara mensagens que soam a ti.' },
    ],
  },
};

export default understood;
