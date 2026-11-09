import { useEffect, useRef, useSyncExternalStore } from 'react';
import { ACHIEVEMENTS, levelProgress, type AchievementId } from '../engine/rewards';
import { burst, centerOf, floatText } from './fx/effects';
import { browserFx } from './fx/motion';
import { isSoundOn, setSoundOn, sounds, subscribeSound } from './fx/sound';
import { t } from './strings';

/**
 * Barra de avance hacia el siguiente nivel. Repite lo que ya dice el texto «Nivel 1,33»: es adorno para la
 * vista (oculta al lector) y su `title` dice cuánto falta. Crece con una transición al ganar XP.
 */
export function LevelBar({ points, big = false }: { points: number; big?: boolean }) {
  const { whole, fraction, toNext } = levelProgress(points);
  return (
    <span
      className={`xpbar${big ? ' xpbar--big' : ''}`}
      aria-hidden="true"
      title={t.fx.levelBar(toNext, whole + 1)}
    >
      <span className="xpbar__fill" style={{ width: `${(fraction * 100).toFixed(1)}%` }} />
    </span>
  );
}

const STAR_PATH = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z';

/** Estrellas de una tanda (0 a 3), que se encienden una a una. */
export function Stars({ n, max = 3 }: { n: number; max?: number }) {
  return (
    <span className="stars" role="img" aria-label={t.fx.stars(n, max)} title={t.fx.starsHelp}>
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          className={`stars__star${i < n ? ' stars__star--on' : ''}`}
          style={{ animationDelay: `${150 + i * 220}ms` }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

/**
 * Cabeza de un panel de resultado: estrellas (si las hay) y el XP ganado. Al montarse celebra si toca:
 * confeti desde las estrellas y un arpegio. Una sola vez por montaje.
 */
export function RewardBanner({
  stars,
  gained,
  good,
}: {
  /** Estrellas de la tanda, si la tanda las da. */
  stars?: number;
  /** XP que acaba de sumar el jugador (0 o nada: no se enseña). */
  gained?: number;
  /** ¿Hay algo que celebrar? (tanda buena, hoja resuelta, examen aprobado). */
  good: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const played = useRef(false);
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    if (!good) return;
    const at = centerOf(ref.current);
    sounds.success();
    burst(at, { count: 22 + (stars ?? 2) * 10, power: 1.3, spread: 110 });
    if (gained) floatText({ x: at.x, y: at.y - 24 }, t.fx.xpFloat(gained));
  }, [good, gained, stars]);
  if (stars === undefined && !gained) return <div ref={ref} />;
  return (
    <div className="reward" ref={ref}>
      {stars !== undefined ? <Stars n={stars} /> : null}
      {gained ? <span className="reward__xp num">{t.fx.xpFloat(gained)}</span> : null}
    </div>
  );
}

/** Botón de la cabecera que enciende y apaga el sonido. Solo donde hay efectos (un navegador de verdad). */
export function SoundToggle() {
  const on = useSyncExternalStore(subscribeSound, isSoundOn, () => true);
  if (!browserFx()) return null;
  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={on}
      aria-label={t.fx.sound}
      title={on ? t.fx.soundOn : t.fx.soundOff}
      onClick={() => {
        setSoundOn(!on);
        if (!on) sounds.tick();
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path className="sound-toggle__body" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
        {on ? (
          <path
            className="sound-toggle__wave"
            d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
          />
        ) : (
          <path className="sound-toggle__wave" d="M16 9.5l5 5M21 9.5l-5 5" />
        )}
      </svg>
    </button>
  );
}

/** Todos los logros del juego, conseguidos y por conseguir, con lo que pide cada uno. */
export function AchievementList({ earned }: { earned: readonly AchievementId[] }) {
  const got = new Set(earned);
  return (
    <section className="achievements" aria-labelledby="achievements-title">
      <header className="achievements__head">
        <h2 id="achievements-title" className="achievements__title">
          {t.fx.achievementsHeading}
        </h2>
        <span className="achievements__count num">
          {t.fx.achievementsCount(got.size, ACHIEVEMENTS.length)}
        </span>
      </header>
      <ul className="achievements__list">
        {ACHIEVEMENTS.map((id) => {
          const on = got.has(id);
          const { title, text } = t.fx.achievements[id];
          return (
            <li key={id} className={`achievement${on ? ' achievement--on' : ''}`}>
              <svg className="achievement__medal" viewBox="0 0 40 40" aria-hidden="true">
                <path className="achievement__ribbon" d="M13 4h6l-3 12h-6zM21 4h6l3 12h-6z" />
                <circle className="achievement__disc" cx="20" cy="25" r="11" />
                <path
                  className="achievement__star"
                  d={STAR_PATH}
                  transform="translate(11.6 16.4) scale(0.7)"
                />
              </svg>
              <span className="achievement__body">
                <span className="achievement__name">{title}</span>
                <span className="achievement__text">{text}</span>
                {on ? null : <span className="achievement__locked">{t.fx.achievementLocked}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
