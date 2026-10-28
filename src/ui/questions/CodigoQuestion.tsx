import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { CodigoQ } from '../../content/schema';
import type { RunResult } from '../../python/core';
import { getRunner, PythonLoadError, type PythonRunner } from '../../python/runner';
import { CodeEditor, type CodeEditorHandle } from '../CodeEditor';
import { Md } from '../Md';
import { t } from '../strings';
import { Stem, useSubmit, type QuestionProps } from './parts';

/** Espera máxima entre dos guardados del borrador mientras el jugador escribe. */
export const DRAFT_INTERVAL_MS = 500;

export type CodigoQuestionProps = QuestionProps<CodigoQ> & {
  /** Borrador guardado, si lo hay. */
  draft: string | null;
  onDraft: (code: string) => void;
  /** Por defecto `getRunner()`; inyectable en pruebas. */
  runner?: PythonRunner;
};

type Mode = 'run' | 'submit';

export function CodigoQuestion({
  question,
  locked,
  onSubmit,
  hideChecks = false,
  draft,
  onDraft,
  runner: injected,
}: CodigoQuestionProps) {
  const runner = injected ?? getRunner();
  const status = useSyncExternalStore(
    useCallback((notify: () => void) => runner.onStatus(notify), [runner]),
    () => runner.status(),
  );
  const { cooling, submit } = useSubmit(onSubmit);

  const [code, setCode] = useState(draft ?? question.starter);
  const [result, setResult] = useState<RunResult | null>(null);
  // Si el resultado a la vista viene de «Entregar» (con comprobaciones) o de «Ejecutar».
  const [resultMode, setResultMode] = useState<Mode | null>(null);
  const [harnessFailed, setHarnessFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const editor = useRef<CodeEditorHandle>(null);
  const codeRef = useRef(code);
  const busyRef = useRef(false);
  const alive = useRef(false);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onDraftRef = useRef(onDraft);
  useEffect(() => {
    onDraftRef.current = onDraft;
  });

  // Guarda el borrador ya (o, si no hay cambios pendientes y no se fuerza, no hace nada).
  const flushDraft = (force: boolean) => {
    clearTimeout(timer.current);
    timer.current = undefined;
    if (!dirty.current && !force) return;
    dirty.current = false;
    onDraftRef.current(codeRef.current);
  };

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      // Lo tecleado no se pierde si la pregunta se desmonta antes de la espera.
      flushDraft(false);
    };
  }, []);

  const handleChange = (value: string) => {
    codeRef.current = value;
    setCode(value);
    dirty.current = true;
    timer.current ??= setTimeout(() => flushDraft(false), DRAFT_INTERVAL_MS);
  };

  const unavailable = status === 'loading' || status === 'failed';

  const execute = async (mode: Mode) => {
    if (busyRef.current || runner.status() === 'loading' || runner.status() === 'failed') return;
    if (mode === 'submit' && locked) return;
    busyRef.current = true;
    setBusy(true);
    setHarnessFailed(false);
    flushDraft(true);
    const source = codeRef.current;
    try {
      const outcome =
        mode === 'submit'
          ? await runner.run(source, { checks: question.checks })
          : await runner.run(source);
      if (!alive.current) return;
      setResult(outcome);
      setResultMode(mode);
      if (mode === 'submit') submit(outcome.timedOut ? false : outcome.passed);
    } catch (e) {
      if (!alive.current) return;
      setResult(null);
      setResultMode(null);
      // PythonLoadError: el estado `failed` ya muestra el aviso. Otro Error: fallo del arnés, no una respuesta.
      if (!(e instanceof PythonLoadError)) setHarnessFailed(true);
    } finally {
      busyRef.current = false;
      if (alive.current) setBusy(false);
    }
  };

  const reset = () => {
    codeRef.current = question.starter;
    setCode(question.starter);
    setConfirming(false);
    // Vuelve a la pantalla inicial: nada de la ejecución anterior queda a la vista.
    setResult(null);
    setResultMode(null);
    setHarnessFailed(false);
    dirty.current = false;
    flushDraft(true);
    // El panel de confirmación desaparece con el foco dentro: el foco vuelve al editor.
    editor.current?.focus();
  };

  // «Ejecutar» y «Entregar» pasan a aria-disabled (no disabled) mientras corre una ejecución, y también con
  // el ejecutor en `loading` (carga inicial o recarga tras un plazo agotado) o `failed`: el botón conserva
  // el foco, que con disabled caería en body. `execute` ya ignora la pulsación (busyRef, runner.status()).
  // `disabled` queda para lo que la tanda gestiona: «Entregar» bloqueada o en espera.
  const inactive = unavailable || busy;
  const figures = result?.figures ?? [];
  // «Cómo seguir»: tras una entrega fallida que todavía se puede repetir, fuera del examen.
  const failedSubmit =
    resultMode === 'submit' &&
    !hideChecks &&
    !locked &&
    result !== null &&
    !result.timedOut &&
    !result.passed;

  return (
    <div className="question code">
      <Stem prompt={question.prompt} />
      {question.requirements.length > 0 ? (
        <section className="code__requirements">
          <h3 className="code__label">{t.code.requirementsLabel}</h3>
          <ul className="code__requirements-list">
            {question.requirements.map((r, i) => (
              <li key={i}>
                <Md inline>{r}</Md>
              </li>
            ))}
          </ul>
          <p className="code__requirements-note">{t.code.requirementsNote}</p>
        </section>
      ) : null}
      <div className={`code__work${figures.length > 0 ? ' code__work--figures' : ''}`}>
        <div className="code__main">
          <CodeEditor
            ref={editor}
            value={code}
            onChange={handleChange}
            readOnly={locked}
            onRun={() => void execute('run')}
          />
          <div className="code__actions">
            <button
              type="button"
              className="question__button"
              aria-disabled={inactive || undefined}
              onClick={() => void execute('run')}
            >
              {t.code.run}
            </button>
            <button
              type="button"
              className="question__button question__button--primary"
              disabled={locked || cooling}
              aria-disabled={inactive || undefined}
              onClick={() => void execute('submit')}
            >
              {t.questions.submit}
            </button>
            <button
              type="button"
              className="question__button"
              disabled={locked || busy}
              onClick={() => setConfirming(true)}
            >
              {t.code.reset}
            </button>
          </div>
          {confirming && !locked ? (
            <div className="code__confirm">
              <p>{t.code.resetConfirm}</p>
              <div className="code__actions">
                <button type="button" className="question__button" onClick={reset}>
                  {t.code.resetYes}
                </button>
                <button
                  type="button"
                  className="question__button"
                  onClick={() => setConfirming(false)}
                >
                  {t.code.resetNo}
                </button>
              </div>
            </div>
          ) : null}
          {status === 'loading' ? (
            <p className="code__status" role="status">
              {t.code.loading}
            </p>
          ) : null}
          {status === 'failed' ? (
            <div className="question__invalid code__failed" role="alert">
              <p>{t.code.loadFailed}</p>
              <button type="button" className="question__button" onClick={() => runner.retry()}>
                {t.code.retry}
              </button>
            </div>
          ) : null}
          {busy && status !== 'loading' ? (
            <p className="code__status" role="status">
              {t.code.running}
            </p>
          ) : null}
          {harnessFailed ? (
            <p className="question__invalid" role="alert">
              {t.code.runFailed}
            </p>
          ) : null}
          {result?.timedOut ? (
            <p className="question__invalid" role="alert">
              {t.code.timedOut}
            </p>
          ) : null}
          {/* Región viva (siempre presente, para que se anuncie lo que entra): salida, traza y comprobaciones. */}
          <div className="code__results" role="status" aria-label={t.code.resultsLabel}>
            {result && !result.timedOut ? (
              <Outcome result={result} hideChecks={hideChecks} silentNote={figures.length === 0} />
            ) : null}
            {failedSubmit ? (
              <NextSteps
                error={result.error !== null}
                hasRequirements={question.requirements.length > 0}
              />
            ) : null}
          </div>
        </div>
        {figures.length > 0 ? (
          <div className="code__figures">
            <h3 className="code__label">{t.code.figuresLabel}</h3>
            {figures.map((src, i) => (
              <img key={i} className="code__figure" src={src} alt={t.code.figureAlt(i + 1)} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NextSteps({ error, hasRequirements }: { error: boolean; hasRequirements: boolean }) {
  return (
    <section className="code__next">
      <h3 className="code__label">{t.code.nextLabel}</h3>
      <ul className="code__next-list">
        <li>{error ? t.code.nextError : t.code.nextChecks}</li>
        <li>
          <Md inline>{t.code.nextPrint}</Md>
        </li>
        {hasRequirements ? <li>{t.code.nextRequirements}</li> : null}
      </ul>
    </section>
  );
}

/** Salida, error y comprobaciones fallidas de una ejecución. También la usa el calentamiento (`CodeSandbox`). */
export function Outcome({
  result,
  hideChecks,
  silentNote,
}: {
  result: RunResult;
  hideChecks: boolean;
  /** «Ejecutar» sin salida, sin error y sin figuras: se explica cómo ver los valores. */
  silentNote: boolean;
}) {
  const showChecks = !hideChecks && result.checks !== null && result.checks.length > 0;
  const silent =
    silentNote && result.checks === null && result.stdout === '' && result.error === null;
  if (silent) {
    return (
      <div className="code__result">
        <p className="code__silent">
          <Md inline>{t.code.silentRun}</Md>
        </p>
      </div>
    );
  }
  // Sin nada que enseñar (examen sin salida ni errores) no hay contenedor: la región viva sigue vacía.
  if (result.stdout === '' && result.error === null && !showChecks) return null;
  return (
    <div className="code__result">
      {result.stdout !== '' ? (
        <section>
          <h3 className="code__label">{t.code.outputLabel}</h3>
          <pre className="code__output">{result.stdout}</pre>
        </section>
      ) : null}
      {result.error !== null ? (
        <section>
          <h3 className="code__label">{t.code.errorLabel}</h3>
          <pre className="code__output code__output--error">{result.error}</pre>
        </section>
      ) : null}
      {showChecks && result.checks !== null ? (
        <section>
          <h3 className="code__label">{t.code.checksLabel}</h3>
          <p className="code__summary">
            {t.code.checksSummary(
              result.checks.filter((c) => c.passed).length,
              result.checks.length,
            )}
          </p>
          {result.checks.some((c) => !c.passed) ? (
            <p className="code__summary-note">{t.code.checksAll}</p>
          ) : null}
          {/* R44: una comprobación superada nunca enseña su mensaje (es un diagnóstico de fallo). */}
          {result.checks.some((c) => !c.passed) ? (
            <ul className="code__checks">
              {result.checks
                .filter((c) => !c.passed)
                .map((c, i) => (
                  <li key={i} className="code__check code__check--fail">
                    <span className="code__check-mark">{t.code.checkFailed}</span>
                    <Md inline>{c.message}</Md>
                  </li>
                ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
