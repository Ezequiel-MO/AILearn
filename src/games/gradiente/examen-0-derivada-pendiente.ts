import type { BankEntry } from '../../content/schema';
import { py } from '../py';

/**
 * Entradas fijas del banco de examen de la Órbita 0 del juego 3 para el proyecto «Derivada como
 * pendiente». La entrada generada (`examen-0.pendiente-secante`) la añade el montaje. Ids:
 * `examen-0.<tema>`, únicos en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen0DerivadaPendiente: BankEntry[] = [
  {
    project: 'derivada-pendiente',
    question: {
      id: 'examen-0.secante-en-figura',
      type: 'numero',
      prompt:
        'Un modelo tiene la pérdida de la figura, según su peso $w$. Con $w=1$ la pérdida vale $5$ y con $w=4$, $2$ (puntos P y Q). ¿Cuál es la pendiente de la secante que pasa por P y por Q?',
      hints: [
        'Lee las coordenadas de P y de Q en el panel y resta en el mismo orden.',
        'Divide lo que cambia la pérdida entre lo que cambia $w$. La curva baja entre los dos puntos.',
      ],
      explain:
        'La pendiente de la secante es $\\dfrac{L(q)-L(p)}{q-p}$: la tasa de cambio media de la pérdida entre los dos pesos. Si la pérdida baja, sale negativa.',
      solution:
        'De P a Q la pérdida pasa de $5$ a $2$: cambia $-3$ en un avance de $3$. La pendiente es $\\dfrac{-3}{3}=-1$: en media, la pérdida baja $1$ por cada unidad que sube $w$.',
      answer: -1,
      tol: 0,
      graph: {
        x: [0, 6],
        y: [0, 11],
        snap: 0.5,
        curve: { kind: 'poly', coefs: [10, -6, 1] },
        points: [
          { id: 'p', label: 'P', x: 1, movable: false, onCurve: true },
          { id: 'q', label: 'Q', x: 4, movable: false, onCurve: true },
        ],
        readouts: ['coords'],
        labels: { x: 'w', y: 'pérdida' },
      },
    },
  },
  {
    project: 'derivada-pendiente',
    question: {
      id: 'examen-0.leer-tangente',
      type: 'opcion',
      prompt:
        'La figura es la pérdida de un modelo, con la tangente en el peso P. La tangente es una recta **horizontal**. ¿Qué dice eso de la pérdida en P?',
      hints: [
        'Una recta horizontal ni sube ni baja: ¿qué pendiente tiene?',
        'La tangente resume cómo cambia la curva cerca de P: ¿cambia la pérdida si mueves $w$ un poquito?',
      ],
      explain:
        'Una tangente horizontal es una pendiente cero: cerca de P la pérdida casi no cambia al mover $w$. No dice que la pérdida valga cero, ni que $w$ valga cero.',
      solution:
        'La pendiente en P es $0$: un movimiento pequeño de $w$ casi no cambia la pérdida. Aquí P está en el fondo de la curva, con una pérdida de $1$: no vale $0$.',
      options: [
        'La pendiente vale 0: un movimiento pequeño de $w$ casi no cambia la pérdida',
        'La pérdida vale 0: el modelo no se equivoca',
        'El peso $w$ vale 0',
        'La pendiente es muy grande: la pérdida cambia mucho al mover $w$',
      ],
      correct: 0,
      graph: {
        x: [-1, 5],
        y: [-1, 10],
        snap: 0.5,
        curve: { kind: 'poly', coefs: [5, -4, 1] },
        points: [{ id: 'p', label: 'P', x: 2, movable: false, onCurve: true }],
        readouts: ['coords'],
        labels: { x: 'w', y: 'pérdida' },
        tangent: true,
      },
    },
  },
  {
    project: 'derivada-pendiente',
    question: {
      id: 'examen-0.derivada-numerica',
      type: 'codigo',
      prompt:
        'Escribe `derivada_centrada(f, x)`: la derivada numérica de `f` en `x`, con la secante centrada entre `x - h` y `x + h` y un paso `h` fijo de $0{,}0001$. Se prueba con varias funciones.',
      hints: [
        'El plan son dos líneas. Define el paso, `h = 0.0001`, y `return` del cambio entre los dos lados, `f(x + h)` menos `f(x - h)`, dividido entre `2 * h`. Un error típico: dividir entre `h`, que duplica el resultado.',
        'Las piezas, con otra función:\n\n' +
          py(
            'g = lambda t: t ** 2',
            'h = 0.1',
            'print(g(1 + h) - g(1 - h))              # 0.4 (más o menos): el cambio entre los dos lados',
            'print((g(1 + h) - g(1 - h)) / (2 * h))  # 2.0: ese cambio entre 2h, la derivada de g en 1',
          ) +
          '\n\nEl paso `h` se escribe dentro de la función: no es un parámetro.',
        'El esqueleto, con huecos `___` donde decides tú:\n\n' +
          py(
            'def derivada_centrada(f, x):',
            '    h = 0.0001',
            '    return (f(x + ___) - f(x - ___)) / (___ * h)',
          ) +
          '\n\nLos dos primeros huecos son `h`; el último es el `2` de la distancia entre los dos puntos.',
      ],
      explain:
        'La secante centrada mira a los dos lados de `x`, y por eso se acerca a la derivada más que la de hacia delante. La distancia entre `x - h` y `x + h` es `2 * h`.',
      solution:
        'Se divide el cambio de `f` entre los dos lados, `f(x + h) - f(x - h)`, entre `2 * h`. Con `x ** 2` en $3$ sale $6$ y con `x ** 3` en $2$ sale $12$, casi exactos.',
      requirements: [
        '`derivada_centrada` es una función con dos parámetros, una función `f` y un número `x`. Devuelve un número.',
        'Se llama con varias funciones y varios puntos, y el resultado se compara con la derivada exacta con mucha precisión.',
      ],
      starter: `import numpy as np


# Aquí no hay datos hechos: la función recibe f y x. Las comprobaciones la llaman con varias funciones.

def derivada_centrada(f, x):
    # El paso es fijo: va dentro de la función. Todo lo de dentro lleva 4 espacios delante.
    h = 0.0001

    # PASO 1. Devolver el cambio de f entre los dos lados de x, dividido entre la distancia, con return.
    # Qué: (f(x + h) - f(x - h)) / (2 * h). La distancia entre x - h y x + h es 2 * h.
    # Con g = lambda t: t ** 2, en 1 y h = 0.1, sale (1.1 ** 2 - 0.9 ** 2) / 0.2 = 2.
    return None

# Para probarla antes de entregar: llama a derivada_centrada(lambda t: t ** 2, 3), imprime el resultado con
# print(...) y pulsa «Ejecutar».
`,
      checks: `import numbers
_casos = [(lambda t: t ** 2, 3, 6), (lambda t: t ** 3, 2, 12), (lambda t: 5 * t - 1, 4, 5), (lambda t: t ** 2, 0, 0), (lambda t: 3, 1, 0)]
_f = callable(globals().get("derivada_centrada"))
def _try(f, x):
    try:
        return derivada_centrada(f, x)
    except Exception:
        return None
_got = [_try(f, x) for f, x, _e in _casos] if _f else []
_run = _f and all(g is not None for g in _got)
_num = _run and all(isinstance(g, numbers.Real) and not isinstance(g, bool) and g == g for g in _got)
_ok = _num and all(abs(g - e) < 1e-6 for g, (_g, _x, e) in zip(_got, _casos))
_doble = _num and all(abs(g - 2 * e) < 1e-6 for g, (_g, _x, e) in zip(_got, _casos))
_delante = _num and all(abs(g - (f(x + 0.0001) - f(x)) / 0.0001) < 1e-6 for g, (f, x, _e) in zip(_got, _casos))
check(_f, "Hay que definir una función \`derivada_centrada\` con los parámetros \`f\` y \`x\`.")
check((not _f) or _run, "\`derivada_centrada\` da un error con alguna función, o devuelve \`None\`. Tiene que terminar con \`return\` y el resultado.")
check((not _run) or _num, "\`derivada_centrada\` tiene que devolver un número: el cambio entre los dos lados dividido entre \`2 * h\`.")
check((not _num) or _ok or not _doble, "\`derivada_centrada\` sale el doble: la distancia entre \`x - h\` y \`x + h\` es \`2 * h\`, no \`h\`.")
check((not _num) or _ok or not _delante, "\`derivada_centrada\` usa la secante de hacia delante, entre \`x\` y \`x + h\`. Aquí se pide la centrada: entre \`x - h\` y \`x + h\`.")
check((not _num) or _ok or _doble or _delante, "\`derivada_centrada\` no da la derivada numérica centrada: \`(f(x + h) - f(x - h)) / (2 * h)\`.")
`,
      reference:
        'import numpy as np\n\n\ndef derivada_centrada(f, x):\n    h = 0.0001\n    return (f(x + h) - f(x - h)) / (2 * h)\n',
    },
  },
];
