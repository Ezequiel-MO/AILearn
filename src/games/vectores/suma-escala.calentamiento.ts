import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto Suma y escala: lo nuevo de su ejercicio «Programar». */
export const sumaEscalaWarmup: WarmupStep[] = [
  {
    id: 'suma-escala.cal.1',
    title: 'Sumar listas y sumar arrays: `+` no hace lo mismo',
    explain:
      'En Python, el signo `+` hace cosas distintas según lo que une. Entre dos **listas** las **junta** en una más larga. Entre dos **arrays** de NumPy **suma componente a componente**: la primera con la primera, la segunda con la segunda… y da otro array del mismo tamaño.\n\nPor eso, para sumar vectores, primero hay que convertir las listas en arrays con `np.array`. Los dos arrays tienen que tener el mismo número de componentes.',
    example: `import numpy as np

a = [1, 2, 3]
b = [10, 20, 30]
print("listas con +:", a + b)
A = np.array(a)
B = np.array(b)
print("arrays con +:", A + B)
print("arrays con -:", B - A)
`,
    experiments: [
      'Cuenta los números de cada resultado: la lista tiene 6 y el array, 3.',
      'Cambia `B` por `np.array([10, 20])`, con una componente menos, y mira el `ValueError` con el que se para Python.',
      'Prueba `print(A + 100)`: sumar un solo número lo suma a todas las componentes.',
    ],
    task: {
      prompt:
        'Guarda en `suma` el array de NumPy que suma, componente a componente, las listas `x` e `y`.',
      starter: `import numpy as np

x = [4, 0, 7]
y = [1, 5, -2]
# Guarda en suma el array con la suma de x e y, componente a componente
suma = None
`,
      checks: `_ok = isinstance(suma, np.ndarray) and suma.shape == (3,) and np.issubdtype(suma.dtype, np.number)
check(not (isinstance(suma, list) and len(suma) == 6), "\`suma\` tiene 6 elementos: has juntado las dos listas en una. Para sumar componente a componente hacen falta arrays de NumPy.")
check(_ok, "\`suma\` tiene que ser un array de NumPy con 3 números: la suma de \`x\` e \`y\`.")
check((not _ok) or np.allclose(suma, [5, 5, 5]), "\`suma\` tiene que valer (5, 5, 5): la primera componente de \`x\` más la de \`y\`, y así con las demás.")
`,
      reference: `import numpy as np

x = [4, 0, 7]
y = [1, 5, -2]
suma = np.array(x) + np.array(y)
`,
    },
  },
  {
    id: 'suma-escala.cal.2',
    title: 'Número por array: escalar, dividir y decimales con punto',
    explain:
      'Un número por un array, `k * v`, multiplica **cada componente** por `k`. Con `v / k` pasa igual: se divide cada componente. Un `k` negativo da la vuelta a la flecha, y el `-1` la deja igual de larga pero al revés.\n\nLos decimales se escriben **con punto**: `0.1`. Con coma, `0,1` no es un número sino dos, y Python lo lee como una tupla: no da error, pero el resultado no es un array.',
    example: `import numpy as np

w = np.array([20, -30, 50])
print("por 2:", 2 * w)
print("por -1:", -1 * w)
print("por 0.1:", 0.1 * w)
print("entre 10:", w / 10)
`,
    experiments: [
      'Escribe `t = 0,1 * w` y `print(t)`: ¿qué sale? Una tupla con dos cosas, el `0` y un array. Cámbialo a `0.1`.',
      'Prueba `print(0 * w)`: el vector nulo.',
      'Compara `print(w * 2)` con `print(2 * w)`: da igual el orden en que pongas el número y el array.',
    ],
    task: {
      prompt:
        'Guarda en `cuarto` la cuarta parte de `v` (`0.25` veces `v`) y en `opuesto` el vector con la misma longitud que `v` y sentido contrario.',
      starter: `import numpy as np

v = np.array([8, -6, 10])
# Guarda en cuarto la cuarta parte de v y en opuesto el vector contrario a v
cuarto = None
opuesto = None
`,
      checks: `def _vec(a):
    return isinstance(a, np.ndarray) and a.shape == (3,) and np.issubdtype(a.dtype, np.number)

check(not isinstance(cuarto, tuple), "\`cuarto\` es una tupla, no un array: ¿has escrito el decimal con coma? En Python el decimal va con punto: \`0.25\`.")
check(_vec(cuarto), "\`cuarto\` tiene que ser un array de NumPy con 3 números: \`v\` escalado.")
check((not _vec(cuarto)) or not np.allclose(cuarto, [32, -24, 40]), "\`cuarto\` vale (32, -24, 40): has multiplicado por 4. La cuarta parte es multiplicar por 0,25 o dividir entre 4.")
check((not _vec(cuarto)) or np.allclose(cuarto, [2, -1.5, 2.5]), "\`cuarto\` tiene que valer (2; -1,5; 2,5): cada componente de \`v\` dividida entre 4.")
check(_vec(opuesto), "\`opuesto\` tiene que ser un array de NumPy con 3 números: \`v\` con el sentido contrario.")
check((not _vec(opuesto)) or not np.allclose(opuesto, [8, -6, 10]), "\`opuesto\` vale lo mismo que \`v\`: falta el signo menos, que es el que da la vuelta a la flecha.")
check((not _vec(opuesto)) or np.allclose(opuesto, [-8, 6, -10]), "\`opuesto\` tiene que valer (-8, 6, -10): cada componente de \`v\` con el signo cambiado.")
`,
      reference: `import numpy as np

v = np.array([8, -6, 10])
cuarto = 0.25 * v
opuesto = -1 * v
`,
    },
  },
  {
    id: 'suma-escala.cal.3',
    title: '`np.mean`: la media',
    explain:
      '`np.mean(x)` calcula la **media** de los números de `x`: los suma y divide entre cuántos son. Recibe un array (o una lista) y **devuelve un solo número**, casi siempre con decimales.\n\nSi `x` es una matriz, `np.mean(M)` mezcla **todos** sus números y da una media única. Para una media por fila o por columna hace falta otro argumento: es la ficha siguiente.',
    example: `import numpy as np

notas = np.array([6, 9, 4, 9, 7])
print("media:", np.mean(notas))
print("a mano:", (6 + 9 + 4 + 9 + 7) / 5)

M = np.array([[1, 2],
              [3, 8]])
print("media de toda la matriz:", np.mean(M))
`,
    experiments: [
      'Cambia un `9` de `notas` por un `0` y vuelve a ejecutar: la media baja.',
      'Prueba `print(np.mean([2, 4, 9]))`, con una lista en vez de un array: también funciona.',
      'Prueba `print(notas - np.mean(notas))`: restar un número a un array lo resta a cada componente. Salen las diferencias con la media.',
    ],
    task: {
      prompt:
        'Guarda en `media` la media de `gastos` y en `desvios` cuánto se aparta cada gasto de esa media: el gasto menos la media.',
      starter: `import numpy as np

gastos = np.array([120, 80, 95, 105])
# Guarda en media la media de gastos y en desvios cada gasto menos la media
media = None
desvios = None
`,
      checks: `_num = isinstance(media, (int, float, np.number)) and not isinstance(media, bool)
check(_num, "\`media\` tiene que ser un solo número: la media de \`gastos\`.")
check((not _num) or media == 100, "\`media\` tiene que valer 100: la suma de los cuatro gastos dividida entre 4.")
_ok = isinstance(desvios, np.ndarray) and desvios.shape == (4,) and np.issubdtype(desvios.dtype, np.number)
check(_ok, "\`desvios\` tiene que ser un array de NumPy con 4 números: uno por cada gasto.")
check((not _ok) or not np.allclose(desvios, [-20, 20, 5, -5]), "\`desvios\` tiene los signos cambiados: has restado al revés. Se pide el gasto menos la media.")
check((not _ok) or np.allclose(desvios, [20, -20, -5, 5]), "\`desvios\` tiene que valer (20, -20, -5, 5): cada gasto menos la media de los gastos.")
`,
      reference: `import numpy as np

gastos = np.array([120, 80, 95, 105])
media = np.mean(gastos)
desvios = gastos - media
`,
    },
  },
  {
    id: 'suma-escala.cal.4',
    title: '`axis`: una media por columna o por fila',
    explain:
      'Una matriz tiene dos **ejes**: el 0 recorre las filas (de arriba abajo) y el 1 recorre las columnas (de izquierda a derecha). Muchas funciones de NumPy, `np.mean` entre ellas, aceptan `axis=` para promediar a lo largo de uno:\n\n- `axis=0`: una media **por cada columna**.\n- `axis=1`: una media **por cada fila**.\n- Sin `axis`: una sola media de todo.\n\nPara no liarte, piensa cuántos números tiene que salir: con 2 filas y 3 columnas, `axis=0` da 3 números y `axis=1` da 2.',
    example: `import numpy as np

M = np.array([[1, 2, 3],
              [4, 5, 6]])
print("forma:", M.shape)
print("sin axis:", np.mean(M))
print("axis=0:", np.mean(M, axis=0))
print("axis=1:", np.mean(M, axis=1))
`,
    experiments: [
      'Cuenta los números que salen con `axis=0` y con `axis=1` y compáralos con la forma `(2, 3)`.',
      'Cambia `np.mean` por `np.sum` en las tres líneas: el mismo `axis` funciona igual con las sumas.',
      'Añade una tercera fila a `M` y mira qué resultado cambia de tamaño y cuál no.',
    ],
    task: {
      prompt:
        'Cada fila de `T` es una ciudad y cada columna, un día de la semana. Guarda en `por_dia` la temperatura media de cada día (una media por columna) y en `por_ciudad` la media de cada ciudad (una por fila).',
      starter: `import numpy as np

# Filas: 3 ciudades. Columnas: 4 días
T = np.array([[10, 12, 14, 16],
              [20, 18, 22, 24],
              [3, 3, 6, 2]])
# Guarda en por_dia una media por columna y en por_ciudad una media por fila
por_dia = None
por_ciudad = None
`,
      checks: `def _vec(a, k):
    return isinstance(a, np.ndarray) and a.shape == (k,) and np.issubdtype(a.dtype, np.number)

check(not (isinstance(por_dia, np.ndarray) and por_dia.shape == (3,)), "\`por_dia\` tiene 3 números: has promediado por filas, una media por ciudad. Para una media por columna usa el otro eje.")
check(not (isinstance(por_dia, (int, float, np.number)) and not isinstance(por_dia, bool)), "\`por_dia\` es un solo número: sin \`axis\`, \`np.mean\` mezcla todos los valores. Indica el eje para obtener una media por columna.")
check(_vec(por_dia, 4), "\`por_dia\` tiene que ser un array de NumPy con 4 números: una media por cada día.")
check((not _vec(por_dia, 4)) or np.allclose(por_dia, [11, 11, 14, 14]), "\`por_dia\` tiene que valer (11, 11, 14, 14): la media de cada columna de \`T\`.")
check(not (isinstance(por_ciudad, np.ndarray) and por_ciudad.shape == (4,)), "\`por_ciudad\` tiene 4 números: has promediado por columnas, una media por día. Para una media por fila usa el otro eje.")
check(not (isinstance(por_ciudad, (int, float, np.number)) and not isinstance(por_ciudad, bool)), "\`por_ciudad\` es un solo número: sin \`axis\`, \`np.mean\` mezcla todos los valores. Indica el eje para obtener una media por fila.")
check(_vec(por_ciudad, 3), "\`por_ciudad\` tiene que ser un array de NumPy con 3 números: una media por cada ciudad.")
check((not _vec(por_ciudad, 3)) or np.allclose(por_ciudad, [13, 21, 3.5]), "\`por_ciudad\` tiene que valer (13; 21; 3,5): la media de cada fila de \`T\`.")
`,
      reference: `import numpy as np

# Filas: 3 ciudades. Columnas: 4 días
T = np.array([[10, 12, 14, 16],
              [20, 18, 22, 24],
              [3, 3, 6, 2]])
por_dia = np.mean(T, axis=0)
por_ciudad = np.mean(T, axis=1)
`,
    },
  },
];
