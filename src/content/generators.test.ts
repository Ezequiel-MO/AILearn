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

// contract: tabla de generadores del brief (id y bounds); los tres últimos, de la Órbita 1
const IDS = [
  'desplazamiento',
  'suma',
  'combinacion',
  'centroide',
  'norma',
  'distancia',
  'unitario',
  'producto',
  'coseno',
  'proyeccion',
  'producto-rn',
  'normalizar',
  'coseno-azar',
  'mejor-puntuacion',
  'analogia',
  'umbral',
  'matriz-vector',
  'producto-matrices',
  'forma-producto',
] as const;

describe('generadores: contrato común', () => {
  it('registra exactamente los siete generadores del brief y los tres de la Órbita 1', () => {
    expect(Object.keys(generators).sort()).toEqual([...IDS].sort()); // contract: tabla del brief y Órbita 1
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
      producto: [-72, 72], // contract: Órbita 1, componentes de -6 a 6: |u·v| ≤ 2·36
      coseno: [-1, 1], // contract: Órbita 1, el coseno está en [-1, 1]
      proyeccion: [-8.5, 8.5], // contract: Órbita 1, |proy| ≤ ‖a‖ ≤ √72 ≈ 8,49
      'producto-rn': [-100, 100], // contract: Órbita 2, cuatro componentes de -5 a 5: |u·v| ≤ 4·25
      normalizar: [-1, 1], // contract: Órbita 2, las componentes de un unitario están en [-1, 1]
      'coseno-azar': [0, 0.1], // contract: Órbita 2, 1/√d con d entre 100 y 10 000
      'mejor-puntuacion': [-27, 27], // contract: Órbita 3, componentes de -3 a 3 en ℝ³: |d·q| ≤ 3·9
      analogia: [-15, 15], // contract: Órbita 3, componentes de -5 a 5: |a − b + c| ≤ 3·5
      umbral: [0, 5], // contract: Órbita 3, cinco documentos
      'matriz-vector': [-18, 18], // contract: Órbita 0 de Matrices, entradas de -3 a 3: |a·x + b·y| ≤ 2·9
      'producto-matrices': [-18, 18], // contract: Órbita 0 de Matrices, entradas de -3 a 3: |Σ a·e| ≤ 2·9
      'forma-producto': [2, 800], // contract: Órbita 0 de Matrices, tamaños de 2 a 800 (el mayor, 768)
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

describe('oráculo de la Órbita 1: producto, coseno y proyección (200 semillas)', () => {
  // Las fórmulas se escriben aquí, a partir de las dos tuplas del enunciado.
  const num = (id: string, seed: number) => {
    const q = resolve(call(id), seed);
    if (q.type !== 'numero') throw new Error(`${id} debe dar un número`);
    const [a, b] = tuplesOf(q.prompt);
    return { q, a: a!, b: b! };
  };
  const dotOf = (a: number[], b: number[]) => a[0]! * b[0]! + a[1]! * b[1]!;

  it('producto: u·v exacto, tolerancia 0', () => {
    for (const seed of SEEDS) {
      const { q, a, b } = num('producto', seed);
      expect(q.answer, `semilla ${seed}`).toBe(dotOf(a, b) + 0); // contract: definición del producto escalar
      expect(q.tol).toBe(0); // contract: enteros exactos
    }
  });

  it('coseno: u·v / (‖u‖‖v‖), sin vectores nulos, tolerancia 0,01', () => {
    for (const seed of SEEDS) {
      const { q, a, b } = num('coseno', seed);
      expect(Math.hypot(...a) * Math.hypot(...b), `semilla ${seed}`).toBeGreaterThan(0); // contract: sin ángulo con el vector nulo
      const want = dotOf(a, b) / (Math.hypot(...a) * Math.hypot(...b));
      expect(Math.abs(q.answer - want), `semilla ${seed}`).toBeLessThan(1e-9); // contract: definición del coseno
      expect(q.tol).toBe(0.01); // contract: dos decimales
    }
  });

  it('proyeccion: a·b / ‖b‖, b no nulo, tolerancia 0,01', () => {
    for (const seed of SEEDS) {
      const { q, a, b } = num('proyeccion', seed);
      expect(Math.hypot(...b), `semilla ${seed}`).toBeGreaterThan(0); // contract: no se proyecta sobre el vector nulo
      const want = dotOf(a, b) / Math.hypot(...b);
      expect(Math.abs(q.answer - want), `semilla ${seed}`).toBeLessThan(1e-9); // contract: proyección escalar
      expect(q.tol).toBe(0.01); // contract: dos decimales
    }
  });

  it('coseno y proyeccion: «=» si el valor es exacto y «\\approx» solo si se redondea', () => {
    for (const id of ['coseno', 'proyeccion']) {
      for (const seed of SEEDS) {
        const q = resolve(call(id), seed);
        const answer = q.answer as number;
        const exact = Math.abs(answer - round2(answer)) < 1e-9;
        // contract: misma regla que norma y distancia (ronda de arreglo 1, punto 8)
        expect(
          q.solution.endsWith(
            `${exact ? '=' : '\\approx '}${String(round2(answer) + 0).replace('.', '{,}')}$`,
          ),
          `${id} semilla ${seed}: ${q.solution}`,
        ).toBe(true);
      }
    }
  });
});

describe('oráculo de la Órbita 2: producto-rn, normalizar y coseno-azar (200 semillas)', () => {
  it('producto-rn: dos vectores de ℝ⁴ y su producto escalar exacto, tolerancia 0', () => {
    for (const seed of SEEDS) {
      const q = resolve(call('producto-rn'), seed);
      if (q.type !== 'numero') throw new Error('producto-rn debe dar un número');
      const [a, b] = tuplesOf(q.prompt);
      // contract: Órbita 2, generador producto-rn: vectores de cuatro componentes
      expect([a!.length, b!.length], `semilla ${seed}`).toEqual([4, 4]);
      const want = a!.reduce((s, x, i) => s + x * b![i]!, 0);
      expect(q.answer, `semilla ${seed}`).toBe(want + 0); // contract: definición del producto escalar en ℝⁿ
      expect(q.tol).toBe(0); // contract: enteros exactos
    }
  });

  it('normalizar: v de ℝ³ con norma entera y su unitario v/‖v‖, tolerancia 0,01', () => {
    for (const seed of SEEDS) {
      const q = resolve(call('normalizar'), seed);
      if (q.type !== 'vector') throw new Error('normalizar debe dar un vector');
      const [v] = tuplesOf(q.prompt);
      const n = Math.hypot(...v!);
      // contract: Órbita 2, generador normalizar: vector de ℝ³ con norma entera
      expect(v!.length, `semilla ${seed}`).toBe(3);
      expect(Number.isInteger(n), `semilla ${seed}`).toBe(true);
      // contract: definición del unitario v/‖v‖
      v!.forEach((x, i) => expect(Math.abs(q.answer[i]! - x / n)).toBeLessThan(1e-9));
      expect(Math.abs(Math.hypot(...q.answer) - 1)).toBeLessThan(1e-9); // contract: norma 1
      expect(q.tol).toBe(0.01); // contract: dos decimales
    }
  });

  it('normalizar: sortea signos y órdenes distintos', () => {
    const prompts = new Set(SEEDS.map((seed) => resolve(call('normalizar'), seed).prompt));
    // contract: Órbita 2: seis vectores base, permutados y con signos, dan mucha más variedad que seis
    expect(prompts.size).toBeGreaterThan(50);
  });

  it('coseno-azar: la respuesta es 1/√d para la d del enunciado, tolerancia 0,005', () => {
    for (const seed of SEEDS) {
      const q = resolve(call('coseno-azar'), seed);
      if (q.type !== 'numero') throw new Error('coseno-azar debe dar un número');
      const d = Number(/\\mathbb\{R\}\^\{(\d+)\}/.exec(q.prompt)?.[1]);
      // contract: Órbita 2, Dimensión alta: la desviación típica del coseno al azar es 1/√d
      expect(q.answer, `semilla ${seed}`).toBeCloseTo(1 / Math.sqrt(d), 12);
      // contract: Órbita 2: d elegida para que 1/√d tenga como mucho dos decimales
      expect(round2(q.answer)).toBe(q.answer);
      expect(q.tol).toBe(0.005); // contract: medio centésimo, la mitad del paso de dos decimales
    }
  });
});

describe('oráculo de la Órbita 3: mejor-puntuacion, analogia y umbral (200 semillas)', () => {
  it('mejor-puntuacion: la mayor de las cuatro puntuaciones d·q, sin empate arriba, tolerancia 0', () => {
    for (const seed of SEEDS) {
      const q = resolve(call('mejor-puntuacion'), seed);
      if (q.type !== 'numero') throw new Error('mejor-puntuacion debe dar un número');
      const [query, ...docs] = tuplesOf(q.prompt);
      // contract: Órbita 3, generador mejor-puntuacion: una consulta y cuatro documentos de ℝ³
      expect([query!.length, ...docs.map((d) => d.length)], `semilla ${seed}`).toEqual([
        3, 3, 3, 3, 3,
      ]);
      expect(
        query!.some((x) => x !== 0),
        `semilla ${seed}`,
      ).toBe(true); // contract: consulta no nula
      const scores = docs.map((d) => d.reduce((s, x, i) => s + x * query![i]!, 0));
      const best = Math.max(...scores);
      expect(q.answer, `semilla ${seed}`).toBe(best + 0); // contract: top-1 por producto escalar
      // contract: Órbita 3: un solo ganador, para que «el documento que gana» no sea ambiguo
      expect(scores.filter((s) => s === best)).toHaveLength(1);
      expect(q.tol).toBe(0); // contract: enteros exactos
    }
  });

  it('analogia: a − b + c componente a componente, tolerancia 0', () => {
    for (const seed of SEEDS) {
      const q = resolve(call('analogia'), seed);
      if (q.type !== 'vector') throw new Error('analogia debe dar un vector');
      const [a, b, c] = tuplesOf(q.prompt);
      // contract: Órbita 3, generador analogia: tres vectores de ℝ³
      expect([a!.length, b!.length, c!.length], `semilla ${seed}`).toEqual([3, 3, 3]);
      // contract: Órbita 3, Analogías: el vector buscado es a − b + c
      expect(q.answer, `semilla ${seed}`).toEqual(a!.map((x, i) => x - b![i]! + c![i]! + 0));
      expect(q.tol).toBe(0); // contract: enteros exactos
    }
  });

  it('umbral: cuántos de los cinco cosenos pasan el umbral, ninguno igual a él, tolerancia 0', () => {
    let zeros = 0;
    for (const seed of SEEDS) {
      const q = resolve(call('umbral'), seed);
      if (q.type !== 'numero') throw new Error('umbral debe dar un número');
      const [threshold, scores] = [...q.prompt.matchAll(/\$([^$]*)\$/g)].map((m) =>
        m[1]!.split(';\\ ').map((x) => Number(x.replace('{,}', '.'))),
      );
      const t = threshold![0]!;
      // contract: Órbita 3, generador umbral: un umbral y cinco cosenos de dos decimales
      expect(scores, `semilla ${seed}`).toHaveLength(5);
      expect(
        scores!.every((s) => s !== t),
        `semilla ${seed}`,
      ).toBe(true); // contract: sin empate con el umbral
      // contract: Órbita 3, Por qué falla un RAG: pasan los que llegan al umbral
      expect(q.answer, `semilla ${seed}`).toBe(scores!.filter((s) => s > t).length);
      expect(q.tol).toBe(0); // contract: un recuento
      if (q.answer === 0) zeros++;
    }
    // contract: Órbita 3: «no lo sé» (ninguno pasa) también sale en el examen alguna vez
    expect(zeros).toBeGreaterThan(0);
  });
});

/** Matriz 2×2 nula o identidad (por filas). */
const isZeroOrIdentity = (a: readonly number[]): boolean =>
  a.every((x) => x === 0) || (a[0] === 1 && a[1] === 0 && a[2] === 0 && a[3] === 1);

/** Los números de cada `pmatrix` del enunciado, en orden y por filas. */
const matricesOf = (prompt: string): number[][] =>
  [...prompt.matchAll(/\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/g)].map((m) =>
    (m[1]!.match(/-?\d+/g) ?? []).map(Number),
  );

describe('oráculo de la Órbita 0 de Matrices: matriz-vector, producto-matrices y forma-producto (200 semillas)', () => {
  it('matriz-vector: A v con A 2×2 y v de ℝ², enteros de -3 a 3, tolerancia 0', () => {
    for (const seed of SEEDS) {
      const q = resolve(call('matriz-vector'), seed);
      if (q.type !== 'vector') throw new Error('matriz-vector debe dar un vector');
      const [a, v] = matricesOf(q.prompt) as [number[], number[]];
      // contract: Órbita 0 de Matrices: A es 2×2 y v tiene dos componentes
      expect([a.length, v.length], `semilla ${seed}`).toEqual([4, 2]);
      // contract: brief: entradas enteras de -3 a 3, A ni nula ni la identidad, v no nulo
      expect([...a, ...v].every((x) => Math.abs(x) <= 3)).toBe(true);
      expect(isZeroOrIdentity(a), `semilla ${seed}`).toBe(false);
      expect(
        v.some((x) => x !== 0),
        `semilla ${seed}`,
      ).toBe(true);
      // contract: definición Av = v1·col1 + v2·col2 (también fila por vector)
      expect(q.answer, `semilla ${seed}`).toEqual([
        a[0]! * v[0]! + a[1]! * v[1]! + 0,
        a[2]! * v[0]! + a[3]! * v[1]! + 0,
      ]);
      expect(q.tol).toBe(0); // contract: enteros exactos
      expect(q.shape).toBeUndefined(); // contract: brief, la respuesta es un vector de 2, sin forma de matriz
      // contract: brief: la pista y la solución dan las dos lecturas, por columnas y por filas
      expect(q.hints[0]).toContain('veces la primera columna');
      expect(q.solution).toContain('Por columnas');
      expect(q.solution).toContain('Por filas');
    }
  });

  it('producto-matrices: AB con shape [2, 2] por filas, A y B no nulas y AB ≠ BA', () => {
    for (const seed of SEEDS) {
      const q = resolve(call('producto-matrices'), seed);
      if (q.type !== 'vector') throw new Error('producto-matrices debe dar un vector');
      const [a, b] = matricesOf(q.prompt) as [number[], number[]];
      // contract: Órbita 0 de Matrices: A y B son 2×2
      expect([a.length, b.length], `semilla ${seed}`).toEqual([4, 4]);
      expect([...a, ...b].every((x) => Math.abs(x) <= 3)).toBe(true); // contract: brief, entradas de -3 a 3
      const prod = (m: number[], n: number[]): number[] => [
        m[0]! * n[0]! + m[1]! * n[2]!,
        m[0]! * n[1]! + m[1]! * n[3]!,
        m[2]! * n[0]! + m[3]! * n[2]!,
        m[2]! * n[1]! + m[3]! * n[3]!,
      ];
      // contract: columna k de AB = A por la columna k de B (producto fila por columna), por filas
      expect(q.answer, `semilla ${seed}`).toEqual(prod(a, b).map((x) => x + 0));
      // contract: brief: se exige AB ≠ BA para que el orden importe
      expect(prod(a, b), `semilla ${seed}`).not.toEqual(prod(b, a));
      expect(q.shape).toEqual([2, 2]); // contract: brief, shape [2, 2], respuesta por filas
      expect(q.tol).toBe(0); // contract: enteros exactos
      // contract: brief: el enunciado fija el orden de la composición
      expect(q.prompt).toContain('primero se aplica $B$ y después $A$');
    }
  });

  it('forma-producto: (m, n)(n, p) da [m, p], con n distinto de m y de p, sin shape', () => {
    const variants = new Set<string>();
    const sizes = new Set<number>();
    for (const seed of SEEDS) {
      const q = resolve(call('forma-producto'), seed);
      if (q.type !== 'vector') throw new Error('forma-producto debe dar un vector');
      const plain =
        /matriz \$A\$ de forma \$\((\d+), (\d+)\)\$ por .* \$B\$ de forma \$\((\d+), (\d+)\)\$/.exec(
          q.prompt,
        );
      const layer =
        /pesos \$W\$ de forma \$\((\d+), (\d+)\)\$ y recibe un lote de \$(\d+)\$ embeddings de dimensión \$(\d+)\$/.exec(
          q.prompt,
        );
      const m = Number((plain ?? layer)?.[1]);
      const n = Number((plain ?? layer)?.[2]);
      // contract: producto de (m×n) por (n×p): en la variante de capa, p es el tamaño del lote y n la dimensión
      const p = plain ? Number(plain[4]) : Number(layer?.[3]);
      const inner = plain ? Number(plain[3]) : Number(layer?.[4]);
      variants.add(plain ? 'plain' : 'layer');
      expect(plain ?? layer, `semilla ${seed}: ${q.prompt}`).not.toBeNull();
      expect(inner, `semilla ${seed}`).toBe(n); // contract: las dimensiones interiores coinciden, si no el producto no existe
      expect(q.answer, `semilla ${seed}`).toEqual([m, p]); // contract: (m, n)·(n, p) tiene forma (m, p)
      expect(n !== m && n !== p, `semilla ${seed}`).toBe(true); // contract: brief, la respuesta no se adivina por simetría
      expect(q.shape).toBeUndefined(); // contract: brief, vector de longitud 2 sin forma de matriz
      expect(q.tol).toBe(0); // contract: enteros exactos
      expect(q.prompt).toContain('Escribe filas y columnas'); // contract: brief
      sizes.add(m).add(p);
    }
    expect([...variants].sort()).toEqual(['layer', 'plain']); // contract: brief, hay variante de capa lineal
    expect(sizes.has(768)).toBe(true); // contract: brief, tamaños realistas de ML como 768
    expect(sizes.has(2) || sizes.has(3)).toBe(true); // contract: brief, mezclados con tamaños pequeños
  });

  it('los textos de las tres no llevan punto decimal', () => {
    for (const id of ['matriz-vector', 'producto-matrices', 'forma-producto']) {
      for (const seed of SEEDS.slice(0, 50)) {
        const q = resolve(call(id), seed);
        // contract: restricción global, coma decimal (aquí todo son enteros)
        expect(`${q.prompt}${q.solution}${q.explain}${q.hints.join('')}`).not.toMatch(/\d\.\d/);
      }
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
