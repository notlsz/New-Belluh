// The one-minute film on the landing page: Bella remembering the tickets, calling the restaurant, sending the flowers
import type { UiTable } from '../ui';

const en = {
  title: 'Everything you meant to do. Done.',
  sub: 'Watch Bella remember the tickets, call the restaurant and send the flowers, so all you have to do is show up.',
  watch: 'Watch the film',
  length: '1 min',
  label: 'Belluh film: Bella books tickets, a table and flowers',
};

const t: UiTable<typeof en> = {
  en,
  ja: { title: 'やろうと思っていたこと、ぜんぶ。', sub: 'チケットを覚えていて、レストランに電話して、花を贈る。あなたは、その場に行くだけ。Bellaの1分を見てください。', watch: '映像を見る', length: '1分', label: 'Belluhの映像：Bellaがチケット、席、花を手配します' },
  fr: { title: 'Tout ce que vous vouliez faire. C’est fait.', sub: 'Bella se souvient des billets, appelle le restaurant et envoie les fleurs. Vous n’avez plus qu’à venir.', watch: 'Voir le film', length: '1 min', label: 'Film Belluh : Bella réserve des billets, une table et des fleurs' },
  it: { title: 'Tutto quello che volevi fare. Fatto.', sub: 'Bella si ricorda dei biglietti, chiama il ristorante e manda i fiori. A te resta solo esserci.', watch: 'Guarda il film', length: '1 min', label: 'Il film di Belluh: Bella prenota biglietti, un tavolo e i fiori' },
  pt: { title: 'Tudo o que você queria fazer. Feito.', sub: 'A Bella lembra dos ingressos, liga para o restaurante e manda as flores. Você só precisa aparecer.', watch: 'Ver o filme', length: '1 min', label: 'Filme do Belluh: a Bella reserva ingressos, uma mesa e flores' },
  zh: { title: '你想做的每件事，都办好了。', sub: '看 Bella 记得买票、打电话订位、送花。你只需要准时出现。', watch: '观看影片', length: '1 分钟', label: 'Belluh 影片：Bella 订票、订位、送花' },
  de: { title: 'Alles, was du vorhattest. Erledigt.', sub: 'Bella denkt an die Tickets, ruft im Restaurant an und schickt die Blumen. Du musst nur noch da sein.', watch: 'Film ansehen', length: '1 Min.', label: 'Belluh-Film: Bella bucht Tickets, einen Tisch und Blumen' },
  es: { title: 'Todo lo que querías hacer. Hecho.', sub: 'Bella se acuerda de las entradas, llama al restaurante y envía las flores. Tú solo tienes que estar.', watch: 'Ver la película', length: '1 min', label: 'Película de Belluh: Bella reserva entradas, una mesa y flores' },
  ko: { title: '하려던 모든 일, 다 됐어요.', sub: 'Bella가 티켓을 기억하고, 식당에 전화하고, 꽃을 보내요. 당신은 그 자리에 가기만 하면 돼요.', watch: '영상 보기', length: '1분', label: 'Belluh 영상: Bella가 티켓, 자리, 꽃을 준비해요' },
  'es-MX': { title: 'Todo lo que querías hacer. Listo.', sub: 'Bella se acuerda de los boletos, llama al restaurante y manda las flores. Tú nada más tienes que llegar.', watch: 'Ver el video', label: 'Video de Belluh: Bella reserva boletos, una mesa y flores' },
  'pt-PT': { sub: 'A Bella lembra-se dos bilhetes, liga para o restaurante e envia as flores. Só tem de aparecer.', label: 'Filme do Belluh: a Bella reserva bilhetes, uma mesa e flores' },
};
export default t;
