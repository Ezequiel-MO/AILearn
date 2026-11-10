import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { labQSchema, numeroQSchema, type LabQ } from '../../content/schema';
import { checkLab } from '../../content/validate';
import { atencionSamples } from '../dev/labs/atencion';
import { capaSamples } from '../dev/labs/capa';
import { compresionSamples } from '../dev/labs/compresion';
import { loraSamples } from '../dev/labs/lora';
import { QuestionView } from '../questions/QuestionView';
import { t } from '../strings';

/** Todas las muestras de la página de desarrollo: una por laboratorio y variante. */
const samples = [...capaSamples, ...atencionSamples, ...compresionSamples, ...loraSamples];
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
