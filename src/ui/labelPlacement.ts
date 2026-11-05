// Colocación de rótulos del plano de curvas: puro, sin DOM. Estima la caja de cada
// rótulo por su texto y su tamaño de letra (tipografía monoespaciada) y elige el
// primer sitio candidato que cabe en el área y no pisa otros rótulos ni puntos.

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export type Anchor = 'start' | 'middle' | 'end';

export interface Placed {
  x: number;
  y: number;
  textAnchor: Anchor;
  box: Box;
}

export type Side = 'left' | 'right';

/** Ancho relativo de un carácter de la tipografía monoespaciada. */
const CHAR_W = 0.6;
const DESCENT = 0.2;
const MARGIN = 2;
/** Separación entre el centro del punto y la esquina más cercana del rótulo. */
const GAP = 12;
/** Radio que ocupa un punto (con su aro) como obstáculo. */
export const DOT_CLEARANCE = 10;

export const dotBox = (c: readonly [number, number], r = DOT_CLEARANCE): Box => ({
  x0: c[0] - r,
  y0: c[1] - r,
  x1: c[0] + r,
  y1: c[1] + r,
});

export const boxesOverlap = (a: Box, b: Box, margin = MARGIN): boolean =>
  a.x0 < b.x1 + margin && b.x0 < a.x1 + margin && a.y0 < b.y1 + margin && b.y0 < a.y1 + margin;

const inside = (b: Box, area: Box): boolean =>
  b.x0 >= area.x0 && b.x1 <= area.x1 && b.y0 >= area.y0 && b.y1 <= area.y1;

const textSize = (text: string, size: number): [number, number] => [
  [...text].length * CHAR_W * size,
  size,
];

const fromBox = (box: Box, size: number, anchor: Anchor): Placed => {
  const x = anchor === 'start' ? box.x0 : anchor === 'end' ? box.x1 : (box.x0 + box.x1) / 2;
  return { x, y: box.y1 - DESCENT * size, textAnchor: anchor, box };
};

const around = (w: number, h: number, c: readonly [number, number], spot: string): Box => {
  const [cx, cy] = c;
  switch (spot) {
    case 'NE':
      return { x0: cx + GAP, x1: cx + GAP + w, y1: cy - GAP + 2, y0: cy - GAP + 2 - h };
    case 'NW':
      return { x1: cx - GAP, x0: cx - GAP - w, y1: cy - GAP + 2, y0: cy - GAP + 2 - h };
    case 'SE':
      return { x0: cx + GAP, x1: cx + GAP + w, y0: cy + GAP - 2, y1: cy + GAP - 2 + h };
    case 'SW':
      return { x1: cx - GAP, x0: cx - GAP - w, y0: cy + GAP - 2, y1: cy + GAP - 2 + h };
    case 'N':
      return { x0: cx - w / 2, x1: cx + w / 2, y1: cy - GAP - 2, y0: cy - GAP - 2 - h };
    case 'S':
      return { x0: cx - w / 2, x1: cx + w / 2, y0: cy + GAP + 2, y1: cy + GAP + 2 + h };
    case 'E':
      return { x0: cx + GAP + 2, x1: cx + GAP + 2 + w, y0: cy - h / 2, y1: cy + h / 2 };
    default:
      return { x1: cx - GAP - 2, x0: cx - GAP - 2 - w, y0: cy - h / 2, y1: cy + h / 2 };
  }
};

const ORDER: Record<Side, string[]> = {
  right: ['NE', 'SE', 'NW', 'SW', 'N', 'S', 'E', 'W'],
  left: ['NW', 'SW', 'NE', 'SE', 'N', 'S', 'W', 'E'],
};

const ANCHOR_OF: Record<string, Anchor> = {
  NE: 'start',
  SE: 'start',
  E: 'start',
  NW: 'end',
  SW: 'end',
  W: 'end',
  N: 'middle',
  S: 'middle',
};

const overlapArea = (a: Box, b: Box): number =>
  Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) *
  Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

/** Elige entre candidatos el primero que cabe y no choca; si ninguno, el que menos pisa. */
const pickFirst = (cands: Placed[], area: Box, obstacles: readonly Box[]): Placed => {
  let best = cands[0];
  let bestScore = Infinity;
  for (const c of cands) {
    const hits = obstacles.filter((o) => boxesOverlap(c.box, o));
    const fits = inside(c.box, area);
    if (fits && hits.length === 0) return c;
    const score = hits.reduce((s, o) => s + overlapArea(c.box, o) + 1, 0) + (fits ? 0 : 1e6);
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
};

/** Rótulo de un punto: ocho sitios a su alrededor; `side` marca de qué lado prefiere estar. */
export function placePointLabel(
  text: string,
  size: number,
  center: readonly [number, number],
  area: Box,
  obstacles: readonly Box[],
  side: Side = 'right',
): Placed {
  const [w, h] = textSize(text, size);
  const cands = ORDER[side].map((spot) =>
    fromBox(around(w, h, center, spot), size, ANCHOR_OF[spot]),
  );
  return pickFirst(cands, area, obstacles);
}

/** Rótulo del paso: encima o debajo de la flecha, o a un lado de su punto medio. */
export function placeStepLabel(
  text: string,
  size: number,
  from: readonly [number, number],
  to: readonly [number, number],
  area: Box,
  obstacles: readonly Box[],
): Placed {
  const [w, h] = textSize(text, size);
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const top = Math.min(from[1], to[1]);
  const bottom = Math.max(from[1], to[1]);
  const left = Math.min(from[0], to[0]);
  const right = Math.max(from[0], to[0]);
  const above = (cx: number): Box => ({
    x0: cx - w / 2,
    x1: cx + w / 2,
    y1: top - 8,
    y0: top - 8 - h,
  });
  const below = (cx: number): Box => ({
    x0: cx - w / 2,
    x1: cx + w / 2,
    y0: bottom + 8,
    y1: bottom + 8 + h,
  });
  const boxes: [Box, Anchor][] = [
    [above(mx), 'middle'],
    [below(mx), 'middle'],
    [above(mx - w / 2), 'middle'],
    [above(mx + w / 2), 'middle'],
    [below(mx - w / 2), 'middle'],
    [below(mx + w / 2), 'middle'],
    [{ x0: right + 16, x1: right + 16 + w, y0: my - h / 2, y1: my + h / 2 }, 'start'],
    [{ x1: left - 16, x0: left - 16 - w, y0: my - h / 2, y1: my + h / 2 }, 'end'],
  ];
  return pickFirst(
    boxes.map(([b, a]) => fromBox(b, size, a)),
    area,
    obstacles,
  );
}
