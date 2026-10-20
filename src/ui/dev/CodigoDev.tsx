import { useState } from 'react';
import type { CodigoQ } from '../../content/schema';
import { Layout } from '../Layout';
import { CodigoQuestion } from '../questions/CodigoQuestion';

// Los textos de las páginas de desarrollo van aquí, no en strings.ts: así no entran en producción.
const TITLE = 'Pregunta de código (desarrollo)';
const LAST_SUBMIT = 'Última entrega: ';
const NO_SUBMIT = 'ninguna';
const DRAFT_SAVED = 'Borrador guardado (caracteres): ';
const LOCK = 'Bloquear';
const UNLOCK = 'Desbloquear';

const SNIPPETS: { label: string; code: string }[] = [
  {
    label: 'Figura con matplotlib',
    code: 'import matplotlib.pyplot as plt\nplt.plot([0, 1, 2], [0, 1, 4])\nplt.title("y = x al cuadrado")',
  },
  { label: 'Bucle infinito', code: 'while True:\n    pass' },
  { label: 'print(1)', code: 'print(1)' },
  { label: 'Error', code: 'print(a)' },
];

const question: CodigoQ = {
  id: 'dev-codigo',
  type: 'codigo',
  requirements: ['`x` vale 3.'],
  prompt: 'Calcula `x = 3` e imprímelo. Las **comprobaciones** miran que `x` valga 3.',
  hints: [],
  explain: 'Explicación de prueba.',
  solution: 'x = 3\nprint(x)',
  starter: 'x = 2\nprint(x)\n',
  checks: 'check(x == 3, "x debería valer 3")\ncheck(True, "Esta siempre se cumple")',
  reference: 'x = 3',
};

export default function CodigoDev() {
  const [draft, setDraft] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const [locked, setLocked] = useState(false);
  return (
    <Layout title={TITLE} back="/">
      <div className="code__actions">
        {SNIPPETS.map((s) => (
          <button
            key={s.label}
            type="button"
            className="question__button"
            onClick={() => {
              setDraft(s.code);
              setLoaded((n) => n + 1);
            }}
          >
            {s.label}
          </button>
        ))}
        <button type="button" className="question__button" onClick={() => setLocked((l) => !l)}>
          {locked ? UNLOCK : LOCK}
        </button>
      </div>
      <p data-testid="dev-submit">
        {LAST_SUBMIT}
        {submitted === null ? NO_SUBMIT : String(submitted)}
      </p>
      <p data-testid="dev-draft">
        {DRAFT_SAVED}
        {draft === null ? 0 : draft.length}
      </p>
      <CodigoQuestion
        key={loaded}
        question={question}
        locked={locked}
        onSubmit={setSubmitted}
        draft={draft}
        onDraft={setDraft}
      />
    </Layout>
  );
}
