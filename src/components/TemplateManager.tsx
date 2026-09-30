import React, { useState, useRef } from 'react';
import {
  Layers,
  Upload,
  Download,
  Check,
  FileJson,
  Sparkles,
  Trash2,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  Palette,
  Film,
  RefreshCw
} from 'lucide-react';
import { DesignTemplate } from '../types';
import {
  exportTemplateManifest,
  parseManifestJson,
  BASKETDATA_TEMPLATE,
  SLAMMETRICS_TEMPLATE
} from '../data/templates';
import { optimizeBrandLogo, optimizeBackgroundCourt } from '../utils/imageOptimizer';

interface UploadedAssetItem {
  id: string;
  name: string;
  dataUrl: string;
  size: number;
  detectedType: 'logo' | 'background' | 'other';
}

interface TemplateManagerProps {
  templates: DesignTemplate[];
  activeTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  onSaveTemplate: (template: DesignTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onGoToVideo?: () => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  activeTemplateId,
  onSelectTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  onGoToVideo
}) => {
  const activeTemplate = templates.find(t => t.id === activeTemplateId) || templates[0] || BASKETDATA_TEMPLATE;

  // Active Template Quick-Editor State (synced with activeTemplate)
  const [activeName, setActiveName] = useState<string>(activeTemplate.name);
  const [activeTagline, setActiveTagline] = useState<string>(activeTemplate.tagline);
  const [activePrimaryColor, setActivePrimaryColor] = useState<string>(activeTemplate.theme.primaryColor);
  const [activeSecondaryColor, setActiveSecondaryColor] = useState<string>(activeTemplate.theme.secondaryColor);
  const [activeBannerTag, setActiveBannerTag] = useState<string>(activeTemplate.assets.bannerTag);
  const [activeWatermark, setActiveWatermark] = useState<string>(activeTemplate.assets.watermarkText);
  const [activeBadgeStyle, setActiveBadgeStyle] = useState<any>(activeTemplate.theme.badgeStyle);
  const [activeInstructions, setActiveInstructions] = useState<string>(activeTemplate.instructions || '');

  // Keep editor state in sync when active template changes
  React.useEffect(() => {
    setActiveName(activeTemplate.name);
    setActiveTagline(activeTemplate.tagline);
    setActivePrimaryColor(activeTemplate.theme.primaryColor);
    setActiveSecondaryColor(activeTemplate.theme.secondaryColor);
    setActiveBannerTag(activeTemplate.assets.bannerTag);
    setActiveWatermark(activeTemplate.assets.watermarkText);
    setActiveBadgeStyle(activeTemplate.theme.badgeStyle);
    setActiveInstructions(activeTemplate.instructions || '');
  }, [activeTemplate.id]);

  // New Creation / Import Form State
  const [designName, setDesignName] = useState<string>('Nuevo BasketData Pro');
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAssetItem[]>([]);
  const [manifestJsonText, setManifestJsonText] = useState<string>('');
  const [instructionsText, setInstructionsText] = useState<string>(
    'Diseño de analítica BasketData: usar el logo oficial en cabecera, fondo de cancha oscura con líneas cian neón, insignia biselada y números en monoespaciado.'
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // File Inputs
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);
  const multiAssetInputRef = useRef<HTMLInputElement | null>(null);
  const manifestFileInputRef = useRef<HTMLInputElement | null>(null);

  // Direct Upload for Active Template Logo
  const handleActiveLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const optimized = await optimizeBrandLogo(file);
      const updated: DesignTemplate = {
        ...activeTemplate,
        assets: {
          ...activeTemplate.assets,
          logoUrl: optimized
        }
      };
      onSaveTemplate(updated);
      setSuccessMessage(`¡Logo actualizado con éxito para "${updated.name}"!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  // Direct Upload for Active Template Background
  const handleActiveBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const optimized = await optimizeBackgroundCourt(file);
      const updated: DesignTemplate = {
        ...activeTemplate,
        assets: {
          ...activeTemplate.assets,
          backgroundUrl: optimized
        }
      };
      onSaveTemplate(updated);
      setSuccessMessage(`¡Fondo de cancha actualizado con éxito para "${updated.name}"!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  // Save changes to the active template
  const handleSaveActiveTemplateChanges = () => {
    const updated: DesignTemplate = {
      ...activeTemplate,
      name: activeName.trim() || activeTemplate.name,
      tagline: activeTagline.trim() || activeTemplate.tagline,
      theme: {
        ...activeTemplate.theme,
        primaryColor: activePrimaryColor,
        secondaryColor: activeSecondaryColor,
        accentGlow: activePrimaryColor,
        badgeStyle: activeBadgeStyle,
        barStyle: activeBadgeStyle === 'cyber-shield' ? 'segmented-neon' : 'gradient-fill'
      },
      assets: {
        ...activeTemplate.assets,
        bannerTag: activeBannerTag.trim() || activeTemplate.assets.bannerTag,
        watermarkText: activeWatermark.trim() || activeTemplate.assets.watermarkText
      },
      instructions: activeInstructions
    };

    onSaveTemplate(updated);
    setSuccessMessage(`¡Cambios guardados en "${updated.name}"! Ya están aplicados en el video.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Handle Multi-file Upload for Assets (Images)
  const handleMultiAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newItems: UploadedAssetItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const lowerName = file.name.toLowerCase();

      // Detect if it's likely a logo or background based on name
      const isLogo = lowerName.includes('logo') || lowerName.includes('badge') || lowerName.includes('emblem') || lowerName.includes('icon');
      const isBg = lowerName.includes('court') || lowerName.includes('cancha') || lowerName.includes('bg') || lowerName.includes('fondo') || lowerName.includes('arena');

      try {
        let optimized: string;
        if (isLogo) {
          optimized = await optimizeBrandLogo(file);
        } else {
          optimized = await optimizeBackgroundCourt(file);
        }

        newItems.push({
          id: `asset-${Date.now()}-${i}`,
          name: file.name,
          dataUrl: optimized,
          size: file.size,
          detectedType: isLogo ? 'logo' : isBg ? 'background' : 'other'
        });
      } catch (err) {
        console.error(`Error optimizando ${file.name}`, err);
      }
    }

    setUploadedAssets(prev => [...prev, ...newItems]);
    setIsProcessing(false);
    e.target.value = '';
  };

  // Handle Manifest .json file drop/upload
  const handleManifestFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setManifestJsonText(content);
        try {
          const parsed = JSON.parse(content);
          if (parsed.name) setDesignName(parsed.name);
          if (parsed.instructions) setInstructionsText(parsed.instructions);
        } catch {}
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadManifest = (tpl: DesignTemplate) => {
    const jsonStr = exportTemplateManifest(tpl);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifest_${tpl.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Function to build and activate the design based on Assets + Manifest + Instructions
  const handleBuildAndApplyDesign = () => {
    setIsProcessing(true);

    // 1. Try parsing Manifest JSON if provided
    let baseTemplate: DesignTemplate = {
      ...BASKETDATA_TEMPLATE,
      id: `custom-design-${Date.now()}`,
      name: designName.trim() || 'Nuevo Diseño BasketData',
      tagline: 'Diseño Personalizado',
      description: 'Generado a partir de tus assets e instrucciones',
      version: '1.0.0',
      instructions: instructionsText
    };

    if (manifestJsonText.trim()) {
      const res = parseManifestJson(manifestJsonText);
      if (res.success && res.template) {
        baseTemplate = {
          ...res.template,
          id: res.template.id || `custom-design-${Date.now()}`,
          name: designName.trim() || res.template.name,
          instructions: instructionsText || res.template.instructions || ''
        };
      }
    }

    // 2. Resolve which uploaded asset is the Logo and which is the Background
    let assignedLogo = baseTemplate.assets.logoUrl;
    let assignedBg = baseTemplate.assets.backgroundUrl;
    let assignedOverlay = baseTemplate.assets.courtOverlayUrl || '';

    const logoCandidate = uploadedAssets.find(a => a.detectedType === 'logo') || uploadedAssets[0];
    const bgCandidate = uploadedAssets.find(a => a.detectedType === 'background') || (uploadedAssets.length > 1 ? uploadedAssets[1] : null);

    if (logoCandidate) {
      assignedLogo = logoCandidate.dataUrl;
    }
    if (bgCandidate) {
      assignedBg = bgCandidate.dataUrl;
    }

    // 3. Assemble the final design template
    const finalTemplate: DesignTemplate = {
      ...baseTemplate,
      assets: {
        ...baseTemplate.assets,
        logoUrl: assignedLogo,
        backgroundUrl: assignedBg,
        courtOverlayUrl: assignedOverlay,
        watermarkText: `@${designName.toLowerCase().replace(/\s+/g, '')}`,
        bannerTag: designName.toUpperCase()
      },
      instructions: instructionsText
    };

    onSaveTemplate(finalTemplate);
    onSelectTemplate(finalTemplate.id);
    setIsProcessing(false);

    setSuccessMessage(`¡Diseño "${finalTemplate.name}" montado y activado con éxito! Puedes verlo ahora en el Video Studio.`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Quick switch between asset roles
  const handleToggleAssetRole = (assetId: string, newRole: 'logo' | 'background' | 'other') => {
    setUploadedAssets(prev =>
      prev.map(item => item.id === assetId ? { ...item, detectedType: newRole } : item)
    );
  };

  const handleRemoveUploadedAsset = (assetId: string) => {
    setUploadedAssets(prev => prev.filter(item => item.id !== assetId));
  };

  return (
    <div className="max-w-5xl mx-auto p-6 flex flex-col gap-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Sistema de Diseños & Plantillas (Design Engines)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Sube o reemplaza tus <strong>assets</strong> (logos oficiales, fondos de cancha, texturas), ajusta las{' '}
            <strong>reglas e instrucciones</strong> y el generador adaptará los videos 9:16 y carruseles al instante.
          </p>
        </div>

        {/* Shortcuts & Counters */}
        <div className="flex items-center gap-2">
          {onGoToVideo && (
            <button
              onClick={onGoToVideo}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Film className="w-4 h-4" />
              <span>Ver Video 9:16</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200">
            <span>{templates.length} Diseños</span>
          </div>
        </div>
      </div>

      {/* SUCCESS BANNER WITH DIRECT ACTION */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          {onGoToVideo && (
            <button
              onClick={onGoToVideo}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Film className="w-3.5 h-3.5" />
              <span>🎬 Abrir en Video Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ========================================================
          SECCIÓN 1: DISEÑO ACTIVO ACTUAL (ASSETS & REGLAS)
          ======================================================== */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Diseño Actualmente Activo en el Video
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              {activeTemplate.name}
            </h3>
            <span className="text-xs text-blue-600 font-semibold">{activeTemplate.tagline}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadManifest(activeTemplate)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200"
              title="Descargar Manifest JSON de este diseño"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Manifest JSON</span>
            </button>

            {onGoToVideo && (
              <button
                onClick={onGoToVideo}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-blue-200"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Probar en Video</span>
              </button>
            )}
          </div>
        </div>

        {/* CAMPOS DIRECTOS DE SUBIDA DE ASSETS (LOGO & FONDO) */}
        <div>
          <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block mb-3">
            1. Assets Principales de este Diseño (Subir & Reemplazar al instante)
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CARD ASSET 1: LOGO DE MARCA */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 shadow-xs relative">
                  {activeTemplate.assets.logoUrl ? (
                    <img src={activeTemplate.assets.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-blue-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 block truncate">
                      Logo Oficial / Insignia
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                      En Cabecera
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Se muestra en la cabecera superior segura para TikTok/Reels y en la pantalla de intro.
                  </p>
                </div>
              </div>

              {/* Botón de subida de Logo */}
              <div>
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  onChange={handleActiveLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-100 text-blue-700 border border-slate-300 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isProcessing ? 'Optimizando...' : 'Cambiar / Subir Nuevo Logo'}</span>
                </button>
              </div>
            </div>

            {/* CARD ASSET 2: FONDO DE CANCHA / ESTADIO */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 shadow-xs relative">
                  {activeTemplate.assets.backgroundUrl ? (
                    <img src={activeTemplate.assets.backgroundUrl} alt="Fondo" className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 block truncate">
                      Fondo de Cancha / Estadio
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                      Fondo 9:16
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ilumina el video vertical 9:16. Se mezcla cinematográficamente con las líneas tácticas.
                  </p>
                </div>
              </div>

              {/* Botón de subida de Fondo */}
              <div>
                <input
                  type="file"
                  ref={bgInputRef}
                  accept="image/*"
                  onChange={handleActiveBgUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => bgInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-100 text-blue-700 border border-slate-300 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isProcessing ? 'Optimizando...' : 'Cambiar / Subir Fondo de Cancha'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AJUSTES RÁPIDOS DE COLOR, TAG Y TIPOGRAFÍA */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-4">
          <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
            2. Identidad Visual & Textos de este Diseño
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Color Primario */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Color Primario (Acento / Neón)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activePrimaryColor}
                  onChange={(e) => setActivePrimaryColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-300 p-0.5 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={activePrimaryColor}
                  onChange={(e) => setActivePrimaryColor(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Color Secundario */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Color Secundario
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activeSecondaryColor}
                  onChange={(e) => setActiveSecondaryColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-300 p-0.5 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={activeSecondaryColor}
                  onChange={(e) => setActiveSecondaryColor(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Banner Tag / Temporada */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Etiqueta / Temporada
              </label>
              <input
                type="text"
                value={activeBannerTag}
                onChange={(e) => setActiveBannerTag(e.target.value)}
                placeholder="BASKETDATA · ANALYTICS LAB"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900"
              />
            </div>

            {/* Estilo de Tarjeta & Badge */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Estilo de Insignia & Tarjeta
              </label>
              <select
                value={activeBadgeStyle}
                onChange={(e) => setActiveBadgeStyle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 cursor-pointer"
              >
                <option value="cyber-shield">⚡ Cyber Shield (Biselado Neón)</option>
                <option value="broadcast-box">🏆 Broadcast Box (TV Clásica)</option>
                <option value="geometric-cut">📐 Geometric Cut (Táctico)</option>
              </select>
            </div>
          </div>

          {/* Instrucciones de Diseño */}
          <div className="pt-2">
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Instrucciones y Reglas de Diseño (Style Guide Prompt)
            </label>
            <textarea
              value={activeInstructions}
              onChange={(e) => setActiveInstructions(e.target.value)}
              rows={3}
              placeholder="Instrucciones para este diseño: jerarquía de contrastes, asignación de badges y estética general..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-sans focus:outline-none focus:border-blue-500 focus:bg-white leading-relaxed"
            />
          </div>

          {/* Botón Guardar Cambios en Activo */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleSaveActiveTemplateChanges}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Cambios en "{activeTemplate.name}"</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          SECCIÓN 2: CREADOR & ENSAMBLADOR DE NUEVOS DISEÑOS
          (Múltiples Assets + Manifest JSON + Instrucciones)
          ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-6">
        <div className="border-b border-slate-200 pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
            CREADOR DE NUEVAS PLANTILLAS
          </span>
          <h3 className="text-base font-extrabold text-slate-900">
            Montar Nuevo Diseño a partir de Assets, Manifest e Instrucciones
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Sube un lote de archivos, pega un JSON de especificación o introduce tus instrucciones para ensamblar un nuevo sistema de diseño independiente.
          </p>
        </div>

        {/* Nombre del Nuevo Diseño */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            1. Nombre del Nuevo Diseño
          </label>
          <input
            type="text"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            placeholder="Ej: Rankings BasketData Pro, Edición Especial..."
            className="w-full sm:w-96 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* SUBIDA POR LOTES DE ASSETS */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              2. Subir Archivos de Assets (Logos, Fondos, Insignias...)
            </label>
            <span className="text-[11px] text-slate-400">
              Puedes seleccionar varios archivos
            </span>
          </div>

          <input
            type="file"
            ref={multiAssetInputRef}
            multiple
            accept="image/*"
            onChange={handleMultiAssetUpload}
            className="hidden"
          />

          <div
            onClick={() => multiAssetInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-blue-800">
              {isProcessing ? 'Optimizando assets...' : 'Haz clic aquí para seleccionar tus imágenes de assets'}
            </span>
            <span className="text-[11px] text-slate-500">
              PNG, JPG o SVG. Se comprimen automáticamente para no saturar memoria.
            </span>
          </div>

          {/* Lista de Assets Subidos con Asignador de Rol */}
          {uploadedAssets.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {uploadedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 relative shadow-xs"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                    <img src={asset.dataUrl} alt={asset.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate block">
                      {asset.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-slate-500">Rol:</span>
                      <select
                        value={asset.detectedType}
                        onChange={(e) => handleToggleAssetRole(asset.id, e.target.value as any)}
                        className="text-[11px] font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5 text-blue-700 cursor-pointer focus:outline-none"
                      >
                        <option value="logo">🛡️ Logo / Marca</option>
                        <option value="background">🏟️ Fondo / Cancha</option>
                        <option value="other">🎨 Overlay</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveUploadedAsset(asset.id)}
                    className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    title="Quitar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MANIFEST EN FORMATO JSON */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <FileJson className="w-4 h-4 text-blue-600" />
              3. Manifest en Formato JSON (Opcional)
            </label>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={manifestFileInputRef}
                accept=".json,application/json"
                onChange={handleManifestFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => manifestFileInputRef.current?.click()}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                Subir archivo .json
              </button>
            </div>
          </div>

          <textarea
            value={manifestJsonText}
            onChange={(e) => setManifestJsonText(e.target.value)}
            placeholder="Pega aquí el manifest JSON si lo tienes (o sube el archivo con el botón de arriba)..."
            rows={3}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white resize-y leading-relaxed"
          />
        </div>

        {/* INSTRUCCIONES DE DISEÑO */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            4. Instrucciones de Diseño y Estructura
          </label>
          <textarea
            value={instructionsText}
            onChange={(e) => setInstructionsText(e.target.value)}
            placeholder="Ejemplo: 'Usa el logo oficial en la cabecera superior, cancha oscura con líneas en cian neón, tarjeta con cifras en fuente técnica...'"
            rows={3}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-sans focus:outline-none focus:border-blue-500 focus:bg-white leading-relaxed"
          />
        </div>

        {/* BOTÓN MONTAR NUEVO DISEÑO */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            {uploadedAssets.length > 0
              ? `✅ ${uploadedAssets.length} asset(s) seleccionados para el nuevo diseño.`
              : 'Puedes subir assets o se asignarán los predeterminados de BasketData.'}
          </span>

          <button
            onClick={handleBuildAndApplyDesign}
            disabled={isProcessing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>⚡ Montar y Activar Nuevo Diseño</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================
          SECCIÓN 3: CATÁLOGO DE DISEÑOS DISPONIBLES
          ======================================================== */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-extrabold text-slate-900">
            Diseños Configurados en el Proyecto
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Haz clic en cualquiera para activarlo inmediatamente en el video 9:16 y los carruseles:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => {
            const isActive = tpl.id === activeTemplateId;

            return (
              <div
                key={tpl.id}
                onClick={() => onSelectTemplate(tpl.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                      {tpl.assets.logoUrl ? (
                        <img src={tpl.assets.logoUrl} alt={tpl.name} className="w-full h-full object-cover" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-slate-900">{tpl.name}</h4>
                        {isActive && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Activo
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-blue-600 font-semibold">{tpl.tagline}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadManifest(tpl);
                      }}
                      title="Descargar manifest JSON"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {tpl.id !== 'basketdata-rankings' && tpl.id !== 'slammetrics-broadcast' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Eliminar "${tpl.name}"?`)) {
                            onDeleteTemplate(tpl.id);
                          }
                        }}
                        title="Eliminar plantilla"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                  {tpl.description}
                </p>

                {/* Assigned Assets Preview Bar */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                      style={{ backgroundColor: tpl.theme.primaryColor }}
                    />
                    <span>Color: <strong className="font-mono text-slate-800">{tpl.theme.primaryColor}</strong></span>
                  </div>

                  <span>
                    Estilo: <strong className="text-slate-800">{tpl.theme.badgeStyle === 'cyber-shield' ? 'Cyber HUD' : 'Broadcast'}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
