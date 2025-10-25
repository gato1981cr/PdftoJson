import { parseMoney } from "../utils/money.js";
import { parseDate } from "../utils/dates.js";
import type { TxRowT } from "./schema.js";

export function normalizeRow(r: Partial<TxRowT>): TxRowT {
  const debit = parseMoney(r.debit as unknown as string ?? null);
  const credit = parseMoney(r.credit as unknown as string ?? null);
  const balance = parseMoney(r.balance as unknown as string ?? null);

  // tipo inferido
  let type: "debit" | "credit" | null = null;
  if (debit && !credit) type = "debit";
  else if (credit && !debit) type = "credit";

  return {
    date: r.date ? parseDate(r.date) : null,
    description: (r.description ?? "").replace(/\s+/g, " ").trim(),
    reference: (r.reference ?? null) || null,
    debit: debit ?? null,
    credit: credit ?? null,
    balance: balance ?? null,
    type,
    page: r.page ?? null,
    bbox: r.bbox,
    confidence: r.confidence ?? null
  };
}

export function validateRunningBalance(rows: TxRowT[], opening: number | null) {
  const issues: { type: string; page: number | null; message: string }[] = [];
  let saldo = opening;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const delta = (r.credit ?? 0) - (r.debit ?? 0);

    if (saldo != null) {
      const expected = round2(saldo + delta);
      if (r.balance != null && Math.abs(expected - r.balance) > 0.01) {
        issues.push({
          type: "BALANCE_MISMATCH",
          page: r.page ?? null,
          message: `Fila ${i}: esperado ${expected}, encontrado ${r.balance}`
        });
        // resíncrono para no propagar el error
        saldo = r.balance;
      } else {
        saldo = r.balance ?? expected;
      }
    } else if (r.balance != null) {
      saldo = r.balance;
    }
  }
  return issues;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
