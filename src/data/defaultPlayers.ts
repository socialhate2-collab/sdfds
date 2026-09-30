import { Player, StatCategory } from '../types';

export const STAT_CATEGORIES: StatCategory[] = [
  { id: 'ppg', label: 'Puntos por Partido', shortLabel: 'PTS', unit: 'PPP', description: 'Máximos anotadores' },
  { id: 'rpg', label: 'Rebotes por Partido', shortLabel: 'REB', unit: 'RPP', description: 'Líderes reboteadores' },
  { id: 'apg', label: 'Asistencias por Partido', shortLabel: 'AST', unit: 'APP', description: 'Generadores de juego' },
  { id: 'tpm', label: 'Triples Anotados / Partido', shortLabel: '3PM', unit: 'T3P', description: 'Líderes desde el perímetro' },
  { id: 'pir', label: 'Valoración / Eficiencia', shortLabel: 'VAL', unit: 'PIR', description: 'Índice de impacto total' },
  { id: 'bpg', label: 'Tapones por Partido', shortLabel: 'TAP', unit: 'TPP', description: 'Protectores del aro' },
  { id: 'spg', label: 'Robos por Partido', shortLabel: 'ROB', unit: 'RPP', description: 'Ladrones de balón' }
];

export const INITIAL_PLAYERS: Player[] = [
  {
    id: 'luka-doncic',
    name: 'Luka Dončić',
    shortName: 'Dončić',
    team: 'Dallas Mavericks',
    teamCode: 'DAL',
    teamColor: '#00538C',
    league: 'NBA',
    number: 77,
    position: 'BASE',
    photoUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629029.png',
    stats: { ppg: 33.9, rpg: 9.2, apg: 9.8, spg: 1.4, bpg: 0.5, tpm: 4.1, pir: 35.8, gamesPlayed: 70, fgPct: 48.7 }
  },
  {
    id: 'giannis-antetokounmpo',
    name: 'Giannis Antetokounmpo',
    shortName: 'Giannis',
    team: 'Milwaukee Bucks',
    teamCode: 'MIL',
    teamColor: '#00471B',
    league: 'NBA',
    number: 34,
    position: 'ALA-PÍVOT',
    photoUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png',
    stats: { ppg: 30.4, rpg: 11.5, apg: 6.5, spg: 1.2, bpg: 1.1, tpm: 0.5, pir: 34.2, gamesPlayed: 73, fgPct: 61.1 }
  },
  {
    id: 'shai-gilgeous-alexander',
    name: 'Shai Gilgeous-Alexander',
    shortName: 'SGA',
    team: 'Oklahoma City Thunder',
    teamCode: 'OKC',
    teamColor: '#007AC1',
    league: 'NBA',
    number: 2,
    position: 'BASE',
    photoUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628983.png',
    stats: { ppg: 30.1, rpg: 5.5, apg: 6.2, spg: 2.0, bpg: 0.9, tpm: 1.3, pir: 31.9, gamesPlayed: 75, fgPct: 53.5 }
  },
  {
    id: 'nikola-jokic',
    name: 'Nikola Jokić',
    shortName: 'Jokić',
    team: 'Denver Nuggets',
    teamCode: 'DEN',
    teamColor: '#0E2240',
    league: 'NBA',
    number: 15,
    position: 'PÍVOT',
    photoUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203999.png',
    stats: { ppg: 26.4, rpg: 12.4, apg: 9.0, spg: 1.4, bpg: 0.9, tpm: 1.0, pir: 38.5, gamesPlayed: 79, fgPct: 58.3 }
  },
  {
    id: 'victor-wembanyama',
    name: 'Victor Wembanyama',
    shortName: 'Wembanyama',
    team: 'San Antonio Spurs',
    teamCode: 'SAS',
    teamColor: '#C4CED4',
    league: 'NBA',
    number: 1,
    position: 'PÍVOT',
    photoUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641705.png',
    stats: { ppg: 21.4, rpg: 10.6, apg: 3.9, spg: 1.2, bpg: 3.6, tpm: 1.8, pir: 28.2, gamesPlayed: 71, fgPct: 46.5 }
  },
  {
    id: 'stephen-curry',
    name: 'Stephen Curry',
    shortName: 'Curry',
    team: 'Golden State Warriors',
    teamCode: 'GSW',
    teamColor: '#1D428A',
    league: 'NBA',
    number: 30,
    position: 'BASE',
    photoUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png',
    stats: { ppg: 26.4, rpg: 4.5, apg: 5.1, spg: 0.7, bpg: 0.4, tpm: 4.8, pir: 25.1, gamesPlayed: 74, fgPct: 45.0 }
  },
  {
    id: 'anthony-edwards',
    name: 'Anthony Edwards',
    shortName: 'Edwards',
    team: 'Minnesota Timberwolves',
    teamCode: 'MIN',
    teamColor: '#236192',
    league: 'NBA',
    number: 5,
    position: 'ESCOLTA',
    photoUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630162.png',
    stats: { ppg: 25.9, rpg: 5.4, apg: 5.1, spg: 1.3, bpg: 0.5, tpm: 3.2, pir: 24.8, gamesPlayed: 79, fgPct: 46.1 }
  },
  {
    id: 'jayson-tatum',
    name: 'Jayson Tatum',
    shortName: 'Tatum',
    team: 'Boston Celtics',
    teamCode: 'BOS',
    teamColor: '#007A33',
    league: 'NBA',
    number: 0,
    position: 'ALERO',
    photoUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628369.png',
    stats: { ppg: 26.9, rpg: 8.1, apg: 4.9, spg: 1.0, bpg: 0.6, tpm: 3.1, pir: 27.5, gamesPlayed: 74, fgPct: 47.1 }
  },
  // EUROLEAGUE STARS
  {
    id: 'sasha-vezenkov',
    name: 'Sasha Vezenkov',
    shortName: 'Vezenkov',
    team: 'Olympiacos Piraeus',
    teamCode: 'OLY',
    teamColor: '#E2001A',
    league: 'EUROLEAGUE',
    number: 14,
    position: 'ALA-PÍVOT',
    photoUrl: 'https://media-cdn.incrowdsports.com/26487a28-ee18-4903-85e6-9937d2f97eb7.png',
    stats: { ppg: 19.8, rpg: 7.4, apg: 2.1, spg: 1.1, bpg: 0.4, tpm: 2.5, pir: 24.3, gamesPlayed: 28, fgPct: 54.8 }
  },
  {
    id: 'kendrick-nunn',
    name: 'Kendrick Nunn',
    shortName: 'Nunn',
    team: 'Panathinaikos AKTOR',
    teamCode: 'PAO',
    teamColor: '#007A33',
    league: 'EUROLEAGUE',
    number: 25,
    position: 'ESCOLTA',
    photoUrl: 'https://media-cdn.incrowdsports.com/001f3ba0-74e6-42bb-9271-9ecba6b8a8b8.png',
    stats: { ppg: 18.9, rpg: 3.5, apg: 4.2, spg: 1.0, bpg: 0.2, tpm: 2.8, pir: 18.5, gamesPlayed: 32, fgPct: 49.2 }
  },
  {
    id: 'mike-james',
    name: 'Mike James',
    shortName: 'James',
    team: 'AS Monaco Basket',
    teamCode: 'ASM',
    teamColor: '#C8102E',
    league: 'EUROLEAGUE',
    number: 55,
    position: 'BASE',
    photoUrl: 'https://media-cdn.incrowdsports.com/812a0239-ce6f-40e1-bbbb-f24cf741e976.png',
    stats: { ppg: 18.2, rpg: 4.1, apg: 5.7, spg: 1.2, bpg: 0.1, tpm: 2.4, pir: 20.1, gamesPlayed: 34, fgPct: 44.8 }
  },
  {
    id: 'facundo-campazzo',
    name: 'Facundo Campazzo',
    shortName: 'Campazzo',
    team: 'Real Madrid',
    teamCode: 'RMB',
    teamColor: '#6B2C91',
    league: 'EUROLEAGUE',
    number: 7,
    position: 'BASE',
    photoUrl: 'https://media-cdn.incrowdsports.com/5ca4b2ec-e71c-4b5d-91b4-21aa5c555c88.png',
    stats: { ppg: 12.8, rpg: 3.0, apg: 6.8, spg: 1.5, bpg: 0.1, tpm: 1.8, pir: 17.6, gamesPlayed: 33, fgPct: 46.5 }
  },
  {
    id: 'kevin-punter',
    name: 'Kevin Punter',
    shortName: 'Punter',
    team: 'FC Barcelona',
    teamCode: 'FCB',
    teamColor: '#004D98',
    league: 'EUROLEAGUE',
    number: 0,
    position: 'ESCOLTA',
    photoUrl: 'https://media-cdn.incrowdsports.com/5e20dca5-5ba2-4752-9ba6-35bfa37ce1a5.png',
    stats: { ppg: 16.5, rpg: 2.8, apg: 3.1, spg: 1.3, bpg: 0.2, tpm: 2.3, pir: 16.8, gamesPlayed: 31, fgPct: 47.9 }
  },
  {
    id: 'walter-tavares',
    name: 'Walter "Edy" Tavares',
    shortName: 'Tavares',
    team: 'Real Madrid',
    teamCode: 'RMB',
    teamColor: '#6B2C91',
    league: 'EUROLEAGUE',
    number: 22,
    position: 'PÍVOT',
    photoUrl: 'https://media-cdn.incrowdsports.com/f04be66a-12f0-410a-ba38-16e7887714fe.png',
    stats: { ppg: 10.2, rpg: 8.6, apg: 1.6, spg: 0.8, bpg: 2.1, tpm: 0.0, pir: 18.9, gamesPlayed: 34, fgPct: 65.4 }
  },
  // ACB (LIGA ENDESA) STARS
  {
    id: 'marcus-howard',
    name: 'Markus Howard',
    shortName: 'Howard',
    team: 'Baskonia',
    teamCode: 'BKN',
    teamColor: '#0A2540',
    league: 'ACB',
    number: 0,
    position: 'BASE',
    photoUrl: 'https://static.acb.com/img/jugadores/62b48b52eb8c8.png',
    stats: { ppg: 19.4, rpg: 1.6, apg: 1.8, spg: 0.8, bpg: 0.1, tpm: 3.9, pir: 15.2, gamesPlayed: 30, fgPct: 44.0 }
  },
  {
    id: 'jean-montero',
    name: 'Jean Montero',
    shortName: 'Montero',
    team: 'Valencia Basket',
    teamCode: 'VBC',
    teamColor: '#EE7402',
    league: 'ACB',
    number: 3,
    position: 'BASE',
    photoUrl: 'https://static.acb.com/img/jugadores/634424687bbda.png',
    stats: { ppg: 15.7, rpg: 3.4, apg: 5.1, spg: 1.8, bpg: 0.2, tpm: 2.1, pir: 19.4, gamesPlayed: 29, fgPct: 45.2 }
  },
  {
    id: 'marcelinho-huertas',
    name: 'Marcelinho Huertas',
    shortName: 'Huertas',
    team: 'La Laguna Tenerife',
    teamCode: 'LNT',
    teamColor: '#F5B324',
    league: 'ACB',
    number: 9,
    position: 'BASE',
    photoUrl: 'https://static.acb.com/img/jugadores/613f1b402ad77.png',
    stats: { ppg: 14.1, rpg: 2.5, apg: 6.9, spg: 0.7, bpg: 0.0, tpm: 1.4, pir: 16.5, gamesPlayed: 32, fgPct: 48.6 }
  },
  {
    id: 'chima-moneke',
    name: 'Chima Moneke',
    shortName: 'Moneke',
    team: 'Baskonia',
    teamCode: 'BKN',
    teamColor: '#0A2540',
    league: 'ACB',
    number: 95,
    position: 'ALA-PÍVOT',
    photoUrl: 'https://static.acb.com/img/jugadores/65046e7f722a5.png',
    stats: { ppg: 14.8, rpg: 7.2, apg: 1.9, spg: 1.1, bpg: 0.5, tpm: 1.1, pir: 18.7, gamesPlayed: 31, fgPct: 53.2 }
  },
  {
    id: 'willy-hernangomez',
    name: 'Willy Hernangómez',
    shortName: 'Hernangómez',
    team: 'FC Barcelona',
    teamCode: 'FCB',
    teamColor: '#004D98',
    league: 'ACB',
    number: 14,
    position: 'PÍVOT',
    photoUrl: 'https://static.acb.com/img/jugadores/64e8674d89613.png',
    stats: { ppg: 13.5, rpg: 7.8, apg: 1.1, spg: 0.6, bpg: 0.8, tpm: 0.2, pir: 17.8, gamesPlayed: 33, fgPct: 62.0 }
  }
];

export const DEFAULT_BRAND_KIT: {
  brandName: string;
  handle: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentGlow: string;
  bgStyle: 'arena' | 'carbon' | 'slate' | 'custom';
  customBgUrl: string;
  seasonTag: string;
  showWatermark: boolean;
  watermarkPosition: 'top-right' | 'bottom-center' | 'top-left';
  cardStyle: 'broadcast' | 'cyber' | 'minimal' | 'grunge';
} = {
  brandName: 'HOOP METRICS',
  handle: '@hoopmetrics.es',
  logoUrl: '/src/assets/images/brand_badge_basketball_1790785631949.jpg',
  primaryColor: '#f59e0b', // Basketball amber gold
  secondaryColor: '#ef4444', // Fiery scarlet
  accentGlow: '#f59e0b',
  bgStyle: 'arena',
  customBgUrl: '/src/assets/images/basketball_arena_dark_1790785613720.jpg',
  seasonTag: 'TEMPORADA 2025-26',
  showWatermark: true,
  watermarkPosition: 'top-right',
  cardStyle: 'broadcast'
};
