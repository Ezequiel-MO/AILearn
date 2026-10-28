/** Bloque de código Python para una pista (Markdown), una línea por argumento. */
export const py = (...lines: string[]): string => ['```python', ...lines, '```'].join('\n');
