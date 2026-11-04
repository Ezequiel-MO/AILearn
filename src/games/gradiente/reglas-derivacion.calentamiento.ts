import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto «Reglas de derivación»: lo nuevo de su ejercicio «Programar». */
export const reglasDerivacionWarmup: WarmupStep[] = [
  {
    id: 'reglas-derivacion.cal.1',
    title: 'Un polinomio como array: `np.arange` y operar elemento a elemento',
    explain:
      'Un polinomio se guarda como un array de **coeficientes**, del término independiente al de mayor grado: `[3, 2, 5]` es $3+2x+5x^2$. El **índice** de cada coeficiente es su exponente.\n\n`np.arange(n)` da los números `0, 1, ..., n - 1`: los exponentes. Y NumPy opera **elemento a elemento**: `coefs * exps` multiplica cada coeficiente por su exponente, y `x ** exps` eleva `x` a cada exponente.\n\n`p[1:]` quita el primer elemento (el término independiente).',
    example: `import numpy as np

p = np.array([3, 2, 5])        # 3 + 2x + 5x²
exps = np.arange(len(p))
print("exponentes:", exps)
print("coeficiente por exponente:", p * exps)
print("sin el primero:", p[1:])
print("el segundo y el tercero, con exponentes 1 y 2:", p[1:] * np.arange(1, len(p)))

x = 2
print("cada término en x = 2:", p * x ** exps)
print("suma de los términos:", np.sum(p * x ** exps))
`,
    experiments: [
      'Cambia `x = 2` por `x = 0`: solo sobrevive el término independiente, porque $0^0$ vale $1$ y el resto se anula.',
      'Cambia `p` por `np.array([1, 0, 0, 4])` y mira qué términos salen en `p * x ** exps`.',
      'Escribe `print(np.arange(1, 4))`: con dos números, `np.arange` empieza en el primero y acaba antes del segundo.',
    ],
    task: {
      prompt:
        'Guarda en `potencias` los exponentes de los términos de `q` (de $0$ en adelante, uno por coeficiente) y en `terminos` el valor de cada término de `q` en $x=2$.',
      starter: `import numpy as np

q = np.array([6, 1, 0, 4])
# Guarda en potencias los exponentes de q y en terminos cada término de q evaluado en x = 2
potencias = None
terminos = None
`,
      checks: `_q = np.array([6, 1, 0, 4])
_p = isinstance(potencias, np.ndarray) and potencias.shape == (4,) and np.issubdtype(potencias.dtype, np.number)
_t = isinstance(terminos, np.ndarray) and terminos.shape == (4,) and np.issubdtype(terminos.dtype, np.number)
check(_p, "\`potencias\` tiene que ser un array de NumPy con 4 números: un exponente por cada coeficiente de \`q\`.")
check((not _p) or bool(np.allclose(potencias, [0, 1, 2, 3])), "\`potencias\` tiene que ser \`0, 1, 2, 3\`: el exponente del primer término es 0, no 1. Usa \`np.arange\` con la longitud de \`q\`.")
check(_t, "\`terminos\` tiene que ser un array de NumPy con 4 números: un término por cada coeficiente de \`q\`.")
check((not _t) or bool(np.allclose(terminos, _q * 2 ** np.arange(4))), "\`terminos\` no es cada coeficiente por \`2\` elevado a su exponente. Con elementos sueltos no vale: opera con los dos arrays a la vez.")
`,
      reference:
        'import numpy as np\n\nq = np.array([6, 1, 0, 4])\npotencias = np.arange(len(q))\nterminos = q * 2 ** potencias\n',
    },
  },
  {
    id: 'reglas-derivacion.cal.2',
    title: 'Dar la vuelta a un array con `[::-1]`',
    explain:
      'Aquí el polinomio va del término independiente al de mayor grado, pero **NumPy** (`np.polyder`, `np.polyval`) lo espera **al revés**: del mayor grado al independiente.\n\n`a[::-1]` devuelve `a` dado la vuelta, sin tocar el original. Para usar una función de NumPy: se da la vuelta a la entrada y, si devuelve otro polinomio, también a la salida.',
    example: `import numpy as np

a = np.array([2, 0, 7])        # 2 + 7x²
print("a:", a)
print("a al revés:", a[::-1])
print("el original no cambia:", a)

# np.polyder espera el mayor grado primero
d = np.polyder(a[::-1])
print("derivada, en el orden de NumPy:", d)
print("derivada, en nuestro orden:", d[::-1])
`,
    experiments: [
      'Escribe `print(np.polyder(a))` sin darle la vuelta a `a` y compara: sale otra derivada, la de $7+0x+2x^2$.',
      'Cambia `a` por `np.array([1, 2, 3, 4])` y mira `a[::-1]`.',
      'Prueba `a[::-1][0]`: es el coeficiente de mayor grado.',
    ],
    task: {
      prompt:
        'Guarda en `invertido` el array `r` dado la vuelta (el de mayor grado primero) y en `sin_primero` el array `r` sin su primer elemento.',
      starter: `import numpy as np

r = np.array([2, 0, 3, 1])
# Guarda en invertido el array r dado la vuelta y en sin_primero el array r sin su primer elemento
invertido = None
sin_primero = None
`,
      checks: `_i = isinstance(invertido, np.ndarray) and invertido.shape == (4,)
_s = isinstance(sin_primero, np.ndarray) and sin_primero.shape == (3,)
check(_i, "\`invertido\` tiene que ser un array de NumPy con los 4 elementos de \`r\`, en otro orden.")
check((not _i) or bool(np.array_equal(invertido, [1, 3, 0, 2])), "\`invertido\` tiene que ser \`r\` de atrás adelante. Se hace con \`r[::-1]\`.")
check(_s, "\`sin_primero\` tiene que ser un array de NumPy con 3 elementos: \`r\` sin el primero.")
check((not _s) or bool(np.array_equal(sin_primero, [0, 3, 1])), "\`sin_primero\` tiene que ser \`r\` desde el segundo elemento hasta el final: \`r[1:]\`.")
`,
      reference:
        'import numpy as np\n\nr = np.array([2, 0, 3, 1])\ninvertido = r[::-1]\nsin_primero = r[1:]\n',
    },
  },
];
