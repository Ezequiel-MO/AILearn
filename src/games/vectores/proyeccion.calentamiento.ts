import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto La proyección: lo nuevo de su ejercicio «Programar». */
export const proyeccionWarmup: WarmupStep[] = [
  {
    id: 'proyeccion.cal.1',
    title: '`return a, b`: una función con dos resultados',
    explain:
      'Una función puede devolver varios valores a la vez, separados por comas: `return a, b`. Python los entrega juntos, en una **tupla**.\n\nAl llamarla, se reparten en variables con `x, y = f(...)`: el primero va a `x` y el segundo a `y`, en ese orden. Si los nombres de la izquierda no son tantos como los valores devueltos, Python se para con un `ValueError`.\n\nRecuerda que `def` solo define la función: hasta que no la llamas, no se ejecuta nada.',
    example: `def extremos(lista):
    return min(lista), max(lista)

menor, mayor = extremos([7, 2, 9, 4])
print("el menor es", menor)
print("el mayor es", mayor)
print("la tupla entera:", extremos([7, 2, 9, 4]))
`,
    experiments: [
      'Cambia el orden de los nombres: `mayor, menor = extremos([7, 2, 9, 4])`. ¿Cuál es el menor ahora? Se reparten por orden, no por nombre.',
      'Escribe `a, b, c = extremos([7, 2, 9, 4])`: Python se para con un `ValueError`, porque la función solo devuelve dos valores.',
      'Escribe `resultado = extremos([7, 2, 9, 4])` y después `print(resultado[0])`: con un solo nombre, la tupla entera queda en una variable, y se saca cada valor con su posición.',
    ],
    task: {
      prompt:
        'Completa la función `mayor_y_lugar(x)`, que devuelva dos valores: el mayor número de `x` y su posición. Después guarda en `valor` y `lugar` los dos valores que devuelve `mayor_y_lugar(notas)`, repartidos con una sola llamada.',
      starter: `import numpy as np

def mayor_y_lugar(x):
    # Devuelve (el mayor valor de x, su posición)
    return None, None

notas = np.array([6, 9, 4, 7])
# Guarda en valor y lugar lo que devuelve mayor_y_lugar(notas), en una sola llamada
valor = None
lugar = None
`,
      checks: `def _n(x):
    return (isinstance(x, (int, float, np.number)) and not isinstance(x, bool)) or (isinstance(x, np.ndarray) and x.ndim == 0 and np.issubdtype(x.dtype, np.number))

def _f(v):
    try:
        return mayor_y_lugar(np.array(v))
    except Exception:
        return None

_a = _f([6, 9, 4, 7])
_b = _f([3, 1, 8])
_dos = isinstance(_a, tuple) and len(_a) == 2 and _n(_a[0]) and _n(_a[1])
check(_dos, "\`mayor_y_lugar\` tiene que devolver dos números con un solo \`return\`, separados por una coma: el mayor y su posición.")
check((not _dos) or (_a[0] != 1 or _a[1] != 9), "\`mayor_y_lugar\` devuelve primero la posición y después el valor: el orden pedido es primero el mayor y después su posición.")
check((not _dos) or (_a[0] == 9 and _a[1] == 1) or (_a[0] == 1 and _a[1] == 9), "\`mayor_y_lugar([6, 9, 4, 7])\` tiene que devolver 9 y 1: el mayor es 9, y está en la posición 1.")
_dos2 = isinstance(_b, tuple) and len(_b) == 2 and _n(_b[0]) and _n(_b[1])
check((not (_dos and _a[0] == 9 and _a[1] == 1)) or (_dos2 and _b[0] == 8 and _b[1] == 2), "\`mayor_y_lugar\` funciona con \`notas\`, pero no con otros datos: tiene que usar \`x\`, no los números del ejemplo.")
check(_n(valor), "\`valor\` tiene que ser un único número: el mayor de \`notas\`.")
check(not isinstance(valor, tuple), "\`valor\` guarda los dos resultados juntos, en una tupla. Reparte la llamada en dos nombres: \`primero, segundo = ...\`.")
check((not _n(valor)) or not _n(lugar) or not (valor == 1 and lugar == 9), "\`valor\` y \`lugar\` están al revés: el primer valor que devuelve la función es el mayor y el segundo, su posición.")
check((not _n(valor)) or valor == 9, "\`valor\` tiene que valer 9: el mayor de \`notas\`.")
check(_n(lugar), "\`lugar\` tiene que ser un único número: la posición del mayor de \`notas\`.")
check((not _n(lugar)) or lugar == 1, "\`lugar\` tiene que valer 1: el 9 ocupa la posición 1, porque Python cuenta desde 0.")
`,
      reference: `import numpy as np

def mayor_y_lugar(x):
    return np.max(x), np.argmax(x)

notas = np.array([6, 9, 4, 7])
valor, lugar = mayor_y_lugar(notas)
`,
    },
  },
  {
    id: 'proyeccion.cal.2',
    title: 'Número por vector: `k * v` y el orden de `@`, `*` y `/`',
    explain:
      'Multiplicar un número por un array reparte el número por todas las componentes: `3 * v` es otro vector. El producto escalar `u @ v` da un número, y ese número puede a su vez multiplicar a otro vector: `(u @ v) * w`.\n\n`@`, `*` y `/` tienen la misma prioridad y se hacen **de izquierda a derecha**. Así `u @ v * w` es `(u @ v) * w`, y `k / 2 * w` es `(k / 2) * w`. Para cambiar el orden hacen falta paréntesis.\n\nCuidado con la división: `w / k` reparte la división por las componentes de `w`, pero `k / (2 * w)` divide entre un **vector**, y eso ya es otra cosa.',
    example: `import numpy as np

u = np.array([2, 1])
v = np.array([3, 4])
w = np.array([1, -1])

k = u @ v
print("k = u @ v =", k)
print("k * w =", k * w)
print("k / 2 * w =", k / 2 * w)
print("w / k =", w / k)
print("u @ v * w =", u @ v * w)
`,
    experiments: [
      'Cambia `k / 2 * w` por `k / (2 * w)`: ahora salen otros números, porque primero se calcula `2 * w` y después se divide `k` entre cada componente.',
      'Prueba `print(k * w + w)`: la multiplicación se hace antes que la suma, como en matemáticas.',
      'Prueba `print(k @ w)`: Python se para con un `ValueError`, porque `@` pide arrays y `k` es un número suelto.',
    ],
    task: {
      prompt:
        'Guarda en `escala` el producto escalar de `p` y `q` partido por 4, y en `resultado` el vector `r` multiplicado por `escala`.',
      starter: `import numpy as np

p = np.array([3, 1])
q = np.array([2, 2])
r = np.array([1, 5])
# Guarda en escala el producto escalar de p y q partido por 4, y en resultado el vector r multiplicado por escala
escala = None
resultado = None
`,
      checks: `_n = (isinstance(escala, (int, float, np.number)) and not isinstance(escala, bool)) or (isinstance(escala, np.ndarray) and escala.ndim == 0 and np.issubdtype(escala.dtype, np.number))
_v = isinstance(resultado, np.ndarray) and resultado.shape == (2,) and np.issubdtype(resultado.dtype, np.number)
check(_n, "\`escala\` tiene que ser un único número: el producto escalar de \`p\` y \`q\`, dividido entre 4.")
check((not _n) or np.isclose(escala, 2), "\`escala\` tiene que valer 2: el producto escalar de \`p\` y \`q\` vale 8, y se divide entre 4.")
check(_v, "\`resultado\` tiene que ser un array de NumPy con 2 números: el vector \`r\` multiplicado por \`escala\`.")
check((not _v) or not np.allclose(resultado, [1, 5]), "\`resultado\` vale lo mismo que \`r\`: falta multiplicar por \`escala\`.")
check((not _v) or np.allclose(resultado, [2, 10]), "\`resultado\` tiene que valer (2, 10): cada componente de \`r\` multiplicada por \`escala\`.")
`,
      reference: `import numpy as np

p = np.array([3, 1])
q = np.array([2, 2])
r = np.array([1, 5])
escala = p @ q / 4
resultado = escala * r
`,
    },
  },
  {
    id: 'proyeccion.cal.3',
    title: '`np.outer`: una fila por cada número',
    explain:
      '`np.outer(c, d)` recibe dos vectores, `c` con `n` números y `d` con `m`, y devuelve una matriz de `n` filas y `m` columnas: su fila `i` es `c[i] * d`, el vector `d` multiplicado por el número `c[i]`.\n\nNo es lo mismo que `c * d`: ese multiplica componente a componente, exige que los dos tengan el mismo largo y da otro vector. Y el orden importa: `np.outer(d, c)` es otra matriz, la de `m` filas y `n` columnas.\n\nSe usa mucho junto con `M @ d`, que da un número por fila de `M`: `np.outer` convierte esos números en una matriz con una fila escalada por cada uno.',
    example: `import numpy as np

c = np.array([1, 2, 3])
d = np.array([10, 20])
T = np.outer(c, d)
print(T)
print("forma:", T.shape)
print("fila 2:", T[2], "= 3 * d:", 3 * d)
print("al revés:")
print(np.outer(d, c))
`,
    experiments: [
      'Cambia `c` por `np.array([1, 2])`: ¿cuántas filas tiene ahora `T`?',
      'Prueba `print(c * d)`: Python se para con un `ValueError`, porque `c` y `d` no tienen el mismo largo. `np.outer` no lo pide.',
      'Cambia `d` por `np.array([1, 0])`: cada fila es el número de `c` seguido de un 0.',
    ],
    task: {
      prompt:
        'Guarda en `pedidos` la matriz de 4 filas y 2 columnas cuya fila `i` es el vector `lote` repetido `n[i]` veces (es decir, `lote` multiplicado por `n[i]`).',
      starter: `import numpy as np

n = np.array([2, 0, 5, 1])
lote = np.array([4, 3])
# Guarda en pedidos la matriz cuya fila i es lote multiplicado por n[i]
pedidos = None
`,
      checks: `_ok = isinstance(pedidos, np.ndarray) and np.issubdtype(pedidos.dtype, np.number)
check(_ok and pedidos.shape in ((4, 2), (2, 4)), "\`pedidos\` tiene que ser un array de NumPy de 4 filas y 2 columnas: una fila por cada número de \`n\`.")
check((not _ok) or pedidos.shape != (2, 4), "\`pedidos\` tiene 2 filas y 4 columnas: has puesto los vectores al revés. La matriz tiene una fila por cada número de \`n\`.")
check((not _ok) or pedidos.shape != (4, 2) or np.array_equal(pedidos, [[8, 6], [0, 0], [20, 15], [4, 3]]), "\`pedidos\` no tiene las filas pedidas: la fila 0 tiene que ser \`lote\` multiplicado por 2, la fila 1 por 0, y así con cada número de \`n\`.")
`,
      reference: `import numpy as np

n = np.array([2, 0, 5, 1])
lote = np.array([4, 3])
pedidos = np.outer(n, lote)
`,
    },
  },
  {
    id: 'proyeccion.cal.4',
    title: '`plt.quiver`: dibujar una flecha',
    explain:
      '`plt.quiver(x0, y0, dx, dy, angles="xy", scale_units="xy", scale=1)` dibuja **una** flecha: sale del punto `(x0, y0)` y avanza `dx` en horizontal y `dy` en vertical. Para un vector `v`, `dx` y `dy` son `v[0]` y `v[1]`.\n\nLas tres opciones del final hacen que la flecha se dibuje a escala con los ejes; sin ellas, `plt.quiver` la estira o la encoge a su aire. Hace falta una llamada por flecha.\n\nAntes, `plt.xlim(...)` y `plt.ylim(...)` fijan qué parte del plano se ve (si la flecha cae fuera, no la verás) y `plt.grid(True)` pinta la cuadrícula. Una flecha no tiene por qué salir del origen: así se pone una a continuación de otra.',
    example: `import numpy as np
import matplotlib.pyplot as plt

u = np.array([3, 1])
w = np.array([-1, 2])
plt.xlim(-3, 5)
plt.ylim(-1, 4)
plt.grid(True)
plt.quiver(0, 0, u[0], u[1], angles="xy", scale_units="xy", scale=1)
plt.quiver(u[0], u[1], w[0], w[1], angles="xy", scale_units="xy", scale=1)
print("la segunda flecha acaba en", u + w)
`,
    experiments: [
      'Cambia `u[0], u[1]` de la primera flecha por `u[1], u[0]`: la flecha cambia de dirección, porque `dx` y `dy` van en ese orden.',
      'Quita `angles="xy", scale_units="xy", scale=1` de una de las llamadas: la flecha deja de acabar donde dicen sus componentes.',
      'Cambia `plt.xlim(-3, 5)` por `plt.xlim(0, 1)`: la flecha se sale del cuadro y no se ve entera.',
    ],
    task: {
      prompt:
        'Dibuja la flecha que sale del punto `inicio` y avanza `paso`, y guarda en `punta` el punto donde acaba, como array de NumPy.',
      starter: `import numpy as np
import matplotlib.pyplot as plt

inicio = np.array([1, 2])
paso = np.array([3, -1])
plt.xlim(-1, 6)
plt.ylim(-1, 5)
plt.grid(True)
# Dibuja la flecha de inicio a la punta y guarda en punta el punto donde acaba
punta = None
`,
      checks: `_ok = isinstance(punta, np.ndarray) and punta.shape == (2,) and np.issubdtype(punta.dtype, np.number)
check(_ok, "\`punta\` tiene que ser un array de NumPy con 2 números: el punto donde acaba la flecha.")
check((not _ok) or not np.allclose(punta, [3, -1]), "\`punta\` vale lo mismo que \`paso\`: la flecha no sale del origen, sale de \`inicio\`, así que hay que sumar.")
check((not _ok) or np.allclose(punta, [4, 1]), "\`punta\` tiene que valer (4, 1): el punto de \`inicio\` más lo que avanza la flecha.")
_fig = len(plt.get_fignums()) > 0
_quivers = [c for ax in plt.gcf().axes for c in ax.collections if type(c).__name__ == "Quiver"] if _fig else []
check(len(_quivers) > 0, "No hay ninguna flecha en la figura: dibújala con \`plt.quiver\`.")
check(all(isinstance(c.angles, str) and c.angles == "xy" and c.scale_units == "xy" and c.scale == 1 for c in _quivers), 'La flecha no está dibujada a escala: añade \`angles="xy", scale_units="xy", scale=1\` a la llamada de \`plt.quiver\`.')
_hay = any(np.allclose([np.ravel(np.ma.getdata(c.U))[0], np.ravel(np.ma.getdata(c.V))[0]], [3, -1]) for c in _quivers)
check(len(_quivers) == 0 or _hay, "La flecha no avanza lo que dice \`paso\`: 3 en horizontal y -1 en vertical. Pon en \`dx\` y \`dy\` las componentes de \`paso\`.")
_sale = any(np.allclose([np.ravel(np.ma.getdata(c.X))[0], np.ravel(np.ma.getdata(c.Y))[0]], [1, 2]) for c in _quivers)
check(len(_quivers) == 0 or not _hay or _sale, "La flecha tiene la longitud correcta, pero no sale del punto \`inicio\`: sus coordenadas van en los dos primeros números de la llamada.")
`,
      reference: `import numpy as np
import matplotlib.pyplot as plt

inicio = np.array([1, 2])
paso = np.array([3, -1])
plt.xlim(-1, 6)
plt.ylim(-1, 5)
plt.grid(True)
plt.quiver(inicio[0], inicio[1], paso[0], paso[1], angles="xy", scale_units="xy", scale=1)
punta = inicio + paso
`,
    },
  },
];
