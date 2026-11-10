import type { BankEntry } from '../../content/schema';
import { CORREOS, capaLab } from './datos';

/**
 * Entradas fijas del banco de examen de la Órbita 1 para el proyecto «Inversa»: un laboratorio (la
 * decodificadora de otro codificador, con los correos), una cuenta (recuperar un correo de su
 * código) y una de código. La entrada generada (`examen-1.resolver-sistema`) la añade el ensamblado
 * de la órbita. Ids: `examen-1.<tema>`, únicos en todo el juego (también frente a las preguntas de
 * proyecto).
 */
export const examen1Inversa: BankEntry[] = [
  {
    project: 'inversa',
    question: {
      id: 'examen-1.decodificar-correos',
      type: 'laboratorio',
      prompt:
        'Seis correos con dos rasgos: **enlaces** y **saludos**. Un codificador fijo los ha girado un cuarto de vuelta (los cuadraditos). Las dianas son donde estaba cada correo antes de codificarlo.\n\nConstruye la capa que devuelve cada correo a su diana.',
      hints: [
        'Mira hacia dónde ha girado cada correo respecto a su diana: ¿en qué sentido hay que girar para volver?',
        'Gira las dos columnas un cuarto de vuelta en sentido horario: $\\hat{\\imath}$ hacia abajo y $\\hat{\\jmath}$ hacia la derecha.',
      ],
      explain:
        'El codificador gira sin estirar: no pierde nada, y su inversa es otro giro, el contrario. Cada columna de tu capa dice adónde manda una salida del código.',
      solution:
        'La decodificadora: $\\hat{\\imath}$ en $(0, -1)$ y $\\hat{\\jmath}$ en $(1, 0)$, un cuarto de vuelta en sentido horario. «premio», codificado en $(-1, 3)$, vuelve a $(3, 1)$. Girar otra vez en el mismo sentido deja cada correo al otro lado del origen. La inversa de un giro es su traspuesta.',
      lab: capaLab(CORREOS, {
        before: { i: [0, 1], j: [-1, 0] },
        targets: Object.fromEntries(
          CORREOS.points.map((p) => [p.id, [p.x, p.y] as [number, number]]),
        ),
      }),
      goals: [
        {
          metric: 'target_err',
          op: 'lte',
          target: 0,
          label: 'Distancia a su diana del correo más lejano',
        },
      ],
      solved: { ix: 0, iy: -1, jx: 1, jy: 0 },
    },
  },
  {
    project: 'inversa',
    question: {
      id: 'examen-1.recuperar-correo',
      type: 'vector',
      prompt:
        'Un codificador de correos tiene $\\text{salida 1}=\\text{enlaces}+\\text{saludos}$ y $\\text{salida 2}=\\text{saludos}$. Llega el código $(4;\\ 1{,}5)$. ¿Cuántos enlaces y cuántos saludos tenía el correo? Escribe los dos rasgos, primero los enlaces.',
      hints: [
        'La segunda salida ya es un rasgo: léela directamente.',
        'Quita los saludos a la primera salida y quedan los enlaces.',
      ],
      explain:
        'La segunda salida copia los saludos, así que el sistema se resuelve en orden: primero los saludos y, con ellos, los enlaces.',
      solution:
        'Saludos: $1{,}5$, la segunda salida. Enlaces: $4-1{,}5=2{,}5$. El correo es $(2{,}5;\\ 1{,}5)$. La capa que deshace este codificador resta la segunda salida a la primera: es la inclinación contraria.',
      answer: [2.5, 1.5],
      tol: 0,
    },
  },
  {
    project: 'inversa',
    question: {
      id: 'examen-1.sistema-en-codigo',
      type: 'codigo',
      prompt:
        'Ya tienes la matriz `A` y el vector `b` de un sistema $A\\vec{x}=\\vec{b}$. Guarda en `x` su solución, usando `np.linalg.solve`, y en `invertible` si `A` tiene inversa, como un solo `True` o `False`. Calcula `invertible` con el determinante y una comparación con tolerancia.',
      hints: [
        '`np.linalg.solve(A, b)` recibe primero la matriz y después el vector.',
        '`A` tiene inversa cuando su determinante, `np.linalg.det(A)`, no es casi $0$; `np.isclose(d, 0)` es verdadero cuando sí lo es.',
      ],
      explain:
        '`invertible` tiene que valer `True` cuando la matriz sí tiene inversa, es decir, cuando el determinante no es casi cero. Una condición escrita al revés da el valor contrario al que se pide.',
      solution:
        'Se escribe `x = np.linalg.solve(A, b)`, que vale $(1, 2)$, y `invertible = not np.isclose(np.linalg.det(A), 0)`. El determinante es $3\\cdot 2-1\\cdot 1=5$, distinto de $0$, así que `invertible` es `True`. Con una matriz singular, `solve` no daría una solución válida: conviene mirar el determinante antes.',
      requirements: [
        '`x` es un array de NumPy con 2 números: el vector que `A` lleva hasta `b`, con un pequeño margen por el redondeo.',
        '`invertible` es un solo `True` o `False` (no el valor del determinante), y dice si `A` tiene inversa.',
      ],
      starter: `import numpy as np

A = np.array([[3, 1], [1, 2]])
b = np.array([5, 5])
# Guarda en x la solución de A x = b, y en invertible si A tiene inversa
x = None
invertible = None
`,
      checks: `_x = isinstance(x, np.ndarray) and x.shape == (2,) and np.issubdtype(x.dtype, np.number)
_i = isinstance(invertible, (bool, np.bool_))
check(_x, "\`x\` tiene que ser un array de NumPy con 2 números: la solución del sistema.")
check((not _x) or np.allclose(x, [1, 2]), "\`x\` tiene que valer (1, 2): es el vector que \`A\` lleva hasta \`b\`, es decir, \`A @ x\` tiene que dar \`b\`.")
check(_i, "\`invertible\` tiene que ser un solo \`True\` o \`False\`, y no el valor del determinante.")
check((not _i) or bool(invertible), "\`invertible\` vale \`False\`, pero el determinante de \`A\` es 5, distinto de 0: la matriz sí tiene inversa. Revisa la condición, que puede estar al revés.")
`,
      reference:
        'import numpy as np\n\nA = np.array([[3, 1], [1, 2]])\nb = np.array([5, 5])\nx = np.linalg.solve(A, b)\ninvertible = not np.isclose(np.linalg.det(A), 0)\n',
    },
  },
];
