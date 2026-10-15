import type { PlaneSpec, PlaneVector, Project } from '../../content/schema';
import { toy } from './toy';

/** Plano del proyecto: rango 6 y rejilla de 1 en 1, salvo que se diga otra cosa. */
const plane = (
  vectors: PlaneVector[],
  readouts: PlaneSpec['readouts'],
  pair?: [string, string],
  range = 6,
  snap = 1,
): PlaneSpec => ({ range, snap, vectors, readouts, ...(pair ? { pair } : {}) });

/** Un vector del plano, móvil o fijo. */
const arrow = (
  id: string,
  [x, y]: readonly [number, number],
  movable: boolean,
  label: string = id,
): PlaneVector => ({ id, label, x, y, movable });

/** Segundo proyecto de la Órbita 1: el coseno mide el ángulo, es decir, la dirección. */
export const coseno: Project = {
  id: 'coseno',
  name: 'Coseno',
  sub: 'Similitud por la dirección',
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'coseno.ex00.1',
          type: 'manipular',
          prompt:
            'El **producto escalar** de dos vectores es $\\vec{a}\\cdot\\vec{b}=a_1b_1+a_2b_2$, y vale cero cuando son perpendiculares. A partir de él se define el **coseno** del ángulo $\\theta$ que forman: $\\cos\\theta=\\dfrac{\\vec{a}\\cdot\\vec{b}}{\\lVert\\vec{a}\\rVert\\,\\lVert\\vec{b}\\rVert}$. El denominador es siempre positivo, así que el signo del coseno es el del producto escalar.\n\nDos vectores son **perpendiculares** (u **ortogonales**) cuando forman $90^\\circ$, y entonces $\\cos\\theta=0$. El vector $\\vec{u}$ está fijo en $(3, 2)$. Mueve la punta de $\\vec{w}$ hasta que forme $90^\\circ$ con $\\vec{u}$. Las lecturas te dan en cada momento el producto escalar, el coseno y el ángulo.',
          hints: [
            'Mira la lectura del ángulo mientras arrastras la punta de $\\vec{w}$.',
            'Perpendicular quiere decir producto escalar cero: $3w_1+2w_2=0$. Elige un valor para $w_1$ y despeja $w_2$.',
          ],
          explain:
            'Con $90^\\circ$ el coseno vale $0$, y eso solo ocurre si el producto escalar vale $0$. La condición que buscas es $3w_1+2w_2=0$: las componentes de $\\vec{w}$ tienen que compensarse.',
          solution:
            'El producto escalar es $\\vec{u}\\cdot\\vec{w}=3w_1+2w_2$ y debe valer $0$. Con $\\vec{w}=(-2, 3)$: $3\\cdot(-2)+2\\cdot3=0$, luego $\\cos\\theta=0$ y $\\theta=90^\\circ$. También sirve $(2, -3)$, que apunta al lado contrario.',
          plane: plane(
            [arrow('u', [3, 2], false), arrow('w', [1, 1], true)],
            ['components', 'dot', 'cos', 'angle'],
            ['u', 'w'],
          ),
          goals: [{ metric: 'angle', of: ['u', 'w'], target: 90, tol: 0.01 }],
        },
        {
          id: 'coseno.ex00.2',
          type: 'manipular',
          prompt:
            'Un ángulo de $45^\\circ$ es la mitad de uno recto, y su coseno es $\\dfrac{\\sqrt2}{2}\\approx0{,}71$. El vector $\\vec{u}$ está fijo en $(4, 0)$, sobre el eje horizontal. Lleva $\\vec{w}$ a un ángulo de $45^\\circ$ con $\\vec{u}$, con su segunda componente igual a $3$. Compara la lectura del coseno con ese valor.',
          hints: [
            'Con $\\vec{u}$ sobre el eje horizontal, el ángulo de $\\vec{w}$ con $\\vec{u}$ es el que forma con ese eje.',
            'Una flecha a $45^\\circ$ del eje horizontal avanza lo mismo en horizontal que en vertical.',
          ],
          explain:
            'Un ángulo de $45^\\circ$ es el de la diagonal: la flecha avanza tanto en horizontal como en vertical. La segunda condición fija cuánto mide.',
          solution:
            '$\\vec{w}=(3, 3)$ forma $45^\\circ$ con el eje horizontal. Comprobación: $\\vec{u}\\cdot\\vec{w}=4\\cdot3+0\\cdot3=12$, $\\lVert\\vec{u}\\rVert=4$ y $\\lVert\\vec{w}\\rVert=\\sqrt{18}=3\\sqrt2$, así que $\\cos\\theta=\\dfrac{12}{4\\cdot3\\sqrt2}=\\dfrac{1}{\\sqrt2}\\approx0{,}71$.',
          plane: plane(
            [arrow('u', [4, 0], false), arrow('w', [1, 2], true)],
            ['components', 'cos', 'angle'],
            ['u', 'w'],
          ),
          goals: [
            { metric: 'angle', of: ['u', 'w'], target: 45, tol: 0.01 },
            { metric: 'y', of: ['w'], target: 3, tol: 0.01 },
          ],
        },
        {
          id: 'coseno.ex00.3',
          type: 'manipular',
          prompt:
            'Cuando el ángulo pasa de $90^\\circ$, el coseno es negativo, y el producto escalar también. El caso extremo son dos flechas en **sentidos opuestos**: forman $180^\\circ$ y $\\cos180^\\circ=-1$.\n\nEl vector $\\vec{u}$ está fijo en $(2, 3)$. Lleva $\\vec{w}$ a un coseno de $-1$ con $\\vec{u}$.',
          hints: [
            'Un coseno de $-1$ es un ángulo de $180^\\circ$: $\\vec{w}$ apunta justo al lado contrario que $\\vec{u}$.',
            'Un vector con el sentido contrario es un múltiplo negativo de $\\vec{u}$. Empieza por el opuesto de $\\vec{u}$.',
          ],
          explain:
            'El coseno vale $-1$ solo cuando las dos flechas están sobre la misma recta y apuntan a lados contrarios. No basta con que el producto escalar sea negativo: tiene que serlo todo lo que permiten las longitudes.',
          solution:
            '$\\vec{w}=-\\vec{u}=(-2, -3)$. Entonces $\\vec{u}\\cdot\\vec{w}=-4-9=-13$ y $\\lVert\\vec{u}\\rVert\\,\\lVert\\vec{w}\\rVert=\\sqrt{13}\\cdot\\sqrt{13}=13$, así que $\\cos\\theta=-1$. También sirve $(-4, -6)$, otro múltiplo negativo de $\\vec{u}$.',
          plane: plane(
            [arrow('u', [2, 3], false), arrow('w', [1, -2], true)],
            ['components', 'dot', 'cos', 'angle'],
            ['u', 'w'],
          ),
          goals: [{ metric: 'cos', of: ['u', 'w'], target: -1, tol: 0.01 }],
        },
        {
          id: 'coseno.ex00.4',
          type: 'manipular',
          prompt:
            'Al multiplicar un vector por un número positivo $k$, el factor $k$ aparece en el numerador del coseno (en el producto escalar) y en el denominador (en la norma), y se cancela. Por eso el coseno **no depende de la longitud**, solo de la dirección y el sentido.\n\nEl vector $\\vec{v}$ está fijo en $(3, 4)$ y mide $5$. Lleva $\\vec{w}$ a un coseno de $1$ con $\\vec{v}$ pero con norma $10$, el doble. El plano de este ejercicio llega hasta $10$.',
          hints: [
            'Un coseno de $1$ es un ángulo de $0^\\circ$: $\\vec{w}$ apunta igual que $\\vec{v}$.',
            'Un múltiplo positivo de $\\vec{v}$ apunta igual que $\\vec{v}$. Elige el que mide $10$.',
          ],
          explain:
            'Para que el coseno sea $1$ solo cuenta hacia dónde apunta $\\vec{w}$. La longitud la fija la otra condición: la norma de $\\vec{w}$ tiene que ser distinta de la de $\\vec{v}$.',
          solution:
            'La norma de $\\vec{v}$ es $5$, así que $\\vec{w}=2\\vec{v}=(6, 8)$ mide $10$. Su coseno con $\\vec{v}$ es $\\dfrac{3\\cdot6+4\\cdot8}{5\\cdot10}=\\dfrac{50}{50}=1$. Con cualquier otro múltiplo positivo de $\\vec{v}$ el coseno seguiría siendo $1$.',
          plane: plane(
            [arrow('v', [3, 4], false), arrow('w', [2, 1], true)],
            ['components', 'norm', 'cos', 'angle'],
            ['v', 'w'],
            10,
            1,
          ),
          goals: [
            { metric: 'cos', of: ['v', 'w'], target: 1, tol: 0.001 },
            { metric: 'norm', of: ['w'], target: 10, tol: 0.01 },
          ],
        },
        {
          id: 'coseno.ex00.5',
          type: 'manipular',
          prompt:
            'Este mapa es un juguete **inventado** de dos dimensiones, para poder dibujarlo: los embeddings reales tienen cientos de dimensiones. Un buscador semántico mide lo parecida que es una consulta a cada documento con la **similitud coseno**, el coseno del ángulo entre sus embeddings: $1$ es la misma dirección (muy parecidos), $0$ es perpendicular (nada en común) y $-1$ son opuestos.\n\nLos documentos «gato» $(3, 4)$ y «lobo» $(4, -2)$ están fijos. Coloca la consulta $\\vec{q}$ con una similitud de $0{,}96$ con «gato»: muy parecida, pero no idéntica. La lectura compara $\\vec{q}$ con «gato».',
          hints: [
            'Mira el coseno mientras mueves $\\vec{q}$: buscas $0{,}96$, no $1$.',
            'El coseno no depende de la longitud de $\\vec{q}$, solo de su dirección. Prueba con $(4, 3)$ y mira qué coseno tiene con «gato».',
          ],
          explain:
            'Una similitud de $1$ es la misma dirección; $0{,}96$ es un ángulo pequeño, de unos $16^\\circ$, pero no nulo. Prueba posiciones cerca de «gato» y observa cómo cambia la lectura.',
          solution:
            '$\\vec{q}=(4, 3)$: $\\vec{q}\\cdot\\vec{g}=4\\cdot3+3\\cdot4=24$ y las dos normas valen $5$, así que $\\cos\\theta=\\dfrac{24}{25}=0{,}96$. Es el embedding de «perro»: una consulta que apunta como «perro» encuentra «gato» muy parecido. Con «lobo» el coseno es $\\dfrac{10}{5\\cdot\\sqrt{20}}\\approx0{,}45$, mucho menor.',
          plane: plane(
            [
              arrow('gato', toy['gato']!, false),
              arrow('lobo', toy['lobo']!, false),
              arrow('q', [-2, 1], true),
            ],
            ['components', 'cos', 'angle'],
            ['q', 'gato'],
          ),
          goals: [{ metric: 'cos', of: ['q', 'gato'], target: 0.96, tol: 0.001 }],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'coseno.ex01.1',
          type: 'numero',
          prompt:
            'El producto escalar de $\\vec{a}$ y $\\vec{b}$ es $a_1b_1+a_2b_2$, y el coseno del ángulo que forman es ese producto dividido entre el producto de las normas: $\\cos\\theta=\\dfrac{\\vec{a}\\cdot\\vec{b}}{\\lVert\\vec{a}\\rVert\\,\\lVert\\vec{b}\\rVert}$. Calcula el coseno del ángulo entre $\\vec{a}=(3, 4)$ y $\\vec{b}=(4, 3)$, con los decimales que hagan falta.',
          hints: [
            'Empieza por el numerador: $3\\cdot4+4\\cdot3$.',
            'Las dos normas son iguales y son números enteros: $\\sqrt{3^2+4^2}$.',
          ],
          explain:
            'El coseno es el producto escalar dividido entre el **producto** de las dos normas, no entre su suma. Un coseno vale siempre entre $-1$ y $1$: úsalo para comprobar el resultado.',
          solution:
            '$\\vec{a}\\cdot\\vec{b}=3\\cdot4+4\\cdot3=24$ y $\\lVert\\vec{a}\\rVert=\\lVert\\vec{b}\\rVert=\\sqrt{25}=5$, así que $\\cos\\theta=\\dfrac{24}{5\\cdot5}=\\dfrac{24}{25}=0{,}96$.',
          answer: 0.96,
          tol: 0.005,
        },
        {
          id: 'coseno.ex01.2',
          type: 'numero',
          prompt:
            'Algunos cosenos son **notables**: $\\cos30^\\circ=\\dfrac{\\sqrt3}{2}$, $\\cos45^\\circ=\\dfrac{\\sqrt2}{2}$, $\\cos60^\\circ=\\dfrac12$ y $\\cos90^\\circ=0$. Para pasar del coseno al ángulo se usa la función inversa, el arcocoseno. Calcula, en grados, el ángulo entre $\\vec{a}=(1, 1)$ y $\\vec{b}=(0, 3)$.',
          hints: [
            'Calcula primero el coseno con la fórmula y simplifica la raíz.',
            '$\\dfrac{1}{\\sqrt2}=\\dfrac{\\sqrt2}{2}$. Búscalo en la lista de cosenos notables.',
          ],
          explain:
            'Con el coseno en la mano, el ángulo es el que lo tiene como coseno. Aquí no hace falta calculadora: tras simplificar la raíz sale uno de los cosenos notables de la lista.',
          solution:
            '$\\vec{a}\\cdot\\vec{b}=1\\cdot0+1\\cdot3=3$, $\\lVert\\vec{a}\\rVert=\\sqrt2$ y $\\lVert\\vec{b}\\rVert=3$. Entonces $\\cos\\theta=\\dfrac{3}{3\\sqrt2}=\\dfrac{1}{\\sqrt2}=\\dfrac{\\sqrt2}{2}$, el coseno de $45^\\circ$: $\\theta=45^\\circ$. Tiene sentido en el dibujo: $\\vec{a}$ es la diagonal y $\\vec{b}$ va por el eje vertical.',
          answer: 45,
          tol: 0.5,
        },
        {
          id: 'coseno.ex01.3',
          type: 'opcion',
          prompt:
            'Sea $\\vec{u}$ un vector cualquiera que no sea el vector nulo. ¿Cuánto vale el coseno del ángulo entre $\\vec{u}$ y $3\\vec{u}$?',
          hints: [
            '$3\\vec{u}$ apunta igual que $\\vec{u}$, pero es tres veces más larga.',
            'Escribe el numerador y el denominador de la fórmula con $3\\vec{u}$ y mira qué se simplifica.',
          ],
          explain:
            'Escalar por un número positivo no cambia la dirección, y el coseno solo mira la dirección. Aplica la fórmula: el factor de escala aparece en el numerador y también en el denominador.',
          solution:
            'El numerador es $\\vec{u}\\cdot3\\vec{u}=3\\lVert\\vec{u}\\rVert^2$ y el denominador, $\\lVert\\vec{u}\\rVert\\cdot\\lVert3\\vec{u}\\rVert=3\\lVert\\vec{u}\\rVert^2$. El cociente es $1$: forman un ángulo de $0^\\circ$. El $3$ del producto escalar se compensa con el $3$ de la norma. El producto escalar sí se triplica, pero no es el coseno.',
          options: ['$3$', '$\\dfrac13$', '$1$', 'Depende de cuál sea $\\vec{u}$'],
          correct: 2,
        },
        {
          id: 'coseno.ex01.4',
          type: 'opcion',
          prompt:
            'Un buscador tiene la consulta $\\vec{q}=(1, 1)$ y dos documentos de juguete (inventados y de dos dimensiones; los reales tienen cientos): el «apunte» $\\vec{A}=(2, 0)$, corto y de otro tema, y el «tratado» $\\vec{B}=(5, 5)$, largo y del mismo tema que la consulta. Si ordena por **similitud coseno**, gana el documento con mayor coseno; si ordena por **distancia euclídea**, gana el de menor distancia. ¿Cuál gana con cada criterio?',
          hints: [
            'Calcula, para cada documento, el coseno con la consulta y la distancia a la consulta.',
            'El «tratado» apunta exactamente como la consulta, solo que está cinco veces más lejos del origen.',
          ],
          explain:
            'La distancia castiga a un documento por ser largo aunque trate del mismo tema; el coseno solo mira hacia dónde apunta. Calcula las dos medidas con cada documento antes de elegir.',
          solution:
            'Con el apunte: $\\cos\\theta=\\dfrac{2}{\\sqrt2\\cdot2}\\approx0{,}71$ y la distancia es $\\lVert(-1, 1)\\rVert=\\sqrt2\\approx1{,}41$. Con el tratado: $\\cos\\theta=\\dfrac{10}{\\sqrt2\\cdot\\sqrt{50}}=1$ y la distancia es $\\lVert(-4, -4)\\rVert=\\sqrt{32}\\approx5{,}66$. Por coseno gana el «tratado», y por distancia, el «apunte». Para buscar por tema suele convenir el coseno, porque la longitud de un documento no dice de qué trata.',
          options: [
            'Gana el «apunte» con los dos criterios',
            'Por coseno gana el «tratado»; por distancia, el «apunte»',
            'Por coseno gana el «apunte»; por distancia, el «tratado»',
            'Gana el «tratado» con los dos criterios',
          ],
          correct: 1,
        },
        {
          id: 'coseno.ex01.5',
          type: 'numero',
          prompt:
            'Muchos sistemas guardan los embeddings **normalizados**, con norma $1$. Entonces el denominador del coseno vale $1\\cdot1=1$ y el coseno es solo el producto escalar. Dos embeddings de juguete (inventados y de dos dimensiones; los reales tienen cientos) ya son unitarios: $\\hat{a}=(0{,}6;\\ 0{,}8)$ y $\\hat{b}=(-0{,}6;\\ 0{,}8)$. Calcula su coseno.',
          hints: [
            'Comprueba que son unitarios: $0{,}6^2+0{,}8^2=1$. Si lo son, el denominador no hace falta.',
            'Calcula solo el producto escalar: $-0{,}6\\cdot0{,}6+0{,}8\\cdot0{,}8$.',
          ],
          explain:
            'Con vectores unitarios las dos normas valen $1$ y no cambian nada: el coseno es directamente el producto escalar. Cuida los signos al multiplicar la primera pareja de componentes.',
          solution:
            'Las dos normas valen $1$, así que $\\cos\\theta=\\hat{a}\\cdot\\hat{b}=-0{,}6\\cdot0{,}6+0{,}8\\cdot0{,}8=-0{,}36+0{,}64=0{,}28$. Es el mismo resultado que dividir el producto escalar de $(3, 4)$ y $(-3, 4)$, que es $7$, entre $5\\cdot5$.',
          answer: 0.28,
          tol: 0.005,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'coseno.ex02.1',
          type: 'codigo',
          prompt:
            'Una **función** guarda un cálculo para repetirlo con otros datos. Se define con `def`, su cuerpo va sangrado y `return` dice qué devuelve. Un ejemplo con otra tarea, la media de dos números:\n\n```python\ndef media(x, y):\n    return (x + y) / 2\n```\n\nDespués, `media(4, 6)` da `5`. NumPy calcula el producto escalar con `np.dot(a, b)` y la norma con `np.linalg.norm(a)`. Completa la función `coseno(a, b)` para que devuelva el coseno del ángulo entre los vectores `a` y `b`.',
          hints: [
            'Dentro de la función, el numerador es `np.dot(a, b)` y el denominador es el producto de las dos normas.',
            'Cuidado con los paréntesis: dividir entre `x * y` no es lo mismo que dividir entre `x` y después multiplicar por `y`.',
          ],
          explain:
            'El coseno es un cociente: arriba, el producto escalar; abajo, el producto de las dos normas. Pruébalo con un caso que conozcas, como dos vectores perpendiculares, que tienen que dar $0$.',
          solution:
            'El cuerpo de la función es `return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))`. Con `a = np.array([3, 4])` y `b = np.array([4, 3])`, el producto escalar es $24$ y las dos normas valen $5$, así que devuelve $0{,}96$. Los paréntesis agrupan las dos normas en el denominador.',
          starter: `import numpy as np


def coseno(a, b):
    # Devuelve el coseno del ángulo entre a y b
    return None
`,
          checks: `_f = coseno


def _llamar(a, b):
    try:
        r = _f(np.array(a), np.array(b))
    except BaseException:
        return None
    if isinstance(r, (int, float, np.number)) and not isinstance(r, bool):
        return float(r)
    if isinstance(r, np.ndarray) and r.ndim == 0 and np.issubdtype(r.dtype, np.number):
        return float(r)
    return None


_casos = [((3, 4), (4, 3), 0.96), ((2, 0), (0, 3), 0.0), ((1, 1), (2, 0), 0.7071067811865476), ((1, 2), (-2, -4), -1.0)]
_r = [_llamar(a, b) for a, b, _e in _casos]
_hay = _r[0] is not None
_dot = _hay and abs(_r[0] - 24) < 1e-9
_una = _hay and abs(_r[0] - 4.8) < 1e-9
_pasa = any(r is not None and abs(r) > 1 + 1e-9 for r in _r)
check(_hay, "\`coseno(a, b)\` tiene que devolver un número, el coseno. Prueba con \`a = np.array([3, 4])\` y \`b = np.array([4, 3])\`: si no devuelve nada, falta el \`return\`; si da un error, revisa la fórmula.")
check(not _dot, "Con \`a = (3, 4)\` y \`b = (4, 3)\` tu función devuelve 24, que es el producto escalar: falta dividir entre el producto de las dos normas. Si ya divides, comprueba los paréntesis: \`x / n1 * n2\` divide solo entre \`n1\`.")
check(not _una, "Con \`a = (3, 4)\` y \`b = (4, 3)\` tu función devuelve 4,8: has dividido solo entre una de las normas. El denominador es el producto de las dos.")
check(not _pasa or _dot or _una, "Tu función devuelve un valor mayor que 1 o menor que -1, y un coseno siempre está entre los dos. Revisa que divides entre el producto de las dos normas y que los paréntesis las agrupan.")
check((not _hay) or _dot or _una or _pasa or all(r is not None and abs(r - e) < 1e-6 for r, (_a, _b, e) in zip(_r, _casos)), "Tu función no da el coseno correcto en todos los casos. Con \`a = (3, 4)\` y \`b = (4, 3)\` tiene que dar 0,96; con dos vectores perpendiculares como \`(2, 0)\` y \`(0, 3)\`, 0; y con \`(1, 2)\` y \`(-2, -4)\`, que son opuestos, -1.")
`,
          reference: `import numpy as np


def coseno(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
`,
        },
        {
          id: 'coseno.ex02.2',
          type: 'codigo',
          prompt:
            'Para volver del coseno al ángulo se usa el **arcocoseno**: `np.arccos(c)` devuelve el ángulo en radianes y `np.degrees(x)` pasa de radianes a grados. Hay un detalle: por errores de redondeo, el coseno de dos vectores paralelos puede salir `1.0000000000000002`, y `np.arccos` solo está definido entre $-1$ y $1$; fuera de ese rango da `nan`, que significa «no es un número». `np.clip(c, -1, 1)` fuerza el valor `c` a ese rango.\n\nLa función `coseno` ya está escrita. Completa `angulo(a, b)` para que devuelva el ángulo entre los vectores `a` y `b`, en grados.',
          hints: [
            'Empieza por el coseno de `a` y `b`, con la función que ya tienes.',
            'Encadena las tres funciones de dentro hacia fuera: primero el recorte, después el arcocoseno y, al final, la conversión a grados.',
            'Prueba tu función con `a = np.array([2, 5])` y `b = np.array([6, 15])`, que son paralelos: tiene que dar 0 y no `nan`.',
          ],
          explain:
            'El ángulo sale del coseno en tres pasos: asegurar que el valor está en el rango válido, aplicar la función inversa y convertir de radianes a grados. Si te sale `nan` con vectores paralelos u opuestos, el coseno se ha pasado de 1 por redondeo.',
          solution:
            'El cuerpo es `return np.degrees(np.arccos(np.clip(coseno(a, b), -1, 1)))`: se calcula el coseno, se recorta a $[-1, 1]$, el arcocoseno da el ángulo en radianes y `np.degrees` lo pasa a grados. Con $(1, 2)$ y $(2, 1)$ el coseno es $0{,}8$ y el ángulo, $\\approx36{,}87^\\circ$. Sin el recorte, vectores paralelos como $(2, 5)$ y $(6, 15)$ darían `nan`.',
          starter: `import numpy as np


def coseno(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def angulo(a, b):
    # Devuelve el ángulo entre a y b, en grados
    return None
`,
          checks: `_f = angulo


def _llamar(a, b):
    try:
        r = _f(np.array(a), np.array(b))
    except BaseException:
        return None
    if isinstance(r, (int, float, np.number)) and not isinstance(r, bool):
        return float(r)
    if isinstance(r, np.ndarray) and r.ndim == 0 and np.issubdtype(r.dtype, np.number):
        return float(r)
    return None


_casos = [((1, 2), (2, 1), 36.86989764584402), ((1, 0), (0, 2), 90.0), ((1, 1), (0, 3), 45.0), ((2, 5), (6, 15), 0.0), ((2, 5), (-2, -5), 180.0)]
_r = [_llamar(a, b) for a, b, _e in _casos]
_hay = all(r is not None for r in _r)
_nan = any(r is not None and r != r for r in _r)
_rad = _r[1] is not None and abs(_r[1] - 1.5707963267948966) < 1e-4
check(_r[0] is not None, "\`angulo(a, b)\` tiene que devolver un número, el ángulo en grados. Prueba con \`a = np.array([1, 2])\` y \`b = np.array([2, 1])\`: si no devuelve nada, falta el \`return\`; si da un error, revisa las funciones que encadenas.")
check(not _rad, "Con \`a = (1, 0)\` y \`b = (0, 2)\` tu función devuelve 1,57: es el ángulo en radianes. Falta pasarlo a grados con \`np.degrees\`.")
check(not _nan, "Tu función devuelve \`nan\` en algún caso. Pasa con vectores paralelos u opuestos, como \`(2, 5)\` y \`(6, 15)\`: por redondeo el coseno se pasa un poco de 1 (o de -1) y \`np.arccos\` no está definido fuera de ese rango. Recorta el coseno con \`np.clip\` antes del arcocoseno.")
check((not _hay) or _nan or _rad or all(abs(r - e) < 1e-3 for r, (_a, _b, e) in zip(_r, _casos)), "Tu función no da el ángulo correcto en todos los casos. Con \`(1, 2)\` y \`(2, 1)\` tiene que dar 36,87; con \`(1, 0)\` y \`(0, 2)\`, 90; con \`(1, 1)\` y \`(0, 3)\`, 45; con los paralelos \`(2, 5)\` y \`(6, 15)\`, 0; y con los opuestos \`(2, 5)\` y \`(-2, -5)\`, 180.")
`,
          reference: `import numpy as np


def coseno(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def angulo(a, b):
    return np.degrees(np.arccos(np.clip(coseno(a, b), -1, 1)))
`,
        },
        {
          id: 'coseno.ex02.3',
          type: 'codigo',
          prompt:
            'Si se normalizan los dos vectores, dividiendo cada uno entre su norma, el coseno es solo el producto escalar de los unitarios. Ya tienes `a = np.array([2, 1])` y `b = np.array([1, 3])`. Guarda en `ua` y `ub` sus vectores unitarios (cada uno dividido entre su propia norma, que da `np.linalg.norm`) y en `c` el producto escalar de `ua` y `ub`, que es el coseno del ángulo entre `a` y `b`.',
          hints: [
            '`ua` es `a` dividido entre su norma, y `ub` es `b` dividido entre la suya.',
            'Después, `c` es el producto escalar de los dos unitarios, sin dividir entre nada más.',
          ],
          explain:
            'Un vector dividido entre su norma conserva la dirección y pasa a medir $1$. Con los dos unitarios, el denominador del coseno vale $1$ y solo queda el producto escalar. Comprueba que `c` coincide con el coseno que da la fórmula completa.',
          solution:
            '`ua = a / np.linalg.norm(a)` y `ub = b / np.linalg.norm(b)` dan $\\left(\\dfrac{2}{\\sqrt5},\\ \\dfrac{1}{\\sqrt5}\\right)\\approx(0{,}89;\\ 0{,}45)$ y $\\left(\\dfrac{1}{\\sqrt{10}},\\ \\dfrac{3}{\\sqrt{10}}\\right)\\approx(0{,}32;\\ 0{,}95)$. Su producto escalar, `c = np.dot(ua, ub)`, es $0{,}89\\cdot0{,}32+0{,}45\\cdot0{,}95\\approx0{,}71$: el mismo coseno que da la fórmula completa, $\\dfrac{5}{\\sqrt5\\cdot\\sqrt{10}}=\\dfrac{1}{\\sqrt2}\\approx0{,}71$.',
          starter: `import numpy as np

a = np.array([2, 1])
b = np.array([1, 3])
# Calcula ua y ub, los unitarios de a y b, y c, el producto escalar de ua y ub
ua = None
ub = None
c = None
`,
          checks: `def _vec(x):
    return isinstance(x, np.ndarray) and x.shape == (2,) and np.issubdtype(x.dtype, np.number)


_ua = _vec(ua)
_ub = _vec(ub)
_num = (isinstance(c, (int, float, np.number)) and not isinstance(c, bool)) or (isinstance(c, np.ndarray) and c.ndim == 0 and np.issubdtype(c.dtype, np.number))
_uaok = _ua and np.allclose(ua, np.array([2, 1]) / np.sqrt(5))
_ubok = _ub and np.allclose(ub, np.array([1, 3]) / np.sqrt(10))
check(_ua, "\`ua\` tiene que ser un array de NumPy con 2 componentes, números: el vector \`a\` dividido entre su norma.")
check((not _ua) or not np.allclose(ua, [2, 1]), "\`ua\` sigue valiendo lo mismo que \`a\`: falta dividirlo entre su norma.")
check((not _ua) or np.allclose(ua, [2, 1]) or _uaok, "\`ua\` tiene que ser el unitario de \`a\`: la misma dirección, con norma 1. Divide \`a\` entre su norma, no entre otro número.")
check(_ub, "\`ub\` tiene que ser un array de NumPy con 2 componentes, números: el vector \`b\` dividido entre su norma.")
check((not _ub) or not np.allclose(ub, [1, 3]), "\`ub\` sigue valiendo lo mismo que \`b\`: falta dividirlo entre su norma.")
check((not _ub) or np.allclose(ub, [1, 3]) or _ubok, "\`ub\` tiene que ser el unitario de \`b\`: la misma dirección, con norma 1. Divide \`b\` entre su norma, no entre otro número.")
check(_num or not (_uaok and _ubok), "\`c\` tiene que ser un único número, el producto escalar de \`ua\` y \`ub\`.")
check((not _num) or not (_uaok and _ubok) or not np.isclose(c, 5), "\`c\` vale 5: es el producto escalar de \`a\` y \`b\` sin normalizar. El coseno es el producto escalar de los unitarios \`ua\` y \`ub\`.")
check((not _num) or not (_uaok and _ubok) or np.isclose(c, 5) or np.isclose(c, 0.7071067811865476), "\`c\` tiene que valer 0,71, el producto escalar de \`ua\` y \`ub\`, que es el coseno del ángulo entre \`a\` y \`b\`.")
`,
          reference: `import numpy as np

a = np.array([2, 1])
b = np.array([1, 3])
ua = a / np.linalg.norm(a)
ub = b / np.linalg.norm(b)
c = np.dot(ua, ub)
`,
        },
        {
          id: 'coseno.ex02.4',
          type: 'codigo',
          prompt:
            'Una búsqueda semántica ordena los documentos por su similitud coseno con la consulta, de más a menos parecido. Las filas de la matriz `D` son los embeddings de juguete (inventados y de dos dimensiones; los reales tienen cientos) de cuatro documentos: la primera componente mide cuánto hablan de deporte y la segunda, de cocina. La consulta es `q`. Te hacen falta tres piezas de NumPy.\n\nPrimera: `D @ q` calcula el producto escalar de cada fila de `D` con `q`, y da un número por documento.\n\nSegunda: `np.linalg.norm(D, axis=1)` calcula la norma de cada fila (con `axis=0` calcularía una por columna).\n\nTercera: `np.argsort(x)` no devuelve los valores de `x` ordenados, sino las posiciones que los ordenarían de menor a mayor: con `x = np.array([30, 10, 20])`, `np.argsort(x)` es `[1, 2, 0]`. Añadir `[::-1]` al final da la vuelta al resultado, de mayor a menor.\n\nGuarda en `sim` el coseno de `q` con cada fila de `D`, y en `orden` las posiciones de los documentos de más a menos similar a `q`.',
          hints: [
            '`sim` es el producto escalar de cada fila con `q` dividido entre el producto de las normas: la de cada fila y la de `q`.',
            'Los cosenos de las cuatro filas van en un array de 4 números. `orden` sale de aplicarle `np.argsort`.',
            'Si `orden` empieza por el documento menos parecido, falta darle la vuelta con `[::-1]`.',
          ],
          explain:
            'El coseno de cada documento necesita su propio producto escalar y su propia norma, y la norma de `q` es común a todos. Después, `np.argsort` ordena de menor a mayor y entrega posiciones, no valores: piensa en qué extremo de la lista está el documento más parecido.',
          solution:
            'Las similitudes son: documento 0 («crónica de fútbol»), $\\dfrac{10}{\\sqrt{65}\\cdot\\sqrt5}\\approx0{,}55$; documento 1 («receta de paella»), $\\dfrac{11}{\\sqrt{26}\\cdot\\sqrt5}\\approx0{,}96$; documento 2 («menú del tenista»), $\\dfrac{9}{\\sqrt{18}\\cdot\\sqrt5}\\approx0{,}95$; documento 3 («resultados de liga»), $\\dfrac{4}{4\\cdot\\sqrt5}\\approx0{,}45$. En código: `sim = (D @ q) / (np.linalg.norm(D, axis=1) * np.linalg.norm(q))`. `np.argsort(sim)` da `[3, 0, 2, 1]`, de menos a más parecido; con `[::-1]` queda `orden = [1, 2, 0, 3]`. Sin dividir entre las normas, el producto escalar pondría antes la crónica de fútbol, solo porque es más larga.',
          starter: `import numpy as np

# Embeddings de juguete (inventados y de 2 dimensiones), uno por fila:
# 0 crónica de fútbol, 1 receta de paella, 2 menú del tenista, 3 resultados de liga
D = np.array([[8, 1], [1, 5], [3, 3], [4, 0]])
q = np.array([1, 2])
# Calcula sim, el coseno de q con cada fila de D, y orden, las posiciones de más a menos similar
sim = None
orden = None
`,
          checks: `_sim = isinstance(sim, np.ndarray) and sim.shape == (4,) and np.issubdtype(sim.dtype, np.number)
_o = np.asarray(orden) if isinstance(orden, (np.ndarray, list, tuple)) else None
_ord = _o is not None and _o.shape == (4,) and np.issubdtype(_o.dtype, np.integer)
_orf = _o is not None and _o.shape == (4,) and np.issubdtype(_o.dtype, np.floating)
check(_sim, "\`sim\` tiene que ser un array de NumPy con 4 números, un coseno por documento.")
check((not _sim) or not np.allclose(sim, [10, 11, 9, 4]), "\`sim\` vale (10, 11, 9, 4): son los productos escalares sin dividir entre las normas. Falta dividir entre la norma de cada fila y la de \`q\`.")
check((not _sim) or np.allclose(sim, [10, 11, 9, 4]) or np.allclose(sim, (np.array([[8, 1], [1, 5], [3, 3], [4, 0]]) @ np.array([1, 2])) / (np.linalg.norm(np.array([[8, 1], [1, 5], [3, 3], [4, 0]]), axis=1) * np.linalg.norm(np.array([1, 2])))), "\`sim\` tiene que valer (0,55; 0,96; 0,95; 0,45): el producto escalar de cada fila con \`q\` dividido entre el producto de la norma de esa fila y la de \`q\`.")
check(_ord or _orf, "\`orden\` tiene que ser un array de NumPy con 4 posiciones, una por documento (números enteros del 0 al 3).")
check(not _orf, "\`orden\` tiene números decimales: parecen cosenos y no posiciones. \`np.argsort\` no devuelve los valores ordenados, devuelve la posición que ocuparía cada uno.")
check((not _ord) or not np.array_equal(_o, [3, 0, 2, 1]), "\`orden\` empieza por el documento menos parecido: \`np.argsort\` ordena de menor a mayor. Dale la vuelta para que empiece por el más parecido.")
check((not _ord) or not np.array_equal(_o, [1, 0, 2, 3]), "\`orden\` es el que sale ordenando por el producto escalar sin normalizar: la crónica de fútbol (documento 0) se cuela por delante del menú del tenista (documento 2) solo porque es un vector más largo. Ordena los cosenos.")
check((not _ord) or not np.array_equal(_o, [2, 1, 3, 0]), "\`orden\` es el que sale ordenando por distancia a \`q\`: de menos a más lejos. Aquí hay que ordenar por coseno, de mayor a menor.")
check((not _ord) or np.array_equal(_o, [1, 2, 0, 3]) or np.array_equal(_o, [3, 0, 2, 1]) or np.array_equal(_o, [1, 0, 2, 3]) or np.array_equal(_o, [2, 1, 3, 0]), "\`orden\` tiene que ser [1, 2, 0, 3]: las posiciones de los documentos de mayor a menor coseno con \`q\`.")
`,
          reference: `import numpy as np

# Embeddings de juguete (inventados y de 2 dimensiones), uno por fila:
# 0 crónica de fútbol, 1 receta de paella, 2 menú del tenista, 3 resultados de liga
D = np.array([[8, 1], [1, 5], [3, 3], [4, 0]])
q = np.array([1, 2])
sim = (D @ q) / (np.linalg.norm(D, axis=1) * np.linalg.norm(q))
orden = np.argsort(sim)[::-1]
`,
        },
        {
          id: 'coseno.ex02.5',
          type: 'codigo',
          prompt:
            'Ordenar por coseno y ordenar por distancia no siempre da el mismo ganador. La matriz `D` guarda tres documentos de juguete (inventados y de dos dimensiones; los reales tienen cientos), uno por fila: la primera componente mide cuánto hablan de deporte y la segunda, de cocina. `nombres` es la lista de sus nombres y `q`, la consulta. Dos piezas más:\n\n`D - q` resta `q` a cada fila: da el vector que va de la consulta a cada documento, y su norma es la distancia.\n\n`np.argmax(x)` y `np.argmin(x)` devuelven la posición del valor mayor y del menor de `x`, y `nombres[i]` es el nombre que ocupa la posición `i`.\n\nGuarda en `por_coseno` el nombre del documento con mayor similitud coseno con `q` y en `por_distancia` el del documento a menor distancia euclídea de `q`.',
          hints: [
            'Hacen falta dos medidas, cada una con tres números: los cosenos de `q` con cada fila y las distancias de `q` a cada fila.',
            'La distancia a cada fila es la norma de cada fila de `D - q`, calculada por filas como en `np.linalg.norm(D, axis=1)`.',
            'Con el coseno se busca el mayor valor, y con la distancia, el menor.',
          ],
          explain:
            'Más parecido no es lo mismo que más cercano: el coseno premia el valor mayor y la distancia, el menor. Comprueba que cada nombre sale de elegir con la función adecuada sobre la medida adecuada.',
          solution:
            'Los cosenos con `q` son $0{,}89$ («apunte»), $1$ («tratado») y $0{,}32$ («ensayo»): gana el «tratado», que apunta justo como la consulta. Las distancias son $2$, $\\sqrt{160}\\approx12{,}65$ y $\\sqrt{18}\\approx4{,}24$: gana el «apunte». En código: `sim = (D @ q) / (np.linalg.norm(D, axis=1) * np.linalg.norm(q))` y `dist = np.linalg.norm(D - q, axis=1)`; después `nombres[np.argmax(sim)]` da «tratado» y `nombres[np.argmin(dist)]`, «apunte». El tratado es largo, y la distancia lo castiga por ello.',
          starter: `import numpy as np

# Embeddings de juguete (inventados y de 2 dimensiones), uno por fila.
# Ejes: cuánto habla de deporte, cuánto habla de cocina
nombres = ["apunte", "tratado", "ensayo"]
D = np.array([[1, 1], [5, 15], [4, 0]])
q = np.array([1, 3])
# Guarda en por_coseno el documento de mayor coseno y en por_distancia el de menor distancia
por_coseno = None
por_distancia = None
`,
          checks: `_pc = isinstance(por_coseno, str)
_pd = isinstance(por_distancia, str)
check(_pc, "\`por_coseno\` tiene que ser el nombre del documento (un texto entre comillas, uno de los de \`nombres\`), no su posición ni \`None\`.")
check((not _pc) or por_coseno in nombres, "\`por_coseno\` tiene que ser uno de los nombres de \`nombres\`.")
check((not _pc) or por_coseno != "apunte", "\`por_coseno\` vale «apunte»: es el documento más cercano a la consulta, no el de mayor coseno. Revisa que usas la similitud coseno y que eliges el valor mayor.")
check((not _pc) or por_coseno != "ensayo", "\`por_coseno\` vale «ensayo», que tiene el menor coseno de los tres. Revisa que eliges el valor mayor de las similitudes.")
check(_pd, "\`por_distancia\` tiene que ser el nombre del documento (un texto entre comillas, uno de los de \`nombres\`), no su posición ni \`None\`.")
check((not _pd) or por_distancia in nombres, "\`por_distancia\` tiene que ser uno de los nombres de \`nombres\`.")
check((not _pd) or por_distancia != "tratado", "\`por_distancia\` vale «tratado»: es el de mayor coseno, pero el más lejano de la consulta. Con la distancia hay que elegir el valor menor, y la distancia es la norma de \`D - q\`.")
check((not _pd) or por_distancia != "ensayo", "\`por_distancia\` vale «ensayo», que no es el más cercano a la consulta. Comprueba que calculas la distancia de cada fila a \`q\`, es decir, la norma de \`D - q\`.")
`,
          reference: `import numpy as np

# Embeddings de juguete (inventados y de 2 dimensiones), uno por fila.
# Ejes: cuánto habla de deporte, cuánto habla de cocina
nombres = ["apunte", "tratado", "ensayo"]
D = np.array([[1, 1], [5, 15], [4, 0]])
q = np.array([1, 3])
sim = (D @ q) / (np.linalg.norm(D, axis=1) * np.linalg.norm(q))
dist = np.linalg.norm(D - q, axis=1)
por_coseno = nombres[np.argmax(sim)]
por_distancia = nombres[np.argmin(dist)]
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'coseno.hoja.1',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula el coseno del ángulo entre $\\vec{a}=(3, 4)$ y $\\vec{b}=(0, 2)$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Escribe la fórmula del coseno y compárala con lo que hace la última línea.',
        'Un coseno siempre está entre $-1$ y $1$: ¿lo cumple el resultado?',
      ],
      explain:
        'Piensa qué valores puede tomar un coseno y compara con el resultado. Después, revisa la fórmula completa y comprueba que cada línea la usa entera.',
      solution:
        'La última línea está mal: la fórmula divide entre el **producto** de las dos normas, y aquí solo se ha dividido entre $\\lVert\\vec{a}\\rVert$. Lo correcto es $\\cos\\theta=\\dfrac{8}{5\\cdot2}=0{,}8$. Un resultado de $1{,}6$ ya delataba el fallo: ningún coseno pasa de $1$.',
      lines: [
        'a · b = 3·0 + 4·2 = 8',
        '‖a‖ = √(3² + 4²) = 5',
        '‖b‖ = √(0² + 2²) = 2',
        'cos θ = (a · b) / ‖a‖ = 8 / 5 = 1,6',
      ],
      faultyLine: 3,
    },
    {
      id: 'coseno.hoja.2',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien busca el documento más parecido a la consulta `q` entre las filas de `D`, por similitud coseno, y guarda su posición en `mejor` (NumPy ya está importado como `np`). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Calcula a mano las tres similitudes: ¿qué documento tiene la más alta?',
        '`np.argmax` y `np.argmin` devuelven la posición del valor mayor y del menor. ¿Cuál interesa con una similitud?',
      ],
      explain:
        'Piensa qué significa un valor alto de similitud y qué devuelve cada función de posición. Después, comprueba si el resultado es el documento que esperabas.',
      solution:
        'La última línea está mal: `np.argmin` da la posición de la similitud más baja, es decir, el documento **menos** parecido (el 0, con $0{,}55$). Para el más parecido hace falta `np.argmax`, que da el 1 (con $0{,}96$). Con distancias ocurre al revés: el más cercano es el de menor distancia, y ahí sí se usa `np.argmin`.',
      lines: [
        'D = np.array([[8, 1], [1, 5], [3, 3]])',
        'q = np.array([1, 2])',
        'sim = (D @ q) / (np.linalg.norm(D, axis=1) * np.linalg.norm(q))',
        'mejor = np.argmin(sim)',
      ],
      faultyLine: 3,
    },
    {
      id: 'coseno.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento comprueba si $\\vec{a}=(2, -1)$ y $\\vec{b}=(1, 2)$ son perpendiculares. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Recuerda cuándo vale cero el coseno de un ángulo y qué ángulo es.',
        'Calcula tú el producto escalar y compáralo con el de la primera línea.',
      ],
      explain:
        'Revisa cada paso: ¿el producto escalar está bien calculado? ¿Qué implica que valga cero para el coseno y para el ángulo?',
      solution:
        'No hay ningún error. $\\vec{a}\\cdot\\vec{b}=2\\cdot1+(-1)\\cdot2=0$. Con el numerador nulo, $\\cos\\theta=0$ (el denominador es positivo, porque ningún vector es nulo), y el ángulo cuyo coseno es $0$ es $90^\\circ$: los vectores son perpendiculares.',
      lines: [
        'a · b = 2·1 + (−1)·2 = 0',
        'Con a · b = 0, cos θ = 0 / (‖a‖ ‖b‖) = 0',
        'cos θ = 0 equivale a θ = 90°: son perpendiculares',
      ],
      faultyLine: null,
    },
  ],
};
