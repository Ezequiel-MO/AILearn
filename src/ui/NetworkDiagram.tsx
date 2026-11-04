import { useId } from 'react';
import type { KeyboardEvent } from 'react';
import type { NetworkPart } from '../content/schema';
import { NETWORK_PARTS } from '../content/schema';
import { network } from '../games/network';
import { t } from './strings';

/**
 * «La red por dentro»: dibujo propio (SVG) de un modelo de lenguaje pequeño. Columna izquierda, el
 * camino «Responder» de arriba abajo (tokens, embeddings, un bloque que se repite, salida); columna
 * derecha, las herramientas de «Alrededor» enganchadas a lo que usan y el bucle «Aprender»
 * (pérdida, gradiente, actualizar) que vuelve a los pesos. La geometría está pensada para 360 unidades
 * de ancho: a 390 px de pantalla el texto sale a su tamaño (11 a 13 px).
 */

const W = 360;
const MAIN_W = 220;
const SIDE_X = 238;
const SIDE_W = W - SIDE_X;
const INSET = 10;
const GAP = 16;
const LINE = 14;

/** Parte un texto en líneas de como mucho `max` caracteres (estimación: sin medir la tipografía). */
export function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && line.length + 1 + word.length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

interface Box {
  part: NetworkPart;
  x: number;
  y: number;
  w: number;
  h: number;
  name: string[];
  short: string[];
}

export interface NetworkDiagramProps {
  /** Piezas resaltadas (las del proyecto). Vacío: ninguna se atenúa. */
  highlight: readonly NetworkPart[];
  selected?: NetworkPart;
  /** Con él, cada pieza es un botón. */
  onSelect?: (part: NetworkPart) => void;
  /** Sin la frase bajo cada nombre. */
  compact?: boolean;
}

export function NetworkDiagram({
  highlight,
  selected,
  onSelect,
  compact = false,
}: NetworkDiagramProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const mid = `red-arrow-${uid}`;
  const lid = `red-loop-${uid}`;

  const box = (
    part: NetworkPart,
    x: number,
    w: number,
    withShort: boolean,
    nameMax: number,
    shortMax: number,
    minH = 0,
  ): Box => {
    const name = wrap(network[part].name, nameMax);
    const short = withShort ? wrap(network[part].short, shortMax) : [];
    const h = Math.max(minH, 14 + name.length * LINE + short.length * (LINE - 1));
    return { part, x, y: 0, w, h, name, short };
  };
  const at = (b: Box, y: number): Box => ({ ...b, y });

  // Camino «Responder».
  const s = !compact;
  const inner = MAIN_W - 2 * INSET;
  let y = 18;
  const tokens = at(box('tokens', 0, MAIN_W, s, 26, 31), y);
  y += tokens.h + GAP;
  const embedding = at(box('embedding', 0, MAIN_W, s, 26, 31), y);
  y += embedding.h + GAP;
  const frameTop = y;
  y += 22;
  const attention = at(box('attention', INSET, inner, s, 26, 31), y);
  y += attention.h + 8;
  const mlpTop = y;
  const linear = at(box('linear', INSET + 4, inner - 8, s, 26, 29), mlpTop + 4);
  const activation = at(
    box('activation', INSET + 10, inner - 20, s, 26, 27),
    linear.y + linear.h + 2,
  );
  const mlpH = activation.y + activation.h + 6 - mlpTop;
  y = mlpTop + mlpH + 8;
  const norm = at(box('norm', INSET, inner, s, 26, 31), y);
  y += norm.h + INSET;
  const frameH = y - frameTop;
  y += GAP;
  // Columna derecha: «Alrededor» (a la altura de lo que usan) y el bucle «Aprender» (desde la salida).
  const side = (part: NetworkPart) => box(part, SIDE_X, SIDE_W, false, 15, 0, 30);
  const centered = (b: Box, ref: Box): Box => at(b, ref.y + (ref.h - b.h) / 2);
  const compress = at(side('compress'), linear.y);
  const output0 = box('output', 0, MAIN_W, s, 26, 31);
  const lossH = side('loss').h;
  const loopH = side('gradient').h + side('update').h + 2 * GAP;
  // Si el bucle no cabe bajo «Comprimir y afinar» (con su rótulo), la salida baja lo que falte.
  const lossTop0 = y + (output0.h - lossH) / 2;
  const extra = Math.max(0, compress.y + compress.h + 24 - (lossTop0 - loopH));
  const output = at(output0, y + extra);
  const height = output.y + output.h + 2;
  const inspect = centered(side('inspect'), tokens);
  const search = centered(side('search'), embedding);
  const loss = centered(side('loss'), output);
  const gradient0 = side('gradient');
  const gradient = at(gradient0, loss.y - GAP - gradient0.h);
  const update0 = side('update');
  const update = at(update0, gradient.y - GAP - update0.h);

  const boxes: Box[] = [
    tokens,
    embedding,
    attention,
    linear,
    activation,
    norm,
    output,
    loss,
    gradient,
    update,
    search,
    inspect,
    compress,
  ];
  const on = new Set<NetworkPart>(highlight);
  const dimming = on.size > 0;

  const cx = (b: Box) => b.x + b.w / 2;
  const cy = (b: Box) => b.y + b.h / 2;
  const downTo = (fromY: number, toY: number, x: number) => `M${x},${fromY} V${toY}`;
  const bottom = (b: Box) => b.y + b.h;

  const label =
    !onSelect && on.size > 0
      ? t.network.diagramLabelOn(NETWORK_PARTS.filter((p) => on.has(p)).map((p) => network[p].name))
      : t.network.diagramLabel;

  const onKey = (part: NetworkPart) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(part);
    }
  };

  const node = (b: Box) => {
    const active = on.has(b.part);
    const cls = [
      'red__node',
      active ? 'red__node--on' : dimming ? 'red__node--dim' : '',
      selected === b.part ? 'red__node--sel' : '',
      onSelect ? 'red__node--click' : '',
    ]
      .filter(Boolean)
      .join(' ');
    const lines = [
      ...b.name.map((text) => ({ text, name: true })),
      ...b.short.map((text) => ({ text, name: false })),
    ];
    return (
      <g
        key={b.part}
        className={cls}
        data-part={b.part}
        data-on={active ? 'true' : 'false'}
        {...(onSelect
          ? {
              role: 'button',
              tabIndex: 0,
              'aria-label': network[b.part].name,
              'aria-pressed': selected === b.part,
              onClick: () => onSelect(b.part),
              onKeyDown: onKey(b.part),
            }
          : {})}
      >
        <rect
          className="red__ring"
          x={b.x - 3}
          y={b.y - 3}
          width={b.w + 6}
          height={b.h + 6}
          rx={9}
        />
        <rect className="red__box" x={b.x} y={b.y} width={b.w} height={b.h} rx={6} />
        <text className="red__text" x={b.x + 8} y={b.y + 18}>
          {lines.map((l, i) => (
            <tspan
              key={i}
              className={l.name ? 'red__name' : 'red__short'}
              x={b.x + 8}
              dy={i === 0 ? 0 : !l.name && lines[i - 1].name ? LINE : LINE - 1}
            >
              {l.text}
            </tspan>
          ))}
        </text>
      </g>
    );
  };

  return (
    <svg
      className={`red${compact ? ' red--compact' : ''}`}
      viewBox={`0 0 ${W} ${height}`}
      role={onSelect ? 'group' : 'img'}
      aria-label={label}
    >
      <defs>
        <marker
          id={mid}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 z" className="red__head" />
        </marker>
        <marker
          id={lid}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 z" className="red__head red__head--loop" />
        </marker>
      </defs>

      <text className="red__group" x={0} y={11}>
        {t.network.groups.use}
      </text>
      <text className="red__group" x={SIDE_X} y={11}>
        {t.network.groups.around}
      </text>

      {/* Marco del bloque que se repite, y el MLP dentro */}
      <rect className="red__frame" x={0} y={frameTop} width={MAIN_W} height={frameH} rx={8} />
      <text className="red__frame-label" x={INSET} y={frameTop + 15}>
        {t.network.block}
      </text>
      <rect className="red__mlp" x={INSET} y={mlpTop} width={inner} height={mlpH} rx={7} />

      {/* Camino de «Responder» */}
      <g className="red__arrows" aria-hidden="true">
        <path d={downTo(bottom(tokens), embedding.y, cx(tokens))} markerEnd={`url(#${mid})`} />
        <path d={downTo(bottom(embedding), frameTop, cx(tokens))} markerEnd={`url(#${mid})`} />
        <path d={downTo(bottom(attention), mlpTop, cx(attention))} markerEnd={`url(#${mid})`} />
        <path d={downTo(mlpTop + mlpH, norm.y, cx(attention))} markerEnd={`url(#${mid})`} />
        <path d={downTo(frameTop + frameH, output.y, cx(tokens))} markerEnd={`url(#${mid})`} />
      </g>

      {/* Alrededor: conectores a lo que usan (bajo las cajas) */}
      <path
        className="red__link"
        aria-hidden="true"
        d={`M${inspect.x},${cy(inspect)} H${SIDE_X - 8} V${cy(embedding)} H${MAIN_W} M${search.x},${cy(search)} H${SIDE_X - 8} M${compress.x},${cy(compress)} H${INSET + inner}`}
      />

      {/* Aprender: el bucle */}
      <text className="red__group red__group--loop" x={SIDE_X} y={update.y - 6}>
        {t.network.groups.train}
      </text>
      <g className="red__arrows red__arrows--loop" aria-hidden="true">
        <path d={`M${MAIN_W},${cy(output)} H${SIDE_X}`} markerEnd={`url(#${lid})`} />
        <path d={downTo(loss.y, bottom(gradient), cx(loss))} markerEnd={`url(#${lid})`} />
        <path d={downTo(gradient.y, bottom(update), cx(gradient))} markerEnd={`url(#${lid})`} />
        <path d={`M${SIDE_X},${cy(update)} H${MAIN_W}`} markerEnd={`url(#${lid})`} />
      </g>

      {boxes.map((b) => node(b))}
    </svg>
  );
}
