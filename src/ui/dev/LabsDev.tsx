import type { LabQ, NumeroQ } from '../../content/schema';
import { Layout } from '../Layout';
import { QuestionView } from '../questions/QuestionView';
import { atencionSamples } from './labs/atencion';
import { capaSamples } from './labs/capa';
import { compresionSamples } from './labs/compresion';
import { descensoSamples } from './labs/descenso';
import { loraSamples } from './labs/lora';

// Los textos de las páginas de desarrollo van aquí, no en strings.ts: así no entran en producción.
const TITLE = 'Laboratorios (desarrollo)';

/** Una muestra por laboratorio y variante: cada laboratorio aporta las suyas desde `./labs/<kind>.ts`. */
const samples: (LabQ | NumeroQ)[] = [
  ...capaSamples,
  ...atencionSamples,
  ...compresionSamples,
  ...descensoSamples,
  ...loraSamples,
];

// Página de verificación visual: todos los laboratorios, como pregunta abierta y como pregunta cerrada.
export default function LabsDev() {
  return (
    <Layout title={TITLE} back="/">
      {samples.map((q) => (
        <section key={q.id} data-testid={q.id} style={{ marginBottom: '3rem' }}>
          <h2>{q.id}</h2>
          <QuestionView question={q} locked={false} onSubmit={() => undefined} />
        </section>
      ))}
    </Layout>
  );
}
