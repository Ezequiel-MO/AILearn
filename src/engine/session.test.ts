import { describe, expect, it } from 'vitest';
import {
  correctCount,
  firsts,
  startSession,
  step,
  type SessionEvent,
  type SessionState,
} from './session';

const ids = (n: number): string[] => Array.from({ length: n }, (_, i) => `q${i}`);
const run = (s: SessionState, ...events: SessionEvent[]): SessionState => events.reduce(step, s);
const ok: SessionEvent = { type: 'submit', correct: true };
const bad: SessionEvent = { type: 'submit', correct: false };
const next: SessionEvent = { type: 'next' };
const hint: SessionEvent = { type: 'hint', available: 2 };

describe('startSession', () => {
  it('empieza en la primera pregunta, en answering y sin resultados', () => {
    // contract: brief tarea 4, estado inicial de una tanda
    expect(startSession('hoja', ids(3))).toEqual({
      mode: 'hoja',
      questionIds: ['q0', 'q1', 'q2'],
      index: 0,
      phase: 'answering',
      submissions: 0,
      hinted: false,
      hintsShown: 0,
      results: [],
      done: false,
    });
  });
});

describe('step: entregas', () => {
  it('answering + entrega correcta pasa a solved', () => {
    // contract: brief tarea 4, regla 1
    const s = run(startSession('proyecto', ids(2)), ok);
    expect(s.phase).toBe('solved');
    expect(s.submissions).toBe(1);
  });

  it('answering + primera entrega incorrecta pasa a explained', () => {
    // contract: brief tarea 4, regla 2
    const s = run(startSession('proyecto', ids(2)), bad);
    expect(s.phase).toBe('explained');
    expect(s.submissions).toBe(1);
  });

  it('explained + entrega correcta pasa a solved', () => {
    // contract: brief tarea 4, regla 3
    const s = run(startSession('proyecto', ids(2)), bad, ok);
    expect(s.phase).toBe('solved');
    expect(s.submissions).toBe(2);
  });

  it('explained + entrega incorrecta pasa a revealed', () => {
    // contract: brief tarea 4, regla 3 (segundo fallo muestra la solución)
    const s = run(startSession('proyecto', ids(2)), bad, bad);
    expect(s.phase).toBe('revealed');
    expect(s.submissions).toBe(2);
  });

  it('en examen una entrega incorrecta pasa directamente a revealed', () => {
    // contract: brief tarea 4, regla de examen
    const s = run(startSession('examen', ids(6)), bad);
    expect(s.phase).toBe('revealed');
    expect(s.submissions).toBe(1);
  });

  it('en solved y revealed una entrega devuelve el mismo estado', () => {
    // contract: brief tarea 4, evento fuera de fase devuelve el mismo estado
    const solved = run(startSession('proyecto', ids(2)), ok);
    const revealed = run(startSession('proyecto', ids(2)), bad, bad);
    expect(step(solved, ok)).toBe(solved);
    expect(step(revealed, ok)).toBe(revealed);
  });
});

describe('step: next', () => {
  it('next en answering o explained devuelve el mismo estado', () => {
    // contract: brief tarea 4, next solo actúa en solved o revealed
    const a = startSession('proyecto', ids(2));
    const e = run(a, bad);
    expect(step(a, next)).toBe(a);
    expect(step(e, next)).toBe(e);
  });

  it('next en solved guarda el resultado y pasa a la siguiente pregunta reiniciando el estado', () => {
    // contract: brief tarea 4, regla de next + contexto del encargo (reinicio de campos)
    const s = run(startSession('proyecto', ids(2)), hint, ok, next);
    expect(s.index).toBe(1);
    expect(s.phase).toBe('answering');
    expect(s.submissions).toBe(0);
    expect(s.hinted).toBe(false);
    expect(s.hintsShown).toBe(0);
    expect(s.done).toBe(false);
    expect(s.results).toEqual([
      { questionId: 'q0', correct: true, submissions: 1, hinted: true, firstTry: false },
    ]);
  });

  it('next en revealed guarda un resultado con correct falso', () => {
    // contract: encargo: correct es falso si la pregunta acabó en revealed
    const s = run(startSession('proyecto', ids(2)), bad, bad, next);
    expect(s.results).toEqual([
      { questionId: 'q0', correct: false, submissions: 2, hinted: false, firstTry: false },
    ]);
  });

  it('acertar al segundo intento es correct pero no firstTry', () => {
    // contract: encargo: correct es verdadero si acabó en solved aunque fuera al segundo intento
    const s = run(startSession('proyecto', ids(2)), bad, ok, next);
    expect(s.results[0]).toEqual({
      questionId: 'q0',
      correct: true,
      submissions: 2,
      hinted: false,
      firstTry: false,
    });
  });

  it('acertar a la primera sin pista es firstTry', () => {
    // contract: brief tarea 4, firstTry
    const s = run(startSession('proyecto', ids(2)), ok, next);
    expect(s.results[0]?.firstTry).toBe(true);
  });

  it('pedir pista y acertar a la primera no es firstTry', () => {
    // contract: brief tarea 4, firstTry exige no haber pedido pista
    const s = run(startSession('proyecto', ids(2)), hint, ok, next);
    expect(s.results[0]?.firstTry).toBe(false);
  });

  it('una tanda de una sola pregunta termina en done tras next', () => {
    // contract: brief tarea 4, caso de tanda de una pregunta
    const s = run(startSession('hoja', ids(1)), ok, next);
    expect(s.done).toBe(true);
    expect(s.results).toHaveLength(1);
    expect(s.index).toBe(0);
  });

  it('con done, ningún evento cambia el estado', () => {
    // contract: brief tarea 4, submit con done no cambia nada
    const s = run(startSession('hoja', ids(1)), ok, next);
    expect(step(s, ok)).toBe(s);
    expect(step(s, bad)).toBe(s);
    expect(step(s, hint)).toBe(s);
    expect(step(s, next)).toBe(s);
  });

  it('una tanda vacía empieza terminada', () => {
    // contract: decisión de implementación: sin preguntas no hay nada que resolver
    expect(startSession('hoja', []).done).toBe(true);
  });
});

describe('step: pistas', () => {
  it('hint sube hintsShown hasta available y marca hinted', () => {
    // contract: brief tarea 4, regla de hint
    let s = run(startSession('proyecto', ids(2)), hint);
    expect(s.hintsShown).toBe(1);
    expect(s.hinted).toBe(true);
    s = run(s, hint, hint, hint);
    expect(s.hintsShown).toBe(2);
  });

  it('hint con available 0 no cambia el estado', () => {
    // contract: decisión de implementación: sin pistas disponibles no se marca hinted
    const s = startSession('proyecto', ids(2));
    expect(step(s, { type: 'hint', available: 0 })).toBe(s);
  });

  it('hint en explained funciona', () => {
    // contract: brief tarea 4, la pista se puede pedir mientras se responde
    const s = run(startSession('proyecto', ids(2)), bad, hint);
    expect(s.hinted).toBe(true);
    expect(s.hintsShown).toBe(1);
  });

  it('en examen hint no hace nada', () => {
    // contract: brief tarea 4, regla de examen
    const s = startSession('examen', ids(6));
    expect(step(s, hint)).toBe(s);
  });

  it('hint después de solved no cambia hinted', () => {
    // contract: brief tarea 4, caso de prueba
    const s = run(startSession('proyecto', ids(2)), ok);
    const t = step(s, hint);
    expect(t).toBe(s);
    expect(t.hinted).toBe(false);
  });

  it('hint después de revealed no cambia el estado', () => {
    // contract: brief tarea 4, evento fuera de fase
    const s = run(startSession('proyecto', ids(2)), bad, bad);
    expect(step(s, hint)).toBe(s);
  });
});

describe('step: pureza', () => {
  it('no modifica el estado recibido', () => {
    // contract: encargo: step es puro
    const s = startSession('proyecto', ids(2));
    const copy = structuredClone(s);
    step(s, ok);
    step(s, hint);
    expect(s).toEqual(copy);
  });

  it('next no modifica results del estado recibido', () => {
    // contract: fix1 punto 9, next es la única rama que toca un array
    const solved = step(startSession('proyecto', ids(2)), ok);
    step(solved, next);
    expect(solved.results).toEqual([]);
  });

  it('hint con available NaN devuelve el mismo estado', () => {
    // contract: fix1 punto 8, NaN no es un número de pistas
    const s = startSession('proyecto', ids(2));
    const t = step(s, { type: 'hint', available: NaN });
    expect(t).toBe(s);
    expect(t.hintsShown).toBe(0);
    expect(t.hinted).toBe(false);
  });
});

describe('firsts y correctCount', () => {
  it('tanda de 5 con 4 aciertos a la primera y uno con pista: firsts 4, correctCount 5', () => {
    // contract: brief tarea 4, caso de prueba
    let s = startSession('proyecto', ids(5));
    for (let i = 0; i < 4; i++) s = run(s, ok, next);
    s = run(s, hint, ok, next);
    expect(s.done).toBe(true);
    expect(firsts(s)).toBe(4);
    expect(correctCount(s)).toBe(5);
  });

  it('examen de 6 con un fallo: correctCount 5', () => {
    // contract: brief tarea 4, caso de prueba (se aprueba con 5)
    let s = startSession('examen', ids(6));
    s = run(s, bad, next);
    for (let i = 0; i < 5; i++) s = run(s, ok, next);
    expect(s.done).toBe(true);
    expect(correctCount(s)).toBe(5);
    expect(firsts(s)).toBe(5);
  });
});
