import { useId, useState, type FormEvent } from 'react';
import { grade, parseNumber } from '../../content/grade';
import type { VectorQ } from '../../content/schema';
import { t } from '../strings';
import { Invalid, Stem, SubmitButton, useSubmit, type QuestionProps } from './parts';

export function VectorQuestion({ question, locked, onSubmit }: QuestionProps<VectorQ>) {
  const count = question.answer.length;
  const [texts, setTexts] = useState<string[]>(() => question.answer.map(() => ''));
  const [invalid, setInvalid] = useState(false);
  const { cooling, submit } = useSubmit(onSubmit);
  const id = useId();
  const warnId = `${id}-warn`;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (locked) return;
    const parsed = texts.map(parseNumber);
    const value: number[] = [];
    for (const p of parsed) {
      if (!p.ok) {
        setInvalid(true);
        return;
      }
      value.push(p.value);
    }
    setInvalid(false);
    submit(grade(question, { type: 'vector', value }));
  };

  return (
    <form className="question" onSubmit={handleSubmit} noValidate>
      <Stem prompt={question.prompt} plane={question.plane} />
      <div className="question__answer">
        <div role="group" aria-label={t.questions.vectorLegend} className="question__tuple">
          <span aria-hidden="true">(</span>
          {texts.map((text, i) => {
            const rejected = invalid && !parseNumber(text).ok;
            return (
              <span key={i} className="question__tuple-part">
                {i > 0 ? <span aria-hidden="true">;</span> : null}
                <input
                  className="question__input question__input--component num"
                  type="text"
                  autoComplete="off"
                  aria-label={t.questions.componentLabel(i + 1, count)}
                  value={text}
                  disabled={locked}
                  aria-invalid={rejected}
                  aria-describedby={rejected ? warnId : undefined}
                  onChange={(e) => {
                    setTexts(texts.map((old, j) => (j === i ? e.target.value : old)));
                    setInvalid(false);
                  }}
                />
              </span>
            );
          })}
          <span aria-hidden="true">)</span>
        </div>
        <SubmitButton disabled={locked || cooling} />
      </div>
      {invalid ? <Invalid id={warnId}>{t.questions.invalidNumber}</Invalid> : null}
    </form>
  );
}
