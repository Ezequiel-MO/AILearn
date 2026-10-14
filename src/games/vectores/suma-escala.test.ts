import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import type { Question } from '../../content/schema';
import {
  defineProseTests,
  projectQuestions,
  proseTexts,
} from '../../../tests/content/prose-helpers';
import { sumaEscala } from './suma-escala';

defineProseTests('proyecto suma-escala', projectQuestions(sumaEscala));

describe('proyecto suma-escala', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: tarea 16, brief: checkProject(sumaEscala) devuelve la lista vacía
    expect(checkProject(sumaEscala)).toEqual([]);
  });

  it('se identifica como pide el brief', () => {
    // contract: tarea 16, brief: id suma-escala, nombre «Suma y escala», subtítulo «Combinar flechas»
    expect([sumaEscala.id, sumaEscala.name, sumaEscala.sub]).toEqual([
      'suma-escala',
      'Suma y escala',
      'Combinar flechas',
    ]);
  });

  it('tiene tres ejercicios de los tipos de la tabla y tres hojas', () => {
    // contract: tarea 16, brief: ex00 manipular, ex01 calcular, ex02 programar; tres hojas
    expect(sumaEscala.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(sumaEscala.sheets).toHaveLength(3);
  });
});

const goalsOf = (q: Question): string[] =>
  q.type === 'manipular'
    ? q.goals.map((g) => `${g.metric}(${g.of.join(',')})=${g.target}±${g.tol}`)
    : [];

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.options[q.correct];
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

describe('valores de la tabla del proyecto suma-escala', () => {
  const [ex00, ex01, ex02] = sumaEscala.exercises;

  it('ex00: metas de manipular', () => {
    // contract: tarea 16, tabla de ex00 (metas; la suma con sum_x y sum_y, el resto con x e y; tolerancia 0,01)
    expect(ex00!.questions.map(goalsOf)).toEqual([
      ['sum_x(u,v)=5±0.01', 'sum_y(u,v)=3±0.01'],
      ['sum_x(u,v)=0±0.01', 'sum_y(u,v)=0±0.01'],
      ['x(w)=2±0.01', 'y(w)=4±0.01'],
      ['x(w)=-2±0.01', 'y(w)=-1±0.01'],
      ['x(c)=3.5±0.01', 'y(c)=3.5±0.01'],
    ]);
  });

  it('ex00: rango 6 y rejilla de 1, salvo la última (0,5)', () => {
    // contract: tarea 16, tabla de ex00 (columna «Rango, snap»)
    expect(
      ex00!.questions.map((q) => (q.type === 'manipular' ? [q.plane.range, q.plane.snap] : [])),
    ).toEqual([
      [6, 1],
      [6, 1],
      [6, 1],
      [6, 1],
      [6, 0.5],
    ]);
  });

  it('ex00: los vectores fijos y móviles de la tabla', () => {
    // contract: tarea 16, tabla de ex00 (u fijo en (2, 1), (4, −1), (1, 2), (4, 2); gato y perro fijos)
    const fixed = ex00!.questions.map((q) =>
      q.type === 'manipular'
        ? q.plane.vectors.filter((v) => !v.movable).map((v) => `${v.id}=(${v.x}, ${v.y})`)
        : [],
    );
    expect(fixed).toEqual([
      ['u=(2, 1)'],
      ['u=(4, -1)'],
      ['u=(1, 2)'],
      ['u=(4, 2)'],
      ['gato=(3, 4)', 'perro=(4, 3)'],
    ]);
  });

  it('ex00: la lectura de suma solo aparece con pair', () => {
    for (const q of ex00!.questions) {
      if (q.type !== 'manipular') continue;
      // contract: tarea 16, brief: lectura de suma cuando hay pair (y solo entonces)
      expect(q.plane.readouts.includes('sum')).toBe(q.plane.pair !== undefined);
    }
  });

  it('ex01: respuestas de calcular', () => {
    // contract: tarea 16, tabla de ex01 (cuatro vectores y una opción)
    expect(ex01!.questions.map(answerOf)).toEqual([
      [[-3, 3], 0],
      [[-6, 3], 0],
      [[-2, 8], 0],
      [[-3, 1.333], 0.01],
      'No está definido; NumPy da un error de formas',
    ]);
  });

  it('ex01.5: las opciones de la tabla', () => {
    const q = ex01!.questions[4]!;
    // contract: tarea 16, tabla de ex01 #5: la correcta y tres distractores (rellenar con ceros, sumar las dos primeras, vector de 5)
    expect(q.type === 'opcion' ? q.options.length : 0).toBe(4);
    expect(q.type === 'opcion' ? q.options.filter((o) => /ceros/.test(o)).length : 0).toBe(1);
    expect(q.type === 'opcion' ? q.options.filter((o) => /dos primeras/.test(o)).length : 0).toBe(
      1,
    );
    expect(q.type === 'opcion' ? q.options.filter((o) => /de 5/.test(o)).length : 0).toBe(1);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: tarea 16, tabla de ex02: cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });

  it('hojas: línea errónea de cada una y formato', () => {
    // contract: tarea 16, tabla de hojas (la segunda línea, ninguna, la segunda línea; formatos codigo, texto, texto)
    expect(sumaEscala.sheets.map(answerOf)).toEqual([1, null, 1]);
    expect(sumaEscala.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: las líneas de la tabla', () => {
    // contract: tarea 16, tabla de hojas (líneas literales)
    expect(sumaEscala.sheets.map((s) => (s.type === 'revision' ? s.lines : []))).toEqual([
      ['E = np.array([[-3, 2], [-2, 3], [-4, -1]])', 'centroide = np.mean(E, axis=1)'],
      ['2 · (3, −1) = (6, −2)', '(6, −2) − (1, 1) = (5, −3)'],
      ['(1, 2) + (3, 4) = (4, 6)', '3 · (4, 6) = (12, 6)'],
    ]);
  });
});

// ---------- ronda de arreglo 1 (revisión 16) ----------

const byId = (id: string): Question => {
  const q = projectQuestions(sumaEscala).find((x) => x.id === id);
  if (!q) throw new Error(`No existe la pregunta ${id}`);
  return q;
};

/** Paréntesis sin anidar con una coma decimal («1,33» o «1{,}33») y sin «;» (regla R15). */
const decimalPairProblems = (text: string): string[] =>
  [...text.replace(/\{,\}/g, ',').matchAll(/\(([^()]*)\)/g)]
    .map((m) => m[1]!)
    .filter((inner) => /\d,\d/.test(inner) && !inner.includes(';'));

/** Los trozos de cada texto: fórmulas, prosa sin fórmulas y mensajes de las comprobaciones. */
const pieces = (q: Question): { where: string; text: string }[] => {
  const out: { where: string; text: string }[] = [];
  for (const { field, text } of proseTexts(q)) {
    for (const m of text.matchAll(/\$([^$]+)\$/g))
      out.push({ where: `${field} (fórmula)`, text: m[1]! });
    out.push({ where: field, text: text.replace(/\$[^$]+\$/g, 'X') });
  }
  if (q.type === 'codigo') {
    for (const m of q.checks.matchAll(/"([^"]*)"/g)) out.push({ where: 'checks', text: m[1]! });
  }
  return out;
};

describe('ronda de arreglo 1 de la revisión 16', () => {
  it('R15: todo par con decimales lleva «;», también en las soluciones y en las comprobaciones', () => {
    const problems = projectQuestions(sumaEscala).flatMap((q) =>
      pieces(q).flatMap((p) =>
        decimalPairProblems(p.text).map((i) => `${q.id} ${p.where}: (${i})`),
      ),
    );
    // contract: review-16 m1 y m2 (R15: «un par con algún decimal se separa con «; »»)
    expect(problems).toEqual([]);
  });

  it('ex02.4: el explain no dice qué eje usar', () => {
    // contract: review-16 I2 (el explain orienta sin dar la respuesta: la decisión de la pregunta es el eje)
    expect(byId('suma-escala.ex02.4').explain).not.toMatch(/\beje (0|1)\b|axis=/);
  });

  it('ex01.5: el explain no descarta las otras opciones', () => {
    // contract: review-16 I2 (tras el primer fallo, «mismo número de dimensiones» regala el segundo intento)
    expect(byId('suma-escala.ex01.5').explain).not.toMatch(
      /(mismo|igual) número de|solo se pueden/,
    );
  });

  it('ex01.3 nombra la combinación lineal', () => {
    // contract: review-16 m5 (el spec, sección 10, Órbita 0, nombra «combinación lineal» y este proyecto la enseña)
    expect(byId('suma-escala.ex01.3').prompt).toMatch(/combinación lineal/);
  });

  it('las tres hojas cierran su explain igual: la frase «no hay error» está en todas o en ninguna', () => {
    const has = sumaEscala.sheets.map((s) => /no hay error/i.test(s.explain));
    // contract: review-16 m7 (la frase solo en la hoja sin error la delata)
    expect(new Set(has).size).toBe(1);
  });

  it('ex01.5 habla de componentes, no de dimensiones, junto a NumPy', () => {
    // contract: review-16 m9 («dimensiones» en una frase sobre arrays es ambiguo; las opciones dicen «componentes»)
    expect(byId('suma-escala.ex01.5').prompt).not.toMatch(/dimensiones/);
  });

  it('ningún enunciado deja `axis=...` para copiar', () => {
    for (const q of projectQuestions(sumaEscala)) {
      // contract: review-16 m12 b (copiado tal cual, `axis=...` da un TypeError)
      expect(q.prompt).not.toMatch(/axis=\.\.\./);
    }
  });

  it('ex02.4: el centroide se escribe con ≈, no con «=» y «aproximadamente»', () => {
    const q = byId('suma-escala.ex02.4');
    // contract: review-16 m13 (como ex01.4)
    expect(q.solution).toContain('\\approx');
    expect(q.solution).not.toMatch(/aproximadamente/);
  });
});

// ---------- ronda de arreglo 2 (re-revisión 16) ----------

describe('ronda de arreglo 2 de la re-revisión 16', () => {
  it('ex02.4: el enunciado enseña la forma de la llamada a np.mean sin dar la respuesta', () => {
    const { prompt } = byId('suma-escala.ex02.4');
    // contract: rereview-16 N1 (la matriz va primero y `axis` después: la forma se ve en el enunciado)
    expect(prompt).toMatch(/np\.mean\(E/);
    // contract: rereview-16 N1 (la decisión del eje sigue siendo del jugador: la llamada que es la respuesta no sale)
    expect(prompt).not.toContain('np.mean(E, axis=0)');
    expect(prompt).not.toMatch(/axis=\.\.\./);
  });

  it('ningún texto del proyecto remite a algo «que ya conoces» de otro proyecto', () => {
    const found = projectQuestions(sumaEscala).flatMap((q) =>
      proseTexts(q)
        .filter((t) => /que ya conoces|como ya (sabes|viste)/i.test(t.text))
        .map((t) => `${q.id} ${t.field}`),
    );
    // contract: rereview-16 N2 (los proyectos de la órbita se abren a la vez: solo el despegue es anterior segura)
    expect(found).toEqual([]);
  });

  it('ex01.5: el enunciado dice qué hace la resta de arrays', () => {
    // contract: rereview-16 N2 (la resta de arrays no se enseña en el despegue: se dice en su sitio)
    expect(byId('suma-escala.ex01.5').prompt).toMatch(/`-` los resta/);
  });

  it('ningún starter de una pregunta de código tiene un decimal con coma', () => {
    for (const q of projectQuestions(sumaEscala)) {
      if (q.type !== 'codigo') continue;
      // contract: rereview-16 N4 (en Python, `-0,5` es una tupla: el starter muestra el decimal con punto)
      expect(q.starter, q.id).not.toMatch(/\d,\d/);
    }
  });

  it('ex01.3: la definición de combinación lineal no se mezcla con el procedimiento del caso', () => {
    // contract: rereview-16 N6 (los dos puntos hacían leer el procedimiento de este caso como la definición)
    expect(byId('suma-escala.ex01.3').prompt).not.toMatch(/combinación lineal\*\*:/);
  });
});
