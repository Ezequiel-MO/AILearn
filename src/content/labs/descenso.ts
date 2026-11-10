import { z } from 'zod';
import { MAX_STEPS, type DescensoSpec } from '../../engine/labs/descenso';

/** Esquema del laboratorio «descenso» (`src/engine/labs/descenso.ts`). */

const pair = z.tuple([z.number(), z.number()]);
const range = z.strictObject({
  min: z.number(),
  max: z.number(),
  step: z.number().positive(),
  start: z.number(),
});
const param = z.union([z.number(), range]);

const onGrid = (min: number, step: number, v: number): boolean => {
  const k = (v - min) / step;
  return Math.abs(k - Math.round(k)) < 1e-9;
};

export const descensoSchema = z
  .strictObject({
    kind: z.literal('descenso'),
    surface: z.discriminatedUnion('kind', [
      z.strictObject({
        kind: z.literal('quadratic'),
        a: z.number(),
        b: z.number(),
        c: z.number().optional(),
        center: pair.optional(),
      }),
      z.strictObject({
        kind: z.literal('regression'),
        data: z.array(pair).min(2).max(30),
      }),
      z.strictObject({
        kind: z.literal('wells'),
        wells: z
          .array(
            z.strictObject({
              x: z.number(),
              y: z.number(),
              depth: z.number().positive(),
              width: z.number().positive(),
            }),
          )
          .min(1)
          .max(5),
        bowl: z.number().min(0).optional(),
      }),
    ]),
    window: z.strictObject({ x: pair, y: pair }),
    axes: z.tuple([z.string().min(1), z.string().min(1)]).optional(),
    start: z.strictObject({
      x: z.number(),
      y: z.number(),
      movable: z.boolean().optional(),
      snap: z.number().positive().optional(),
    }),
    rate: param,
    steps: param,
    optimizers: z
      .array(z.enum(['sgd', 'momentum', 'rmsprop', 'adam']))
      .min(1)
      .max(4)
      .optional(),
    beta: param.optional(),
    batch: z.strictObject({ size: param, seed: z.number().int() }).optional(),
    threshold: z.number().optional(),
    readouts: z.array(z.string().min(1)).optional(),
  })
  .superRefine((s, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });
    const [x0, x1] = s.window.x;
    const [y0, y1] = s.window.y;
    if (!(x0 < x1)) issue(['window', 'x'], 'La ventana horizontal está vacía');
    if (!(y0 < y1)) issue(['window', 'y'], 'La ventana vertical está vacía');

    // Un deslizador: rango no vacío, `start` dentro y en la rejilla; y lo que cada uno exige.
    const checkParam = (
      p: number | { min: number; max: number; step: number; start: number },
      path: (string | number)[],
      opts: { min: number; max: number; integer?: boolean; maxExclusive?: boolean },
    ) => {
      const lo = typeof p === 'number' ? p : p.min;
      const hi = typeof p === 'number' ? p : p.max;
      if (typeof p !== 'number') {
        if (!(p.min < p.max)) issue(path, 'El deslizador tiene un rango vacío');
        if (p.start < p.min || p.start > p.max) issue(path, 'start queda fuera del deslizador');
        else if (!onGrid(p.min, p.step, p.start)) issue(path, 'start no está en la rejilla');
        if (opts.integer && !(Number.isInteger(p.min) && Number.isInteger(p.step))) {
          issue(path, 'Este deslizador solo admite enteros');
        }
      } else if (opts.integer && !Number.isInteger(p)) {
        issue(path, 'Debe ser un entero');
      }
      if (lo < opts.min) issue(path, `El valor mínimo es ${opts.min}`);
      if (hi > opts.max || (opts.maxExclusive && hi >= opts.max)) {
        issue(path, `El valor máximo es ${opts.max}${opts.maxExclusive ? ' (sin incluir)' : ''}`);
      }
    };
    checkParam(s.rate, ['rate'], { min: 1e-6, max: 1000 });
    checkParam(s.steps, ['steps'], { min: 1, max: MAX_STEPS, integer: true });
    if (s.beta !== undefined) checkParam(s.beta, ['beta'], { min: 0, max: 1, maxExclusive: true });

    const surface = s.surface;
    if (surface.kind === 'quadratic') {
      if (surface.a === 0 && surface.b === 0 && (surface.c ?? 0) === 0) {
        issue(['surface'], 'El paisaje es plano: a, b y c son 0');
      }
    } else if (surface.kind === 'regression') {
      if (new Set(surface.data.map((d) => d[0])).size < 2) {
        issue(['surface', 'data'], 'Los datos necesitan al menos dos x distintas');
      }
    }
    if (s.batch) {
      if (surface.kind !== 'regression') {
        issue(['batch'], 'batch solo se usa con un paisaje regression');
      } else {
        checkParam(s.batch.size, ['batch', 'size'], {
          min: 1,
          max: surface.data.length,
          integer: true,
        });
      }
    }

    if (s.start.x < x0 || s.start.x > x1 || s.start.y < y0 || s.start.y > y1) {
      issue(['start'], 'El punto de partida queda fuera de la ventana');
    }
    if (s.start.movable) {
      const snap = s.start.snap ?? 0.5;
      if (!onGrid(x0, snap, s.start.x) || !onGrid(y0, snap, s.start.y)) {
        issue(
          ['start'],
          'El punto de partida movible debe estar en la rejilla (snap) de la ventana',
        );
      }
    }
    if (s.optimizers && new Set(s.optimizers).size !== s.optimizers.length) {
      issue(['optimizers'], 'Hay optimizadores repetidos');
    }
  }) satisfies z.ZodType<DescensoSpec>;
