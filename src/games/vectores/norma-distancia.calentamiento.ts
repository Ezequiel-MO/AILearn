import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Norma y distancia: lo nuevo de su ejercicio «Programar». */
export const normaDistanciaWarmup: WarmupStep[] = [
  {
    id: 'norma-distancia.cal.1',
    title: '`np.linalg.norm`: la longitud de un vector',
    explain:
      '`np.linalg.norm(v)` calcula la **norma** de `v`, es decir, su longitud. Recibe **un array** con las componentes, las que sean, y devuelve **un solo número**, normalmente con decimales: `10.0`, no `10`.\n\nEl nombre largo se lee «de NumPy, el apartado `linalg` (álgebra lineal), la función `norm`». Hay que pasarle el array entero: `np.linalg.norm(3, 4)` falla, y lo correcto es `np.linalg.norm(np.array([3, 4]))`.',
    example: `import numpy as np

a = np.array([6, 8])
print("norma de a:", np.linalg.norm(a))
b = np.array([2, 3, 6])
print("norma de b:", np.linalg.norm(b))
print("norma de -a:", np.linalg.norm(-a))
`,
    experiments: [
      'Cambia `a` por `np.array([0, 5])`: ¿cuánto mide una flecha que solo avanza en vertical?',
      'Compara la norma de `a` con la de `-a`: el signo no cambia la longitud.',
      'Prueba `print(np.linalg.norm(2 * a))`: ¿cuánto crece la norma al duplicar el vector?',
    ],
    task: {
      prompt: 'Guarda en `lp` la norma de `p` y en `lq`, la de `q`.',
      starter: `import numpy as np

p = np.array([1, 4, 8])
q = np.array([7, 24])
# Guarda en lp la norma de p y en lq la de q
lp = None
lq = None
`,
      checks: `def _num(a):
    return (isinstance(a, (int, float, np.number)) and not isinstance(a, bool)) or (isinstance(a, np.ndarray) and a.ndim == 0 and np.issubdtype(a.dtype, np.number))

check(_num(lp), "\`lp\` tiene que ser un número, la norma de \`p\`: no un array ni \`None\`.")
check((not _num(lp)) or not np.isclose(lp, 13), "\`lp\` vale 13: es la suma de las componentes, y la norma es otra cosa. \`np.linalg.norm\` hace todo el cálculo.")
check((not _num(lp)) or np.isclose(lp, 9), "\`lp\` tiene que valer 9, la norma de \`p\`: la longitud del vector (1, 4, 8).")
check(_num(lq), "\`lq\` tiene que ser un número, la norma de \`q\`: no un array ni \`None\`.")
check((not _num(lq)) or not np.isclose(lq, 31), "\`lq\` vale 31: es la suma de las componentes, y la norma es otra cosa. \`np.linalg.norm\` hace todo el cálculo.")
check((not _num(lq)) or np.isclose(lq, 25), "\`lq\` tiene que valer 25, la norma de \`q\`: la longitud del vector (7, 24).")
`,
      reference: `import numpy as np

p = np.array([1, 4, 8])
q = np.array([7, 24])
lp = np.linalg.norm(p)
lq = np.linalg.norm(q)
`,
    },
  },
  {
    id: 'norma-distancia.cal.2',
    title: '`x ** 2`, `np.sum` y `np.sqrt`: las piezas de una fórmula',
    explain:
      'Tres piezas que se encadenan para construir fórmulas:\n\n- `x ** 2`: eleva al cuadrado. Con un array, **cada componente**, y da otro array. (En Python `^` no es la potencia.)\n- `np.sum(x)`: suma todas las componentes de `x` y da **un número**.\n- `np.sqrt(n)`: la raíz cuadrada de un número; con un array, la de cada componente.\n\nSe leen de dentro hacia fuera: en `np.sqrt(np.sum(x ** 2))` primero van los cuadrados, después la suma y al final la raíz.',
    example: `import numpy as np

x = np.array([1, 2, 3])
print("cuadrados:", x ** 2)
print("suma de x:", np.sum(x))
print("suma de los cuadrados:", np.sum(x ** 2))
print("raíz de 49:", np.sqrt(49))
print("raíces de un array:", np.sqrt(np.array([1, 4, 9])))
`,
    experiments: [
      'Cambia `x ** 2` por `x ** 3` en la primera línea de resultados: ¿qué cambia?',
      'Pon un número negativo en `x`, como `-2`, y mira los cuadrados: el signo desaparece.',
      'Prueba `print(np.sqrt(-4))`: sale `nan`, «no es un número», y NumPy avisa con un mensaje. No se puede hacer la raíz de un número negativo.',
    ],
    task: {
      prompt:
        'Tres cuadrados tienen los lados de `lados`. Guarda en `areas` el área de cada cuadrado, en `total` la suma de las tres áreas y en `lado_total` el lado de un solo cuadrado cuya área sea ese total.',
      starter: `import numpy as np

lados = np.array([2, 4, 4])
# Guarda en areas el área de cada cuadrado, en total la suma de las áreas
# y en lado_total el lado de un cuadrado con esa área
areas = None
total = None
lado_total = None
`,
      checks: `def _num(a):
    return (isinstance(a, (int, float, np.number)) and not isinstance(a, bool)) or (isinstance(a, np.ndarray) and a.ndim == 0 and np.issubdtype(a.dtype, np.number))

_ok = isinstance(areas, np.ndarray) and areas.shape == (3,) and np.issubdtype(areas.dtype, np.number)
check(_ok, "\`areas\` tiene que ser un array de NumPy con 3 números: el área de cada cuadrado.")
check((not _ok) or not np.allclose(areas, [4, 8, 8]), "\`areas\` vale (4, 8, 8): has multiplicado por 2 en vez de elevar al cuadrado. El área de un cuadrado es el lado por sí mismo.")
check((not _ok) or np.allclose(areas, [4, 16, 16]), "\`areas\` tiene que valer (4, 16, 16): cada lado elevado al cuadrado.")
check(_num(total), "\`total\` tiene que ser un solo número: la suma de las tres áreas.")
check((not _num(total)) or not np.isclose(total, 10), "\`total\` vale 10: has sumado los lados. Hay que sumar las áreas, los lados al cuadrado.")
check((not _num(total)) or np.isclose(total, 36), "\`total\` tiene que valer 36: la suma de las tres áreas.")
check(_num(lado_total), "\`lado_total\` tiene que ser un número: el lado del cuadrado cuya área es \`total\`.")
check((not _num(lado_total)) or not np.isclose(lado_total, 36), "\`lado_total\` vale 36: es el área. El lado es el número que, elevado al cuadrado, da esa área.")
check((not _num(lado_total)) or np.isclose(lado_total, 6), "\`lado_total\` tiene que valer 6: la raíz cuadrada del área total.")
`,
      reference: `import numpy as np

lados = np.array([2, 4, 4])
areas = lados ** 2
total = np.sum(areas)
lado_total = np.sqrt(total)
`,
    },
  },
  {
    id: 'norma-distancia.cal.3',
    title: '`for`: repetir un bloque con sangría',
    explain:
      '`for k in lista:` repite las líneas de debajo una vez por cada elemento de la lista, y en cada vuelta `k` vale uno de ellos, por orden. Acaba en dos puntos, y las líneas que se repiten van **sangradas**: metidas hacia la derecha con la tecla Tab. La primera línea sin sangría ya queda fuera del bucle y se ejecuta una sola vez, al final.\n\nUn uso habitual es **acumular**: se crea una variable antes del bucle con el valor de partida y cada vuelta la actualiza. Si falta el valor de partida, Python se para con un `NameError`; si lo cambias dentro del bucle, empieza de nuevo en cada vuelta.',
    example: `datos = [3, 5, 8]
total = 0
for k in datos:
    total = total + k
    print("sumo", k, "y llevo", total)
print("total final:", total)
`,
    experiments: [
      'Quita la sangría de la línea `total = total + k`: el `for` se queda sin bloque y Python se para con un `IndentationError`.',
      'Cambia `total = 0` por `total = 100`: el valor de partida cuenta.',
      'Cambia `total + k` por `total * k`: con `total = 0` sale siempre 0, porque cualquier número por 0 da 0. Pon `total = 1` y vuelve a probar.',
    ],
    task: {
      prompt:
        'Guarda en `producto` el producto de todos los números de `factores`, recorriéndolos con un `for`. Antes del bucle tienes que dar a `producto` un valor de partida: piensa cuál no estropea una multiplicación.',
      starter: `import numpy as np

factores = [2, 3, 4, 5]
# Guarda en producto el producto de todos los factores, con un for
producto = None
`,
      checks: `_num = isinstance(producto, (int, float)) and not isinstance(producto, bool)
check(_num, "\`producto\` tiene que ser un número, no \`None\`: ponle un valor de partida y actualízalo dentro de un \`for\`.")
check((not _num) or producto != 0, "\`producto\` vale 0: has empezado en 0, y cualquier número por 0 da 0. Empieza con un valor que no cambie el resultado al multiplicar.")
check((not _num) or producto != 1, "\`producto\` vale 1: el bucle no ha cambiado nada. Dentro del \`for\`, con la línea sangrada, hay que multiplicar \`producto\` por cada \`k\`.")
check((not _num) or producto != 5, "\`producto\` vale 5, el último factor: en cada vuelta se pierde lo que había. Hay que multiplicar el valor anterior de \`producto\` por el factor.")
check((not _num) or producto != 14, "\`producto\` vale 14: has sumado. Se piden los factores multiplicados.")
check(_num and producto == 120, "\`producto\` tiene que valer 120: 2 por 3 por 4 por 5.")
`,
      reference: `import numpy as np

factores = [2, 3, 4, 5]
producto = 1
for k in factores:
    producto = producto * k
`,
    },
  },
  {
    id: 'norma-distancia.cal.4',
    title: '`if` dentro de un `for`: quedarse con el mejor',
    explain:
      'Si recorres un diccionario con `for clave in dic:`, `clave` va valiendo cada una de sus claves, que son **textos** (por eso se escriben entre comillas en el diccionario), y `dic[clave]` es el valor de esa clave.\n\n`if a > b:` ejecuta su bloque solo si `a` es mayor que `b`; sus líneas van con **un nivel más de sangría**. Cuidado: la comparación se escribe con `>` o `==` (dos signos); un `=` solo guarda.\n\nEl patrón para quedarse con el mejor: una variable con el mejor valor visto hasta ahora, que se compara en cada vuelta y se cambia solo cuando aparece uno mejor.',
    example: `puntos = {"rojo": 4, "azul": 9, "verde": 6}
for color in puntos:
    if puntos[color] > 5:
        print(color, "pasa de 5 con", puntos[color])
    else:
        print(color, "se queda en", puntos[color])
`,
    experiments: [
      'Cambia el 5 por un 8: ¿qué colores pasan ahora?',
      'Cambia `>` por `>=` y el 5 por un 6: ahora cuenta también el que vale justo 6.',
      'Escribe `if puntos[color] = 5:`, con un solo signo: Python se para con un `SyntaxError`, porque un `=` guarda y no compara.',
      'Cambia `color` por `c` en las cuatro apariciones: es solo un nombre, vale cualquiera.',
    ],
    task: {
      prompt:
        'Guarda en `caro` la clave del producto más caro de `precios`, y en `mayor` su precio. Recorre el diccionario con un `for`; `mayor` empieza en 0 y se cambia, junto con `caro`, solo cuando el precio visto es mayor.',
      starter: `import numpy as np

precios = {"pan": 2, "queso": 7, "miel": 9, "leche": 3}
# Guarda en caro el producto más caro y en mayor su precio
caro = None
mayor = 0
`,
      checks: `_str = isinstance(caro, str)
check(_str, "\`caro\` tiene que ser un texto, una de las claves de \`precios\`, no \`None\`: se guarda dentro del \`if\`, cuando el precio es mayor que \`mayor\`.")
check((not _str) or caro in precios, "\`caro\` tiene que ser una de las claves de \`precios\`: el nombre del producto, no su precio.")
check((not _str) or caro != "leche", "\`caro\` vale «leche», la última clave: ¿se guarda en cada vuelta, sin comparar? Mete \`caro = clave\` dentro de un \`if\` que compare el precio con \`mayor\`.")
check((not _str) or caro != "queso", "\`caro\` vale «queso», que tiene un precio alto pero no el mayor: revisa que \`mayor\` se actualice cuando se encuentra un precio mayor.")
check((not _str) or caro != "pan", "\`caro\` vale «pan», la primera clave: ¿el \`if\` está dentro del \`for\`, con sangría? El bucle tiene que mirar todas las claves.")
check(_str and caro == "miel", "\`caro\` tiene que ser el producto de mayor precio de \`precios\`: miel.")
_num = isinstance(mayor, (int, float)) and not isinstance(mayor, bool)
check(_num, "\`mayor\` tiene que ser un número: el precio del producto más caro.")
check((not _num) or mayor != 0, "\`mayor\` sigue valiendo 0: dentro del \`if\` hay que guardar también el precio nuevo en \`mayor\`.")
check((not _num) or mayor == 9, "\`mayor\` tiene que valer 9, el precio del producto más caro.")
`,
      reference: `import numpy as np

precios = {"pan": 2, "queso": 7, "miel": 9, "leche": 3}
caro = None
mayor = 0
for clave in precios:
    if precios[clave] > mayor:
        mayor = precios[clave]
        caro = clave
`,
    },
  },
];
