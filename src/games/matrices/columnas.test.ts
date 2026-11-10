import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { bankEntrySchema, type CodigoQ, type Question } from '../../content/schema';
import {
  labAt,
  defineLabProjectTests,
  labQuestion,
  solves,
} from '../../../tests/content/lab-helpers';
import {
  checkMessages,
  defineProseTests,
  projectQuestions,
  withoutCode,
} from '../../../tests/content/prose-helpers';
import { columnas } from './columnas';
import { examen0Columnas } from './examen-0-columnas';

const bankQuestions = examen0Columnas
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto columnas', projectQuestions(columnas));
defineProseTests('banco examen-0 columnas', bankQuestions);
defineLabProjectTests(columnas, examen0Columnas);

describe('proyecto columnas', () => {
  it('pasa checkProject sin problemas', () => {
    // contract: encargo común de la Órbita 0 de matrices: checkProject(columnas) devuelve la lista vacía (incluye checkLab en cada laboratorio)
    expect(checkProject(columnas)).toEqual([]);
  });

  it('se identifica como pide el encargo', () => {
    // contract: brief-juego-2.md (petición de Oliver 2026-11-10): Columnas, «adónde manda la capa cada rasgo»; el id no cambia
    expect([columnas.id, columnas.name, columnas.sub]).toEqual([
      'columnas',
      'Columnas',
      'Adónde manda la capa cada rasgo',
    ]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 0 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(columnas.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(columnas.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(columnas.sheets).toHaveLength(3);
  });

  it('los ids siguen el patrón columnas.exNN.k y columnas.hoja.k', () => {
    // contract: traspaso 2026-11-10: los ids se conservan al reescribir (el progreso guardado los nombra)
    expect(projectQuestions(columnas).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `columnas.ex0${e}.${k}`)),
      'columnas.hoja.1',
      'columnas.hoja.2',
      'columnas.hoja.3',
    ]);
  });
});

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.correct;
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

describe('columnas, «Manipular»: lo que cuenta cada pregunta se mide con el laboratorio', () => {
  const all = projectQuestions(columnas);
  const lab = (k: number) => labQuestion(all, `columnas.ex00.${k}`);

  it('ex00.1: al empezar la neurona dice «positiva» a todo; mandar el tono a la salida 1 resuelve', () => {
    // contract: enunciado de ex00.1: «ahí llega la intensidad, y dice positiva a todo» (acierta 3 de 6)
    expect(labAt(lab(1)).acc).toBe(0.5);
    // contract: solution de ex00.1: î en (0, 1) y ĵ en (1, 0)
    expect(solves(lab(1), { ix: 0, iy: 1, jx: 1, jy: 0 })).toBe(true);
    // contract: regla 3 de la guía (varias soluciones): también vale con la intensidad en el origen o con el tono pesando el doble
    expect(solves(lab(1), { ix: 0, iy: 0, jx: 1, jy: 0 })).toBe(true);
    expect(solves(lab(1), { ix: 1, iy: 0, jx: 2, jy: 1 })).toBe(true);
    // contract: tentadora y mala: alargar ĵ sin sacarla de su eje deja la intensidad en la salida 1
    expect(solves(lab(1), { jx: 0, jy: 3 })).toBe(false);
  });

  it('ex00.2: con el umbral, «bueno» y «feliz» se quedan cortas hasta que el tono cuenta el doble', () => {
    // contract: enunciado de ex00.2: «bueno» y «feliz» se quedan cortas (acierta 4 de 6)
    expect(labAt(lab(2)).hits).toBe(4);
    // contract: solution de ex00.2: ĵ en (2, 0) resuelve; con (1,5; 0), «bueno» se queda sobre la frontera
    expect(solves(lab(2), { jx: 2 })).toBe(true);
    expect(labAt(lab(2), { jx: 1.5 }).hits).toBe(5);
    // contract: solution de ex00.2: también vale ayudarse de la intensidad, con î en (1, 1)
    expect(solves(lab(2), { ix: 1, iy: 1 })).toBe(true);
  });

  it('ex00.3: la capa de antes falla con las seis; dar la vuelta a ĵ lo arregla y a î, no', () => {
    // contract: enunciado de ex00.3: «falla con las seis»
    expect(labAt(lab(3)).acc).toBe(0);
    // contract: solution de ex00.3: ĵ en (−1, 0) resuelve y el determinante pasa de −1 a 1
    expect(solves(lab(3), { jx: -1 })).toBe(true);
    expect(labAt(lab(3)).det).toBe(-1);
    expect(labAt(lab(3), { jx: -1 }).det).toBe(1);
    // contract: tentadora y mala (solution): dar la vuelta a î no cambia la primera salida
    expect(labAt(lab(3), { iy: -1 }).acc).toBe(0);
  });

  it('ex00.4: hace falta mezclar los dos rasgos; la capa que valía para las reseñas no vale', () => {
    // contract: solution de ex00.4: î en (1, 0) y ĵ en (−1, 1)
    expect(solves(lab(4), { jx: -1, jy: 1 })).toBe(true);
    // contract: regla 3 de la guía (varias soluciones): también con los pesos 2 y −1,5
    expect(solves(lab(4), { ix: 2, jx: -1.5 })).toBe(true);
    // contract: tentadora y mala: intercambiar las columnas, como en ex00.1, deja un solo rasgo en la salida 1
    expect(labAt(lab(4), { ix: 0, iy: 1, jx: 1, jy: 0 }).acc).toBe(0.5);
    // contract: enunciado de ex00.4: «ningún rasgo basta»: con ĵ fuera de la salida 1, ningún peso de los enlaces acierta todo
    for (const ix of [-2, -1, 1, 2]) {
      expect(labAt(lab(4), { ix, jx: 0 }).acc, `ix = ${ix}`).toBeLessThan(1);
    }
  });

  it('ex00.5: empieza acertando sin área; subir î recupera la intensidad y llevarla a (1, 1) estropea el acierto', () => {
    const start = labAt(lab(5));
    // contract: enunciado de ex00.5: «acierta con las seis» y «el cuadrado unidad se ha quedado sin área»
    expect([start.acc, start.area]).toEqual([1, 0]);
    // contract: solution de ex00.5: î en (0, 1) resuelve, con área 1
    expect(solves(lab(5), { ix: 0, iy: 1 })).toBe(true);
    expect(labAt(lab(5), { ix: 0, iy: 1 }).area).toBe(1);
    // contract: tentadora y mala (solution): î en (1, 1) da área 1, pero «horrible» pasa a la zona sombreada y «malo» y «triste» quedan sobre la frontera, que el motor no cuenta como acierto (3 de 6)
    const mixed = labAt(lab(5), { ix: 1, iy: 1 });
    expect([mixed.area, mixed.hits]).toEqual([1, 3]);
    expect(solves(lab(5), { ix: 1, iy: 1 })).toBe(false);
  });

  it('las cinco comparten la neurona que mira la primera salida y cambian una cosa cada vez', () => {
    const readouts = [1, 2, 3, 4, 5].map((k) => {
      const spec = lab(k).lab;
      if (spec.kind !== 'capa') throw new Error('ex00 usa el laboratorio capa');
      return [spec.readout?.w, spec.readout?.b, spec.axes?.[1]];
    });
    // contract: brief-juego-2.md, Columnas: misma escena (neurona w = (1, 0)); umbral en la 2, «negatividad» en la 3 y los correos en la 4
    expect(readouts).toEqual([
      [[1, 0], 0, 'tono'],
      [[1, 0], -1.5, 'tono'],
      [[1, 0], 0, 'negatividad'],
      [[1, 0], 0, 'saludos'],
      [[1, 0], 0, 'tono'],
    ]);
  });
});

describe('columnas, «Calcular»: las respuestas se recalculan', () => {
  const [, ex01, ex02] = columnas.exercises;

  it('respuestas de calcular', () => {
    // contract: petición de Oliver 2026-11-10 (sustituye la tabla de la Órbita 0): pesos (1 −1; 0 1) por filas; 3072·768 + 3072; 0,5·2 + 1·1,5; la segunda columna (índice 1); 384 columnas
    expect(ex01!.questions.map(answerOf)).toEqual([
      [[1, -1, 0, 1], 0],
      [3072 * 768 + 3072, 0],
      [0.5 * 2 + 1 * 1.5, 0],
      1,
      [384, 0],
    ]);
  });

  it('ex01.1: la matriz de la respuesta, construida en su laboratorio, es el filtro de spam que acierta', () => {
    const q = ex01!.questions[0]!;
    if (q.type !== 'vector' || q.lab?.kind !== 'capa') throw new Error('ex01.1 es vector con capa');
    const [m11, m12, m21, m22] = q.answer as [number, number, number, number];
    const values = labAt(
      { ...labQuestion(projectQuestions(columnas), 'columnas.ex00.4'), lab: q.lab },
      { ix: m11, iy: m21, jx: m12, jy: m22 },
    );
    // contract: solution de ex01.1: î en (1, 0) y ĵ en (−1, 1); la salida 1 es enlaces − saludos y la neurona acierta los seis
    expect([values.m11, values.m12, values.m21, values.m22]).toEqual([1, -1, 0, 1]);
    expect(values.acc).toBe(1);
    // contract: ex01.1 se teclea como matriz de 2×2
    expect(q.shape).toEqual([2, 2]);
  });

  it('ex01.2 y ex01.5: las cifras de las soluciones', () => {
    // contract: solution de ex01.2: 3072·768 = 2 359 296 pesos y 2 362 368 parámetros
    expect(3072 * 768).toBe(2359296);
    expect(3072 * 768 + 3072).toBe(2362368);
    expect(ex01!.questions[1]!.solution).toContain('2\\,362\\,368');
    // contract: solution de ex01.5: 128·384 = 49 152 pesos
    expect(128 * 384).toBe(49152);
    expect(ex01!.questions[4]!.solution).toContain('49\\,152');
  });

  it('ex01.3: la matriz del enunciado y los rasgos de «feliz» son los de la cuenta', () => {
    const q = ex01!.questions[2]!;
    // contract: ex01.3: A = (0,5 1; 1 0) y «feliz» = (2; 1,5), como en RESENAS
    expect(q.prompt).toContain('\\begin{pmatrix}0{,}5&1\\\\1&0\\end{pmatrix}');
    if (q.type !== 'numero' || q.lab?.kind !== 'capa') throw new Error('ex01.3 es numero con capa');
    const feliz = q.lab.points.find((p) => p.id === 'feliz')!;
    expect([feliz.x, feliz.y]).toEqual([2, 1.5]);
    // contract: solution de ex01.3: la segunda salida es 1·2 + 0·1,5 = 2
    expect(1 * feliz.x + 0 * feliz.y).toBe(2);
  });

  it('ex01.4: la opción correcta es doblar la segunda columna, y su laboratorio empieza en la matriz del enunciado', () => {
    const q = ex01!.questions[3]!;
    if (q.type !== 'opcion' || q.lab?.kind !== 'capa') throw new Error('ex01.4 es opcion con capa');
    // contract: ex01.4: un rasgo es una columna; el tono es el segundo rasgo
    expect(q.options[q.correct]).toBe('Multiplicar por 2 la segunda columna');
    // contract: ex01.4: A = (0 1; 1 0,5): î en (0, 1) y ĵ en (1; 0,5)
    expect(q.prompt).toContain('\\begin{pmatrix}0&1\\\\1&0{,}5\\end{pmatrix}');
    expect([q.lab.i, q.lab.j]).toEqual([
      [0, 1],
      [1, 0.5],
    ]);
  });

  it('ex02: cinco preguntas de código', () => {
    // contract: encargo de la Órbita 0 de matrices: ex02 programar, cinco preguntas de código
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
  });
});

describe('columnas: hojas', () => {
  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 0 de matrices: imágenes en filas (línea 3), «A[0] es la imagen de î» (línea 2) y un razonamiento correcto (null); al menos una de código
    expect(columnas.sheets.map(answerOf)).toEqual([2, 1, null]);
    expect(columnas.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
  });

  it('hojas: la línea errónea es la de la tabla', () => {
    // contract: tabla de hojas: `np.array([img_i, img_j])` sin `.T` y «A[0] es la imagen de î»
    const faulty = columnas.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    expect(faulty).toEqual(['A = np.array([img_i, img_j])', 'A[0] es la imagen de î', null]);
  });

  it('hojas: el enunciado acaba con la frase común (R25) y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 del juego 1 (prosa.test.ts): la misma frase final en todas las hojas
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of columnas.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras de las hojas se recalculan', () => {
    // contract: hoja 1: con las imágenes como filas, A @ (1, 0) es la primera columna de la traspuesta, (2, −1), y no (2, 1)
    const rows = [
      [2, 1],
      [-1, 3],
    ];
    expect([rows[0]![0], rows[1]![0]]).toEqual([2, -1]);
    // contract: hoja 2: de A = (1 3; 2 4), A[0] = (1, 3) es la primera fila y la primera columna es (1, 2)
    const A = [
      [1, 3],
      [2, 4],
    ];
    expect(A[0]).toEqual([1, 3]);
    expect(A.map((r) => r[0])).toEqual([1, 2]);
  });
});

describe('banco de examen 0 del proyecto columnas', () => {
  it('tiene tres entradas fijas del proyecto columnas, con ids examen-0.*', () => {
    // contract: guía de contenido 2026-11-10: una entrada laboratorio y cálculo del estilo nuevo; la de código se conserva («Programar» no se toca)
    expect(examen0Columnas.map((e) => e.project)).toEqual(['columnas', 'columnas', 'columnas']);
    expect(examen0Columnas.map((e) => e.question.id)).toEqual([
      'examen-0.capa-mascotas',
      'examen-0.parametros-capa',
      'examen-0.columnas-con-numpy',
    ]);
  });

  it('cada entrada cumple el esquema del banco', () => {
    for (const entry of examen0Columnas) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
  });

  it('ninguna entrada es generada, hay variedad de tipos y los ids no chocan con los del proyecto', () => {
    // contract: guía de contenido 2026-11-10: un laboratorio, un numero y un codigo; las generadas las añade el ensamblado
    expect(examen0Columnas.some((e) => e.question.type === 'generada')).toBe(false);
    expect(examen0Columnas.map((e) => e.question.type)).toEqual([
      'laboratorio',
      'numero',
      'codigo',
    ]);
    const projectIds = new Set(projectQuestions(columnas).map((q) => q.id));
    expect(examen0Columnas.filter((e) => projectIds.has(e.question.id))).toEqual([]);
  });

  it('respuestas del banco', () => {
    const mascotas = labQuestion(bankQuestions, 'examen-0.capa-mascotas');
    // contract: examen-0.capa-mascotas: al empezar la salida 1 es el tamaño y la neurona dice «mascota» a todo
    expect(labAt(mascotas).acc).toBe(0.5);
    // contract: solution: î en (0, 1) y ĵ en (1, 0) manda la domesticidad a la salida 1
    expect(solves(mascotas, { ix: 0, iy: 1, jx: 1, jy: 0 })).toBe(true);
    // contract: tentadora y mala: dar la vuelta a î manda el tamaño al otro lado y la neurona dice «salvaje» a todo
    expect(labAt(mascotas, { ix: -1 }).acc).toBe(0.5);
    const parametros = bankQuestions[1]!;
    // contract: examen-0.parametros-capa: 128·384 pesos y 128 sesgos
    expect(answerOf(parametros)).toEqual([128 * 384 + 128, 0]);
    expect(128 * 384 + 128).toBe(49280);
  });
});

describe('proyecto columnas: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(columnas), ...bankQuestions].filter(
    (q): q is CodigoQ => q.type === 'codigo',
  );

  it('los mensajes de las comprobaciones llevan el código en línea entre acentos graves', () => {
    for (const q of code) {
      for (const m of checkMessages(q)) {
        // contract: rereview-17d n1 (prosa.test.ts): `np.`, `plt.`, `None` y `emb` van en código en línea
        expect(withoutCode(m), `${q.id}: ${m}`).not.toMatch(/\b(np|plt)\.\w|\bNone\b|\bemb\b/);
      }
    }
  });

  it('los identificadores del starter y de la reference van en código en línea (review-18r m3)', () => {
    const SPANISH_WORDS = new Set(['y', 'e', 'o', 'a']);
    for (const q of code) {
      const names = new Set(
        [...`${q.starter}\n${q.reference}`.matchAll(/^(\w+)\s*=/gm)]
          .map((m) => m[1]!)
          .filter((n) => !SPANISH_WORDS.has(n)),
      );
      for (const m of checkMessages(q)) {
        const plain = withoutCode(m);
        for (const n of names)
          // contract: review-18r m3 (M18, prosa.test.ts): ningún nombre que el jugador escribe va suelto en un mensaje
          expect(plain, `${q.id}: ${m}`).not.toMatch(
            new RegExp(`(?<![\\p{L}_\\d])${n}(?![\\p{L}_\\d])`, 'u'),
          );
        // contract: review-18r bn1 (prosa.test.ts): las comillas rectas son código
        expect(plain, `${q.id}: ${m}`).not.toMatch(/\\?"/);
      }
    }
  });

  it('cada pregunta de código tiene mensajes que revisar', () => {
    // contract: encargo de la Órbita 0 de matrices: cinco preguntas de código en ex02 y una en el banco
    expect(code.map((q) => q.id)).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `columnas.ex02.${n}`),
      'examen-0.columnas-con-numpy',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
