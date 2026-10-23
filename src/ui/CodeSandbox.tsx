import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { RunResult } from '../python/core';
import { getRunner, PythonLoadError, type PythonRunner } from '../python/runner';
import { CodeEditor, type CodeEditorHandle } from './CodeEditor';
import { Outcome } from './questions/CodigoQuestion';
import { t } from './strings';

export interface CodeSandboxProps {
  /** Código de partida; «Volver al principio» lo repone. */
  initial: string;
  /** Con comprobaciones aparece «Comprobar»: las pasa y dice si se cumplen, sin puntuar nada. */
  checks?: string;
  /** Por defecto `getRunner()`; inyectable en pruebas. */
  runner?: PythonRunner;
}

/**
 * Un editor de Python para probar sin consecuencias (el calentamiento): «Ejecutar», «Comprobar» si hay
 * comprobaciones, y «Volver al principio». Nada se guarda ni cuenta para la nota.
 */
export function CodeSandbox({ initial, checks, runner: injected }: CodeSandboxProps) {
  const runner = injected ?? getRunner();
  const status = useSyncExternalStore(
    useCallback((notify: () => void) => runner.onStatus(notify), [runner]),
    () => runner.status(),
  );

  const [code, setCode] = useState(initial);
  const [result, setResult] = useState<RunResult | null>(null);
  const [harnessFailed, setHarnessFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  // En una página con varios editores, los avisos de carga solo salen en el que se ha usado.
  const [tried, setTried] = useState(false);

  const editor = useRef<CodeEditorHandle>(null);
  const codeRef = useRef(initial);
  const busyRef = useRef(false);
  const alive = useRef(false);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const handleChange = (value: string) => {
    codeRef.current = value;
    setCode(value);
  };

  const unavailable = status === 'loading' || status === 'failed';

  const execute = async (withChecks: boolean) => {
    if (busyRef.current || runner.status() === 'loading' || runner.status() === 'failed') return;
    busyRef.current = true;
    setBusy(true);
    setTried(true);
    setHarnessFailed(false);
    try {
      const outcome =
        withChecks && checks !== undefined
          ? await runner.run(codeRef.current, { checks })
          : await runner.run(codeRef.current);
      if (!alive.current) return;
      setResult(outcome);
    } catch (e) {
      if (!alive.current) return;
      setResult(null);
      // PythonLoadError: el estado `failed` ya muestra el aviso. Otro Error: fallo del arnés.
      if (!(e instanceof PythonLoadError)) setHarnessFailed(true);
    } finally {
      busyRef.current = false;
      if (alive.current) setBusy(false);
    }
  };

  const restore = () => {
    codeRef.current = initial;
    setCode(initial);
    setResult(null);
    setHarnessFailed(false);
    editor.current?.focus();
  };

  // Como en las preguntas de código: aria-disabled (no disabled) para que el botón conserve el foco.
  const inactive = unavailable || busy;
  const figures = result?.figures ?? [];

  return (
    <div className="code sandbox">
      <div className="code__main">
        <CodeEditor
          ref={editor}
          value={code}
          onChange={handleChange}
          onRun={() => void execute(false)}
        />
        <div className="code__actions">
          <button
            type="button"
            className={`question__button${checks === undefined ? ' question__button--primary' : ''}`}
            aria-disabled={inactive || undefined}
            onClick={() => void execute(false)}
          >
            {t.code.run}
          </button>
          {checks !== undefined ? (
            <button
              type="button"
              className="question__button question__button--primary"
              aria-disabled={inactive || undefined}
              onClick={() => void execute(true)}
            >
              {t.warmup.check}
            </button>
          ) : null}
          <button type="button" className="question__button" disabled={busy} onClick={restore}>
            {t.warmup.restore}
          </button>
        </div>
        {tried && status === 'loading' ? (
          <p className="code__status" role="status">
            {t.code.loading}
          </p>
        ) : null}
        {tried && status === 'failed' ? (
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
        <div className="code__results" role="status" aria-label={t.code.resultsLabel}>
          {result && !result.timedOut ? (
            <>
              {result.passed ? <p className="sandbox__passed">{t.warmup.passed}</p> : null}
              <Outcome result={result} hideChecks={false} silentNote={figures.length === 0} />
            </>
          ) : null}
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
