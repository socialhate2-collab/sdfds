import { DesignTemplate } from '../types';
import { safeLocalStorageSet, safeLocalStorageGet, setItemInIDB, getItemFromIDB } from '../services/safeStorage';

export const SLAMMETRICS_TEMPLATE: DesignTemplate = {
  id: 'slammetrics-broadcast',
  name: 'SlamMetrics Broadcast',
  tagline: 'Estilo Televisión Clásica Deportiva',
  description: 'Diseño deportivo con acentos ámbar y rojo, halo cálido, tarjetas translúcidas y tipografía imponente.',
  author: 'SlamMetrics Studio',
  version: '1.0.0',
  theme: {
    primaryColor: '#f59e0b',
    secondaryColor: '#ef4444',
    accentGlow: '#f59e0b',
    backgroundColor: '#07090e',
    cardBackground: 'rgba(12, 16, 24, 0.90)',
    cardBorderColor: 'rgba(255, 255, 255, 0.12)',
    textColor: '#ffffff',
    textMutedColor: '#94a3b8',
    headlineFont: 'Bebas Neue',
    statFont: 'JetBrains Mono',
    bodyFont: 'Plus Jakarta Sans',
    badgeStyle: 'broadcast-box',
    barStyle: 'gradient-fill'
  },
  assets: {
    logoUrl: '/src/assets/images/brand_badge_basketball_1790785631949.jpg',
    backgroundUrl: '/src/assets/images/basketball_arena_dark_1790785613720.jpg',
    watermarkText: '@slammetrics.es',
    bannerTag: 'TEMPORADA 2025-26'
  },
  layout: {
    showCourtGrid: true,
    cardGlassBlur: true,
    cardPosition: 'bottom',
    haloBehindPlayer: true,
    showPlayerNumber: true,
    showTeamBadge: true,
    showSecondaryStatsGrid: true
  },
  instructions: `SISTEMA DE DISEÑO SLAMMETRICS BROADCAST:
1. Atmósfera: Calidez televisiva deportiva con iluminación focalizada y halo ámbar (#f59e0b).
2. Badge de ranking: Placa rectangular metálica dorada y redondeada con sombra pronunciada.
3. Indicadores: Barras con degradado fluido hacia escarlata (#ef4444).
4. Fondo: Estadio arena nocturno con focos y graderío desenfocado.`
};

export const BASKETDATA_TEMPLATE: DesignTemplate = {
  id: 'basketdata-rankings',
  name: 'BasketData Rankings',
  tagline: 'Data-Dense Cyber Analytics',
  description: 'Estructura analítica de alta tecnología: contrastes cian neón y ámbar, marcas tácticas de cancha, barras segmentadas y tarjetas de rendimiento.',
  author: 'BasketData Lab',
  version: '2.0.0',
  theme: {
    primaryColor: '#06b6d4', // Cyber Electric Cyan
    secondaryColor: '#f59e0b', // Cyber Gold
    accentGlow: '#0891b2',
    backgroundColor: '#05070c',
    cardBackground: 'rgba(7, 12, 22, 0.94)',
    cardBorderColor: 'rgba(6, 182, 212, 0.35)',
    textColor: '#f8fafc',
    textMutedColor: '#64748b',
    headlineFont: 'Bebas Neue',
    statFont: 'JetBrains Mono',
    bodyFont: 'Plus Jakarta Sans',
    badgeStyle: 'cyber-shield',
    barStyle: 'segmented-neon'
  },
  assets: {
    logoUrl: '/src/assets/images/basketdata_brand_badge_1790786937440.jpg',
    backgroundUrl: '/src/assets/images/basketdata_arena_court_1790786951871.jpg',
    watermarkText: '@basketdata.rankings',
    bannerTag: 'BASKETDATA · ANALYTICS LAB'
  },
  layout: {
    showCourtGrid: true,
    cardGlassBlur: true,
    cardPosition: 'bottom',
    haloBehindPlayer: true,
    showPlayerNumber: true,
    showTeamBadge: true,
    showSecondaryStatsGrid: true
  },
  instructions: `SISTEMA DE DISEÑO BASKETDATA RANKINGS:
1. Jerarquía: El jugador clasificado debe destacar con el badge cian neón biselado (#06b6d4) de alta legibilidad técnica.
2. Tipografía: Cifras de estadísticas en JetBrains Mono monoespaciado para rigor analítico. Nombres en Bebas Neue imponente.
3. Barras de métricas: Usar segmentos neón discretos simulando un indicador HUD táctico.
4. Fondo: Cancha obsidian oscura con líneas de 3 puntos y aro en cian neón brillante.`
};

export const INITIAL_TEMPLATES: DesignTemplate[] = [
  BASKETDATA_TEMPLATE,
  SLAMMETRICS_TEMPLATE
];

const TEMPLATES_STORAGE_KEY = 'slammetrics_custom_templates_v2';
const ACTIVE_TEMPLATE_ID_KEY = 'slammetrics_active_template_id_v2';

export function loadStoredTemplates(): DesignTemplate[] {
  try {
    const raw = safeLocalStorageGet(TEMPLATES_STORAGE_KEY);
    if (raw) {
      const parsed: DesignTemplate[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasBasketData = parsed.some(t => t.id === 'basketdata-rankings');
        const hasSlam = parsed.some(t => t.id === 'slammetrics-broadcast');
        let combined = [...parsed];
        if (!hasBasketData) combined.unshift(BASKETDATA_TEMPLATE);
        if (!hasSlam) combined.push(SLAMMETRICS_TEMPLATE);
        return combined;
      }
    }
  } catch (e) {
    console.error('Error loading stored templates', e);
  }
  return INITIAL_TEMPLATES;
}

export async function hydrateTemplatesFromIDB(): Promise<DesignTemplate[] | null> {
  try {
    const fromIDB = await getItemFromIDB<DesignTemplate[]>(TEMPLATES_STORAGE_KEY);
    if (fromIDB && Array.isArray(fromIDB) && fromIDB.length > 0) {
      return fromIDB;
    }
  } catch (e) {
    console.warn('IDB hydration error', e);
  }
  return null;
}

export function saveStoredTemplates(templates: DesignTemplate[]): void {
  // 1. Save to IndexedDB (virtually unlimited quota for high-res assets)
  setItemInIDB(TEMPLATES_STORAGE_KEY, templates).catch(() => {});

  // 2. Safe save to LocalStorage with quota protection
  try {
    const json = JSON.stringify(templates);
    const success = safeLocalStorageSet(TEMPLATES_STORAGE_KEY, json);
    if (!success) {
      // If full, strip heavy data URLs for localStorage fallback
      const leanTemplates = templates.map(t => ({
        ...t,
        assets: {
          ...t.assets,
          // If data URL is huge (> 100KB), replace with placeholder in localStorage
          logoUrl: t.assets.logoUrl?.startsWith('data:') && t.assets.logoUrl.length > 100000 ? '' : t.assets.logoUrl,
          backgroundUrl: t.assets.backgroundUrl?.startsWith('data:') && t.assets.backgroundUrl.length > 100000 ? '' : t.assets.backgroundUrl
        }
      }));
      safeLocalStorageSet(TEMPLATES_STORAGE_KEY, JSON.stringify(leanTemplates));
    }
  } catch (e) {
    console.warn('LocalStorage save bypassed for large templates; safely stored in IndexedDB.', e);
  }
}

export function loadActiveTemplateId(): string {
  try {
    return safeLocalStorageGet(ACTIVE_TEMPLATE_ID_KEY) || 'basketdata-rankings';
  } catch {
    return 'basketdata-rankings';
  }
}

export function saveActiveTemplateId(id: string): void {
  try {
    safeLocalStorageSet(ACTIVE_TEMPLATE_ID_KEY, id);
  } catch (e) {
    console.error('Error saving active template id', e);
  }
}

export function exportTemplateManifest(template: DesignTemplate): string {
  const exportPayload = {
    $schema: 'https://slammetrics.app/schemas/design-manifest.v1.json',
    id: template.id,
    name: template.name,
    tagline: template.tagline,
    description: template.description,
    author: template.author || 'User',
    version: template.version || '1.0.0',
    theme: template.theme,
    assets: template.assets,
    layout: template.layout,
    instructions: template.instructions || '',
    exportedAt: new Date().toISOString()
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function parseManifestJson(jsonString: string): { success: boolean; template?: DesignTemplate; error?: string } {
  try {
    const obj = JSON.parse(jsonString);
    if (!obj.name || typeof obj.name !== 'string') {
      return { success: false, error: 'El manifest debe contener la propiedad "name" de tipo texto.' };
    }

    const template: DesignTemplate = {
      id: obj.id || `custom-template-${Date.now()}`,
      name: obj.name,
      tagline: obj.tagline || 'Plantilla Personalizada',
      description: obj.description || 'Importada mediante manifest JSON',
      author: obj.author || 'Diseñador',
      version: obj.version || '1.0.0',
      theme: {
        primaryColor: obj.theme?.primaryColor || '#06b6d4',
        secondaryColor: obj.theme?.secondaryColor || '#f59e0b',
        accentGlow: obj.theme?.accentGlow || '#0891b2',
        backgroundColor: obj.theme?.backgroundColor || '#05070c',
        cardBackground: obj.theme?.cardBackground || 'rgba(7, 12, 22, 0.94)',
        cardBorderColor: obj.theme?.cardBorderColor || 'rgba(6, 182, 212, 0.35)',
        textColor: obj.theme?.textColor || '#ffffff',
        textMutedColor: obj.theme?.textMutedColor || '#94a3b8',
        headlineFont: obj.theme?.headlineFont || 'Bebas Neue',
        statFont: obj.theme?.statFont || 'JetBrains Mono',
        bodyFont: obj.theme?.bodyFont || 'Plus Jakarta Sans',
        badgeStyle: obj.theme?.badgeStyle || 'cyber-shield',
        barStyle: obj.theme?.barStyle || 'segmented-neon'
      },
      assets: {
        logoUrl: obj.assets?.logoUrl || '/src/assets/images/basketdata_brand_badge_1790786937440.jpg',
        backgroundUrl: obj.assets?.backgroundUrl || '/src/assets/images/basketdata_arena_court_1790786951871.jpg',
        watermarkText: obj.assets?.watermarkText || '@basketdata.rankings',
        bannerTag: obj.assets?.bannerTag || 'BASKETDATA RANKINGS'
      },
      layout: {
        showCourtGrid: obj.layout?.showCourtGrid ?? true,
        cardGlassBlur: obj.layout?.cardGlassBlur ?? true,
        cardPosition: obj.layout?.cardPosition || 'bottom',
        haloBehindPlayer: obj.layout?.haloBehindPlayer ?? true,
        showPlayerNumber: obj.layout?.showPlayerNumber ?? true,
        showTeamBadge: obj.layout?.showTeamBadge ?? true,
        showSecondaryStatsGrid: obj.layout?.showSecondaryStatsGrid ?? true
      },
      instructions: obj.instructions || '',
      customManifestJson: jsonString
    };

    return { success: true, template };
  } catch (err) {
    return {
      success: false,
      error: `Error de sintaxis JSON: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

export function templateToBrandKit(template: DesignTemplate): import('../types').BrandKit {
  return {
    brandName: template.name,
    handle: template.assets.watermarkText,
    logoUrl: template.assets.logoUrl,
    primaryColor: template.theme.primaryColor,
    secondaryColor: template.theme.secondaryColor,
    accentGlow: template.theme.accentGlow,
    bgStyle: 'custom',
    customBgUrl: template.assets.backgroundUrl,
    courtOverlayUrl: template.assets.courtOverlayUrl,
    seasonTag: template.assets.bannerTag,
    showWatermark: true,
    watermarkPosition: 'top-right',
    cardStyle: template.theme.badgeStyle === 'cyber-shield' ? 'cyber' : 'broadcast',
    template: template
  };
}
