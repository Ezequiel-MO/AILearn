import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import type { Game, Project } from '../../content/schema';

/** Busca un proyecto por id y dice en qué órbita está. Solo localiza: ninguna regla. */
export function findProject(
  game: Game,
  projectId: string,
): { orbit: number; project: Project } | undefined {
  for (const [orbit, c] of game.orbits.entries()) {
    const project = c.projects.find((p) => p.id === projectId);
    if (project) return { orbit, project };
  }
  return undefined;
}

/** Índice 0..2 de la ruta («0», «1», «2»); cualquier otra cosa («abc», «3», «01», «1.5») es `null`. */
export function parseIndex(text: string | undefined): 0 | 1 | 2 | null {
  return text === '0' ? 0 : text === '1' ? 1 : text === '2' ? 2 : null;
}

/** Órbita de la ruta («0», «1»…, sin ceros delante) si existe en el juego; cualquier otra cosa es `null`. */
export function parseOrbit(text: string | undefined, game: Game): number | null {
  if (text === undefined || !/^(0|[1-9]\d*)$/.test(text)) return null;
  const c = Number(text);
  return c < game.orbits.length ? c : null;
}

/** `/ruta`: todos los juegos previstos, construidos o no. */
export const roadmapPath = '/ruta';

/** Ruta del mapa de un juego. */
export const mapPath = (gameId: string): string => `/j/${encodeURIComponent(gameId)}`;

/** Ruta del panel de un proyecto. */
export const projectPath = (gameId: string, projectId: string): string =>
  `${mapPath(gameId)}/p/${encodeURIComponent(projectId)}`;

/** Ruta del despegue. */
export const launchPath = (gameId: string): string => `${mapPath(gameId)}/despegue`;

/** Ruta de un ejercicio de un proyecto (`ex` de 0 a 2). */
export const exercisePath = (gameId: string, projectId: string, ex: number): string =>
  `${projectPath(gameId, projectId)}/ex/${ex}`;

/** Ruta del calentamiento de Python de un proyecto. */
export const warmupPath = (gameId: string, projectId: string): string =>
  `${projectPath(gameId, projectId)}/calentamiento`;

/** Ruta de una hoja «Caza el error» de un proyecto (`n` de 0 a 2). */
export const sheetPath = (gameId: string, projectId: string, n: number): string =>
  `${projectPath(gameId, projectId)}/hoja/${n}`;

/** Ruta del examen de la órbita `c` (entero, sin ceros delante). */
export const examPath = (gameId: string, c: number): string => `${mapPath(gameId)}/examen/${c}`;

/** Ruta de las estadísticas de un juego. */
export const statsPath = (gameId: string): string => `${mapPath(gameId)}/estadisticas`;

/**
 * `?abierto` salta las puertas, también en producción (el sitio es de un solo jugador). Una vez visto,
 * dura hasta recargar la página: los enlaces del juego no llevan el parámetro.
 */
let openAll = false;

export function useOpenOverride(): boolean {
  const [params] = useSearchParams();
  const asked = params.has('abierto');
  useEffect(() => {
    if (asked) openAll = true;
  }, [asked]);
  return asked || openAll;
}

/** Solo para pruebas: olvida un `?abierto` anterior. */
export function resetOpenOverride(): void {
  openAll = false;
}

/**
 * Al entrar en la pantalla (o cuando cambia `trigger`) el foco pasa al título: al cambiar de ruta el
 * control que lo tenía se desmonta y el foco caería en `body`. El título es el h1 de `Layout`.
 */
export function useFocusTitle(trigger?: unknown): void {
  useEffect(() => {
    const title = document.querySelector<HTMLElement>('.layout__title');
    if (!title) return;
    title.tabIndex = -1;
    title.focus();
  }, [trigger]);
}
