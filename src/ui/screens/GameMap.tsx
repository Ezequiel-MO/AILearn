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
import { ACHIEVEMENTS, achievements, nextStep, type NextStep } from '../../engine/rewards';
import { VALID, type Shape, type Summary } from '../../engine/types';
import { BigPicture } from '../BigPicture';
import { useGame } from '../GamesContext';
import { Layout } from '../Layout';
import { MarkBar, OrbitGlyph, StateIcon, type StepState } from '../MapGlyphs';
import { LevelBar } from '../Rewards';
import { t } from '../strings';
import { useProgress } from '../useProgress';
import { Gate } from './Gate';
import {
  examPath,
  launchPath,
  networkPath,
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
  const next = nextStep(shape, summary);
  return (
    <Layout title={game.title} back="/" level={level(points)} warning={warning}>
      <div className="map__bar">
        <p className="map__xp num">{t.hub.xp(points)}</p>
        <LevelBar points={points} big />
        <span className="map__badges num">
          {t.fx.achievementsShort(achievements(shape, summary).length, ACHIEVEMENTS.length)}
        </span>
        <Link className="play__action" to={statsPath(game.id)}>
          {t.hub.statsLink}
        </Link>
      </div>
      {game.bigPicture && <BigPicture bigPicture={game.bigPicture} />}
      <p className="map__net">
        <Link className="play__action" to={networkPath()}>
          {t.network.linkMap}
        </Link>
      </p>
      <LaunchCard gameId={game.id} done={summary.launch} next={next?.kind === 'launch'} />
      {game.orbits.map((orbit, c) => (
        <OrbitCard
          key={c}
          gameId={game.id}
          orbit={orbit}
          c={c}
          shape={shape}
          summary={summary}
          override={override}
          next={next}
        />
      ))}
    </Layout>
  );
}

/** «Siguiente paso»: lo que el motor señala como lo próximo que conviene jugar. */
function NextBadge() {
  return <span className="map__next">{t.fx.nextStep}</span>;
}

function LaunchCard({ gameId, done, next }: { gameId: string; done: boolean; next: boolean }) {
  const titleId = useId();
  return (
    <section className={`map__card${next ? ' map__card--next' : ''}`} aria-labelledby={titleId}>
      <header className="map__head">
        <StateIcon state={done ? 'validated' : 'open'} />
        <h2 id={titleId} className="map__name">
          {t.hub.launchHeading}
        </h2>
        {next && <NextBadge />}
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
  next,
}: {
  gameId: string;
  orbit: Orbit;
  c: number;
  shape: Shape;
  summary: Summary;
  /** `?abierto`: todo se ve abierto. */
  override: boolean;
  next: NextStep;
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
  const moons: StepState[] = orbit.projects.map((p) =>
    !open ? 'closed' : isValidated(summary, p.id) ? 'validated' : 'open',
  );
  const examNext = next?.kind === 'exam' && next.c === c;
  return (
    <section className="map__card map__card--orbit" aria-labelledby={titleId}>
      <header className="map__head">
        <OrbitGlyph index={c} moons={moons} examPassed={passed} open={open} />
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
            next={next?.kind === 'project' && next.id === project.id}
          />
        ))}
      </ul>
      <div
        className={`map__exam${examNext ? ' map__exam--next' : ''}`}
        role="group"
        aria-labelledby={examTitleId}
      >
        <StateIcon
          state={examState === 'passed' ? 'validated' : examState === 'open' ? 'open' : 'closed'}
        />
        <h3 id={examTitleId} className="map__exam-title">
          {t.hub.examHeading}
        </h3>
        {examNext && <NextBadge />}
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
  next,
}: {
  gameId: string;
  id: string;
  name: string;
  open: boolean;
  summary: Summary;
  next: boolean;
}) {
  const nameId = useId();
  const state = !open ? 'closed' : isValidated(summary, id) ? 'validated' : 'open';
  const mark = projectMark(summary, id);
  return (
    <li
      className={`map__project map__project--${state}${next ? ' map__project--next' : ''}`}
      aria-labelledby={nameId}
    >
      <StateIcon state={state} />
      {open ? (
        <Link id={nameId} className="map__project-name" to={projectPath(gameId, id)}>
          {name}
        </Link>
      ) : (
        <span id={nameId} className="map__project-name">
          {name}
        </span>
      )}
      {next && <NextBadge />}
      <MarkBar mark={mark} threshold={VALID} />
      <span className="map__mark num">{t.hub.mark(mark)}</span>
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
