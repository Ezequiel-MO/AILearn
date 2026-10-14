import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { PlaneSpec } from '../../content/schema';
import { Md } from '../Md';
import { t } from '../strings';
import { VectorPlane } from '../VectorPlane';

/** Tiempo que el botón de entrega queda desactivado tras una entrega (evita la doble pulsación). */
export const SUBMIT_COOLDOWN_MS = 450;

export interface QuestionProps<Q> {
  question: Q;
  /** Fase 'solved' o 'revealed': las entradas no admiten cambios y conservan lo último que puso el jugador. */
  locked: boolean;
  /** Solo se llama con una respuesta válida; el argumento es el resultado de `grade`. */
  onSubmit: (correct: boolean) => void;
  /**
   * Examen: la entrega no enseña la corrección. Solo la pregunta de código la tiene (sus comprobaciones);
   * las demás lo ignoran. Por defecto `false`.
   */
  hideChecks?: boolean;
}

/** Posiciones iniciales de todos los vectores de un plano. */
export const startPositions = (spec: PlaneSpec): Record<string, [number, number]> =>
  Object.fromEntries(spec.vectors.map((v) => [v.id, [v.x, v.y] as [number, number]]));

/**
 * Entrega con guarda: la primera llamada pasa y el botón queda desactivado `SUBMIT_COOLDOWN_MS`.
 * La guarda es una ref, así que dos eventos en el mismo ciclo de render tampoco la cruzan.
 */
export function useSubmit(onSubmit: (correct: boolean) => void) {
  const [cooling, setCooling] = useState(false);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const submit = (correct: boolean) => {
    if (busy.current) return;
    busy.current = true;
    setCooling(true);
    timer.current = setTimeout(() => {
      busy.current = false;
      setCooling(false);
    }, SUBMIT_COOLDOWN_MS);
    onSubmit(correct);
  };
  return { cooling, submit };
}

/** Enunciado y, si la pregunta trae plano, la figura estática. */
export function Stem({ prompt, plane }: { prompt: string; plane?: PlaneSpec }) {
  return (
    <div className="question__stem">
      <Md>{prompt}</Md>
      {plane ? <VectorPlane spec={plane} positions={startPositions(plane)} /> : null}
    </div>
  );
}

export function SubmitButton({ disabled }: { disabled: boolean }) {
  return (
    <button
      type="submit"
      className="question__button question__button--primary"
      disabled={disabled}
    >
      {t.questions.submit}
    </button>
  );
}

export function Invalid({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="question__invalid" role="alert">
      {children}
    </p>
  );
}
