import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 1 para el proyecto «Determinante». La entrada
 * generada `examen-1.determinante` la añade otro paso. Ids: `examen-1.<tema>`, únicos en todo el
 * juego (también frente a las preguntas de proyecto).
 */
export const examen1Determinante: BankEntry[] = [
  {
    project: 'determinante',
    question: {
      id: 'examen-1.determinante-escala',
      type: 'opcion',
      prompt:
        'Una matriz $A$ de $2\\times 2$ tiene $\\det A=4$. ¿Cuánto vale $\\det(3A)$, con $3A$ la matriz que multiplica por $3$ cada entrada de $A$?',
      hints: [
        '$3A$ es el producto de $3I$ por $A$, y $3I$ estira el plano por $3$ en horizontal y en vertical.',
        'Cada transformación escala las áreas por su determinante: calcula $\\det(3I)$.',
      ],
      explain:
        'El determinante de un producto es el producto de los determinantes. $3A$ es $A$ seguida de un estiramiento uniforme por $3$, que multiplica las áreas por $9$ y no por $3$.',
      solution:
        '$3A=(3I)A$ y $\\det(3I)=3\\cdot 3-0\\cdot 0=9$, luego $\\det(3A)=9\\cdot 4=36$. En una matriz de $2\\times 2$, multiplicar cada entrada por $k$ multiplica el determinante por $k^2$: cada una de las dos direcciones del plano se estira por $k$.',
      options: [
        '$12$, porque el determinante también se multiplica por $3$',
        '$36$, porque $3A$ estira por $3$ en las dos direcciones y las áreas se multiplican por $3\\cdot 3$',
        '$7$, porque $\\det(3A)=3+\\det A$',
        '$4$, porque estirar el plano no cambia el determinante',
      ],
      correct: 1,
    },
  },
  {
    project: 'determinante',
    question: {
      id: 'examen-1.area-imagen',
      type: 'numero',
      prompt:
        'La matriz $A=\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}$ transforma un cuadrado de área $5$. ¿Qué área tiene su imagen?',
      hints: [
        'Una matriz multiplica todas las áreas por el mismo factor: $\\lvert\\det A\\rvert$.',
        'Este determinante es negativo: la figura sale volteada, pero su área no es negativa.',
      ],
      explain:
        'Toda área se multiplica por $\\lvert\\det A\\rvert$, sea cual sea la figura. Usa el valor absoluto, porque un área no tiene signo.',
      solution:
        '$\\det A=1\\cdot 4-2\\cdot 3=-2$, luego las áreas se multiplican por $\\lvert -2\\rvert=2$ y la imagen tiene área $5\\cdot 2=10$. Si te sale $-10$, has olvidado el valor absoluto; si te sale $5$, no has aplicado el factor de la matriz.',
      answer: 10,
      tol: 0,
    },
  },
  {
    project: 'determinante',
    question: {
      id: 'examen-1.capas-volteadas',
      type: 'codigo',
      prompt:
        'Cada matriz de `Ws` son los pesos de una capa lineal de $2\\times 2$. Una capa **voltea** la orientación del plano cuando su determinante es negativo. Guarda en `volteadas` cuántas de las siete capas lo hacen, como un número entero.',
      hints: [
        '`np.linalg.det` acepta el array de matrices entero y devuelve un determinante por matriz.',
        'Una capa con determinante $0$ aplasta el plano, pero no lo voltea.',
      ],
      explain:
        'El signo del determinante es la orientación: negativo, volteada; positivo, conservada; cero, aplastada, sin orientación que conservar ni que voltear. Cuenta solo los negativos.',
      solution:
        'Los siete determinantes son $-2$, $6$, $-1$, $0$, $2$, $1$ y $2$. Son negativos el primero y el tercero, luego `volteadas` vale 2. Con la condición «menor o igual que cero» entraría también la cuarta capa, que no voltea el plano sino que lo aplasta.',
      starter: `import numpy as np

Ws = np.array([
    [[1, 2], [3, 4]],
    [[2, 0], [0, 3]],
    [[0, 1], [1, 0]],
    [[1, 2], [2, 4]],
    [[1, -1], [1, 1]],
    [[1, 0], [0, 1]],
    [[2, 1], [0, 1]],
])
# Guarda en volteadas cuántas capas tienen determinante negativo
volteadas = None
`,
      checks: `_n = isinstance(volteadas, (int, np.integer)) and not isinstance(volteadas, (bool, np.bool_))
check(_n, "\`volteadas\` tiene que ser un número entero: cuántas capas tienen el determinante negativo.")
check((not _n) or volteadas != 3, "\`volteadas\` cuenta también la capa de determinante 0, que aplasta el plano pero no lo voltea. Solo cuentan los determinantes negativos.")
check((not _n) or volteadas != 4, "\`volteadas\` cuenta las capas de determinante positivo, que conservan la orientación. Tienen que contar las de determinante negativo.")
check((not _n) or volteadas in (3, 4) or volteadas == 2, "\`volteadas\` tiene que valer 2: son las capas cuyo determinante sale negativo.")
`,
      reference:
        'import numpy as np\n\nWs = np.array([\n    [[1, 2], [3, 4]],\n    [[2, 0], [0, 3]],\n    [[0, 1], [1, 0]],\n    [[1, 2], [2, 4]],\n    [[1, -1], [1, 1]],\n    [[1, 0], [0, 1]],\n    [[2, 1], [0, 1]],\n])\nvolteadas = int((np.linalg.det(Ws) < 0).sum())\n',
    },
  },
];
