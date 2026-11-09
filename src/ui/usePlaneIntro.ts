import { useCallback, useEffect, useState } from 'react';
import { motionAllowed, tween } from './fx/motion';

/**
 * Avance (0 a 1) de la entrada de un plano estático: la transformación que se aplica o los vectores que
 * crecen desde el origen. Solo mueve la geometría: las lecturas usan siempre las posiciones reales.
 * Sin movimiento permitido (jsdom, movimiento reducido) vale 1 desde el primer pintado.
 */
export function usePlaneIntro(
  animated: boolean,
  transforms: boolean,
): { progress: number; restart: () => void } {
  const [progress, setProgress] = useState(() => (animated && motionAllowed() ? 0 : 1));
  // Pasada en curso: la 1 es la entrada, solo si el plano nace estático. Un plano que se vuelve estático
  // después (la pregunta se cierra) no se anima solo: el jugador ya lo ha visto moverse en sus manos.
  const [run, setRun] = useState(() => (animated ? 1 : 0));

  useEffect(() => {
    if (!animated || run === 0) return undefined;
    return tween(transforms ? 1400 : 700, setProgress, { delay: transforms ? 350 : 100 });
  }, [animated, transforms, run]);

  const restart = useCallback(() => {
    setProgress(0);
    setRun((n) => n + 1);
  }, []);
  return { progress: animated ? progress : 1, restart };
}
