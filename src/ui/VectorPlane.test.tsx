import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PlaneSpec } from '../content/schema';
import {
  CENTER,
  HANDLE_RING_RADIUS,
  LABEL_CHAR_WIDTH,
  LABEL_HALF_HEIGHT,
  LABEL_STROKE,
  MARGIN,
  VIEW,
} from './labels';
import { VectorPlane } from './VectorPlane';

const spec = (over: Partial<PlaneSpec> = {}): PlaneSpec => ({
  range: 6,
  snap: 1,
  vectors: [{ id: 'v', label: 'v', x: 1, y: 1, movable: true }],
  readouts: [],
  ...over,
});

const readouts = () => screen.getByRole('group', { name: 'Lecturas' });

describe('VectorPlane: teclado', () => {
  // contract: tarea 9, tabla de casos: vector móvil en (1,1), foco en el asa y flecha derecha -> onMove('v', [2, 1]) con snap 1
  it('la flecha derecha mueve un paso de snap', async () => {
    const onMove = vi.fn();
    render(<VectorPlane spec={spec()} positions={{ v: [1, 1] }} onMove={onMove} />);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('button', { name: /vector v/ })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(onMove).toHaveBeenCalledExactlyOnceWith('v', [2, 1]);
  });

  // contract: tarea 9, contrato de las reglas del plano: las flechas mueven un paso de snap (cuatro direcciones; arriba es +y)
  it('las otras flechas mueven en su dirección, con snap fraccionario', async () => {
    const onMove = vi.fn();
    render(<VectorPlane spec={spec({ snap: 0.5 })} positions={{ v: [1, 1] }} onMove={onMove} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowLeft}{ArrowUp}{ArrowDown}');
    expect(onMove.mock.calls).toEqual([
      ['v', [0.5, 1]],
      ['v', [1, 1.5]],
      ['v', [1, 0.5]],
    ]);
  });

  // contract: tarea 9, tabla de casos: en el borde (range 6, vector en (6,0)) y flecha derecha -> no se llama o se llama con (6,0)
  it('no se sale de range', async () => {
    const onMove = vi.fn();
    render(
      <VectorPlane
        spec={spec({ vectors: [{ id: 'v', label: 'v', x: 6, y: 0, movable: true }] })}
        positions={{ v: [6, 0] }}
        onMove={onMove}
      />,
    );
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowRight}');
    for (const call of onMove.mock.calls) expect(call).toEqual(['v', [6, 0]]);
  });

  // contract: tarea 9, tabla de casos: vector fijo -> no hay asa enfocable
  it('un vector fijo no tiene asa', () => {
    render(
      <VectorPlane
        spec={spec({ vectors: [{ id: 'v', label: 'v', x: 1, y: 1, movable: false }] })}
        positions={{ v: [1, 1] }}
        onMove={vi.fn()}
      />,
    );
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(document.querySelectorAll('[tabindex]')).toHaveLength(0);
  });

  // contract: tarea 9, tabla de casos: sin onMove -> ningún asa enfocable
  it('sin onMove es una figura estática', () => {
    const { container } = render(<VectorPlane spec={spec()} positions={{ v: [1, 1] }} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(container.querySelectorAll('[tabindex]')).toHaveLength(0);
  });

  // contract: tarea 9, reglas del plano: cada asa tiene aria-label con su nombre y posición (coma decimal, menos tipográfico);
  // ruling R15: con un decimal el separador del par es «; »
  it('el asa tiene aria-label con nombre y posición', () => {
    render(
      <VectorPlane
        spec={spec({ vectors: [{ id: 'v', label: 'v', x: -1.5, y: 2, movable: true }] })}
        positions={{ v: [-1.5, 2] }}
        onMove={vi.fn()}
      />,
    );
    expect(screen.getByRole('button')).toHaveAccessibleName('Asa del vector v, en (−1,5; 2)');
  });
});

// Rectángulo simulado del SVG en pantalla: desplazado de (0, 0) y de 328 px de lado (no 480 como la vista), para que
// la conversión de píxeles a unidades de vista no sea la identidad. 1 unidad de vista = 328/480 px = 41/60 px.
const rectAt = (left: number, top: number, side = 328) =>
  ({
    left,
    top,
    width: side,
    height: side,
    right: left + side,
    bottom: top + side,
    x: left,
    y: top,
  }) as DOMRect;

describe('VectorPlane: arrastre', () => {
  // contract: tarea 9, reglas del plano: arrastre con eventos de puntero, ajustado a la rejilla y limitado a range.
  // Con range 6 el plano mide 408 unidades de vista (240 ± 204): 34 unidades de vista por unidad del plano, y el origen está en
  // la vista (240, 240). El SVG está en left 16, top 100 y mide 328 px: la vista (vx, vy) cae en el píxel (16 + vx·41/60, 100 + vy·41/60).
  // Origen -> (16 + 240·41/60, 100 + 240·41/60) = (180, 264). Punto (3, −2) -> vista (342, 308) -> píxel (249,7; 310,47).
  it('arrastrar convierte píxeles a unidades, ajusta a la rejilla y limita a range', () => {
    const onMove = vi.fn();
    const { container } = render(
      <VectorPlane spec={spec()} positions={{ v: [1, 1] }} onMove={onMove} />,
    );
    const svg = container.querySelector('svg') as SVGSVGElement;
    svg.getBoundingClientRect = () => rectAt(16, 100);
    const handle = screen.getByRole('button');
    // se agarra el asa en su punta: vista (274, 206) -> píxel (16 + 274·41/60, 100 + 206·41/60)
    fireEvent.pointerDown(handle, {
      pointerId: 1,
      clientX: 16 + (274 * 41) / 60,
      clientY: 100 + (206 * 41) / 60,
    });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 249.7, clientY: 310.47 });
    expect(onMove).toHaveBeenLastCalledWith('v', [3, -2]);
    // el centro del plano es el origen
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 180, clientY: 264 });
    expect(onMove).toHaveBeenLastCalledWith('v', [0, 0]);
    // un punto muy a la derecha y arriba se limita a la esquina (6, 6)
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 5000, clientY: -5000 });
    expect(onMove).toHaveBeenLastCalledWith('v', [6, 6]);
    // tras soltar, un movimiento ya no arrastra
    fireEvent.pointerUp(handle, { pointerId: 1 });
    onMove.mockClear();
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 100, clientY: 100 });
    expect(onMove).not.toHaveBeenCalled();
  });

  // contract: decisión de la tarea 9: el rectángulo del SVG se lee en cada evento (la página puede desplazarse o cambiar de tamaño
  // durante el arrastre): si el SVG se mueve 30 px a la derecha y 40 hacia arriba y el puntero lo acompaña, el vector no se mueve.
  it('el desplazamiento del SVG durante el arrastre se compensa', () => {
    const onMove = vi.fn();
    const { container } = render(
      <VectorPlane spec={spec()} positions={{ v: [1, 1] }} onMove={onMove} />,
    );
    const svg = container.querySelector('svg') as SVGSVGElement;
    let rect = rectAt(16, 100);
    svg.getBoundingClientRect = () => rect;
    const handle = screen.getByRole('button');
    const downX = 16 + (274 * 41) / 60;
    const downY = 100 + (206 * 41) / 60;
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: downX, clientY: downY });
    rect = rectAt(46, 60);
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: downX + 30, clientY: downY - 40 });
    expect(onMove).not.toHaveBeenCalled();
  });

  // contract: decisión de la tarea 9: el SVG mide el doble en pantalla (656 px) que en la vista -> la misma escala se aplica al
  // mover: 1 unidad del plano son 34 · 656/480 = 46,47 px. Desde la punta (1, 1), 2 unidades a la derecha son 92,9 px -> (3, 1).
  it('la conversión depende del ancho real del SVG', () => {
    const onMove = vi.fn();
    const { container } = render(
      <VectorPlane spec={spec()} positions={{ v: [1, 1] }} onMove={onMove} />,
    );
    const svg = container.querySelector('svg') as SVGSVGElement;
    svg.getBoundingClientRect = () => rectAt(0, 0, 656);
    const handle = screen.getByRole('button');
    const tipX = (274 * 656) / 480;
    const tipY = (206 * 656) / 480;
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: tipX, clientY: tipY });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: tipX + 92.9, clientY: tipY });
    expect(onMove).toHaveBeenLastCalledWith('v', [3, 1]);
  });
});

describe('VectorPlane: agarre', () => {
  // contract: decisión de la tarea 9 (no está en el brief): agarrar el asa lejos de su centro no hace saltar el vector;
  // el vector sigue el desplazamiento del puntero, no su posición absoluta.
  it('agarrar el asa descentrada no provoca un salto', () => {
    const onMove = vi.fn();
    const { container } = render(
      <VectorPlane spec={spec()} positions={{ v: [1, 1] }} onMove={onMove} />,
    );
    const svg = container.querySelector('svg') as SVGSVGElement;
    svg.getBoundingClientRect = () => rectAt(0, 0, 480);
    const handle = screen.getByRole('button');
    const dot = handle.querySelector('.plane__handle-dot') as SVGCircleElement;
    const tipX = Number(dot.getAttribute('cx'));
    const tipY = Number(dot.getAttribute('cy'));
    // se agarra 10 px a la derecha de la punta y se mueve el puntero 10 px a la derecha: el vector no cambia de celda
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: tipX + 10, clientY: tipY });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: tipX + 10, clientY: tipY });
    expect(onMove).not.toHaveBeenCalled();
  });
});

describe('VectorPlane: lecturas', () => {
  // contract: tarea 9, tabla de casos: readouts ['norm'] con vector (3,4) -> aparece «5»
  it('muestra la norma', () => {
    render(
      <VectorPlane
        spec={spec({
          readouts: ['norm'],
          vectors: [{ id: 'v', label: 'v', x: 3, y: 4, movable: false }],
        })}
        positions={{ v: [3, 4] }}
      />,
    );
    // las marcas de los ejes también llevan números: se busca dentro de las lecturas
    expect(within(readouts()).getByText('5')).toBeInTheDocument();
  });

  // contract: tarea 9, tabla de casos: readouts ['sum'], pair u=(2,1), v=(3,2) -> aparece «(5, 3)»
  it('muestra la suma del par y la dibuja como tercera flecha', () => {
    const { container } = render(
      <VectorPlane
        spec={spec({
          readouts: ['sum'],
          pair: ['u', 'v'],
          vectors: [
            { id: 'u', label: 'u', x: 2, y: 1, movable: true },
            { id: 'v', label: 'v', x: 3, y: 2, movable: true },
          ],
        })}
        positions={{ u: [2, 1], v: [3, 2] }}
      />,
    );
    expect(within(readouts()).getByText('(5, 3)')).toBeInTheDocument();
    expect(container.querySelector('.plane__sum')).not.toBeNull();
    expect(container.querySelector('.plane__parallelogram')).not.toBeNull();
  });

  // contract: tarea 9, reglas del plano: las lecturas siguen a `positions`, no a la posición inicial del spec;
  // ruling R15: decimal en el segundo componente -> «; »
  it('las lecturas usan las posiciones controladas', () => {
    render(
      <VectorPlane
        spec={spec({
          readouts: ['components'],
          vectors: [{ id: 'v', label: 'v', x: 1, y: 1, movable: false }],
        })}
        positions={{ v: [-2, 0.5] }}
      />,
    );
    expect(within(readouts()).getByText('(−2; 0,5)')).toBeInTheDocument();
  });

  // contract: ruling R15: la regla mira el texto ya formateado: (2,999999, 1) se muestra «(3, 1)», con «, »
  it('un decimal que desaparece al redondear no cambia el separador', () => {
    render(
      <VectorPlane
        spec={spec({
          readouts: ['components'],
          vectors: [{ id: 'v', label: 'v', x: 1, y: 1, movable: false }],
        })}
        positions={{ v: [2.999999, 1] }}
      />,
    );
    expect(within(readouts()).getByText('(3, 1)')).toBeInTheDocument();
  });

  // contract: ruling R15: la suma (1,5 + 2, 1 + 2) = (3,5; 3) lleva «; »
  it('la suma con decimales usa el punto y coma', () => {
    render(
      <VectorPlane
        spec={spec({
          readouts: ['sum'],
          pair: ['u', 'v'],
          vectors: [
            { id: 'u', label: 'u', x: 1.5, y: 1, movable: false },
            { id: 'v', label: 'v', x: 2, y: 2, movable: false },
          ],
        })}
        positions={{ u: [1.5, 1], v: [2, 2] }}
      />,
    );
    expect(within(readouts()).getByText('(3,5; 3)')).toBeInTheDocument();
  });

  // contract: tarea 9, reglas del plano: cada valor es un <output class="num"> (cifras tabulares)
  it('cada valor es un output con la clase num', () => {
    render(
      <VectorPlane
        spec={spec({
          readouts: ['norm'],
          vectors: [{ id: 'v', label: 'v', x: 3, y: 4, movable: false }],
        })}
        positions={{ v: [3, 4] }}
      />,
    );
    const value = within(readouts()).getByText('5');
    expect(value.tagName).toBe('OUTPUT');
    expect(value).toHaveClass('num');
  });

  // contract: arreglo 1, punto 7: el grupo «Lecturas» es un div que envuelve a la lista de definiciones (dt/dd necesitan un dl padre)
  it('el grupo «Lecturas» es un div con un dl dentro, y el dl no es un grupo', () => {
    render(
      <VectorPlane spec={spec({ readouts: ['components', 'norm'] })} positions={{ v: [1, 1] }} />,
    );
    const group = readouts();
    expect(group.tagName).toBe('DIV');
    const list = group.querySelector('dl') as HTMLElement;
    expect(list).not.toBeNull();
    expect(list).not.toHaveAttribute('role');
    expect(list.querySelectorAll('dt')).toHaveLength(2);
    expect(list.querySelectorAll('dd')).toHaveLength(2);
    for (const dt of list.querySelectorAll('dt')) expect(dt.closest('dl')).toBe(list);
  });

  // contract: tarea 9, reglas del plano: distancia entre los dos de pair, con fmt (3-4-5: de (1,1) a (4,5) la distancia es 5;
  // la norma de b es 6,4, así que una norma en lugar de la distancia no pasaría)
  it('muestra la distancia del par', () => {
    render(
      <VectorPlane
        spec={spec({
          readouts: ['distance'],
          pair: ['a', 'b'],
          vectors: [
            { id: 'a', label: 'a', x: 1, y: 1, movable: false },
            { id: 'b', label: 'b', x: 4, y: 5, movable: false },
          ],
        })}
        positions={{ a: [1, 1], b: [4, 5] }}
      />,
    );
    expect(within(readouts()).getByText('5')).toBeInTheDocument();
  });

  // contract: tarea 9, reglas del plano: sin lecturas pedidas no hay panel de lecturas
  it('sin readouts no dibuja el panel', () => {
    render(<VectorPlane spec={spec()} positions={{ v: [1, 1] }} />);
    expect(screen.queryByRole('group', { name: 'Lecturas' })).toBeNull();
  });
});

describe('VectorPlane: marcas numeradas', () => {
  // contract: tarea 9, reglas del plano: marcas numeradas en cada eje. Con range 6 y snap 1 hay 13 marcas en x (−6…6) y 12 en y
  // (−6…6 sin el 0, que ya está en x).
  it('rotula cada paso de snap en los dos ejes', () => {
    const { container } = render(<VectorPlane spec={spec()} positions={{ v: [1, 1] }} />);
    const labels = [...container.querySelectorAll('.plane__tick-label')].map((n) => n.textContent);
    expect(labels).toHaveLength(25);
    // reparto por eje: las marcas del eje x van a y = 240 + 204 + 18 = 462 (bajo el área), las del eje y a su izquierda
    const perAxis = (axis: 'x' | 'y') =>
      [...container.querySelectorAll('.plane__tick-label')].filter((n) =>
        axis === 'x' ? n.getAttribute('y') === '462' : n.getAttribute('text-anchor') === 'end',
      );
    expect(perAxis('x')).toHaveLength(13);
    expect(perAxis('y')).toHaveLength(12);
    expect(labels.filter((l) => l === '0')).toHaveLength(1);
    expect(labels.filter((l) => l === '−6')).toHaveLength(2);
    expect(labels.filter((l) => l === '6')).toHaveLength(2);
  });

  // contract: tarea 9, reglas del plano: a lo sumo 12 divisiones por eje. Con range 20 y snap 1 (40 divisiones) las marcas
  // se espacian de 5 en 5: x = −20, −15 … 20 (9 marcas) e y lo mismo sin el 0 (8).
  it('espacia las marcas cuando hay demasiadas', () => {
    const { container } = render(
      <VectorPlane spec={spec({ range: 20 })} positions={{ v: [1, 1] }} />,
    );
    const labels = [...container.querySelectorAll('.plane__tick-label')].map((n) => n.textContent);
    expect(labels).toHaveLength(17);
    expect(labels).toContain('−15');
    expect(labels).not.toContain('−14');
  });
});

describe('VectorPlane: roles del SVG', () => {
  // contract: arreglo 1, punto 6: los hijos de role=img son de presentación en ARIA; un SVG con asas es un grupo con nombre
  it('con onMove el SVG es un grupo con nombre (contiene botones)', () => {
    const { container } = render(
      <VectorPlane spec={spec()} positions={{ v: [1, 1] }} onMove={vi.fn()} />,
    );
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg).toHaveAttribute('role', 'group');
    expect(svg).toHaveAccessibleName('Plano de vectores');
    expect(svg.contains(screen.getByRole('button'))).toBe(true);
  });

  // contract: arreglo 1, punto 6: sin asas la figura sigue siendo una imagen con nombre
  it('sin onMove el SVG es una imagen con nombre', () => {
    render(<VectorPlane spec={spec()} positions={{ v: [1, 1] }} />);
    expect(screen.getByRole('img', { name: 'Plano de vectores' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Plano de vectores' })).toBeNull();
  });
});

// --- Etiquetas dentro del SVG ---
// Las medidas de la caja de una etiqueta (ancho por carácter, trazo, media altura) vienen del módulo de etiquetas, que es su
// única fuente; se midieron en el navegador (Chrome, 1280 y 360 px).
interface LabelBox {
  text: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

const labelBoxes = (container: HTMLElement): LabelBox[] =>
  [...container.querySelectorAll('.plane__label')].map((el) => {
    const x = Number(el.getAttribute('x'));
    const y = Number(el.getAttribute('y'));
    const text = el.textContent ?? '';
    const half = (text.length * LABEL_CHAR_WIDTH) / 2 + LABEL_STROKE;
    return {
      text,
      x0: x - half,
      x1: x + half,
      y0: y - LABEL_HALF_HEIGHT,
      y1: y + LABEL_HALF_HEIGHT,
    };
  });

const overlap = (a: LabelBox, b: LabelBox): boolean =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

const pairSpec = (u: [number, number], v: [number, number]) => ({
  spec: spec({
    snap: 0.5,
    readouts: ['sum'],
    pair: ['u', 'v'],
    vectors: [
      { id: 'u', label: 'u', x: u[0], y: u[1], movable: true },
      { id: 'v', label: 'v', x: v[0], y: v[1], movable: true },
    ],
  }),
  positions: { u, v },
});

describe('VectorPlane: etiquetas', () => {
  // contract: arreglo 1, punto 1: ninguna etiqueta sobresale del SVG (0…480), sea cual sea el borde junto al que cae la suma.
  // Casos medidos en el navegador: (3, 0) + (3, 0) sobresalía 6,9 por la derecha; (6, 0) + (0, 6) cortaba «v» 1,2 por arriba.
  it.each([
    ['suma junto al borde derecho', [3, 0], [3, 0]],
    ['suma junto al borde izquierdo', [-3, 0], [-3, 0]],
    ['suma junto al borde superior', [0, 3], [0, 3]],
    ['suma junto al borde inferior', [0, -3], [0, -3]],
    ['suma en la esquina, con v pegado arriba', [6, 0], [0, 6]],
    ['suma fuera de range', [6, 6], [6, 6]],
  ] as const)('%s', (_name, u, v) => {
    const { spec: s, positions } = pairSpec([...u], [...v]);
    const { container } = render(<VectorPlane spec={s} positions={positions} onMove={vi.fn()} />);
    const boxes = labelBoxes(container);
    expect(boxes).toHaveLength(3);
    for (const b of boxes) {
      expect(b.x0, `${b.text} izquierda`).toBeGreaterThanOrEqual(0);
      expect(b.x1, `${b.text} derecha`).toBeLessThanOrEqual(VIEW);
      expect(b.y0, `${b.text} arriba`).toBeGreaterThanOrEqual(0);
      expect(b.y1, `${b.text} abajo`).toBeLessThanOrEqual(VIEW);
    }
  });

  // contract: arreglo 1, punto 1: las etiquetas no se pisan entre sí. u y v en el mismo punto, o v en el origen (la suma cae
  // encima de u), eran ilegibles.
  it.each([
    ['u y v en el mismo punto', [3, 0], [3, 0]],
    ['v en el origen: la suma cae sobre u', [3, 2], [0, 0]],
    ['u en el origen: la suma cae sobre v', [0, 0], [-2, 4]],
    ['los dos en el origen', [0, 0], [0, 0]],
    ['suma junto al borde derecho', [6, 0], [0, 6]],
    ['suma fuera de range, en el rincón', [6, 6], [6, 6]],
  ] as const)('no se solapan: %s', (_name, u, v) => {
    const { spec: s, positions } = pairSpec([...u], [...v]);
    const { container } = render(<VectorPlane spec={s} positions={positions} onMove={vi.fn()} />);
    const boxes = labelBoxes(container);
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        expect(overlap(boxes[i], boxes[j]), `${boxes[i].text} con ${boxes[j].text}`).toBe(false);
      }
    }
  });
});

// Lo dibujado, leído del DOM: cajas de etiqueta, centros de asa y puntas de flecha (la de la suma, de su cabeza).
const drawn = (container: HTMLElement) => {
  const dots = [...container.querySelectorAll('.plane__handle-dot')].map(
    (c) => [Number(c.getAttribute('cx')), Number(c.getAttribute('cy'))] as [number, number],
  );
  const tips = [...container.querySelectorAll('.plane__vector, .plane__sum')]
    .map((g) => g.querySelector('polygon')?.getAttribute('points')?.split(' ')[0])
    .filter((p): p is string => p !== undefined)
    .map((p) => p.split(',').map(Number) as [number, number]);
  return { boxes: labelBoxes(container), dots, tips };
};

/** ¿Algún punto del asta visible (recortada al área de dibujo) cae dentro de la caja? Se muestrea el segmento. */
const shaftInside = (tip: [number, number], b: LabelBox): boolean => {
  const dx = tip[0] - CENTER;
  const dy = tip[1] - CENTER;
  const t = Math.min(1, (CENTER - MARGIN) / Math.max(Math.abs(dx), Math.abs(dy)));
  for (let i = 0; i <= 600; i += 1) {
    const x = CENTER + (dx * t * i) / 600;
    const y = CENTER + (dy * t * i) / 600;
    if (x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1) return true;
  }
  return false;
};

describe('VectorPlane: etiquetas sobre astas y asas', () => {
  // contract: arreglo 2, punto 1: casos del revisor, medidos en el navegador. Ninguna etiqueta toca el asta de una flecha
  // (u, v o la suma) ni el anillo de un asa, ni sale del SVG ni pisa a otra. En el primero, «u + v» se leía «u-+-v».
  it.each([
    ['u = (3, 0), v = (0, 0)', [3, 0], [0, 0]],
    ['u = v = (3, 0)', [3, 0], [3, 0]],
    ['u = (6, 0), v = (0, 6)', [6, 0], [0, 6]],
    ['u = v = (6, 6)', [6, 6], [6, 6]],
    ['u = (−6, −6), v = (−5,5; −5,5)', [-6, -6], [-5.5, -5.5]],
    ['u = (−6, −6), v = (−6; 0,5)', [-6, -6], [-6, 0.5]],
  ] as const)('%s', (_name, u, v) => {
    const { spec: s, positions } = pairSpec([...u], [...v]);
    const { container } = render(<VectorPlane spec={s} positions={positions} onMove={vi.fn()} />);
    const { boxes, dots, tips } = drawn(container);
    expect(boxes).toHaveLength(3);
    expect(tips.length).toBeGreaterThan(0);
    for (const [i, b] of boxes.entries()) {
      expect(b.x0, `${b.text} izquierda`).toBeGreaterThanOrEqual(0);
      expect(b.x1, `${b.text} derecha`).toBeLessThanOrEqual(VIEW);
      expect(b.y0, `${b.text} arriba`).toBeGreaterThanOrEqual(0);
      expect(b.y1, `${b.text} abajo`).toBeLessThanOrEqual(VIEW);
      for (const other of boxes.slice(i + 1)) {
        expect(overlap(b, other), `${b.text} con ${other.text}`).toBe(false);
      }
      for (const tip of tips) expect(shaftInside(tip, b), `${b.text} sobre un asta`).toBe(false);
      for (const [cx, cy] of dots) {
        const nx = Math.max(b.x0, Math.min(b.x1, cx));
        const ny = Math.max(b.y0, Math.min(b.y1, cy));
        expect(Math.hypot(nx - cx, ny - cy), `${b.text} sobre un asa`).toBeGreaterThanOrEqual(
          HANDLE_RING_RADIUS,
        );
      }
    }
  });
});
