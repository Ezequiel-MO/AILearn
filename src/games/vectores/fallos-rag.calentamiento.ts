import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Fallos de RAG: lo nuevo de su ejercicio «Programar». */
export const fallosRagWarmup: WarmupStep[] = [
  {
    id: 'fallos-rag.cal.1',
    title: '`A @ B.T` y `axis`: una tabla de cosenos y su mayor por fila',
    explain:
      'En el módulo `embeddings` del juego, cada texto es una **fila** de una matriz: `D` tiene un documento por fila y `Q`, una consulta por fila, todas de norma 1 (los embeddings reales tienen cientos de componentes). El producto escalar de dos filas es su coseno.\n\n`A @ B.T` multiplica `A` por la traspuesta de `B` y calcula **todos** los cosenos de una vez: el elemento `[i, j]` es el de la fila `i` de `A` con la fila `j` de `B`. Si `A` tiene `n` filas y `B` tiene `m`, la tabla tiene forma `(n, m)`.\n\nPara buscar el mayor de cada fila o de cada columna, `np.max(S, axis=1)` y `np.argmax(S, axis=1)` recorren **cada fila** y dan una cifra por fila (el valor y su posición). Con `axis=0` dan una por **columna**. Sin `axis`, NumPy mira la tabla entera.',
    example: `import numpy as np

A = np.array([[1, 0], [0, 1], [0.6, 0.8]])
B = np.array([[1, 0], [0.8, 0.6], [0, 1], [-1, 0]])
S = A @ B.T
print("forma de S:", S.shape)
print(np.round(S, 2))
print("mayor de cada fila:", np.max(S, axis=1))
print("dónde está:", np.argmax(S, axis=1))
print("mayor de cada columna:", np.max(S, axis=0))
`,
    experiments: [
      'Cambia `A @ B.T` por `A @ B`: Python se para con un error, porque `A` tiene 2 columnas y `B` tiene 4 filas.',
      'Cambia `axis=1` por `axis=0` en el segundo `print`: ¿cuántos números salen ahora, y por qué?',
      'Quita el `axis` de `np.max(S)`: da un solo número, el mayor de toda la tabla.',
    ],
    task: {
      prompt:
        'Guarda en `S` los productos escalares de cada fila de `X` con cada fila de `Y`, en `mejor_x` la fila de `X` que más puntúa para cada fila de `Y` (una posición por cada fila de `Y`) y en `punt` esa puntuación máxima.',
      starter: `import numpy as np

X = np.array([[1, 0], [0, 1], [0.6, 0.8]])
Y = np.array([[0.8, 0.6], [0, 1], [1, 0], [0.6, -0.8]])
# Guarda en S la tabla de productos escalares de X con Y, en mejor_x la fila de X que más puntúa
# para cada fila de Y y en punt esa puntuación
S = None
mejor_x = None
punt = None
`,
      checks: `_X = np.array([[1, 0], [0, 1], [0.6, 0.8]])
_Y = np.array([[0.8, 0.6], [0, 1], [1, 0], [0.6, -0.8]])
_S = _X @ _Y.T
_s = isinstance(S, np.ndarray) and S.ndim == 2 and np.issubdtype(S.dtype, np.number)
check(_s, "\`S\` tiene que ser un array de NumPy con una tabla de números.")
check((not _s) or S.shape != (4, 3), "\`S\` tiene 4 filas y 3 columnas: es la tabla de \`Y\` con \`X\`, al revés. Cada fila tiene que ser una fila de \`X\`.")
check((not _s) or S.shape == (4, 3) or S.shape == (3, 4), "\`S\` tiene que tener una fila por cada fila de \`X\` y una columna por cada fila de \`Y\`: forma (3, 4).")
check((not _s) or S.shape != (3, 4) or np.allclose(S, _S), "\`S\` tiene que ser \`X @ Y.T\`: el elemento de la fila i y la columna j es el producto escalar de la fila i de \`X\` con la fila j de \`Y\`.")
_v = lambda a: isinstance(a, np.ndarray) and a.shape == (4,) and np.issubdtype(a.dtype, np.number)
check(_v(mejor_x), "\`mejor_x\` tiene que ser un array de NumPy con 4 números: uno por cada fila de \`Y\`.")
check((not isinstance(mejor_x, np.ndarray)) or mejor_x.shape != (3,), "\`mejor_x\` tiene 3 números, uno por fila de \`X\`: se ha buscado el mayor a lo largo de las columnas equivocadas. Hace falta uno por cada fila de \`Y\`, que son las columnas de \`S\`: cambia el \`axis\`.")
check((not _v(mejor_x)) or np.array_equal(mejor_x, np.argmax(_S, axis=0)), "\`mejor_x\` tiene que dar, para cada columna de \`S\`, la posición de su valor mayor, no el valor.")
check(_v(punt), "\`punt\` tiene que ser un array de NumPy con 4 números: la mejor puntuación de cada fila de \`Y\`.")
check((not isinstance(punt, np.ndarray)) or punt.shape != (3,), "\`punt\` tiene 3 números, uno por fila de \`X\`: se ha buscado el mayor en el eje que no toca.")
check((not _v(punt)) or np.allclose(punt, np.max(_S, axis=0)), "\`punt\` tiene que ser el valor mayor de cada columna de \`S\`, no su posición.")
`,
      reference: `import numpy as np

X = np.array([[1, 0], [0, 1], [0.6, 0.8]])
Y = np.array([[0.8, 0.6], [0, 1], [1, 0], [0.6, -0.8]])
S = X @ Y.T
mejor_x = np.argmax(S, axis=0)
punt = np.max(S, axis=0)
`,
    },
  },
  {
    id: 'fallos-rag.cal.2',
    title: '`None`, `np.linspace` y `lista.count(x)`: probar umbrales',
    explain:
      '`None` es el valor de Python para «nada». Sirve para decir «no sé». Una condición dentro de una comprensión elige entre dos valores: `[x if x >= u else None for x in datos]` deja cada `x` que llega a `u` y pone `None` en el resto. Con `zip(a, b)` se recorren dos listas a la par.\n\n- `lista.count(None)` dice cuántas veces aparece `None` en la lista.\n- `np.linspace(a, b, n)` da `n` números repartidos a pasos iguales de `a` a `b`, **ambos incluidos**. El tercer valor es cuántos, no el paso.\n- Los números que salen de NumPy se muestran como `np.int64(4)`; `int(x)` los convierte en un entero normal.',
    example: `import numpy as np

puntos = np.array([0.9, 0.35, 0.6, 0.2])
docs = np.array([4, 1, 7, 2])
for u in np.linspace(0, 1, 5):
    resp = [int(d) if p >= u else None for d, p in zip(docs, puntos)]
    print("umbral", u, "->", resp, "| sin respuesta:", resp.count(None))
`,
    experiments: [
      'Cambia `np.linspace(0, 1, 5)` por `np.linspace(0, 1, 3)`: ¿qué umbrales salen ahora?',
      'Cambia `p >= u` por `p > u`: mira la fila del umbral 0,6, donde `p` y `u` valen lo mismo para una consulta.',
      'Quita el `int(d)` y deja `d`: las respuestas salen con `np.int64(...)`.',
    ],
    task: {
      prompt:
        'Guarda en `validos` la lista de los `ids` cuya nota llega a 6 (`None` en las que no llegan), en `sin_aprobar` cuántos `None` hay en esa lista y en `cortes` los 6 números de 0 a 10 repartidos a pasos iguales.',
      starter: `import numpy as np

ids = np.array([11, 12, 13, 14, 15])
notas = np.array([4.5, 7, 9, 3, 6])
# Guarda en validos el id de cada nota que llega a 6 (None si no llega), en sin_aprobar cuántos None
# hay en la lista y en cortes los 6 números de 0 a 10 repartidos a pasos iguales
validos = None
sin_aprobar = None
cortes = None
`,
      checks: `_l = isinstance(validos, list) and len(validos) == 5
check(_l, "\`validos\` tiene que ser una lista de 5 elementos: uno por cada nota.")
check((not _l) or validos != [11, None, None, 14, None], "\`validos\` tiene la condición al revés: deja el id de las notas que no llegan a 6 y pone \`None\` en las que sí llegan.")
check((not _l) or validos != [None, 12, 13, None, None], "\`validos\` deja la nota 6 como no válida: «llega a 6» incluye el 6, hace falta \`>=\`.")
check((not _l) or validos == [11, None, None, 14, None] or validos == [None, 12, 13, None, None] or validos == [None, 12, 13, None, 15], "\`validos\` tiene que tener, para cada nota, su id si llega a 6 y \`None\` si no llega.")
_ent = lambda v: isinstance(v, (int, np.integer)) and not isinstance(v, bool)
check(_ent(sin_aprobar), "\`sin_aprobar\` tiene que ser un número entero: cuántos \`None\` hay en \`validos\`.")
check((not _ent(sin_aprobar)) or sin_aprobar == 2 or sin_aprobar == 3, "\`sin_aprobar\` tiene que ser el número de \`None\` de \`validos\`: \`validos.count(None)\`.")
_c = isinstance(cortes, np.ndarray) and cortes.shape == (6,) and np.issubdtype(cortes.dtype, np.number)
check(_c, "\`cortes\` tiene que ser un array de NumPy con 6 números.")
check((not _c) or np.allclose(cortes, np.linspace(0, 10, 6)), "\`cortes\` tiene que ir de 0 a 10 con 6 números a pasos iguales: 0, 2, 4, 6, 8 y 10. El tercer valor de \`np.linspace\` es cuántos números, no el paso.")
`,
      reference: `import numpy as np

ids = np.array([11, 12, 13, 14, 15])
notas = np.array([4.5, 7, 9, 3, 6])
validos = [int(i) if n >= 6 else None for i, n in zip(ids, notas)]
sin_aprobar = validos.count(None)
cortes = np.linspace(0, 10, 6)
`,
    },
  },
  {
    id: 'fallos-rag.cal.3',
    title: '`enumerate`: la posición y el elemento a la vez',
    explain:
      '`enumerate(lista)` recorre una lista dando, en cada vuelta, la **posición** (desde 0) y el **elemento**: `for i, x in enumerate(lista):`. Es lo que hace falta cuando importa dónde está un elemento, no solo cuál es.\n\nSe combina con `zip` para recorrer dos listas a la par sin perder la posición. El desempaquetado lleva paréntesis en el par de `zip`: `for i, (x, y) in enumerate(zip(a, b)):`. Y en una comprensión se filtra con `if`: `[i for i, x in enumerate(lista) if x == "no"]` es la lista de las posiciones donde hay un `"no"`.',
    example: `previstos = ["a", "b", "b", "c"]
reales = ["a", "c", "b", "b"]

for i, x in enumerate(previstos):
    print("posición", i, "->", x)

for i, (p, r) in enumerate(zip(previstos, reales)):
    print(i, p, r, "coinciden" if p == r else "difieren")

print("donde hay una b:", [i for i, x in enumerate(previstos) if x == "b"])
print("coinciden:", sum(p == r for p, r in zip(previstos, reales)))
`,
    experiments: [
      'Cambia `enumerate(previstos)` por `previstos` y escribe `for x in previstos:` sin `i`: se pierde la posición.',
      'Escribe `print(list(enumerate(previstos)))`: es una lista de parejas (posición, elemento).',
      'Cambia `x == "b"` por `x != "b"`: ¿qué posiciones salen?',
    ],
    task: {
      prompt:
        'Guarda en `fallos` la lista de las **posiciones** donde `previstos` y `reales` no coinciden, y en `aciertos` cuántas veces sí coinciden.',
      starter: `import numpy as np

previstos = ["sí", "no", "no", "sí", "no"]
reales = ["sí", "sí", "no", "no", "no"]
# Guarda en fallos las posiciones donde previstos y reales difieren y en aciertos cuántas veces coinciden
fallos = None
aciertos = None
`,
      checks: `_l = isinstance(fallos, (list, tuple)) and all(isinstance(v, (int, np.integer)) and not isinstance(v, bool) for v in fallos)
check(_l, "\`fallos\` tiene que ser una lista de posiciones, es decir, de números enteros.")
check((not _l) or list(fallos) != [2, 4], "\`fallos\` sale de contar desde 1: las posiciones empiezan en 0.")
check((not _l) or list(fallos) != [0, 2, 4], "\`fallos\` tiene las posiciones donde coinciden, y se buscan las que difieren.")
check((not _l) or list(fallos) == [2, 4] or list(fallos) == [0, 2, 4] or list(fallos) == [1, 3], "\`fallos\` tiene que ser la lista de las posiciones en las que \`previstos\` y \`reales\` tienen elementos distintos.")
_ent = lambda v: isinstance(v, (int, np.integer)) and not isinstance(v, bool)
check(_ent(aciertos), "\`aciertos\` tiene que ser un número entero: cuántas veces coinciden.")
check((not _ent(aciertos)) or aciertos != 2, "\`aciertos\` vale 2: es el número de fallos. Hay que contar las coincidencias.")
check((not _ent(aciertos)) or aciertos == 2 or aciertos == 3, "\`aciertos\` tiene que ser cuántas posiciones tienen el mismo elemento en \`previstos\` y en \`reales\`.")
`,
      reference: `import numpy as np

previstos = ["sí", "no", "no", "sí", "no"]
reales = ["sí", "sí", "no", "no", "no"]
fallos = [i for i, (p, r) in enumerate(zip(previstos, reales)) if p != r]
aciertos = sum(p == r for p, r in zip(previstos, reales))
`,
    },
  },
  {
    id: 'fallos-rag.cal.4',
    title: '`re.findall` y `all`: buscar códigos y exigirlos',
    explain:
      '`import re` trae las **expresiones regulares**. `re.findall(patron, texto)` devuelve la **lista** de todos los trozos de `texto` que encajan con `patron`: puede tener varios, uno o ninguno (lista vacía). En el patrón, `[A-Z]` es una mayúscula, `\\d+` una o más cifras, y el resto se busca tal cual. El patrón lleva una `r` delante: `r"[A-Z]-\\d+"`.\n\n`all(lista)` es `True` si **todos** los elementos son verdaderos, y también si la lista está **vacía**. Con una comprensión: `all(c in texto for c in codigos)` pregunta si cada código aparece en `texto`.',
    example: `import re

patron = r"[A-Z]-\\d+"
texto = "Pedidos A-12 y B-7; también el C-305."
codigos = re.findall(patron, texto)
print("códigos:", codigos)
print("solo cifras:", re.findall(r"\\d+", texto))
print("sin códigos:", re.findall(patron, "nada que buscar"))

lista = "A-12 B-7"
print("¿están todos?", all(c in lista for c in codigos))
print("lista vacía:", all([]))
`,
    experiments: [
      'Cambia `lista` por `"A-12 B-7 C-305"`: ahora `all` da `True`.',
      'Cambia `\\d+` por `\\d` en el patrón: cada cifra sale por separado.',
      'Prueba `all([True, False, True])`: basta un `False` para que sea `False`.',
    ],
    task: {
      prompt:
        'Guarda en `codigos` la lista de códigos que encuentra `patron` en `mensaje` y en `estan_todos` si todos aparecen tal cual en `inventario` (`True` o `False`).',
      starter: `import re
import numpy as np

patron = r"[A-Z]-\\d+"
mensaje = "Fichas T-41 y R-9 en la sala; mañana, R-77."
inventario = "T-41 R-9 M-2"
# Guarda en codigos la lista de códigos de mensaje y en estan_todos si todos aparecen en inventario
codigos = None
estan_todos = None
`,
      checks: `_l = isinstance(codigos, list)
check(_l, "\`codigos\` tiene que ser una lista: lo que devuelve \`re.findall\`.")
check((not _l) or codigos != [], "\`codigos\` está vacía: el patrón no ha encontrado nada. Hay que buscarlo en \`mensaje\`.")
check((not _l) or codigos == [] or codigos == ["T-41", "R-9", "R-77"], "\`codigos\` tiene que tener los tres códigos del mensaje, tal cual aparecen.")
_b = isinstance(estan_todos, (bool, np.bool_))
check(_b, "\`estan_todos\` tiene que ser \`True\` o \`False\`.")
check((not _b) or not estan_todos, "\`estan_todos\` vale \`True\`, pero «R-77» no está en el inventario: basta un código que falte para que el resultado sea \`False\`.")
`,
      reference: `import re
import numpy as np

patron = r"[A-Z]-\\d+"
mensaje = "Fichas T-41 y R-9 en la sala; mañana, R-77."
inventario = "T-41 R-9 M-2"
codigos = re.findall(patron, mensaje)
estan_todos = all(c in inventario for c in codigos)
`,
    },
  },
];
