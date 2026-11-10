import { z } from 'zod';
import type { AtencionSpec } from '../../engine/labs/atencion';

/** Esquema del laboratorio «atención» (`src/engine/labs/atencion.ts`). */

const pair = z.tuple([z.number(), z.number()]);

export const atencionSchema = z
  .strictObject({
    kind: z.literal('atencion'),
    tokens: z
      .array(
        z.strictObject({
          id: z.string().min(1),
          text: z.string().min(1),
          key: pair,
          value: pair.optional(),
          query: pair.optional(),
        }),
      )
      .min(2)
      .max(8),
    focus: z.number().int().min(0),
    query: pair,
    movable: z.enum(['query', 'key', 'none']).optional(),
    keyOf: z.number().int().min(0).optional(),
    range: z.number().positive(),
    snap: z.number().positive(),
    temperature: z
      .strictObject({
        min: z.number().positive(),
        max: z.number().positive(),
        step: z.number().positive(),
        start: z.number().positive(),
      })
      .optional(),
    mask: z.enum(['none', 'causal', 'toggle']).optional(),
    heatmap: z.literal(true).optional(),
    readouts: z.array(z.string().min(1)).optional(),
  })
  .superRefine((s, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });
    const n = s.tokens.length;
    const ids = new Set(s.tokens.map((t) => t.id));
    if (ids.size !== n) issue(['tokens'], 'Hay ids de token repetidos');
    if (ids.has('max')) issue(['tokens'], 'El id de token «max» choca con la métrica w_max');
    if (s.focus >= n) issue(['focus'], `focus ${s.focus} no es un token (hay ${n})`);
    if (s.movable === 'key') {
      if (s.keyOf === undefined) issue(['keyOf'], 'movable «key» exige keyOf');
      else if (s.keyOf >= n) issue(['keyOf'], `keyOf ${s.keyOf} no es un token (hay ${n})`);
    } else if (s.keyOf !== undefined) {
      issue(['keyOf'], 'keyOf solo acompaña a movable «key»');
    }
    if (s.temperature) {
      const { min, max, start } = s.temperature;
      if (max <= min) issue(['temperature'], 'max debe ser mayor que min');
      if (start < min || start > max) issue(['temperature', 'start'], 'start fuera de min…max');
    }
    if (s.heatmap) {
      s.tokens.forEach((t, k) => {
        if (!t.query && k !== s.focus) {
          issue(['tokens', k, 'query'], 'heatmap exige query en todos los tokens (salvo focus)');
        }
      });
    }
    const valued = s.tokens.filter((t) => t.value).length;
    if (valued !== 0 && valued !== n)
      issue(['tokens'], 'value va en todos los tokens o en ninguno');
  }) satisfies z.ZodType<AtencionSpec>;
