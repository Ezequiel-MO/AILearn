import { describe, expect, it } from 'vitest';
import { checkProject } from '../../content/validate';
import { bankEntrySchema, type CodigoQ, type LabQ, type Question } from '../../content/schema';
import { labControls, type LabState } from '../../engine/labs';
import { loraScene, type LoraSpec } from '../../engine/labs/lora';
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
import { rangoBajo } from './rango-bajo';
import { examen3RangoBajo } from './examen-3-rango-bajo';

const bankQuestions = examen3RangoBajo
  .map((e) => e.question)
  .filter((q): q is Question => q.type !== 'generada');

defineProseTests('proyecto rango-bajo', projectQuestions(rangoBajo));
defineProseTests('banco examen-3 rango-bajo', bankQuestions);
defineLabProjectTests(rangoBajo, examen3RangoBajo);

describe('proyecto rango-bajo', () => {
  it('se identifica como pide el encargo', () => {
    // contract: encargo de la Órbita 3 de matrices (tabla de la parte común): id rango-bajo, nombre «Rango bajo y LoRA», subtítulo «Comprimir y afinar»
    expect([rangoBajo.id, rangoBajo.name, rangoBajo.sub]).toEqual([
      'rango-bajo',
      'Rango bajo y LoRA',
      'Comprimir y afinar',
    ]);
  });

  it('pasa checkProject sin problemas', () => {
    // contract: encargo común de la Órbita 3 de matrices: checkProject(rangoBajo) devuelve la lista vacía (incluye checkLab en cada laboratorio)
    expect(checkProject(rangoBajo)).toEqual([]);
  });

  it('tiene tres ejercicios de 5 preguntas, de los tipos de la tabla, y tres hojas', () => {
    // contract: encargo de la Órbita 3 de matrices: ex00 manipular, ex01 calcular, ex02 programar; 5 preguntas cada uno; tres hojas
    expect(rangoBajo.exercises.map((e) => e.kind)).toEqual(['manipular', 'calcular', 'programar']);
    expect(rangoBajo.exercises.map((e) => e.questions.length)).toEqual([5, 5, 5]);
    expect(rangoBajo.sheets).toHaveLength(3);
  });

  it('tiene calentamiento de Python de 1 a 4 fichas', () => {
    // contract: encargo de la Órbita 3 de matrices: calentamiento de 1 a 4 fichas enlazado con warmup
    expect(rangoBajo.warmup?.length).toBeGreaterThanOrEqual(1);
    expect(rangoBajo.warmup?.length).toBeLessThanOrEqual(4);
  });

  it('los ids siguen el patrón rango-bajo.exNN.k y rango-bajo.hoja.k', () => {
    // contract: traspaso 2026-11-10: los ids se conservan al reescribir (el progreso guardado los nombra)
    expect(projectQuestions(rangoBajo).map((q) => q.id)).toEqual([
      ...[0, 1, 2].flatMap((e) => [1, 2, 3, 4, 5].map((k) => `rango-bajo.ex0${e}.${k}`)),
      'rango-bajo.hoja.1',
      'rango-bajo.hoja.2',
      'rango-bajo.hoja.3',
    ]);
  });
});

const answerOf = (q: Question): unknown => {
  if (q.type === 'numero' || q.type === 'vector') return [q.answer, q.tol];
  if (q.type === 'opcion') return q.correct;
  if (q.type === 'revision') return q.faultyLine;
  return undefined;
};

const loraOf = (q: LabQ): LoraSpec => {
  if (q.lab.kind !== 'lora') throw new Error(`${q.id} usa el laboratorio lora`);
  return q.lab;
};

/** Todos los estados de los cuatro deslizadores de B y A en su rejilla (9⁴ = 6561 con ±2 y paso 0,5). */
const gridStates = (spec: LoraSpec): LabState[] => {
  const values: number[] = [];
  for (let v = -spec.limit; v <= spec.limit + 1e-9; v += spec.step) values.push(v);
  const out: LabState[] = [];
  for (const b1 of values)
    for (const b2 of values)
      for (const a1 of values) for (const a2 of values) out.push({ b1, b2, a1, a2 });
  return out;
};

/** ¿Caben las palabras originales, las afinadas y las dianas en la ventana con `state`? */
const fits = (spec: LoraSpec, state: LabState): boolean => {
  const { original, afterTuning } = loraScene(spec, state);
  const all = [
    ...Object.values(original),
    ...Object.values(afterTuning),
    ...Object.values(spec.targets ?? {}),
  ];
  return all.every((p) => Math.max(Math.abs(p[0]), Math.abs(p[1])) <= spec.range + 1e-9);
};

describe('rango-bajo, «Manipular»: lo que cuenta cada pregunta se mide con el laboratorio', () => {
  const all = projectQuestions(rangoBajo);
  const lab = (k: number) => labQuestion(all, `rango-bajo.ex00.${k}`);

  it('las cinco usan lora sobre las reseñas con el mismo modelo congelado, y caben en la ventana', () => {
    for (const k of [1, 2, 3, 4, 5]) {
      const spec = loraOf(lab(k));
      // contract: brief-juego-2.md, «Rango bajo y LoRA»: la escena es lora con RESENAS; mismo W en las cinco (una cosa nueva cada vez)
      expect([spec.mode ?? 'lora', spec.w, spec.points.length], `ex00.${k}`).toEqual([
        'lora',
        { i: [1, 0], j: [0.5, 1] },
        6,
      ]);
      // contract: brief-proyecto-comun.md: las palabras y las dianas caben en la ventana al empezar y resuelto
      expect(fits(spec, {}), `ex00.${k} al empezar`).toBe(true);
      expect(fits(spec, lab(k).solved), `ex00.${k} resuelto`).toBe(true);
    }
  });

  it('ninguna nace resuelta: con B = (0, 0) la corrección es nula y el modelo afinado es el original', () => {
    for (const k of [1, 2, 3, 5]) {
      const start = labAt(lab(k));
      // contract: cabecera de src/engine/labs/lora.ts: B empieza en (0, 0), ΔW = 0 y ninguna palabra se mueve
      expect([start.delta_norm, start.moved, start.delta_rank], `ex00.${k}`).toEqual([0, 0, 0]);
      // contract: encargo de rango-bajo: la corrección nula no cumple ninguna pregunta
      expect(solves(lab(k)), `ex00.${k}`).toBe(false);
    }
    // contract: ex00.4 empieza en r = 64, fuera del presupuesto
    expect(solves(lab(4))).toBe(false);
  });

  it('ex00.1: el original dice «positiva» a todo; restar intensidad con B·A lo arregla', () => {
    // contract: enunciado de ex00.1: «dice positiva a las seis reseñas» (acierta 3 de 6)
    expect(labAt(lab(1)).hits).toBe(3);
    // contract: solution de ex00.1: B = (−1, 0) con A = (1, 0), y también B = (1, 0) con A = (−1, 1)
    expect(solves(lab(1), { b1: -1 })).toBe(true);
    expect(solves(lab(1), { b1: 1, a1: -1, a2: 1 })).toBe(true);
    // contract: tentadora y mala: con A leyendo la intensidad, B positiva suma más intensidad y sigue diciendo «positiva» a todo
    expect(labAt(lab(1), { b1: 1 }).hits).toBe(3);
  });

  it('ex00.2: las dianas piden un desplazamiento de rango 1 y varias parejas B, A llegan', () => {
    // contract: solution de ex00.2: B = (1, 1) con A = (0; 0,5), (0,5; 0,5) con (0, 1) y (−1, −1) con (0; −0,5)
    expect(solves(lab(2), { b1: 1, b2: 1, a1: 0, a2: 0.5 })).toBe(true);
    expect(solves(lab(2), { b1: 0.5, b2: 0.5, a1: 0, a2: 1 })).toBe(true);
    expect(solves(lab(2), { b1: -1, b2: -1, a1: 0, a2: -0.5 })).toBe(true);
    // contract: solution de ex00.2: «genial» avanza (1, 1) y «horrible» retrocede lo mismo
    const scene = loraScene(loraOf(lab(2)), { b1: 1, b2: 1, a1: 0, a2: 0.5 });
    const shift = (id: string) => scene.afterTuning[id]!.map((v, k) => v - scene.original[id]![k]!);
    expect([shift('genial'), shift('horrible')]).toEqual([
      [1, 1],
      [-1, -1],
    ]);
    // contract: enunciado de ex00.2: con A leyendo la intensidad (como empieza), ninguna B lleva las seis a su diana
    const spec = loraOf(lab(2));
    const withStartA = gridStates(spec).filter((s) => s.a1 === 1 && s.a2 === 0);
    expect(withStartA.some((s) => solves(lab(2), s))).toBe(false);
  });

  it('ex00.3: con rango 1, dos de seis es el máximo, y solo «malo» y «triste» llegan a la vez', () => {
    const spec = loraOf(lab(3));
    const states = gridStates(spec);
    const onTarget = states.map((s) => labAt(lab(3), s).on_target!);
    // contract: enunciado de ex00.3 («no hay manera de llevar las seis») y regla 4 de la guía: el máximo, recorriendo la rejilla entera, es 2
    expect(Math.max(...onTarget)).toBe(2);
    // contract: explain de ex00.3: la única pareja que llega a la vez es la de la misma recta desde el origen
    const pairs = new Set(
      states
        .filter((s, k) => onTarget[k] === 2)
        .map((s) => {
          const scene = loraScene(spec, s);
          return Object.entries(spec.targets!)
            .filter(
              ([id, t]) =>
                Math.hypot(scene.afterTuning[id]![0] - t[0], scene.afterTuning[id]![1] - t[1]) <
                1e-6,
            )
            .map(([id]) => id)
            .join(',');
        }),
    );
    expect([...pairs]).toEqual(['malo,triste']);
    // contract: solution de ex00.3: B = (0,5; −0,5) con A = (1, 0) o con A = (0, −1)
    expect(solves(lab(3), { b1: 0.5, b2: -0.5 })).toBe(true);
    expect(solves(lab(3), { b1: 0.5, b2: -0.5, a1: 0, a2: -1 })).toBe(true);
    // contract: tentadora y mala (pista 1): apuntar B como la flecha de «bueno», una positiva, solo lleva esa palabra
    expect(labAt(lab(3), { b1: 0.5, b2: 0.5, a1: 0.5, a2: 0.5 }).on_target).toBe(1);
    // contract: solution de ex00.3: el ajuste completo pide ΔW = (0,5 0; 0 0,5), de rango 2
    expect(
      labAt({ ...lab(3), lab: { ...spec, mode: 'full', start: [0.5, 0, 0, 0.5] } }).on_target,
    ).toBe(6);
  });

  it('ex00.4: el 1 % admite r de 1 a 20; r = 21 ya pasa', () => {
    // contract: enunciado de ex00.4: empieza fuera del presupuesto (r = 64, un 3,125 %)
    expect(labAt(lab(4)).saving_pct).toBe(3.125);
    // contract: solution de ex00.4: r = 16 (0,78 %) y r = 20 (0,98 %) valen; r = 21 (1,03 %) no
    expect(solves(lab(4), { r: 16 })).toBe(true);
    expect(solves(lab(4), { r: 20 })).toBe(true);
    expect(solves(lab(4), { r: 21 })).toBe(false);
    expect(labAt(lab(4), { r: 16 }).params_lora).toBe(131072);
    // contract: solution de ex00.4: el 1 % de 16 777 216 son unos 168 000 (pista 2)
    expect(Math.round(16777216 / 100 / 1000)).toBe(168);
  });

  it('ex00.5: la solución de ex00.1 acierta pero es demasiado grande; hay correcciones pequeñas que aciertan', () => {
    // contract: solution de ex00.5: restar toda la intensidad acierta con tamaño 1, demasiado
    expect(labAt(lab(5), { b1: -1 }).acc).toBe(1);
    expect(labAt(lab(5), { b1: -1 }).delta_norm).toBe(1);
    expect(solves(lab(5), { b1: -1 })).toBe(false);
    // contract: solution de ex00.5: B = (0,5; 0) con A = (−1; 0,5), tamaño 0,56, y B = (−0,5; 0) con A = (1, −1), tamaño 0,71
    expect(solves(lab(5), { b1: 0.5, a1: -1, a2: 0.5 })).toBe(true);
    expect(labAt(lab(5), { b1: 0.5, a1: -1, a2: 0.5 }).delta_norm).toBeCloseTo(0.559, 3);
    expect(solves(lab(5), { b1: -0.5, a1: 1, a2: -1 })).toBe(true);
    expect(labAt(lab(5), { b1: -0.5, a1: 1, a2: -1 }).delta_norm).toBeCloseTo(0.707, 3);
    // contract: tentadora y mala (pista 1): quitar solo media intensidad, B = (−0,5; 0) con A = (1, 0), deja «horrible» del lado positivo y «malo» y «triste» sobre la frontera, que el motor no cuenta como acierto (3 de 6)
    expect(labAt(lab(5), { b1: -0.5 }).hits).toBe(3);
    expect(solves(lab(5), { b1: -0.5 })).toBe(false);
  });
});

describe('rango-bajo, «Calcular»: las respuestas se recalculan', () => {
  const [, ex01] = rangoBajo.exercises;
  const q = (k: number) => ex01!.questions[k - 1]!;

  it('respuestas de calcular', () => {
    // contract: petición de Oliver 2026-11-10 (sustituye la tabla de la Órbita 3): B = 0 da el modelo original (opción 0); rango máximo r = 8; 8·(11 008 + 4096) / (11 008·4096) en %; 64·16·8192·4 bytes en MB; ex01.5 se conserva (8·(4096 + 4096))
    expect(ex01!.questions.map(answerOf)).toEqual([
      0,
      [8, 0],
      [0.27, 0.01],
      [32, 0],
      [8 * (4096 + 4096), 0],
    ]);
  });

  it('ex01.1: con B = (0, 0), mover A no mueve ninguna palabra', () => {
    const one = q(1);
    if (one.type !== 'opcion' || one.lab?.kind !== 'lora')
      throw new Error('ex01.1 es opcion con lora');
    const spec = one.lab;
    // contract: solution de ex01.1: con B = 0, ΔW = 0 y ninguna palabra se mueve, por mucho que cambie A
    for (const s of gridStates(spec).filter((x) => x.b1 === 0 && x.b2 === 0)) {
      expect(loraScene(spec, s).delta.every((v) => v === 0)).toBe(true);
    }
    // contract: ex01.1: la opción correcta es la del modelo original
    expect(one.options[one.correct]).toBe(
      'Que el modelo afinado empiece siendo exactamente el original',
    );
  });

  it('ex01.2: en el laboratorio de rango 1, el rango de la corrección nunca pasa de 1', () => {
    const two = q(2);
    if (two.type !== 'numero' || two.lab?.kind !== 'lora')
      throw new Error('ex01.2 es numero con lora');
    const spec = two.lab;
    const ranks = new Set(
      gridStates(spec).map(
        (s) =>
          labAt({ ...labQuestion(projectQuestions(rangoBajo), 'rango-bajo.ex00.1'), lab: spec }, s)
            .delta_rank,
      ),
    );
    // contract: solution de ex01.2: con r = 1, el rango de la corrección vale 0 o 1, nunca 2
    expect([...ranks].sort()).toEqual([0, 1]);
  });

  it('ex01.3 y ex01.4: las cifras de las soluciones', () => {
    // contract: solution de ex01.3: 8·15 104 = 120 832; 11 008·4096 = 45 088 768; 0,27 %; unas 373 veces menos
    expect(8 * (11008 + 4096)).toBe(120832);
    expect(11008 * 4096).toBe(45088768);
    expect((100 * 120832) / 45088768).toBeCloseTo(0.27, 2);
    expect(Math.round(45088768 / 120832)).toBe(373);
    // contract: solution de ex01.4: 16·8192 = 131 072 por matriz; ×64 = 8 388 608; ×4 = 33 554 432 bytes = 32 MB; ajuste completo 4096 MB, 128 veces más
    expect(16 * 8192).toBe(131072);
    expect(64 * 131072).toBe(8388608);
    expect(64 * 131072 * 4).toBe(33554432);
    expect(33554432 / 1048576).toBe(32);
    expect((64 * 4096 * 4096 * 4) / 1048576).toBe(4096);
    expect(4096 / 32).toBe(128);
  });

  it('ex01.3 y ex01.4: el laboratorio cuenta la capa del enunciado', () => {
    const all = projectQuestions(rangoBajo);
    const host = labQuestion(all, 'rango-bajo.ex00.4');
    const three = q(3);
    const four = q(4);
    if (three.type !== 'numero' || three.lab?.kind !== 'lora')
      throw new Error('ex01.3 es numero con lora');
    if (four.type !== 'numero' || four.lab?.kind !== 'lora')
      throw new Error('ex01.4 es numero con lora');
    // contract: enunciado de ex01.3: W de 11 008 × 4096 y r = 8
    expect(labAt({ ...host, lab: three.lab }, { r: 8 }).params_lora).toBe(120832);
    expect(labAt({ ...host, lab: three.lab }, { r: 8 }).saving_pct).toBeCloseTo(0.268, 3);
    // contract: enunciado de ex01.4: una matriz de 4096 × 4096 con r = 16
    expect(labAt({ ...host, lab: four.lab }, { r: 16 }).params_lora).toBe(131072);
  });

  it('los mandos de los laboratorios de «Calcular» quedan libres para comprobar', () => {
    for (const k of [1, 2, 3, 4]) {
      const x = q(k);
      if (!('lab' in x) || !x.lab) throw new Error(`ex01.${k} lleva lab`);
      // contract: guía de contenido 2026-11-10: en «Calcular» el laboratorio es para explorar, con sus mandos
      expect(labControls(x.lab).length, `ex01.${k}`).toBeGreaterThan(0);
    }
  });
});

describe('banco de examen 3 del proyecto rango-bajo', () => {
  it('tres entradas fijas del proyecto rango-bajo, con ids examen-3.* y cumpliendo el esquema', () => {
    // contract: petición de Oliver 2026-11-10 (brief-proyecto-comun.md): un laboratorio con otra escena, una cuenta del estilo nuevo y la de código, que se conserva
    expect(examen3RangoBajo.map((e) => e.project)).toEqual([
      'rango-bajo',
      'rango-bajo',
      'rango-bajo',
    ]);
    expect(examen3RangoBajo.map((e) => [e.question.id, e.question.type])).toEqual([
      ['examen-3.lora-mascotas', 'laboratorio'],
      ['examen-3.salida-afinada', 'vector'],
      ['examen-3.mejor-rango-k', 'codigo'],
    ]);
    for (const entry of examen3RangoBajo) {
      // contract: bankEntrySchema es el esquema de una entrada del banco
      expect(bankEntrySchema.safeParse(entry).success, entry.question.id).toBe(true);
    }
    // contract: encargo de la Órbita 3 de matrices: los ids reservados de las entradas generadas no se usan, y no chocan con los del proyecto
    const reserved = [
      'examen-3.valores-singulares',
      'examen-3.parametros-lora',
      'examen-3.puntuacion-atencion',
    ];
    const ids = examen3RangoBajo.map((e) => e.question.id);
    expect(ids.filter((id) => reserved.includes(id))).toEqual([]);
    const projectIds = new Set(projectQuestions(rangoBajo).map((q) => q.id));
    expect(ids.filter((id) => projectIds.has(id))).toEqual([]);
  });

  it('examen-3.lora-mascotas: otra escena, que nace sin resolver y admite varias correcciones', () => {
    const mascotas = labQuestion(bankQuestions, 'examen-3.lora-mascotas');
    const spec = loraOf(mascotas);
    // contract: brief-proyecto-comun.md: el laboratorio del banco usa otros datos que el proyecto (mide transferencia)
    expect(spec.axes).toEqual(['tamaño', 'domesticidad']);
    // contract: enunciado: con la corrección nula la neurona dice «mascota» también al tigre y al oso (acierta 4 de 6)
    const start = labAt(mascotas);
    expect([start.hits, start.delta_norm]).toEqual([4, 0]);
    expect(solves(mascotas)).toBe(false);
    // contract: solution: B = (1, 0) con A = (−1, 1), y B = (2, 0) con A = (−0,5; 0,5)
    expect(solves(mascotas, { b1: 1, a1: -1, a2: 1 })).toBe(true);
    expect(solves(mascotas, { b1: 2, a1: -0.5, a2: 0.5 })).toBe(true);
    // contract: tentadora y mala (solution): restar solo el tamaño, la respuesta de rango-bajo.ex00.1, deja al perro en el umbral y al hámster debajo (4 de 6)
    expect(labAt(mascotas, { b1: -1 }).hits).toBe(4);
    expect(solves(mascotas, { b1: -1 })).toBe(false);
    // contract: hints: empujar en vertical no sirve, la neurona mira la primera salida
    expect(solves(mascotas, { b2: 1, a1: -1, a2: 1 })).toBe(false);
    // contract: brief-proyecto-comun.md: las palabras caben en la ventana al empezar y resuelto
    expect(fits(spec, {})).toBe(true);
    expect(fits(spec, mascotas.solved)).toBe(true);
  });

  it('examen-3.salida-afinada: Wx + B·(A·x) para «feliz»', () => {
    const q = bankQuestions[1]!;
    // contract: solution: Wx = (2,75; 1,5), A·x = 2,5, B·2,5 = (2,5; −1,25): (5,25; 0,25)
    const x = [2, 1.5];
    const wx = [x[0]! + 0.5 * x[1]!, x[1]!];
    const ax = 0.5 * x[0]! + 1 * x[1]!;
    expect([wx, ax]).toEqual([[2.75, 1.5], 2.5]);
    expect([wx[0]! + 1 * ax, wx[1]! - 0.5 * ax]).toEqual([5.25, 0.25]);
    expect(answerOf(q)).toEqual([[5.25, 0.25], 0]);
  });
});

describe('rango-bajo: hojas', () => {
  it('hojas: línea errónea de cada una y formato', () => {
    // contract: encargo de la Órbita 3 de matrices (rango-bajo): código con Vt[:, :k] (línea 3), recuento de LoRA que multiplica d·k·r (línea 3) y razonamiento correcto (null)
    expect(rangoBajo.sheets.map(answerOf)).toEqual([2, 2, null]);
    expect(rangoBajo.sheets.map((s) => (s.type === 'revision' ? s.format : ''))).toEqual([
      'codigo',
      'texto',
      'texto',
    ]);
    const faulty = rangoBajo.sheets.map((s) =>
      s.type === 'revision' && s.faultyLine !== null ? s.lines[s.faultyLine] : null,
    );
    // contract: encargo de la Órbita 3 de matrices: la línea errónea es la que trunca con las columnas de Vt y la que multiplica d·k·r
    expect(faulty).toEqual([
      'A_k = U[:, :k] @ np.diag(S[:k]) @ Vt[:, :k].T',
      'Luego LoRA entrena 1000·500·4 = 2000000 parámetros',
      null,
    ]);
  });

  it('hojas: el enunciado acaba con la frase común y el explain no dice que no hay error', () => {
    // contract: R25 de la Órbita 0 (prosa.test.ts): la misma frase final en todas las hojas del juego
    const end =
      'Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.';
    for (const s of rangoBajo.sheets) {
      expect(s.prompt.endsWith(end), s.id).toBe(true);
      // contract: review-16 m7: la frase está en el enunciado de todas y en el explain de ninguna
      expect(s.explain, s.id).not.toMatch(/no hay error|todo cuadra/i);
    }
  });

  it('hojas: las cifras se recalculan', () => {
    // contract: hoja 2: B de 1000×4 y A de 4×500: 4000 + 2000 = 6000 = 4·(1000 + 500); d·k·r = 2000000; W tiene 500000 números
    expect(1000 * 4 + 4 * 500).toBe(6000);
    expect(4 * (1000 + 500)).toBe(6000);
    expect(1000 * 500 * 4).toBe(2000000);
    expect(1000 * 500).toBe(500000);
    // contract: hoja 3: σ = 8, 4, 4, 2: cuadrados 64, 16, 16, 4 (total 100); k = 2 conserva 80 % y descarta 20 %
    const sq = [8, 4, 4, 2].map((s) => s * s);
    expect(sq.reduce((a, b) => a + b, 0)).toBe(100);
    expect((64 + 16) / 100).toBe(0.8);
    expect((16 + 4) / 100).toBe(0.2);
  });
});

describe('proyecto rango-bajo: ejercicio Programar', () => {
  const [, , ex02] = rangoBajo.exercises;

  it('ex02 son cinco preguntas de código con requisitos y tres pistas', () => {
    // contract: encargo de la Órbita 3 de matrices: ex02 son cinco `codigo` «de la mano» (README, «Añadir una pregunta», punto 4): tres pistas y `requirements`
    expect(ex02!.questions.map((q) => q.type)).toEqual(Array(5).fill('codigo'));
    for (const q of ex02!.questions) {
      if (q.type !== 'codigo') continue;
      expect(q.hints, q.id).toHaveLength(3);
      expect(q.requirements?.length ?? 0, q.id).toBeGreaterThan(0);
      // contract: README, «de la mano»: el starter lleva un bloque `# PASO N.` por cada variable
      expect(q.starter, q.id).toMatch(/# PASO 1\./);
    }
  });

  it('las cifras de las soluciones se recalculan', () => {
    // contract: ex02.1: u = (2; 1; 3), v = (1; -1; 2), x = (4; 3; 1): v·x = 4 - 3 + 2 = 3 y u·x = 8 + 3 + 3 = 14
    const u = [2, 1, 3];
    const v = [1, -1, 2];
    const x = [4, 3, 1];
    const dot = (a: number[], b: number[]): number => a.reduce((t, ai, i) => t + ai * b[i]!, 0);
    expect(dot(v, x)).toBe(3);
    expect(dot(u, x)).toBe(14);
    // contract: ex02.1 solution: A·x = (v·x)·u = (6; 3; 9)
    expect(u.map((ui) => dot(v, x) * ui)).toEqual([6, 3, 9]);
    // contract: ex02.3 solution: σ = 8,264; 4,967; 2,860; 1,688 (calculados con NumPy fuera de la prueba): √(2,860² + 1,688²) ≈ 3,32 y √(2,860 + 1,688) ≈ 2,13
    expect(Math.sqrt(2.8603 ** 2 + 1.6883 ** 2)).toBeCloseTo(3.32, 2);
    expect(Math.sqrt(2.8603 + 1.6883)).toBeCloseTo(2.13, 2);
    // contract: ex02.4 solution: B de 8·2 = 16 números y A de 2·6 = 12: 28 frente a 8·6 = 48
    expect(8 * 2 + 2 * 6).toBe(28);
    expect(8 * 6).toBe(48);
  });
});

describe('proyecto rango-bajo: lo que ninguna regla por pregunta ve', () => {
  const code = [...projectQuestions(rangoBajo), ...bankQuestions].filter(
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
    // contract: encargo de la Órbita 3 de matrices: cinco preguntas de código en ex02 y una en el banco
    expect(code.map((q) => q.id)).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => `rango-bajo.ex02.${n}`),
      'examen-3.mejor-rango-k',
    ]);
    for (const c of code) expect(checkMessages(c).length, c.id).toBeGreaterThan(0);
  });
});
