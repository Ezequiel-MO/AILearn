import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 1 para el proyecto «Proyección». Las generadas
 * las añade otro paso. Ids: `examen-1.<tema>`, únicos en todo el juego.
 */
export const examen1Proyeccion: BankEntry[] = [
  {
    project: 'proyeccion',
    question: {
      id: 'examen-1.proy-escalar',
      type: 'numero',
      prompt:
        'Calcula la proyección escalar de $\\vec{a}=(1, -7)$ sobre $\\vec{b}=(3, 4)$: el producto escalar dividido entre la norma de $\\vec{b}$. Es la longitud con signo de la sombra de $\\vec{a}$ sobre la recta de $\\vec{b}$, así que el signo importa.',
      hints: [
        'Empieza por el producto escalar: multiplica las componentes de dos en dos y suma.',
        'La norma de $\\vec{b}$ es $5$.',
      ],
      explain:
        'La proyección escalar es el producto escalar entre la norma de $\\vec{b}$. Si el producto escalar sale negativo, la proyección también lo es: no se quita el signo.',
      solution:
        'El producto escalar es $\\vec{a}\\cdot\\vec{b}=1\\cdot 3+(-7)\\cdot 4=-25$ y la norma es $\\lVert\\vec{b}\\rVert=5$, así que la proyección es $\\dfrac{-25}{5}=-5$. El signo negativo dice que la sombra de $\\vec{a}$ cae al lado contrario del que apunta $\\vec{b}$.',
      answer: -5,
      tol: 0,
    },
  },
  {
    project: 'proyeccion',
    question: {
      id: 'examen-1.proy-vector',
      type: 'vector',
      prompt:
        'Calcula la proyección vectorial de $\\vec{a}=(2, 6)$ sobre $\\vec{b}=(1, -1)$: $\\dfrac{\\vec{a}\\cdot\\vec{b}}{\\vec{b}\\cdot\\vec{b}}\\,\\vec{b}$. Escribe el resultado: primero la $x$ y después la $y$.',
      hints: [
        'Calcula los dos productos escalares, $\\vec{a}\\cdot\\vec{b}$ y $\\vec{b}\\cdot\\vec{b}$, y divide uno entre el otro.',
        'El cociente es un número negativo: la sombra apunta contra $\\vec{b}$.',
      ],
      explain:
        'El cociente de los dos productos escalares multiplica a $\\vec{b}$. Si el cociente es negativo, la sombra apunta en sentido contrario a $\\vec{b}$.',
      solution:
        'Los productos escalares son $\\vec{a}\\cdot\\vec{b}=2-6=-4$ y $\\vec{b}\\cdot\\vec{b}=1+1=2$. El cociente es $\\dfrac{-4}{2}=-2$ y la proyección es $-2\\,(1, -1)=(-2, 2)$.',
      answer: [-2, 2],
      tol: 0,
    },
  },
  {
    project: 'proyeccion',
    question: {
      id: 'examen-1.sesgo',
      type: 'opcion',
      prompt:
        'A cada embedding $\\vec{a}$ se le quita su componente en una dirección $\\vec{d}$, restándole su proyección sobre $\\vec{d}$. ¿Cuánto vale el producto escalar del vector resultante con $\\vec{d}$?',
      hints: [
        'Lo que queda es la componente de $\\vec{a}$ perpendicular a $\\vec{d}$.',
        'Piensa qué vale el producto escalar de dos vectores que forman un ángulo recto.',
      ],
      explain:
        'Al quitar la proyección sobre $\\vec{d}$ se elimina todo lo que $\\vec{a}$ tenía a lo largo de $\\vec{d}$. Piensa qué relación tiene con $\\vec{d}$ lo que queda.',
      solution:
        'Lo que queda es $\\vec{a}-k\\,\\vec{d}$ con $k=\\dfrac{\\vec{a}\\cdot\\vec{d}}{\\vec{d}\\cdot\\vec{d}}$, y su producto escalar con $\\vec{d}$ es $\\vec{a}\\cdot\\vec{d}-k\\,\\vec{d}\\cdot\\vec{d}=0$. Es la componente perpendicular, ortogonal a $\\vec{d}$, y por eso ya no queda nada de esa dirección.',
      options: [
        '$0$: lo que queda es ortogonal a $\\vec{d}$',
        'El mismo que tenía $\\vec{a}$ con $\\vec{d}$',
        'La norma de $\\vec{d}$',
        'Depende de $\\vec{a}$: no se puede saber',
      ],
      correct: 0,
    },
  },
];
