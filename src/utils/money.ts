export function parseMoney(raw?: string | null): number | null {
  if (!raw) return null;
  let s = raw.trim();
  if (!s) return null;

  // Quita espacios, símbolos de moneda, etc.
  s = s.replace(/\s+/g, "").replace(/[₡$¢₲€]/g, "");

  // Si termina con decimal de 2 dígitos, elimina separador de miles
  // y estandariza decimal como punto.
  if (/[.,]\d{2}$/.test(s)) {
    s = s.replace(/(?<=\d)[.,](?=\d{3}(?:[.,]|$))/g, ""); // miles
    s = s.replace(/,/g, "."); // decimal
  }

  const n = Number(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
