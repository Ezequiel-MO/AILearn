// Ejecuta un fichero de Python con NumPy en el Pyodide del proyecto, para comprobar cifras a mano.
// Uso, desde la raíz del repositorio o del worktree:
//   node docs/handoffs/2026-11-02-orbita-3-matrices/pyrun.mjs <fichero.py>
// Los guiones de prueba van fuera del repositorio (en el directorio de trabajo temporal de la sesión).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadPyodide } from 'pyodide';

const file = process.argv[2];
if (!file) {
  console.error('Uso: node pyrun.mjs <fichero.py>');
  process.exit(2);
}
const pyodide = await loadPyodide({
  packageCacheDir: join(process.cwd(), 'node_modules', '.cache', 'pyodide'),
});
await pyodide.loadPackage(['numpy']);
pyodide.setStdout({ batched: (s) => console.log(s) });
pyodide.setStderr({ batched: (s) => console.error(s) });
try {
  await pyodide.runPythonAsync(readFileSync(file, 'utf8'));
} catch (e) {
  console.error(String(e));
  process.exit(1);
}
