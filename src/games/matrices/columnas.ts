import type { Project } from '../../content/schema';
import { py } from '../py';
import { columnasWarmup } from './columnas.calentamiento';
import { transformPlane } from './plane';

/** Primer proyecto de la Órbita 0: una matriz es la lista de adónde van î y ĵ. */
export const columnas: Project = {
  id: 'columnas',
  name: 'Columnas',
  sub: 'Adónde van î y ĵ',
  warmup: columnasWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'columnas.ex00.1',
          type: 'manipular',
          prompt:
            'Un **reflejo** respecto al eje horizontal da la vuelta al plano de arriba abajo, como un espejo apoyado sobre ese eje: $\\hat{\\imath}$, que está sobre el eje, se queda donde estaba, y $\\hat{\\jmath}$ pasa de apuntar arriba a apuntar abajo.\n\nArrastra las puntas hasta que $\\hat{\\imath}$ quede en $(1, 0)$ y $\\hat{\\jmath}$ en $(0, -1)$. Fíjate en el cuadrado unidad: se pone rojo y la lectura $\\det$ se vuelve negativa, porque el plano se ha dado la vuelta.',
          hints: [
            'Solo hay que mover $\\hat{\\jmath}$: la punta baja del $(0, 1)$ al $(0, -1)$.',
            'En la lectura de la matriz, la primera columna tiene que ser $1$ y $0$, y la segunda, $0$ y $-1$.',
          ],
          explain:
            'Las columnas de la matriz son los sitios a los que van $\\hat{\\imath}$ y $\\hat{\\jmath}$. Un reflejo no estira nada: solo cambia el sentido de una de las dos flechas, y por eso el cuadrado unidad conserva su área pero queda del revés.',
          solution:
            '$\\hat{\\imath}$ en $(1, 0)$ y $\\hat{\\jmath}$ en $(0, -1)$ dan la matriz $\\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}$. Todo punto $(x, y)$ acaba en $(x, -y)$. El determinante vale $-1$: el área no cambia, pero el signo negativo avisa de que la orientación del plano se ha invertido, y el cuadrado se ve rojo.',
          plane: transformPlane({ movable: true, readouts: ['matrix', 'det'] }),
          goals: [
            { metric: 'x', of: ['i'], target: 1, tol: 0.01 },
            { metric: 'y', of: ['i'], target: 0, tol: 0.01 },
            { metric: 'x', of: ['j'], target: 0, tol: 0.01 },
            { metric: 'y', of: ['j'], target: -1, tol: 0.01 },
          ],
        },
        {
          id: 'columnas.ex00.2',
          type: 'manipular',
          prompt:
            'Una **inclinación horizontal** deja cada recta horizontal en su altura, pero la desliza hacia la derecha tanto más cuanto más arriba está. $\\hat{\\imath}$ no se mueve, y $\\hat{\\jmath}$, que apuntaba arriba, se inclina hacia la derecha.\n\nLleva $\\hat{\\jmath}$ a $(1, 1)$ sin tocar $\\hat{\\imath}$. El cuadrado unidad se convierte en un paralelogramo.',
          hints: [
            'Agarra solo la punta de $\\hat{\\jmath}$ y llévala una unidad a la derecha, sin cambiar su altura.',
            'La rejilla sigue formada por rectas paralelas y equiespaciadas, solo que inclinadas.',
          ],
          explain:
            'Moviendo solo $\\hat{\\jmath}$ se deforma toda la rejilla, porque cada punto es una combinación de $\\hat{\\imath}$ y $\\hat{\\jmath}$. Compara la lectura $\\det$ con la del reflejo: aquí el cuadrado sigue sin ponerse rojo.',
          solution:
            '$\\hat{\\imath}$ en $(1, 0)$ y $\\hat{\\jmath}$ en $(1, 1)$ dan la matriz $\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$. El punto $(x, y)$ acaba en $(x+y,\\ y)$. El determinante sigue valiendo $1$: el paralelogramo tiene la misma área que el cuadrado y la misma orientación.',
          plane: transformPlane({ movable: true, readouts: ['matrix', 'det'] }),
          goals: [
            { metric: 'x', of: ['i'], target: 1, tol: 0.01 },
            { metric: 'y', of: ['i'], target: 0, tol: 0.01 },
            { metric: 'x', of: ['j'], target: 1, tol: 0.01 },
            { metric: 'y', of: ['j'], target: 1, tol: 0.01 },
          ],
        },
        {
          id: 'columnas.ex00.3',
          type: 'manipular',
          prompt:
            'Construye la transformación de esta matriz:\n\n$$A=\\begin{pmatrix}2&-1\\\\1&1\\end{pmatrix}$$\n\nSu primera columna es adónde va $\\hat{\\imath}$ y su segunda columna es adónde va $\\hat{\\jmath}$. Arrastra las puntas hasta que la lectura del panel sea la misma matriz.',
          hints: [
            'La primera columna, $2$ y $1$, son las coordenadas de la punta de $\\hat{\\imath}$: dos a la derecha y una arriba.',
            'La segunda columna, $-1$ y $1$, son las coordenadas de la punta de $\\hat{\\jmath}$: una a la izquierda y una arriba.',
          ],
          explain:
            'Leer una matriz por columnas es leer dos puntos: cada columna es una flecha del plano. Ponlas en su sitio y la rejilla entera se coloca sola.',
          solution:
            '$\\hat{\\imath}$ va a $(2, 1)$ y $\\hat{\\jmath}$ va a $(-1, 1)$. El determinante vale $2\\cdot 1-(-1)\\cdot 1=3$: el cuadrado unidad se convierte en un paralelogramo de área $3$, sin ponerse rojo.',
          plane: transformPlane({ movable: true, readouts: ['matrix'] }),
          goals: [
            { metric: 'x', of: ['i'], target: 2, tol: 0.01 },
            { metric: 'y', of: ['i'], target: 1, tol: 0.01 },
            { metric: 'x', of: ['j'], target: -1, tol: 0.01 },
            { metric: 'y', of: ['j'], target: 1, tol: 0.01 },
          ],
        },
        {
          id: 'columnas.ex00.4',
          type: 'manipular',
          prompt:
            'Hay matrices que **aplastan** el plano. Lleva $\\hat{\\jmath}$ al origen $(0, 0)$ y deja $\\hat{\\imath}$ en $(1, 0)$: toda la rejilla se cae sobre una recta, el eje horizontal, y el cuadrado unidad se queda sin área. La lectura $\\det$ lo dice.',
          hints: [
            'Lleva la punta de $\\hat{\\jmath}$ hasta el centro del plano, donde se cruzan los ejes.',
            'Cuando $\\hat{\\jmath}$ llega al origen, la segunda columna de la matriz es $0$ y $0$.',
          ],
          explain:
            'Con $\\hat{\\jmath}$ en el origen, todo lo que antes se movía en vertical desaparece. Todos los puntos del plano se quedan sobre una sola recta y la rejilla ya no se puede recuperar.',
          solution:
            '$\\hat{\\imath}$ en $(1, 0)$ y $\\hat{\\jmath}$ en $(0, 0)$ dan la matriz $\\begin{pmatrix}1&0\\\\0&0\\end{pmatrix}$. El punto $(x, y)$ acaba en $(x, 0)$: la altura se pierde. El determinante vale $0$, y no hay ninguna matriz que devuelva el plano a su estado de antes, porque puntos distintos han acabado en el mismo sitio.',
          plane: transformPlane({ movable: true, readouts: ['matrix', 'det'] }),
          goals: [
            { metric: 'x', of: ['i'], target: 1, tol: 0.01 },
            { metric: 'y', of: ['i'], target: 0, tol: 0.01 },
            { metric: 'x', of: ['j'], target: 0, tol: 0.01 },
            { metric: 'y', of: ['j'], target: 0, tol: 0.01 },
          ],
        },
        {
          id: 'columnas.ex00.5',
          type: 'manipular',
          prompt:
            'Una **media vuelta** alrededor del origen manda cada punto al que está justo al otro lado. Lleva $\\hat{\\imath}$ a $(-1, 0)$ y $\\hat{\\jmath}$ a $(0, -1)$. Compara con el reflejo del primer ejercicio: ¿se pone rojo el cuadrado?',
          hints: [
            'Las dos flechas pasan a apuntar en sentido contrario al que tenían.',
            'La lectura de la matriz tiene que mostrar $-1$ en la diagonal y $0$ fuera de ella.',
          ],
          explain:
            'Dar la vuelta a las dos flechas a la vez no invierte la orientación: el cuadrado no se ve rojo. El reflejo del primer ejercicio, en cambio, da la vuelta a una sola.',
          solution:
            '$\\hat{\\imath}$ en $(-1, 0)$ y $\\hat{\\jmath}$ en $(0, -1)$ dan la matriz $\\begin{pmatrix}-1&0\\\\0&-1\\end{pmatrix}$. Todo punto $(x, y)$ acaba en $(-x, -y)$, es decir, multiplicado por $-1$. El determinante vale $1$: se conservan el área y la orientación.',
          plane: transformPlane({ movable: true, readouts: ['matrix', 'det'] }),
          goals: [
            { metric: 'x', of: ['i'], target: -1, tol: 0.01 },
            { metric: 'y', of: ['i'], target: 0, tol: 0.01 },
            { metric: 'x', of: ['j'], target: 0, tol: 0.01 },
            { metric: 'y', of: ['j'], target: -1, tol: 0.01 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'columnas.ex01.1',
          type: 'vector',
          prompt:
            'Este plano muestra una transformación ya hecha. Lee adónde han ido $\\hat{\\imath}$ y $\\hat{\\jmath}$ y escribe la matriz $A$ de la transformación. Rellena las cuatro casillas.',
          hints: [
            'Mira primero la punta de $\\hat{\\imath}$ y escribe sus coordenadas en la primera columna, de arriba abajo.',
            'Haz lo mismo con $\\hat{\\jmath}$ en la segunda columna.',
          ],
          explain:
            'La primera columna de la matriz es el sitio al que ha ido $\\hat{\\imath}$ y la segunda, el de $\\hat{\\jmath}$. Las coordenadas de cada punto se escriben en vertical.',
          solution:
            '$\\hat{\\imath}$ ha ido a $(1, -1)$ y $\\hat{\\jmath}$ a $(2, 1)$, así que $A=\\begin{pmatrix}1&2\\\\-1&1\\end{pmatrix}$. Si pones cada pareja en una fila, sale la matriz traspuesta, que es otra transformación.',
          plane: transformPlane({ i: [1, -1], j: [2, 1] }),
          shape: [2, 2],
          answer: [1, 2, -1, 1],
          tol: 0,
        },
        {
          id: 'columnas.ex01.2',
          type: 'vector',
          prompt:
            'Una transformación tiene esta matriz:\n\n$$A=\\begin{pmatrix}3&1\\\\0&2\\end{pmatrix}$$\n\n¿Adónde va $\\hat{\\jmath}$? Escribe sus coordenadas: primero la $x$ y después la $y$.',
          hints: [
            'La imagen de $\\hat{\\jmath}$ es una columna entera de $A$. ¿Cuál?',
            'Léela de arriba abajo: la primera coordenada es la de arriba.',
          ],
          explain:
            'La imagen de $\\hat{\\jmath}=(0, 1)$ es la segunda columna de la matriz, no la segunda fila. Las filas mezclan las coordenadas de varias flechas.',
          solution:
            'La segunda columna de $A$ es $(1, 2)$, de modo que $\\hat{\\jmath}$ va a $(1, 2)$. La segunda fila es $(0, 2)$ y la primera columna es $(3, 0)$: son dos confusiones habituales.',
          answer: [1, 2],
          tol: 0,
        },
        {
          id: 'columnas.ex01.3',
          type: 'opcion',
          prompt:
            'Esta es la matriz de una transformación del plano:\n\n$$A=\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}$$\n\n¿Qué hace?',
          hints: [
            'Lee las columnas: ¿adónde va $\\hat{\\imath}=(1, 0)$ y adónde va $\\hat{\\jmath}=(0, 1)$?',
            'Los dos puntos se intercambian: mira qué pasa con las coordenadas de cualquier otro punto.',
          ],
          explain:
            'La primera columna dice que $\\hat{\\imath}$ va a $(0, 1)$ y la segunda, que $\\hat{\\jmath}$ va a $(1, 0)$. Con eso se sabe qué hace con todos los demás puntos.',
          solution:
            '$\\hat{\\imath}$ va a $(0, 1)$ y $\\hat{\\jmath}$ va a $(1, 0)$: las dos flechas intercambian sus sitios. Cada punto $(x, y)$ acaba en $(y, x)$, que es un reflejo respecto a la recta $y=x$. No es un giro de un cuarto de vuelta ni una inclinación, y como las flechas no se estiran, tampoco es un estiramiento.',
          options: [
            'Un giro de un cuarto de vuelta alrededor del origen',
            'Una inclinación horizontal: $\\hat{\\imath}$ se queda donde estaba',
            'Un reflejo respecto a la recta $y=x$: intercambia las dos coordenadas',
            'Un estiramiento que deja las dos flechas en su dirección',
          ],
          correct: 2,
        },
        {
          id: 'columnas.ex01.4',
          type: 'vector',
          prompt:
            'La transformación de este plano tiene la matriz\n\n$$A=\\begin{pmatrix}1&-1\\\\2&0\\end{pmatrix}$$\n\nEl punto $(2, 3)$ es $2\\,\\hat{\\imath}+3\\,\\hat{\\jmath}$: dos pasos de $\\hat{\\imath}$ y tres de $\\hat{\\jmath}$. Tras la transformación, son dos pasos de la nueva $\\hat{\\imath}$ y tres de la nueva $\\hat{\\jmath}$. ¿Adónde va el punto $(2, 3)$?',
          hints: [
            'Lee las columnas de $A$: ¿adónde van $\\hat{\\imath}$ y $\\hat{\\jmath}$?',
            'Suma dos veces la imagen de $\\hat{\\imath}$ y tres veces la de $\\hat{\\jmath}$, componente a componente.',
          ],
          explain:
            'Una transformación lineal conserva las combinaciones: si un punto es dos pasos de una flecha y tres de la otra, su imagen es dos pasos de la imagen de la primera y tres de la imagen de la segunda. No hace falta ningún producto de matrices.',
          solution:
            '$\\hat{\\imath}$ va a $(1, 2)$ y $\\hat{\\jmath}$ va a $(-1, 0)$. Entonces $(2, 3)$ va a $2\\cdot(1, 2)+3\\cdot(-1, 0)=(2-3,\\ 4+0)=(-1, 4)$.',
          plane: transformPlane({ i: [1, 2], j: [-1, 0] }),
          answer: [-1, 4],
          tol: 0,
        },
        {
          id: 'columnas.ex01.5',
          type: 'opcion',
          prompt:
            'Una capa lineal de una red neuronal es una matriz. Esta tiene 3 filas y 2 columnas:\n\n$$W=\\begin{pmatrix}1&0\\\\2&1\\\\0&3\\end{pmatrix}$$\n\nSus columnas son las imágenes de las flechas de entrada. ¿Qué vectores recibe y qué vectores devuelve?',
          hints: [
            'Cuenta cuántas columnas hay: cada una es la imagen de una flecha de la entrada.',
            'Cada columna tiene tantos números como filas hay, y esa es la forma de la salida.',
          ],
          explain:
            'El número de columnas es el de componentes de la entrada, y el de filas es el de componentes de la salida. En una matriz de $2\\times 2$ coinciden, y por eso allí no se nota.',
          solution:
            '$W$ tiene 2 columnas, así que recibe vectores de 2 componentes, y 3 filas, así que cada columna tiene 3 números y los resultados son vectores de 3 componentes. Convierte un vector de 2 componentes en uno de 3.',
          options: [
            'Recibe vectores de 3 componentes y devuelve vectores de 2',
            'Recibe vectores de 3 componentes y devuelve vectores de 3',
            'Recibe vectores de 2 componentes y devuelve vectores de 2',
            'Recibe vectores de 2 componentes y devuelve vectores de 3',
          ],
          correct: 3,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'columnas.ex02.1',
          type: 'codigo',
          prompt:
            'Una transformación manda $\\hat{\\imath}$ a `img_i` y $\\hat{\\jmath}$ a `img_j`. NumPy lee una lista de listas por **filas**, pero aquí cada imagen tiene que ir en una **columna**. Construye en `A` la matriz de la transformación.',
          hints: [
            'El plan es una sola línea: `A` tiene que tener `img_i` en su primera columna y `img_j` en la segunda. El error típico es escribir `np.array([img_i, img_j])`: NumPy lee cada lista como una fila y sale la matriz traspuesta, con las imágenes en las filas. Hay que colocarlas como columnas, con una función que apila como columnas o con una traspuesta.',
            'Las piezas, con otros vectores:\n\n' +
              py(
                'a = np.array([5, 6])',
                'b = np.array([7, 8])',
                'print(np.array([a, b]))          # dos filas: [5 6] y [7 8]',
                'print(np.array([a, b]).T)        # .T traspone: las filas pasan a ser columnas',
                'print(np.column_stack([a, b]))   # apila a y b como columnas, en un solo paso',
              ) +
              '\n\nLas dos últimas líneas imprimen la misma matriz: `a` en la primera columna y `b` en la segunda.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('A = np.column_stack([___, ___])') +
              '\n\nEl orden importa: la primera va a la primera columna. Si las intercambias, `î` y `ĵ` cambian de sitio.',
          ],
          explain:
            'Si metes `img_i` e `img_j` en una lista de listas, cada una queda como una fila, y la matriz sale traspuesta: la imagen de $\\hat{\\imath}$ acaba en la primera fila y no en la primera columna. Hay que colocarlas como columnas.',
          solution:
            'Se puede escribir `A = np.column_stack([img_i, img_j])`, que apila los vectores como columnas, o `A = np.array([img_i, img_j]).T`, que los apila como filas y traspone. El resultado es $\\begin{pmatrix}2&-1\\\\1&3\\end{pmatrix}$.',
          requirements: [
            '`A` existe y es un array de NumPy con números, de 2 filas y 2 columnas.',
            'La primera columna de `A` es `img_i`, la imagen de î, y la segunda es `img_j`, la de ĵ: las imágenes van en las columnas y no en las filas.',
          ],
          starter: `import numpy as np

# Ya está hecho: no hace falta tocarlo.
# img_i es adónde va î: un array de NumPy con 2 números (x e y), aquí [2 1].
# img_j es adónde va ĵ: otro array con 2 números, aquí [-1 3].
img_i = np.array([2, 1])
img_j = np.array([-1, 3])

# PASO 1. Construir A, la matriz de la transformación: su primera columna es
# img_i y su segunda columna es img_j.
# Por qué: una matriz guarda en sus columnas adónde van î y ĵ. Así, multiplicar
# por la matriz mueve cada punto como lo mueve la transformación.
# Cuidado: np.array([[1, 2], [3, 4]]) lee cada lista interior como una FILA, así
# que si le das [img_i, img_j] las imágenes quedan en las filas, y es la matriz
# traspuesta. Hay que colocarlas como columnas. Dos herramientas:
#   - np.column_stack([x, y]) apila los arrays x e y como columnas.
#   - Apilarlos como filas y añadir .T al final, que traspone (filas por columnas).
# Resultado esperado: un array de NumPy de 2 filas y 2 columnas.
A = None

# Para ver qué vale algo antes de entregar: print(A) y pulsa «Ejecutar».
`,
          checks: `_ok = isinstance(A, np.ndarray) and A.shape == (2, 2) and np.issubdtype(A.dtype, np.number)
_filas = _ok and np.allclose(A, [[2, 1], [-1, 3]])
_bien = _ok and np.allclose(A, [[2, -1], [1, 3]])
check(_ok, "\`A\` tiene que ser un array de NumPy de 2 filas y 2 columnas, con números: la matriz de la transformación.")
check(not _filas, "\`A\` tiene las imágenes de î y de ĵ en las filas, y tienen que ir en las columnas: es la matriz traspuesta de la pedida. La imagen de î va en la primera columna.")
check((not _ok) or _bien or _filas, "\`A\` no tiene las columnas pedidas: la primera tiene que ser (2, 1), la imagen de î, y la segunda, (-1, 3), la de ĵ.")
`,
          reference:
            'import numpy as np\n\nimg_i = np.array([2, 1])\nimg_j = np.array([-1, 3])\nA = np.column_stack([img_i, img_j])\n',
        },
        {
          id: 'columnas.ex02.2',
          type: 'codigo',
          prompt:
            'En una matriz de NumPy, `A[:, k]` es la columna `k` entera (el `:` del primer sitio significa «todas las filas»; se cuenta desde 0). Esas columnas son las imágenes de $\\hat{\\imath}$ y de $\\hat{\\jmath}$. Guarda en `col_i` la imagen de $\\hat{\\imath}$ y en `col_j` la de $\\hat{\\jmath}$.',
          hints: [
            'El plan son dos líneas. `col_i` es la primera columna de `A`, y la primera se cuenta con el número 0. `col_j` es la segunda columna, con el número 1. En los dos casos hay que dejar libre el primer sitio de los corchetes, el de las filas, para quedarte con todas. El error típico es escribir `A[0]`: con un solo número eliges una fila, no una columna.',
            'Las piezas, con otra matriz de 2 filas y 3 columnas:\n\n' +
              py(
                'M = np.array([[5, 6, 7], [8, 9, 10]])',
                'print(M[:, 0])   # la columna 0 entera: sus números son 5 y 8',
                'print(M[:, 2])   # la columna 2 entera: sus números son 7 y 10',
                'print(M[1])      # un solo número elige una FILA: la fila 1, con 8, 9 y 10',
              ) +
              '\n\nEn `M[:, k]`, lo que va antes de la coma son las filas (`:` es «todas») y lo que va después, la columna.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('col_i = A[:, ___]', 'col_j = A[:, ___]') +
              '\n\nEl número del hueco va después de la coma. Si lo pones solo, entre los corchetes, sale una fila.',
          ],
          explain:
            'La imagen de cada flecha es una columna, y para elegir una columna hay que dejar libre la primera posición, la de las filas, y poner el número de columna en la segunda. Con un solo número se elige una fila.',
          solution:
            '`col_i = A[:, 0]` vale $(3, 2)$ y `col_j = A[:, 1]` vale $(-1, 4)$. Con `A[0]` y `A[1]` se obtienen las filas $(3, -1)$ y $(2, 4)$, que son otra cosa.',
          requirements: [
            '`col_i` y `col_j` existen y son arrays de NumPy con 2 componentes, todas números.',
            '`col_i` es la imagen de î, la primera columna de `A` de arriba abajo, y no la primera fila.',
            '`col_j` es la imagen de ĵ, la segunda columna de `A` de arriba abajo, y no la segunda fila.',
          ],
          starter: `import numpy as np

# Ya está hecho: no hace falta tocarlo.
# A es la matriz de una transformación: un array de NumPy de 2 filas y 2 columnas.
# Sus filas son [3 -1] y [2 4]; sus columnas, [3 2] y [-1 4].
# Con un número, A[0] es la fila 0 entera (la primera). Las posiciones se cuentan desde 0.
A = np.array([[3, -1], [2, 4]])

# PASO 1. Guardar en col_i la imagen de î: la primera columna de A.
# Por qué: la columna 0 de una matriz dice adónde va î, y la columna 1, adónde va ĵ.
# Herramienta: A[:, k] elige la columna k entera. Antes de la coma van las filas:
# el : significa «todas». Después de la coma, el número de columna, contado desde 0.
# Ejemplo con otra matriz: M = np.array([[5, 6], [7, 8]]) y M[:, 1] vale [6 8].
# Resultado esperado: un array de NumPy con 2 números, uno por fila de A.
col_i = None

# PASO 2. Guardar en col_j la imagen de ĵ: la segunda columna de A, con la misma herramienta.
# Resultado esperado: otro array de NumPy con 2 números.
col_j = None

# Para ver qué vale algo antes de entregar: print(col_i) y pulsa «Ejecutar».
`,
          checks: `def _vec(a):
    return isinstance(a, np.ndarray) and a.shape == (2,) and np.issubdtype(a.dtype, np.number)

check(_vec(col_i), "\`col_i\` tiene que ser un array de NumPy con 2 números: la imagen de î.")
check((not _vec(col_i)) or not np.allclose(col_i, [3, -1]), "\`col_i\` vale (3, -1): es la primera fila de \`A\`, no la primera columna. Una columna recorre todas las filas, así que hace falta \`:\` en el primer sitio.")
check((not _vec(col_i)) or np.allclose(col_i, [3, -1]) or np.allclose(col_i, [3, 2]), "\`col_i\` tiene que valer (3, 2): los números de la primera columna de \`A\`, de arriba abajo.")
check(_vec(col_j), "\`col_j\` tiene que ser un array de NumPy con 2 números: la imagen de ĵ.")
check((not _vec(col_j)) or not np.allclose(col_j, [2, 4]), "\`col_j\` vale (2, 4): es la segunda fila de \`A\`, no la segunda columna. Una columna recorre todas las filas, así que hace falta \`:\` en el primer sitio.")
check((not _vec(col_j)) or np.allclose(col_j, [2, 4]) or np.allclose(col_j, [-1, 4]), "\`col_j\` tiene que valer (-1, 4): los números de la segunda columna de \`A\`, de arriba abajo.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[3, -1], [2, 4]])\ncol_i = A[:, 0]\ncol_j = A[:, 1]\n',
        },
        {
          id: 'columnas.ex02.3',
          type: 'codigo',
          prompt:
            'La **identidad** es la transformación que deja cada punto donde estaba: manda $\\hat{\\imath}$ a $\\hat{\\imath}$ y $\\hat{\\jmath}$ a $\\hat{\\jmath}$, así que sus columnas son $(1, 0)$ y $(0, 1)$. NumPy la crea con `np.eye(n)`, donde `n` es el número de filas y de columnas.\n\nCrea en `I` la identidad de 2 filas y 2 columnas, y guarda en `w` el resultado de multiplicar `I` por `v`, con `@`.',
          hints: [
            'El plan son dos líneas. Primero `I`: la identidad de 2 filas y 2 columnas, que NumPy crea con `np.eye(...)` y el número de filas y de columnas entre paréntesis. Después `w`: `I` multiplicada por `v` con `@`, en ese orden, la matriz primero. Como la identidad no mueve nada, `w` tiene que salir igual que `v`. El error típico es el tamaño: `np.eye(3)` es de 3 filas y 3 columnas.',
            'Las piezas, con otros tamaños y otra matriz:\n\n' +
              py(
                'print(np.eye(3))   # identidad de 3 filas y 3 columnas: unos en la diagonal, ceros fuera',
                'M = np.array([[2, 0], [0, 3]])',
                'x = np.array([1, 1])',
                'print(M @ x)       # @ multiplica la matriz por el vector: sale [2 3]',
              ) +
              '\n\nEn `M @ x`, la matriz va a la izquierda y el vector a la derecha.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('I = np.eye(___)', 'w = ___ @ ___') +
              '\n\nEl número del primer hueco es el de filas y columnas que pide el enunciado, y en `w` van la matriz y el vector, en ese orden.',
          ],
          explain:
            'La identidad tiene unos en la diagonal y ceros fuera de ella, y por eso cada columna es una de las flechas de partida. Multiplicar por ella no cambia ningún vector.',
          solution:
            'Se escribe `I = np.eye(2)`, que vale $\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}$, y `w = I @ v`. El resultado es $(3, -2)$, el mismo `v`: la identidad no mueve nada. Una matriz de unos o la de `np.eye(3)` no sirven: la primera mueve los puntos y la segunda tiene otro tamaño.',
          requirements: [
            '`I` existe y es un array de NumPy con números, de 2 filas y 2 columnas: ni de otro tamaño ni una matriz con unos también fuera de la diagonal.',
            '`I` es la identidad: sus columnas son (1, 0), la imagen de î, y (0, 1), la de ĵ.',
            '`w` existe y es un array de NumPy con 2 componentes, las dos números: el resultado de multiplicar `I` por `v`.',
          ],
          starter: `import numpy as np

# Ya está hecho: no hace falta tocarlo.
# v es un vector: un array de NumPy con 2 números (x e y), aquí [3 -2].
v = np.array([3, -2])

# PASO 1. Crear I, la identidad de 2 filas y 2 columnas.
# Por qué: la identidad es la transformación que deja todo donde estaba, y su
# matriz tiene por columnas las flechas de partida: î en la primera y ĵ en la segunda.
# Herramienta: np.eye(n) crea la identidad de n filas y n columnas, con unos en
# la diagonal y ceros fuera. Ejemplo: np.eye(3) es la de 3 filas y 3 columnas.
# Resultado esperado: un array de NumPy de 2 filas y 2 columnas.
I = None

# PASO 2. Guardar en w el resultado de multiplicar I por v.
# Por qué: así compruebas que la identidad no mueve ningún vector.
# Herramienta: a @ b multiplica una matriz por un vector (o por otra matriz).
# La matriz va a la izquierda del @ y el vector a la derecha.
# Resultado esperado: un array de NumPy con 2 números.
w = None

# Para ver qué vale algo antes de entregar: print(w) y pulsa «Ejecutar».
`,
          checks: `_I = isinstance(I, np.ndarray) and I.shape == (2, 2) and np.issubdtype(I.dtype, np.number)
_w = isinstance(w, np.ndarray) and w.shape == (2,) and np.issubdtype(w.dtype, np.number)
check(_I, "\`I\` tiene que ser un array de NumPy de 2 filas y 2 columnas, con números. Si has usado \`np.eye(3)\`, tiene 3 filas y 3 columnas: aquí hacen falta 2.")
check((not _I) or np.allclose(I, np.eye(2)) or np.allclose(I, np.ones((2, 2))), "\`I\` no es la identidad: sus columnas tienen que ser (1, 0), la imagen de î, y (0, 1), la de ĵ.")
check((not _I) or not np.allclose(I, np.ones((2, 2))), "\`I\` tiene unos también fuera de la diagonal: esa matriz aplasta el plano. La identidad solo tiene unos de la esquina de arriba a la izquierda a la de abajo a la derecha.")
check(_w, "\`w\` tiene que ser un array de NumPy con 2 números: el resultado de multiplicar \`I\` por \`v\`, con \`@\`.")
check((not _w) or np.allclose(w, [3, -2]), "\`w\` tiene que valer (3, -2), el mismo \`v\`: la identidad no mueve ningún vector.")
`,
          reference: 'import numpy as np\n\nv = np.array([3, -2])\nI = np.eye(2)\nw = I @ v\n',
        },
        {
          id: 'columnas.ex02.4',
          type: 'codigo',
          prompt:
            'Una **función** guarda un cálculo para repetirlo con otros datos. Se define con `def`, su cuerpo va sangrado y `return` dice qué devuelve. Un ejemplo con otra tarea, la media de dos números:\n\n```python\ndef media(x, y):\n    return (x + y) / 2\n```\n\nCompleta `matriz_desde(img_i, img_j)` para que reciba las imágenes de $\\hat{\\imath}$ y de $\\hat{\\jmath}$, como arrays de 2 números, y devuelva la matriz de 2 filas y 2 columnas de la transformación.',
          hints: [
            'El plan es una sola línea dentro de la función: `return` seguido de la matriz que tiene `img_i` en su primera columna e `img_j` en la segunda. Es la misma construcción del primer ejercicio, ahora con los nombres de los parámetros. El error típico es devolver las imágenes en las filas, que da la matriz traspuesta; y olvidar el `return`, con lo que la función no devuelve nada.',
            'Las piezas, con otra función y otros vectores:\n\n' +
              py(
                'def suma(x, y):',
                '    return x + y   # return devuelve el valor y termina la función',
                '',
                'print(suma(np.array([1, 2]), np.array([10, 20])))   # [11 22]',
                'print(np.column_stack([np.array([5, 6]), np.array([7, 8])]))   # [5 6] es la primera columna',
              ) +
              '\n\nLo que va dentro de la función lleva 4 espacios de sangría: así sabe Python que es parte de ella.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('def matriz_desde(img_i, img_j):', '    return np.column_stack([___, ___])') +
              '\n\nLa primera va a la primera columna. Con las dos intercambiadas, la matriz sale con las columnas cambiadas de sitio.',
          ],
          explain:
            'Es la misma construcción de antes, ahora guardada para usarla con cualquier pareja de imágenes. Si la función devuelve las imágenes en filas, el resultado sale traspuesto.',
          solution:
            'El cuerpo de la función es `return np.column_stack([img_i, img_j])`. Con `img_i = (1, 2)` e `img_j = (3, 4)` devuelve $\\begin{pmatrix}1&3\\\\2&4\\end{pmatrix}$. Con `np.array([img_i, img_j])` saldría la traspuesta, $\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}$.',
          requirements: [
            '`matriz_desde` existe y es una función que recibe dos vectores de 2 componentes, las imágenes de î y de ĵ.',
            'La función devuelve un array de NumPy con números, de 2 filas y 2 columnas, cuya primera columna es la imagen de î y cuya segunda columna es la de ĵ.',
            'Se prueba con otros pares de imágenes además del ejemplo del enunciado, y la función no puede dar ningún error con ellos.',
          ],
          starter: `import numpy as np


def matriz_desde(img_i, img_j):
    # img_i e img_j llegan como arrays de NumPy de 2 números: adónde van î y ĵ.
    # Por ejemplo, con [1 2] y [3 4] la función tiene que devolver la matriz de
    # filas [1 3] y [2 4]. Usa los nombres img_i e img_j, no números escritos a
    # mano: así la función sirve para cualquier pareja, y las comprobaciones la
    # prueban con otras.
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría):
    # así sabe Python que es parte de ella.

    # PASO 1. Devolver la matriz de 2 filas y 2 columnas cuyas columnas son img_i e img_j.
    # Por qué: es la construcción de antes, guardada para repetirla con cualquier pareja.
    # Herramienta: np.column_stack([x, y]) apila x e y como columnas. (Si los
    # apilas como filas con np.array([x, y]), sale la traspuesta.)
    # return devuelve un valor y termina la función en ese momento. Sin return, la función no devuelve nada.
    # Resultado esperado: un array de NumPy de 2 filas y 2 columnas.
    return None


# Para ver qué vale algo antes de entregar: print(matriz_desde(np.array([1, 2]), np.array([3, 4]))) y pulsa «Ejecutar».
`,
          checks: `_f = matriz_desde


def _llamar(a, b):
    try:
        r = np.asarray(_f(np.array(a), np.array(b)))
    except BaseException:
        return None
    if np.issubdtype(r.dtype, np.number) and r.shape == (2, 2):
        return r.astype(float)
    return None


_casos = [((1, 2), (3, 4), [[1, 3], [2, 4]]), ((2, -1), (0, 5), [[2, 0], [-1, 5]]), ((0, 0), (1, 1), [[0, 1], [0, 1]]), ((-3, 1), (2, -2), [[-3, 2], [1, -2]])]
_r = [_llamar(a, b) for a, b, _e in _casos]
_p = _r[0]
_filas = _p is not None and np.allclose(_p, [[1, 2], [3, 4]])
_mal = any(r is None or not np.allclose(r, e) for r, (_a, _b, e) in zip(_r, _casos))
check(_p is not None, "\`matriz_desde(img_i, img_j)\` tiene que devolver un array de NumPy de 2 filas y 2 columnas. Prueba con \`img_i = np.array([1, 2])\` e \`img_j = np.array([3, 4])\`: si no devuelve nada, falta el \`return\`; si da un error, revisa la construcción.")
check(not _filas, "Con \`img_i = (1, 2)\` e \`img_j = (3, 4)\` tu función devuelve las imágenes en las filas: es la matriz traspuesta. Las imágenes de î y de ĵ tienen que ir en las columnas.")
check((not _mal) or _p is None or _filas, "Tu función no devuelve la matriz correcta en todos los casos. Con \`(1, 2)\` y \`(3, 4)\` tiene que devolver la matriz de filas (1, 3) y (2, 4), y con \`(2, -1)\` y \`(0, 5)\`, la de filas (2, 0) y (-1, 5).")
`,
          reference: `import numpy as np


def matriz_desde(img_i, img_j):
    return np.column_stack([img_i, img_j])
`,
        },
        {
          id: 'columnas.ex02.5',
          type: 'codigo',
          prompt:
            'En una capa lineal de un clasificador de reseñas, la matriz de pesos `W` tiene 3 filas, una por salida («positiva», «neutra» y «negativa»), y 4 columnas, una por característica de entrada. La **columna** `k` de `W` dice cuánto empuja la característica `k` a cada una de las tres salidas.\n\nGuarda en `col` la columna de la característica 2 (se cuenta desde 0) y en `posicion` la posición de la salida a la que más empuja.',
          hints: [
            'El plan son dos líneas. `col` es la columna de la característica 2 de `W`, es decir, la tercera, porque se cuenta desde 0: hay que dejar libre el sitio de las filas para quedarte con todas. `posicion` es la posición, dentro de `col`, del peso más grande; y es la posición, no el peso. El error típico es devolver el propio peso mayor o la posición del menor.',
            'Las piezas, con otra matriz de 2 filas y 3 columnas:\n\n' +
              py(
                'M = np.array([[1, 9, 4], [7, 2, 8]])',
                'c = M[:, 1]                # la columna 1 entera: sus números son 9 y 2',
                'print(np.argmax(c))        # 0: la posición del 9, que es el mayor',
                'print(c[np.argmax(c)])     # 9: así se lee el mayor, pero eso es el peso y no la posición',
                'print(np.argmin(c))        # 1: la posición del menor, que es lo contrario',
              ) +
              '\n\nLas posiciones se cuentan desde 0, como las columnas.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('col = W[:, ___]', 'posicion = np.___(col)') +
              '\n\nEl segundo hueco es la función que busca el mayor, no el menor. Y `posicion` se queda con lo que devuelve, sin leer el peso.',
          ],
          explain:
            'Cada columna de `W` es el efecto de una característica sobre todas las salidas. Para saber a cuál empuja más, se busca la posición del peso mayor dentro de esa columna.',
          solution:
            '`col = W[:, 2]` vale $(-2, 1, 6)$: la característica empuja hacia abajo la primera salida y hacia arriba las otras dos. El peso mayor es $6$, que está en la posición 2, así que `posicion = np.argmax(col)` vale $2$, la salida «negativa». Si tomas la fila `W[2]` en lugar de la columna, buscas otra cosa: cómo reciben las cuatro características a una sola salida.',
          requirements: [
            '`col` existe y es un array de NumPy con 3 componentes, todas números, una por salida.',
            '`col` es la columna de la característica 2 de `W`, de arriba abajo, y no una de sus filas.',
            '`posicion` existe y es un número entero: el lugar que ocupa dentro de `col` la salida a la que más empuja la característica, y no el valor de ese peso.',
          ],
          starter: `import numpy as np

# Ya está hecho: no hace falta tocarlo.
# W es la matriz de pesos de una capa lineal: un array de NumPy de 3 filas y 4 columnas.
# Cada fila es una salida (positiva, neutra, negativa) y cada columna, una característica de entrada.
# Las posiciones se cuentan desde 0: la característica 2 es la tercera columna.
W = np.array([
    [2, -1, -2, 0],
    [0, 4, 1, 1],
    [-1, 0, 6, 9],
])

# PASO 1. Guardar en col la columna de la característica 2 de W.
# Por qué: la columna k dice cuánto empuja la característica k a cada salida,
# así que con ella sabes el efecto de esa característica sobre las tres.
# Herramienta: W[:, k] elige la columna k entera. Antes de la coma van las filas
# (el : significa «todas») y después el número de columna, contado desde 0.
# Con un solo número, W[2] sería una fila, que es otra cosa.
# Resultado esperado: un array de NumPy con 3 números, uno por salida.
col = None

# PASO 2. Guardar en posicion la posición de la salida a la que más empuja.
# Por qué: la salida a la que más empuja es la del peso mayor de col, y lo que
# se pide es su posición (0, 1 o 2), no el valor del peso.
# Herramienta: np.argmax(x) devuelve la posición del número más grande de x.
# Ejemplo: np.argmax(np.array([4, 9, 1])) vale 1. (np.argmin da la del menor.)
# Resultado esperado: un número entero.
posicion = None

# Para ver qué vale algo antes de entregar: print(col) y pulsa «Ejecutar».
`,
          checks: `def _vec(a):
    return isinstance(a, np.ndarray) and a.shape == (3,) and np.issubdtype(a.dtype, np.number)

_fila = isinstance(col, np.ndarray) and col.shape == (4,) and np.issubdtype(col.dtype, np.number) and np.allclose(col, W[2])
_ent = isinstance(posicion, (int, np.integer)) and not isinstance(posicion, bool)
check(_vec(col) or _fila, "\`col\` tiene que ser un array de NumPy con 3 números, uno por salida: la columna de la característica 2.")
check(not _fila, "\`col\` vale (-1, 0, 6, 9): es una fila de \`W\`, con un peso por característica. Una columna tiene un peso por salida, así que hace falta \`:\` en el primer sitio.")
check((not _vec(col)) or np.allclose(col, [-2, 1, 6]), "\`col\` tiene que valer (-2, 1, 6): los pesos de la tercera columna de \`W\`, de arriba abajo.")
check(_ent, "\`posicion\` tiene que ser un número entero: la posición de la salida, no su peso. \`np.argmax\` da la posición del mayor.")
check((not _ent) or posicion != 6, "\`posicion\` vale 6, que es el peso mayor de la columna y no su posición. Necesitas la posición del mayor, que es lo que da \`np.argmax\`.")
check((not _ent) or posicion != 0, "\`posicion\` vale 0: es la salida a la que menos empuja, la del peso más pequeño. Busca la posición del peso mayor.")
check((not _ent) or posicion in (0, 6) or posicion == 2, "\`posicion\` tiene que valer 2: el peso mayor de la columna es 6, y está en la tercera posición.")
`,
          reference:
            'import numpy as np\n\nW = np.array([\n    [2, -1, -2, 0],\n    [0, 4, 1, 1],\n    [-1, 0, 6, 9],\n])\ncol = W[:, 2]\nposicion = np.argmax(col)\n',
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'columnas.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere la matriz `A` de la transformación que manda $\\hat{\\imath}$ a $(2, 1)$ y $\\hat{\\jmath}$ a $(-1, 3)$, y la comprueba multiplicándola por $\\hat{\\imath}$ (NumPy ya está importado como `np`). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        '¿Dónde acaba cada imagen dentro de la matriz, en una fila o en una columna?',
        'Mira qué debería imprimir la última línea y qué imprimiría con la matriz tal como está construida.',
      ],
      explain:
        'Una lista de listas de NumPy se lee por filas. Piensa dónde queda cada imagen y qué columna de la matriz se obtiene al multiplicar por la primera flecha.',
      solution:
        'La tercera línea está mal. `np.array([img_i, img_j])` coloca las imágenes como filas, y la matriz sale traspuesta: la primera columna es $(2, -1)$ y no $(2, 1)$. La última línea imprime $(2, -1)$ en lugar de la imagen de $\\hat{\\imath}$. Lo correcto es `np.column_stack([img_i, img_j])` o añadir `.T`.',
      lines: [
        'img_i = np.array([2, 1])',
        'img_j = np.array([-1, 3])',
        'A = np.array([img_i, img_j])',
        'print(A @ np.array([1, 0]))',
      ],
      faultyLine: 2,
    },
    {
      id: 'columnas.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula adónde manda $\\hat{\\imath}$ una transformación. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Con un solo número, `A[0]` elige la primera línea horizontal de números de la matriz.',
        '¿Qué parte de la matriz es la imagen de $\\hat{\\imath}$: una fila o una columna?',
      ],
      explain:
        'Revisa cada línea: ¿lo que se afirma sobre `A[0]` es cierto? ¿De ahí se deduce lo que se dice después?',
      solution:
        'La segunda línea está mal. `A[0]` es la primera **fila** de la matriz, $(1, 3)$, y la imagen de $\\hat{\\imath}$ es la primera **columna**, $(1, 2)$. Para sacarla se escribe `A[:, 0]`. Por eso la tercera línea, que da $(1, 3)$, arrastra el error.',
      lines: [
        'La matriz es A = [[1, 3], [2, 4]], escrita por filas',
        'A[0] es la imagen de î',
        'Entonces î va a (1, 3)',
      ],
      faultyLine: 1,
    },
    {
      id: 'columnas.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento interpreta una matriz de pesos de una capa lineal. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Cuenta los números de cada columna y compáralos con las salidas.',
        'Una columna es la imagen de una flecha de entrada: decide a qué característica corresponde cada una.',
      ],
      explain:
        'Revisa cada línea: ¿el tamaño de la matriz cuadra con lo que se dice de las salidas y de las características? ¿La columna que se elige corresponde a la característica que se nombra?',
      solution:
        'No hay ningún error. Con 3 filas y 4 columnas, cada columna tiene 3 números, uno por salida, y hay una columna por característica. La columna de índice 1 es la de la segunda característica y dice cuánto la empuja a cada una de las tres salidas.',
      lines: [
        'W tiene 3 filas y 4 columnas: 3 salidas y 4 características de entrada',
        'Cada columna de W tiene 3 números, uno por salida',
        'La columna de índice 1, la segunda, dice cómo la segunda característica empuja a cada una de las 3 salidas',
      ],
      faultyLine: null,
    },
  ],
};
