// The two logo strips on the landing page: where Belluh's couples are, and what Belluh works with
import type { UiTable } from '../ui';

const en = { usedBy: 'Used by couples at', usedByNote: '* Used independently by individuals. Not affiliated with these organizations.', worksWith: 'Works with', worksWithNote: '* Trademarks belong to their owners.' };
const t: UiTable<typeof en> = {
  en,
  ja: { usedBy: 'こんな場所のカップルが使っています', usedByNote: '* 個人が独自に利用しています。各組織とは提携していません。', worksWith: '連携サービス', worksWithNote: '* 各商標はそれぞれの権利者に帰属します。' },
  fr: { usedBy: 'Utilisé par des couples chez', usedByNote: '* Utilisé à titre individuel. Aucun lien avec ces organisations.', worksWith: 'Fonctionne avec', worksWithNote: '* Les marques appartiennent à leurs propriétaires.' },
  it: { usedBy: 'Usato da coppie a', usedByNote: '* Usato a titolo personale. Nessuna affiliazione con queste organizzazioni.', worksWith: 'Funziona con', worksWithNote: '* I marchi appartengono ai rispettivi proprietari.' },
  pt: { usedBy: 'Usado por casais em', usedByNote: '* Usado de forma independente por pessoas. Sem afiliação com essas organizações.', worksWith: 'Funciona com', worksWithNote: '* As marcas pertencem aos seus donos.' },
  zh: { usedBy: '这些地方的情侣在用', usedByNote: '* 由个人独立使用，与上述机构无任何关联。', worksWith: '可连接', worksWithNote: '* 商标归各自所有者所有。' },
  de: { usedBy: 'Genutzt von Paaren bei', usedByNote: '* Privat von Einzelpersonen genutzt. Keine Verbindung zu diesen Organisationen.', worksWith: 'Funktioniert mit', worksWithNote: '* Marken gehören ihren jeweiligen Inhabern.' },
  es: { usedBy: 'Lo usan parejas en', usedByNote: '* Uso independiente por particulares. Sin afiliación con estas organizaciones.', worksWith: 'Funciona con', worksWithNote: '* Las marcas pertenecen a sus propietarios.' },
  ko: {
    usedBy: '이런 곳에 다니는 커플들이 써요',
    usedByNote: '* 개인이 자유롭게 이용하고 있으며, 해당 기관과는 관련이 없습니다.',
    worksWith: '함께 쓰는 서비스',
    worksWithNote: '* 각 상표의 권리는 해당 소유자에게 있습니다.',
  },
  'es-MX': {},
  'pt-PT': { usedBy: 'Usado por casais na', usedByNote: '* Usado de forma independente por particulares. Sem afiliação com estas organizações.', worksWithNote: '* As marcas pertencem aos respetivos titulares.' },
};
export default t;
