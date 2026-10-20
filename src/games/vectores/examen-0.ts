import type { BankEntry } from '../../content/schema';

/**
 * Banco de examen de la Órbita 0: cuatro entradas por proyecto. Las generadas dan un enunciado
 * distinto en cada examen; las fijas son las preguntas que no se pueden generar.
 * Ids: `examen-0.<tema>`, únicos en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen0: BankEntry[] = [
  // ---------- componentes ----------
  {
    project: 'componentes',
    question: {
      type: 'generada',
      id: 'examen-0.desplazamiento',
      generator: 'desplazamiento',
      params: {},
    },
  },
  {
    project: 'componentes',
    question: {
      id: 'examen-0.forma',
      type: 'opcion',
      prompt:
        'En NumPy, `A = np.array([[1, 2], [3, 4], [5, 6]])` es una **matriz**: un array con dos ejes, el de las filas y el de las columnas. El atributo `.shape` dice cuántos elementos hay a lo largo de cada eje, primero las filas y después las columnas. ¿Qué devuelve `A.shape`? En IA, un lote de embeddings se guarda así, con una fila por palabra, y conocer la forma evita errores al combinarlos.',
      hints: [
        'Cada lista interior es una fila: cuéntalas.',
        'Mira cuántos números tiene una fila: ese es el número de columnas.',
      ],
      explain:
        'La forma se lee como (filas, columnas). Las filas son las listas interiores y las columnas, los números que tiene cada una; no confundas el orden.',
      solution:
        '`A` tiene tres filas, `[1, 2]`, `[3, 4]` y `[5, 6]`, y cada una tiene dos números, así que `A.shape` es `(3, 2)`. `(2, 3)` saldría si se intercambiaran las filas y las columnas, y `(6,)` es la forma de un vector con los seis números en una sola fila.',
      options: ['`(2, 3)`', '`(6,)`', '`(3, 2)`', '`(3,)`'],
      correct: 2,
    },
  },
  {
    project: 'componentes',
    question: {
      id: 'examen-0.dibujado',
      type: 'vector',
      prompt:
        'La flecha $\\vec{w}$ parte del origen. Escribe sus componentes: primero la $x$ y después la $y$. Leer las componentes de una flecha es pasar del dibujo a la lista de números con la que trabaja un ordenador.',
      hints: [
        'La primera componente cuenta unidades en horizontal: a la izquierda del origen es negativa.',
        'La segunda componente cuenta unidades en vertical: hacia arriba es positiva.',
      ],
      explain:
        'Las componentes son las coordenadas de la punta de la flecha. Fíjate en el signo de cada una: izquierda y abajo son negativos, derecha y arriba son positivos.',
      solution:
        'La punta queda 5 unidades a la izquierda del origen y 2 hacia arriba: las componentes son $(-5, 2)$.',
      plane: {
        range: 6,
        snap: 1,
        vectors: [{ id: 'w', label: 'w', x: -5, y: 2, movable: false }],
        readouts: [],
      },
      answer: [-5, 2],
      tol: 0,
    },
  },
  {
    project: 'componentes',
    question: {
      id: 'examen-0.bici-y',
      type: 'codigo',
      prompt:
        'El diccionario `emb` (se consulta con la clave entre corchetes, como `emb["coche"]`) guarda los embeddings de juguete (inventados y de 2 dimensiones; los reales tienen cientos) de cuatro máquinas. Guarda en `y` la segunda componente del embedding de «bici»: es la que dice si una palabra es doméstica (positiva) o salvaje o industrial (negativa).',
      hints: [
        'Primero se elige la palabra con su clave.',
        'La segunda componente de un array está en la posición 1, porque se empieza a contar en 0.',
      ],
      explain:
        'El embedding de una palabra es un array: se consulta por clave y después se indexa por posición, contando desde 0. Fíjate en que eliges la palabra y la posición adecuadas.',
      solution:
        'Se escribe `y = emb["bici"][1]`: `emb["bici"]` es el array $(-2, 3)$ y la posición 1 es su segunda componente, así que `y` vale $3$.',
      requirements: [
        '`y` existe y es un único número: no un array con varias componentes.',
        '`y` es la segunda componente del embedding de «bici».',
      ],
      starter: `import numpy as np

# Embeddings de juguete: inventados y de 2 dimensiones
emb = {
    "coche": np.array([-3, 2]),
    "bici": np.array([-2, 3]),
    "camión": np.array([-4, -1]),
    "tractor": np.array([-3, -3]),
}
# Guarda en y la segunda componente del embedding de "bici"
y = None
`,
      checks: `_arr = isinstance(y, np.ndarray)
_num = (isinstance(y, (int, float, np.number)) and not isinstance(y, bool)) or (_arr and y.ndim == 0 and np.issubdtype(y.dtype, np.number))
check(_num, "\`y\` tiene que ser un único número, la segunda componente de «bici». Si te sale un array con dos números, falta elegir una posición.")
check((not _num) or not np.isclose(y, -2, rtol=0, atol=0), "\`y\` vale -2: es la primera componente de «bici». La segunda está en la posición 1, porque se empieza a contar en 0.")
check((not _num) or not np.isclose(y, 2, rtol=0, atol=0), "\`y\` vale 2: es la segunda componente de «coche» y también el número de componentes de cada embedding. Suele pasar si la clave no es \`\\"bici\\"\` o si se cuentan las componentes en vez de leer una.")
check(_num and np.isclose(y, 3, rtol=0, atol=0), "\`y\` tiene que valer 3, la segunda componente del embedding de «bici».")
`,
      reference: `import numpy as np

# Embeddings de juguete: inventados y de 2 dimensiones
emb = {
    "coche": np.array([-3, 2]),
    "bici": np.array([-2, 3]),
    "camión": np.array([-4, -1]),
    "tractor": np.array([-3, -3]),
}
y = emb["bici"][1]
`,
    },
  },

  // ---------- suma-escala ----------
  {
    project: 'suma-escala',
    question: { type: 'generada', id: 'examen-0.suma', generator: 'suma', params: {} },
  },
  {
    project: 'suma-escala',
    question: {
      type: 'generada',
      id: 'examen-0.combinacion',
      generator: 'combinacion',
      params: {},
    },
  },
  {
    project: 'suma-escala',
    question: { type: 'generada', id: 'examen-0.centroide', generator: 'centroide', params: {} },
  },
  {
    project: 'suma-escala',
    question: {
      id: 'examen-0.centroide-animales',
      type: 'codigo',
      prompt:
        '`E` guarda un embedding de juguete por fila (inventados y de 2 dimensiones; los reales tienen cientos): «gato», «perro», «lobo» y «tigre». Tiene cuatro filas y dos columnas. Guarda en `centroide`, como array de NumPy, el centroide de los cuatro animales: un vector de 2 componentes, la $x$ media y la $y$ media. `np.mean` calcula la media y admite el argumento `axis`.',
      hints: [
        'El centroide es una media, y NumPy la calcula con `np.mean`.',
        'Se quiere una media por columna: la de todas las $x$ y la de todas las $y$.',
        'El argumento `axis` elige a lo largo de qué eje se promedia: con `axis=1` sale una media por cada fila y con `axis=0`, una por cada columna.',
      ],
      explain:
        'La media de varios vectores se hace componente a componente, y cada columna de `E` guarda una componente de todos los animales. Piensa si necesitas una media por fila o una por columna, y cuántos números debe tener el resultado: eso decide el eje.',
      solution:
        'Se escribe `centroide = np.mean(E, axis=0)`. NumPy recorre las filas (eje 0) y da una media por columna: $\\left(\\dfrac{3+4+4+3}{4},\\ \\dfrac{4+3-2-3}{4}\\right)=(3{,}5;\\ 0{,}5)$. Con `axis=1` saldrían cuatro números, uno por animal, que no son el centroide.',
      requirements: [
        '`centroide` existe y es un array de NumPy con 2 componentes, las dos números: ni un solo número ni un número por animal.',
        '`centroide` es el vector medio de las cuatro filas de `E`: su primera componente es la media de las $x$ y la segunda, la media de las $y$.',
        'Como sale con decimales, se acepta una diferencia de hasta una centésima.',
      ],
      starter: `import numpy as np

# Embeddings de juguete (inventados y de 2 dimensiones), uno por fila:
# gato, perro, lobo, tigre
E = np.array([[3, 4], [4, 3], [4, -2], [3, -3]])
# Calcula centroide, el vector medio de las cuatro filas
centroide = None
`,
      checks: `_arr = isinstance(centroide, np.ndarray)
_ok = _arr and centroide.shape == (2,)
_num = _ok and np.issubdtype(centroide.dtype, np.number)
_suelto = isinstance(centroide, (int, float, np.number)) or (_arr and centroide.ndim == 0)
_filas = _arr and centroide.shape == (4,)
_filasnum = _filas and np.issubdtype(centroide.dtype, np.number)
_porfilas = _filasnum and np.allclose(centroide, [3.5, 3.5, 1, 0], rtol=0, atol=0.01)
_coma = _filasnum and np.allclose(centroide, [3, 5, 0, 5], rtol=0, atol=0.01)
_mediatodo = _suelto and np.issubdtype(np.asarray(centroide).dtype, np.number) and np.isclose(centroide, 2, rtol=0, atol=0.01)
check(_ok or _suelto or _filas, "\`centroide\` tiene que ser un array de NumPy con 2 componentes: la x media y la y media.")
check(not _porfilas, "\`centroide\` tiene 4 números: has promediado por filas, una media por animal. Prueba con \`axis=0\` para promediar por columnas.")
check(not _coma, "\`centroide\` tiene 4 números: 3, 5, 0 y 5. ¿Has escrito 3,5 con coma? En Python el decimal va con punto: \`3.5\`.")
check(not (_filas and not _porfilas and not _coma), "\`centroide\` tiene 4 elementos, uno por animal; el centroide tiene 2 componentes, la x media y la y media.")
check(not _mediatodo, "\`centroide\` es un solo número, 2: el que sale con \`np.mean(E)\` sin \`axis\`, que mezcla todos los valores. Indica \`axis=0\` para obtener una media por columna.")
check(not (_suelto and not _mediatodo), "\`centroide\` es un solo número; el centroide tiene 2 componentes, la x media y la y media.")
check((not _ok) or _num, "Las componentes tienen que ser números, sin comillas.")
check((not _num) or not np.allclose(centroide, [14, 2], rtol=0, atol=0.01), "\`centroide\` vale (14, 2): has sumado las filas sin dividir entre el número de animales.")
check((not _num) or np.allclose(centroide, [3.5, 0.5], rtol=0, atol=0.01), "\`centroide\` tiene que valer (3,5; 0,5): la media de las x y la media de las y de los cuatro animales.")
`,
      reference: `import numpy as np

# Embeddings de juguete (inventados y de 2 dimensiones), uno por fila:
# gato, perro, lobo, tigre
E = np.array([[3, 4], [4, 3], [4, -2], [3, -3]])
centroide = np.mean(E, axis=0)
`,
    },
  },

  // ---------- norma-distancia ----------
  {
    project: 'norma-distancia',
    question: { type: 'generada', id: 'examen-0.norma', generator: 'norma', params: { dim: 2 } },
  },
  {
    project: 'norma-distancia',
    question: {
      type: 'generada',
      id: 'examen-0.norma-3d',
      generator: 'norma',
      params: { dim: 3 },
    },
  },
  {
    project: 'norma-distancia',
    question: {
      type: 'generada',
      id: 'examen-0.distancia',
      generator: 'distancia',
      params: {},
    },
  },
  {
    project: 'norma-distancia',
    question: { type: 'generada', id: 'examen-0.unitario', generator: 'unitario', params: {} },
  },
];
