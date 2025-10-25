import type { TxRowT } from "../domain/schema.js";

// Respaldo si Textract no devuelve TABLES correctas.
// Implementamos una heurística simple basada en texto plano extraído del PDF:
// - dividir por líneas
// - buscar líneas que comiencen con fecha y terminen con un monto
// Esto NO es perfecto para todos los bancos, pero sirve como fallback local.
export function heuristicRowsFromLines(text: string): Array<Partial<TxRowT>> {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows: Array<Partial<TxRowT>> = [];

  const dateRe = /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}-\d{2}-\d{2})/;
  const amountRe = /(-?\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d+)?|-?\d+(?:[\.,]\d+)?)(?:\s*$)/;

  for (const line of lines) {
    const dmatch = line.match(dateRe);
    const amatch = line.match(amountRe);
    if (dmatch && amatch) {
      const dateRaw = dmatch[1];
      // normalize date a YYYY-MM-DD si posible (simple)
      let date = dateRaw;
      const parts = dateRaw.split(/[\/\-.]/);
      if (parts.length === 3) {
        // heurística: si el primer componente tiene 4 dígitos, asumimos YYYY-MM-DD
        if (parts[0].length === 4) {
          date = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
        } else {
          // DD/MM/YYYY -> YYYY-MM-DD (si el año tiene 4 dígitos)
          const [a, b, c] = parts;
          if (c.length === 4) date = `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
        }
      }

      // extraer monto y normalizar a number (reemplazar comas decimales)
      let amtStr = amatch[1];
      // Si hay separadores de miles con punto y decimales con coma, intentar normalizar
      amtStr = amtStr.replace(/\s/g, "");
      const commaCount = (amtStr.match(/,/g) || []).length;
      const dotCount = (amtStr.match(/\./g) || []).length;
      let n: number | null = null;
      try {
        if (commaCount > 0 && dotCount === 0) {
          // e.g. 1.234,56 represented as 1.234,56 or 1234,56
          n = Number(amtStr.replace(/\./g, "").replace(/,/g, "."));
        } else {
          n = Number(amtStr.replace(/,/g, ""));
        }
        if (Number.isNaN(n)) n = null;
      } catch {
        n = null;
      }

      // descripción: el texto entre fecha y el monto
      const desc = line.slice(dmatch[0].length, line.length - amatch[0].length).trim();

      const row: Partial<TxRowT> = {
        date: date ?? null,
        description: desc || "",
        reference: null,
        debit: null,
        credit: null,
        balance: null,
        type: null,
        page: null,
        confidence: null
      };

      if (n != null) {
        // heurística simple: si el monto es negativo, es débito; si positivo, crédito
        if (n < 0) {
          row.debit = Math.abs(n);
          row.type = "debit";
        } else {
          row.credit = n;
          row.type = "credit";
        }
      }

      rows.push(row);
    }
  }

  return rows;
}
