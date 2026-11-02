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
    bookedByBella: "Booked by Bella",
    orderedByBella: "Order confirmed by Bella",
    tableFor: "table for {n}",
    ref: "ref {ref}",
    orderRef: "order {ref}",
    confirmsOnPay: "Once you've paid, Bella confirms it with {seller} herself",
    wentThrough: "Yes, it went through",
    notYet: "Not yet",
    skipIt: "No, skip it",
    keptReady: "Okay. Bella keeps it ready.",
    setAside: "Okay, set aside.",
  },
};

const planActions: UiTable<typeof en> = {
  en,
  ja: {
    plan: { yourPartner: "パートナー", icsDetails: "Belluhでふたりで決めた予定" },
    acts: { call: "電話", bookAt: "{name}を2名で予約して。日時は ", bookAtAddress: "{name}（{address}）を2名で予約して。日時は ", bookedByBella: "Bellaが予約しました", orderedByBella: "Bellaが注文を確認しました", tableFor: "{n}名席", ref: "予約番号 {ref}", orderRef: "注文番号 {ref}", confirmsOnPay: "お支払いが済んだら、Bellaが{seller}に確認します", wentThrough: "うん、できた", notYet: "まだ", skipIt: "やめておく", keptReady: "了解。このまま準備しておきます。", setAside: "了解、いったん外しておきます。" },
  },
  fr: {
    plan: { yourPartner: "ta moitié", icsDetails: "Prévu ensemble sur Belluh" },
    acts: { call: "Appeler", bookAt: "Réserve-nous une table chez {name}, pour 2, à ", bookAtAddress: "Réserve-nous une table chez {name}, {address}, pour 2, à ", bookedByBella: "Réservé par Bella", orderedByBella: "Commande confirmée par Bella", tableFor: "table pour {n}", ref: "réf. {ref}", orderRef: "commande {ref}", confirmsOnPay: "Une fois que tu as payé, Bella le confirme elle-même avec {seller}", wentThrough: "Oui, c’est bon", notYet: "Pas encore", skipIt: "Non, laisse tomber", keptReady: "D’accord. Bella le garde prêt.", setAside: "D’accord, c’est mis de côté." },
  },
  it: {
    plan: { yourPartner: "il tuo partner", icsDetails: "Organizzato insieme su Belluh" },
    acts: { call: "Chiama", bookAt: "Prenotaci un tavolo da {name}, per 2, alle ", bookAtAddress: "Prenotaci un tavolo da {name}, {address}, per 2, alle ", bookedByBella: "Prenotato da Bella", orderedByBella: "Ordine confermato da Bella", tableFor: "tavolo per {n}", ref: "rif. {ref}", orderRef: "ordine {ref}", confirmsOnPay: "Quando hai pagato, Bella lo conferma lei con {seller}", wentThrough: "Sì, è andata", notYet: "Non ancora", skipIt: "No, lascia stare", keptReady: "Va bene. Bella lo tiene pronto.", setAside: "Va bene, messo da parte." },
  },
  pt: {
    plan: { yourPartner: "seu amor", icsDetails: "Planejado juntos no Belluh" },
    acts: { call: "Ligar", bookAt: "Reserva uma mesa pra gente no {name}, pra 2, às ", bookAtAddress: "Reserva uma mesa pra gente no {name}, {address}, pra 2, às ", bookedByBella: "Reservado pela Bella", orderedByBella: "Pedido confirmado pela Bella", tableFor: "mesa para {n}", ref: "cód. {ref}", orderRef: "pedido {ref}", confirmsOnPay: "Depois que você pagar, a Bella confirma com {seller}", wentThrough: "Sim, deu certo", notYet: "Ainda não", skipIt: "Não, deixa pra lá", keptReady: "Beleza. A Bella deixa pronto.", setAside: "Tudo bem, deixei de lado." },
  },
  zh: {
    plan: { yourPartner: "另一半", icsDetails: "在 Belluh 里一起定下的计划" },
    acts: { call: "打电话", bookAt: "帮我们在{name}订一张两人桌，时间是 ", bookAtAddress: "帮我们在{name}（{address}）订一张两人桌，时间是 ", bookedByBella: "Bella 已订好", orderedByBella: "Bella 已确认订单", tableFor: "{n} 人桌", ref: "预订号 {ref}", orderRef: "订单号 {ref}", confirmsOnPay: "你付款后，Bella 会自己跟 {seller} 确认", wentThrough: "订好了", notYet: "还没有", skipIt: "不用了", keptReady: "好的，Bella 先帮你留着。", setAside: "好的，先放一边。" },
  },
  de: {
    plan: { yourPartner: "dein Partner", icsDetails: "Zusammen in Belluh geplant" },
    acts: { call: "Anrufen", bookAt: "Reservier uns einen Tisch im {name}, für 2, um ", bookAtAddress: "Reservier uns einen Tisch im {name}, {address}, für 2, um ", bookedByBella: "Von Bella reserviert", orderedByBella: "Bestellung von Bella bestätigt", tableFor: "Tisch für {n}", ref: "Nr. {ref}", orderRef: "Bestellung {ref}", confirmsOnPay: "Sobald du bezahlt hast, bestätigt Bella es selbst bei {seller}", wentThrough: "Ja, hat geklappt", notYet: "Noch nicht", skipIt: "Nein, lass es", keptReady: "Okay. Bella hält es bereit.", setAside: "Okay, zur Seite gelegt." },
  },
  es: {
    plan: { yourPartner: "tu pareja", icsDetails: "Planeado juntos en Belluh" },
    acts: { call: "Llamar", bookAt: "Resérvanos una mesa en {name}, para 2, a las ", bookAtAddress: "Resérvanos una mesa en {name}, {address}, para 2, a las ", bookedByBella: "Reservado por Bella", orderedByBella: "Pedido confirmado por Bella", tableFor: "mesa para {n}", ref: "ref. {ref}", orderRef: "pedido {ref}", confirmsOnPay: "Cuando pagues, Bella lo confirma ella misma con {seller}", wentThrough: "Sí, ya está", notYet: "Todavía no", skipIt: "No, déjalo", keptReady: "Vale. Bella lo deja listo.", setAside: "Vale, lo dejo aparte." },
  },
  ko: {
    plan: { yourPartner: '연인', icsDetails: 'Belluh에서 함께 세운 계획' },
    acts: { call: '전화', bookAt: '{name}에 2명 자리 예약해 줘. 시간은 ', bookAtAddress: '{name}({address})에 2명 자리 예약해 줘. 시간은 ', bookedByBella: "벨라가 예약했어요", orderedByBella: "벨라가 주문을 확인했어요", tableFor: "{n}명 자리", ref: "예약번호 {ref}", orderRef: "주문번호 {ref}", confirmsOnPay: "결제하면 벨라가 {seller}에 직접 확인해요", wentThrough: "응, 됐어", notYet: "아직", skipIt: "아니, 안 할래", keptReady: "알겠어요. 벨라가 준비해 둘게요.", setAside: "알겠어요, 빼 둘게요." },
  },
  'es-MX': {
    acts: { call: "Llamar", bookAt: "Resérvanos una mesa en {name}, para 2, a las ", bookAtAddress: "Resérvanos una mesa en {name}, {address}, para 2, a las ", bookedByBella: "Reservado por Bella", orderedByBella: "Pedido confirmado por Bella", tableFor: "mesa para {n}", ref: "ref. {ref}", orderRef: "pedido {ref}", wentThrough: "Sí, ya quedó", notYet: "Todavía no", skipIt: "No, mejor no", keptReady: "Va. Bella lo deja listo.", setAside: "Va, lo dejo aparte.", confirmsOnPay: "Cuando pagues, Bella lo confirma con {seller}" },
  },
  'pt-PT': {
    plan: { yourPartner: "a tua cara-metade", icsDetails: "Planeado a dois no Belluh" },
    acts: { call: "Ligar", bookAt: "Reserva-nos uma mesa no {name}, para 2, às ", bookAtAddress: "Reserva-nos uma mesa no {name}, {address}, para 2, às ", bookedByBella: "Reservado pela Bella", orderedByBella: "Encomenda confirmada pela Bella", tableFor: "mesa para {n}", ref: "ref. {ref}", orderRef: "encomenda {ref}", confirmsOnPay: "Depois de pagares, a Bella confirma com {seller}", wentThrough: "Sim, ficou feito", notYet: "Ainda não", skipIt: "Não, deixa estar", keptReady: "Está bem. A Bella deixa pronto.", setAside: "Está bem, fica de lado." },
  },
};

export default planActions;
