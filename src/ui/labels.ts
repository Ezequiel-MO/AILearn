export type Point = [number, number];

// Geometría del plano en unidades de vista: el SVG es cuadrado (VIEW x VIEW) y se escala con el ancho disponible.
// El origen está en el centro; MARGIN deja sitio a los números de las marcas, fuera del área de dibujo.
export const VIEW = 480;
export const MARGIN = 36;
export const CENTER = VIEW / 2;
export const HANDLE_RADIUS = 7;
export const HANDLE_RING_RADIUS = HANDLE_RADIUS + 4;

// Etiquetas: texto en monoespaciada de 18 px (theme.css), 0,6 em por carácter (10,8 de ancho medido por carácter), con el trazo
// de 4 (2 a cada lado) que pinta el texto por fuera. La caja de fuente medida en el navegador (getBBox) mide 23,92 de alto:
// media altura 11,96, y con el trazo 13,96, que se redondea a 14.
export const LABEL_CHAR_WIDTH = 10.8;
export const LABEL_STROKE = 2;
export const LABEL_HALF_HEIGHT = 14;

// Holguras de lo que una etiqueta no puede tapar: el asta de una flecha (trazo de 3 y punta de 5 de semiancho) y el asa (anillo).
const SHAFT_CLEARANCE = 6;
const HANDLE_CLEARANCE = HANDLE_RING_RADIUS + 2;

// Dónde se prueba cada etiqueta alrededor de su punta: 16 giros respecto a la dirección de la flecha (primero junto a la punta,
// después a los lados y por detrás, después en diagonal) y, para cada giro, anillos de distancia creciente.
const LABEL_TURNS = [
  0, 1, -1, 2, 0.5, -0.5, 1.5, -1.5, 0.25, -0.25, 0.75, -0.75, 1.25, -1.25, 1.75, -1.75,
].map((q) => (q * Math.PI) / 2);
const LABEL_RINGS = [0, 10, 22, 36, 52, 72, 100, 140];

// Pesos de la penalización cuando ningún candidato queda libre: un píxel de asta o de asa tapado pesa lo que una franja de la
// etiqueta (su alto), un píxel cuadrado de solape con otra etiqueta o de salida del SVG pesa 1.
const LINE_WEIGHT = 2 * LABEL_HALF_HEIGHT;

// Dos puntas a menos de esta distancia (unidades de vista) se tratan como la misma: la suma que cae sobre un vector.
const COINCIDENT = 1;

// R45b: una posición es «propia» si la distancia a su punta es como mucho esta fracción de la distancia a la punta ajena más
// cercana. Con un margen escaso (73 px frente a 78 en el caso visto) la etiqueta se sigue leyendo como de la flecha de al lado.
export const OWN_RATIO = 0.7;

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface LabelRequest {
  text: string;
  tip: Point;
  /** Distancia base a la punta: más si la punta lleva un asa. */
  gap: number;
}

/** Todo lo que se dibuja y una etiqueta no debe tapar, en unidades de vista. */
export interface LabelScene {
  /** Etiquetas por orden de prioridad: la primera elige sitio antes. */
  labels: LabelRequest[];
  /** Puntas de las flechas dibujadas desde el origen (vectores y suma); el asta se recorta al área de dibujo. */
  arrowTips: Point[];
  /** Centros de las asas dibujadas. */
  handles: Point[];
}

type Segment = [Point, Point];

const overlapArea = (a: Box, b: Box): number =>
  Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) *
  Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

const dirOf = (tip: Point): Point => {
  const dx = tip[0] - CENTER;
  const dy = tip[1] - CENTER;
  const length = Math.hypot(dx, dy);
  return length < 1e-6 ? [0, -1] : [dx / length, dy / length];
};

/** Tramo del asta (origen–punta) que se ve: la flecha se recorta al área de dibujo. null si no hay asta. */
const visibleShaft = (tip: Point): Segment | null => {
  const dx = tip[0] - CENTER;
  const dy = tip[1] - CENTER;
  const reach = Math.max(Math.abs(dx), Math.abs(dy));
  if (Math.hypot(dx, dy) < 1e-6) return null;
  const t = Math.min(1, (CENTER - MARGIN) / reach);
  return [
    [CENTER, CENTER],
    [CENTER + dx * t, CENTER + dy * t],
  ];
};

/** Longitud del segmento que cae dentro de la caja ensanchada en `pad` (recorte por franjas). */
const lengthInside = ([a, b]: Segment, box: Box, pad: number): number => {
  const d = [b[0] - a[0], b[1] - a[1]];
  let t0 = 0;
  let t1 = 1;
  const slabs = [
    [a[0], d[0], box.x0 - pad, box.x1 + pad],
    [a[1], d[1], box.y0 - pad, box.y1 + pad],
  ] as const;
  for (const [p, delta, lo, hi] of slabs) {
    if (delta === 0) {
      if (p <= lo || p >= hi) return 0;
    } else {
      const s = (lo - p) / delta;
      const e = (hi - p) / delta;
      t0 = Math.max(t0, Math.min(s, e));
      t1 = Math.min(t1, Math.max(s, e));
    }
  }
  return t1 > t0 ? (t1 - t0) * Math.hypot(d[0], d[1]) : 0;
};

/** Cuánto entra el anillo del asa en la caja (0 si no la toca). */
const depthInto = (centre: Point, box: Box): number => {
  const nx = Math.max(box.x0, Math.min(box.x1, centre[0]));
  const ny = Math.max(box.y0, Math.min(box.y1, centre[1]));
  return Math.max(0, HANDLE_CLEARANCE - Math.hypot(nx - centre[0], ny - centre[1]));
};

/**
 * Sitio de cada etiqueta (centro del texto) junto a la punta de su flecha. Un candidato vale si su caja (a) cabe en el SVG,
 * (b) no corta una etiqueta ya colocada, (c) no corta el asta de ninguna flecha dibujada y (d) no cae sobre ningún asa. Se
 * prueban 16 giros por 8 anillos de distancia, de cerca a lejos; si ninguno queda libre se elige el de menor penalización
 * (a igualdad, el primero), de modo que el resultado es determinista. Además (R45) se prefiere el candidato más cerca de la
 * punta propia que de cualquier otra: ver los rangos más abajo.
 */
export const placeLabels = (scene: LabelScene): Point[] => {
  const shafts = scene.arrowTips.map(visibleShaft).filter((s): s is Segment => s !== null);
  const visibleTips = scene.arrowTips.map((t) => visibleShaft(t)?.[1] ?? t);
  const placed: Box[] = [];
  return scene.labels.map(({ text, tip: farTip, gap }) => {
    const dir = dirOf(farTip);
    // una punta fuera del área de dibujo no se ve: la etiqueta va junto al extremo visible de la flecha
    const tip = visibleShaft(farTip)?.[1] ?? farTip;
    const halfW = (text.length * LABEL_CHAR_WIDTH) / 2 + LABEL_STROKE;
    const boxAt = ([x, y]: Point): Box => ({
      x0: x - halfW,
      x1: x + halfW,
      y0: y - LABEL_HALF_HEIGHT,
      y1: y + LABEL_HALF_HEIGHT,
    });
    // el candidato se aprieta contra el borde: así cabe siempre y queda lo más cerca posible de la punta
    const squeeze = ([x, y]: Point): Point => [
      Math.max(halfW, Math.min(VIEW - halfW, x)),
      Math.max(LABEL_HALF_HEIGHT, Math.min(VIEW - LABEL_HALF_HEIGHT, y)),
    ];
    const cost = (box: Box): number => {
      let total = 0;
      for (const p of placed) total += overlapArea(p, box);
      for (const s of shafts) total += LINE_WEIGHT * lengthInside(s, box, SHAFT_CLEARANCE);
      for (const h of scene.handles) total += LINE_WEIGHT * depthInto(h, box);
      return total;
    };

    // puntas de los demás vectores (visibles); una punta que coincide con la propia no es ajena: no hay nada que distinguir
    const foreign = visibleTips.filter(
      (t) => Math.hypot(t[0] - tip[0], t[1] - tip[1]) > COINCIDENT,
    );
    const nearestForeign = ([x, y]: Point): number =>
      foreign.reduce((m, t) => Math.min(m, Math.hypot(x - t[0], y - t[1])), Infinity);

    // R45b: un candidato es propio si su distancia a la punta es <= OWN_RATIO x la de la punta ajena más cercana. Rangos, del mejor
    // al peor: (0) propio y libre (el primero); (1) libre y no propio, el de menor cociente propia/ajena; (2) propio con
    // penalización, el de menor penalización; (3) ni libre ni propio, el de menor cociente y, a igualdad, el de menor
    // penalización. Los libres van antes que los propios con penalización: que una etiqueta no pise otra, un asta o un asa
    // sigue mandando. Dentro de un rango, a igualdad gana el primero, de modo que el resultado es determinista.
    let best: Point = squeeze(tip);
    let bestRank = Infinity;
    let bestCost = Infinity;
    let bestRatio = Infinity;
    search: for (const ring of LABEL_RINGS) {
      for (const turn of LABEL_TURNS) {
        const dx = dir[0] * Math.cos(turn) - dir[1] * Math.sin(turn);
        const dy = dir[0] * Math.sin(turn) + dir[1] * Math.cos(turn);
        // la distancia crece con lo que el texto se extiende en esa dirección, para que no pise la punta
        const reach = gap - 8 + ring + Math.abs(dx) * halfW + Math.abs(dy) * LABEL_HALF_HEIGHT;
        const c = squeeze([tip[0] + dx * reach, tip[1] + dy * reach]);
        const ratio = Math.hypot(c[0] - tip[0], c[1] - tip[1]) / nearestForeign(c);
        const own = ratio <= OWN_RATIO;
        const value = cost(boxAt(c));
        const rank = value === 0 ? (own ? 0 : 1) : own ? 2 : 3;
        if (rank > bestRank) continue;
        const better =
          rank < bestRank ||
          (rank === 2 && value < bestCost) ||
          ((rank === 1 || rank === 3) &&
            (ratio < bestRatio || (ratio === bestRatio && value < bestCost)));
        if (better) {
          best = c;
          bestRank = rank;
          bestCost = value;
          bestRatio = ratio;
          if (rank === 0) break search;
        }
      }
    }
    placed.push(boxAt(best));
    return best;
  });
};
