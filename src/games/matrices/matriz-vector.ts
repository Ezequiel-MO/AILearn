import type { PlaneVector, Project } from '../../content/schema';
import { transformPlane } from './plane';

/** Un vector suelto del plano (el que se transforma con `apply`), móvil o fijo. */
const vec = (x: number, y: number, movable: boolean): PlaneVector => ({
  id: 'v',
  label: 'v',
  x,
  y,
  movable,
});

/** Primer proyecto de la Órbita 0 «La máquina»: multiplicar una matriz por un vector. */
export const matrizVector: Project = {
  id: 'matriz-vector',
  name: 'Matriz por vector',
  sub: 'Combinar las columnas',
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'matriz-vector.ex00.1',
          type: 'manipular',
          prompt:
            'Una matriz $A$ transforma un vector $\\vec{v}=(a, b)$ **combinando sus columnas**: las coordenadas de $\\vec{v}$ dicen cuánto se toma de cada una, $A\\vec{v}=a\\cdot\\text{col}_1+b\\cdot\\text{col}_2$. Aquí las columnas son $\\hat{\\imath}$ y $\\hat{\\jmath}$, y la flecha discontinua es $A\\vec{v}$.\n\nLa matriz $\\begin{pmatrix}2&0\\\\0&3\\end{pmatrix}$ estira el plano al doble en horizontal y al triple en vertical. Mueve la punta de $\\vec{v}$ hasta que la flecha discontinua llegue a $(4, -3)$.',
          hints: [
            'Mira dónde acaba la punta de la flecha discontinua mientras arrastras $\\vec{v}$.',
            'La primera columna es $(2, 0)$ y la segunda, $(0, 3)$. Para llegar a $4$ en horizontal solo sirve la primera; para llegar a $-3$ en vertical, la segunda.',
          ],
          explain:
            'Como las columnas apuntan una en cada eje, cada coordenada de $\\vec{v}$ se multiplica solo por el número de su columna. Pregúntate cuántas veces hay que tomar cada columna para llegar al punto pedido.',
          solution:
            'Hay que tomar la primera columna $2$ veces y la segunda, $-1$ vez: $2\\cdot(2, 0)+(-1)\\cdot(0, 3)=(4, -3)$. Entonces $\\vec{v}=(2, -1)$.',
          plane: transformPlane({
            i: [2, 0],
            j: [0, 3],
            extra: [vec(1, 1, true)],
            apply: ['v'],
            readouts: ['matrix', 'components'],
            range: 4,
          }),
          goals: [
            { metric: 'img_x', of: ['i', 'j', 'v'], target: 4, tol: 0.01 },
            { metric: 'img_y', of: ['i', 'j', 'v'], target: -3, tol: 0.01 },
          ],
        },
        {
          id: 'matriz-vector.ex00.2',
          type: 'manipular',
          prompt:
            'Esta matriz **inclina** el plano: $\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$. Sus columnas son $A\\hat{\\imath}=(1, 0)$ y $A\\hat{\\jmath}=(1, 1)$, y $A\\vec{v}$ es la flecha discontinua.\n\nMueve la punta de $\\vec{v}$ hasta que $A\\vec{v}$ llegue a $(3, 2)$.',
          hints: [
            'Fíjate en la altura: solo la segunda columna sube, porque la primera es horizontal.',
            'La segunda coordenada de $A\\vec{v}$ es $b\\cdot 1$, así que ya sabes cuánto vale $b$. Con ella, busca $a$ para la primera coordenada.',
          ],
          explain:
            'Cada columna aporta su parte: la primera, $(1, 0)$, solo mueve en horizontal, y la segunda, $(1, 1)$, mueve en horizontal y en vertical a la vez. Empieza por la coordenada que depende de una sola columna.',
          solution:
            'La altura sale de la segunda columna: $b\\cdot 1=2$, así que $b=2$. Entonces $a\\cdot(1, 0)+2\\cdot(1, 1)=(a+2,\\ 2)$, y para que sea $(3, 2)$ hace falta $a=1$. Con $\\vec{v}=(1, 2)$: $1\\cdot(1, 0)+2\\cdot(1, 1)=(3, 2)$.',
          plane: transformPlane({
            i: [1, 0],
            j: [1, 1],
            extra: [vec(2, 1, true)],
            apply: ['v'],
            readouts: ['matrix', 'components'],
          }),
          goals: [
            { metric: 'img_x', of: ['i', 'j', 'v'], target: 3, tol: 0.01 },
            { metric: 'img_y', of: ['i', 'j', 'v'], target: 2, tol: 0.01 },
          ],
        },
        {
          id: 'matriz-vector.ex00.3',
          type: 'manipular',
          prompt:
            'Ahora las columnas ya no son sencillas: $A=\\begin{pmatrix}1&-1\\\\2&1\\end{pmatrix}$ tiene por columnas $A\\hat{\\imath}=(1, 2)$ y $A\\hat{\\jmath}=(-1, 1)$. Hace falta combinar las dos con las coordenadas de $\\vec{v}$.\n\nMueve la punta de $\\vec{v}$ hasta que $A\\vec{v}$ llegue a $(3, 3)$.',
          hints: [
            'Si $\\vec{v}=(a, b)$, entonces $A\\vec{v}=a\\cdot(1, 2)+b\\cdot(-1, 1)=(a-b,\\ 2a+b)$.',
            'Prueba valores de $a$ y $b$ hasta que las dos coordenadas de la flecha discontinua valgan $3$. Si sumas las dos coordenadas de $A\\vec{v}$ sale un resultado que depende solo de $a$.',
          ],
          explain:
            'Aquí las dos columnas intervienen en las dos coordenadas del resultado, así que no se pueden ajustar por separado. Escribe qué vale cada coordenada de $A\\vec{v}$ en función de $a$ y $b$, y resuelve las dos condiciones a la vez.',
          solution:
            'Se necesita $a-b=3$ y $2a+b=3$. Sumándolas, $3a=6$, o sea $a=2$, y entonces $b=-1$. Con $\\vec{v}=(2, -1)$: $2\\cdot(1, 2)+(-1)\\cdot(-1, 1)=(2+1,\\ 4-1)=(3, 3)$.',
          plane: transformPlane({
            i: [1, 2],
            j: [-1, 1],
            extra: [vec(1, 1, true)],
            apply: ['v'],
            readouts: ['matrix', 'components'],
            range: 4,
          }),
          goals: [
            { metric: 'img_x', of: ['i', 'j', 'v'], target: 3, tol: 0.01 },
            { metric: 'img_y', of: ['i', 'j', 'v'], target: 3, tol: 0.01 },
          ],
        },
        {
          id: 'matriz-vector.ex00.4',
          type: 'manipular',
          prompt:
            'Ahora al revés: el vector $\\vec{v}=(2, 1)$ está fijo y lo que se mueve es la matriz. Como $A\\vec{v}=2\\cdot\\text{col}_1+1\\cdot\\text{col}_2$, el resultado depende de adónde pongas $\\hat{\\imath}$ y $\\hat{\\jmath}$.\n\nArrastra las puntas de $\\hat{\\imath}$ y de $\\hat{\\jmath}$ hasta que $A\\vec{v}$ llegue a $(4, 3)$. Hay muchas matrices que lo consiguen: vale cualquiera.',
          hints: [
            'Mira la lectura de la matriz y la flecha discontinua: es $2\\hat{\\imath}+\\hat{\\jmath}$.',
            'Elige primero un sitio sencillo para $\\hat{\\imath}$ y calcula cuánto le falta a $2\\hat{\\imath}$ para llegar a $(4, 3)$: eso lo tiene que poner $\\hat{\\jmath}$.',
          ],
          explain:
            'Un solo vector no basta para fijar la matriz: hay dos columnas que elegir y un solo punto de llegada, así que sobra libertad. Fija una columna y la otra queda determinada.',
          solution:
            'Por ejemplo, con $A\\hat{\\imath}=(1, 1)$ hace falta $2\\cdot(1, 1)+A\\hat{\\jmath}=(4, 3)$, es decir, $A\\hat{\\jmath}=(2, 1)$. También sirven $A\\hat{\\imath}=(2, 1)$ con $A\\hat{\\jmath}=(0, 1)$, o $A\\hat{\\imath}=(0, 1)$ con $A\\hat{\\jmath}=(4, 1)$.',
          plane: transformPlane({
            movable: true,
            extra: [vec(2, 1, false)],
            apply: ['v'],
            readouts: ['matrix'],
            range: 4,
          }),
          goals: [
            { metric: 'img_x', of: ['i', 'j', 'v'], target: 4, tol: 0.01 },
            { metric: 'img_y', of: ['i', 'j', 'v'], target: 3, tol: 0.01 },
          ],
        },
        {
          id: 'matriz-vector.ex00.5',
          type: 'manipular',
          prompt:
            'Esta matriz tiene las dos columnas sobre la misma recta: $\\begin{pmatrix}2&-2\\\\1&-1\\end{pmatrix}$, con $A\\hat{\\imath}=(2, 1)$ y $A\\hat{\\jmath}=(-2, -1)$. Mira cómo se aplasta la rejilla.\n\nEl vector nulo $(0, 0)$ siempre se queda en $(0, 0)$, así que no cuenta. Busca un vector **distinto del nulo** que esta matriz mande a $(0, 0)$. Para que no valga el nulo, pon su coordenada $x$ en $2$.',
          hints: [
            'Con $\\vec{v}=(2, b)$, el resultado es $2\\cdot(2, 1)+b\\cdot(-2, -1)$. ¿Qué $b$ hace que las dos columnas se cancelen?',
            'Las dos columnas son una la opuesta de la otra: para anularlas hay que tomar la misma cantidad de las dos.',
          ],
          explain:
            'Como las dos columnas están sobre la misma recta, una puede cancelar a la otra: es la forma de que una combinación no nula dé el vector nulo. Eso significa que la matriz pierde información: varios vectores acaban en el mismo punto.',
          solution:
            'Hay que tomar de las dos columnas la misma cantidad, porque $A\\hat{\\jmath}=-A\\hat{\\imath}$: con $\\vec{v}=(2, 2)$, $2\\cdot(2, 1)+2\\cdot(-2, -1)=(0, 0)$. Cualquier $(t, t)$ sirve, y todos acaban en el mismo punto que el vector nulo: la matriz aplasta el plano en una recta y no se puede deshacer.',
          plane: transformPlane({
            i: [2, 1],
            j: [-2, -1],
            extra: [vec(1, 2, true)],
            apply: ['v'],
            readouts: ['matrix', 'det'],
          }),
          goals: [
            { metric: 'img_x', of: ['i', 'j', 'v'], target: 0, tol: 0.01 },
            { metric: 'img_y', of: ['i', 'j', 'v'], target: 0, tol: 0.01 },
            { metric: 'x', of: ['v'], target: 2, tol: 0.01 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'matriz-vector.ex01.1',
          type: 'vector',
          prompt:
            'Calcula $A\\vec{v}$ **por columnas**, con $A=\\begin{pmatrix}3&-1\\\\2&4\\end{pmatrix}$ y $\\vec{v}=(2, 1)$: es $v_1\\cdot\\text{col}_1+v_2\\cdot\\text{col}_2$. Escribe el resultado: primero la $x$ y después la $y$.',
          hints: [
            'Las columnas de $A$ son $(3, 2)$ y $(-1, 4)$.',
            'Multiplica la primera columna por $2$ y la segunda por $1$, y suma los dos vectores componente a componente.',
          ],
          explain:
            'Las coordenadas de $\\vec{v}$ son los pesos de la combinación: la primera multiplica a la primera columna y la segunda, a la segunda. Después se suman los dos vectores.',
          solution: '$2\\cdot(3, 2)+1\\cdot(-1, 4)=(6, 4)+(-1, 4)=(5, 8)$.',
          answer: [5, 8],
          tol: 0,
        },
        {
          id: 'matriz-vector.ex01.2',
          type: 'numero',
          prompt:
            'También se puede calcular por **filas**: la componente $k$ de $A\\vec{v}$ es el producto escalar de la fila $k$ de $A$ con $\\vec{v}$. Con\n\n$$A=\\begin{pmatrix}2&-1&3\\\\1&4&0\\end{pmatrix},\\qquad \\vec{v}=(1, 2, -1)$$\n\n¿cuánto vale la primera componente de $A\\vec{v}$?',
          hints: [
            'La primera componente sale de la primera fila, $(2, -1, 3)$, y de $\\vec{v}$.',
            'Multiplica las componentes de dos en dos, por posición, y suma los tres productos. Cuidado con los signos.',
          ],
          explain:
            'Es el producto escalar de la primera fila con $\\vec{v}$: se multiplican las componentes de dos en dos y se suman. La segunda fila no interviene en esta componente.',
          solution:
            '$2\\cdot 1+(-1)\\cdot 2+3\\cdot(-1)=2-2-3=-3$. La segunda componente saldría de la segunda fila: $1\\cdot 1+4\\cdot 2+0\\cdot(-1)=9$.',
          answer: -3,
          tol: 0,
        },
        {
          id: 'matriz-vector.ex01.3',
          type: 'numero',
          prompt:
            'La **forma** de la matriz decide con qué vectores se puede multiplicar. La matriz $B$ tiene 3 filas y 2 columnas ($3\\times 2$), y se multiplica por un vector $\\vec{u}$ de 2 componentes. ¿Cuántas componentes tiene el resultado $B\\vec{u}$?',
          hints: [
            'Para multiplicar, las columnas de $B$ se emparejan con las componentes de $\\vec{u}$, y por eso son 2 y 2.',
            'Cada componente del resultado sale de una fila de $B$.',
          ],
          explain:
            'Las columnas de la matriz se gastan al emparejarse con las componentes del vector. Lo que queda es el número de filas, y cada fila da una componente del resultado.',
          solution:
            'El resultado tiene una componente por cada fila de $B$: **3**. Una matriz de $m\\times n$ toma vectores de $n$ componentes y devuelve vectores de $m$.',
          answer: 3,
          tol: 0,
        },
        {
          id: 'matriz-vector.ex01.4',
          type: 'vector',
          prompt:
            'Una **capa lineal** de una red neuronal calcula $\\vec{y}=W\\vec{x}+\\vec{b}$: la matriz $W$ de pesos transforma la entrada $\\vec{x}$, y después se suma el **sesgo** $\\vec{b}$. Calcula $\\vec{y}$ con\n\n$$W=\\begin{pmatrix}1&0&2\\\\-1&3&1\\end{pmatrix},\\qquad \\vec{x}=(2, 1, 1),\\qquad \\vec{b}=(1, -1)$$\n\nEscribe el resultado: primero la primera componente y después la segunda.',
          hints: [
            'Primero calcula $W\\vec{x}$, que tiene 2 componentes: una por cada fila de $W$.',
            'El sesgo se suma al final, a $W\\vec{x}$, componente a componente.',
          ],
          explain:
            'El orden importa: se transforma $\\vec{x}$ con $W$ y después se suma $\\vec{b}$. Sumar el sesgo a la entrada antes de multiplicar da otro resultado.',
          solution:
            '$W\\vec{x}=(1\\cdot 2+0\\cdot 1+2\\cdot 1,\\ -1\\cdot 2+3\\cdot 1+1\\cdot 1)=(4, 2)$. Sumando el sesgo: $\\vec{y}=(4+1,\\ 2-1)=(5, 1)$.',
          answer: [5, 1],
          tol: 0,
        },
        {
          id: 'matriz-vector.ex01.5',
          type: 'opcion',
          prompt:
            'Una matriz de $m$ filas y $n$ columnas solo se puede multiplicar por un vector que tenga el número de componentes adecuado. ¿Cuál de estos productos NO está definido?',
          hints: [
            'En cada producto, compara las columnas de la matriz con las componentes del vector: tienen que coincidir.',
            'El número de filas de la matriz no tiene que coincidir con nada: solo decide cuántas componentes tiene el resultado.',
          ],
          explain:
            'Tacha las opciones en las que las columnas de la matriz y las componentes del vector coinciden. Queda la que no se puede calcular.',
          solution:
            'Una matriz de 2 filas y 3 columnas toma vectores de 3 componentes, no de 2: a su tercera columna no le correspondería ninguna componente. Los otros tres productos sí están definidos: dan un vector de 2, de 3 y de 1 componentes.',
          options: [
            'Una matriz de 2 filas y 3 columnas por un vector de 3 componentes',
            'Una matriz de 3 filas y 2 columnas por un vector de 2 componentes',
            'Una matriz de 2 filas y 3 columnas por un vector de 2 componentes',
            'Una matriz de 1 fila y 4 columnas por un vector de 4 componentes',
          ],
          correct: 2,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'matriz-vector.ex02.1',
          type: 'codigo',
          prompt:
            'El operador `@` multiplica una matriz por un vector, y cada componente del resultado sale de una fila de la matriz. Ya tienes `A`, una matriz de 3 filas y 2 columnas, y `v`, un vector de 2 componentes. Guarda en `w`, como array de NumPy, la imagen de `v` por `A`.',
          hints: [
            'La matriz va a la izquierda del `@` y el vector, a la derecha.',
            'El resultado tiene una componente por cada fila de `A`, o sea 3.',
          ],
          explain:
            'El operador `@` hace el producto de una matriz por un vector. Con `*` no sale lo mismo: multiplica elemento a elemento, sin sumar nada, y deja una matriz.',
          solution:
            'Se escribe `w = A @ v`. El resultado es `[2, 3, -5]`: la primera componente es $1\\cdot 2+0\\cdot(-1)=2$, la segunda $2\\cdot 2+1\\cdot(-1)=3$ y la tercera $-1\\cdot 2+3\\cdot(-1)=-5$.',
          starter: `import numpy as np

A = np.array([[1, 0], [2, 1], [-1, 3]])
v = np.array([2, -1])
# Guarda en w la imagen de v por A
w = None
`,
          checks: `_arr = isinstance(w, np.ndarray) and np.issubdtype(w.dtype, np.number)
_ok = _arr and w.shape == (3,)
check(_arr, "\`w\` tiene que ser un array de NumPy con números: la imagen de \`v\` por \`A\`.")
check((not _arr) or w.shape != (3, 2), "\`w\` es una matriz de 3 filas y 2 columnas: eso es lo que da \`A * v\`, que multiplica cada columna de \`A\` por una componente de \`v\` pero no suma las columnas. El producto de una matriz por un vector se escribe con \`@\`.")
check((not _arr) or w.shape in ((3,), (3, 2)), "\`w\` tiene que ser un vector de 3 componentes: una por cada fila de \`A\`.")
check((not _ok) or np.allclose(w, [2, 3, -5]), "\`w\` tiene que valer (2, 3, -5): cada componente sale de multiplicar una fila de \`A\` por \`v\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 0], [2, 1], [-1, 3]])\nv = np.array([2, -1])\nw = A @ v\n',
        },
        {
          id: 'matriz-vector.ex02.2',
          type: 'codigo',
          prompt:
            'Por columnas, $A\\vec{v}=v_1\\cdot\\text{col}_1+v_2\\cdot\\text{col}_2+\\dots$. En NumPy, `A[:, k]` es la columna `k` de `A` (se empieza a contar en 0) y `v[k]` es la componente `k` de `v`. `np.zeros(n)` crea un vector de `n` ceros.\n\nEscribe la función `aplicar(A, v)` para que devuelva `A` por `v` **construyéndolo con las columnas**, sin usar `@` ni `np.dot`. `A` tiene `m` filas y `n` columnas, y `v` tiene `n` componentes.',
          hints: [
            'Empieza con un vector de `m` ceros y, por cada columna `k`, súmale `v[k]` por la columna `k`.',
            '`A.shape[0]` es el número de filas y `len(v)`, el de componentes de `v`, que es el de columnas. Una columna de `A` es un vector con `m` componentes.',
          ],
          explain:
            'El resultado es una suma con tantos términos como columnas tiene `A`, y cada término es una columna multiplicada por su componente de `v`. Con un bucle sobre las columnas sirve para cualquier forma de matriz.',
          solution:
            'Se acumulan las columnas: `w = np.zeros(A.shape[0])`, y para cada `k` en `range(len(v))`, `w = w + v[k] * A[:, k]`. Al final se devuelve `w`. Con `A` de 2 filas y 2 columnas y `v = (1, 1)`, suma las dos columnas enteras. Un bucle fijo de dos vueltas fallaría con una matriz de 3 columnas.',
          starter: `import numpy as np


def aplicar(A, v):
    # Devuelve A por v sumando las columnas de A, cada una multiplicada por su componente de v
    return None
`,
          checks: `_f = aplicar
_usa = []


class _M(np.ndarray):
    def __matmul__(self, otro):
        _usa.append(1)
        return np.matmul(np.asarray(self), np.asarray(otro))

    def __rmatmul__(self, otro):
        _usa.append(1)
        return np.matmul(np.asarray(otro), np.asarray(self))

    def dot(self, otro, out=None):
        _usa.append(1)
        return np.asarray(self).dot(np.asarray(otro))

    def __array_function__(self, func, types, args, kwargs):
        if func.__name__ in ("dot", "matmul", "tensordot", "einsum", "inner", "vdot"):
            _usa.append(1)
        return super().__array_function__(func, types, args, kwargs)


def _llamar(A, v):
    try:
        r = np.asarray(_f(np.array(A).view(_M), np.array(v).view(_M)))
    except BaseException:
        return None
    if np.issubdtype(r.dtype, np.number) and r.shape == (len(A),):
        return r.astype(float)
    return None


_casos = [
    ([[1, 2], [3, 4]], [1, 1]),
    ([[2, 0], [1, 3]], [3, -1]),
    ([[1, 0], [2, 1], [-1, 3]], [2, -1]),
    ([[1, 2, 0], [3, -1, 2]], [2, 1, -1]),
]
_r = [_llamar(A, v) for A, v in _casos]
_e = [np.array(A) @ np.array(v) for A, v in _casos]
_p = _r[0]
_bien = all(r is not None and np.allclose(r, e) for r, e in zip(_r, _e))
check(_p is not None, "\`aplicar(A, v)\` tiene que devolver un array de NumPy con una componente por cada fila de \`A\`. Prueba con \`A = [[1, 2], [3, 4]]\` y \`v = (1, 1)\`: si no devuelve nada, falta el \`return\`; si da un error, revisa el cálculo.")
check(len(_usa) == 0, "Tu función usa \`@\` o \`np.dot\`: se pide construir el resultado a mano, sumando las columnas de \`A\`, cada una multiplicada por su componente de \`v\`.")
check(_p is None or len(_usa) > 0 or _bien, "Tu función no calcula bien \`A\` por \`v\` en todos los casos. Con \`A = [[1, 2], [3, 4]]\` y \`v = (1, 1)\` tiene que dar (3, 7), y también tiene que servir con 3 filas o con 3 columnas.")
`,
          reference: `import numpy as np


def aplicar(A, v):
    w = np.zeros(A.shape[0])
    for k in range(len(v)):
        w = w + v[k] * A[:, k]
    return w
`,
        },
        {
          id: 'matriz-vector.ex02.3',
          type: 'codigo',
          prompt:
            'Por filas, cada componente de $A\\vec{v}$ es el producto escalar de una fila de `A` con `v`. En NumPy, `A[0]` es la primera fila de `A` y `np.dot(a, b)` calcula el producto escalar de dos vectores.\n\nGuarda en `c0` el producto escalar de la primera fila de `A` con `v` y en `c1`, el de la segunda. Guarda en `w`, como array de NumPy, el vector con esas dos componentes, en ese orden.',
          hints: [
            'Las filas de `A` son `A[0]` y `A[1]`. `c0` y `c1` son números sueltos, no vectores.',
            '`np.dot(A[0], v)` multiplica las componentes de dos en dos y suma: da un solo número. Para `w`, junta `c0` y `c1` en un array.',
          ],
          explain:
            'Cada componente del resultado es un producto escalar, y un producto escalar es un solo número. Cuidado con `*`: multiplica sin sumar y deja un vector, no un número.',
          solution:
            'Se escribe `c0 = np.dot(A[0], v)` y `c1 = np.dot(A[1], v)`, que valen $1\\cdot 2+2\\cdot 1+0\\cdot(-1)=4$ y $3\\cdot 2+(-1)\\cdot 1+2\\cdot(-1)=3$. El resultado, `w`, es `[4, 3]`: los dos números, uno por fila de `A`, metidos en un array.',
          starter: `import numpy as np

A = np.array([[1, 2, 0], [3, -1, 2]])
v = np.array([2, 1, -1])
# Guarda en c0 el producto escalar de la primera fila de A con v, y en c1 el de la segunda
c0 = None
c1 = None
# Guarda en w el vector con las dos componentes, c0 y c1
w = None
`,
          checks: `def _esc(x):
    if isinstance(x, (bool, np.bool_)):
        return False
    if isinstance(x, np.ndarray):
        return x.ndim == 0 and np.issubdtype(x.dtype, np.number)
    return isinstance(x, (int, float, np.integer, np.floating))


_e0 = _esc(c0)
_e1 = _esc(c1)
_lista0 = isinstance(c0, np.ndarray) and c0.ndim == 1
_lista1 = isinstance(c1, np.ndarray) and c1.ndim == 1
_w = isinstance(w, np.ndarray) and w.shape == (2,) and np.issubdtype(w.dtype, np.number)
_cambio = _e0 and _e1 and abs(c0 - 3) < 1e-9 and abs(c1 - 4) < 1e-9
check(_e0 or _lista0, "\`c0\` tiene que ser un número: el producto escalar de la primera fila de \`A\` con \`v\`.")
check(not _lista0, "\`c0\` es una lista de números, no uno solo: has multiplicado la fila por \`v\` componente a componente y falta sumar los productos. Eso es lo que hace el producto escalar.")
check(_e1 or _lista1, "\`c1\` tiene que ser un número: el producto escalar de la segunda fila de \`A\` con \`v\`.")
check(not _lista1, "\`c1\` es una lista de números, no uno solo: has multiplicado la fila por \`v\` componente a componente y falta sumar los productos. Eso es lo que hace el producto escalar.")
check(not _cambio, "\`c0\` y \`c1\` están intercambiados: \`c0\` es de la primera fila de \`A\` y \`c1\`, de la segunda.")
check((not _e0) or _cambio or abs(c0 - 4) < 1e-9, "\`c0\` tiene que valer 4: el producto escalar de la primera fila de \`A\`, (1, 2, 0), con \`v\`, (2, 1, -1).")
check((not _e1) or _cambio or abs(c1 - 3) < 1e-9, "\`c1\` tiene que valer 3: el producto escalar de la segunda fila de \`A\`, (3, -1, 2), con \`v\`, (2, 1, -1).")
check(_w or not (_e0 and _e1), "\`w\` tiene que ser un array de NumPy con 2 números: las componentes \`c0\` y \`c1\`.")
check((not _w) or _cambio or np.allclose(w, [4, 3]), "\`w\` tiene que valer (4, 3): sus componentes son \`c0\` y \`c1\`, en ese orden.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 2, 0], [3, -1, 2]])\nv = np.array([2, 1, -1])\nc0 = np.dot(A[0], v)\nc1 = np.dot(A[1], v)\nw = np.array([c0, c1])\n',
        },
        {
          id: 'matriz-vector.ex02.4',
          type: 'codigo',
          prompt:
            'Una matriz también puede guardar **muchos vectores a la vez**, uno por fila. Aquí, `X` guarda cuatro vectores de 2 componentes: $(1, 0)$, $(0, 1)$, $(2, 3)$ y $(-1, 1)$. Se quiere transformarlos todos con `A` de una sola vez.\n\nMultiplicar `X @ A` no sirve: usa las filas de `A` como si fueran sus columnas. La traspuesta `A.T` cambia filas por columnas. Guarda en `Y` las cuatro imágenes, una por fila: en la fila `k` de `Y` va la imagen de la fila `k` de `X`.',
          hints: [
            'La imagen de un vector `x` es `A @ x`. Para que `X` deje sus vectores en filas, necesitas multiplicar `X` por la traspuesta de `A`.',
            'Comprueba la primera fila de `Y`: la imagen de $(1, 0)$ es la primera columna de `A`, $(2, 0)$. `Y` tiene que tener 4 filas y 2 columnas.',
          ],
          explain:
            'Cada fila de `X` es un vector que se transforma con `A`. Para hacerlo todo con una sola multiplicación, `A` tiene que ir a la derecha y traspuesta, porque así cada fila de `X` se empareja con las columnas de la traspuesta, que son las filas de `A`.',
          solution:
            'Se escribe `Y = X @ A.T`. Las filas de `Y` son `[2, 0]`, `[1, 3]`, `[7, 9]` y `[-1, 3]`: por ejemplo, la imagen de $(2, 3)$ es $2\\cdot(2, 0)+3\\cdot(1, 3)=(7, 9)$. Con `X @ A` saldrían las imágenes por la traspuesta de `A`: `[2, 1]`, `[0, 3]`, `[4, 11]` y `[-2, 2]`, que es otra transformación.',
          starter: `import numpy as np

A = np.array([[2, 1], [0, 3]])
# Un vector por fila: (1, 0), (0, 1), (2, 3) y (-1, 1)
X = np.array([[1, 0], [0, 1], [2, 3], [-1, 1]])
# Guarda en Y las imágenes de los cuatro vectores, una por fila
Y = None
`,
          checks: `_A = np.array([[2, 1], [0, 3]])
_X = np.array([[1, 0], [0, 1], [2, 3], [-1, 1]])
_bien = _X @ _A.T
_arr = isinstance(Y, np.ndarray) and np.issubdtype(Y.dtype, np.number)
_ok = _arr and Y.shape == (4, 2)
_tras = _arr and Y.shape == (2, 4) and np.allclose(Y, _bien.T)
_sinT = _ok and np.allclose(Y, _X @ _A)
check(_arr, "\`Y\` tiene que ser un array de NumPy con números: las imágenes de los cuatro vectores.")
check(not _tras, "\`Y\` tiene una columna por vector y 2 filas: está traspuesta. Se pide una fila por cada vector de \`X\`, así que tiene que tener 4 filas y 2 columnas.")
check(not _sinT, "\`Y\` es \`X @ A\`, que usa las filas de \`A\` como si fueran columnas: aplica la traspuesta de \`A\` y no \`A\`. Las filas de \`X\` son vectores, y para transformarlos hay que multiplicar por \`A.T\`.")
check((not _arr) or _tras or Y.shape == (4, 2), "\`Y\` tiene que tener 4 filas y 2 columnas: una fila por cada vector de \`X\`.")
check((not _ok) or _sinT or np.allclose(Y, _bien), "\`Y\` no tiene los valores esperados: la primera fila, la imagen de (1, 0), tiene que ser (2, 0), la primera columna de \`A\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[2, 1], [0, 3]])\nX = np.array([[1, 0], [0, 1], [2, 3], [-1, 1]])\nY = X @ A.T\n',
        },
        {
          id: 'matriz-vector.ex02.5',
          type: 'codigo',
          prompt:
            'Una **capa lineal** de una red calcula $\\vec{y}=W\\vec{x}+\\vec{b}$. Tienes la capa `W`, de 2 filas y 3 columnas, con su sesgo `b` de 2 componentes, y `X`, con un vector de entrada de 3 componentes por fila.\n\nEscribe `capa(W, b, x)`, que devuelve la salida de la capa para un vector `x`, y guarda en `y` la salida para el vector $(1, 2, 1)$. Después guarda en `Y` las salidas para las tres filas de `X` de una sola vez, una por fila: se multiplica `X` por la traspuesta de `W`, y al sumar un vector de 2 componentes a una matriz de 3 filas y 2 columnas, NumPy se lo suma a cada fila.',
          hints: [
            'Dentro de la función, `W @ x` es la parte de la matriz; el sesgo se suma después.',
            'Para el lote, la matriz va a la derecha y traspuesta, igual que antes. El sesgo `b` se suma una sola vez al final, a toda la matriz, y NumPy lo reparte entre las filas.',
          ],
          explain:
            'La capa para un vector y la capa para un lote hacen el mismo cálculo: el lote se escribe con la matriz traspuesta porque sus vectores están en filas. Fíjate en que el sesgo se suma después de multiplicar, no antes.',
          solution:
            'La función es `return W @ x + b`. Con $(1, 2, 1)$: $W\\vec{x}=(0, 6)$ y, sumando $\\vec{b}=(0, -2)$, `y` vale `[0, 4]`. Para el lote, `Y = X @ W.T + b`: las filas de `Y` son `[0, 4]`, `[-1, -1]` y `[6, -2]`. La primera coincide con `y`, que es lo esperado: es el mismo cálculo hecho de golpe. Si te olvidas del sesgo, `Y` sale con la columna 2 más grande en 2 unidades.',
          starter: `import numpy as np


def capa(W, b, x):
    # Devuelve la salida de la capa lineal para un solo vector x
    return None


W = np.array([[2, -1, 0], [1, 1, 3]])
b = np.array([0, -2])
# Un vector de entrada por fila
X = np.array([[1, 2, 1], [0, 1, 0], [3, 0, -1]])
# Guarda en y la salida de la capa para el vector (1, 2, 1)
y = None
# Guarda en Y las salidas para las tres filas de X, de una sola vez
Y = None
`,
          checks: `_f = capa


def _llamar(W, b, x):
    try:
        r = np.asarray(_f(np.array(W), np.array(b), np.array(x)))
    except BaseException:
        return None
    if np.issubdtype(r.dtype, np.number) and r.shape == (len(W),):
        return r.astype(float)
    return None


_casos = [
    ([[2, -1, 0], [1, 1, 3]], [0, -2], [1, 2, 1]),
    ([[1, 0], [0, 1]], [5, -5], [3, 4]),
    ([[1, 2, 3]], [1], [1, 1, 1]),
    ([[1, -1], [2, 0], [0, 3]], [0, 0, 1], [2, 1]),
]
_r = [_llamar(W_, b_, x_) for W_, b_, x_ in _casos]
_e = [np.array(W_) @ np.array(x_) + np.array(b_) for W_, b_, x_ in _casos]
_sinb = [np.array(W_) @ np.array(x_) for W_, b_, x_ in _casos]
_p = _r[0]
_bien = all(r is not None and np.allclose(r, e) for r, e in zip(_r, _e))
_nob = all(r is not None and np.allclose(r, s) for r, s in zip(_r, _sinb))
check(_p is not None, "\`capa(W, b, x)\` tiene que devolver un array de NumPy con una componente por cada fila de \`W\`. Prueba con \`x = (1, 2, 1)\`: si no devuelve nada, falta el \`return\`; si da un error, revisa el cálculo.")
check(not _nob, "Tu función no suma el sesgo \`b\`: la capa lineal calcula \`W\` por \`x\` y después le suma \`b\`.")
check(_p is None or _nob or _bien, "Tu función no calcula bien la capa en todos los casos. Con \`x = (1, 2, 1)\` tiene que dar (0, 4): \`W\` por \`x\` es (0, 6) y el sesgo resta 2 a la segunda componente.")
_ey = isinstance(y, np.ndarray) and y.shape == (2,) and np.issubdtype(y.dtype, np.number)
check(_ey, "\`y\` tiene que ser un array de NumPy con 2 números: la salida de la capa para el vector (1, 2, 1).")
check((not _ey) or np.allclose(y, [0, 4]), "\`y\` tiene que valer (0, 4): la capa aplicada al vector (1, 2, 1).")
_Xa = np.array([[1, 2, 1], [0, 1, 0], [3, 0, -1]])
_Wa = np.array([[2, -1, 0], [1, 1, 3]])
_ba = np.array([0, -2])
_arr = isinstance(Y, np.ndarray) and np.issubdtype(Y.dtype, np.number)
_okY = _arr and Y.shape == (3, 2)
_nobY = _okY and np.allclose(Y, _Xa @ _Wa.T)
check(_arr, "\`Y\` tiene que ser un array de NumPy con números: las salidas de la capa para los tres vectores de \`X\`.")
check((not _arr) or Y.shape == (3, 2), "\`Y\` tiene que tener 3 filas y 2 columnas: una fila por cada vector de \`X\`, con las 2 salidas de la capa.")
check(not _nobY, "\`Y\` no incluye el sesgo \`b\`: falta sumárselo a cada fila.")
check((not _okY) or _nobY or np.allclose(Y, _Xa @ _Wa.T + _ba), "\`Y\` no tiene los valores esperados: cada fila tiene que ser la salida de la capa para la fila correspondiente de \`X\`. La primera es (0, 4).")
`,
          reference: `import numpy as np


def capa(W, b, x):
    return W @ x + b


W = np.array([[2, -1, 0], [1, 1, 3]])
b = np.array([0, -2])
X = np.array([[1, 2, 1], [0, 1, 0], [3, 0, -1]])
y = capa(W, b, np.array([1, 2, 1]))
Y = X @ W.T + b
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'matriz-vector.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere guardar en `w` la imagen del vector `v` por la matriz `A`, que es el vector $(3, 7)$ (NumPy ya está importado como `np`). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        '¿Cuántas componentes tiene que tener `w`? ¿Y qué forma tiene lo que da la última línea?',
        'Piensa en lo que hace el signo `*` entre un array de dos ejes y uno de un eje: ¿multiplica una matriz por un vector?',
      ],
      explain:
        'Comprueba la forma del resultado: una imagen de `v` es un vector con una componente por fila de `A`. Después revisa si la operación escrita hace el producto de la matriz por el vector.',
      solution:
        'La tercera línea está mal. `A * v` multiplica elemento a elemento: cada columna de `A` por una componente de `v`, sin sumar nada. Con `v = (1, 1)` devuelve la propia `A`, una matriz, no el vector $(3, 7)$. Lo correcto es `w = A @ v`.',
      lines: ['A = np.array([[1, 2], [3, 4]])', 'v = np.array([1, 1])', 'w = A * v'],
      faultyLine: 2,
    },
    {
      id: 'matriz-vector.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula la salida de una capa lineal, $\\vec{y}=W\\vec{x}+\\vec{b}$, con $W=\\begin{pmatrix}1&2\\\\0&-1\\end{pmatrix}$, $\\vec{x}=(3, 1)$ y $\\vec{b}=(1, 1)$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Repasa el orden de las operaciones de una capa lineal: ¿qué se hace primero, multiplicar por $W$ o sumar $\\vec{b}$?',
        'Las columnas de $W$ son $(1, 0)$ y $(2, -1)$. Calcula $W\\vec{x}$ aparte y compara con lo que se hace aquí.',
      ],
      explain:
        'Cada línea hay que leerla contra la fórmula de la capa. Mira a qué vector se le suma el sesgo y cuándo se multiplica por la matriz.',
      solution:
        'La primera línea está mal: el sesgo se suma a la salida $W\\vec{x}$, no a la entrada. Lo correcto es $W\\vec{x}=3\\cdot(1, 0)+1\\cdot(2, -1)=(5, -1)$ y después $\\vec{y}=(5, -1)+(1, 1)=(6, 0)$. Sumar antes $\\vec{b}$ a $\\vec{x}$ calcula $W(\\vec{x}+\\vec{b})=W\\vec{x}+W\\vec{b}$, que añade $W\\vec{b}=(3, -1)$ y no $\\vec{b}$.',
      lines: [
        'x + b = (3, 1) + (1, 1) = (4, 2)',
        'W (4, 2) = 4 · (1, 0) + 2 · (2, −1) = (8, −2)',
        'y = (8, −2)',
      ],
      faultyLine: 0,
    },
    {
      id: 'matriz-vector.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula $A\\vec{v}$ por filas, con $A=\\begin{pmatrix}2&1\\\\-1&3\\end{pmatrix}$ y $\\vec{v}=(1, 2)$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Cada componente del resultado es el producto escalar de una fila de $A$ con $\\vec{v}$.',
        'Haz tú mismo los dos productos escalares y compáralos con los de cada línea, con cuidado con los signos.',
      ],
      explain:
        'Revisa cada paso: ¿se usa la fila correcta? ¿Se multiplican las componentes por posición y se suman? ¿El resultado final reúne los dos números en su orden?',
      solution:
        'No hay ningún error. La primera fila da $2\\cdot 1+1\\cdot 2=4$, la segunda da $-1\\cdot 1+3\\cdot 2=5$, y $A\\vec{v}=(4, 5)$. Por columnas sale lo mismo: $1\\cdot(2, -1)+2\\cdot(1, 3)=(4, 5)$.',
      lines: [
        '(2, 1) · (1, 2) = 2 · 1 + 1 · 2 = 4',
        '(−1, 3) · (1, 2) = −1 · 1 + 3 · 2 = 5',
        'A v = (4, 5)',
      ],
      faultyLine: null,
    },
  ],
};
