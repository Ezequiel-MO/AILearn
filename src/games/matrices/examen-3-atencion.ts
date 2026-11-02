import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 3 para el proyecto «Atención como matriz». La entrada
 * generada la añade otro paso. Ids: `examen-3.<tema>`, únicos en todo el juego (también frente a las
 * preguntas de proyecto).
 */
export const examen3Atencion: BankEntry[] = [
  {
    project: 'atencion',
    question: {
      id: 'examen-3.mascara-causal',
      type: 'opcion',
      prompt:
        'Un modelo que genera texto palabra a palabra no puede mirar las palabras que vienen después. Para impedirlo, antes del softmax se pone $-\\infty$ en las puntuaciones que quedan **por encima de la diagonal** de la tabla $n\\times n$. ¿Qué pasa con los pesos de atención?',
      hints: [
        'La fila $i$ de la tabla son las puntuaciones de la palabra $i$ con todas las demás. ¿Qué columnas quedan por encima de la diagonal en esa fila?',
        '¿Cuánto vale $e^{-\\infty}$? Y después, ¿qué hace el softmax con lo que queda en la fila?',
      ],
      explain:
        'El exponencial de $-\\infty$ es $0$, así que esas posiciones no reciben peso. El softmax se calcula después, sobre las puntuaciones que quedan, y vuelve a normalizar cada fila. Poner ceros a mano después del softmax sí dejaría filas que no suman $1$.',
      solution:
        'Cada palabra tiene peso $0$ sobre las posteriores, y su fila sigue sumando $1$ repartida entre ella y las anteriores. Con $-\\infty$ en las puntuaciones, el exponencial de esas posiciones es $0$ y el softmax normaliza solo lo que queda. La primera palabra solo se mira a sí misma, con peso $1$. Los pesos sobre las anteriores no se anulan, y la diagonal tampoco: una palabra sí puede mirarse a sí misma.',
      options: [
        'Cada palabra tiene peso $0$ sobre las anteriores, y su fila sigue sumando $1$',
        'Cada palabra tiene peso $0$ sobre las posteriores, y su fila sigue sumando $1$ repartida entre ella y las anteriores',
        'Los pesos de la diagonal valen $0$, y cada fila suma $1$ sobre las demás palabras',
        'Las filas dejan de sumar $1$, y hay que volver a normalizarlas después',
      ],
      correct: 1,
    },
  },
  {
    project: 'atencion',
    question: {
      id: 'examen-3.pesos-no-nulos',
      type: 'numero',
      prompt:
        'Un modelo con máscara causal procesa un texto de **6** palabras. Cada palabra solo puede mirarse a sí misma y a las anteriores. ¿Cuántas de las $6\\times 6$ entradas de la matriz de pesos pueden ser distintas de $0$?',
      hints: [
        'La primera palabra solo puede mirar una posición, la segunda dos… Cuenta cuántas puede mirar cada una.',
        'Suma esas cantidades, o cuenta la diagonal y todo lo que queda por debajo de ella.',
      ],
      explain:
        'Es el triángulo inferior de la matriz, con su diagonal. La palabra $i$ puede mirar $i$ posiciones, y la suma de $1$ a $6$ es lo que se busca. Contar solo la parte de debajo de la diagonal deja fuera las seis entradas de la propia diagonal.',
      solution:
        '$1+2+3+4+5+6=21$ entradas pueden ser distintas de $0$: el triángulo inferior con su diagonal. Las otras $36-21=15$ valen $0$ por la máscara. Si te sale $15$, has contado las posiciones que se anulan, o solo las de debajo de la diagonal, y se te han quedado fuera las seis de la propia diagonal.',
      answer: 21,
      tol: 0,
    },
  },
];
