import type { CodigoQ, Project, WarmupStep } from '../../src/content/schema';
import { games } from '../../src/games';

/** Todos los proyectos del registro, con su juego. */
export const allProjects: { game: string; project: Project }[] = games.flatMap((g) =>
  g.orbits.flatMap((o) => o.projects.map((project) => ({ game: g.id, project }))),
);

/** Todas las fichas de calentamiento del registro, con su juego y su proyecto. */
export const allWarmupSteps: { game: string; project: string; step: WarmupStep }[] =
  allProjects.flatMap(({ game, project }) =>
    (project.warmup ?? []).map((step) => ({ game, project: project.id, step })),
  );

/**
 * Una ficha como pregunta de código, para reutilizar las reglas de prosa y los ayudantes de Python:
 * la explicación hace de enunciado; los «Prueba a…» y el enunciado del reto, de pistas; el título, de
 * explicación y de solución (así las reglas sobre el `explain` de una pregunta no se aplican a la
 * explicación de la ficha, que sí puede nombrar ejes); el reto da `starter`, `checks` y `reference`.
 */
export const warmupAsQuestion = (step: WarmupStep): CodigoQ => ({
  id: step.id,
  type: 'codigo',
  prompt: step.explain,
  hints: [...step.experiments, step.task.prompt],
  explain: step.title,
  solution: step.title,
  requirements: [],
  starter: step.task.starter,
  checks: step.task.checks,
  reference: step.task.reference,
});
