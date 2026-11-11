import type { BankEntry } from '../../content/schema';
import type { AtencionToken } from '../../engine/labs/atencion';

/**
 * «la niña dejó el vaso porque estaba roto»: mira «roto». La clave de «vaso» queda entre las de
 * «niña» y «dejó», que se llevan su parte con cualquier consulta: lo más que llega a recibir «vaso» en la
 * rejilla es el 78,5 %, con la consulta (3, −1). Apuntar justo a su clave, (2, −1), solo le da el 65,5 %.
 */
const VASO_ROTO: AtencionToken[] = [
  { id: 'la', text: 'la', key: [-1, 0] },
  { id: 'nina', text: 'niña', key: [2, 1] },
  { id: 'dejo', text: 'dejó', key: [1, -2] },
  { id: 'el', text: 'el', key: [-1, -0.5] },
  { id: 'vaso', text: 'vaso', key: [2, -1] },
  { id: 'porque', text: 'porque', key: [-2, -1] },
  { id: 'estaba', text: 'estaba', key: [0, 1] },
  { id: 'roto', text: 'roto', key: [0, -1] },
];

/**
 * Entradas fijas del banco de examen de la Órbita 3 para el proyecto «Atención como matriz»: un
 * laboratorio con otra frase (transferencia), una cuenta de pesos de un bloque real y una de código. La
 * entrada generada la añade otro paso. Ids: `examen-3.<tema>`, únicos en todo el juego (también frente a
 * las preguntas de proyecto).
 */
export const examen3Atencion: BankEntry[] = [
  {
    project: 'atencion',
    question: {
      id: 'examen-3.vaso-roto',
      type: 'laboratorio',
      prompt:
        'En «la niña dejó el vaso porque estaba roto», el token «roto» tiene que saber qué estaba roto. Cada flecha gris es la clave de un token y la amarilla, la consulta de «roto». Ahora reparte su atención entre «niña» y «estaba».\n\nMueve la consulta hasta que la mayor parte de la atención vaya a «vaso».',
      hints: [
        'Fíjate en las claves que rodean a la de «vaso»: «niña» y «dejó» quedan a los dos lados y puntúan alto con casi cualquier consulta que apunte hacia ella.',
        'Apuntar justo a la clave de «vaso» no basta. Alarga la consulta y gírala hasta que «vaso» puntúe bastante más que sus dos vecinas.',
      ],
      explain:
        'Cada token puntúa su clave por la consulta, y el softmax reparte según las diferencias. Con dos claves cerca de la de «vaso», la consulta tiene que apuntar a lo que «vaso» tiene y sus vecinas no, y ser larga para que esa diferencia pese.',
      solution:
        'Con la consulta en $(3, -1)$, «vaso» puntúa $7$, «niña» y «dejó» $5$, y «vaso» se lleva el 78,5 %: es lo más que se consigue en la rejilla. También valen $(3;\\ -1{,}5)$ y $(2{,}5;\\ -1)$. Apuntar justo a la clave de «vaso», $(2, -1)$, le da solo el 65,5 %, y $(2, 0)$ empata con «niña».',
      lab: {
        kind: 'atencion',
        tokens: VASO_ROTO,
        focus: 7,
        query: [0, 1.5],
        range: 3,
        snap: 0.5,
        readouts: ['top'],
      },
      goals: [
        {
          metric: 'w_vaso',
          op: 'gte',
          target: 0.7,
          label: 'Atención que «roto» da a «vaso»',
          format: 'percent',
        },
      ],
      solved: { qx: 3, qy: -1 },
    },
  },
  {
    project: 'atencion',
    question: {
      id: 'examen-3.pesos-por-bloque',
      type: 'numero',
      prompt:
        'Cada bloque del GPT-2 pequeño tiene $12$ cabezas de atención, y cada cabeza calcula su propio mapa de pesos: una fila y una columna por token. Para un texto de $500$ tokens, ¿cuántos pesos de atención calcula un bloque, entre todas sus cabezas?',
      hints: [
        'Un mapa de $n$ tokens tiene $n\\times n$ casillas.',
        'Cada cabeza tiene el suyo: multiplica por el número de cabezas.',
      ],
      explain:
        'El mapa de una cabeza crece con el cuadrado del número de tokens, y las cabezas no lo comparten: cada una mira a su manera y tiene su propio mapa.',
      solution:
        'Una cabeza: $500\\cdot 500=250\\,000$ pesos. Doce cabezas: $12\\cdot 250\\,000=3\\,000\\,000$. Si te sale $6000$, has contado $12\\cdot 500$, como si el mapa creciera con $n$ y no con $n^{2}$.',
      answer: 3000000,
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
