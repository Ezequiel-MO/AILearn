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
] as const satisfies readonly Metric[];

export const planeVectorSchema = z.strictObject({
  id,
  label: z.string(),
  x: z.number(),
  y: z.number(),
  movable: z.boolean(),
});

export const planeSpecSchema = z
  .strictObject({
    range: z.number().positive(),
    snap: z.number().positive(),
    vectors: z.array(planeVectorSchema),
    readouts: z.array(z.enum(['components', 'norm', 'distance', 'sum'])),
    pair: z.tuple([z.string(), z.string()]).optional(),
  })
  .superRefine((p, ctx) => {
    const ids = new Set(p.vectors.map((v) => v.id));
    if (ids.size !== p.vectors.length) {
      ctx.addIssue({ code: 'custom', message: 'Hay ids de vector repetidos en el plano' });
    }
    if ((p.readouts.includes('distance') || p.readouts.includes('sum')) && !p.pair) {
      ctx.addIssue({
        code: 'custom',
        path: ['pair'],
        message: 'pair es obligatorio si readouts incluye distance o sum',
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

export const vectorQSchema = z.strictObject({
  ...baseShape,
  type: z.literal('vector'),
  answer: z.array(z.number()).min(1),
  tol,
  plane: planeSpecSchema.optional(),
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

export const projectSchema = z
  .strictObject({
    id,
    name: z.string(),
    sub: z.string(),
    exercises: z.array(exerciseSchema).length(EXERCISES_PER_PROJECT),
    sheets: z.array(revisionQSchema).length(3),
  })
  .superRefine((p, ctx) => {
    const seen = new Set<string>();
    const ids = [...p.exercises.flatMap((e) => e.questions), ...p.sheets].map((q) => q.id);
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
export type Project = z.infer<typeof projectSchema>;
export type BankEntry = z.infer<typeof bankEntrySchema>;
export type Orbit = z.infer<typeof orbitSchema>;
export type Game = z.infer<typeof gameSchema>;

export const toShape = (game: Game): Shape => ({
  orbits: game.orbits.map((c) => ({
    projects: c.projects.map((p) => ({ id: p.id, sheetIds: p.sheets.map((s) => s.id) })),
  })),
});
