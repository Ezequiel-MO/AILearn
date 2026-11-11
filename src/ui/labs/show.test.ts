import { describe, expect, it } from 'vitest';
import { showValue } from './show';

describe('showValue', () => {
  it('escribe porcentajes, grados y decimales con coma', () => {
    // contract: cabecera de show.ts: «75 %», «45°», «0,71»
    expect(showValue(0.75, 'percent')).toBe('75 %');
    expect(showValue(45, 'degrees')).toBe('45°');
    expect(showValue(0.714)).toBe('0,71');
  });

  it('un entero de hasta cuatro cifras va sin separar', () => {
    // contract: ortografía de los números en castellano: los de cuatro cifras no se separan
    expect(showValue(3, 'integer')).toBe('3');
    expect(showValue(4096, 'integer')).toBe('4096');
  });

  it('un entero de cinco cifras o más separa los miles con un espacio fino sin salto', () => {
    // contract: retoque heredado de los laboratorios (traspaso del 2026-11-10): el contador de LoRA enseña 16 777 216 parámetros, ilegible de corrido
    expect(showValue(16777216, 'integer')).toBe('16 777 216');
    expect(showValue(65536, 'integer')).toBe('65 536');
    expect(showValue(-20000, 'integer')).toBe('−20 000');
  });

  it('un valor no finito sale como raya', () => {
    // contract: cabecera de show.ts: un valor no finito sale como raya
    expect(showValue(NaN, 'integer')).toBe(showValue(Infinity));
  });
});
