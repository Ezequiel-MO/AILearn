import { describe, expect, it } from 'vitest';
import type { CodigoQ } from '../../src/content/schema';
import { claimMatches, hasCheckCall, printClaims } from './python-helpers';

const withChecks = (checks: string): CodigoQ => ({
  id: 'q',
  type: 'codigo',
  requirements: ['r'],
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

describe('printClaims y claimMatches: lo que un ejemplo dice que imprime', () => {
  it('toma los print sin sangría cuyo comentario empieza por un valor', () => {
    const code = [
      'print(a)   # [1 0]: posiciones',
      'print(b)   # la palabra de esa posición',
      'for i in a:',
      '    print(i)   # 1, después 0',
      'print(c)   # True',
      'x = 1   # 5',
    ].join('\n');
    // contract: hallazgo 1 de la revisión de la Órbita 0 del juego 3: solo cuentan los comentarios con un valor
    expect(printClaims(code)).toEqual([
      { line: 0, claim: '[1 0]: posiciones' },
      { line: 4, claim: 'True' },
    ]);
  });

  it('acepta la salida sola, con su explicación detrás o con la primera línea de una matriz', () => {
    // contract: formatos de comentario que usan las pistas de los juegos 1 a 3
    expect(claimMatches('[-14.  -9.]\n', '[-14.  -9.]: una derivada por peso')).toBe(true);
    expect(claimMatches('(3,)\n', '(3,): tres determinantes')).toBe(true);
    expect(claimMatches('[[3 2]\n [0 1]]\n', '[[3 2] [0 1]]: con * sale una matriz')).toBe(true);
    expect(claimMatches('[[1. 0.]\n [0. 1.]]\n', '[[1. 0.]')).toBe(true);
    expect(claimMatches('False True\n', 'False True')).toBe(true);
    // contract: NumPy rellena con espacios junto al corchete ([[ 10 200] …]); rango-bajo.ex02.4 no los escribe
    expect(claimMatches('[[ 10 200]\n [ 30 400]]\n', '[[10 200] [30 400]]: columna 0 por 10')).toBe(
      true,
    );
    // contract: atencion.ex02.2 corta un decimal largo con «...»
    expect(claimMatches('0.1353352832366127\n', '0.1353...: siempre positivo')).toBe(true);
  });

  it('rechaza un valor distinto, aunque empiece igual', () => {
    // contract: hallazgo 1: la pista decía [-28.0, -9.0] y salía otra cosa
    expect(
      claimMatches(
        '[np.float64(-14.0), np.float64(-9.0)]\n',
        '[-28.0, -9.0]: una derivada por peso',
      ),
    ).toBe(false);
    expect(claimMatches('1\n', '15: la suma')).toBe(false);
    expect(claimMatches('0.0\n', '0: el determinante')).toBe(false);
    expect(claimMatches('\n', '3')).toBe(false);
    expect(claimMatches('0.1453352832366127\n', '0.1353...: siempre positivo')).toBe(false);
    expect(claimMatches('[[5 7]\n [6 8]]\n', '[5 6] es la primera columna')).toBe(false);
  });
});
