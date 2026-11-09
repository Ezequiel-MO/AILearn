// Cuándo animar. Las animaciones son adorno: nunca cambian lo que se lee ni lo que se puntúa.

/**
 * Hay movimiento si el navegador sabe responder a la preferencia y el jugador no pide movimiento
 * reducido. Sin `matchMedia` (jsdom en las pruebas) no se anima nada: lo que se pinta es el estado final.
 */
export const motionAllowed = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/** Hay navegador de verdad (con `matchMedia`): los efectos que no son movimiento, como el sonido. */
export const browserFx = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function';

/** Curva suave de ida y vuelta: arranca y frena despacio. */
export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Llama a `frame` con el avance de 0 a 1 (ya suavizado) durante `ms` milisegundos, tras `delay`.
 * Devuelve la función que la cancela. Sin movimiento permitido, llama una vez con 1 y termina.
 */
export const tween = (
  ms: number,
  frame: (progress: number) => void,
  { delay = 0, ease = easeInOutCubic }: { delay?: number; ease?: (t: number) => number } = {},
): (() => void) => {
  if (!motionAllowed() || typeof requestAnimationFrame !== 'function') {
    frame(1);
    return () => {};
  }
  let raf = 0;
  let start: number | null = null;
  const tick = (now: number) => {
    if (start === null) start = now + delay;
    const raw = (now - start) / ms;
    const t = raw <= 0 ? 0 : raw >= 1 ? 1 : raw;
    frame(ease(t));
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
};
