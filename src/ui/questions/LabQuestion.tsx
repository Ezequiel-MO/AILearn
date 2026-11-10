import { grade } from '../../content/grade';
import type { LabQ } from '../../content/schema';
import { labMeasure, labStart } from '../../engine/labs';
import { GoalMeters } from '../labs/GoalMeters';
import { Lab, useLabState } from '../labs/Lab';
import { Md } from '../Md';
import { t } from '../strings';
import { Purpose, useSubmit, type QuestionProps } from './parts';

/**
 * Pregunta sobre un laboratorio: se mueven los mandos, los medidores dicen en vivo cuánto falta para
 * cada meta y se entrega. Cerrada, queda como la dejó el jugador y ofrece ver una solución.
 */
export function LabQuestion({ question, locked, onSubmit, hideChecks }: QuestionProps<LabQ>) {
  const { state, setState, change, reset } = useLabState(question.lab);
  const { cooling, submit } = useSubmit(onSubmit);
  const values = labMeasure(question.lab, state);

  const handleSubmit = () => {
    if (locked) return;
    submit(grade(question, { type: 'laboratorio', state }));
  };

  return (
    <div className="question">
      <div className="question__stem">
        {question.purpose ? <Purpose purpose={question.purpose} /> : null}
        <Md>{question.prompt}</Md>
        <GoalMeters goals={question.goals} values={values} quiet={hideChecks ?? false} />
        <Lab spec={question.lab} state={state} onChange={locked ? undefined : change} />
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
        <button type="button" className="question__button" disabled={locked} onClick={reset}>
          {t.questions.reset}
        </button>
        {locked && !hideChecks ? (
          <button
            type="button"
            className="question__button"
            onClick={() => setState({ ...labStart(question.lab), ...question.solved })}
          >
            {t.labs.solve}
          </button>
        ) : null}
      </div>
    </div>
  );
}
