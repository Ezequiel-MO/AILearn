import type { PlaneVector, Project } from '../../content/schema';
import { py } from '../py';
import { matrizVectorWarmup } from './matriz-vector.calentamiento';
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
  warmup: matrizVectorWarmup,
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
            'El plan es una sola línea: `w` es `A` y `v` unidos por el operador `@`, con la matriz a la izquierda y el vector a la derecha. Cuidado con `*`: en NumPy multiplica elemento a elemento, sin sumar, y deja una matriz en vez de un vector.',
            'La forma de cada pieza, con otra matriz y otro vector:\n\n' +
              py(
                'M = np.array([[1, 2], [0, 1]])',
                'u = np.array([3, 1])',
                'print(M @ u)   # [5 1]: cada componente sale de una fila de M con u',
                'print(M * u)   # [[3 2] [0 1]]: con * sale una matriz, no es lo que se pide',
              ) +
              '\n\nEl resultado de `@` tiene una componente por cada fila de la matriz. Aquí `A` tiene 3 filas, así que `w` tendrá 3 componentes.',
            'El esqueleto, con el hueco `___` donde decides tú:\n\n' +
              py('w = A ___ v') +
              '\n\nEl operador es el de multiplicar matrices, no el `*` de siempre: con `*` te saldría una matriz de 3 filas y 2 columnas.',
          ],
          explain:
            'El operador `@` hace el producto de una matriz por un vector. Con `*` no sale lo mismo: multiplica elemento a elemento, sin sumar nada, y deja una matriz.',
          solution:
            'Se escribe `w = A @ v`. El resultado es `[2, 3, -5]`: la primera componente es $1\\cdot 2+0\\cdot(-1)=2$, la segunda $2\\cdot 2+1\\cdot(-1)=3$ y la tercera $-1\\cdot 2+3\\cdot(-1)=-5$.',
          requirements: [
            '`w` existe y es un array de NumPy con números, con una componente por cada fila de `A`.',
            '`w` es la imagen de `v` por `A`: el producto de la matriz por el vector, no el producto componente a componente.',
          ],
          starter: `import numpy as np

A = np.array([[1, 0], [2, 1], [-1, 3]])
v = np.array([2, -1])
# A es una matriz: un array de NumPy con 3 filas y 2 columnas.
# Cada fila es una lista de 2 números, y A[0] es la primera fila.
# v es un vector: un array de NumPy con 2 componentes.

# PASO 1. La imagen de v por A: el vector que sale de pasar v por la matriz.
# Por qué: esa es la idea del producto de una matriz por un vector. Cada
# componente del resultado sale de una fila de A multiplicada por v, y como
# A tiene 3 filas, w tiene 3 componentes.
# En NumPy el producto de una matriz por un vector se escribe con el operador @,
# con la matriz a la izquierda y el vector a la derecha.
# No lo confundas con *: multiplica elemento a elemento, sin sumar nada, y deja
# una matriz. El resultado que se espera es un array de 3 números.
w = None

# Para ver qué vale algo antes de entregar: print(w) y pulsa «Ejecutar».
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
            'El plan, dentro de `aplicar`: crea `w`, un vector de ceros con una componente por cada fila de `A`. Después recorre las columnas, de la 0 a la última, y en cada vuelta súmale a `w` la columna `k` de `A` multiplicada por `v[k]`. Al terminar, devuelve `w`. Usa `len(v)` para saber cuántas columnas hay, y no un número escrito a mano, para que sirva con cualquier matriz.',
            'Las piezas, con otra matriz:\n\n' +
              py(
                'M = np.array([[1, 2, 5], [3, 4, 6]])',
                'print(M.shape)       # (2, 3): 2 filas y 3 columnas',
                'print(M.shape[0])    # 2: el número de filas',
                'print(M[:, 1])       # [2 4]: la columna 1 entera',
                'print(len(np.array([7, 8, 9])))   # 3: cuántas componentes tiene el vector',
                't = np.zeros(2)      # un vector de 2 ceros',
                'for k in range(3):',
                '    t = t + 10 * M[:, k]   # en cada vuelta se suma una columna',
                '    print(k, t)            # imprime 0 [10. 30.], después 1 [30. 70.], después 2 [ 80. 130.]',
              ) +
              '\n\n`for k in range(n):` repite lo que va debajo, con 4 espacios más de sangría, con `k` valiendo 0, 1, y así hasta `n - 1`. `return w` va con la sangría de la función, fuera del `for`: si estuviera dentro, saldría en la primera vuelta.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def aplicar(A, v):',
                '    w = np.zeros(___)',
                '    for k in range(___):',
                '        w = w + v[k] * ___',
                '    return w',
              ) +
              '\n\nLa columna `k` de `A` no es `A[k]`, que es la fila `k`: se escribe con los dos puntos, `A[:, k]`.',
          ],
          explain:
            'El resultado es una suma con tantos términos como columnas tiene `A`, y cada término es una columna multiplicada por su componente de `v`. Con un bucle sobre las columnas sirve para cualquier forma de matriz.',
          solution:
            'Se acumulan las columnas: `w = np.zeros(A.shape[0])`, y para cada `k` en `range(len(v))`, `w = w + v[k] * A[:, k]`. Al final se devuelve `w`. Con `A` de 2 filas y 2 columnas y `v = (1, 1)`, suma las dos columnas enteras. Un bucle fijo de dos vueltas fallaría con una matriz de 3 columnas.',
          requirements: [
            '`aplicar` existe y es una función que recibe una matriz `A` y un vector `v`.',
            'La función devuelve un array de NumPy con números y con una componente por cada fila de `A`: el producto de `A` por `v`.',
            'Se prueba con otras matrices y vectores además del ejemplo del enunciado, entre ellas matrices con 3 filas y matrices con 3 columnas, y la función no puede dar ningún error con ellas.',
            'La función no usa `@`, `np.dot` ni ninguna otra forma ya hecha del producto de matrices: el resultado se construye sumando columnas.',
          ],
          starter: `import numpy as np


# aplicar(A, v) recibe una matriz A (un array de NumPy de m filas y n columnas)
# y un vector v (un array de n componentes), y tiene que devolver A por v.
def aplicar(A, v):
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría):
    # así sabe Python que es parte de ella. Si la función tiene un bucle, lo de
    # dentro del bucle lleva otros 4 espacios más.
    #
    # PASO 1. Un vector de ceros donde ir acumulando el resultado.
    # Por qué: A por v es una suma de columnas, y una suma empieza en cero.
    # np.zeros(n) crea un array con n ceros. Tiene que haber un cero por cada
    # fila de A, y A.shape[0] te da cuántas filas tiene (A.shape es (filas, columnas)).
    #
    # PASO 2. Un bucle que recorre las columnas de A.
    # Por qué: A por v es v[0] por la columna 0, más v[1] por la columna 1, y así
    # con todas. Un bucle sirve para cualquier número de columnas.
    # for k in range(n): repite lo que va debajo con k valiendo 0, 1, ... hasta n - 1.
    # len(v) te da cuántas componentes tiene v, que son tantas como columnas de A.
    # Dentro del bucle, A[:, k] es la columna k de A y v[k] es la componente k de v.
    # Para sumar a lo acumulado: w = w + (un número) * (un vector).
    #
    # PASO 3. Devolver el resultado con return, ya fuera del bucle (con la sangría
    # de la función, no la del for). return termina la función y entrega ese valor.
    # Se espera un array de NumPy con una componente por fila de A.
    # No uses @ ni np.dot: la gracia es construir el resultado con las columnas.
    return None


# Para ver qué vale algo antes de entregar: print(aplicar(np.array([[1, 2], [3, 4]]), np.array([1, 1])))
# y pulsa «Ejecutar».
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
            'El plan son tres líneas. `c0` es el producto escalar de la primera fila de `A`, que es `A[0]`, con `v`. `c1` es lo mismo con la segunda fila, `A[1]`. Y `w` junta los dos números en un array, con `c0` primero y `c1` después. Tanto `c0` como `c1` son un número suelto, no un vector: si te sale una lista de números, falta sumar los productos.',
            'Las piezas, con otra matriz y otro vector:\n\n' +
              py(
                'M = np.array([[1, 2], [3, 4]])',
                'u = np.array([5, 6])',
                'print(M[1])              # [3 4]: la segunda fila de M',
                'print(np.dot(M[1], u))   # 39: 3 por 5 más 4 por 6, un solo número',
                'print(M[1] * u)          # [15 24]: con * se multiplica sin sumar, y sale una lista',
                'print(np.array([7, 8]))  # [7 8]: así se junta una lista de números en un array',
              ) +
              '\n\nLas filas se cuentan desde 0: la primera es `[0]` y la segunda, `[1]`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('c0 = np.dot(___, v)', 'c1 = np.dot(___, v)', 'w = np.array([___, ___])') +
              '\n\nEn `w` van `c0` y `c1`, en ese orden, y no las filas de `A`.',
          ],
          explain:
            'Cada componente del resultado es un producto escalar, y un producto escalar es un solo número. Cuidado con `*`: multiplica sin sumar y deja un vector, no un número.',
          solution:
            'Se escribe `c0 = np.dot(A[0], v)` y `c1 = np.dot(A[1], v)`, que valen $1\\cdot 2+2\\cdot 1+0\\cdot(-1)=4$ y $3\\cdot 2+(-1)\\cdot 1+2\\cdot(-1)=3$. El resultado, `w`, es `[4, 3]`: los dos números, uno por fila de `A`, metidos en un array.',
          requirements: [
            '`c0` y `c1` existen y cada una es un solo número, no un vector: el producto escalar de una fila de `A` con `v`.',
            '`c0` es el de la primera fila de `A` y `c1`, el de la segunda, sin intercambiarlos.',
            '`w` existe y es un array de NumPy con 2 componentes, las dos números: `c0` y `c1`, en ese orden.',
          ],
          starter: `import numpy as np

A = np.array([[1, 2, 0], [3, -1, 2]])
v = np.array([2, 1, -1])
# A es una matriz: un array de NumPy con 2 filas y 3 columnas.
# A[0] es su primera fila y A[1], la segunda (se empieza a contar en 0).
# v es un vector: un array de NumPy con 3 componentes.

# PASO 1. El producto escalar de la primera fila de A con v, y el de la segunda.
# Por qué: cada componente de A por v es justo eso, el producto escalar de una
# fila de A con v. Aquí lo haces a mano, componente a componente.
# np.dot(a, b) multiplica las componentes de a y b de dos en dos y suma todo:
# da UN solo número, no una lista.
# Se espera un número en c0 (el de la primera fila) y otro en c1 (el de la segunda).
c0 = None
c1 = None

# PASO 2. Juntar los dos números en un array de NumPy, c0 primero y c1 después.
# Por qué: así w es el vector que sale de A por v, con una componente por fila.
# np.array([x, y]) construye un array con los números de la lista, en ese orden.
w = None

# Para ver qué vale algo antes de entregar: print(c0, c1, w) y pulsa «Ejecutar».
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
            'El plan es una sola línea. Los vectores de `X` están en filas, y `@` combina las filas de la izquierda con las columnas de la derecha. Por eso `X` va a la izquierda, y a la derecha va la traspuesta de `A`, que es `A.T`: así las filas de `A` pasan a ser columnas. Si pones `A` sin trasponer, usarás sus filas como si fueran columnas y saldrá otra transformación.',
            'Las piezas, con otra matriz y otros vectores:\n\n' +
              py(
                'M = np.array([[1, 2], [3, 4]])',
                'print(M.T)          # [[1 3] [2 4]]: las filas de M pasan a ser columnas',
                'P = np.array([[1, 0], [0, 1], [1, 1]])   # tres vectores, uno por fila',
                'print(P.shape)      # (3, 2): 3 filas y 2 columnas',
                'print(P @ M.T)      # [[1 3] [2 4] [3 7]]: una fila por vector, la imagen de cada uno',
              ) +
              '\n\nEl resultado tiene tantas filas como vectores hay en la matriz de la izquierda. Aquí, `X` tiene 4, así que `Y` tendrá 4 filas.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('Y = ___ @ ___.T') +
              '\n\nLa traspuesta es la de la matriz que transforma, no la de los vectores: si escribes `A @ X.T`, `Y` te sale con 2 filas y 4 columnas, con cada resultado en una columna en vez de en una fila.',
          ],
          explain:
            'Cada fila de `X` es un vector que se transforma con `A`. Para hacerlo todo con una sola multiplicación, `A` tiene que ir a la derecha y traspuesta, porque así cada fila de `X` se empareja con las columnas de la traspuesta, que son las filas de `A`.',
          solution:
            'Se escribe `Y = X @ A.T`. Las filas de `Y` son `[2, 0]`, `[1, 3]`, `[7, 9]` y `[-1, 3]`: por ejemplo, la imagen de $(2, 3)$ es $2\\cdot(2, 0)+3\\cdot(1, 3)=(7, 9)$. Con `X @ A` saldrían las imágenes por la traspuesta de `A`: `[2, 1]`, `[0, 3]`, `[4, 11]` y `[-2, 2]`, que es otra transformación.',
          requirements: [
            '`Y` existe y es un array de NumPy con números, de 4 filas y 2 columnas: una fila por cada vector de `X`.',
            'La fila `k` de `Y` es la imagen por `A` de la fila `k` de `X`; no vale dejar una columna por vector ni transformar con las filas de `A` tomadas como columnas.',
          ],
          starter: `import numpy as np

A = np.array([[2, 1], [0, 3]])
# A es la matriz que transforma: un array de NumPy con 2 filas y 2 columnas.
# X guarda cuatro vectores, un vector por fila: (1, 0), (0, 1), (2, 3) y (-1, 1).
# Es un array de 4 filas y 2 columnas; X[2] es el tercer vector.
X = np.array([[1, 0], [0, 1], [2, 3], [-1, 1]])

# PASO 1. Transformar los cuatro vectores con A de una sola multiplicación.
# Por qué: así no hace falta un bucle. Con @, cada fila de la matriz de la izquierda
# se combina con las columnas de la de la derecha. Los vectores de X están en
# filas, así que X va a la izquierda; y para que A los transforme bien, sus
# filas tienen que pasar a ser columnas.
# A.T es la traspuesta de A: cambia filas por columnas.
# Se espera un array de 4 filas y 2 columnas: la fila k de Y es la imagen de la fila k de X.
Y = None

# Para ver qué vale algo antes de entregar: print(Y) y pulsa «Ejecutar».
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
            'El plan: la función devuelve `W @ x` más `b`, primero la multiplicación y después el sesgo. `y` es la llamada `capa(W, b, ...)` con el vector $(1, 2, 1)$ convertido en array con `np.array([...])`. `Y` hace lo mismo con las tres filas de `X` de una vez: `X` a la izquierda, la traspuesta de `W` a la derecha, y el sesgo `b` sumado al final, una sola vez. NumPy se lo suma a cada fila.',
            'Las piezas, con otra capa:\n\n' +
              py(
                'M = np.array([[1, 0], [0, 2]])',
                'c = np.array([10, 20])',
                't = np.array([3, 4])',
                'print(M @ t + c)    # [13 28]: primero M @ t, que es [3 8], y después se suma c',
                'lote = np.array([[1, 1], [2, 0], [0, 3]])   # tres vectores, uno por fila',
                'print(lote @ M.T + c)   # [[11 22] [12 20] [10 26]]: c se suma a cada fila',
              ) +
              '\n\nUna función termina con `return`, que entrega el valor, y todo lo de dentro lleva 4 espacios de sangría.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def capa(W, b, x):',
                '    return ___ @ x + ___',
                '',
                'y = capa(W, b, np.array([___, ___, ___]))',
                'Y = X @ ___ + ___',
              ) +
              '\n\nEl sesgo se suma después de multiplicar, y en el lote la matriz va traspuesta: `W.T`, y no `W`.',
          ],
          explain:
            'La capa para un vector y la capa para un lote hacen el mismo cálculo: el lote se escribe con la matriz traspuesta porque sus vectores están en filas. Fíjate en que el sesgo se suma después de multiplicar, no antes.',
          solution:
            'La función es `return W @ x + b`. Con $(1, 2, 1)$: $W\\vec{x}=(0, 6)$ y, sumando $\\vec{b}=(0, -2)$, `y` vale `[0, 4]`. Para el lote, `Y = X @ W.T + b`: las filas de `Y` son `[0, 4]`, `[-1, -1]` y `[6, -2]`. La primera coincide con `y`, que es lo esperado: es el mismo cálculo hecho de golpe. Si te olvidas del sesgo, `Y` sale con la columna 2 más grande en 2 unidades.',
          requirements: [
            '`capa` existe y es una función que recibe `W`, `b` y un vector `x`.',
            'La función devuelve un array de NumPy con números y con una componente por cada fila de `W`: el producto de `W` por `x` más el sesgo `b`.',
            'Se prueba con otras capas y otras entradas además del ejemplo del enunciado, de otros tamaños y con otros sesgos, y la función no puede dar ningún error con ellas.',
            '`y` existe y es un array de NumPy con 2 componentes, las dos números: la salida de la capa para el vector $(1, 2, 1)$.',
            '`Y` existe y es un array de NumPy con números, de 3 filas y 2 columnas: una fila por cada vector de `X`, con el sesgo `b` ya sumado a cada una.',
          ],
          starter: `import numpy as np


# PASO 1. La función capa(W, b, x): la salida de la capa lineal para UN vector x.
# W es la matriz de la capa, b su sesgo y x el vector de entrada (arrays de NumPy).
def capa(W, b, x):
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría):
    # así sabe Python que es parte de ella.
    # Por qué: la capa lineal calcula W por x y después le suma b. Primero se
    # multiplica y luego se suma el sesgo. W por x se escribe W @ x, con la matriz
    # a la izquierda; sumar b a un vector es b con un +, componente a componente.
    # return devuelve un valor y termina la función. Se espera un array con una
    # componente por cada fila de W.
    return None


# W tiene 2 filas y 3 columnas; b tiene 2 componentes (uno por fila de W).
W = np.array([[2, -1, 0], [1, 1, 3]])
b = np.array([0, -2])
# X guarda tres vectores de entrada, de 3 componentes cada uno, un vector por fila.
X = np.array([[1, 2, 1], [0, 1, 0], [3, 0, -1]])

# PASO 2. La salida de la capa para el vector (1, 2, 1).
# Llama a capa(W, b, ...) con ese vector. La función espera un array de NumPy,
# así que conviértelo con np.array([...]), poniendo sus tres números entre corchetes.
y = None

# PASO 3. Las salidas para los tres vectores de X, de una sola vez.
# Por qué: es el mismo cálculo que la función, pero para todo el lote. Los vectores
# de X están en filas, así que X va a la izquierda y la traspuesta de W (W.T,
# que cambia filas por columnas) va a la derecha. El sesgo b se suma al final,
# una sola vez: NumPy suma un vector de 2 componentes a cada fila de una matriz.
# Se espera un array de 3 filas y 2 columnas: la fila k es la salida para la fila k de X.
Y = None

# Para ver qué vale algo antes de entregar: print(y) y print(Y) y pulsa «Ejecutar».
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
