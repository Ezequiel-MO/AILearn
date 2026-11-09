import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  achievements,
  levelProgress,
  newAchievements,
  nextStep,
  pointsOfLevel,
  stars,
} from './rewards';
import { level } from './progression';
import { emptySummary, type Shape, type Summary } from './types';

// contract: forma pequeña de ejemplo: órbita 0 con a y b, órbita 1 con c, 2 hojas por proyecto
const shape: Shape = {
  orbits: [
    {
      projects: [
        { id: 'a', sheetIds: ['a1', 'a2'] },
        { id: 'b', sheetIds: ['b1', 'b2'] },
      ],
    },
    { projects: [{ id: 'c', sheetIds: ['c1', 'c2'] }] },
  ],
};

const summary = (over: Partial<Summary>): Summary => ({ ...emptySummary(), ...over });

describe('stars', () => {
  it('da 0 a 3 estrellas según los aciertos a la primera de la tanda', () => {
    // contract: brief «juego más visual»: pleno 3, nota de validar (80) 2, 60 una, menos ninguna
    expect([0, 1, 2, 3, 4, 5].map(stars)).toEqual([0, 0, 0, 1, 2, 3]);
  });

  it('rechaza lo que no es un número de aciertos de una tanda', () => {
    // contract: mismas entradas válidas que handInExercise (entero de 0 a 5)
    expect(() => stars(6)).toThrow();
    expect(() => stars(-1)).toThrow();
    expect(() => stars(2.5)).toThrow();
  });
});

describe('levelProgress', () => {
  it('parte el XP en nivel entero, avance del siguiente y lo que falta', () => {
    // contract: nivel = XP / 150 (CLAUDE.md, constantes de las reglas)
    expect(levelProgress(0)).toEqual({ whole: 0, fraction: 0, toNext: 150 });
    // contract: 200 XP es el nivel 1,33 de las pruebas de la interfaz
    expect(levelProgress(200)).toEqual({ whole: 1, fraction: 50 / 150, toNext: 100 });
    // contract: justo en el umbral se está en el nivel nuevo con la barra vacía
    expect(levelProgress(300)).toEqual({ whole: 2, fraction: 0, toNext: 150 });
  });
});

describe('achievements', () => {
  it('un jugador nuevo no tiene ninguno', () => {
    // contract: los logros salen del resumen; el vacío no da nada
    expect(achievements(shape, emptySummary())).toEqual([]);
  });

  it('cada paso da su logro, en el orden de la lista', () => {
    // contract: brief «juego más visual», tabla de logros
    expect(achievements(shape, summary({ launch: true }))).toEqual(['launch']);
    // 5 de 5 en un ejercicio: pleno (nota 33, no valida)
    expect(achievements(shape, summary({ firsts: { 'a/0': 5 } }))).toEqual(['perfectRun']);
    // 4+4+4 = 12 de 15 → nota 80: primer proyecto validado (80 XP, nivel 0)
    expect(achievements(shape, summary({ firsts: { 'a/0': 4, 'a/1': 4, 'a/2': 4 } }))).toEqual([
      'firstProject',
    ]);
    expect(achievements(shape, summary({ sheets: ['b1'] }))).toEqual(['firstSheet']);
    expect(achievements(shape, summary({ sheets: ['b1', 'b2'] }))).toEqual([
      'firstSheet',
      'allSheets',
    ]);
  });

  it('una hoja que no es del juego no cuenta', () => {
    // contract: el XP tampoco cuenta hojas ajenas a la forma (progression.xp)
    expect(achievements(shape, summary({ sheets: ['zz'] }))).toEqual([]);
  });

  it('proyecto perfecto, nivel 2 y examen', () => {
    // contract: nota 100 = 15 de 15; 100 XP del proyecto + 50 del despegue + 50 del examen + 20 de hojas
    const s = summary({
      launch: true,
      firsts: { 'a/0': 5, 'a/1': 5, 'a/2': 5 },
      examsPassed: [0],
      sheets: ['a1', 'a2'],
    });
    const got = achievements(shape, s);
    expect(got).toContain('perfectProject');
    expect(got).toContain('firstExam');
    // 220 XP: aún no es nivel 2 (300)
    expect(got).not.toContain('level2');
    // la órbita 0 tiene también b, sin validar
    expect(got).not.toContain('fullOrbit');
  });

  it('órbita entera, todas las órbitas y nivel 5', () => {
    const full = { 'a/0': 5, 'a/1': 5, 'a/2': 5, 'b/0': 5, 'b/1': 5, 'b/2': 5 };
    const c = { 'c/0': 5, 'c/1': 5, 'c/2': 5 };
    const sheets = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
    // contract: 50 + 300 de proyectos + 100 de exámenes + 60 de hojas = 510 XP → nivel 3,4
    const s = summary({ launch: true, firsts: { ...full, ...c }, examsPassed: [0, 1], sheets });
    expect(achievements(shape, s)).toEqual([
      'launch',
      'perfectRun',
      'firstProject',
      'firstSheet',
      'level2',
      'perfectProject',
      'allSheets',
      'firstExam',
      'fullOrbit',
      'allOrbits',
    ]);
    // contract: 750 XP o más da nivel 5; esta forma no llega: la lista entera menos level5
    expect(ACHIEVEMENTS.filter((id) => id !== 'level5')).toEqual(achievements(shape, s));
  });

  it('nivel 5 con una forma mayor', () => {
    const big: Shape = {
      orbits: Array.from({ length: 4 }, (_, c) => ({
        projects: [0, 1].map((n) => ({ id: `p${c}${n}`, sheetIds: [] })),
      })),
    };
    const firsts: Record<string, number> = {};
    for (const o of big.orbits)
      for (const p of o.projects) for (const e of [0, 1, 2]) firsts[`${p.id}/${e}`] = 5;
    // contract: 8 proyectos con nota 100 = 800 XP ≥ 750 (5 × 150)
    expect(achievements(big, summary({ firsts }))).toContain('level5');
  });
});

describe('newAchievements', () => {
  it('devuelve solo los que trae el cambio', () => {
    const before = summary({ launch: true });
    const after = summary({ launch: true, sheets: ['a1'] });
    // contract: el aviso de logro nuevo sale de la diferencia antes/después
    expect(newAchievements(shape, before, after)).toEqual(['firstSheet']);
    expect(newAchievements(shape, after, after)).toEqual([]);
  });
});

describe('pointsOfLevel', () => {
  it('deshace level sin errores de redondeo', () => {
    // contract: la cabecera recibe el nivel con decimales y la barra necesita el XP
    for (const points of [0, 1, 149, 150, 200, 1234])
      expect(pointsOfLevel(level(points))).toBe(points);
  });
});

describe('nextStep', () => {
  it('primero el despegue', () => {
    // contract: brief «juego más visual»: el mapa señala lo siguiente que conviene jugar
    expect(nextStep(shape, emptySummary())).toEqual({ kind: 'launch' });
  });

  it('luego el primer proyecto sin validar de la órbita abierta', () => {
    expect(nextStep(shape, summary({ launch: true }))).toEqual({ kind: 'project', id: 'a' });
    const aDone = { 'a/0': 4, 'a/1': 4, 'a/2': 4 };
    // contract: a validado (nota 80) → b
    expect(nextStep(shape, summary({ launch: true, firsts: aDone }))).toEqual({
      kind: 'project',
      id: 'b',
    });
  });

  it('con la órbita validada, su examen; aprobado, la órbita siguiente', () => {
    const orbit0 = { 'a/0': 4, 'a/1': 4, 'a/2': 4, 'b/0': 4, 'b/1': 4, 'b/2': 4 };
    // contract: las reglas de apertura son las de progression (examAvailable, orbitOpen)
    expect(nextStep(shape, summary({ launch: true, firsts: orbit0 }))).toEqual({
      kind: 'exam',
      c: 0,
    });
    expect(nextStep(shape, summary({ launch: true, firsts: orbit0, examsPassed: [0] }))).toEqual({
      kind: 'project',
      id: 'c',
    });
  });

  it('nada con el juego terminado', () => {
    const all = { 'a/0': 4, 'a/1': 4, 'a/2': 4, 'b/0': 4, 'b/1': 4, 'b/2': 4 };
    const c = { 'c/0': 4, 'c/1': 4, 'c/2': 4 };
    // contract: sin nada pendiente no se señala nada
    expect(
      nextStep(shape, summary({ launch: true, firsts: { ...all, ...c }, examsPassed: [0, 1] })),
    ).toBeNull();
  });
});
