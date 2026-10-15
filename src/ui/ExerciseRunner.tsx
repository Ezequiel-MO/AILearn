import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Question } from '../content/schema';
import {
  correctCount,
  firsts,
  startSession,
  step,
  type Mode,
  type QuestionResult,
  type SessionEvent,
  type SessionState,
} from '../engine/session';
import { Md } from './Md';
import { SUBMIT_COOLDOWN_MS } from './questions/parts';
import { QuestionView } from './questions/QuestionView';
import { t } from './strings';

export interface RunSummary {
  firsts: number;
  correct: number;
  results: QuestionResult[];
}

export interface ExerciseRunnerProps {
  mode: Mode;
  questions: Question[];
  /** Al cerrar cada pregunta (al pulsar «Siguiente»), no al entregar. */
  onResult: (r: QuestionResult) => void;
  /** Una sola vez: al cerrar la última pregunta, o al montar si la tanda está vacía. */
  onDone: (summary: RunSummary) => void;
  /** Se lee una vez, al montar cada pregunta de código. */
  getDraft?: (questionId: string) => string | null;
  onDraft?: (questionId: string, code: string) => void;
}

/**
 * Presenta una tanda de preguntas una a una. Todo el estado (fase, intentos, pistas, resultados) sale de
 * `step`; este componente solo pinta lo que dice el motor y traduce los gestos en eventos.
 * La tanda se fija al montar: si cambian `mode` o `questions`, hay que montar otra con otra `key`.
 */
export function ExerciseRunner({
  mode,
  questions,
  onResult,
  onDone,
  getDraft,
  onDraft,
}: ExerciseRunnerProps) {
  const [state, setState] = useState(() =>
    startSession(
      mode,
      questions.map((q) => q.id),
    ),
  );
  // Espejo síncrono del estado: la entrega de una pregunta de código llega segundos después del clic,
  // con el cierre de entonces; el evento se aplica siempre sobre el estado actual.
  const current = useRef(state);
  const callbacks = useRef({ onResult, onDone });
  useEffect(() => {
    callbacks.current = { onResult, onDone };
  });

  const dispatch = (event: SessionEvent) => {
    const prev = current.current;
    const next = step(prev, event);
    if (next === prev) return;
    current.current = next;
    setState(next);
    const closed = next.results[next.results.length - 1];
    if (next.results.length > prev.results.length && closed) callbacks.current.onResult(closed);
    if (next.done && !prev.done) callbacks.current.onDone(summaryOf(next));
  };

  // Una tanda vacía nace terminada: nadie pulsará «Siguiente», así que se avisa al montar.
  const announcedEmpty = useRef(false);
  useEffect(() => {
    if (current.current.done && !announcedEmpty.current) {
      announcedEmpty.current = true;
      callbacks.current.onDone(summaryOf(current.current));
    }
  }, []);

  const question = questions[state.index];
  const hints = question?.hints ?? [];
  const closing = step(state, { type: 'next' });
  // Lo que el motor aceptaría ahora: ninguna regla se repite aquí.
  const locked = !state.done && closing !== state;
  const canHint = !state.done && step(state, { type: 'hint', available: hints.length }) !== state;
  const lastResult = closing.results[closing.results.length - 1];
  const firstTry = locked && lastResult?.firstTry === true;
  const exam = mode === 'examen';
  // Color de la barra del panel: acierto, fallo (con segunda oportunidad o definitivo); en examen, neutro.
  const feedbackTone = exam
    ? null
    : state.phase === 'solved'
      ? 'ok'
      : state.phase === 'answering'
        ? null
        : 'fail';

  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLParagraphElement>(null);
  const hintsRef = useRef<HTMLOListElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef<HTMLParagraphElement>(null);

  // El foco solo se mueve si el control que lo tenía dejó de servir (desactivado, desmontado → body, o el
  // editor de código que quedó de solo lectura). Si el jugador sigue escribiendo en un control que sigue
  // activo, el resultado llega sin robarle las teclas.
  const focusStays = (afterLock: boolean) => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || active === document.body) return false;
    if (active.matches(':disabled')) return false;
    if (afterLock && active.closest('.cm-editor')) return false;
    return true;
  };

  // Al bloquear, el control enfocado queda desactivado y el foco cae en body: pasa a «Siguiente».
  // Al terminar, «Siguiente» desaparece: el foco pasa al aviso final.
  const lockedAt = useRef(0);
  const lastKeyAt = useRef(0);
  const swallowedSpace = useRef(false);
  useEffect(() => {
    if (state.done) {
      finishedRef.current?.focus();
    } else if (locked) {
      lockedAt.current = performance.now();
      if (!focusStays(true)) nextRef.current?.focus();
    }
  }, [state.done, locked]);

  // Tras un fallo con segunda oportunidad, «Entregar» queda desactivado un instante y el foco cae en body:
  // pasa al panel de la explicación (el lector de pantalla lo lee y Mayús+Tab vuelve a la pregunta).
  useEffect(() => {
    if (state.phase === 'explained' && !focusStays(false)) feedbackRef.current?.focus();
  }, [state.phase]);

  // Al cambiar de pregunta, «Siguiente» se desmonta con el foco encima: pasa al indicador de progreso.
  const previousIndex = useRef(state.index);
  useEffect(() => {
    if (previousIndex.current !== state.index) progressRef.current?.focus();
    previousIndex.current = state.index;
  }, [state.index]);

  // Al enseñar la última pista, «Dame una pista» desaparece con el foco encima: pasa a la lista.
  const previousHints = useRef(state.hintsShown);
  useEffect(() => {
    if (state.hintsShown > previousHints.current && !canHint) hintsRef.current?.focus();
    previousHints.current = state.hintsShown;
  }, [state.hintsShown, canHint]);

  if (state.done) {
    return (
      <p className="runner__finished" ref={finishedRef} tabIndex={-1}>
        {t.runner.finished}
      </p>
    );
  }
  if (!question) return null;

  // Una entrega tardía (el código tarda segundos) se aplica al estado de ahora; si la fase ya no admite
  // entregas, `step` la ignora. Una pregunta desmontada nunca llega a entregar.
  const onSubmit = (correct: boolean) => dispatch({ type: 'submit', correct });

  // «Siguiente» no admite la tecla mantenida ni una pulsación mientras el jugador siga tecleando: el plazo
  // se cuenta desde el bloqueo o desde la ÚLTIMA tecla que le llega (la que estaba en curso, Intro tecleado
  // en el editor, tecla repetida, no cierra la pregunta antes de verla; una pausa de más del plazo y un
  // Intro deliberado sí avanzan). El ratón no espera.
  const guardNextKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const now = performance.now();
    const quiet = now - Math.max(lockedAt.current, lastKeyAt.current);
    lastKeyAt.current = now;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.repeat || quiet < SUBMIT_COOLDOWN_MS) {
      e.preventDefault();
      if (e.key === ' ') swallowedSpace.current = true;
    }
  };
  const guardNextKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' && swallowedSpace.current) {
      swallowedSpace.current = false;
      e.preventDefault();
    }
  };

  return (
    <section className="runner" ref={sectionRef}>
      <header className="runner__header">
        <p className="runner__progress num" ref={progressRef} tabIndex={-1}>
          {t.runner.progress(state.index + 1, state.questionIds.length)}
        </p>
        {mode === 'proyecto' ? (
          <p className="runner__firsts num">{t.runner.firsts(firsts(state))}</p>
        ) : null}
      </header>
      <div className="runner__body" key={question.id}>
        <Stage
          question={question}
          locked={locked}
          onSubmit={onSubmit}
          hideChecks={exam}
          getDraft={getDraft}
          onDraft={onDraft}
        />
        {canHint ? (
          <div className="runner__actions">
            <button
              type="button"
              className="question__button"
              onClick={() => dispatch({ type: 'hint', available: hints.length })}
            >
              {t.runner.hint}
            </button>
          </div>
        ) : null}
        {state.hintsShown > 0 ? (
          <ol
            className="runner__hints"
            aria-label={t.runner.hintsLabel}
            ref={hintsRef}
            tabIndex={-1}
          >
            {hints.slice(0, state.hintsShown).map((hint, i) => (
              <li key={i} className="runner__hint">
                <Md>{hint}</Md>
              </li>
            ))}
          </ol>
        ) : null}
        <div
          className={`runner__feedback${feedbackTone ? ` runner__feedback--${feedbackTone}` : ''}`}
          role="status"
          ref={feedbackRef}
          tabIndex={-1}
        >
          {state.phase === 'explained' ? (
            <>
              <p className="runner__note">{t.runner.explainedIntro}</p>
              <p className="runner__label">{t.runner.explainLabel}</p>
              <Md>{question.explain}</Md>
            </>
          ) : null}
          {locked && exam ? <p className="runner__note">{t.runner.recorded}</p> : null}
          {locked && !exam && state.phase === 'solved' ? (
            <>
              <p className="runner__note runner__note--ok">{t.runner.solved}</p>
              {firstTry ? null : <Solution text={question.solution} />}
            </>
          ) : null}
          {locked && !exam && state.phase === 'revealed' ? (
            <>
              <p className="runner__note">{t.runner.revealedIntro}</p>
              <Solution text={question.solution} />
            </>
          ) : null}
        </div>
        {locked ? (
          <div className="runner__actions">
            <button
              type="button"
              ref={nextRef}
              className="question__button question__button--primary"
              onClick={() => dispatch({ type: 'next' })}
              onKeyDown={guardNextKey}
              onKeyUp={guardNextKeyUp}
            >
              {t.runner.next}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

const summaryOf = (s: SessionState): RunSummary => ({
  firsts: firsts(s),
  correct: correctCount(s),
  results: s.results,
});

export function Solution({ text }: { text: string }) {
  return (
    <>
      <p className="runner__label">{t.runner.solutionLabel}</p>
      <Md>{text}</Md>
    </>
  );
}

/**
 * La pregunta con su borrador. Vive con `key` por pregunta: el borrador se lee una sola vez al montar
 * (la pregunta de código no lo relee) y `onDraft` queda atado al id de ESTA pregunta.
 */
export function Stage({
  question,
  locked,
  onSubmit,
  hideChecks,
  getDraft,
  onDraft,
}: {
  question: Question;
  locked: boolean;
  onSubmit: (correct: boolean) => void;
  hideChecks: boolean;
  getDraft?: (questionId: string) => string | null;
  onDraft?: (questionId: string, code: string) => void;
}) {
  const [draft] = useState(() =>
    question.type === 'codigo' ? (getDraft?.(question.id) ?? null) : null,
  );
  const latest = useRef(onDraft);
  useEffect(() => {
    latest.current = onDraft;
  });
  const id = question.id;
  const saveDraft = useCallback((code: string) => latest.current?.(id, code), [id]);
  return (
    <QuestionView
      question={question}
      locked={locked}
      onSubmit={onSubmit}
      hideChecks={hideChecks}
      draft={draft}
      onDraft={onDraft ? saveDraft : undefined}
    />
  );
}
