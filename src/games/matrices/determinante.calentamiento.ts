import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Determinante: lo nuevo de su ejercicio «Programar». */
export const determinanteWarmup: WarmupStep[] = [
  {
    id: 'determinante.cal.1',
    title: '`np.linalg.det`: el determinante de una matriz',
    explain:
      '`np.linalg.det(M)` calcula el **determinante** de `M`, que tiene que ser cuadrada: las mismas filas que columnas. Devuelve **un solo número decimal**: el factor por el que la matriz multiplica las áreas, con su signo.\n\nHay dos tropiezos:\n\n- Si `M` no es cuadrada (por ejemplo, 3 filas y 2 columnas), Python se para con un error: no existe su determinante.\n- El resultado se calcula con decimales binarios y casi nunca sale redondo. Para $\\begin{pmatrix}3&1\\\\2&4\\end{pmatrix}$ el valor exacto es $10$, pero NumPy da `10.000000000000002`. No es un fallo tuyo: es el redondeo de los decimales.',
    example: `import numpy as np

M = np.array([[3, 1],
              [2, 4]])
d = np.linalg.det(M)
print("determinante:", d)
print("a mano, 3*4 - 1*2 =", 3 * 4 - 1 * 2)

M2 = np.array([[2, 4],
               [3, 1]])
print("con las filas intercambiadas:", np.linalg.det(M2))
print("de la identidad:", np.linalg.det(np.eye(2)))
`,
    experiments: [
      'Cambia la segunda fila de `M` por `[6, 2]`, el doble de la primera: el determinante sale 0, porque una fila múltiplo de la otra aplasta el plano sobre una recta.',
      'Compara `d` con el de `M2`, que tiene las mismas filas en otro orden: el tamaño es el mismo y el signo cambia.',
      'Añade una fila `[1, 1]` al final de `M`: con 3 filas y 2 columnas, Python se para. Lee qué dice el mensaje.',
      'Escribe `print(abs(d))`: el área que gana una figura es el valor absoluto del determinante, sin signo.',
    ],
    task: {
      prompt:
        'Guarda en `d` el determinante de `K` y en `area` el área en que `K` convierte un cuadrado de lado 1: el valor absoluto del determinante, porque un área no tiene signo.',
      starter: `import numpy as np

K = np.array([[5, 3],
              [2, -1]])
# Guarda en d el determinante de K y en area su valor absoluto
d = None
area = None
`,
      checks: `_n = lambda x: isinstance(x, (int, float, np.integer, np.floating)) and not isinstance(x, (bool, np.bool_))
_d = _n(d)
_a = _n(area)
check(_d, "\`d\` tiene que ser un número: el determinante de \`K\`, que se calcula con \`np.linalg.det\`.")
check((not _d) or not np.isclose(d, 11), "\`d\` vale 11: tiene el tamaño correcto pero no el signo. El determinante es 5 por -1 menos 3 por 2, y sale negativo.")
check((not _d) or np.isclose(d, 11) or np.isclose(d, -11), "\`d\` tiene que ser el determinante de \`K\`: el producto de la diagonal principal menos el de la otra diagonal.")
check(_a, "\`area\` tiene que ser un número: el valor absoluto de \`d\`.")
check((not _a) or not np.isclose(area, -11), "\`area\` sale negativa, y un área no tiene signo. Falta el valor absoluto, con \`abs\` o con \`np.abs\`.")
check((not _a) or np.isclose(area, 11) or np.isclose(area, -11), "\`area\` tiene que valer 11: el tamaño del determinante de \`K\`, sin signo.")
`,
      reference: `import numpy as np

K = np.array([[5, 3],
              [2, -1]])
d = np.linalg.det(K)
area = abs(d)
`,
    },
  },
  {
    id: 'determinante.cal.2',
    title: '`round(x, n)` y `np.isclose`: decimales que casi coinciden',
    explain:
      'Con decimales, dos números que en matemáticas son iguales pueden diferir en la última cifra, y entonces `==` da `False`. Hay dos remedios:\n\n- `round(x, n)` redondea `x` a `n` decimales y devuelve un decimal. Sin el segundo argumento, `round(x)` devuelve un número **entero**.\n- `np.isclose(x, y)` dice `True` si `x` e `y` se parecen salvo un error diminuto. Devuelve un solo `True` o `False`.\n\nElige según lo que necesites: `round` cuando quieres el número limpio para mostrarlo o seguir calculando, `np.isclose` cuando solo quieres saber si coinciden.',
    example: `import numpy as np

x = 0.1 + 0.7
print("0.1 + 0.7 =", x)
print("¿es igual a 0.8 con ==?", x == 0.8)
print("¿es casi igual a 0.8?", np.isclose(x, 0.8))
print("redondeado a 2 decimales:", round(x, 2))

d = np.linalg.det(np.array([[2, 5], [1, 4]]))
print("determinante:", d)
print("redondeado a entero:", round(d))
print("redondeado a 3 decimales:", round(d, 3))
`,
    experiments: [
      'Cambia `round(x, 2)` por `round(x, 16)`: con tantas cifras el redondeo ya no oculta el error. Baja el número poco a poco hasta que el error desaparezca.',
      'Escribe `print(round(d, 3) == 3)` y compáralo con `print(d == 3)`: el redondeo hace que `==` funcione.',
      'Prueba `np.isclose(1.0, 1.001)` y después `np.isclose(1.0, 1.0000000001)`: solo una de las dos da `True`, porque la diferencia tiene que ser diminuta.',
      'Escribe `print(round(2.5))` y `print(round(3.5))`: Python redondea los medios al par más cercano, no siempre hacia arriba.',
    ],
    task: {
      prompt:
        'Guarda en `redondeado` el valor de `total` redondeado a 2 decimales, con `round`, y en `casi_igual` si `total` coincide con 0,6, comparado con `np.isclose` (un solo `True` o `False`).',
      starter: `import numpy as np

total = 0.1 + 0.2 + 0.3
# Guarda en redondeado total con 2 decimales y en casi_igual si total coincide con 0.6 (con np.isclose)
redondeado = None
casi_igual = None
`,
      checks: `_n = isinstance(redondeado, (int, float, np.integer, np.floating)) and not isinstance(redondeado, (bool, np.bool_))
_b = isinstance(casi_igual, (bool, np.bool_))
check(_n, "\`redondeado\` tiene que ser un número: \`total\` redondeado a 2 decimales con \`round\`.")
check((not _n) or redondeado != total, "\`redondeado\` sigue valiendo lo mismo que \`total\`, con el error en las últimas cifras. Falta pasar por \`round\` con el número de decimales como segundo argumento.")
check((not _n) or redondeado == 0.6 or redondeado == total, "\`redondeado\` tiene que valer 0,6: \`total\` con solo 2 decimales.")
check(_b, "\`casi_igual\` tiene que ser un solo \`True\` o \`False\`: el resultado de \`np.isclose\`.")
check((not _b) or bool(casi_igual), "\`casi_igual\` vale \`False\`: \`total\` y 0,6 solo difieren en el redondeo. Compáralos con \`np.isclose\` y no con \`==\`.")
`,
      reference: `import numpy as np

total = 0.1 + 0.2 + 0.3
redondeado = round(total, 2)
casi_igual = np.isclose(total, 0.6)
`,
    },
  },
  {
    id: 'determinante.cal.3',
    title: 'Restar vectores y armar una matriz con sus filas',
    explain:
      'Los arrays de NumPy se restan **componente a componente**: `np.array([5, 1]) - np.array([2, 0])` da `[3, 1]`. Así se obtiene el vector que va de un punto a otro: `q - p` es la flecha que sale de `p` y llega a `q`.\n\nPara juntar dos vectores como **filas** de una matriz se mete la lista de los dos en `np.array`: `np.array([u, v])` tiene a `u` en la fila 0 y a `v` en la fila 1. Si los dos vectores tienen 2 números, la matriz es de 2 filas y 2 columnas, cuadrada, y ya se le puede pedir el determinante.\n\nEl orden importa: si intercambias las dos filas, el determinante cambia de signo.',
    example: `import numpy as np

p = np.array([2, 0])
q = np.array([5, 1])
r = np.array([3, 3])

lado1 = q - p
lado2 = r - p
print("lado1:", lado1)
print("lado2:", lado2)

M = np.array([lado1, lado2])
print("matriz con los lados como filas:")
print(M)
print("determinante:", np.linalg.det(M))
`,
    experiments: [
      'Cambia `np.array([lado1, lado2])` por `np.array([lado2, lado1])`: el determinante cambia de signo.',
      'Cambia `r` por `np.array([8, 2])`, que está alineado con `p` y `q`: `lado2` es el doble de `lado1` y el determinante sale 0.',
      'Escribe `print(p + q)` y `print(2 * p)`: sumar y multiplicar también van componente a componente.',
      'Cambia `p` por `np.array([2, 0, 1])`, que tiene 3 números, y ejecuta: no se puede restar `q - p` porque no tienen el mismo número de componentes.',
    ],
    task: {
      prompt:
        'Los puntos `P`, `Q` y `R` están dados. Guarda en `u` el vector que va de `P` a `Q`, en `v` el que va de `P` a `R`, en `M` la matriz de 2 filas y 2 columnas con `u` en la primera fila y `v` en la segunda, y en `d` su determinante.',
      starter: `import numpy as np

P = np.array([3, 1])
Q = np.array([4, 6])
R = np.array([7, 2])
# Guarda en u el vector de P a Q, en v el de P a R, en M la matriz con u y v como filas y en d su determinante
u = None
v = None
M = None
d = None
`,
      checks: `def _vec(a):
    return isinstance(a, np.ndarray) and a.shape == (2,) and np.issubdtype(a.dtype, np.number)

_m = isinstance(M, np.ndarray) and M.shape == (2, 2) and np.issubdtype(M.dtype, np.number)
_d = isinstance(d, (int, float, np.integer, np.floating)) and not isinstance(d, (bool, np.bool_))
check(_vec(u), "\`u\` tiene que ser un array de NumPy con 2 números: el vector que va de \`P\` a \`Q\`.")
check((not _vec(u)) or not np.array_equal(u, [-1, -5]), "\`u\` va de \`Q\` a \`P\`, al revés. El vector que va de \`P\` a \`Q\` es \`Q - P\`: el destino menos el origen.")
check((not _vec(u)) or np.array_equal(u, [-1, -5]) or np.array_equal(u, [1, 5]), "\`u\` tiene que ser lo que se obtiene de restar \`P\` a \`Q\`, componente a componente.")
check(_vec(v), "\`v\` tiene que ser un array de NumPy con 2 números: el vector que va de \`P\` a \`R\`.")
check((not _vec(v)) or np.array_equal(v, [4, 1]), "\`v\` tiene que ser lo que se obtiene de restar \`P\` a \`R\`, componente a componente.")
check(_m, "\`M\` tiene que ser un array de NumPy de 2 filas y 2 columnas.")
check((not _m) or not np.array_equal(M, [[1, 4], [5, 1]]), "\`M\` tiene \`u\` y \`v\` como columnas. Aquí tienen que ir como filas: \`np.array([u, v])\` los coloca así.")
check((not _m) or np.array_equal(M, [[1, 5], [4, 1]]), "\`M\` tiene que tener \`u\` en la primera fila y \`v\` en la segunda.")
check(_d, "\`d\` tiene que ser un número: el determinante de \`M\`, que se calcula con \`np.linalg.det\`.")
check((not _d) or not np.isclose(d, 19), "\`d\` vale 19, el valor con el signo contrario. Si las filas están en otro orden, el determinante cambia de signo: \`u\` va primero.")
check((not _d) or np.isclose(d, 19) or np.isclose(d, -19), "\`d\` tiene que ser el determinante de \`M\`.")
`,
      reference: `import numpy as np

P = np.array([3, 1])
Q = np.array([4, 6])
R = np.array([7, 2])
u = Q - P
v = R - P
M = np.array([u, v])
d = np.linalg.det(M)
`,
    },
  },
  {
    id: 'determinante.cal.4',
    title: '`np.linalg.det` de varias matrices a la vez',
    explain:
      'Un array de forma `(5, 2, 2)` es una pila de 5 matrices de 2 filas y 2 columnas. Si se lo das a `np.linalg.det`, calcula **un determinante por matriz** y devuelve un array de 5 números.\n\nEse array se puede comparar de golpe: `dets > 1` da un array de `True` y `False`, uno por determinante. Con ese array de verdad puedes:\n\n- **contar**: `(dets > 1).sum()` suma los `True` como si fueran unos;\n- **elegir**: `dets[dets > 1]` se queda solo con los determinantes que cumplen la condición.\n\nPara medir el tamaño sin importar el signo, usa `np.abs(dets)`.',
    example: `import numpy as np

Ms = np.array([[[2, 0], [0, 1]],
               [[1, 1], [1, 1]],
               [[0, 3], [-1, 0]]])
print("forma:", Ms.shape)

dets = np.linalg.det(Ms)
print("determinantes:", dets)
print("¿positivos?", dets > 0)
print("cuántos son positivos:", (dets > 0).sum())
print("solo los positivos:", dets[dets > 0])
`,
    experiments: [
      'Cambia `dets > 0` por `dets < 3` en las tres líneas: ¿cuántos cumplen ahora la condición?',
      'Escribe `print(np.abs(dets))` y `print(np.abs(dets) > 2)`: ¿qué cambia si el signo no cuenta?',
      'Escribe `print(Ms[0])`: la primera matriz de la pila, de 2 filas y 2 columnas.',
      'Escribe `print(np.linalg.det(Ms[0]))` y compáralo con la primera posición de `dets`: es el mismo número.',
    ],
    task: {
      prompt:
        'Cada matriz de `Ms` es una capa lineal de juguete. Guarda en `dets` los 5 determinantes, en `grandes` un array de 5 valores `True` o `False` que diga qué capas multiplican las áreas por más de 1 (el valor absoluto del determinante, mayor que 1) y en `cuantas` cuántas son, como entero.',
      starter: `import numpy as np

Ms = np.array([
    [[3, 0], [0, 2]],
    [[1, 0], [0, 0.5]],
    [[0, 2], [-2, 0]],
    [[1, 2], [2, 1]],
    [[1, 0], [0, -0.2]],
])
# Guarda en dets los determinantes, en grandes qué capas tienen |det| mayor que 1 y en cuantas cuántas son
dets = None
grandes = None
cuantas = None
`,
      checks: `_d = isinstance(dets, np.ndarray) and dets.shape == (5,) and np.issubdtype(dets.dtype, np.number)
_g = isinstance(grandes, np.ndarray) and grandes.shape == (5,) and grandes.dtype == bool
_c = isinstance(cuantas, (int, np.integer)) and not isinstance(cuantas, (bool, np.bool_))
_want = [True, False, True, True, False]
_got = [bool(x) for x in grandes] if _g else []
check(_d, "\`dets\` tiene que ser un array de NumPy con 5 números: un determinante por matriz de \`Ms\`.")
check((not _d) or np.allclose(dets, np.linalg.det(Ms)), "\`dets\` tiene que tener el determinante de cada matriz de \`Ms\`, en el mismo orden. \`np.linalg.det\` acepta la pila entera.")
check(_g, "\`grandes\` tiene que ser un array de NumPy con 5 valores \`True\` o \`False\`, uno por matriz.")
check((not _g) or _got != [True, False, True, False, False], "\`grandes\` deja fuera una capa con determinante negativo muy grande. Una capa que da la vuelta al plano también cambia las áreas: hay que mirar el valor absoluto, con \`np.abs\`.")
check((not _g) or _got == _want or _got == [True, False, True, False, False], "\`grandes\` tiene que ser \`True\` solo donde el valor absoluto del determinante es mayor que 1: la primera, la tercera y la cuarta capa.")
check(_c, "\`cuantas\` tiene que ser un número entero: cuántos \`True\` hay en \`grandes\`.")
check((not _c) or not _g or _got != _want or cuantas == 3, "\`cuantas\` tiene que valer 3: son los \`True\` de \`grandes\`. Para contarlos sirve \`.sum()\`.")
`,
      reference: `import numpy as np

Ms = np.array([
    [[3, 0], [0, 2]],
    [[1, 0], [0, 0.5]],
    [[0, 2], [-2, 0]],
    [[1, 2], [2, 1]],
    [[1, 0], [0, -0.2]],
])
dets = np.linalg.det(Ms)
grandes = np.abs(dets) > 1
cuantas = int(grandes.sum())
`,
    },
  },
];
