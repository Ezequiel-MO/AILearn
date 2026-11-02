import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto «Atención como matriz»: lo nuevo de su ejercicio «Programar». */
export const atencionWarmup: WarmupStep[] = [
  {
    id: 'atencion.cal.1',
    title: '`.T` y `@`: una tabla con todos los productos escalares',
    explain:
      'Cuando cada fila de un array es un objeto (un usuario, una palabra) y cada columna una característica, la traspuesta `.T` cambia filas por columnas: un array de 3 filas y 2 columnas pasa a tener 2 filas y 3 columnas. El producto `a @ b` exige que las columnas de `a` sean tantas como las filas de `b`, y da una tabla con las filas de `a` y las columnas de `b`.\n\nAsí, `A @ B.T` pone en la posición `[i, j]` el producto escalar de la fila `i` de `A` con la fila `j` de `B`: **todos los productos escalares de golpe**, sin bucles. La forma lo dice todo: `A` de 2 filas y `B` de 4 filas dan una tabla de 2 filas y 4 columnas.\n\n`A.shape` es la pareja (filas, columnas), y `A.shape[1]` es el número de columnas: cuántos componentes tiene cada fila. `np.sqrt(n)` es la raíz cuadrada.',
    example: `import numpy as np

A = np.array([[1, 0, 2], [3, 1, 1]])
B = np.array([[2, 1, 0], [0, 0, 1], [1, 1, 1], [4, 0, 0]])
print("forma de A:", A.shape, "y de B:", B.shape)
print("componentes de cada fila:", A.shape[1])

T = A @ B.T
print("tabla de productos escalares:")
print(T)
print("forma de la tabla:", T.shape)
print("fila 1 con fila 2:", T[1, 2], "=", A[1] @ B[2])
print("la raíz de 9:", np.sqrt(9))
`,
    experiments: [
      'Escribe `print(A @ B)`: da un error, porque `A` tiene 3 columnas y `B` tiene 4 filas. Con `B.T` sí encajan.',
      'Escribe `print((B @ A.T).shape)`: la tabla sale de 4 filas y 2 columnas, la traspuesta de la anterior.',
      'Cambia una fila de `B` y mira qué columna de la tabla cambia: la de ese objeto.',
      'Escribe `print(T / np.sqrt(A.shape[1]))`: divide cada puntuación entre la raíz del número de componentes.',
    ],
    task: {
      prompt:
        'Cada fila de `gustos` es una persona y cada fila de `peliculas`, una película, con tres características cada una. Guarda en `afinidad` la tabla con el producto escalar de cada persona con cada película (una fila por persona) y en `forma` la forma de esa tabla.',
      starter: `import numpy as np

gustos = np.array([[2, 0, 1], [1, 3, 0]])
peliculas = np.array([[1, 1, 1], [0, 2, 0], [3, 0, 1], [1, 0, 0], [0, 1, 2]])
# Guarda en afinidad el producto escalar de cada persona con cada película y en forma la forma de esa tabla
afinidad = None
forma = None
`,
      checks: `_g = np.array([[2, 0, 1], [1, 3, 0]])
_p = np.array([[1, 1, 1], [0, 2, 0], [3, 0, 1], [1, 0, 0], [0, 1, 2]])
_a = isinstance(afinidad, np.ndarray) and afinidad.shape == (2, 5) and np.issubdtype(afinidad.dtype, np.number)
_t = isinstance(afinidad, np.ndarray) and afinidad.shape == (5, 2)
_f = isinstance(forma, tuple)
check(_a or not _t, "\`afinidad\` sale con una fila por película: está traspuesta. Tiene que tener una fila por persona y una columna por película.")
check(_a or _t, "\`afinidad\` tiene que ser un array de NumPy de 2 filas y 5 columnas: una fila por persona y una columna por película.")
check((not _a) or bool(np.allclose(afinidad, _g @ _p.T)), "\`afinidad\` tiene que tener en cada posición el producto escalar de una persona con una película: \`gustos\` por la traspuesta de \`peliculas\`.")
check(_f and tuple(forma) == (2, 5), "\`forma\` tiene que ser la pareja de filas y columnas de \`afinidad\`, que da \`.shape\`.")
`,
      reference: `import numpy as np

gustos = np.array([[2, 0, 1], [1, 3, 0]])
peliculas = np.array([[1, 1, 1], [0, 2, 0], [3, 0, 1], [1, 0, 0], [0, 1, 2]])
afinidad = gustos @ peliculas.T
forma = afinidad.shape
`,
    },
  },
  {
    id: 'atencion.cal.2',
    title: '`axis` y `keepdims=True`: normalizar cada fila',
    explain:
      '`T.sum(axis=1)` suma **cada fila** (a lo largo de las columnas) y devuelve un número por fila; `T.sum(axis=0)` suma cada columna. Para dividir una tabla entre esas sumas hay un problema: un array de 3 números no se puede alinear con las filas de una tabla de 3 filas y 4 columnas, porque NumPy alinea por la última columna.\n\n`keepdims=True` lo arregla: la suma sale como una **columna** de 3 filas y 1 columna, y `T / T.sum(axis=1, keepdims=True)` divide cada fila entre su propia suma. El resultado tiene la suma de cada fila igual a 1, pero no la de cada columna.\n\n`np.exp(x)` es el exponencial de cada número: siempre positivo. Exponenciar y luego normalizar cada fila es el **softmax** por filas.',
    example: `import numpy as np

V = np.array([[1, 3, 4, 2], [5, 5, 0, 0], [2, 2, 2, 2]])
print("suma de cada fila:", V.sum(axis=1))
print("suma de cada columna:", V.sum(axis=0))
print("con keepdims:")
print(V.sum(axis=1, keepdims=True))

R = V / V.sum(axis=1, keepdims=True)
print(R)
print("cada fila suma:", R.sum(axis=1))
print("cada columna suma:", R.sum(axis=0))

E = np.exp(np.array([[0.0, 1.0], [2.0, 2.0]]))
print("exponenciales:", E)
print("softmax por filas:", E / E.sum(axis=1, keepdims=True))
`,
    experiments: [
      'Quita `keepdims=True` en la división de `R` y ejecuta: da un error de formas, porque 3 sumas no se alinean con 4 columnas.',
      'Cambia `axis=1` por `axis=0` en la división: ahora suman 1 las columnas, no las filas.',
      'Escribe `print(V.sum(axis=1, keepdims=True).shape)`: sale de 3 filas y 1 columna.',
      'Escribe `print(np.exp(0))`, `print(np.exp(1))` y `print(np.exp(-5))`: nunca sale cero ni un número negativo.',
    ],
    task: {
      prompt:
        'Cada fila de `visitas` es una tienda y cada columna, un día. Guarda en `reparto` cada fila dividida entre su propia suma (qué fracción de sus visitas cae cada día) y en `suman_uno` si todas las filas de `reparto` suman 1, comparado con `np.allclose` (un solo `True` o `False`).',
      starter: `import numpy as np

visitas = np.array([[10, 30, 60], [5, 5, 15], [8, 0, 2], [20, 20, 10]])
# Guarda en reparto cada fila de visitas entre su suma y en suman_uno si todas las filas de reparto suman 1 (con np.allclose)
reparto = None
suman_uno = None
`,
      checks: `_v = np.array([[10, 30, 60], [5, 5, 15], [8, 0, 2], [20, 20, 10]], dtype=float)
_r = isinstance(reparto, np.ndarray) and reparto.shape == (4, 3) and np.issubdtype(reparto.dtype, np.number)
_b = isinstance(suman_uno, (bool, np.bool_))
_rowok = _r and bool(np.allclose(reparto, _v / _v.sum(axis=1, keepdims=True)))
_colok = _r and bool(np.allclose(reparto, _v / _v.sum(axis=0, keepdims=True)))
check(_r, "\`reparto\` tiene que ser un array de NumPy de 4 filas y 3 columnas: cada fila de \`visitas\` entre su suma.")
check((not _r) or not _colok, "\`reparto\` divide cada columna entre la suya. Hay que dividir cada fila entre la suma de esa fila: \`axis=1\`.")
check((not _r) or _rowok or _colok, "\`reparto\` tiene que ser \`visitas\` con cada fila dividida entre la suma de esa misma fila.")
check(_b, "\`suman_uno\` tiene que ser un solo \`True\` o \`False\`: el resultado de \`np.allclose\`.")
check((not _b) or bool(suman_uno), "\`suman_uno\` vale \`False\`: compara las sumas de las filas de \`reparto\` con 1 usando \`np.allclose\`.")
`,
      reference: `import numpy as np

visitas = np.array([[10, 30, 60], [5, 5, 15], [8, 0, 2], [20, 20, 10]])
reparto = visitas / visitas.sum(axis=1, keepdims=True)
suman_uno = np.allclose(reparto.sum(axis=1), 1)
`,
    },
  },
  {
    id: 'atencion.cal.3',
    title: '`np.triu` y `np.where`: tapar una parte de la tabla',
    explain:
      '`np.ones((n, n), dtype=bool)` es una tabla de `n` filas y `n` columnas llena de `True`. `np.triu(t, k=1)` conserva lo que queda **por encima de la diagonal** y pone `False` en el resto; con `k=0` conservaría también la diagonal. El resultado es una **máscara**: una tabla de `True` y `False` con la forma de la tabla que quieres tapar.\n\n`np.where(mascara, a, b)` toma `a` donde la máscara es `True` y `b` donde es `False`, posición a posición. Con `a = -np.inf` se tapa lo que sobra, y como `np.exp(-np.inf)` vale 0, un softmax ignora esas posiciones.\n\nUn aviso: si una fila entera vale `-np.inf`, su softmax divide 0 entre 0 y sale `nan`. Hay que dejar al menos una posición sin tapar en cada fila.',
    example: `import numpy as np

M = np.triu(np.ones((4, 4), dtype=bool), k=1)
print("máscara por encima de la diagonal:")
print(M)
print("cuántas posiciones tapa:", M.sum())

T = np.arange(16).reshape(4, 4)
print("la tabla:")
print(T)
print("tapada con -inf:")
print(np.where(M, -np.inf, T))
print("el exponencial de -inf:", np.exp(-np.inf))

print("con k=0 se tapa también la diagonal:", np.triu(np.ones((4, 4), dtype=bool), k=0).sum())
`,
    experiments: [
      'Cambia `k=1` por `k=0` y mira la máscara: la diagonal pasa a `True`. Con `k=2`, la primera diagonal de encima ya no se tapa.',
      'Cambia `-np.inf` por `0` en el `np.where`: las posiciones tapadas valen 0 en vez de `-inf`.',
      'Escribe `print(np.where(M, 1, 0))`: una tabla de unos y ceros que dibuja la máscara.',
      'Escribe `print(np.tril(np.ones((4, 4), dtype=bool)))`: la diagonal y todo lo que queda por debajo, que es lo contrario de `M`.',
    ],
    task: {
      prompt:
        'Guarda en `futuro` una máscara que valga `True` en las posiciones **por encima de la diagonal** de una tabla de 5 filas y 5 columnas, y en `limpia` la tabla `puntos` con esas posiciones sustituidas por 0.',
      starter: `import numpy as np

puntos = np.arange(1, 26).reshape(5, 5)
# Guarda en futuro la máscara (True por encima de la diagonal) y en limpia puntos con esas posiciones a 0
futuro = None
limpia = None
`,
      checks: `_pts = np.arange(1, 26).reshape(5, 5)
_ref = np.triu(np.ones((5, 5), dtype=bool), k=1)
_m = isinstance(futuro, np.ndarray) and futuro.shape == (5, 5) and futuro.dtype == bool
_l = isinstance(limpia, np.ndarray) and limpia.shape == (5, 5) and np.issubdtype(limpia.dtype, np.number)
check(_m, "\`futuro\` tiene que ser un array de NumPy de 5 filas y 5 columnas con \`True\` y \`False\`, no con unos y ceros.")
check((not _m) or int(futuro.sum()) != 15, "\`futuro\` incluye la diagonal: la diagonal principal no se tapa, y con \`np.triu\` eso se pide con \`k=1\`.")
check((not _m) or int(futuro.sum()) == 15 or bool(np.array_equal(futuro, _ref)), "\`futuro\` tiene que ser \`True\` solo por encima de la diagonal: 10 posiciones.")
check(_l, "\`limpia\` tiene que ser un array de NumPy de 5 filas y 5 columnas: \`puntos\` con las posiciones tapadas.")
check((not _l) or bool(np.allclose(limpia, np.where(_ref, 0, _pts))), "\`limpia\` tiene que valer 0 por encima de la diagonal y lo mismo que \`puntos\` en el resto.")
`,
      reference: `import numpy as np

puntos = np.arange(1, 26).reshape(5, 5)
futuro = np.triu(np.ones((5, 5), dtype=bool), k=1)
limpia = np.where(futuro, 0, puntos)
`,
    },
  },
  {
    id: 'atencion.cal.4',
    title: '`argmax` con `axis`: la mejor columna de cada fila',
    explain:
      '`T.argmax()` sin más da la posición del mayor número de toda la tabla, aplanada. Con `axis=1` busca **en cada fila** y devuelve un número por fila: la columna donde está el mayor. Con `axis=0` busca en cada columna y devuelve la fila.\n\n`T.max(axis=1)` usa el mismo eje pero devuelve el **valor** del mayor en vez de su posición. Las posiciones empiezan en 0. Si hay un empate, `argmax` devuelve la primera posición.\n\nEn una tabla donde cada fila reparte atención entre columnas, `argmax(axis=1)` dice a quién mira más cada fila, y `T.sum(axis=0)` dice cuánta atención recibe cada columna.',
    example: `import numpy as np

T = np.array([[0.1, 0.7, 0.2], [0.5, 0.3, 0.2], [0.2, 0.2, 0.6]])
print("columna mayor de cada fila:", T.argmax(axis=1))
print("valor mayor de cada fila:", T.max(axis=1))
print("fila mayor de cada columna:", T.argmax(axis=0))
print("posición del mayor de todos, aplanada:", T.argmax())
print("lo que suma cada columna:", T.sum(axis=0))
print("empate:", np.array([3, 5, 5, 1]).argmax())
`,
    experiments: [
      'Cambia `axis=1` por `axis=0` en la primera línea: sale una posición por columna, y significa otra cosa.',
      'Escribe `print(T.argmax(axis=1).shape)`: un número por fila.',
      'Escribe `print(T.argmin(axis=1))`: la posición del menor de cada fila.',
      'Cambia el primer `0.7` por `0.2`: en la primera fila empatan las dos últimas posiciones y gana la primera de las dos.',
    ],
    task: {
      prompt:
        '`notas` tiene una fila por alumno y una columna por examen. Guarda en `mejor_examen` la posición del examen en que sacó más cada alumno (un número por alumno, contando desde 0) y en `media_examen` la nota media de cada examen (un número por examen).',
      starter: `import numpy as np

notas = np.array([[6, 9, 7, 5], [8, 4, 6, 10], [3, 5, 9, 7]])
# Guarda en mejor_examen la posición del mejor examen de cada alumno y en media_examen la nota media de cada examen
mejor_examen = None
media_examen = None
`,
      checks: `_n = np.array([[6, 9, 7, 5], [8, 4, 6, 10], [3, 5, 9, 7]], dtype=float)
_m = isinstance(mejor_examen, np.ndarray) and mejor_examen.shape == (3,) and np.issubdtype(mejor_examen.dtype, np.integer)
_mc = isinstance(mejor_examen, np.ndarray) and mejor_examen.shape == (4,)
_e = isinstance(media_examen, np.ndarray) and media_examen.shape == (4,) and np.issubdtype(media_examen.dtype, np.number)
check(_m or not _mc, "\`mejor_examen\` tiene 4 números: busca por columnas. La mejor posición de cada alumno se busca a lo largo de su fila: \`axis=1\`.")
check(_m or _mc, "\`mejor_examen\` tiene que ser un array de NumPy con 3 números enteros: uno por alumno.")
check((not _m) or bool(np.array_equal(mejor_examen, _n.argmax(axis=1))), "\`mejor_examen\` tiene que ser, para cada alumno, la posición de su nota mayor, contando desde 0.")
check(_e, "\`media_examen\` tiene que ser un array de NumPy con 4 números: la media de cada columna de \`notas\`, una por examen.")
check((not _e) or bool(np.allclose(media_examen, _n.mean(axis=0))), "\`media_examen\` tiene que ser la media de cada columna de \`notas\`, no la de cada alumno.")
`,
      reference: `import numpy as np

notas = np.array([[6, 9, 7, 5], [8, 4, 6, 10], [3, 5, 9, 7]])
mejor_examen = notas.argmax(axis=1)
media_examen = notas.mean(axis=0)
`,
    },
  },
];
