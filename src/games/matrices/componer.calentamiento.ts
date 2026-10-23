import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Componer: lo nuevo de su ejercicio «Programar». */
export const componerWarmup: WarmupStep[] = [
  {
    id: 'componer.cal.1',
    title: '`A @ B` entre matrices: formas y orden',
    explain:
      '`A @ B` entre dos matrices es su **producto**: cada casilla sale de una fila de `A` multiplicada por una columna de `B`. Para poder hacerlo, `A` tiene que tener tantas columnas como filas tiene `B`: `(a, b) @ (b, c)` da una matriz de forma `(a, c)`.\n\nEl **orden importa**: `A @ B` y `B @ A` casi nunca coinciden, y a veces uno de los dos ni siquiera se puede calcular. Se lee de derecha a izquierda: en `A @ B` actúa primero `B`. Se pueden encadenar: en `A @ B @ C` actúa primero `C`, luego `B` y al final `A`.\n\nNo lo confundas con `A * B`, que multiplica casilla a casilla y pide dos matrices de la misma forma.',
    example: `import numpy as np

P = np.array([[1, 2, 0],
              [0, 1, 3]])
Q = np.array([[1, 0],
              [2, 1],
              [0, 4]])
print("forma de P:", P.shape, "forma de Q:", Q.shape)
print("P @ Q:")
print(P @ Q)
print("forma de Q @ P:", (Q @ P).shape)

M = np.array([[1, 1], [0, 1]])
N = np.array([[2, 0], [0, 3]])
print("M @ N:", (M @ N).tolist())
print("M * N:", (M * N).tolist())
`,
    experiments: [
      'Cambia `Q` por `np.array([[1, 0], [2, 1]])`, de 2 filas: `P @ Q` se para con un error, porque `P` tiene 3 columnas y `Q`, solo 2 filas.',
      'Escribe `print((N @ M).tolist())` y compáralo con `M @ N`: no coinciden.',
      'Escribe `print(P * Q)`: Python se para, porque `P` y `Q` no tienen la misma forma. `*` no es el producto de matrices.',
    ],
    task: {
      prompt:
        '`F` tiene 2 filas y 3 columnas, y `G`, 3 filas y 2 columnas. Guarda en `FG` el producto de `F` por `G`, y en `GF` el de `G` por `F`. Fíjate en la forma que sale en cada caso.',
      starter: `import numpy as np

F = np.array([[1, 0, 2],
              [0, 3, 1]])
G = np.array([[2, 1],
              [0, 1],
              [1, 0]])
# Guarda en FG el producto de F por G, y en GF el de G por F
FG = None
GF = None
`,
      checks: `def _mat(a, forma):
    return isinstance(a, np.ndarray) and a.shape == forma and np.issubdtype(a.dtype, np.number)

check(not (_mat(FG, (3, 3)) and _mat(GF, (2, 2))), "\`FG\` y \`GF\` están al revés: \`FG\` es el producto de \`F\` por \`G\`, y tiene que ser una matriz de 2 filas y 2 columnas, y \`GF\`, de 3 por 3.")
check(_mat(FG, (2, 2)), "\`FG\` tiene que ser un array de NumPy de 2 filas y 2 columnas: el producto de \`F\`, de forma (2, 3), por \`G\`, de forma (3, 2).")
check((not _mat(FG, (2, 2))) or np.array_equal(FG, [[4, 1], [1, 3]]), "\`FG\` tiene que valer (4, 1) en la primera fila y (1, 3) en la segunda: cada casilla es una fila de \`F\` por una columna de \`G\`.")
check(_mat(GF, (3, 3)), "\`GF\` tiene que ser un array de NumPy de 3 filas y 3 columnas: el producto de \`G\`, de forma (3, 2), por \`F\`, de forma (2, 3).")
check((not _mat(GF, (3, 3))) or np.array_equal(GF, [[2, 3, 5], [0, 3, 1], [1, 0, 2]]), "\`GF\` no tiene los valores esperados: su primera fila tiene que ser (2, 3, 5).")
`,
      reference: `import numpy as np

F = np.array([[1, 0, 2],
              [0, 3, 1]])
G = np.array([[2, 1],
              [0, 1],
              [1, 0]])
FG = F @ G
GF = G @ F
`,
    },
  },
  {
    id: 'componer.cal.2',
    title: '`np.eye(n)` como punto de partida de un producto',
    explain:
      'La identidad `np.eye(n)` no cambia nada al multiplicar: `np.eye(2) @ M` da `M`. Por eso es el punto de partida natural de un bucle que va multiplicando: antes de la primera vuelta, el resultado es «no hacer nada».\n\nEl patrón es `M = np.eye(2)` y, dentro del bucle, `M = M @ A`: cada vuelta suma una aplicación más de `A`. Sus números salen como decimales (`1.` y `0.`), y para las cuentas da igual.\n\nCuidado con `A ** 3`: el `**` eleva **casilla a casilla**, no multiplica la matriz por sí misma tres veces.',
    example: `import numpy as np

A = np.array([[1, 1],
              [0, 2]])
M = np.eye(2)
for vuelta in range(3):
    M = M @ A
    print("después de", vuelta + 1, "vueltas:")
    print(M)
print("A ** 3, casilla a casilla:")
print(A ** 3)
`,
    experiments: [
      'Cambia `range(3)` por `range(1)`: con una sola vuelta sale la propia `A`.',
      'Cambia `np.eye(2)` por `np.ones((2, 2))`, una matriz de unos: el resultado cambia, porque no es la identidad y ya no empieza «sin hacer nada».',
      'Cambia `np.eye(2)` por `np.eye(3)`: `M @ A` se para con un error, porque `M` tendría 3 columnas y `A`, 2 filas.',
    ],
    task: {
      prompt:
        'Guarda en `G4` la matriz que resulta de aplicar `G` cuatro veces seguidas. Hazlo con un bucle que parta de la identidad.',
      starter: `import numpy as np

G = np.array([[2, 1],
              [0, 1]])
# Guarda en G4 el resultado de aplicar G cuatro veces seguidas, con un bucle desde la identidad
G4 = None
`,
      checks: `_ok = isinstance(G4, np.ndarray) and G4.shape == (2, 2) and np.issubdtype(G4.dtype, np.number)
check(_ok, "\`G4\` tiene que ser un array de NumPy de 2 filas y 2 columnas.")
check((not _ok) or not np.allclose(G4, [[16, 1], [0, 1]]), "\`G4\` es \`G\` elevada casilla a casilla, con \`**\`: cada número sale elevado por separado. Para aplicar la matriz cuatro veces hay que multiplicarla por sí misma en un bucle.")
check((not _ok) or not np.allclose(G4, [[8, 7], [0, 1]]), "\`G4\` es el resultado de solo tres vueltas: el bucle tiene que dar cuatro.")
check((not _ok) or np.allclose(G4, [[16, 15], [0, 1]]), "\`G4\` tiene que valer (16, 15) en la primera fila y (0, 1) en la segunda: \`G\` aplicada cuatro veces seguidas.")
`,
      reference: `import numpy as np

G = np.array([[2, 1],
              [0, 1]])
G4 = np.eye(2)
for vuelta in range(4):
    G4 = G4 @ G
`,
    },
  },
  {
    id: 'componer.cal.3',
    title: '`np.allclose(A, B)`: comparar matrices',
    explain:
      '`A == B` entre arrays compara casilla a casilla y devuelve **otro array** de `True` y `False`, no una sola respuesta. Para una única respuesta a «¿son iguales?», usa `np.allclose(A, B)`: devuelve un solo `True` o `False`, y es `True` cuando **todas** las casillas coinciden.\n\n`np.allclose` además perdona los pequeños errores de redondeo de los decimales, que aparecen al operar: en el ordenador, `0.1 + 0.2` no vale exactamente `0.3`.\n\nPara contar en cuántas casillas coinciden dos arrays: `np.sum(A == B)`, porque cada `True` cuenta como 1.',
    example: `import numpy as np

P = np.array([[1, 2], [3, 4]])
Q = np.array([[1, 2], [3, 5]])
print("P == Q:")
print(P == Q)
print("casillas iguales:", np.sum(P == Q))
print("allclose(P, Q):", np.allclose(P, Q))
print("allclose(P, P):", np.allclose(P, P))

x = np.array([0.1 + 0.2])
print("x == 0.3:", x == 0.3)
print("allclose(x, 0.3):", np.allclose(x, 0.3))
`,
    experiments: [
      'Cambia el 5 de `Q` por un 4: `P == Q` sale con todo `True` y `np.allclose(P, Q)` da `True`.',
      'Escribe `if P == Q: print("iguales")`: Python se para con un error, porque `P == Q` es un array de varios valores y un `if` necesita uno solo.',
      'Escribe `print(np.allclose(P, Q + 0.00000001))`: una diferencia minúscula se perdona.',
    ],
    task: {
      prompt:
        '`S` es un giro y `T` es su traspuesta: `S @ T` tiene que ser la identidad, pero con decimales puede salir con errores de redondeo. Guarda en `es_identidad` un solo `True` o `False` que diga si `S @ T` es la identidad (`np.eye(2)`), y en `casillas_iguales` en cuántas casillas coinciden `S` y `T`.',
      starter: `import numpy as np

S = np.array([[0.6, -0.8],
              [0.8, 0.6]])
T = S.T
# Guarda en es_identidad si S @ T es la identidad, y en casillas_iguales cuántas casillas coinciden S y T
es_identidad = None
casillas_iguales = None
`,
      checks: `_b = isinstance(es_identidad, (bool, np.bool_))
check(_b, "\`es_identidad\` tiene que ser un solo \`True\` o \`False\`. La comparación con \`==\` da una matriz de valores; \`np.allclose\` da uno solo.")
check((not _b) or bool(es_identidad), "\`es_identidad\` vale \`False\`, pero \`S @ T\` es la identidad salvo redondeo. Compara con una función que perdone los errores minúsculos.")
_n = isinstance(casillas_iguales, (int, np.integer)) and not isinstance(casillas_iguales, (bool, np.bool_))
check(_n, "\`casillas_iguales\` tiene que ser un número entero: cuántas casillas coinciden, no cuáles.")
check((not _n) or casillas_iguales == 2, "\`casillas_iguales\` tiene que valer 2: \`S\` y \`T\` solo coinciden en las dos casillas de la diagonal.")
`,
      reference: `import numpy as np

S = np.array([[0.6, -0.8],
              [0.8, 0.6]])
T = S.T
es_identidad = np.allclose(S @ T, np.eye(2))
casillas_iguales = np.sum(S == T)
`,
    },
  },
];
