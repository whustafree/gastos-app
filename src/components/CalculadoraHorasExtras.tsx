import { useState } from 'react';
import { Clock, Plus, X, Trash2, Calculator } from 'lucide-react';

export default function CalculadoraHorasExtras() {
  const [valorHora, setValorHora] = useState('');
  const [valorHoraStr, setValorHoraStr] = useState('');
  const [entradas, setEntradas] = useState<{ horas: number; fecha: string; descripcion: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [horas, setHoras] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');

  // Configuración
  const [recargo, setRecargo] = useState('50'); // 50% por defecto

  // Cargar valor hora desde la liquidación si está disponible
  const handleValorHoraFromLiq = () => {
    try {
      const liquidaciones = JSON.parse(localStorage.getItem('gastos-app-liquidaciones') || '[]');
      const ultima = liquidaciones[liquidaciones.length - 1];
      if (ultima?.detalleHorasExtras?.valorHora) {
        setValorHora(ultima.detalleHorasExtras.valorHora.toString());
      }
    } catch {}
  };

  const valorHoraNum = parseFloat(valorHora) || 0;
  const recargoNum = parseFloat(recargo) || 50;
  const valorHoraExtra = valorHoraNum * (1 + recargoNum / 100);

  const totalHoras = entradas.reduce((s, e) => s + e.horas, 0);
  const totalPagar = totalHoras * valorHoraExtra;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(horas);
    if (isNaN(h) || h <= 0) return;
    setEntradas(prev => [...prev, { horas: h, fecha, descripcion: descripcion || 'Horas extras' }]);
    setHoras('');
    setDescripcion('');
    setShowForm(false);
  };

  const handleDelete = (i: number) => {
    setEntradas(prev => prev.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Calculadora de Horas Extras</h2>
        <p className="text-sm text-gray-500">
          Calcula cuánto ganarás según tus horas extras y el valor de tu hora
        </p>
      </div>

      {/* Configuración */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-400" />
          Configuración
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Valor hora normal ($)</label>
            <input
              type="number"
              value={valorHora}
              onChange={e => setValorHora(e.target.value)}
              placeholder="5000"
              min={0}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg font-bold placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={handleValorHoraFromLiq}
              className="mt-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              📄 Cargar desde última liquidación
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Recargo (%)</label>
            <input
              type="number"
              value={recargo}
              onChange={e => setRecargo(e.target.value)}
              placeholder="50"
              min={0}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg font-bold placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="mt-1 text-[10px] text-gray-500">
              En Chile, las horas extras tienen un recargo mínimo del 50%
            </p>
          </div>
        </div>
        {valorHoraNum > 0 && (
          <div className="bg-blue-600/10 border border-blue-800/30 rounded-xl p-3">
            <p className="text-xs text-gray-400">
              Valor hora extra:{' '}
              <span className="text-blue-400 font-bold text-sm">${valorHoraExtra.toLocaleString('es-CL')}</span>
              {' '}({valorHoraNum.toLocaleString('es-CL')} + {recargoNum}%)
            </p>
          </div>
        )}
      </div>

      {/* Agregar horas */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Registro de Horas {entradas.length > 0 && <span className="text-gray-500 font-normal">({totalHoras}h)</span>}
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold text-sm hover:from-orange-700 hover:to-red-700 transition-all active:scale-95 shadow-lg shadow-orange-900/50"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-400">Nuevo registro</h4>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-800">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Horas</label>
              <input
                type="number"
                value={horas}
                onChange={e => setHoras(e.target.value)}
                placeholder="2"
                min={0}
                step={0.5}
                required
                className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold text-sm hover:from-orange-700 hover:to-red-700 transition-all active:scale-95"
          >
            Agregar
          </button>
        </form>
      )}

      {/* Lista de horas */}
      {entradas.length > 0 ? (
        <div className="space-y-1">
          {entradas.map((entry, i) => (
            <div key={i} className="stagger-enter flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3 border border-gray-800/50 group">
              <div>
                <p className="text-sm font-medium text-white">{entry.descripcion}</p>
                <p className="text-xs text-gray-500">{new Date(entry.fecha).toLocaleDateString('es-CL')}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-orange-400">{entry.horas}h</p>
                  <p className="text-xs text-gray-500">${(entry.horas * valorHoraExtra).toLocaleString('es-CL')}</p>
                </div>
                <button
                  onClick={() => handleDelete(i)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
          <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">Sin registros</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Agrega las horas extras que hiciste este mes para calcular cuánto ganarás.
          </p>
        </div>
      )}

      {/* Total */}
      {totalHoras > 0 && (
        <div className="bg-gradient-to-br from-orange-600/20 to-red-900/20 rounded-2xl p-5 border border-orange-800/30">
          <p className="text-xs text-gray-500 mb-1">Total estimado horas extras</p>
          <p className="text-2xl font-bold text-white">${totalPagar.toLocaleString('es-CL')}</p>
          <p className="text-xs text-gray-500 mt-1">
            {totalHoras}h × ${valorHoraExtra.toLocaleString('es-CL')}/hora
          </p>
        </div>
      )}
    </div>
  );
}
