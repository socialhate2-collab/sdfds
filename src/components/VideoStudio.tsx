import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Download, Sparkles, Volume2, VolumeX, Eye, Layers, Palette } from 'lucide-react';
import { Player, StatCategory, BrandKit, VideoSettings, League, DesignTemplate } from '../types';
import { STAT_CATEGORIES } from '../data/defaultPlayers';
import { drawVideoFrame, calculateTotalDuration, preloadImages, VideoAudioSynthesizer } from '../services/videoEngine';

interface VideoStudioProps {
  players: Player[];
  selectedCategory: StatCategory;
  onSelectCategory: (cat: StatCategory) => void;
  brandKit: BrandKit;
  selectedLeague: League;
  onSelectLeague: (league: League) => void;
  onOpenBrandKit: () => void;
  templates?: DesignTemplate[];
  activeTemplateId?: string;
  onSelectTemplate?: (id: string) => void;
}

export const VideoStudio: React.FC<VideoStudioProps> = ({
  players,
  selectedCategory,
  onSelectCategory,
  brandKit,
  selectedLeague,
  onSelectLeague,
  onOpenBrandKit,
  templates = [],
  activeTemplateId,
  onSelectTemplate
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioSynthRef = useRef<VideoAudioSynthesizer | null>(null);

  // Settings
  const [settings, setSettings] = useState<VideoSettings>({
    rankingCount: 10,
    order: 'climax', // #10 down to #1
    durationPerPlayer: 2.0,
    introDuration: 1.6,
    outroDuration: 1.8,
    includeAudio: true,
    soundtrack: 'hype_beat',
    resolution: '720x1280',
    fps: 30
  });

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [lastSoundPlayerIdx, setLastSoundPlayerIdx] = useState<number>(-1);

  // Filtered and sorted players
  const filteredPlayers = React.useMemo(() => {
    let list = [...players];
    if (selectedLeague !== 'ALL') {
      list = list.filter(p => p.league === selectedLeague);
    }
    // Sort descending by selected stat
    list.sort((a, b) => (b.stats[selectedCategory.id] || 0) - (a.stats[selectedCategory.id] || 0));
    return list;
  }, [players, selectedLeague, selectedCategory]);

  const totalDuration = calculateTotalDuration(settings);

  // Initialize audio synthesizer on demand
  const getAudioSynth = useCallback(() => {
    if (!audioSynthRef.current) {
      audioSynthRef.current = new VideoAudioSynthesizer();
    }
    audioSynthRef.current.init();
    return audioSynthRef.current;
  }, []);

  // Preload player images & brand assets
  useEffect(() => {
    const urls = [
      brandKit.logoUrl,
      brandKit.customBgUrl || '',
      brandKit.courtOverlayUrl || '',
      brandKit.template?.assets.logoUrl || '',
      brandKit.template?.assets.backgroundUrl || '',
      brandKit.template?.assets.courtOverlayUrl || '',
      ...filteredPlayers.slice(0, settings.rankingCount).map(p => p.photoUrl)
    ];
    preloadImages(urls).then(() => {
      renderCurrentFrame();
    });
  }, [brandKit, filteredPlayers, settings.rankingCount]);

  // Render current frame on canvas
  const renderCurrentFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed canvas internal buffer (720x1280 for sharp preview)
    const w = 720;
    const h = 1280;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    drawVideoFrame(
      ctx,
      w,
      h,
      filteredPlayers,
      selectedCategory,
      brandKit,
      settings,
      currentTime
    );
  }, [currentTime, filteredPlayers, selectedCategory, brandKit, settings]);

  // Trigger render when time or settings change
  useEffect(() => {
    renderCurrentFrame();
  }, [currentTime, renderCurrentFrame]);

  // Audio trigger on player slide changes during playback
  useEffect(() => {
    if (!isPlaying || !settings.includeAudio) return;

    const introEnd = settings.introDuration;
    const playersEnd = introEnd + (settings.rankingCount * settings.durationPerPlayer);

    if (currentTime >= introEnd && currentTime < playersEnd) {
      const playerElapsed = currentTime - introEnd;
      const currentIdx = Math.floor(playerElapsed / settings.durationPerPlayer);

      if (currentIdx !== lastSoundPlayerIdx) {
        setLastSoundPlayerIdx(currentIdx);
        const synth = getAudioSynth();
        synth.playWhoosh(0);
        synth.playKick(0.04);
      }
    }
  }, [currentTime, isPlaying, settings, lastSoundPlayerIdx, getAudioSynth]);

  // Playback loop with requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) return;

    let animFrame: number;
    let prevTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (prevTimestamp === null) {
        prevTimestamp = timestamp;
      }
      const delta = (timestamp - prevTimestamp) / 1000;
      prevTimestamp = timestamp;

      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return 0; // Loop or stop
        }
        return next;
      });

      animFrame = requestAnimationFrame(step);
    };

    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, totalDuration]);

  // Export 9:16 Video using MediaRecorder
  const handleExportVideo = async () => {
    setIsPlaying(false);
    setIsExporting(true);
    setExportProgress(0);

    try {
      const exportCanvas = document.createElement('canvas');
      const [expW, expH] = settings.resolution === '1080x1920' ? [1080, 1920] : [720, 1280];
      exportCanvas.width = expW;
      exportCanvas.height = expH;
      const expCtx = exportCanvas.getContext('2d');
      if (!expCtx) throw new Error('Cannot get 2d context for export');

      // Preload all assets first
      const allUrls = [
        brandKit.logoUrl,
        brandKit.customBgUrl || '',
        ...filteredPlayers.slice(0, settings.rankingCount).map(p => p.photoUrl)
      ];
      await preloadImages(allUrls);

      // Setup audio destination
      let audioStream: MediaStream | null = null;
      let synth: VideoAudioSynthesizer | null = null;
      if (settings.includeAudio) {
        synth = getAudioSynth();
        if (synth && synth.destination) {
          audioStream = synth.destination.stream;
        }
      }

      // Capture Canvas Stream
      const fps = settings.fps;
      const canvasStream = exportCanvas.captureStream(fps);

      // Merge tracks
      const combinedTracks = [...canvasStream.getVideoTracks()];
      if (audioStream) {
        audioStream.getAudioTracks().forEach(t => combinedTracks.push(t));
      }
      const finalStream = new MediaStream(combinedTracks);

      // Choose supported mimeType
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      let chosenMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';

      const recorder = new MediaRecorder(finalStream, {
        mimeType: chosenMime,
        videoBitsPerSecond: 8000000 // 8 Mbps high quality
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const recordPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: chosenMime });
          resolve(blob);
        };
      });

      recorder.start();

      // Render frame by frame at precise intervals
      const totalFrames = Math.ceil(totalDuration * fps);
      const frameDelta = 1 / fps;
      let soundIdx = -1;

      for (let f = 0; f < totalFrames; f++) {
        const renderTime = f * frameDelta;

        // Trigger synth sound effects at transitions
        if (synth && settings.includeAudio) {
          const introEnd = settings.introDuration;
          const playersEnd = introEnd + (settings.rankingCount * settings.durationPerPlayer);
          if (renderTime >= introEnd && renderTime < playersEnd) {
            const playerElapsed = renderTime - introEnd;
            const currentIdx = Math.floor(playerElapsed / settings.durationPerPlayer);
            if (currentIdx !== soundIdx) {
              soundIdx = currentIdx;
              synth.playWhoosh(0);
              synth.playKick(0.04);
            }
          }
        }

        drawVideoFrame(
          expCtx,
          expW,
          expH,
          filteredPlayers,
          selectedCategory,
          brandKit,
          settings,
          renderTime
        );

        // Update progress UI
        setExportProgress(Math.round(((f + 1) / totalFrames) * 100));

        // Sleep to let media recorder capture the frame accurately
        await new Promise((r) => setTimeout(r, 1000 / fps));
      }

      recorder.stop();
      const videoBlob = await recordPromise;

      // Trigger download
      const filename = `SlamMetrics_TOP${settings.rankingCount}_${selectedCategory.shortLabel}_${selectedLeague}_9x16.webm`;
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Video generation error:', err);
      alert('Hubo un error al generar el video. Intenta con resolución 720x1280.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto">
      {/* LEFT COLUMN: Controls & Data Filters */}
      <div className="w-full lg:w-96 flex flex-col gap-5 shrink-0">
        {/* Active Design System Badge & 1-Click Template Switcher */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Sistema de Diseño Activo
              </span>
            </div>
            <button
              onClick={onOpenBrandKit}
              className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer border border-blue-200 flex items-center gap-1"
            >
              <Palette className="w-3 h-3" />
              <span>Assets & Diseños</span>
            </button>
          </div>

          {/* Active Template Card with Thumbnails */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 shadow-xs relative">
              {brandKit.logoUrl ? (
                <img src={brandKit.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Sparkles className="w-4 h-4 text-cyan-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 truncate block">
                  {brandKit.brandName}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                  style={{ backgroundColor: brandKit.primaryColor }}
                  title={`Color: ${brandKit.primaryColor}`}
                />
              </div>
              <span className="text-[11px] text-slate-500 truncate block font-mono">
                {brandKit.cardStyle === 'cyber' ? '⚡ Cyber Analytics (Cian Neón)' : '🏆 Sports Broadcast (Ámbar)'}
              </span>
            </div>
          </div>

          {/* Quick 1-Click Template Selector if multiple templates available */}
          {templates.length > 1 && onSelectTemplate && (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Cambiar Estilo al Instante:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {templates.map((tpl) => {
                  const isCurrent = tpl.id === activeTemplateId;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => onSelectTemplate(tpl.id)}
                      className={`py-1.5 px-2.5 rounded-lg text-left text-[11px] font-bold transition-all cursor-pointer truncate flex items-center gap-1.5 border ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: tpl.theme.primaryColor }}
                      />
                      <span className="truncate">{tpl.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
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
            Métrica de Ranking
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

        {/* Video Setup Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ajustes del Video
            </span>
            <button
              onClick={onOpenBrandKit}
              className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-semibold cursor-pointer"
            >
              Ajustar Marca
            </button>
          </div>

          {/* Ranking Count: 5 or 10 */}
          <div>
            <span className="text-xs text-slate-600 block mb-1.5 font-medium">Cantidad de Jugadores</span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setSettings(s => ({ ...s, rankingCount: 5 }))}
                className={`py-1.5 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                  settings.rankingCount === 5 ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                TOP 5
              </button>
              <button
                onClick={() => setSettings(s => ({ ...s, rankingCount: 10 }))}
                className={`py-1.5 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                  settings.rankingCount === 10 ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                TOP 10
              </button>
            </div>
          </div>

          {/* Ranking Order: Climax vs Direct */}
          <div>
            <span className="text-xs text-slate-600 block mb-1.5 font-medium">Estructura Narrativa</span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setSettings(s => ({ ...s, order: 'climax' }))}
                title="Comienza en el puesto más bajo y termina en el número 1 para máxima retención"
                className={`py-1.5 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                  settings.order === 'climax' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                #10 ➔ #1 (Clímax)
              </button>
              <button
                onClick={() => setSettings(s => ({ ...s, order: 'direct' }))}
                title="Comienza con el número 1 directamente"
                className={`py-1.5 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                  settings.order === 'direct' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                #1 ➔ #10 (Directo)
              </button>
            </div>
          </div>

          {/* Duration per player */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 font-medium">Tiempo por jugador</span>
              <span className="font-mono text-blue-600 font-bold">{settings.durationPerPlayer}s</span>
            </div>
            <input
              type="range"
              min="1.2"
              max="3.5"
              step="0.2"
              value={settings.durationPerPlayer}
              onChange={(e) => setSettings(s => ({ ...s, durationPerPlayer: parseFloat(e.target.value) }))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Sound toggle & Resolution */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => setSettings(s => ({ ...s, includeAudio: !s.includeAudio }))}
              className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              {settings.includeAudio ? (
                <>
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-800">Audio Hype Activo</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Video Silencioso</span>
                </>
              )}
            </button>

            <select
              value={settings.resolution}
              onChange={(e) => setSettings(s => ({ ...s, resolution: e.target.value as '1080x1920' | '720x1280' }))}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="720x1280">720x1280 (Rápido)</option>
              <option value="1080x1920">1080x1920 (FHD)</option>
            </select>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Video Player & Timeline */}
      <div className="flex-1 flex flex-col items-center">
        {/* Phone Frame Simulator with 9:16 aspect */}
        <div className="relative w-full max-w-[380px] aspect-[9/16] bg-neutral-950 rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl shadow-slate-400/20 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover"
          />

          {/* Overlay indicator during export */}
          {isExporting && (
            <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
              <Sparkles className="w-10 h-10 text-blue-400 animate-spin mb-4" />
              <h4 className="text-lg font-bold text-white mb-2">Renderizando Video 9:16</h4>
              <p className="text-xs text-neutral-300 mb-4 max-w-xs">
                Compilando animaciones, métricas de jugadores y pista de audio...
              </p>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-blue-500 h-full transition-all duration-150"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <span className="font-mono text-sm font-bold text-blue-400">{exportProgress}%</span>
            </div>
          )}
        </div>

        {/* Video Player Controls Bar */}
        <div className="w-full max-w-[540px] mt-6 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          {/* Timeline Scrubber */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500 tabular-nums w-14 font-semibold">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={totalDuration}
              step="0.05"
              value={currentTime}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentTime(parseFloat(e.target.value));
              }}
              className="flex-1 accent-blue-600 cursor-pointer"
            />
            <span className="text-xs font-mono text-slate-500 tabular-nums w-14 text-right font-semibold">
              {formatTime(totalDuration)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isPlaying) {
                    setIsPlaying(false);
                  } else {
                    getAudioSynth();
                    setIsPlaying(true);
                  }
                }}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 text-xs cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentTime(0);
                }}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Reiniciar al inicio"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Export Button in Blue */}
            <button
              onClick={handleExportVideo}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? `Exportando ${exportProgress}%` : 'Descargar Video 9:16'}</span>
            </button>
          </div>
        </div>

        {/* Quick Social Tip */}
        <div className="flex items-center gap-2 text-slate-500 text-xs mt-3">
          <Eye className="w-3.5 h-3.5 text-blue-600" />
          <span>Formato 9:16 optimizado con márgenes de seguridad para TikTok, Instagram Reels y Shorts</span>
        </div>
      </div>
    </div>
  );
};
