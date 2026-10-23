import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Matriz por vector: lo nuevo de su ejercicio «Programar». */
export const matrizVectorWarmup: WarmupStep[] = [
  {
    id: 'matriz-vector.cal.1',
    title: '`np.zeros` y un bucle que acumula',
    explain:
      '`np.zeros(n)` crea un vector de `n` ceros (salen escritos como `0.`, porque son decimales). Sirve de **acumulador**: un vector que empieza en cero y al que un bucle va sumando cosas.\n\nPara saber cuántos ceros hacen falta y cuántas vueltas dar, mira la forma de la matriz: `T.shape[0]` es su número de filas y `T.shape[1]`, el de columnas. Y `range(len(T))` recorre las posiciones `0, 1, 2…` de las filas, para usar `T[k]` dentro del bucle.\n\nEl acumulador se crea **antes** del bucle y se actualiza dentro: `total = total + …`. Si lo creas dentro, se vacía en cada vuelta.',
    example: `import numpy as np

T = np.array([[1, 2, 3],
              [4, 5, 6]])
print("filas:", T.shape[0], "columnas:", T.shape[1])

total = np.zeros(T.shape[1])
for k in range(len(T)):
    print("vuelta", k, "suma la fila", T[k])
    total = total + T[k]
print("suma de las filas:", total)
`,
    experiments: [
      'Cambia `total + T[k]` por `total + 10 * T[k]`: ¿qué le pasa al resultado?',
      'Mueve la línea `total = np.zeros(...)` dentro del bucle, justo debajo del `for`: el resultado solo recoge la última fila, porque el acumulador se vacía en cada vuelta.',
      'Cambia `T.shape[1]` por `T.shape[0]`: `total` tiene ahora 2 números y cada fila, 3, así que Python se para con un error. Lee qué dice.',
      'Añade una tercera fila a `T` y vuelve a ejecutar: el bucle da una vuelta más sin que toques nada más, porque `len(T)` cambia solo.',
    ],
    task: {
      prompt:
        'Cada fila de `recetas` es una receta y cada columna, los gramos de un ingrediente. `veces[k]` es cuántas veces se prepara la receta `k`. Con un bucle, guarda en `compra` el vector con los gramos que hay que comprar de cada ingrediente en total: cada receta multiplicada por sus veces, y todo sumado.',
      starter: `import numpy as np

# Cada fila es una receta; las columnas, los gramos de 3 ingredientes
recetas = np.array([[100, 0, 50],
                    [20, 30, 0],
                    [10, 10, 40]])
veces = np.array([2, 1, 3])
# Con un bucle, guarda en compra los gramos totales de cada ingrediente
compra = None
`,
      checks: `_ok = isinstance(compra, np.ndarray) and compra.shape == (3,) and np.issubdtype(compra.dtype, np.number)
check(_ok, "\`compra\` tiene que ser un array de NumPy con 3 números: los gramos totales de cada ingrediente.")
check((not _ok) or not np.allclose(compra, [130, 40, 90]), "\`compra\` es la suma de las recetas tal cual, una sola vez cada una. Cada receta \`k\` hay que multiplicarla por \`veces[k]\` antes de sumarla.")
check((not _ok) or not np.allclose(compra, [350, 70, 150]), "\`compra\` tiene un número por receta y no por ingrediente: has sumado cada fila por separado. Hay que sumar las recetas enteras, para que cada posición sea un ingrediente.")
check((not _ok) or np.allclose(compra, [250, 60, 220]), "\`compra\` tiene que valer (250, 60, 220): el primer ingrediente suma 2 veces 100, 1 vez 20 y 3 veces 10.")
`,
      reference: `import numpy as np

recetas = np.array([[100, 0, 50],
                    [20, 30, 0],
                    [10, 10, 40]])
veces = np.array([2, 1, 3])
compra = np.zeros(3)
for k in range(len(recetas)):
    compra = compra + veces[k] * recetas[k]
`,
    },
  },
  {
    id: 'matriz-vector.cal.2',
    title: 'Una matriz y un vector: `*`, `+` y `@`',
    explain:
      'Con una matriz `A` de 2 filas y 3 columnas y un vector `v` de 3 componentes, cada operador hace algo distinto:\n\n- `A * v` multiplica **casilla a casilla**: NumPy repite `v` en cada fila y multiplica. El resultado sigue siendo una matriz de 2 filas y 3 columnas. Esto se llama **difusión**.\n- `A + v` es lo mismo, sumando: `v` se suma a cada fila.\n- `A @ v` es el producto de matriz por vector: da un vector de 2 componentes, una por fila.\n\nLa difusión solo funciona si el vector tiene tantos números como columnas tiene la matriz.',
    example: `import numpy as np

A = np.array([[1, 2, 3],
              [4, 5, 6]])
v = np.array([10, 0, 1])
print("A * v:")
print(A * v)
print("A + v:")
print(A + v)
print("A @ v:", A @ v)
print("suma de cada fila de A * v:", np.sum(A * v, axis=1))
`,
    experiments: [
      'Compara las dos últimas líneas de la salida: sumar cada fila de `A * v` da lo mismo que `A @ v`. Un producto de fila por vector es multiplicar casilla a casilla y sumar.',
      'Cambia `v` por `np.array([10, 0])`, de 2 números: `A * v` y `A + v` se paran con un error, porque `A` tiene 3 columnas.',
      'Prueba `print(A * np.array([[10], [100]]))`: un vector puesto como columna (2 filas y 1 columna) se reparte por filas, y cada fila se multiplica por un solo número.',
    ],
    task: {
      prompt:
        'Cada fila de `notas` es un alumno y cada columna, un examen. Guarda en `ponderadas` la matriz con cada examen multiplicado por su peso (`pesos` tiene un número por examen), sin sumar nada. Guarda en `con_extra` la matriz de `notas` con el vector `extra` sumado a cada alumno.',
      starter: `import numpy as np

# Filas: 3 alumnos. Columnas: 2 exámenes
notas = np.array([[6, 8],
                  [5, 9],
                  [7, 4]])
pesos = np.array([2, 3])
extra = np.array([1, -1])
# Guarda en ponderadas cada examen por su peso, y en con_extra las notas con extra sumado a cada fila
ponderadas = None
con_extra = None
`,
      checks: `def _mat(a):
    return isinstance(a, np.ndarray) and a.shape == (3, 2) and np.issubdtype(a.dtype, np.number)

check(_mat(ponderadas) or not (isinstance(ponderadas, np.ndarray) and ponderadas.shape == (3,)), "\`ponderadas\` es un vector de 3 números: has usado \`@\`, que multiplica y suma. Aquí se pide multiplicar casilla a casilla y conservar las 3 filas y 2 columnas.")
check(_mat(ponderadas), "\`ponderadas\` tiene que ser un array de NumPy de 3 filas y 2 columnas.")
check((not _mat(ponderadas)) or np.array_equal(ponderadas, [[12, 24], [10, 27], [14, 12]]), "\`ponderadas\` no tiene los valores pedidos: la columna 0 va multiplicada por \`pesos[0]\` y la columna 1, por \`pesos[1]\`.")
check(_mat(con_extra), "\`con_extra\` tiene que ser un array de NumPy de 3 filas y 2 columnas.")
check((not _mat(con_extra)) or np.array_equal(con_extra, [[7, 7], [6, 8], [8, 3]]), "\`con_extra\` tiene que valer (7, 7), (6, 8) y (8, 3) por filas: a cada fila de \`notas\` se le suma \`extra\`.")
`,
      reference: `import numpy as np

notas = np.array([[6, 8],
                  [5, 9],
                  [7, 4]])
pesos = np.array([2, 3])
extra = np.array([1, -1])
ponderadas = notas * pesos
con_extra = notas + extra
`,
    },
  },
  {
    id: 'matriz-vector.cal.3',
    title: '`M.T` y `X @ M.T`: muchos vectores a la vez',
    explain:
      'Cuando hay muchos vectores se guardan en una matriz, **uno por fila**. Para transformarlos todos de una vez con una matriz `M` se escribe `X @ M.T`, donde `M.T` es la traspuesta de `M`: sus filas pasan a ser columnas.\n\nLa razón: en `M @ x`, el vector `x` entra por la derecha como una columna. Las filas de `X` entran por la izquierda, y para que cada una se combine con las filas de `M` hay que trasponerla.\n\nPara no perderte, mira las formas con `.shape`: `(a, b) @ (b, c)` da `(a, c)`. Los dos números de en medio tienen que coincidir. El resultado trae una fila por cada vector de `X`.',
    example: `import numpy as np

M = np.array([[3, 1],
              [0, 2]])
X = np.array([[1, 0],
              [2, 1],
              [0, 5]])
print("M.T:")
print(M.T)
Y = X @ M.T
print("Y, una fila por vector:")
print(Y)
print("M @ X[1] =", M @ X[1])
print("fila 1 de Y =", Y[1])
`,
    experiments: [
      'Cambia `X @ M.T` por `X @ M`: no da error, porque `M` es cuadrada, pero sale otra matriz. Compara su fila 1 con `M @ X[1]`: ya no coincide.',
      'Añade `print(X.shape, M.T.shape, Y.shape)` y mira los números de en medio de las dos primeras formas: son iguales, y los de los extremos dan la forma de `Y`.',
      'Cambia `M` por `np.array([[1, 2, 3], [0, 1, 0]])`, de 2 filas y 3 columnas: `X @ M.T` se para con un error. ¿Cuántas columnas tendría que tener `X`?',
    ],
    task: {
      prompt:
        'Cada fila de `puntos` es un punto de 3 componentes. `Q` es una matriz de 2 filas y 3 columnas que lleva un punto de 3 componentes a uno de 2. Guarda en `QT` la traspuesta de `Q` y en `planos` los resultados de los cuatro puntos a la vez, una fila por punto.',
      starter: `import numpy as np

Q = np.array([[1, 0, 2],
              [0, 1, -1]])
# Un punto por fila
puntos = np.array([[1, 2, 3],
                   [0, 0, 1],
                   [2, 3, 0],
                   [1, 1, 1]])
# Guarda en QT la traspuesta de Q, y en planos los cuatro resultados, una fila por punto
QT = None
planos = None
`,
      checks: `def _mat(a, forma):
    return isinstance(a, np.ndarray) and a.shape == forma and np.issubdtype(a.dtype, np.number)

check(_mat(QT, (3, 2)), "\`QT\` tiene que ser un array de NumPy de 3 filas y 2 columnas: la traspuesta de \`Q\`, que cambia filas por columnas.")
check((not _mat(QT, (3, 2))) or np.array_equal(QT, [[1, 0], [0, 1], [2, -1]]), "\`QT\` tiene que tener como columnas las filas de \`Q\`: su primera columna es (1, 0, 2).")
check(not _mat(planos, (2, 4)), "\`planos\` tiene 2 filas y 4 columnas: ha quedado un punto por columna. Se pide una fila por punto, así que tiene que tener 4 filas y 2 columnas.")
check(_mat(planos, (4, 2)), "\`planos\` tiene que ser un array de NumPy de 4 filas y 2 columnas: un resultado de 2 componentes por cada uno de los 4 puntos.")
check((not _mat(planos, (4, 2))) or np.array_equal(planos, [[7, -1], [2, -1], [2, 3], [3, 0]]), "\`planos\` no tiene los valores esperados: la primera fila es el resultado del primer punto, (1, 2, 3), y vale (7, -1).")
`,
      reference: `import numpy as np

Q = np.array([[1, 0, 2],
              [0, 1, -1]])
puntos = np.array([[1, 2, 3],
                   [0, 0, 1],
                   [2, 3, 0],
                   [1, 1, 1]])
QT = Q.T
planos = puntos @ QT
`,
    },
  },
];
