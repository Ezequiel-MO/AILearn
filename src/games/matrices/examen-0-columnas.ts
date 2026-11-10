import type { BankEntry } from '../../content/schema';
import { ANIMALES, capaLab } from './datos';

/**
 * Entradas fijas del banco de examen de la Órbita 0 para el proyecto «Columnas»: un laboratorio (una
 * capa para otra neurona, con otros datos), una cuenta de parámetros y una de código. Las entradas
 * generadas del banco (`examen-0.matriz-vector`, `examen-0.producto-matrices` y
 * `examen-0.forma-producto`) las añade el ensamblado de la órbita. Ids: `examen-0.<tema>`, únicos
 * en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen0Columnas: BankEntry[] = [
  {
    project: 'columnas',
    question: {
      id: 'examen-0.capa-mascotas',
      type: 'laboratorio',
      prompt:
        'Seis animales con dos rasgos: **tamaño** y **domesticidad**. La neurona siguiente solo mira la primera salida de la capa (el eje horizontal) y responde «mascota» a lo que cae en la zona sombreada.\n\nMueve las columnas de la capa hasta que acierte con los seis.',
      hints: [
        'Busca el rasgo que distingue a «perro» de «lobo»: su columna es la que tiene que apuntar hacia la zona sombreada.',
        'Lleva $\\hat{\\jmath}$ (la domesticidad) sobre el eje horizontal, hacia la derecha, y saca $\\hat{\\imath}$ (el tamaño) de ese eje.',
      ],
      explain:
        'La primera salida es el tamaño por la primera coordenada de $\\hat{\\imath}$ más la domesticidad por la primera de $\\hat{\\jmath}$. El tamaño no distingue una mascota de un animal salvaje: la que tiene que pesar en esa salida es la domesticidad.',
      solution:
        'Una capa que vale: $\\hat{\\imath}$ en $(0, 1)$ y $\\hat{\\jmath}$ en $(1, 0)$. La primera salida pasa a ser la domesticidad, positiva en «gato», «perro» y «hámster» y negativa en «lobo», «tigre» y «oso»: la neurona acierta los seis. Valen muchas otras, siempre que en la primera salida la domesticidad pese bastante más que el tamaño.',
      lab: capaLab(ANIMALES, { readout: { w: [1, 0], b: 0 } }),
      goals: [
        {
          metric: 'acc',
          op: 'gte',
          target: 1,
          label: 'Aciertos de la neurona siguiente',
          format: 'percent',
        },
      ],
      solved: { ix: 0, iy: 1, jx: 1, jy: 0 },
    },
  },
  {
    project: 'columnas',
    question: {
      id: 'examen-0.parametros-capa',
      type: 'numero',
      prompt:
        'Una capa convierte embeddings de $384$ números en vectores de $128$. Su matriz de pesos tiene una fila por salida y una columna por entrada, y hay un sesgo por salida.\n\n¿Cuántos parámetros tiene la capa, entre pesos y sesgos?',
      hints: [
        'Los pesos son filas por columnas: una fila por cada salida y una columna por cada entrada.',
        'Los sesgos se cuentan con las salidas, no con las entradas.',
      ],
      explain:
        'Cada salida tiene un peso por cada entrada, y además un sesgo propio. El número de entradas solo cuenta en los pesos.',
      solution:
        'Pesos: $128\\cdot 384=49\\,152$. Sesgos: $128$, uno por salida. En total, $49\\,152+128=49\\,280$ parámetros. Sumar $384$ sesgos sería contar uno por entrada.',
      answer: 49280,
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
      requirements: [
        '`ultima` existe y es un array de NumPy con 2 componentes, las dos números, una por salida.',
        '`ultima` es la última columna de `A`, de arriba abajo, y no su última fila.',
        '`entradas` existe y es un número entero: cuántas características de entrada tiene la capa.',
      ],
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
