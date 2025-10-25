import { log } from "../utils/logger.js";
import { basename } from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { TextractClient, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand } from "@aws-sdk/client-textract";
import { createReadStream } from "node:fs";

const region = process.env.AWS_REGION!;
const bucket = process.env.S3_BUCKET!;

const s3 = new S3Client({ region });
const textract = new TextractClient({ region });

export async function analyzeWithTextract(pdfPath: string) {
  if (!bucket) throw new Error("Falta S3_BUCKET en .env");
  const key = `ocr/${Date.now()}-${basename(pdfPath)}`;

  log.info("Subiendo a S3:", key);
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: createReadStream(pdfPath),
    ContentType: "application/pdf"
  }));

  log.info("Iniciando Textract (TABLES+LAYOUT)...");
  const start = await textract.send(new StartDocumentAnalysisCommand({
    DocumentLocation: { S3Object: { Bucket: bucket, Name: key } },
    FeatureTypes: ["TABLES", "LAYOUT"]
  }));

  const jobId = start.JobId!;
  let nextToken: string | undefined;
  let status: string | undefined;
  const blocks: any[] = [];

  for (;;) {
    const out = await textract.send(new GetDocumentAnalysisCommand({ JobId: jobId, NextToken: nextToken }));
    status = out.JobStatus;
    if (out.Blocks?.length) blocks.push(...out.Blocks);
    if (!out.NextToken && status === "SUCCEEDED") break;
    if (status === "FAILED") throw new Error("Textract falló");
    nextToken = out.NextToken;
    await sleep(1200);
  }

  log.info("Textract listo. Bloques:", blocks.length);
  return { blocks };
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
