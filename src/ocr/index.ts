import "dotenv/config";
import { log } from "../utils/logger.js";
import { analyzeWithTextract } from "./textract.js";
import { analyzeWithLocal } from "./local.js";

export type OcrResult = { blocks: any[]; text?: string };

export async function ocrAnalyze(pdfPath: string): Promise<OcrResult> {
  const provider = process.env.OCR_PROVIDER ?? "local-pdf";
  if (provider === "aws-textract") {
    return analyzeWithTextract(pdfPath);
  }
  if (provider === "local-pdf") {
    return analyzeWithLocal(pdfPath);
  }
  // Aquí podrás agregar 'azure' o 'tesseract' más adelante.
  throw new Error(`OCR_PROVIDER "${provider}" no implementado aún. Usa OCR_PROVIDER=local-pdf o aws-textract`);
}
