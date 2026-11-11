import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { labQSchema, numeroQSchema, type LabQ } from '../../content/schema';
import { checkLab } from '../../content/validate';
import type { CapaSpec } from '../../engine/labs/capa';
import { atencionSamples } from '../dev/labs/atencion';
import { capaSamples } from '../dev/labs/capa';
import { compresionSamples } from '../dev/labs/compresion';
import { descensoSamples } from '../dev/labs/descenso';
import { loraSamples } from '../dev/labs/lora';
import { QuestionView } from '../questions/QuestionView';
import { t } from '../strings';
import { CapaLab } from './CapaLab';

/** Todas las muestras de la página de desarrollo: una por laboratorio y variante. */
const samples = [
  ...capaSamples,
  ...atencionSamples,
  ...compresionSamples,
  ...descensoSamples,
  ...loraSamples,
];
const labQuestions = samples.filter((q): q is LabQ => q.type === 'laboratorio');

describe('muestras de laboratorio', () => {
  it.each(samples.map((q) => [q.id, q] as const))('%s cumple el esquema', (_id, q) => {
    // contract: las muestras de #/dev/labs son contenido válido, como el de un juego
    const schema = q.type === 'laboratorio' ? labQSchema : numeroQSchema;
    expect(schema.safeParse(q).success).toBe(true);
  });

  it.each(labQuestions.map((q) => [q.id, q] as const))(
    '%s se puede resolver y no nace resuelta',
    (_id, q) => {
      // contract: `solved` cumple las metas con los mandos del laboratorio y el estado inicial no
      expect(checkLab(q)).toEqual([]);
    },
  );

  it.each(samples.map((q) => [q.id, q] as const))('%s se pinta', (_id, q) => {
    render(<QuestionView question={q} locked={false} onSubmit={() => undefined} />);
    // contract: toda pregunta enseña su enunciado y, si es de laboratorio, sus metas
    expect(screen.getByText(q.prompt)).toBeInTheDocument();
    if (q.type === 'laboratorio') {
      expect(screen.getByRole('list', { name: t.labs.goalsLabel })).toBeInTheDocument();
    }
  });
});

describe('pregunta de laboratorio', () => {
  const question = labQuestions.find((q) => q.id === 'dev-capa-clasificar')!;
  const press = (name: RegExp, key: string, times: number) => {
    for (let k = 0; k < times; k++)
      fireEvent.keyDown(screen.getByRole('button', { name }), { key });
  };

  it('un estado que no cumple las metas se entrega como fallo', () => {
    const onSubmit = vi.fn();
    render(<QuestionView question={question} locked={false} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: t.questions.submit }));
    // contract: con la capa identidad la neurona acierta la mitad, y la meta pide todas
    expect(onSubmit).toHaveBeenCalledWith(false);
  });

  it('los medidores siguen a los mandos y la entrega acierta al cumplir la meta', () => {
    const onSubmit = vi.fn();
    render(<QuestionView question={question} locked={false} onSubmit={onSubmit} />);
    const goals = screen.getByRole('list', { name: t.labs.goalsLabel });
    // contract: el medidor enseña el valor en vivo, como porcentaje, y el objetivo
    expect(within(goals).getByText('50 %')).toBeInTheDocument();
    expect(within(goals).getByText(t.labs.goalPending)).toBeInTheDocument();
    // î de (1, 0) a (0, 1) y ĵ de (0, 1) a (1, 0), con las flechas (paso 0,5): la capa intercambia los rasgos
    press(/Columna î/, 'ArrowLeft', 2);
    press(/Columna î/, 'ArrowUp', 2);
    press(/Columna ĵ/, 'ArrowRight', 2);
    press(/Columna ĵ/, 'ArrowDown', 2);
    expect(within(goals).getByText('100 %', { selector: 'output' })).toBeInTheDocument();
    expect(within(goals).getByText(t.labs.goalMet)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: t.questions.submit }));
    expect(onSubmit).toHaveBeenCalledWith(true);
  });

  it('cerrada, no tiene tiradores y ofrece ver una solución', () => {
    render(<QuestionView question={question} locked onSubmit={() => undefined} />);
    // contract: bloqueada, la figura queda quieta; «Ver una solución» pone el estado `solved`
    expect(screen.queryByRole('button', { name: /Columna î/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: t.labs.solve }));
    const goals = screen.getByRole('list', { name: t.labs.goalsLabel });
    expect(within(goals).getByText('100 %', { selector: 'output' })).toBeInTheDocument();
  });

  it('en examen los medidores no dicen si la meta está cumplida ni se ofrece la solución', () => {
    render(<QuestionView question={question} locked hideChecks onSubmit={() => undefined} />);
    // contract: en examen, nada que diga si una entrega está bien
    expect(screen.queryByText(t.labs.goalPending)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.labs.solve })).not.toBeInTheDocument();
  });
});

describe('rótulos del laboratorio capa', () => {
  const base: CapaSpec = {
    kind: 'capa',
    range: 4,
    snap: 0.5,
    points: [
      { id: 'a', label: 'genial', x: 2, y: 2, group: 1 },
      { id: 'b', label: 'horrible', x: 2, y: -2, group: 0 },
    ],
    groups: ['negativa', 'positiva'],
    axes: ['intensidad', 'tono'],
    i: [1, 0],
    j: [0, 1],
    readout: { w: [1, 0], b: 0 },
  };
  const before = { i: [1, 1], j: [-1, 1] } satisfies CapaSpec['before'];
  const headers = () => screen.getAllByRole('columnheader').map((th) => th.textContent);

  it('sin capa delante, cada columna de la tabla lleva el nombre de su rasgo', () => {
    render(<CapaLab spec={base} state={{}} />);
    // contract: a la capa le llegan los rasgos de la nube, y la columna dice adónde va cada uno
    expect(headers()).toEqual(['î: adónde va «intensidad»', 'ĵ: adónde va «tono»']);
  });

  it('con una capa delante, las columnas no se llaman como los rasgos de entrada', () => {
    render(<CapaLab spec={{ ...base, before }} state={{}} />);
    // contract: decisión 1 de la tanda 1 (2026-11-11): con `before`, a A le llega una mezcla, no «intensidad»
    expect(headers()).toEqual(['î: adónde va «entrada 1»', 'ĵ: adónde va «entrada 2»']);
  });

  it('`inputs` nombra lo que le llega a la capa', () => {
    const inputs: [string, string] = ['intensidad + tono', 'tono − intensidad'];
    render(<CapaLab spec={{ ...base, before, inputs }} state={{}} />);
    // contract: decisión 1 de la tanda 1: el contenido nombra la mezcla con `inputs` (sin cambiar `axes`)
    expect(headers()).toEqual([
      'î: adónde va «intensidad + tono»',
      'ĵ: adónde va «tono − intensidad»',
    ]);
  });

  it('la nota de la neurona usa el grupo 1 salvo que `says` diga otra cosa', () => {
    const { unmount } = render(<CapaLab spec={base} state={{}} />);
    // contract: la neurona siguiente detecta el grupo 1, y la nota lo nombra
    expect(screen.getByText(t.labs.capa.zone('positiva'))).toBeInTheDocument();
    unmount();
    render(
      <CapaLab spec={{ ...base, readout: { w: [1, 1], b: 0, says: 'se activa' } }} state={{}} />,
    );
    // contract: decisión 3 de la tanda 1: una neurona cualquiera no «responde positiva»; dice lo que ponga `says`
    expect(screen.getByText(t.labs.capa.zone('se activa'))).toBeInTheDocument();
    expect(screen.queryByText(t.labs.capa.zone('positiva'))).not.toBeInTheDocument();
  });
});
