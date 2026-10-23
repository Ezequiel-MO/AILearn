import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router';
import type { Game, Project } from '../../content/schema';
import { toShape } from '../../content/schema';
import {
  exerciseDone,
  orbitOpen,
  isValidated,
  level,
  projectMark,
  xp,
} from '../../engine/progression';
import type { QuestionResult } from '../../engine/session';
import { QUESTIONS_PER_EXERCISE, VALID } from '../../engine/types';
import { ExerciseReview } from '../ExerciseReview';
import { ExerciseRunner, type RunSummary } from '../ExerciseRunner';
import { useGame } from '../GamesContext';
import { Layout } from '../Layout';
import { t } from '../strings';
import { useProgress } from '../useProgress';
import { Gate } from './Gate';
import {
  findProject,
  parseIndex,
  projectPath,
  useFocusTitle,
  useOpenOverride,
  warmupPath,
} from './lookup';

/** `/j/:game/p/:project/ex/:n`: un ejercicio de cinco preguntas; n de 0 a 2. */
export function ExerciseScreen() {
  const { game: gameId = '', project: projectId = '', n } = useParams();
  const game = useGame(gameId);
  if (!game) return <Gate kind="missing" />;
  const found = findProject(game, projectId);
  const ex = parseIndex(n);
  if (!found || ex === null) return <Gate kind="missing" gameId={game.id} />;
  // La clave monta una tanda nueva al cambiar de ejercicio o de proyecto (la tanda se fija al montar).
  return (
    <ExercisePlay
      key={`${game.id}/${found.project.id}/${ex}`}
      game={game}
      orbit={found.orbit}
      project={found.project}
      ex={ex}
    />
  );
}

function ExercisePlay({
  game,
  orbit,
  project,
  ex,
}: {
  game: Game;
  orbit: number;
  project: Project;
  ex: 0 | 1 | 2;
}) {
  const { summary, warning, record, handInExercise, getDraft, saveDraft } = useProgress(game.id);
  const override = useOpenOverride();
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<RunSummary | null>(null);
  // Un ejercicio ya entregado se abre en repaso: se inspecciona sin que cuente.
  const [reviewing, setReviewing] = useState(() => exerciseDone(summary, project.id, ex));
  useFocusTitle(run);

  const onResult = useCallback((r: QuestionResult) => record(r, 'proyecto'), [record]);
  const onDone = useCallback(
    (s: RunSummary) => {
      handInExercise(project.id, ex, s.firsts);
      setResult(s);
    },
    [handInExercise, project.id, ex],
  );

  const shape = toShape(game);
  const currentLevel = level(xp(shape, summary));
  if (!override && !orbitOpen(shape, summary, orbit)) {
    return <Gate kind="closed" gameId={game.id} level={currentLevel} warning={warning} />;
  }

  const questions = project.exercises[ex]!.questions;
  const mark = projectMark(summary, project.id);
  const best = summary.firsts[`${project.id}/${ex}`] ?? 0;
  return (
    <Layout
      title={t.play.exerciseTitle(project.name, ex + 1)}
      back={projectPath(game.id, project.id)}
      level={currentLevel}
      warning={warning}
    >
      {project.exercises[ex]!.kind === 'programar' && project.warmup ? (
        <p className="play__warmup">
          {t.warmup.exerciseHint}{' '}
          <Link to={warmupPath(game.id, project.id)}>{t.warmup.exerciseLink}</Link>.
        </p>
      ) : null}
      <div className="play__runner">
        {reviewing ? (
          <ExerciseReview
            questions={questions}
            getDraft={getDraft}
            onDraft={saveDraft}
            onRepeat={() => {
              setReviewing(false);
              setRun((n) => n + 1);
            }}
          />
        ) : (
          <ExerciseRunner
            key={run}
            mode="proyecto"
            questions={questions}
            onResult={onResult}
            onDone={onDone}
            getDraft={getDraft}
            onDraft={saveDraft}
          />
        )}
      </div>
      {result && (
        <section className="play__result" aria-labelledby="play-result-title">
          <h2 id="play-result-title" className="play__result-title">
            {t.play.resultHeading}
          </h2>
          <p>{t.play.exerciseResult(result.firsts, QUESTIONS_PER_EXERCISE)}</p>
          <p>{t.play.exerciseBest(best, QUESTIONS_PER_EXERCISE)}</p>
          <p>{t.play.projectMark(mark)}</p>
          <p>{isValidated(summary, project.id) ? t.play.validated : t.play.notValidated(VALID)}</p>
          <div className="play__actions">
            <Link className="play__action" to={projectPath(game.id, project.id)}>
              {t.play.toProject}
            </Link>
            <button
              type="button"
              className="play__action"
              onClick={() => {
                setResult(null);
                setRun((n) => n + 1);
              }}
            >
              {t.play.repeat}
            </button>
            <button
              type="button"
              className="play__action"
              onClick={() => {
                setResult(null);
                setReviewing(true);
              }}
            >
              {t.review.toReview}
            </button>
          </div>
        </section>
      )}
    </Layout>
  );
}
