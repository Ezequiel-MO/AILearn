import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 1 para «Producto escalar»: tres preguntas cortas
 * que comprueban lo esencial del proyecto. Las generadas se añaden aparte.
 * Ids: `examen-1.<tema>`, únicos en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen1ProductoEscalar: BankEntry[] = [
  {
    project: 'producto-escalar',
    question: {
      id: 'examen-1.escalar-3d',
      type: 'numero',
      prompt:
        'El producto escalar se define igual con cualquier número de componentes: se multiplican las que se corresponden y se suman los productos. Calcula $(2, -1, 4)\\cdot(3, 6, -1)$. Escribe el número.',
      hints: [
        'Hay tres parejas de componentes: multiplica cada una y suma los tres productos.',
        'Cuidado con los signos de la segunda y la tercera pareja.',
      ],
      explain:
        'El producto escalar es una suma de productos de componentes, y da un solo número. Los productos con un factor negativo restan.',
      solution: '$(2, -1, 4)\\cdot(3, 6, -1)=2\\cdot3+(-1)\\cdot6+4\\cdot(-1)=6-6-4=-4$.',
      answer: -4,
      tol: 0,
    },
  },
  {
    project: 'producto-escalar',
    question: {
      id: 'examen-1.ortogonales',
      type: 'opcion',
      prompt:
        'Dos vectores son ortogonales cuando forman un ángulo recto. ¿Cuál de estas parejas de vectores es ortogonal?',
      hints: [
        'La condición de ortogonalidad se comprueba con el producto escalar.',
        'Calcula el producto escalar de cada pareja y busca el que da $0$.',
      ],
      explain:
        'Calcula el producto escalar de cada pareja. Ten en cuenta que un producto escalar negativo no es cero: indica un ángulo obtuso.',
      solution:
        'El producto escalar de $(3, -1)$ y $(1, 3)$ es $3\\cdot1+(-1)\\cdot3=0$: son ortogonales. Los de $(1, 2)$ y $(2, 1)$ y los de $(2, 2)$ y $(1, 1)$ dan $4$, un ángulo agudo. Los de $(1, 0)$ y $(-1, 0)$ dan $-1$: apuntan a lados opuestos, un ángulo de $180^\\circ$, no de $90^\\circ$.',
      options: [
        '$(1, 2)$ y $(2, 1)$',
        '$(3, -1)$ y $(1, 3)$',
        '$(2, 2)$ y $(1, 1)$',
        '$(1, 0)$ y $(-1, 0)$',
      ],
      correct: 1,
    },
  },
  {
    project: 'producto-escalar',
    question: {
      id: 'examen-1.signo-agudo',
      type: 'codigo',
      prompt:
        'El signo del producto escalar dice si el ángulo entre dos vectores es agudo (menor de $90^\\circ$, producto escalar positivo) o no. Ya tienes `a = np.array([2, -1, 3])` y `b = np.array([1, 4, 2])`. Guarda en `agudo` el valor `True` si `a` y `b` forman un ángulo agudo y `False` si no.',
      hints: [
        'Hace falta el producto escalar de `a` y `b`, y mirar su signo.',
        'Una comparación con un número da `True` o `False`.',
      ],
      explain:
        'El ángulo es agudo cuando el producto escalar es positivo. Piensa qué comparación da un `True` o un `False` en vez de un número.',
      solution:
        'El producto escalar es $2\\cdot1+(-1)\\cdot4+3\\cdot2=2-4+6=4$, positivo. Se escribe `agudo = a @ b > 0`, que da `True`: el ángulo es agudo.',
      starter: `import numpy as np

a = np.array([2, -1, 3])
b = np.array([1, 4, 2])
# Guarda en agudo True si a y b forman un ángulo agudo, y False si no
agudo = None
`,
      checks: `_b = isinstance(agudo, (bool, np.bool_))
check(_b, "\`agudo\` tiene que ser \`True\` o \`False\`, no un número: compara el producto escalar con 0.")
check((not _b) or bool(agudo), "El producto escalar de \`a\` y \`b\` es positivo (vale 4), así que forman un ángulo agudo: \`agudo\` tiene que ser \`True\`.")
`,
      reference: `import numpy as np

a = np.array([2, -1, 3])
b = np.array([1, 4, 2])
agudo = a @ b > 0
`,
    },
  },
];
