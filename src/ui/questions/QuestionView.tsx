import { lazy, Suspense } from 'react';
import type { Question } from '../../content/schema';
import { t } from '../strings';
import { ManipularQuestion } from './ManipularQuestion';
import { NumeroQuestion } from './NumeroQuestion';
import { OpcionQuestion } from './OpcionQuestion';
import type { QuestionProps } from './parts';
import { RevisionQuestion } from './RevisionQuestion';
import { VectorQuestion } from './VectorQuestion';

export type { QuestionProps } from './parts';

const noDraft = () => undefined;

// CodeMirror pesa casi 600 kB: la pregunta de código se carga aparte, solo cuando aparece una.
const CodigoQuestion = lazy(() =>
  import('./CodigoQuestion').then((m) => ({ default: m.CodigoQuestion })),
);

/**
 * Elige el componente por `question.type`. Cada pregunta lleva `key={question.id}`: al cambiar de
 * pregunta el estado local (texto, opción, posiciones) empieza de cero.
 * `draft`, `onDraft` y `hideChecks` solo los usa la pregunta de código (borrador del editor; examen).
 */
export function QuestionView({
  question,
  locked,
  onSubmit,
  hideChecks,
  draft,
  onDraft,
}: QuestionProps<Question> & {
  draft?: string | null;
  onDraft?: (code: string) => void;
}) {
  switch (question.type) {
    case 'manipular':
      return (
        <ManipularQuestion
          key={question.id}
          question={question}
          locked={locked}
          onSubmit={onSubmit}
        />
      );
    case 'numero':
      return (
        <NumeroQuestion key={question.id} question={question} locked={locked} onSubmit={onSubmit} />
      );
    case 'vector':
      return (
        <VectorQuestion key={question.id} question={question} locked={locked} onSubmit={onSubmit} />
      );
    case 'opcion':
      return (
        <OpcionQuestion key={question.id} question={question} locked={locked} onSubmit={onSubmit} />
      );
    case 'revision':
      return (
        <RevisionQuestion
          key={question.id}
          question={question}
          locked={locked}
          onSubmit={onSubmit}
        />
      );
    case 'codigo':
      return (
        <Suspense
          fallback={
            <p className="code__status" role="status">
              {t.code.editorLoading}
            </p>
          }
        >
          <CodigoQuestion
            key={question.id}
            question={question}
            locked={locked}
            onSubmit={onSubmit}
            hideChecks={hideChecks}
            draft={draft ?? null}
            onDraft={onDraft ?? noDraft}
          />
        </Suspense>
      );
  }
}
