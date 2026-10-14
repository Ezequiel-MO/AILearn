import { useId, useMemo } from 'react';
import { Link, useParams } from 'react-router';
import type { Game, Project } from '../../content/schema';
import { toShape } from '../../content/schema';
import {
  orbitOpen,
  isValidated,
  level,
  projectMark,
  sheetsOpen,
  xp,
} from '../../engine/progression';
import { QUESTIONS_PER_EXERCISE, VALID } from '../../engine/types';
import { useGame } from '../GamesContext';
import { Layout } from '../Layout';
import { t } from '../strings';
import { useProgress } from '../useProgress';
import { Gate } from './Gate';
import {
  exercisePath,
  findProject,
  mapPath,
  sheetPath,
  useFocusTitle,
  useOpenOverride,
} from './lookup';

/** `/j/:game/p/:project`: la nota del proyecto, sus tres ejercicios y sus tres hojas. */
export function ProjectPanel() {
  const { game: gameId = '', project: projectId = '' } = useParams();
  const game = useGame(gameId);
  if (!game) return <Gate kind="missing" />;
  const found = findProject(game, projectId);
  if (!found) return <Gate kind="missing" gameId={game.id} />;
  return (
    <PanelView
      key={`${game.id}/${found.project.id}`}
      game={game}
      orbit={found.orbit}
      project={found.project}
    />
  );
}

function PanelView({ game, orbit, project }: { game: Game; orbit: number; project: Project }) {
  const { summary, warning } = useProgress(game.id);
  const override = useOpenOverride();
  const exercisesId = useId();
  const sheetsId = useId();
  useFocusTitle();
  const shape = useMemo(() => toShape(game), [game]);
  const currentLevel = level(xp(shape, summary));
  if (!override && !orbitOpen(shape, summary, orbit)) {
    return <Gate kind="closed" gameId={game.id} level={currentLevel} warning={warning} />;
  }
  const validated = isValidated(summary, project.id);
  const sheetsAreOpen = override || sheetsOpen(summary, project.id);
  return (
    <Layout title={project.name} back={mapPath(game.id)} level={currentLevel} warning={warning}>
      <p className="panel__sub">{project.sub}</p>
      <p className="panel__mark">
        <span>{t.hub.projectMark(projectMark(summary, project.id), VALID)}</span>{' '}
        <span className="map__state">{validated ? t.hub.stateValidated : t.hub.stateOpen}</span>
      </p>

      <section className="panel__block" aria-labelledby={exercisesId}>
        <h2 id={exercisesId} className="panel__heading">
          {t.hub.exercisesHeading}
        </h2>
        <ul className="panel__list" aria-labelledby={exercisesId}>
          {project.exercises.map((exercise, ex) => {
            const best = summary.firsts[`${project.id}/${ex}`];
            return (
              <li key={ex} className="panel__item">
                <span className="panel__item-name">
                  {t.hub.exerciseTitle(ex + 1, t.hub.exerciseKinds[exercise.kind])}
                </span>
                <span className="panel__item-state num">
                  {best === undefined
                    ? t.hub.exerciseNone
                    : t.hub.exerciseBest(best, QUESTIONS_PER_EXERCISE)}
                </span>
                <Link
                  className="play__action"
                  to={exercisePath(game.id, project.id, ex)}
                  aria-label={t.hub.exercisePlay(ex + 1)}
                >
                  {t.hub.exercisePlayShort}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel__block" aria-labelledby={sheetsId}>
        <h2 id={sheetsId} className="panel__heading">
          {t.hub.sheetsHeading}
        </h2>
        <ul className="panel__list" aria-labelledby={sheetsId}>
          {project.sheets.map((sheet, n) => (
            <li key={sheet.id} className="panel__item">
              <span className="panel__item-name">{t.hub.sheetTitle(n + 1)}</span>
              {!sheetsAreOpen ? (
                <span className="panel__item-state">{t.hub.sheetClosed}</span>
              ) : (
                <>
                  {summary.sheets.includes(sheet.id) && (
                    <span className="panel__item-state">{t.hub.sheetSolved}</span>
                  )}
                  <Link className="play__action" to={sheetPath(game.id, project.id, n)}>
                    {t.hub.sheetOpen(n + 1)}
                  </Link>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}
