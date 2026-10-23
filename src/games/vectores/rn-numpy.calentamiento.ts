import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto ℝⁿ en NumPy: lo nuevo de su ejercicio «Programar». */
export const rnNumpyWarmup: WarmupStep[] = [
  {
    id: 'rn-numpy.cal.1',
    title: 'Una matriz de vectores y su forma: `np.array([p, r])` y `.shape`',
    explain:
      'Para guardar varios vectores a la vez, se meten en una lista dentro de `np.array`: `np.array([p, r])` deja `p` como **fila 0** y `r` como **fila 1**. El resultado es una matriz con un vector por fila.\n\n`.shape` es un atributo (se escribe sin paréntesis) que dice la forma del array en una tupla, con un número por **eje**:\n\n- un vector de 3 componentes tiene forma `(3,)`;\n- una matriz de 2 filas y 3 columnas tiene forma `(2, 3)`: primero las filas y después las columnas.\n\nPara leer un solo número de la forma se escribe `T.shape[0]` (las filas) o `T.shape[1]` (las columnas), y para guardar los dos de golpe, `filas, columnas = T.shape`.',
    example: `import numpy as np

p = np.array([1, 2, 3])
r = np.array([4, 5, 6])
tabla = np.array([p, r])

print(tabla)
print("forma de p:", p.shape)
print("forma de tabla:", tabla.shape)
filas, columnas = tabla.shape
print("filas:", filas, "y columnas:", columnas)
`,
    experiments: [
      'Cambia `np.array([p, r])` por `np.array([r, p])`: ¿qué fila va ahora primero?',
      'Añade `print(tabla.T.shape)`: `.T` cambia filas por columnas, y la forma se da la vuelta, `(3, 2)`.',
      'Escribe `print(tabla.shape[1])`: el número de columnas es el de componentes de cada vector.',
      'Cambia `p` por `np.array([1, 2])`, con un número menos que `r`: los vectores no miden lo mismo y NumPy no puede formar una matriz, así que Python se para con un error.',
    ],
    task: {
      prompt:
        'Guarda en `T` la matriz que tiene `u` como fila 0 y `w` como fila 1, en `n_filas` su número de filas y en `n_comp` su número de columnas (los componentes de cada vector). Los dos números salen de `T.shape`.',
      starter: `import numpy as np

u = np.array([4, 0, 1, 3, 2])
w = np.array([1, 5, 2, 0, 6])
# Guarda en T la matriz con u y w como filas, y en n_filas y n_comp sus filas y columnas
T = None
n_filas = None
n_comp = None
`,
      checks: `def _ent(v):
    return isinstance(v, (int, np.integer)) and not isinstance(v, bool)

_ok = isinstance(T, np.ndarray) and np.issubdtype(T.dtype, np.number)
check(_ok, "\`T\` tiene que ser un array de NumPy con números: la matriz que tiene \`u\` y \`w\` como filas.")
check((not _ok) or T.shape != (10,), "\`T\` es un solo vector de 10 números: \`u\` y \`w\` se han pegado uno detrás de otro. Para que cada uno sea una fila hay que meterlos en una lista dentro de \`np.array\`.")
check((not _ok) or T.shape != (5, 2), "\`T\` tiene 5 filas y 2 columnas: \`u\` y \`w\` han quedado como columnas. Tienen que ser filas.")
check((not _ok) or T.shape in ((10,), (5, 2)) or np.array_equal(T, [[4, 0, 1, 3, 2], [1, 5, 2, 0, 6]]), "\`T\` tiene que tener \`u\` en la fila 0 y \`w\` en la fila 1.")
check(_ent(n_filas), "\`n_filas\` tiene que ser un número entero: las filas de \`T\`, no la forma entera.")
check((not _ent(n_filas)) or n_filas == 2, "\`n_filas\` tiene que ser el número de filas de \`T\`: una por vector. En \`T.shape\` es el primer número.")
check(_ent(n_comp), "\`n_comp\` tiene que ser un número entero: las columnas de \`T\`, no la forma entera.")
check((not _ent(n_comp)) or n_comp != 2, "\`n_comp\` vale 2: es el número de filas. Los componentes de cada vector son las columnas, el segundo número de \`T.shape\`.")
check((not _ent(n_comp)) or n_comp == 2 or n_comp == 5, "\`n_comp\` tiene que ser el número de columnas de \`T\`: cuántos componentes tiene cada vector.")
`,
      reference: `import numpy as np

u = np.array([4, 0, 1, 3, 2])
w = np.array([1, 5, 2, 0, 6])
T = np.array([u, w])
n_filas = T.shape[0]
n_comp = T.shape[1]
`,
    },
  },
  {
    id: 'rn-numpy.cal.2',
    title: '`M - v`: restar un vector a cada fila, y `axis=1`',
    explain:
      'Si restas (o sumas, o multiplicas) un vector a una matriz, NumPy repite el vector **en cada fila**: es la **difusión** (en inglés, *broadcasting*). Funciona cuando el vector tiene tantos números como columnas la matriz. No hace falta ningún bucle.\n\nLo mismo pasa con `M * v`: multiplica cada fila de `M` por `v` componente a componente, que no es el producto de matrices `M @ v`.\n\nLas funciones que dan un número por fila o por columna llevan `axis`: con `axis=1` calculan **una cuenta por fila** (`np.sum(M, axis=1)`, `np.linalg.norm(M, axis=1)`) y con `axis=0`, una por columna. El resultado es un vector, con un número por cada fila (o columna).',
    example: `import numpy as np

M = np.array([[10, 20, 30],
              [40, 50, 60]])
v = np.array([1, 2, 3])

print("M - v:")
print(M - v)
print("suma de cada fila:", np.sum(M, axis=1))
print("suma de cada columna:", np.sum(M, axis=0))
print("norma de cada fila:", np.linalg.norm(M, axis=1))
`,
    experiments: [
      'Cambia `v` por `np.array([1, 2])`: la matriz tiene 3 columnas y `v`, 2 números, así que Python se para con un `ValueError` que habla de «broadcast». Lee el mensaje.',
      'Prueba `print(M - 10)`: un solo número también se repite en todas las casillas.',
      'Compara `M * v` con `M @ v`: el primero da una matriz del tamaño de `M` y el segundo, un vector con un número por fila.',
      'Mira la forma del resultado con `print(np.sum(M, axis=1).shape)` y con `axis=0`: ¿cuántos números salen en cada caso?',
    ],
    task: {
      prompt:
        'Cada fila de `notas` es un alumno y cada columna, una asignatura. Guarda en `media` la media de cada asignatura (un número por columna) y en `centradas` las notas de cada alumno menos la media de su asignatura, sin bucles.',
      starter: `import numpy as np

# Filas: 4 alumnos. Columnas: 3 asignaturas
notas = np.array([[7, 2, 9],
                  [5, 8, 8],
                  [9, 6, 6],
                  [3, 4, 5]])
# Guarda en media la media de cada asignatura y en centradas las notas menos esa media
media = None
centradas = None
`,
      checks: `_n = np.array([[7, 2, 9], [5, 8, 8], [9, 6, 6], [3, 4, 5]])
_m = isinstance(media, (np.ndarray, np.generic)) and np.issubdtype(media.dtype, np.number)
check(_m, "\`media\` tiene que ser un array de NumPy con números: la media de cada asignatura.")
check((not _m) or media.ndim != 0, "\`media\` es un único número: la media de toda la tabla. Hace falta una por asignatura, y para eso \`np.mean\` necesita \`axis\`.")
check((not _m) or media.shape != (4,), "\`media\` tiene 4 números: son las medias de cada alumno, una por fila. Hace falta una por asignatura, es decir, una por columna: cambia \`axis\`.")
check((not _m) or media.shape in ((), (4,)) or (media.shape == (3,) and np.allclose(media, [6, 5, 7])), "\`media\` tiene que valer (6, 5, 7): la media de cada columna de \`notas\`.")
_c = isinstance(centradas, np.ndarray) and np.issubdtype(centradas.dtype, np.number)
check(_c, "\`centradas\` tiene que ser un array de NumPy con números: las notas menos la media.")
check((not _c) or centradas.shape == (4, 3), "\`centradas\` tiene que tener 4 filas y 3 columnas, como \`notas\`.")
check((not _c) or centradas.shape != (4, 3) or not np.allclose(centradas, _n - 6), "\`centradas\` ha restado 6 a todo: es la media de toda la tabla. Cada columna tiene que restar la media de su asignatura.")
check((not _c) or centradas.shape != (4, 3) or np.allclose(centradas, _n - 6) or np.allclose(centradas, _n - np.array([6, 5, 7])), "\`centradas\` tiene que ser \`notas\` menos la media de cada asignatura: a la columna 0 se le resta 6, a la 1, 5 y a la 2, 7.")
`,
      reference: `import numpy as np

notas = np.array([[7, 2, 9],
                  [5, 8, 8],
                  [9, 6, 6],
                  [3, 4, 5]])
media = np.mean(notas, axis=0)
centradas = notas - media
`,
    },
  },
  {
    id: 'rn-numpy.cal.3',
    title: '`range(n)`: los números de 0 a n-1',
    explain:
      '`range(n)` da los números **0, 1, …, n-1**: empieza en 0 y no llega a `n`. Se usa para repetir algo `n` veces con `for i in range(n):`, y también para numerar cosas: la posición de cada elemento de un array de `n` elementos es un número de `range(n)`.\n\nNo es una lista, y `print(range(4))` solo escribe `range(0, 4)`. Para verlo como lista se escribe `list(range(4))`.\n\nSe combina con `len(x)`, que cuenta cuántos elementos tiene `x`, y con `plt.bar(posiciones, alturas)`, que dibuja una barra por cada posición.',
    example: `import numpy as np
import matplotlib.pyplot as plt

print(range(4))
print(list(range(4)))
for i in range(3):
    print("vuelta número", i)

lluvia = np.array([5, 12, 3, 8, 6])
print("datos:", len(lluvia))
plt.bar(range(len(lluvia)), lluvia)
`,
    experiments: [
      'Cambia `range(3)` por `range(5)`: ¿cuántas vueltas salen y cuál es la última?',
      'Escribe `print(list(range(1, 4)))`: con dos números, `range(a, b)` empieza en `a` y acaba en `b-1`.',
      'Cambia `range(len(lluvia))` por `range(3)` en `plt.bar`: Python se para con un error, porque hay 3 posiciones y 5 alturas.',
      'Añade `plt.xlabel("día")` y `plt.ylabel("litros")` al final: la figura se rotula.',
    ],
    task: {
      prompt:
        'Guarda en `n` el número de datos de `temps` (cuéntalos, no los escribas a mano), en `dias` la lista `[0, 1, 2, …]` con un número por dato, y dibuja una barra por día con su temperatura.',
      starter: `import numpy as np
import matplotlib.pyplot as plt

temps = np.array([18, 22, 25, 21, 19, 24])
# Guarda en n cuántos datos hay, en dias la lista con un número por dato, y dibuja una barra por día
n = None
dias = None
`,
      checks: `def _ent(v):
    return isinstance(v, (int, np.integer)) and not isinstance(v, bool)

check(_ent(n), "\`n\` tiene que ser un número entero: cuántos datos tiene \`temps\`.")
check((not _ent(n)) or n == 6, "\`n\` tiene que ser el número de datos de \`temps\`, que da \`len\`.")
_l = isinstance(dias, (list, tuple, np.ndarray)) and all(_ent(x) for x in dias)
check(_l, "\`dias\` tiene que ser una lista de números enteros, 0, 1, 2… Un \`range(...)\` solo no es una lista: se convierte con \`list\`.")
check((not _l) or len(dias) == 6, "\`dias\` tiene que tener un número por dato de \`temps\`, en total 6.")
check((not _l) or len(dias) != 6 or list(dias) != [1, 2, 3, 4, 5, 6], "\`dias\` empieza en 1, y \`range\` empieza en 0: el primer día es el 0.")
check((not _l) or len(dias) != 6 or list(dias) == [1, 2, 3, 4, 5, 6] or list(dias) == [0, 1, 2, 3, 4, 5], "\`dias\` tiene que ser la lista 0, 1, 2, 3, 4, 5.")
_fig = len(plt.get_fignums()) > 0
_pat = [p for ax in plt.gcf().axes for p in ax.patches] if _fig else []
_barras = [h for _x, h in sorted((p.get_x() + p.get_width() / 2, float(p.get_height())) for p in _pat)]
check(_fig, "No hay ninguna figura: dibuja las temperaturas con \`plt.bar\`.")
check((not _fig) or len(_pat) > 0, "No hay barras en la figura: dibújalas con \`plt.bar\`.")
check(len(_pat) == 0 or len(_pat) == 6, "La figura tiene barras de más o de menos: hace falta una por día, seis en total.")
check(len(_pat) != 6 or np.allclose(_barras, [18, 22, 25, 21, 19, 24]), "La altura de cada barra tiene que ser la temperatura de su día, en el orden de \`temps\`.")
`,
      reference: `import numpy as np
import matplotlib.pyplot as plt

temps = np.array([18, 22, 25, 21, 19, 24])
n = len(temps)
dias = list(range(n))
plt.bar(dias, temps)
`,
    },
  },
  {
    id: 'rn-numpy.cal.4',
    title: 'Los k mayores: `[::-1]`, `[:k]` y elegir con una lista de posiciones',
    explain:
      '`np.argsort(x)` da las posiciones que ordenan `x` de menor a mayor. Para quedarte con las `k` posiciones de los valores mayores se encadenan dos cortes:\n\n- `[::-1]` da la vuelta a la lista: el mayor pasa a ir primero.\n- `[:k]` se queda solo con los `k` primeros.\n\nSe escribe `np.argsort(x)[::-1][:k]`. Las dos cosas por separado valen para cualquier lista o array.\n\nCon una lista de posiciones entre corchetes se eligen esos elementos a la vez: si `pos` guarda `[3, 0]`, `x[pos]` es el array con `x[3]` y `x[0]`. Así, de las posiciones se pasa a los valores.',
    example: `import numpy as np

altura = np.array([172, 165, 190, 181, 158])
orden = np.argsort(altura)
print("de menor a mayor:", orden)
print("al revés:", orden[::-1])
altos = orden[::-1][:2]
print("posiciones de los 2 más altos:", altos)
print("sus alturas:", altura[altos])
`,
    experiments: [
      'Quita el `[::-1]` de `altos` y vuelve a ejecutar: ahora salen las posiciones de los dos más bajos.',
      'Cambia el `2` de `[:2]` por un `3`: ¿cuántas posiciones salen?',
      'Escribe `print(altura[[0, 4]])`: una lista de posiciones elige esos elementos, en ese orden.',
      'Prueba `print(altura[orden])`: las alturas ordenadas de menor a mayor.',
    ],
    task: {
      prompt:
        'Guarda en `top3` las posiciones de los tres valores mayores de `vent`, del mayor al menor, y en `valores` esos tres valores, en el mismo orden.',
      starter: `import numpy as np

vent = np.array([12, 40, 7, 25, 33, 18])
# Guarda en top3 las posiciones de los tres mayores (el mayor primero) y en valores esos tres valores
top3 = None
valores = None
`,
      checks: `_o = np.asarray(top3) if isinstance(top3, (np.ndarray, list, tuple)) else None
_ord = _o is not None and _o.shape == (3,) and np.issubdtype(_o.dtype, np.integer)
_orf = _o is not None and _o.shape == (3,) and np.issubdtype(_o.dtype, np.floating)
check(_ord or _orf, "\`top3\` tiene que ser un array de NumPy (o una lista) con 3 posiciones, números enteros del 0 al 5.")
check(not _orf, "\`top3\` tiene números decimales: parecen valores y no posiciones. \`np.argsort\` da posiciones.")
check((not _ord) or not np.array_equal(_o, [40, 33, 25]), "\`top3\` vale (40, 33, 25): son los tres valores mayores, no sus posiciones. Las posiciones salen de \`np.argsort\`.")
check((not _ord) or not np.array_equal(_o, [2, 0, 5]), "\`top3\` tiene las posiciones de los tres valores menores: \`np.argsort\` ordena de menor a mayor y hay que tomar el otro extremo.")
check((not _ord) or not np.array_equal(_o, [3, 4, 1]), "\`top3\` tiene los tres mayores pero en orden contrario: tiene que empezar por el mayor.")
check((not _ord) or np.array_equal(_o, [1, 4, 3]) or np.array_equal(_o, [40, 33, 25]) or np.array_equal(_o, [2, 0, 5]) or np.array_equal(_o, [3, 4, 1]), "\`top3\` tiene que ser las posiciones de los tres valores mayores de \`vent\`, el mayor primero.")
_v = isinstance(valores, np.ndarray) and np.issubdtype(valores.dtype, np.number) and valores.shape == (3,)
check(_v, "\`valores\` tiene que ser un array de NumPy con 3 números: los tres valores mayores de \`vent\`.")
check((not _v) or not np.array_equal(valores, [12, 40, 7]), "\`valores\` tiene los tres primeros números de \`vent\`, no los tres mayores. Hay que elegir con las posiciones de \`top3\`.")
check((not _v) or not np.array_equal(valores, [1, 4, 3]), "\`valores\` vale (1, 4, 3): son las posiciones, no los valores. Para pasar de posiciones a valores se pone la lista de posiciones entre los corchetes de \`vent\`.")
check((not _v) or np.array_equal(valores, [40, 33, 25]) or np.array_equal(valores, [12, 40, 7]) or np.array_equal(valores, [1, 4, 3]), "\`valores\` tiene que ser (40, 33, 25): los tres valores mayores de \`vent\`, del mayor al menor.")
`,
      reference: `import numpy as np

vent = np.array([12, 40, 7, 25, 33, 18])
top3 = np.argsort(vent)[::-1][:3]
valores = vent[top3]
`,
    },
  },
];
