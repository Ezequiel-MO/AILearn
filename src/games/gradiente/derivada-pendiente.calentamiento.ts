import type { WarmupStep } from '../../content/schema';

/** Calentamiento de Python del proyecto «Derivada como pendiente»: lo nuevo de su ejercicio «Programar». */
export const derivadaPendienteWarmup: WarmupStep[] = [
  {
    id: 'derivada-pendiente.cal.1',
    title: 'Una función como argumento, y `lambda`',
    explain:
      'En Python una función es un valor más: se puede pasar a otra función, que la llama por dentro.\n\n- `def aplicar(f, x): return f(x)` recibe `f` y la usa como cualquier función, `f(x)`.\n- `lambda t: t + 1` es una función sin nombre, escrita en una línea: recibe `t` y devuelve `t + 1`.\n\nAsí se escribe «la derivada de **cualquier** función»: la función a derivar llega como argumento.',
    example: `def aplicar(f, x):
    return f(x)

doble = lambda t: 2 * t
print("doble de 5:", aplicar(doble, 5))
print("con una lambda en el sitio:", aplicar(lambda t: t ** 2, 5))

def diferencia(f, a, b):
    return f(b) - f(a)

print("cambio de t ** 2 entre 1 y 3:", diferencia(lambda t: t ** 2, 1, 3))
`,
    experiments: [
      'Cambia `lambda t: t ** 2` por `lambda t: t ** 3` y mira cómo cambia el resultado.',
      'Escribe `print(doble)` y mira qué sale: es la función, no un número. Con `doble(5)` sí es un número.',
      'Llama a `diferencia(doble, 1, 3)`: la misma función `diferencia` sirve para otra `f`.',
    ],
    task: {
      prompt:
        'Escribe `dos_veces(f, x)`: aplica `f` a `x` y otra vez al resultado, y devuelve lo que sale. Guarda en `r` el resultado de `dos_veces(lambda t: 3 * t, 5)`.',
      starter: `# Aquí tienes la función a medias: aplica f a x, y luego otra vez al resultado.
def dos_veces(f, x):
    return None

# Guarda en r el resultado de dos_veces con la función lambda t: 3 * t y x = 5
r = None
`,
      checks: `_f = callable(globals().get("dos_veces"))
def _try(f, x):
    try:
        return dos_veces(f, x)
    except Exception:
        return None
_got = [_try(lambda t: t + 1, 10), _try(lambda t: 2 * t, 3), _try(lambda t: t ** 2, 2)] if _f else []
_ok = _f and _got == [12, 12, 16]
_uno = _f and _got == [11, 6, 4]
_r = isinstance(r, (int, float)) and not isinstance(r, bool)
check(_f, "Hay que definir una función \`dos_veces\` con los parámetros \`f\` y \`x\`.")
check((not _f) or _ok or not _uno, "\`dos_veces\` aplica \`f\` una sola vez. Aplícala otra vez al resultado: \`f(f(x))\`.")
check((not _f) or _ok or _uno, "\`dos_veces\` no devuelve \`f\` aplicada dos veces. Con \`lambda t: t + 1\` y \`x = 10\` tiene que dar 12.")
check(_r, "\`r\` tiene que ser un número: el resultado de \`dos_veces(lambda t: 3 * t, 5)\`.")
check((not _r) or r == 45, "\`r\` no es el resultado de aplicar \`lambda t: 3 * t\` dos veces a 5. Llama a \`dos_veces\` con esa función y ese número.")
`,
      reference: `def dos_veces(f, x):
    return f(f(x))

r = dos_veces(lambda t: 3 * t, 5)
`,
    },
  },
  {
    id: 'derivada-pendiente.cal.2',
    title: '`np.linspace` y operar con un array entero',
    explain:
      '`np.linspace(a, b, n)` da `n` números repartidos con el mismo paso desde `a` hasta `b`, **incluidos** los dos extremos. Es la rejilla para dibujar una curva.\n\nUn array se opera entero, sin bucle: `xs ** 2` eleva al cuadrado cada número a la vez, y `xs + 1` suma $1$ a cada uno. Se pueden combinar, y el resultado es otro array de la misma longitud.',
    example: `import numpy as np

ts = np.linspace(0, 1, 5)
print("5 números de 0 a 1:", ts)
print("al cuadrado:", ts ** 2)
print("al cuadrado menos 1:", ts ** 2 - 1)
print("longitud:", len(ts))
`,
    experiments: [
      'Cambia el `5` por `11` y mira cómo cambia el paso entre los números.',
      'Cambia `0, 1` por `-1, 1` y mira que el cero queda en medio.',
      'Escribe `print(ts[1] - ts[0])`: es el paso de la rejilla, el mismo entre cada pareja.',
    ],
    task: {
      prompt:
        'Guarda en `xs` cinco números repartidos de $1$ a $3$ (con `np.linspace`) y en `ys` cada uno al cuadrado menos $1$ (operando con el array entero, sin bucle).',
      starter: `import numpy as np

# Guarda en xs cinco números repartidos de 1 a 3, y en ys el cuadrado de cada uno menos 1
xs = None
ys = None
`,
      checks: `_xs = isinstance(xs, np.ndarray) and xs.shape == (5,) and np.issubdtype(xs.dtype, np.number)
_ys = isinstance(ys, np.ndarray) and ys.shape == (5,) and np.issubdtype(ys.dtype, np.number)
check(_xs, "\`xs\` tiene que ser un array de NumPy con 5 números.")
check((not _xs) or bool(np.allclose(xs, [1, 1.5, 2, 2.5, 3])), "\`xs\` tiene que repartir los cinco números de 1 a 3, incluidos los dos: \`np.linspace(1, 3, 5)\`.")
check(_ys, "\`ys\` tiene que ser un array de NumPy con 5 números.")
check((not _ys) or (not _xs) or bool(np.allclose(ys, np.asarray(xs) ** 2 - 1)), "\`ys\` tiene que ser, para cada número de \`xs\`, su cuadrado menos 1.")
`,
      reference: `import numpy as np

xs = np.linspace(1, 3, 5)
ys = xs ** 2 - 1
`,
    },
  },
];
