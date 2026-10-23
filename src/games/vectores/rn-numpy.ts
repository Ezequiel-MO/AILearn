import type { PlaneSpec, PlaneVector, Project } from '../../content/schema';
import { rnNumpyWarmup } from './rn-numpy.calentamiento';
import { toy } from './toy';

/** Plano del proyecto: rango 6 y rejilla de 1 en 1, salvo que se diga otra cosa. */
const plane = (
  vectors: PlaneVector[],
  readouts: PlaneSpec['readouts'],
  pair?: [string, string],
  range = 6,
  snap = 1,
): PlaneSpec => ({ range, snap, vectors, readouts, ...(pair ? { pair } : {}) });

/** Un vector del plano, móvil o fijo. */
const arrow = (
  id: string,
  [x, y]: readonly [number, number],
  movable: boolean,
  label: string = id,
): PlaneVector => ({ id, label, x, y, movable });

/** Primer proyecto de la Órbita 2: de ℝ² a ℝⁿ, y de un vector a una matriz de vectores con NumPy. */
export const rnNumpy: Project = {
  id: 'rn-numpy',
  name: 'ℝⁿ en NumPy',
  sub: 'Muchos vectores a la vez',
  warmup: rnNumpyWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'rn-numpy.ex00.1',
          type: 'manipular',
          prompt:
            'Un vector de $\\mathbb{R}^n$ es una lista de $n$ números; el plano es $\\mathbb{R}^2$. Aquí lo usas como una ventana para ver lo que NumPy hace con muchos vectores a la vez. Una **matriz** $E$ cuyas filas son vectores se multiplica por un vector $\\vec{q}$ con `E @ q`, y el resultado tiene un número por fila: el producto escalar de esa fila con $\\vec{q}$.\n\nTe dan dos filas fijas, $\\vec{a}=(2, 1)$ y $\\vec{b}=(1, 3)$, de modo que $E\\vec{q}=(\\vec{a}\\cdot\\vec{q},\\ \\vec{b}\\cdot\\vec{q})$. Coloca $\\vec{q}$ para que $E\\vec{q}=(7, 11)$. La lectura del producto escalar compara $\\vec{q}$ con $\\vec{a}$, la primera entrada; la segunda, $\\vec{b}\\cdot\\vec{q}$, la calculas con las componentes.',
          hints: [
            'La primera entrada pide $2q_1+q_2=7$: lee el producto escalar con $\\vec{a}$ mientras mueves la punta.',
            'La segunda entrada pide $q_1+3q_2=11$. Entre las posiciones que cumplen la primera, busca la que cumple también esa.',
          ],
          explain:
            'Cada entrada de $E\\vec{q}$ es una condición sobre $\\vec{q}$: con una sola hay toda una recta de soluciones, y las dos juntas se cortan en un punto. Eso es lo que hace `E @ q`: todos los productos escalares de una vez.',
          solution:
            '$\\vec{q}=(2, 3)$: $\\vec{a}\\cdot\\vec{q}=2\\cdot2+1\\cdot3=7$ y $\\vec{b}\\cdot\\vec{q}=1\\cdot2+3\\cdot3=11$. En NumPy, `E = np.array([[2, 1], [1, 3]])` y `q = np.array([2, 3])` dan `E @ q` igual a `[7, 11]`.',
          plane: plane(
            [arrow('a', [2, 1], false), arrow('b', [1, 3], false), arrow('q', [1, 1], true)],
            ['components', 'dot'],
            ['q', 'a'],
          ),
          goals: [
            { metric: 'dot', of: ['q', 'a'], target: 7, tol: 0.01 },
            { metric: 'dot', of: ['q', 'b'], target: 11, tol: 0.01 },
          ],
        },
        {
          id: 'rn-numpy.ex00.2',
          type: 'manipular',
          prompt:
            'Una puntuación de $0$ entre una fila y la consulta quiere decir que el producto escalar es nulo, es decir, que son perpendiculares: ese documento no tiene nada en común con la consulta. Las filas de $E$ son $\\vec{a}=(3, 1)$ y $\\vec{b}=(1, 2)$, fijas. Coloca $\\vec{q}$ para que $E\\vec{q}=(0, 5)$: perpendicular a $\\vec{a}$ y con producto escalar $5$ con $\\vec{b}$. La lectura compara $\\vec{q}$ con $\\vec{a}$.',
          hints: [
            'Un producto escalar de $0$ con $\\vec{a}$ es $3q_1+q_2=0$: $\\vec{q}$ está en la recta perpendicular a $\\vec{a}$. La lectura del ángulo tiene que marcar $90^\\circ$.',
            'Recorre esa recta hasta que $q_1+2q_2$ valga $5$.',
          ],
          explain:
            'La condición con $\\vec{a}$ deja toda una recta de posiciones, todas perpendiculares a $\\vec{a}$; la condición con $\\vec{b}$ elige un punto de esa recta.',
          solution:
            '$\\vec{q}=(-1, 3)$: $\\vec{a}\\cdot\\vec{q}=3\\cdot(-1)+1\\cdot3=0$ y $\\vec{b}\\cdot\\vec{q}=1\\cdot(-1)+2\\cdot3=5$. Un documento con puntuación $0$ no aporta nada a la búsqueda; uno con puntuación negativa quedaría todavía por debajo.',
          plane: plane(
            [arrow('a', [3, 1], false), arrow('b', [1, 2], false), arrow('q', [1, 1], true)],
            ['components', 'dot', 'angle'],
            ['q', 'a'],
          ),
          goals: [
            { metric: 'dot', of: ['q', 'a'], target: 0, tol: 0.01 },
            { metric: 'dot', of: ['q', 'b'], target: 5, tol: 0.01 },
          ],
        },
        {
          id: 'rn-numpy.ex00.3',
          type: 'manipular',
          prompt:
            'En $\\mathbb{R}^n$ la norma sigue siendo Pitágoras, con un término por componente: $\\lVert\\vec{v}\\rVert=\\sqrt{v_1^2+\\dots+v_n^2}$ (aquí, $n=2$). NumPy calcula la norma de **cada fila** de $E$ de una vez, con `np.linalg.norm(E, axis=1)`. La consulta $\\vec{q}=(1, 1)$ está fija y la fila $\\vec{d}$ es la que mueves: una fila nueva de $E$. Colócala de modo que mida $5$ y puntúe $7$ con $\\vec{q}$.',
          hints: [
            'Puntuar $7$ con $\\vec{q}=(1, 1)$ quiere decir $d_1+d_2=7$: la fila está sobre una recta.',
            'Sobre esa recta, busca la posición cuya norma vale $5$. Piensa en la terna $3, 4, 5$.',
          ],
          explain:
            'Dos condiciones sobre una fila: la norma la sitúa en una circunferencia alrededor del origen, y el producto escalar con $\\vec{q}$, en una recta. La fila está donde se cortan, y pueden ser dos puntos.',
          solution:
            '$\\vec{d}=(3, 4)$: $\\lVert\\vec{d}\\rVert=\\sqrt{9+16}=5$ y $\\vec{d}\\cdot\\vec{q}=3+4=7$. También sirve $(4, 3)$, el otro punto donde la recta corta la circunferencia.',
          plane: plane(
            [arrow('q', [1, 1], false), arrow('d', [1, 1], true)],
            ['components', 'norm', 'dot'],
            ['q', 'd'],
          ),
          goals: [
            { metric: 'norm', of: ['d'], target: 5, tol: 0.01 },
            { metric: 'dot', of: ['q', 'd'], target: 7, tol: 0.01 },
          ],
        },
        {
          id: 'rn-numpy.ex00.4',
          type: 'manipular',
          prompt:
            'Para saber a qué distancia está la consulta de **todas** las filas de $E$, NumPy resta $\\vec{q}$ a cada fila con `E - q` (se llama *broadcasting*: `q` se aplica a todas las filas) y la norma de cada fila resultante es la distancia, con la misma fórmula de Pitágoras. Las filas $\\vec{a}=(1, 2)$ y $\\vec{b}=(7, 2)$ están fijas. Coloca $\\vec{q}$ a distancia $5$ de las dos. La lectura de la distancia es la de $\\vec{q}$ a $\\vec{a}$; la de $\\vec{b}$ la calculas con las componentes. El plano de este ejercicio llega hasta $8$.',
          hints: [
            'Si $\\vec{q}$ está a la misma distancia de $\\vec{a}$ y de $\\vec{b}$, que están a la misma altura, queda sobre la vertical de su punto medio.',
            'Coloca $q_1$ sobre esa vertical y mueve $q_2$ hasta que la distancia a $\\vec{a}$ valga $5$.',
          ],
          explain:
            'Las posiciones a distancia $5$ de una fila forman una circunferencia. Con dos filas hay dos circunferencias, y la solución está donde se cortan.',
          solution:
            '$\\vec{q}=(4, -2)$: $\\vec{q}-\\vec{a}=(3, -4)$ y $\\vec{q}-\\vec{b}=(-3, -4)$, y las dos normas valen $\\sqrt{9+16}=5$. También sirve $(4, 6)$, el otro punto de corte. En NumPy, `np.linalg.norm(E - q, axis=1)` da `[5, 5]`.',
          plane: plane(
            [arrow('a', [1, 2], false), arrow('b', [7, 2], false), arrow('q', [0, 0], true)],
            ['components', 'distance'],
            ['q', 'a'],
            8,
            1,
          ),
          goals: [
            { metric: 'distance', of: ['q', 'a'], target: 5, tol: 0.01 },
            { metric: 'distance', of: ['q', 'b'], target: 5, tol: 0.01 },
          ],
        },
        {
          id: 'rn-numpy.ex00.5',
          type: 'manipular',
          prompt:
            'Este mapa es un juguete **inventado** de dos dimensiones, para poder dibujarlo: los embeddings reales tienen cientos de dimensiones. Una base de datos vectorial guarda los embeddings de sus documentos como las filas de una matriz $E$ y puntúa **todos** a la vez con `E @ q`: un número por documento, y el de mayor puntuación es el que devuelve la búsqueda.\n\nLas filas de $E$ son «gato» $(3, 4)$, «lobo» $(4, -2)$ y «coche» $(-3, 2)$, fijas. Coloca la consulta $\\vec{q}$ para que «gato» puntúe $9$ y «lobo» $12$. La lectura compara $\\vec{q}$ con «gato»; el resto lo calculas con las componentes.',
          hints: [
            'Cada puntuación es un producto escalar de $\\vec{q}$ con una fila: para «gato», $3q_1+4q_2=9$.',
            'Escribe también la condición de «lobo», $4q_1-2q_2=12$, y busca la posición que cumple las dos.',
          ],
          explain:
            'Cada documento aporta una condición sobre $\\vec{q}$, y dos condiciones independientes fijan la consulta. La puntuación de «coche» no la has elegido: sale de la posición que encuentres.',
          solution:
            '$\\vec{q}=(3, 0)$ da $E\\vec{q}=(3\\cdot3,\\ 4\\cdot3,\\ -3\\cdot3)=(9, 12, -9)$. Gana «lobo» con $12$, después va «gato» con $9$, y «coche» queda el último con $-9$: apunta hacia el lado contrario de la consulta.',
          plane: plane(
            [
              arrow('gato', toy['gato']!, false),
              arrow('lobo', toy['lobo']!, false),
              arrow('coche', toy['coche']!, false),
              arrow('q', [1, 1], true),
            ],
            ['components', 'dot'],
            ['q', 'gato'],
          ),
          goals: [
            { metric: 'dot', of: ['q', 'gato'], target: 9, tol: 0.01 },
            { metric: 'dot', of: ['q', 'lobo'], target: 12, tol: 0.01 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'rn-numpy.ex01.1',
          type: 'numero',
          prompt:
            'En $\\mathbb{R}^3$ el vector $\\vec{v}=(v_1, v_2, v_3)$ tiene tres componentes y su norma sigue siendo Pitágoras, con un término por componente: $\\lVert\\vec{v}\\rVert=\\sqrt{v_1^2+v_2^2+v_3^2}$. Es el teorema aplicado dos veces: la diagonal de una caja con aristas $v_1$, $v_2$ y $v_3$. En $\\mathbb{R}^n$ la fórmula tiene $n$ términos. Calcula la norma de $\\vec{v}=(2, 3, 6)$.',
          hints: [
            'Suma los cuadrados de las tres componentes, no las componentes.',
            'La suma de los cuadrados es un cuadrado perfecto: busca su raíz.',
          ],
          explain:
            'La norma es la raíz cuadrada de la suma de los cuadrados de todas las componentes. Dos errores típicos son sumar las componentes sin elevarlas al cuadrado y olvidar la raíz.',
          solution: '$\\lVert\\vec{v}\\rVert=\\sqrt{2^2+3^2+6^2}=\\sqrt{4+9+36}=\\sqrt{49}=7$.',
          answer: 7,
          tol: 0,
        },
        {
          id: 'rn-numpy.ex01.2',
          type: 'numero',
          prompt:
            'La distancia entre dos vectores es la norma de su diferencia, $d(\\vec{a},\\vec{b})=\\lVert\\vec{a}-\\vec{b}\\rVert$, y se calcula igual en cualquier $\\mathbb{R}^n$: restas componente a componente, elevas al cuadrado, sumas y haces la raíz. Calcula la distancia entre $\\vec{a}=(2, 5, 1, 3)$ y $\\vec{b}=(1, 3, 3, 3)$ en $\\mathbb{R}^4$.',
          hints: [
            'Empieza por la diferencia, componente a componente: tiene cuatro componentes.',
            'Una componente de la diferencia vale cero: no aporta nada a la suma, pero sigue siendo una componente.',
          ],
          explain:
            'La distancia es la norma de $\\vec{a}-\\vec{b}$, con un término por cada una de las cuatro componentes. Cuida los signos de la diferencia: al elevar al cuadrado dejan de importar.',
          solution:
            '$\\vec{a}-\\vec{b}=(1, 2, -2, 0)$, así que $d=\\sqrt{1^2+2^2+(-2)^2+0^2}=\\sqrt{1+4+4+0}=\\sqrt{9}=3$.',
          answer: 3,
          tol: 0,
        },
        {
          id: 'rn-numpy.ex01.3',
          type: 'opcion',
          prompt:
            'Una colección de 4 documentos se guarda en la matriz `E`: una fila por documento y 3 componentes por fila (embeddings de juguete, inventados; los reales tienen cientos). `q` es una consulta con 3 componentes. La forma de un array, su `.shape`, es una tupla con el tamaño de cada eje: para una matriz, `(filas, columnas)`. ¿Qué formas tienen `E`, `q` y el resultado de `E @ q`?',
          hints: [
            'Hay una fila por documento: cuenta cuántas filas y cuántas columnas tiene `E`.',
            'En `E @ q` se suma sobre las 3 componentes de cada fila. El resultado tiene un número por cada fila de `E`.',
          ],
          explain:
            'La forma `(filas, columnas)` de `E` sale de contar documentos y componentes. En el producto con `q`, el eje de las componentes desaparece porque se suma. Comprueba qué eje queda.',
          solution:
            '`E` tiene 4 filas y 3 columnas: `(4, 3)`. `q` es un vector de 3 números, con un solo eje: `(3,)`. En `E @ q` cada fila se multiplica por `q` componente a componente y se suma, así que el eje de tamaño 3 desaparece y queda un número por documento: `(4,)`. Para poder multiplicar, el número de columnas de `E` tiene que coincidir con el de componentes de `q`.',
          options: [
            '`E.shape` es `(4, 3)`; `q.shape`, `(3,)`; `(E @ q).shape`, `(4,)`',
            '`E.shape` es `(3, 4)`; `q.shape`, `(3,)`; `(E @ q).shape`, `(4,)`',
            '`E.shape` es `(4, 3)`; `q.shape`, `(3,)`; `(E @ q).shape`, `(3,)`',
            '`E.shape` es `(4, 3)`; `q.shape`, `(3,)`; `(E @ q).shape`, `(4, 3)`',
          ],
          correct: 0,
        },
        {
          id: 'rn-numpy.ex01.4',
          type: 'opcion',
          prompt:
            'Los documentos de juguete (inventados y de 2 componentes; los reales tienen cientos) son las filas de `E`: $(3, 4)$, $(5, 12)$ y $(8, 15)$. En `np.linalg.norm(E, axis=k)`, el `axis` es el eje que se recorre para calcular cada norma, y ese eje desaparece del resultado. Con `axis=1` y con `axis=0` salen resultados distintos. ¿Qué devuelve cada llamada?',
          hints: [
            'Calcula a mano la norma de la primera fila, $(3, 4)$, y mira si aparece en alguna opción.',
            'Con `axis=1` desaparece el eje de las columnas y queda un valor por cada fila. Con `axis=0` desaparece el de las filas.',
          ],
          explain:
            'El `axis` es el eje que se recorre para cada norma y que no aparece en el resultado. Fíjate en qué eje queda y cuántos números tiene, y comprueba con la primera fila.',
          solution:
            'Con `axis=1` se recorren las columnas de cada fila: $\\sqrt{3^2+4^2}=5$, $\\sqrt{5^2+12^2}=13$ y $\\sqrt{8^2+15^2}=17$, es decir, `[5, 13, 17]`, una norma por documento. Con `axis=0` se recorren las filas de cada columna: hay dos columnas, así que salen dos números, $\\sqrt{3^2+5^2+8^2}=\\sqrt{98}\\approx9{,}90$ y $\\sqrt{4^2+12^2+15^2}=\\sqrt{385}\\approx19{,}62$, que no son la longitud de ningún documento. Para la norma de cada documento se usa `axis=1`.',
          options: [
            '`axis=1` da `[5, 13, 17]`, una norma por fila; `axis=0` da dos números, una norma por columna',
            '`axis=1` da dos números, una norma por columna; `axis=0` da `[5, 13, 17]`, una norma por fila',
            'Las dos llamadas dan `[5, 13, 17]`: el `axis` solo cambia el orden de los cálculos',
            '`axis=1` da un único número, la norma de la matriz entera; `axis=0` da `[5, 13, 17]`',
          ],
          correct: 0,
        },
        {
          id: 'rn-numpy.ex01.5',
          type: 'vector',
          prompt:
            'Una base de datos vectorial de juguete (inventada, con 4 componentes por documento; los embeddings reales tienen cientos) guarda tres documentos como filas de `E`: $(1, 0, 2, 1)$, $(0, 3, 1, 1)$ y $(2, 1, 0, 2)$. La consulta es $\\vec{q}=(2, 1, -1, 1)$. Calcula `E @ q`: escribe los tres números, uno por documento y en el orden de las filas. El documento de mayor puntuación es el primero que devuelve la búsqueda.',
          hints: [
            'Cada número es el producto escalar de una fila con $\\vec{q}$: multiplica componente a componente y suma, cuidando el signo de la tercera componente.',
            'Calcula las tres filas por separado y escríbelas en el orden de `E`.',
          ],
          explain:
            'Cada documento da un producto escalar con la consulta, y los tres juntos forman el resultado. Los errores típicos son sumar sin multiplicar y descuidar el $-1$ de la consulta.',
          solution:
            '$1\\cdot2+0\\cdot1+2\\cdot(-1)+1\\cdot1=1$, $0\\cdot2+3\\cdot1+1\\cdot(-1)+1\\cdot1=3$ y $2\\cdot2+1\\cdot1+0\\cdot(-1)+2\\cdot1=7$. Así, `E @ q` da $(1, 3, 7)$ y la búsqueda devuelve primero el tercer documento. Con embeddings de 1536 componentes, como los de `text-embedding-3-small` de OpenAI, el cálculo es el mismo: `E` tendría una columna por componente.',
          answer: [1, 3, 7],
          tol: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'rn-numpy.ex02.1',
          type: 'codigo',
          prompt:
            'Una matriz de NumPy se construye con una lista de listas: `np.array([[1, 2], [3, 4]])` tiene dos filas y dos columnas, y su atributo `.shape` es la tupla `(2, 2)`, es decir, `(filas, columnas)`. Si ya tienes los vectores como arrays, `np.array([u, v])` los apila: `u` es la primera fila y `v` la segunda. Una base de datos vectorial guarda así sus embeddings: una fila por documento.\n\nYa tienes tres documentos de juguete, inventados y de 4 componentes (los embeddings reales tienen cientos): `a`, `b` y `c`. Guarda en `E` la matriz que los tiene como filas y en `forma` su `.shape`.',
          hints: [
            'Hace falta una sola llamada a `np.array` con los tres vectores dentro de una lista, para que cada uno quede como una fila.',
            'Comprueba el `.shape` de lo que construyes: tiene que ser una fila por documento, no una sola fila larga. `forma` es un atributo de `E`.',
          ],
          explain:
            'Cada documento tiene que quedar en su propia fila: la matriz tiene tantas filas como documentos y tantas columnas como componentes. Si el `.shape` no coincide con esas cuentas, mira cómo se han agrupado los vectores.',
          solution:
            '`E = np.array([a, b, c])` apila los tres vectores como filas: tres documentos y cuatro componentes, así que `forma = E.shape` vale `(3, 4)`. Si en vez de apilarlos los pegaras uno tras otro con `np.concatenate`, saldría un solo vector de 12 números, de `.shape` `(12,)`.',
          requirements: [
            '`E` existe y es una matriz de NumPy de números, con una fila por documento y los documentos en el orden `a`, `b`, `c`.',
            '`forma` es una tupla (o una lista) de dos números enteros: las filas y las columnas de `E`.',
          ],
          starter: `import numpy as np

# Embeddings de juguete (inventados y de 4 componentes), uno por documento
a = np.array([1, 0, 2, 1])
b = np.array([0, 3, 1, 1])
c = np.array([2, 1, 0, 2])
# Guarda en E la matriz que tiene a, b y c como filas, y en forma su .shape
E = None
forma = None
`,
          checks: `_exp = np.array([[1, 0, 2, 1], [0, 3, 1, 1], [2, 1, 0, 2]])
_arr = isinstance(E, np.ndarray) and np.issubdtype(E.dtype, np.number)
_f = isinstance(forma, (tuple, list)) and all(isinstance(x, (int, np.integer)) and not isinstance(x, bool) for x in forma)
check(_arr, "\`E\` tiene que ser un array de NumPy con números: la matriz que tiene \`a\`, \`b\` y \`c\` como filas.")
check((not _arr) or E.shape != (12,), "\`E\` es un solo vector de 12 números: los tres vectores se han pegado uno detrás de otro. Para que cada uno sea una fila hay que apilarlos, por ejemplo metiéndolos en una lista dentro de \`np.array\`.")
check((not _arr) or E.shape != (4, 3), "\`E\` tiene 4 filas y 3 columnas: está traspuesta. Cada documento tiene que ser una fila, y aquí cada documento es una columna.")
check((not _arr) or E.shape in ((12,), (4, 3)) or np.array_equal(E, _exp), "\`E\` tiene que tener \`a\` como primera fila, \`b\` como segunda y \`c\` como tercera.")
check(_f, "\`forma\` tiene que ser la tupla con el número de filas y de columnas de \`E\`, que se lee con \`.shape\`.")
check((not _f) or tuple(forma) == (3, 4), "\`forma\` tiene que valer (3, 4): tres filas, una por documento, y cuatro columnas, una por componente.")
`,
          reference: `import numpy as np

# Embeddings de juguete (inventados y de 4 componentes), uno por documento
a = np.array([1, 0, 2, 1])
b = np.array([0, 3, 1, 1])
c = np.array([2, 1, 0, 2])
E = np.array([a, b, c])
forma = E.shape
`,
        },
        {
          id: 'rn-numpy.ex02.2',
          type: 'codigo',
          prompt:
            'Puntuar los documentos con una consulta es calcular un producto escalar por fila. `E @ q` los calcula todos a la vez y devuelve un número por fila. Para saber **qué documento** puntúa más, `np.argmax(x)` devuelve la posición del valor mayor de `x`, no el valor: con `x = np.array([5, 9, 2])` da `1`.\n\nYa tienes `E`, cuyas filas son cuatro documentos de juguete (inventados y de 3 componentes; los reales tienen cientos), y la consulta `q`. Guarda en `punt` la puntuación de cada documento con `q` y en `mejor` la posición del documento que más puntúa.',
          hints: [
            'El resultado de `E @ q` tiene un número por documento: son cuatro puntuaciones.',
            'Para la posición del documento que más puntúa necesitas una función que devuelva la posición del mayor, no el valor mayor.',
          ],
          explain:
            'La puntuación de un documento es el producto escalar de su fila con `q`, y `E @ q` junta las de todas las filas. Que el valor mayor sea el que gana no significa que `mejor` sea ese valor: es la posición en la que está.',
          solution:
            '`punt = E @ q` da `[5, 10, 8, 4]`: por ejemplo, la segunda fila vale $0\\cdot1+3\\cdot3+1\\cdot1=10$. La mayor puntuación es $10$, que está en la posición `1`, así que `mejor = np.argmax(punt)` vale `1`. Es el documento que devolvería la búsqueda.',
          requirements: [
            '`punt` existe y es un array de NumPy de números, una sola lista con una puntuación por documento, no una matriz.',
            'Cada puntuación es el producto escalar de la fila del documento con `q`, en el orden de las filas de `E`.',
            '`mejor` es un número entero: la posición del documento que más puntúa, contando desde 0, no su puntuación.',
          ],
          starter: `import numpy as np

# Embeddings de juguete (inventados y de 3 componentes), uno por documento
E = np.array([[2, 1, 0], [0, 3, 1], [1, 1, 4], [3, 0, 1]])
q = np.array([1, 3, 1])
# Guarda en punt la puntuación de cada documento con q, y en mejor la posición del documento que más puntúa
punt = None
mejor = None
`,
          checks: `_p = isinstance(punt, np.ndarray) and np.issubdtype(punt.dtype, np.number)
_ok = _p and punt.shape == (4,)
_m = isinstance(mejor, (int, np.integer)) and not isinstance(mejor, bool)
check(_p, "\`punt\` tiene que ser un array de NumPy con números: una puntuación por documento.")
check((not _p) or punt.shape != (4, 3), "\`punt\` es una matriz de 4 filas y 3 columnas: \`E * q\` multiplica componente a componente y no suma. El producto escalar de cada fila con \`q\` se calcula con \`E @ q\`.")
check((not _p) or punt.shape == (4, 3) or punt.shape == (4,), "\`punt\` tiene que tener 4 números, uno por documento.")
check((not _ok) or np.allclose(punt, [5, 10, 8, 4]), "\`punt\` tiene que valer (5, 10, 8, 4): el producto escalar de cada fila de \`E\` con \`q\`.")
check(_m, "\`mejor\` tiene que ser un número entero: la posición del documento que más puntúa.")
check((not _m) or mejor != 10, "\`mejor\` vale 10: es la puntuación más alta, no el documento que la tiene. Hace falta la posición de ese valor en \`punt\`, que da \`np.argmax\`.")
check((not _m) or mejor != 3, "\`mejor\` vale 3: es el documento que menos puntúa. La posición del valor mayor la da \`np.argmax\`; \`np.argmin\` da la del menor.")
check((not _m) or mejor in (10, 3) or mejor == 1, "\`mejor\` tiene que ser la posición del documento con la puntuación más alta, contando desde 0.")
`,
          reference: `import numpy as np

# Embeddings de juguete (inventados y de 3 componentes), uno por documento
E = np.array([[2, 1, 0], [0, 3, 1], [1, 1, 4], [3, 0, 1]])
q = np.array([1, 3, 1])
punt = E @ q
mejor = np.argmax(punt)
`,
        },
        {
          id: 'rn-numpy.ex02.3',
          type: 'codigo',
          prompt:
            'La norma de un vector de $\\mathbb{R}^n$ es $\\sqrt{x_1^2+\\dots+x_n^2}$, y `np.linalg.norm(v)` la calcula para un vector. Para una matriz, `np.linalg.norm(E, axis=1)` calcula la norma de **cada fila** de una vez: el `axis` es el eje que se recorre para cada norma y desaparece del resultado. Con `axis=0` saldría una norma por columna, que aquí no interesa.\n\nYa tienes `E`, cuyas filas son cuatro documentos de juguete (inventados y de 3 componentes; los reales tienen cientos). Guarda en `normas` la norma de cada documento y en `larga` la posición del documento de mayor norma.',
          hints: [
            'Hay una norma por documento, así que `normas` tiene cuatro números: ni uno solo ni uno por columna.',
            'Para `larga` hace falta la posición del valor mayor, no el valor.',
          ],
          explain:
            'Las normas de las cuatro filas van juntas en un array. Si te sale un solo número, o tres, el `axis` no recorre lo que debe. Después, `larga` es una posición, no una norma.',
          solution:
            'Las normas son $\\sqrt{9+16+0}=5$, $\\sqrt{1+4+4}=3$, $\\sqrt{4+9+36}=7$ y $\\sqrt{0+0+1}=1$. Con `normas = np.linalg.norm(E, axis=1)` salen `[5, 3, 7, 1]`, y la mayor está en la posición `2`, así que `larga = np.argmax(normas)` vale `2`. Con `axis=0` saldrían tres números, uno por columna.',
          requirements: [
            '`normas` existe y es un array de NumPy de números con una norma por documento, en el orden de las filas de `E`: ni un solo número para toda la matriz ni una norma por columna.',
            '`larga` es un número entero: la posición del documento de mayor norma, contando desde 0, no la norma.',
          ],
          starter: `import numpy as np

# Embeddings de juguete (inventados y de 3 componentes), uno por documento
E = np.array([[3, 4, 0], [1, 2, 2], [2, 3, 6], [0, 0, 1]])
# Guarda en normas la norma de cada documento, y en larga la posición del documento de mayor norma
normas = None
larga = None
`,
          checks: `_n = isinstance(normas, (np.ndarray, np.generic)) and np.issubdtype(normas.dtype, np.number)
_l = isinstance(larga, (int, np.integer)) and not isinstance(larga, bool)
check(_n, "\`normas\` tiene que ser un array de NumPy con números: la norma de cada documento.")
check((not _n) or normas.ndim != 0, "\`normas\` es un único número: la norma de la matriz entera. Falta indicar con \`axis\` sobre qué eje se calcula cada norma, para que haya una por documento.")
check((not _n) or normas.shape != (3,), "\`normas\` tiene 3 números: son las longitudes de las columnas, una por componente. Hace falta una por fila, que es una por documento: cambia el valor de \`axis\`.")
check((not _n) or normas.shape != (4, 3), "\`normas\` es una matriz de 4 filas y 3 columnas, y no una norma por documento. Las componentes de cada fila hay que combinarlas en un solo número con la fórmula de Pitágoras.")
check((not _n) or normas.shape in ((), (3,), (4, 3)) or (normas.shape == (4,) and np.allclose(normas, [5, 3, 7, 1])), "\`normas\` tiene que valer (5, 3, 7, 1): la raíz de la suma de los cuadrados de las componentes de cada fila.")
check(_l, "\`larga\` tiene que ser un número entero: la posición del documento de mayor norma.")
check((not _l) or larga != 7, "\`larga\` vale 7: es la norma mayor, no la posición del documento que la tiene. Hace falta la posición de ese valor, que da \`np.argmax\`.")
check((not _l) or larga == 7 or larga == 2, "\`larga\` tiene que ser la posición del documento de mayor norma, contando desde 0.")
`,
          reference: `import numpy as np

# Embeddings de juguete (inventados y de 3 componentes), uno por documento
E = np.array([[3, 4, 0], [1, 2, 2], [2, 3, 6], [0, 0, 1]])
normas = np.linalg.norm(E, axis=1)
larga = np.argmax(normas)
`,
        },
        {
          id: 'rn-numpy.ex02.4',
          type: 'codigo',
          prompt:
            'Restar `q` a una matriz con `E - q` resta `q` a **cada fila** de `E` sin escribir ningún bucle: se llama *broadcasting* (NumPy repite `q` para todas las filas). Cada fila del resultado es el vector que va de la consulta a un documento, y su norma es la distancia. Para la posición, `np.argmin(x)` devuelve la del valor menor de `x`.\n\nYa tienes `E`, cuyas filas son cuatro documentos de juguete (inventados y de 3 componentes; los reales tienen cientos), y la consulta `q`. Guarda en `dist` la distancia de `q` a cada documento y en `cercana` la posición del documento más cercano.',
          hints: [
            'Primero `E - q`, una matriz del mismo tamaño que `E`. Después hay que combinar las tres componentes de cada fila con la fórmula de la norma.',
            'Se necesita una distancia por documento, es decir, cuatro números. Cuida sobre qué eje se calcula cada norma.',
            'El documento más cercano es el de distancia pequeña: ¿te interesa el valor mayor o el menor?',
          ],
          explain:
            'La distancia de un documento es la norma de la fila correspondiente de la diferencia, no la de toda la matriz. Para elegir, recuerda que una distancia pequeña significa un documento cercano.',
          solution:
            'Con `E - q` las filas son $(0, 4, 0)$, $(2, 2, 1)$, $(0, 1, 0)$ y $(2, 3, 6)$, y sus normas son $4$, $3$, $1$ y $7$: `dist = np.linalg.norm(E - q, axis=1)` da `[4, 3, 1, 7]`. El menor es $1$, que está en la posición `2`, así que `cercana = np.argmin(dist)` vale `2`.',
          requirements: [
            '`dist` existe y es un array de NumPy de números con una distancia por documento, en el orden de las filas de `E`: ni un solo número para toda la matriz ni una distancia por columna.',
            'Cada distancia es la longitud del vector que va de `q` al documento, sin elevarla al cuadrado.',
            '`cercana` es un número entero: la posición del documento más cercano a `q`, contando desde 0, no su distancia.',
          ],
          starter: `import numpy as np

# Embeddings de juguete (inventados y de 3 componentes), uno por documento
E = np.array([[1, 5, 1], [3, 3, 2], [1, 2, 1], [3, 4, 7]])
q = np.array([1, 1, 1])
# Guarda en dist la distancia de q a cada documento, y en cercana la posición del documento más cercano
dist = None
cercana = None
`,
          checks: `_d = isinstance(dist, (np.ndarray, np.generic)) and np.issubdtype(dist.dtype, np.number)
_c = isinstance(cercana, (int, np.integer)) and not isinstance(cercana, bool)
check(_d, "\`dist\` tiene que ser un array de NumPy con números: la distancia de \`q\` a cada documento.")
check((not _d) or dist.ndim != 0, "\`dist\` es un único número: la norma de la matriz entera. Falta indicar con \`axis\` sobre qué eje se calcula cada norma, para que haya una distancia por documento.")
check((not _d) or dist.shape != (3,), "\`dist\` tiene 3 números: son normas de columnas, una por componente. Hace falta una distancia por fila, que es una por documento: cambia el valor de \`axis\`.")
check((not _d) or dist.shape != (4, 3), "\`dist\` es una matriz de 4 filas y 3 columnas, y no una distancia por documento. Las componentes de cada fila de \`E - q\` hay que combinarlas en un solo número con la fórmula de Pitágoras.")
check((not _d) or dist.shape != (4,) or not np.allclose(dist, [16, 9, 1, 49]), "\`dist\` vale (16, 9, 1, 49): son las distancias al cuadrado. Falta la raíz cuadrada de cada suma.")
check((not _d) or dist.shape in ((), (3,), (4, 3)) or (dist.shape == (4,) and np.allclose(dist, [16, 9, 1, 49])) or (dist.shape == (4,) and np.allclose(dist, [4, 3, 1, 7])), "\`dist\` tiene que valer (4, 3, 1, 7): la norma de cada fila de \`E - q\`, es decir, la distancia de \`q\` a ese documento.")
check(_c, "\`cercana\` tiene que ser un número entero: la posición del documento más cercano.")
check((not _c) or cercana != 3, "\`cercana\` vale 3: es el documento más lejano de la consulta. Se busca la distancia menor, y la posición del valor menor la da \`np.argmin\`.")
check((not _c) or cercana != 1, "\`cercana\` vale 1: coincide con la distancia menor, pero tiene que ser la posición del documento que la tiene, contando desde 0.")
check((not _c) or cercana in (3, 1) or cercana == 2, "\`cercana\` tiene que ser la posición del documento a menor distancia de \`q\`, contando desde 0.")
`,
          reference: `import numpy as np

# Embeddings de juguete (inventados y de 3 componentes), uno por documento
E = np.array([[1, 5, 1], [3, 3, 2], [1, 2, 1], [3, 4, 7]])
q = np.array([1, 1, 1])
dist = np.linalg.norm(E - q, axis=1)
cercana = np.argmin(dist)
`,
        },
        {
          id: 'rn-numpy.ex02.5',
          type: 'codigo',
          prompt:
            'Una base de datos vectorial no suele devolver un solo documento, sino los **k** que más puntúan. Para eso, `np.argsort(x)` devuelve las posiciones que ordenarían `x` de menor a mayor: con `x = np.array([30, 10, 20])` da `[1, 2, 0]`. Con `[::-1]` se le da la vuelta a una lista y con `[:2]` se toman sus dos primeros elementos. Además, `plt.bar(posiciones, alturas)` dibuja una barra por cada posición, con esa altura: `plt.bar(range(3), x)` dibuja tres barras.\n\nYa tienes `E`, cuyas filas son cinco documentos de juguete (inventados y de 3 componentes; los reales tienen cientos), y la consulta `q`. Guarda en `punt` la puntuación de cada documento con `q`, dibuja una barra por documento con su puntuación y guarda en `top2` las posiciones de los dos documentos que más puntúan, del que más al que menos.',
          hints: [
            'Las puntuaciones salen de `E @ q`; la gráfica y `top2` las usan las dos.',
            'La gráfica tiene cinco barras, una por documento, y la altura de cada una es su puntuación.',
            '`np.argsort` ordena de menor a mayor: piensa en qué extremo de la lista está el documento que más puntúa y cómo coger dos.',
          ],
          explain:
            'Las posiciones de los documentos que más puntúan salen de ordenar las puntuaciones, pero `np.argsort` entrega posiciones y de menor a mayor. Mira en tu gráfica cuáles son las barras más altas y comprueba que `top2` las nombra en ese orden.',
          solution:
            'Las puntuaciones son `[4, 7, 8, 5, 3]`; por ejemplo, la del tercer documento es $2\\cdot2+2\\cdot1+2\\cdot1=8$. `np.argsort(punt)` da `[4, 0, 3, 1, 2]`; con `[::-1]` queda `[2, 1, 3, 0, 4]` y con `[:2]`, `top2 = [2, 1]`: el tercer documento, con $8$, y el segundo, con $7$. Son las dos barras más altas de la gráfica. Sin `[::-1]`, `[:2]` habría tomado los dos que menos puntúan.',
          requirements: [
            '`punt` existe y es un array de NumPy de números con una puntuación por documento, en el orden de las filas de `E`.',
            'Hay una figura con una barra por documento dibujada con `plt.bar`, en el orden de las filas de `E`, y la altura de cada barra es la puntuación de su documento.',
            '`top2` es un array de NumPy o una lista con 2 posiciones, números enteros, no puntuaciones: primero la del documento que más puntúa y después la del siguiente.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt

# Embeddings de juguete (inventados y de 3 componentes), uno por documento
E = np.array([[1, 2, 0], [3, 0, 1], [2, 2, 2], [0, 1, 4], [1, 1, 0]])
q = np.array([2, 1, 1])
# Guarda en punt las puntuaciones, dibuja una barra por documento y guarda en top2 las posiciones de los dos que más puntúan
punt = None
top2 = None
`,
          checks: `_p = isinstance(punt, np.ndarray) and np.issubdtype(punt.dtype, np.number) and punt.shape == (5,)
_o = np.asarray(top2) if isinstance(top2, (np.ndarray, list, tuple)) else None
_ord = _o is not None and _o.shape == (2,) and np.issubdtype(_o.dtype, np.integer)
_orf = _o is not None and _o.shape == (2,) and np.issubdtype(_o.dtype, np.floating)
check(_p, "\`punt\` tiene que ser un array de NumPy con 5 números, una puntuación por documento.")
check((not _p) or np.allclose(punt, [4, 7, 8, 5, 3]), "\`punt\` tiene que valer (4, 7, 8, 5, 3): el producto escalar de cada fila de \`E\` con \`q\`.")
check(_ord or _orf, "\`top2\` tiene que ser un array de NumPy (o una lista) con 2 posiciones, números enteros del 0 al 4.")
check(not _orf, "\`top2\` tiene números decimales: parecen puntuaciones y no posiciones. \`np.argsort\` no devuelve los valores ordenados, devuelve las posiciones.")
check((not _ord) or not np.array_equal(_o, [8, 7]), "\`top2\` vale (8, 7): son las dos puntuaciones más altas, no los documentos que las tienen. Hacen falta sus posiciones.")
check((not _ord) or not np.array_equal(_o, [4, 0]), "\`top2\` tiene los dos documentos que menos puntúan: \`np.argsort\` ordena de menor a mayor y hay que tomar el otro extremo.")
check((not _ord) or not np.array_equal(_o, [1, 2]), "\`top2\` tiene los dos documentos buenos pero en orden contrario: tiene que empezar por el que más puntúa.")
check((not _ord) or np.array_equal(_o, [2, 1]) or np.array_equal(_o, [8, 7]) or np.array_equal(_o, [4, 0]) or np.array_equal(_o, [1, 2]), "\`top2\` tiene que ser [2, 1]: las posiciones de los dos documentos de mayor puntuación, el que más puntúa primero.")
_fig = len(plt.get_fignums()) > 0
_pat = [p for ax in plt.gcf().axes for p in ax.patches] if _fig else []
_barras = [h for _x, h in sorted((p.get_x() + p.get_width() / 2, float(p.get_height())) for p in _pat)]
check(_fig, "No hay ninguna figura: dibuja las puntuaciones con \`plt.bar\`.")
check((not _fig) or len(_pat) > 0, "No hay barras en la figura: dibújalas con \`plt.bar\`.")
check(len(_pat) == 0 or len(_pat) == 5, "La figura tiene barras de más o de menos: hace falta una por documento, cinco en total.")
check(len(_pat) != 5 or not _p or np.allclose(_barras, punt), "La altura de cada barra tiene que ser la puntuación de su documento, y las barras tienen que seguir el orden de las filas de \`E\`.")
`,
          reference: `import numpy as np
import matplotlib.pyplot as plt

# Embeddings de juguete (inventados y de 3 componentes), uno por documento
E = np.array([[1, 2, 0], [3, 0, 1], [2, 2, 2], [0, 1, 4], [1, 1, 0]])
q = np.array([2, 1, 1])
punt = E @ q
plt.bar(range(5), punt)
top2 = np.argsort(punt)[::-1][:2]
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'rn-numpy.hoja.1',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula la distancia entre $\\vec{a}=(1, 2, 3, 4)$ y $\\vec{b}=(2, 0, 3, 1)$ en $\\mathbb{R}^4$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Revisa los cuatro cuadrados uno por uno: ¿puede alguno salir negativo?',
        'Recalcula la suma de los cuatro cuadrados y compárala con la que aparece en el razonamiento.',
      ],
      explain:
        'La distancia es la norma de la diferencia, y la norma suma cuadrados. Comprueba que la diferencia está bien calculada y que cada cuadrado que se suma tiene el signo que le corresponde.',
      solution:
        'La segunda línea está mal: $(-1)^2=1$, no $-1$, porque un cuadrado nunca es negativo. La suma correcta es $1+4+0+9=14$ y la distancia, $\\sqrt{14}\\approx3{,}74$. La última línea hereda el error: $\\sqrt{12}\\approx3{,}46$.',
      lines: [
        'a − b = (1 − 2, 2 − 0, 3 − 3, 4 − 1) = (−1, 2, 0, 3)',
        '‖a − b‖² = (−1)² + 2² + 0² + 3² = −1 + 4 + 0 + 9 = 12',
        '‖a − b‖ = √12 ≈ 3,46',
      ],
      faultyLine: 1,
    },
    {
      id: 'rn-numpy.hoja.2',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien busca el documento más cercano a la consulta `q` entre las filas de `E`, por distancia, y guarda su posición en `cercano` (NumPy ya está importado como `np`). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Calcula a mano la distancia de la primera fila a `q` y compárala con el primer número de `dist`.',
        'Piensa qué recorre cada valor de `axis` y qué eje desaparece del resultado. `E` es cuadrada, así que las dos opciones dan tres números.',
      ],
      explain:
        'Que el resultado tenga la longitud esperada no prueba que sea el correcto. Comprueba que cada número de `dist` es la distancia de un documento a `q` y no otra cosa.',
      solution:
        'La tercera línea está mal: `axis=0` calcula una norma por columna, no por documento. Como `E` tiene 3 filas y 3 columnas, el resultado también tiene 3 números y el fallo no salta a la vista. Con `axis=1` las distancias son $\\sqrt5\\approx2{,}24$, $\\sqrt3\\approx1{,}73$ y $\\sqrt6\\approx2{,}45$, y el documento más cercano es el `1`, no el `0` que sale con `axis=0`.',
      lines: [
        'E = np.array([[1, 0, 2], [2, 2, 1], [0, 3, 1]])',
        'q = np.array([1, 1, 0])',
        'dist = np.linalg.norm(E - q, axis=0)',
        'cercano = np.argmin(dist)',
      ],
      faultyLine: 2,
    },
    {
      id: 'rn-numpy.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento describe lo que sale al puntuar con `E @ q` una colección de 1000 documentos con embeddings de BERT-base, que tienen 768 dimensiones. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Escribe las formas de `E` y de `q` y mira qué número tiene que coincidir para poder multiplicar.',
        'Después, decide qué eje desaparece al sumar y cuál queda.',
      ],
      explain:
        'Revisa cada línea con las formas de los dos factores: qué número tiene que coincidir y qué eje se suma.',
      solution:
        'No hay ningún error. `E` tiene 1000 filas y 768 columnas, y `q` tiene un solo eje de 768 números. Para multiplicar, el número de columnas de `E` tiene que coincidir con el de componentes de `q` (las dos son 768), y ese eje se suma y desaparece. Queda el eje de 1000: una puntuación por documento.',
      lines: [
        'E tiene una fila por documento y una columna por componente: E.shape es (1000, 768)',
        'q es un solo vector de 768 componentes: q.shape es (768,)',
        'E @ q suma las 768 componentes de cada fila, así que ese eje desaparece',
        'El resultado tiene un número por documento: (E @ q).shape es (1000,)',
      ],
      faultyLine: null,
    },
  ],
};
