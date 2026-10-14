import { beforeAll, describe, expect, it } from 'vitest';
import { runInPyodide } from './core';
import { loadNodePyodide } from './node';

let pyodide: unknown;

beforeAll(async () => {
  pyodide = await loadNodePyodide();
}, 300_000);

const run = (code: string, checks?: string) => runInPyodide(pyodide, code, checks);

const NP = 'import numpy as np\n';

// Cada caso sale de la lista medida de errores típicos (typical-out.json, fila 27 del informe de la 18b).
// `phrase` es lo que tiene que leer el jugador antes de la traza.
const CASES: { name: string; code: string; line: number; phrase: string[]; original: string }[] = [
  {
    name: 'ValueError: el valor de verdad de un array',
    code: NP + 'd = np.array([1, 2])\nif d < 3:\n    pass',
    line: 3,
    phrase: ['array con varios números', 'Falta reducirlo a un solo número', 'la norma'],
    original: 'ValueError: The truth value of an array',
  },
  {
    name: 'NameError con el nombre',
    code: 'v = perro',
    line: 1,
    phrase: ['«perro» no está definido'],
    original: "NameError: name 'perro' is not defined",
  },
  {
    name: 'SyntaxError',
    code: 'u = 3\nc = 2u - u',
    line: 2,
    phrase: ['no entiende cómo está escrita'],
    original: 'SyntaxError: invalid decimal literal',
  },
  {
    name: 'IndentationError',
    code: 'for i in range(2):\nx = i',
    line: 2,
    phrase: ['sangría'],
    original: 'IndentationError: expected an indented block',
  },
  {
    name: 'IndexError',
    code: NP + 'v = np.array([3, 2])\ny = v[2]',
    line: 3,
    phrase: ['posición que no existe', 'Se empieza a contar en 0'],
    original: 'IndexError: index 2 is out of bounds',
  },
  {
    name: 'KeyError con la clave',
    code: 'emb = {"perro": 1}\nv = emb["Perro"]',
    line: 2,
    phrase: ['la clave «Perro»', 'mayúsculas'],
    original: "KeyError: 'Perro'",
  },
  {
    name: 'AxisError (no se confunde con IndexError ni ValueError)',
    code: NP + 'E = np.ones((2, 2))\nm = np.mean(E, axis=2)',
    line: 3,
    phrase: ['eje que el array no tiene'],
    original: 'AxisError: axis 2 is out of bounds',
  },
  {
    name: 'TypeError: Cannot interpret como tipo de dato',
    code: NP + 'v = np.array(3, 2)',
    line: 2,
    phrase: ['np.array recibe una lista', 'np.array([3, 2])'],
    original: "TypeError: Cannot interpret '2' as a data type",
  },
  {
    name: 'ValueError: formas que no casan',
    code: NP + 'u = np.array([1, 2])\ns = u + np.array([3, 2, 1])',
    line: 3,
    phrase: ['formas distintas', '(2,)', '(3,)'],
    original: 'ValueError: operands could not be broadcast',
  },
  {
    name: 'UFuncTypeError',
    code: NP + 'q = np.array([1, 2])\nd = np.linalg.norm(q - "perro")',
    line: 3,
    phrase: ['algo que no es un número'],
    original: 'UFuncTypeError: ufunc',
  },
  {
    name: 'cualquier otra excepción lleva una frase genérica con el tipo',
    code: 'x = 1\ny = 1 / 0',
    line: 2,
    phrase: ['ZeroDivisionError'],
    original: 'ZeroDivisionError: division by zero',
  },
];

describe(
  'errores del código del jugador con una frase en castellano delante',
  { timeout: 60_000 },
  () => {
    it.each(CASES)('$name', async ({ code, line, phrase, original }) => {
      const r = await run(code);
      const error = r.error ?? '';
      // contract: R43, la frase en castellano va delante y nombra la línea
      expect(error.split('\n')[0]).toContain(`línea ${line}`);
      // contract: R43, frase propia para el caso medido
      for (const part of phrase) expect(error).toContain(part);
      // contract: R43, la traza original se queda (spec sección 7)
      expect(error).toContain('Error en tu código:');
      expect(error).toContain(original);
      // contract: R43, la frase va antes que la traza
      expect(error.indexOf(phrase[0])).toBeLessThan(error.indexOf('Error en tu código:'));
      // contract: R43, un error del jugador nunca cuenta como superado
      expect(r.passed).toBe(false);
    });

    it('la traza original sigue presente con su línea de código y su tipo', async () => {
      const r = await run('x = 1\ny = x / 0');
      // contract: R43 y spec sección 7, traza recortada al código del jugador, intacta tras la frase
      expect(r.error).toContain(
        'Error en tu código:\n  línea 2: y = x / 0\nZeroDivisionError: division by zero',
      );
    });

    it('la frase de un error dentro de una función nombra la línea más interna', async () => {
      const r = await run('def f(v):\n    return v[5]\n\nf([1])');
      // contract: R43, la línea de la frase es la del marco más interno del código del jugador
      expect((r.error ?? '').split('\n')[0]).toContain('línea 2');
    });

    it('un error en las comprobaciones no cambia', async () => {
      const value = await run('v = 1', 'raise ValueError("mensaje propio")');
      // contract: R43, solo cambia el error del código del jugador; el de las comprobaciones sigue como estaba
      expect(value.error).toBeNull();
      expect(value.checks).toEqual([{ passed: false, message: 'mensaje propio' }]);
      const name = await run('v = 1', 'check(w == 1, "no")');
      // contract: R43, el NameError de las comprobaciones sigue con el mensaje de NAME_MESSAGE (sin frase delante)
      expect(name.error).toBeNull();
      expect(name.checks).toEqual([
        { passed: false, message: 'No encuentro `w`. ¿Lo has definido con ese nombre exacto?' },
      ]);
    });

    it('una ejecución sin error sigue sin error', async () => {
      const r = await run('print(1)', 'check(True, "ok")');
      // contract: R43, sin excepción no hay frase
      expect(r.error).toBeNull();
      expect(r.passed).toBe(true);
    });
  },
);
