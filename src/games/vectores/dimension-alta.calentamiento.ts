import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Dimensión alta: lo nuevo de su ejercicio «Programar». */
export const dimensionAltaWarmup: WarmupStep[] = [
  {
    id: 'dimension-alta.cal.1',
    title: 'Números al azar: `np.random.default_rng` y `rng.normal`',
    explain:
      '`rng = np.random.default_rng(semilla)` crea un **generador** de números al azar. La **semilla** (un número cualquiera) fija el punto de partida: con la misma semilla, el generador da siempre los mismos números, y así el resultado se puede repetir.\n\nDespués, `rng.normal(size=n)` devuelve un array de `n` números al azar, positivos y negativos, agrupados en torno a 0 (una distribución **normal**). Con `size=(f, c)` devuelve una matriz de `f` filas y `c` columnas.\n\nEl generador gasta números al usarse: cada llamada a `rng.normal` da números nuevos, distintos de los anteriores.',
    example: `import numpy as np

rng = np.random.default_rng(7)
x = rng.normal(size=4)
print("4 números al azar:", x)
M = rng.normal(size=(2, 3))
print("una matriz de 2 filas y 3 columnas:")
print(M)

otro = np.random.default_rng(7)
print("misma semilla, los mismos números:", otro.normal(size=4))
print("media de 1000 números:", np.mean(rng.normal(size=1000)))
`,
    experiments: [
      'Cambia la semilla `7` por `8` en la primera línea: salen otros números. Vuelve a ejecutar sin cambiar nada y salen los mismos.',
      'Añade `print(rng.normal(size=4))` justo antes de `x = rng.normal(size=4)`: `x` cambia, porque el generador ya había gastado esos números.',
      'Cambia `size=1000` por `size=100000`: ¿qué pasa con la media? Se acerca a 0.',
      'Escribe `print(rng.normal(size=(2, 3)).shape)`: la forma es `(2, 3)`.',
    ],
    task: {
      prompt:
        'Crea en `rng` un generador con la semilla `5`. Después, con él y en este orden, guarda en `v` 6 números normales y en `A` una matriz normal de 3 filas y 4 columnas.',
      starter: `import numpy as np

# Crea en rng un generador de semilla 5; guarda en v 6 números normales y en A una matriz normal de 3 filas y 4 columnas
rng = None
v = None
A = None
`,
      checks: `_g = isinstance(rng, np.random.Generator)
check(_g, "\`rng\` tiene que ser un generador de números al azar: \`np.random.default_rng(semilla)\`.")
_r = np.random.default_rng(5)
_v = _r.normal(size=6)
_A = _r.normal(size=(3, 4))
_vo = isinstance(v, np.ndarray) and v.shape == (6,) and np.issubdtype(v.dtype, np.number)
_Ao = isinstance(A, np.ndarray) and A.shape == (3, 4) and np.issubdtype(A.dtype, np.number)
check(_vo, "\`v\` tiene que ser un array de NumPy con 6 números normales: un solo vector de 6 componentes.")
check((not _vo) or np.allclose(v, _v), "\`v\` tiene que salir del generador con semilla 5 y ser lo primero que se pide: 6 números con \`size=6\`.")
check(_Ao, "\`A\` tiene que ser un array de NumPy con números: una matriz de 3 filas y 4 columnas.")
check((not _Ao) or np.allclose(A, _A), "\`A\` tiene que salir del mismo generador, después de \`v\`: la forma de la matriz se da con una tupla en \`size\`.")
`,
      reference: `import numpy as np

rng = np.random.default_rng(5)
v = rng.normal(size=6)
A = rng.normal(size=(3, 4))
`,
    },
  },
  {
    id: 'dimension-alta.cal.2',
    title: 'Resumir un array: `np.abs`, `np.std`, `.max()` y `np.mean(x < c)`',
    explain:
      'Funciones que resumen un array o lo transforman:\n\n- `np.abs(x)` cambia el signo de los negativos: el valor absoluto de cada elemento. Para un solo número vale también `abs(x)`.\n- `np.std(x)` es la **desviación típica**: cuánto se alejan los números de su media. Vale 0 si todos son iguales, y es mayor cuanto más repartidos están.\n- `x.max()` y `x.min()` son lo mismo que `np.max(x)` y `np.min(x)`: se escriben detrás del array, con paréntesis.\n- `np.mean(x < c)`: `x < c` da `True` o `False` para cada elemento, y `True` cuenta como 1 y `False` como 0; la media es entonces la **fracción** de elementos que cumplen la condición.',
    example: `import numpy as np

x = np.array([3, -4, 1, -2, 5, 0])
print("valor absoluto:", np.abs(x))
print("el mayor:", x.max())
print("el menor:", x.min())
print("desviación típica:", np.std(x))
print("fracción con |x| menor que 3:", np.mean(np.abs(x) < 3))
print("abs de un número:", abs(-7))
`,
    experiments: [
      'Cambia `3` por `10` en `np.abs(x) < 3`: ¿qué fracción sale? Si todos cumplen la condición, sale 1.',
      'Escribe `print(np.std(np.array([4, 4, 4])))`: números todos iguales, desviación 0.',
      'Quita `np.abs(...)` de la última línea con la fracción y compara: así cuentan también los negativos grandes.',
      'Escribe `print(np.abs(x).max())`: se pueden encadenar, y da el mayor valor absoluto.',
    ],
    task: {
      prompt:
        'Guarda en `grande` el mayor valor absoluto de `datos`, en `dispersion` su desviación típica y en `fraccion` la fracción de números de `datos` cuyo valor absoluto es mayor que 4.',
      starter: `import numpy as np

datos = np.array([2, -12, 4, -1, 9, -3, 5, 0])
# Guarda en grande el mayor valor absoluto, en dispersion la desviación típica y en fraccion la fracción con valor absoluto mayor que 4
grande = None
dispersion = None
fraccion = None
`,
      checks: `_d = np.array([2, -12, 4, -1, 9, -3, 5, 0])
def _num(v):
    return isinstance(v, (int, float, np.integer, np.floating)) and not isinstance(v, bool)

check(_num(grande), "\`grande\` tiene que ser un solo número: el mayor valor absoluto de \`datos\`.")
check((not _num(grande)) or grande != 9, "\`grande\` vale 9, el mayor de los números tal cual. Hay uno negativo de más tamaño: falta quitar los signos antes de buscar el mayor.")
check((not _num(grande)) or grande == 9 or grande == 12, "\`grande\` tiene que ser el mayor valor absoluto de \`datos\`.")
check(_num(dispersion), "\`dispersion\` tiene que ser un solo número: la desviación típica de \`datos\`.")
check((not _num(dispersion)) or np.isclose(dispersion, np.std(_d)), "\`dispersion\` tiene que ser la desviación típica de los 8 números de \`datos\`.")
check(_num(fraccion), "\`fraccion\` tiene que ser un solo número entre 0 y 1: la fracción de números que cumplen la condición.")
check((not _num(fraccion)) or fraccion != 3, "\`fraccion\` vale 3: es cuántos números cumplen la condición. Una fracción es esa cantidad entre el total.")
check((not _num(fraccion)) or fraccion != 0.25, "\`fraccion\` vale 0,25: solo cuenta los positivos mayores que 4. El enunciado habla del valor absoluto, y los negativos también cuentan.")
check((not _num(fraccion)) or fraccion in (3, 0.25) or np.isclose(fraccion, 3 / 8), "\`fraccion\` tiene que ser la fracción de números de \`datos\` con valor absoluto mayor que 4.")
`,
      reference: `import numpy as np

datos = np.array([2, -12, 4, -1, 9, -3, 5, 0])
grande = np.abs(datos).max()
dispersion = np.std(datos)
fraccion = np.mean(np.abs(datos) > 4)
`,
    },
  },
  {
    id: 'dimension-alta.cal.3',
    title: '`M @ M.T` y `np.triu_indices(n, k=1)`: todas las parejas de filas',
    explain:
      'Si las filas de `M` son vectores, `M @ M.T` es una matriz cuadrada `G` en la que `G[i, j]` es el producto escalar de la fila `i` con la fila `j`. (`M.T` es la traspuesta: las filas pasan a ser columnas.)\n\nEsa matriz repite cada pareja dos veces, `G[i, j]` y `G[j, i]`, y su diagonal es cada fila consigo misma. Para quedarte con cada pareja una sola vez, `np.triu_indices(n, k=1)` da dos arrays, `i` y `j`, con las posiciones de la matriz que quedan por encima de la diagonal (`i` menor que `j`). Después, `G[i, j]` elige esas casillas y devuelve un array con una pareja por número: `n * (n - 1) / 2` en total.\n\nCon `k=0` entraría también la diagonal.',
    example: `import numpy as np

X = np.array([[1, 0],
              [0, 2],
              [3, 3]])
G = X @ X.T
print(G)
i, j = np.triu_indices(3, k=1)
print("i:", i)
print("j:", j)
print("una vez cada pareja:", G[i, j])
print("cuántas parejas:", len(G[i, j]))
`,
    experiments: [
      'Cambia `k=1` por `k=0` y mira `i` y `j`: ahora aparecen también parejas como la (0, 0), la fila consigo misma.',
      'Escribe `print(G[0, 2], G[2, 0])`: la pareja de las filas 0 y 2 está dos veces, igual.',
      'Cambia `3` por `4` en `np.triu_indices`: la matriz tiene solo 3 filas, y Python se para con un `IndexError` al elegir.',
      'Añade `print(np.max(G[i, j]))`: el producto escalar mayor entre dos filas distintas.',
    ],
    task: {
      prompt:
        'Cada fila de `F` es un vector. Guarda en `G` la matriz con el producto escalar de cada fila con cada fila y en `pares` un array con el producto de cada pareja de filas distintas, una sola vez cada pareja.',
      starter: `import numpy as np

F = np.array([[1, 2],
              [3, 0],
              [2, 2],
              [0, 1]])
# Guarda en G los productos escalares de cada fila con cada fila, y en pares los de cada pareja distinta, una vez
G = None
pares = None
`,
      checks: `_g = isinstance(G, np.ndarray) and G.shape == (4, 4) and np.issubdtype(G.dtype, np.number)
check(_g, "\`G\` tiene que ser un array de NumPy con 4 filas y 4 columnas: una casilla por cada pareja de filas de \`F\`.")
check((not _g) or np.allclose(G, [[5, 3, 6, 2], [3, 9, 6, 0], [6, 6, 8, 2], [2, 0, 2, 1]]), "\`G\` tiene que tener en la casilla de la fila \`i\` y la columna \`j\` el producto escalar de la fila \`i\` de \`F\` con la fila \`j\`: se calcula multiplicando \`F\` por su traspuesta.")
_p = isinstance(pares, np.ndarray) and pares.ndim == 1 and np.issubdtype(pares.dtype, np.number)
check(_p, "\`pares\` tiene que ser un array de NumPy con una sola fila de números, no una matriz.")
check((not _p) or len(pares) != 10, "\`pares\` tiene 10 números: están también los de cada fila consigo misma, la diagonal. Hay que excluirla con el valor de \`k\`.")
check((not _p) or len(pares) != 16, "\`pares\` tiene 16 números: son todas las casillas de \`G\`, y cada pareja sale dos veces.")
check((not _p) or len(pares) in (10, 16) or np.allclose(pares, [3, 6, 2, 6, 0, 2]), "\`pares\` tiene que tener 6 números, uno por pareja de filas distintas, en el orden (0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3).")
`,
      reference: `import numpy as np

F = np.array([[1, 2],
              [3, 0],
              [2, 2],
              [0, 1]])
G = F @ F.T
i, j = np.triu_indices(4, k=1)
pares = G[i, j]
`,
    },
  },
  {
    id: 'dimension-alta.cal.4',
    title: 'Una lista que crece: `lista.append(x)` dentro de un `for`',
    explain:
      'Para guardar un resultado por cada vuelta de un bucle, se empieza con una lista vacía, `res = []`, y en cada vuelta se añade un elemento al final con `res.append(x)`. Al acabar, `np.array(res)` la convierte en un array de NumPy.\n\nLa lista vacía se crea **antes** del bucle: si la creases dentro, se vaciaría en cada vuelta. Y `append` cambia la lista, no devuelve nada: no se escribe `res = res.append(x)`.\n\n`for _ in range(n):` repite `n` veces cuando el contador no se usa: el guion bajo `_` es un nombre de variable normal que, por costumbre, significa «no lo necesito».',
    example: `import numpy as np

cubos = []
for k in range(4):
    cubos.append(k ** 3)
    print("vuelta", k, "-> lista:", cubos)
arr = np.array(cubos)
print("como array:", arr, "de forma", arr.shape)

for _ in range(2):
    print("hola")
`,
    experiments: [
      'Cambia `range(4)` por `range(6)`: la lista llega más lejos.',
      'Cambia `k ** 3` por `k * 10` y vuelve a ejecutar: ¿qué lista sale?',
      'Pon `cubos = []` dentro del bucle, justo antes de `append`: la lista se vacía en cada vuelta y al final solo queda el último elemento.',
      'Escribe `print(len(cubos))` al final: cuenta los elementos de la lista.',
    ],
    task: {
      prompt:
        'Con un bucle `for k in range(6)`, guarda en `suma_hasta` un array de 6 números en el que el elemento `k` es la suma 0 + 1 + … + k. Tiene que salir (0, 1, 3, 6, 10, 15).',
      starter: `import numpy as np

# Guarda en suma_hasta un array de 6 números: el elemento k es la suma de los números de 0 a k
suma_hasta = None
`,
      checks: `_ok = isinstance(suma_hasta, np.ndarray) and suma_hasta.shape == (6,) and np.issubdtype(suma_hasta.dtype, np.number)
check(_ok, "\`suma_hasta\` tiene que ser un array de NumPy con 6 números. Si has guardado una lista, conviértela con \`np.array\`.")
check((not _ok) or not np.array_equal(suma_hasta, [0, 1, 2, 3, 4, 5]), "\`suma_hasta\` vale (0, 1, 2, 3, 4, 5): son los propios \`k\`. En cada vuelta hay que guardar la suma de todos los números hasta \`k\`, no solo \`k\`.")
check((not _ok) or not np.array_equal(suma_hasta, [1, 3, 6, 10, 15, 21]), "\`suma_hasta\` va una posición adelantada: la suma hasta \`k\` incluye a \`k\`, pero la primera tiene que ser la de \`k = 0\`, que vale 0.")
check((not _ok) or np.array_equal(suma_hasta, [0, 1, 2, 3, 4, 5]) or np.array_equal(suma_hasta, [1, 3, 6, 10, 15, 21]) or np.array_equal(suma_hasta, [0, 1, 3, 6, 10, 15]), "\`suma_hasta\` tiene que valer (0, 1, 3, 6, 10, 15): el elemento \`k\` es la suma de los números de 0 a \`k\`.")
`,
      reference: `import numpy as np

suma_hasta = []
total = 0
for k in range(6):
    total = total + k
    suma_hasta.append(total)
suma_hasta = np.array(suma_hasta)
`,
    },
  },
];
