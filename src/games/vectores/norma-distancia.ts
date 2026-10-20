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

/** Tercer proyecto de la Órbita 0: cuánto mide un vector y cuánto separa a dos. */
export const normaDistancia: Project = {
  id: 'norma-distancia',
  name: 'Norma y distancia',
  sub: 'Cuánto mide y cuánto separa',
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'norma-distancia.ex00.1',
          type: 'manipular',
          prompt:
            'La **norma** de un vector, $\\lVert\\vec{v}\\rVert$, es la longitud de su flecha. Arrastra la punta de $\\vec{v}$ hasta que su norma valga $5$: la lectura «‖v‖» del panel la calcula por ti.',
          hints: [
            'Mira la lectura de la norma mientras arrastras: crece cuando la punta se aleja del origen.',
            'Sirve cualquier punta que esté a 5 unidades del origen, hacia donde quieras. Las hay sobre los ejes y fuera de ellos.',
          ],
          explain:
            'La norma solo depende de lo lejos que queda la punta del origen, no de hacia dónde apunta. Por eso muchas flechas distintas tienen la misma norma.',
          solution:
            'Sirve cualquier punta a 5 unidades del origen. Con componentes enteras: $(3, 4)$, $(4, 3)$, $(5, 0)$ o $(0, 5)$. Por ejemplo, con $\\vec{v}=(3, 4)$: $\\lVert\\vec{v}\\rVert=\\sqrt{3^2+4^2}=\\sqrt{25}=5$.',
          plane: plane([arrow('v', [1, 2], true)], ['components', 'norm']),
          goals: [{ metric: 'norm', of: ['v'], target: 5, tol: 0.01 }],
        },
        {
          id: 'norma-distancia.ex00.2',
          type: 'manipular',
          prompt:
            'La **distancia** entre dos puntos es lo que mide la flecha que va de uno al otro. $\\vec{u}$ está fijo en $(1, 1)$. Coloca $\\vec{v}$ de modo que la distancia entre las puntas de $\\vec{u}$ y $\\vec{v}$ sea $5$: la lectura «d(u, v)» del panel te la da.',
          hints: [
            'Mira cómo cambia «d(u, v)» al mover $\\vec{v}$: vale 0 cuando las dos puntas coinciden.',
            'Aléjate de $\\vec{u}$ en línea recta, por ejemplo hacia arriba, hasta que «d(u, v)» valga 5.',
          ],
          explain:
            'La distancia entre dos vectores es la norma de la flecha que va de uno a otro, $\\lVert\\vec{v}-\\vec{u}\\rVert$. No depende de dónde estén respecto al origen, sino de lo separadas que queden sus puntas.',
          solution:
            'Sirve cualquier punta de $\\vec{v}$ a 5 unidades de $(1, 1)$. Por ejemplo, $\\vec{v}=(4, 5)$: la flecha de $\\vec{u}$ a $\\vec{v}$ es $\\vec{v}-\\vec{u}=(3, 4)$ y su norma es $\\sqrt{9+16}=5$. También sirven $(6, 1)$ o $(1, 6)$.',
          plane: plane(
            [arrow('u', [1, 1], false), arrow('v', [1, 2], true)],
            ['components', 'distance'],
            ['u', 'v'],
          ),
          goals: [{ metric: 'distance', of: ['u', 'v'], target: 5, tol: 0.01 }],
        },
        {
          id: 'norma-distancia.ex00.3',
          type: 'manipular',
          prompt:
            'Un vector es **unitario** si su norma es $1$. En este plano la rejilla es más fina: de $0{,}2$ en $0{,}2$. Haz que $\\vec{v}$ sea unitario y que su componente $x$ valga $0{,}6$.',
          hints: [
            'Mira las dos lecturas: «‖v‖» tiene que valer 1 y la primera componente, 0,6.',
            'Con la $x$ ya fijada en 0,6, solo falta la $y$: pruébalas hasta que «‖v‖» llegue a 1. Hay dos que sirven.',
          ],
          explain:
            'Con la $x$ fija, la norma solo depende de $y$, y como $y$ se eleva al cuadrado, un valor y su opuesto dan la misma norma.',
          solution:
            'Como la norma es $\\sqrt{x^2+y^2}$, hay que cumplir $x^2+y^2=1$ con $x=0{,}6$, así que $y^2=1-0{,}36=0{,}64$ y $y=0{,}8$ o $y=-0{,}8$. Sirven $\\vec{v}=(0{,}6;\\ 0{,}8)$ y $\\vec{v}=(0{,}6;\\ -0{,}8)$.',
          plane: plane([arrow('v', [1, 1], true)], ['components', 'norm'], undefined, 2, 0.2),
          goals: [
            { metric: 'norm', of: ['v'], target: 1, tol: 0.01 },
            { metric: 'x', of: ['v'], target: 0.6, tol: 0.01 },
          ],
        },
        {
          id: 'norma-distancia.ex00.4',
          type: 'manipular',
          prompt:
            'En una búsqueda semántica, la consulta se convierte en un embedding y se buscan los textos cuyos embeddings quedan cerca. Este mapa es un juguete **inventado** de dos dimensiones (los embeddings reales tienen cientos). «perro» está fijo en $(4, 3)$: coloca la consulta $\\vec{q}$ a menos de $1{,}5$ de «perro», sin ponerla encima.',
          hints: [
            'Mira la lectura «d(q, perro)»: tiene que ser menor que 1,5 y mayor que 0.',
            'En esta rejilla, los puntos de al lado de «perro» y los de sus diagonales cumplen la condición.',
          ],
          explain:
            'La distancia mide lo parecidos que son dos embeddings: cuanto menor, más parecidos. Una búsqueda semántica devuelve los textos cuyo embedding queda a menor distancia del de la consulta.',
          solution:
            'Sirven los ocho puntos que rodean a «perro»: los cuatro de al lado, a distancia $1$ ($(3, 3)$, $(5, 3)$, $(4, 2)$ y $(4, 4)$), y los cuatro de las esquinas, a $\\sqrt{2}\\approx 1{,}41$. Todos son consultas muy cercanas al embedding de «perro».',
          plane: plane(
            [arrow('perro', toy['perro']!, false), arrow('q', [-2, 1], true)],
            ['components', 'distance'],
            ['q', 'perro'],
          ),
          goals: [{ metric: 'distance', of: ['q', 'perro'], target: 1.2, tol: 0.3 }],
        },
        {
          id: 'norma-distancia.ex00.5',
          type: 'manipular',
          prompt:
            'Dos vectores tienen la misma **dirección y el mismo sentido** cuando sus flechas apuntan hacia el mismo lado, aunque una sea más larga. $\\vec{u}$ está fijo en $(3, 4)$. Coloca $\\vec{w}$ en la misma dirección y sentido que $\\vec{u}$ y con norma $10$. Para comprobar la dirección, mira «d(w, u)»: si $\\vec{w}$ apunta como $\\vec{u}$, esa distancia es la diferencia de las dos normas.',
          hints: [
            'La lectura «‖w‖» tiene que valer 10. La norma de $\\vec{u}$ es 5.',
            'Si $\\vec{w}$ apunta como $\\vec{u}$, «d(w, u)» vale $10-5=5$. Si vale más, $\\vec{w}$ apunta hacia otro lado.',
          ],
          explain:
            'Una norma de 10 no basta: hay muchas flechas de esa longitud en direcciones distintas. Solo las que apuntan como $\\vec{u}$ están a la distancia justa, la que separa sus longitudes.',
          solution:
            'La norma de $\\vec{u}$ es $\\sqrt{9+16}=5$, y $\\vec{w}$ mide el doble: es $2\\vec{u}=(6, 8)$. Comprobación: $\\lVert\\vec{w}\\rVert=\\sqrt{36+64}=10$ y $\\vec{w}-\\vec{u}=(3, 4)$ mide $5$. Es el único punto de la rejilla que cumple las dos condiciones.',
          plane: plane(
            [arrow('u', [3, 4], false), arrow('w', [2, 1], true)],
            ['components', 'norm', 'distance'],
            ['w', 'u'],
            10,
            1,
          ),
          goals: [
            { metric: 'norm', of: ['w'], target: 10, tol: 0.01 },
            { metric: 'distance', of: ['w', 'u'], target: 5, tol: 0.01 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'norma-distancia.ex01.1',
          type: 'numero',
          prompt:
            'La norma de un vector es la longitud de su flecha, y sale del teorema de Pitágoras: $\\lVert\\vec{v}\\rVert=\\sqrt{x^2+y^2}$. Calcula la norma de $\\vec{v}=(3, 4)$.',
          hints: [
            'Empieza por los cuadrados de las componentes: $3^2$ y $4^2$.',
            'Suma los dos cuadrados y haz la raíz cuadrada de esa suma. El resultado es un número entero.',
          ],
          explain:
            'La raíz cuadrada se hace al final, sobre la suma de los cuadrados, y no sobre cada componente. Si sumas las componentes sin elevarlas al cuadrado, sale otra cosa.',
          solution: '$\\lVert\\vec{v}\\rVert=\\sqrt{3^2+4^2}=\\sqrt{9+16}=\\sqrt{25}=5$.',
          answer: 5,
          tol: 0,
        },
        {
          id: 'norma-distancia.ex01.2',
          type: 'numero',
          prompt:
            'La norma sirve con cualquier número de componentes: se elevan al cuadrado todas, se suman y se hace la raíz. Un embedding real, con cientos de componentes, tiene también su norma. Calcula la norma de $\\vec{v}=(1, -2, 2)$.',
          hints: [
            'El cuadrado de $-2$ es positivo.',
            'La suma de los tres cuadrados es un número cuya raíz es exacta.',
          ],
          explain:
            'Elevar al cuadrado elimina el signo: $(-2)^2=4$. Por eso una norma nunca es negativa.',
          solution: '$\\lVert\\vec{v}\\rVert=\\sqrt{1^2+(-2)^2+2^2}=\\sqrt{1+4+4}=\\sqrt{9}=3$.',
          answer: 3,
          tol: 0,
        },
        {
          id: 'norma-distancia.ex01.3',
          type: 'numero',
          prompt:
            'En este mapa de juguete (inventado y de dos dimensiones; los reales tienen cientos), «gato» está en $(3, 4)$ y «lobo» en $(4, -2)$. La distancia entre dos embeddings es la norma de su diferencia, y dice cuánto se parecen las palabras: cuanto mayor, menos. Calcula la distancia entre «gato» y «lobo», con dos decimales.',
          hints: [
            'Primero el vector que va de una palabra a la otra: resta sus componentes una a una.',
            'La distancia es la norma de ese vector. No sale entera: redondea a dos decimales.',
          ],
          explain:
            'Se resta primero y se hace la norma después. El orden de la resta da igual, porque cambiar el signo de las dos componentes no cambia la norma.',
          solution:
            'El vector de «gato» a «lobo» es $(4-3,\\ -2-4)=(1, -6)$ y su norma es $\\sqrt{1^2+(-6)^2}=\\sqrt{37}\\approx 6{,}08$. Las dos palabras quedan lejos en el mapa.',
          plane: plane(
            [arrow('gato', toy['gato']!, false), arrow('lobo', toy['lobo']!, false)],
            [],
          ),
          answer: 6.083,
          tol: 0.01,
        },
        {
          id: 'norma-distancia.ex01.4',
          type: 'vector',
          prompt:
            'Un vector **unitario** tiene norma $1$. Para obtener el unitario con la misma dirección que $\\vec{v}$, se divide cada componente entre $\\lVert\\vec{v}\\rVert$. Calcula el vector unitario en la dirección de $\\vec{v}=(3, 4)$, con los decimales que hagan falta. Muchos sistemas normalizan así los embeddings antes de compararlos, para que cuente la dirección y no la longitud.',
          hints: [
            'Primero necesitas la norma de $(3, 4)$.',
            'Divide la primera componente entre la norma y, después, la segunda.',
          ],
          explain:
            'Dividir un vector entre un número positivo cambia su longitud y no su dirección ni su sentido. Si ese número es la norma, la longitud pasa a ser exactamente 1.',
          solution:
            'Como $\\lVert\\vec{v}\\rVert=5$, el unitario es $\\left(\\dfrac{3}{5},\\ \\dfrac{4}{5}\\right)=(0{,}6;\\ 0{,}8)$. Comprobación: $\\sqrt{0{,}36+0{,}64}=1$.',
          answer: [0.6, 0.8],
          tol: 0.01,
        },
        {
          id: 'norma-distancia.ex01.5',
          type: 'opcion',
          prompt:
            'Una consulta tiene el embedding de juguete (inventado y de dos dimensiones; los reales tienen cientos) $\\vec{q}=(2, 4)$. Las palabras son «gato» $(3, 4)$, «perro» $(4, 3)$, «bici» $(-2, 3)$ y «lobo» $(4, -2)$. ¿Cuál queda más cerca de la consulta?',
          hints: [
            'La más cercana es la de menor distancia: calcula la distancia de $\\vec{q}$ a cada palabra.',
            'Resta primero $\\vec{q}$ a cada embedding y calcula la norma del resultado.',
          ],
          explain:
            'Una búsqueda semántica se queda con la palabra de menor distancia. Hay que calcular las cuatro: la que parece más cercana a simple vista no siempre lo es.',
          solution:
            'Las distancias a $\\vec{q}$ son: «gato», $\\sqrt{1^2+0^2}=1$; «perro», $\\sqrt{2^2+1^2}=\\sqrt{5}\\approx 2{,}24$; «bici», $\\sqrt{4^2+1^2}=\\sqrt{17}\\approx 4{,}12$; «lobo», $\\sqrt{2^2+6^2}=\\sqrt{40}\\approx 6{,}32$. La menor es la de «gato».',
          options: ['perro', 'gato', 'lobo', 'bici'],
          correct: 1,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'norma-distancia.ex02.1',
          type: 'codigo',
          prompt:
            'NumPy trae la función `np.linalg.norm`: se le pasa un vector y devuelve su norma. Con `v = np.array([3, 4])`, guarda en `n` la norma de `v`.',
          hints: [
            'La función devuelve un número, que es lo que tiene que quedar en `n`.',
            'Su argumento es el array con las componentes, aquí `v`.',
          ],
          explain:
            'La función aplica la fórmula entera de la norma: eleva al cuadrado, suma y hace la raíz. Por eso se le pasa el vector completo y no cada componente por separado.',
          solution:
            'Se escribe `n = np.linalg.norm(v)`. NumPy calcula $\\sqrt{3^2+4^2}=5$, así que `n` vale $5$.',
          requirements: [
            '`n` existe y es un único número: ni un array ni una lista.',
            '`n` es la norma de `v`.',
          ],
          starter: `import numpy as np

v = np.array([3, 4])
# Guarda en n la norma de v
n = None
`,
          checks: `_num = (isinstance(n, (int, float, np.number)) and not isinstance(n, bool)) or (isinstance(n, np.ndarray) and n.ndim == 0 and np.issubdtype(n.dtype, np.number))
check(_num, "\`n\` tiene que ser un número, la norma de \`v\`: no un array ni \`None\`.")
check((not _num) or not np.isclose(n, 25), "\`n\` vale 25: es la suma de los cuadrados y falta la raíz cuadrada. \`np.linalg.norm\` ya hace todo el cálculo.")
check(_num and np.isclose(n, 5), "\`n\` tiene que valer 5, la norma de (3, 4).")
`,
          reference: 'import numpy as np\n\nv = np.array([3, 4])\nn = np.linalg.norm(v)\n',
        },
        {
          id: 'norma-distancia.ex02.2',
          type: 'codigo',
          prompt:
            'Con `v = np.array([1, -2, 2])`, calcula en `n` la norma de `v` con la fórmula, sin usar `np.linalg.norm` (así ves qué hace esa función por dentro): la raíz de la suma de los cuadrados. Te harán falta tres piezas de NumPy: `v ** 2` eleva al cuadrado cada componente, `np.sum(a)` suma las componentes de un array `a` y `np.sqrt(x)` calcula la raíz cuadrada de un número.',
          hints: [
            'Hazlo en tres pasos: los cuadrados de las componentes, su suma y, al final, la raíz.',
            'Las piezas se encadenan: la raíz se aplica a la suma, y la suma a los cuadrados.',
          ],
          explain:
            'La norma es una cadena de tres operaciones y el orden importa: primero los cuadrados, luego la suma y la raíz al final. Si falta la raíz sale la suma de cuadrados; si faltan los cuadrados, sale la suma de las componentes.',
          solution:
            'Los cuadrados de las componentes son $(1, 4, 4)$, su suma es $9$ y la raíz de $9$ es $3$. En Python: `n = np.sqrt(np.sum(v ** 2))`. Da lo mismo que `np.linalg.norm(v)`, que hace justo este cálculo.',
          requirements: [
            '`n` existe y es un único número: ni un array ni una lista.',
            '`n` es la norma de `v`: la raíz de la suma de los cuadrados de sus componentes.',
          ],
          starter: `import numpy as np

v = np.array([1, -2, 2])
# Guarda en n la norma de v, sin np.linalg.norm
n = None
`,
          checks: `_num = (isinstance(n, (int, float, np.number)) and not isinstance(n, bool)) or (isinstance(n, np.ndarray) and n.ndim == 0 and np.issubdtype(n.dtype, np.number))
check(_num, "\`n\` tiene que ser un número, la norma de \`v\`: no un array ni \`None\`.")
check((not _num) or not np.isclose(n, 9), "\`n\` vale 9: falta la raíz. Has sumado los cuadrados, pero la norma es la raíz cuadrada de esa suma.")
check((not _num) or not np.isclose(n, 1), "\`n\` vale 1: has sumado sin elevar al cuadrado. Los cuadrados se calculan antes de sumar, y así el signo no cuenta.")
check(_num and np.isclose(n, 3), "\`n\` tiene que valer 3, la norma de (1, -2, 2): la raíz de 1 + 4 + 4.")
`,
          reference:
            'import numpy as np\n\nv = np.array([1, -2, 2])\nn = np.sqrt(np.sum(v ** 2))\n',
        },
        {
          id: 'norma-distancia.ex02.3',
          type: 'codigo',
          prompt:
            'Los embeddings de juguete (inventados y de 2 dimensiones; los reales tienen cientos) de «gato» y «lobo» son `gato = np.array([3, 4])` y `lobo = np.array([4, -2])`. La distancia entre dos embeddings es la norma del vector que va de uno al otro. Guarda en `d` la distancia entre «gato» y «lobo».',
          hints: [
            'Primero hace falta el vector que va de uno al otro: una resta de arrays.',
            'Después, la norma de ese vector, no la de cada embedding por separado.',
          ],
          explain:
            'La distancia es la norma de la resta de los dos embeddings, no la resta de sus normas: dos puntos muy distintos pueden tener normas casi iguales.',
          solution:
            'La resta es $(3-4,\\ 4-(-2))=(-1,\\ 6)$ y su norma es $\\sqrt{37}\\approx 6{,}08$. En Python: `d = np.linalg.norm(gato - lobo)`. Restar las normas daría $5-4{,}47=0{,}53$, que no es la distancia.',
          requirements: [
            '`d` existe y es un único número: la longitud de un vector, no el vector mismo.',
            '`d` es la distancia entre «gato» y «lobo»: la norma del vector que va de uno a otro, no la diferencia entre sus normas.',
            'Como sale con decimales, se acepta una diferencia de hasta una centésima.',
          ],
          starter: `import numpy as np

# Embeddings de juguete: inventados y de 2 dimensiones
gato = np.array([3, 4])
lobo = np.array([4, -2])
# Guarda en d la distancia entre gato y lobo
d = None
`,
          checks: `_num = (isinstance(d, (int, float, np.number)) and not isinstance(d, bool)) or (isinstance(d, np.ndarray) and d.ndim == 0 and np.issubdtype(d.dtype, np.number))
_dif = isinstance(d, np.ndarray) and d.shape == (2,) and np.issubdtype(d.dtype, np.number) and (np.allclose(d, [1, -6]) or np.allclose(d, [-1, 6]))
check(_num, "\`d\` tiene que ser un número, la distancia: no un array ni \`None\`.")
check(not _dif, "\`d\` es el vector que va de un punto al otro, no su longitud: falta calcular su norma.")
check((not _num) or not np.isclose(np.abs(d), 0.5279, atol=0.01), "\`d\` vale 0,5279 (o -0,5279): has restado las normas, no los vectores. Primero se restan los vectores y después se calcula la norma de la resta.")
check((not _num) or not np.isclose(d, 7.2801, atol=0.001), "\`d\` vale 7,2801: has sumado los vectores en vez de restarlos.")
check(_num and np.isclose(d, 6.0828, atol=0.01), "\`d\` tiene que valer 6,0828 (6,08 con dos decimales), la norma del vector que va de gato a lobo.")
`,
          reference: `import numpy as np

# Embeddings de juguete: inventados y de 2 dimensiones
gato = np.array([3, 4])
lobo = np.array([4, -2])
d = np.linalg.norm(gato - lobo)
`,
        },
        {
          id: 'norma-distancia.ex02.4',
          type: 'codigo',
          prompt:
            'Con `v = np.array([3, 4])`, guarda en `u` el vector unitario con la dirección de `v`: el que sale de dividir `v` entre su norma. Un array se divide entre un número componente a componente: `np.array([2, 4]) / 2` es el array de componentes 1 y 2.',
          hints: [
            'Necesitas la norma de `v`, y ya conoces la función que la calcula.',
            'Es una sola división: el array entre un número.',
          ],
          explain:
            'Dividir entre la norma deja la longitud en 1 y no cambia la dirección. Se divide siempre entre la norma, no entre su cuadrado ni entre la suma de las componentes.',
          solution:
            'La norma de `v` es $5$ y `u = v / np.linalg.norm(v)` divide cada componente entre ella: $(3/5,\\ 4/5)=(0{,}6;\\ 0{,}8)$. La norma de `u` es $1$.',
          requirements: [
            '`u` existe y es un array de NumPy con 2 componentes, las dos números.',
            '`u` apunta en la misma dirección que `v` y su norma es 1.',
          ],
          starter: `import numpy as np

v = np.array([3, 4])
# Guarda en u el vector unitario con la dirección de v
u = None
`,
          checks: `_arr = isinstance(u, np.ndarray) and u.shape == (2,)
_num = _arr and np.issubdtype(u.dtype, np.number)
check(_arr, "\`u\` tiene que ser un array de NumPy con 2 componentes: el resultado de dividir el array \`v\` entre un número.")
check((not _arr) or _num, "Las componentes tienen que ser números, sin comillas.")
check((not _num) or not np.allclose(u, [3, 4]), "\`u\` sigue valiendo lo mismo que \`v\`: falta dividirlo entre su norma.")
check((not _num) or not np.allclose(u, [0.12, 0.16]), "\`u\` vale (0,12; 0,16): has dividido entre 25, la suma de los cuadrados. Hay que dividir entre la norma, que es su raíz.")
check(_num and np.isclose(np.linalg.norm(u), 1), "La norma de \`u\` tiene que ser 1: divide entre la norma de \`v\`, no entre otro número.")
check(_num and np.allclose(u, [0.6, 0.8]), "\`u\` tiene que valer (0,6; 0,8), la misma dirección que \`v\` con norma 1.")
`,
          reference: 'import numpy as np\n\nv = np.array([3, 4])\nu = v / np.linalg.norm(v)\n',
        },
        {
          id: 'norma-distancia.ex02.5',
          type: 'codigo',
          prompt:
            'Los embeddings de juguete (inventados y de 2 dimensiones; los reales tienen cientos) están en el diccionario `emb`, y la consulta es `q = np.array([2, 4])`. Guarda en `mas_cercana` la palabra de `emb` cuyo embedding queda más cerca de `q`: así funciona una búsqueda semántica. Te hacen falta dos piezas nuevas de Python.\n\nPrimera: `for palabra in emb:` repite, una vez por cada clave del diccionario, las líneas de debajo que estén sangradas (metidas hacia la derecha; se hace con la tecla Tab). En cada vuelta `palabra` vale esa clave, así que `emb[palabra]` es su embedding.\n\nSegunda: `if a < b:` ejecuta sus líneas solo cuando `a` es menor que `b`. Esas líneas van sangradas un nivel más adentro. Un ejemplo con otra tarea, guardar en `adulto` un nombre de un diccionario `edad` cuya edad pasa de 17:\n\n```python\nfor nombre in edad:\n    if edad[nombre] > 17:\n        adulto = nombre\n```\n\nTu programa sigue ese esquema. Ya tienes `menor`, la distancia más pequeña vista hasta ahora, que empieza siendo muy grande. En cada vuelta (dentro del `for`, antes del `if`), calcula la distancia de `q` a `emb[palabra]`. Si es menor que `menor`, guarda esa distancia en `menor` y la palabra en `mas_cercana`.',
          hints: [
            'Dentro del bucle, calcula la distancia de `q` a `emb[palabra]`. Es un número: la norma de la resta `q - emb[palabra]`, no la resta sola.',
            'Si has llamado `d` a esa distancia, la comparación es `if d < menor:`. Dentro del `if` van dos líneas, con un nivel más de sangrado: una guarda `d` en `menor` y la otra guarda `palabra` en `mas_cercana`.',
          ],
          explain:
            'Buscar el vecino más cercano es quedarse con el mínimo de las distancias. El bucle va recordando la mejor palabra y su distancia, y solo las cambia cuando encuentra una menor.',
          solution:
            'Para cada clave de `emb`, en su orden, se calcula la distancia a `q`: «perro» está a $\\sqrt{5}\\approx 2{,}24$, «gato» a $1$, «lobo» a $\\sqrt{40}\\approx 6{,}32$ y «bici» a $\\sqrt{17}\\approx 4{,}12$. El programa completo tiene dos niveles de sangrado: el cálculo de `d` y el `if` van dentro del `for`, y las dos asignaciones van dentro del `if`.\n\n```python\nfor palabra in emb:\n    d = np.linalg.norm(q - emb[palabra])\n    if d < menor:\n        menor = d\n        mas_cercana = palabra\n```\n\nAsí `menor` y `mas_cercana` solo cambian cuando aparece una palabra más cercana que todas las anteriores: aquí, con «perro» y después con «gato». La ganadora es «gato».',
          requirements: [
            '`mas_cercana` existe y es un texto: una de las claves de `emb`, no su vector.',
            '`mas_cercana` es la palabra de `emb` cuyo embedding queda a menor distancia de `q`.',
          ],
          starter: `import numpy as np

# Embeddings de juguete: inventados y de 2 dimensiones
emb = {
    "perro": np.array([4, 3]),
    "gato": np.array([3, 4]),
    "lobo": np.array([4, -2]),
    "bici": np.array([-2, 3]),
}
q = np.array([2, 4])
# Guarda en mas_cercana la palabra de emb más cercana a q
mas_cercana = None
menor = 1000  # distancia más pequeña vista hasta ahora: empieza muy grande
`,
          checks: `_str = isinstance(mas_cercana, str)
check(_str, "\`mas_cercana\` tiene que ser la palabra (un texto entre comillas, una de las claves de \`emb\`), no su vector ni \`None\`. Si ya has escrito el bucle y sigue valiendo \`None\`, o el \`if\` no se cumple nunca (revisa que \`menor\` empiece muy grande y hacia dónde mira la comparación: la nueva distancia tiene que ser menor que \`menor\`) o \`mas_cercana = palabra\` no se ejecuta.")
check((not _str) or mas_cercana in emb, "\`mas_cercana\` tiene que ser una de las claves de \`emb\`.")
check((not _str) or mas_cercana != "lobo", "\`lobo\` no es la más cercana a \`q\`: está a unas 6,32 unidades, la más lejana de las cuatro, y la más cercana está a 1. Suele pasar si te quedas con la distancia mayor en vez de la menor (la comparación al revés, con \`menor\` empezando en 0), si restas las normas en vez de los vectores (\`q\` y \`lobo\` miden lo mismo, y aun así están lejos) o si \`d\` no sale de la resta \`q - emb[palabra]\` (una suma o un producto, por ejemplo).")
check((not _str) or mas_cercana != "perro", "\`perro\` no es la más cercana a \`q\`. Es la primera clave de \`emb\` y ninguna palabra tiene una norma mayor que la suya. Si el bucle se queda con la primera palabra, revisa que recorra todas y que compare cada distancia con \`menor\`. Si \`d\` es la resta de las normas de \`q\` y de \`emb[palabra]\`, gana la palabra de norma más grande y no la más cercana: \`d\` tiene que ser la norma de la resta \`q - emb[palabra]\`.")
check((not _str) or mas_cercana != "bici", "\`bici\` no es la más cercana a \`q\`: está a unas 4,12 unidades, y la más cercana está a 1. Suele pasar si \`d\` no es la distancia a \`q\`, por ejemplo la norma de \`emb[palabra]\` (\`bici\` es la de menor norma) o una resta de normas. También si el bucle acaba en la última clave, \`bici\`: falta la comparación con \`menor\`, el \`if\` no está dentro del \`for\`, la nueva distancia no se guarda en \`menor\` dentro del \`if\`, o \`mas_cercana = palabra\` no está dentro del \`if\`.")
check(_str and mas_cercana == "gato", "\`mas_cercana\` tiene que ser la palabra de menor distancia a \`q\`: gato.")
`,
          reference: `import numpy as np

# Embeddings de juguete: inventados y de 2 dimensiones
emb = {
    "perro": np.array([4, 3]),
    "gato": np.array([3, 4]),
    "lobo": np.array([4, -2]),
    "bici": np.array([-2, 3]),
}
q = np.array([2, 4])
mas_cercana = None
menor = 1000
for palabra in emb:
    d = np.linalg.norm(q - emb[palabra])
    if d < menor:
        menor = d
        mas_cercana = palabra
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'norma-distancia.hoja.1',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula la norma del vector $\\vec{v}=(1, 2, 2)$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Escribe la definición de la norma y compárala con lo que hace cada línea.',
        'Fíjate en si aparece algún cuadrado o alguna raíz.',
      ],
      explain:
        'Aplica tú la definición de la norma a los datos del enunciado y compara tu resultado con el de cada paso.',
      solution:
        'La segunda línea está mal: la norma no es la suma de las componentes, faltan los cuadrados y la raíz. Lo correcto es $\\lVert\\vec{v}\\rVert=\\sqrt{1^2+2^2+2^2}=\\sqrt{9}=3$. La tercera línea hereda el error: 5 no es la norma.',
      lines: ['v = (1, 2, 2)', '‖v‖ = 1 + 2 + 2', '‖v‖ = 5'],
      faultyLine: 1,
    },
    {
      id: 'norma-distancia.hoja.2',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere guardar en `d` la distancia entre los puntos `a` y `b` (NumPy ya está importado como `np`). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'La distancia es la norma de un vector: ¿de cuál?',
        'Compara lo que se resta con lo que se debería restar.',
      ],
      explain:
        'Piensa qué mide `d` y qué mide el resultado de esa cuenta: no tienen por qué ser lo mismo.',
      solution:
        'La tercera línea está mal: resta las normas de `a` y de `b`, cuando hay que restar los vectores y calcular la norma de la resta. Da $5-4{,}47=0{,}53$ en vez de $\\sqrt{37}\\approx 6{,}08$. Lo correcto es `d = np.linalg.norm(a - b)`.',
      lines: [
        'a = np.array([3, 4])',
        'b = np.array([4, -2])',
        'd = np.linalg.norm(a) - np.linalg.norm(b)',
      ],
      faultyLine: 2,
    },
    {
      id: 'norma-distancia.hoja.3',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Este código quiere guardar en `u` el vector unitario con la dirección de `v` (NumPy ya está importado como `np`). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        '¿Qué hay que hacer con `v` para que su norma pase a ser 1?',
        'Calcula a mano lo que daría el resultado y comprueba su norma.',
      ],
      explain: 'Revisa cada línea: ¿hace lo que pide el enunciado?',
      solution:
        'No hay ningún error. `np.linalg.norm(v)` vale $5$, y dividir `v` entre ese número da $(0{,}6;\\ 0{,}8)$, cuya norma es $1$ y que apunta igual que `v`.',
      lines: ['v = np.array([3, 4])', 'u = v / np.linalg.norm(v)'],
      faultyLine: null,
    },
  ],
};
