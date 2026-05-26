import { useState, useEffect } from 'react';
import { Clock, Plus, X, Trash2, Calculator, FileText, RefreshCw, DollarSign } from 'lucide-react';
import { getLiquidaciones } from '../utils/storage';
import { calcularValorHoraDesdeSueldo } from '../utils/reciboParser';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function CalculadoraHorasExtras() {
  const [valorHora, setValorHora] = useState('');
  const [valorHoraDesdeLiq, setValorHoraDesdeLiq] = useState(false);
  const [valorHoraDesdeSueldo, setValorHoraDesdeSueldo] = useState(false);
  const [entradas, setEntradas] = useState<{ horas: number; fecha: string; descripcion: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [horas, setHoras] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');

  // Configuración
  const [recargo, setRecargo] = useState('50'); // 50% por defecto
  const [horasSemanales, setHorasSemanales] = useState('44'); // 44h = jornada completa estándar

  // Última liquidación (con o sin HE)
  const ultimaLiq = getLiquidaciones()
    .sort((a, b) => {
      if (a.anio !== b.anio) return b.anio - a.anio;
      return b.mes - a.mes;
    })[0];

  // Última liquidación con horas extras
  const ultimaLiqConHE = getLiquidaciones()
    .filter(l => l.detalleHorasExtras && l.detalleHorasExtras.valorHora > 0)
    .sort((a, b) => {
      if (a.anio !== b.anio) return b.anio - a.anio;
      return b.mes - a.mes;
    })[0];

  // Auto-cargar valor hora: primero intentar desde detalleHorasExtras,
  // si no, calcular desde sueldo base automáticamente
  useEffect(() => {
    if (valorHora) return; // ya hay un valor
    
    if (ultimaLiqConHE?.detalleHorasExtras?.valorHora) {
      setValorHora(ultimaLiqConHE.detalleHorasExtras.valorHora.toString());
      setValorHoraDesdeLiq(true);
    } else if (ultimaLiq?.sueldoBase && ultimaLiq.sueldoBase > 0) {
      // Calcular desde sueldo base (fórmula chilena)
      const hs = parseFloat(horasSemanales) || 44;
      const calculado = calcularValorHoraDesdeSueldo(ultimaLiq.sueldoBase, hs);
      if (calculado > 0) {
        setValorHora(Math.round(calculado).toString());
        setValorHoraDesdeSueldo(true);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar valor hora desde la liquidación (manual - desde detalle)
  const handleValorHoraFromLiq = () => {
    if (ultimaLiqConHE?.detalleHorasExtras?.valorHora) {
      setValorHora(ultimaLiqConHE.detalleHorasExtras.valorHora.toString());
      setValorHoraDesdeLiq(true);
      setValorHoraDesdeSueldo(false);
    }
  };

  // Calcular valor hora desde sueldo base (manual)
  const handleCalcularDesdeSueldo = () => {
    if (ultimaLiq?.sueldoBase && ultimaLiq.sueldoBase > 0) {
      const hs = parseFloat(horasSemanales) || 44;
      const calculado = calcularValorHoraDesdeSueldo(ultimaLiq.sueldoBase, hs);
      if (calculado > 0) {
        setValorHora(Math.round(calculado).toString());
        setValorHoraDesdeSueldo(true);
        setValorHoraDesdeLiq(false);
      }
    }
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Valor hora normal ($)</label>
            <input
              type="number"
              value={valorHora}
              onChange={e => setValorHora(e.target.value)}
              placeholder="5000"
              min={0}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg font-bold placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <div className="flex flex-wrap items-center gap-1 mt-1">
              <button
                onClick={handleValorHoraFromLiq}
                className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                title="Cargar desde detalle de HH.EE. de la liquidación"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Desde liquidación
              </button>
              <span className="text-[10px] text-gray-600">|</span>
              <button
                onClick={handleCalcularDesdeSueldo}
                className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                title="Calcular desde sueldo base (fórmula chilena)"
              >
                <DollarSign className="w-2.5 h-2.5" />
                Desde sueldo base
              </button>
            </div>
            {valorHoraDesdeLiq && (
              <span className="mt-0.5 text-[10px] text-emerald-400 flex items-center gap-1">
                ✓ Auto-cargado desde liquidación
              </span>
            )}
            {valorHoraDesdeSueldo && (
              <span className="mt-0.5 text-[10px] text-emerald-400 flex items-center gap-1">
                ✓ Calculado desde sueldo base (fórmula chilena)
              </span>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Jornada</label>
            <select
              value={horasSemanales}
              onChange={e => { setHorasSemanales(e.target.value); setValorHoraDesdeSueldo(false); }}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-lg font-bold focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="44">44h (actual)</option>
              <option value="42">42h (próximamente)</option>
              <option value="40">40h</option>
              <option value="45">45h</option>
            </select>
            <p className="mt-1 text-[10px] text-gray-500">
              {parseFloat(horasSemanales) * 4}h mensuales · {parseFloat(horasSemanales) > 0 ? 'Jornada ' + horasSemanales + 'h/sem' : ''}
            </p>
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
              En Chile, recargo mínimo del 50%
            </p>
          </div>
        </div>
        {valorHoraNum > 0 && (
          <div className="bg-blue-600/10 border border-blue-800/30 rounded-xl p-3 space-y-1.5">
            <p className="text-xs text-gray-400">
              Valor hora extra:{' '}
              <span className="text-blue-400 font-bold text-sm">${valorHoraExtra.toLocaleString('es-CL')}</span>
              {' '}({valorHoraNum.toLocaleString('es-CL')} + {recargoNum}%)
            </p>
            <div className="text-[10px] text-gray-500 space-y-0.5 border-t border-blue-800/30 pt-1.5 mt-1">
              <p className="text-gray-400 font-medium">📐 Cálculo paso a paso:</p>
              {(() => {
                const hs = parseFloat(horasSemanales) || 44;
                const hm = hs * 4;
                const sb = ultimaLiq?.sueldoBase || 0;
                const diario = Math.round(sb / 30);
                const x28 = Math.round(diario * 28);
                const vh = Math.round(x28 / hm);
                const vhe = Math.round(vh * (1 + recargoNum / 100));
                return (<>
                  <p>① sueldoBase ÷ 30 = <span className="text-blue-300">${sb.toLocaleString('es-CL')} / 30 = ${diario.toLocaleString('es-CL')}</span></p>
                  <p>② × 28 = <span className="text-blue-300">${diario.toLocaleString('es-CL')} × 28 = ${x28.toLocaleString('es-CL')}</span></p>
                  <p>③ ÷ horasMensuales ({hs}h × 4 = {hm}h) = <span className="text-blue-300">${x28.toLocaleString('es-CL')} / {hm} = ${vh.toLocaleString('es-CL')}</span></p>
                  <p>④ × recargo ({recargoNum}%) = <span className="text-orange-400 font-semibold">${vh.toLocaleString('es-CL')} × 1.{recargoNum} = ${vhe.toLocaleString('es-CL')}</span></p>
                </>);
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Resumen de horas extras desde la última liquidación */}
      {ultimaLiqConHE?.detalleHorasExtras && (
        <div className="bg-gradient-to-r from-blue-600/10 to-indigo-900/10 border border-blue-800/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">HH.EE. desde Liquidación</h3>
            </div>
            <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-1 rounded-lg">
              {MESES[ultimaLiqConHE.mes - 1]} {ultimaLiqConHE.anio}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/50 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-gray-500 mb-0.5">Cantidad</p>
              <p className="text-sm font-bold text-white">
                {ultimaLiqConHE.detalleHorasExtras.cantidad}h
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-gray-500 mb-0.5">Valor Hora</p>
              <p className="text-sm font-bold text-blue-400">
                ${ultimaLiqConHE.detalleHorasExtras.valorHora.toLocaleString('es-CL')}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-gray-500 mb-0.5">Total</p>
              <p className="text-sm font-bold text-orange-400">
                ${ultimaLiqConHE.detalleHorasExtras.total.toLocaleString('es-CL')}
              </p>
            </div>
          </div>
        </div>
      )}

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
