import { useId } from 'react';
import { lora, loraMode, loraScene, type LoraSpec } from '../../engine/labs/lora';
import { fmt } from '../format';
import { dotBox, placePointLabel, type Box } from '../labelPlacement';
import { LabFrame, Readouts, Slider, type LabProps, type ReadoutItem } from './parts';
import { groupedInt, loraBigMetrics, loraFormats, loraStrings as L } from './lora.strings';
import { showValue } from './show';
import './lora.css';

// Geometría en unidades de vista: un cuadrado con el origen en el centro.
const VIEW = 480;
const MARGIN = 26;
const CENTER = VIEW / 2;
const EDGE = CENTER - MARGIN;
const LABEL_SIZE = 14;
const DOT = 6;

type P = readonly [number, number];

/** Recorta el cuadrado [−r, r]² con el semiplano w·p + b > 0. Devuelve el polígono (puede ser vacío). */
const halfPlane = (w: P, b: number, r: number): [number, number][] => {
  const square: [number, number][] = [
    [-r, -r],
    [r, -r],
    [r, r],
    [-r, r],
  ];
  const side = (p: P): number => w[0] * p[0] + w[1] * p[1] + b;
  const out: [number, number][] = [];
  for (let k = 0; k < square.length; k++) {
    const from = square[k]!;
    const to = square[(k + 1) % square.length]!;
    const sf = side(from);
    const st = side(to);
    if (sf > 0) out.push(from);
    if (sf > 0 !== st > 0) {
      const u = sf / (sf - st);
      out.push([from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u]);
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

/** El punto a `back` unidades de `to`, hacia `from`: la flecha acaba al borde del punto, no en su centro. */
const pullBack = (from: P, to: P, back: number): [number, number] => {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  if (len === 0) return [to[0], to[1]];
  const u = Math.min(back, len) / len;
  return [to[0] + (from[0] - to[0]) * u, to[1] + (from[1] - to[1]) * u];
};

/** Una celda de matriz: color por signo (verde positivo, rojo negativo) e intensidad por magnitud. */
function Cell({ value, tone }: { value: number; tone?: 0 | 1 }) {
  const sign = Math.abs(value) < 1e-9 ? 'zero' : value > 0 ? 'pos' : 'neg';
  const mag = Math.min(1, Math.abs(value) / 2);
  return (
    <span
      className="lora__cell"
      data-sign={sign}
      data-tone={tone}
      style={{ ['--mag' as string]: mag.toFixed(2) }}
    >
      {fmt(value)}
    </span>
  );
}

function Matrix2({ m, label }: { m: readonly [number, number, number, number]; label: string }) {
  return (
    <div className="lora__grid lora__grid--2" role="group" aria-label={label}>
      <Cell value={m[0]} />
      <Cell value={m[1]} />
      <Cell value={m[2]} />
      <Cell value={m[3]} />
    </div>
  );
}

function Padlock() {
  return (
    <svg className="lora__padlock" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <rect x="3" y="7" width="10" height="8" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" />
    </svg>
  );
}

export function LoraLab({ spec, state, onChange }: LabProps<LoraSpec>) {
  const clipId = `lora-clip-${useId().replace(/:/g, '')}`;
  const { range } = spec;
  const scale = EDGE / range;
  const sx = (x: number): number => CENTER + x * scale;
  const sy = (y: number): number => CENTER - y * scale;
  const at = (p: P): [number, number] => [sx(p[0]), sy(p[1])];

  const mode = loraMode(spec);
  const scene = loraScene(spec, state);
  const values = lora.measure(spec, state);
  const controls = lora.controls(spec);
  const interactive = onChange !== undefined;
  const groups = spec.groups ?? [];
  const groupOf = (id: string): number | undefined => spec.points.find((p) => p.id === id)?.group;

  // --- Rejilla del plano ---
  const step = range > 6 ? 2 : 1;
  const n = Math.floor(range / step);
  const lines = Array.from({ length: 2 * n + 1 }, (_, k) => (k - n) * step);

  // --- Rótulos de las palabras afinadas ---
  const area: Box = { x0: MARGIN, y0: MARGIN, x1: VIEW - MARGIN, y1: VIEW - MARGIN };
  const obstacles: Box[] = spec.points.flatMap((p) => [
    dotBox(at(scene.afterTuning[p.id]!), 8),
    dotBox(at(scene.original[p.id]!), 6),
  ]);
  const labels = spec.points.map((p) => {
    const c = at(scene.afterTuning[p.id]!);
    const placed = placePointLabel(
      p.label,
      LABEL_SIZE,
      c,
      area,
      obstacles,
      c[0] > CENTER ? 'right' : 'left',
    );
    obstacles.push(placed.box);
    return { id: p.id, text: p.label, placed };
  });

  // --- La neurona siguiente ---
  const zone = spec.readout ? halfPlane(spec.readout.w, spec.readout.b, range) : [];
  const boundary: [P, P] | null = (() => {
    if (!spec.readout) return null;
    const { w, b } = spec.readout;
    const cut = zone.filter((p) => Math.abs(w[0] * p[0] + w[1] * p[1] + b) < 1e-9);
    return cut.length >= 2 ? [cut[0]!, cut[1]!] : null;
  })();

  // --- La dirección de B ---
  const [b1, b2] = scene.b;
  const bLen = Math.hypot(b1, b2);
  const showB = mode === 'lora' && bLen > 1e-9;
  const far = range * 6;
  const origin = at([0, 0]);
  const bEnd = at([b1, b2]);
  const bHead = showB ? arrowHead(origin, bEnd) : null;

  const control = (id: string) => controls.find((c) => c.id === id)!;
  const set = (id: string) => (v: number) => onChange?.({ [id]: v });
  const slider = (id: string, label: string) => (
    <Slider
      key={id}
      control={control(id)}
      label={label}
      value={state[id] ?? control(id).start}
      onChange={interactive ? set(id) : undefined}
    />
  );

  const readouts: ReadoutItem[] = (spec.readouts ?? []).flatMap((m) =>
    Object.hasOwn(values, m)
      ? [
          {
            key: m,
            label: L.metric(m),
            value: loraBigMetrics.has(m)
              ? groupedInt(values[m]!)
              : showValue(values[m]!, loraFormats[m]),
          },
        ]
      : [],
  );

  // --- Parámetros de una capa real ---
  const size = spec.size;
  const full = values.params_full;
  const tunedParams = values.params_lora;
  const barWidth = (v: number): number =>
    full! > 1 && v >= 1 ? Math.max(2, (100 * Math.log10(v)) / Math.log10(full!)) : 2;
  const pct = values.saving_pct;
  const pctText = pct !== undefined ? fmt(pct, pct < 10 ? 2 : 1) : '';
  // La frase del porcentaje es una lectura de `saving_pct`: si el contenido declara `readouts` sin ella
  // (una cuenta de «Calcular» cuya respuesta es ese porcentaje), no se pinta.
  const showPercent = !spec.readouts || spec.readouts.includes('saving_pct');

  const figure = (
    <svg
      className={`lab__svg lora__svg${interactive ? ' lab__svg--interactive' : ''}`}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      role={interactive ? 'group' : 'img'}
      aria-label={L.figure(spec.points.length)}
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
        {zone.length >= 3 ? (
          <polygon className="lora__zone" points={zone.map((p) => at(p).join(',')).join(' ')} />
        ) : null}
        <g className="lab__axes">
          <line x1={sx(-range)} y1={sy(0)} x2={sx(range)} y2={sy(0)} />
          <line x1={sx(0)} y1={sy(-range)} x2={sx(0)} y2={sy(range)} />
        </g>
        {boundary ? (
          <line
            className="lora__boundary"
            x1={sx(boundary[0][0])}
            y1={sy(boundary[0][1])}
            x2={sx(boundary[1][0])}
            y2={sy(boundary[1][1])}
          />
        ) : null}
        {showB ? (
          <line
            className="lora__b-line"
            x1={sx((-b1 / bLen) * far)}
            y1={sy((-b2 / bLen) * far)}
            x2={sx((b1 / bLen) * far)}
            y2={sy((b2 / bLen) * far)}
          />
        ) : null}
        {Object.entries(spec.targets ?? {}).map(([id, to]) => {
          const c = at(to);
          const from = scene.afterTuning[id];
          return (
            <g key={id} className="lora__target" data-group={groupOf(id)}>
              {from ? <line x1={sx(from[0])} y1={sy(from[1])} x2={c[0]} y2={c[1]} /> : null}
              <circle cx={c[0]} cy={c[1]} r={10} />
              <circle cx={c[0]} cy={c[1]} r={2} />
            </g>
          );
        })}
        {/* Lo que hace la corrección: de donde dejaba cada palabra el modelo original al modelo afinado. */}
        <g className="lora__shifts">
          {spec.points.map((p) => {
            const from = at(scene.original[p.id]!);
            const to = at(scene.afterTuning[p.id]!);
            const tip = pullBack(from, to, DOT + 1);
            const head = arrowHead(from, tip);
            return (
              <g key={p.id} data-group={p.group}>
                <circle className="lora__ghost" cx={from[0]} cy={from[1]} r={DOT - 1.5} />
                <line x1={from[0]} y1={from[1]} x2={tip[0]} y2={tip[1]} />
                {head ? <polygon points={head} /> : null}
              </g>
            );
          })}
        </g>
      </g>

      {/* Marcas de los ejes, fuera del área. */}
      <g className="lab__ticks" aria-hidden="true">
        {lines
          .filter((k) => k !== 0)
          .map((k) => (
            <g key={k}>
              <text x={sx(k)} y={VIEW - MARGIN + 16} textAnchor="middle">
                {fmt(k)}
              </text>
              <text x={MARGIN - 6} y={sy(k) + 4} textAnchor="end">
                {fmt(k)}
              </text>
            </g>
          ))}
        {spec.axes ? (
          <>
            <text className="lab__axis-name" x={VIEW - MARGIN - 4} y={sy(0) - 8} textAnchor="end">
              {spec.axes[0]}
            </text>
            <text className="lab__axis-name" x={sx(0) + 8} y={MARGIN + 14}>
              {spec.axes[1]}
            </text>
          </>
        ) : null}
      </g>

      <g clipPath={`url(#${clipId})`} aria-hidden="true">
        {showB ? (
          <g className="lora__b">
            <line x1={origin[0]} y1={origin[1]} x2={bEnd[0]} y2={bEnd[1]} />
            {bHead ? <polygon points={bHead} /> : null}
            <text x={bEnd[0] + 10} y={bEnd[1] - 10}>
              {L.directionB}
            </text>
          </g>
        ) : null}
        <g className="lora__points">
          {spec.points.map((p) => {
            const c = at(scene.afterTuning[p.id]!);
            return <circle key={p.id} data-group={p.group} cx={c[0]} cy={c[1]} r={DOT} />;
          })}
        </g>
        <g className="lora__labels">
          {labels.map((l) => (
            <text
              key={l.id}
              data-group={groupOf(l.id)}
              x={l.placed.x}
              y={l.placed.y}
              textAnchor={l.placed.textAnchor}
            >
              {l.text}
            </text>
          ))}
        </g>
      </g>
    </svg>
  );

  return (
    <LabFrame kind="lora" figure={figure}>
      {groups.length > 0 ? (
        <ul className="lora__legend" aria-label={L.legend}>
          {groups.map((name, k) => (
            <li key={name} data-group={k}>
              <span className="lora__legend-dot" aria-hidden="true" />
              {name}
            </li>
          ))}
        </ul>
      ) : null}
      {spec.readout && groups[1] ? <p className="lab__note">{L.zone(groups[1])}</p> : null}
      <p className="lab__note">{L.note}</p>
      <p className="lab__note">{mode === 'lora' ? L.noteLora : L.noteFull}</p>

      <div className="lora__matrices" role="group" aria-label={L.matrices}>
        <div className="lora__matrix lora__matrix--frozen">
          <span className="lora__matrix-title">
            <Padlock />
            {L.frozen}
          </span>
          <Matrix2 m={scene.w} label={L.frozen} />
        </div>
        <span className="lora__sign" aria-hidden="true">
          +
        </span>
        <div className="lora__matrix">
          <span className="lora__matrix-title">{mode === 'lora' ? L.trained : L.trainedFull}</span>
          {mode === 'lora' ? (
            <div className="lora__grid lora__grid--3" role="group" aria-label={L.trained}>
              <span className="lora__corner" aria-hidden="true" />
              <Cell value={scene.a[0]} tone={1} />
              <Cell value={scene.a[1]} tone={1} />
              <Cell value={scene.b[0]} tone={0} />
              <Cell value={scene.delta[0]} />
              <Cell value={scene.delta[1]} />
              <Cell value={scene.b[1]} tone={0} />
              <Cell value={scene.delta[2]} />
              <Cell value={scene.delta[3]} />
            </div>
          ) : (
            <Matrix2 m={scene.delta} label={L.trainedFull} />
          )}
        </div>
        <span className="lora__sign" aria-hidden="true">
          =
        </span>
        <div className="lora__matrix">
          <span className="lora__matrix-title">{L.tuned}</span>
          <Matrix2 m={scene.tuned} label={L.tuned} />
        </div>
      </div>

      {mode === 'lora' ? (
        <>
          <fieldset className="lora__sliders" data-tone={0}>
            <legend>{L.groupB}</legend>
            {slider('b1', L.sliderB1)}
            {slider('b2', L.sliderB2)}
          </fieldset>
          <fieldset className="lora__sliders" data-tone={1}>
            <legend>{L.groupA}</legend>
            {slider('a1', L.sliderA1)}
            {slider('a2', L.sliderA2)}
          </fieldset>
        </>
      ) : (
        <fieldset className="lora__sliders" data-tone={0}>
          <legend>{L.groupD}</legend>
          {slider('d11', L.sliderD(1, 1))}
          {slider('d12', L.sliderD(1, 2))}
          {slider('d21', L.sliderD(2, 1))}
          {slider('d22', L.sliderD(2, 2))}
        </fieldset>
      )}

      {size ? (
        <div className="lora__size" role="group" aria-label={L.size}>
          <span className="lora__size-title">
            {L.size}: {L.sizeLine(size.d, size.k)}
          </span>
          <div className="lora__bar" data-kind="full">
            <span className="lora__bar-label">{L.full}</span>
            <span className="lora__bar-track" aria-hidden="true">
              <span style={{ width: `${barWidth(full!)}%` }} />
            </span>
            <span className="lora__bar-number">{L.barFull(full!)}</span>
          </div>
          <div className="lora__bar" data-kind="lora">
            <span className="lora__bar-label">{L.loraBar}</span>
            <span className="lora__bar-track" aria-hidden="true">
              <span style={{ width: `${barWidth(tunedParams!)}%` }} />
            </span>
            <span className="lora__bar-number">{L.barLora(tunedParams!)}</span>
          </div>
          <Slider
            control={control('r')}
            label={L.rank}
            value={state.r ?? control('r').start}
            onChange={interactive ? set('r') : undefined}
            show={(v) => fmt(v, 0)}
          />
          {showPercent ? <p className="lora__percent">{L.percent(pctText)}</p> : null}
        </div>
      ) : null}
      <Readouts items={readouts} />
    </LabFrame>
  );
}
