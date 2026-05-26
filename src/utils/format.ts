/**
 * Convierte un string con formato numérico chileno a número.
 *
 * En Chile, el punto (.) se usa como separador de miles.
 * Ej: "2.880" → 2880, "1.000.500" → 1000500
 *
 * Esta función limpia los puntos de miles y reemplaza coma decimal por punto.
 * Ej: parseCLP("2.880") → 2880
 *     parseCLP("1.000,5") → 1000.5
 *     parseCLP("5000") → 5000
 */
export function parseCLP(value: string): number {
  if (!value || typeof value !== 'string') return 0;

  // Si tiene múltiples puntos separando miles → formato chileno seguro
  // Ej: "1.000.000" o "1.000.500"
  // También si tiene un solo punto seguido de exactamente 3 dígitos al final
  // Ej: "2.880" (2 mil 880) vs "2.500" (2.5, decimal)

  // Estrategia: si hay 2+ puntos, o 1 punto + exactamente 3 dígitos después,
  // o 1 punto en medio de dígitos (formato miles), remover todos los puntos
  // Caso contrario, tratar el punto como decimal

  const trimmed = value.trim();

  // Caso 1: múltiples puntos → formato miles (Chile)
  if ((trimmed.match(/\./g) || []).length >= 2) {
    return parseFloat(trimmed.replace(/\./g, '').replace(',', '.')) || 0;
  }

  // Caso 2: un solo punto
  const dotIndex = trimmed.indexOf('.');
  if (dotIndex >= 0) {
    const afterDot = trimmed.slice(dotIndex + 1);
    // Si después del punto hay exactamente 3 dígitos y nada más
    // (o 3 dígitos y luego algo que no son más dígitos)
    // es probablemente formato miles chileno: "2.880" → 2880
    const isMiles = /^\d{3}$/.test(afterDot) ||
                    /^\d{3}[,\s]/.test(afterDot) ||
                    /^\d{3}$/.test(afterDot.replace(/,.*$/, ''));

    const afterDotDigits = afterDot.replace(/,.*$/, '');

    if (isMiles && afterDotDigits.length === 3) {
      // Formato miles chileno: remover puntos, tratar coma como decimal
      return parseFloat(trimmed.replace(/\./g, '').replace(',', '.')) || 0;
    }
  }

  // Caso 3: sin puntos o con punto decimal → parseFloat normal
  // (pero también soportamos coma como decimal)
  return parseFloat(trimmed.replace(',', '.')) || 0;
}
