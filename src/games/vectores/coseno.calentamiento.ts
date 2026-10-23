import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto El coseno: lo nuevo de su ejercicio «Programar». */
export const cosenoWarmup: WarmupStep[] = [
  {
    id: 'coseno.cal.1',
    title: '`np.arccos` y `np.degrees`: del coseno al ángulo',
    explain:
      '`np.arccos(c)` deshace el coseno: recibe un número `c` entre -1 y 1 y devuelve el ángulo que tiene ese coseno, **en radianes**. Con un array, lo hace para cada componente.\n\n`np.degrees(r)` pasa de radianes a grados. Casi siempre se escriben juntas: `np.degrees(np.arccos(c))`.\n\nPara orientarte: coseno 1 es un ángulo de 0 grados, coseno 0 es uno de 90 y coseno -1, uno de 180. El tropiezo típico es olvidar `np.degrees` y tomar por grados un número que está en radianes (por ejemplo, 1,5708 es un ángulo recto). Y pueden salir cifras de más al final, como `60.00000000000001`: es un redondeo.',
    example: `import numpy as np

def a_grados(c):
    radianes = np.arccos(c)
    return np.degrees(radianes)

print("coseno 1 ->", a_grados(1), "grados")
print("coseno 0 ->", a_grados(0), "grados")
print("coseno -1 ->", a_grados(-1), "grados")
print("coseno 0.5, en radianes:", np.arccos(0.5))
print("coseno 0.5, en grados:", a_grados(0.5))
print("tres cosenos de golpe:", a_grados(np.array([1, 0, -1])))
`,
    experiments: [
      'Prueba `a_grados(0.8)` y `a_grados(0.2)`: cuanto mayor es el coseno, más pequeño es el ángulo.',
      'Prueba `print(np.arccos(2))`: ningún ángulo tiene coseno 2, así que sale `nan`, que significa «no es un número».',
      'Quita `np.degrees` de la función y llámala con `a_grados(0)`: sale 1,5708, el ángulo recto en radianes.',
    ],
    task: {
      prompt:
        'Guarda en `radianes` el ángulo que corresponde a cada coseno de `cosenos` y en `grados` esos mismos ángulos pasados a grados.',
      starter: `import numpy as np

cosenos = np.array([0.5, 0, -0.5])
# Guarda en radianes el ángulo de cada coseno, y en grados esos mismos ángulos en grados
radianes = None
grados = None
`,
      checks: `def _vec(a):
    return isinstance(a, np.ndarray) and a.shape == (3,) and np.issubdtype(a.dtype, np.number)

check(_vec(radianes), "\`radianes\` tiene que ser un array de NumPy con 3 números: un ángulo por cada coseno.")
check((not _vec(radianes)) or not np.allclose(radianes, [60, 90, 120]), "\`radianes\` ya está en grados (60, 90, 120). Los radianes son lo que devuelve la función que deshace el coseno, sin pasarlo a grados.")
check((not _vec(radianes)) or np.allclose(radianes, np.arccos([0.5, 0, -0.5])), "\`radianes\` tiene que ser el ángulo de cada coseno, en radianes: el primero es un poco más de 1 y el último, un poco más de 2.")
check(_vec(grados), "\`grados\` tiene que ser un array de NumPy con 3 números: los tres ángulos, en grados.")
check((not _vec(grados)) or not np.allclose(grados, np.arccos([0.5, 0, -0.5])), "\`grados\` sigue en radianes: falta pasarlo a grados con la función que toca.")
check((not _vec(grados)) or np.allclose(grados, [60, 90, 120]), "\`grados\` tiene que valer (60, 90, 120): los mismos ángulos de \`radianes\`, pasados a grados.")
`,
      reference: `import numpy as np

cosenos = np.array([0.5, 0, -0.5])
radianes = np.arccos(cosenos)
grados = np.degrees(radianes)
`,
    },
  },
  {
    id: 'coseno.cal.2',
    title: '`np.clip`: dejar un número dentro de un rango',
    explain:
      '`np.clip(x, a, b)` deja `x` como está si cae entre `a` y `b`; si es menor que `a`, devuelve `a`; si es mayor que `b`, devuelve `b`. Con un array lo hace componente a componente y devuelve otro array.\n\nSirve contra los redondeos: un coseno que en matemáticas vale 1 puede salir como `1.0000000000000002`, y `np.arccos` solo acepta valores de -1 a 1, así que fuera de ese rango devuelve `nan`. Recortarlo antes, con `np.clip(c, -1, 1)`, lo evita sin cambiar los cosenos que ya estaban bien.',
    example: `import numpy as np

x = np.array([-3, 0, 5, 12])
print("recortado entre 0 y 10:", np.clip(x, 0, 10))
print("un solo número:", np.clip(7, 0, 5))

c = 1.0000000000000002
print("arccos sin recortar:", np.arccos(c))
print("arccos recortando antes:", np.arccos(np.clip(c, -1, 1)))
`,
    experiments: [
      'Cambia `np.clip(x, 0, 10)` por `np.clip(x, 2, 6)`: mira qué números cambian y cuáles se quedan igual.',
      'Cambia `c` por `0.3`, que ya está dentro del rango: `np.clip` lo deja como estaba.',
      'Cambia `c` por `-1.0000000000000002`: el mismo problema, pero por abajo.',
    ],
    task: {
      prompt:
        'Las notas de `notas` tienen que estar entre 0 y 100, pero algunas se han salido por error. Guarda en `ajustadas` un array donde las que bajan de 0 valgan 0 y las que pasan de 100 valgan 100.',
      starter: `import numpy as np

notas = np.array([-4, 35, 80, 120])
# Guarda en ajustadas las notas dejadas dentro del rango de 0 a 100
ajustadas = None
`,
      checks: `_ok = isinstance(ajustadas, np.ndarray) and ajustadas.shape == (4,) and np.issubdtype(ajustadas.dtype, np.number)
check(_ok, "\`ajustadas\` tiene que ser un array de NumPy con 4 números: una nota ajustada por cada nota de \`notas\`.")
check((not _ok) or not np.array_equal(ajustadas, [-4, 35, 80, 120]), "\`ajustadas\` sigue igual que \`notas\`: falta recortar las que se salen del rango.")
check((not _ok) or not np.array_equal(ajustadas, [0, 0, 0, 0]) and not np.array_equal(ajustadas, [100, 100, 100, 100]), "Todas las notas de \`ajustadas\` valen lo mismo: los límites, 0 y 100, solo sustituyen a las notas que se salen. Las que estaban dentro se quedan como estaban.")
check((not _ok) or np.array_equal(ajustadas, [0, 35, 80, 100]), "\`ajustadas\` tiene que valer (0, 35, 80, 100): el -4 pasa a 0, el 120 pasa a 100 y las notas de dentro no cambian.")
`,
      reference: `import numpy as np

notas = np.array([-4, 35, 80, 120])
ajustadas = np.clip(notas, 0, 100)
`,
    },
  },
  {
    id: 'coseno.cal.3',
    title: '`np.argsort`, `np.argmax` y `np.argmin`: posiciones, no valores',
    explain:
      'Estas tres funciones no devuelven valores, sino **posiciones** (contando desde 0):\n\n- `np.argmax(x)` es la posición del valor mayor y `np.argmin(x)`, la del menor.\n- `np.argsort(x)` son las posiciones que ordenarían `x` **de menor a mayor**. Con `[::-1]` detrás se da la vuelta: de mayor a menor.\n\nCon una posición `i` se saca el dato de otra lista: `nombres[i]` es el nombre que ocupa ese sitio. El tropiezo típico es entregar la posición donde se pedía el valor, o al revés.',
    example: `import numpy as np

temps = np.array([21, 35, 18, 30])
dias = ["lun", "mar", "mié", "jue"]
print("posición de la más alta:", np.argmax(temps))
print("posición de la más baja:", np.argmin(temps))
print("orden de menor a mayor:", np.argsort(temps))
print("orden de mayor a menor:", np.argsort(temps)[::-1])
i = np.argmax(temps)
print("el día más caluroso es", dias[i])
`,
    experiments: [
      'Cambia `35` por `10` y vuelve a ejecutar: ¿qué día es ahora el más caluroso?',
      'Escribe `print(temps[np.argsort(temps)])`: usar las posiciones como índices devuelve los valores ya ordenados.',
      'Escribe `print(dias[np.argsort(temps)[0]])`: el nombre del día más fresco.',
    ],
    task: {
      prompt:
        'Cada posición de `puntos` es el equipo con el mismo número en `equipos`. Guarda en `ranking` las posiciones de los equipos de más a menos puntos y en `colista` el **nombre** del equipo con menos puntos.',
      starter: `import numpy as np

equipos = ["Águilas", "Búhos", "Cuervos", "Delfines"]
puntos = np.array([14, 22, 9, 17])
# Guarda en ranking las posiciones de más a menos puntos, y en colista el nombre del que tiene menos
ranking = None
colista = None
`,
      checks: `_r = isinstance(ranking, np.ndarray) and ranking.shape == (4,) and np.issubdtype(ranking.dtype, np.integer)
check(_r, "\`ranking\` tiene que ser un array de NumPy con 4 posiciones (números enteros): una por equipo.")
check((not _r) or not np.array_equal(ranking, [2, 0, 3, 1]), "\`ranking\` va de menos a más puntos: esa es la ordenación de \`np.argsort\`. Hay que darle la vuelta.")
check((not _r) or sorted(ranking.tolist()) == [0, 1, 2, 3], "\`ranking\` tiene que ser una lista de posiciones, del 0 al 3, sin repetir: no los puntos de cada equipo.")
check((not _r) or not sorted(ranking.tolist()) == [0, 1, 2, 3] or np.array_equal(ranking, [1, 3, 0, 2]), "\`ranking\` tiene que valer (1, 3, 0, 2): la posición del equipo con más puntos, después la del siguiente, y así hasta el último.")
check(isinstance(colista, str), "\`colista\` tiene que ser un texto: el nombre del equipo, no su posición ni sus puntos.")
check((not isinstance(colista, str)) or colista == "Cuervos", "\`colista\` tiene que ser el nombre del equipo con menos puntos: busca su posición y úsala para sacar el nombre de \`equipos\`.")
`,
      reference: `import numpy as np

equipos = ["Águilas", "Búhos", "Cuervos", "Delfines"]
puntos = np.array([14, 22, 9, 17])
ranking = np.argsort(puntos)[::-1]
colista = equipos[np.argmin(puntos)]
`,
    },
  },
  {
    id: 'coseno.cal.4',
    title: '`np.linalg.norm` con `axis`: una norma por fila o por columna',
    explain:
      'Sin más, `np.linalg.norm(M)` mide la matriz entera y da **un número**. Con el parámetro `axis` se elige hacia dónde se mide: según su valor, devuelve un array con **una norma por fila** o con **una norma por columna**. El ejemplo enseña las dos; mira cuántos números salen en cada caso.\n\nEl resultado se puede combinar con otro array del mismo largo: `(M @ w) / normas` divide cada número de `M @ w` entre la norma de su fila, componente a componente. Si los largos no coinciden, NumPy se para con un `ValueError`.',
    example: `import numpy as np

M = np.array([[3, 4],
              [5, 12],
              [8, 15]])
print("norma de toda la matriz:", np.linalg.norm(M))
print("norma de cada fila:", np.linalg.norm(M, axis=1))
print("norma de cada columna:", np.linalg.norm(M, axis=0))

w = np.array([1, 1])
print("M @ w:", M @ w)
print("cada uno entre la norma de su fila:", (M @ w) / np.linalg.norm(M, axis=1))
`,
    experiments: [
      'Cambia `axis=1` por `axis=0` en la última línea: Python se para, porque salen 2 números y `M @ w` tiene 3.',
      'Mira las formas: añade `print(np.linalg.norm(M, axis=1).shape)` y `print(np.linalg.norm(M, axis=0).shape)`.',
      'Cambia una fila de `M` por `[6, 8]` y comprueba que su norma es 10.',
    ],
    task: {
      prompt:
        'Guarda en `por_fila` la norma de cada fila de `P` y en `por_columna` la norma de cada columna.',
      starter: `import numpy as np

P = np.array([[3, 4],
              [6, 8],
              [5, 12]])
# Guarda en por_fila una norma por fila y en por_columna una norma por columna
por_fila = None
por_columna = None
`,
      checks: `def _vec(a, n):
    return isinstance(a, np.ndarray) and a.shape == (n,) and np.issubdtype(a.dtype, np.number)

check(_vec(por_fila, 3) or _vec(por_fila, 2), "\`por_fila\` tiene que ser un array de NumPy con un número por fila de \`P\`: 3 números.")
check(not _vec(por_fila, 2), "\`por_fila\` tiene 2 números: has calculado una norma por columna. Para una por fila hay que cambiar el eje.")
check((not _vec(por_fila, 3)) or np.allclose(por_fila, [5, 10, 13]), "\`por_fila\` tiene que valer (5, 10, 13): la norma de cada fila de \`P\`.")
check(_vec(por_columna, 2) or _vec(por_columna, 3), "\`por_columna\` tiene que ser un array de NumPy con un número por columna de \`P\`: 2 números.")
check(not _vec(por_columna, 3), "\`por_columna\` tiene 3 números: has calculado una norma por fila. Para una por columna hay que cambiar el eje.")
check((not _vec(por_columna, 2)) or np.allclose(por_columna, np.sqrt([70, 224])), "\`por_columna\` tiene que ser la norma de cada columna de \`P\`: la raíz de la suma de los cuadrados de sus números.")
`,
      reference: `import numpy as np

P = np.array([[3, 4],
              [6, 8],
              [5, 12]])
por_fila = np.linalg.norm(P, axis=1)
por_columna = np.linalg.norm(P, axis=0)
`,
    },
  },
];
