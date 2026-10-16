import type { PlaneSpec, PlaneVector, Project } from '../../content/schema';

/**
 * Plano del proyecto: rango 2, rejilla de 0,1 y la circunferencia unidad dibujada, salvo que se
 * diga otra cosa. Con 0,1 de rejilla hay puntos sobre la circunferencia: (0,6; 0,8), (0,8; 0,6),
 * (1; 0)…
 */
const plane = (
  vectors: PlaneVector[],
  readouts: PlaneSpec['readouts'],
  pair?: [string, string],
  range = 2,
  snap = 0.1,
): PlaneSpec => ({
  range,
  snap,
  vectors,
  readouts,
  circle: 1,
  ...(pair ? { pair } : {}),
});

/** Un vector del plano, móvil o fijo. */
const arrow = (
  id: string,
  [x, y]: readonly [number, number],
  movable: boolean,
  label: string = id,
): PlaneVector => ({ id, label, x, y, movable });

/** Segundo proyecto de la Órbita 2: normalizar deja todos los vectores con la misma longitud. */
export const normalizar: Project = {
  id: 'normalizar',
  name: 'Normalizar',
  sub: 'Todos a la misma longitud',
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'normalizar.ex00.1',
          type: 'manipular',
          prompt:
            'Un vector es **unitario** cuando su norma vale $1$. **Normalizar** un vector $\\vec{v}$ es dividirlo entre su norma: $\\hat{v}=\\dfrac{\\vec{v}}{\\lVert\\vec{v}\\rVert}$. Se conserva la dirección y la longitud pasa a ser $1$. Los vectores unitarios del plano tienen la punta sobre la **circunferencia unidad**, la de radio $1$, que está dibujada.\n\nEl vector $\\vec{u}$ está fijo en $(1{,}5;\\ 2)$. Lleva la punta de $\\vec{w}$ a la circunferencia, apuntando como $\\vec{u}$: norma $1$ y coseno $1$ con $\\vec{u}$. La rejilla es de $0{,}1$ en $0{,}1$.',
          hints: [
            'Mira la lectura de la norma de $\\vec{w}$ mientras la arrastras: tiene que valer $1$.',
            'Calcula la norma de $\\vec{u}$ y divide cada componente de $\\vec{u}$ entre ella.',
          ],
          explain:
            'Normalizar no cambia hacia dónde apunta el vector, solo cuánto mide: $\\vec{w}$ tiene que estar sobre la recta de $\\vec{u}$ y, a la vez, sobre la circunferencia. Las dos componentes de $\\vec{u}$ se dividen entre el mismo número: ¿cuál?',
          solution:
            '$\\lVert\\vec{u}\\rVert=\\sqrt{1{,}5^2+2^2}=\\sqrt{6{,}25}=2{,}5$, así que $\\hat{u}=\\dfrac{(1{,}5;\\ 2)}{2{,}5}=(0{,}6;\\ 0{,}8)$. Comprobación: $0{,}6^2+0{,}8^2=1$. Al normalizar se pierde la longitud: $\\hat{u}$ no dice si $\\vec{u}$ medía $2{,}5$ o $25$.',
          plane: plane(
            [arrow('u', [1.5, 2], false), arrow('w', [1, 1], true)],
            ['components', 'norm', 'cos'],
            ['u', 'w'],
            2.5,
          ),
          goals: [
            { metric: 'norm', of: ['w'], target: 1, tol: 0.01 },
            { metric: 'cos', of: ['u', 'w'], target: 1, tol: 0.001 },
          ],
        },
        {
          id: 'normalizar.ex00.2',
          type: 'manipular',
          prompt:
            'Cuando los dos vectores son unitarios, la distancia entre sus puntas es la longitud de la cuerda que los une, y solo depende del ángulo que forman. El vector $\\vec{a}=(0{,}6;\\ 0{,}8)$ está fijo, sobre la circunferencia. Lleva la punta de $\\vec{b}$ a la circunferencia, a una distancia de $\\sqrt2\\approx1{,}41$ de $\\vec{a}$, y mira qué coseno marca la lectura.',
          hints: [
            'Primero lleva $\\vec{b}$ a la circunferencia y después mírale la distancia mientras lo mueves sobre ella.',
            'Para dos unitarios, $\\lVert\\vec{a}-\\vec{b}\\rVert^2=2-2\\cos\\theta$. Si la distancia es $\\sqrt2$, ¿cuánto vale el coseno?',
          ],
          explain:
            'La distancia entre dos unitarios la fija el coseno, y una distancia de $\\sqrt2$ corresponde a un valor concreto del coseno. Piensa en qué ángulo da ese coseno y en dónde cae $\\vec{b}$.',
          solution:
            'Con $\\lVert\\vec{a}-\\vec{b}\\rVert^2=2$ y $2-2\\cos\\theta=2$ sale $\\cos\\theta=0$: los dos vectores son perpendiculares. En la rejilla hay dos puntos, $\\vec{b}=(-0{,}8;\\ 0{,}6)$ y $\\vec{b}=(0{,}8;\\ -0{,}6)$. Comprobación con el primero: $\\vec{a}-\\vec{b}=(1{,}4;\\ 0{,}2)$ y $\\sqrt{1{,}96+0{,}04}=\\sqrt2$.',
          plane: plane(
            [arrow('a', [0.6, 0.8], false), arrow('b', [1, 0], true)],
            ['components', 'norm', 'distance', 'cos'],
            ['a', 'b'],
          ),
          goals: [
            { metric: 'norm', of: ['b'], target: 1, tol: 0.01 },
            { metric: 'distance', of: ['a', 'b'], target: 1.4142, tol: 0.01 },
          ],
        },
        {
          id: 'normalizar.ex00.3',
          type: 'manipular',
          prompt:
            'Con dos vectores unitarios, el denominador del coseno vale $1\\cdot1=1$, y el coseno es solo el producto escalar. El vector $\\vec{f}=(1, 0)$ es unitario y está fijo. Lleva la punta de $\\vec{w}$ a la circunferencia con un producto escalar de $0{,}6$ con $\\vec{f}$, y comprueba que la lectura del coseno marca lo mismo.',
          hints: [
            'El producto escalar de $\\vec{f}=(1, 0)$ con $\\vec{w}$ es la primera componente de $\\vec{w}$.',
            'Fija esa componente en $0{,}6$ y mueve la otra hasta que la norma de $\\vec{w}$ valga $1$.',
          ],
          explain:
            'Como $\\vec{f}$ está sobre el eje horizontal, el producto escalar solo depende de una componente de $\\vec{w}$. La otra la fija la condición de estar sobre la circunferencia: $w_1^2+w_2^2=1$.',
          solution:
            '$\\vec{f}\\cdot\\vec{w}=1\\cdot w_1+0\\cdot w_2=w_1$, luego $w_1=0{,}6$. Sobre la circunferencia, $0{,}6^2+w_2^2=1$ da $w_2=\\pm0{,}8$. Sirven $(0{,}6;\\ 0{,}8)$ y $(0{,}6;\\ -0{,}8)$. El coseno también vale $0{,}6$: con las dos normas iguales a $1$, coseno y producto escalar son el mismo número.',
          plane: plane(
            [arrow('f', [1, 0], false), arrow('w', [0, 1], true)],
            ['components', 'norm', 'dot', 'cos'],
            ['f', 'w'],
          ),
          goals: [
            { metric: 'norm', of: ['w'], target: 1, tol: 0.01 },
            { metric: 'dot', of: ['f', 'w'], target: 0.6, tol: 0.01 },
          ],
        },
        {
          id: 'normalizar.ex00.4',
          type: 'manipular',
          prompt:
            'Para dos unitarios, $\\lVert\\vec{a}-\\vec{b}\\rVert^2=2-2\\cos\\theta$: **cuanto mayor es el coseno, menor es la distancia**. El vector $\\vec{a}=(0{,}8;\\ 0{,}6)$ está fijo. Lleva $\\vec{b}$ a la circunferencia con un coseno de $0{,}8$ con $\\vec{a}$ y fíjate en la lectura de la distancia: con coseno $0$ valía $\\sqrt2\\approx1{,}41$, y ahora tiene que ser menor.',
          hints: [
            'Sobre la circunferencia, el coseno con $\\vec{a}$ solo depende del ángulo que forma $\\vec{b}$ con $\\vec{a}$.',
            'Un coseno de $0{,}8$ es un ángulo de unos $37^\\circ$. Prueba los puntos de la circunferencia cuyas coordenadas tienen un solo decimal.',
          ],
          explain:
            'Con $\\vec{b}$ en la circunferencia, el coseno es el producto escalar, y el punto buscado cumple $0{,}8b_1+0{,}6b_2=0{,}8$. Cuando lo hayas colocado, calcula la distancia con la fórmula y compárala con la lectura.',
          solution:
            '$\\vec{b}=(1, 0)$: su norma es $1$ y $\\vec{a}\\cdot\\vec{b}=0{,}8$, luego $\\cos\\theta=0{,}8$. La distancia es $\\sqrt{2-2\\cdot0{,}8}=\\sqrt{0{,}4}\\approx0{,}63$, menor que $\\sqrt2\\approx1{,}41$. Comprobación: $\\vec{a}-\\vec{b}=(-0{,}2;\\ 0{,}6)$ y su norma es $\\sqrt{0{,}04+0{,}36}=\\sqrt{0{,}4}$.',
          plane: plane(
            [arrow('a', [0.8, 0.6], false), arrow('b', [0, 1], true)],
            ['components', 'norm', 'cos', 'distance'],
            ['a', 'b'],
          ),
          goals: [
            { metric: 'norm', of: ['b'], target: 1, tol: 0.01 },
            { metric: 'cos', of: ['a', 'b'], target: 0.8, tol: 0.01 },
          ],
        },
        {
          id: 'normalizar.ex00.5',
          type: 'manipular',
          prompt:
            'Este mapa es un juguete **inventado** de dos dimensiones, para poder dibujarlo: los embeddings reales tienen cientos de dimensiones. Un buscador que guarda sus embeddings normalizados, como hacen los de OpenAI (norma $1$), mide la similitud con el producto escalar. Aquí «gato» $(0{,}6;\\ 0{,}8)$ y «perro» $(0{,}8;\\ 0{,}6)$ están fijos: son los vectores $(3, 4)$ y $(4, 3)$ divididos entre su norma, $5$.\n\nColoca la consulta $\\vec{q}$ sobre la circunferencia con una similitud de $0{,}6$ con «gato» (la lectura compara $\\vec{q}$ con «gato»). Después calcula a mano su similitud con «perro» y decide cuál de los dos documentos es más parecido.',
          hints: [
            'La lectura del producto escalar con «gato» tiene que valer $0{,}6$ y la norma de $\\vec{q}$, $1$.',
            'Prueba con los puntos de la circunferencia que están sobre un eje.',
          ],
          explain:
            'Con vectores unitarios no hace falta dividir: la similitud es el producto escalar, que es lo que lee el plano. La consulta tiene que estar sobre la circunferencia y en el punto donde esa lectura vale $0{,}6$. Para «perro», multiplica componente a componente y suma, igual que el plano.',
          solution:
            '$\\vec{q}=(1, 0)$: su norma es $1$ y con «gato» el producto escalar es $1\\cdot0{,}6+0\\cdot0{,}8=0{,}6$. Con «perro», $1\\cdot0{,}8+0\\cdot0{,}6=0{,}8$. Es más parecido «perro», con $0{,}8$ frente a $0{,}6$. Como los dos documentos son unitarios, esos productos son cosenos, y ordenar por ellos es lo mismo que ordenar por distancia: $\\sqrt{2-2\\cdot0{,}8}\\approx0{,}63$ frente a $\\sqrt{2-2\\cdot0{,}6}\\approx0{,}89$.',
          plane: plane(
            [
              arrow('gato', [0.6, 0.8], false),
              arrow('perro', [0.8, 0.6], false),
              arrow('q', [0, 1], true),
            ],
            ['components', 'norm', 'dot', 'cos'],
            ['q', 'gato'],
          ),
          goals: [
            { metric: 'norm', of: ['q'], target: 1, tol: 0.01 },
            { metric: 'dot', of: ['q', 'gato'], target: 0.6, tol: 0.01 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'normalizar.ex01.1',
          type: 'vector',
          prompt:
            'Normaliza el vector $\\vec{v}=(-5, 12)$ de $\\mathbb{R}^2$: divide cada componente entre la norma. Escribe el resultado, primero la $x$ y después la $y$, con los decimales que hagan falta.',
          hints: [
            'La norma de $\\vec{v}$ es un número entero: $\\sqrt{(-5)^2+12^2}$.',
            'Divide las dos componentes entre ese mismo número, conservando el signo de cada una.',
          ],
          explain:
            'El vector normalizado conserva la dirección, así que cada componente mantiene su signo, y su norma tiene que valer $1$. Comprueba que tu resultado lo cumple.',
          solution:
            '$\\lVert\\vec{v}\\rVert=\\sqrt{25+144}=13$, así que $\\hat{v}=\\left(\\dfrac{-5}{13},\\ \\dfrac{12}{13}\\right)\\approx(-0{,}38;\\ 0{,}92)$. Comprobación: $0{,}38^2+0{,}92^2\\approx1$.',
          answer: [-5 / 13, 12 / 13],
          tol: 0.01,
        },
        {
          id: 'normalizar.ex01.2',
          type: 'vector',
          prompt:
            'Normalizar funciona igual en cualquier número de dimensiones. Normaliza $\\vec{v}=(2, -3, 6)$ de $\\mathbb{R}^3$. Escribe sus tres componentes, en orden, con los decimales que hagan falta.',
          hints: [
            'La norma en $\\mathbb{R}^3$ suma tres cuadrados: $\\sqrt{2^2+(-3)^2+6^2}$.',
            'Es un número entero. Divide cada una de las tres componentes entre él.',
          ],
          explain:
            'La fórmula es la misma que en el plano, con una componente más en la norma. El resultado tiene que medir $1$: súmale los cuadrados para comprobarlo.',
          solution:
            '$\\lVert\\vec{v}\\rVert=\\sqrt{4+9+36}=7$, así que $\\hat{v}=\\left(\\dfrac{2}{7},\\ \\dfrac{-3}{7},\\ \\dfrac{6}{7}\\right)\\approx(0{,}29;\\ -0{,}43;\\ 0{,}86)$. Comprobación: $\\dfrac{4+9+36}{49}=1$. Se ha perdido la longitud: $\\hat{v}$ no distingue $\\vec{v}$ de $10\\vec{v}$.',
          answer: [2 / 7, -3 / 7, 6 / 7],
          tol: 0.01,
        },
        {
          id: 'normalizar.ex01.3',
          type: 'numero',
          prompt:
            'Dos embeddings $\\vec{a}$ y $\\vec{b}$ tienen norma $1$ y su coseno vale $0{,}28$. Para calcular la distancia $\\lVert\\vec{a}-\\vec{b}\\rVert$ sin conocer sus componentes, desarrolla el cuadrado: $\\lVert\\vec{a}-\\vec{b}\\rVert^2=\\lVert\\vec{a}\\rVert^2+\\lVert\\vec{b}\\rVert^2-2\\,\\vec{a}\\cdot\\vec{b}$. Calcula la distancia, con los decimales que hagan falta.',
          hints: [
            'Con normas iguales a $1$, el producto escalar $\\vec{a}\\cdot\\vec{b}$ es el coseno.',
            'Sustituye en el desarrollo: $1+1-2\\cdot0{,}28$. Es la distancia **al cuadrado**.',
          ],
          explain:
            'La fórmula da el cuadrado de la distancia, no la distancia. Cuando tengas el resultado, falta un último paso para llegar al número que se pide.',
          solution:
            '$\\lVert\\vec{a}-\\vec{b}\\rVert^2=1+1-2\\cdot0{,}28=1{,}44$, y la distancia es $\\sqrt{1{,}44}=1{,}2$. En general, para unitarios $\\lVert\\vec{a}-\\vec{b}\\rVert=\\sqrt{2-2\\cos\\theta}$: cuanto mayor es el coseno, menor es la distancia.',
          answer: 1.2,
          tol: 0.01,
        },
        {
          id: 'normalizar.ex01.4',
          type: 'opcion',
          prompt:
            'Un buscador tiene la consulta $\\vec{q}=(1, 1)$ y dos documentos de juguete (inventados y de dos dimensiones; los reales tienen cientos): la «ficha» $\\vec{F}=(2, 2)$, corta y del mismo tema que la consulta, y el «manual» $\\vec{M}=(8, 0)$, largo y de otro tema. Los ordena por **producto escalar**, sin normalizar, o por **coseno**. ¿Cuál gana con cada criterio?',
          hints: [
            'Calcula el producto escalar de la consulta con cada documento, y también el coseno.',
            'La «ficha» apunta exactamente como la consulta. El «manual» es cuatro veces más largo que ella.',
          ],
          explain:
            'El producto escalar crece con la longitud de los documentos, aunque no traten del tema de la consulta. El coseno solo mira la dirección. Calcula las dos medidas con cada documento antes de elegir.',
          solution:
            'Producto escalar: con la ficha, $2+2=4$; con el manual, $8+0=8$. Gana el manual, solo por ser más largo. Coseno: con la ficha, $\\dfrac{4}{\\sqrt2\\cdot\\sqrt8}=1$; con el manual, $\\dfrac{8}{\\sqrt2\\cdot8}\\approx0{,}71$. Gana la ficha. Si se normalizan antes los documentos, quedan $(0{,}71;\\ 0{,}71)$ y $(1, 0)$, y los productos escalares con la consulta normalizada son $1$ y $0{,}71$: ahora los dos criterios coinciden, y por eso se normaliza.',
          options: [
            'Gana la «ficha» con los dos criterios',
            'Por producto escalar gana el «manual»; por coseno, la «ficha»',
            'Por producto escalar gana la «ficha»; por coseno, el «manual»',
            'Gana el «manual» con los dos criterios',
          ],
          correct: 1,
        },
        {
          id: 'normalizar.ex01.5',
          type: 'opcion',
          prompt:
            'Los embeddings de OpenAI, como los de `text-embedding-3-small` (1536 dimensiones), vienen normalizados a norma $1$. Las bases de datos vectoriales piden elegir la métrica de búsqueda: coseno, producto interno o distancia euclídea (L2). Si todos los vectores tienen norma $1$, ¿qué pasa con el orden de los resultados?',
          hints: [
            'Con normas iguales a $1$, ¿en qué se convierte el denominador del coseno?',
            'Para unitarios, la distancia al cuadrado es $2-2\\,\\vec{q}\\cdot\\vec{d}$. Mira cómo depende del producto escalar.',
          ],
          explain:
            'Con normas fijas en $1$, el coseno y el producto interno son la misma cantidad, y la distancia depende de ella con una fórmula que cambia el sentido de la desigualdad. Piensa si algún criterio puede dar un orden distinto de los otros.',
          solution:
            'Para unitarios, el coseno es $\\vec{q}\\cdot\\vec{d}$ y la distancia cumple $\\lVert\\vec{q}-\\vec{d}\\rVert^2=2-2\\,\\vec{q}\\cdot\\vec{d}$. Un producto escalar mayor es, a la vez, un coseno mayor y una distancia menor, así que las tres métricas ordenan igual, y el producto interno es la más barata: no calcula normas ni raíces. Con vectores sin normalizar no es así, y el producto interno favorece al documento más largo. Lo que se pierde al normalizar es la longitud, que ya no se puede recuperar.',
          options: [
            'Las tres métricas ordenan igual, así que basta el producto interno, que es la más barata de calcular',
            'El coseno ordena distinto del producto interno, porque este no divide entre las normas',
            'La distancia euclídea ordena distinto, porque depende de la longitud de los vectores',
            'Con vectores normalizados ninguna métrica sirve: hay que recuperar antes las longitudes',
          ],
          correct: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'normalizar.ex02.1',
          type: 'codigo',
          prompt:
            'Una **función** guarda un cálculo para repetirlo con otros datos. Se define con `def`, su cuerpo va sangrado y `return` dice qué devuelve. Un ejemplo con otra tarea, la media de dos números:\n\n```python\ndef media(x, y):\n    return (x + y) / 2\n```\n\nDespués, `media(4, 6)` da `5`. Un array de NumPy se divide entre un número componente a componente, y `np.linalg.norm(v)` calcula la norma de `v`, sea cual sea su número de componentes. Completa la función `normalizar(v)` para que devuelva el vector unitario con la misma dirección que `v`.',
          hints: [
            'Dentro de la función, el vector se divide entre un solo número, su norma.',
            'Prueba con `v = np.array([3, 4])`: tiene que dar `[0.6, 0.8]`. Y con `v = np.array([1, 2, 2])`, que tiene tres componentes, también tiene que funcionar.',
          ],
          explain:
            'Normalizar es dividir el vector entre su norma. Una vez escrita, comprueba que la función sirve con dos y con tres componentes, y que el resultado mide $1$.',
          solution:
            'El cuerpo de la función es `return v / np.linalg.norm(v)`. Con `v = np.array([3, 4])`, la norma es $5$ y devuelve $(0{,}6;\\ 0{,}8)$. Con `np.array([1, 2, 2])` la norma es $3$ y devuelve $\\left(\\dfrac13,\\ \\dfrac23,\\ \\dfrac23\\right)$. Dividir entre el cuadrado de la norma, o entre la suma de las componentes, no deja el vector con norma $1$.',
          starter: `import numpy as np


def normalizar(v):
    # Devuelve el vector unitario con la misma dirección que v
    return None
`,
          checks: `_f = normalizar


def _llamar(v):
    try:
        r = np.asarray(_f(np.array(v)))
    except BaseException:
        return None
    if np.issubdtype(r.dtype, np.number) and r.shape == (len(v),):
        return r.astype(float)
    return None


_casos = [((3, 4), (0.6, 0.8)), ((0, -2), (0.0, -1.0)), ((1, 2, 2), (1 / 3, 2 / 3, 2 / 3)), ((2, 1, -2, 4), (0.4, 0.2, -0.4, 0.8))]
_r = [_llamar(v) for v, _e in _casos]
_p = _r[0]
_sin = _p is not None and np.allclose(_p, [3, 4])
_cuad = _p is not None and np.allclose(_p, [0.12, 0.16])
_suma = _p is not None and np.allclose(_p, [3 / 7, 4 / 7])
_mal = any(r is None or not np.allclose(r, e) for r, (_v, e) in zip(_r, _casos))
check(_p is not None, "\`normalizar(v)\` tiene que devolver un array de NumPy con las mismas componentes que \`v\`. Prueba con \`v = np.array([3, 4])\`: si no devuelve nada, falta el \`return\`; si da un error, revisa la fórmula.")
check(not _sin, "Con \`v = (3, 4)\` tu función devuelve el propio \`v\`, sin cambios: falta dividirlo entre su norma.")
check(not _cuad, "Con \`v = (3, 4)\` tu función devuelve (0,12; 0,16): has dividido entre el cuadrado de la norma (25) y no entre la norma (5). El resultado no mide 1.")
check(not _suma, "Con \`v = (3, 4)\` tu función devuelve (0,43; 0,57): has dividido entre la suma de las componentes (7). La longitud de un vector es su norma, \`np.linalg.norm(v)\`, y no esa suma.")
check((not _mal) or _p is None or _sin or _cuad or _suma, "Tu función no da el vector unitario correcto en todos los casos. Con \`(3, 4)\` tiene que dar (0,6; 0,8); con \`(0, -2)\`, (0; -1); con \`(1, 2, 2)\`, que tiene tres componentes, (1/3; 2/3; 2/3), y con cuatro componentes también tiene que funcionar.")
`,
          reference: `import numpy as np


def normalizar(v):
    return v / np.linalg.norm(v)
`,
        },
        {
          id: 'normalizar.ex02.2',
          type: 'codigo',
          prompt:
            'Los embeddings de un buscador se guardan en las filas de una matriz `E`, y normalizar es dividir **cada fila** entre su propia norma. `np.linalg.norm(E, axis=1)` calcula la norma de cada fila y da un array de 3 números, `(3,)`. Pero dividir `E` entre ese array no hace lo que parece: NumPy alinea los ejes empezando por el último (el de las columnas), así que cada **columna** se divide entre la norma de una fila distinta.\n\nLa solución es `keepdims=True`: `np.linalg.norm(E, axis=1, keepdims=True)` conserva el eje y da una columna de 3 filas y 1 columna, `(3, 1)`. Esa columna sí se alinea con las filas de `E`.\n\nLa matriz `E` guarda tres embeddings de juguete (inventados y de 3 dimensiones; los reales tienen cientos). Guarda en `En` la matriz `E` con cada fila dividida entre su norma.',
          hints: [
            'Calcula las normas de las filas con `np.linalg.norm`, indicando el eje y que se conserve con `keepdims=True`.',
            'Después divide `E` entre ese resultado. Comprueba que la primera fila, `[3, 0, 4]`, queda `[0.6, 0, 0.8]`.',
          ],
          explain:
            'Cada fila se divide entre su propia norma, y para eso el array de normas tiene que alinearse con las filas y no con las columnas. Como `E` es cuadrada, un alineamiento equivocado no da error: sale una matriz de aspecto razonable pero incorrecta. Comprueba que cada fila de `En` mide $1$.',
          solution:
            'Las normas de las filas son $5$, $3$ y $13$. En código: `En = E / np.linalg.norm(E, axis=1, keepdims=True)`. Sin `keepdims=True` el array `(3,)` se alinea con el último eje de `E`, el de las columnas, y como `E` es cuadrada no hay error, solo un resultado incorrecto. Con una matriz de 4 filas y 3 columnas habría fallado con un error de forma. Queda `En` con filas $(0{,}6;\\ 0;\\ 0{,}8)$, $\\left(\\dfrac13,\\ \\dfrac23,\\ \\dfrac23\\right)$ y $\\left(0,\\ \\dfrac{5}{13},\\ \\dfrac{12}{13}\\right)$.',
          starter: `import numpy as np

# Embeddings de juguete (inventados y de 3 dimensiones), uno por fila
E = np.array([[3, 0, 4], [1, 2, 2], [0, 5, 12]])
# Calcula En, la matriz E con cada fila dividida entre su norma
En = None
`,
          checks: `_E = np.array([[3, 0, 4], [1, 2, 2], [0, 5, 12]])
_en = isinstance(En, np.ndarray) and En.shape == (3, 3) and np.issubdtype(En.dtype, np.number)
_sin = _en and np.allclose(En, _E)
_pcol = _en and np.allclose(En, _E / np.linalg.norm(_E, axis=1))
_pc0 = _en and np.allclose(En, _E / np.linalg.norm(_E, axis=0, keepdims=True))
_pglob = _en and np.allclose(En, _E / np.linalg.norm(_E))
_bien = _en and np.allclose(En, _E / np.linalg.norm(_E, axis=1, keepdims=True))
check(_en, "\`En\` tiene que ser un array de NumPy de 3 filas y 3 columnas, números: la matriz \`E\` con cada fila dividida entre su norma.")
check(not _sin, "\`En\` sigue valiendo lo mismo que \`E\`: falta dividir cada fila entre su norma.")
check(not _pcol, "\`En\` divide cada columna entre la norma de una fila distinta: un array de 3 normas, sin más, se alinea con las columnas de \`E\`. Para que cada norma caiga sobre su fila, el array de normas tiene que ser una columna de 3 filas y 1 columna, y eso es lo que da \`keepdims=True\`.")
check(not _pc0, "\`En\` tiene normalizadas las columnas, no las filas: cada columna mide 1, pero el embedding de cada documento es una fila. Calcula la norma de cada fila.")
check(not _pglob, "\`En\` se ha dividido entre una sola norma, la de toda la matriz. Cada fila necesita la suya.")
check((not _en) or _bien or _sin or _pcol or _pc0 or _pglob, "\`En\` tiene que ser \`E\` con cada fila dividida entre su propia norma: la primera fila, (3, 0, 4), pasa a (0,6; 0; 0,8), y todas las filas de \`En\` miden 1.")
`,
          reference: `import numpy as np

# Embeddings de juguete (inventados y de 3 dimensiones), uno por fila
E = np.array([[3, 0, 4], [1, 2, 2], [0, 5, 12]])
En = E / np.linalg.norm(E, axis=1, keepdims=True)
`,
        },
        {
          id: 'normalizar.ex02.3',
          type: 'codigo',
          prompt:
            'El vector nulo, el de todas las componentes iguales a cero, no tiene dirección y **no se puede normalizar**: su norma es $0$ y dividir entre $0$ da `nan`, que significa «no es un número». En una tabla de embeddings puede colarse una fila de ceros (un relleno vacío), y un `nan` contagia todo lo que toca: una similitud con `nan` ya no se puede ordenar. Lo razonable es dejar esa fila en ceros.\n\n`np.where(cond, a, b)` elige elemento a elemento: toma el valor de `a` donde `cond` es verdadera y el de `b` donde es falsa. Y `n == 0` es verdadera donde `n` vale cero. La función normaliza las filas de la matriz que recibe, como en el ejercicio anterior.\n\nCompleta `normalizar_filas(E)` para que devuelva `E` con cada fila dividida entre su norma, dejando en ceros las filas nulas.',
          hints: [
            'Calcula las normas de las filas con `keepdims=True`, como al normalizar la matriz entera.',
            'Una norma igual a cero se puede sustituir por `1` con `np.where` antes de dividir: así una fila de ceros, dividida entre `1`, sigue siendo de ceros.',
          ],
          explain:
            'Las filas con norma distinta de cero se dividen entre su norma, y las nulas no deben dividirse entre cero. Lo más sencillo es cambiar, solo en las normas que valen cero, el divisor por otro número que no altere la fila: ¿cuál?',
          solution:
            'Una versión: `n = np.linalg.norm(E, axis=1, keepdims=True)`, después `n = np.where(n == 0, 1, n)` y `return E / n`. La fila nula se divide entre `1` y se queda en ceros; las demás, entre su norma. También vale `np.divide(E, n, out=np.zeros(E.shape), where=n > 0)`. Con `[[3, 0, 4], [0, 0, 0], [0, 5, 12]]` queda `[[0.6, 0, 0.8], [0, 0, 0], [0, 5/13, 12/13]]`. Un vector nulo no tiene dirección: devolver ceros es una decisión práctica, no una normalización.',
          starter: `import numpy as np


def normalizar_filas(E):
    # Devuelve E con cada fila dividida entre su norma; una fila de ceros se queda en ceros
    return None
`,
          checks: `_f = normalizar_filas


def _llamar(m):
    a = np.array(m)
    try:
        r = np.asarray(_f(a))
    except BaseException:
        return None
    if np.issubdtype(r.dtype, np.number) and r.shape == a.shape:
        return r.astype(float)
    return None


def _nulas_ok(m, r):
    z = np.all(np.array(m) == 0, axis=1)
    return bool(np.all(r[z] == 0))


_casos = [
    ([[3, 0, 4], [0, 0, 0], [0, 5, 12]], [[0.6, 0, 0.8], [0, 0, 0], [0, 5 / 13, 12 / 13]]),
    ([[0, 0], [1, 1]], [[0, 0], [2 ** -0.5, 2 ** -0.5]]),
    ([[0, 0, 0], [0, 0, 0], [2, 0, 0]], [[0, 0, 0], [0, 0, 0], [1, 0, 0]]),
    ([[3, 4, 0], [0, 0, 0], [1, 2, 2], [0, 0, 5]], [[0.6, 0.8, 0], [0, 0, 0], [1 / 3, 2 / 3, 2 / 3], [0, 0, 1]]),
]
_r = [_llamar(m) for m, _e in _casos]
_p = _r[0]
_nan = any(r is not None and bool(np.isnan(r).any()) for r in _r)
_nul = all(r is None or _nulas_ok(m, r) for r, (m, _e) in zip(_r, _casos))
_mal = any(r is None or not np.allclose(r, e) for r, (_m, e) in zip(_r, _casos))
check(_p is not None, "\`normalizar_filas(E)\` tiene que devolver un array de NumPy de números con las mismas filas y columnas que \`E\`. Si no devuelve nada, falta el \`return\`; si da un error, revisa cómo tratas la fila nula y que el resultado admita decimales.")
check(not _nan, "Tu función devuelve \`nan\` en algún caso: una fila de ceros tiene norma 0 y dividirla entre 0 no da un número. Hay que evitar esa división y dejar la fila en ceros.")
check(_nan or _p is None or _nul, "Una fila de ceros tiene que quedarse en ceros, y en tu función sale con otros valores. Una fila sin dirección no se puede normalizar, y no hay que inventarle una.")
check(_nan or _p is None or not _nul or not _mal, "Las filas que no son nulas tienen que quedar divididas entre su propia norma, con norma 1. Con [[3, 0, 4], [0, 0, 0], [0, 5, 12]] tiene que dar [[0,6; 0; 0,8], [0; 0; 0], [0; 0,38; 0,92]].")
`,
          reference: `import numpy as np


def normalizar_filas(E):
    n = np.linalg.norm(E, axis=1, keepdims=True)
    n = np.where(n == 0, 1, n)
    return E / n
`,
        },
        {
          id: 'normalizar.ex02.4',
          type: 'codigo',
          prompt:
            'Con los embeddings normalizados, el coseno de la consulta con cada documento sale de un solo producto de matriz: `En @ qn`, el producto escalar de cada fila de `En` con `qn`. Para comprobar que es el mismo coseno de siempre, `np.allclose(a, b)` dice si dos arrays tienen los mismos valores, salvo errores de redondeo; compararlos con `==` casi nunca da `True` con números decimales.\n\nLa matriz `E` guarda cinco documentos de juguete (inventados y de 3 dimensiones; los reales tienen cientos), uno por fila, y `q` es la consulta. `En` ya tiene las filas normalizadas y `cos_largo` es el coseno calculado con la fórmula completa, sin normalizar nada. Guarda en `qn` la consulta normalizada, en `sim` el producto de `En` por `qn` y en `coinciden` si `sim` y `cos_largo` son iguales.',
          hints: [
            '`qn` es `q` dividido entre su norma. Si `q` no se normaliza, `sim` sale multiplicada por la norma de `q`.',
            '`sim` es el producto de matriz de `En` y `qn`, con el operador `@`; y `coinciden` compara `sim` con `cos_largo` con `np.allclose`.',
          ],
          explain:
            'Al normalizar tanto los documentos como la consulta, el denominador del coseno vale $1$ y solo queda el producto escalar. Si `sim` no coincide con `cos_largo`, mira si has normalizado las dos cosas: las filas ya están normalizadas en `En`, pero la consulta no.',
          solution:
            '`qn = q / np.linalg.norm(q)` da $\\left(\\dfrac23,\\ \\dfrac13,\\ \\dfrac23\\right)$, porque la norma de $(2, 1, 2)$ es $3$. Después, `sim = En @ qn` da los cosenos $(0{,}93;\\ 0{,}89;\\ 0{,}74;\\ 0{,}90;\\ 0{,}95)$, y `coinciden = np.allclose(sim, cos_largo)` es `True`: es el mismo coseno, con el trabajo de las normas hecho de antemano. Es lo que explica por qué los buscadores guardan los vectores normalizados: cada consulta es solo un producto de matriz.',
          starter: `import numpy as np

# Embeddings de juguete (inventados y de 3 dimensiones), uno por fila
E = np.array([[3, 0, 4], [1, 2, 2], [0, 5, 12], [2, 3, 6], [6, 2, 3]])
q = np.array([2, 1, 2])
# Las filas de E, ya normalizadas
En = E / np.linalg.norm(E, axis=1, keepdims=True)
# El coseno con la fórmula completa, sin normalizar nada
cos_largo = (E @ q) / (np.linalg.norm(E, axis=1) * np.linalg.norm(q))
# Calcula qn (la consulta normalizada), sim (En por qn) y coinciden (si sim y cos_largo son iguales)
qn = None
sim = None
coinciden = None
`,
          checks: `_E = np.array([[3, 0, 4], [1, 2, 2], [0, 5, 12], [2, 3, 6], [6, 2, 3]])
_q = np.array([2, 1, 2])
_En = _E / np.linalg.norm(_E, axis=1, keepdims=True)
_qn = _q / np.linalg.norm(_q)
_vq = isinstance(qn, np.ndarray) and qn.shape == (3,) and np.issubdtype(qn.dtype, np.number)
_qigual = _vq and np.allclose(qn, _q)
_qbien = _vq and np.allclose(qn, _qn)
_vs = isinstance(sim, np.ndarray) and sim.shape == (5,) and np.issubdtype(sim.dtype, np.number)
_sbien = _vs and np.allclose(sim, _En @ _qn)
_scrudo = _vs and np.allclose(sim, _E @ _q)
_ssinq = _vs and np.allclose(sim, _En @ _q)
_ssine = _vs and np.allclose(sim, _E @ _qn)
_co = isinstance(coinciden, (bool, np.bool_))
check(_vq, "\`qn\` tiene que ser un array de NumPy con 3 números: la consulta \`q\` dividida entre su norma.")
check(not _qigual, "\`qn\` sigue valiendo lo mismo que \`q\`: falta dividirlo entre su norma.")
check((not _vq) or _qigual or _qbien, "\`qn\` tiene que ser el unitario de \`q\`: la misma dirección, con norma 1. Divide \`q\` entre su norma.")
check(_vs, "\`sim\` tiene que ser un array de NumPy con 5 números, un coseno por documento.")
check(not _scrudo, "\`sim\` vale (14, 8, 29, 19, 20): son los productos escalares de \`E\` y \`q\` sin normalizar. Usa las filas normalizadas \`En\` y la consulta normalizada \`qn\`.")
check(not _ssinq, "\`sim\` sale de multiplicar \`En\` por \`q\` sin normalizar: los cosenos salen multiplicados por la norma de \`q\`, que es 3. Usa \`qn\`.")
check(not _ssine, "\`sim\` sale de multiplicar \`E\` por \`qn\`: faltan las normas de las filas de \`E\`. Usa \`En\`, las filas ya normalizadas.")
check((not _vs) or _sbien or _scrudo or _ssinq or _ssine, "\`sim\` tiene que valer (0,93; 0,89; 0,74; 0,90; 0,95): el producto de matriz de \`En\` y \`qn\`.")
check(_co, "\`coinciden\` tiene que ser un único valor, \`True\` o \`False\`, que diga si \`sim\` y \`cos_largo\` son iguales. Compáralos con \`np.allclose\`.")
check((not _co) or bool(coinciden) or not _sbien, "\`coinciden\` vale \`False\`, pero \`sim\` y \`cos_largo\` son el mismo coseno. Los decimales del ordenador no se redondean igual por dos caminos distintos, y comparar con \`==\` casi nunca da \`True\`: usa \`np.allclose(sim, cos_largo)\`.")
`,
          reference: `import numpy as np

# Embeddings de juguete (inventados y de 3 dimensiones), uno por fila
E = np.array([[3, 0, 4], [1, 2, 2], [0, 5, 12], [2, 3, 6], [6, 2, 3]])
q = np.array([2, 1, 2])
# Las filas de E, ya normalizadas
En = E / np.linalg.norm(E, axis=1, keepdims=True)
# El coseno con la fórmula completa, sin normalizar nada
cos_largo = (E @ q) / (np.linalg.norm(E, axis=1) * np.linalg.norm(q))
qn = q / np.linalg.norm(q)
sim = En @ qn
coinciden = np.allclose(sim, cos_largo)
`,
        },
        {
          id: 'normalizar.ex02.5',
          type: 'codigo',
          prompt:
            'Con vectores normalizados, ordenar por distancia, por coseno o por producto escalar da el mismo orden, porque $\\lVert\\vec{q}-\\vec{d}\\rVert^2=2-2\\cos\\theta$. Vamos a comprobarlo con los mismos cinco documentos de juguete (inventados y de 3 dimensiones; los reales tienen cientos). `En` y `qn` ya están normalizados.\n\n`np.linalg.norm(En - qn, axis=1)` da la distancia de `qn` a cada fila de `En`. `np.argsort(x)` devuelve las posiciones que ordenarían `x` de menor a mayor, y añadir `[::-1]` le da la vuelta. `np.array_equal(a, b)` dice si dos arrays tienen la misma forma y los mismos valores.\n\nGuarda en `dist` la distancia de `qn` a cada documento; en `orden_dist`, las posiciones de los documentos del más cercano al más lejano; en `orden_cos`, las posiciones del mayor al menor producto escalar con `qn`; y en `mismo`, si los dos órdenes son iguales.',
          hints: [
            '`orden_dist` es `np.argsort` aplicado a `dist`, sin darle la vuelta: la menor distancia va primero.',
            '`orden_cos` es `np.argsort` del producto escalar `En @ qn`, pero ahora el mayor va primero: hace falta `[::-1]`.',
            'Si `orden_dist` y `orden_cos` no son iguales, mira si has usado `En` y `qn` en las dos, y no `E` y `q`.',
          ],
          explain:
            'Las dos listas ordenan los mismos documentos con criterios opuestos: la distancia, de menos a más, y el producto escalar, de más a menos. Si no coinciden, revisa qué extremo de cada lista debe ser el primero y con qué vectores calculas cada medida.',
          solution:
            'Las distancias de `qn` a los documentos son $(0{,}26;\\ 0{,}33;\\ 0{,}72;\\ 0{,}31;\\ 0{,}22)$, y los productos escalares, $(0{,}93;\\ 0{,}89;\\ 0{,}74;\\ 0{,}90;\\ 0{,}95)$: la distancia crece justo cuando baja el producto escalar. Por eso `np.argsort(dist)` y `np.argsort(En @ qn)[::-1]` dan lo mismo, `[4, 0, 3, 1, 2]`, y `mismo` es `True`. Con los vectores sin normalizar no sería así: por producto escalar sin normalizar, el documento 2, el más largo, saldría el primero, y por distancia, el último.',
          starter: `import numpy as np

# Embeddings de juguete (inventados y de 3 dimensiones), uno por fila
E = np.array([[3, 0, 4], [1, 2, 2], [0, 5, 12], [2, 3, 6], [6, 2, 3]])
q = np.array([2, 1, 2])
En = E / np.linalg.norm(E, axis=1, keepdims=True)
qn = q / np.linalg.norm(q)
# Calcula dist (distancia de qn a cada fila de En), orden_dist (de más cerca a más lejos),
# orden_cos (de mayor a menor producto escalar) y mismo (si los dos órdenes son iguales)
dist = None
orden_dist = None
orden_cos = None
mismo = None
`,
          checks: `_E = np.array([[3, 0, 4], [1, 2, 2], [0, 5, 12], [2, 3, 6], [6, 2, 3]])
_q = np.array([2, 1, 2])
_En = _E / np.linalg.norm(_E, axis=1, keepdims=True)
_qn = _q / np.linalg.norm(_q)
_d = np.linalg.norm(_En - _qn, axis=1)
_bien = np.array([4, 0, 3, 1, 2])
_inv = np.array([2, 1, 3, 0, 4])
_crudo = np.array([2, 4, 3, 0, 1])


def _arr(x):
    return np.asarray(x) if isinstance(x, (np.ndarray, list, tuple)) else None


def _pos(x):
    return x is not None and x.shape == (5,) and np.issubdtype(x.dtype, np.integer)


_od = _arr(orden_dist)
_oc = _arr(orden_cos)
_vd = isinstance(dist, np.ndarray) and dist.shape == (5,) and np.issubdtype(dist.dtype, np.number)
_dbien = _vd and np.allclose(dist, _d)
_dcrudo = _vd and np.allclose(dist, np.linalg.norm(_E - _q, axis=1))
_dcuad = _vd and np.allclose(dist, _d ** 2)
_odok = _pos(_od)
_ocok = _pos(_oc)
_mi = isinstance(mismo, (bool, np.bool_))
check(_vd, "\`dist\` tiene que ser un array de NumPy con 5 números, una distancia por documento.")
check(not _dcrudo, "\`dist\` es la distancia entre \`E\` y \`q\`, sin normalizar. Aquí hay que medir la distancia entre los vectores normalizados, \`En\` y \`qn\`.")
check(not _dcuad, "\`dist\` es la distancia al cuadrado: falta la raíz cuadrada. La distancia es la norma de la diferencia, tal cual la da \`np.linalg.norm\`.")
check((not _vd) or _dbien or _dcrudo or _dcuad, "\`dist\` tiene que valer (0,26; 0,33; 0,72; 0,31; 0,22): la norma de cada fila de \`En - qn\`.")
check(_odok, "\`orden_dist\` tiene que ser un array de NumPy con 5 posiciones, una por documento (números enteros del 0 al 4).")
check((not _odok) or not np.array_equal(_od, _inv), "\`orden_dist\` empieza por el documento más lejano: \`np.argsort\` ya ordena de menor a mayor, que es lo que se quiere con distancias. No hace falta darle la vuelta.")
check((not _odok) or _dcrudo or np.array_equal(_od, _bien) or np.array_equal(_od, _inv), "\`orden_dist\` tiene que ser [4, 0, 3, 1, 2]: las posiciones de los documentos de menor a mayor distancia a \`qn\`.")
check(_ocok, "\`orden_cos\` tiene que ser un array de NumPy con 5 posiciones, una por documento (números enteros del 0 al 4).")
check((not _ocok) or not np.array_equal(_oc, _inv), "\`orden_cos\` empieza por el documento menos parecido: \`np.argsort\` ordena de menor a mayor. Dale la vuelta para que empiece por el mayor producto escalar.")
check((not _ocok) or not np.array_equal(_oc, _crudo), "\`orden_cos\` es el que sale ordenando el producto escalar sin normalizar: el documento 2, que es el más largo, se cuela el primero. Usa \`En\` y \`qn\`.")
check((not _ocok) or np.array_equal(_oc, _bien) or np.array_equal(_oc, _inv) or np.array_equal(_oc, _crudo), "\`orden_cos\` tiene que ser [4, 0, 3, 1, 2]: las posiciones de los documentos de mayor a menor producto escalar con \`qn\`.")
check(_mi, "\`mismo\` tiene que ser un único valor, \`True\` o \`False\`, que diga si \`orden_dist\` y \`orden_cos\` son iguales. Compáralos con \`np.array_equal\`.")
check((not _mi) or bool(mismo) or not (_odok and _ocok and np.array_equal(_od, _bien) and np.array_equal(_oc, _bien)), "\`mismo\` vale \`False\`, pero \`orden_dist\` y \`orden_cos\` son la misma lista. Compáralas con \`np.array_equal(orden_dist, orden_cos)\`.")
`,
          reference: `import numpy as np

# Embeddings de juguete (inventados y de 3 dimensiones), uno por fila
E = np.array([[3, 0, 4], [1, 2, 2], [0, 5, 12], [2, 3, 6], [6, 2, 3]])
q = np.array([2, 1, 2])
En = E / np.linalg.norm(E, axis=1, keepdims=True)
qn = q / np.linalg.norm(q)
dist = np.linalg.norm(En - qn, axis=1)
orden_dist = np.argsort(dist)
orden_cos = np.argsort(En @ qn)[::-1]
mismo = np.array_equal(orden_dist, orden_cos)
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'normalizar.hoja.1',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento normaliza el vector $\\vec{v}=(6, -8)$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Un vector unitario tiene norma $1$. ¿Cumple eso el resultado?',
        'Compara el paso que produce el resultado con la definición: $\\hat{v}=\\dfrac{\\vec{v}}{\\lVert\\vec{v}\\rVert}$.',
      ],
      explain:
        'Mira la norma del resultado: un vector normalizado tiene que medir $1$. Después revisa qué se divide entre qué en el paso que lo produce.',
      solution:
        'La segunda línea está mal: se divide entre $\\lVert\\vec{v}\\rVert^2=100$ y no entre $\\lVert\\vec{v}\\rVert=10$. Lo correcto es $\\hat{v}=\\dfrac{(6, -8)}{10}=(0{,}6;\\ -0{,}8)$, que mide $1$. La comprobación final ya lo delataba: el resultado erróneo mide $0{,}1$, la inversa de la norma.',
      lines: [
        '‖v‖ = √(6² + (−8)²) = √100 = 10',
        'v̂ = v / ‖v‖² = (6, −8) / 100',
        'v̂ = (0,06; −0,08)',
        'Comprobación: ‖v̂‖ = √(0,06² + 0,08²) = 0,1',
      ],
      faultyLine: 1,
    },
    {
      id: 'normalizar.hoja.2',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien normaliza las filas de la matriz `E`, con embeddings de juguete (inventados y de tres componentes; los reales tienen cientos), y después comprueba la norma de cada fila (NumPy ya está importado como `np`). El programa se ejecuta sin errores. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Calcula a mano la primera fila de `En` y compárala con $(0{,}6;\\ 0;\\ 0{,}8)$.',
        'Fíjate en la forma de `normas` y en cómo alinea NumPy los ejes al dividir una matriz entre ella.',
      ],
      explain:
        'Un programa sin errores puede estar mal. Revisa qué hace con los ejes de la matriz cada paso, y comprueba el resultado de la comprobación final: ¿miden 1 las filas?',
      solution:
        'La línea de `En` está mal. `normas` es un array de tres números, y al dividir NumPy lo alinea con el último eje de `E`, el de las columnas: cada columna se divide entre la norma de una fila distinta, y las filas de `En` no miden 1. Con `keepdims=True` la norma se conserva como una columna de 3 filas y 1 columna, y cada fila se divide entre la suya: `En = E / np.linalg.norm(E, axis=1, keepdims=True)`. Como `E` es cuadrada no hay error, solo un resultado incorrecto; con otra forma, el programa habría fallado.',
      lines: [
        'E = np.array([[3, 0, 4], [1, 2, 2], [0, 5, 12]])',
        'normas = np.linalg.norm(E, axis=1)',
        'En = E / normas',
        'print(np.linalg.norm(En, axis=1))',
      ],
      faultyLine: 2,
    },
    {
      id: 'normalizar.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula la distancia entre los vectores unitarios $\\vec{u}=(0{,}6;\\ 0{,}8)$ y $\\vec{v}=(0{,}8;\\ 0{,}6)$ a partir de su producto escalar. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Calcula tú el producto escalar y compáralo con el de la primera línea.',
        'Comprueba el resultado final restando las componentes de los dos vectores.',
      ],
      explain:
        'Revisa cada paso: ¿el producto escalar está bien calculado? ¿Se usa que las normas valen $1$ donde corresponde? Después comprueba el resultado por otro camino.',
      solution:
        'No hay ningún error. $\\vec{u}\\cdot\\vec{v}=0{,}96$ y, como las normas valen $1$, $\\lVert\\vec{u}-\\vec{v}\\rVert^2=2-2\\cdot0{,}96=0{,}08$. Se comprueba restando: $\\vec{u}-\\vec{v}=(-0{,}2;\\ 0{,}2)$ y su norma es $\\sqrt{0{,}08}\\approx0{,}28$. Con un producto escalar menor, de $0{,}6$, la distancia sube a $\\sqrt{0{,}8}\\approx0{,}89$: al bajar el coseno, la distancia crece.',
      lines: [
        'u · v = 0,6·0,8 + 0,8·0,6 = 0,96',
        '‖u − v‖² = ‖u‖² + ‖v‖² − 2 u · v = 1 + 1 − 2·0,96',
        '‖u − v‖² = 0,08, así que ‖u − v‖ = √0,08 ≈ 0,28',
        'Con u · v = 0,6 sería √(2 − 1,2) = √0,8 ≈ 0,89: al bajar el coseno, la distancia crece',
      ],
      faultyLine: null,
    },
  ],
};
