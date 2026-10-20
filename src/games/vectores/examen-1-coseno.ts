import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 1 para el proyecto «Coseno». Las preguntas con
 * números variables las añade otro paso, como entradas `generada`.
 * Ids: `examen-1.<tema>`, únicos en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen1Coseno: BankEntry[] = [
  {
    project: 'coseno',
    question: {
      id: 'examen-1.escala',
      type: 'opcion',
      prompt:
        'En un buscador, todas las componentes de un documento $\\vec{d}$ se duplican: pasa a ser $2\\vec{d}$. La consulta $\\vec{q}$ no cambia. ¿Cómo cambian la similitud coseno y la distancia euclídea entre la consulta y ese documento?',
      hints: [
        'El vector $2\\vec{d}$ apunta igual que $\\vec{d}$, pero es el doble de largo.',
        'En el coseno, el factor $2$ aparece en el numerador y en el denominador.',
      ],
      explain:
        'El coseno solo mira la dirección, y duplicar un vector no la cambia. La distancia mide cuánto separa las puntas de las flechas, y eso sí depende de la longitud.',
      solution:
        'El coseno no cambia: el $2$ se cancela entre el producto escalar y la norma de $2\\vec{d}$. La distancia sí cambia en general, porque la punta de $2\\vec{d}$ queda en otro sitio. Por eso un documento más largo puede alejarse de la consulta sin dejar de tratar del mismo tema.',
      options: [
        'La similitud coseno se duplica y la distancia no cambia',
        'Las dos se duplican',
        'La similitud coseno no cambia y la distancia suele cambiar',
        'Ninguna de las dos cambia',
      ],
      correct: 2,
    },
  },
  {
    project: 'coseno',
    question: {
      id: 'examen-1.perpendicular',
      type: 'numero',
      prompt:
        'Calcula el valor de $k$ para que los vectores $(k, 3)$ y $(2, 1)$ sean perpendiculares. Escríbelo con los decimales que hagan falta.',
      hints: [
        'Dos vectores son perpendiculares cuando su producto escalar es $0$.',
        'Escribe el producto escalar de $(k, 3)$ y $(2, 1)$ y despeja $k$.',
      ],
      explain:
        'Perpendicular quiere decir que el ángulo es de $90^\\circ$, es decir, que el coseno y el producto escalar valen $0$. Eso te da una ecuación en $k$.',
      solution:
        'El producto escalar es $k\\cdot2+3\\cdot1=2k+3$. Igualado a $0$, $k=-\\dfrac{3}{2}=-1{,}5$. Comprobación: $(-1{,}5;\\ 3)\\cdot(2, 1)=-3+3=0$.',
      answer: -1.5,
      tol: 0.01,
    },
  },
  {
    project: 'coseno',
    question: {
      id: 'examen-1.similitud',
      type: 'codigo',
      prompt:
        'Con la consulta `q = np.array([1, 2])` y un documento `d = np.array([4, 2])` (embeddings de juguete: inventados y de dos dimensiones; los reales tienen cientos), guarda en `sim` su similitud coseno. `np.dot(a, b)` calcula el producto escalar y `np.linalg.norm(a)`, la norma.',
      hints: [
        'La similitud coseno es el producto escalar dividido entre el producto de las dos normas.',
        'Agrupa con paréntesis las dos normas del denominador.',
      ],
      explain:
        'El coseno divide el producto escalar entre el producto de las dos normas. Si falta alguna de las normas, el resultado se sale del intervalo de $-1$ a $1$.',
      solution:
        'El producto escalar es $1\\cdot4+2\\cdot2=8$, y las normas son $\\sqrt5$ y $\\sqrt{20}$, cuyo producto vale $10$. Así que `sim` vale $\\dfrac{8}{10}=0{,}8$.',
      requirements: [
        '`sim` existe y es un único número, no un array.',
        '`sim` es la similitud coseno entre `q` y `d`, un valor entre -1 y 1.',
      ],
      starter: `import numpy as np

# Embeddings de juguete: inventados y de 2 dimensiones
q = np.array([1, 2])
d = np.array([4, 2])
# Guarda en sim la similitud coseno entre q y d
sim = None
`,
      checks: `_num = (isinstance(sim, (int, float, np.number)) and not isinstance(sim, bool)) or (isinstance(sim, np.ndarray) and sim.ndim == 0 and np.issubdtype(sim.dtype, np.number))
check(_num, "\`sim\` tiene que ser un único número, la similitud coseno entre \`q\` y \`d\`.")
check((not _num) or not np.isclose(sim, 8), "\`sim\` vale 8: es el producto escalar. Falta dividir entre el producto de las dos normas.")
check((not _num) or abs(sim) <= 1 + 1e-9 or np.isclose(sim, 8), "\`sim\` se sale del intervalo de -1 a 1, y un coseno nunca lo hace. Divide entre el producto de las dos normas, con paréntesis que las agrupen.")
check((not _num) or abs(sim) > 1 + 1e-9 or np.isclose(sim, 0.8), "\`sim\` tiene que valer 0,8: el producto escalar de \`q\` y \`d\` dividido entre el producto de sus normas.")
`,
      reference: `import numpy as np

# Embeddings de juguete: inventados y de 2 dimensiones
q = np.array([1, 2])
d = np.array([4, 2])
sim = np.dot(q, d) / (np.linalg.norm(q) * np.linalg.norm(d))
`,
    },
  },
];
