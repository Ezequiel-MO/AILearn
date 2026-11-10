import { capa, type CapaSpec } from './capa';
import {
  goalMet,
  settle,
  startState,
  type LabControl,
  type LabGoal,
  type LabModel,
  type LabState,
  type LabValues,
} from './types';

export type { LabControl, LabGoal, LabState, LabValues, GoalOp } from './types';
export { goalMet, settle, settleValue, startState, stateProblems } from './types';

/** Todo laboratorio. Uno nuevo entra aquí, en `MODELS` y en `labSpecSchema` (`src/content/labs.ts`). */
export type LabSpec = CapaSpec;

export type LabKind = LabSpec['kind'];

const MODELS: { [K in LabKind]: LabModel<Extract<LabSpec, { kind: K }>> } = {
  capa,
};

const modelOf = (spec: LabSpec): LabModel<LabSpec> => MODELS[spec.kind] as LabModel<LabSpec>;

export const labControls = (spec: LabSpec): LabControl[] => modelOf(spec).controls(spec);

/** El estado con el que nace el laboratorio. */
export const labStart = (spec: LabSpec): LabState => startState(labControls(spec));

/** `state` puede venir incompleto o fuera de rejilla: se asienta antes de medir. */
export const labMeasure = (spec: LabSpec, state: LabState): LabValues =>
  modelOf(spec).measure(spec, settle(labControls(spec), state));

/** ¿Cumple `state` todas las metas? */
export const labSolved = (spec: LabSpec, goals: readonly LabGoal[], state: LabState): boolean => {
  const values = labMeasure(spec, state);
  return goals.every((g) => goalMet(g, values));
};
