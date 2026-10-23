import type { PlaneSpec, PlaneVector, Project } from '../../content/schema';
import { proyeccionWarmup } from './proyeccion.calentamiento';

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

/** Tercer proyecto de la Órbita 1: la sombra de una flecha sobre la recta de otra. */
export const proyeccion: Project = {
  id: 'proyeccion',
  name: 'Proyección',
  sub: 'La sombra de una flecha',
  warmup: proyeccionWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'proyeccion.ex00.1',
          type: 'manipular',
          prompt:
            'La **proyección escalar** de $\\vec{a}$ sobre $\\vec{b}$ es la longitud, con signo, de la «sombra» que proyecta $\\vec{a}$ sobre la recta de $\\vec{b}$ cuando la luz cae perpendicular a esa recta. Se calcula así: $\\dfrac{\\vec{a}\\cdot\\vec{b}}{\\lVert\\vec{b}\\rVert}$. El **producto escalar** $\\vec{a}\\cdot\\vec{b}$ multiplica las componentes de dos en dos y suma los productos, y $\\lVert\\vec{b}\\rVert$ es la norma de $\\vec{b}$.\n\nEl vector $\\vec{b}$ está fijo en $(3, 0)$, horizontal. Mueve la punta de $\\vec{a}$ hasta que su sombra sobre la recta de $\\vec{b}$ mida $4$. La lectura «proyección» te dice cuánto mide en cada momento, y el dibujo traza la sombra y la perpendicular que baja desde la punta de $\\vec{a}$.',
          hints: [
            'Mira la lectura «proyección» mientras arrastras la punta de $\\vec{a}$ a derecha e izquierda, y luego arriba y abajo: en una de las dos direcciones no cambia.',
            'Con $\\vec{b}$ horizontal, la sombra de $\\vec{a}$ es su componente horizontal.',
          ],
          explain:
            'La sombra de $\\vec{a}$ sobre la recta de $\\vec{b}$ solo depende de cuánto avanza $\\vec{a}$ a lo largo de esa recta; moverla en perpendicular no la cambia. Comprueba el valor en la lectura mientras arrastras.',
          solution:
            'Con $\\vec{b}=(3, 0)$ y $\\vec{a}=(a_x,\\ a_y)$, el producto escalar es $\\vec{a}\\cdot\\vec{b}=3a_x$ y la norma es $\\lVert\\vec{b}\\rVert=3$, así que la proyección escalar es $\\dfrac{3a_x}{3}=a_x$. Para que valga $4$ hace falta $a_x=4$, sea cual sea $a_y$: por ejemplo, con $\\vec{a}=(4, 2)$ sale $\\dfrac{4\\cdot 3+2\\cdot 0}{3}=4$.',
          plane: plane(
            [arrow('a', [1, 2], true), arrow('b', [3, 0], false)],
            ['components', 'dot', 'projection'],
            ['a', 'b'],
          ),
          goals: [{ metric: 'proj', of: ['a', 'b'], target: 4, tol: 0.01 }],
        },
        {
          id: 'proyeccion.ex00.2',
          type: 'manipular',
          prompt:
            'Si $\\vec{a}$ es **perpendicular** (ortogonal) a $\\vec{b}$, no proyecta ninguna sombra sobre su recta: la proyección escalar vale $0$. Y al revés, que el producto escalar $\\vec{a}\\cdot\\vec{b}$ valga $0$ es justo la condición de ortogonalidad.\n\nEl vector $\\vec{b}$ está fijo en $(2, 3)$. Lleva $\\vec{a}$ a un punto con $x=3$ cuya sombra sobre la recta de $\\vec{b}$ sea nula.',
          hints: [
            'Busca que $\\vec{a}$ y $\\vec{b}$ formen un ángulo recto. La lectura «producto escalar» se anula en ese momento.',
            'Con $x=3$, el producto escalar es $2\\cdot 3+3\\,a_y$. ¿Qué valor de $a_y$ lo anula?',
          ],
          explain:
            'La sombra es nula cuando los dos vectores forman un ángulo recto, es decir, cuando su producto escalar es $0$. Comprueba en la lectura cuándo se anula mientras arrastras la punta.',
          solution:
            'El producto escalar es $\\vec{a}\\cdot\\vec{b}=2\\cdot 3+3\\,a_y=6+3a_y$, que vale $0$ si $a_y=-2$. Entonces $\\vec{a}=(3, -2)$ y la sombra es $\\dfrac{0}{\\sqrt{13}}=0$: $\\vec{a}$ forma un ángulo recto con $\\vec{b}$.',
          plane: plane(
            [arrow('a', [1, 1], true), arrow('b', [2, 3], false)],
            ['components', 'dot', 'projection'],
            ['a', 'b'],
          ),
          goals: [
            { metric: 'x', of: ['a'], target: 3, tol: 0.01 },
            { metric: 'proj', of: ['a', 'b'], target: 0, tol: 0.01 },
          ],
        },
        {
          id: 'proyeccion.ex00.3',
          type: 'manipular',
          prompt:
            'La proyección escalar tiene **signo**: es positiva si la sombra de $\\vec{a}$ cae hacia donde apunta $\\vec{b}$, y negativa si cae al lado contrario. Esto ocurre cuando el ángulo entre los dos vectores pasa de 90°, y es el signo del producto escalar.\n\nEl vector $\\vec{b}$ está fijo en $(-2, 0)$, apuntando a la izquierda. Lleva $\\vec{a}$ a un punto con $y=2$ cuya proyección escalar sobre $\\vec{b}$ sea $-3$.',
          hints: [
            'Fíjate en el signo de la lectura «proyección» mientras arrastras: ¿de qué lado de $\\vec{b}$ tiene que caer la sombra?',
            'La recta de $\\vec{b}$ es el eje horizontal, pero $\\vec{b}$ apunta a la izquierda: la sombra es positiva hacia la izquierda y negativa hacia la derecha.',
          ],
          explain:
            'El signo de la proyección es el del producto escalar: positivo si los vectores forman menos de 90°, cero si forman 90° y negativo si forman más. Aquí $\\vec{b}$ apunta a la izquierda, así que piensa hacia qué lado tiene que apuntar $\\vec{a}$.',
          solution:
            'Con $\\vec{b}=(-2, 0)$ la norma es $\\lVert\\vec{b}\\rVert=2$ y el producto escalar, $\\vec{a}\\cdot\\vec{b}=-2a_x$, así que la proyección es $\\dfrac{-2a_x}{2}=-a_x$. Para que valga $-3$ hace falta $a_x=3$: $\\vec{a}=(3, 2)$. La sombra mide $3$, pero cae a la derecha, contra el sentido de $\\vec{b}$: por eso es negativa.',
          plane: plane(
            [arrow('a', [-1, 2], true), arrow('b', [-2, 0], false)],
            ['components', 'dot', 'projection'],
            ['a', 'b'],
          ),
          goals: [
            { metric: 'y', of: ['a'], target: 2, tol: 0.01 },
            { metric: 'proj', of: ['a', 'b'], target: -3, tol: 0.01 },
          ],
        },
        {
          id: 'proyeccion.ex00.4',
          type: 'manipular',
          prompt:
            'La recta de $\\vec{b}$ puede estar inclinada: la fórmula es la misma. Fíjate en que solo cuenta la **dirección** de $\\vec{b}$: al dividir entre $\\lVert\\vec{b}\\rVert$ se descuenta su longitud, y la sombra mide lo mismo si alargas o acortas $\\vec{b}$ sin girarlo.\n\nEl vector $\\vec{b}$ está fijo en $(3, 4)$, con norma $5$. Lleva $\\vec{a}$ a un punto con $x=2$ cuya proyección escalar sobre $\\vec{b}$ sea $2$.',
          hints: [
            'Mira cómo cambia la lectura «proyección» al mover la punta de $\\vec{a}$ en vertical manteniendo $x=2$.',
            'El producto escalar es $3\\cdot 2+4\\,a_y$ y hay que dividirlo entre $\\lVert\\vec{b}\\rVert=5$, no entre $3$ ni entre $4$.',
          ],
          explain:
            'Con $\\vec{b}$ inclinado, la sombra depende de las dos componentes de $\\vec{a}$, y se divide entre la norma de $\\vec{b}$. Plantea la ecuación con $a_y$ como incógnita.',
          solution:
            'La proyección es $\\dfrac{\\vec{a}\\cdot\\vec{b}}{\\lVert\\vec{b}\\rVert}=\\dfrac{3\\cdot 2+4\\,a_y}{5}$, y que valga $2$ da $6+4a_y=10$, es decir, $a_y=1$. Entonces $\\vec{a}=(2, 1)$: $\\dfrac{3\\cdot 2+4\\cdot 1}{5}=\\dfrac{10}{5}=2$.',
          plane: plane(
            [arrow('a', [1, 1], true), arrow('b', [3, 4], false)],
            ['components', 'dot', 'projection'],
            ['a', 'b'],
          ),
          goals: [
            { metric: 'x', of: ['a'], target: 2, tol: 0.01 },
            { metric: 'proj', of: ['a', 'b'], target: 2, tol: 0.01 },
          ],
        },
        {
          id: 'proyeccion.ex00.5',
          type: 'manipular',
          prompt:
            'En un mapa de embeddings, una **dirección** puede representar un concepto, y la proyección escalar de una palabra sobre ella mide cuánto tiene la palabra de ese concepto. Este mapa es un juguete **inventado** de dos dimensiones; los embeddings reales tienen cientos. Aquí el eje vertical va de «salvaje o industrial» (abajo) a «doméstico» (arriba), y el horizontal, de «máquina» (izquierda) a «ser vivo» (derecha).\n\nLa flecha $\\vec{d}$, fija en $(0, 2)$, marca la dirección «doméstico»: su longitud no importa, solo hacia dónde apunta. Coloca $\\vec{w}$ en un punto de máquina, con $x=-2$, cuya proyección sobre $\\vec{d}$ sea $3$.',
          hints: [
            'Mira la lectura «proyección» mientras mueves la punta de $\\vec{w}$ sobre la vertical $x=-2$.',
            'Como $\\vec{d}$ apunta hacia arriba, la proyección sobre $\\vec{d}$ es lo que sube la palabra.',
          ],
          explain:
            'Proyectar sobre una dirección mide cuánto avanza la palabra a lo largo de ella. Como $\\vec{d}$ apunta hacia arriba, solo cuenta cuánto sube $\\vec{w}$; la longitud de $\\vec{d}$ se descuenta al dividir entre su norma.',
          solution:
            'Con $\\vec{d}=(0, 2)$ la norma es $\\lVert\\vec{d}\\rVert=2$ y la proyección de $\\vec{w}=(w_x,\\ w_y)$ es $\\dfrac{2w_y}{2}=w_y$. Para que valga $3$ hace falta $w_y=3$, y con $x=-2$ queda $\\vec{w}=(-2, 3)$, que es el embedding de «bici»: una máquina muy doméstica.',
          plane: plane(
            [arrow('w', [1, 1], true), arrow('d', [0, 2], false, 'doméstico')],
            ['components', 'projection'],
            ['w', 'd'],
          ),
          goals: [
            { metric: 'x', of: ['w'], target: -2, tol: 0.01 },
            { metric: 'proj', of: ['w', 'd'], target: 3, tol: 0.01 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'proyeccion.ex01.1',
          type: 'numero',
          prompt:
            'La **proyección escalar** de $\\vec{a}$ sobre $\\vec{b}$ es la longitud con signo de la sombra de $\\vec{a}$ sobre la recta de $\\vec{b}$: $\\dfrac{\\vec{a}\\cdot\\vec{b}}{\\lVert\\vec{b}\\rVert}$. Recuerda que el producto escalar $\\vec{a}\\cdot\\vec{b}$ multiplica las componentes de dos en dos y suma los productos.\n\nCalcula la proyección escalar de $\\vec{a}=(2, 6)$ sobre $\\vec{b}=(3, 4)$.',
          hints: [
            'Empieza por el producto escalar: $2\\cdot 3+6\\cdot 4$.',
            'La norma de $\\vec{b}$ es $\\sqrt{3^2+4^2}$.',
          ],
          explain:
            'Se divide el producto escalar entre la norma de $\\vec{b}$, el vector sobre el que se proyecta; no entre la de $\\vec{a}$ ni entre $\\vec{b}\\cdot\\vec{b}$.',
          solution:
            'El producto escalar es $\\vec{a}\\cdot\\vec{b}=2\\cdot 3+6\\cdot 4=30$ y la norma es $\\lVert\\vec{b}\\rVert=\\sqrt{9+16}=5$. La proyección escalar es $\\dfrac{30}{5}=6$.',
          answer: 6,
          tol: 0,
        },
        {
          id: 'proyeccion.ex01.2',
          type: 'vector',
          prompt:
            'La **proyección vectorial** es la sombra misma, dibujada como flecha sobre la recta de $\\vec{b}$: $\\text{proy}_{\\vec{b}}\\,\\vec{a}=\\dfrac{\\vec{a}\\cdot\\vec{b}}{\\vec{b}\\cdot\\vec{b}}\\,\\vec{b}$. El cociente es un número que dice cuántas veces hay que tomar $\\vec{b}$ para llegar a la sombra. Como $\\vec{b}\\cdot\\vec{b}=\\lVert\\vec{b}\\rVert^2$, es lo mismo que la proyección escalar multiplicada por $\\dfrac{\\vec{b}}{\\lVert\\vec{b}\\rVert}$, la flecha de longitud 1 que apunta como $\\vec{b}$.\n\nCalcula la proyección vectorial de $\\vec{a}=(4, 2)$ sobre $\\vec{b}=(1, 1)$. Escribe el resultado: primero la $x$ y después la $y$.',
          hints: [
            'Calcula antes los dos productos escalares: $\\vec{a}\\cdot\\vec{b}$ y $\\vec{b}\\cdot\\vec{b}$.',
            'Divide uno entre el otro y multiplica el resultado por el vector $\\vec{b}$, componente a componente.',
          ],
          explain:
            'El número que sale de dividir los dos productos escalares multiplica a $\\vec{b}$: la sombra queda sobre la recta de $\\vec{b}$. Cuida que el denominador sea $\\vec{b}\\cdot\\vec{b}$ y no $\\vec{a}\\cdot\\vec{a}$.',
          solution:
            'Los productos escalares son $\\vec{a}\\cdot\\vec{b}=4+2=6$ y $\\vec{b}\\cdot\\vec{b}=1+1=2$. El cociente es $\\dfrac{6}{2}=3$ y la proyección es $3\\,(1, 1)=(3, 3)$. Su longitud, $3\\sqrt{2}$, es la proyección escalar $\\dfrac{6}{\\sqrt{2}}$.',
          answer: [3, 3],
          tol: 0,
        },
        {
          id: 'proyeccion.ex01.3',
          type: 'vector',
          prompt:
            'Al quitar a $\\vec{a}$ su sombra sobre $\\vec{b}$ queda la **componente perpendicular**: $\\vec{a}_{\\perp}=\\vec{a}-\\text{proy}_{\\vec{b}}\\,\\vec{a}$. Así, $\\vec{a}$ es la suma de su sombra y de lo que sobra, y lo que sobra es ortogonal a $\\vec{b}$: su producto escalar con $\\vec{b}$ vale $0$.\n\nCalcula la componente perpendicular de $\\vec{a}=(6, 2)$ respecto a $\\vec{b}=(1, 2)$. Escribe el resultado: primero la $x$ y después la $y$.',
          hints: [
            'Primero hace falta la proyección vectorial de $\\vec{a}$ sobre $\\vec{b}$.',
            'Después resta esa proyección a $\\vec{a}$, componente a componente.',
            'Para comprobarlo, el producto escalar del resultado con $\\vec{b}$ tiene que salir $0$.',
          ],
          explain:
            'Lo que se pide es lo que sobra de $\\vec{a}$ al quitarle su sombra. Calcula la sombra con cuidado y resta en el orden correcto; el resultado debe formar un ángulo recto con $\\vec{b}$.',
          solution:
            'Los productos escalares son $\\vec{a}\\cdot\\vec{b}=6+4=10$ y $\\vec{b}\\cdot\\vec{b}=1+4=5$, así que la proyección es $\\dfrac{10}{5}(1, 2)=(2, 4)$. Entonces $\\vec{a}_{\\perp}=(6-2,\\ 2-4)=(4, -2)$. Comprobación: $(4, -2)\\cdot(1, 2)=4-4=0$.',
          answer: [4, -2],
          tol: 0,
        },
        {
          id: 'proyeccion.ex01.4',
          type: 'opcion',
          prompt:
            'Sustituyes $\\vec{b}$ por $2\\vec{b}$: apunta igual y es el doble de largo. ¿Qué ocurre con la proyección vectorial de $\\vec{a}$ sobre él?',
          hints: [
            'Sustituye $2\\vec{b}$ en la fórmula $\\dfrac{\\vec{a}\\cdot\\vec{b}}{\\vec{b}\\cdot\\vec{b}}\\,\\vec{b}$ y mira qué factores aparecen arriba y abajo.',
            'Piensa en la sombra: ¿cambia por alargar el vector que define la recta?',
          ],
          explain:
            'La sombra de $\\vec{a}$ se proyecta sobre una recta, no sobre un tamaño. Sustituye $2\\vec{b}$ en la fórmula y cuenta cuántas veces aparece el factor $2$ arriba y cuántas abajo.',
          solution:
            'Al sustituir queda $\\dfrac{\\vec{a}\\cdot 2\\vec{b}}{2\\vec{b}\\cdot 2\\vec{b}}\\,2\\vec{b}=\\dfrac{2\\,\\vec{a}\\cdot\\vec{b}}{4\\,\\vec{b}\\cdot\\vec{b}}\\,2\\vec{b}=\\dfrac{\\vec{a}\\cdot\\vec{b}}{\\vec{b}\\cdot\\vec{b}}\\,\\vec{b}$: los factores $2$ se compensan y la proyección no cambia. Solo importa la recta de $\\vec{b}$, es decir, su dirección. Lo mismo pasa con la proyección escalar, porque la norma también se duplica.',
          options: [
            'Se duplica, porque $\\vec{b}$ es el doble de largo',
            'Se reduce a la mitad',
            'No cambia: solo importa la dirección de $\\vec{b}$',
            'Conserva su longitud pero cambia de sentido',
          ],
          correct: 2,
        },
        {
          id: 'proyeccion.ex01.5',
          type: 'vector',
          prompt:
            'Un embedding mezcla muchas cosas a la vez, y a veces se quiere borrar una: por ejemplo, que un modelo no distinga entre dos conceptos. Se define la dirección $\\vec{d}$ que los separa y se **quita** a cada embedding su componente en esa dirección: lo que queda, $\\vec{a}-\\text{proy}_{\\vec{d}}\\,\\vec{a}$, es ortogonal a $\\vec{d}$ y ya no tiene nada de ella. Es la idea de las técnicas para eliminar un sesgo.\n\nEn el mapa de juguete (inventado y de dos dimensiones; los embeddings reales tienen cientos), la dirección que separa «gato» de «perro» es $\\vec{d}=\\text{gato}-\\text{perro}=(3, 4)-(4, 3)=(-1, 1)$. Quita a «lobo», en $(4, -2)$, su componente en esa dirección. Escribe el resultado: primero la $x$ y después la $y$.',
          hints: [
            'Calcula primero la proyección vectorial de «lobo» sobre $\\vec{d}$.',
            'Después resta esa proyección al embedding de «lobo».',
            'Comprueba el resultado: su producto escalar con $\\vec{d}$ tiene que ser $0$.',
          ],
          explain:
            'Quitar la componente en una dirección es restar la proyección vectorial sobre ella. Calcula con cuidado los dos productos escalares y el signo del cociente: «lobo» y $\\vec{d}$ forman un ángulo mayor de 90°.',
          solution:
            'Los productos escalares son $\\text{lobo}\\cdot\\vec{d}=4\\cdot(-1)+(-2)\\cdot 1=-6$ y $\\vec{d}\\cdot\\vec{d}=1+1=2$. La proyección es $\\dfrac{-6}{2}(-1, 1)=(3, -3)$, y lo que queda es $(4-3,\\ -2-(-3))=(1, 1)$. Comprobación: $(1, 1)\\cdot(-1, 1)=0$.',
          answer: [1, 1],
          tol: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'proyeccion.ex02.1',
          type: 'codigo',
          prompt:
            'La **proyección escalar** de $\\vec{a}$ sobre $\\vec{b}$ es $\\dfrac{\\vec{a}\\cdot\\vec{b}}{\\lVert\\vec{b}\\rVert}$. En NumPy, el producto escalar (multiplicar las componentes de dos en dos y sumar) se escribe `a @ b`, y la norma de un vector, `np.linalg.norm(b)`. Una **función** se define con `def` y entrega su resultado con `return`, así que se puede reutilizar con otros datos. Completa `proyeccion_escalar(a, b)` para que devuelva la proyección escalar de `a` sobre `b`. La comprobación la llamará con varios pares de vectores.',
          hints: [
            'El resultado es un único número: el producto escalar dividido entre la norma de `b`.',
            'Lo que va después de `return` es lo que devuelve la función: escribe ahí la división.',
            'Cuida el denominador: es la norma de `b`, no la de `a`.',
          ],
          explain:
            'Una función entrega su resultado con `return`; si no lo hay, devuelve `None`. La fórmula tiene un producto escalar arriba y una norma abajo: comprueba de qué vector es cada cosa y que no falta ninguna.',
          solution:
            'Se escribe `return (a @ b) / np.linalg.norm(b)`: el producto escalar `a @ b` dividido entre la norma de `b`. Con $\\vec{a}=(2, 6)$ y $\\vec{b}=(3, 4)$ da $\\dfrac{30}{5}=6$. Es un número, positivo o negativo, no una flecha.',
          requirements: [
            '`proyeccion_escalar` es una función que recibe dos vectores `a` y `b` y devuelve un único número, no una flecha.',
            'La función se prueba con varios pares de vectores de 2 componentes, sin que dé error con ninguno.',
            'El número conserva el signo: sale negativo cuando la sombra de `a` cae en sentido contrario a `b`.',
          ],
          starter: `import numpy as np

def proyeccion_escalar(a, b):
    # Devuelve la proyección escalar de a sobre b
    return None
`,
          checks: `def _num(x):
    return (isinstance(x, (int, float, np.number)) and not isinstance(x, bool)) or (isinstance(x, np.ndarray) and x.ndim == 0 and np.issubdtype(x.dtype, np.number))

def _llama(a, b):
    try:
        return proyeccion_escalar(np.array(a), np.array(b))
    except BaseException:
        return None

_r1 = _llama([2, 6], [3, 4])
_r2 = _llama([3, -1], [-4, 3])
_r3 = _llama([5, 5], [1, 0])
_r4 = _llama([2, 6], [6, 8])
check(_num(_r1), "\`proyeccion_escalar\` tiene que devolver un número con \`return\`: la longitud con signo de la sombra, no una flecha.")
check((not _num(_r1)) or not np.isclose(_r1, 30), "Con \`a = (2, 6)\` y \`b = (3, 4)\` tu función devuelve 30: es el producto escalar sin más. Falta dividir entre la norma de \`b\`.")
check((not _num(_r1)) or not np.isclose(_r1, 1.2), "Con \`a = (2, 6)\` y \`b = (3, 4)\` tu función devuelve 1,2: has dividido entre \`b @ b\`, la norma al cuadrado. En la proyección escalar se divide entre la norma de \`b\`, sin elevarla al cuadrado.")
check((not _num(_r1)) or not np.isclose(_r1, 30 / np.linalg.norm([2, 6])), "Has dividido entre la norma de \`a\`. La sombra se mide a lo largo de \`b\`, así que hay que dividir entre la norma de \`b\`.")
check(_num(_r1) and np.isclose(_r1, 6), "Con \`a = (2, 6)\` y \`b = (3, 4)\` la función tiene que devolver 6: el producto escalar, 30, entre la norma de \`b\`, 5.")
check(_num(_r2) and np.isclose(_r2, -3), "Con \`a = (3, -1)\` y \`b = (-4, 3)\` la función tiene que devolver -3: el producto escalar es negativo y la sombra cae contra \`b\`. Conserva el signo.")
check(_num(_r3) and np.isclose(_r3, 5), "Con \`a = (5, 5)\` y \`b = (1, 0)\` la función tiene que devolver 5: la componente horizontal de \`a\`.")
check(_num(_r4) and np.isclose(_r4, 6), "Con \`b = (6, 8)\`, el doble de largo que \`(3, 4)\`, la proyección escalar es la misma: al dividir entre la norma de \`b\` se descuenta su longitud.")
`,
          reference: `import numpy as np

def proyeccion_escalar(a, b):
    return (a @ b) / np.linalg.norm(b)
`,
        },
        {
          id: 'proyeccion.ex02.2',
          type: 'codigo',
          prompt:
            'La **proyección vectorial** es la sombra como flecha: $\\text{proy}_{\\vec{b}}\\,\\vec{a}=\\dfrac{\\vec{a}\\cdot\\vec{b}}{\\vec{b}\\cdot\\vec{b}}\\,\\vec{b}$. El cociente es un número que dice cuántas veces hay que tomar $\\vec{b}$ para llegar a la sombra. Como $\\vec{b}\\cdot\\vec{b}=\\lVert\\vec{b}\\rVert^2$, es la proyección escalar partida por $\\lVert\\vec{b}\\rVert$, y ese número se multiplica después por el vector $\\vec{b}$. Completa `proyeccion(a, b)` para que devuelva la proyección vectorial de `a` sobre `b`, como array de NumPy.',
          hints: [
            'Primero el número $\\dfrac{\\vec{a}\\cdot\\vec{b}}{\\vec{b}\\cdot\\vec{b}}$ y, después, multiplicas el vector `b` por ese número.',
            'El denominador es `b @ b`, el producto escalar de `b` consigo mismo.',
            'Si te sale un solo número en vez de una flecha, falta multiplicar por `b`.',
          ],
          explain:
            'La proyección vectorial es un vector de la recta de `b`, así que es un número multiplicado por `b`. Ese vector ya trae su propia longitud: piensa qué debe tener el número para que no se cuente dos veces.',
          solution:
            'Se escribe `return (a @ b) / (b @ b) * b`: el cociente $\\dfrac{\\vec{a}\\cdot\\vec{b}}{\\vec{b}\\cdot\\vec{b}}$ multiplica a `b`. Con $\\vec{a}=(2, 6)$ y $\\vec{b}=(3, 4)$ el cociente es $\\dfrac{30}{25}=1{,}2$ y la sombra es $1{,}2\\,(3, 4)=(3{,}6;\\ 4{,}8)$. Dividir entre la norma en vez de entre `b @ b` daría una flecha 5 veces demasiado larga.',
          requirements: [
            '`proyeccion` es una función que recibe dos vectores `a` y `b` y devuelve la flecha de la sombra: un array de NumPy con 2 componentes, números, no un número suelto.',
            'La función se prueba con varios pares de vectores de 2 componentes, sin que dé error con ninguno.',
            'La flecha tiene la dirección de `b`, con su sentido o el contrario según el signo del producto escalar, y no cambia si se alarga `b` sin cambiar su dirección.',
          ],
          starter: `import numpy as np

def proyeccion(a, b):
    # Devuelve la proyección vectorial de a sobre b, como array de NumPy
    return None
`,
          checks: `def _vec(x):
    return isinstance(x, np.ndarray) and x.shape == (2,) and np.issubdtype(x.dtype, np.number)

def _num(x):
    return (isinstance(x, (int, float, np.number)) and not isinstance(x, bool)) or (isinstance(x, np.ndarray) and x.ndim == 0 and np.issubdtype(x.dtype, np.number))

def _llama(a, b):
    try:
        return proyeccion(np.array(a), np.array(b))
    except BaseException:
        return None

_r1 = _llama([2, 6], [3, 4])
_r2 = _llama([3, -1], [-4, 3])
_r3 = _llama([5, 5], [1, 0])
_r4 = _llama([2, 6], [6, 8])
check(_vec(_r1) or _num(_r1), "\`proyeccion\` tiene que devolver con \`return\` un array de NumPy con 2 componentes: la flecha de la sombra.")
check((not _num(_r1)) or not np.isclose(_r1, 1.2), "Con \`a = (2, 6)\` y \`b = (3, 4)\` tu función devuelve un solo número, 1,2: es el cociente. Falta multiplicarlo por \`b\` para obtener la flecha.")
check((not _vec(_r1)) or not np.allclose(_r1, [18, 24]), "Con \`a = (2, 6)\` y \`b = (3, 4)\` tu función devuelve (18, 24): has dividido entre la norma de \`b\`. Eso da la proyección escalar, y al multiplicarla por \`b\`, que ya trae su longitud, la flecha sale 5 veces demasiado larga. Divide entre \`b @ b\`.")
check((not _vec(_r1)) or not np.allclose(_r1, [1.5, 4.5]), "Has proyectado \`b\` sobre \`a\`, al revés. La sombra se proyecta sobre \`b\`: el denominador y el vector final son los de \`b\`.")
check(_vec(_r1) and np.allclose(_r1, [3.6, 4.8]), "Con \`a = (2, 6)\` y \`b = (3, 4)\` la función tiene que devolver (3,6; 4,8): el cociente 30 / 25 = 1,2 multiplicado por \`b\`.")
check(_vec(_r2) and np.allclose(_r2, [2.4, -1.8]), "Con \`a = (3, -1)\` y \`b = (-4, 3)\` la función tiene que devolver (2,4; -1,8): el cociente es negativo, -0,6, y la sombra apunta contra \`b\`.")
check(_vec(_r3) and np.allclose(_r3, [5, 0]), "Con \`a = (5, 5)\` y \`b = (1, 0)\` la función tiene que devolver (5, 0): la sombra de \`a\` sobre el eje horizontal.")
check(_vec(_r4) and np.allclose(_r4, [3.6, 4.8]), "Con \`b = (6, 8)\`, el doble de largo que \`(3, 4)\`, la sombra es la misma: la proyección solo depende de la dirección de \`b\`.")
`,
          reference: `import numpy as np

def proyeccion(a, b):
    return (a @ b) / (b @ b) * b
`,
        },
        {
          id: 'proyeccion.ex02.3',
          type: 'codigo',
          prompt:
            'Todo vector $\\vec{a}$ se descompone respecto a otro $\\vec{b}$ en dos partes: la **paralela**, que es su sombra sobre la recta de $\\vec{b}$, y la **perpendicular**, que es lo que sobra, $\\vec{a}_{\\perp}=\\vec{a}-\\vec{a}_{\\parallel}$. La parte perpendicular es ortogonal a $\\vec{b}$: su producto escalar con $\\vec{b}$ vale $0$.\n\nCompleta `descomponer(a, b)` para que devuelva la pareja `(paralela, perpendicular)`, dos arrays de NumPy. Después guarda en `ortogonal` si `perpendicular` y `b` son ortogonales, como `True` o `False`. Con decimales el producto escalar rara vez sale exactamente $0$: `np.isclose(x, 0)` dice si `x` está tan cerca de $0$ que solo es un redondeo, y devuelve `True` o `False`.',
          hints: [
            'La parte paralela es la proyección vectorial de `a` sobre `b`; la perpendicular es lo que queda al restársela a `a`.',
            'Una función puede devolver dos resultados separados por una coma: `return x, y`.',
            'Para `ortogonal`, calcula el producto escalar de `perpendicular` y `b` y comprueba si es cero.',
          ],
          explain:
            'La función tiene que dar dos partes que sumen `a`: una sobre la recta de `b` y otra que forme un ángulo recto con ella. Si `perpendicular` no sale ortogonal a `b`, revisa cómo has calculado la paralela. Para `ortogonal`, decide qué valor del producto escalar significa «ortogonal» y compáralo.',
          solution:
            'La paralela es `(a @ b) / (b @ b) * b` y la perpendicular, `a - paralela`; se devuelven con `return paralela, perpendicular`. Con $\\vec{a}=(3, 4)$ y $\\vec{b}=(2, 1)$ el cociente es $\\dfrac{10}{5}=2$, la parte paralela es $(4, 2)$ y la perpendicular es $(3-4,\\ 4-2)=(-1, 2)$, con producto escalar $-1\\cdot 2+2\\cdot 1=0$. Por eso `ortogonal = np.isclose(perpendicular @ b, 0)` vale `True`.',
          requirements: [
            '`descomponer` es una función que recibe dos vectores `a` y `b` y devuelve una pareja de arrays de NumPy con 2 componentes cada uno: primero la parte paralela y después la perpendicular.',
            'Con varios pares de vectores de 2 componentes, la parte paralela está sobre la recta de `b`, la perpendicular es ortogonal a `b` y las dos suman `a`.',
            '`ortogonal` es `True` o `False`, no el producto escalar en sí.',
            '`ortogonal` coincide con lo que dicen los números de `perpendicular` y `b`: es `True` si su producto escalar vale 0, salvo un redondeo.',
          ],
          starter: `import numpy as np

def descomponer(a, b):
    # Devuelve (paralela, perpendicular): la sombra de a sobre b y lo que sobra
    return None, None

a = np.array([3, 4])
b = np.array([2, 1])
paralela, perpendicular = descomponer(a, b)
# Guarda en ortogonal si perpendicular y b son ortogonales (True o False)
ortogonal = None
`,
          checks: `def _vec(x):
    return isinstance(x, np.ndarray) and x.shape == (2,) and np.issubdtype(x.dtype, np.number)

def _llama(a, b):
    try:
        r = descomponer(np.array(a), np.array(b))
        if isinstance(r, (tuple, list)) and len(r) == 2 and _vec(r[0]) and _vec(r[1]):
            return r
    except BaseException:
        pass
    return None

_casos = [([3, 4], [2, 1]), ([6, 2], [1, 2]), ([-2, 5], [3, -1]), ([1, 1], [0, 5])]
_res = [_llama(a_, b_) for a_, b_ in _casos]
_todo = all(r is not None for r in _res)
check(_res[0] is not None, "\`descomponer\` tiene que devolver con \`return\` una pareja \`(paralela, perpendicular)\` de arrays de NumPy con 2 componentes cada uno.")
check((not _todo) or all(np.allclose(r[0] + r[1], np.array(c[0])) for r, c in zip(_res, _casos)), "La parte paralela y la perpendicular tienen que sumar \`a\`: la perpendicular es lo que sobra de \`a\` al quitarle la paralela.")
check((not _todo) or all(abs(r[1] @ np.array(c[1])) < 1e-9 for r, c in zip(_res, _casos)), "La parte perpendicular no es ortogonal a \`b\`: su producto escalar con \`b\` tiene que valer 0. Revisa cómo calculas la parte paralela.")
check((not _todo) or all(abs(r[0][0] * c[1][1] - r[0][1] * c[1][0]) < 1e-9 for r, c in zip(_res, _casos)), "La parte paralela tiene que estar sobre la recta de \`b\`: es un número multiplicado por \`b\`.")
check((not _todo) or np.allclose(_res[0][0], [4, 2]), "Con \`a = (3, 4)\` y \`b = (2, 1)\` la parte paralela tiene que valer (4, 2): el cociente 10 / 5 = 2 multiplicado por \`b\`.")
check((not _todo) or np.allclose(_res[0][1], [-1, 2]), "Con \`a = (3, 4)\` y \`b = (2, 1)\` la parte perpendicular tiene que valer (-1, 2).")
check((not _todo) or np.allclose(_res[2][0], [-3.3, 1.1]), "Con \`a = (-2, 5)\` y \`b = (3, -1)\` la parte paralela tiene que valer (-3,3; 1,1): el cociente es negativo, -1,1.")
_bool = isinstance(ortogonal, (bool, np.bool_))
check(_bool, "\`ortogonal\` tiene que ser \`True\` o \`False\`: el resultado de comparar con 0, no el producto escalar en sí.")
_cierto = _vec(perpendicular) and bool(abs(perpendicular @ b) < 1e-9)
check((not _bool) or (not _vec(perpendicular)) or bool(ortogonal) == _cierto, "\`ortogonal\` no coincide con lo que dicen los números: tiene que ser \`True\` si el producto escalar de \`perpendicular\` y \`b\` es 0 (salvo un redondeo) y \`False\` si no.")
`,
          reference: `import numpy as np

def descomponer(a, b):
    paralela = (a @ b) / (b @ b) * b
    perpendicular = a - paralela
    return paralela, perpendicular

a = np.array([3, 4])
b = np.array([2, 1])
paralela, perpendicular = descomponer(a, b)
ortogonal = np.isclose(perpendicular @ b, 0)
`,
        },
        {
          id: 'proyeccion.ex02.4',
          type: 'codigo',
          prompt:
            'Quitar a un embedding su componente en una dirección $\\vec{d}$ es restarle su proyección sobre $\\vec{d}$. Es la idea de borrar de los vectores un concepto (o un sesgo) que no se quiere que influya.\n\n`E` guarda un embedding de juguete por fila (inventados y de 2 dimensiones; los reales tienen cientos): «coche», «bici», «camión» y «tractor». La dirección que se quiere borrar es la que separa «coche» de «bici», `d = E[0] - E[1]`. Completa `quitar_componente(E, d)` para que devuelva otra matriz del mismo tamaño que `E`, con cada fila sin su componente en `d`.\n\nSe puede con un bucle sobre las filas o de golpe: `E @ d` es el vector con el producto escalar de cada fila con `d`, y `np.outer(c, d)` construye la matriz cuya fila $i$ es `c[i] * d`. La función tiene que valer también para embeddings con otro número de componentes.',
          hints: [
            'Para una sola fila `f`, la parte que se quita es la proyección vectorial de `f` sobre `d`: `(f @ d) / (d @ d) * d`.',
            'Con `E @ d` tienes de golpe todos los productos escalares; divídelos entre `d @ d` y reparte cada cociente en su fila con `np.outer`.',
            'Al final se resta a `E` la matriz de las partes que se quitan.',
          ],
          explain:
            'Cada fila pierde su propia proyección sobre `d`, y cada proyección es un número multiplicado por `d`. Piensa qué matriz de partes que se quitan tienes que restar a `E` y comprueba que el resultado tiene la misma forma que `E` y que cada fila queda ortogonal a `d`.',
          solution:
            'Se escribe `return E - np.outer((E @ d) / (d @ d), d)`: `E @ d` da el producto escalar de cada fila con `d`; dividido entre `d @ d`, dice cuántas veces `d` hay que restar a cada fila; `np.outer` coloca esos múltiplos de `d` fila a fila, y la resta quita la proyección. Con $\\vec{d}=(-1, -1)$, «coche» y «bici» quedan ambos en $(-2{,}5;\\ 2{,}5)$, «camión» en $(-1{,}5;\\ 1{,}5)$ y «tractor» en $(0, 0)$. Tras quitar esa dirección, «coche» y «bici» ya no se distinguen.',
          requirements: [
            '`limpios` existe y es una matriz de NumPy con 4 filas y 2 columnas, la misma forma que `E`, con números.',
            'Cada fila de `limpios` es la fila de `E` sin su componente en `d`, no la parte que se quita: todas quedan ortogonales a `d`.',
            '`quitar_componente` se prueba también con otras matrices de `E`, con otro número de componentes y con direcciones `d` que no miden 1; devuelve siempre una matriz del mismo tamaño que la recibida, sin dar error.',
          ],
          starter: `import numpy as np

# Embeddings de juguete (inventados y de 2 dimensiones), uno por fila:
# coche, bici, camión, tractor
E = np.array([[-3, 2], [-2, 3], [-4, -1], [-3, -3]])
# La dirección que separa coche de bici
d = E[0] - E[1]

def quitar_componente(E, d):
    # Devuelve E con cada fila sin su componente en la dirección d
    return None

limpios = quitar_componente(E, d)
`,
          checks: `def _mat(x):
    return isinstance(x, np.ndarray) and x.ndim == 2 and np.issubdtype(x.dtype, np.number)

def _llama(M, v):
    try:
        r = quitar_componente(np.array(M), np.array(v))
        if _mat(r):
            return r
    except BaseException:
        pass
    return None

def _igual(x, y):
    try:
        return x is not None and np.shape(x) == np.shape(y) and bool(np.allclose(x, y))
    except BaseException:
        return False

_E1 = np.array([[-3, 2], [-2, 3], [-4, -1], [-3, -3]])
_d1 = np.array([-1, -1])
_esp1 = np.array([[-2.5, 2.5], [-2.5, 2.5], [-1.5, 1.5], [0, 0]])
_sin_dividir = _E1 - np.outer(_E1 @ _d1, _d1)
_entre_norma = _E1 - np.outer((_E1 @ _d1) / np.linalg.norm(_d1), _d1)
_quitado = _E1 - _esp1
_ok = _mat(limpios) and limpios.shape == (4, 2)
check(_ok, "\`limpios\` tiene que ser una matriz de NumPy con la misma forma que \`E\`: una fila por palabra, sin su componente en \`d\`.")
check((not _ok) or not np.allclose(limpios, _quitado), "\`limpios\` contiene justo la parte que había que quitar. Lo que se pide es lo que queda en \`E\` después de quitarla.")
check((not _ok) or not np.allclose(limpios, _sin_dividir), "Falta dividir entre \`d @ d\` el producto escalar de cada fila con \`d\`: sin esa división, solo sale bien si \`d\` tiene longitud 1.")
check((not _ok) or not np.allclose(limpios, _entre_norma), "Has dividido entre la norma de \`d\`. Como después se multiplica por \`d\`, que ya trae su longitud, hay que dividir entre \`d @ d\`.")
check((not _ok) or np.allclose(limpios @ _d1, 0), "Las filas de \`limpios\` tienen que ser ortogonales a \`d\`: su producto escalar con \`d\` debe valer 0.")
check((not _ok) or np.allclose(limpios, _esp1), "Con estos datos, «coche» y «bici» tienen que quedar iguales y «tractor» en el origen: a cada fila se le resta su proyección sobre \`d\`.")
_c2 = _llama([[1, 2], [3, 0], [0, 5]], [0, 1])
_c3 = _llama([[1, 2, 3], [4, 5, 6]], [1, 0, 0])
_c4 = _llama([[2, 4], [1, 7]], [3, 3])
check(_igual(_c2, [[1, 0], [3, 0], [0, 0]]), "Con \`E\` de 3 filas y \`d = (0, 1)\` la función tiene que dejar las filas sin su componente vertical: (1, 0), (3, 0) y (0, 0).")
check(_igual(_c3, [[0, 2, 3], [0, 5, 6]]), "La función tiene que valer para cualquier número de componentes: los embeddings reales tienen cientos, no solo 2.")
check(_igual(_c4, [[-1, 1], [-3, 3]]), "Con \`d = (3, 3)\`, que no tiene longitud 1, las filas (2, 4) y (1, 7) tienen que quedar en (-1, 1) y (-3, 3).")
`,
          reference: `import numpy as np

# Embeddings de juguete (inventados y de 2 dimensiones), uno por fila:
# coche, bici, camión, tractor
E = np.array([[-3, 2], [-2, 3], [-4, -1], [-3, -3]])
# La dirección que separa coche de bici
d = E[0] - E[1]

def quitar_componente(E, d):
    return E - np.outer((E @ d) / (d @ d), d)

limpios = quitar_componente(E, d)
`,
        },
        {
          id: 'proyeccion.ex02.5',
          type: 'codigo',
          prompt:
            'La llamada `plt.quiver(x0, y0, dx, dy, angles="xy", scale_units="xy", scale=1)` dibuja la flecha que sale del punto $(x_0, y_0)$ y avanza `dx` en horizontal y `dy` en vertical. Ya tienes `a = np.array([6, 2])` y `b = np.array([2, 2])`. Calcula en `p`, como array de NumPy, la proyección vectorial de `a` sobre `b`, y dibuja tres flechas desde el origen: la de `a`, la de `b` y la de `p`.',
          hints: [
            'Calcula primero `p` con la fórmula de la proyección vectorial; después hace falta una llamada a `plt.quiver` por flecha.',
            'La flecha de `a` sale de $(0, 0)$ y avanza `a[0]` en horizontal y `a[1]` en vertical. Las de `b` y `p` se dibujan igual.',
            'La flecha de `p` tiene que quedar sobre la recta de `b`: si no, `p` no es la sombra.',
          ],
          explain:
            'Cuando las tres flechas estén dibujadas, `p` debe quedar sobre la recta de `b`, y el segmento que une la punta de `p` con la de `a` debe formar un ángulo recto con `b`. Cada flecha necesita su propia llamada a `plt.quiver`, con las componentes del vector que dibuja.',
          solution:
            'Primero se calcula `p = (a @ b) / (b @ b) * b`: el cociente es $\\dfrac{16}{8}=2$, así que $\\vec{p}=2\\,(2, 2)=(4, 4)$. Después, una llamada por flecha: `plt.quiver(0, 0, a[0], a[1], angles="xy", scale_units="xy", scale=1)`, otra igual con `b[0], b[1]` y otra con `p[0], p[1]`. La flecha de `p` queda sobre la de `b`, más larga, y el segmento de su punta a la de `a` es perpendicular a `b`: $\\vec{a}-\\vec{p}=(2, -2)$ y $(2, -2)\\cdot(2, 2)=0$.',
          requirements: [
            '`p` existe y es un array de NumPy con 2 componentes, las dos números.',
            '`p` es la proyección vectorial de `a` sobre `b`: la flecha de la sombra, no un solo número.',
            'Hay una figura con tres flechas dibujadas con `plt.quiver`, una con las componentes de `a`, otra con las de `b` y otra con las de `p`.',
            'Todas las flechas están a escala, con las opciones `angles`, `scale_units` y `scale` que da el enunciado, sin cambiar sus valores.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt

a = np.array([6, 2])
b = np.array([2, 2])
plt.xlim(-1, 7)
plt.ylim(-1, 5)
plt.grid(True)
# Calcula p, la proyección vectorial de a sobre b, y dibuja las flechas de a, b y p
p = None
`,
          checks: `_ok = isinstance(p, np.ndarray) and p.shape == (2,)
_num = _ok and np.issubdtype(p.dtype, np.number)
check(_ok, "\`p\` tiene que ser un array de NumPy con 2 componentes: la proyección vectorial de \`a\` sobre \`b\`.")
check((not _ok) or _num, "Las componentes tienen que ser números, sin comillas.")
check((not _num) or not np.allclose(p, 16 / np.linalg.norm([2, 2]) * np.array([2, 2]), atol=0.01), "\`p\` vale (11,31; 11,31): has dividido entre la norma de \`b\`, que da la proyección escalar, y después has multiplicado por \`b\`, que ya trae su longitud. Hay que dividir entre \`b @ b\`.")
check((not _num) or not np.allclose(p, [2.4, 0.8], atol=0.01), "\`p\` vale (2,4; 0,8): has proyectado \`b\` sobre \`a\`, al revés. La sombra se proyecta sobre \`b\`.")
check((not _num) or np.allclose(p, [4, 4]), "\`p\` tiene que valer (4, 4): el cociente 16 / 8 = 2 multiplicado por \`b\`.")
_fig = len(plt.get_fignums()) > 0
check(_fig, "No hay ninguna figura: dibuja las flechas con \`plt.quiver\`.")
_flechas = [(float(u), float(v)) for ax in plt.gcf().axes for c in ax.collections if type(c).__name__ == "Quiver" for u, v in zip(np.ravel(np.ma.getdata(c.U)), np.ravel(np.ma.getdata(c.V)))] if _fig else []
check((not _fig) or len(_flechas) > 0, "No hay flechas en la figura: dibújalas con \`plt.quiver\`.")
_quivers = [c for ax in plt.gcf().axes for c in ax.collections if type(c).__name__ == "Quiver"] if _fig else []
check(all(isinstance(c.angles, str) and c.angles == "xy" and c.scale_units == "xy" and c.scale == 1 for c in _quivers), 'Las flechas no están dibujadas a escala: sin opciones, \`plt.quiver\` estira o encoge cada flecha a su aire y no llegan adonde dicen sus componentes. Añade \`angles="xy", scale_units="xy", scale=1\` a cada llamada.')
check(len(_flechas) == 0 or any(np.allclose(f, [6, 2]) for f in _flechas), "Falta la flecha de \`a\`: tiene que avanzar 6 en horizontal y 2 en vertical.")
check(len(_flechas) == 0 or any(np.allclose(f, [2, 2]) for f in _flechas), "Falta la flecha de \`b\`: tiene que avanzar 2 en horizontal y 2 en vertical.")
check(len(_flechas) == 0 or any(np.allclose(f, [4, 4]) for f in _flechas), "Falta la flecha de \`p\`, la proyección: tiene que avanzar 4 en horizontal y 4 en vertical.")
`,
          reference: `import numpy as np
import matplotlib.pyplot as plt

a = np.array([6, 2])
b = np.array([2, 2])
plt.xlim(-1, 7)
plt.ylim(-1, 5)
plt.grid(True)
p = (a @ b) / (b @ b) * b
plt.quiver(0, 0, a[0], a[1], angles="xy", scale_units="xy", scale=1)
plt.quiver(0, 0, b[0], b[1], angles="xy", scale_units="xy", scale=1)
plt.quiver(0, 0, p[0], p[1], angles="xy", scale_units="xy", scale=1)
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'proyeccion.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien ha escrito este código para guardar en `proy` la proyección vectorial de `a` sobre `b`: la flecha de la sombra (NumPy ya está importado como `np`). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Haz el cálculo a mano con $\\vec{a}=(6, 2)$ y $\\vec{b}=(2, 2)$: ¿cuánto mide la sombra? ¿Y la flecha que da el código?',
        'La sombra no puede ser más larga que la propia $\\vec{a}$ en la dirección de $\\vec{b}$. ¿Es razonable el tamaño de la flecha que sale?',
        'El número `k` se multiplica después por `b`, que ya trae su propia longitud. ¿Entre qué hay que dividir para no contarla dos veces?',
      ],
      explain:
        'Comprueba con números cuánto mide la flecha que devuelve el código y compárala con la sombra que dibujarías. Después revisa entre qué número se divide, sabiendo que el resultado se multiplica luego por $\\vec{b}$.',
      solution:
        'La tercera línea está mal. `k` se multiplica después por `b`, que ya tiene su propia longitud, así que hay que dividir entre `b @ b` (la norma al cuadrado), no entre la norma. Dividir entre la norma da la proyección escalar, $\\dfrac{16}{2\\sqrt{2}}\\approx 5{,}66$, y multiplicarla por `b` alarga la flecha $\\lVert\\vec{b}\\rVert$ veces de más: sale $(11{,}31;\\ 11{,}31)$. Lo correcto es `k = (a @ b) / (b @ b)`, que vale $\\dfrac{16}{8}=2$ y da `proy` $=(4, 4)$.',
      lines: [
        'a = np.array([6, 2])',
        'b = np.array([2, 2])',
        'k = (a @ b) / np.linalg.norm(b)',
        'proy = k * b',
      ],
      faultyLine: 2,
    },
    {
      id: 'proyeccion.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula la proyección vectorial de $\\vec{a}=(3, 1)$ sobre $\\vec{b}=(2, 2)$: la sombra de $\\vec{a}$ sobre la recta de $\\vec{b}$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Comprueba el producto escalar de la primera línea.',
        'Al proyectar sobre $\\vec{b}$, ¿qué producto escalar va en el denominador y por qué vector se multiplica al final?',
      ],
      explain:
        'Recuerda qué vector marca la recta sobre la que se proyecta: el denominador y el vector final salen de él. Revisa en cada línea de quién se está hablando.',
      solution:
        'La segunda línea está mal. Se proyecta $\\vec{a}$ sobre $\\vec{b}$, así que se divide entre $\\vec{b}\\cdot\\vec{b}=2\\cdot 2+2\\cdot 2=8$, no entre $\\vec{a}\\cdot\\vec{a}$, y el resultado multiplica a $\\vec{b}$, no a $\\vec{a}$. Lo que hace ese razonamiento es proyectar $\\vec{b}$ sobre $\\vec{a}$. Lo correcto es $\\dfrac{8}{8}\\,(2, 2)=(2, 2)$.',
      lines: [
        'a · b = 3·2 + 1·2 = 8',
        'a · a = 3·3 + 1·1 = 10',
        'proy = (8 / 10) · a = (2,4; 0,8)',
      ],
      faultyLine: 1,
    },
    {
      id: 'proyeccion.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula la componente perpendicular de $\\vec{a}=(7, 1)$ respecto a $\\vec{b}=(1, 1)$: lo que queda de $\\vec{a}$ al quitarle su sombra sobre la recta de $\\vec{b}$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Comprueba con calma cada producto escalar.',
        'Para saber si el resultado final es razonable, comprueba la propiedad que lo define: la componente perpendicular debe ser ortogonal a $\\vec{b}$.',
      ],
      explain:
        'Revisa cada paso y, al final, comprueba el resultado con la propiedad que lo define: la componente perpendicular debe ser ortogonal a $\\vec{b}$ y, sumada a la sombra, devolver $\\vec{a}$.',
      solution:
        'No hay ningún error. Los productos escalares son $\\vec{a}\\cdot\\vec{b}=8$ y $\\vec{b}\\cdot\\vec{b}=2$, la sombra es $\\dfrac{8}{2}(1, 1)=(4, 4)$ y lo que sobra es $(7-4,\\ 1-4)=(3, -3)$. Se comprueba: $(3, -3)\\cdot(1, 1)=0$, así que es ortogonal a $\\vec{b}$, y $(4, 4)+(3, -3)=(7, 1)=\\vec{a}$.',
      lines: [
        'a · b = 7·1 + 1·1 = 8',
        'b · b = 1·1 + 1·1 = 2',
        'proy = (8 / 2) · (1, 1) = (4, 4)',
        'perpendicular = a − proy = (7 − 4, 1 − 4) = (3, −3)',
      ],
      faultyLine: null,
    },
  ],
};
