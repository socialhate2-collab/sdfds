import React, { useState, useEffect } from 'react';
import { Player, StatCategory, BrandKit, League, SupabaseConfig, DesignTemplate } from './types';
import { STAT_CATEGORIES, DEFAULT_BRAND_KIT } from './data/defaultPlayers';
import {
  loadStoredTemplates,
  saveStoredTemplates,
  loadActiveTemplateId,
  saveActiveTemplateId,
  templateToBrandKit,
  hydrateTemplatesFromIDB
} from './data/templates';
import { safeLocalStorageSet, safeLocalStorageGet, setItemInIDB } from './services/safeStorage';
import {
  loadSupabaseConfig,
  saveSupabaseConfig,
  loadLocalPlayers,
  saveLocalPlayers,
  fetchPlayersFromSupabase
} from './services/supabaseService';
import { Header } from './components/Header';
import { VideoStudio } from './components/VideoStudio';
import { CarouselStudio } from './components/CarouselStudio';
import { SingleGraphicStudio } from './components/SingleGraphicStudio';
import { SupabasePanel } from './components/SupabasePanel';
import { BrandKitPanel } from './components/BrandKitPanel';
import { TemplateManager } from './components/TemplateManager';
import { downloadAllSlidesAsZip, renderLeaderboardGraphic, downloadCanvasAsImage } from './services/carouselRenderer';

const BRAND_STORAGE_KEY = 'slammetrics_brand_kit_v1';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'video' | 'carousel' | 'graphic' | 'database' | 'brand' | 'templates'>('video');

  // Design Systems & Templates
  const [templates, setTemplates] = useState<DesignTemplate[]>(() => loadStoredTemplates());
  const [activeTemplateId, setActiveTemplateId] = useState<string>(() => loadActiveTemplateId());

  // Core Data
  const [players, setPlayers] = useState<Player[]>(() => loadLocalPlayers());
  const [selectedCategory, setSelectedCategory] = useState<StatCategory>(STAT_CATEGORIES[0]);
  const [selectedLeague, setSelectedLeague] = useState<League>('ALL');

  // Brand Kit - synced with active template
  const [brandKit, setBrandKit] = useState<BrandKit>(() => {
    try {
      const storedTemplates = loadStoredTemplates();
      const currentActiveId = loadActiveTemplateId();
      const currentTemplate = storedTemplates.find(t => t.id === currentActiveId) || storedTemplates[0];
      if (currentTemplate) {
        return templateToBrandKit(currentTemplate);
      }
      const saved = safeLocalStorageGet(BRAND_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading brand kit', e);
    }
    return DEFAULT_BRAND_KIT;
  });

  // Safe Brand Kit persistence helper (prevents QuotaExceededError)
  const safePersistBrandKit = (kit: BrandKit) => {
    setItemInIDB(BRAND_STORAGE_KEY, kit).catch(() => {});
    try {
      const json = JSON.stringify(kit);
      const success = safeLocalStorageSet(BRAND_STORAGE_KEY, json);
      if (!success) {
        // Strip heavy base64 for localStorage fallback
        const lean = {
          ...kit,
          logoUrl: kit.logoUrl?.startsWith('data:') && kit.logoUrl.length > 80000 ? '' : kit.logoUrl,
          customBgUrl: kit.customBgUrl?.startsWith('data:') && kit.customBgUrl.length > 80000 ? '' : kit.customBgUrl
        };
        safeLocalStorageSet(BRAND_STORAGE_KEY, JSON.stringify(lean));
      }
    } catch {}
  };

  // Supabase Config
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => loadSupabaseConfig());

  // Quick export state
  const [isQuickExporting, setIsQuickExporting] = useState<boolean>(false);
  const [quickExportModal, setQuickExportModal] = useState<boolean>(false);

  // Hydrate rich templates from IndexedDB if available (loads high-res assets)
  useEffect(() => {
    hydrateTemplatesFromIDB().then(idbTemplates => {
      if (idbTemplates && idbTemplates.length > 0) {
        setTemplates(idbTemplates);
        const curActive = idbTemplates.find(t => t.id === activeTemplateId) || idbTemplates[0];
        if (curActive) {
          setBrandKit(templateToBrandKit(curActive));
        }
      }
    });
  }, []);

  // Template Handlers
  const handleSelectTemplate = (id: string) => {
    setActiveTemplateId(id);
    saveActiveTemplateId(id);
    setTemplates(currentTemplates => {
      const selected = currentTemplates.find(t => t.id === id);
      if (selected) {
        const derived = templateToBrandKit(selected);
        setBrandKit(derived);
        safePersistBrandKit(derived);
      }
      return currentTemplates;
    });
  };

  const handleSaveTemplate = (updated: DesignTemplate, activate = true) => {
    setTemplates(prev => {
      const exists = prev.some(t => t.id === updated.id);
      const nextTemplates = exists
        ? prev.map(t => t.id === updated.id ? updated : t)
        : [updated, ...prev];
      saveStoredTemplates(nextTemplates);
      return nextTemplates;
    });

    if (activate || updated.id === activeTemplateId) {
      setActiveTemplateId(updated.id);
      saveActiveTemplateId(updated.id);
      const derived = templateToBrandKit(updated);
      setBrandKit(derived);
      safePersistBrandKit(derived);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    const nextTemplates = templates.filter(t => t.id !== id);
    setTemplates(nextTemplates);
    saveStoredTemplates(nextTemplates);
    if (activeTemplateId === id) {
      handleSelectTemplate(nextTemplates[0]?.id || 'basketdata-rankings');
    }
  };

  // Save brand kit on manual change
  const handleUpdateBrandKit = (updated: BrandKit) => {
    setBrandKit(updated);
    safePersistBrandKit(updated);
  };

  // Save players on change
  const handleUpdatePlayers = (updated: Player[]) => {
    setPlayers(updated);
    saveLocalPlayers(updated);
  };

  // Save supabase config on change
  const handleUpdateSupabaseConfig = (updated: SupabaseConfig) => {
    setSupabaseConfig(updated);
    saveSupabaseConfig(updated);
  };

  // Try background sync with Supabase if previously connected
  useEffect(() => {
    if (supabaseConfig.isConnected && supabaseConfig.url && supabaseConfig.anonKey) {
      fetchPlayersFromSupabase(supabaseConfig).then(res => {
        if (res.success && res.players && res.players.length > 0) {
          setPlayers(res.players);
          saveLocalPlayers(res.players);
        }
      });
    }
  }, []);

  // Quick Export Handler
  const handleQuickExport = () => {
    setQuickExportModal(true);
  };

  const handleQuickDownloadGraphic = () => {
    const canvas = document.createElement('canvas');
    let list = [...players];
    if (selectedLeague !== 'ALL') {
      list = list.filter(p => p.league === selectedLeague);
    }
    list.sort((a, b) => (b.stats[selectedCategory.id] || 0) - (a.stats[selectedCategory.id] || 0));

    renderLeaderboardGraphic(canvas, list, selectedCategory, brandKit, '9:16', 10);
    downloadCanvasAsImage(canvas, `SlamMetrics_TOP10_${selectedCategory.shortLabel}_${selectedLeague}.png`);
    setQuickExportModal(false);
  };

  const handleQuickDownloadCarouselZip = async () => {
    setIsQuickExporting(true);
    let list = [...players];
    if (selectedLeague !== 'ALL') {
      list = list.filter(p => p.league === selectedLeague);
    }
    list.sort((a, b) => (b.stats[selectedCategory.id] || 0) - (a.stats[selectedCategory.id] || 0));

    const zipName = `SlamMetrics_Carrusel_TOP10_${selectedCategory.shortLabel}_4x5.zip`;
    await downloadAllSlidesAsZip(12, list.slice(0, 10), selectedCategory, brandKit, '4:5', zipName);
    setIsQuickExporting(false);
    setQuickExportModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Universal Header conforming to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onQuickExport={handleQuickExport}
        isExporting={isQuickExporting}
        templates={templates}
        activeTemplateId={activeTemplateId}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 pb-16">
        {activeTab === 'video' && (
          <VideoStudio
            players={players}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            brandKit={brandKit}
            selectedLeague={selectedLeague}
            onSelectLeague={setSelectedLeague}
            onOpenBrandKit={() => setActiveTab('templates')}
            templates={templates}
            activeTemplateId={activeTemplateId}
            onSelectTemplate={handleSelectTemplate}
          />
        )}

        {activeTab === 'carousel' && (
          <CarouselStudio
            players={players}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            brandKit={brandKit}
            selectedLeague={selectedLeague}
            onSelectLeague={setSelectedLeague}
            onOpenBrandKit={() => setActiveTab('templates')}
          />
        )}

        {activeTab === 'graphic' && (
          <SingleGraphicStudio
            players={players}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            brandKit={brandKit}
            selectedLeague={selectedLeague}
            onSelectLeague={setSelectedLeague}
            onOpenBrandKit={() => setActiveTab('templates')}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateManager
            templates={templates}
            activeTemplateId={activeTemplateId}
            onSelectTemplate={handleSelectTemplate}
            onSaveTemplate={handleSaveTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onGoToVideo={() => setActiveTab('video')}
          />
        )}

        {activeTab === 'database' && (
          <SupabasePanel
            config={supabaseConfig}
            onChangeConfig={handleUpdateSupabaseConfig}
            players={players}
            onUpdatePlayers={handleUpdatePlayers}
          />
        )}

        {activeTab === 'brand' && (
          <BrandKitPanel
            brandKit={brandKit}
            onChangeBrandKit={handleUpdateBrandKit}
          />
        )}
      </main>

      {/* QUICK EXPORT MODAL */}
      {quickExportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Descargar Contenido Listo para Publicar
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Exporta al instante las estadísticas de {selectedCategory.label} ({selectedLeague === 'ALL' ? 'Todas las ligas' : selectedLeague})
              con tu identidad de marca aplicada:
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setQuickExportModal(false);
                  setActiveTab('video');
                }}
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl transition-all text-left cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 block">1. Video Vertical 9:16 (TikTok / Reels / Shorts)</span>
                  <span className="text-[11px] text-slate-500">Con animaciones, contador dinámico y pista de audio</span>
                </div>
                <span className="text-xs font-bold text-blue-600">Ir al Estudio</span>
              </button>

              <button
                onClick={handleQuickDownloadCarouselZip}
                disabled={isQuickExporting}
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl transition-all text-left cursor-pointer disabled:opacity-50"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 block">2. Carrusel Completo de Instagram (.ZIP)</span>
                  <span className="text-[11px] text-slate-500">12 diapositivas: Portada + 10 Jugadores + Resumen</span>
                </div>
                <span className="text-xs font-bold text-blue-600">
                  {isQuickExporting ? 'Empaquetando...' : 'Descargar ZIP'}
                </span>
              </button>

              <button
                onClick={handleQuickDownloadGraphic}
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl transition-all text-left cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 block">3. Lámina Top 10 Oficial (PNG 9:16)</span>
                  <span className="text-[11px] text-slate-500">Todos los clasificados en una sola imagen de alta resolución</span>
                </div>
                <span className="text-xs font-bold text-blue-600">Descargar PNG</span>
              </button>
            </div>

            <div className="flex justify-end mt-5 pt-3 border-t border-slate-200">
              <button
                onClick={() => setQuickExportModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
