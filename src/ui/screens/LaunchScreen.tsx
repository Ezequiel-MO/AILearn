import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router';
import type { Game } from '../../content/schema';
import { toShape } from '../../content/schema';
import { level, xp } from '../../engine/progression';
import type { QuestionResult, SavedRun } from '../../engine/session';
import { ExerciseRunner, type RunSummary } from '../ExerciseRunner';
import { useGame } from '../GamesContext';
import { Layout } from '../Layout';
import { t } from '../strings';
import { useProgress } from '../useProgress';
import { Gate } from './Gate';
import { mapPath, useFocusTitle } from './lookup';

/** `/j/:game/despegue`: el despegue no tiene puerta; solo comprueba que el juego exista. */
export function LaunchScreen() {
  const { game: gameId = '' } = useParams();
  const game = useGame(gameId);
  if (!game) return <Gate kind="missing" />;
  return <LaunchPlay key={game.id} game={game} />;
}

/** Id de la tanda a medias del despegue (los de los ejercicios son `<proyecto>/<n>`: no chocan). */
const LAUNCH_RUN = 'despegue';

function LaunchPlay({ game }: { game: Game }) {
  const { summary, warning, record, completeLaunch, getDraft, saveDraft, getRun, saveRun } =
    useProgress(game.id);
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<RunSummary | null>(null);
  useFocusTitle(run);

  // El despegue a medias se retoma donde se dejó.
  const loadRun = useCallback(() => getRun(LAUNCH_RUN), [getRun]);
  const onRun = useCallback((r: SavedRun | null) => saveRun(LAUNCH_RUN, r), [saveRun]);
  const onResult = useCallback((r: QuestionResult) => record(r, 'despegue'), [record]);
  const onDone = useCallback(
    (s: RunSummary) => {
      completeLaunch();
      setResult(s);
    },
    [completeLaunch],
  );

  return (
    <Layout
      title={t.play.launchTitle}
      back={mapPath(game.id)}
      level={level(xp(toShape(game), summary))}
      warning={warning}
    >
      <div className="play__runner">
        <ExerciseRunner
          key={run}
          mode="despegue"
          questions={game.launch}
          onResult={onResult}
          onDone={onDone}
          getDraft={getDraft}
          onDraft={saveDraft}
          loadRun={loadRun}
          onRun={onRun}
        />
      </div>
      {result && (
        <section className="play__result" aria-labelledby="play-result-title">
          <h2 id="play-result-title" className="play__result-title">
            {t.play.resultHeading}
          </h2>
          <p>{t.play.launchDone(result.correct, result.results.length, result.firsts)}</p>
          <div className="play__actions">
            <Link className="play__action" to={mapPath(game.id)}>
              {t.play.toMap}
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
          </div>
        </section>
      )}
    </Layout>
  );
}
