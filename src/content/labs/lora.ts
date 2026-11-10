import { z } from 'zod';
import type { LoraSpec } from '../../engine/labs/lora';

const id = z.string().min(1);
const pair = z.tuple([z.number(), z.number()]);

export const loraSchema = z
  .strictObject({
    kind: z.literal('lora'),
    range: z.number().positive(),
    points: z
      .array(
        z.strictObject({
          id,
          label: z.string().min(1),
          x: z.number(),
          y: z.number(),
          group: z.number().int().min(0).max(3).optional(),
        }),
      )
      .min(1)
      .max(14),
    groups: z.array(z.string().min(1)).min(1).max(4).optional(),
    axes: z.tuple([z.string().min(1), z.string().min(1)]).optional(),
    w: z.strictObject({ i: pair, j: pair }),
    mode: z.enum(['lora', 'full']).optional(),
    limit: z.number().positive(),
    step: z.number().positive(),
    start: z.array(z.number()).length(4).optional(),
    readout: z.strictObject({ w: pair, b: z.number() }).optional(),
    targets: z.record(id, pair).optional(),
    size: z
      .strictObject({
        d: z.number().int().min(1).max(1_000_000),
        k: z.number().int().min(1).max(1_000_000),
        r: z.strictObject({
          min: z.number().int().min(1),
          max: z.number().int().min(1).max(1_000_000),
          step: z.number().int().min(1),
          start: z.number().int().min(1),
        }),
      })
      .optional(),
    readouts: z.array(z.string().min(1)).optional(),
  })
  .superRefine((s, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });
    const ids = new Set(s.points.map((p) => p.id));
    if (ids.size !== s.points.length) issue(['points'], 'Hay ids de punto repetidos');
    const groups = s.groups?.length ?? 0;
    s.points.forEach((p, k) => {
      if (p.group !== undefined && p.group >= groups) {
        issue(['points', k, 'group'], `El grupo ${p.group} no está en groups`);
      }
    });
    if (s.readout) {
      if (groups < 2) issue(['readout'], 'readout exige al menos dos grupos');
      if (s.readout.w[0] === 0 && s.readout.w[1] === 0) issue(['readout', 'w'], 'w no puede ser 0');
    }
    for (const name of Object.keys(s.targets ?? {})) {
      if (!ids.has(name)) issue(['targets'], `targets nombra un punto inexistente: ${name}`);
    }
    if (s.step > s.limit) issue(['step'], 'step no puede pasar de limit');
    s.start?.forEach((v, k) => {
      if (Math.abs(v) > s.limit) issue(['start', k], 'start queda fuera de −limit a limit');
    });
    if (s.size) {
      const { min, max, step, start } = s.size.r;
      if (min > max) issue(['size', 'r'], 'r: min no puede pasar de max');
      if (start < min || start > max) issue(['size', 'r', 'start'], 'r: start fuera de min a max');
      if (step > max - min && max > min)
        issue(['size', 'r', 'step'], 'r: step mayor que el recorrido');
    }
  }) satisfies z.ZodType<LoraSpec>;
