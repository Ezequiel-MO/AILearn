import type { Question } from '../../content/schema';
import { py } from '../py';
import { transformPlane } from './plane';

export const launch: Question[] = [
  {
    id: 'despegue.1',
    type: 'opcion',
    prompt:
      'Una **matriz** es una tabla de números ordenada en **filas** (las líneas horizontales) y **columnas** (las verticales). Su tamaño se dice «filas × columnas»: una matriz de 4 filas y 5 columnas es de $4\\times 5$.\n\n$$A=\\begin{pmatrix}2&-1&0\\\\3&4&5\\end{pmatrix}$$\n\n¿Qué tamaño tiene $A$?',
    hints: [
      'Cuenta las líneas horizontales de números: son las filas. Las verticales son las columnas.',
      'El tamaño se dice siempre en el mismo orden: primero las filas y después las columnas.',
    ],
    explain:
      'Las filas se cuentan de arriba abajo y las columnas de izquierda a derecha. El tamaño se escribe siempre con las filas primero.',
    solution:
      '$A$ tiene 2 filas y 3 columnas, así que es una matriz $2\\times 3$. Con 3 filas y 2 columnas se habría puesto el orden al revés: las filas van primero.',
    options: [
      '3 filas y 2 columnas',
      '2 filas y 3 columnas',
      '2 filas y 2 columnas',
      '3 filas y 3 columnas',
    ],
    correct: 1,
  },
  {
    id: 'despegue.2',
    type: 'numero',
    prompt:
      'Cada número de una matriz se nombra con dos subíndices: $b_{ij}$ es el que está en la fila $i$ y en la columna $j$ (primero la fila).\n\n$$B=\\begin{pmatrix}5&-2\\\\7&1\\\\0&4\\end{pmatrix}$$\n\n¿Cuánto vale $b_{21}$, el número de la fila 2 y la columna 1?',
    hints: [
      'Baja hasta la fila 2 y, dentro de ella, ve a la columna 1.',
      'Los subíndices se leen en el orden fila, columna: $b_{12}$ sería otro número.',
    ],
    explain:
      'El primer subíndice es la fila y el segundo es la columna. Localiza primero la fila y luego, dentro de ella, la columna.',
    solution:
      'La fila 2 es $7$ y $1$, y su columna 1 es el $7$: $b_{21}=7$. Con los subíndices al revés, $b_{12}$, saldría $-2$.',
    answer: 7,
    tol: 0,
  },
  {
    id: 'despegue.3',
    type: 'manipular',
    prompt:
      'Una matriz de $2\\times 2$ **transforma el plano**, y queda decidida del todo por dos flechas: adónde va $\\hat{\\imath}=(1, 0)$ y adónde va $\\hat{\\jmath}=(0, 1)$. Sus coordenadas son las **columnas** de la matriz. La rejilla se deforma siguiendo esas dos flechas, y la lectura del panel muestra la matriz.\n\nEstira el plano al doble en horizontal: arrastra las puntas hasta que $\\hat{\\imath}$ quede en $(2, 0)$ y $\\hat{\\jmath}$ se quede en $(0, 1)$.',
    hints: [
      'Agarra la punta de $\\hat{\\imath}$ y llévala dos unidades a la derecha: la rejilla se estira con ella.',
      'En la lectura de la matriz, la primera columna tiene que ser $2$ y $0$, y la segunda, $0$ y $1$.',
    ],
    explain:
      'Las columnas de la matriz son los sitios a los que van $\\hat{\\imath}$ y $\\hat{\\jmath}$. Mira cómo la rejilla entera sigue a esas dos flechas mientras las mueves.',
    solution:
      '$\\hat{\\imath}$ en $(2, 0)$ y $\\hat{\\jmath}$ en $(0, 1)$ dan la matriz $\\begin{pmatrix}2&0\\\\0&1\\end{pmatrix}$. Todo punto del plano acaba al doble de distancia en horizontal y a la misma altura.',
    plane: transformPlane({ movable: true, readouts: ['matrix'] }),
    goals: [
      { metric: 'x', of: ['i'], target: 2, tol: 0.01 },
      { metric: 'y', of: ['i'], target: 0, tol: 0.01 },
      { metric: 'x', of: ['j'], target: 0, tol: 0.01 },
      { metric: 'y', of: ['j'], target: 1, tol: 0.01 },
    ],
  },
  {
    id: 'despegue.4',
    type: 'vector',
    prompt:
      'Este plano muestra una transformación ya hecha: $\\hat{\\imath}$ ha ido a un punto y $\\hat{\\jmath}$ a otro. Escribe su matriz: la **primera columna** son las coordenadas del punto al que ha ido $\\hat{\\imath}$ y la **segunda**, las de $\\hat{\\jmath}$. Rellena las cuatro casillas.',
    hints: [
      'Lee primero adónde ha ido $\\hat{\\imath}$ y escribe sus dos coordenadas de arriba abajo, en la primera columna.',
      'Cuidado: las coordenadas de cada punto van en vertical, en una columna, no en horizontal, en una fila.',
    ],
    explain:
      'Cada columna de la matriz es la imagen de una de las dos flechas: la primera, la de $\\hat{\\imath}$, y la segunda, la de $\\hat{\\jmath}$. Las filas se rellenan de arriba abajo.',
    solution:
      '$\\hat{\\imath}$ ha ido a $(1, 1)$ y $\\hat{\\jmath}$ a $(-1, 1)$, así que la matriz es $\\begin{pmatrix}1&-1\\\\1&1\\end{pmatrix}$: primera columna $(1, 1)$ y segunda columna $(-1, 1)$. Si pones esos pares como filas, sale la matriz traspuesta, que es otra transformación.',
    plane: transformPlane({ i: [1, 1], j: [-1, 1] }),
    shape: [2, 2],
    answer: [1, -1, 1, 1],
    tol: 0,
  },
  {
    id: 'despegue.5',
    type: 'manipular',
    prompt:
      'Gira el plano **un cuarto de vuelta en sentido antihorario** (contra las agujas del reloj). Un giro así lleva a $\\hat{\\imath}$, que apunta a la derecha, hasta arriba, y a $\\hat{\\jmath}$, que apunta arriba, hasta la izquierda.\n\nArrastra las puntas hasta que $\\hat{\\imath}$ quede en $(0, 1)$ y $\\hat{\\jmath}$ en $(-1, 0)$.',
    hints: [
      'Imagina la flecha de $\\hat{\\imath}$ girando hacia arriba, como la aguja de un reloj que va hacia atrás.',
      'Las dos flechas giran juntas y siguen siendo perpendiculares entre sí.',
    ],
    explain:
      'Un cuarto de vuelta lleva a $\\hat{\\imath}$ de apuntar a la derecha a apuntar arriba, y a $\\hat{\\jmath}$ de arriba a la izquierda. La lectura de la matriz te dice cómo ha quedado cada columna.',
    solution:
      '$\\hat{\\imath}$ en $(0, 1)$ y $\\hat{\\jmath}$ en $(-1, 0)$ dan la matriz $\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$, la del giro de un cuarto de vuelta en sentido antihorario.',
    plane: transformPlane({ movable: true, readouts: ['matrix'] }),
    goals: [
      { metric: 'x', of: ['i'], target: 0, tol: 0.01 },
      { metric: 'y', of: ['i'], target: 1, tol: 0.01 },
      { metric: 'x', of: ['j'], target: -1, tol: 0.01 },
      { metric: 'y', of: ['j'], target: 0, tol: 0.01 },
    ],
  },
  {
    id: 'despegue.6',
    type: 'opcion',
    prompt:
      'Una transformación lineal deforma el plano entero a la vez, a partir de adónde mandan $\\hat{\\imath}$ y $\\hat{\\jmath}$, como las rejillas que acabas de mover. Pero no todo vale: hay cosas que ninguna matriz puede hacer.\n\n¿Cuál de estas cosas NO puede hacer una transformación lineal?',
    hints: [
      'Mira las rejillas que has deformado: hay un punto que siempre se queda donde estaba.',
      'Multiplicar el punto $(0, 0)$ por cualquier matriz da siempre el mismo resultado.',
    ],
    explain:
      'En todas las rejillas que has deformado hay un punto que no se mueve. Piensa cuál es y por qué ocurre.',
    solution:
      'Ninguna matriz mueve el origen: sus dos coordenadas son $0$, y al multiplicarlas por cualquier número siguen siendo $0$, así que el resultado es siempre $(0, 0)$. Girar, reflejar, estirar e inclinar sí se pueden. Lo que tampoco puede una matriz es curvar las líneas de la rejilla: las rectas siguen siendo rectas.',
    options: [
      'Girar el plano un cuarto de vuelta alrededor del origen',
      'Reflejar el plano, como si se mirara en un espejo',
      'Mover el origen $(0, 0)$ a otro punto del plano',
      'Inclinar el plano, de modo que los cuadrados pasen a ser paralelogramos',
    ],
    correct: 2,
  },
  {
    id: 'despegue.7',
    type: 'codigo',
    prompt:
      'Una matriz de NumPy se construye con una **lista de listas**: cada lista interior es una fila. Por ejemplo, `np.array([[1, 2], [3, 4]])` tiene dos filas y dos columnas, y su atributo `.shape` es la tupla `(2, 2)`, es decir, `(filas, columnas)`.\n\nCrea en `A` la matriz $\\begin{pmatrix}2&0&1\\\\1&3&-1\\end{pmatrix}$ y guarda en `forma` su `.shape`.',
    hints: [
      'El plan: escribe cada fila como una lista de tres números (la primera es `[2, 0, 1]`), mete las dos listas dentro de otra lista y pásala a `np.array(...)` para tener `A`. Después `forma` se lee del propio `A` con `.shape`, sin paréntesis. Un error típico: poner los seis números en una sola lista, que da un vector y no una matriz.',
      'Las piezas, con otros datos (una matriz de tres filas y dos columnas):\n\n' +
        py(
          'B = np.array([[1, 2], [3, 4], [5, 6]])   # una lista por fila, todas dentro de otra lista',
          'print(B)          # se imprime una fila por línea',
          'print(B.shape)    # (3, 2): primero las filas, luego las columnas',
        ) +
        '\n\nLa forma es una tupla: dos números entre paréntesis, el primero el de filas y el segundo el de columnas.',
      'El esqueleto, con huecos `___` donde decides tú:\n\n' +
        py('A = np.array([[___], [___]])', 'forma = ___.shape') +
        '\n\nEn cada uno de los dos primeros huecos va una fila entera, con sus tres números separados por comas. Si la forma sale `(3, 2)`, has puesto las filas como columnas.',
    ],
    explain:
      'Una matriz tiene tantas filas como listas interiores y tantas columnas como elementos tiene cada una. Si la forma no sale `(2, 3)`, revisa cómo has agrupado los números.',
    solution:
      'Se escribe `A = np.array([[2, 0, 1], [1, 3, -1]])` y `forma = A.shape`, que vale `(2, 3)`: dos filas y tres columnas.',
    requirements: [
      '`A` existe y es un array de NumPy con números, de 2 filas y 3 columnas: la matriz del enunciado, con sus números en el orden de las filas.',
      '`forma` existe y es una tupla (o una lista) de dos números enteros: el número de filas y el de columnas de `A`.',
    ],
    starter: `import numpy as np
# Esta línea trae NumPy (la librería de Python para trabajar con números en tablas)
# y le pone el nombre np, que es como lo vas a escribir.

# PASO 1. Crear la matriz A, con dos filas y tres columnas.
# Una matriz de NumPy es un array con dos ejes: las filas (de arriba abajo)
# y las columnas (de izquierda a derecha). Se construye con np.array(...)
# y una lista de listas: cada lista interior es UNA FILA.
# Por ejemplo, np.array([[1, 2], [3, 4]]) tiene dos filas, [1, 2] y [3, 4].
# Aquí hay dos filas de tres números cada una, las de la matriz del enunciado.
# Sale un array con números, no una lista suelta.
A = None

# PASO 2. Guardar en forma la forma de A.
# Todo array de NumPy tiene un atributo .shape (sin paréntesis: no es una función)
# que dice cuántas filas y columnas tiene. Se lee con el nombre del array,
# un punto y shape. Es una tupla de dos números: (filas, columnas).
# Sirve para comprobar que A salió con las filas y columnas que querías.
forma = None

# Para ver qué vale algo antes de entregar: print(A) o print(forma) y pulsa «Ejecutar».
`,
    checks: `_exp = np.array([[2, 0, 1], [1, 3, -1]])
_arr = isinstance(A, np.ndarray) and np.issubdtype(A.dtype, np.number)
_f = isinstance(forma, (tuple, list)) and all(isinstance(x, (int, np.integer)) and not isinstance(x, bool) for x in forma)
check(_arr, "\`A\` tiene que ser un array de NumPy con números: la matriz de dos filas y tres columnas.")
check((not _arr) or A.shape != (6,), "\`A\` es un solo vector de 6 números. Para tener filas hace falta una lista de listas: una lista interior por cada fila.")
check((not _arr) or A.shape != (3, 2), "\`A\` tiene 3 filas y 2 columnas: está traspuesta. Cada lista interior es una fila, y aquí tiene que haber dos filas de tres números.")
check((not _arr) or A.shape in ((6,), (3, 2)) or np.array_equal(A, _exp), "\`A\` tiene que tener 2, 0, 1 como primera fila y 1, 3, -1 como segunda.")
check(_f, "\`forma\` tiene que ser la tupla con el número de filas y de columnas de \`A\`, que se lee con \`.shape\`.")
check((not _f) or tuple(forma) == (2, 3), "\`forma\` tiene que valer (2, 3): dos filas y tres columnas.")
`,
    reference: 'import numpy as np\n\nA = np.array([[2, 0, 1], [1, 3, -1]])\nforma = A.shape\n',
  },
  {
    id: 'despegue.8',
    type: 'codigo',
    prompt:
      'En Python, el operador `@` multiplica una matriz por un vector y devuelve otro vector: la matriz **transforma** el vector. Ya tienes la matriz `A` y el vector `v`. Guarda en `w` el resultado de multiplicar `A` por `v`.',
    hints: [
      'El plan: `A` es la matriz y `v` es el vector; `w` es el resultado de ponerlos a los dos con `@` en medio, con la matriz a la izquierda y el vector a la derecha. Un error típico: usar `*`, que multiplica componente a componente y da otra cosa, o poner `v` antes que `A`.',
      'Las piezas, con otros datos:\n\n' +
        py(
          'M = np.array([[1, 0], [0, 2]])   # la matriz: dos filas',
          'u = np.array([3, 4])             # el vector: dos componentes',
          'print(M @ u)    # [3 8]: el vector transformado, con una componente por cada fila de M',
          'print(M * u)    # una matriz 2x2: esto NO es lo que se pide',
        ) +
        '\n\nCon `@` la matriz va a la izquierda: cada componente del resultado sale de multiplicar una fila de la matriz por el vector.',
      'El esqueleto, con huecos `___` donde decides tú:\n\n' +
        py('w = ___ @ ___') +
        '\n\nA la izquierda de `@` va la matriz y a la derecha el vector. Si los cambias, sale otro vector.',
    ],
    explain:
      'El operador `@` hace el producto de una matriz por un vector, con la matriz a la izquierda. El resultado es un vector nuevo, con una componente por cada fila de la matriz.',
    solution:
      'Se escribe `w = A @ v`. El resultado es el vector $(4, 6)$: la primera componente sale de la primera fila de `A` y la segunda, de la segunda fila.',
    requirements: [
      '`w` existe y es un array de NumPy con 2 componentes, las dos números.',
      '`w` es el resultado de multiplicar la matriz `A` por el vector `v`, con la matriz a la izquierda: multiplicar `v` por `A` o multiplicar componente a componente no sirve.',
    ],
    starter: `import numpy as np

# A es una matriz de NumPy: un array con dos filas, [2, 1] y [0, 3].
# Ya está hecha: no hace falta tocarla.
A = np.array([[2, 1], [0, 3]])
# v es un vector: un array de una sola fila de dos números, sus componentes.
# Ya está hecho: no hace falta tocarlo.
v = np.array([1, 2])

# PASO 1. Guardar en w el resultado de multiplicar A por v.
# Qué: aplicar la matriz al vector. La matriz transforma el vector y sale otro vector.
# Por qué: es la idea de todo este juego, que una matriz es una máquina que
# recibe un vector y devuelve otro.
# Cómo: el operador @ multiplica una matriz por un vector. Se escribe
# matriz @ vector, con la matriz a la IZQUIERDA y el vector a la derecha.
# Ojo: el * de siempre NO hace esto, multiplica componente a componente.
# Sale un array de NumPy con dos componentes, una por cada fila de A.
w = None

# Para ver qué vale algo antes de entregar: print(w) y pulsa «Ejecutar».
`,
    checks: `_arr = isinstance(w, np.ndarray) and np.issubdtype(w.dtype, np.number)
_ok = _arr and w.shape == (2,)
check(_arr, "\`w\` tiene que ser un array de NumPy con números: el resultado de multiplicar \`A\` por \`v\`.")
check((not _arr) or w.shape == (2,), "\`w\` tiene que ser un vector de 2 componentes. Si has escrito \`A * v\`, eso multiplica componente a componente y da una matriz: para multiplicar la matriz por el vector se usa \`@\`.")
check((not _ok) or np.allclose(w, [4, 6]) or np.allclose(w, [2, 7]), "\`w\` tiene que valer (4, 6): cada componente sale de multiplicar una fila de \`A\` por \`v\`.")
check((not _ok) or not np.allclose(w, [2, 7]), "\`w\` vale (2, 7): has multiplicado \`v\` por \`A\` y no \`A\` por \`v\`. El orden importa: la matriz va a la izquierda de \`@\`.")
`,
    reference:
      'import numpy as np\n\nA = np.array([[2, 1], [0, 3]])\nv = np.array([1, 2])\nw = A @ v\n',
  },
  {
    id: 'despegue.9',
    type: 'codigo',
    prompt:
      'En una matriz de NumPy, `A[i, j]` es el número de la fila `i` y la columna `j` (se empieza a contar en 0), y el símbolo `:` en un sitio significa «todos». Así, `A[0, :]` es la primera fila entera.\n\nGuarda en `col` la primera columna de `A`. Y guarda en `imagen_i` el resultado de multiplicar `A` por el vector $\\hat{\\imath}=(1, 0)$, es decir, adónde manda `A` a $\\hat{\\imath}$. Fíjate en que salen lo mismo.',
    hints: [
      'El plan: `col` se saca de `A` con corchetes, pidiendo todas las filas y solo la columna 0. `imagen_i` es `A` multiplicada con `@` por el vector $(1, 0)$, que hay que escribir como `np.array(...)`, con la matriz a la izquierda. Los dos salen igual. Un error típico: `A[0]`, que da la primera fila y no la primera columna.',
      'Las piezas, con otra matriz:\n\n' +
        py(
          'B = np.array([[5, 6], [7, 8]])',
          'print(B[1, 0])    # 7: fila 1, columna 0 (se cuenta desde 0)',
          'print(B[0, :])    # [5 6]: la fila 0 entera, el : significa todas las columnas',
          'print(B[:, 1])    # [6 8]: la columna 1 entera, el : significa todas las filas',
          'print(B @ np.array([0, 1]))    # [6 8]: igual que la columna 1',
        ) +
        '\n\nLos corchetes llevan `[fila, columna]`. El `:` en el primer sitio coge todas las filas, y por eso saca una columna.',
      'El esqueleto, con huecos `___` donde decides tú:\n\n' +
        py('col = A[___, ___]', 'imagen_i = A @ np.array([___])') +
        '\n\nEn los dos huecos de `col` van «todas las filas» y «la columna 0». En el último, las dos componentes de $\\hat{\\imath}$ separadas por una coma.',
    ],
    explain:
      'Multiplicar una matriz por $(1, 0)$ selecciona su primera columna: la columna es el sitio al que va $\\hat{\\imath}$. Y para coger una columna, el `:` en el primer sitio significa «todas las filas».',
    solution:
      'La primera columna es `A[:, 0]`, que vale $(3, 2)$. Multiplicar `A` por $\\hat{\\imath}$ con `A @ np.array([1, 0])` da el mismo vector: la primera columna de una matriz es adónde va $\\hat{\\imath}$. Si pones `A[0]` obtienes la primera fila, $(3, 1)$, que es otra cosa.',
    requirements: [
      '`col` existe y es un array de NumPy con 2 componentes, las dos números.',
      '`col` es la primera columna de `A`, de arriba abajo, y no su primera fila.',
      '`imagen_i` existe y es un array de NumPy con 2 componentes, las dos números: adónde manda `A` al vector $(1, 0)$, con la matriz a la izquierda.',
    ],
    starter: `import numpy as np

# A es una matriz de NumPy: un array con dos filas, [3, 1] y [2, 4].
# Ya está hecha: no hace falta tocarla.
A = np.array([[3, 1], [2, 4]])

# PASO 1. Guardar en col la primera columna de A.
# Qué: los números de la primera columna, de arriba abajo.
# Por qué: la primera columna de una matriz es adónde manda la matriz al vector
# i = (1, 0); en el paso 2 lo vas a ver.
# Cómo: A[fila, columna] es el número de esa fila y esa columna, contando desde 0.
# El símbolo : en un sitio significa «todos». Así A[0, :] es la primera fila entera,
# y para una columna entera hay que poner el : en el sitio de las filas.
# Sale un array de NumPy con dos números.
col = None

# PASO 2. Guardar en imagen_i el resultado de multiplicar A por el vector (1, 0).
# Qué: adónde manda A a i = (1, 0).
# Cómo: primero hay que escribir el vector (1, 0) como un array de NumPy,
# np.array([...]) con sus dos componentes. Después, el operador @ multiplica
# la matriz por el vector: matriz @ vector, con la matriz a la IZQUIERDA.
# Sale un array de NumPy con dos componentes, y es igual que col.
imagen_i = None

# Para ver qué vale algo antes de entregar: print(col) o print(imagen_i) y pulsa «Ejecutar».
`,
    checks: `def _vec(a):
    return isinstance(a, np.ndarray) and a.shape == (2,) and np.issubdtype(a.dtype, np.number)

check(_vec(col), "\`col\` tiene que ser un array de NumPy con 2 números: la primera columna de \`A\`.")
check((not _vec(col)) or not np.allclose(col, [3, 1]), "\`col\` vale (3, 1): es la primera fila de \`A\`, no la primera columna. Una columna recorre las filas, así que hacen falta todas las filas y una sola columna.")
check((not _vec(col)) or np.allclose(col, [3, 1]) or np.allclose(col, [3, 2]), "\`col\` tiene que valer (3, 2): los números de la primera columna de \`A\`, de arriba abajo.")
check(_vec(imagen_i), "\`imagen_i\` tiene que ser un array de NumPy con 2 números: el resultado de multiplicar \`A\` por el vector (1, 0).")
check((not _vec(imagen_i)) or np.allclose(imagen_i, [3, 2]), "\`imagen_i\` tiene que valer (3, 2): multiplica \`A\` por \`np.array([1, 0])\`, con la matriz a la izquierda de \`@\`.")
`,
    reference:
      'import numpy as np\n\nA = np.array([[3, 1], [2, 4]])\ncol = A[:, 0]\nimagen_i = A @ np.array([1, 0])\n',
  },
  {
    id: 'despegue.10',
    type: 'opcion',
    prompt:
      'Una capa lineal de un modelo de IA es una matriz. Aquí, un clasificador de reseñas recibe el embedding de un texto, con 768 componentes, y devuelve 3 puntuaciones, una por clase («positiva», «neutra» y «negativa»). Lo hace multiplicando una matriz de pesos $W$ por el embedding.\n\n¿Qué forma, en filas × columnas, tiene $W$?',
    hints: [
      'Para multiplicar una matriz por un vector, las columnas de la matriz tienen que corresponderse con las componentes del vector.',
      'El resultado tiene una componente por cada fila de la matriz, y hacen falta 3.',
    ],
    explain:
      'Una capa lineal multiplica una matriz por el embedding, y cada fila de la matriz produce una de las puntuaciones. Cuenta qué tiene que valer cada tamaño para que la multiplicación tenga sentido.',
    solution:
      '$W$ tiene una fila por puntuación (3) y una columna por componente del embedding (768): su forma es `(3, 768)`. Cada fila, multiplicada por el embedding, da una puntuación. La forma `(768, 3)` no sirve: no se podría multiplicar por un vector de 768 componentes para sacar 3 números.',
    options: ['`(768, 3)`', '`(3, 768)`', '`(768, 768)`', '`(3, 3)`'],
    correct: 1,
  },
];
