import { describe, expect, it } from 'vitest';
import { games } from '../../src/games';
import { roadmap } from '../../src/games/roadmap';

// La ruta es lo que se enseña como «Próximamente»: lo ya construido debe llamarse igual en la ruta y en el juego.

describe('ruta completa', () => {
  it('nueve juegos con ids únicos', () => {
    const ids = roadmap.map((g) => g.id);
    // contract: spec, sección 2 «Mapa de la trayectoria completa» (9 juegos)
    expect(ids).toHaveLength(9);
    // contract: el id de la ruta es el del juego que se registre; repetido, dos tarjetas abrirían el mismo juego
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada juego tiene despegue y cuatro órbitas de tres proyectos, todo con texto', () => {
    for (const g of roadmap) {
      const texts = [g.title, g.math, g.ai, g.launch.math, g.launch.ai];
      // contract: forma del juego 1 (spec, sección 10): despegue y Órbitas 0 a 3 de tres proyectos
      expect(g.orbits, g.id).toHaveLength(4);
      for (const o of g.orbits) {
        // contract: forma del juego 1 (spec, sección 10): tres proyectos por órbita
        expect(o.projects, `${g.id} · ${o.name}`).toHaveLength(3);
        texts.push(o.name, o.math, o.ai, ...o.projects);
      }
      // contract: un texto vacío dejaría una línea en blanco en la pantalla de la ruta
      expect(
        texts.filter((s) => s.trim() === ''),
        g.id,
      ).toEqual([]);
    }
  });

  it('todo juego registrado está en la ruta, con su título y los nombres de sus órbitas y proyectos', () => {
    for (const game of games) {
      const entry = roadmap.find((g) => g.id === game.id);
      // contract: la ruta enseña lo construido; un juego registrado que no figura en ella no se vería
      expect(entry, game.id).toBeDefined();
      if (!entry) continue;
      // contract: la ruta y el juego dicen lo mismo de lo que ya existe
      expect(entry.title).toBe(game.title);
      const built = game.orbits.map((o) => ({
        name: o.name,
        projects: o.projects.map((p) => p.name),
      }));
      const planned = entry.orbits
        .slice(0, game.orbits.length)
        .map((o) => ({ name: o.name, projects: o.projects }));
      // contract: misma razón; las órbitas aún no construidas (más allá de las del juego) quedan libres
      expect(planned).toEqual(built);
    }
  });
});
