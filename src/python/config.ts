// Versión de Pyodide: debe coincidir con la instalada por npm (package.json).
export const PYODIDE_VERSION = '314.0.7';
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
export const PACKAGES = ['numpy', 'matplotlib'] as const;
export const DEFAULT_TIMEOUT_MS = 10_000;
