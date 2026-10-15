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

/** Primer proyecto de la Órbita 1: el producto escalar y lo que dice de la orientación de dos vectores. */
export const productoEscalar: Project = {
  id: 'producto-escalar',
  name: 'Producto escalar',
  sub: 'Cuánto van en la misma dirección',
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'producto-escalar.ex00.1',
          type: 'manipular',
          prompt:
            'El **producto escalar** de dos vectores se calcula multiplicando las componentes que se corresponden y sumando los productos: $\\vec{a}\\cdot\\vec{b}=a_1b_1+a_2b_2$. El resultado no es un vector, sino un **número**. Por ejemplo, $(1, 2)\\cdot(3, 4)=1\\cdot3+2\\cdot4=11$.\n\nEl vector $\\vec{u}$ está fijo en $(2, 1)$. Mueve la punta de $\\vec{v}$ hasta que $\\vec{u}\\cdot\\vec{v}$ valga $10$: la lectura «u · v» te dice su valor en cada momento.',
          hints: [
            'Mira la lectura «u · v» mientras arrastras: crece cuando la punta de $\\vec{v}$ se mueve hacia la derecha y hacia arriba.',
            'Si $\\vec{v}=(x, y)$, el producto escalar es $2x+y$. Busca una punta con $2x+y=10$.',
            'Prueba con $x=4$: ¿cuánto tiene que valer $y$?',
          ],
          explain:
            'El producto escalar multiplica las componentes que se corresponden (la $x$ con la $x$ y la $y$ con la $y$) y suma los dos productos. Comprueba el valor en la lectura mientras arrastras.',
          solution:
            '$\\vec{u}\\cdot\\vec{v}=2v_1+1\\cdot v_2$. Con $\\vec{v}=(4, 2)$: $2\\cdot4+1\\cdot2=10$. Hay más puntas que sirven, como $(3, 4)$, $(5, 0)$ o $(2, 6)$: todas cumplen $2x+y=10$.',
          plane: plane(
            [arrow('u', [2, 1], false), arrow('v', [1, 1], true)],
            ['components', 'dot'],
            ['u', 'v'],
          ),
          goals: [{ metric: 'dot', of: ['u', 'v'], target: 10, tol: 0.01 }],
        },
        {
          id: 'producto-escalar.ex00.2',
          type: 'manipular',
          prompt:
            'Dos vectores son **ortogonales** cuando forman un ángulo recto, de $90^\\circ$. El producto escalar lo detecta: dos vectores no nulos son ortogonales justo cuando su producto escalar es $0$.\n\nEl vector $\\vec{u}$ está fijo en $(3, 2)$. Mueve $\\vec{v}$ hasta que sea ortogonal a $\\vec{u}$: producto escalar $0$ y ángulo de $90^\\circ$. El vector nulo $(0, 0)$ no cuenta: no tiene dirección y su ángulo no está definido.',
          hints: [
            'Mira las lecturas del producto escalar y del ángulo mientras arrastras: el producto escalar cambia de signo al cruzar el ángulo recto.',
            'Si $\\vec{v}=(x, y)$, el producto escalar es $3x+2y$. Para que valga $0$, $x$ e $y$ deben tener signos contrarios y compensarse.',
            'Prueba con $x=-2$: ¿cuánto tiene que valer $y$?',
          ],
          explain:
            'Con producto escalar $0$, los productos de las componentes se anulan al sumarse, así que unos son positivos y otros negativos. La lectura del ángulo confirma que la posición es la buena.',
          solution:
            '$\\vec{u}\\cdot\\vec{v}=3v_1+2v_2$. Con $\\vec{v}=(-2, 3)$: $3\\cdot(-2)+2\\cdot3=-6+6=0$, y el ángulo es de $90^\\circ$. También sirve $(2, -3)$. Dos flechas con producto escalar $0$ son perpendiculares: eso es la **ortogonalidad**.',
          plane: plane(
            [arrow('u', [3, 2], false), arrow('v', [2, 1], true)],
            ['components', 'dot', 'angle'],
            ['u', 'v'],
          ),
          goals: [
            { metric: 'dot', of: ['u', 'v'], target: 0, tol: 0.01 },
            { metric: 'angle', of: ['u', 'v'], target: 90, tol: 0.01 },
          ],
        },
        {
          id: 'producto-escalar.ex00.3',
          type: 'manipular',
          prompt:
            'El **signo** del producto escalar dice cómo se orientan dos vectores: es positivo si forman un ángulo menor de $90^\\circ$ (agudo), cero si es de $90^\\circ$ y **negativo** si es mayor de $90^\\circ$ (obtuso): las flechas apuntan, más o menos, a lados opuestos.\n\nEl vector $\\vec{u}$ está fijo en $(3, 1)$. Mueve $\\vec{v}$ hasta que $\\vec{u}\\cdot\\vec{v}$ valga $-6$, y observa el ángulo.',
          hints: [
            'Para un producto escalar negativo, la punta de $\\vec{v}$ tiene que quedar al lado contrario de $\\vec{u}$, hacia la izquierda.',
            'Si $\\vec{v}=(x, y)$, el producto escalar es $3x+y$. Busca una punta con $3x+y=-6$.',
            'Prueba con $x=-2$: ¿cuánto tiene que valer $y$?',
          ],
          explain:
            'Un producto escalar negativo aparece cuando las componentes de $\\vec{v}$ van, en conjunto, contra las de $\\vec{u}$. Mira cómo la lectura del ángulo pasa de $90^\\circ$ al moverte hacia el lado contrario.',
          solution:
            '$\\vec{u}\\cdot\\vec{v}=3v_1+v_2$. Con $\\vec{v}=(-2, 0)$: $3\\cdot(-2)+1\\cdot0=-6$, y la flecha apunta justo al lado opuesto de $\\vec{u}$ ($180^\\circ$). También sirven $(-1, -3)$ o $(-3, 3)$, con ángulos entre $90^\\circ$ y $180^\\circ$.',
          plane: plane(
            [arrow('u', [3, 1], false), arrow('v', [1, 1], true)],
            ['components', 'dot', 'angle'],
            ['u', 'v'],
          ),
          goals: [{ metric: 'dot', of: ['u', 'v'], target: -6, tol: 0.01 }],
        },
        {
          id: 'producto-escalar.ex00.4',
          type: 'manipular',
          prompt:
            'Cuando uno de los vectores apunta en horizontal, el producto escalar descubre algo sobre el otro. $\\vec{u}$ está fijo en $(2, 0)$. Antes de colocar nada, sube y baja la punta de $\\vec{v}$ sin moverla de lado y mira la lectura «u · v»; después muévela de lado.\n\nColoca $\\vec{v}$ de modo que $\\vec{u}\\cdot\\vec{v}$ valga $6$ y que además su punta esté a altura $y=5$.',
          hints: [
            'Sube y baja la punta sin cambiar su $x$: ¿cambia el producto escalar?',
            'Primero busca la $x$ que da producto escalar $6$ y después sube la punta hasta la altura $5$ sin cambiar esa $x$.',
          ],
          explain:
            'Con $\\vec{u}$ horizontal, la $y$ de $\\vec{v}$ se multiplica por la $y$ de $\\vec{u}$. Piensa en qué valor tiene esa componente y qué consecuencia tiene para el producto escalar.',
          solution:
            '$\\vec{u}\\cdot\\vec{v}=2v_1+0\\cdot v_2=2v_1$, así que el producto escalar vale $6$ cuando $v_1=3$, sea cual sea $v_2$. Con $\\vec{v}=(3, 5)$: $2\\cdot3+0\\cdot5=6$. Como $\\vec{u}$ apunta en horizontal, del otro vector solo cuenta su componente en esa dirección, la $x$: todas las puntas de la recta vertical $x=3$ valen.',
          plane: plane(
            [arrow('u', [2, 0], false), arrow('v', [1, 1], true)],
            ['components', 'dot'],
            ['u', 'v'],
          ),
          goals: [
            { metric: 'dot', of: ['u', 'v'], target: 6, tol: 0.01 },
            { metric: 'y', of: ['v'], target: 5, tol: 0.01 },
          ],
        },
        {
          id: 'producto-escalar.ex00.5',
          type: 'manipular',
          prompt:
            'En un buscador por significado, cada documento tiene un embedding y se **puntúa** con su producto escalar con el embedding de la consulta: los documentos de puntuación más alta salen primero. Este mapa es un juguete **inventado** de dos dimensiones, para poder dibujarlo: los embeddings reales tienen cientos de dimensiones, pero se puntúan igual.\n\nLa consulta es «gato», fija en $(3, 4)$. Mueve el documento hasta que su puntuación sea $24$.',
          hints: [
            'Mira la lectura «gato · doc» mientras arrastras: sube cuando el documento se acerca a la dirección de la consulta.',
            'Si el documento es $(x, y)$, su puntuación es $3x+4y$. Busca una punta con $3x+4y=24$.',
            'Un documento parecido a la consulta, de la zona de los animales domésticos, puntúa alto: acércalo a «gato» y ajusta.',
          ],
          explain:
            'La puntuación es el producto escalar de la consulta con el documento. Varias posiciones dan la misma puntuación; busca una con la lectura.',
          solution:
            'La puntuación de un documento $(x, y)$ es $3x+4y$. Con $(4, 3)$, justo donde está «perro» en el mapa: $3\\cdot4+4\\cdot3=12+12=24$. También sirve $(0, 6)$: $0+24=24$. «Perro» y «gato» comparten zona del mapa (seres vivos y domésticos), y por eso puntúan alto.',
          plane: plane(
            [arrow('gato', toy['gato']!, false), arrow('doc', toy['coche']!, true, 'documento')],
            ['components', 'dot'],
            ['gato', 'doc'],
          ),
          goals: [{ metric: 'dot', of: ['gato', 'doc'], target: 24, tol: 0.01 }],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'producto-escalar.ex01.1',
          type: 'numero',
          prompt:
            'Calcula el producto escalar $(2, -3)\\cdot(4, 5)$: multiplica las componentes que se corresponden y suma los productos. Escribe el número.',
          hints: [
            'Multiplica las primeras componentes entre sí y, aparte, las segundas; después suma los dos productos.',
            'Cuidado con el signo: la segunda pareja es $(-3)\\cdot5$.',
          ],
          explain:
            'El producto escalar es una suma de productos de componentes, y da un solo número. Los productos con un factor negativo restan.',
          solution: '$(2, -3)\\cdot(4, 5)=2\\cdot4+(-3)\\cdot5=8-15=-7$.',
          answer: -7,
          tol: 0,
        },
        {
          id: 'producto-escalar.ex01.2',
          type: 'opcion',
          prompt:
            'El signo del producto escalar informa del ángulo entre dos vectores sin calcular ningún ángulo: positivo si es **agudo** (menor de $90^\\circ$), cero si es **recto** y negativo si es **obtuso** (mayor de $90^\\circ$). Con $\\vec{a}=(3, 1)$ y $\\vec{b}=(-1, 4)$, ¿qué ángulo forman?',
          hints: [
            'Calcula el producto escalar y mira solo su signo.',
            'Los productos de las componentes son $3\\cdot(-1)$ y $1\\cdot4$.',
          ],
          explain:
            'No hacen falta las normas ni el ángulo: el signo del producto escalar decide. Calcúlalo con cuidado, porque un producto negativo y otro positivo se compensan.',
          solution:
            '$\\vec{a}\\cdot\\vec{b}=3\\cdot(-1)+1\\cdot4=-3+4=1$. Es positivo, así que el ángulo es agudo, aunque por poco: $\\vec{b}$ apunta a la izquierda, pero su componente vertical pesa más que la horizontal. No se necesitan las normas: el signo basta.',
          options: [
            'Recto, de $90^\\circ$',
            'Obtuso, mayor de $90^\\circ$',
            'Agudo, menor de $90^\\circ$',
            'No se puede saber sin conocer sus normas',
          ],
          correct: 2,
        },
        {
          id: 'producto-escalar.ex01.3',
          type: 'numero',
          prompt:
            'El producto escalar de un vector consigo mismo tiene un significado especial. Calcula $\\vec{v}\\cdot\\vec{v}$ con $\\vec{v}=(3, -4)$ y compáralo con su norma, la longitud de su flecha, que es $\\lVert\\vec{v}\\rVert=5$. Escribe el número.',
          hints: [
            'Es un producto escalar como cualquier otro, con las dos flechas iguales: componente por componente y suma.',
            'Cuidado con el signo: $(-4)\\cdot(-4)$ es positivo.',
          ],
          explain:
            'Es un producto escalar normal con los dos vectores iguales. Después compara el resultado con la norma que se da: ¿qué relación tienen?',
          solution:
            '$\\vec{v}\\cdot\\vec{v}=3\\cdot3+(-4)\\cdot(-4)=9+16=25=5^2=\\lVert\\vec{v}\\rVert^2$. En general $\\vec{v}\\cdot\\vec{v}=v_1^2+v_2^2=\\lVert\\vec{v}\\rVert^2$, así que $\\lVert\\vec{v}\\rVert=\\sqrt{\\vec{v}\\cdot\\vec{v}}$: la norma sale del producto escalar.',
          answer: 25,
          tol: 0,
        },
        {
          id: 'producto-escalar.ex01.4',
          type: 'numero',
          prompt:
            'El producto escalar respeta los múltiplos y las sumas, como el producto de números: $(k\\vec{a})\\cdot\\vec{b}=k\\,(\\vec{a}\\cdot\\vec{b})$ y $\\vec{a}\\cdot(\\vec{b}+\\vec{c})=\\vec{a}\\cdot\\vec{b}+\\vec{a}\\cdot\\vec{c}$, y lo mismo con la resta. De tres vectores $\\vec{u}$, $\\vec{v}$ y $\\vec{w}$ solo se sabe que $\\vec{u}\\cdot\\vec{v}=-2$ y $\\vec{u}\\cdot\\vec{w}=5$. Calcula $\\vec{u}\\cdot(3\\vec{v}-\\vec{w})$. Escribe el número.',
          hints: [
            'Reparte el producto escalar sobre la resta y saca el $3$ fuera.',
            'Te queda un múltiplo de $\\vec{u}\\cdot\\vec{v}$ menos $\\vec{u}\\cdot\\vec{w}$, que son los dos datos.',
          ],
          explain:
            'No hace falta conocer los vectores: basta repartir el producto escalar sobre la resta y sacar el factor. Cuida el signo de la resta.',
          solution:
            '$\\vec{u}\\cdot(3\\vec{v}-\\vec{w})=3\\,(\\vec{u}\\cdot\\vec{v})-\\vec{u}\\cdot\\vec{w}=3\\cdot(-2)-5=-11$.',
          answer: -11,
          tol: 0,
        },
        {
          id: 'producto-escalar.ex01.5',
          type: 'opcion',
          prompt:
            'Un buscador puntúa cada documento con el producto escalar de su embedding con el de la consulta. En un mapa de juguete (inventado y de dos dimensiones; los reales tienen cientos), la consulta es «gato», $(3, 4)$. El documento A es «perro», $(4, 3)$. El documento B es un texto largo cuyo embedding, también inventado, es $(10, 0)$: apunta bastante menos hacia la consulta que «perro». ¿Cuál puntúa más alto?',
          hints: [
            'Calcula las dos puntuaciones: el producto escalar de la consulta con cada documento.',
            'Compara los números, no lo que parece a primera vista: el producto escalar no mide solo hacia dónde apunta cada vector.',
          ],
          explain:
            'Calcula las dos puntuaciones y compáralas. Si el resultado te sorprende, piensa en qué más, además de la dirección, entra en un producto escalar.',
          solution:
            'Puntúa «perro»: $3\\cdot4+4\\cdot3=24$. Puntúa B: $3\\cdot10+4\\cdot0=30$. Gana B, aunque apunte menos hacia la consulta, porque es mucho más largo: el producto escalar crece con las normas además de con la alineación. Para comparar solo la dirección habría que quitar el efecto de la longitud.',
          options: [
            'A, porque apunta casi igual que la consulta y B apunta bastante más lejos',
            'B, porque es mucho más largo: el producto escalar premia también la longitud, no solo la dirección',
            'Puntúan igual, porque los dos están en el lado de los seres vivos',
            'B puntúa negativo, porque no tiene componente vertical',
          ],
          correct: 1,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'producto-escalar.ex02.1',
          type: 'codigo',
          prompt:
            'NumPy calcula el producto escalar de dos arrays con la función `np.dot(x, y)` o con el operador `x @ y`. Ya tienes `a = np.array([1, 2, 3])` y `b = np.array([4, -5, 6])`. Guarda en `p` su producto escalar: un único número.',
          hints: [
            'El resultado de un producto escalar es un solo número, no un array.',
            'Hay una función de NumPy y un operador que lo calculan; escribe `p = ` y úsalos con `a` y `b`.',
          ],
          explain:
            'El producto escalar multiplica las componentes que se corresponden y suma los productos, así que da un solo número. Si te sale un array con varios números, falta el paso de sumar.',
          solution:
            'Se escribe `p = np.dot(a, b)` (o `p = a @ b`): NumPy calcula $1\\cdot4+2\\cdot(-5)+3\\cdot6=4-10+18=12$.',
          starter: `import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, -5, 6])
# Calcula p, el producto escalar de a y b
p = None
`,
          checks: `_arr = isinstance(p, np.ndarray)
_escalar = (isinstance(p, (int, float, np.number)) and not isinstance(p, bool)) or (_arr and p.ndim == 0 and np.issubdtype(p.dtype, np.number))
_vec = _arr and p.shape == (3,) and np.issubdtype(p.dtype, np.number)
_elem = _vec and np.allclose(p, [4, -10, 18])
check(_escalar or _vec, "\`p\` tiene que ser un único número, el producto escalar de \`a\` y \`b\`.")
check(not _elem, "\`p\` tiene 3 números: (4, -10, 18). El operador \`*\` multiplica componente a componente, pero el producto escalar suma esos productos y da un solo número.")
check((not _vec) or _elem, "\`p\` tiene 3 componentes, es un vector: el producto escalar es un único número.")
check((not _escalar) or np.isclose(p, 12), "\`p\` tiene que valer 12: multiplica las componentes que se corresponden y suma los tres productos.")
`,
          reference:
            'import numpy as np\n\na = np.array([1, 2, 3])\nb = np.array([4, -5, 6])\np = np.dot(a, b)\n',
        },
        {
          id: 'producto-escalar.ex02.2',
          type: 'codigo',
          prompt:
            'NumPy trae el producto escalar hecho, pero conviene saber construirlo: se multiplican las componentes que se corresponden y se suman los productos. Escribe la función `producto(a, b)`, que devuelva el producto escalar de dos arrays, **sin** usar `np.dot` ni `@`. Tiene que valer para vectores de cualquier número de componentes, no solo de 2: recorre las componentes en vez de escribirlas una a una.',
          hints: [
            'Con `for x, y in zip(a, b):` recorres las parejas de componentes que se corresponden; ve acumulando los productos en una variable que empieza en 0.',
            'Otra forma es sumar con `sum` los productos de todas las parejas. En cualquier caso, la función termina con `return` y el número.',
          ],
          explain:
            'La función debe valer para cualquier número de componentes, así que no puede nombrar `a[0]`, `a[1]`... una a una. Piensa en recorrer las parejas de componentes y en cuándo se devuelve el resultado: cuando ya has recorrido todas.',
          solution:
            'Una solución es empezar con `total = 0`, recorrer las parejas con `for x, y in zip(a, b)`, sumar `x * y` a `total` en cada vuelta y, **después** del bucle, hacer `return total`. Con $(1, 2, 3)$ y $(4, -5, 6)$ da $12$, y con cualquier otro número de componentes funciona igual.',
          starter: `import numpy as np

def producto(a, b):
    # Devuelve el producto escalar de a y b, sin np.dot ni @.
    # Tiene que valer para vectores de cualquier número de componentes.
    return None
`,
          checks: `def _num(r):
    return isinstance(r, (int, float, np.number)) and not isinstance(r, bool)

def _prod(a, b):
    try:
        return producto(np.array(a), np.array(b))
    except Exception:
        return None

_r2 = _prod([1, 2], [3, 4])
_r3 = _prod([1, 2, 3], [4, -5, 6])
_r5 = _prod([2, 0, -1, 3, 5], [1, 7, 2, -2, 3])
_r1 = _prod([5], [-3])
_ok2 = _num(_r2) and np.isclose(_r2, 11)
_ok3 = _num(_r3) and np.isclose(_r3, 12)
_ok5 = _num(_r5) and np.isclose(_r5, 9)
_ok1 = _num(_r1) and np.isclose(_r1, -15)
_any = _num(_r2) or _num(_r3) or _num(_r5) or _num(_r1)
check(_any, "\`producto\` tiene que devolver un único número con \`return\`: ahora devuelve otra cosa, o falla.")
check((not _any) or _ok2, "\`producto\` tiene que dar 11 con los vectores (1, 2) y (3, 4), y no puede fallar con ellos: multiplica las componentes que se corresponden y suma los productos.")
check((not _ok2) or _ok3, "\`producto\` falla con vectores de 3 componentes: tiene que recorrer las componentes, sean las que sean, en vez de escribir las dos primeras a mano.")
check((not (_ok2 and _ok3)) or (_ok5 and _ok1), "\`producto\` funciona con 2 y 3 componentes, pero no con 1 o con 5: recorre todas las componentes, sea cual sea su número.")
`,
          reference: `import numpy as np

def producto(a, b):
    total = 0
    for x, y in zip(a, b):
        total += x * y
    return total
`,
        },
        {
          id: 'producto-escalar.ex02.3',
          type: 'codigo',
          prompt:
            'Dos vectores son **ortogonales** cuando su producto escalar es $0$. Con decimales, el ordenador no puede comparar con `==`: los cálculos arrastran errores de redondeo (por ejemplo, `0.1 + 0.2 == 0.3` es `False`), y un producto escalar que en matemáticas vale $0$ puede salir como un número diminuto. La función `np.isclose(x, y)` dice si dos números están a una distancia minúscula. Escribe la función `ortogonales(a, b)`, que devuelva `True` si los arrays `a` y `b` son ortogonales y `False` si no.',
          hints: [
            'Empieza por el producto escalar de `a` y `b`: es el número que hay que comparar con 0.',
            'Comparar con `==` falla con decimales; `np.isclose(x, y)` compara con una tolerancia pequeña.',
          ],
          explain:
            'La condición de ortogonalidad es que el producto escalar valga 0, pero con decimales no basta con preguntar si es exactamente 0. Piensa con qué se compara y cómo se compara.',
          solution:
            'Se calcula el producto escalar y se compara con 0 con tolerancia: `np.isclose(a @ b, 0)` da `True` si el producto escalar es 0 o está a una distancia minúscula de 0 (por defecto, menos de $10^{-8}$) y `False` si no. Con `==`, vectores como $(0{,}1;\\ 0{,}2;\\ 0{,}3)$ y $(0{,}7;\\ -0{,}2;\\ -0{,}1)$ darían `False` por los errores de redondeo, aunque su producto escalar valga 0. Una tolerancia grande tampoco sirve, porque aceptaría vectores que no son ortogonales.',
          starter: `import numpy as np

def ortogonales(a, b):
    # Devuelve True si a y b son ortogonales y False si no (cuidado con los decimales)
    return None
`,
          checks: `def _o(a, b):
    try:
        return ortogonales(np.array(a), np.array(b))
    except Exception:
        return None

def _bool(r):
    return isinstance(r, (bool, np.bool_))

def _t(r):
    return _bool(r) and bool(r)

_exacto = _o([3, 2], [-2, 3])
_ruido1 = _o([0.1, 0.2, 0.3], [0.7, -0.2, -0.1])
_ruido2 = _o([0.1, 0.3, 0.2], [0.1, 0.1, -0.2])
_no = _o([1, 2], [3, 4])
_casi = _o([1, 0], [0.001, 1])
check(all(_bool(r) for r in [_exacto, _ruido1, _ruido2, _no, _casi]), "\`ortogonales\` tiene que devolver \`True\` o \`False\` con \`return\`, no un número ni otra cosa.")
check(_t(_exacto) or not _bool(_exacto), "(3, 2) y (-2, 3) son ortogonales, porque su producto escalar es 0: \`ortogonales\` tiene que dar \`True\`.")
check(not _t(_exacto) or (_t(_ruido1) and _t(_ruido2)), "Con decimales, el producto escalar de dos vectores ortogonales puede salir como un número diminuto en vez de 0, por los errores de redondeo, y \`==\` no lo detecta. Compara con una tolerancia, por ejemplo con \`np.isclose\`.")
check(not _t(_no), "(1, 2) y (3, 4) no son ortogonales, porque su producto escalar es 11: \`ortogonales\` tiene que dar \`False\`.")
check(not _t(_casi), "(1, 0) y (0,001; 1) no son ortogonales, aunque su producto escalar sea muy pequeño, 0,001: la tolerancia tiene que ser minúscula, como la que ya trae \`np.isclose\`.")
`,
          reference: `import numpy as np

def ortogonales(a, b):
    return bool(np.isclose(a @ b, 0))
`,
        },
        {
          id: 'producto-escalar.ex02.4',
          type: 'codigo',
          prompt:
            'El producto escalar de un vector consigo mismo es el cuadrado de su norma: $\\vec{v}\\cdot\\vec{v}=v_1^2+v_2^2+\\dots=\\lVert\\vec{v}\\rVert^2$. Ya tienes `v = np.array([3, -4, 12])`. Guarda en `cuadrado` el producto escalar de `v` consigo mismo y en `norma` la norma de `v`, la longitud de su flecha. Para una raíz cuadrada, NumPy tiene `np.sqrt`.',
          hints: [
            '`cuadrado` es el producto escalar de `v` con `v`: un único número.',
            'La norma es la raíz cuadrada del cuadrado de la norma, y eso ya lo tienes calculado.',
          ],
          explain:
            'El producto escalar de `v` consigo mismo da el cuadrado de la norma, no la norma. Piensa qué operación hace falta para pasar de una a otra.',
          solution:
            'Se escribe `cuadrado = v @ v`, que da $9+16+144=169$, y `norma = np.sqrt(cuadrado)`, que da $13$. Así la norma sale del producto escalar: $\\lVert\\vec{v}\\rVert=\\sqrt{\\vec{v}\\cdot\\vec{v}}$.',
          starter: `import numpy as np

v = np.array([3, -4, 12])
# Calcula cuadrado, el producto escalar de v consigo mismo, y norma, la longitud de v
cuadrado = None
norma = None
`,
          checks: `def _n(x):
    return (isinstance(x, (int, float, np.number)) and not isinstance(x, bool)) or (isinstance(x, np.ndarray) and x.ndim == 0 and np.issubdtype(x.dtype, np.number))

_v = isinstance(cuadrado, np.ndarray) and cuadrado.shape == (3,) and np.issubdtype(cuadrado.dtype, np.number)
_elem = _v and np.allclose(cuadrado, [9, 16, 144])
check(_n(cuadrado) or _v, "\`cuadrado\` tiene que ser un único número, el producto escalar de \`v\` consigo mismo.")
check(not _elem, "\`cuadrado\` tiene 3 números: has elevado cada componente al cuadrado, pero falta sumarlos para obtener un único número.")
check((not _v) or _elem, "\`cuadrado\` tiene 3 componentes, es un vector: el producto escalar es un único número.")
check((not _n(cuadrado)) or np.isclose(cuadrado, 169), "\`cuadrado\` tiene que valer 169: la suma de los cuadrados de las componentes de \`v\`.")
check(_n(norma), "\`norma\` tiene que ser un único número, la longitud de \`v\`.")
check((not _n(norma)) or not np.isclose(norma, 169), "\`norma\` vale 169, como el producto escalar de \`v\` consigo mismo: falta la raíz cuadrada, porque eso es el cuadrado de la norma.")
check((not _n(norma)) or np.isclose(norma, 13) or np.isclose(norma, 169), "\`norma\` tiene que valer 13, la raíz cuadrada del producto escalar de \`v\` consigo mismo.")
`,
          reference: `import numpy as np

v = np.array([3, -4, 12])
cuadrado = v @ v
norma = np.sqrt(cuadrado)
`,
        },
        {
          id: 'producto-escalar.ex02.5',
          type: 'codigo',
          prompt:
            'Un buscador puntúa cada documento con el producto escalar de su embedding con el de la consulta. `M` guarda un embedding de juguete por fila (inventados y de 2 dimensiones; los reales tienen cientos): «coche», «lobo», «perro», «bici» y «tigre». `q` es el embedding de la consulta, «gato». El producto de una matriz por un vector, `M @ q`, hace el producto escalar de **cada fila** con `q` y devuelve un array con una puntuación por documento. Por otro lado, `np.argmax(x)` da la **posición** (contando desde 0) del valor más alto de `x`. Guarda en `puntuaciones` la puntuación de cada documento y en `mejor` la posición del documento que puntúa más.',
          hints: [
            'Una sola operación calcula las cinco puntuaciones: la matriz va a la izquierda de `@` y la consulta, a la derecha.',
            '`mejor` no es la puntuación más alta, sino la posición donde está. Las posiciones empiezan en 0.',
          ],
          explain:
            'Cada documento necesita una puntuación, un solo número: comprueba cuántos números tiene `puntuaciones`. Y `mejor` pregunta dónde está el máximo, no cuánto vale.',
          solution:
            'Se escribe `puntuaciones = M @ q`, que da $(-1, 4, 24, 6, -3)$, y `mejor = np.argmax(puntuaciones)`, que da `2`: el documento de la posición 2 es «perro», el que mejor responde a la consulta «gato». Tiene sentido: los dos comparten zona del mapa (seres vivos y domésticos).',
          starter: `import numpy as np

# Embeddings de juguete (inventados y de 2 dimensiones), uno por fila:
# coche, lobo, perro, bici, tigre
M = np.array([[-3, 2], [4, -2], [4, 3], [-2, 3], [3, -3]])
# La consulta es el embedding de "gato"
q = np.array([3, 4])
# Calcula puntuaciones (una por documento) y mejor (la posición del que puntúa más)
puntuaciones = None
mejor = None
`,
          checks: `_p = isinstance(puntuaciones, np.ndarray) and puntuaciones.shape == (5,) and np.issubdtype(puntuaciones.dtype, np.number)
_filas = isinstance(puntuaciones, np.ndarray) and puntuaciones.shape == (5, 2) and np.issubdtype(puntuaciones.dtype, np.number)
_num = (isinstance(mejor, (int, float, np.number)) and not isinstance(mejor, bool)) or (isinstance(mejor, np.ndarray) and mejor.ndim == 0 and np.issubdtype(mejor.dtype, np.number))
check(_p or _filas, "\`puntuaciones\` tiene que ser un array de NumPy con 5 números, uno por documento.")
check(not _filas, "\`puntuaciones\` tiene una fila de 2 números por documento: el operador \`*\` multiplica componente a componente, pero falta sumar. La puntuación de cada documento es un único número.")
check((not _p) or np.allclose(puntuaciones, [-1, 4, 24, 6, -3]), "\`puntuaciones\` tiene que valer (-1, 4, 24, 6, -3): el producto escalar de la consulta con cada documento.")
check(_num, "\`mejor\` tiene que ser un único número: la posición del documento que puntúa más.")
check((not _num) or not np.isclose(mejor, 24), "\`mejor\` vale 24, que es la puntuación más alta, pero se pide la posición del documento que la logra, no su valor.")
check((not _num) or not np.isclose(mejor, 3), "\`mejor\` vale 3: Python empieza a contar en 0, así que la tercera posición es la 2.")
check((not _num) or np.isclose(mejor, 2) or np.isclose(mejor, 24) or np.isclose(mejor, 3), "\`mejor\` tiene que ser la posición, contando desde 0, del documento con la puntuación más alta.")
`,
          reference: `import numpy as np

# Embeddings de juguete (inventados y de 2 dimensiones), uno por fila:
# coche, lobo, perro, bici, tigre
M = np.array([[-3, 2], [4, -2], [4, 3], [-2, 3], [3, -3]])
# La consulta es el embedding de "gato"
q = np.array([3, 4])
puntuaciones = M @ q
mejor = np.argmax(puntuaciones)
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'producto-escalar.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien ha escrito este código para guardar en `p` el producto escalar de `a` y `b` (NumPy ya está importado como `np`). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        '¿Cuántos números debe tener `p`: uno solo o uno por cada componente?',
        'Calcula a mano el resultado de `a * b` con estos datos y mira si es el producto escalar.',
      ],
      explain:
        'Piensa qué debe devolver el código: cuántos números y qué representa cada uno. Después comprueba que cada paso del código lo produce.',
      solution:
        'La tercera línea está mal. El operador `*` entre arrays multiplica componente a componente y da otro array, `[8, -3, 5]`, no un número. El producto escalar suma además esos productos: `p = np.dot(a, b)` o `p = a @ b`, que da $8-3+5=10$.',
      lines: ['a = np.array([2, 3, 1])', 'b = np.array([4, -1, 5])', 'p = a * b'],
      faultyLine: 2,
    },
    {
      id: 'producto-escalar.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento decide qué ángulo forman $\\vec{u}=(2, -3)$ y $\\vec{v}=(-1, -1)$ a partir del signo de su producto escalar. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Comprueba por separado cada producto de la primera línea, con su signo.',
        'Fíjate en los signos: ¿qué signo tiene el producto de dos números negativos?',
      ],
      explain:
        'Revisa cada paso: ¿cada producto de componentes tiene el signo correcto? ¿La conclusión sigue del signo del producto escalar?',
      solution:
        'La segunda línea está mal: $(-3)\\cdot(-1)=+3$, porque el producto de dos números negativos es positivo, y aquí se ha tomado $-3$. Lo correcto es $-2+3=1$. Como es positivo, el ángulo es agudo, no obtuso.',
      lines: [
        'u · v = 2·(−1) + (−3)·(−1)',
        '= −2 − 3 = −5',
        'Como −5 < 0, el ángulo entre u y v es obtuso',
      ],
      faultyLine: 1,
    },
    {
      id: 'producto-escalar.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento decide si $\\vec{u}=(4, -2)$ y $\\vec{v}=(1, 2)$ son ortogonales. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Calcula tú el producto escalar y compáralo con el de la primera y segunda línea.',
        'Comprueba qué dice un producto escalar nulo sobre la orientación de los vectores.',
      ],
      explain:
        'Revisa cada paso: ¿el producto escalar se calcula bien? ¿La conclusión sigue de su valor?',
      solution:
        'No hay ningún error. $(4, -2)\\cdot(1, 2)=4\\cdot1+(-2)\\cdot2=4-4=0$, y un producto escalar nulo significa que los vectores son ortogonales.',
      lines: [
        'u · v = 4·1 + (−2)·2',
        '= 4 − 4 = 0',
        'Como el producto escalar es 0, u y v son ortogonales',
      ],
      faultyLine: null,
    },
  ],
};
