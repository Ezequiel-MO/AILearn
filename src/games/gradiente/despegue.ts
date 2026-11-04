import type { GraphSpec, Question } from '../../content/schema';
import { py } from '../py';

/**
 * Los datos del hilo del juego: lo que tarda un modelo en responder (segundos, `y`) según la longitud
 * del prompt (cientos de tokens, `x`). Con ŷ = w·x, la pérdida es L(w) = 7,5·(w − 1,5)² + 0,375: el
 * mínimo cae en w = 1,5 (Σxy / Σxx = 45 / 30), una vez calculado con NumPy.
 */
const DATA: [number, number][] = [
  [1, 2],
  [2, 2],
  [3, 5],
  [4, 6],
];

/** La ventana de la pérdida: la parábola entera, de w = 0 a 3 (en ambos extremos vale 17,25). */
const LOSS_WINDOW = { x: [0, 3], y: [0, 18] } satisfies Pick<GraphSpec, 'x' | 'y'>;
const LOSS_LABELS = { x: 'w', y: 'pérdida' };

export const launch: Question[] = [
  {
    id: 'despegue.1',
    type: 'curva',
    prompt:
      'Dos puntos, A y B, fijan una recta. Su **pendiente** es lo que sube por cada paso a la derecha: la subida dividida entre el avance. Mueve B hasta que la recta suba $2$ por cada paso a la derecha.',
    hints: [
      'En el triángulo, el avance es lo que B se aleja de A hacia la derecha, y la subida, lo que sube.',
      'Con un avance de $1$, la subida tiene que ser $2$. Con un avance de $2$, ¿cuánto?',
    ],
    explain:
      'La pendiente es subida ÷ avance. Sirve cualquier B con el doble de subida que de avance: la recta es siempre la misma.',
    solution:
      'B en $(1, 3)$, $(2, 5)$ o $(3, 7)$: en todos la subida es el doble que el avance, y la pendiente es $2$.',
    purpose: {
      why: 'Un peso de una red dice cuánto cambia la salida por cada unidad que cambia la entrada: es una pendiente. Entender la de una recta es entender qué mide un peso.',
      aim: 'Mueves B y ves cómo cambian el avance, la subida y la pendiente de la recta que pasa por A y por B.',
      takeaway:
        'La pendiente es subida ÷ avance: cuánto cambia una cosa cuando cambia otra. Es la pieza con la que luego se decide cómo mover un peso.',
    },
    graph: {
      x: [-1, 5],
      y: [-1, 9],
      snap: 1,
      points: [
        { id: 'a', label: 'A', x: 0, y: 1, movable: false },
        { id: 'b', label: 'B', x: 1, y: 2, movable: true },
      ],
      readouts: ['line'],
      pair: ['a', 'b'],
    },
    goals: [{ metric: 'line_slope', of: ['a', 'b'], target: 2, tol: 0 }],
  },
  {
    id: 'despegue.2',
    type: 'numero',
    prompt:
      'La recta de la figura pasa por P y por Q. ¿Cuál es su pendiente? Una recta que **baja** tiene pendiente negativa.',
    hints: [
      'Lee las coordenadas de P y de Q y resta: lo que cambia la $y$ entre lo que cambia la $x$.',
      'Al ir a la derecha la recta baja, así que la subida sale negativa.',
    ],
    explain:
      'La pendiente es $(y_2-y_1)\\div(x_2-x_1)$, con los dos puntos en el mismo orden. Si la recta baja, sale negativa.',
    solution:
      'De P a Q el avance es $2$ y la subida, $-6$: la pendiente es $\\dfrac{-6}{2}=-3$. La recta baja $3$ por cada paso a la derecha.',
    answer: -3,
    tol: 0,
    graph: {
      x: [-1, 5],
      y: [-3, 12],
      snap: 1,
      curve: { kind: 'poly', coefs: [9, -3] },
      points: [
        { id: 'p', label: 'P', x: 1, movable: false, onCurve: true },
        { id: 'q', label: 'Q', x: 3, movable: false, onCurve: true },
      ],
      readouts: ['coords'],
    },
  },
  {
    id: 'despegue.3',
    type: 'numero',
    prompt:
      'La figura es la pérdida de un entrenamiento, paso a paso. Entre el paso $0$ (P) y el paso $4$ (Q), ¿cuánto baja la pérdida **por paso**, de media?',
    hints: [
      'Lee la pérdida en P y en Q y calcula cuánto ha bajado en total.',
      'Reparte esa bajada entre los pasos que hay de P a Q.',
    ],
    explain:
      'La tasa de cambio media es lo que cambia la pérdida dividido entre lo que cambia el paso. La curva no es recta, pero la media entre dos puntos sí tiene sentido.',
    solution:
      'La pérdida pasa de $9$ a $1$: baja $8$ en $4$ pasos, $8\\div4=2$ por paso. En pendiente, la recta de P a Q vale $-2$.',
    answer: 2,
    tol: 0,
    graph: {
      x: [-1, 7],
      y: [-1, 10],
      snap: 1,
      curve: { kind: 'poly', coefs: [9, -3, 0.25] },
      points: [
        { id: 'p', label: 'P', x: 0, movable: false, onCurve: true },
        { id: 'q', label: 'Q', x: 4, movable: false, onCurve: true },
      ],
      readouts: ['coords'],
      labels: { x: 'paso', y: 'pérdida' },
    },
  },
  {
    id: 'despegue.4',
    type: 'curva',
    prompt:
      'Un modelo predice cuánto tarda en responder (en segundos) según la longitud del prompt (en cientos de tokens): $\\hat y=w\\cdot x$. Los puntos son los datos, la recta es el modelo y los cuadrados son sus errores. Mueve $w$ por la curva hasta que la pérdida sea **la menor posible**.',
    hints: [
      'Mira cómo encogen los cuadrados cuando la recta se acerca a los puntos.',
      'La pérdida es el área media de los cuadrados: busca el fondo del valle de la curva.',
    ],
    explain:
      'Cada $w$ da una recta y una pérdida. En el fondo del valle la pérdida es mínima y la tangente es horizontal: la pendiente vale $0$.',
    solution:
      'El mínimo está en $w=1{,}5$, con una pérdida de $0{,}375$: la recta pasa lo más cerca posible de los datos. A los dos lados la pérdida sube.',
    purpose: {
      why: 'Entrenar un modelo es elegir sus pesos para que su pérdida sea la menor posible. Aquí hay un solo peso, $w$, y unos datos que la recta intenta seguir.',
      aim: 'Arrastras $w$ y ves a la vez la recta sobre los datos, los cuadrados de sus errores y el punto sobre la curva de la pérdida.',
      takeaway:
        'Entrenar es bajar al fondo de esta curva. Una red lo hace con millones de pesos a la vez, y no puede mirar la curva: necesita saber hacia dónde bajar, y eso lo dice la pendiente.',
    },
    graph: {
      ...LOSS_WINDOW,
      snap: 0.1,
      curve: { kind: 'mse', data: DATA },
      points: [{ id: 'p', label: 'w', x: 0.5, movable: true, onCurve: true }],
      readouts: ['coords'],
      labels: LOSS_LABELS,
      fit: { of: 'p' },
    },
    goals: [{ metric: 'fx', of: ['p'], target: 0.375, tol: 0.01 }],
  },
  {
    id: 'despegue.5',
    type: 'opcion',
    prompt:
      'Es la pérdida de la pregunta anterior, con la tangente en el punto P ($w=2{,}5$). La tangente **sube** hacia la derecha. Quieres que la pérdida baje: ¿hacia dónde mueves $w$?',
    hints: [
      'La tangente sube hacia la derecha: su pendiente es positiva y, yendo con ella, la pérdida sube.',
      'Para que baje, ve al lado contrario de donde sube.',
    ],
    explain:
      'La pendiente dice hacia dónde **sube** la pérdida. Para bajarla hay que ir al lado contrario.',
    solution:
      'La pendiente es positiva: a la derecha la pérdida sube. Hay que mover $w$ a la izquierda, hacia el valle. Es la idea del descenso de gradiente: ir contra la pendiente.',
    options: [
      'A la izquierda: una $w$ más pequeña',
      'A la derecha: una $w$ más grande',
      'No se mueve: la tangente no dice nada',
      'Da igual: baja hacia los dos lados',
    ],
    correct: 0,
    graph: {
      ...LOSS_WINDOW,
      snap: 0.1,
      curve: { kind: 'mse', data: DATA },
      points: [{ id: 'p', label: 'P', x: 2.5, movable: false, onCurve: true }],
      readouts: ['coords'],
      labels: LOSS_LABELS,
      tangent: true,
    },
  },
  {
    id: 'despegue.6',
    type: 'curva',
    prompt:
      'En la misma curva de pérdida, la flecha es el **paso de descenso** desde el punto: adónde caería $w$ tras un paso. Coloca $w$ donde la pendiente valga $-6$ y mira hacia dónde apunta la flecha.',
    hints: [
      'Arrastra $w$ y mira cómo cambia el número de la pendiente.',
      'La pendiente es negativa a la izquierda del valle (el mínimo está en $w=1{,}5$): prueba con valores menores.',
    ],
    explain:
      'Con pendiente negativa la curva baja hacia la derecha y la flecha apunta a la derecha: el paso va siempre al lado contrario de la pendiente.',
    solution:
      'Con $w=1{,}1$ la pendiente vale $-6$ y la flecha apunta a la derecha, hacia el mínimo. El paso mide $0{,}04\\times 6=0{,}24$.',
    purpose: {
      why: 'Para bajar por la pérdida sin verla, una red solo conoce la pendiente en el punto donde está. Con ella decide el sentido y el tamaño del paso de cada peso.',
      aim: 'Colocas $w$ donde la pendiente vale lo que se pide y miras adónde llevaría un paso de descenso desde ahí.',
      takeaway:
        'El paso es $-\\text{tasa}\\times\\text{pendiente}$: con pendiente negativa va a la derecha, con positiva, a la izquierda. Es la actualización de pesos de toda red; la Órbita 1 la desarrolla.',
    },
    graph: {
      ...LOSS_WINDOW,
      snap: 0.1,
      curve: { kind: 'mse', data: DATA },
      points: [{ id: 'p', label: 'w', x: 2.5, movable: true, onCurve: true }],
      readouts: ['coords', 'slope'],
      labels: LOSS_LABELS,
      step: { of: 'p', rate: 0.04 },
    },
    goals: [{ metric: 'slope', of: ['p'], target: -6, tol: 0.01 }],
  },
  {
    id: 'despegue.7',
    type: 'codigo',
    prompt:
      'Escribe la función `pendiente(p, q)`: recibe dos puntos, cada uno con sus coordenadas `(x, y)`, y devuelve la pendiente de la recta que pasa por ellos: lo que sube dividido entre lo que avanza. Se prueba con varias parejas, también con rectas que bajan.',
    hints: [
      'El plan son tres líneas dentro de la función. La subida: lo que cambia la `y` de `p` a `q`. El avance: lo que cambia la `x`, **en el mismo orden**. Y `return` de la subida dividida entre el avance. Un error típico: restar en un orden la `y` y en el otro la `x`, que da el signo cambiado.',
      'Las piezas, con otros dos puntos:\n\n' +
        py(
          'a = (2, 7)',
          'b = (4, 1)',
          'print(a[1], b[1])     # 7 1: la y de cada punto (el 1 es la posición de la y)',
          'print(b[1] - a[1])    # -6: la subida de a a b',
          'print(b[0] - a[0])    # 2: el avance, en el mismo orden',
          'print(-6 / 2)         # -3.0: la subida entre el avance',
        ) +
        '\n\nEn una función todo lo de dentro lleva 4 espacios de sangría, y lo que devuelve va con `return`.',
      'El esqueleto, con huecos `___` donde decides tú:\n\n' +
        py(
          'def pendiente(p, q):',
          '    subida = q[___] - p[___]',
          '    avance = q[___] - p[___]',
          '    return subida / ___',
        ) +
        '\n\nLa `y` está en la posición 1 y la `x`, en la 0. Para la subida van las `y`; para el avance, las `x`.',
    ],
    explain:
      'La pendiente es la subida dividida entre el avance, midiendo los dos de `p` a `q`. Si cambias el orden en uno solo, el signo sale al revés. Pruébala con una recta que baja.',
    solution:
      'Se calcula la subida, `q[1] - p[1]`, y el avance, `q[0] - p[0]`, y se devuelve el cociente. Para $(2, 7)$ y $(4, 1)$ sale $\\dfrac{-6}{2}=-3$: una recta que baja.',
    requirements: [
      '`pendiente` es una función que recibe dos puntos, cada uno una tupla (o lista) de dos números `(x, y)`, y devuelve un número.',
      'Se llama con varias parejas de puntos, con rectas que suben, que bajan y horizontales, y en cualquier orden de los dos puntos; no debe dar error.',
      'El número que devuelve es la subida dividida entre el avance, con el signo correcto.',
    ],
    starter: `import numpy as np


# Aquí no hay datos hechos: la función recibe sus dos puntos. Las comprobaciones la llaman
# con varias parejas, algunas con rectas que bajan.

def pendiente(p, q):
    # p y q son dos puntos: p[0] es la x de p y p[1] es su y. Igual para q.
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría).

    # PASO 1. La subida: cuánto cambia la y al ir de p a q.
    # Por qué: la pendiente mide cuánto sube la recta; si baja, la subida sale negativa.
    # Es la y de q menos la y de p. Con otros puntos, (2, 7) y (4, 1), la subida es 1 - 7 = -6.

    # PASO 2. El avance: cuánto cambia la x en el mismo recorrido, de p a q.
    # Por qué: la pendiente es la subida POR cada paso a la derecha. Hay que restar en el mismo orden
    # que antes (la de q menos la de p), o el signo sale al revés. Con (2, 7) y (4, 1), el avance es 4 - 2 = 2.

    # PASO 3. Devolver la subida dividida entre el avance, con return.
    # Con esos puntos: -6 / 2 = -3, una recta que baja.
    return None

# Para probarla antes de entregar: llama a pendiente((0, 0), (1, 2)), imprime el resultado con print(...)
# y pulsa «Ejecutar».
`,
    checks: `import numbers
_casos = [((0, 0), (1, 2), 2), ((1, 5), (3, 1), -2), ((2, 3), (5, 3), 0), ((4, 1), (1, 7), -2), ((0, 1), (2, 2), 0.5), ((-1, -3), (2, 3), 2)]
_f = callable(globals().get("pendiente"))
def _try(p, q):
    try:
        return pendiente(p, q)
    except Exception:
        return None
_got = [_try(p, q) for p, q, _e in _casos] if _f else []
_run = _f and all(g is not None for g in _got)
_num = _run and all(isinstance(g, numbers.Real) and not isinstance(g, bool) and g == g for g in _got)
_ok = _num and all(abs(g - e) < 1e-9 for g, (_p, _q, e) in zip(_got, _casos))
_sign = _num and (not _ok) and all(abs(g + e) < 1e-9 for g, (_p, _q, e) in zip(_got, _casos))
_inv = _f and all(g is not None and isinstance(g, numbers.Real) and abs(g - 1 / e) < 1e-9 for g, (_p, _q, e) in zip(_got, _casos) if e != 0)
check(_f, "Hay que definir una función \`pendiente\` que reciba los dos puntos.")
check((not _f) or _run or _inv, "\`pendiente\` da un error con alguna pareja de puntos, o devuelve \`None\`. Cada punto es una pareja \`(x, y)\`, y la función tiene que terminar con \`return\` y el resultado.")
check((not _run) or _num, "\`pendiente\` tiene que devolver un número: la subida dividida entre el avance.")
check((not _f) or not _inv, "\`pendiente\` está al revés: has dividido el avance entre la subida. La pendiente es la subida entre el avance.")
check((not _num) or _ok or not _sign, "\`pendiente\` sale con el signo cambiado: las rectas que suben salen como si bajaran. Resta las dos coordenadas en el mismo orden, la de \`q\` menos la de \`p\` en las dos.")
check((not _num) or _ok or _sign, "\`pendiente\` no da la subida entre el avance. Mira qué restas: la subida usa las \`y\` y el avance usa las \`x\`, y las dos van de \`p\` a \`q\`.")
`,
    reference:
      'import numpy as np\n\n\ndef pendiente(p, q):\n    return (q[1] - p[1]) / (q[0] - p[0])\n',
  },
  {
    id: 'despegue.8',
    type: 'codigo',
    prompt:
      'Ya tienes los datos `x` e `y` y `ws`, una lista de pesos candidatos para $\\hat y=w\\cdot x$. Guarda en `perdidas` la pérdida de cada $w$ de `ws` (la media de $(w\\,x_i-y_i)^2$ sobre los datos) y en `mejor_w` el peso de `ws` con la menor pérdida. La figura de la pérdida frente a $w$ ya está hecha: compara tus números con ella.',
    hints: [
      'El plan son dos líneas. `perdidas`: para cada `w` de `ws`, la media de los errores al cuadrado, `w * x - y`, sobre los datos; se hace con una lista por comprensión, `[... for w in ws]`, dentro de `np.array`. `mejor_w`: `np.argmin` da la **posición** de la menor pérdida; con esa posición se saca el peso de `ws`. Un error típico: guardar la posición y no el peso.',
      'Las piezas, con otros datos:\n\n' +
        py(
          'a = np.array([1, 2])',
          'b = np.array([1, 5])',
          'print(np.mean((2 * a - b) ** 2))      # 1.0: errores 1 y -1, al cuadrado 1 y 1, y su media',
          'pesos = np.array([0, 1, 2])',
          'print([np.mean((w * a - b) ** 2) for w in pesos])   # una pérdida por cada peso',
          'v = np.array([5.0, 2.0, 9.0])',
          'print(np.argmin(v))                   # 1: la posición del menor, no el menor',
          'print(pesos[np.argmin(v)])            # 1: el peso que está en esa posición',
        ) +
        '\n\nEl `**` eleva al cuadrado; sin él, los errores se compensan unos con otros.',
      'El esqueleto, con huecos `___` donde decides tú:\n\n' +
        py(
          'perdidas = np.array([np.mean((w * x - y) ___ 2) for w in ws])',
          'mejor_w = ws[np.___(perdidas)]',
        ) +
        '\n\nEl primer hueco es el operador de elevar a una potencia. El segundo, la función que da la posición del menor.',
    ],
    explain:
      'Cada peso da una pérdida, y el mejor es el que la tiene más baja. Recuerda que `np.argmin` devuelve una posición: el peso hay que sacarlo de `ws`. Compara con la figura: el punto más bajo de la curva tiene que ser el tuyo.',
    solution:
      'Se calcula la media de $(w\\,x_i-y_i)^2$ para cada `w` con una lista por comprensión, y se busca la posición de la menor con `np.argmin`. La menor pérdida es $0{,}375$ y está en la posición 3 de `ws`, así que el peso es $1{,}5$. Si guardas la posición, `mejor_w` vale $3$ y no es un peso.',
    requirements: [
      '`perdidas` existe y es un array de NumPy (o una lista) con 7 números, uno por cada peso de `ws` y en su mismo orden.',
      'Cada número de `perdidas` es la media, sobre los datos `x` e `y`, de los errores al cuadrado de ese peso: ni la suma, ni los errores sin elevar al cuadrado.',
      '`mejor_w` existe y es un número: el peso de `ws` con la menor pérdida, no su posición ni el valor de la pérdida.',
    ],
    starter: `import numpy as np
import matplotlib.pyplot as plt

# x e y son los datos: la longitud del prompt (en cientos de tokens) y lo que tarda el modelo
# en responder (en segundos). ws son los pesos w que se van a probar.
# Ya están hechos: no hace falta tocarlos.
x = np.array([1, 2, 3, 4])
y = np.array([2, 2, 5, 6])
ws = np.array([0, 0.5, 1, 1.5, 2, 2.5, 3])

# Ya está hecha: no hace falta tocarla. La figura dibuja la pérdida para todos los valores de w
# entre 0 y 3. Tus números de abajo tienen que caer sobre esta curva.
ww = np.linspace(0, 3, 100)
curva = ((ww[:, None] * x - y) ** 2).mean(axis=1)
plt.plot(ww, curva)
plt.xlabel("w")
plt.ylabel("pérdida")
plt.title("Pérdida de ŷ = w·x frente a w")

# PASO 1. perdidas: la pérdida de cada peso de ws, un número por peso.
# Qué: para cada w, el error cuadrático medio: el error de cada dato es w * x - y;
# se eleva al cuadrado (con **) y se saca la media (con np.mean).
# Por qué: un solo número por peso permite comparar pesos y quedarse con el mejor.
# Cómo: una lista por comprensión repite la cuenta para cada w: [cuenta for w in ws].
# Con otros datos, a = [1, 2] y b = [1, 5], el peso 2 da errores 1 y -1, al cuadrado 1 y 1, media 1.
# Sale un array de NumPy con 7 números (envuelve la lista en np.array(...)).
perdidas = None

# PASO 2. mejor_w: el peso de ws con la menor pérdida.
# Qué: no la pérdida más baja, sino el peso w que la produce.
# Cómo: np.argmin(v) devuelve la POSICIÓN del número menor de v (no el número). Con esa posición,
# ws[posición] saca el peso. Ejemplo: si v = [5, 2, 9], np.argmin(v) es 1.
# Sale un solo número.
mejor_w = None

# Para ver qué vale algo antes de entregar: print(perdidas) o print(mejor_w) y pulsa «Ejecutar».
`,
    checks: `_x = np.array([1, 2, 3, 4])
_y = np.array([2, 2, 5, 6])
_ws = np.array([0, 0.5, 1, 1.5, 2, 2.5, 3])
_exp = ((_ws[:, None] * _x - _y) ** 2).mean(axis=1)
try:
    _pa = np.asarray(perdidas, dtype=float)
except Exception:
    _pa = None
_p = _pa is not None and _pa.shape == (7,)
_pf = _p and bool(np.all(np.isfinite(_pa)))
_pok = _pf and bool(np.allclose(_pa, _exp))
_psum = _pf and bool(np.allclose(_pa, 4 * _exp))
_psq = _pf and bool(np.allclose(_pa, (_ws[:, None] * _x - _y).mean(axis=1)))
_m = isinstance(mejor_w, (int, float, np.integer, np.floating)) and not isinstance(mejor_w, (bool, np.bool_))
check(_p, "\`perdidas\` tiene que ser un array de NumPy (o una lista) con 7 números: una pérdida por cada peso de \`ws\`.")
check((not _p) or _pf, "\`perdidas\` tiene que tener números normales, sin huecos ni infinitos.")
check((not _pf) or not _psum, "\`perdidas\` está sumando los errores al cuadrado en vez de promediarlos. La pérdida es la media: hay que dividir entre el número de datos, o usar np.mean.")
check((not _pf) or not _psq, "\`perdidas\` no eleva los errores al cuadrado: sin el cuadrado, los errores de un signo compensan a los del otro. Eleva cada error con \`**\`.")
check((not _pf) or _pok or _psum or _psq, "\`perdidas\` tiene que valer, para cada peso de \`ws\`, la media de los errores al cuadrado, \`(w * x - y) ** 2\`, sobre los datos.")
check(_m, "\`mejor_w\` tiene que ser un número: el peso de \`ws\` con la menor pérdida.")
check((not _m) or mejor_w != 3, "\`mejor_w\` vale 3: es la posición del mejor peso en \`ws\`, no el peso. Saca el peso de \`ws\` con esa posición.")
check((not _m) or abs(float(mejor_w) - float(np.min(_exp))) > 1e-9, "\`mejor_w\` es la menor pérdida, no el peso que la produce. Hace falta el peso de \`ws\` que está en esa posición.")
check((not _m) or mejor_w == 3 or abs(float(mejor_w) - float(np.min(_exp))) < 1e-9 or bool(np.any(np.abs(_ws - float(mejor_w)) < 1e-9)), "\`mejor_w\` tiene que ser uno de los pesos de \`ws\`.")
check((not _m) or mejor_w == 3 or not bool(np.any(np.abs(_ws - float(mejor_w)) < 1e-9)) or abs(float(mejor_w) - float(_ws[np.argmin(_exp)])) < 1e-9, "\`mejor_w\` es un peso de \`ws\`, pero no el de menor pérdida. Compara con la figura: el punto más bajo de la curva.")
`,
    reference:
      'import numpy as np\n\nx = np.array([1, 2, 3, 4])\ny = np.array([2, 2, 5, 6])\nws = np.array([0, 0.5, 1, 1.5, 2, 2.5, 3])\n\nperdidas = np.array([np.mean((w * x - y) ** 2) for w in ws])\nmejor_w = ws[np.argmin(perdidas)]\n',
  },
];
