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
  {
    project: 'svd',
    question: {
      id: 'examen-3.volumen-con-valores-singulares',
      type: 'codigo',
      prompt:
        '`V` es una matriz de $3\\times 3$ que transforma el espacio. Guarda en `S` sus valores singulares; en `volumen`, el factor por el que `V` multiplica los volúmenes, calculado **solo con `S`**; y en `coincide`, si `volumen` es igual al valor absoluto de `np.linalg.det(V)` (un `True` o un `False`, comparados con `np.isclose`).',
      hints: [
        'Los valores singulares se piden con `np.linalg.svd` y `compute_uv=False`. El volumen se multiplica por el producto de todos ellos.',
        'Un valor singular nunca es negativo, y el determinante sí puede serlo: por eso se compara con su valor absoluto.',
      ],
      explain:
        'El valor absoluto del determinante es el producto de los valores singulares: la matriz gira, estira cada eje por su valor singular y vuelve a girar, y los giros no cambian los volúmenes. El signo del determinante dice si la matriz da la vuelta al espacio, y eso queda en los giros.',
      solution:
        'Los valores singulares de `V` son aproximadamente $3{,}34$, $2{,}45$ y $2{,}20$, y su producto es $18$. El determinante de `V` vale $-18$: tiene el mismo tamaño y signo opuesto, porque `V` da la vuelta al espacio. Por eso `volumen` es $18$ y `coincide` es `True` si se compara con $|\\det V|$. Si guardas el determinante directamente en `volumen`, sale $-18$, un volumen negativo.',
      requirements: [
        '`S` es un array de NumPy con 3 números: los valores singulares de `V`.',
        '`volumen` es un número no negativo: el factor por el que `V` multiplica los volúmenes, calculado a partir de `S`.',
        '`coincide` es un solo `True` o `False`: el resultado de `np.isclose` entre `volumen` y el valor absoluto de `np.linalg.det(V)`.',
      ],
      starter: `import numpy as np

V = np.array([[2.0, -1.0, 1.0], [0.0, 3.0, 1.0], [1.0, 1.0, -2.0]])
# Guarda en S los valores singulares de V, en volumen el factor de volumen calculado con S y en coincide si es igual a |det(V)|
S = None
volumen = None
coincide = None
`,
      checks: `_V = np.array([[2.0, -1.0, 1.0], [0.0, 3.0, 1.0], [1.0, 1.0, -2.0]])
_S = np.linalg.svd(_V, compute_uv=False)
_a = isinstance(S, np.ndarray) and S.shape == (3,) and np.issubdtype(S.dtype, np.floating)
_aok = _a and bool(np.allclose(S, _S))
check(_a, "\`S\` tiene que ser un array de NumPy con 3 números: los valores singulares de \`V\`.")
check((not _a) or _aok, "\`S\` no son los valores singulares de \`V\`. Usa \`np.linalg.svd(V, compute_uv=False)\`.")
_v = isinstance(volumen, (int, float, np.integer, np.floating)) and not isinstance(volumen, (bool, np.bool_))
check(_v, "\`volumen\` tiene que ser un solo número: el factor por el que \`V\` multiplica los volúmenes.")
check((not _v) or float(volumen) >= 0, "\`volumen\` es negativo. Un factor de escala de los volúmenes no puede serlo: sale del producto de los valores singulares, que nunca son negativos, y no del determinante con su signo.")
check((not _v) or float(volumen) < 0 or abs(float(volumen) - float(np.prod(_S))) < 1e-6 or abs(float(volumen) - float(np.sum(_S))) > 1e-6, "\`volumen\` es la suma de los valores singulares. Los factores de estiramiento de los tres ejes se multiplican, no se suman.")
check((not _v) or float(volumen) < 0 or abs(float(volumen) - float(np.prod(_S))) < 1e-6 or abs(float(volumen) - float(np.sum(_S))) < 1e-6, "\`volumen\` tiene que ser el producto de los tres valores singulares.")
_c = isinstance(coincide, (bool, np.bool_))
check(_c, "\`coincide\` tiene que ser un solo \`True\` o \`False\`: el resultado de \`np.isclose\`.")
check((not _c) or (not _v) or abs(float(volumen) - float(np.prod(_S))) > 1e-6 or bool(coincide), "\`coincide\` vale \`False\`, pero \`volumen\` es igual al valor absoluto del determinante. Compara así: \`np.isclose(volumen, abs(np.linalg.det(V)))\`.")
`,
      reference: `import numpy as np

V = np.array([[2.0, -1.0, 1.0], [0.0, 3.0, 1.0], [1.0, 1.0, -2.0]])
S = np.linalg.svd(V, compute_uv=False)
volumen = np.prod(S)
coincide = np.isclose(volumen, abs(np.linalg.det(V)))
`,
    },
  },
];
