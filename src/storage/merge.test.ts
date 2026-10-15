import { describe, expect, it } from 'vitest';
import { emptySummary } from '../engine/types';
import { mergeDocs } from './merge';
import type { Attempt, ProgressDoc } from './types';

const attempt = (q: string, at: string): Attempt => ({
  q,
  at,
  correct: true,
  submissions: 1,
  hinted: false,
  context: 'proyecto',
});

const doc = (attempts: Attempt[], firsts: Record<string, number> = {}): ProgressDoc => ({
  schema: 1,
  summary: { ...emptySummary(), firsts },
  attempts,
});

describe('mergeDocs', () => {
  it('une los intentos sin repetir los comunes y los ordena por fecha; el resumen, con la mejor marca', () => {
    const shared = attempt('a', '2026-10-14T10:00:00.000Z');
    const onlyA = attempt('b', '2026-10-14T12:00:00.000Z');
    const onlyB = attempt('c', '2026-10-14T11:00:00.000Z');
    const merged = mergeDocs(
      doc([shared, onlyA], { 'p/0': 2 }),
      doc([shared, onlyB], { 'p/0': 4 }),
    );
    // contract: petición de Oliver 2026-10-14 (progreso en la cuenta sin perder lo local); el registro solo crece (spec §8)
    expect(merged.attempts).toEqual([shared, onlyB, onlyA]);
    expect(merged.summary.firsts).toEqual({ 'p/0': 4 });
  });

  it('con la nube vacía devuelve lo local tal cual', () => {
    const local = doc([attempt('a', '2026-10-14T10:00:00.000Z')], { 'p/1': 5 });
    // contract: primer inicio de sesión: lo local sube entero
    expect(mergeDocs(local, doc([]))).toEqual(local);
  });
});
