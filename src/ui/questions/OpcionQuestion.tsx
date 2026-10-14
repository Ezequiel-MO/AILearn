import { useId, useState } from 'react';
import { grade } from '../../content/grade';
import type { OpcionQ } from '../../content/schema';
import { Md } from '../Md';
import { t } from '../strings';
import { Stem, useSubmit, type QuestionProps } from './parts';

export function OpcionQuestion({ question, locked, onSubmit }: QuestionProps<OpcionQ>) {
  const [chosen, setChosen] = useState<number | null>(null);
  const { cooling, submit } = useSubmit(onSubmit);
  const group = useId();

  const handleSubmit = () => {
    if (locked || chosen === null) return;
    submit(grade(question, { type: 'opcion', index: chosen }));
  };

  return (
    <div className="question">
      <Stem prompt={question.prompt} plane={question.plane} />
      <fieldset className="question__options" disabled={locked}>
        <legend className="question__legend">{t.questions.optionsLegend}</legend>
        {question.options.map((option, i) => (
          <label key={i} className="question__option">
            <input type="radio" name={group} checked={chosen === i} onChange={() => setChosen(i)} />
            <Md inline>{option}</Md>
          </label>
        ))}
      </fieldset>
      <div className="question__answer">
        <button
          type="button"
          className="question__button question__button--primary"
          disabled={locked || cooling || chosen === null}
          onClick={handleSubmit}
        >
          {t.questions.submit}
        </button>
      </div>
    </div>
  );
}
