import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Normalizar: lo nuevo de su ejercicio «Programar». */
export const normalizarWarmup: WarmupStep[] = [
  {
    id: 'normalizar.cal.1',
    title: '`keepdims=True`: dividir cada fila entre su propio número',
    explain:
      'Una función con `axis=1`, como `np.sum(M, axis=1)`, da **un número por fila**, en un vector de forma `(3,)` si `M` tiene 3 filas. Si divides `M` entre ese vector, NumPy lo reparte por **columnas**: o Python se para con un error, o, si la matriz es cuadrada, sale una cuenta equivocada sin avisar.\n\nCon `keepdims=True` el resultado conserva el eje que ha recorrido: sale como una **columna** de forma `(3, 1)`. Al dividir `M` entre una columna, cada fila se divide entre *su* número, el de su misma fila.\n\nVale igual para `np.linalg.norm(M, axis=1, keepdims=True)`, `np.mean` o `np.max`.',
    example: `import numpy as np

ventas = np.array([[2, 6],
                   [5, 5],
                   [1, 3]])
t = np.sum(ventas, axis=1)
print("sin keepdims:", t, "forma", t.shape)
t2 = np.sum(ventas, axis=1, keepdims=True)
print("con keepdims:")
print(t2)
print("forma", t2.shape)
print("cada fila entre su suma:")
print(ventas / t2)
`,
    experiments: [
      'Escribe `print(ventas / t)`: `t` tiene 3 números y `ventas` solo 2 columnas, así que Python se para con un `ValueError`. Lee el mensaje.',
      'Cambia `axis=1` por `axis=0` en la segunda suma: sale una fila de forma `(1, 2)`, una suma por columna, y ahora se divide cada columna.',
      'Suma las filas del resultado, `print(np.sum(ventas / t2, axis=1))`: ¿qué sale?',
    ],
    task: {
      prompt:
        'Cada fila de `votos` son los votos que recibió una lista en tres barrios. Guarda en `totales` la suma de cada fila, como una columna de 3 filas y 1 columna, y en `reparto` la matriz con cada fila dividida entre su total (así cada fila suma 1).',
      starter: `import numpy as np

votos = np.array([[2, 3, 5],
                  [10, 0, 0],
                  [1, 1, 2]])
# Guarda en totales la suma de cada fila (como columna) y en reparto cada fila dividida entre su total
totales = None
reparto = None
`,
      checks: `_v = np.array([[2, 3, 5], [10, 0, 0], [1, 1, 2]])
_t = isinstance(totales, np.ndarray) and np.issubdtype(totales.dtype, np.number)
check(_t, "\`totales\` tiene que ser un array de NumPy con números: la suma de cada fila de \`votos\`.")
check((not _t) or totales.shape != (3,), "\`totales\` tiene 3 números en una sola fila, de forma (3,). Para que salga como columna hace falta \`keepdims=True\`.")
check((not _t) or totales.shape != (1, 3), "\`totales\` es una fila de 3 números: son las sumas de las columnas. Hacen falta las de las filas: cambia \`axis\`.")
check((not _t) or totales.shape in ((3,), (1, 3)) or (totales.shape == (3, 1) and np.allclose(totales, [[10], [10], [4]])), "\`totales\` tiene que ser una columna con la suma de cada fila: 3 filas y 1 columna.")
_r = isinstance(reparto, np.ndarray) and np.issubdtype(reparto.dtype, np.number) and reparto.shape == (3, 3)
check(_r, "\`reparto\` tiene que ser un array de NumPy de 3 filas y 3 columnas, como \`votos\`.")
check((not _r) or not np.allclose(reparto, _v / _v.sum(axis=1)), "\`reparto\` divide cada columna entre la suma de una fila. Hay que dividir cada fila entre su suma, y eso necesita que la suma sea una columna.")
check((not _r) or not np.allclose(reparto, _v / _v.sum(axis=0)), "\`reparto\` divide cada columna entre su propio total. Hay que dividir cada fila entre el total de esa fila.")
check((not _r) or np.allclose(reparto, _v / _v.sum(axis=1, keepdims=True)), "\`reparto\` tiene que tener cada fila de \`votos\` dividida entre la suma de esa fila: así cada fila suma 1.")
`,
      reference: `import numpy as np

votos = np.array([[2, 3, 5],
                  [10, 0, 0],
                  [1, 1, 2]])
totales = np.sum(votos, axis=1, keepdims=True)
reparto = votos / totales
`,
    },
  },
  {
    id: 'normalizar.cal.2',
    title: '`np.where(cond, a, b)`: elegir entre dos opciones casilla a casilla',
    explain:
      '`np.where(cond, a, b)` recibe una condición con muchos `True` y `False` (por ejemplo, `x > 0`, que da uno por cada elemento de `x`) y devuelve un array del mismo tamaño: donde la condición es `True` toma el valor de `a`, y donde es `False`, el de `b`.\n\n`a` y `b` pueden ser un número (se repite) o un array del tamaño de `cond`. Es la forma de escribir un `if` que se aplica a todos los elementos a la vez, sin bucle.\n\nSirve, por ejemplo, para cambiar solo algunos valores y dejar los demás: `np.where(x < 0, 0, x)` deja `x` tal cual salvo donde era negativo, que pasa a valer 0.',
    example: `import numpy as np

x = np.array([4, -2, 0, 7, -5])
print("condición x > 0:", x > 0)
print("1 si es positivo, -1 si no:", np.where(x > 0, 1, -1))
print("el valor, o 0 si es negativo:", np.where(x > 0, x, 0))
print("con textos:", np.where(x > 0, "positivo", "no positivo"))
`,
    experiments: [
      'Cambia `x > 0` por `x >= 0` en la primera línea de `np.where`: el 0 deja de ir con los negativos. ¿Qué número cambia?',
      'Cambia `1, -1` por `x * 10, x`: el segundo y el tercer argumento también pueden ser arrays del tamaño de `x`.',
      'Prueba `np.where(x > 0, x, 0) + 1`: el resultado es un array normal y se sigue operando.',
    ],
    task: {
      prompt:
        'Una tienda rebaja 10 euros los productos que cuestan 100 o más. Guarda en `final` el precio de cada producto de `precios` tras la rebaja, sin bucles: los que cuestan menos de 100 se quedan igual.',
      starter: `import numpy as np

precios = np.array([80, 120, 100, 45, 250])
# Guarda en final los precios tras restar 10 a los que valen 100 o más
final = None
`,
      checks: `_ok = isinstance(final, np.ndarray) and final.shape == (5,) and np.issubdtype(final.dtype, np.number)
check(_ok, "\`final\` tiene que ser un array de NumPy con 5 números: el precio de cada producto tras la rebaja.")
check((not _ok) or not np.allclose(final, [80, 110, 100, 45, 240]), "\`final\` no rebaja el producto que cuesta justo 100: el 100 también entra, la condición tiene que incluirlo.")
check((not _ok) or not np.allclose(final, [70, 120, 100, 35, 250]), "\`final\` rebaja los baratos y deja los caros. Es al revés: el descuento es para los de 100 o más.")
check((not _ok) or np.allclose(final, [80, 110, 100, 45, 240]) or np.allclose(final, [70, 120, 100, 35, 250]) or np.allclose(final, [80, 110, 90, 45, 240]), "\`final\` tiene que restar 10 a los precios de 100 o más y dejar igual los demás.")
`,
      reference: `import numpy as np

precios = np.array([80, 120, 100, 45, 250])
final = np.where(precios >= 100, precios - 10, precios)
`,
    },
  },
  {
    id: 'normalizar.cal.3',
    title: '`np.allclose` y `np.array_equal`: ¿son iguales dos arrays?',
    explain:
      'Con arrays, `a == b` no da una respuesta, sino un array de `True` y `False`, uno por componente, y un `if` no sabe qué hacer con él. Para una sola respuesta, `True` o `False`, hay dos funciones:\n\n- `np.array_equal(a, b)` es `True` si tienen la misma forma y **exactamente** los mismos números; con formas distintas da `False`.\n- `np.allclose(a, b)` es `True` si los números son iguales salvo redondeos minúsculos. Los dos arrays tienen que tener formas que encajen: si no, Python se para con un error.\n\nCon decimales, casi siempre toca `np.allclose`: los cálculos redondean, y por eso `0.1 + 0.2` no es exactamente `0.3`.',
    example: `import numpy as np

a = np.array([0.1 + 0.2, 1.0])
b = np.array([0.3, 1.0])
print("a == b:", a == b)
print("exactamente iguales:", np.array_equal(a, b))
print("iguales salvo redondeos:", np.allclose(a, b))
print("con otra forma:", np.array_equal(a, np.array([0.3, 1.0, 5.0])))
`,
    experiments: [
      'Escribe `print(0.1 + 0.2 == 0.3)`: sale `False`, y es el motivo de que exista `np.allclose`.',
      'Cambia `1.0` por `1.5` en `b`: ahora ninguna de las dos funciones da `True`.',
      'Prueba `np.allclose(a, b + 0.01)`: una diferencia pequeña, pero no minúscula, ya no se considera redondeo.',
    ],
    task: {
      prompt:
        'Guarda en `exacto` si `p` y `r` son exactamente iguales, y en `casi` si son iguales salvo redondeos. Cada uno tiene que quedar con un solo `True` o `False`.',
      starter: `import numpy as np

p = np.array([1, 2, 2]) / 3
r = np.array([0.333333, 0.666667, 0.666667])
# Guarda en exacto si p y r son exactamente iguales, y en casi si lo son salvo redondeos
exacto = None
casi = None
`,
      checks: `_e = isinstance(exacto, (bool, np.bool_))
_c = isinstance(casi, (bool, np.bool_))
check(_e, "\`exacto\` tiene que ser un solo \`True\` o \`False\`, no un array: \`==\` compara componente a componente. Hace falta una función que dé una sola respuesta.")
check((not _e) or not exacto, "\`exacto\` vale \`True\`, pero \`r\` tiene los números cortados a seis cifras y \`p\` no: no son exactamente iguales.")
check(_c, "\`casi\` tiene que ser un solo \`True\` o \`False\`: la función de comparar con tolerancia da uno solo, no uno por componente.")
check((not _c) or casi, "\`casi\` vale \`False\`: la diferencia entre \`p\` y \`r\` es de unas millonésimas, un redondeo. Usa la comparación que lo tolera.")
`,
      reference: `import numpy as np

p = np.array([1, 2, 2]) / 3
r = np.array([0.333333, 0.666667, 0.666667])
exacto = np.array_equal(p, r)
casi = np.allclose(p, r)
`,
    },
  },
  {
    id: 'normalizar.cal.4',
    title: '`[::-1]`: dar la vuelta a una lista o a un array',
    explain:
      '`x[::-1]` es `x` leído de atrás hacia delante: el último elemento pasa a ser el primero. Vale para listas, arrays y textos, y no cambia `x`: crea uno nuevo.\n\nSu uso más frecuente es ordenar de mayor a menor. `np.argsort(x)` da las posiciones que ordenan `x` de menor a mayor, y `np.argsort(x)[::-1]` las da de mayor a menor.',
    example: `import numpy as np

x = np.array([10, 20, 30, 40])
print("al revés:", x[::-1])
print("x sigue igual:", x)

notas = np.array([5, 9, 7, 2])
print("posiciones de menor a mayor:", np.argsort(notas))
print("posiciones de mayor a menor:", np.argsort(notas)[::-1])
`,
    experiments: [
      'Prueba `print("Roma"[::-1])`: un texto también se da la vuelta.',
      'Escribe `print(np.argsort(notas)[::-1][:2])`: las posiciones de las dos notas mayores.',
      'Compara con `print(np.argsort(-notas))`: ordenar los opuestos da el mismo orden de mayor a menor.',
    ],
    task: {
      prompt:
        'Guarda en `de_mayor_a_menor` las posiciones de los números de `puntos` ordenadas de mayor a menor, y en `al_reves` el propio `puntos` leído de atrás hacia delante.',
      starter: `import numpy as np

puntos = np.array([3, 9, 4, 1, 7])
# Guarda en de_mayor_a_menor las posiciones de mayor a menor y en al_reves los puntos de atrás hacia delante
de_mayor_a_menor = None
al_reves = None
`,
      checks: `_o = np.asarray(de_mayor_a_menor) if isinstance(de_mayor_a_menor, (np.ndarray, list, tuple)) else None
_oi = _o is not None and _o.shape == (5,) and np.issubdtype(_o.dtype, np.integer)
check(_oi, "\`de_mayor_a_menor\` tiene que ser un array de NumPy (o una lista) con 5 posiciones, números enteros del 0 al 4.")
check((not _oi) or not np.array_equal(_o, [3, 0, 2, 4, 1]), "\`de_mayor_a_menor\` está de menor a mayor: así las da \`np.argsort\` sola. Hay que darles la vuelta.")
check((not _oi) or not np.array_equal(_o, [9, 7, 4, 3, 1]), "\`de_mayor_a_menor\` vale (9, 7, 4, 3, 1): son los valores ordenados y no sus posiciones.")
check((not _oi) or np.array_equal(_o, [1, 4, 2, 0, 3]) or np.array_equal(_o, [3, 0, 2, 4, 1]) or np.array_equal(_o, [9, 7, 4, 3, 1]), "\`de_mayor_a_menor\` tiene que ser las posiciones de los números de \`puntos\` empezando por el mayor.")
_a = isinstance(al_reves, np.ndarray) and al_reves.shape == (5,) and np.issubdtype(al_reves.dtype, np.number)
check(_a, "\`al_reves\` tiene que ser un array de NumPy con los 5 números de \`puntos\`.")
check((not _a) or not np.array_equal(al_reves, [3, 9, 4, 1, 7]), "\`al_reves\` es \`puntos\` tal cual: falta darle la vuelta.")
check((not _a) or np.array_equal(al_reves, [3, 9, 4, 1, 7]) or np.array_equal(al_reves, [7, 1, 4, 9, 3]), "\`al_reves\` tiene que ser \`puntos\` de atrás hacia delante: empieza por 7 y acaba en 3.")
`,
      reference: `import numpy as np

puntos = np.array([3, 9, 4, 1, 7])
de_mayor_a_menor = np.argsort(puntos)[::-1]
al_reves = puntos[::-1]
`,
    },
  },
];
