import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 3 para el proyecto «Rango bajo y LoRA». La entrada
 * generada la añade otro paso. Ids: `examen-3.<tema>`, únicos en todo el juego (también frente a las
 * preguntas de proyecto).
 */
export const examen3RangoBajo: BankEntry[] = [
  {
    project: 'rango-bajo',
    question: {
      id: 'examen-3.lora-b-cero',
      type: 'opcion',
      prompt:
        'En LoRA, la actualización $\\Delta W=BA$ se inicializa con $B$ toda de ceros y $A$ con números aleatorios. ¿Para qué sirve empezar con $B$ a cero?',
      hints: [
        'Calcula $BA$ al empezar el entrenamiento, con $B=0$. ¿Qué matriz sale?',
        'Piensa en qué hace el modelo afinado, $W+BA$, antes de dar el primer paso de entrenamiento.',
      ],
      explain:
        'Con $B=0$, el producto $BA$ vale $0$ sea cual sea $A$, y la suma $W+BA$ es exactamente $W$. El entrenamiento parte así del modelo original, sin perturbarlo.',
      solution:
        'Para que $\\Delta W=BA$ valga $0$ al empezar: el modelo afinado es idéntico al original y el entrenamiento arranca desde un modelo que ya funciona. $A$ sí se entrena (en cuanto $B$ deja de ser $0$ recibe cambios), el rango de $BA$ crece con el entrenamiento hasta $r$ como mucho, y $BA$ se puede fusionar con $W$ al terminar con cualquier inicialización.',
      options: [
        'Para que $A$ no se entrene y solo se entrene $B$',
        'Para que $\\Delta W$ valga $0$ al empezar y el modelo afinado parta idéntico al original',
        'Para que $BA$ tenga rango $0$ durante todo el entrenamiento',
        'Para que $BA$ se pueda fusionar con $W$ al terminar, cosa que con otra inicialización no se podría',
      ],
      correct: 1,
    },
  },
  {
    project: 'rango-bajo',
    question: {
      id: 'examen-3.error-peor-direccion',
      type: 'numero',
      prompt:
        'Una matriz $A$ tiene valores singulares $9$, $5$, $2$ y $1$, y se aproxima por su mejor matriz de rango $2$, $A_{2}$. Para un vector de entrada de longitud $1$, ¿cuál es lo máximo que puede diferir la salida de $A$ de la de $A_{2}$, es decir, el mayor valor de $|(A-A_{2})\\,x|$?',
      hints: [
        'La diferencia $A-A_{2}$ conserva solo las piezas que se descartaron, con sus mismos valores singulares.',
        'El mayor estiramiento de una matriz es su valor singular mayor.',
      ],
      explain:
        'En la peor dirección, el error de la mejor aproximación de rango $k$ es el primer valor singular que se descarta, $\\sigma_{k+1}$. No es la raíz de la suma de los cuadrados descartados: esa cuenta mide el error total, no el de una dirección.',
      solution:
        'La diferencia $A-A_{2}$ solo tiene las piezas descartadas, con valores singulares $2$ y $1$, y su mayor estiramiento es $2$. Es $\\sigma_{3}=2$. Si te sale $1$ has tomado el último valor singular; si sale $\\sqrt{5}\\approx 2{,}24$, el error de Frobenius, que suma las dos piezas.',
      answer: 2,
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
