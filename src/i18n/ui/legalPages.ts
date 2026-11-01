// The words on Belluh's legal pages (src/pages/company/LegalPage.tsx): the frame around the Privacy Policy and Terms
// of Service (which stay in English, the binding version), and the Cookie Policy, Consumer Health Data Privacy Policy
// and Security page in full. Every claim is true of Belluh today; translations add or remove nothing.
// Tokens in braces become links in the page: {center} opens the Privacy Preference Center, {privacy} and {terms} open
// those documents, {choices} goes to Your privacy choices, {email} is the address the page writes to.
import type { UiTable } from '../ui';

export type Item = string | { q: string } | { note: string } | { list: string[] } | { table: { head: string[]; rows: string[][] } };
export type Sec = { h: string; items: Item[] };
export type Policy = { title: string; intro: Item[]; sections: Sec[] };
export type SecurityT = {
  title: string; lede: string; art: string; intro: string; practices: { h: string; p: string }[];
  complianceH: string; badgesArt: string; compliance: string[]; note: string; contactH: string; contact: string;
};
type T = {
  contents: string; effective: string; updated: string; bindingNote: string; storedAs: string; none: string;
  titles: { privacy: string; terms: string };
  ccpa: { category: string; collected: string; sold: string };
  links: { center: string; privacy: string; terms: string; choices: string };
  subjects: { cookies: string; health: string; security: string };
  cookies: Policy; health: Policy; security: SecurityT;
};

const en: T = {
  contents: 'Contents',
  effective: 'Effective {date}',
  updated: 'Last updated {date}',
  bindingNote: 'This document is in English, and the English version is the binding one.',
  storedAs: 'Stored as',
  none: 'None',
  titles: { privacy: 'Privacy Policy', terms: 'Terms of Service' },
  ccpa: { category: 'Category', collected: 'Collected', sold: 'Sold or shared' },
  links: { center: 'Privacy Preference Center', privacy: 'Privacy Policy', terms: 'Terms of Service', choices: 'Your privacy choices' },
  subjects: { cookies: 'Cookie question', health: 'Consumer health data request', security: 'Security report' },
  cookies: {
    title: 'Cookie Policy',
    intro: [
      'This policy explains how Belluh uses cookies and similar technologies on belluh.com and in the Belluh web app, what each one is for, and the choices you have. It sits alongside our {privacy}, which covers everything else about your information.',
      { q: 'Already know how cookies work?' },
      'Go straight to the {center} to see and change your choices at any time.',
    ],
    sections: [
      { h: 'What are cookies?', items: ['Cookies are small text files a website saves in your browser so it can recognize your device on a later visit. They can keep you signed in, remember your settings, or help a site understand how it is used.'] },
      { h: 'First-party and third-party cookies', items: ['First-party cookies are set by the site you are visiting, here belluh.com. Third-party cookies are set by a different company, often to follow people from site to site for advertising.', 'Belluh’s own storage is first party. If you allow “Improving Belluh”, Google Analytics and Mixpanel also store identifiers on your device to count visits; they are set on belluh.com and are not used for advertising. Belluh does not use advertising cookies.'] },
      { h: 'Session and persistent cookies', items: ['Session cookies disappear when you close your browser. Persistent cookies stay until they expire or you delete them, which is how a site remembers you between visits.'] },
      {
        h: 'Other technologies',
        items: [
          'For its own storage, Belluh uses your browser’s local storage rather than cookies. Local storage works much like a cookie, but it is not sent to our servers with every request: it stays on your device until it is cleared. Session storage is the same, except that it is cleared when you close the tab. In this policy, “cookies” means all of these.',
          { note: 'Some parts of Belluh load content from other services, such as fonts and map images. Those services receive the standard information that comes with any web request, like your IP address, so they can deliver it.' },
        ],
      },
      {
        h: 'How Belluh uses them',
        items: [
          'We store only what Belluh needs to work and to remember your choices. These are all the categories we use.',
          { table: { head: ['Category', 'What it does on Belluh'], rows: [
            ['Strictly necessary', 'Keeps you signed in and your session secure on this device. Also remembers an invite you followed or a question you started before signing in, so it is waiting for you afterwards. Belluh cannot work without these.'],
            ['Preferences', 'Remembers your language, your time zone and your layout, such as whether the sidebar is open and which space you used last. Also your settings on this device, whether places are on for your love map, and small things like cards you dismissed, so Belluh opens the way you left it.'],
            ['Measurement', 'Remembers which button on our site brought you in, for up to 7 days. With your permission (“Improving Belluh”), Belluh records which features you use in its own database while you are signed in, and Google Analytics (_ga, _ga_<id>, up to 2 years) and Mixpanel (mp_<token>_mixpanel) count visits and feature use. Off until you allow it in the EEA, UK and Switzerland, and off when your browser sends Global Privacy Control.'],
            ['Advertising', 'Not used. Belluh has no advertising cookies and no ad trackers.'],
          ] } },
        ],
      },
      {
        h: 'How to control them',
        items: [
          'Open the {center} to review your choices at any time. Strictly necessary storage is always on, because Belluh cannot keep you signed in without it.',
          'You can also clear or block site data in your browser settings. Clearing it signs you out and resets the settings saved on this device. If you block it, you can still use Belluh, but you will need to sign in again on every visit.',
        ],
      },
      { h: 'Changes to this policy', items: ['If what we store changes, we will update this page and the date at the top.'] },
      { h: 'How to contact us', items: ['Questions about cookies or your privacy? Write to us at {email}.'] },
    ],
  },
  health: {
    title: 'Consumer Health Data Privacy Policy',
    intro: [
      'Some U.S. states, such as Washington, give people specific rights over their consumer health data. This policy explains what that means at Belluh: what health information may end up in Belluh, where it comes from, how we use and share it, and how to exercise your rights. It adds to our {privacy}.',
      { note: 'Belluh is not a medical service. It does not diagnose, treat or give medical advice.' },
    ],
    sections: [
      { h: 'What this policy covers', items: ['Consumer health data is personal information that is linked, or could reasonably be linked, to your past, present or future physical or mental health.', 'Belluh never asks you for health information. But a journal is personal, and what you write in it may include some. This policy covers that information wherever it appears in Belluh.'] },
      {
        h: 'Categories we may collect',
        items: [{ list: [
          'Feelings and moods you describe in journal entries or tell Bella.',
          'Mentions of sleep, stress, illness, medication or medical appointments in what you write.',
          'Voice notes and photos you add, which could reveal something about your health.',
          'Notes Bella keeps about what matters to you, when they touch on your health.',
        ] }],
      },
      {
        h: 'Where it comes from',
        items: [{ list: [
          'From you, when you write entries, record voice notes, add photos or talk with Bella.',
          'From your partner, when they write a shared entry in your circle that mentions you.',
          'From Bella, when she draws a conclusion from what you have shared in order to help you, such as noticing a stressful week.',
        ] }],
      },
      {
        h: 'How we use it',
        items: [
          { list: [
            'To keep your journal and show it to you, and shared entries to your circle.',
            'For Bella to answer you, remember details and suggest plans, as described in our {privacy}.',
            'To keep Belluh secure and prevent abuse.',
            'To comply with the law.',
          ] },
          'We do not use consumer health data for advertising.',
        ],
      },
      {
        h: 'Who we share it with',
        items: [
          { list: [
            'Your partner or circle, only for entries you choose to share. Private entries stay private, including from your partner and from Bella when she talks with them.',
            'Service providers that run Belluh on our behalf, such as our hosting and database provider and the AI providers that power Bella, under contracts that limit how they may use it.',
            'Authorities, when the law requires it.',
          ] },
          'We do not sell consumer health data.',
        ],
      },
      {
        h: 'Your rights',
        items: [
          'Depending on where you live, you have the right to:',
          { list: [
            'Confirm whether we collect, share or sell your consumer health data, and see it.',
            'Get a list of the third parties we have shared it with.',
            'Withdraw your consent to our collecting or sharing it.',
            'Have it deleted.',
            'Appeal if we turn down your request.',
          ] },
          'We will never treat you differently for using these rights.',
        ],
      },
      {
        h: 'How to exercise them',
        items: [
          'Email {email} with what you would like us to do. We will confirm that the request comes from you, usually by writing to the email address on your account, and answer within 45 days. If we need more time, as the law allows, we will tell you why.',
          { q: 'What if we say no?' },
          'Reply to our answer and ask us to look again. We will respond to your appeal within 45 days and explain our decision.',
        ],
      },
      { h: 'How to contact us', items: ['Questions about this policy or your health information? Write to us at {email}.'] },
    ],
  },
  security: {
    title: 'Security',
    lede: 'Your journal holds the most personal things you will ever write down. Here is how Belluh looks after it.',
    art: 'An open journal with a padlock in front of it',
    intro: 'Security is part of how Belluh is built, not a layer added on top. These are the practices we follow.',
    practices: [
      { h: 'Access rules that run on the server', p: 'Row-level security in our database decides who can read every record: your journal only by the people in your circle, and private entries only by you. The rules run on the server, so they hold even if someone goes around the app.' },
      { h: 'Private storage for photos and voice notes', p: 'Photos and voice notes are kept in private storage. The app shows them through signed links that expire within a day, so a copied link stops working.' },
      { h: 'Encrypted in transit', p: 'Belluh is served only over HTTPS, so what travels between your device and Belluh is encrypted on the way.' },
      { h: 'Passwords and payments', p: 'Passwords are handled by our authentication provider and are never stored in plain text. Payments go through third-party payment processors, and we never store full card numbers.' },
      { h: 'Private by default', p: 'Every entry is shared or private, your call. Your partner never sees your private entries.' },
    ],
    complianceH: 'Compliance',
    badgesArt: 'Two badges, labeled GDPR and CCPA',
    compliance: [
      'Belluh is built for the rights in the EU’s General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA). You can ask to see your data, take a copy of it with you, have it corrected or deleted, and opt out of the sale or sharing of your personal information.',
      'See how to do each of these in {choices}.',
    ],
    note: 'These badges show the laws Belluh is designed for. They are not certifications, and Belluh has not been audited against them.',
    contactH: 'Contact Security',
    contact: 'Think you have found a security issue? Please email {email} before sharing it publicly, with the steps to reproduce it. We will reply, keep you updated while we fix it, and credit you if you would like.',
  },
};

const ja: T = {
  contents: '目次',
  effective: '施行日 {date}',
  updated: '最終更新日 {date}',
  bindingNote: 'この文書は英語で書かれており、英語版が正式な内容となります。',
  storedAs: '保存名',
  none: 'なし',
  titles: { privacy: 'プライバシーポリシー', terms: '利用規約' },
  ccpa: { category: 'カテゴリー', collected: '収集', sold: '販売または共有' },
  links: { center: 'プライバシー設定センター', privacy: 'プライバシーポリシー', terms: '利用規約', choices: 'プライバシーに関する選択' },
  subjects: { cookies: 'Cookieについての質問', health: '消費者健康データに関するリクエスト', security: 'セキュリティの報告' },
  cookies: {
    title: 'Cookieポリシー',
    intro: [
      'このポリシーでは、belluh.comとBelluhのウェブアプリでCookieや類似の技術をどのように使っているか、それぞれの目的、そしてあなたが選べることを説明します。あなたの情報に関するそのほかのことは、{privacy}で説明しています。',
      { q: 'Cookieのしくみはもうご存じですか？' },
      '{center}で、いつでも設定を確認、変更できます。',
    ],
    sections: [
      { h: 'Cookieとは', items: ['Cookieは、ウェブサイトがブラウザに保存する小さなテキストファイルです。次に訪れたときに端末を見分けるために使われます。ログインしたままにしたり、設定を覚えたり、サイトの使われ方を把握したりできます。'] },
      { h: 'ファーストパーティCookieとサードパーティCookie', items: ['ファーストパーティCookieは、いま訪れているサイト（ここではbelluh.com）が設定するものです。サードパーティCookieは別の会社が設定するもので、広告のためにサイトをまたいで人を追跡する目的でよく使われます。', 'Belluh自身が保存するものはファーストパーティです。「Belluhをよくするために」を許可した場合は、Google AnalyticsとMixpanelも訪問数を数えるための識別子を端末に保存します。これらはbelluh.comに設定され、広告には使われません。Belluhは広告用Cookieを使っていません。'] },
      { h: 'セッションCookieと永続Cookie', items: ['セッションCookieは、ブラウザを閉じると消えます。永続Cookieは期限が切れるか削除されるまで残り、サイトが訪問のたびにあなたを覚えていられるのはこのためです。'] },
      {
        h: 'そのほかの技術',
        items: [
          'Belluh自身の保存には、Cookieではなくブラウザのローカルストレージを使っています。ローカルストレージはCookieとよく似ていますが、リクエストのたびにサーバーへ送られることはなく、消去されるまで端末の中に残ります。セッションストレージも同じしくみで、タブを閉じると消去されます。このポリシーでいう「Cookie」は、これらすべてを指します。',
          { note: 'Belluhの一部では、フォントや地図の画像などをほかのサービスから読み込んでいます。これらのサービスは、表示のために、IPアドレスなどどのウェブリクエストにも含まれる標準的な情報を受け取ります。' },
        ],
      },
      {
        h: 'Belluhでの使い道',
        items: [
          '保存するのは、Belluhが動くために必要なものと、あなたの選択を覚えておくためのものだけです。使っているカテゴリーは以下のとおりです。',
          { table: { head: ['カテゴリー', 'Belluhでの役割'], rows: [
            ['必須', 'この端末でログインしたままにし、セッションを安全に保ちます。ログイン前にたどった招待や書き始めた質問も覚えておき、ログイン後にそのまま続けられるようにします。これがないとBelluhは動きません。'],
            ['設定', '言語、タイムゾーン、サイドバーを開いているかや最後に使ったスペースなどのレイアウトを覚えます。この端末での設定、ラブマップの場所がオンかどうか、閉じたカードなどの細かなことも覚えて、前回のままBelluhを開けるようにします。'],
            ['計測', 'どのボタンからBelluhに来たかを最長7日間覚えておきます。許可した場合（「Belluhをよくするために」）、ログイン中に使った機能をBelluh自身のデータベースに記録し、Google Analytics（_ga、_ga_<id>、最長2年）とMixpanel（mp_<token>_mixpanel）が訪問数と機能の利用を数えます。EEA、英国、スイスでは許可するまでオフで、ブラウザがGlobal Privacy Controlを送信している場合もオフになります。'],
            ['広告', '使っていません。Belluhには広告用Cookieも広告トラッカーもありません。'],
          ] } },
        ],
      },
      {
        h: '管理のしかた',
        items: [
          '{center}を開けば、いつでも設定を確認できます。必須のストレージは常にオンです。これがないとログインしたままにできないためです。',
          'ブラウザの設定から、サイトのデータを消去したりブロックしたりすることもできます。消去するとログアウトされ、この端末に保存された設定はリセットされます。ブロックしてもBelluhは使えますが、訪れるたびにログインが必要になります。',
        ],
      },
      { h: 'このポリシーの変更', items: ['保存する内容が変わったときは、このページと冒頭の日付を更新します。'] },
      { h: 'お問い合わせ', items: ['Cookieやプライバシーについてのご質問は、{email}までお寄せください。'] },
    ],
  },
  health: {
    title: '消費者の健康データに関するプライバシーポリシー',
    intro: [
      'ワシントン州など米国の一部の州では、消費者健康データについて特定の権利が認められています。このポリシーでは、それがBelluhで何を意味するのか、つまりBelluhにどんな健康情報が含まれうるか、それがどこから来るか、どのように使い共有するか、そして権利の行使のしかたを説明します。{privacy}を補うものです。',
      { note: 'Belluhは医療サービスではありません。診断、治療、医学的な助言は行いません。' },
    ],
    sections: [
      { h: '対象となる情報', items: ['消費者健康データとは、あなたの過去、現在、将来の身体や心の健康に結びつく、または合理的に結びつけられる個人情報のことです。', 'Belluhが健康情報を尋ねることはありません。ただ、ジャーナルは個人的なものなので、書いた内容に健康情報が含まれることがあります。このポリシーは、Belluhのどこに現れるかにかかわらず、そうした情報を対象とします。'] },
      {
        h: '収集する可能性のある情報',
        items: [{ list: [
          'ジャーナルに書いたり、Bellaに話したりした気持ちや気分。',
          '書いた内容に出てくる睡眠、ストレス、病気、薬、通院のこと。',
          '追加したボイスメモや写真のうち、健康について何かがわかるもの。',
          'あなたにとって大切なことについてBellaが残すメモのうち、健康に触れるもの。',
        ] }],
      },
      {
        h: '情報の出どころ',
        items: [{ list: [
          'あなたから。投稿を書く、ボイスメモを録る、写真を追加する、Bellaと話すとき。',
          'パートナーから。サークルの共有投稿であなたについて書いたとき。',
          'Bellaから。あなたを手助けするために、共有された内容から何かを読み取ったとき（たとえば、ストレスの多い一週間だったと気づくなど）。',
        ] }],
      },
      {
        h: '使い方',
        items: [
          { list: [
            'ジャーナルを保管してあなたに表示し、共有投稿はサークルに表示するため。',
            '{privacy}に記載のとおり、Bellaが返事をし、細かなことを覚え、プランを提案するため。',
            'Belluhを安全に保ち、不正利用を防ぐため。',
            '法律を守るため。',
          ] },
          '消費者健康データを広告に使うことはありません。',
        ],
      },
      {
        h: '共有する相手',
        items: [
          { list: [
            'パートナーまたはサークル。あなたが共有を選んだ投稿に限ります。非公開の投稿は、パートナーにも、パートナーと話すときのBellaにも見えません。',
            '当社に代わってBelluhを運営するサービス提供者。たとえばホスティングやデータベースの提供者、Bellaを動かすAIの提供者です。利用方法は契約で制限されています。',
            '法律で求められた場合の当局。',
          ] },
          '消費者健康データを販売することはありません。',
        ],
      },
      {
        h: 'あなたの権利',
        items: [
          'お住まいの地域によって、次の権利があります。',
          { list: [
            '当社があなたの消費者健康データを収集、共有、販売しているかを確認し、その内容を見ること。',
            '共有した第三者の一覧を受け取ること。',
            '収集や共有への同意を撤回すること。',
            '削除してもらうこと。',
            'リクエストが断られた場合に異議を申し立てること。',
          ] },
          'これらの権利を使ったことで、あなたを不利に扱うことは決してありません。',
        ],
      },
      {
        h: '権利の行使のしかた',
        items: [
          'ご希望の内容を{email}までメールでお知らせください。通常はアカウントのメールアドレス宛てにご連絡して、ご本人からのリクエストであることを確認し、45日以内にお答えします。法律で認められた範囲で期間を延ばす必要がある場合は、その理由をお伝えします。',
          { q: 'リクエストが断られたら？' },
          '当社の回答に返信して、再検討をお求めください。異議申し立てには45日以内にお答えし、判断の理由をご説明します。',
        ],
      },
      { h: 'お問い合わせ', items: ['このポリシーや健康情報についてのご質問は、{email}までお寄せください。'] },
    ],
  },
  security: {
    title: 'セキュリティ',
    lede: 'ジャーナルには、あなたがこれまでに書き留めるなかでいちばん個人的なことが残ります。Belluhがそれをどう守っているかをお伝えします。',
    art: '開いたジャーナルと、その手前にある南京錠',
    intro: 'セキュリティは、あとから足したものではなく、Belluhのつくりそのものです。わたしたちが実践していることを紹介します。',
    practices: [
      { h: 'サーバー上で動くアクセスルール', p: 'データベースの行レベルセキュリティが、どの記録を誰が読めるかを決めています。ジャーナルを読めるのはサークルのメンバーだけ、非公開の投稿を読めるのはあなただけです。ルールはサーバー上で動くので、アプリを経由しないアクセスにも効きます。' },
      { h: '写真とボイスメモは非公開のストレージに', p: '写真とボイスメモは非公開のストレージに保管されます。アプリでは1日以内に期限が切れる署名付きリンクで表示するため、コピーしたリンクはやがて使えなくなります。' },
      { h: '通信中の暗号化', p: 'BelluhはHTTPSでのみ提供されています。端末とBelluhのあいだでやりとりされる内容は、通信中に暗号化されます。' },
      { h: 'パスワードと決済', p: 'パスワードは認証プロバイダーが管理し、平文で保存されることはありません。決済は第三者の決済代行業者を通して行われ、カード番号の全桁を当社が保存することはありません。' },
      { h: '最初から非公開', p: 'どの投稿も、共有するか非公開にするかはあなたが決められます。非公開の投稿がパートナーに見られることはありません。' },
    ],
    complianceH: 'コンプライアンス',
    badgesArt: 'GDPRとCCPAと書かれた2つのバッジ',
    compliance: [
      'Belluhは、EUの一般データ保護規則（GDPR）とカリフォルニア州消費者プライバシー法（CCPA）が定める権利に沿ってつくられています。自分のデータを見ること、その写しを持ち出すこと、訂正や削除を求めること、個人情報の販売や共有を拒否することができます。',
      'それぞれの方法は{choices}をご覧ください。',
    ],
    note: 'これらのバッジは、Belluhが設計の前提としている法律を示すものです。認証ではなく、Belluhはこれらに基づく監査を受けていません。',
    contactH: 'セキュリティに関するお問い合わせ',
    contact: 'セキュリティ上の問題を見つけたと思われる場合は、公表する前に、再現手順を添えて{email}までメールでお知らせください。当社は返信し、修正のあいだ状況をお伝えし、ご希望があればお名前をクレジットします。',
  },
};

const fr: T = {
  contents: 'Sommaire',
  effective: 'En vigueur depuis le {date}',
  updated: 'Dernière mise à jour le {date}',
  bindingNote: 'Ce document est en anglais, et seule la version anglaise fait foi.',
  storedAs: 'Enregistré sous',
  none: 'Aucun',
  titles: { privacy: 'Politique de confidentialité', terms: 'Conditions d’utilisation' },
  ccpa: { category: 'Catégorie', collected: 'Collectées', sold: 'Vendues ou partagées' },
  links: { center: 'Centre de préférences de confidentialité', privacy: 'Politique de confidentialité', terms: 'Conditions d’utilisation', choices: 'Vos choix en matière de confidentialité' },
  subjects: { cookies: 'Question sur les cookies', health: 'Demande relative aux données de santé', security: 'Signalement de sécurité' },
  cookies: {
    title: 'Politique relative aux cookies',
    intro: [
      'Cette politique explique comment Belluh utilise les cookies et les technologies similaires sur belluh.com et dans l’application web Belluh, à quoi sert chacun d’eux et quels choix vous avez. Elle complète notre {privacy}, qui couvre tout le reste concernant vos informations.',
      { q: 'Vous savez déjà comment fonctionnent les cookies ?' },
      'Rendez-vous directement dans le {center} pour consulter et modifier vos choix à tout moment.',
    ],
    sections: [
      { h: 'Qu’est-ce qu’un cookie ?', items: ['Un cookie est un petit fichier texte qu’un site enregistre dans votre navigateur pour reconnaître votre appareil lors d’une prochaine visite. Il peut vous garder connecté, retenir vos réglages ou aider un site à comprendre comment il est utilisé.'] },
      { h: 'Cookies internes et cookies tiers', items: ['Les cookies internes sont déposés par le site que vous visitez, ici belluh.com. Les cookies tiers sont déposés par une autre entreprise, souvent pour suivre les internautes d’un site à l’autre à des fins publicitaires.', 'Ce que Belluh enregistre lui-même est interne. Si vous autorisez « Améliorer Belluh », Google Analytics et Mixpanel enregistrent aussi des identifiants sur votre appareil pour compter les visites ; ils sont déposés sur belluh.com et ne servent pas à la publicité. Belluh n’utilise aucun cookie publicitaire.'] },
      { h: 'Cookies de session et cookies persistants', items: ['Les cookies de session disparaissent quand vous fermez votre navigateur. Les cookies persistants restent jusqu’à leur expiration ou leur suppression : c’est ainsi qu’un site se souvient de vous d’une visite à l’autre.'] },
      {
        h: 'Autres technologies',
        items: [
          'Pour son propre stockage, Belluh utilise le stockage local de votre navigateur plutôt que des cookies. Le stockage local fonctionne à peu près comme un cookie, mais il n’est pas envoyé à nos serveurs à chaque requête : il reste sur votre appareil jusqu’à ce qu’il soit effacé. Le stockage de session fonctionne de la même façon, mais il s’efface à la fermeture de l’onglet. Dans cette politique, « cookies » désigne l’ensemble de ces technologies.',
          { note: 'Certaines parties de Belluh chargent du contenu depuis d’autres services, comme des polices de caractères et des images de cartes. Ces services reçoivent les informations standard qui accompagnent toute requête web, comme votre adresse IP, afin de pouvoir le fournir.' },
        ],
      },
      {
        h: 'Comment Belluh les utilise',
        items: [
          'Nous n’enregistrons que ce dont Belluh a besoin pour fonctionner et pour retenir vos choix. Voici toutes les catégories que nous utilisons.',
          { table: { head: ['Catégorie', 'Son rôle sur Belluh'], rows: [
            ['Strictement nécessaires', 'Vous garde connecté et protège votre session sur cet appareil. Retient aussi une invitation que vous avez suivie ou une question commencée avant de vous connecter, pour la retrouver ensuite. Belluh ne peut pas fonctionner sans elles.'],
            ['Préférences', 'Retient votre langue, votre fuseau horaire et votre mise en page, par exemple si la barre latérale est ouverte et quel espace vous avez utilisé en dernier. Aussi vos réglages sur cet appareil, si les lieux sont activés pour votre carte de l’amour, et de petites choses comme les cartes que vous avez fermées, pour que Belluh s’ouvre comme vous l’avez laissé.'],
            ['Mesure', 'Retient quel bouton de notre site vous a amené, pendant 7 jours au plus. Avec votre accord (« Améliorer Belluh »), Belluh enregistre les fonctions que vous utilisez dans sa propre base de données lorsque vous êtes connecté, et Google Analytics (_ga, _ga_<id>, 2 ans au plus) et Mixpanel (mp_<token>_mixpanel) comptent les visites et l’utilisation des fonctions. Désactivé tant que vous ne l’avez pas autorisé dans l’EEE, au Royaume-Uni et en Suisse, et désactivé lorsque votre navigateur envoie Global Privacy Control.'],
            ['Publicité', 'Non utilisés. Belluh n’a ni cookies publicitaires ni traceurs publicitaires.'],
          ] } },
        ],
      },
      {
        h: 'Comment les gérer',
        items: [
          'Ouvrez le {center} pour revoir vos choix à tout moment. Le stockage strictement nécessaire reste toujours actif, car Belluh ne peut pas vous garder connecté sans lui.',
          'Vous pouvez aussi effacer ou bloquer les données du site dans les réglages de votre navigateur. Les effacer vous déconnecte et réinitialise les réglages enregistrés sur cet appareil. Si vous les bloquez, vous pourrez toujours utiliser Belluh, mais il faudra vous reconnecter à chaque visite.',
        ],
      },
      { h: 'Modifications de cette politique', items: ['Si ce que nous enregistrons change, nous mettrons à jour cette page et la date en haut.'] },
      { h: 'Nous contacter', items: ['Une question sur les cookies ou votre vie privée ? Écrivez-nous à {email}.'] },
    ],
  },
  health: {
    title: 'Politique de confidentialité des données de santé des consommateurs',
    intro: [
      'Certains États américains, comme Washington, accordent des droits spécifiques sur les données de santé des consommateurs. Cette politique explique ce que cela signifie chez Belluh : quelles informations de santé peuvent se retrouver dans Belluh, d’où elles viennent, comment nous les utilisons et les partageons, et comment exercer vos droits. Elle complète notre {privacy}.',
      { note: 'Belluh n’est pas un service médical. Belluh ne pose pas de diagnostic, ne soigne pas et ne donne pas de conseils médicaux.' },
    ],
    sections: [
      { h: 'Ce que couvre cette politique', items: ['Les données de santé des consommateurs sont des informations personnelles liées, ou raisonnablement associables, à votre santé physique ou mentale passée, présente ou future.', 'Belluh ne vous demande jamais d’informations de santé. Mais un journal est personnel, et ce que vous y écrivez peut en contenir. Cette politique couvre ces informations, où qu’elles apparaissent dans Belluh.'] },
      {
        h: 'Catégories que nous pouvons collecter',
        items: [{ list: [
          'Les émotions et l’humeur que vous décrivez dans votre journal ou confiez à Bella.',
          'Les mentions de sommeil, de stress, de maladie, de médicaments ou de rendez-vous médicaux dans ce que vous écrivez.',
          'Les notes vocales et photos que vous ajoutez, qui pourraient révéler quelque chose sur votre santé.',
          'Les notes que Bella garde sur ce qui compte pour vous, lorsqu’elles touchent à votre santé.',
        ] }],
      },
      {
        h: 'D’où elles viennent',
        items: [{ list: [
          'De vous, quand vous écrivez, enregistrez une note vocale, ajoutez une photo ou parlez avec Bella.',
          'De votre partenaire, quand il ou elle écrit un souvenir partagé dans votre cercle qui vous mentionne.',
          'De Bella, quand elle tire une conclusion de ce que vous avez partagé pour vous aider, par exemple en remarquant une semaine stressante.',
        ] }],
      },
      {
        h: 'Comment nous les utilisons',
        items: [
          { list: [
            'Pour conserver votre journal et vous l’afficher, ainsi que les souvenirs partagés à votre cercle.',
            'Pour que Bella vous réponde, retienne les détails et propose des projets, comme le décrit notre {privacy}.',
            'Pour assurer la sécurité de Belluh et prévenir les abus.',
            'Pour respecter la loi.',
          ] },
          'Nous n’utilisons pas les données de santé des consommateurs à des fins publicitaires.',
        ],
      },
      {
        h: 'Avec qui nous les partageons',
        items: [
          { list: [
            'Votre partenaire ou votre cercle, uniquement pour les souvenirs que vous choisissez de partager. Les souvenirs privés restent privés, y compris pour votre partenaire et pour Bella quand elle lui parle.',
            'Les prestataires qui font fonctionner Belluh pour notre compte, comme notre hébergeur et fournisseur de base de données et les fournisseurs d’IA qui font fonctionner Bella, dans le cadre de contrats qui limitent leur utilisation.',
            'Les autorités, lorsque la loi l’exige.',
          ] },
          'Nous ne vendons pas les données de santé des consommateurs.',
        ],
      },
      {
        h: 'Vos droits',
        items: [
          'Selon l’endroit où vous vivez, vous avez le droit de :',
          { list: [
            'Savoir si nous collectons, partageons ou vendons vos données de santé, et y accéder.',
            'Obtenir la liste des tiers avec qui nous les avons partagées.',
            'Retirer votre consentement à leur collecte ou à leur partage.',
            'Les faire supprimer.',
            'Faire appel si nous refusons votre demande.',
          ] },
          'Exercer ces droits ne changera jamais la façon dont nous vous traitons.',
        ],
      },
      {
        h: 'Comment les exercer',
        items: [
          'Écrivez à {email} en indiquant ce que vous souhaitez. Nous vérifierons que la demande vient bien de vous, en général en écrivant à l’adresse e-mail de votre compte, et répondrons sous 45 jours. Si nous avons besoin de plus de temps, comme la loi le permet, nous vous dirons pourquoi.',
          { q: 'Et si nous refusons ?' },
          'Répondez à notre message pour nous demander de réexaminer votre demande. Nous répondrons à votre appel sous 45 jours en expliquant notre décision.',
        ],
      },
      { h: 'Nous contacter', items: ['Une question sur cette politique ou vos informations de santé ? Écrivez-nous à {email}.'] },
    ],
  },
  security: {
    title: 'Sécurité',
    lede: 'Votre journal contient les choses les plus personnelles que vous écrirez jamais. Voici comment Belluh en prend soin.',
    art: 'Un journal ouvert avec un cadenas devant',
    intro: 'La sécurité fait partie de la façon dont Belluh est construit, ce n’est pas une couche ajoutée par-dessus. Voici les pratiques que nous suivons.',
    practices: [
      { h: 'Des règles d’accès appliquées sur le serveur', p: 'La sécurité au niveau des lignes de notre base de données décide qui peut lire chaque enregistrement : votre journal, seulement les membres de votre cercle, et vos souvenirs privés, seulement vous. Ces règles s’appliquent sur le serveur, elles tiennent donc même si quelqu’un contourne l’application.' },
      { h: 'Un stockage privé pour les photos et les notes vocales', p: 'Les photos et les notes vocales sont conservées dans un stockage privé. L’application les affiche grâce à des liens signés qui expirent en moins d’un jour : un lien copié cesse donc de fonctionner.' },
      { h: 'Chiffré pendant le transfert', p: 'Belluh n’est servi qu’en HTTPS : ce qui circule entre votre appareil et Belluh est chiffré en chemin.' },
      { h: 'Mots de passe et paiements', p: 'Les mots de passe sont gérés par notre fournisseur d’authentification et ne sont jamais stockés en clair. Les paiements passent par des prestataires de paiement tiers, et nous ne stockons jamais les numéros de carte complets.' },
      { h: 'Privé par défaut', p: 'Chaque souvenir est partagé ou privé, c’est vous qui décidez. Votre partenaire ne voit jamais vos souvenirs privés.' },
    ],
    complianceH: 'Conformité',
    badgesArt: 'Deux badges, marqués GDPR et CCPA',
    compliance: [
      'Belluh est conçu pour les droits prévus par le Règlement général sur la protection des données de l’UE (RGPD, GDPR en anglais) et le California Consumer Privacy Act (CCPA). Vous pouvez demander à voir vos données, en emporter une copie, les faire corriger ou supprimer, et vous opposer à la vente ou au partage de vos informations personnelles.',
      'Découvrez comment faire dans {choices}.',
    ],
    note: 'Ces badges indiquent les lois pour lesquelles Belluh est conçu. Ce ne sont pas des certifications, et Belluh n’a pas fait l’objet d’un audit au regard de ces lois.',
    contactH: 'Contacter l’équipe sécurité',
    contact: 'Vous pensez avoir trouvé une faille de sécurité ? Écrivez à {email} avant de la rendre publique, avec les étapes pour la reproduire. Nous vous répondrons, vous tiendrons informé pendant la correction et vous citerons si vous le souhaitez.',
  },
};

const it: T = {
  contents: 'Indice',
  effective: 'In vigore dal {date}',
  updated: 'Ultimo aggiornamento: {date}',
  bindingNote: 'Questo documento è in inglese e fa fede solo la versione inglese.',
  storedAs: 'Salvato come',
  none: 'Nessuno',
  titles: { privacy: 'Informativa sulla privacy', terms: 'Termini di servizio' },
  ccpa: { category: 'Categoria', collected: 'Raccolti', sold: 'Venduti o condivisi' },
  links: { center: 'Centro preferenze privacy', privacy: 'Informativa sulla privacy', terms: 'Termini di servizio', choices: 'Le tue scelte sulla privacy' },
  subjects: { cookies: 'Domanda sui cookie', health: 'Richiesta sui dati sanitari', security: 'Segnalazione di sicurezza' },
  cookies: {
    title: 'Cookie policy',
    intro: [
      'Questa policy spiega come Belluh usa i cookie e le tecnologie simili su belluh.com e nella web app di Belluh, a cosa serve ciascuno e quali scelte hai. Si affianca alla nostra {privacy}, che copre tutto il resto sulle tue informazioni.',
      { q: 'Sai già come funzionano i cookie?' },
      'Vai direttamente al {center} per vedere e cambiare le tue scelte in qualsiasi momento.',
    ],
    sections: [
      { h: 'Cosa sono i cookie?', items: ['I cookie sono piccoli file di testo che un sito salva nel browser per riconoscere il tuo dispositivo alla visita successiva. Possono mantenerti connesso, ricordare le tue impostazioni o aiutare un sito a capire come viene usato.'] },
      { h: 'Cookie di prima parte e di terze parti', items: ['I cookie di prima parte sono impostati dal sito che stai visitando, in questo caso belluh.com. Quelli di terze parti sono impostati da un’altra azienda, spesso per seguire le persone da un sito all’altro a fini pubblicitari.', 'Ciò che Belluh salva da sé è di prima parte. Se consenti “Migliorare Belluh”, anche Google Analytics e Mixpanel salvano degli identificatori sul tuo dispositivo per contare le visite; sono impostati su belluh.com e non vengono usati per la pubblicità. Belluh non usa cookie pubblicitari.'] },
      { h: 'Cookie di sessione e persistenti', items: ['I cookie di sessione spariscono quando chiudi il browser. Quelli persistenti restano finché non scadono o non li elimini: è così che un sito si ricorda di te tra una visita e l’altra.'] },
      {
        h: 'Altre tecnologie',
        items: [
          'Per i propri dati, Belluh usa la memoria locale del browser invece dei cookie. La memoria locale funziona più o meno come un cookie, ma non viene inviata ai nostri server a ogni richiesta: resta sul tuo dispositivo finché non viene cancellata. La memoria di sessione è uguale, ma si cancella quando chiudi la scheda. In questa policy, “cookie” indica tutte queste tecnologie.',
          { note: 'Alcune parti di Belluh caricano contenuti da altri servizi, come font e immagini delle mappe. Questi servizi ricevono le informazioni standard che accompagnano ogni richiesta web, come il tuo indirizzo IP, per poterli fornire.' },
        ],
      },
      {
        h: 'Come li usa Belluh',
        items: [
          'Salviamo solo ciò che serve a Belluh per funzionare e per ricordare le tue scelte. Queste sono tutte le categorie che usiamo.',
          { table: { head: ['Categoria', 'A cosa serve su Belluh'], rows: [
            ['Strettamente necessari', 'Ti mantengono connesso e proteggono la tua sessione su questo dispositivo. Ricordano anche un invito che hai seguito o una domanda iniziata prima di accedere, così la ritrovi dopo. Senza questi Belluh non funziona.'],
            ['Preferenze', 'Ricordano la tua lingua, il tuo fuso orario e il tuo layout, per esempio se la barra laterale è aperta e quale spazio hai usato per ultimo. Anche le tue impostazioni su questo dispositivo, se i luoghi sono attivi per la vostra mappa dell’amore e piccole cose come le schede che hai chiuso, così Belluh si apre come l’hai lasciato.'],
            ['Misurazione', 'Ricorda quale pulsante del nostro sito ti ha portato qui, per massimo 7 giorni. Con il tuo consenso (“Migliorare Belluh”), Belluh registra quali funzioni usi nel proprio database mentre hai effettuato l’accesso, e Google Analytics (_ga, _ga_<id>, fino a 2 anni) e Mixpanel (mp_<token>_mixpanel) contano le visite e l’uso delle funzioni. Disattivato finché non lo consenti nel SEE, nel Regno Unito e in Svizzera, e disattivato quando il tuo browser invia Global Privacy Control.'],
            ['Pubblicità', 'Non usati. Belluh non ha cookie pubblicitari né tracker pubblicitari.'],
          ] } },
        ],
      },
      {
        h: 'Come gestirli',
        items: [
          'Apri il {center} per rivedere le tue scelte in qualsiasi momento. La memoria strettamente necessaria è sempre attiva, perché senza Belluh non può mantenerti connesso.',
          'Puoi anche cancellare o bloccare i dati del sito nelle impostazioni del browser. Cancellarli ti disconnette e azzera le impostazioni salvate su questo dispositivo. Se li blocchi, puoi comunque usare Belluh, ma dovrai accedere di nuovo a ogni visita.',
        ],
      },
      { h: 'Modifiche a questa policy', items: ['Se cambia ciò che salviamo, aggiorneremo questa pagina e la data in alto.'] },
      { h: 'Come contattarci', items: ['Domande sui cookie o sulla tua privacy? Scrivici a {email}.'] },
    ],
  },
  health: {
    title: 'Informativa sulla privacy dei dati sanitari dei consumatori',
    intro: [
      'Alcuni stati USA, come Washington, riconoscono diritti specifici sui dati sanitari dei consumatori. Questa informativa spiega cosa significa su Belluh: quali informazioni sanitarie possono finire in Belluh, da dove arrivano, come le usiamo e condividiamo e come esercitare i tuoi diritti. Integra la nostra {privacy}.',
      { note: 'Belluh non è un servizio medico. Non fa diagnosi, non cura e non dà consigli medici.' },
    ],
    sections: [
      { h: 'Cosa copre questa informativa', items: ['I dati sanitari dei consumatori sono informazioni personali collegate, o ragionevolmente collegabili, alla tua salute fisica o mentale passata, presente o futura.', 'Belluh non ti chiede mai informazioni sulla salute. Ma un diario è personale, e ciò che ci scrivi può contenerne. Questa informativa copre queste informazioni ovunque compaiano in Belluh.'] },
      {
        h: 'Categorie che possiamo raccogliere',
        items: [{ list: [
          'Emozioni e stati d’animo che descrivi nel diario o racconti a Bella.',
          'Riferimenti a sonno, stress, malattie, farmaci o visite mediche in ciò che scrivi.',
          'Note vocali e foto che aggiungi, che potrebbero rivelare qualcosa sulla tua salute.',
          'Note che Bella conserva su ciò che conta per te, quando riguardano la tua salute.',
        ] }],
      },
      {
        h: 'Da dove arrivano',
        items: [{ list: [
          'Da te, quando scrivi, registri una nota vocale, aggiungi una foto o parli con Bella.',
          'Dal tuo partner, quando scrive un ricordo condiviso nella vostra cerchia che ti menziona.',
          'Da Bella, quando trae una conclusione da ciò che hai condiviso per aiutarti, per esempio notando una settimana stressante.',
        ] }],
      },
      {
        h: 'Come le usiamo',
        items: [
          { list: [
            'Per conservare il tuo diario e mostrartelo, e mostrare i ricordi condivisi alla tua cerchia.',
            'Perché Bella possa risponderti, ricordare i dettagli e proporre piani, come descritto nella nostra {privacy}.',
            'Per mantenere Belluh sicuro e prevenire gli abusi.',
            'Per rispettare la legge.',
          ] },
          'Non usiamo i dati sanitari dei consumatori per la pubblicità.',
        ],
      },
      {
        h: 'Con chi le condividiamo',
        items: [
          { list: [
            'Il tuo partner o la tua cerchia, solo per i ricordi che scegli di condividere. I ricordi privati restano privati, anche per il tuo partner e per Bella quando parla con lui o lei.',
            'I fornitori che gestiscono Belluh per nostro conto, come il nostro fornitore di hosting e database e i fornitori di AI che fanno funzionare Bella, con contratti che limitano come possono usarle.',
            'Le autorità, quando la legge lo richiede.',
          ] },
          'Non vendiamo i dati sanitari dei consumatori.',
        ],
      },
      {
        h: 'I tuoi diritti',
        items: [
          'A seconda di dove vivi, hai il diritto di:',
          { list: [
            'Sapere se raccogliamo, condividiamo o vendiamo i tuoi dati sanitari, e vederli.',
            'Ricevere l’elenco delle terze parti con cui li abbiamo condivisi.',
            'Revocare il consenso alla loro raccolta o condivisione.',
            'Farli cancellare.',
            'Presentare ricorso se respingiamo la tua richiesta.',
          ] },
          'Non ti tratteremo mai in modo diverso perché eserciti questi diritti.',
        ],
      },
      {
        h: 'Come esercitarli',
        items: [
          'Scrivi a {email} dicendoci cosa desideri. Verificheremo che la richiesta arrivi da te, di solito scrivendo all’indirizzo email del tuo account, e risponderemo entro 45 giorni. Se ci serve più tempo, come la legge consente, ti diremo perché.',
          { q: 'E se rispondiamo di no?' },
          'Rispondi al nostro messaggio e chiedici di riesaminare la richiesta. Risponderemo al tuo ricorso entro 45 giorni spiegando la nostra decisione.',
        ],
      },
      { h: 'Come contattarci', items: ['Domande su questa informativa o sulle tue informazioni sanitarie? Scrivici a {email}.'] },
    ],
  },
  security: {
    title: 'Sicurezza',
    lede: 'Il tuo diario contiene le cose più personali che scriverai mai. Ecco come Belluh se ne prende cura.',
    art: 'Un diario aperto con un lucchetto davanti',
    intro: 'La sicurezza fa parte di come è costruito Belluh, non è uno strato aggiunto sopra. Queste sono le pratiche che seguiamo.',
    practices: [
      { h: 'Regole di accesso applicate sul server', p: 'La sicurezza a livello di riga del nostro database decide chi può leggere ogni record: il tuo diario solo le persone della tua cerchia, i ricordi privati solo tu. Le regole vengono applicate sul server, quindi valgono anche se qualcuno aggira l’app.' },
      { h: 'Archiviazione privata per foto e note vocali', p: 'Foto e note vocali sono conservate in uno spazio di archiviazione privato. L’app le mostra tramite link firmati che scadono entro un giorno, così un link copiato smette di funzionare.' },
      { h: 'Cifrato durante il trasferimento', p: 'Belluh è servito solo tramite HTTPS, quindi ciò che viaggia tra il tuo dispositivo e Belluh è cifrato lungo il percorso.' },
      { h: 'Password e pagamenti', p: 'Le password sono gestite dal nostro fornitore di autenticazione e non vengono mai salvate in chiaro. I pagamenti passano da processori di pagamento terzi e non salviamo mai i numeri completi delle carte.' },
      { h: 'Privato per impostazione predefinita', p: 'Ogni ricordo è condiviso o privato, decidi tu. Il tuo partner non vede mai i tuoi ricordi privati.' },
    ],
    complianceH: 'Conformità',
    badgesArt: 'Due badge, con le scritte GDPR e CCPA',
    compliance: [
      'Belluh è progettato per i diritti previsti dal Regolamento generale sulla protezione dei dati dell’UE (GDPR) e dal California Consumer Privacy Act (CCPA). Puoi chiedere di vedere i tuoi dati, portarne con te una copia, farli correggere o cancellare e opporti alla vendita o alla condivisione delle tue informazioni personali.',
      'Scopri come fare in {choices}.',
    ],
    note: 'Questi badge indicano le leggi per cui Belluh è progettato. Non sono certificazioni, e Belluh non è stato sottoposto a verifiche rispetto a queste leggi.',
    contactH: 'Contatta il team sicurezza',
    contact: 'Pensi di aver trovato un problema di sicurezza? Scrivi a {email} prima di renderlo pubblico, con i passaggi per riprodurlo. Ti risponderemo, ti terremo aggiornato mentre lo risolviamo e ti citeremo, se lo desideri.',
  },
};

const pt: T = {
  contents: 'Sumário',
  effective: 'Vigente desde {date}',
  updated: 'Última atualização em {date}',
  bindingNote: 'Este documento está em inglês, e a versão em inglês é a que vale oficialmente.',
  storedAs: 'Salvo como',
  none: 'Nenhum',
  titles: { privacy: 'Política de Privacidade', terms: 'Termos de Uso' },
  ccpa: { category: 'Categoria', collected: 'Coletados', sold: 'Vendidos ou compartilhados' },
  links: { center: 'Central de Preferências de Privacidade', privacy: 'Política de Privacidade', terms: 'Termos de Uso', choices: 'Suas escolhas de privacidade' },
  subjects: { cookies: 'Dúvida sobre cookies', health: 'Solicitação sobre dados de saúde', security: 'Relato de segurança' },
  cookies: {
    title: 'Política de Cookies',
    intro: [
      'Esta política explica como o Belluh usa cookies e tecnologias parecidas no belluh.com e no app web do Belluh, para que serve cada um e quais escolhas você tem. Ela complementa a nossa {privacy}, que cobre todo o resto sobre as suas informações.',
      { q: 'Já sabe como os cookies funcionam?' },
      'Vá direto para a {center} para ver e mudar as suas escolhas a qualquer momento.',
    ],
    sections: [
      { h: 'O que são cookies?', items: ['Cookies são pequenos arquivos de texto que um site salva no seu navegador para reconhecer o seu dispositivo numa próxima visita. Eles podem manter você conectado, lembrar as suas configurações ou ajudar um site a entender como é usado.'] },
      { h: 'Cookies próprios e de terceiros', items: ['Cookies próprios são definidos pelo site que você está visitando, aqui o belluh.com. Cookies de terceiros são definidos por outra empresa, muitas vezes para seguir as pessoas de site em site para fins de publicidade.', 'Tudo o que o próprio Belluh salva é próprio. Se você permitir “Melhorar a Belluh”, o Google Analytics e o Mixpanel também salvam identificadores no seu dispositivo para contar visitas; eles são definidos no belluh.com e não são usados para publicidade. O Belluh não usa cookies de publicidade.'] },
      { h: 'Cookies de sessão e persistentes', items: ['Cookies de sessão somem quando você fecha o navegador. Cookies persistentes ficam até expirarem ou serem apagados, e é assim que um site se lembra de você entre uma visita e outra.'] },
      {
        h: 'Outras tecnologias',
        items: [
          'Para os próprios dados, o Belluh usa o armazenamento local do navegador em vez de cookies. O armazenamento local funciona quase como um cookie, mas não é enviado aos nossos servidores a cada solicitação: fica no seu dispositivo até ser apagado. O armazenamento de sessão é igual, só que é apagado quando você fecha a aba. Nesta política, “cookies” quer dizer todos eles.',
          { note: 'Algumas partes do Belluh carregam conteúdo de outros serviços, como fontes e imagens de mapas. Esses serviços recebem as informações padrão de qualquer solicitação na web, como o seu endereço IP, para poder entregá-lo.' },
        ],
      },
      {
        h: 'Como o Belluh os usa',
        items: [
          'Salvamos só o que o Belluh precisa para funcionar e para lembrar as suas escolhas. Estas são todas as categorias que usamos.',
          { table: { head: ['Categoria', 'O que faz no Belluh'], rows: [
            ['Estritamente necessários', 'Mantêm você conectado e a sua sessão segura neste dispositivo. Também lembram um convite que você seguiu ou uma pergunta que começou antes de entrar, para que esteja lá depois. O Belluh não funciona sem eles.'],
            ['Preferências', 'Lembram o seu idioma, o seu fuso horário e o seu layout, como se a barra lateral está aberta e qual espaço você usou por último. Também as suas configurações neste dispositivo, se os lugares estão ativados no seu mapa do amor e pequenas coisas, como cartões que você dispensou, para o Belluh abrir do jeito que você deixou.'],
            ['Medição', 'Lembra qual botão do nosso site trouxe você até aqui, por até 7 dias. Com a sua permissão (“Melhorar a Belluh”), o Belluh registra no próprio banco de dados quais recursos você usa enquanto está conectado, e o Google Analytics (_ga, _ga_<id>, por até 2 anos) e o Mixpanel (mp_<token>_mixpanel) contam visitas e o uso dos recursos. Fica desativado até você permitir no EEE, no Reino Unido e na Suíça, e desativado quando o seu navegador envia o Global Privacy Control.'],
            ['Publicidade', 'Não usados. O Belluh não tem cookies de publicidade nem rastreadores de anúncios.'],
          ] } },
        ],
      },
      {
        h: 'Como controlá-los',
        items: [
          'Abra a {center} para rever as suas escolhas a qualquer momento. O armazenamento estritamente necessário fica sempre ativo, porque sem ele o Belluh não consegue manter você conectado.',
          'Você também pode apagar ou bloquear os dados do site nas configurações do navegador. Apagar desconecta você e redefine as configurações salvas neste dispositivo. Se bloquear, ainda poderá usar o Belluh, mas vai precisar entrar de novo a cada visita.',
        ],
      },
      { h: 'Mudanças nesta política', items: ['Se o que salvamos mudar, vamos atualizar esta página e a data no topo.'] },
      { h: 'Como falar com a gente', items: ['Dúvidas sobre cookies ou a sua privacidade? Escreva para {email}.'] },
    ],
  },
  health: {
    title: 'Política de Privacidade de Dados de Saúde do Consumidor',
    intro: [
      'Alguns estados dos EUA, como Washington, garantem direitos específicos sobre dados de saúde do consumidor. Esta política explica o que isso significa no Belluh: que informações de saúde podem acabar no Belluh, de onde vêm, como as usamos e compartilhamos e como exercer os seus direitos. Ela complementa a nossa {privacy}.',
      { note: 'O Belluh não é um serviço médico. Não faz diagnósticos, não trata e não dá conselhos médicos.' },
    ],
    sections: [
      { h: 'O que esta política cobre', items: ['Dados de saúde do consumidor são informações pessoais ligadas, ou que podem razoavelmente ser ligadas, à sua saúde física ou mental, passada, presente ou futura.', 'O Belluh nunca pede informações de saúde. Mas um diário é pessoal, e o que você escreve nele pode conter algumas. Esta política cobre essas informações onde quer que apareçam no Belluh.'] },
      {
        h: 'Categorias que podemos coletar',
        items: [{ list: [
          'Sentimentos e humores que você descreve no diário ou conta para a Bella.',
          'Menções a sono, estresse, doenças, remédios ou consultas médicas no que você escreve.',
          'Áudios e fotos que você adiciona, que podem revelar algo sobre a sua saúde.',
          'Anotações que a Bella guarda sobre o que importa para você, quando tocam na sua saúde.',
        ] }],
      },
      {
        h: 'De onde vêm',
        items: [{ list: [
          'De você, quando escreve, grava um áudio, adiciona uma foto ou conversa com a Bella.',
          'Do seu par, quando escreve uma lembrança compartilhada no seu círculo que menciona você.',
          'Da Bella, quando tira uma conclusão do que você compartilhou para ajudar você, como perceber uma semana estressante.',
        ] }],
      },
      {
        h: 'Como as usamos',
        items: [
          { list: [
            'Para guardar o seu diário e mostrá-lo a você, e as lembranças compartilhadas ao seu círculo.',
            'Para a Bella responder, lembrar detalhes e sugerir planos, como descrito na nossa {privacy}.',
            'Para manter o Belluh seguro e evitar abusos.',
            'Para cumprir a lei.',
          ] },
          'Não usamos dados de saúde do consumidor para publicidade.',
        ],
      },
      {
        h: 'Com quem compartilhamos',
        items: [
          { list: [
            'O seu par ou o seu círculo, só nas lembranças que você escolhe compartilhar. As lembranças privadas continuam privadas, inclusive para o seu par e para a Bella quando ela conversa com ele ou ela.',
            'Prestadores de serviço que operam o Belluh em nosso nome, como o nosso provedor de hospedagem e banco de dados e os provedores de IA que fazem a Bella funcionar, com contratos que limitam como podem usá-las.',
            'Autoridades, quando a lei exigir.',
          ] },
          'Não vendemos dados de saúde do consumidor.',
        ],
      },
      {
        h: 'Seus direitos',
        items: [
          'Dependendo de onde você mora, você tem o direito de:',
          { list: [
            'Confirmar se coletamos, compartilhamos ou vendemos os seus dados de saúde, e vê-los.',
            'Receber a lista dos terceiros com quem os compartilhamos.',
            'Retirar o seu consentimento para que os coletemos ou compartilhemos.',
            'Pedir que sejam apagados.',
            'Recorrer se recusarmos o seu pedido.',
          ] },
          'Nunca vamos tratar você de forma diferente por usar esses direitos.',
        ],
      },
      {
        h: 'Como exercê-los',
        items: [
          'Escreva para {email} dizendo o que você gostaria que fizéssemos. Vamos confirmar que o pedido vem de você, normalmente escrevendo para o e-mail da sua conta, e responder em até 45 dias. Se precisarmos de mais tempo, como a lei permite, diremos o porquê.',
          { q: 'E se dissermos não?' },
          'Responda à nossa mensagem e peça para analisarmos de novo. Vamos responder ao seu recurso em até 45 dias, explicando a nossa decisão.',
        ],
      },
      { h: 'Como falar com a gente', items: ['Dúvidas sobre esta política ou as suas informações de saúde? Escreva para {email}.'] },
    ],
  },
  security: {
    title: 'Segurança',
    lede: 'O seu diário guarda as coisas mais pessoais que você vai escrever na vida. Veja como o Belluh cuida disso.',
    art: 'Um diário aberto com um cadeado na frente',
    intro: 'A segurança faz parte de como o Belluh é construído, não é uma camada colocada por cima. Estas são as práticas que seguimos.',
    practices: [
      { h: 'Regras de acesso que rodam no servidor', p: 'A segurança em nível de linha do nosso banco de dados decide quem pode ler cada registro: o seu diário, só as pessoas do seu círculo, e as lembranças privadas, só você. As regras rodam no servidor, então valem mesmo se alguém tentar contornar o app.' },
      { h: 'Armazenamento privado para fotos e áudios', p: 'Fotos e áudios ficam num armazenamento privado. O app os mostra por links assinados que expiram em até um dia, então um link copiado para de funcionar.' },
      { h: 'Criptografado no caminho', p: 'O Belluh só é servido por HTTPS, então o que vai e vem entre o seu dispositivo e o Belluh é criptografado no caminho.' },
      { h: 'Senhas e pagamentos', p: 'As senhas são gerenciadas pelo nosso provedor de autenticação e nunca ficam salvas em texto puro. Os pagamentos passam por processadores de pagamento terceiros, e nunca guardamos números completos de cartão.' },
      { h: 'Privado por padrão', p: 'Cada lembrança é compartilhada ou privada, você decide. O seu par nunca vê as suas lembranças privadas.' },
    ],
    complianceH: 'Conformidade',
    badgesArt: 'Dois selos, com as siglas GDPR e CCPA',
    compliance: [
      'O Belluh é feito para os direitos previstos no Regulamento Geral sobre a Proteção de Dados da UE (GDPR) e na Lei de Privacidade do Consumidor da Califórnia (CCPA). Você pode pedir para ver os seus dados, levar uma cópia com você, corrigi-los ou apagá-los e se opor à venda ou ao compartilhamento das suas informações pessoais.',
      'Veja como fazer cada um em {choices}.',
    ],
    note: 'Estes selos mostram as leis para as quais o Belluh é projetado. Não são certificações, e o Belluh não passou por auditoria com base nelas.',
    contactH: 'Fale com a equipe de segurança',
    contact: 'Acha que encontrou um problema de segurança? Escreva para {email} antes de tornar público, com os passos para reproduzi-lo. Vamos responder, manter você informado enquanto corrigimos e dar o crédito a você, se quiser.',
  },
};

const zh: T = {
  contents: '目录',
  effective: '生效日期：{date}',
  updated: '最后更新：{date}',
  bindingNote: '本文件为英文版本，具有法律效力的是英文版本。',
  storedAs: '存储名称',
  none: '无',
  titles: { privacy: '隐私政策', terms: '服务条款' },
  ccpa: { category: '类别', collected: '是否收集', sold: '是否出售或共享' },
  links: { center: '隐私偏好中心', privacy: '隐私政策', terms: '服务条款', choices: '你的隐私选择' },
  subjects: { cookies: 'Cookie 相关问题', health: '消费者健康数据请求', security: '安全问题报告' },
  cookies: {
    title: 'Cookie 政策',
    intro: [
      '本政策说明 Belluh 如何在 belluh.com 和 Belluh 网页应用中使用 Cookie 及类似技术，每一项的用途，以及你可以做哪些选择。关于你的信息的其他内容，请参阅我们的{privacy}。',
      { q: '已经了解 Cookie 的原理了？' },
      '直接前往{center}，随时查看和更改你的选择。',
    ],
    sections: [
      { h: '什么是 Cookie？', items: ['Cookie 是网站保存在浏览器中的小型文本文件，用来在你下次访问时识别你的设备。它可以让你保持登录、记住你的设置，或帮助网站了解自己被如何使用。'] },
      { h: '第一方 Cookie 与第三方 Cookie', items: ['第一方 Cookie 由你正在访问的网站设置，这里指 belluh.com。第三方 Cookie 由其他公司设置，常用于跨网站追踪用户以投放广告。', 'Belluh 自己存储的内容都是第一方的。如果你允许“让 Belluh 更好”，Google Analytics 和 Mixpanel 也会在你的设备上存储标识符，用来统计访问量；它们设置在 belluh.com 上，不用于广告。Belluh 不使用广告 Cookie。'] },
      { h: '会话 Cookie 与持久 Cookie', items: ['会话 Cookie 在你关闭浏览器时消失。持久 Cookie 会一直保留，直到过期或被删除，网站正是靠它在多次访问之间记住你。'] },
      {
        h: '其他技术',
        items: [
          'Belluh 自身使用浏览器的本地存储，而不是 Cookie。本地存储的作用和 Cookie 很像，但不会在每次请求时发送到我们的服务器：它留在你的设备上，直到被清除。会话存储也一样，只是在你关闭标签页时就会被清除。本政策中所说的“Cookie”涵盖以上所有技术。',
          { note: 'Belluh 的部分页面会从其他服务加载内容，例如字体和地图图片。这些服务会收到任何网络请求都会附带的标准信息，例如你的 IP 地址，以便提供这些内容。' },
        ],
      },
      {
        h: 'Belluh 如何使用它们',
        items: [
          '我们只存储 Belluh 正常运行和记住你的选择所需要的内容。以下是我们使用的全部类别。',
          { table: { head: ['类别', '在 Belluh 中的作用'], rows: [
            ['必要', '让你在这台设备上保持登录，并保障会话安全。还会记住你在登录前点开的邀请或开始提的问题，登录后它们还在。没有这些，Belluh 无法运行。'],
            ['偏好', '记住你的语言、时区和布局，比如侧边栏是否展开、上次用的是哪个空间。还有你在这台设备上的设置、恋爱地图是否开启了地点，以及你关掉的卡片等小事，让 Belluh 每次打开都是你离开时的样子。'],
            ['统计', '记住你是通过我们网站上的哪个按钮进来的，最长保留 7 天。经你允许（“让 Belluh 更好”）后，Belluh 会在你登录期间把你用了哪些功能记录在自己的数据库中，Google Analytics（_ga、_ga_<id>，最长 2 年）和 Mixpanel（mp_<token>_mixpanel）会统计访问量和功能使用情况。在欧洲经济区、英国和瑞士，你允许之前默认关闭；浏览器发送 Global Privacy Control 时也会关闭。'],
            ['广告', '不使用。Belluh 没有广告 Cookie，也没有广告追踪器。'],
          ] } },
        ],
      },
      {
        h: '如何管理',
        items: [
          '随时打开{center}查看你的选择。必要存储始终开启，因为没有它，Belluh 无法让你保持登录。',
          '你也可以在浏览器设置中清除或阻止网站数据。清除后你会被退出登录，这台设备上保存的设置也会重置。如果阻止，你仍然可以使用 Belluh，但每次访问都需要重新登录。',
        ],
      },
      { h: '本政策的变更', items: ['如果我们存储的内容有变化，会更新本页面和顶部的日期。'] },
      { h: '联系我们', items: ['对 Cookie 或你的隐私有疑问？请写信至 {email}。'] },
    ],
  },
  health: {
    title: '消费者健康数据隐私政策',
    intro: [
      '美国的一些州（例如华盛顿州）赋予人们对其消费者健康数据的特定权利。本政策说明这在 Belluh 意味着什么：哪些健康信息可能出现在 Belluh 中、它们从哪里来、我们如何使用和共享它们，以及如何行使你的权利。本政策是对我们{privacy}的补充。',
      { note: 'Belluh 不是医疗服务，不提供诊断、治疗或医疗建议。' },
    ],
    sections: [
      { h: '本政策的适用范围', items: ['消费者健康数据是指与你过去、现在或将来的身体或心理健康相关联，或可以合理关联的个人信息。', 'Belluh 从不要求你提供健康信息。但日记是很私人的，你写下的内容可能包含一些健康信息。无论这些信息出现在 Belluh 的哪里，本政策都适用。'] },
      {
        h: '我们可能收集的类别',
        items: [{ list: [
          '你在日记中描述或告诉 Bella 的感受和心情。',
          '你写下的内容中提到的睡眠、压力、疾病、药物或就医情况。',
          '你添加的语音和照片中可能透露健康状况的内容。',
          'Bella 记下的关于你在意之事的笔记中涉及健康的部分。',
        ] }],
      },
      {
        h: '信息来源',
        items: [{ list: [
          '来自你：当你写日记、录语音、添加照片或和 Bella 聊天时。',
          '来自你的伴侣：当对方在你们的圈子里写下提到你的共享日记时。',
          '来自 Bella：当她为了帮助你，从你分享的内容中得出某个判断时，例如注意到你这一周压力很大。',
        ] }],
      },
      {
        h: '我们如何使用',
        items: [
          { list: [
            '保存你的日记并展示给你，共享日记则展示给你的圈子。',
            '让 Bella 回复你、记住细节并提出计划建议，具体如我们的{privacy}所述。',
            '保障 Belluh 的安全，防止滥用。',
            '遵守法律。',
          ] },
          '我们不会将消费者健康数据用于广告。',
        ],
      },
      {
        h: '我们与谁共享',
        items: [
          { list: [
            '你的伴侣或圈子，仅限你选择共享的日记。私密日记始终私密，包括对你的伴侣，以及 Bella 与对方交谈时。',
            '代表我们运营 Belluh 的服务提供商，例如我们的托管和数据库服务商，以及为 Bella 提供能力的 AI 服务商，合同会限制他们的使用方式。',
            '法律要求时的有关机构。',
          ] },
          '我们不出售消费者健康数据。',
        ],
      },
      {
        h: '你的权利',
        items: [
          '根据你所在的地区，你有权：',
          { list: [
            '确认我们是否收集、共享或出售你的消费者健康数据，并查看这些数据。',
            '获取我们与之共享过这些数据的第三方名单。',
            '撤回你对我们收集或共享这些数据的同意。',
            '要求删除这些数据。',
            '在我们拒绝你的请求时提出申诉。',
          ] },
          '你行使这些权利，我们绝不会因此区别对待你。',
        ],
      },
      {
        h: '如何行使权利',
        items: [
          '请发送邮件至 {email}，说明你希望我们做什么。我们会确认请求确实来自你本人（通常是写信到你账户的邮箱），并在 45 天内答复。如果需要更多时间（在法律允许的范围内），我们会告诉你原因。',
          { q: '如果我们拒绝了呢？' },
          '回复我们的答复，请我们重新审查。我们会在 45 天内答复你的申诉，并说明我们的决定。',
        ],
      },
      { h: '联系我们', items: ['对本政策或你的健康信息有疑问？请写信至 {email}。'] },
    ],
  },
  security: {
    title: '安全',
    lede: '你的日记里装着你这辈子写下的最私密的事。下面是 Belluh 守护它的方式。',
    art: '一本打开的日记，前面放着一把挂锁',
    intro: '安全是 Belluh 构建方式的一部分，而不是事后加上去的一层。以下是我们遵循的做法。',
    practices: [
      { h: '在服务器上执行的访问规则', p: '我们数据库的行级安全决定了谁能读取每一条记录：你的日记只有你圈子里的人能读，私密日记只有你能读。这些规则在服务器上执行，所以即使有人绕过应用，规则依然有效。' },
      { h: '照片和语音存放在私有存储中', p: '照片和语音保存在私有存储中。应用通过一天内就会过期的签名链接来显示它们，所以复制出去的链接很快就会失效。' },
      { h: '传输加密', p: 'Belluh 仅通过 HTTPS 提供服务，你的设备与 Belluh 之间传输的内容在途中都是加密的。' },
      { h: '密码与支付', p: '密码由我们的身份验证服务商处理，绝不会以明文存储。支付通过第三方支付机构完成，我们从不存储完整的卡号。' },
      { h: '默认私密', p: '每篇日记共享还是私密，由你决定。你的伴侣永远看不到你的私密日记。' },
    ],
    complianceH: '合规',
    badgesArt: '两枚徽章，分别写着 GDPR 和 CCPA',
    compliance: [
      'Belluh 是按照欧盟《通用数据保护条例》（GDPR）和《加州消费者隐私法》（CCPA）规定的权利来打造的。你可以要求查看你的数据、带走一份副本、更正或删除数据，以及拒绝出售或共享你的个人信息。',
      '具体做法请见{choices}。',
    ],
    note: '这些徽章表示 Belluh 在设计时遵循的法律。它们不是认证，Belluh 也未接受过依据这些法律的审计。',
    contactH: '联系安全团队',
    contact: '认为自己发现了安全问题？请在公开之前发送邮件至 {email}，并附上复现步骤。我们会回复你，在修复期间随时告知进展，如果你愿意，还会公开致谢。',
  },
};

const de: T = {
  contents: 'Inhalt',
  effective: 'Gültig ab {date}',
  updated: 'Zuletzt aktualisiert am {date}',
  bindingNote: 'Dieses Dokument ist auf Englisch, und verbindlich ist die englische Fassung.',
  storedAs: 'Gespeichert als',
  none: 'Keine',
  titles: { privacy: 'Datenschutzerklärung', terms: 'Nutzungsbedingungen' },
  ccpa: { category: 'Kategorie', collected: 'Erhoben', sold: 'Verkauft oder weitergegeben' },
  links: { center: 'Datenschutz-Präferenzcenter', privacy: 'Datenschutzerklärung', terms: 'Nutzungsbedingungen', choices: 'Deine Datenschutzeinstellungen' },
  subjects: { cookies: 'Frage zu Cookies', health: 'Anfrage zu Gesundheitsdaten', security: 'Sicherheitsmeldung' },
  cookies: {
    title: 'Cookie-Richtlinie',
    intro: [
      'Diese Richtlinie erklärt, wie Belluh Cookies und ähnliche Technologien auf belluh.com und in der Belluh Web-App verwendet, wofür sie jeweils da sind und welche Wahl du hast. Sie ergänzt unsere {privacy}, die alles Weitere zu deinen Daten regelt.',
      { q: 'Du weisst schon, wie Cookies funktionieren?' },
      'Dann geh direkt zum {center}, um deine Auswahl jederzeit anzusehen und zu ändern.',
    ],
    sections: [
      { h: 'Was sind Cookies?', items: ['Cookies sind kleine Textdateien, die eine Website in deinem Browser speichert, um dein Gerät beim nächsten Besuch wiederzuerkennen. Sie können dich angemeldet halten, deine Einstellungen speichern oder einer Website zeigen, wie sie genutzt wird.'] },
      { h: 'Erstanbieter- und Drittanbieter-Cookies', items: ['Erstanbieter-Cookies setzt die Website, die du gerade besuchst, hier belluh.com. Drittanbieter-Cookies setzt ein anderes Unternehmen, oft um Menschen für Werbung von Website zu Website zu verfolgen.', 'Was Belluh selbst speichert, sind Erstanbieter-Daten. Wenn du „Belluh verbessern“ erlaubst, speichern auch Google Analytics und Mixpanel Kennungen auf deinem Gerät, um Besuche zu zählen. Sie werden auf belluh.com gesetzt und nicht für Werbung genutzt. Belluh verwendet keine Werbe-Cookies.'] },
      { h: 'Sitzungs- und dauerhafte Cookies', items: ['Sitzungs-Cookies verschwinden, wenn du den Browser schliesst. Dauerhafte Cookies bleiben, bis sie ablaufen oder du sie löschst. So erinnert sich eine Website von Besuch zu Besuch an dich.'] },
      {
        h: 'Andere Technologien',
        items: [
          'Für die eigenen Daten nutzt Belluh statt Cookies den lokalen Speicher deines Browsers. Der lokale Speicher funktioniert ähnlich wie ein Cookie, wird aber nicht bei jeder Anfrage an unsere Server geschickt: Er bleibt auf deinem Gerät, bis er gelöscht wird. Der Sitzungsspeicher funktioniert genauso, wird aber gelöscht, wenn du den Tab schliesst. In dieser Richtlinie meint „Cookies“ all das.',
          { note: 'Manche Teile von Belluh laden Inhalte von anderen Diensten, etwa Schriften und Kartenbilder. Diese Dienste erhalten die Standardangaben, die jede Webanfrage mitbringt, zum Beispiel deine IP-Adresse, damit sie die Inhalte ausliefern können.' },
        ],
      },
      {
        h: 'Wofür Belluh sie nutzt',
        items: [
          'Wir speichern nur, was Belluh zum Funktionieren braucht und um sich deine Auswahl zu merken. Das sind alle Kategorien, die wir verwenden.',
          { table: { head: ['Kategorie', 'Was sie bei Belluh tut'], rows: [
            ['Unbedingt erforderlich', 'Hält dich auf diesem Gerät angemeldet und deine Sitzung sicher. Merkt sich auch eine Einladung, der du gefolgt bist, oder eine Frage, die du vor dem Anmelden begonnen hast, damit sie danach auf dich wartet. Ohne sie funktioniert Belluh nicht.'],
            ['Präferenzen', 'Merkt sich deine Sprache, deine Zeitzone und dein Layout, etwa ob die Seitenleiste offen ist und welchen Bereich du zuletzt genutzt hast. Ausserdem deine Einstellungen auf diesem Gerät, ob Orte für eure Liebeskarte aktiviert sind, und Kleinigkeiten wie Karten, die du geschlossen hast, damit Belluh so aufgeht, wie du es verlassen hast.'],
            ['Messung', 'Merkt sich bis zu 7 Tage lang, über welchen Button unserer Website du gekommen bist. Mit deiner Erlaubnis („Belluh verbessern“) erfasst Belluh in seiner eigenen Datenbank, welche Funktionen du nutzt, während du angemeldet bist, und Google Analytics (_ga, _ga_<id>, bis zu 2 Jahre) und Mixpanel (mp_<token>_mixpanel) zählen Besuche und die Nutzung von Funktionen. Im EWR, im Vereinigten Königreich und in der Schweiz aus, bis du es erlaubst, und aus, wenn dein Browser Global Privacy Control sendet.'],
            ['Werbung', 'Nicht verwendet. Belluh hat keine Werbe-Cookies und keine Werbetracker.'],
          ] } },
        ],
      },
      {
        h: 'So steuerst du sie',
        items: [
          'Öffne das {center}, um deine Auswahl jederzeit zu prüfen. Unbedingt erforderlicher Speicher ist immer aktiv, weil Belluh dich ohne ihn nicht angemeldet halten kann.',
          'Du kannst Websitedaten auch in den Einstellungen deines Browsers löschen oder blockieren. Beim Löschen wirst du abgemeldet, und die auf diesem Gerät gespeicherten Einstellungen werden zurückgesetzt. Wenn du sie blockierst, kannst du Belluh weiter nutzen, musst dich aber bei jedem Besuch neu anmelden.',
        ],
      },
      { h: 'Änderungen dieser Richtlinie', items: ['Wenn sich ändert, was wir speichern, aktualisieren wir diese Seite und das Datum oben.'] },
      { h: 'So erreichst du uns', items: ['Fragen zu Cookies oder deiner Privatsphäre? Schreib uns an {email}.'] },
    ],
  },
  health: {
    title: 'Datenschutzerklärung für Verbraucher-Gesundheitsdaten',
    intro: [
      'Einige US-Bundesstaaten, etwa Washington, geben Menschen besondere Rechte an ihren Verbraucher-Gesundheitsdaten. Diese Erklärung zeigt, was das bei Belluh bedeutet: welche Gesundheitsinformationen in Belluh landen können, woher sie kommen, wie wir sie nutzen und weitergeben und wie du deine Rechte ausübst. Sie ergänzt unsere {privacy}.',
      { note: 'Belluh ist kein medizinischer Dienst. Belluh stellt keine Diagnosen, behandelt nicht und gibt keinen medizinischen Rat.' },
    ],
    sections: [
      { h: 'Was diese Erklärung abdeckt', items: ['Verbraucher-Gesundheitsdaten sind personenbezogene Daten, die mit deiner früheren, jetzigen oder künftigen körperlichen oder psychischen Gesundheit verknüpft sind oder vernünftigerweise verknüpft werden können.', 'Belluh fragt dich nie nach Gesundheitsinformationen. Aber ein Tagebuch ist persönlich, und was du schreibst, kann solche enthalten. Diese Erklärung gilt für diese Informationen, wo auch immer sie in Belluh vorkommen.'] },
      {
        h: 'Kategorien, die wir erheben können',
        items: [{ list: [
          'Gefühle und Stimmungen, die du in Einträgen beschreibst oder Bella erzählst.',
          'Erwähnungen von Schlaf, Stress, Krankheit, Medikamenten oder Arztterminen in dem, was du schreibst.',
          'Sprachnachrichten und Fotos, die du hinzufügst und die etwas über deine Gesundheit verraten könnten.',
          'Notizen, die Bella sich zu dem macht, was dir wichtig ist, wenn sie deine Gesundheit berühren.',
        ] }],
      },
      {
        h: 'Woher sie kommen',
        items: [{ list: [
          'Von dir, wenn du Einträge schreibst, Sprachnachrichten aufnimmst, Fotos hinzufügst oder mit Bella sprichst.',
          'Von deinem Partner oder deiner Partnerin, wenn in eurem Kreis ein geteilter Eintrag über dich entsteht.',
          'Von Bella, wenn sie aus dem, was du geteilt hast, einen Schluss zieht, um dir zu helfen, etwa dass du eine stressige Woche hattest.',
        ] }],
      },
      {
        h: 'Wie wir sie nutzen',
        items: [
          { list: [
            'Um dein Tagebuch zu speichern und dir anzuzeigen, und geteilte Einträge deinem Kreis.',
            'Damit Bella dir antworten, sich Details merken und Pläne vorschlagen kann, wie in unserer {privacy} beschrieben.',
            'Um Belluh sicher zu halten und Missbrauch zu verhindern.',
            'Um gesetzliche Pflichten zu erfüllen.',
          ] },
          'Wir nutzen Verbraucher-Gesundheitsdaten nicht für Werbung.',
        ],
      },
      {
        h: 'An wen wir sie weitergeben',
        items: [
          { list: [
            'An deinen Partner, deine Partnerin oder deinen Kreis, nur bei Einträgen, die du teilen willst. Private Einträge bleiben privat, auch vor deinem Gegenüber und vor Bella, wenn sie mit ihm oder ihr spricht.',
            'An Dienstleister, die Belluh in unserem Auftrag betreiben, etwa unseren Hosting- und Datenbankanbieter und die KI-Anbieter, auf denen Bella läuft, mit Verträgen, die ihre Nutzung beschränken.',
            'An Behörden, wenn das Gesetz es verlangt.',
          ] },
          'Wir verkaufen keine Verbraucher-Gesundheitsdaten.',
        ],
      },
      {
        h: 'Deine Rechte',
        items: [
          'Je nachdem, wo du lebst, hast du das Recht:',
          { list: [
            'zu erfahren, ob wir deine Verbraucher-Gesundheitsdaten erheben, weitergeben oder verkaufen, und sie einzusehen.',
            'eine Liste der Dritten zu erhalten, an die wir sie weitergegeben haben.',
            'deine Einwilligung in ihre Erhebung oder Weitergabe zu widerrufen.',
            'sie löschen zu lassen.',
            'Widerspruch einzulegen, wenn wir deine Anfrage ablehnen.',
          ] },
          'Wir behandeln dich nie anders, weil du diese Rechte nutzt.',
        ],
      },
      {
        h: 'So übst du sie aus',
        items: [
          'Schreib an {email}, was wir tun sollen. Wir prüfen, ob die Anfrage wirklich von dir kommt, meist indem wir an die E-Mail-Adresse deines Kontos schreiben, und antworten innerhalb von 45 Tagen. Wenn wir mehr Zeit brauchen, wie es das Gesetz erlaubt, sagen wir dir, warum.',
          { q: 'Und wenn wir ablehnen?' },
          'Antworte auf unsere Nachricht und bitte uns, die Anfrage erneut zu prüfen. Wir beantworten deinen Widerspruch innerhalb von 45 Tagen und begründen unsere Entscheidung.',
        ],
      },
      { h: 'So erreichst du uns', items: ['Fragen zu dieser Erklärung oder deinen Gesundheitsinformationen? Schreib uns an {email}.'] },
    ],
  },
  security: {
    title: 'Sicherheit',
    lede: 'In deinem Tagebuch steht das Persönlichste, was du je aufschreiben wirst. So passt Belluh darauf auf.',
    art: 'Ein aufgeschlagenes Tagebuch mit einem Vorhängeschloss davor',
    intro: 'Sicherheit gehört dazu, wie Belluh gebaut ist, sie ist keine Schicht obendrauf. Das sind die Praktiken, denen wir folgen.',
    practices: [
      { h: 'Zugriffsregeln, die auf dem Server laufen', p: 'Row-Level-Security in unserer Datenbank entscheidet, wer jeden Datensatz lesen darf: dein Tagebuch nur die Menschen in deinem Kreis, private Einträge nur du. Die Regeln laufen auf dem Server und gelten deshalb auch dann, wenn jemand die App umgeht.' },
      { h: 'Privater Speicher für Fotos und Sprachnachrichten', p: 'Fotos und Sprachnachrichten liegen in privatem Speicher. Die App zeigt sie über signierte Links, die innerhalb eines Tages ablaufen, sodass ein kopierter Link nicht mehr funktioniert.' },
      { h: 'Verschlüsselt unterwegs', p: 'Belluh wird nur über HTTPS ausgeliefert, also ist alles, was zwischen deinem Gerät und Belluh unterwegs ist, verschlüsselt.' },
      { h: 'Passwörter und Zahlungen', p: 'Passwörter verwaltet unser Authentifizierungsanbieter, und sie werden nie im Klartext gespeichert. Zahlungen laufen über externe Zahlungsdienstleister, und wir speichern nie vollständige Kartennummern.' },
      { h: 'Standardmässig privat', p: 'Jeder Eintrag ist geteilt oder privat, du entscheidest. Deine privaten Einträge sieht dein Partner oder deine Partnerin nie.' },
    ],
    complianceH: 'Compliance',
    badgesArt: 'Zwei Abzeichen mit der Aufschrift GDPR und CCPA',
    compliance: [
      'Belluh ist für die Rechte aus der Datenschutz-Grundverordnung der EU (DSGVO, englisch GDPR) und dem California Consumer Privacy Act (CCPA) gebaut. Du kannst verlangen, deine Daten einzusehen, eine Kopie mitzunehmen, sie berichtigen oder löschen zu lassen und dem Verkauf oder der Weitergabe deiner personenbezogenen Daten zu widersprechen.',
      'Wie das jeweils geht, steht unter {choices}.',
    ],
    note: 'Diese Abzeichen zeigen, für welche Gesetze Belluh gebaut ist. Sie sind keine Zertifizierungen, und Belluh wurde nicht nach diesen Gesetzen auditiert.',
    contactH: 'Sicherheitsteam kontaktieren',
    contact: 'Du glaubst, eine Sicherheitslücke gefunden zu haben? Bitte schreib an {email}, bevor du sie öffentlich machst, mit den Schritten, um sie nachzustellen. Wir antworten dir, halten dich auf dem Laufenden, während wir sie beheben, und nennen dich gern namentlich, wenn du möchtest.',
  },
};

const es: T = {
  contents: 'Índice',
  effective: 'En vigor desde el {date}',
  updated: 'Última actualización: {date}',
  bindingNote: 'Este documento está en inglés, y la versión en inglés es la que tiene validez legal.',
  storedAs: 'Guardado como',
  none: 'Ninguno',
  titles: { privacy: 'Política de privacidad', terms: 'Condiciones de uso' },
  ccpa: { category: 'Categoría', collected: 'Recopilados', sold: 'Vendidos o compartidos' },
  links: { center: 'Centro de preferencias de privacidad', privacy: 'Política de privacidad', terms: 'Condiciones de uso', choices: 'Tus opciones de privacidad' },
  subjects: { cookies: 'Pregunta sobre cookies', health: 'Solicitud sobre datos de salud', security: 'Informe de seguridad' },
  cookies: {
    title: 'Política de cookies',
    intro: [
      'Esta política explica cómo Belluh usa cookies y tecnologías similares en belluh.com y en la aplicación web de Belluh, para qué sirve cada una y qué opciones tienes. Complementa nuestra {privacy}, que cubre todo lo demás sobre tu información.',
      { q: '¿Ya sabes cómo funcionan las cookies?' },
      'Ve directamente al {center} para ver y cambiar tus opciones cuando quieras.',
    ],
    sections: [
      { h: '¿Qué son las cookies?', items: ['Las cookies son pequeños archivos de texto que un sitio web guarda en tu navegador para reconocer tu dispositivo en una próxima visita. Pueden mantener tu sesión iniciada, recordar tus ajustes o ayudar a un sitio a entender cómo se usa.'] },
      { h: 'Cookies propias y de terceros', items: ['Las cookies propias las pone el sitio que estás visitando, en este caso belluh.com. Las de terceros las pone otra empresa, a menudo para seguir a las personas de un sitio a otro con fines publicitarios.', 'Lo que guarda Belluh por sí mismo es propio. Si permites «Mejorar Belluh», Google Analytics y Mixpanel también guardan identificadores en tu dispositivo para contar las visitas; se establecen en belluh.com y no se usan para publicidad. Belluh no usa cookies publicitarias.'] },
      { h: 'Cookies de sesión y persistentes', items: ['Las cookies de sesión desaparecen al cerrar el navegador. Las persistentes se quedan hasta que caducan o las borras, y así es como un sitio te recuerda de una visita a otra.'] },
      {
        h: 'Otras tecnologías',
        items: [
          'Para sus propios datos, Belluh usa el almacenamiento local de tu navegador en lugar de cookies. El almacenamiento local funciona casi como una cookie, pero no se envía a nuestros servidores con cada solicitud: se queda en tu dispositivo hasta que se borra. El almacenamiento de sesión es igual, salvo que se borra al cerrar la pestaña. En esta política, «cookies» se refiere a todo esto.',
          { note: 'Algunas partes de Belluh cargan contenido de otros servicios, como tipografías e imágenes de mapas. Esos servicios reciben la información estándar que acompaña a cualquier solicitud web, como tu dirección IP, para poder entregarlo.' },
        ],
      },
      {
        h: 'Cómo las usa Belluh',
        items: [
          'Solo guardamos lo que Belluh necesita para funcionar y para recordar tus opciones. Estas son todas las categorías que usamos.',
          { table: { head: ['Categoría', 'Qué hace en Belluh'], rows: [
            ['Estrictamente necesarias', 'Mantienen tu sesión iniciada y segura en este dispositivo. También recuerdan una invitación que seguiste o una pregunta que empezaste antes de iniciar sesión, para que te espere después. Belluh no funciona sin ellas.'],
            ['Preferencias', 'Recuerdan tu idioma, tu zona horaria y tu diseño, como si la barra lateral está abierta y qué espacio usaste por última vez. También tus ajustes en este dispositivo, si los lugares están activados en vuestro mapa del amor y pequeñas cosas como las tarjetas que cerraste, para que Belluh se abra como lo dejaste.'],
            ['Medición', 'Recuerda qué botón de nuestro sitio te trajo, durante un máximo de 7 días. Con tu permiso («Mejorar Belluh»), Belluh registra en su propia base de datos qué funciones usas mientras tienes la sesión iniciada, y Google Analytics (_ga, _ga_<id>, hasta 2 años) y Mixpanel (mp_<token>_mixpanel) cuentan las visitas y el uso de funciones. Desactivado hasta que lo permitas en el EEE, el Reino Unido y Suiza, y desactivado cuando tu navegador envía Global Privacy Control.'],
            ['Publicidad', 'No se usan. Belluh no tiene cookies publicitarias ni rastreadores de anuncios.'],
          ] } },
        ],
      },
      {
        h: 'Cómo controlarlas',
        items: [
          'Abre el {center} para revisar tus opciones cuando quieras. El almacenamiento estrictamente necesario siempre está activo, porque sin él Belluh no puede mantener tu sesión iniciada.',
          'También puedes borrar o bloquear los datos del sitio en los ajustes de tu navegador. Borrarlos cierra tu sesión y restablece los ajustes guardados en este dispositivo. Si los bloqueas, podrás seguir usando Belluh, pero tendrás que iniciar sesión en cada visita.',
        ],
      },
      { h: 'Cambios en esta política', items: ['Si cambia lo que guardamos, actualizaremos esta página y la fecha de arriba.'] },
      { h: 'Cómo contactarnos', items: ['¿Preguntas sobre las cookies o tu privacidad? Escríbenos a {email}.'] },
    ],
  },
  health: {
    title: 'Política de privacidad de datos de salud del consumidor',
    intro: [
      'Algunos estados de EE. UU., como Washington, reconocen derechos específicos sobre los datos de salud del consumidor. Esta política explica qué significa eso en Belluh: qué información de salud puede acabar en Belluh, de dónde viene, cómo la usamos y compartimos, y cómo ejercer tus derechos. Complementa nuestra {privacy}.',
      { note: 'Belluh no es un servicio médico. No diagnostica, no trata y no da consejos médicos.' },
    ],
    sections: [
      { h: 'Qué cubre esta política', items: ['Los datos de salud del consumidor son información personal vinculada, o que razonablemente podría vincularse, con tu salud física o mental pasada, presente o futura.', 'Belluh nunca te pide información de salud. Pero un diario es personal, y lo que escribes en él puede incluirla. Esta política cubre esa información dondequiera que aparezca en Belluh.'] },
      {
        h: 'Categorías que podemos recopilar',
        items: [{ list: [
          'Sentimientos y estados de ánimo que describes en tu diario o le cuentas a Bella.',
          'Menciones de sueño, estrés, enfermedades, medicamentos o citas médicas en lo que escribes.',
          'Notas de voz y fotos que añades, que podrían revelar algo sobre tu salud.',
          'Notas que Bella guarda sobre lo que te importa, cuando tocan tu salud.',
        ] }],
      },
      {
        h: 'De dónde viene',
        items: [{ list: [
          'De ti, cuando escribes, grabas una nota de voz, añades una foto o hablas con Bella.',
          'De tu pareja, cuando escribe un recuerdo compartido en vuestro círculo que te menciona.',
          'De Bella, cuando saca una conclusión de lo que has compartido para ayudarte, como notar una semana estresante.',
        ] }],
      },
      {
        h: 'Cómo la usamos',
        items: [
          { list: [
            'Para guardar tu diario y mostrártelo, y los recuerdos compartidos a tu círculo.',
            'Para que Bella te responda, recuerde detalles y proponga planes, como se describe en nuestra {privacy}.',
            'Para mantener Belluh seguro y prevenir abusos.',
            'Para cumplir la ley.',
          ] },
          'No usamos los datos de salud del consumidor para publicidad.',
        ],
      },
      {
        h: 'Con quién la compartimos',
        items: [
          { list: [
            'Tu pareja o tu círculo, solo en los recuerdos que eliges compartir. Los recuerdos privados siguen siendo privados, también para tu pareja y para Bella cuando habla con ella.',
            'Proveedores que operan Belluh en nuestro nombre, como nuestro proveedor de alojamiento y base de datos y los proveedores de IA que hacen funcionar a Bella, con contratos que limitan cómo pueden usarla.',
            'Las autoridades, cuando la ley lo exige.',
          ] },
          'No vendemos datos de salud del consumidor.',
        ],
      },
      {
        h: 'Tus derechos',
        items: [
          'Según dónde vivas, tienes derecho a:',
          { list: [
            'Confirmar si recopilamos, compartimos o vendemos tus datos de salud, y verlos.',
            'Recibir la lista de terceros con quienes los hemos compartido.',
            'Retirar tu consentimiento para que los recopilemos o compartamos.',
            'Que se eliminen.',
            'Apelar si rechazamos tu solicitud.',
          ] },
          'Nunca te trataremos de forma distinta por ejercer estos derechos.',
        ],
      },
      {
        h: 'Cómo ejercerlos',
        items: [
          'Escribe a {email} contándonos qué quieres que hagamos. Confirmaremos que la solicitud viene de ti, normalmente escribiendo al correo de tu cuenta, y responderemos en un plazo de 45 días. Si necesitamos más tiempo, como permite la ley, te diremos por qué.',
          { q: '¿Y si te decimos que no?' },
          'Responde a nuestro mensaje y pídenos que lo revisemos de nuevo. Responderemos a tu apelación en un plazo de 45 días y te explicaremos nuestra decisión.',
        ],
      },
      { h: 'Cómo contactarnos', items: ['¿Preguntas sobre esta política o tu información de salud? Escríbenos a {email}.'] },
    ],
  },
  security: {
    title: 'Seguridad',
    lede: 'Tu diario guarda lo más personal que escribirás nunca. Así es como Belluh lo cuida.',
    art: 'Un diario abierto con un candado delante',
    intro: 'La seguridad es parte de cómo está hecho Belluh, no una capa añadida encima. Estas son las prácticas que seguimos.',
    practices: [
      { h: 'Reglas de acceso que se aplican en el servidor', p: 'La seguridad a nivel de fila de nuestra base de datos decide quién puede leer cada registro: tu diario, solo las personas de tu círculo, y los recuerdos privados, solo tú. Las reglas se aplican en el servidor, así que se mantienen aunque alguien intente saltarse la app.' },
      { h: 'Almacenamiento privado para fotos y notas de voz', p: 'Las fotos y notas de voz se guardan en un almacenamiento privado. La app las muestra con enlaces firmados que caducan en menos de un día, así que un enlace copiado deja de funcionar.' },
      { h: 'Cifrado en tránsito', p: 'Belluh solo se sirve por HTTPS, así que lo que viaja entre tu dispositivo y Belluh va cifrado por el camino.' },
      { h: 'Contraseñas y pagos', p: 'Las contraseñas las gestiona nuestro proveedor de autenticación y nunca se guardan en texto plano. Los pagos pasan por procesadores de pago externos, y nunca guardamos números de tarjeta completos.' },
      { h: 'Privado por defecto', p: 'Cada recuerdo es compartido o privado, tú decides. Tu pareja nunca ve tus recuerdos privados.' },
    ],
    complianceH: 'Cumplimiento',
    badgesArt: 'Dos insignias con las siglas GDPR y CCPA',
    compliance: [
      'Belluh está hecho para los derechos del Reglamento General de Protección de Datos de la UE (RGPD, GDPR en inglés) y de la Ley de Privacidad del Consumidor de California (CCPA). Puedes pedir ver tus datos, llevarte una copia, corregirlos o eliminarlos, y oponerte a la venta o el intercambio de tu información personal.',
      'Mira cómo hacer cada cosa en {choices}.',
    ],
    note: 'Estas insignias muestran las leyes para las que está diseñado Belluh. No son certificaciones, y Belluh no ha sido auditado conforme a ellas.',
    contactH: 'Contactar con seguridad',
    contact: '¿Crees que has encontrado un problema de seguridad? Escribe a {email} antes de hacerlo público, con los pasos para reproducirlo. Te responderemos, te mantendremos al tanto mientras lo solucionamos y te daremos el crédito si quieres.',
  },
};

// Mexico: ustedes rather than vosotros, and Mexico's names for the two policies
const esMX: Partial<T> = {
  titles: { privacy: 'Aviso de privacidad', terms: 'Términos y condiciones' },
  effective: 'Vigente desde el {date}',
  links: { ...es.links, privacy: 'Aviso de privacidad', terms: 'Términos y condiciones' },
  cookies: {
    ...es.cookies,
    intro: [
      'Esta política explica cómo Belluh usa cookies y tecnologías similares en belluh.com y en la aplicación web de Belluh, para qué sirve cada una y qué opciones tienes. Complementa nuestro {privacy}, que cubre todo lo demás sobre tu información.',
      es.cookies.intro[1], es.cookies.intro[2],
    ],
    sections: es.cookies.sections.map((s, i) => i !== 4 ? s : { ...s, items: [s.items[0], { table: { head: ['Categoría', 'Qué hace en Belluh'], rows: [
      ['Estrictamente necesarias', 'Mantienen tu sesión iniciada y segura en este dispositivo. También recuerdan una invitación que seguiste o una pregunta que empezaste antes de iniciar sesión, para que te espere después. Belluh no funciona sin ellas.'],
      ['Preferencias', 'Recuerdan tu idioma, tu zona horaria y tu diseño, como si la barra lateral está abierta y qué espacio usaste por última vez. También tus ajustes en este dispositivo, si los lugares están activados en su mapa del amor y pequeñas cosas como las tarjetas que cerraste, para que Belluh se abra como lo dejaste.'],
      ['Medición', 'Recuerda qué botón de nuestro sitio te trajo, durante un máximo de 7 días. Con tu permiso («Mejorar Belluh»), Belluh registra en su propia base de datos qué funciones usas mientras tienes la sesión iniciada, y Google Analytics (_ga, _ga_<id>, hasta 2 años) y Mixpanel (mp_<token>_mixpanel) cuentan las visitas y el uso de funciones. Desactivado hasta que lo permitas en el EEE, el Reino Unido y Suiza, y desactivado cuando tu navegador envía Global Privacy Control.'],
      ['Publicidad', 'No se usan. Belluh no tiene cookies publicitarias ni rastreadores de anuncios.'],
    ] } }] }),
  },
  health: {
    ...es.health,
    intro: ['Algunos estados de EE. UU., como Washington, reconocen derechos específicos sobre los datos de salud del consumidor. Esta política explica qué significa eso en Belluh: qué información de salud puede acabar en Belluh, de dónde viene, cómo la usamos y compartimos, y cómo ejercer tus derechos. Complementa nuestro {privacy}.', es.health.intro[1]],
    sections: es.health.sections.map((s, i) => i !== 2 ? s : { ...s, items: [{ list: [
      'De ti, cuando escribes, grabas una nota de voz, añades una foto o hablas con Bella.',
      'De tu pareja, cuando escribe un recuerdo compartido en su círculo que te menciona.',
      'De Bella, cuando saca una conclusión de lo que has compartido para ayudarte, como notar una semana estresante.',
    ] }] }),
  },
};

// Portugal: European Portuguese (registo, equipa, partilhar, ecrã)
const ptPT: Partial<T> = {
  titles: { privacy: 'Política de Privacidade', terms: 'Termos de Utilização' },
  effective: 'Em vigor desde {date}',
  bindingNote: 'Este documento está em inglês, e a versão inglesa é a que faz fé.',
  storedAs: 'Guardado como',
  ccpa: { category: 'Categoria', collected: 'Recolhidos', sold: 'Vendidos ou partilhados' },
  links: { center: 'Centro de Preferências de Privacidade', privacy: 'Política de Privacidade', terms: 'Termos de Utilização', choices: 'As suas escolhas de privacidade' },
  subjects: { cookies: 'Pergunta sobre cookies', health: 'Pedido sobre dados de saúde', security: 'Relatório de segurança' },
  security: {
    ...pt.security,
    contactH: 'Fale com a equipa de segurança',
    contact: 'Acha que encontrou um problema de segurança? Escreva para {email} antes de o tornar público, com os passos para o reproduzir. Vamos responder, mantê-lo informado enquanto o corrigimos e dar-lhe o crédito, se quiser.',
  },
};

const t: UiTable<T> = { en, ja, fr, it, pt, zh, de, es, 'es-MX': esMX, 'pt-PT': ptPT };
export default t;
