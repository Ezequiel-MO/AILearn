import type { Goal, PlaneVector, Project } from '../../content/schema';
import { transformPlane } from './plane';

/** Metas de un `manipular` de matriz: î y ĵ en el sitio de las columnas de la matriz pedida. */
const columns = (i: [number, number], j: [number, number]): Goal[] => [
  { metric: 'x', of: ['i'], target: i[0], tol: 0.01 },
  { metric: 'y', of: ['i'], target: i[1], tol: 0.01 },
  { metric: 'x', of: ['j'], target: j[0], tol: 0.01 },
  { metric: 'y', of: ['j'], target: j[1], tol: 0.01 },
];

/** Metas de un `manipular` de sistema: la imagen A·v del vector móvil `v` en el punto pedido. */
const image = (x: number, y: number): Goal[] => [
  { metric: 'img_x', of: ['i', 'j', 'v'], target: x, tol: 0.01 },
  { metric: 'img_y', of: ['i', 'j', 'v'], target: y, tol: 0.01 },
];

/** El vector móvil `v` del que se busca la entrada. */
const vec = (x: number, y: number): PlaneVector => ({ id: 'v', label: 'v', x, y, movable: true });

/** Segundo proyecto de la Órbita 1 «El área»: la inversa como la transformación que deshace. */
export const inversa: Project = {
  id: 'inversa',
  name: 'Inversa',
  sub: 'Deshacer la transformación',
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'inversa.ex00.1',
          type: 'manipular',
          prompt:
            'Una matriz $A$ lleva cada vector $\\vec{v}$ a otro, $A\\vec{v}$. Su **inversa** $A^{-1}$ hace el camino contrario: si $A\\vec{v}=\\vec{b}$, entonces $A^{-1}\\vec{b}=\\vec{v}$. Por eso resolver $A\\vec{x}=\\vec{b}$ es buscar la entrada que $A$ lleva hasta $\\vec{b}$.\n\nAquí $A=\\begin{pmatrix}3&0\\\\0&2\\end{pmatrix}$ y la flecha discontinua es $A\\vec{v}$. Mueve $\\vec{v}$ hasta que $A\\vec{v}$ llegue a $\\vec{b}=(3, -4)$.',
          hints: [
            'Como $A$ es diagonal, cada coordenada de $A\\vec{v}$ depende de una sola de $\\vec{v}$: $3x$ en horizontal y $2y$ en vertical.',
            'Para que $3x$ valga $3$ hace falta $x=1$. Haz lo mismo con la altura.',
          ],
          explain:
            'Deshacer una matriz diagonal es dividir cada coordenada entre lo que la matriz la multiplicó. Pregúntate por qué número se multiplicó cada coordenada de $\\vec{v}$ para llegar a la de $\\vec{b}$.',
          solution:
            'Como $A\\vec{v}=(3x,\\ 2y)$, hace falta $3x=3$ y $2y=-4$: $x=1$ e $y=-2$, es decir, $\\vec{v}=(1, -2)$. Es lo mismo que calcular $A^{-1}\\vec{b}$ con $A^{-1}=\\begin{pmatrix}\\tfrac13&0\\\\0&\\tfrac12\\end{pmatrix}$: la inversa de una diagonal pone los inversos de los números de la diagonal.',
          plane: transformPlane({
            i: [3, 0],
            j: [0, 2],
            extra: [vec(1, 1)],
            apply: ['v'],
            readouts: ['matrix', 'components'],
            range: 4,
          }),
          goals: image(3, -4),
        },
        {
          id: 'inversa.ex00.2',
          type: 'manipular',
          prompt:
            'Esta matriz **inclina** el plano: $A=\\begin{pmatrix}1&-1\\\\0&1\\end{pmatrix}$, con $A\\hat{\\imath}=(1, 0)$ y $A\\hat{\\jmath}=(-1, 1)$. Busca de nuevo la entrada: mueve $\\vec{v}$ hasta que $A\\vec{v}$ llegue a $\\vec{b}=(3, -1)$.',
          hints: [
            'Empieza por la altura: la primera columna es horizontal, así que solo la segunda sube. La altura de $A\\vec{v}$ es la de $\\vec{v}$.',
            'Con $\\vec{v}=(x, y)$, $A\\vec{v}=(x-y,\\ y)$. Cuando conozcas $y$, despeja $x$ de la primera coordenada.',
          ],
          explain:
            'Aquí no se puede deshacer coordenada por coordenada a la vez, pero sí en orden: la altura no cambia, así que se conoce directamente, y con ella se deshace la otra.',
          solution:
            'De la altura sale $y=-1$. Entonces $x-(-1)=3$, así que $x=2$ y $\\vec{v}=(2, -1)$. La inversa de una inclinación es la inclinación contraria: $A^{-1}=\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$ y $A^{-1}(3, -1)=(3-1,\\ -1)=(2, -1)$.',
          plane: transformPlane({
            i: [1, 0],
            j: [-1, 1],
            extra: [vec(1, 1)],
            apply: ['v'],
            readouts: ['matrix', 'components'],
            range: 4,
          }),
          goals: image(3, -1),
        },
        {
          id: 'inversa.ex00.3',
          type: 'manipular',
          prompt:
            '$A=\\begin{pmatrix}1&1\\\\-1&1\\end{pmatrix}$ gira el plano y lo agranda: su determinante es $2$. Mueve $\\vec{v}$ hasta que $A\\vec{v}$ llegue a $\\vec{b}=(1, 2)$. Esta vez la solución no tiene coordenadas enteras: la rejilla es de $0{,}5$ en $0{,}5$.',
          hints: [
            'Con $\\vec{v}=(x, y)$, $A\\vec{v}=(x+y,\\ -x+y)$. Hacen falta $x+y=1$ y $-x+y=2$.',
            'Si sumas las dos ecuaciones, $x$ desaparece y puedes despejar $y$. El $2$ del determinante aparece como divisor.',
          ],
          explain:
            'Cada coordenada de $A\\vec{v}$ mezcla las dos de $\\vec{v}$, así que no se deshacen una a una: hay que resolver las dos ecuaciones a la vez.',
          solution:
            'Sumando las dos ecuaciones, $2y=3$, así que $y=1{,}5$, y entonces $x=1-1{,}5=-0{,}5$. Es decir, $\\vec{v}=(-0{,}5;\\ 1{,}5)$. La inversa es $A^{-1}=\\tfrac12\\begin{pmatrix}1&-1\\\\1&1\\end{pmatrix}$: el $\\tfrac12$ es $1/\\det A$, y por eso salen medios.',
          plane: transformPlane({
            i: [1, -1],
            j: [1, 1],
            extra: [vec(1, 1)],
            apply: ['v'],
            readouts: ['matrix', 'components'],
            range: 4,
            snap: 0.5,
          }),
          goals: image(1, 2),
        },
        {
          id: 'inversa.ex00.4',
          type: 'manipular',
          prompt:
            'Escalar por $2$ es la matriz $A=\\begin{pmatrix}2&0\\\\0&2\\end{pmatrix}$: duplica todas las distancias. Su inversa $A^{-1}$ tiene que **deshacerlo**: aplicada después de $A$, deja cada vector donde estaba. Construye $A^{-1}$ colocando $\\hat{\\imath}$ y $\\hat{\\jmath}$ en las columnas que le corresponden. La rejilla es de $0{,}5$ en $0{,}5$.',
          hints: [
            'Si $A$ duplica, ¿por qué número hay que multiplicar para volver al tamaño original?',
            'La primera columna es la imagen de $\\hat{\\imath}$, que apunta en horizontal; la segunda es la de $\\hat{\\jmath}$, en vertical.',
          ],
          explain:
            'La inversa cumple $A^{-1}A=I$: tras escalar por $2$ y aplicar la inversa, cada flecha ha de recuperar su tamaño. Comprueba con $\\hat{\\imath}$ que ir y volver acaba donde se empezó.',
          solution:
            'Duplicar y después multiplicar por $0{,}5$ lo deja todo igual, así que $A^{-1}=\\begin{pmatrix}0{,}5&0\\\\0&0{,}5\\end{pmatrix}$: $\\hat{\\imath}$ en $(0{,}5;\\ 0)$ y $\\hat{\\jmath}$ en $(0;\\ 0{,}5)$. Se cumple $A^{-1}A=\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}=I$.',
          plane: transformPlane({ movable: true, readouts: ['matrix'], snap: 0.5 }),
          goals: columns([0.5, 0], [0, 0.5]),
        },
        {
          id: 'inversa.ex00.5',
          type: 'manipular',
          prompt:
            'El giro de un cuarto de vuelta en sentido antihorario es $R=\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$. Para deshacerlo hay que girar el plano **al revés**. Construye $R^{-1}$: coloca $\\hat{\\imath}$ y $\\hat{\\jmath}$ donde los lleva el giro que deshace $R$.',
          hints: [
            'Deshacer un cuarto de vuelta antihorario es dar un cuarto de vuelta en sentido horario. ¿Adónde lleva ese giro a $\\hat{\\imath}$, que parte de $(1, 0)$?',
            'Haz lo mismo con $\\hat{\\jmath}$, que parte de $(0, 1)$. Para comprobar, aplica $R$ y después tu matriz a $\\hat{\\imath}$: tiene que volver a $(1, 0)$.',
          ],
          explain:
            'La inversa de un giro es el giro opuesto. Sigue cada flecha en un cuarto de vuelta horario y comprueba que, junto con $R$, vuelve a su sitio.',
          solution:
            'Un cuarto de vuelta horario lleva $\\hat{\\imath}$ de $(1, 0)$ a $(0, -1)$ y $\\hat{\\jmath}$ de $(0, 1)$ a $(1, 0)$. Así, $R^{-1}=\\begin{pmatrix}0&1\\\\-1&0\\end{pmatrix}$, que es la traspuesta de $R$: en los giros, la inversa es la traspuesta. Comprobación: $R^{-1}R=\\begin{pmatrix}0&1\\\\-1&0\\end{pmatrix}\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}=\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}$.',
          plane: transformPlane({ movable: true, readouts: ['matrix'] }),
          goals: columns([0, -1], [1, 0]),
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'inversa.ex01.1',
          type: 'vector',
          prompt:
            'Una matriz diagonal estira cada eje por separado, y su inversa los devuelve a su tamaño: pone en la diagonal los **inversos** de sus números. Calcula $A^{-1}$ para $A=\\begin{pmatrix}2&0\\\\0&4\\end{pmatrix}$ y escríbela en las cuatro casillas (los decimales, con coma).',
          hints: [
            'La inversa de multiplicar por $2$ es multiplicar por $\\tfrac12$. Haz lo mismo con el $4$.',
            'Los ceros de fuera de la diagonal se quedan como ceros.',
          ],
          explain:
            'La inversa de una diagonal no es la matriz con el signo cambiado ni la traspuesta: cada eje se deshace por separado, dividiendo entre el número que lo estiró.',
          solution:
            'El primer eje se estiró por $2$ y se deshace multiplicando por $0{,}5$; el segundo, por $4$ y por $0{,}25$. $A^{-1}=\\begin{pmatrix}0{,}5&0\\\\0&0{,}25\\end{pmatrix}$. Se comprueba multiplicando: $A^{-1}A=I$. Una diagonal solo tiene inversa si ningún número de su diagonal es cero.',
          shape: [2, 2],
          answer: [0.5, 0, 0, 0.25],
          tol: 0.01,
        },
        {
          id: 'inversa.ex01.2',
          type: 'vector',
          prompt:
            'Para una matriz $A=\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}$ de $2\\times 2$ con $\\det A=ad-bc\\neq 0$, la inversa es $A^{-1}=\\frac{1}{\\det A}\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}$. Calcula con ella la inversa de $A=\\begin{pmatrix}3&2\\\\1&1\\end{pmatrix}$ y escríbela en las cuatro casillas.',
          hints: [
            'Primero el determinante: $ad-bc=3\\cdot 1-2\\cdot 1$.',
            'Intercambia las dos entradas de la diagonal, cambia de signo las otras dos y divide todo entre el determinante.',
          ],
          explain:
            'En la fórmula, la diagonal se intercambia y la otra diagonal cambia de signo. Comprueba el resultado multiplicándolo por $A$: tiene que salir $I$.',
          solution:
            '$\\det A=3\\cdot 1-2\\cdot 1=1$, así que no hay que dividir. Se intercambian $a=3$ y $d=1$ y se cambian de signo $b=2$ y $c=1$: $A^{-1}=\\begin{pmatrix}1&-2\\\\-1&3\\end{pmatrix}$. Comprobación con la primera columna: $A(1, -1)=(3-2,\\ 1-1)=(1, 0)$.',
          shape: [2, 2],
          answer: [1, -2, -1, 3],
          tol: 0,
        },
        {
          id: 'inversa.ex01.3',
          type: 'vector',
          prompt:
            'Resuelve $A\\vec{x}=\\vec{b}$ con $A=\\begin{pmatrix}2&1\\\\5&3\\end{pmatrix}$ y $\\vec{b}=(4, 9)$ calculando $\\vec{x}=A^{-1}\\vec{b}$. Comprueba antes de contestar que $A\\vec{x}$ da $\\vec{b}$. Escribe las dos coordenadas de $\\vec{x}$.',
          hints: [
            'Calcula $\\det A=2\\cdot 3-1\\cdot 5$ y, con él, la inversa mediante la fórmula.',
            'Multiplica $A^{-1}$ por $\\vec{b}$ como cualquier matriz por un vector.',
          ],
          explain:
            'La inversa va a la izquierda del vector, igual que $A$ en $A\\vec{x}$: es $A^{-1}\\vec{b}$, no $A\\vec{b}$. Si al multiplicar $A$ por tu $\\vec{x}$ no sale $\\vec{b}$, revisa la inversa o el producto.',
          solution:
            '$\\det A=6-5=1$, así que $A^{-1}=\\begin{pmatrix}3&-1\\\\-5&2\\end{pmatrix}$. Entonces $\\vec{x}=A^{-1}\\vec{b}=(3\\cdot 4-1\\cdot 9,\\ -5\\cdot 4+2\\cdot 9)=(3, -2)$. Comprobación: $A\\vec{x}=(2\\cdot 3+1\\cdot(-2),\\ 5\\cdot 3+3\\cdot(-2))=(4, 9)$.',
          answer: [3, -2],
          tol: 0,
        },
        {
          id: 'inversa.ex01.4',
          type: 'opcion',
          prompt:
            'Una matriz tiene inversa si y solo si su determinante no es $0$. ¿Cuál de estas cuatro matrices **no** tiene inversa?',
          hints: [
            'Calcula $ad-bc$ de cada una: solo una da $0$.',
            'Con determinante $0$, las dos columnas son paralelas: una es un múltiplo de la otra.',
          ],
          explain:
            'Decide por el determinante, no por los ceros ni por las entradas repetidas: una matriz con ceros puede tener inversa, y una sin ceros, no.',
          solution:
            'Los determinantes son $1\\cdot 4-2\\cdot 3=-2$, $0\\cdot 0-1\\cdot 1=-1$, $2\\cdot 2-4\\cdot 1=0$ y $2\\cdot 1-1\\cdot 1=1$. La tercera tiene por columnas $(2, 1)$ y $(4, 2)$, paralelas: aplasta el plano sobre una recta y eso no se puede deshacer. La que tiene ceros es un espejo, y los espejos sí se deshacen.',
          options: [
            '$\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}$',
            '$\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}$',
            '$\\begin{pmatrix}2&4\\\\1&2\\end{pmatrix}$',
            '$\\begin{pmatrix}2&1\\\\1&1\\end{pmatrix}$',
          ],
          correct: 2,
        },
        {
          id: 'inversa.ex01.5',
          type: 'vector',
          prompt:
            'Sabes que $A^{-1}=\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$ y $B^{-1}=\\begin{pmatrix}2&0\\\\0&1\\end{pmatrix}$. Calcula $(AB)^{-1}$ sin hallar antes $A$, $B$ ni $AB$, y escríbela en las cuatro casillas.',
          hints: [
            '$AB$ aplica primero $B$ y después $A$. Para deshacerlo, ¿qué se deshace primero?',
            'Lo primero que se deshace es lo último que se aplicó, y en un producto la matriz que actúa primero va a la derecha.',
          ],
          explain:
            'La inversa de un producto invierte el orden de los factores: al deshacer, lo último que se hizo es lo primero que se deshace. Si multiplicas las inversas en el mismo orden que $A$ y $B$, sale otra matriz.',
          solution:
            '$(AB)^{-1}=B^{-1}A^{-1}=\\begin{pmatrix}2&0\\\\0&1\\end{pmatrix}\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}=\\begin{pmatrix}2&2\\\\0&1\\end{pmatrix}$. El orden contrario, $A^{-1}B^{-1}=\\begin{pmatrix}2&1\\\\0&1\\end{pmatrix}$, es otra matriz. Es como vestirse: primero los calcetines y después los zapatos, y para deshacerlo se quitan primero los zapatos.',
          shape: [2, 2],
          answer: [2, 2, 0, 1],
          tol: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'inversa.ex02.1',
          type: 'codigo',
          prompt:
            'NumPy calcula la inversa de una matriz con `np.linalg.inv`. Ya tienes `A`. Guarda en `Ainv` su inversa y en `es_inversa` si `A @ Ainv` es la identidad, como un solo `True` o `False`. Con decimales de por medio no se compara con `==`: `np.allclose` compara con una tolerancia para el redondeo.',
          hints: [
            '`np.linalg.inv(A)` devuelve la inversa. Después multiplica `A` por ella con `@`.',
            'La identidad de $2\\times 2$ es `np.eye(2)`. Para compararla con el producto, `np.allclose(X, Y)` devuelve un solo valor.',
          ],
          explain:
            'El producto de `A` por su inversa es la identidad solo salvo errores de redondeo, del orden de $10^{-16}$. Comparar con `==` exige igualdad exacta y puede dar `False` aunque la inversa sea correcta, y además da un array de valores, no uno solo.',
          solution:
            'Se escribe `Ainv = np.linalg.inv(A)`, que vale $\\begin{pmatrix}1&-3\\\\-1&4\\end{pmatrix}$, y `es_inversa = np.allclose(A @ Ainv, np.eye(2))`, que da `True`. Con `1 / A` se obtendría el inverso de cada entrada por separado, que no es la inversa de la matriz.',
          starter: `import numpy as np

A = np.array([[4, 3], [1, 1]])
# Guarda en Ainv la inversa de A, y en es_inversa si A @ Ainv es la identidad
Ainv = None
es_inversa = None
`,
          checks: `_m = isinstance(Ainv, np.ndarray) and Ainv.shape == (2, 2) and np.issubdtype(Ainv.dtype, np.number)
_good = _m and np.allclose(Ainv, [[1, -3], [-1, 4]])
_b = isinstance(es_inversa, (bool, np.bool_))
check(_m, "\`Ainv\` tiene que ser una matriz de NumPy de 2 filas y 2 columnas: la inversa de \`A\`.")
check((not _m) or not np.allclose(Ainv, 1 / A), "\`Ainv\` tiene el inverso de cada entrada por separado. La inversa de una matriz no se calcula entrada a entrada: para eso está \`np.linalg.inv\`.")
check((not _m) or np.allclose(Ainv, 1 / A) or _good, "\`Ainv\` tiene que valer (1, -3) en la primera fila y (-1, 4) en la segunda: es la matriz que, multiplicada por \`A\`, da la identidad.")
check(_b, "\`es_inversa\` tiene que ser un solo \`True\` o \`False\`. La comparación con \`==\` da una matriz de valores; \`np.allclose\` da uno solo.")
check((not _b) or (not _good) or bool(es_inversa), "\`es_inversa\` vale \`False\`, pero el producto de \`A\` por su inversa es la identidad salvo redondeo. Compara con \`np.allclose\`, que tiene tolerancia, y no con \`==\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[4, 3], [1, 1]])\nAinv = np.linalg.inv(A)\nes_inversa = np.allclose(A @ Ainv, np.eye(2))\n',
        },
        {
          id: 'inversa.ex02.2',
          type: 'codigo',
          prompt:
            'Para resolver $A\\vec{x}=\\vec{b}$ en código, `np.linalg.solve(A, b)` es mejor que calcular la inversa y multiplicar: es más rápida y pierde menos precisión. Ya tienes `A` y `b`. Guarda en `x` la solución y en `coincide` si `A @ x` coincide con `b`, como un solo `True` o `False`.',
          hints: [
            '`np.linalg.solve` recibe primero la matriz y después el vector del lado derecho, en ese orden.',
            'Para comprobar, multiplica `A` por tu `x` y compara con `b` usando `np.allclose`.',
          ],
          explain:
            'La matriz va primero y el vector de la derecha después. La comprobación multiplica la matriz por la solución: si no sale `b`, la solución es otra.',
          solution:
            'Se escribe `x = np.linalg.solve(A, b)`, que vale $(1, 3)$, y `coincide = np.allclose(A @ x, b)`, que da `True`. Es lo mismo que $A^{-1}\\vec{b}$ sin construir la inversa entera. Con `np.linalg.inv(A) @ b` sale el mismo vector, pero con un paso más y algo más de error de redondeo.',
          starter: `import numpy as np

A = np.array([[2, 1], [1, 3]])
b = np.array([5, 10])
# Guarda en x la solución de A x = b, y en coincide si A @ x da b
x = None
coincide = None
`,
          checks: `_x = isinstance(x, np.ndarray) and x.shape == (2,) and np.issubdtype(x.dtype, np.number)
_good = _x and np.allclose(x, [1, 3])
_b = isinstance(coincide, (bool, np.bool_))
check(_x, "\`x\` tiene que ser un array de NumPy con 2 números: la solución del sistema.")
check((not _x) or _good, "\`x\` tiene que valer (1, 3): es el vector que \`A\` lleva hasta \`b\`, es decir, \`A @ x\` tiene que dar \`b\`.")
check(_b, "\`coincide\` tiene que ser un solo \`True\` o \`False\`. La comparación con \`==\` da una matriz de valores; \`np.allclose\` da uno solo.")
check((not _b) or (not _good) or bool(coincide), "\`coincide\` vale \`False\`, pero \`A @ x\` sí da \`b\`. Compara con \`np.allclose\`, que tiene tolerancia para el redondeo.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[2, 1], [1, 3]])\nb = np.array([5, 10])\nx = np.linalg.solve(A, b)\ncoincide = np.allclose(A @ x, b)\n',
        },
        {
          id: 'inversa.ex02.3',
          type: 'codigo',
          prompt:
            'No toda matriz tiene inversa, y `np.linalg.inv` no avisa si no la tiene: según el entorno lanza un error o devuelve una matriz de `nan`. Escribe `inversa_segura(M)`, que devuelve la inversa de `M` si existe y `None` si `M` es singular, es decir, de determinante $0$. Después guarda en `Ainv` lo que devuelve para `A`. Con decimales, el determinante casi nunca es exactamente $0$: compáralo con `np.isclose`.',
          hints: [
            '`np.linalg.det(M)` da el determinante. Si es casi $0$, con `np.isclose(d, 0)`, no hay inversa.',
            'Decide primero si es singular; solo si no lo es, llama a `np.linalg.inv`.',
          ],
          explain:
            'Hay que mirar el determinante antes de invertir: pedir la inversa de una matriz singular no da una inversa: lanza un error o devuelve `nan`. Comparar el determinante con `== 0` es frágil, porque el redondeo puede dejar un valor diminuto en lugar de cero.',
          solution:
            'Se calcula el determinante `d = np.linalg.det(M)`; si `np.isclose(d, 0)`, se devuelve `None`, y si no, `np.linalg.inv(M)`. Para `A` el determinante vale $1\\cdot 7-2\\cdot 3=1$ y `Ainv` es $\\begin{pmatrix}7&-2\\\\-3&1\\end{pmatrix}$. Para $\\begin{pmatrix}2&4\\\\1&2\\end{pmatrix}$, de columnas paralelas, la función devuelve `None`.',
          starter: `import numpy as np

A = np.array([[1, 2], [3, 7]])


def inversa_segura(M):
    # Devuelve la inversa de M, o None si M no tiene inversa
    return None


# Guarda en Ainv lo que devuelve inversa_segura para A
Ainv = None
`,
          checks: `_f = callable(globals().get("inversa_segura"))
def _run(M):
    try:
        return ("ok", inversa_segura(M))
    except Exception:
        return ("error", None)
def _inv_of(r, M):
    return r[0] == "ok" and isinstance(r[1], np.ndarray) and r[1].shape == (2, 2) and bool(np.allclose(r[1] @ M, np.eye(2)))
_G = np.array([[1, 2], [3, 7]])
_H = np.array([[2, 1], [5, 3]])
_K = np.array([[3, 1], [1, 2]])
_S = np.array([[2, 4], [1, 2]])
_T = np.array([[0, 0], [1, 5]])
_ok = _f and _inv_of(_run(_G), _G) and _inv_of(_run(_H), _H) and _inv_of(_run(_K), _K)
_s = _run(_S) if _f else ("ok", None)
_t = _run(_T) if _f else ("ok", None)
_arr = isinstance(Ainv, np.ndarray) and Ainv.shape == (2, 2) and np.issubdtype(Ainv.dtype, np.number)
check(_f, "Hay que definir una función \`inversa_segura\` que reciba la matriz.")
check((not _f) or _ok, "\`inversa_segura\` tiene que devolver la inversa de una matriz que sí la tiene: un array de NumPy de 2 filas y 2 columnas que, multiplicado por la matriz, da la identidad.")
check((not _ok) or (_s[0] != "error" and _t[0] != "error"), "\`inversa_segura\` lanza un error con una matriz singular. Hay que mirar el determinante antes de calcular la inversa.")
check((not _ok) or _s[0] == "error" or _t[0] == "error" or (_s[1] is None and _t[1] is None), "\`inversa_segura\` tiene que devolver \`None\` con una matriz singular, y no una matriz: \`np.linalg.inv\` no avisa, y puede dar una matriz de \`nan\`.")
check(_arr, "\`Ainv\` tiene que ser una matriz de NumPy de 2 filas y 2 columnas: la inversa de \`A\`.")
check((not _arr) or np.allclose(Ainv, [[7, -2], [-3, 1]]), "\`Ainv\` tiene que valer (7, -2) en la primera fila y (-3, 1) en la segunda: es lo que devuelve \`inversa_segura\` para \`A\`.")
`,
          reference: `import numpy as np

A = np.array([[1, 2], [3, 7]])


def inversa_segura(M):
    d = np.linalg.det(M)
    if np.isclose(d, 0):
        return None
    return np.linalg.inv(M)


Ainv = inversa_segura(A)
`,
        },
        {
          id: 'inversa.ex02.4',
          type: 'codigo',
          prompt:
            'Dos capas lineales se aplican seguidas a una entrada `x`: primero `A` y después `B`, así que la salida es `y = B @ (A @ x)`. Ya tienes `A`, `B` e `y`. Recupera la entrada: guarda en `x` el vector que produce esa salida. Las capas se deshacen en el orden contrario al que se aplicaron.',
          hints: [
            '¿Qué capa actuó la última? Esa es la primera que hay que deshacer.',
            'Puedes invertir cada capa con `np.linalg.inv`, o resolver un sistema con la matriz de las dos capas juntas, con `np.linalg.solve`.',
          ],
          explain:
            'La entrada pasó por `A` y después por `B`; para volver hay que deshacer `B` y luego `A`. La inversa de `B` actúa primero sobre `y`, así que va a la derecha del producto. Con las inversas en el otro orden sale un vector distinto.',
          solution:
            'Se escribe `x = np.linalg.inv(A) @ np.linalg.inv(B) @ y`: la inversa de `B` actúa primero sobre `y` y da $(4, 1)$, y la de `A` da $(2, 1)$. Equivale a $(BA)^{-1}\\vec{y}$, es decir, a `np.linalg.solve(B @ A, y)`. Con las inversas en el orden `inv(B) @ inv(A)` saldría $(-6, 11)$, que no es la entrada.',
          starter: `import numpy as np

A = np.array([[1, 2], [0, 1]])
B = np.array([[1, 0], [1, 1]])
y = np.array([4, 5])
# Guarda en x la entrada que da la salida y tras la capa A y después la capa B
x = None
`,
          checks: `_x = isinstance(x, np.ndarray) and x.shape == (2,) and np.issubdtype(x.dtype, np.number)
_rev = _x and np.allclose(x, [-6, 11])
check(_x, "\`x\` tiene que ser un array de NumPy con 2 números: la entrada que se busca.")
check((not _x) or not _rev, "\`x\` sale de deshacer las capas en el mismo orden en que se aplicaron. La última capa que actuó, \`B\`, es la primera que hay que deshacer: su inversa va a la derecha del producto.")
check((not _x) or _rev or np.allclose(x, [2, 1]), "\`x\` tiene que valer (2, 1): al pasarlo por la capa \`A\` y después por la capa \`B\` tiene que salir \`y\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 2], [0, 1]])\nB = np.array([[1, 0], [1, 1]])\ny = np.array([4, 5])\nx = np.linalg.inv(A) @ np.linalg.inv(B) @ y\n',
        },
        {
          id: 'inversa.ex02.5',
          type: 'codigo',
          prompt:
            'Una capa lineal de una red calcula `y = W @ x + b`: multiplica la entrada `x` por `W` y le suma el sesgo `b`. Si `W` es invertible, la entrada se puede recuperar a partir de la salida. Ya tienes `W`, `b` y la salida `y`. Guarda en `x` la entrada que produjo `y`, y en `reconstruye` si volver a pasarla por la capa da `y`, como un solo `True` o `False`.',
          hints: [
            'El sesgo se sumó al final, así que `y - b` es lo que salió de multiplicar por `W`.',
            'Resuelve `np.linalg.solve(W, ...)` con ese vector como lado derecho.',
          ],
          explain:
            'El sesgo se suma después de multiplicar, así que se resta antes de deshacer la multiplicación. Si se resuelve con `y` sin más, el sesgo se cuela en la entrada recuperada; y restarlo al final tampoco vale, porque la inversa de `W` ya lo ha multiplicado.',
          solution:
            'Se escribe `x = np.linalg.solve(W, y - b)`, que vale $(1, 2, 3)$, y `reconstruye = np.allclose(W @ x + b, y)`, que da `True`. Si $\\det W=0$, la capa aplasta el espacio: varias entradas dan la misma salida y no hay forma de recuperar la entrada (`solve` no podría darte una solución válida). Por eso la mayoría de las capas de una red real no se pueden deshacer: pasan de muchas componentes a pocas.',
          starter: `import numpy as np

W = np.array([[2, 0, 1], [1, 1, 0], [0, 1, 1]])
b = np.array([1, -1, 2])
y = np.array([6, 2, 7])
# Guarda en x la entrada que produjo y, y en reconstruye si W @ x + b da y
x = None
reconstruye = None
`,
          checks: `_x = isinstance(x, np.ndarray) and x.shape == (3,) and np.issubdtype(x.dtype, np.number)
_good = _x and np.allclose(x, [1, 2, 3])
_nobias = _x and np.allclose(x, np.linalg.solve(W, y))
_after = _x and np.allclose(x, np.linalg.solve(W, y) - b)
_b = isinstance(reconstruye, (bool, np.bool_))
check(_x, "\`x\` tiene que ser un array de NumPy con 3 números: la entrada que produjo \`y\`.")
check((not _x) or not _nobias, "\`x\` se ha calculado sin quitar el sesgo: el vector \`b\` se sumó al final de la capa, así que hay que restarlo de \`y\` antes de resolver.")
check((not _x) or not _after, "\`x\` resta el sesgo después de resolver. Hay que restarlo antes: la inversa de \`W\` se aplica a \`y - b\` entero, no solo a \`y\`.")
check((not _x) or _nobias or _after or _good, "\`x\` tiene que valer (1, 2, 3): al pasarlo por la capa, \`W @ x + b\`, tiene que salir \`y\`.")
check(_b, "\`reconstruye\` tiene que ser un solo \`True\` o \`False\`. La comparación con \`==\` da un array de valores; \`np.allclose\` da uno solo.")
check((not _b) or (not _good) or bool(reconstruye), "\`reconstruye\` vale \`False\`, pero \`W @ x + b\` sí da \`y\`. Compara con \`np.allclose\`, que tiene tolerancia para el redondeo.")
`,
          reference:
            'import numpy as np\n\nW = np.array([[2, 0, 1], [1, 1, 0], [0, 1, 1]])\nb = np.array([1, -1, 2])\ny = np.array([6, 2, 7])\nx = np.linalg.solve(W, y - b)\nreconstruye = np.allclose(W @ x + b, y)\n',
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'inversa.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere guardar en `Ainv` la inversa de `A` con la fórmula de $2\\times 2$: se intercambian $a$ y $d$, se cambian de signo $b$ y $c$, y se divide entre el determinante. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Escribe la fórmula en papel con $a, b, c, d$ y compárala con el lugar que ocupa cada entrada en el código.',
        'Fíjate en qué entrada hay arriba a la izquierda del resultado: en la fórmula es $d$.',
      ],
      explain:
        'Compara la posición de cada entrada del resultado con la de la fórmula, y piensa si la matriz que sale, multiplicada por `A`, podría dar la identidad.',
      solution:
        'La tercera línea está mal: no intercambia $a$ y $d$. La matriz de la fórmula es $\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}$, con `A[1, 1]` arriba a la izquierda y `A[0, 0]` abajo a la derecha. Con estos datos, $\\det A=3\\cdot 2-1\\cdot 5=1$ y la inversa es $\\begin{pmatrix}2&-1\\\\-5&3\\end{pmatrix}$; la línea dada produce $\\begin{pmatrix}3&-1\\\\-5&2\\end{pmatrix}$ y la comprobación final daría `False`.',
      lines: [
        'A = np.array([[3, 1], [5, 2]])',
        'det = A[0, 0] * A[1, 1] - A[0, 1] * A[1, 0]',
        'Ainv = np.array([[A[0, 0], -A[0, 1]], [-A[1, 0], A[1, 1]]]) / det',
        'ok = np.allclose(A @ Ainv, np.eye(2))',
      ],
      faultyLine: 2,
    },
    {
      id: 'inversa.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula la inversa de un producto de dos matrices invertibles, $A$ y $B$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'En $AB\\vec{v}$, ¿cuál de las dos matrices actúa primero sobre $\\vec{v}$?',
        'Para deshacer, ¿cuál de las dos inversas tiene que actuar primero? Esa va a la derecha del producto.',
      ],
      explain:
        'Comprueba en qué orden quedan escritas las inversas, con la regla de que en un producto actúa primero la matriz de la derecha.',
      solution:
        'La tercera línea está mal. Para deshacer $AB$ hay que deshacer primero lo último que se aplicó, $A$, así que $A^{-1}$ actúa primero y va a la derecha: $(AB)^{-1}=B^{-1}A^{-1}$. Es como vestirse con calcetines y zapatos: para deshacerlo se quitan primero los zapatos. Con $A^{-1}B^{-1}$ se deshace $B$ antes que $A$, que no es el orden.',
      lines: [
        'AB aplica primero B y después A',
        'Para deshacerla hay que deshacer en orden inverso: primero A y después B',
        'Luego (AB)⁻¹ = A⁻¹B⁻¹, con las inversas en el mismo orden que A y B',
      ],
      faultyLine: 2,
    },
    {
      id: 'inversa.hoja.3',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere recuperar la entrada `x` de una capa lineal, $\\vec{y}=W\\vec{x}+\\vec{b}$, a partir de su salida `y`. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Mira qué se hace con el sesgo `b` y en qué momento.',
        'Prueba el resultado: $W\\vec{x}+\\vec{b}$ tiene que dar $\\vec{y}$.',
      ],
      explain:
        'Pasa la entrada recuperada por la capa y comprueba si vuelve a salir la salida de partida.',
      solution:
        'No hay ningún error. Primero se quita el sesgo, `y - b`, que es lo que salió de multiplicar por `W`, y con eso se resuelve el sistema: sale $(1, 3)$. Resolver con `y` sin más, o restar el sesgo después de resolver, daría otra entrada.',
      lines: [
        'W = np.array([[2, 1], [1, 3]])',
        'b = np.array([1, -1])',
        'y = np.array([6, 9])',
        'x = np.linalg.solve(W, y - b)',
      ],
      faultyLine: null,
    },
  ],
};
