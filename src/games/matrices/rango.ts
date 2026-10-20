import type { Goal, PlaneSpec, PlaneVector, Project } from '../../content/schema';
import { transformPlane } from './plane';

/** El vector suelto `v` que se transforma con `apply`, móvil o fijo. */
const vec = (x: number, y: number): PlaneVector => ({
  id: 'v',
  label: 'v',
  x,
  y,
  movable: true,
});

/** Mismo plano con î quieto: solo se arrastra ĵ. */
const fixI = (spec: PlaneSpec): PlaneSpec => ({
  ...spec,
  vectors: spec.vectors.map((v) => (v.id === 'i' ? { ...v, movable: false } : v)),
});

/** Metas de un `manipular`: î y ĵ en el sitio de las columnas pedidas. */
const columns = (i: [number, number], j: [number, number]): Goal[] => [
  { metric: 'x', of: ['i'], target: i[0], tol: 0.01 },
  { metric: 'y', of: ['i'], target: i[1], tol: 0.01 },
  { metric: 'x', of: ['j'], target: j[0], tol: 0.01 },
  { metric: 'y', of: ['j'], target: j[1], tol: 0.01 },
];

/** Tercer proyecto de la Órbita 1 «El área»: el rango, cuántas direcciones sobreviven. */
export const rango: Project = {
  id: 'rango',
  name: 'Rango',
  sub: 'Cuántas direcciones sobreviven',
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'rango.ex00.1',
          type: 'manipular',
          prompt:
            'Cuando $\\det=0$ el plano se aplasta. El **rango** de una matriz mide cuánto: es la dimensión de su imagen, el número de direcciones que sobreviven. Si la imagen es todo el plano, el rango es $2$; si es una recta, $1$; si es un solo punto, $0$.\n\n$\\hat{\\imath}$ está fijo en $(2, 1)$. Mueve $\\hat{\\jmath}$ hasta que toda la rejilla quede aplastada sobre la recta de $\\hat{\\imath}$, con determinante $0$. Para que $\\hat{\\jmath}$ no sea el vector nulo, pon su coordenada $x$ en $-2$.',
          hints: [
            'Aplastar el plano sobre la recta de $\\hat{\\imath}$ es dejar a $\\hat{\\jmath}$ en esa misma recta: un múltiplo de $(2, 1)$.',
            '¿Qué múltiplo de $(2, 1)$ tiene la coordenada $x$ igual a $-2$? Comprueba que la lectura del determinante marca $0$.',
          ],
          explain:
            'Las dos columnas tienen que quedar sobre la misma recta. Con una fija, la otra solo tiene que ser un múltiplo suyo: arrastra mirando la lectura del determinante.',
          solution:
            '$\\hat{\\jmath}$ tiene que ser un múltiplo de $(2, 1)$. Con $x=-2$ el múltiplo es $-1$, así que $\\hat{\\jmath}=(-2, -1)$. La matriz es $\\begin{pmatrix}2&-2\\\\1&-1\\end{pmatrix}$, con $\\det=2\\cdot(-1)-(-2)\\cdot 1=0$. Su imagen es la recta de $(2, 1)$: sobrevive una sola dirección y el rango es $1$.',
          plane: fixI(
            transformPlane({
              i: [2, 1],
              j: [0, 1],
              movable: true,
              readouts: ['matrix', 'det'],
            }),
          ),
          goals: [
            { metric: 'det', of: ['i', 'j'], target: 0, tol: 0.01 },
            { metric: 'x', of: ['j'], target: -2, tol: 0.01 },
          ],
        },
        {
          id: 'rango.ex00.2',
          type: 'manipular',
          prompt:
            'Lo que una matriz aplasta hasta el vector nulo es su **núcleo**: los vectores $\\vec{v}$ con $A\\vec{v}=\\vec{0}$. Esta matriz, $A=\\begin{pmatrix}1&-2\\\\-1&2\\end{pmatrix}$, tiene las dos columnas sobre una misma recta: $\\hat{\\imath}$ queda en $(1, -1)$ y $\\hat{\\jmath}$ en $(-2, 2)$.\n\nMueve $\\vec{v}$ hasta que la flecha discontinua, $A\\vec{v}$, llegue a $(0, 0)$. El vector nulo siempre lo cumple, así que no vale: pon la coordenada $x$ de $\\vec{v}$ en $2$.',
          hints: [
            'Con $\\vec{v}=(a, b)$, $A\\vec{v}=a\\cdot(1, -1)+b\\cdot(-2, 2)=(a-2b)\\cdot(1, -1)$. Solo hace falta que el número $a-2b$ valga $0$.',
            'Con $a=2$, ¿qué valor de $b$ cumple $a-2b=0$?',
          ],
          explain:
            'Las dos columnas son múltiplos de la misma flecha, así que una combinación de ellas puede cancelarse. Escribe cuánto vale $A\\vec{v}$ en función de $a$ y $b$ y busca cuándo se anula.',
          solution:
            'Con $a=2$ hace falta $2-2b=0$, o sea $b=1$. Con $\\vec{v}=(2, 1)$: $2\\cdot(1, -1)+1\\cdot(-2, 2)=(0, 0)$. Todos los múltiplos $(2t, t)$ están en el núcleo: una recta entera de vectores que acaban en el origen. Por eso, mirando $A\\vec{v}$ no se puede recuperar $\\vec{v}$: esa información se ha perdido.',
          plane: transformPlane({
            i: [1, -1],
            j: [-2, 2],
            extra: [vec(1, 2)],
            apply: ['v'],
            readouts: ['matrix', 'components'],
          }),
          goals: [
            { metric: 'img_x', of: ['i', 'j', 'v'], target: 0, tol: 0.01 },
            { metric: 'img_y', of: ['i', 'j', 'v'], target: 0, tol: 0.01 },
            { metric: 'x', of: ['v'], target: 2, tol: 0.01 },
          ],
        },
        {
          id: 'rango.ex00.3',
          type: 'manipular',
          prompt:
            'La misma $A=\\begin{pmatrix}1&-2\\\\-1&2\\end{pmatrix}$ tiene rango $1$: su imagen es la recta de $(1, -1)$, y todos los resultados $A\\vec{v}$ caen en ella. Mueve $\\vec{v}$ hasta que $A\\vec{v}$ llegue a $(3, -3)$, un punto de esa recta. Hay muchos $\\vec{v}$ que sirven: vale cualquiera.',
          hints: [
            'Todos los resultados son $A\\vec{v}=(a-2b)\\cdot(1, -1)$. Para llegar a $(3, -3)$ hace falta $a-2b=3$.',
            'Elige un valor sencillo para $b$ y calcula la $a$ que falta.',
          ],
          explain:
            'Como la imagen es una recta, solo cuenta el número $a-2b$, y muchas parejas $(a, b)$ dan el mismo. Varios vectores acaban en el mismo punto, y por eso esta matriz no se puede deshacer.',
          solution:
            'Hace falta $a-2b=3$. Sirven, por ejemplo, $\\vec{v}=(3, 0)$, $(1, -1)$ y $(-1, -2)$. Si a uno le sumas un vector del núcleo, como $(2, 1)$, el resultado no cambia: $(3, 0)+(2, 1)=(5, 1)$ también da $(3, -3)$. En cambio, un punto fuera de la recta, como $(1, 1)$, no lo alcanza ningún $\\vec{v}$.',
          plane: transformPlane({
            i: [1, -1],
            j: [-2, 2],
            extra: [vec(1, 1)],
            apply: ['v'],
            readouts: ['matrix', 'components'],
          }),
          goals: [
            { metric: 'img_x', of: ['i', 'j', 'v'], target: 3, tol: 0.01 },
            { metric: 'img_y', of: ['i', 'j', 'v'], target: -3, tol: 0.01 },
          ],
        },
        {
          id: 'rango.ex00.4',
          type: 'manipular',
          prompt:
            'Ahora se mueven las dos columnas. Haz que la imagen de la matriz sea **la recta que pasa por el origen y por $(1, 2)$**: tanto $\\hat{\\imath}$ como $\\hat{\\jmath}$ tienen que quedar sobre ella. Coloca $\\hat{\\imath}$ en $(-1, -2)$ y pon la coordenada $x$ de $\\hat{\\jmath}$ en $2$; la coordenada $y$ de $\\hat{\\jmath}$ la decide la recta.',
          hints: [
            'Los puntos de esa recta son los múltiplos $t\\cdot(1, 2)$: su coordenada $y$ es siempre el doble de la $x$.',
            'Un $\\hat{\\jmath}$ con $x=2$ está en la recta si su $y$ es el doble.',
          ],
          explain:
            'Una recta por el origen se describe con un solo vector: todos sus múltiplos. La imagen de una matriz es esa recta cuando todas las columnas son múltiplos de él.',
          solution:
            '$\\hat{\\imath}=(-1, -2)=-1\\cdot(1, 2)$ y $\\hat{\\jmath}=(2, 4)=2\\cdot(1, 2)$. La matriz es $\\begin{pmatrix}-1&2\\\\-2&4\\end{pmatrix}$, con $\\det=-4+4=0$. Su imagen es la recta de $(1, 2)$ y su rango es $1$.',
          plane: transformPlane({ movable: true, readouts: ['matrix'], range: 5 }),
          goals: [
            { metric: 'x', of: ['i'], target: -1, tol: 0.01 },
            { metric: 'y', of: ['i'], target: -2, tol: 0.01 },
            { metric: 'x', of: ['j'], target: 2, tol: 0.01 },
            { metric: 'det', of: ['i', 'j'], target: 0, tol: 0.01 },
          ],
        },
        {
          id: 'rango.ex00.5',
          type: 'manipular',
          prompt:
            'Queda el caso más extremo: que **todo el plano caiga en un solo punto**, el origen. Es la matriz con todos sus números iguales a $0$, y tiene rango $0$: no sobrevive ninguna dirección. Mueve $\\hat{\\imath}$ y $\\hat{\\jmath}$ hasta lograrlo.',
          hints: [
            'Si $\\hat{\\imath}$ y $\\hat{\\jmath}$ están en el origen, cualquier combinación de las dos también.',
            'Con una columna en el origen se pierde una dirección; con las dos se pierden todas.',
          ],
          explain:
            'La imagen son todas las combinaciones de las columnas. Si las dos columnas son el vector nulo, la única combinación posible es el vector nulo.',
          solution:
            'Con $\\hat{\\imath}=(0, 0)$ y $\\hat{\\jmath}=(0, 0)$ la matriz es $\\begin{pmatrix}0&0\\\\0&0\\end{pmatrix}$. Su imagen es un punto: rango $0$. Con rango $1$ aún sobrevive una dirección, una recta; con rango $2$, el plano entero.',
          plane: transformPlane({ movable: true, readouts: ['matrix'] }),
          goals: columns([0, 0], [0, 0]),
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'rango.ex01.1',
          type: 'numero',
          prompt:
            'El rango de una matriz es el número de columnas **independientes**: las que aportan una dirección nueva. Calcula el rango de $A=\\begin{pmatrix}2&-1\\\\-4&2\\end{pmatrix}$.',
          hints: [
            'Compara las dos columnas: ¿una es un múltiplo de la otra?',
            'Las columnas son $(2, -4)$ y $(-1, 2)$. ¿Por qué número hay que multiplicar la primera para obtener la segunda?',
          ],
          explain:
            'Una columna que es múltiplo de otra no aporta una dirección nueva. Cuenta solo las que sí aportan.',
          solution:
            'La segunda columna es $-\\tfrac{1}{2}$ por la primera, así que las dos están sobre la misma recta y solo hay una dirección independiente: rango $1$. Lo confirma el determinante, $2\\cdot 2-(-1)\\cdot(-4)=0$, que descarta el rango $2$. El rango $0$ exigiría la matriz nula.',
          answer: 1,
          tol: 0,
        },
        {
          id: 'rango.ex01.2',
          type: 'numero',
          prompt:
            'Calcula el rango de $A=\\begin{pmatrix}1&0&1\\\\2&1&3\\\\0&1&1\\end{pmatrix}$. Mira con atención cómo es su tercera columna.',
          hints: [
            'Las columnas son $(1, 2, 0)$, $(0, 1, 1)$ y $(1, 3, 1)$. Prueba a sumar las dos primeras.',
            'Cuando una columna sobra, comprueba si las que quedan son independientes entre sí.',
          ],
          explain:
            'Una columna que es combinación de las demás no aporta nada. Quita las que sobran y cuenta las que quedan, asegurándote de que ninguna de ellas es múltiplo de otra.',
          solution:
            'La tercera columna es la suma de las dos primeras: $(1, 2, 0)+(0, 1, 1)=(1, 3, 1)$, así que sobra. Las dos primeras no son proporcionales, así que son independientes. Rango $2$: la imagen es un plano dentro del espacio de 3 dimensiones, no el espacio entero.',
          answer: 2,
          tol: 0,
        },
        {
          id: 'rango.ex01.3',
          type: 'numero',
          prompt:
            'Se construye $M=\\vec{u}\\vec{v}^{\\top}$ con $\\vec{u}=(1, 2, 3)$ y $\\vec{v}=(2, 0, -1)$: la fila $i$ de $M$ es $u_i$ veces $\\vec{v}^{\\top}$. Escrita entera,\n\n$$M=\\begin{pmatrix}2&0&-1\\\\4&0&-2\\\\6&0&-3\\end{pmatrix}.$$\n\nCalcula su rango.',
          hints: [
            'Compara las tres filas: ¿cómo se relacionan?',
            'También puedes mirar las columnas: ¿cuántas direcciones distintas hay entre ellas?',
          ],
          explain:
            'Las tres filas salen de la misma fila multiplicada por números distintos. Cuenta cuántas direcciones independientes hay de verdad.',
          solution:
            'Las filas son $1$, $2$ y $3$ veces $(2, 0, -1)$, y las columnas son $2$, $0$ y $-1$ veces $(1, 2, 3)$. Hay una sola dirección: rango $1$. Todo producto $\\vec{u}\\vec{v}^{\\top}$ con $\\vec{u}$ y $\\vec{v}$ no nulos tiene rango $1$, por grandes que sean. Y se guarda con $3+3=6$ números en vez de $9$.',
          answer: 1,
          tol: 0,
        },
        {
          id: 'rango.ex01.4',
          type: 'vector',
          prompt:
            'La matriz $A=\\begin{pmatrix}1&2\\\\3&6\\end{pmatrix}$ tiene rango $1$ y aplasta una recta entera de vectores en el origen: su núcleo. Escribe el vector $\\vec{v}$ del núcleo, el que cumple $A\\vec{v}=\\vec{0}$, cuya primera componente es $2$.',
          hints: [
            'Con $\\vec{v}=(2, b)$, $A\\vec{v}$ es $2$ veces la primera columna más $b$ veces la segunda.',
            'Las dos columnas son $(1, 3)$ y $(2, 6)$. ¿Qué $b$ hace que las dos partes se cancelen?',
          ],
          explain:
            'Plantea $A\\vec{v}=\\vec{0}$ con la primera componente fijada. Las dos coordenadas de $A\\vec{v}$ tienen que anularse a la vez, y en una matriz de rango $1$ lo hacen con el mismo valor.',
          solution:
            'Con $\\vec{v}=(2, b)$: $A\\vec{v}=(2+2b,\\ 6+6b)$, que se anula con $b=-1$. Entonces $\\vec{v}=(2, -1)$ y $2\\cdot(1, 3)+(-1)\\cdot(2, 6)=(0, 0)$. Con la primera componente fijada solo hay un vector: el núcleo es una recta. Rango $1$ más dimensión del núcleo $1$ suman el número de columnas, $2$.',
          answer: [2, -1],
          tol: 0,
        },
        {
          id: 'rango.ex01.5',
          type: 'opcion',
          prompt:
            'Una matriz de $3\\times 3$ tiene rango $1$. ¿Qué hace con el espacio de 3 dimensiones?',
          hints: [
            'El rango es la dimensión de la imagen. ¿Qué objeto tiene dimensión $1$ dentro del espacio?',
            'Si solo sobrevive una dirección, las otras dos se pierden.',
          ],
          explain:
            'El rango cuenta las direcciones que sobreviven. Relaciona el número de direcciones con la forma de la imagen: punto, recta, plano o espacio.',
          solution:
            'Rango $1$ es que la imagen tiene una sola dimensión: una recta que pasa por el origen, y todo el espacio acaba sobre ella. Se pierden dos direcciones, y el núcleo es un plano entero de vectores que acaban en $\\vec{0}$. Un plano como imagen sería rango $2$ y un punto, rango $0$. El rango y la dimensión del núcleo suman $3$.',
          options: [
            'Lo aplasta contra un plano: se pierde una sola dirección',
            'Manda un solo vector al origen y deja el resto como estaba',
            'Lo aplasta contra una recta que pasa por el origen: sobrevive una sola dirección',
            'Lo aplasta en un solo punto, el origen',
          ],
          correct: 2,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'rango.ex02.1',
          type: 'codigo',
          prompt:
            'NumPy calcula el rango con `np.linalg.matrix_rank(M)`, que devuelve un número entero. Ya tienes dos matrices: `A`, de $2\\times 2$, y `B`, de $3\\times 3$. Guarda en `rA` el rango de `A` y en `rB` el de `B`.',
          hints: [
            '`np.linalg.matrix_rank` recibe la matriz y devuelve su rango.',
            'No uses el determinante: dice si el rango baja, pero no cuánto.',
          ],
          explain:
            'La función cuenta las direcciones independientes de las columnas. El determinante de una matriz con columnas dependientes sale $0$, que no es su rango.',
          solution:
            'Se escribe `rA = np.linalg.matrix_rank(A)` y `rB = np.linalg.matrix_rank(B)`. `A` tiene la segunda columna igual al doble de la primera, y su rango es $1$. `B` tiene la tercera columna igual a la suma de las dos primeras, y su rango es $2$, no $3$.',
          requirements: [
            '`rA` es un número entero: el rango de `A`.',
            '`rB` es un número entero: el rango de `B`.',
          ],
          starter: `import numpy as np

A = np.array([[1, 2], [2, 4]])
B = np.array([[1, 0, 1], [0, 1, 1], [1, 1, 2]])
# Guarda en rA el rango de A y en rB el de B
rA = None
rB = None
`,
          checks: `def _int(n):
    return isinstance(n, (int, np.integer)) and not isinstance(n, bool)

_a = _int(rA)
_b = _int(rB)
check(_a, "\`rA\` tiene que ser un número entero: el rango de \`A\`.")
check((not _a) or rA == 1, "\`rA\` tiene que valer 1: la segunda columna de \`A\` es el doble de la primera, y solo queda una dirección independiente.")
check(_b, "\`rB\` tiene que ser un número entero: el rango de \`B\`.")
check((not _b) or rB != 3, "\`rB\` vale 3, el tamaño de la matriz. Pero la tercera columna de \`B\` es la suma de las dos primeras y no aporta una dirección nueva.")
check((not _b) or rB in (2, 3), "\`rB\` tiene que valer 2: hay dos columnas independientes y la otra sobra.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 2], [2, 4]])\nB = np.array([[1, 0, 1], [0, 1, 1], [1, 1, 2]])\nrA = np.linalg.matrix_rank(A)\nrB = np.linalg.matrix_rank(B)\n',
        },
        {
          id: 'rango.ex02.2',
          type: 'codigo',
          prompt:
            'Una matriz de datos tiene una fila por muestra y una columna por característica. Aquí, `X` tiene 5 muestras y 4 características, y una de ellas se calcula a partir de otras dos. Guarda en `r` el rango de `X` y en `quitables` la lista de los índices `k` de las columnas que se pueden quitar **sin que baje el rango**. La llamada `np.delete(X, k, axis=1)` devuelve `X` sin la columna `k`.',
          hints: [
            'Recorre las columnas con `range(X.shape[1])` y, para cada una, calcula el rango de la matriz sin ella.',
            'Una columna es quitable si el rango de la matriz sin ella es el mismo que el de `X`.',
          ],
          explain:
            'Cada columna se prueba por separado: se quita, se calcula el rango y se compara con el de la matriz entera. Una columna que sobra porque se calcula con otras dos no es la única que se puede quitar: mira cuáles son las tres implicadas.',
          solution:
            'El rango de `X` es $3$. Las columnas 0, 1 y 2 están relacionadas, porque la 2 es la suma de la 0 y la 1, y quitar cualquiera de las tres deja el rango en $3$: `quitables` es `[0, 1, 2]`. La columna 3 apunta a una dirección que no tiene ninguna otra, y al quitarla el rango baja a $2$. Las tres se pueden quitar de una en una, pero no a la vez: la dependencia es de las tres juntas, no de una sola.',
          requirements: [
            '`r` es un número entero: el rango de `X`.',
            '`quitables` es una lista de índices de columna de `X`, contados desde $0$, sin repetir y en cualquier orden.',
            '`quitables` contiene todas las columnas que se pueden quitar sin que baje el rango, cada una probada por separado, y ninguna que lo haga bajar.',
          ],
          starter: `import numpy as np

X = np.array([[1, 0, 1, 1], [0, 1, 1, 0], [1, 1, 2, 0], [2, 1, 3, 1], [0, 0, 0, 1]])
# Guarda en r el rango de X y en quitables los índices de las columnas que se pueden quitar sin bajar el rango
r = None
quitables = None
`,
          checks: `def _lista(a):
    try:
        return sorted(int(k) for k in a)
    except Exception:
        return None

_r = isinstance(r, (int, np.integer)) and not isinstance(r, bool)
_q = _lista(quitables)
check(_r, "\`r\` tiene que ser un número entero: el rango de \`X\`.")
check((not _r) or r == 3, "\`r\` tiene que valer 3: de las 4 columnas de \`X\`, una se calcula con otras dos y sobra.")
check(_q is not None, "\`quitables\` tiene que ser una lista de índices de columna, por ejemplo \`[0, 1]\`.")
check((_q is None) or _q != [2], "\`quitables\` solo tiene la columna 2, que es la suma de otras dos. Pero la columna 0 también se puede quitar sin perder nada, porque se recupera como la 2 menos la 1: la dependencia es de las tres juntas.")
check((_q is None) or _q != [0, 1, 2, 3], "\`quitables\` incluye todas las columnas. Al quitar la 3 el rango sí baja, porque es la única que apunta a una dirección nueva.")
check((_q is None) or _q in ([2], [0, 1, 2, 3], [0, 1, 2]), "\`quitables\` tiene que ser la lista de las columnas cuya ausencia no cambia el rango: prueba las columnas una a una.")
`,
          reference:
            'import numpy as np\n\nX = np.array([[1, 0, 1, 1], [0, 1, 1, 0], [1, 1, 2, 0], [2, 1, 3, 1], [0, 0, 0, 1]])\nr = np.linalg.matrix_rank(X)\nquitables = [k for k in range(X.shape[1]) if np.linalg.matrix_rank(np.delete(X, k, axis=1)) == r]\n',
        },
        {
          id: 'rango.ex02.3',
          type: 'codigo',
          prompt:
            'Una matriz de rango $1$ se construye con un **producto exterior**: `np.outer(u, v)` da la matriz que tiene en la fila $i$ y la columna $j$ el producto $u_iv_j$, es decir, $\\vec{u}\\vec{v}^{\\top}$. Ya tienes `u`, de 4 números, y `v`, de 3. Guarda en `M` su producto exterior y en `r` su rango.',
          hints: [
            '`np.outer(u, v)` tiene una fila por cada número de `u` y una columna por cada número de `v`.',
            'El rango se calcula con `np.linalg.matrix_rank`, igual que con cualquier otra matriz.',
          ],
          explain:
            'Todas las filas de un producto exterior son múltiplos de una misma fila, la de `v`. Por eso sale rango $1$ por muchas filas que tenga. Si `M` sale de 3 filas y 4 columnas, el orden de `u` y `v` está cambiado.',
          solution:
            'Se escribe `M = np.outer(u, v)` y `r = np.linalg.matrix_rank(M)`. `M` es de 4 filas y 3 columnas, y todas sus filas son múltiplos de `v`: $1$, $-1$, $2$ y $0$ veces $(3, 1, 2)$. El rango es $1$.',
          requirements: [
            '`M` es un array de NumPy de 4 filas y 3 columnas: la fila $i$ y la columna $j$ contienen el producto del número $i$ de `u` por el número $j$ de `v`.',
            '`r` es un número entero: el rango de `M`.',
          ],
          starter: `import numpy as np

u = np.array([1, -1, 2, 0])
v = np.array([3, 1, 2])
# Guarda en M el producto exterior de u y v, y en r su rango
M = None
r = None
`,
          checks: `_arr = isinstance(M, np.ndarray) and np.issubdtype(M.dtype, np.number)
_m = _arr and M.shape == (4, 3)
_r = isinstance(r, (int, np.integer)) and not isinstance(r, bool)
check(_arr, "\`M\` tiene que ser un array de NumPy con números: el producto exterior de \`u\` y \`v\`.")
check((not _arr) or M.shape != (3, 4), "\`M\` es de 3 filas y 4 columnas: has puesto \`u\` y \`v\` al revés. En el producto exterior, \`u\` da las filas y \`v\` las columnas.")
check((not _arr) or M.shape in ((3, 4), (4, 3)), "\`M\` tiene que ser de 4 filas y 3 columnas: una fila por cada número de \`u\` y una columna por cada número de \`v\`.")
check((not _m) or np.allclose(M, np.outer(u, v)), "\`M\` tiene que tener en la fila \`i\` y la columna \`j\` el producto de \`u[i]\` por \`v[j]\`.")
check(_r, "\`r\` tiene que ser un número entero: el rango de \`M\`.")
check((not _r) or r == 1, "\`r\` tiene que valer 1: todas las filas de \`M\` son múltiplos de \`v\`, y solo hay una dirección independiente.")
`,
          reference:
            'import numpy as np\n\nu = np.array([1, -1, 2, 0])\nv = np.array([3, 1, 2])\nM = np.outer(u, v)\nr = np.linalg.matrix_rank(M)\n',
        },
        {
          id: 'rango.ex02.4',
          type: 'codigo',
          prompt:
            'Una capa con **cuello de botella** lleva una entrada de 5 números a 2 y la devuelve a 5: primero actúa `A`, de $2\\times 5$, y después `B`, de $5\\times 2$. Las dos juntas equivalen a una sola matriz. Guarda en `W` esa matriz única, en `r` su rango y en `invertible` si `W` puede tener inversa: un solo `True` o `False`.',
          hints: [
            'La capa que actúa primero va a la derecha del producto. `W` tiene que ser de 5 filas y 5 columnas.',
            'Una matriz cuadrada tiene inversa solo si su rango es igual a su tamaño. Compara `r` con 5.',
          ],
          explain:
            'Todo lo que sale de `W` pasó antes por un espacio de 2 números, así que no puede ocupar más de 2 direcciones, aunque `W` sea de 5 por 5. Para decidir la inversa, compara el rango con el tamaño en vez de fiarte del determinante calculado en coma flotante.',
          solution:
            'Se escribe `W = B @ A`, `r = np.linalg.matrix_rank(W)` y `invertible = r == 5`. `W` es de $5\\times 5$ pero su rango es $2$: no se puede invertir y la capa comprime la información, porque 5 números entran y solo 2 direcciones sobreviven. Cualquier `B @ A` por un cuello de 2 números tiene rango $2$ como mucho.',
          requirements: [
            '`W` es un array de NumPy con 5 filas y 5 columnas: la matriz que equivale a aplicar a una entrada primero la capa `A` y después la `B`.',
            '`r` es un número entero: el rango de `W`.',
            '`invertible` es un solo `True` o `False`, coherente con el rango de `W`: una matriz cuadrada tiene inversa solo si su rango llega a su tamaño.',
          ],
          starter: `import numpy as np

A = np.array([[1, 0, 2, 1, 0], [0, 1, 1, 0, 1]])
B = np.array([[1, 0], [0, 1], [1, 1], [2, 0], [0, 3]])
# Guarda en W la matriz única de las dos capas, en r su rango y en invertible si W puede tener inversa
W = None
r = None
invertible = None
`,
          checks: `_w = isinstance(W, np.ndarray) and np.issubdtype(W.dtype, np.number)
_ok = _w and W.shape == (5, 5)
_r = isinstance(r, (int, np.integer)) and not isinstance(r, bool)
_b = isinstance(invertible, (bool, np.bool_))
check(_w, "\`W\` tiene que ser un array de NumPy con números: la matriz única que equivale a las dos capas.")
check((not _w) or W.shape != (2, 2), "\`W\` es de 2 filas y 2 columnas: has multiplicado \`A @ B\`. La capa que actúa primero, \`A\`, va a la derecha: la matriz que lleva 5 números a 5 es \`B @ A\`.")
check((not _w) or W.shape in ((2, 2), (5, 5)), "\`W\` tiene que ser una matriz de 5 filas y 5 columnas: lleva la entrada de 5 números a una salida de 5.")
check((not _ok) or np.allclose(W, B @ A), "\`W\` tiene que ser la segunda capa por la primera, \`B @ A\`.")
check(_r, "\`r\` tiene que ser un número entero: el rango de \`W\`.")
check((not _r) or r != 5, "\`r\` vale 5, el tamaño de \`W\`. Pero todo lo que sale de \`W\` ha pasado por un cuello de 2 números, y el rango no puede superar 2.")
check((not _r) or r in (2, 5), "\`r\` tiene que valer 2: el cuello de botella solo deja pasar 2 direcciones.")
check(_b, "\`invertible\` tiene que ser un solo \`True\` o \`False\`.")
check((not _b) or not bool(invertible), "\`invertible\` vale \`True\`, pero \`W\` no tiene inversa: su rango es menor que su tamaño, y la información que se pierde en el cuello no se recupera.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 0, 2, 1, 0], [0, 1, 1, 0, 1]])\nB = np.array([[1, 0], [0, 1], [1, 1], [2, 0], [0, 3]])\nW = B @ A\nr = np.linalg.matrix_rank(W)\ninvertible = r == W.shape[0]\n',
        },
        {
          id: 'rango.ex02.5',
          type: 'codigo',
          prompt:
            'Una capa de un modelo tiene una matriz de $768\\times 768$: unos $590000$ números. Si se sabe que su rango es como mucho $64$, se puede guardar como `B @ A`, con `B` de $768\\times 64$ y `A` de $64\\times 768$. Con `d` y `r` ya definidos, guarda en `n_densa` cuántos números tiene la matriz entera, en `n_baja` cuántos tienen `B` y `A` juntas, y en `razon` cuántas veces es mayor `n_densa` que `n_baja`.',
          hints: [
            'Una matriz de `f` filas y `c` columnas tiene `f * c` números. Haz el cálculo con `d` y `r`.',
            '`B` tiene `d` filas y `r` columnas, y `A` tiene `r` filas y `d` columnas.',
          ],
          explain:
            'Hay que sumar los números de las dos matrices pequeñas, no quedarse con una. Y la razón pedida es la de la matriz entera frente a las dos pequeñas, y no al revés.',
          solution:
            'La matriz entera tiene `d * d` $=589824$ números. `B` y `A` juntas tienen `d * r + r * d` $=98304$. La razón es $6$: guardar la matriz de rango bajo ocupa seis veces menos. Es la idea que permite ajustar modelos enormes con muy pocos números, y que se verá más adelante.',
          requirements: [
            '`n_densa` es un número: cuántos números tiene la matriz entera de $768\\times 768$.',
            '`n_baja` es un número: cuántos números tienen `B` y `A` juntas.',
            '`razon` es un número: el cociente de `n_densa` entre `n_baja`, y no al revés.',
          ],
          starter: `import numpy as np

d = 768  # tamaño de la entrada y de la salida
r = 64   # rango máximo
# Guarda en n_densa los números de la matriz de d por d, en n_baja los de B y A juntas, y en razon n_densa entre n_baja
n_densa = None
n_baja = None
razon = None
`,
          checks: `def _num(n):
    return isinstance(n, (int, float, np.integer, np.floating)) and not isinstance(n, bool)

_a = _num(n_densa)
_b = _num(n_baja)
_z = _num(razon)
check(_a, "\`n_densa\` tiene que ser un número: cuántos números tiene una matriz de 768 por 768.")
check((not _a) or n_densa == 589824, "\`n_densa\` tiene que valer 589824: 768 filas por 768 columnas.")
check(_b, "\`n_baja\` tiene que ser un número: los números de \`B\` y de \`A\` juntas.")
check((not _b) or n_baja != 49152, "\`n_baja\` vale 49152, la mitad: falta una de las dos matrices. \`B\` tiene 768 por 64 números y \`A\` tiene otros 64 por 768.")
check((not _b) or n_baja in (49152, 98304), "\`n_baja\` tiene que valer 98304: los números de \`B\` más los de \`A\`.")
check(_z, "\`razon\` tiene que ser un número: cuántas veces cabe \`n_baja\` en \`n_densa\`.")
check((not _z) or abs(razon - 1 / 6) > 1e-9, "\`razon\` está al revés: es \`n_baja\` entre \`n_densa\`. Tiene que ser la matriz entera dividida entre las dos pequeñas.")
check((not _z) or abs(razon - 1 / 6) < 1e-9 or abs(razon - 6) < 1e-9, "\`razon\` tiene que valer 6: la matriz entera tiene seis veces más números que las dos pequeñas.")
`,
          reference:
            'import numpy as np\n\nd = 768\nr = 64\nn_densa = d * d\nn_baja = d * r + r * d\nrazon = n_densa / n_baja\n',
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'rango.hoja.1',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento habla de una matriz $A$ de $2\\times 2$ con determinante $0$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Si el determinante es $0$, ¿cuántas direcciones sobreviven como mínimo? ¿Puede no sobrevivir ninguna?',
        'Recuerda qué matriz es la única con rango $0$.',
      ],
      explain:
        'Revisa cada paso y comprueba si la conclusión se sigue de lo que se ha establecido antes. Pregúntate qué dice exactamente un determinante nulo.',
      solution:
        'La tercera línea está mal. El determinante $0$ solo dice que el rango es menor que $2$. Si la imagen es una recta, sobrevive una dirección y el rango es $1$; el rango $0$ solo lo tiene la matriz nula, cuya imagen es un solo punto.',
      lines: [
        'A es de 2×2 y su determinante es 0',
        'Con determinante 0 el plano se aplasta: la imagen de A es una recta o un solo punto',
        'Luego A no deja pasar ninguna dirección: el rango de A es 0',
      ],
      faultyLine: 2,
    },
    {
      id: 'rango.hoja.2',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere guardar en `r` el rango de `A`. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Mira la segunda fila de `A` y compárala con la primera.',
        '`A.any(axis=1)` dice, para cada fila, si tiene algún número distinto de cero. ¿Basta eso para contar direcciones independientes?',
      ],
      explain:
        'Contar filas que no son todo ceros no cuenta direcciones independientes: una fila puede no ser nula y aun así repetir a otra. Compara lo que calcula la línea con lo que mide el rango.',
      solution:
        'La segunda línea está mal. Cuenta 3 filas no nulas, pero la segunda fila es el doble de la primera y no aporta una dirección nueva: el rango es $2$. Se obtiene con `r = np.linalg.matrix_rank(A)`. Contar las filas no nulas solo sirve cuando la matriz ya está reducida.',
      lines: [
        'A = np.array([[1, 2, 3], [2, 4, 6], [1, 0, 1]])',
        'r = np.count_nonzero(A.any(axis=1))',
        'print(r)',
      ],
      faultyLine: 1,
    },
    {
      id: 'rango.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento habla de una capa con cuello de botella, $W=BA$, con $B$ de $5\\times 2$ y $A$ de $2\\times 5$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Piensa en qué espacio caen las columnas de $W$.',
        'Compara el rango con el tamaño de $W$ para decidir si tiene inversa.',
      ],
      explain: 'Revisa cada paso y comprueba si la conclusión se sigue de los pasos anteriores.',
      solution:
        'No hay ningún error. Cada columna de $W$ es una combinación de las 2 columnas de $B$, así que la imagen de $W$ no pasa de un plano: rango $2$ como mucho en una matriz de $5\\times 5$, y por eso no tiene inversa.',
      lines: [
        'W = BA es de 5×5, y cada columna de W es B por una columna de A',
        'Luego cada columna de W es una combinación de las 2 columnas de B',
        'Por eso el rango de W es 2 como mucho y W no se puede invertir: la información pasa por un cuello de 2 números',
      ],
      faultyLine: null,
    },
  ],
};
