import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 2 para el proyecto «Dimensión alta». La pregunta
 * con números variables (el coseno entre dos vectores al azar) la añade otro paso, como entrada `generada`.
 * Ids: `examen-2.<tema>`, únicos en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen2DimensionAlta: BankEntry[] = [
  {
    project: 'dimension-alta',
    question: {
      id: 'examen-2.maximo',
      type: 'numero',
      prompt:
        'En $\\mathbb{R}^5$ tienes ya cuatro vectores no nulos perpendiculares dos a dos. ¿Cuántos vectores más, como máximo, puedes añadir de modo que todos sigan siendo perpendiculares dos a dos?',
      hints: [
        'En $\\mathbb{R}^n$ caben como mucho $n$ vectores no nulos perpendiculares dos a dos.',
        'Resta los que ya tienes.',
      ],
      explain:
        'El máximo de vectores perpendiculares dos a dos lo fija el número de componentes del espacio, no los que ya hayas colocado. Calcula cuántos faltan para llegar a ese máximo.',
      solution:
        'En $\\mathbb{R}^5$ caben $5$ vectores perpendiculares dos a dos, como los cinco ejes. Como ya hay $4$, solo cabe $5-4=1$ más: es el que apunta en la dirección que los cuatro dejan libre.',
      answer: 1,
      tol: 0,
    },
  },
  {
    project: 'dimension-alta',
    question: {
      id: 'examen-2.concentracion',
      type: 'opcion',
      prompt:
        'Un índice busca los vecinos más cercanos por distancia euclídea entre puntos de dimensión muy alta. Se observa que la distancia al vecino más lejano y la distancia al más cercano son casi iguales: su razón es cercana a $1$. ¿Qué consecuencia tiene para la búsqueda por distancia?',
      hints: [
        'Piensa en qué pasa si todos los puntos están casi a la misma distancia de la consulta.',
        'Un orden entre valores casi iguales cambia con un cambio pequeño en los datos.',
      ],
      explain:
        'Buscar por distancia consiste en distinguir al más cercano del resto. Pregúntate cuánto lo distingue una razón cercana a $1$ y qué ocurre si los datos tienen un poco de ruido.',
      solution:
        'Si la distancia máxima y la mínima son casi iguales, el «más cercano» apenas se distingue del resto, y un pequeño ruido en los datos cambia el orden de los resultados. Es la **maldición de la dimensión**. La distancia sí se calcula sin problema, y el coseno de vectores al azar no vale siempre $0$: solo se concentra cerca de $0$.',
      options: [
        'Ninguna: la distancia sigue distinguiendo bien al más cercano del resto',
        'La distancia deja de poder calcularse en dimensión alta',
        'Todos los vectores pasan a ser perpendiculares y su coseno vale siempre $0$',
        'El más cercano apenas se distingue del resto, y un pequeño ruido puede cambiar el resultado',
      ],
      correct: 3,
    },
  },
  {
    project: 'dimension-alta',
    question: {
      id: 'examen-2.umbral',
      type: 'codigo',
      prompt:
        'Dos textos tienen embeddings de `d` dimensiones (los de BERT-base tienen $768$) y un coseno `c` entre ellos. Para dos vectores al azar de `d` dimensiones, el coseno tiene una desviación típica de $\\dfrac{1}{\\sqrt{d}}$: el **ruido**. Se considera señal un coseno cuyo valor absoluto supera `3` veces el ruido. `abs(x)` da el valor absoluto y `np.sqrt` la raíz cuadrada. Completa la función `es_senal(c, d)` para que devuelva `True` si `c` es señal y `False` si no.',
      hints: [
        'El ruido es $1$ dividido entre la raíz cuadrada de `d`.',
        'La función devuelve una comparación: el valor absoluto de `c` frente a tres veces el ruido.',
      ],
      explain:
        'Se compara el tamaño del coseno, sin importar su signo, con un umbral que depende del ruido y, por tanto, de la dimensión. Un coseno de $-0{,}9$ también es señal, aunque sea negativo.',
      solution:
        'El ruido es `1 / np.sqrt(d)` y la función devuelve `abs(c) > 3 * ruido`. Con `d = 768`, el ruido es $\\dfrac{1}{\\sqrt{768}}\\approx0{,}036$ y el umbral, $0{,}108$: `es_senal(-0.12, 768)` es `True` y `es_senal(0.09, 768)` es `False`. Sin el valor absoluto, un coseno de $-0{,}12$ pasaría por ruido y se perdería una relación real, solo que opuesta. Con otra dimensión cambia el umbral: en `d = 100` es $0{,}3$.',
      starter: `import numpy as np


def es_senal(c, d):
    # Devuelve True si el valor absoluto de c supera 3 veces el ruido de d dimensiones, y False si no
    return None
`,
      checks: `def _llamar(c, d):
    try:
        r = es_senal(c, d)
    except BaseException:
        return None
    if isinstance(r, (bool, np.bool_)):
        return bool(r)
    return None


_casos = [(-0.12, 768, True), (0.09, 768, False), (0.2, 100, False), (-0.35, 100, True), (0.08, 2000, True), (0.05, 2000, False)]
_r = [_llamar(c, d) for c, d, _e in _casos]
_hay = all(x is not None for x in _r)
_neg = _hay and not (_r[0] and _r[3])
_todo = _hay and all(_r)
_esp = [e for _c, _d, e in _casos]
check(_hay, "\`es_senal(c, d)\` tiene que devolver \`True\` o \`False\`, el resultado de una comparación. Prueba con \`es_senal(-0.12, 768)\`: si no devuelve nada, falta el \`return\`; si da un error, revisa la fórmula.")
check((not _hay) or not _neg, "\`es_senal(-0.12, 768)\` o \`es_senal(-0.35, 100)\` dan \`False\`, pero esos cosenos son señal. Un coseno negativo también se aleja del ruido, así que compara el valor absoluto de \`c\`, y comprueba que el umbral es 3 veces 1 entre la raíz de \`d\`.")
check((not _hay) or _neg or not _todo, "\`es_senal\` devuelve \`True\` en todos los casos, también con \`es_senal(0.09, 768)\`, donde el coseno no llega a 3 veces el ruido. Comprueba el umbral: 3 veces 1 entre la raíz de \`d\`.")
check((not _hay) or _neg or _todo or _r == _esp, "\`es_senal\` no da el resultado esperado en todos los casos. Con d = 768 el umbral es 0,108, con d = 100, 0,3 y con d = 2000, 0,067. Comprueba que el ruido es 1 entre la raíz de d y que lo multiplicas por 3.")
`,
      reference: `import numpy as np


def es_senal(c, d):
    ruido = 1 / np.sqrt(d)
    return abs(c) > 3 * ruido
`,
    },
  },
];
