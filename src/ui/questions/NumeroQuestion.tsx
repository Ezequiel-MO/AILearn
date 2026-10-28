import { useId, useState, type FormEvent } from 'react';
import { grade, parseNumber } from '../../content/grade';
import type { NumeroQ } from '../../content/schema';
import { t } from '../strings';
import { Invalid, Stem, SubmitButton, useSubmit, type QuestionProps } from './parts';

export function NumeroQuestion({ question, locked, onSubmit }: QuestionProps<NumeroQ>) {
  const [text, setText] = useState('');
  const [invalid, setInvalid] = useState(false);
  const { cooling, submit } = useSubmit(onSubmit);
  const inputId = useId();
  const warnId = `${inputId}-warn`;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (locked) return;
    const parsed = parseNumber(text);
    if (!parsed.ok) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    submit(grade(question, { type: 'numero', value: parsed.value }));
  };

  return (
    <form className="question" onSubmit={handleSubmit} noValidate>
      <Stem prompt={question.prompt} plane={question.plane} purpose={question.purpose} />
      <div className="question__answer">
        <label htmlFor={inputId}>{t.questions.answerLabel}</label>
        <input
          id={inputId}
          className="question__input num"
          type="text"
          autoComplete="off"
          value={text}
          disabled={locked}
          aria-invalid={invalid}
          aria-describedby={invalid ? warnId : undefined}
          onChange={(e) => {
            setText(e.target.value);
            setInvalid(false);
          }}
        />
        <SubmitButton disabled={locked || cooling} />
      </div>
      {invalid ? <Invalid id={warnId}>{t.questions.invalidNumber}</Invalid> : null}
    </form>
  );
}
