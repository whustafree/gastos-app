import { useState } from 'react';
import { Plus, X, TrendingUp, AlertTriangle, CircleCheck, PiggyBank } from 'lucide-react';
import { getPresupuestos, setPresupuesto, getEstadoPresupuestos } from '../utils/storage';
import { CATEGORIAS, getCategoria } from '../utils/categorias';

export default function Presupuestos() {
  const ahora = new Date();
  const [mes] = useState(ahora.getMonth() + 1);
  const [anio] = useState(ahora.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [selCategoria, setSelCategoria] = useState('');
  const [montoLimite, setMontoLimite] = useState('');

  const estados = getEstadoPresupuestos(mes, anio);
  const presupuestos = getPresupuestos(mes, anio);
  const categoriasSinPresupuesto = CATEGORIAS.filter(
    c => !presupuestos.some(p => p.categoria === c.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(montoLimite);
    if (!selCategoria || isNaN(monto) || monto <= 0) return;

    setPresupuesto({ categoria: selCategoria, montoLimite: monto, mes, anio });
    setSelCategoria('');
    setMontoLimite('');
    setShowForm(false);
  };

  const totalPresupuestado = presupuestos.reduce((s, p) => s + p.montoLimite, 0);
  const totalGastado = estados.reduce((s, e) => s + e.gastado, 0);
  const excedidos = estados.filter(e => e.excedido).length;
  const enAlerta = estados.filter(e => e.alerta && !e.excedido).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Presupuestos Mensuales</h2>
        <p className="text-sm text-gray-500">
          Define límites de gasto por categoría y controla tu presupuesto
        </p>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Presupuestado</p>
          <p className="text-lg font-bold text-white">${totalPresupuestado.toLocaleString('es-CL')}</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Gastado</p>
          <p className={`text-lg font-bold ${totalGastado > totalPresupuestado ? 'text-red-400' : 'text-emerald-400'}`}>
            ${totalGastado.toLocaleString('es-CL')}
          </p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Saldo</p>
          <p className={`text-lg font-bold ${(totalPresupuestado - totalGastado) < 0 ? 'text-red-400' : 'text-blue-400'}`}>
            ${(totalPresupuestado - totalGastado).toLocaleString('es-CL')}
          </p>
        </div>
      </div>

      {/* Alertas */}
      {(excedidos > 0 || enAlerta > 0) && (
        <div className="space-y-2">
          {excedidos > 0 && (
            <div className="bg-red-600/10 border border-red-800/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">
                <strong>{excedidos}</strong> categoría{excedidos > 1 ? 's' : ''} excedió el presupuesto este mes
              </p>
            </div>
          )}
          {enAlerta > 0 && (
            <div className="bg-orange-600/10 border border-orange-800/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-orange-400 shrink-0" />
              <p className="text-sm text-orange-300">
                <strong>{enAlerta}</strong> categoría{enAlerta > 1 ? 's' : ''} al {Math.round(80)}% o más del presupuesto
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lista de presupuestos por categoría */}
      {estados.length > 0 ? (
        <div className="space-y-2">
          {estados.map(est => {
            const cat = getCategoria(est.categoria);
            return (
              <div key={est.categoria} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{cat.label}</p>
                      {est.excedido && (
                        <span className="text-[10px] text-red-400 font-medium">Excedido</span>
                      )}
                      {est.alerta && !est.excedido && (
                        <span className="text-[10px] text-orange-400 font-medium">Alerta</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">${est.limite.toLocaleString('es-CL')}</p>
                    <p className={`text-[10px] ${est.gastado > est.limite ? 'text-red-400' : 'text-gray-500'}`}>
                      ${est.gastado.toLocaleString('es-CL')} gastado
                    </p>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      est.excedido ? 'bg-red-500' : est.alerta ? 'bg-orange-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(est.porcentaje, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[10px] ${est.excedido ? 'text-red-400' : est.alerta ? 'text-orange-400' : 'text-gray-500'}`}>
                    {Math.round(est.porcentaje)}% utilizado
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {est.restante > 0
                      ? `Restan $${est.restante.toLocaleString('es-CL')}`
                      : `Exceso $${Math.abs(est.restante).toLocaleString('es-CL')}`
                    }
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
          <PiggyBank className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">Sin presupuestos</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Define un presupuesto mensual para cada categoría y controla tus gastos.
          </p>
        </div>
      )}

      {/* Botón agregar presupuesto */}
      <button
        onClick={() => setShowForm(true)}
        disabled={categoriasSinPresupuesto.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/50"
      >
        <Plus className="w-4 h-4" />
        Agregar Presupuesto
      </button>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-400">Nuevo presupuesto</h4>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-800">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Categoría</label>
            <select
              value={selCategoria}
              onChange={e => setSelCategoria(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Seleccionar...</option>
              {categoriasSinPresupuesto.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Límite mensual ($)</label>
            <input
              type="number"
              value={montoLimite}
              onChange={e => setMontoLimite(e.target.value)}
              placeholder="100000"
              min={1}
              required
              className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg font-bold placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95"
          >
            Guardar Presupuesto
          </button>
        </form>
      )}

      {/* Sugerencia de ahorro */}
      {totalPresupuestado > 0 && (
        <div className="bg-gradient-to-r from-emerald-600/10 to-teal-900/10 border border-emerald-800/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CircleCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Resumen del Mes</h3>
          </div>
          <div className="space-y-1 text-xs text-gray-400">
            <p>
              Has presupuestado <span className="text-white font-medium">${totalPresupuestado.toLocaleString('es-CL')}</span> en {presupuestos.length} categoría{presupuestos.length !== 1 ? 's' : ''}.
            </p>
            {totalGastado <= totalPresupuestado && totalPresupuestado > 0 && (
              <p className="text-emerald-400">
                Vas bien — llevas el {Math.round((totalGastado / totalPresupuestado) * 100)}% del presupuesto gastado.
              </p>
            )}
            {totalGastado > totalPresupuestado && (
              <p className="text-red-400">
                Has excedido el presupuesto en un {Math.round(((totalGastado - totalPresupuestado) / totalPresupuestado) * 100)}%.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
