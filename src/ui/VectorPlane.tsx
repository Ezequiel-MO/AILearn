import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import type { PlaneSpec } from '../content/schema';
import { measure } from '../engine/vectors';
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
  const { range, snap, vectors, readouts, pair } = spec;
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

  // --- Lecturas, con las funciones del motor ---
  const rows: { key: string; name: string; value: string }[] = [];
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
    } else if (pair) {
      const [a, b] = pair;
      if (kind === 'distance') {
        rows.push({
          key: 'd',
          name: `d(${nameOf(a)}, ${nameOf(b)})`,
          value: fmt(measure('distance', [a, b], asVecs)),
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
    })),
    ...(sumTip ? [{ key: 'sum', text: sumText, tip: sumTip, gap: 16, isSum: true }] : []),
  ];
  const labelAt = placeLabels({
    labels: labelRequests,
    arrowTips: [...vectors.map((v) => tipOf(v.id)), ...(sumTip ? [sumTip] : [])],
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
          </g>

          <g className="plane__labels" aria-hidden="true">
            {labelSpots.map((l) => (
              <text
                key={l.key}
                className={`plane__label${l.isSum ? ' plane__label--sum' : ''}`}
                data-slot={l.isSum ? undefined : slotOf(l.key)}
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
