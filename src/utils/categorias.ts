// ─── Configuración compartida de categorías de gastos ───
// Colores únicos asignados a cada categoría, usados en Gastos, Dashboard y demás componentes

export interface CategoriaConfig {
  id: string;
  label: string;
  icon: string;
  color: string; // hex
  colorBg: string; // tailwind-like bg with opacity
}

export const CATEGORIAS: CategoriaConfig[] = [
  { id: 'alimentacion', label: 'Alimentación', icon: '🍽️', color: '#3b82f6', colorBg: 'rgba(59,130,246,0.15)' },
  { id: 'vivienda', label: 'Vivienda', icon: '🏠', color: '#ef4444', colorBg: 'rgba(239,68,68,0.15)' },
  { id: 'transporte', label: 'Transporte', icon: '🚗', color: '#10b981', colorBg: 'rgba(16,185,129,0.15)' },
  { id: 'salud', label: 'Salud', icon: '💊', color: '#f59e0b', colorBg: 'rgba(245,158,11,0.15)' },
  { id: 'educacion', label: 'Educación', icon: '📚', color: '#8b5cf6', colorBg: 'rgba(139,92,246,0.15)' },
  { id: 'entretencion', label: 'Entretención', icon: '🎮', color: '#ec4899', colorBg: 'rgba(236,72,153,0.15)' },
  { id: 'vestuario', label: 'Vestuario', icon: '👕', color: '#14b8a6', colorBg: 'rgba(20,184,166,0.15)' },
  { id: 'servicios', label: 'Servicios', icon: '💡', color: '#f97316', colorBg: 'rgba(249,115,22,0.15)' },
  { id: 'ahorro', label: 'Ahorro', icon: '🐷', color: '#a855f7', colorBg: 'rgba(168,85,247,0.15)' },
  { id: 'otros', label: 'Otros', icon: '📦', color: '#6b7280', colorBg: 'rgba(107,114,128,0.15)' },
];

export const CATEGORIA_MAP = new Map(CATEGORIAS.map(c => [c.id, c]));

export function getCategoria(id: string): CategoriaConfig {
  return CATEGORIA_MAP.get(id) || CATEGORIAS[CATEGORIAS.length - 1]!;
}

export const CATEGORIA_COLORS = CATEGORIAS.map(c => c.color);
