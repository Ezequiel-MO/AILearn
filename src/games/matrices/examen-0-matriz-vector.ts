import type { BankEntry } from '../../content/schema';
import { ANIMALES, CORREOS, capaLab } from './datos';

/**
 * Entradas fijas del banco de examen de la Órbita 0 para el proyecto «Matriz por vector»: un
 * laboratorio (dos ejemplos con diana que fijan la capa, con otros datos), una cuenta de logits y una
 * de código. La pregunta con números variables (`examen-0.matriz-vector`) la añade otro paso, como
 * entrada `generada`. Ids: `examen-0.<tema>`, únicos en todo el juego (también frente a las preguntas
 * de proyecto).
 */
export const examen0MatrizVector: BankEntry[] = [
  {
    project: 'matriz-vector',
    question: {
      id: 'examen-0.dianas-animales',
      type: 'laboratorio',
      prompt:
        'Seis animales con dos rasgos: **tamaño** y **domesticidad**. La capa siguiente espera «gato» y «lobo» en sus dianas: son dos ejemplos de entrenamiento, que dicen dónde debe dejar la capa cada palabra. Las dos columnas se mueven.\n\nBusca la capa que lleva las dos palabras a su diana a la vez.',
      hints: [
        '«gato» sale en $1\\cdot\\hat{\\imath}+2{,}5\\cdot\\hat{\\jmath}$ y «lobo», en $1{,}5\\cdot\\hat{\\imath}-2\\cdot\\hat{\\jmath}$. Mira hacia dónde tendría que ir cada rasgo para que las dos lleguen.',
        'Las dianas tienen los mismos números que las palabras, cambiados de sitio: la capa intercambia los rasgos.',
      ],
      explain:
        'Cada diana pone dos condiciones y la capa tiene cuatro números: dos palabras de rasgos distintos la fijan. Si aciertas con una sola, la otra suele quedar lejos.',
      solution:
        'Con $\\hat{\\imath}$ en $(0, 1)$ y $\\hat{\\jmath}$ en $(1, 0)$, la capa manda el tamaño a la salida 2 y la domesticidad a la salida 1: «gato» va a $(2{,}5;\\ 1)$ y «lobo» a $(-2;\\ 1{,}5)$. Es la única capa que cumple los dos ejemplos.',
      lab: capaLab(ANIMALES, { targets: { gato: [2.5, 1], lobo: [-2, 1.5] } }),
      goals: [
        {
          metric: 'on_target',
          op: 'gte',
          target: 2,
          label: 'Palabras en su diana',
          format: 'integer',
        },
      ],
      solved: { ix: 0, iy: 1, jx: 1, jy: 0 },
    },
  },
  {
    project: 'matriz-vector',
    question: {
      id: 'examen-0.logits-correo',
      type: 'vector',
      prompt:
        'Un filtro de correo puntúa cada asunto para dos clases: la salida 1 es «spam» y la 2, «normal».\n\n$$W=\\begin{pmatrix}1&-1\\\\-1&1\\end{pmatrix},\\qquad \\vec{b}=(0;\\ 0{,}5)$$\n\n«premio» tiene $3$ enlaces y $1$ saludo. Calcula $W\\vec{x}+\\vec{b}$, primero la puntuación de «spam». En el laboratorio, la capa es $W$, sin el sesgo.',
      hints: [
        'Cada puntuación usa una fila de $W$: la de «spam» es enlaces menos saludos, y la de «normal», al revés.',
        'El sesgo se suma al final, uno por clase.',
      ],
      explain:
        'Cada fila de $W$ por el correo da la puntuación de una clase antes del sesgo; después se suma el sesgo de esa clase. Gana la clase de mayor puntuación.',
      solution:
        'Fila 1: $1\\cdot 3-1\\cdot 1=2$, más $0$: $2$. Fila 2: $-1\\cdot 3+1\\cdot 1=-2$, más $0{,}5$: $-1{,}5$. Sale $(2;\\ -1{,}5)$: gana «spam».',
      lab: capaLab(CORREOS, { i: [1, -1], j: [-1, 1], movable: 'none' }),
      answer: [2, -1.5],
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
