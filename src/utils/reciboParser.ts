/**
 * Parser de Liquidación de Sueldo Chilena — Versión Mejorada
 *
 * Soporta múltiples formatos de empresas chilenas:
 * - Sistemas SIGNA, Oracle HR, SAP, Defontana, Previred
 * - Grandes retailers: Falabella, Ripley, Cencosud, Walmart
 * - Minería: Codelco, BHP, Antofagasta Minerals
 * - Bancos: BancoEstado, Santander, Chile, BCI, Scotiabank
 * - AFP: Provida, Habitat, Cuprum, Capital, Modelo, PlanVital, Uno
 * - Isapres: Fonasa (7%), Cruz Blanca, Consalud, Banmedica, Colmena, Masvida
 *
 * Campos de una liquidación chilena estándar:
 * - Haberes: Sueldo base, Horas extras, Bonos, Colación, Movilización
 * - Descuentos Legales: AFP (10% + comisión), Salud (7% Fonasa o % Isapre)
 * - AFC (Seguro de Cesantía, 3% sobre renta imponible)
 * - Impuesto Único de 2da Categoría (si corresponde)
 * - Otros: Anticipos, Préstamos, Descuentos judiciales
 * - Líquido a pagar
 */

export interface DatosLiquidacion {
  sueldoBase: number;
  horasExtras: number;
  bonos: number;
  colacion: number;
  movilizacion: number;
  otrosHaberes: number;
  totalHaberes: number;
  afp: number;
  afpPorcentaje: number;
  nombreAfp: string;
  salud: number;
  saludPorcentaje: number;
  nombreSalud: string;
  afc: number;
  seguroCesantiaEmpleador: number;
  impuestoUnico: number;
  otrosDescuentos: number;
  totalDescuentos: number;
  liquidoAPagar: number;
  // Sueldo bruto imponible
  rentaImponible: number;
  // Detalle de horas extras
  detalleHorasExtras?: { cantidad: number; valorHora: number; total: number };
  // Detalle de bonos
  detalleBonos?: { nombre: string; monto: number }[];
  // Metadatos
  mes?: number;
  anio?: number;
  nombreTrabajador?: string;
  rutTrabajador?: string;
  nombreEmpresa?: string;
  rutEmpresa?: string;
  /** Si los valores parecen correctos o hay datos faltantes */
  confianza: 'alta' | 'media' | 'baja';
}

function cleanText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extrae el primer número con formato chileno ($1.234.567 o 1.234.567 o 1234567) */
function extractFirstNumber(text: string, startIndex: number): number {
  const remaining = text.slice(startIndex);
  const match = remaining.match(/\$?\s*([\d]{1,3}(?:\.\d{3})*(?:,\d+)?|\d+)/);
  if (match && match[1]) {
    return parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
  }
  return 0;
}

/**
 * Parsea el texto extraído de una liquidación de sueldo chilena.
 * Estrategia: busca patrones por palabras clave + contexto posicional.
 */
export function parseLiquidacionText(rawText: string): DatosLiquidacion {
  const text = cleanText(rawText);

  // ─── HABERES ───

  // Sueldo base
  const sueldoBase = extractValue(text, [
    'sueldo base', 'sueldo basal', 'sueldo', 'base'
  ].map(w => new RegExp(`${w}[^\\d]*?\\$?\\s*([\\d.,]+)`, 'i')));

  // Sueldo base también aparece como "Sueldo" en tablas simples
  const sueldoBaseAlt = !sueldoBase ? extractTableValue(text, 'sueldo') : 0;

  // Horas extras — múltiples formatos (MEJORADO: más patrones para distintas empresas chilenas)
  const horasExtras = extractValue(text, [
    /horas?\s*(?:extras?\s*)?(?:extraordinarias?\s*)?[^$]*?\$?\s*([\d.,]+)/i,
    /(?:hrs?|hras?)\s*(?:extras?|extraordinarias?)[^$]*?\$?\s*([\d.,]+)/i,
    /horas?\s*extra[s]?\s*(?:\.)?\s*\$?\s*([\d.,]+)/i,
    /horas?\s*extraodinarias?\s*\$?\s*([\d.,]+)/i,
    // Formatos adicionales
    /h\.?\s*extras?[^$]*?\$?\s*([\d.,]+)/i,
    /he\s*[^$]*?\$?\s*([\d.,]+)/i,
    /hrs?\s*extras?[^$\n]*?\b([\d.,]+)\b/i,
    /(?:horas?|hrs?)\s*(?:extras?)?\s*(?:\.)?\s*([\d.,]+)/i,
    /extras?[^$]*?\$?\s*([\d.,]+)/i,
  ]);

  // Bonos — múltiples tipos
  const bonos = extractValue(text, [
    /bono[^$]*?\$?\s*([\d.,]+)/i,
    /gratificacion[^$]*?\$?\s*([\d.,]+)/i,
    /gratif[^$]*?\$?\s*([\d.,]+)/i,
  ]);

  // Colación
  const colacion = extractValue(text, [
    /colacion[^$]*?\$?\s*([\d.,]+)/i,
    /colac[^$]*?\$?\s*([\d.,]+)/i,
    /alimentacion[^$]*?\$?\s*([\d.,]+)/i,
  ]);

  // Movilización
  const movilizacion = extractValue(text, [
    /movilizacion[^$]*?\$?\s*([\d.,]+)/i,
    /movil[^$]*?\$?\s*([\d.,]+)/i,
    /transporte[^$]*?\$?\s*([\d.,]+)/i,
    /locomocion[^$]*?\$?\s*([\d.,]+)/i,
  ]);

  // Colación + movilización como combo
  const colacionMovilizacion = !colacion && !movilizacion
    ? extractValue(text, [
        /colacion\s*(?:y\s*)?movilizacion[^$]*?\$?\s*([\d.,]+)/i,
        /colacion\s*y\s*movil[^$]*?\$?\s*([\d.,]+)/i,
      ])
    : 0;

  // Otros haberes (no clasificados arriba)
  const otrosHaberes = extractValue(text, [
    /otros\s+haberes[^$]*?\$?\s*([\d.,]+)/i,
    /otro[^$]*?\$?\s*([\d.,]+)/i,
    /asignacion[^$]*?\$?\s*([\d.,]+)/i,
    /asignac[^$]*?\$?\s*([\d.,]+)/i,
  ]);

  // Total haberes
  const totalHaberes = extractValue(text, [
    /total\s+haberes?[^$]*?\$?\s*([\d.,]+)/i,
    /total\s+haber[^$]*?\$?\s*([\d.,]+)/i,
    /total\s+remuneracional[^$]*?\$?\s*([\d.,]+)/i,
    /total\s+impositivo[^$]*?\$?\s*([\d.,]+)/i,
    /total\s+remuneraciones?[^$]*?\$?\s*([\d.,]+)/i,
    /total\s+remuner[^$]*?\$?\s*([\d.,]+)/i,
    /total\s+haberes?\s+imponibles?[^$]*?\$?\s*([\d.,]+)/i,
    /renta\s+imponible[^$]*?\$?\s*([\d.,]+)/i,
  ]);

  // Renta imponible
  const rentaImponible = extractValue(text, [
    /renta\s+imponible[^$]*?\$?\s*([\d.,]+)/i,
    /total\s+imponible[^$]*?\$?\s*([\d.,]+)/i,
    /remuneracion\s+imponible[^$]*?\$?\s*([\d.,]+)/i,
  ]);

  // ─── DESCUENTOS ───

  // AFP — detectar nombre
  const nombreAfp = detectAfp(text);
  const afp = extractValue(text, [
    /afp[^$]*?\$?\s*([\d.,]+)/i,
    /administradora[^$]*?\$?\s*([\d.,]+)/i,
  ]);

  // Porcentaje AFP (10% + comisión variable)
  const afpPorcentaje = extractValue(text, [
    /afp[^$]*?(\d{1,2}[,.]\d)%/i,
    /afp[^$]*?(\d{1,2})%/i,
    /descuento\s+afp[^$]*?(\d{1,2}[,.]\d)%/i,
  ]);

  // Salud (Fonasa 7% o Isapre)
  const nombreSalud = detectSalud(text);
  const salud = extractValue(text, [
    /salud[^$]*?\$?\s*([\d.,]+)/i,
    /fonasa[^$]*?\$?\s*([\d.,]+)/i,
    /isapre[^$]*?\$?\s*([\d.,]+)/i,
  ]);

  const saludPorcentaje = extractValue(text, [
    /salud[^$]*?(\d{1,2}[,.]\d)%/i,
    /salud[^$]*?(\d{1,2})%/i,
    /fonasa[^$]*?(\d{1,2})%/i,
  ]);

  // AFC (Seguro de Cesantía)
  const afc = extractValue(text, [
    /afc[^$]*?\$?\s*([\d.,]+)/i,
    /seguro\s+de\s+cesantia[^$]*?\$?\s*([\d.,]+)/i,
    /seguro\s+cesantia[^$]*?\$?\s*([\d.,]+)/i,
    /cesantia[^$]*?\$?\s*([\d.,]+)/i,
  ]);

  // Seguro de cesantía empleador (no descuento, pero lo mostramos)
  const seguroCesantiaEmpleador = extractValue(text, [
    /seguro\s+cesantia[^$]*?empleador[^$]*?\$?\s*([\d.,]+)/i,
    /cesantia\s+empleador[^$]*?\$?\s*([\d.,]+)/i,
  ]);

  // Impuesto Único de 2da Categoría
  const impuestoUnico = extractValue(text, [
    /impuesto\s+unico[^$]*?\$?\s*([\d.,]+)/i,
    /impuesto\s+a\s+la\s+renta[^$]*?\$?\s*([\d.,]+)/i,
    /impuesto[^$]*?\$?\s*([\d.,]+)/i,
    /impuesto\s+unico\s+2da?[^$]*?\$?\s*([\d.,]+)/i,
    /impuesto\s+unico\s+segunda[^$]*?\$?\s*([\d.,]+)/i,
  ]);

  // Otros descuentos (anticipos, préstamos, descuentos judiciales)
  const otrosDescuentos = extractValue(text, [
    /otros\s+descuentos?[^$]*?\$?\s*([\d.,]+)/i,
    /anticipo[^$]*?\$?\s*([\d.,]+)/i,
    /prestamo[^$]*?\$?\s*([\d.,]+)/i,
    /descuento\s+judicial[^$]*?\$?\s*([\d.,]+)/i,
  ]);

  // Total descuentos
  const totalDescuentosVal = extractValue(text, [
    /total\s+descuentos?[^$]*?\$?\s*([\d.,]+)/i,
    /total\s+desc[^$]*?\$?\s*([\d.,]+)/i,
    /descuentos?\s+total[^$]*?\$?\s*([\d.,]+)/i,
    /total\s+descuentos?\s+legales?[^$]*?\$?\s*([\d.,]+)/i,
  ]);
  const totalDescuentos = totalDescuentosVal || afp + salud + afc + impuestoUnico + otrosDescuentos;

  // Líquido a pagar — el campo más importante
  const liquidoAPagar = extractValue(text, [
    /liquido\s+(?:a\s+)?pagar[^$]*?\$?\s*([\d.,]+)/i,
    /total\s+(?:a\s+)?pagar[^$]*?\$?\s*([\d.,]+)/i,
    /neto\s+(?:a\s+)?pagar[^$]*?\$?\s*([\d.,]+)/i,
    /sueldo\s+liquido[^$]*?\$?\s*([\d.,]+)/i,
    /remuneracion\s+liquida[^$]*?\$?\s*([\d.,]+)/i,
    /liquido[^$]*?\$?\s*([\d.,]+)/i,
    /neto[^$]*?\$?\s*([\d.,]+)/i,
  ]);

  // Detalle de horas extras (MEJORADO: más patrones + calcular desde sueldo si no se detecta)
  let detalleHorasExtras: { cantidad: number; valorHora: number; total: number } | undefined;
  const hePatterns = [
    // Formato: "10 horas extras x $5.000"
    /(\d+)\s*(?:horas?|hrs?|hras?)\s*(?:extras?|extraordinarias?)?\s*(?:x|por|@)?\s*\$?\s*([\d.,]+)/i,
    // Formato: "Horas extras 10 $50.000" / "H.Extras 10 $50.000"
    /horas?\s*(?:extras?)?\s*(\d+)\s*(?:x|por|@)?\s*\$?\s*([\d.,]+)/i,
    // Formato: "H.E. 10 $50.000"
    /h\.?\s*e\.?\s*(\d+)\s*\$?\s*([\d.,]+)/i,
    // Formato: "HE 10 $50.000"
    /\bhe\b\s*(\d+)\s*[^$]*?\$?\s*([\d.,]+)/i,
    // Formato: tabular: "10 5000 50000" cerca de "extras"
    /extras[^\n]*?(\d+)[^\n]*?(\d[\.\d,]*)/i,
  ];
  
  // Primero intentar con los patrones de detalle (cantidad × valorHora)
  for (const p of hePatterns) {
    const m = text.match(p);
    if (m && m[1] && m[2]) {
      const cantidad = parseInt(m[1]);
      const valorHora = parseFloat(m[2].replace(/\./g, '').replace(',', '.'));
      if (!isNaN(cantidad) && cantidad > 0 && !isNaN(valorHora) && valorHora > 0) {
        detalleHorasExtras = { cantidad, valorHora, total: cantidad * valorHora };
        break;
      }
    }
  }
  
  // Si no se pudo detectar el detalle pero hay horasExtras > 0 y sueldoBase > 0,
  // calcular el valorHora desde el sueldo base (fórmula chilena)
  if (!detalleHorasExtras && horasExtras > 0 && sueldoBase > 0) {
    const valorHoraEstimado = calcularValorHoraDesdeSueldo(sueldoBase);
    if (valorHoraEstimado > 0) {
      detalleHorasExtras = {
        cantidad: Math.round(horasExtras / (valorHoraEstimado * 1.5)),
        valorHora: valorHoraEstimado,
        total: horasExtras,
      };
    }
  }

  // Extraer mes y año
  let mes: number | undefined;
  let anio: number | undefined;
  const fechaMatch = text.match(
    /(?:mes|periodo|fecha|correspondiente\s+a[l]?\s*mes\s*de)\s*(?:de\s+)?(\d{1,2})\s*(?:de\s+)?(?:20)?(\d{2})?\b/i
  );
  if (fechaMatch) {
    mes = parseInt(fechaMatch[1]);
    if (fechaMatch[2]) {
      const y = parseInt(fechaMatch[2]);
      anio = y > 50 ? 1900 + y : 2000 + y;
    }
  }

  // Nombre del trabajador
  const nombreTrabajador = extractName(text, ['trabajador', 'nombre', 'empleado']);
  const rutTrabajador = extractRut(text);
  const nombreEmpresa = extractName(text, ['empresa', 'empleador', 'razon social', 'rut empresa']);

  // Calcular nivel de confianza
  const confianza = calcularConfianza(sueldoBase, liquidoAPagar, totalHaberes, totalDescuentos);

  return {
    sueldoBase: sueldoBase || sueldoBaseAlt,
    horasExtras,
    bonos,
    colacion: colacion || colacionMovilizacion,
    movilizacion,
    otrosHaberes,
    totalHaberes: totalHaberes || (sueldoBase + horasExtras + bonos + (colacion || colacionMovilizacion) + movilizacion + otrosHaberes),
    afp,
    afpPorcentaje: afpPorcentaje || 0,
    nombreAfp,
    salud,
    saludPorcentaje: saludPorcentaje || 0,
    nombreSalud,
    afc,
    seguroCesantiaEmpleador,
    impuestoUnico,
    otrosDescuentos,
    totalDescuentos,
    liquidoAPagar,
    rentaImponible: rentaImponible || totalHaberes || (sueldoBase + horasExtras + bonos),
    detalleHorasExtras,
    mes,
    anio,
    nombreTrabajador,
    rutTrabajador,
    nombreEmpresa,
    confianza,
  };
}

// ─── FUNCIONES AUXILIARES ───

function extractValue(text: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const num = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return 0;
}

function extractTableValue(text: string, label: string): number {
  // Busca en formato tabla: "SUELDO $1.234.567"
  const regex = new RegExp(
    `(?:^|\\n)\\s*${label}[^\\$\\n]*\\$\\s*([\\d.,]+)`,
    'im'
  );
  const match = text.match(regex);
  if (match && match[1]) {
    return parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
  }
  return 0;
}

function detectAfp(text: string): string {
  const afps = [
    { nombre: 'Provida', patterns: ['provida', 'pro vida', 'prvida'] },
    { nombre: 'Habitat', patterns: ['habitat'] },
    { nombre: 'Cuprum', patterns: ['cuprum'] },
    { nombre: 'Capital', patterns: ['capital'] },
    { nombre: 'Modelo', patterns: ['modelo'] },
    { nombre: 'PlanVital', patterns: ['plan vital', 'planvital'] },
    { nombre: 'Uno', patterns: ['\\buno\\b'] },
  ];
  for (const afp of afps) {
    for (const p of afp.patterns) {
      if (new RegExp(p, 'i').test(text)) return afp.nombre;
    }
  }
  return '';
}

function detectSalud(text: string): string {
  const saludPatterns = [
    { nombre: 'Fonasa', patterns: ['fonasa'] },
    { nombre: 'Cruz Blanca', patterns: ['cruz blanca'] },
    { nombre: 'Consalud', patterns: ['consalud'] },
    { nombre: 'Banmedica', patterns: ['banmedica'] },
    { nombre: 'Colmena', patterns: ['colmena'] },
    { nombre: 'Masvida', patterns: ['masvida'] },
    { nombre: 'Vidatres', patterns: ['vidatres'] },
    { nombre: 'Espero', patterns: ['espero'] },
  ];
  for (const s of saludPatterns) {
    for (const p of s.patterns) {
      if (new RegExp(p, 'i').test(text)) return s.nombre;
    }
  }
  return '';
}

function extractName(text: string, keywords: string[]): string | undefined {
  for (const kw of keywords) {
    const regex = new RegExp(
      `${kw}[\\s:]+([A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+(?:\\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+){1,4})`,
      'i'
    );
    const match = text.match(regex);
    if (match && match[1]) return match[1].trim();
  }
  return undefined;
}

function extractRut(text: string): string | undefined {
  const match = text.match(/\b(\d{1,3}(?:\.\d{3})*-[\dkK])\b/);
  if (match) return match[1];
  const match2 = text.match(/\b(\d{7,8}-[\dkK])\b/);
  if (match2) return match2[1];
  return undefined;
}

function calcularConfianza(
  sueldoBase: number,
  liquido: number,
  totalHaberes: number,
  totalDescuentos: number
): 'alta' | 'media' | 'baja' {
  if (liquido <= 0 && totalHaberes <= 0) return 'baja';
  if (liquido > 0 && sueldoBase > 0 && totalHaberes > 0) return 'alta';
  if (liquido > 0) return 'media';
  return 'baja';
}

/**
 * Extrae texto de un archivo PDF usando pdfjs-dist.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
  }

  return fullText;
}

/**
 * Extrae texto de una imagen usando Tesseract.js OCR.
 */
export async function extractTextFromImage(file: File): Promise<string> {
  const Tesseract = await import('tesseract.js');
  const { data } = await Tesseract.recognize(file, 'spa', {
    logger: (m: any) => {
      if (m.status === 'recognizing text') {
        console.log(`[OCR] Progreso: ${Math.round(m.progress * 100)}%`);
      }
    },
  });
  return data.text;
}

/**
 * Calcula el valor hora normal desde el sueldo base usando la fórmula legal chilena.
 *
 * Fórmula:
 *   valor día     = sueldoBase / 30
 *   valor mes     = valor día × 28 (días hábiles promedio)
 *   horasMensuales = horasSemanales × 4
 *   valor hora    = valor mes / horasMensuales
 *
 * Ejemplo (jornada 44h/sem):
 *   $543.034 / 30 = $18.101,13 (valor día)
 *   $18.101,13 × 28 = $506.831,64 (valor mes ajustado)
 *   $506.831,64 / 176h = $2.879,72 → valor hora normal
 *   $2.879,72 × 1,5 (50% recargo) = $4.319,58 → valor hora extra
 *
 * @param sueldoBase - Sueldo base mensual
 * @param horasSemanales - Horas de la jornada semanal (default: 44 para jornada completa estándar)
 * @returns Valor hora normal (sin recargo)
 */
export function calcularValorHoraDesdeSueldo(sueldoBase: number, horasSemanales: number = 44): number {
  if (sueldoBase <= 0 || horasSemanales <= 0) return 0;
  // Fórmula chilena: sueldoBase / 30 (días) * 28 (días hábiles) / (horasSemanales * 4)
  const horasMensuales = horasSemanales * 4;
  return (sueldoBase / 30) * 28 / horasMensuales;
}

/**
 * Parsea automáticamente un archivo (PDF o imagen) y devuelve los datos de la liquidación.
 */
export async function parseLiquidacionFromFile(file: File): Promise<{
  datos: DatosLiquidacion;
  texto: string;
  tipo: 'pdf' | 'image';
}> {
  const tipo = file.type === 'application/pdf' ? 'pdf' : 'image';
  let texto: string;

  if (tipo === 'pdf') {
    texto = await extractTextFromPDF(file);
  } else {
    texto = await extractTextFromImage(file);
  }

  console.log('[Parser] Texto extraído:', texto.slice(0, 500));
  const datos = parseLiquidacionText(texto);
  console.log('[Parser] Datos parseados:', JSON.stringify(datos, null, 2));

  return { datos, texto, tipo };
}
