import { readFile } from "node:fs/promises";
// @ts-ignore: module has no type declarations
import pdf from "pdf-parse";
import { log } from "../utils/logger.js";

export async function analyzeWithLocal(pdfPath: string) {
  const buf = await readFile(pdfPath);
  const data = await pdf(buf as Buffer);
  const text = data.text ?? "";
  log.info("Local PDF text length:", text.length);
  // We don't produce Textract-like blocks; return text for heuristics.
  return { blocks: [], text };
}
