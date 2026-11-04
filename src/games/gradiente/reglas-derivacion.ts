import type { GraphSpec, Project } from '../../content/schema';
import { py } from '../py';
import { reglasDerivacionWarmup } from './reglas-derivacion.calentamiento';

/** La pérdida de un solo dato, x = 2 e y = 3: L(w) = (2w − 3)². */
const ONE_DATUM: [number, number][] = [[2, 3]];

/** Plano de la pérdida de un dato: de w = −0,5 a 3,5 (en ambos extremos vale 16). */
const LOSS_WINDOW = { x: [-0.5, 3.5], y: [-1, 17] } satisfies Pick<GraphSpec, 'x' | 'y'>;

const poly = (coefs: number[]) => ({ kind: 'poly' as const, coefs });

/** Cuarto proyecto del juego 3, segundo de la Órbita 0: las reglas de derivación. */
export const reglasDerivacion: Project = {
  id: 'reglas-derivacion',
  name: 'Reglas de derivación',
  sub: 'Derivar sin límites',
  bigPicture: {
    parts: ['gradient'],
    text: 'Una red no mide la pendiente de su pérdida probando pesos: la calcula con fórmulas, derivando con las reglas de la potencia, la suma y el producto, y encadenándolas capa a capa (eso es la retropropagación). Aquí aprendes las reglas sobre polinomios y las aplicas a la pérdida de un modelo de un solo peso.',
  },
  warmup: reglasDerivacionWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'reglas-derivacion.ex00.1',
          type: 'curva',
          prompt:
            "La curva continua es $f(x)=x^2$ y la discontinua, su derivada, $f'(x)=2x$. Mueve P hasta que la pendiente de $f$ valga $3$ y mira la altura de la discontinua en esa $x$.",
          hints: [
            "La pendiente se lee en el panel. Con $f'(x)=2x$, ¿para qué $x$ sale $3$?",
            'Si $2x=3$, entonces $x=\\dfrac{3}{2}$.',
          ],
          explain:
            "La derivada es una función: su altura en cada $x$ es la pendiente de $f$ ahí. Con la regla de la potencia, $(x^2)'=2x$.",
          solution:
            'P en $x=1{,}5$: la pendiente de $f$ es $2\\cdot 1{,}5=3$ y la curva discontinua pasa por $3$ en esa $x$.',
          purpose: {
            why: 'Al entrenar, una red necesita la derivada de su pérdida respecto a cada peso, y la obtiene con reglas, no midiendo. La más usada es la de la potencia: $x^2$ se deriva en $2x$.',
            aim: 'Mueves P por la curva y ves a la vez su pendiente y la altura de la curva discontinua, que es la derivada.',
            takeaway:
              'La altura de la derivada en una $x$ es la pendiente de $f$ en esa $x$. Una fórmula de derivada da la pendiente en todos los puntos de golpe.',
          },
          graph: {
            x: [-3, 3],
            y: [-7, 10],
            snap: 0.1,
            curve: poly([0, 0, 1]),
            points: [{ id: 'p', label: 'P', x: -1, movable: true, onCurve: true }],
            readouts: ['coords', 'slope'],
            derivative: true,
          },
          goals: [{ metric: 'slope', of: ['p'], target: 3, tol: 0.05 }],
        },
        {
          id: 'reglas-derivacion.ex00.2',
          type: 'curva',
          prompt:
            "Ahora $f(x)=3x^2$ y su derivada es $f'(x)=6x$. Mueve P hasta que la pendiente valga $3$, como antes. ¿Cae en la misma $x$?",
          hints: [
            "Con $f'(x)=6x$, ¿para qué $x$ sale $3$?",
            'Si $6x=3$, entonces $x=\\dfrac{1}{2}$.',
          ],
          explain:
            "Multiplicar la función por una constante multiplica su derivada por la misma constante: $(3x^2)'=3\\cdot 2x$. La curva es más empinada, así que basta una $x$ menor.",
          solution:
            'P en $x=0{,}5$: $6\\cdot 0{,}5=3$. Con $f=x^2$ hacía falta $x=1{,}5$: la constante $3$ triplica la pendiente en cada punto.',
          purpose: {
            why: 'Los pesos de una red se multiplican por constantes (la entrada, la escala, la tasa de aprendizaje) y esas constantes salen de la derivada como factores.',
            aim: 'Buscas la misma pendiente en una curva tres veces más empinada y ves dónde cae ahora.',
            takeaway:
              'Una constante que multiplica a la función multiplica a su derivada. En una pérdida, escalar los datos escala el gradiente.',
          },
          graph: {
            x: [-2, 2],
            y: [-12, 12],
            snap: 0.1,
            curve: poly([0, 0, 3]),
            points: [{ id: 'p', label: 'P', x: -1, movable: true, onCurve: true }],
            readouts: ['coords', 'slope'],
            derivative: true,
          },
          goals: [{ metric: 'slope', of: ['p'], target: 3, tol: 0.05 }],
        },
        {
          id: 'reglas-derivacion.ex00.3',
          type: 'curva',
          prompt:
            "Ahora $f(x)=x^2+2x$. La derivada de una suma es la suma de las derivadas: $f'(x)=2x+2$. Mueve P hasta que la tangente sea **horizontal**, de pendiente $0$.",
          hints: [
            'Una tangente horizontal no sube ni baja: su pendiente es $0$.',
            'Resuelve $2x+2=0$ y mira dónde corta la curva discontinua el eje horizontal.',
          ],
          explain:
            "La derivada de la suma es la suma de las derivadas: $(x^2)'+(2x)'=2x+2$. Se anula donde la curva discontinua toca el eje horizontal.",
          solution:
            'P en $x=-1$: $2\\cdot(-1)+2=0$. Es el fondo de la curva: a un lado la pendiente es negativa y al otro, positiva.',
          purpose: {
            why: 'Una pérdida es una suma de términos (un error por cada dato, más penalizaciones), y se deriva término a término. Donde la suma de pendientes es $0$, el entrenamiento se detiene.',
            aim: 'Buscas el punto de una suma de dos términos donde la tangente es horizontal y lo ves en la derivada.',
            takeaway:
              'La derivada de una suma es la suma de derivadas. Donde la derivada corta el eje, la curva tiene su fondo: allí la pérdida deja de bajar.',
          },
          graph: {
            x: [-4, 2],
            y: [-7, 9],
            snap: 0.5,
            curve: poly([0, 2, 1]),
            points: [{ id: 'p', label: 'P', x: 1, movable: true, onCurve: true }],
            readouts: ['coords', 'slope'],
            derivative: true,
          },
          goals: [{ metric: 'slope', of: ['p'], target: 0, tol: 0.01 }],
        },
        {
          id: 'reglas-derivacion.ex00.4',
          type: 'curva',
          prompt:
            "En $f(x)=x^3$ la derivada es $f'(x)=3x^2$. Coloca A y B de modo que la tangente tenga pendiente $3$ en los dos: A a la derecha del origen y B a la izquierda.",
          hints: [
            'Resuelve $3x^2=3$: hay dos soluciones, una positiva y otra negativa.',
            'La derivada $3x^2$ no distingue el signo de $x$: da lo mismo en $1$ y en $-1$.',
          ],
          explain:
            'La derivada $3x^2$ vale lo mismo en $x$ y en $-x$: la curva es igual de empinada a los dos lados del origen, aunque en uno suba y en el otro, también.',
          solution:
            'A en $x=1$ y B en $x=-1$: $3\\cdot 1^2=3$ y $3\\cdot(-1)^2=3$. Las dos tangentes son paralelas, con pendiente $3$.',
          purpose: {
            why: 'Una misma pendiente no identifica un punto: puntos distintos de la pérdida pueden dar el mismo gradiente y el entrenamiento no distingue cuál es cuál.',
            aim: 'Colocas dos puntos con la misma pendiente en una cúbica y ves que las dos tangentes son paralelas.',
            takeaway:
              'La pendiente dice cuánto cambia la función, no dónde estás. Dos puntos distintos pueden tener la misma derivada.',
          },
          graph: {
            x: [-2, 2],
            y: [-9, 9],
            snap: 0.1,
            curve: poly([0, 0, 0, 1]),
            points: [
              { id: 'a', label: 'A', x: 0.5, movable: true, onCurve: true },
              { id: 'b', label: 'B', x: -0.5, movable: true, onCurve: true },
            ],
            readouts: ['coords', 'slope'],
            derivative: true,
          },
          goals: [
            { metric: 'slope', of: ['a'], target: 3, tol: 0.05 },
            { metric: 'slope', of: ['b'], target: 3, tol: 0.05 },
            { metric: 'fx', of: ['a'], target: 1, tol: 0.05 },
            { metric: 'fx', of: ['b'], target: -1, tol: 0.05 },
          ],
        },
        {
          id: 'reglas-derivacion.ex00.5',
          type: 'curva',
          prompt:
            "Es $f(x)=x^2$ y T está en $x=1$. Mueve A y B, que son libres, hasta que la recta que pasa por ellos sea la **tangente** a $f$ en T: su pendiente es $f'(1)$ y pasa por T.",
          hints: [
            "Primero la pendiente: $f'(1)=2\\cdot 1$. Después, que la recta pase por $T=(1,\\,1)$.",
            'La recta sube $2$ por cada paso a la derecha y en $x=1$ vale $1$: ¿cuánto vale en $x=0$?',
          ],
          explain:
            "La tangente en T es la recta de pendiente $f'(1)$ que pasa por T. Dos puntos cualesquiera de esa recta sirven.",
          solution:
            "A en $(0,\\,-1)$ y B en $(2,\\,3)$: pendiente $2=f'(1)$, y la recta pasa por $T=(1,\\,1)$ porque $2\\cdot1-1=1$. Su ordenada en el origen es $-1$.",
          purpose: {
            why: 'Un gradiente es la pendiente de la mejor recta que imita a la pérdida cerca del peso actual. El paso de entrenamiento se decide sobre esa recta.',
            aim: "Construyes con dos puntos la recta de pendiente $f'(1)$ que toca la curva en T, y la ves rozarla.",
            takeaway:
              'La derivada y la recta se juntan: la tangente es la recta con la pendiente de la derivada que pasa por el punto. Aproxima la curva cerca de T.',
          },
          graph: {
            x: [-2, 3],
            y: [-4, 9],
            snap: 1,
            curve: poly([0, 0, 1]),
            points: [
              { id: 't', label: 'T', x: 1, movable: false, onCurve: true },
              { id: 'a', label: 'A', x: -1, y: 0, movable: true },
              { id: 'b', label: 'B', x: 2, y: 0, movable: true },
            ],
            readouts: ['line'],
            pair: ['a', 'b'],
          },
          goals: [
            { metric: 'line_slope', of: ['a', 'b'], target: 2, tol: 0.01 },
            { metric: 'line_icpt', of: ['a', 'b'], target: -1, tol: 0.01 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'reglas-derivacion.ex01.1',
          type: 'numero',
          prompt:
            "Mira la tangente en P. La función es $f(x)=x^3-4x+1$ y P está en $x=2$. Deriva con la regla de la potencia: ¿cuánto vale la pendiente, $f'(2)$?",
          hints: [
            'Deriva cada término: $x^3$ pasa a $3x^2$, $-4x$ pasa a $-4$ y la constante $1$ desaparece.',
            "Con $f'(x)=3x^2-4$, sustituye $x=2$.",
          ],
          explain:
            "Regla de la potencia en cada término: $(x^n)'=n\\,x^{n-1}$. La constante se va y la suma se deriva término a término.",
          solution:
            "$f'(x)=3x^2-4$, así que $f'(2)=3\\cdot 4-4=8$. La tangente sube $8$ por cada paso a la derecha: es muy empinada.",
          purpose: {
            why: 'Para saber cuánto pesa cada parámetro en el error, una red deriva su pérdida con las reglas de la potencia, la constante y la suma. Aquí lo haces con un polinomio.',
            aim: 'Derivas término a término, evalúas en el punto y lo comparas con la inclinación de la tangente que ves.',
            takeaway:
              "La derivada es una fórmula nueva, $f'(x)=3x^2-4$, y evaluarla da la pendiente exacta donde la tangente solo se intuye.",
          },
          answer: 8,
          tol: 0,
          graph: {
            x: [-3, 3],
            y: [-15, 17],
            snap: 1,
            curve: poly([1, -4, 0, 1]),
            points: [{ id: 'p', label: 'P', x: 2, movable: false, onCurve: true }],
            readouts: ['coords'],
            tangent: true,
          },
        },
        {
          id: 'reglas-derivacion.ex01.2',
          type: 'vector',
          prompt:
            "Los coeficientes de $f(x)=1+2x-3x^2+x^3$ son $(1,\\,2,\\,-3,\\,1)$. Escribe los de su derivada $f'$, del término independiente al de mayor grado.",
          hints: [
            'Cada término $a\\,x^k$ pasa a $k\\,a\\,x^{k-1}$, y la constante se va: la derivada tiene un coeficiente menos.',
            'El de $x^2$: $-3\\cdot 2$. El de $x^3$: $1\\cdot 3$.',
          ],
          explain:
            'Se baja cada exponente y se multiplica: $k\\,a\\,x^{k-1}$. La constante desaparece y el resto de coeficientes se desplaza un lugar.',
          solution:
            "$f'(x)=2-6x+3x^2$, es decir, $(2,\\,-6,\\,3)$. Si pones $0$ delante, has dejado el término independiente sin quitar.",
          purpose: {
            why: 'Con la derivada como lista de coeficientes se puede evaluar en cualquier punto sin límites ni cuentas largas: es lo que programarás en el siguiente ejercicio.',
            aim: 'Aplicas la regla de la potencia a todos los términos a la vez y escribes los coeficientes del resultado.',
            takeaway:
              'Derivar un polinomio es multiplicar cada coeficiente por su exponente y correr los lugares: una operación sobre arrays, sin bucles.',
          },
          answer: [2, -6, 3],
          tol: 0,
        },
        {
          id: 'reglas-derivacion.ex01.3',
          type: 'numero',
          prompt:
            "Mira la tangente en P. $f(x)=(x+1)(x^2-2)$ y P está en $x=2$. Con la regla del producto, $(g\\,h)'=g'h+g\\,h'$, ¿cuánto vale $f'(2)$?",
          hints: [
            "Toma $g=x+1$ y $h=x^2-2$. Calcula $g$, $g'$, $h$ y $h'$ en $x=2$.",
            "No basta con multiplicar las derivadas: $g'h'$ no es la derivada del producto.",
          ],
          explain:
            "La derivada de un producto no es el producto de las derivadas: es $g'h+g\\,h'$, cada factor derivado por turno y el otro tal cual.",
          solution:
            "En $x=2$: $g=3$, $g'=1$, $h=2$, $h'=4$. Entonces $f'(2)=1\\cdot 2+3\\cdot 4=14$. Con $g'h'$ saldría $4$, y no es.",
          purpose: {
            why: 'Una red multiplica cosas todo el rato (pesos por entradas, entradas por pesos), y la regla del producto es la base de cómo viaja el error hacia atrás por esas multiplicaciones.',
            aim: 'Derivas un producto con la regla y comparas con la inclinación de la tangente que ves.',
            takeaway:
              'Cuando dos cosas que cambian se multiplican, cada una aporta su cambio al total. Es la mitad de la retropropagación.',
          },
          answer: 14,
          tol: 0,
          graph: {
            x: [-2, 2.5],
            y: [-4, 16],
            snap: 0.5,
            curve: poly([-2, -2, 1, 1]),
            points: [{ id: 'p', label: 'P', x: 2, movable: false, onCurve: true }],
            readouts: ['coords'],
            tangent: true,
          },
        },
        {
          id: 'reglas-derivacion.ex01.4',
          type: 'numero',
          prompt:
            "La figura es la pérdida de un solo dato, $x=2$ e $y=3$: $L(w)=(2w-3)^2$. Desarrolla el cuadrado y deriva. ¿Cuánto vale $L'(1)$, la pendiente en P ($w=1$)?",
          hints: [
            'Desarrolla: $(2w-3)^2=4w^2-12w+9$. Después, la regla de la potencia en cada término.',
            "Con $L'(w)=8w-12$, sustituye $w=1$.",
          ],
          explain:
            'Una pérdida de un dato es un polinomio en $w$: se desarrolla y se deriva con las reglas de siempre.',
          solution:
            "$L(w)=4w^2-12w+9$, $L'(w)=8w-12$ y $L'(1)=-4$. Es negativa: la pérdida baja al aumentar $w$, así que el paso de descenso sube $w$.",
          purpose: {
            why: 'Es el gradiente de verdad: lo que una red calcula, para cada peso, antes de moverlo. Con un dato y un peso cabe en una línea.',
            aim: 'Obtienes la fórmula del gradiente de la pérdida de un modelo $\\hat y=w\\,x$ con un solo dato y la evalúas en un peso.',
            takeaway:
              'La pendiente de la pérdida en $w=1$ es $-4$: negativa, así que $w$ debe crecer. El signo del gradiente dice el sentido del paso.',
          },
          answer: -4,
          tol: 0,
          graph: {
            ...LOSS_WINDOW,
            snap: 0.1,
            curve: { kind: 'mse', data: ONE_DATUM },
            points: [{ id: 'p', label: 'P', x: 1, movable: false, onCurve: true }],
            readouts: ['coords'],
            labels: { x: 'w', y: 'pérdida' },
            tangent: true,
          },
        },
        {
          id: 'reglas-derivacion.ex01.5',
          type: 'opcion',
          prompt:
            'La regla de la potencia da la derivada de $x^n$. Pruébala con $n=2$: la derivada de $x^2$ es $2x$. ¿Cuál es la regla?',
          hints: [
            'Con $n=2$ tiene que salir $2x$: descarta lo que no dé eso.',
            'El exponente baja a multiplicar y el exponente nuevo es uno menos.',
          ],
          explain:
            'El exponente $n$ baja como factor y el exponente se reduce en uno. Con $n=2$ da $2x^1=2x$.',
          solution:
            "$(x^n)'=n\\,x^{n-1}$. Con $n=2$: $2x$. Las otras opciones dan $x$, $x^2$ o $2x^2$ con $n=2$, y ninguna es la derivada de $x^2$.",
          purpose: {
            why: 'Casi toda derivada de una pérdida polinómica sale de esta regla, aplicada a cada peso.',
            aim: 'Compruebas cuatro fórmulas con un caso que conoces y te quedas con la que no falla.',
            takeaway:
              'Una regla general se prueba con un caso conocido: si falla en uno, no es la regla.',
          },
          options: ['$x^{n-1}$', '$(n-1)\\,x^{n}$', '$n\\,x^{n-1}$', '$n\\,x^{n}$'],
          correct: 2,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'reglas-derivacion.ex02.1',
          type: 'codigo',
          prompt:
            'Un polinomio se guarda como un array de coeficientes, del término independiente al de mayor grado: `[5, -4, 3]` es $5-4x+3x^2$. Escribe `evaluar(coefs, x)`: devuelve el valor del polinomio en `x`, sin bucles. Se prueba con varios polinomios y varios `x`.',
          hints: [
            'El plan son dos líneas. `exps`: los exponentes de los términos, con `np.arange`. Después, `return` de la suma de `coefs * x ** exps`: NumPy calcula así todos los términos a la vez. Un error típico: olvidar que el primer término lleva exponente $0$.',
            'Las piezas, con otro polinomio:\n\n' +
              py(
                'c = np.array([1, 2, 5])',
                'print(np.arange(len(c)))             # [0 1 2]: un exponente por término',
                'print(c * 3 ** np.arange(len(c)))    # [ 1  6 45]: cada término en x = 3',
                'print(np.sum([1, 6, 45]))            # 52: la suma de los términos',
              ),
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def evaluar(coefs, x):',
                '    exps = np.___(len(coefs))',
                '    return np.___(coefs * x ___ exps)',
              ) +
              '\n\nEl primer hueco da los exponentes; el segundo suma; el tercero eleva a una potencia.',
          ],
          explain:
            'El coeficiente de índice $k$ multiplica a $x^k$, así que el índice es el exponente. Con `np.arange` se tienen todos a la vez y NumPy opera elemento a elemento.',
          solution:
            'Con `exps = np.arange(len(coefs))`, cada término es `coefs * x ** exps` y la suma da el valor. Para `[5, -4, 3]` en $x=2$: $5-8+12=9$.',
          requirements: [
            '`evaluar` es una función que recibe un array de coeficientes y un número `x`, y devuelve un número.',
            'Se llama con polinomios de distinto grado (también de un solo coeficiente) y con valores de `x` positivos y negativos; no debe dar error.',
            'El número es la suma de todos los términos, con el exponente $0$ en el primero.',
          ],
          starter: `import numpy as np


# Aquí no hay datos hechos: la función recibe sus coeficientes y su punto. Las comprobaciones la llaman
# con varios polinomios.

def evaluar(coefs, x):
    # coefs es un array de NumPy: coefs[0] es el término independiente, coefs[1] el de x, coefs[2] el de x al cuadrado...
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría).

    # PASO 1. exps: el exponente de cada término, de 0 en adelante.
    # Por qué: el coeficiente de índice k acompaña a x elevado a k, así que el índice ya es el exponente.
    # Cómo: np.arange(n) da los números 0, 1, ..., n - 1, y len(coefs) es el número de términos.
    # Ejemplo: np.arange(4) es [0 1 2 3].
    exps = None

    # PASO 2. Devolver la suma de todos los términos, con return.
    # Cada término es el coeficiente por x elevado a su exponente, y NumPy lo hace con todos a la vez:
    # coefs * x ** exps. Con np.sum(...) se suman.
    # Con otros datos, [1, 2] en x = 3: 1 · 3^0 + 2 · 3^1 = 7.
    return None

# Para probarla antes de entregar: imprime evaluar(np.array([1, 2]), 3) con print(...) y pulsa «Ejecutar».
`,
          checks: `import numbers
_casos = [([5, -4, 3], 2, 9), ([1, 0, 0, 2], 3, 55), ([7], 5, 7), ([0, 1], -4, -4), ([2, -1, 0, 1], -2, -4)]
_f = callable(globals().get("evaluar"))
def _try(c, x):
    try:
        return evaluar(np.array(c), x)
    except Exception:
        return None
_got = [_try(c, x) for c, x, _e in _casos] if _f else []
_run = _f and all(g is not None for g in _got)
_num = _run and all(isinstance(g, (numbers.Real, np.number)) and not isinstance(g, (bool, np.bool_)) and g == g for g in _got)
_ok = _num and all(abs(g - e) < 1e-9 for g, (_c, _x, e) in zip(_got, _casos))
_shift = _num and (not _ok) and all(abs(g - e * x) < 1e-9 for g, (_c, x, e) in zip(_got, _casos))
_rev = _num and (not _ok) and all(abs(g - float(np.polyval(c, x))) < 1e-9 for g, (c, x, _e) in zip(_got, _casos))
check(_f, "Hay que definir una función \`evaluar\` que reciba los coeficientes y \`x\`.")
check((not _f) or _run, "\`evaluar\` da un error con algún polinomio, o devuelve \`None\`. Tiene que terminar con \`return\` y el valor.")
check((not _run) or _num, "\`evaluar\` tiene que devolver un número: la suma de los términos.")
check((not _num) or not _shift, "\`evaluar\` sale multiplicado por \`x\`: el primer término tiene exponente 0, no 1. Los exponentes empiezan en 0, como los índices.")
check((not _num) or not _rev, "\`evaluar\` toma los coeficientes al revés: aquí el primero es el término independiente y el último, el de mayor grado.")
check((not _num) or _ok or _shift or _rev, "\`evaluar\` no da el valor del polinomio. Cada término es el coeficiente por \`x\` elevado a su índice, y el resultado es la suma de todos.")
`,
          reference:
            'import numpy as np\n\n\ndef evaluar(coefs, x):\n    exps = np.arange(len(coefs))\n    return np.sum(coefs * x ** exps)\n',
        },
        {
          id: 'reglas-derivacion.ex02.2',
          type: 'codigo',
          prompt:
            'Escribe `derivar(coefs)`: recibe un polinomio como array de coeficientes (del término independiente al de mayor grado) y devuelve los coeficientes de su derivada, con la regla de la potencia y sin bucles. La derivada de $5-4x+3x^2$, `[5, -4, 3]`, es $-4+6x$: `[-4, 6]`.',
          hints: [
            'El plan son dos líneas. `exps`: los exponentes de los términos que quedan al derivar, que empiezan en $1$. Después, `return` de los coeficientes sin el primero, cada uno por su exponente. Un error típico: no quitar el término independiente, que se queda con un $0$ delante.',
            'Las piezas, con otro polinomio:\n\n' +
              py(
                'c = np.array([5, -4, 3])',
                'print(c[1:])                       # [-4  3]: sin el término independiente, que se va al derivar',
                'print(np.arange(1, len(c)))        # [1 2]: el exponente de cada término que queda',
                'print(c[1:] * np.arange(1, len(c)))   # [-4  6]: cada coeficiente por su exponente',
              ),
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def derivar(coefs):',
                '    exps = np.arange(___, len(coefs))',
                '    return coefs[___:] * exps',
              ) +
              '\n\nLos dos huecos son el mismo número: dónde empiezan los exponentes y el primer coeficiente que se queda.',
          ],
          explain:
            'La regla de la potencia baja cada exponente como factor: el término $a\\,x^k$ pasa a $k\\,a\\,x^{k-1}$. El independiente se va, y el resto se corre un lugar.',
          solution:
            'Se quita el primer coeficiente con `coefs[1:]` y se multiplica por los exponentes `np.arange(1, len(coefs))`. Para `[5, -4, 3]` sale `[-4, 6]`. Si no quitas el primero, queda un $0$ delante y todos los términos se corren.',
          requirements: [
            '`derivar` es una función que recibe un array de coeficientes y devuelve un array de NumPy con los coeficientes de la derivada.',
            'Se llama con polinomios de distinto grado, también de un solo coeficiente (constante): no debe dar error.',
            'El resultado tiene un coeficiente menos que el original, y cada uno es el coeficiente de $x^k$ por $k$.',
          ],
          starter: `import numpy as np


# Aquí no hay datos hechos: la función recibe sus coeficientes. Las comprobaciones la llaman con
# varios polinomios, también con una constante.

def derivar(coefs):
    # coefs es un array de NumPy: coefs[0] es el término independiente, coefs[1] el de x, coefs[2] el de x al cuadrado...
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría).

    # PASO 1. exps: el exponente de cada término que sobrevive.
    # Por qué: el término independiente desaparece al derivar, y los demás se multiplican por su exponente:
    # a · x^k pasa a (k · a) · x^(k - 1). El primer exponente que cuenta es 1.
    # Cómo: np.arange(1, n) da 1, 2, ..., n - 1. Con n = len(coefs) hay uno por cada término que queda.
    # Ejemplo: np.arange(1, 4) es [1 2 3].
    exps = None

    # PASO 2. Devolver los coeficientes de la derivada, con return.
    # Se quita el primer coeficiente con coefs[1:] (desde el segundo hasta el final) y se multiplica, elemento a
    # elemento, por exps. Con otros datos, [2, 7, 5] pasa a [7, 5] y [7, 5] * [1 2] da [7 10].
    return None

# Para probarla antes de entregar: imprime derivar(np.array([2, 7, 5])) con print(...) y pulsa «Ejecutar».
`,
          checks: `import numbers
_casos = [([5, -4, 3], [-4, 6]), ([0, 0, 0, 1], [0, 0, 3]), ([2, 1], [1]), ([1, 2, 3, 4, 5], [2, 6, 12, 20]), ([7], [])]
_f = callable(globals().get("derivar"))
def _try(c):
    try:
        return np.asarray(derivar(np.array(c)), dtype=float)
    except Exception:
        return None
_got = [_try(c) for c, _e in _casos] if _f else []
_run = _f and all(g is not None for g in _got)
_shape = _run and all(g.ndim == 1 for g in _got)
_len = _shape and all(len(g) == len(c) - 1 for g, (c, _e) in zip(_got, _casos))
_ok = _len and all(np.allclose(g, e) for g, (_c, e) in zip(_got, _casos))
_zero = _shape and (not _ok) and all(len(g) == len(c) and np.allclose(g, np.arange(len(c)) * np.array(c)) for g, (c, _e) in zip(_got, _casos))
check(_f, "Hay que definir una función \`derivar\` que reciba los coeficientes.")
check((not _f) or _run, "\`derivar\` da un error con algún polinomio, o devuelve \`None\`. Tiene que terminar con \`return\` y los coeficientes de la derivada.")
check((not _run) or _shape, "\`derivar\` tiene que devolver un array de una dimensión con los coeficientes de la derivada.")
check((not _shape) or not _zero, "\`derivar\` deja un 0 delante: no has quitado el término independiente. Al derivar desaparece, y el resultado tiene un coeficiente menos.")
check((not _shape) or _zero or _len, "\`derivar\` tiene que devolver un coeficiente menos que el polinomio de entrada: el término independiente se va.")
check((not _len) or _ok, "\`derivar\` no multiplica bien cada coeficiente por su exponente: el que acompaña a x elevada a k pasa a valer k veces más.")
`,
          reference:
            'import numpy as np\n\n\ndef derivar(coefs):\n    exps = np.arange(1, len(coefs))\n    return coefs[1:] * exps\n',
        },
        {
          id: 'reglas-derivacion.ex02.3',
          type: 'codigo',
          prompt:
            'El polinomio es `c`, de $4+3x-2x^2+5x^3$, y la figura (ya hecha) dibuja $f$ y su derivada. NumPy tiene `np.polyder`, pero espera los coeficientes **al revés**. Guarda en `c_np` el polinomio en el orden de NumPy (mayor grado primero) y en `d_np` su derivada en nuestro orden.',
          hints: [
            'El plan son dos líneas. `c_np`: `c` dado la vuelta. `d_np`: la derivada de `c_np` con `np.polyder`, que sale también de mayor a menor grado, y por eso hay que darle la vuelta otra vez. Un error típico: olvidar la segunda vuelta.',
            'Las piezas, con otro polinomio:\n\n' +
              py(
                'a = np.array([2, 0, 7])                 # 2 + 7x²',
                'print(a[::-1])                          # [7 0 2]: de mayor a menor grado',
                'print(np.polyder(a[::-1]))              # [14  0]: la derivada, también de mayor a menor',
                'print(np.polyder(a[::-1])[::-1])        # [ 0 14]: otra vez de menor a mayor',
              ),
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('c_np = c[___]', 'd_np = np.polyder(c_np)[___]') +
              '\n\nLos dos huecos son la misma expresión: la que da la vuelta a un array.',
          ],
          explain:
            'NumPy ordena los polinomios del mayor grado al independiente, justo al revés que aquí. Se da la vuelta a la entrada y, como la derivada también sale de mayor a menor, a la salida.',
          solution:
            '`c_np = c[::-1]` es `[5, -2, 3, 4]`. `np.polyder(c_np)` da `[15, -4, 3]` y, dado la vuelta, `d_np` es `[3, -4, 15]`: $3-4x+15x^2$.',
          requirements: [
            '`c_np` es un array de NumPy con los 4 coeficientes de `c`, en el orden del mayor grado primero.',
            '`d_np` es un array de NumPy con los 3 coeficientes de la derivada de `c`, del término independiente al de mayor grado.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt

# c es el polinomio 4 + 3x - 2x² + 5x³, del término independiente al de mayor grado.
# Ya está hecho: no hace falta tocarlo.
c = np.array([4, 3, -2, 5])

# Ya está hecha: no hace falta tocarla. Dibuja f y su derivada (medida con np.gradient, sin fórmulas).
# Tu d_np de abajo tiene que ser la fórmula de la curva discontinua.
xx = np.linspace(-1.5, 1.5, 200)
f = np.polynomial.polynomial.polyval(xx, c)
plt.plot(xx, f, label="f")
plt.plot(xx, np.gradient(f, xx), "--", label="derivada")
plt.legend()
plt.title("f y su derivada")

# PASO 1. c_np: los coeficientes de c en el orden de NumPy.
# Por qué: np.polyder espera el coeficiente de mayor grado primero, y c lo tiene al final.
# Cómo: a[::-1] devuelve a dado la vuelta. Ejemplo: si a = [2, 0, 7], a[::-1] es [7 0 2].
c_np = None

# PASO 2. d_np: los coeficientes de la derivada, en nuestro orden (del independiente al de mayor grado).
# Qué: np.polyder(c_np) da la derivada, pero también de mayor a menor grado, y hay que darle la vuelta otra vez.
# Ejemplo: np.polyder([7, 0, 2]) es [14 0]; dado la vuelta, [0 14].
d_np = None

# Para ver qué vale algo antes de entregar: print(c_np) o print(d_np) y pulsa «Ejecutar».
`,
          checks: `_c = np.array([4, 3, -2, 5])
_cn = isinstance(c_np, np.ndarray) and c_np.shape == (4,) and np.issubdtype(c_np.dtype, np.number)
_dn = isinstance(d_np, np.ndarray) and d_np.shape == (3,) and np.issubdtype(d_np.dtype, np.number)
check(_cn, "\`c_np\` tiene que ser un array de NumPy con los 4 coeficientes de \`c\`.")
check((not _cn) or bool(np.allclose(c_np, _c[::-1])), "\`c_np\` tiene que ser \`c\` dado la vuelta: el coeficiente de mayor grado primero. Se hace con \`c[::-1]\`.")
check(_dn, "\`d_np\` tiene que ser un array de NumPy con 3 coeficientes: los de la derivada.")
check((not _dn) or not bool(np.allclose(d_np, np.polyder(_c))), "\`d_np\` sale de aplicar \`np.polyder\` a \`c\` sin darle la vuelta: NumPy ha tomado el último coeficiente como el de mayor grado.")
check((not _dn) or not bool(np.allclose(d_np, np.polyder(_c[::-1]))), "\`d_np\` está de mayor a menor grado: es la derivada correcta pero en el orden de NumPy. Dale la vuelta para que empiece por el término independiente.")
check((not _dn) or bool(np.allclose(d_np, [3, -4, 15])) or bool(np.allclose(d_np, np.polyder(_c))) or bool(np.allclose(d_np, [15, -4, 3])), "\`d_np\` no es la derivada de \`c\`. Los coeficientes tienen que ser 3, -4 y 15, en nuestro orden: sale de \`np.polyder\` con la entrada y la salida dadas la vuelta.")
`,
          reference:
            'import numpy as np\n\nc = np.array([4, 3, -2, 5])\nc_np = c[::-1]\nd_np = np.polyder(c_np)[::-1]\n',
        },
        {
          id: 'reglas-derivacion.ex02.4',
          type: 'codigo',
          prompt:
            'Datos `x` e `y`, y el peso `w` del modelo $\\hat y=w\\,x$. Guarda en `errores` el error de cada dato, $w\\,x_i-y_i$, y en `grad` la derivada de la pérdida respecto a $w$: la media de $2\\,x_i\\,(w\\,x_i-y_i)$. En la figura (ya hecha), tu `grad` es la pendiente de la tangente.',
          hints: [
            'El plan son dos líneas. `errores`: `w * x - y`, un error por dato. `grad`: la media de `2 * x * errores`; con `np.mean`. Un error típico: calcular la media de los errores al cuadrado, que es la pérdida, no su derivada.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'a = np.array([1, 2])',
                'b = np.array([4, 5])',
                'e = 1 * a - b                       # [-3 -3]: el error de cada dato con w = 1',
                'print(2 * a * e)                    # [ -6 -12]: dos por x por el error',
                'print(np.mean(2 * a * e))           # -9.0: la media, la derivada en w = 1',
              ),
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('errores = w * x ___ y', 'grad = np.___(2 * x * errores)') +
              '\n\nEl primer hueco es el signo de la operación; el segundo, la función que saca la media.',
          ],
          explain:
            'Cada dato aporta $2\\,x_i\\,(w\\,x_i-y_i)$ a la pendiente y la pérdida es la media de lo que aporta cada uno. Compara tu número con la tangente de la figura: tiene que cuadrar.',
          solution:
            'Con $w=1$ los errores valen $(-2,\\,-2,\\,-2)$ y `grad` es la media de $(-4,\\,-8,\\,-12)$, es decir, $-8$. La tangente baja con fuerza: hay que subir $w$.',
          requirements: [
            '`errores` es un array de NumPy con 3 números, uno por dato: lo que el modelo se equivoca con ese $w$.',
            '`grad` es un solo número: la media de los 3 términos $2\\,x_i\\,(w\\,x_i-y_i)$, con su signo.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt

# x es la entrada, y lo que se quiere predecir y w el peso que se prueba. Ya están hechos: no hace falta tocarlos.
x = np.array([1, 2, 3])
y = np.array([3, 4, 5])
w = 1

# Ya está hecha: no hace falta tocarla. Dibuja la pérdida y la tangente en w, medida con una diferencia
# numérica (sin fórmulas). Tu grad de abajo tiene que ser la pendiente de esa recta.
def perdida(v):
    return np.mean((v * x - y) ** 2)

h = 1e-4
pendiente = (perdida(w + h) - perdida(w - h)) / (2 * h)
ww = np.linspace(-0.5, 3.5, 100)
plt.plot(ww, [perdida(v) for v in ww])
plt.plot(ww, perdida(w) + pendiente * (ww - w), "--")
plt.plot([w], [perdida(w)], "o")
plt.ylim(0, 30)
plt.xlabel("w")
plt.ylabel("pérdida")

# PASO 1. errores: lo que se equivoca el modelo en cada dato.
# Qué: con el peso w la predicción es w * x; el error es esa predicción menos y. Sale un error por dato.
# Cómo: x e y son arrays, y NumPy opera elemento a elemento. Con otros datos, a = [1, 2] y b = [4, 5], w = 1:
# 1 * a - b da [-3 -3].
errores = None

# PASO 2. grad: la derivada de la pérdida respecto a w.
# Qué: la media de 2 * x * errores (cada dato aporta 2 · x · error). Es un solo número.
# Cómo: 2 * x * errores se hace elemento a elemento; np.mean(...) saca la media.
# Con a, b y w = 1: 2 * a * e da [-6 -12], y su media es -9.
grad = None

# Para ver qué vale algo antes de entregar: print(errores) o print(grad) y pulsa «Ejecutar».
`,
          checks: `_x = np.array([1, 2, 3])
_y = np.array([3, 4, 5])
_w = 1
_e = _w * _x - _y
_g = float(np.mean(2 * _x * _e))
try:
    _ea = np.asarray(errores, dtype=float)
except Exception:
    _ea = None
_ev = _ea is not None and _ea.shape == (3,)
_gv = isinstance(grad, (int, float, np.integer, np.floating)) and not isinstance(grad, (bool, np.bool_))
check(_ev, "\`errores\` tiene que ser un array de NumPy con 3 números: un error por cada dato.")
check((not _ev) or bool(np.allclose(_ea, _e)), "\`errores\` no son \`w * x - y\`: la predicción del modelo menos el valor real, en cada dato.")
check(_gv, "\`grad\` tiene que ser un solo número: la media de los términos \`2 * x * errores\`.")
check((not _gv) or abs(float(grad) - float(np.mean(_e ** 2))) > 1e-9, "\`grad\` es la pérdida, la media de los errores al cuadrado, no su derivada. La derivada de cada término es \`2 * x * error\`.")
check((not _gv) or abs(float(grad) + _g) > 1e-9, "\`grad\` tiene el signo cambiado: compara con la tangente de la figura. Con este \`w\` la pérdida baja al subir \`w\`, y la pendiente es negativa.")
check((not _gv) or abs(float(grad) - float(np.sum(2 * _x * _e))) > 1e-9, "\`grad\` es la suma de los términos y no su media: hay que dividir entre el número de datos, o usar \`np.mean\`.")
check((not _gv) or (abs(float(grad) - float(np.mean(2 * _e))) > 1e-9 and abs(float(grad) - float(np.mean(_x * _e))) > 1e-9), "\`grad\` está a medias: a cada término le falta un factor, el \`x\` del dato o el 2. La derivada de \`(w * x - y) ** 2\` respecto a \`w\` es \`2 * x * (w * x - y)\`.")
check((not _gv) or abs(float(grad) - _g) < 1e-9 or abs(float(grad) - float(np.mean(_e ** 2))) < 1e-9 or abs(float(grad) + _g) < 1e-9 or abs(float(grad) - float(np.sum(2 * _x * _e))) < 1e-9 or abs(float(grad) - float(np.mean(2 * _e))) < 1e-9 or abs(float(grad) - float(np.mean(_x * _e))) < 1e-9, "\`grad\` no es la media de \`2 * x * errores\`. Es la derivada de la pérdida respecto a \`w\`.")
`,
          reference:
            'import numpy as np\n\nx = np.array([1, 2, 3])\ny = np.array([3, 4, 5])\nw = 1\n\nerrores = w * x - y\ngrad = np.mean(2 * x * errores)\n',
        },
        {
          id: 'reglas-derivacion.ex02.5',
          type: 'codigo',
          prompt:
            'Los mismos datos, con una lista de pesos `ws`. La derivada numérica en cada uno (`numericas`) ya está hecha, y la figura dibuja la pérdida y esas pendientes. Guarda en `exactas` la derivada de la fórmula en cada $w$ de `ws` y en `error_max` lo que más se aparta de la numérica.',
          hints: [
            'El plan son dos líneas. `exactas`: para cada `w` de `ws`, la media de `2 * x * (w * x - y)`, con una lista por comprensión dentro de `np.array`. `error_max`: el mayor `|exactas - numericas|`, con `np.abs` y `np.max`.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'a = np.array([1, 2])',
                'b = np.array([4, 5])',
                'print([np.mean(2 * a * (w * a - b)) for w in [0, 1]])   # [-28.0, -9.0]: una derivada por peso',
                'print(np.abs(np.array([1.0, 3.0]) - np.array([1.5, 2.0])))   # [0.5 1. ]: distancias',
                'print(np.max([0.5, 1.0]))                                 # 1.0: la mayor',
              ),
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'exactas = np.array([np.mean(2 * x * (w * x - y)) for w in ___])',
                'error_max = np.___(np.abs(exactas - ___))',
              ) +
              '\n\nEl primer hueco, la lista de pesos; el segundo, la función del mayor; el tercero, las derivadas medidas.',
          ],
          explain:
            'Una derivada se comprueba contra la numérica: si la fórmula está bien, las dos coinciden salvo errores de redondeo. Es lo que se hace con el gradiente de una red antes de fiarse de él.',
          solution:
            'Las derivadas valen $-17{,}33$; $-8$; $1{,}33$; $10{,}67$ y $20$, para los pesos $0$ a $4$. La mayor diferencia con las numéricas es del orden de $10^{-11}$: la fórmula es correcta.',
          requirements: [
            '`exactas` es un array de NumPy con 5 números, uno por cada peso de `ws` y en su mismo orden.',
            '`error_max` es un solo número: la mayor distancia entre `exactas` y `numericas`, sin signo.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt

# Datos y pesos. Ya están hechos: no hace falta tocarlos.
x = np.array([1, 2, 3])
y = np.array([3, 4, 5])
ws = np.array([0, 1, 2, 3, 4])

# Ya está hecha: no hace falta tocarla. La derivada numérica de la pérdida en cada peso de ws.
def perdida(v):
    return np.mean((v * x - y) ** 2)

h = 1e-3
numericas = np.array([(perdida(v + h) - perdida(v - h)) / (2 * h) for v in ws])

# Ya está hecha: no hace falta tocarla. La pérdida y, en cada peso, la pendiente medida.
ww = np.linspace(0, 4, 100)
plt.plot(ww, [perdida(v) for v in ww], label="pérdida")
plt.plot(ws, numericas, "o--", label="pendiente medida")
plt.legend()
plt.xlabel("w")

# PASO 1. exactas: la derivada con la fórmula, en cada peso de ws.
# Qué: para cada w, la media de 2 * x * (w * x - y). Sale un array con 5 números.
# Cómo: una lista por comprensión repite la cuenta para cada w: [cuenta for w in ws], dentro de np.array.
# Con otros datos, a = [1, 2] y b = [4, 5], el peso 1 da la media de [-6 -12], que es -9.
exactas = None

# PASO 2. error_max: lo que más se aparta la fórmula de la medida.
# Qué: la mayor de las distancias |exactas - numericas|. Es un solo número.
# Cómo: np.abs(...) quita el signo y np.max(...) toma la mayor. Ejemplo: np.max(np.abs([1, -3])) es 3.
error_max = None

# Para ver qué vale algo antes de entregar: print(exactas) o print(error_max) y pulsa «Ejecutar».
`,
          checks: `_x = np.array([1, 2, 3])
_y = np.array([3, 4, 5])
_ws = np.array([0, 1, 2, 3, 4])
_ex = np.array([np.mean(2 * _x * (_w * _x - _y)) for _w in _ws])
try:
    _ea = np.asarray(exactas, dtype=float)
except Exception:
    _ea = None
_ev = _ea is not None and _ea.shape == (5,) and bool(np.all(np.isfinite(_ea)))
_eok = _ev and bool(np.allclose(_ea, _ex))
_m = isinstance(error_max, (int, float, np.integer, np.floating)) and not isinstance(error_max, (bool, np.bool_))
check(_ev, "\`exactas\` tiene que ser un array de NumPy con 5 números: una derivada por cada peso de \`ws\`.")
check((not _ev) or _eok or not bool(np.allclose(_ea, -_ex)), "\`exactas\` tiene el signo cambiado: la derivada de \`(w * x - y) ** 2\` es \`2 * x * (w * x - y)\`, y no al revés.")
check((not _ev) or _eok or bool(np.allclose(_ea, -_ex)), "\`exactas\` no es la media de \`2 * x * (w * x - y)\` para cada peso: cada dato aporta su \`x\` y la media se hace sobre los datos.")
check(_m, "\`error_max\` tiene que ser un solo número: la mayor distancia entre \`exactas\` y \`numericas\`.")
check((not _m) or (not _eok) or abs(float(error_max)) < 1e-6, "\`error_max\` tiene que salir casi 0: la fórmula y la derivada medida coinciden. Calcula \`np.max(np.abs(exactas - numericas))\`.")
`,
          reference:
            'import numpy as np\n\nx = np.array([1, 2, 3])\ny = np.array([3, 4, 5])\nws = np.array([0, 1, 2, 3, 4])\n\ndef perdida(v):\n    return np.mean((v * x - y) ** 2)\n\nh = 1e-3\nnumericas = np.array([(perdida(v + h) - perdida(v - h)) / (2 * h) for v in ws])\n\nexactas = np.array([np.mean(2 * x * (w * x - y)) for w in ws])\nerror_max = np.max(np.abs(exactas - numericas))\n',
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'reglas-derivacion.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere los coeficientes de la derivada de $5-4x+3x^2$, que son `[-4, 6]`. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Mira cuántos coeficientes tiene el resultado: la derivada de un polinomio de grado 2 es de grado 1.',
        'Comprueba si cada línea usa lo que la anterior prepara.',
      ],
      explain:
        'Al derivar desaparece el término independiente y los demás se corren un lugar. Revisa con ese hecho cada paso del código.',
      solution:
        'La tercera línea está mal. `coefs * exps` da `[0, -4, 6]`: deja el término independiente, multiplicado por $0$, y los demás quedan en el lugar equivocado. Hay que quitar el primero: `coefs[1:] * np.arange(1, len(coefs))`.',
      lines: [
        'coefs = np.array([5, -4, 3])',
        'exps = np.arange(len(coefs))',
        'derivada = coefs * exps',
      ],
      faultyLine: 2,
    },
    {
      id: 'reglas-derivacion.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento deriva $f(x)=x^2(x+1)$ en $x=1$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Repasa la regla del producto: ¿qué se multiplica con qué?',
        'Comprueba el resultado desarrollando $x^2(x+1)=x^3+x^2$ y derivando.',
      ],
      explain:
        'La derivada de un producto no es el producto de las derivadas. Revisa cada paso con la regla del producto.',
      solution:
        "La tercera línea está mal. La regla del producto es $f'=g'h+g\\,h'$, no $g'h'$. Con ella, $f'(1)=2\\cdot 2+1\\cdot 1=5$. Comprobación: $x^3+x^2$ se deriva en $3x^2+2x$, que en $x=1$ vale $5$.",
      lines: [
        'Sean g = x² y h = x + 1, así que f = g · h',
        "Sus derivadas son g' = 2x y h' = 1",
        "Luego f' = g' · h' = 2x, y en x = 1 vale 2",
      ],
      faultyLine: 2,
    },
    {
      id: 'reglas-derivacion.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento busca dónde la pendiente de $f(x)=3x^2-6x+5$ vale $0$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Deriva tú el polinomio término a término y compara con la segunda línea.',
        'Comprueba la tercera línea: ¿qué $x$ hace cero la derivada?',
      ],
      explain:
        'Se deriva con la regla de la potencia, se iguala a cero y se despeja. Revisa cada paso con esa receta.',
      solution:
        "No hay ningún error. $f'(x)=6x-6$, que vale $0$ en $x=1$, y $f(1)=2$. A la izquierda de $x=1$ la pendiente es negativa y a la derecha, positiva: es el fondo de la curva.",
      lines: [
        "La derivada se saca término a término: (3x²)' = 6x, (−6x)' = −6 y la constante 5 se va",
        "Luego f'(x) = 6x − 6",
        'Es 0 cuando 6x = 6, es decir, en x = 1',
      ],
      faultyLine: null,
    },
  ],
};
