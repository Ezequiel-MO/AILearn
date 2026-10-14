const MINUS = '−';
const DASH = '—';

/**
 * Formato de números para el jugador: coma decimal, menos tipográfico (U+2212) y sin ceros de más.
 * Redondea a `decimals` (2 por defecto). Un valor no finito se muestra como raya.
 */
export const fmt = (n: number, decimals = 2): string => {
  if (!Number.isFinite(n)) return DASH;
  let s = n.toFixed(decimals);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  if (s.startsWith('-')) s = s === '-0' ? '0' : MINUS + s.slice(1);
  return s.replace('.', ',');
};

/**
 * Par (o tupla) para el jugador: «(1, 3)». Si algún componente, ya formateado, lleva coma decimal,
 * el separador es «; » («(1,5; 3)») para no mezclarlo con la coma decimal. Misma regla que `tuple` en generators.ts.
 */
export const fmtPair = (values: readonly number[], decimals = 2): string => {
  const parts = values.map((v) => fmt(v, decimals));
  const sep = parts.some((p) => p.includes(',')) ? '; ' : ', ';
  return `(${parts.join(sep)})`;
};
