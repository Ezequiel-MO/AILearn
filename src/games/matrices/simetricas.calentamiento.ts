import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Matrices simétricas: lo nuevo de su ejercicio «Programar». */
export const simetricasWarmup: WarmupStep[] = [
  {
    id: 'simetricas.cal.1',
    title: '`.T` y `np.allclose`: la traspuesta y la simetría',
    explain:
      '`M.T` es la **traspuesta** de `M`: intercambia filas y columnas, de modo que la entrada de la fila 0 y la columna 2 pasa a la fila 2 y la columna 0. Una matriz de 2 filas y 3 columnas tiene una traspuesta de 3 filas y 2 columnas.\n\nUna matriz cuadrada es **simétrica** si es igual a su traspuesta. Para comprobarlo:\n\n- `M == M.T` compara entrada por entrada y da **una matriz** de `True` y `False`, no una sola respuesta.\n- `np.allclose(M, M.T)` compara todas las entradas, admite diferencias diminutas de redondeo y devuelve **un solo** `True` o `False`.',
    example: `import numpy as np

M = np.array([[1, 2, 3],
              [4, 5, 6]])
print("forma de M:", M.shape)
print("la traspuesta de M:")
print(M.T)
print("forma de la traspuesta:", M.T.shape)

S = np.array([[2, 7],
              [7, 5]])
R = np.array([[2, 7],
              [6, 5]])
print("¿S es igual a su traspuesta?", np.allclose(S, S.T))
print("¿R es igual a su traspuesta?", np.allclose(R, R.T))
print("S == S.T da una matriz entera:")
print(S == S.T)
`,
    experiments: [
      'Cambia el `6` de `R` por un `7` y vuelve a ejecutar: `R` pasa a ser simétrica y `np.allclose` da `True`.',
      'Escribe `print(M.T.T)`: trasponer dos veces devuelve la matriz de partida.',
      'Escribe `print(R + R.T)`: la suma de una matriz y su traspuesta sale siempre simétrica. Comprúebalo con `np.allclose`.',
      'Escribe `print(np.allclose(M, M.T))`: `M` no es cuadrada, su traspuesta tiene otra forma y NumPy no puede compararlas. Lee qué mensaje da.',
    ],
    task: {
      prompt:
        'Guarda en `K_t` la traspuesta de `K`, en `K_sim` si `K` es simétrica y en `L_sim` si `L` es simétrica (un solo `True` o `False` cada una).',
      starter: `import numpy as np

K = np.array([[1, 4, 7],
              [4, 2, 5],
              [7, 6, 3]])
L = np.array([[6, -2],
              [-2, 3]])
# Guarda en K_t la traspuesta de K, en K_sim si K es simétrica y en L_sim si L es simétrica
K_t = None
K_sim = None
L_sim = None
`,
      checks: `_K = np.array([[1, 4, 7], [4, 2, 5], [7, 6, 3]])
_t = isinstance(K_t, np.ndarray) and K_t.shape == (3, 3) and K_t.dtype.kind in "iuf"
_a = isinstance(K_sim, (bool, np.bool_))
_b = isinstance(L_sim, (bool, np.bool_))
check(_t, "\`K_t\` tiene que ser un array de NumPy de 3 filas y 3 columnas: la traspuesta de \`K\`.")
check((not _t) or not np.array_equal(K_t, _K), "\`K_t\` es igual a \`K\`: falta trasponer. La traspuesta intercambia las filas y las columnas.")
check((not _t) or np.array_equal(K_t, _K) or np.array_equal(K_t, _K.T), "\`K_t\` tiene que ser la traspuesta de \`K\`: su fila 0 es la columna 0 de \`K\`.")
check(_a, "\`K_sim\` tiene que ser un solo \`True\` o \`False\`, no una matriz: la respuesta a si \`K\` es simétrica.")
check((not _a) or not bool(K_sim), "\`K_sim\` vale \`True\`, pero \`K\` no es simétrica: la entrada de la fila 1 y la columna 2 no es igual a la de la fila 2 y la columna 1.")
check(_b, "\`L_sim\` tiene que ser un solo \`True\` o \`False\`, no una matriz: la respuesta a si \`L\` es simétrica.")
check((not _b) or bool(L_sim), "\`L_sim\` vale \`False\`, pero \`L\` es simétrica: es igual a su traspuesta. Compáralas con \`np.allclose\`.")
`,
      reference: `import numpy as np

K = np.array([[1, 4, 7],
              [4, 2, 5],
              [7, 6, 3]])
L = np.array([[6, -2],
              [-2, 3]])
K_t = K.T
K_sim = np.allclose(K, K.T)
L_sim = np.allclose(L, L.T)
`,
    },
  },
  {
    id: 'simetricas.cal.2',
    title: 'La media de cada columna y restarla a cada fila',
    explain:
      'En una tabla de datos con una muestra por fila, `datos.mean(axis=0)` calcula **una media por cada columna**: un array con tantos números como columnas. Con `axis=1` saldría una media por cada fila.\n\nRestar ese array a la tabla, `datos - medias`, resta a **cada fila** las medias, columna a columna: NumPy repite el array de medias sobre todas las filas (se llama *difusión*, o *broadcasting*). Es la forma de **centrar** los datos: tras restar las medias, cada columna tiene media $0$.',
    example: `import numpy as np

notas = np.array([[6, 8],
                  [8, 5],
                  [4, 9],
                  [10, 6]])
medias = notas.mean(axis=0)
print("forma de las notas:", notas.shape)
print("una media por columna:", medias, "con forma", medias.shape)

centradas = notas - medias
print("las notas menos las medias:")
print(centradas)
print("media de cada columna ahora:", centradas.mean(axis=0))
print("con axis=1 sale una por fila:", notas.mean(axis=1))
`,
    experiments: [
      'Cambia `axis=0` por `axis=1` en la primera media: sale un número por fila y ya no se puede restar a las columnas.',
      'Escribe `print(notas - notas.mean())`: sin `axis`, se resta una sola media, la de todos los números, y las columnas no quedan centradas.',
      'Cambia el `6` de la primera fila por `60` y mira cuánto cambia la primera media y cuánto la segunda.',
      'Escribe `print(centradas.sum(axis=0))`: la suma de cada columna centrada es $0$, salvo redondeo.',
    ],
    task: {
      prompt:
        'En `mediciones` hay 5 instantes (una fila cada uno) de 3 sensores (una columna cada uno). Guarda en `medias` la media de cada sensor y en `sin_media` las mediciones con la media de su sensor restada.',
      starter: `import numpy as np

mediciones = np.array([[12, 3, 5],
                       [14, 1, 7],
                       [10, 5, 6],
                       [16, 2, 4],
                       [13, 4, 3]])
# Guarda en medias la media de cada sensor y en sin_media las mediciones menos la media de su sensor
medias = None
sin_media = None
`,
      checks: `_M = np.array([[12, 3, 5], [14, 1, 7], [10, 5, 6], [16, 2, 4], [13, 4, 3]], dtype=float)
_m = isinstance(medias, np.ndarray) and medias.dtype.kind in "iuf"
_m3 = _m and medias.shape == (3,)
_m5 = _m and medias.shape == (5,)
_s = isinstance(sin_media, np.ndarray) and sin_media.shape == (5, 3) and sin_media.dtype.kind in "iuf"
check(_m, "\`medias\` tiene que ser un array de NumPy: una media por cada sensor.")
check((not _m) or not _m5, "\`medias\` tiene una media por cada instante, es decir, por cada fila. Hay que calcular una por cada sensor, es decir, por cada columna.")
check((not _m) or _m5 or _m3, "\`medias\` tiene que tener 3 números: la media de cada sensor.")
check((not _m3) or np.allclose(medias, [13, 3, 5]), "\`medias\` no tiene la media de cada sensor: 13 para el primero, 3 para el segundo y 5 para el tercero.")
check(_s, "\`sin_media\` tiene que ser un array de NumPy de 5 filas y 3 columnas: las mediciones con la media de cada sensor restada.")
check((not _s) or not np.allclose(sin_media, _M - _M.mean()), "\`sin_media\` resta una sola media, la de todos los números a la vez. Hay que restar a cada columna la media de esa columna.")
check((not _s) or np.allclose(sin_media, _M - _M.mean()) or np.allclose(sin_media, _M - _M.mean(axis=0)), "\`sin_media\` tiene que ser \`mediciones\` menos \`medias\`: cada columna con su media restada, de modo que la media de cada columna queda en 0.")
`,
      reference: `import numpy as np

mediciones = np.array([[12, 3, 5],
                       [14, 1, 7],
                       [10, 5, 6],
                       [16, 2, 4],
                       [13, 4, 3]])
medias = mediciones.mean(axis=0)
sin_media = mediciones - medias
`,
    },
  },
  {
    id: 'simetricas.cal.3',
    title: '`np.cov` y qué toma como variable',
    explain:
      '`np.cov(M)` calcula la **matriz de covarianza**: una fila y una columna por cada **variable**, con las varianzas en la diagonal y las covarianzas fuera de ella. Es simétrica, y las sumas se dividen entre $n-1$, con $n$ el número de muestras.\n\nHay un detalle que confunde: por defecto, `np.cov` toma cada **fila** como una variable y cada columna como una observación. Si tus datos son una tabla con una muestra por fila, hay que avisarle: `np.cov(M, rowvar=False)`, o pasarle la traspuesta, `np.cov(M.T)`. Si no, calcula otra cosa, y su tamaño lo delata.',
    example: `import numpy as np

M = np.array([[2, 4, 1],
              [4, 3, 5],
              [6, 8, 2],
              [8, 5, 6]])
print("M tiene", M.shape[0], "muestras y", M.shape[1], "variables")
print("forma de np.cov(M):", np.cov(M).shape)
print("forma de np.cov(M, rowvar=False):", np.cov(M, rowvar=False).shape)
print("forma de np.cov(M.T):", np.cov(M.T).shape)

C = np.cov(M, rowvar=False)
print(C)
print("¿es simétrica?", np.allclose(C, C.T))
print("varianza de la variable 0:", C[0, 0])
print("covarianza entre las variables 0 y 2:", C[0, 2])
`,
    experiments: [
      'Cambia la última fila de `M` por `[8, 5, 60]` y mira qué entradas de `C` cambian: las de la tercera variable.',
      'Escribe `print(np.cov(M))`: sale una matriz de 4 por 4, una fila por muestra, que no es la de las variables.',
      'Escribe `print(M[:, 0].var(ddof=1))` y compáralo con `C[0, 0]`: es la misma varianza, con $n-1$ como divisor.',
      'Escribe `print(M[:, 0].var())` y compáralo: sin `ddof=1` se divide entre $n$, y sale un número más pequeño.',
    ],
    task: {
      prompt:
        'En `T` hay 5 instantes (una fila cada uno) de 3 sensores (una columna cada uno). Guarda en `S` la matriz de covarianza de los sensores y en `cov_02` la covarianza entre el primer y el tercer sensor.',
      starter: `import numpy as np

T = np.array([[1, 2, 6],
              [3, 1, 4],
              [2, 5, 5],
              [5, 3, 2],
              [4, 4, 3]])
# Guarda en S la matriz de covarianza de los tres sensores y en cov_02 la covarianza del primero con el tercero
S = None
cov_02 = None
`,
      checks: `_S = np.array([[2.5, 0.25, -2.5], [0.25, 2.5, -0.25], [-2.5, -0.25, 2.5]])
_s = isinstance(S, np.ndarray) and S.ndim == 2 and S.dtype.kind in "iuf"
_s5 = _s and S.shape == (5, 5)
_s3 = _s and S.shape == (3, 3)
_c = isinstance(cov_02, (int, float, np.integer, np.floating)) and not isinstance(cov_02, (bool, np.bool_))
check(_s, "\`S\` tiene que ser un array de NumPy de dos ejes: la matriz de covarianza.")
check((not _s) or not _s5, "\`S\` tiene 5 filas y 5 columnas, una por cada instante. \`np.cov\` toma por defecto cada fila como una variable; aquí los sensores están en las columnas.")
check((not _s) or _s5 or _s3, "\`S\` tiene que tener 3 filas y 3 columnas: una por cada sensor.")
check((not _s3) or np.allclose(S, _S), "\`S\` no tiene las varianzas y covarianzas de los tres sensores, divididas entre el número de instantes menos 1.")
check(_c, "\`cov_02\` tiene que ser un número: la covarianza entre el primer y el tercer sensor.")
check((not _c) or np.isclose(cov_02, -2.5), "\`cov_02\` tiene que valer -2,5: es la covarianza entre el primer y el tercer sensor, una entrada de fuera de la diagonal de la matriz de covarianza.")
`,
      reference: `import numpy as np

T = np.array([[1, 2, 6],
              [3, 1, 4],
              [2, 5, 5],
              [5, 3, 2],
              [4, 4, 3]])
S = np.cov(T, rowvar=False)
cov_02 = S[0, 2]
`,
    },
  },
  {
    id: 'simetricas.cal.4',
    title: '`np.linalg.eigh` y `[::-1]`: autovalores en orden y autovectores en columnas',
    explain:
      '`np.linalg.eigh(M)` calcula los **autovalores** y los **autovectores** de una matriz **simétrica**. Devuelve dos cosas, que se guardan de una vez: `vals, vecs = np.linalg.eigh(M)`.\n\n- `vals` es un array con los autovalores, siempre **de menor a mayor**.\n- `vecs` es una matriz cuyas **columnas** son los autovectores, de longitud 1: la columna `vecs[:, k]` es el autovector del autovalor `vals[k]`. En general, sus filas no son autovectores.\n\nPara tener los autovalores **de mayor a menor** se les da la vuelta con `vals[::-1]`. Pero los autovectores no se reordenan solos: `vecs[:, ::-1]` da la vuelta a las columnas. El signo de un autovector es arbitrario: `u` y `-u` valen lo mismo.',
    example: `import numpy as np

M = np.array([[1, 2],
              [2, -2]])
vals, vecs = np.linalg.eigh(M)
print("autovalores, de menor a mayor:", vals)
print("autovectores, en las columnas:")
print(vecs)

k = 1
u = vecs[:, k]
print("autovector del autovalor", vals[k], ":", u)
print("M por el autovector:", M @ u)
print("el autovalor por el autovector:", vals[k] * u)
print("autovalores de mayor a menor:", vals[::-1])
`,
    experiments: [
      'Cambia `k = 1` por `k = 0` y comprueba que `M @ u` sigue siendo el autovalor por `u`.',
      'Escribe `print(vecs[0])` y compáralo con `print(vecs[:, 0])`: la primera es una fila, que aquí no es un autovector (en general no lo es); la segunda es una columna, que sí.',
      'Escribe `print(vecs[:, 0] @ vecs[:, 1])`: el producto escalar de los dos autovectores es $0$, salvo redondeo, porque son perpendiculares.',
      'Escribe `print(vecs.T @ vecs)`: sale la matriz identidad, porque las columnas son perpendiculares y de longitud 1.',
    ],
    task: {
      prompt:
        'Guarda en `valores` y `vectores` lo que devuelve `np.linalg.eigh(N)`, en `de_mayor_a_menor` los autovalores ordenados del mayor al menor y en `v_menor` el autovector del autovalor menor.',
      starter: `import numpy as np

N = np.array([[0, 3],
              [3, -8]])
# Guarda en valores y vectores lo que devuelve np.linalg.eigh(N), en de_mayor_a_menor los autovalores del mayor al menor y en v_menor el autovector del autovalor menor
valores = None
vectores = None
de_mayor_a_menor = None
v_menor = None
`,
      checks: `def _arr(a, shape):
    return isinstance(a, np.ndarray) and a.shape == shape and a.dtype.kind in "iuf"
_N = np.array([[0.0, 3.0], [3.0, -8.0]])
_v = _arr(valores, (2,))
_vok = _v and np.allclose(np.sort(valores), [-9, 1])
_V = _arr(vectores, (2, 2))
_Vok = _vok and _V and np.allclose(_N @ vectores, vectores * valores)
_d = _arr(de_mayor_a_menor, (2,))
_m = _arr(v_menor, (2,))
def _par(a, b):
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    return na > 0 and nb > 0 and abs(float(a @ b)) / (na * nb) > 1 - 1e-6
_mok = _m and _par(v_menor, np.array([1.0, -3.0]))
_row = _m and _V and any(_par(v_menor, vectores[k]) for k in range(2))
check(_v, "\`valores\` tiene que ser un array de NumPy con 2 números: los autovalores de \`N\`.")
check((not _v) or _vok, "\`valores\` no tiene los autovalores de \`N\`. Son los que devuelve \`np.linalg.eigh\`.")
check(_V, "\`vectores\` tiene que ser un array de NumPy de 2 filas y 2 columnas: la matriz de autovectores que devuelve \`np.linalg.eigh\`.")
check((not _V) or (not _vok) or _Vok, "\`vectores\` no es la matriz de autovectores de \`N\`: cada columna tiene que ser el autovector del autovalor que está en su misma posición de \`valores\`.")
check(_d, "\`de_mayor_a_menor\` tiene que ser un array de NumPy con 2 números: los autovalores ordenados.")
check((not _d) or not np.allclose(de_mayor_a_menor, [-9, 1]), "\`de_mayor_a_menor\` está de menor a mayor, que es el orden en que \`np.linalg.eigh\` los devuelve. Hay que darles la vuelta.")
check((not _d) or np.allclose(de_mayor_a_menor, [-9, 1]) or np.allclose(de_mayor_a_menor, [1, -9]), "\`de_mayor_a_menor\` tiene que tener los dos autovalores de \`N\`, el mayor primero.")
check(_m, "\`v_menor\` tiene que ser un array de NumPy con 2 números: el autovector del autovalor menor.")
check((not _m) or _mok or not _row, "\`v_menor\` es una fila de \`vectores\`. Los autovectores están en las columnas, no en las filas.")
check((not _m) or _mok or _row, "\`v_menor\` tiene que ser el autovector del autovalor menor: la columna de \`vectores\` que está en la misma posición que ese autovalor en \`valores\`.")
`,
      reference: `import numpy as np

N = np.array([[0, 3],
              [3, -8]])
valores, vectores = np.linalg.eigh(N)
de_mayor_a_menor = valores[::-1]
v_menor = vectores[:, 0]
`,
    },
  },
];
