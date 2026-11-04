import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto «Mínimos»: lo nuevo de su ejercicio «Programar». */
export const minimosWarmup: WarmupStep[] = [
  {
    id: 'minimos.cal.1',
    title: '`np.linspace` y `[:, None]`: probar muchos valores a la vez',
    explain:
      '`np.linspace(a, b, n)` da `n` números a partes iguales entre `a` y `b`, **los dos incluidos**: `np.linspace(0, 1, 5)` son 0, 0,25, 0,5, 0,75 y 1.\n\nPara probar **todas las combinaciones** de dos listas sin bucle se usa `[:, None]`: convierte un array en una **columna**. Una columna por una fila da una tabla, con una fila por cada elemento de la columna y una columna por cada elemento de la fila. Para la media de cada fila de la tabla se usa `.mean(axis=1)`.',
    example: `import numpy as np

pesos = np.linspace(0, 2, 5)
datos = np.array([1, 2, 3])
print("pesos:", pesos)
tabla = pesos[:, None] * datos
print("tabla (una fila por peso, una columna por dato):")
print(tabla)
print("forma:", tabla.shape)
print("media de cada fila:", tabla.mean(axis=1))
`,
    experiments: [
      'Cambia `np.linspace(0, 2, 5)` por `np.linspace(0, 2, 9)`: ahora hay 9 pesos y la tabla tiene 9 filas.',
      'Quita el `[:, None]` y mira el error: sin él, NumPy no sabe si los pesos van en filas o en columnas.',
      'Cambia `.mean(axis=1)` por `.mean(axis=0)`: ahora promedia cada columna, y salen 3 números en vez de 5.',
    ],
    task: {
      prompt:
        'Guarda en `precios` 5 precios repartidos a partes iguales de 2 a 10 (con `np.linspace`) y en `ingresos` una tabla con una fila por precio y una columna por cantidad de `cantidades`: el precio por la cantidad.',
      starter: `import numpy as np

cantidades = np.array([10, 20, 30])
# Guarda en precios los 5 precios de 2 a 10 y en ingresos la tabla de precio por cantidad
precios = None
ingresos = None
`,
      checks: `_c = np.array([10, 20, 30])
try:
    _p = np.asarray(precios, dtype=float)
except Exception:
    _p = None
try:
    _i = np.asarray(ingresos, dtype=float)
except Exception:
    _i = None
_pa = _p is not None and _p.shape == (5,)
_ia = _i is not None and _i.shape == (5, 3)
check(_pa, "\`precios\` tiene que ser un array con 5 números. Usa \`np.linspace(2, 10, 5)\`.")
check((not _pa) or bool(np.allclose(_p, [2, 4, 6, 8, 10])), "\`precios\` tiene que ir de 2 a 10 a partes iguales, con los dos extremos incluidos.")
check(_ia, "\`ingresos\` tiene que ser una tabla de 5 filas (una por precio) y 3 columnas (una por cantidad). Convierte \`precios\` en columna con \`[:, None]\`.")
check((not _ia) or (not _pa) or bool(np.allclose(_i, _p[:, None] * _c)), "\`ingresos\` tiene que valer el precio por la cantidad: la fila de cada precio multiplica a todas las cantidades.")
`,
      reference: `import numpy as np

cantidades = np.array([10, 20, 30])
precios = np.linspace(2, 10, 5)
ingresos = precios[:, None] * cantidades
`,
    },
  },
  {
    id: 'minimos.cal.2',
    title: '`np.argmin` y las máscaras con `&`',
    explain:
      '`np.argmin(v)` devuelve la **posición** del número menor de `v`, no el número: con `v = [5, 2, 9]` da `1`. Para sacar el valor se usa esa posición, `v[np.argmin(v)]`.\n\nUna **máscara** es un array de verdadero o falso. Comparar un array con un número, `v > 4`, da una máscara; y `v[máscara]` se queda con los elementos marcados. Para exigir **dos condiciones a la vez** se unen con `&` y **cada una va entre paréntesis**: `(v > 4) & (v < 9)`. La palabra `and` no sirve con arrays.',
    example: `import numpy as np

v = np.array([5, 2, 9, 7, 3])
print("posición del menor:", np.argmin(v))
print("el menor:", v[np.argmin(v)])
mascara = (v > 2) & (v < 9)
print("máscara:", mascara)
print("los marcados:", v[mascara])
`,
    experiments: [
      'Cambia `&` por `|` (el «o»): ahora basta con cumplir una de las dos condiciones.',
      'Cambia `np.argmin(v)` por `np.argmax(v)`: da la posición del mayor.',
      'Quita los paréntesis de una de las condiciones y mira el error: sin ellos, el orden de las operaciones falla.',
    ],
    task: {
      prompt:
        'Guarda en `pos_frio` la posición del día más frío de `temps` y en `templados` los valores que están **por encima de 20 y por debajo de 24**, con una máscara.',
      starter: `import numpy as np

temps = np.array([18, 21, 19, 25, 22, 16, 23])
# Guarda en pos_frio la posición del día más frío y en templados las temperaturas entre 20 y 24
pos_frio = None
templados = None
`,
      checks: `_t = np.array([18, 21, 19, 25, 22, 16, 23])
_pf = isinstance(pos_frio, (int, float, np.integer, np.floating)) and not isinstance(pos_frio, (bool, np.bool_))
try:
    _tm = np.asarray(templados, dtype=float)
except Exception:
    _tm = None
_ta = _tm is not None and _tm.ndim == 1
check(_pf, "\`pos_frio\` tiene que ser un número: la posición del día más frío.")
check((not _pf) or float(pos_frio) != 16, "\`pos_frio\` vale 16: es la temperatura más baja, no su posición. \`np.argmin\` da la posición.")
check((not _pf) or float(pos_frio) == 16 or int(pos_frio) == 5, "\`pos_frio\` no es la posición del día más frío de \`temps\`.")
check(_ta, "\`templados\` tiene que ser un array con las temperaturas que cumplen las dos condiciones.")
check((not _ta) or bool(np.allclose(_tm, [21, 22, 23])) or bool(np.allclose(_tm, _t[(_t > 20) & (_t < 24)])), "\`templados\` tiene que tener solo las temperaturas mayores que 20 y menores que 24, en su orden.")
`,
      reference: `import numpy as np

temps = np.array([18, 21, 19, 25, 22, 16, 23])
pos_frio = np.argmin(temps)
templados = temps[(temps > 20) & (temps < 24)]
`,
    },
  },
];
