import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Analogías: lo nuevo de su ejercicio «Programar». */
export const analogiasWarmup: WarmupStep[] = [
  {
    id: 'analogias.cal.1',
    title: '`vector("palabra")`: sumar y restar embeddings',
    explain:
      '`from embeddings import vector` trae del juego una función: `vector("gato")` devuelve el embedding **real** de esa palabra, un array de NumPy de 384 números (los embeddings reales tienen cientos de componentes) y de norma 1. No hay modelo en el navegador, así que solo valen las 32 palabras del módulo, escritas tal cual.\n\nSon arrays: se suman, se restan y se dividen entre un número componente a componente. Pero la norma 1 solo la tienen los embeddings sueltos: **una suma, una resta o una media ya no mide 1**. Para volver a medir 1, se divide entre su norma, `w / np.linalg.norm(w)`.',
    example: `import numpy as np
from embeddings import vector

a = vector("coche")
b = vector("avión")
print("componentes:", a.size)
print("norma de coche:", round(float(np.linalg.norm(a)), 3))

media = (a + b) / 2
print("norma de la media:", round(float(np.linalg.norm(media)), 3))
media_unit = media / np.linalg.norm(media)
print("norma tras normalizar:", round(float(np.linalg.norm(media_unit)), 3))
`,
    experiments: [
      'Cambia `(a + b) / 2` por `a - b` y mira la norma: una resta tampoco mide 1.',
      'Cambia `"avión"` por `"Avión"`, con mayúscula: la palabra no está en el módulo y Python se para con un `KeyError`.',
      'Prueba `a @ a`: el producto escalar de un embedding consigo mismo vale 1, porque su norma es 1.',
    ],
    task: {
      prompt:
        'Guarda en `media` la media de los embeddings de `"gato"` y `"tigre"`, en `norma` la norma de `media` y en `cos_leon` su coseno con el embedding de `"león"`.',
      starter: `import numpy as np
from embeddings import vector

# Guarda en media la media de gato y tigre, en norma su longitud
# y en cos_leon su coseno con el vector de "león"
media = None
norma = None
cos_leon = None
`,
      checks: `import embeddings as _e
_m = (_e.vector("gato") + _e.vector("tigre")) / 2
_nm = float(np.linalg.norm(_m))
_raw = float(_m @ _e.vector("león"))
_v = isinstance(media, np.ndarray) and media.shape == (384,) and np.issubdtype(media.dtype, np.number)
check(_v, "\`media\` tiene que ser un array de NumPy con 384 números: la media de los embeddings de «gato» y «tigre».")
check((not _v) or not np.allclose(media, _e.vector("gato") + _e.vector("tigre"), atol=1e-3), "\`media\` es la suma y no la media: falta dividir entre 2.")
check((not _v) or np.allclose(media, _m, atol=1e-3), "\`media\` tiene que ser la suma de los dos embeddings dividida entre 2.")
_n = isinstance(norma, (int, float, np.integer, np.floating)) and not isinstance(norma, bool)
check(_n, "\`norma\` tiene que ser un solo número: la longitud de \`media\`.")
check((not _n) or abs(norma - 1) > 1e-3, "\`norma\` vale 1: la media de dos embeddings no mide 1. Mira de qué vector estás calculando la norma.")
check((not _n) or abs(norma - _nm) < 1e-3, "\`norma\` tiene que ser la norma de \`media\`, que se calcula con \`np.linalg.norm\`.")
_c = isinstance(cos_leon, (int, float, np.integer, np.floating)) and not isinstance(cos_leon, bool)
check(_c, "\`cos_leon\` tiene que ser un solo número: el coseno de \`media\` con «león».")
check((not _c) or abs(cos_leon - _raw) > 1e-3, "\`cos_leon\` es el producto escalar sin dividir, y \`media\` no mide 1, así que no es un coseno. Hay que dividir entre la norma de \`media\`.")
check((not _c) or abs(cos_leon - _raw / _nm) < 1e-3, "\`cos_leon\` tiene que ser el producto escalar de \`media\` con el embedding de «león», dividido entre la norma de \`media\` (la de «león» vale 1).")
`,
      reference: `import numpy as np
from embeddings import vector

media = (vector("gato") + vector("tigre")) / 2
norma = np.linalg.norm(media)
cos_leon = media @ vector("león") / norma
`,
    },
  },
  {
    id: 'analogias.cal.2',
    title: '`lista.index(x)` e `int(x)`: posición, puesto y entero',
    explain:
      '`lista.index(x)` devuelve la **posición** de `x` en la lista, contando desde 0; si `x` no está, Python se para con un `ValueError`. Un **puesto** de un ranking cuenta desde 1, así que el puesto es `lista.index(x) + 1`.\n\n`int(x)` convierte en número entero. Con un decimal **corta** la parte decimal sin redondear: `int(8.7)` da 8. Y con un número que sale de NumPy, como el de `np.argmax`, lo pasa a un entero normal de Python.',
    example: `import numpy as np

ranking = ["Mar", "Sol", "Cielo", "Luna"]
print("posición de Sol:", ranking.index("Sol"))
print("puesto de Sol:", ranking.index("Sol") + 1)

puntos = np.array([0.2, 0.9, 0.5])
mejor = int(np.argmax(puntos))
print("el mayor está en la posición", mejor)
print("int(8.7) =", int(8.7))
`,
    experiments: [
      'Pide `ranking.index("Mar")`: la primera de la lista está en la posición 0, pero es el puesto 1.',
      'Prueba `int(-8.7)`: ¿da -9 o -8? Corta la parte decimal.',
      'Pide `ranking.index("Nube")`: la palabra no está y Python se para con un `ValueError`.',
    ],
    task: {
      prompt:
        'Guarda en `puesto` el puesto de `"Cielo"` en `clasificacion` (el primero es el 1) y en `entera` la parte entera de `nota`.',
      starter: `import numpy as np

clasificacion = ["Nube", "Cielo", "Bruma", "Rayo", "Trueno"]
nota = 7.9
# Guarda en puesto el puesto de "Cielo" (el primero es el 1) y en entera la parte entera de nota
puesto = None
entera = None
`,
      checks: `_ent = lambda v: isinstance(v, (int, np.integer)) and not isinstance(v, bool)
check(_ent(puesto), "\`puesto\` tiene que ser un número entero: el lugar de «Cielo» en la clasificación.")
check((not _ent(puesto)) or puesto != 1, "\`puesto\` vale 1: es la posición, que empieza en 0. El puesto empieza en 1: hay que sumar uno.")
check((not _ent(puesto)) or puesto == 1 or puesto == 2, "\`puesto\` tiene que ser el lugar de «Cielo» contando desde 1: su posición en la lista más uno.")
check(_ent(entera), "\`entera\` tiene que ser un número entero, no un decimal.")
check((not _ent(entera)) or entera != 8, "\`entera\` vale 8: se ha redondeado. \`int\` corta la parte decimal sin redondear.")
check((not _ent(entera)) or entera == 8 or entera == 7, "\`entera\` tiene que ser la parte entera de \`nota\`.")
`,
      reference: `import numpy as np

clasificacion = ["Nube", "Cielo", "Bruma", "Rayo", "Trueno"]
nota = 7.9
puesto = clasificacion.index("Cielo") + 1
entera = int(nota)
`,
    },
  },
  {
    id: 'analogias.cal.3',
    title: '`sum` con verdaderos y falsos: contar casos',
    explain:
      '`sum(lista)` suma los elementos de una lista. Con una lista de `True` y `False` **cuenta los `True`**, porque `True` vale 1 y `False` vale 0. Así `sum(n >= 5 for n in notas)` dice cuántas notas llegan a 5.\n\nTambién se puede preguntar si un elemento está en una tupla: `x in ("a", "b")` es `True` si `x` es alguno de los dos. El resultado de `sum` con condiciones es un **recuento**, un entero; no una proporción.',
    example: `notas = [4, 7, 9, 5, 8]
aprobadas = [n >= 5 for n in notas]
print(aprobadas)
print("aprobadas:", sum(aprobadas))
print("suma de las notas:", sum(notas))
print("notas de 8 o más:", sum(n >= 8 for n in notas))
print("¿hay un 7?", 7 in notas)
print("cuántas son 4 o 5:", sum(n in (4, 5) for n in notas))
`,
    experiments: [
      'Cambia `n >= 8` por `n > 8`: ¿cuántas quedan? Mira dónde cae el 8.',
      'Escribe `print(sum(aprobadas) / len(notas))`: dividir entre el total da una proporción, no un recuento.',
      'Prueba `print(sum([True, True, False]))`: el resultado es 2.',
    ],
    task: {
      prompt:
        'Guarda en `n_calidos` cuántos colores de `pedido` son `"rojo"` o `"naranja"` (cuenta los repetidos) y en `total` la suma de los números de `cajas`.',
      starter: `import numpy as np

pedido = ["rojo", "azul", "verde", "rojo", "naranja", "negro"]
cajas = [3, 5, 2, 8]
# Guarda en n_calidos cuántos colores del pedido son rojo o naranja y en total la suma de cajas
n_calidos = None
total = None
`,
      checks: `_ent = lambda v: isinstance(v, (int, np.integer)) and not isinstance(v, bool)
check(_ent(n_calidos), "\`n_calidos\` tiene que ser un número entero: un recuento de colores.")
check((not _ent(n_calidos)) or n_calidos != 2, "\`n_calidos\` vale 2: solo se ha contado uno de los dos colores cálidos, o se han quitado los repetidos.")
check((not _ent(n_calidos)) or n_calidos == 2 or n_calidos == 3, "\`n_calidos\` tiene que ser cuántos elementos de \`pedido\` son «rojo» o «naranja», contando también los repetidos.")
check(_ent(total), "\`total\` tiene que ser un número entero: la suma de los números de \`cajas\`.")
check((not _ent(total)) or total != 4, "\`total\` vale 4: es cuántas cajas distintas hay, no su suma. \`sum\` suma los elementos de la lista.")
check((not _ent(total)) or total == 4 or total == 18, "\`total\` tiene que ser la suma de los números de \`cajas\`.")
`,
      reference: `import numpy as np

pedido = ["rojo", "azul", "verde", "rojo", "naranja", "negro"]
cajas = [3, 5, 2, 8]
n_calidos = sum(c in ("rojo", "naranja") for c in pedido)
total = sum(cajas)
`,
    },
  },
  {
    id: 'analogias.cal.4',
    title: 'Tuplas: desempaquetar con `for a, b in` y con `*`',
    explain:
      'Una **tupla** es una lista fija que se escribe entre paréntesis: `(1, 5)`. Cuando una lista guarda tuplas, `for origen, destino in pares:` las **desempaqueta**: en cada vuelta, `origen` toma el primer valor de la tupla y `destino`, el segundo. También sirve en una comprensión: `[d - o for o, d in pares]`.\n\nCon una función pasa algo parecido: `f(*caso)` reparte los valores de la tupla `caso` como argumentos, uno por parámetro. `f(*(1, 2, 3))` es lo mismo que `f(1, 2, 3)`. La tupla tiene que tener tantos valores como parámetros: si no, Python se para con un `TypeError`.',
    example: `pares = [(1, 5), (2, 9), (4, 4)]
for origen, destino in pares:
    print(origen, "->", destino, "avanza", destino - origen)
print("en una lista:", [d - o for o, d in pares])


def suma3(a, b, c):
    return a + b + c


caso = (10, 20, 30)
print("con *:", suma3(*caso))
print("a mano:", suma3(caso[0], caso[1], caso[2]))
`,
    experiments: [
      'Cambia `for origen, destino in pares` por `for par in pares` y escribe `print(par)`: sale la tupla entera.',
      'Prueba `suma3(*(1, 2))`: la tupla tiene 2 valores y la función pide 3, así que Python se para con un `TypeError`.',
      'Cambia `for o, d in pares` por `for o, d in [(1, 2, 3)]`: una tupla de 3 valores no se desempaqueta en 2 nombres.',
    ],
    task: {
      prompt:
        'Guarda en `saltos` la lista de lo que avanza cada tupla `(inicio, fin)` de `tramos` (fin menos inicio) y en `rangos` la lista del resultado de `amplitud` aplicada a cada tupla de `ternas`, repartiendo la tupla con `*`.',
      starter: `import numpy as np

tramos = [(3, 10), (0, 4), (7, 8)]
ternas = [(1, 9, 4), (6, 2, 3), (5, 5, 5)]


def amplitud(a, b, c):
    return max(a, b, c) - min(a, b, c)


# Guarda en saltos fin menos inicio de cada tramo y en rangos la amplitud de cada terna
saltos = None
rangos = None
`,
      checks: `def _lis(x, n):
    return (isinstance(x, (list, tuple)) or (isinstance(x, np.ndarray) and x.ndim == 1)) and len(x) == n

def _ok(x, esperado):
    return _lis(x, len(esperado)) and all(isinstance(v, (int, float, np.integer, np.floating)) and not isinstance(v, bool) for v in x)

check(_ok(saltos, [7, 4, 1]), "\`saltos\` tiene que ser una lista de 3 números: uno por cada tramo.")
check((not _ok(saltos, [7, 4, 1])) or list(saltos) != [-7, -4, -1], "\`saltos\` sale con el signo cambiado: es fin menos inicio, y no al revés.")
check((not _ok(saltos, [7, 4, 1])) or list(saltos) == [-7, -4, -1] or list(saltos) == [7, 4, 1], "\`saltos\` tiene que ser, para cada tramo, el segundo valor menos el primero.")
check(_ok(rangos, [8, 4, 0]), "\`rangos\` tiene que ser una lista de 3 números: uno por cada terna.")
check((not _ok(rangos, [8, 4, 0])) or list(rangos) == [8, 4, 0], "\`rangos\` tiene que contener, para cada terna, lo que devuelve \`amplitud\` con sus tres valores: \`amplitud(*terna)\`.")
`,
      reference: `import numpy as np

tramos = [(3, 10), (0, 4), (7, 8)]
ternas = [(1, 9, 4), (6, 2, 3), (5, 5, 5)]


def amplitud(a, b, c):
    return max(a, b, c) - min(a, b, c)


saltos = [fin - inicio for inicio, fin in tramos]
rangos = [amplitud(*t) for t in ternas]
`,
    },
  },
];
