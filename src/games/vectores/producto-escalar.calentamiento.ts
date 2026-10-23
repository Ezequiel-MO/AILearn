import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto El producto escalar: lo nuevo de su ejercicio «Programar». */
export const productoEscalarWarmup: WarmupStep[] = [
  {
    id: 'producto-escalar.cal.1',
    title: '`@` y `np.dot`: el producto escalar de dos vectores',
    explain:
      'Para NumPy, `u @ v` (o `np.dot(u, v)`, que es lo mismo) multiplica las componentes de dos en dos y **suma** los productos. Con dos vectores del mismo largo devuelve **un número**: su producto escalar.\n\nNo lo confundas con `u * v`, que multiplica componente a componente y deja un vector con el mismo número de componentes: no suma nada.\n\nCon una matriz a la izquierda, `M @ v` hace el producto escalar de **cada fila** de `M` con `v` y devuelve un vector con un número por fila. La matriz va siempre delante.',
    example: `import numpy as np

pesos = np.array([2, 3, 5])
notas = np.array([8, 6, 9])
print("componente a componente:", pesos * notas)
print("producto escalar:", pesos @ notas)
print("lo mismo con np.dot:", np.dot(pesos, notas))

tabla = np.array([[1, 0, 0],
                  [0, 1, 1]])
print("cada fila de la tabla por las notas:", tabla @ notas)
`,
    experiments: [
      'Suma a mano los tres números de `pesos * notas`: es lo que da `pesos @ notas`.',
      'Cambia `notas` por `np.array([8, 6])`, con una componente menos: Python se para con un `ValueError`, porque las dos listas tienen que ser igual de largas.',
      'Prueba `print(notas @ tabla)`, con la matriz detrás: también se para. La matriz va a la izquierda de `@`.',
    ],
    task: {
      prompt:
        'Cada posición de `unidades` y de `precios` es un artículo del carrito. Guarda en `gasto` lo que cuesta todo el carrito (un único número) y en `por_articulo` lo que cuesta cada artículo (un array con una cifra por artículo).',
      starter: `import numpy as np

unidades = np.array([3, 1, 2])
precios = np.array([4, 10, 5])
# Guarda en gasto lo que cuesta todo el carrito y en por_articulo lo que cuesta cada artículo
gasto = None
por_articulo = None
`,
      checks: `def _n(x):
    return (isinstance(x, (int, float, np.number)) and not isinstance(x, bool)) or (isinstance(x, np.ndarray) and x.ndim == 0 and np.issubdtype(x.dtype, np.number))

def _vec(a):
    return isinstance(a, np.ndarray) and a.shape == (3,) and np.issubdtype(a.dtype, np.number)

check(_n(gasto) or _vec(gasto), "\`gasto\` tiene que ser un único número: lo que cuesta todo el carrito.")
check(not _vec(gasto), "\`gasto\` tiene 3 números, uno por artículo: has multiplicado casilla a casilla con \`*\`, y falta sumarlos para tener un único número.")
check((not _n(gasto)) or np.isclose(gasto, 32), "\`gasto\` tiene que valer 32: multiplica las unidades por el precio de cada artículo, de dos en dos, y suma los tres productos.")
check(_vec(por_articulo), "\`por_articulo\` tiene que ser un array de NumPy con 3 números: lo que cuesta cada artículo.")
check((not _n(por_articulo)) or not np.isclose(por_articulo, 32), "\`por_articulo\` vale 32, que es el gasto total: aquí se piden los tres gastos por separado, sin sumarlos.")
check((not _vec(por_articulo)) or np.allclose(por_articulo, [12, 10, 10]), "\`por_articulo\` tiene que valer (12, 10, 10): las unidades de cada artículo por su precio, casilla a casilla.")
`,
      reference: `import numpy as np

unidades = np.array([3, 1, 2])
precios = np.array([4, 10, 5])
gasto = unidades @ precios
por_articulo = unidades * precios
`,
    },
  },
  {
    id: 'producto-escalar.cal.2',
    title: '`def` y `return`: tu propia función',
    explain:
      '`def` guarda un cálculo con nombre para repetirlo con otros datos. Lo que va entre paréntesis son los datos que la función **recibe**, el cuerpo va sangrado (4 espacios) y `return` dice qué **devuelve**.\n\nDefinir la función no la ejecuta: se ejecuta cuando la **llamas**, como en `area(6, 4)`. Y si te olvidas del `return`, no hay error: la función devuelve `None`, que es «nada». Los nombres de dentro (`resultado`) solo existen dentro.',
    example: `def area(base, altura):
    resultado = base * altura / 2
    return resultado

print("triángulo de 6 por 4:", area(6, 4))
print("triángulo de 10 por 3:", area(10, 3))

def sin_return(x):
    y = x + 1

print("una función sin return devuelve:", sin_return(5))
`,
    experiments: [
      'Llama a `area` con otros dos números y mira el resultado: la función sirve para cualquier pareja.',
      'Quita la línea `return resultado` de `area`: ahora `print` enseña `None`.',
      'Añade al final `print(resultado)`: Python se para con un `NameError`, porque `resultado` solo existe dentro de `area`.',
    ],
    task: {
      prompt:
        'Escribe la función `recargo(precio, porcentaje)`, que devuelva el precio con ese porcentaje de recargo añadido. Por ejemplo, `recargo(200, 10)` es un precio de 200 más el 10 por ciento: 220.',
      starter: `import numpy as np

def recargo(precio, porcentaje):
    # Devuelve el precio con el recargo añadido (el porcentaje es "por cada 100")
    return None
`,
      checks: `def _n(x):
    return (isinstance(x, (int, float, np.number)) and not isinstance(x, bool)) or (isinstance(x, np.ndarray) and x.ndim == 0 and np.issubdtype(x.dtype, np.number))

def _r(p, q):
    try:
        return recargo(p, q)
    except Exception:
        return None

_a = _r(80, 25)
_b = _r(200, 10)
_c = _r(50, 0)
check(_n(_a), "\`recargo\` tiene que devolver un número con \`return\`: ahora devuelve otra cosa, o falla.")
check((not _n(_a)) or not np.isclose(_a, 20), "\`recargo(80, 25)\` ha dado 20, que es solo el recargo. La función tiene que devolver el precio ya con el recargo añadido.")
check((not _n(_a)) or not np.isclose(_a, 2080), "\`recargo(80, 25)\` ha dado 2080: el 25 por ciento son 25 de cada 100, es decir, el número 25 dividido entre 100.")
check((not _n(_a)) or np.isclose(_a, 100) or np.isclose(_a, 20) or np.isclose(_a, 2080), "\`recargo(80, 25)\` tiene que dar 100: el precio más su 25 por ciento.")
check((not _n(_a)) or (not np.isclose(_a, 100)) or (_n(_b) and np.isclose(_b, 220) and _n(_c) and np.isclose(_c, 50)), "\`recargo\` acierta con 80 y 25, pero no con otros datos: tiene que usar \`precio\` y \`porcentaje\`, no los números del ejemplo. Con 200 y 10 da 220, y con 50 y 0 da 50.")
`,
      reference: `import numpy as np

def recargo(precio, porcentaje):
    return precio + precio * porcentaje / 100
`,
    },
  },
  {
    id: 'producto-escalar.cal.3',
    title: '`zip(a, b)`: recorrer dos listas a la par',
    explain:
      '`for x, y in zip(a, b):` recorre `a` y `b` a la vez: en cada vuelta, `x` es el elemento de `a` y `y` el de `b` que ocupa la misma posición. Si una lista es más corta, se para al acabar la corta.\n\nPara **acumular** un resultado se prepara una variable antes del bucle (`total = 0`) y en cada vuelta se le añade algo (`total += ...`). El `return` va **después** del bucle, a la sangría de `for`: si va dentro, la función sale en la primera vuelta.',
    example: `def suma_de_diferencias(a, b):
    total = 0
    for x, y in zip(a, b):
        total += y - x
    return total

print("parejas:", list(zip([3, 1, 4], [10, 20, 30])))
print("suma de diferencias:", suma_de_diferencias([3, 1, 4], [10, 20, 30]))
print("con una sola pareja:", suma_de_diferencias([5], [2]))
`,
    experiments: [
      'Cambia la tercera lista por `[10, 20]`: `zip` se queda con las dos primeras parejas.',
      'Sangra `return total` un nivel más, para que quede dentro del `for`: ¿cuánto da ahora la suma? La función sale en la primera vuelta.',
      'Cambia `total = 0` por `total = 100` y observa de dónde parte la cuenta.',
    ],
    task: {
      prompt:
        'Escribe la función `distancia_taxi(a, b)`: la suma de las diferencias **sin signo** entre las componentes que se corresponden de `a` y `b`, para listas de cualquier largo. Con `a = [1, 5]` y `b = [4, 3]` son 3 y 2, y la función da 5. Python da el valor sin signo de un número con `abs(n)`.',
      starter: `def distancia_taxi(a, b):
    # Devuelve la suma de |x - y| para cada pareja de componentes
    return None
`,
      checks: `def _n(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)

def _d(a, b):
    try:
        return distancia_taxi(a, b)
    except Exception:
        return None

_r2 = _d([1, 5], [4, 3])
_r1 = _d([5], [2])
_r4 = _d([0, 0, 0, 0], [1, -2, 3, -4])
_r0 = _d([2, 7, 1], [2, 7, 1])
_t = _d([4, 1], [1, 5])
check(any(_n(r) or isinstance(r, np.number) for r in [_r2, _r1, _r4, _r0]), "\`distancia_taxi\` tiene que devolver un número con \`return\`: ahora devuelve otra cosa, o falla.")
check((not _n(_r2)) or _r2 != 1, "\`distancia_taxi([1, 5], [4, 3])\` ha dado 1: las diferencias sin signo son 3 y 2. Suma cada una, no solo la última ni la resta de ambas.")
check((not _n(_r2)) or _r2 == 5, "\`distancia_taxi([1, 5], [4, 3])\` tiene que dar 5: 3 más 2. Usa \`abs\` para que ninguna diferencia reste.")
check((not _n(_r2)) or _r2 != 5 or _n(_t) and _t == 7, "\`distancia_taxi([4, 1], [1, 5])\` tiene que dar 7: cada diferencia se toma sin signo, sea cual sea la lista mayor.")
check((not _n(_r2)) or _r2 != 5 or (_n(_r1) and _r1 == 3 and _n(_r4) and _r4 == 10 and _n(_r0) and _r0 == 0), "\`distancia_taxi\` funciona con 2 componentes, pero no con otros largos: recorre las parejas con \`zip\` y acumula, sea cual sea el número de componentes.")
`,
      reference: `def distancia_taxi(a, b):
    total = 0
    for x, y in zip(a, b):
        total += abs(x - y)
    return total
`,
    },
  },
  {
    id: 'producto-escalar.cal.4',
    title: '`np.isclose`: comparar decimales con tolerancia',
    explain:
      'Los ordenadores guardan los decimales con redondeos diminutos, así que dos números que en matemáticas son iguales pueden no serlo para `==`. Por eso, con decimales **no se compara con `==`**.\n\n`np.isclose(a, b)` dice `True` si `a` y `b` están a una distancia minúscula, mucho menor que una milésima, y `False` si no. Sirve igual para comparar con 0: `np.isclose(x, 0)`.\n\nOjo: la tolerancia es pequeña a propósito. Un número que solo se parece de lejos a otro da `False`.',
    example: `import numpy as np

suma = 0.1 + 0.2
print("0.1 + 0.2 vale:", suma)
print("con ==:", suma == 0.3)
print("con np.isclose:", np.isclose(suma, 0.3))

raiz = np.sqrt(2) ** 2
print("la raíz de 2 al cuadrado vale:", raiz)
print("con == contra 2:", raiz == 2)
print("con np.isclose contra 2:", np.isclose(raiz, 2))
print("1.0 y 1.1:", np.isclose(1.0, 1.1))
`,
    experiments: [
      'Cambia `0.3` por `0.4` en las dos comparaciones: ahora las dos dan `False`, porque la diferencia ya no es un redondeo.',
      'Prueba `np.isclose(1, 1.000001)` y después `np.isclose(1, 1.001)`: una diferencia de una millonésima es un redondeo, una de una milésima ya no.',
      'Prueba `np.isclose(0.0000000001, 0)` y `np.isclose(0.001, 0)`: cerca de 0 la tolerancia es todavía más pequeña.',
    ],
    task: {
      prompt:
        '`x` vale `np.sqrt(5) ** 2`, que en matemáticas es 5. Guarda en `igual` lo que da compararlo con 5 usando `==` y en `casi_igual` lo que da compararlo con 5 con tolerancia.',
      starter: `import numpy as np

x = np.sqrt(5) ** 2
# Guarda en igual la comparación de x con 5 usando ==, y en casi_igual la comparación con tolerancia
igual = None
casi_igual = None
`,
      checks: `_i = isinstance(igual, (bool, np.bool_))
_c = isinstance(casi_igual, (bool, np.bool_))
check(_i, "\`igual\` tiene que ser \`True\` o \`False\`: el resultado de comparar \`x\` con 5 usando \`==\`.")
check((not _i) or not bool(igual), "\`igual\` vale \`True\`, pero \`x\` no es exactamente 5: tiene un redondeo diminuto. Compara \`x\` con 5 usando \`==\`, sin tolerancia.")
check(_c, "\`casi_igual\` tiene que ser \`True\` o \`False\`: el resultado de comparar \`x\` con 5 con tolerancia.")
check((not _c) or bool(casi_igual), "\`casi_igual\` vale \`False\`: compara con una función que ignore los redondeos diminutos: \`np.isclose\`.")
`,
      reference: `import numpy as np

x = np.sqrt(5) ** 2
igual = x == 5
casi_igual = np.isclose(x, 5)
`,
    },
  },
];
