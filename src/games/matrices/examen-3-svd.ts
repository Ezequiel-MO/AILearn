import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 3 para el proyecto «SVD». La entrada generada
 * (`examen-3.valores-singulares`) la añade otro paso. Ids: `examen-3.<tema>`, únicos en todo el juego
 * (también frente a las preguntas de proyecto).
 */
export const examen3Svd: BankEntry[] = [
  {
    project: 'svd',
    question: {
      id: 'examen-3.svd-sin-autovalores',
      type: 'opcion',
      prompt:
        'Una capa gira cada flecha $90^{\\circ}$ y además la dobla: $A=\\begin{pmatrix}0&-2\\\\2&0\\end{pmatrix}$. No tiene autovalores reales, porque ninguna flecha conserva su dirección. ¿Qué se puede decir de su descomposición en valores singulares $A=U\\Sigma V^{T}$?',
      hints: [
        '¿Qué le pasa a la circunferencia unidad? Una matriz así gira y dobla, pero no deforma.',
        'Los valores singulares salen de $A^{T}A$, que es simétrica aunque $A$ no lo sea.',
      ],
      explain:
        'La descomposición en valores singulares existe para toda matriz, cuadrada o no, tenga o no autovectores reales: se apoya en $A^{T}A$, que siempre es simétrica. Los autovalores de $A$ y sus valores singulares son cosas distintas.',
      solution:
        'Existe, como en toda matriz. $A^{T}A=\\begin{pmatrix}4&0\\\\0&4\\end{pmatrix}$ tiene dos autovalores iguales a $4$, así que $\\sigma_1=\\sigma_2=2$: la circunferencia unidad se convierte en una circunferencia de radio $2$. $\\Sigma=2I$ solo estira, y el giro de $90^{\\circ}$ queda en los factores que giran, $U$ y $V^{T}$. Los valores singulares son siempre reales y no negativos, haya o no autovalores reales.',
      options: [
        'No existe: sin autovalores reales no hay descomposición posible',
        'Existe, como en toda matriz: los dos valores singulares valen 2, y el giro queda en los factores que giran',
        'Existe solo si la matriz es simétrica, y esta no lo es',
        'Existe, pero con valores singulares complejos, porque los autovalores no son reales',
      ],
      correct: 1,
    },
  },
  {
    project: 'svd',
    question: {
      id: 'examen-3.numero-de-condicion',
      type: 'numero',
      prompt:
        'Para una capa $W$, la matriz $W^{T}W$ tiene autovalores $36$ y $4$. El **número de condición** de $W$ es $\\sigma_1/\\sigma_2$, el cociente entre su mayor y su menor valor singular: dice cuán desigual es el estiramiento. ¿Cuánto vale?',
      hints: [
        'Los valores singulares son las raíces cuadradas de los autovalores de $W^{T}W$.',
        'Haz el cociente después de sacar las raíces, no antes.',
      ],
      explain:
        'Los autovalores de $W^{T}W$ son los cuadrados de los valores singulares, así que hay que sacar la raíz antes de dividir. Dividir los autovalores sin más da el cuadrado del número de condición.',
      solution:
        '$\\sigma_1=\\sqrt{36}=6$ y $\\sigma_2=\\sqrt{4}=2$, luego $\\sigma_1/\\sigma_2=3$. Si te sale $9$, has dividido los autovalores sin sacar la raíz.',
      answer: 3,
      tol: 0,
    },
  },
];
