import type { StatementT, TxRowT } from "../domain/schema.js";
import { Statement } from "../domain/schema.js";
import { normalizeRow, validateRunningBalance } from "../domain/normalization.js";
import { rowsFromTextractBlocks } from "../parsers/textract-table.js";
import { heuristicRowsFromLines } from "../parsers/heuristics.js";

export function buildStatement(
  sourceFile: string,
  blocks: any[],
  opts?: { defaultCurrency?: string },
  rawText?: string
): StatementT {
  // 1) Filas desde Textract (si no, fallback heurístico después)
  let rawRows = rowsFromTextractBlocks(blocks);
  if ((!rawRows || rawRows.length === 0) && rawText) {
    // usar heurísticas sobre el texto plano extraído del PDF
    rawRows = heuristicRowsFromLines(rawText);
  }

  // 2) Normalizar
  const rows: TxRowT[] = rawRows.map(normalizeRow);

  // 3) Calcular/validar saldos
  const opening = inferOpeningBalance(rows);
  const issues = validateRunningBalance(rows, opening);

  // 4) Armar JSON final
  const st = {
    account: {
      holder: null,
      number: null,
      currency: opts?.defaultCurrency ?? process.env.DEFAULT_CURRENCY ?? null,
      period: { from: null, to: null },
      opening_balance: opening,
      closing_balance: inferClosingBalance(rows),
      source_file: sourceFile
    },
    transactions: rows,
    issues
  };

  // Validación con Zod (opcional pero recomendado)
  return Statement.parse(st);
}

function inferOpeningBalance(rows: TxRowT[]): number | null {
  // Heurística simple: si la primera fila trae balance, úsalo como "saldo después de la primera transacción".
  // Para rigor, podrías buscar una fila con "Saldo inicial" en descripción.
  if (rows.length && rows[0].balance != null) {
    // No siempre es "opening", pero nos sirve para validar en cascada.
    return null;
  }
  return null;
}

function inferClosingBalance(rows: TxRowT[]): number | null {
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].balance != null) return rows[i].balance;
  }
  return null;
}
