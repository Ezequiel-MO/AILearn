import { describe, expect, it } from 'vitest';
import {
  orbitOpen,
  completeLaunch,
  examAvailable,
  examOpen,
  examPassed,
  firstTry,
  handInExam,
  handInExercise,
  isValidated,
  level,
  mark,
  mergeSummaries,
  projectMark,
  sheetsOpen,
  solveSheet,
  xp,
} from './progression';
import { emptySummary, type Shape, type Summary } from './types';

// contract: forma de ejemplo de la tabla de la tarea 2: órbita 0 con a y b, órbita 1 con c, 3 hojas por proyecto
const shape: Shape = {
  orbits: [
    {
      projects: [
        { id: 'a', sheetIds: ['a1', 'a2', 'a3'] },
        { id: 'b', sheetIds: ['b1', 'b2', 'b3'] },
      ],
    },
    { projects: [{ id: 'c', sheetIds: ['c1', 'c2', 'c3'] }] },
  ],
};

const withFirsts = (firsts: Record<string, number>, rest: Partial<Summary> = {}): Summary => ({
  ...emptySummary(),
  firsts,
  ...rest,
});

describe('mark', () => {
  it('redondea 100 * aciertos / 15', () => {
    expect(mark(15)).toBe(100); // contract: tabla tarea 2, mark(15)
    expect(mark(12)).toBe(80); // contract: tabla tarea 2, mark(12)
    expect(mark(11)).toBe(73); // contract: tabla tarea 2, mark(11)
    expect(mark(0)).toBe(0); // contract: tabla tarea 2, mark(0)
  });
});

describe('projectMark e isValidated', () => {
  it('a/0=5, a/1=4, a/2=3 da 80 y valida', () => {
    const s = withFirsts({ 'a/0': 5, 'a/1': 4, 'a/2': 3 });
    expect(projectMark(s, 'a')).toBe(80); // contract: tabla tarea 2
    expect(isValidated(s, 'a')).toBe(true); // contract: tabla tarea 2, 80 valida
  });
  it('un ejercicio sin entregar cuenta 0', () => {
    const s = withFirsts({ 'a/0': 5, 'a/1': 4 });
    expect(projectMark(s, 'a')).toBe(60); // contract: tabla tarea 2
    expect(isValidated(s, 'a')).toBe(false); // contract: tabla tarea 2, 60 no valida
  });
  it('no mezcla las marcas de otros proyectos', () => {
    const s = withFirsts({ 'b/0': 5, 'b/1': 5, 'b/2': 5 });
    expect(projectMark(s, 'a')).toBe(0); // contract: a no tiene ejercicios entregados
  });
});

describe('handInExercise', () => {
  it('conserva la mejor marca si la nueva es peor', () => {
    const s = withFirsts({ 'a/0': 5 });
    expect(handInExercise(s, 'a', 0, 3).firsts['a/0']).toBe(5); // contract: tabla tarea 2
  });
  it('sube a la nueva marca si es mejor', () => {
    const s = withFirsts({ 'a/0': 3 });
    expect(handInExercise(s, 'a', 0, 5).firsts['a/0']).toBe(5); // contract: tabla tarea 2
  });
  it('guarda la primera entrega aunque sea 0', () => {
    expect(handInExercise(emptySummary(), 'a', 1, 0).firsts['a/1']).toBe(0); // contract: clave a/1 con valor 0..5
  });
  it('no modifica el resumen recibido', () => {
    const s = withFirsts({ 'a/0': 3 });
    const out = handInExercise(s, 'a', 0, 5);
    expect(out).not.toBe(s); // contract: devuelve un Summary nuevo
    expect(s.firsts['a/0']).toBe(3); // contract: el original no cambia
  });
});

describe('entregas con valores no válidos', () => {
  const s = withFirsts({ 'a/0': 5 });
  it('handInExercise con NaN lanza y no borra la mejor marca', () => {
    expect(() => handInExercise(s, 'a', 0, NaN)).toThrow(); // contract: fix1 punto 1, NaN no es una marca
    expect(s.firsts['a/0']).toBe(5); // contract: fix1 punto 1, la mejor marca sigue siendo 5
  });
  it('handInExercise con decimal lanza', () => {
    expect(() => handInExercise(s, 'a', 0, 2.5)).toThrow(); // contract: fix1 punto 1, marca entera
  });
  it('handInExercise fuera de 0..5 lanza', () => {
    expect(() => handInExercise(s, 'a', 0, -1)).toThrow(); // contract: fix1 punto 1, rango 0..5
    expect(() => handInExercise(s, 'a', 0, 6)).toThrow(); // contract: fix1 punto 1, rango 0..5
  });
  it('handInExercise acepta los extremos 0 y 5', () => {
    expect(handInExercise(emptySummary(), 'a', 2, 5).firsts['a/2']).toBe(5); // contract: fix1 punto 1, 5 está dentro
    expect(handInExercise(emptySummary(), 'a', 2, 0).firsts['a/2']).toBe(0); // contract: fix1 punto 1, 0 está dentro
  });
  it('handInExam con NaN lanza y no aprueba', () => {
    expect(() => handInExam(emptySummary(), 0, NaN)).toThrow(); // contract: fix1 punto 1, NaN no aprueba
  });
  it('handInExam con decimal lanza', () => {
    expect(() => handInExam(emptySummary(), 0, 5.5)).toThrow(); // contract: fix1 punto 1, entero
  });
  it('handInExam fuera de 0..6 lanza', () => {
    expect(() => handInExam(emptySummary(), 0, -1)).toThrow(); // contract: fix1 punto 1, rango 0..EXAM_SIZE
    expect(() => handInExam(emptySummary(), 0, 7)).toThrow(); // contract: fix1 punto 1, rango 0..EXAM_SIZE
  });
  it('handInExam acepta los extremos 0 y 6', () => {
    expect(handInExam(emptySummary(), 0, 0).examsPassed).toEqual([]); // contract: fix1 punto 1, 0 es válido y suspende
    expect(handInExam(emptySummary(), 0, 6).examsPassed).toEqual([0]); // contract: fix1 punto 1, 6 es válido y aprueba
  });
});

describe('pureza de las demás funciones', () => {
  it('handInExam, solveSheet y completeLaunch devuelven un objeto nuevo sin tocar el recibido', () => {
    const base = withFirsts({ 'a/0': 5 }, { examsPassed: [0], sheets: ['a1'] });
    const copy = structuredClone(base);
    const outs = [
      handInExam(base, 1, 6),
      handInExam(base, 0, 6),
      solveSheet(base, 'a2'),
      solveSheet(base, 'a1'),
      completeLaunch(base),
    ];
    for (const out of outs) expect(out).not.toBe(base); // contract: fix1 punto 2, objeto nuevo
    expect(base).toEqual(copy); // contract: fix1 punto 2, el original no cambia
    expect(outs[0]!.examsPassed).not.toBe(base.examsPassed); // contract: fix1 punto 2, array nuevo
    expect(outs[3]!.sheets).not.toBe(base.sheets); // contract: fix1 punto 2, array nuevo
  });
});

describe('orbitOpen', () => {
  it('la órbita 0 se abre con el despegue', () => {
    expect(orbitOpen(shape, emptySummary(), 0)).toBe(false); // contract: tabla tarea 2, sin despegue
    expect(orbitOpen(shape, completeLaunch(emptySummary()), 0)).toBe(true); // contract: tabla tarea 2, con despegue
  });
  it('la órbita 1 exige el examen 0 aprobado', () => {
    const p = completeLaunch(emptySummary());
    expect(orbitOpen(shape, p, 1)).toBe(false); // contract: tabla tarea 2, sin examen 0
    expect(orbitOpen(shape, handInExam(p, 0, 5), 1)).toBe(true); // contract: tabla tarea 2, con examen 0
  });
  it('un examen aprobado sin despegue no abre la órbita 1', () => {
    expect(orbitOpen(shape, handInExam(emptySummary(), 0, 6), 1)).toBe(false); // contract: spec 5, c-1 debe estar abierto
  });
  it('una órbita que no existe está cerrada', () => {
    const s = handInExam(handInExam(completeLaunch(emptySummary()), 0, 6), 1, 6);
    expect(orbitOpen(shape, s, 2)).toBe(false); // contract: tabla tarea 2
  });
});

describe('examOpen', () => {
  it('se cierra si falta un proyecto por validar', () => {
    const s = withFirsts({ 'a/0': 5, 'a/1': 5, 'a/2': 5, 'b/0': 5, 'b/1': 5 });
    expect(examOpen(shape, s, 0)).toBe(false); // contract: tabla tarea 2, a validado y b (67) no
  });
  it('se abre con todos los proyectos validados', () => {
    const s = withFirsts({ 'a/0': 5, 'a/1': 5, 'a/2': 5, 'b/0': 4, 'b/1': 4, 'b/2': 4 });
    expect(examOpen(shape, s, 0)).toBe(true); // contract: tabla tarea 2, a y b validados (b = 80)
  });
  it('una órbita que no existe no tiene examen', () => {
    expect(examOpen(shape, emptySummary(), 5)).toBe(false); // contract: tarea 2, órbita inexistente cerrada
  });
});

describe('handInExam', () => {
  it('4 aciertos no aprueban', () => {
    expect(handInExam(emptySummary(), 0, 4).examsPassed).toEqual([]); // contract: tabla tarea 2, aprobado con 5
  });
  it('un aprobado no se revoca ni se duplica', () => {
    const s = handInExam(handInExam(emptySummary(), 0, 5), 0, 2);
    expect(s.examsPassed).toEqual([0]); // contract: tabla tarea 2, sigue aprobado sin duplicados
  });
});

describe('sheetsOpen y solveSheet', () => {
  it('las hojas se abren con nota 80, no con 79', () => {
    // contract: tabla tarea 2, nota 79 / 80; 79 no es alcanzable con firsts enteros, se prueba con 11 (73) y 12 (80)
    expect(sheetsOpen(withFirsts({ 'a/0': 5, 'a/1': 3, 'a/2': 3 }), 'a')).toBe(false);
    expect(sheetsOpen(withFirsts({ 'a/0': 5, 'a/1': 4, 'a/2': 3 }), 'a')).toBe(true);
  });
  it('una hoja resuelta dos veces aparece una vez', () => {
    const s = solveSheet(solveSheet(emptySummary(), 'a1'), 'a1');
    expect(s.sheets).toEqual(['a1']); // contract: tabla tarea 2
  });
});

describe('xp y level', () => {
  const full = (): Summary =>
    handInExam(
      solveSheet(
        solveSheet(
          completeLaunch(withFirsts({ 'a/0': 5, 'a/1': 4, 'a/2': 3, 'b/0': 5, 'b/1': 4 })),
          'a1',
        ),
        'b1',
      ),
      0,
      5,
    );
  it('suma despegue, notas validadas, examen y hojas', () => {
    expect(xp(shape, full())).toBe(200); // contract: tabla tarea 2, 50 + 80 + 0 + 50 + 20
  });
  it('ignora hojas que no están en la forma', () => {
    expect(xp(shape, solveSheet(full(), 'inventada'))).toBe(200); // contract: tabla tarea 2, no suman
  });
  it('un proyecto a 93 suma 93, no VALID, y un examen de una órbita inexistente no suma', () => {
    // contract: fix1 punto 6; 14 aciertos de 15 = round(93,33) = 93
    const s = handInExam(withFirsts({ 'a/0': 5, 'a/1': 5, 'a/2': 4 }), 7, 6);
    expect(xp(shape, s)).toBe(93); // contract: fix1 punto 6, 93 del proyecto y 0 del examen 7 que no existe
  });
  it('sin progreso no hay XP', () => {
    expect(xp(shape, emptySummary())).toBe(0); // contract: ninguna regla da XP sin progreso
  });
  it('level es xp / 150 sin redondear', () => {
    expect(level(200)).toBeCloseTo(1.3333, 4); // contract: tabla tarea 2, 200/150
    expect(level(0)).toBe(0); // contract: 0 / 150
  });
});

describe('examPassed', () => {
  it('4 aciertos suspenden, 5 y 6 aprueban', () => {
    expect(examPassed(4)).toBe(false); // contract: reglas, examen de 6 preguntas aprobado con 5; round fix1 13c (R38 punto 1)
    expect(examPassed(5)).toBe(true); // contract: reglas, aprobado con 5; R38 punto 1
    expect(examPassed(6)).toBe(true); // contract: reglas, aprobado con 5; R38 punto 1
  });
  it('acepta los extremos 0 y 6', () => {
    expect(examPassed(0)).toBe(false); // contract: R38 punto 1, 0 es válido y suspende
  });
  it('lanza con 7, -1, 1,5 y NaN, como handInExam', () => {
    expect(() => examPassed(7)).toThrow(); // contract: R38 punto 1, rango 0..EXAM_SIZE
    expect(() => examPassed(-1)).toThrow(); // contract: R38 punto 1, rango 0..EXAM_SIZE
    expect(() => examPassed(1.5)).toThrow(); // contract: R38 punto 1, entero
    expect(() => examPassed(NaN)).toThrow(); // contract: R38 punto 1, entero
  });
  it('handInExam y examPassed coinciden en toda la escala', () => {
    for (let n = 0; n <= 6; n++)
      expect(handInExam(emptySummary(), 0, n).examsPassed.includes(0)).toBe(examPassed(n)); // contract: R38 punto 1, una sola fuente
  });
});

describe('examAvailable', () => {
  const validatedA = { 'a/0': 5, 'a/1': 5, 'a/2': 5, 'b/0': 4, 'b/1': 4, 'b/2': 4 };
  const validatedC = { 'c/0': 5, 'c/1': 5, 'c/2': 5 };
  it('órbita cerrada con sus proyectos validados: no', () => {
    const s = withFirsts(validatedC); // sin despegue ni examen 0: la órbita 1 está cerrada
    expect(examOpen(shape, s, 1)).toBe(true); // contract: tabla tarea 2, examOpen sola da verdadero (c validado)
    expect(examAvailable(shape, s, 1)).toBe(false); // contract: R38 punto 2, exige orbitOpen
  });
  it('órbita abierta con un proyecto sin validar: no', () => {
    const s = withFirsts({}, { launch: true });
    expect(examAvailable(shape, s, 0)).toBe(false); // contract: R38 punto 2, exige examOpen
  });
  it('órbita abierta y validado: sí (órbitas 0 y 1)', () => {
    expect(examAvailable(shape, withFirsts(validatedA, { launch: true }), 0)).toBe(true); // contract: R38 punto 2
    const s = withFirsts({ ...validatedA, ...validatedC }, { launch: true, examsPassed: [0] });
    expect(examAvailable(shape, s, 1)).toBe(true); // contract: R38 punto 2
  });
  it('órbita sin proyectos con la anterior aprobada: no (drawExam lanzaría)', () => {
    const empty: Shape = { orbits: [...shape.orbits, { projects: [] }] };
    const s = withFirsts({}, { launch: true, examsPassed: [0, 1] });
    expect(orbitOpen(empty, s, 2)).toBe(true); // contract: tabla tarea 2, órbita anterior aprobada
    expect(examOpen(empty, s, 2)).toBe(true); // contract: every sobre lista vacía
    expect(examAvailable(empty, s, 2)).toBe(false); // contract: R38 punto 2 (respuesta b de review-13c)
  });
  it('órbita fuera de rango: no', () => {
    const s = withFirsts(validatedA, { launch: true, examsPassed: [0, 1] });
    expect(examAvailable(shape, s, 2)).toBe(false); // contract: R38 punto 2, órbita inexistente
    expect(examAvailable(shape, s, -1)).toBe(false); // contract: R38 punto 2, órbita inexistente
    expect(examAvailable(shape, s, 0.5)).toBe(false); // contract: R38 punto 2, no entero
  });
});

describe('firstTry', () => {
  const base = { correct: true, submissions: 1, hinted: false };
  it('acertar a la primera sin pista es a la primera', () => {
    expect(firstTry(base)).toBe(true); // contract: brief tarea 4, firstTry; R38 punto 3
  });
  it('fallar no lo es', () => {
    expect(firstTry({ ...base, correct: false })).toBe(false); // contract: R38 punto 3, exige correct
  });
  it('acertar a la segunda no lo es', () => {
    expect(firstTry({ ...base, submissions: 2 })).toBe(false); // contract: R38 punto 3, exige submissions === 1
  });
  it('acertar con pista no lo es', () => {
    expect(firstTry({ ...base, hinted: true })).toBe(false); // contract: R38 punto 3, exige no haber pedido pista
  });
});

describe('mergeSummaries', () => {
  it('lo conseguido en cualquiera de los dos cuenta: despegue, mejor marca, unión de exámenes y hojas', () => {
    const a: Summary = {
      launch: false,
      firsts: { 'p/0': 3, 'p/1': 5 },
      examsPassed: [0],
      sheets: ['h1'],
    };
    const b: Summary = {
      launch: true,
      firsts: { 'p/0': 4, 'p/1': 2, 'q/0': 1 },
      examsPassed: [1, 0],
      sheets: ['h2', 'h1'],
    };
    // contract: petición de Oliver 2026-10-14 (progreso en la cuenta sin perder lo local); la marca guardada es la mejor (handInExercise)
    expect(mergeSummaries(a, b)).toEqual({
      launch: true,
      firsts: { 'p/0': 4, 'p/1': 5, 'q/0': 1 },
      examsPassed: [0, 1],
      sheets: ['h1', 'h2'],
    });
  });

  it('con un resumen vacío devuelve el otro', () => {
    const s: Summary = { launch: true, firsts: { 'p/0': 2 }, examsPassed: [0], sheets: ['h'] };
    // contract: fusión sin pérdida (petición de Oliver 2026-10-14)
    expect(mergeSummaries(emptySummary(), s)).toEqual(s);
    expect(mergeSummaries(s, emptySummary())).toEqual(s);
  });
});
