import { useIntro } from './fx/useIntro';

/**
 * Avance (0 a 1) de la entrada de un plano estático: la transformación que se aplica o los vectores que
 * crecen desde el origen. Solo mueve la geometría: las lecturas usan siempre las posiciones reales.
 * Sin movimiento permitido (jsdom, movimiento reducido) vale 1 desde el primer pintado.
 */
export function usePlaneIntro(
  animated: boolean,
  transforms: boolean,
): { progress: number; restart: () => void } {
  return useIntro(animated, transforms ? 1400 : 700, { delay: transforms ? 350 : 100 });
}
