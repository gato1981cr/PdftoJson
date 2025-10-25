import { z } from "zod";

export const TxRow = z.object({
  date: z.string().nullable(),         // "YYYY-MM-DD"
  description: z.string(),
  reference: z.string().nullable(),
  debit: z.number().nullable(),
  credit: z.number().nullable(),
  balance: z.number().nullable(),
  type: z.enum(["debit", "credit"]).nullable(),
  page: z.number().int().positive().nullable(),
  bbox: z.any().optional(),   // dejamos flexible (coordenadas relativas)
  confidence: z.number().min(0).max(1).nullable()
});

export const Statement = z.object({
  account: z.object({
    holder: z.string().nullable(),
    number: z.string().nullable(),
    currency: z.string().nullable(),
    period: z.object({ from: z.string().nullable(), to: z.string().nullable() }),
    opening_balance: z.number().nullable(),
    closing_balance: z.number().nullable(),
    source_file: z.string()
  }),
  transactions: z.array(TxRow),
  issues: z.array(z.object({
    type: z.string(),
    page: z.number().int().positive().nullable(),
    message: z.string()
  }))
});

export type TxRowT = z.infer<typeof TxRow>;
export type StatementT = z.infer<typeof Statement>;
