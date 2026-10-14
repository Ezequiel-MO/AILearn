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

export const firsts = (s: SessionState): number => s.results.filter((r) => r.firstTry).length;

export const correctCount = (s: SessionState): number => s.results.filter((r) => r.correct).length;
