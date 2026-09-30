import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { Player, StatCategory, BrandKit, League } from '../types';
import { STAT_CATEGORIES } from '../data/defaultPlayers';
import {
  GraphicFormat,
  renderLeaderboardGraphic,
  downloadCanvasAsImage
} from '../services/carouselRenderer';

interface SingleGraphicStudioProps {
  players: Player[];
  selectedCategory: StatCategory;
  onSelectCategory: (cat: StatCategory) => void;
  brandKit: BrandKit;
  selectedLeague: League;
  onSelectLeague: (league: League) => void;
  onOpenBrandKit?: () => void;
}

export const SingleGraphicStudio: React.FC<SingleGraphicStudioProps> = ({
  players,
  selectedCategory,
  onSelectCategory,
  brandKit,
  selectedLeague,
  onSelectLeague,
  onOpenBrandKit
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rankingCount, setRankingCount] = useState<5 | 10>(10);
  const [format, setFormat] = useState<GraphicFormat>('9:16');

  // Filtered & sorted players
  const filteredPlayers = useMemo(() => {
    let list = [...players];
    if (selectedLeague !== 'ALL') {
      list = list.filter(p => p.league === selectedLeague);
    }
    list.sort((a, b) => (b.stats[selectedCategory.id] || 0) - (a.stats[selectedCategory.id] || 0));
    return list;
  }, [players, selectedLeague, selectedCategory]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderLeaderboardGraphic(
      canvas,
      filteredPlayers,
      selectedCategory,
      brandKit,
      format,
      rankingCount
    );
  }, [filteredPlayers, selectedCategory, brandKit, format, rankingCount]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const filename = `SlamMetrics_Ranking_${rankingCount}_${selectedCategory.shortLabel}_${selectedLeague}_${format.replace(':', 'x')}.png`;
    downloadCanvasAsImage(canvas, filename);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto">
      {/* LEFT COLUMN: Controls */}
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
            Estadística Principal
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

        {/* Graphic Options */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Dimensiones de la Lámina
          </span>

          {/* Format */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setFormat('9:16')}
              className={`py-1.5 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                format === '9:16' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              9:16 (Story)
            </button>
            <button
              onClick={() => setFormat('4:5')}
              className={`py-1.5 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                format === '4:5' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4:5 (Post)
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

          {/* Count: 5 or 10 */}
          <div>
            <span className="text-xs text-slate-600 block mb-1.5 font-medium">Cantidad de Jugadores en Lámina</span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setRankingCount(5)}
                className={`py-1.5 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                  rankingCount === 5 ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                TOP 5
              </button>
              <button
                onClick={() => setRankingCount(10)}
                className={`py-1.5 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                  rankingCount === 10 ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                TOP 10
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Canvas Preview & Download */}
      <div className="flex-1 flex flex-col items-center">
        <div className="relative w-full max-w-[420px] bg-neutral-950 rounded-2xl overflow-hidden border border-slate-300 shadow-2xl shadow-slate-400/20 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-auto object-contain block"
          />
        </div>

        {/* Download Button in Blue */}
        <div className="w-full max-w-[420px] mt-5">
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-blue-500/20 text-xs uppercase tracking-wider cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Lámina en Alta Definición (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
