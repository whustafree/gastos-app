import { useState, useEffect } from 'react';
import {
  Clock, Plus, X, Trash2, Calculator, FileText,
  RefreshCw, DollarSign, ToggleLeft, ToggleRight, Info,
} from 'lucide-react';
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
  const [recargo, setRecargo] = useState('50');
  const [horasSemanales, setHorasSemanales] = useState('44');
  const [mostrarValorExtra, setMostrarValorExtra] = useState(false);

  // Última liquidación
  const ultimaLiq = getLiquidaciones()
    .sort((a, b) => {
      if (a.anio !== b.anio) return b.anio - a.anio;
      return b.mes - a.mes;
    })[0];

  const ultimaLiqConHE = getLiquidaciones()
    .filter(l => l.detalleHorasExtras && l.detalleHorasExtras.valorHora > 0)
    .sort((a, b) => {
      if (a.anio !== b.anio) return b.anio - a.anio;
      return b.mes - a.mes;
    })[0];

  useEffect(() => {
    if (valorHora) return;
    if (ultimaLiqConHE?.detalleHorasExtras?.valorHora) {
      setValorHora(ultimaLiqConHE.detalleHorasExtras.valorHora.toString());
      setValorHoraDesdeLiq(true);
    } else if (ultimaLiq?.sueldoBase && ultimaLiq.sueldoBase > 0) {
      const hs = parseFloat(horasSemanales) || 44;
      const calculado = calcularValorHoraDesdeSueldo(ultimaLiq.sueldoBase, hs);
      if (calculado > 0) {
        setValorHora(Math.round(calculado).toString());
        setValorHoraDesdeSueldo(true);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleValorHoraFromLiq = () => {
    if (ultimaLiqConHE?.detalleHorasExtras?.valorHora) {
      setValorHora(ultimaLiqConHE.detalleHorasExtras.valorHora.toString());
      setValorHoraDesdeLiq(true);
      setValorHoraDesdeSueldo(false);
    }
  };

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
  const recargoMultiplicador = 1 + recargoNum / 100;
  const valorHoraExtra = valorHoraNum * recargoMultiplicador;

  const totalHoras = entradas.reduce((s, e) => s + e.horas, 0);
  const totalPagar = totalHoras * valorHoraExtra;

  const hsSemanales = parseFloat(horasSemanales) || 44;
  const horasMensuales = hsSemanales * 4;
  const sb = ultimaLiq?.sueldoBase || 0;

  // Cálculos paso a paso (fórmula chilena)
  const pasoDiario = sb > 0 ? Math.round(sb / 30) : 0;
  const paso28 = pasoDiario > 0 ? Math.round(pasoDiario * 28) : 0;
  const vhCalculado = paso28 > 0 ? Math.round(paso28 / horasMensuales) : 0;

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

      {/* ⚙️ Configuración */}
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
              <button onClick={handleValorHoraFromLiq} className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1" title="Cargar desde detalle de HH.EE. de la liquidación">
                <RefreshCw className="w-2.5 h-2.5" />
                Desde liquidación
              </button>
              <span className="text-[10px] text-gray-600">|</span>
              <button onClick={handleCalcularDesdeSueldo} className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1" title="Calcular desde sueldo base (fórmula chilena)">
                <DollarSign className="w-2.5 h-2.5" />
                Desde sueldo base
              </button>
            </div>
            {valorHoraDesdeLiq && <span className="mt-0.5 text-[10px] text-emerald-400 flex items-center gap-1">✓ Auto-cargado desde liquidación</span>}
            {valorHoraDesdeSueldo && <span className="mt-0.5 text-[10px] text-emerald-400 flex items-center gap-1">✓ Calculado desde sueldo base (fórmula chilena)</span>}
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
            <p className="mt-1 text-[10px] text-gray-500">{horasMensuales}h mensuales · Jornada {hsSemanales}h/sem</p>
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
            <p className="mt-1 text-[10px] text-gray-500">En Chile, recargo mínimo del 50%</p>
          </div>
        </div>
      </div>

      {/* 💰 Valor Unitario */}
      {valorHoraNum > 0 && (
        <div className="bg-gradient-to-br from-blue-600/20 to-indigo-900/20 border border-blue-800/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Valor Unitario</h3>
            <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
              Cuánto vale 1 sola hora
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Hora Normal */}
            <div className="bg-gray-900/60 rounded-xl p-4 border border-blue-800/20">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Hora Normal</p>
              <p className="text-3xl font-bold text-white mb-2">
                ${Math.round(valorHoraNum).toLocaleString('es-CL')}
                <span className="text-sm text-gray-500 font-normal ml-1">/hora</span>
              </p>
              {sb > 0 && pasoDiario > 0 && (
                <div className="text-[10px] text-gray-500 space-y-0.5 bg-gray-800/50 rounded-lg p-2.5">
                  <p className="text-gray-400 font-medium mb-1">Fórmula: sueldoBase ÷ 30 × 28 ÷ horasMensuales</p>
                  <p>① <span className="text-blue-300">${sb.toLocaleString('es-CL')}</span> ÷ 30 = <span className="text-blue-300">${pasoDiario.toLocaleString('es-CL')}</span></p>
                  <p>② <span className="text-blue-300">${pasoDiario.toLocaleString('es-CL')}</span> × 28 = <span className="text-blue-300">${paso28.toLocaleString('es-CL')}</span></p>
                  <p>③ <span className="text-blue-300">${paso28.toLocaleString('es-CL')}</span> ÷ {horasMensuales}h = <span className="text-blue-300">${vhCalculado.toLocaleString('es-CL')}</span></p>
                  {vhCalculado > 0 && vhCalculado !== valorHoraNum && (
                    <p className="text-[9px] text-gray-600 mt-1">* Usando tu valor manual: ${Math.round(valorHoraNum).toLocaleString('es-CL')}/h</p>
                  )}
                </div>
              )}
              {sb === 0 && (
                <div className="text-[10px] text-gray-500 bg-gray-800/50 rounded-lg p-2.5">
                  <p>Ingresa un sueldo base en <span className="text-blue-400">Liquidación de Sueldo</span> para ver la fórmula completa.</p>
                </div>
              )}
            </div>

            {/* Hora Extra */}
            <div className="bg-gray-900/60 rounded-xl p-4 border border-orange-800/30">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Hora Extra <span className="text-orange-400">(+{recargoNum}% recargo)</span></p>
              <p className="text-3xl font-bold text-orange-400 mb-2">
                ${Math.round(valorHoraExtra).toLocaleString('es-CL')}
                <span className="text-sm text-gray-500 font-normal ml-1">/hora</span>
              </p>
              <div className="text-[10px] text-gray-500 space-y-0.5 bg-gray-800/50 rounded-lg p-2.5">
                <p className="text-gray-400 font-medium mb-1">Fórmula: hora normal × (1 + {recargoNum}%)</p>
                <p>
                  <span className="text-blue-300">${Math.round(valorHoraNum).toLocaleString('es-CL')}</span>
                  {' '}×{' '}
                  <span className="text-orange-300">{recargoMultiplicador}</span>
                  {' '}= <span className="text-orange-400 font-semibold">${Math.round(valorHoraExtra).toLocaleString('es-CL')}</span>
                </p>
                <p className="text-gray-600 mt-1">
                  Cada hora extra que trabajes vale{' '}
                  <span className="text-orange-400 font-semibold">${Math.round(valorHoraExtra).toLocaleString('es-CL')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📄 HH.EE. desde Liquidación */}
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
          <div className="flex items-center justify-end gap-2 mb-2">
            <button onClick={() => setMostrarValorExtra(false)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${!mostrarValorExtra ? 'bg-blue-600/20 text-blue-400 border border-blue-700/40' : 'bg-gray-800 text-gray-500 border border-gray-700/30 hover:text-gray-400'}`}>
              <ToggleLeft className="w-3 h-3" />
              Normal
            </button>
            <button onClick={() => setMostrarValorExtra(true)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${mostrarValorExtra ? 'bg-orange-600/20 text-orange-400 border border-orange-700/40' : 'bg-gray-800 text-gray-500 border border-gray-700/30 hover:text-gray-400'}`}>
              <ToggleRight className="w-3 h-3" />
              +{recargoNum}% extra
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/50 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-gray-500 mb-0.5">Cantidad</p>
              <p className="text-sm font-bold text-white">{ultimaLiqConHE.detalleHorasExtras.cantidad}h</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-gray-500 mb-0.5">{mostrarValorExtra ? 'Valor Hora Extra' : 'Valor Hora Normal'}</p>
              <p className={`text-sm font-bold ${mostrarValorExtra ? 'text-orange-400' : 'text-blue-400'}`}>
                ${Math.round(mostrarValorExtra
                  ? ultimaLiqConHE.detalleHorasExtras.valorHora * recargoMultiplicador
                  : ultimaLiqConHE.detalleHorasExtras.valorHora
                ).toLocaleString('es-CL')}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-gray-500 mb-0.5">Total</p>
              <p className="text-sm font-bold text-orange-400">${Math.round(ultimaLiqConHE.detalleHorasExtras.total).toLocaleString('es-CL')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ➕ Registro de Horas */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Registro de Horas {entradas.length > 0 && <span className="text-gray-500 font-normal">({totalHoras}h)</span>}
        </h3>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold text-sm hover:from-orange-700 hover:to-red-700 transition-all active:scale-95 shadow-lg shadow-orange-900/50">
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
              <input type="number" value={horas} onChange={e => setHoras(e.target.value)} placeholder="2" min={0} step={0.5} required className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors" autoFocus />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descripción</label>
              <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Opcional" className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold text-sm hover:from-orange-700 hover:to-red-700 transition-all active:scale-95">
            Agregar
          </button>
        </form>
      )}

      {/* 📋 Lista */}
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
                  <p className="text-xs text-gray-500">${Math.round(entry.horas * valorHoraExtra).toLocaleString('es-CL')}</p>
                </div>
                <button onClick={() => handleDelete(i)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all">
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

      {/* 💵 Valor Total */}
      {totalHoras > 0 && (
        <div className="bg-gradient-to-br from-orange-600/20 to-red-900/20 border border-orange-800/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-white">Valor Total</h3>
            <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
              El pago completo por tus horas
            </span>
          </div>

          <div className="bg-gray-900/60 rounded-xl p-4 border border-orange-800/20 mb-3">
            <div className="flex items-baseline justify-center gap-2 text-lg mb-2">
              <span className="text-white font-bold text-2xl">{totalHoras}h</span>
              <span className="text-gray-500">×</span>
              <span className="text-orange-400 font-bold text-2xl">${Math.round(valorHoraExtra).toLocaleString('es-CL')}</span>
              <span className="text-gray-500">=</span>
              <span className="text-white font-bold text-3xl">${Math.round(totalPagar).toLocaleString('es-CL')}</span>
            </div>
            <div className="text-[10px] text-gray-500 bg-gray-800/50 rounded-lg p-2.5 space-y-0.5">
              <p className="text-gray-400 font-medium mb-1">Desglose:</p>
              <p>
                Cantidad de horas: <span className="text-white">{totalHoras}h</span>
              </p>
              <p>
                Valor hora extra (+{recargoNum}%): <span className="text-orange-400">${Math.round(valorHoraExtra).toLocaleString('es-CL')}/h</span>
              </p>
              <p className="border-t border-gray-700/50 pt-1 mt-1">
                Total = {totalHoras}h × ${Math.round(valorHoraExtra).toLocaleString('es-CL')} ={' '}
                <span className="text-orange-400 font-semibold">${Math.round(totalPagar).toLocaleString('es-CL')}</span>
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Total bruto a recibir</p>
            <p className="text-3xl font-bold text-white">${Math.round(totalPagar).toLocaleString('es-CL')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
