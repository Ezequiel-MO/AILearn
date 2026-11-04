import { z } from 'zod';
import { EXERCISES_PER_PROJECT, QUESTIONS_PER_EXERCISE, type Shape } from '../engine/types';
import {
  CURVE_METRIC_ARITY,
  FREE_POINT_METRICS,
  ON_CURVE_METRICS,
  type CurveMetric,
} from '../engine/curves';
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
  'img_angle',
  'rayleigh',
  'stretch',
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
 * Lecturas por cada vector de `transform.apply`: su imagen, el ángulo con ella, el cociente de Rayleigh y
 * el estiramiento |A·v| / |v|.
 */
const APPLY_READOUTS = ['image', 'img_angle', 'rayleigh', 'stretch'] as const;

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
    readouts: z.array(
      z.enum(['components', 'norm', ...PAIR_READOUTS, ...TRANSFORM_READOUTS, ...APPLY_READOUTS]),
    ),
    pair: z.tuple([z.string(), z.string()]).optional(),
    transform: transformSchema.optional(),
    /** Radio de una circunferencia centrada en el origen (la unidad, al normalizar). Solo se dibuja. */
    circle: z.number().positive().optional(),
    /** Dibuja la imagen por A de la circunferencia `circle`: una elipse. Solo se dibuja. */
    circleImage: z.literal(true).optional(),
  })
  .superRefine((p, ctx) => {
    if (p.circle !== undefined && p.circle > p.range) {
      ctx.addIssue({
        code: 'custom',
        path: ['circle'],
        message: 'circle no puede ser mayor que range',
      });
    }
    if (p.circleImage) {
      if (p.circle === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['circleImage'],
          message: 'circleImage exige circle',
        });
      }
      if (!p.transform) {
        ctx.addIssue({
          code: 'custom',
          path: ['circleImage'],
          message: 'circleImage exige transform',
        });
      }
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
    const needsApply = p.readouts.filter((r) => (APPLY_READOUTS as readonly string[]).includes(r));
    if (needsApply.length > 0) {
      if (!p.transform) {
        ctx.addIssue({
          code: 'custom',
          path: ['transform'],
          message: `transform es obligatorio si readouts incluye ${needsApply.join(', ')}`,
        });
      } else if ((p.transform.apply ?? []).length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['transform', 'apply'],
          message: `transform.apply necesita al menos un vector si readouts incluye ${needsApply.join(', ')}`,
        });
      }
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

// ---------- plano de curvas (juego 3) ----------

const CURVE_METRICS = [
  'x',
  'y',
  'fx',
  'slope',
  'secant',
  'line_slope',
  'line_icpt',
] as const satisfies readonly CurveMetric[];

/** Una función de una variable: polinomio por coeficientes o pérdida cuadrática media de ŷ = w·x. */
export const curveSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('poly'),
    /** f(x) = coefs[0] + coefs[1]·x + coefs[2]·x² + … */
    coefs: z.array(z.number()).min(1),
  }),
  z.strictObject({
    kind: z.literal('mse'),
    /** Pares (x, y) de los datos. La variable del plano es el parámetro w de ŷ = w·x. */
    data: z.array(z.tuple([z.number(), z.number()])).min(1),
  }),
]);

export const graphPointSchema = z
  .strictObject({
    id,
    label: z.string(),
    x: z.number(),
    /** Solo en un punto libre. Un punto `onCurve` está siempre en (x, f(x)). */
    y: z.number().optional(),
    movable: z.boolean(),
    /** El punto vive sobre la curva: se arrastra en horizontal y su altura es f(x). */
    onCurve: z.literal(true).optional(),
  })
  .superRefine((p, ctx) => {
    if (p.onCurve && p.y !== undefined) {
      ctx.addIssue({ code: 'custom', path: ['y'], message: 'Un punto onCurve no lleva y' });
    }
    if (!p.onCurve && p.y === undefined) {
      ctx.addIssue({ code: 'custom', path: ['y'], message: 'Un punto libre necesita y' });
    }
  });

/**
 * Lecturas del plano de curvas. `coords`: (x, y) de cada punto. `slope`: la pendiente de la tangente
 * en cada punto de la curva (y dibuja la tangente). `secant`: la pendiente de la secante entre los dos
 * puntos de `pair` (sobre la curva; la dibuja). `line`: pendiente y ordenada en el origen de la recta
 * por los dos puntos libres de `pair` (la dibuja con su triángulo de subida y avance).
 */
const GRAPH_READOUTS = ['coords', 'slope', 'secant', 'line'] as const;

/**
 * El plano de curvas: una ventana [x₀, x₁] × [y₀, y₁] con escalas propias en cada eje, una curva
 * opcional y puntos (sobre la curva o libres). Lo usan las preguntas `curva` y, como figura estática,
 * las de «Calcular».
 */
export const graphSpecSchema = z
  .strictObject({
    x: z.tuple([z.number(), z.number()]),
    y: z.tuple([z.number(), z.number()]),
    /** Paso de la rejilla al arrastrar: los puntos caen en múltiplos de `snap` (en x y, si son libres, en y). */
    snap: z.number().positive(),
    curve: curveSchema.optional(),
    points: z.array(graphPointSchema),
    readouts: z.array(z.enum(GRAPH_READOUTS)),
    pair: z.tuple([id, id]).optional(),
    /** Nombres de los ejes, por defecto «x» e «y» (en una pérdida, «w» y «pérdida»). */
    labels: z.strictObject({ x: z.string(), y: z.string() }).optional(),
    /** Dibuja la tangente en cada punto de la curva aunque no se lea su pendiente. */
    tangent: z.literal(true).optional(),
    /** Dibuja también la derivada f′ como una segunda curva, discontinua. */
    derivative: z.literal(true).optional(),
    /**
     * Dibuja el paso de descenso desde el punto `of` (sobre la curva): una flecha de x a
     * x − rate·f′(x) y el punto donde caería. Solo se dibuja.
     */
    step: z.strictObject({ of: id, rate: z.number().positive() }).optional(),
    /**
     * Con una curva `mse`: un segundo panel con los datos, la recta ŷ = w·x para la w del punto `of`
     * (sobre la curva) y los errores de cada dato. Solo se dibuja.
     */
    fit: z.strictObject({ of: id }).optional(),
  })
  .superRefine((g, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });
    if (!(g.x[0] < g.x[1])) issue(['x'], 'La ventana necesita x₀ < x₁');
    if (!(g.y[0] < g.y[1])) issue(['y'], 'La ventana necesita y₀ < y₁');
    const byId = new Map(g.points.map((p) => [p.id, p]));
    if (byId.size !== g.points.length) issue(['points'], 'Hay ids de punto repetidos en el plano');
    if (!g.curve && g.points.some((p) => p.onCurve)) {
      issue(['points'], 'Un punto onCurve exige curve');
    }
    if (!g.curve && (g.derivative || g.tangent)) {
      issue(['curve'], 'tangent y derivative exigen curve');
    }
    const onCurve = (name: string, path: (string | number)[], what: string) => {
      const p = byId.get(name);
      if (!p) issue(path, `${what} nombra un punto inexistente: ${name}`);
      else if (!p.onCurve) issue(path, `${what} necesita un punto sobre la curva: ${name}`);
    };
    const wantsPair = g.readouts.filter((r) => r === 'secant' || r === 'line');
    if (wantsPair.length > 1) issue(['readouts'], 'secant y line no van juntas: comparten pair');
    if (wantsPair.length > 0 && !g.pair) {
      issue(['pair'], `pair es obligatorio si readouts incluye ${wantsPair[0]}`);
    }
    if (g.pair) {
      if (g.pair[0] === g.pair[1]) issue(['pair'], 'pair necesita dos puntos distintos');
      for (const name of g.pair) {
        const p = byId.get(name);
        if (!p) issue(['pair'], `pair nombra un punto inexistente: ${name}`);
        else if (wantsPair[0] === 'secant' && !p.onCurve) {
          issue(['pair'], `La lectura secant necesita puntos sobre la curva: ${name}`);
        } else if (wantsPair[0] === 'line' && p.onCurve) {
          issue(['pair'], `La lectura line necesita puntos libres: ${name}`);
        }
      }
    }
    if (g.readouts.includes('slope') && !g.points.some((p) => p.onCurve)) {
      issue(['readouts'], 'La lectura slope necesita algún punto sobre la curva');
    }
    if (g.step) onCurve(g.step.of, ['step', 'of'], 'step');
    if (g.fit) {
      onCurve(g.fit.of, ['fit', 'of'], 'fit');
      if (g.curve?.kind !== 'mse') issue(['fit'], 'fit exige una curva mse');
    }
  });

export const curveGoalSchema = z
  .strictObject({
    metric: z.enum(CURVE_METRICS),
    of: z.array(z.string()),
    target: z.number(),
    tol,
  })
  .superRefine((g, ctx) => {
    const arity = CURVE_METRIC_ARITY[g.metric];
    if (g.of.length !== arity) {
      ctx.addIssue({
        code: 'custom',
        path: ['of'],
        message: `La métrica ${g.metric} exige ${arity} punto(s)`,
      });
    }
  });

const baseShape = { id, prompt: md, hints: z.array(md), explain: md, solution: md };

/**
 * El sentido de una pregunta `manipular` o de un ejercicio «Calcular» (`numero`, `vector`, `opcion`),
 * peticiones de Oliver del 2026-10-28. `why` y `aim` se enseñan siempre, antes del enunciado;
 * `takeaway`, al cerrar la pregunta (acertada o con la solución a la vista).
 */
export const purposeSchema = z.strictObject({
  /** «Para qué sirve»: dónde aparece esto en un sistema de IA real y qué decisión ayuda a tomar. */
  why: md,
  /**
   * «Qué vas a conseguir»: lo que construyes en el plano (o calculas) y lo que eso te deja ver.
   * Sin la respuesta.
   */
  aim: md,
  /** «Lo que te llevas»: la conclusión que queda y su consecuencia en el sistema real. */
  takeaway: md,
});

export const manipularQSchema = z
  .strictObject({
    ...baseShape,
    type: z.literal('manipular'),
    plane: planeSpecSchema,
    goals: z.array(goalSchema).min(1),
    purpose: purposeSchema.optional(),
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

/**
 * Pregunta del ejercicio «Manipular» sobre el plano de curvas: se arrastran puntos (sobre la curva, en
 * horizontal; o libres) hasta cumplir las metas. Como mucho 2 puntos móviles, igual que `manipular`.
 */
export const curvaQSchema = z
  .strictObject({
    ...baseShape,
    type: z.literal('curva'),
    graph: graphSpecSchema,
    goals: z.array(curveGoalSchema).min(1),
    purpose: purposeSchema.optional(),
  })
  .superRefine((q, ctx) => {
    const byId = new Map(q.graph.points.map((p) => [p.id, p]));
    q.goals.forEach((g, i) => {
      for (const name of g.of) {
        const p = byId.get(name);
        const path = ['goals', i, 'of'];
        if (!p) {
          ctx.addIssue({
            code: 'custom',
            path,
            message: `La meta nombra un punto inexistente: ${name}`,
          });
        } else if (ON_CURVE_METRICS.includes(g.metric) && !p.onCurve) {
          ctx.addIssue({
            code: 'custom',
            path,
            message: `La métrica ${g.metric} necesita puntos sobre la curva: ${name}`,
          });
        } else if (FREE_POINT_METRICS.includes(g.metric) && p.onCurve) {
          ctx.addIssue({
            code: 'custom',
            path,
            message: `La métrica ${g.metric} necesita puntos libres: ${name}`,
          });
        }
      }
      if (ON_CURVE_METRICS.includes(g.metric) && !q.graph.curve) {
        ctx.addIssue({
          code: 'custom',
          path: ['goals', i, 'metric'],
          message: `La métrica ${g.metric} exige graph.curve`,
        });
      }
    });
  });

export const numeroQSchema = z.strictObject({
  ...baseShape,
  type: z.literal('numero'),
  answer: z.number(),
  tol,
  plane: planeSpecSchema.optional(),
  /** Figura estática del plano de curvas (juego 3). */
  graph: graphSpecSchema.optional(),
  purpose: purposeSchema.optional(),
});

export const vectorQSchema = z
  .strictObject({
    ...baseShape,
    type: z.literal('vector'),
    /** Con `shape`, por filas: primero la fila 1 entera, luego la 2… */
    answer: z.array(z.number()).min(1),
    tol,
    plane: planeSpecSchema.optional(),
    /** Figura estática del plano de curvas (juego 3). */
    graph: graphSpecSchema.optional(),
    /** [filas, columnas]: la respuesta se teclea como matriz. La corrección no cambia. */
    shape: z.tuple([z.number().int().positive(), z.number().int().positive()]).optional(),
    purpose: purposeSchema.optional(),
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
    /** Figura estática del plano de curvas (juego 3). */
    graph: graphSpecSchema.optional(),
    purpose: purposeSchema.optional(),
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
  curvaQSchema,
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
  manipular: ['manipular', 'curva'],
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

/**
 * Las piezas de una red neuronal (un modelo de lenguaje pequeño) que dibuja «La red por dentro». La
 * ficha de cada una (nombre, qué hace, dónde se aprende) vive en `src/games/network.ts`.
 */
export const NETWORK_PARTS = [
  'tokens',
  'embedding',
  'attention',
  'linear',
  'activation',
  'norm',
  'output',
  'loss',
  'gradient',
  'update',
  'search',
  'inspect',
  'compress',
] as const;

export type NetworkPart = (typeof NETWORK_PARTS)[number];

/**
 * Dónde encaja un proyecto (o un juego entero) en una red neuronal, petición de Oliver del 2026-11-04:
 * se ve en el panel del proyecto, con el dibujo de la red y sus piezas resaltadas.
 */
export const bigPictureSchema = z.strictObject({
  /** Las piezas de la red que toca, de la más directa a la menos. Se resaltan en el dibujo. */
  parts: z.array(z.enum(NETWORK_PARTS)).min(1).max(4),
  /** Dos a cuatro frases: qué hace esa pieza en la red y qué tiene que ver con lo que se practica aquí. */
  text: md,
});

export const projectSchema = z
  .strictObject({
    id,
    name: z.string(),
    sub: z.string(),
    exercises: z.array(exerciseSchema).length(EXERCISES_PER_PROJECT),
    sheets: z.array(revisionQSchema).length(3),
    /** Calentamiento de Python antes del ejercicio «Programar». No cuenta para la nota. */
    warmup: z.array(warmupStepSchema).min(1).max(WARMUP_MAX_STEPS).optional(),
    /** Dónde encaja en una red neuronal. Lo exige `tests/content/big-picture.test.ts`. */
    bigPicture: bigPictureSchema.optional(),
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
    curvaQSchema,
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
    /** Dónde encaja el juego entero en una red neuronal: se ve en el mapa del juego y en el despegue. */
    bigPicture: bigPictureSchema.optional(),
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
export type Curve = z.infer<typeof curveSchema>;
export type GraphPoint = z.infer<typeof graphPointSchema>;
export type GraphSpec = z.infer<typeof graphSpecSchema>;
export type CurveGoal = z.infer<typeof curveGoalSchema>;
export type CurvaQ = z.infer<typeof curvaQSchema>;
export type BigPicture = z.infer<typeof bigPictureSchema>;
export type Purpose = z.infer<typeof purposeSchema>;
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
