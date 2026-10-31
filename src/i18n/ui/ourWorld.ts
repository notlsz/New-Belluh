// The couple's own world on the Us page, after amo's profile: a scratch map of where you've been together and your
// top places, ranked.
import type { UiTable } from '../ui';

const en = {
  scratch: 'Our scratch map',
  ofWorld: 'of the world',
  countries: '{n} countries', country: '1 country',
  places: '{n} places', place: '1 place',
  top: 'Our top places',
  memories: '{n} memories', memory: '1 memory',
  empty: 'Pin a memory to a place and your map starts to fill in.',
};
const es = { scratch: 'Nuestro mapa rascable', ofWorld: 'del mundo', countries: '{n} países', country: '1 país', places: '{n} lugares', place: '1 lugar', top: 'Nuestros sitios favoritos', memories: '{n} recuerdos', memory: '1 recuerdo', empty: 'Guarda un recuerdo en un lugar y vuestro mapa empezará a llenarse.' };
const pt = { scratch: 'Nosso mapa de raspar', ofWorld: 'do mundo', countries: '{n} países', country: '1 país', places: '{n} lugares', place: '1 lugar', top: 'Nossos lugares favoritos', memories: '{n} memórias', memory: '1 memória', empty: 'Marque uma memória num lugar e o mapa de vocês começa a se encher.' };

const ourWorld: UiTable<typeof en> = {
  en,
  ja: { scratch: 'ふたりのスクラッチマップ', ofWorld: '世界のうち', countries: '{n}か国', country: '1か国', places: '{n}か所', place: '1か所', top: 'ふたりのお気に入りの場所', memories: '思い出{n}件', memory: '思い出1件', empty: '思い出を場所に残すと、地図が少しずつ埋まっていきます。' },
  fr: { scratch: 'Notre carte à gratter', ofWorld: 'du monde', countries: '{n} pays', country: '1 pays', places: '{n} lieux', place: '1 lieu', top: 'Nos lieux préférés', memories: '{n} souvenirs', memory: '1 souvenir', empty: 'Épingle un souvenir à un lieu et votre carte commence à se remplir.' },
  it: { scratch: 'La nostra mappa da grattare', ofWorld: 'del mondo', countries: '{n} paesi', country: '1 paese', places: '{n} posti', place: '1 posto', top: 'I nostri posti del cuore', memories: '{n} ricordi', memory: '1 ricordo', empty: 'Appunta un ricordo in un posto e la vostra mappa inizia a riempirsi.' },
  pt,
  zh: { scratch: '我们的刮刮地图', ofWorld: '的世界', countries: '{n} 个国家', country: '1 个国家', places: '{n} 个地方', place: '1 个地方', top: '我们最爱的地方', memories: '{n} 段回忆', memory: '1 段回忆', empty: '把回忆钉在一个地方，你们的地图就开始被点亮。' },
  de: { scratch: 'Unsere Rubbelkarte', ofWorld: 'der Welt', countries: '{n} Länder', country: '1 Land', places: '{n} Orte', place: '1 Ort', top: 'Unsere Lieblingsorte', memories: '{n} Erinnerungen', memory: '1 Erinnerung', empty: 'Pinne eine Erinnerung an einen Ort, und eure Karte füllt sich.' },
  es,
  'es-MX': { empty: 'Guarda un recuerdo en un lugar y su mapa empezará a llenarse.' },
  'pt-PT': { scratch: 'O nosso mapa de raspar', places: '{n} locais', place: '1 local', top: 'Os nossos sítios favoritos', empty: 'Marca uma memória num local e o vosso mapa começa a encher-se.' },
};
export default ourWorld;
