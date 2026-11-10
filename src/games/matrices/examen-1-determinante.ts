import type { BankEntry } from '../../content/schema';
import { ANIMALES, capaLab } from './datos';

/**
 * Entradas fijas del banco de examen de la Órbita 1 para el proyecto «Determinante»: un laboratorio
 * (aplastar en la dirección que no importa, con otros datos), una cuenta de un flujo normalizador y
 * una de código. La entrada generada `examen-1.determinante` la añade otro paso. Ids:
 * `examen-1.<tema>`, únicos en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen1Determinante: BankEntry[] = [
  {
    project: 'determinante',
    question: {
      id: 'examen-1.aplastar-animales',
      type: 'laboratorio',
      prompt:
        'Seis animales con dos rasgos: **tamaño** y **domesticidad**. La neurona siguiente mira la primera salida (el eje horizontal) y responde «mascota» a lo que cae en la zona sombreada. Ahora ahí llega el tamaño.\n\nHaz una capa que aplaste el plano (determinante $0$) y con la que la neurona acierte los seis.',
      hints: [
        'El tamaño no distingue un perro de un lobo. La capa puede perder ese rasgo entero: lo que no puede perder es el otro.',
        'Lleva $\\hat{\\imath}$ (el tamaño) al origen y $\\hat{\\jmath}$ (la domesticidad) sobre el eje horizontal, hacia la derecha.',
      ],
      explain:
        'Con determinante $0$ la capa pierde una dirección. Si es la del tamaño, la primera salida puede ser la domesticidad, que es lo único que necesita la neurona.',
      solution:
        'Con $\\hat{\\imath}$ en $(0, 0)$ y $\\hat{\\jmath}$ en $(1, 0)$, cada animal cae sobre el eje horizontal según su domesticidad: determinante $0$ y seis aciertos. Si en cambio llevas $\\hat{\\jmath}$ al origen, el determinante también es $0$, pero se pierde la domesticidad y la neurona dice «mascota» a todos.',
      lab: capaLab(ANIMALES, { readout: { w: [1, 0], b: 0 } }),
      goals: [
        { metric: 'det', op: 'eq', target: 0, label: 'Determinante de la capa' },
        {
          metric: 'acc',
          op: 'gte',
          target: 1,
          label: 'Aciertos de la neurona siguiente',
          format: 'percent',
        },
      ],
      solved: { ix: 0, jx: 1, jy: 0 },
    },
  },
  {
    project: 'determinante',
    question: {
      id: 'examen-1.densidad-flujo',
      type: 'numero',
      prompt:
        'Un flujo normalizador pasa sus datos por una capa invertible:\n\n$$A=\\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$$\n\nAlrededor de un punto, la densidad de probabilidad es $0{,}3$. La probabilidad de una región no cambia al pasar por la capa, pero su área sí. ¿Qué densidad hay alrededor del punto de llegada?',
      hints: [
        'Calcula por cuánto multiplica la capa las áreas: $\\lvert\\det A\\rvert$.',
        'Si la misma probabilidad se reparte en un área mayor, la densidad baja en la misma proporción.',
      ],
      explain:
        'Probabilidad es densidad por área. Si la capa multiplica las áreas por $\\lvert\\det A\\rvert$ y la probabilidad se conserva, la densidad se divide por ese mismo número.',
      solution:
        '$\\det A=2\\cdot 2-1\\cdot 1=3$: las áreas se triplican, y la densidad pasa de $0{,}3$ a $0{,}3/3=0{,}1$. Si multiplicas, sale $0{,}9$, que daría más probabilidad de la que había.',
      answer: 0.1,
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
      requirements: [
        '`volteadas` es un número entero: cuántas de las siete capas de `Ws` tienen el determinante negativo.',
        'Las capas de determinante cero o positivo no cuentan.',
      ],
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
