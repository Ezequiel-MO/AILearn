import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Rango bajo y LoRA: lo nuevo de su ejercicio «Programar». */
export const rangoBajoWarmup: WarmupStep[] = [
  {
    id: 'rango-bajo.cal.1',
    title: '`np.outer`: una columna por una fila',
    explain:
      '`np.outer(a, b)` multiplica **cada número de `a` por cada número de `b`** y los coloca en una tabla: en la fila $i$ y la columna $j$ queda `a[i] * b[j]`. Con `a` de 3 números y `b` de 4 sale una tabla de 3 filas y 4 columnas.\n\nNo es lo mismo que `a * b`, que multiplica **posición a posición** y exige el mismo tamaño. Y `np.outer(b, a)` es la traspuesta de `np.outer(a, b)`.\n\nLa tabla que sale tiene un rasgo: cada fila es la anterior multiplicada por un número. Solo hay una «columna» y una «fila» de información, y por eso su rango es 1: `np.linalg.matrix_rank` lo confirma.',
    example: `import numpy as np

precio = np.array([2, 5, 8])
cantidad = np.array([1, 10, 100, 1000])

tabla = np.outer(precio, cantidad)
print(tabla)
print("forma:", tabla.shape)
print("fila 1 entre fila 0:", tabla[1] / tabla[0])
print("rango:", np.linalg.matrix_rank(tabla))

print("a * a, posición a posición:", precio * precio)
print("la traspuesta:", np.outer(cantidad, precio).shape)
`,
    experiments: [
      'Cambia `cantidad` por `np.array([1, 10, 100])`: la tabla pasa a ser de 3 por 3, y el rango sigue siendo 1.',
      'Escribe `print(precio * cantidad)`: da un error, porque `precio` tiene 3 números y `cantidad` tiene 4, y el producto posición a posición los necesita iguales.',
      'Escribe `print(tabla[:, 0])` y `print(tabla[:, 1])`: dos columnas, una múltiplo de la otra.',
      'Escribe `print(np.outer(precio, cantidad) @ np.array([1, 0, 0, 0]))`: una matriz de rango 1 aplicada a un vector da siempre un múltiplo de `precio`.',
    ],
    task: {
      prompt:
        '`alturas` tiene 3 números y `anchuras` tiene 2. Guarda en `rectangulos` la tabla de 3 filas y 2 columnas con el área de cada combinación (la altura de la fila por la anchura de la columna) y en `total` la suma de todos sus números.',
      starter: `import numpy as np

alturas = np.array([1, 2, 3])
anchuras = np.array([4, 5])
# Guarda en rectangulos la tabla de áreas (alturas por anchuras) y en total la suma de todos sus números
rectangulos = None
total = None
`,
      checks: `_t = np.outer([1, 2, 3], [4, 5])
_r = isinstance(rectangulos, np.ndarray) and rectangulos.shape == (3, 2) and np.issubdtype(rectangulos.dtype, np.number)
_n = isinstance(total, (int, float, np.integer, np.floating)) and not isinstance(total, (bool, np.bool_))
check(_r, "\`rectangulos\` tiene que ser un array de NumPy de 3 filas y 2 columnas: una fila por altura y una columna por anchura.")
check((not _r) or np.allclose(rectangulos, _t) or not np.allclose(rectangulos, _t.T), "\`rectangulos\` está traspuesta: las filas tienen que ser las alturas y las columnas las anchuras.")
check((not _r) or np.allclose(rectangulos, _t) or np.allclose(rectangulos, _t.T), "\`rectangulos\` tiene que tener en la fila i y la columna j el producto de la altura i por la anchura j.")
check(_n, "\`total\` tiene que ser un solo número: la suma de todos los números de la tabla.")
check((not _n) or abs(float(total) - 54) < 1e-9, "\`total\` tiene que ser la suma de los seis números de la tabla.")
`,
      reference: `import numpy as np

alturas = np.array([1, 2, 3])
anchuras = np.array([4, 5])
rectangulos = np.outer(alturas, anchuras)
total = rectangulos.sum()
`,
    },
  },
  {
    id: 'rango-bajo.cal.2',
    title: 'Quedarse con las primeras columnas o las primeras filas',
    explain:
      'Una matriz `M` se corta con índices entre corchetes. `M[:, :k]` se queda con las **primeras `k` columnas** (todas las filas) y `M[:k]`, o `M[:k, :]`, con las **primeras `k` filas** (todas las columnas). El primer índice elige filas y el segundo, columnas; `:k` significa «desde el principio hasta antes de la posición `k`».\n\nConviene mirar siempre `.shape` tras cortar: si `M` tiene 4 filas y 6 columnas, `M[:, :2]` es de 4 por 2 y `M[:2]` es de 2 por 6. Confundir uno con otro suele dar matrices cuyo tamaño ya no encaja para multiplicar.',
    example: `import numpy as np

M = np.arange(1, 25).reshape(4, 6)
print(M)

print("primeras 2 columnas:")
print(M[:, :2])
print("forma:", M[:, :2].shape)

print("primeras 2 filas:")
print(M[:2])
print("forma:", M[:2].shape)

print("un bloque, 2 filas y 3 columnas:")
print(M[:2, :3])
`,
    experiments: [
      'Cambia `M[:, :2]` por `M[:, :3]`: salen tres columnas.',
      'Escribe `print(M[:2, :].shape)`: es lo mismo que `M[:2]`.',
      'Escribe `print(M[:, -2:])`: las **últimas** 2 columnas, no las primeras.',
      'Escribe `print((M[:, :2] @ M[:2]).shape)`: 4 por 2 y 2 por 6 encajan y dan 4 por 6. Cambia el orden a `M[:2] @ M[:, :2]` y da un error, porque 2 por 6 y 4 por 2 no encajan.',
    ],
    task: {
      prompt:
        '`datos` tiene 5 filas y 4 columnas. Guarda en `tres_columnas` sus 3 primeras columnas (5 filas y 3 columnas) y en `dos_filas` sus 2 primeras filas (2 filas y 4 columnas).',
      starter: `import numpy as np

datos = np.arange(1, 21).reshape(5, 4)
# Guarda en tres_columnas las 3 primeras columnas de datos y en dos_filas sus 2 primeras filas
tres_columnas = None
dos_filas = None
`,
      checks: `_d = np.arange(1, 21).reshape(5, 4)
_c = isinstance(tres_columnas, np.ndarray) and tres_columnas.shape == (5, 3) and np.issubdtype(tres_columnas.dtype, np.number)
_f = isinstance(dos_filas, np.ndarray) and dos_filas.shape == (2, 4) and np.issubdtype(dos_filas.dtype, np.number)
check(_c, "\`tres_columnas\` tiene que ser un array de NumPy de 5 filas y 3 columnas: las tres primeras columnas de \`datos\`.")
check((not _c) or np.allclose(tres_columnas, _d[:, :3]), "\`tres_columnas\` tiene la forma pedida pero no son las tres primeras columnas de \`datos\`.")
check(_f, "\`dos_filas\` tiene que ser un array de NumPy de 2 filas y 4 columnas: las dos primeras filas de \`datos\`.")
check((not _f) or np.allclose(dos_filas, _d[:2]), "\`dos_filas\` tiene la forma pedida pero no son las dos primeras filas de \`datos\`.")
`,
      reference: `import numpy as np

datos = np.arange(1, 21).reshape(5, 4)
tres_columnas = datos[:, :3]
dos_filas = datos[:2]
`,
    },
  },
  {
    id: 'rango-bajo.cal.3',
    title: 'Escalar las columnas con `*` y contar con `.size`',
    explain:
      'Multiplicar una matriz de 3 filas y 2 columnas por un array de 2 números, `M * s`, multiplica **cada columna por su número**: la columna 0 por `s[0]` y la columna 1 por `s[1]`, en todas las filas a la vez. NumPy repite `s` fila a fila, igual que al restar una media. Es lo mismo que `M @ np.diag(s)`, y más corto.\n\nPara escalar **filas** en vez de columnas, `s` tendría que ir en vertical: `s[:, None] * M`, con un número por fila.\n\n`.size` es **cuántos números tiene** un array, sea cual sea su forma: una matriz de 3 por 2 tiene `.size` igual a 6. Sirve para comparar cuánto ocupa una matriz y cuánto ocupan dos matrices más pequeñas.',
    example: `import numpy as np

M = np.array([[1, 2], [3, 4], [5, 6]])
s = np.array([10, 100])

print("M * s:")
print(M * s)
print("igual que M @ np.diag(s):")
print(M @ np.diag(s))

print("por filas, con s en vertical:")
print(np.array([1, 10, 100])[:, None] * M)

print("números de M:", M.size)
print("números de dos matrices pequeñas:", M[:, :1].size + s.size)
`,
    experiments: [
      'Cambia `s` por `np.array([1, 0])`: la segunda columna se anula y la primera queda igual.',
      'Escribe `print(M * np.array([1, 2, 3]))`: da un error, porque `M` tiene 2 columnas y el array tiene 3 números.',
      'Escribe `print(M.shape, M.size)`: `.size` es el producto de las dos cifras de `.shape`.',
      'Escribe `print(M[:, :1].shape, M[:, :1].size)`: una sola columna, 3 por 1, con 3 números.',
    ],
    task: {
      prompt:
        '`pesos` tiene 3 filas y 2 columnas y `factor` tiene un número por columna. Guarda en `escalada` la matriz con cada columna de `pesos` multiplicada por su número de `factor`, y en `cuantos` cuántos números tiene `escalada` en total.',
      starter: `import numpy as np

pesos = np.array([[1, 2], [3, 4], [5, 6]])
factor = np.array([2, 10])
# Guarda en escalada las columnas de pesos multiplicadas por factor y en cuantos cuántos números tiene escalada
escalada = None
cuantos = None
`,
      checks: `_p = np.array([[1, 2], [3, 4], [5, 6]], dtype=float)
_f = np.array([2, 10], dtype=float)
_e = isinstance(escalada, np.ndarray) and escalada.shape == (3, 2) and np.issubdtype(escalada.dtype, np.number)
_n = isinstance(cuantos, (int, np.integer)) and not isinstance(cuantos, (bool, np.bool_))
check(_e, "\`escalada\` tiene que ser un array de NumPy de 3 filas y 2 columnas: \`pesos\` con cada columna multiplicada por su número de \`factor\`.")
check((not _e) or np.allclose(escalada, _p * _f), "\`escalada\` tiene que tener la primera columna de \`pesos\` multiplicada por 2 y la segunda por 10.")
check(_n, "\`cuantos\` tiene que ser un número entero: cuántos números tiene \`escalada\`.")
check((not _n) or cuantos == 6, "\`cuantos\` tiene que ser el número de elementos de \`escalada\`, que tiene 3 filas y 2 columnas.")
`,
      reference: `import numpy as np

pesos = np.array([[1, 2], [3, 4], [5, 6]])
factor = np.array([2, 10])
escalada = pesos * factor
cuantos = escalada.size
`,
    },
  },
  {
    id: 'rango-bajo.cal.4',
    title: '`np.linalg.svd`: las tres matrices y los valores singulares',
    explain:
      '`U, S, Vt = np.linalg.svd(M, full_matrices=False)` descompone `M` en tres cosas:\n\n- `U`: una matriz cuyas **columnas** son las direcciones de salida $u_i$.\n- `S`: **un array** con los valores singulares $\\sigma_i$, de **mayor a menor**. No es una matriz: para operar con ella como tal se usa `np.diag(S)`.\n- `Vt`: una matriz cuyas **filas** son las direcciones de entrada $v_i$ (ya traspuestas).\n\nMultiplicadas, `U @ np.diag(S) @ Vt`, devuelven `M` salvo un redondeo diminuto, y se comprueba con `np.allclose`. `np.linalg.norm(M)` es la norma de Frobenius (la raíz de la suma de los cuadrados de todos los números) y `np.linalg.norm(M, 2)` es el mayor valor singular, `S[0]`.',
    example: `import numpy as np

T = np.array([[3, 0], [4, 5], [0, 0], [0, 4]])
U, S, Vt = np.linalg.svd(T, full_matrices=False)
print("forma de U:", U.shape)
print("S:", S)
print("forma de Vt:", Vt.shape)

rec = U @ np.diag(S) @ Vt
print("¿se recupera T?", np.allclose(rec, T))

print("norma de Frobenius:", np.linalg.norm(T))
print("raíz de la suma de S al cuadrado:", np.sqrt(np.sum(S ** 2)))
print("norma 2 y el mayor valor singular:", np.linalg.norm(T, 2), S[0])
`,
    experiments: [
      'Cambia `full_matrices=False` por `full_matrices=True` y mira la forma de `U`: sale cuadrada, con columnas de sobra que no aportan nada.',
      'Escribe `print(U @ S @ Vt)`: da un error, porque `S` es un array y no una matriz; hace falta `np.diag(S)`.',
      'Escribe `print(S[0] >= S[1])`: los valores singulares salen siempre ordenados de mayor a menor.',
      'Cambia `T` por una matriz de rango 1, como `np.outer([1, 2, 3, 4], [1, 1])`: `S[1]` queda en 0 (o muy cerca, por el redondeo).',
    ],
    task: {
      prompt:
        '`R` tiene 3 filas y 2 columnas. Calcula su descomposición con `np.linalg.svd(R, full_matrices=False)` y guarda en `reconstruida` el producto de las tres matrices (3 filas y 2 columnas, igual que `R`) y en `mayor` su mayor valor singular.',
      starter: `import numpy as np

R = np.array([[1, 2], [2, 0], [0, 1]])
# Calcula la descomposición de R; guarda en reconstruida U @ np.diag(S) @ Vt y en mayor el mayor valor singular
reconstruida = None
mayor = None
`,
      checks: `_R = np.array([[1, 2], [2, 0], [0, 1]], dtype=float)
_s = np.linalg.svd(_R, compute_uv=False)
_r = isinstance(reconstruida, np.ndarray) and reconstruida.shape == (3, 2) and np.issubdtype(reconstruida.dtype, np.number)
_m = isinstance(mayor, (int, float, np.integer, np.floating)) and not isinstance(mayor, (bool, np.bool_))
check(_r, "\`reconstruida\` tiene que ser un array de NumPy de 3 filas y 2 columnas: el producto de \`U\`, \`np.diag(S)\` y \`Vt\`.")
check((not _r) or np.allclose(reconstruida, _R), "\`reconstruida\` tiene que volver a ser \`R\`: multiplica \`U\`, \`np.diag(S)\` y \`Vt\`, en ese orden.")
check(_m, "\`mayor\` tiene que ser un solo número: el mayor valor singular de \`R\`.")
check((not _m) or abs(float(mayor) - _s[0]) < 1e-9 or abs(float(mayor) - _s[-1]) > 1e-9, "\`mayor\` es el valor singular menor. Los valores singulares salen de mayor a menor: el mayor es el primero.")
check((not _m) or abs(float(mayor) - _s[0]) < 1e-9 or abs(float(mayor) - _s[-1]) < 1e-9, "\`mayor\` tiene que ser el primer valor singular de \`R\`, el mayor de los dos.")
`,
      reference: `import numpy as np

R = np.array([[1, 2], [2, 0], [0, 1]])
U, S, Vt = np.linalg.svd(R, full_matrices=False)
reconstruida = U @ np.diag(S) @ Vt
mayor = S[0]
`,
    },
  },
];
