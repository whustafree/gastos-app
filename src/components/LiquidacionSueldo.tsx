import { useState, useMemo, useCallback } from 'react';
import { getLiquidaciones, addLiquidacion, deleteLiquidacion, addIngreso } from '../utils/storage';
import { parseLiquidacionFromFile, type DatosLiquidacion } from '../utils/reciboParser';
import { FileText, Upload, X, Trash2, Download, Check, Loader2, AlertCircle, Calculator } from 'lucide-react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function LiquidacionSueldo() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [resultado, setResultado] = useState<DatosLiquidacion | null>(null);
  const [archivoNombre, setArchivoNombre] = useState<string>('');

  const liquidaciones = useMemo(() => {
    return getLiquidaciones().sort((a, b) => {
      if (a.anio !== b.anio) return b.anio - a.anio;
      return b.mes - a.mes;
    });
  }, [refreshKey]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.match(/^(application\/pdf|image\/)/)) {
      setMensaje('Formato no soportado. Sube un PDF o imagen.');
      return;
    }

    setParsing(true);
    setMensaje(null);
    setResultado(null);
    setArchivoNombre(file.name);

    try {
      const { datos } = await parseLiquidacionFromFile(file);
      setResultado(datos);

      if (datos.liquidoAPagar > 0) {
        setMensaje(`✅ Liquidación procesada: $${datos.liquidoAPagar.toLocaleString('es-CL')} líquido a pagar`);
      } else {
        setMensaje('⚠️ Se procesó el archivo pero algunos valores no se detectaron automáticamente. Revisa los datos.');
      }
    } catch (err: any) {
      console.error('[Liquidacion] Error al procesar:', err);
      setMensaje(`❌ Error al procesar el archivo: ${err.message}`);
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleGuardarLiquidacion = () => {
    if (!resultado) return;

    const ahora = new Date();
    const mes = resultado.mes || ahora.getMonth() + 1;
    const anio = resultado.anio || ahora.getFullYear();

    addLiquidacion({
      mes,
      anio,
      sueldoBase: resultado.sueldoBase,
      horasExtras: resultado.horasExtras,
      bonos: resultado.bonos,
      otrosHaberes: resultado.otrosHaberes,
      totalHaberes: resultado.totalHaberes,
      afp: resultado.afp,
      salud: resultado.salud,
      afc: resultado.afc,
      impuestoUnico: resultado.impuestoUnico,
      otrosDescuentos: resultado.otrosDescuentos,
      totalDescuentos: resultado.totalDescuentos,
      liquidoAPagar: resultado.liquidoAPagar,
      detalleHorasExtras: resultado.detalleHorasExtras,
      archivoNombre,
    });

    // También agregar como ingreso automáticamente
    addIngreso({
      monto: resultado.liquidoAPagar,
      fuente: 'Sueldo',
      fecha: new Date(anio, mes - 1, 1).toISOString().split('T')[0]!,
      descripcion: `Sueldo ${MESES[mes - 1]} ${anio}`,
    });

    setMensaje(`✅ Liquidación de ${MESES[mes - 1]} ${anio} guardada exitosamente`);
    setResultado(null);
    setArchivoNombre('');
    setRefreshKey(k => k + 1);
  };

  const handleDelete = (id: string) => {
    deleteLiquidacion(id);
    setRefreshKey(k => k + 1);
  };

  const formatCLP = (n: number) => n.toLocaleString('es-CL');

  // Función para mostrar el formulario de horas extras
  const [showHECalculator, setShowHECalculator] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Liquidación de Sueldo</h2>
        <p className="text-sm text-gray-500">
          Sube tu liquidación en PDF o foto para extraer los datos automáticamente
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          dragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-700 bg-gray-900 hover:border-gray-600 hover:bg-gray-800/50'
        }`}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf,image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        {parsing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-sm text-gray-400">Procesando archivo...</p>
            <p className="text-xs text-gray-600">Extrayendo datos de la liquidación</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-300">
                Arrastra tu liquidación aquí o haz clic para subir
              </p>
              <p className="text-xs text-gray-600 mt-1">
                PDF o imagen (JPG, PNG)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Resultado del parsing */}
      {resultado && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden animate-fade-in-up">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Datos Detectados</h3>
            <span className="text-xs text-gray-500">{archivoNombre}</span>
          </div>

          <div className="p-4 space-y-3">
            {/* Haberes */}
            <div>
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Haberes (Ingresos)</h4>
              <div className="space-y-1.5">
                <Row label="Sueldo Base" value={resultado.sueldoBase} />
                <Row label="Horas Extras" value={resultado.horasExtras} />
                <Row label="Bonos" value={resultado.bonos} />
                <Row label="Otros Haberes" value={resultado.otrosHaberes} />
                <div className="border-t border-gray-800 pt-1.5">
                  <Row label="Total Haberes" value={resultado.totalHaberes} bold />
                </div>
              </div>
            </div>

            {/* Descuentos */}
            <div>
              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Descuentos</h4>
              <div className="space-y-1.5">
                <Row label="AFP" value={resultado.afp} />
                <Row label="Salud" value={resultado.salud} />
                <Row label="AFC" value={resultado.afc} />
                <Row label="Impuesto Único" value={resultado.impuestoUnico} />
                <Row label="Otros Descuentos" value={resultado.otrosDescuentos} />
                <div className="border-t border-gray-800 pt-1.5">
                  <Row label="Total Descuentos" value={resultado.totalDescuentos} bold />
                </div>
              </div>
            </div>

            {/* Horas extras detalle */}
            {resultado.detalleHorasExtras && (
              <div className="bg-blue-600/10 border border-blue-800/30 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-400 mb-1">Detalle Horas Extras</p>
                <p className="text-xs text-gray-400">
                  {resultado.detalleHorasExtras.cantidad}h × ${formatCLP(resultado.detalleHorasExtras.valorHora)}/h ={' '}
                  <span className="text-white font-semibold">${formatCLP(resultado.detalleHorasExtras.total)}</span>
                </p>
              </div>
            )}

            {/* Líquido */}
            <div className="bg-gradient-to-r from-emerald-600/20 to-green-900/20 rounded-xl p-4 border border-emerald-800/30">
              <p className="text-xs text-gray-500 mb-1">Líquido a Pagar</p>
              <p className="text-2xl font-bold text-white">${formatCLP(resultado.liquidoAPagar)}</p>
            </div>
          </div>

          <div className="p-4 border-t border-gray-800 flex gap-2">
            <button
              onClick={handleGuardarLiquidacion}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold text-sm hover:from-emerald-700 hover:to-green-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Guardar Liquidación
            </button>
            <button
              onClick={() => { setResultado(null); setArchivoNombre(''); }}
              className="px-4 py-3 rounded-xl bg-gray-800 text-gray-400 text-sm hover:bg-gray-700 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {mensaje && !resultado && (
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <p className="text-sm text-gray-300">{mensaje}</p>
        </div>
      )}

      {/* Historial de liquidaciones */}
      {liquidaciones.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Historial</h3>
          <div className="space-y-2">
            {liquidaciones.map(liq => (
              <div key={liq.id} className="stagger-enter bg-gray-900 rounded-xl p-4 border border-gray-800/50 group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">
                      {MESES[liq.mes - 1]} {liq.anio}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(liq.id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-gray-500">Sueldo base:</span>
                  <span className="text-white text-right">${formatCLP(liq.sueldoBase)}</span>
                  {liq.horasExtras > 0 && (
                    <>
                      <span className="text-gray-500">Horas extras:</span>
                      <span className="text-orange-400 text-right">${formatCLP(liq.horasExtras)}</span>
                    </>
                  )}
                  <span className="text-gray-500">Descuentos:</span>
                  <span className="text-red-400 text-right">-${formatCLP(liq.totalDescuentos)}</span>
                  <span className="text-gray-500 font-medium">Líquido:</span>
                  <span className="text-emerald-400 font-bold text-right">${formatCLP(liq.liquidoAPagar)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje si no hay nada */}
      {!resultado && liquidaciones.length === 0 && !mensaje && (
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">Sin liquidaciones</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Sube tu liquidación de sueldo en PDF o foto. La app leerá automáticamente los valores y los integrará a tus finanzas.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  const formatCLP = (n: number) => n.toLocaleString('es-CL');
  return (
    <div className={`flex justify-between ${bold ? 'text-sm' : 'text-xs'}`}>
      <span className={bold ? 'text-white' : 'text-gray-500'}>{label}</span>
      <span className={`${bold ? 'text-white font-bold' : 'text-gray-300'} ${value === 0 ? 'text-gray-600' : ''}`}>
        {value > 0 ? `$${formatCLP(value)}` : '-'}
      </span>
    </div>
  );
}
