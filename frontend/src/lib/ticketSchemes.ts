/**
 * Módulo de Esquemas de Boletos para Rifas Alejandro GM
 *
 * Soporta esquemas puros y deterministas:
 * - standard_100: 100 boletos individuales (00-99)
 * - triples_333: 333 boletos, 3 números por boleto (001-999, excluye 000, 999 números únicos)
 * - pairs_500: 500 boletos, 2 números por boleto (matriz 50x10, 000-999, 1000 números únicos)
 */

export type TicketSchemeType = 'standard_100' | 'triples_333' | 'pairs_500' | string;

export interface SchemeTicketData {
  index: number;
  ticket_number: string;
  numbers: string[];
  row?: number;
  col?: number;
}

export interface SchemeValidationResult {
  isValid: boolean;
  expectedUnique: number;
  uniqueNumbersCount: number;
  totalAssignedCount: number;
  duplicateCount: number;
  duplicates: string[];
  hasZero: boolean;
}

/**
 * Genera boletos para el esquema Triples (333 boletos, 3 números por boleto).
 * - N1 = i (001 a 333)
 * - N2 = i + 333 (334 a 666)
 * - N3 = 1000 - i (999 a 667)
 * El número 000 queda excluido. 999 números únicos en total.
 */
export function generateTriples333(): SchemeTicketData[] {
  const tickets: SchemeTicketData[] = [];
  for (let i = 1; i <= 333; i++) {
    const n1 = i.toString().padStart(3, '0');
    const n2 = (i + 333).toString().padStart(3, '0');
    const n3 = (1000 - i).toString().padStart(3, '0');
    const ticketNumber = i.toString().padStart(3, '0');

    tickets.push({
      index: i - 1,
      ticket_number: ticketNumber,
      numbers: [n1, n2, n3],
    });
  }
  return tickets;
}

/**
 * Genera boletos para el esquema Pares (500 boletos, 2 números por boleto).
 * Matriz lógica de 50 filas (0..49) x 10 columnas (0..9).
 * - P1 = (row * 10) + col (000 a 499)
 * - P2 = 500 + ((P1 + 12) % 500) (desfase +512, cerrando 488..499 con 500..511)
 * 1.000 números únicos en total (000 a 999) sin colisiones ni huérfanos.
 */
export function generatePairs500(): SchemeTicketData[] {
  const tickets: SchemeTicketData[] = [];
  for (let row = 0; row < 50; row++) {
    for (let col = 0; col < 10; col++) {
      const p1Val = row * 10 + col;
      const p2Val = 500 + ((p1Val + 12) % 500);

      const p1 = p1Val.toString().padStart(3, '0');
      const p2 = p2Val.toString().padStart(3, '0');
      const ticketNumber = p1Val.toString().padStart(3, '0');

      tickets.push({
        index: p1Val,
        ticket_number: ticketNumber,
        numbers: [p1, p2],
        row,
        col,
      });
    }
  }
  return tickets;
}

/**
 * Genera boletos estándar (100 boletos de 00 a 99 o N boletos estándar).
 */
export function generateStandardScheme(total: number = 100): SchemeTicketData[] {
  const tickets: SchemeTicketData[] = [];
  const padding = total > 100 ? 3 : 2;
  for (let i = 0; i < total; i++) {
    const numStr = i.toString().padStart(padding, '0');
    tickets.push({
      index: i,
      ticket_number: numStr,
      numbers: [numStr],
    });
  }
  return tickets;
}

/**
 * Genera los boletos de acuerdo al esquema seleccionado.
 */
export function generateTicketsForScheme(scheme: TicketSchemeType, totalNumbers: number = 100): SchemeTicketData[] {
  if (scheme === 'triples_333' || totalNumbers === 333) {
    return generateTriples333();
  }
  if (scheme === 'pairs_500' || totalNumbers === 500) {
    return generatePairs500();
  }
  return generateStandardScheme(totalNumbers);
}

/**
 * Validador de integridad para esquemas de boletos.
 * Comprueba que no haya números duplicados y calcula la cobertura esperada.
 */
export function validateTicketScheme(
  tickets: { numbers?: string[]; ticket_number: string }[],
  expectedScheme?: TicketSchemeType
): SchemeValidationResult {
  const seenNumbers = new Set<string>();
  const duplicates: string[] = [];
  let totalAssigned = 0;
  let hasZero = false;

  for (const t of tickets) {
    const nums = t.numbers && t.numbers.length > 0 ? t.numbers : [t.ticket_number];
    for (const num of nums) {
      totalAssigned++;
      if (num === '000' || num === '00' || num === '0') {
        hasZero = true;
      }
      if (seenNumbers.has(num)) {
        duplicates.push(num);
      } else {
        seenNumbers.add(num);
      }
    }
  }

  let expectedUnique = 100;
  if (expectedScheme === 'triples_333' || tickets.length === 333) {
    expectedUnique = 999;
  } else if (expectedScheme === 'pairs_500' || tickets.length === 500) {
    expectedUnique = 1000;
  } else {
    expectedUnique = tickets.length;
  }

  return {
    isValid: duplicates.length === 0 && seenNumbers.size === expectedUnique,
    expectedUnique,
    uniqueNumbersCount: seenNumbers.size,
    totalAssignedCount: totalAssigned,
    duplicateCount: duplicates.length,
    duplicates,
    hasZero,
  };
}

/**
 * Helper para formatear fechas de sorteos en español elegante sin desfase de zona horaria UTC.
 * Ejemplo: "2026-12-15" -> "15 dic" (año actual) o "15 dic 2026"
 */
export function formatDrawDate(isoDate?: string | null): string {
  if (!isoDate || typeof isoDate !== 'string') return '';
  const clean = isoDate.trim().split('T')[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return isoDate;

  const [yearStr, monthStr, dayStr] = parts;
  const monthIdx = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const monthName = months[monthIdx] || '';

  const currentYear = new Date().getFullYear().toString();
  if (yearStr === currentYear) {
    return `${day} ${monthName}`;
  }
  return `${day} ${monthName} ${yearStr}`;
}
