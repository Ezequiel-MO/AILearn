import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 3 para el proyecto «Rango bajo y LoRA». La entrada
 * generada la añade otro paso. Ids: `examen-3.<tema>`, únicos en todo el juego (también frente a las
 * preguntas de proyecto).
 */
export const examen3RangoBajo: BankEntry[] = [
  {
    project: 'rango-bajo',
    question: {
      id: 'examen-3.lora-b-cero',
      type: 'opcion',
      prompt:
        'En LoRA, la actualización $\\Delta W=BA$ se inicializa con $B$ toda de ceros y $A$ con números aleatorios. ¿Para qué sirve empezar con $B$ a cero?',
      hints: [
        'Calcula $BA$ al empezar el entrenamiento, con $B=0$. ¿Qué matriz sale?',
        'Piensa en qué hace el modelo afinado, $W+BA$, antes de dar el primer paso de entrenamiento.',
      ],
      explain:
        'Con $B=0$, el producto $BA$ vale $0$ sea cual sea $A$, y la suma $W+BA$ es exactamente $W$. El entrenamiento parte así del modelo original, sin perturbarlo.',
      solution:
        'Para que $\\Delta W=BA$ valga $0$ al empezar: el modelo afinado es idéntico al original y el entrenamiento arranca desde un modelo que ya funciona. $A$ sí se entrena (en cuanto $B$ deja de ser $0$ recibe cambios), el rango de $BA$ crece con el entrenamiento hasta $r$ como mucho, y $BA$ se puede fusionar con $W$ al terminar con cualquier inicialización.',
      options: [
        'Para que $A$ no se entrene y solo se entrene $B$',
        'Para que $\\Delta W$ valga $0$ al empezar y el modelo afinado parta idéntico al original',
        'Para que $BA$ tenga rango $0$ durante todo el entrenamiento',
        'Para que $BA$ se pueda fusionar con $W$ al terminar, cosa que con otra inicialización no se podría',
      ],
      correct: 1,
    },
  },
  {
    project: 'rango-bajo',
    question: {
      id: 'examen-3.error-peor-direccion',
      type: 'numero',
      prompt:
        'Una matriz $A$ tiene valores singulares $9$, $5$, $2$ y $1$, y se aproxima por su mejor matriz de rango $2$, $A_{2}$. Para un vector de entrada de longitud $1$, ¿cuál es lo máximo que puede diferir la salida de $A$ de la de $A_{2}$, es decir, el mayor valor de $|(A-A_{2})\\,x|$?',
      hints: [
        'La diferencia $A-A_{2}$ conserva solo las piezas que se descartaron, con sus mismos valores singulares.',
        'El mayor estiramiento de una matriz es su valor singular mayor.',
      ],
      explain:
        'En la peor dirección, el error de la mejor aproximación de rango $k$ es el primer valor singular que se descarta, $\\sigma_{k+1}$. No es la raíz de la suma de los cuadrados descartados: esa cuenta mide el error total, no el de una dirección.',
      solution:
        'La diferencia $A-A_{2}$ solo tiene las piezas descartadas, con valores singulares $2$ y $1$, y su mayor estiramiento es $2$. Es $\\sigma_{3}=2$. Si te sale $1$ has tomado el último valor singular; si sale $\\sqrt{5}\\approx 2{,}24$, el error de Frobenius, que suma las dos piezas.',
      answer: 2,
      tol: 0,
    },
  },
];
