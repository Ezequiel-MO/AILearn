import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto SVD: lo nuevo de su ejercicio «Programar». */
export const svdWarmup: WarmupStep[] = [
  {
    id: 'svd.cal.1',
    title: '`np.linalg.svd`: tres resultados de golpe',
    explain:
      '`U, S, Vt = np.linalg.svd(M)` descompone una matriz $M$ en tres factores y los devuelve **a la vez**, en este orden:\n\n- `U`: una matriz cuyas **columnas** son las direcciones de salida, `U[:, 0]`, `U[:, 1]`, ...\n- `S`: un array de una sola dimensión con los **valores singulares**, siempre de **mayor a menor** y nunca negativos.\n- `Vt`: la traspuesta de $V$, así que las direcciones de entrada van en sus **filas**: `Vt[0]` es la primera.\n\nLa `t` del nombre avisa: es $V^{T}$, no $V$. Pedir `Vt[:, 0]` saca una columna, y eso no es una dirección de entrada. Para un valor singular `S[k]` van juntas la fila `Vt[k]` y la columna `U[:, k]`.',
    example: `import numpy as np

M = np.array([[2, 0], [1, 1]])
U, S, Vt = np.linalg.svd(M)
print("valores singulares, de mayor a menor:", S)
print("U (direcciones de salida, en columnas):")
print(U)
print("Vt (direcciones de entrada, en filas):")
print(Vt)

v = Vt[0]
print("primera fila de Vt:", v)
print("M aplicada a ella:", M @ v)
print("S[0] por la primera columna de U:", S[0] * U[:, 0])
print("primera columna de Vt (no vale):", Vt[:, 0])
`,
    experiments: [
      'Escribe `print(S.shape, U.shape, Vt.shape)`: `S` es un array de 2 números, y `U` y `Vt` son matrices de 2 por 2.',
      'Cambia `M` por `np.array([[3, 0], [0, 1]])`, diagonal: `S` son los números de la diagonal y las filas de `Vt` son los ejes.',
      'Compara `M @ Vt[1]` con `S[1] * U[:, 1]`: el segundo valor singular va con la segunda fila y la segunda columna.',
      'Cambia `M` por `np.array([[1, 0], [0, -4]])` y mira `S`: el valor singular sale positivo, 4, y el signo se queda en `U`.',
    ],
    task: {
      prompt:
        'Guarda en `s_menor` el menor valor singular de `K` (un solo número) y en `v2` la segunda dirección de entrada, la fila de índice 1 de `Vt` (cualquiera de sus dos signos vale).',
      starter: `import numpy as np

K = np.array([[4, 1], [0, 2]])
# Guarda en s_menor el menor valor singular de K y en v2 la segunda dirección de entrada
s_menor = None
v2 = None
`,
      checks: `_U, _S, _Vt = np.linalg.svd(np.array([[4, 1], [0, 2]], dtype=float))
_s = isinstance(s_menor, (int, float, np.integer, np.floating)) and not isinstance(s_menor, (bool, np.bool_))
_v = isinstance(v2, np.ndarray) and v2.shape == (2,) and np.issubdtype(v2.dtype, np.number)
check(_s, "\`s_menor\` tiene que ser un solo número: el menor valor singular de \`K\`.")
check((not _s) or abs(float(s_menor) - float(_S[0])) > 1e-6, "\`s_menor\` es el mayor valor singular. \`S\` va de mayor a menor: el menor es el último.")
check((not _s) or abs(float(s_menor) - float(_S[0])) < 1e-6 or abs(float(s_menor) - float(_S[1])) < 1e-6, "\`s_menor\` tiene que ser el menor valor singular de \`K\`, el último de \`S\`.")
check(_v, "\`v2\` tiene que ser un array de NumPy con 2 números: una fila de \`Vt\`.")
check((not _v) or abs(float(v2 @ _Vt[1])) > 0.999999 or abs(float(v2 @ _Vt[:, 1])) < 0.999999, "\`v2\` es una columna de \`Vt\`. Las direcciones de entrada van en las filas: \`Vt[1]\`, no \`Vt[:, 1]\`.")
check((not _v) or abs(float(v2 @ _Vt[1])) > 0.999999 or abs(float(v2 @ _Vt[:, 1])) > 0.999999, "\`v2\` tiene que ser la fila de índice 1 de \`Vt\`.")
`,
      reference: `import numpy as np

K = np.array([[4, 1], [0, 2]])
U, S, Vt = np.linalg.svd(K)
s_menor = S[-1]
v2 = Vt[1]
`,
    },
  },
  {
    id: 'svd.cal.2',
    title: '`np.diag` y `full_matrices=False`: volver a montar la matriz',
    explain:
      '`S` viene como un array de una dimensión, y para multiplicar hace falta una matriz. `np.diag(S)` construye la **matriz diagonal**: pone los números de `S` en la diagonal y ceros en el resto. Con eso, `U @ np.diag(S) @ Vt` vuelve a dar la matriz original.\n\nSi la matriz no es cuadrada, `np.linalg.svd(M)` devuelve por defecto una `U` o una `Vt` **cuadrada y más grande**, con filas o columnas que sobran, y las formas ya no encajan para multiplicar. Con `full_matrices=False` salen las versiones **reducidas**, con solo las columnas de `U` y las filas de `Vt` que corresponden a un valor singular: para una matriz de $m\\times n$, `U` es de $m\\times k$, `Vt` de $k\\times n$ y `np.diag(S)` de $k\\times k$, con $k$ el menor de $m$ y $n$.\n\nComo el redondeo deja diferencias diminutas, el resultado se compara con la original con `np.allclose`, no con `==`.',
    example: `import numpy as np

M = np.array([[1, 3, 0], [2, 0, 1]])
U, S, Vt = np.linalg.svd(M, full_matrices=False)
print("formas de U, S y Vt:", U.shape, S.shape, Vt.shape)

D = np.diag(S)
print("np.diag(S):")
print(D)

M_rec = U @ D @ Vt
print("reconstruida:")
print(M_rec)
print("¿igual a M?", np.allclose(M, M_rec))

print("sin full_matrices=False, Vt es de", np.linalg.svd(M)[2].shape)
`,
    experiments: [
      'Quita `full_matrices=False` y prueba `U @ np.diag(S) @ Vt`: las formas ya no encajan y NumPy se queja, porque `Vt` pasa a ser de 3 por 3.',
      'Escribe `print(np.diag(np.array([5, 7, 9])))`: una matriz de 3 por 3 con esos números en la diagonal.',
      'Escribe `print(np.diag(D))`: `np.diag` aplicada a una matriz devuelve su diagonal como array, el camino de vuelta.',
      'Cambia `M` por su traspuesta, `M.T`, de 3 filas y 2 columnas, y mira las formas de `U`, `S` y `Vt`.',
    ],
    task: {
      prompt:
        'Con la descomposición reducida de `P` ya hecha en el código de partida, guarda en `Sigma` la matriz diagonal con los valores singulares y en `P_rec` la reconstrucción de `P` a partir de `U`, `Sigma` y `Vt`.',
      starter: `import numpy as np

P = np.array([[1, 2, 0], [0, 1, 2]])
U, S, Vt = np.linalg.svd(P, full_matrices=False)
# Guarda en Sigma la matriz diagonal de los valores singulares y en P_rec la reconstrucción de P
Sigma = None
P_rec = None
`,
      checks: `_P = np.array([[1, 2, 0], [0, 1, 2]], dtype=float)
_U, _S, _Vt = np.linalg.svd(_P, full_matrices=False)
_a = isinstance(Sigma, np.ndarray) and Sigma.shape == (2, 2)
_b = isinstance(P_rec, np.ndarray) and P_rec.shape == (2, 3)
check(_a, "\`Sigma\` tiene que ser un array de NumPy de 2 filas y 2 columnas: una matriz, no la lista de valores singulares.")
check((not _a) or bool(np.allclose(Sigma, np.diag(_S))), "\`Sigma\` tiene que tener los valores singulares en la diagonal y ceros fuera de ella.")
check(_b, "\`P_rec\` tiene que ser un array de NumPy de 2 filas y 3 columnas: la reconstrucción de \`P\`.")
check((not _b) or (not _a) or bool(np.allclose(P_rec, _P)) or not np.allclose(P_rec, _U @ _Vt), "\`P_rec\` no recupera \`P\`: falta multiplicar por \`Sigma\` entre \`U\` y \`Vt\`.")
check((not _b) or (not _a) or bool(np.allclose(P_rec, _P)), "\`P_rec\` tiene que ser \`U\` por \`Sigma\` por \`Vt\`, en ese orden. Comprueba que se parece a \`P\` con \`np.allclose\`.")
`,
      reference: `import numpy as np

P = np.array([[1, 2, 0], [0, 1, 2]])
U, S, Vt = np.linalg.svd(P, full_matrices=False)
Sigma = np.diag(S)
P_rec = U @ Sigma @ Vt
`,
    },
  },
  {
    id: 'svd.cal.3',
    title: '`[::-1]` y contar con `np.sum`: dar la vuelta y contar cuántos pasan',
    explain:
      'Un array se recorre al revés con `x[::-1]`: el mismo array con el último elemento primero. Sirve cuando una función ordena de menor a mayor y tú lo quieres de mayor a menor. `np.sort(x)` ordena de menor a mayor, y `np.sort(x)[::-1]`, de mayor a menor.\n\nUna comparación como `x > 0.1` da un array de `True` y `False`, uno por elemento. NumPy cuenta cada `True` como 1, así que `np.sum(x > 0.1)` es **cuántos elementos superan 0,1**. Sale un entero de NumPy; si hace falta un entero normal de Python, se envuelve en `int(...)`.',
    example: `import numpy as np

lecturas = np.array([0.5, 12.0, 0.03, 4.0, 0.9])
print("de menor a mayor:", np.sort(lecturas))
print("de mayor a menor:", np.sort(lecturas)[::-1])

pasan = lecturas > 1
print("¿pasa de 1?", pasan)
print("cuántas pasan:", np.sum(pasan))
print("como entero normal:", int(np.sum(lecturas > 1)))
`,
    experiments: [
      'Cambia el umbral de `1` a `0.1`: ahora pasan más lecturas.',
      'Escribe `print(np.sum(lecturas > 100))`: ninguna pasa y la cuenta es 0.',
      'Escribe `print(np.sum(lecturas > 0))`: cuenta las positivas, que son todas.',
      'Escribe `print(lecturas[::-1])` sin ordenar: da la vuelta al orden en que están, no los ordena.',
    ],
    task: {
      prompt:
        'Guarda en `ordenados` los números de `datos` de mayor a menor y en `cuantos` cuántos superan $0{,}1$ (un entero de Python).',
      starter: `import numpy as np

datos = np.array([0.02, 0.4, 1.5, 0.003, 2.2])
# Guarda en ordenados los datos de mayor a menor y en cuantos cuántos son mayores que 0.1
ordenados = None
cuantos = None
`,
      checks: `_d = np.array([0.02, 0.4, 1.5, 0.003, 2.2])
_o = isinstance(ordenados, np.ndarray) and ordenados.shape == (5,)
_c = isinstance(cuantos, (int, np.integer)) and not isinstance(cuantos, (bool, np.bool_))
check(_o, "\`ordenados\` tiene que ser un array de NumPy con los 5 números de \`datos\`.")
check((not _o) or not np.allclose(ordenados, np.sort(_d)), "\`ordenados\` está de menor a mayor. Dale la vuelta con \`[::-1]\`.")
check((not _o) or np.allclose(ordenados, np.sort(_d)) or np.allclose(ordenados, np.sort(_d)[::-1]), "\`ordenados\` tiene que tener los números de \`datos\` ordenados de mayor a menor.")
check(_c, "\`cuantos\` tiene que ser un número entero: cuántos datos superan 0,1.")
check((not _c) or cuantos == 3, "\`cuantos\` no es la cantidad de datos mayores que 0,1. Cuenta los \`True\` de la comparación con \`np.sum\`.")
`,
      reference: `import numpy as np

datos = np.array([0.02, 0.4, 1.5, 0.003, 2.2])
ordenados = np.sort(datos)[::-1]
cuantos = int(np.sum(datos > 0.1))
`,
    },
  },
];
