// ─── Gastos ───
export type CategoriaGasto =
  | 'alimentacion'
  | 'vivienda'
  | 'transporte'
  | 'salud'
  | 'educacion'
  | 'entretencion'
  | 'vestuario'
  | 'servicios'
  | 'ahorro'
  | 'otros';

export type TipoGasto = 'personal' | 'familiar';

export interface Gasto {
  id: string;
  monto: number;
  categoria: CategoriaGasto;
  tipo: TipoGasto;
  descripcion: string;
  fecha: string; // ISO date
  createdAt: string;
}

// ─── Ingresos ───
export interface Ingreso {
  id: string;
  monto: number;
  fuente: string; // ej: "Sueldo", "Freelance", "Otro"
  fecha: string; // ISO date
  descripcion?: string;
  createdAt: string;
}

// ─── Metas de Ahorro ───
export interface MetaAhorro {
  id: string;
  nombre: string;
  montoObjetivo: number;
  montoActual: number;
  fechaLimite: string; // ISO date
  createdAt: string;
  categoria?: string;
  color?: string;
}

// ─── Liquidación de Sueldo (Chile) ───
export interface LiquidacionSueldo {
  id: string;
  mes: number; // 1-12
  anio: number;
  fechaEmision: string;

  // Datos del trabajador
  runTrabajador?: string;
  nombreTrabajador?: string;
  cargo?: string;

  // Haberes (ingresos brutos)
  sueldoBase: number;
  horasExtras: number;
  bonos: number;
  otrosHaberes: number;
  totalHaberes: number;

  // Detalle horas extras
  detalleHorasExtras?: {
    cantidad: number;
    valorHora: number;
    total: number;
  };

  // Descuentos
  afp: number;
  salud: number; // Fonasa o Isapre
  afc: number; // Seguro de Cesantía
  impuestoUnico: number; // Impuesto a la Renta
  otrosDescuentos: number;
  totalDescuentos: number;

  // Líquido
  liquidoAPagar: number;

  // Archivo original
  archivoNombre?: string;
  archivoTipo?: 'pdf' | 'image';
  createdAt: string;
}

// ─── Configuración de horas extras ───
export interface ConfigHorasExtras {
  valorHoraNormal: number;
  recargoExtra: number; // porcentaje ej: 50% -> 1.5
  horasPorDia: number;
}

// ─── Resumen mensual ───
export interface ResumenMensual {
  mes: number;
  anio: number;
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  gastosPorCategoria: Record<CategoriaGasto, number>;
  ahorroMetas: number;
}

// ─── Cloud Sync ───
export interface CloudData<T> {
  items: T[];
  updatedAt: string;
}

// ─── Firebase Auth ───
export interface DemoUser {
  uid: string;
  email: string;
  displayName: string;
  isDemo: boolean;
}
