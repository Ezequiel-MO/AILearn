import type { PlaneSpec, PlaneVector, Project } from '../../content/schema';
import { toy } from './toy';

/** Plano del proyecto: rango 6 y rejilla de 1 en 1 (o la que se pida). */
const plane = (
  vectors: PlaneVector[],
  readouts: PlaneSpec['readouts'],
  pair?: [string, string],
  snap = 1,
): PlaneSpec => ({ range: 6, snap, vectors, readouts, ...(pair ? { pair } : {}) });

/** Un vector del plano, móvil o fijo. */
const arrow = (
  id: string,
  [x, y]: readonly [number, number],
  movable: boolean,
  label: string = id,
): PlaneVector => ({ id, label, x, y, movable });

/** Segundo proyecto de la Órbita 0: sumar flechas, escalarlas y promediarlas. */
export const sumaEscala: Project = {
  id: 'suma-escala',
  name: 'Suma y escala',
  sub: 'Combinar flechas',
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'suma-escala.ex00.1',
          type: 'manipular',
          prompt:
            'Para **sumar** dos vectores se suman sus componentes una a una: $(a, b)+(c, d)=(a+c,\\ b+d)$. Geométricamente, la suma es la flecha que llega a donde acabas si recorres primero una flecha y después la otra.\n\nEl vector $\\vec{u}$ está fijo en $(2, 1)$. Mueve la punta de $\\vec{v}$ hasta que $\\vec{u}+\\vec{v}$ sea $(5, 3)$: la lectura «u + v» te dice dónde está la suma en cada momento.',
          hints: [
            'Mira la lectura «u + v» mientras arrastras la punta de $\\vec{v}$.',
            'Cada componente de la suma es la de $\\vec{u}$ más la de $\\vec{v}$. ¿Cuánto hay que sumar a 2 para llegar a 5? ¿Y a 1 para llegar a 3?',
          ],
          explain:
            'La suma se hace componente a componente: la $x$ de la suma es la $x$ de $\\vec{u}$ más la $x$ de $\\vec{v}$, y lo mismo con la $y$. Comprueba el resultado en la lectura de la suma mientras arrastras.',
          solution:
            'A cada componente de $\\vec{u}$ le falta una cantidad para llegar a la de la suma: $5-2=3$ y $3-1=2$. Entonces $\\vec{v}=(3, 2)$ y $\\vec{u}+\\vec{v}=(2+3,\\ 1+2)=(5, 3)$.',
          plane: plane(
            [arrow('u', [2, 1], false), arrow('v', [1, 1], true)],
            ['components', 'sum'],
            ['u', 'v'],
          ),
          goals: [
            { metric: 'sum_x', of: ['u', 'v'], target: 5, tol: 0.01 },
            { metric: 'sum_y', of: ['u', 'v'], target: 3, tol: 0.01 },
          ],
        },
        {
          id: 'suma-escala.ex00.2',
          type: 'manipular',
          prompt:
            'El **vector nulo** es el que tiene todas sus componentes iguales a cero, $(0, 0)$. Dos vectores suman el vector nulo cuando se anulan: es como avanzar y después volver sobre tus pasos.\n\nEl vector $\\vec{u}$ está fijo en $(4, -1)$. Mueve $\\vec{v}$ para que $\\vec{u}+\\vec{v}$ sea el vector nulo.',
          hints: [
            'La suma es el vector nulo cuando las dos componentes de la lectura «u + v» valen 0.',
            'Para anular el $4$ de $\\vec{u}$ hace falta una componente que lo cancele al sumarse; piensa lo mismo con el $-1$.',
            'Hay que usar el opuesto de $\\vec{u}$.',
          ],
          explain:
            'Para que la suma sea el vector nulo, cada componente de $\\vec{v}$ tiene que anular la de $\\vec{u}$. Comprueba el resultado en la lectura de la suma.',
          solution:
            'El opuesto de $\\vec{u}=(4, -1)$ es $(-4, 1)$, porque $4+(-4)=0$ y $-1+1=0$. Con $\\vec{v}=(-4, 1)$ la suma es $(0, 0)$, el vector nulo.',
          plane: plane(
            [arrow('u', [4, -1], false), arrow('v', [1, 2], true)],
            ['components', 'sum'],
            ['u', 'v'],
          ),
          goals: [
            { metric: 'sum_x', of: ['u', 'v'], target: 0, tol: 0.01 },
            { metric: 'sum_y', of: ['u', 'v'], target: 0, tol: 0.01 },
          ],
        },
        {
          id: 'suma-escala.ex00.3',
          type: 'manipular',
          prompt:
            'Multiplicar un vector por un número lo **escala**: cada componente se multiplica por ese número, $k\\,(a, b)=(ka,\\ kb)$. Con $2\\vec{u}$ la flecha apunta igual y mide el doble.\n\nEl vector $\\vec{u}$ está fijo en $(1, 2)$. Lleva $\\vec{w}$ a $2\\vec{u}$.',
          hints: [
            'La flecha de $\\vec{w}$ debe apuntar igual que la de $\\vec{u}$ y ser el doble de larga.',
            'Multiplica por 2 cada componente de $(1, 2)$ y lleva la punta de $\\vec{w}$ a ese punto.',
          ],
          explain:
            'Escalar por un número positivo conserva la dirección y cambia la longitud: con 2 se duplica. Como cada componente se multiplica por el número, las dos se duplican.',
          solution:
            '$2\\vec{u}=(2\\cdot 1,\\ 2\\cdot 2)=(2, 4)$. Hay que llevar la punta de $\\vec{w}$ a $(2, 4)$: así apunta igual que $\\vec{u}$ y es el doble de larga.',
          plane: plane([arrow('u', [1, 2], false), arrow('w', [1, -1], true)], ['components']),
          goals: [
            { metric: 'x', of: ['w'], target: 2, tol: 0.01 },
            { metric: 'y', of: ['w'], target: 4, tol: 0.01 },
          ],
        },
        {
          id: 'suma-escala.ex00.4',
          type: 'manipular',
          prompt:
            'Un número **negativo** da la vuelta a la flecha, y su tamaño sin el signo dice cuánto la alarga o la acorta: con $0{,}5$, a la mitad. Por eso $-0{,}5\\,\\vec{u}$ mide la mitad que $\\vec{u}$ y apunta al lado opuesto.\n\nEl vector $\\vec{u}$ está fijo en $(4, 2)$. Lleva $\\vec{w}$ a $-0{,}5\\,\\vec{u}$.',
          hints: [
            'El signo menos da la vuelta a la flecha y el $0{,}5$ la deja a la mitad de su tamaño.',
            'Multiplica cada componente de $(4, 2)$ por $-0{,}5$.',
          ],
          explain:
            'Escalar por un número negativo invierte el sentido de la flecha, y su valor sin signo (aquí $0{,}5$) la alarga o la acorta. Cada componente se multiplica por el número.',
          solution:
            '$-0{,}5\\,\\vec{u}=(-0{,}5\\cdot 4;\\ -0{,}5\\cdot 2)=(-2, -1)$. La punta de $\\vec{w}$ queda a la izquierda y abajo, en el lado opuesto al de $\\vec{u}$, y a la mitad de distancia del origen.',
          plane: plane([arrow('u', [4, 2], false), arrow('w', [1, 1], true)], ['components']),
          goals: [
            { metric: 'x', of: ['w'], target: -2, tol: 0.01 },
            { metric: 'y', of: ['w'], target: -1, tol: 0.01 },
          ],
        },
        {
          id: 'suma-escala.ex00.5',
          type: 'manipular',
          prompt:
            'Este mapa es un juguete **inventado** de dos dimensiones, para poder dibujarlo: los embeddings reales tienen cientos de dimensiones, pero se combinan igual. El **centroide** de varios vectores es su media: se suman y se divide entre cuántos son, componente a componente. Resume un grupo de palabras con un solo punto, el centro del grupo.\n\n«gato» está en $(3, 4)$ y «perro» en $(4, 3)$. Coloca $\\vec{c}$ en el centroide de las dos. La rejilla de este mapa avanza de $0{,}5$ en $0{,}5$.',
          hints: [
            'La media de dos números queda justo en medio de ambos.',
            'Suma las dos $x$ y divide entre 2; haz lo mismo con las dos $y$.',
          ],
          explain:
            'El centroide es la media de los vectores, componente a componente: una media para las $x$ y otra para las $y$. Con dos palabras es el punto medio del segmento que las une.',
          solution:
            '$\\vec{c}=\\dfrac{(3, 4)+(4, 3)}{2}=\\dfrac{(7, 7)}{2}=(3{,}5;\\ 3{,}5)$. Queda justo entre «gato» y «perro», en la parte de los seres vivos y domésticos.',
          plane: plane(
            [
              arrow('gato', toy['gato']!, false),
              arrow('perro', toy['perro']!, false),
              arrow('c', [-2, 1], true),
            ],
            ['components'],
            undefined,
            0.5,
          ),
          goals: [
            { metric: 'x', of: ['c'], target: 3.5, tol: 0.01 },
            { metric: 'y', of: ['c'], target: 3.5, tol: 0.01 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'suma-escala.ex01.1',
          type: 'vector',
          prompt:
            'Suma los vectores $(2, -1)$ y $(-5, 4)$ sumando sus componentes. Escribe el resultado: primero la $x$ y después la $y$.',
          hints: [
            'Suma las primeras componentes entre sí y las segundas entre sí.',
            'Cuidado con los signos: $2+(-5)$ es lo mismo que $2-5$.',
          ],
          explain:
            'Los vectores se suman componente a componente. Los números negativos se respetan: sumar un negativo equivale a restar.',
          solution: 'La suma es $(2+(-5),\\ -1+4)=(-3, 3)$.',
          answer: [-3, 3],
          tol: 0,
        },
        {
          id: 'suma-escala.ex01.2',
          type: 'vector',
          prompt:
            'Calcula $3\\cdot(-2, 1)$: el número multiplica cada componente del vector. Escribe el resultado: primero la $x$ y después la $y$.',
          hints: [
            'Multiplica por 3 la primera componente y, aparte, la segunda.',
            'Una componente negativa sigue siendo negativa al multiplicarla por un número positivo.',
          ],
          explain:
            'Escalar un vector es multiplicar cada una de sus componentes por el mismo número. Un factor positivo conserva el sentido de la flecha.',
          solution: '$3\\cdot(-2, 1)=(3\\cdot(-2),\\ 3\\cdot 1)=(-6, 3)$.',
          answer: [-6, 3],
          tol: 0,
        },
        {
          id: 'suma-escala.ex01.3',
          type: 'vector',
          prompt:
            'Con $\\vec{u}=(1, 3)$ y $\\vec{v}=(4, -2)$, calcula $2\\vec{u}-\\vec{v}$. Escalar vectores y sumarlos o restarlos se llama **combinación lineal**. Aquí, primero se escala $\\vec{u}$ y a ese resultado se le resta $\\vec{v}$, componente a componente. Escribe el resultado: primero la $x$ y después la $y$.',
          hints: [
            'Empieza por $2\\vec{u}$: multiplica por 2 cada componente de $(1, 3)$.',
            'Después resta a ese vector las componentes de $\\vec{v}$, una a una.',
          ],
          explain:
            'Una combinación lineal se resuelve en orden: primero lo que escala, después la suma o la resta. Importa el orden de la resta: $2\\vec{u}-\\vec{v}$ y $\\vec{v}-2\\vec{u}$ son opuestos.',
          solution:
            'Primero $2\\vec{u}=(2, 6)$. Restando $\\vec{v}$: $2\\vec{u}-\\vec{v}=(2-4,\\ 6-(-2))=(-2, 8)$.',
          answer: [-2, 8],
          tol: 0,
        },
        {
          id: 'suma-escala.ex01.4',
          type: 'vector',
          prompt:
            'En un mapa de juguete (inventado y de dos dimensiones; los reales tienen cientos) los embeddings de «coche», «bici» y «camión» son $(-3, 2)$, $(-2, 3)$ y $(-4, -1)$. Calcula su **centroide**: la media de los tres, componente a componente. Escribe el resultado con dos decimales: primero la $x$ y después la $y$.',
          hints: [
            'Suma las tres $x$ y divide entre 3; después haz lo mismo con las tres $y$.',
            'Las $x$ suman $-9$, y la media sale exacta. Las $y$ suman $2+3+(-1)$ y su media no es un número entero.',
          ],
          explain:
            'La media de varios vectores se calcula componente a componente: se suman y se divide entre cuántos son. Es el punto central del grupo: un solo embedding que resume los tres.',
          solution:
            '$\\vec{c}=\\dfrac{(-3, 2)+(-2, 3)+(-4, -1)}{3}=\\dfrac{(-9, 4)}{3}=\\left(-3;\\ \\dfrac{4}{3}\\right)\\approx(-3;\\ 1{,}33)$. Queda en la zona de las máquinas.',
          answer: [-3, 1.333],
          tol: 0.01,
        },
        {
          id: 'suma-escala.ex01.5',
          type: 'opcion',
          prompt:
            'En NumPy, `+` entre dos arrays los suma componente a componente, y `-` los resta igual. Tienes dos vectores, `a` con 2 componentes y `b` con 3, y escribes `a + b`. ¿Qué ocurre?',
          hints: [
            'La suma se hace componente a componente: cada componente necesita una pareja.',
            '¿Con qué componente de `a` se sumaría la tercera de `b`?',
          ],
          explain:
            'Sumar es emparejar componentes. Cuenta las parejas que se pueden formar entre `a` y `b` y piensa qué tendría que inventarse NumPy para lo que sobra.',
          solution:
            'La tercera componente de `b` se quedaría sin pareja, y NumPy no inventa ninguna: la suma no está definida y da un error de formas. Rellenar con ceros, sumar solo las dos primeras o devolver un vector de 5 (unir es lo que hace `+` con dos listas de Python, no con arrays) serían decisiones que NumPy no toma por ti.',
          options: [
            'Se rellena con ceros el vector más corto y se suman',
            'Se suman solo las dos primeras componentes y se descarta la otra',
            'No está definido; NumPy da un error de formas',
            'Da un vector de 5 componentes, uniendo los dos',
          ],
          correct: 2,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'suma-escala.ex02.1',
          type: 'codigo',
          prompt:
            'Con arrays de NumPy, el signo `+` suma sus componentes una a una, igual que la suma de vectores. Ya tienes `u = np.array([2, 1])` y `v = np.array([3, 2])`. Guarda en `s` su suma, como array de NumPy.',
          hints: [
            'NumPy ya sabe restar arrays con el signo menos, componente a componente; con la suma ocurre lo mismo.',
            'Escribe `s = ` y, después, los dos arrays unidos por el signo más.',
          ],
          explain:
            'Las operaciones aritméticas de NumPy actúan componente a componente: sumar dos arrays del mismo tamaño da otro array con la suma de cada pareja. No hace falta ningún paso más.',
          solution:
            'Se escribe `s = u + v`: NumPy suma la primera componente con la primera y la segunda con la segunda, y da `[5, 3]`, es decir, $(5, 3)$.',
          requirements: [
            '`s` existe y es un array de NumPy con 2 componentes, las dos números.',
            '`s` es la suma de `u` y `v`: cada componente de `s` suma las de `u` y `v` que ocupan su misma posición.',
          ],
          starter: `import numpy as np

u = np.array([2, 1])
v = np.array([3, 2])
# Calcula s, la suma de u y v
s = None
`,
          checks: `_arr = isinstance(s, np.ndarray)
_ok = _arr and s.shape == (2,)
_num = _ok and np.issubdtype(s.dtype, np.number)
_cuatro = (_arr and s.shape == (4,)) or (isinstance(s, (list, tuple)) and len(s) == 4)
check(_ok, "\`s\` tiene que ser un array de NumPy con 2 componentes, la suma de \`u\` y \`v\`.")
check(not _cuatro, "\`s\` tiene 4 componentes: has unido los dos vectores en vez de sumarlos. Con \`+\` entre arrays, NumPy suma componente a componente.")
check((not _ok) or _num, "Las componentes tienen que ser números, sin comillas.")
check((not _num) or not np.allclose(s, [-1, -1]), "\`s\` vale (-1, -1): has restado en vez de sumar.")
check((not _num) or np.allclose(s, [5, 3]), "\`s\` tiene que valer (5, 3): la primera componente de \`u\` más la de \`v\`, y la segunda más la segunda.")
`,
          reference:
            'import numpy as np\n\nu = np.array([2, 1])\nv = np.array([3, 2])\ns = u + v\n',
        },
        {
          id: 'suma-escala.ex02.2',
          type: 'codigo',
          prompt:
            'Un array multiplicado por un número, con `*`, multiplica cada una de sus componentes: es escalar el vector. Ya tienes `u = np.array([4, 2])`. Guarda en `w`, como array de NumPy, el vector $-0{,}5\\,\\vec{u}$. En Python los decimales se escriben con punto: `0.5`.',
          hints: [
            'Un número por un array se escribe `número * array`.',
            'El número es $-0{,}5$, que en Python se escribe `-0.5`.',
          ],
          explain:
            'Multiplicar un array por un número lo escala componente a componente: el signo menos da la vuelta a la flecha y el factor $0{,}5$ la deja a la mitad. En Python el separador decimal es el punto.',
          solution:
            'Se escribe `w = -0.5 * u`: NumPy multiplica cada componente de `u` por $-0{,}5$ y da `[-2, -1]`, es decir, $(-2, -1)$.',
          requirements: [
            '`w` existe y es un array de NumPy con 2 componentes, las dos números.',
            '`w` es el vector $-0{,}5\\,\\vec{u}$: cada componente de `u` multiplicada por $-0{,}5$, con el signo menos incluido.',
          ],
          starter: `import numpy as np

u = np.array([4, 2])
# Calcula w, que es -0.5 veces u (en Python, el decimal va con punto)
w = None
`,
          checks: `_tupla = isinstance(w, tuple)
_ok = isinstance(w, np.ndarray) and w.shape == (2,)
_num = _ok and np.issubdtype(w.dtype, np.number)
check(_ok or _tupla, "\`w\` tiene que ser un array de NumPy con 2 componentes: \`u\` escalado.")
_coma = _num and np.allclose(w, [0, 10])
check(not _tupla, "\`w\` es una tupla, no un array: ¿has escrito el decimal con coma? En Python, \`-0,5\` son dos números separados por una coma. Escribe \`-0.5\`, con punto.")
check(not _coma, "\`w\` vale (0, 10): ¿has escrito \`-0,5\` con coma? Entre paréntesis, Python lo lee como dos números, el 0 y el 5. Escribe \`-0.5\`, con punto.")
check((not _ok) or _num, "Las componentes tienen que ser números, sin comillas.")
check((not _num) or not np.allclose(w, [2, 1]), "\`w\` vale (2, 1): falta el signo menos, que es el que da la vuelta a la flecha.")
check((not _num) or not np.allclose(w, [-8, -4]), "\`w\` vale (-8, -4): has multiplicado por -2 en vez de por -0,5.")
check((not _num) or _coma or np.allclose(w, [-2, -1]), "\`w\` tiene que valer (-2, -1): cada componente de \`u\` multiplicada por -0,5.")
`,
          reference: 'import numpy as np\n\nu = np.array([4, 2])\nw = -0.5 * u\n',
        },
        {
          id: 'suma-escala.ex02.3',
          type: 'codigo',
          prompt:
            'Las dos operaciones se combinan en una sola expresión: Python hace antes la multiplicación que la resta, como en matemáticas. Con `u = np.array([1, 3])` y `v = np.array([4, -2])`, calcula en `c`, como array de NumPy, el vector $2\\vec{u}-\\vec{v}$.',
          hints: [
            'Primero se escala `u` por 2 y, a ese resultado, se le resta `v`.',
            'El 2 multiplica solo a `u`, y `v` se resta sin escalar.',
          ],
          explain:
            'Escalar y restar caben en una sola expresión. Cuida que el factor afecte solo a un vector y el orden de la resta: $2\\vec{u}-\\vec{v}$ no es lo mismo que $\\vec{v}-2\\vec{u}$, que es su opuesto.',
          solution:
            '$2\\vec{u}-\\vec{v}=(2, 6)-(4, -2)=(-2, 8)$. En Python, `c = 2 * u - v`: primero se multiplica `u` por 2 y después se resta `v`.',
          requirements: [
            '`c` existe y es un array de NumPy con 2 componentes, las dos números.',
            '`c` es el vector $2\\vec{u}-\\vec{v}$, con la resta en ese orden: $\\vec{v}-2\\vec{u}$ no vale.',
          ],
          starter: `import numpy as np

u = np.array([1, 3])
v = np.array([4, -2])
# Calcula c = 2u - v
c = None
`,
          checks: `_ok = isinstance(c, np.ndarray) and c.shape == (2,)
_num = _ok and np.issubdtype(c.dtype, np.number)
check(_ok, "\`c\` tiene que ser un array de NumPy con 2 componentes: \`2u - v\`.")
check((not _ok) or _num, "Las componentes tienen que ser números, sin comillas.")
check((not _num) or not np.allclose(c, [2, -8]), "\`c\` vale (2, -8): has restado al revés. Se pide \`2u - v\`, no \`v - 2u\`.")
check((not _num) or not np.allclose(c, [-6, 10]), "\`c\` vale (-6, 10): el 2 está multiplicando también a \`v\`. Solo escala a \`u\`.")
check((not _num) or np.allclose(c, [-2, 8]), "\`c\` tiene que valer (-2, 8): el doble de \`u\` menos \`v\`, componente a componente.")
`,
          reference:
            'import numpy as np\n\nu = np.array([1, 3])\nv = np.array([4, -2])\nc = 2 * u - v\n',
        },
        {
          id: 'suma-escala.ex02.4',
          type: 'codigo',
          prompt:
            'Una **matriz** es un array con dos ejes: filas y columnas. `E` guarda un embedding de juguete por fila (inventados y de 2 dimensiones; los reales tienen cientos): «coche», «bici» y «camión». Tiene tres filas y dos columnas, así que su forma es `(3, 2)`.\n\n`np.mean(E)` calcula la media de todos los números de `E`, mezclados en uno solo. Con un segundo argumento, `axis`, calcula medias a lo largo de un eje: `np.mean(E, axis=1)` da una media por cada fila, y con `axis=0` recorre las filas y da una media por cada columna. Guarda en `centroide`, como array de NumPy, el centroide de las tres palabras: un vector de 2 componentes, la $x$ media y la $y$ media.',
          hints: [
            'El centroide es una media, y NumPy la calcula con `np.mean`.',
            'Se quiere una media por columna: la de todas las $x$ y la de todas las $y$.',
            'Si el resultado tiene tres números en vez de dos, has promediado por filas: cambia el eje.',
          ],
          explain:
            'La media de varios vectores se hace componente a componente. Con un embedding por fila, piensa si necesitas una media por fila o una por columna, y cuántos números debe tener el resultado: eso decide el eje.',
          solution:
            'Se escribe `centroide = np.mean(E, axis=0)`. NumPy recorre las filas (eje 0) y da una media por columna: $\\left(\\dfrac{-3-2-4}{3},\\ \\dfrac{2+3-1}{3}\\right)\\approx(-3;\\ 1{,}33)$. Con `axis=1` saldrían tres números, uno por palabra, que no es el centroide.',
          requirements: [
            '`centroide` existe y es un array de NumPy con 2 componentes, las dos números: ni un solo número ni un número por palabra.',
            '`centroide` es el vector medio de las tres filas de `E`: su primera componente es la media de las $x$ y la segunda, la media de las $y$.',
            'Como sale con decimales, se acepta una diferencia de hasta una centésima.',
          ],
          starter: `import numpy as np

# Embeddings de juguete (inventados y de 2 dimensiones), uno por fila:
# coche, bici, camión
E = np.array([[-3, 2], [-2, 3], [-4, -1]])
# Calcula centroide, el vector medio de las tres filas
centroide = None
`,
          checks: `_arr = isinstance(centroide, np.ndarray)
_ok = _arr and centroide.shape == (2,)
_num = _ok and np.issubdtype(centroide.dtype, np.number)
_suelto = isinstance(centroide, (int, float, np.number)) or (_arr and centroide.ndim == 0)
_filas = _arr and centroide.shape == (3,)
check(_ok or _suelto or _filas, "\`centroide\` tiene que ser un array de NumPy con 2 componentes: la x media y la y media.")
_filasnum = _filas and np.issubdtype(centroide.dtype, np.number)
_porfilas = _filasnum and np.allclose(centroide, [-0.5, 0.5, -2.5], rtol=0, atol=0.01)
_coma = _filasnum and np.allclose(centroide[:2], [-3, 1])
check(not _porfilas, "\`centroide\` tiene 3 números: has promediado por filas, una media por palabra. Prueba \`axis=0\` para promediar por columnas.")
check(not _coma, "\`centroide\` tiene 3 números y empieza por -3 y 1: ¿has escrito el decimal con coma? En Python el decimal va con punto: \`1.33\`.")
check(not (_filas and not _porfilas and not _coma), "\`centroide\` tiene 3 elementos, uno por palabra; el centroide tiene 2 componentes, la x media y la y media.")
check(not _suelto, "\`centroide\` es un solo número: \`np.mean\` sin \`axis\` mezcla todos los valores. Indica \`axis=0\` para obtener una media por columna.")
check((not _ok) or _num, "Las componentes tienen que ser números, sin comillas.")
check((not _num) or np.allclose(centroide, [-3, 4 / 3], atol=0.01), "\`centroide\` tiene que valer (-3; 1,33): la media de las x y la media de las y de las tres palabras.")
`,
          reference: `import numpy as np

# Embeddings de juguete (inventados y de 2 dimensiones), uno por fila:
# coche, bici, camión
E = np.array([[-3, 2], [-2, 3], [-4, -1]])
centroide = np.mean(E, axis=0)
`,
        },
        {
          id: 'suma-escala.ex02.5',
          type: 'codigo',
          prompt:
            'La llamada `plt.quiver(x0, y0, a, b, angles="xy", scale_units="xy", scale=1)` dibuja la flecha que sale del punto $(x_0, y_0)$ y avanza $a$ en horizontal y $b$ en vertical; las opciones hacen que mida lo que debe. Ya tienes `u = np.array([2, 1])` y `v = np.array([3, 2])`. Calcula en `s`, como array de NumPy, su suma y dibuja tres flechas desde el origen: la de $\\vec{u}$, la de $\\vec{v}$ y la de la suma.',
          hints: [
            'Calcula primero `s` como la suma de `u` y `v`; después hace falta una llamada a `plt.quiver` por flecha.',
            'La flecha de `u` sale de $(0, 0)$ y avanza `u[0]` en horizontal y `u[1]` en vertical.',
            'Las otras dos flechas se dibujan igual, cambiando el vector: `v` y `s`.',
          ],
          explain:
            'Al dibujar las tres flechas se ve que la de la suma llega al mismo punto que si recorres $\\vec{u}$ y después $\\vec{v}$. Cada flecha necesita su propia llamada a `plt.quiver`, con las componentes del vector que dibuja.',
          solution:
            'Primero `s = u + v`, que vale $(5, 3)$. Después una llamada por flecha: `plt.quiver(0, 0, u[0], u[1], angles="xy", scale_units="xy", scale=1)`, otra igual con `v[0], v[1]` y otra con `s[0], s[1]`. La flecha de `s` es la diagonal del paralelogramo que forman `u` y `v`.',
          requirements: [
            '`s` existe y es un array de NumPy con 2 componentes, las dos números: la suma de `u` y `v`.',
            'Hay una figura con flechas dibujadas con `plt.quiver`, y todas a escala: cada llamada lleva las opciones `angles="xy", scale_units="xy", scale=1`.',
            'Entre las flechas hay una que avanza lo mismo que `u`, otra lo mismo que `v` y otra lo mismo que la suma: se mira cuánto avanza cada una en horizontal y en vertical.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt

u = np.array([2, 1])
v = np.array([3, 2])
plt.xlim(-1, 6)
plt.ylim(-1, 5)
plt.grid(True)
# Calcula s, la suma de u y v, y dibuja las flechas de u, v y s
s = None
`,
          checks: `_ok = isinstance(s, np.ndarray) and s.shape == (2,)
_num = _ok and np.issubdtype(s.dtype, np.number)
check(_ok, "\`s\` tiene que ser un array de NumPy con 2 componentes, la suma de \`u\` y \`v\`.")
check((not _ok) or _num, "Las componentes tienen que ser números, sin comillas.")
check((not _num) or np.allclose(s, [5, 3]), "\`s\` tiene que valer (5, 3): la primera componente de \`u\` más la de \`v\`, y la segunda más la segunda.")
_fig = len(plt.get_fignums()) > 0
check(_fig, "No hay ninguna figura: dibuja las flechas con \`plt.quiver\`.")
_flechas = [(float(a), float(b)) for ax in plt.gcf().axes for c in ax.collections if type(c).__name__ == "Quiver" for a, b in zip(np.ravel(np.ma.getdata(c.U)), np.ravel(np.ma.getdata(c.V)))] if _fig else []
check((not _fig) or len(_flechas) > 0, "No hay flechas en la figura: dibújalas con \`plt.quiver\`.")
_quivers = [c for ax in plt.gcf().axes for c in ax.collections if type(c).__name__ == "Quiver"] if _fig else []
check(all(isinstance(c.angles, str) and c.angles == "xy" and c.scale_units == "xy" and c.scale == 1 for c in _quivers), 'Las flechas no están dibujadas a escala: sin opciones, \`plt.quiver\` estira o encoge cada flecha a su aire y no llegan adonde dicen sus componentes. Añade \`angles="xy", scale_units="xy", scale=1\` a cada llamada.')
check(len(_flechas) == 0 or any(np.allclose(f, [2, 1]) for f in _flechas), "Falta la flecha de \`u\`: tiene que avanzar 2 en horizontal y 1 en vertical.")
check(len(_flechas) == 0 or any(np.allclose(f, [3, 2]) for f in _flechas), "Falta la flecha de \`v\`: tiene que avanzar 3 en horizontal y 2 en vertical.")
check(len(_flechas) == 0 or any(np.allclose(f, [5, 3]) for f in _flechas), "Falta la flecha de la suma: tiene que avanzar 5 en horizontal y 3 en vertical.")
`,
          reference: `import numpy as np
import matplotlib.pyplot as plt

u = np.array([2, 1])
v = np.array([3, 2])
plt.xlim(-1, 6)
plt.ylim(-1, 5)
plt.grid(True)
s = u + v
plt.quiver(0, 0, u[0], u[1], angles="xy", scale_units="xy", scale=1)
plt.quiver(0, 0, v[0], v[1], angles="xy", scale_units="xy", scale=1)
plt.quiver(0, 0, s[0], s[1], angles="xy", scale_units="xy", scale=1)
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'suma-escala.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien ha escrito este código para guardar en `centroide` el centroide de las tres filas de `E`: un vector con la media de cada columna (NumPy ya está importado como `np`). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        '¿Cuántos números debe tener el resultado: uno por columna o uno por fila?',
        'Piensa en qué recorre `axis`: con `axis=0` baja por las filas y da una media por columna; con `axis=1`, una media por fila.',
      ],
      explain:
        'Piensa qué debe devolver el código: cuántos números y qué representa cada uno. Después comprueba que cada paso del código lo produce.',
      solution:
        'La segunda línea está mal. Con `axis=1` se promedia cada fila y salen tres números, uno por palabra, no el centroide. Hace falta `axis=0`, que promedia cada columna y da la $x$ media y la $y$ media: `centroide = np.mean(E, axis=0)`.',
      lines: ['E = np.array([[-3, 2], [-2, 3], [-4, -1]])', 'centroide = np.mean(E, axis=1)'],
      faultyLine: 1,
    },
    {
      id: 'suma-escala.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula $2\\vec{u}-\\vec{v}$ con $\\vec{u}=(3, -1)$ y $\\vec{v}=(1, 1)$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Comprueba el producto de la primera línea componente a componente.',
        'Haz tú la resta de la segunda línea: ¿qué se resta a qué?',
      ],
      explain:
        'Revisa cada paso: ¿el número multiplica a todas las componentes? ¿La resta se hace componente a componente y en el orden pedido?',
      solution:
        'No hay ningún error. $2\\vec{u}=(2\\cdot 3,\\ 2\\cdot(-1))=(6, -2)$, y al restar $\\vec{v}$ queda $(6-1,\\ -2-1)=(5, -3)$.',
      lines: ['2 · (3, −1) = (6, −2)', '(6, −2) − (1, 1) = (5, −3)'],
      faultyLine: null,
    },
    {
      id: 'suma-escala.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula $3(\\vec{u}+\\vec{v})$ con $\\vec{u}=(1, 2)$ y $\\vec{v}=(3, 4)$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Comprueba la suma de la primera línea componente a componente.',
        'Al multiplicar por 3, ¿se multiplican las dos componentes o solo una?',
      ],
      explain:
        'Revisa cada paso: ¿la suma se hace componente a componente? ¿El número multiplica a todas las componentes?',
      solution:
        'La segunda línea está mal: el 3 multiplica las dos componentes, y aquí solo se ha multiplicado la primera. Lo correcto es $3\\cdot(4, 6)=(12, 18)$.',
      lines: ['(1, 2) + (3, 4) = (4, 6)', '3 · (4, 6) = (12, 6)'],
      faultyLine: 1,
    },
  ],
};
