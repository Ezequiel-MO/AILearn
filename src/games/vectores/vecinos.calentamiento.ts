import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Vecinos: lo nuevo de su ejercicio «Programar». */
export const vecinosWarmup: WarmupStep[] = [
  {
    id: 'vecinos.cal.1',
    title: '`lista.index(x)` y `len(x)`: dónde está y cuántos hay',
    explain:
      'Una lista guarda sus elementos en orden y cada uno tiene una **posición**, que se cuenta desde 0. Con una posición se saca el elemento (`lista[i]`) y con el elemento se saca la posición:\n\n- `lista.index(x)` devuelve la posición de `x`, la primera vez que aparece. Si `x` no está, Python se para con un `ValueError`. Las mayúsculas y los acentos cuentan.\n- `len(x)` devuelve **cuántos** elementos tiene una lista, o cuántas filas tiene una matriz.\n\nEl tropiezo típico: con 4 elementos, `len` vale 4, pero la última posición es la 3.',
    example: `import numpy as np

ciudades = ["Sevilla", "Oporto", "Bilbao", "Lyon"]
print("hay", len(ciudades), "ciudades")
print("posición de Bilbao:", ciudades.index("Bilbao"))
print("la de la posición 1:", ciudades[1])

M = np.array([[1, 2], [3, 4], [5, 6]])
print("filas de M:", len(M))
`,
    experiments: [
      'Cambia `"Bilbao"` por `"bilbao"`, con minúscula: Python se para con un `ValueError`, porque para él es otro texto.',
      'Imprime `ciudades[len(ciudades)]`: da un `IndexError`, porque la última posición es una menos que `len`. Prueba con `ciudades[len(ciudades) - 1]`.',
      'Añade un `"Lyon"` más al final de la lista y pide `ciudades.index("Lyon")`: devuelve la primera vez que aparece.',
    ],
    task: {
      prompt:
        'Guarda en `pos_go` la posición de `"Go"` en la lista `lenguajes` y en `cuantos` cuántos lenguajes hay.',
      starter: `import numpy as np

lenguajes = ["Python", "Rust", "Go", "Java", "C"]
# Guarda en pos_go la posición de "Go" y en cuantos cuántos lenguajes hay
pos_go = None
cuantos = None
`,
      checks: `_ent = lambda v: isinstance(v, (int, np.integer)) and not isinstance(v, bool)
check(_ent(pos_go), "\`pos_go\` tiene que ser un número entero: la posición de «Go» en la lista.")
check((not _ent(pos_go)) or pos_go != 3, "\`pos_go\` vale 3: has contado desde 1. Las posiciones empiezan en 0, así que «Go», que es el tercero, está en la posición 2.")
check((not _ent(pos_go)) or pos_go == 3 or pos_go == 2, "\`pos_go\` tiene que ser la posición de «Go» en \`lenguajes\`, contando desde 0.")
check(_ent(cuantos), "\`cuantos\` tiene que ser un número entero: cuántos lenguajes hay en la lista.")
check((not _ent(cuantos)) or cuantos != 4, "\`cuantos\` vale 4: es la posición del último, no cuántos hay. \`len\` cuenta los elementos.")
check((not _ent(cuantos)) or cuantos == 4 or cuantos == 5, "\`cuantos\` tiene que ser el número de elementos de \`lenguajes\`.")
`,
      reference: `import numpy as np

lenguajes = ["Python", "Rust", "Go", "Java", "C"]
pos_go = lenguajes.index("Go")
cuantos = len(lenguajes)
`,
    },
  },
  {
    id: 'vecinos.cal.2',
    title: 'El módulo `embeddings`: una fila por palabra',
    explain:
      '`from embeddings import P, palabras` trae del juego embeddings **reales** ya calculados: no hay modelo en el navegador, así que solo valen estos textos. Los embeddings reales tienen cientos de componentes; estos, 384, y todos miden 1.\n\n- `palabras` es una lista de 32 palabras y `P`, una matriz de 32 filas y 384 columnas.\n- La fila `j` de `P` es el embedding de `palabras[j]`. Para llegar a ella desde la palabra: `P[palabras.index("gato")]`.\n- Como todas las filas miden 1, el producto escalar de dos filas **es** su coseno.\n\nLas palabras se escriben tal cual están: `"París"` con acento y mayúscula.',
    example: `import numpy as np
from embeddings import P, palabras

print("palabras:", len(palabras))
print("forma de P:", P.shape)
i = palabras.index("coche")
print("coche es la fila", i)
print("su norma:", round(float(np.linalg.norm(P[i])), 3))
j = palabras.index("camión")
print("coseno coche-camión:", round(float(P[i] @ P[j]), 2))
`,
    experiments: [
      'Cambia `"camión"` por `"manzana"`: ¿el coseno sube o baja?',
      'Escribe `print(P @ P[i])`: salen 32 números, el coseno de «coche» con cada palabra. ¿Cuál vale 1?',
      'Cambia `"coche"` por `"Coche"`: Python se para con un `ValueError`, porque esa palabra no está en la lista.',
    ],
    task: {
      prompt:
        'Guarda en `fila` el embedding de `"tren"` (su fila de `P`) y en `cos` su coseno con el de `"avión"`.',
      starter: `import numpy as np
from embeddings import P, palabras

# Guarda en fila el embedding de "tren" y en cos su coseno con el de "avión"
fila = None
cos = None
`,
      checks: `import embeddings as _e
_f = _e.P[_e.palabras.index("tren")]
_g = _e.P[_e.palabras.index("avión")]
_v = isinstance(fila, np.ndarray) and fila.shape == (384,) and np.issubdtype(fila.dtype, np.number)
check(_v, "\`fila\` tiene que ser un array de NumPy con los 384 números del embedding de «tren»: una fila de \`P\`.")
check((not _v) or not np.allclose(fila, _g, atol=1e-3), "\`fila\` es el embedding de «avión», no el de «tren». Busca la posición de «tren» en \`palabras\`.")
check((not _v) or np.allclose(fila, _f, atol=1e-3) or np.allclose(fila, _g, atol=1e-3), "\`fila\` tiene que ser la fila de \`P\` que corresponde a «tren»: la que ocupa en \`P\` la misma posición que «tren» en \`palabras\`.")
_n = isinstance(cos, (int, float, np.integer, np.floating)) and not isinstance(cos, bool)
check(_n, "\`cos\` tiene que ser un solo número: el coseno de «tren» con «avión».")
check((not _n) or abs(cos - 1) > 1e-3, "\`cos\` vale 1: es el coseno de «tren» consigo mismo. Hace falta la fila de «avión» como segundo vector.")
check((not _n) or abs(cos - float(_f @ _g)) < 1e-3, "\`cos\` tiene que ser el producto escalar de la fila de «tren» con la de «avión»; como miden 1, ya es el coseno.")
`,
      reference: `import numpy as np
from embeddings import P, palabras

fila = P[palabras.index("tren")]
cos = fila @ P[palabras.index("avión")]
`,
    },
  },
  {
    id: 'vecinos.cal.3',
    title: 'Cortes: `x[:k]`, `x[1:]` y `x[a:b]`',
    explain:
      'Un **corte** toma un trozo de una lista o de un array. Se escribe con dos puntos entre corchetes, y cuenta desde 0; el final no se incluye:\n\n- `x[:k]` son los `k` primeros elementos.\n- `x[1:]` son todos menos el primero.\n- `x[a:b]` va de la posición `a` hasta la `b - 1`: `x[1:4]` tiene 3 elementos.\n\nUn corte nunca da error por pasarse: `x[:10]` de una lista de 4 devuelve los 4. Y no cambia `x`: crea otra lista.',
    example: `import numpy as np

orden = np.array([5, 2, 0, 4, 1, 3])
print("los 3 primeros:", orden[:3])
print("sin el primero:", orden[1:])
print("de la posición 1 a la 3:", orden[1:4])
print("lista original:", orden)
`,
    experiments: [
      'Cambia `orden[:3]` por `orden[:1]`: ¿cuántos elementos quedan?',
      'Prueba `orden[:100]`: no hay error, devuelve el array entero.',
      'Prueba `orden[2:2]`: da un corte vacío, porque el final no se incluye.',
    ],
    task: {
      prompt:
        'Guarda en `tres` los 3 primeros elementos de `ranking` y en `siguientes` los 3 que van después del primero (de la posición 1 a la 3).',
      starter: `import numpy as np

ranking = np.array([6, 2, 5, 0, 3, 1, 4])
# Guarda en tres los 3 primeros de ranking y en siguientes los 3 que van después del primero
tres = None
siguientes = None
`,
      checks: `def _tri(a):
    if not isinstance(a, (np.ndarray, list, tuple)):
        return False
    b = np.asarray(a)
    return b.shape == (3,) and np.issubdtype(b.dtype, np.integer)

check(_tri(tres), "\`tres\` tiene que ser una lista o un array de NumPy con 3 números enteros: un corte de \`ranking\`.")
check((not _tri(tres)) or not np.array_equal(tres, [2, 5, 0]), "\`tres\` empieza por la posición 1: se ha saltado el primero. El corte de los primeros empieza en el principio.")
check((not _tri(tres)) or np.array_equal(tres, [6, 2, 5]) or np.array_equal(tres, [2, 5, 0]), "\`tres\` tiene que ser los 3 primeros elementos de \`ranking\`, en su orden.")
check(_tri(siguientes), "\`siguientes\` tiene que ser una lista o un array de NumPy con 3 números enteros: un corte de \`ranking\`.")
check((not _tri(siguientes)) or not np.array_equal(siguientes, [6, 2, 5]), "\`siguientes\` incluye el primero: tiene que empezar en la posición 1, que es la segunda.")
check(not np.array_equal(siguientes, [2, 5, 0, 3, 1, 4]), "\`siguientes\` tiene más de 3 elementos: falta poner dónde termina el corte.")
check((not _tri(siguientes)) or np.array_equal(siguientes, [2, 5, 0]) or np.array_equal(siguientes, [6, 2, 5]), "\`siguientes\` tiene que ser el corte de la posición 1 a la 3 de \`ranking\`; el final no se incluye.")
`,
      reference: `import numpy as np

ranking = np.array([6, 2, 5, 0, 3, 1, 4])
tres = ranking[:3]
siguientes = ranking[1:4]
`,
    },
  },
  {
    id: 'vecinos.cal.4',
    title: 'Listas por comprensión: de posiciones a textos',
    explain:
      'Una **lista por comprensión** construye una lista nueva en una línea, recorriendo otra: `[algo for x in lista]` hace `algo` con cada `x`.\n\nUn uso muy común es pasar de **posiciones** a **textos**: si `orden` guarda posiciones y `nombres` guarda los textos, `[nombres[j] for j in orden]` es la lista de los textos, en el orden de `orden`.\n\nSi te salen números en vez de textos, falta el `nombres[...]`: has copiado las posiciones.',
    example: `nombres = ["Ana", "Luis", "Marta", "Pablo", "Eva"]
edades = [31, 24, 45, 19, 52]
print("el doble de cada edad:", [e * 2 for e in edades])

posiciones = [2, 0, 4]
print("nombres de esas posiciones:", [nombres[j] for j in posiciones])
print("posición 3:", nombres[3])
`,
    experiments: [
      'Cambia `[nombres[j] for j in posiciones]` por `[j for j in posiciones]`: salen las posiciones, no los nombres.',
      'Cambia `posiciones` a `[4, 4, 1]`: los elementos se pueden repetir.',
      'Prueba `[nombres[j] for j in [5]]`: no hay posición 5 y Python se para con un `IndexError`.',
    ],
    task: {
      prompt:
        'Guarda en `mejores` la lista con los títulos de las 3 películas con más puntos, de la que más puntos tiene a la que menos. `orden` ya tiene las posiciones de las películas de mayor a menor puntuación.',
      starter: `import numpy as np

pelis = ["Alba", "Brisa", "Cierzo", "Duna", "Eco", "Fuga"]
puntos = np.array([6.5, 9.0, 4.0, 7.5, 8.0, 5.5])
orden = np.argsort(-puntos)
# Guarda en mejores la lista con los títulos de las 3 películas con más puntos, de más a menos
mejores = None
`,
      checks: `_l = list(mejores) if isinstance(mejores, (list, tuple)) else None
_txt = _l is not None and len(_l) == 3 and all(isinstance(x, str) for x in _l)
check(_txt, "\`mejores\` tiene que ser una lista de 3 títulos, que son textos.")
check((_l is None) or len(_l) != 3 or _txt or all(isinstance(x, (int, np.integer)) for x in _l), "\`mejores\` tiene que contener textos y no otra cosa: cada posición se traduce al título con la lista \`pelis\`.")
check((not _txt) or _l != ["Alba", "Fuga", "Cierzo"], "\`mejores\` tiene las 3 películas con menos puntos. Los mejores están al principio de \`orden\`.")
check((not _txt) or _l != ["Duna", "Eco", "Brisa"], "\`mejores\` tiene las películas buenas pero en orden contrario: tiene que empezar por la que más puntos tiene.")
check((not _txt) or _l == ["Brisa", "Eco", "Duna"] or _l == ["Duna", "Eco", "Brisa"] or _l == ["Alba", "Fuga", "Cierzo"], "\`mejores\` tiene que contener los títulos de las 3 películas con más puntos, de más a menos.")
`,
      reference: `import numpy as np

pelis = ["Alba", "Brisa", "Cierzo", "Duna", "Eco", "Fuga"]
puntos = np.array([6.5, 9.0, 4.0, 7.5, 8.0, 5.5])
orden = np.argsort(-puntos)
mejores = [pelis[j] for j in orden[:3]]
`,
    },
  },
];
