import { readFileSync } from "node:fs";

export interface Transaction {
  date: string;
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
}

/**
 * Parsea el texto OCR del estado de cuenta de Grupo Mutual,
 * corrige errores comunes de OCR y valida los saldos.
 */
export function parseMutualAccount(txtPath: string) {
  const raw = readFileSync(txtPath, "utf8")
    .replace(/\r/g, "")
    .replace(/[£€₡]/g, "") // limpia símbolos mal interpretados
    .replace(/,/g, "") // elimina separadores de miles
    .replace(/\s+/g, " ") // normaliza espacios
    .trim();

  const lines = raw.split(/\n|(?=\d{2}\/\d{2}\/\d{4})/g);
  const txs: Transaction[] = [];

  // Regex flexible: fecha + algo de texto + tres montos al final
  const regex =
    /(\d{2}\/\d{2}\/\d{4})\s+(\d+)?\s*([A-Z0-9ÑÁÉÍÓÚÜa-z\-().,;:+*\/' ]+?)\s+(-?\d+\.\d{2})\s+(-?\d+\.\d{2})\s+(-?\d+\.\d{2})/;

  for (const line of lines) {
    const fixed = repairTokens(line);
    const m = fixed.match(regex);
    if (!m) continue;

    const [, date, , desc, debStr, credStr, balStr] = m;
    const debit = crToNumber(debStr);
    const credit = crToNumber(credStr);
    const balance = crToNumber(balStr);

    txs.push({
      date: normalizeDate(date),
      description: desc.trim(),
      debit: isNaN(debit) ? null : debit,
      credit: isNaN(credit) ? null : credit,
      balance: isNaN(balance) ? null : balance,
    });
  }

  // Corrige valores inconsistentes por error OCR (ej. crédito=20.00)
  return fixByBalance(txs);
}

/**
 * Normaliza fechas al formato ISO yyyy-mm-dd
 */
function normalizeDate(d: string) {
  const [dd, mm, yyyy] = d.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Corrige errores OCR comunes antes del parseo numérico.
 */
function repairTokens(s: string) {
  return s
    // Letras mal leídas
    .replace(/[Oo]/g, "0")
    .replace(/[lI]/g, "1")
    .replace(/S/g, "5")
    // Monedas pegadas a 0.00
    .replace(/(?:₡|¢|£|€)\s*0([,.]?)00\b/g, "0$100")
    // Corrige falsos 20.00 (OCR de ₡0.00)
    .replace(/(?<=\s)20([,.]?)00\b/g, "0$100");
}

/**
 * Convierte texto numérico (posiblemente sucio por OCR) a número real.
 */
function crToNumber(s: string): number {
  if (!s) return NaN;
  const clean = s
    .replace(/[£€₡¢]/g, "")
    .replace(/[Oo]/g, "0")
    .replace(/[lI]/g, "1")
    .replace(/S/g, "5")
    .replace(/\s/g, "")
    // quita puntos de miles (deja el último para decimales)
    .replace(/\.(?=.*\.)/g, "")
    // coma decimal → punto
    .replace(/,(?=\d{2}$)/, ".");
  const n = Number(clean);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Revisa la secuencia de transacciones y corrige montos
 * incoherentes con el saldo reportado (ej. credit=20.00).
 */
export function fixByBalance(txs: Transaction[]): Transaction[] {
  for (let i = 1; i < txs.length; i++) {
    const prev = txs[i - 1];
    const cur = txs[i];
    if (prev.balance == null || cur.balance == null) continue;

    const prevBal = prev.balance;
    const curBal = cur.balance;
    const debit = cur.debit ?? 0;
    const credit = cur.credit ?? 0;

    // Si ambos > 0, determinamos cuál debería ser 0 según saldo
    if (debit > 0 && credit > 0) {
      const diffIfDebit0 = Math.abs(prevBal - 0 + credit - curBal);
      const diffIfCredit0 = Math.abs(prevBal - debit + 0 - curBal);
      if (diffIfCredit0 < diffIfDebit0) cur.credit = 0;
      else cur.debit = 0;
    }

    // Caso típico: credit = 20.00 por OCR
    if (credit === 20) {
      const expected = round2(prevBal - debit + 0);
      if (Math.abs(expected - curBal) < 0.5) cur.credit = 0;
    }

    // Caso simétrico: debit = 20.00 por OCR
    if (debit === 20) {
      const expected = round2(prevBal - 0 + credit);
      if (Math.abs(expected - curBal) < 0.5) cur.debit = 0;
    }
  }

  return txs;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
