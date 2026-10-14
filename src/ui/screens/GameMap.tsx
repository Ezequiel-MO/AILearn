import { useId, useMemo } from 'react';
import { Link, useParams } from 'react-router';
import type { Orbit, Game } from '../../content/schema';
import { toShape } from '../../content/schema';
import {
  orbitOpen,
  examAvailable,
  isValidated,
  level,
  projectMark,
  xp,
} from '../../engine/progression';
import type { Shape, Summary } from '../../engine/types';
import { useGame } from '../GamesContext';
import { Layout } from '../Layout';
import { t } from '../strings';
import { useProgress } from '../useProgress';
import { Gate } from './Gate';
import {
  examPath,
  launchPath,
  projectPath,
  statsPath,
  useFocusTitle,
  useOpenOverride,
} from './lookup';

/** `/j/:game`: el despegue y las órbitas con el estado que dice el motor. */
export function GameMap() {
  const { game: gameId = '' } = useParams();
  const game = useGame(gameId);
  if (!game) return <Gate kind="missing" />;
  return <MapView game={game} />;
}

function MapView({ game }: { game: Game }) {
  const { summary, warning } = useProgress(game.id);
  const override = useOpenOverride();
  useFocusTitle();
  const shape = useMemo(() => toShape(game), [game]);
  const points = xp(shape, summary);
  return (
    <Layout title={game.title} back="/" level={level(points)} warning={warning}>
      <div className="map__bar">
        <p className="map__xp num">{t.hub.xp(points)}</p>
        <Link className="play__action" to={statsPath(game.id)}>
          {t.hub.statsLink}
        </Link>
      </div>
      <LaunchCard gameId={game.id} done={summary.launch} />
      {game.orbits.map((orbit, c) => (
        <OrbitCard
          key={c}
          gameId={game.id}
          orbit={orbit}
          c={c}
          shape={shape}
          summary={summary}
          override={override}
        />
      ))}
    </Layout>
  );
}

function LaunchCard({ gameId, done }: { gameId: string; done: boolean }) {
  const titleId = useId();
  return (
    <section className="map__card" aria-labelledby={titleId}>
      <header className="map__head">
        <h2 id={titleId} className="map__name">
          {t.hub.launchHeading}
        </h2>
        <span className="map__state">{done ? t.hub.launchDone : t.hub.launchOpen}</span>
      </header>
      <Link className="play__action" to={launchPath(gameId)}>
        {done ? t.hub.launchRepeat : t.hub.launchPlay}
      </Link>
    </section>
  );
}

function OrbitCard({
  gameId,
  orbit,
  c,
  shape,
  summary,
  override,
}: {
  gameId: string;
  orbit: Orbit;
  c: number;
  shape: Shape;
  summary: Summary;
  /** `?abierto`: todo se ve abierto. */
  override: boolean;
}) {
  const titleId = useId();
  const examTitleId = useId();
  const open = override || orbitOpen(shape, summary, c);
  // Aprobado = alguna vez aprobado (`examsPassed`); `examPassed` juzga un intento y no sirve aquí.
  const passed = summary.examsPassed.includes(c);
  const examState = passed
    ? 'passed'
    : override || examAvailable(shape, summary, c)
      ? 'open'
      : 'closed';
  const needOrbit = c === 0 ? t.hub.needLaunch : t.hub.needPreviousExam;
  // En una órbita cerrada el examen dice lo mismo que la órbita; «Valida todos los proyectos» solo en uno abierto.
  const needExam = !open
    ? needOrbit
    : orbit.projects.length === 0
      ? t.hub.noProjects
      : t.hub.needProjects;
  return (
    <section className="map__card" aria-labelledby={titleId}>
      <header className="map__head">
        <h2 id={titleId} className="map__name">
          {orbit.name}
        </h2>
        <span className="map__state">{open ? t.hub.orbitOpen : t.hub.orbitClosed}</span>
      </header>
      {!open && <p className="map__need">{needOrbit}</p>}
      <ul className="map__projects" aria-label={t.hub.projectsLegend}>
        {orbit.projects.map((project) => (
          <ProjectRow
            key={project.id}
            gameId={gameId}
            id={project.id}
            name={project.name}
            open={open}
            summary={summary}
          />
        ))}
      </ul>
      <div className="map__exam" role="group" aria-labelledby={examTitleId}>
        <h3 id={examTitleId} className="map__exam-title">
          {t.hub.examHeading}
        </h3>
        <span className="map__state">
          {examState === 'passed'
            ? t.hub.statePassed
            : examState === 'open'
              ? t.hub.stateOpen
              : t.hub.stateClosed}
        </span>
        {examState === 'closed' && <p className="map__need">{needExam}</p>}
        {examState !== 'closed' && (
          <Link className="play__action" to={examPath(gameId, c)}>
            {examState === 'passed' ? t.hub.examRepeat : t.hub.examTake}
          </Link>
        )}
      </div>
    </section>
  );
}

function ProjectRow({
  gameId,
  id,
  name,
  open,
  summary,
}: {
  gameId: string;
  id: string;
  name: string;
  open: boolean;
  summary: Summary;
}) {
  const nameId = useId();
  const state = !open ? 'closed' : isValidated(summary, id) ? 'validated' : 'open';
  return (
    <li className="map__project" aria-labelledby={nameId}>
      {open ? (
        <Link id={nameId} className="map__project-name" to={projectPath(gameId, id)}>
          {name}
        </Link>
      ) : (
        <span id={nameId} className="map__project-name">
          {name}
        </span>
      )}
      <span className="map__mark num">{t.hub.mark(projectMark(summary, id))}</span>
      <span className="map__state">
        {state === 'closed'
          ? t.hub.stateClosed
          : state === 'validated'
            ? t.hub.stateValidated
            : t.hub.stateOpen}
      </span>
    </li>
  );
}
