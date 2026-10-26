import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 2 para el proyecto «PCA». La entrada generada la
 * añade otro paso. Ids: `examen-2.<tema>`, únicos en todo el juego (también frente a las preguntas
 * de proyecto).
 */
export const examen2Pca: BankEntry[] = [
  {
    project: 'pca',
    question: {
      id: 'examen-2.coordenada-componente',
      type: 'numero',
      prompt:
        'Unos datos tienen media $(1, 2)$ y su primera componente principal es $u=(0{,}6; 0{,}8)$, de norma $1$. ¿Cuál es la coordenada en esa componente del dato $(4, 6)$?',
      hints: [
        'Antes de proyectar hay que centrar el dato: restarle la media.',
        'La coordenada en una componente de norma $1$ es el producto escalar del dato centrado con ella.',
      ],
      explain:
        'La coordenada se calcula con el dato centrado, no con el dato original: la componente describe direcciones respecto de la media de los datos. Con el dato sin centrar sale otro número.',
      solution:
        'El dato centrado es $(4-1,\\ 6-2)=(3, 4)$ y su coordenada es $0{,}6\\cdot 3+0{,}8\\cdot 4=1{,}8+3{,}2=5$. Si proyectas el dato sin centrar sale $0{,}6\\cdot 4+0{,}8\\cdot 6=7{,}2$.',
      answer: 5,
      tol: 0,
    },
  },
  {
    project: 'pca',
    question: {
      id: 'examen-2.signo-componente',
      type: 'opcion',
      prompt:
        'Dos programas calculan la primera componente principal de los mismos datos. El primero da $(0{,}6; 0{,}8)$ y el segundo, $(-0{,}6; -0{,}8)$. ¿Cuál de los dos está mal?',
      hints: [
        'Compara las dos direcciones: ¿en qué se diferencian los dos vectores?',
        'Si $v$ es un autovector, ¿lo es también $-v$?',
      ],
      explain:
        'Un autovector solo fija una dirección: si $A\\vec{v}=\\lambda\\vec{v}$, también $A(-\\vec{v})=\\lambda(-\\vec{v})$. El signo lo decide el algoritmo, y no cambia qué recta es la componente.',
      solution:
        'Ninguno está mal. $(0{,}6; 0{,}8)$ y $(-0{,}6; -0{,}8)$ son la misma recta recorrida en sentidos contrarios, y los dos son autovectores del mismo autovalor. Lo único que cambia es el signo de las coordenadas de los datos en esa componente, y eso no altera cuánta varianza explica. Por eso se comparan componentes con el valor absoluto del coseno o con $A\\vec{v}=\\lambda\\vec{v}$, y no componente a componente.',
      options: [
        'El primero, porque la primera componente tiene que apuntar hacia valores positivos',
        'El segundo, porque una componente principal no puede tener coordenadas negativas',
        'Ninguno: las dos describen la misma recta, y el signo de una componente es arbitrario',
        'Los dos, porque dos programas correctos tendrían que dar exactamente el mismo vector',
      ],
      correct: 2,
    },
  },
  {
    project: 'pca',
    question: {
      id: 'examen-2.componentes-para-95',
      type: 'codigo',
      prompt:
        '`vals` guarda los autovalores de una covarianza tal como los devuelve `eigh`: de menor a mayor. Guarda en `k95`, como un número entero, cuántas componentes principales, empezando por la de mayor autovalor, hacen falta como mínimo para conservar al menos el 95 % de la varianza total.',
      hints: [
        'Da la vuelta a `vals` para tenerlos de mayor a menor, acumula con `np.cumsum` y divide entre la suma de todos.',
        'La posición del primer valor que llega al 95 % empieza en 0, y se piden componentes.',
      ],
      explain:
        'Se acumula la varianza empezando por la componente que más explica, y se cuenta cuántas hacen falta hasta llegar al umbral. Acumular de menor a mayor pide casi todas las componentes, y confundir una posición con un número de componentes se equivoca en una.',
      solution:
        'La varianza total es $10$ y los acumulados, de mayor a menor autovalor, son $60\\,\\%$, $80\\,\\%$, $90\\,\\%$ y $96\\,\\%$: con tres componentes no se llega al $95\\,\\%$ y con cuatro sí, luego `k95` vale 4. La posición de ese $96\\,\\%$ es 3, y por eso hay que sumar 1. Acumulando de menor a mayor saldría 6.',
      requirements: [
        '`k95` es un número entero: cuántas componentes, empezando por la de mayor autovalor, hacen falta como mínimo para llegar al 95 % de la varianza total.',
        'Los autovalores de `vals` van de menor a mayor.',
      ],
      starter: `import numpy as np

vals = np.array([0.1, 0.3, 0.6, 1.0, 2.0, 6.0])
# Guarda en k95 cuántas componentes, de mayor a menor autovalor, hacen falta para conservar al menos el 95 % de la varianza
k95 = None
`,
      checks: `_k = isinstance(k95, (int, np.integer)) and not isinstance(k95, (bool, np.bool_))
check(_k, "\`k95\` tiene que ser un número entero: cuántas componentes hacen falta.")
check((not _k) or k95 != 3, "\`k95\` vale 3: con tres componentes solo se conserva el 90 %. Parece una posición contada desde 0, y se pide un número de componentes.")
check((not _k) or k95 != 6, "\`k95\` pide todas las componentes: si acumulas de menor a mayor, empiezas por las que menos explican. Acumula de mayor a menor.")
check((not _k) or k95 in (3, 6) or k95 == 4, "\`k95\` tiene que ser el menor número de componentes, empezando por la de mayor autovalor, cuyo acumulado llega al 95 % de la suma de todos.")
`,
      reference:
        'import numpy as np\n\nvals = np.array([0.1, 0.3, 0.6, 1.0, 2.0, 6.0])\n# Guarda en k95 cuántas componentes, de mayor a menor autovalor, hacen falta para conservar al menos el 95 % de la varianza\nk95 = int(np.argmax(np.cumsum(vals[::-1]) / vals.sum() >= 0.95)) + 1\n',
    },
  },
];
