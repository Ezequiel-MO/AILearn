import { useContext, useId } from 'react';
import { Link } from 'react-router';
import type { RoadmapGame, RoadmapStage } from '../../games/roadmap';
import { roadmap } from '../../games/roadmap';
import { GamesContext } from '../GamesContext';
import { Layout } from '../Layout';
import { t } from '../strings';
import { mapPath, useFocusTitle } from './lookup';

/** `/ruta`: todos los juegos previstos. Lo que no está registrado (o la órbita que el juego aún no tiene) dice «Próximamente». */
export function RoadmapScreen() {
  const games = useContext(GamesContext);
  useFocusTitle();
  const orbitCount = (game: RoadmapGame) => games.find((g) => g.id === game.id)?.orbits.length;
  const orbits = roadmap.reduce((n, g) => n + g.orbits.length, 0);
  const projects = roadmap.reduce(
    (n, g) => n + g.orbits.reduce((m, o) => m + o.projects.length, 0),
    0,
  );
  const ready = roadmap.filter((g) => orbitCount(g) !== undefined).length;
  return (
    <Layout title={t.roadmap.title} back="/">
      <p className="roadmap__intro">{t.roadmap.intro}</p>
      <p className="roadmap__totals num">
        {t.roadmap.totals(roadmap.length, orbits, projects, ready)}
      </p>
      <ol className="roadmap__list">
        {roadmap.map((game, i) => (
          <RoadmapCard key={game.id} game={game} n={i + 1} built={orbitCount(game)} />
        ))}
      </ol>
    </Layout>
  );
}

function Badge({ ready }: { ready: boolean }) {
  return (
    <span className={`roadmap__badge roadmap__badge--${ready ? 'ready' : 'soon'}`}>
      {ready ? t.roadmap.ready : t.roadmap.soon}
    </span>
  );
}

function Facts({ stage }: { stage: RoadmapStage }) {
  return (
    <dl className="roadmap__facts">
      <dt>{t.roadmap.math}</dt>
      <dd>{stage.math}</dd>
      <dt>{t.roadmap.ai}</dt>
      <dd>{stage.ai}</dd>
    </dl>
  );
}

function RoadmapCard({
  game,
  n,
  built,
}: {
  game: RoadmapGame;
  n: number;
  /** Órbitas que tiene el juego registrado; `undefined` si aún no está registrado. */
  built: number | undefined;
}) {
  const titleId = useId();
  const ready = built !== undefined;
  return (
    <li className={`roadmap__card${ready ? '' : ' roadmap__card--soon'}`} aria-labelledby={titleId}>
      <header className="roadmap__head">
        <span className="roadmap__n">{t.roadmap.gameNumber(n)}</span>
        <h2 id={titleId} className="roadmap__name">
          {game.title}
        </h2>
        <Badge ready={ready} />
      </header>
      <Facts stage={game} />
      {ready && (
        <Link className="play__action" to={mapPath(game.id)}>
          {t.roadmap.play}
        </Link>
      )}
      <details className="roadmap__details" open={ready}>
        <summary className="roadmap__summary">{t.roadmap.contents(game.orbits.length)}</summary>
        <ol className="roadmap__stages">
          <Stage name={t.roadmap.launch} stage={game.launch} ready={ready} />
          {game.orbits.map((orbit, c) => (
            <Stage
              key={orbit.name}
              name={t.roadmap.orbit(c, orbit.name)}
              stage={orbit}
              ready={built !== undefined && c < built}
              projects={orbit.projects}
            />
          ))}
        </ol>
      </details>
    </li>
  );
}

function Stage({
  name,
  stage,
  ready,
  projects,
}: {
  name: string;
  stage: RoadmapStage;
  ready: boolean;
  projects?: string[];
}) {
  const nameId = useId();
  return (
    <li className="roadmap__stage" aria-labelledby={nameId}>
      <div className="roadmap__stage-head">
        <h3 id={nameId} className="roadmap__stage-name">
          {name}
        </h3>
        <Badge ready={ready} />
      </div>
      <Facts stage={stage} />
      {projects && (
        <ul className="roadmap__projects" aria-label={t.roadmap.projects}>
          {projects.map((p) => (
            <li key={p} className="roadmap__project">
              {p}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
