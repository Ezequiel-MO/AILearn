// Módulos de Python propios del juego. Se escriben en el sistema de ficheros de Pyodide al arrancar
// (en el worker y en Node), así que el jugador los importa como cualquier otro: `import embeddings`.
// Hoy solo hay uno, `embeddings`: embeddings reales precalculados, porque en el navegador no hay modelo.
// El arnés lo vuelve a importar en cada ejecución (harness.ts, `_fresh_modules`), para que una
// ejecución que modifique sus arrays no estropee la siguiente.

import embeddings from './embeddings.py?raw';

// Frontera con Pyodide: solo lo que se usa de su sistema de ficheros.
interface PyodideWithFS {
  FS: {
    mkdirTree(path: string): void;
    writeFile(path: string, data: string): void;
  };
  runPython(code: string): unknown;
}

export const MODULES_DIR = '/home/pyodide/ailearn';

// El texto del módulo (unos 75 kB) viaja dentro del worker: poco al lado de Pyodide, que pesa megas.
export const installModules = (pyodide: unknown): void => {
  const py = pyodide as PyodideWithFS;
  py.FS.mkdirTree(MODULES_DIR);
  py.FS.writeFile(`${MODULES_DIR}/embeddings.py`, embeddings);
  py.runPython(
    `import sys\nif ${JSON.stringify(MODULES_DIR)} not in sys.path:\n    sys.path.insert(0, ${JSON.stringify(MODULES_DIR)})`,
  );
};
