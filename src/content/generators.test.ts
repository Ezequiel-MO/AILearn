import { describe, expect, it } from 'vitest';
import { grade } from './grade';
import { generators, resolve } from './generators';
import { numeroQSchema, vectorQSchema, type GeneradaQ } from './schema';

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

const call = (generator: string, params: GeneradaQ['params'] = {}): GeneradaQ => ({
  type: 'generada',
  id: `g-${generator}`,
  generator,
  params,
});

/** Los dos coeficientes de «a u ± b v» en el enunciado de combinacion. */
const COEFFICIENTS = /\$([+-]?\d+)\\,\\vec\{u\}.*?([+-]\s?\d+)\\,\\vec\{v\}/;

/** Las tuplas de enteros del enunciado, en orden: `(a,\ b)` pasa a `[a, b]`. */
const tuplesOf = (prompt: string): number[][] =>
  [...prompt.matchAll(/\(([^()]*)\)/g)].map((m) => (m[1]!.match(/-?\d+/g) ?? []).map(Number));

/** Redondeo a dos decimales de la solución escrita. */
const round2 = (x: number): number => Math.round(x * 100) / 100;

// contract: tabla de generadores del brief (id y bounds)
const IDS = [
  'desplazamiento',
  'suma',
  'combinacion',
  'centroide',
  'norma',
  'distancia',
  'unitario',
] as const;

describe('generadores: contrato común', () => {
  it('registra exactamente los siete generadores del brief', () => {
    expect(Object.keys(generators).sort()).toEqual([...IDS].sort()); // contract: tabla del brief
  });

  for (const id of IDS) {
    const params: GeneradaQ['params'] = id === 'norma' ? { dim: 3 } : {};
    describe(id, () => {
      it('cumple el esquema, queda dentro de bounds y se acepta su propia respuesta (200 semillas)', () => {
        const { bounds } = generators[id]!;
        for (const seed of SEEDS) {
          const q = resolve(call(id, params), seed);
          const schema = q.type === 'numero' ? numeroQSchema : vectorQSchema;
          expect(schema.safeParse(q).success, `${id} semilla ${seed}`).toBe(true);
          const answer = q.type === 'numero' ? [q.answer] : q.answer;
          for (const x of answer) {
            expect(Number.isFinite(x), `${id} semilla ${seed}`).toBe(true);
            expect(x).toBeGreaterThanOrEqual(bounds.min - 1e-9);
            expect(x).toBeLessThanOrEqual(bounds.max + 1e-9);
          }
          const ok =
            q.type === 'numero'
              ? grade(q, { type: 'numero', value: q.answer })
              : grade(q, { type: 'vector', value: q.answer });
          expect(ok, `${id} semilla ${seed}`).toBe(true);
          // contract: brief tarea 7, esquema común: enunciado, explicación y solución no vacíos
          expect(q.prompt).not.toBe('');
          expect(q.explain).not.toBe('');
          expect(q.solution).not.toBe('');
        }
      });

      it('es determinista: misma semilla, misma pregunta', () => {
        expect(resolve(call(id, params), 17)).toEqual(resolve(call(id, params), 17));
      });

      it('conserva el id de la entrada', () => {
        expect(resolve(call(id, params), 5).id).toBe(`g-${id}`);
      });
    });
  }
});

describe('bounds declarados', () => {
  it('coinciden con la tabla del brief', () => {
    const expected = {
      desplazamiento: [-12, 12],
      suma: [-12, 12],
      combinacion: [-36, 36],
      centroide: [-6, 6],
      norma: [0, 10.4],
      distancia: [0, 17],
      unitario: [-1, 1],
    } as const; // contract: tabla del brief
    for (const id of IDS) {
      expect([generators[id]!.bounds.min, generators[id]!.bounds.max]).toEqual(expected[id]);
    }
  });
});

describe('generadores concretos', () => {
  it('tolerancias de la tabla: 0,01 en centroide, norma, distancia y unitario; 0 en los enteros', () => {
    const tolOf = (id: string, params = {}) => resolve(call(id, params), 3);
    expect(tolOf('centroide')).toMatchObject({ tol: 0.01 }); // contract: tabla del brief
    expect(tolOf('norma', { dim: 2 })).toMatchObject({ tol: 0.01 }); // contract: tabla del brief
    expect(tolOf('distancia')).toMatchObject({ tol: 0.01 }); // contract: tabla del brief
    expect(tolOf('unitario')).toMatchObject({ tol: 0.01 }); // contract: tabla del brief
    expect(tolOf('suma')).toMatchObject({ type: 'vector', tol: 0 }); // contract: enteros exactos
  });

  it('norma admite dim 2 y dim 3 y devuelve un número', () => {
    for (const seed of SEEDS) {
      const q2 = resolve(call('norma', { dim: 2 }), seed);
      const q3 = resolve(call('norma', { dim: 3 }), seed);
      expect(q2.type).toBe('numero'); // contract: tabla del brief, norma devuelve un número
      expect(q3.type).toBe('numero'); // contract: tabla del brief, norma devuelve un número
      // contract: componentes en ±6 (tabla del brief): √(2·36) en 2D y √(3·36) en 3D
      expect(q2.answer).toBeLessThanOrEqual(Math.sqrt(72) + 1e-9);
      expect(q3.answer).toBeLessThanOrEqual(Math.sqrt(108) + 1e-9);
    }
  });

  it('norma escribe «del plano» o «del espacio» según dim, sin «de el»', () => {
    expect(resolve(call('norma', { dim: 2 }), 1).prompt).toContain('del plano'); // contract: gramática castellana
    expect(resolve(call('norma', { dim: 3 }), 1).prompt).toContain('del espacio'); // contract: gramática castellana
    expect(resolve(call('norma', { dim: 3 }), 1).prompt).not.toContain('de el'); // contract: gramática castellana
  });

  it('norma con dim distinta de 2 o 3 lanza un error que nombra el generador', () => {
    expect(() => resolve(call('norma', { dim: 4 }), 1)).toThrow(/norma/);
  });

  it('norma en 3D llega a más de 8,5 en alguna semilla (usa de verdad la tercera componente)', () => {
    const max = Math.max(
      ...SEEDS.map((s) => resolve(call('norma', { dim: 3 }), s).answer as number),
    );
    expect(max).toBeGreaterThan(8.5); // contract: sqrt(72)=8,49 es el tope en 2D
  });

  it('unitario nunca recibe el vector nulo y su norma es 1', () => {
    for (const seed of SEEDS) {
      const q = resolve(call('unitario'), seed);
      if (q.type !== 'vector') throw new Error('unitario debe dar un vector');
      const n = Math.hypot(...q.answer);
      expect(n).toBeCloseTo(1, 9); // contract: v/‖v‖ tiene norma 1
    }
  });

  it('combinacion usa coeficientes en -3..3 distintos de 0 (se deduce del enunciado)', () => {
    for (const seed of SEEDS) {
      const q = resolve(call('combinacion'), seed);
      const m = COEFFICIENTS.exec(q.prompt);
      expect(m, `semilla ${seed}: ${q.prompt}`).not.toBeNull();
      const a = Number(m![1]);
      const b = Number(m![2]!.replace(/\s/g, ''));
      for (const k of [a, b]) {
        expect(Math.abs(k)).toBeGreaterThanOrEqual(1); // contract: brief tarea 7, coeficientes distintos de 0
        expect(Math.abs(k)).toBeLessThanOrEqual(3); // contract: brief tarea 7, coeficientes entre -3 y 3
      }
    }
  });

  it('desplazamiento: la solución nombra los puntos y B − A es la respuesta', () => {
    const q = resolve(call('desplazamiento'), 9);
    expect(q.prompt).toContain('A'); // contract: brief tarea 7, el enunciado nombra el punto A
    expect(q.prompt).toContain('B'); // contract: brief tarea 7, el enunciado nombra el punto B
    expect(q.solution).toMatch(/\$/); // contract: brief tarea 7, la solución es Markdown con fórmula
  });

  it('los decimales se escriben con coma', () => {
    const q = resolve(call('centroide'), 4);
    const text = `${q.prompt}${q.solution}${q.explain}`;
    expect(text).not.toMatch(/\d\.\d/); // contract: restricción global, coma decimal
  });

  it('los textos de norma, distancia y unitario no llevan punto decimal', () => {
    for (const [id, params] of [
      ['norma', { dim: 2 }],
      ['norma', { dim: 3 }],
      ['distancia', {}],
      ['unitario', {}],
    ] as const) {
      for (const seed of SEEDS.slice(0, 50)) {
        const q = resolve(call(id, params), seed);
        expect(`${q.prompt}${q.solution}${q.explain}${q.hints.join('')}`).not.toMatch(/\d\.\d/);
      }
    }
  });
});

describe('oráculo: la respuesta es la correcta para los datos del enunciado (200 semillas)', () => {
  // Cada fórmula se escribe aquí, a partir de los números del enunciado, sin importar el generador.
  const vec = (id: string, seed: number, params: GeneradaQ['params'] = {}) => {
    const q = resolve(call(id, params), seed);
    if (q.type !== 'vector') throw new Error(`${id} debe dar un vector`);
    return { q, answer: q.answer, tuples: tuplesOf(q.prompt) };
  };
  const expectVec = (got: number[], want: number[], where: string) => {
    expect(got.length, where).toBe(want.length);
    want.forEach((w, i) => expect(Math.abs(got[i]! - w), where).toBeLessThan(1e-9));
  };

  it('desplazamiento: B − A', () => {
    for (const seed of SEEDS) {
      const { answer, tuples } = vec('desplazamiento', seed);
      const [a, b] = tuples;
      // contract: definición del vector entre dos puntos, llegada menos salida (spec, Órbita 0)
      expectVec(
        answer,
        b!.map((x, i) => x - a![i]!),
        `semilla ${seed}`,
      );
    }
  });

  it('suma: u + v', () => {
    for (const seed of SEEDS) {
      const { answer, tuples } = vec('suma', seed);
      const [u, v] = tuples;
      // contract: la suma de vectores es componente a componente
      expectVec(
        answer,
        u!.map((x, i) => x + v![i]!),
        `semilla ${seed}`,
      );
    }
  });

  it('combinacion: a·u + b·v con los coeficientes del enunciado', () => {
    for (const seed of SEEDS) {
      const { q, answer, tuples } = vec('combinacion', seed);
      const m = COEFFICIENTS.exec(q.prompt)!;
      const a = Number(m[1]);
      const b = Number(m[2]!.replace(/\s/g, ''));
      const [u, v] = tuples;
      // contract: combinación lineal, cada vector por su coeficiente y suma componente a componente
      expectVec(
        answer,
        u!.map((x, i) => a * x + b * v![i]!),
        `semilla ${seed}`,
      );
    }
  });

  it('centroide: media de los tres puntos', () => {
    for (const seed of SEEDS) {
      const { answer, tuples } = vec('centroide', seed);
      expect(tuples).toHaveLength(3); // contract: el centroide se pide de tres puntos
      // contract: el centroide es la media componente a componente
      expectVec(
        answer,
        [0, 1].map((i) => (tuples[0]![i]! + tuples[1]![i]! + tuples[2]![i]!) / 3),
        `semilla ${seed}`,
      );
    }
  });

  it('unitario: v / ‖v‖', () => {
    for (const seed of SEEDS) {
      const { answer, tuples } = vec('unitario', seed);
      const v = tuples[0]!;
      const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
      // contract: normalizar es dividir entre la norma
      expectVec(
        answer,
        v.map((x) => x / n),
        `semilla ${seed}`,
      );
    }
  });

  for (const dim of [2, 3] as const) {
    it(`norma en ${dim}D: raíz de la suma de cuadrados`, () => {
      for (const seed of SEEDS) {
        const q = resolve(call('norma', { dim }), seed);
        const v = tuplesOf(q.prompt)[0]!;
        expect(v, `semilla ${seed}`).toHaveLength(dim); // contract: dim componentes en el enunciado
        // contract: la norma es la raíz de la suma de los cuadrados
        expect(Math.abs((q.answer as number) - Math.hypot(...v)), `semilla ${seed}`).toBeLessThan(
          1e-9,
        );
      }
    });
  }

  it('distancia: norma de B − A', () => {
    for (const seed of SEEDS) {
      const q = resolve(call('distancia'), seed);
      const [a, b] = tuplesOf(q.prompt);
      // contract: la distancia entre dos puntos es la norma del vector que los une
      const want = Math.hypot(b![0]! - a![0]!, b![1]! - a![1]!);
      expect(Math.abs((q.answer as number) - want), `semilla ${seed}`).toBeLessThan(1e-9);
    }
  });
});

describe('texto de la solución', () => {
  const finalStep = (solution: string): { relation: string; value: string } => {
    const m = /\\sqrt\{[^{}]*\}(=|\\approx )([^$=\\]*)\$$/.exec(solution);
    if (!m) throw new Error(`la solución no acaba en «\\sqrt{…} = o ≈ valor»: ${solution}`);
    return { relation: m[1]!, value: m[2]! };
  };

  for (const [id, params] of [
    ['norma', { dim: 2 }],
    ['norma', { dim: 3 }],
    ['distancia', {}],
  ] as const) {
    it(`${id}${'dim' in params ? ` ${params.dim}D` : ''}: «=» si el valor es exacto y «\\approx» solo si se redondea`, () => {
      let exact = 0;
      let rounded = 0;
      for (const seed of SEEDS) {
        const q = resolve(call(id, params), seed);
        const answer = q.answer as number;
        const isExact = Math.abs(answer - round2(answer)) < 1e-9;
        const { relation } = finalStep(q.solution);
        // contract: ronda de arreglo 1, punto 8: \sqrt{25}=5 con «=»; \sqrt{5}≈2,24 con «\approx» (solo si se redondea)
        expect(relation, `semilla ${seed}: ${q.solution}`).toBe(isExact ? '=' : '\\approx ');
        if (isExact) exact++;
        else rounded++;
      }
      // contract: ronda de arreglo 1, punto 8: las 200 semillas ejercitan los dos casos
      expect(exact).toBeGreaterThan(0);
      expect(rounded).toBeGreaterThan(0);
    });
  }

  it('centroide: «=» si ambas medias son exactas y «\\approx» si se redondea', () => {
    let exact = 0;
    let rounded = 0;
    for (const seed of SEEDS) {
      const q = resolve(call('centroide'), seed);
      const answer = q.answer as number[];
      const isExact = answer.every((x) => Math.abs(x - round2(x)) < 1e-9);
      const m = /\\right\)(=|\\approx )\(/.exec(q.solution);
      if (!m) throw new Error(`la solución no acaba en «\\right) = o ≈ (tupla)»: ${q.solution}`);
      // contract: retoque previo de la tarea 15: la media exacta se escribe con «=», la redondeada con «\approx»
      expect(m[1], `semilla ${seed}: ${q.solution}`).toBe(isExact ? '=' : '\\approx ');
      if (isExact) exact++;
      else rounded++;
    }
    // contract: retoque previo de la tarea 15: las 200 semillas ejercitan los dos casos
    expect(exact).toBeGreaterThan(0);
    expect(rounded).toBeGreaterThan(0);
  });

  it('unitario: «=» solo donde el valor es exacto (la norma y el vector final)', () => {
    let exactNorm = 0;
    let roundedNorm = 0;
    let exactVector = 0;
    for (const seed of SEEDS) {
      const q = resolve(call('unitario'), seed);
      const answer = q.answer as number[];
      const v = tuplesOf(q.prompt)[0]!;
      const norm = Math.hypot(...v);
      const normRel = /\\sqrt\{[^{}]*\}(=|\\approx )/.exec(q.solution);
      const fractionRel = /\\rVert\}(=|\\approx )\\left\(/.exec(q.solution);
      const vectorRel = /\\right\)(=|\\approx )\(/.exec(q.solution);
      if (!normRel || !vectorRel || !fractionRel)
        throw new Error(`formato inesperado: ${q.solution}`);
      const normExact = Math.abs(norm - round2(norm)) < 1e-9;
      const vectorExact = answer.every((x) => Math.abs(x - round2(x)) < 1e-9);
      // contract: retoque previo de la tarea 15: \sqrt{25}=5 con «=»; \sqrt{5}≈2,24 con «\approx»
      expect(normRel[1], `semilla ${seed}: ${q.solution}`).toBe(normExact ? '=' : '\\approx ');
      // contract: review-15 m14: v/‖v‖ = (fracciones con la norma redondeada) es «\approx» cuando la norma no es exacta
      expect(fractionRel[1], `semilla ${seed}: ${q.solution}`).toBe(normExact ? '=' : '\\approx ');
      // contract: retoque previo de la tarea 15: el vector unitario con «=» solo si sus componentes no se redondean
      expect(vectorRel[1], `semilla ${seed}: ${q.solution}`).toBe(vectorExact ? '=' : '\\approx ');
      if (normExact) exactNorm++;
      else roundedNorm++;
      if (vectorExact) exactVector++;
    }
    // contract: retoque previo de la tarea 15: las 200 semillas ejercitan los dos casos de la norma y el caso exacto del vector
    expect(exactNorm).toBeGreaterThan(0);
    expect(roundedNorm).toBeGreaterThan(0);
    expect(exactVector).toBeGreaterThan(0);
  });

  it('desplazamiento dice «El fallo habitual es restar al revés»', () => {
    const { explain } = resolve(call('desplazamiento'), 1);
    // contract: ronda de arreglo 1, punto 8: redacción corregida
    expect(explain).toContain('El fallo habitual es restar al revés');
    expect(explain).not.toContain('Lo habitual es restar al revés');
  });

  it('combinacion separa el signo con un espacio a cada lado (enunciado y solución)', () => {
    for (const seed of SEEDS) {
      const q = resolve(call('combinacion'), seed);
      // contract: ronda de arreglo 1, punto 8: espaciado simétrico «\vec{u} - 3\,\vec{v}»
      expect(q.prompt, `semilla ${seed}`).toMatch(/\\vec\{u\} [+-] \d\\,\\vec\{v\}/);
      expect(q.solution, `semilla ${seed}`).toMatch(/\\vec\{u\} [+-] \d\\,\\vec\{v\}/);
    }
  });
});

describe('resolve', () => {
  it('misma semilla, preguntas idénticas; semillas distintas, alguna diferencia', () => {
    const g = call('suma');
    expect(resolve(g, 11)).toEqual(resolve(g, 11)); // contract: brief, mismo resultado por semilla
    const prompts = new Set(SEEDS.map((s) => resolve(g, s).prompt));
    expect(prompts.size).toBeGreaterThan(50); // contract: la semilla cambia el enunciado
  });

  it('un generador inexistente lanza un error que lo nombra', () => {
    expect(() => resolve(call('no-existe'), 1)).toThrow(/no-existe/);
  });

  it('no confunde un generador con una propiedad heredada de Object', () => {
    expect(() => resolve(call('toString'), 1)).toThrow(/toString/);
  });
});
