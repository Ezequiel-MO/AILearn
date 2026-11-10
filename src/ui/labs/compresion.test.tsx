import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { compresionSchema } from '../../content/labs/compresion';
import { labGoalSchema, labStateSchema } from '../../content/labs';
import type { LabQ } from '../../content/schema';
import { compresion, type CompresionSpec } from '../../engine/labs/compresion';
import { goalMet, settle, startState, stateProblems, type LabState } from '../../engine/labs/types';
import { compresionSamples } from '../dev/labs/compresion';
import { CompresionLab } from './CompresionLab';

// Los laboratorios nuevos aún no están cableados en `LabQ['lab']` (se cablea después): se lee la
// especificación como la nuestra.
const specOf = (q: (typeof compresionSamples)[number]): CompresionSpec =>
  q.lab as unknown as CompresionSpec;

function Harness({ spec }: { spec: CompresionSpec }) {
  const controls = compresion.controls(spec);
  const [state, setState] = useState<LabState>(() => startState(controls));
  return (
    <CompresionLab
      spec={spec}
      state={state}
      onChange={(patch) => setState((prev) => settle(controls, { ...prev, ...patch }))}
    />
  );
}

describe('muestras del laboratorio compresion', () => {
  it.each(compresionSamples.map((q) => [q.id, q] as const))('%s cumple el esquema', (_id, q) => {
    // contract: las muestras de #/dev/labs son contenido válido, como el de un juego
    expect(compresionSchema.safeParse(q.lab).success).toBe(true);
    if (q.type === 'laboratorio') {
      for (const g of q.goals) expect(labGoalSchema.safeParse(g).success).toBe(true);
      expect(labStateSchema.safeParse(q.solved).success).toBe(true);
    }
  });

  const labQs = compresionSamples.filter((q): q is LabQ => q.type === 'laboratorio');
  it.each(labQs.map((q) => [q.id, q] as const))(
    '%s se puede resolver y no nace resuelta',
    (_id, q) => {
      const spec = specOf(q);
      const controls = compresion.controls(spec);
      // contract: `solved` usa mandos que existen, en su rejilla
      expect(stateProblems(controls, q.solved)).toEqual([]);
      const at = (state: LabState) => compresion.measure(spec, settle(controls, state));
      // contract: la solución declarada cumple todas las metas y el estado inicial no las cumple todas
      expect(q.goals.every((g) => goalMet(g, at(q.solved)))).toBe(true);
      expect(q.goals.every((g) => goalMet(g, at(startState(controls))))).toBe(false);
    },
  );

  it('hay una muestra numérica para explorar y una en modo pick, otra con signo y rótulos', () => {
    // contract: las muestras ejercitan numero, pick, signed y labels
    expect(compresionSamples.some((q) => q.type === 'numero')).toBe(true);
    const specs = compresionSamples.map(specOf);
    expect(specs.some((s) => s.mode === 'pick')).toBe(true);
    expect(specs.some((s) => s.signed && s.labels)).toBe(true);
  });
});

describe('CompresionLab', () => {
  const faceSpec = specOf(compresionSamples.find((q) => q.id === 'dev-compresion-explorar')!);
  const pickSpec = specOf(compresionSamples.find((q) => q.id === 'dev-compresion-elegir')!);

  it('pinta las tres matrices, las capas, las barras y el almacenamiento', () => {
    const { container } = render(<Harness spec={faceSpec} />);
    // contract: 3 matrices grandes + una miniatura por capa (8 en una matriz de 8×8)
    expect(container.querySelectorAll('figure svg')).toHaveLength(3);
    expect(container.querySelectorAll('.compresion__layer')).toHaveLength(8);
    expect(container.querySelectorAll('.compresion__bar')).toHaveLength(8);
    // contract: con k=1 solo está resaltada la primera capa
    expect(container.querySelectorAll('.compresion__layer--on')).toHaveLength(1);
    expect(screen.getByText('Matriz entera: 64 números')).toBeInTheDocument();
    // contract: k=1 guarda 1·(8 + 8 + 1) = 17 números
    expect(screen.getByText('Capas elegidas: 17 números')).toBeInTheDocument();
  });

  it('el deslizador k cambia las lecturas', () => {
    render(<Harness spec={faceSpec} />);
    const readouts = screen.getByText('Números guardados').closest('div')!;
    // contract: k=1 → 17 números
    expect(within(readouts).getByText('17')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('slider'), { target: { value: '3' } });
    // contract: k=3 → 3·17 = 51 números
    expect(within(readouts).getByText('51')).toBeInTheDocument();
  });

  it('en modo pick, los interruptores suman capas y se leen con aria-pressed', () => {
    render(<Harness spec={pickSpec} />);
    const first = screen.getByRole('button', { name: 'Capa 1' });
    // contract: start por defecto 0 → todas apagadas
    expect(first).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(first);
    fireEvent.click(screen.getByRole('button', { name: 'Capa 2' }));
    expect(screen.getByRole('button', { name: 'Capa 1' })).toHaveAttribute('aria-pressed', 'true');
    const kept = screen.getByText('Parte conservada').closest('div')!;
    // contract: σ₁² y σ₂² de la matriz 5×5 suman el 91,7 % de la energía → «92 %»
    expect(within(kept).getByText('92 %')).toBeInTheDocument();
  });

  it('sin onChange es una figura quieta: mandos desactivados', () => {
    render(<CompresionLab spec={faceSpec} state={{ k: 2 }} />);
    // contract: sin onChange el deslizador queda desactivado
    expect(screen.getByRole('slider')).toBeDisabled();
  });
});
