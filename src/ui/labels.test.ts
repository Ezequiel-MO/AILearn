import { describe, expect, it } from 'vitest';
import {
  CENTER,
  HANDLE_RING_RADIUS,
  LABEL_CHAR_WIDTH,
  LABEL_HALF_HEIGHT,
  LABEL_STROKE,
  MARGIN,
  VIEW,
  placeLabels,
} from './labels';
import type { Point } from './labels';

interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

const rectOf = (text: string, [x, y]: Point): Rect => {
  const half = (text.length * LABEL_CHAR_WIDTH) / 2 + LABEL_STROKE;
  return { x0: x - half, x1: x + half, y0: y - LABEL_HALF_HEIGHT, y1: y + LABEL_HALF_HEIGHT };
};

const overlap = (a: Rect, b: Rect): boolean =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/**
 * ¿Corta el asta visible (origen–punta, recortada al área de dibujo) el interior de la caja? Recorte por franjas; tocar el
 * borde no cuenta.
 */
const crossesShaft = (tip: Point, r: Rect): boolean => {
  const reach = Math.max(Math.abs(tip[0] - CENTER), Math.abs(tip[1] - CENTER), 1e-9);
  const t = Math.min(1, (CENTER - MARGIN) / reach);
  const dx = (tip[0] - CENTER) * t;
  const dy = (tip[1] - CENTER) * t;
  if (Math.hypot(dx, dy) < 1e-6) return false;
  let t0 = 0;
  let t1 = 1;
  for (const [p, d, lo, hi] of [
    [CENTER, dx, r.x0, r.x1],
    [CENTER, dy, r.y0, r.y1],
  ] as const) {
    if (d === 0) {
      if (p <= lo || p >= hi) return false;
    } else {
      const a = (lo - p) / d;
      const b = (hi - p) / d;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    }
  }
  return t0 < t1;
};

const coversHandle = (centre: Point, r: Rect): boolean => {
  const nx = Math.max(r.x0, Math.min(r.x1, centre[0]));
  const ny = Math.max(r.y0, Math.min(r.y1, centre[1]));
  return Math.hypot(nx - centre[0], ny - centre[1]) < HANDLE_RING_RADIUS;
};

const RANGE = 6;
const SCALE = (CENTER - MARGIN) / RANGE;
const tipOf = (p: Point): Point => [CENTER + p[0] * SCALE, CENTER - p[1] * SCALE];

/** Lo que `VectorPlane` pide para u, v y u + v con dos asas: la suma al final, con 16 de hueco. */
const sceneFor = (u: Point, v: Point) => {
  const tips: Point[] = [tipOf(u), tipOf(v), tipOf([u[0] + v[0], u[1] + v[1]])];
  return {
    tips,
    scene: {
      labels: [
        { text: 'u', tip: tips[0], gap: 28 },
        { text: 'v', tip: tips[1], gap: 28 },
        { text: 'u + v', tip: tips[2], gap: 16 },
      ],
      arrowTips: tips,
      handles: [tips[0], tips[1]],
    },
  };
};

const TEXTS = ['u', 'v', 'u + v'];

interface Flaws {
  outside: boolean;
  onLabel: boolean;
  onShaft: boolean;
  onHandle: boolean;
}

const flawsOf = (tips: Point[], spots: Point[]): Flaws => {
  const rects = spots.map((s, i) => rectOf(TEXTS[i], s));
  const flaws: Flaws = { outside: false, onLabel: false, onShaft: false, onHandle: false };
  rects.forEach((r, i) => {
    if (r.x0 < 0 || r.x1 > VIEW || r.y0 < 0 || r.y1 > VIEW) flaws.outside = true;
    for (let j = i + 1; j < rects.length; j += 1) if (overlap(r, rects[j])) flaws.onLabel = true;
    if (tips.some((t) => crossesShaft(t, r))) flaws.onShaft = true;
    if (tips.slice(0, 2).some((t) => coversHandle(t, r))) flaws.onHandle = true;
  });
  return flaws;
};

/** Recorre toda la rejilla de u y v y cuenta las posiciones con cada defecto (y la primera de cada tipo). */
const sweep = (snap: number, sumInside: boolean) => {
  const steps = Math.round(RANGE / snap);
  const values = Array.from({ length: 2 * steps + 1 }, (_, i) => (i - steps) * snap);
  const bad = { outside: 0, onLabel: 0, onShaft: 0, onHandle: 0 };
  const firstBad: Record<string, string> = {};
  let evaluated = 0;
  for (const ux of values) {
    for (const uy of values) {
      for (const vx of values) {
        for (const vy of values) {
          const inside = Math.abs(ux + vx) <= RANGE && Math.abs(uy + vy) <= RANGE;
          if (inside !== sumInside) continue;
          evaluated += 1;
          const { tips, scene } = sceneFor([ux, uy], [vx, vy]);
          const flaws = flawsOf(tips, placeLabels(scene));
          for (const k of Object.keys(bad) as (keyof Flaws)[]) {
            if (flaws[k]) {
              bad[k] += 1;
              firstBad[k] ??= `u=(${ux}, ${uy}) v=(${vx}, ${vy})`;
            }
          }
        }
      }
    }
  }
  return { evaluated, bad, firstBad };
};

const CLEAN = { bad: { outside: 0, onLabel: 0, onShaft: 0, onHandle: 0 }, firstBad: {} };

describe('placeLabels: barrido de toda la rejilla', () => {
  // contract: arreglo 2, punto 1: con range 6 y snap 1, para cada posición de u y de v (13 x 13 cada uno) cuya suma queda dentro
  // de range, ninguna caja de etiqueta sale del SVG, ninguna corta a otra, ninguna corta el asta de una flecha (u, v o la suma)
  // ni cae sobre un asa. Posiciones con la suma dentro: por eje, los pares (a, b) de −6…6 con |a + b| <= 6 son 169 − 2·21 = 127;
  // 127 · 127 = 16129.
  it('snap 1, suma dentro de range: ninguna etiqueta sale, se pisa, corta un asta o tapa un asa', () => {
    const { evaluated, bad, firstBad } = sweep(1, true);
    expect(evaluated).toBe(16129);
    expect({ bad, firstBad }).toEqual(CLEAN);
  });

  // contract: arreglo 2, punto 1: mismo barrido con snap 0,5 (25 valores por eje): pares (a, b) de −6…6 con |a + b| <= 6 son
  // 625 − 2·(1 + 2 + … + 12) = 625 − 2·78 = 469 por eje; 469 · 469 = 219961 (la cifra medida por el revisor).
  it('snap 0,5, suma dentro de range: lo mismo', { timeout: 120_000 }, () => {
    const { evaluated, bad, firstBad } = sweep(0.5, true);
    expect(evaluated).toBe(219961);
    expect({ bad, firstBad }).toEqual(CLEAN);
  });

  // contract: arreglo 2, punto 1: con la suma fuera de range (28561 − 16129 = 12432 posiciones con snap 1) la flecha de la suma
  // queda recortada al área de dibujo y la etiqueta va junto a su extremo visible; las mismas cuatro condiciones valen.
  it('snap 1, suma fuera de range: lo mismo, con el asta recortada', () => {
    const { evaluated, bad, firstBad } = sweep(1, false);
    expect(evaluated).toBe(12432);
    expect({ bad, firstBad }).toEqual(CLEAN);
  });

  // contract: arreglo 2, punto 1: caso visto en el navegador: u = (3, 0), v = (0, 0). La suma cae sobre u y su etiqueta se
  // colocaba encima del asta de u («u-+-v»).
  it('u = (3, 0), v = (0, 0): la etiqueta de la suma no está sobre el asta', () => {
    const { tips, scene } = sceneFor([3, 0], [0, 0]);
    expect(flawsOf(tips, placeLabels(scene))).toEqual({
      outside: false,
      onLabel: false,
      onShaft: false,
      onHandle: false,
    });
  });
});

describe('placeLabels: sin sitio libre', () => {
  // contract: arreglo 2, punto 1: si ningún candidato queda libre, se elige el de menor penalización con un criterio determinista:
  // el resultado se repite y la etiqueta sigue dentro del SVG. Aquí 400 asas en rejilla cubren todo el SVG.
  it('elige un sitio dentro del SVG, siempre el mismo', () => {
    const handles: Point[] = [];
    for (let x = 6; x < VIEW; x += 24) for (let y = 6; y < VIEW; y += 24) handles.push([x, y]);
    const scene = {
      labels: [{ text: 'u', tip: [300, 200] as Point, gap: 28 }],
      arrowTips: [[300, 200] as Point],
      handles,
    };
    const first = placeLabels(scene);
    expect(placeLabels(scene)).toEqual(first);
    const r = rectOf('u', first[0]);
    expect([r.x0 >= 0, r.x1 <= VIEW, r.y0 >= 0, r.y1 <= VIEW]).toEqual([true, true, true, true]);
  });
});

/** Distancia del centro de cada etiqueta a su propia punta y a la punta ajena más cercana (puntas visibles; las coincidentes no cuentan). */
const nearness = (tips: Point[], spots: Point[]) => {
  const visible = (t: Point): Point => {
    const reach = Math.max(Math.abs(t[0] - CENTER), Math.abs(t[1] - CENTER), 1e-9);
    const k = Math.min(1, (CENTER - MARGIN) / reach);
    return [CENTER + (t[0] - CENTER) * k, CENTER + (t[1] - CENTER) * k];
  };
  const seen = tips.map(visible);
  return spots.map((s, i) => {
    const own = Math.hypot(s[0] - seen[i][0], s[1] - seen[i][1]);
    const foreign = seen
      .filter((t) => Math.hypot(t[0] - seen[i][0], t[1] - seen[i][1]) > 1)
      .map((t) => Math.hypot(s[0] - t[0], s[1] - t[1]));
    return { own, foreign: foreign.length ? Math.min(...foreign) : Infinity };
  });
};

describe('placeLabels: cada etiqueta junto a su propia punta (R45)', () => {
  // contract: R45 (task-18b-fixC.md): ninguna etiqueta queda más cerca de la punta de otro vector que de la suya si hay un sitio
  // que lo cumpla. Caso suma-escala.ex00.5 con la respuesta: range 6, gato (3, 4), perro (4, 3), c = (3,5; 3,5) (suma-escala.ts:127-136);
  // antes «c» quedaba a 26 de la punta de perro y a 51 de la suya (fila 12 de task-18b-report.md).
  for (const withHandle of [true, false]) {
    it(`suma-escala.ex00.5, c = (3,5; 3,5), ${withHandle ? 'con' : 'sin'} asa en c`, () => {
      const tips: Point[] = [tipOf([3, 4]), tipOf([4, 3]), tipOf([3.5, 3.5])];
      const texts = ['gato', 'perro', 'c'];
      const spots = placeLabels({
        labels: texts.map((text, i) => ({ text, tip: tips[i], gap: i === 2 && withHandle ? 28 : 14 })),
        arrowTips: tips,
        handles: withHandle ? [tips[2]] : [],
      });
      // contract: R45b (coordinador, ronda 2 del arreglo C): «propia» = distancia a su punta <= 0,7 x la distancia a la punta ajena
      // más cercana. Con asa en c el margen de c es imposible: la caja ha de quedar fuera del anillo del asa (13 de radio) y el
      // mejor punto del plano, aun sin contar astas, da 0,777 (barrido de 1 px medido con un guion aparte); ahí vale la regla R45 (< 1).
      const limits = [0.7, 0.7, withHandle ? 1 : 0.7];
      expect(nearness(tips, spots).map((n, i) => n.own < n.foreign && n.own <= limits[i] * n.foreign)).toEqual([true, true, true]);
      const rects = spots.map((s, i) => rectOf(texts[i], s));
      expect([overlap(rects[0], rects[1]), overlap(rects[0], rects[2]), overlap(rects[1], rects[2])]).toEqual([
        false,
        false,
        false,
      ]);
    });
  }

  // contract: R45: dos puntas muy juntas (a 17 unidades de vista, en horizontal, en vertical y en diagonal, en los cuatro
  // cuadrantes) también dejan cada etiqueta más cerca de su punta que de la ajena.
  it('dos puntas muy juntas, en los cuatro cuadrantes', () => {
    const bad: string[] = [];
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      for (const [dx, dy] of [[0.5, 0], [0, 0.5], [0.5, 0.5]]) {
        const tips: Point[] = [tipOf([sx * 2, sy * 2]), tipOf([sx * 2 + dx, sy * 2 + dy])];
        const spots = placeLabels({
          labels: [
            { text: 'u', tip: tips[0], gap: 14 },
            { text: 'v', tip: tips[1], gap: 14 },
          ],
          arrowTips: tips,
          handles: [],
        });
        if (nearness(tips, spots).some((n) => !(n.own < n.foreign))) bad.push(`${sx},${sy} +${dx},${dy}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
