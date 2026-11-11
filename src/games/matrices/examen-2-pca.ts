import type { BankEntry } from '../../content/schema';
import { ANIMALES, capaLab } from './datos';

/**
 * Entradas fijas del banco de examen de la Órbita 2 para el proyecto «PCA»: un laboratorio (la
 * coordenada que más conserva, con otros datos), una cuenta de memoria y una de código. La entrada
 * generada la añade otro paso. Ids: `examen-2.<tema>`, únicos en todo el juego (también frente a las preguntas
 * de proyecto).
 */
export const examen2Pca: BankEntry[] = [
  {
    project: 'pca',
    question: {
      id: 'examen-2.pca-animales',
      type: 'laboratorio',
      prompt:
        'Seis animales con dos rasgos: **tamaño** y **domesticidad**. Quieres guardar una sola coordenada de cada uno: su sombra sobre la recta de $v$, que ahora va en horizontal y solo recoge el tamaño.\n\nGira $v$ hasta que esa coordenada conserve casi toda la varianza de los seis.',
      hints: [
        'Mira qué rasgo separa más a los animales entre sí: el tamaño o la domesticidad.',
        'Lleva $v$ hacia la vertical, un poco inclinada hacia la izquierda.',
      ],
      explain:
        'La coordenada que más conserva sigue la dirección en que los datos más se extienden. Aquí es la domesticidad, con un poco de tamaño en contra: las mascotas son domésticas y más pequeñas.',
      solution:
        'Vale $v$ en $(-0{,}5;\\ 1{,}5)$, que conserva el $93{,}5\\,\\%$, o rectas cercanas como la de $(-1;\\ 2{,}5)$ o la de $(-1;\\ 3{,}5)$. La vertical pura, $(0, 1)$, conserva el $85{,}2\\,\\%$, y la horizontal, el $14{,}8\\,\\%$.',
      lab: capaLab(ANIMALES, {
        movable: 'none',
        probe: { x: 2, y: 0, movable: true, on: 'input' },
      }),
      goals: [
        {
          metric: 'var_frac',
          op: 'gte',
          target: 0.93,
          label: 'Parte de la varianza que conserva la coordenada',
          format: 'percent',
        },
      ],
      solved: { vx: -0.5, vy: 1.5 },
    },
  },
  {
    project: 'pca',
    question: {
      id: 'examen-2.memoria-pca',
      type: 'numero',
      prompt:
        'Un buscador guarda $10\\,000$ embeddings de $384$ números y los reduce con PCA a $32$ componentes. Guarda las coordenadas de cada embedding y, para reducir las consultas nuevas, la media ($384$ números) y las $32$ componentes ($384$ números cada una).\n\n¿Cuántos números guarda en total?',
      hints: [
        'Coordenadas: un número por embedding y por componente.',
        'Suma la media y las componentes: $32$ vectores de $384$ números.',
      ],
      explain:
        'Lo que se ahorra son las coordenadas. La media y las componentes son un coste fijo, que no crece con el número de embeddings.',
      solution:
        '$10\\,000\\cdot 32=320\\,000$ coordenadas, $384$ de la media y $32\\cdot 384=12\\,288$ de las componentes: $332\\,672$ números, frente a los $3\\,840\\,000$ de guardarlos enteros. Sin la media o sin las componentes no se podría reducir una consulta nueva igual que los datos.',
      answer: 332672,
      tol: 0,
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
