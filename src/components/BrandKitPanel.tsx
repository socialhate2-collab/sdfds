import React, { useRef } from 'react';
import { Palette, Upload, Check, Sparkles, Image as ImageIcon, Shield } from 'lucide-react';
import { BrandKit } from '../types';
import { optimizeBrandLogo, optimizeBackgroundCourt } from '../utils/imageOptimizer';

interface BrandKitPanelProps {
  brandKit: BrandKit;
  onChangeBrandKit: (updated: BrandKit) => void;
}

const COLOR_PRESETS = [
  { name: 'Oro Baloncesto & Carmesí', primary: '#f59e0b', secondary: '#ef4444' },
  { name: 'Azul Eléctrico & Blanco', primary: '#0284c7', secondary: '#38bdf8' },
  { name: 'Verde Élite & Dorado', primary: '#10b981', secondary: '#f59e0b' },
  { name: 'Morado Real & Ámbar', primary: '#8b5cf6', secondary: '#f59e0b' },
  { name: 'Rojo Toros & Grafito', primary: '#dc2626', secondary: '#71717a' },
  { name: 'Neon Cyber Ciberespacio', primary: '#06b6d4', secondary: '#ec4899' },
];

export const BrandKitPanel: React.FC<BrandKitPanelProps> = ({
  brandKit,
  onChangeBrandKit
}) => {
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Logo Upload with automatic downscaling to protect storage quota
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await optimizeBrandLogo(file);
        onChangeBrandKit({
          ...brandKit,
          logoUrl: optimized
        });
      } catch (err) {
        console.error('Error optimizing logo:', err);
      }
    }
  };

  // Handle Custom Background Upload with automatic downscaling
  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await optimizeBackgroundCourt(file);
        onChangeBrandKit({
          ...brandKit,
          bgStyle: 'custom',
          customBgUrl: optimized
        });
      } catch (err) {
        console.error('Error optimizing background:', err);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 flex flex-col gap-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2.5">
          <Palette className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Identidad de Marca & Diseño Unificado
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Configura tus logos, tipografía, paleta de colores y fondos para que todos tus videos 9:16 y carruseles
          tengan la misma estética reconocible al instante en redes sociales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: Settings */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* General Brand Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              1. Nombres y Etiquetas de Redes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1.5">Nombre de la Marca / Canal</label>
                <input
                  type="text"
                  value={brandKit.brandName}
                  onChange={(e) => onChangeBrandKit({ ...brandKit, brandName: e.target.value })}
                  placeholder="SLAM METRICS"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1.5">Usuario / Handle (@redes)</label>
                <input
                  type="text"
                  value={brandKit.handle}
                  onChange={(e) => onChangeBrandKit({ ...brandKit, handle: e.target.value })}
                  placeholder="@slammetrics.es"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1.5">Etiqueta de Temporada / Competición</label>
              <input
                type="text"
                value={brandKit.seasonTag}
                onChange={(e) => onChangeBrandKit({ ...brandKit, seasonTag: e.target.value })}
                placeholder="TEMPORADA 2025-26"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Color System */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              2. Paleta de Colores
            </h3>

            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COLOR_PRESETS.map((p, idx) => {
                const isActive = brandKit.primaryColor === p.primary && brandKit.secondaryColor === p.secondary;
                return (
                  <button
                    key={idx}
                    onClick={() => onChangeBrandKit({ ...brandKit, primaryColor: p.primary, secondaryColor: p.secondary })}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-900 font-semibold shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex -space-x-1 shrink-0">
                      <span className="w-3.5 h-3.5 rounded-full border border-white shadow-xs" style={{ backgroundColor: p.primary }} />
                      <span className="w-3.5 h-3.5 rounded-full border border-white shadow-xs" style={{ backgroundColor: p.secondary }} />
                    </div>
                    <span className="text-[11px] truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Manual Color Pickers */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1.5">Color Primario (Destacados y Cifras)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandKit.primaryColor}
                    onChange={(e) => onChangeBrandKit({ ...brandKit, primaryColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-300 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandKit.primaryColor}
                    onChange={(e) => onChangeBrandKit({ ...brandKit, primaryColor: e.target.value })}
                    className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1.5">Color Secundario (Acentos)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandKit.secondaryColor}
                    onChange={(e) => onChangeBrandKit({ ...brandKit, secondaryColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-300 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandKit.secondaryColor}
                    onChange={(e) => onChangeBrandKit({ ...brandKit, secondaryColor: e.target.value })}
                    className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logo & Background Assets */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              3. Assets Visuales (Logo y Fondo)
            </h3>

            {/* Logo Upload */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                  {brandKit.logoUrl ? (
                    <img src={brandKit.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Logo Oficial de Marca</span>
                  <span className="text-[11px] text-slate-500">Se dibuja en la esquina superior de cada video y carrusel</span>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-white" />
                  <span>Subir Mi Logo</span>
                </button>
              </div>
            </div>

            {/* Background Style */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-slate-600 font-medium">Fondo Predeterminado</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => onChangeBrandKit({
                    ...brandKit,
                    bgStyle: 'arena',
                    customBgUrl: '/src/assets/images/basketball_arena_dark_1790785613720.jpg'
                  })}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    brandKit.bgStyle === 'arena'
                      ? 'border-blue-500 bg-blue-50 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-bold text-slate-900 block">Arena Pro</span>
                  <span className="text-slate-500 text-[11px]">Estadio y Foco</span>
                </button>

                <button
                  onClick={() => onChangeBrandKit({
                    ...brandKit,
                    bgStyle: 'carbon',
                    customBgUrl: ''
                  })}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    brandKit.bgStyle === 'carbon'
                      ? 'border-blue-500 bg-blue-50 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-bold text-slate-900 block">Carbon Mesh</span>
                  <span className="text-slate-500 text-[11px]">Trama Deportiva</span>
                </button>

                <button
                  onClick={() => onChangeBrandKit({
                    ...brandKit,
                    bgStyle: 'slate',
                    customBgUrl: ''
                  })}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    brandKit.bgStyle === 'slate'
                      ? 'border-blue-500 bg-blue-50 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-bold text-slate-900 block">Deep Slate</span>
                  <span className="text-slate-500 text-[11px]">Minimalista</span>
                </button>

                <div>
                  <input
                    type="file"
                    ref={bgInputRef}
                    accept="image/*"
                    onChange={handleBgUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => bgInputRef.current?.click()}
                    className={`w-full p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      brandKit.bgStyle === 'custom'
                        ? 'border-blue-500 bg-blue-50 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold text-blue-600 block flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Subir Fondo
                    </span>
                    <span className="text-slate-500 text-[11px]">Tu propia imagen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Identity Preview Card */}
        <div className="flex flex-col gap-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Vista Previa de Marca
          </span>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-5 sticky top-20 shadow-sm">
            {/* Mock Card */}
            <div className="aspect-[4/5] rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between relative overflow-hidden shadow-md">
              {/* Radial glow */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 40%, ${brandKit.primaryColor}, transparent 70%)`
                }}
              />

              {/* Card Header */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
                    <img src={brandKit.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-white tracking-wider">
                    {brandKit.brandName}
                  </span>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded border"
                  style={{
                    color: brandKit.primaryColor,
                    borderColor: `${brandKit.primaryColor}55`,
                    backgroundColor: `${brandKit.primaryColor}15`
                  }}
                >
                  {brandKit.seasonTag}
                </span>
              </div>

              {/* Card Center */}
              <div className="z-10 my-auto text-center py-4">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest block mb-1">
                  RANKING EXCLUSIVO
                </span>
                <h4 className="text-3xl font-black text-white font-sports">
                  TOP 10 ANOTADORES
                </h4>
                <div
                  className="w-12 h-1 mx-auto my-2 rounded-full"
                  style={{ backgroundColor: brandKit.primaryColor }}
                />
                <span
                  className="font-mono text-xl font-black"
                  style={{ color: brandKit.primaryColor }}
                >
                  33.9 PPP
                </span>
              </div>

              {/* Card Footer */}
              <div className="z-10 flex items-center justify-between text-[11px] pt-3 border-t border-slate-800">
                <span className="text-slate-400 font-mono">01/10</span>
                <span className="font-semibold text-slate-300">{brandKit.handle}</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 leading-relaxed">
              <p>
                ✓ Todo el contenido que descargues (videos y carruseles) adoptará de forma automática
                estos colores, logos y etiquetas sin que tengas que retocar nada después.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
