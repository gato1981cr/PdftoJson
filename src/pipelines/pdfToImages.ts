import { execFile } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

export async function pdfToImages(pdfPath: string, outDir: string, dpi = 300) {
  mkdirSync(outDir, { recursive: true });
  const prefix = join(outDir, basename(pdfPath, ".pdf"));
  await execPromise("pdftoppm", ["-png", "-r", String(dpi), pdfPath, prefix]);
  return readdirSync(outDir)
    .filter(f => f.endsWith(".png"))
    .map(f => join(outDir, f));
}

function execPromise(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    execFile(cmd, args, (err) => (err ? reject(err) : resolve()));
  });
}
