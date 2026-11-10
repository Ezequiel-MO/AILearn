import { z } from 'zod';
import type { CompresionSpec } from '../../engine/labs/compresion';

/** Esquema del laboratorio «compresion» (`src/engine/labs/compresion.ts`). */
export const compresionSchema = z
  .strictObject({
    kind: z.literal('compresion'),
    rows: z.array(z.array(z.number()).min(2).max(16)).min(2).max(16),
    signed: z.literal(true).optional(),
    mode: z.enum(['top', 'pick']).optional(),
    start: z.number().int().min(0).optional(),
    labels: z
      .strictObject({
        rows: z.array(z.string().min(1)).optional(),
        cols: z.array(z.string().min(1)).optional(),
      })
      .optional(),
    caption: z.string().min(1).optional(),
    readouts: z.array(z.string().min(1)).optional(),
  })
  .superRefine((s, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });
    const m = s.rows.length;
    const n = s.rows[0]?.length ?? 0;
    if (s.rows.some((r) => r.length !== n)) issue(['rows'], 'Todas las filas miden lo mismo');
    if (!s.signed && s.rows.some((r) => r.some((x) => x < 0 || x > 1))) {
      issue(['rows'], 'Una imagen lleva valores entre 0 y 1 (si tiene signo, pon signed)');
    }
    if (s.rows.every((r) => r.every((x) => x === 0)))
      issue(['rows'], 'La matriz no puede ser cero');
    if (s.start !== undefined && s.start > Math.min(m, n)) {
      issue(['start'], `start no puede pasar de ${Math.min(m, n)} capas`);
    }
    if (s.labels?.rows && s.labels.rows.length !== m) {
      issue(['labels', 'rows'], `Hacen falta ${m} rótulos de fila`);
    }
    if (s.labels?.cols && s.labels.cols.length !== n) {
      issue(['labels', 'cols'], `Hacen falta ${n} rótulos de columna`);
    }
  }) satisfies z.ZodType<CompresionSpec>;
