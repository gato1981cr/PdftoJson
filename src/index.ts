import "dotenv/config";
import { listPdfFiles, outputPathFor, writeJson } from "./utils/files.js";
import { log } from "./utils/logger.js";
import { ocrAnalyze } from "./ocr/index.js";
import { buildStatement } from "./services/extractor.js";

async function main() {
  const pdfs = await listPdfFiles("input");
  if (!pdfs.length) {
    log.warn("No se encontraron PDFs en ./input");
    process.exit(0);
  }

  for (const pdfPath of pdfs) {
    try {
      log.info(`Procesando: ${pdfPath}`);
      const { blocks, text } = await ocrAnalyze(pdfPath);
      const st = buildStatement(
        pdfPath.split("/").pop()!,
        blocks,
        { defaultCurrency: process.env.DEFAULT_CURRENCY ?? "CRC" },
        text
      );
      const outPath = outputPathFor(pdfPath, "output");
      writeJson(outPath, st);
      log.info(`OK → ${outPath}`);
    } catch (e: any) {
      log.error(`Fallo en ${pdfPath}:`, e?.message ?? e);
    }
  }
}

main().catch(e => {
  log.error("Error fatal:", e);
  process.exit(1);
});
