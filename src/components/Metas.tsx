import { useState, useMemo, useCallback } from 'react';
import { getMetas, addMeta, updateMetaAhorro, deleteMeta } from '../utils/storage';
import { Plus, X, Trash2, Target, TrendingUp, Calendar, PiggyBank } from 'lucide-react';
import PullToRefresh from './PullToRefresh';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Metas() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [showAportar, setShowAportar] = useState<string | null>(null);
  const [montoAporte, setMontoAporte] = useState('');

  const metas = useMemo(() => getMetas(), [refreshKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoObjetivo);
    if (!nombre || isNaN(monto) || monto <= 0 || !fechaLimite) return;

    addMeta({
      nombre,
      montoObjetivo: Math.round(monto),
      fechaLimite,
      color: COLORS[metas.length % COLORS.length],
    });
    setNombre('');
    setMontoObjetivo('');
    setFechaLimite('');
    setShowForm(false);
    setRefreshKey(k => k + 1);
  };

  const handleAportar = (id: string) => {
    const monto = parseFloat(montoAporte);
    if (isNaN(monto) || monto <= 0) return;
    updateMetaAhorro(id, Math.round(monto));
    setMontoAporte('');
    setShowAportar(null);
    setRefreshKey(k => k + 1);
  };

  const handleDelete = (id: string) => {
    deleteMeta(id);
    setRefreshKey(k => k + 1);
  };

  // Calcular sugerencia de ahorro
  const metasConSugerencia = useMemo(() => {
    return metas.map(m => {
      const restante = m.montoObjetivo - m.montoActual;
      if (restante <= 0) return { ...m, restante: 0, ahorroMensual: 0, progreso: 100, diasRestantes: 0, completada: true };
      const diasRestantes = Math.max(1, (new Date(m.fechaLimite).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const mesesRestantes = Math.max(1, Math.ceil(diasRestantes / 30));
      return {
        ...m,
        restante,
        ahorroMensual: Math.ceil(restante / mesesRestantes),
        progreso: (m.montoActual / m.montoObjetivo) * 100,
        diasRestantes: Math.round(diasRestantes),
        completada: false,
      };
    });
  }, [metas]);

  const totalAhorrado = metas.reduce((s, m) => s + m.montoActual, 0);
  const totalObjetivo = metas.reduce((s, m) => s + m.montoObjetivo, 0);

  const handleRefresh = useCallback(async () => {
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Metas de Ahorro</h2>
          <p className="text-sm text-gray-500">
            {totalObjetivo > 0
              ? `${((totalAhorrado / totalObjetivo) * 100).toFixed(0)}% completado — $${totalAhorrado.toLocaleString('es-CL')} / $${totalObjetivo.toLocaleString('es-CL')}`
              : 'Define tus metas para empezar a ahorrar'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:from-purple-700 hover:to-pink-700 transition-all active:scale-95 shadow-lg shadow-purple-900/50"
        >
          <Plus className="w-4 h-4" />
          Nueva Meta
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Nueva Meta de Ahorro</h3>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-800">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre de la meta</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Viaje a la playa"
              required
              className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Monto objetivo ($)</label>
              <input
                type="number"
                value={montoObjetivo}
                onChange={e => setMontoObjetivo(e.target.value)}
                placeholder="500000"
                min={0}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg font-bold placeholder:text-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha límite</label>
              <input
                type="date"
                value={fechaLimite}
                onChange={e => setFechaLimite(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all active:scale-95"
          >
            Crear Meta
          </button>
        </form>
      )}

      {/* Lista de metas */}
      {metasConSugerencia.length > 0 ? (
        <div className="space-y-3">
          {metasConSugerencia.map((meta) => (
            <div key={meta.id} className="stagger-enter bg-gray-900 rounded-2xl p-5 border border-gray-800 hover:border-gray-700/50 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${meta.color}20` }}
                  >
                    <Target className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{meta.nombre}</h3>
                    <p className="text-xs text-gray-500">
                      {meta.completada ? '✅ Completada' : `${meta.diasRestantes} días restantes`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(meta.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" />
                </button>
              </div>

              {/* Barra de progreso */}
              <div className="h-3 bg-gray-800 rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(meta.progreso, 100)}%`,
                    background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-500">
                  <span className="text-white font-medium">${meta.montoActual.toLocaleString('es-CL')}</span> / ${meta.montoObjetivo.toLocaleString('es-CL')}
                </span>
                <span className="text-xs font-medium" style={{ color: meta.color }}>
                  {meta.progreso.toFixed(0)}%
                </span>
              </div>

              {/* Sugerencia de ahorro */}
              {!meta.completada && meta.ahorroMensual > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-gray-400">
                      Ahorro sugerido:{' '}
                      <span className="text-emerald-400 font-semibold">
                        ${meta.ahorroMensual.toLocaleString('es-CL')}/mes
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {/* Botón de aportar */}
              {showAportar === meta.id ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={montoAporte}
                    onChange={e => setMontoAporte(e.target.value)}
                    placeholder="Monto a aportar"
                    className="flex-1 px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    autoFocus
                  />
                  <button
                    onClick={() => handleAportar(meta.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    Aportar
                  </button>
                  <button
                    onClick={() => { setShowAportar(null); setMontoAporte(''); }}
                    className="px-3 py-2 rounded-xl bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAportar(meta.id)}
                  className="w-full py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <PiggyBank className="w-4 h-4" />
                  Aportar a esta meta
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
          <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">Sin metas</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Crea tu primera meta de ahorro y te ayudaremos a calcular cuánto ahorrar cada mes para alcanzarla.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:from-purple-700 hover:to-pink-700 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Crear Meta
          </button>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}
