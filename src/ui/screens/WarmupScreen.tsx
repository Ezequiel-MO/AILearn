import { useId, useMemo } from 'react';
import { Link, useParams } from 'react-router';
import type { Game, Project, WarmupStep } from '../../content/schema';
import { toShape } from '../../content/schema';
import { level, orbitOpen, xp } from '../../engine/progression';
import { CodeSandbox } from '../CodeSandbox';
import { useGame } from '../GamesContext';
import { Layout } from '../Layout';
import { Md } from '../Md';
import { t } from '../strings';
import { useProgress } from '../useProgress';
import { Gate } from './Gate';
import { exercisePath, findProject, projectPath, useFocusTitle, useOpenOverride } from './lookup';

/** `/j/:game/p/:project/calentamiento`: fichas para probar el Python nuevo antes del ejercicio «Programar». */
export function WarmupScreen() {
  const { game: gameId = '', project: projectId = '' } = useParams();
  const game = useGame(gameId);
  if (!game) return <Gate kind="missing" />;
  const found = findProject(game, projectId);
  if (!found?.project.warmup) return <Gate kind="missing" gameId={game.id} />;
  return (
    <WarmupView
      key={`${game.id}/${found.project.id}`}
      game={game}
      orbit={found.orbit}
      project={found.project}
      steps={found.project.warmup}
    />
  );
}

function WarmupView({
  game,
  orbit,
  project,
  steps,
}: {
  game: Game;
  orbit: number;
  project: Project;
  steps: WarmupStep[];
}) {
  const { summary, warning } = useProgress(game.id);
  const override = useOpenOverride();
  useFocusTitle();
  const shape = useMemo(() => toShape(game), [game]);
  const currentLevel = level(xp(shape, summary));
  if (!override && !orbitOpen(shape, summary, orbit)) {
    return <Gate kind="closed" gameId={game.id} level={currentLevel} warning={warning} />;
  }
  const programar = project.exercises.findIndex((e) => e.kind === 'programar');
  return (
    <Layout
      title={t.warmup.title(project.name)}
      back={projectPath(game.id, project.id)}
      level={currentLevel}
      warning={warning}
    >
      <p className="warmup__intro">{t.warmup.intro}</p>
      <ol className="warmup__steps" aria-label={t.warmup.stepsLabel}>
        {steps.map((step, i) => (
          <li key={step.id} className="warmup__step">
            <WarmupCard step={step} n={i + 1} total={steps.length} />
          </li>
        ))}
      </ol>
      <div className="play__actions">
        <Link className="play__action" to={exercisePath(game.id, project.id, programar)}>
          {t.warmup.toExercise}
        </Link>
        <Link className="play__action" to={projectPath(game.id, project.id)}>
          {t.warmup.toProject}
        </Link>
      </div>
    </Layout>
  );
}

function WarmupCard({ step, n, total }: { step: WarmupStep; n: number; total: number }) {
  const titleId = useId();
  return (
    <section className="warmup__card" aria-labelledby={titleId}>
      <p className="warmup__count">{t.warmup.stepTitle(n, total)}</p>
      <h2 id={titleId} className="warmup__title">
        <Md inline>{step.title}</Md>
      </h2>
      <Md>{step.explain}</Md>

      <h3 className="warmup__label">{t.warmup.exampleLabel}</h3>
      <CodeSandbox initial={step.example} />

      <h3 className="warmup__label">{t.warmup.experimentsLabel}</h3>
      <ul className="warmup__experiments">
        {step.experiments.map((text, i) => (
          <li key={i}>
            <Md inline>{text}</Md>
          </li>
        ))}
      </ul>

      <h3 className="warmup__label">{t.warmup.taskLabel}</h3>
      <Md>{step.task.prompt}</Md>
      <CodeSandbox initial={step.task.starter} checks={step.task.checks} />
      <details className="warmup__solution">
        <summary>{t.warmup.showSolution}</summary>
        <p>{t.warmup.solutionNote}</p>
        <pre className="code__output">
          <code>{step.task.reference}</code>
        </pre>
      </details>
    </section>
  );
}
