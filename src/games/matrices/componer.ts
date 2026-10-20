import type { Goal, Project } from '../../content/schema';
import { transformPlane } from './plane';

/** Metas de un `manipular` de matriz: î y ĵ en el sitio de las columnas de la matriz pedida. */
const columns = (i: [number, number], j: [number, number]): Goal[] => [
  { metric: 'x', of: ['i'], target: i[0], tol: 0.01 },
  { metric: 'y', of: ['i'], target: i[1], tol: 0.01 },
  { metric: 'x', of: ['j'], target: j[0], tol: 0.01 },
  { metric: 'y', of: ['j'], target: j[1], tol: 0.01 },
];

/** Primer proyecto de la Órbita 0 de matrices: componer transformaciones y multiplicar matrices. */
export const componer: Project = {
  id: 'componer',
  name: 'Componer',
  sub: 'Una transformación tras otra',
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'componer.ex00.1',
          type: 'manipular',
          prompt:
            'Dos transformaciones seguidas se pueden resumir en **una sola matriz**: el **producto**. Se lee de derecha a izquierda: en $SR$ actúa primero $R$ y después $S$, porque $SR\\vec{v}=S(R\\vec{v})$.\n\n$R$ es el giro de un cuarto de vuelta en sentido antihorario y $S=\\begin{pmatrix}2&0\\\\0&1\\end{pmatrix}$ estira el plano al doble en horizontal. Construye $C=SR$, la matriz de «gira un cuarto de vuelta y después estira». Sigue a $\\hat{\\imath}$ y a $\\hat{\\jmath}$ por las dos transformaciones, una tras otra, y coloca sus puntas donde terminan.',
          hints: [
            'Empieza por $\\hat{\\imath}$: el giro lo lleva a $(0, 1)$. Estira ahora ese punto al doble en horizontal: ¿dónde queda?',
            'Haz lo mismo con $\\hat{\\jmath}$: el giro lo lleva a $(-1, 0)$, y después hay que estirarlo.',
          ],
          explain:
            'Las columnas del producto son las imágenes de $\\hat{\\imath}$ y $\\hat{\\jmath}$ por la transformación completa: cada flecha pasa por el primer paso y, con lo que sale, por el segundo.',
          solution:
            'El giro lleva $\\hat{\\imath}$ a $(0, 1)$, y el estiramiento horizontal lo deja ahí, porque su $x$ es $0$. El giro lleva $\\hat{\\jmath}$ a $(-1, 0)$, y el estiramiento lo duplica: $(-2, 0)$. Así, $C=SR=\\begin{pmatrix}0&-2\\\\1&0\\end{pmatrix}$.',
          plane: transformPlane({ movable: true, readouts: ['matrix'] }),
          goals: columns([0, 1], [-2, 0]),
        },
        {
          id: 'componer.ex00.2',
          type: 'manipular',
          prompt:
            'El orden importa. Construye ahora $C=RS$: primero se estira el plano al doble en horizontal ($S$) y después se gira un cuarto de vuelta en sentido antihorario ($R$). Son las mismas dos transformaciones de antes, en el orden contrario. Coloca las puntas de $\\hat{\\imath}$ y $\\hat{\\jmath}$ donde terminan.',
          hints: [
            '$\\hat{\\imath}$ empieza en $(1, 0)$: el estiramiento lo deja en $(2, 0)$. Gira ahora ese punto un cuarto de vuelta.',
            'Para $\\hat{\\jmath}$, el estiramiento horizontal no lo cambia, y solo queda girarlo.',
          ],
          explain:
            'La primera en actuar es la transformación de la derecha. Esta vez es el estiramiento, y el giro actúa sobre lo que sale de él, no sobre las flechas originales.',
          solution:
            'El estiramiento deja a $\\hat{\\imath}$ en $(2, 0)$ y el giro lo sube a $(0, 2)$. Deja a $\\hat{\\jmath}$ en $(0, 1)$ y el giro lo lleva a $(-1, 0)$. Así, $RS=\\begin{pmatrix}0&-1\\\\2&0\\end{pmatrix}$, distinta de $SR=\\begin{pmatrix}0&-2\\\\1&0\\end{pmatrix}$: el producto de matrices no es conmutativo.',
          plane: transformPlane({ movable: true, readouts: ['matrix'] }),
          goals: columns([0, 2], [-1, 0]),
        },
        {
          id: 'componer.ex00.3',
          type: 'manipular',
          prompt:
            'La **inclinación horizontal** $H=\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$ deja a $\\hat{\\imath}$ quieto y lleva a $\\hat{\\jmath}$ a $(1, 1)$. Aplicarla dos veces seguidas es la matriz $H^2=HH$. Construye $H^2$: sigue a $\\hat{\\jmath}$ por dos inclinaciones.',
          hints: [
            'La primera inclinación lleva a $\\hat{\\jmath}$ a $(1, 1)$. Inclina ese punto otra vez: la inclinación suma su $y$ a su $x$.',
            '$\\hat{\\imath}$ está sobre el eje $x$, y la inclinación no lo mueve en ninguna de las dos veces.',
          ],
          explain:
            'Aplicar la misma matriz dos veces es multiplicarla por sí misma. La segunda inclinación actúa sobre el punto al que ya ha llegado la primera, no sobre $\\hat{\\jmath}$.',
          solution:
            'La primera inclinación lleva a $\\hat{\\jmath}$ a $(1, 1)$ y la segunda, a $(1+1,\\ 1)=(2, 1)$. $\\hat{\\imath}$ se queda en $(1, 0)$. Así, $H^2=\\begin{pmatrix}1&2\\\\0&1\\end{pmatrix}$: inclinar dos veces es inclinar el doble.',
          plane: transformPlane({ movable: true, readouts: ['matrix'] }),
          goals: columns([1, 0], [2, 1]),
        },
        {
          id: 'componer.ex00.4',
          type: 'manipular',
          prompt:
            'Reflejar respecto del eje $x$ cambia el signo de la $y$ de cada punto, y reflejar respecto del eje $y$ cambia el de la $x$. Construye la matriz de «primero reflejar respecto del eje $x$ y después respecto del eje $y$». Cuando la tengas, mira qué transformación conocida es.',
          hints: [
            'Sigue a $\\hat{\\imath}=(1, 0)$: el primer espejo no lo mueve, porque está sobre el eje $x$. El segundo le cambia la $x$.',
            'Sigue a $\\hat{\\jmath}=(0, 1)$: el primer espejo le cambia la $y$, y el segundo no lo mueve, porque está sobre el eje $y$.',
          ],
          explain:
            'Cada espejo cambia el signo de una coordenada. Aplicados uno tras otro se cambian las dos, así que mira cada flecha en las dos reflexiones.',
          solution:
            'Con el primer espejo, $\\hat{\\imath}$ sigue en $(1, 0)$, y el segundo lo lleva a $(-1, 0)$. $\\hat{\\jmath}$ pasa a $(0, -1)$ con el primero, y el segundo lo deja ahí. La matriz es $\\begin{pmatrix}-1&0\\\\0&-1\\end{pmatrix}$, un giro de media vuelta: dos reflexiones seguidas, en ejes perpendiculares, equivalen a ese giro.',
          plane: transformPlane({ movable: true, readouts: ['matrix'] }),
          goals: columns([-1, 0], [0, -1]),
        },
        {
          id: 'componer.ex00.5',
          type: 'manipular',
          prompt:
            'Gira el plano un cuarto de vuelta en sentido antihorario, $R=\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$, **tres veces seguidas**: es la matriz $R^3=RRR$. Coloca $\\hat{\\imath}$ y $\\hat{\\jmath}$ donde terminan tras los tres giros.',
          hints: [
            'Cada giro lleva la punta de $\\hat{\\imath}$ a la siguiente posición: $(1, 0)$, $(0, 1)$, $(-1, 0)$… Sigue contando hasta el tercer giro.',
            'Haz lo mismo con $\\hat{\\jmath}$, que arranca arriba y recorre su propio círculo.',
          ],
          explain:
            'Cada giro actúa sobre la posición a la que ha llegado la flecha con el anterior. Cuenta las posiciones sucesivas de cada punta, sin saltarte ninguna.',
          solution:
            '$\\hat{\\imath}$ recorre $(1, 0)\\to(0, 1)\\to(-1, 0)\\to(0, -1)$ y acaba en $(0, -1)$. $\\hat{\\jmath}$ recorre $(0, 1)\\to(-1, 0)\\to(0, -1)\\to(1, 0)$ y acaba en $(1, 0)$. Así, $R^3=\\begin{pmatrix}0&1\\\\-1&0\\end{pmatrix}$, un cuarto de vuelta en sentido horario: tres cuartos antihorarios dan lo mismo.',
          plane: transformPlane({ movable: true, readouts: ['matrix'] }),
          goals: columns([0, -1], [1, 0]),
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'componer.ex01.1',
          type: 'vector',
          prompt:
            'Calcula $AB$ con $A=\\begin{pmatrix}2&1\\\\0&3\\end{pmatrix}$ y $B=\\begin{pmatrix}1&-1\\\\2&0\\end{pmatrix}$. Cada columna de $AB$ es $A$ multiplicada por la columna correspondiente de $B$. Escribe la matriz en las cuatro casillas.',
          hints: [
            'La primera columna de $AB$ es $A\\begin{pmatrix}1\\\\2\\end{pmatrix}$: cada componente sale de una fila de $A$ por esa columna.',
            'La segunda columna de $AB$ es $A\\begin{pmatrix}-1\\\\0\\end{pmatrix}$.',
          ],
          explain:
            'Para cada columna de $B$ se hace una multiplicación de matriz por vector. Las columnas obtenidas se colocan en el mismo orden: la primera columna de $B$ da la primera de $AB$.',
          solution:
            'Primera columna: $A\\begin{pmatrix}1\\\\2\\end{pmatrix}=\\begin{pmatrix}2\\cdot 1+1\\cdot 2\\\\0\\cdot 1+3\\cdot 2\\end{pmatrix}=\\begin{pmatrix}4\\\\6\\end{pmatrix}$. Segunda: $A\\begin{pmatrix}-1\\\\0\\end{pmatrix}=\\begin{pmatrix}-2\\\\0\\end{pmatrix}$. Luego $AB=\\begin{pmatrix}4&-2\\\\6&0\\end{pmatrix}$. Si colocas las columnas como filas, sale la traspuesta.',
          shape: [2, 2],
          answer: [4, -2, 6, 0],
          tol: 0,
        },
        {
          id: 'componer.ex01.2',
          type: 'opcion',
          prompt:
            'Sean $A=\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$ y $B=\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$. Calcula $AB$ y $BA$ y compáralas. ¿Qué ocurre?',
          hints: [
            'Haz las dos multiplicaciones completas, columna a columna.',
            'La primera columna de $AB$ es $A$ por $(0, 1)$, y la de $BA$ es $B$ por $(1, 0)$.',
          ],
          explain:
            'Calcula los dos productos enteros y compáralos entrada a entrada: basta un número distinto para que no sean iguales.',
          solution:
            '$AB=\\begin{pmatrix}1&-1\\\\1&0\\end{pmatrix}$ y $BA=\\begin{pmatrix}0&-1\\\\1&1\\end{pmatrix}$, que no coinciden. $AB$ aplica primero $B$ y $BA$ aplica primero $A$, y el resultado depende del orden. Los dos productos están definidos, porque las dos matrices son de $2\\times 2$, pero poder calcular los dos no los hace iguales.',
          options: [
            'Son iguales, como al multiplicar números: el orden de los factores no altera el producto',
            'No son iguales: $AB$ hace primero $B$ y después $A$, y $BA$ lo hace al revés',
            'Son iguales, porque las dos matrices tienen el mismo tamaño',
            'Solo se puede calcular $AB$: $BA$ no está definido',
          ],
          correct: 1,
        },
        {
          id: 'componer.ex01.3',
          type: 'vector',
          prompt:
            'Una matriz $A$ de $3\\times 5$ se multiplica por una matriz $B$ de $5\\times 2$. El producto $AB$ está definido, porque los tamaños interiores coinciden (5 y 5). ¿Qué tamaño tiene $AB$? Escribe primero las filas y después las columnas.',
          hints: [
            'Cada entrada de $AB$ sale de una fila de $A$ y una columna de $B$.',
            'El resultado tiene tantas filas como $A$ y tantas columnas como $B$.',
          ],
          explain:
            'En el producto, los tamaños interiores se cancelan y los exteriores quedan. Piensa cuántas filas aporta $A$ y cuántas columnas aporta $B$.',
          solution:
            '$AB$ es de $3\\times 2$: las 3 filas de $A$ y las 2 columnas de $B$. El 5 de en medio desaparece: es la cantidad de números que se multiplican y suman para calcular cada entrada.',
          answer: [3, 2],
          tol: 0,
        },
        {
          id: 'componer.ex01.4',
          type: 'opcion',
          prompt:
            'Tres matrices tienen estos tamaños: $A$ es de $2\\times 3$, $B$ de $3\\times 4$ y $C$ de $4\\times 2$. Un producto solo está definido si las columnas de la primera matriz son tantas como las filas de la segunda. ¿Cuál de estos productos NO está definido?',
          hints: [
            'Para cada producto, compara el segundo número del tamaño de la primera matriz con el primero del tamaño de la segunda.',
            'En $AB$, por ejemplo, se compara 3 con 3, y coinciden.',
          ],
          explain:
            'Revisa los cuatro productos uno por uno, mirando solo los dos tamaños interiores.',
          solution:
            '$AB$ es $(2\\times 3)(3\\times 4)$ y da $2\\times 4$. $BC$ es $(3\\times 4)(4\\times 2)$ y da $3\\times 2$. $CA$ es $(4\\times 2)(2\\times 3)$ y da $4\\times 3$. En $AC$, $(2\\times 3)(4\\times 2)$, los tamaños interiores son 3 y 4: no coinciden, y el producto no está definido.',
          options: ['$AB$', '$BC$', '$CA$', '$AC$'],
          correct: 3,
        },
        {
          id: 'componer.ex01.5',
          type: 'vector',
          prompt:
            'Una red tiene dos capas lineales seguidas, sin función de activación en medio. La primera, $W_1$, es de $8\\times 4$: lleva una entrada de 4 componentes a 8. La segunda, $W_2$, es de $3\\times 8$: lleva esas 8 a 3. La salida es $\\vec{y}=W_2(W_1\\vec{x})$. Dos capas así equivalen a **una sola** matriz $W$ con $\\vec{y}=W\\vec{x}$. Escribe su tamaño: primero las filas y después las columnas.',
          hints: [
            '$W$ lleva el mismo $\\vec{x}$ de 4 componentes a la misma $\\vec{y}$ de 3: ¿cuántas columnas y cuántas filas hacen falta?',
            'También puedes pensar en el producto $W_2W_1$ y quitar los tamaños interiores.',
          ],
          explain:
            'La matriz única tiene que aceptar la misma entrada y dar la misma salida que las dos capas juntas. De ahí salen sus dos tamaños.',
          solution:
            '$W=W_2W_1$ es el producto $(3\\times 8)(8\\times 4)$, de tamaño $3\\times 4$: el 8 intermedio desaparece. Es la clave de por qué entre capas hace falta una función no lineal: sin ella, apilar capas lineales no añade capacidad, porque todas se funden en una sola matriz.',
          answer: [3, 4],
          tol: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'componer.ex02.1',
          type: 'codigo',
          prompt:
            'En NumPy, `A @ B` entre dos matrices es su producto: la matriz que aplica primero `B` y después `A`. Ya tienes las matrices `A` y `B`. Guarda en `C` el producto de `A` por `B`.',
          hints: [
            'El operador `@` multiplica matrices igual que multiplica una matriz por un vector.',
            'La matriz que se aplica primero se escribe a la derecha.',
          ],
          explain:
            'El operador `@` entre matrices calcula el producto, con el orden de la escritura matemática: la matriz de la derecha actúa primero. Si sale una matriz con los productos entrada a entrada, se ha usado otra operación.',
          solution:
            'Se escribe `C = A @ B`, que vale $\\begin{pmatrix}4&6\\\\1&3\\end{pmatrix}$ y aplica primero `B` y después `A`. Con `A * B` se multiplicaría entrada a entrada y saldría $\\begin{pmatrix}2&0\\\\0&3\\end{pmatrix}$, que no es la composición.',
          requirements: [
            '`C` existe y es un array de NumPy con números, de 2 filas y 2 columnas.',
            '`C` es el producto de matrices de `A` por `B`, que aplica primero `B` y después `A`: no vale el producto entrada a entrada ni el producto en el orden contrario.',
          ],
          starter: `import numpy as np

A = np.array([[1, 2], [0, 1]])
B = np.array([[2, 0], [1, 3]])
# Guarda en C el producto de A por B
C = None
`,
          checks: `_arr = isinstance(C, np.ndarray) and np.issubdtype(C.dtype, np.number)
_ok = _arr and C.shape == (2, 2)
_elem = _ok and np.allclose(C, A * B)
_rev = _ok and np.allclose(C, B @ A)
check(_arr, "\`C\` tiene que ser un array de NumPy con números: la matriz producto.")
check((not _arr) or C.shape == (2, 2), "\`C\` tiene que ser una matriz de 2 filas y 2 columnas.")
check((not _ok) or not _elem, "\`C\` sale de multiplicar entrada a entrada, con \`*\`. El producto de matrices es otra operación, y se escribe con \`@\`.")
check((not _ok) or not _rev, "\`C\` es el producto en orden contrario: el de \`B\` por \`A\`. La matriz que actúa primero va a la derecha.")
check((not _ok) or _elem or _rev or np.allclose(C, [[4, 6], [1, 3]]), "\`C\` tiene que valer (4, 6) en la primera fila y (1, 3) en la segunda: cada entrada sale de una fila de \`A\` por una columna de \`B\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 2], [0, 1]])\nB = np.array([[2, 0], [1, 3]])\nC = A @ B\n',
        },
        {
          id: 'componer.ex02.2',
          type: 'codigo',
          prompt:
            'Cada columna de un producto es la matriz de la izquierda por la columna correspondiente de la de la derecha: la primera columna de $AB$ es $A$ por la primera columna de $B$. Ya tienes `A` y `B`. Calcula una a una las dos columnas de $AB$ y guárdalas en `col0` y `col1`; guarda en `C` la matriz que las tiene por columnas. La columna `k` de `B` se coge con `B[:, k]`.',
          hints: [
            '`B[:, 0]` es la primera columna de `B`. Multiplica `A` por ella con `@`.',
            'Para juntar dos columnas en una matriz, `np.column_stack([col0, col1])` las coloca una al lado de la otra.',
          ],
          explain:
            'Cada columna de `C` es la imagen por `A` de una columna de `B`. Al juntarlas tienen que quedar como columnas, no como filas.',
          solution:
            'Se escribe `col0 = A @ B[:, 0]`, `col1 = A @ B[:, 1]` y `C = np.column_stack([col0, col1])`. Con los datos, `col0` vale $(7, 6)$ y `col1` vale $(2, 6)$, y `C` es $\\begin{pmatrix}7&2\\\\6&6\\end{pmatrix}$, igual que el producto completo. Si las juntas con `np.array([col0, col1])`, salen como filas y la matriz queda traspuesta.',
          requirements: [
            '`col0` y `col1` existen y son arrays de NumPy con 2 componentes, todas números.',
            '`col0` y `col1` son la primera y la segunda columna de $AB$, cada una calculada con una columna de `B` y no con una fila.',
            '`C` existe y es un array de NumPy con números, de 2 filas y 2 columnas, que tiene `col0` como primera columna y `col1` como segunda: no vale ponerlas como filas.',
          ],
          starter: `import numpy as np

A = np.array([[1, 2], [3, 1]])
B = np.array([[1, 2], [3, 0]])
# Guarda en col0 y col1 las columnas de AB, y en C la matriz con esas columnas
col0 = None
col1 = None
C = None
`,
          checks: `def _v(a):
    return isinstance(a, np.ndarray) and a.shape == (2,) and np.issubdtype(a.dtype, np.number)

_m = isinstance(C, np.ndarray) and C.shape == (2, 2) and np.issubdtype(C.dtype, np.number)
check(_v(col0), "\`col0\` tiene que ser un array de NumPy con 2 números: la primera columna del producto.")
check((not _v(col0)) or np.allclose(col0, [7, 6]), "\`col0\` tiene que valer (7, 6): es \`A\` multiplicada por la primera columna de \`B\`, que se coge con \`B[:, 0]\`. Con \`B[0]\` se coge la primera fila.")
check(_v(col1), "\`col1\` tiene que ser un array de NumPy con 2 números: la segunda columna del producto.")
check((not _v(col1)) or np.allclose(col1, [2, 6]), "\`col1\` tiene que valer (2, 6): es \`A\` multiplicada por la segunda columna de \`B\`, que se coge con \`B[:, 1]\`.")
check(_m, "\`C\` tiene que ser una matriz de NumPy de 2 filas y 2 columnas, con \`col0\` y \`col1\` como columnas.")
check((not _m) or not np.allclose(C, [[7, 6], [2, 6]]), "\`C\` está traspuesta: \`col0\` y \`col1\` han quedado como filas. Para colocarlas como columnas sirve \`np.column_stack\`.")
check((not _m) or np.allclose(C, [[7, 6], [2, 6]]) or np.allclose(C, [[7, 2], [6, 6]]), "\`C\` tiene que valer (7, 2) en la primera fila y (6, 6) en la segunda: \`col0\` es su primera columna y \`col1\` la segunda.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 2], [3, 1]])\nB = np.array([[1, 2], [3, 0]])\ncol0 = A @ B[:, 0]\ncol1 = A @ B[:, 1]\nC = np.column_stack([col0, col1])\n',
        },
        {
          id: 'componer.ex02.3',
          type: 'codigo',
          prompt:
            'Una transformación compuesta aplica varias matrices **en el orden dado**: la primera de la lista actúa primero. Escribe `componer(lista)`, que recibe una lista de matrices de $2\\times 2$ y devuelve la matriz que las aplica en ese orden. Después, guarda en `C` lo que devuelve para `[R, S]`: primero el giro `R` y luego el estiramiento `S`.',
          hints: [
            'Con la lista `[R, S]`, la matriz tiene que ser $SR$: la que actúa primero va a la derecha del producto.',
            'Un bucle puede acumular el resultado: empieza por la identidad, `np.eye(2)`, y multiplica cada matriz nueva por la izquierda de lo acumulado.',
          ],
          explain:
            'Cada matriz nueva actúa después de las anteriores, así que se coloca a la izquierda de lo que ya hay. Si se coloca a la derecha, la composición sale en el orden contrario.',
          solution:
            'Se parte de la identidad y, para cada matriz `N` de la lista, se hace `M = N @ M`: la nueva queda a la izquierda. Con `[R, S]` sale `S @ R`, es decir $\\begin{pmatrix}0&-2\\\\1&0\\end{pmatrix}$. Con `M = M @ N` la composición saldría al revés, como `R @ S`, que es $\\begin{pmatrix}0&-1\\\\2&0\\end{pmatrix}$.',
          requirements: [
            '`componer` existe y es una función que recibe una lista de matrices de $2\\times 2$.',
            'La función devuelve un array de NumPy con números, de 2 filas y 2 columnas, que aplica las matrices de la lista en el orden dado: la primera de la lista actúa primero.',
            'Se prueba con otras listas además de `[R, S]`, entre ellas la misma en el orden contrario y una con tres matrices, y la función no puede dar ningún error con ellas.',
            '`C` es lo que devuelve `componer` para la lista de `R` y `S`.',
          ],
          starter: `import numpy as np

R = np.array([[0, -1], [1, 0]])
S = np.array([[2, 0], [0, 1]])


def componer(lista):
    # Devuelve la matriz que aplica las de la lista en orden: la primera de la lista actúa primero
    return None


# Guarda en C lo que devuelve componer para la lista [R, S]
C = None
`,
          checks: `_R = np.array([[0, -1], [1, 0]])
_S = np.array([[2, 0], [0, 1]])
_H = np.array([[1, 1], [0, 1]])
_f = callable(globals().get("componer"))
def _call(*args):
    try:
        return componer(*args)
    except Exception:
        return None
def _mat(m):
    return isinstance(m, np.ndarray) and m.shape == (2, 2) and np.issubdtype(m.dtype, np.number)
_a = _call([_R, _S]) if _f else None
_b = _call([_S, _R]) if _f else None
_c = _call([_R, _S, _H]) if _f else None
_all = _f and _mat(_a) and _mat(_b) and _mat(_c)
_rev = _all and np.allclose(_a, _R @ _S) and np.allclose(_b, _S @ _R) and np.allclose(_c, _R @ _S @ _H)
_good = _all and np.allclose(_a, _S @ _R) and np.allclose(_b, _R @ _S) and np.allclose(_c, _H @ _S @ _R)
check(_f, "Hay que definir una función \`componer\` que reciba la lista de matrices.")
check((not _f) or _all, "\`componer\` tiene que devolver una matriz de NumPy de 2 filas y 2 columnas.")
check((not _all) or not _rev, "\`componer\` devuelve el producto en orden contrario: la primera matriz de la lista es la que actúa primero, y la que actúa primero va a la derecha del producto.")
check((not _all) or _rev or _good, "Con la lista de \`R\` y \`S\` la función tiene que devolver la matriz que gira primero y estira después, \`S\` por \`R\`. Cada matriz nueva de la lista se multiplica por la izquierda de lo acumulado.")
check((not _good) or (_mat(C) and np.allclose(C, _S @ _R)), "\`C\` tiene que ser lo que devuelve \`componer\` con la lista de \`R\` y \`S\`.")
`,
          reference: `import numpy as np

R = np.array([[0, -1], [1, 0]])
S = np.array([[2, 0], [0, 1]])


def componer(lista):
    M = np.eye(2)
    for N in lista:
        M = N @ M
    return M


C = componer([R, S])
`,
        },
        {
          id: 'componer.ex02.4',
          type: 'codigo',
          prompt:
            'Con matrices el orden importa: `A @ B` y `B @ A` casi nunca coinciden. Ya tienes `A`, una inclinación, y `B`, un estiramiento. Guarda en `AB` el producto de `A` por `B`, en `BA` el de `B` por `A`, y en `iguales` si las dos matrices son iguales: un solo `True` o `False`. Para comparar matrices, `np.allclose(X, Y)` devuelve un solo valor.',
          hints: [
            '`np.allclose(X, Y)` compara dos arrays entrada a entrada y devuelve un solo valor.',
            'El operador `==` entre arrays devuelve otro array de `True` y `False`, no un solo valor.',
          ],
          explain:
            'Los dos productos usan los mismos factores en distinto orden: se calcula cada uno por separado y se comparan al final. Para obtener un único valor, hay que comparar con una función y no con el operador de igualdad.',
          solution:
            '`AB = A @ B` vale $\\begin{pmatrix}2&1\\\\0&1\\end{pmatrix}$ y `BA = B @ A` vale $\\begin{pmatrix}2&2\\\\0&1\\end{pmatrix}$. Se comparan con `np.allclose(AB, BA)`, que da `False`. Estirar y después inclinar ($AB$) no es lo mismo que inclinar y después estirar ($BA$).',
          requirements: [
            '`AB` y `BA` existen y son arrays de NumPy con números, de 2 filas y 2 columnas: el producto de `A` por `B` y el de `B` por `A`, cada uno en su orden.',
            '`iguales` existe y es un solo `True` o `False`, no una matriz de valores: dice si `AB` y `BA` son iguales.',
          ],
          starter: `import numpy as np

A = np.array([[1, 1], [0, 1]])
B = np.array([[2, 0], [0, 1]])
# Guarda en AB el producto de A por B, en BA el de B por A, y en iguales si son iguales
AB = None
BA = None
iguales = None
`,
          checks: `def _mat(m):
    return isinstance(m, np.ndarray) and m.shape == (2, 2) and np.issubdtype(m.dtype, np.number)

_ab = _mat(AB)
_ba = _mat(BA)
_b = isinstance(iguales, (bool, np.bool_))
check(_ab, "\`AB\` tiene que ser una matriz de NumPy de 2 filas y 2 columnas: el producto de \`A\` por \`B\`.")
check((not _ab) or np.allclose(AB, [[2, 1], [0, 1]]), "\`AB\` tiene que valer (2, 1) en la primera fila y (0, 1) en la segunda: es el producto de \`A\` por \`B\`, que aplica primero \`B\`.")
check(_ba, "\`BA\` tiene que ser una matriz de NumPy de 2 filas y 2 columnas: el producto de \`B\` por \`A\`.")
check((not _ba) or np.allclose(BA, [[2, 2], [0, 1]]), "\`BA\` tiene que valer (2, 2) en la primera fila y (0, 1) en la segunda: es el producto de \`B\` por \`A\`, que aplica primero \`A\`.")
check(_b, "\`iguales\` tiene que ser un solo \`True\` o \`False\`. La comparación con \`==\` da una matriz de valores; \`np.allclose\` da uno solo.")
check((not _b) or not bool(iguales), "\`iguales\` vale \`True\`, pero \`AB\` y \`BA\` no coinciden: el orden de los factores sí altera el producto de matrices.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 1], [0, 1]])\nB = np.array([[2, 0], [0, 1]])\nAB = A @ B\nBA = B @ A\niguales = np.allclose(AB, BA)\n',
        },
        {
          id: 'componer.ex02.5',
          type: 'codigo',
          prompt:
            'Una red tiene dos capas lineales seguidas, sin función de activación entre ellas: primero `W1` y después `W2`, así que para una entrada `x` la salida es `W2 @ (W1 @ x)`. Ya tienes las dos matrices y la entrada. Guarda en `W` la matriz única que equivale a las dos capas, y en `y` la salida de esa capa única para `x`.',
          hints: [
            'La capa que actúa primero va a la derecha del producto.',
            'La salida de la capa única se calcula como la de cualquier capa lineal: la matriz multiplicada por la entrada.',
          ],
          explain:
            'La capa que actúa después va a la izquierda del producto. Comprueba los tamaños: la matriz única tiene que llevar la entrada de 2 componentes a una salida de 2, y si sale de $3\\times 3$ las capas están al revés.',
          solution:
            'Se escribe `W = W2 @ W1`, de tamaño $2\\times 2$: $\\begin{pmatrix}1&5\\\\1&1\\end{pmatrix}$. Con `x` en $(1, 2)$, `y` vale $(11, 3)$, igual que la salida de las dos capas por separado. Con `W1 @ W2` saldría una matriz de $3\\times 3$ que no sirve para `x`. Por eso hace falta una activación no lineal entre capas: sin ella, apilar capas lineales no aprende más que una sola.',
          requirements: [
            '`W` existe y es un array de NumPy con números, de 2 filas y 2 columnas: lleva una entrada de 2 componentes a una salida de 2.',
            '`W` equivale a las dos capas: la primera, `W1`, actúa primero y la segunda, `W2`, después.',
            '`y` existe y es un array de NumPy con 2 componentes, las dos números: la salida de la capa única `W` para `x`.',
          ],
          starter: `import numpy as np

W1 = np.array([[1, 2], [0, 1], [-1, 1]])
W2 = np.array([[2, 0, 1], [1, -1, 0]])
x = np.array([1, 2])
# Guarda en W la matriz única equivalente a las dos capas, y en y su salida para x
W = None
y = None
`,
          checks: `_arr = isinstance(W, np.ndarray) and np.issubdtype(W.dtype, np.number)
_w = _arr and W.shape == (2, 2)
_y = isinstance(y, np.ndarray) and y.shape == (2,) and np.issubdtype(y.dtype, np.number)
check(_arr, "\`W\` tiene que ser un array de NumPy con números: la matriz única que equivale a las dos capas.")
check((not _arr) or W.shape != (3, 3), "\`W\` es de 3 filas y 3 columnas: has multiplicado las capas en orden contrario. La primera capa, \`W1\`, actúa primero y va a la derecha.")
check((not _arr) or W.shape == (3, 3) or W.shape == (2, 2), "\`W\` tiene que ser una matriz de 2 filas y 2 columnas: lleva la entrada de 2 componentes a una salida de 2.")
check((not _w) or np.allclose(W, [[1, 5], [1, 1]]), "\`W\` tiene que valer (1, 5) en la primera fila y (1, 1) en la segunda: es la segunda capa multiplicada por la primera.")
check(_y, "\`y\` tiene que ser un array de NumPy con 2 números: la salida de la capa única para \`x\`.")
check((not _y) or np.allclose(y, [11, 3]), "\`y\` tiene que valer (11, 3), la misma salida que dan las dos capas por separado.")
`,
          reference:
            'import numpy as np\n\nW1 = np.array([[1, 2], [0, 1], [-1, 1]])\nW2 = np.array([[2, 0, 1], [1, -1, 0]])\nx = np.array([1, 2])\nW = W2 @ W1\ny = W @ x\n',
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'componer.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere guardar en `C` la matriz que aplica **primero** `R`, un giro de un cuarto de vuelta, y **después** `S`, un estiramiento horizontal. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'En un producto, la matriz que actúa primero es la más cercana al vector, la de la derecha.',
        'Piensa qué transformación se aplica primero en el producto de la última línea.',
      ],
      explain:
        'Pregúntate qué transformación actúa primero en el producto que se calcula y compáralo con el orden que pide el enunciado.',
      solution:
        'La tercera línea está mal. `R @ S` aplica primero `S` y después `R`, al revés de lo pedido: la que actúa primero va a la derecha. Hace falta `C = S @ R`, que vale $\\begin{pmatrix}0&-2\\\\1&0\\end{pmatrix}$.',
      lines: ['R = np.array([[0, -1], [1, 0]])', 'S = np.array([[2, 0], [0, 1]])', 'C = R @ S'],
      faultyLine: 2,
    },
    {
      id: 'componer.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento habla de una red con dos capas lineales, $W_1$ y $W_2$, sin función de activación entre ellas. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Mira en qué se convierte la red en la línea intermedia: ¿cuántas matrices hacen falta?',
        'Si una sola capa puede hacer lo mismo que las dos, ¿qué ha ganado la segunda?',
      ],
      explain:
        'Revisa cada paso y comprueba si la conclusión se sigue de lo que se ha establecido antes.',
      solution:
        'La tercera línea está mal. Según la segunda, las dos capas equivalen a una sola, de matriz $W_2W_1$: no aprenden nada que una capa no pueda. Para que una red profunda gane capacidad hace falta una función de activación no lineal entre las capas.',
      lines: [
        'La salida de la red es W₂(W₁x), con las dos capas seguidas y sin activación',
        'Como el producto de matrices es asociativo, W₂(W₁x) = (W₂W₁)x, y W₂W₁ es una sola matriz',
        'Luego dos capas lineales seguidas pueden aprender cosas que una sola capa no puede',
      ],
      faultyLine: 2,
    },
    {
      id: 'componer.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento comprueba tamaños con $A$ de $2\\times 3$ y $B$ de $3\\times 4$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Para cada producto, mira solo los dos números del medio.',
        'El tamaño del resultado sale de los dos números de los extremos.',
      ],
      explain:
        'Revisa cada paso con la regla de los tamaños: los interiores han de coincidir y los exteriores dan el tamaño del resultado.',
      solution:
        'No hay ningún error. En $AB$, $(2\\times 3)(3\\times 4)$, el 3 coincide y queda $2\\times 4$. En $BA$, $(3\\times 4)(2\\times 3)$, el 4 y el 2 no coinciden. Por eso el orden importa incluso para saber si se puede multiplicar.',
      lines: [
        'Los tamaños interiores de AB son 3 y 3: coinciden, así que AB está definido',
        'AB tiene tantas filas como A y tantas columnas como B: es de 2 × 4',
        'En BA los tamaños interiores serían 4 y 2: no coinciden, así que BA no está definido',
      ],
      faultyLine: null,
    },
  ],
};
