import { describe, expect, it } from 'vitest';
import { grade, parseNumber } from './grade';
import type { ManipularQ, NumeroQ, OpcionQ, RevisionQ, VectorQ } from './schema';

describe('parseNumber', () => {
  it.each([
    ['3,5', 3.5],
    [' 3.5 ', 3.5],
    ['−3,5', -3.5], // menos tipográfico U+2212
    ['-0,5', -0.5],
    ['.5', 0.5],
  ])('acepta %j', (text, value) => {
    expect(parseNumber(text)).toEqual({ ok: true, value }); // contract: tabla tarea 3
  });
  it.each([[''], ['abc'], ['3,5,2'], ['1e400'], ['NaN']])('rechaza %j', (text) => {
    expect(parseNumber(text)).toEqual({ ok: false }); // contract: tabla tarea 3
  });
});

const base = { id: 'q', prompt: 'p', hints: [], explain: 'e', solution: 's' };

describe('grade numero', () => {
  const q: NumeroQ = { ...base, type: 'numero', answer: 6.0828, tol: 0.01 };
  it('6,08 es correcta', () => {
    expect(grade(q, { type: 'numero', value: 6.08 })).toBe(true); // contract: tabla tarea 3
  });
  it('6,1 es incorrecta', () => {
    expect(grade(q, { type: 'numero', value: 6.1 })).toBe(false); // contract: tabla tarea 3
  });
});

describe('grade vector', () => {
  const q: VectorQ = { ...base, type: 'vector', answer: [0.6, 0.8], tol: 0.01 };
  it('[0.6,0.8] es correcta', () => {
    expect(grade(q, { type: 'vector', value: [0.6, 0.8] })).toBe(true); // contract: tabla tarea 3
  });
  it('[0.8,0.6] es incorrecta', () => {
    expect(grade(q, { type: 'vector', value: [0.8, 0.6] })).toBe(false); // contract: tabla tarea 3
  });
  it('[0.6] (longitud distinta) es incorrecta', () => {
    expect(grade(q, { type: 'vector', value: [0.6] })).toBe(false); // contract: tabla tarea 3
  });
});

describe('grade opcion', () => {
  const q: OpcionQ = { ...base, type: 'opcion', options: ['a', 'b', 'c'], correct: 1 };
  it('el índice correcto acierta', () => {
    expect(grade(q, { type: 'opcion', index: 1 })).toBe(true); // contract: tabla tarea 3
  });
  it('otro índice falla', () => {
    expect(grade(q, { type: 'opcion', index: 0 })).toBe(false); // contract: tabla tarea 3
  });
});

describe('grade revision', () => {
  const mk = (faultyLine: number | null): RevisionQ => ({
    ...base,
    type: 'revision',
    format: 'texto',
    lines: ['a', 'b', 'c'],
    faultyLine,
  });
  it('null con null acierta', () => {
    expect(grade(mk(null), { type: 'revision', faultyLine: null })).toBe(true); // contract: tabla tarea 3
  });
  it('null con 1 falla', () => {
    expect(grade(mk(null), { type: 'revision', faultyLine: 1 })).toBe(false); // contract: tabla tarea 3
  });
  it('1 con 1 acierta', () => {
    expect(grade(mk(1), { type: 'revision', faultyLine: 1 })).toBe(true); // contract: tabla tarea 3
  });
  it('1 con 0 falla', () => {
    expect(grade(mk(1), { type: 'revision', faultyLine: 0 })).toBe(false); // contract: tabla tarea 3
  });
});

describe('grade manipular', () => {
  const plane = {
    range: 6,
    snap: 1,
    vectors: [{ id: 'u', label: 'u', x: 0, y: 0, movable: true }],
    readouts: ['components' as const],
  };
  const mk = (goals: ManipularQ['goals']): ManipularQ => ({
    ...base,
    type: 'manipular',
    plane,
    goals,
  });
  const at = (x: number, y: number) => ({
    type: 'manipular' as const,
    vectors: { u: [x, y] as [number, number] },
  });

  const xy = mk([
    { metric: 'x', of: ['u'], target: 3, tol: 0 },
    { metric: 'y', of: ['u'], target: 2, tol: 0 },
  ]);
  it('metas x=3 e y=2: (3,2) acierta', () => {
    expect(grade(xy, at(3, 2))).toBe(true); // contract: tabla tarea 3
  });
  it('metas x=3 e y=2: (3,1) falla', () => {
    expect(grade(xy, at(3, 1))).toBe(false); // contract: tabla tarea 3
  });

  const n5 = mk([{ metric: 'norm', of: ['u'], target: 5, tol: 0.01 }]);
  it('meta norm=5: (3,4) acierta', () => {
    expect(grade(n5, at(3, 4))).toBe(true); // contract: tabla tarea 3
  });
  it('meta norm=5: (5,0) acierta', () => {
    expect(grade(n5, at(5, 0))).toBe(true); // contract: tabla tarea 3
  });
  it('meta norm=5: (4,4) falla', () => {
    expect(grade(n5, at(4, 4))).toBe(false); // contract: tabla tarea 3
  });

  it('un vector fijo del plano no necesita venir en la respuesta', () => {
    const q: ManipularQ = {
      ...base,
      type: 'manipular',
      plane: {
        ...plane,
        vectors: [
          { id: 'u', label: 'u', x: 0, y: 0, movable: true },
          { id: 'v', label: 'v', x: 2, y: 1, movable: false },
        ],
        readouts: ['components', 'sum'],
        pair: ['u', 'v'],
      },
      goals: [{ metric: 'sum_x', of: ['u', 'v'], target: 5, tol: 0 }],
    };
    expect(grade(q, at(3, 0))).toBe(true); // contract: contrato de grade (los fijos salen del plano); sum_x = 3 + 2
  });
});
