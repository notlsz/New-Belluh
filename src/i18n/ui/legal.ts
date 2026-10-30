// The frame around the Terms of Service and Privacy Policy. The documents themselves stay in English, the binding
// version; `bindingNote` says so to readers in every other language.
import type { UiTable } from '../ui';

const en = {
  tos: 'Terms of Service',
  privacy: 'Privacy Policy',
  tabTos: 'Terms',
  tabPrivacy: 'Privacy',
  documentLabel: 'Document',
  contents: 'Contents',
  close: 'Close',
  effective: 'Effective {date}',
  minutes: '{n} minute read',
  bindingNote: 'This document is in English, and the English version is the binding one.',
  understand: 'I understand',
  backToTop: 'Back to top',
};

const legal = {
  en,
  ja: {
    tos: '利用規約', privacy: 'プライバシーポリシー', tabTos: '利用規約', tabPrivacy: 'プライバシー',
    documentLabel: '文書', contents: '目次', close: '閉じる', effective: '施行日 {date}', minutes: '約{n}分で読めます',
    bindingNote: 'この文書は英語で書かれており、英語版が正式な内容となります。',
    understand: '確認しました', backToTop: 'ページの先頭へ',
  },
  fr: {
    tos: 'Conditions d’utilisation', privacy: 'Politique de confidentialité', tabTos: 'Conditions', tabPrivacy: 'Confidentialité',
    documentLabel: 'Document', contents: 'Sommaire', close: 'Fermer', effective: 'En vigueur depuis le {date}', minutes: '{n} min de lecture',
    bindingNote: 'Ce document est en anglais, et seule la version anglaise fait foi.',
    understand: 'J’ai compris', backToTop: 'Revenir en haut',
  },
  it: {
    tos: 'Termini di servizio', privacy: 'Informativa sulla privacy', tabTos: 'Termini', tabPrivacy: 'Privacy',
    documentLabel: 'Documento', contents: 'Indice', close: 'Chiudi', effective: 'In vigore dal {date}', minutes: '{n} min di lettura',
    bindingNote: 'Questo documento è in inglese e fa fede solo la versione inglese.',
    understand: 'Ho capito', backToTop: 'Torna su',
  },
  pt: {
    tos: 'Termos de Uso', privacy: 'Política de Privacidade', tabTos: 'Termos', tabPrivacy: 'Privacidade',
    documentLabel: 'Documento', contents: 'Sumário', close: 'Fechar', effective: 'Vigente desde {date}', minutes: 'Leitura de {n} min',
    bindingNote: 'Este documento está em inglês, e a versão em inglês é a que vale oficialmente.',
    understand: 'Entendi', backToTop: 'Voltar ao topo',
  },
  zh: {
    tos: '服务条款', privacy: '隐私政策', tabTos: '条款', tabPrivacy: '隐私',
    documentLabel: '文档', contents: '目录', close: '关闭', effective: '生效日期：{date}', minutes: '约 {n} 分钟读完',
    bindingNote: '本文件为英文版本，具有法律效力的是英文版本。',
    understand: '我已了解', backToTop: '回到顶部',
  },
  de: {
    tos: 'Nutzungsbedingungen', privacy: 'Datenschutzerklärung', tabTos: 'Bedingungen', tabPrivacy: 'Datenschutz',
    documentLabel: 'Dokument', contents: 'Inhalt', close: 'Schliessen', effective: 'Gültig ab {date}', minutes: '{n} Min. Lesezeit',
    bindingNote: 'Dieses Dokument ist auf Englisch, und verbindlich ist die englische Fassung.',
    understand: 'Verstanden', backToTop: 'Nach oben',
  },
  es: {
    tos: 'Condiciones de uso', privacy: 'Política de privacidad', tabTos: 'Condiciones', tabPrivacy: 'Privacidad',
    documentLabel: 'Documento', contents: 'Índice', close: 'Cerrar', effective: 'En vigor desde el {date}', minutes: '{n} min de lectura',
    bindingNote: 'Este documento está en inglés, y la versión en inglés es la que tiene validez legal.',
    understand: 'Entendido', backToTop: 'Volver arriba',
  },
  'es-MX': {
    tos: 'Términos y condiciones', privacy: 'Aviso de privacidad', tabTos: 'Términos',
    effective: 'Vigente desde el {date}',
  },
  'pt-PT': {
    tos: 'Termos de Utilização', privacy: 'Política de Privacidade', tabTos: 'Termos', tabPrivacy: 'Privacidade',
    documentLabel: 'Documento', contents: 'Índice', close: 'Fechar', effective: 'Em vigor desde {date}', minutes: '{n} min de leitura',
    bindingNote: 'Este documento está em inglês, e a versão inglesa é a que faz fé.',
    understand: 'Percebi', backToTop: 'Voltar ao início',
  },
} satisfies UiTable<typeof en>;

export default legal;
