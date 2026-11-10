import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { descenso, type DescensoSpec } from '../../engine/labs/descenso';
import { goalMet, settle, startState, stateProblems, type LabState } from '../../engine/labs';
import { descensoSchema } from '../../content/labs/descenso';
import { labGoalSchema } from '../../content/labs';
import { numeroQSchema } from '../../content/schema';
import { descensoSamples } from '../dev/labs/descenso';
import { DescensoLab } from './DescensoLab';

// `LabQ['lab']` todavía no conoce `descenso` (se cablea después): los laboratorios de las muestras
// se sacan con la frontera de tipos mínima y se validan con `descensoSchema`.
const labOf = (q: (typeof descensoSamples)[number]): DescensoSpec =>
  (q as unknown as { lab: DescensoSpec }).lab;
const sample = (id: string) => descensoSamples.find((q) => q.id === id)!;

function Harness({ spec, locked = false }: { spec: DescensoSpec; locked?: boolean }) {
  const controls = descenso.controls(spec);
  const [state, setState] = useState<LabState>(startState(controls));
  return (
    <DescensoLab
      spec={spec}
      state={state}
      onChange={
        locked ? undefined : (patch) => setState((prev) => settle(controls, { ...prev, ...patch }))
      }
    />
  );
}

const reading = (name: string): string =>
  screen.getByText(name).closest('div')!.querySelector('output')!.textContent!;

describe('muestras del laboratorio descenso', () => {
  it.each(descensoSamples.map((q) => [q.id, q] as const))('%s cumple el esquema', (_id, q) => {
    // contract: las muestras de #/dev/labs son contenido válido, como el de un juego
    expect(descensoSchema.safeParse(labOf(q)).success).toBe(true);
    if (q.type === 'numero')
      expect(numeroQSchema.safeParse({ ...q, lab: undefined }).success).toBe(true);
  });

  const labQs = descensoSamples.filter((q) => q.type === 'laboratorio');
  it.each(labQs.map((q) => [q.id, q] as const))(
    '%s se puede resolver y no nace resuelta',
    (_id, q) => {
      const spec = labOf(q);
      const goals = (q as unknown as { goals: Parameters<typeof goalMet>[0][] }).goals;
      const solved = (q as unknown as { solved: LabState }).solved;
      const controls = descenso.controls(spec);
      for (const g of goals) expect(labGoalSchema.safeParse(g).success).toBe(true);
      // contract: `solved` usa mandos que existen y valores de su rejilla
      expect(stateProblems(controls, solved)).toEqual([]);
      const at = (state: LabState) =>
        descenso.measure(spec, settle(controls, { ...startState(controls), ...state }));
      // contract: `solved` cumple todas las metas y el estado inicial no
      expect(goals.every((g) => goalMet(g, at(solved)))).toBe(true);
      expect(goals.every((g) => goalMet(g, at({})))).toBe(false);
    },
  );

  it('la muestra numero tiene la respuesta que mide el laboratorio y first_below oculta', () => {
    const q = sample('dev-descenso-explorar');
    const spec = labOf(q);
    // contract: con descenso simple y lr = 0,05 la x se anula en el paso 1 y queda 9·0,81ᵏ: ≤ 1 por primera vez en k = 11
    expect(descenso.measure(spec, startState(descenso.controls(spec))).first_below).toBe(
      (q as unknown as { answer: number }).answer,
    );
    // contract: la meta de la pregunta es descubrirlo: first_below no es una lectura
    expect(spec.readouts).not.toContain('first_below');
  });

  it('la muestra de pozos exige mover el punto de partida y la del valle, cambiar de optimizador', () => {
    const wells = labOf(sample('dev-descenso-pozos'));
    // contract: el punto de partida es movible, la tasa y los pasos están fijos
    expect(descenso.controls(wells).map((c) => c.id)).toEqual(['sx', 'sy']);
    // contract: el valle ofrece descenso simple y momentum
    expect(descenso.controls(labOf(sample('dev-descenso-valle'))).map((c) => c.id)).toEqual([
      'lr',
      'opt',
    ]);
  });
});

describe('DescensoLab', () => {
  it('se pinta con el mapa, la pérdida paso a paso y las lecturas', () => {
    render(<Harness spec={labOf(sample('dev-descenso-cuenco'))} />);
    // contract: el mapa y la gráfica de la pérdida son figuras con nombre
    expect(screen.getByRole('group', { name: /Mapa de la pérdida/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Gráfica de la pérdida/ })).toBeInTheDocument();
    // contract: la regresión es la única que enseña los datos
    expect(screen.queryByRole('img', { name: /Datos y rectas/ })).not.toBeInTheDocument();
    expect(screen.getByText('Pérdida final')).toBeInTheDocument();
  });

  it('con regresión enseña los datos y la recta', () => {
    render(<Harness spec={labOf(sample('dev-descenso-recta'))} />);
    // contract: el tercer panel solo existe con paisaje de regresión
    expect(screen.getByRole('img', { name: /Datos y rectas/ })).toBeInTheDocument();
  });

  it('mover el deslizador de la tasa cambia la pérdida final', () => {
    render(<Harness spec={labOf(sample('dev-descenso-cuenco'))} />);
    // contract: con lr = 0,05 y 20 pasos la pérdida final es 13·0,81²⁰ = 0,192
    expect(reading('Pérdida final')).toBe('0,192');
    fireEvent.change(screen.getByLabelText(/Tasa de aprendizaje/), { target: { value: '0.4' } });
    // contract: con lr = 0,4 el factor es 0,2 y la pérdida queda en ~1e-13: se escribe 0
    expect(reading('Pérdida final')).toBe('0');
  });

  it('una tasa enorme avisa de que se dispara', () => {
    render(<Harness spec={labOf(sample('dev-descenso-cuenco'))} />);
    expect(screen.queryByText(/se ha disparado/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Tasa de aprendizaje/), { target: { value: '1.2' } });
    // contract: con lr = 1,2 el factor es −1,4 y el descenso se corta por pasarse 100 ventanas
    expect(screen.getByText(/se ha disparado/)).toBeInTheDocument();
  });

  it('el optimizador se elige con botones y cambia la pérdida', () => {
    render(<Harness spec={labOf(sample('dev-descenso-valle'))} />);
    // contract: con descenso simple, lr = 0,05 y 15 pasos la pérdida es 0,38
    expect(reading('Pérdida final')).toBe('0,382');
    fireEvent.click(screen.getByRole('button', { name: 'Momentum' }));
    // contract: con momentum (β = 0,5) la pérdida baja a 0,001
    expect(reading('Pérdida final')).toBe('0,001');
  });

  it('el punto de partida se mueve con el teclado y cambia el mínimo al que se llega', () => {
    render(<Harness spec={labOf(sample('dev-descenso-pozos'))} />);
    // contract: saliendo de (−2,5; −1) se cae en el mínimo local, a más de 3 del global
    expect(Number(reading('Distancia al mínimo').replace(',', '.'))).toBeGreaterThan(3);
    const handle = screen.getByRole('button', { name: /Punto de partida/ });
    for (let k = 0; k < 7; k++) fireEvent.keyDown(handle, { key: 'ArrowRight' });
    // contract: 7 pasos de 0,5 llevan la salida a (1, −1), en la cuenca del mínimo global
    expect(
      screen.getByRole('button', { name: /Punto de partida, en \(1, −1\)/ }),
    ).toBeInTheDocument();
    expect(reading('Distancia al mínimo')).toBe('0');
  });

  it('sin onChange la figura queda quieta: ni tirador ni mandos activos', () => {
    render(<Harness spec={labOf(sample('dev-descenso-pozos'))} locked />);
    // contract: cerrada, sin tirador y con el mapa como imagen
    expect(screen.queryByRole('button', { name: /Punto de partida/ })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Mapa de la pérdida/ })).toBeInTheDocument();
    render(<Harness spec={labOf(sample('dev-descenso-cuenco'))} locked />);
    expect(screen.getByLabelText(/Tasa de aprendizaje/)).toBeDisabled();
  });
});
