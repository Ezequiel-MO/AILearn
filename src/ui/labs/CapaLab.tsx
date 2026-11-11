import { useId, useRef } from 'react';
import { capaScene, type CapaSpec } from '../../engine/labs/capa';
import { labControls, labMeasure } from '../../engine/labs';
import { fmt, fmtPair } from '../format';
import { dotBox, placePointLabel, type Box } from '../labelPlacement';
import { t } from '../strings';
import { Handle, LabFrame, Readouts, type LabProps, type ReadoutItem } from './parts';
import { capaFormats } from './capa.strings';
import { showValue } from './show';
import './capa.css';

// Geometría en unidades de vista: un cuadrado con el origen en el centro.
const VIEW = 480;
const MARGIN = 26;
const CENTER = VIEW / 2;
const EDGE = CENTER - MARGIN;
const LABEL_SIZE = 14;
/** Ancho aproximado de un carácter del nombre de un eje, para reservarle sitio entre los rótulos. */
const AXIS_NAME_CHAR = 7;

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

export function CapaLab({ spec, state, onChange }: LabProps<CapaSpec>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const clipId = `capa-clip-${useId().replace(/:/g, '')}`;
  const { range, snap } = spec;
  const scale = EDGE / range;
  const sx = (x: number): number => CENTER + x * scale;
  const sy = (y: number): number => CENTER - y * scale;
  const at = (p: P): [number, number] => [sx(p[0]), sy(p[1])];
  const fromView = (v: P): [number, number] => [(v[0] - CENTER) / scale, (CENTER - v[1]) / scale];

  const scene = capaScene(spec, state);
  const values = labMeasure(spec, state);
  const movable = new Set(labControls(spec).map((c) => c.id));
  const interactive = onChange !== undefined;
  const [a11, a12, a21, a22] = scene.a;
  const iTip: P = [a11, a21];
  const jTip: P = [a12, a22];
  const flipped = values.det! < 0;
  const groups = spec.groups ?? [];
  const groupOf = (id: string): number | undefined => spec.points.find((p) => p.id === id)?.group;

  // --- Rejillas ---
  const step = range > 6 ? 2 : 1;
  const n = Math.floor(range / step);
  const lines = Array.from({ length: 2 * n + 1 }, (_, k) => (k - n) * step);
  const far = range * 6;
  const imageLine = (k: number, along: P, across: P): [P, P] => [
    [k * across[0] - far * along[0], k * across[1] - far * along[1]],
    [k * across[0] + far * along[0], k * across[1] + far * along[1]],
  ];

  // Una capa fija que no cambia nada (la identidad) no se dibuja: el laboratorio va solo de los datos.
  const layerShown =
    movable.has('ix') || movable.has('jx') || a11 !== 1 || a12 !== 0 || a21 !== 0 || a22 !== 1;
  // Con la capa a la vista, el plano es el de sus salidas: los rasgos de entrada van en las columnas.
  const axisNames = layerShown ? t.labs.capa.outputs : spec.axes;
  // Con una capa delante, a A no le llega un rasgo suelto: la columna no puede llamarse como él.
  const columnNames = spec.inputs ?? (spec.before ? t.labs.capa.inputs : spec.axes);

  // --- Rótulos de las palabras: cada uno busca sitio sin pisar puntos, nombres de eje ni rótulos ya puestos ---
  const area: Box = { x0: MARGIN, y0: MARGIN, x1: VIEW - MARGIN, y1: VIEW - MARGIN };
  const obstacles: Box[] = spec.points.map((p) => dotBox(at(scene.images[p.id]!), 8));
  if (axisNames) {
    const wide = (name: string): number => name.length * AXIS_NAME_CHAR + 8;
    obstacles.push(
      {
        x0: VIEW - MARGIN - 4 - wide(axisNames[0]),
        y0: sy(0) - 24,
        x1: VIEW - MARGIN,
        y1: sy(0) - 2,
      },
      { x0: sx(0) + 4, y0: MARGIN, x1: sx(0) + 8 + wide(axisNames[1]), y1: MARGIN + 20 },
    );
  }
  const labels = spec.points.map((p) => {
    const c = at(scene.images[p.id]!);
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
    const cut = halfPlane(spec.readout.w, spec.readout.b, range).filter((p) => {
      const s = spec.readout!.w[0] * p[0] + spec.readout!.w[1] * p[1] + spec.readout!.b;
      return Math.abs(s) < 1e-9;
    });
    return cut.length >= 2 ? [cut[0]!, cut[1]!] : null;
  })();

  // --- La dirección v y las proyecciones sobre su recta ---
  const v = scene.v;
  const vn = v ? Math.hypot(v[0], v[1]) : 0;
  const unit: P | null = v && vn > 0 ? [v[0] / vn, v[1] / vn] : null;
  const feet = unit
    ? spec.points.map((p) => {
        const src = scene.projected[p.id]!;
        const along = src[0] * unit[0] + src[1] * unit[1];
        return { id: p.id, src, foot: [along * unit[0], along * unit[1]] as P };
      })
    : [];

  const circlePath = (m: readonly [number, number, number, number] | null): string =>
    Array.from({ length: 73 }, (_, k) => {
      const ang = (k / 72) * 2 * Math.PI;
      const c: P = [Math.cos(ang), Math.sin(ang)];
      const p: P = m ? [m[0] * c[0] + m[1] * c[1], m[2] * c[0] + m[3] * c[1]] : c;
      return `${k === 0 ? 'M' : 'L'}${sx(p[0]).toFixed(2)},${sy(p[1]).toFixed(2)}`;
    }).join(' ');

  // --- Arrastre ---
  const move = (idX: string, idY: string) => ({
    onDragTo: (to: [number, number]) => {
      const [x, y] = fromView(to);
      onChange?.({ [idX]: x, [idY]: y });
    },
    onStep: (dx: number, dy: number) =>
      onChange?.({ [idX]: (state[idX] ?? 0) + dx * snap, [idY]: (state[idY] ?? 0) + dy * snap }),
  });

  const origin = at([0, 0]);
  const column = (tip: P, tone: number, name: string) => {
    const end = at(tip);
    const head = arrowHead(origin, end);
    return (
      <g className="capa__column" data-tone={tone} aria-hidden="true">
        <line x1={origin[0]} y1={origin[1]} x2={end[0]} y2={end[1]} />
        {head ? <polygon points={head} /> : null}
        <text x={end[0] + 10} y={end[1] - 10}>
          {name}
        </text>
      </g>
    );
  };

  const L = t.labs.capa;
  const readouts: ReadoutItem[] = (spec.readouts ?? []).flatMap((m) =>
    Object.hasOwn(values, m)
      ? [{ key: m, label: L.metric(m, spec), value: showValue(values[m]!, capaFormats[m]) }]
      : [],
  );

  const figure = (
    <svg
      ref={svgRef}
      className={`lab__svg capa__svg${interactive ? ' lab__svg--interactive' : ''}`}
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
          <polygon className="capa__zone" points={zone.map((p) => at(p).join(',')).join(' ')} />
        ) : null}
        <g className="capa__image-grid">
          {lines.map((k) => {
            const [p0, p1] = imageLine(k, jTip, iTip);
            const [q0, q1] = imageLine(k, iTip, jTip);
            return (
              <g key={k}>
                <line x1={sx(p0[0])} y1={sy(p0[1])} x2={sx(p1[0])} y2={sy(p1[1])} />
                <line x1={sx(q0[0])} y1={sy(q0[1])} x2={sx(q1[0])} y2={sy(q1[1])} />
              </g>
            );
          })}
        </g>
        <polygon
          className={`capa__unit${flipped ? ' capa__unit--flipped' : ''}`}
          points={[[0, 0] as P, iTip, [iTip[0] + jTip[0], iTip[1] + jTip[1]] as P, jTip]
            .map((p) => at(p).join(','))
            .join(' ')}
        />
        <g className="lab__axes">
          <line x1={sx(-range)} y1={sy(0)} x2={sx(range)} y2={sy(0)} />
          <line x1={sx(0)} y1={sy(-range)} x2={sx(0)} y2={sy(range)} />
        </g>
        {spec.circle ? (
          <>
            <path className="capa__circle" d={circlePath(null)} />
            <path className="capa__ellipse" d={circlePath(scene.a)} />
          </>
        ) : null}
        {boundary ? (
          <line
            className="capa__boundary"
            x1={sx(boundary[0][0])}
            y1={sy(boundary[0][1])}
            x2={sx(boundary[1][0])}
            y2={sy(boundary[1][1])}
          />
        ) : null}
        {unit ? (
          <line
            className="capa__probe-line"
            x1={sx(-unit[0] * far)}
            y1={sy(-unit[1] * far)}
            x2={sx(unit[0] * far)}
            y2={sy(unit[1] * far)}
          />
        ) : null}
        {/* De dónde viene cada palabra: su sitio antes de la capa y el camino hasta el nuevo. */}
        <g className="capa__trails">
          {spec.points.map((p) => {
            const from = at([p.x, p.y]);
            const mid = at(scene.middle[p.id]!);
            const to = at(scene.images[p.id]!);
            return (
              <g key={p.id} data-group={p.group}>
                <polyline
                  points={
                    spec.before
                      ? `${from.join(',')} ${mid.join(',')} ${to.join(',')}`
                      : `${from.join(',')} ${to.join(',')}`
                  }
                />
                <circle className="capa__ghost" cx={from[0]} cy={from[1]} r={3.5} />
                {spec.before ? (
                  <rect className="capa__mid" x={mid[0] - 3} y={mid[1] - 3} width={6} height={6} />
                ) : null}
              </g>
            );
          })}
        </g>
        {Object.entries(spec.targets ?? {}).map(([id, to]) => {
          const c = at(to);
          const from = scene.images[id];
          return (
            <g key={id} className="capa__target" data-group={groupOf(id)}>
              {from ? <line x1={sx(from[0])} y1={sy(from[1])} x2={c[0]} y2={c[1]} /> : null}
              <circle cx={c[0]} cy={c[1]} r={10} />
              <circle cx={c[0]} cy={c[1]} r={2} />
            </g>
          );
        })}
        {feet.map((f) => {
          const src = at(f.src);
          const foot = at(f.foot);
          return (
            <g key={f.id} className="capa__foot" data-group={groupOf(f.id)}>
              <line x1={src[0]} y1={src[1]} x2={foot[0]} y2={foot[1]} />
              <circle cx={foot[0]} cy={foot[1]} r={4} />
            </g>
          );
        })}
        {scene.path.length > 1 ? (
          <g className="capa__path">
            <polyline points={scene.path.map((p) => at(p).join(',')).join(' ')} />
            {scene.path.slice(1).map((p, k) => (
              <circle key={k} cx={sx(p[0])} cy={sy(p[1])} r={4} />
            ))}
          </g>
        ) : null}
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
        {axisNames ? (
          <>
            <text className="lab__axis-name" x={VIEW - MARGIN - 4} y={sy(0) - 8} textAnchor="end">
              {axisNames[0]}
            </text>
            <text className="lab__axis-name" x={sx(0) + 8} y={MARGIN + 14}>
              {axisNames[1]}
            </text>
          </>
        ) : null}
      </g>

      <g clipPath={`url(#${clipId})`}>
        {layerShown ? column(iTip, 0, 'î') : null}
        {layerShown ? column(jTip, 1, 'ĵ') : null}
        {v ? column(v, 2, 'v') : null}
        <g className="capa__points" aria-hidden="true">
          {spec.points.map((p) => {
            const c = at(scene.images[p.id]!);
            return <circle key={p.id} data-group={p.group} cx={c[0]} cy={c[1]} r={6} />;
          })}
        </g>
        <g className="capa__labels" aria-hidden="true">
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

      {interactive && movable.has('ix') ? (
        <Handle
          svgRef={svgRef}
          view={[VIEW, VIEW]}
          at={at(iTip)}
          tone={0}
          label={L.handleI(fmtPair([iTip[0], iTip[1]]))}
          {...move('ix', 'iy')}
        />
      ) : null}
      {interactive && movable.has('jx') ? (
        <Handle
          svgRef={svgRef}
          view={[VIEW, VIEW]}
          at={at(jTip)}
          tone={1}
          label={L.handleJ(fmtPair([jTip[0], jTip[1]]))}
          {...move('jx', 'jy')}
        />
      ) : null}
      {interactive && v && movable.has('vx') ? (
        <Handle
          svgRef={svgRef}
          view={[VIEW, VIEW]}
          at={at(v)}
          tone={2}
          label={L.handleV(fmtPair([v[0], v[1]]))}
          {...move('vx', 'vy')}
        />
      ) : null}
    </svg>
  );

  return (
    <LabFrame kind="capa" figure={figure}>
      {groups.length > 0 ? (
        <ul className="capa__legend" aria-label={L.legend}>
          {groups.map((name, k) => (
            <li key={name} data-group={k}>
              <span className="capa__legend-dot" aria-hidden="true" />
              {name}
            </li>
          ))}
        </ul>
      ) : null}
      {spec.readout && (spec.readout.says ?? groups[1]) ? (
        <p className="lab__note">{L.zone(spec.readout.says ?? groups[1]!)}</p>
      ) : null}
      <div className="capa__matrix" role="group" aria-label={L.matrix} hidden={!layerShown}>
        <span className="capa__matrix-title">{L.matrix}</span>
        <table>
          <thead>
            <tr>
              <td className="capa__matrix-corner" />
              <th scope="col" data-tone={0}>
                {L.column('î', columnNames?.[0])}
              </th>
              <th scope="col" data-tone={1}>
                {L.column('ĵ', columnNames?.[1])}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{L.outputs[0]}</th>
              <td data-tone={0}>{fmt(a11)}</td>
              <td data-tone={1}>{fmt(a12)}</td>
            </tr>
            <tr>
              <th scope="row">{L.outputs[1]}</th>
              <td data-tone={0}>{fmt(a21)}</td>
              <td data-tone={1}>{fmt(a22)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {spec.before ? <p className="lab__note">{L.before}</p> : null}
      <Readouts items={readouts} />
    </LabFrame>
  );
}
