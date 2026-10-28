import { useId, useState, type CSSProperties, type FormEvent } from 'react';
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

  const field = (i: number, label: string) => {
    const text = texts[i];
    const rejected = invalid && !parseNumber(text).ok;
    return (
      <input
        className="question__input question__input--component num"
        type="text"
        autoComplete="off"
        aria-label={label}
        value={text}
        disabled={locked}
        aria-invalid={rejected}
        aria-describedby={rejected ? warnId : undefined}
        onChange={(e) => {
          setTexts(texts.map((old, j) => (j === i ? e.target.value : old)));
          setInvalid(false);
        }}
      />
    );
  };

  // con `shape`, la respuesta es una matriz (por filas); sin ella, una tupla
  const [rows, cols] = question.shape ?? [0, 0];

  return (
    <form className="question" onSubmit={handleSubmit} noValidate>
      <Stem prompt={question.prompt} plane={question.plane} purpose={question.purpose} />
      <div className="question__answer">
        {question.shape ? (
          <div
            role="group"
            aria-label={t.questions.matrixLegend}
            className="question__matrix"
            style={{ '--matrix-cols': cols } as CSSProperties}
          >
            {Array.from({ length: rows * cols }, (_, i) => (
              <span key={i} className="question__matrix-cell">
                {field(i, t.questions.cellLabel(Math.floor(i / cols) + 1, (i % cols) + 1))}
              </span>
            ))}
          </div>
        ) : (
          <div role="group" aria-label={t.questions.vectorLegend} className="question__tuple">
            <span aria-hidden="true">(</span>
            {texts.map((_, i) => (
              <span key={i} className="question__tuple-part">
                {i > 0 ? <span aria-hidden="true">;</span> : null}
                {field(i, t.questions.componentLabel(i + 1, count))}
              </span>
            ))}
            <span aria-hidden="true">)</span>
          </div>
        )}
        <SubmitButton disabled={locked || cooling} />
      </div>
      {invalid ? <Invalid id={warnId}>{t.questions.invalidNumber}</Invalid> : null}
    </form>
  );
}
