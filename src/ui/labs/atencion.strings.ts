import type { ValueFormat } from './show';

/** Textos fijos del laboratorio «atención». Cuando se cablee, `src/ui/strings.ts` los publica como `t.labs.atencion`. */
export const atencionStrings = {
  figure: (n: number) => `Una frase de ${n} tokens: el que mira reparte su atención entre todos`,
  sentence:
    'La frase: de la ficha que mira salen arcos hacia los tokens, más gruesos cuanto más peso',
  plane: 'El plano de claves',
  weights: 'Pesos de atención',
  maskedBar: 'enmascarado',
  scoreOf: (s: string) => `puntuación ${s}`,
  looking: 'mira desde aquí',
  queryName: 'q',
  handleQuery: (token: string, at: string) => `Consulta de «${token}», en ${at}`,
  handleKey: (token: string, at: string) => `Clave de «${token}», en ${at}`,
  temperature: 'Temperatura',
  mask: 'Máscara',
  maskOptions: ['sin máscara', 'causal (no mira al futuro)'] as const,
  heatmap: (n: number) => `Mapa de atención de los ${n} tokens`,
  heatmapNote: 'Cada fila es quién mira; cada columna, a quién. Cuanto más claro, más peso.',
  rowOf: (token: string) => `fila de «${token}»`,
  /** El rótulo de una lectura, por nombre de métrica. */
  metric: (m: string, spec: { tokens: { id: string; text: string }[] }): string => {
    const name = (id: string) => spec.tokens.find((t) => t.id === id)?.text ?? id;
    if (m.startsWith('s_') && m !== 's_') {
      const id = m.slice(2);
      if (spec.tokens.some((t) => t.id === id)) return `Puntuación sobre «${name(id)}»`;
    }
    if (m.startsWith('w_') && m !== 'w_max') {
      const id = m.slice(2);
      if (spec.tokens.some((t) => t.id === id)) return `Peso sobre «${name(id)}»`;
    }
    const known: Record<string, string> = {
      w_max: 'El mayor peso',
      top: 'Token al que más mira',
      entropy: 'Entropía de los pesos (bits)',
      self: 'Peso sobre sí mismo',
      future: 'Peso sobre los tokens que vienen después',
      masked: 'Tokens enmascarados',
      out_x: 'Salida, primera coordenada',
      out_y: 'Salida, segunda coordenada',
      temp: 'Temperatura',
    };
    return known[m] ?? m;
  },
};

/** Cómo se escribe cada métrica que no es un decimal corriente. */
export const atencionFormats: Record<string, ValueFormat> = {
  w_max: 'percent',
  self: 'percent',
  future: 'percent',
  masked: 'integer',
  top: 'integer',
};

/** El formato de una métrica, incluidas las de cada token (`w_<id>` es un porcentaje). */
export const atencionFormat = (m: string): ValueFormat =>
  Object.hasOwn(atencionFormats, m)
    ? atencionFormats[m]
    : m.startsWith('w_')
      ? 'percent'
      : undefined;
