export type StatId = 'ppg' | 'rpg' | 'apg' | 'spg' | 'bpg' | 'tpm' | 'pir';

export interface StatCategory {
  id: StatId;
  label: string;
  shortLabel: string;
  unit: string;
  description: string;
}

export type League = 'ALL' | 'NBA' | 'EUROLEAGUE' | 'ACB';

export interface Player {
  id: string;
  name: string;
  shortName?: string;
  team: string;
  teamCode: string;
  teamColor: string;
  league: 'NBA' | 'EUROLEAGUE' | 'ACB';
  number: number;
  position: 'BASE' | 'ESCOLTA' | 'ALERO' | 'ALA-PÍVOT' | 'PÍVOT';
  photoUrl: string;
  teamLogoUrl?: string;
  stats: {
    ppg: number;
    rpg: number;
    apg: number;
    spg: number;
    bpg: number;
    tpm: number; // 3-pointers made per game
    pir: number; // Performance Index Rating / Eficiencia
    gamesPlayed: number;
    fgPct: number; // Field Goal %
  };
}

export interface BrandKit {
  brandName: string;
  handle: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentGlow: string;
  bgStyle: 'arena' | 'carbon' | 'slate' | 'custom';
  customBgUrl?: string;
  courtOverlayUrl?: string;
  seasonTag: string;
  showWatermark: boolean;
  watermarkPosition: 'top-right' | 'bottom-center' | 'top-left';
  cardStyle: 'broadcast' | 'cyber' | 'minimal' | 'grunge';
  template?: DesignTemplate;
}

export interface VideoSettings {
  rankingCount: 5 | 10;
  order: 'climax' | 'direct'; // climax: #10 to #1, direct: #1 to #10
  durationPerPlayer: number; // seconds (default 2s)
  introDuration: number; // seconds (default 1.5s)
  outroDuration: number; // seconds (default 1.5s)
  includeAudio: boolean;
  soundtrack: 'hype_beat' | 'subtle_groove' | 'electronic' | 'none';
  resolution: '1080x1920' | '720x1280';
  fps: 30 | 60;
}

export interface DesignTemplate {
  id: string; // e.g. 'slammetrics-broadcast' | 'basketdata-rankings'
  name: string;
  tagline: string;
  description: string;
  author: string;
  version: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentGlow: string;
    backgroundColor: string;
    cardBackground: string;
    cardBorderColor: string;
    textColor: string;
    textMutedColor: string;
    headlineFont: string; // 'Bebas Neue' | 'Plus Jakarta Sans' | 'JetBrains Mono'
    statFont: string;
    bodyFont: string;
    badgeStyle: 'broadcast-box' | 'cyber-shield' | 'minimal-pill' | 'geometric-cut';
    barStyle: 'gradient-fill' | 'segmented-neon' | 'glow-thin';
  };
  assets: {
    logoUrl: string;
    backgroundUrl: string;
    watermarkText: string;
    bannerTag: string;
    courtOverlayUrl?: string;
  };
  layout: {
    showCourtGrid: boolean;
    cardGlassBlur: boolean;
    cardPosition: 'bottom' | 'center-split';
    haloBehindPlayer: boolean;
    showPlayerNumber: boolean;
    showTeamBadge: boolean;
    showSecondaryStatsGrid: boolean;
  };
  instructions?: string;
  customManifestJson?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
  isConnected: boolean;
  lastSync?: string;
}
