import { HARNESS, INPUT_MESSAGE, NAME_MESSAGE, PLAYER_FILENAME } from './harness';

export interface CheckResult {
  passed: boolean;
  message: string;
}

export interface RunResult {
  stdout: string;
  /** Traza recortada al código del jugador, o null. */
  error: string | null;
  /** Imágenes PNG como data URL. */
  figures: string[];
  /** null si no se pidieron comprobaciones. */
  checks: CheckResult[] | null;
  /** Sin error, con al menos una comprobación y todas superadas. */
  passed: boolean;
  /** Lo rellena el runner del navegador; el núcleo lo deja en falso. */
  timedOut: boolean;
}

// Frontera con Pyodide: el núcleo no depende de Node ni del navegador, recibe la instancia ya cargada.
interface PyodideLike {
  toPy(value: unknown): { destroy(): void };
  runPython(code: string, options: { globals: unknown }): unknown;
}

export const runInPyodide = async (
  pyodide: unknown,
  code: string,
  checks?: string,
): Promise<RunResult> => {
  const py = pyodide as PyodideLike;
  // Diccionario de nombres propio del arnés, nuevo en cada ejecución.
  const globals = py.toPy({
    __code: code,
    __checks: checks ?? '',
    __has_checks: checks !== undefined,
    __player_file: PLAYER_FILENAME,
    __input_msg: INPUT_MESSAGE,
    __name_msg: NAME_MESSAGE,
  });
  try {
    const raw = py.runPython(HARNESS, { globals });
    const partial = JSON.parse(String(raw)) as Omit<RunResult, 'passed' | 'timedOut'>;
    // El veredicto se calcula aquí, no en Python: el jugador no puede alterarlo.
    const passed =
      partial.error === null &&
      partial.checks !== null &&
      partial.checks.length > 0 &&
      partial.checks.every((c) => c.passed);
    return { ...partial, passed, timedOut: false };
  } finally {
    globals.destroy();
  }
};
