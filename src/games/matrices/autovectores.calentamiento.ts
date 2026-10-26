import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Autovectores: lo nuevo de su ejercicio «Programar». */
export const autovectoresWarmup: WarmupStep[] = [
  {
    id: 'autovectores.cal.1',
    title: '`np.linalg.eig`: dos resultados y vectores en columnas',
    explain:
      '`np.linalg.eig(M)` calcula los **autovalores** y los **autovectores** de una matriz cuadrada `M`, y los devuelve **a la vez**: son dos resultados, y se recogen escribiendo dos nombres separados por una coma, `a, b = ...`.\n\n- El primero es un array con los autovalores.\n- El segundo es una matriz con los autovectores, y cada uno va en una **columna**: el autovector de la posición `k` es la columna `k`, que se escribe `M[:, k]` (los dos puntos significan «todas las filas»). Una fila, `M[k]`, es otra cosa.\n\nAutovalor y autovector van emparejados por posición: el autovalor número `k` es el de la columna número `k`. NumPy no garantiza en qué orden salen, así que no lo supongas.',
    example: `import numpy as np

M = np.array([[6, 2],
              [2, 3]])
valores, vectores = np.linalg.eig(M)
print("autovalores:", valores)
print("autovectores, uno por columna:")
print(vectores)

primera = vectores[:, 0]
print("primera columna:", primera)
print("primera fila:", vectores[0])
print("M @ primera:", M @ primera)
print("valores[0] * primera:", valores[0] * primera)
`,
    experiments: [
      'Cambia `vectores[:, 0]` por `vectores[:, 1]` y compara de nuevo las dos últimas líneas: la segunda columna va con el segundo autovalor.',
      'Compara `primera` con `vectores[0]`, la primera fila, y comprueba con `print(M @ vectores[0])` que la fila no se queda en su recta.',
      'Cambia `M` por `np.array([[5, 0], [0, 2]])`, una matriz diagonal: los autovectores son los ejes y la matriz de autovectores es la identidad.',
      'Escribe `print(vectores.shape)` y `print(valores.shape)`: la matriz es de 2 filas y 2 columnas y los autovalores son un array de 2 números.',
    ],
    task: {
      prompt:
        'Guarda en `valores` y `vectores` los dos resultados de `np.linalg.eig(K)`; en `columna`, la columna de posición 1 de `vectores` (la segunda); y en `lam1`, el autovalor que va emparejado con ella.',
      starter: `import numpy as np

K = np.array([[5, 1],
              [0, 3]])
# Guarda en valores y vectores lo que devuelve np.linalg.eig, en columna la segunda columna de vectores y en lam1 su autovalor
valores = None
vectores = None
columna = None
lam1 = None
`,
      checks: `_a = lambda x, s: isinstance(x, np.ndarray) and x.shape == s and np.issubdtype(x.dtype, np.number) and not np.iscomplexobj(x)
_val = _a(valores, (2,))
_vec = _a(vectores, (2, 2))
_col = _a(columna, (2,))
_lam = isinstance(lam1, (int, float, np.integer, np.floating)) and not isinstance(lam1, (bool, np.bool_))
check(_val, "\`valores\` tiene que ser un array de NumPy con 2 números: el primer resultado de \`np.linalg.eig\`.")
check((not _val) or bool(np.allclose(np.sort(valores), [3, 5])), "\`valores\` tiene que tener los dos autovalores de \`K\`.")
check(_vec, "\`vectores\` tiene que ser un array de NumPy de 2 filas y 2 columnas: el segundo resultado de \`np.linalg.eig\`.")
check((not _vec) or (not _val) or bool(np.allclose(K @ vectores, vectores * valores)), "\`vectores\` tiene que ser lo que devuelve \`np.linalg.eig\` junto a \`valores\`: un autovector por columna, emparejado con el autovalor de su misma posición.")
check(_col, "\`columna\` tiene que ser un array de NumPy con 2 números: una columna de \`vectores\`.")
check((not _col) or (not _vec) or not (np.allclose(columna, vectores[1]) and not np.allclose(columna, vectores[:, 1])), "\`columna\` es una fila de \`vectores\`, y los autovectores van en las columnas. Para tomar todas las filas de una columna se escribe \`[:, k]\`.")
check((not _col) or (not _vec) or bool(np.allclose(columna, vectores[:, 1])), "\`columna\` tiene que ser la columna de posición 1 de \`vectores\`, la segunda.")
check(_lam, "\`lam1\` tiene que ser un número: el autovalor de \`valores\` que va con esa columna.")
check((not _lam) or (not _val) or bool(np.isclose(lam1, valores[1])), "\`lam1\` tiene que ser el autovalor que está en la misma posición que \`columna\`, la 1.")
`,
      reference: `import numpy as np

K = np.array([[5, 1],
              [0, 3]])
valores, vectores = np.linalg.eig(K)
columna = vectores[:, 1]
lam1 = valores[1]
`,
    },
  },
  {
    id: 'autovectores.cal.2',
    title: '`np.argmax` y `np.abs`: elegir por tamaño, también con complejos',
    explain:
      '`np.argmax(x)` devuelve la **posición** (un número entero) del valor más grande de `x`, no el valor. Si hay empate, la primera.\n\n`np.abs(x)` da el **valor absoluto** de cada elemento: el tamaño, sin signo. Funciona también con **números complejos**, que Python escribe `3 + 4j`: para ellos devuelve el **módulo**, la longitud del número, $\\sqrt{3^2+4^2}=5$.\n\nSi quieres la posición del valor de mayor *tamaño*, y no del mayor a secas, combina las dos: `np.argmax(np.abs(x))`. Después `x[posición]` te da el valor, con su signo.',
    example: `import numpy as np

x = np.array([2.0, -9.0, 5.0])
print("posición del mayor:", np.argmax(x))
print("valores absolutos:", np.abs(x))
print("posición del mayor tamaño:", np.argmax(np.abs(x)))
print("ese valor, con su signo:", x[np.argmax(np.abs(x))])

z = 3 + 4j
print("z:", z, "módulo:", np.abs(z))
zs = np.array([1 + 1j, 0 - 2j, 1.5 + 0j])
print("módulos:", np.abs(zs))
`,
    experiments: [
      'Cambia el `-9.0` de `x` por `1.0` y mira cómo cambian las dos posiciones.',
      'Escribe `print(np.argmax(np.array([4, 7, 7])))`: con un empate, devuelve la primera posición.',
      'Escribe `print(np.argmax(zs.real))` y `print(np.argmax(np.abs(zs)))`: la parte real y el módulo no eligen el mismo número.',
      'Cambia `z` por `0 + 1j` y mira su módulo: aunque su parte real sea 0, el número no es pequeño.',
    ],
    task: {
      prompt:
        'Guarda en `pos` la posición del valor de `p` con mayor tamaño (valor absoluto), en `mayor` ese valor, con su signo, y en `modulo` el módulo del número complejo `z`.',
      starter: `import numpy as np

p = np.array([1.5, -4.0, 2.5, 3.0, -0.5])
z = 6 - 8j
# Guarda en pos la posición del valor de p de mayor tamaño, en mayor ese valor con su signo y en modulo el módulo de z
pos = None
mayor = None
modulo = None
`,
      checks: `_n = lambda x: isinstance(x, (int, float, np.integer, np.floating)) and not isinstance(x, (bool, np.bool_))
_pos = isinstance(pos, (int, np.integer)) and not isinstance(pos, (bool, np.bool_))
_m = _n(mayor)
_z = _n(modulo)
check(_pos, "\`pos\` tiene que ser un número entero: la posición del valor de \`p\` con mayor tamaño.")
check((not _pos) or pos != 3, "\`pos\` apunta al valor más grande de \`p\`, pero hay otro con más tamaño aunque sea negativo. Falta pasar \`p\` por \`np.abs\` antes de buscar.")
check((not _pos) or pos in (1, 3), "\`pos\` tiene que ser la posición del valor de \`p\` con mayor valor absoluto.")
check(_m, "\`mayor\` tiene que ser un número: el valor de \`p\` que está en esa posición.")
check((not _m) or not np.isclose(mayor, 4.0), "\`mayor\` ha perdido el signo: se pide el valor de \`p\` tal como está, y no su valor absoluto.")
check((not _m) or np.isclose(mayor, 4.0) or np.isclose(mayor, -4.0), "\`mayor\` tiene que ser el valor de \`p\` con mayor tamaño, con su signo.")
check(_z, "\`modulo\` tiene que ser un número real: el módulo de \`z\`.")
check((not _z) or not np.isclose(modulo, 6.0), "\`modulo\` vale lo mismo que la parte real de \`z\`. El módulo usa las dos partes del número.")
check((not _z) or np.isclose(modulo, 6.0) or np.isclose(modulo, 10.0), "\`modulo\` tiene que ser la longitud de \`z\`, que \`np.abs\` calcula.")
`,
      reference: `import numpy as np

p = np.array([1.5, -4.0, 2.5, 3.0, -0.5])
z = 6 - 8j
pos = np.argmax(np.abs(p))
mayor = p[pos]
modulo = np.abs(z)
`,
    },
  },
  {
    id: 'autovectores.cal.3',
    title: '`np.diag` y `np.linalg.matrix_power`: diagonales y potencias de matrices',
    explain:
      '`np.diag` hace dos cosas, según lo que le des:\n\n- Si le das un **array de números**, construye la **matriz diagonal**: esos números en la diagonal y ceros fuera.\n- Si le das una **matriz**, extrae su diagonal como un array.\n\nPara elevar una matriz a una potencia hay dos caminos que no dan lo mismo. `M ** 2` eleva al cuadrado **cada número** de `M`. `np.linalg.matrix_power(M, 2)` multiplica la **matriz por sí misma**, como `M @ M`, y es lo que se llama la potencia de la matriz.',
    example: `import numpy as np

print("matriz diagonal:")
print(np.diag([3, 5]))

M = np.array([[1, 1],
              [0, 2]])
print("diagonal de M:", np.diag(M))
print("M ** 2, cada número al cuadrado:")
print(M ** 2)
print("matrix_power(M, 2), la matriz por sí misma:")
print(np.linalg.matrix_power(M, 2))
print("M @ M:")
print(M @ M)
`,
    experiments: [
      'Cambia `np.diag([3, 5])` por `np.diag([1, 2, 3])`: la matriz diagonal tiene el tamaño del array.',
      'Escribe `print(np.linalg.matrix_power(M, 3))` y compáralo con `print(M @ M @ M)`: es el mismo resultado.',
      'Escribe `print(np.linalg.matrix_power(M, 0))`: elevar a 0 da la identidad.',
      'Escribe `print(np.diag(np.diag(M)))`: primero se extrae la diagonal y después se vuelve a construir una matriz con ella, sin lo que había fuera.',
    ],
    task: {
      prompt:
        'Guarda en `D` la matriz diagonal que tiene `pesos` en la diagonal, en `S3` la matriz `S` multiplicada por sí misma 3 veces, y en `d_S` un array con la diagonal de `S`.',
      starter: `import numpy as np

pesos = np.array([0.5, 2.0])
S = np.array([[2, 1],
              [0, 3]])
# Guarda en D la matriz diagonal de pesos, en S3 la matriz S multiplicada por sí misma 3 veces y en d_S la diagonal de S
D = None
S3 = None
d_S = None
`,
      checks: `_m = lambda x: isinstance(x, np.ndarray) and x.shape == (2, 2) and np.issubdtype(x.dtype, np.number)
_D = _m(D)
_S3 = _m(S3)
_d = isinstance(d_S, np.ndarray) and d_S.shape == (2,) and np.issubdtype(d_S.dtype, np.number)
check(_D, "\`D\` tiene que ser un array de NumPy de 2 filas y 2 columnas: la matriz diagonal.")
check((not _D) or bool(np.allclose(D, [[0.5, 0], [0, 2.0]])), "\`D\` tiene que tener \`pesos\` en la diagonal y ceros fuera.")
check(_S3, "\`S3\` tiene que ser un array de NumPy de 2 filas y 2 columnas: la potencia de la matriz.")
check((not _S3) or not np.allclose(S3, [[8, 1], [0, 27]]), "\`S3\` eleva cada número de \`S\` al cubo por separado, y eso no es multiplicar la matriz por sí misma. Para la potencia de una matriz sirve \`np.linalg.matrix_power\`.")
check((not _S3) or bool(np.allclose(S3, [[8, 1], [0, 27]])) or bool(np.allclose(S3, [[8, 19], [0, 27]])), "\`S3\` tiene que ser \`S\` multiplicada por sí misma tres veces, como matriz.")
check(_d, "\`d_S\` tiene que ser un array de NumPy con 2 números: la diagonal de \`S\`.")
check((not _d) or bool(np.allclose(d_S, [2, 3])), "\`d_S\` tiene que tener los números de la diagonal de \`S\`. \`np.diag\` extrae la diagonal de una matriz.")
`,
      reference: `import numpy as np

pesos = np.array([0.5, 2.0])
S = np.array([[2, 1],
              [0, 3]])
D = np.diag(pesos)
S3 = np.linalg.matrix_power(S, 3)
d_S = np.diag(S)
`,
    },
  },
  {
    id: 'autovectores.cal.4',
    title: 'Un bucle que repite un paso y normaliza',
    explain:
      'Un bucle `for _ in range(n):` repite `n` veces las líneas que tiene debajo con sangría. Cada vuelta puede cambiar una variable usando su propio valor anterior, por ejemplo `w = w + algo`.\n\n**Normalizar** un vector es dividirlo entre su longitud: `w / np.linalg.norm(w)` tiene la misma dirección que `w` y longitud 1. Si un paso se repite muchas veces y no se normaliza, los números pueden crecer hasta no caber en un decimal; normalizando en **cada** vuelta, el vector siempre mide 1.',
    example: `import numpy as np

u = np.array([3.0, 4.0])
print("longitud de u:", np.linalg.norm(u))

w = np.array([0.0, 2.0])
for paso in range(4):
    w = w + np.array([1.0, 0.0])
    w = w / np.linalg.norm(w)
    print("paso", paso, "->", w, "longitud", np.linalg.norm(w))
`,
    experiments: [
      'Cambia `range(4)` por `range(30)` y mira hacia dónde se acerca `w`.',
      'Borra la línea que divide entre la norma y ejecuta: ahora la longitud crece en cada paso.',
      'Cambia la división por `w = w / 2` y compara con `np.linalg.norm(w)`: dividir entre un número cualquiera no normaliza.',
      'Escribe `print(w)` después del bucle, sin sangría: la variable conserva su último valor.',
    ],
    task: {
      prompt:
        'Parte de `q`. Repite 5 veces estos dos pasos, en este orden: sumar a `q` el vector `np.array([0.0, 1.0])` y normalizar `q`. Guarda en `q_final` el vector que queda y en `longitud` su longitud.',
      starter: `import numpy as np

q = np.array([2.0, 0.0])
# Repite 5 veces: sumar a q el vector (0, 1) y normalizar q. Guarda en q_final el resultado y en longitud su longitud
q_final = None
longitud = None
`,
      checks: `_e = np.array([2.0, 0.0])
for _ in range(5):
    _e = _e + np.array([0.0, 1.0])
    _e = _e / np.linalg.norm(_e)
_q = isinstance(q_final, np.ndarray) and q_final.shape == (2,) and np.issubdtype(q_final.dtype, np.number)
_l = isinstance(longitud, (int, float, np.integer, np.floating)) and not isinstance(longitud, (bool, np.bool_))
check(_q, "\`q_final\` tiene que ser un array de NumPy con 2 números: el vector que queda al final.")
check((not _q) or bool(abs(np.linalg.norm(q_final) - 1) < 1e-9), "\`q_final\` no mide 1: falta dividir entre la norma, con \`np.linalg.norm\`, en cada vuelta del bucle.")
check((not _q) or abs(np.linalg.norm(q_final) - 1) >= 1e-9 or bool(np.allclose(q_final, _e)), "\`q_final\` mide 1, pero no es el vector esperado: en cada una de las 5 vueltas hay que sumar y después normalizar, y no normalizar solo al final.")
check(_l, "\`longitud\` tiene que ser un número: la longitud de \`q_final\`.")
check((not _l) or (not _q) or bool(np.isclose(longitud, np.linalg.norm(q_final))), "\`longitud\` tiene que ser la longitud de \`q_final\`, que se calcula con \`np.linalg.norm\`.")
`,
      reference: `import numpy as np

q = np.array([2.0, 0.0])
for _ in range(5):
    q = q + np.array([0.0, 1.0])
    q = q / np.linalg.norm(q)
q_final = q
longitud = np.linalg.norm(q_final)
`,
    },
  },
];
