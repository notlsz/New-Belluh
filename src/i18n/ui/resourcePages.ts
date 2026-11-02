// The words on the pages behind the footer (src/pages/company/Resources.tsx): newsroom, stories, contact, safety,
// how Belluh works, NFAQ, privacy choices and accessibility. Security, cookies and consumer health data are legal pages
// now (src/pages/company/LegalPage.tsx, words in legalPages.ts). Routes, email addresses and files stay in the page; only the words live here. Each part's `links`
// holds the labels of its links that aren't an email address, in order. Policy pages are translated faithfully: no
// claim added or removed. {date} is filled with a date written the reader's way.
import type { UiTable } from '../ui';

export type PartT = { h?: string; p?: string[]; list?: string[]; links?: string[] };
export type DocT = { eyebrow: string; title: string; lede: string; parts: PartT[]; cta?: string };
export type Slug = 'newsroom' | 'stories' | 'contact' | 'safety-tips' | 'how-belluh-works' | 'nfaq' | 'privacy-choices' | 'accessibility';
type Subjects = { story: string; help: string; privacy: string; data: string; optOut: string; accessibility: string };
type T = { updated: string; closing: string; subjects: Subjects; docs: Record<Slug, DocT> };

const en: T = {
  updated: 'Last updated {date}',
  closing: 'This page explains how things work in plain words. The {privacy} and {terms} govern.',
  subjects: { story: 'Our Belluh story', help: 'Help', privacy: 'Privacy request', data: 'Data request', optOut: 'Opt-out request', accessibility: 'Accessibility' },
  docs: {
    newsroom: {
      eyebrow: 'Newsroom', title: 'What’s new at Belluh.', lede: 'Product news and announcements, newest first. For interviews and press questions, see Press resources.',
      parts: [
        { h: '{date}: Your profile, your way', p: ['Profiles became a blank canvas. Record Your Face, a few looping seconds of you cut out from the background, and use it as your picture. Add songs, books, movies, voice notes, drawings, shapes and stickers anywhere, with decorations and effects that move.'] },
        { h: '{date}: Belluh Research', p: ['We published the science behind Belluh: what we study, how we work, and six peer-reviewed studies on what keeps couples close.'], links: ['Visit Belluh Research'] },
        { h: '{date}: Guides worth sharing', p: ['Couples can turn the places they love into guides, kept private, shared with friends by link, or posted for every couple.'] },
        { h: '{date}: Your love map', p: ['Every memory pinned where it happened, on a map that zooms all the way out to the planets.'] },
      ],
      cta: 'Press resources',
    },
    stories: {
      eyebrow: 'Success stories', title: 'Did Belluh help your love last?', lede: 'The anniversary you almost forgot and didn’t. The date that turned into a tradition. The note that said the right thing. We’d love to hear it.',
      parts: [
        { h: 'Tell us your story', p: ['Write to us with your names (first names are fine), how long you’ve been together, and the moment Belluh was part of. Photos are welcome.', 'We will always ask both of you before we share anything, and we never share a story without your permission.'] },
      ],
      cta: 'Share your story',
    },
    contact: {
      eyebrow: 'Contact', title: 'Talk to a human.', lede: 'Belluh is a small team. Write to us and a person will read it.',
      parts: [
        { h: 'Help with the app', p: ['Ask Bella first: she knows how everything works. If she can’t help, write to us.'] },
        { h: 'Privacy and your data', p: ['Requests to see, download, correct or delete your data.'] },
        { h: 'Press, partnerships and careers', links: ['Press resources', 'Belluh Together', 'Careers'] },
      ],
    },
    'safety-tips': {
      eyebrow: 'Safety', title: 'Love should feel safe.', lede: 'Belluh is for keeping love close. Here is what healthy looks like, what doesn’t, and where to turn.',
      parts: [
        { h: 'Healthy looks like', list: ['You can say no, and it is respected.', 'You keep your own friends, money, phone and time.', 'Disagreements end without fear.', 'You both feel free to be yourselves.'] },
        { h: 'Warning signs', list: ['Checking your phone, location or messages without asking.', 'Cutting you off from friends or family.', 'Controlling money, or what you wear or do.', 'Threats, put-downs, or making you afraid.'] },
        { h: 'Your Belluh, your boundaries', p: ['Every entry is shared or private, your call. Your partner never sees your private entries. You can leave a circle at any time.'] },
        { h: 'Get help now', p: ['If you are in danger, call your local emergency number. In the U.S., call 911.', 'National Domestic Violence Hotline (U.S.): call 1-800-799-7233 or text START to 88788. It is free and confidential, any time.', '988 Suicide & Crisis Lifeline (U.S.): call or text 988.', 'Outside the U.S., your local emergency number and local support services can help.'] },
      ],
    },
    'how-belluh-works': {
      eyebrow: 'How Belluh works', title: 'How Bella helps you stay close.', lede: 'No magic, no mystery. Here is what Bella looks at, and what she does with it.',
      parts: [
        { h: 'What Bella knows', p: ['Only what you give Belluh: what you write in your journal, the dates and details you save, and your calendar if you connect it. Your private entries stay private, even from Bella when she talks with your partner.'] },
        { h: 'What Bella does with it', list: ['Remembers the details, like their coffee order or the restaurant from your third date.', 'Reminds you before birthdays and anniversaries.', 'Suggests plans and dates your partner can accept with one tap.', 'Every Sunday, gives you one insight and one small thing to try together.'] },
        { h: 'You decide', p: ['Bella suggests. You choose. Say no to a plan and she learns what you like.'] },
        { h: 'Grounded in research', p: ['What Bella suggests is built on decades of relationship science.'], links: ['Visit Belluh Research'] },
      ],
    },
    nfaq: {
      eyebrow: 'NFAQ', title: 'Not-so frequently asked questions.', lede: 'Things nobody asks, answered anyway.',
      parts: [
        { h: 'Why is the logo a dragonfly?', p: ['Dragonflies are light, quick, and turn up when the day is warm. That’s the feeling we want Belluh to leave behind.'] },
        { h: 'Who is Bella?', p: ['Bella is Belluh’s AI. She remembers what you’d forget, plans what you’d put off, and never takes sides. Her name comes from a very special person.', 'Fun fact: “Belluh” is a playful twist on the sounds of the word “bella”.'] },
        { h: 'Can Bella settle who’s right?', p: ['No. She never takes sides. She might suggest dinner, though.'] },
        { h: 'Does Belluh work if we live in different time zones?', p: ['Yes. Belluh keeps each of your time zones, so reminders land at the right hour for both of you.'] },
        { h: 'What’s the most romantic thing Belluh can do?', p: ['Remember something your partner said once, months ago, at exactly the right moment.'] },
      ],
    },
    'privacy-choices': {
      eyebrow: 'Your privacy choices', title: 'Your data, your choices.', lede: 'What you can do with your information, and how.',
      parts: [
        { h: 'Choose what’s shared', p: ['Every entry is shared or private, your call. Guides can be private, shared by link, or posted for everyone, and you can change that at any time.'] },
        { h: 'See, download, correct or delete', p: ['You can ask for a copy of your journal entries, photos and relationship data, ask us to correct it, or ask us to delete your account and data. We respond within 30 days of verifying it’s you.'], links: ['Make a request'] },
        { h: 'Opt out', p: ['If you don’t want us to use your information for a purpose the law lets you opt out of, tell us and we will honor it.'], links: ['Opt out'] },
      ],
    },
    accessibility: {
      eyebrow: 'Accessibility statement', title: 'Belluh, for everyone.', lede: 'Love isn’t only for people who can use a mouse. We want Belluh to work for every couple.',
      parts: [
        { h: 'What we do', list: ['Respect your device’s reduced-motion setting: animations and effects stop.', 'Label buttons and images for screen readers.', 'Work with a keyboard, and close menus and dialogs with Escape.', 'Speak nine languages, in local formats.'] },
        { h: 'Our aim', p: ['We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. We’re not perfect yet, and we’re working on it.'] },
        { h: 'Tell us', p: ['If something in Belluh is hard to use, please tell us. We read every note.'], links: ['Report an accessibility problem'] },
      ],
    },
  },
};

const ja: T = {
  updated: '最終更新日：{date}',
  closing: 'このページは、しくみをわかりやすい言葉で説明したものです。正式な内容は{privacy}と{terms}に定めています。',
  subjects: { story: 'わたしたちのBelluhストーリー', help: 'ヘルプ', privacy: 'プライバシーに関するリクエスト', data: 'データに関するリクエスト', optOut: 'オプトアウトのリクエスト', accessibility: 'アクセシビリティ' },
  docs: {
    newsroom: {
      eyebrow: 'ニュース', title: 'Belluhの最新情報。', lede: 'プロダクトのニュースとお知らせを、新しい順に。取材やメディアからのご質問は、プレス向け情報をご覧ください。',
      parts: [
        { h: '{date}：プロフィールを、自分らしく', p: ['プロフィールが真っ白なキャンバスになりました。「Your Face」で背景から切り抜いた数秒のループ動画を撮って、プロフィール写真に。好きな曲や本、映画、ボイスメモ、イラスト、図形、ステッカーをどこにでも置けて、動く装飾やエフェクトも使えます。'] },
        { h: '{date}：Belluh Research', p: ['Belluhを支える科学を公開しました。わたしたちが何を研究し、どう取り組んでいるのか。そして、カップルが近くにいられる理由を探った査読付きの研究6本です。'], links: ['Belluh Researchを見る'] },
        { h: '{date}：シェアしたくなるガイド', p: ['お気に入りの場所をガイドにまとめられるようになりました。ふたりだけのものにしても、リンクで友だちに共有しても、すべてのカップルに公開してもOKです。'] },
        { h: '{date}：ふたりのラブマップ', p: ['思い出をその場所にピン留め。地図はどこまでもズームアウトして、惑星まで見渡せます。'] },
      ],
      cta: 'プレス向け情報',
    },
    stories: {
      eyebrow: 'カップルの声', title: 'Belluhは、ふたりの愛を長続きさせましたか？', lede: '忘れかけて、でも忘れなかった記念日。いつのまにか恒例になったデート。ちょうどいい言葉が書けたメモ。ぜひ聞かせてください。',
      parts: [
        { h: 'ふたりのストーリーを教えてください', p: ['おふたりのお名前（下の名前だけで大丈夫です）、付き合ってどれくらいか、そしてBelluhが関わった瞬間を書いて送ってください。写真も大歓迎です。', '何かを紹介する前には必ずおふたりに確認します。許可なくストーリーを公開することはありません。'] },
      ],
      cta: 'ストーリーを送る',
    },
    contact: {
      eyebrow: 'お問い合わせ', title: '人が、ちゃんと読みます。', lede: 'Belluhは小さなチームです。メールをいただければ、スタッフが一通ずつ目を通します。',
      parts: [
        { h: 'アプリについて', p: ['まずはBellaに聞いてみてください。使い方はなんでも知っています。それでも解決しなければ、メールでご連絡ください。'] },
        { h: 'プライバシーとデータ', p: ['ご自身のデータの確認、ダウンロード、訂正、削除のご依頼はこちらへ。'] },
        { h: '取材、提携、採用', links: ['プレス向け情報', 'Belluh Together', '採用'] },
      ],
    },
    'safety-tips': {
      eyebrow: '安全のために', title: '愛は、安心できるものであるべきです。', lede: 'Belluhは、愛を近くに保つためのものです。健全な関係とはどんなものか、そうでないサインは何か、困ったときにどこへ相談すればいいかをまとめました。',
      parts: [
        { h: '健全な関係とは', list: ['「いや」と言えて、それが尊重される。', '自分の友だち、お金、スマホ、時間を自分のものとして持てる。', 'けんかをしても、怖い思いをせずに終われる。', 'おたがいが自分らしくいられる。'] },
        { h: '注意したいサイン', list: ['断りなくスマホや位置情報、メッセージをチェックする。', '友だちや家族から引き離そうとする。', 'お金や、服装、行動をコントロールしようとする。', '脅す、見下す、怖がらせる。'] },
        { h: 'あなたのBelluh、あなたの境界線', p: ['どの投稿も、共有するか非公開にするかはあなたが決められます。非公開の投稿がパートナーに見られることはありません。サークルはいつでも抜けられます。'] },
        { h: '今すぐ助けが必要なとき', p: ['危険を感じたら、お住まいの地域の緊急通報番号に電話してください（日本では警察は110番、救急は119番）。米国では911番です。', '全米DVホットライン（米国）：1-800-799-7233に電話するか、88788にSTARTとテキストを送信。24時間無料で、秘密は守られます。', '988 自殺・危機ライフライン（米国）：988に電話またはテキスト。', '米国外では、お住まいの地域の緊急通報番号や地元の支援窓口が力になってくれます。'] },
      ],
    },
    'how-belluh-works': {
      eyebrow: 'Belluhのしくみ', title: 'Bellaが、ふたりの距離を近づけるしくみ。', lede: '魔法も、秘密もありません。Bellaが何を見て、それをどう使うのかをご説明します。',
      parts: [
        { h: 'Bellaが知っていること', p: ['あなたがBelluhに渡したものだけです。ジャーナルに書いたこと、保存した日付や詳細、そして連携した場合はカレンダー。非公開の投稿は、Bellaがパートナーと話すときにも非公開のままです。'] },
        { h: 'Bellaがすること', list: ['相手のコーヒーの好みや、3回目のデートで行ったレストランなど、細かなことを覚えておく。', '誕生日や記念日の前にリマインドする。', 'パートナーがワンタップで受けられるプランやデートを提案する。', '毎週日曜日に、ひとつの気づきと、ふたりで試せる小さなことをひとつ届ける。'] },
        { h: '決めるのは、あなた', p: ['Bellaは提案するだけ。選ぶのはあなたです。プランを断れば、Bellaはあなたの好みを学んでいきます。'] },
        { h: '研究にもとづいて', p: ['Bellaの提案は、何十年にもわたる関係性の科学にもとづいています。'], links: ['Belluh Researchを見る'] },
      ],
    },
    nfaq: {
      eyebrow: 'めったにない質問', title: 'めったに聞かれない質問。', lede: '誰も聞かないけれど、答えておきます。',
      parts: [
        { h: 'ロゴはなぜトンボなの？', p: ['トンボは軽やかで、すばしこくて、あたたかい日に姿を見せます。Belluhが残したいのは、そんな気持ちです。'] },
        { h: 'Bellaって誰？', p: ['BellaはBelluhのAIです。あなたが忘れそうなことを覚えていて、後回しにしそうなことを計画してくれて、どちらの味方にもつきません。名前は、ある特別な人に由来しています。', 'ちなみに「Belluh」という名前は、「bella」という言葉の響きを遊び心たっぷりにアレンジしたものです。'] },
        { h: 'どっちが正しいか、Bellaに決めてもらえる？', p: ['いいえ。Bellaはどちらの味方にもつきません。ただ、晩ごはんを提案してくれるかもしれません。'] },
        { h: '住んでいるタイムゾーンが違っても使える？', p: ['はい。Belluhはそれぞれのタイムゾーンを覚えているので、リマインダーはふたりにとってちょうどいい時間に届きます。'] },
        { h: 'Belluhにできる、いちばんロマンチックなことは？', p: ['何か月も前にパートナーが一度だけ口にしたことを、ここぞというタイミングで思い出させること。'] },
      ],
    },
    'privacy-choices': {
      eyebrow: 'プライバシーの選択', title: 'あなたのデータは、あなたが選ぶ。', lede: 'ご自身の情報についてできることと、その方法。',
      parts: [
        { h: '共有するものを選ぶ', p: ['どの投稿も、共有するか非公開にするかはあなたが決められます。ガイドは非公開、リンクで共有、全員に公開から選べ、いつでも変更できます。'] },
        { h: '確認、ダウンロード、訂正、削除', p: ['ジャーナルの投稿、写真、関係に関するデータの写しを請求すること、その訂正を求めること、アカウントとデータの削除を求めることができます。ご本人であることを確認してから30日以内に対応します。'], links: ['リクエストする'] },
        { h: 'オプトアウト', p: ['法律でオプトアウトが認められている目的について、当社に情報を使ってほしくない場合は、お知らせください。その意思を尊重します。'], links: ['オプトアウトする'] },
      ],
    },
    accessibility: {
      eyebrow: 'アクセシビリティ方針', title: 'Belluhを、すべての人に。', lede: '愛は、マウスを使える人だけのものではありません。Belluhがすべてのカップルにとって使いやすいものであってほしいと考えています。',
      parts: [
        { h: '取り組んでいること', list: ['端末の「視差効果を減らす」設定を尊重し、アニメーションやエフェクトを止めます。', 'ボタンや画像にスクリーンリーダー用のラベルを付けています。', 'キーボードで操作でき、メニューやダイアログはEscキーで閉じられます。', '9つの言語に対応し、各地域の表記に合わせています。'] },
        { h: '目標', p: ['Web Content Accessibility Guidelines（WCAG）2.2のレベルAAへの準拠を目指しています。まだ完璧ではありませんが、改善を続けています。'] },
        { h: 'お知らせください', p: ['Belluhで使いにくいところがあれば、ぜひ教えてください。いただいた声はすべて読んでいます。'], links: ['アクセシビリティの問題を報告する'] },
      ],
    },
  },
};

const fr: T = {
  updated: 'Dernière mise à jour : {date}',
  closing: 'Cette page explique simplement comment les choses fonctionnent. Ce sont la {privacy} et les {terms} qui font foi.',
  subjects: { story: 'Notre histoire avec Belluh', help: 'Aide', privacy: 'Demande relative à la vie privée', data: 'Demande relative aux données', optOut: 'Demande d’opposition', accessibility: 'Accessibilité' },
  docs: {
    newsroom: {
      eyebrow: 'Actualités', title: 'Les nouveautés de Belluh.', lede: 'Annonces et nouveautés produit, des plus récentes aux plus anciennes. Pour une interview ou une question de presse, consulte l’Espace presse.',
      parts: [
        { h: '{date} : ton profil, à ta façon', p: ['Les profils sont devenus une toile blanche. Enregistre Your Face, quelques secondes de toi en boucle, détourées du décor, et fais-en ta photo. Ajoute où tu veux des chansons, des livres, des films, des notes vocales, des dessins, des formes et des stickers, avec des décorations et des effets animés.'] },
        { h: '{date} : Belluh Research', p: ['Nous avons publié la science derrière Belluh : ce que nous étudions, notre façon de travailler, et six études évaluées par des pairs sur ce qui rapproche les couples.'], links: ['Découvrir Belluh Research'] },
        { h: '{date} : des guides à partager', p: ['Les couples peuvent transformer leurs lieux préférés en guides, gardés pour eux, partagés avec des amis par lien, ou publiés pour tous les couples.'] },
        { h: '{date} : votre carte de l’amour', p: ['Chaque souvenir épinglé là où il a eu lieu, sur une carte qui dézoome jusqu’aux planètes.'] },
      ],
      cta: 'Espace presse',
    },
    stories: {
      eyebrow: 'Vos histoires', title: 'Belluh a aidé votre amour à durer ?', lede: 'L’anniversaire que vous avez failli oublier, et que vous n’avez pas oublié. Le rendez-vous devenu une tradition. Le mot qui disait exactement ce qu’il fallait. On adorerait l’entendre.',
      parts: [
        { h: 'Racontez-nous votre histoire', p: ['Écrivez-nous avec vos prénoms (les prénoms suffisent), depuis combien de temps vous êtes ensemble, et le moment où Belluh a compté. Les photos sont les bienvenues.', 'Nous vous demanderons toujours votre accord à tous les deux avant de partager quoi que ce soit, et nous ne partageons jamais une histoire sans votre permission.'] },
      ],
      cta: 'Partager votre histoire',
    },
    contact: {
      eyebrow: 'Contact', title: 'Parle à un humain.', lede: 'Belluh est une petite équipe. Écris-nous et une vraie personne te lira.',
      parts: [
        { h: 'Aide avec l’app', p: ['Demande d’abord à Bella : elle sait comment tout fonctionne. Si elle ne peut pas t’aider, écris-nous.'] },
        { h: 'Vie privée et données', p: ['Pour consulter, télécharger, corriger ou supprimer tes données.'] },
        { h: 'Presse, partenariats et carrières', links: ['Espace presse', 'Belluh Together', 'Carrières'] },
      ],
    },
    'safety-tips': {
      eyebrow: 'Sécurité', title: 'L’amour doit être un endroit sûr.', lede: 'Belluh sert à garder l’amour proche. Voici à quoi ressemble une relation saine, ce qui ne l’est pas, et vers qui te tourner.',
      parts: [
        { h: 'Une relation saine, c’est', list: ['Tu peux dire non, et c’est respecté.', 'Tu gardes tes amis, ton argent, ton téléphone et ton temps.', 'Les désaccords se terminent sans peur.', 'Vous vous sentez libres d’être vous-mêmes.'] },
        { h: 'Signaux d’alerte', list: ['Fouiller ton téléphone, ta localisation ou tes messages sans demander.', 'T’éloigner de tes amis ou de ta famille.', 'Contrôler ton argent, ou ce que tu portes ou fais.', 'Menaces, rabaissements, ou te faire peur.'] },
        { h: 'Ton Belluh, tes limites', p: ['Chaque entrée est partagée ou privée, c’est toi qui choisis. Ton ou ta partenaire ne voit jamais tes entrées privées. Tu peux quitter un cercle à tout moment.'] },
        { h: 'Obtenir de l’aide maintenant', p: ['Si tu es en danger, appelle le numéro d’urgence de ton pays (en Europe, le 112). Aux États-Unis, appelle le 911.', 'National Domestic Violence Hotline (États-Unis) : appelle le 1-800-799-7233 ou envoie START par SMS au 88788. Gratuit et confidentiel, à toute heure.', '988 Suicide & Crisis Lifeline (États-Unis) : appelle ou envoie un SMS au 988.', 'Hors des États-Unis, le numéro d’urgence de ton pays et les services d’aide locaux peuvent t’aider.'] },
      ],
    },
    'how-belluh-works': {
      eyebrow: 'Comment ça marche', title: 'Comment Bella vous aide à rester proches.', lede: 'Pas de magie, pas de mystère. Voici ce que Bella regarde, et ce qu’elle en fait.',
      parts: [
        { h: 'Ce que Bella sait', p: ['Seulement ce que tu donnes à Belluh : ce que tu écris dans ton journal, les dates et les détails que tu enregistres, et ton agenda si tu le connectes. Tes entrées privées restent privées, même pour Bella quand elle parle à ton ou ta partenaire.'] },
        { h: 'Ce que Bella en fait', list: ['Elle retient les détails, comme sa commande au café ou le restaurant de votre troisième rendez-vous.', 'Elle te prévient avant les anniversaires.', 'Elle propose des sorties et des rendez-vous que l’autre peut accepter d’un geste.', 'Chaque dimanche, elle te donne une observation et une petite chose à essayer ensemble.'] },
        { h: 'C’est toi qui décides', p: ['Bella propose. Tu choisis. Dis non à une idée et elle apprend ce que tu aimes.'] },
        { h: 'Fondé sur la recherche', p: ['Les suggestions de Bella s’appuient sur des décennies de recherche sur le couple.'], links: ['Découvrir Belluh Research'] },
      ],
    },
    nfaq: {
      eyebrow: 'Questions insolites', title: 'Les questions qu’on ne pose pas souvent.', lede: 'Personne ne les pose, on y répond quand même.',
      parts: [
        { h: 'Pourquoi une libellule comme logo ?', p: ['Les libellules sont légères, vives, et apparaissent quand il fait beau. C’est le sentiment qu’on veut que Belluh laisse derrière lui.'] },
        { h: 'Qui est Bella ?', p: ['Bella, c’est l’IA de Belluh. Elle se souvient de ce que tu oublierais, planifie ce que tu remettrais à plus tard, et ne prend jamais parti. Son prénom vient d’une personne très spéciale.', 'Le saviez-vous ? « Belluh » est un clin d’œil espiègle aux sonorités du mot « bella ».'] },
        { h: 'Bella peut-elle dire qui a raison ?', p: ['Non. Elle ne prend jamais parti. Elle pourrait par contre vous proposer un dîner.'] },
        { h: 'Belluh fonctionne-t-il si on vit sur des fuseaux horaires différents ?', p: ['Oui. Belluh garde le fuseau horaire de chacun, pour que les rappels arrivent à la bonne heure pour vous deux.'] },
        { h: 'Quelle est la chose la plus romantique que Belluh puisse faire ?', p: ['Se souvenir d’une chose que ton ou ta partenaire a dite une seule fois, il y a des mois, au moment parfait.'] },
      ],
    },
    'privacy-choices': {
      eyebrow: 'Vos choix de confidentialité', title: 'Tes données, tes choix.', lede: 'Ce que tu peux faire de tes informations, et comment.',
      parts: [
        { h: 'Choisir ce qui est partagé', p: ['Chaque entrée est partagée ou privée, c’est toi qui choisis. Les guides peuvent être privés, partagés par lien ou publiés pour tous, et tu peux changer cela à tout moment.'] },
        { h: 'Consulter, télécharger, corriger ou supprimer', p: ['Tu peux demander une copie de tes entrées de journal, de tes photos et de tes données de couple, nous demander de les corriger, ou nous demander de supprimer ton compte et tes données. Nous répondons dans les 30 jours suivant la vérification de ton identité.'], links: ['Faire une demande'] },
        { h: 'T’opposer', p: ['Si tu ne veux pas que nous utilisions tes informations pour une finalité à laquelle la loi te permet de t’opposer, dis-le-nous et nous respecterons ton choix.'], links: ['M’opposer'] },
      ],
    },
    accessibility: {
      eyebrow: 'Déclaration d’accessibilité', title: 'Belluh, pour tout le monde.', lede: 'L’amour n’est pas réservé à ceux qui peuvent utiliser une souris. Nous voulons que Belluh fonctionne pour chaque couple.',
      parts: [
        { h: 'Ce que nous faisons', list: ['Respecter le réglage « réduire les animations » de ton appareil : animations et effets s’arrêtent.', 'Étiqueter les boutons et les images pour les lecteurs d’écran.', 'Fonctionner au clavier, et fermer menus et fenêtres avec Échap.', 'Parler neuf langues, avec les formats locaux.'] },
        { h: 'Notre objectif', p: ['Nous visons la conformité aux Règles pour l’accessibilité des contenus Web (WCAG) 2.2, niveau AA. Nous n’y sommes pas encore tout à fait, et nous y travaillons.'] },
        { h: 'Dis-le-nous', p: ['Si quelque chose dans Belluh est difficile à utiliser, dis-le-nous. Nous lisons chaque message.'], links: ['Signaler un problème d’accessibilité'] },
      ],
    },
  },
};

const it: T = {
  updated: 'Ultimo aggiornamento: {date}',
  closing: 'Questa pagina spiega in parole semplici come funzionano le cose. Fanno fede l’{privacy} e i {terms}.',
  subjects: { story: 'La nostra storia con Belluh', help: 'Aiuto', privacy: 'Richiesta sulla privacy', data: 'Richiesta sui dati', optOut: 'Richiesta di opposizione', accessibility: 'Accessibilità' },
  docs: {
    newsroom: {
      eyebrow: 'Notizie', title: 'Le novità di Belluh.', lede: 'Novità di prodotto e annunci, dal più recente. Per interviste e domande della stampa, vai all’Area stampa.',
      parts: [
        { h: '{date}: il tuo profilo, a modo tuo', p: ['I profili sono diventati una tela bianca. Registra Your Face, pochi secondi di te in loop, scontornati dallo sfondo, e usali come foto. Aggiungi ovunque canzoni, libri, film, note vocali, disegni, forme e sticker, con decorazioni ed effetti in movimento.'] },
        { h: '{date}: Belluh Research', p: ['Abbiamo pubblicato la scienza dietro Belluh: cosa studiamo, come lavoriamo e sei studi con revisione paritaria su ciò che tiene unite le coppie.'], links: ['Visita Belluh Research'] },
        { h: '{date}: guide da condividere', p: ['Le coppie possono trasformare i posti che amano in guide, da tenere private, condividere con gli amici tramite link o pubblicare per tutte le coppie.'] },
        { h: '{date}: la vostra mappa dell’amore', p: ['Ogni ricordo appuntato dove è successo, su una mappa che si allarga fino ai pianeti.'] },
      ],
      cta: 'Area stampa',
    },
    stories: {
      eyebrow: 'Storie di coppia', title: 'Belluh ha aiutato il vostro amore a durare?', lede: 'L’anniversario che stavate per dimenticare, e non avete dimenticato. L’appuntamento diventato una tradizione. Il biglietto che diceva la cosa giusta. Ci piacerebbe saperlo.',
      parts: [
        { h: 'Raccontateci la vostra storia', p: ['Scriveteci con i vostri nomi (bastano quelli di battesimo), da quanto state insieme e il momento in cui c’era anche Belluh. Le foto sono benvenute.', 'Chiederemo sempre a entrambi prima di condividere qualsiasi cosa, e non condividiamo mai una storia senza il vostro permesso.'] },
      ],
      cta: 'Condividi la vostra storia',
    },
    contact: {
      eyebrow: 'Contatti', title: 'Parla con una persona.', lede: 'Belluh è un piccolo team. Scrivici e una persona leggerà il tuo messaggio.',
      parts: [
        { h: 'Aiuto con l’app', p: ['Chiedi prima a Bella: sa come funziona tutto. Se non riesce ad aiutarti, scrivici.'] },
        { h: 'Privacy e dati', p: ['Richieste per vedere, scaricare, correggere o cancellare i tuoi dati.'] },
        { h: 'Stampa, partnership e lavoro', links: ['Area stampa', 'Belluh Together', 'Lavora con noi'] },
      ],
    },
    'safety-tips': {
      eyebrow: 'Sicurezza', title: 'L’amore deve farti sentire al sicuro.', lede: 'Belluh serve a tenere vicino l’amore. Ecco com’è una relazione sana, com’è una che non lo è, e a chi rivolgerti.',
      parts: [
        { h: 'Una relazione sana è', list: ['Puoi dire di no, e viene rispettato.', 'Hai i tuoi amici, i tuoi soldi, il tuo telefono e il tuo tempo.', 'Le discussioni finiscono senza paura.', 'Entrambi vi sentite liberi di essere voi stessi.'] },
        { h: 'Segnali d’allarme', list: ['Controllare telefono, posizione o messaggi senza chiedere.', 'Allontanarti da amici o familiari.', 'Controllare i soldi, o cosa indossi o fai.', 'Minacce, umiliazioni, o farti avere paura.'] },
        { h: 'Il tuo Belluh, i tuoi confini', p: ['Ogni pagina è condivisa o privata, decidi tu. Il tuo partner non vede mai le tue pagine private. Puoi lasciare una cerchia in qualsiasi momento.'] },
        { h: 'Chiedi aiuto ora', p: ['Se sei in pericolo, chiama il numero di emergenza del tuo paese (in Italia e in Europa, il 112). Negli Stati Uniti, chiama il 911.', 'National Domestic Violence Hotline (Stati Uniti): chiama l’1-800-799-7233 o invia START via SMS all’88788. È gratuita e riservata, a qualsiasi ora.', '988 Suicide & Crisis Lifeline (Stati Uniti): chiama o invia un SMS al 988.', 'Fuori dagli Stati Uniti, il numero di emergenza del tuo paese e i servizi di supporto locali possono aiutarti.'] },
      ],
    },
    'how-belluh-works': {
      eyebrow: 'Come funziona Belluh', title: 'Come Bella vi aiuta a restare vicini.', lede: 'Niente magia, niente misteri. Ecco cosa guarda Bella, e cosa ne fa.',
      parts: [
        { h: 'Cosa sa Bella', p: ['Solo quello che dai a Belluh: ciò che scrivi nel diario, le date e i dettagli che salvi e il tuo calendario, se lo colleghi. Le tue pagine private restano private, anche per Bella quando parla con il tuo partner.'] },
        { h: 'Cosa ne fa Bella', list: ['Ricorda i dettagli, come il suo caffè preferito o il ristorante del vostro terzo appuntamento.', 'Ti avvisa prima di compleanni e anniversari.', 'Propone programmi e appuntamenti che il partner può accettare con un tocco.', 'Ogni domenica ti dà un’osservazione e una piccola cosa da provare insieme.'] },
        { h: 'Decidi tu', p: ['Bella propone. Tu scegli. Di’ di no a un programma e lei impara cosa ti piace.'] },
        { h: 'Basato sulla ricerca', p: ['I suggerimenti di Bella si basano su decenni di scienza delle relazioni.'], links: ['Visita Belluh Research'] },
      ],
    },
    nfaq: {
      eyebrow: 'Domande insolite', title: 'Domande non così frequenti.', lede: 'Cose che nessuno chiede, con risposta comunque.',
      parts: [
        { h: 'Perché il logo è una libellula?', p: ['Le libellule sono leggere, veloci e arrivano quando la giornata è calda. È la sensazione che vogliamo lasci Belluh.'] },
        { h: 'Chi è Bella?', p: ['Bella è l’AI di Belluh. Ricorda quello che dimenticheresti, organizza quello che rimanderesti e non prende mai le parti di nessuno. Il suo nome viene da una persona molto speciale.', 'Curiosità: “Belluh” gioca con i suoni della parola “bella”, con un tocco scherzoso.'] },
        { h: 'Bella può dire chi ha ragione?', p: ['No. Non prende mai le parti di nessuno. Però potrebbe proporvi una cena.'] },
        { h: 'Belluh funziona se viviamo in fusi orari diversi?', p: ['Sì. Belluh tiene conto del fuso orario di ciascuno, così i promemoria arrivano all’ora giusta per entrambi.'] },
        { h: 'Qual è la cosa più romantica che Belluh può fare?', p: ['Ricordare qualcosa che il tuo partner ha detto una volta, mesi fa, esattamente nel momento giusto.'] },
      ],
    },
    'privacy-choices': {
      eyebrow: 'Scelte sulla privacy', title: 'I tuoi dati, le tue scelte.', lede: 'Cosa puoi fare con le tue informazioni, e come.',
      parts: [
        { h: 'Scegli cosa condividere', p: ['Ogni pagina è condivisa o privata, decidi tu. Le guide possono essere private, condivise tramite link o pubblicate per tutti, e puoi cambiarlo in qualsiasi momento.'] },
        { h: 'Vedere, scaricare, correggere o cancellare', p: ['Puoi chiedere una copia delle tue pagine di diario, delle foto e dei dati sulla relazione, chiederci di correggerli o di cancellare il tuo account e i tuoi dati. Rispondiamo entro 30 giorni dalla verifica della tua identità.'], links: ['Fai una richiesta'] },
        { h: 'Opposizione', p: ['Se non vuoi che usiamo le tue informazioni per una finalità a cui la legge ti consente di opporti, diccelo e rispetteremo la tua scelta.'], links: ['Mi oppongo'] },
      ],
    },
    accessibility: {
      eyebrow: 'Dichiarazione di accessibilità', title: 'Belluh, per tutti.', lede: 'L’amore non è solo per chi può usare un mouse. Vogliamo che Belluh funzioni per ogni coppia.',
      parts: [
        { h: 'Cosa facciamo', list: ['Rispettiamo l’impostazione di riduzione del movimento del tuo dispositivo: animazioni ed effetti si fermano.', 'Etichettiamo pulsanti e immagini per gli screen reader.', 'Funzioniamo da tastiera, e menu e finestre si chiudono con Esc.', 'Parliamo nove lingue, con i formati locali.'] },
        { h: 'Il nostro obiettivo', p: ['Puntiamo a rispettare le Linee guida per l’accessibilità dei contenuti Web (WCAG) 2.2 al livello AA. Non siamo ancora perfetti, e ci stiamo lavorando.'] },
        { h: 'Diccelo', p: ['Se qualcosa in Belluh è difficile da usare, diccelo. Leggiamo ogni messaggio.'], links: ['Segnala un problema di accessibilità'] },
      ],
    },
  },
};

const pt: T = {
  updated: 'Última atualização: {date}',
  closing: 'Esta página explica em palavras simples como as coisas funcionam. Prevalecem a {privacy} e os {terms}.',
  subjects: { story: 'Nossa história com o Belluh', help: 'Ajuda', privacy: 'Solicitação de privacidade', data: 'Solicitação de dados', optOut: 'Solicitação de opt-out', accessibility: 'Acessibilidade' },
  docs: {
    newsroom: {
      eyebrow: 'Novidades', title: 'O que há de novo no Belluh.', lede: 'Novidades do produto e anúncios, dos mais recentes aos mais antigos. Para entrevistas e perguntas da imprensa, veja a página de Imprensa.',
      parts: [
        { h: '{date}: seu perfil, do seu jeito', p: ['Os perfis viraram uma tela em branco. Grave o Your Face, alguns segundos de você em loop, recortados do fundo, e use como sua foto. Coloque músicas, livros, filmes, mensagens de voz, desenhos, formas e figurinhas onde quiser, com decorações e efeitos que se mexem.'] },
        { h: '{date}: Belluh Research', p: ['Publicamos a ciência por trás do Belluh: o que estudamos, como trabalhamos e seis estudos revisados por pares sobre o que mantém os casais próximos.'], links: ['Conheça o Belluh Research'] },
        { h: '{date}: guias para compartilhar', p: ['Casais podem transformar os lugares que amam em guias, guardados só para eles, compartilhados com amigos por link ou publicados para todos os casais.'] },
        { h: '{date}: o mapa do amor de vocês', p: ['Cada lembrança fixada onde aconteceu, num mapa que dá zoom até os planetas.'] },
      ],
      cta: 'Imprensa',
    },
    stories: {
      eyebrow: 'Histórias de casais', title: 'O Belluh ajudou o amor de vocês a durar?', lede: 'O aniversário de namoro que vocês quase esqueceram, e não esqueceram. O encontro que virou tradição. O bilhete que disse a coisa certa. A gente adoraria saber.',
      parts: [
        { h: 'Conte a história de vocês', p: ['Escreva para a gente com os nomes de vocês (só o primeiro nome já basta), há quanto tempo estão juntos e o momento de que o Belluh fez parte. Fotos são bem-vindas.', 'Sempre vamos perguntar aos dois antes de compartilhar qualquer coisa, e nunca compartilhamos uma história sem a permissão de vocês.'] },
      ],
      cta: 'Compartilhe sua história',
    },
    contact: {
      eyebrow: 'Contato', title: 'Fale com uma pessoa.', lede: 'O Belluh é uma equipe pequena. Escreva para a gente e uma pessoa vai ler.',
      parts: [
        { h: 'Ajuda com o app', p: ['Pergunte primeiro à Bella: ela sabe como tudo funciona. Se ela não puder ajudar, escreva para a gente.'] },
        { h: 'Privacidade e seus dados', p: ['Pedidos para ver, baixar, corrigir ou excluir seus dados.'] },
        { h: 'Imprensa, parcerias e carreiras', links: ['Imprensa', 'Belluh Together', 'Carreiras'] },
      ],
    },
    'safety-tips': {
      eyebrow: 'Segurança', title: 'O amor tem que ser seguro.', lede: 'O Belluh existe para manter o amor por perto. Veja como é uma relação saudável, como não é, e a quem recorrer.',
      parts: [
        { h: 'Uma relação saudável é assim', list: ['Você pode dizer não, e isso é respeitado.', 'Você mantém seus amigos, seu dinheiro, seu celular e seu tempo.', 'As brigas terminam sem medo.', 'Vocês dois se sentem livres para ser quem são.'] },
        { h: 'Sinais de alerta', list: ['Mexer no seu celular, localização ou mensagens sem pedir.', 'Afastar você de amigos ou da família.', 'Controlar o dinheiro, ou o que você veste ou faz.', 'Ameaças, humilhações, ou fazer você sentir medo.'] },
        { h: 'Seu Belluh, seus limites', p: ['Cada registro é compartilhado ou privado, você escolhe. Seu par nunca vê seus registros privados. Você pode sair de um círculo a qualquer momento.'] },
        { h: 'Peça ajuda agora', p: ['Se você estiver em perigo, ligue para o número de emergência do seu país (no Brasil, 190 para a polícia; ligue 180 para a Central de Atendimento à Mulher). Nos EUA, ligue 911.', 'National Domestic Violence Hotline (EUA): ligue 1-800-799-7233 ou envie START por SMS para 88788. É gratuita e confidencial, a qualquer hora.', '988 Suicide & Crisis Lifeline (EUA): ligue ou envie SMS para 988.', 'Fora dos EUA, o número de emergência do seu país e os serviços de apoio locais podem ajudar.'] },
      ],
    },
    'how-belluh-works': {
      eyebrow: 'Como o Belluh funciona', title: 'Como a Bella ajuda vocês a ficarem próximos.', lede: 'Sem mágica, sem mistério. Veja o que a Bella olha, e o que ela faz com isso.',
      parts: [
        { h: 'O que a Bella sabe', p: ['Só o que você dá ao Belluh: o que você escreve no diário, as datas e os detalhes que salva e sua agenda, se você conectar. Seus registros privados continuam privados, até para a Bella quando ela conversa com seu par.'] },
        { h: 'O que a Bella faz com isso', list: ['Lembra os detalhes, como o café preferido dele ou dela ou o restaurante do terceiro encontro.', 'Avisa antes de aniversários e datas especiais.', 'Sugere programas e encontros que seu par pode aceitar com um toque.', 'Todo domingo, traz uma percepção e uma pequena coisa para vocês experimentarem juntos.'] },
        { h: 'Você decide', p: ['A Bella sugere. Você escolhe. Diga não a um programa e ela aprende do que você gosta.'] },
        { h: 'Com base em pesquisa', p: ['As sugestões da Bella se baseiam em décadas de ciência dos relacionamentos.'], links: ['Conheça o Belluh Research'] },
      ],
    },
    nfaq: {
      eyebrow: 'Perguntas inusitadas', title: 'Perguntas nem tão frequentes.', lede: 'Coisas que ninguém pergunta, respondidas mesmo assim.',
      parts: [
        { h: 'Por que o logo é uma libélula?', p: ['Libélulas são leves, rápidas e aparecem quando o dia está quente. É essa a sensação que queremos que o Belluh deixe.'] },
        { h: 'Quem é a Bella?', p: ['A Bella é a IA do Belluh. Ela lembra o que você esqueceria, planeja o que você deixaria para depois e nunca toma partido. O nome dela vem de uma pessoa muito especial.', 'Curiosidade: “Belluh” é uma brincadeira com os sons da palavra “bella”.'] },
        { h: 'A Bella pode decidir quem tem razão?', p: ['Não. Ela nunca toma partido. Mas pode sugerir um jantar.'] },
        { h: 'O Belluh funciona se a gente mora em fusos horários diferentes?', p: ['Sim. O Belluh guarda o fuso horário de cada um, então os lembretes chegam na hora certa para os dois.'] },
        { h: 'Qual é a coisa mais romântica que o Belluh pode fazer?', p: ['Lembrar de algo que seu par disse uma única vez, meses atrás, exatamente na hora certa.'] },
      ],
    },
    'privacy-choices': {
      eyebrow: 'Suas escolhas de privacidade', title: 'Seus dados, suas escolhas.', lede: 'O que você pode fazer com suas informações, e como.',
      parts: [
        { h: 'Escolha o que é compartilhado', p: ['Cada registro é compartilhado ou privado, você escolhe. Os guias podem ser privados, compartilhados por link ou publicados para todos, e você pode mudar isso a qualquer momento.'] },
        { h: 'Ver, baixar, corrigir ou excluir', p: ['Você pode pedir uma cópia dos seus registros do diário, fotos e dados do relacionamento, pedir que a gente os corrija, ou pedir que excluamos sua conta e seus dados. Respondemos em até 30 dias depois de confirmar que é você.'], links: ['Fazer uma solicitação'] },
        { h: 'Opt-out', p: ['Se você não quiser que usemos suas informações para uma finalidade da qual a lei permite que você se oponha, avise a gente e vamos respeitar sua escolha.'], links: ['Fazer opt-out'] },
      ],
    },
    accessibility: {
      eyebrow: 'Declaração de acessibilidade', title: 'Belluh, para todo mundo.', lede: 'O amor não é só para quem consegue usar um mouse. Queremos que o Belluh funcione para todos os casais.',
      parts: [
        { h: 'O que fazemos', list: ['Respeitamos a configuração de redução de movimento do seu dispositivo: animações e efeitos param.', 'Identificamos botões e imagens para leitores de tela.', 'Funcionamos pelo teclado, e menus e janelas fecham com Esc.', 'Falamos nove idiomas, com formatos locais.'] },
        { h: 'Nosso objetivo', p: ['Buscamos atender às Diretrizes de Acessibilidade para Conteúdo Web (WCAG) 2.2, nível AA. Ainda não somos perfeitos, e estamos trabalhando nisso.'] },
        { h: 'Conte para a gente', p: ['Se algo no Belluh for difícil de usar, conte para a gente. Lemos todas as mensagens.'], links: ['Relatar um problema de acessibilidade'] },
      ],
    },
  },
};

const zh: T = {
  updated: '最后更新：{date}',
  closing: '本页用通俗的语言说明各项功能如何运作。具体以{privacy}和{terms}为准。',
  subjects: { story: '我们的 Belluh 故事', help: '求助', privacy: '隐私请求', data: '数据请求', optOut: '选择退出请求', accessibility: '无障碍' },
  docs: {
    newsroom: {
      eyebrow: '新闻中心', title: 'Belluh 的最新动态。', lede: '产品新闻和公告，按时间从新到旧排列。采访和媒体问题，请查看媒体资源。',
      parts: [
        { h: '{date}：你的主页，你做主', p: ['个人主页变成了一块空白画布。录一段 Your Face，几秒钟循环播放、抠掉背景的你，用作头像。歌曲、书、电影、语音、涂鸦、形状和贴纸都能随处摆放，还有会动的装饰和特效。'] },
        { h: '{date}：Belluh Research', p: ['我们公开了 Belluh 背后的科学：我们研究什么、怎样工作，以及六项关于什么能让情侣保持亲密的同行评审研究。'], links: ['访问 Belluh Research'] },
        { h: '{date}：值得分享的攻略', p: ['情侣可以把喜欢的地方做成攻略，可以只留给自己，可以通过链接分享给朋友，也可以发布给所有情侣。'] },
        { h: '{date}：你们的爱情地图', p: ['每段回忆都钉在它发生的地方，地图可以一直缩小到看见行星。'] },
      ],
      cta: '媒体资源',
    },
    stories: {
      eyebrow: '情侣故事', title: 'Belluh 让你们的爱更长久了吗？', lede: '差点忘了、最后没忘的纪念日。后来变成传统的一次约会。说对了话的那张小纸条。我们很想听听。',
      parts: [
        { h: '讲讲你们的故事', p: ['写信告诉我们你们的名字（名字就好，不用写姓）、在一起多久了，以及 Belluh 参与其中的那个时刻。欢迎附上照片。', '分享任何内容之前，我们都会先征得你们两个人的同意；没有你们的许可，我们绝不会分享你们的故事。'] },
      ],
      cta: '分享你们的故事',
    },
    contact: {
      eyebrow: '联系我们', title: '和真人聊聊。', lede: 'Belluh 是个小团队。给我们写信，会有真人来读。',
      parts: [
        { h: '应用使用帮助', p: ['先问问 Bella：每个功能怎么用，她都知道。如果她帮不上忙，再给我们写信。'] },
        { h: '隐私与你的数据', p: ['查看、下载、更正或删除你的数据的请求。'] },
        { h: '媒体、合作与招聘', links: ['媒体资源', 'Belluh Together', '加入我们'] },
      ],
    },
    'safety-tips': {
      eyebrow: '安全', title: '爱，应该让人安心。', lede: 'Belluh 是为了让爱更近。这里说说健康的关系是什么样、不健康的又是什么样，以及可以向谁求助。',
      parts: [
        { h: '健康的关系是这样的', list: ['你可以说不，而且会被尊重。', '你有自己的朋友、钱、手机和时间。', '吵架过后，不会让你害怕。', '你们都能自在地做自己。'] },
        { h: '危险信号', list: ['不经同意就查看你的手机、位置或消息。', '让你和朋友或家人疏远。', '控制你的钱，或你穿什么、做什么。', '威胁、贬低你，或让你感到害怕。'] },
        { h: '你的 Belluh，你的边界', p: ['每条日记是共享还是私密，由你决定。你的另一半永远看不到你的私密日记。你可以随时退出一个圈子。'] },
        { h: '立即求助', p: ['如果你身处危险，请拨打当地的紧急电话（在中国大陆，报警请拨 110，急救请拨 120）。在美国，请拨打 911。', '美国全国家庭暴力热线（美国）：拨打 1-800-799-7233，或发送短信 START 到 88788。全天候免费且保密。', '988 自杀与危机生命线（美国）：拨打或发短信至 988。', '在美国以外，当地的紧急电话和当地的支持服务可以帮助你。'] },
      ],
    },
    'how-belluh-works': {
      eyebrow: 'Belluh 如何运作', title: 'Bella 如何帮你们保持亲密。', lede: '没有魔法，也没有秘密。这里说明 Bella 会看什么，以及她用这些做什么。',
      parts: [
        { h: 'Bella 知道什么', p: ['只有你提供给 Belluh 的内容：你在日记里写的东西、你保存的日期和细节，以及你连接的日历（如果你连接了的话）。你的私密日记始终私密，Bella 和你的另一半聊天时也看不到。'] },
        { h: 'Bella 用它做什么', list: ['记住细节，比如对方常点的咖啡，或你们第三次约会去的餐厅。', '在生日和纪念日前提醒你。', '推荐另一半一键就能接受的计划和约会。', '每周日给你一条洞察，和一件可以一起尝试的小事。'] },
        { h: '你来决定', p: ['Bella 提建议，你来选择。拒绝一个计划，她就会更懂你喜欢什么。'] },
        { h: '以研究为基础', p: ['Bella 的建议建立在几十年的亲密关系科学之上。'], links: ['访问 Belluh Research'] },
      ],
    },
    nfaq: {
      eyebrow: '冷门问题', title: '不太常见的问题。', lede: '没人问过，我们也答了。',
      parts: [
        { h: '为什么标志是一只蜻蜓？', p: ['蜻蜓轻盈、灵巧，总在天气暖和的时候出现。这就是我们希望 Belluh 留给你的感觉。'] },
        { h: 'Bella 是谁？', p: ['Bella 是 Belluh 的 AI。她记得你会忘的事，安排你会拖的事，而且从不偏袒任何一方。她的名字来自一个非常特别的人。', '冷知识：“Belluh”这个名字，是把“bella”一词的发音俏皮地变了个调。'] },
        { h: 'Bella 能评评谁对谁错吗？', p: ['不能。她从不偏袒任何一方。不过，她可能会建议你们一起去吃顿饭。'] },
        { h: '我们在不同时区，Belluh 还能用吗？', p: ['能。Belluh 会分别记住你们各自的时区，提醒会在对你们两人都合适的时间送达。'] },
        { h: 'Belluh 能做的最浪漫的事是什么？', p: ['在恰好的时刻，想起你的另一半几个月前只说过一次的话。'] },
      ],
    },
    'privacy-choices': {
      eyebrow: '你的隐私选择', title: '你的数据，你做主。', lede: '你可以如何处理你的信息，以及怎么做。',
      parts: [
        { h: '选择分享什么', p: ['每条日记是共享还是私密，由你决定。攻略可以设为私密、通过链接分享或公开发布给所有人，并且可以随时更改。'] },
        { h: '查看、下载、更正或删除', p: ['你可以索取你的日记、照片和关系数据的副本，要求我们更正，或要求我们删除你的账户和数据。核实是你本人后，我们会在 30 天内答复。'], links: ['提交请求'] },
        { h: '选择退出', p: ['如果法律允许你对某种用途选择退出，而你不希望我们将你的信息用于该用途，请告诉我们，我们会照办。'], links: ['选择退出'] },
      ],
    },
    accessibility: {
      eyebrow: '无障碍声明', title: 'Belluh，属于每个人。', lede: '爱不只属于会用鼠标的人。我们希望 Belluh 适合每一对情侣。',
      parts: [
        { h: '我们做了什么', list: ['遵从设备的“减弱动态效果”设置：动画和特效会停止。', '为屏幕阅读器标注按钮和图片。', '支持键盘操作，按 Esc 可关闭菜单和对话框。', '支持九种语言，并采用当地格式。'] },
        { h: '我们的目标', p: ['我们的目标是达到《Web 内容无障碍指南》（WCAG）2.2 的 AA 级。我们还不完美，正在持续改进。'] },
        { h: '告诉我们', p: ['如果 Belluh 有什么地方不好用，请告诉我们。每一条反馈我们都会看。'], links: ['报告无障碍问题'] },
      ],
    },
  },
};

const de: T = {
  updated: 'Zuletzt aktualisiert: {date}',
  closing: 'Diese Seite erklärt in einfachen Worten, wie alles funktioniert. Maßgeblich sind die {privacy} und die {terms}.',
  subjects: { story: 'Unsere Belluh-Geschichte', help: 'Hilfe', privacy: 'Datenschutzanfrage', data: 'Datenanfrage', optOut: 'Widerspruch', accessibility: 'Barrierefreiheit' },
  docs: {
    newsroom: {
      eyebrow: 'Neuigkeiten', title: 'Was es Neues bei Belluh gibt.', lede: 'Produktneuheiten und Ankündigungen, die neuesten zuerst. Für Interviews und Presseanfragen schau unter Presse.',
      parts: [
        { h: '{date}: Dein Profil, wie du es willst', p: ['Profile sind jetzt eine leere Leinwand. Nimm Your Face auf, ein paar Sekunden von dir in Schleife, freigestellt vom Hintergrund, und nutze sie als dein Bild. Füge überall Songs, Bücher, Filme, Sprachnachrichten, Zeichnungen, Formen und Sticker hinzu, mit Verzierungen und Effekten, die sich bewegen.'] },
        { h: '{date}: Belluh Research', p: ['Wir haben die Wissenschaft hinter Belluh veröffentlicht: was wir erforschen, wie wir arbeiten und sechs begutachtete Studien darüber, was Paare einander nah hält.'], links: ['Zu Belluh Research'] },
        { h: '{date}: Guides zum Teilen', p: ['Paare können ihre Lieblingsorte in Guides verwandeln, die privat bleiben, per Link mit Freunden geteilt oder für alle Paare veröffentlicht werden.'] },
        { h: '{date}: Eure Liebeskarte', p: ['Jede Erinnerung dort angepinnt, wo sie passiert ist, auf einer Karte, die sich bis zu den Planeten herauszoomen lässt.'] },
      ],
      cta: 'Presse',
    },
    stories: {
      eyebrow: 'Erfolgsgeschichten', title: 'Hat Belluh eurer Liebe geholfen?', lede: 'Der Jahrestag, den ihr fast vergessen hättet, und dann doch nicht. Das Date, das zur Tradition wurde. Die Notiz, die genau das Richtige gesagt hat. Wir würden gern davon hören.',
      parts: [
        { h: 'Erzählt uns eure Geschichte', p: ['Schreibt uns eure Namen (Vornamen reichen), wie lange ihr schon zusammen seid und den Moment, in dem Belluh dabei war. Fotos sind willkommen.', 'Bevor wir etwas teilen, fragen wir immer euch beide, und wir teilen nie eine Geschichte ohne eure Erlaubnis.'] },
      ],
      cta: 'Eure Geschichte teilen',
    },
    contact: {
      eyebrow: 'Kontakt', title: 'Sprich mit einem Menschen.', lede: 'Belluh ist ein kleines Team. Schreib uns, und ein Mensch liest es.',
      parts: [
        { h: 'Hilfe mit der App', p: ['Frag zuerst Bella: Sie weiß, wie alles funktioniert. Wenn sie nicht helfen kann, schreib uns.'] },
        { h: 'Datenschutz und deine Daten', p: ['Anfragen, deine Daten einzusehen, herunterzuladen, zu berichtigen oder zu löschen.'] },
        { h: 'Presse, Partnerschaften und Jobs', links: ['Presse', 'Belluh Together', 'Karriere'] },
      ],
    },
    'safety-tips': {
      eyebrow: 'Sicherheit', title: 'Liebe soll sich sicher anfühlen.', lede: 'Belluh ist dafür da, Liebe nah zu halten. Hier steht, wie eine gesunde Beziehung aussieht, wie nicht, und wo du Hilfe findest.',
      parts: [
        { h: 'Gesund heißt', list: ['Du kannst Nein sagen, und das wird respektiert.', 'Du behältst deine eigenen Freunde, dein Geld, dein Handy und deine Zeit.', 'Streit endet ohne Angst.', 'Ihr fühlt euch beide frei, ihr selbst zu sein.'] },
        { h: 'Warnzeichen', list: ['Dein Handy, deinen Standort oder deine Nachrichten ungefragt kontrollieren.', 'Dich von Freunden oder Familie abschneiden.', 'Dein Geld kontrollieren, oder was du trägst oder tust.', 'Drohungen, Herabsetzungen oder dir Angst machen.'] },
        { h: 'Dein Belluh, deine Grenzen', p: ['Jeder Eintrag ist geteilt oder privat, du entscheidest. Dein Partner oder deine Partnerin sieht deine privaten Einträge nie. Du kannst einen Kreis jederzeit verlassen.'] },
        { h: 'Jetzt Hilfe holen', p: ['Wenn du in Gefahr bist, ruf den Notruf deines Landes an (in Deutschland, Österreich und der Schweiz die 112). In den USA wähl die 911.', 'National Domestic Violence Hotline (USA): Ruf 1-800-799-7233 an oder schick START per SMS an 88788. Kostenlos und vertraulich, rund um die Uhr.', '988 Suicide & Crisis Lifeline (USA): Ruf die 988 an oder schreib eine SMS an 988.', 'Außerhalb der USA helfen dir der Notruf deines Landes und Hilfsangebote vor Ort.'] },
      ],
    },
    'how-belluh-works': {
      eyebrow: 'So funktioniert Belluh', title: 'Wie Bella euch hilft, nah zu bleiben.', lede: 'Keine Magie, kein Geheimnis. Hier steht, was Bella sich ansieht und was sie damit macht.',
      parts: [
        { h: 'Was Bella weiß', p: ['Nur, was du Belluh gibst: was du in dein Tagebuch schreibst, die Daten und Details, die du speicherst, und deinen Kalender, wenn du ihn verbindest. Deine privaten Einträge bleiben privat, auch vor Bella, wenn sie mit deinem Partner oder deiner Partnerin spricht.'] },
        { h: 'Was Bella damit macht', list: ['Sie merkt sich Details, etwa die Lieblingsbestellung im Café oder das Restaurant von eurem dritten Date.', 'Sie erinnert dich vor Geburtstagen und Jahrestagen.', 'Sie schlägt Pläne und Dates vor, die dein Partner mit einem Tippen annehmen kann.', 'Jeden Sonntag gibt sie dir eine Erkenntnis und eine kleine Sache, die ihr zusammen ausprobieren könnt.'] },
        { h: 'Du entscheidest', p: ['Bella schlägt vor. Du wählst. Sag Nein zu einem Plan, und sie lernt, was dir gefällt.'] },
        { h: 'Auf Forschung gebaut', p: ['Was Bella vorschlägt, beruht auf Jahrzehnten Beziehungsforschung.'], links: ['Zu Belluh Research'] },
      ],
    },
    nfaq: {
      eyebrow: 'Seltene Fragen', title: 'Nicht so häufig gestellte Fragen.', lede: 'Was niemand fragt, trotzdem beantwortet.',
      parts: [
        { h: 'Warum ist das Logo eine Libelle?', p: ['Libellen sind leicht, schnell und tauchen auf, wenn der Tag warm ist. Genau dieses Gefühl soll Belluh hinterlassen.'] },
        { h: 'Wer ist Bella?', p: ['Bella ist die KI von Belluh. Sie merkt sich, was du vergessen würdest, plant, was du aufschieben würdest, und ergreift nie Partei. Ihr Name geht auf einen ganz besonderen Menschen zurück.', 'Fun Fact: „Belluh“ ist ein verspieltes Wortspiel mit dem Klang des Wortes „bella“.'] },
        { h: 'Kann Bella entscheiden, wer recht hat?', p: ['Nein. Sie ergreift nie Partei. Ein Abendessen schlägt sie vielleicht aber vor.'] },
        { h: 'Funktioniert Belluh, wenn wir in verschiedenen Zeitzonen leben?', p: ['Ja. Belluh kennt die Zeitzone von jedem von euch, damit Erinnerungen für euch beide zur richtigen Stunde ankommen.'] },
        { h: 'Was ist das Romantischste, was Belluh tun kann?', p: ['Sich an etwas erinnern, das dein Partner vor Monaten ein einziges Mal gesagt hat, genau im richtigen Moment.'] },
      ],
    },
    'privacy-choices': {
      eyebrow: 'Deine Datenschutz-Optionen', title: 'Deine Daten, deine Entscheidung.', lede: 'Was du mit deinen Informationen tun kannst, und wie.',
      parts: [
        { h: 'Wähle, was geteilt wird', p: ['Jeder Eintrag ist geteilt oder privat, du entscheidest. Guides können privat sein, per Link geteilt oder für alle veröffentlicht werden, und du kannst das jederzeit ändern.'] },
        { h: 'Einsehen, herunterladen, berichtigen oder löschen', p: ['Du kannst eine Kopie deiner Tagebucheinträge, Fotos und Beziehungsdaten anfordern, uns bitten, sie zu berichtigen, oder uns bitten, dein Konto und deine Daten zu löschen. Wir antworten innerhalb von 30 Tagen, nachdem wir bestätigt haben, dass du es bist.'], links: ['Anfrage stellen'] },
        { h: 'Widersprechen', p: ['Wenn du nicht möchtest, dass wir deine Informationen für einen Zweck verwenden, dem du laut Gesetz widersprechen kannst, sag es uns, und wir halten uns daran.'], links: ['Widersprechen'] },
      ],
    },
    accessibility: {
      eyebrow: 'Erklärung zur Barrierefreiheit', title: 'Belluh, für alle.', lede: 'Liebe ist nicht nur für Menschen, die eine Maus benutzen können. Wir wollen, dass Belluh für jedes Paar funktioniert.',
      parts: [
        { h: 'Was wir tun', list: ['Die Einstellung „Bewegung reduzieren“ deines Geräts respektieren: Animationen und Effekte stoppen.', 'Schaltflächen und Bilder für Screenreader beschriften.', 'Mit der Tastatur funktionieren und Menüs und Dialoge mit Esc schließen.', 'Acht Sprachen sprechen, in lokalen Formaten.'] },
        { h: 'Unser Ziel', p: ['Wir wollen die Web Content Accessibility Guidelines (WCAG) 2.2 auf Stufe AA erfüllen. Wir sind noch nicht perfekt und arbeiten daran.'] },
        { h: 'Sag es uns', p: ['Wenn etwas in Belluh schwer zu benutzen ist, sag es uns bitte. Wir lesen jede Nachricht.'], links: ['Barrierefreiheitsproblem melden'] },
      ],
    },
  },
};

const es: T = {
  updated: 'Última actualización: {date}',
  closing: 'Esta página explica con palabras sencillas cómo funcionan las cosas. Prevalecen la {privacy} y las {terms}.',
  subjects: { story: 'Nuestra historia con Belluh', help: 'Ayuda', privacy: 'Solicitud de privacidad', data: 'Solicitud de datos', optOut: 'Solicitud de exclusión', accessibility: 'Accesibilidad' },
  docs: {
    newsroom: {
      eyebrow: 'Noticias', title: 'Novedades de Belluh.', lede: 'Noticias del producto y anuncios, de lo más reciente a lo más antiguo. Para entrevistas y preguntas de prensa, consulta la sección de Prensa.',
      parts: [
        { h: '{date}: tu perfil, a tu manera', p: ['Los perfiles se han convertido en un lienzo en blanco. Graba Your Face, unos segundos de ti en bucle, recortados del fondo, y úsalos como foto. Añade canciones, libros, películas, notas de voz, dibujos, formas y stickers donde quieras, con decoraciones y efectos en movimiento.'] },
        { h: '{date}: Belluh Research', p: ['Hemos publicado la ciencia que hay detrás de Belluh: qué estudiamos, cómo trabajamos y seis estudios revisados por pares sobre lo que mantiene unidas a las parejas.'], links: ['Visita Belluh Research'] },
        { h: '{date}: guías para compartir', p: ['Las parejas pueden convertir sus sitios favoritos en guías, guardadas para ellas, compartidas con amigos mediante un enlace o publicadas para todas las parejas.'] },
        { h: '{date}: vuestro mapa del amor', p: ['Cada recuerdo, fijado donde ocurrió, en un mapa que se aleja hasta los planetas.'] },
      ],
      cta: 'Prensa',
    },
    stories: {
      eyebrow: 'Historias de parejas', title: '¿Belluh ha ayudado a que vuestro amor dure?', lede: 'El aniversario que casi olvidasteis, y no olvidasteis. La cita que se convirtió en tradición. La nota que dijo lo justo. Nos encantaría conocerla.',
      parts: [
        { h: 'Contadnos vuestra historia', p: ['Escribidnos con vuestros nombres (basta con el nombre de pila), cuánto tiempo lleváis juntos y el momento del que Belluh formó parte. Las fotos son bienvenidas.', 'Siempre os preguntaremos a los dos antes de compartir nada, y nunca compartimos una historia sin vuestro permiso.'] },
      ],
      cta: 'Comparte vuestra historia',
    },
    contact: {
      eyebrow: 'Contacto', title: 'Habla con una persona.', lede: 'Belluh es un equipo pequeño. Escríbenos y una persona lo leerá.',
      parts: [
        { h: 'Ayuda con la app', p: ['Pregunta primero a Bella: sabe cómo funciona todo. Si no puede ayudarte, escríbenos.'] },
        { h: 'Privacidad y tus datos', p: ['Solicitudes para ver, descargar, corregir o eliminar tus datos.'] },
        { h: 'Prensa, colaboraciones y empleo', links: ['Prensa', 'Belluh Together', 'Empleo'] },
      ],
    },
    'safety-tips': {
      eyebrow: 'Seguridad', title: 'El amor debería hacerte sentir a salvo.', lede: 'Belluh sirve para mantener el amor cerca. Aquí tienes cómo es una relación sana, cómo no lo es y a quién acudir.',
      parts: [
        { h: 'Una relación sana es', list: ['Puedes decir que no, y se respeta.', 'Conservas tus amistades, tu dinero, tu móvil y tu tiempo.', 'Las discusiones terminan sin miedo.', 'Los dos os sentís libres de ser vosotros mismos.'] },
        { h: 'Señales de alarma', list: ['Revisar tu móvil, tu ubicación o tus mensajes sin preguntar.', 'Apartarte de tus amistades o tu familia.', 'Controlar el dinero, o lo que llevas o haces.', 'Amenazas, desprecios o hacer que tengas miedo.'] },
        { h: 'Tu Belluh, tus límites', p: ['Cada entrada es compartida o privada, tú decides. Tu pareja nunca ve tus entradas privadas. Puedes salir de un círculo en cualquier momento.'] },
        { h: 'Pide ayuda ya', p: ['Si estás en peligro, llama al número de emergencias de tu país (en España y en toda Europa, el 112; en España también puedes llamar al 016, que no deja rastro en la factura). En EE. UU., llama al 911.', 'National Domestic Violence Hotline (EE. UU.): llama al 1-800-799-7233 o envía START por SMS al 88788. Es gratuita y confidencial, a cualquier hora.', '988 Suicide & Crisis Lifeline (EE. UU.): llama o envía un SMS al 988.', 'Fuera de EE. UU., el número de emergencias de tu país y los servicios de apoyo locales pueden ayudarte.'] },
      ],
    },
    'how-belluh-works': {
      eyebrow: 'Cómo funciona Belluh', title: 'Cómo Bella os ayuda a seguir cerca.', lede: 'Sin magia ni misterio. Esto es lo que mira Bella y lo que hace con ello.',
      parts: [
        { h: 'Lo que sabe Bella', p: ['Solo lo que le das a Belluh: lo que escribes en tu diario, las fechas y los detalles que guardas y tu calendario, si lo conectas. Tus entradas privadas siguen siendo privadas, incluso para Bella cuando habla con tu pareja.'] },
        { h: 'Lo que hace Bella con ello', list: ['Recuerda los detalles, como su café de siempre o el restaurante de vuestra tercera cita.', 'Te avisa antes de cumpleaños y aniversarios.', 'Propone planes y citas que tu pareja puede aceptar con un toque.', 'Cada domingo te da una idea sobre vosotros y una pequeña cosa para probar juntos.'] },
        { h: 'Tú decides', p: ['Bella propone. Tú eliges. Di que no a un plan y aprenderá lo que te gusta.'] },
        { h: 'Basado en la investigación', p: ['Lo que propone Bella se basa en décadas de ciencia de las relaciones.'], links: ['Visita Belluh Research'] },
      ],
    },
    nfaq: {
      eyebrow: 'Preguntas insólitas', title: 'Preguntas no tan frecuentes.', lede: 'Cosas que nadie pregunta, respondidas igualmente.',
      parts: [
        { h: '¿Por qué el logo es una libélula?', p: ['Las libélulas son ligeras, rápidas y aparecen cuando el día es cálido. Esa es la sensación que queremos que deje Belluh.'] },
        { h: '¿Quién es Bella?', p: ['Bella es la IA de Belluh. Recuerda lo que tú olvidarías, planea lo que tú dejarías para luego y nunca toma partido. Su nombre viene de una persona muy especial.', 'Dato curioso: «Belluh» es un guiño juguetón a cómo suena la palabra «bella».'] },
        { h: '¿Puede Bella decidir quién tiene razón?', p: ['No. Nunca toma partido. Aunque quizá os proponga ir a cenar.'] },
        { h: '¿Funciona Belluh si vivimos en zonas horarias distintas?', p: ['Sí. Belluh guarda la zona horaria de cada uno, para que los recordatorios lleguen a la hora adecuada para los dos.'] },
        { h: '¿Qué es lo más romántico que puede hacer Belluh?', p: ['Recordar algo que tu pareja dijo una sola vez, hace meses, justo en el momento adecuado.'] },
      ],
    },
    'privacy-choices': {
      eyebrow: 'Tus opciones de privacidad', title: 'Tus datos, tus decisiones.', lede: 'Qué puedes hacer con tu información, y cómo.',
      parts: [
        { h: 'Elige qué se comparte', p: ['Cada entrada es compartida o privada, tú decides. Las guías pueden ser privadas, compartirse mediante enlace o publicarse para todos, y puedes cambiarlo en cualquier momento.'] },
        { h: 'Ver, descargar, corregir o eliminar', p: ['Puedes pedir una copia de tus entradas del diario, tus fotos y tus datos de pareja, pedirnos que los corrijamos o pedirnos que eliminemos tu cuenta y tus datos. Respondemos en un plazo de 30 días después de verificar que eres tú.'], links: ['Hacer una solicitud'] },
        { h: 'Exclusión', p: ['Si no quieres que usemos tu información para una finalidad de la que la ley te permite excluirte, dínoslo y lo respetaremos.'], links: ['Excluirme'] },
      ],
    },
    accessibility: {
      eyebrow: 'Declaración de accesibilidad', title: 'Belluh, para todos.', lede: 'El amor no es solo para quien puede usar un ratón. Queremos que Belluh funcione para todas las parejas.',
      parts: [
        { h: 'Lo que hacemos', list: ['Respetar el ajuste de movimiento reducido de tu dispositivo: las animaciones y los efectos se detienen.', 'Etiquetar botones e imágenes para lectores de pantalla.', 'Funcionar con teclado, y cerrar menús y diálogos con Esc.', 'Hablar nueve idiomas, con formatos locales.'] },
        { h: 'Nuestro objetivo', p: ['Aspiramos a cumplir las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2 en el nivel AA. Aún no somos perfectos, y estamos trabajando en ello.'] },
        { h: 'Cuéntanoslo', p: ['Si algo en Belluh es difícil de usar, cuéntanoslo. Leemos todos los mensajes.'], links: ['Informar de un problema de accesibilidad'] },
      ],
    },
  },
};

const t: UiTable<T> = {
  en, ja, fr, it, pt, zh, de, es,
  // Mexico: ustedes rather than vosotros, celular, and Mexico's own emergency and support lines
  ko: {
    updated: '최종 업데이트 {date}',
    closing: '이 페이지는 어떻게 운영되는지 쉬운 말로 설명해요. 효력은 {privacy}과 {terms}에 따릅니다.',
    subjects: {
      story: '우리의 Belluh 이야기',
      help: '도움 요청',
      privacy: '개인정보 관련 요청',
      data: '데이터 요청',
      optOut: '처리 거부 요청',
      accessibility: '접근성',
    },
    docs: {
      newsroom: {
        eyebrow: '뉴스룸',
        title: 'Belluh의 새 소식.',
        lede: '제품 소식과 공지를 최신순으로 전해요. 인터뷰와 언론 문의는 보도 자료를 확인해 주세요.',
        parts: [
          {
            h: '{date}: 내 방식대로, 내 프로필',
            p: [
              '프로필이 빈 캔버스가 되었어요. 배경을 지운 몇 초짜리 반복 영상, 내 얼굴을 녹화해 프로필 사진으로 써 보세요. 노래, 책, 영화, 음성 메모, 그림, 도형, 스티커를 어디든 올리고, 움직이는 꾸미기와 효과도 더할 수 있어요.',
            ],
          },
          {
            h: '{date}: Belluh 리서치',
            p: ['Belluh의 바탕이 된 과학을 공개했어요. 무엇을 연구하는지, 어떻게 일하는지, 그리고 커플을 가깝게 지켜 주는 것에 대한 동료 심사 연구 6편까지.'],
            links: ['Belluh 리서치 둘러보기'],
          },
          { h: '{date}: 공유하고 싶은 가이드', p: ['좋아하는 장소를 가이드로 만들 수 있어요. 둘만 보거나, 친구에게 링크로 공유하거나, 모든 커플에게 공개하세요.'] },
          { h: '{date}: 사랑의 지도', p: ['모든 추억을 그 일이 있었던 곳에 핀으로. 행성까지 축소되는 지도 위에요.'] },
        ],
        cta: '보도 자료',
      },
      stories: {
        eyebrow: '커플 이야기',
        title: 'Belluh 덕분에 사랑이 오래갔나요?',
        lede: '깜빡할 뻔했지만 놓치지 않은 기념일. 어느새 둘만의 전통이 된 데이트. 꼭 맞는 말을 전해 준 메시지. 그 이야기를 듣고 싶어요.',
        parts: [
          {
            h: '이야기를 들려주세요',
            p: [
              '두 사람의 이름(성은 빼도 돼요), 함께한 기간, 그리고 Belluh가 함께한 순간을 적어 보내 주세요. 사진도 환영해요.',
              '무엇이든 공유하기 전에 꼭 두 사람 모두에게 물어보고, 허락 없이는 절대 이야기를 공개하지 않아요.',
            ],
          },
        ],
        cta: '이야기 공유하기',
      },
      contact: {
        eyebrow: '문의하기',
        title: '사람과 이야기하세요.',
        lede: 'Belluh는 작은 팀이에요. 메시지를 보내면 사람이 직접 읽어요.',
        parts: [
          { h: '앱 사용 도움', p: ['먼저 벨라에게 물어보세요. 모든 기능을 다 알고 있어요. 벨라가 해결하지 못하면 저희에게 메시지를 보내 주세요.'] },
          { h: '개인정보와 내 데이터', p: ['내 데이터의 열람, 다운로드, 정정, 삭제 요청.'] },
          { h: '언론, 제휴, 채용', links: ['보도 자료', 'Belluh Together', '채용'] },
        ],
      },
      'safety-tips': {
        eyebrow: '안전',
        title: '사랑은 안전해야 해요.',
        lede: 'Belluh는 사랑을 가까이 지키기 위한 곳이에요. 건강한 관계는 어떤 모습인지, 그렇지 않은 건 무엇인지, 어디에 도움을 청할 수 있는지 알려 드려요.',
        parts: [
          {
            h: '건강한 관계는 이래요',
            list: [
              '싫다고 말할 수 있고, 그 말이 존중받아요.',
              '내 친구, 내 돈, 내 휴대폰, 내 시간은 내 것으로 지켜져요.',
              '다툼이 두려움 없이 끝나요.',
              '두 사람 모두 있는 그대로의 자신일 수 있어요.',
            ],
          },
          {
            h: '위험 신호',
            list: [
              '묻지 않고 휴대폰, 위치, 메시지를 확인해요.',
              '친구나 가족과 만나지 못하게 해요.',
              '돈을 통제하거나, 무엇을 입고 무엇을 할지 정해요.',
              '협박하거나, 깎아내리거나, 두렵게 만들어요.',
            ],
          },
          { h: '나의 Belluh, 나의 경계', p: ['모든 글은 공유할지 비공개로 둘지 내가 정해요. 연인은 내 비공개 글을 절대 볼 수 없어요. 서클은 언제든 나갈 수 있어요.'] },
          {
            h: '지금 도움받기',
            p: [
              '위험한 상황이라면 바로 112(경찰)나 119에 전화하세요. 미국에서는 911이에요.',
              '여성긴급전화 1366: 가정폭력, 데이트폭력 상담을 24시간 받을 수 있어요. 무료이고 비밀이 보장돼요.',
              '자살예방 상담전화 109: 24시간 언제든 전화하세요.',
              '미국에서는 전국 가정폭력 핫라인 1-800-799-7233(또는 88788로 START 문자), 위기 상담 988에 연락할 수 있어요. 그 밖의 나라에서는 현지 긴급 번호와 지원 기관이 도와줄 거예요.',
            ],
          },
        ],
      },
      'how-belluh-works': {
        eyebrow: 'Belluh 이용 방법',
        title: '벨라가 두 사람을 가깝게 지키는 방법.',
        lede: '마법도, 비밀도 없어요. 벨라가 무엇을 보고, 그걸로 무엇을 하는지 알려 드려요.',
        parts: [
          {
            h: '벨라가 아는 것',
            p: ['Belluh에 직접 준 것만 알아요. 다이어리에 쓴 글, 저장한 기념일과 디테일, 그리고 연결했다면 캘린더까지. 비공개 글은 벨라가 연인과 대화할 때도 비공개로 지켜져요.'],
          },
          {
            h: '벨라가 그걸로 하는 일',
            list: [
              '연인의 커피 주문, 세 번째 데이트 때 간 식당 같은 디테일을 기억해요.',
              '생일과 기념일 전에 미리 알려 줘요.',
              '연인이 탭 한 번으로 수락할 수 있는 계획과 데이트를 제안해요.',
              '매주 일요일, 인사이트 하나와 함께 해 볼 작은 것 하나를 건네요.',
            ],
          },
          { h: '결정은 두 사람이', p: ['벨라는 제안하고, 선택은 두 사람이 해요. 계획을 거절하면 벨라가 취향을 배워요.'] },
          { h: '연구에 기반해요', p: ['벨라의 제안은 수십 년의 관계 과학을 바탕으로 해요.'], links: ['Belluh 리서치 둘러보기'] },
        ],
      },
      nfaq: {
        eyebrow: 'NFAQ',
        title: '별로 자주 묻지 않는 질문.',
        lede: '아무도 묻지 않았지만, 그래도 답해 봤어요.',
        parts: [
          { h: '로고는 왜 잠자리인가요?', p: ['잠자리는 가볍고, 날쌔고, 날이 따뜻할 때 나타나요. Belluh가 남기고 싶은 느낌이 바로 그거예요.'] },
          {
            h: '벨라는 누구인가요?',
            p: [
              '벨라는 Belluh의 AI예요. 잊어버릴 것을 기억하고, 미뤄 둘 것을 계획하고, 절대 한쪽 편을 들지 않아요. 벨라라는 이름은 아주 특별한 사람에게서 왔어요.',
              '재미있는 사실: “Belluh”는 “bella”라는 단어의 소리를 장난스럽게 비튼 이름이에요.',
            ],
          },
          { h: '벨라가 누가 옳은지 판정해 줄 수 있나요?', p: ['아니요. 벨라는 절대 편을 들지 않아요. 대신 저녁 메뉴는 추천해 줄지도 몰라요.'] },
          { h: '서로 다른 시간대에 살아도 Belluh를 쓸 수 있나요?', p: ['네. Belluh는 두 사람의 시간대를 각각 기억해서, 리마인더가 두 사람 모두에게 알맞은 시간에 도착해요.'] },
          { h: 'Belluh가 할 수 있는 가장 로맨틱한 일은?', p: ['몇 달 전 연인이 딱 한 번 했던 말을, 꼭 맞는 순간에 기억해 내는 것.'] },
        ],
      },
      'privacy-choices': {
        eyebrow: '개인정보 설정',
        title: '내 데이터, 내 선택.',
        lede: '내 정보로 무엇을 할 수 있는지, 그리고 그 방법.',
        parts: [
          { h: '공유할 것 고르기', p: ['모든 글은 공유할지 비공개로 둘지 내가 정해요. 가이드는 비공개, 링크 공유, 전체 공개 중에 고를 수 있고, 언제든 바꿀 수 있어요.'] },
          {
            h: '열람, 다운로드, 정정, 삭제',
            p: ['다이어리 글, 사진, 관계 데이터의 사본을 요청하거나, 정정을 요청하거나, 계정과 데이터 삭제를 요청할 수 있어요. 본인 확인 후 30일 이내에 답변드려요.'],
            links: ['요청하기'],
          },
          { h: '처리 거부', p: ['법이 거부할 수 있도록 허용한 목적에 내 정보가 쓰이길 원하지 않는다면, 알려 주세요. 그대로 따를게요.'], links: ['처리 거부하기'] },
        ],
      },
      accessibility: {
        eyebrow: '접근성 안내',
        title: '모두를 위한 Belluh.',
        lede: '사랑은 마우스를 쓸 수 있는 사람만의 것이 아니에요. 모든 커플이 Belluh를 쓸 수 있으면 좋겠어요.',
        parts: [
          {
            h: '우리가 하는 일',
            list: [
              '기기의 동작 줄이기 설정을 존중해요. 애니메이션과 효과가 멈춰요.',
              '스크린 리더를 위해 버튼과 이미지에 설명을 달아요.',
              '키보드로 쓸 수 있고, Esc 키로 메뉴와 대화상자를 닫을 수 있어요.',
              '9개 언어를, 각 나라의 표기 방식으로 지원해요.',
            ],
          },
          { h: '우리의 목표', p: ['웹 콘텐츠 접근성 지침(WCAG) 2.2 AA 수준을 목표로 해요. 아직 완벽하지 않지만, 계속 개선하고 있어요.'] },
          { h: '알려 주세요', p: ['Belluh에서 쓰기 어려운 부분이 있다면 꼭 알려 주세요. 모든 메시지를 직접 읽어요.'], links: ['접근성 문제 신고하기'] },
        ],
      },
    },
  },
  'es-MX': {
    // Mexico's names for the policies are masculine: el Aviso de privacidad, los Términos de servicio
    closing: 'Esta página explica con palabras sencillas cómo funcionan las cosas. Prevalecen el {privacy} y los {terms}.',
    docs: {
      ...es.docs,
      newsroom: { ...es.docs.newsroom, parts: es.docs.newsroom.parts.map((x, i) => i === 3 ? { ...x, h: '{date}: su mapa del amor' } : x) },
      'how-belluh-works': {
        ...es.docs['how-belluh-works'], title: 'Cómo Bella los ayuda a seguir cerca.',
        parts: es.docs['how-belluh-works'].parts.map((x, i) => i === 1 ? { ...x, list: ['Recuerda los detalles, como su café de siempre o el restaurante de su tercera cita.', 'Te avisa antes de cumpleaños y aniversarios.', 'Propone planes y citas que tu pareja puede aceptar con un toque.', 'Cada domingo te da una idea sobre ustedes y una pequeña cosa para probar juntos.'] } : x),
      },
      nfaq: { ...es.docs.nfaq, parts: es.docs.nfaq.parts.map((x, i) => i === 2 ? { ...x, p: ['No. Nunca toma partido. Aunque quizá les proponga ir a cenar.'] } : x) },
      stories: {
        ...es.docs.stories,
        title: '¿Belluh ayudó a que su amor durara?', lede: 'El aniversario que casi olvidaron, y no olvidaron. La cita que se volvió tradición. La nota que dijo justo lo correcto. Nos encantaría conocerla.',
        parts: [{ h: 'Cuéntennos su historia', p: ['Escríbannos con sus nombres (basta con el nombre de pila), cuánto tiempo llevan juntos y el momento del que Belluh formó parte. Las fotos son bienvenidas.', 'Siempre les preguntaremos a los dos antes de compartir cualquier cosa, y nunca compartimos una historia sin su permiso.'] }],
        cta: 'Compartan su historia',
      },
      'safety-tips': {
        ...es.docs['safety-tips'],
        parts: [
          { h: 'Una relación sana es', list: ['Puedes decir que no, y se respeta.', 'Conservas tus amistades, tu dinero, tu celular y tu tiempo.', 'Las discusiones terminan sin miedo.', 'Los dos se sienten libres de ser como son.'] },
          { h: 'Señales de alerta', list: ['Revisar tu celular, tu ubicación o tus mensajes sin preguntar.', 'Alejarte de tus amistades o tu familia.', 'Controlar el dinero, o lo que usas o haces.', 'Amenazas, humillaciones o hacer que tengas miedo.'] },
          es.docs['safety-tips'].parts[2],
          { h: 'Pide ayuda ahora', p: ['Si estás en peligro, llama al número de emergencias de tu país (en México, el 911). En EE. UU., llama también al 911.', 'National Domestic Violence Hotline (EE. UU.): llama al 1-800-799-7233 o envía START por SMS al 88788. Es gratuita y confidencial, a cualquier hora.', '988 Suicide & Crisis Lifeline (EE. UU.): llama o envía un SMS al 988.', 'Fuera de EE. UU., el número de emergencias de tu país y los servicios de apoyo locales pueden ayudarte.'] },
        ],
      },
    },
  },
  // Portugal: European Portuguese (a equipa, telemóvel, registos) and Portugal's own emergency line
  'pt-PT': {
    docs: {
      ...pt.docs,
      contact: { ...pt.docs.contact, eyebrow: 'Contacto', title: 'Fale com uma pessoa.', lede: 'O Belluh é uma equipa pequena. Escreva-nos e uma pessoa vai ler.' },
      'safety-tips': {
        ...pt.docs['safety-tips'],
        parts: [
          { h: 'Uma relação saudável é assim', list: ['Pode dizer que não, e isso é respeitado.', 'Mantém os seus amigos, o seu dinheiro, o seu telemóvel e o seu tempo.', 'As discussões terminam sem medo.', 'Ambos se sentem livres para serem quem são.'] },
          { h: 'Sinais de alerta', list: ['Ver o seu telemóvel, a sua localização ou as suas mensagens sem pedir.', 'Afastá-lo de amigos ou da família.', 'Controlar o dinheiro, ou o que veste ou faz.', 'Ameaças, humilhações, ou fazê-lo sentir medo.'] },
          pt.docs['safety-tips'].parts[2],
          { h: 'Peça ajuda agora', p: ['Se estiver em perigo, ligue para o número de emergência do seu país (em Portugal e em toda a Europa, o 112; para apoio a vítimas de violência doméstica, a linha 800 202 148 é gratuita). Nos EUA, ligue 911.', 'National Domestic Violence Hotline (EUA): ligue 1-800-799-7233 ou envie START por SMS para 88788. É gratuita e confidencial, a qualquer hora.', '988 Suicide & Crisis Lifeline (EUA): ligue ou envie SMS para 988.', 'Fora dos EUA, o número de emergência do seu país e os serviços de apoio locais podem ajudar.'] },
        ],
      },
    },
  },
};
export default t;
