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
  const projects = vectores?.orbits.flatMap((c) => c.projects) ?? [];

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

for (const game of games) {
  describe(`juego ${game.id}`, () => {
    // contract: retoque previo de la tarea 15: checkReachable cuesta ~1 s por manipular de dos móviles, así que el límite de 5 s por defecto no basta
    it('gameProblems no devuelve problemas', { timeout: 60_000 }, () => {
      // contract: tarea 8, ronda de arreglo 1, punto 1: toda comprobación por juego sale de gameProblems
      expect(gameProblems(game)).toEqual([]);
    });
  });
}
