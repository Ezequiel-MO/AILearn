import { useId, useState } from 'react';
import { grade } from '../../content/grade';
import type { RevisionQ } from '../../content/schema';
import { Md } from '../Md';
import { t } from '../strings';
import { useSubmit, type QuestionProps } from './parts';

type Verdict = 'ok' | 'fault';

export function RevisionQuestion({ question, locked, onSubmit }: QuestionProps<RevisionQ>) {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [line, setLine] = useState<number | null>(null);
  const { cooling, submit } = useSubmit(onSubmit);
  const group = useId();

  const ready = verdict === 'ok' || (verdict === 'fault' && line !== null);
  const pickable = verdict === 'fault';

  const handleSubmit = () => {
    if (locked || !ready) return;
    submit(grade(question, { type: 'revision', faultyLine: verdict === 'ok' ? null : line }));
  };

  const choose = (v: Verdict) => {
    setVerdict(v);
    if (v === 'ok') setLine(null);
  };

  return (
    <div className="question">
      <div className="question__stem">
        <Md>{question.prompt}</Md>
      </div>
      <ol
        className={`question__lines question__lines--${question.format === 'codigo' ? 'code' : 'text'}`}
        aria-label={t.questions.linesLegend}
      >
        {question.lines.map((text, i) => (
          <li key={i} className="question__line">
            {pickable ? (
              <button
                type="button"
                className="question__line-button"
                aria-pressed={line === i}
                disabled={locked}
                aria-label={t.questions.lineLabel(i + 1, text)}
                onClick={() => setLine(i)}
              >
                <span className="question__line-number num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="question__line-text">{text}</span>
              </button>
            ) : (
              <span className="question__line-static">
                <span className="question__line-number num">{i + 1}</span>
                <span className="question__line-text">{text}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
      <fieldset className="question__options" disabled={locked}>
        <legend className="question__legend">{t.questions.verdictLegend}</legend>
        <label className="question__option">
          <input
            type="radio"
            name={group}
            checked={verdict === 'ok'}
            onChange={() => choose('ok')}
          />
          <span>{t.questions.verdictOk}</span>
        </label>
        <label className="question__option">
          <input
            type="radio"
            name={group}
            checked={verdict === 'fault'}
            onChange={() => choose('fault')}
          />
          <span>{t.questions.verdictFault}</span>
        </label>
      </fieldset>
      {verdict === 'fault' && !locked ? (
        <p className="question__hint">{t.questions.pickLine}</p>
      ) : null}
      <div className="question__answer">
        <button
          type="button"
          className="question__button question__button--primary"
          disabled={locked || cooling || !ready}
          onClick={handleSubmit}
        >
          {t.questions.submit}
        </button>
      </div>
    </div>
  );
}
