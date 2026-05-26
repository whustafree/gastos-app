function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function saveLocal<T>(key: string, data: T): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

// ─── Gastos ───
export interface Gasto {
  id: string;
  monto: number;
  categoria: string;
  tipo: 'personal' | 'familiar';
  descripcion: string;
  fecha: string;
  createdAt: string;
}

export function getGastos(): Gasto[] {
  return loadLocal<Gasto[]>('gastos-app-gastos', []);
}

export function addGasto(gasto: Omit<Gasto, 'id' | 'createdAt'>): Gasto[] {
  const gastos = getGastos();
  const nuevo: Gasto = { ...gasto, id: generateId(), createdAt: new Date().toISOString() };
  gastos.push(nuevo);
  saveLocal('gastos-app-gastos', gastos);
  return gastos;
}

export function deleteGasto(id: string): Gasto[] {
  const gastos = getGastos().filter(g => g.id !== id);
  saveLocal('gastos-app-gastos', gastos);
  return gastos;
}

// ─── Ingresos (sueldos) ───
export interface Ingreso {
  id: string;
  monto: number;
  fuente: string;
  fecha: string;
  descripcion?: string;
  createdAt: string;
}

export function getIngresos(): Ingreso[] {
  return loadLocal<Ingreso[]>('gastos-app-ingresos', []);
}

export function addIngreso(ingreso: Omit<Ingreso, 'id' | 'createdAt'>): Ingreso[] {
  const ingresos = getIngresos();
  const nuevo: Ingreso = { ...ingreso, id: generateId(), createdAt: new Date().toISOString() };
  ingresos.push(nuevo);
  saveLocal('gastos-app-ingresos', ingresos);
  return ingresos;
}

export function deleteIngreso(id: string): Ingreso[] {
  const ingresos = getIngresos().filter(i => i.id !== id);
  saveLocal('gastos-app-ingresos', ingresos);
  return ingresos;
}

// ─── Metas ───
export interface MetaAhorro {
  id: string;
  nombre: string;
  montoObjetivo: number;
  montoActual: number;
  fechaLimite: string;
  createdAt: string;
  color: string;
}

export function getMetas(): MetaAhorro[] {
  return loadLocal<MetaAhorro[]>('gastos-app-metas', []);
}

export function addMeta(meta: Omit<MetaAhorro, 'id' | 'createdAt' | 'montoActual'>): MetaAhorro[] {
  const metas = getMetas();
  const nueva: MetaAhorro = {
    ...meta,
    id: generateId(),
    montoActual: 0,
    createdAt: new Date().toISOString(),
  };
  metas.push(nueva);
  saveLocal('gastos-app-metas', metas);
  return metas;
}

export function updateMetaAhorro(id: string, monto: number): MetaAhorro[] {
  const metas = getMetas().map(m => m.id === id ? { ...m, montoActual: m.montoActual + monto } : m);
  saveLocal('gastos-app-metas', metas);
  return metas;
}

export function deleteMeta(id: string): MetaAhorro[] {
  const metas = getMetas().filter(m => m.id !== id);
  saveLocal('gastos-app-metas', metas);
  return metas;
}

// ─── Liquidaciones ───
export interface LiquidacionSueldo {
  id: string;
  mes: number;
  anio: number;
  sueldoBase: number;
  horasExtras: number;
  bonos: number;
  otrosHaberes: number;
  totalHaberes: number;
  afp: number;
  salud: number;
  afc: number;
  impuestoUnico: number;
  otrosDescuentos: number;
  totalDescuentos: number;
  liquidoAPagar: number;
  detalleHorasExtras?: { cantidad: number; valorHora: number; total: number };
  archivoNombre?: string;
  createdAt: string;
}

export function getLiquidaciones(): LiquidacionSueldo[] {
  return loadLocal<LiquidacionSueldo[]>('gastos-app-liquidaciones', []);
}

export function addLiquidacion(liq: Omit<LiquidacionSueldo, 'id' | 'createdAt'>): LiquidacionSueldo[] {
  const liquidaciones = getLiquidaciones();
  const nueva: LiquidacionSueldo = { ...liq, id: generateId(), createdAt: new Date().toISOString() };
  liquidaciones.push(nueva);
  saveLocal('gastos-app-liquidaciones', liquidaciones);
  return liquidaciones;
}

export function deleteLiquidacion(id: string): LiquidacionSueldo[] {
  const liquidaciones = getLiquidaciones().filter(l => l.id !== id);
  saveLocal('gastos-app-liquidaciones', liquidaciones);
  return liquidaciones;
}

// ─── Resumen mensual ───
export interface ResumenMensual {
  mes: number;
  anio: number;
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  gastosPorCategoria: Record<string, number>;
}

export function getResumenMensual(mes: number, anio: number): ResumenMensual {
  const gastos = getGastos().filter(g => {
    const d = new Date(g.fecha);
    return d.getMonth() + 1 === mes && d.getFullYear() === anio;
  });
  const ingresos = getIngresos().filter(i => {
    const d = new Date(i.fecha);
    return d.getMonth() + 1 === mes && d.getFullYear() === anio;
  });

  const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
  const gastosPorCategoria: Record<string, number> = {};

  for (const g of gastos) {
    gastosPorCategoria[g.categoria] = (gastosPorCategoria[g.categoria] || 0) + g.monto;
  }

  return { mes, anio, totalIngresos, totalGastos, balance: totalIngresos - totalGastos, gastosPorCategoria };
}

// ─── Gastos Recurrentes (Suscripciones) ───
export interface GastoRecurrente {
  id: string;
  monto: number;
  categoria: string;
  tipo: 'personal' | 'familiar';
  descripcion: string;
  diaMes: number; // día del mes en que se cobra (1-31)
  activo: boolean;
  ultimoMesAgregado?: string; // "YYYY-MM" para evitar duplicados
  createdAt: string;
}

export function getGastosRecurrentes(): GastoRecurrente[] {
  return loadLocal<GastoRecurrente[]>('gastos-app-recurrentes', []);
}

export function addGastoRecurrente(r: Omit<GastoRecurrente, 'id' | 'createdAt' | 'activo'>): GastoRecurrente[] {
  const items = getGastosRecurrentes();
  const nuevo: GastoRecurrente = { ...r, id: generateId(), activo: true, createdAt: new Date().toISOString() };
  items.push(nuevo);
  saveLocal('gastos-app-recurrentes', items);
  return items;
}

export function updateGastoRecurrente(id: string, changes: Partial<GastoRecurrente>): GastoRecurrente[] {
  const items = getGastosRecurrentes().map(r => r.id === id ? { ...r, ...changes } : r);
  saveLocal('gastos-app-recurrentes', items);
  return items;
}

export function deleteGastoRecurrente(id: string): GastoRecurrente[] {
  const items = getGastosRecurrentes().filter(r => r.id !== id);
  saveLocal('gastos-app-recurrentes', items);
  return items;
}

/**
 * Revisa los gastos recurrentes activos y agrega los que correspondan al mes actual
 * si no se han agregado ya. Retorna cuántos gastos se agregaron.
 */
export function autoAgregarRecurrentes(): number {
  const ahora = new Date();
  const mesActual = ahora.getMonth() + 1;
  const anioActual = ahora.getFullYear();
  const keyActual = `${anioActual}-${String(mesActual).padStart(2, '0')}`;

  let contador = 0;
  const recurrentes = getGastosRecurrentes().filter(r => r.activo);
  const gastos = getGastos();

  for (const r of recurrentes) {
    // Si ya se agregó este mes, saltar
    if (r.ultimoMesAgregado === keyActual) continue;

    // Crear fecha con el día del mes configurado
    const dia = Math.min(r.diaMes, 28); // seguro para todos los meses
    const fechaStr = `${anioActual}-${String(mesActual).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    // Verificar si ya existe un gasto igual este mes
    const yaExiste = gastos.some(g =>
      g.descripcion === r.descripcion &&
      g.categoria === r.categoria &&
      g.monto === r.monto &&
      new Date(g.fecha).getMonth() + 1 === mesActual &&
      new Date(g.fecha).getFullYear() === anioActual
    );

    if (!yaExiste) {
      addGasto({
        monto: r.monto,
        categoria: r.categoria,
        tipo: r.tipo,
        descripcion: r.descripcion,
        fecha: fechaStr,
      });
      contador++;
    }

    // Marcar como agregado este mes
    updateGastoRecurrente(r.id, { ultimoMesAgregado: keyActual });
  }

  return contador;
}

// ─── Exportar a CSV ───
function escapeCSV(val: string | number): string {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportGastosCSV(mes?: number, anio?: number): string {
  const ahora = new Date();
  const m = mes || ahora.getMonth() + 1;
  const a = anio || ahora.getFullYear();

  const gastos = getGastos().filter(g => {
    const d = new Date(g.fecha);
    return d.getMonth() + 1 === m && d.getFullYear() === a;
  }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  let csv = `Gastos - ${MESES[m - 1]} ${a}\r\n`;
  csv += 'Fecha,Categoría,Tipo,Descripción,Monto\r\n';
  for (const g of gastos) {
    const fecha = new Date(g.fecha).toLocaleDateString('es-CL');
    const cat = g.categoria;
    csv += `${escapeCSV(fecha)},${escapeCSV(cat)},${escapeCSV(g.tipo)},${escapeCSV(g.descripcion)},${g.monto}\r\n`;
  }
  csv += `\r\nTotal Gastos,,,,"${gastos.reduce((s, g) => s + g.monto, 0)}"\r\n`;
  return csv;
}

export function exportIngresosCSV(mes?: number, anio?: number): string {
  const ahora = new Date();
  const m = mes || ahora.getMonth() + 1;
  const a = anio || ahora.getFullYear();

  const ingresos = getIngresos().filter(i => {
    const d = new Date(i.fecha);
    return d.getMonth() + 1 === m && d.getFullYear() === a;
  }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  let csv = `Ingresos - ${MESES[m - 1]} ${a}\r\n`;
  csv += 'Fecha,Fuente,Descripción,Monto\r\n';
  for (const i of ingresos) {
    const fecha = new Date(i.fecha).toLocaleDateString('es-CL');
    csv += `${escapeCSV(fecha)},${escapeCSV(i.fuente)},${escapeCSV(i.descripcion || '')},${i.monto}\r\n`;
  }
  csv += `\r\nTotal Ingresos,,,"${ingresos.reduce((s, i) => s + i.monto, 0)}"\r\n`;
  return csv;
}

export function exportCompletoCSV(): string {
  const ahora = new Date();
  const m = ahora.getMonth() + 1;
  const a = ahora.getFullYear();

  let csv = 'GASTOSAPP - EXPORTACIÓN COMPLETA\r\n';
  csv += `Generado el ${ahora.toLocaleDateString('es-CL')} a las ${ahora.toLocaleTimeString('es-CL')}\r\n\r\n`;
  csv += exportGastosCSV(m, a);
  csv += '\r\n\r\n';
  csv += exportIngresosCSV(m, a);
  csv += '\r\n\r\n';

  // Metas
  const metas = getMetas();
  csv += 'Metas de Ahorro\r\n';
  csv += 'Nombre,Objetivo,Actual,Progreso%,Fecha Límite\r\n';
  for (const m of metas) {
    const progreso = m.montoObjetivo > 0 ? ((m.montoActual / m.montoObjetivo) * 100).toFixed(0) : '0';
    csv += `${escapeCSV(m.nombre)},${m.montoObjetivo},${m.montoActual},${progreso}%,${escapeCSV(new Date(m.fechaLimite).toLocaleDateString('es-CL'))}\r\n`;
  }

  return csv;
}

export function descargarCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export { generateId };
