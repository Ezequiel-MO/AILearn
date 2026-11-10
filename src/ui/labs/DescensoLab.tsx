import { useId, useMemo, useRef } from 'react';
import {
  descenso,
  descensoScene,
  type DescensoOptimizer,
  type DescensoSpec,
} from '../../engine/labs/descenso';
import { settle } from '../../engine/labs';
import { fmt, fmtPair } from '../format';
import {
  Choice,
  Handle,
  LabFrame,
  Readouts,
  Slider,
  linear,
  ticks,
  type LabProps,
  type ReadoutItem,
} from './parts';
import { descensoFormats, descensoStrings } from './descenso.strings';
import { showValue } from './show';
import './descenso.css';

// --- Geometría del mapa, en unidades de vista ---
const MAP = { w: 480, h: 380, x0: 54, x1: 466, y0: 12, y1: 324 } as const;
const GRID = 60;
const BANDS = 9;
const ARROW = 40;

type P = readonly [number, number];

/** Segmentos de la curva de nivel `level` de una rejilla de esquinas (marching squares sencillo). */
const contour = (corner: number[][], level: number): [P, P][] => {
  const out: [P, P][] = [];
  const n = corner.length - 1;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      // esquinas: a (i, j), b (i+1, j), c (i+1, j+1), d (i, j+1); aristas ab, bc, cd, da
      const v = [corner[i]![j]!, corner[i + 1]![j]!, corner[i + 1]![j + 1]!, corner[i]![j + 1]!];
      const at: P[] = [
        [i, j],
        [i + 1, j],
        [i + 1, j + 1],
        [i, j + 1],
      ];
      const hits: P[] = [];
      for (let e = 0; e < 4; e++) {
        const a = v[e]!;
        const b = v[(e + 1) % 4]!;
        if (a <= level !== b <= level) {
          const u = (level - a) / (b - a);
          const p = at[e]!;
          const q = at[(e + 1) % 4]!;
          hits.push([p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]);
        }
      }
      if (hits.length === 2) out.push([hits[0]!, hits[1]!]);
      else if (hits.length === 4) {
        out.push([hits[0]!, hits[1]!], [hits[2]!, hits[3]!]);
      }
    }
  }
  return out;
};

const arrowHead = (from: P, to: P, size = 9): string | null => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  if (len < size) return null;
  const ux = dx / len;
  const uy = dy / len;
  const bx = to[0] - ux * size;
  const by = to[1] - uy * size;
  const half = size * 0.5;
  return `${to[0]},${to[1]} ${bx - uy * half},${by + ux * half} ${bx + uy * half},${by - ux * half}`;
};

/** El relieve del paisaje: bandas de pérdida (sin depender del estado) y su rejilla de esquinas. */
const relief = (spec: DescensoSpec) => {
  const { lossAt } = descensoScene(spec, {});
  const { x, y } = spec.window;
  const corner: number[][] = Array.from({ length: GRID + 1 }, (_, i) =>
    Array.from({ length: GRID + 1 }, (_, j) =>
      lossAt(x[0] + ((x[1] - x[0]) * i) / GRID, y[0] + ((y[1] - y[0]) * j) / GRID),
    ),
  );
  const cells: { i: number; j: number; v: number }[] = [];
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const v =
        (corner[i]![j]! + corner[i + 1]![j]! + corner[i + 1]![j + 1]! + corner[i]![j + 1]!) / 4;
      cells.push({ i, j, v });
    }
  }
  const finite = cells
    .map((c) => c.v)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const lo = finite[0] ?? 0;
  const hi = finite[Math.floor(finite.length * 0.85)] ?? lo + 1;
  const span = hi - lo > 0 ? hi - lo : 1;
  const bands: { i: number; j: number }[][] = Array.from({ length: BANDS }, () => []);
  for (const c of cells) {
    const t = Math.min(1, Math.sqrt(Math.max(0, c.v - lo) / span));
    bands[Math.min(BANDS - 1, Math.floor(t * BANDS))]!.push({ i: c.i, j: c.j });
  }
  return { corner, bands };
};

export function DescensoLab({ spec, state, onChange }: LabProps<DescensoSpec>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/:/g, '');
  const mapClip = `descenso-map-${uid}`;
  const dataClip = `descenso-data-${uid}`;
  const L = descensoStrings;
  const interactive = onChange !== undefined;

  const controls = descenso.controls(spec);
  const settled = settle(controls, state);
  const ctl = (id: string) => controls.find((c) => c.id === id);
  const scene = descensoScene(spec, settled);
  const values = descenso.measure(spec, settled);
  const { path, losses, minimum, params } = scene;
  const last = path[path.length - 1]!;
  const { x: wx, y: wy } = spec.window;

  const { corner, bands } = useMemo(() => relief(spec), [spec]);
  const threshold = spec.threshold;
  const curve = useMemo(
    () => (threshold === undefined ? [] : contour(corner, threshold)),
    [corner, threshold],
  );

  const sx = linear(wx[0], wx[1], MAP.x0, MAP.x1);
  const sy = linear(wy[0], wy[1], MAP.y1, MAP.y0);
  const cellX = (i: number): number => MAP.x0 + ((MAP.x1 - MAP.x0) * i) / GRID;
  const cellY = (j: number): number => MAP.y1 - ((MAP.y1 - MAP.y0) * j) / GRID;
  const cw = (MAP.x1 - MAP.x0) / GRID;
  const ch = (MAP.y1 - MAP.y0) / GRID;
  const axes = spec.axes ?? ['w', 'b'];

  const start = path[0]!;
  const snap = spec.start.snap ?? 0.5;
  const fromView = (v: P): [number, number] => [
    wx[0] + ((v[0] - MAP.x0) / (MAP.x1 - MAP.x0)) * (wx[1] - wx[0]),
    wy[0] + ((MAP.y1 - v[1]) / (MAP.y1 - MAP.y0)) * (wy[1] - wy[0]),
  ];

  // La flecha del primer paso: −gradiente, de largo fijo en pantalla.
  const g = scene.grad0;
  const arrowVec: P = [
    -g[0] * ((MAP.x1 - MAP.x0) / (wx[1] - wx[0])),
    g[1] * ((MAP.y1 - MAP.y0) / (wy[1] - wy[0])),
  ];
  const arrowLen = Math.hypot(arrowVec[0], arrowVec[1]);
  const from: P = [sx(start[0]), sy(start[1])];
  const to: P | null =
    arrowLen > 1e-12
      ? [from[0] + (arrowVec[0] / arrowLen) * ARROW, from[1] + (arrowVec[1] / arrowLen) * ARROW]
      : null;
  const head = to ? arrowHead(from, to) : null;

  // --- La pérdida paso a paso ---
  const C = { w: 300, h: 196, x0: 48, x1: 288, y0: 12, y1: 156 };
  const finiteLosses = losses.filter(Number.isFinite);
  const lossMin = Math.min(0, ...finiteLosses, ...(minimum ? [values.best!] : []));
  const loss0 = losses[0]!;
  const lossTop = Math.max(
    loss0,
    threshold ?? -Infinity,
    Math.min(Math.max(...finiteLosses), lossMin + 4 * Math.max(loss0 - lossMin, 1e-9)),
  );
  const yTop = lossTop > lossMin ? lossMin + (lossTop - lossMin) * 1.06 : lossMin + 1;
  const cx = linear(0, params.n, C.x0, C.x1);
  const cy = linear(lossMin, yTop, C.y1, C.y0);
  const clamp = (v: number): number => Math.min(yTop, Math.max(lossMin, v));

  // --- Los datos (solo con regression) ---
  const data = spec.surface.kind === 'regression' ? spec.surface.data : null;
  const D = { w: 300, h: 230, x0: 44, x1: 288, y0: 12, y1: 190 };
  const dom = (vals: number[], pad: number): [number, number] => {
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const m = (hi - lo || 1) * pad;
    return [lo - m, hi + m];
  };
  const dx = data
    ? dom(
        data.map((d) => d[0]),
        0.15,
      )
    : ([0, 1] as const);
  const dy = data
    ? dom(
        data.map((d) => d[1]),
        0.25,
      )
    : ([0, 1] as const);
  const px = linear(dx[0], dx[1], D.x0, D.x1);
  const py = linear(dy[0], dy[1], D.y1, D.y0);
  const lineAt = (p: P): [P, P] => [
    [px(dx[0]), py(p[0] * dx[0] + p[1])],
    [px(dx[1]), py(p[0] * dx[1] + p[1])],
  ];

  const readouts: ReadoutItem[] = (spec.readouts ?? []).flatMap((m) =>
    Object.hasOwn(values, m)
      ? [
          {
            key: m,
            label: L.metric(m),
            value: descensoFormats[m]
              ? showValue(values[m]!, descensoFormats[m])
              : fmt(values[m]!, 3),
          },
        ]
      : [],
  );

  const optNames = (spec.optimizers ?? ['sgd']).map((o: DescensoOptimizer) => L.optimizers[o]);
  const set = (id: string) => (value: number) => onChange?.({ [id]: value });
  const slider = (id: string, label: string, show?: (v: number) => string) => {
    const c = ctl(id);
    return c ? (
      <Slider
        key={id}
        control={c}
        label={label}
        value={settled[id]!}
        onChange={interactive ? set(id) : undefined}
        show={show}
      />
    ) : null;
  };
  const rate = (v: number) => fmt(v, 3);

  const mapFigure = (
    <svg
      ref={svgRef}
      className={`lab__svg descenso__svg${interactive ? ' lab__svg--interactive' : ''}`}
      viewBox={`0 0 ${MAP.w} ${MAP.h}`}
      role={interactive ? 'group' : 'img'}
      aria-label={L.figure(params.n)}
    >
      <defs>
        <clipPath id={mapClip}>
          <rect x={MAP.x0} y={MAP.y0} width={MAP.x1 - MAP.x0} height={MAP.y1 - MAP.y0} />
        </clipPath>
      </defs>
      <rect
        className="lab__area"
        x={MAP.x0}
        y={MAP.y0}
        width={MAP.x1 - MAP.x0}
        height={MAP.y1 - MAP.y0}
      />
      <g aria-hidden="true" clipPath={`url(#${mapClip})`}>
        <g className="descenso__relief" shapeRendering="crispEdges">
          {bands.map((cells, k) => (
            <path
              key={k}
              data-band={k}
              fillOpacity={0.9 - (k * 0.85) / (BANDS - 1)}
              d={cells
                .map(
                  (c) => `M${cellX(c.i)} ${cellY(c.j + 1)}h${cw + 0.4}v${ch + 0.4}h${-(cw + 0.4)}z`,
                )
                .join('')}
            />
          ))}
        </g>
        {curve.length > 0 ? (
          <path
            className="descenso__threshold"
            d={curve
              .map(([a, b]) => `M${cellX(a[0])} ${cellY(a[1])}L${cellX(b[0])} ${cellY(b[1])}`)
              .join('')}
          />
        ) : null}
        <g className="lab__axes">
          {wx[0] < 0 && wx[1] > 0 ? <line x1={sx(0)} y1={MAP.y0} x2={sx(0)} y2={MAP.y1} /> : null}
          {wy[0] < 0 && wy[1] > 0 ? <line x1={MAP.x0} y1={sy(0)} x2={MAP.x1} y2={sy(0)} /> : null}
        </g>
        {minimum ? (
          <g className="descenso__minimum">
            <circle cx={sx(minimum[0])} cy={sy(minimum[1])} r={7} />
            <path d={`M${sx(minimum[0]) - 4} ${sy(minimum[1]) - 4}l8 8m0 -8l-8 8`} />
          </g>
        ) : null}
        <polyline
          className="descenso__path"
          points={path.map((p) => `${sx(p[0])},${sy(p[1])}`).join(' ')}
        />
        <g className="descenso__steps">
          {path.slice(1, -1).map((p, k) => (
            <circle key={k} cx={sx(p[0])} cy={sy(p[1])} r={2.6} />
          ))}
        </g>
        {to ? (
          <g className="descenso__arrow">
            <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} />
            {head ? <polygon points={head} /> : null}
          </g>
        ) : null}
        <circle
          className={`descenso__end${scene.diverged ? ' descenso__end--bad' : ''}`}
          cx={sx(last[0])}
          cy={sy(last[1])}
          r={6.5}
        />
      </g>

      <g className="lab__ticks" aria-hidden="true">
        {ticks(wx[0], wx[1], 6).map((v) => (
          <text key={`x${v}`} x={sx(v)} y={MAP.y1 + 16} textAnchor="middle">
            {fmt(v)}
          </text>
        ))}
        {ticks(wy[0], wy[1], 6).map((v) => (
          <text key={`y${v}`} x={MAP.x0 - 6} y={sy(v) + 4} textAnchor="end">
            {fmt(v)}
          </text>
        ))}
        <text className="lab__axis-name" x={MAP.x1} y={MAP.h - 14} textAnchor="end">
          {axes[0]}
        </text>
        <text className="lab__axis-name" x={MAP.x0 + 6} y={MAP.y0 + 14}>
          {axes[1]}
        </text>
      </g>

      {interactive && spec.start.movable ? (
        <Handle
          svgRef={svgRef}
          view={[MAP.w, MAP.h]}
          at={from}
          tone={0}
          label={L.handleStart(fmtPair([start[0], start[1]]))}
          onDragTo={(v) => {
            const [x, y] = fromView(v);
            onChange?.({ sx: x, sy: y });
          }}
          onStep={(ddx, ddy) =>
            onChange?.({ sx: start[0] + ddx * snap, sy: start[1] + ddy * snap })
          }
        />
      ) : null}
    </svg>
  );

  const chart = (
    <svg
      className="lab__svg descenso__svg"
      viewBox={`0 0 ${C.w} ${C.h}`}
      role="img"
      aria-label={L.lossChartLabel}
    >
      <rect className="lab__area" x={C.x0} y={C.y0} width={C.x1 - C.x0} height={C.y1 - C.y0} />
      <g aria-hidden="true">
        {threshold !== undefined && threshold >= lossMin && threshold <= yTop ? (
          <g className="descenso__threshold-line">
            <line x1={C.x0} y1={cy(threshold)} x2={C.x1} y2={cy(threshold)} />
            <text x={C.x1 - 4} y={cy(threshold) - 4} textAnchor="end">
              {L.threshold}
            </text>
          </g>
        ) : null}
        <polyline
          className="descenso__loss-line"
          points={losses.map((l, k) => `${cx(k)},${cy(clamp(l))}`).join(' ')}
        />
        <g className="lab__ticks">
          {ticks(0, params.n, 5).map((v) => (
            <text key={`s${v}`} x={cx(v)} y={C.y1 + 15} textAnchor="middle">
              {fmt(v, 0)}
            </text>
          ))}
          {ticks(lossMin, yTop, 4).map((v) => (
            <text key={`l${v}`} x={C.x0 - 5} y={cy(v) + 4} textAnchor="end">
              {fmt(v)}
            </text>
          ))}
          <text className="lab__axis-name" x={C.x1} y={C.h - 6} textAnchor="end">
            {L.stepAxis}
          </text>
          <text className="lab__axis-name" x={C.x0 + 6} y={C.y0 + 12}>
            {L.lossAxis}
          </text>
        </g>
      </g>
    </svg>
  );

  const dataFigure = data ? (
    <svg
      className="lab__svg descenso__svg"
      viewBox={`0 0 ${D.w} ${D.h}`}
      role="img"
      aria-label={L.dataChartLabel}
    >
      <defs>
        <clipPath id={dataClip}>
          <rect x={D.x0} y={D.y0} width={D.x1 - D.x0} height={D.y1 - D.y0} />
        </clipPath>
      </defs>
      <rect className="lab__area" x={D.x0} y={D.y0} width={D.x1 - D.x0} height={D.y1 - D.y0} />
      <g aria-hidden="true" clipPath={`url(#${dataClip})`}>
        {data.map((d, k) => (
          <line
            key={`r${k}`}
            className="descenso__residual"
            x1={px(d[0])}
            y1={py(d[1])}
            x2={px(d[0])}
            y2={py(last[0] * d[0] + last[1])}
          />
        ))}
        <line
          className="descenso__line-start"
          x1={lineAt(start)[0][0]}
          y1={lineAt(start)[0][1]}
          x2={lineAt(start)[1][0]}
          y2={lineAt(start)[1][1]}
        />
        <line
          className="descenso__line-end"
          x1={lineAt(last)[0][0]}
          y1={lineAt(last)[0][1]}
          x2={lineAt(last)[1][0]}
          y2={lineAt(last)[1][1]}
        />
        {data.map((d, k) => (
          <circle key={`p${k}`} className="descenso__datum" cx={px(d[0])} cy={py(d[1])} r={4.5} />
        ))}
      </g>
      <g className="lab__ticks" aria-hidden="true">
        {ticks(dx[0], dx[1], 5).map((v) => (
          <text key={`x${v}`} x={px(v)} y={D.y1 + 15} textAnchor="middle">
            {fmt(v)}
          </text>
        ))}
        {ticks(dy[0], dy[1], 5).map((v) => (
          <text key={`y${v}`} x={D.x0 - 5} y={py(v) + 4} textAnchor="end">
            {fmt(v)}
          </text>
        ))}
        <text className="lab__axis-name" x={D.x1} y={D.h - 6} textAnchor="end">
          x
        </text>
        <text className="lab__axis-name" x={D.x0 + 6} y={D.y0 + 12}>
          y
        </text>
      </g>
    </svg>
  ) : null;

  const figure = (
    <div className="descenso__panels">
      {mapFigure}
      <div className="descenso__below">
        <figure className="descenso__panel">
          <figcaption className="lab__caption">{L.lossChart}</figcaption>
          {chart}
        </figure>
        {dataFigure ? (
          <figure className="descenso__panel">
            <figcaption className="lab__caption">{L.dataChart}</figcaption>
            {dataFigure}
          </figure>
        ) : null}
      </div>
    </div>
  );

  return (
    <LabFrame kind="descenso" figure={figure}>
      <p className="lab__note">{L.legend}</p>
      {scene.diverged ? (
        <p className="lab__note descenso__alert" role="status">
          {L.diverged}
        </p>
      ) : null}
      {ctl('opt') ? (
        <Choice
          legend={L.controls.optimizer}
          options={optNames}
          value={settled.opt!}
          onChange={interactive ? set('opt') : undefined}
        />
      ) : null}
      {slider('lr', L.controls.rate, rate)}
      {slider('n', L.controls.steps, (v) => fmt(v, 0))}
      {slider('beta', L.controls.beta)}
      {slider('batch', L.controls.batch, (v) => fmt(v, 0))}
      <Readouts items={readouts} />
    </LabFrame>
  );
}
