import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 1 para el proyecto «Rango». La entrada generada
 * (`examen-1.rango`) la añade otro paso. Ids: `examen-1.<tema>`, únicos en todo el juego.
 */
export const examen1Rango: BankEntry[] = [
  {
    project: 'rango',
    question: {
      id: 'examen-1.rango-producto',
      type: 'opcion',
      prompt:
        'Una matriz $A$ de $6\\times 6$ tiene rango $3$ y otra, $B$, también de $6\\times 6$, tiene rango $5$. ¿Qué se puede asegurar del rango de $AB$?',
      hints: [
        'En $AB\\vec{x}$ actúa primero $B$ y después $A$. ¿Dónde caen todos los resultados?',
        'El rango de una matriz de $6\\times 6$ nunca pasa de $6$.',
      ],
      explain:
        'Lo que sale de $AB$ sale siempre de $A$, y una matriz no puede tener más direcciones de salida que las que tiene su última transformación. Descarta primero lo que supera el tamaño de la matriz.',
      solution:
        'Todo resultado de $AB$ es un resultado de $A$, así que su imagen está dentro de la de $A$ y el rango es $3$ como mucho. Puede ser menor: depende de cuánto de lo que sale de $B$ cae en el núcleo de $A$. Las sumas y los productos de rangos no valen: $8$ y $15$ superan el tamaño $6$.',
      options: [
        'Es $8$, porque los rangos se suman',
        'Es exactamente $3$, el del factor de menor rango',
        'Es $3$ como mucho: el producto no puede tener más rango que el menor de los dos',
        'Es $15$, porque los rangos se multiplican',
      ],
      correct: 2,
    },
  },
  {
    project: 'rango',
    question: {
      id: 'examen-1.nucleo-tres',
      type: 'vector',
      prompt:
        'La matriz $A=\\begin{pmatrix}1&2&3\\\\4&5&6\\\\7&8&9\\end{pmatrix}$ tiene rango $2$, así que su núcleo es una recta de vectores. Escribe el vector $\\vec{v}$ del núcleo, el que cumple $A\\vec{v}=\\vec{0}$, cuya primera componente es $1$.',
      hints: [
        'Con $\\vec{v}=(1, b, c)$, las tres filas de $A\\vec{v}$ tienen que valer $0$. Con dos de ellas ya basta.',
        'Resta a la segunda ecuación cuatro veces la primera para dejar una sola relación entre $b$ y $c$.',
      ],
      explain:
        'Plantea las ecuaciones $A\\vec{v}=\\vec{0}$ fila a fila. Como el rango es $2$, una de las tres filas sobra, y con la primera componente fijada las otras dos determinan el vector.',
      solution:
        'Las dos primeras filas dan $1+2b+3c=0$ y $4+5b+6c=0$. Restando a la segunda cuatro veces la primera queda $-3b-6c=0$, o sea $b=-2c$. Entonces $1-4c+3c=0$ y $c=1$, así que $\\vec{v}=(1, -2, 1)$. La tercera fila también se anula: $7-16+9=0$.',
      answer: [1, -2, 1],
      tol: 0,
    },
  },
  {
    project: 'rango',
    question: {
      id: 'examen-1.columna-redundante',
      type: 'codigo',
      prompt:
        'Una característica nueva que se calcula con otras no añade información. Ya tienes `X`, con 4 muestras y 2 características. Guarda en `X2` la matriz que añade a `X` una tercera columna igual a 2 veces la primera menos la segunda, en `r0` el rango de `X` y en `r1` el de `X2`.',
      hints: [
        '`np.column_stack([X, c])` pega una columna `c` a la derecha de `X`.',
        'La columna nueva se calcula con `X[:, 0]` y `X[:, 1]`, que son la primera y la segunda columna.',
      ],
      explain:
        'La columna nueva es una combinación de las dos que ya había, así que no aporta una dirección nueva. Si el rango de `X2` te sale más alto que el de `X`, la columna nueva no se ha calculado con las otras.',
      solution:
        'Se escribe `X2 = np.column_stack([X, 2 * X[:, 0] - X[:, 1]])`, `r0 = np.linalg.matrix_rank(X)` y `r1 = np.linalg.matrix_rank(X2)`. Los dos rangos valen $2$: la columna añadida es $(2, -1, 1, 3)$ y no abre una dirección nueva. Una característica redundante agranda la matriz, pero no su rango.',
      requirements: [
        '`X2` es un array de NumPy de 4 filas y 3 columnas de números: las dos columnas de `X`, sin cambiarlas, y la columna nueva del enunciado al final.',
        '`r0` y `r1` son números enteros: el rango de `X` y el de `X2`.',
      ],
      starter: `import numpy as np

X = np.array([[1, 0], [0, 1], [1, 1], [2, 1]])
# Guarda en X2 la matriz X con una tercera columna: 2 veces la primera menos la segunda
# Guarda en r0 el rango de X y en r1 el de X2
X2 = None
r0 = None
r1 = None
`,
      checks: `def _int(n):
    return isinstance(n, (int, np.integer)) and not isinstance(n, bool)

_arr = isinstance(X2, np.ndarray) and np.issubdtype(X2.dtype, np.number)
_x = _arr and X2.shape == (4, 3)
_a = _int(r0)
_b = _int(r1)
check(_arr, "\`X2\` tiene que ser un array de NumPy con números: \`X\` con una columna más.")
check((not _arr) or X2.shape == (4, 3), "\`X2\` tiene que tener 4 filas y 3 columnas: las de \`X\` más una columna nueva.")
check((not _x) or np.allclose(X2[:, :2], X), "\`X2\` tiene que empezar con las dos columnas de \`X\`, sin cambiarlas.")
check((not _x) or np.allclose(X2[:, 2], [2, -1, 1, 3]), "La tercera columna de \`X2\` tiene que valer (2, -1, 1, 3): 2 veces la primera columna de \`X\` menos la segunda.")
check(_a, "\`r0\` tiene que ser un número entero: el rango de \`X\`.")
check((not _a) or r0 == 2, "\`r0\` tiene que valer 2: las dos columnas de \`X\` son independientes.")
check(_b, "\`r1\` tiene que ser un número entero: el rango de \`X2\`.")
check((not _b) or r1 == 2, "\`r1\` tiene que valer 2: la columna nueva se calcula con las otras dos y no aporta una dirección nueva.")
`,
      reference:
        'import numpy as np\n\nX = np.array([[1, 0], [0, 1], [1, 1], [2, 1]])\nX2 = np.column_stack([X, 2 * X[:, 0] - X[:, 1]])\nr0 = np.linalg.matrix_rank(X)\nr1 = np.linalg.matrix_rank(X2)\n',
    },
  },
];
