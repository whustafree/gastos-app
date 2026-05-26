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

export { generateId };
