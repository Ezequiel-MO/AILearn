import { describe, expect, it } from 'vitest';
import type { CodigoQ } from '../../src/content/schema';
import { hasCheckCall } from './python-helpers';

const withChecks = (checks: string): CodigoQ => ({
  id: 'q',
  type: 'codigo',
  prompt: 'p',
  hints: [],
  explain: 'e',
  solution: 's',
  starter: 'v = None',
  checks,
  reference: 'v = 1',
});

describe('hasCheckCall', () => {
  it('acepta una llamada real, sola o tras otras líneas', () => {
    // contract: tarea 8, ronda de arreglo 1, punto 6: una llamada real a check( cuenta
    expect(hasCheckCall(withChecks('check(v == 1, "v vale 1")'))).toBe(true);
    expect(hasCheckCall(withChecks('# nota\nx = 2\ncheck(v == x, "m")'))).toBe(true);
    expect(hasCheckCall(withChecks('ok = True; check(ok, "m")'))).toBe(true);
  });

  it('acepta espacios entre «check» y el paréntesis', () => {
    // contract: retoque previo de la tarea 15: «check (v, "m")» es una llamada legítima
    expect(hasCheckCall(withChecks('check (v == 1, "m")'))).toBe(true);
    expect(hasCheckCall(withChecks('x = 1\ncheck  (v == 1, "m")'))).toBe(true);
  });

  it('rechaza «# check(» en un comentario, de línea entera o al final de una línea', () => {
    // contract: tarea 8, ronda de arreglo 1, punto 6: falso positivo, comentario
    expect(hasCheckCall(withChecks('# check(v == 1, "m")'))).toBe(false);
    expect(hasCheckCall(withChecks('x = 1  # check(v == 1, "m")'))).toBe(false);
  });

  it('rechaza «mycheck(» y «obj.check(» (no es la función check)', () => {
    // contract: tarea 8, ronda de arreglo 1, punto 6: falso positivo, límite de palabra
    expect(hasCheckCall(withChecks('mycheck(v == 1)'))).toBe(false);
    expect(hasCheckCall(withChecks('obj.check(v == 1)'))).toBe(false);
    expect(hasCheckCall(withChecks('obj.check (v == 1)'))).toBe(false);
  });

  it('rechaza unas comprobaciones sin ninguna llamada', () => {
    // contract: tarea 8, ronda de arreglo 1, punto 6: sin check( no hay comprobación
    expect(hasCheckCall(withChecks('assert v == 1'))).toBe(false);
  });
});
