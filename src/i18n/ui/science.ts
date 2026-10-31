// The landing page's science section and mission line: what research says keeps couples close (the studies are real
// and Bella cites them when asked), and the promise Belluh makes, in the spirit of Hinge's "designed to be deleted".
import type { UiTable } from '../ui';

const en = {
  title: 'Built on relationship science.',
  sub: 'Decades of research say love lasts in small, ordinary moments. Bella is built around them, and when you ask, she shows you the studies.',
  findings: [
    { title: 'Turn toward the small things', body: 'Couples who respond to each other’s everyday bids for attention stay happier and fight more kindly.', source: 'Driver & Gottman, Family Process, 2004' },
    { title: 'Celebrate the good news', body: 'How you react when your partner shares something good predicts how close you feel, more than how you handle the bad.', source: 'Gable et al., Journal of Personality and Social Psychology, 2004' },
    { title: 'Do something new together', body: 'Trying new, exciting things as a pair lifts relationship satisfaction, even years in.', source: 'Aron et al., Journal of Personality and Social Psychology, 2000' },
  ],
  missionLine: 'Built to get you off your phone and back to each other.',
  missionSub: 'Bella does the remembering and the planning, so your time goes to each other, not to an app.',
};

const es = {
  title: 'Hecho sobre la ciencia de las relaciones.',
  sub: 'Décadas de investigación dicen que el amor dura en los momentos pequeños y cotidianos. Bella está hecha alrededor de ellos y, si se lo pides, te enseña los estudios.',
  findings: [
    { title: 'Atiende las cosas pequeñas', body: 'Las parejas que responden a las pequeñas llamadas de atención del otro son más felices y discuten con más cariño.', source: 'Driver y Gottman, Family Process, 2004' },
    { title: 'Celebra las buenas noticias', body: 'Cómo reaccionas cuando tu pareja te cuenta algo bueno predice lo unidos que os sentís, más que cómo gestionáis lo malo.', source: 'Gable et al., Journal of Personality and Social Psychology, 2004' },
    { title: 'Haced algo nuevo juntos', body: 'Probar cosas nuevas y emocionantes en pareja aumenta la satisfacción, incluso después de años.', source: 'Aron et al., Journal of Personality and Social Psychology, 2000' },
  ],
  missionLine: 'Hecho para que dejes el móvil y vuelvas a mirarte con tu pareja.',
  missionSub: 'Bella se encarga de recordar y de organizar, para que vuestro tiempo sea para vosotros, no para una app.',
};

const science: UiTable<typeof en> = {
  en,
  ja: {
    title: '恋愛の科学に、もとづいて。',
    sub: '何十年もの研究が、愛は小さな日常の瞬間に続いていくと示しています。Bellaはそこを大切に作られていて、聞けば研究そのものも見せてくれます。',
    findings: [
      { title: '小さなサインに気づく', body: '相手の日常の「ちょっと聞いて」に応えるカップルほど幸せで、けんかもやさしくなります。', source: 'Driver & Gottman, Family Process, 2004' },
      { title: 'いい知らせを一緒に喜ぶ', body: '相手のうれしい話への反応のほうが、つらいときの対応よりも、ふたりの親密さを予測します。', source: 'Gable et al., Journal of Personality and Social Psychology, 2004' },
      { title: 'ふたりで新しいことを', body: '新しくてわくわくすることを一緒に試すと、何年たっても関係の満足度が上がります。', source: 'Aron et al., Journal of Personality and Social Psychology, 2000' },
    ],
    missionLine: 'スマホを置いて、ふたりの時間に戻るために。',
    missionSub: '覚えておくことも、計画することもBellaにまかせて。時間はアプリではなく、ふたりのために。',
  },
  fr: {
    title: 'Fondé sur la science du couple.',
    sub: 'Des décennies de recherche le disent : l’amour dure dans les petits moments ordinaires. Bella est pensée autour d’eux et, si tu lui demandes, elle te montre les études.',
    findings: [
      { title: 'Répondre aux petites attentions', body: 'Les couples qui répondent aux petits appels d’attention du quotidien sont plus heureux et se disputent plus tendrement.', source: 'Driver & Gottman, Family Process, 2004' },
      { title: 'Fêter les bonnes nouvelles', body: 'Ta réaction quand l’autre partage une bonne nouvelle prédit votre proximité, plus que ta façon de gérer les mauvaises.', source: 'Gable et al., Journal of Personality and Social Psychology, 2004' },
      { title: 'Faire du nouveau ensemble', body: 'Essayer à deux des choses nouvelles et stimulantes augmente la satisfaction du couple, même après des années.', source: 'Aron et al., Journal of Personality and Social Psychology, 2000' },
    ],
    missionLine: 'Fait pour te faire lâcher ton téléphone et te ramener à l’autre.',
    missionSub: 'Bella se souvient et organise, pour que votre temps soit à vous deux, pas à une appli.',
  },
  it: {
    title: 'Costruito sulla scienza delle relazioni.',
    sub: 'Decenni di ricerca dicono che l’amore dura nei piccoli momenti di tutti i giorni. Bella è costruita attorno a questi e, se glielo chiedi, ti mostra gli studi.',
    findings: [
      { title: 'Accogliere le piccole cose', body: 'Le coppie che rispondono ai piccoli richiami di attenzione quotidiani sono più felici e litigano con più dolcezza.', source: 'Driver & Gottman, Family Process, 2004' },
      { title: 'Festeggiare le belle notizie', body: 'Come reagisci quando l’altro condivide qualcosa di bello predice quanto vi sentite vicini, più di come gestite il brutto.', source: 'Gable et al., Journal of Personality and Social Psychology, 2004' },
      { title: 'Fare qualcosa di nuovo insieme', body: 'Provare in due cose nuove ed emozionanti aumenta la soddisfazione di coppia, anche dopo anni.', source: 'Aron et al., Journal of Personality and Social Psychology, 2000' },
    ],
    missionLine: 'Fatto per farti posare il telefono e tornare l’uno dall’altra.',
    missionSub: 'Bella ricorda e organizza, così il vostro tempo va a voi due, non a un’app.',
  },
  pt: {
    title: 'Feito com base na ciência dos relacionamentos.',
    sub: 'Décadas de pesquisa mostram que o amor dura nos momentos pequenos do dia a dia. A Bella foi feita em volta deles e, se você pedir, ela mostra os estudos.',
    findings: [
      { title: 'Dar atenção às pequenas coisas', body: 'Casais que respondem aos pequenos pedidos de atenção do dia a dia são mais felizes e brigam com mais carinho.', source: 'Driver & Gottman, Family Process, 2004' },
      { title: 'Comemorar as boas notícias', body: 'Como você reage quando seu amor conta algo bom prevê o quanto vocês se sentem próximos, mais do que lidar com o ruim.', source: 'Gable et al., Journal of Personality and Social Psychology, 2004' },
      { title: 'Fazer algo novo juntos', body: 'Experimentar coisas novas e empolgantes a dois aumenta a satisfação, mesmo depois de anos.', source: 'Aron et al., Journal of Personality and Social Psychology, 2000' },
    ],
    missionLine: 'Feito pra você largar o celular e voltar um pro outro.',
    missionSub: 'A Bella lembra e planeja, pra que o tempo de vocês seja de vocês, não de um app.',
  },
  zh: {
    title: '以关系科学为基础。',
    sub: '几十年的研究表明，爱情靠的是平凡的小时刻。Bella 就是围绕这些时刻打造的，你一问，她就把研究给你看。',
    findings: [
      { title: '回应生活里的小信号', body: '能回应对方日常小小求关注的情侣，更幸福，吵架也更温和。', source: 'Driver & Gottman, Family Process, 2004' },
      { title: '为好消息一起高兴', body: '对方分享好消息时你的反应，比你们如何应对坏事，更能预示彼此有多亲近。', source: 'Gable et al., Journal of Personality and Social Psychology, 2004' },
      { title: '一起做点新鲜事', body: '两个人一起尝试新鲜刺激的事，即使在一起很多年，也能提升感情满意度。', source: 'Aron et al., Journal of Personality and Social Psychology, 2000' },
    ],
    missionLine: '让你放下手机，回到彼此身边。',
    missionSub: '记事和安排交给 Bella，你们的时间留给彼此，而不是一个应用。',
  },
  de: {
    title: 'Gebaut auf Beziehungsforschung.',
    sub: 'Jahrzehnte Forschung zeigen: Liebe hält in kleinen, alltäglichen Momenten. Bella ist um sie herum gebaut, und wenn du fragst, zeigt sie dir die Studien.',
    findings: [
      { title: 'Auf die kleinen Dinge eingehen', body: 'Paare, die auf die kleinen Bitten um Aufmerksamkeit im Alltag eingehen, sind glücklicher und streiten liebevoller.', source: 'Driver & Gottman, Family Process, 2004' },
      { title: 'Gute Nachrichten feiern', body: 'Wie du reagierst, wenn dein Schatz etwas Schönes erzählt, sagt eure Nähe besser voraus als der Umgang mit Schwierigem.', source: 'Gable et al., Journal of Personality and Social Psychology, 2004' },
      { title: 'Gemeinsam Neues erleben', body: 'Zusammen Neues und Aufregendes auszuprobieren steigert die Zufriedenheit, auch nach Jahren.', source: 'Aron et al., Journal of Personality and Social Psychology, 2000' },
    ],
    missionLine: 'Gemacht, damit ihr das Handy weglegt und wieder bei euch seid.',
    missionSub: 'Bella erinnert sich und plant, damit eure Zeit euch gehört, nicht einer App.',
  },
  es,
  'es-MX': {
    findings: [
      es.findings[0],
      { title: 'Celebra las buenas noticias', body: 'Cómo reaccionas cuando tu pareja te cuenta algo bueno predice qué tan unidos se sienten, más que cómo manejan lo malo.', source: 'Gable et al., Journal of Personality and Social Psychology, 2004' },
      { title: 'Hagan algo nuevo juntos', body: 'Probar cosas nuevas y emocionantes en pareja aumenta la satisfacción, incluso después de años.', source: 'Aron et al., Journal of Personality and Social Psychology, 2000' },
    ],
    missionLine: 'Hecho para que sueltes el celular y vuelvas con tu pareja.',
    missionSub: 'Bella se encarga de recordar y de planear, para que su tiempo sea para ustedes, no para una app.',
  },
  'pt-PT': {
    title: 'Feito com base na ciência das relações.',
    sub: 'Décadas de investigação mostram que o amor dura nos pequenos momentos do dia a dia. A Bella foi feita à volta deles e, se lhe pedires, mostra-te os estudos.',
    findings: [
      { title: 'Dar atenção às pequenas coisas', body: 'Os casais que respondem aos pequenos pedidos de atenção do dia a dia são mais felizes e discutem com mais carinho.', source: 'Driver & Gottman, Family Process, 2004' },
      { title: 'Celebrar as boas notícias', body: 'A forma como reages quando a tua cara-metade partilha algo bom prevê o quão próximos se sentem, mais do que lidar com o mau.', source: 'Gable et al., Journal of Personality and Social Psychology, 2004' },
      { title: 'Fazer algo novo a dois', body: 'Experimentar coisas novas e entusiasmantes a dois aumenta a satisfação, mesmo ao fim de anos.', source: 'Aron et al., Journal of Personality and Social Psychology, 2000' },
    ],
    missionLine: 'Feito para pousares o telemóvel e voltares um para o outro.',
    missionSub: 'A Bella lembra-se e planeia, para que o vosso tempo seja vosso, não de uma app.',
  },
};

export default science;
