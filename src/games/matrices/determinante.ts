import type { Goal, PlaneSpec, Project } from '../../content/schema';
import { determinanteWarmup } from './determinante.calentamiento';
import { transformPlane, type TransformPlaneOptions } from './plane';

/** Plano de transformación con î fijo y ĵ arrastrable. */
const fixedIPlane = (o: TransformPlaneOptions): PlaneSpec => {
  const p = transformPlane({ ...o, movable: true });
  return {
    ...p,
    vectors: p.vectors.map((v) => (v.id === 'i' ? { ...v, movable: false } : v)),
  };
};

/** Meta sobre el determinante de la matriz de columnas î y ĵ. */
const detGoal = (target: number): Goal => ({ metric: 'det', of: ['i', 'j'], target, tol: 0.01 });

/** Primer proyecto de la Órbita 1 de matrices: el determinante como factor de área con signo. */
export const determinante: Project = {
  id: 'determinante',
  name: 'Determinante',
  sub: 'El área con signo',
  warmup: determinanteWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'determinante.ex00.1',
          type: 'manipular',
          prompt:
            'El **determinante** de una matriz es el factor por el que multiplica las áreas. El cuadrado unidad, de área $1$, se convierte en el paralelogramo que forman las columnas de la matriz, y su área es el determinante. Aquí $\\hat{\\imath}$ está fijo en $(1, 0)$. Mueve la punta de $\\hat{\\jmath}$ para que el paralelogramo tenga **área 3**, con la punta por encima del eje $x$. Razónalo como base por altura.',
          hints: [
            'La base del paralelogramo es $\\hat{\\imath}$, que mide $1$. ¿Qué altura necesita para que base por altura dé $3$?',
            'La altura es la distancia de la punta de $\\hat{\\jmath}$ al eje $x$, es decir, su coordenada $y$ si está por encima del eje. Mover la punta en horizontal no la cambia.',
          ],
          explain:
            'Un paralelogramo tiene área base por altura. Con la base sobre el eje $x$, la altura es la coordenada $y$ de $\\hat{\\jmath}$, no su longitud: si inclinas el vector sin subir la punta, el área no cambia.',
          solution:
            'Con base $1$, la altura tiene que valer $3$: la punta de $\\hat{\\jmath}$ debe tener $y=3$, con cualquier $x$. Por ejemplo, $\\hat{\\jmath}=(0, 3)$ da $A=\\begin{pmatrix}1&0\\\\0&3\\end{pmatrix}$, con $\\det A=1\\cdot 3-0\\cdot 0=3$. También vale $(2, 3)$, que inclina el paralelogramo sin cambiarle el área.',
          plane: fixedIPlane({ range: 4, readouts: ['matrix'] }),
          goals: [detGoal(3)],
        },
        {
          id: 'determinante.ex00.2',
          type: 'manipular',
          prompt:
            'Aquí $\\hat{\\imath}=(1, 0)$ está fijo y $\\hat{\\jmath}$ parte de $(0, 2)$: el paralelogramo es un rectángulo de área $2$. Desliza la punta de $\\hat{\\jmath}$ hasta que tenga $x=2$ **sin cambiar el área**: el determinante tiene que seguir en $2$.',
          hints: [
            'El área es base por altura, y la base $\\hat{\\imath}$ no se mueve. Para que el área no cambie, la altura de la punta, su $y$, ha de seguir igual.',
            'Deslizar la punta en horizontal inclina el paralelogramo sin cambiar su altura. Mira el valor del determinante mientras la mueves.',
          ],
          explain:
            'El área depende de la altura de la punta de $\\hat{\\jmath}$ sobre la recta de $\\hat{\\imath}$, no de cuánto se desplaza a lo largo de ella. Si subes o bajas la punta, el determinante cambia; si la deslizas en horizontal, no.',
          solution:
            'La punta pasa de $(0, 2)$ a $(2, 2)$: se desliza en horizontal y mantiene $y=2$. La matriz es $\\begin{pmatrix}1&2\\\\0&2\\end{pmatrix}$, y su determinante sigue siendo $1\\cdot 2-2\\cdot 0=2$. Una **inclinación** como esta deforma las figuras, pero conserva las áreas.',
          plane: fixedIPlane({ j: [0, 2], readouts: ['matrix', 'det'] }),
          goals: [{ metric: 'x', of: ['j'], target: 2, tol: 0.01 }, detGoal(2)],
        },
        {
          id: 'determinante.ex00.3',
          type: 'manipular',
          prompt:
            'Construye una transformación con $\\det A=6$ en la que **ninguna columna esté sobre un eje**. Coloca $\\hat{\\imath}$ en $(2, 1)$ y deja a $\\hat{\\jmath}$ con $x=2$; elige la $y$ de $\\hat{\\jmath}$ para que el determinante valga $6$.',
          hints: [
            'Con $\\hat{\\imath}=(2, 1)$ y $\\hat{\\jmath}=(2, y)$, la matriz es $\\begin{pmatrix}2&2\\\\1&y\\end{pmatrix}$. Escribe su determinante $ad-bc$ en función de $y$.',
            'Resuelve la ecuación $2y-2\\cdot 1=6$.',
          ],
          explain:
            'El determinante multiplica en cruz: la $x$ de $\\hat{\\imath}$ por la $y$ de $\\hat{\\jmath}$, menos la $x$ de $\\hat{\\jmath}$ por la $y$ de $\\hat{\\imath}$. Si emparejas las coordenadas de otra manera, sale otra ecuación.',
          solution:
            'La matriz $\\begin{pmatrix}2&2\\\\1&y\\end{pmatrix}$ tiene $\\det=2y-2\\cdot 1$. De $2y-2=6$ sale $y=4$: $\\hat{\\jmath}=(2, 4)$. Ninguna de las dos columnas, $(2, 1)$ y $(2, 4)$, está sobre un eje.',
          plane: transformPlane({
            movable: true,
            range: 5,
            snap: 1,
            readouts: ['matrix', 'det'],
          }),
          goals: [
            { metric: 'x', of: ['i'], target: 2, tol: 0.01 },
            { metric: 'y', of: ['i'], target: 1, tol: 0.01 },
            { metric: 'x', of: ['j'], target: 2, tol: 0.01 },
            detGoal(6),
          ],
        },
        {
          id: 'determinante.ex00.4',
          type: 'manipular',
          prompt:
            'Si el determinante es **negativo**, la transformación da la vuelta al plano, como un espejo, y el paralelogramo se pinta de rojo. Con $\\hat{\\imath}=(1, 1)$ fijo, mueve $\\hat{\\jmath}$ hasta que $\\det A=-2$. Fíjate en de qué lado de la recta de $\\hat{\\imath}$ queda $\\hat{\\jmath}$.',
          hints: [
            'Con $\\hat{\\imath}=(1, 1)$ y $\\hat{\\jmath}=(x, y)$, el determinante es $1\\cdot y-x\\cdot 1=y-x$. Hace falta $y-x=-2$.',
            'Prueba con $x=2$: ¿qué $y$ cumple $y-2=-2$?',
          ],
          explain:
            'El signo del determinante es la orientación: con signo positivo, $\\hat{\\jmath}$ queda a la izquierda de $\\hat{\\imath}$, como en la identidad; con signo negativo queda a la derecha y el plano se ha volteado. Si te sale $+2$ en vez de $-2$, $\\hat{\\jmath}$ está al otro lado de la recta de $\\hat{\\imath}$.',
          solution:
            'El determinante es $y-x$, así que hace falta $y=x-2$. Sirve $\\hat{\\jmath}=(2, 0)$, y también $(3, 1)$ o $(1, -1)$. El área es $\\lvert -2\\rvert=2$, y el signo menos dice que $\\hat{\\jmath}$ está a la derecha de $\\hat{\\imath}$: la transformación voltea la orientación del plano.',
          plane: fixedIPlane({ i: [1, 1], range: 3, readouts: ['matrix', 'det'] }),
          goals: [detGoal(-2)],
        },
        {
          id: 'determinante.ex00.5',
          type: 'manipular',
          prompt:
            'Con $\\hat{\\imath}=(2, 1)$ fijo, aplasta el plano sobre una recta: mueve $\\hat{\\jmath}$ hasta que $\\det A=0$. Para descartar la solución trivial de poner $\\hat{\\jmath}$ en el origen, la punta de $\\hat{\\jmath}$ tiene que quedar en $x=-2$.',
          hints: [
            'Para que el área sea $0$, $\\hat{\\jmath}$ tiene que estar en la recta que pasa por $\\hat{\\imath}$ y por el origen. ¿Qué punto de esa recta tiene $x=-2$?',
            'En esa recta, la $y$ vale la mitad de la $x$. También puedes plantear $2y-x\\cdot 1=0$.',
          ],
          explain:
            'Un determinante cero significa área cero: $\\hat{\\imath}$ y $\\hat{\\jmath}$ están en la misma recta, y el paralelogramo se ha reducido a un segmento. Todo el plano se aplasta sobre esa recta.',
          solution:
            'El determinante es $2y-x\\cdot 1$; con $x=-2$, la ecuación $2y+2=0$ da $y=-1$. Así, $\\hat{\\jmath}=(-2, -1)=-\\hat{\\imath}$, paralelo a $\\hat{\\imath}$. El paralelogramo es un segmento de área $0$ y todo el plano cae sobre esa recta. Una matriz así no tiene inversa: ya no se sabe qué punto de partida dio cada punto de llegada.',
          plane: fixedIPlane({ i: [2, 1], range: 3, readouts: ['matrix', 'det'] }),
          goals: [{ metric: 'x', of: ['j'], target: -2, tol: 0.01 }, detGoal(0)],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'determinante.ex01.1',
          type: 'numero',
          prompt:
            'Para una matriz $A=\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}$, el determinante es $\\det A=ad-bc$. Calcula $\\det A$ con $A=\\begin{pmatrix}2&-3\\\\1&4\\end{pmatrix}$.',
          hints: [
            'Multiplica la diagonal principal, $a\\cdot d$, y después $b\\cdot c$, con su signo.',
            'Restar un número negativo es sumarlo.',
          ],
          explain:
            'El determinante resta dos productos: el de la diagonal principal menos el de la otra diagonal. Cuida el signo de $b\\cdot c$ antes de restar: aquí es negativo, y restarlo suma.',
          solution:
            '$\\det A=2\\cdot 4-(-3)\\cdot 1=8+3=11$. Si te sale $5$, has sumado $ad+bc$ en lugar de restar, o has perdido el signo menos de $b$.',
          answer: 11,
          tol: 0,
        },
        {
          id: 'determinante.ex01.2',
          type: 'numero',
          prompt:
            'Un paralelogramo tiene por lados los vectores $\\vec{u}=(2, 3)$ y $\\vec{v}=(4, 1)$. Su área es $\\lvert\\det A\\rvert$, con $A$ la matriz que tiene a $\\vec{u}$ y $\\vec{v}$ por columnas. Calcula el área.',
          hints: [
            'La matriz es $A=\\begin{pmatrix}2&4\\\\3&1\\end{pmatrix}$: cada vector va en una columna.',
            'Calcula $ad-bc$. Si te sale negativo, recuerda que un área no lo es.',
          ],
          explain:
            'El determinante lleva un signo, la orientación, y el área no: el área es su valor absoluto. El signo solo dice en qué orden están los dos vectores.',
          solution:
            '$\\det A=2\\cdot 1-4\\cdot 3=-10$, y el área es $\\lvert -10\\rvert=10$. El signo menos indica que $\\vec{v}$ queda a la derecha de $\\vec{u}$. Si cambias el orden de los dos vectores, el determinante pasa a $+10$ y el paralelogramo es el mismo.',
          answer: 10,
          tol: 0,
        },
        {
          id: 'determinante.ex01.3',
          type: 'numero',
          prompt:
            'Una matriz de $2\\times 2$ es **triangular** si tiene un cero fuera de la diagonal, como esta. Calcula $\\det A$ con $A=\\begin{pmatrix}-2&5\\\\0&4\\end{pmatrix}$.',
          hints: [
            'Aplica $ad-bc$. ¿Cuánto vale $b\\cdot c$ cuando $c=0$?',
            'Mira dónde van los vectores de la base: $\\hat{\\imath}$ va a $(-2, 0)$, sobre el eje $x$.',
          ],
          explain:
            'Con un cero fuera de la diagonal, uno de los dos productos desaparece y el determinante es el producto de la diagonal. El otro número, aquí el $5$, no interviene.',
          solution:
            '$\\det A=(-2)\\cdot 4-5\\cdot 0=-8$, el producto de la diagonal. En el plano, el paralelogramo tiene base $2$ (con signo menos, porque $\\hat{\\imath}$ apunta a la izquierda) y altura $4$. El $5$ solo inclina el paralelogramo, y las inclinaciones no cambian el área.',
          answer: -8,
          tol: 0,
        },
        {
          id: 'determinante.ex01.4',
          type: 'opcion',
          prompt:
            'Una transformación **voltea la orientación** del plano, como un espejo, cuando su determinante es negativo. ¿Cuál de estas matrices la voltea?',
          hints: [
            'Calcula el determinante de cada una: solo importa su signo.',
            'Que una matriz tenga entradas negativas no quiere decir que su determinante lo sea.',
          ],
          explain:
            'Solo el signo del determinante decide la orientación, no el de las entradas. Calcula $ad-bc$ de las cuatro y mira cuál sale negativo.',
          solution:
            'Los determinantes son $2\\cdot 1-1\\cdot 1=1$; $0\\cdot 0-(-1)\\cdot 1=1$ (el giro de un cuarto de vuelta, que conserva la orientación); $1\\cdot 1-3\\cdot 2=-5$; y $(-1)(-2)-0=2$. Solo la tercera es negativa. La cuarta tiene dos entradas negativas, pero su determinante es positivo: da la vuelta en dos direcciones, y las dos vueltas se compensan.',
          options: [
            '$\\begin{pmatrix}2&1\\\\1&1\\end{pmatrix}$',
            '$\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$',
            '$\\begin{pmatrix}1&3\\\\2&1\\end{pmatrix}$',
            '$\\begin{pmatrix}-1&0\\\\0&-2\\end{pmatrix}$',
          ],
          correct: 2,
        },
        {
          id: 'determinante.ex01.5',
          type: 'numero',
          prompt:
            'Dos capas lineales de $2\\times 2$ van seguidas, sin activación en medio: primero $W_1$, con $\\det W_1=2$, y después $W_2$, con $\\det W_2=-3$. Juntas equivalen a la matriz $W_2W_1$. Sin multiplicar las matrices, ¿cuánto vale $\\det(W_2W_1)$?',
          hints: [
            'Cada capa multiplica las áreas por su determinante. ¿Por cuánto las multiplican las dos, una tras otra?',
            'El signo también se compone: la capa $W_2$ voltea el plano y la $W_1$ no.',
          ],
          explain:
            'Cada transformación escala el área por su determinante, así que dos seguidas la escalan por el producto de los dos: $\\det(AB)=\\det A\\cdot\\det B$. Los determinantes se multiplican, no se suman.',
          solution:
            '$\\det(W_2W_1)=2\\cdot(-3)=-6$. Las dos capas juntas multiplican las áreas por $6$, y el signo menos dice que la pareja voltea la orientación, porque solo $W_2$ lo hace. Este es el factor de área de la capa única equivalente.',
          answer: -6,
          tol: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'determinante.ex02.1',
          type: 'codigo',
          prompt:
            'Para $A=\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}$, el determinante exacto es $1\\cdot 4-2\\cdot 3=-2$, pero `np.linalg.det` calcula con decimales binarios y no devuelve justo ese número. Ya tienes `A`. Guarda en `d` su determinante con `np.linalg.det`; en `bien`, si `d` es $-2$, comparándolo con `np.isclose`; y en `d_int`, el determinante redondeado al entero más cercano con `round`.',
          hints: [
            '`np.linalg.det(A)` devuelve el determinante como un número decimal.',
            'Con `==` entre decimales, una diferencia en la última cifra da `False`. `np.isclose(x, y)` acepta diferencias diminutas.',
          ],
          explain:
            'NumPy calcula el determinante con una factorización en decimales, y el resultado suele arrastrar un error de redondeo en las últimas cifras. Por eso se compara con tolerancia y no con una igualdad exacta; y si se espera un entero, se redondea.',
          solution:
            '`d = np.linalg.det(A)` vale `-2.0000000000000004`, no `-2`. Con `d == -2` saldría `False`; con `np.isclose(d, -2)` sale `True`, y `round` devuelve `-2`. Es la misma razón por la que un determinante casi cero no se compara con `== 0`.',
          requirements: [
            '`d` es un número: el determinante de `A`, que se acepta con el pequeño error de redondeo de los decimales.',
            '`bien` es un solo `True` o `False`, y dice que `d` coincide con el valor exacto del determinante aunque lleve un error de redondeo.',
            '`d_int` es un número: el determinante redondeado al entero más cercano.',
          ],
          starter: `import numpy as np

A = np.array([[1, 2], [3, 4]])
# Guarda en d el determinante de A, en bien si d es -2 (con np.isclose) y en d_int el determinante redondeado
d = None
bien = None
d_int = None
`,
          checks: `_n = lambda x: isinstance(x, (int, float, np.integer, np.floating)) and not isinstance(x, (bool, np.bool_))
_d = _n(d)
_b = isinstance(bien, (bool, np.bool_))
_e = _n(d_int)
check(_d, "\`d\` tiene que ser un número: el determinante de \`A\`, que se calcula con \`np.linalg.det\`.")
check((not _d) or np.isclose(d, -2), "\`d\` tiene que valer -2 (salvo el redondeo): es el determinante de \`A\`, 1 por 4 menos 2 por 3.")
check(_b, "\`bien\` tiene que ser un solo \`True\` o \`False\`: el resultado de comparar \`d\` con -2.")
check((not _b) or bool(bien), "\`bien\` vale \`False\`: \`d\` lleva un error de redondeo en las últimas cifras, y una igualdad exacta lo toma como una diferencia. Para comparar decimales sirve \`np.isclose\`.")
check(_e, "\`d_int\` tiene que ser un número: el determinante redondeado al entero más cercano.")
check((not _e) or d_int == -2, "\`d_int\` tiene que valer -2: el determinante redondeado al entero más cercano, con \`round\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 2], [3, 4]])\nd = np.linalg.det(A)\nbien = np.isclose(d, -2)\nd_int = round(d)\n',
        },
        {
          id: 'determinante.ex02.2',
          type: 'codigo',
          prompt:
            'El área de un triángulo de vértices `a`, `b` y `c` es la mitad de la del paralelogramo que forman `b - a` y `c - a`, y esa se obtiene con un determinante. Escribe `area_triangulo(a, b, c)`, que recibe tres arrays de NumPy con 2 números y devuelve el área. Después guarda en `area` el área del triángulo de vértices $(1, 1)$, $(2, 4)$ y $(5, 2)$.',
          hints: [
            'Los dos lados que salen de `a` son `b - a` y `c - a`. Ponlos como las dos filas de una matriz de 2 filas y 2 columnas y calcula su determinante.',
            'El determinante puede salir negativo según el orden de los vértices, y el triángulo tiene la mitad del área del paralelogramo.',
          ],
          explain:
            'El determinante de los dos lados es el área del paralelogramo, con signo, y el triángulo ocupa la mitad. El signo depende del orden en que se dan los vértices, y un área no puede ser negativa.',
          solution:
            'Se arma una matriz con `b - a` y `c - a`, y se devuelve el valor absoluto de su determinante dividido entre 2. Con los vértices del enunciado, `b - a` es $(1, 3)$ y `c - a` es $(4, 1)$: $\\det=1\\cdot 1-3\\cdot 4=-11$, y el área es $11/2=5{,}5$. Con otro orden de vértices cambia el signo del determinante, y el área no.',
          requirements: [
            '`area_triangulo` es una función que recibe tres arrays de NumPy con 2 números, los vértices, y devuelve un solo número: el área del triángulo.',
            'Se llama a la función con otros vértices además de los del enunciado, entre ellos los mismos vértices en otro orden y tres vértices alineados; no debe dar error.',
            'El área devuelta nunca es negativa, no depende del orden de los vértices y vale cero si los tres están alineados. Es la del triángulo, no la del paralelogramo.',
            '`area` es un número: lo que devuelve `area_triangulo` con los vértices del enunciado.',
          ],
          starter: `import numpy as np


def area_triangulo(a, b, c):
    # Devuelve el área del triángulo de vértices a, b y c (arrays de 2 números)
    return None


# Guarda en area el área del triángulo de vértices (1, 1), (2, 4) y (5, 2)
area = None
`,
          checks: `_f = callable(globals().get("area_triangulo"))
def _call(a, b, c):
    try:
        return area_triangulo(np.array(a), np.array(b), np.array(c))
    except Exception:
        return None
def _num(x):
    return isinstance(x, (int, float, np.integer, np.floating)) and not isinstance(x, (bool, np.bool_))
_r = [_call((1, 1), (2, 4), (5, 2)), _call((1, 1), (5, 2), (2, 4)), _call((0, 0), (4, 0), (0, 3)), _call((0, 0), (1, 1), (2, 2))] if _f else []
_all = _f and all(_num(x) for x in _r)
_neg = _all and np.isclose(_r[0], -5.5)
_dbl = _all and np.isclose(_r[0], 11) and np.isclose(_r[2], 12)
_good = _all and np.isclose(_r[0], 5.5) and np.isclose(_r[1], 5.5) and np.isclose(_r[2], 6) and np.isclose(_r[3], 0)
check(_f, "Hay que definir una función \`area_triangulo\` que reciba los tres vértices.")
check((not _f) or _all, "\`area_triangulo\` tiene que devolver un número: el área del triángulo.")
check((not _all) or not _neg, "\`area_triangulo\` devuelve un área negativa: el determinante cambia de signo según el orden de los vértices, y un área nunca es negativa.")
check((not _all) or not _dbl, "\`area_triangulo\` devuelve el área del paralelogramo, que es el doble de la del triángulo.")
check((not _all) or _neg or _dbl or _good, "\`area_triangulo\` tiene que dar 5,5 para los vértices (1, 1), (2, 4) y (5, 2), con cualquier orden de los vértices, y 0 si los tres están alineados.")
check((not _good) or (_num(area) and np.isclose(area, 5.5)), "\`area\` tiene que ser lo que devuelve \`area_triangulo\` para los vértices (1, 1), (2, 4) y (5, 2).")
`,
          reference: `import numpy as np


def area_triangulo(a, b, c):
    M = np.array([b - a, c - a])
    return abs(np.linalg.det(M)) / 2


area = area_triangulo(np.array([1, 1]), np.array([2, 4]), np.array([5, 2]))
`,
        },
        {
          id: 'determinante.ex02.3',
          type: 'codigo',
          prompt:
            'El signo de un determinante dice de qué lado está un punto. Para la recta que pasa por `a` y `b`, recorrida de `a` a `b`, el punto `c` está a la **izquierda** si el determinante de `b - a` y `c - a` es positivo (como $\\hat{\\jmath}$ respecto de $\\hat{\\imath}$ en la identidad). Escribe `a_la_izquierda(a, b, c)`, que devuelve `True` si `c` está estrictamente a la izquierda, y `False` si está a la derecha o sobre la recta. Guarda en `lado` lo que devuelve para `a` $=(0, 0)$, `b` $=(4, 1)$ y `c` $=(1, 3)$.',
          hints: [
            'Es el mismo determinante de los dos lados que salen de `a`, pero aquí solo importa su signo.',
            'Si `c` está sobre la recta, el determinante es $0$, y $0$ no es positivo.',
          ],
          explain:
            'El determinante de `b - a` y `c - a` es positivo si el giro de `b - a` hacia `c - a` es antihorario, y negativo si es horario. Vale $0$ cuando los tres puntos están alineados, y estar alineado no es estar a la izquierda.',
          solution:
            'Se calcula el determinante de la matriz con `b - a` y `c - a`, y se devuelve si es mayor que cero. Con los datos, `b - a` es $(4, 1)$ y `c - a` es $(1, 3)$: $\\det=4\\cdot 3-1\\cdot 1=11>0$, luego `c` queda a la izquierda. Con la condición «menor que cero» se contestaría al revés, y con «mayor o igual que cero» un punto sobre la recta contaría como izquierda. Este test es la base de muchos algoritmos de geometría, como el cierre convexo.',
          requirements: [
            '`a_la_izquierda` es una función que recibe tres arrays de NumPy con 2 números, `a`, `b` y `c`, y devuelve un solo `True` o `False`.',
            'Se llama a la función con otros puntos además de los del enunciado: a la izquierda, a la derecha y sobre la recta, y también recorriendo la recta en sentido contrario; no debe dar error.',
            'Un punto sobre la recta no cuenta como estar a la izquierda: la función da `True` solo si está estrictamente a la izquierda.',
            '`lado` es un solo `True` o `False`: lo que devuelve la función con los puntos del enunciado.',
          ],
          starter: `import numpy as np


def a_la_izquierda(a, b, c):
    # Devuelve True si c está estrictamente a la izquierda de la recta que va de a a b
    return None


# Guarda en lado lo que devuelve la función para a = (0, 0), b = (4, 1) y c = (1, 3)
lado = None
`,
          checks: `_f = callable(globals().get("a_la_izquierda"))
def _call(a, b, c):
    try:
        return a_la_izquierda(np.array(a), np.array(b), np.array(c))
    except Exception:
        return None
_cases = [((0, 0), (4, 1), (1, 3)), ((0, 0), (4, 1), (3, 0)), ((1, 1), (1, 5), (0, 3)), ((0, 0), (2, 1), (4, 2)), ((4, 1), (0, 0), (1, 3))]
_want = [True, False, True, False, False]
_r = [_call(*c) for c in _cases] if _f else []
_all = _f and all(isinstance(x, (bool, np.bool_)) for x in _r)
_got = [bool(x) for x in _r] if _all else []
_rev = _all and _got == [False, True, False, False, True]
_wide = _all and _got == [True, False, True, True, False]
check(_f, "Hay que definir una función \`a_la_izquierda\` que reciba los tres puntos.")
check((not _f) or _all, "\`a_la_izquierda\` tiene que devolver un solo \`True\` o \`False\`.")
check((not _all) or not _rev, "\`a_la_izquierda\` contesta al revés: dice que un punto está a la izquierda cuando está a la derecha. Un determinante positivo es el giro antihorario, el de la izquierda.")
check((not _all) or not _wide, "\`a_la_izquierda\` da \`True\` para un punto sobre la recta, que tiene determinante 0. Tiene que ser estrictamente a la izquierda.")
check((not _all) or _rev or _wide or _got == _want, "\`a_la_izquierda\` tiene que dar \`True\` para (1, 3) respecto de la recta de (0, 0) a (4, 1), \`False\` para (3, 0), y \`False\` para un punto sobre la recta. Si se recorre la recta al revés, la respuesta cambia.")
check((not _all) or _got != _want or (isinstance(lado, (bool, np.bool_)) and bool(lado)), "\`lado\` tiene que ser \`True\`: es lo que devuelve la función para (0, 0), (4, 1) y (1, 3).")
`,
          reference: `import numpy as np


def a_la_izquierda(a, b, c):
    M = np.array([b - a, c - a])
    return bool(np.linalg.det(M) > 0)


lado = a_la_izquierda(np.array([0, 0]), np.array([4, 1]), np.array([1, 3]))
`,
        },
        {
          id: 'determinante.ex02.4',
          type: 'codigo',
          prompt:
            'El determinante de un producto es el producto de los determinantes: $\\det(AB)=\\det A\\cdot\\det B$, porque las áreas se multiplican en cada paso. Compruébalo con `A` y `B`. Guarda en `dAB` el determinante de `A @ B`, en `dA_dB` el producto del determinante de `A` por el de `B`, y en `coincide` si los dos valores son iguales, comparados con `np.isclose` (un solo `True` o `False`).',
          hints: [
            'Hay dos rutas al mismo número: multiplicar las matrices y calcular un determinante, o calcular dos determinantes y multiplicarlos.',
            'Los dos valores son decimales con redondeos distintos: una igualdad exacta puede dar `False` aunque coincidan.',
          ],
          explain:
            'En matemáticas las dos rutas dan el mismo número, pero NumPy las calcula con redondeos distintos y pueden diferir en la última cifra. Por eso se compara con tolerancia. Si sale un número muy distinto, comprueba que multiplicas los determinantes en lugar de sumarlos.',
          solution:
            '`dAB = np.linalg.det(A @ B)` y `dA_dB = np.linalg.det(A) * np.linalg.det(B)` valen $10$ salvo el redondeo: $\\det A=5$, $\\det B=2$, y $AB=\\begin{pmatrix}4&-2\\\\7&-1\\end{pmatrix}$ tiene $\\det=-4+14=10$. Con `np.isclose` en `coincide` sale `True`; una igualdad exacta daría `False`, por `9.999999999999998` frente a `10.000000000000002`.',
          requirements: [
            '`dAB` es un número: el determinante del producto de `A` por `B`.',
            '`dA_dB` es un número: el determinante de `A` multiplicado por el de `B`, calculados por separado.',
            '`coincide` es un solo `True` o `False`, y dice que los dos valores son iguales salvo el error de redondeo.',
            'Los dos números se aceptan con una diferencia diminuta de redondeo.',
          ],
          starter: `import numpy as np

A = np.array([[2, 1], [1, 3]])
B = np.array([[1, -1], [2, 0]])
# Guarda en dAB el determinante de A @ B, en dA_dB el producto de det(A) por det(B), y en coincide si son iguales (con np.isclose)
dAB = None
dA_dB = None
coincide = None
`,
          checks: `_n = lambda x: isinstance(x, (int, float, np.integer, np.floating)) and not isinstance(x, (bool, np.bool_))
_1 = _n(dAB)
_2 = _n(dA_dB)
_3 = isinstance(coincide, (bool, np.bool_))
check(_1, "\`dAB\` tiene que ser un número: el determinante del producto de \`A\` por \`B\`.")
check((not _1) or np.isclose(dAB, 10), "\`dAB\` tiene que valer 10: es el determinante de \`A @ B\`, no el de \`A\` ni el de \`B\`.")
check(_2, "\`dA_dB\` tiene que ser un número: el producto del determinante de \`A\` por el de \`B\`.")
check((not _2) or np.isclose(dA_dB, 10), "\`dA_dB\` tiene que valer 10: el determinante de \`A\` (5) multiplicado por el de \`B\` (2). Los determinantes se multiplican, no se suman.")
check(_3, "\`coincide\` tiene que ser un solo \`True\` o \`False\`.")
check((not _3) or bool(coincide), "\`coincide\` vale \`False\`: los dos valores son iguales salvo el redondeo, y una igualdad exacta los distingue. Compáralos con \`np.isclose\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[2, 1], [1, 3]])\nB = np.array([[1, -1], [2, 0]])\ndAB = np.linalg.det(A @ B)\ndA_dB = np.linalg.det(A) * np.linalg.det(B)\ncoincide = np.isclose(dAB, dA_dB)\n',
        },
        {
          id: 'determinante.ex02.5',
          type: 'codigo',
          prompt:
            'Una capa lineal de $2\\times 2$ con pesos $W$ multiplica las áreas por $\\lvert\\det W\\rvert$. Si ese valor está cerca de $0$, la capa casi aplasta el plano sobre una recta y pierde información: entradas distintas acaban casi en el mismo punto. `pesos` guarda cinco matrices de pesos de una capa de juguete (las capas reales tienen cientos de dimensiones). Guarda en `colapsan` un array de cinco valores `True` o `False`: `True` si $\\lvert\\det W\\rvert<10^{-6}$ para esa matriz; y en `cuantas`, cuántas colapsan.',
          hints: [
            '`np.linalg.det` acepta un array de matrices de forma `(5, 2, 2)` y devuelve un determinante por matriz.',
            'Un determinante «cero» puede salir como `1e-17`, así que `== 0` no sirve. Y un determinante negativo grande no es un colapso, sino un volteo.',
          ],
          explain:
            'Una matriz que casi aplasta el plano tiene un factor de área casi nulo, y eso depende del tamaño del determinante, no de su signo. Los ceros calculados con decimales no son exactos, así que «casi cero» se mide con un umbral y no con una igualdad. Un determinante negativo da la vuelta al plano, pero no lo aplasta.',
          solution:
            'Se compara `np.abs(np.linalg.det(pesos))` con `1e-6`. Los determinantes son $0{,}5$; del orden de $10^{-17}$ (las filas de la segunda matriz son proporcionales, pero el redondeo no deja un cero exacto); del orden de $10^{-9}$; $-1$; y $0{,}005$. Colapsan la segunda y la tercera, así que `cuantas` vale 2. Con una igualdad exacta con cero no se detecta ninguna; sin el valor absoluto, la cuarta, un espejo que no pierde nada, contaría como colapso; y con un umbral demasiado grande entraría la quinta. Una capa así no tiene inversa fiable: los dos proyectos siguientes de esta órbita, la inversa y el rango, explican por qué.',
          requirements: [
            '`colapsan` es un array de NumPy con 5 valores `True` o `False`, uno por cada matriz de `pesos` y en el mismo orden.',
            '`colapsan` vale `True` solo en las matrices cuyo determinante, en valor absoluto, es menor que el umbral del enunciado: una matriz que solo da la vuelta al plano no cuenta.',
            '`cuantas` es un número entero: cuántas matrices marca `colapsan`.',
          ],
          starter: `import numpy as np

pesos = np.array([
    [[1, 0], [0, 0.5]],
    [[0.3, 0.1], [0.9, 0.3]],
    [[1, 2], [0.5, 1.000000001]],
    [[0, 1], [1, 0]],
    [[1, 0], [0, 0.005]],
])
# Guarda en colapsan cinco True/False (valor absoluto del determinante menor que 1e-6) y en cuantas cuántas colapsan
colapsan = None
cuantas = None
`,
          checks: `_c = isinstance(colapsan, np.ndarray) and colapsan.shape == (5,) and colapsan.dtype == bool
_got = [bool(x) for x in colapsan] if _c else []
_want = [False, True, True, False, False]
_eq0 = _c and _got == [False, False, False, False, False]
_noabs = _c and _got == [False, True, True, True, False]
_big = _c and _got == [False, True, True, False, True]
_ok = _c and _got == _want
_n = isinstance(cuantas, (int, np.integer)) and not isinstance(cuantas, (bool, np.bool_))
check(_c, "\`colapsan\` tiene que ser un array de NumPy con 5 valores \`True\` o \`False\`, uno por matriz.")
check((not _c) or not _eq0, "\`colapsan\` no marca ninguna matriz: un determinante casi cero no vale exactamente 0 y una igualdad exacta no lo detecta. Compara con un umbral pequeño.")
check((not _c) or not _noabs, "\`colapsan\` marca una matriz que no aplasta el plano, solo lo voltea: un determinante muy negativo no es casi cero. Hay que usar el valor absoluto.")
check((not _c) or not _big, "\`colapsan\` marca una matriz cuyo determinante es pequeño pero no menor que el umbral de 1e-6.")
check((not _c) or _eq0 or _noabs or _big or _ok, "\`colapsan\` tiene que ser \`True\` solo para la segunda y la tercera matriz, las que tienen un valor absoluto del determinante menor que 1e-6.")
check((not _ok) or _n, "\`cuantas\` tiene que ser un número entero: cuántas matrices casi aplastan el plano.")
check((not _ok) or (not _n) or cuantas == 2, "\`cuantas\` tiene que valer 2: son las matrices que marca \`colapsan\`.")
`,
          reference:
            'import numpy as np\n\npesos = np.array([\n    [[1, 0], [0, 0.5]],\n    [[0.3, 0.1], [0.9, 0.3]],\n    [[1, 2], [0.5, 1.000000001]],\n    [[0, 1], [1, 0]],\n    [[1, 0], [0, 0.005]],\n])\ncolapsan = np.abs(np.linalg.det(pesos)) < 1e-6\ncuantas = int(colapsan.sum())\n',
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'determinante.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere saber si una matriz aplasta el plano sobre una recta, es decir, si su determinante es cero. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Las filas de `A` son proporcionales, así que su determinante exacto es $0$. Piensa si NumPy lo calcula exactamente.',
        'NumPy calcula con decimales y redondeos. ¿Qué da una igualdad exacta entre un decimal así obtenido y un entero?',
      ],
      explain:
        'Un determinante calculado con decimales arrastra errores de redondeo en las últimas cifras, y una igualdad exacta los toma como una diferencia real. Piensa qué valor tendrá de verdad el determinante de esta matriz y qué contesta entonces la última comparación.',
      solution:
        'La tercera línea está mal. El determinante exacto es $0{,}3\\cdot 0{,}3-0{,}1\\cdot 0{,}9=0$, pero NumPy devuelve algo como `-1.2e-17`, y `det_A == 0` da `False`: la matriz aplasta el plano y el código dice que no. Hay que comparar con tolerancia, por ejemplo `aplasta = np.isclose(det_A, 0)`.',
      lines: [
        'A = np.array([[0.3, 0.1], [0.9, 0.3]])',
        'det_A = np.linalg.det(A)',
        'aplasta = det_A == 0',
      ],
      faultyLine: 2,
    },
    {
      id: 'determinante.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula el área de un paralelogramo a partir de sus lados. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Calcula tú el determinante y comprueba la segunda línea.',
        'Pregúntate qué valores puede tomar un área y cuáles un determinante.',
      ],
      explain:
        'El determinante mide el área y además lleva un signo. Revisa si cada paso respeta lo que puede ser un área.',
      solution:
        'La tercera línea está mal. El determinante $-5$ es correcto, pero el área es su valor absoluto, $5$: un área nunca es negativa. El signo solo dice que $\\vec{v}$ queda a la derecha de $\\vec{u}$, es decir, la orientación.',
      lines: [
        'Los lados del paralelogramo son u = (1, 2) y v = (3, 1), y van en las columnas de A',
        'det A = 1 · 1 − 3 · 2 = −5',
        'Luego el área del paralelogramo es −5',
      ],
      faultyLine: 2,
    },
    {
      id: 'determinante.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento habla de dos capas lineales de $2\\times 2$ seguidas, $W_1$ y luego $W_2$, sin activación en medio. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Para cada capa, el valor absoluto del determinante es el factor de área y el signo es la orientación.',
        'Comprueba cómo se combinan los determinantes de dos transformaciones seguidas.',
      ],
      explain:
        'Revisa cada paso con la regla del determinante de un producto: los factores de área se multiplican y los signos se componen. No hace falta calcular el producto de las matrices.',
      solution:
        'No hay ningún error. Con $\\det W_1=3$ y $\\det W_2=-2$, las áreas se multiplican por $3$ y por $2$ en cada paso, y $W_2$ voltea la orientación. Juntas, $\\det(W_2W_1)=3\\cdot(-2)=-6$: el área se multiplica por $6$ y la orientación queda volteada.',
      lines: [
        'det W₁ = 3 y det W₂ = −2: W₁ multiplica las áreas por 3, y W₂ por 2 y voltea la orientación',
        'Aplicadas una tras otra, las áreas se multiplican por 3 · 2 = 6',
        'Luego det(W₂W₁) = 3 · (−2) = −6: el área se multiplica por 6 y la orientación queda volteada',
      ],
      faultyLine: null,
    },
  ],
};
