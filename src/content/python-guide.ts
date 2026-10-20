// Guía de Python para quien no programa: fichas cortas con ejemplos y un glosario de las funciones que
// usan los juegos. Cada pregunta de código enseña las que aparecen en su código (`pythonGuide`).
// Los ejemplos no resuelven ninguna pregunta: usan nombres y números propios.

/** Una ficha: un concepto de Python con un ejemplo. */
export interface GuideCard {
  id: string;
  title: string;
  /** Markdown (con bloques de código). */
  body: string;
  /** `basico`: se enseña siempre, en «Lo básico». Si no, la ficha sale cuando el código la usa. */
  match: 'basico' | RegExp;
}

/** Una función, un método o un atributo, con una frase. */
export interface GlossaryEntry {
  /** Cómo se escribe, con argumentos de ejemplo: `np.linalg.norm(v)`. */
  name: string;
  /** Markdown en línea. */
  text: string;
  pattern: RegExp;
}

const lines = (...ls: string[]): string => ls.join('\n');

export const GUIDE_CARDS: readonly GuideCard[] = [
  {
    id: 'leer',
    title: 'Cómo se lee un programa',
    match: 'basico',
    body: lines(
      'Python ejecuta las líneas **de arriba abajo**, una detrás de otra. Lo que va detrás de `#` es un **comentario**: Python lo ignora; está para explicar.',
      '',
      '```python',
      '# Esto es un comentario',
      'precio = 12          # guarda 12 con el nombre precio',
      'total = precio * 3   # usa precio, que ya vale 12: total vale 36',
      '```',
      '',
      'Las mayúsculas cuentan: `E` y `e` son nombres distintos. Un nombre solo existe a partir de la línea que lo crea: si se usa antes, Python se para con un error que dice en qué línea.',
    ),
  },
  {
    id: 'variables',
    title: 'Variables: guardar con =',
    match: 'basico',
    body: lines(
      '`nombre = valor` guarda el valor con ese nombre. No es una igualdad de matemáticas sino una orden: «guarda esto aquí». Si se vuelve a asignar el mismo nombre, el valor anterior se pierde.',
      '',
      'En el código inicial verás líneas como `resultado = None`. `None` significa «nada todavía»: es el hueco que tienes que rellenar. Cambia `None` por el cálculo que pide el enunciado.',
      '',
      '```python',
      'edad = None        # antes: hueco vacío',
      'edad = 2025 - 1990 # después: edad guarda 35',
      '```',
      '',
      'Las comprobaciones buscan cada variable **por su nombre exacto**: si el enunciado pide `media`, una variable `Media` o `promedio` no cuenta.',
    ),
  },
  {
    id: 'numeros',
    title: 'Números y operaciones',
    match: 'basico',
    body: lines(
      '- `a + b`, `a - b`: suma y resta.',
      '- `a * b`: multiplicación; `a / b`: división (da decimales).',
      '- `a ** 2`: potencia, `a` al cuadrado.',
      '- Como en matemáticas, `*` y `/` van antes que `+` y `-`. Los paréntesis cambian el orden: `(2 + 3) * 4` da 20, y `2 + 3 * 4` da 14.',
      '',
      'Los decimales se escriben **con punto**: `0.5`. Con coma, `0,5` no es un número sino dos (en Python la coma separa elementos), y el resultado sale mal sin avisar.',
      '',
      'Un número muy pequeño puede salir escrito así: `1e-16`, que es $1 \\cdot 10^{-16}$, prácticamente $0$.',
    ),
  },
  {
    id: 'print',
    title: 'Ver lo que vale algo: print',
    match: 'basico',
    body: lines(
      '`print(x)` escribe el valor de `x` en la **Salida**, debajo del editor. Se pueden escribir varias cosas a la vez, separadas por comas:',
      '',
      '```python',
      'print(total)',
      'print("el total es", total)',
      '```',
      '',
      'El botón **Ejecutar** ejecuta tu código y enseña la salida, pero no lo entrega: no cuenta como intento. Úsalo tantas veces como quieras para mirar cada paso antes de **Entregar**. Sin ningún `print`, Ejecutar no escribe nada.',
    ),
  },
  {
    id: 'errores',
    title: 'Cuando Python se para: errores',
    match: 'basico',
    body: lines(
      'Si algo va mal, Python se para y en **Error** verás una frase en castellano, la línea donde ha pasado y el tipo de error. Los más habituales:',
      '',
      '- `NameError`: un nombre que no existe. Mira que esté bien escrito (las mayúsculas cuentan) y que se cree **antes** de usarlo.',
      '- `SyntaxError`: algo mal escrito, como un paréntesis o un corchete sin cerrar, una coma o unos dos puntos que faltan.',
      '- `IndentationError`: la sangría de un bloque no cuadra.',
      '- `IndexError`: una posición que no existe (se cuenta desde 0).',
      '- `TypeError`: una operación con un dato que no toca, como sumar un texto y un número.',
      '- `ValueError` que habla de «shapes» o «broadcast»: dos arrays de formas que no encajan.',
      '',
      'Python se para en el primer error. Arréglalo y vuelve a pulsar Ejecutar: si había otro más abajo, saldrá entonces.',
    ),
  },
  {
    id: 'importar',
    title: 'import: traer módulos',
    match: /^\s*(import|from)\s/m,
    body: lines(
      'Lo que no viene de serie en Python vive en **módulos** que se importan. Casi todos los programas de aquí empiezan así:',
      '',
      '```python',
      'import numpy as np',
      '```',
      '',
      'Eso carga NumPy, el módulo de cálculo con vectores y matrices, y lo llama `np` para abreviar. A partir de ahí, `np.algo` es la herramienta `algo` de NumPy. El punto se lee «de»: `np.linalg.norm` es la función `norm` del apartado `linalg` de NumPy.',
      '',
      '`from módulo import a, b` trae solo esos nombres, que se usan sin prefijo: `a`, `b`.',
    ),
  },
  {
    id: 'listas',
    title: 'Listas: [1, 2, 3]',
    match: /\[/,
    body: lines(
      'Una lista guarda varios valores en orden, entre corchetes y separados por comas: `[3, 2]`, `["gato", "perro"]`. Una lista de listas sirve para escribir una tabla fila a fila: `[[1, 2], [3, 4]]`.',
      '',
      '- `len(lista)` dice cuántos elementos tiene.',
      '- `lista.append(x)` añade `x` al final; `lista = []` empieza una lista vacía.',
      '- Las listas no saben de matemáticas: `[1, 2] + [3, 4]` las **une** en `[1, 2, 3, 4]`. Para sumar componente a componente hacen falta arrays de NumPy.',
    ),
  },
  {
    id: 'arrays',
    title: 'Arrays de NumPy: vectores y matrices',
    match: /\bnp\./,
    body: lines(
      '`np.array` convierte una lista en un **array**, la forma en que NumPy guarda vectores y matrices:',
      '',
      '```python',
      'p = np.array([6, 8])        # un vector de 2 componentes',
      'M = np.array([[1, 2],',
      '              [3, 4],',
      '              [5, 6]])      # una matriz de 3 filas y 2 columnas, escrita fila a fila',
      '```',
      '',
      'Con arrays, `+`, `-`, `*` y `/` actúan **componente a componente**: `p * 2` multiplica cada componente por 2, y `p + q` suma las componentes que ocupan la misma posición (los dos tienen que tener la misma forma).',
      '',
      '`M.shape` dice la forma: `(2,)` es un vector de 2 componentes; `(3, 2)`, una matriz de 3 filas y 2 columnas.',
      '',
      'Al escribir un array con `print`, NumPy lo enseña sin comas: `[6 8]`.',
    ),
  },
  {
    id: 'indices',
    title: 'Elegir elementos: índices y cortes',
    match: /[\w)\]]\[/,
    body: lines(
      'Los corchetes detrás de un nombre eligen elementos. **Se empieza a contar en 0**:',
      '',
      '```python',
      'x = np.array([7, 8, 9])',
      'x[0]      # 7, el primero',
      'x[2]      # 9, el tercero',
      'x[-1]     # 9: los negativos cuentan desde el final',
      'x[0:2]    # [7 8]: del 0 al 2, sin incluir el 2',
      'x[1:]     # [8 9]: del 1 hasta el final',
      '```',
      '',
      'En una matriz se da primero la fila y después la columna:',
      '',
      '```python',
      'M[0]       # la fila 0 entera',
      'M[1, 0]    # fila 1, columna 0',
      'M[:, 0]    # la columna 0 entera: «:» quiere decir «todas las filas»',
      '```',
    ),
  },
  {
    id: 'ejes',
    title: 'Ejes: axis=',
    match: /\baxis\s*=/,
    body: lines(
      'Muchas funciones de NumPy (`np.sum`, `np.mean`, `np.max`, `np.linalg.norm`…) trabajan sobre toda la matriz o a lo largo de un eje:',
      '',
      '- sin `axis`, mezclan todos los números y dan un solo resultado;',
      '- con `axis=0` recorren las filas, de arriba abajo, y dan **un resultado por columna**;',
      '- con `axis=1` recorren las columnas, de izquierda a derecha, y dan **un resultado por fila**.',
      '',
      '```python',
      'M = np.array([[1, 2],',
      '              [3, 4]])',
      'np.sum(M)           # 10',
      'np.sum(M, axis=0)   # [4 6]: una suma por columna',
      'np.sum(M, axis=1)   # [3 7]: una suma por fila',
      '```',
      '',
      'Para no liarse, piensa cuántos números tiene que tener el resultado. Con `keepdims=True` el resultado conserva el eje: sale como una columna (o una fila) y se puede operar con la matriz casilla a casilla.',
    ),
  },
  {
    id: 'producto',
    title: 'Producto de matrices: @',
    match: /@|\bnp\.dot\b|\.T\b/,
    body: lines(
      '`@` es el producto de matrices del álgebra lineal:',
      '',
      '- `M @ x`: matriz por vector. Da un vector; cada componente es una fila de `M` por `x` (se multiplican por parejas y se suman).',
      '- `M @ N`: matriz por matriz. **El orden importa**: `M @ N` y `N @ M` suelen dar resultados distintos.',
      '- `p @ q`, entre dos vectores, da un número: su producto escalar, lo mismo que `np.dot(p, q)`.',
      '',
      'No lo confundas con `*`: `M * N` multiplica **casilla a casilla**, que no es el producto de matrices.',
      '',
      '`M.T` es la traspuesta de `M`: las filas pasan a ser columnas.',
    ),
  },
  {
    id: 'funciones',
    title: 'Tus propias funciones: def y return',
    match: /^\s*def\s/m,
    body: lines(
      '`def` define una **función**: un trozo de código con nombre que recibe datos y **devuelve** un resultado.',
      '',
      '```python',
      'def doble(n):        # se llama doble y recibe un dato, n',
      '    r = 2 * n        # el cuerpo va sangrado, con 4 espacios',
      '    return r         # return devuelve el resultado y sale',
      '',
      'd = doble(5)         # se llama: dentro, n vale 5; d guarda 10',
      '```',
      '',
      '- Definir la función no la ejecuta: solo se ejecuta cuando se **llama**, como en `doble(5)`.',
      '- Lo que no se devuelve con `return` se pierde al salir. Una función sin `return` devuelve `None`.',
      '- Los nombres de dentro (`n`, `r`) solo existen dentro. Trabaja con lo que la función recibe, no con las variables de fuera.',
      '- Si el enunciado te pide una función, las comprobaciones pueden llamarla con **otros datos**, no solo con los del enunciado: lo dice «Qué se comprueba al entregar».',
    ),
  },
  {
    id: 'bloques',
    title: 'Bloques: los dos puntos y la sangría',
    match: /^\s*(def|for|if|elif|else|while)\b.*:\s*(#.*)?$/m,
    body: lines(
      'Una línea que termina en dos puntos (`def …:`, `for …:`, `if …:`) abre un **bloque**: las líneas de dentro van **sangradas**, con 4 espacios más al principio (la tecla Tab los pone). El bloque termina en la primera línea que vuelve a la sangría de antes.',
      '',
      '```python',
      'for k in [1, 2, 3]:',
      '    print(k)          # dentro del bucle: se repite 3 veces',
      'print("fin")          # fuera: una sola vez, al final',
      '```',
      '',
      'Si la sangría no cuadra, Python se para con un `IndentationError`.',
    ),
  },
  {
    id: 'bucles',
    title: 'Repetir: for',
    match: /\bfor\b[^\n]*\bin\b/,
    body: lines(
      '`for elemento in colección:` repite el bloque una vez por cada elemento:',
      '',
      '```python',
      'cuenta = 0',
      'for k in [4, 5, 6]:',
      '    cuenta = cuenta + k   # se repite con k = 4, 5 y 6',
      '```',
      '',
      '- `range(n)` da los números 0, 1, …, n-1: `for i in range(3):` repite con `i` = 0, 1 y 2.',
      '- `enumerate(lista)` da a la vez la posición y el elemento: `for i, x in enumerate(lista):`.',
      '- `zip(a, b)` recorre dos listas a la par: `for x, y in zip(a, b):`.',
      '- Una **lista por comprensión** construye una lista en una línea: `[k * 2 for k in datos]` es la lista de los dobles, y `[k for k in datos if k > 0]`, la de los positivos.',
    ),
  },
  {
    id: 'condiciones',
    title: 'Decidir: comparaciones e if',
    match:
      /^\s*if\s|==|!=|<=|>=|\s[<>]\s|\bTrue\b|\bFalse\b|\bnp\.where\b|\bnp\.(isclose|allclose|array_equal)\b|\bnot in\b/m,
    body: lines(
      'Una comparación da `True` (verdadero) o `False` (falso):',
      '',
      '- `a == b` pregunta «¿son iguales?». Lleva dos signos: uno solo, `=`, es guardar.',
      '- `a != b` (distintos), `a < b`, `a <= b`, `a > b`, `a >= b`.',
      '- `x in lista` pregunta si `x` está en la lista; `x not in lista`, si no está.',
      '- Se combinan con `and`, `or` y `not`.',
      '',
      '`if` ejecuta su bloque solo si la condición es verdadera; `else`, si no lo es:',
      '',
      '```python',
      'if nota >= 5:',
      '    estado = "aprobado"',
      'else:',
      '    estado = "suspenso"',
      '```',
      '',
      'Con decimales no compares con `==`: por los redondeos casi nunca son exactamente iguales. Usa `np.isclose(a, b)`, que admite una diferencia minúscula. Y con arrays, una comparación da un array de `True` y `False`, uno por componente; un `if` necesita un solo valor.',
    ),
  },
  {
    id: 'ordenar',
    title: 'Ordenar y buscar el mayor',
    match: /\bnp\.(argsort|argmax|argmin|max|min)\b|\bsorted\(|\.max\(|\.min\(/,
    body: lines(
      '- `np.max(x)` da el valor más grande; `np.argmax(x)`, su **posición** (no el valor). `np.argmin(x)` da la posición del más pequeño.',
      '- `np.argsort(x)` da las posiciones que ordenan `x` **de menor a mayor**. Para ordenar de mayor a menor, se ordenan los opuestos: `np.argsort(-x)`.',
      '- Con una lista de posiciones, `[:k]` se queda con las `k` primeras.',
      '',
      '```python',
      'notas = np.array([6.5, 9.0, 4.0])',
      'np.max(notas)         # 9.0',
      'np.argmax(notas)      # 1: la mayor está en la posición 1',
      'np.argsort(notas)     # [2 0 1]: posiciones de la menor a la mayor',
      '```',
    ),
  },
  {
    id: 'textos',
    title: 'Textos y palabras',
    match:
      /["'][A-Za-zÁÉÍÓÚáéíóúÑñ¿?¡! ]{3,}["']|\.index\(|\bpalabras\b|\bdocumentos\b|\bconsultas\b/,
    body: lines(
      'Un texto (en Python, una **cadena**) va entre comillas, simples o dobles: `"Roma"` o `\'Roma\'`. Sin comillas, Python cree que `Roma` es el nombre de una variable y se para con un `NameError`.',
      '',
      '- Las mayúsculas y los acentos cuentan: `"roma"` no es `"Roma"`.',
      '- `lista.index("Roma")` da la posición de ese texto en la lista; `lista[i]`, el texto de la posición `i`.',
      '- `"Ro" in "Roma"` pregunta si un texto aparece dentro de otro.',
      '- Un número entre comillas, `"3"`, es un texto y no un número.',
    ),
  },
  {
    id: 'embeddings',
    title: 'El módulo embeddings del juego',
    match: /\bembeddings\b/,
    body: lines(
      '`embeddings` es un módulo propio del juego con embeddings reales ya calculados (en el navegador no hay modelo que los calcule). Cada embedding tiene 384 componentes y norma $1$, y ocupa una fila de su matriz:',
      '',
      '- `palabras` y `P`: 32 palabras y su matriz; la fila `j` de `P` es el embedding de `palabras[j]`.',
      '- `documentos` y `D`: 16 frases de la base de conocimiento de un hotel y su matriz.',
      '- `consultas` y `Q`: 10 preguntas de huéspedes y su matriz.',
      '- `vector(texto)`: el embedding de cualquiera de esos textos.',
      '',
      'Cada ejecución carga el módulo de nuevo: si cambias una de sus matrices, la siguiente vuelve a empezar con la original.',
    ),
  },
  {
    id: 'dibujar',
    title: 'Dibujar: matplotlib',
    match: /\bplt\./,
    body: lines(
      '`import matplotlib.pyplot as plt` trae las herramientas de dibujo con el nombre `plt`. Lo que dibujas sale en **Figuras**, junto al editor, al pulsar Ejecutar; no hace falta `plt.show()`. Cada llamada añade algo a la misma figura.',
      '',
      '- `plt.quiver(x0, y0, a, b, angles="xy", scale_units="xy", scale=1)`: una flecha que sale de $(x_0, y_0)$ y avanza $a$ en horizontal y $b$ en vertical. Las tres opciones del final la dibujan a escala.',
      '- `plt.scatter(xs, ys)`: un punto por cada pareja de coordenadas; `plt.plot(xs, ys)`: una línea que los une.',
      '- `plt.bar(nombres, alturas)`: barras; `plt.hist(valores)`: histograma.',
      '- `plt.xlim(a, b)` y `plt.ylim(a, b)`: el tramo visible de cada eje; `plt.grid(True)`: la cuadrícula.',
      '- `plt.xlabel("…")`, `plt.ylabel("…")`: los rótulos de los ejes; `label="…"` en una llamada y después `plt.legend()`: la leyenda.',
    ),
  },
  {
    id: 'azar',
    title: 'Números al azar: np.random',
    match: /\bnp\.random\b|\brng\./,
    body: lines(
      '`rng = np.random.default_rng(0)` crea un generador de números al azar. El número del paréntesis es la **semilla**: con la misma semilla salen siempre los mismos números, así que el resultado se puede repetir y comprobar.',
      '',
      '```python',
      'rng = np.random.default_rng(7)',
      'x = rng.normal(size=4)        # un vector de 4 números al azar',
      'M = rng.normal(size=(2, 3))   # una matriz de 2 filas y 3 columnas',
      '```',
      '',
      'Cada llamada a `rng.normal` saca números nuevos.',
    ),
  },
  {
    id: 'patrones',
    title: 'Buscar dentro de textos: re',
    match: /^\s*import re\b|\bre\.\w+\(/m,
    body: lines(
      '`import re` trae las **expresiones regulares**: patrones para buscar trozos de texto.',
      '',
      '- `re.findall(patron, texto)` da la lista de todos los trozos de `texto` que encajan con `patron`.',
      '- En un patrón, `[A-Z]+` es «una o más mayúsculas» y `\\d+`, «una o más cifras». El resto de caracteres se buscan tal cual.',
      '- El patrón se escribe con una `r` delante, `r"…"`, para que Python no toque las barras.',
      '',
      '```python',
      're.findall(r"\\d+", "mesa 4, silla 12")   # ["4", "12"]',
      '```',
    ),
  },
];

const fn = (name: string, call: string, text: string): GlossaryEntry => ({
  name: call,
  text,
  pattern: new RegExp(`(?<![\\w.])${name.replace(/\./g, '\\.')}\\b`),
});
const builtin = (name: string, call: string, text: string): GlossaryEntry => ({
  name: call,
  text,
  pattern: new RegExp(`(?<![\\w.])${name}\\(`),
});
// Detrás de un nombre o de un cierre, pero no de `np` (`np.max` es una función, no `x.max()`).
const method = (name: string, call: string, text: string): GlossaryEntry => ({
  name: call,
  text,
  pattern: new RegExp(`(?<=[\\w)\\]])(?<!\\bnp)\\.${name}\\b`),
});

export const GLOSSARY: readonly GlossaryEntry[] = [
  fn(
    'np.array',
    'np.array(lista)',
    'Convierte una lista en un array de NumPy: una lista de números da un vector, y una lista de listas, una matriz escrita fila a fila.',
  ),
  fn(
    'np.linalg.norm',
    'np.linalg.norm(v)',
    'La norma de `v`, su longitud: la raíz cuadrada de la suma de los cuadrados de sus componentes. Con `axis`, una norma por fila o por columna.',
  ),
  fn(
    'np.dot',
    'np.dot(p, q)',
    'El producto escalar: multiplica las componentes que ocupan la misma posición y suma los resultados. Da lo mismo que `p @ q`.',
  ),
  fn('np.sqrt', 'np.sqrt(x)', 'La raíz cuadrada; con un array, la de cada componente.'),
  fn('np.abs', 'np.abs(x)', 'El valor absoluto: el número sin su signo.'),
  fn(
    'np.sum',
    'np.sum(x)',
    'La suma de todos los números; con `axis`, una suma por fila o por columna.',
  ),
  fn('np.mean', 'np.mean(x)', 'La media; con `axis`, una media por fila o por columna.'),
  fn('np.std', 'np.std(x)', 'La desviación típica: cuánto se apartan los números de su media.'),
  fn('np.max', 'np.max(x)', 'El valor más grande; con `axis`, uno por fila o por columna.'),
  fn('np.argmax', 'np.argmax(x)', 'La posición del valor más grande, no el valor.'),
  fn('np.argmin', 'np.argmin(x)', 'La posición del valor más pequeño.'),
  fn(
    'np.argsort',
    'np.argsort(x)',
    'Las posiciones que ordenan `x` de menor a mayor. De mayor a menor: `np.argsort(-x)`.',
  ),
  fn(
    'np.isclose',
    'np.isclose(a, b)',
    '`True` si `a` y `b` son casi iguales: la forma de comparar decimales, que arrastran pequeños errores de redondeo.',
  ),
  fn(
    'np.allclose',
    'np.allclose(A, B)',
    '`True` si todas las componentes de `A` y `B` son casi iguales.',
  ),
  fn(
    'np.array_equal',
    'np.array_equal(A, B)',
    '`True` si `A` y `B` tienen la misma forma y exactamente los mismos números.',
  ),
  fn(
    'np.arccos',
    'np.arccos(c)',
    'El ángulo, en radianes, cuyo coseno es `c`. Solo existe si `c` está entre $-1$ y $1$: fuera de ahí da `nan` («no es un número»).',
  ),
  fn('np.degrees', 'np.degrees(r)', 'Pasa un ángulo de radianes a grados.'),
  fn(
    'np.clip',
    'np.clip(x, a, b)',
    'Recorta `x` para que quede entre `a` y `b`: lo que pasa de `b` se queda en `b`, y lo que no llega a `a`, en `a`.',
  ),
  fn(
    'np.eye',
    'np.eye(n)',
    'La matriz identidad de `n` filas y `n` columnas: unos en la diagonal y ceros en el resto.',
  ),
  fn(
    'np.zeros',
    'np.zeros(n)',
    'Un array de `n` ceros; con la forma entre paréntesis, `np.zeros((f, c))`, una matriz de ceros.',
  ),
  fn(
    'np.outer',
    'np.outer(p, q)',
    'La matriz con todos los productos de una componente de `p` por una de `q`: en la fila `i` y la columna `j` está `p[i] * q[j]`.',
  ),
  fn(
    'np.column_stack',
    'np.column_stack([a, b])',
    'Una matriz con los vectores `a` y `b` puestos como columnas, uno al lado del otro.',
  ),
  fn(
    'np.where',
    'np.where(cond, a, b)',
    'Elige componente a componente: donde `cond` es `True` toma `a`, y donde es `False`, `b`.',
  ),
  fn(
    'np.delete',
    'np.delete(M, k, axis=…)',
    'Una copia de `M` sin la fila o la columna `k`, según el eje. `M` no cambia.',
  ),
  fn(
    'np.triu_indices',
    'np.triu_indices(n, k=1)',
    'Las posiciones de las casillas por encima de la diagonal de una matriz de `n` × `n`, en dos arrays (filas y columnas): sirve para recorrer cada pareja una sola vez.',
  ),
  fn(
    'np.linspace',
    'np.linspace(a, b, n)',
    '`n` números repartidos por igual entre `a` y `b`, los dos incluidos.',
  ),
  fn(
    'np.random.default_rng',
    'np.random.default_rng(semilla)',
    'Un generador de números al azar que, con la misma semilla, saca siempre los mismos.',
  ),
  method(
    'normal',
    'rng.normal(size=…)',
    'Números al azar con la forma de `size`: un número, un vector o una matriz.',
  ),
  fn(
    'np.linalg.det',
    'np.linalg.det(M)',
    'El determinante de una matriz cuadrada. Sale con decimales: uno que debería ser $0$ puede salir minúsculo, así que se compara con `np.isclose`.',
  ),
  fn(
    'np.linalg.inv',
    'np.linalg.inv(M)',
    'La inversa de `M`. Si `M` no tiene inversa, aquí no siempre da error: puede devolver una matriz de `nan` («no es un número»).',
  ),
  fn(
    'np.linalg.solve',
    'np.linalg.solve(M, b)',
    'La solución $\\vec{x}$ del sistema $M\\vec{x}=\\vec{b}$.',
  ),
  fn(
    'np.linalg.matrix_rank',
    'np.linalg.matrix_rank(M)',
    'El rango de `M`: cuántas de sus columnas son independientes.',
  ),
  method(
    'shape',
    'M.shape',
    'La forma: `(n,)` es un vector de `n` componentes; `(f, c)`, una matriz de `f` filas y `c` columnas.',
  ),
  method('size', 'x.size', 'Cuántos números tiene el array en total.'),
  method('T', 'M.T', 'La traspuesta: las filas pasan a ser columnas.'),
  method('max', 'x.max()', 'El valor más grande del array; `x.min()`, el más pequeño.'),
  method('append', 'lista.append(x)', 'Añade `x` al final de la lista.'),
  method('index', 'lista.index(x)', 'La posición de `x` en la lista, la primera vez que aparece.'),
  method('count', 'lista.count(x)', 'Cuántas veces aparece `x` en la lista.'),
  fn(
    're.findall',
    're.findall(patron, texto)',
    'La lista de los trozos de `texto` que encajan con el patrón.',
  ),
  builtin('len', 'len(x)', 'Cuántos elementos tiene una lista (o cuántas filas tiene una matriz).'),
  builtin('range', 'range(n)', 'Los números 0, 1, …, n-1, para repetir algo `n` veces con `for`.'),
  builtin(
    'enumerate',
    'enumerate(lista)',
    'Recorre una lista dando a la vez la posición y el elemento.',
  ),
  builtin('zip', 'zip(a, b)', 'Recorre dos listas a la par, emparejando sus elementos.'),
  builtin(
    'sum',
    'sum(lista)',
    'La suma de los elementos. Con una lista de `True` y `False`, cuenta los `True`.',
  ),
  builtin('all', 'all(lista)', '`True` si todos los elementos son verdaderos.'),
  builtin(
    'int',
    'int(x)',
    'Convierte en número entero; también pasa un número de NumPy a uno normal de Python.',
  ),
  builtin('abs', 'abs(x)', 'El valor absoluto de un número.'),
  builtin('round', 'round(x, n)', 'Redondea `x` a `n` decimales.'),
  builtin('print', 'print(x)', 'Escribe `x` en la Salida al pulsar Ejecutar.'),
];

/**
 * El código sin comentarios: un `#` dentro de una cadena no es un comentario. Así las palabras de los
 * comentarios del código inicial («# Calcula…») no cuentan como Python.
 */
export const withoutComments = (code: string): string =>
  code
    .split('\n')
    .map((line) => {
      let quote: string | null = null;
      for (let i = 0; i < line.length; i++) {
        const c = line[i]!;
        if (quote !== null) {
          if (c === '\\') i++;
          else if (c === quote) quote = null;
        } else if (c === '"' || c === "'") quote = c;
        else if (c === '#') return line.slice(0, i);
      }
      return line;
    })
    .join('\n');

export interface QuestionGuide {
  /** Fichas que el código usa, en el orden de la guía. */
  cards: GuideCard[];
  /** Las de «Lo básico», siempre. */
  basics: GuideCard[];
  /** El resto de fichas. */
  rest: GuideCard[];
  /** Las entradas del glosario que el código usa. */
  glossary: GlossaryEntry[];
}

/** Reparte la guía para un trozo de código (en práctica, el inicial y la referencia; en examen, solo el inicial). */
export const pythonGuide = (code: string): QuestionGuide => {
  const src = withoutComments(code);
  const basics = GUIDE_CARDS.filter((c) => c.match === 'basico');
  const cards = GUIDE_CARDS.filter((c) => c.match !== 'basico' && c.match.test(src));
  const rest = GUIDE_CARDS.filter((c) => c.match !== 'basico' && !cards.includes(c));
  const glossary = GLOSSARY.filter((g) => g.pattern.test(src));
  return { cards, basics, rest, glossary };
};
