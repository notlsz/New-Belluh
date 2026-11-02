// Plan cards and what Bella offers under her messages (the rest lives in the dictionaries under app.plan and app.acts).
import type { UiTable } from '../ui';

const en = {
  plan: {
    yourPartner: "your partner",
    icsDetails: "Planned together in Belluh",
  },
  acts: {
    call: "Call",
    bookAt: "Book us a table at {name}, for 2, at ",
    bookAtAddress: "Book us a table at {name}, {address}, for 2, at ",
  },
};

const planActions: UiTable<typeof en> = {
  en,
  ja: {
    plan: { yourPartner: "パートナー", icsDetails: "Belluhでふたりで決めた予定" },
    acts: { call: "電話", bookAt: "{name}を2名で予約して。日時は ", bookAtAddress: "{name}（{address}）を2名で予約して。日時は " },
  },
  fr: {
    plan: { yourPartner: "ta moitié", icsDetails: "Prévu ensemble sur Belluh" },
    acts: { call: "Appeler", bookAt: "Réserve-nous une table chez {name}, pour 2, à ", bookAtAddress: "Réserve-nous une table chez {name}, {address}, pour 2, à " },
  },
  it: {
    plan: { yourPartner: "il tuo partner", icsDetails: "Organizzato insieme su Belluh" },
    acts: { call: "Chiama", bookAt: "Prenotaci un tavolo da {name}, per 2, alle ", bookAtAddress: "Prenotaci un tavolo da {name}, {address}, per 2, alle " },
  },
  pt: {
    plan: { yourPartner: "seu amor", icsDetails: "Planejado juntos no Belluh" },
    acts: { call: "Ligar", bookAt: "Reserva uma mesa pra gente no {name}, pra 2, às ", bookAtAddress: "Reserva uma mesa pra gente no {name}, {address}, pra 2, às " },
  },
  zh: {
    plan: { yourPartner: "另一半", icsDetails: "在 Belluh 里一起定下的计划" },
    acts: { call: "打电话", bookAt: "帮我们在{name}订一张两人桌，时间是 ", bookAtAddress: "帮我们在{name}（{address}）订一张两人桌，时间是 " },
  },
  de: {
    plan: { yourPartner: "dein Partner", icsDetails: "Zusammen in Belluh geplant" },
    acts: { call: "Anrufen", bookAt: "Reservier uns einen Tisch im {name}, für 2, um ", bookAtAddress: "Reservier uns einen Tisch im {name}, {address}, für 2, um " },
  },
  es: {
    plan: { yourPartner: "tu pareja", icsDetails: "Planeado juntos en Belluh" },
    acts: { call: "Llamar", bookAt: "Resérvanos una mesa en {name}, para 2, a las ", bookAtAddress: "Resérvanos una mesa en {name}, {address}, para 2, a las " },
  },
  ko: {
    plan: { yourPartner: '연인', icsDetails: 'Belluh에서 함께 세운 계획' },
    acts: { call: '전화', bookAt: '{name}에 2명 자리 예약해 줘. 시간은 ', bookAtAddress: '{name}({address})에 2명 자리 예약해 줘. 시간은 ' },
  },
  'es-MX': {},
  'pt-PT': {
    plan: { yourPartner: "a tua cara-metade", icsDetails: "Planeado a dois no Belluh" },
    acts: { call: "Ligar", bookAt: "Reserva-nos uma mesa no {name}, para 2, às ", bookAtAddress: "Reserva-nos uma mesa no {name}, {address}, para 2, às " },
  },
};

export default planActions;
