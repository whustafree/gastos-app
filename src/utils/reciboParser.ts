/**
 * Parser de Liquidación de Sueldo Chilena
 *
 * Soporta extraer datos desde:
 * - Texto plano (extraído de PDF con pdfjs-dist)
 * - Texto de OCR (extraído de imagen con Tesseract.js)
 *
 * Campos típicos de una liquidación chilena:
 * - Sueldo base, Horas extras, Bonos, Colación, Movilización
 * - AFP (10% + comisión), Salud (7% Fonasa o % Isapre)
 * - AFC (Seguro de Cesantía, 3%)
 * - Impuesto Único (si corresponde)
 * - Líquido a pagar
 */

export interface DatosLiquidacion {
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
  mes?: number;
  anio?: number;
}

function extractNumber(text: string, patterns: RegExp[]): number {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const num = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
      if (!isNaN(num)) return num;
    }
  }
  return 0;
}

function cleanText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parsea el texto extraído de una liquidación de sueldo chilena.
 * Funciona tanto para texto de PDF como de OCR.
 */
export function parseLiquidacionText(rawText: string): DatosLiquidacion {
  const text = cleanText(rawText);

  // Helper para buscar valores cercanos a una palabra clave
  function findValue(keywords: string[], defaultValue = 0): number {
    for (const kw of keywords) {
      // Buscar: "Palabra $1.234" o "Palabra 1.234" 
      const patterns = [
        new RegExp(`${kw}[^\\d]*?\\$?\\s*([\\d.,]+)`, 'i'),
        new RegExp(`${kw}[\\s\\S]{0,30}?\\$?\\s*([\\d.,]+)`, 'i'),
      ];
      for (const p of patterns) {
        const m = text.match(p);
        if (m && m[1]) {
          const val = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
          if (!isNaN(val)) return val;
        }
      }
    }
    return defaultValue;
  }

  // Buscar sueldo base
  const sueldoBase = findValue([
    'sueldo base', 'sueldo', 'base', 'sueldo basal',
    'remuneracion base', 'remuneracion basal',
  ]);

  // Horas extras
  const horasExtras = findValue([
    'horas extras', 'horas extra', 'hras extras',
    'hrs extras', 'horas extraordinarias',
  ]);

  // Bonos
  const bonos = findValue([
    'bonos?', 'bono', 'gratificacion', 'gratif',
    'colacion', 'movilizacion', 'colacion movilizacion',
  ]);

  // Otros haberes
  const otrosHaberes = findValue([
    'otros haberes', 'otros', 'asignacion',
  ]);

  // Total haberes
  const totalHaberes = findValue([
    'total haberes', 'total haber', 'total remuneracional',
    'total impositivo', 'total remuneraciones',
  ]);

  // AFP
  const afp = findValue([
    'afp', 'administradora de fondos', 'capital', 'cuprum',
    'habitat', 'provida', 'modelo', 'planvital', 'uno',
  ]);

  // Salud (Fonasa 7% o Isapre)
  const salud = findValue([
    'salud', 'fonasa', 'isapre', 'salud total',
  ]);

  // AFC (Seguro de Cesantía)
  const afc = findValue([
    'afc', 'seguro de cesantia', 'cesantia',
    'seguro cesantia',
  ]);

  // Impuesto Único
  const impuestoUnico = findValue([
    'impuesto unico', 'impuesto a la renta', 'impuesto',
    'impuesto unico segunda categoria', 'impuesto unico 2da',
  ]);

  // Total descuentos
  const totalDescuentos = !isNaN(parseFloat(text.match(/total descuentos?[^$]*?\$?\s*([\d.,]+)/i)?.[1]?.replace(/\./g, '').replace(',', '.') ?? ''))
    ? parseFloat(text.match(/total descuentos?[^$]*?\$?\s*([\d.,]+)/i)?.[1]!.replace(/\./g, '').replace(',', '.')!)
    : findValue(['total descuentos', 'total desc', 'descuentos total']);

  // Líquido a pagar
  const liquidoAPagar = findValue([
    'liquido a pagar', 'liquido', 'total a pagar', 'neto a pagar',
    'sueldo liquido', 'remuneracion liquida', 'neto',
  ]);

  // Detalle de horas extras
  let detalleHorasExtras: { cantidad: number; valorHora: number; total: number } | undefined;

  const heMatch = text.match(/(\d+)\s*(?:horas?|hrs?)\s*(?:extras?)?\s*(?:x\s*)?\$?\s*([\d.,]+)/i);
  if (heMatch) {
    const cantidad = parseInt(heMatch[1]!);
    const valorHora = parseFloat(heMatch[2]!.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(cantidad) && !isNaN(valorHora)) {
      detalleHorasExtras = { cantidad, valorHora, total: cantidad * valorHora };
    }
  }

  // Intentar extraer mes y año
  let mes: number | undefined;
  let anio: number | undefined;
  const fechaMatch = text.match(/(?:mes|periodo|fecha|correspondiente al?\s*mes\s*de)\s*(?:de\s+)?(\d{1,2})\s*(?:de\s+)?(?:20)?(\d{2})?\b/i);
  if (fechaMatch) {
    mes = parseInt(fechaMatch[1]!);
    if (fechaMatch[2]) {
      const y = parseInt(fechaMatch[2]);
      anio = y > 50 ? 1900 + y : 2000 + y;
    }
  }

  return {
    sueldoBase,
    horasExtras,
    bonos,
    otrosHaberes,
    totalHaberes: totalHaberes || sueldoBase + horasExtras + bonos + otrosHaberes,
    afp,
    salud,
    afc,
    impuestoUnico,
    otrosDescuentos: 0,
    totalDescuentos: totalDescuentos || afp + salud + afc + impuestoUnico,
    liquidoAPagar,
    detalleHorasExtras,
    mes,
    anio,
  };
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
 * Solo español para mejor precisión en liquidaciones chilenas.
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
  console.log('[Parser] Datos parseados:', datos);

  return { datos, texto, tipo };
}
