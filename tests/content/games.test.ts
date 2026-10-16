import { describe, expect, it } from 'vitest';
import { gameProblems } from '../../src/content/validate';
import { games } from '../../src/games';

// La lógica de cada comprobación vive en `gameProblems` (src/content/validate.ts), que tiene
// pruebas permanentes sobre juegos malos en validate.test.ts. Aquí solo se recorre el registro.

describe('registro de juegos', () => {
  it('no repite ids de juego', () => {
    const ids = games.map((g) => g.id);
    // contract: tarea 8, brief: el registro vacío no falla por «no hay pruebas»; ids únicos
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('juego vectores: recuentos de la Órbita 0', () => {
  const vectores = games.find((g) => g.id === 'vectores');
  // contract: Órbita 1 (2026-10-15): estos recuentos son de la Órbita 0, no del juego entero
  const projects = vectores?.orbits[0]?.projects ?? [];

  it('hay un juego', () => {
    // contract: brief de la tarea 18, comprobación: «1 juego»
    expect(games).toHaveLength(1);
  });

  it('la Órbita 0 tiene tres proyectos', () => {
    // contract: brief de la tarea 18, comprobación: «3 proyectos»
    expect(projects.map((p) => p.id)).toEqual(['componentes', 'suma-escala', 'norma-distancia']);
  });

  it('tiene 45 preguntas de proyecto, 9 hojas y 10 de despegue', () => {
    // contract: brief de la tarea 18, comprobación: «45 preguntas de proyecto, 9 hojas y 10 de despegue»
    expect(projects.flatMap((p) => p.exercises.flatMap((e) => e.questions))).toHaveLength(45);
    expect(projects.flatMap((p) => p.sheets)).toHaveLength(9);
    expect(vectores?.launch).toHaveLength(10);
  });
});

describe('juego vectores: recuentos de la Órbita 1', () => {
  const orbit = games.find((g) => g.id === 'vectores')?.orbits[1];
  const projects = orbit?.projects ?? [];

  it('la Órbita 1 se llama «El ángulo» y tiene tres proyectos', () => {
    // contract: spec, sección 10: Órbita 1 «El ángulo» con Producto escalar, Coseno y Proyección
    expect(orbit?.name).toBe('El ángulo');
    expect(projects.map((p) => p.id)).toEqual(['producto-escalar', 'coseno', 'proyeccion']);
  });

  it('tiene 45 preguntas de proyecto, 9 hojas y un banco de 12 entradas, 4 por proyecto', () => {
    // contract: spec, sección 5: 3 ejercicios de 5 preguntas y 3 hojas por proyecto
    expect(projects.flatMap((p) => p.exercises.flatMap((e) => e.questions))).toHaveLength(45);
    expect(projects.flatMap((p) => p.sheets)).toHaveLength(9);
    // contract: examen-1.ts: tres fijas y una generada por proyecto, como el banco de la Órbita 0
    expect(projects.map((p) => orbit?.examBank.filter((e) => e.project === p.id).length)).toEqual([
      4, 4, 4,
    ]);
  });
});

for (const game of games) {
  describe(`juego ${game.id}`, () => {
    // contract: retoque previo de la tarea 15: checkReachable cuesta ~1 s por manipular de dos móviles, así que el límite de 5 s por defecto no basta
    it('gameProblems no devuelve problemas', { timeout: 60_000 }, () => {
      // contract: tarea 8, ronda de arreglo 1, punto 1: toda comprobación por juego sale de gameProblems
      expect(gameProblems(game)).toEqual([]);
    });
  });
}

describe('juego vectores: recuentos de la Órbita 2', () => {
  const orbit = games.find((g) => g.id === 'vectores')?.orbits[2];
  const projects = orbit?.projects ?? [];

  it('la Órbita 2 se llama «Muchas dimensiones» y tiene tres proyectos', () => {
    // contract: spec, sección 10: Órbita 2 «Muchas dimensiones» con ℝⁿ en NumPy, Normalizar y Dimensión alta
    expect(orbit?.name).toBe('Muchas dimensiones');
    expect(projects.map((p) => p.id)).toEqual(['rn-numpy', 'normalizar', 'dimension-alta']);
  });

  it('tiene 45 preguntas de proyecto, 9 hojas y un banco de 12 entradas, 4 por proyecto', () => {
    // contract: spec, sección 5: 3 ejercicios de 5 preguntas y 3 hojas por proyecto
    expect(projects.flatMap((p) => p.exercises.flatMap((e) => e.questions))).toHaveLength(45);
    expect(projects.flatMap((p) => p.sheets)).toHaveLength(9);
    // contract: examen-2.ts: tres fijas y una generada por proyecto, como los bancos de las Órbitas 0 y 1
    expect(projects.map((p) => orbit?.examBank.filter((e) => e.project === p.id).length)).toEqual([
      4, 4, 4,
    ]);
  });
});

describe('juego vectores: recuentos de la Órbita 3', () => {
  const orbit = games.find((g) => g.id === 'vectores')?.orbits[3];
  const projects = orbit?.projects ?? [];

  it('la Órbita 3 se llama «Búsqueda» y tiene tres proyectos', () => {
    // contract: spec, sección 10: Órbita 3 «Búsqueda» con Vecinos y top-k, Analogías y Por qué falla un RAG
    expect(orbit?.name).toBe('Búsqueda');
    expect(projects.map((p) => p.id)).toEqual(['vecinos', 'analogias', 'fallos-rag']);
  });

  it('tiene 45 preguntas de proyecto, 9 hojas y un banco de 12 entradas, 4 por proyecto', () => {
    // contract: spec, sección 5: 3 ejercicios de 5 preguntas y 3 hojas por proyecto
    expect(projects.flatMap((p) => p.exercises.flatMap((e) => e.questions))).toHaveLength(45);
    expect(projects.flatMap((p) => p.sheets)).toHaveLength(9);
    // contract: examen-3.ts: tres fijas y una generada por proyecto, como los bancos anteriores
    expect(projects.map((p) => orbit?.examBank.filter((e) => e.project === p.id).length)).toEqual([
      4, 4, 4,
    ]);
  });

  it('con ella el juego tiene las 4 órbitas y los 12 proyectos del spec', () => {
    const game = games.find((g) => g.id === 'vectores');
    // contract: spec, sección 10: «En total, 12 proyectos y 4 exámenes»
    expect(game?.orbits).toHaveLength(4);
    expect(game?.orbits.flatMap((o) => o.projects)).toHaveLength(12);
  });
});
