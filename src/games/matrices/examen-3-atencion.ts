import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 3 para el proyecto «Atención como matriz». La entrada
 * generada la añade otro paso. Ids: `examen-3.<tema>`, únicos en todo el juego (también frente a las
 * preguntas de proyecto).
 */
export const examen3Atencion: BankEntry[] = [
  {
    project: 'atencion',
    question: {
      id: 'examen-3.mascara-causal',
      type: 'opcion',
      prompt:
        'Un modelo que genera texto palabra a palabra no puede mirar las palabras que vienen después. Para impedirlo, antes del softmax se pone $-\\infty$ en las puntuaciones que quedan **por encima de la diagonal** de la tabla $n\\times n$. ¿Qué pasa con los pesos de atención?',
      hints: [
        'La fila $i$ de la tabla son las puntuaciones de la palabra $i$ con todas las demás. ¿Qué columnas quedan por encima de la diagonal en esa fila?',
        '¿Cuánto vale $e^{-\\infty}$? Y después, ¿qué hace el softmax con lo que queda en la fila?',
      ],
      explain:
        'El exponencial de $-\\infty$ es $0$, así que esas posiciones no reciben peso. El softmax se calcula después, sobre las puntuaciones que quedan, y vuelve a normalizar cada fila. Poner ceros a mano después del softmax sí dejaría filas que no suman $1$.',
      solution:
        'Cada palabra tiene peso $0$ sobre las posteriores, y su fila sigue sumando $1$ repartida entre ella y las anteriores. Con $-\\infty$ en las puntuaciones, el exponencial de esas posiciones es $0$ y el softmax normaliza solo lo que queda. La primera palabra solo se mira a sí misma, con peso $1$. Los pesos sobre las anteriores no se anulan, y la diagonal tampoco: una palabra sí puede mirarse a sí misma.',
      options: [
        'Cada palabra tiene peso $0$ sobre las anteriores, y su fila sigue sumando $1$',
        'Cada palabra tiene peso $0$ sobre las posteriores, y su fila sigue sumando $1$ repartida entre ella y las anteriores',
        'Los pesos de la diagonal valen $0$, y cada fila suma $1$ sobre las demás palabras',
        'Las filas dejan de sumar $1$, y hay que volver a normalizarlas después',
      ],
      correct: 1,
    },
  },
  {
    project: 'atencion',
    question: {
      id: 'examen-3.pesos-no-nulos',
      type: 'numero',
      prompt:
        'Un modelo con máscara causal procesa un texto de **6** palabras. Cada palabra solo puede mirarse a sí misma y a las anteriores. ¿Cuántas de las $6\\times 6$ entradas de la matriz de pesos pueden ser distintas de $0$?',
      hints: [
        'La primera palabra solo puede mirar una posición, la segunda dos… Cuenta cuántas puede mirar cada una.',
        'Suma esas cantidades, o cuenta la diagonal y todo lo que queda por debajo de ella.',
      ],
      explain:
        'Es el triángulo inferior de la matriz, con su diagonal. La palabra $i$ puede mirar $i$ posiciones, y la suma de $1$ a $6$ es lo que se busca. Contar solo la parte de debajo de la diagonal deja fuera las seis entradas de la propia diagonal.',
      solution:
        '$1+2+3+4+5+6=21$ entradas pueden ser distintas de $0$: el triángulo inferior con su diagonal. Las otras $36-21=15$ valen $0$ por la máscara. Si te sale $15$, has contado las posiciones que se anulan, o solo las de debajo de la diagonal, y se te han quedado fuera las seis de la propia diagonal.',
      answer: 21,
      tol: 0,
    },
  },
  {
    project: 'atencion',
    question: {
      id: 'examen-3.palabra-mas-dispersa',
      type: 'codigo',
      prompt:
        '`Q` guarda las consultas de 3 palabras y `K` las claves de 4, una por fila y con 2 componentes cada una. Guarda en `pesos` los pesos de atención (3 filas y 4 columnas: el softmax por filas de las puntuaciones escaladas) y en `dispersa` la **posición de la palabra que reparte su atención de la forma más pareja**, la que tiene el peso mayor más bajo (un entero, contando desde 0).',
      hints: [
        'Las puntuaciones son `Q @ K.T` divididas entre la raíz del número de columnas de `Q`; el softmax de cada fila resta su máximo y divide entre la suma de la fila (`keepdims=True`). Después, el peso mayor de cada palabra es `pesos.max(...)` a lo largo de su fila.',
        'Una palabra que reparte su atención de forma pareja tiene un peso mayor bajo. Entre esos pesos mayores, `argmin` da la posición del menor, contando desde 0.',
      ],
      explain:
        'Se calculan las puntuaciones, se reparte cada fila con el softmax y se busca, en cada fila, su peso mayor. La palabra más dispersa es la de peso mayor más bajo: confundirla con la más concentrada, o buscar los mayores por columnas, da otra posición.',
      solution:
        'Las puntuaciones $QK^{\\top}/\\sqrt{2}$ dan unos pesos de $(0{,}22; 0{,}11; 0{,}45; 0{,}22)$ para la palabra $0$, $(0{,}04; 0{,}18; 0{,}04; 0{,}73)$ para la $1$ y $(0{,}12; 0{,}12; 0{,}25; 0{,}51)$ para la $2$. Los pesos mayores de cada fila son $0{,}45$, $0{,}73$ y $0{,}51$, y el menor de ellos es el de la palabra $0$, así que `dispersa` vale $0$. Si te sale $1$, has buscado la palabra más concentrada con `argmax`.',
      requirements: [
        '`pesos` es un array de NumPy de 3 filas y 4 columnas: el softmax por filas de las puntuaciones escaladas de `Q` y `K`.',
        '`dispersa` es un número entero: la posición, contando desde 0, de la palabra cuyo peso mayor es el más bajo de las tres.',
      ],
      starter: `import numpy as np

Q = np.array([[1, 0], [0, 2], [1, 1]])
K = np.array([[1, 0], [0, 1], [2, 0], [1, 2]])
# Guarda en pesos el softmax por filas de las puntuaciones escaladas y en dispersa la posición de la palabra de peso mayor más bajo
pesos = None
dispersa = None
`,
      checks: `_Q = np.array([[1, 0], [0, 2], [1, 1]], dtype=float)
_K = np.array([[1, 0], [0, 1], [2, 0], [1, 2]], dtype=float)
def _soft(S):
    E = np.exp(S - S.max(axis=1, keepdims=True))
    return E / E.sum(axis=1, keepdims=True)
_W = _soft(_Q @ _K.T / np.sqrt(2))
_p = isinstance(pesos, np.ndarray) and pesos.shape == (3, 4) and np.issubdtype(pesos.dtype, np.floating)
_pok = _p and bool(np.allclose(pesos, _W))
_d = isinstance(dispersa, (int, np.integer)) and not isinstance(dispersa, (bool, np.bool_))
check(_p, "\`pesos\` tiene que ser un array de NumPy de 3 filas y 4 columnas: una fila por palabra y una columna por clave.")
check((not _p) or bool(np.allclose(pesos.sum(axis=1), 1)) or not bool(np.allclose(pesos.sum(axis=0), 1)), "\`pesos\` suma 1 por columnas. El reparto de cada palabra es su fila, y es ella la que tiene que sumar 1.")
check((not _p) or not bool(np.allclose(pesos.sum(axis=1), 1)) or _pok or not bool(np.allclose(pesos, _soft(_Q @ _K.T))), "\`pesos\` sale de puntuaciones sin escalar: falta dividir entre la raíz del número de componentes.")
check((not _p) or _pok or not bool(np.allclose(pesos.sum(axis=1), 1)) or bool(np.allclose(pesos, _soft(_Q @ _K.T))), "\`pesos\` tiene que ser el softmax de cada fila de las puntuaciones \`Q\` por la traspuesta de \`K\`, divididas entre la raíz del número de componentes.")
check(_d, "\`dispersa\` tiene que ser un número entero: la posición de una palabra, contando desde 0.")
check((not _d) or dispersa != 1, "\`dispersa\` señala la palabra de peso mayor más alto, que es la más concentrada. Se pide la contraria: la de peso mayor más bajo.")
check((not _d) or dispersa == 0 or dispersa == 1, "\`dispersa\` tiene que ser la posición de la palabra cuyo peso mayor, el máximo de su fila, es el más bajo de las tres.")
`,
      reference: `import numpy as np

Q = np.array([[1, 0], [0, 2], [1, 1]])
K = np.array([[1, 0], [0, 1], [2, 0], [1, 2]])
# Guarda en pesos el softmax por filas de las puntuaciones escaladas y en dispersa la posición de la palabra de peso mayor más bajo
S = Q @ K.T / np.sqrt(Q.shape[1])
E = np.exp(S - S.max(axis=1, keepdims=True))
pesos = E / E.sum(axis=1, keepdims=True)
dispersa = int(pesos.max(axis=1).argmin())
`,
    },
  },
];
