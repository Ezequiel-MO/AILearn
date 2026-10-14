import { beforeAll, describe, expect, it } from 'vitest';
import { PYODIDE_VERSION } from './config';
import { runInPyodide } from './core';
import { loadNodePyodide } from './node';

let pyodide: unknown;

// Una sola instancia de Pyodide por fichero; la primera carga puede descargar paquetes.
beforeAll(async () => {
  pyodide = await loadNodePyodide();
}, 300_000);

const run = (code: string, checks?: string) => runInPyodide(pyodide, code, checks);

describe('runInPyodide', { timeout: 60_000 }, () => {
  it('captura la salida estándar y no corrige si no hay comprobaciones', async () => {
    const r = await run('print("hola")');
    // contract: tarea 6, tabla de casos, fila 1
    expect(r.stdout).toBe('hola\n');
    // contract: tarea 6, tabla de casos, fila 1 («checks» null)
    expect(r.checks).toBeNull();
    // contract: tarea 6, tabla de casos, fila 1 («passed» false)
    expect(r.passed).toBe(false);
    // contract: tarea 6, contrato de RunResult: el núcleo deja timedOut en falso
    expect(r.timedOut).toBe(false);
    // contract: tarea 6, contrato de RunResult: sin error es null
    expect(r.error).toBeNull();
  });

  it('supera una comprobación con numpy', async () => {
    const r = await run(
      'import numpy as np; v = np.array([3, 4])',
      'check(np.linalg.norm(v) == 5, "norma")',
    );
    // contract: tarea 6, tabla de casos, fila 2
    expect(r.passed).toBe(true);
    // contract: tarea 6, tabla de casos, fila 2 («un resultado superado»)
    expect(r.checks).toEqual([{ passed: true, message: 'norma' }]);
  });

  it('devuelve el mensaje de la comprobación que falla', async () => {
    const r = await run('v = 1', 'check(v == 2, "debe valer 2")');
    // contract: tarea 6, tabla de casos, fila 3
    expect(r.passed).toBe(false);
    // contract: tarea 6, tabla de casos, fila 3 («mensaje debe valer 2»)
    expect(r.checks).toEqual([{ passed: false, message: 'debe valer 2' }]);
  });

  it('convierte un NameError de las comprobaciones en un resultado fallido que nombra la variable', async () => {
    const r = await run('x = 1', 'check(v == 2, "otro mensaje")');
    // contract: tarea 6, tabla de casos, fila 4 («passed» false)
    expect(r.passed).toBe(false);
    // contract: tarea 6, reglas del arnés: «No encuentro `<nombre>`. ¿Lo has definido con ese nombre exacto?»
    expect(r.checks).toEqual([
      { passed: false, message: 'No encuentro `v`. ¿Lo has definido con ese nombre exacto?' },
    ]);
    // contract: tarea 6, reglas del arnés: el NameError no se propaga
    expect(r.error).toBeNull();
  });

  it('convierte cualquier otra excepción de las comprobaciones en un resultado fallido', async () => {
    const r = await run('v = 1', 'check(True, "antes")\nraise ValueError("roto")');
    // contract: tarea 6, reglas del arnés: otra excepción añade un resultado fallido con su mensaje, sin propagarse
    expect(r.checks).toEqual([
      { passed: true, message: 'antes' },
      { passed: false, message: 'roto' },
    ]);
    expect(r.passed).toBe(false);
    expect(r.error).toBeNull();
  });

  it('recorta la traza al código del jugador y no ejecuta las comprobaciones', async () => {
    const r = await run('1/0', 'check(True, "no debe correr")');
    // contract: tarea 6, tabla de casos, fila 5 («ZeroDivisionError»)
    expect(r.error).toContain('ZeroDivisionError');
    // contract: tarea 6, tabla de casos, fila 5 («línea 1»)
    expect(r.error).toContain('línea 1');
    // contract: tarea 6, tabla de casos, fila 5 (sin rutas internas de Pyodide)
    expect(r.error).not.toMatch(/pyodide|\/lib\/|site-packages|\.py"/i);
    // contract: tarea 6, tabla de casos, fila 5 («checks» vacío o null)
    expect(r.checks === null || r.checks.length === 0).toBe(true);
    // contract: tarea 6, tabla de casos, fila 5 («passed» false)
    expect(r.passed).toBe(false);
  });

  it('numera las líneas del código del jugador dentro de funciones', async () => {
    const r = await run('def f():\n    return 1/0\n\nf()');
    // contract: tarea 6, reglas del arnés: la traza lleva los marcos de <tu código> con su número de línea
    expect(r.error).toContain('línea 2');
    expect(r.error).toContain('línea 4');
  });

  it('informa de un error de sintaxis', async () => {
    const r = await run('def f(:');
    // contract: tarea 6, tabla de casos, fila 6
    expect(r.error).toContain('SyntaxError');
    // contract: tarea 6, reglas del arnés: con número de línea
    expect(r.error).toContain('línea 1');
  });

  it('exporta las figuras de matplotlib como PNG en data URL', async () => {
    const r = await run(
      'import matplotlib.pyplot as plt; plt.plot([1,2]); ',
      'check(len(plt.get_fignums()) == 1, "figura")',
    );
    // contract: tarea 6, tabla de casos, fila 7 (1 elemento que empieza por data:image/png;base64,)
    expect(r.figures).toHaveLength(1);
    expect(r.figures[0].startsWith('data:image/png;base64,')).toBe(true);
    // contract: tarea 6, tabla de casos, fila 7 («passed» true)
    expect(r.passed).toBe(true);
  });

  it('no hereda nombres de la ejecución anterior', async () => {
    await run('a = 1');
    const r = await run('print(a)');
    // contract: tarea 6, tabla de casos, fila 8 («la segunda da NameError»)
    expect(r.error).toContain('NameError');
  });

  it('no hereda figuras de la ejecución anterior', async () => {
    const code = 'import matplotlib.pyplot as plt; plt.plot([1,2])';
    await run(code);
    const r = await run(code);
    // contract: tarea 6, tabla de casos, fila 9 («1 figura, no 2»)
    expect(r.figures).toHaveLength(1);
  });

  it('rechaza input() con un mensaje claro', async () => {
    const r = await run('input()');
    // contract: tarea 6, reglas del arnés y tabla de casos, fila 10
    expect(r.error).toContain('`input()` no está disponible aquí: escribe el valor en el código');
  });

  it('no expone check() al código del jugador', async () => {
    const r = await run('check(True, "ok")');
    // contract: tarea 6, tabla de casos, fila 11 («NameError: check no existe para el jugador»)
    expect(r.error).toContain('NameError');
  });

  it('la instancia instalada es la versión que declara config.ts', () => {
    // contract: tarea 6a, ronda 1, hallazgo 8 (PYODIDE_VERSION atada a la versión instalada)
    expect((pyodide as { version: string }).version).toBe(PYODIDE_VERSION);
  });

  it('un jugador que pisa builtins no falsea el veredicto de las ejecuciones siguientes', async () => {
    await run(
      'import builtins; builtins.all = lambda x: True; builtins.print = lambda *a, **k: None',
    );
    const r = await run('v = 1\nprint("visible")', 'check(v == 2, "debe valer 2")');
    // contract: tarea 6a, ronda 1, hallazgo 1 (passed falso, stdout esperado tras contaminar builtins)
    expect(r.passed).toBe(false);
    expect(r.stdout).toBe('visible\n');
    expect(r.checks).toEqual([{ passed: false, message: 'debe valer 2' }]);
  });

  it('un jugador que pisa bool() en su propio código no falsea las comprobaciones de esa misma ejecución', async () => {
    const r = await run('import builtins; builtins.bool = lambda x: True', 'check(False, "falla")');
    // contract: tarea 6a, ronda 1, hallazgo 1 (los builtins se restauran antes de las comprobaciones)
    expect(r.checks).toEqual([{ passed: false, message: 'falla' }]);
    expect(r.passed).toBe(false);
  });

  it('un fallo al exportar una figura da un error en castellano en vez de rechazar la promesa', async () => {
    const r = await run(
      'import matplotlib.pyplot as plt\nplt.title("$\\\\frac{$")',
      'check(True, "x")',
    );
    // contract: tarea 6a, ronda 1, hallazgo 2a (resuelve con RunResult, error en castellano, sin comprobaciones)
    expect(r.error).toContain('No se ha podido dibujar la figura');
    expect(r.passed).toBe(false);
    expect(r.figures).toEqual([]);
    expect(r.checks).toEqual([]);
  });

  it('un sys.exit() de una función del jugador llamada desde las comprobaciones no rechaza la promesa', async () => {
    const r = await run('import sys\ndef f():\n    sys.exit(3)', 'f()');
    // contract: tarea 6a, ronda 1, hallazgo 2b (resuelve con un resultado fallido)
    expect(r.passed).toBe(false);
    expect(r.checks).toHaveLength(1);
    expect(r.checks?.[0].passed).toBe(false);
  });

  it('plt.show() no avisa y la figura se devuelve', async () => {
    const r = await run('import matplotlib.pyplot as plt\nplt.plot([1,2])\nplt.show()');
    // contract: tarea 6a, ronda 1, hallazgo 3 (stdout vacío, una figura)
    expect(r.stdout).toBe('');
    expect(r.figures).toHaveLength(1);
  });

  it('un UnboundLocalError o un NameError manual en las comprobaciones no nombra «None»', async () => {
    const unbound = await run('v = 1', 'def g():\n    x += 1\ng()');
    // contract: tarea 6a, ronda 1, hallazgo 4 (si exc.name es None se usa el mensaje de la excepción)
    expect(unbound.checks?.[0].passed).toBe(false);
    expect(unbound.checks?.[0].message).not.toContain('None');
    expect(unbound.checks?.[0].message).toContain('x');
    const manual = await run('v = 1', 'raise NameError("mensaje propio")');
    expect(manual.checks).toEqual([{ passed: false, message: 'mensaje propio' }]);
  });

  it('rotula un IndentationError con su propio tipo', async () => {
    const r = await run('  x = 1');
    // contract: tarea 6a, ronda 1, hallazgo 5 (type(exc).__name__)
    expect(r.error).toContain('IndentationError');
    expect(r.error).not.toContain('SyntaxError');
  });

  it('recorta las repeticiones de una recursión infinita', async () => {
    const r = await run('def f():\n    f()\nf()');
    // contract: tarea 6a, ronda 1, hallazgo 6 (traza acotada; sigue nombrando el error)
    expect(r.error).toContain('RecursionError');
    expect((r.error ?? '').split('\n').length).toBeLessThan(25);
    expect(r.error).toContain('línea 2');
  });

  it('reinicia las opciones de impresión y los avisos de numpy entre ejecuciones', async () => {
    await run('import numpy as np; np.set_printoptions(precision=2); np.seterr(all="ignore")');
    const printed = await run('import numpy as np; print(np.array([1/3]))');
    // contract: tarea 6a, ronda 1, hallazgo 7 (precisión por defecto de numpy: 8 decimales)
    expect(printed.stdout).toBe('[0.33333333]\n');
    const errors = await run('import numpy as np; print(np.geterr()["divide"])');
    // contract: tarea 6a, ronda 1, hallazgo 7 (np.seterr por defecto: divide="warn"; en wasm la división por cero no emite aviso, por eso se lee la configuración)
    expect(errors.stdout).toBe('warn\n');
  });

  it('cierra las figuras que haya dejado abiertas otra cosa antes de ejecutar', async () => {
    (pyodide as { runPython(c: string): unknown }).runPython(
      'import matplotlib.pyplot as plt\nplt.figure()',
    );
    const r = await run('x = 1');
    // contract: tarea 6a, ronda 1, hallazgo 8 (plt.close("all") previo a la ejecución)
    expect(r.figures).toEqual([]);
  });

  it('captura la salida de error estándar', async () => {
    const r = await run('import sys\nsys.stderr.write("aviso\\n")');
    // contract: tarea 6a, ronda 1, hallazgo 8 (stderr capturada junto con stdout)
    expect(r.stdout).toBe('aviso\n');
  });

  it('unas comprobaciones vacías no superan nada: checks [] y passed falso', async () => {
    const r = await run('x = 1', '');
    // contract: tarea 6b, ronda 1, punto 7 («sin comprobaciones» no es «todas superadas»)
    expect(r.checks).toEqual([]);
    // contract: tarea 6b, ronda 1, punto 7 (passed exige al menos una comprobación)
    expect(r.passed).toBe(false);
  });

  it('unas comprobaciones que no llaman a check() tampoco superan nada', async () => {
    const r = await run('x = 1', 'y = 2');
    // contract: tarea 6b, ronda 1, punto 7 (sin llamadas a check(), no hay resultados)
    expect(r.checks).toEqual([]);
    // contract: tarea 6b, ronda 1, punto 7 (passed exige al menos una comprobación)
    expect(r.passed).toBe(false);
  });

  it('un jugador que pisa np.set_printoptions no hace rechazar las ejecuciones siguientes', async () => {
    const py = pyodide as { runPython(c: string): unknown };
    try {
      const first = await run(
        'import sys, numpy as np\nsys._ailearn_test_spo = np.set_printoptions\nnp.set_printoptions = None',
      );
      // contract: tarea 6b, ronda 1, punto 8 (la ejecución que pisa la función termina sin error)
      expect(first.error).toBeNull();
      const second = await run('print("sigue")');
      // contract: tarea 6b, ronda 1, punto 8 (la siguiente se resuelve con normalidad)
      expect(second.stdout).toBe('sigue\n');
      // contract: tarea 6b, ronda 1, punto 8 (sin error del arnés)
      expect(second.error).toBeNull();
    } finally {
      // Deja numpy como estaba para no afectar a otras pruebas del fichero.
      py.runPython('import sys, numpy as np\nnp.set_printoptions = sys._ailearn_test_spo');
    }
  });
});
