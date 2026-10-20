import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 1 para el proyecto «Inversa». Las preguntas con
 * números variables las añade otro paso, como entradas `generada`. Ids: `examen-1.<tema>`, únicos
 * en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen1Inversa: BankEntry[] = [
  {
    project: 'inversa',
    question: {
      id: 'examen-1.formula-inversa',
      type: 'vector',
      prompt:
        'Calcula la inversa de $A=\\begin{pmatrix}1&2\\\\1&1\\end{pmatrix}$ con la fórmula $A^{-1}=\\frac{1}{ad-bc}\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}$ y escríbela en las cuatro casillas.',
      hints: [
        'Calcula primero el determinante, $ad-bc$. Esta vez es negativo.',
        'Intercambia las entradas de la diagonal, cambia de signo las otras dos y divide todo entre el determinante.',
      ],
      explain:
        'Cuando el determinante es negativo, dividir entre él cambia el signo de todas las entradas. Comprueba el resultado multiplicándolo por $A$: tiene que salir la identidad.',
      solution:
        '$\\det A=1\\cdot 1-2\\cdot 1=-1$. Al intercambiar $a$ y $d$ (las dos valen $1$) y cambiar de signo $b$ y $c$ queda $\\begin{pmatrix}1&-2\\\\-1&1\\end{pmatrix}$, y se divide entre $-1$: $A^{-1}=\\begin{pmatrix}-1&2\\\\1&-1\\end{pmatrix}$. Comprobación con la primera columna: $A(-1, 1)=(-1+2,\\ -1+1)=(1, 0)$.',
      shape: [2, 2],
      answer: [-1, 2, 1, -1],
      tol: 0,
    },
  },
  {
    project: 'inversa',
    question: {
      id: 'examen-1.es-invertible',
      type: 'opcion',
      prompt: '¿Tiene inversa la matriz $A=\\begin{pmatrix}2&6\\\\1&3\\end{pmatrix}$? ¿Por qué?',
      hints: [
        'Una matriz tiene inversa si y solo si su determinante no es $0$. Calcúlalo.',
        'Mira las dos columnas, $(2, 1)$ y $(6, 3)$: ¿cómo son una respecto de la otra?',
      ],
      explain:
        'Que las columnas sean distintas o que no haya ceros no decide nada. Lo que decide es si las dos columnas apuntan en la misma dirección, y eso lo dice el determinante.',
      solution:
        '$\\det A=2\\cdot 3-6\\cdot 1=0$. La segunda columna es el triple de la primera: las dos son paralelas, y $A$ aplasta el plano sobre una recta. Dos entradas distintas de la misma recta quedan en el mismo punto, y no hay manera de saber de cuál de ellas se partió: no tiene inversa.',
      options: [
        'Sí, porque todas sus entradas son distintas de cero',
        'No, porque su determinante es $0$: aplasta el plano sobre una recta y eso no se puede deshacer',
        'No, porque una matriz solo tiene inversa si es diagonal',
        'Sí, porque sus dos columnas son distintas',
      ],
      correct: 1,
    },
  },
  {
    project: 'inversa',
    question: {
      id: 'examen-1.sistema-en-codigo',
      type: 'codigo',
      prompt:
        'Ya tienes la matriz `A` y el vector `b` de un sistema $A\\vec{x}=\\vec{b}$. Guarda en `x` su solución, usando `np.linalg.solve`, y en `invertible` si `A` tiene inversa, como un solo `True` o `False`. Calcula `invertible` con el determinante y una comparación con tolerancia.',
      hints: [
        '`np.linalg.solve(A, b)` recibe primero la matriz y después el vector.',
        '`A` tiene inversa cuando su determinante, `np.linalg.det(A)`, no es casi $0$; `np.isclose(d, 0)` es verdadero cuando sí lo es.',
      ],
      explain:
        '`invertible` tiene que valer `True` cuando la matriz sí tiene inversa, es decir, cuando el determinante no es casi cero. Una condición escrita al revés da el valor contrario al que se pide.',
      solution:
        'Se escribe `x = np.linalg.solve(A, b)`, que vale $(1, 2)$, y `invertible = not np.isclose(np.linalg.det(A), 0)`. El determinante es $3\\cdot 2-1\\cdot 1=5$, distinto de $0$, así que `invertible` es `True`. Con una matriz singular, `solve` no daría una solución válida: conviene mirar el determinante antes.',
      requirements: [
        '`x` es un array de NumPy con 2 números: el vector que `A` lleva hasta `b`, con un pequeño margen por el redondeo.',
        '`invertible` es un solo `True` o `False` (no el valor del determinante), y dice si `A` tiene inversa.',
      ],
      starter: `import numpy as np

A = np.array([[3, 1], [1, 2]])
b = np.array([5, 5])
# Guarda en x la solución de A x = b, y en invertible si A tiene inversa
x = None
invertible = None
`,
      checks: `_x = isinstance(x, np.ndarray) and x.shape == (2,) and np.issubdtype(x.dtype, np.number)
_i = isinstance(invertible, (bool, np.bool_))
check(_x, "\`x\` tiene que ser un array de NumPy con 2 números: la solución del sistema.")
check((not _x) or np.allclose(x, [1, 2]), "\`x\` tiene que valer (1, 2): es el vector que \`A\` lleva hasta \`b\`, es decir, \`A @ x\` tiene que dar \`b\`.")
check(_i, "\`invertible\` tiene que ser un solo \`True\` o \`False\`, y no el valor del determinante.")
check((not _i) or bool(invertible), "\`invertible\` vale \`False\`, pero el determinante de \`A\` es 5, distinto de 0: la matriz sí tiene inversa. Revisa la condición, que puede estar al revés.")
`,
      reference:
        'import numpy as np\n\nA = np.array([[3, 1], [1, 2]])\nb = np.array([5, 5])\nx = np.linalg.solve(A, b)\ninvertible = not np.isclose(np.linalg.det(A), 0)\n',
    },
  },
];
