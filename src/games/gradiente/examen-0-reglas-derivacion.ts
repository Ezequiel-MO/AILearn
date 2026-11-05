import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 0 para el proyecto «Reglas de derivación». La entrada
 * generada (`examen-0.derivada-polinomio`) la añade el montaje. Ids: `examen-0.<tema>`, únicos en todo
 * el juego (también frente a las preguntas de proyecto).
 */
export const examen0ReglasDerivacion: BankEntry[] = [
  {
    project: 'reglas-derivacion',
    question: {
      id: 'examen-0.derivada-de-la-perdida',
      type: 'numero',
      prompt:
        "La figura es la pérdida $L(w)=w^4-2w^2+3w+5$ y P está en $w=2$. Mira la tangente y calcula con las reglas de derivación la pendiente $L'(2)$.",
      hints: [
        'Deriva cada término con la regla de la potencia: $w^4$ pasa a $4w^3$ y $-2w^2$ pasa a $-4w$. La constante $5$ desaparece.',
        "Con $L'(w)=4w^3-4w+3$, sustituye $w=2$.",
      ],
      explain:
        'Regla de la potencia en cada término, y la suma se deriva término a término. Después se evalúa en el punto.',
      solution:
        "$L'(w)=4w^3-4w+3$, así que $L'(2)=4\\cdot 8-8+3=27$. La pérdida sube muy deprisa a la derecha de P: hay que bajar $w$.",
      answer: 27,
      tol: 0,
      graph: {
        x: [-2, 2.5],
        y: [0, 40],
        snap: 0.5,
        curve: { kind: 'poly', coefs: [5, 3, -2, 0, 1] },
        points: [{ id: 'p', label: 'P', x: 2, movable: false, onCurve: true }],
        readouts: ['coords'],
        labels: { x: 'w', y: 'pérdida' },
        tangent: true,
      },
    },
  },
  {
    project: 'reglas-derivacion',
    question: {
      id: 'examen-0.coeficientes-de-la-derivada',
      type: 'vector',
      prompt:
        "Los coeficientes de $f(x)=5-4x+3x^3$ son $(5,\\,-4,\\,0,\\,3)$. Escribe los de su derivada $f'$, del término independiente al de mayor grado.",
      hints: [
        'Cada término $a\\,x^k$ pasa a $k\\,a\\,x^{k-1}$ y la constante se va. El término en $x^2$ de $f$ no existe: vale $0$.',
        'Derivada del término $-4x$: $-4$. Del $3x^3$: $9x^2$.',
      ],
      explain:
        'El exponente baja como factor y el término independiente desaparece. Un término que falta (coeficiente $0$) sigue ocupando su lugar.',
      solution:
        "$f'(x)=-4+0x+9x^2$, es decir, $(-4,\\,0,\\,9)$. El $0$ del medio es el término en $x$: viene del $0\\cdot x^2$ de $f$ y hay que escribirlo.",
      answer: [-4, 0, 9],
      tol: 0,
    },
  },
  {
    project: 'reglas-derivacion',
    question: {
      id: 'examen-0.derivada-en-codigo',
      type: 'codigo',
      prompt:
        'Un polinomio es un array de coeficientes, del término independiente al de mayor grado. Escribe `derivada_en(coefs, x0)`: devuelve el valor de su derivada en `x0`, con la regla de la potencia y sin bucles. Se prueba con varios polinomios, también con una constante.',
      hints: [
        'Primero los coeficientes de la derivada: `coefs[1:]` por los exponentes `np.arange(1, len(coefs))`. Después, el valor en `x0`: cada coeficiente por `x0` elevado a su índice, y la suma.',
        'La derivada de una constante es $0$: con un solo coeficiente no quedan términos y la suma de nada es $0$.',
      ],
      explain:
        'Derivar un polinomio es multiplicar cada coeficiente por su exponente y correr los lugares; evaluar es sumar cada coeficiente por la potencia de `x0` de su índice.',
      solution:
        'Los coeficientes de la derivada son `coefs[1:] * np.arange(1, len(coefs))`; el valor es la suma de esos por `x0 ** np.arange(len(d))`. Para `[5, -4, 3]` en $x=2$: $-4+6\\cdot 2=8$.',
      requirements: [
        '`derivada_en` es una función que recibe un array de coeficientes y un número, y devuelve un número.',
        'Se llama con polinomios de distinto grado, también de un solo coeficiente, y con valores negativos de `x0`; no debe dar error.',
        'El número es la pendiente de la tangente en `x0`: la derivada del polinomio evaluada ahí.',
      ],
      starter: `import numpy as np


# Aquí no hay datos hechos: la función recibe sus coeficientes y su punto.

def derivada_en(coefs, x0):
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría).

    # PASO 1. d: los coeficientes de la derivada.
    # Por qué: el término independiente se va y cada coeficiente se multiplica por su exponente.
    # Cómo: coefs[1:] por np.arange(1, len(coefs)). Con [2, 7, 5] sale [7 10].
    d = None

    # PASO 2. Devolver el valor de la derivada en x0, con return.
    # Cada coeficiente de d por x0 elevado a su índice, y la suma: np.sum(d * x0 ** np.arange(len(d))).
    return None
`,
      checks: `import numbers
_casos = [([5, -4, 3], 2, 8), ([1, 2, -3, 1], 2, 2), ([7], 3, 0), ([0, 0, 0, 1], -2, 12), ([4, 3, -2, 5], 1, 14)]
_f = callable(globals().get("derivada_en"))
def _try(c, x):
    try:
        return derivada_en(np.array(c), x)
    except Exception:
        return None
_got = [_try(c, x) for c, x, _e in _casos] if _f else []
_run = _f and all(g is not None for g in _got)
_num = _run and all((isinstance(g, (numbers.Real, np.number)) or (isinstance(g, np.ndarray) and g.ndim == 0 and np.issubdtype(g.dtype, np.number))) and not isinstance(g, (bool, np.bool_)) and g == g for g in _got)
_ok = _num and all(abs(g - e) < 1e-9 for g, (_c, _x, e) in zip(_got, _casos))
_val = _num and (not _ok) and all(abs(g - float(np.polyval(c[::-1], x))) < 1e-9 for g, (c, x, _e) in zip(_got, _casos))
check(_f, "Hay que definir una función \`derivada_en\` que reciba los coeficientes y \`x0\`.")
check((not _f) or _run, "\`derivada_en\` da un error con algún polinomio, o devuelve \`None\`. Una constante no tiene términos tras derivar, y la suma de nada es 0.")
check((not _run) or _num, "\`derivada_en\` tiene que devolver un número: el valor de la derivada en \`x0\`.")
check((not _num) or not _val, "\`derivada_en\` devuelve el valor del polinomio en \`x0\`, no el de su derivada. Hay que derivar antes de evaluar.")
check((not _num) or _ok or _val, "\`derivada_en\` no da la derivada en \`x0\`. Quita el término independiente, multiplica cada coeficiente por su exponente y evalúa lo que queda.")
`,
      reference:
        'import numpy as np\n\n\ndef derivada_en(coefs, x0):\n    d = coefs[1:] * np.arange(1, len(coefs))\n    return np.sum(d * x0 ** np.arange(len(d)))\n',
    },
  },
];
