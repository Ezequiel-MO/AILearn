import type { PlaneSpec, PlaneVector, Project } from '../../content/schema';
import { analogiasWarmup } from './analogias.calentamiento';

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

/** Bloque de código Python para una pista, una línea por argumento. */
const py = (...lines: string[]): string => ['```python', ...lines, '```'].join('\n');

/** Segundo proyecto de la Órbita 3: aritmética con significados, a − b + c y relaciones como diferencias. */
export const analogias: Project = {
  id: 'analogias',
  name: 'Analogías',
  sub: 'Aritmética con significados',
  warmup: analogiasWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'analogias.ex00.1',
          type: 'manipular',
          prompt:
            'Una **analogía** («rey es a hombre como… es a mujer») se resuelve con aritmética de vectores: $\\vec{w}=\\vec{a}-\\vec{b}+\\vec{c}$. Con los embeddings de word2vec (2013) se hizo famoso que rey − hombre + mujer cae cerca de «reina». Este mapa es un juguete **inventado** de dos dimensiones, para poder dibujarlo: los embeddings reales tienen cientos de dimensiones.\n\nLas tres palabras están fijas: «hombre» en $(1, 1)$, «mujer» en $(1, 3)$ y «rey» en $(4, 1)$. Coloca $\\vec{w}$ en $\\text{rey}-\\text{hombre}+\\text{mujer}$, calculándolo componente a componente. La lectura de la distancia mide $\\vec{w}$ respecto de «rey».',
          hints: [
            'Haz la operación en cada eje por separado, primero $x$ y luego $y$, respetando el signo de cada palabra.',
            'La distancia de $\\vec{w}$ a «rey» tiene que ser la longitud de $\\text{mujer}-\\text{hombre}$: es lo que se le suma a «rey».',
          ],
          explain:
            'En la analogía se parte de «rey» y se recorre el camino que lleva de «hombre» a «mujer». Comprueba tu posición con esa condición: $\\vec{w}-\\text{rey}$ tiene que ser igual a $\\text{mujer}-\\text{hombre}$.',
          solution:
            '$\\vec{w}=\\text{rey}-\\text{hombre}+\\text{mujer}=(4, 1)-(1, 1)+(1, 3)=(3, 0)+(1, 3)=(4, 3)$. Es justo donde estaría «reina» en este mapa inventado. En un modelo real el resultado no cae exactamente sobre ninguna palabra: lo que se hace después es buscar la palabra más cercana.',
          plane: plane(
            [
              arrow('hombre', [1, 1], false),
              arrow('mujer', [1, 3], false),
              arrow('rey', [4, 1], false),
              arrow('w', [0, 0], true),
            ],
            ['components', 'distance'],
            ['w', 'rey'],
          ),
          goals: [
            { metric: 'x', of: ['w'], target: 4, tol: 0.01 },
            { metric: 'y', of: ['w'], target: 3, tol: 0.01 },
          ],
        },
        {
          id: 'analogias.ex00.2',
          type: 'manipular',
          prompt:
            'Si $\\vec{w}=\\vec{a}-\\vec{b}+\\vec{c}$, sumando $\\vec{b}$ a los dos lados queda $\\vec{w}+\\vec{b}=\\vec{a}+\\vec{c}$. Los cuatro puntos forman un **paralelogramo** y esas dos sumas son sus diagonales, que comparten el punto medio.\n\nMapa de juguete **inventado** de dos dimensiones (los reales tienen cientos): «Italia» en $(1, 1)$, «Roma» en $(3, 2)$ y «Alemania» en $(-3, 2)$, fijas. Aplica a Alemania lo que va de Italia a Roma: coloca «Berlín» para que $\\text{Berlín}+\\text{Italia}$ valga lo mismo que $\\text{Roma}+\\text{Alemania}$, que tienes que calcular. La lectura de la suma dibuja $\\text{Berlín}+\\text{Italia}$.',
          hints: [
            'Suma «Roma» y «Alemania» componente a componente: ese es el valor que tiene que alcanzar la lectura de la suma.',
            'Si $\\text{Berlín}+\\text{Italia}$ vale lo que has calculado, ¿cuánto vale «Berlín» en cada eje?',
          ],
          explain:
            'La lectura de la suma te deja ver el punto medio común de las dos diagonales. Cuando coincide con el de «Roma» y «Alemania», «Berlín» es el cuarto vértice del paralelogramo.',
          solution:
            '$\\text{Roma}+\\text{Alemania}=(3, 2)+(-3, 2)=(0, 4)$, así que $\\text{Berlín}=(0, 4)-(1, 1)=(-1, 3)$. Es lo mismo que $\\text{Roma}-\\text{Italia}+\\text{Alemania}=(2, 1)+(-3, 2)=(-1, 3)$: la flecha $(2, 1)$ lleva de Italia a Roma y, aplicada a Alemania, lleva a Berlín.',
          plane: plane(
            [
              arrow('italia', [1, 1], false, 'Italia'),
              arrow('roma', [3, 2], false, 'Roma'),
              arrow('alemania', [-3, 2], false, 'Alemania'),
              arrow('berlin', [0, 0], true, 'Berlín'),
            ],
            ['components', 'sum'],
            ['berlin', 'italia'],
          ),
          goals: [
            { metric: 'sum_x', of: ['berlin', 'italia'], target: 0, tol: 0.01 },
            { metric: 'sum_y', of: ['berlin', 'italia'], target: 4, tol: 0.01 },
          ],
        },
        {
          id: 'analogias.ex00.3',
          type: 'manipular',
          prompt:
            'Una **relación** entre dos palabras es un vector, su diferencia: «femenino de» es $\\vec{d}=\\text{mujer}-\\text{hombre}$. Si el modelo ha captado bien esa relación, la misma flecha lleva de «rey» a «reina».\n\nMapa de juguete **inventado** de dos dimensiones (los reales tienen cientos): «hombre» en $(1, -1)$, «mujer» en $(2, 2)$, «rey» en $(-3, -2)$ y «reina» en $(-2, 1)$, fijas. Coloca $\\vec{d}$ de modo que $\\text{hombre}+\\vec{d}$ caiga en «mujer» y $\\text{rey}+\\vec{d}$ caiga en «reina». La lectura de la suma dibuja $\\text{hombre}+\\vec{d}$; la de «rey» la compruebas con las componentes.',
          hints: [
            'Para que $\\text{hombre}+\\vec{d}$ caiga en «mujer», $\\vec{d}$ tiene que ser lo que falta para llegar de una palabra a la otra: calcúlalo en cada eje.',
            'Con esa $\\vec{d}$, suma «rey» y mira si llegas a «reina».',
          ],
          explain:
            'Una relación no es un punto sino una diferencia: depende de dos palabras a la vez. Que la misma flecha sirva para las dos parejas quiere decir que las cuatro palabras forman un paralelogramo.',
          solution:
            '$\\vec{d}=\\text{mujer}-\\text{hombre}=(2, 2)-(1, -1)=(1, 3)$. Con la misma flecha, $\\text{rey}+\\vec{d}=(-3, -2)+(1, 3)=(-2, 1)$, que es «reina». En este mapa inventado la relación se cumple exacta; en un modelo real solo se cumple de forma aproximada.',
          plane: plane(
            [
              arrow('hombre', [1, -1], false),
              arrow('mujer', [2, 2], false),
              arrow('rey', [-3, -2], false),
              arrow('reina', [-2, 1], false),
              arrow('d', [1, 1], true),
            ],
            ['components', 'sum'],
            ['d', 'hombre'],
          ),
          goals: [
            { metric: 'sum_x', of: ['d', 'hombre'], target: 2, tol: 0.01 },
            { metric: 'sum_y', of: ['d', 'hombre'], target: 2, tol: 0.01 },
            { metric: 'sum_x', of: ['d', 'rey'], target: -2, tol: 0.01 },
            { metric: 'sum_y', of: ['d', 'rey'], target: 1, tol: 0.01 },
          ],
        },
        {
          id: 'analogias.ex00.4',
          type: 'manipular',
          prompt:
            'Tras la aritmética hay que **buscar** la palabra más cercana al resultado, y se hace por coseno: $\\cos\\theta=\\dfrac{\\vec{u}\\cdot\\vec{v}}{\\lVert\\vec{u}\\rVert\\,\\lVert\\vec{v}\\rVert}$, que solo mira la dirección.\n\nMapa de juguete **inventado** de dos dimensiones (los reales tienen cientos): el resultado de rey − hombre + mujer es $(4, 3)$, justo donde está «reina», fija. Coloca $\\vec{w}$ con coseno $1$ con «reina» pero a la **mitad** de su longitud. La rejilla es de $0{,}5$ en $0{,}5$.',
          hints: [
            'La norma de «reina» sale de Pitágoras con la terna $3, 4, 5$: la mitad de su longitud es $2{,}5$.',
            'Un vector y cualquier múltiplo positivo suyo apuntan igual: divide las dos componentes de «reina» entre el mismo número.',
          ],
          explain:
            'Acortar un vector sin girarlo no cambia el coseno con ninguna otra palabra. Por eso, normalizar el resultado de la analogía antes de buscar no altera la palabra más cercana.',
          solution:
            '$\\vec{w}=(2;\\ 1{,}5)$: su norma es $\\sqrt{4+2{,}25}=2{,}5$, la mitad de la de «reina», y su coseno con «reina» es $1$. Multiplicar $\\vec{w}$ por cualquier $k>0$ no cambia su coseno con ninguna palabra, así que el orden de las palabras más cercanas es el mismo con el resultado sin normalizar, normalizado o a la mitad.',
          plane: plane(
            [arrow('reina', [4, 3], false), arrow('w', [1, 1], true)],
            ['components', 'norm', 'cos'],
            ['w', 'reina'],
            6,
            0.5,
          ),
          goals: [
            { metric: 'cos', of: ['w', 'reina'], target: 1, tol: 0.01 },
            { metric: 'norm', of: ['w'], target: 2.5, tol: 0.01 },
          ],
        },
        {
          id: 'analogias.ex00.5',
          type: 'manipular',
          prompt:
            'La aritmética da un **punto**, no una palabra: después se busca la palabra más cercana, y esa puede no ser la esperada. Aquí lo ves con un mapa de juguete **inventado** de dos dimensiones (los reales tienen cientos), pensado para parecerse a lo que pasa con el modelo real de los datos.\n\nFijas: «hombre» en $(1, 1)$, «mujer» en $(1, 3)$, «hijo» en $(-2, 1)$, «hija» en $(-4, 4)$ (la respuesta esperada) y «madre» en $(-1, 3)$. Coloca $\\vec{w}$ en $\\text{hijo}-\\text{hombre}+\\text{mujer}$. La lectura de la distancia mide $\\vec{w}$ respecto de «hija»; después calcula la distancia a «madre» y decide cuál de las dos queda más cerca.',
          hints: [
            'Haz la operación en cada eje por separado, igual que con «rey»: $\\text{hijo}-\\text{hombre}+\\text{mujer}$.',
            'Compara la distancia que marca la lectura con la que obtienes tú desde $\\vec{w}$ hasta «madre», con Pitágoras.',
          ],
          explain:
            'El resultado de la analogía es un punto, y la búsqueda devuelve la palabra más cercana a ese punto. Mira cuál de las dos candidatas queda más cerca y si coincide con la que se esperaba.',
          solution:
            '$\\vec{w}=(-2, 1)-(1, 1)+(1, 3)=(-2, 3)$. Su distancia a «hija» es $\\sqrt{4+1}\\approx2{,}24$ y a «madre», $1$: la analogía devuelve «madre». Es lo que pasa de verdad con el modelo paraphrase-multilingual-MiniLM-L12-v2 de los datos: para hijo − hombre + mujer gana «madre» y «hija» queda en el puesto 5. Por eso hay que medir una analogía con una lista de casos y no fiarse de una demostración que sale bien.',
          plane: plane(
            [
              arrow('hombre', [1, 1], false),
              arrow('mujer', [1, 3], false),
              arrow('hijo', [-2, 1], false),
              arrow('hija', [-4, 4], false),
              arrow('madre', [-1, 3], false),
              arrow('w', [0, 0], true),
            ],
            ['components', 'distance'],
            ['w', 'hija'],
          ),
          goals: [
            { metric: 'x', of: ['w'], target: -2, tol: 0.01 },
            { metric: 'y', of: ['w'], target: 3, tol: 0.01 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'analogias.ex01.1',
          type: 'vector',
          prompt:
            'La aritmética de una analogía se hace componente a componente en cualquier $\\mathbb{R}^n$, igual que en el plano. Embeddings de juguete, **inventados** y de 4 componentes (los reales tienen cientos): $\\text{rey}=(5, 2, 4, 1)$, $\\text{hombre}=(2, 1, 3, 2)$ y $\\text{mujer}=(2, 4, 1, 3)$. Calcula $\\vec{w}=\\text{rey}-\\text{hombre}+\\text{mujer}$ y escribe sus cuatro componentes.',
          hints: [
            'Trabaja una componente cada vez: primero la primera de las tres palabras, con su signo, y así hasta la cuarta.',
            'Resta «hombre» y suma «mujer»: no restes las dos.',
          ],
          explain:
            'Cada componente de $\\vec{w}$ es una operación con tres números. Errores típicos: restar también «mujer», o sumar «hombre» en lugar de restarlo.',
          solution:
            '$\\vec{w}=(5-2+2,\\ 2-1+4,\\ 4-3+1,\\ 1-2+3)=(5, 5, 2, 2)$. Con restar también «mujer» saldría $(1, -3, 0, -4)$, que es otra cosa.',
          answer: [5, 5, 2, 2],
          tol: 0,
        },
        {
          id: 'analogias.ex01.2',
          type: 'numero',
          prompt:
            'La relación entre dos palabras es su diferencia, y se puede medir si **dos relaciones apuntan al mismo lado** con el coseno entre las dos diferencias: cerca de $1$, la relación es consistente. Embeddings de juguete, **inventados** y de 3 componentes (los reales tienen cientos): $\\text{hombre}=(2, 1, 0)$, $\\text{mujer}=(3, 3, 2)$, $\\text{rey}=(5, 1, 3)$ y $\\text{reina}=(9, 1, 6)$. Calcula el coseno entre $\\vec{u}=\\text{mujer}-\\text{hombre}$ y $\\vec{v}=\\text{reina}-\\text{rey}$, redondeado a dos decimales.',
          hints: [
            'Calcula las dos diferencias, $\\vec{u}$ y $\\vec{v}$, antes de hacer nada más. Los dos vectores salen con normas enteras.',
            'El coseno es el producto escalar dividido entre el producto de las normas.',
          ],
          explain:
            'El coseno mide el ángulo entre las dos diferencias, no su longitud: dos relaciones pueden apuntar al mismo lado aunque una sea más larga. Un error típico es dar solo el producto escalar.',
          solution:
            '$\\vec{u}=(1, 2, 2)$, de norma $3$, y $\\vec{v}=(4, 0, 3)$, de norma $5$. Su producto escalar es $4+0+6=10$, así que $\\cos\\theta=\\dfrac{10}{3\\cdot5}=\\dfrac{2}{3}\\approx0{,}67$. Con los embeddings reales del modelo de los datos, el coseno entre «mujer» − «hombre» y «reina» − «rey» es $0{,}68$; entre «mujer» − «hombre» y «hija» − «hijo», solo $0{,}18$: la relación se cumple mal ahí.',
          answer: 0.67,
          tol: 0.01,
        },
        {
          id: 'analogias.ex01.3',
          type: 'opcion',
          prompt:
            'Para Roma − Italia + Alemania se calcula el vector resultado y se compara por coseno con cinco palabras. Cosenos de juguete, **inventados** (con embeddings reales, que tienen cientos de dimensiones, el cálculo es el mismo): «Alemania» $0{,}80$, «Berlín» $0{,}75$, «Roma» $0{,}60$, «Francia» $0{,}40$ e «Italia» $0{,}30$. Las entradas de la analogía son «Roma», «Italia» y «Alemania». ¿Qué palabra devuelve la búsqueda sin excluir las entradas y cuál excluyéndolas?',
          hints: [
            'Sin excluir nada gana, sencillamente, el coseno más alto de la tabla.',
            'Al excluir, tacha de la tabla las tres entradas y mira cuál queda arriba.',
          ],
          explain:
            'El resultado a − b + c es igual a a + (c − b): conserva mucho de las entradas, y por eso suelen ser lo más parecido. Compara la respuesta con y sin tachar las tres entradas.',
          solution:
            'Sin excluir, gana «Alemania», con $0{,}80$, una de las entradas. Excluyendo «Roma», «Italia» y «Alemania» quedan «Berlín», con $0{,}75$, y «Francia», con $0{,}40$, y gana «Berlín», la respuesta esperada. Con el modelo real de los datos pasa lo mismo: sin excluir gana «Alemania», con $0{,}83$, y «Berlín» queda segunda, con $0{,}80$; excluyendo las entradas, gana «Berlín».',
          options: [
            'Sin excluir gana «Alemania»; excluyendo las tres entradas, «Berlín»',
            'Gana «Berlín» en los dos casos, porque es la respuesta esperada',
            'Sin excluir gana «Alemania»; excluyendo las tres entradas, «Francia»',
            'Sin excluir gana «Berlín»; excluyendo las tres entradas, «Alemania»',
          ],
          correct: 0,
        },
        {
          id: 'analogias.ex01.4',
          type: 'numero',
          prompt:
            'Datos **reales** del modelo paraphrase-multilingual-MiniLM-L12-v2, de 384 dimensiones. Se calcula París − Francia + España y se ordenan las palabras de los datos por su coseno con el resultado. Las cuatro primeras, sin excluir nada, son «España» $0{,}88$, «París» $0{,}77$, «Lisboa» $0{,}76$ y «Madrid» $0{,}64$. Se excluyen las entradas de la analogía («París», «Francia» y «España»). ¿En qué puesto, contando desde 1, queda «Madrid», la respuesta esperada?',
          hints: [
            'Decide cuáles de las cuatro palabras de la lista son entradas de la analogía.',
            'Quita esas entradas y vuelve a contar desde el puesto 1 entre las que quedan.',
          ],
          explain:
            'Con las entradas fuera, el ranking se vuelve a numerar. Fíjate en qué palabras quedan por delante de «Madrid» y si es la que esperabas.',
          solution:
            'Las entradas son «París», «Francia» y «España», así que se quitan «España», con $0{,}88$, y «París», con $0{,}77$. Queda «Lisboa», con $0{,}76$, en el puesto 1 y «Madrid», con $0{,}64$, en el 2. La analogía falla: devuelve «Lisboa», otra capital, y no «Madrid».',
          answer: 2,
          tol: 0,
        },
        {
          id: 'analogias.ex01.5',
          type: 'opcion',
          prompt:
            'Una charla enseña, con el modelo de embeddings de los datos, que rey − hombre + mujer devuelve «reina», y alguien concluye que el modelo «ha aprendido la relación masculino → femenino». Con ese mismo modelo, hijo − hombre + mujer devuelve «madre» y no «hija». ¿Qué es lo más fiable para decidir si un modelo de embeddings capta bien una relación?',
          hints: [
            'Un solo ejemplo que sale bien no dice cuántos salen mal.',
            'Piensa en qué número puedes obtener repitiendo la prueba con muchos casos y en qué hay que quitar de la búsqueda para que sea justa.',
          ],
          explain:
            'Una demostración bonita es un caso elegido. Para fiarse de una relación hay que medirla sobre una lista de casos y saber cuándo falla. Mira qué opciones lo hacen y cuáles solo cambian el aspecto del resultado.',
          solution:
            'Lo fiable es una lista de casos con la respuesta esperada, excluyendo las entradas, y contar aciertos (y el puesto de la esperada cuando falla). Con el modelo de los datos, 8 de 11 analogías aciertan. Normalizar el resultado no cambia qué palabra gana, porque el coseno no depende de la longitud. Y un umbral de coseno no vale: «Madrid» tiene $0{,}64$ con el resultado de París − Francia + España y falla (queda segunda), mientras que «perro» tiene $0{,}50$ con gato − tigre + lobo y acierta.',
          options: [
            'Probar la relación en una lista de casos con la respuesta esperada, excluyendo las entradas, y contar los aciertos',
            'Quedarse con el caso rey − hombre + mujer: si sale «reina», el modelo capta cualquier relación',
            'Normalizar el resultado de la aritmética: así la analogía acierta siempre',
            'Dar por buena la analogía cuando el coseno con la palabra esperada pasa de $0{,}5$',
          ],
          correct: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'analogias.ex02.1',
          type: 'codigo',
          prompt:
            'El módulo `embeddings` trae embeddings **reales** del modelo paraphrase-multilingual-MiniLM-L12-v2: `vector("rey")` devuelve el de «rey», un array de NumPy de 384 números y norma 1. No hay modelo en el navegador: solo valen las 32 palabras del módulo. La aritmética de una analogía es la de siempre: `vector("rey") - vector("hombre") + vector("mujer")`. Pero esa suma ya no mide 1, así que su producto escalar con otra palabra no es el coseno: hay que dividir entre su norma (la de la otra palabra vale 1).\n\nGuarda en `w` el vector rey − hombre + mujer, en `w_unit` ese vector normalizado y en `cos_reina` su coseno con el vector de «reina».',
          hints: [
            'El plan son tres líneas, una por variable, y cada una usa la anterior. Primero `w`: la cuenta con las tres palabras y sus signos. Después `w_unit`: `w` dividido entre su longitud, para que mida 1. Por último `cos_reina`: el producto escalar de `w_unit` con el vector de «reina». Es un coseno porque los dos miden 1.',
            'Así se escribe cada pieza, con otras palabras para que veas la forma sin que sea la respuesta:\n\n' +
              py(
                'v = vector("padre") - vector("hombre")   # restar embeddings da otro array de 384 números',
                'largo = np.linalg.norm(v)                # la longitud de v: un solo número',
                'v_unit = v / largo                       # cada componente entre la longitud: ahora mide 1',
                'print(v_unit @ vector("madre"))          # @ es el producto escalar: un número',
              ) +
              '\n\nPulsa «Ejecutar» con `print(...)` para ver cada valor antes de entregar.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'w = vector("rey") ___ vector("hombre") ___ vector("mujer")',
                'w_unit = w / ___',
                'cos_reina = ___ @ vector("reina")',
              ) +
              '\n\nEn el último hueco va `w_unit`, no `w`: con `w`, que no mide 1, te saldría el producto escalar y no el coseno.',
          ],
          explain:
            'Normalizar es dividir un vector entre su norma. El coseno de `w` con «reina» no cambia si antes normalizas `w`, así que `w_unit` te da el mismo número que la fórmula completa. Comprueba que `cos_reina` no es el producto escalar sin normalizar.',
          solution:
            '`w = vector("rey") - vector("hombre") + vector("mujer")` mide aproximadamente $1{,}07$, no $1$. `w_unit = w / np.linalg.norm(w)` lo normaliza, y `cos_reina = w_unit @ vector("reina")` vale $0{,}82$: «reina» es la palabra más parecida al resultado. Sin normalizar, `w @ vector("reina")` daría $0{,}88$, que no es un coseno.',
          requirements: [
            '`w` existe y es un array de NumPy con 384 números decimales: el vector de «rey» menos el de «hombre» más el de «mujer»; se acepta una diferencia de hasta una diezmilésima en cada componente.',
            '`w_unit` existe y es un array de NumPy con 384 números decimales: mide $1$ y apunta en la misma dirección que `w`.',
            '`cos_reina` es un número decimal: el coseno entre `w` y el vector de «reina», no su producto escalar sin dividir; se acepta una diferencia de hasta una milésima.',
          ],
          starter: `import numpy as np
from embeddings import vector

# vector("rey") te da el embedding de «rey»: un array de NumPy con 384 números.
# Todos los embeddings del módulo miden 1 (norma 1).
# Con arrays, + y - suman y restan componente a componente, igual que las flechas del plano.

# PASO 1. La analogía: rey - hombre + mujer.
# Escribe la cuenta tal cual, con tres vector("...") y sus signos.
# Por qué: quitarle a «rey» lo de «hombre» y ponerle lo de «mujer» debería
# dejarte cerca de «reina».
w = None

# PASO 2. Normalizar w: que mida 1 sin cambiar hacia dónde apunta.
# Por qué: al sumar y restar, w ya no mide 1, y el producto escalar solo
# es un coseno si los dos vectores miden 1.
# np.linalg.norm(w) te da la longitud de w: un solo número.
# Dividir un array entre un número divide cada una de sus componentes.
w_unit = None

# PASO 3. El coseno entre w_unit y el vector de «reina».
# a @ b es el producto escalar: multiplica componente a componente y lo suma todo.
# Como w_unit y vector("reina") miden 1, su producto escalar ya es el coseno.
cos_reina = None

# Para ver qué vale algo antes de entregar: print(cos_reina) y pulsa «Ejecutar».
`,
          checks: `import embeddings as _e
_v = _e.vector
_exp = _v("rey") - _v("hombre") + _v("mujer")
_r = _v("reina")
_dot = float(_exp @ _r)
_cos = float(_exp @ _r / np.linalg.norm(_exp))
_w = isinstance(w, np.ndarray) and w.shape == (384,) and np.issubdtype(w.dtype, np.floating)
_u = isinstance(w_unit, np.ndarray) and w_unit.shape == (384,) and np.issubdtype(w_unit.dtype, np.floating)
_c = isinstance(cos_reina, (float, np.floating)) and not isinstance(cos_reina, bool)
_wok = _w and bool(np.allclose(w, _exp, atol=1e-4))
check(_w, "\`w\` tiene que ser un array de NumPy con 384 números: la resta y la suma de los vectores de las tres palabras, componente a componente.")
check((not _w) or _wok, "\`w\` tiene que ser el vector de «rey» menos el de «hombre» más el de «mujer»: revisa el orden de las palabras y los signos.")
check(_u, "\`w_unit\` tiene que ser un array de NumPy con 384 números: \`w\` normalizado.")
check((not _u) or abs(float(np.linalg.norm(w_unit)) - 1) < 1e-3, "\`w_unit\` tiene que medir 1: se obtiene dividiendo \`w\` entre su norma, que da \`np.linalg.norm\`.")
check((not _u) or (not _wok) or abs(float(np.linalg.norm(w_unit)) - 1) >= 1e-3 or bool(np.allclose(w_unit, _exp / np.linalg.norm(_exp), atol=1e-4)), "\`w_unit\` tiene que apuntar donde \`w\`: todas sus componentes se dividen entre el mismo número, la norma de \`w\`.")
check(_c, "\`cos_reina\` tiene que ser un número decimal: el coseno entre \`w\` y el vector de «reina».")
check((not _c) or (not _wok) or abs(float(cos_reina) - _dot) >= 1e-3, "\`cos_reina\` es el producto escalar de \`w\` con «reina», no su coseno: \`w\` no mide 1, así que falta dividir entre su norma.")
check((not _c) or (not _wok) or abs(float(cos_reina) - _dot) < 1e-3 or abs(float(cos_reina) - _cos) < 1e-3, "\`cos_reina\` tiene que ser el coseno entre \`w\` y «reina»: el producto escalar dividido entre las normas de los dos vectores.")
`,
          reference: `import numpy as np
from embeddings import vector

# Embeddings reales (paraphrase-multilingual-MiniLM-L12-v2, 384 dimensiones), de norma 1
# Guarda en w el resultado de rey - hombre + mujer, en w_unit ese vector normalizado
# y en cos_reina su coseno con el vector de "reina"
w = vector("rey") - vector("hombre") + vector("mujer")
w_unit = w / np.linalg.norm(w)
cos_reina = w_unit @ vector("reina")
`,
        },
        {
          id: 'analogias.ex02.2',
          type: 'codigo',
          prompt:
            'Una analogía se resuelve en dos pasos: la aritmética, $\\vec{w}=\\vec{a}-\\vec{b}+\\vec{c}$, y la búsqueda de la palabra más cercana por coseno. El resultado se parece mucho a $\\vec{a}$ y a $\\vec{c}$, porque `a - b + c` es `a + (c - b)`: sin más, la palabra que gana suele ser una entrada. Por eso la búsqueda **excluye** `a`, `b` y `c`.\n\nEn `embeddings`, `palabras` es la lista de las 32 palabras y `P`, la matriz con sus vectores en las filas, todos de norma 1, así que `P @ w` da los cosenos salvo la división entre la norma de `w`, que no cambia el orden. `np.argsort` devuelve las posiciones de menor a mayor. Define `analogia(a, b, c)`, que devuelve la palabra de `palabras` más parecida a `vector(a) - vector(b) + vector(c)` sin contar `a`, `b` ni `c`, aunque el modelo no acierte. Guarda en `sale_rey` lo que devuelve para «rey», «hombre» y «mujer».',
          hints: [
            'El plan, dentro de `analogia`: calcula `w` con `a`, `b` y `c` (no con palabras escritas a mano); puntúa las 32 palabras con `P @ w`; ordena las posiciones de la puntuación más alta a la más baja; y recórrelas hasta la primera palabra que no sea ninguna de las tres entradas. Esa es la que devuelves. Fuera de la función, `sale_rey` es una llamada: `analogia(...)` con las tres palabras del rey entre comillas.',
            'Las piezas, probadas con unas notas en vez de con palabras:\n\n' +
              py(
                'notas = np.array([5, 9, 2])',
                'print(np.argsort(notas))         # [2 0 1]: posiciones, de la nota más baja a la más alta',
                'print(np.argsort(notas)[::-1])   # [1 0 2]: al revés, de la más alta a la más baja',
                '',
                'for i in np.argsort(notas)[::-1]:',
                '    print(i, notas[i])           # 1 9, después 0 5, después 2 2',
              ) +
              '\n\nPara saltarte las entradas: `if palabras[i] not in (a, b, c):` y, dentro de ese `if`, `return palabras[i]`. El `return` sale de la función en cuanto encuentra la primera que vale, así que el bucle no sigue.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def analogia(a, b, c):',
                '    w = vector(a) ___ vector(b) ___ vector(c)',
                '    for i in np.argsort(P @ w)[::-1]:',
                '        if palabras[i] not in ___:',
                '            return ___',
                '',
                'sale_rey = analogia(___, ___, ___)',
              ) +
              '\n\nLo que devuelve es una palabra, no la posición `i`: la posición se convierte en palabra con `palabras[i]`. Fíjate en la sangría: lo que va dentro de `def`, de `for` y de `if` lleva 4 espacios más que la línea de arriba.',
          ],
          explain:
            'La función tiene que devolver una palabra, no una posición: `palabras[i]` convierte una posición en palabra. Comprueba con «Roma», «Italia» y «Alemania»: si te devuelve una de ellas, falta dejar las entradas fuera de la búsqueda.',
          solution:
            'Se calcula `w = vector(a) - vector(b) + vector(c)`, se puntúa con `P @ w` y se recorren las posiciones de `np.argsort(P @ w)[::-1]`, de la más parecida a la menos, hasta la primera palabra que no está en `(a, b, c)`. Para «rey», «hombre» y «mujer» devuelve «reina». Sin la exclusión, con «Roma», «Italia» y «Alemania» ganaría «Alemania», una entrada; con ella gana «Berlín». Y con «París», «Francia» y «España» devuelve «Lisboa»: la búsqueda funciona y el modelo falla.',
          requirements: [
            '`analogia` es una función que recibe tres palabras `a`, `b` y `c` y devuelve una sola palabra (un texto) de `palabras`, no su posición.',
            'La palabra devuelta es la de mayor coseno con `vector(a) - vector(b) + vector(c)`, sin contar `a`, `b` ni `c`, aunque el resultado no sea el que esperaría una persona.',
            'Se prueba con otras tres palabras de las 32 de `embeddings`, también con analogías que el modelo no resuelve bien, y no puede dar un error.',
            '`sale_rey` guarda lo que devuelve `analogia` para «rey», «hombre» y «mujer».',
          ],
          starter: `import numpy as np
from embeddings import palabras, P, vector

# palabras: la lista de las 32 palabras. palabras[0] es "rey" y palabras[1] es "reina".
# P: una matriz de 32 filas. La fila i es el embedding de palabras[i], y todas miden 1.
# vector("rey"): el embedding de una palabra, un array de 384 números.

def analogia(a, b, c):
    # a, b y c llegan como textos, por ejemplo "rey", "hombre" y "mujer".
    # Usa a, b y c, no palabras escritas a mano: así la función sirve para
    # cualquier analogía, y las comprobaciones la prueban con otras.
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría):
    # así sabe Python que es parte de ella.

    # PASO 1. El vector de la analogía: a - b + c, con vector(...) en cada una.

    # PASO 2. Puntuar las 32 palabras.
    # P @ w multiplica cada fila de P por w: da un array de 32 números, uno por
    # palabra y en el orden de palabras. Cuanto más alto, más se parece a w.
    # (No hace falta dividir entre la norma de w: dividirlos todos entre el mismo
    # número no cambia cuál es más alto.)

    # PASO 3. Ordenar las palabras de la más parecida a la menos.
    # np.argsort(x) da las POSICIONES de x ordenadas de menor a mayor valor.
    # Añadirle [::-1] le da la vuelta: de mayor a menor.

    # PASO 4. Recorrer esas posiciones y devolver la primera palabra que no sea a, b ni c.
    # Por qué: w = a + (c - b) se parece mucho a a y a c, y sin este filtro
    # casi siempre ganaría una de las palabras que acabas de dar.
    # palabras[i] convierte una posición i en su palabra.
    # x not in (a, b, c) vale True si x no es ninguna de las tres.
    # return devuelve un valor y termina la función en ese momento.
    return None

# PASO 5. Llama a la función con «rey», «hombre» y «mujer» y guarda lo que devuelve.
sale_rey = None
`,
          checks: `import embeddings as _e
_f = callable(globals().get("analogia"))
def _call(*args):
    try:
        return analogia(*args)
    except Exception:
        return None
def _orden(a, b, c):
    _w = _e.vector(a) - _e.vector(b) + _e.vector(c)
    _o = [_e.palabras[int(i)] for i in np.argsort(_e.P @ _w)[::-1]]
    return [p for p in _o if p not in (a, b, c)]
_casos = [("rey", "hombre", "mujer", "reina"), ("Roma", "Italia", "Alemania", "Berlín"), ("París", "Francia", "España", "Lisboa"), ("coche", "camión", "tren", "hombre"), ("gato", "tigre", "lobo", "perro")]
_res = [_call(a, b, c) for a, b, c, _x in _casos] if _f else [None] * 5
_num = any(isinstance(r, (int, np.integer)) and not isinstance(r, bool) for r in _res)
_str = all(isinstance(r, str) for r in _res)
_ent = _str and any(r in (a, b, c) for r, (a, b, c, _x) in zip(_res, _casos))
_peor = _str and any(r == _orden(a, b, c)[-1] for r, (a, b, c, _x) in zip(_res, _casos))
_bien = _str and all(r == x for r, (a, b, c, x) in zip(_res, _casos))
check(_f, "Hay que definir una función \`analogia\` con tres parámetros: las palabras \`a\`, \`b\` y \`c\`.")
check((not _f) or not _num, "\`analogia\` devuelve un número: parece la posición de la palabra. Tiene que devolver la palabra, que se busca en \`palabras\`.")
check((not _f) or _num or _str, "\`analogia\` tiene que devolver una sola palabra: un texto de \`palabras\`.")
check((not _str) or not _ent, "Con algunos casos la función devuelve una de las tres entradas de la analogía: el vector resultante queda muy cerca de ellas y gana alguna. Hay que dejarlas fuera de la búsqueda.")
check((not _str) or _ent or not _peor, "\`analogia\` devuelve la palabra menos parecida al resultado: se busca la de coseno más alto, no la más bajo.")
check((not _str) or _ent or _peor or _bien, "La función tiene que devolver «reina» con «rey», «hombre» y «mujer»; «Berlín» con «Roma», «Italia» y «Alemania»; «Lisboa» con «París», «Francia» y «España» (ahí el modelo falla, pero es lo que encuentra la búsqueda); «hombre» con «coche», «camión» y «tren»; y «perro» con «gato», «tigre» y «lobo». Revisa la resta y la suma de los vectores y que ordenes por coseno.")
check((not _f) or _res[0] != "reina" or sale_rey == "reina", "\`sale_rey\` tiene que guardar lo que devuelve \`analogia\` para «rey», «hombre» y «mujer».")
`,
          reference: `import numpy as np
from embeddings import palabras, P, vector

# P tiene una fila por palabra de palabras, todas de norma 1
def analogia(a, b, c):
    # Devuelve la palabra de palabras más parecida (por coseno) a vector(a) - vector(b) + vector(c),
    # sin contar a, b ni c
    w = vector(a) - vector(b) + vector(c)
    for i in np.argsort(P @ w)[::-1]:
        if palabras[i] not in (a, b, c):
            return palabras[i]

# Guarda en sale_rey lo que devuelve analogia para rey, hombre y mujer
sale_rey = analogia("rey", "hombre", "mujer")
`,
        },
        {
          id: 'analogias.ex02.3',
          type: 'codigo',
          prompt:
            'Ver qué gana **sin** excluir las entradas explica por qué se excluyen. Ya tienes `puntos(a, b, c)`, que devuelve los cosenos de `vector(a) - vector(b) + vector(c)` con las 32 palabras (un array de 32 números, en el orden de `palabras`), y `lista_casos`, con seis analogías. `np.argmax(x)` devuelve la posición del valor mayor de `x`.\n\nGuarda en `ganadoras` la palabra que gana en cada caso **sin excluir nada** (una lista de seis palabras) y en `n_entradas` en cuántos casos esa palabra es una de las tres entradas de **ese** caso.',
          hints: [
            'El plan son dos bucles. El primero recorre `lista_casos` y, en cada caso, busca la palabra de coseno más alto y la añade a `ganadoras`. El segundo recorre a la vez `ganadoras` y `lista_casos` y suma 1 cada vez que la ganadora es una de las tres palabras de su caso. Compara cada ganadora solo con su caso: «París» es entrada del cuarto caso, pero gana en el tercero.',
            'Las piezas, con un solo caso:\n\n' +
              py(
                'cosenos = puntos("rey", "hombre", "mujer")   # 32 números, uno por palabra',
                'pos = np.argmax(cosenos)                     # la posición del más alto',
                'print(palabras[pos])                         # la palabra de esa posición',
                '',
                'print("rey" in ("rey", "hombre", "mujer"))     # True: es una de las tres',
                'print("reina" in ("rey", "hombre", "mujer"))   # False',
              ) +
              '\n\n`for a, b, c in lista_casos:` saca en cada vuelta las tres palabras de un caso. `zip(ganadoras, lista_casos)` las junta por parejas: la ganadora 1 con el caso 1, la 2 con el 2, y así.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'ganadoras = []',
                'for a, b, c in lista_casos:',
                '    pos = np.argmax(___)',
                '    ganadoras.append(___)',
                '',
                'n_entradas = 0',
                'for ganadora, caso in zip(ganadoras, lista_casos):',
                '    if ganadora ___ caso:',
                '        n_entradas = n_entradas + 1',
              ) +
              '\n\nA `ganadoras` se añade la palabra, no la posición `pos`.',
          ],
          explain:
            '`np.argmax` da una posición y `palabras` la convierte en palabra. Para el recuento necesitas, de cada caso, su ganadora y sus tres entradas a la vez: `zip` los junta.',
          solution:
            'Las ganadoras son «reina», «Alemania», «París», «España», «Madrid» y «gato». «Reina» y «París» no son entradas de su caso (París sí lo es del cuarto, pero gana en el tercero); «Alemania» y «España» son la `c` de su analogía, y «Madrid» y «gato», la `a`. Son 4 de 6: en la mayoría de los casos, sin excluir, la búsqueda devuelve una de las palabras que acabas de dar como entrada.',
          requirements: [
            '`ganadoras` es una lista de seis palabras (textos, no posiciones), una por cada caso de `lista_casos` y en su mismo orden.',
            'Cada palabra es la de mayor coseno con el resultado de su caso, sin excluir nada, ni siquiera las entradas.',
            '`n_entradas` es un número entero: en cuántos casos la ganadora es una de las tres entradas de ese mismo caso, no de otro.',
          ],
          starter: `import numpy as np
from embeddings import palabras, P, vector

# palabras: la lista de las 32 palabras. palabras[i] es la palabra de la posición i.

def puntos(a, b, c):
    # Ya está hecha: no hace falta tocarla.
    # Devuelve un array de 32 cosenos: el de la posición i es el coseno entre
    # vector(a) - vector(b) + vector(c) y palabras[i].
    w = vector(a) - vector(b) + vector(c)
    return P @ w / np.linalg.norm(w)

# Seis analogías. Cada caso es una tupla con tres palabras: (a, b, c).
lista_casos = [
    ("rey", "hombre", "mujer"),
    ("Roma", "Italia", "Alemania"),
    ("Lisboa", "Portugal", "Francia"),
    ("París", "Francia", "España"),
    ("Madrid", "España", "Italia"),
    ("gato", "tigre", "lobo"),
]

# PASO 1. La palabra que gana en cada caso, SIN excluir nada.
# Para un caso son tres pasos:
#   puntos(a, b, c)   -> los 32 cosenos
#   np.argmax(...)    -> la POSICIÓN del coseno más alto (un número entero)
#   palabras[...]     -> la palabra de esa posición
# Para los seis casos: empieza con una lista vacía, ganadoras = [], y recorre
# lista_casos con for a, b, c in lista_casos: (cada vuelta saca las tres palabras
# de un caso). Dentro del for, añade la ganadora con ganadoras.append(...).
# Al terminar, ganadoras tiene que tener seis palabras.
ganadoras = None

# PASO 2. ¿En cuántos casos la ganadora es una de las tres entradas de SU caso?
# Por qué: si a menudo gana una entrada, la búsqueda de una analogía tiene que excluirlas.
# zip(ganadoras, lista_casos) recorre las dos listas a la vez, por parejas:
# la ganadora 1 con el caso 1, la 2 con el 2, y así.
# x in caso vale True si x es una de las tres palabras de la tupla caso.
# Empieza un contador en 0 y súmale 1 cada vez que se cumpla.
n_entradas = None

# Para ver qué vale algo antes de entregar: print(ganadoras) y pulsa «Ejecutar».
`,
          checks: `_bien = ["reina", "Alemania", "París", "España", "Madrid", "gato"]
_excl = ["reina", "Berlín", "París", "Lisboa", "Roma", "perro"]
_g = (isinstance(ganadoras, (list, tuple)) and len(ganadoras) == 6) or (isinstance(ganadoras, np.ndarray) and ganadoras.shape == (6,))
_gi = _g and all(isinstance(x, (int, np.integer)) and not isinstance(x, bool) for x in ganadoras)
_gs = _g and all(isinstance(x, str) for x in ganadoras)
_gl = [str(x) for x in ganadoras] if _gs else []
_n = isinstance(n_entradas, (int, np.integer)) and not isinstance(n_entradas, bool)
check(_g, "\`ganadoras\` tiene que ser una lista de seis elementos: la palabra que gana en cada caso, en el orden de \`lista_casos\`.")
check(not _gi, "\`ganadoras\` tiene números: parecen posiciones. Hace falta la palabra, que se busca en \`palabras\`.")
check(not (_gs and _gl == _excl), "\`ganadoras\` tiene las palabras que ganan al excluir las entradas. Aquí no se excluye nada: gana la palabra de coseno más alto, sea o no una entrada.")
check((not _g) or _gi or _gl == _excl or _gl == _bien, "\`ganadoras\` tiene que contener, en el orden de \`lista_casos\`, la palabra de coseno más alto con el resultado de cada caso, sin excluir nada.")
check(_n, "\`n_entradas\` tiene que ser un número entero: en cuántos casos la ganadora es una de las tres entradas de ese caso.")
check((not _n) or _gl != _bien or n_entradas != 5, "\`n_entradas\` cuenta una palabra que es entrada de otro caso: cada ganadora se compara solo con las tres entradas de su propio caso.")
check((not _n) or _gl != _bien or n_entradas == 5 or n_entradas == 4, "\`n_entradas\` tiene que valer el número de casos en los que la ganadora es una de las tres entradas de ese mismo caso.")
`,
          reference: `import numpy as np
from embeddings import palabras, P, vector

def puntos(a, b, c):
    # Cosenos de vector(a) - vector(b) + vector(c) con las 32 palabras, en el orden de palabras
    w = vector(a) - vector(b) + vector(c)
    return P @ w / np.linalg.norm(w)

lista_casos = [
    ("rey", "hombre", "mujer"),
    ("Roma", "Italia", "Alemania"),
    ("Lisboa", "Portugal", "Francia"),
    ("París", "Francia", "España"),
    ("Madrid", "España", "Italia"),
    ("gato", "tigre", "lobo"),
]
# Guarda en ganadoras la palabra que gana en cada caso sin excluir nada (una lista de seis palabras)
# y en n_entradas en cuántos casos esa palabra es una de las tres entradas de ese mismo caso
ganadoras = [palabras[int(np.argmax(puntos(*caso)))] for caso in lista_casos]
n_entradas = sum(g in caso for g, caso in zip(ganadoras, lista_casos))
`,
        },
        {
          id: 'analogias.ex02.4',
          type: 'codigo',
          prompt:
            'Una relación es la diferencia entre dos palabras, y se mide si dos relaciones son la misma con el **coseno entre las dos diferencias**. Ya tienes `coseno(u, v)`, `lista_pares` (cuatro parejas de género: origen y destino) y `otra`, una pareja de capital y país. La relación de referencia es `vector("mujer") - vector("hombre")`, y la de una pareja, `vector(destino) - vector(origen)`.\n\nGuarda en `cos_rel` el coseno entre la relación de referencia y la de cada pareja de `lista_pares`, en su orden; en `floja` la pareja de `lista_pares` con el coseno más bajo (la tupla, no su posición); y en `cos_otra` el coseno entre la relación de referencia y la de `otra`.',
          hints: [
            'El plan: primero la flecha de referencia, de «hombre» a «mujer». Después, un bucle por `lista_pares` que calcula la flecha de cada pareja, de su origen a su destino, y guarda su `coseno` con la referencia. Con los cuatro cosenos, `np.argmin` señala la posición de la pareja floja, y con esa posición la sacas de `lista_pares`. `cos_otra` es la misma cuenta que dentro del bucle, pero con la pareja `otra`.',
            'Las piezas, con otras parejas y otros datos:\n\n' +
              py(
                'ref = vector("mujer") - vector("hombre")   # el paso 1',
                '',
                'for origen, destino in [("gato", "perro"), ("tren", "avión")]:',
                '    flecha = vector(destino) - vector(origen)   # del origen al destino',
                '    print(origen, destino, coseno(ref, flecha))',
                '',
                'notas = [7, 3, 9]',
                'pos = np.argmin(notas)              # 1: la posición del 3, el más bajo',
                'print(["Ana", "Bea", "Carla"][pos])   # Bea: lo que hay en esa posición',
              ) +
              '\n\nUna tupla se lee por posición igual que una lista: si `otra = ("Italia", "Roma")`, `otra[0]` es `"Italia"` y `otra[1]` es `"Roma"`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'ref = vector("mujer") - vector("hombre")',
                '',
                'cos_rel = []',
                'for origen, destino in lista_pares:',
                '    flecha = vector(___) - vector(___)',
                '    cos_rel.append(coseno(ref, flecha))',
                '',
                'floja = lista_pares[___]',
                'cos_otra = coseno(ref, vector(___) - vector(___))',
              ) +
              '\n\nLas dos flechas van en el mismo sentido: la de referencia es destino («mujer») menos origen («hombre»), así que la de cada pareja también es destino menos origen.',
          ],
          explain:
            'Los cuatro cosenos cuentan lo parecida que es cada relación a «hombre» → «mujer». Compara el valor de `cos_otra` con los de `cos_rel` para ver qué es un coseno alto y qué es uno bajo, y mira qué pareja de género destaca por lo bajo.',
          solution:
            'Con `d = vector("mujer") - vector("hombre")`, `cos_rel` vale $0{,}68$ para «rey» → «reina», $0{,}79$ para «padre» → «madre», $0{,}73$ para «príncipe» → «princesa» y solo $0{,}18$ para «hijo» → «hija»: `floja` es esa última. Eso ayuda a explicar que hijo − hombre + mujer no dé «hija». Para `otra` («Italia» → «Roma»), `cos_otra` vale $0{,}05$: una relación distinta casi no se parece: es casi perpendicular a la de género.',
          requirements: [
            '`cos_rel` es una lista o un array de NumPy con cuatro números, uno por cada pareja de `lista_pares` y en su orden: el coseno entre la relación de referencia y la de la pareja.',
            'Las dos relaciones van en el mismo sentido, del origen al destino, y el resultado es un coseno, no un producto escalar; se acepta una diferencia de hasta dos centésimas.',
            '`floja` es una de las parejas de `lista_pares` (origen y destino, no su posición): la de coseno más bajo.',
            '`cos_otra` es un número decimal: el coseno entre la relación de referencia y la de `otra`; se acepta una diferencia de hasta dos centésimas.',
          ],
          starter: `import numpy as np
from embeddings import vector

def coseno(u, v):
    # Ya está hecha: el coseno entre dos vectores, un número entre -1 y 1.
    return u @ v / (np.linalg.norm(u) * np.linalg.norm(v))

# Parejas (origen, destino) de género y una pareja de otra relación
lista_pares = [("rey", "reina"), ("padre", "madre"), ("príncipe", "princesa"), ("hijo", "hija")]
otra = ("Italia", "Roma")

# Una relación entre dos palabras es la flecha que va de una a otra:
# vector(destino) - vector(origen). Si dos relaciones son la misma, sus flechas
# apuntan hacia el mismo sitio y su coseno es alto.

# PASO 1. La relación de referencia: la flecha de «hombre» a «mujer».
# Destino menos origen: vector("mujer") - vector("hombre").
# La guardas en ref para no repetir la cuenta en cada paso.
ref = None

# PASO 2. Un coseno por cada pareja de lista_pares, en su orden.
# for origen, destino in lista_pares: saca en cada vuelta las dos palabras de una pareja.
# Dentro del for: la flecha de la pareja es vector(destino) - vector(origen),
# en el mismo sentido que ref (destino menos origen), y coseno(ref, flecha) da su coseno.
# Empieza con cos_rel = [] y añade cada coseno con cos_rel.append(...).
cos_rel = None

# PASO 3. La pareja con el coseno más bajo: la relación que menos se parece a la de referencia.
# np.argmin(cos_rel) da la POSICIÓN del valor más bajo (0, 1, 2 o 3).
# lista_pares[posición] es la pareja de esa posición: eso es lo que se guarda, no el número.
floja = None

# PASO 4. El coseno entre ref y la relación de otra.
# otra[0] es su origen ("Italia") y otra[1] su destino ("Roma").
cos_otra = None

# Para ver qué vale algo antes de entregar: print(cos_rel) y pulsa «Ejecutar».
`,
          checks: `import embeddings as _e
_v = _e.vector
def _cos(u, v):
    return float(u @ v / (np.linalg.norm(u) * np.linalg.norm(v)))
def _arr(x):
    try:
        return np.asarray(x, dtype=float)
    except Exception:
        return None
_dh = _v("mujer") - _v("hombre")
_pares = [("rey", "reina"), ("padre", "madre"), ("príncipe", "princesa"), ("hijo", "hija")]
_exp = np.array([_cos(_dh, _v(d) - _v(o)) for o, d in _pares])
_dots = np.array([float(_dh @ (_v(d) - _v(o))) for o, d in _pares])
_eo = _cos(_dh, _v("Roma") - _v("Italia"))
_cr = _arr(cos_rel)
_co = _cr is not None and _cr.shape == (4,)
_fl = isinstance(floja, (tuple, list)) and len(floja) == 2 and all(isinstance(x, str) for x in floja)
_fi = isinstance(floja, (int, np.integer)) and not isinstance(floja, bool)
_ot = isinstance(cos_otra, (float, np.floating)) and not isinstance(cos_otra, bool)
check(_co, "\`cos_rel\` tiene que ser un array (o una lista) de cuatro números: el coseno de la relación de cada pareja de \`lista_pares\` con la de referencia.")
check((not _co) or not np.allclose(_cr, -_exp, atol=0.02), "\`cos_rel\` tiene los signos cambiados: las dos diferencias tienen que ir en el mismo sentido, del origen al destino.")
check((not _co) or not np.allclose(_cr, _dots, atol=0.02), "\`cos_rel\` tiene productos escalares: faltan las normas. El coseno divide el producto escalar entre las normas de los dos vectores.")
check((not _co) or bool(np.allclose(_cr, _exp, atol=0.02)) or bool(np.allclose(_cr, -_exp, atol=0.02)) or bool(np.allclose(_cr, _dots, atol=0.02)), "\`cos_rel\` tiene que valer el coseno entre mujer - hombre y destino - origen de cada pareja, en el orden de \`lista_pares\`.")
check(_fl or _fi, "\`floja\` tiene que ser una de las parejas de \`lista_pares\`: una tupla con el origen y el destino.")
check(not _fi, "\`floja\` es un número: parece la posición de la pareja. Hace falta la pareja misma, que se elige en \`lista_pares\` con esa posición.")
check((not _fl) or tuple(floja) != ("padre", "madre"), "\`floja\` es la pareja de coseno más alto: se busca la de coseno más bajo, la posición del menor valor.")
check((not _fl) or tuple(floja) in (("padre", "madre"), ("hijo", "hija")), "\`floja\` tiene que ser la pareja de \`lista_pares\` con el coseno más bajo.")
check(_ot, "\`cos_otra\` tiene que ser un número decimal: el coseno entre la relación de referencia y la de \`otra\`.")
check((not _ot) or abs(float(cos_otra) - _eo) < 0.02, "\`cos_otra\` tiene que ser el coseno entre mujer - hombre y Roma - Italia.")
`,
          reference: `import numpy as np
from embeddings import vector

def coseno(u, v):
    return u @ v / (np.linalg.norm(u) * np.linalg.norm(v))

# Parejas (origen, destino) de género y una pareja de otra relación
lista_pares = [("rey", "reina"), ("padre", "madre"), ("príncipe", "princesa"), ("hijo", "hija")]
otra = ("Italia", "Roma")
# Relación de referencia: vector("mujer") - vector("hombre")
# Guarda en cos_rel el coseno de la referencia con la relación de cada pareja de lista_pares, en su orden,
# en floja la pareja de lista_pares con el coseno más bajo y en cos_otra el coseno de la referencia con la relación de otra
ref = vector("mujer") - vector("hombre")
cos_rel = np.array([coseno(ref, vector(d) - vector(o)) for o, d in lista_pares])
floja = lista_pares[int(np.argmin(cos_rel))]
cos_otra = coseno(ref, vector(otra[1]) - vector(otra[0]))
`,
        },
        {
          id: 'analogias.ex02.5',
          type: 'codigo',
          prompt:
            'Una analogía que sale bien en una demostración no prueba nada: hay que medirla sobre una lista de casos. Ya tienes `ranking(a, b, c)`, que devuelve las palabras ordenadas de más a menos parecida a `vector(a) - vector(b) + vector(c)` sin contar `a`, `b` ni `c`, y `lista_casos`, con 11 analogías `(a, b, c, esperada)`. La lista de Python `x.index(y)` devuelve la posición de `y` en `x`, contando desde 0. Con `plt.bar(posiciones, alturas)` se dibuja una barra por cada posición, con esa altura.\n\nGuarda en `lista_puestos` el puesto de la palabra esperada en el ranking de cada caso (el 1 es el primero), dibuja una barra por caso con su puesto y guarda en `n_aciertos` en cuántos casos la esperada ocupa el puesto 1.',
          hints: [
            'El plan: un bucle por `lista_casos` que, en cada caso, pide su `ranking`, busca en qué posición está la palabra esperada y guarda esa posición más 1 (el puesto). Después, `plt.bar` con una barra por caso y los puestos como alturas. Por último, cuenta cuántos puestos valen 1: estar segunda no es acertar.',
            'Las piezas, con un solo caso:\n\n' +
              py(
                'lista = ranking("rey", "hombre", "mujer")   # 29 palabras, de más a menos parecida',
                'pos = lista.index("reina")                  # su posición: 0 si es la primera',
                'print(pos + 1)                              # su puesto, contando desde 1',
                '',
                'plt.bar([0, 1, 2], [5, 1, 3])               # tres barras, de alturas 5, 1 y 3',
              ) +
              '\n\n`for a, b, c, esperada in lista_casos:` saca en cada vuelta las cuatro palabras de un caso. Para comparar se escribe `==`: `puesto == 1` vale `True` si el puesto es el primero.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'lista_puestos = []',
                'for a, b, c, esperada in lista_casos:',
                '    pos = ranking(a, b, c).index(___)',
                '    lista_puestos.append(___)',
                '',
                'plt.bar(range(11), lista_puestos)',
                '',
                'n_aciertos = 0',
                'for puesto in lista_puestos:',
                '    if ___:',
                '        n_aciertos = n_aciertos + 1',
              ) +
              '\n\nEl puesto cuenta desde 1 y `.index` desde 0: lo que se añade a `lista_puestos` es la posición más 1.',
          ],
          explain:
            'Los puestos cuentan desde 1, y las barras te dejan ver de un vistazo cuántos casos fallan y por cuánto. Comprueba que `n_aciertos` es un número de casos, no una proporción.',
          solution:
            'Los puestos son `[1, 1, 1, 5, 1, 1, 2, 1, 1, 1, 27]`: la esperada es la primera en 8 casos, así que `n_aciertos` vale 8 de 11. Los tres fallos son hijo − hombre + mujer («hija» es la quinta), París − Francia + España («Madrid» es la segunda) y coche − camión + tren («bici» es la 27.ª). Una analogía no es una propiedad del modelo que siempre se cumple: es una tasa de aciertos que se mide.',
          requirements: [
            '`lista_puestos` es una lista o un array de NumPy con 11 números, uno por cada caso de `lista_casos` y en su orden: el puesto de la palabra esperada en el ranking de ese caso, contando desde $1$.',
            '`n_aciertos` es un número entero: cuántos casos tienen la palabra esperada en el puesto $1$; no es una proporción.',
            'Hay una figura con 11 barras, una por caso y en el orden de `lista_casos`, cada una con la altura del puesto de su palabra esperada.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt
from embeddings import palabras, P, vector

def ranking(a, b, c):
    # Ya está hecha: no hace falta tocarla.
    # Devuelve una lista con las palabras ordenadas de más a menos parecida a
    # vector(a) - vector(b) + vector(c), sin a, b ni c. ranking(a, b, c)[0] es la que gana.
    w = vector(a) - vector(b) + vector(c)
    orden = [palabras[i] for i in np.argsort(P @ w)[::-1]]
    return [p for p in orden if p not in (a, b, c)]

# Cada caso: (a, b, c, palabra esperada)
lista_casos = [
    ("rey", "hombre", "mujer", "reina"),
    ("padre", "hombre", "mujer", "madre"),
    ("príncipe", "hombre", "mujer", "princesa"),
    ("hijo", "hombre", "mujer", "hija"),
    ("Roma", "Italia", "Alemania", "Berlín"),
    ("Lisboa", "Portugal", "Francia", "París"),
    ("París", "Francia", "España", "Madrid"),
    ("Madrid", "España", "Italia", "Roma"),
    ("Berlín", "Alemania", "Portugal", "Lisboa"),
    ("gato", "tigre", "lobo", "perro"),
    ("coche", "camión", "tren", "bici"),
]

# PASO 1. El puesto de la palabra esperada en el ranking de cada caso.
# Por qué: que una analogía salga bien una vez no prueba nada; el puesto en muchos
# casos dice cuántas veces acierta el modelo y por cuánto falla cuando falla.
# for a, b, c, esperada in lista_casos: saca en cada vuelta las cuatro palabras de un caso.
# lista.index(x) da la posición de x en la lista, contando desde 0:
#   ["sol", "luna", "mar"].index("luna") vale 1.
# El puesto cuenta desde 1 (el primero es el puesto 1): súmale 1 a la posición.
# Empieza con lista_puestos = [] y añade cada puesto con lista_puestos.append(...).
lista_puestos = None

# PASO 2. Una barra por caso, con la altura de su puesto.
# plt.bar(posiciones, alturas) dibuja una barra en cada posición, con su altura.
# range(11) da las posiciones 0, 1, 2 y así hasta 10: una por caso.
# Las barras altas serán los casos en que la esperada quedó lejos del primer puesto.

# PASO 3. En cuántos casos la esperada es la primera (puesto 1).
# Estar segunda no cuenta: solo vale el puesto 1.
# Recorre lista_puestos con un for y suma 1 a un contador por cada puesto igual a 1
# (en Python, «igual a» se escribe ==).
n_aciertos = None

# Para ver qué vale algo antes de entregar: print(lista_puestos) y pulsa «Ejecutar».
`,
          checks: `import embeddings as _e
def _rank(a, b, c):
    _w = _e.vector(a) - _e.vector(b) + _e.vector(c)
    _o = [_e.palabras[int(i)] for i in np.argsort(_e.P @ _w)[::-1]]
    return [p for p in _o if p not in (a, b, c)]
def _arr(x):
    try:
        return np.asarray(x, dtype=float)
    except Exception:
        return None
_casos = [("rey", "hombre", "mujer", "reina"), ("padre", "hombre", "mujer", "madre"), ("príncipe", "hombre", "mujer", "princesa"), ("hijo", "hombre", "mujer", "hija"), ("Roma", "Italia", "Alemania", "Berlín"), ("Lisboa", "Portugal", "Francia", "París"), ("París", "Francia", "España", "Madrid"), ("Madrid", "España", "Italia", "Roma"), ("Berlín", "Alemania", "Portugal", "Lisboa"), ("gato", "tigre", "lobo", "perro"), ("coche", "camión", "tren", "bici")]
_exp = np.array([_rank(a, b, c).index(x) + 1 for a, b, c, x in _casos], dtype=float)
_p = _arr(lista_puestos)
_pok = _p is not None and _p.shape == (11,)
_n = isinstance(n_aciertos, (int, np.integer)) and not isinstance(n_aciertos, bool)
_nf = isinstance(n_aciertos, (float, np.floating)) and not isinstance(n_aciertos, bool)
check(_pok, "\`lista_puestos\` tiene que ser una lista (o un array) de 11 números: el puesto de la palabra esperada en cada caso.")
check((not _pok) or not np.allclose(_p, _exp - 1), "\`lista_puestos\` empieza a contar en 0: el primer puesto del ranking es el 1, no el 0.")
check((not _pok) or bool(np.allclose(_p, _exp)) or bool(np.allclose(_p, _exp - 1)), "\`lista_puestos\` tiene que tener, en el orden de \`lista_casos\`, el puesto de la palabra esperada en el ranking de ese caso.")
check(_n or _nf, "\`n_aciertos\` tiene que ser un número: cuántos casos tienen la esperada en el puesto 1.")
check(not _nf, "\`n_aciertos\` es un número decimal: parece una proporción. Hace falta el número de casos acertados, sin dividir entre el total.")
check((not _n) or n_aciertos != 9, "\`n_aciertos\` cuenta también los casos con la esperada en el puesto 2: solo es un acierto si ocupa el puesto 1.")
check((not _n) or n_aciertos == 9 or n_aciertos == 8, "\`n_aciertos\` tiene que contar los casos con la palabra esperada en el puesto 1 del ranking.")
_fig = len(plt.get_fignums()) > 0
_pat = [q for ax in plt.gcf().axes for q in ax.patches] if _fig else []
_barras = [h for _x, h in sorted((q.get_x() + q.get_width() / 2, float(q.get_height())) for q in _pat)]
check(_fig, "No hay ninguna figura: dibuja los puestos con \`plt.bar\`.")
check((not _fig) or len(_pat) > 0, "No hay barras en la figura: dibújalas con \`plt.bar\`.")
check(len(_pat) == 0 or len(_pat) == 11, "La figura tiene barras de más o de menos: hace falta una por caso, 11 en total.")
check(len(_pat) != 11 or bool(np.allclose(_barras, _exp)), "La altura de cada barra tiene que ser el puesto de la palabra esperada en su caso, y las barras siguen el orden de \`lista_casos\`.")
`,
          reference: `import numpy as np
import matplotlib.pyplot as plt
from embeddings import palabras, P, vector

def ranking(a, b, c):
    # Las palabras ordenadas de más a menos parecida a vector(a) - vector(b) + vector(c), sin contar a, b ni c
    w = vector(a) - vector(b) + vector(c)
    orden = [palabras[i] for i in np.argsort(P @ w)[::-1]]
    return [p for p in orden if p not in (a, b, c)]

# Cada caso: (a, b, c, palabra esperada)
lista_casos = [
    ("rey", "hombre", "mujer", "reina"),
    ("padre", "hombre", "mujer", "madre"),
    ("príncipe", "hombre", "mujer", "princesa"),
    ("hijo", "hombre", "mujer", "hija"),
    ("Roma", "Italia", "Alemania", "Berlín"),
    ("Lisboa", "Portugal", "Francia", "París"),
    ("París", "Francia", "España", "Madrid"),
    ("Madrid", "España", "Italia", "Roma"),
    ("Berlín", "Alemania", "Portugal", "Lisboa"),
    ("gato", "tigre", "lobo", "perro"),
    ("coche", "camión", "tren", "bici"),
]
# Guarda en lista_puestos el puesto de la esperada en el ranking de cada caso (el primero es el 1),
# dibuja una barra por caso con su puesto y guarda en n_aciertos cuántas veces es la primera
lista_puestos = [ranking(a, b, c).index(esperada) + 1 for a, b, c, esperada in lista_casos]
plt.bar(range(11), lista_puestos)
n_aciertos = sum(p == 1 for p in lista_puestos)
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'analogias.hoja.1',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula una analogía con embeddings de juguete, inventados y de 3 componentes (los reales tienen cientos). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Calcula el resultado por otro camino: primero rey − hombre, componente a componente, y a eso súmale mujer. Compáralo con la última línea.',
        'Fíjate en qué pasa con el signo de «mujer» cuando se saca un paréntesis precedido de un signo menos.',
      ],
      explain:
        'Una resta seguida de una suma no se puede agrupar de cualquier manera: al meter dos términos en un paréntesis precedido de un signo menos, cada uno cambia de signo. Revisa cada igualdad con ese criterio.',
      solution:
        'La segunda línea está mal: rey − hombre + mujer es rey − (hombre − mujer), no rey − (hombre + mujer), porque al sacar el paréntesis el signo de «mujer» se invierte. Bien hecho: $(4, 3, 2)-(1, 2, 1)=(3, 1, 1)$ y $(3, 1, 1)+(1, 4, 3)=(4, 5, 4)$. Las dos líneas siguientes heredan el error y dan $(2, -3, -2)$.',
      lines: [
        'Hay que calcular w = rey − hombre + mujer, con rey = (4, 3, 2), hombre = (1, 2, 1) y mujer = (1, 4, 3)',
        'Restar «hombre» y sumar «mujer» es lo mismo que restar la suma de los dos: w = rey − (hombre + mujer)',
        'hombre + mujer = (1 + 1, 2 + 4, 1 + 3) = (2, 6, 4)',
        'w = (4 − 2, 3 − 6, 2 − 4) = (2, −3, −2)',
      ],
      faultyLine: 1,
    },
    {
      id: 'analogias.hoja.2',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Esta función `analogia` devuelve la palabra de `palabras` más parecida a `vector(a) - vector(b) + vector(c)` sin contar las tres entradas. NumPy ya está importado como `np`, igual que `palabras`, `P` y `vector` del módulo `embeddings`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Prueba la función a mano con «Roma», «Italia» y «Alemania»: ¿qué palabra devolvería?',
        'Cuenta cuántas de las tres entradas se dejan fuera de la búsqueda.',
      ],
      explain:
        'La función devuelve una palabra y no da error, pero el contrato incluye excluir las tres entradas. Comprueba qué palabras quedan efectivamente fuera de la búsqueda.',
      solution:
        'La cuarta línea está mal: solo excluye `b`, y hay que excluir también `a` y `c`. Con «Roma», «Italia» y «Alemania» la función devuelve «Alemania», una entrada (su coseno con el resultado es $0{,}83$), y no «Berlín» ($0{,}80$). Las dos primeras líneas no tienen fallo y la última, aunque está bien, hereda el resultado erróneo.',
      lines: [
        'def analogia(a, b, c):',
        '    w = vector(a) - vector(b) + vector(c)',
        '    puntos = P @ w',
        '    puntos[palabras.index(b)] = -np.inf',
        '    return palabras[int(np.argmax(puntos))]',
      ],
      faultyLine: 3,
    },
    {
      id: 'analogias.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento defiende que, al buscar por coseno la palabra más cercana al resultado de una analogía, da igual normalizar ese resultado o no. Las palabras de los datos tienen todas norma 1. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Escribe el coseno de un vector `x` de norma 1 con $\\vec{w}$ y con $\\vec{u}=\\vec{w}/\\lVert\\vec{w}\\rVert$, y compáralos.',
        'Si dos listas de números son la misma, ordenar las palabras con una o con otra da el mismo orden.',
      ],
      explain:
        'Revisa cada línea con la fórmula del coseno y el hecho de que las palabras miden 1: qué se simplifica y qué se conserva al dividir entre la norma.',
      solution:
        'No hay ningún error. Dividir entre la norma no cambia la dirección, y el coseno solo mira la dirección. Con palabras de norma 1, el coseno con $\\vec{u}$ es $\\vec{u}\\cdot\\vec{x}$, y con $\\vec{w}$ es $\\vec{w}\\cdot\\vec{x}$ entre $\\lVert\\vec{w}\\rVert$: el mismo número. En los datos, rey − hombre + mujer mide $1{,}07$, no $1$, y da igual: ordena las palabras igual que su versión normalizada.',
      lines: [
        'w = rey − hombre + mujer y u = w / ‖w‖ apuntan en la misma dirección, y u mide 1',
        'Una palabra x de los datos tiene norma 1, así que su coseno con u es u · x',
        'El coseno de x con w es (w · x) / ‖w‖ = u · x, el mismo número',
        'Por tanto, ordenar las palabras por su coseno con w o con u da el mismo orden, y la palabra más cercana es la misma',
      ],
      faultyLine: null,
    },
  ],
};
