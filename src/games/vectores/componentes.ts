import type { PlaneSpec, PlaneVector, Project } from '../../content/schema';
import { toy } from './toy';

/** Plano del proyecto: rango 6 y rejilla de 1 en 1. */
const plane = (
  vectors: PlaneVector[],
  readouts: PlaneSpec['readouts'],
  pair?: [string, string],
): PlaneSpec => ({ range: 6, snap: 1, vectors, readouts, ...(pair ? { pair } : {}) });

/** Un vector del plano, móvil o fijo. */
const arrow = (
  id: string,
  [x, y]: readonly [number, number],
  movable: boolean,
  label: string = id,
): PlaneVector => ({ id, label, x, y, movable });

/** Primer proyecto de la Órbita 0: un vector es una flecha y es una lista. */
export const componentes: Project = {
  id: 'componentes',
  name: 'Componentes',
  sub: 'Un vector es una flecha y es una lista',
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'componentes.ex00.1',
          type: 'manipular',
          prompt:
            'Las componentes $(x, y)$ son las coordenadas de la punta de la flecha. Arrastra la punta de $\\vec{v}$ hasta que sus componentes sean $(4, 3)$: la lectura del panel te dice dónde está en cada momento.',
          hints: [
            'Mira la lectura de $\\vec{v}$ mientras arrastras.',
            'La primera componente cuenta unidades hacia la derecha y la segunda hacia arriba.',
          ],
          explain:
            'La primera componente se lee en el eje horizontal y la segunda en el vertical. Cuando la lectura de $\\vec{v}$ diga lo que se pide, la flecha está bien.',
          solution:
            'Hay que llevar la punta a 4 unidades a la derecha del origen y 3 hacia arriba, el punto $(4, 3)$. Entonces $\\vec{v}=(4, 3)$.',
          plane: plane([arrow('v', [1, 2], true, 'v')], ['components']),
          goals: [
            { metric: 'x', of: ['v'], target: 4, tol: 0.01 },
            { metric: 'y', of: ['v'], target: 3, tol: 0.01 },
          ],
        },
        {
          id: 'componentes.ex00.2',
          type: 'manipular',
          prompt:
            'Una componente puede ser negativa: la primera lo es cuando la punta queda a la izquierda del origen. Lleva $\\vec{v}$ hasta $(-2, 5)$.',
          hints: [
            'Para que la primera componente sea negativa hay que ir hacia la izquierda del origen.',
            'La segunda componente, 5, es positiva: la punta queda por encima del eje horizontal.',
          ],
          explain:
            'El signo de una componente indica el sentido: a la izquierda o abajo es negativo, a la derecha o arriba es positivo. Mira las lecturas mientras arrastras.',
          solution:
            'La punta debe quedar 2 unidades a la izquierda del origen y 5 hacia arriba, en $(-2, 5)$. Entonces $\\vec{v}=(-2, 5)$.',
          plane: plane([arrow('v', [2, -1], true, 'v')], ['components']),
          goals: [
            { metric: 'x', of: ['v'], target: -2, tol: 0.01 },
            { metric: 'y', of: ['v'], target: 5, tol: 0.01 },
          ],
        },
        {
          id: 'componentes.ex00.3',
          type: 'manipular',
          prompt:
            'Una componente vale $0$ cuando la flecha no avanza nada en esa dirección: la punta queda entonces sobre el otro eje. Lleva $\\vec{v}$ a $(0, -4)$: la flecha tiene que quedar sobre uno de los ejes.',
          hints: [
            'Con primera componente 0 no hay desplazamiento horizontal: la flecha va recta hacia arriba o hacia abajo.',
            'La segunda componente, $-4$, es negativa: hacia abajo.',
          ],
          explain:
            'Un vector con una componente igual a cero queda sobre un eje. Si es la primera, sobre el eje vertical; si es la segunda, sobre el horizontal.',
          solution:
            'Con $x=0$ la punta no se mueve en horizontal, y con $y=-4$ baja 4 unidades. La flecha apunta hacia abajo sobre el eje vertical y llega a $(0, -4)$.',
          plane: plane([arrow('v', [3, 2], true, 'v')], ['components']),
          goals: [
            { metric: 'x', of: ['v'], target: 0, tol: 0.01 },
            { metric: 'y', of: ['v'], target: -4, tol: 0.01 },
          ],
        },
        {
          id: 'componentes.ex00.4',
          type: 'manipular',
          prompt:
            'El **opuesto** de un vector tiene las mismas componentes con el signo cambiado: es la misma flecha dada la vuelta. Lleva $\\vec{u}$ a $(3, 1)$ y lleva $\\vec{v}$ al opuesto de $\\vec{u}$.',
          hints: [
            'Empieza por $\\vec{u}$: su punta debe quedar en $(3, 1)$.',
            'Cambia el signo de cada componente de $\\vec{u}$ para obtener el opuesto.',
          ],
          explain:
            'El opuesto de $(a, b)$ es $(-a, -b)$: cada componente cambia de signo. Geométricamente, la flecha apunta en sentido contrario y mide lo mismo.',
          solution:
            'Primero $\\vec{u}=(3, 1)$. Su opuesto cambia el signo de cada componente: $\\vec{v}=(-3, -1)$. Las dos flechas están sobre la misma recta y apuntan en sentidos contrarios.',
          plane: plane([arrow('u', [1, 1], true), arrow('v', [2, -2], true)], ['components']),
          goals: [
            { metric: 'x', of: ['u'], target: 3, tol: 0.01 },
            { metric: 'y', of: ['u'], target: 1, tol: 0.01 },
            { metric: 'x', of: ['v'], target: -3, tol: 0.01 },
            { metric: 'y', of: ['v'], target: -1, tol: 0.01 },
          ],
        },
        {
          id: 'componentes.ex00.5',
          type: 'manipular',
          prompt:
            'Este mapa es un juguete **inventado** de dos dimensiones: el eje horizontal va de «máquina» (izquierda) a «ser vivo» (derecha) y el vertical de «salvaje o industrial» (abajo) a «doméstico» (arriba). Un embedding real tiene cientos de dimensiones, pero funciona igual: cada palabra es un punto.\n\nEl embedding de «camión» es $(-4, -1)$: colócalo arrastrando su punta.',
          hints: [
            'El punto $(-4, -1)$ queda a la izquierda del origen y un poco por debajo del eje horizontal.',
            'Debería quedar cerca de otras máquinas, como «tractor» o «coche».',
          ],
          explain:
            'Un embedding es una lista de números, y por eso se puede dibujar como una flecha o un punto. Aquí la primera componente de «camión» es muy negativa: es una máquina, no un ser vivo.',
          solution:
            'Las componentes de «camión» son $(-4, -1)$: 4 unidades a la izquierda del origen y 1 hacia abajo. Queda en la zona de las máquinas, cerca de «tractor» y de «coche», y lejos de los animales.',
          plane: plane(
            [
              arrow('coche', toy['coche']!, false),
              arrow('tractor', toy['tractor']!, false),
              arrow('camion', [2, 2], true, 'camión'),
            ],
            ['components'],
          ),
          goals: [
            { metric: 'x', of: ['camion'], target: -4, tol: 0.01 },
            { metric: 'y', of: ['camion'], target: -1, tol: 0.01 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'componentes.ex01.1',
          type: 'vector',
          prompt:
            'En este mapa de juguete (inventado y de dos dimensiones; los reales tienen cientos), la flecha dibujada es el embedding de «coche». Escribe sus componentes: primero la $x$ y después la $y$.',
          hints: [
            'Cuenta las unidades desde el origen hasta la punta, primero en horizontal.',
            'La punta queda a la izquierda del origen y por encima del eje horizontal.',
          ],
          explain:
            'Leer las componentes de una flecha es leer las coordenadas de su punta. Atiende al signo: izquierda y abajo son negativos.',
          solution:
            'La punta queda 3 unidades a la izquierda del origen ($x=-3$) y 2 hacia arriba ($y=2$). El embedding de «coche» es $(-3, 2)$.',
          plane: plane([arrow('coche', toy['coche']!, false)], []),
          answer: [-3, 2],
          tol: 0,
        },
        {
          id: 'componentes.ex01.2',
          type: 'numero',
          prompt:
            'En NumPy, `v = np.array([7, -2])`. Para sacar una componente se escribe su posición entre corchetes. ¿Cuánto vale `v[1]`?',
          hints: [
            'En Python las posiciones se cuentan desde 0: `v[0]` es la primera componente.',
            '`v[1]` es, por tanto, la segunda componente.',
          ],
          explain:
            'El primer elemento de un array está en la posición 0, no en la 1. Por eso `v[1]` es la segunda componente, no la primera.',
          solution: 'La posición 0 es el $7$ y la posición 1 es el $-2$. Así que `v[1]` vale $-2$.',
          answer: -2,
          tol: 0,
        },
        {
          id: 'componentes.ex01.3',
          type: 'opcion',
          prompt:
            'La **dimensión** de un vector es su número de componentes. ¿Cuántas dimensiones tiene el vector $(1, 0, -2, 5)$?',
          hints: [
            'Cuenta todos los números de la lista, sea cual sea su valor.',
            'Un cero también es una componente.',
          ],
          explain:
            'Un vector de $n$ componentes vive en un espacio de $n$ dimensiones. Las componentes nulas cuentan igual que las demás.',
          solution:
            'El vector tiene cuatro componentes, $1$, $0$, $-2$ y $5$, así que tiene 4 dimensiones. El cero cuenta: no se descarta aunque valga cero.',
          options: ['3', '5', '4', '1'],
          correct: 2,
        },
        {
          id: 'componentes.ex01.4',
          type: 'vector',
          prompt:
            'Un vector también puede unir dos puntos. Escribe las componentes del vector que va del punto $A=(1, 2)$ al punto $B=(4, 6)$: lo que hay que avanzar en horizontal y en vertical para llegar de uno a otro.',
          hints: [
            'Mira cuánto cambia la $x$ al ir de $A$ a $B$, y después cuánto cambia la $y$.',
            'Cada componente es la coordenada del punto de llegada menos la del punto de salida.',
          ],
          explain:
            'El vector de $A$ a $B$ es $B-A$: llegada menos salida, componente a componente. Si restas al revés, obtienes el vector opuesto.',
          solution:
            'Se resta componente a componente: $B-A=(4-1,\\ 6-2)=(3, 4)$. Hay que avanzar 3 en horizontal y 4 en vertical.',
          answer: [3, 4],
          tol: 0,
        },
        {
          id: 'componentes.ex01.5',
          type: 'opcion',
          prompt:
            'Los embeddings de este juego son de juguete y tienen 2 dimensiones. Los de un modelo de verdad suelen tener cientos: por ejemplo, 768. ¿Qué es un embedding de 768 dimensiones?',
          hints: [
            'Piensa en cuántas componentes tiene el vector de un punto de un mapa de 2 dimensiones.',
            'El número de dimensiones es el número de componentes de la lista.',
          ],
          explain:
            'La dimensión de un embedding es su número de componentes. No se puede dibujar, pero se opera igual que con los de dos dimensiones.',
          solution:
            'Un embedding de 768 dimensiones es una lista de 768 números, un punto de un espacio de 768 dimensiones. No es una matriz de $768\\times 768$, ni 768 palabras, ni un número entre 0 y 768.',
          options: [
            'Una matriz de 768 × 768 números',
            '768 palabras guardadas en una lista',
            'Un número entre 0 y 768',
            'Una lista de 768 números',
          ],
          correct: 3,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'componentes.ex02.1',
          type: 'codigo',
          prompt: 'Crea en la variable `v` el vector $(4, 3)$ como un array de NumPy.',
          hints: [
            'NumPy está importado como `np`.',
            '`np.array` recibe una lista entre corchetes con las componentes.',
          ],
          explain:
            'Un vector de NumPy se crea con `np.array` y una lista de componentes. Los números van dentro de unos corchetes, no sueltos.',
          solution:
            'Se escribe `v = np.array([4, 3])`: la lista `[4, 3]` tiene las dos componentes y `np.array` la convierte en un array.',
          requirements: [
            '`v` existe y es un array de NumPy con 2 componentes, las dos números.',
            '`v` es el vector que pide el enunciado: la componente $x$ primero y la $y$ después.',
          ],
          starter: `import numpy as np

# Crea v con las componentes 4 y 3
v = None
`,
          checks: `check(isinstance(v, np.ndarray), "\`v\` tiene que ser un array de NumPy: créalo con \`np.array([...])\`.")
check(isinstance(v, np.ndarray) and v.shape == (2,), "\`v\` tiene que tener 2 componentes en una sola fila, es decir, forma \`(2,)\`: \`np.array([a, b])\`.")
check(not (isinstance(v, np.ndarray) and v.shape == (2,)) or np.issubdtype(v.dtype, np.number), "Las componentes tienen que ser números, sin comillas.")
check(isinstance(v, np.ndarray) and v.shape == (2,) and np.issubdtype(v.dtype, np.number) and np.allclose(v, [4, 3]), "\`v\` tiene que valer (4, 3): primero la componente x y después la y.")
`,
          reference: 'import numpy as np\n\nv = np.array([4, 3])\n',
        },
        {
          id: 'componentes.ex02.2',
          type: 'codigo',
          prompt:
            'Ya tienes el vector `v = np.array([1, 0, -2, 5, 3])`. Guarda en `dim` su número de dimensiones, es decir, cuántas componentes tiene.',
          hints: [
            'Un array tiene atributos y funciones que describen su tamaño.',
            'El atributo `size` y la función `len` cuentan los elementos; `v.ndim` cuenta otra cosa, los ejes del array.',
          ],
          explain:
            'Las dimensiones de un vector son sus componentes. En NumPy, `v.ndim` no sirve: un vector siempre tiene un solo eje, sea cual sea su longitud.',
          solution:
            'El vector tiene 5 componentes, así que `dim` debe valer $5$. Se puede obtener con `dim = v.size`, con `dim = len(v)` o con `dim = v.shape[0]`.',
          requirements: [
            '`dim` existe y es un único número: ni una tupla ni una lista.',
            '`dim` es el número de componentes de `v`.',
          ],
          starter: `import numpy as np

v = np.array([1, 0, -2, 5, 3])
# Guarda en dim el número de dimensiones de v
dim = None
`,
          checks: `_ent = isinstance(dim, (int, float, np.number)) and not isinstance(dim, bool)
check(_ent, "\`dim\` tiene que ser un número: cuántas componentes tiene \`v\`, no una tupla ni \`None\`.")
check(_ent and dim == 5, "\`dim\` tiene que valer 5, las componentes de \`v\`. Si te ha salido 1, has contado los ejes del array con \`v.ndim\`: prueba con \`v.size\` o \`len(v)\`.")
`,
          reference: 'import numpy as np\n\nv = np.array([1, 0, -2, 5, 3])\ndim = v.size\n',
        },
        {
          id: 'componentes.ex02.3',
          type: 'codigo',
          prompt:
            'Tienes los puntos `A = np.array([1, 2])` y `B = np.array([4, 6])`. Calcula en `d`, como array de NumPy, el vector que va de $A$ a $B$.',
          hints: [
            'El vector de un punto a otro se obtiene restando coordenadas.',
            'NumPy resta dos arrays con el signo menos, componente a componente: solo hay que decidir cuál va primero.',
          ],
          explain:
            'Con arrays, la resta se hace componente a componente en una sola operación. Importa el orden: llegada menos salida; al revés sale el vector opuesto.',
          solution:
            'El vector de $A$ a $B$ es $B-A=(3, 4)$. En Python, `d = B - A`: NumPy resta cada componente con su pareja.',
          requirements: [
            '`d` existe y es un array de NumPy con 2 componentes, las dos números.',
            '`d` es el vector que va de $A$ a $B$: lo que hay que avanzar en $x$ y en $y$ para llegar de uno a otro.',
          ],
          starter: `import numpy as np

A = np.array([1, 2])
B = np.array([4, 6])
# Calcula d, el vector que va de A a B
d = None
`,
          checks: `_ok = isinstance(d, np.ndarray) and d.shape == (2,)
_num = _ok and np.issubdtype(d.dtype, np.number)
check(_ok, "\`d\` tiene que ser un array de NumPy con 2 componentes: el vector que va de \`A\` a \`B\`.")
check((not _ok) or _num, "Las componentes tienen que ser números, sin comillas.")
check((not _num) or not np.allclose(d, [-3, -4]), "\`d\` vale (-3, -4): has restado al revés. El vector de \`A\` a \`B\` es \`B - A\`, llegada menos salida.")
check(_num and np.allclose(d, [3, 4]), "\`d\` tiene que valer (3, 4): lo que hay que avanzar en x y en y para ir de \`A\` a \`B\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([1, 2])\nB = np.array([4, 6])\nd = B - A\n',
        },
        {
          id: 'componentes.ex02.4',
          type: 'codigo',
          prompt:
            'Un diccionario `emb` (se consulta con la clave entre corchetes, como `emb["gato"]`) guarda los embeddings de juguete (inventados y de 2 dimensiones; los reales tienen cientos) de cuatro palabras. Guarda en `v` el embedding de «perro» y en `primera` su primera componente.',
          hints: [
            'El embedding de «perro» se pide igual, con su clave.',
            'La primera componente de un array está en la posición 0.',
          ],
          explain:
            'Cada valor de `emb` es un array, así que se le aplica todo lo que ya sabes: se consulta por clave y después se indexa por posición, empezando en 0.',
          solution:
            'Primero `v = emb["perro"]`, que es el array $(4, 3)$. Su primera componente es `v[0]`, es decir, `primera = v[0]`, que vale $4$.',
          requirements: [
            '`v` existe y es un array de NumPy con 2 componentes, las dos números: el embedding de «perro».',
            '`primera` existe y es un único número, no un array: la primera componente del embedding de «perro».',
          ],
          starter: `import numpy as np

# Embeddings de juguete: inventados y de 2 dimensiones
emb = {
    "gato": np.array([3, 4]),
    "perro": np.array([4, 3]),
    "coche": np.array([-3, 2]),
    "bici": np.array([-2, 3]),
}
# Guarda en v el embedding de "perro" y en primera su primera componente
v = None
primera = None
`,
          checks: `_ok = isinstance(v, np.ndarray) and v.shape == (2,)
check(_ok, "\`v\` tiene que ser el embedding de «perro»: un array de 2 componentes que se consulta en \`emb\`.")
check((not _ok) or np.issubdtype(v.dtype, np.number), "Las componentes tienen que ser números, sin comillas.")
check(_ok and np.issubdtype(v.dtype, np.number) and np.allclose(v, [4, 3]), "\`v\` tiene que valer (4, 3), el embedding de «perro»: busca esa clave en el diccionario \`emb\`.")
_num = isinstance(primera, (int, float, np.number)) or (isinstance(primera, np.ndarray) and primera.ndim == 0 and np.issubdtype(primera.dtype, np.number))
check(_num, "\`primera\` tiene que ser un número (un único valor), no un array ni \`None\`.")
check(_num and np.isclose(primera, 4), "\`primera\` tiene que valer 4, la primera componente de «perro». Si te sale 3, has cogido la segunda: la primera está en la posición 0.")
`,
          reference: `import numpy as np

# Embeddings de juguete: inventados y de 2 dimensiones
emb = {
    "gato": np.array([3, 4]),
    "perro": np.array([4, 3]),
    "coche": np.array([-3, 2]),
    "bici": np.array([-2, 3]),
}
v = emb["perro"]
primera = v[0]
`,
        },
        {
          id: 'componentes.ex02.5',
          type: 'codigo',
          prompt:
            'Con `plt.scatter(x, y)` se dibuja un punto por cada pareja de coordenadas. Dibuja en el plano los cuatro puntos de `emb`, los embeddings de juguete (inventados y de 2 dimensiones; los reales tienen cientos): la primera componente va en horizontal y la segunda en vertical. Puedes llamar a `plt.scatter` una vez por palabra, con su primera componente y su segunda.',
          hints: [
            'Cada palabra de `emb` es un array de dos componentes: la primera es la $x$ del punto y la segunda es la $y$. Basta con una llamada a `plt.scatter` por palabra.',
            'El punto de «gato» se dibuja con `plt.scatter(emb["gato"][0], emb["gato"][1])`; haz lo mismo con las otras tres palabras.',
          ],
          explain:
            'Un mapa de embeddings es solo una nube de puntos: cada palabra es un punto cuyas coordenadas son las componentes de su vector. A `plt.scatter` hay que darle la $x$ y la $y$ de cada palabra, y las dos están dentro de su array, cada una en su posición.',
          solution:
            'Se dibuja un punto por palabra, con su primera componente como $x$ y la segunda como $y$: `plt.scatter(emb["gato"][0], emb["gato"][1])`, y lo mismo con «perro», «coche» y «bici», en cuatro llamadas. Más corto, con un bucle: `for p in emb.values(): plt.scatter(p[0], p[1])`, que repite la llamada con cada embedding de `emb`.',
          requirements: [
            'Hay una figura con exactamente 4 puntos dibujados con `plt.scatter`: uno por palabra de `emb`, ni más ni menos.',
            'Cada punto tiene como $x$ la primera componente de un embedding de `emb` y como $y$ la segunda.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt

# Embeddings de juguete: inventados y de 2 dimensiones
emb = {
    "gato": np.array([3, 4]),
    "perro": np.array([4, 3]),
    "coche": np.array([-3, 2]),
    "bici": np.array([-2, 3]),
}
# Dibuja los cuatro puntos con plt.scatter
`,
          checks: `_fig = len(plt.get_fignums()) > 0
check(_fig, "No hay ninguna figura: dibuja los puntos con \`plt.scatter\`.")
_pts = [tuple(float(c) for c in p) for ax in plt.gcf().axes for col in ax.collections if type(col).__name__ == "PathCollection" for p in np.asarray(col.get_offsets())] if _fig else []
check((not _fig) or len(_pts) >= 4, "Faltan puntos: tiene que haber 4 puntos en la figura, uno por palabra de \`emb\`, dibujados con \`plt.scatter\`.")
check((not _fig) or len(_pts) <= 4, "Sobran puntos: dibuja solo los cuatro puntos de \`emb\` con \`plt.scatter\`.")
check(len(_pts) != 4 or sorted(_pts) == sorted(tuple(float(c) for c in p) for p in emb.values()), "Los puntos no son los de \`emb\`: la primera componente de cada embedding va en el eje horizontal y la segunda en el vertical.")
`,
          reference: `import numpy as np
import matplotlib.pyplot as plt

# Embeddings de juguete: inventados y de 2 dimensiones
emb = {
    "gato": np.array([3, 4]),
    "perro": np.array([4, 3]),
    "coche": np.array([-3, 2]),
    "bici": np.array([-2, 3]),
}
plt.scatter(emb["gato"][0], emb["gato"][1])
plt.scatter(emb["perro"][0], emb["perro"][1])
plt.scatter(emb["coche"][0], emb["coche"][1])
plt.scatter(emb["bici"][0], emb["bici"][1])
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'componentes.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien ha escrito este código para guardar en `y` la **segunda** componente de `v` (NumPy ya está importado como `np`). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        '¿Cuántas componentes tiene `v`?',
        'En Python las posiciones de un array empiezan en 0.',
      ],
      explain:
        'Cuenta las componentes de `v` y piensa qué posiciones existen. Después mira qué posición se pide.',
      solution:
        'La segunda línea está mal. `v` tiene dos componentes, en las posiciones 0 y 1, y `v[2]` se sale del array: da un `IndexError`. La segunda componente es `v[1]`.',
      lines: ['v = np.array([3, 4])', 'y = v[2]'],
      faultyLine: 1,
    },
    {
      id: 'componentes.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula el vector que va de un punto a otro. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Comprueba la regla de la segunda línea: ¿es llegada menos salida?',
        'Haz tú la resta de la tercera línea componente a componente.',
      ],
      explain:
        'Revisa cada línea: ¿la regla es la correcta? ¿Se aplica bien a los datos que se dan?',
      solution:
        'No hay ningún error. El vector de $A$ a $B$ es $B-A$, llegada menos salida, y con $A=(2, 1)$ y $B=(5, 5)$ sale $(5-2,\\ 5-1)=(3, 4)$, como dice la tercera línea.',
      lines: ['A = (2, 1) y B = (5, 5)', 'El vector de A a B es B − A', 'B − A = (3, 4)'],
      faultyLine: null,
    },
    {
      id: 'componentes.hoja.3',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Este código crea el vector $(3, 4)$ y muestra su forma (NumPy ya está importado como `np`). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        '¿Qué argumentos espera `np.array`? ¿Una lista o varios números sueltos?',
        'Fíjate en los corchetes.',
      ],
      explain:
        '`np.array` espera un único argumento con todas las componentes dentro. Comprueba qué recibe en este código.',
      solution:
        'La primera línea está mal: faltan los corchetes. `np.array(3, 4)` pasa dos argumentos sueltos y da un error. Lo correcto es `np.array([3, 4])`, con las componentes en una lista.',
      lines: ['v = np.array(3, 4)', 'print(v.shape)'],
      faultyLine: 0,
    },
  ],
};
