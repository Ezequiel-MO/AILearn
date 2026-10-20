import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 3 para el proyecto «Analogías». La pregunta con
 * números variables (a − b + c con tres vectores enteros de ℝ³) la añade otro paso, como entrada
 * `generada`. Ids: `examen-3.<tema>`, únicos en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen3Analogias: BankEntry[] = [
  {
    project: 'analogias',
    question: {
      id: 'examen-3.excluir-entradas',
      type: 'opcion',
      prompt:
        'Con los embeddings reales del modelo de los datos, la búsqueda por coseno para Madrid − España + Italia da, sin excluir nada, «Madrid» $0{,}77$, «Italia» $0{,}77$, «Roma» $0{,}63$ y «Lisboa» $0{,}58$. La respuesta esperada es «Roma». ¿Por qué hay que excluir las entradas de la analogía y qué devuelve entonces la búsqueda?',
      hints: [
        'Reescribe la aritmética como `a + (c - b)`: ¿a qué palabras se parece un vector que es una entrada más un desplazamiento?',
        'Tacha de la lista las tres entradas y mira cuál queda arriba.',
      ],
      explain:
        'El resultado de la aritmética conserva casi todo de las entradas, y por eso suelen ser lo más cercano. Mira qué opciones explican esa cercanía y cuáles solo cambian el nombre de la regla.',
      solution:
        'Madrid − España + Italia es «Madrid» + («Italia» − «España»): una entrada más un desplazamiento, así que queda muy cerca de «Madrid» y de «Italia». Por eso sin excluir ganan ellas. Al excluir «Madrid», «España» e «Italia», gana «Roma» ($0{,}63$), la esperada; las otras explicaciones no concuerdan con los datos: excluir sí cambia el resultado y las entradas tienen cosenos altos, no bajos.',
      options: [
        'Porque `a - b + c` es `a + (c - b)` y queda muy cerca de `a` y de `c`; al excluir las tres entradas gana «Roma»',
        'Porque una palabra no puede ser su propia respuesta, pero es solo una regla de formato: la palabra que gana no cambia',
        'Porque las entradas siempre tienen el coseno más bajo con el resultado; al excluirlas gana «Lisboa»',
        'Porque el resultado es perpendicular a las entradas; al excluirlas sigue ganando «Madrid»',
      ],
      correct: 0,
    },
  },
  {
    project: 'analogias',
    question: {
      id: 'examen-3.coseno-escala',
      type: 'vector',
      prompt:
        'Embeddings de juguete, inventados y de 3 componentes (los reales tienen cientos). El resultado de una analogía es $\\vec{w}=(2, 3, 6)$ y una palabra del vocabulario es $\\vec{x}=(3, 0, 4)$. Calcula el coseno de $\\vec{w}$ con $\\vec{x}$ y el de $5\\vec{w}$ con $\\vec{x}$, en ese orden y redondeados a dos decimales.',
      hints: [
        'Calcula primero el producto escalar y las normas de $\\vec{w}$ y de $\\vec{x}$; las dos son enteras.',
        'Para $5\\vec{w}$, mira qué le pasa al producto escalar y qué le pasa a la norma.',
      ],
      explain:
        'Multiplicar un vector por un número positivo cambia su longitud pero no su dirección, y el coseno solo mira la dirección. Comprueba si el numerador y el denominador se compensan.',
      solution:
        '$\\vec{w}\\cdot\\vec{x}=6+0+24=30$, $\\lVert\\vec{w}\\rVert=\\sqrt{4+9+36}=7$ y $\\lVert\\vec{x}\\rVert=5$, así que $\\cos\\theta=\\dfrac{30}{35}=\\dfrac{6}{7}\\approx0{,}86$. Con $5\\vec{w}$ el producto escalar es $150$ y la norma, $35$: $\\dfrac{150}{35\\cdot5}=\\dfrac{6}{7}$, el mismo valor. Por eso normalizar el resultado de la analogía no cambia qué palabra gana.',
      answer: [0.86, 0.86],
      tol: 0.01,
    },
  },
  {
    project: 'analogias',
    question: {
      id: 'examen-3.consistencia',
      type: 'codigo',
      prompt:
        'Con los embeddings reales de `embeddings` (modelo paraphrase-multilingual-MiniLM-L12-v2, 384 dimensiones), la relación entre dos palabras es la diferencia de sus vectores. Define `consistencia(a, b, c, d)`, que devuelve el coseno entre la relación `a → b` (`vector(b) - vector(a)`) y la relación `c → d` (`vector(d) - vector(c)`): cerca de $1$, las dos relaciones son la misma. Guarda en `consist_rey` la consistencia de «hombre» → «mujer» con «rey» → «reina».',
      hints: [
        'Calcula las dos diferencias y, con ellas, el producto escalar dividido entre las normas.',
        'El orden importa: `b - a` y `d - c`, ambas de origen a destino.',
      ],
      explain:
        'El coseno entre dos diferencias necesita las normas de las dos: sin ellas es solo un producto escalar. Comprueba también el sentido: si inviertes una de las dos, el signo cambia.',
      solution:
        'Con `u = vector(b) - vector(a)` y `v = vector(d) - vector(c)`, la función devuelve `u @ v / (np.linalg.norm(u) * np.linalg.norm(v))`. Para «hombre» → «mujer» y «rey» → «reina», `consist_rey` vale $0{,}68$. Una relación idéntica a sí misma da $1$, y si se invierte una de las dos diferencias el signo cambia: $-0{,}68$.',
      requirements: [
        '`consistencia` es una función que recibe cuatro palabras `a`, `b`, `c` y `d` y devuelve un número decimal: el coseno entre las dos relaciones, ambas de origen a destino.',
        'Se prueba con otras parejas de palabras además de la del enunciado, también con una relación comparada consigo misma y con una relación puesta al revés, y no puede dar un error.',
        '`consist_rey` guarda lo que devuelve `consistencia` para «hombre», «mujer», «rey» y «reina»; se acepta una diferencia de hasta una centésima.',
      ],
      starter: `import numpy as np
from embeddings import vector

def consistencia(a, b, c, d):
    # Coseno entre la relación a -> b (vector(b) - vector(a)) y la relación c -> d (vector(d) - vector(c))
    return None

# Guarda en consist_rey la consistencia de hombre -> mujer con rey -> reina
consist_rey = None
`,
      checks: `import embeddings as _e
_f = callable(globals().get("consistencia"))
def _call(*args):
    try:
        return consistencia(*args)
    except Exception:
        return None
def _rel(a, b, c, d):
    _u = _e.vector(b) - _e.vector(a)
    _w = _e.vector(d) - _e.vector(c)
    return float(_u @ _w / (np.linalg.norm(_u) * np.linalg.norm(_w))), float(_u @ _w)
_casos = [("hombre", "mujer", "rey", "reina"), ("hombre", "mujer", "padre", "madre"), ("hombre", "mujer", "hombre", "mujer"), ("mujer", "hombre", "rey", "reina")]
_exp = [_rel(*c)[0] for c in _casos]
_dot = [_rel(*c)[1] for c in _casos]
_res = [_call(*c) if _f else None for c in _casos]
_num = all(isinstance(r, (float, np.floating)) and not isinstance(r, bool) for r in _res)
_ok = _num and all(abs(float(r) - e) < 0.01 for r, e in zip(_res, _exp))
_dots = _num and all(abs(float(r) - e) < 0.01 for r, e in zip(_res, _dot))
_neg = _num and all(abs(float(r) + e) < 0.01 for r, e in zip(_res, _exp)) and abs(_exp[0]) > 0.1
check(_f, "Hay que definir una función \`consistencia\` con cuatro parámetros: las palabras \`a\`, \`b\`, \`c\` y \`d\`.")
check(_num, "\`consistencia\` tiene que devolver un número decimal: el coseno entre las dos relaciones.")
check((not _num) or not _dots, "\`consistencia\` devuelve un producto escalar: falta dividir entre las normas de las dos diferencias para tener un coseno.")
check((not _num) or not _neg, "\`consistencia\` tiene los signos cambiados: las dos relaciones van de origen a destino, \`b - a\` y \`d - c\`.")
check((not _num) or _dots or _neg or _ok, "\`consistencia\` tiene que ser el coseno entre \`vector(b) - vector(a)\` y \`vector(d) - vector(c)\`.")
_r = isinstance(consist_rey, (float, np.floating)) and not isinstance(consist_rey, bool)
check((not _ok) or (_r and abs(float(consist_rey) - _exp[0]) < 0.01), "\`consist_rey\` tiene que guardar lo que devuelve \`consistencia\` para «hombre», «mujer», «rey» y «reina».")
`,
      reference: `import numpy as np
from embeddings import vector

def consistencia(a, b, c, d):
    # Coseno entre la relación a -> b (vector(b) - vector(a)) y la relación c -> d (vector(d) - vector(c))
    u = vector(b) - vector(a)
    v = vector(d) - vector(c)
    return u @ v / (np.linalg.norm(u) * np.linalg.norm(v))

# Guarda en consist_rey la consistencia de hombre -> mujer con rey -> reina
consist_rey = consistencia("hombre", "mujer", "rey", "reina")
`,
    },
  },
];
