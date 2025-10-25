import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
dayjs.extend(customParseFormat);

// Intenta DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD y variantes
const formats = ["DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD", "DD MMM YYYY", "D/M/YYYY", "D-M-YYYY"];

export function parseDate(raw?: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim().replace(/\s+/g, " ");
  for (const f of formats) {
    const d = dayjs(s, f, true);
    if (d.isValid()) return d.format("YYYY-MM-DD");
  }
  // fallback laxo
  const dl = dayjs(s);
  return dl.isValid() ? dl.format("YYYY-MM-DD") : null;
}
