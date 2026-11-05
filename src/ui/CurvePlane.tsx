import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import type { GraphSpec } from '../content/schema';
import { curveAt, curveSlope } from '../engine/curves';
import type { Curve } from '../engine/curves';
import { fmt, fmtPair } from './format';
import { dotBox, placePointLabel, placeStepLabel } from './labelPlacement';
import type { Box, Placed, Side } from './labelPlacement';
import { t } from './strings';

// Geometría del plano en unidades de vista (el SVG se escala con el ancho disponible).
const W = 480;
const H = 340;
const PAD_L = 52;
const PAD_R = 16;
const PAD_T = 14;
const PAD_B = 40;
const AREA_W = W - PAD_L - PAD_R;
const AREA_H = H - PAD_T - PAD_B;
const SAMPLES = 200;
const TARGET_TICKS = 6;
const EPS = 1e-9;
const HANDLE_RADIUS = 7;
const HANDLE_RING_RADIUS = 11;
const HANDLE_HIT_RADIUS = 26;
/** Largo de la tangente en pantalla (semilargo, unidades de vista): un segmento, no una recta infinita. */
const TANGENT_HALF = 56;
const HEAD = 11;
/** Recorta los píxeles de una curva que se va al infinito para no pasar números enormes al SVG. */
const PIXEL_LIMIT = 4000;

type Pt = [number, number];

const clean = (n: number): number => Number(n.toFixed(6)) + 0;

/** Paso «bonito» (1, 2 o 5 por una potencia de 10) con el que caben unas `TARGET_TICKS` divisiones. */
export const niceStep = (range: number): number => {
  const raw = range / TARGET_TICKS;
  if (!(raw > 0) || !Number.isFinite(raw)) return 1;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  const nice = f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10;
  return clean(nice * mag);
};

const ticksIn = (lo: number, hi: number, step: number): number[] => {
  const out: number[] = [];
  for (let i = Math.ceil(lo / step - EPS); i * step <= hi + EPS; i += 1) out.push(clean(i * step));
  return out;
};

/** Ajusta a múltiplos de `snap` dentro de [lo, hi]. */
const snapIn = (v: number, snap: number, lo: number, hi: number): number => {
  const first = Math.ceil(lo / snap - EPS);
  const last = Math.floor(hi / snap + EPS);
  if (first > last) return clean(Math.min(hi, Math.max(lo, v)));
  return clean(Math.max(first, Math.min(last, Math.round(v / snap))) * snap);
};

const STEP_KEYS: Record<string, Pt> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

const px = (n: number): number => Math.max(-PIXEL_LIMIT, Math.min(PIXEL_LIMIT, n));
const r1 = (n: number): string => n.toFixed(1);
const POINT_LABEL_SIZE = 17;
const NAME_SIZE = 16;
const boxAttr = (b: Box): string => [b.x0, b.y0, b.x1, b.y1].map(r1).join(',');

/** Una ventana del plano: del mundo (x, y) a la vista. */
interface Frame {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  sx: (x: number) => number;
  sy: (y: number) => number;
}

const makeFrame = (x0: number, x1: number, y0: number, y1: number): Frame => ({
  x0,
  x1,
  y0,
  y1,
  sx: (x) => PAD_L + ((x - x0) / (x1 - x0)) * AREA_W,
  sy: (y) => PAD_T + ((y1 - y) / (y1 - y0)) * AREA_H,
});

/** Fondo, rejilla, ejes, marcas y nombres de los ejes. */
function Axes({
  frame,
  clipId,
  xName,
  yName,
  xStep,
  yStep,
}: {
  frame: Frame;
  clipId: string;
  xName: string;
  yName: string;
  xStep: number;
  yStep: number;
}) {
  const { x0, x1, y0, y1, sx, sy } = frame;
  const xs = ticksIn(x0, x1, xStep);
  const ys = ticksIn(y0, y1, yStep);
  const left = PAD_L;
  const right = PAD_L + AREA_W;
  const top = PAD_T;
  const bottom = PAD_T + AREA_H;
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <rect x={left} y={top} width={AREA_W} height={AREA_H} />
        </clipPath>
      </defs>
      <rect className="curve__area" x={left} y={top} width={AREA_W} height={AREA_H} />
      <g className="curve__grid">
        {xs.map((v) => (
          <line key={`gx${v}`} x1={sx(v)} x2={sx(v)} y1={top} y2={bottom} />
        ))}
        {ys.map((v) => (
          <line key={`gy${v}`} x1={left} x2={right} y1={sy(v)} y2={sy(v)} />
        ))}
      </g>
      <g className="curve__axes">
        {y0 <= 0 && y1 >= 0 && <line x1={left} x2={right} y1={sy(0)} y2={sy(0)} />}
        {x0 <= 0 && x1 >= 0 && <line x1={sx(0)} x2={sx(0)} y1={top} y2={bottom} />}
      </g>
      <g className="curve__ticks" aria-hidden="true">
        {xs.map((v) => (
          <text
            key={`tx${v}`}
            className="curve__tick-label"
            x={sx(v)}
            y={bottom + 17}
            textAnchor="middle"
          >
            {fmt(v)}
          </text>
        ))}
        {ys.map((v) => (
          <text
            key={`ty${v}`}
            className="curve__tick-label"
            x={left - 7}
            y={sy(v)}
            textAnchor="end"
            dominantBaseline="central"
          >
            {fmt(v)}
          </text>
        ))}
        <text className="curve__axis-name" x={right} y={H - 5} textAnchor="end">
          {xName}
        </text>
        <text className="curve__axis-name" x={left + 6} y={top + 15} textAnchor="start">
          {yName}
        </text>
      </g>
    </>
  );
}

/** Muestrea una función en la ventana y la dibuja como polilínea (se corta donde no es finita). */
const sampledPath = (frame: Frame, f: (x: number) => number): string => {
  const parts: string[] = [];
  let pen = false;
  for (let i = 0; i <= SAMPLES; i += 1) {
    const x = frame.x0 + ((frame.x1 - frame.x0) * i) / SAMPLES;
    const y = f(x);
    if (!Number.isFinite(y)) {
      pen = false;
      continue;
    }
    parts.push(`${pen ? 'L' : 'M'}${r1(frame.sx(x))},${r1(px(frame.sy(y)))}`);
    pen = true;
  }
  return parts.join(' ');
};

/** Dónde poner el nombre de una curva: junto al último punto muestreado que cae dentro de la ventana. */
const nameSpot = (frame: Frame, f: (x: number) => number, fromLeft = false): Pt | null => {
  for (let k = 0; k <= SAMPLES; k += 1) {
    const i = fromLeft ? k : SAMPLES - k;
    const x = frame.x0 + ((frame.x1 - frame.x0) * i) / SAMPLES;
    const y = f(x);
    if (Number.isFinite(y) && y >= frame.y0 && y <= frame.y1) return [frame.sx(x), frame.sy(y)];
  }
  return null;
};

/** La recta de pendiente m por (x, y), prolongada a toda la ventana, en coordenadas de vista. */
const wideLine = (frame: Frame, x: number, y: number, m: number): [Pt, Pt] | null => {
  if (!Number.isFinite(m)) return null;
  return [
    [frame.sx(frame.x0), px(frame.sy(y + m * (frame.x0 - x)))],
    [frame.sx(frame.x1), px(frame.sy(y + m * (frame.x1 - x)))],
  ];
};

/** Segmento de largo fijo en pantalla, con la dirección de la pendiente m del mundo. */
const tangentSegment = (frame: Frame, x: number, y: number, m: number): [Pt, Pt] | null => {
  if (!Number.isFinite(m)) return null;
  const kx = AREA_W / (frame.x1 - frame.x0);
  const ky = AREA_H / (frame.y1 - frame.y0);
  const dx = kx;
  const dy = -m * ky;
  const len = Math.hypot(dx, dy);
  const cx = frame.sx(x);
  const cy = frame.sy(y);
  const ux = (dx / len) * TANGENT_HALF;
  const uy = (dy / len) * TANGENT_HALF;
  return [
    [cx - ux, cy - uy],
    [cx + ux, cy + uy],
  ];
};

const arrowHead = (from: Pt, to: Pt): string => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return '';
  const ux = dx / len;
  const uy = dy / len;
  const h = Math.min(HEAD, len);
  const bx = to[0] - ux * h;
  const by = to[1] - uy * h;
  const hw = h * 0.45;
  return `${r1(to[0])},${r1(to[1])} ${r1(bx - uy * hw)},${r1(by + ux * hw)} ${r1(bx + uy * hw)},${r1(by - ux * hw)}`;
};

interface Row {
  key: string;
  name: string;
  value: string;
}

/**
 * Plano de curvas en SVG: una función de una variable con puntos sobre ella (o libres), tangente,
 * secante, recta con su triángulo, derivada, paso de descenso y, en una pérdida `mse`, el panel de
 * ajuste. Controlado desde fuera: `positions` manda; el plano pide cambios con `onMove`. Sin `onMove`
 * es una figura estática (sin asas). Las cuentas son del motor (src/engine/curves).
 */
export function CurvePlane({
  spec,
  positions,
  onMove,
}: {
  spec: GraphSpec;
  positions: Record<string, readonly number[]>;
  onMove?: (id: string, to: [number, number]) => void;
}) {
  const { curve, snap, readouts, pair, labels } = spec;
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; pointerId: number; offset: Pt } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const uid = useId().replace(/:/g, '');
  const interactive = onMove !== undefined;
  const isLoss = curve?.kind === 'mse';
  const xName = labels?.x ?? (isLoss ? 'w' : 'x');
  const yName = labels?.y ?? (isLoss ? t.curve.lossName : 'y');

  const frame = makeFrame(spec.x[0], spec.x[1], spec.y[0], spec.y[1]);
  const { sx, sy } = frame;

  // Posición de cada punto: uno sobre la curva siempre está en (x, f(x)).
  const current: Record<string, Pt> = {};
  for (const p of spec.points) {
    const at = Object.hasOwn(positions, p.id) ? positions[p.id] : undefined;
    const x = at ? at[0] : p.x;
    const y = p.onCurve && curve ? curveAt(curve, x) : at ? at[1] : (p.y ?? 0);
    current[p.id] = [x, y];
  }
  const onCurvePoints = spec.points.filter((p) => p.onCurve && curve);
  const nameOf = (id: string): string => spec.points.find((p) => p.id === id)?.label ?? id;

  // --- Arrastre y teclado ---
  const toWorld = (clientX: number, clientY: number): Pt | null => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    const vx = ((clientX - rect.left) / rect.width) * W;
    const vy = ((clientY - rect.top) / rect.height) * H;
    return [
      frame.x0 + ((vx - PAD_L) / AREA_W) * (frame.x1 - frame.x0),
      frame.y1 - ((vy - PAD_T) / AREA_H) * (frame.y1 - frame.y0),
    ];
  };

  const emit = (id: string, x: number, y: number) => {
    const p = spec.points.find((q) => q.id === id);
    if (!p) return;
    const nx = snapIn(x, snap, frame.x0, frame.x1);
    const ny = p.onCurve && curve ? curveAt(curve, nx) : snapIn(y, snap, frame.y0, frame.y1);
    const at = current[id];
    if (nx === at[0] && (p.onCurve || ny === at[1])) return;
    onMove?.(id, [nx, ny]);
  };

  const onPointerDown = (id: string, e: PointerEvent<SVGGElement>) => {
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault();
    e.currentTarget.focus();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const w = toWorld(e.clientX, e.clientY);
    const at = current[id];
    drag.current = {
      id,
      pointerId: e.pointerId,
      offset: w ? [w[0] - at[0], w[1] - at[1]] : [0, 0],
    };
    setDraggingId(id);
  };

  const onPointerMove = (id: string, e: PointerEvent<SVGGElement>) => {
    const d = drag.current;
    if (!d || d.id !== id || d.pointerId !== e.pointerId) return;
    const w = toWorld(e.clientX, e.clientY);
    if (w) emit(id, w[0] - d.offset[0], w[1] - d.offset[1]);
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
    const p = spec.points.find((q) => q.id === id);
    if (p?.onCurve && dir[0] === 0) return; // sobre la curva solo se mueve en horizontal
    e.preventDefault();
    const at = current[id];
    emit(id, at[0] + dir[0] * snap, at[1] + dir[1] * snap);
  };

  // --- Qué se dibuja ---
  const f = (x: number): number => (curve ? curveAt(curve, x) : NaN);
  const df = (x: number): number => (curve ? curveSlope(curve, x) : NaN);
  const curvePath = curve ? sampledPath(frame, f) : '';
  const derivPath = curve && spec.derivative ? sampledPath(frame, df) : '';
  const curveSpot = curve ? nameSpot(frame, f) : null;
  const derivSpot = derivPath ? nameSpot(frame, df, !isLoss) : null;
  const wantsTangent = spec.tangent === true || readouts.includes('slope');
  const wantsSecant = readouts.includes('secant') && pair !== undefined;
  const wantsLine = readouts.includes('line') && pair !== undefined;
  const xStep = niceStep(frame.x1 - frame.x0);
  const yStep = niceStep(frame.y1 - frame.y0);

  const secant =
    wantsSecant && pair ? wideLineThrough(frame, current[pair[0]], current[pair[1]]) : null;
  const line =
    wantsLine && pair ? wideLineThrough(frame, current[pair[0]], current[pair[1]]) : null;

  // triángulo de avance y subida: del punto de la izquierda al de la derecha
  let triangle: { a: Pt; corner: Pt; b: Pt; run: number; rise: number } | null = null;
  if (wantsLine && pair) {
    const [p, q] = [current[pair[0]], current[pair[1]]].sort((u, v) => u[0] - v[0]);
    if (p[0] !== q[0] || p[1] !== q[1]) {
      triangle = { a: p, corner: [q[0], p[1]], b: q, run: q[0] - p[0], rise: q[1] - p[1] };
    }
  }

  // paso de descenso
  let step: { from: Pt; to: Pt; head: string; lo: Pt } | null = null;
  if (spec.step && curve) {
    const at = current[spec.step.of];
    if (at) {
      const nx = at[0] - spec.step.rate * curveSlope(curve, at[0]);
      const ny = curveAt(curve, nx);
      if (Number.isFinite(nx) && Number.isFinite(ny)) {
        const from: Pt = [sx(at[0]), px(sy(at[1]))];
        const to: Pt = [px(sx(nx)), px(sy(ny))];
        step = { from, to, head: arrowHead(from, to), lo: [nx, ny] };
      }
    }
  }

  // --- Lecturas ---
  const rows: Row[] = [];
  if (readouts.includes('coords')) {
    for (const p of spec.points) {
      const [x, y] = current[p.id];
      if (isLoss && p.onCurve) {
        const suffix = onCurvePoints.length > 1 ? ` (${p.label})` : '';
        rows.push({ key: `c${p.id}x`, name: `${xName}${suffix}`, value: fmt(x) });
        rows.push({ key: `c${p.id}y`, name: `${yName}${suffix}`, value: fmt(y) });
      } else {
        rows.push({ key: `c${p.id}`, name: p.label, value: fmtPair([x, y]) });
      }
    }
  }
  if (readouts.includes('slope') && curve) {
    for (const p of onCurvePoints) {
      const m = curveSlope(curve, current[p.id][0]);
      rows.push({ key: `s${p.id}`, name: t.curve.slopeAt(p.label), value: fmt(m) });
    }
  }
  if (wantsSecant && pair) {
    const [p, q] = [current[pair[0]], current[pair[1]]];
    const m = q[0] === p[0] ? NaN : (q[1] - p[1]) / (q[0] - p[0]);
    rows.push({
      key: 'secant',
      name: t.curve.secantName(nameOf(pair[0]), nameOf(pair[1])),
      value: Number.isFinite(m) ? fmt(m) : t.curve.noSlope,
    });
  }
  if (wantsLine && pair) {
    const [p, q] = [current[pair[0]], current[pair[1]]];
    const m = q[0] === p[0] ? NaN : (q[1] - p[1]) / (q[0] - p[0]);
    rows.push({
      key: 'lslope',
      name: t.curve.lineSlope,
      value: Number.isFinite(m) ? fmt(m) : t.curve.noSlope,
    });
    rows.push({
      key: 'licpt',
      name: t.curve.lineIntercept,
      value: Number.isFinite(m) ? fmt(p[1] - m * p[0]) : t.curve.noSlope,
    });
  }

  // --- Panel de ajuste (pérdida mse): datos, recta ŷ = w·x y el cuadrado de cada error ---
  const fitPanel =
    spec.fit && curve?.kind === 'mse' && current[spec.fit.of]
      ? renderFit(curve, current[spec.fit.of][0], [frame.x0, frame.x1], `${uid}fit`)
      : null;

  // --- Rótulos: cada punto busca un sitio que no pise a otros ni a los puntos ---
  const plotArea: Box = { x0: PAD_L, y0: PAD_T, x1: W - PAD_R, y1: H - PAD_B };
  const centers: Record<string, Pt> = {};
  for (const p of spec.points) centers[p.id] = [sx(current[p.id][0]), px(sy(current[p.id][1]))];
  const dots: Box[] = spec.points.map((p) => dotBox(centers[p.id]));
  if (step) dots.push(dotBox(step.to));
  const placedLabels: Record<string, Placed> = {};
  const labelBoxes: Box[] = [];
  const NEAR = 60;
  for (const p of [...spec.points].sort((a, b) => centers[a.id][0] - centers[b.id][0])) {
    const c = centers[p.id];
    // si hay otro punto cerca y a su derecha, este rótulo prefiere la izquierda
    const side: Side = spec.points.some(
      (q) =>
        q.id !== p.id &&
        Math.hypot(centers[q.id][0] - c[0], centers[q.id][1] - c[1]) < NEAR &&
        (centers[q.id][0] > c[0] ||
          (centers[q.id][0] === c[0] && spec.points.indexOf(q) > spec.points.indexOf(p))),
    )
      ? 'left'
      : 'right';
    const placed = placePointLabel(
      p.label,
      POINT_LABEL_SIZE,
      c,
      plotArea,
      [...dots, ...labelBoxes],
      side,
    );
    placedLabels[p.id] = placed;
    labelBoxes.push(placed.box);
  }
  const stepLabel = step
    ? placeStepLabel(t.curve.stepName, NAME_SIZE, step.from, step.to, plotArea, [
        ...dots,
        ...labelBoxes,
      ])
    : null;

  const makeHandle = (p: GraphSpec['points'][number]) => {
    const [x, y] = current[p.id];
    const [cx, cy] = centers[p.id];
    const pl = placedLabels[p.id];
    const label = (
      <text
        key={`l${p.id}`}
        className="curve__point-label"
        x={r1(pl.x)}
        y={r1(pl.y)}
        textAnchor={pl.textAnchor}
        data-box={boxAttr(pl.box)}
      >
        {p.label}
      </text>
    );
    if (!interactive || !p.movable) {
      return (
        <g key={p.id} className="curve__point">
          <circle
            className="curve__point-dot curve__point-dot--fixed"
            cx={cx}
            cy={cy}
            r={HANDLE_RADIUS - 1}
          />
          {label}
        </g>
      );
    }
    return (
      <g key={p.id}>
        {label}
        <g
          className={`curve__handle${draggingId === p.id ? ' curve__handle--dragging' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={t.curve.handleLabel(p.label, fmtPair([x, y]))}
          onPointerDown={(e) => onPointerDown(p.id, e)}
          onPointerMove={(e) => onPointerMove(p.id, e)}
          onPointerUp={(e) => endDrag(p.id, e)}
          onPointerCancel={(e) => endDrag(p.id, e)}
          onKeyDown={(e) => onKeyDown(p.id, e)}
        >
          <circle className="curve__handle-hit" cx={cx} cy={cy} r={HANDLE_HIT_RADIUS} />
          <circle className="curve__handle-ring" cx={cx} cy={cy} r={HANDLE_RING_RADIUS} />
          <circle className="curve__handle-dot" cx={cx} cy={cy} r={HANDLE_RADIUS} />
        </g>
      </g>
    );
  };
  // los fijos se dibujan los últimos: un tirador encima no los tapa
  const dragHandles = [
    ...spec.points.filter((p) => interactive && p.movable).map(makeHandle),
    ...spec.points.filter((p) => !(interactive && p.movable)).map(makeHandle),
  ];

  const clipId = `${uid}main`;
  return (
    <div className="curve">
      <div className="curve__panels">
        <figure className="curve__figure">
          {isLoss && fitPanel ? (
            <figcaption className="curve__caption">{t.curve.lossCaption}</figcaption>
          ) : null}
          <svg
            ref={svgRef}
            className={`curve__svg${interactive ? ' curve__svg--interactive' : ''}`}
            viewBox={`0 0 ${W} ${H}`}
            role={interactive ? 'group' : 'img'}
            aria-label={t.curve.figure}
          >
            <Axes
              frame={frame}
              clipId={clipId}
              xName={xName}
              yName={yName}
              xStep={xStep}
              yStep={yStep}
            />
            <g clipPath={`url(#${clipId})`}>
              {derivPath && <path className="curve__derivative" d={derivPath} />}
              {curvePath && <path className="curve__curve" d={curvePath} />}
              {secant && (
                <line
                  className="curve__secant"
                  x1={secant[0][0]}
                  y1={secant[0][1]}
                  x2={secant[1][0]}
                  y2={secant[1][1]}
                />
              )}
              {line && (
                <line
                  className="curve__line"
                  x1={line[0][0]}
                  y1={line[0][1]}
                  x2={line[1][0]}
                  y2={line[1][1]}
                />
              )}
              {wantsTangent &&
                curve &&
                onCurvePoints.map((p) => {
                  const seg = tangentSegment(
                    frame,
                    current[p.id][0],
                    current[p.id][1],
                    df(current[p.id][0]),
                  );
                  if (!seg) return null;
                  return (
                    <line
                      key={`t${p.id}`}
                      className="curve__tangent"
                      x1={seg[0][0]}
                      y1={seg[0][1]}
                      x2={seg[1][0]}
                      y2={seg[1][1]}
                    />
                  );
                })}
              {triangle && (
                <polyline
                  className="curve__triangle"
                  points={[triangle.a, triangle.corner, triangle.b]
                    .map((p) => `${r1(sx(p[0]))},${r1(px(sy(p[1])))}`)
                    .join(' ')}
                />
              )}
              {step && (
                <g className="curve__step">
                  <line x1={step.from[0]} y1={step.from[1]} x2={step.to[0]} y2={step.to[1]} />
                  {step.head && <polygon points={step.head} />}
                  <circle
                    className="curve__ghost"
                    cx={step.to[0]}
                    cy={step.to[1]}
                    r={HANDLE_RADIUS}
                  />
                </g>
              )}
            </g>
            <g className="curve__names" aria-hidden="true">
              {curve && !isLoss && curveSpot && (
                <text
                  className="curve__name curve__name--curve"
                  x={Math.min(curveSpot[0], W - PAD_R - 4)}
                  y={Math.max(curveSpot[1] - 10, PAD_T + 14)}
                  textAnchor="end"
                >
                  {isLoss ? yName : 'f'}
                </text>
              )}
              {derivSpot && (
                <text
                  className="curve__name curve__name--derivative"
                  x={isLoss ? Math.min(derivSpot[0], W - PAD_R - 4) : derivSpot[0] + 8}
                  y={
                    isLoss
                      ? Math.max(derivSpot[1] + 22, PAD_T + 14)
                      : Math.min(derivSpot[1] - 8, PAD_T + AREA_H - 6)
                  }
                  textAnchor={isLoss ? 'end' : 'start'}
                >
                  {isLoss ? t.curve.slopeCurveName : t.curve.derivativeName}
                </text>
              )}
              {step && stepLabel && (
                <text
                  className="curve__name curve__name--step"
                  x={r1(stepLabel.x)}
                  y={r1(stepLabel.y)}
                  textAnchor={stepLabel.textAnchor}
                  data-box={boxAttr(stepLabel.box)}
                >
                  {t.curve.stepName}
                </text>
              )}
              {triangle && (
                <>
                  <text
                    className="curve__name curve__name--line"
                    x={(sx(triangle.a[0]) + sx(triangle.corner[0])) / 2}
                    y={sy(triangle.a[1]) + (triangle.rise >= 0 ? 18 : -8)}
                    textAnchor="middle"
                  >
                    {t.curve.runName(fmt(triangle.run))}
                  </text>
                  <text
                    className="curve__name curve__name--line"
                    x={sx(triangle.corner[0]) + (sx(triangle.corner[0]) > W - PAD_R - 110 ? -8 : 8)}
                    y={(sy(triangle.corner[1]) + sy(triangle.b[1])) / 2}
                    textAnchor={sx(triangle.corner[0]) > W - PAD_R - 110 ? 'end' : 'start'}
                    dominantBaseline="central"
                  >
                    {t.curve.riseName(fmt(triangle.rise))}
                  </text>
                </>
              )}
            </g>
            {dragHandles}
          </svg>
          {step && spec.step ? <p className="curve__note">{t.curve.stepNote}</p> : null}
        </figure>
        {fitPanel}
      </div>

      {rows.length > 0 && (
        <div className="curve__readouts" role="group" aria-label={t.curve.readouts}>
          <dl className="curve__readouts-list">
            {rows.map((r) => (
              <div key={r.key} className="curve__readout">
                <dt>{r.name}</dt>
                <dd>
                  <output className="num">{r.value}</output>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

/** La recta por dos puntos del mundo, prolongada a toda la ventana, en coordenadas de vista. */
function wideLineThrough(frame: Frame, p: Pt, q: Pt): [Pt, Pt] | null {
  if (q[0] === p[0]) {
    return [
      [frame.sx(p[0]), PAD_T],
      [frame.sx(p[0]), PAD_T + AREA_H],
    ];
  }
  return wideLine(frame, p[0], p[1], (q[1] - p[1]) / (q[0] - p[0]));
}

/**
 * El segundo panel de una pérdida `mse`: los datos, la recta ŷ = w·x y, por cada dato, su error como
 * segmento vertical y como cuadrado. Misma escala en los dos ejes para que los cuadrados lo sean.
 */
function renderFit(
  curve: Extract<Curve, { kind: 'mse' }>,
  w: number,
  wWindow: [number, number],
  uid: string,
): ReactNode {
  const data = curve.data;
  const xs = data.map((d) => d[0]);
  const ys = data.map((d) => d[1]);
  const spanX = Math.max(Math.max(...xs) - Math.min(0, ...xs), 1e-6);
  const spanY = Math.max(Math.max(...ys) - Math.min(0, ...ys), 1e-6);
  const span = Math.max(spanX, spanY);
  // sitio para los cuadrados de los errores con la w extrema de la ventana, sin pasarse de un span
  const worst = Math.max(
    ...[wWindow[0], wWindow[1]].flatMap((ww) => data.map(([xi, yi]) => Math.abs(ww * xi - yi))),
  );
  const ext = Math.min(Number.isFinite(worst) ? worst : 0, span);
  let x0 = Math.min(0, ...xs) - span * 0.08;
  let x1 = Math.max(...xs) + span * 0.12 + ext * 0.8;
  let y0 = Math.min(0, ...ys) - span * 0.08;
  let y1 = Math.max(...ys) + span * 0.12 + ext;
  // misma escala en los dos ejes
  const scale = Math.min(AREA_W / (x1 - x0), AREA_H / (y1 - y0));
  x1 = x0 + AREA_W / scale;
  y1 = y0 + AREA_H / scale;
  x0 = clean(x0);
  y0 = clean(y0);
  const frame = makeFrame(x0, x1, y0, y1);
  const { sx, sy } = frame;
  const step = niceStep(Math.max(x1 - x0, y1 - y0));
  const clipId = `${uid}-clip`;
  const mid = (x0 + x1) / 2;
  const [lx0, lx1] = [x0, x1];
  const lineA: Pt = [sx(lx0), px(sy(w * lx0))];
  const lineB: Pt = [sx(lx1), px(sy(w * lx1))];

  return (
    <figure className="curve__figure curve__figure--fit">
      <figcaption className="curve__caption">{t.curve.fitCaption(fmt(w))}</figcaption>
      <svg
        className="curve__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t.curve.fitFigure}
      >
        <Axes frame={frame} clipId={clipId} xName="x" yName="y" xStep={step} yStep={step} />
        <g clipPath={`url(#${clipId})`}>
          {data.map(([xi, yi], i) => {
            const yh = w * xi;
            const e = yh - yi;
            if (!Number.isFinite(e)) return null;
            const dir = xi <= mid ? 1 : -1; // el cuadrado crece hacia donde hay más sitio
            const corners: Pt[] = [
              [xi, yi],
              [xi, yh],
              [xi + dir * Math.abs(e), yh],
              [xi + dir * Math.abs(e), yi],
            ];
            return (
              <g key={i} className="curve__fit-error">
                <polygon
                  className="curve__fit-square"
                  points={corners.map((c) => `${r1(sx(c[0]))},${r1(px(sy(c[1])))}`).join(' ')}
                />
                <line
                  className="curve__fit-gap"
                  x1={sx(xi)}
                  y1={px(sy(yi))}
                  x2={sx(xi)}
                  y2={px(sy(yh))}
                />
              </g>
            );
          })}
          <line
            className="curve__fit-line"
            x1={lineA[0]}
            y1={lineA[1]}
            x2={lineB[0]}
            y2={lineB[1]}
          />
          {data.map(([xi, yi], i) => (
            <circle key={`d${i}`} className="curve__fit-datum" cx={sx(xi)} cy={sy(yi)} r={5} />
          ))}
        </g>
      </svg>
      <p className="curve__note">{t.curve.fitNote}</p>
    </figure>
  );
}
