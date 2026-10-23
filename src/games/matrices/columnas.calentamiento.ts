import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Columnas: lo nuevo de su ejercicio «Programar». */
export const columnasWarmup: WarmupStep[] = [
  {
    id: 'columnas.cal.1',
    title: 'Filas y columnas de una matriz: `M[i, j]`, `M[i]` y `M[:, j]`',
    explain:
      'Una matriz de NumPy se escribe **fila a fila**: `np.array([[1, 2, 3], [4, 5, 6]])` tiene 2 filas y 3 columnas, y `M.shape` lo dice así: `(2, 3)`, primero las filas y después las columnas.\n\nPara elegir dentro de ella se escriben las posiciones entre corchetes, separadas por una coma. Se cuenta desde 0:\n\n- `M[i, j]` es un número: el de la fila `i` y la columna `j`.\n- `M[i]` es la fila `i` entera.\n- `M[:, j]` es la columna `j` entera. El `:` significa «todas»: todas las filas, en la columna `j`.',
    example: `import numpy as np

M = np.array([[1, 2, 3],
              [4, 5, 6]])
print("forma:", M.shape)
print("M[1, 2] =", M[1, 2])
print("fila 0:", M[0])
print("columna 1:", M[:, 1])
`,
    experiments: [
      'Cambia `M[:, 1]` por `M[:, 2]`: ¿qué columna sale ahora?',
      'Añade `print(M[2])`. `M` solo tiene las filas 0 y 1, así que Python se para con un `IndexError`: lee qué dice el mensaje.',
      'Prueba `print(M[:, 0] * 10)`: una columna es un vector y se opera como cualquier otro.',
    ],
    task: {
      prompt:
        'Guarda en `fila` la fila 2 de `T` (la tercera, porque se cuenta desde 0), en `columna` su columna 0 y en `esquina` el número de abajo a la derecha.',
      starter: `import numpy as np

T = np.array([[2, 7, 1],
              [8, 3, 9],
              [4, 6, 5]])
# Guarda en fila la fila 2, en columna la columna 0 y en esquina el número de abajo a la derecha
fila = None
columna = None
esquina = None
`,
      checks: `def _vec(a):
    return isinstance(a, np.ndarray) and a.shape == (3,) and np.issubdtype(a.dtype, np.number)

check(_vec(fila), "\`fila\` tiene que ser un array de NumPy con 3 números: una fila de \`T\`.")
check((not _vec(fila)) or np.array_equal(fila, [4, 6, 5]), "\`fila\` tiene que ser la fila 2 de \`T\`, la de abajo: se cuenta desde 0, así que la fila 2 es la tercera.")
check(_vec(columna), "\`columna\` tiene que ser un array de NumPy con 3 números: una columna de \`T\`.")
check((not _vec(columna)) or not np.array_equal(columna, [2, 7, 1]), "\`columna\` vale (2, 7, 1): es la fila 0, no la columna 0. Para una columna hace falta \`:\` en el primer sitio.")
check((not _vec(columna)) or np.array_equal(columna, [2, 7, 1]) or np.array_equal(columna, [2, 8, 4]), "\`columna\` tiene que ser la columna 0 de \`T\`: sus números de arriba abajo.")
_num = isinstance(esquina, (int, float, np.integer, np.floating)) and not isinstance(esquina, bool)
check(_num, "\`esquina\` tiene que ser un solo número: el de la fila 2 y la columna 2.")
check((not _num) or esquina == 5, "\`esquina\` tiene que ser el número de abajo a la derecha: fila 2, columna 2.")
`,
      reference: `import numpy as np

T = np.array([[2, 7, 1],
              [8, 3, 9],
              [4, 6, 5]])
fila = T[2]
columna = T[:, 0]
esquina = T[2, 2]
`,
    },
  },
  {
    id: 'columnas.cal.2',
    title: '`np.column_stack`: poner vectores como columnas',
    explain:
      'Si metes dos vectores en `np.array([a, b])`, cada uno queda como una **fila**. Para que queden como **columnas**, NumPy tiene `np.column_stack([a, b])`: recibe una lista de vectores igual de largos y los coloca uno al lado del otro, el primero en la columna 0.\n\nOtra forma de llegar a lo mismo: apilarlos como filas y trasponer con `.T`, que cambia las filas por las columnas.',
    example: `import numpy as np

a = np.array([1, 2, 3])
b = np.array([10, 20, 30])

print("como filas:")
print(np.array([a, b]))
print("como columnas:")
print(np.column_stack([a, b]))
print("como filas y después .T:")
print(np.array([a, b]).T)
`,
    experiments: [
      'Añade un tercer vector, `c = np.array([7, 8, 9])`, y escribe `print(np.column_stack([a, b, c]))`: ¿cuántas columnas tiene?',
      'Cambia el orden: `np.column_stack([b, a])`. La columna 0 es siempre el primer vector de la lista.',
      'Mira la forma con `print(np.column_stack([a, b]).shape)`: 3 filas y 2 columnas.',
      'Cambia `a` por `np.array([1, 2])`, que tiene un número menos que `b`: Python se para, porque las columnas de una matriz tienen que ser igual de largas.',
    ],
    task: {
      prompt:
        'Guarda en `P` la matriz de 3 filas y 2 columnas cuya columna 0 es `u` y cuya columna 1 es `w`.',
      starter: `import numpy as np

u = np.array([1, 0, 4])
w = np.array([2, 5, -1])
# Guarda en P la matriz cuyas columnas son u y w
P = None
`,
      checks: `_ok = isinstance(P, np.ndarray) and np.issubdtype(P.dtype, np.number)
check(_ok and P.shape in ((3, 2), (2, 3)), "\`P\` tiene que ser un array de NumPy de 3 filas y 2 columnas.")
check((not _ok) or P.shape != (2, 3), "\`P\` tiene 2 filas y 3 columnas: \`u\` y \`w\` han quedado como filas, y tienen que ir como columnas.")
check((not _ok) or P.shape != (3, 2) or np.array_equal(P, [[1, 2], [0, 5], [4, -1]]), "\`P\` no tiene las columnas pedidas: la columna 0 tiene que ser \`u\` y la columna 1, \`w\`.")
`,
      reference: `import numpy as np

u = np.array([1, 0, 4])
w = np.array([2, 5, -1])
P = np.column_stack([u, w])
`,
    },
  },
  {
    id: 'columnas.cal.3',
    title: '`np.eye(n)`: la matriz identidad',
    explain:
      '`np.eye(n)` crea la **identidad** de `n` filas y `n` columnas: unos en la diagonal, de arriba a la izquierda a abajo a la derecha, y ceros en el resto. Sus columnas son $\\hat{\\imath}$, $\\hat{\\jmath}$… y multiplicarla por un vector con `@` lo deja igual.\n\nSus números salen escritos como `1.` y `0.`: son decimales (`1.0`, `0.0`). NumPy la crea así, y para las cuentas da igual.',
    example: `import numpy as np

I = np.eye(3)
print(I)
v = np.array([4, -2, 7])
print("I @ v =", I @ v)
`,
    experiments: [
      'Cambia `np.eye(3)` por `np.eye(2)`. Ahora `I @ v` se para con un error: una matriz de 2 columnas solo se multiplica por vectores de 2 componentes.',
      'Escribe `print(5 * np.eye(2))`. ¿Qué le hace esa matriz a un vector? Pruébalo con `@`.',
      'Compara con `print(np.ones((2, 2)))`, una matriz llena de unos: no es la identidad.',
    ],
    task: {
      prompt:
        'Guarda en `I4` la identidad de 4 filas y 4 columnas, y en `doble` la matriz que multiplica por 2 cualquier vector de 4 componentes: el doble de la identidad.',
      starter: `import numpy as np

# Guarda en I4 la identidad de 4 filas y 4 columnas, y en doble el doble de esa identidad
I4 = None
doble = None
`,
      checks: `def _mat(a):
    return isinstance(a, np.ndarray) and a.shape == (4, 4) and np.issubdtype(a.dtype, np.number)

check(_mat(I4), "\`I4\` tiene que ser un array de NumPy de 4 filas y 4 columnas.")
check((not _mat(I4)) or np.allclose(I4, np.eye(4)), "\`I4\` tiene que ser la identidad: unos en la diagonal y ceros en el resto.")
check(_mat(doble), "\`doble\` tiene que ser un array de NumPy de 4 filas y 4 columnas.")
check((not _mat(doble)) or np.allclose(doble, 2 * np.eye(4)), "\`doble\` tiene que tener doses en la diagonal y ceros en el resto: así cada vector sale multiplicado por 2.")
`,
      reference: `import numpy as np

I4 = np.eye(4)
doble = 2 * I4
`,
    },
  },
  {
    id: 'columnas.cal.4',
    title: '`np.argmax`: dónde está el mayor',
    explain:
      '`np.max(x)` da el **valor** más grande de un array, y `np.argmax(x)` da su **posición**, contando desde 0. Si el mayor se repite, `np.argmax` da la primera posición en que aparece.\n\nCombinado con una columna, `np.argmax(M[:, j])` dice en qué fila está el mayor de la columna `j`.',
    example: `import numpy as np

notas = np.array([6, 9, 4, 9])
print("el mayor vale", np.max(notas))
print("y está en la posición", np.argmax(notas))

M = np.array([[3, 8],
              [7, 1],
              [5, 2]])
print("fila del mayor de la columna 0:", np.argmax(M[:, 0]))
`,
    experiments: [
      'Cambia la última nota por un `10` y vuelve a ejecutar: cambian el valor y la posición.',
      'Prueba `print(np.argmin(notas))`: la posición del menor.',
      'Busca el mayor de la columna 1 de `M`: cambia `M[:, 0]` por `M[:, 1]`.',
      'Prueba `print(np.argmax(M))`, sin elegir columna: NumPy recorre la matriz entera fila a fila, como si fuera un solo vector, y da la posición en ese recorrido.',
    ],
    task: {
      prompt:
        'Cada fila de `ventas` es un mes y cada columna, una tienda. Guarda en `mejor_mes` la posición del mes en que más vendió la tienda 1, y en `cuanto`, lo que vendió ese mes.',
      starter: `import numpy as np

# Filas: meses 0 a 3. Columnas: tiendas 0, 1 y 2
ventas = np.array([[12, 30, 7],
                   [15, 22, 9],
                   [11, 41, 8],
                   [19, 25, 6]])
mejor_mes = None
cuanto = None
`,
      checks: `_ent = isinstance(mejor_mes, (int, np.integer)) and not isinstance(mejor_mes, bool)
check(_ent, "\`mejor_mes\` tiene que ser un número entero: una posición, no una cantidad vendida.")
check((not _ent) or mejor_mes != 41, "\`mejor_mes\` vale 41, que es lo que se vendió, no la posición del mes. La posición la da \`np.argmax\`.")
check((not _ent) or mejor_mes != 7, "\`mejor_mes\` vale 7: es la posición del mayor recorriendo la tabla entera. Busca solo dentro de la columna de la tienda 1.")
check((not _ent) or mejor_mes in (7, 41) or mejor_mes == 2, "\`mejor_mes\` tiene que ser la fila del mayor de la columna 1 de \`ventas\`.")
_num = isinstance(cuanto, (int, float, np.integer, np.floating)) and not isinstance(cuanto, bool)
check(_num and cuanto == 41, "\`cuanto\` tiene que ser lo que vendió la tienda 1 en su mejor mes: el mayor de la columna 1.")
`,
      reference: `import numpy as np

ventas = np.array([[12, 30, 7],
                   [15, 22, 9],
                   [11, 41, 8],
                   [19, 25, 6]])
mejor_mes = np.argmax(ventas[:, 1])
cuanto = np.max(ventas[:, 1])
`,
    },
  },
];
