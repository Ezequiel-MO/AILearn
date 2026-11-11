import type { BankEntry } from '../../content/schema';
import { ANIMALES } from './datos';

/**
 * Entradas fijas del banco de examen de la Órbita 3 para el proyecto «Rango bajo y LoRA». La entrada
 * generada la añade otro paso. Ids: `examen-3.<tema>`, únicos en todo el juego (también frente a las
 * preguntas de proyecto).
 */
export const examen3RangoBajo: BankEntry[] = [
  {
    project: 'rango-bajo',
    question: {
      id: 'examen-3.lora-mascotas',
      type: 'laboratorio',
      prompt:
        'Seis animales con dos rasgos, **tamaño** y **domesticidad**. El modelo original, congelado, pone en su primera salida el tamaño y media domesticidad. La neurona de la tarea nueva mira esa salida y solo dice «mascota» si pasa de $1$: ahora se lo dice también al tigre y al oso.\n\nEntrena la corrección $B\\cdot A$ hasta que acierte con los seis.',
      hints: [
        'El tamaño no distingue un oso de un perro. Mira qué rasgo sí los distingue y cuánto tiene que pesar para que el hámster, pequeño y doméstico, pase el umbral.',
        'Deja que $B$ empuje en horizontal y que $A$ reste tamaño y sume domesticidad: la primera salida tiene que pasar a medir solo la domesticidad, con peso de sobra.',
      ],
      explain:
        'La corrección suma a cada animal $B$ multiplicado por $A\\cdot x$. Para acertar, la primera salida tiene que perder el tamaño y ganar domesticidad: con media domesticidad, el perro se queda justo en el umbral y el hámster no llega.',
      solution:
        'Con $B=(1, 0)$ y $A=(-1, 1)$, la primera salida es $1{,}5\\cdot$domesticidad: «hámster» llega a $2{,}25$ y los salvajes quedan por debajo de $-2$. Vale también $B=(2, 0)$ con $A=(-0{,}5;\\ 0{,}5)$. Restar solo el tamaño, con $B=(-1, 0)$ y $A=(1, 0)$, deja $0{,}5\\cdot$domesticidad: el perro queda en el umbral y el hámster, debajo.',
      lab: {
        kind: 'lora',
        range: 5,
        ...ANIMALES,
        w: { i: [1, 0], j: [0.5, 1] },
        limit: 2,
        step: 0.5,
        readout: { w: [1, 0], b: -1 },
        readouts: ['moved'],
      },
      goals: [
        {
          metric: 'acc',
          op: 'gte',
          target: 1,
          label: 'Aciertos de la neurona siguiente',
          format: 'percent',
        },
      ],
      solved: { b1: 1, a1: -1, a2: 1 },
    },
  },
  {
    project: 'rango-bajo',
    question: {
      id: 'examen-3.salida-afinada',
      type: 'vector',
      prompt:
        'Una capa congelada tiene $W=\\begin{pmatrix}1&0{,}5\\\\0&1\\end{pmatrix}$, y LoRA le suma $BA$ con la columna $B=(1;\\ -0{,}5)$ y la fila $A=(0{,}5;\\ 1)$. Le llega «feliz», con intensidad $2$ y tono $1{,}5$. Sin construir $W+BA$, calcula su salida afinada como se hace al entrenar: $Wx+B\\,(A\\cdot x)$.',
      hints: [
        'Primero $Wx$, lo que haría el modelo original. Después $A\\cdot x$, que es un solo número.',
        'Multiplica $B$ por ese número y súmalo a $Wx$.',
      ],
      explain:
        'Al entrenar no se construye $W+BA$: se calcula $Wx$ por un lado y $B\\,(A\\cdot x)$ por otro, que con rango bajo son muy pocas cuentas, y se suman.',
      solution:
        '$Wx=(2+0{,}75;\\ 1{,}5)=(2{,}75;\\ 1{,}5)$. $A\\cdot x=0{,}5\\cdot 2+1\\cdot 1{,}5=2{,}5$, y $B\\cdot 2{,}5=(2{,}5;\\ -1{,}25)$. La salida afinada es $(5{,}25;\\ 0{,}25)$. Con $(W+BA)\\,x$ sale lo mismo: el orden de las cuentas no cambia el resultado, solo el coste.',
      answer: [5.25, 0.25],
      tol: 0,
    },
  },
  {
    project: 'rango-bajo',
    question: {
      id: 'examen-3.mejor-rango-k',
      type: 'codigo',
      prompt:
        'Escribe `mejor_rango(M, k)`: recibe `M`, un array de NumPy de `m` filas y `n` columnas, y un entero `k` menor que ambos, y devuelve un array de las mismas `m` filas y `n` columnas con la **mejor aproximación de rango `k`** de `M`, hecha con las `k` piezas de mayor valor singular de su descomposición.',
      hints: [
        'Calcula la descomposición con `np.linalg.svd(M, full_matrices=False)` y suma las `k` primeras piezas: las `k` primeras columnas de `U`, los `k` primeros valores de `S` y las `k` primeras filas de `Vt`.',
        'Los valores de `S` multiplican a las columnas de `U`: `U[:, :k] * S[:k]`. Luego, `@ Vt[:k]`.',
      ],
      explain:
        'La mejor aproximación de rango $k$ es la suma de las $k$ piezas $\\sigma_{i}u_{i}v_{i}^{T}$ de mayor valor singular. En el producto de tres matrices, `U` se corta por columnas y `Vt` por filas, y los valores singulares tienen que entrar: sin ellos las piezas pesan todas igual. Comprueba que el resultado tiene la forma de `M`.',
      solution:
        'Dentro de la función, `U, S, Vt = np.linalg.svd(M, full_matrices=False)` y se devuelve `(U[:, :k] * S[:k]) @ Vt[:k]`, que tiene la forma de `M` y rango `k`. Errores típicos: olvidar `S`; quedarse con las `k` últimas piezas, las que menos pesan; o cortar `Vt` por columnas en lugar de por filas.',
      requirements: [
        '`mejor_rango` es una función que recibe un array `M` de `m` filas y `n` columnas y un entero `k`, y devuelve un array de NumPy de `m` filas y `n` columnas.',
        'Se llama a la función con varias matrices y valores de `k`, además de los del enunciado; no debe dar error ni modificar `M`.',
        'El resultado tiene rango `k` y es la mejor aproximación de `M` con ese rango. Se acepta una diferencia diminuta de redondeo.',
      ],
      starter: `import numpy as np


# Aquí no hay datos hechos: la función recibe los suyos. Las comprobaciones la llaman
# con varias matrices y distintos valores de k.

def mejor_rango(M, k):
    # M: un array de NumPy de m filas y n columnas. k: cuántas piezas quedarse, un número entero.
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría).
    # Usa M y k, no datos escritos a mano. La función termina con un return.
    # Ayuda: U, S, Vt = np.linalg.svd(M, full_matrices=False); U[:, :k] son las k primeras columnas
    # de U y Vt[:k] las k primeras filas de Vt; U[:, :k] * S[:k] multiplica cada columna por su valor.
    return None

# Para probarla antes de entregar: crea una matriz con np.array(...), llama a mejor_rango(matriz, 1),
# imprime el resultado con print(...) y pulsa «Ejecutar».
`,
      checks: `_data = [
    (np.array([[5, 3, 1], [3, 4, 2], [1, 2, 6], [2, 1, 3]], dtype=float), 1),
    (np.array([[2, 0, 1, 3], [1, 4, 0, 2], [0, 1, 5, 1]], dtype=float), 2),
    (np.array([[1, 2], [3, 1], [2, 5], [4, 0]], dtype=float), 1),
]
_f = callable(globals().get("mejor_rango"))
def _call(M, k):
    try:
        return mejor_rango(M.copy(), k)
    except Exception:
        return None
def _svd(M):
    return np.linalg.svd(M, full_matrices=False)
def _best(M, k):
    u, s, vt = _svd(M)
    return (u[:, :k] * s[:k]) @ vt[:k]
def _worst(M, k):
    u, s, vt = _svd(M)
    return (u[:, -k:] * s[-k:]) @ vt[-k:]
def _nos(M, k):
    u, s, vt = _svd(M)
    return u[:, :k] @ vt[:k]
_out = [_call(M, k) for M, k in _data] if _f else []
_shape = _f and all(isinstance(o, np.ndarray) and o.shape == M.shape and np.issubdtype(o.dtype, np.number) for o, (M, k) in zip(_out, _data))
_rank = _shape and all(np.linalg.matrix_rank(o) == k for o, (M, k) in zip(_out, _data))
_same = _rank and all(np.allclose(o, _best(M, k), atol=1e-6) for o, (M, k) in zip(_out, _data))
check(_f, "Hay que definir una función \`mejor_rango\` que reciba la matriz y \`k\`.")
check((not _f) or _shape, "\`mejor_rango\` tiene que devolver un array de NumPy con las mismas filas y columnas que \`M\`.")
check((not _shape) or _rank, "El resultado de \`mejor_rango\` tiene que tener rango \`k\`: se obtiene con \`k\` piezas de la descomposición, ni más ni menos.")
check((not _rank) or _same or not all(np.allclose(o, _worst(M, k), atol=1e-6) for o, (M, k) in zip(_out, _data)), "\`mejor_rango\` se queda con las piezas que menos pesan. Hay que quedarse con las \`k\` primeras, las de mayor valor singular.")
check((not _rank) or _same or not all(np.allclose(o, _nos(M, k), atol=1e-6) for o, (M, k) in zip(_out, _data)), "\`mejor_rango\` no usa los valores singulares: hay que multiplicar cada columna de \`U\` por su valor de \`S\`.")
check((not _rank) or _same or all(np.allclose(o, _worst(M, k), atol=1e-6) for o, (M, k) in zip(_out, _data)) or all(np.allclose(o, _nos(M, k), atol=1e-6) for o, (M, k) in zip(_out, _data)), "\`mejor_rango\` tiene rango \`k\` pero no es la mejor aproximación de \`M\`: revisa qué piezas sumas.")
`,
      reference: `import numpy as np


def mejor_rango(M, k):
    U, S, Vt = np.linalg.svd(M, full_matrices=False)
    return (U[:, :k] * S[:k]) @ Vt[:k]
`,
    },
  },
];
