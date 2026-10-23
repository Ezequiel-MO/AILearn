import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Inversa: lo nuevo de su ejercicio «Programar». */
export const inversaWarmup: WarmupStep[] = [
  {
    id: 'inversa.cal.1',
    title: '`np.linalg.inv`: la inversa de una matriz',
    explain:
      '`np.linalg.inv(M)` recibe una matriz cuadrada y devuelve **otra matriz del mismo tamaño**: la que deshace lo que hace `M`. Multiplicar por ella con `@` devuelve el vector de partida.\n\nTres cosas que conviene saber:\n\n- El producto `M @ np.linalg.inv(M)` es la identidad **salvo redondeo**: en vez de un `0` puede salir `2.2e-16`, que significa 0,00000000000000022. Para comprobarlo se usa `np.allclose(X, np.eye(n))`, no `==`.\n- La inversa de una matriz **no** es `1 / M`. Esa división calcula el inverso de cada número por separado, y eso no deshace nada.\n- La inversa se escribe `np.linalg.inv(M)`, con `linalg` en medio: `np.inv` no existe.',
    example: `import numpy as np

M = np.array([[2, 1],
              [5, 3]])
Minv = np.linalg.inv(M)
print("inversa:")
print(Minv)
print("M @ Minv:")
print(M @ Minv)
print("¿es la identidad?", np.allclose(M @ Minv, np.eye(2)))

v = np.array([4, -1])
print("M @ v =", M @ v)
print("Minv @ (M @ v) =", Minv @ (M @ v))
`,
    experiments: [
      'Mira bien `M @ Minv`: ¿hay algún número que no sea un 0 o un 1 limpios? Es el redondeo, y por eso se compara con `np.allclose`.',
      'Escribe `print(M @ Minv == np.eye(2))`: sale una matriz de `True` y `False`, no un solo valor.',
      'Escribe `print(1 / M)` y compáralo con `Minv`: son matrices distintas.',
      'Cambia `v` por otro vector: `Minv @ (M @ v)` siempre devuelve `v`, porque `Minv` deshace a `M`.',
    ],
    task: {
      prompt:
        'Guarda en `Sinv` la inversa de `S`, en `ida` lo que sale de aplicar `S` al vector `w` y en `vuelta` lo que sale de aplicar `Sinv` a `ida`. Tiene que salir otra vez `w`.',
      starter: `import numpy as np

S = np.array([[1, 0, 0],
              [2, 1, 0],
              [0, 3, 1]])
w = np.array([3, -1, 2])
# Guarda en Sinv la inversa de S, en ida S aplicada a w y en vuelta Sinv aplicada a ida
Sinv = None
ida = None
vuelta = None
`,
      checks: `_s = isinstance(Sinv, np.ndarray) and Sinv.shape == (3, 3) and np.issubdtype(Sinv.dtype, np.number)
_i = isinstance(ida, np.ndarray) and ida.shape == (3,) and np.issubdtype(ida.dtype, np.number)
_v = isinstance(vuelta, np.ndarray) and vuelta.shape == (3,) and np.issubdtype(vuelta.dtype, np.number)
check(_s, "\`Sinv\` tiene que ser un array de NumPy de 3 filas y 3 columnas: la inversa de \`S\`.")
check((not _s) or np.allclose(Sinv @ S, np.eye(3)), "\`Sinv\` no es la inversa de \`S\`: multiplicada por \`S\` tendría que dar la identidad. Se calcula con \`np.linalg.inv(S)\`.")
check(_i, "\`ida\` tiene que ser un array de NumPy con 3 números: \`S\` aplicada a \`w\`.")
check((not _i) or np.allclose(ida, [3, 5, -1]), "\`ida\` tiene que ser \`S @ w\`: la matriz a la izquierda y el vector a la derecha.")
check(_v, "\`vuelta\` tiene que ser un array de NumPy con 3 números: \`Sinv\` aplicada a \`ida\`.")
check((not _v) or np.allclose(vuelta, w), "\`vuelta\` tiene que ser el vector \`w\` de partida: la inversa deshace lo que hizo \`S\`. Aplica \`Sinv\` a \`ida\` con \`@\`.")
`,
      reference: `import numpy as np

S = np.array([[1, 0, 0],
              [2, 1, 0],
              [0, 3, 1]])
w = np.array([3, -1, 2])
Sinv = np.linalg.inv(S)
ida = S @ w
vuelta = Sinv @ ida
`,
    },
  },
  {
    id: 'inversa.cal.2',
    title: '`np.linalg.det` y `np.isclose`: ¿tiene inversa?',
    explain:
      'Una matriz con determinante 0 aplasta el plano y **no tiene inversa**. El problema es que `np.linalg.inv` no siempre avisa. En el Python de este juego:\n\n- si el determinante sale exactamente `0.0`, `inv` devuelve una matriz llena de `nan` («no es un número»), sin lanzar ningún error;\n- si sale casi 0, como `-2.5e-17`, `inv` devuelve una matriz con números enormes, del orden de $10^{16}$, también sin avisar.\n\nEn ninguno de los dos casos puedes fiarte del resultado. Por eso se mira el determinante **antes** de invertir, y se compara con `np.isclose(d, 0)`: `d == 0` falla justo en el segundo caso.',
    example: `import numpy as np

A = np.array([[1, 2], [3, 5]])
B = np.array([[1, 2], [2, 4]])
C = np.array([[0.6, 0.2], [0.9, 0.3]])
print("det A:", np.linalg.det(A))
print("det B:", np.linalg.det(B))
print("det C:", np.linalg.det(C))
print("inv B:")
print(np.linalg.inv(B))
print("inv C:")
print(np.linalg.inv(C))
print("¿C tiene inversa?", not np.isclose(np.linalg.det(C), 0))
`,
    experiments: [
      'Añade `print(np.linalg.det(C) == 0)`: con un determinante de `-2.5e-17`, `==` dice `False`, y `np.isclose` dice `True`.',
      'Mira las columnas de `B` y de `C`: en las dos, una columna es un múltiplo de la otra. Por eso aplastan el plano.',
      'Cambia `C` por `np.array([[0.6, 0.2], [0.9, 0.4]])`: ahora el determinante es claramente distinto de 0.',
      'Escribe `print(np.isnan(np.linalg.inv(B)).any())`: `np.isnan` dice, número a número, cuáles son `nan`.',
    ],
    task: {
      prompt:
        'Guarda en `d` el determinante de `K` y en `tiene_inversa` si `K` tiene inversa: un solo `True` o `False`, decidido con `np.isclose` y no con `==`.',
      starter: `import numpy as np

K = np.array([[0.7, 0.1],
              [2.1, 0.3]])
# Guarda en d el determinante de K y en tiene_inversa si K tiene inversa (con np.isclose)
d = None
tiene_inversa = None
`,
      checks: `_d = isinstance(d, (int, float, np.integer, np.floating)) and not isinstance(d, (bool, np.bool_))
_b = isinstance(tiene_inversa, (bool, np.bool_))
check(_d, "\`d\` tiene que ser un número: el determinante de \`K\`, que se calcula con \`np.linalg.det\`.")
check((not _d) or abs(d) < 1e-9, "\`d\` tiene que ser casi 0: las dos columnas de \`K\` son paralelas, y una es 7 veces la otra.")
check(_b, "\`tiene_inversa\` tiene que ser un solo \`True\` o \`False\`.")
check((not _b) or not bool(tiene_inversa), "\`tiene_inversa\` vale \`True\`, pero \`K\` aplasta el plano y no tiene inversa. Su determinante no es exactamente 0 por el redondeo, así que \`d != 0\` o \`d == 0\` engañan: usa \`np.isclose(d, 0)\`.")
`,
      reference: `import numpy as np

K = np.array([[0.7, 0.1],
              [2.1, 0.3]])
d = np.linalg.det(K)
tiene_inversa = not np.isclose(d, 0)
`,
    },
  },
  {
    id: 'inversa.cal.3',
    title: '`np.linalg.solve`: resolver un sistema',
    explain:
      '`np.linalg.solve(M, b)` resuelve el sistema $M\\vec{x}=\\vec{b}$: recibe primero la **matriz** cuadrada y después el **vector** del lado derecho, y devuelve un array `x` con los números que cumplen `M @ x == b`.\n\nSale el mismo vector que con `np.linalg.inv(M) @ b`, pero sin construir la inversa entera: es más rápido y pierde menos precisión.\n\nPara comprobar la solución, calcula `M @ x - b`: tiene que salir un vector de ceros (salvo redondeo). Y ojo: con una matriz singular, en este juego `solve` devuelve `nan` sin avisar, igual que `inv`.',
    example: `import numpy as np

M = np.array([[3, 1],
              [2, 5]])
b = np.array([9, 19])
x = np.linalg.solve(M, b)
print("x =", x)
print("M @ x =", M @ x)
print("M @ x - b =", M @ x - b)
print("con la inversa:", np.linalg.inv(M) @ b)
`,
    experiments: [
      'Cambia `b` por `np.array([3, 7])` y ejecuta: ¿cambia `x`? La matriz es la misma, pero el sistema es otro.',
      'Cambia el orden de los argumentos a `np.linalg.solve(b, M)`: Python se para. Lee qué dice el mensaje.',
      'Cambia la segunda fila de `M` por `[6, 2]`, el doble de la primera: la matriz aplasta el plano, y el resultado es `nan` en vez de una solución.',
      'Escribe `print(np.allclose(M @ x, b))`: un solo `True` si la solución es buena.',
    ],
    task: {
      prompt:
        'Guarda en `x` la solución del sistema `A @ x = c` y en `residuo` el vector `A @ x - c`, que tiene que ser de ceros salvo el redondeo.',
      starter: `import numpy as np

A = np.array([[1, 1, 1],
              [0, 2, 5],
              [2, 5, -1]])
c = np.array([6, -4, 27])
# Guarda en x la solución de A x = c y en residuo el vector A @ x - c
x = None
residuo = None
`,
      checks: `_x = isinstance(x, np.ndarray) and x.shape == (3,) and np.issubdtype(x.dtype, np.number)
_r = isinstance(residuo, np.ndarray) and residuo.shape == (3,) and np.issubdtype(residuo.dtype, np.number)
check(_x, "\`x\` tiene que ser un array de NumPy con 3 números: la solución del sistema.")
check((not _x) or np.allclose(x, [5, 3, -2]), "\`x\` tiene que ser el vector que \`A\` lleva hasta \`c\`: \`A @ x\` tiene que dar \`c\`. \`np.linalg.solve\` recibe primero la matriz y después el vector.")
check(_r, "\`residuo\` tiene que ser un array de NumPy con 3 números: \`A @ x - c\`.")
check((not _r) or (not _x) or not np.allclose(x, [5, 3, -2]) or np.allclose(residuo, 0), "\`residuo\` tiene que ser \`A @ x - c\`: el producto de la matriz por la solución, menos el vector del lado derecho. Con una buena solución, todos sus números son casi 0.")
`,
      reference: `import numpy as np

A = np.array([[1, 1, 1],
              [0, 2, 5],
              [2, 5, -1]])
c = np.array([6, -4, 27])
x = np.linalg.solve(A, c)
residuo = A @ x - c
`,
    },
  },
  {
    id: 'inversa.cal.4',
    title: '`np.linalg.inv(P @ Q)`: el orden al deshacer',
    explain:
      'En un producto `P @ Q`, la matriz que actúa **primero** sobre un vector es la de la derecha, `Q`; después actúa `P`. Para deshacerlo hay que deshacer primero lo último que se hizo: la inversa de `P` va a la **derecha**.\n\nLa regla es `np.linalg.inv(P @ Q) = np.linalg.inv(Q) @ np.linalg.inv(P)`. Con las inversas en el mismo orden, `inv(P) @ inv(Q)`, sale otra matriz que casi nunca es la inversa: el producto de matrices no es conmutativo, y el orden cambia el resultado.',
    example: `import numpy as np

A = np.array([[1, 1], [0, 1]])
B = np.array([[2, 0], [0, 1]])
directa = np.linalg.inv(A @ B)
al_reves = np.linalg.inv(B) @ np.linalg.inv(A)
mismo_orden = np.linalg.inv(A) @ np.linalg.inv(B)
print("inv(A @ B):")
print(directa)
print("inv(B) @ inv(A):")
print(al_reves)
print("¿coinciden las dos?", np.allclose(directa, al_reves))
print("con inv(A) @ inv(B):", np.allclose(directa, mismo_orden))
`,
    experiments: [
      'Cambia `B` por `np.eye(2)`: las tres matrices coinciden. Con la identidad, el orden no importa.',
      'Escribe `print(np.allclose(A @ B, B @ A))`: dice `False`, porque cambiar el orden del producto cambia la matriz.',
      'Añade `C = np.array([[1, 0], [3, 1]])` y compara `np.linalg.inv(A @ B @ C)` con `np.linalg.inv(C) @ np.linalg.inv(B) @ np.linalg.inv(A)`.',
      'Escribe `print(directa @ A @ B)`: sale la identidad, porque `directa` deshace el producto entero.',
    ],
    task: {
      prompt:
        'Guarda en `directa` la inversa de `P @ Q`, en `por_partes` la matriz que sale de invertir `P` y `Q` por separado y multiplicarlas en el orden que deshace `P @ Q`, y en `coinciden` si las dos son iguales (un solo `True` o `False`, con `np.allclose`).',
      starter: `import numpy as np

P = np.array([[1, 0], [2, 1]])
Q = np.array([[1, 3], [0, 1]])
# Guarda en directa la inversa de P @ Q, en por_partes las inversas de P y Q multiplicadas en el orden que deshace P @ Q, y en coinciden si son iguales
directa = None
por_partes = None
coinciden = None
`,
      checks: `_m = lambda a: isinstance(a, np.ndarray) and a.shape == (2, 2) and np.issubdtype(a.dtype, np.number)
_d = _m(directa)
_p = _m(por_partes)
_b = isinstance(coinciden, (bool, np.bool_))
_iP = np.linalg.inv(P)
_iQ = np.linalg.inv(Q)
_good = _d and np.allclose(directa, np.linalg.inv(P @ Q))
check(_d, "\`directa\` tiene que ser un array de NumPy de 2 filas y 2 columnas: la inversa de \`P @ Q\`.")
check((not _d) or _good, "\`directa\` tiene que ser la inversa del producto \`P @ Q\`: primero se multiplican las dos matrices, y se invierte el resultado.")
check(_p, "\`por_partes\` tiene que ser un array de NumPy de 2 filas y 2 columnas: las inversas de \`P\` y \`Q\`, multiplicadas.")
check((not _p) or not np.allclose(por_partes, _iP @ _iQ), "\`por_partes\` tiene las inversas en el mismo orden que \`P @ Q\`. En \`P @ Q\` actúa primero \`Q\`, así que se deshace primero \`P\`: la inversa de \`P\` va a la derecha.")
check((not _p) or np.allclose(por_partes, _iP @ _iQ) or np.allclose(por_partes, _iQ @ _iP), "\`por_partes\` tiene que ser la inversa de \`Q\` multiplicada por la inversa de \`P\`, por separado y con \`@\`.")
check(_b, "\`coinciden\` tiene que ser un solo \`True\` o \`False\`: el resultado de \`np.allclose\`.")
check((not _b) or (not _good) or (not _p) or not np.allclose(por_partes, _iQ @ _iP) or bool(coinciden), "\`coinciden\` vale \`False\`, pero las dos matrices son la misma salvo redondeo. Compáralas con \`np.allclose\`.")
`,
      reference: `import numpy as np

P = np.array([[1, 0], [2, 1]])
Q = np.array([[1, 3], [0, 1]])
directa = np.linalg.inv(P @ Q)
por_partes = np.linalg.inv(Q) @ np.linalg.inv(P)
coinciden = np.allclose(directa, por_partes)
`,
    },
  },
];
