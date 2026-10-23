import { z } from 'zod';
import { EXERCISES_PER_PROJECT, QUESTIONS_PER_EXERCISE, type Shape } from '../engine/types';
import { METRIC_ARITY, type Metric } from '../engine/vectors';

/** Markdown; fórmulas entre $...$ y $$...$$ */
const md = z.string();
const id = z.string().min(1);
const tol = z.number().min(0);

const METRICS = [
  'x',
  'y',
  'norm',
  'distance',
  'sum_x',
  'sum_y',
  'dot',
  'cos',
  'angle',
  'proj',
  'det',
  'img_x',
  'img_y',
] as const satisfies readonly Metric[];

/** Lecturas que comparan los dos vectores de `pair`. */
const PAIR_READOUTS = ['distance', 'sum', 'dot', 'cos', 'angle', 'projection'] as const;

export const planeVectorSchema = z.strictObject({
  id,
  label: z.string(),
  x: z.number(),
  y: z.number(),
  movable: z.boolean(),
});

/** Lecturas de la matriz A cuyas columnas son los vectores de `transform.columns`. */
const TRANSFORM_READOUTS = ['matrix', 'det'] as const;

/**
 * Transformación lineal dibujada en el plano: A tiene por columnas las posiciones actuales de los
 * vectores `columns` (î y ĵ, que pueden ser móviles). `apply` son vectores cuya imagen A·v se dibuja.
 */
export const transformSchema = z.strictObject({
  columns: z.tuple([id, id]),
  apply: z.array(id).optional(),
});

export const planeSpecSchema = z
  .strictObject({
    range: z.number().positive(),
    snap: z.number().positive(),
    vectors: z.array(planeVectorSchema),
    readouts: z.array(z.enum(['components', 'norm', ...PAIR_READOUTS, ...TRANSFORM_READOUTS])),
    pair: z.tuple([z.string(), z.string()]).optional(),
    transform: transformSchema.optional(),
    /** Radio de una circunferencia centrada en el origen (la unidad, al normalizar). Solo se dibuja. */
    circle: z.number().positive().optional(),
  })
  .superRefine((p, ctx) => {
    if (p.circle !== undefined && p.circle > p.range) {
      ctx.addIssue({
        code: 'custom',
        path: ['circle'],
        message: 'circle no puede ser mayor que range',
      });
    }
    const ids = new Set(p.vectors.map((v) => v.id));
    if (ids.size !== p.vectors.length) {
      ctx.addIssue({ code: 'custom', message: 'Hay ids de vector repetidos en el plano' });
    }
    const needsPair = p.readouts.filter((r) => (PAIR_READOUTS as readonly string[]).includes(r));
    if (needsPair.length > 0 && !p.pair) {
      ctx.addIssue({
        code: 'custom',
        path: ['pair'],
        message: `pair es obligatorio si readouts incluye ${needsPair.join(', ')}`,
      });
    }
    const needsTransform = p.readouts.filter((r) =>
      (TRANSFORM_READOUTS as readonly string[]).includes(r),
    );
    if (needsTransform.length > 0 && !p.transform) {
      ctx.addIssue({
        code: 'custom',
        path: ['transform'],
        message: `transform es obligatorio si readouts incluye ${needsTransform.join(', ')}`,
      });
    }
    if (p.transform) {
      const [ci, cj] = p.transform.columns;
      for (const name of p.transform.columns) {
        if (!ids.has(name)) {
          ctx.addIssue({
            code: 'custom',
            path: ['transform', 'columns'],
            message: `transform.columns nombra un vector inexistente: ${name}`,
          });
        }
      }
      if (ci === cj) {
        ctx.addIssue({
          code: 'custom',
          path: ['transform', 'columns'],
          message: 'transform.columns necesita dos vectores distintos',
        });
      }
      (p.transform.apply ?? []).forEach((name, i) => {
        if (!ids.has(name)) {
          ctx.addIssue({
            code: 'custom',
            path: ['transform', 'apply', i],
            message: `transform.apply nombra un vector inexistente: ${name}`,
          });
        } else if (name === ci || name === cj) {
          ctx.addIssue({
            code: 'custom',
            path: ['transform', 'apply', i],
            message: `transform.apply no puede nombrar una columna de la matriz: ${name}`,
          });
        }
      });
    }
    if (p.pair) {
      for (const name of p.pair) {
        if (!ids.has(name)) {
          ctx.addIssue({
            code: 'custom',
            path: ['pair'],
            message: `pair nombra un vector inexistente: ${name}`,
          });
        }
      }
    }
  });

export const goalSchema = z
  .strictObject({
    metric: z.enum(METRICS),
    of: z.array(z.string()),
    target: z.number(),
    tol,
  })
  .superRefine((g, ctx) => {
    const arity = METRIC_ARITY[g.metric];
    if (g.of.length !== arity) {
      ctx.addIssue({
        code: 'custom',
        path: ['of'],
        message: `La métrica ${g.metric} exige ${arity} vector(es)`,
      });
    }
  });

const baseShape = { id, prompt: md, hints: z.array(md), explain: md, solution: md };

export const manipularQSchema = z
  .strictObject({
    ...baseShape,
    type: z.literal('manipular'),
    plane: planeSpecSchema,
    goals: z.array(goalSchema).min(1),
  })
  .superRefine((q, ctx) => {
    const ids = new Set(q.plane.vectors.map((v) => v.id));
    q.goals.forEach((g, i) => {
      for (const name of g.of) {
        if (!ids.has(name)) {
          ctx.addIssue({
            code: 'custom',
            path: ['goals', i, 'of'],
            message: `La meta nombra un vector inexistente: ${name}`,
          });
        }
      }
    });
  });

export const numeroQSchema = z.strictObject({
  ...baseShape,
  type: z.literal('numero'),
  answer: z.number(),
  tol,
  plane: planeSpecSchema.optional(),
});

export const vectorQSchema = z
  .strictObject({
    ...baseShape,
    type: z.literal('vector'),
    /** Con `shape`, por filas: primero la fila 1 entera, luego la 2… */
    answer: z.array(z.number()).min(1),
    tol,
    plane: planeSpecSchema.optional(),
    /** [filas, columnas]: la respuesta se teclea como matriz. La corrección no cambia. */
    shape: z.tuple([z.number().int().positive(), z.number().int().positive()]).optional(),
  })
  .superRefine((q, ctx) => {
    if (q.shape && q.shape[0] * q.shape[1] !== q.answer.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['shape'],
        message: `shape ${q.shape[0]}×${q.shape[1]} no cuadra con una respuesta de ${q.answer.length} componentes`,
      });
    }
  });

export const opcionQSchema = z
  .strictObject({
    ...baseShape,
    type: z.literal('opcion'),
    options: z.array(md).min(2),
    correct: z.number().int().min(0),
    plane: planeSpecSchema.optional(),
  })
  .superRefine((q, ctx) => {
    if (q.correct >= q.options.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['correct'],
        message: 'correct queda fuera de options',
      });
    }
  });

export const codigoQSchema = z.strictObject({
  ...baseShape,
  type: z.literal('codigo'),
  starter: z.string(),
  checks: z.string(),
  reference: z.string(),
  /**
   * Lo que miran las comprobaciones, en palabras del jugador: se enseña antes de entregar. Describe qué
   * se pide (nombre, tipo, forma, casos que se prueban), nunca el valor esperado ni el código.
   */
  requirements: z.array(md).min(1).max(6),
});

export const revisionQSchema = z
  .strictObject({
    ...baseShape,
    type: z.literal('revision'),
    format: z.enum(['codigo', 'texto']),
    lines: z.array(z.string()),
    faultyLine: z.number().int().min(0).nullable(),
  })
  .superRefine((q, ctx) => {
    if (q.faultyLine !== null && q.faultyLine >= q.lines.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['faultyLine'],
        message: 'faultyLine queda fuera de lines',
      });
    }
  });

export const questionSchema = z.discriminatedUnion('type', [
  manipularQSchema,
  numeroQSchema,
  vectorQSchema,
  opcionQSchema,
  codigoQSchema,
  revisionQSchema,
]);

/** Solo en bancos de examen. Se convierte en Question con una semilla (tarea 7). */
export const generadaQSchema = z.strictObject({
  type: z.literal('generada'),
  id,
  generator: z.string().min(1),
  params: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
});

const KIND_ORDER = ['manipular', 'calcular', 'programar'] as const;

/** Tipos de pregunta que admite cada tipo de ejercicio. */
const KIND_QUESTIONS: Record<(typeof KIND_ORDER)[number], readonly string[]> = {
  manipular: ['manipular'],
  calcular: ['numero', 'vector', 'opcion'],
  programar: ['codigo'],
};

export const exerciseSchema = z
  .strictObject({
    kind: z.enum(KIND_ORDER),
    questions: z.array(questionSchema).length(QUESTIONS_PER_EXERCISE),
  })
  .superRefine((e, ctx) => {
    e.questions.forEach((q, i) => {
      if (!KIND_QUESTIONS[e.kind].includes(q.type)) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions', i, 'type'],
          message: `Un ejercicio ${e.kind} no admite preguntas de tipo ${q.type}`,
        });
      }
    });
  });

/** El reto «Ahora tú» de una ficha del calentamiento: como una pregunta de código, pero no puntúa. */
export const warmupTaskSchema = z.strictObject({
  prompt: md,
  starter: z.string(),
  checks: z.string(),
  reference: z.string(),
});

/**
 * Una ficha del calentamiento de Python: un concepto nuevo del ejercicio «Programar», con un ejemplo que
 * se ejecuta y se edita (`example`), cambios para probar en él (`experiments`) y un reto corto (`task`).
 */
export const warmupStepSchema = z.strictObject({
  id,
  title: md,
  explain: md,
  example: z.string(),
  experiments: z.array(md).min(1),
  task: warmupTaskSchema,
});

/** Fichas del calentamiento de un proyecto. */
export const WARMUP_MAX_STEPS = 4;

export const projectSchema = z
  .strictObject({
    id,
    name: z.string(),
    sub: z.string(),
    exercises: z.array(exerciseSchema).length(EXERCISES_PER_PROJECT),
    sheets: z.array(revisionQSchema).length(3),
    /** Calentamiento de Python antes del ejercicio «Programar». No cuenta para la nota. */
    warmup: z.array(warmupStepSchema).min(1).max(WARMUP_MAX_STEPS).optional(),
  })
  .superRefine((p, ctx) => {
    const seen = new Set<string>();
    const ids = [...p.exercises.flatMap((e) => e.questions), ...p.sheets, ...(p.warmup ?? [])].map(
      (q) => q.id,
    );
    for (const qid of ids) {
      if (seen.has(qid)) {
        ctx.addIssue({
          code: 'custom',
          message: `Id de pregunta repetido dentro del proyecto ${p.id}: ${qid}`,
        });
      }
      seen.add(qid);
    }
    p.exercises.forEach((e, i) => {
      if (e.kind !== KIND_ORDER[i]) {
        ctx.addIssue({
          code: 'custom',
          path: ['exercises', i, 'kind'],
          message: `El ejercicio ${i} debe ser de tipo ${KIND_ORDER[i]}`,
        });
      }
    });
  });

export const bankEntrySchema = z.strictObject({
  project: id,
  question: z.discriminatedUnion('type', [
    manipularQSchema,
    numeroQSchema,
    vectorQSchema,
    opcionQSchema,
    codigoQSchema,
    revisionQSchema,
    generadaQSchema,
  ]),
});

export const orbitSchema = z
  .strictObject({
    name: z.string(),
    projects: z.array(projectSchema),
    examBank: z.array(bankEntrySchema),
  })
  .superRefine((c, ctx) => {
    const ids = new Set(c.projects.map((p) => p.id));
    c.examBank.forEach((e, i) => {
      if (!ids.has(e.project)) {
        ctx.addIssue({
          code: 'custom',
          path: ['examBank', i, 'project'],
          message: `El banco nombra un proyecto inexistente: ${e.project}`,
        });
      }
    });
  });

export const gameSchema = z
  .strictObject({
    id,
    title: z.string(),
    launch: z.array(questionSchema),
    orbits: z.array(orbitSchema),
  })
  .superRefine((g, ctx) => {
    const seen = new Set<string>();
    for (const p of g.orbits.flatMap((c) => c.projects)) {
      if (seen.has(p.id)) {
        ctx.addIssue({ code: 'custom', message: `Id de proyecto repetido en el juego: ${p.id}` });
      }
      seen.add(p.id);
    }
  });

export type PlaneVector = z.infer<typeof planeVectorSchema>;
export type PlaneSpec = z.infer<typeof planeSpecSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type ManipularQ = z.infer<typeof manipularQSchema>;
export type NumeroQ = z.infer<typeof numeroQSchema>;
export type VectorQ = z.infer<typeof vectorQSchema>;
export type OpcionQ = z.infer<typeof opcionQSchema>;
export type CodigoQ = z.infer<typeof codigoQSchema>;
export type RevisionQ = z.infer<typeof revisionQSchema>;
export type Question = z.infer<typeof questionSchema>;
export type GeneradaQ = z.infer<typeof generadaQSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type WarmupTask = z.infer<typeof warmupTaskSchema>;
export type WarmupStep = z.infer<typeof warmupStepSchema>;
export type Project = z.infer<typeof projectSchema>;
export type BankEntry = z.infer<typeof bankEntrySchema>;
export type Orbit = z.infer<typeof orbitSchema>;
export type Game = z.infer<typeof gameSchema>;

export const toShape = (game: Game): Shape => ({
  orbits: game.orbits.map((c) => ({
    projects: c.projects.map((p) => ({ id: p.id, sheetIds: p.sheets.map((s) => s.id) })),
  })),
});
