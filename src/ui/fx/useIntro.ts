import { useCallback, useEffect, useState } from 'react';
import { motionAllowed, tween } from './motion';

/**
 * Avance (0 a 1) de la entrada animada de una figura estática. Solo anima sola si la figura nace
 * estática: una que se vuelve estática después (la pregunta se cierra) no se mueve, porque el jugador ya
 * la ha tenido en sus manos; `restart` la repite. Sin movimiento permitido (jsdom, movimiento reducido)
 * vale 1 desde el primer pintado. `ease` debe ser una función estable (de módulo).
 */
export function useIntro(
  animated: boolean,
  ms: number,
  { delay = 0, ease }: { delay?: number; ease?: (t: number) => number } = {},
): { progress: number; restart: () => void } {
  const [progress, setProgress] = useState(() => (animated && motionAllowed() ? 0 : 1));
  // Pasada en curso: la 1 es la entrada, solo si la figura nace estática.
  const [run, setRun] = useState(() => (animated ? 1 : 0));

  useEffect(() => {
    if (!animated || run === 0) return undefined;
    return tween(ms, setProgress, { delay, ease });
  }, [animated, ms, delay, ease, run]);

  const restart = useCallback(() => {
    setProgress(0);
    setRun((n) => n + 1);
  }, []);
  return { progress: animated ? progress : 1, restart };
}
