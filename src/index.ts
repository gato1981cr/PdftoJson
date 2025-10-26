import { pdfToImages } from "./pipelines/pdfToImages";
import { ocrPage } from "./pipelines/ocrPage";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";

async function main() {
  const pdfPath = process.argv[2] || "input/EstadoCuentaOCT2025.pdf";
  const base = basename(pdfPath, ".pdf");
  const outDir = join("output", base);
  mkdirSync(outDir, { recursive: true });

  console.log("[INFO] Convirtiendo PDF a imágenes...");
  const pages = await pdfToImages(pdfPath, outDir);

  console.log(`[INFO] OCR de ${pages.length} páginas...`);
  const allText: string[] = [];
  for (const page of pages) {
    const txt = await ocrPage(page);
    allText.push(`\n=== Página ${page} ===\n${txt}`);
  }

  const outTxt = join(outDir, `${base}-ocr.txt`);
  writeFileSync(outTxt, allText.join("\n"), "utf8");
  console.log(`[OK] OCR completado → ${outTxt}`);
}

main().catch(err => {
  console.error("[ERROR]", err);
  process.exit(1);
});
