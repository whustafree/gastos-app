import { useState, useMemo, useCallback } from 'react';
import { getGastos, addGasto, deleteGasto, getGastosRecurrentes, addGastoRecurrente, deleteGastoRecurrente, updateGastoRecurrente } from '../utils/storage';
import type { Gasto } from '../utils/storage';
import { CATEGORIAS, getCategoria } from '../utils/categorias';
import { parseCLP } from '../utils/format';
import { Plus, X, Trash2, Search, Wallet, Repeat } from 'lucide-react';
import PullToRefresh from './PullToRefresh';

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
  const [showRecurrentes, setShowRecurrentes] = useState(false);

  // Form state
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('alimentacion');
  const [tipo, setTipo] = useState<'personal' | 'familiar'>('personal');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  // Subcategorías (formulario principal)
  const subcategorias = useMemo(() => getCategoria(categoria).subcategorias, [categoria]);

  // Form state para recurrentes
  const [recMonto, setRecMonto] = useState('');
  const [recCategoria, setRecCategoria] = useState('alimentacion');
  const recSubcategorias = useMemo(() => getCategoria(recCategoria).subcategorias, [recCategoria]);
  const [recTipo, setRecTipo] = useState<'personal' | 'familiar'>('personal');
  const [recDescripcion, setRecDescripcion] = useState('');
  const [recDiaMes, setRecDiaMes] = useState('1');
  const [showRecForm, setShowRecForm] = useState(false);

  const recurrentes = useMemo(() => getGastosRecurrentes(), [refreshKey]);

  const gastos = useMemo(() => {
    const all = getGastos();
    return all.filter(g => {
      const d = new Date(g.fecha);
      const matchMes = d.getMonth() + 1 === filtroMes && d.getFullYear() === filtroAnio;
      const matchTipo = filtroTipo === 'todos' || g.tipo === filtroTipo;
      const matchSearch = !searchQuery ||
        g.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCategoria(g.categoria).label.toLowerCase().includes(searchQuery.toLowerCase());
      return matchMes && matchTipo && matchSearch;
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [refreshKey, filtroMes, filtroAnio, filtroTipo, searchQuery]);

  const totalGastos = useMemo(() => gastos.reduce((s, g) => s + g.monto, 0), [gastos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseCLP(monto);
    if (isNaN(montoNum) || montoNum <= 0) return;

    addGasto({
      monto: Math.round(montoNum),
      categoria,
      tipo,
      descripcion: descripcion || getCategoria(categoria).label,
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

  // ─── Gastos Recurrentes ───
  const handleAddRecurrente = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseCLP(recMonto);
    if (isNaN(montoNum) || montoNum <= 0) return;

    addGastoRecurrente({
      monto: Math.round(montoNum),
      categoria: recCategoria,
      tipo: recTipo,
      descripcion: recDescripcion || getCategoria(recCategoria).label,
      diaMes: parseInt(recDiaMes) || 1,
    });
    setRecMonto('');
    setRecDescripcion('');
    setShowRecForm(false);
    setRefreshKey(k => k + 1);
  };

  const handleDeleteRecurrente = (id: string) => {
    deleteGastoRecurrente(id);
    setRefreshKey(k => k + 1);
  };

  const handleToggleRecurrente = (id: string, activo: boolean) => {
    updateGastoRecurrente(id, { activo });
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
    <>
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
        <div className="flex gap-2">
          <button
            onClick={() => { setShowRecurrentes(!showRecurrentes); setShowForm(false); }}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
              showRecurrentes ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
            title="Gastos recurrentes"
          >
            <Repeat className="w-4 h-4" />
            <span className="hidden sm:inline">Suscripciones</span>
          </button>
          <button
            onClick={() => { setShowForm(true); setShowRecurrentes(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95 shadow-lg shadow-blue-900/50"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>
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
            <div className="grid grid-cols-5 gap-2">              {CATEGORIAS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCategoria(c.id); setDescripcion(''); }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                      categoria === c.id
                        ? 'border'
                        : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                    }`}
                    style={categoria === c.id ? { backgroundColor: c.colorBg, borderColor: c.color } : {}}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-[10px] text-gray-400">{c.label.split(' ')[0]}</span>
                  </button>
                ))}
            </div>
            {/* Subcategorías */}
            {subcategorias && subcategorias.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-1.5">
                  {subcategorias.map(sub => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setDescripcion(sub.label)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        descripcion === sub.label
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-700/50'
                          : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700/50'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
          const cat = getCategoria(catId);
          const subtotal = items.reduce((s, g) => s + g.monto, 0);
          return (              <div key={catId}>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: cat.color }}>
                  {cat.icon} {cat.label}
                </span>
                <span className="text-xs font-medium" style={{ color: cat.color }}>${subtotal.toLocaleString('es-CL')}</span>
              </div>
              <div className="space-y-1">
                {items.map(g => (
                  <div key={g.id} className="stagger-enter flex items-center justify-between rounded-xl px-4 py-3 border border-gray-800/50 hover:border-gray-700/50 transition-colors group" style={{ backgroundColor: cat.colorBg }}>
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

      {/* Sección de Gastos Recurrentes - Modal */}
      {showRecurrentes && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowRecurrentes(false)}>
          <div className="fixed inset-0 bg-black/60" />
          <div
            className="relative w-full sm:max-w-lg max-h-[85vh] overflow-y-auto bg-gray-900 rounded-t-2xl sm:rounded-2xl p-5 border border-gray-800 animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Repeat className="w-4 h-4 text-purple-400" />
                Gastos Recurrentes
              </h3>
              <button onClick={() => setShowRecurrentes(false)} className="p-1 rounded-lg hover:bg-gray-800">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Estos gastos se agregan automáticamente cada mes (suscripciones, arriendo, cuentas fijas).
            </p>

            {/* Lista de recurrentes */}
            {recurrentes.length > 0 && (
              <div className="space-y-2 mb-4">
                {recurrentes.map(r => {
                  const cat = getCategoria(r.categoria);
                  return (
                    <div key={r.id} className="flex items-center justify-between bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-700/50 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span style={{ color: cat.color }}>{cat.icon}</span>
                          <p className="text-sm font-medium text-white truncate">{r.descripcion}</p>
                        </div>
                        <p className="text-xs text-gray-500">Día {r.diaMes} · ${r.monto.toLocaleString('es-CL')}/mes</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleRecurrente(r.id, !r.activo)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                            r.activo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700/50 text-gray-500'
                          }`}
                        >
                          {r.activo ? 'Activo' : 'Pausado'}
                        </button>
                        <button
                          onClick={() => handleDeleteRecurrente(r.id)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {recurrentes.length === 0 && !showRecForm && (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">No tienes gastos recurrentes configurados.</p>
              </div>
            )}

            {/* Formulario nuevo recurrente */}
            {showRecForm ? (
              <form onSubmit={handleAddRecurrente} className="space-y-3 border-t border-gray-800 pt-4">
                <h4 className="text-xs font-semibold text-gray-400">Nuevo gasto recurrente</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Monto ($)</label>
                    <input type="number" value={recMonto} onChange={e => setRecMonto(e.target.value)} placeholder="19990" required className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Día del mes</label>
                    <input type="number" value={recDiaMes} onChange={e => setRecDiaMes(e.target.value)} placeholder="1" min={1} max={28} required className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Categoría</label>
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {CATEGORIAS.map(c => (
                      <button key={c.id} type="button" onClick={() => { setRecCategoria(c.id); setRecDescripcion(''); }}
                        className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-[10px] transition-all ${recCategoria === c.id ? 'border' : 'bg-gray-800 border border-gray-700'}`}
                        style={recCategoria === c.id ? { backgroundColor: c.colorBg, borderColor: c.color, color: c.color } : { color: '#9ca3af' }}
                      >
                        <span>{c.icon}</span>
                      </button>
                    ))}
                  </div>
                  {/* Subcategorías */}
                  {recSubcategorias && recSubcategorias.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {recSubcategorias.map(sub => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setRecDescripcion(sub.label)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                            recDescripcion === sub.label
                              ? 'bg-purple-600/20 text-purple-400 border border-purple-700/50'
                              : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700/50'
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                    <input type="text" value={recDescripcion} onChange={e => setRecDescripcion(e.target.value)} placeholder="Ej: Netflix" className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                    <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
                      <button type="button" onClick={() => setRecTipo('personal')} className={`px-3 py-2 rounded-lg text-xs font-medium ${recTipo === 'personal' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Personal</button>
                      <button type="button" onClick={() => setRecTipo('familiar')} className={`px-3 py-2 rounded-lg text-xs font-medium ${recTipo === 'familiar' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>Familiar</button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:from-purple-700 hover:to-pink-700 transition-all active:scale-95">
                    Agregar Suscripción
                  </button>
                  <button type="button" onClick={() => setShowRecForm(false)} className="px-4 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm hover:bg-gray-700">Cancelar</button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowRecForm(true)}
                className="w-full py-2.5 rounded-xl bg-purple-600/20 text-purple-400 text-sm font-medium hover:bg-purple-600/30 transition-all border border-purple-800/30 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Suscripción
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
