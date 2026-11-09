import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GraphSpec } from '../content/schema';
import { CurvePlane } from './CurvePlane';

// f(x) = x² en la ventana [-2, 4]: P fijo en x = 3, con su tangente y un paso de descenso
const spec: GraphSpec = {
  x: [-2, 4],
  y: [-2, 10],
  snap: 1,
  curve: { kind: 'poly', coefs: [0, 0, 1] },
  points: [{ id: 'p', label: 'P', x: 3, movable: false, onCurve: true }],
  readouts: ['coords', 'slope'],
  step: { of: 'p', rate: 0.25 },
};
const positions = { p: [3, 9] };

let frames: ((now: number) => void)[] = [];
const runFrame = (now: number) => {
  const pending = frames;
  frames = [];
  act(() => pending.forEach((f) => f(now)));
};
const stubMotion = (reduce: boolean) => {
  vi.stubGlobal('matchMedia', () => ({ matches: reduce }));
  vi.stubGlobal('requestAnimationFrame', (f: (now: number) => void) => frames.push(f));
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = [];
  });
};
const dotX = () => Number(document.querySelector('.curve__point-dot')!.getAttribute('cx'));
const outputs = () => Array.from(document.querySelectorAll('output')).map((o) => o.textContent);
const replay = () => screen.queryByRole('button', { name: 'Ver cómo se dibuja' });

beforeEach(() => {
  frames = [];
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CurvePlane: entrada animada de una figura estática', () => {
  it('el punto baja por la curva hasta su sitio y el paso aparece al final', () => {
    stubMotion(false);
    render(<CurvePlane spec={spec} positions={positions} />);
    runFrame(0); // arranque: el retraso aún no ha pasado, avance 0
    const start = dotX();
    // contract: brief «anima el plano de curvas»: sin paso de descenso hasta la última fase
    expect(document.querySelector('.curve__step')).toBeNull();
    runFrame(250 + 2400 + 10);
    // contract: brief: al final el punto está en su x real (3), a la derecha de donde salió (cerca del borde)
    expect(dotX()).toBeGreaterThan(start);
    expect(document.querySelector('.curve__step')).not.toBeNull();
  });

  it('las lecturas son las finales desde el primer pintado', () => {
    stubMotion(false);
    render(<CurvePlane spec={spec} positions={positions} />);
    runFrame(0);
    // contract: brief: la animación solo mueve la geometría; P = (3, 9) y su pendiente 2·3 = 6
    expect(outputs()).toEqual(['(3, 9)', '6']);
  });

  it('el botón repite la entrada', () => {
    stubMotion(false);
    render(<CurvePlane spec={spec} positions={positions} />);
    runFrame(0);
    runFrame(5000);
    const end = dotX();
    fireEvent.click(replay()!);
    runFrame(10000);
    // contract: brief: al repetir, el punto vuelve a salir del borde izquierdo
    expect(dotX()).toBeLessThan(end);
  });

  it('una figura que se vuelve estática al cerrar la pregunta no se anima sola', () => {
    stubMotion(false);
    const movable = { ...spec, points: [{ ...spec.points[0]!, movable: true }] };
    const { rerender } = render(
      <CurvePlane spec={movable} positions={positions} onMove={() => {}} />,
    );
    rerender(<CurvePlane spec={movable} positions={positions} />);
    // contract: mismo fallo que en el plano de vectores (2026-11-09): un plano que nace interactivo no se anima
    expect(frames).toHaveLength(0);
    expect(document.querySelector('.curve__step')).not.toBeNull();
  });

  it('con movimiento reducido o sin navegador, ni animación ni botón', () => {
    stubMotion(true);
    const { unmount } = render(<CurvePlane spec={spec} positions={positions} />);
    // contract: prefers-reduced-motion: la figura sale ya en su estado final
    expect(frames).toHaveLength(0);
    expect(replay()).toBeNull();
    expect(document.querySelector('.curve__step')).not.toBeNull();
    unmount();
    vi.unstubAllGlobals();
    render(<CurvePlane spec={spec} positions={positions} />);
    // contract: en jsdom sin matchMedia el plano es el de siempre (sin botón)
    expect(replay()).toBeNull();
  });
});
