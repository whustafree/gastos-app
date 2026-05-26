// ─── Configuración compartida de categorías de gastos ───
// Colores únicos asignados a cada categoría + subcategorías para agilizar el registro

export interface SubCategoria {
  id: string;
  label: string;
}

export interface CategoriaConfig {
  id: string;
  label: string;
  icon: string;
  color: string; // hex
  colorBg: string; // tailwind-like bg with opacity
  subcategorias?: SubCategoria[];
}

export const CATEGORIAS: CategoriaConfig[] = [
  {
    id: 'alimentacion', label: 'Alimentación', icon: '🍽️', color: '#3b82f6', colorBg: 'rgba(59,130,246,0.15)',
    subcategorias: [
      { id: 'supermercado', label: 'Supermercado' },
      { id: 'restaurante', label: 'Restaurante' },
      { id: 'delivery', label: 'Delivery' },
      { id: 'panaderia', label: 'Panadería' },
      { id: 'carniceria', label: 'Carnicería' },
      { id: 'verduleria', label: 'Verdulería' },
      { id: 'almacen', label: 'Almacén' },
    ],
  },
  {
    id: 'vivienda', label: 'Vivienda', icon: '🏠', color: '#ef4444', colorBg: 'rgba(239,68,68,0.15)',
    subcategorias: [
      { id: 'arriendo', label: 'Arriendo' },
      { id: 'dividendo', label: 'Dividendo' },
      { id: 'mantencion', label: 'Mantención' },
      { id: 'seguro_vivienda', label: 'Seguro' },
      { id: 'reparaciones', label: 'Reparaciones' },
    ],
  },
  {
    id: 'transporte', label: 'Transporte', icon: '🚗', color: '#10b981', colorBg: 'rgba(16,185,129,0.15)',
    subcategorias: [
      { id: 'bencina', label: 'Bencina' },
      { id: 'uber_taxi', label: 'Uber/Taxi' },
      { id: 'micro', label: 'Micro' },
      { id: 'metro', label: 'Metro' },
      { id: 'estacionamiento', label: 'Estacionamiento' },
      { id: 'peaje', label: 'Peaje' },
      { id: 'mantencion_auto', label: 'Mant. Auto' },
    ],
  },
  {
    id: 'salud', label: 'Salud', icon: '💊', color: '#f59e0b', colorBg: 'rgba(245,158,11,0.15)',
    subcategorias: [
      { id: 'consulta', label: 'Consulta' },
      { id: 'farmacia', label: 'Farmacia' },
      { id: 'examenes', label: 'Exámenes' },
      { id: 'dental', label: 'Dental' },
      { id: 'seguro_salud', label: 'Seguro' },
      { id: 'psicologo', label: 'Psicólogo' },
    ],
  },
  {
    id: 'educacion', label: 'Educación', icon: '📚', color: '#8b5cf6', colorBg: 'rgba(139,92,246,0.15)',
    subcategorias: [
      { id: 'universidad', label: 'Universidad' },
      { id: 'curso', label: 'Curso' },
      { id: 'colegio', label: 'Colegio' },
      { id: 'libros', label: 'Libros' },
      { id: 'online', label: 'Online' },
      { id: 'talleres', label: 'Talleres' },
    ],
  },
  {
    id: 'entretencion', label: 'Entretención', icon: '🎮', color: '#ec4899', colorBg: 'rgba(236,72,153,0.15)',
    subcategorias: [
      { id: 'streaming', label: 'Streaming' },
      { id: 'cine', label: 'Cine' },
      { id: 'videojuegos', label: 'Videojuegos' },
      { id: 'musica', label: 'Música' },
      { id: 'deportes', label: 'Deportes' },
      { id: 'salidas', label: 'Salidas' },
      { id: 'hobbies', label: 'Hobbies' },
    ],
  },
  {
    id: 'vestuario', label: 'Vestuario', icon: '👕', color: '#14b8a6', colorBg: 'rgba(20,184,166,0.15)',
    subcategorias: [
      { id: 'ropa', label: 'Ropa' },
      { id: 'calzado', label: 'Calzado' },
      { id: 'accesorios', label: 'Accesorios' },
    ],
  },
  {
    id: 'servicios', label: 'Servicios', icon: '💡', color: '#f97316', colorBg: 'rgba(249,115,22,0.15)',
    subcategorias: [
      { id: 'luz', label: 'Luz' },
      { id: 'agua', label: 'Agua' },
      { id: 'gas', label: 'Gas' },
      { id: 'internet', label: 'Internet' },
      { id: 'telefonia', label: 'Telefonía' },
      { id: 'tv_cable', label: 'TV Cable' },
    ],
  },
  {
    id: 'ahorro', label: 'Ahorro', icon: '🐷', color: '#a855f7', colorBg: 'rgba(168,85,247,0.15)',
    subcategorias: [
      { id: 'cta_ahorro', label: 'Cta. Ahorro' },
      { id: 'apv', label: 'APV' },
      { id: 'inversiones', label: 'Inversiones' },
      { id: 'fondos', label: 'Fondos Mutuos' },
    ],
  },
  {
    id: 'otros', label: 'Otros', icon: '📦', color: '#6b7280', colorBg: 'rgba(107,114,128,0.15)',
    subcategorias: [
      { id: 'regalos', label: 'Regalos' },
      { id: 'seguros', label: 'Seguros' },
      { id: 'impuestos', label: 'Impuestos' },
      { id: 'suscripcion', label: 'Suscripción' },
    ],
  },
];

export const CATEGORIA_MAP = new Map(CATEGORIAS.map(c => [c.id, c]));

export function getCategoria(id: string): CategoriaConfig {
  return CATEGORIA_MAP.get(id) || CATEGORIAS[CATEGORIAS.length - 1]!;
}

export const CATEGORIA_COLORS = CATEGORIAS.map(c => c.color);
