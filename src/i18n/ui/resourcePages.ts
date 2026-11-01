// The words on the pages behind the footer (src/pages/company/Resources.tsx): newsroom, stories, contact, safety,
// FAQ, trust and safety, press, how Belluh works, NFAQ, security, cookies, consumer health data, privacy choices and
// accessibility. Routes, email addresses and files stay in the page; only the words live here. Each part's `links`
// holds the labels of its links that aren't an email address, in order. Policy pages are translated faithfully: no
// claim added or removed. {date} is filled with a date written the reader's way.
import type { UiTable } from '../ui';

export type PartT = { h?: string; p?: string[]; list?: string[]; links?: string[] };
export type DocT = { eyebrow: string; title: string; lede: string; parts: PartT[]; cta?: string };
export type Slug = 'newsroom' | 'stories' | 'contact' | 'safety-tips' | 'faq' | 'trust-and-safety' | 'press' | 'how-belluh-works' | 'nfaq' | 'security' | 'cookies' | 'consumer-health-data' | 'privacy-choices' | 'accessibility';
type Subjects = { story: string; help: string; privacy: string; report: string; press: string; security: string; healthData: string; data: string; optOut: string; accessibility: string };
type T = { updated: string; closing: string; subjects: Subjects; docs: Record<Slug, DocT> };

const en: T = {
  updated: 'Last updated {date}',
  closing: 'This page explains how things work in plain words. The {privacy} and {terms} govern.',
  subjects: { story: 'Our Belluh story', help: 'Help', privacy: 'Privacy request', report: 'Report', press: 'Press', security: 'Security report', healthData: 'Consumer health data request', data: 'Data request', optOut: 'Opt-out request', accessibility: 'Accessibility' },
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
    faq: { eyebrow: 'FAQ', title: 'Questions, answered.', lede: 'The questions couples ask us most.', parts: [] },
    'trust-and-safety': {
      eyebrow: 'Trust & Safety', title: 'Built to be trusted with your love story.', lede: 'Your journal holds the most personal things you will ever write down. Here is how we look after it, and how we keep Belluh kind.',
      parts: [
        { h: 'Private by default', p: ['Every entry is shared or private, your call. Your partner never sees your private entries, and neither does Bella when she talks with them.'] },
        { h: 'You choose what goes public', p: ['Guides are private until you decide otherwise: you can keep a guide to yourselves, share it with friends by link, or post it for every couple. You can change your mind any time.'] },
        { h: 'Keeping the community kind', p: ['Guides posted for everyone must be about real places and written in good faith. No hate, harassment, sexual content, scams or other people’s private information.'] },
        { h: 'Report something', p: ['If you see a guide or anything else on Belluh that breaks these rules, or someone is using Belluh to hurt you, tell us. We read every report.'], links: ['Report to Belluh', 'Safety tips and help'] },
      ],
    },
    press: {
      eyebrow: 'Press resources', title: 'Writing about Belluh?', lede: 'Everything you need, and a person to talk to.',
      parts: [
        { h: 'About Belluh', p: ['Belluh is a shared AI journal for couples. Bella, its AI, remembers what matters to you both, plans dates your partner can accept with one tap, and reminds you before the days that count, so busy couples stay close. Belluh is free to start and available in eight languages.'] },
        { h: 'Brand', p: ['Name: Belluh, always with a capital B. The AI is Bella.', 'Colors: Belluh blue #9BBECB and Belluh pink #F0ADDD.'], links: ['Download the mark (PNG)', 'Download the app icon (PNG)'] },
        { h: 'Press contact' },
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
        { h: 'Who is Bella?', p: ['Belluh’s AI. She remembers what you’d forget, plans what you’d put off, and never takes sides.'] },
        { h: 'Can Bella settle who’s right?', p: ['No. She never takes sides. She might suggest dinner, though.'] },
        { h: 'Does Belluh work if we live in different time zones?', p: ['Yes. Belluh keeps each of your time zones, so reminders land at the right hour for both of you.'] },
        { h: 'What’s the most romantic thing Belluh can do?', p: ['Remember something your partner said once, months ago, at exactly the right moment.'] },
      ],
    },
    security: {
      eyebrow: 'Security', title: 'How we protect your data.', lede: 'Security at Belluh, in plain words.',
      parts: [
        { h: 'Who can see what', p: ['Database rules decide who can read each piece of data: your journal is readable only by the people in your circle, and private entries only by you. These rules run on the server, not just in the app.'] },
        { h: 'Photos and voice notes', p: ['Your photos and voice notes are kept in private storage. The app shows them using links that expire shortly after they are made, so a copied link stops working.'] },
        { h: 'In transit and at rest', p: ['Belluh is served only over HTTPS. Passwords are handled by our authentication provider and are never stored in plain text. Payments are handled by third-party payment processors; we do not store full card numbers.'] },
        { h: 'Report a vulnerability', p: ['If you believe you’ve found a security issue, please email us before sharing it publicly, with steps to reproduce it. We will respond, keep you updated, and credit you if you’d like.'], links: ['Report a security issue'] },
      ],
    },
    cookies: {
      eyebrow: 'Cookie policy', title: 'Cookies and similar storage.', lede: 'What Belluh stores in your browser, and why.',
      parts: [
        { h: 'What we store', list: ['Sign-in: keeps you signed in on this device.', 'Your settings: things like your language, time zone and whether the sidebar is open.', 'Things in progress: an invite you followed, or a question you started before signing in, so it’s still there after you sign in.'] },
        { h: 'Why', p: ['These are needed for Belluh to work, or to remember your choices. The Privacy Policy explains everything else we collect, including usage and analytics data, and how we use it.'] },
        { h: 'Your choices', p: ['You can clear site data in your browser settings at any time. If you do, you’ll be signed out and your on-device settings will reset.'] },
      ],
    },
    'consumer-health-data': {
      eyebrow: 'Consumer health data privacy policy', title: 'Health information you choose to share.', lede: 'Some U.S. states, such as Washington, give you specific rights over consumer health data. This page explains how that applies to Belluh.',
      parts: [
        { h: 'What this covers', p: ['Belluh is not a medical service. But what you write in your journal, how you feel, how you’re sleeping, a doctor’s visit you mention, could include information about your health. This page covers that information.'] },
        { h: 'How we use it', p: ['Only to run Belluh for you: to keep your journal, and for Bella to help you as described in the Privacy Policy. Private entries stay private, including from your partner.'] },
        { h: 'Your rights', list: ['Know what health information we have about you.', 'Get a copy of it.', 'Have it deleted.', 'Withdraw your consent to our using it.'] },
        { h: 'How to ask', p: ['Email us. We will confirm it’s you, and respond within the time the law requires.'] },
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
        { h: 'What we do', list: ['Respect your device’s reduced-motion setting: animations and effects stop.', 'Label buttons and images for screen readers.', 'Work with a keyboard, and close menus and dialogs with Escape.', 'Speak eight languages, in local formats.'] },
        { h: 'Our aim', p: ['We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. We’re not perfect yet, and we’re working on it.'] },
        { h: 'Tell us', p: ['If something in Belluh is hard to use, please tell us. We read every note.'], links: ['Report an accessibility problem'] },
      ],
    },
  },
};

const ja: T = {
  updated: '最終更新日：{date}',
  closing: 'このページは、しくみをわかりやすい言葉で説明したものです。正式な内容は{privacy}と{terms}に定めています。',
  subjects: { story: 'わたしたちのBelluhストーリー', help: 'ヘルプ', privacy: 'プライバシーに関するリクエスト', report: '報告', press: '取材のお問い合わせ', security: 'セキュリティの報告', healthData: '消費者健康データに関するリクエスト', data: 'データに関するリクエスト', optOut: 'オプトアウトのリクエスト', accessibility: 'アクセシビリティ' },
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
    faq: { eyebrow: 'よくある質問', title: 'よくある質問に、お答えします。', lede: 'カップルからいちばんよく寄せられる質問です。', parts: [] },
    'trust-and-safety': {
      eyebrow: '信頼と安全', title: 'ふたりのラブストーリーを、安心して預けられるように。', lede: 'ジャーナルには、あなたがこれまでに書き留めるなかでいちばん個人的なことが残ります。それをどう守り、Belluhをやさしい場所に保っているかをお伝えします。',
      parts: [
        { h: '最初から非公開', p: ['どの投稿も、共有するか非公開にするかはあなたが決められます。非公開の投稿は、パートナーにも、パートナーと話すときのBellaにも見えません。'] },
        { h: '公開するかどうかは、あなたが決める', p: ['ガイドは、あなたが決めるまで非公開です。ふたりだけのものにする、リンクで友だちに共有する、すべてのカップルに公開する、から選べます。あとからいつでも変えられます。'] },
        { h: 'やさしいコミュニティのために', p: ['みんなに公開するガイドは、実在する場所について、誠実に書かれたものに限ります。ヘイト、嫌がらせ、性的なコンテンツ、詐欺、他人の個人情報は禁止です。'] },
        { h: '報告する', p: ['ルールに反するガイドなどをBelluhで見つけたとき、または誰かがBelluhを使ってあなたを傷つけているときは、お知らせください。報告はすべて読んでいます。'], links: ['Belluhに報告する', '安全のためのヒントと相談先'] },
      ],
    },
    press: {
      eyebrow: 'プレス向け情報', title: 'Belluhについて書いてくださる方へ。', lede: '必要な情報はここにそろっています。担当者にも直接ご相談いただけます。',
      parts: [
        { h: 'Belluhについて', p: ['Belluhは、カップルのためのAI共有ジャーナルです。AIのBellaが、ふたりにとって大切なことを覚え、パートナーがワンタップで受けられるデートを計画し、大事な日の前にリマインドしてくれます。忙しいカップルも、近くにいられるように。Belluhは無料で始められ、8言語に対応しています。'] },
        { h: 'ブランド', p: ['名称：Belluh（Bは常に大文字）。AIの名前はBellaです。', 'カラー：Belluhブルー #9BBECB、Belluhピンク #F0ADDD。'], links: ['ロゴマークをダウンロード（PNG）', 'アプリアイコンをダウンロード（PNG）'] },
        { h: 'プレスのお問い合わせ' },
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
        { h: 'Bellaって誰？', p: ['BelluhのAIです。あなたが忘れそうなことを覚えていて、後回しにしそうなことを計画してくれて、どちらの味方にもつきません。'] },
        { h: 'どっちが正しいか、Bellaに決めてもらえる？', p: ['いいえ。Bellaはどちらの味方にもつきません。ただ、晩ごはんを提案してくれるかもしれません。'] },
        { h: '住んでいるタイムゾーンが違っても使える？', p: ['はい。Belluhはそれぞれのタイムゾーンを覚えているので、リマインダーはふたりにとってちょうどいい時間に届きます。'] },
        { h: 'Belluhにできる、いちばんロマンチックなことは？', p: ['何か月も前にパートナーが一度だけ口にしたことを、ここぞというタイミングで思い出させること。'] },
      ],
    },
    security: {
      eyebrow: 'セキュリティ', title: 'データの守り方。', lede: 'Belluhのセキュリティを、わかりやすい言葉で。',
      parts: [
        { h: '誰が何を見られるか', p: ['データベースのルールが、どのデータを誰が読めるかを決めています。ジャーナルを読めるのはサークルのメンバーだけ、非公開の投稿を読めるのはあなただけです。これらのルールはアプリの中だけでなく、サーバー上で動いています。'] },
        { h: '写真とボイスメモ', p: ['写真とボイスメモは非公開のストレージに保管されます。アプリでは作成後まもなく期限が切れるリンクを使って表示するため、コピーしたリンクはやがて使えなくなります。'] },
        { h: '通信中と保存時', p: ['BelluhはHTTPSでのみ提供されています。パスワードは認証プロバイダーが管理し、平文で保存されることはありません。決済は第三者の決済代行業者が処理し、カード番号の全桁を当社が保存することはありません。'] },
        { h: '脆弱性の報告', p: ['セキュリティ上の問題を見つけたと思われる場合は、公表する前に、再現手順を添えてメールでお知らせください。当社は返信し、対応状況をお伝えし、ご希望があればお名前をクレジットします。'], links: ['セキュリティの問題を報告する'] },
      ],
    },
    cookies: {
      eyebrow: 'Cookieポリシー', title: 'Cookieと類似のストレージ。', lede: 'Belluhがブラウザに何を保存し、なぜ保存するのか。',
      parts: [
        { h: '保存するもの', list: ['ログイン情報：この端末でログインしたままにします。', '設定：言語、タイムゾーン、サイドバーを開いているかどうかなど。', '途中の操作：たどってきた招待や、ログイン前に書き始めた質問など。ログインしたあとも残るようにします。'] },
        { h: '理由', p: ['これらは、Belluhが動作するため、またはあなたの選択を覚えておくために必要です。利用状況や分析のデータを含め、当社が収集するそのほかの情報とその使い方は、プライバシーポリシーで説明しています。'] },
        { h: 'あなたの選択', p: ['サイトのデータは、ブラウザの設定からいつでも消去できます。消去するとログアウトされ、端末上の設定はリセットされます。'] },
      ],
    },
    'consumer-health-data': {
      eyebrow: '消費者健康データ・プライバシーポリシー', title: 'あなたが共有を選んだ健康に関する情報。', lede: 'ワシントン州など米国の一部の州では、消費者健康データについて特定の権利が認められています。このページでは、それがBelluhにどう当てはまるかを説明します。',
      parts: [
        { h: '対象となる情報', p: ['Belluhは医療サービスではありません。ただ、ジャーナルに書く内容、たとえば気分や睡眠の様子、触れた通院のことなどに、健康に関する情報が含まれる可能性があります。このページはそうした情報を対象としています。'] },
        { h: '使い方', p: ['あなたのためにBelluhを運営する目的にのみ使います。ジャーナルを保管すること、そしてプライバシーポリシーに記載のとおりBellaがあなたを手助けすることです。非公開の投稿は、パートナーに対しても非公開のままです。'] },
        { h: 'あなたの権利', list: ['当社が保有するあなたの健康に関する情報を知ること。', 'その写しを受け取ること。', '削除してもらうこと。', '当社による利用への同意を撤回すること。'] },
        { h: '請求の方法', p: ['メールでご連絡ください。ご本人であることを確認したうえで、法律で定められた期間内に対応します。'] },
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
        { h: '取り組んでいること', list: ['端末の「視差効果を減らす」設定を尊重し、アニメーションやエフェクトを止めます。', 'ボタンや画像にスクリーンリーダー用のラベルを付けています。', 'キーボードで操作でき、メニューやダイアログはEscキーで閉じられます。', '8つの言語に対応し、各地域の表記に合わせています。'] },
        { h: '目標', p: ['Web Content Accessibility Guidelines（WCAG）2.2のレベルAAへの準拠を目指しています。まだ完璧ではありませんが、改善を続けています。'] },
        { h: 'お知らせください', p: ['Belluhで使いにくいところがあれば、ぜひ教えてください。いただいた声はすべて読んでいます。'], links: ['アクセシビリティの問題を報告する'] },
      ],
    },
  },
};

const fr: T = {
  updated: 'Dernière mise à jour : {date}',
  closing: 'Cette page explique simplement comment les choses fonctionnent. Ce sont la {privacy} et les {terms} qui font foi.',
  subjects: { story: 'Notre histoire avec Belluh', help: 'Aide', privacy: 'Demande relative à la vie privée', report: 'Signalement', press: 'Presse', security: 'Signalement de sécurité', healthData: 'Demande relative aux données de santé', data: 'Demande relative aux données', optOut: 'Demande d’opposition', accessibility: 'Accessibilité' },
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
    faq: { eyebrow: 'FAQ', title: 'Vos questions, nos réponses.', lede: 'Les questions que les couples nous posent le plus.', parts: [] },
    'trust-and-safety': {
      eyebrow: 'Confiance et sécurité', title: 'Conçu pour qu’on puisse lui confier votre histoire d’amour.', lede: 'Ton journal contient les choses les plus personnelles que tu écriras jamais. Voici comment nous en prenons soin, et comment nous gardons Belluh bienveillant.',
      parts: [
        { h: 'Privé par défaut', p: ['Chaque entrée est partagée ou privée, c’est toi qui choisis. Ton ou ta partenaire ne voit jamais tes entrées privées, et Bella non plus quand elle lui parle.'] },
        { h: 'Tu choisis ce qui devient public', p: ['Les guides restent privés tant que tu n’en décides pas autrement : tu peux garder un guide pour vous deux, le partager avec des amis par lien, ou le publier pour tous les couples. Tu peux changer d’avis à tout moment.'] },
        { h: 'Une communauté bienveillante', p: ['Les guides publiés pour tous doivent porter sur des lieux réels et être écrits de bonne foi. Pas de haine, de harcèlement, de contenu sexuel, d’arnaques ni d’informations privées sur d’autres personnes.'] },
        { h: 'Signaler un problème', p: ['Si tu vois un guide ou autre chose sur Belluh qui enfreint ces règles, ou si quelqu’un utilise Belluh pour te faire du mal, dis-le-nous. Nous lisons chaque signalement.'], links: ['Signaler à Belluh', 'Conseils de sécurité et aide'] },
      ],
    },
    press: {
      eyebrow: 'Espace presse', title: 'Vous écrivez sur Belluh ?', lede: 'Tout ce qu’il vous faut, et une personne à qui parler.',
      parts: [
        { h: 'À propos de Belluh', p: ['Belluh est un journal partagé pour les couples, porté par l’IA. Bella, son IA, retient ce qui compte pour vous deux, planifie des rendez-vous que l’autre peut accepter d’un geste, et vous rappelle les jours importants à l’avance, pour que les couples très occupés restent proches. Belluh est gratuit pour commencer et disponible en huit langues.'] },
        { h: 'Marque', p: ['Nom : Belluh, toujours avec un B majuscule. L’IA s’appelle Bella.', 'Couleurs : bleu Belluh #9BBECB et rose Belluh #F0ADDD.'], links: ['Télécharger le logo (PNG)', 'Télécharger l’icône de l’app (PNG)'] },
        { h: 'Contact presse' },
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
        { h: 'Qui est Bella ?', p: ['L’IA de Belluh. Elle se souvient de ce que tu oublierais, planifie ce que tu remettrais à plus tard, et ne prend jamais parti.'] },
        { h: 'Bella peut-elle dire qui a raison ?', p: ['Non. Elle ne prend jamais parti. Elle pourrait par contre vous proposer un dîner.'] },
        { h: 'Belluh fonctionne-t-il si on vit sur des fuseaux horaires différents ?', p: ['Oui. Belluh garde le fuseau horaire de chacun, pour que les rappels arrivent à la bonne heure pour vous deux.'] },
        { h: 'Quelle est la chose la plus romantique que Belluh puisse faire ?', p: ['Se souvenir d’une chose que ton ou ta partenaire a dite une seule fois, il y a des mois, au moment parfait.'] },
      ],
    },
    security: {
      eyebrow: 'Sécurité', title: 'Comment nous protégeons tes données.', lede: 'La sécurité chez Belluh, en termes simples.',
      parts: [
        { h: 'Qui peut voir quoi', p: ['Des règles de base de données déterminent qui peut lire chaque donnée : ton journal n’est lisible que par les membres de ton cercle, et les entrées privées uniquement par toi. Ces règles s’appliquent sur le serveur, pas seulement dans l’app.'] },
        { h: 'Photos et notes vocales', p: ['Tes photos et notes vocales sont conservées dans un stockage privé. L’app les affiche à l’aide de liens qui expirent peu après leur création, si bien qu’un lien copié cesse de fonctionner.'] },
        { h: 'En transit et au repos', p: ['Belluh est servi uniquement en HTTPS. Les mots de passe sont gérés par notre fournisseur d’authentification et ne sont jamais stockés en clair. Les paiements sont traités par des prestataires de paiement tiers ; nous ne stockons pas les numéros de carte complets.'] },
        { h: 'Signaler une vulnérabilité', p: ['Si tu penses avoir trouvé une faille de sécurité, écris-nous avant de la rendre publique, avec les étapes pour la reproduire. Nous te répondrons, te tiendrons informé et te citerons si tu le souhaites.'], links: ['Signaler un problème de sécurité'] },
      ],
    },
    cookies: {
      eyebrow: 'Cookies', title: 'Cookies et stockage similaire.', lede: 'Ce que Belluh enregistre dans ton navigateur, et pourquoi.',
      parts: [
        { h: 'Ce que nous enregistrons', list: ['Connexion : te garde connecté sur cet appareil.', 'Tes réglages : par exemple ta langue, ton fuseau horaire et l’ouverture ou non de la barre latérale.', 'Ce qui est en cours : une invitation que tu as suivie, ou une question commencée avant de te connecter, pour la retrouver une fois connecté.'] },
        { h: 'Pourquoi', p: ['Ces éléments sont nécessaires au fonctionnement de Belluh, ou pour mémoriser tes choix. La Politique de confidentialité explique tout ce que nous collectons d’autre, y compris les données d’utilisation et d’analyse, et l’usage que nous en faisons.'] },
        { h: 'Tes choix', p: ['Tu peux effacer les données du site dans les réglages de ton navigateur à tout moment. Dans ce cas, tu seras déconnecté et tes réglages sur l’appareil seront réinitialisés.'] },
      ],
    },
    'consumer-health-data': {
      eyebrow: 'Politique de confidentialité des données de santé des consommateurs', title: 'Les informations de santé que tu choisis de partager.', lede: 'Certains États américains, comme l’État de Washington, t’accordent des droits spécifiques sur les données de santé des consommateurs. Cette page explique comment cela s’applique à Belluh.',
      parts: [
        { h: 'Ce qui est concerné', p: ['Belluh n’est pas un service médical. Mais ce que tu écris dans ton journal, ce que tu ressens, comment tu dors, une visite chez le médecin que tu mentionnes, peut contenir des informations sur ta santé. Cette page couvre ces informations.'] },
        { h: 'Comment nous les utilisons', p: ['Uniquement pour faire fonctionner Belluh pour toi : conserver ton journal, et permettre à Bella de t’aider comme le décrit la Politique de confidentialité. Les entrées privées restent privées, y compris vis-à-vis de ton ou ta partenaire.'] },
        { h: 'Tes droits', list: ['Savoir quelles informations de santé nous détenons sur toi.', 'En obtenir une copie.', 'Les faire supprimer.', 'Retirer ton consentement à leur utilisation par nous.'] },
        { h: 'Comment faire une demande', p: ['Écris-nous. Nous vérifierons qu’il s’agit bien de toi et répondrons dans le délai prévu par la loi.'] },
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
        { h: 'Ce que nous faisons', list: ['Respecter le réglage « réduire les animations » de ton appareil : animations et effets s’arrêtent.', 'Étiqueter les boutons et les images pour les lecteurs d’écran.', 'Fonctionner au clavier, et fermer menus et fenêtres avec Échap.', 'Parler huit langues, avec les formats locaux.'] },
        { h: 'Notre objectif', p: ['Nous visons la conformité aux Règles pour l’accessibilité des contenus Web (WCAG) 2.2, niveau AA. Nous n’y sommes pas encore tout à fait, et nous y travaillons.'] },
        { h: 'Dis-le-nous', p: ['Si quelque chose dans Belluh est difficile à utiliser, dis-le-nous. Nous lisons chaque message.'], links: ['Signaler un problème d’accessibilité'] },
      ],
    },
  },
};

const it: T = {
  updated: 'Ultimo aggiornamento: {date}',
  closing: 'Questa pagina spiega in parole semplici come funzionano le cose. Fanno fede l’{privacy} e i {terms}.',
  subjects: { story: 'La nostra storia con Belluh', help: 'Aiuto', privacy: 'Richiesta sulla privacy', report: 'Segnalazione', press: 'Stampa', security: 'Segnalazione di sicurezza', healthData: 'Richiesta sui dati sanitari dei consumatori', data: 'Richiesta sui dati', optOut: 'Richiesta di opposizione', accessibility: 'Accessibilità' },
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
    faq: { eyebrow: 'FAQ', title: 'Domande e risposte.', lede: 'Le domande che le coppie ci fanno più spesso.', parts: [] },
    'trust-and-safety': {
      eyebrow: 'Fiducia e sicurezza', title: 'Fatto per custodire la vostra storia d’amore.', lede: 'Il tuo diario contiene le cose più personali che scriverai mai. Ecco come ce ne prendiamo cura, e come manteniamo Belluh un posto gentile.',
      parts: [
        { h: 'Privato per impostazione', p: ['Ogni pagina è condivisa o privata, decidi tu. Il tuo partner non vede mai le tue pagine private, e nemmeno Bella quando parla con lui o con lei.'] },
        { h: 'Scegli tu cosa rendere pubblico', p: ['Le guide restano private finché non decidi diversamente: puoi tenere una guida per voi due, condividerla con gli amici tramite link o pubblicarla per tutte le coppie. Puoi cambiare idea quando vuoi.'] },
        { h: 'Una comunità gentile', p: ['Le guide pubblicate per tutti devono riguardare luoghi reali ed essere scritte in buona fede. Niente odio, molestie, contenuti sessuali, truffe o informazioni private di altre persone.'] },
        { h: 'Segnala qualcosa', p: ['Se vedi una guida o qualsiasi altra cosa su Belluh che viola queste regole, o se qualcuno usa Belluh per farti del male, diccelo. Leggiamo ogni segnalazione.'], links: ['Segnala a Belluh', 'Consigli di sicurezza e aiuto'] },
      ],
    },
    press: {
      eyebrow: 'Area stampa', title: 'Scrivi di Belluh?', lede: 'Tutto quello che ti serve, e una persona con cui parlare.',
      parts: [
        { h: 'Chi è Belluh', p: ['Belluh è un diario condiviso per coppie, con l’AI. Bella, la sua AI, ricorda ciò che conta per entrambi, organizza appuntamenti che il partner può accettare con un tocco e ricorda in anticipo i giorni importanti, così anche le coppie più impegnate restano vicine. Belluh si inizia gratis ed è disponibile in otto lingue.'] },
        { h: 'Marchio', p: ['Nome: Belluh, sempre con la B maiuscola. L’AI si chiama Bella.', 'Colori: blu Belluh #9BBECB e rosa Belluh #F0ADDD.'], links: ['Scarica il logo (PNG)', 'Scarica l’icona dell’app (PNG)'] },
        { h: 'Contatto stampa' },
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
        { h: 'Chi è Bella?', p: ['L’AI di Belluh. Ricorda quello che dimenticheresti, organizza quello che rimanderesti e non prende mai le parti di nessuno.'] },
        { h: 'Bella può dire chi ha ragione?', p: ['No. Non prende mai le parti di nessuno. Però potrebbe proporvi una cena.'] },
        { h: 'Belluh funziona se viviamo in fusi orari diversi?', p: ['Sì. Belluh tiene conto del fuso orario di ciascuno, così i promemoria arrivano all’ora giusta per entrambi.'] },
        { h: 'Qual è la cosa più romantica che Belluh può fare?', p: ['Ricordare qualcosa che il tuo partner ha detto una volta, mesi fa, esattamente nel momento giusto.'] },
      ],
    },
    security: {
      eyebrow: 'Sicurezza', title: 'Come proteggiamo i tuoi dati.', lede: 'La sicurezza di Belluh, in parole semplici.',
      parts: [
        { h: 'Chi può vedere cosa', p: ['Le regole del database stabiliscono chi può leggere ciascun dato: il tuo diario può essere letto solo dalle persone della tua cerchia, e le pagine private solo da te. Queste regole vengono applicate sul server, non solo nell’app.'] },
        { h: 'Foto e note vocali', p: ['Le tue foto e note vocali sono conservate in uno spazio di archiviazione privato. L’app le mostra tramite link che scadono poco dopo essere stati creati, quindi un link copiato smette di funzionare.'] },
        { h: 'In transito e a riposo', p: ['Belluh è servito solo tramite HTTPS. Le password sono gestite dal nostro fornitore di autenticazione e non vengono mai salvate in chiaro. I pagamenti sono gestiti da processori di pagamento terzi; non conserviamo i numeri completi delle carte.'] },
        { h: 'Segnala una vulnerabilità', p: ['Se pensi di aver trovato un problema di sicurezza, scrivici prima di renderlo pubblico, indicando i passaggi per riprodurlo. Ti risponderemo, ti terremo aggiornato e, se vuoi, ti citeremo.'], links: ['Segnala un problema di sicurezza'] },
      ],
    },
    cookies: {
      eyebrow: 'Cookie policy', title: 'Cookie e archiviazione simile.', lede: 'Cosa salva Belluh nel tuo browser, e perché.',
      parts: [
        { h: 'Cosa salviamo', list: ['Accesso: ti mantiene connesso su questo dispositivo.', 'Le tue impostazioni: ad esempio lingua, fuso orario e se la barra laterale è aperta.', 'Attività in corso: un invito che hai seguito, o una domanda iniziata prima di accedere, così la ritrovi dopo l’accesso.'] },
        { h: 'Perché', p: ['Servono al funzionamento di Belluh o a ricordare le tue scelte. L’Informativa sulla privacy spiega tutto il resto che raccogliamo, compresi i dati di utilizzo e di analisi, e come li usiamo.'] },
        { h: 'Le tue scelte', p: ['Puoi cancellare i dati del sito dalle impostazioni del browser in qualsiasi momento. Se lo fai, verrai disconnesso e le impostazioni sul dispositivo verranno azzerate.'] },
      ],
    },
    'consumer-health-data': {
      eyebrow: 'Informativa sulla privacy dei dati sanitari dei consumatori', title: 'Le informazioni sulla salute che scegli di condividere.', lede: 'Alcuni stati degli USA, come Washington, ti riconoscono diritti specifici sui dati sanitari dei consumatori. Questa pagina spiega come si applicano a Belluh.',
      parts: [
        { h: 'Cosa riguarda', p: ['Belluh non è un servizio medico. Ma quello che scrivi nel diario, come ti senti, come dormi, una visita medica che menzioni, potrebbe includere informazioni sulla tua salute. Questa pagina riguarda quelle informazioni.'] },
        { h: 'Come le usiamo', p: ['Solo per far funzionare Belluh per te: per conservare il tuo diario e perché Bella possa aiutarti come descritto nell’Informativa sulla privacy. Le pagine private restano private, anche per il tuo partner.'] },
        { h: 'I tuoi diritti', list: ['Sapere quali informazioni sulla salute abbiamo su di te.', 'Riceverne una copia.', 'Farle cancellare.', 'Revocare il consenso al loro utilizzo da parte nostra.'] },
        { h: 'Come fare richiesta', p: ['Scrivici un’email. Verificheremo che sia tu e risponderemo entro i tempi previsti dalla legge.'] },
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
        { h: 'Cosa facciamo', list: ['Rispettiamo l’impostazione di riduzione del movimento del tuo dispositivo: animazioni ed effetti si fermano.', 'Etichettiamo pulsanti e immagini per gli screen reader.', 'Funzioniamo da tastiera, e menu e finestre si chiudono con Esc.', 'Parliamo otto lingue, con i formati locali.'] },
        { h: 'Il nostro obiettivo', p: ['Puntiamo a rispettare le Linee guida per l’accessibilità dei contenuti Web (WCAG) 2.2 al livello AA. Non siamo ancora perfetti, e ci stiamo lavorando.'] },
        { h: 'Diccelo', p: ['Se qualcosa in Belluh è difficile da usare, diccelo. Leggiamo ogni messaggio.'], links: ['Segnala un problema di accessibilità'] },
      ],
    },
  },
};

const pt: T = {
  updated: 'Última atualização: {date}',
  closing: 'Esta página explica em palavras simples como as coisas funcionam. Prevalecem a {privacy} e os {terms}.',
  subjects: { story: 'Nossa história com o Belluh', help: 'Ajuda', privacy: 'Solicitação de privacidade', report: 'Denúncia', press: 'Imprensa', security: 'Relato de segurança', healthData: 'Solicitação sobre dados de saúde do consumidor', data: 'Solicitação de dados', optOut: 'Solicitação de opt-out', accessibility: 'Acessibilidade' },
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
    faq: { eyebrow: 'Perguntas frequentes', title: 'Perguntas, respondidas.', lede: 'As perguntas que os casais mais nos fazem.', parts: [] },
    'trust-and-safety': {
      eyebrow: 'Confiança e segurança', title: 'Feito para guardar a história de amor de vocês.', lede: 'Seu diário guarda as coisas mais pessoais que você vai escrever na vida. Veja como cuidamos dele, e como mantemos o Belluh um lugar gentil.',
      parts: [
        { h: 'Privado por padrão', p: ['Cada registro é compartilhado ou privado, você escolhe. Seu par nunca vê seus registros privados, e a Bella também não, quando conversa com ele ou ela.'] },
        { h: 'Você escolhe o que fica público', p: ['Os guias são privados até você decidir o contrário: você pode guardar um guia só para vocês, compartilhar com amigos por link ou publicar para todos os casais. Dá para mudar de ideia a qualquer momento.'] },
        { h: 'Uma comunidade gentil', p: ['Guias publicados para todos precisam ser sobre lugares reais e escritos de boa-fé. Nada de ódio, assédio, conteúdo sexual, golpes ou informações privadas de outras pessoas.'] },
        { h: 'Denuncie', p: ['Se você vir um guia ou qualquer outra coisa no Belluh que quebre essas regras, ou se alguém estiver usando o Belluh para machucar você, conte para a gente. Lemos todas as denúncias.'], links: ['Denunciar ao Belluh', 'Dicas de segurança e ajuda'] },
      ],
    },
    press: {
      eyebrow: 'Imprensa', title: 'Escrevendo sobre o Belluh?', lede: 'Tudo o que você precisa, e uma pessoa para conversar.',
      parts: [
        { h: 'Sobre o Belluh', p: ['O Belluh é um diário compartilhado com IA para casais. A Bella, sua IA, lembra o que importa para vocês dois, planeja encontros que o par pode aceitar com um toque e avisa antes das datas que contam, para que casais ocupados continuem próximos. O Belluh é gratuito para começar e está disponível em oito idiomas.'] },
        { h: 'Marca', p: ['Nome: Belluh, sempre com B maiúsculo. A IA se chama Bella.', 'Cores: azul Belluh #9BBECB e rosa Belluh #F0ADDD.'], links: ['Baixar o logo (PNG)', 'Baixar o ícone do app (PNG)'] },
        { h: 'Contato para imprensa' },
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
        { h: 'Quem é a Bella?', p: ['A IA do Belluh. Ela lembra o que você esqueceria, planeja o que você deixaria para depois e nunca toma partido.'] },
        { h: 'A Bella pode decidir quem tem razão?', p: ['Não. Ela nunca toma partido. Mas pode sugerir um jantar.'] },
        { h: 'O Belluh funciona se a gente mora em fusos horários diferentes?', p: ['Sim. O Belluh guarda o fuso horário de cada um, então os lembretes chegam na hora certa para os dois.'] },
        { h: 'Qual é a coisa mais romântica que o Belluh pode fazer?', p: ['Lembrar de algo que seu par disse uma única vez, meses atrás, exatamente na hora certa.'] },
      ],
    },
    security: {
      eyebrow: 'Segurança', title: 'Como protegemos seus dados.', lede: 'A segurança no Belluh, em palavras simples.',
      parts: [
        { h: 'Quem pode ver o quê', p: ['Regras do banco de dados definem quem pode ler cada dado: seu diário só pode ser lido pelas pessoas do seu círculo, e os registros privados só por você. Essas regras rodam no servidor, não apenas no app.'] },
        { h: 'Fotos e mensagens de voz', p: ['Suas fotos e mensagens de voz ficam em um armazenamento privado. O app as exibe usando links que expiram pouco depois de criados, então um link copiado para de funcionar.'] },
        { h: 'Em trânsito e em repouso', p: ['O Belluh é servido apenas por HTTPS. As senhas são gerenciadas pelo nosso provedor de autenticação e nunca são armazenadas em texto simples. Os pagamentos são processados por processadores de pagamento terceirizados; não armazenamos números completos de cartão.'] },
        { h: 'Relate uma vulnerabilidade', p: ['Se você acredita ter encontrado um problema de segurança, envie um e-mail para a gente antes de divulgá-lo publicamente, com os passos para reproduzi-lo. Vamos responder, manter você atualizado e dar o crédito a você, se quiser.'], links: ['Relatar um problema de segurança'] },
      ],
    },
    cookies: {
      eyebrow: 'Política de cookies', title: 'Cookies e armazenamento semelhante.', lede: 'O que o Belluh guarda no seu navegador, e por quê.',
      parts: [
        { h: 'O que guardamos', list: ['Login: mantém você conectado neste dispositivo.', 'Suas configurações: coisas como seu idioma, fuso horário e se a barra lateral está aberta.', 'Coisas em andamento: um convite que você seguiu, ou uma pergunta que começou antes de entrar, para que continue lá depois que você entrar.'] },
        { h: 'Por quê', p: ['Eles são necessários para o Belluh funcionar ou para lembrar suas escolhas. A Política de Privacidade explica tudo o mais que coletamos, incluindo dados de uso e de análise, e como os usamos.'] },
        { h: 'Suas escolhas', p: ['Você pode limpar os dados do site nas configurações do navegador a qualquer momento. Se fizer isso, você será desconectado e as configurações do dispositivo serão redefinidas.'] },
      ],
    },
    'consumer-health-data': {
      eyebrow: 'Política de privacidade de dados de saúde do consumidor', title: 'Informações de saúde que você escolhe compartilhar.', lede: 'Alguns estados dos EUA, como Washington, dão a você direitos específicos sobre dados de saúde do consumidor. Esta página explica como isso se aplica ao Belluh.',
      parts: [
        { h: 'O que isto abrange', p: ['O Belluh não é um serviço médico. Mas o que você escreve no diário, como se sente, como está dormindo, uma consulta médica que menciona, pode incluir informações sobre sua saúde. Esta página trata dessas informações.'] },
        { h: 'Como as usamos', p: ['Apenas para operar o Belluh para você: para guardar seu diário e para que a Bella ajude você como descrito na Política de Privacidade. Os registros privados continuam privados, inclusive para seu par.'] },
        { h: 'Seus direitos', list: ['Saber quais informações de saúde temos sobre você.', 'Obter uma cópia delas.', 'Pedir que sejam excluídas.', 'Retirar seu consentimento para que as usemos.'] },
        { h: 'Como pedir', p: ['Envie um e-mail para a gente. Vamos confirmar que é você e responder dentro do prazo que a lei exige.'] },
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
        { h: 'O que fazemos', list: ['Respeitamos a configuração de redução de movimento do seu dispositivo: animações e efeitos param.', 'Identificamos botões e imagens para leitores de tela.', 'Funcionamos pelo teclado, e menus e janelas fecham com Esc.', 'Falamos oito idiomas, com formatos locais.'] },
        { h: 'Nosso objetivo', p: ['Buscamos atender às Diretrizes de Acessibilidade para Conteúdo Web (WCAG) 2.2, nível AA. Ainda não somos perfeitos, e estamos trabalhando nisso.'] },
        { h: 'Conte para a gente', p: ['Se algo no Belluh for difícil de usar, conte para a gente. Lemos todas as mensagens.'], links: ['Relatar um problema de acessibilidade'] },
      ],
    },
  },
};

const zh: T = {
  updated: '最后更新：{date}',
  closing: '本页用通俗的语言说明各项功能如何运作。具体以{privacy}和{terms}为准。',
  subjects: { story: '我们的 Belluh 故事', help: '求助', privacy: '隐私请求', report: '举报', press: '媒体咨询', security: '安全问题报告', healthData: '消费者健康数据请求', data: '数据请求', optOut: '选择退出请求', accessibility: '无障碍' },
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
    faq: { eyebrow: '常见问题', title: '你问，我们答。', lede: '情侣们问得最多的问题。', parts: [] },
    'trust-and-safety': {
      eyebrow: '信任与安全', title: '值得托付你们爱情故事的地方。', lede: '你的日记里，装着你这辈子写下的最私人的东西。这里说说我们如何守护它，又如何让 Belluh 保持友善。',
      parts: [
        { h: '默认私密', p: ['每条日记是共享还是私密，由你决定。你的另一半永远看不到你的私密日记，Bella 和对方聊天时也看不到。'] },
        { h: '公开什么，由你决定', p: ['攻略在你决定之前都是私密的：你可以只留给你们两个人，通过链接分享给朋友，或发布给所有情侣。你随时可以改变主意。'] },
        { h: '让社区保持友善', p: ['公开发布的攻略必须关于真实的地点，并且出于善意撰写。禁止仇恨、骚扰、色情内容、诈骗或他人的隐私信息。'] },
        { h: '举报', p: ['如果你在 Belluh 上看到违反这些规则的攻略或其他内容，或者有人利用 Belluh 伤害你，请告诉我们。每一条举报我们都会看。'], links: ['向 Belluh 举报', '安全提示与求助'] },
      ],
    },
    press: {
      eyebrow: '媒体资源', title: '要写 Belluh？', lede: '你需要的都在这里，还有专人可以联系。',
      parts: [
        { h: '关于 Belluh', p: ['Belluh 是一款面向情侣的 AI 共享日记。它的 AI Bella 会记住对你们两人重要的事，安排另一半一键就能接受的约会，并在重要日子到来前提醒你，让忙碌的情侣也能保持亲密。Belluh 可免费开始使用，支持八种语言。'] },
        { h: '品牌', p: ['名称：Belluh，B 始终大写。AI 的名字是 Bella。', '品牌色：Belluh 蓝 #9BBECB，Belluh 粉 #F0ADDD。'], links: ['下载标志（PNG）', '下载应用图标（PNG）'] },
        { h: '媒体联系' },
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
        { h: 'Bella 是谁？', p: ['Belluh 的 AI。她记得你会忘的事，安排你会拖的事，而且从不偏袒任何一方。'] },
        { h: 'Bella 能评评谁对谁错吗？', p: ['不能。她从不偏袒任何一方。不过，她可能会建议你们一起去吃顿饭。'] },
        { h: '我们在不同时区，Belluh 还能用吗？', p: ['能。Belluh 会分别记住你们各自的时区，提醒会在对你们两人都合适的时间送达。'] },
        { h: 'Belluh 能做的最浪漫的事是什么？', p: ['在恰好的时刻，想起你的另一半几个月前只说过一次的话。'] },
      ],
    },
    security: {
      eyebrow: '数据安全', title: '我们如何保护你的数据。', lede: '用通俗的话讲 Belluh 的安全。',
      parts: [
        { h: '谁能看到什么', p: ['数据库规则决定每一条数据谁可以读取：你的日记只有你圈子里的人能读，私密日记只有你自己能读。这些规则在服务器上运行，而不只是在应用里。'] },
        { h: '照片和语音', p: ['你的照片和语音保存在私有存储中。应用通过生成后不久就会失效的链接来显示它们，所以复制出去的链接会失效。'] },
        { h: '传输中与存储时', p: ['Belluh 仅通过 HTTPS 提供服务。密码由我们的身份验证服务商处理，绝不会以明文存储。付款由第三方支付处理商处理；我们不存储完整的卡号。'] },
        { h: '报告漏洞', p: ['如果你认为发现了安全问题，请在公开之前先发邮件告诉我们，并附上复现步骤。我们会回复你、随时告知进展，如果你愿意，还会公开致谢。'], links: ['报告安全问题'] },
      ],
    },
    cookies: {
      eyebrow: 'Cookie 政策', title: 'Cookie 及类似存储。', lede: 'Belluh 在你的浏览器里存储了什么，以及为什么。',
      parts: [
        { h: '我们存储的内容', list: ['登录：让你在这台设备上保持登录。', '你的设置：比如语言、时区，以及侧边栏是否展开。', '进行中的内容：你点开的邀请，或登录前开始写的问题，登录后依然还在。'] },
        { h: '原因', p: ['这些是 Belluh 正常运行或记住你的选择所必需的。我们收集的其他所有信息，包括使用和分析数据，以及我们如何使用它们，请见隐私政策。'] },
        { h: '你的选择', p: ['你可以随时在浏览器设置中清除网站数据。清除后，你会退出登录，设备上的设置也会重置。'] },
      ],
    },
    'consumer-health-data': {
      eyebrow: '消费者健康数据隐私政策', title: '你选择分享的健康信息。', lede: '美国的一些州（例如华盛顿州）赋予你关于消费者健康数据的特定权利。本页说明这些规定如何适用于 Belluh。',
      parts: [
        { h: '适用范围', p: ['Belluh 不是医疗服务。但你在日记里写的内容，比如你的感受、睡眠情况、你提到的一次看病，可能包含与你健康有关的信息。本页适用于这类信息。'] },
        { h: '我们如何使用', p: ['仅用于为你提供 Belluh 服务：保存你的日记，以及让 Bella 按隐私政策所述的方式帮助你。私密日记始终私密，对你的另一半也是如此。'] },
        { h: '你的权利', list: ['了解我们持有哪些关于你的健康信息。', '获取一份副本。', '要求删除。', '撤回你对我们使用这些信息的同意。'] },
        { h: '如何提出请求', p: ['给我们发邮件。我们会确认是你本人，并在法律规定的期限内答复。'] },
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
        { h: '我们做了什么', list: ['遵从设备的“减弱动态效果”设置：动画和特效会停止。', '为屏幕阅读器标注按钮和图片。', '支持键盘操作，按 Esc 可关闭菜单和对话框。', '支持八种语言，并采用当地格式。'] },
        { h: '我们的目标', p: ['我们的目标是达到《Web 内容无障碍指南》（WCAG）2.2 的 AA 级。我们还不完美，正在持续改进。'] },
        { h: '告诉我们', p: ['如果 Belluh 有什么地方不好用，请告诉我们。每一条反馈我们都会看。'], links: ['报告无障碍问题'] },
      ],
    },
  },
};

const de: T = {
  updated: 'Zuletzt aktualisiert: {date}',
  closing: 'Diese Seite erklärt in einfachen Worten, wie alles funktioniert. Maßgeblich sind die {privacy} und die {terms}.',
  subjects: { story: 'Unsere Belluh-Geschichte', help: 'Hilfe', privacy: 'Datenschutzanfrage', report: 'Meldung', press: 'Presse', security: 'Sicherheitsmeldung', healthData: 'Anfrage zu Gesundheitsdaten von Verbrauchern', data: 'Datenanfrage', optOut: 'Widerspruch', accessibility: 'Barrierefreiheit' },
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
    faq: { eyebrow: 'FAQ', title: 'Fragen und Antworten.', lede: 'Die Fragen, die Paare uns am häufigsten stellen.', parts: [] },
    'trust-and-safety': {
      eyebrow: 'Vertrauen & Sicherheit', title: 'Gebaut, damit ihr ihm eure Liebesgeschichte anvertrauen könnt.', lede: 'In deinem Tagebuch steht das Persönlichste, was du je aufschreiben wirst. So passen wir darauf auf, und so halten wir Belluh freundlich.',
      parts: [
        { h: 'Standardmäßig privat', p: ['Jeder Eintrag ist geteilt oder privat, du entscheidest. Dein Partner oder deine Partnerin sieht deine privaten Einträge nie, und Bella auch nicht, wenn sie mit ihm oder ihr spricht.'] },
        { h: 'Du entscheidest, was öffentlich wird', p: ['Guides sind privat, bis du es anders entscheidest: Du kannst einen Guide für euch behalten, ihn per Link mit Freunden teilen oder für alle Paare veröffentlichen. Du kannst es dir jederzeit anders überlegen.'] },
        { h: 'Damit die Community freundlich bleibt', p: ['Guides, die für alle veröffentlicht werden, müssen von echten Orten handeln und in gutem Glauben geschrieben sein. Kein Hass, keine Belästigung, keine sexuellen Inhalte, keine Betrugsmaschen und keine privaten Informationen über andere.'] },
        { h: 'Etwas melden', p: ['Wenn du einen Guide oder etwas anderes auf Belluh siehst, das gegen diese Regeln verstößt, oder wenn jemand Belluh nutzt, um dir zu schaden, sag es uns. Wir lesen jede Meldung.'], links: ['An Belluh melden', 'Sicherheitstipps und Hilfe'] },
      ],
    },
    press: {
      eyebrow: 'Presse', title: 'Du schreibst über Belluh?', lede: 'Alles, was du brauchst, und ein Mensch zum Reden.',
      parts: [
        { h: 'Über Belluh', p: ['Belluh ist ein gemeinsames KI-Tagebuch für Paare. Bella, die KI von Belluh, merkt sich, was euch beiden wichtig ist, plant Dates, die der Partner mit einem Tippen annehmen kann, und erinnert vor den Tagen, die zählen, damit auch vielbeschäftigte Paare einander nah bleiben. Belluh ist zum Start kostenlos und in acht Sprachen verfügbar.'] },
        { h: 'Marke', p: ['Name: Belluh, immer mit großem B. Die KI heißt Bella.', 'Farben: Belluh-Blau #9BBECB und Belluh-Rosa #F0ADDD.'], links: ['Logo herunterladen (PNG)', 'App-Icon herunterladen (PNG)'] },
        { h: 'Pressekontakt' },
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
        { h: 'Wer ist Bella?', p: ['Die KI von Belluh. Sie merkt sich, was du vergessen würdest, plant, was du aufschieben würdest, und ergreift nie Partei.'] },
        { h: 'Kann Bella entscheiden, wer recht hat?', p: ['Nein. Sie ergreift nie Partei. Ein Abendessen schlägt sie vielleicht aber vor.'] },
        { h: 'Funktioniert Belluh, wenn wir in verschiedenen Zeitzonen leben?', p: ['Ja. Belluh kennt die Zeitzone von jedem von euch, damit Erinnerungen für euch beide zur richtigen Stunde ankommen.'] },
        { h: 'Was ist das Romantischste, was Belluh tun kann?', p: ['Sich an etwas erinnern, das dein Partner vor Monaten ein einziges Mal gesagt hat, genau im richtigen Moment.'] },
      ],
    },
    security: {
      eyebrow: 'Sicherheit', title: 'Wie wir deine Daten schützen.', lede: 'Sicherheit bei Belluh, in einfachen Worten.',
      parts: [
        { h: 'Wer was sehen kann', p: ['Datenbankregeln legen fest, wer welche Daten lesen darf: Dein Tagebuch können nur die Menschen in deinem Kreis lesen, private Einträge nur du. Diese Regeln greifen auf dem Server, nicht nur in der App.'] },
        { h: 'Fotos und Sprachnachrichten', p: ['Deine Fotos und Sprachnachrichten liegen in privatem Speicher. Die App zeigt sie über Links an, die kurz nach ihrer Erstellung ablaufen, sodass ein kopierter Link nicht mehr funktioniert.'] },
        { h: 'Bei der Übertragung und gespeichert', p: ['Belluh wird nur über HTTPS ausgeliefert. Passwörter verwaltet unser Authentifizierungsanbieter, und sie werden nie im Klartext gespeichert. Zahlungen werden von externen Zahlungsdienstleistern abgewickelt; wir speichern keine vollständigen Kartennummern.'] },
        { h: 'Eine Sicherheitslücke melden', p: ['Wenn du glaubst, ein Sicherheitsproblem gefunden zu haben, schreib uns bitte eine E-Mail, bevor du es öffentlich machst, mit den Schritten, um es nachzustellen. Wir antworten, halten dich auf dem Laufenden und nennen dich auf Wunsch namentlich.'], links: ['Sicherheitsproblem melden'] },
      ],
    },
    cookies: {
      eyebrow: 'Cookie-Richtlinie', title: 'Cookies und ähnliche Speicher.', lede: 'Was Belluh in deinem Browser speichert, und warum.',
      parts: [
        { h: 'Was wir speichern', list: ['Anmeldung: Hält dich auf diesem Gerät angemeldet.', 'Deine Einstellungen: etwa deine Sprache, deine Zeitzone und ob die Seitenleiste offen ist.', 'Angefangenes: eine Einladung, der du gefolgt bist, oder eine Frage, die du vor der Anmeldung begonnen hast, damit sie nach der Anmeldung noch da ist.'] },
        { h: 'Warum', p: ['Sie sind nötig, damit Belluh funktioniert oder sich deine Entscheidungen merkt. Die Datenschutzerklärung erklärt alles andere, was wir erheben, einschließlich Nutzungs- und Analysedaten, und wie wir es verwenden.'] },
        { h: 'Deine Wahl', p: ['Du kannst Websitedaten jederzeit in deinen Browsereinstellungen löschen. Dann wirst du abgemeldet, und deine Einstellungen auf dem Gerät werden zurückgesetzt.'] },
      ],
    },
    'consumer-health-data': {
      eyebrow: 'Datenschutzrichtlinie für Gesundheitsdaten von Verbrauchern', title: 'Gesundheitsinformationen, die du teilen möchtest.', lede: 'Einige US-Bundesstaaten, etwa Washington, geben dir besondere Rechte an Gesundheitsdaten von Verbrauchern. Diese Seite erklärt, wie das für Belluh gilt.',
      parts: [
        { h: 'Worum es geht', p: ['Belluh ist kein medizinischer Dienst. Aber was du in dein Tagebuch schreibst, wie du dich fühlst, wie du schläfst, ein Arztbesuch, den du erwähnst, kann Informationen über deine Gesundheit enthalten. Diese Seite betrifft solche Informationen.'] },
        { h: 'Wie wir sie verwenden', p: ['Nur, um Belluh für dich zu betreiben: um dein Tagebuch zu speichern und damit Bella dir hilft, wie in der Datenschutzerklärung beschrieben. Private Einträge bleiben privat, auch gegenüber deinem Partner oder deiner Partnerin.'] },
        { h: 'Deine Rechte', list: ['Erfahren, welche Gesundheitsinformationen wir über dich haben.', 'Eine Kopie davon erhalten.', 'Sie löschen lassen.', 'Deine Einwilligung in unsere Nutzung widerrufen.'] },
        { h: 'So stellst du eine Anfrage', p: ['Schreib uns eine E-Mail. Wir bestätigen, dass du es bist, und antworten innerhalb der gesetzlich vorgeschriebenen Frist.'] },
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
  subjects: { story: 'Nuestra historia con Belluh', help: 'Ayuda', privacy: 'Solicitud de privacidad', report: 'Denuncia', press: 'Prensa', security: 'Informe de seguridad', healthData: 'Solicitud sobre datos de salud del consumidor', data: 'Solicitud de datos', optOut: 'Solicitud de exclusión', accessibility: 'Accesibilidad' },
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
    faq: { eyebrow: 'Preguntas frecuentes', title: 'Preguntas, respondidas.', lede: 'Las preguntas que más nos hacen las parejas.', parts: [] },
    'trust-and-safety': {
      eyebrow: 'Confianza y seguridad', title: 'Hecho para que le confíes vuestra historia de amor.', lede: 'Tu diario guarda las cosas más personales que vas a escribir nunca. Así lo cuidamos, y así mantenemos Belluh como un lugar amable.',
      parts: [
        { h: 'Privado por defecto', p: ['Cada entrada es compartida o privada, tú decides. Tu pareja nunca ve tus entradas privadas, y Bella tampoco cuando habla con ella.'] },
        { h: 'Tú eliges qué se hace público', p: ['Las guías son privadas hasta que decidas lo contrario: puedes guardar una guía para vosotros, compartirla con amigos mediante un enlace o publicarla para todas las parejas. Puedes cambiar de opinión cuando quieras.'] },
        { h: 'Una comunidad amable', p: ['Las guías publicadas para todos deben tratar sobre lugares reales y estar escritas de buena fe. Nada de odio, acoso, contenido sexual, estafas ni información privada de otras personas.'] },
        { h: 'Denunciar algo', p: ['Si ves una guía o cualquier otra cosa en Belluh que incumpla estas normas, o alguien está usando Belluh para hacerte daño, cuéntanoslo. Leemos todas las denuncias.'], links: ['Denunciar a Belluh', 'Consejos de seguridad y ayuda'] },
      ],
    },
    press: {
      eyebrow: 'Prensa', title: '¿Escribes sobre Belluh?', lede: 'Todo lo que necesitas, y una persona con quien hablar.',
      parts: [
        { h: 'Sobre Belluh', p: ['Belluh es un diario compartido con IA para parejas. Bella, su IA, recuerda lo que os importa a los dos, organiza citas que tu pareja puede aceptar con un toque y te avisa antes de los días que cuentan, para que las parejas ocupadas sigan cerca. Belluh es gratis para empezar y está disponible en ocho idiomas.'] },
        { h: 'Marca', p: ['Nombre: Belluh, siempre con B mayúscula. La IA se llama Bella.', 'Colores: azul Belluh #9BBECB y rosa Belluh #F0ADDD.'], links: ['Descargar el logotipo (PNG)', 'Descargar el icono de la app (PNG)'] },
        { h: 'Contacto de prensa' },
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
        { h: '¿Quién es Bella?', p: ['La IA de Belluh. Recuerda lo que tú olvidarías, planea lo que tú dejarías para luego y nunca toma partido.'] },
        { h: '¿Puede Bella decidir quién tiene razón?', p: ['No. Nunca toma partido. Aunque quizá os proponga ir a cenar.'] },
        { h: '¿Funciona Belluh si vivimos en zonas horarias distintas?', p: ['Sí. Belluh guarda la zona horaria de cada uno, para que los recordatorios lleguen a la hora adecuada para los dos.'] },
        { h: '¿Qué es lo más romántico que puede hacer Belluh?', p: ['Recordar algo que tu pareja dijo una sola vez, hace meses, justo en el momento adecuado.'] },
      ],
    },
    security: {
      eyebrow: 'Seguridad', title: 'Cómo protegemos tus datos.', lede: 'La seguridad en Belluh, con palabras sencillas.',
      parts: [
        { h: 'Quién puede ver qué', p: ['Las reglas de la base de datos deciden quién puede leer cada dato: tu diario solo pueden leerlo las personas de tu círculo, y las entradas privadas solo tú. Estas reglas se aplican en el servidor, no solo en la app.'] },
        { h: 'Fotos y notas de voz', p: ['Tus fotos y notas de voz se guardan en un almacenamiento privado. La app las muestra mediante enlaces que caducan poco después de crearse, así que un enlace copiado deja de funcionar.'] },
        { h: 'En tránsito y en reposo', p: ['Belluh se sirve solo a través de HTTPS. Las contraseñas las gestiona nuestro proveedor de autenticación y nunca se guardan en texto plano. Los pagos los gestionan procesadores de pago externos; no guardamos números de tarjeta completos.'] },
        { h: 'Informar de una vulnerabilidad', p: ['Si crees que has encontrado un problema de seguridad, escríbenos antes de hacerlo público, con los pasos para reproducirlo. Te responderemos, te mantendremos al tanto y te daremos el reconocimiento si lo deseas.'], links: ['Informar de un problema de seguridad'] },
      ],
    },
    cookies: {
      eyebrow: 'Política de cookies', title: 'Cookies y almacenamiento similar.', lede: 'Qué guarda Belluh en tu navegador, y por qué.',
      parts: [
        { h: 'Qué guardamos', list: ['Inicio de sesión: mantiene tu sesión iniciada en este dispositivo.', 'Tus ajustes: cosas como tu idioma, tu zona horaria y si la barra lateral está abierta.', 'Lo que tienes a medias: una invitación que seguiste, o una pregunta que empezaste antes de iniciar sesión, para que siga ahí después de iniciarla.'] },
        { h: 'Por qué', p: ['Son necesarias para que Belluh funcione o para recordar tus elecciones. La Política de privacidad explica todo lo demás que recopilamos, incluidos los datos de uso y analítica, y cómo lo usamos.'] },
        { h: 'Tus opciones', p: ['Puedes borrar los datos del sitio desde los ajustes de tu navegador en cualquier momento. Si lo haces, se cerrará tu sesión y se restablecerán los ajustes de tu dispositivo.'] },
      ],
    },
    'consumer-health-data': {
      eyebrow: 'Política de privacidad de datos de salud del consumidor', title: 'La información de salud que eliges compartir.', lede: 'Algunos estados de EE. UU., como Washington, te otorgan derechos específicos sobre los datos de salud del consumidor. Esta página explica cómo se aplica a Belluh.',
      parts: [
        { h: 'Qué abarca', p: ['Belluh no es un servicio médico. Pero lo que escribes en tu diario, cómo te sientes, cómo duermes, una visita al médico que mencionas, puede incluir información sobre tu salud. Esta página trata de esa información.'] },
        { h: 'Cómo la usamos', p: ['Solo para hacer funcionar Belluh para ti: para guardar tu diario y para que Bella te ayude como se describe en la Política de privacidad. Las entradas privadas siguen siendo privadas, también para tu pareja.'] },
        { h: 'Tus derechos', list: ['Saber qué información de salud tenemos sobre ti.', 'Obtener una copia.', 'Pedir que se elimine.', 'Retirar tu consentimiento para que la usemos.'] },
        { h: 'Cómo solicitarlo', p: ['Escríbenos un correo. Confirmaremos que eres tú y responderemos dentro del plazo que exige la ley.'] },
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
        { h: 'Lo que hacemos', list: ['Respetar el ajuste de movimiento reducido de tu dispositivo: las animaciones y los efectos se detienen.', 'Etiquetar botones e imágenes para lectores de pantalla.', 'Funcionar con teclado, y cerrar menús y diálogos con Esc.', 'Hablar ocho idiomas, con formatos locales.'] },
        { h: 'Nuestro objetivo', p: ['Aspiramos a cumplir las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2 en el nivel AA. Aún no somos perfectos, y estamos trabajando en ello.'] },
        { h: 'Cuéntanoslo', p: ['Si algo en Belluh es difícil de usar, cuéntanoslo. Leemos todos los mensajes.'], links: ['Informar de un problema de accesibilidad'] },
      ],
    },
  },
};

const t: UiTable<T> = {
  en, ja, fr, it, pt, zh, de, es,
  // Mexico: ustedes rather than vosotros, celular, and Mexico's own emergency and support lines
  'es-MX': {
    // Mexico's names for the policies are masculine: el Aviso de privacidad, los Términos de servicio
    closing: 'Esta página explica con palabras sencillas cómo funcionan las cosas. Prevalecen el {privacy} y los {terms}.',
    docs: {
      ...es.docs,
      newsroom: { ...es.docs.newsroom, parts: es.docs.newsroom.parts.map((x, i) => i === 3 ? { ...x, h: '{date}: su mapa del amor' } : x) },
      'trust-and-safety': {
        ...es.docs['trust-and-safety'], title: 'Hecho para que le confíes su historia de amor.',
        parts: es.docs['trust-and-safety'].parts.map((x, i) => i === 1 ? { ...x, p: ['Las guías son privadas hasta que decidas lo contrario: puedes guardar una guía solo para ustedes, compartirla con amigos mediante un enlace o publicarla para todas las parejas. Puedes cambiar de opinión cuando quieras.'] } : x),
      },
      press: { ...es.docs.press, parts: es.docs.press.parts.map((x, i) => i === 0 ? { ...x, p: ['Belluh es un diario compartido con IA para parejas. Bella, su IA, recuerda lo que les importa a los dos, organiza citas que tu pareja puede aceptar con un toque y te avisa antes de los días que cuentan, para que las parejas ocupadas sigan cerca. Belluh es gratis para empezar y está disponible en ocho idiomas.'] } : x) },
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
