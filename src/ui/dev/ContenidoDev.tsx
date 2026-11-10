import { useParams } from 'react-router';
import type { Game, Question } from '../../content/schema';
import { games } from '../../games';
import { Layout } from '../Layout';
import { QuestionView } from '../questions/QuestionView';

// Los textos de las páginas de desarrollo van aquí, no en strings.ts: así no entran en producción.
const TITLE = 'Contenido (desarrollo)';
const UNKNOWN =
  'No hay ese juego o ese proyecto. Ruta: #/dev/contenido/<juego>/<proyecto o «despegue»>';

/**
 * Lo que se mira de un grupo: el despegue, o los ejercicios «Manipular» y «Calcular» de un proyecto
 * con las entradas fijas de su banco de examen. Las de código no entran: no hay nada que ver sin ejecutar.
 */
const questionsOf = (game: Game, group: string): Question[] | null => {
  if (group === 'despegue') return game.launch.filter((q) => q.type !== 'codigo');
  for (const orbit of game.orbits) {
    const project = orbit.projects.find((p) => p.id === group);
    if (!project) continue;
    return [
      ...project.exercises.filter((e) => e.kind !== 'programar').flatMap((e) => e.questions),
      ...orbit.examBank
        .filter((e) => e.project === group)
        .map((e) => e.question)
        .filter((q): q is Question => q.type !== 'generada' && q.type !== 'codigo'),
    ];
  }
  return null;
};

// Página de verificación visual del contenido: cada pregunta abierta y, si es un laboratorio, también
// cerrada (ahí aparece «Ver una solución»). Cada una lleva su id en `data-testid`, para las capturas de
// `docs/handoffs/2026-11-10-laboratorios-y-ruta/contenidoshot.mjs`.
export default function ContenidoDev() {
  const { game, group } = useParams();
  const found = games.find((g) => g.id === game);
  const questions = found && group ? questionsOf(found, group) : null;
  return (
    <Layout title={TITLE} back="/">
      {questions === null ? <p>{UNKNOWN}</p> : null}
      {(questions ?? []).map((q) => (
        <div key={q.id}>
          <section data-testid={q.id} style={{ marginBottom: '3rem' }}>
            <h2>{q.id}</h2>
            <QuestionView question={q} locked={false} onSubmit={() => undefined} />
          </section>
          {q.type === 'laboratorio' ? (
            <section data-testid={`${q.id}--cerrada`} style={{ marginBottom: '3rem' }}>
              <h2>{q.id} (cerrada)</h2>
              <QuestionView question={q} locked onSubmit={() => undefined} />
            </section>
          ) : null}
        </div>
      ))}
    </Layout>
  );
}
