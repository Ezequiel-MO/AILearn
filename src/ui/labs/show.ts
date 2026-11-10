import { fmt } from '../format';

/**
 * Cómo se escribe un valor: decimal con coma (por defecto), porcentaje (0,75 → «75 %»), entero o grados.
 * Las metas de una pregunta admiten `percent` e `integer`; las lecturas de un laboratorio, los cuatro.
 */
export type ValueFormat = 'percent' | 'integer' | 'degrees' | undefined;

/** Un valor para el jugador: «75 %», «3», «0,71», «45°». Un valor no finito sale como raya. */
export const showValue = (value: number, format?: ValueFormat): string => {
  if (!Number.isFinite(value)) return fmt(value);
  if (format === 'percent') return `${fmt(value * 100, 0)} %`;
  if (format === 'integer') return fmt(value, 0);
  if (format === 'degrees') return `${fmt(value, 1)}°`;
  return fmt(value);
};
