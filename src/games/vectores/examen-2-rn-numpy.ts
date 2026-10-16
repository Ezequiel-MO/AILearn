import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 2 para el proyecto «ℝⁿ en NumPy». La pregunta con
 * números variables (el producto escalar en ℝ⁴) la añade otro paso, como entrada `generada`.
 * Ids: `examen-2.<tema>`, únicos en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen2RnNumpy: BankEntry[] = [
  {
    project: 'rn-numpy',
    question: {
      id: 'examen-2.matriz-vector',
      type: 'opcion',
      prompt:
        'La matriz `E` guarda 5000 documentos como filas, cada uno con un embedding de 384 componentes (los de all-MiniLM-L6-v2 tienen 384). La consulta `q` es un vector de 384 componentes. ¿Qué expresión puntúa los 5000 documentos con `q` y qué devuelve?',
      hints: [
        'La puntuación de un documento es el producto escalar de su fila con `q`.',
        'Para multiplicar, el número de columnas del primer factor tiene que coincidir con el de componentes del vector.',
      ],
      explain:
        'Mira qué forma tiene cada factor y qué eje se suma al multiplicar. Una de las expresiones no suma: multiplica componente a componente.',
      solution:
        '`E` tiene forma `(5000, 384)` y `q`, `(384,)`: `E @ q` suma sobre las 384 componentes de cada fila y da `(5000,)`, una puntuación por documento. `q @ E` no se puede calcular, porque las 384 componentes de `q` no casan con las 5000 filas de `E`. `E * q` multiplica componente a componente y devuelve una matriz `(5000, 384)` sin sumar. Y `E.T @ q` tampoco se puede calcular, porque `E.T` tiene forma `(384, 5000)`.',
      options: [
        '`E @ q`: un vector de 5000 puntuaciones, una por documento',
        '`q @ E`: un vector de 384 puntuaciones, una por componente',
        '`E * q`: un vector de 5000 puntuaciones, una por documento',
        '`E.T @ q`: un vector de 5000 puntuaciones, una por documento',
      ],
      correct: 0,
    },
  },
  {
    project: 'rn-numpy',
    question: {
      id: 'examen-2.axis-columnas',
      type: 'vector',
      prompt:
        'Alguien quiere la norma de cada uno de los tres documentos de `E`, cuyas filas son $(3, 2)$, $(0, 3)$ y $(4, 6)$, y escribe `np.linalg.norm(E, axis=0)`. Calcula los números que devuelve en realidad esa llamada, en el orden en que los da.',
      hints: [
        'Con `axis=0` desaparece el eje de las filas: se calcula una norma por cada columna, con los números de esa columna de arriba abajo.',
        'La primera columna de `E` es $(3, 0, 4)$. Calcula su norma y después la de la segunda.',
      ],
      explain:
        'El `axis` indica el eje que se recorre para cada norma. Aquí se recorren los documentos, así que sale una norma por cada componente y no una por cada documento.',
      solution:
        'La primera columna es $(3, 0, 4)$, de norma $\\sqrt{9+0+16}=5$, y la segunda es $(2, 3, 6)$, de norma $\\sqrt{4+9+36}=7$. La llamada devuelve `[5, 7]`: dos números, uno por componente, y no tres. Para la norma de cada documento hacía falta `axis=1`, que da $\\sqrt{13}$, $3$ y $\\sqrt{52}$.',
      answer: [5, 7],
      tol: 0,
    },
  },
  {
    project: 'rn-numpy',
    question: {
      id: 'examen-2.dos-cercanos',
      type: 'codigo',
      prompt:
        'Las filas de `E` son cinco documentos de juguete (inventados y de 2 componentes; los reales tienen cientos) y `q` es la consulta. Guarda en `cerca2` las posiciones de los dos documentos más cercanos a `q` (menor distancia euclídea), del más cercano al más lejano. `E - q` resta `q` a cada fila, `np.linalg.norm(x, axis=1)` da la norma de cada fila y `np.argsort(x)` da las posiciones que ordenan `x` de menor a mayor.',
      hints: [
        'La distancia a cada documento es la norma de cada fila de `E - q`.',
        'Ordena esas distancias con `np.argsort` y quédate con los dos primeros elementos de la lista.',
      ],
      explain:
        'Una distancia pequeña significa un documento cercano, y `np.argsort` ordena de menor a mayor y entrega posiciones. Comprueba que `cerca2` empieza por el documento más cercano.',
      solution:
        'Las distancias a `q` son $2{,}83$, $3{,}16$, $1$, $3{,}61$ y $2$. Ordenadas de menor a mayor, las posiciones son `[2, 4, 0, 1, 3]`, así que `cerca2` vale `[2, 4]`: el documento 2, a distancia $1$, y el 4, a distancia $2$. Se calcula con `np.argsort(np.linalg.norm(E - q, axis=1))[:2]`.',
      starter: `import numpy as np

# Embeddings de juguete: inventados y de 2 componentes, uno por documento
E = np.array([[1, 1], [4, 6], [2, 3], [6, 1], [3, 5]])
q = np.array([3, 3])
# Guarda en cerca2 las posiciones de los dos documentos más cercanos a q, del más cercano al más lejano
cerca2 = None
`,
      checks: `_o = np.asarray(cerca2) if isinstance(cerca2, (np.ndarray, list, tuple)) else None
_ok = _o is not None and _o.shape == (2,) and np.issubdtype(_o.dtype, np.integer)
_fl = _o is not None and _o.shape == (2,) and np.issubdtype(_o.dtype, np.floating)
check(_ok or _fl, "\`cerca2\` tiene que ser un array de NumPy (o una lista) con 2 posiciones, números enteros del 0 al 4.")
check(not _fl, "\`cerca2\` tiene números decimales: parecen distancias y no posiciones. \`np.argsort\` no devuelve los valores ordenados, devuelve las posiciones.")
check((not _ok) or not np.array_equal(_o, [3, 1]), "\`cerca2\` tiene los dos documentos más lejanos de la consulta. Se buscan los de distancia menor, que son los primeros al ordenar de menor a mayor.")
check((not _ok) or not np.array_equal(_o, [4, 2]), "\`cerca2\` tiene los dos documentos buenos pero en orden contrario: tiene que empezar por el más cercano.")
check((not _ok) or not (np.array_equal(_o, [1, 4]) or np.array_equal(_o, [0, 2])), "\`cerca2\` es el resultado de ordenar por producto escalar: un producto escalar grande no quiere decir un documento cercano. Ordena las distancias, es decir, las normas de las filas de \`E - q\`.")
check((not _ok) or np.array_equal(_o, [2, 4]) or np.array_equal(_o, [3, 1]) or np.array_equal(_o, [4, 2]) or np.array_equal(_o, [1, 4]) or np.array_equal(_o, [0, 2]), "\`cerca2\` tiene que ser [2, 4]: las posiciones de los dos documentos a menor distancia de \`q\`, el más cercano primero.")
`,
      reference: `import numpy as np

# Embeddings de juguete: inventados y de 2 componentes, uno por documento
E = np.array([[1, 1], [4, 6], [2, 3], [6, 1], [3, 5]])
q = np.array([3, 3])
cerca2 = np.argsort(np.linalg.norm(E - q, axis=1))[:2]
`,
    },
  },
];
