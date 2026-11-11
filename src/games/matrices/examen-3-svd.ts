import type { BankEntry } from '../../content/schema';

/**
 * Un icono de un corazón de 6×7 píxeles, de rango 4, para el laboratorio del banco: otra imagen que
 * la cara del proyecto. Sus σ segundo y tercero son iguales (√2), así que valen dos parejas.
 */
export const CORAZON_6X7: number[][] = [
  [0, 1, 1, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 0, 0, 0],
];

/**
 * Entradas fijas del banco de examen de la Órbita 3 para el proyecto «SVD»: un laboratorio (elegir
 * capas de otra imagen), una cuenta de números guardados y una de código. La entrada generada
 * (`examen-3.valores-singulares`) la añade otro paso. Ids: `examen-3.<tema>`, únicos en todo el juego
 * (también frente a las preguntas de proyecto).
 */
export const examen3Svd: BankEntry[] = [
  {
    project: 'svd',
    question: {
      id: 'examen-3.capas-del-corazon',
      type: 'laboratorio',
      prompt:
        'Un icono de un corazón de 6×7 píxeles, partido en las capas de su SVD. Cada capa tiene su interruptor, y la «parte conservada» es cuánta imagen se llevan las capas encendidas.\n\nEnciende como mucho dos capas y conserva al menos el 90 % del corazón.',
      hints: [
        'Mira los σ del panel: lo que lleva cada capa va con el cuadrado de su σ.',
        'Enciende la capa de σ más grande y busca qué otra le basta para llegar.',
      ],
      explain:
        'La parte conservada es la suma de los $\\sigma^{2}$ de las capas encendidas entre la suma de todos. La primera sola lleva el 83 %: ninguna pareja sin ella llega.',
      solution:
        'La capa 1 con la 2 o con la 3: las dos tienen $\\sigma=\\sqrt{2}$ y cualquiera de ellas lleva el total al 90,6 %. La 1 con la 4 se queda en el 85 %, y la 2 con la 3, en el 15 %.',
      lab: {
        kind: 'compresion',
        mode: 'pick',
        rows: CORAZON_6X7,
        caption: 'Un corazón de 6×7 píxeles',
      },
      goals: [
        {
          metric: 'kept',
          op: 'gte',
          target: 0.9,
          label: 'Parte del corazón conservada',
          format: 'percent',
        },
        { metric: 'k', op: 'lte', target: 2, label: 'Capas encendidas', format: 'integer' },
      ],
      solved: { c1: 1, c2: 1 },
    },
  },
  {
    project: 'svd',
    question: {
      id: 'examen-3.numeros-rango-k',
      type: 'numero',
      prompt:
        'En el GPT-2 pequeño, la capa que ensancha los vectores en cada bloque tiene una matriz de $3072\\times 768$. Se aproxima con sus $k=8$ primeras capas de la SVD.\n\n¿Cuántos números hay que guardar?',
      hints: [
        'Cada capa guarda una columna de 3072 números, una fila de 768 y su σ.',
        'Multiplica lo que cuesta una capa por las 8 capas.',
      ],
      explain:
        'Con $k$ capas se guardan $k\\cdot(m+n+1)$ números en vez de $m\\cdot n$: lo que cuesta cada capa crece con la suma de filas y columnas.',
      solution:
        '$8\\cdot(3072+768+1)=8\\cdot 3841=30\\,728$ números, frente a $3072\\cdot 768=2\\,359\\,296$: alrededor del 1,3 %. Si olvidas los σ sale $30\\,720$.',
      answer: 30728,
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
