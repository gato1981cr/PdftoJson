import { readFileSync } from "node:fs";

export interface Transaction {
  date: string;
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
}

export function parseMutualAccount(txtPath: string) {
  const raw = readFileSync(txtPath, "utf8")
    .replace(/\r/g, "")
    .replace(/£|€|₡/g, "")   // limpia símbolos erróneos
    .replace(/,/g, "")       // elimina separadores de miles
    .replace(/\s+/g, " ")    // normaliza espacios
    .trim();

  const lines = raw.split(/\n|(?=\d{2}\/\d{2}\/\d{4})/g);
  const txs: Transaction[] = [];

  const regex = /(\d{2}\/\d{2}\/\d{4})\s+(\d+)?\s*([A-Z0-9ÑÁÉÍÓÚÜa-z\-().,;:+*\/' ]+?)\s+(-?\d+\.\d{2})\s+(-?\d+\.\d{2})\s+(-?\d+\.\d{2})/;

  for (const line of lines) {
    const m = line.match(regex);
    if (!m) continue;

    const [, date, , desc, debitStr, creditStr, balanceStr] = m;
    const debit = parseFloat(debitStr) || null;
    const credit = parseFloat(creditStr) || null;
    const balance = parseFloat(balanceStr) || null;

    txs.push({
      date: normalizeDate(date),
      description: desc.trim(),
      debit: debit > 0 ? debit : null,
      credit: credit > 0 ? credit : null,
      balance,
    });
  }

  return txs;
}

function normalizeDate(d: string) {
  const [dd, mm, yyyy] = d.split("/");
  return `${yyyy}-${mm}-${dd}`;
}
