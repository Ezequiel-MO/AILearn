import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { loraSchema } from '../../content/labs/lora';
import { lora, type LoraSpec } from '../../engine/labs/lora';
import { goalMet, settle, startState, stateProblems, type LabState } from '../../engine/labs/types';
import { loraSamples } from '../dev/labs/lora';
import { LoraLab } from './LoraLab';

const specOf = (id: string): LoraSpec =>
  // Se cablea después: la pregunta guarda el laboratorio como `LabQ['lab']`.
  loraSamples.find((q) => q.id === id)!.lab as unknown as LoraSpec;

function Harness({ spec }: { spec: LoraSpec }) {
  const controls = lora.controls(spec);
  const [state, setState] = useState<LabState>(startState(controls));
  return (
    <LoraLab
      spec={spec}
      state={state}
      onChange={(patch) => setState((prev) => settle(controls, { ...prev, ...patch }))}
    />
  );
}

const readout = (label: string): string =>
  screen.getByText(label).closest('div')!.querySelector('output')!.textContent!;

describe('muestras del laboratorio lora', () => {
  it.each(loraSamples.map((q) => [q.id, q] as const))('%s cumple los esquemas', (_id, q) => {
    // contract: las muestras de #/dev/labs son contenido válido, como el de un juego
    expect(loraSchema.safeParse(q.lab).success).toBe(true);
    // contract: una pregunta de laboratorio lleva al menos una meta (labQSchema aún no admite `lora`: se cablea después)
    if (q.type === 'laboratorio') expect(q.goals.length).toBeGreaterThan(0);
  });

  it('cada muestra de laboratorio se resuelve con `solved` y no nace resuelta', () => {
    for (const q of loraSamples) {
      if (q.type !== 'laboratorio') continue;
      const spec = q.lab as unknown as LoraSpec;
      const controls = lora.controls(spec);
      const at = (state: LabState) => lora.measure(spec, settle(controls, state));
      // contract: `solved` cumple todas las metas y el estado inicial no las cumple todas
      expect(q.goals.every((g) => goalMet(g, at(q.solved)))).toBe(true);
      expect(q.goals.every((g) => goalMet(g, at({})))).toBe(false);
      // contract: `solved` solo nombra mandos que existen y valores de su rejilla
      expect(stateProblems(controls, q.solved)).toEqual([]);
    }
  });

  it('el esquema rechaza ids repetidos, dianas inexistentes, start fuera de límites y r mal puesto', () => {
    const base = specOf('dev-lora-clasificar');
    const ok = (patch: Record<string, unknown>) =>
      loraSchema.safeParse({ ...base, ...patch }).success;
    // contract: cada una de estas especificaciones haría fallar al modelo o al dibujo
    expect(ok({})).toBe(true);
    expect(ok({ points: [base.points[0], base.points[0]] })).toBe(false);
    expect(ok({ targets: { nadie: [0, 0] } })).toBe(false);
    expect(ok({ start: [0, 0, 5, 0] })).toBe(false);
    expect(ok({ start: [0, 0, 1] })).toBe(false);
    expect(ok({ groups: ['solo'] })).toBe(false);
    expect(ok({ size: { d: 4, k: 4, r: { min: 5, max: 2, step: 1, start: 3 } } })).toBe(false);
    expect(ok({ size: { d: 4, k: 4, r: { min: 1, max: 8, step: 1, start: 1 } } })).toBe(true);
  });
});

describe('LoraLab', () => {
  it.each(loraSamples.map((q) => [q.id, q] as const))('%s se pinta', (_id, q) => {
    const { container } = render(<Harness spec={q.lab as unknown as LoraSpec} />);
    // contract: el dibujo es un grupo interactivo con las tres matrices y un círculo hueco por palabra
    expect(screen.getByRole('group', { name: /Afinar una capa/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Las matrices de la capa' })).toBeInTheDocument();
    const words = (q.lab as unknown as LoraSpec).points.length;
    expect(container.querySelectorAll('.lora__ghost')).toHaveLength(words);
  });

  it('sin onChange la figura queda quieta y los mandos desactivados', () => {
    const spec = specOf('dev-lora-clasificar');
    render(<LoraLab spec={spec} state={startState(lora.controls(spec))} />);
    // contract: sin onChange, la figura es una imagen y los deslizadores no se pueden mover
    expect(screen.getByRole('img', { name: /Afinar una capa/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/b₁/)).toBeDisabled();
  });

  it('mover B con el deslizador cambia el rango de la corrección y las flechas aparecen', () => {
    const { container } = render(<Harness spec={specOf('dev-lora-clasificar')} />);
    // contract: con B = 0 la corrección es nula (rango 0) y no se dibuja la dirección de B
    expect(readout('Rango de la corrección ΔW')).toBe('0');
    expect(container.querySelector('.lora__b')).toBeNull();
    fireEvent.change(screen.getByLabelText(/b₁/), { target: { value: '1.5' } });
    // contract: B = (1,5; 0) y A = (1, 0) dan ΔW = [[1,5; 0], [0; 0]]: rango 1, y B se dibuja
    expect(readout('Rango de la corrección ΔW')).toBe('1');
    expect(container.querySelector('.lora__b')).not.toBeNull();
  });

  it('con B = (1,5; 0) y A = (0, 1) la neurona acierta el 100 % y la zona se sombrea', () => {
    const { container } = render(<Harness spec={specOf('dev-lora-clasificar')} />);
    // contract: con W = identidad y B = 0 acierta la mitad de las palabras
    expect(readout('Aciertos de la neurona siguiente')).toBe('50 %');
    fireEvent.change(screen.getByLabelText(/b₁/), { target: { value: '1.5' } });
    fireEvent.change(screen.getByLabelText(/a₁/), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText(/a₂/), { target: { value: '1' } });
    // contract: x′ = x + 1,5·y deja las seis palabras del lado que toca
    expect(readout('Aciertos de la neurona siguiente')).toBe('100 %');
    expect(container.querySelector('.lora__zone')).not.toBeNull();
  });

  it('el modo full enseña ΔW entera, sin B ni A', () => {
    render(<Harness spec={specOf('dev-lora-completo')} />);
    // contract: en modo full los mandos son los cuatro de ΔW
    expect(screen.getByLabelText(/fila 1 columna 2/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/b₁/)).toBeNull();
    fireEvent.change(screen.getByLabelText(/fila 1 columna 1/), { target: { value: '0.5' } });
    fireEvent.change(screen.getByLabelText(/fila 2 columna 2/), { target: { value: '-0.5' } });
    // contract: ΔW = diag(0,5; −0,5) tiene rango 2 y es la que busca la muestra
    expect(readout('Rango de la corrección ΔW')).toBe('2');
    expect(readout('Distancia a su diana de la palabra más lejana')).toBe('0');
  });

  it('el contador de parámetros sigue al rango r', () => {
    render(<Harness spec={specOf('dev-lora-contador')} />);
    // contract: 4096 · 4096 = 16 777 216 (con espacios finos); con r = 32, 32 · 8192 = 262 144
    expect(readout('Parámetros del ajuste completo')).toBe('16 777 216');
    expect(readout('Parámetros que entrena LoRA')).toBe('262 144');
    fireEvent.change(screen.getByLabelText(/Rango r de la corrección/), { target: { value: '8' } });
    // contract: con r = 8, 8 · 8192 = 65 536, el 0,390625 % del total
    expect(readout('Parámetros que entrena LoRA')).toBe('65 536');
    expect(readout('LoRA entrena, en % del ajuste completo')).toBe('0,39');
    expect(screen.getByText('LoRA entrena el 0,39 % de los parámetros')).toBeInTheDocument();
  });
});
