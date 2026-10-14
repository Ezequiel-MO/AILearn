import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router';
import type { Game, Project } from '../../content/schema';
import { toShape } from '../../content/schema';
import { orbitOpen, level, sheetsOpen, xp } from '../../engine/progression';
import type { QuestionResult } from '../../engine/session';
import { ExerciseRunner, type RunSummary } from '../ExerciseRunner';
import { useGame } from '../GamesContext';
import { Layout } from '../Layout';
import { t } from '../strings';
import { useProgress } from '../useProgress';
import { Gate } from './Gate';
import { findProject, parseIndex, projectPath, useFocusTitle, useOpenOverride } from './lookup';

/** `/j/:game/p/:project/hoja/:n`: una hoja «Caza el error»; n de 0 a 2. */
export function SheetScreen() {
  const { game: gameId = '', project: projectId = '', n } = useParams();
  const game = useGame(gameId);
  if (!game) return <Gate kind="missing" />;
  const found = findProject(game, projectId);
  const sheet = parseIndex(n);
  if (!found || sheet === null) return <Gate kind="missing" gameId={game.id} />;
  return (
    <SheetPlay
      key={`${game.id}/${found.project.id}/${sheet}`}
      game={game}
      orbit={found.orbit}
      project={found.project}
      sheet={sheet}
    />
  );
}

function SheetPlay({
  game,
  orbit,
  project,
  sheet,
}: {
  game: Game;
  orbit: number;
  project: Project;
  sheet: 0 | 1 | 2;
}) {
  const { summary, warning, record, solveSheet, getDraft, saveDraft } = useProgress(game.id);
  const override = useOpenOverride();
  const [run, setRun] = useState(0);
  const [solved, setSolved] = useState<boolean | null>(null);
  useFocusTitle(run);

  const question = project.sheets[sheet]!;
  const onResult = useCallback((r: QuestionResult) => record(r, 'hoja'), [record]);
  const onDone = useCallback(
    (s: RunSummary) => {
      const correct = s.results[0]?.correct === true;
      if (correct) solveSheet(question.id);
      setSolved(correct);
    },
    [solveSheet, question.id],
  );

  const shape = toShape(game);
  const currentLevel = level(xp(shape, summary));
  // Las hojas piden la órbita abierta y el proyecto validado: se combinan las dos funciones del motor.
  if (!override && !(orbitOpen(shape, summary, orbit) && sheetsOpen(summary, project.id))) {
    return <Gate kind="closed" gameId={game.id} level={currentLevel} warning={warning} />;
  }

  return (
    <Layout
      title={t.play.sheetTitle(project.name, sheet + 1)}
      back={projectPath(game.id, project.id)}
      level={currentLevel}
      warning={warning}
    >
      <div className="play__runner">
        <ExerciseRunner
          key={run}
          mode="hoja"
          questions={[question]}
          onResult={onResult}
          onDone={onDone}
          getDraft={getDraft}
          onDraft={saveDraft}
        />
      </div>
      {solved !== null && (
        <section className="play__result" aria-labelledby="play-result-title">
          <h2 id="play-result-title" className="play__result-title">
            {t.play.resultHeading}
          </h2>
          <p>{solved ? t.play.sheetSolved : t.play.sheetFailed}</p>
          <div className="play__actions">
            <Link className="play__action" to={projectPath(game.id, project.id)}>
              {t.play.toProject}
            </Link>
            <button
              type="button"
              className="play__action"
              onClick={() => {
                setSolved(null);
                setRun((n) => n + 1);
              }}
            >
              {t.play.repeat}
            </button>
          </div>
        </section>
      )}
    </Layout>
  );
}
