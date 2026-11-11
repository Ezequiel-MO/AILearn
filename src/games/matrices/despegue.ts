import type { Question } from '../../content/schema';
import { py } from '../py';
import { RESENAS_CUATRO, capaLab, type Cloud } from './datos';

/** La neurona siguiente solo mira la primera salida de la capa: dice «positiva» si es mayor que 0. */
const MIRA_SALIDA_1 = { w: [1, 0] as [number, number], b: 0 };

/** Las cuatro reseñas y «normal», con los dos rasgos a 0: sin grupo, la neurona no la cuenta. */
const RESENAS_Y_NORMAL: Cloud = {
  ...RESENAS_CUATRO,
  points: [...RESENAS_CUATRO.points, { id: 'normal', label: 'normal', x: 0, y: 0 }],
};

/**
 * Despegue del juego 2: lo primero que ve quien no sabe qué es una matriz. Las preguntas 1 y 2 la
 * presentan como la tabla de pesos de una capa; la 3 y la 5 son laboratorios con cuatro reseñas (la
 * primera capa que hace acertar a una neurona, y una capa que borra el tono); la 4 y la 6, la cuenta
 * de una neurona y lo que ninguna matriz puede hacer; de la 7 a la 9, NumPy; la 10, una capa real.
 */
export const launch: Question[] = [
  {
    id: 'despegue.1',
    type: 'numero',
    purpose: {
      why: 'Cada capa de una red neuronal guarda sus pesos en una matriz, y el tamaño de un modelo se cuenta en esos pesos. Saber cuántos números tiene una capa es saber cuánto ocupa y cuánto hay que entrenar.',
      aim: 'Vas a contar los pesos de una capa pequeña a partir de cuántos números le entran y cuántos devuelve.',
      takeaway:
        'Una capa de 3 entradas y 2 salidas tiene $2\\times 3=6$ pesos: uno por cada pareja de entrada y salida. Con 768 entradas y 3072 salidas la cuenta es la misma, y salen más de dos millones.',
    },
    prompt:
      'Una **matriz** es una tabla de números en **filas** (las horizontales) y **columnas** (las verticales). Una capa de una red guarda así sus **pesos**: una fila por cada salida y una columna por cada entrada. Cada casilla dice cuánto cuenta esa entrada en esa salida.\n\nUna capa recibe 3 rasgos de cada palabra y devuelve 2 salidas. ¿Cuántos pesos tiene su matriz?',
    hints: [
      'Imagina la tabla: ¿cuántas filas tiene (una por salida) y cuántas columnas (una por entrada)?',
      'Cada fila tiene una casilla por columna: multiplica filas por columnas.',
    ],
    explain:
      'Cada salida necesita un peso por cada entrada: así decide cuánto cuenta cada rasgo. El número de pesos es filas por columnas, no filas más columnas.',
    solution:
      'La matriz tiene 2 filas (las salidas) y 3 columnas (las entradas): es de $2\\times 3$, se dice «filas × columnas», y guarda $2\\cdot 3=6$ pesos. Sumar, $2+3=5$, contaría los bordes de la tabla y no sus casillas.',
    answer: 6,
    tol: 0,
  },
  {
    id: 'despegue.2',
    type: 'numero',
    purpose: {
      why: 'Leer una matriz de pesos es leer qué hace una capa: qué rasgos mira cada salida y si cuentan a favor o en contra. Es lo que hace un ingeniero cuando inspecciona un modelo para entender por qué decide algo.',
      aim: 'Vas a encontrar en la tabla de una capa el peso que une un rasgo de entrada con una salida.',
      takeaway:
        'El peso $w_{ij}$ está en la fila de la salida $i$ y en la columna de la entrada $j$. Un peso positivo empuja la salida hacia arriba, uno negativo hacia abajo y un $0$ deja ese rasgo fuera.',
    },
    prompt:
      'Esta es la matriz de una capa con 3 entradas, una por columna (**intensidad**, **tono** y **longitud** de una palabra, en ese orden), y 2 salidas, una por fila:\n\n$$W=\\begin{pmatrix}0{,}5&2&-1\\\\1&-3&0\\end{pmatrix}$$\n\n¿Cuánto pesa el tono en la salida 2?',
    hints: [
      'La salida 2 es la segunda fila. El tono es la segunda columna.',
      'Busca la casilla donde se cruzan esa fila y esa columna. Un peso negativo también es un peso: cuenta en contra.',
    ],
    explain:
      'Una fila son los pesos de una salida y una columna, los de una entrada. El peso de la entrada $j$ en la salida $i$ está en la fila $i$ y la columna $j$, y se escribe $w_{ij}$: primero la fila.',
    solution:
      'La fila 2 es $1$, $-3$ y $0$, y su segunda columna es el $-3$: $w_{22}=-3$. El tono resta en la salida 2. El $2$ es el peso del tono en la salida 1, y la longitud no cuenta nada en la salida 2: su peso es $0$.',
    answer: -3,
    tol: 0,
  },
  {
    id: 'despegue.3',
    type: 'laboratorio',
    purpose: {
      why: 'En una red neuronal, cada palabra llega como una lista de rasgos y una capa la transforma para que la neurona siguiente pueda decidir. Esa neurona solo ve lo que la capa le pone delante.',
      aim: 'Vas a mover una columna de tu primera capa hasta que la neurona siguiente distinga las reseñas positivas de las negativas.',
      takeaway:
        'Cada columna de la matriz dice adónde manda la capa un rasgo. Al mover la del tono se mueven las cuatro palabras a la vez, cada una según su tono. Entrenar una capa es buscar columnas así.',
    },
    prompt:
      'Cuatro reseñas de una palabra con dos rasgos: **intensidad** y **tono**. La capa las recoloca: su columna $\\hat{\\imath}$ dice adónde va la intensidad, y $\\hat{\\jmath}$, el tono. La neurona siguiente solo mira la salida 1 (el eje horizontal) y responde «positiva» a lo sombreado. Ahora le llega la intensidad, y lo dice de todas.\n\nMueve $\\hat{\\jmath}$ hasta que acierte con las cuatro.',
    hints: [
      '«genial» y «horrible» tienen la misma intensidad y caen a la misma distancia horizontal. Lo que las distingue es el tono: tiene que llegar también a la salida 1.',
      'Arrastra la punta de $\\hat{\\jmath}$ hacia la derecha y mira cómo las positivas avanzan y las negativas retroceden.',
    ],
    explain:
      'La salida 1 de cada palabra es su intensidad más su tono por la primera coordenada de $\\hat{\\jmath}$. Si esa coordenada es pequeña, manda la intensidad; si es bastante grande, manda el tono, que es lo que separa las positivas de las negativas.',
    solution:
      'Con $\\hat{\\jmath}$ en $(1{,}5;\\ 1)$, la salida 1 de «horrible» es $2{,}5-1{,}5\\cdot 2=-0{,}5$ y la de «malo», $1-1{,}5=-0{,}5$: pasan al lado negativo y la neurona acierta las cuatro. Vale cualquier altura de $\\hat{\\jmath}$ y cualquier peso del tono desde $1{,}5$. Con $1$ no basta: «horrible» sigue en el lado positivo y «malo» queda justo en la frontera, que no cuenta como acierto.',
    lab: capaLab(RESENAS_CUATRO, { range: 6, movable: 'j', readout: MIRA_SALIDA_1 }),
    goals: [
      {
        metric: 'acc',
        op: 'gte',
        target: 1,
        label: 'Aciertos de la neurona siguiente',
        format: 'percent',
      },
    ],
    solved: { jx: 1.5 },
  },
  {
    id: 'despegue.4',
    type: 'numero',
    purpose: {
      why: 'Lo que hace una neurona es una suma con pesos: cada rasgo de la entrada por su peso, todo sumado. Es el producto escalar de su fila de la matriz con la palabra, la cuenta más repetida de una red.',
      aim: 'Vas a calcular a mano la salida 1 de una capa para «genial» y a comprobarla después construyendo la capa en el laboratorio.',
      takeaway:
        'La salida 1 de «genial» es $1\\cdot 2{,}5+1{,}5\\cdot 2=5{,}5$: la fila 1 de pesos por los rasgos de la palabra. Cada salida usa su fila; las columnas dicen adónde va cada rasgo, y las dos lecturas dan lo mismo.',
    },
    prompt:
      'Una capa que hace acertar a la neurona tiene estos pesos (una fila por salida; columnas: intensidad y tono):\n\n$$A=\\begin{pmatrix}1&1{,}5\\\\0&1\\end{pmatrix}$$\n\n«genial» tiene intensidad $2{,}5$ y tono $2$. ¿Cuánto vale su salida 1? Después puedes construir la capa en el laboratorio y ver dónde cae.',
    hints: [
      'La salida 1 usa solo la fila 1 de $A$: un peso para la intensidad y otro para el tono.',
      'Multiplica cada rasgo de «genial» por su peso de la fila 1 y suma los dos productos.',
    ],
    explain:
      'La salida 1 es la fila 1 por la palabra: peso de la intensidad por intensidad más peso del tono por tono. Esa cuenta se llama **producto escalar**. La fila 2 es otra neurona, con su propia cuenta.',
    solution:
      '$1\\cdot 2{,}5+1{,}5\\cdot 2=2{,}5+3=5{,}5$. En el laboratorio, con $\\hat{\\imath}$ en $(1, 0)$ y $\\hat{\\jmath}$ en $(1{,}5;\\ 1)$, «genial» cae en $(5{,}5;\\ 2)$. Con la primera columna en vez de la primera fila saldría $1\\cdot 2{,}5+0\\cdot 2=2{,}5$, que es otra cuenta.',
    lab: capaLab(RESENAS_CUATRO, { range: 6, readout: MIRA_SALIDA_1 }),
    answer: 5.5,
    tol: 0,
  },
  {
    id: 'despegue.5',
    type: 'laboratorio',
    purpose: {
      why: 'Una capa no solo recoloca: también puede tirar información. Si dos palabras distintas salen de la capa en el mismo punto, nada de lo que venga detrás podrá separarlas, por muchas capas que se añadan.',
      aim: 'Vas a romper a propósito una capa que funciona, hasta que dos parejas de reseñas acaben en el mismo punto, y a mirar qué le pasa a la neurona.',
      takeaway:
        'Con $\\hat{\\jmath}$ en el origen, la capa borra el tono: «genial» y «horrible» caen en el mismo punto, y «bueno» y «malo» también. La neurona baja a la mitad de aciertos y ningún ajuste suyo lo arregla: lo borrado no vuelve.',
    },
    prompt:
      'Esta capa hace acertar a la neurona con las cuatro reseñas. Ahora toca lo contrario: una capa también puede **destruir información**, y vas a ver cómo.\n\nMueve las columnas hasta que dos parejas de reseñas caigan cada una en un mismo punto, y mira qué les pasa a los aciertos de la neurona.',
    hints: [
      'Busca las parejas que solo se diferencian en un rasgo: «genial» y «horrible» tienen la misma intensidad. ¿Qué rasgo tendría que borrar la capa para no distinguirlas?',
      'Lleva la punta de $\\hat{\\jmath}$ (el tono) al origen. Juntar las palabras en una recta no basta: tienen que coincidir.',
    ],
    explain:
      'Cada palabra sale en intensidad por $\\hat{\\imath}$ más tono por $\\hat{\\jmath}$. Si $\\hat{\\jmath}$ es cero, el tono deja de contar y solo queda la intensidad, que es igual en «genial» y «horrible», y en «bueno» y «malo».',
    solution:
      'Con $\\hat{\\jmath}$ en $(0, 0)$ y $\\hat{\\imath}$ en $(1, 1)$, «genial» y «horrible» caen en $(2{,}5;\\ 2{,}5)$ y «bueno» y «malo» en $(1, 1)$: dos parejas fundidas, y la neurona acierta dos de cuatro. $\\hat{\\imath}$ puede ir a cualquier sitio: toda capa con $\\hat{\\jmath}$ en el origen borra el tono. Borrar la intensidad no funde ninguna pareja, y poner $\\hat{\\jmath}$ sobre la recta de $\\hat{\\imath}$ deja las palabras en fila, pero separadas.',
    lab: capaLab(RESENAS_CUATRO, { range: 6, j: [1.5, 1], readout: MIRA_SALIDA_1 }),
    goals: [
      {
        metric: 'merged',
        op: 'gte',
        target: 2,
        label: 'Parejas de reseñas que caen en el mismo punto',
        format: 'integer',
      },
    ],
    solved: { iy: 1, jx: 0, jy: 0 },
  },
  {
    id: 'despegue.6',
    type: 'opcion',
    purpose: {
      why: 'Una capa sin sesgo es solo multiplicar por una matriz, y una entrada de ceros sale siempre en ceros. Por eso toda capa real lleva además un vector de sesgos $b$, que desplaza el resultado: la capa calcula $Wx+b$.',
      aim: 'Vas a descubrir, moviendo las columnas de la capa, qué no puede hacer ninguna matriz con las palabras que le llegan.',
      takeaway:
        'Ninguna matriz mueve el origen: «normal», con los dos rasgos a $0$, se queda en $(0, 0)$ con cualquier capa. Para desplazarla hace falta el sesgo, que se suma después de la matriz.',
    },
    prompt:
      'En el laboratorio hay una quinta palabra, «normal», con intensidad $0$ y tono $0$. Mueve las columnas de la capa como quieras y mira qué hace cada palabra.\n\n¿Cuál de estas cosas NO puede hacer ninguna capa sin sesgo, es decir, una matriz sola?',
    hints: [
      'Prueba varias capas y fíjate en «normal»: ¿se ha movido alguna vez?',
      'La salida es intensidad por $\\hat{\\imath}$ más tono por $\\hat{\\jmath}$. ¿Qué da eso si los dos rasgos son $0$?',
    ],
    explain:
      'La capa multiplica cada rasgo por su columna y suma. Si todos los rasgos son $0$, todos los productos son $0$, se muevan como se muevan las columnas.',
    solution:
      '«normal» sale en $0\\cdot\\hat{\\imath}+0\\cdot\\hat{\\jmath}=(0, 0)$ con cualquier matriz: no se puede mover. Las otras tres sí se pueden: alargar $\\hat{\\jmath}$ dobla el tono, inclinarla mezcla los dos rasgos en una salida y llevarla al origen junta «genial» y «horrible». Por eso una capa real suma un sesgo: $Wx+b$.',
    lab: capaLab(RESENAS_Y_NORMAL),
    options: [
      'Hacer que el tono cuente el doble',
      'Mezclar la intensidad y el tono en una misma salida',
      'Mandar «genial» y «horrible» al mismo punto',
      'Mover «normal» a otro punto del plano',
    ],
    correct: 3,
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
    purpose: {
      why: 'Un clasificador de texto suele acabar en una capa lineal: recibe el embedding y devuelve una puntuación por clase. Montarla es elegir la forma de su matriz, y un error de formas es el fallo más corriente al escribir un modelo.',
      aim: 'Vas a decidir la forma de la matriz de pesos de un clasificador de reseñas a partir del tamaño de lo que entra y de lo que sale.',
      takeaway:
        'La matriz es de $3\\times 768$: una fila por puntuación y una columna por componente del embedding, $2304$ pesos. En PyTorch, los pesos de una capa lineal se guardan con esa forma: (salidas, entradas).',
    },
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
