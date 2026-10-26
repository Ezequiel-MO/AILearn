import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto PCA: lo nuevo de su ejercicio «Programar». */
export const pcaWarmup: WarmupStep[] = [
  {
    id: 'pca.cal.1',
    title: 'Centrar los datos: restar la media de cada columna',
    explain:
      'Un array de 4 filas y 2 columnas es una tabla: cada fila es un dato y cada columna, una variable. `T.mean(axis=0)` calcula **la media de cada columna** (promedia a lo largo de las filas) y devuelve un array con 2 números, uno por columna; con `axis=1` saldría una media por fila.\n\nRestar ese array de 2 números a la tabla, `T - media`, resta a cada columna su media en todas las filas a la vez: NumPy repite el array fila a fila, y eso se llama **difusión**. Es **centrar** los datos. Tras centrarlos, la media de cada columna es 0, salvo un error de redondeo diminuto, así que se comprueba con `np.allclose(..., 0)` y no con `== 0`.',
    example: `import numpy as np

T = np.array([[20, 5], [22, 9], [18, 4], [24, 8]])
media = T.mean(axis=0)
print("media de cada columna:", media)
print("media de cada fila:", T.mean(axis=1))

Tc = T - media
print("centrada:")
print(Tc)
print("nueva media de cada columna:", Tc.mean(axis=0))
print("¿es 0?", np.allclose(Tc.mean(axis=0), 0))
`,
    experiments: [
      'Cambia `axis=0` por `axis=1` en la primera media y ejecuta: sale una media por fila, 4 números, y restarla a `T` da un error, porque `T` solo tiene 2 columnas.',
      'Escribe `print(T.mean())`: sin `axis` sale un solo número, la media de todos los datos juntos, que no sirve para centrar cada variable.',
      'Añade una fila `[26, 11]` a `T`: las medias cambian, y `Tc` sigue teniendo media 0 en cada columna.',
      'Escribe `print(Tc.sum(axis=0))`: la suma de cada columna también es 0 (o casi, por el redondeo).',
    ],
    task: {
      prompt:
        'Cada fila de `notas` es un alumno y cada columna, una asignatura. Guarda en `centradas` las notas con la media de cada asignatura restada, y en `ya_centrado` si la media de cada columna de `centradas` es 0, comparada con `np.allclose` (un solo `True` o `False`).',
      starter: `import numpy as np

notas = np.array([[6, 8, 5], [7, 5, 9], [9, 6, 7], [4, 7, 3]])
# Guarda en centradas las notas menos la media de cada columna y en ya_centrado si esa media es 0 (con np.allclose)
centradas = None
ya_centrado = None
`,
      checks: `_c = isinstance(centradas, np.ndarray) and centradas.shape == (4, 3) and np.issubdtype(centradas.dtype, np.number)
_b = isinstance(ya_centrado, (bool, np.bool_))
_n = np.array([[6, 8, 5], [7, 5, 9], [9, 6, 7], [4, 7, 3]], dtype=float)
check(_c, "\`centradas\` tiene que ser un array de NumPy de 4 filas y 3 columnas: las notas con la media restada.")
check((not _c) or not np.allclose(centradas, _n - _n.mean()), "\`centradas\` resta la media de todas las notas juntas. Cada asignatura tiene la suya: hay que restar la media de cada columna.")
check((not _c) or np.allclose(centradas, _n - _n.mean()) or np.allclose(centradas, _n - _n.mean(axis=0)), "\`centradas\` tiene que ser las notas menos la media de su columna: la media de cada asignatura se resta a todos los alumnos.")
check(_b, "\`ya_centrado\` tiene que ser un solo \`True\` o \`False\`: el resultado de \`np.allclose\`.")
check((not _b) or bool(ya_centrado), "\`ya_centrado\` vale \`False\`: tras centrar, la media de cada columna es 0 salvo el redondeo. Compárala con 0 usando \`np.allclose\`.")
`,
      reference: `import numpy as np

notas = np.array([[6, 8, 5], [7, 5, 9], [9, 6, 7], [4, 7, 3]])
centradas = notas - notas.mean(axis=0)
ya_centrado = np.allclose(centradas.mean(axis=0), 0)
`,
    },
  },
  {
    id: 'pca.cal.2',
    title: '`np.linalg.eigh`: autovalores y autovectores de una matriz simétrica',
    explain:
      'Un **autovector** de una matriz $A$ es una dirección que $A$ solo estira o encoge, sin girarla: $A\\vec{v}=\\lambda\\vec{v}$. El factor $\\lambda$ es su **autovalor**.\n\n`valores, vectores = np.linalg.eigh(A)` los calcula cuando `A` es **simétrica** (igual que su traspuesta, como una matriz de covarianza) y devuelve dos cosas:\n\n- `valores`: los autovalores en un array, **de menor a mayor**.\n- `vectores`: una matriz cuyas **columnas** son los autovectores, de norma 1 y en el mismo orden. El de `valores[0]` es `vectores[:, 0]`.\n\nPara tenerlos de mayor a menor se da la vuelta con `[::-1]`: `valores[::-1]` para los autovalores y `vectores[:, ::-1]` para las columnas. El signo de un autovector es arbitrario: $\\vec{v}$ y $-\\vec{v}$ son la misma dirección.',
    example: `import numpy as np

S = np.array([[5, 2], [2, 2]])
valores, vectores = np.linalg.eigh(S)
print("autovalores, de menor a mayor:", valores)
print("autovectores, uno por columna:")
print(vectores)

mayor = vectores[:, -1]
print("autovector del mayor:", mayor)
print("S aplicada a él:", S @ mayor)
print("el autovalor por él:", valores[-1] * mayor)
print("autovalores de mayor a menor:", valores[::-1])
`,
    experiments: [
      'Escribe `print(vectores[0])`: es la primera **fila**, y en general no es un autovector (con esta `S` simétrica de covarianza, las filas y las columnas coinciden, pero no es la regla). Cambia `S` por `np.array([[1, 2], [2, -2]])` y compara `vectores[0]` con `vectores[:, 0]`: ahora la fila ya no es un autovector. Los autovectores son las columnas.',
      'Cambia `S` por `np.array([[3, 0], [0, 7]])`, diagonal: los autovalores son 3 y 7, los números de la diagonal, y los autovectores son los ejes.',
      'Escribe `print(np.linalg.norm(mayor))`: mide 1.',
      'Escribe `print(vectores[:, ::-1])`: las mismas columnas en orden inverso, con la del autovalor mayor primero.',
    ],
    task: {
      prompt:
        'Guarda en `vals` los autovalores de `A` de mayor a menor y en `u` el autovector de norma 1 del autovalor mayor (cualquiera de sus dos signos vale).',
      starter: `import numpy as np

A = np.array([[1, 2], [2, -2]])
# Guarda en vals los autovalores de A de mayor a menor y en u el autovector de norma 1 del autovalor mayor
vals = None
u = None
`,
      checks: `_A = np.array([[1, 2], [2, -2]], dtype=float)
_v = isinstance(vals, np.ndarray) and vals.shape == (2,) and np.issubdtype(vals.dtype, np.floating)
_u = isinstance(u, np.ndarray) and u.shape == (2,) and np.issubdtype(u.dtype, np.floating)
_w, _V = np.linalg.eigh(_A)
check(_v, "\`vals\` tiene que ser un array de NumPy con 2 números: los autovalores de \`A\`.")
check((not _v) or not np.allclose(vals, _w), "\`vals\` está de menor a mayor, el orden en que los devuelve \`eigh\`. Tienen que ir de mayor a menor: dale la vuelta con \`[::-1]\`.")
check((not _v) or np.allclose(vals, _w) or np.allclose(vals, _w[::-1]), "\`vals\` tiene que tener los dos autovalores de \`A\`, de mayor a menor.")
check(_u, "\`u\` tiene que ser un array de NumPy con 2 números: un autovector de \`A\`.")
check((not _u) or abs(float(np.linalg.norm(u)) - 1) < 1e-6, "\`u\` tiene que medir 1, como los autovectores que devuelve \`eigh\`.")
check((not _u) or abs(float(np.linalg.norm(u)) - 1) >= 1e-6 or not abs(float(u @ _V[:, 0])) > 0.999999, "\`u\` es el autovector del autovalor menor. El mayor es el último de \`eigh\`, que ordena de menor a mayor.")
check((not _u) or abs(float(np.linalg.norm(u)) - 1) >= 1e-6 or abs(float(u @ _V[:, 0])) > 0.999999 or abs(float(u @ _V[:, 1])) > 0.999999, "\`u\` no es un autovector de \`A\`. Los autovectores son las columnas de la matriz que devuelve \`eigh\`, no las filas.")
`,
      reference: `import numpy as np

A = np.array([[1, 2], [2, -2]])
valores, vectores = np.linalg.eigh(A)
vals = valores[::-1]
u = vectores[:, -1]
`,
    },
  },
  {
    id: 'pca.cal.3',
    title: '`np.cumsum` y `np.argmax`: el primer sitio donde se cumple algo',
    explain:
      '`np.cumsum(x)` devuelve la **suma acumulada**: un array del mismo tamaño en que cada posición suma todo lo anterior y a sí misma. `np.cumsum([1, 2, 3])` da `[1, 3, 6]`.\n\nUna comparación como `acum >= 5` da un array de `True` y `False`, y `np.argmax` de ese array es la **posición del primer `True`**. Las posiciones empiezan en 0: la posición 2 es el tercer elemento, así que para contar elementos hay que sumar 1.\n\nUn aviso: si no hay ningún `True`, `np.argmax` devuelve 0 sin quejarse, y parece una respuesta válida. Conviene asegurarse antes de que alguno se cumple.',
    example: `import numpy as np

pedidos = np.array([8, 5, 4, 2, 1])
acum = np.cumsum(pedidos)
print("acumulado:", acum)

fraccion = acum / pedidos.sum()
print("fracción acumulada:", fraccion)

cumple = fraccion >= 0.5
print("¿llega a la mitad?", cumple)
pos = np.argmax(cumple)
print("primera posición:", pos, "-> contando desde 1:", pos + 1)
`,
    experiments: [
      'Cambia `0.5` por `0.9`: la posición cambia. ¿Cuántos pedidos hacen falta ahora?',
      'Cambia `0.5` por `2`, algo que nunca se alcanza: todo es `False` y `np.argmax` devuelve 0, que parece una respuesta y no lo es.',
      'Escribe `print(np.cumsum(pedidos[::-1]))`: acumular en el orden inverso da otros números, así que el orden importa.',
      'Escribe `print(cumple.sum())`: cuenta los `True`, es decir, cuántas posiciones llegan a la mitad.',
    ],
    task: {
      prompt:
        '`ventas` está ordenada de mayor a menor. Guarda en `acum` su suma acumulada y en `n_top` cuántos productos, empezando por el primero, hacen falta como mínimo para reunir al menos el 70 % de las ventas totales (un entero que cuenta desde 1).',
      starter: `import numpy as np

ventas = np.array([40, 25, 15, 10, 6, 4])
# Guarda en acum la suma acumulada y en n_top cuántos productos hacen falta para llegar al 70 % del total
acum = None
n_top = None
`,
      checks: `_v = np.array([40, 25, 15, 10, 6, 4], dtype=float)
_a = isinstance(acum, np.ndarray) and acum.shape == (6,) and np.issubdtype(acum.dtype, np.number)
_n = isinstance(n_top, (int, np.integer)) and not isinstance(n_top, (bool, np.bool_))
check(_a, "\`acum\` tiene que ser un array de NumPy con 6 números: la suma acumulada de \`ventas\`.")
check((not _a) or np.allclose(acum, np.cumsum(_v)), "\`acum\` tiene que sumar, en cada posición, todas las ventas hasta ella, en el orden de \`ventas\`.")
check(_n, "\`n_top\` tiene que ser un número entero: cuántos productos hacen falta.")
check((not _n) or n_top != 2, "\`n_top\` vale 2, la posición contada desde 0. La cuenta de productos empieza en 1: hay que sumar 1 a la posición.")
check((not _n) or n_top in (2, 4) or n_top == 3, "\`n_top\` tiene que ser el menor número de productos cuyas ventas suman al menos el 70 % del total.")
check((not _n) or n_top != 4, "\`n_top\` es demasiado grande: con un producto menos ya se llega al 70 %.")
`,
      reference: `import numpy as np

ventas = np.array([40, 25, 15, 10, 6, 4])
acum = np.cumsum(ventas)
n_top = int(np.argmax(acum / ventas.sum() >= 0.7)) + 1
`,
    },
  },
  {
    id: 'pca.cal.4',
    title: '`plt.annotate`: el nombre de cada punto',
    explain:
      '`plt.scatter(xs, ys)` dibuja un punto por cada pareja de coordenadas, pero no dice cuál es cuál. `plt.annotate(texto, (x, y))` escribe `texto` junto al punto `(x, y)`. `plt.text(x, y, texto)` hace lo mismo con los argumentos en otro orden.\n\nPara poner el nombre de cada punto se recorre la lista de nombres con su posición, `for i, nombre in enumerate(nombres):`, y dentro del bucle se anota el nombre `i` en las coordenadas `i`. Todo sale en **Figuras** al pulsar Ejecutar.',
    example: `import numpy as np
import matplotlib.pyplot as plt

nombres = ["Alba", "Berta", "Carlos", "Dana"]
xs = np.array([1.0, 2.5, 4.0, 3.0])
ys = np.array([2.0, 3.5, 1.0, 0.5])

plt.scatter(xs, ys)
for i, nombre in enumerate(nombres):
    plt.annotate(nombre, (xs[i], ys[i]))
plt.xlim(0, 5)
plt.ylim(0, 4)
plt.grid(True)
`,
    experiments: [
      'Cambia `plt.annotate(nombre, (xs[i], ys[i]))` por `plt.text(xs[i], ys[i], nombre)`: sale lo mismo.',
      'Añade `xytext=(5, 5), textcoords="offset points"` dentro del paréntesis de `plt.annotate`, tras las coordenadas: el nombre se separa un poco de su punto.',
      'Añade un quinto nombre a `nombres` sin añadir coordenadas: Python se para con un `IndexError`, porque `xs` no tiene quinta posición.',
      'Añade `plt.title("Cuatro personas")` antes de acabar.',
    ],
    task: {
      prompt:
        'Dibuja con `plt.scatter` los cuatro puntos de coordenadas `este` y `norte`, y escribe junto a cada uno su nombre de `lugares`, con `plt.annotate` o con `plt.text`.',
      starter: `import numpy as np
import matplotlib.pyplot as plt

lugares = ["Faro", "Puerto", "Mina", "Aldea"]
este = np.array([1, 4, 2, 5])
norte = np.array([3, 1, 4, 5])
plt.xlim(0, 6)
plt.ylim(0, 6)
plt.grid(True)
# Dibuja los cuatro puntos con plt.scatter y escribe el nombre de cada uno junto a su punto
`,
      checks: `_este = [1, 4, 2, 5]
_norte = [3, 1, 4, 5]
_lug = ["Faro", "Puerto", "Mina", "Aldea"]
_fig = len(plt.get_fignums()) > 0
check(_fig, "No hay ninguna figura: dibuja los puntos con \`plt.scatter\`.")
_axs = plt.gcf().axes if _fig else []
_pts = [tuple(float(c) for c in p) for ax in _axs for col in ax.collections if type(col).__name__ == "PathCollection" for p in np.asarray(col.get_offsets())]
check((not _fig) or len(_pts) >= 4, "Faltan puntos: tiene que haber 4 puntos en la figura, uno por cada lugar.")
check((not _fig) or len(_pts) <= 4, "Sobran puntos: dibuja solo los cuatro lugares.")
check((not _fig) or len(_pts) != 4 or sorted(_pts) == sorted(zip(map(float, _este), map(float, _norte))), "Los puntos no están donde dicen \`este\` y \`norte\`: la primera lista es la coordenada horizontal y la segunda, la vertical.")
_tx = [(t.get_text(), tuple(float(c) for c in (t.xy if hasattr(t, "xy") else t.get_position()))) for ax in _axs for t in ax.texts]
check((not _fig) or all(any(n == s for s, _ in _tx) for n in _lug), "Falta el nombre de algún lugar: escribe el de cada uno con \`plt.annotate\` o \`plt.text\`.")
check((not _fig) or not all(any(n == s for s, _ in _tx) for n in _lug) or all(any(s == n and abs(p[0] - _este[i]) < 1e-6 and abs(p[1] - _norte[i]) < 1e-6 for s, p in _tx) for i, n in enumerate(_lug)), "Cada nombre tiene que ir en el punto de su lugar: el \`i\`-ésimo nombre, en las coordenadas \`i\`-ésimas de \`este\` y \`norte\`.")
`,
      reference: `import numpy as np
import matplotlib.pyplot as plt

lugares = ["Faro", "Puerto", "Mina", "Aldea"]
este = np.array([1, 4, 2, 5])
norte = np.array([3, 1, 4, 5])
plt.xlim(0, 6)
plt.ylim(0, 6)
plt.grid(True)
plt.scatter(este, norte)
for i, lugar in enumerate(lugares):
    plt.annotate(lugar, (este[i], norte[i]))
`,
    },
  },
];
