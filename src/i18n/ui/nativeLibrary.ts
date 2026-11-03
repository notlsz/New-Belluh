import type { UiTable } from '../ui';

// The iOS and Android apps: Belluh Memory reading the phone's photo library (in Memory settings and Turn on Memory,
// where the web shows Keep adding from a folder). {n} a number.
const en = {
  title: 'Your photo library',
  body: 'Let Belluh read the photos on this phone, with when and where each was taken. Photos and what Belluh learns from them never leave this phone.',
  allow: 'Allow photo access',
  on: 'New photos are read on their own, even while Belluh is closed, and are ready when you open it.',
  limited: 'Belluh can see only the photos you chose.',
  choose: 'Choose photos',
  denied: 'Photo access is off for Belluh. Turn it on in Settings to add your photos.',
  settings: 'Open Settings',
  now: 'Check now',
  reading: 'Reading your photos',
  added: '{n} new photos added',
  none: 'No new photos',
};

const ja: typeof en = {
  title: '写真ライブラリ',
  body: 'この端末の写真を、いつどこで撮ったかと一緒にBelluhが読み込みます。写真と、そこからBelluhが知ったことは、この端末の外に出ません。',
  allow: '写真へのアクセスを許可',
  on: '新しい写真は、Belluhを閉じている間も自動で読み込まれ、開いたときには準備ができています。',
  limited: 'Belluhが見られるのは、選んだ写真だけです。',
  choose: '写真を選ぶ',
  denied: 'Belluhの写真へのアクセスがオフです。写真を追加するには設定でオンにしてください。',
  settings: '設定を開く',
  now: '今すぐ確認',
  reading: '写真を読み込んでいます',
  added: '新しい写真を{n}枚追加しました',
  none: '新しい写真はありません',
};

const fr: typeof en = {
  title: 'Votre photothèque',
  body: 'Laissez Belluh lire les photos de ce téléphone, avec le moment et le lieu de chaque prise. Vos photos et ce que Belluh en apprend ne quittent jamais ce téléphone.',
  allow: 'Autoriser l’accès aux photos',
  on: 'Les nouvelles photos sont lues toutes seules, même quand Belluh est fermé, et sont prêtes dès que vous l’ouvrez.',
  limited: 'Belluh ne voit que les photos que vous avez choisies.',
  choose: 'Choisir des photos',
  denied: 'L’accès aux photos est désactivé pour Belluh. Activez-le dans les Réglages pour ajouter vos photos.',
  settings: 'Ouvrir les Réglages',
  now: 'Vérifier maintenant',
  reading: 'Lecture de vos photos',
  added: '{n} nouvelles photos ajoutées',
  none: 'Aucune nouvelle photo',
};

const it: typeof en = {
  title: 'La tua libreria foto',
  body: 'Lascia che Belluh legga le foto di questo telefono, con il momento e il luogo di ogni scatto. Le foto e ciò che Belluh ne impara non lasciano mai questo telefono.',
  allow: 'Consenti l’accesso alle foto',
  on: 'Le nuove foto vengono lette da sole, anche quando Belluh è chiuso, e sono pronte appena lo apri.',
  limited: 'Belluh vede solo le foto che hai scelto.',
  choose: 'Scegli le foto',
  denied: 'L’accesso alle foto è disattivato per Belluh. Attivalo nelle Impostazioni per aggiungere le tue foto.',
  settings: 'Apri Impostazioni',
  now: 'Controlla ora',
  reading: 'Lettura delle tue foto',
  added: '{n} nuove foto aggiunte',
  none: 'Nessuna nuova foto',
};

const pt: typeof en = {
  title: 'Sua galeria de fotos',
  body: 'Deixe o Belluh ler as fotos deste celular, com quando e onde cada uma foi tirada. As fotos e o que o Belluh aprende com elas nunca saem deste celular.',
  allow: 'Permitir acesso às fotos',
  on: 'As fotos novas são lidas sozinhas, mesmo com o Belluh fechado, e ficam prontas quando você abre.',
  limited: 'O Belluh só vê as fotos que você escolheu.',
  choose: 'Escolher fotos',
  denied: 'O acesso às fotos está desligado para o Belluh. Ligue nos Ajustes para adicionar suas fotos.',
  settings: 'Abrir Ajustes',
  now: 'Verificar agora',
  reading: 'Lendo suas fotos',
  added: '{n} fotos novas adicionadas',
  none: 'Nenhuma foto nova',
};

const zh: typeof en = {
  title: '你的照片图库',
  body: '让 Belluh 读取这台手机上的照片，以及每张照片拍摄的时间和地点。照片和 Belluh 从中了解到的内容都不会离开这台手机。',
  allow: '允许访问照片',
  on: '新照片会自动读取，即使 Belluh 已关闭，打开时就已准备好。',
  limited: 'Belluh 只能看到你选择的照片。',
  choose: '选择照片',
  denied: 'Belluh 的照片访问权限已关闭。请在设置中打开，以添加你的照片。',
  settings: '打开设置',
  now: '立即检查',
  reading: '正在读取你的照片',
  added: '已添加 {n} 张新照片',
  none: '没有新照片',
};

const de: typeof en = {
  title: 'Deine Fotomediathek',
  body: 'Lass Belluh die Fotos auf diesem Handy lesen, mit Zeit und Ort jeder Aufnahme. Die Fotos und was Belluh daraus lernt, verlassen dieses Handy nie.',
  allow: 'Fotozugriff erlauben',
  on: 'Neue Fotos werden von selbst gelesen, auch wenn Belluh geschlossen ist, und sind bereit, sobald du es öffnest.',
  limited: 'Belluh sieht nur die Fotos, die du ausgewählt hast.',
  choose: 'Fotos auswählen',
  denied: 'Der Fotozugriff ist für Belluh aus. Schalte ihn in den Einstellungen ein, um deine Fotos hinzuzufügen.',
  settings: 'Einstellungen öffnen',
  now: 'Jetzt prüfen',
  reading: 'Deine Fotos werden gelesen',
  added: '{n} neue Fotos hinzugefügt',
  none: 'Keine neuen Fotos',
};

const es: typeof en = {
  title: 'Tu fototeca',
  body: 'Deja que Belluh lea las fotos de este móvil, con cuándo y dónde se hizo cada una. Las fotos y lo que Belluh aprende de ellas nunca salen de este móvil.',
  allow: 'Permitir acceso a las fotos',
  on: 'Las fotos nuevas se leen solas, incluso con Belluh cerrado, y están listas cuando lo abres.',
  limited: 'Belluh solo ve las fotos que elegiste.',
  choose: 'Elegir fotos',
  denied: 'El acceso a las fotos está desactivado para Belluh. Actívalo en Ajustes para añadir tus fotos.',
  settings: 'Abrir Ajustes',
  now: 'Comprobar ahora',
  reading: 'Leyendo tus fotos',
  added: '{n} fotos nuevas añadidas',
  none: 'No hay fotos nuevas',
};

const ko: typeof en = {
  title: '사진 보관함',
  body: 'Belluh가 이 휴대폰의 사진을 언제 어디서 찍었는지와 함께 읽게 해 주세요. 사진과 Belluh가 사진에서 알게 된 내용은 절대 이 휴대폰 밖으로 나가지 않아요.',
  allow: '사진 접근 허용',
  on: '새 사진은 Belluh를 닫아 둔 동안에도 저절로 읽혀서, 열면 바로 준비되어 있어요.',
  limited: 'Belluh는 고른 사진만 볼 수 있어요.',
  choose: '사진 고르기',
  denied: 'Belluh의 사진 접근이 꺼져 있어요. 사진을 추가하려면 설정에서 켜 주세요.',
  settings: '설정 열기',
  now: '지금 확인',
  reading: '사진을 읽는 중',
  added: '새 사진 {n}장 추가했어요',
  none: '새 사진이 없어요',
};

// Mexico: celular, agregar, Configuración
const esMX: Partial<typeof en> = {
  body: 'Deja que Belluh lea las fotos de este celular, con cuándo y dónde se tomó cada una. Las fotos y lo que Belluh aprende de ellas nunca salen de este celular.',
  denied: 'El acceso a las fotos está desactivado para Belluh. Actívalo en Configuración para agregar tus fotos.',
  settings: 'Abrir Configuración',
  added: '{n} fotos nuevas agregadas',
};

// Portugal: telemóvel, fotografias, Definições
const ptPT: Partial<typeof en> = {
  title: 'A sua fototeca',
  body: 'Deixe o Belluh ler as fotografias deste telemóvel, com quando e onde cada uma foi tirada. As fotografias e o que o Belluh aprende com elas nunca saem deste telemóvel.',
  allow: 'Permitir acesso às fotografias',
  on: 'As fotografias novas são lidas sozinhas, mesmo com o Belluh fechado, e ficam prontas quando o abre.',
  limited: 'O Belluh só vê as fotografias que escolheu.',
  choose: 'Escolher fotografias',
  denied: 'O acesso às fotografias está desligado para o Belluh. Ligue-o nas Definições para adicionar as suas fotografias.',
  settings: 'Abrir Definições',
  reading: 'A ler as suas fotografias',
  added: '{n} fotografias novas adicionadas',
  none: 'Nenhuma fotografia nova',
};

const table: UiTable<typeof en> = { en, ja, fr, it, pt, zh, de, es, ko, 'es-MX': esMX, 'pt-PT': ptPT };
export default table;
