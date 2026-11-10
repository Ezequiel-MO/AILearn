import { z } from 'zod';
import type { CapaSpec } from '../engine/labs/capa';
import type { LabGoal } from '../engine/labs';
import { atencionSchema } from './labs/atencion';
import { compresionSchema } from './labs/compresion';
import { descensoSchema } from './labs/descenso';
import { loraSchema } from './labs/lora';

/**
 * Esquemas de los laboratorios (`src/engine/labs`): uno por `kind`, con la misma forma que su `Spec`
 * del motor. Una pregunta `laboratorio` lleva un laboratorio, sus metas y un estado que las cumple.
 */

const id = z.string().min(1);
const pair = z.tuple([z.number(), z.number()]);

export const capaSchema = z
  .strictObject({
    kind: z.literal('capa'),
    range: z.number().positive(),
    snap: z.number().positive(),
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
    i: pair,
    j: pair,
    movable: z.enum(['ij', 'i', 'j', 'none']).optional(),
    before: z.strictObject({ i: pair, j: pair }).optional(),
    readout: z.strictObject({ w: pair, b: z.number() }).optional(),
    probe: z
      .strictObject({
        x: z.number(),
        y: z.number(),
        movable: z.boolean(),
        on: z.enum(['input', 'output']).optional(),
      })
      .optional(),
    targets: z.record(id, pair).optional(),
    pair: z.tuple([id, id]).optional(),
    iterate: z.number().int().min(1).max(8).optional(),
    circle: z.literal(true).optional(),
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
    for (const name of s.pair ?? []) {
      if (!ids.has(name)) issue(['pair'], `pair nombra un punto inexistente: ${name}`);
    }
    if (s.iterate !== undefined && !s.probe) issue(['iterate'], 'iterate exige probe');
  }) satisfies z.ZodType<CapaSpec>;

/** Todo laboratorio: el esquema de cada `kind` vive en `./labs/<kind>.ts` (el de `capa`, aquí arriba). */
export const labSpecSchema = z.discriminatedUnion('kind', [
  capaSchema,
  atencionSchema,
  compresionSchema,
  descensoSchema,
  loraSchema,
]);

/**
 * Una meta del laboratorio, con el rótulo que ve el jugador en su medidor: «Aciertos de la neurona
 * siguiente», «Palabras que ya no se distinguen»… El medidor enseña el valor en vivo y el objetivo.
 */
export const labGoalSchema = z
  .strictObject({
    metric: z.string().min(1),
    op: z.enum(['gte', 'lte', 'eq']),
    target: z.number(),
    tol: z.number().min(0).optional(),
    /** Lo que se mide, dicho para el jugador. Sin el número objetivo: el medidor ya lo enseña. */
    label: z.string().min(3),
    /** Cómo se escribe el valor: decimal (por defecto), `percent` (0,75 → 75 %) o `integer`. */
    format: z.enum(['percent', 'integer']).optional(),
  })
  .superRefine((g, ctx) => {
    if (g.op !== 'eq' && g.tol !== undefined) {
      ctx.addIssue({ code: 'custom', path: ['tol'], message: 'tol solo acompaña a op: eq' });
    }
  }) satisfies z.ZodType<LabGoal>;

/** Estado de los mandos, por id. */
export const labStateSchema = z.record(z.string().min(1), z.number());

export type LabGoalSpec = z.infer<typeof labGoalSchema>;
