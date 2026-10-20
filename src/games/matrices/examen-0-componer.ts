import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 0 para el proyecto «Componer». Las preguntas con
 * números variables las añade otro paso, como entradas `generada`. Ids: `examen-0.<tema>`, únicos
 * en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen0Componer: BankEntry[] = [
  {
    project: 'componer',
    question: {
      id: 'examen-0.orden-producto',
      type: 'opcion',
      prompt:
        'Un vector $\\vec{v}$ pasa por dos transformaciones lineales seguidas: primero $G$, un giro, y después $E$, un estiramiento. ¿Con qué expresión se obtiene el resultado completo?',
      hints: [
        'En $M\\vec{v}$, la matriz $M$ actúa sobre $\\vec{v}$. Si hay dos, la segunda actúa sobre lo que sale de la primera.',
        'Escribe $E(G\\vec{v})$: ¿quién actúa primero y a qué lado de la otra está?',
      ],
      explain:
        'El producto se lee de derecha a izquierda: la matriz más cercana al vector actúa primero. Con transformaciones distintas, el orden cambia el resultado.',
      solution:
        'Primero actúa $G$ sobre $\\vec{v}$, y $E$ actúa sobre lo que sale: $E(G\\vec{v})=(EG)\\vec{v}$. La matriz de la transformación completa es $EG$, escrita de derecha a izquierda. Sumar las matrices no compone nada, y $GE$ y $EG$ casi nunca coinciden.',
      options: [
        '$GE\\vec{v}$, porque las matrices se escriben en el orden en que actúan',
        '$EG\\vec{v}$, porque la primera en actuar es la más cercana al vector',
        '$(G+E)\\vec{v}$, porque dos transformaciones seguidas se suman',
        'Da igual, porque $GE\\vec{v}$ y $EG\\vec{v}$ siempre coinciden',
      ],
      correct: 1,
    },
  },
  {
    project: 'componer',
    question: {
      id: 'examen-0.espejo-y-giro',
      type: 'vector',
      prompt:
        'Una transformación hace dos pasos seguidos: primero **refleja** el plano respecto del eje $x$, con $F=\\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}$, y después lo **gira** un cuarto de vuelta en sentido antihorario, con $R=\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$. Escribe la matriz de la transformación completa.',
      hints: [
        'La matriz completa es un producto de $R$ y $F$, con la que actúa primero a la derecha.',
        'Sigue a $\\hat{\\imath}$ por el espejo y luego por el giro; después haz lo mismo con $\\hat{\\jmath}$. Sus imágenes son las columnas.',
      ],
      explain:
        'Las columnas de la matriz completa son las imágenes de $\\hat{\\imath}$ y $\\hat{\\jmath}$ después de los dos pasos, en el orden en que se dan. Si inviertes el orden, sale otra matriz.',
      solution:
        '$\\hat{\\imath}=(1, 0)$ queda quieto en el espejo y el giro lo lleva a $(0, 1)$. $\\hat{\\jmath}=(0, 1)$ pasa a $(0, -1)$ en el espejo y el giro lo lleva a $(1, 0)$. La matriz es $RF=\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}$. En el orden contrario saldría $FR=\\begin{pmatrix}0&-1\\\\-1&0\\end{pmatrix}$.',
      shape: [2, 2],
      answer: [0, 1, 1, 0],
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
