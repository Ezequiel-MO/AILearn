import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 2 para el proyecto «Normalizar». La entrada
 * generada (el unitario de un vector de R^3) la añade otro paso.
 * Ids: `examen-2.<tema>`, únicos en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen2Normalizar: BankEntry[] = [
  {
    project: 'normalizar',
    question: {
      id: 'examen-2.metricas',
      type: 'opcion',
      prompt:
        'Una base de datos vectorial guarda embeddings normalizados, todos de norma $1$. Para una consulta $\\vec{q}$, el producto interno con tres documentos vale $0{,}9$ con $A$, $0{,}2$ con $B$ y $0{,}7$ con $C$. Ordenados del más cercano al más lejano por distancia euclídea (L2), ¿cuál es el orden?',
      hints: [
        'Para unitarios, $\\lVert\\vec{q}-\\vec{d}\\rVert^2=2-2\\,\\vec{q}\\cdot\\vec{d}$.',
        'Calcula esa expresión con cada documento: cuanto menor sale, más cerca está.',
      ],
      explain:
        'La distancia depende del producto escalar con una fórmula en la que un producto escalar mayor da una distancia menor. Calcula la distancia al cuadrado de cada documento y ordénalas.',
      solution:
        'Las distancias al cuadrado son $2-2\\cdot0{,}9=0{,}2$ para $A$, $2-2\\cdot0{,}7=0{,}6$ para $C$ y $2-2\\cdot0{,}2=1{,}6$ para $B$; es decir, $0{,}45$, $0{,}77$ y $1{,}26$. El orden es $A$, $C$, $B$: el mismo que por producto interno o por coseno, de mayor a menor. Con vectores normalizados las tres métricas ordenan igual.',
      options: [
        '$A$, $C$, $B$',
        '$B$, $C$, $A$',
        '$A$, $B$, $C$',
        'No se puede saber sin conocer las componentes de los vectores',
      ],
      correct: 0,
    },
  },
  {
    project: 'normalizar',
    question: {
      id: 'examen-2.distancia-unitarios',
      type: 'numero',
      prompt:
        'Dos embeddings de norma $1$ forman un ángulo de $120^\\circ$. Calcula la distancia euclídea entre ellos, con los decimales que hagan falta.',
      hints: [
        'Con normas iguales a $1$, el producto escalar es el coseno del ángulo: $\\cos120^\\circ=-0{,}5$.',
        'La distancia al cuadrado es $2-2\\cos\\theta$. Falta la raíz cuadrada.',
      ],
      explain:
        'Con los dos vectores unitarios, la distancia solo depende del ángulo. Calcula el coseno, sustitúyelo en la fórmula de la distancia al cuadrado y no olvides el último paso.',
      solution:
        '$\\cos120^\\circ=-0{,}5$, luego $\\lVert\\vec{a}-\\vec{b}\\rVert^2=2-2\\cos120^\\circ=2+1=3$ y la distancia es $\\sqrt3\\approx1{,}73$. Es mayor que $\\sqrt2\\approx1{,}41$, que es la de dos vectores perpendiculares: al bajar el coseno, la distancia crece.',
      answer: Math.sqrt(3),
      tol: 0.01,
    },
  },
  {
    project: 'normalizar',
    question: {
      id: 'examen-2.filas',
      type: 'codigo',
      prompt:
        'La matriz `M` guarda tres embeddings de juguete (inventados y de 3 dimensiones; los reales tienen cientos), uno por fila. Guarda en `Mn` la matriz `M` con cada fila dividida entre su propia norma, de modo que cada fila mida $1$. `np.linalg.norm(a, axis=1)` calcula la norma de cada fila de `a`.',
      hints: [
        'Para que cada norma caiga sobre su fila, el array de normas tiene que ser una columna de 3 filas y 1 columna.',
        'Pide a `np.linalg.norm` que conserve el eje con `keepdims=True` antes de dividir.',
      ],
      explain:
        'Cada fila se divide entre su propia norma. Si divides entre un array de normas sin más, NumPy lo alinea con las columnas, y como `M` es cuadrada no avisa: sale un resultado incorrecto. Comprueba que cada fila de `Mn` mide $1$.',
      solution:
        'Las normas de las filas son $7$, $9$ y $9$. En código: `Mn = M / np.linalg.norm(M, axis=1, keepdims=True)`. Sin `keepdims=True` el array de tres normas se alinea con las columnas y cada columna se divide entre la norma de una fila distinta. Queda la primera fila $\\left(\\dfrac27,\\ \\dfrac37,\\ \\dfrac67\\right)\\approx(0{,}29;\\ 0{,}43;\\ 0{,}86)$.',
      requirements: [
        '`Mn` existe y es un array de NumPy de números con 3 filas y 3 columnas, como `M`.',
        'Cada fila de `Mn` es la fila de `M` dividida entre su propia norma, así que todas miden 1: no se normalizan las columnas ni se divide toda la matriz entre una sola norma.',
      ],
      starter: `import numpy as np

# Embeddings de juguete (inventados y de 3 dimensiones), uno por fila
M = np.array([[2, 3, 6], [1, 4, 8], [4, 4, 7]])
# Guarda en Mn la matriz M con cada fila dividida entre su norma
Mn = None
`,
      checks: `_M = np.array([[2, 3, 6], [1, 4, 8], [4, 4, 7]])
_mn = isinstance(Mn, np.ndarray) and Mn.shape == (3, 3) and np.issubdtype(Mn.dtype, np.number)
_sin = _mn and np.allclose(Mn, _M)
_pcol = _mn and np.allclose(Mn, _M / np.linalg.norm(_M, axis=1))
_pc0 = _mn and np.allclose(Mn, _M / np.linalg.norm(_M, axis=0, keepdims=True))
_pglob = _mn and np.allclose(Mn, _M / np.linalg.norm(_M))
_bien = _mn and np.allclose(Mn, _M / np.linalg.norm(_M, axis=1, keepdims=True))
check(_mn, "\`Mn\` tiene que ser un array de NumPy de 3 filas y 3 columnas, números: la matriz \`M\` con cada fila dividida entre su norma.")
check(not _sin, "\`Mn\` sigue valiendo lo mismo que \`M\`: falta dividir cada fila entre su norma.")
check(not _pcol, "\`Mn\` divide cada columna entre la norma de una fila distinta: un array de 3 normas, sin más, se alinea con las columnas de \`M\`. Para que cada norma caiga sobre su fila hay que conservar el eje al calcularlas, con \`keepdims=True\`.")
check(not _pc0, "\`Mn\` tiene normalizadas las columnas, no las filas: el embedding de cada documento es una fila.")
check(not _pglob, "\`Mn\` se ha dividido entre una sola norma, la de toda la matriz. Cada fila necesita la suya.")
check((not _mn) or _bien or _sin or _pcol or _pc0 or _pglob, "\`Mn\` tiene que ser \`M\` con cada fila dividida entre su propia norma: la primera fila, (2, 3, 6), pasa a (0,29; 0,43; 0,86), y todas las filas de \`Mn\` miden 1.")
`,
      reference: `import numpy as np

# Embeddings de juguete (inventados y de 3 dimensiones), uno por fila
M = np.array([[2, 3, 6], [1, 4, 8], [4, 4, 7]])
Mn = M / np.linalg.norm(M, axis=1, keepdims=True)
`,
    },
  },
];
