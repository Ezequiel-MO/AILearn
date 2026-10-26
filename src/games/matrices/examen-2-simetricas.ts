import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 2 para el proyecto «Matrices simétricas». La
 * entrada generada la añade otro paso. Ids: `examen-2.<tema>`, únicos en todo el juego (también
 * frente a las preguntas de proyecto).
 */
export const examen2Simetricas: BankEntry[] = [
  {
    project: 'simetricas',
    question: {
      id: 'examen-2.angulo-autovectores',
      type: 'opcion',
      prompt:
        'Una matriz simétrica de $2\\times 2$ tiene dos autovalores distintos. Los dos autovectores, ¿qué ángulo forman?',
      hints: [
        'Piensa en un ejemplo, como $\\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$, con autovectores $(1, 1)$ y $(1, -1)$: calcula su producto escalar.',
        'Una propiedad que vale para toda matriz simétrica no puede depender de los números concretos de la matriz.',
      ],
      explain:
        'La simetría fija la relación entre las dos direcciones que la matriz solo estira, sea cual sea la matriz. No es una casualidad de un ejemplo, ni de que los autovalores sean sencillos.',
      solution:
        'Forman $90^\\circ$: los autovectores de una matriz simétrica con autovalores distintos son perpendiculares. Con $\\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$, el producto escalar de $(1, 1)$ y $(1, -1)$ es $0$. Sin simetría no hay garantía: $\\begin{pmatrix}2&1\\\\0&1\\end{pmatrix}$ tiene autovectores $(1, 0)$ y $(1, -1)$, que forman $45^\\circ$.',
      options: [
        '$90^\\circ$, porque en una matriz simétrica las dos direcciones que solo se estiran son perpendiculares',
        '$45^\\circ$, porque las dos direcciones reparten el plano en partes iguales',
        'Depende de la matriz: cada matriz simétrica tiene su propio ángulo',
        '$0^\\circ$, porque con autovalores distintos los dos autovectores señalan lo mismo',
      ],
      correct: 0,
    },
  },
  {
    project: 'simetricas',
    question: {
      id: 'examen-2.varianza-direccion',
      type: 'numero',
      prompt:
        'Unos datos tienen por matriz de covarianza $C=\\begin{pmatrix}4&2\\\\2&4\\end{pmatrix}$. ¿Qué varianza tienen en la dirección del vector de longitud $1$ $\\vec{u}=(0{,}6;\\ 0{,}8)$, es decir, cuánto vale $\\vec{u}^{T}C\\vec{u}$?',
      hints: [
        'Calcula primero $C\\vec{u}$, que es un vector, y después su producto escalar con $\\vec{u}$.',
        'El resultado tiene que quedar entre los dos autovalores de $C$, que son $2$ y $6$.',
      ],
      explain:
        'La varianza en una dirección es un solo número: el producto escalar de $\\vec{u}$ con $C\\vec{u}$. Hacerlo por componentes también vale: $4u_1^2+2\\cdot 2\\,u_1u_2+4u_2^2$. Cuida el doble producto cruzado.',
      solution:
        '$C\\vec{u}=(4\\cdot 0{,}6+2\\cdot 0{,}8,\\ 2\\cdot 0{,}6+4\\cdot 0{,}8)=(4;\\ 4{,}4)$, y $\\vec{u}^{T}C\\vec{u}=0{,}6\\cdot 4+0{,}8\\cdot 4{,}4=5{,}92$. Por componentes: $4\\cdot 0{,}36+2\\cdot 2\\cdot 0{,}48+4\\cdot 0{,}64=5{,}92$. Está entre $2$ y $6$, como tiene que estar: la varianza en una dirección nunca baja del menor autovalor ni sube del mayor.',
      answer: 5.92,
      tol: 0.01,
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
