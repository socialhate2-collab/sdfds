import React from 'react';
import { Film, Images, LayoutGrid, Database, Palette, Download, Layers, Sparkles, ChevronDown } from 'lucide-react';
import { DesignTemplate } from '../types';

interface HeaderProps {
  activeTab: 'video' | 'carousel' | 'graphic' | 'database' | 'brand' | 'templates';
  onSelectTab: (tab: 'video' | 'carousel' | 'graphic' | 'database' | 'brand' | 'templates') => void;
  onQuickExport: () => void;
  isExporting?: boolean;
  templates?: DesignTemplate[];
  activeTemplateId?: string;
  onSelectTemplate?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onQuickExport,
  isExporting = false,
  templates = [],
  activeTemplateId = '',
  onSelectTemplate
}) => {
  const activeTemplate = templates.find(t => t.id === activeTemplateId) || templates[0];

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Zone 1: Single text element wordmark with sports accent + Design Selector */}
      <div className="flex items-center gap-3">
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); onSelectTab('video'); }}
          className="text-xl font-extrabold tracking-tight text-slate-900 hover:text-blue-600 transition-colors whitespace-nowrap"
        >
          <span className="text-blue-600 mr-1.5">⚡</span>SlamMetrics
        </a>
        <span className="hidden lg:inline text-xs text-slate-500 font-medium border-l border-slate-200 pl-3">
          Estudio de Redes
        </span>

        {/* Quick Design Switcher Dropdown */}
        {templates.length > 0 && onSelectTemplate && (
          <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400">Diseño:</span>
            <div className="relative inline-flex items-center">
              <select
                value={activeTemplateId}
                onChange={(e) => onSelectTemplate(e.target.value)}
                className="appearance-none bg-blue-50 hover:bg-blue-100/70 border border-blue-200 text-blue-800 text-xs font-bold py-1 pl-2.5 pr-7 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.id === 'basketdata-rankings' ? '⚡ ' : tpl.id === 'slammetrics-broadcast' ? '📺 ' : '🎨 '}
                    {tpl.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-blue-600 absolute right-2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Zone 2: Navigation tabs with blue active state */}
      <nav className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onSelectTab('video')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'video'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Video 9:16</span>
        </button>

        <button
          onClick={() => onSelectTab('carousel')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'carousel'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Images className="w-3.5 h-3.5" />
          <span>Carruseles</span>
        </button>

        <button
          onClick={() => onSelectTab('graphic')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'graphic'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Lámina Top</span>
        </button>

        <button
          onClick={() => onSelectTab('templates')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-bold">Diseños & Manifest</span>
          <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.2 rounded-full">
            {templates.length}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('database')}
          className={`hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'database'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Supabase / Datos</span>
        </button>

        <button
          onClick={() => onSelectTab('brand')}
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'brand'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Brand Kit</span>
        </button>
      </nav>

      {/* Zone 3: Primary action button in Blue */}
      <div className="flex items-center gap-3">
        <button
          onClick={onQuickExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Procesando...' : 'Descargar Rápido'}</span>
        </button>
      </div>
    </header>
  );
};
