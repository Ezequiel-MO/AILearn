import type { BankEntry } from '../../content/schema';
import { NUBE_ALARGADA, capaLab } from './datos';

/**
 * Entradas fijas del banco de examen de la Órbita 2 para el proyecto «Matrices simétricas»: un
 * laboratorio (decorrelar otra nube, cuyo eje no es la diagonal), una cuenta de la covarianza de
 * embeddings reales y una de código. La entrada generada la añade otro paso. Ids:
 * `examen-2.<tema>`, únicos en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen2Simetricas: BankEntry[] = [
  {
    project: 'simetricas',
    question: {
      id: 'examen-2.decorrelar-nube',
      type: 'laboratorio',
      prompt:
        'Siete palabras de tres temas, repartidas a lo largo de una diagonal. Sus dos coordenadas van juntas: con la capa en la identidad, la covarianza de las dos salidas es alta.\n\nMueve las columnas de la capa hasta que esa covarianza sea casi cero, sin que la capa aplaste la nube.',
      hints: [
        'Mira hacia dónde se alarga la nube: de «perro» a «coche». Ese eje tiene que acabar sobre un eje del dibujo.',
        'Gira la nube para tumbar su eje largo sobre la salida 1. El eje de esta nube no es la diagonal: sube una casilla por cada dos que avanza.',
      ],
      explain:
        'La covarianza de las salidas es cero cuando la nube de salida queda alargada a lo largo de un eje del dibujo: conocer una salida no dice nada de la otra. Llevarlo todo a una recta también da cero, pero entonces la capa no deja área.',
      solution:
        'Una capa que vale: $\\hat{\\imath}$ en $(1;\\ -0{,}5)$ y $\\hat{\\jmath}$ en $(0{,}5;\\ 1)$. La salida 1 mide la posición a lo largo del eje largo de la nube, la dirección $(2, 1)$, y la salida 2, a lo ancho: covarianza casi $0$ y área $1{,}25$. El giro de un octavo de vuelta no vale aquí, porque el eje de esta nube no es la diagonal $(1, 1)$.',
      lab: capaLab(NUBE_ALARGADA, { readouts: ['spread_x', 'spread_y'] }),
      goals: [
        {
          metric: 'cov_xy',
          op: 'eq',
          target: 0,
          tol: 0.05,
          label: 'Covarianza de las dos salidas',
        },
        {
          metric: 'area',
          op: 'gte',
          target: 0.5,
          label: 'Área que deja la capa al cuadrado unidad',
        },
      ],
      solved: { ix: 1, iy: -0.5, jx: 0.5, jy: 1 },
    },
  },
  {
    project: 'simetricas',
    question: {
      id: 'examen-2.covarianza-384',
      type: 'numero',
      prompt:
        'Un buscador guarda embeddings de frases de $384$ números. Su matriz de covarianza es de $384\\times 384$, con las varianzas en la diagonal y cada covarianza dos veces, una a cada lado.\n\n¿Cuántos números distintos hay que guardar, como mucho?',
      hints: [
        'La diagonal tiene $384$ números, todos distintos entre sí en principio.',
        'Las casillas de fuera van por parejas iguales, una a cada lado de la diagonal: cuenta la mitad.',
      ],
      explain:
        'Una matriz simétrica queda fijada por su diagonal y por lo que hay a un lado de ella. Con $n$ coordenadas son $n(n+1)/2$ números, no $n^2$.',
      solution:
        'Fuera de la diagonal hay $384^2-384=147\\,072$ casillas, que forman $73\\,536$ parejas. Con las $384$ varianzas, $73\\,536+384=73\\,920$, que es $384\\cdot 385/2$. La matriz entera tiene $147\\,456$ casillas.',
      answer: 73920,
      tol: 0,
    },
  },
  {
    project: 'simetricas',
    question: {
      id: 'examen-2.autovalores-de-mayor-a-menor',
      type: 'codigo',
      prompt:
        'En `datos` hay 5 muestras (una por fila) de 2 variables (una por columna). Guarda en `lam` un array con los dos autovalores de su matriz de covarianza, del **mayor al menor**.',
      hints: [
        'Primero la matriz de covarianza de las dos variables, de 2 por 2, y después sus autovalores. Comprueba la forma de lo que sale de `np.cov`.',
        '`np.linalg.eigh` devuelve los autovalores en un orden fijo, pero quizá no el que se pide.',
      ],
      explain:
        'Hay dos tropiezos: `np.cov` toma por defecto cada fila como una variable, y entonces la matriz sale de 5 por 5 y con ella, 5 autovalores; y `np.linalg.eigh` los da de menor a mayor, el orden contrario al que se pide.',
      solution:
        'La covarianza de las dos columnas es $\\begin{pmatrix}2{,}5&2\\\\2&2{,}5\\end{pmatrix}$, con autovalores $0{,}5$ y $4{,}5$. `eigh` los da como `[0.5, 4.5]`, y hay que darles la vuelta: `lam` vale `[4.5, 0.5]`. Con `np.cov(datos)` sin más sale una matriz de 5 por 5, y con ella, 5 autovalores.',
      requirements: [
        '`lam` es un array de NumPy con 2 números reales: los autovalores de la matriz de covarianza de las dos variables de `datos`.',
        'Los autovalores van ordenados del mayor al menor.',
        'Se aceptan diferencias diminutas de redondeo.',
      ],
      starter: `import numpy as np

datos = np.array([
    [1, 0],
    [2, -1],
    [3, 1],
    [4, 3],
    [5, 2],
])
# Guarda en lam los dos autovalores de la matriz de covarianza de datos, del mayor al menor
lam = None
`,
      checks: `_a = isinstance(lam, np.ndarray) and lam.dtype.kind in "iuf"
_five = _a and lam.shape == (5,)
_two = _a and lam.shape == (2,)
check(_a, "\`lam\` tiene que ser un array de NumPy con números reales: los autovalores.")
check((not _a) or not _five, "\`lam\` tiene 5 autovalores, los de una matriz de 5 por 5. La matriz de covarianza de las dos variables es de 2 por 2: \`np.cov\` toma por defecto cada fila como una variable, y aquí las variables están en las columnas.")
check((not _a) or _five or _two, "\`lam\` tiene que tener 2 números: los dos autovalores de la matriz de covarianza.")
check((not _two) or not np.allclose(lam, [0.5, 4.5]), "\`lam\` está de menor a mayor, que es el orden en que \`np.linalg.eigh\` devuelve los autovalores. Se pide del mayor al menor.")
check((not _two) or np.allclose(lam, [0.5, 4.5]) or np.allclose(lam, [4.5, 0.5]), "\`lam\` tiene que tener los dos autovalores de la matriz de covarianza de las dos variables de \`datos\`, el mayor primero.")
`,
      reference:
        'import numpy as np\n\ndatos = np.array([\n    [1, 0],\n    [2, -1],\n    [3, 1],\n    [4, 3],\n    [5, 2],\n])\nC = np.cov(datos, rowvar=False)\nlam = np.linalg.eigh(C)[0][::-1]\n',
    },
  },
];
