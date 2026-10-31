// A sticker for a plan, the way Pampam pins a place: one emoji that says what it is at a glance, in any language.
const KINDS: [RegExp, string][] = [
  [/coffee|caf[eéè]|caff[eè]|kaffee|咖啡|コーヒー|カフェ/i, '☕'],
  [/ramen|thai|ラーメン|拉面|noodle|pho|udon|うどん/i, '🍜'],
  [/sushi|寿司|すし|omakase|おまかせ/i, '🍣'],
  [/pizza|pasta|italian|italien|italiano/i, '🍝'],
  [/dinner|lunch|brunch|breakfast|restaurant|tacos?|bbq|cena|comida|almuerzo|d[iî]ner|d[ée]jeuner|pranzo|abendessen|essen|jantar|almo[cç]o|晚餐|午餐|吃饭|ディナー|ランチ|ご飯|ごはん|食事|焼肉/i, '🥂'],
  [/trip|travel|flight|weekend away|getaway|viaje|voyage|viaggio|reise|urlaub|viagem|旅|旅行|旅游/i, '✈️'],
  [/movie|film|cinema|cine|kino|映画|电影/i, '🎬'],
  [/concert|gig|show|festival|ライブ|演唱会|konzert|concierto|concerto|show/i, '🎶'],
  [/hike|walk|trail|randonn[ée]e|wander|spaziergang|caminata|paseo|passeggiata|trilha|caminhada|散歩|ハイキング|徒步|散步/i, '🥾'],
  [/beach|playa|plage|spiaggia|strand|praia|海|ビーチ/i, '🏖️'],
  [/picnic|pique-nique|picnic|ピクニック|野餐/i, '🧺'],
  [/birthday|cumplea[ñn]os|anniversaire|compleanno|geburtstag|anivers[aá]rio|誕生日|生日/i, '🎂'],
  [/anniversary|aniversario|anniversaire de mariage|anniversario|jahrestag|記念日|纪念日/i, '💍'],
  [/museum|museo|mus[ée]e|museu|美術館|博物馆|gallery|galer/i, '🖼️'],
  [/game|match|partido|jeu|partita|spiel|jogo|試合|比赛/i, '🏟️'],
  [/cook|cocinar|cuisiner|cucinare|kochen|cozinhar|料理|做饭/i, '🥘'],
  [/drinks?|wine|bar|cocktail|vino|vin|wein|vinho|ワイン|居酒屋|喝酒/i, '🍷'],
];
export const stickerFor = (title: string) => KINDS.find(([re]) => re.test(title))?.[1] ?? '💞';
