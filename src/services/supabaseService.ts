import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Player, SupabaseConfig } from '../types';
import { INITIAL_PLAYERS } from '../data/defaultPlayers';

const CONFIG_STORAGE_KEY = 'slammetrics_supabase_config';
const PLAYERS_STORAGE_KEY = 'slammetrics_custom_players';

export function loadSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading supabase config', e);
  }
  return {
    url: '',
    anonKey: '',
    tableName: 'players',
    isConnected: false,
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving supabase config', e);
  }
}

export function loadLocalPlayers(): Player[] {
  try {
    const raw = localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading local players', e);
  }
  return INITIAL_PLAYERS;
}

export function saveLocalPlayers(players: Player[]): void {
  try {
    localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
  } catch (e) {
    console.error('Error saving local players', e);
  }
}

export function getSupabaseClient(config: SupabaseConfig): SupabaseClient | null {
  if (!config.url || !config.anonKey) return null;
  try {
    return createClient(config.url.trim(), config.anonKey.trim());
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(config: SupabaseConfig): Promise<{ success: boolean; message: string; count?: number }> {
  if (!config.url || !config.anonKey) {
    return { success: false, message: 'URL o Clave Anónima vacía.' };
  }

  try {
    const client = createClient(config.url.trim(), config.anonKey.trim());
    const tableName = config.tableName.trim() || 'players';
    const { data, error, count } = await client
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      return { success: false, message: `Error de Supabase: ${error.message}` };
    }

    return {
      success: true,
      message: `¡Conexión exitosa con la tabla "${tableName}"! Encontrados ${count ?? data?.length ?? 0} registros.`,
      count: count ?? data?.length ?? 0
    };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Fallo de red o URL inválida: ${errMessage}` };
  }
}

export async function fetchPlayersFromSupabase(config: SupabaseConfig): Promise<{ success: boolean; players?: Player[]; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) {
    return { success: false, error: 'Configuración de Supabase incompleta.' };
  }

  try {
    const tableName = config.tableName.trim() || 'players';
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .order('ppg', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, players: [] };
    }

    // Map database record to Player interface
    const mapped: Player[] = data.map((row: Record<string, unknown>, idx: number) => {
      const statsObj = typeof row.stats === 'object' && row.stats !== null ? (row.stats as Record<string, unknown>) : {};

      return {
        id: String(row.id || `sp-${idx}-${Date.now()}`),
        name: String(row.name || row.player_name || 'Jugador'),
        shortName: row.short_name ? String(row.short_name) : undefined,
        team: String(row.team || row.team_name || 'Equipo'),
        teamCode: String(row.team_code || row.team?.toString().substring(0, 3).toUpperCase() || 'EQP'),
        teamColor: String(row.team_color || '#f59e0b'),
        league: normalizeLeague(String(row.league || 'NBA')),
        number: Number(row.number || row.jersey_number || 0),
        position: normalizePosition(String(row.position || 'BASE')),
        photoUrl: String(row.photo_url || row.image_url || row.photo || ''),
        teamLogoUrl: row.team_logo_url ? String(row.team_logo_url) : undefined,
        stats: {
          ppg: Number(row.ppg ?? statsObj.ppg ?? 0),
          rpg: Number(row.rpg ?? statsObj.rpg ?? 0),
          apg: Number(row.apg ?? statsObj.apg ?? 0),
          spg: Number(row.spg ?? statsObj.spg ?? 0),
          bpg: Number(row.bpg ?? statsObj.bpg ?? 0),
          tpm: Number(row.tpm ?? row.three_pm ?? statsObj.tpm ?? 0),
          pir: Number(row.pir ?? row.efficiency ?? statsObj.pir ?? 0),
          gamesPlayed: Number(row.games_played ?? statsObj.gamesPlayed ?? 30),
          fgPct: Number(row.fg_pct ?? statsObj.fgPct ?? 50.0),
        }
      };
    });

    return { success: true, players: mapped };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido al consultar Supabase' };
  }
}

function normalizeLeague(str: string): 'NBA' | 'EUROLEAGUE' | 'ACB' {
  const upper = str.toUpperCase();
  if (upper.includes('EURO') || upper.includes('EUROLIGA')) return 'EUROLEAGUE';
  if (upper.includes('ACB') || upper.includes('ENDESA')) return 'ACB';
  return 'NBA';
}

function normalizePosition(str: string): 'BASE' | 'ESCOLTA' | 'ALERO' | 'ALA-PÍVOT' | 'PÍVOT' {
  const upper = str.toUpperCase();
  if (upper.includes('POINT') || upper.includes('BASE') || upper === 'PG') return 'BASE';
  if (upper.includes('SHOOTING') || upper.includes('ESCOLTA') || upper === 'SG') return 'ESCOLTA';
  if (upper.includes('SMALL') || upper.includes('ALERO') || upper === 'SF') return 'ALERO';
  if (upper.includes('POWER') || upper.includes('ALA') || upper === 'PF') return 'ALA-PÍVOT';
  return 'PÍVOT';
}

export function generateSupabaseSQLSchema(): string {
  return `-- ==========================================
-- SCRIPT DE INICIALIZACIÓN PARA SUPABASE
-- Ejecuta este código en el SQL Editor de tu proyecto Supabase:
-- ==========================================

CREATE TABLE IF NOT EXISTS public.players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  team TEXT NOT NULL,
  team_code TEXT DEFAULT 'TM',
  team_color TEXT DEFAULT '#f59e0b',
  league TEXT NOT NULL DEFAULT 'NBA', -- 'NBA', 'EUROLEAGUE', o 'ACB'
  number INT DEFAULT 0,
  position TEXT DEFAULT 'BASE',
  photo_url TEXT,
  team_logo_url TEXT,
  ppg NUMERIC(5,2) DEFAULT 0,
  rpg NUMERIC(5,2) DEFAULT 0,
  apg NUMERIC(5,2) DEFAULT 0,
  spg NUMERIC(5,2) DEFAULT 0,
  bpg NUMERIC(5,2) DEFAULT 0,
  tpm NUMERIC(5,2) DEFAULT 0,
  pir NUMERIC(5,2) DEFAULT 0,
  games_played INT DEFAULT 30,
  fg_pct NUMERIC(5,2) DEFAULT 50.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar lectura pública (Row Level Security deshabilitado o con política select)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de jugadores" 
ON public.players FOR SELECT 
TO anon 
USING (true);

-- Datos de ejemplo iniciales
INSERT INTO public.players (id, name, short_name, team, team_code, team_color, league, number, position, photo_url, ppg, rpg, apg, spg, bpg, tpm, pir)
VALUES 
  ('luka-doncic', 'Luka Dončić', 'Dončić', 'Dallas Mavericks', 'DAL', '#00538C', 'NBA', 77, 'BASE', 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629029.png', 33.9, 9.2, 9.8, 1.4, 0.5, 4.1, 35.8),
  ('giannis-antetokounmpo', 'Giannis Antetokounmpo', 'Giannis', 'Milwaukee Bucks', 'MIL', '#00471B', 'NBA', 34, 'ALA-PÍVOT', 'https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png', 30.4, 11.5, 6.5, 1.2, 1.1, 0.5, 34.2),
  ('sasha-vezenkov', 'Sasha Vezenkov', 'Vezenkov', 'Olympiacos', 'OLY', '#E2001A', 'EUROLEAGUE', 14, 'ALA-PÍVOT', 'https://media-cdn.incrowdsports.com/26487a28-ee18-4903-85e6-9937d2f97eb7.png', 19.8, 7.4, 2.1, 1.1, 0.4, 2.5, 24.3),
  ('kendrick-nunn', 'Kendrick Nunn', 'Nunn', 'Panathinaikos', 'PAO', '#007A33', 'EUROLEAGUE', 25, 'ESCOLTA', 'https://media-cdn.incrowdsports.com/001f3ba0-74e6-42bb-9271-9ecba6b8a8b8.png', 18.9, 3.5, 4.2, 1.0, 0.2, 2.8, 18.5),
  ('marcus-howard', 'Markus Howard', 'Howard', 'Baskonia', 'BKN', '#0A2540', 'ACB', 0, 'BASE', 'https://static.acb.com/img/jugadores/62b48b52eb8c8.png', 19.4, 1.6, 1.8, 0.8, 0.1, 3.9, 15.2)
ON CONFLICT (id) DO NOTHING;
`;
}
