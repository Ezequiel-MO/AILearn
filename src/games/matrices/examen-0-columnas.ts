import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 0 para el proyecto «Columnas». Las entradas
 * generadas del banco (`examen-0.matriz-vector`, `examen-0.producto-matrices` y
 * `examen-0.forma-producto`) las añade el ensamblado de la órbita. Ids: `examen-0.<tema>`, únicos
 * en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen0Columnas: BankEntry[] = [
  {
    project: 'columnas',
    question: {
      id: 'examen-0.reconocer-reflejo',
      type: 'opcion',
      prompt:
        'Esta es la matriz de una transformación del plano:\n\n$$A=\\begin{pmatrix}-1&0\\\\0&1\\end{pmatrix}$$\n\n¿Qué hace con el plano?',
      hints: [
        'Lee las columnas: $\\hat{\\imath}$ va a la primera y $\\hat{\\jmath}$ va a la segunda.',
        'Una de las dos flechas conserva su sitio y la otra da la vuelta.',
      ],
      explain:
        'Las columnas son los sitios a los que van $\\hat{\\imath}$ y $\\hat{\\jmath}$. Compara cada una con su posición de partida y mira cuántas flechas cambian de sentido.',
      solution:
        '$\\hat{\\imath}$ va a $(-1, 0)$ y $\\hat{\\jmath}$ se queda en $(0, 1)$. Cada punto $(x, y)$ acaba en $(-x, y)$: es un reflejo respecto al eje vertical. No es una media vuelta, porque esa daría la vuelta a las dos flechas, ni una inclinación, porque no hay números fuera de la diagonal.',
      options: [
        'Un reflejo respecto al eje horizontal',
        'Un giro de media vuelta alrededor del origen',
        'Un reflejo respecto al eje vertical',
        'Una inclinación horizontal',
      ],
      correct: 2,
    },
  },
  {
    project: 'columnas',
    question: {
      id: 'examen-0.matriz-desde-imagenes',
      type: 'vector',
      prompt:
        'Una transformación del plano manda $\\hat{\\imath}$ a $(0, 3)$ y $\\hat{\\jmath}$ a $(-2, 1)$. Escribe su matriz. Rellena las cuatro casillas.',
      hints: [
        'La primera columna son las coordenadas de la imagen de $\\hat{\\imath}$.',
        'Escribe cada pareja en vertical, de arriba abajo, y no en horizontal.',
      ],
      explain:
        'Una matriz es la lista de adónde van $\\hat{\\imath}$ y $\\hat{\\jmath}$, una imagen por columna. Con las parejas en filas saldría la matriz traspuesta.',
      solution:
        'La primera columna es $(0, 3)$ y la segunda es $(-2, 1)$, así que la matriz es $\\begin{pmatrix}0&-2\\\\3&1\\end{pmatrix}$. Si pones las parejas en filas, sale $\\begin{pmatrix}0&3\\\\-2&1\\end{pmatrix}$, que manda $\\hat{\\imath}$ a $(0, -2)$ y no a $(0, 3)$.',
      shape: [2, 2],
      answer: [0, -2, 3, 1],
      tol: 0,
    },
  },
  {
    project: 'columnas',
    question: {
      id: 'examen-0.columnas-con-numpy',
      type: 'codigo',
      prompt:
        'La matriz `A` es una capa lineal con 2 salidas (filas) y 3 características de entrada (columnas). Guarda en `ultima` la columna de la última característica, la que se escribe con la posición `-1`, y en `entradas` el número de características de entrada, que es el número de columnas.',
      hints: [
        'Una columna se elige con `:` en el primer sitio, que significa «todas las filas», y su posición en el segundo.',
        'El atributo `.shape` de una matriz es la tupla (filas, columnas).',
      ],
      explain:
        'Cada columna es el efecto de una característica de entrada sobre las dos salidas, y el número de columnas es el de características. Cuida el orden de la tupla de la forma: primero las filas.',
      solution:
        '`ultima = A[:, -1]` vale $(1, 3)$. Hay 3 columnas, así que `entradas = A.shape[1]` vale $3$. El valor 2, que es `A.shape[0]`, es el número de salidas.',
      starter: `import numpy as np

# Pesos: 2 salidas (filas) y 3 características de entrada (columnas)
A = np.array([[4, 0, 1], [2, 5, 3]])
# Guarda en ultima la columna de la última característica y en entradas cuántas características de entrada hay
ultima = None
entradas = None
`,
      checks: `def _vec(a):
    return isinstance(a, np.ndarray) and a.shape == (2,) and np.issubdtype(a.dtype, np.number)

_fila = isinstance(ultima, np.ndarray) and ultima.shape == (3,) and np.issubdtype(ultima.dtype, np.number) and np.allclose(ultima, A[-1])
_ent = isinstance(entradas, (int, np.integer)) and not isinstance(entradas, bool)
check(_vec(ultima) or _fila, "\`ultima\` tiene que ser un array de NumPy con 2 números, uno por salida: la última columna de \`A\`.")
check(not _fila, "\`ultima\` vale (2, 5, 3): es la última fila de \`A\`, no la última columna. Una columna recorre todas las filas, así que hace falta \`:\` en el primer sitio.")
check((not _vec(ultima)) or not np.allclose(ultima, [4, 2]), "\`ultima\` vale (4, 2): es la primera columna de \`A\`. La última es la de la posición \`-1\`.")
check((not _vec(ultima)) or np.allclose(ultima, [4, 2]) or np.allclose(ultima, [1, 3]), "\`ultima\` tiene que valer (1, 3): los números de la última columna de \`A\`, de arriba abajo.")
check(_ent, "\`entradas\` tiene que ser un número entero: cuántas características de entrada tiene la capa.")
check((not _ent) or entradas != 2, "\`entradas\` vale 2: es el número de filas, o sea de salidas. Las características de entrada son las columnas.")
check((not _ent) or entradas == 2 or entradas == 3, "\`entradas\` tiene que valer 3, el número de columnas de \`A\`.")
`,
      reference:
        'import numpy as np\n\nA = np.array([[4, 0, 1], [2, 5, 3]])\nultima = A[:, -1]\nentradas = A.shape[1]\n',
    },
  },
];
