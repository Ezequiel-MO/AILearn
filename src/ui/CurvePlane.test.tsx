import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { GraphSpec } from '../content/schema';
import { CurvePlane, niceStep } from './CurvePlane';

// f(x) = x²
const parabola = (over: Partial<GraphSpec> = {}): GraphSpec => ({
  x: [-2, 4],
  y: [-2, 10],
  snap: 1,
  curve: { kind: 'poly', coefs: [0, 0, 1] },
  points: [{ id: 'p', label: 'P', x: 1, movable: true, onCurve: true }],
  readouts: [],
  ...over,
});

const readouts = () => screen.getByRole('group', { name: 'Lecturas' });
const parts = (c: HTMLElement, sel: string) => c.querySelectorAll(sel);

describe('CurvePlane: puntos sobre la curva', () => {
  // contract: curves.ts curveAt, f(x) = x²: de x = 1 un paso de snap 1 a la derecha deja el punto en (2, 4)
  it('la flecha derecha mueve en x y la altura la da la curva', async () => {
    const onMove = vi.fn();
    render(<CurvePlane spec={parabola()} positions={{ p: [1, 1] }} onMove={onMove} />);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('button', { name: /Punto P/ })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(onMove).toHaveBeenCalledExactlyOnceWith('p', [2, 4]);
  });

  // contract: brief, «en uno onCurve, solo izquierda y derecha»: arriba y abajo no mueven nada
  it('las flechas verticales no mueven un punto sobre la curva', async () => {
    const onMove = vi.fn();
    render(<CurvePlane spec={parabola()} positions={{ p: [1, 1] }} onMove={onMove} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowUp}{ArrowDown}');
    expect(onMove).not.toHaveBeenCalled();
  });

  // contract: brief, «x cae en múltiplos de snap dentro de la ventana»: con snap 0,5 un paso va de 1 a 1,5 (f = 2,25)
  it('el snap fraccionario da pasos de snap', async () => {
    const onMove = vi.fn();
    render(<CurvePlane spec={parabola({ snap: 0.5 })} positions={{ p: [1, 1] }} onMove={onMove} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(onMove).toHaveBeenCalledExactlyOnceWith('p', [1.5, 2.25]);
  });

  // contract: brief, «dentro de la ventana»: en el borde derecho (x = 4) la flecha derecha no sale; la izquierda sí
  it('no sale de la ventana por los bordes', async () => {
    const onMove = vi.fn();
    render(<CurvePlane spec={parabola()} positions={{ p: [4, 16] }} onMove={onMove} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(onMove).not.toHaveBeenCalled();
    await user.keyboard('{ArrowLeft}');
    expect(onMove).toHaveBeenCalledExactlyOnceWith('p', [3, 9]);
  });

  // contract: graphPositions, «un punto onCurve siempre en (x, f(x))»: la etiqueta del asa lee la altura de la curva
  it('ignora la y que le pasen: el asa dice (x; f(x))', () => {
    render(<CurvePlane spec={parabola()} positions={{ p: [3, 99] }} onMove={() => {}} />);
    expect(screen.getByRole('button', { name: 'Punto P, en (3, 9)' })).toBeInTheDocument();
  });
});

describe('CurvePlane: puntos libres', () => {
  const free: GraphSpec = {
    x: [-4, 8],
    y: [-4, 8],
    snap: 1,
    points: [{ id: 'a', label: 'A', x: 1, y: 1, movable: true }],
    readouts: [],
  };
  // contract: brief, «un punto libre se arrastra en 2D con la misma rejilla»: arriba sube un paso de snap
  it('se mueve en las cuatro direcciones', async () => {
    const onMove = vi.fn();
    render(<CurvePlane spec={free} positions={{ a: [1, 1] }} onMove={onMove} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowUp}{ArrowLeft}');
    expect(onMove.mock.calls).toEqual([
      ['a', [1, 2]],
      ['a', [0, 1]],
    ]);
  });
});

describe('CurvePlane: lecturas', () => {
  // contract: curves.ts, f(1,5) = 2,25 y f′(1,5) = 3; format.ts: coma decimal y «; » si algún componente es decimal
  it('coords con decimales: coma y «; »; pendiente en P', () => {
    const { container } = render(
      <CurvePlane
        spec={parabola({ readouts: ['coords', 'slope'] })}
        positions={{ p: [1.5, 2.25] }}
      />,
    );
    const r = within(readouts());
    expect(r.getByText('P')).toBeInTheDocument();
    expect(r.getByText('(1,5; 2,25)')).toBeInTheDocument();
    expect(r.getByText('pendiente en P')).toBeInTheDocument();
    expect(r.getByText('3')).toBeInTheDocument();
    expect(parts(container, '.curve__tangent')).toHaveLength(1);
  });

  // contract: curves.ts, pérdida mse de un dato (2, 4) en w = 1: (1·2 − 4)² = 4; brief: «w = …» y «pérdida = …»
  it('con una pérdida, el punto se lee como w y pérdida', () => {
    const spec: GraphSpec = {
      x: [0, 4],
      y: [0, 20],
      snap: 0.5,
      curve: { kind: 'mse', data: [[2, 4]] },
      points: [{ id: 'w', label: 'w', x: 1, movable: true, onCurve: true }],
      readouts: ['coords'],
    };
    render(<CurvePlane spec={spec} positions={{ w: [1, 4] }} />);
    const r = within(readouts());
    expect(r.getByText('w')).toBeInTheDocument();
    expect(r.getByText('pérdida')).toBeInTheDocument();
    expect(r.getByText('4')).toBeInTheDocument();
  });

  // contract: curves.ts measureCurve, secant de [p, q] = (f(q.x) − f(p.x)) / (q.x − p.x): (4 − 1) / (2 − 1) = 3
  it('la secante se pinta y su pendiente se lee', () => {
    const spec = parabola({
      points: [
        { id: 'p', label: 'P', x: 1, movable: false, onCurve: true },
        { id: 'q', label: 'Q', x: 2, movable: true, onCurve: true },
      ],
      readouts: ['secant'],
      pair: ['p', 'q'],
    });
    const { container } = render(<CurvePlane spec={spec} positions={{ p: [1, 1], q: [2, 4] }} />);
    expect(parts(container, '.curve__secant')).toHaveLength(1);
    expect(parts(container, '.curve__tangent')).toHaveLength(0);
    const r = within(readouts());
    expect(r.getByText('pendiente de la secante PQ')).toBeInTheDocument();
    expect(r.getByText('3')).toBeInTheDocument();
  });

  const line: GraphSpec = {
    x: [-4, 8],
    y: [-4, 8],
    snap: 1,
    points: [
      { id: 'a', label: 'A', x: 1, y: 1, movable: true },
      { id: 'b', label: 'B', x: 5, y: 4, movable: true },
    ],
    readouts: ['line'],
    pair: ['a', 'b'],
  };

  // contract: curves.ts measureCurve, line_slope = (4 − 1) / (5 − 1) = 0,75 y line_icpt = 1 − 0,75·1 = 0,25; triángulo: avance 4, subida 3
  it('la recta se pinta con su triángulo y sus lecturas', () => {
    const { container } = render(<CurvePlane spec={line} positions={{ a: [1, 1], b: [5, 4] }} />);
    expect(parts(container, '.curve__line')).toHaveLength(1);
    expect(parts(container, '.curve__triangle')).toHaveLength(1);
    expect(screen.getByText('avance 4')).toBeInTheDocument();
    expect(screen.getByText('subida 3')).toBeInTheDocument();
    const r = within(readouts());
    expect(r.getByText('0,75')).toBeInTheDocument();
    expect(r.getByText('0,25')).toBeInTheDocument();
  });

  // contract: curves.ts, «NaN si los dos puntos tienen la misma x (recta vertical)»: la lectura dice «sin pendiente»
  it('una recta vertical no tiene pendiente', () => {
    render(<CurvePlane spec={line} positions={{ a: [2, 1], b: [2, 4] }} />);
    expect(within(readouts()).getAllByText('sin pendiente')).toHaveLength(2);
  });

  // contract: brief, «tangent: dibuja la tangente aunque no se lea su pendiente»
  it('tangent dibuja la tangente sin lectura; sin ella no hay tangente', () => {
    const a = render(<CurvePlane spec={parabola({ tangent: true })} positions={{ p: [1, 1] }} />);
    expect(parts(a.container, '.curve__tangent')).toHaveLength(1);
    a.unmount();
    const b = render(<CurvePlane spec={parabola()} positions={{ p: [1, 1] }} />);
    expect(parts(b.container, '.curve__tangent')).toHaveLength(0);
    expect(parts(b.container, '.curve__derivative')).toHaveLength(0);
  });

  // contract: brief, «derivative: f′ como segunda curva, con su nombre» (f′ en una función, «pendiente» en una pérdida)
  it('derivative dibuja f′ con su nombre', () => {
    const { container } = render(
      <CurvePlane spec={parabola({ derivative: true })} positions={{ p: [1, 1] }} />,
    );
    expect(parts(container, '.curve__derivative')).toHaveLength(1);
    expect(screen.getByText('f′')).toBeInTheDocument();
  });
});

describe('CurvePlane: paso y ajuste', () => {
  // datos (1, 2), (2, 4), (3, 6): la pérdida de w
  const loss = (over: Partial<GraphSpec> = {}): GraphSpec => ({
    x: [-1, 5],
    y: [0, 40],
    snap: 0.25,
    curve: {
      kind: 'mse',
      data: [
        [1, 2],
        [2, 4],
        [3, 6],
      ],
    },
    points: [{ id: 'w', label: 'w', x: 4, movable: true, onCurve: true }],
    readouts: ['coords'],
    ...over,
  });

  // contract: brief, «step: una flecha y un punto fantasma, con el rótulo un paso»
  it('step pinta la flecha, el punto fantasma y «un paso»', () => {
    const { container } = render(
      <CurvePlane spec={loss({ step: { of: 'w', rate: 0.1 } })} positions={{ w: [4, 18.67] }} />,
    );
    expect(parts(container, '.curve__step')).toHaveLength(1);
    expect(parts(container, '.curve__ghost')).toHaveLength(1);
    expect(screen.getByText('un paso')).toBeInTheDocument();
  });

  // contract: brief, «fit: un error por dato»: tres datos, tres segmentos con su cuadrado
  it('fit pinta un error por dato y se actualiza con w', () => {
    const spec = loss({ fit: { of: 'w' } });
    const { container, rerender } = render(
      <CurvePlane spec={spec} positions={{ w: [4, 18.67] }} />,
    );
    expect(parts(container, '.curve__fit-error')).toHaveLength(3);
    expect(parts(container, '.curve__fit-datum')).toHaveLength(3);
    expect(screen.getByText('Los datos y la recta ŷ = 4·x')).toBeInTheDocument();
    const before = container.querySelector('.curve__fit-square')?.getAttribute('points');
    rerender(<CurvePlane spec={spec} positions={{ w: [2, 0] }} />);
    // contract: curves.ts, con w = 2 la recta ŷ = 2·x pasa por los tres datos: error 0, cuadrados de lado 0
    expect(screen.getByText('Los datos y la recta ŷ = 2·x')).toBeInTheDocument();
    expect(container.querySelector('.curve__fit-square')?.getAttribute('points')).not.toBe(before);
  });

  // contract: brief, «fit» es lo que añade el segundo panel: sin él, ningún error por dato
  it('sin fit no hay segundo panel', () => {
    const { container } = render(<CurvePlane spec={loss()} positions={{ w: [4, 18.67] }} />);
    expect(parts(container, '.curve__fit-error')).toHaveLength(0);
  });
});

describe('CurvePlane: figura estática', () => {
  // contract: brief, «sin onMove, figura estática sin asas»
  it('no tiene asas', () => {
    render(<CurvePlane spec={parabola()} positions={{ p: [1, 1] }} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('img', { name: 'Plano de curvas' })).toBeInTheDocument();
  });
});

describe('niceStep', () => {
  // contract: brief, «marcas con números bonitos»: un rango de 12 con unas 6 marcas da paso 2; uno de 1 da 0,2
  it('da pasos 1, 2 o 5 por una potencia de 10', () => {
    expect(niceStep(12)).toBe(2);
    expect(niceStep(1)).toBe(0.2);
    expect(niceStep(40)).toBe(5);
  });
});
