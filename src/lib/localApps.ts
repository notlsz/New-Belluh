// The apps Bella gets things ready in, where the reader lives: the ones people there actually use (region.ts on the
// server holds the links). Shown under Apps in Ideas and goals, so a couple in Tokyo sees Tabelog and LINE, not OpenTable.

import type { Country } from '../i18n/core';

export type AppCategory = 'table' | 'gifts' | 'food' | 'rides' | 'tickets';
export const LOCAL_APPS: Record<Country, Record<AppCategory, string[]>> = {
  US: { table: ['OpenTable', 'Resy'], gifts: ['Shop', 'Amazon', 'Target', 'UrbanStems'], food: ['DoorDash', 'Uber Eats', 'Instacart'], rides: ['Uber', 'Lyft'], tickets: ['Ticketmaster', 'Airbnb Experiences'] },
  CA: { table: ['OpenTable'], gifts: ['Amazon.ca'], food: ['Uber Eats', 'DoorDash', 'SkipTheDishes'], rides: ['Uber', 'Lyft'], tickets: ['Ticketmaster'] },
  GB: { table: ['OpenTable'], gifts: ['Bloom & Wild', 'Moonpig', 'Amazon.co.uk'], food: ['Deliveroo', 'Just Eat', 'Uber Eats'], rides: ['Uber', 'Bolt', 'TfL'], tickets: ['Ticketmaster'] },
  AU: { table: ['OpenTable'], gifts: ['Amazon.com.au'], food: ['Uber Eats', 'DoorDash', 'Menulog'], rides: ['Uber', 'DiDi'], tickets: ['Ticketmaster'] },
  JP: { table: ['食べログ', 'ホットペッパー', 'OMAKASE'], gifts: ['楽天', 'Amazon.co.jp'], food: ['Uber Eats', '出前館'], rides: ['乗換案内', 'GO', 'Uber'], tickets: ['ぴあ', 'Airbnb'] },
  FR: { table: ['TheFork', 'LaFourchette'], gifts: ['Amazon.fr', 'Fnac', 'Interflora'], food: ['Uber Eats', 'Deliveroo'], rides: ['RATP', 'Uber', 'G7'], tickets: ['Ticketmaster', 'Fnac Spectacles'] },
  IT: { table: ['TheFork'], gifts: ['Amazon.it', 'Interflora'], food: ['Glovo', 'Deliveroo', 'Just Eat'], rides: ['Trenitalia', 'Italo', 'FREENOW'], tickets: ['Ticketmaster', 'TicketOne'] },
  BR: { table: ['TheFork', 'Google Maps'], gifts: ['Mercado Livre', 'Amazon.com.br', 'Giuliana Flores'], food: ['iFood'], rides: ['Uber', '99'], tickets: ['Sympla', 'Ingresso.com'] },
  CN: { table: ['大众点评', '美团'], gifts: ['京东', '天猫', '淘宝'], food: ['美团外卖', '饿了么'], rides: ['滴滴'], tickets: ['大麦', '猫眼'] },
  CH: { table: ['TheFork'], gifts: ['Galaxus', 'Fleurop'], food: ['Uber Eats', 'Smood'], rides: ['SBB', 'Uber'], tickets: ['Ticketcorner', 'Ticketmaster'] },
  ES: { table: ['TheFork', 'Google Maps'], gifts: ['El Corte Inglés', 'Amazon.es', 'Interflora'], food: ['Glovo', 'Just Eat', 'Uber Eats'], rides: ['Cabify', 'Uber', 'Renfe'], tickets: ['Ticketmaster', 'Entradas.com'] },
  MX: { table: ['OpenTable', 'Google Maps'], gifts: ['Mercado Libre', 'Amazon.com.mx'], food: ['Rappi', 'Uber Eats', 'DiDi Food'], rides: ['Uber', 'DiDi'], tickets: ['Ticketmaster', 'Boletia'] },
  PT: { table: ['TheFork', 'Google Maps'], gifts: ['Fnac', 'Worten', 'El Corte Inglés'], food: ['Glovo', 'Uber Eats', 'Bolt Food'], rides: ['Uber', 'Bolt', 'CP'], tickets: ['Ticketline', 'BOL'] },
  KR: { table: ['캐치테이블', '네이버 예약'], gifts: ['카카오톡 선물하기', '쿠팡', '네이버 쇼핑'], food: ['배달의민족', '쿠팡이츠', '요기요'], rides: ['카카오 T', '네이버 지도'], tickets: ['NOL 티켓', 'YES24 티켓', '멜론티켓'] },
  OTHER: { table: ['TheFork', 'OpenTable', 'Google Maps'], gifts: ['Amazon'], food: ['Uber Eats'], rides: ['Uber'], tickets: ['Ticketmaster'] },
};

export const RESEARCH_SOURCES = ['Europe PMC', 'Semantic Scholar', 'OpenAlex'];
