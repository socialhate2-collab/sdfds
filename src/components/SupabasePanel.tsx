import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Copy,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Save,
  RotateCcw
} from 'lucide-react';
import { Player, SupabaseConfig } from '../types';
import {
  saveSupabaseConfig,
  testSupabaseConnection,
  fetchPlayersFromSupabase,
  generateSupabaseSQLSchema,
  saveLocalPlayers
} from '../services/supabaseService';
import { INITIAL_PLAYERS } from '../data/defaultPlayers';

interface SupabasePanelProps {
  config: SupabaseConfig;
  onChangeConfig: (newConfig: SupabaseConfig) => void;
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
}

export const SupabasePanel: React.FC<SupabasePanelProps> = ({
  config,
  onChangeConfig,
  players,
  onUpdatePlayers
}) => {
  const [url, setUrl] = useState<string>(config.url);
  const [anonKey, setAnonKey] = useState<string>(config.anonKey);
  const [tableName, setTableName] = useState<string>(config.tableName || 'players');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSql, setShowSql] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Player editing modal
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleSaveCredentials = () => {
    const updated: SupabaseConfig = {
      ...config,
      url: url.trim(),
      anonKey: anonKey.trim(),
      tableName: tableName.trim() || 'players'
    };
    onChangeConfig(updated);
    saveSupabaseConfig(updated);
  };

  const handleTestConnection = async () => {
    handleSaveCredentials();
    setIsTesting(true);
    setTestResult(null);

    const testConfig: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      tableName: tableName.trim() || 'players',
      isConnected: false
    };

    const res = await testSupabaseConnection(testConfig);
    setTestResult(res);
    setIsTesting(false);

    if (res.success) {
      const updated = { ...testConfig, isConnected: true, lastSync: new Date().toLocaleTimeString() };
      onChangeConfig(updated);
      saveSupabaseConfig(updated);
    }
  };

  const handleSyncData = async () => {
    handleSaveCredentials();
    setIsSyncing(true);

    const currentConf: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      tableName: tableName.trim() || 'players',
      isConnected: config.isConnected
    };

    const res = await fetchPlayersFromSupabase(currentConf);
    setIsSyncing(false);

    if (res.success && res.players && res.players.length > 0) {
      onUpdatePlayers(res.players);
      saveLocalPlayers(res.players);
      const updated = { ...currentConf, isConnected: true, lastSync: new Date().toLocaleTimeString() };
      onChangeConfig(updated);
      saveSupabaseConfig(updated);
      alert(`¡Sincronización exitosa! Se cargaron ${res.players.length} jugadores desde Supabase.`);
    } else if (res.success && res.players?.length === 0) {
      alert(`La tabla "${currentConf.tableName}" en Supabase está vacía. Puedes ejecutar el script SQL sugerido para poblarla.`);
    } else {
      alert(`Error al sincronizar: ${res.error}`);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(generateSupabaseSQLSchema());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleResetToDefault = () => {
    if (confirm('¿Deseas restaurar la lista de jugadores a los datos oficiales por defecto?')) {
      onUpdatePlayers(INITIAL_PLAYERS);
      saveLocalPlayers(INITIAL_PLAYERS);
    }
  };

  const handleDeletePlayer = (id: string) => {
    if (confirm('¿Eliminar este jugador de la base de datos?')) {
      const updated = players.filter(p => p.id !== id);
      onUpdatePlayers(updated);
      saveLocalPlayers(updated);
    }
  };

  const handleSavePlayerForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;

    let updatedList: Player[];
    if (isAddingNew) {
      updatedList = [editingPlayer, ...players];
    } else {
      updatedList = players.map(p => (p.id === editingPlayer.id ? editingPlayer : p));
    }

    onUpdatePlayers(updatedList);
    saveLocalPlayers(updatedList);
    setEditingPlayer(null);
    setIsAddingNew(false);
  };

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.league.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col gap-8">
      {/* SECTION 1: SUPABASE CONFIGURATION CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Conexión a Base de Datos Supabase
              </h2>
              {config.isConnected ? (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Conectado ({config.lastSync || 'Activo'})
                </span>
              ) : (
                <span className="text-xs text-blue-800 font-semibold bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  Modo Local / Desconectado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Conecta tu proyecto de Supabase para obtener estadísticas de tus jugadores en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSql(!showSql)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            >
              {showSql ? 'Ocultar Script SQL' : 'Ver Script SQL para Supabase'}
            </button>
            <button
              onClick={handleSyncData}
              disabled={isSyncing || !url || !anonKey}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Datos'}</span>
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              URL del Proyecto Supabase
            </label>
            <input
              type="text"
              placeholder="https://xyzabcdefg.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleSaveCredentials}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Anon Key (Clave Pública)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              onBlur={handleSaveCredentials}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Nombre de la Tabla
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="players"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                onBlur={handleSaveCredentials}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleTestConnection}
                disabled={isTesting || !url || !anonKey}
                className="px-3 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors border border-blue-600 whitespace-nowrap disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {isTesting ? 'Probando...' : 'Probar'}
              </button>
            </div>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {testResult.success ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* SQL Script Display */}
        {showSql && (
          <div className="mt-5 p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200">
                Script SQL para crear tu tabla en Supabase:
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>
            <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-lg overflow-x-auto max-h-56 leading-relaxed">
              {generateSupabaseSQLSchema()}
            </pre>
          </div>
        )}
      </div>

      {/* SECTION 2: PLAYER ROSTER / DATABASE MANAGEMENT */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Plantilla de Jugadores ({players.length})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Datos activos que alimentan los rankings de video 9:16 y carruseles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Oficiales</span>
            </button>

            <button
              onClick={() => {
                setEditingPlayer({
                  id: `player-${Date.now()}`,
                  name: '',
                  team: '',
                  teamCode: 'EQP',
                  teamColor: '#0284c7',
                  league: 'NBA',
                  number: 0,
                  position: 'BASE',
                  photoUrl: '',
                  stats: { ppg: 20, rpg: 5, apg: 5, spg: 1.0, bpg: 0.5, tpm: 2.0, pir: 20, gamesPlayed: 30, fgPct: 50.0 }
                });
                setIsAddingNew(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Jugador</span>
            </button>
          </div>
        </div>

        {/* Filter input */}
        <div className="py-4">
          <input
            type="text"
            placeholder="Buscar por nombre, equipo o liga..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Players Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Jugador</th>
                <th className="py-3 px-3">Equipo / Liga</th>
                <th className="py-3 px-3 text-right">PTS</th>
                <th className="py-3 px-3 text-right">REB</th>
                <th className="py-3 px-3 text-right">AST</th>
                <th className="py-3 px-3 text-right">3PM</th>
                <th className="py-3 px-3 text-right">VAL</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredPlayers.map((player) => (
                <tr key={player.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center">
                        {player.photoUrl ? (
                          <img
                            src={player.photoUrl}
                            alt={player.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xs font-bold text-slate-500">#{player.number}</span>
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{player.name}</span>
                        <span className="text-slate-500 text-[11px]">
                          #{player.number} · {player.position}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-slate-800 font-medium">{player.team}</span>
                    <span className="text-slate-500 text-[11px] block">{player.league}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-blue-600">
                    {player.stats.ppg.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {player.stats.rpg.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {player.stats.apg.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    {player.stats.tpm.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                    {player.stats.pir.toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingPlayer({ ...player });
                          setIsAddingNew(false);
                        }}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        title="Editar estadísticas"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: EDIT / ADD PLAYER */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {isAddingNew ? 'Añadir Nuevo Jugador' : `Editar a ${editingPlayer.name}`}
            </h3>

            <form onSubmit={handleSavePlayerForm} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={editingPlayer.name}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Equipo</label>
                  <input
                    type="text"
                    required
                    value={editingPlayer.team}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, team: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Liga</label>
                  <select
                    value={editingPlayer.league}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, league: e.target.value as 'NBA' | 'EUROLEAGUE' | 'ACB' })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 cursor-pointer"
                  >
                    <option value="NBA">NBA</option>
                    <option value="EUROLEAGUE">EuroLeague</option>
                    <option value="ACB">Liga ACB</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Dorsal</label>
                  <input
                    type="number"
                    value={editingPlayer.number}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, number: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Posición</label>
                  <select
                    value={editingPlayer.position}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, position: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 cursor-pointer"
                  >
                    <option value="BASE">Base</option>
                    <option value="ESCOLTA">Escolta</option>
                    <option value="ALERO">Alero</option>
                    <option value="ALA-PÍVOT">Ala-Pívot</option>
                    <option value="PÍVOT">Pívot</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">URL Foto / Headshot</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={editingPlayer.photoUrl}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, photoUrl: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Stats Grid */}
              <div className="border-t border-slate-200 pt-3">
                <span className="text-xs font-bold text-slate-700 block mb-2">Estadísticas por Partido</span>
                <div className="grid grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-500 block">Puntos (PPG)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingPlayer.stats.ppg}
                      onChange={(e) => setEditingPlayer({
                        ...editingPlayer,
                        stats: { ...editingPlayer.stats, ppg: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-blue-600 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block">Rebotes (RPG)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingPlayer.stats.rpg}
                      onChange={(e) => setEditingPlayer({
                        ...editingPlayer,
                        stats: { ...editingPlayer.stats, rpg: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block">Asistencias (APG)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingPlayer.stats.apg}
                      onChange={(e) => setEditingPlayer({
                        ...editingPlayer,
                        stats: { ...editingPlayer.stats, apg: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block">Triples (3PM)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingPlayer.stats.tpm}
                      onChange={(e) => setEditingPlayer({
                        ...editingPlayer,
                        stats: { ...editingPlayer.stats, tpm: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block">Valoración (PIR)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingPlayer.stats.pir}
                      onChange={(e) => setEditingPlayer({
                        ...editingPlayer,
                        stats: { ...editingPlayer.stats, pir: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-emerald-600 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block">Tapones (BPG)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingPlayer.stats.bpg}
                      onChange={(e) => setEditingPlayer({
                        ...editingPlayer,
                        stats: { ...editingPlayer.stats, bpg: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block">Robos (SPG)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingPlayer.stats.spg}
                      onChange={(e) => setEditingPlayer({
                        ...editingPlayer,
                        stats: { ...editingPlayer.stats, spg: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block">% Tiro (TC)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingPlayer.stats.fgPct}
                      onChange={(e) => setEditingPlayer({
                        ...editingPlayer,
                        stats: { ...editingPlayer.stats, fgPct: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Jugador</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
