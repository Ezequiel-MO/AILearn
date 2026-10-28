import { useState } from 'react';
import { grade } from '../../content/grade';
import type { ManipularQ } from '../../content/schema';
import { Md } from '../Md';
import { t } from '../strings';
import { VectorPlane } from '../VectorPlane';
import { Purpose, startPositions, useSubmit, type QuestionProps } from './parts';

export function ManipularQuestion({ question, locked, onSubmit }: QuestionProps<ManipularQ>) {
  const [positions, setPositions] = useState(() => startPositions(question.plane));
  const { cooling, submit } = useSubmit(onSubmit);

  const handleSubmit = () => {
    if (locked) return;
    submit(grade(question, { type: 'manipular', vectors: positions }));
  };

  return (
    <div className="question">
      <div className="question__stem">
        {question.purpose ? <Purpose purpose={question.purpose} /> : null}
        <Md>{question.prompt}</Md>
        <VectorPlane
          spec={question.plane}
          positions={positions}
          // bloqueada, la figura queda estática: sin asas, con las posiciones que dejó el jugador
          onMove={locked ? undefined : (id, to) => setPositions((p) => ({ ...p, [id]: to }))}
        />
      </div>
      <div className="question__answer">
        <button
          type="button"
          className="question__button question__button--primary"
          disabled={locked || cooling}
          onClick={handleSubmit}
        >
          {t.questions.submit}
        </button>
        <button
          type="button"
          className="question__button"
          disabled={locked}
          onClick={() => setPositions(startPositions(question.plane))}
        >
          {t.questions.reset}
        </button>
      </div>
    </div>
  );
}
