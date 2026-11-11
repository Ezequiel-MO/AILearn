import type { BankEntry } from '../../content/schema';
import { ANIMALES, capaLab } from './datos';

/**
 * Entradas fijas del banco de examen de la Órbita 1 para el proyecto «Rango»: un laboratorio (un
 * cuello de botella para otra neurona, con otros datos), una cuenta de parámetros de una
 * actualización de rango bajo y una de código. La entrada generada (`examen-1.rango`) la añade otro
 * paso. Ids: `examen-1.<tema>`, únicos en todo el juego.
 */
export const examen1Rango: BankEntry[] = [
  {
    project: 'rango',
    question: {
      id: 'examen-1.cuello-mascotas',
      type: 'laboratorio',
      prompt:
        'Seis animales con dos rasgos: **tamaño** y **domesticidad**. La capa tiene que comprimirlos sobre una recta (determinante $0$). La neurona siguiente mira la primera salida y responde «mascota» a lo que cae en la zona sombreada.\n\nAplasta el plano sin que la neurona deje de acertar con los seis.',
      hints: [
        'Busca el rasgo que distingue a «perro» de «lobo»: es el que tiene que sobrevivir en la primera salida.',
        'Lleva $\\hat{\\imath}$ (el tamaño) al origen y deja $\\hat{\\jmath}$ (la domesticidad) apuntando hacia la zona sombreada.',
      ],
      explain:
        'Con determinante $0$, de cada animal queda un solo número a lo largo de una recta. La neurona acierta si ese número tiene el signo de la domesticidad. Si lo que sobrevive es el tamaño, las mascotas y los salvajes se mezclan.',
      solution:
        'Una capa que vale: $\\hat{\\imath}$ en $(0, 0)$ y $\\hat{\\jmath}$ en $(1, 0)$. Cada animal queda en su domesticidad, sobre el eje horizontal: positiva en «gato», «perro» y «hámster» y negativa en «lobo», «tigre» y «oso». También vale $\\hat{\\jmath}$ en $(1, 1)$ con $\\hat{\\imath}$ en el origen. Quedarse con el tamaño deja la neurona en 3 de 6.',
      lab: capaLab(ANIMALES, { readout: { w: [1, 0], b: 0 }, readouts: ['det'] }),
      goals: [
        {
          metric: 'det',
          op: 'eq',
          target: 0,
          label: 'Determinante de la capa',
        },
        {
          metric: 'acc',
          op: 'gte',
          target: 1,
          label: 'Aciertos de la neurona siguiente',
          format: 'percent',
        },
      ],
      solved: { ix: 0, iy: 0, jx: 1, jy: 0 },
    },
  },
  {
    project: 'rango',
    question: {
      id: 'examen-1.parametros-rango-bajo',
      type: 'numero',
      prompt:
        'Para ajustar una capa de $768\\times 768$ sin tocar sus pesos, se le suma un cambio de rango $8$ escrito como $B\\cdot A$, con $B$ de $768\\times 8$ y $A$ de $8\\times 768$. Solo se entrenan $B$ y $A$.\n\n¿Cuántos números se entrenan entre las dos?',
      hints: [
        'Cuenta los números de cada matriz: filas por columnas.',
        'Suma los de $B$ y los de $A$, y compáralos con los de la capa entera.',
      ],
      explain:
        'Un cambio de rango $r$ cabe en dos matrices finas: una con $r$ columnas y otra con $r$ filas. Se entrena eso, no la matriz entera, y el número de parámetros crece con $r$.',
      solution:
        '$B$: $768\\cdot 8=6144$. $A$: $8\\cdot 768=6144$. Entre las dos, $12\\,288$ números, frente a los $589\\,824$ de la capa entera: $48$ veces menos.',
      answer: 12288,
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
