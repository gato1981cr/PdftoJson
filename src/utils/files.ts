import fg from "fast-glob";
import { basename, extname, join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

export async function listPdfFiles(inputDir = "input"): Promise<string[]> {
  return fg([`${inputDir}/**/*.pdf`, `${inputDir}/**/*.PDF`], { dot: false });
}

export function outputPathFor(pdfPath: string, outputDir = "output") {
  const base = basename(pdfPath, extname(pdfPath));
  mkdirSync(outputDir, { recursive: true });
  return join(outputDir, `${base}.json`);
}

export function writeJson(path: string, data: unknown) {
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}
