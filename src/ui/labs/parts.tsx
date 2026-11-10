import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import type { LabControl, LabState } from '../../engine/labs';
import { fmt } from '../format';
import './labs.css';

/**
 * Lo que recibe todo laboratorio. Sin `onChange` es una figura quieta (la pregunta está cerrada).
 * `onChange` recibe solo los mandos que cambian; quien lo monta los asienta en su rejilla.
 */
export interface LabProps<S> {
  spec: S;
  state: LabState;
  onChange?: (patch: LabState) => void;
}

const STEP_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

/** Radio (en unidades de vista) de la zona que responde al dedo alrededor de un tirador. */
const HIT_RADIUS = 24;

/**
 * Tirador arrastrable dentro de un SVG: ratón, dedo, lápiz (con captura del puntero) y flechas del
 * teclado. Trabaja en unidades de vista (`viewBox`); quien lo usa convierte a unidades del dato.
 */
export function Handle({
  svgRef,
  view,
  at,
  label,
  tone = 0,
  onDragTo,
  onStep,
}: {
  svgRef: RefObject<SVGSVGElement | null>;
  /** Ancho y alto del `viewBox`. */
  view: readonly [number, number];
  /** Centro del tirador, en unidades de vista. */
  at: readonly [number, number];
  /** Nombre accesible: qué es y dónde está. */
  label: string;
  /** Ranura de color (0 a 3). */
  tone?: number;
  /** Nueva posición pedida, en unidades de vista. */
  onDragTo: (to: [number, number]) => void;
  /** Un paso con las flechas: dirección en x e y (arriba es +1). */
  onStep: (dx: number, dy: number) => void;
}) {
  const drag = useRef<{ pointerId: number; offset: [number, number] } | null>(null);
  const [dragging, setDragging] = useState(false);

  const toView = (clientX: number, clientY: number): [number, number] | null => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return [
      ((clientX - rect.left) / rect.width) * view[0],
      ((clientY - rect.top) / rect.height) * view[1],
    ];
  };

  const onPointerDown = (e: PointerEvent<SVGGElement>) => {
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault();
    e.currentTarget.focus();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = toView(e.clientX, e.clientY);
    drag.current = { pointerId: e.pointerId, offset: p ? [p[0] - at[0], p[1] - at[1]] : [0, 0] };
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<SVGGElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const p = toView(e.clientX, e.clientY);
    if (p) onDragTo([p[0] - d.offset[0], p[1] - d.offset[1]]);
  };
  const end = (e: PointerEvent<SVGGElement>) => {
    if (!drag.current) return;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    drag.current = null;
    setDragging(false);
  };
  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    const dir = STEP_KEYS[e.key];
    if (!dir) return;
    e.preventDefault();
    onStep(dir[0], dir[1]);
  };

  return (
    <g
      className={`lab__handle${dragging ? ' lab__handle--dragging' : ''}`}
      data-tone={tone}
      role="button"
      tabIndex={0}
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={onKeyDown}
    >
      <circle className="lab__handle-hit" cx={at[0]} cy={at[1]} r={HIT_RADIUS} />
      <circle className="lab__handle-ring" cx={at[0]} cy={at[1]} r={11} />
      <circle className="lab__handle-dot" cx={at[0]} cy={at[1]} r={6.5} />
    </g>
  );
}

/** Un mando deslizante con su rótulo y su valor. Sin `onChange` queda desactivado. */
export function Slider({
  control,
  label,
  value,
  onChange,
  show,
}: {
  control: LabControl;
  label: ReactNode;
  value: number;
  onChange?: (value: number) => void;
  /** Cómo se escribe el valor (por defecto, decimal con coma). */
  show?: (value: number) => string;
}) {
  return (
    <label className="lab__slider">
      <span className="lab__slider-label">{label}</span>
      <input
        className="lab__slider-input"
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={value}
        disabled={!onChange}
        onChange={(e) => onChange?.(Number(e.target.value))}
      />
      <output className="lab__slider-value">{(show ?? fmt)(value)}</output>
    </label>
  );
}

/** Opciones excluyentes (una función de activación, un optimizador…) sobre un mando entero. */
export function Choice({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly string[];
  value: number;
  onChange?: (value: number) => void;
}) {
  return (
    <div className="lab__choice" role="group" aria-label={legend}>
      <span className="lab__choice-legend">{legend}</span>
      {options.map((text, k) => (
        <button
          key={text}
          type="button"
          className={`lab__choice-option${k === value ? ' lab__choice-option--on' : ''}`}
          aria-pressed={k === value}
          disabled={!onChange}
          onClick={() => onChange?.(k)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export interface ReadoutItem {
  key: string;
  label: ReactNode;
  value: string;
}

/** Las lecturas del laboratorio: pares rótulo y valor. */
export function Readouts({ items }: { items: readonly ReadoutItem[] }) {
  if (items.length === 0) return null;
  return (
    <dl className="lab__readouts">
      {items.map((it) => (
        <div key={it.key} className="lab__readout">
          <dt>{it.label}</dt>
          <dd>
            <output>{it.value}</output>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Marco común: la figura a un lado y, al otro, mandos y lecturas. */
export function LabFrame({
  kind,
  figure,
  children,
}: {
  kind: string;
  figure: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={`lab lab--${kind}`}>
      <div className="lab__figure">{figure}</div>
      {children ? <div className="lab__side">{children}</div> : null}
    </div>
  );
}

/** Escala lineal de [d0, d1] a [r0, r1]. */
export const linear =
  (d0: number, d1: number, r0: number, r1: number) =>
  (v: number): number =>
    r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);

/** Marcas «redondas» entre lo y hi: como mucho `max`. */
export const ticks = (lo: number, hi: number, max = 8): number[] => {
  const span = hi - lo;
  if (!(span > 0)) return [];
  const raw = span / max;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => span / s <= max) ?? 10 * pow;
  const first = Math.ceil(lo / step - 1e-9);
  const last = Math.floor(hi / step + 1e-9);
  return Array.from({ length: last - first + 1 }, (_, k) =>
    Number(((first + k) * step).toFixed(10)),
  );
};
