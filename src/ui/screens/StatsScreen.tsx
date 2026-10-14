import { useId, useMemo } from 'react';
import { useParams } from 'react-router';
import type { Game } from '../../content/schema';
import { toShape } from '../../content/schema';
import { firstTry, level, xp } from '../../engine/progression';
import { useGame } from '../GamesContext';
import { Layout } from '../Layout';
import { t } from '../strings';
import { useProgress } from '../useProgress';
import { Gate } from './Gate';
import { mapPath, useFocusTitle } from './lookup';

/** `/j/:game/estadisticas`: el registro de intentos, en total y por proyecto. */
export function StatsScreen() {
  const { game: gameId = '' } = useParams();
  const game = useGame(gameId);
  if (!game) return <Gate kind="missing" />;
  return <StatsView game={game} />;
}

/**
 * En qué fila de la tabla cae cada pregunta del contenido: 0 es el despegue y `i + 1` el proyecto `i`
 * (en el orden de las órbitas). Los intentos de examen se buscan en el banco; los demás, en las
 * preguntas del despegue y de los ejercicios y hojas de los proyectos. Es lectura de contenido.
 */
function rowIndex(game: Game) {
  const content = new Map<string, number>();
  const bank = new Map<string, number>();
  const projects = game.orbits.flatMap((orbit) => orbit.projects);
  for (const q of game.launch) content.set(q.id, 0);
  projects.forEach((project, i) => {
    for (const exercise of project.exercises) {
      for (const q of exercise.questions) content.set(q.id, i + 1);
    }
    for (const sheet of project.sheets) content.set(sheet.id, i + 1);
  });
  game.orbits.forEach((orbit) => {
    for (const entry of orbit.examBank) {
      const i = projects.findIndex((p) => p.id === entry.project);
      if (i >= 0) bank.set(entry.question.id, i + 1);
    }
  });
  return { content, bank, names: [t.hub.statsLaunch, ...projects.map((p) => p.name)] };
}

function StatsView({ game }: { game: Game }) {
  const { summary, warning, attempts } = useProgress(game.id);
  const tableId = useId();
  const totalId = useId();
  const firstId = useId();
  useFocusTitle();
  const shape = useMemo(() => toShape(game), [game]);
  const index = useMemo(() => rowIndex(game), [game]);

  // Los totales cuentan todos los intentos; la tabla, solo los que siguen en el contenido.
  const rows = index.names.map(() => ({ attempts: 0, correct: 0 }));
  let firsts = 0;
  for (const a of attempts) {
    if (firstTry(a)) firsts += 1;
    const row = (a.context === 'examen' ? index.bank : index.content).get(a.q);
    if (row === undefined) continue;
    rows[row]!.attempts += 1;
    if (a.correct) rows[row]!.correct += 1;
  }
  const total = attempts.length;

  return (
    <Layout
      title={t.hub.statsTitle}
      back={mapPath(game.id)}
      level={level(xp(shape, summary))}
      warning={warning}
    >
      {total === 0 ? (
        <section className="stats__empty">
          <p className="stats__empty-title">{t.hub.statsEmpty}</p>
          <p>{t.hub.statsEmptyHelp}</p>
        </section>
      ) : (
        <>
          <div className="stats__figures">
            <div className="stats__figure" role="group" aria-labelledby={totalId}>
              <p id={totalId} className="stats__label">
                {t.hub.statsTotal}
              </p>
              <p className="stats__value num">{total}</p>
            </div>
            <div className="stats__figure" role="group" aria-labelledby={firstId}>
              <p id={firstId} className="stats__label">
                {t.hub.statsFirstTry}
              </p>
              <p className="stats__value num">
                {t.hub.percent(Math.round((100 * firsts) / total))}
              </p>
            </div>
          </div>
          <div className="stats__scroll">
            <table className="stats__table" aria-labelledby={tableId}>
              <caption id={tableId} className="stats__caption">
                {t.hub.statsTable}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t.hub.statsWhere}</th>
                  <th scope="col">{t.hub.statsAttempts}</th>
                  <th scope="col">{t.hub.statsCorrect}</th>
                </tr>
              </thead>
              <tbody>
                {index.names.map((name, i) => (
                  <tr key={i}>
                    <td>{name}</td>
                    <td className="num">{rows[i]!.attempts}</td>
                    <td className="num">{rows[i]!.correct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  );
}
