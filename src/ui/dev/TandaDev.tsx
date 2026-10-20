import { useRef, useState } from 'react';
import { resolve } from '../../content/generators';
import type { CodigoQ, ManipularQ, OpcionQ, Question, RevisionQ } from '../../content/schema';
import type { Mode, QuestionResult } from '../../engine/session';
import { ExerciseRunner, type RunSummary } from '../ExerciseRunner';
import { Layout } from '../Layout';

// Los textos de las páginas de desarrollo van aquí, no en strings.ts: así no entran en producción.
const TITLE = 'Ejecutor de tandas (desarrollo)';
const MODES: Mode[] = ['proyecto', 'despegue', 'examen'];
const RESTART = 'Empezar de nuevo';
const LOG_TITLE = 'Registro de la tanda';
const DRAFTS_TITLE = 'Borradores guardados (caracteres)';
const NO_DRAFTS = 'ninguno';
const DONE_PREFIX = 'onDone: ';

// Bloque de código cercado con una línea de 80 caracteres (a 360 px debe desplazarse él, no la página).
const FENCED =
  '```python\nnorma = sum(c * c for c in vector) ** 0.5  # 80 caracteres en esta línea........\nprint(norma)\n```';

const manipular: ManipularQ = {
  id: 'dev-manipular',
  type: 'manipular',
  prompt: 'Arrastra la punta de $\\vec{v}$ hasta que su norma valga 5.',
  hints: ['Piensa en el triángulo 3, 4, 5.', 'Prueba con $\\vec{v}=(3,\\ 4)$.'],
  explain: 'La norma es $\\sqrt{x^2+y^2}$: con $(3,\\ 4)$ sale $\\sqrt{25}=5$.',
  solution: '$\\lVert\\vec{v}\\rVert=\\sqrt{3^2+4^2}=\\sqrt{25}=5$',
  plane: {
    range: 6,
    snap: 1,
    vectors: [{ id: 'v', label: 'v', x: 1, y: 1, movable: true }],
    readouts: ['components', 'norm'],
  },
  goals: [{ metric: 'norm', of: ['v'], target: 5, tol: 0.01 }],
};

const unitario: Question = resolve(
  { type: 'generada', id: 'dev-unitario', generator: 'unitario', params: {} },
  7,
);

const opcion: OpcionQ = {
  id: 'dev-opcion',
  type: 'opcion',
  prompt: '¿Cuál es la norma de $(3,\\ 4)$?',
  hints: [],
  options: ['$7$', '$5$', '$12$'],
  correct: 1,
  explain: 'No es la suma de las componentes: es la raíz de la suma de los cuadrados.',
  solution: `$\\sqrt{3^2+4^2}=5$\n\n${FENCED}`,
};

const revision: RevisionQ = {
  id: 'dev-revision',
  type: 'revision',
  prompt: 'Revisa este código: una línea tiene un error.',
  hints: [],
  format: 'codigo',
  lines: [
    'norma = sum(componente * componente for componente in vector) ** 0.5  # raíz de la suma de cuadrados',
    'x = 1',
    'print(norma)',
  ],
  faultyLine: 1,
  explain: 'La segunda línea no hace nada con el vector.',
  solution: 'La línea 2 no usa `vector`.',
};

const codigo: CodigoQ = {
  id: 'dev-codigo',
  type: 'codigo',
  requirements: ['`x` vale 3.'],
  prompt: 'Asigna `x = 3` e imprímelo.',
  hints: ['Una asignación basta.'],
  explain: 'Falta asignar `x`.',
  solution: 'x = 3\nprint(x)',
  starter: 'x = 2\nprint(x)\n',
  checks: 'check(x == 3, "x debería valer 3")',
  reference: 'x = 3',
};

const QUESTIONS: Question[] = [manipular, unitario, opcion, revision, codigo];

export default function TandaDev() {
  const [mode, setMode] = useState<Mode>('proyecto');
  const [round, setRound] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const drafts = useRef(new Map<string, string>());
  const [draftSizes, setDraftSizes] = useState<string[]>([]);

  const restart = (next: Mode) => {
    setMode(next);
    setRound((n) => n + 1);
    setLog([]);
  };
  const onResult = (r: QuestionResult) =>
    setLog((l) => [...l, `${r.questionId}: ${r.correct ? 'bien' : 'mal'}, ${r.submissions}`]);
  const onDone = (s: RunSummary) =>
    setLog((l) => [...l, `${DONE_PREFIX}${s.firsts} / ${s.correct} / ${s.results.length}`]);

  return (
    <Layout title={TITLE} back="/">
      <div className="runner__actions">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            className="question__button"
            aria-pressed={m === mode}
            onClick={() => restart(m)}
          >
            {m}
          </button>
        ))}
        <button type="button" className="question__button" onClick={() => restart(mode)}>
          {RESTART}
        </button>
      </div>
      <ExerciseRunner
        key={`${mode}-${round}`}
        mode={mode}
        questions={QUESTIONS}
        onResult={onResult}
        onDone={onDone}
        getDraft={(id) => drafts.current.get(id) ?? null}
        onDraft={(id, code) => {
          drafts.current.set(id, code);
          setDraftSizes([...drafts.current].map(([k, v]) => `${k}: ${v.length}`));
        }}
      />
      <section data-testid="dev-log">
        <h2>{LOG_TITLE}</h2>
        <ul>
          {log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
        <p>
          {DRAFTS_TITLE}: {draftSizes.length === 0 ? NO_DRAFTS : draftSizes.join(', ')}
        </p>
      </section>
    </Layout>
  );
}
