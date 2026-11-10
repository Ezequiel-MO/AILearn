import { describe, expect, it } from 'vitest';
import type { BankEntry, LabQ, Project, Question } from '../../src/content/schema';
import {
  labMeasure,
  labSolved,
  labStart,
  type LabState,
  type LabValues,
} from '../../src/engine/labs';
import { capaScene } from '../../src/engine/labs/capa';

/**
 * Ayudantes para las pruebas de un proyecto escrito con laboratorios (petición de Oliver del
 * 2026-11-10; `docs/handoffs/2026-11-10-laboratorios-y-ruta/guia-contenido.md`). Lo que vale para todo
 * proyecto va en `defineLabProjectTests`; lo propio de cada pregunta (una colocación tentadora que no
 * resuelve, las cifras que cuenta un enunciado) lo escribe su `<proyecto>.test.ts` con `labAt` y `solves`.
 */

/** La pregunta `id`, que tiene que ser un laboratorio. */
export const labQuestion = (questions: readonly Question[], id: string): LabQ => {
  const q = questions.find((x) => x.id === id);
  if (!q || q.type !== 'laboratorio') throw new Error(`${id} no es una pregunta laboratorio`);
  return q;
};

/** Las métricas del laboratorio de `q` con los mandos de `state` (los que no nombra, como empiezan). */
export const labAt = (q: LabQ, state: LabState = {}): LabValues => labMeasure(q.lab, state);

/** ¿Cumple `state` todas las metas de `q`? */
export const solves = (q: LabQ, state: LabState = {}): boolean => labSolved(q.lab, q.goals, state);

/** Los números de la matriz de una capa: una meta sobre ellos es una posición disfrazada. */
const POSITION_METRICS = ['m11', 'm12', 'm21', 'm22'];

const within = (n: number, min: number, max: number): boolean => n >= min && n <= max;

/** Las reglas de la guía de contenido que valen para cualquier proyecto reescrito y su banco. */
export const defineLabProjectTests = (project: Project, bank: readonly BankEntry[]): void => {
  const exercise = (kind: 'manipular' | 'calcular'): Question[] =>
    project.exercises.find((e) => e.kind === kind)?.questions ?? [];
  const manipular = exercise('manipular');
  const calcular = exercise('calcular');
  const bankQuestions = bank
    .map((e) => e.question)
    .filter((q): q is Question => q.type !== 'generada');
  const labs = [...manipular, ...bankQuestions].filter((q): q is LabQ => q.type === 'laboratorio');

  describe(`guía de contenido con laboratorios: proyecto ${project.id}`, () => {
    it('toda pregunta de «Manipular» es un laboratorio', () => {
      // contract: guía de contenido 2026-11-10, regla 1 (petición de Oliver): datos de IA a la vista en toda «Manipular»
      expect(manipular.filter((q) => q.type !== 'laboratorio').map((q) => q.id)).toEqual([]);
      expect(manipular).toHaveLength(5);
    });

    it('ninguna meta es una posición disfrazada', () => {
      const out = labs.flatMap((q) =>
        q.goals
          .filter((g) => POSITION_METRICS.includes(g.metric))
          .map((g) => `${q.id}: ${g.metric}`),
      );
      // contract: guía de contenido 2026-11-10, regla 2: la meta es una consecuencia, nunca «pon î en…»
      expect(out).toEqual([]);
    });

    it('el rótulo de una meta no lleva su número objetivo', () => {
      const out = labs.flatMap((q) =>
        q.goals.filter((g) => /\d/.test(g.label)).map((g) => `${q.id}: ${g.label}`),
      );
      // contract: guía de contenido 2026-11-10: `label` dice qué se mide; el medidor ya enseña el objetivo
      expect(out).toEqual([]);
    });

    it('al menos tres preguntas de «Calcular» llevan un laboratorio para explorar', () => {
      const withLab = calcular.filter((q) => 'lab' in q && q.lab !== undefined);
      // contract: guía de contenido 2026-11-10, «Calcular con laboratorio»: `lab` en al menos 3 de las 5
      expect(withLab.length).toBeGreaterThanOrEqual(3);
    });

    it('ninguna lectura del laboratorio de una pregunta numérica de «Calcular» vale la respuesta', () => {
      const out = calcular.flatMap((q) => {
        if (q.type !== 'numero' || !q.lab || !('readouts' in q.lab)) return [];
        const values = labMeasure(q.lab, {});
        return (q.lab.readouts ?? [])
          .filter((m) => Math.abs((values[m] ?? NaN) - q.answer) <= Math.max(q.tol, 1e-9))
          .map((m) => `${q.id}: la lectura ${m} enseña la respuesta`);
      });
      // contract: guía de contenido 2026-11-10: la figura de «Calcular» va sin la lectura que da la respuesta
      expect(out).toEqual([]);
    });

    it('en un laboratorio capa, las palabras y las dianas caben en la ventana, al empezar y resuelto', () => {
      const out = labs.flatMap((q) => {
        const spec = q.lab;
        if (spec.kind !== 'capa') return [];
        const outside = (p: readonly [number, number]): boolean =>
          Math.max(Math.abs(p[0]), Math.abs(p[1])) > spec.range + 1e-9;
        const states: [string, LabState][] = [
          ['al empezar', labStart(spec)],
          ['resuelto', { ...labStart(spec), ...q.solved }],
        ];
        return [
          ...states.flatMap(([when, state]) =>
            Object.entries(capaScene(spec, state).images)
              .filter(([, at]) => outside(at))
              .map(([id]) => `${q.id}: «${id}» queda fuera de la ventana ${when}`),
          ),
          ...Object.entries(spec.targets ?? {})
            .filter(([, at]) => outside(at))
            .map(([id]) => `${q.id}: la diana de «${id}» queda fuera de la ventana`),
        ];
      });
      // contract: revisión de la Órbita 2 (lo fijo cabe en la vista), llevada a los laboratorios: lo que no se ve no enseña
      expect(out).toEqual([]);
    });

    it('el banco lleva una entrada laboratorio', () => {
      // contract: guía de contenido 2026-11-10, «Pruebas por proyecto»: una entrada `laboratorio` por proyecto en el banco
      expect(bankQuestions.filter((q) => q.type === 'laboratorio').length).toBeGreaterThanOrEqual(
        1,
      );
    });

    it('enunciado, pistas, explicación y solución caben en su presupuesto', () => {
      for (const q of [...manipular, ...calcular]) {
        // contract: guía de contenido del juego 3 («Menos tedio», sigue en pie): prompt 420, 2 pistas de 220, explain 380, solution 480
        expect(q.prompt.length, `${q.id} prompt`).toBeLessThanOrEqual(420);
        expect(q.hints.length, `${q.id} hints`).toBe(2);
        for (const h of q.hints) expect(h.length, `${q.id} hint`).toBeLessThanOrEqual(220);
        expect(q.explain.length, `${q.id} explain`).toBeLessThanOrEqual(380);
        expect(q.solution.length, `${q.id} solution`).toBeLessThanOrEqual(480);
      }
      for (const q of bankQuestions.filter((x) => x.type !== 'codigo')) {
        // contract: los mismos presupuestos para las entradas del banco que no son de código
        expect(q.prompt.length, `${q.id} prompt`).toBeLessThanOrEqual(420);
        expect(q.explain.length, `${q.id} explain`).toBeLessThanOrEqual(380);
        expect(q.solution.length, `${q.id} solution`).toBeLessThanOrEqual(480);
      }
    });

    it('los textos de purpose caben en su presupuesto', () => {
      for (const q of [...manipular, ...calcular]) {
        if (!('purpose' in q) || !q.purpose) throw new Error(`${q.id} no lleva purpose`);
        const { why, aim, takeaway } = q.purpose;
        // contract: guía de contenido del juego 3 («Menos tedio»): why 60 a 300, aim 60 a 200, takeaway 60 a 260
        expect(within(why.length, 60, 300), `${q.id} why ${why.length}`).toBe(true);
        expect(within(aim.length, 60, 200), `${q.id} aim ${aim.length}`).toBe(true);
        expect(within(takeaway.length, 60, 260), `${q.id} takeaway ${takeaway.length}`).toBe(true);
      }
    });
  });
};
