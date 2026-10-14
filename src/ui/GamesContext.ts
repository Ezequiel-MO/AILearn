import { createContext, useContext } from 'react';
import type { Game } from '../content/schema';
import { games } from '../games';

/**
 * El registro de juegos que ven las pantallas. El valor por defecto es el registro real; las pruebas
 * inyectan un juego propio con `GamesContext.Provider` y no dependen del contenido real.
 */
export const GamesContext = createContext<readonly Game[]>(games);

/** El juego con ese id, o `undefined` si no está registrado. */
export function useGame(id: string): Game | undefined {
  return useContext(GamesContext).find((g) => g.id === id);
}
