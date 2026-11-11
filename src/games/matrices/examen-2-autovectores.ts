import type { BankEntry } from '../../content/schema';
import { ANIMALES, capaLab } from './datos';

/**
 * Entradas fijas del banco de examen de la Órbita 2 para el proyecto «Autovectores»: un laboratorio
 * (otra capa recurrente, con otros datos: la dirección que ni crece ni se olvida), una cuenta de cuántas
 * palabras tarda en apagarse un rasgo y una de código. La entrada generada la añade otro paso. Ids:
 * `examen-2.<tema>`, únicos en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen2Autovectores: BankEntry[] = [
  {
    project: 'autovectores',
    question: {
      id: 'examen-2.memoria-estable',
      type: 'laboratorio',
      prompt:
        'Una red recurrente lee nombres de animales y guarda en su memoria $\\vec{v}$ dos rasgos: **tamaño** y **domesticidad**. En cada paso aplica la misma capa; el camino enseña cinco pasos. Desde este estado, la memoria se desboca.\n\nElige un estado de partida de tamaño $1{,}5$ o más que llegue al quinto paso sin pasar de $3$.',
      hints: [
        'Busca la recta en la que los puntos del camino se quedan quietos, uno encima de otro.',
        'La capa deja igual la domesticidad: prueba estados sin tamaño, sobre el eje vertical, hacia arriba o hacia abajo.',
      ],
      explain:
        'Un estado que la capa ni gira ni estira es un autovector de autovalor $1$: tras cinco pasos sigue igual. Cualquier trozo en la otra dirección propia se multiplica por $1{,}5$ en cada paso y acaba mandando.',
      solution:
        'Con $\\vec{v}=(0, 2)$, $A\\vec{v}=(0, 2)$: autovalor $1$, y tras cinco pasos sigue midiendo $2$. Vale cualquier estado del eje vertical entre $1{,}5$ y $3$ de largo, arriba o abajo. La otra dirección propia es $(1, 1)$, con autovalor $1{,}5$: desde $(1, 0)$, que tiene un trozo en ella, la memoria llega a unos $10$.',
      lab: capaLab(ANIMALES, {
        range: 5,
        i: [1.5, 0.5],
        j: [0, 1],
        movable: 'none',
        probe: { x: 1, y: 0, movable: true },
        iterate: 5,
      }),
      goals: [
        {
          metric: 'iter_norm',
          op: 'lte',
          target: 3,
          label: 'Tamaño de la memoria tras cinco pasos',
        },
        { metric: 'v_norm', op: 'gte', target: 1.5, label: 'Tamaño del estado de partida' },
      ],
      solved: { vx: 0, vy: 2 },
    },
  },
  {
    project: 'autovectores',
    question: {
      id: 'examen-2.pasos-hasta-olvidar',
      type: 'numero',
      prompt:
        'En una red recurrente, un rasgo de la memoria va en una dirección que la capa encoge por $0{,}5$ en cada paso: cada palabra nueva deja la mitad de lo que había. ¿Tras cuántas palabras queda, por primera vez, menos del $1$ % de su valor inicial?',
      hints: [
        'Tras $n$ palabras queda $0{,}5^n$ del valor inicial.',
        'Ve dividiendo entre $2$: $0{,}5$, $0{,}25$, $0{,}125$… y cuenta cuántas veces hasta bajar de $0{,}01$.',
      ],
      explain:
        'Sobre una dirección propia, cada paso multiplica por el autovalor lo que queda. Tras $n$ palabras queda $0{,}5^n$ del valor inicial: hay que buscar el primer $n$ con $0{,}5^n<0{,}01$.',
      solution:
        '$0{,}5^6=1/64\\approx 0{,}016$, todavía por encima del $1$ %, y $0{,}5^7=1/128\\approx 0{,}008$, ya por debajo: $7$ palabras. Si te sale $2$, has restado la mitad del valor inicial en cada paso en vez de quedarte con la mitad de lo que había.',
      answer: 7,
      tol: 0,
    },
  },
  {
    project: 'autovectores',
    question: {
      id: 'examen-2.capas-que-explotan',
      type: 'codigo',
      prompt:
        'Cada matriz de `Ws` son los pesos de una capa recurrente de juguete de $2\\times 2$ (las reales tienen cientos de dimensiones). Una capa **explota** cuando su radio espectral, el mayor tamaño de sus autovalores, es mayor que $1$. Los autovalores pueden ser negativos o complejos. Guarda en `explotan` cuántas de las cinco capas explotan, como un número entero.',
      hints: [
        '`np.linalg.eigvals` acepta el array de matrices entero y devuelve los autovalores de cada una. Pueden salir complejos.',
        'Un autovalor negativo grande o un complejo de módulo grande también hacen explotar el estado. `np.abs` da el tamaño de los dos.',
      ],
      explain:
        'Lo que decide si una capa explota es el tamaño de sus autovalores, no su signo ni su parte real. Con el mayor autovalor sin más, o con la parte real de un complejo, se te escapan capas que sí explotan.',
      solution:
        'Los radios espectrales son $1{,}1$; $1{,}12$; $0{,}97$; $1{,}2$ y $0{,}56$, aproximadamente. Explotan la primera, la segunda y la cuarta, luego `explotan` vale 3. La primera tiene autovalores $0{,}8$ y $-1{,}1$: sin valor absoluto parecería estable. La segunda tiene autovalores complejos $0{,}5\\pm i$, de módulo mayor que $1$, aunque su parte real es $0{,}5$. Si no cuentas la segunda, te sale 2.',
      requirements: [
        '`explotan` es un número entero: cuántas de las cinco capas de `Ws` tienen un radio espectral mayor que 1.',
        'Un autovalor negativo o complejo cuenta por su tamaño, no por su signo ni por su parte real.',
      ],
      starter: `import numpy as np

Ws = np.array([
    [[0.8, 0.0], [0.0, -1.1]],
    [[0.5, -1.0], [1.0, 0.5]],
    [[0.9, 0.2], [0.1, 0.7]],
    [[1.2, 0.5], [0.0, 0.6]],
    [[-0.4, 0.3], [0.2, 0.5]],
])
# Guarda en explotan cuántas capas tienen radio espectral mayor que 1
explotan = None
`,
      checks: `_n = isinstance(explotan, (int, np.integer)) and not isinstance(explotan, (bool, np.bool_))
check(_n, "\`explotan\` tiene que ser un número entero: cuántas capas tienen un radio espectral mayor que 1.")
check((not _n) or explotan != 1, "\`explotan\` solo cuenta una capa: parece que usas el mayor autovalor sin más. Un autovalor negativo grande, o uno complejo, también hace explotar el estado: hay que mirar su tamaño.")
check((not _n) or explotan != 2, "\`explotan\` se deja una capa que explota. Si los autovalores son complejos, su tamaño es el módulo, no la parte real, y \`np.abs\` lo calcula.")
check((not _n) or explotan in (1, 2) or explotan == 3, "\`explotan\` tiene que valer 3: son las capas cuyo radio espectral es mayor que 1.")
`,
      reference:
        'import numpy as np\n\nWs = np.array([\n    [[0.8, 0.0], [0.0, -1.1]],\n    [[0.5, -1.0], [1.0, 0.5]],\n    [[0.9, 0.2], [0.1, 0.7]],\n    [[1.2, 0.5], [0.0, 0.6]],\n    [[-0.4, 0.3], [0.2, 0.5]],\n])\nexplotan = int((np.abs(np.linalg.eigvals(Ws)).max(axis=1) > 1).sum())\n',
    },
  },
];
