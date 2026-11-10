import type { BankEntry } from '../../content/schema';
import { ANIMALES, capaLab } from './datos';

/**
 * Entradas fijas del banco de examen de la Órbita 0 para el proyecto «Componer»: un laboratorio (la
 * segunda capa tras una que mezcla, con otros datos), una cuenta de la capa única que equivale a dos
 * y una de código. La generada (`examen-0.producto-matrices`) la añade el ensamblado de la órbita.
 * Ids: `examen-0.<tema>`, únicos en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen0Componer: BankEntry[] = [
  {
    project: 'componer',
    question: {
      id: 'examen-0.capa-tras-mezcla',
      type: 'laboratorio',
      prompt:
        'Seis animales con dos rasgos: **tamaño** y **domesticidad**. Una primera capa, fija, ya los ha mezclado: los cuadraditos marcan dónde los deja. Tu capa va detrás, y la neurona siguiente solo mira tu primera salida y responde «mascota» a lo que cae en la zona sombreada.\n\nConstruye la segunda capa para que acierte con los seis.',
      hints: [
        'Mira los cuadraditos: las mascotas y los salvajes se separan por la diferencia entre sus dos coordenadas, no por una sola.',
        'Tu primera salida tiene que restar una coordenada de los cuadraditos de la otra, con el signo que deje las mascotas a la derecha.',
      ],
      explain:
        'Tu capa trabaja con la mezcla, no con los rasgos. La primera coordenada de un cuadradito es tamaño menos domesticidad, y la segunda, tamaño más domesticidad. La segunda menos la primera es el doble de la domesticidad.',
      solution:
        'Una capa que vale: $\\hat{\\imath}$ en $(-1, 0)$ y $\\hat{\\jmath}$ en $(0, 1)$. La primera salida es la primera coordenada cambiada de signo, domesticidad menos tamaño, y separa los seis. También vale $\\hat{\\imath}$ en $(-1, 0)$ y $\\hat{\\jmath}$ en $(1, 1)$, el doble de la domesticidad. Intercambiar las columnas deja tamaño más domesticidad, y «tigre» y «oso» fallan.',
      lab: capaLab(
        { ...ANIMALES, axes: ['tamaño − domesticidad', 'tamaño + domesticidad'] },
        {
          range: 5.5,
          before: { i: [1, 1], j: [-1, 1] },
          readout: { w: [1, 0], b: 0 },
        },
      ),
      goals: [
        {
          metric: 'acc',
          op: 'gte',
          target: 1,
          label: 'Aciertos de la neurona siguiente',
          format: 'percent',
        },
      ],
      solved: { ix: -1 },
    },
  },
  {
    project: 'componer',
    question: {
      id: 'examen-0.capa-equivalente',
      type: 'numero',
      prompt:
        'Por un descuido, una red tiene dos capas lineales seguidas sin activación entre ellas: la primera lleva embeddings de $384$ números a $1536$, y la segunda, de $1536$ a $384$. Las dos juntas equivalen a una sola capa.\n\n¿Cuántos pesos tiene la matriz de esa capa única?',
      hints: [
        'La capa única recibe lo mismo que la primera y devuelve lo mismo que la segunda: ¿cuántas entradas y cuántas salidas tiene?',
        'Sus pesos son salidas por entradas. El $1536$ de en medio desaparece.',
      ],
      explain:
        'La matriz única es el producto de las dos, $(384\\times 1536)(1536\\times 384)$, y su forma la dan los tamaños de fuera. El de dentro solo cuenta al hacer las sumas.',
      solution:
        'La capa única es de $384\\times 384$: $384\\cdot 384=147\\,456$ pesos. Las dos capas guardan $2\\cdot 1536\\cdot 384=1\\,179\\,648$, ocho veces más, para hacer lo mismo que una.',
      answer: 147456,
      tol: 0,
    },
  },
  {
    project: 'componer',
    question: {
      id: 'examen-0.tres-capas',
      type: 'codigo',
      prompt:
        'Una red tiene tres capas lineales seguidas, sin función de activación entre ellas: primero `W1`, luego `W2` y por último `W3`. Ya tienes las tres matrices, todas de $2\\times 2$, y la entrada `x`. Guarda en `W` la matriz única que equivale a las tres capas, y en `y` su salida para `x`.',
      hints: [
        'La capa que actúa primero va a la derecha del producto, y la que actúa al final, a la izquierda.',
        'El producto de tres matrices se escribe con dos `@`.',
      ],
      explain:
        'Con tres capas, la primera queda en el extremo derecho y la última en el izquierdo. Si inviertes el orden, sale otra matriz distinta.',
      solution:
        'Se escribe `W = W3 @ W2 @ W1`, que vale $\\begin{pmatrix}0&2\\\\1&2\\end{pmatrix}$, y `y` vale $(2, 3)$: la misma salida que pasar `x` por las tres capas, una a una. En el orden contrario, `W1 @ W2 @ W3`, saldría $\\begin{pmatrix}4&1\\\\2&0\\end{pmatrix}$, que es otra red.',
      requirements: [
        '`W` existe y es un array de NumPy con números, de 2 filas y 2 columnas.',
        '`W` equivale a las tres capas: `W1` actúa primero, `W2` después y `W3` al final.',
        '`y` existe y es un array de NumPy con 2 componentes, las dos números: la salida de la capa única `W` para `x`.',
      ],
      starter: `import numpy as np

W1 = np.array([[1, 2], [0, 1]])
W2 = np.array([[0, 1], [1, 0]])
W3 = np.array([[2, 0], [0, 1]])
x = np.array([1, 1])
# Guarda en W la matriz única equivalente a las tres capas, y en y su salida para x
W = None
y = None
`,
      checks: `_arr = isinstance(W, np.ndarray) and np.issubdtype(W.dtype, np.number)
_w = _arr and W.shape == (2, 2)
_y = isinstance(y, np.ndarray) and y.shape == (2,) and np.issubdtype(y.dtype, np.number)
_rev = _w and np.allclose(W, [[4, 1], [2, 0]])
check(_arr, "\`W\` tiene que ser un array de NumPy con números: la matriz única que equivale a las tres capas.")
check((not _arr) or W.shape == (2, 2), "\`W\` tiene que ser una matriz de 2 filas y 2 columnas.")
check((not _w) or not _rev, "\`W\` está calculada con las capas en orden contrario. La primera capa, \`W1\`, actúa primero y va a la derecha del producto; la última, \`W3\`, va a la izquierda.")
check((not _w) or _rev or np.allclose(W, [[0, 2], [1, 2]]), "\`W\` tiene que valer (0, 2) en la primera fila y (1, 2) en la segunda: la tercera capa por la segunda y por la primera, en ese orden.")
check(_y, "\`y\` tiene que ser un array de NumPy con 2 números: la salida de la capa única para \`x\`.")
check((not _y) or np.allclose(y, [2, 3]) or (_rev and np.allclose(y, [5, 2])), "\`y\` tiene que valer (2, 3), la misma salida que dan las tres capas por separado.")
`,
      reference:
        'import numpy as np\n\nW1 = np.array([[1, 2], [0, 1]])\nW2 = np.array([[0, 1], [1, 0]])\nW3 = np.array([[2, 0], [0, 1]])\nx = np.array([1, 1])\nW = W3 @ W2 @ W1\ny = W @ x\n',
    },
  },
];
