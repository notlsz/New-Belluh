// The three-card tour shown the first time someone opens their journal.
import type { UiTable } from '../ui';

const en = {
  progress: 'Step {n} of {total}',
  story: { title: 'Your story', desc: 'Every entry, note and photo the two of you keep lives here, newest first.', where: 'Home' },
  write: { title: 'Write a few lines', desc: 'Tap the plus to write. Keep it to yourself with Just me, or share it with your partner. A minute a day is plenty.', where: 'The plus button' },
  ask: { title: 'Ask Bella', desc: 'Ask anything from the bar on Home. Bella plans dates, remembers the little things, and becomes anything you ask her to.', where: 'Ask Bella, on Home' },
  next: 'Next',
  letsGo: "Let's Go",
};

const introGuide = {
  en,
  ja: {
    progress: 'ステップ {n}/{total}',
    story: { title: 'ふたりの物語', desc: 'ふたりで残した日記、メモ、写真はすべてここに。新しいものから並びます。', where: 'ホーム' },
    write: { title: '少しだけ書いてみる', desc: '＋をタップして書きます。「自分だけ」で自分用にも、パートナーと共有もできます。1日1分で十分です。', where: '＋ボタン' },
    ask: { title: 'Bellaに聞いてみる', desc: 'ホームのバーから、なんでも聞いてください。デートの計画も、ささいなことの記憶も、Bellaにおまかせ。頼めばなんにでも変身します。', where: 'ホームの「Bellaに聞く」' },
    next: '次へ',
    letsGo: 'はじめる',
  },
  fr: {
    progress: 'Étape {n} sur {total}',
    story: { title: 'Votre histoire', desc: 'Chaque note, chaque mot et chaque photo que vous gardez à deux vit ici, du plus récent au plus ancien.', where: 'Accueil' },
    write: { title: 'Écris quelques lignes', desc: 'Touche le plus pour écrire. Garde-le pour toi avec Rien que moi, ou partage-le avec ta moitié. Une minute par jour suffit.', where: 'Le bouton plus' },
    ask: { title: 'Demande à Bella', desc: 'Demande ce que tu veux depuis la barre de l’accueil. Bella organise vos sorties, se souvient des petits détails et devient tout ce que tu lui demandes.', where: 'Demander à Bella, sur l’accueil' },
    next: 'Suivant',
    letsGo: 'C’est parti',
  },
  it: {
    progress: 'Passo {n} di {total}',
    story: { title: 'La vostra storia', desc: 'Ogni pagina, nota e foto che conservate insieme vive qui, dalla più recente.', where: 'Home' },
    write: { title: 'Scrivi due righe', desc: 'Tocca il più per scrivere. Tienila per te con Solo per me, o condividila con la tua metà. Basta un minuto al giorno.', where: 'Il pulsante più' },
    ask: { title: 'Chiedi a Bella', desc: 'Chiedi qualsiasi cosa dalla barra in Home. Bella organizza le vostre uscite, si ricorda le piccole cose e diventa tutto quello che le chiedi.', where: 'Chiedi a Bella, in Home' },
    next: 'Avanti',
    letsGo: 'Andiamo',
  },
  pt: {
    progress: 'Etapa {n} de {total}',
    story: { title: 'A história de vocês', desc: 'Cada registro, nota e foto que vocês guardam fica aqui, do mais recente para o mais antigo.', where: 'Início' },
    write: { title: 'Escreva umas linhas', desc: 'Toque no mais para escrever. Guarde só pra você com Só eu ou compartilhe com seu amor. Um minutinho por dia já basta.', where: 'O botão de mais' },
    ask: { title: 'Pergunte à Bella', desc: 'Pergunte qualquer coisa na barra do Início. A Bella planeja encontros, lembra dos detalhes e vira o que você pedir.', where: 'Pergunte à Bella, no Início' },
    next: 'Próximo',
    letsGo: 'Vamos lá',
  },
  zh: {
    progress: '第 {n} 步，共 {total} 步',
    story: { title: '你们的故事', desc: '你们俩留下的每篇日记、每条笔记和每张照片都在这里，最新的排在最前面。', where: '首页' },
    write: { title: '写几句', desc: '点加号开始写。可以选“仅自己”，也可以和另一半共享。每天一分钟就够了。', where: '加号按钮' },
    ask: { title: '问问 Bella', desc: '在首页的输入栏里随便问。Bella 会帮你们安排约会，记住那些小事，你让她变成什么，她就变成什么。', where: '首页的“问问 Bella”' },
    next: '下一步',
    letsGo: '开始吧',
  },
  de: {
    progress: 'Schritt {n} von {total}',
    story: { title: 'Eure Geschichte', desc: 'Jeder Eintrag, jede Notiz und jedes Foto von euch beiden lebt hier, das Neueste zuerst.', where: 'Start' },
    write: { title: 'Schreib ein paar Zeilen', desc: 'Tipp aufs Plus, um zu schreiben. Behalt es mit Nur ich für dich oder teil es mit deinem Schatz. Eine Minute am Tag reicht.', where: 'Der Plus-Button' },
    ask: { title: 'Frag Bella', desc: 'Frag alles über die Leiste auf der Startseite. Bella plant Dates, merkt sich die kleinen Dinge und verwandelt sich in alles, was du dir wünschst.', where: 'Frag Bella, auf der Startseite' },
    next: 'Weiter',
    letsGo: 'Los geht’s',
  },
  es: {
    progress: 'Paso {n} de {total}',
    story: { title: 'Vuestra historia', desc: 'Cada entrada, nota y foto que guardáis los dos vive aquí, de la más reciente a la más antigua.', where: 'Inicio' },
    write: { title: 'Escribe unas líneas', desc: 'Toca el más para escribir. Guárdalo para ti con Solo yo o compártelo con tu pareja. Con un minuto al día basta.', where: 'El botón más' },
    ask: { title: 'Pregúntale a Bella', desc: 'Pregunta lo que quieras desde la barra de Inicio. Bella planea citas, se acuerda de los detalles y se convierte en lo que le pidas.', where: 'Pregúntale a Bella, en Inicio' },
    next: 'Siguiente',
    letsGo: '¡Vamos!',
  },
  'es-MX': {
    story: { title: 'Su historia', desc: 'Cada entrada, nota y foto que guardan los dos vive aquí, de la más reciente a la más antigua.', where: 'Inicio' },
    letsGo: '¡Va!',
  },
  'pt-PT': {
    progress: 'Passo {n} de {total}',
    story: { title: 'A vossa história', desc: 'Cada entrada, nota e fotografia que os dois guardam fica aqui, da mais recente para a mais antiga.', where: 'Início' },
    write: { title: 'Escreve umas linhas', desc: 'Toca no mais para escrever. Guarda só para ti com Só eu ou partilha com a tua cara-metade. Um minuto por dia chega.', where: 'O botão mais' },
    ask: { title: 'Pergunta à Bella', desc: 'Pergunta o que quiseres na barra do Início. A Bella planeia encontros, lembra-se das pequenas coisas e transforma-se no que lhe pedires.', where: 'Pergunta à Bella, no Início' },
    next: 'Seguinte',
    letsGo: 'Vamos lá',
  },
} satisfies UiTable<typeof en>;

export default introGuide;
