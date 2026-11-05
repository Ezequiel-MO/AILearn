import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 0 para el proyecto «Mínimos». La entrada generada
 * (`examen-0.minimo-perdida`) la añade el montaje. Ids: `examen-0.<tema>`, únicos en todo el juego
 * (también frente a las preguntas de proyecto).
 */
export const examen0Minimos: BankEntry[] = [
  {
    project: 'minimos',
    question: {
      id: 'examen-0.minimos-w-optimo',
      type: 'numero',
      prompt:
        'Un modelo $\\hat y=w\\cdot x$ se ajusta a dos datos, $(1, 2)$ y $(3, 7)$. ¿Qué $w$ hace mínima la pérdida (el error cuadrático medio)? Escríbelo con dos decimales.',
      hints: [
        'El mínimo está en $w^{*}=\\dfrac{\\sum x_iy_i}{\\sum x_i^{2}}$.',
        'Calcula las dos sumas por separado: la de los productos $x\\,y$ y la de los cuadrados $x^{2}$.',
      ],
      explain:
        'El fondo del valle es suma de productos entre suma de cuadrados. Dividir la suma de las $y$ entre la de las $x$ da otro número, que no hace mínima la pérdida.',
      solution:
        '$\\sum x_iy_i=1\\cdot2+3\\cdot7=23$ y $\\sum x_i^{2}=1+9=10$, luego $w^{*}=\\dfrac{23}{10}=2{,}3$. Si te sale $2{,}25$, has dividido $\\sum y$ entre $\\sum x$.',
      answer: 2.3,
      tol: 0.005,
    },
  },
  {
    project: 'minimos',
    question: {
      id: 'examen-0.minimos-parabola',
      type: 'numero',
      prompt:
        'La pérdida de un modelo es $L(w)=5w^{2}-12w+9$. Una parábola $a\\,w^{2}+b\\,w+c$ con $a>0$ tiene su mínimo donde la pendiente vale $0$. ¿En qué $w$ está el mínimo? Con dos decimales.',
      hints: [
        'La pendiente es $L^{\\prime}(w)=10w-12$. Iguálala a $0$.',
        'Con la fórmula $-\\dfrac{b}{2a}$ sale lo mismo: cuidado con el signo de $b$.',
      ],
      explain:
        'La pendiente de la parábola es $2a\\,w+b$ y se anula en $-b/(2a)$. Con $a>0$ la parábola abre hacia arriba, así que ahí está el mínimo y no la cima.',
      solution:
        '$L^{\\prime}(w)=10w-12=0$ da $w=\\dfrac{12}{10}=1{,}2$. Con ese $w$ la pérdida vale $1{,}8$: a los dos lados sube. Si te sale $-1{,}2$, has olvidado el signo de $b$.',
      answer: 1.2,
      tol: 0.005,
    },
  },
  {
    project: 'minimos',
    question: {
      id: 'examen-0.minimos-rejilla',
      type: 'codigo',
      prompt:
        'Ya tienes los datos `x` e `y` y `ws`, una lista de pesos candidatos para $\\hat y=w\\cdot x$. Guarda en `mejor_w` el peso de `ws` con la menor pérdida (la media de $(w\\,x_i-y_i)^2$), probando todos los pesos a la vez, sin bucle.',
      hints: [
        'Con `ws[:, None] * x` sale una tabla con una fila por peso; se resta `y`, se eleva al cuadrado y se promedia cada fila. `np.argmin` da la posición del menor.',
        'La posición no es el peso: con ella se saca el valor de `ws`. Un error típico: guardar la posición en `mejor_w`.',
      ],
      explain:
        'Cada peso da una pérdida y el mejor es el de la pérdida más baja. `np.argmin` devuelve una posición, así que hay que sacar el peso de `ws` con ella.',
      solution:
        'La pérdida de cada peso es la media de los errores al cuadrado de su fila, y el menor está en la posición 26 de `ws`: `mejor_w` vale $2{,}6$. Si guardas la posición, sale $26$, que no es un peso.',
      requirements: [
        '`mejor_w` existe y es un número: el peso de `ws` con la menor pérdida.',
        'No es la posición de ese peso en `ws` ni el valor de la pérdida.',
      ],
      starter: `import numpy as np

x = np.array([1, 2, 3])
y = np.array([3, 5, 8])
ws = np.linspace(0, 3, 31)
# Guarda en mejor_w el peso de ws con la menor pérdida (la media de los errores al cuadrado)
mejor_w = None
`,
      checks: `_x = np.array([1, 2, 3])
_y = np.array([3, 5, 8])
_ws = np.linspace(0, 3, 31)
_exp = ((_ws[:, None] * _x - _y) ** 2).mean(axis=1)
_best = float(_ws[np.argmin(_exp)])
_m = isinstance(mejor_w, (int, float, np.integer, np.floating)) and not isinstance(mejor_w, (bool, np.bool_))
check(_m, "\`mejor_w\` tiene que ser un número: el peso de \`ws\` con la menor pérdida.")
check((not _m) or float(mejor_w) != 26, "\`mejor_w\` vale 26: es la posición del mejor peso en \`ws\`, no el peso. Saca el peso de \`ws\` con esa posición.")
check((not _m) or float(mejor_w) == 26 or abs(float(mejor_w) - _best) < 1e-9, "\`mejor_w\` no es el peso de \`ws\` con la menor pérdida. Calcula la pérdida de cada peso y elige el menor.")
`,
      reference:
        'import numpy as np\n\nx = np.array([1, 2, 3])\ny = np.array([3, 5, 8])\nws = np.linspace(0, 3, 31)\n\nperdidas = ((ws[:, None] * x - y) ** 2).mean(axis=1)\nmejor_w = ws[np.argmin(perdidas)]\n',
    },
  },
];
