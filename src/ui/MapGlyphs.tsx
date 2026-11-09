// Dibujos del mapa y del inicio. Todos repiten lo que ya dice el texto (estado, nota, nivel): son adorno
// para la vista y van ocultos al lector de pantalla.

export type StepState = 'closed' | 'open' | 'validated';

/** Candado (cerrado), círculo (abierto) o marca (validado o aprobado). */
export function StateIcon({ state }: { state: StepState }) {
  return (
    <svg className={`state-icon state-icon--${state}`} viewBox="0 0 20 20" aria-hidden="true">
      {state === 'closed' ? (
        <>
          <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
          <path d="M7 9V6.5a3 3 0 0 1 6 0V9" fill="none" />
        </>
      ) : state === 'validated' ? (
        <>
          <circle cx="10" cy="10" r="8" />
          <path d="M6 10.3l2.7 2.7L14.2 7.4" fill="none" />
        </>
      ) : (
        <circle cx="10" cy="10" r="7" fill="none" />
      )}
    </svg>
  );
}

/** Barra de nota de 0 a 100 con la raya de validar. */
export function MarkBar({ mark, threshold }: { mark: number; threshold: number }) {
  const state = mark >= threshold ? 'ok' : mark > 0 ? 'some' : 'none';
  return (
    <span className={`markbar markbar--${state}`} aria-hidden="true">
      <span className="markbar__fill" style={{ width: `${Math.min(Math.max(mark, 0), 100)}%` }} />
      <span className="markbar__line" style={{ left: `${threshold}%` }} />
    </span>
  );
}

/**
 * Una órbita como un planeta con una luna por proyecto: gris si está cerrado, con borde si está abierto,
 * llena si está validado. El examen es el anillo del planeta: se ilumina al aprobarlo.
 */
export function OrbitGlyph({
  index,
  moons,
  examPassed,
  open,
}: {
  index: number;
  moons: StepState[];
  examPassed: boolean;
  open: boolean;
}) {
  const cx = 34;
  const cy = 30;
  const rx = 28;
  const ry = 11;
  // Las lunas, repartidas por la mitad de delante de la elipse.
  const spots = moons.map((_, i) => {
    const a = Math.PI * (0.15 + (0.7 * (i + 0.5)) / Math.max(moons.length, 1));
    return { x: cx - rx * Math.cos(a), y: cy + ry * Math.sin(a) };
  });
  return (
    <svg
      className={`orbit-glyph${open ? '' : ' orbit-glyph--closed'}${examPassed ? ' orbit-glyph--passed' : ''}`}
      viewBox="0 0 68 48"
      aria-hidden="true"
    >
      <ellipse className="orbit-glyph__path" cx={cx} cy={cy} rx={rx} ry={ry} />
      <circle
        className={`orbit-glyph__planet orbit-glyph__planet--${index % 4}`}
        cx={cx}
        cy={cy - 4}
        r="11"
      />
      <ellipse className="orbit-glyph__ring" cx={cx} cy={cy - 4} rx="16" ry="4.5" />
      {spots.map((p, i) => (
        <circle
          key={i}
          className={`orbit-glyph__moon orbit-glyph__moon--${moons[i]}`}
          cx={p.x}
          cy={p.y}
          r="4"
        />
      ))}
    </svg>
  );
}

/** El emblema de cada juego en el inicio: una flecha, una rejilla deformada o una curva con su tangente. */
export function GameGlyph({ gameId }: { gameId: string }) {
  return (
    <svg className={`game-glyph game-glyph--${gameId}`} viewBox="0 0 48 48" aria-hidden="true">
      <rect className="game-glyph__bg" x="1" y="1" width="46" height="46" rx="10" />
      {gameId === 'vectores' ? (
        <>
          <path className="game-glyph__soft" d="M10 38L38 30" />
          <path className="game-glyph__main" d="M10 38L32 12" />
          <path className="game-glyph__main" d="M24 12.5l8-.5-1 8" />
          <circle className="game-glyph__dot" cx="10" cy="38" r="2.5" />
        </>
      ) : gameId === 'matrices' ? (
        <>
          <path
            className="game-glyph__soft"
            d="M12 36L20 14M22 38L30 16M32 40L40 18M8 26L36 32M10 16L38 22"
          />
          <path className="game-glyph__main" d="M14 34L38 40" />
          <path className="game-glyph__alt" d="M14 34L22 12" />
        </>
      ) : gameId === 'gradiente' ? (
        <>
          <path className="game-glyph__main" d="M8 14C16 40 32 40 40 14" fill="none" />
          <path className="game-glyph__alt" d="M8 34L24 34" />
          <circle className="game-glyph__dot" cx="15" cy="27" r="3" />
          <circle className="game-glyph__dot" cx="24" cy="33.5" r="3" />
        </>
      ) : (
        <circle className="game-glyph__main" cx="24" cy="24" r="10" fill="none" />
      )}
    </svg>
  );
}
