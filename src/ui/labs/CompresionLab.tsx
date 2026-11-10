import { Fragment } from 'react';
import { compresion, compresionScene, type CompresionSpec } from '../../engine/labs/compresion';
import { fmt } from '../format';
import { LabFrame, Readouts, Slider, type LabProps, type ReadoutItem } from './parts';
import { compresionFormats, compresionStrings } from './compresion.strings';
import { showValue } from './show';
import './compresion.css';

type Matrix = readonly (readonly number[])[];
type Paint = 'gray' | 'signed' | 'bad';

const maxAbs = (ms: readonly Matrix[]): number =>
  Math.max(0, ...ms.flatMap((m) => m.flatMap((row) => row.map(Math.abs))));

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/**
 * Una matriz como rejilla de celdas. `gray`: 0 negro y 1 blanco. `signed`: negativo y positivo en dos
 * colores, con la intensidad por |valor| / scale. `bad`: |valor| / scale en el color del error.
 */
function Grid({
  rows,
  paint,
  scale,
  label,
  labels,
  small,
}: {
  rows: Matrix;
  paint: Paint;
  scale: number;
  label: string;
  labels?: CompresionSpec['labels'];
  small?: boolean;
}) {
  const m = rows.length;
  const n = rows[0]?.length ?? 0;
  const cell = small ? 12 : labels ? 36 : 24;
  const left = labels?.rows ? 64 : 0;
  const top = labels?.cols ? 22 : 0;
  const width = left + n * cell;
  const height = top + m * cell;
  return (
    <svg
      className={`compresion__grid${small ? ' compresion__grid--small' : ''}`}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
    >
      <rect className="compresion__bg" x={left} y={top} width={n * cell} height={m * cell} />
      {rows.map((row, r) =>
        row.map((v, c) => {
          let cls = 'compresion__cell';
          let alpha: number;
          if (paint === 'gray') {
            cls += ' compresion__cell--gray';
            alpha = clamp01(v);
          } else if (paint === 'bad') {
            cls += ' compresion__cell--bad';
            alpha = scale > 0 ? clamp01(Math.abs(v) / scale) : 0;
          } else {
            cls += v < 0 ? ' compresion__cell--neg' : ' compresion__cell--pos';
            alpha = scale > 0 ? clamp01(Math.abs(v) / scale) : 0;
          }
          return (
            <rect
              key={`${r}-${c}`}
              className={cls}
              x={left + c * cell}
              y={top + r * cell}
              width={cell}
              height={cell}
              fillOpacity={alpha}
            />
          );
        }),
      )}
      {!small && labels?.cols
        ? labels.cols.map((name, c) => (
            <text
              key={`c${c}`}
              className="compresion__label"
              x={left + (c + 0.5) * cell}
              y={top - 6}
              textAnchor="middle"
              aria-hidden="true"
            >
              {name}
            </text>
          ))
        : null}
      {!small && labels?.rows
        ? labels.rows.map((name, r) => (
            <text
              key={`r${r}`}
              className="compresion__label"
              x={left - 6}
              y={top + (r + 0.5) * cell + 4}
              textAnchor="end"
              aria-hidden="true"
            >
              {name}
            </text>
          ))
        : null}
    </svg>
  );
}

export function CompresionLab({ spec, state, onChange }: LabProps<CompresionSpec>) {
  const L = compresionStrings;
  const scene = compresionScene(spec, state);
  const values = compresion.measure(spec, state);
  const controls = compresion.controls(spec);
  const pick = (spec.mode ?? 'top') === 'pick';
  const { m, n, sigma, layers, chosen } = scene;
  const k = values.k!;

  const signed = spec.signed === true;
  const baseScale = maxAbs([spec.rows]);
  const layerScale = maxAbs(layers);
  // Una imagen: el error se pinta con una escala más sensible (0,5), para que se vea lo que se pierde.
  const errorScale = signed ? baseScale : 0.5;
  const paint: Paint = signed ? 'signed' : 'gray';
  const original = spec.caption ?? 'Matriz original';

  const readouts: ReadoutItem[] = (spec.readouts ?? []).flatMap((name) =>
    Object.hasOwn(values, name)
      ? [
          {
            key: name,
            label: L.metric(name),
            value: showValue(values[name]!, compresionFormats[name]),
          },
        ]
      : [],
  );

  const sigmaTop = sigma[0] ?? 0;
  const bigger = Math.max(values.full!, values.stored!);

  const figure = (
    <div className="compresion" role="group" aria-label={L.figure(m, n)}>
      <div className="compresion__matrices">
        <figure className="compresion__matrix">
          <Grid
            rows={spec.rows}
            paint={paint}
            scale={baseScale}
            label={L.matrixLabel(L.original)}
            labels={spec.labels}
          />
          <figcaption>
            <strong>{L.original}</strong>
            <span>{original}</span>
          </figcaption>
        </figure>
        <figure className="compresion__matrix">
          <Grid
            rows={scene.approx}
            paint={paint}
            scale={baseScale}
            label={L.matrixLabel(L.approx(k))}
            labels={spec.labels}
          />
          <figcaption>
            <strong>{L.approx(k)}</strong>
            <span>{`Error ${showValue(values.error!, 'percent')}`}</span>
          </figcaption>
        </figure>
        <figure className="compresion__matrix compresion__matrix--lost">
          <Grid
            rows={scene.error}
            paint="bad"
            scale={errorScale}
            label={L.matrixLabel(L.lost)}
            labels={spec.labels}
          />
          <figcaption>
            <strong>{L.lost}</strong>
            <span>{`Mayor error en una celda: ${fmt(values.max_err!)}`}</span>
          </figcaption>
        </figure>
      </div>

      <section className="compresion__section" aria-label={L.layers}>
        <h4 className="compresion__title">{L.layers}</h4>
        <ol className="compresion__strip">
          {layers.map((layer, i) => (
            <Fragment key={i}>
              {i > 0 ? (
                <li className="compresion__plus" aria-hidden="true">
                  +
                </li>
              ) : null}
              <li className={`compresion__layer${chosen[i] ? ' compresion__layer--on' : ''}`}>
                <Grid
                  rows={layer}
                  paint="signed"
                  scale={layerScale}
                  small
                  label={L.layer(i + 1, fmt(sigma[i]!), chosen[i]!)}
                />
                <span className="compresion__layer-sigma" aria-hidden="true">{`σ${i + 1}`}</span>
              </li>
            </Fragment>
          ))}
        </ol>
        <p className="lab__note">{L.layersNote}</p>
      </section>

      <section className="compresion__section" aria-label={L.sigmas}>
        <h4 className="compresion__title">{L.sigmas}</h4>
        <ul className="compresion__bars">
          {sigma.map((s, i) => (
            <li key={i} className={`compresion__bar${chosen[i] ? ' compresion__bar--on' : ''}`}>
              <span className="compresion__bar-name">{L.sigmaRow(i + 1)}</span>
              <span className="compresion__bar-track" aria-hidden="true">
                <span
                  className="compresion__bar-fill"
                  style={{ width: `${sigmaTop > 0 ? (s / sigmaTop) * 100 : 0}%` }}
                />
              </span>
              <span className="compresion__bar-value">{fmt(s)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="compresion__section" aria-label={L.storage}>
        <h4 className="compresion__title">{L.storage}</h4>
        <div className="compresion__store">
          <span className="compresion__store-text">{L.storageFull(values.full!)}</span>
          <span className="compresion__bar-track" aria-hidden="true">
            <span
              className="compresion__bar-fill compresion__bar-fill--full"
              style={{ width: `${(values.full! / bigger) * 100}%` }}
            />
          </span>
          <span className="compresion__store-text">{L.storageKept(values.stored!)}</span>
          <span className="compresion__bar-track" aria-hidden="true">
            <span
              className="compresion__bar-fill"
              style={{ width: `${(values.stored! / bigger) * 100}%` }}
            />
          </span>
        </div>
      </section>
    </div>
  );

  return (
    <LabFrame kind="compresion" figure={figure}>
      {pick ? (
        <div className="lab__choice" role="group" aria-label={L.pickLegend}>
          <span className="lab__choice-legend">{L.pickLegend}</span>
          {controls.map((c, i) => {
            const on = chosen[i] === true;
            return (
              <button
                key={c.id}
                type="button"
                className={`lab__choice-option${on ? ' lab__choice-option--on' : ''}`}
                aria-pressed={on}
                disabled={!onChange}
                onClick={() => onChange?.({ [c.id]: on ? 0 : 1 })}
              >
                {L.pickOption(i + 1)}
              </button>
            );
          })}
        </div>
      ) : (
        <Slider
          control={controls[0]!}
          label={L.sliderLabel}
          value={k}
          show={(v) => fmt(v, 0)}
          onChange={onChange ? (v) => onChange({ k: v }) : undefined}
        />
      )}
      <Readouts items={readouts} />
    </LabFrame>
  );
}
