import { useState, useMemo, useCallback } from 'react';
import { getGastos, addGasto, deleteGasto } from '../utils/storage';
import type { Gasto } from '../utils/storage';
import { Plus, X, Trash2, Search, Wallet, Filter } from 'lucide-react';
import PullToRefresh from './PullToRefresh';

const CATEGORIAS = [
  { id: 'alimentacion', label: 'Alimentación', icon: '🍽️' },
  { id: 'vivienda', label: 'Vivienda', icon: '🏠' },
  { id: 'transporte', label: 'Transporte', icon: '🚗' },
  { id: 'salud', label: 'Salud', icon: '💊' },
  { id: 'educacion', label: 'Educación', icon: '📚' },
  { id: 'entretencion', label: 'Entretención', icon: '🎮' },
  { id: 'vestuario', label: 'Vestuario', icon: '👕' },
  { id: 'servicios', label: 'Servicios', icon: '💡' },
  { id: 'ahorro', label: 'Ahorro', icon: '🐷' },
  { id: 'otros', label: 'Otros', icon: '📦' },
];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function Gastos() {
  const ahora = new Date();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'personal' | 'familiar'>('todos');
  const [filtroMes, setFiltroMes] = useState(ahora.getMonth() + 1);
  const [filtroAnio, setFiltroAnio] = useState(ahora.getFullYear());

  // Form state
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('alimentacion');
  const [tipo, setTipo] = useState<'personal' | 'familiar'>('personal');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const gastos = useMemo(() => {
    const all = getGastos();
    return all.filter(g => {
      const d = new Date(g.fecha);
      const matchMes = d.getMonth() + 1 === filtroMes && d.getFullYear() === filtroAnio;
      const matchTipo = filtroTipo === 'todos' || g.tipo === filtroTipo;
      const matchSearch = !searchQuery ||
        g.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        CATEGORIAS.find(c => c.id === g.categoria)?.label.toLowerCase().includes(searchQuery.toLowerCase());
      return matchMes && matchTipo && matchSearch;
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [refreshKey, filtroMes, filtroAnio, filtroTipo, searchQuery]);

  const totalGastos = useMemo(() => gastos.reduce((s, g) => s + g.monto, 0), [gastos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) return;

    addGasto({
      monto: montoNum,
      categoria,
      tipo,
      descripcion: descripcion || CATEGORIAS.find(c => c.id === categoria)?.label || 'Gasto',
      fecha,
    });
    setMonto('');
    setDescripcion('');
    setShowForm(false);
    setRefreshKey(k => k + 1);
  };

  const handleDelete = (id: string) => {
    deleteGasto(id);
    setRefreshKey(k => k + 1);
  };

  const gastosPorCategoria = useMemo(() => {
    const grouped: Record<string, Gasto[]> = {};
    for (const g of gastos) {
      if (!grouped[g.categoria]) grouped[g.categoria] = [];
      grouped[g.categoria]!.push(g);
    }
    return grouped;
  }, [gastos]);

  const handleRefresh = useCallback(async () => {
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Gastos</h2>
          <p className="text-sm text-gray-500">
            {MESES[filtroMes - 1]} {filtroAnio} — Total: <span className="text-white font-semibold">${totalGastos.toLocaleString('es-CL')}</span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95 shadow-lg shadow-blue-900/50"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <select
          value={filtroMes}
          onChange={e => setFiltroMes(parseInt(e.target.value))}
          className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm"
        >
          {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={filtroAnio}
          onChange={e => setFiltroAnio(parseInt(e.target.value))}
          className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm"
        >
          {Array.from({ length: 5 }, (_, i) => ahora.getFullYear() - 2 + i).map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <div className="flex bg-gray-800 rounded-xl p-1">
          {(['todos', 'personal', 'familiar'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filtroTipo === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'todos' ? 'Todos' : t === 'personal' ? 'Personal' : 'Familiar'}
            </button>
          ))}
        </div>
      </div>

      {/* Búsqueda */}
      {gastos.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar gastos..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Nuevo Gasto</h3>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-800">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Monto ($)</label>
              <input
                type="number"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                placeholder="0"
                min={0}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg font-bold placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Categoría</label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIAS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoria(c.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    categoria === c.id
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">{c.icon}</span>
                  <span className="text-[10px] text-gray-400">{c.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Ej: Supermercado"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
              <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setTipo('personal')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    tipo === 'personal' ? 'bg-blue-600 text-white' : 'text-gray-400'
                  }`}
                >
                  Personal
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('familiar')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    tipo === 'familiar' ? 'bg-green-600 text-white' : 'text-gray-400'
                  }`}
                >
                  Familiar
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95"
          >
            Agregar Gasto
          </button>
        </form>
      )}

      {/* Lista de gastos */}
      {Object.entries(gastosPorCategoria).length > 0 ? (
        Object.entries(gastosPorCategoria).map(([catId, items]) => {
          const cat = CATEGORIAS.find(c => c.id === catId);
          const subtotal = items.reduce((s, g) => s + g.monto, 0);
          return (
            <div key={catId}>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {cat?.icon} {cat?.label}
                </span>
                <span className="text-xs text-gray-400 font-medium">${subtotal.toLocaleString('es-CL')}</span>
              </div>
              <div className="space-y-1">
                {items.map(g => (
                  <div key={g.id} className="stagger-enter flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3 border border-gray-800/50 hover:border-gray-700/50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          g.tipo === 'familiar' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {g.tipo === 'familiar' ? '👨‍👩‍👧‍👦' : '👤'}
                        </span>
                        <p className="text-sm font-medium text-white truncate">{g.descripcion}</p>
                      </div>
                      <p className="text-xs text-gray-500">{new Date(g.fecha).toLocaleDateString('es-CL')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">${g.monto.toLocaleString('es-CL')}</span>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
          <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">Sin gastos</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            {searchQuery ? 'No hay gastos que coincidan con tu búsqueda.' : 'No tienes gastos registrados este mes. ¡Agrega tu primer gasto!'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Agregar Gasto
            </button>
          )}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}
