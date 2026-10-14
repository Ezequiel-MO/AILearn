import { join } from 'node:path';
import { loadPyodide } from 'pyodide';
import { PACKAGES } from './config';

// Pyodide sobre Node para las pruebas. Los paquetes (numpy, matplotlib…) se descargan
// del CDN la primera vez y se guardan en node_modules/.cache/pyodide para las siguientes.
export const loadNodePyodide = async (): Promise<unknown> => {
  const pyodide = await loadPyodide({
    packageCacheDir: join(process.cwd(), 'node_modules', '.cache', 'pyodide'),
  });
  await pyodide.loadPackage([...PACKAGES]);
  // La primera importación de matplotlib tarda unos segundos (caché de fuentes): se paga aquí, no en la primera prueba.
  await pyodide.runPythonAsync(
    'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot',
  );
  return pyodide;
};
