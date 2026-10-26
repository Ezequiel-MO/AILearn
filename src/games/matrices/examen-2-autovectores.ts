import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 2 para el proyecto «Autovectores». La entrada
 * generada la añade otro paso. Ids: `examen-2.<tema>`, únicos en todo el juego (también frente a las
 * preguntas de proyecto).
 */
export const examen2Autovectores: BankEntry[] = [
  {
    project: 'autovectores',
    question: {
      id: 'examen-2.cual-es-autovector',
      type: 'opcion',
      prompt:
        '¿Cuál de estos vectores es un autovector de $A=\\begin{pmatrix}3&1\\\\0&2\\end{pmatrix}$?',
      hints: [
        'Calcula $A\\vec{v}$ para cada opción y mira si el resultado es un múltiplo del vector de partida.',
        'Un vector solo es autovector si $A\\vec{v}=\\lambda\\vec{v}$ con el mismo $\\lambda$ en sus dos componentes.',
      ],
      explain:
        'Un autovector no cambia de recta al aplicarle la matriz. Que la imagen sea más larga o más corta no basta: hay que mirar hacia dónde apunta $A\\vec{v}$.',
      solution:
        '$A(0, 1)=(1, 2)$, $A(1, 1)=(4, 2)$, $A(1, -1)=(2, -2)$ y $A(1, 2)=(5, 4)$. Solo $(2, -2)=2\\cdot(1, -1)$ es un múltiplo del vector de partida: $(1, -1)$ es un autovector de autovalor $2$. En las otras tres, la imagen sale de la recta del vector.',
      options: ['$(0, 1)$', '$(1, 1)$', '$(1, -1)$', '$(1, 2)$'],
      correct: 2,
    },
  },
  {
    project: 'autovectores',
    question: {
      id: 'examen-2.autovalor-potencia',
      type: 'numero',
      prompt:
        'El vector $\\vec{v}$ es un autovector de $A$ con autovalor $\\lambda=-2$. ¿Cuál es el autovalor de $A^3$ para ese mismo vector $\\vec{v}$?',
      hints: [
        'Aplica $A$ tres veces seguidas a $\\vec{v}$: $A^3\\vec{v}=A(A(A\\vec{v}))$. ¿Qué le hace cada $A$?',
        'Cada paso multiplica por $-2$. Cuida el signo del resultado.',
      ],
      explain:
        'Cada vez que se aplica $A$ a $\\vec{v}$ aparece un factor $\\lambda$, y el vector sigue siendo el mismo, salvo el factor. Al aplicarla tres veces, los factores se multiplican entre sí, no se suman ni se multiplican por $3$.',
      solution:
        '$A^3\\vec{v}=A^2(-2\\vec{v})=A(4\\vec{v})=-8\\vec{v}$, luego el autovalor de $A^3$ es $\\lambda^3=(-2)^3=-8$. Si te sale $8$, has perdido el signo: un número negativo elevado a un exponente impar sigue siendo negativo. Si te sale $-6$, has multiplicado $\\lambda$ por $3$ en vez de elevarlo.',
      answer: -8,
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
