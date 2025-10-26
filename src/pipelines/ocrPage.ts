import sharp from "sharp";
import tesseract from "node-tesseract-ocr";
import { join, basename } from "node:path";
import { mkdirSync } from "node:fs";

export async function ocrPage(imagePath: string) {
  mkdirSync("tmp_ocr", { recursive: true });
  const tmp = join("tmp_ocr", basename(imagePath));
  await sharp(imagePath).grayscale().normalize().threshold(180).toFile(tmp);

  const config = {
    lang: "spa",
    oem: 1,
    psm: 6
  };

  const text = await tesseract.recognize(tmp, config);
  return text;
}
