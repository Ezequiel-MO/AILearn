import { useId, useRef } from 'react';
import { atencion, atencionScene, type AtencionSpec } from '../../engine/labs/atencion';
import { fmt, fmtPair } from '../format';
import { dotBox, placePointLabel, type Box } from '../labelPlacement';
import {
  Choice,
  Handle,
  LabFrame,
  Readouts,
  Slider,
  type LabProps,
  type ReadoutItem,
} from './parts';
import { atencionFormat, atencionStrings as L } from './atencion.strings';
import { showValue } from './show';
import './atencion.css';

type P = readonly [number, number];

// --- La frase ---
const SENT_W = 480;
const SENT_H = 150;
const CHIP_Y = 108;
const CHIP_H = 32;
const CHIP_GAP = 6;

// --- El plano de claves: un cuadrado con el origen en el centro ---
const VIEW = 480;
const MARGIN = 26;
const CENTER = VIEW / 2;
const EDGE = CENTER - MARGIN;
const LABEL_SIZE = 14;

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

/** Candado pequeño centrado en (cx, cy). */
function Lock({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g className="atencion__lock" aria-hidden="true">
      <path d={`M${cx - 3.5},${cy - 1} v-3 a3.5,3.5 0 0 1 7,0 v3`} />
      <rect x={cx - 5} y={cy - 1} width={10} height={8} rx={1.5} />
    </g>
  );
}

export function AtencionLab({ spec, state, onChange }: LabProps<AtencionSpec>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/:/g, '');
  const clipId = `atencion-clip-${uid}`;
  const hatchId = `atencion-hatch-${uid}`;
  const interactive = onChange !== undefined;
  const { range, snap, tokens, focus } = spec;
  const n = tokens.length;

  const scene = atencionScene(spec, state);
  const values = atencion.measure(spec, state);
  const controls = atencion.controls(spec);
  const control = (id: string) => controls.find((c) => c.id === id);
  const mode = spec.movable ?? 'query';
  const top = values.top!;

  // --- La frase ---
  const chipW = (SENT_W - 16 - CHIP_GAP * (n - 1)) / n;
  const chipX = (j: number): number => 8 + j * (chipW + CHIP_GAP);
  const chipC = (j: number): number => chipX(j) + chipW / 2;
  const fromX = chipC(focus);
  const arc = (j: number): string => {
    const toX = chipC(j);
    const dx = Math.abs(toX - fromX);
    const lift = Math.min(86, 24 + dx * 0.28);
    return `M${fromX},${CHIP_Y} Q${(fromX + toX) / 2},${CHIP_Y - 2 * lift} ${toX},${CHIP_Y}`;
  };
  const loop = `M${fromX - 9},${CHIP_Y} C${fromX - 30},${CHIP_Y - 62} ${fromX + 30},${CHIP_Y - 62} ${fromX + 9},${CHIP_Y}`;

  // --- El plano ---
  const scale = EDGE / range;
  const sx = (x: number): number => CENTER + x * scale;
  const sy = (y: number): number => CENTER - y * scale;
  const at = (p: P): [number, number] => [sx(p[0]), sy(p[1])];
  const fromView = (v: P): [number, number] => [(v[0] - CENTER) / scale, (CENTER - v[1]) / scale];
  const step = range > 6 ? 2 : 1;
  const nl = Math.floor(range / step);
  const lines = Array.from({ length: 2 * nl + 1 }, (_, k) => (k - nl) * step);
  const origin = at([0, 0]);

  const area: Box = { x0: MARGIN, y0: MARGIN, x1: VIEW - MARGIN, y1: VIEW - MARGIN };
  const tips = scene.keys.map((k) => at(k));
  const qTip = at(scene.query);
  const obstacles: Box[] = [...tips.map((c) => dotBox(c, 8)), dotBox(qTip, 12)];
  const keyLabels = tokens.map((t, j) => {
    const c = tips[j]!;
    const placed = placePointLabel(
      t.text,
      LABEL_SIZE,
      c,
      area,
      obstacles,
      c[0] > CENTER ? 'right' : 'left',
    );
    obstacles.push(placed.box);
    return { id: t.id, placed };
  });

  const ids: [string, string] = mode === 'key' ? ['kx', 'ky'] : ['qx', 'qy'];
  const handleTip: P | null =
    mode === 'query'
      ? scene.query
      : mode === 'key' && spec.keyOf !== undefined
        ? scene.keys[spec.keyOf]!
        : null;
  const handleText =
    mode === 'key' && spec.keyOf !== undefined
      ? L.handleKey(tokens[spec.keyOf]!.text, fmtPair([...handleTip!]))
      : handleTip
        ? L.handleQuery(tokens[focus]!.text, fmtPair([...handleTip]))
        : '';
  const dragTo = (to: [number, number]) => {
    const [x, y] = fromView(to);
    onChange?.({ [ids[0]]: x, [ids[1]]: y });
  };
  const stepBy = (dx: number, dy: number) =>
    onChange?.({
      [ids[0]]: (state[ids[0]] ?? handleTip![0]) + dx * snap,
      [ids[1]]: (state[ids[1]] ?? handleTip![1]) + dy * snap,
    });

  const sentence = (
    <svg
      className="lab__svg atencion__sentence"
      viewBox={`0 0 ${SENT_W} ${SENT_H}`}
      role="img"
      aria-label={L.sentence}
    >
      <g aria-hidden="true">
        <g className="atencion__arcs">
          {tokens.map((t, j) => {
            const w = scene.weights[j]!;
            if (scene.masked[j] || !(w > 0.004)) return null;
            return (
              <path
                key={t.id}
                d={j === focus ? loop : arc(j)}
                strokeWidth={1 + 9 * w}
                strokeOpacity={0.15 + 0.85 * w}
                data-top={j === top ? 'true' : undefined}
              />
            );
          })}
        </g>
        {tokens.map((t, j) => {
          const masked = scene.masked[j]!;
          return (
            <g
              key={t.id}
              className={`atencion__chip${j === focus ? ' atencion__chip--focus' : ''}${
                masked ? ' atencion__chip--masked' : ''
              }`}
            >
              <rect x={chipX(j)} y={CHIP_Y} width={chipW} height={CHIP_H} rx={6} />
              <text
                x={chipC(j)}
                y={CHIP_Y + CHIP_H / 2 + 4.5}
                textAnchor="middle"
                fontSize={chipW < 56 ? 11 : 13}
              >
                {t.text}
              </text>
              {masked ? <Lock cx={chipC(j)} cy={CHIP_Y - 14} /> : null}
            </g>
          );
        })}
        <text
          className="atencion__looking"
          x={fromX}
          y={CHIP_Y + CHIP_H + 4}
          textAnchor="middle"
          dy="1em"
        >
          {L.looking}
        </text>
      </g>
    </svg>
  );

  const plane = (
    <svg
      ref={svgRef}
      className={`lab__svg atencion__plane${interactive ? ' lab__svg--interactive' : ''}`}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      role={interactive ? 'group' : 'img'}
      aria-label={`${L.plane}: ${L.figure(n)}`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={MARGIN} y={MARGIN} width={2 * EDGE} height={2 * EDGE} />
        </clipPath>
      </defs>
      <rect className="lab__area" x={MARGIN} y={MARGIN} width={2 * EDGE} height={2 * EDGE} />
      <g aria-hidden="true" clipPath={`url(#${clipId})`}>
        <g className="lab__grid">
          {lines.map((k) => (
            <g key={k}>
              <line x1={sx(k)} y1={sy(-range)} x2={sx(k)} y2={sy(range)} />
              <line x1={sx(-range)} y1={sy(k)} x2={sx(range)} y2={sy(k)} />
            </g>
          ))}
        </g>
        <g className="lab__axes">
          <line x1={sx(-range)} y1={sy(0)} x2={sx(range)} y2={sy(0)} />
          <line x1={sx(0)} y1={sy(-range)} x2={sx(0)} y2={sy(range)} />
        </g>
        {tokens.map((t, j) => {
          const tip = tips[j]!;
          const head = arrowHead(origin, tip);
          return (
            <g
              key={t.id}
              className={`atencion__key${j === top ? ' atencion__key--top' : ''}${
                scene.masked[j] ? ' atencion__key--masked' : ''
              }`}
            >
              <line x1={origin[0]} y1={origin[1]} x2={tip[0]} y2={tip[1]} />
              {head ? <polygon points={head} /> : null}
            </g>
          );
        })}
        <g className="atencion__query">
          <line x1={origin[0]} y1={origin[1]} x2={qTip[0]} y2={qTip[1]} />
          {arrowHead(origin, qTip) ? <polygon points={arrowHead(origin, qTip)!} /> : null}
        </g>
      </g>
      <g className="atencion__labels" aria-hidden="true">
        {keyLabels.map((l, j) => (
          <text
            key={l.id}
            className={`${j === top ? 'atencion__label--top' : ''}${
              scene.masked[j] ? ' atencion__label--masked' : ''
            }`}
            x={l.placed.x}
            y={l.placed.y}
            textAnchor={l.placed.textAnchor}
          >
            {tokens[j]!.text}
          </text>
        ))}
        <text className="atencion__qname" x={qTip[0] + 12} y={qTip[1] - 12}>
          {L.queryName}
        </text>
      </g>
      {interactive && handleTip ? (
        <Handle
          svgRef={svgRef}
          view={[VIEW, VIEW]}
          at={at(handleTip)}
          tone={mode === 'key' ? 1 : 0}
          label={handleText}
          onDragTo={dragTo}
          onStep={stepBy}
        />
      ) : null}
    </svg>
  );

  // --- El mapa completo ---
  const cell = Math.min(40, Math.floor(260 / n));
  const heatLeft = 74;
  const heatTop = 62;
  const heatW = heatLeft + n * cell + 6;
  const heatH = heatTop + n * cell + 6;
  const heatmap = spec.heatmap ? (
    <div className="atencion__heat">
      <svg
        className="lab__svg atencion__heatmap"
        viewBox={`0 0 ${heatW} ${heatH}`}
        role="img"
        aria-label={L.heatmap(n)}
      >
        <defs>
          <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M-1,7 L7,-1" className="atencion__hatch" />
          </pattern>
        </defs>
        <g aria-hidden="true">
          {tokens.map((t, j) => (
            <text
              key={`c-${t.id}`}
              className="atencion__axis-label"
              transform={`translate(${heatLeft + j * cell + cell / 2},${heatTop - 6}) rotate(-40)`}
            >
              {t.text}
            </text>
          ))}
          {tokens.map((t, i) => (
            <text
              key={`r-${t.id}`}
              className={`atencion__axis-label atencion__axis-label--row${
                i === focus ? ' atencion__axis-label--focus' : ''
              }`}
              x={heatLeft - 6}
              y={heatTop + i * cell + cell / 2 + 4}
              textAnchor="end"
            >
              {t.text}
            </text>
          ))}
          {scene.heat.map((row, i) =>
            row.map((w, j) => {
              const masked = scene.maskOn && j > i;
              const x = heatLeft + j * cell;
              const y = heatTop + i * cell;
              return (
                <g key={`${i}-${j}`} className="atencion__cell">
                  <rect x={x} y={y} width={cell} height={cell} className="atencion__cell-bg" />
                  {masked ? (
                    <rect x={x} y={y} width={cell} height={cell} fill={`url(#${hatchId})`} />
                  ) : (
                    <rect
                      x={x}
                      y={y}
                      width={cell}
                      height={cell}
                      className="atencion__cell-fill"
                      fillOpacity={Number.isFinite(w) ? w : 0}
                    />
                  )}
                  {!masked && cell >= 28 && w >= 0.1 ? (
                    <text
                      className="atencion__cell-text"
                      x={x + cell / 2}
                      y={y + cell / 2 + 4}
                      textAnchor="middle"
                    >
                      {fmt(w * 100, 0)}
                    </text>
                  ) : null}
                </g>
              );
            }),
          )}
          <rect
            className="atencion__focus-row"
            x={heatLeft - 1}
            y={heatTop + focus * cell - 1}
            width={n * cell + 2}
            height={cell + 2}
            rx={3}
          />
        </g>
      </svg>
      <p className="lab__note">{L.heatmapNote}</p>
    </div>
  ) : null;

  // --- Panel ---
  const tempControl = control('temp');
  const maskControl = control('mask');
  const readouts: ReadoutItem[] = (spec.readouts ?? []).flatMap((m) =>
    Object.hasOwn(values, m)
      ? [
          {
            key: m,
            label: L.metric(m, spec),
            value: m === 'top' ? tokens[top]!.text : showValue(values[m]!, atencionFormat(m)),
          },
        ]
      : [],
  );

  const figure = (
    <div className="atencion__stack">
      {sentence}
      {plane}
    </div>
  );

  return (
    <LabFrame kind="atencion" figure={figure}>
      <section className="atencion__weights" aria-label={L.weights}>
        <h4 className="atencion__title">{L.weights}</h4>
        <ul>
          {tokens.map((t, j) => {
            const w = scene.weights[j]!;
            const masked = scene.masked[j]!;
            return (
              <li
                key={t.id}
                className={`atencion__bar${j === top ? ' atencion__bar--top' : ''}${
                  masked ? ' atencion__bar--masked' : ''
                }${j === focus ? ' atencion__bar--focus' : ''}`}
              >
                <span className="atencion__bar-name">{t.text}</span>
                <span className="atencion__bar-track" aria-hidden="true">
                  <span className="atencion__bar-fill" style={{ width: `${w * 100}%` }} />
                </span>
                <span className="atencion__bar-pct">
                  {masked ? L.maskedBar : showValue(w, 'percent')}
                </span>
                <span className="atencion__bar-score">
                  {masked ? '' : L.scoreOf(fmt(scene.scores[j]!))}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      {tempControl ? (
        <Slider
          control={tempControl}
          label={L.temperature}
          value={state.temp ?? tempControl.start}
          onChange={onChange ? (v) => onChange({ temp: v }) : undefined}
        />
      ) : null}
      {maskControl ? (
        <Choice
          legend={L.mask}
          options={L.maskOptions}
          value={state.mask ?? 0}
          onChange={onChange ? (v) => onChange({ mask: v }) : undefined}
        />
      ) : null}
      <Readouts items={readouts} />
      {heatmap}
    </LabFrame>
  );
}
