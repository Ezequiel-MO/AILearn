import { useRef, useState } from 'react';
import type { Question } from '../content/schema';
import { Solution, Stage } from './ExerciseRunner';
import { Md } from './Md';
import { t } from './strings';

export interface ExerciseReviewProps {
  questions: Question[];
  /** Se lee una vez, al montar cada pregunta de código. */
  getDraft?: (questionId: string) => string | null;
  onDraft?: (questionId: string, code: string) => void;
  /** «Volver a hacerlo»: la tanda normal, que cuenta para la marca. */
  onRepeat: () => void;
}

/**
 * Repaso de un ejercicio ya entregado: se va a cualquier pregunta, se ven pistas y solución y se puede
 * volver a contestar para comprobarlo. Nada se registra: ni intentos ni marca (los borradores de código
 * sí se guardan, como en cualquier editor).
 */
export function ExerciseReview({ questions, getDraft, onDraft, onRepeat }: ExerciseReviewProps) {
  const [index, setIndex] = useState(0);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const progressRef = useRef<HTMLParagraphElement>(null);

  const question = questions[index];
  if (!question) return null;
  const hints = question.hints;

  const goTo = (i: number) => {
    if (i === index || i < 0 || i >= questions.length) return;
    setIndex(i);
    setVerdict(null);
    setHintsShown(0);
    setShowSolution(false);
    progressRef.current?.focus();
  };

  return (
    <section className="runner review">
      <p className="review__note">{t.review.note}</p>
      <nav className="review__nav" aria-label={t.review.navLabel}>
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            className="question__button review__tab num"
            aria-current={i === index ? 'step' : undefined}
            aria-label={t.review.goTo(i + 1)}
            onClick={() => goTo(i)}
          >
            {i + 1}
          </button>
        ))}
      </nav>
      <header className="runner__header">
        <p className="runner__progress num" ref={progressRef} tabIndex={-1}>
          {t.runner.progress(index + 1, questions.length)}
        </p>
      </header>
      <div className="runner__body" key={question.id}>
        <Stage
          question={question}
          locked={false}
          onSubmit={setVerdict}
          hideChecks={false}
          getDraft={getDraft}
          onDraft={onDraft}
        />
        <div className="runner__actions">
          {hintsShown < hints.length ? (
            <button
              type="button"
              className="question__button"
              onClick={() => setHintsShown((n) => n + 1)}
            >
              {t.runner.hint}
            </button>
          ) : null}
          <button
            type="button"
            className="question__button"
            aria-expanded={showSolution}
            onClick={() => setShowSolution((v) => !v)}
          >
            {showSolution ? t.review.hideSolution : t.review.showSolution}
          </button>
        </div>
        {hintsShown > 0 ? (
          <ol className="runner__hints" aria-label={t.runner.hintsLabel}>
            {hints.slice(0, hintsShown).map((hint, i) => (
              <li key={i} className="runner__hint">
                <Md>{hint}</Md>
              </li>
            ))}
          </ol>
        ) : null}
        <div
          className={`runner__feedback${verdict === null ? '' : verdict ? ' runner__feedback--ok' : ' runner__feedback--fail'}`}
          role="status"
        >
          {verdict === true ? (
            <p className="runner__note runner__note--ok">{t.runner.solved}</p>
          ) : null}
          {verdict === false ? <p className="runner__note">{t.review.wrong}</p> : null}
          {showSolution ? (
            <>
              <p className="runner__label">{t.runner.explainLabel}</p>
              <Md>{question.explain}</Md>
              <Solution text={question.solution} />
            </>
          ) : null}
        </div>
        <div className="runner__actions">
          <button
            type="button"
            className="question__button"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          >
            {t.review.previous}
          </button>
          <button
            type="button"
            className="question__button"
            disabled={index === questions.length - 1}
            onClick={() => goTo(index + 1)}
          >
            {t.review.next}
          </button>
          <button
            type="button"
            className="question__button question__button--primary"
            onClick={onRepeat}
          >
            {t.review.repeat}
          </button>
        </div>
      </div>
    </section>
  );
}
