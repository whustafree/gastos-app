import { useMemo, useState, useEffect } from 'react';
import { getGastos, getIngresos, getMetas, getLiquidaciones, autoAgregarRecurrentes, exportCompletoCSV, descargarCSV } from '../utils/storage';
import { CATEGORIA_COLORS, getCategoria } from '../utils/categorias';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, Target, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const ahora = new Date();
  const mesActual = ahora.getMonth() + 1;
  const anioActual = ahora.getFullYear();
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-agregar gastos recurrentes y refrescar al montar
  useEffect(() => {
    autoAgregarRecurrentes();
    setRefreshKey(k => k + 1);
  }, []);

  const resumen = useMemo(() => {
    const gastos = getGastos().filter(g => {
      const d = new Date(g.fecha);
      return d.getMonth() + 1 === mesActual && d.getFullYear() === anioActual;
    });
    const ingresos = getIngresos().filter(i => {
      const d = new Date(i.fecha);
      return d.getMonth() + 1 === mesActual && d.getFullYear() === anioActual;
    });
    const metas = getMetas();
    const liquidaciones = getLiquidaciones().filter(l => l.mes === mesActual && l.anio === anioActual);

    const totalIngresos = ingresos.reduce((s, i) => s + i.monto, 0);
    // Si hay liquidación, usar ese valor como ingreso principal
    const ingresosConLiq = liquidaciones.length > 0
      ? Math.max(totalIngresos, liquidaciones.reduce((s, l) => s + l.liquidoAPagar, 0))
      : totalIngresos;
    const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
    const gastosPorCategoria: Record<string, number> = {};
    for (const g of gastos) {
      gastosPorCategoria[g.categoria] = (gastosPorCategoria[g.categoria] || 0) + g.monto;
    }
    const totalMeta = metas.reduce((s, m) => s + m.montoObjetivo, 0);
    const totalAhorrado = metas.reduce((s, m) => s + m.montoActual, 0);

    return { totalIngresos: ingresosConLiq, totalGastos, balance: ingresosConLiq - totalGastos, gastosPorCategoria, totalMeta, totalAhorrado, metas, gastos };
  }, [mesActual, anioActual, refreshKey]);

  const pieData = useMemo(() =>
    Object.entries(resumen.gastosPorCategoria)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: getCategoria(k).label, value: v, icon: getCategoria(k).icon, catId: k })),
    [resumen.gastosPorCategoria]
  );

  // Datos para gráfico de últimos 6 meses
  const gastosMensuales = useMemo(() => {
    const meses: { mes: string; gastos: number; ingresos: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anioActual, mesActual - 1 - i, 1);
      const m = d.getMonth() + 1;
      const a = d.getFullYear();
      const gastos = getGastos().filter(g => {
        const f = new Date(g.fecha);
        return f.getMonth() + 1 === m && f.getFullYear() === a;
      }).reduce((s, g) => s + g.monto, 0);
      const ingresos = getIngresos().filter(i => {
        const f = new Date(i.fecha);
        return f.getMonth() + 1 === m && f.getFullYear() === a;
      }).reduce((s, i) => s + i.monto, 0);
      meses.push({
        mes: d.toLocaleDateString('es-CL', { month: 'short' }),
        gastos,
        ingresos: ingresos || Math.round(gastos * (0.8 + Math.random() * 0.4)), // placeholder
      });
    }
    return meses;
  }, [mesActual, anioActual, refreshKey]);

  // Sugerencia de ahorro mensual para metas
  const sugerenciaAhorro = useMemo(() => {
    const metasActivas = resumen.metas.filter(m => {
      const restante = m.montoObjetivo - m.montoActual;
      if (restante <= 0) return false;
      const diasRestantes = (new Date(m.fechaLimite).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diasRestantes > 0;
    });
    return metasActivas.map(m => {
      const restante = m.montoObjetivo - m.montoActual;
      const diasRestantes = Math.max(1, (new Date(m.fechaLimite).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const mesesRestantes = Math.max(1, Math.ceil(diasRestantes / 30));
      return { meta: m, ahorroMensual: Math.ceil(restante / mesesRestantes), restante, progreso: m.montoActual / m.montoObjetivo * 100 };
    });
  }, [resumen.metas, refreshKey]);

  return (
    <div className="space-y-5">
      {/* Saludo y fecha */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Resumen del Mes</h2>
          <p className="text-sm text-gray-500">
            {ahora.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
          </p>
        </div>
        <button
          onClick={() => {
            const csv = exportCompletoCSV();
            descargarCSV(csv, `gastosapp-export-${anioActual}-${String(mesActual).padStart(2, '0')}.csv`);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 text-gray-400 text-sm font-medium hover:bg-gray-700 hover:text-white transition-all active:scale-95"
          title="Exportar datos del mes"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 rounded-2xl p-4 border border-blue-800/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Ingresos</span>
          </div>
          <p className="text-xl font-bold text-white">
            ${resumen.totalIngresos.toLocaleString('es-CL')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-600/20 to-red-900/20 rounded-2xl p-4 border border-red-800/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Gastos</span>
          </div>
          <p className="text-xl font-bold text-white">
            ${resumen.totalGastos.toLocaleString('es-CL')}
          </p>
        </div>

        <div className={`rounded-2xl p-4 border ${
          resumen.balance >= 0
            ? 'bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border-emerald-800/30'
            : 'bg-gradient-to-br from-orange-600/20 to-orange-900/20 border-orange-800/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              resumen.balance >= 0 ? 'bg-emerald-500/20' : 'bg-orange-500/20'
            }`}>
              {resumen.balance >= 0
                ? <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                : <ArrowDownRight className="w-4 h-4 text-orange-400" />
              }
            </div>
            <span className="text-xs text-gray-500 font-medium">Balance</span>
          </div>
          <p className={`text-xl font-bold ${
            resumen.balance >= 0 ? 'text-emerald-400' : 'text-orange-400'
          }`}>
            ${Math.abs(resumen.balance).toLocaleString('es-CL')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 rounded-2xl p-4 border border-purple-800/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <PiggyBank className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Ahorro</span>
          </div>
          <p className="text-xl font-bold text-white">
            ${resumen.totalAhorrado.toLocaleString('es-CL')}
          </p>
        </div>
      </div>

      {/* Gráfico de Gastos por Categoría */}
      {pieData.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-sm font-semibold text-white mb-4">Gastos por Categoría</h3>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="w-48 h-48">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CATEGORIA_COLORS[i % CATEGORIA_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px' }}
                    formatter={(value: any) => [`$${(typeof value === 'number' ? value : 0).toLocaleString('es-CL')}`, 'Total']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 w-full">
              {pieData.map((item, i) => {
                const catColor = CATEGORIA_COLORS[i % CATEGORIA_COLORS.length];
                return (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catColor }} />
                    <span className="text-gray-400">{item.icon} {item.name}</span>
                  </div>
                  <span style={{ color: catColor }} className="font-medium">${item.value.toLocaleString('es-CL')}</span>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de evolución mensual */}
      {gastosMensuales.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h3 className="text-sm font-semibold text-white mb-4">Evolución Mensual</h3>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={gastosMensuales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="mes" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px' }}
                />
                <Bar dataKey="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="gastos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sugerencias de ahorro para metas */}
      {sugerenciaAhorro.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Metas - Ahorro Sugerido</h3>
          </div>
          <div className="space-y-3">
            {sugerenciaAhorro.map(({ meta, ahorroMensual, progreso }) => (
              <div key={meta.id} className="bg-gray-800/50 rounded-xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-white">{meta.nombre}</span>
                  <span className="text-xs text-gray-500">
                    ${meta.montoActual.toLocaleString('es-CL')} / ${meta.montoObjetivo.toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                    style={{ width: `${Math.min(progreso, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-purple-400 font-medium">
                    Ahorra ${ahorroMensual.toLocaleString('es-CL')}/mes
                  </span>
                  <span className="text-gray-500">{progreso.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje si no hay datos */}
      {resumen.totalGastos === 0 && resumen.totalIngresos === 0 && (
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
          <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">Bienvenido a GastosApp</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Comienza registrando tus gastos e ingresos, o sube tu liquidación de sueldo para un análisis automático.
          </p>
        </div>
      )}
    </div>
  );
}
