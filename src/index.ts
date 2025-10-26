import { pdfToImages } from "./pipelines/pdfToImages";
import { ocrPage } from "./pipelines/ocrPage";
import { parseMutualAccount } from "./parsers/parseMutualAccount"; // 🔽 NUEVO
import { writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";

async function processPdf(pdfPath: string) {
  const base = basename(pdfPath, ".pdf");
  const outDir = join("output", base);
  mkdirSync(outDir, { recursive: true });

  console.log(`[INFO] Convirtiendo "${base}" a imágenes...`);
  const pages = await pdfToImages(pdfPath, outDir);

  console.log(`[INFO] OCR de ${pages.length} páginas (${base})...`);
  const allText: string[] = [];

  for (const [i, page] of pages.entries()) {
    console.log(`  → Página ${i + 1}/${pages.length}`);
    try {
      const txt = await ocrPage(page);
      allText.push(`\n=== Página ${i + 1} ===\n${txt}`);
    } catch (err) {
      console.error(`[ERROR] Fallo en página ${i + 1}:`, err);
    }
  }

  // 1️⃣ Genera el TXT consolidado
  const outTxt = join(outDir, `${base}-ocr.txt`);
  writeFileSync(outTxt, allText.join("\n"), "utf8");
  console.log(`[OK] OCR completado → ${outTxt}`);

  // 2️⃣ 🔽 NUEVO PASO: parsear el texto y crear JSON
  try {
    const txs = parseMutualAccount(outTxt);
    const result = {
      account: {
        holder: "JOHAN ENRIQUE GONZALEZ MOREIRA",
        currency: "CRC",
        period: { from: "2025-10-01", to: "2025-10-31" },
        source_file: basename(pdfPath)
      },
      transactions: txs
    };
    const outJson = join(outDir, `${base}.json`);
    writeFileSync(outJson, JSON.stringify(result, null, 2), "utf8");
    console.log(`[OK] JSON generado → ${outJson}\n`);
  } catch (err) {
    console.error("[ERROR] Fallo al generar JSON:", err);
  }
}

async function main() {
  const inputDir = "input";
  const files = readdirSync(inputDir)
    .filter(f => f.toLowerCase().endsWith(".pdf"))
    .map(f => join(inputDir, f))
    .filter(f => statSync(f).isFile());

  if (files.length === 0) {
    console.log("[INFO] No se encontraron PDFs en la carpeta input/");
    return;
  }

  console.log(`[INFO] Se encontraron ${files.length} archivo(s) PDF.\n`);
  for (const pdf of files) {
    await processPdf(pdf);
  }

  console.log("[✅] Proceso finalizado para todos los archivos.");
}

main().catch(err => {
  console.error("[ERROR]", err);
  process.exit(1);
});
