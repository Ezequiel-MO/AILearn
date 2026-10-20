import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 0 para el proyecto «Matriz por vector». La
 * pregunta con números variables (`examen-0.matriz-vector`) la añade otro paso, como entrada
 * `generada`. Ids: `examen-0.<tema>`, únicos en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen0MatrizVector: BankEntry[] = [
  {
    project: 'matriz-vector',
    question: {
      id: 'examen-0.producto-valido',
      type: 'opcion',
      prompt:
        'Una capa lineal de una red tiene una matriz de pesos $W$ de 3 filas y 4 columnas. ¿Qué vector de entrada admite el producto $W\\vec{x}$ y cuántas componentes tiene la salida?',
      hints: [
        'Las columnas de $W$ se emparejan con las componentes de $\\vec{x}$: han de ser tantas como columnas.',
        'La salida tiene una componente por cada fila de $W$.',
      ],
      explain:
        'En una matriz de $m\\times n$, las $n$ columnas deciden cuántas componentes tiene la entrada y las $m$ filas, cuántas tiene la salida. Aplica esa regla a los números de la capa.',
      solution:
        'La entrada tiene que tener 4 componentes, una por columna, y la salida tiene 3, una por fila: la capa transforma vectores de 4 componentes en vectores de 3. Con una entrada de 3 componentes sobraría una columna de $W$ sin pareja.',
      options: [
        'Una entrada de 3 componentes y una salida de 4',
        'Una entrada de 4 componentes y una salida de 4',
        'Una entrada de 4 componentes y una salida de 3',
        'Una entrada de 3 componentes y una salida de 3',
      ],
      correct: 2,
    },
  },
  {
    project: 'matriz-vector',
    question: {
      id: 'examen-0.imagen-columnas',
      type: 'vector',
      prompt:
        'Calcula $A\\vec{v}$ con\n\n$$A=\\begin{pmatrix}2&-1\\\\0&4\\\\1&1\\end{pmatrix},\\qquad \\vec{v}=(1, 3)$$\n\nEscribe el resultado: tiene tantas componentes como filas tiene $A$.',
      hints: [
        'Por columnas: toma $1$ vez la primera columna, $(2, 0, 1)$, y $3$ veces la segunda, $(-1, 4, 1)$.',
        'Suma los dos vectores de 3 componentes, componente a componente.',
      ],
      explain:
        'Las coordenadas de $\\vec{v}$ son los pesos de las dos columnas. Como $A$ tiene 3 filas, el resultado tiene 3 componentes, aunque $\\vec{v}$ tenga 2.',
      solution:
        '$1\\cdot(2, 0, 1)+3\\cdot(-1, 4, 1)=(2, 0, 1)+(-3, 12, 3)=(-1, 12, 4)$. Por filas sale lo mismo: $2\\cdot 1+(-1)\\cdot 3=-1$, $0\\cdot 1+4\\cdot 3=12$ y $1\\cdot 1+1\\cdot 3=4$.',
      answer: [-1, 12, 4],
      tol: 0,
    },
  },
  {
    project: 'matriz-vector',
    question: {
      id: 'examen-0.capa-lote',
      type: 'codigo',
      prompt:
        'Una capa lineal clasifica textos en dos clases con $\\vec{y}=W\\vec{x}+\\vec{b}$: la clase 0 es «positivo» y la clase 1, «negativo», y gana la de mayor puntuación. `X` guarda tres embeddings de juguete (inventados y de 4 componentes; los reales tienen cientos), uno por fila.\n\nGuarda en `Y` las puntuaciones de las dos clases para los tres textos de una sola vez, una fila por texto. Guarda en `clases` la clase de cada texto: `np.argmax(Y, axis=1)` da, para cada fila de `Y`, la posición de su mayor valor.',
      hints: [
        'Los vectores de `X` están en filas, así que la matriz va a la derecha y traspuesta. El sesgo `b` se suma al final.',
        '`Y` tiene que tener 3 filas y 2 columnas. Después, `clases` se saca de `Y` con `np.argmax`.',
      ],
      explain:
        'El lote se calcula con la matriz traspuesta porque los vectores están en filas, y el sesgo se suma después de multiplicar. El sesgo puede cambiar qué clase gana: sin él, el primer texto saldría de otra clase.',
      solution:
        'Se escribe `Y = X @ W.T + b`, que vale `[[1, 2], [-4, 4], [1, 0]]`, y `clases = np.argmax(Y, axis=1)`, que da `[1, 1, 0]`. Sin el sesgo, `Y` valdría `[[3, 1], [-2, 3], [3, -1]]` y la primera clase saldría 0 en lugar de 1.',
      requirements: [
        '`Y` existe y es un array de NumPy con números, de 3 filas y 2 columnas: una fila por texto, con la puntuación de cada clase.',
        '`Y` incluye el sesgo `b`: se le suma a la salida de cada texto.',
        '`clases` existe y es una lista o un array de 3 números, uno por texto, no uno por clase.',
        '`clases` dice, para cada texto, qué clase tiene la mayor puntuación en `Y`.',
      ],
      starter: `import numpy as np

W = np.array([[1, 0, -1, 2], [0, 1, 1, -1]])
b = np.array([-2, 1])
# Embeddings de juguete (inventados y de 4 componentes), uno por fila
X = np.array([[1, 2, 0, 1], [0, 1, 2, 0], [1, 0, 0, 1]])
# Guarda en Y las puntuaciones de las dos clases para los tres textos, una fila por texto
Y = None
# Guarda en clases la clase de cada texto: la posición de su mayor puntuación
clases = None
`,
      checks: `_W = np.array([[1, 0, -1, 2], [0, 1, 1, -1]])
_b = np.array([-2, 1])
_X = np.array([[1, 2, 0, 1], [0, 1, 2, 0], [1, 0, 0, 1]])
_Ye = _X @ _W.T + _b
_arr = isinstance(Y, np.ndarray) and np.issubdtype(Y.dtype, np.number)
_ok = _arr and Y.shape == (3, 2)
_nob = _ok and np.allclose(Y, _X @ _W.T)
_cv = isinstance(clases, (list, tuple, np.ndarray, np.generic, int, float)) and np.asarray(clases).dtype != object and np.issubdtype(np.asarray(clases).dtype, np.number)
_c = np.asarray(clases) if _cv else None
_cok = _cv and _c.shape == (3,)
check(_arr, "\`Y\` tiene que ser un array de NumPy con números: las puntuaciones de las dos clases para los tres textos.")
check((not _arr) or Y.shape == (3, 2), "\`Y\` tiene que tener 3 filas y 2 columnas: una fila por texto, con la puntuación de cada clase.")
check(not _nob, "\`Y\` no incluye el sesgo \`b\`: falta sumárselo a cada fila. Sin él, el primer texto cambia de clase.")
check((not _ok) or _nob or np.allclose(Y, _Ye), "\`Y\` no tiene los valores esperados: cada fila es la salida de la capa para un texto, y la primera es (1, 2).")
check(_cv, "\`clases\` tiene que ser una lista o un array de números: la clase de cada texto.")
check((not _cv) or _c.shape != (2,), "\`clases\` tiene 2 números: has buscado la mayor puntuación por columnas, es decir, el mejor texto de cada clase. Se pide la mejor clase de cada texto, por filas.")
check((not _cv) or _c.shape == (2,) or _cok, "\`clases\` tiene que tener 3 números: la clase de cada uno de los tres textos.")
check((not _cok) or _nob or not _ok or np.array_equal(_c, [1, 1, 0]), "\`clases\` tiene que valer (1, 1, 0): para cada texto, la clase de mayor puntuación en \`Y\`.")
`,
      reference: `import numpy as np

W = np.array([[1, 0, -1, 2], [0, 1, 1, -1]])
b = np.array([-2, 1])
X = np.array([[1, 2, 0, 1], [0, 1, 2, 0], [1, 0, 0, 1]])
Y = X @ W.T + b
clases = np.argmax(Y, axis=1)
`,
    },
  },
];
