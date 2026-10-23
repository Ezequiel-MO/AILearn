import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Rango: lo nuevo de su ejercicio «Programar». */
export const rangoWarmup: WarmupStep[] = [
  {
    id: 'rango.cal.1',
    title: '`np.linalg.matrix_rank`: el rango de una matriz',
    explain:
      '`np.linalg.matrix_rank(M)` devuelve el **rango** de `M`: cuántas de sus columnas (o de sus filas) aportan una dirección nueva. Es un **número entero**, no un array.\n\nSirve para matrices de cualquier forma, no solo cuadradas. El rango nunca pasa del menor de los dos tamaños: una matriz de 3 filas y 5 columnas tiene rango 3 como mucho, y ese máximo es `min(M.shape)`. Si el rango lo alcanza, la matriz tiene **rango completo**.\n\nDos tropiezos:\n\n- El rango no es el determinante: este solo existe en matrices cuadradas y únicamente dice si el rango baja, no cuánto.\n- El rango no es el tamaño: una matriz de 3 filas y 3 columnas puede tener rango 2, si una fila se calcula con las otras.',
    example: `import numpy as np

M = np.array([[1, 2, 3],
              [2, 4, 6],
              [0, 1, 1]])
print("forma:", M.shape)
print("rango:", np.linalg.matrix_rank(M))

W = np.array([[1, 0, 2, 5],
              [0, 1, 3, 4]])
print("forma:", W.shape, "rango:", np.linalg.matrix_rank(W))
print("rango de la identidad:", np.linalg.matrix_rank(np.eye(3)))
print("máximo posible para W:", min(W.shape))
`,
    experiments: [
      'Cambia la segunda fila de `M` por `[0, 0, 7]`: ya no es múltiplo de la primera. ¿Sube el rango?',
      'Prueba `np.linalg.matrix_rank(np.zeros((3, 3)))`: la matriz de ceros no tiene ninguna dirección.',
      'Añade una tercera fila a `W`, `[1, 1, 5, 9]`, que es la suma de las dos: el rango no cambia, porque la fila nueva no aporta nada.',
      'Escribe `print(np.linalg.det(M))` junto al rango: el determinante dice 0, pero no cuántas direcciones sobreviven.',
    ],
    task: {
      prompt:
        'Guarda en `r` el rango de `Q`, en `maximo` el rango más alto que podría tener una matriz con la forma de `Q` y en `completo` si `Q` alcanza ese máximo (un solo `True` o `False`).',
      starter: `import numpy as np

Q = np.array([[1, 0, 2, 1],
              [0, 1, 1, 1],
              [1, 1, 3, 2]])
# Guarda en r el rango de Q, en maximo el rango más alto posible para su forma y en completo si r llega a maximo
r = None
maximo = None
completo = None
`,
      checks: `_i = lambda n: isinstance(n, (int, np.integer)) and not isinstance(n, (bool, np.bool_))
_r = _i(r)
_m = _i(maximo)
_c = isinstance(completo, (bool, np.bool_))
check(_r, "\`r\` tiene que ser un número entero: el rango de \`Q\`, que se calcula con \`np.linalg.matrix_rank\`.")
check((not _r) or r != 3, "\`r\` vale 3, el número de filas. Pero la última fila de \`Q\` es la suma de las dos primeras y no aporta una dirección nueva.")
check((not _r) or r in (2, 3), "\`r\` tiene que valer 2: hay dos filas independientes y la otra sobra.")
check(_m, "\`maximo\` tiene que ser un número entero: el menor entre el número de filas y el de columnas de \`Q\`.")
check((not _m) or maximo != 4, "\`maximo\` vale 4, el número de columnas. Pero con 3 filas no puede haber más de 3 direcciones independientes: el máximo es el menor de los dos tamaños.")
check((not _m) or maximo in (3, 4), "\`maximo\` tiene que valer 3: el menor entre las 3 filas y las 4 columnas de \`Q\`.")
check(_c, "\`completo\` tiene que ser un solo \`True\` o \`False\`.")
check((not _c) or (not _r) or r != 2 or (not _m) or maximo != 3 or not bool(completo), "\`completo\` vale \`True\`, pero el rango de \`Q\` es menor que el máximo posible: se compara \`r\` con \`maximo\`.")
`,
      reference: `import numpy as np

Q = np.array([[1, 0, 2, 1],
              [0, 1, 1, 1],
              [1, 1, 3, 2]])
r = np.linalg.matrix_rank(Q)
maximo = min(Q.shape)
completo = r == maximo
`,
    },
  },
  {
    id: 'rango.cal.2',
    title: '`np.delete`: quitar una fila o una columna',
    explain:
      '`np.delete(M, k, axis=…)` devuelve una copia de `M` **sin** la fila o la columna `k`, contando desde 0. El argumento `axis` dice cuál:\n\n- `axis=0` quita una **fila**: `np.delete(M, 1, axis=0)` es `M` sin la fila 1.\n- `axis=1` quita una **columna**: `np.delete(M, 1, axis=1)` es `M` sin la columna 1.\n\nDos tropiezos. `M` **no cambia**: si quieres quedarte con el resultado, guárdalo en una variable. Y si te olvidas de `axis`, NumPy aplana la matriz en una sola lista y quita el elemento número `k` de esa lista, que casi nunca es lo que buscas.',
    example: `import numpy as np

M = np.array([[1, 2, 3, 4],
              [5, 6, 7, 8],
              [9, 10, 11, 12]])
print("sin la columna 1:")
print(np.delete(M, 1, axis=1))
print("sin la fila 0:")
print(np.delete(M, 0, axis=0))
print("M sigue teniendo la forma", M.shape)
print("sin axis, aplanada:", np.delete(M, 1))
`,
    experiments: [
      'Cambia `axis=1` por `axis=0` en la primera llamada: ahora quita la fila 1, y la forma es otra.',
      'Prueba `np.delete(M, [0, 2], axis=1)`: con una lista de posiciones quita varias columnas de una vez.',
      'Escribe `print(np.delete(M, 5, axis=1).shape)`: `M` solo tiene las columnas 0 a 3, así que Python se para. Lee qué dice el mensaje.',
      'Escribe `N = np.delete(M, 1, axis=1)` y después `print(N.shape)` y `print(M.shape)`: la copia es `N`, y `M` queda igual.',
    ],
    task: {
      prompt:
        'Guarda en `sin_col` la matriz `T` sin su columna 3 (la última) y en `sin_fila` la matriz `T` sin su fila 1.',
      starter: `import numpy as np

T = np.array([[4, 0, 2, 7],
              [1, 5, 3, 8],
              [6, 9, 0, 2]])
# Guarda en sin_col la matriz T sin la columna 3 y en sin_fila la matriz T sin la fila 1
sin_col = None
sin_fila = None
`,
      checks: `_a = lambda a: isinstance(a, np.ndarray) and np.issubdtype(a.dtype, np.number)
_c = _a(sin_col)
_f = _a(sin_fila)
check(_c, "\`sin_col\` tiene que ser un array de NumPy con números: \`T\` sin una columna.")
check((not _c) or sin_col.ndim == 2, "\`sin_col\` ha quedado como una sola lista de números. Falta el argumento \`axis\`: sin él, NumPy aplana la matriz antes de quitar nada.")
check((not _c) or sin_col.ndim != 2 or sin_col.shape != (2, 4), "\`sin_col\` tiene 2 filas y 4 columnas: has quitado una fila. Para quitar una columna hace falta \`axis=1\`.")
check((not _c) or sin_col.ndim != 2 or sin_col.shape != (3, 3) or np.array_equal(sin_col, [[4, 0, 2], [1, 5, 3], [6, 9, 0]]), "\`sin_col\` tiene que conservar las columnas 0, 1 y 2 de \`T\`, sin cambiarlas.")
check((not _c) or sin_col.ndim != 2 or sin_col.shape in ((2, 4), (3, 3)), "\`sin_col\` tiene que ser de 3 filas y 3 columnas: \`T\` sin su última columna.")
check(_f, "\`sin_fila\` tiene que ser un array de NumPy con números: \`T\` sin una fila.")
check((not _f) or sin_fila.ndim == 2, "\`sin_fila\` ha quedado como una sola lista de números. Falta el argumento \`axis\`: sin él, NumPy aplana la matriz antes de quitar nada.")
check((not _f) or sin_fila.ndim != 2 or sin_fila.shape != (3, 3), "\`sin_fila\` tiene 3 filas y 3 columnas: has quitado una columna. Para quitar una fila hace falta \`axis=0\`.")
check((not _f) or sin_fila.ndim != 2 or sin_fila.shape != (2, 4) or np.array_equal(sin_fila, [[4, 0, 2, 7], [6, 9, 0, 2]]), "\`sin_fila\` tiene que conservar las filas 0 y 2 de \`T\`, sin cambiarlas: se cuenta desde 0, así que la fila 1 es la del medio.")
check((not _f) or sin_fila.ndim != 2 or sin_fila.shape in ((3, 3), (2, 4)), "\`sin_fila\` tiene que ser de 2 filas y 4 columnas: \`T\` sin la fila 1.")
`,
      reference: `import numpy as np

T = np.array([[4, 0, 2, 7],
              [1, 5, 3, 8],
              [6, 9, 0, 2]])
sin_col = np.delete(T, 3, axis=1)
sin_fila = np.delete(T, 1, axis=0)
`,
    },
  },
  {
    id: 'rango.cal.3',
    title: 'Comprensiones de lista: `[… for k in range(n)]`',
    explain:
      'Una **comprensión de lista** construye una lista repitiendo una expresión para cada valor de `k`: `[k * k for k in range(5)]` es la lista `[0, 1, 4, 9, 16]`. `range(5)` recorre los números del 0 al 4.\n\nSi añades una condición al final, solo entran los valores que la cumplen: `[k for k in range(8) if k * k > 20]` da `[5, 6, 7]`.\n\nPara recorrer las filas de una matriz se usa `range(M.shape[0])`, y para las columnas, `range(M.shape[1])`. El resultado es una lista de Python, no un array: `np.array(lista)` la convierte.',
    example: `import numpy as np

cuadrados = [k * k for k in range(5)]
print("cuadrados:", cuadrados)

grandes = [k for k in range(8) if k * k > 20]
print("k con k * k mayor que 20:", grandes)

M = np.array([[1, 2], [3, 4], [5, 6]])
sumas = [M[k].sum() for k in range(M.shape[0])]
print("suma de cada fila:", np.array(sumas))
`,
    experiments: [
      'Cambia `range(5)` por `range(8)`: la lista tiene más elementos.',
      'Cambia la condición de `grandes` por `k * k < 20` y mira qué valores entran.',
      'Cambia `M[k].sum()` por `M[:, k].sum()` y `range(M.shape[0])` por `range(M.shape[1])`: ahora sale la suma de cada columna.',
      'Escribe `print(len(grandes))`: `len` cuenta los elementos de una lista.',
    ],
    task: {
      prompt:
        'Cada fila de `N` es una muestra, y `r` es el rango de `N`. Guarda en `rangos` una lista con 4 números: el rango de `N` sin la fila 0, sin la fila 1, sin la fila 2 y sin la fila 3, en ese orden. Guarda en `criticas` la lista de las filas cuya ausencia hace bajar el rango por debajo de `r`.',
      starter: `import numpy as np

N = np.array([[1, 0, 0],
              [0, 1, 0],
              [1, 1, 0],
              [0, 0, 1]])
r = np.linalg.matrix_rank(N)
# Guarda en rangos el rango de N sin cada fila (4 números) y en criticas las filas que, al quitarlas, bajan el rango de r
rangos = None
criticas = None
`,
      checks: `def _lista(a):
    try:
        return [int(k) for k in a]
    except Exception:
        return None

_g = _lista(rangos)
_k = _lista(criticas)
check(_g is not None and len(_g) == 4, "\`rangos\` tiene que ser una lista con 4 números: el rango de \`N\` al quitar cada una de sus 4 filas. Si te salen 3, estás quitando columnas: para quitar una fila hace falta \`axis=0\`.")
check((_g is None) or len(_g) != 4 or _g == [3, 3, 3, 2], "\`rangos\` tiene que valer 3, 3, 3 y 2: quitar cualquiera de las tres primeras filas deja el rango en 3, y quitar la última lo baja a 2.")
check(_k is not None, "\`criticas\` tiene que ser una lista de posiciones de fila, por ejemplo \`[1]\`.")
check((_k is None) or _k != [0, 1, 2], "\`criticas\` tiene las filas que se pueden quitar sin que baje el rango, al revés. Tienen que entrar las filas cuya ausencia hace bajar el rango.")
check((_k is None) or _k == [0, 1, 2] or _k == [3], "\`criticas\` tiene que ser la lista de las filas cuya ausencia deja el rango por debajo de \`r\`. Se cuentan desde 0.")
`,
      reference: `import numpy as np

N = np.array([[1, 0, 0],
              [0, 1, 0],
              [1, 1, 0],
              [0, 0, 1]])
r = np.linalg.matrix_rank(N)
rangos = [np.linalg.matrix_rank(np.delete(N, k, axis=0)) for k in range(N.shape[0])]
criticas = [k for k in range(N.shape[0]) if rangos[k] < r]
`,
    },
  },
];
