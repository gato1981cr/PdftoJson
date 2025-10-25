import type { Block } from "@aws-sdk/client-textract";
import type { TxRowT } from "../domain/schema.js";

// Utilidad: tomar BLOCKS de Textract y devolver filas con textos crudos por columnas.
// Aquí asumimos que el estado de cuenta tiene columnas típicas: Fecha | Descripción | Ref | Débito | Crédito | Saldo.
// Si los headers exactos no aparecen, ordenamos por ColumnIndex y luego mapeamos heurísticamente.
export function rowsFromTextractBlocks(blocks: Block[]): Array<Partial<TxRowT>> {
  const byId = new Map(blocks.map(b => [b.Id!, b]));
  const tables = blocks.filter(b => b.BlockType === "TABLE");

  const out: Array<Partial<TxRowT>> = [];

  for (const tbl of tables) {
    const cells: { row: number; col: number; text: string; page?: number }[] = [];

    const child = tbl.Relationships?.find(r => r.Type === "CHILD");
    const cellIds = child?.Ids ?? [];

    for (const cid of cellIds) {
      const cell = byId.get(cid!);
      if (!cell || cell.BlockType !== "CELL") continue;

      let text = "";
      const words = cell.Relationships?.find(r => r.Type === "CHILD")?.Ids ?? [];
      for (const wid of words) {
        const w = byId.get(wid!);
        if (w?.BlockType === "WORD" && w.Text) {
          text += (text ? " " : "") + w.Text;
        }
      }
      cells.push({
        row: cell.RowIndex ?? 0,
        col: cell.ColumnIndex ?? 0,
        text,
        page: cell.Page
      });
    }

    // Agrupar por fila:
    const rowsMap = new Map<number, { date: string | null, description: string | null, reference: string | null, debit: string | null, credit: string | null, balance: string | null, page?: number }>();
    for (const c of cells) {
      const r = rowsMap.get(c.row) ?? { date: null, description: null, reference: null, debit: null, credit: null, balance: null, page: c.page };
      // Heurística por índice de columna:
      // 1: fecha, 2: desc, 3: ref, 4: débito, 5: crédito, 6: saldo (ajusta si tu tabla varía)
      if (c.col === 1) r.date = c.text;
      else if (c.col === 2) r.description = concatSafe(r.description, c.text);
      else if (c.col === 3) r.reference = c.text;
      else if (c.col === 4) r.debit = c.text;
      else if (c.col === 5) r.credit = c.text;
      else if (c.col === 6) r.balance = c.text;

      rowsMap.set(c.row, r);
    }

    // Empujar filas no vacías y descartar encabezados por heurística
    for (const [_, r] of rowsMap) {
      const joined = [r.date, r.description, r.reference, r.debit, r.credit, r.balance].filter(Boolean).join("");
      if (!joined) continue;
      if (/fecha|descrip|d[eé]bito|cr[eé]dito|saldo|doc|ref/i.test(joined)) continue; // huele a header

      out.push({
        date: r.date ?? null,
        description: r.description ?? "",
        reference: r.reference ?? null,
        debit: r.debit as any,
        credit: r.credit as any,
        balance: r.balance as any,
        page: r.page ?? null
      });
    }
  }

  return out;
}

function concatSafe(a: string | null, b: string) {
  if (!a) return b;
  return (a + " " + b).replace(/\s+/g, " ").trim();
}
