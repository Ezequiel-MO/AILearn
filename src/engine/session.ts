import { firstTry } from './progression';

export type Mode = 'proyecto' | 'despegue' | 'hoja' | 'examen';
export type Phase = 'answering' | 'explained' | 'solved' | 'revealed';

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  submissions: number;
  hinted: boolean;
  firstTry: boolean;
}

export interface SessionState {
  mode: Mode;
  questionIds: string[];
  index: number;
  phase: Phase;
  submissions: number;
  hinted: boolean;
  hintsShown: number;
  results: QuestionResult[];
  done: boolean;
}

export type SessionEvent =
  | { type: 'hint'; available: number } // cuántas pistas tiene la pregunta
  | { type: 'submit'; correct: boolean }
  | { type: 'next' };

export const startSession = (mode: Mode, questionIds: string[]): SessionState => ({
  mode,
  questionIds: [...questionIds],
  index: 0,
  phase: 'answering',
  submissions: 0,
  hinted: false,
  hintsShown: 0,
  results: [],
  done: questionIds.length === 0,
});

const submit = (s: SessionState, correct: boolean): SessionState => {
  if (s.phase !== 'answering' && s.phase !== 'explained') return s;
  const submissions = s.submissions + 1;
  if (correct) return { ...s, submissions, phase: 'solved' };
  const secondChance = s.phase === 'answering' && s.mode !== 'examen';
  return { ...s, submissions, phase: secondChance ? 'explained' : 'revealed' };
};

const hint = (s: SessionState, available: number): SessionState => {
  if (s.mode === 'examen') return s;
  if (s.phase !== 'answering' && s.phase !== 'explained') return s;
  const hintsShown = Math.min(s.hintsShown + 1, available);
  if (!(hintsShown > s.hintsShown)) return s;
  return { ...s, hintsShown, hinted: true };
};

const advance = (s: SessionState): SessionState => {
  if (s.phase !== 'solved' && s.phase !== 'revealed') return s;
  const questionId = s.questionIds[s.index];
  if (questionId === undefined) return s;
  const correct = s.phase === 'solved';
  const result: QuestionResult = {
    questionId,
    correct,
    submissions: s.submissions,
    hinted: s.hinted,
    firstTry: firstTry({ correct, submissions: s.submissions, hinted: s.hinted }),
  };
  const results = [...s.results, result];
  const isLast = s.index + 1 >= s.questionIds.length;
  return {
    ...s,
    results,
    done: isLast,
    index: isLast ? s.index : s.index + 1,
    phase: 'answering',
    submissions: 0,
    hinted: false,
    hintsShown: 0,
  };
};

export const step = (s: SessionState, e: SessionEvent): SessionState => {
  if (s.done) return s;
  switch (e.type) {
    case 'submit':
      return submit(s, e.correct);
    case 'hint':
      return hint(s, e.available);
    case 'next':
      return advance(s);
  }
};

/**
 * Lo que se guarda de una tanda a medias para retomarla al volver: sus preguntas y los eventos que la
 * trajeron hasta aquí. Se guardan los eventos, no el estado, para que al retomarla los repita `step` y
 * las reglas sean las de siempre (también la segunda oportunidad y las pistas ya pedidas).
 */
export interface SavedRun {
  questionIds: string[];
  events: SessionEvent[];
}

const isEvent = (e: unknown): e is SessionEvent => {
  if (typeof e !== 'object' || e === null) return false;
  const { type } = e as { type?: unknown };
  if (type === 'next') return true;
  if (type === 'submit') return typeof (e as { correct?: unknown }).correct === 'boolean';
  if (type === 'hint') {
    const { available } = e as { available?: unknown };
    return typeof available === 'number' && Number.isInteger(available) && available >= 0;
  }
  return false;
};

/**
 * Retoma una tanda a medias: repite con `step` los eventos guardados sobre una tanda nueva. Devuelve null
 * si lo guardado está dañado, es de otras preguntas (el contenido cambió) o la tanda ya había terminado.
 * Los eventos que no cambian nada se descartan.
 */
export const resumeSession = (
  mode: Mode,
  questionIds: string[],
  saved: unknown,
): { state: SessionState; events: SessionEvent[] } | null => {
  if (typeof saved !== 'object' || saved === null) return null;
  const { questionIds: ids, events } = saved as { questionIds?: unknown; events?: unknown };
  if (!Array.isArray(ids) || ids.length !== questionIds.length) return null;
  if (!ids.every((id, i) => id === questionIds[i])) return null;
  if (!Array.isArray(events) || !events.every(isEvent)) return null;
  let state = startSession(mode, questionIds);
  const kept: SessionEvent[] = [];
  for (const event of events) {
    const next = step(state, event);
    if (next === state) continue;
    state = next;
    kept.push(event);
  }
  return state.done ? null : { state, events: kept };
};

export const firsts = (s: SessionState): number => s.results.filter((r) => r.firstTry).length;

export const correctCount = (s: SessionState): number => s.results.filter((r) => r.correct).length;
