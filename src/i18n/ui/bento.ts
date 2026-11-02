// The Us page's bento of dates and details: tile sizes and the couple's own tiles (favorites, dislikes, anything).
import type { UiTable } from '../ui';

const en = {
  size: 'Size', small: 'S', medium: 'M', large: 'L',
  addOwn: 'Add your own',
  ideas: ['Favorite food', 'Dislikes', 'Our song', 'Love language', 'Favorite flowers', 'Coffee order'],
  titlePh: 'What is it?', valuePh: 'Write it here', remove: 'Remove', emoji: 'Change emoji',
};
const es = { size: 'Tamaño', small: 'S', medium: 'M', large: 'L', addOwn: 'Añade la tuya', ideas: ['Comida favorita', 'Lo que no le gusta', 'Nuestra canción', 'Lenguaje del amor', 'Flores favoritas', 'Su café'], titlePh: '¿Qué es?', valuePh: 'Escríbelo aquí', remove: 'Quitar', emoji: 'Cambiar emoji' };
const pt = { size: 'Tamanho', small: 'P', medium: 'M', large: 'G', addOwn: 'Adicione o seu', ideas: ['Comida favorita', 'Não gosta de', 'Nossa música', 'Linguagem do amor', 'Flores favoritas', 'Pedido de café'], titlePh: 'O que é?', valuePh: 'Escreva aqui', remove: 'Remover', emoji: 'Trocar emoji' };

const bento: UiTable<typeof en> = {
  en,
  ja: { size: 'サイズ', small: '小', medium: '中', large: '大', addOwn: '自分で追加', ideas: ['好きな食べ物', '苦手なもの', 'ふたりの曲', '愛情表現', '好きな花', 'いつものコーヒー'], titlePh: 'なに？', valuePh: 'ここに書く', remove: '削除', emoji: '絵文字を変える' },
  fr: { size: 'Taille', small: 'S', medium: 'M', large: 'L', addOwn: 'Ajoute la tienne', ideas: ['Plat préféré', 'N’aime pas', 'Notre chanson', 'Langage de l’amour', 'Fleurs préférées', 'Son café'], titlePh: 'C’est quoi ?', valuePh: 'Écris-le ici', remove: 'Retirer', emoji: 'Changer l’emoji' },
  it: { size: 'Dimensione', small: 'S', medium: 'M', large: 'L', addOwn: 'Aggiungi la tua', ideas: ['Piatto preferito', 'Non sopporta', 'La nostra canzone', 'Linguaggio dell’amore', 'Fiori preferiti', 'Il suo caffè'], titlePh: 'Cos’è?', valuePh: 'Scrivilo qui', remove: 'Rimuovi', emoji: 'Cambia emoji' },
  pt,
  zh: { size: '大小', small: '小', medium: '中', large: '大', addOwn: '自己添加', ideas: ['最爱的食物', '不喜欢的', '我们的歌', '爱的语言', '最爱的花', '咖啡口味'], titlePh: '是什么？', valuePh: '写在这里', remove: '移除', emoji: '换个表情' },
  de: { size: 'Größe', small: 'S', medium: 'M', large: 'L', addOwn: 'Eigene hinzufügen', ideas: ['Lieblingsessen', 'Mag nicht', 'Unser Song', 'Liebessprache', 'Lieblingsblumen', 'Kaffeebestellung'], titlePh: 'Was ist es?', valuePh: 'Hier eintragen', remove: 'Entfernen', emoji: 'Emoji ändern' },
  es,
  ko: {
    size: '크기',
    small: 'S',
    medium: 'M',
    large: 'L',
    addOwn: '직접 추가',
    ideas: ['좋아하는 음식', '싫어하는 것', '우리 노래', '사랑의 언어', '좋아하는 꽃', '커피 주문'],
    titlePh: '무엇인가요?',
    valuePh: '여기에 적어 주세요',
    remove: '삭제',
    emoji: '이모지 바꾸기',
  },
  'es-MX': { addOwn: 'Agrega la tuya' },
  'pt-PT': { addOwn: 'Adiciona o teu', ideas: ['Comida favorita', 'Não gosta de', 'A nossa música', 'Linguagem do amor', 'Flores favoritas', 'Pedido de café'], valuePh: 'Escreve aqui', emoji: 'Mudar emoji' },
};
export default bento;
