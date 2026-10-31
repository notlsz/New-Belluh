// The public pages' top bar and menu, after hinge.co: Mission, Impact and Research on the left, Careers on the right.
import type { UiTable } from '../ui';

const en = { mission: 'Mission', impact: 'Impact', research: 'Research', careers: 'Careers', why: 'Our Why', menu: 'Menu', close: 'Close', onThisPage: 'On this page' };
const site: UiTable<typeof en> = {
  en,
  es: { mission: 'Misión', impact: 'Impacto', research: 'Investigación', careers: 'Empleo', why: 'Nuestro porqué', menu: 'Menú', close: 'Cerrar', onThisPage: 'En esta página' },
  pt: { mission: 'Missão', impact: 'Impacto', research: 'Pesquisa', careers: 'Carreiras', why: 'Nosso porquê', menu: 'Menu', close: 'Fechar', onThisPage: 'Nesta página' },
  fr: { mission: 'Mission', impact: 'Impact', research: 'Recherche', careers: 'Carrières', why: 'Notre pourquoi', menu: 'Menu', close: 'Fermer', onThisPage: 'Sur cette page' },
  it: { mission: 'Missione', impact: 'Impatto', research: 'Ricerca', careers: 'Lavora con noi', why: 'Il nostro perché', menu: 'Menu', close: 'Chiudi', onThisPage: 'In questa pagina' },
  de: { mission: 'Mission', impact: 'Wirkung', research: 'Forschung', careers: 'Karriere', why: 'Unser Warum', menu: 'Menü', close: 'Schließen', onThisPage: 'Auf dieser Seite' },
  ja: { mission: 'ミッション', impact: 'インパクト', research: 'リサーチ', careers: '採用', why: 'わたしたちの想い', menu: 'メニュー', close: '閉じる', onThisPage: 'このページ' },
  zh: { mission: '使命', impact: '影响', research: '研究', careers: '加入我们', why: '我们的初心', menu: '菜单', close: '关闭', onThisPage: '本页内容' },
  'es-MX': { careers: 'Empleos' },
  'pt-PT': { careers: 'Carreiras', research: 'Investigação' },
};
export default site;
