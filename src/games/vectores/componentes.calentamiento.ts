import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Componentes: lo nuevo de su ejercicio «Programar». */
export const componentesWarmup: WarmupStep[] = [
  {
    id: 'componentes.cal.1',
    title: '`x.size` y `len(x)`: cuántas componentes tiene un vector',
    explain:
      'Un vector de NumPy tiene tantas **componentes** como números guarda, y ese número es su dimensión. Hay dos formas de contarlas:\n\n- `x.size`: el atributo `size` del array (sin paréntesis, no es una llamada).\n- `len(x)`: la función `len` de Python, que cuenta los elementos de una lista o de un vector.\n\nLas dos dan un número entero. No las confundas con `x.shape`, que da una **tupla**, `(7,)`, y con `x.ndim`, que cuenta los **ejes** del array: un vector siempre tiene uno, tenga las componentes que tenga.',
    example: `import numpy as np

notas = np.array([7, 5, 9, 6])
print("componentes con size:", notas.size)
print("componentes con len:", len(notas))
print("forma:", notas.shape)
print("ejes con ndim:", notas.ndim)
`,
    experiments: [
      'Añade un número más a la lista de `notas` y vuelve a ejecutar: ¿qué líneas cambian y cuál sigue valiendo lo mismo?',
      'Fíjate en la forma: `(4,)` es una tupla de un solo número, y por eso lleva esa coma al final.',
      'Prueba `print(notas.size())`: `size` no es una función y Python se para con un `TypeError`. Lee qué dice el mensaje.',
    ],
    task: {
      prompt:
        'Guarda en `n` cuántas componentes tiene `temps` y en `ejes` cuántos ejes tiene ese array.',
      starter: `import numpy as np

temps = np.array([12, 15, 11, 18, 20, 9, 14])
# Guarda en n el número de componentes de temps y en ejes su número de ejes
n = None
ejes = None
`,
      checks: `def _num(a):
    return isinstance(a, (int, float, np.number)) and not isinstance(a, bool)

check(_num(n), "\`n\` tiene que ser un número: cuántas componentes tiene \`temps\`.")
check(not isinstance(n, tuple), "\`n\` es una tupla, y hace falta un solo número. \`temps.shape\` da la forma entera; para el número de componentes sirve \`temps.size\` o \`len(temps)\`.")
check((not _num(n)) or n != 1, "\`n\` vale 1: has contado los ejes del array y no sus componentes.")
check((not _num(n)) or n == 7, "\`n\` tiene que valer 7: las componentes que tiene \`temps\`.")
check(_num(ejes), "\`ejes\` tiene que ser un número: cuántos ejes tiene \`temps\`.")
check((not _num(ejes)) or ejes != 7, "\`ejes\` vale 7: es el número de componentes. Los ejes del array se cuentan con \`ndim\`.")
check((not _num(ejes)) or ejes == 1, "\`ejes\` tiene que valer 1: un vector tiene un solo eje.")
`,
      reference: `import numpy as np

temps = np.array([12, 15, 11, 18, 20, 9, 14])
n = temps.size
ejes = temps.ndim
`,
    },
  },
  {
    id: 'componentes.cal.2',
    title: 'Restar arrays: el vector de un punto a otro',
    explain:
      'Con arrays, el signo `-` resta **componente a componente**: la primera con la primera, la segunda con la segunda. El resultado es otro array del mismo tamaño.\n\nEl vector que va de un punto a otro es **llegada menos salida**: `llegada - salida`. El orden importa: al revés sale el vector opuesto, el que apunta en sentido contrario.',
    example: `import numpy as np

salida = np.array([2, 5])
llegada = np.array([6, 1])
paso = llegada - salida
print("de salida a llegada:", paso)
print("al revés:", salida - llegada)
print("salida + paso:", salida + paso)
`,
    experiments: [
      'Mira la última línea: sumar el vector `paso` a la `salida` te deja en la `llegada`. Así se comprueba una resta.',
      'Cambia `llegada` por `np.array([6, 1, 3])`, con una componente más: Python se para con un `ValueError`, porque los dos arrays tienen que ser igual de largos.',
      'Prueba `print(llegada - 1)`: restar un solo número resta a todas las componentes.',
    ],
    task: {
      prompt:
        'Guarda en `ida` el vector que va de `P` a `Q`, y en `vuelta` el que va de `Q` a `P`.',
      starter: `import numpy as np

P = np.array([5, -1, 2])
Q = np.array([1, 3, 4])
# Guarda en ida el vector de P a Q y en vuelta el de Q a P
ida = None
vuelta = None
`,
      checks: `def _vec(a):
    return isinstance(a, np.ndarray) and a.shape == (3,) and np.issubdtype(a.dtype, np.number)

check(_vec(ida), "\`ida\` tiene que ser un array de NumPy con 3 números: el vector que va de \`P\` a \`Q\`.")
check((not _vec(ida)) or not np.allclose(ida, [4, -4, -2]), "\`ida\` vale (4, -4, -2): has restado al revés. De \`P\` a \`Q\` es llegada menos salida.")
check((not _vec(ida)) or np.allclose(ida, [-4, 4, 2]), "\`ida\` tiene que ser el vector de \`P\` a \`Q\`: cada componente de la llegada menos la de la salida.")
check(_vec(vuelta), "\`vuelta\` tiene que ser un array de NumPy con 3 números: el vector que va de \`Q\` a \`P\`.")
check((not _vec(vuelta)) or not _vec(ida) or not np.allclose(vuelta, ida), "\`vuelta\` vale lo mismo que \`ida\`: al volver, el vector apunta en sentido contrario, así que sale con los signos cambiados.")
check((not _vec(vuelta)) or np.allclose(vuelta, [4, -4, -2]), "\`vuelta\` tiene que ser el vector de \`Q\` a \`P\`: ahora la llegada es \`P\` y la salida es \`Q\`.")
`,
      reference: `import numpy as np

P = np.array([5, -1, 2])
Q = np.array([1, 3, 4])
ida = Q - P
vuelta = P - Q
`,
    },
  },
  {
    id: 'componentes.cal.3',
    title: 'Diccionarios: `d["clave"]` y `d["clave"][i]`',
    explain:
      'Un **diccionario** guarda valores con una clave que los nombra, entre llaves: `{"enero": 3, "abril": 11}`. Las claves suelen ser textos, y los textos van **entre comillas**.\n\nPara sacar un valor se escribe el diccionario y la clave entre corchetes: `d["abril"]`. Si el valor es un array, se le pueden poner más corchetes detrás para elegir una componente, contando desde 0: `d["abril"][1]` es la segunda componente del array de abril.\n\nTropiezos típicos: una clave que no existe (cuentan las mayúsculas y los acentos) da un `KeyError`, y una clave sin comillas da un `NameError`, porque Python cree que es una variable.',
    example: `import numpy as np

temperaturas = {
    "enero": np.array([3, 9]),
    "abril": np.array([11, 18]),
    "julio": np.array([21, 32]),
}
print("claves:", list(temperaturas))
print("abril:", temperaturas["abril"])
print("máxima de abril:", temperaturas["abril"][1])
print("mínima de julio:", temperaturas["julio"][0])
`,
    experiments: [
      'Cambia `"abril"` por `"Abril"`, con mayúscula: Python se para con un `KeyError` y te dice qué clave no encuentra.',
      'Quita las comillas de `"julio"` en la última línea: ahora el error es un `NameError`.',
      'Añade una cuarta entrada, `"octubre": np.array([9, 16])`, y pide su máxima.',
      'Guarda `m = temperaturas["abril"]` y escribe `print(m[0], m[1])`: es lo mismo en dos pasos.',
    ],
    task: {
      prompt:
        'Cada valor de `pedidos` es un array con dos números: los pedidos y las devoluciones de una tienda. Guarda en `datos_sur` el array de la tienda `"sur"` y en `devoluciones` la segunda componente de ese array.',
      starter: `import numpy as np

# Cada tienda: [pedidos, devoluciones]
pedidos = {
    "norte": np.array([40, 15]),
    "sur": np.array([25, 60]),
    "este": np.array([33, 8]),
}
# Guarda en datos_sur el array de "sur" y en devoluciones su segunda componente
datos_sur = None
devoluciones = None
`,
      checks: `_ok = isinstance(datos_sur, np.ndarray) and datos_sur.shape == (2,) and np.issubdtype(datos_sur.dtype, np.number)
check(_ok, "\`datos_sur\` tiene que ser el array de la tienda «sur»: dos números que se sacan del diccionario \`pedidos\`.")
check((not _ok) or np.allclose(datos_sur, [25, 60]), "\`datos_sur\` tiene que ser el array de la clave «sur»: la tienda del sur, no otra.")
_num = isinstance(devoluciones, (int, float, np.number)) and not isinstance(devoluciones, bool)
check(_num, "\`devoluciones\` tiene que ser un solo número, no un array: una componente del array de «sur».")
check((not _num) or devoluciones != 25, "\`devoluciones\` vale 25: es la primera componente, la de los pedidos. La segunda está en la posición 1, porque se cuenta desde 0.")
check((not _num) or devoluciones == 60, "\`devoluciones\` tiene que ser la segunda componente del array de la tienda «sur».")
`,
      reference: `import numpy as np

# Cada tienda: [pedidos, devoluciones]
pedidos = {
    "norte": np.array([40, 15]),
    "sur": np.array([25, 60]),
    "este": np.array([33, 8]),
}
datos_sur = pedidos["sur"]
devoluciones = datos_sur[1]
`,
    },
  },
  {
    id: 'componentes.cal.4',
    title: '`plt.scatter(x, y)`: un punto por cada pareja',
    explain:
      '`plt.scatter(x, y)` dibuja un punto en el plano: `x` es su coordenada horizontal e `y`, la vertical. Cada llamada añade puntos a la misma figura, que sale en **Figuras** al pulsar Ejecutar.\n\nSi las coordenadas de un punto están en un array `p`, sus componentes se sacan con `p[0]` y `p[1]`: `plt.scatter(p[0], p[1])`.\n\nTambién se pueden dibujar varios puntos de una llamada, pero entonces se dan **primero todas las x y después todas las y**, no punto a punto: `plt.scatter([4, 5, 6], [1, 2, 3])` dibuja (4, 1), (5, 2) y (6, 3).',
    example: `import matplotlib.pyplot as plt

plt.scatter(2, 3)
plt.scatter([4, 5, 6], [1, 2, 3])
plt.xlim(0, 7)
plt.ylim(0, 5)
plt.grid(True)
print("dibujados 4 puntos")
`,
    experiments: [
      'Cambia `plt.scatter(2, 3)` por `plt.scatter(3, 2)`: el punto se mueve. La primera cifra es siempre la horizontal.',
      'Cambia la segunda llamada por `plt.scatter([4, 5, 6], [1, 2])`, con una y menos: Python se para con un `ValueError`, porque tiene que haber una `y` por cada `x`.',
      'Añade `plt.scatter(0, 0)`: un punto en el origen.',
    ],
    task: {
      prompt:
        'Dibuja con `plt.scatter` los tres puntos de la lista `puntos`: la primera componente de cada array va en horizontal y la segunda, en vertical.',
      starter: `import numpy as np
import matplotlib.pyplot as plt

puntos = [np.array([1, 5]), np.array([3, 2]), np.array([6, 4])]
plt.xlim(0, 7)
plt.ylim(0, 6)
plt.grid(True)
# Dibuja los tres puntos de la lista con plt.scatter
`,
      checks: `_fig = len(plt.get_fignums()) > 0
check(_fig, "No hay ninguna figura: dibuja los puntos con \`plt.scatter\`.")
_pts = [tuple(float(c) for c in p) for ax in plt.gcf().axes for col in ax.collections if type(col).__name__ == "PathCollection" for p in np.asarray(col.get_offsets())] if _fig else []
check((not _fig) or len(_pts) >= 3, "Faltan puntos: tiene que haber 3 puntos en la figura, uno por cada array de \`puntos\`.")
check((not _fig) or len(_pts) <= 3, "Sobran puntos: dibuja solo los tres puntos de \`puntos\`.")
_buenos = sorted([(1.0, 5.0), (3.0, 2.0), (6.0, 4.0)])
_girados = sorted([(5.0, 1.0), (2.0, 3.0), (4.0, 6.0)])
check(len(_pts) != 3 or sorted(_pts) != _girados, "Has puesto las coordenadas al revés: la primera componente de cada punto va en el eje horizontal y la segunda en el vertical.")
check(len(_pts) != 3 or sorted(_pts) == _buenos, "Los puntos no son los de \`puntos\`: cada uno tiene como x su primera componente y como y la segunda.")
`,
      reference: `import numpy as np
import matplotlib.pyplot as plt

puntos = [np.array([1, 5]), np.array([3, 2]), np.array([6, 4])]
plt.xlim(0, 7)
plt.ylim(0, 6)
plt.grid(True)
plt.scatter(puntos[0][0], puntos[0][1])
plt.scatter(puntos[1][0], puntos[1][1])
plt.scatter(puntos[2][0], puntos[2][1])
`,
    },
  },
];
