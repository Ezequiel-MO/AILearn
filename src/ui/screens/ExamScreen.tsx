import { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { drawExam, projectsToRevise } from '../../content/exam';
import type { Orbit, Game } from '../../content/schema';
import { toShape } from '../../content/schema';
import { examAvailable, examPassed, level, xp } from '../../engine/progression';
import type { QuestionResult } from '../../engine/session';
import { EXAM_PASS, EXAM_SIZE } from '../../engine/types';
import { ExerciseRunner, type RunSummary } from '../ExerciseRunner';
import { useGame } from '../GamesContext';
import { Layout } from '../Layout';
import { t } from '../strings';
import { useProgress } from '../useProgress';
import { Gate } from './Gate';
import { mapPath, parseOrbit, useFocusTitle, useOpenOverride } from './lookup';

/** `/j/:game/examen/:c`: el examen de una órbita, sorteado con una semilla nueva al entrar. */
export function ExamScreen() {
  const { game: gameId = '', c } = useParams();
  const game = useGame(gameId);
  if (!game) return <Gate kind="missing" />;
  // La órbita sale de la ruta: se valida como entero dentro del juego antes de llegar al hook (handInExam
  // guardaría una órbita inexistente sin lanzar).
  const orbit = parseOrbit(c, game);
  if (orbit === null) return <Gate kind="missing" gameId={game.id} />;
  // La clave monta otro examen al cambiar de órbita (la tanda y la semilla se fijan al montar).
  return <ExamPlay key={`${game.id}/${orbit}`} game={game} orbit={orbit} />;
}

/** Lo que se enseña al terminar: la nota, si aprueba, el XP de antes (para ver cuánto ha ganado) y los proyectos a repasar. */
interface ExamResult {
  correct: number;
  passed: boolean;
  xpBefore: number;
  revise: string[];
}

/** Una semilla entera nueva; si dos caen en el mismo milisegundo, la segunda es la siguiente. */
const nextSeed = (previous: number): number => Math.max(Date.now(), previous + 1);

function ExamPlay({ game, orbit }: { game: Game; orbit: number }) {
  const { summary, warning } = useProgress(game.id);
  const override = useOpenOverride();
  const shape = toShape(game);
  const currentLevel = level(xp(shape, summary));
  if (!override && !examAvailable(shape, summary, orbit)) {
    return <Gate kind="closed" gameId={game.id} level={currentLevel} warning={warning} />;
  }
  return <ExamRun game={game} orbit={orbit} />;
}

function ExamRun({ game, orbit }: { game: Game; orbit: number }) {
  const { summary, warning, record, handInExam, getDraft, saveDraft } = useProgress(game.id);
  const def: Orbit = game.orbits[orbit]!;
  const [seed, setSeed] = useState(() => nextSeed(0));
  const [result, setResult] = useState<ExamResult | null>(null);
  useFocusTitle(seed);

  const shape = useMemo(() => toShape(game), [game]);
  const exam = useMemo(() => drawExam(def, seed), [def, seed]);
  const questions = useMemo(() => exam.map((e) => e.question), [exam]);

  const onResult = useCallback((r: QuestionResult) => record(r, 'examen'), [record]);
  const onDone = useCallback(
    (s: RunSummary) => {
      const names = new Map(def.projects.map((p) => [p.id, p.name]));
      const revise = projectsToRevise(
        exam,
        s.results.map((r) => r.correct),
        def,
      ).map((id) => names.get(id) ?? id);
      // El resumen de este render es el de antes de entregar: el XP ganado es la diferencia que dé el motor.
      setResult({
        correct: s.correct,
        passed: examPassed(s.correct),
        xpBefore: xp(shape, summary),
        revise,
      });
      handInExam(orbit, s.correct);
    },
    [handInExam, def, exam, orbit, shape, summary],
  );

  const xpNow = xp(shape, summary);
  const currentLevel = level(xpNow);
  return (
    <Layout
      title={t.exam.title(def.name)}
      back={mapPath(game.id)}
      level={currentLevel}
      warning={warning}
    >
      <p className="exam__intro">{t.exam.intro(EXAM_SIZE, EXAM_PASS)}</p>
      <div className="play__runner">
        <ExerciseRunner
          key={seed}
          mode="examen"
          questions={questions}
          onResult={onResult}
          onDone={onDone}
          getDraft={getDraft}
          onDraft={saveDraft}
        />
      </div>
      {result && (
        <section
          className={`play__result${result.passed ? '' : ' exam__result--failed'}`}
          aria-labelledby="exam-result-title"
        >
          <h2 id="exam-result-title" className="play__result-title">
            {t.exam.resultHeading}
          </h2>
          <p>{t.exam.score(result.correct, EXAM_SIZE)}</p>
          {result.passed ? (
            <>
              <p>{t.exam.passed}</p>
              <p>
                {xpNow > result.xpBefore
                  ? t.exam.xpGained(xpNow - result.xpBefore)
                  : t.exam.alreadyPassed}
              </p>
            </>
          ) : (
            <>
              <p>{t.exam.failed(EXAM_PASS)}</p>
              <div className="exam__revise">
                <p className="exam__revise-title">{t.exam.reviseHeading}</p>
                <ul className="exam__revise-list">
                  {result.revise.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
          <div className="play__actions">
            <Link className="play__action" to={mapPath(game.id)}>
              {t.play.toMap}
            </Link>
            <button
              type="button"
              className="play__action"
              onClick={() => {
                setResult(null);
                setSeed(nextSeed);
              }}
            >
              {t.exam.repeat}
            </button>
          </div>
        </section>
      )}
    </Layout>
  );
}
