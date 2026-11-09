import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlaneSpec } from '../content/schema';
import { CENTER, MARGIN } from './labels';
import { VectorPlane } from './VectorPlane';

const spec: PlaneSpec = {
  range: 4,
  snap: 1,
  vectors: [
    { id: 'i', label: 'î', x: 1, y: 0, movable: false },
    { id: 'j', label: 'ĵ', x: 0, y: 1, movable: false },
  ],
  readouts: ['matrix'],
  transform: { columns: ['i', 'j'] },
};
const positions = { i: [2, 0] as [number, number], j: [0, 3] as [number, number] };
const scale = (CENTER - MARGIN) / spec.range;

let frames: ((now: number) => void)[] = [];
const runFrame = (now: number) => {
  const pending = frames;
  frames = [];
  act(() => pending.forEach((f) => f(now)));
};
const unitTipX = () => Number(document.querySelector('[data-vector="i"] line')!.getAttribute('x2'));
const stubMotion = (reduce: boolean) => {
  vi.stubGlobal('matchMedia', () => ({ matches: reduce }));
  vi.stubGlobal('requestAnimationFrame', (f: (now: number) => void) => frames.push(f));
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = [];
  });
};

beforeEach(() => {
  frames = [];
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('VectorPlane: entrada animada de una figura estática', () => {
  // contract: brief del padre, la animación solo cambia la geometría: î parte de (1,0) y acaba en su columna real
  it('dibuja î en la identidad al principio y en su columna al final', () => {
    stubMotion(false);
    render(<VectorPlane spec={spec} positions={positions} />);
    runFrame(0);
    // contract: brief del padre, progreso 0: î en (1,0); el asta acaba antes de CENTER + scale (la cabeza de flecha va aparte)
    expect(unitTipX()).toBeLessThan(CENTER + scale);
    expect(unitTipX()).toBeGreaterThan(CENTER);
    runFrame(350 + 1400 + 10);
    // contract: brief del padre, progreso 1: î en (2,0); el asta supera ya la posición (1,0)
    expect(unitTipX()).toBeGreaterThan(CENTER + scale);
    expect(unitTipX()).toBeLessThan(CENTER + 2 * scale);
  });

  // contract: brief del padre, las lecturas muestran siempre los valores finales, nunca los animados
  it('la lectura de la matriz es la final desde el primer pintado', () => {
    stubMotion(false);
    render(<VectorPlane spec={spec} positions={positions} />);
    const cells = Array.from(document.querySelectorAll('.plane__matrix-cell')).map(
      (c) => c.textContent,
    );
    // contract: brief del padre, A por filas con columnas (2,0) y (0,3)
    expect(cells).toEqual(['2', '0', '0', '3']);
  });

  // contract: fallo visto en el navegador (2026-11-09): al cerrar un «manipular» el plano pasa a estático y
  // los vectores volvían a crecer desde el origen; un plano que nace interactivo no se anima solo
  it('un plano que se vuelve estático al cerrar la pregunta no se anima solo', () => {
    stubMotion(false);
    const { rerender } = render(
      <VectorPlane spec={spec} positions={positions} onMove={() => {}} />,
    );
    const before = unitTipX();
    rerender(<VectorPlane spec={spec} positions={positions} />);
    // contract: sin animación pendiente y î sigue en su columna real (2,0)
    expect(frames).toHaveLength(0);
    expect(unitTipX()).toBe(before);
    expect(unitTipX()).toBeGreaterThan(CENTER + scale);
  });

  // contract: brief del padre, el botón reinicia la animación: î vuelve a la identidad
  it('el botón de repetir reinicia la animación', () => {
    stubMotion(false);
    render(<VectorPlane spec={spec} positions={positions} />);
    runFrame(0);
    runFrame(5000);
    const end = unitTipX();
    fireEvent.click(screen.getByRole('button', { name: 'Ver la transformación' }));
    runFrame(10000);
    // contract: brief del padre, al reiniciar vuelve a la identidad
    expect(unitTipX()).toBeLessThan(end);
  });

  // contract: brief del padre, sin transformación no hay botón (las figuras del juego 1 solo crecen)
  it('un plano sin transformación no muestra el botón', () => {
    stubMotion(false);
    render(
      <VectorPlane spec={{ ...spec, transform: undefined, readouts: [] }} positions={positions} />,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  // contract: brief del padre, con movimiento reducido no se anima y no hay botón
  it('con movimiento reducido no anima ni muestra el botón', () => {
    stubMotion(true);
    render(<VectorPlane spec={spec} positions={positions} />);
    expect(frames).toHaveLength(0);
    expect(screen.queryByRole('button')).toBeNull();
    // contract: brief del padre, estado final directo: î en (2,0)
    expect(unitTipX()).toBeGreaterThan(CENTER + scale);
  });
});
