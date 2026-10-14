import type { RevisionQ } from '../../content/schema';
import { Layout } from '../Layout';
import { Md } from '../Md';
import { QuestionView } from '../questions/QuestionView';

// Los textos de las páginas de desarrollo van aquí, no en strings.ts: así no entran en producción.
const TITLE = 'Preguntas y fórmulas (desarrollo)';
const FORMULAS = [
  'Exponente: $3^2$ y $x_{i}^{2}$',
  'Vector: $\\vec{v}$ y $\\overrightarrow{AB}$',
  'Fracción: $\\dfrac{1}{2{,}24}$',
  'Norma: $\\lVert\\vec v\\rVert$',
  'Suma: $\\sum_{i}^{n} x_i$',
].join('\n\n');

const base = { hints: [], explain: 'e', solution: 's', prompt: 'Revisa el razonamiento.' };
const texto: RevisionQ = {
  ...base,
  id: 'dev-texto',
  type: 'revision',
  format: 'texto',
  lines: [
    'Como la norma de v vale 2,24 y la de u vale 3, concluyo que la distancia entre ambos es siempre la diferencia de normas, sin mirar el ángulo.',
    'Por tanto, la distancia es 0,76.',
  ],
  faultyLine: 0,
};
const codigo: RevisionQ = {
  ...base,
  id: 'dev-codigo',
  type: 'revision',
  format: 'codigo',
  lines: [
    'norma = sum(componente * componente for componente in vector) ** 0.5  # raíz de la suma de cuadrados',
    'distancia = abs(norma_de_u - norma_de_v)  # incorrecto: ignora el ángulo entre los dos vectores',
    'print(distancia)',
  ],
  faultyLine: 1,
};

// Página de verificación visual: fórmulas KaTeX y las dos variantes de la pregunta de revisión.
export default function PreguntasDev() {
  return (
    <Layout title={TITLE} back="/">
      <div data-testid="formulas">
        <Md>{FORMULAS}</Md>
      </div>
      <QuestionView question={texto} locked={false} onSubmit={() => undefined} />
      <QuestionView question={codigo} locked={false} onSubmit={() => undefined} />
    </Layout>
  );
}
