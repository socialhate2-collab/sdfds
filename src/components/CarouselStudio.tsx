import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download, Archive, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Player, StatCategory, BrandKit, League } from '../types';
import { STAT_CATEGORIES } from '../data/defaultPlayers';
import {
  GraphicFormat,
  renderCarouselSlide,
  downloadCanvasAsImage,
  downloadAllSlidesAsZip
} from '../services/carouselRenderer';

interface CarouselStudioProps {
  players: Player[];
  selectedCategory: StatCategory;
  onSelectCategory: (cat: StatCategory) => void;
  brandKit: BrandKit;
  selectedLeague: League;
  onSelectLeague: (league: League) => void;
  onOpenBrandKit?: () => void;
}

export const CarouselStudio: React.FC<CarouselStudioProps> = ({
  players,
  selectedCategory,
  onSelectCategory,
  brandKit,
  selectedLeague,
  onSelectLeague,
  onOpenBrandKit
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Carousel state
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [rankingCount, setRankingCount] = useState<5 | 10>(10);
  const [format, setFormat] = useState<GraphicFormat>('4:5');
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number>(0);

  // Filtered & sorted players
  const filteredPlayers = useMemo(() => {
    let list = [...players];
    if (selectedLeague !== 'ALL') {
      list = list.filter(p => p.league === selectedLeague);
    }
    list.sort((a, b) => (b.stats[selectedCategory.id] || 0) - (a.stats[selectedCategory.id] || 0));
    return list.slice(0, rankingCount);
  }, [players, selectedLeague, selectedCategory, rankingCount]);

  // Total slides = 1 (Cover) + rankingCount (Players) + 1 (Outro)
  const totalSlides = 1 + rankingCount + 1;

  // Render current slide to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderCarouselSlide(
      canvas,
      currentSlideIndex,
      totalSlides,
      filteredPlayers,
      selectedCategory,
      brandKit,
      format
    );
  }, [currentSlideIndex, totalSlides, filteredPlayers, selectedCategory, brandKit, format]);

  // Download single slide PNG
  const handleDownloadSingle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const name = currentSlideIndex === 0
      ? `Carrusel_Portada_${selectedCategory.shortLabel}.png`
      : currentSlideIndex === totalSlides - 1
        ? `Carrusel_Resumen_Final_${selectedCategory.shortLabel}.png`
        : `Carrusel_Slide_${currentSlideIndex}_Top_${currentSlideIndex}.png`;
    downloadCanvasAsImage(canvas, name);
  };

  // Download all slides ZIP
  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    setZipProgress(0);
    try {
      const zipName = `SlamMetrics_Carrusel_TOP${rankingCount}_${selectedCategory.shortLabel}_${format.replace(':', 'x')}.zip`;
      await downloadAllSlidesAsZip(
        totalSlides,
        filteredPlayers,
        selectedCategory,
        brandKit,
        format,
        zipName,
        (current, total) => {
          setZipProgress(Math.round((current / total) * 100));
        }
      );
    } catch (err) {
      console.error('Error generating zip:', err);
      alert('Error al empaquetar el carrusel en ZIP');
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto">
      {/* LEFT COLUMN: Controls & Navigation */}
      <div className="w-full lg:w-96 flex flex-col gap-5 shrink-0">
        {/* Active Design System Badge & Shortcut */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
              {brandKit.logoUrl ? (
                <img src={brandKit.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">⚡</span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diseño Activo</span>
              <span className="text-xs font-extrabold text-slate-900 block truncate max-w-[170px]">{brandKit.brandName}</span>
            </div>
          </div>
          {onOpenBrandKit && (
            <button
              onClick={onOpenBrandKit}
              className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer border border-blue-200"
            >
              Configurar
            </button>
          )}
        </div>

        {/* League Selector */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2.5">
            Liga de Baloncesto
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
            {(['ALL', 'NBA', 'EUROLEAGUE', 'ACB'] as League[]).map((league) => (
              <button
                key={league}
                onClick={() => onSelectLeague(league)}
                className={`py-2 px-3 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  selectedLeague === league
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {league === 'ALL' ? 'Todas' : league === 'EUROLEAGUE' ? 'Euroliga' : league}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Category Selector */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2.5">
            Métrica del Carrusel
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {STAT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory.id === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-left text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border border-blue-300 text-blue-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-slate-300'}`} />
                    <span>{cat.label}</span>
                  </div>
                  <span className={`font-mono text-xs ${isSelected ? 'text-blue-700 font-bold' : 'text-slate-400'}`}>
                    {cat.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Carousel Settings */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            Configuración del Carrusel
          </span>

          {/* Format (Aspect Ratio) */}
          <div>
            <span className="text-xs text-slate-600 block mb-1.5 font-medium">Formato de Imagen</span>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setFormat('4:5')}
                className={`py-1.5 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                  format === '4:5' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                4:5 (Post)
              </button>
              <button
                onClick={() => setFormat('9:16')}
                className={`py-1.5 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                  format === '9:16' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                9:16 (Story)
              </button>
              <button
                onClick={() => setFormat('1:1')}
                className={`py-1.5 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                  format === '1:1' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1:1 (Cuadrado)
              </button>
            </div>
          </div>

          {/* Ranking Count */}
          <div>
            <span className="text-xs text-slate-600 block mb-1.5 font-medium">Profundidad del Ranking</span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => {
                  setRankingCount(5);
                  setCurrentSlideIndex(0);
                }}
                className={`py-1.5 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                  rankingCount === 5 ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Top 5 (7 Slides)
              </button>
              <button
                onClick={() => {
                  setRankingCount(10);
                  setCurrentSlideIndex(0);
                }}
                className={`py-1.5 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                  rankingCount === 10 ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Top 10 (12 Slides)
              </button>
            </div>
          </div>

          {/* Quick Jump List of Slides */}
          <div>
            <span className="text-xs text-slate-600 block mb-2 font-medium">Saltar a Diapositiva</span>
            <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
              {Array.from({ length: totalSlides }).map((_, idx) => {
                const label = idx === 0 ? 'Portada' : idx === totalSlides - 1 ? 'Podio' : `#${idx}`;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`px-2.5 py-1 text-xs rounded font-mono transition-colors cursor-pointer ${
                      currentSlideIndex === idx
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Slide Preview & Export Buttons */}
      <div className="flex-1 flex flex-col items-center">
        {/* Carousel Visual Frame */}
        <div className="relative w-full max-w-[420px] bg-neutral-950 rounded-2xl overflow-hidden border border-slate-300 shadow-2xl shadow-slate-400/20 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-auto object-contain block"
          />

          {/* Loading Indicator for ZIP */}
          {isZipping && (
            <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
              <Sparkles className="w-10 h-10 text-blue-400 animate-spin mb-4" />
              <h4 className="text-lg font-bold text-white mb-2">Empaquetando Carrusel ZIP</h4>
              <p className="text-xs text-neutral-300 mb-4 max-w-xs">
                Generando imágenes de alta resolución listas para subir a Instagram...
              </p>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-blue-500 h-full transition-all duration-150"
                  style={{ width: `${zipProgress}%` }}
                />
              </div>
              <span className="font-mono text-sm font-bold text-blue-400">{zipProgress}%</span>
            </div>
          )}
        </div>

        {/* Slide Navigation Bar */}
        <div className="w-full max-w-[500px] mt-5 flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-xs">
          <button
            onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentSlideIndex === 0}
            className="p-2 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {currentSlideIndex === 0
                ? '01. Portada del Carrusel'
                : currentSlideIndex === totalSlides - 1
                  ? `${totalSlides}. Resumen Final y Llamada a Acción`
                  : `0${currentSlideIndex + 1}. Puesto #${currentSlideIndex} - ${filteredPlayers[currentSlideIndex - 1]?.name || ''}`}
            </span>
            <span className="text-xs font-mono text-blue-600 font-bold">
              ({currentSlideIndex + 1}/{totalSlides})
            </span>
          </div>

          <button
            onClick={() => setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1))}
            disabled={currentSlideIndex === totalSlides - 1}
            className="p-2 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Export Actions in Blue */}
        <div className="w-full max-w-[500px] mt-4 flex items-center gap-3">
          <button
            onClick={handleDownloadSingle}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition-all border border-blue-200 text-xs cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Descargar Esta Diapositiva</span>
          </button>

          <button
            onClick={handleDownloadAllZip}
            disabled={isZipping}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer"
          >
            <Archive className="w-4 h-4" />
            <span>{isZipping ? `Creando ZIP ${zipProgress}%` : 'Descargar Carrusel (ZIP)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
