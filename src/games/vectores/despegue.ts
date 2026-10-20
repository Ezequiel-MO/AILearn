import type { PlaneSpec, Question } from '../../content/schema';
import { toy } from './toy';

/** Plano del despegue: rango 6 y rejilla de 1 en 1. */
const plane = (
  vectors: PlaneSpec['vectors'],
  readouts: PlaneSpec['readouts'],
  pair?: [string, string],
): PlaneSpec => ({ range: 6, snap: 1, vectors, readouts, ...(pair ? { pair } : {}) });

export const launch: Question[] = [
  {
    id: 'despegue.1',
    type: 'manipular',
    prompt:
      'Un **vector** del plano es una flecha que sale del origen y acaba en un punto. Sus **componentes** son las coordenadas de ese punto: la primera dice cuánto se avanza en horizontal y la segunda cuánto en vertical.\n\nArrastra la punta de $\\vec{v}$ desde $(1, 1)$ hasta el punto $(3, 2)$ y fíjate en cómo cambian las lecturas mientras la mueves.',
    hints: [
      'Agarra el anillo de la punta de la flecha y arrástralo; las lecturas del panel se actualizan en vivo.',
      'El punto $(3, 2)$ está 3 unidades a la derecha del origen y 2 hacia arriba.',
    ],
    explain:
      'Las componentes de un vector son las coordenadas de su punta. Mira la lectura de $\\vec{v}$ mientras arrastras: cuando valga lo que se pide, estás en el sitio.',
    solution:
      'La punta debe quedar en $(3, 2)$: 3 unidades a la derecha del origen y 2 hacia arriba. Entonces $\\vec{v}$ tiene componentes $x=3$ e $y=2$, que es lo que marca la lectura.',
    plane: plane([{ id: 'v', label: 'v', x: 1, y: 1, movable: true }], ['components']),
    goals: [
      { metric: 'x', of: ['v'], target: 3, tol: 0.01 },
      { metric: 'y', of: ['v'], target: 2, tol: 0.01 },
    ],
  },
  {
    id: 'despegue.2',
    type: 'opcion',
    prompt:
      'Ahora al revés: hay que leer las componentes de una flecha ya dibujada. Mira hasta dónde llega su punta: primero en horizontal (a la derecha es positivo) y después en vertical (hacia arriba es positivo).\n\n¿Cuáles son las componentes de la flecha dibujada?',
    hints: [
      'Empieza por el eje horizontal: ¿la punta queda a la izquierda o a la derecha del origen, y cuántas unidades?',
      'Después mira el eje vertical: ¿arriba o abajo, y cuántas unidades? Escribe siempre primero la $x$ y luego la $y$.',
    ],
    explain:
      'Comprueba el sentido de cada eje con la punta de la flecha: a la izquierda y abajo es negativo. Y cuida el orden: primero la horizontal.',
    solution:
      'La punta queda 2 unidades a la izquierda del origen ($x=-2$) y 3 hacia arriba ($y=3$): las componentes son $(-2, 3)$. En $(3, -2)$ los números están en el orden contrario, en $(2, 3)$ falla el signo de $x$ y en $(-2, -3)$ el de $y$.',
    plane: plane([{ id: 'a', label: 'a', x: -2, y: 3, movable: false }], []),
    options: ['$(3, -2)$', '$(2, 3)$', '$(-2, 3)$', '$(-2, -3)$'],
    correct: 2,
  },
  {
    id: 'despegue.3',
    type: 'vector',
    prompt:
      'Escribe las componentes del vector dibujado: primero la $x$ y después la $y$. Pon un número en cada casilla.',
    hints: [
      'Cuenta las unidades que hay desde el origen hasta la punta, primero en horizontal.',
      'Si la punta queda por debajo del eje horizontal, la segunda componente es negativa.',
    ],
    explain:
      'Una componente es positiva si la punta queda a la derecha (o arriba) del origen y negativa si queda a la izquierda (o abajo).',
    solution:
      'La punta está 4 unidades a la derecha del origen y 1 por debajo del eje horizontal, así que las componentes son $(4, -1)$.',
    plane: plane([{ id: 'w', label: 'w', x: 4, y: -1, movable: false }], []),
    answer: [4, -1],
    tol: 0,
  },
  {
    id: 'despegue.4',
    type: 'numero',
    prompt:
      'El vector $\\vec{v}=(5, -3)$ tiene dos componentes: la primera es la $x$ y la segunda es la $y$. ¿Cuánto vale su componente $y$?',
    hints: [
      'La $y$ es la segunda componente, la que va después de la coma.',
      'Una componente se copia tal cual, con su signo.',
    ],
    explain:
      'Las componentes se nombran por orden: la primera es $x$ y la segunda es $y$. Aquí se pide una sola, la segunda, y conserva su signo.',
    solution:
      'En $(5, -3)$ la primera componente es $x=5$ y la segunda es $y=-3$. La respuesta es $-3$, con su signo negativo.',
    answer: -3,
    tol: 0,
  },
  {
    id: 'despegue.5',
    type: 'opcion',
    prompt:
      'Un modelo de IA no entiende palabras, solo números. Un **embedding** es la manera de convertir un texto en números.\n\n¿Qué es un embedding?',
    hints: [
      'Piensa en cómo se marca un lugar en un mapa: con unas coordenadas.',
      'La gracia de un embedding es que dice algo sobre el significado: textos con significado parecido deben acabar en sitios parecidos.',
    ],
    explain:
      'Un embedding hace con un texto lo que las coordenadas hacen con un lugar: lo sitúa. Y se calcula para que la cercanía signifique parecido.',
    solution:
      'Un embedding es una lista de números que sitúa un texto como un punto de un espacio, de modo que textos parecidos queden cerca. No es un resumen, ni una traducción, ni un recuento de palabras. Los embeddings reales tienen cientos de dimensiones; los de este juego son inventados y de dos, para poder dibujarlos.',
    options: [
      'Un resumen del texto en una sola frase que conserva sus ideas principales',
      'Una lista de números que sitúa un texto como un punto, de modo que textos parecidos queden cerca',
      'La traducción del texto a otro idioma, palabra por palabra y respetando el orden original de cada frase',
      'El número de palabras que tiene el texto, para saber si es largo o corto',
    ],
    correct: 1,
  },
  {
    id: 'despegue.6',
    type: 'manipular',
    prompt:
      'Este mapa es **inventado** y tiene solo dos dimensiones, para poder dibujarlo: cada palabra es un punto, y las que significan cosas parecidas están cerca. (Los embeddings reales tienen cientos de dimensiones, pero la idea es la misma.)\n\n«gato» está en $(3, 4)$. Arrastra «perro» hasta que quede cerca de «gato»: a una distancia de $1$, con un margen de $0{,}5$ (vale cualquier distancia entre $0{,}5$ y $1{,}5$). La lectura de la distancia, $d$, te dice cuánto las separa.',
    hints: [
      'Mira la lectura de la distancia mientras arrastras: tiene que quedar entre 0,5 y 1,5.',
      'Cualquier punto vecino de «gato» sirve, por ejemplo uno que esté justo a su lado.',
    ],
    explain:
      'La distancia entre dos puntos mide cuánto se parecen sus palabras en el mapa: cuanto más cerca, más parecidas. Aquí buscas un punto que esté a una distancia de 1 de «gato», con margen de 0,5.',
    solution:
      'Sirve cualquier punto a una distancia de «gato» entre $0{,}5$ y $1{,}5$. En esta rejilla son los cuatro vecinos directos de $(3, 4)$, que están a distancia $1$: $(2, 4)$, $(4, 4)$, $(3, 3)$ y $(3, 5)$; y las cuatro diagonales, a distancia $\\sqrt{2}\\approx 1{,}41$: $(2, 3)$, $(4, 3)$, $(2, 5)$ y $(4, 5)$.',
    plane: plane(
      [
        { id: 'gato', label: 'gato', x: toy['gato']![0], y: toy['gato']![1], movable: false },
        { id: 'perro', label: 'perro', x: -3, y: -3, movable: true },
      ],
      ['distance'],
      ['perro', 'gato'],
    ),
    goals: [{ metric: 'distance', of: ['perro', 'gato'], target: 1, tol: 0.5 }],
  },
  {
    id: 'despegue.7',
    type: 'codigo',
    prompt:
      'En Python, la librería **NumPy** guarda un vector como un *array*. Crea en la variable `v` el vector $(3, 2)$: un array de NumPy con las componentes $3$ y $2$, en ese orden.',
    hints: [
      'NumPy ya está importado con el nombre `np`.',
      'La función es `np.array(...)` y recibe **una lista** con las componentes entre corchetes.',
    ],
    explain:
      'Un array se crea pasando a `np.array` una lista con sus componentes. Si pasas los números sueltos, sin los corchetes, Python da un error.',
    solution:
      'Se escribe `v = np.array([3, 2])`. Los corchetes forman la lista `[3, 2]` y `np.array` la convierte en un array con dos componentes.',
    requirements: [
      '`v` existe y es un array de NumPy con 2 componentes, las dos números.',
      '`v` es el vector que pide el enunciado: la componente $x$ primero y la $y$ después.',
    ],
    starter: `import numpy as np

# Crea v con las componentes 3 y 2
v = None
`,
    checks: `check(isinstance(v, np.ndarray), "v tiene que ser un array de NumPy: créalo con np.array([...]).")
check(isinstance(v, np.ndarray) and v.shape == (2,), "v tiene que tener 2 componentes en una sola fila, es decir, forma (2,): np.array([a, b]).")
check(not (isinstance(v, np.ndarray) and v.shape == (2,)) or np.issubdtype(v.dtype, np.number), "Las componentes tienen que ser números, sin comillas.")
check(isinstance(v, np.ndarray) and v.shape == (2,) and np.issubdtype(v.dtype, np.number) and np.allclose(v, [3, 2]), "v tiene que valer (3, 2): primero la componente x y después la y.")
`,
    reference: 'import numpy as np\n\nv = np.array([3, 2])\n',
  },
  {
    id: 'despegue.8',
    type: 'codigo',
    prompt:
      'Ya tienes `v = np.array([5, -3])`. Guarda sus componentes en dos variables: `x` con la primera e `y` con la segunda.',
    hints: [
      'Un array se lee con corchetes: `v[0]` es la primera componente.',
      'En Python se cuenta desde 0, así que la segunda componente es `v[1]`.',
    ],
    explain:
      'Para sacar una componente de un array se escribe su posición entre corchetes, y en Python las posiciones empiezan en 0, no en 1.',
    solution:
      'La primera componente es `v[0]`, que vale $5$, y la segunda es `v[1]`, que vale $-3$. Basta con `x = v[0]` e `y = v[1]`.',
    requirements: [
      '`x` e `y` existen y cada una es un único número: ni una lista ni un array de varias componentes.',
      '`x` es la primera componente de `v` e `y` es la segunda.',
    ],
    starter: `import numpy as np

v = np.array([5, -3])
# Guarda la primera componente en x y la segunda en y
x = None
y = None
`,
    checks: `def _es_numero(a):
    return isinstance(a, (int, float, np.number)) or (isinstance(a, np.ndarray) and a.ndim == 0 and np.issubdtype(a.dtype, np.number))

check(_es_numero(x), "x tiene que ser un número (un único valor), no una lista ni None.")
check(_es_numero(x) and np.isclose(x, 5), "x tiene que valer 5, la primera componente de v. Recuerda que en Python se empieza a contar en 0.")
check(_es_numero(y), "y tiene que ser un número (un único valor), no una lista ni None.")
check(_es_numero(y) and np.isclose(y, -3), "y tiene que valer -3, la segunda componente de v. Recuerda que en Python se empieza a contar en 0.")
`,
    reference: 'import numpy as np\n\nv = np.array([5, -3])\nx = v[0]\ny = v[1]\n',
  },
  {
    id: 'despegue.9',
    type: 'codigo',
    prompt:
      'Con `plt.quiver` (de matplotlib) se dibujan flechas. La llamada de abajo ya dibuja `v` saliendo del origen; solo faltan las componentes. Completa `v` para que la flecha llegue al punto $(3, 2)$.',
    hints: [
      'La flecha acaba en el punto cuyas coordenadas son las componentes de `v`.',
      'Escribe `v = np.array([..., ...])` con la $x$ y la $y$ del punto.',
    ],
    explain:
      'La instrucción `plt.quiver(0, 0, v[0], v[1], ...)` dibuja una flecha que sale de $(0, 0)$ y avanza `v[0]` en horizontal y `v[1]` en vertical. Por eso, las componentes de `v` son las del punto al que debe llegar.',
    solution:
      'La flecha debe acabar en $(3, 2)$, así que `v = np.array([3, 2])`. Con eso, `plt.quiver` dibuja una flecha que avanza 3 en horizontal y 2 en vertical desde el origen.',
    requirements: [
      '`v` existe y es un array de NumPy con 2 componentes, las dos números.',
      '`v` es el vector que hace llegar la flecha al punto que pide el enunciado.',
      'Hay una figura con una flecha dibujada con `plt.quiver` que avanza en horizontal y en vertical lo que dicen las componentes de `v`.',
    ],
    starter: `import numpy as np
import matplotlib.pyplot as plt

# Completa las componentes de v para que la flecha llegue a (3, 2)
v = np.array([0, 0])

plt.quiver(0, 0, v[0], v[1], angles="xy", scale_units="xy", scale=1)
plt.xlim(-1, 5)
plt.ylim(-1, 5)
plt.grid(True)
`,
    checks: `_ok = isinstance(v, np.ndarray) and v.shape == (2,)
check(_ok, "v tiene que ser un array de NumPy con 2 componentes: np.array([x, y]).")
check((not _ok) or np.issubdtype(v.dtype, np.number), "Las componentes tienen que ser números, sin comillas.")
check(_ok and np.issubdtype(v.dtype, np.number) and np.allclose(v, [3, 2]), "v tiene que valer (3, 2) para que la flecha llegue al punto (3, 2).")
check(len(plt.get_fignums()) > 0, "No hay ninguna figura: la llamada a plt.quiver tiene que ejecutarse.")
_flechas = [c for ax in plt.gcf().axes for c in ax.collections if type(c).__name__ == "Quiver"] if plt.get_fignums() else []
check(len(_flechas) > 0 and any(np.allclose(np.ravel(f.U), 3) and np.allclose(np.ravel(f.V), 2) for f in _flechas), "La flecha dibujada no avanza 3 en horizontal y 2 en vertical: revisa las componentes que recibe plt.quiver.")
`,
    reference: `import numpy as np
import matplotlib.pyplot as plt

v = np.array([3, 2])

plt.quiver(0, 0, v[0], v[1], angles="xy", scale_units="xy", scale=1)
plt.xlim(-1, 5)
plt.ylim(-1, 5)
plt.grid(True)
`,
  },
  {
    id: 'despegue.10',
    type: 'opcion',
    prompt:
      'En NumPy, el atributo `.shape` de un array dice cuántos elementos tiene en cada eje, y siempre es una **tupla**. Un vector es un array de un solo eje.\n\n¿Qué valor da `np.array([1, 2, 3]).shape`?',
    hints: [
      'El array tiene un solo eje y 3 elementos.',
      'Como `.shape` siempre es una tupla, una tupla de un solo elemento se escribe con una coma al final.',
    ],
    explain:
      'La forma de un array es una tupla con un número por cada eje. Un vector tiene un solo eje, así que su tupla tiene un solo número.',
    solution:
      'El array tiene un eje con 3 elementos: su forma es `(3,)`. La coma final es lo que distingue una tupla de un solo elemento de un simple número entre paréntesis. `3` no es una tupla; `(1, 3)` y `(3, 1)` serían matrices de una fila o de una columna, con dos ejes (no confundas los ejes del array con las dimensiones del vector: este vector tiene 3).',
    options: ['`3`', '`(1, 3)`', '`(3,)`', '`(3, 1)`'],
    correct: 2,
  },
];
