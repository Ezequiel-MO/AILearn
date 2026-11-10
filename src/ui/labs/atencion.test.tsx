import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { LabQ } from '../../content/schema';
import { atencionSchema } from '../../content/labs/atencion';
import { atencion, atencionScene, type AtencionSpec } from '../../engine/labs/atencion';
import { goalMet, settle, startState, stateProblems, type LabState } from '../../engine/labs/types';
import { atencionSamples } from '../dev/labs/atencion';
import { AtencionLab } from './AtencionLab';

/** La especificación de una muestra (se cablea después: `LabQ['lab']` aún no admite `atencion`). */
const specOf = (q: LabQ | (typeof atencionSamples)[number]): AtencionSpec =>
  q.lab as unknown as AtencionSpec;

const labQuestions = atencionSamples.filter((q): q is LabQ => q.type === 'laboratorio');

/** Monta el laboratorio con un estado propio, como lo haría quien lo cablea. */
function Harness({ spec, interactive = true }: { spec: AtencionSpec; interactive?: boolean }) {
  const controls = atencion.controls(spec);
  const [state, setState] = useState<LabState>(startState(controls));
  return (
    <AtencionLab
      spec={spec}
      state={state}
      onChange={
        interactive
          ? (patch) => setState((prev) => settle(controls, { ...prev, ...patch }))
          : undefined
      }
    />
  );
}

describe('muestras del laboratorio atención', () => {
  it.each(atencionSamples.map((q) => [q.id, q] as const))('%s cumple el esquema', (_id, q) => {
    // contract: el laboratorio de cada muestra es contenido válido; `labQSchema` y `numeroQSchema` aún no
    // admiten `atencion` (se cablea después), así que se comprueba su esquema propio
    expect(atencionSchema.safeParse(q.lab).success).toBe(true);
  });

  it.each(labQuestions.map((q) => [q.id, q] as const))(
    '%s se puede resolver y no nace resuelta',
    (_id, q) => {
      const spec = specOf(q);
      const controls = atencion.controls(spec);
      // contract: `solved` usa mandos que existen y valores de su rejilla
      expect(stateProblems(controls, q.solved)).toEqual([]);
      const met = (state: LabState) => {
        const values = atencion.measure(spec, state);
        return q.goals.every((g) => goalMet(g, values));
      };
      // contract: `solved` cumple todas las metas y el estado inicial no las cumple
      expect(met(settle(controls, q.solved))).toBe(true);
      expect(met(startState(controls))).toBe(false);
    },
  );

  it.each(atencionSamples.map((q) => [q.id, q] as const))('%s se pinta', (_id, q) => {
    const spec = specOf(q);
    const { container } = render(<Harness spec={spec} />);
    // contract: el dibujo enseña un peso por token (una barra por token)
    expect(container.querySelectorAll('.atencion__bar')).toHaveLength(spec.tokens.length);
    // contract: con `heatmap` hay n×n celdas; sin él, ninguna
    expect(container.querySelectorAll('.atencion__cell')).toHaveLength(
      spec.heatmap ? spec.tokens.length ** 2 : 0,
    );
  });

  it('la pregunta numérica explorable da la respuesta declarada con el mapa', () => {
    const q = atencionSamples.find((s) => s.id === 'dev-atencion-explorar')!;
    const spec = specOf(q);
    const heat = atencionScene(spec, startState(atencion.controls(spec))).heat;
    const argmax = (row: number[]) => row.indexOf(Math.max(...row));
    const gato = spec.tokens.findIndex((t) => t.id === 'gato');
    // contract: la respuesta declarada es el número de filas cuyo mayor peso cae en «gato»
    expect(heat.filter((row) => argmax(row) === gato).length).toBe(
      (q as { answer: number }).answer,
    );
  });
});

describe('interacción', () => {
  it('con las flechas, la consulta cambia el peso medido', () => {
    const spec = specOf(atencionSamples.find((q) => q.id === 'dev-atencion-mirar')!);
    render(<Harness spec={spec} />);
    const readouts = () => screen.getByText('Peso sobre «animal»').parentElement!;
    // contract: con q = (0, 1) el peso de «animal» es e¹/Σ = 2,718/14,70 = 18,5 %, y se lee como porcentaje
    expect(within(readouts()).getByText('18 %')).toBeInTheDocument();
    const handle = screen.getByRole('button', { name: /Consulta de «estaba»/ });
    // contract: q pasa de (0, 1) a (2, 1) con cuatro pasos de 0,5 a la derecha: «animal» sube a 96,6 %
    for (let k = 0; k < 4; k++) fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(within(readouts()).getByText('97 %')).toBeInTheDocument();
    // contract: el tirador anuncia la posición nueva con el formato de pares de `fmtPair` (enteros, «(2, 1)»)
    expect(
      screen.getByRole('button', { name: 'Consulta de «estaba», en (2, 1)' }),
    ).toBeInTheDocument();
  });

  it('el deslizador de temperatura cambia la entropía', () => {
    const spec = specOf(atencionSamples.find((q) => q.id === 'dev-atencion-afilar')!);
    render(<Harness spec={spec} />);
    const entropy = () => screen.getByText('Entropía de los pesos (bits)').parentElement!;
    const before = within(entropy()).getByRole('status', { hidden: true }).textContent;
    fireEvent.change(screen.getByRole('slider'), { target: { value: '1' } });
    // contract: bajar la temperatura de 4 a 1 afila la atención: la entropía baja (de ≈2,5 a ≈0,3 bits)
    const after = within(entropy()).getByRole('status', { hidden: true }).textContent;
    expect(Number(before!.replace(',', '.'))).toBeGreaterThan(2);
    expect(Number(after!.replace(',', '.'))).toBeLessThan(1);
  });

  it('el interruptor de máscara tacha el futuro', () => {
    const spec = specOf(atencionSamples.find((q) => q.id === 'dev-atencion-futuro')!);
    const { container } = render(<Harness spec={spec} />);
    // contract: sin máscara ningún token está enmascarado
    expect(container.querySelectorAll('.atencion__chip--masked')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /causal/ }));
    // contract: con la máscara, «cansado» (único token tras «estaba») queda enmascarado
    expect(container.querySelectorAll('.atencion__chip--masked')).toHaveLength(1);
    expect(container.querySelector('.atencion__bar--masked')).not.toBeNull();
  });

  it('sin onChange la figura queda quieta', () => {
    const spec = specOf(atencionSamples.find((q) => q.id === 'dev-atencion-afilar')!);
    render(<Harness spec={spec} interactive={false} />);
    // contract: cerrada, el deslizador está desactivado y no hay tiradores
    expect(screen.getByRole('slider')).toBeDisabled();
    const spec2 = specOf(atencionSamples.find((q) => q.id === 'dev-atencion-mirar')!);
    render(<Harness spec={spec2} interactive={false} />);
    expect(screen.queryByRole('button', { name: /Consulta de/ })).not.toBeInTheDocument();
  });
});
