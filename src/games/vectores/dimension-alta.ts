import type { PlaneSpec, PlaneVector, Project } from '../../content/schema';

/** Plano del proyecto: rango 6 y rejilla de 1 en 1, salvo que se diga otra cosa. */
const plane = (
  vectors: PlaneVector[],
  readouts: PlaneSpec['readouts'],
  pair?: [string, string],
  range = 6,
  snap = 1,
): PlaneSpec => ({ range, snap, vectors, readouts, ...(pair ? { pair } : {}) });

/** Un vector del plano, móvil o fijo. */
const arrow = (
  id: string,
  [x, y]: readonly [number, number],
  movable: boolean,
  label: string = id,
): PlaneVector => ({ id, label, x, y, movable });

/** Tercer proyecto de la Órbita 2: en dimensión alta casi todo es casi perpendicular. */
export const dimensionAlta: Project = {
  id: 'dimension-alta',
  name: 'Dimensión alta',
  sub: 'Donde casi todo es perpendicular',
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'dimension-alta.ex00.1',
          type: 'manipular',
          prompt:
            'Dos vectores son **perpendiculares** (u **ortogonales**) cuando forman $90^\\circ$, es decir, cuando su producto escalar vale $0$. En este proyecto vas a preguntarte cuántos vectores perpendiculares entre sí caben en un espacio, y empiezas por el plano. El vector $\\vec{u}$ está fijo en $(3, 1)$. Mueve $\\vec{w}$ hasta que sea perpendicular a $\\vec{u}$ y su primera componente valga $1$. Mientras lo haces, mira si habría otra solución: ¿cuántas direcciones perpendiculares a $\\vec{u}$ hay en el plano?',
          hints: [
            'Mira las lecturas del producto escalar y del ángulo mientras arrastras la punta de $\\vec{w}$.',
            'Perpendicular quiere decir producto escalar cero: $3w_1+w_2=0$. Con $w_1=1$, despeja $w_2$.',
          ],
          explain:
            'Que $\\vec{w}$ sea perpendicular a $\\vec{u}$ es una sola ecuación, $3w_1+w_2=0$, y fija $w_2$ en cuanto eliges $w_1$. Todos los vectores que la cumplen están sobre una misma recta.',
          solution:
            'Con $w_1=1$, la ecuación $3\\cdot1+w_2=0$ da $w_2=-3$: $\\vec{w}=(1, -3)$. Todos los perpendiculares a $\\vec{u}$ son múltiplos de $(1, -3)$, en los dos sentidos: en el plano solo hay **una** dirección perpendicular a $\\vec{u}$. Por eso en el plano no cabe un tercer vector perpendicular a los otros dos. Los siguientes ejercicios lo comprueban.',
          plane: plane(
            [arrow('u', [3, 1], false), arrow('w', [2, 2], true)],
            ['components', 'dot', 'angle'],
            ['u', 'w'],
          ),
          goals: [
            { metric: 'angle', of: ['u', 'w'], target: 90, tol: 0.01 },
            { metric: 'x', of: ['w'], target: 1, tol: 0.01 },
          ],
        },
        {
          id: 'dimension-alta.ex00.2',
          type: 'manipular',
          prompt:
            'Una pareja de vectores perpendiculares entre sí, los dos de norma $5$, es la mejor «regla y escuadra» del plano. Coloca los dos vectores móviles $\\vec{a}$ y $\\vec{b}$ perpendiculares entre sí, con norma $5$ los dos y con la primera componente de $\\vec{a}$ igual a $3$. Las lecturas comparan $\\vec{a}$ con $\\vec{b}$.',
          hints: [
            'Empieza por $\\vec{a}$: con $a_1=3$, su norma es $5$ si $3^2+a_2^2=25$.',
            'Para $\\vec{b}$, usa el producto escalar con $\\vec{a}$, que tiene que valer $0$, y que su norma sea $5$.',
          ],
          explain:
            'Hay dos condiciones sobre $\\vec{a}$ (su norma y su primera componente) y dos sobre $\\vec{b}$ (su norma y ser perpendicular a $\\vec{a}$). Resuélvelas en ese orden: primero $\\vec{a}$ y después $\\vec{b}$.',
          solution:
            'Con $a_1=3$ y norma $5$, $a_2=\\pm4$: $\\vec{a}=(3, 4)$. Un vector perpendicular a él es $\\vec{b}=(-4, 3)$: $\\vec{a}\\cdot\\vec{b}=-12+12=0$ y su norma es $\\sqrt{16+9}=5$. También sirve $(4, -3)$. Ya tienes dos vectores perpendiculares entre sí: en el plano es todo lo que cabe.',
          plane: plane(
            [arrow('a', [1, 2], true), arrow('b', [2, 1], true)],
            ['components', 'norm', 'dot', 'angle'],
            ['a', 'b'],
          ),
          goals: [
            { metric: 'dot', of: ['a', 'b'], target: 0, tol: 0.01 },
            { metric: 'norm', of: ['a'], target: 5, tol: 0.01 },
            { metric: 'norm', of: ['b'], target: 5, tol: 0.01 },
            { metric: 'x', of: ['a'], target: 3, tol: 0.01 },
          ],
        },
        {
          id: 'dimension-alta.ex00.3',
          type: 'manipular',
          prompt:
            'Los vectores $\\vec{u}=(4, 0)$ y $\\vec{v}=(0, 4)$ ya son perpendiculares entre sí. Intenta primero colocar $\\vec{w}$ perpendicular a los dos a la vez, sin que sea el vector nulo: ¿se puede? Luego busca la mejor salida: que $\\vec{w}$ forme $45^\\circ$ con $\\vec{u}$ y también con $\\vec{v}$, y que su primera componente valga $3$. La lectura compara $\\vec{w}$ con $\\vec{u}$; el ángulo con $\\vec{v}$ lo tienes que deducir tú.',
          hints: [
            'El producto escalar de $\\vec{w}$ con $\\vec{u}$ es $4w_1$ y con $\\vec{v}$ es $4w_2$. Mira qué obligaría a valer $0$ a los dos.',
            'Como $\\vec{u}$ y $\\vec{v}$ forman $90^\\circ$, los ángulos de $\\vec{w}$ con ellos suman $90^\\circ$ cuando $\\vec{w}$ está en el primer cuadrante. Si quieres que sean iguales, ¿cuánto vale cada uno?',
          ],
          explain:
            'Ser perpendicular a $\\vec{u}$ obliga a $w_1=0$, y a $\\vec{v}$, a $w_2=0$. Las dos cosas a la vez solo las cumple el vector nulo, que no tiene dirección. Si no se puede ser perpendicular a los dos, lo más repartido es estar a igual ángulo de cada uno.',
          solution:
            '$\\vec{w}=(3, 3)$ forma $45^\\circ$ con $\\vec{u}$ y, por simetría, con $\\vec{v}$: $\\cos\\theta=\\dfrac{12}{4\\cdot3\\sqrt2}=\\dfrac{\\sqrt2}{2}\\approx0{,}71$. En el plano, dos direcciones perpendiculares agotan el espacio y no queda sitio para una tercera: el vector $\\vec{w}$ solo puede repartir su parecido entre las dos. Fíjate en que $0{,}71^2+0{,}71^2\\approx1$.',
          plane: plane(
            [arrow('u', [4, 0], false), arrow('v', [0, 4], false), arrow('w', [1, -2], true)],
            ['components', 'dot', 'cos', 'angle'],
            ['u', 'w'],
          ),
          goals: [
            { metric: 'angle', of: ['u', 'w'], target: 45, tol: 0.01 },
            { metric: 'angle', of: ['v', 'w'], target: 45, tol: 0.01 },
            { metric: 'x', of: ['w'], target: 3, tol: 0.01 },
          ],
        },
        {
          id: 'dimension-alta.ex00.4',
          type: 'manipular',
          prompt:
            'Con el azar y muchas dimensiones, lo normal no será ser perpendicular, sino ser **casi perpendicular**: un coseno cercano a $0$. Mide lo exigente que es eso en el plano. El vector $\\vec{u}$ está fijo en $(5, 0)$. Coloca $\\vec{w}$ con una segunda componente igual a $5$ y un coseno con $\\vec{u}$ de $0{,}2$, es decir, casi perpendicular. Mueve la punta a un lado y a otro y mira lo deprisa que cambia el coseno.',
          hints: [
            'Con $\\vec{u}$ sobre el eje horizontal, el coseno con $\\vec{u}$ es la primera componente de $\\vec{w}$ dividida entre su norma.',
            'Con segunda componente $5$, prueba la primera componente $1$ y mira el coseno.',
          ],
          explain:
            'Un coseno de $0$ es perpendicular, y $0{,}2$ es un ángulo de unos $78{,}5^\\circ$. Con la segunda componente fija en $5$, el coseno solo depende de la primera: empieza por valores pequeños.',
          solution:
            '$\\vec{w}=(1, 5)$: $\\cos\\theta=\\dfrac{5\\cdot1}{5\\cdot\\sqrt{26}}\\approx0{,}196$, casi perpendicular a $\\vec{u}$. Si mueves la punta una casilla a la derecha, el coseno sube a $0{,}37$. Entre todas las direcciones del plano, solo las que tienen un coseno de valor absoluto menor que $0{,}2$ con $\\vec{u}$ forman una franja estrecha: un $13\\,\\%$ del total. En dimensión alta esa franja lo abarcará casi todo.',
          plane: plane(
            [arrow('u', [5, 0], false), arrow('w', [3, 3], true)],
            ['components', 'norm', 'cos', 'angle'],
            ['u', 'w'],
          ),
          goals: [
            { metric: 'cos', of: ['u', 'w'], target: 0.2, tol: 0.02 },
            { metric: 'y', of: ['w'], target: 5, tol: 0.01 },
          ],
        },
        {
          id: 'dimension-alta.ex00.5',
          type: 'manipular',
          prompt:
            'Este mapa es un juguete **inventado** de dos dimensiones, para poder dibujarlo: los embeddings reales tienen cientos de dimensiones. Los conceptos «deporte» $(5, 0)$ y «cocina» $(0, 5)$ son independientes: ocupan los dos ejes y forman $90^\\circ$. Ahora hay que meter un tercer concepto, «música», que no cabe como independiente de los otros dos. Coloca «música» con una similitud coseno de $0{,}6$ con «deporte» y de $0{,}8$ con «cocina». La lectura compara «música» con «deporte»; con «cocina» lo calculas tú.',
          hints: [
            'El coseno de «música» con «deporte», $(5, 0)$, es su primera componente dividida entre su norma; con «cocina», $(0, 5)$, es la segunda componente dividida entre su norma.',
            'Busca componentes con norma entera cuyos cocientes sean $0{,}6$ y $0{,}8$: piensa en el triángulo de lados $3$, $4$ y $5$.',
          ],
          explain:
            'Con dos ejes perpendiculares, los cuadrados de los cosenos de cualquier vector con ellos suman $1$. Así que «música» no puede ser independiente de ambos: si se parece poco a uno, se parece mucho al otro.',
          solution:
            '$\\vec{m}=(3, 4)$ mide $5$: su coseno con «deporte» es $\\dfrac35=0{,}6$ y con «cocina», $\\dfrac45=0{,}8$, y $0{,}6^2+0{,}8^2=1$. Con $n$ ejes perpendiculares, los $n$ cuadrados de los cosenos suman $1$. En el plano, dos ejes se reparten ese $1$ y cada concepto nuevo tiene que parecerse mucho a alguno. En $768$ dimensiones, un vector repartido por igual da $\\cos^2=\\dfrac{1}{768}$, es decir, $\\cos\\approx0{,}036$ con cada eje: sitio de sobra para muchos conceptos casi independientes.',
          plane: plane(
            [
              arrow('deporte', [5, 0], false),
              arrow('cocina', [0, 5], false),
              arrow('musica', [2, 2], true, 'música'),
            ],
            ['components', 'cos', 'angle'],
            ['musica', 'deporte'],
          ),
          goals: [
            { metric: 'cos', of: ['musica', 'deporte'], target: 0.6, tol: 0.01 },
            { metric: 'cos', of: ['musica', 'cocina'], target: 0.8, tol: 0.01 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'dimension-alta.ex01.1',
          type: 'vector',
          prompt:
            'En el plano caben dos vectores perpendiculares entre sí. En $\\mathbb{R}^3$ caben tres: los ejes. Dados $\\vec{u}=(1, 0, 0)$ y $\\vec{v}=(0, 1, 0)$, que son perpendiculares entre sí, halla un vector $\\vec{w}$ de norma $2$ perpendicular a los dos, con la tercera componente positiva.',
          hints: [
            'El producto escalar de $\\vec{w}$ con $\\vec{u}$ es $w_1$, y con $\\vec{v}$ es $w_2$. Los dos tienen que valer $0$.',
            'Con $w_1$ y $w_2$ fijados, solo queda $w_3$. Su valor absoluto es la norma de $\\vec{w}$.',
          ],
          explain:
            'Ser perpendicular a $\\vec{u}$ y a $\\vec{v}$ son dos ecuaciones, y en $\\mathbb{R}^3$ hay tres componentes: queda una libre. En el plano, la segunda ecuación ya no dejaba ninguna.',
          solution:
            '$w_1=0$ y $w_2=0$ por la perpendicularidad, así que $\\vec{w}=(0, 0, w_3)$ y su norma es $\\lvert w_3\\rvert=2$. Con $w_3>0$, $\\vec{w}=(0, 0, 2)$. Es perpendicular a los otros dos: $\\vec{u}\\cdot\\vec{w}=0$ y $\\vec{v}\\cdot\\vec{w}=0$. Ya tienes tres perpendiculares dos a dos en $\\mathbb{R}^3$. Un cuarto no cabe: en $\\mathbb{R}^n$ caben exactamente $n$.',
          answer: [0, 0, 2],
          tol: 0.01,
        },
        {
          id: 'dimension-alta.ex01.2',
          type: 'numero',
          prompt:
            'Dos vectores de $\\mathbb{R}^d$ sorteados al azar (con las componentes normales e independientes) tienen un coseno que vale $0$ en promedio, y cuya desviación típica es aproximadamente $\\dfrac{1}{\\sqrt{d}}$. Cuanto mayor es $d$, más se aprietan los cosenos hacia $0$. Calcula esa desviación típica para $d=400$.',
          hints: [
            'Calcula primero $\\sqrt{400}$.',
            'El resultado es $1$ dividido entre ese número.',
          ],
          explain:
            'La desviación típica del coseno baja con la raíz de $d$, no con $d$. Si tu resultado es mucho más pequeño de lo que esperabas, comprueba que has dividido entre la raíz.',
          solution:
            '$\\dfrac{1}{\\sqrt{400}}=\\dfrac{1}{20}=0{,}05$. Dos desviaciones típicas son $0{,}1$: en $\\mathbb{R}^{400}$, el $95\\,\\%$ de los pares sorteados al azar tienen un coseno entre $-0{,}1$ y $0{,}1$. En el plano ($d=2$), la desviación típica es $\\dfrac{1}{\\sqrt2}\\approx0{,}71$.',
          answer: 0.05,
          tol: 0.002,
        },
        {
          id: 'dimension-alta.ex01.3',
          type: 'numero',
          prompt:
            'Un buscador mide la distancia entre una consulta y cinco documentos en un espacio de muchas dimensiones, y obtiene (valores inventados, típicos de dimensión alta) $30$, $31{,}5$, $32$, $33$ y $31$. Calcula la **razón** entre la distancia máxima y la mínima.',
          hints: [
            'Localiza la distancia mayor y la menor de la lista.',
            'La razón es un cociente: la mayor entre la menor.',
          ],
          explain:
            'La razón compara dos distancias dividiendo, no restando. Si el resultado sale menor que $1$, has dividido al revés.',
          solution:
            'La mayor es $33$ y la menor, $30$: la razón es $\\dfrac{33}{30}=1{,}1$. En el plano suele ser mucho mayor: el documento más cercano está pegado a la consulta y el más lejano, lejísimos. En dimensión alta tiende a $1$: todos los documentos parecen estar casi a la misma distancia de la consulta. Es la **concentración de las distancias**.',
          answer: 1.1,
          tol: 0.01,
        },
        {
          id: 'dimension-alta.ex01.4',
          type: 'opcion',
          prompt:
            'En $\\mathbb{R}^{1000}$ caben exactamente $1000$ vectores no nulos perpendiculares dos a dos. Si se pide solo que sean **casi perpendiculares** (que todos los pares tengan un coseno de valor absoluto menor que $0{,}2$), ¿cuántos caben?',
          hints: [
            'En $\\mathbb{R}^{1000}$, la desviación típica del coseno de dos vectores al azar es $\\dfrac{1}{\\sqrt{1000}}\\approx0{,}032$. Compara con $0{,}2$.',
            'Si casi cualquier pareja sorteada al azar cumple la condición, un grupo grande sorteado al azar también la cumple.',
          ],
          explain:
            'Perpendicular exacto es una condición muy rígida, y casi perpendicular es mucho más flexible. Piensa en cuántas desviaciones típicas hay entre $0{,}2$ y el coseno típico de dos vectores al azar.',
          solution:
            'Un coseno de $0{,}2$ está a unas $6$ desviaciones típicas de $0$, así que una pareja al azar lo supera con una probabilidad del orden de una entre varios miles de millones. Con $10\\,000$ vectores al azar hay unos $50$ millones de parejas y, con cuentas aproximadas, es casi seguro que ninguna incumple la condición. Caben muchísimos más que $1000$. El límite de $n$ vectores solo vale si se exige perpendicular exacto.',
          options: [
            'Ninguno: en dimensión alta todo se parece',
            'Como máximo $1000$, igual que los perpendiculares',
            'Muchos más que $1000$: basta sortear vectores al azar',
            'Exactamente $1000$, si son unitarios',
          ],
          correct: 2,
        },
        {
          id: 'dimension-alta.ex01.5',
          type: 'opcion',
          prompt:
            'Un modelo produce embeddings de $768$ dimensiones, como BERT-base. Dos textos tienen una similitud coseno de $0{,}3$. Dos vectores de $\\mathbb{R}^{768}$ sorteados al azar tendrían un coseno con desviación típica $\\dfrac{1}{\\sqrt{768}}\\approx0{,}036$. ¿Qué indica la similitud de $0{,}3$?',
          hints: [
            'Divide el coseno observado entre la desviación típica del azar, $0{,}036$: así sabes a cuántas desviaciones del azar está.',
            'Un valor a muchas desviaciones típicas de lo que da el azar no suele ser casualidad.',
          ],
          explain:
            'El mismo número significa cosas distintas según la dimensión. Un coseno de $0{,}3$ no se interpreta solo, sino frente a lo que daría el azar en esa dimensión.',
          solution:
            '$\\dfrac{0{,}3}{0{,}036}\\approx8{,}3$: la similitud observada está a más de $8$ desviaciones típicas del coseno de dos vectores al azar, y eso no pasa por casualidad: los dos textos comparten algo. En el plano, un coseno de $0{,}3$ sería lo más corriente (la desviación típica es $0{,}71$). Los embeddings reales no son vectores al azar, así que $\\dfrac{1}{\\sqrt{d}}$ es un punto de referencia, no una ley.',
          options: [
            'Es una similitud baja: los textos no tienen nada en común',
            'Es compatible con el azar: en dimensión alta cualquier coseno es ruido',
            'No se puede interpretar: el coseno no tiene sentido en dimensión alta',
            'Está a más de $8$ desviaciones típicas del azar: parece señal y no casualidad',
          ],
          correct: 3,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'dimension-alta.ex02.1',
          type: 'codigo',
          prompt:
            'Para medir el azar hay que fabricarlo, y que sea el mismo en cada ejecución. Con `rng = np.random.default_rng(0)`, el generador `rng` da siempre los mismos números (la **semilla** `0` fija el punto de partida), y `rng.normal(size=d)` devuelve un array de `d` números al azar, positivos y negativos, centrados en $0$. Un **bucle** `for _ in range(n):` repite `n` veces su cuerpo, que va sangrado. `lista.append(x)` añade `x` al final de una lista y `np.array(lista)` la convierte en array.\n\nCompleta la función `cosenos(d, n)` para que devuelva un array con los cosenos de `n` parejas de vectores al azar de $\\mathbb{R}^d$. El generador `rng` ya está creado.',
          hints: [
            'En cada vuelta del bucle, crea dos vectores con `rng.normal(size=d)` y calcula su coseno: el producto escalar entre el producto de las normas.',
            'Guarda cada coseno en una lista con `append` y devuelve `np.array` de esa lista al final, con la sangría de fuera del bucle.',
          ],
          explain:
            'Cada pareja necesita vectores nuevos: si los creas fuera del bucle, los `n` cosenos serán el mismo número. Y los números al azar tienen que poder ser negativos, porque si todos son positivos, los vectores apuntan al mismo lado y el coseno no sale cerca de $0$.',
          solution:
            'Dentro del bucle, `a = rng.normal(size=d)` y `b = rng.normal(size=d)` crean la pareja, y `res.append(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))` guarda su coseno; al final, `return np.array(res)`, con `res = []` antes del bucle. Con `d = 2`, los cosenos se reparten por todo el intervalo de $-1$ a $1$; con `d = 100`, casi todos quedan entre $-0{,}2$ y $0{,}2$.',
          starter: `import numpy as np

rng = np.random.default_rng(0)


def cosenos(d, n):
    # Devuelve un array con los cosenos de n parejas de vectores al azar de R^d
    return None
`,
          checks: `def _llamar(d, n):
    try:
        r = cosenos(d, n)
    except BaseException:
        return None
    try:
        r = np.asarray(r, dtype=float)
    except BaseException:
        return None
    if r.ndim != 1 or r.size != n or not np.all(np.isfinite(r)):
        return None
    return r


_a = _llamar(100, 2000)
_b = _llamar(2, 2000)
_hay = _a is not None and _b is not None
_rango = _hay and bool(np.all(np.abs(_a) <= 1 + 1e-9)) and bool(np.all(np.abs(_b) <= 1 + 1e-9))
_media = _rango and abs(np.mean(_a)) < 0.1 and abs(np.mean(_b)) < 0.15
_desv = _media and 0.085 < np.std(_a) < 0.115 and 0.6 < np.std(_b) < 0.8
check(_hay, "\`cosenos(d, n)\` tiene que devolver un array con \`n\` números, uno por pareja. Prueba con \`cosenos(100, 2000)\`: si no devuelve nada, falta el \`return\`; si da un error, revisa el bucle y la fórmula.")
check((not _hay) or _rango, "Algún valor de tu array se sale del intervalo de -1 a 1, y un coseno nunca lo hace. Divide el producto escalar entre el producto de las dos normas, sin dejarte ninguna.")
check((not _rango) or _media, "Los cosenos de tus parejas no se centran en 0: los vectores tienen componentes de un solo signo, o salen todos iguales. Usa \`rng.normal(size=d)\`, que da números positivos y negativos, y crea vectores nuevos en cada vuelta del bucle.")
check((not _media) or _desv, "La dispersión de tus cosenos no es la esperada: con d = 100 la desviación típica tiene que rondar 0,1, y con d = 2, 0,71. Comprueba que los vectores son de d componentes y que cada pareja es nueva.")
`,
          reference: `import numpy as np

rng = np.random.default_rng(0)


def cosenos(d, n):
    res = []
    for _ in range(n):
        a = rng.normal(size=d)
        b = rng.normal(size=d)
        res.append(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
    return np.array(res)
`,
        },
        {
          id: 'dimension-alta.ex02.2',
          type: 'codigo',
          prompt:
            'La desviación típica del coseno de dos vectores al azar de $\\mathbb{R}^d$ es $\\dfrac{1}{\\sqrt{d}}$. Compruébalo con números. `np.std(x)` calcula la desviación típica de los números de `x`, y `np.sqrt` aplicada a un array calcula la raíz de cada elemento. La función `cosenos(d, n)` de la pregunta anterior ya está escrita, y `dims` guarda cuatro dimensiones. Guarda en `sd` un array con la desviación típica de `2000` cosenos para cada `d` de `dims`, y en `teoria` otro con el valor $\\dfrac{1}{\\sqrt{d}}$ de cada una, en el mismo orden.',
          hints: [
            '`sd` sale de una lista con un elemento por cada `d` de `dims`, que se puede escribir con un bucle o con `[... for d in dims]`, y después `np.array`.',
            '`teoria` no necesita bucle: la raíz de los cuatro valores de `dims` a la vez, y 1 dividido entre ese array.',
          ],
          explain:
            'Los dos arrays tienen que parecerse mucho. Si no es así, o has dividido entre $d$ en lugar de entre su raíz en `teoria`, o `sd` sale de pocos cosenos. Con $d=2$, la teoría da $0{,}71$.',
          solution:
            '`sd = np.array([np.std(cosenos(d, 2000)) for d in dims])` y `teoria = 1 / np.sqrt(dims)`. La teoría vale $0{,}71$; $0{,}32$; $0{,}10$ y $0{,}032$, y lo medido casi coincide: $0{,}71$; $0{,}32$; $0{,}099$ y $0{,}031$. Cada vez que $d$ se multiplica por $10$, la desviación típica se divide entre $\\sqrt{10}\\approx3{,}16$.',
          starter: `import numpy as np

rng = np.random.default_rng(0)


def cosenos(d, n):
    res = []
    for _ in range(n):
        a = rng.normal(size=d)
        b = rng.normal(size=d)
        res.append(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
    return np.array(res)


dims = np.array([2, 10, 100, 1000])
# Calcula sd, la desviación típica de 2000 cosenos para cada d de dims, y teoria, el valor 1 / raíz de d
sd = None
teoria = None
`,
          checks: `def _cuatro(x):
    if not isinstance(x, (np.ndarray, list, tuple)):
        return None
    try:
        r = np.asarray(x, dtype=float)
    except BaseException:
        return None
    if r.ndim != 1 or r.size != 4 or not np.all(np.isfinite(r)):
        return None
    return r


_d = np.array([2, 10, 100, 1000])
_sd = _cuatro(sd)
_te = _cuatro(teoria)
_teok = _te is not None and np.allclose(_te, 1 / np.sqrt(_d))
_sdok = _sd is not None and bool(np.all(np.abs(_sd * np.sqrt(_d) - 1) < 0.2))
check(_sd is not None, "\`sd\` tiene que ser un array o una lista con 4 números, uno por cada valor de \`dims\`.")
check(_te is not None, "\`teoria\` tiene que ser un array o una lista con 4 números, uno por cada valor de \`dims\`.")
check((_te is None) or _teok or np.allclose(_te, 1 / _d), "\`teoria\` no vale 1 entre la raíz de cada d. Con d = 2 tiene que dar 0,71, y con d = 1000, 0,032.")
check((_te is None) or not np.allclose(_te, 1 / _d), "\`teoria\` vale 1 / d: has dividido entre d y no entre su raíz. Con d = 100 tiene que dar 0,1 y no 0,01.")
check((_sd is None) or _sdok or np.allclose(_sd, 1 / _d, rtol=0.3), "\`sd\` no se parece a 1 / raíz de d. Calcula con \`np.std\` la desviación típica de 2000 cosenos de \`cosenos(d, 2000)\` para cada d, no de uno solo.")
check((_sd is None) or not np.allclose(_sd, 1 / _d, rtol=0.3), "\`sd\` vale 1 / d: es la varianza de los cosenos, no su desviación típica. La desviación típica es su raíz cuadrada; \`np.std\` la da directamente.")
`,
          reference: `import numpy as np

rng = np.random.default_rng(0)


def cosenos(d, n):
    res = []
    for _ in range(n):
        a = rng.normal(size=d)
        b = rng.normal(size=d)
        res.append(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
    return np.array(res)


dims = np.array([2, 10, 100, 1000])
sd = np.array([np.std(cosenos(d, 2000)) for d in dims])
teoria = 1 / np.sqrt(dims)
`,
        },
        {
          id: 'dimension-alta.ex02.3',
          type: 'codigo',
          prompt:
            'Un **histograma** cuenta cuántos valores caen en cada tramo. `plt.hist(x, bins=40, range=(-1, 1), alpha=0.6, label="d = 2")` dibuja el histograma de `x` con 40 tramos entre $-1$ y $1$, semitransparente (`alpha`) para poder superponer otro, y con una etiqueta; `plt.legend()` muestra las etiquetas y `plt.xlabel` y `plt.ylabel` ponen el título de cada eje. La función `cosenos(d, n)` ya está escrita y `plt` ya está importado. Dibuja en una misma figura dos histogramas: los cosenos de `2000` parejas de vectores al azar de $\\mathbb{R}^2$ y los de `2000` parejas de $\\mathbb{R}^{1000}$.',
          hints: [
            'Una llamada a `plt.hist` por dimensión, con la misma `range` en las dos para que los tramos coincidan.',
            'Cada llamada recibe como datos `cosenos(d, 2000)` con su `d`, y su propio `label`.',
          ],
          explain:
            'Compara las dos formas: con $d=2$ los cosenos se reparten por todo el intervalo, y con $d=1000$ se amontonan junto a $0$. Si solo ves un histograma, o los dos iguales, revisa los datos que le pasas a cada llamada.',
          solution:
            '`plt.hist(cosenos(2, 2000), bins=40, range=(-1, 1), alpha=0.6, label="d = 2")` y otra igual con `cosenos(1000, 2000)` y `label="d = 1000"`, más los títulos de los ejes y la leyenda. El de $d=2$ es casi plano, con más altura en los extremos, porque un ángulo al azar da cosenos de todos los tamaños. El de $d=1000$ es una campana estrecha de desviación típica $0{,}032$: casi todos los cosenos están entre $-0{,}1$ y $0{,}1$. En dimensión alta, dos direcciones al azar son casi siempre casi perpendiculares.',
          starter: `import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng(0)


def cosenos(d, n):
    res = []
    for _ in range(n):
        a = rng.normal(size=d)
        b = rng.normal(size=d)
        res.append(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
    return np.array(res)


# Dibuja los histogramas de los cosenos de 2000 parejas en d = 2 y en d = 1000, en la misma figura
`,
          checks: `_fig = len(plt.get_fignums()) > 0
check(_fig, "No hay ninguna figura: dibuja los histogramas con \`plt.hist\`.")


def _desv(c):
    h = np.array([p.get_height() for p in c.patches], dtype=float)
    x = np.array([p.get_x() + p.get_width() / 2 for p in c.patches], dtype=float)
    if h.size == 0 or h.sum() <= 0:
        return None
    m = np.sum(h * x) / h.sum()
    return float(np.sqrt(np.sum(h * (x - m) ** 2) / h.sum()))


_cont = [c for ax in plt.gcf().axes for c in ax.containers if hasattr(c, "patches")] if _fig else []
_sds = [s for s in (_desv(c) for c in _cont) if s is not None]
check((not _fig) or len(_sds) >= 2, "En la figura hay menos de dos histogramas. Haz una llamada a \`plt.hist\` para d = 2 y otra para d = 1000, en la misma figura.")
_ancho = any(0.55 < s < 0.85 for s in _sds)
_fino = any(s < 0.1 for s in _sds)
check((not _fig) or len(_sds) < 2 or _ancho, "No veo el histograma de d = 2: sus cosenos se reparten por todo el intervalo de -1 a 1, con una desviación típica de 0,71. Comprueba que lo dibujas con los cosenos de \`cosenos(2, 2000)\`.")
check((not _fig) or len(_sds) < 2 or _fino, "No veo el histograma de d = 1000: sus cosenos se amontonan cerca de 0, con una desviación típica de 0,03. Comprueba que lo dibujas con los cosenos de \`cosenos(1000, 2000)\`.")
`,
          reference: `import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng(0)


def cosenos(d, n):
    res = []
    for _ in range(n):
        a = rng.normal(size=d)
        b = rng.normal(size=d)
        res.append(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
    return np.array(res)


plt.hist(cosenos(2, 2000), bins=40, range=(-1, 1), alpha=0.6, label="d = 2")
plt.hist(cosenos(1000, 2000), bins=40, range=(-1, 1), alpha=0.6, label="d = 1000")
plt.xlabel("coseno")
plt.ylabel("parejas")
plt.legend()
`,
        },
        {
          id: 'dimension-alta.ex02.4',
          type: 'codigo',
          prompt:
            'Un buscador por distancia quiere que el vecino más cercano de la consulta `q` esté claramente más cerca que el más lejano. Para medirlo, usa la **razón** entre la mayor y la menor de las distancias de `q` a los puntos. Para cada `d` de `dims`, crea `P = rng.normal(size=(500, d))`, `500` puntos al azar (uno por fila), y una consulta `q = rng.normal(size=d)`. La distancia de `q` a cada fila de `P` es `np.linalg.norm(P - q, axis=1)`, un array con `500` distancias, y `.max()` y `.min()` dan la mayor y la menor. Guarda en `razon` una lista con las cuatro razones, una por cada `d` de `dims`, en ese orden.',
          hints: [
            'Un bucle `for d in dims:` que, en cada vuelta, crea `P` y `q`, calcula las distancias y añade la razón a una lista con `append`.',
            'La razón es la mayor distancia dividida entre la menor, y nunca baja de $1$.',
          ],
          explain:
            'Cada `d` necesita sus propios puntos y su propia consulta, porque sus vectores tienen otro tamaño. Mira cómo cambia la razón al crecer `d`: es justo lo que quieres medir.',
          solution:
            'Con `razon = []` antes del bucle y, en cada vuelta, `P = rng.normal(size=(500, d))`, `q = rng.normal(size=d)`, `dist = np.linalg.norm(P - q, axis=1)` y `razon.append(dist.max() / dist.min())`. Con la semilla `0` salen unas razones de $104$; $3{,}6$; $1{,}4$ y $1{,}12$. En el plano, el punto más cercano está pegado y el más lejano, lejos. En $d=1000$, los `500` puntos están casi a la misma distancia de la consulta, y el «más cercano» apenas se distingue: un pequeño ruido en los datos cambia quién gana. Es la **maldición de la dimensión** para los índices vectoriales.',
          starter: `import numpy as np

rng = np.random.default_rng(0)

dims = [2, 10, 100, 1000]
# Calcula razon, una lista con la razón entre la mayor y la menor distancia a la consulta para cada d de dims
razon = None
`,
          checks: `def _cuatro(x):
    if not isinstance(x, (np.ndarray, list, tuple)):
        return None
    try:
        r = np.asarray(x, dtype=float)
    except BaseException:
        return None
    if r.ndim != 1 or r.size != 4 or not np.all(np.isfinite(r)):
        return None
    return r


_r = _cuatro(razon)
_mayor = _r is not None and bool(np.all(_r >= 1 - 1e-9))
_unos = _mayor and bool(np.allclose(_r, 1))
_forma = _mayor and not _unos and _r[0] > 5 and _r[3] < 1.3 and bool(np.all(np.diff(_r) < 0))
check(_r is not None, "\`razon\` tiene que ser una lista o un array con 4 números, uno por cada valor de \`dims\`.")
check((_r is None) or _mayor, "Alguna razón es menor que 1, y la mayor distancia dividida entre la menor nunca baja de 1. Has dividido al revés: la menor entre la mayor.")
check((not _mayor) or not _unos, "Todas las razones valen 1. Eso pasa si calculas un único número en lugar de una distancia por cada punto: la distancia de \`q\` a cada fila de \`P\`, un array de 500 valores.")
check((not _mayor) or _unos or _forma, "Las razones no bajan al subir d como deberían: de decenas con d = 2 a cerca de 1 con d = 1000. Comprueba que cada d tiene sus 500 puntos y su consulta, y que la razón es un cociente de la mayor distancia entre la menor.")
`,
          reference: `import numpy as np

rng = np.random.default_rng(0)

dims = [2, 10, 100, 1000]
razon = []
for d in dims:
    P = rng.normal(size=(500, d))
    q = rng.normal(size=d)
    dist = np.linalg.norm(P - q, axis=1)
    razon.append(dist.max() / dist.min())
`,
        },
        {
          id: 'dimension-alta.ex02.5',
          type: 'codigo',
          prompt:
            'En el plano, solo un pequeño porcentaje de las parejas de vectores son casi perpendiculares. ¿Y en más dimensiones? Mídelo con vectores al azar, inventados, de $\\mathbb{R}^d$ (los embeddings reales tienen cientos de dimensiones). Para cada `d` de `dims`, crea `E = rng.normal(size=(300, d))`, una matriz con `300` vectores, uno por fila, y divide cada fila entre su norma con `E / np.linalg.norm(E, axis=1, keepdims=True)`: así cada fila mide $1$ y los productos escalares son cosenos. `E @ E.T` es la matriz `C` de `300` por `300` con el coseno de cada fila con cada fila. `np.triu_indices(300, k=1)` da las posiciones `i`, `j` de las parejas distintas (`i` menor que `j`), de modo que `C[i, j]` tiene una vez cada pareja. `np.abs` da el valor absoluto y `np.mean(x < 0.2)` es la fracción de elementos de `x` menores que `0.2`. Guarda en `frac` una lista con la fracción de parejas con un coseno de valor absoluto menor que `0.2`, una por cada `d` de `dims`.',
          hints: [
            'Un bucle `for d in dims:` que crea `E`, la normaliza, calcula `C = E @ E.T`, toma `C[i, j]` y añade la fracción a una lista.',
            'La condición es sobre el valor absoluto del coseno: un coseno de $-0{,}9$ está muy lejos de ser casi perpendicular.',
          ],
          explain:
            'Hay que contar parejas con un coseno cerca de $0$ por los dos lados, así que se compara el valor absoluto. Y se pide una fracción entre $0$ y $1$, no un recuento: mira que el resultado crece con `d`.',
          solution:
            'Con `frac = []` antes del bucle y, en cada vuelta, `E = rng.normal(size=(300, d))`, `E = E / np.linalg.norm(E, axis=1, keepdims=True)`, `C = E @ E.T`, `i, j = np.triu_indices(300, k=1)` y `frac.append(np.mean(np.abs(C[i, j]) < 0.2))`. Con la semilla `0` salen unas fracciones de $0{,}13$; $0{,}44$; $0{,}84$ y $1$. En el plano, solo el $13\\,\\%$ de las parejas son casi perpendiculares. Con $d=500$ lo son todas. Por eso los embeddings tienen cientos o miles de dimensiones: hay sitio para muchísimos conceptos casi independientes, aunque solo $d$ sean exactamente perpendiculares.',
          starter: `import numpy as np

rng = np.random.default_rng(0)

dims = [2, 10, 50, 500]
# Calcula frac, una lista con la fracción de parejas casi perpendiculares (valor absoluto del coseno menor que 0.2) para cada d de dims
frac = None
`,
          checks: `def _cuatro(x):
    if not isinstance(x, (np.ndarray, list, tuple)):
        return None
    try:
        r = np.asarray(x, dtype=float)
    except BaseException:
        return None
    if r.ndim != 1 or r.size != 4 or not np.all(np.isfinite(r)):
        return None
    return r


_f = _cuatro(frac)
_esp = np.array([0.13, 0.44, 0.84, 1.0])
_rango = _f is not None and bool(np.all((_f >= 0) & (_f <= 1)))
_sin_norm = _rango and _f[1] < 0.15 and _f[2] < 0.15 and _f[3] < 0.15
_sin_abs = _rango and _f[0] > 0.4 and _f[3] > 0.9
_bien = _rango and bool(np.all(np.abs(_f - _esp) < 0.05))
check(_f is not None, "\`frac\` tiene que ser una lista o un array con 4 números, una fracción por cada valor de \`dims\`.")
check((_f is None) or _rango, "\`frac\` tiene números fuera del intervalo de 0 a 1, así que no son fracciones. Divide el número de parejas casi perpendiculares entre el total, por ejemplo con \`np.mean\` sobre la condición.")
check((not _rango) or not _sin_norm, "\`frac\` sale casi 0 en dimensión alta: parece que los productos escalares no son cosenos. Divide cada fila de \`E\` entre su norma antes de calcular \`E @ E.T\`.")
check((not _rango) or not _sin_abs, "\`frac\` sale muy grande hasta en el plano: estás contando también los cosenos muy negativos. La condición es sobre el valor absoluto del coseno, con \`np.abs\`.")
check((not _rango) or _sin_norm or _sin_abs or _bien, "\`frac\` no es la esperada. Con d = 2 tiene que rondar 0,13 y con d = 500, 1. Comprueba que usas 300 vectores por cada d, que los normalizas y que cuentas parejas distintas con el valor absoluto del coseno.")
`,
          reference: `import numpy as np

rng = np.random.default_rng(0)

dims = [2, 10, 50, 500]
frac = []
for d in dims:
    E = rng.normal(size=(300, d))
    E = E / np.linalg.norm(E, axis=1, keepdims=True)
    C = E @ E.T
    i, j = np.triu_indices(300, k=1)
    frac.append(np.mean(np.abs(C[i, j]) < 0.2))
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'dimension-alta.hoja.1',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento decide si un coseno de $0{,}08$ entre dos embeddings de $400$ dimensiones es señal o ruido. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Recuerda la desviación típica del coseno de dos vectores al azar de $\\mathbb{R}^d$ y compárala con la que se usa en la segunda línea.',
        'Calcula $\\sqrt{400}$ y mira si el resultado de la segunda línea cuadra con él.',
      ],
      explain:
        'Piensa qué desviación típica toca usar con $d=400$ y cómo se calcula. Después, revisa si las conclusiones que vienen detrás se siguen de ese número.',
      solution:
        'La segunda línea está mal: la desviación típica es $\\dfrac{1}{\\sqrt{d}}=\\dfrac{1}{20}=0{,}05$ y no $\\dfrac1d$. Con la correcta, un coseno de $0{,}08$ son solo $1{,}6$ desviaciones típicas, algo corriente en el azar: no es señal. El error cambia la conclusión.',
      lines: [
        'Con d = 400, entre dos vectores al azar el coseno tiene media 0 y desviación típica 1/√d',
        'σ = 1/400 = 0,0025',
        'El coseno observado, 0,08, está a 0,08 / 0,0025 = 32 desviaciones típicas',
        'A 32 desviaciones típicas el azar no lo explica: los dos embeddings comparten algo',
      ],
      faultyLine: 1,
    },
    {
      id: 'dimension-alta.hoja.2',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien sortea dos vectores al azar de $\\mathbb{R}^{1000}$, con componentes positivas y negativas en torno a $0$, y calcula su coseno, que espera cerca de $0$ (NumPy ya está importado como `np`). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Piensa qué rango de números devuelve `rng.random`.',
        'Si todas las componentes de los dos vectores son positivas, ¿hacia dónde apuntan los dos?',
      ],
      explain:
        'Mira de dónde salen los números de cada vector y compáralos con lo que pide el enunciado. Después, comprueba si el coseno puede salir cerca de $0$ con esos números.',
      solution:
        'La segunda línea está mal: `rng.random` devuelve números entre $0$ y $1$, todos positivos. Con dos vectores así, el producto escalar es positivo y el coseno sale cerca de $0{,}75$, lejos de $0$. Para componentes positivas y negativas en torno a $0$ hay que usar `rng.normal(size=1000)`, en las dos líneas.',
      lines: [
        'rng = np.random.default_rng(0)',
        'a = rng.random(1000)',
        'b = rng.random(1000)',
        'c = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))',
      ],
      faultyLine: 1,
    },
    {
      id: 'dimension-alta.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula cuánto se parecen entre sí las distancias entre puntos al azar de $\\mathbb{R}^{1000}$ con componentes normales. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Comprueba cada cuenta: la diferencia de dos componentes y el cuadrado de la distancia.',
        'Calcula $\\sqrt{2000}$ y la razón entre los extremos que se dan al final.',
      ],
      explain:
        'Revisa cada paso: ¿de dónde sale la media del cuadrado de la distancia? ¿La raíz está bien calculada? ¿La conclusión sigue de los números anteriores?',
      solution:
        'No hay ningún error. La diferencia de dos componentes normales e independientes tiene varianza $2$, así que el cuadrado de la distancia vale $2d=2000$ de media, y la distancia típica, $\\sqrt{2000}\\approx44{,}7$. Como las distancias varían solo en torno a $\\pm1$, entre $42$ y $47$, la razón es $\\dfrac{47}{42}\\approx1{,}12$: todos los puntos están casi a la misma distancia.',
      lines: [
        'La diferencia de dos componentes normales independientes tiene varianza 1 + 1 = 2',
        'El cuadrado de la distancia es la suma de 1000 términos, y vale 2 · 1000 = 2000 de media',
        'La distancia típica es √2000 ≈ 44,7, y varía solo en torno a ±1',
        'Entre distancias de 42 y 47 la razón máx/mín es 47 / 42 ≈ 1,12: casi todo está igual de lejos',
      ],
      faultyLine: null,
    },
  ],
};
