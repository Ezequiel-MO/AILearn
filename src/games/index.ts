import type { Game } from '../content/schema';
import { matrices } from './matrices';
import { vectores } from './vectores';

/** Registro de juegos. Las pruebas de tests/content recorren esta lista: un juego añadido aquí queda cubierto sin escribir nada. */
export const games: Game[] = [vectores, matrices];
