/**
 * Embeddings de juguete: inventados y de dos dimensiones para poder dibujarlos
 * (los reales tienen cientos de dimensiones).
 * Eje x: ser vivo (positivo) o máquina (negativo).
 * Eje y: doméstico (positivo) o salvaje o industrial (negativo).
 */
export const toy: Record<string, [number, number]> = {
  gato: [3, 4],
  perro: [4, 3],
  lobo: [4, -2],
  tigre: [3, -3],
  coche: [-3, 2],
  bici: [-2, 3],
  camión: [-4, -1],
  tractor: [-3, -3],
};
