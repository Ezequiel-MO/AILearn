import { useState } from 'react';
import { grade, graphPositions } from '../../content/grade';
import type { CurvaQ } from '../../content/schema';
import { CurvePlane } from '../CurvePlane';
import { Md } from '../Md';
import { t } from '../strings';
import { Purpose, useSubmit, type QuestionProps } from './parts';

export function CurvaQuestion({ question, locked, onSubmit }: QuestionProps<CurvaQ>) {
  const [positions, setPositions] = useState(() => graphPositions(question.graph));
  const { cooling, submit } = useSubmit(onSubmit);

  const handleSubmit = () => {
    if (locked) return;
    submit(grade(question, { type: 'curva', points: positions }));
  };

  return (
    <div className="question">
      <div className="question__stem">
        {question.purpose ? <Purpose purpose={question.purpose} /> : null}
        <Md>{question.prompt}</Md>
        <CurvePlane
          spec={question.graph}
          positions={positions}
          // bloqueada, la figura queda estática con lo que dejó el jugador
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
          onClick={() => setPositions(graphPositions(question.graph))}
        >
          {t.questions.reset}
        </button>
      </div>
    </div>
  );
}
