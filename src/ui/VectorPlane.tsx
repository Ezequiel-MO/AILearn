import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import type { PlaneSpec } from '../content/schema';
import { applyColumns, det2, measure, projection } from '../engine/vectors';
import type { Vec } from '../engine/vectors';
import { fmt, fmtPair } from './format';
import { CENTER, HANDLE_RADIUS, HANDLE_RING_RADIUS, MARGIN, VIEW, placeLabels } from './labels';
import type { Point } from './labels';
import { t } from './strings';

const HEAD_LENGTH = 12;
const HEAD_HALF_WIDTH = 5;
const HANDLE_HIT_RADIUS = 26;
const SLOTS = 4;
const MAX_TICKS = 12;
const MAX_GRID_LINES = 60;
const EPS = 1e-9;
/** Radio del arco del ángulo, en unidades de vista; se encoge si un vector es corto. Debajo de ARC_MIN no se dibuja. */
const ARC_RADIUS = 34;
const ARC_MIN = 10;
/** Una proyección más corta que esto (unidades de vista) no se dibuja: la sombra es un punto. */
const SHADOW_MIN = 1;
/** Líneas de la rejilla transformada, a cada lado del origen, como máximo por familia (x = k, y = k). */
const MAX_IMAGE_LINES = 30;
/** Puntos con los que se muestrea la circunferencia para dibujar su imagen (la elipse). */
const ELLIPSE_POINTS = 96;

const clean = (n: number): number => Number(n.toFixed(6));

/** Ajusta a la rejilla y limita a ±range sin salir de la rejilla (si range no es múltiplo de snap). */
const snapTo = (value: number, snap: number, range: number): number => {
  const maxIndex = Math.floor(range / snap + EPS);
  const index = Math.max(-maxIndex, Math.min(maxIndex, Math.round(value / snap)));
  return clean(index * snap + 0) + 0; // + 0 evita -0
};

/** Primer múltiplo de snap (1, 2, 5, 10…) con el que caben a lo sumo `max` divisiones. */
const coarsen = (range: number, snap: number, max: number): number => {
  for (const m of [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]) {
    if ((2 * range) / (snap * m) <= max) return clean(snap * m);
  }
  return clean(snap * 1000);
};

const multiples = (step: number, range: number): number[] => {
  const n = Math.floor(range / step + EPS);
  const out: number[] = [];
  for (let i = -n; i <= n; i += 1) out.push(clean(i * step) + 0);
  return out;
};

const pointText = (x: number, y: number): string => fmtPair([x, y]);

interface Arrow {
  lineEnd: Point;
  head: string;
  dir: Point;
  length: number;
}

const arrow = (tip: Point): Arrow => {
  const [tx, ty] = tip;
  const dx = tx - CENTER;
  const dy = ty - CENTER;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) return { lineEnd: tip, head: '', dir: [0, -1], length: 0 };
  const ux = dx / length;
  const uy = dy / length;
  const head = Math.min(HEAD_LENGTH, length);
  const bx = tx - ux * head;
  const by = ty - uy * head;
  const half = HEAD_HALF_WIDTH * (head / HEAD_LENGTH);
  const points = [tip, [bx - uy * half, by + ux * half], [bx + uy * half, by - ux * half]];
  return {
    lineEnd: [bx + ux * 1, by + uy * 1],
    head: points.map((p) => p.join(',')).join(' '),
    dir: [ux, uy],
    length,
  };
};

const STEP_KEYS: Record<string, Point> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

/**
 * Plano de vectores en SVG. Controlado desde fuera: `positions` manda; el plano pide cambios con `onMove`.
 * Sin `onMove` es una figura estática (sin asas). Las lecturas se calculan con src/engine/vectors.
 */
export function VectorPlane({
  spec,
  positions,
  onMove,
}: {
  spec: PlaneSpec;
  positions: Record<string, [number, number]>;
  onMove?: (id: string, to: [number, number]) => void;
}) {
  const { range, snap, vectors, readouts, pair, circle, circleImage, transform } = spec;
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; pointerId: number; offset: Point } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const clipId = `plane-clip-${useId().replace(/:/g, '')}`;

  const scale = (CENTER - MARGIN) / range;
  const sx = (x: number): number => CENTER + x * scale;
  const sy = (y: number): number => CENTER - y * scale;
  const edge = CENTER - MARGIN;

  const posOf = (id: string, fallback: Point): Point =>
    Object.hasOwn(positions, id) ? positions[id] : fallback;
  const current: Record<string, Point> = {};
  for (const v of vectors) current[v.id] = posOf(v.id, [v.x, v.y]);
  const asVecs: Record<string, Vec> = current;
  const nameOf = (id: string): string => vectors.find((v) => v.id === id)?.label ?? id;

  const interactive = onMove !== undefined;
  const slotOf = (id: string): number => vectors.findIndex((v) => v.id === id) % SLOTS;

  // --- Arrastre y teclado ---
  const toPlane = (clientX: number, clientY: number): Point | null => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    const vx = ((clientX - rect.left) / rect.width) * VIEW;
    const vy = ((clientY - rect.top) / rect.height) * VIEW;
    return [(vx - CENTER) / scale, (CENTER - vy) / scale];
  };

  const emit = (id: string, x: number, y: number) => {
    const to: Point = [snapTo(x, snap, range), snapTo(y, snap, range)];
    const at = current[id];
    if (to[0] === at[0] && to[1] === at[1]) return;
    onMove?.(id, to);
  };

  const onPointerDown = (id: string, e: PointerEvent<SVGGElement>) => {
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault();
    e.currentTarget.focus();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = toPlane(e.clientX, e.clientY);
    const at = current[id];
    drag.current = {
      id,
      pointerId: e.pointerId,
      offset: p ? [p[0] - at[0], p[1] - at[1]] : [0, 0],
    };
    setDraggingId(id);
  };

  const onPointerMove = (id: string, e: PointerEvent<SVGGElement>) => {
    const d = drag.current;
    if (!d || d.id !== id || d.pointerId !== e.pointerId) return;
    const p = toPlane(e.clientX, e.clientY);
    if (p) emit(id, p[0] - d.offset[0], p[1] - d.offset[1]);
  };

  const endDrag = (id: string, e: PointerEvent<SVGGElement>) => {
    if (drag.current?.id !== id) return;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    drag.current = null;
    setDraggingId(null);
  };

  const onKeyDown = (id: string, e: KeyboardEvent<SVGGElement>) => {
    const dir = STEP_KEYS[e.key];
    if (!dir) return;
    e.preventDefault();
    const at = current[id];
    emit(id, at[0] + dir[0] * snap, at[1] + dir[1] * snap);
  };

  // --- Geometría de lo que se dibuja ---
  const gridStep = coarsen(range, snap, MAX_GRID_LINES);
  const tickStep = coarsen(range, snap, MAX_TICKS);
  const gridValues = multiples(gridStep, range);
  const tickValues = multiples(tickStep, range);
  const tipOf = (id: string): Point => [sx(current[id][0]), sy(current[id][1])];

  const wantsSum = readouts.includes('sum') && pair !== undefined;
  const wantsDistance = readouts.includes('distance') && pair !== undefined;
  const sumPoint: Point | null =
    wantsSum && pair
      ? [current[pair[0]][0] + current[pair[1]][0], current[pair[0]][1] + current[pair[1]][1]]
      : null;
  const sumTip: Point | null = sumPoint ? [sx(sumPoint[0]), sy(sumPoint[1])] : null;
  const sumArrow = sumTip ? arrow(sumTip) : null;

  // --- Ángulo y proyección del par: se calculan con el motor; la interfaz solo las coloca ---
  const angleDeg = pair ? measure('angle', [pair[0], pair[1]], asVecs) : NaN;
  const wantsArc = readouts.includes('angle') || readouts.includes('cos');
  let arcPath: string | null = null;
  // 0° no tiene arco que ver; a 180° es media circunferencia (el lado del sweep es indiferente)
  if (pair && wantsArc && Number.isFinite(angleDeg) && angleDeg > 0.5) {
    const a = arrow(tipOf(pair[0]));
    const b = arrow(tipOf(pair[1]));
    const r = Math.min(ARC_RADIUS, 0.7 * Math.min(a.length, b.length));
    if (r >= ARC_MIN) {
      const at = (d: Point): string => `${CENTER + d[0] * r} ${CENTER + d[1] * r}`;
      const pa = current[pair[0]];
      const pb = current[pair[1]];
      // la y de pantalla crece hacia abajo: de a a b en sentido antihorario del plano es sweep 0
      const sweep = pa[0] * pb[1] - pa[1] * pb[0] > 0 ? 0 : 1;
      arcPath = `M ${at(a.dir)} A ${r} ${r} 0 0 ${sweep} ${at(b.dir)}`;
    }
  }

  const shadowVec =
    pair && readouts.includes('projection') ? projection(current[pair[0]], current[pair[1]]) : null;
  const shadowTip: Point | null = shadowVec ? [sx(shadowVec[0]), sy(shadowVec[1])] : null;
  const shadowArrow = shadowTip ? arrow(shadowTip) : null;
  const shadowShown = shadowArrow !== null && shadowArrow.length >= SHADOW_MIN;
  // la recta de b, de lado a lado: ayuda a ver sobre qué se proyecta (solo con b no nulo)
  const bDir = shadowVec && pair ? arrow(tipOf(pair[1])).dir : null;
  const bLine: [Point, Point] | null = bDir
    ? [
        [CENTER - bDir[0] * 4 * VIEW, CENTER - bDir[1] * 4 * VIEW],
        [CENTER + bDir[0] * 4 * VIEW, CENTER + bDir[1] * 4 * VIEW],
      ]
    : null;

  // --- Transformación lineal: A tiene por columnas las posiciones actuales de las dos columnas ---
  const colI: Point | null = transform ? current[transform.columns[0]] : null;
  const colJ: Point | null = transform ? current[transform.columns[1]] : null;
  const detA = colI && colJ ? det2(colI, colJ) : NaN;
  const flipped = detA < -EPS;
  const imageTip = (p: Point): Point => [sx(p[0]), sy(p[1])];
  const imageLines: { key: string; axis: boolean; a: Point; b: Point }[] = [];
  let imageSquare: string | null = null;
  let ellipse: string | null = null;
  const images: { id: string; vec: Point; tip: Point; arrow: Arrow }[] = [];
  if (transform && colI && colJ) {
    const lenI = Math.hypot(colI[0], colI[1]);
    const lenJ = Math.hypot(colJ[0], colJ[1]);
    const spacing = coarsen(range, 1, MAX_GRID_LINES);
    // cuántas líneas hacen falta para que la rejilla deformada siga llenando la vista: la separación
    // entre las líneas de una familia es |det|/|otra columna|; con det ≈ 0 las líneas se apilan y basta el tope
    const reach = (other: number): number => {
      const needed =
        Math.abs(detA) < EPS ? Infinity : (range * Math.SQRT2 * other) / Math.abs(detA);
      return Math.min(MAX_IMAGE_LINES * spacing, Math.max(range, Math.ceil(needed)));
    };
    const family = (
      prefix: string,
      base: Point,
      dir: Point,
      dirLen: number,
      reachFor: number,
    ): void => {
      if (dirLen < EPS) return; // la dirección es nula: la imagen de cada línea es un punto
      const [dx, dy] = [dir[0] / dirLen, -dir[1] / dirLen]; // unitario en pantalla (y hacia abajo)
      const origin = imageTip([0, 0]);
      for (const k of multiples(spacing, reachFor)) {
        const p = imageTip([base[0] * k, base[1] * k]);
        // el segmento se centra en el punto de la línea más cercano al origen: con columnas casi
        // paralelas, k·base queda lejos y un segmento centrado ahí no llegaría a la vista
        const t = (p[0] - origin[0]) * dx + (p[1] - origin[1]) * dy;
        const o: Point = [p[0] - dx * t, p[1] - dy * t];
        imageLines.push({
          key: `${prefix}${k}`,
          axis: k === 0,
          a: [o[0] - dx * 4 * VIEW, o[1] - dy * 4 * VIEW],
          b: [o[0] + dx * 4 * VIEW, o[1] + dy * 4 * VIEW],
        });
      }
    };
    // x = k se transforma en k·î + t·ĵ; y = k se transforma en k·ĵ + t·î
    family('x', colI, colJ, lenJ, reach(lenJ));
    family('y', colJ, colI, lenI, reach(lenI));
    const corners: Point[] = [[0, 0], colI, [colI[0] + colJ[0], colI[1] + colJ[1]], colJ];
    imageSquare = corners.map((c) => imageTip(c).join(',')).join(' ');
    if (circleImage && circle !== undefined) {
      // la imagen de la circunferencia de radio `circle`; con A singular se queda en un segmento
      ellipse = Array.from({ length: ELLIPSE_POINTS }, (_, n) => {
        const a = (2 * Math.PI * n) / ELLIPSE_POINTS;
        const q = applyColumns(colI, colJ, [circle * Math.cos(a), circle * Math.sin(a)]);
        return imageTip(q).join(',');
      }).join(' ');
    }
    for (const id of transform.apply ?? []) {
      const vec = applyColumns(colI, colJ, current[id]);
      const tip = imageTip(vec);
      images.push({ id, vec, tip, arrow: arrow(tip) });
    }
  }

  // --- Lecturas, con las funciones del motor ---
  const rows: { key: string; name: string; value: ReactNode; matrix?: boolean }[] = [];
  for (const kind of readouts) {
    if (kind === 'components') {
      for (const v of vectors) {
        rows.push({
          key: `c-${v.id}`,
          name: v.label,
          value: pointText(measure('x', [v.id], asVecs), measure('y', [v.id], asVecs)),
        });
      }
    } else if (kind === 'norm') {
      for (const v of vectors) {
        rows.push({
          key: `n-${v.id}`,
          name: `‖${v.label}‖`,
          value: fmt(measure('norm', [v.id], asVecs)),
        });
      }
    } else if (kind === 'matrix') {
      if (colI && colJ) {
        // A por filas: la fila 1 es (î.x, ĵ.x) y la fila 2 es (î.y, ĵ.y)
        const cells = [colI[0], colJ[0], colI[1], colJ[1]];
        rows.push({
          key: 'matrix',
          name: t.plane.matrixName,
          matrix: true,
          value: cells.map((c, n) => (
            <span key={n} className="plane__matrix-cell">
              {fmt(c)}
            </span>
          )),
        });
      }
    } else if (kind === 'det') {
      rows.push({ key: 'det', name: t.plane.detName, value: fmt(detA) });
    } else if (kind === 'image' || kind === 'img_angle' || kind === 'rayleigh') {
      // una fila por cada vector de transform.apply, en su orden; el esquema exige transform y apply
      if (transform) {
        for (const id of transform.apply ?? []) {
          const of = [transform.columns[0], transform.columns[1], id];
          const label = nameOf(id);
          if (kind === 'image') {
            rows.push({
              key: `image-${id}`,
              name: t.plane.imageName(label),
              value: pointText(measure('img_x', of, asVecs), measure('img_y', of, asVecs)),
            });
          } else if (kind === 'img_angle') {
            const value = measure('img_angle', of, asVecs);
            rows.push({
              key: `img-angle-${id}`,
              name: t.plane.imgAngleName(label),
              value: Number.isNaN(value) ? t.plane.noAngle : `${fmt(value)}°`,
            });
          } else {
            const value = measure('rayleigh', of, asVecs);
            rows.push({
              key: `rayleigh-${id}`,
              name: t.plane.rayleighName(label),
              value: Number.isNaN(value) ? t.plane.noRayleigh : fmt(value),
            });
          }
        }
      }
    } else if (pair) {
      const [a, b] = pair;
      if (kind === 'distance') {
        rows.push({
          key: 'd',
          name: `d(${nameOf(a)}, ${nameOf(b)})`,
          value: fmt(measure('distance', [a, b], asVecs)),
        });
      } else if (kind === 'dot') {
        rows.push({
          key: 'dot',
          name: t.plane.dotName(nameOf(a), nameOf(b)),
          value: fmt(measure('dot', [a, b], asVecs)),
        });
      } else if (kind === 'cos') {
        const value = measure('cos', [a, b], asVecs);
        rows.push({
          key: 'cos',
          name: t.plane.cosName(nameOf(a), nameOf(b)),
          value: Number.isNaN(value) ? t.plane.noAngle : fmt(value),
        });
      } else if (kind === 'angle') {
        rows.push({
          key: 'angle',
          name: t.plane.angleName(nameOf(a), nameOf(b)),
          value: Number.isNaN(angleDeg) ? t.plane.noAngle : `${fmt(angleDeg)}°`,
        });
      } else if (kind === 'projection') {
        const value = measure('proj', [a, b], asVecs);
        rows.push({
          key: 'proj',
          name: t.plane.projectionName(nameOf(a), nameOf(b)),
          value: Number.isNaN(value) ? t.plane.noProjection : fmt(value),
        });
      } else {
        rows.push({
          key: 's',
          name: `${nameOf(a)} + ${nameOf(b)}`,
          value: pointText(measure('sum_x', [a, b], asVecs), measure('sum_y', [a, b], asVecs)),
        });
      }
    }
  }

  // --- Etiquetas: sitio junto a la punta, sin tapar etiquetas, astas ni asas ---
  const movableHandles = interactive ? vectors.filter((v) => v.movable) : [];
  const sumText = wantsSum && pair ? `${nameOf(pair[0])} + ${nameOf(pair[1])}` : '';
  const labelRequests = [
    ...vectors.map((v) => ({
      key: v.id,
      text: v.label,
      tip: tipOf(v.id),
      gap: interactive && v.movable ? HANDLE_HIT_RADIUS + 2 : 14,
      isSum: false,
      slotId: v.id,
    })),
    ...(sumTip
      ? [{ key: 'sum', text: sumText, tip: sumTip, gap: 16, isSum: true, slotId: '' }]
      : []),
    ...images.map((im) => ({
      key: `img-${im.id}`,
      text: t.plane.imageName(nameOf(im.id)),
      tip: im.tip,
      gap: 14,
      isSum: false,
      slotId: im.id,
    })),
  ];
  const labelAt = placeLabels({
    labels: labelRequests,
    arrowTips: [
      ...vectors.map((v) => tipOf(v.id)),
      ...(sumTip ? [sumTip] : []),
      ...images.map((im) => im.tip),
      ...(shadowShown && shadowTip ? [shadowTip] : []),
    ],
    handles: movableHandles.map((v) => tipOf(v.id)),
  });
  const labelSpots = labelRequests.map((l, i) => ({ ...l, at: labelAt[i] }));

  return (
    <div className="plane">
      <div className="plane__figure">
        <svg
          ref={svgRef}
          className={`plane__svg${interactive ? ' plane__svg--interactive' : ''}`}
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          // con asas, los hijos de role="img" serían de presentación: se declara un grupo
          role={interactive ? 'group' : 'img'}
          aria-label={t.plane.figure}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={CENTER - edge} y={CENTER - edge} width={2 * edge} height={2 * edge} />
            </clipPath>
          </defs>

          <rect
            className="plane__area"
            x={CENTER - edge}
            y={CENTER - edge}
            width={2 * edge}
            height={2 * edge}
          />

          <g className="plane__grid">
            {gridValues.map((v) => (
              <g key={v}>
                <line x1={sx(v)} y1={CENTER - edge} x2={sx(v)} y2={CENTER + edge} />
                <line x1={CENTER - edge} y1={sy(v)} x2={CENTER + edge} y2={sy(v)} />
              </g>
            ))}
          </g>

          <g className="plane__axes">
            <line x1={CENTER - edge} y1={CENTER} x2={CENTER + edge} y2={CENTER} />
            <line x1={CENTER} y1={CENTER - edge} x2={CENTER} y2={CENTER + edge} />
          </g>

          <g className="plane__ticks" aria-hidden="true">
            {tickValues.map((v) => (
              <g key={v}>
                <line
                  className="plane__tick"
                  x1={sx(v)}
                  y1={CENTER + edge}
                  x2={sx(v)}
                  y2={CENTER + edge + 4}
                />
                <text
                  className="plane__tick-label"
                  x={sx(v)}
                  y={CENTER + edge + 18}
                  textAnchor="middle"
                >
                  {fmt(v)}
                </text>
                {v !== 0 && (
                  <>
                    <line
                      className="plane__tick"
                      x1={CENTER - edge - 4}
                      y1={sy(v)}
                      x2={CENTER - edge}
                      y2={sy(v)}
                    />
                    <text
                      className="plane__tick-label"
                      x={CENTER - edge - 8}
                      y={sy(v)}
                      textAnchor="end"
                      dominantBaseline="central"
                    >
                      {fmt(v)}
                    </text>
                  </>
                )}
              </g>
            ))}
            <text
              className="plane__axis-name"
              x={CENTER + edge - 4}
              y={CENTER - 8}
              textAnchor="end"
            >
              {t.plane.xAxis}
            </text>
            <text className="plane__axis-name" x={CENTER + 8} y={CENTER - edge + 12}>
              {t.plane.yAxis}
            </text>
          </g>

          <g clipPath={`url(#${clipId})`}>
            {transform && imageSquare && (
              <g className="plane__image-grid" aria-hidden="true">
                {imageLines.map((l) => (
                  <line
                    key={l.key}
                    className={l.axis ? 'plane__image-axis' : undefined}
                    x1={l.a[0]}
                    y1={l.a[1]}
                    x2={l.b[0]}
                    y2={l.b[1]}
                  />
                ))}
                <polygon
                  className={`plane__image-square${flipped ? ' plane__image-square--flipped' : ''}`}
                  points={imageSquare}
                />
              </g>
            )}
            {circle !== undefined && (
              <circle
                className="plane__circle"
                aria-hidden="true"
                cx={CENTER}
                cy={CENTER}
                r={circle * scale}
              />
            )}
            {ellipse && (
              <polygon className="plane__circle-image" aria-hidden="true" points={ellipse} />
            )}
            {bLine && (
              <line
                className="plane__b-line"
                aria-hidden="true"
                x1={bLine[0][0]}
                y1={bLine[0][1]}
                x2={bLine[1][0]}
                y2={bLine[1][1]}
              />
            )}
            {wantsSum && pair && sumTip && (
              <g className="plane__parallelogram">
                <line x1={tipOf(pair[0])[0]} y1={tipOf(pair[0])[1]} x2={sumTip[0]} y2={sumTip[1]} />
                <line x1={tipOf(pair[1])[0]} y1={tipOf(pair[1])[1]} x2={sumTip[0]} y2={sumTip[1]} />
              </g>
            )}
            {wantsDistance && pair && (
              <line
                className="plane__distance"
                x1={tipOf(pair[0])[0]}
                y1={tipOf(pair[0])[1]}
                x2={tipOf(pair[1])[0]}
                y2={tipOf(pair[1])[1]}
              />
            )}
            {sumArrow && sumTip && (
              <g className="plane__sum">
                <line x1={CENTER} y1={CENTER} x2={sumArrow.lineEnd[0]} y2={sumArrow.lineEnd[1]} />
                {sumArrow.head && <polygon points={sumArrow.head} />}
              </g>
            )}
            {vectors.map((v) => {
              const tip = tipOf(v.id);
              const a = arrow(tip);
              return (
                <g key={v.id} className="plane__vector" data-slot={slotOf(v.id)} data-vector={v.id}>
                  <line x1={CENTER} y1={CENTER} x2={a.lineEnd[0]} y2={a.lineEnd[1]} />
                  {a.head && <polygon points={a.head} />}
                </g>
              );
            })}
            {images.map((im) => (
              <g
                key={im.id}
                className="plane__image"
                aria-hidden="true"
                data-slot={slotOf(im.id)}
                data-image={im.id}
              >
                <line x1={CENTER} y1={CENTER} x2={im.arrow.lineEnd[0]} y2={im.arrow.lineEnd[1]} />
                {im.arrow.head && <polygon points={im.arrow.head} />}
              </g>
            ))}
            {arcPath && <path className="plane__angle-arc" aria-hidden="true" d={arcPath} />}
            {pair && shadowShown && shadowArrow && shadowTip && (
              <g className="plane__shadow" aria-hidden="true" data-slot={slotOf(pair[0])}>
                <line
                  className="plane__shadow-drop"
                  x1={tipOf(pair[0])[0]}
                  y1={tipOf(pair[0])[1]}
                  x2={shadowTip[0]}
                  y2={shadowTip[1]}
                />
                <line
                  className="plane__shadow-arrow"
                  x1={CENTER}
                  y1={CENTER}
                  x2={shadowArrow.lineEnd[0]}
                  y2={shadowArrow.lineEnd[1]}
                />
                {shadowArrow.head && <polygon points={shadowArrow.head} />}
              </g>
            )}
          </g>

          <g className="plane__labels" aria-hidden="true">
            {labelSpots.map((l) => (
              <text
                key={l.key}
                className={`plane__label${l.isSum ? ' plane__label--sum' : ''}`}
                data-slot={l.isSum ? undefined : slotOf(l.slotId)}
                x={l.at[0]}
                y={l.at[1]}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {l.text}
              </text>
            ))}
          </g>

          {interactive &&
            vectors
              .filter((v) => v.movable)
              .map((v) => {
                const [x, y] = tipOf(v.id);
                return (
                  <g
                    key={v.id}
                    className={`plane__handle${draggingId === v.id ? ' plane__handle--dragging' : ''}`}
                    data-slot={slotOf(v.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={t.plane.handleLabel(
                      v.label,
                      pointText(current[v.id][0], current[v.id][1]),
                    )}
                    onPointerDown={(e) => onPointerDown(v.id, e)}
                    onPointerMove={(e) => onPointerMove(v.id, e)}
                    onPointerUp={(e) => endDrag(v.id, e)}
                    onPointerCancel={(e) => endDrag(v.id, e)}
                    onKeyDown={(e) => onKeyDown(v.id, e)}
                  >
                    <circle className="plane__handle-hit" cx={x} cy={y} r={HANDLE_HIT_RADIUS} />
                    <circle className="plane__handle-ring" cx={x} cy={y} r={HANDLE_RING_RADIUS} />
                    <circle className="plane__handle-dot" cx={x} cy={y} r={HANDLE_RADIUS} />
                  </g>
                );
              })}
        </svg>
      </div>

      {rows.length > 0 && (
        <div className="plane__readouts" role="group" aria-label={t.plane.readouts}>
          <dl className="plane__readouts-list">
            {rows.map((r) => (
              <div key={r.key} className="plane__readout">
                <dt>{r.name}</dt>
                <dd>
                  <output className={r.matrix ? 'num plane__matrix' : 'num'}>{r.value}</output>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
