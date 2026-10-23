import type { PlaneSpec, PlaneVector, Project } from '../../content/schema';
import { vecinosWarmup } from './vecinos.calentamiento';

/**
 * Plano del proyecto: rango 6 y rejilla de 1 en 1, sin circunferencia, salvo que se diga otra cosa.
 * Los dos últimos ejercicios del plano (filas unitarias) usan rango 2, rejilla de 0,1 y la
 * circunferencia unidad.
 */
const plane = (
  vectors: PlaneVector[],
  readouts: PlaneSpec['readouts'],
  pair: [string, string],
  range = 6,
  snap = 1,
  circle?: number,
): PlaneSpec => ({
  range,
  snap,
  vectors,
  readouts,
  pair,
  ...(circle !== undefined ? { circle } : {}),
});

/** Un vector del plano, móvil o fijo. */
const arrow = (
  id: string,
  [x, y]: readonly [number, number],
  movable: boolean,
  label: string = id,
): PlaneVector => ({ id, label, x, y, movable });

/** Primer proyecto de la Órbita 3: la búsqueda de los k vecinos más cercanos, con embeddings reales. */
export const vecinos: Project = {
  id: 'vecinos',
  name: 'Vecinos y top-k',
  sub: 'Los k más parecidos',
  warmup: vecinosWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'vecinos.ex00.1',
          type: 'manipular',
          prompt:
            'Buscar el **vecino más cercano** de una consulta es quedarse con el documento de mayor puntuación. Si la puntuación es el coseno, gana el documento cuya dirección se parece más a la de la consulta; el máximo posible es $1$, y se alcanza cuando los dos apuntan exactamente en la misma dirección. Este mapa es un juguete **inventado** de dos dimensiones, para poder dibujarlo: los embeddings reales tienen cientos. Los documentos son «gato» $(3, 4)$, «lobo» $(4, -2)$ y «coche» $(-3, 2)$, fijos. Coloca la consulta $\\vec{q}$ para que su coseno con «lobo» valga $1$: «lobo» es entonces su vecino más cercano, con la puntuación más alta posible. La lectura compara $\\vec{q}$ con «lobo».',
          hints: [
            'El coseno compara solo la dirección: $\\vec{q}$ tiene que estar sobre la recta de «lobo», y del mismo lado que él, no del lado opuesto.',
            'La lectura del coseno tiene que marcar $1$. La longitud de $\\vec{q}$ no importa: recorre esa dirección.',
          ],
          explain:
            'El coseno no mira cuánto mide $\\vec{q}$, solo hacia dónde apunta. Todas las consultas que apuntan hacia «lobo» tienen con él el mismo coseno, $1$; del lado opuesto saldría $-1$, la peor puntuación posible.',
          solution:
            '$\\vec{q}=(2, -1)$ apunta en la dirección de «lobo» $(4, -2)$: es su mitad. También valen $(4, -2)$ y $(6, -3)$. Los cosenos son entonces $1$ con «lobo», $0{,}18$ con «gato» y $-0{,}99$ con «coche», y la búsqueda devuelve «lobo». «coche» queda el último, casi en la dirección contraria.',
          plane: plane(
            [
              arrow('gato', [3, 4], false),
              arrow('lobo', [4, -2], false),
              arrow('coche', [-3, 2], false),
              arrow('q', [1, 1], true),
            ],
            ['components', 'cos'],
            ['q', 'lobo'],
          ),
          goals: [{ metric: 'cos', of: ['q', 'lobo'], target: 1, tol: 0.001 }],
        },
        {
          id: 'vecinos.ex00.2',
          type: 'manipular',
          prompt:
            'Cuando dos documentos puntúan **lo mismo** hay un empate, y la búsqueda no tiene un único vecino más cercano: en el borde de un top-$k$ no se puede contar con el orden en que `np.argsort` coloca a dos empatados. Este mapa es un juguete **inventado** de dos dimensiones; los embeddings reales tienen cientos. Los documentos «gato» $(3, 4)$, «perro» $(4, 3)$ y «coche» $(-3, 2)$ están fijos. Coloca la consulta $\\vec{q}$ para que «gato» y «perro» puntúen los dos $0{,}99$ por coseno. La lectura compara $\\vec{q}$ con «gato»; el coseno con «perro» lo calculas con las componentes.',
          hints: [
            '«gato» y «perro» miden lo mismo, $5$, así que puntúan igual cuando $\\vec{q}$ forma el mismo ángulo con los dos.',
            'Ese lugar es la recta que queda entre los dos a igual ángulo de cada uno. Recórrela hasta que el coseno con «gato» marque $0{,}99$.',
          ],
          explain:
            'Dos documentos de la misma longitud puntúan igual por coseno cuando forman el mismo ángulo con la consulta: $\\vec{q}$ tiene que quedar justo entre los dos.',
          solution:
            '$\\vec{q}=(1, 1)$, o cualquier $(k, k)$ con $k>0$: el coseno con «gato» es $\\dfrac{3+4}{5\\sqrt2}\\approx0{,}99$, y con «perro», $\\dfrac{4+3}{5\\sqrt2}$, el mismo número. Cada uno forma un ángulo de $8{,}1^\\circ$ con la consulta. «coche» queda lejos, con un coseno de $-0{,}20$. Un top-1 aquí es arbitrario; un top-2 los devolvería a los dos.',
          plane: plane(
            [
              arrow('gato', [3, 4], false),
              arrow('perro', [4, 3], false),
              arrow('coche', [-3, 2], false),
              arrow('q', [2, 1], true),
            ],
            ['components', 'cos'],
            ['q', 'gato'],
          ),
          goals: [
            { metric: 'cos', of: ['q', 'gato'], target: 0.99, tol: 0.005 },
            { metric: 'cos', of: ['q', 'perro'], target: 0.99, tol: 0.005 },
          ],
        },
        {
          id: 'vecinos.ex00.3',
          type: 'manipular',
          prompt:
            'Hay dos criterios para decir que un documento está «cerca» de la consulta, y no siempre coinciden: la **distancia** (el más cercano es el que está a menor distancia) y el **coseno** (el más cercano es el de mayor coseno). Este mapa es un juguete **inventado** de dos dimensiones; los embeddings reales tienen cientos. La consulta $\\vec{q}=(2, 0)$ y el documento «corto» $(2, 2)$ están fijos. Coloca el documento «largo», $\\vec{d}$, para que su coseno con $\\vec{q}$ valga $1$ y su distancia a $\\vec{q}$ valga $4$. La lectura compara $\\vec{q}$ con $\\vec{d}$.',
          hints: [
            'Un coseno de $1$ pide que $\\vec{d}$ apunte en la misma dirección que $\\vec{q}$ y del mismo lado: está sobre el eje horizontal, a la derecha.',
            'Sobre esa semirrecta, avanza hasta que la distancia a $\\vec{q}$ valga $4$: es la diferencia entre sus abscisas.',
          ],
          explain:
            'El coseno solo mira la dirección y la distancia mide cuánto se separan las puntas. Un documento puede apuntar justo donde la consulta y estar lejos, y otro puede estar cerca sin apuntar hacia donde ella.',
          solution:
            '$\\vec{d}=(6, 0)$: apunta como $\\vec{q}$, así que su coseno es $1$, y $\\lVert\\vec{d}-\\vec{q}\\rVert=\\lVert(4, 0)\\rVert=4$. Compáralo con «corto»: su coseno con $\\vec{q}$ es $\\dfrac{4}{2\\cdot2\\sqrt2}\\approx0{,}71$ y su distancia, $2$. Por distancia gana «corto» ($2<4$); por coseno gana «largo» ($1>0{,}71$). Con embeddings normalizados, de norma $1$, los dos criterios ordenan igual, y por eso suelen guardarse así.',
          plane: plane(
            [
              arrow('q', [2, 0], false),
              arrow('corto', [2, 2], false),
              arrow('d', [1, 1], true, 'largo'),
            ],
            ['components', 'distance', 'cos'],
            ['q', 'd'],
          ),
          goals: [
            { metric: 'cos', of: ['q', 'd'], target: 1, tol: 0.001 },
            { metric: 'distance', of: ['q', 'd'], target: 4, tol: 0.01 },
          ],
        },
        {
          id: 'vecinos.ex00.4',
          type: 'manipular',
          prompt:
            'Las bases de datos vectoriales suelen guardar embeddings **normalizados**, de norma $1$. Entonces la puntuación $E\\vec{q}$, un producto escalar por fila, es el coseno de cada fila con $\\vec{q}$ siempre que $\\vec{q}$ también sea unitaria. Este mapa es un juguete **inventado** de dos dimensiones; los embeddings reales tienen cientos. Las filas $\\vec{u}_1=(0{,}6;\\ 0{,}8)$ y $\\vec{u}_2=(0{,}8;\\ -0{,}6)$ son unitarias y están fijas. Coloca $\\vec{q}$ para que $E\\vec{q}=(0{,}6;\\ 0{,}8)$: coseno $0{,}6$ con $\\vec{u}_1$ y $0{,}8$ con $\\vec{u}_2$. La lectura del producto escalar compara $\\vec{q}$ con $\\vec{u}_1$; el otro lo calculas con las componentes.',
          hints: [
            'Cada puntuación es un producto escalar: $0{,}6q_1+0{,}8q_2=0{,}6$ y $0{,}8q_1-0{,}6q_2=0{,}8$.',
            'La lectura con $\\vec{u}_1$ tiene que marcar $0{,}6$. Prueba con un punto de la circunferencia unidad y comprueba la otra puntuación con las componentes.',
          ],
          explain:
            'Con filas unitarias, `E @ q` da cosenos si $\\vec{q}$ es unitaria; si no lo es, cada puntuación sale multiplicada por la norma de $\\vec{q}$ y el orden de los documentos no cambia. Dos puntuaciones fijan la posición de $\\vec{q}$.',
          solution:
            '$\\vec{q}=(1;\\ 0)$: $0{,}6\\cdot1+0{,}8\\cdot0=0{,}6$ con $\\vec{u}_1$ y $0{,}8\\cdot1-0{,}6\\cdot0=0{,}8$ con $\\vec{u}_2$. Como $\\vec{q}$ es unitaria, son los cosenos, y el vecino más cercano es $\\vec{u}_2$, con $0{,}8$. Las dos filas son perpendiculares, porque $0{,}6\\cdot0{,}8-0{,}8\\cdot0{,}6=0$.',
          plane: plane(
            [
              arrow('u1', [0.6, 0.8], false),
              arrow('u2', [0.8, -0.6], false),
              arrow('q', [0.5, 0.5], true),
            ],
            ['components', 'dot'],
            ['q', 'u1'],
            2,
            0.1,
            1,
          ),
          goals: [
            { metric: 'dot', of: ['q', 'u1'], target: 0.6, tol: 0.01 },
            { metric: 'dot', of: ['q', 'u2'], target: 0.8, tol: 0.01 },
          ],
        },
        {
          id: 'vecinos.ex00.5',
          type: 'manipular',
          prompt:
            'El paso de recuperación de un **RAG** (generación aumentada con recuperación) es una búsqueda de vecinos: se calcula el embedding de la pregunta, se puntúan todos los trozos de la base de conocimiento y los $k$ mejores entran en el contexto del modelo de lenguaje. Este mapa es un juguete **inventado** de dos dimensiones; los embeddings reales tienen cientos. Tres trozos con embedding unitario, fijos: «parking» $(1, 0)$, «aeropuerto» $(0{,}6;\\ 0{,}8)$ y «desayuno» $(-0{,}8;\\ -0{,}6)$. Coloca la pregunta $\\vec{q}$ para que puntúe $0{,}8$ con «parking» y $0{,}96$ con «aeropuerto». La lectura compara $\\vec{q}$ con «parking»; la otra puntuación la calculas con las componentes.',
          hints: [
            'Las filas son unitarias: si $\\vec{q}$ también lo es, cada producto escalar es un coseno. El de «parking» es $q_1$, así que $q_1=0{,}8$.',
            'Con $q_1=0{,}8$, busca la altura $q_2$ para la que $0{,}6q_1+0{,}8q_2$ valga $0{,}96$.',
          ],
          explain:
            'Cada trozo aporta una condición y dos condiciones fijan la pregunta. La puntuación de «desayuno» no la has elegido: sale de donde dejes a $\\vec{q}$. Fíjate en cómo se ordenan los tres trozos.',
          solution:
            '$\\vec{q}=(0{,}8;\\ 0{,}6)$ puntúa $0{,}8$ con «parking», $0{,}6\\cdot0{,}8+0{,}8\\cdot0{,}6=0{,}96$ con «aeropuerto» y $-0{,}8\\cdot0{,}8-0{,}6\\cdot0{,}6=-1$ con «desayuno»: apunta justo en contra. Con $k=1$ entra en el contexto solo «aeropuerto»; con $k=2$ entra también «parking»; con $k=3$ entra «desayuno», con $-1$, que solo añade ruido y coste. Elegir $k$ es un compromiso entre no dejar fuera lo relevante y no llenar el contexto de trozos que no lo son.',
          plane: plane(
            [
              arrow('parking', [1, 0], false),
              arrow('aeropuerto', [0.6, 0.8], false),
              arrow('desayuno', [-0.8, -0.6], false),
              arrow('q', [0.5, 0.5], true),
            ],
            ['components', 'dot'],
            ['q', 'parking'],
            2,
            0.1,
            1,
          ),
          goals: [
            { metric: 'dot', of: ['q', 'parking'], target: 0.8, tol: 0.01 },
            { metric: 'dot', of: ['q', 'aeropuerto'], target: 0.96, tol: 0.01 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'vecinos.ex01.1',
          type: 'vector',
          prompt:
            'Para quedarse con los $k$ mejores hay que ordenar los documentos por su puntuación, y devolver sus posiciones, no las puntuaciones. Una consulta puntúa seis documentos de juguete (inventados; los reales tienen cientos de componentes) con estos cosenos, y los documentos se numeran desde $0$: documento 0, $0{,}31$ · documento 1, $0{,}72$ · documento 2, $0{,}15$ · documento 3, $0{,}64$ · documento 4, $0{,}70$ · documento 5, $-0{,}10$. Escribe las posiciones de los tres documentos que devuelve la búsqueda con $k=3$, del que más puntúa al que menos.',
          hints: [
            'Ordena las puntuaciones de mayor a menor y apunta de qué documento es cada una.',
            'La respuesta son números de documento, contando desde $0$, y el orden importa: empieza por el mejor.',
          ],
          explain:
            'Se ordena por puntuación, no por número de documento, y se devuelve el número de documento, no el coseno. Cuenta desde $0$ y empieza por el que más puntúa.',
          solution:
            'De mayor a menor: $0{,}72$ (documento 1), $0{,}70$ (documento 4) y $0{,}64$ (documento 3). La respuesta es $(1, 4, 3)$. En NumPy, con las puntuaciones en `s`, `np.argsort(-s)[:3]` da estas posiciones: `np.argsort` ordena de menor a mayor, y el signo menos coloca primero las puntuaciones más altas.',
          answer: [1, 4, 3],
          tol: 0,
        },
        {
          id: 'vecinos.ex01.2',
          type: 'numero',
          prompt:
            'Para saber si un buscador funciona se mide el **recall@k**: de los documentos que de verdad responden a la consulta (los relevantes), qué fracción aparece entre los $k$ que devuelve. Para una consulta, los documentos relevantes son el 2, el 5, el 7 y el 9. Con $k=5$, el buscador devuelve, en este orden, los documentos 5, 0, 9, 3 y 2. Calcula el recall@5 como un número entre $0$ y $1$.',
          hints: [
            'Cuenta cuántos de los cuatro relevantes aparecen entre los cinco que devuelve el buscador.',
            'El denominador es el número de documentos relevantes, no el de documentos devueltos.',
          ],
          explain:
            'El recall mira los relevantes que se han encontrado, sin importar el orden ni los documentos devueltos de más. Dividir entre $k$ mide otra cosa: la precisión.',
          solution:
            'Entre los cinco devueltos hay tres relevantes: el 5, el 9 y el 2. El 7 queda fuera. Así, $\\text{recall@5}=\\dfrac{3}{4}=0{,}75$. Con un $k$ mayor podría entrar el 7: el recall nunca baja al subir $k$. La precisión, relevantes devueltos entre documentos devueltos, sería $3/5=0{,}6$.',
          answer: 0.75,
          tol: 0,
        },
        {
          id: 'vecinos.ex01.3',
          type: 'opcion',
          prompt:
            '`s` es un array de NumPy con las puntuaciones de una consulta con todos los documentos, una por documento, y `k` es un número entero. `np.argsort(x)` devuelve las posiciones que ordenan `x` de menor a mayor. ¿Qué expresión da las posiciones de los `k` mejores documentos, del que más puntúa al que menos?',
          hints: [
            'Prueba cada opción con `s = np.array([0.2, 0.9, 0.5])` y `k = 2`: los dos mejores son las posiciones 1 y 2, en ese orden.',
            'Pregúntate si la opción devuelve posiciones o puntuaciones, y si empieza por el que más puntúa o por el que menos.',
          ],
          explain:
            '`np.argsort` ordena de menor a mayor: los documentos que más puntúan están al final de su lista. Hay que invertir el orden de alguna forma, y hay que quedarse con posiciones, no con valores.',
          solution:
            '`np.argsort(-s)[:k]`: cambiar el signo hace que las puntuaciones más altas queden como las más bajas, y `np.argsort` las coloca primero. `np.argsort(s)[:k]` devuelve los `k` peores. `np.argsort(s)[-k:]` devuelve los `k` mejores, pero empezando por el que menos puntúa de ellos. `np.sort(s)[::-1][:k]` ordena bien, pero devuelve las puntuaciones y no las posiciones de los documentos.',
          options: [
            '`np.argsort(-s)[:k]`: cambiar el signo pone primero las puntuaciones más altas',
            '`np.argsort(s)[:k]`: las `k` primeras posiciones de la lista ordenada',
            '`np.argsort(s)[-k:]`: las `k` últimas posiciones de la lista ordenada',
            '`np.sort(s)[::-1][:k]`: la lista ordenada, dada la vuelta, y sus `k` primeros elementos',
          ],
          correct: 0,
        },
        {
          id: 'vecinos.ex01.4',
          type: 'numero',
          prompt:
            'La búsqueda **exacta** puntúa la consulta contra todos los documentos con `E @ q`, que hace una multiplicación por cada número de `E`. Una base tiene 500 000 documentos con embeddings de 1536 componentes, como los de `text-embedding-3-small` de OpenAI. ¿Cuántos millones de multiplicaciones cuesta puntuar **una** consulta?',
          hints: [
            '`E` tiene una fila por documento y una columna por componente: cuenta cuántos números tiene en total.',
            'Multiplica el número de documentos por el de componentes y expresa el resultado en millones.',
          ],
          explain:
            'El coste de una consulta es el número de documentos por el de componentes. Revisa las potencias de diez al pasar a millones.',
          solution:
            '$500\\,000\\cdot1536=768\\,000\\,000$, es decir, $768$ millones de multiplicaciones por cada consulta. El coste crece con el número de documentos $N$ y con el de componentes $d$: es $N\\cdot d$. Con cientos de millones de documentos, la búsqueda exacta se vuelve lenta; por eso existen los índices de vecinos aproximados (ANN, por ejemplo HNSW): no puntúan todos los documentos y, a cambio, pueden dejar fuera alguno de los mejores.',
          answer: 768,
          tol: 0,
        },
        {
          id: 'vecinos.ex01.5',
          type: 'opcion',
          prompt:
            'Un RAG de un hotel de congresos usa embeddings reales (paraphrase-multilingual-MiniLM-L12-v2, de 384 componentes). La pregunta de un huésped es «¿Cómo llego desde el aeropuerto?» y los tres trozos de la base que más puntúan por coseno son «El hotel está a 20 minutos del aeropuerto en taxi.» ($0{,}56$), «El aparcamiento cuesta 25 euros al día y hay que reservarlo con antelación.» ($0{,}24$) y «La conexión wifi es gratuita en todo el hotel.» ($0{,}24$). Con $k=3$ entran los tres en el contexto del modelo de lenguaje. ¿Qué conclusión es la correcta?',
          hints: [
            'Compara las tres puntuaciones: ¿cuántos de los trozos están claramente por encima del resto?',
            'Piensa qué recibe el modelo de lenguaje con $k=3$ y qué le costaría recibir más trozos todavía.',
          ],
          explain:
            'Un coseno positivo no basta para que un trozo sea útil: importa cuánto se separa de los demás. Cada trozo de más que entra en el contexto cuesta y puede distraer al modelo.',
          solution:
            'Solo el primer trozo se separa del resto: $0{,}56$ frente a $0{,}24$. Los otros dos entran en el contexto por pura posición en la lista, y son ruido para el modelo. No hay un $k$ correcto para siempre: con $k$ pequeño se corre el riesgo de dejar fuera lo relevante, y con $k$ grande se llena el contexto de trozos que no lo son, con más coste. Es un compromiso que se ajusta midiendo, por ejemplo con el recall@k.',
          options: [
            'Solo el primer trozo destaca; los otros dos entran por estar en el top-$k$ y son ruido: elegir $k$ es un compromiso entre no perder lo relevante y no llenar el contexto',
            'Hay que subir $k$ hasta que entren los 16 trozos de la base: así el modelo nunca se pierde nada y no hay ningún inconveniente',
            'El top-$k$ solo puede devolver un trozo, así que con $k=3$ el buscador está mal configurado',
            'Los tres trozos son igual de relevantes para la pregunta, porque todos tienen un coseno positivo',
          ],
          correct: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'vecinos.ex02.1',
          type: 'codigo',
          prompt:
            'Los embeddings de esta pregunta y de las siguientes son **reales**: los calculó el modelo paraphrase-multilingual-MiniLM-L12-v2, con 384 componentes. El módulo `embeddings` te los da ya hechos (no hay modelo para textos nuevos): `D` es una matriz con un documento por fila, las 16 frases de la base de conocimiento de un hotel de congresos (el texto de cada una está en la lista `documentos`), y `Q`, una matriz con una consulta por fila. Todas las filas tienen norma $1$, así que el producto escalar es el coseno.\n\nTienes la consulta `q`, «¿Puedo llevar a mi perro?». Guarda en `punt` la puntuación de cada documento con `q` y en `mejor` la posición del documento que más puntúa. `np.argmax(x)` devuelve la posición del valor mayor de `x`.',
          hints: [
            'Un producto de una matriz por un vector da un número por fila: una puntuación por documento. Son 16.',
            'Para `mejor` hace falta la posición del valor mayor, no el valor.',
          ],
          explain:
            'La puntuación de cada documento es el producto escalar de su fila con `q`, y la matriz entera los calcula todos de una vez. Después, `mejor` es una posición, no una puntuación: mira en qué lugar de `punt` está el valor mayor.',
          solution:
            '`punt = D @ q` da 16 cosenos, y `mejor = np.argmax(punt)` vale `1`: el documento «El hotel admite mascotas de menos de 10 kilos con un suplemento de 20 euros por noche.». Su coseno es solo $0{,}33$, bajo en valor absoluto, pero el siguiente (la prohibición de fumar en las habitaciones) llega a $0{,}17$: para un top-$k$ cuenta el orden, no que la puntuación sea alta.',
          requirements: [
            '`punt` existe y es un array de NumPy con 16 números, uno por documento, en el orden de las filas de `D`.',
            '`punt` contiene la puntuación de cada documento con la consulta `q`; se acepta una diferencia de hasta una milésima.',
            '`mejor` existe y es un número entero: la posición del documento que más puntúa, contando desde $0$.',
          ],
          starter: `import numpy as np
from embeddings import D, Q, documentos, consultas

# Embeddings reales (paraphrase-multilingual-MiniLM-L12-v2, 384 componentes): D, un documento por fila; Q, una consulta por fila
q = Q[1]  # «¿Puedo llevar a mi perro?»
# Guarda en punt la puntuación de cada documento con q, y en mejor la posición del documento que más puntúa
punt = None
mejor = None
`,
          checks: `import embeddings as _e
_exp = _e.D @ _e.Q[1]
_p = isinstance(punt, np.ndarray) and np.issubdtype(punt.dtype, np.number)
_ok = _p and punt.shape == (16,)
_m = isinstance(mejor, (int, np.integer)) and not isinstance(mejor, bool)
check(_p, "\`punt\` tiene que ser un array de NumPy con números: una puntuación por documento.")
check((not _p) or punt.shape != (16, 384), "\`punt\` es una matriz de 16 filas y 384 columnas: \`D * q\` multiplica componente a componente y no suma. El producto escalar de cada fila con \`q\` se calcula con \`D @ q\`.")
check((not _p) or punt.shape == (16, 384) or punt.shape == (16,), "\`punt\` tiene que tener 16 números, uno por documento.")
check((not _ok) or np.allclose(punt, _exp, atol=1e-3), "\`punt\` tiene que ser el producto escalar de cada fila de \`D\` con \`q\`. Como las filas tienen norma 1, es el coseno de cada documento con la consulta.")
check(_m, "\`mejor\` tiene que ser un número entero: la posición del documento que más puntúa.")
check((not _m) or mejor != int(np.argmin(_exp)), "\`mejor\` es la posición del documento que menos puntúa. Se busca el de mayor puntuación, y \`np.argmax\` da la posición del valor mayor; \`np.argmin\` da la del menor.")
check((not _m) or mejor == int(np.argmin(_exp)) or mejor == int(np.argmax(_exp)), "\`mejor\` tiene que ser la posición del documento con la puntuación más alta, contando desde 0.")
`,
          reference: `import numpy as np
from embeddings import D, Q, documentos, consultas

# Embeddings reales (paraphrase-multilingual-MiniLM-L12-v2, 384 componentes): D, un documento por fila; Q, una consulta por fila
q = Q[1]  # «¿Puedo llevar a mi perro?»
punt = D @ q
mejor = np.argmax(punt)
`,
        },
        {
          id: 'vecinos.ex02.2',
          type: 'codigo',
          prompt:
            'Un buscador devuelve los `k` documentos que más puntúan, no solo el primero. `np.argsort(x)` devuelve las posiciones que ordenarían `x` de menor a mayor, así que el principio de su lista son los peores. Con `-x` el orden se invierte: `np.argsort(-x)` pone primero las posiciones de las puntuaciones más altas. Y `lista[:k]` toma los `k` primeros elementos.\n\nEscribe la función `top_k(M, q, k)`: `M` es una matriz con un documento por fila, `q` es una consulta y la función devuelve las posiciones de las `k` filas de `M` que más puntúan con `q`, de la que más puntúa a la que menos. Las filas de `M` y `q` tienen norma $1$, así que la puntuación es el producto escalar.',
          hints: [
            'Primero las puntuaciones de todas las filas con `q`, de una vez; después, el orden de esas puntuaciones.',
            '`np.argsort` ordena de menor a mayor y entrega posiciones. Piensa en qué extremo de su lista están los mejores, o cómo darle la vuelta al orden.',
          ],
          explain:
            'Las posiciones de los mejores salen de ordenar las puntuaciones, pero `np.argsort` empieza por los peores. Si tu función devuelve los `k` peores, o los mejores en orden contrario, la mitad del trabajo ya está: falta el extremo correcto.',
          solution:
            '`return np.argsort(-(M @ q))[:k]`: `M @ q` puntúa todas las filas, el signo menos invierte el orden y `[:k]` se queda con las `k` primeras posiciones. Por ejemplo, con los documentos reales y la consulta «¿Cuánto cuesta aparcar el coche?», `top_k(D, Q[6], 3)` da `[3, 9, 1]`. Con `np.argsort(M @ q)[::-1][:k]` sale lo mismo.',
          requirements: [
            '`top_k` es una función que recibe una matriz `M`, una consulta `q` y un número `k`, y devuelve una lista o un array de NumPy de posiciones enteras.',
            'Devuelve exactamente `k` posiciones, de la fila que más puntúa a la que menos, y no las puntuaciones.',
            'Se prueba con otras matrices y consultas, también con los embeddings reales de `embeddings`, y con otros valores de `k`, desde $1$ hasta el número total de filas: usa el `k` que recibe, sin dar nunca un error.',
          ],
          starter: `import numpy as np


def top_k(M, q, k):
    # Devuelve las posiciones de las k filas de M que más puntúan con q, de mayor a menor puntuación
    return None
`,
          checks: `import embeddings as _e
_rng = np.random.default_rng(0)
_M = _rng.normal(size=(9, 6))
_M = _M / np.linalg.norm(_M, axis=1, keepdims=True)
_q = _rng.normal(size=6)
_q = _q / np.linalg.norm(_q)
_s = _M @ _q
_mejor3 = np.argsort(-_s)[:3]


def _llamar(M, q, k):
    try:
        r = np.asarray(top_k(M, q, k))
    except BaseException:
        return None
    return r


_r = _llamar(_M, _q, 3)
_hay = _r is not None and _r.ndim == 1 and _r.dtype != object
_tres = _hay and _r.shape == (3,)
_ent = _tres and np.issubdtype(_r.dtype, np.integer)
_dec = _tres and np.issubdtype(_r.dtype, np.floating)
_bien = _ent and np.array_equal(_r, _mejor3)
_otros = _llamar(_M, _q, 1), _llamar(_M, _q, 9), _llamar(_e.D, _e.Q[6], 3)
_gen = _bien and _otros[0] is not None and _otros[1] is not None and _otros[2] is not None and np.array_equal(_otros[0], np.argsort(-_s)[:1]) and np.array_equal(_otros[1], np.argsort(-_s)) and np.array_equal(_otros[2], np.argsort(-(_e.D @ _e.Q[6]))[:3])
check(_hay, "\`top_k\` tiene que devolver una lista o un array de NumPy con posiciones. Prueba con \`top_k(M, q, 3)\`: si no devuelve nada, falta el \`return\`; si da un error, revisa el código.")
check((not _hay) or _tres, "\`top_k(M, q, 3)\` tiene que devolver exactamente 3 posiciones. Hay que quedarse con las \`k\` primeras de la lista ordenada, no con todas ni con otra cantidad.")
check(not _dec, "\`top_k\` devuelve números decimales: parecen puntuaciones y no posiciones. Hay que devolver el número de fila de cada documento, que es lo que entrega \`np.argsort\`.")
check((not _ent) or not np.array_equal(_r, np.argsort(_s)[:3]), "\`top_k\` devuelve los \`k\` documentos que menos puntúan: \`np.argsort\` ordena de menor a mayor y los mejores quedan al final. Cambia el signo de las puntuaciones antes de ordenar, o toma el otro extremo.")
check((not _ent) or not np.array_equal(_r, _mejor3[::-1]), "\`top_k\` devuelve los \`k\` mejores pero en orden contrario: tiene que empezar por el documento que más puntúa.")
check((not _ent) or _bien or np.array_equal(_r, np.argsort(_s)[:3]) or np.array_equal(_r, _mejor3[::-1]), "\`top_k(M, q, 3)\` tiene que devolver las posiciones de las 3 filas de \`M\` con mayor producto escalar con \`q\`, la que más puntúa primero.")
check((not _bien) or _gen, "\`top_k\` tiene que funcionar con cualquier \`k\`, desde 1 hasta el número de filas, y también con los embeddings reales de \`embeddings\`. Comprueba que usas el \`k\` que recibe la función.")
`,
          reference: `import numpy as np


def top_k(M, q, k):
    return np.argsort(-(M @ q))[:k]
`,
        },
        {
          id: 'vecinos.ex02.3',
          type: 'codigo',
          prompt:
            'La función `top_k(M, q, k)` ya está escrita en el código inicial. Vamos a usarla con la consulta `q`, «¿Cuánto cuesta aparcar el coche?», sobre los 16 documentos reales de `D` (los embeddings son del modelo paraphrase-multilingual-MiniLM-L12-v2, de 384 componentes). `plt.bar(posiciones, alturas)` dibuja una barra por cada posición, con esa altura.\n\nGuarda en `punt` la puntuación de cada documento con `q`, dibuja una barra por documento con su puntuación, guarda en `mejores` las posiciones de los 3 documentos más parecidos a la consulta y en `textos` la lista de sus frases, tomadas de `documentos`, en el mismo orden.',
          hints: [
            'Las puntuaciones salen de `D @ q`; la gráfica y `mejores` las usan las dos. La gráfica tiene 16 barras, una por documento y en el orden de las filas.',
            '`mejores` sale de la función que ya tienes. Para `textos`, la frase de la posición `j` es `documentos[j]`: recorre `mejores` con una lista por comprensión.',
          ],
          explain:
            'Las posiciones de los documentos más parecidos salen de ordenar las puntuaciones, y sus frases, de buscar cada posición en la lista de textos. Mira en tu gráfica cuáles son las barras más altas y comprueba que `mejores` las nombra en ese orden.',
          solution:
            '`punt = D @ q`; `plt.bar(range(16), punt)` dibuja las 16 barras; `mejores = top_k(D, q, 3)` vale `[3, 9, 1]` y `textos` recoge las frases de esas posiciones. Los tres más parecidos son el aparcamiento (coseno $0{,}59$), el aeropuerto ($0{,}30$) y las mascotas ($0{,}28$): el primero se separa claramente de los demás, y el tercero ya tiene poco que ver con la pregunta. En la gráfica hay una barra alta y el resto bajas.',
          requirements: [
            '`punt` existe y es un array de NumPy con 16 números, uno por documento, con la puntuación de cada uno con `q`; se acepta una diferencia de hasta una milésima.',
            '`mejores` es una lista o un array de NumPy con 3 posiciones enteras, de 0 a 15: las de los 3 documentos más parecidos a la consulta, el que más puntúa primero.',
            '`textos` es una lista de 3 frases (textos, no posiciones), tomadas de `documentos`, que corresponden a esos 3 documentos y en el mismo orden.',
            'Hay una figura con 16 barras, una por documento y en el orden de las filas de `D`, cada una con la altura de la puntuación de su documento; se acepta una diferencia de hasta una milésima.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt
from embeddings import D, Q, documentos, consultas


def top_k(M, q, k):
    return np.argsort(-(M @ q))[:k]


q = Q[6]  # «¿Cuánto cuesta aparcar el coche?»
# Guarda en punt las puntuaciones, dibuja una barra por documento, guarda en mejores las posiciones de los 3 más parecidos y en textos sus frases
punt = None
mejores = None
textos = None
`,
          checks: `import embeddings as _e
_exp = _e.D @ _e.Q[6]
_top = np.argsort(-_exp)[:3]
_frases = [_e.documentos[int(j)] for j in _top]
_p = isinstance(punt, np.ndarray) and np.issubdtype(punt.dtype, np.number) and punt.shape == (16,)
_o = np.asarray(mejores) if isinstance(mejores, (np.ndarray, list, tuple)) else None
_ord = _o is not None and _o.shape == (3,) and np.issubdtype(_o.dtype, np.integer)
_orf = _o is not None and _o.shape == (3,) and np.issubdtype(_o.dtype, np.floating)
_t = list(textos) if isinstance(textos, (list, tuple)) or (isinstance(textos, np.ndarray) and textos.ndim == 1) else None
_ts = _t is not None and len(_t) == 3 and all(isinstance(x, str) for x in _t)
check(_p, "\`punt\` tiene que ser un array de NumPy con 16 números, una puntuación por documento.")
check((not _p) or np.allclose(punt, _exp, atol=1e-3), "\`punt\` tiene que ser el producto escalar de cada fila de \`D\` con \`q\`, es decir, el coseno de cada documento con la consulta.")
check(_ord or _orf, "\`mejores\` tiene que ser un array de NumPy (o una lista) con 3 posiciones, números enteros del 0 al 15.")
check(not _orf, "\`mejores\` tiene números decimales: parecen puntuaciones y no posiciones. Hacen falta las posiciones de los documentos.")
check((not _ord) or not np.array_equal(_o, np.argsort(_exp)[:3]), "\`mejores\` tiene los 3 documentos que menos puntúan. Se buscan los más parecidos a la consulta, los de mayor puntuación.")
check((not _ord) or not np.array_equal(_o, _top[::-1]), "\`mejores\` tiene los documentos buenos pero en orden contrario: tiene que empezar por el que más puntúa.")
check((not _ord) or np.array_equal(_o, _top) or np.array_equal(_o, np.argsort(_exp)[:3]) or np.array_equal(_o, _top[::-1]), "\`mejores\` tiene que contener las posiciones de los 3 documentos de mayor puntuación con la consulta, el que más puntúa primero.")
check(_t is not None, "\`textos\` tiene que ser una lista con las frases de los 3 documentos.")
check((_t is None) or _ts, "\`textos\` tiene que ser una lista de 3 frases, no de posiciones: la frase de cada posición se busca en \`documentos\`.")
check(not _ts or [str(x) for x in _t] == _frases, "\`textos\` tiene que contener las frases de los 3 documentos más parecidos, de la que más puntúa a la que menos, tomadas de \`documentos\`.")
_fig = len(plt.get_fignums()) > 0
_pat = [p for ax in plt.gcf().axes for p in ax.patches] if _fig else []
_barras = [h for _x, h in sorted((p.get_x() + p.get_width() / 2, float(p.get_height())) for p in _pat)]
check(_fig, "No hay ninguna figura: dibuja las puntuaciones con \`plt.bar\`.")
check((not _fig) or len(_pat) > 0, "No hay barras en la figura: dibújalas con \`plt.bar\`.")
check(len(_pat) == 0 or len(_pat) == 16, "La figura tiene barras de más o de menos: hace falta una por documento, 16 en total.")
check(len(_pat) != 16 or np.allclose(_barras, _exp, atol=1e-3), "La altura de cada barra tiene que ser la puntuación de su documento, y las barras tienen que seguir el orden de las filas de \`D\`.")
`,
          reference: `import numpy as np
import matplotlib.pyplot as plt
from embeddings import D, Q, documentos, consultas


def top_k(M, q, k):
    return np.argsort(-(M @ q))[:k]


q = Q[6]  # «¿Cuánto cuesta aparcar el coche?»
punt = D @ q
plt.bar(range(16), punt)
mejores = top_k(D, q, 3)
textos = [documentos[j] for j in mejores]
`,
        },
        {
          id: 'vecinos.ex02.4',
          type: 'codigo',
          prompt:
            'Las filas de `P` son 32 palabras sueltas, también con embeddings reales de 384 componentes y norma $1$; la palabra de la fila `j` es `palabras[j]`. Ahora la consulta es una palabra de la propia colección, «Lisboa», y se buscan sus vecinos. Hay una trampa: el vecino más cercano de una palabra es **ella misma**, con coseno $1$, la puntuación más alta posible. Los vecinos de verdad empiezan en el segundo puesto. `top_k(M, q, k)` ya está escrita en el código inicial.\n\nGuarda en `vecinos` la lista de las 3 palabras más parecidas a «Lisboa», sin contarla a ella, de la más parecida a la menos.',
          hints: [
            'Con `top_k(P, q, k)` obtienes posiciones, no palabras. La primera posición de la lista es la de la propia «Lisboa».',
            'Hay que pedir un puesto más de los que quieres y descartar el primero, o dejar a «Lisboa» fuera antes de ordenar. Después se traducen las posiciones a palabras con `palabras`.',
          ],
          explain:
            'Una palabra es su propio vecino más cercano, así que sin quitarla aparece la primera. Y `top_k` entrega posiciones: cada una se convierte en palabra mirando en la lista `palabras`.',
          solution:
            "`top_k(P, q, 4)` empieza por «Lisboa», con coseno $1$; sin ella, `vecinos` vale `['Portugal', 'París', 'España']`, con cosenos $0{,}87$, $0{,}76$ y $0{,}73$. Se obtiene con `[palabras[j] for j in top_k(P, q, 4)[1:]]`. Con palabras sueltas, algunas aparecen como vecinas de casi todo: «hombre» está entre los 5 vecinos de 14 de las otras 31 palabras, aunque no tenga nada que ver con ellas. Por eso en un buscador real conviene embeber frases con contexto y no palabras aisladas.",
          requirements: [
            '`vecinos` existe y es una lista de exactamente 3 palabras (textos, no posiciones).',
            'Son las 3 palabras de mayor coseno con «Lisboa», de la más parecida a la menos, y entre ellas no está la propia «Lisboa».',
          ],
          starter: `import numpy as np
from embeddings import P, palabras


def top_k(M, q, k):
    return np.argsort(-(M @ q))[:k]


i = palabras.index('Lisboa')
q = P[i]
# Guarda en vecinos la lista de las 3 palabras más parecidas a Lisboa, sin contarla a ella, de la más parecida a la menos
vecinos = None
`,
          checks: `import embeddings as _e
_i = _e.palabras.index("Lisboa")
_s = _e.P @ _e.P[_i]
_orden = [_e.palabras[int(j)] for j in np.argsort(-_s) if int(j) != _i]
_exp = _orden[:3]
_v = [x for x in vecinos] if isinstance(vecinos, (list, tuple)) or (isinstance(vecinos, np.ndarray) and vecinos.ndim == 1) else None
_txt = _v is not None and all(isinstance(x, str) for x in _v)
_tres = _txt and len(_v) == 3
_v = [str(x) for x in _v] if _txt else _v
check(_v is not None, "\`vecinos\` tiene que ser una lista con las 3 palabras más parecidas.")
check((_v is None) or _txt, "\`vecinos\` tiene que contener palabras y no números: las posiciones que devuelve \`top_k\` se traducen a palabras mirando en la lista \`palabras\`.")
check((not _txt) or len(_v) == 3, "\`vecinos\` tiene que tener exactamente 3 palabras.")
check((not _tres) or "Lisboa" not in _v, "«Lisboa» está entre sus propios resultados: su coseno consigo misma es 1, la puntuación más alta posible, y por eso aparece la primera. Hay que dejarla fuera y quedarse con las 3 siguientes.")
check((not _tres) or "Lisboa" in _v or _v != _exp[::-1], "\`vecinos\` tiene las palabras buenas pero en orden contrario: tiene que empezar por la más parecida.")
check((not _tres) or "Lisboa" in _v or set(_v) != set(_orden[-3:]), "\`vecinos\` tiene las 3 palabras menos parecidas a «Lisboa». Se buscan las más parecidas, que están al principio de la lista ordenada por puntuación de mayor a menor.")
check((not _tres) or "Lisboa" in _v or _v == _exp or _v == _exp[::-1] or set(_v) == set(_orden[-3:]), "\`vecinos\` tiene que contener las 3 palabras de mayor coseno con «Lisboa», sin contarla a ella, de la más a la menos parecida.")
`,
          reference: `import numpy as np
from embeddings import P, palabras


def top_k(M, q, k):
    return np.argsort(-(M @ q))[:k]


i = palabras.index('Lisboa')
q = P[i]
vecinos = [palabras[j] for j in top_k(P, q, 4)[1:]]
`,
        },
        {
          id: 'vecinos.ex02.5',
          type: 'codigo',
          prompt:
            'El **recall@k** mide si el buscador encuentra lo que debe: de los resultados relevantes, qué fracción aparece entre los `k` devueltos. En un RAG, lo que no entra en el top-`k` el modelo de lenguaje nunca lo ve. Para medirlo se necesitan parejas de consulta y respuesta correcta; aquí, con las palabras reales de `P` (embeddings de 384 componentes), la consulta es un país y el resultado relevante es su capital, como en `pares`. `top_k(M, q, k)` ya está escrita en el código inicial.\n\nEscribe `recall(k)`: la fracción de los 5 países de `pares` cuya capital aparece entre las `k` palabras más parecidas al país, sin contar el propio país. Guarda en `r1` el recall con `k = 1` y en `r5` el recall con `k = 5`.',
          hints: [
            'Para cada país: busca su posición en `palabras`, calcula sus `k` vecinos sin contarlo a él y mira si su capital está entre ellos.',
            'El país es su propio vecino más cercano: pide un puesto más de los que necesitas y descarta el primero. Al final, divide los aciertos entre el número de países.',
          ],
          explain:
            'Si el país se cuenta a sí mismo, ocupa el primer puesto y con `k = 1` ningún país encuentra su capital. Y el recall es una fracción de los países, no un recuento: comprueba que lo que devuelves está entre 0 y 1.',
          solution:
            'Con `recall(k)`, `r1 = recall(1)` vale $0{,}8$ y `r5 = recall(5)` vale $1$. La capital es el vecino más cercano de cuatro países, pero no de España: su vecino más cercano es «Lisboa» ($0{,}73$), y «Madrid» ($0{,}72$) es solo el quinto. El recall sube con $k$ porque se aceptan más resultados, a costa de devolver más ruido: con $k=1$ se pierde la capital de España, con $k=5$ se encuentran las cinco.',
          requirements: [
            '`recall` es una función que recibe un número `k` y devuelve un número: la fracción de los 5 países de `pares` cuya capital está entre las `k` palabras más parecidas al país, sin contar el propio país.',
            'Se prueba con varios valores de `k`, no solo con $1$ y $5$, y no puede dar un error.',
            '`r1` y `r5` son números: lo que devuelve `recall` con `k = 1` y con `k = 5`.',
          ],
          starter: `import numpy as np
from embeddings import P, palabras


def top_k(M, q, k):
    return np.argsort(-(M @ q))[:k]


pares = [('Francia', 'París'), ('España', 'Madrid'), ('Italia', 'Roma'), ('Alemania', 'Berlín'), ('Portugal', 'Lisboa')]


def recall(k):
    # Fracción de los países de pares cuya capital está entre las k palabras más parecidas al país, sin contar el país
    return None


# Guarda en r1 y r5 el recall con k = 1 y con k = 5
r1 = None
r5 = None
`,
          checks: `import embeddings as _e
_pares = [("Francia", "París"), ("España", "Madrid"), ("Italia", "Roma"), ("Alemania", "Berlín"), ("Portugal", "Lisboa")]


def _rec(k):
    h = 0
    for a, b in _pares:
        i = _e.palabras.index(a)
        s = _e.P @ _e.P[i]
        s[i] = -np.inf
        if _e.palabras.index(b) in np.argsort(-s)[:k]:
            h += 1
    return h / len(_pares)


_exp = {k: _rec(k) for k in (1, 2, 3, 4, 5, 6)}


def _llamar(k):
    try:
        return float(recall(k))
    except BaseException:
        return None


_v = {k: _llamar(k) for k in _exp}
_hay = all(x is not None for x in _v.values())
_a = _hay and _v[1] == 0
_b = _hay and _v[1] > 1
_bien = _hay and all(abs(_v[k] - _exp[k]) < 1e-9 for k in _exp)
_num = lambda x: isinstance(x, (int, float, np.integer, np.floating)) and not isinstance(x, bool)
check(_hay, "\`recall(k)\` tiene que devolver un número: la fracción de los países cuya capital aparece entre los \`k\` vecinos. Prueba con \`recall(1)\`: si no devuelve nada, falta el \`return\`.")
check(not _a, "\`recall(1)\` vale 0: ningún país encuentra su capital. La palabra más parecida a un país es el propio país, con coseno 1, y ocupa el único puesto. Hay que dejarlo fuera de los vecinos.")
check(not _b, "\`recall(1)\` vale más de 1: es un recuento de aciertos y no una fracción. Hay que dividir entre el número de países.")
check((not _hay) or _a or _b or _bien, "\`recall(k)\` tiene que ser la fracción de los 5 países cuya capital está entre las \`k\` palabras más parecidas al país, sin contar el país. Prueba con \`recall(2)\`: no devuelve el valor esperado.")
check(_num(r1) and _num(r5), "\`r1\` y \`r5\` tienen que ser números: el recall con \`k = 1\` y con \`k = 5\`.")
check((not (_num(r1) and _num(r5) and _bien)) or (abs(r1 - _exp[1]) < 1e-9 and abs(r5 - _exp[5]) < 1e-9), "\`r1\` y \`r5\` tienen que ser \`recall(1)\` y \`recall(5)\`.")
`,
          reference: `import numpy as np
from embeddings import P, palabras


def top_k(M, q, k):
    return np.argsort(-(M @ q))[:k]


pares = [('Francia', 'París'), ('España', 'Madrid'), ('Italia', 'Roma'), ('Alemania', 'Berlín'), ('Portugal', 'Lisboa')]


def recall(k):
    aciertos = 0
    for pais, capital in pares:
        i = palabras.index(pais)
        cercanas = [palabras[j] for j in top_k(P, P[i], k + 1)[1:]]
        if capital in cercanas:
            aciertos += 1
    return aciertos / len(pares)


r1 = recall(1)
r5 = recall(5)
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'vecinos.hoja.1',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento obtiene los 2 documentos que más puntúan entre 4, con `np.argsort`, para pasárselos a un modelo de lenguaje. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Calcula a mano la lista que da `np.argsort` con las cuatro puntuaciones y compárala con la del razonamiento.',
        'Fíjate en cuál es la puntuación más alta y en qué extremo de esa lista está su documento.',
      ],
      explain:
        'Comprueba hacia qué lado ordena `np.argsort` y en qué extremo de su lista están los documentos que más puntúan. El resto del razonamiento depende de eso.',
      solution:
        'La tercera línea está mal: `np.argsort` ordena de menor a mayor, así que los dos primeros de su lista son los que menos puntúan ($0{,}2$ y $0{,}5$). Los dos mejores son los dos últimos, 3 y 1; de mayor a menor, `[1, 3]`, que es lo que da `np.argsort(-s)[:2]`. La última línea hereda el error: el modelo recibiría los dos documentos que menos se parecen a la pregunta.',
      lines: [
        'Las puntuaciones de la consulta con los 4 documentos son s = [0,2; 0,9; 0,5; 0,7]',
        'np.argsort(s) da las posiciones que ordenan s de menor a mayor: [0, 2, 3, 1]',
        'Los dos documentos que más puntúan son los dos primeros de esa lista: los documentos 0 y 2',
        'Esos dos son los que se pasan al modelo de lenguaje como contexto',
      ],
      faultyLine: 2,
    },
    {
      id: 'vecinos.hoja.2',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien busca la palabra más parecida a la primera de las filas de `P`, unos embeddings unitarios de juguete (inventados y de 2 componentes; los reales tienen cientos), y guarda su posición en `vecino` (NumPy ya está importado como `np`). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Escribe a mano el valor de `puntos`: tres números, calculando el producto escalar de la primera fila con todas, ella incluida.',
        'Mira qué posición devuelve `np.argmax` y pregúntate si corresponde a una palabra distinta de la consulta.',
      ],
      explain:
        'Que el código se ejecute y devuelva una posición no prueba que sea la buscada. Calcula los tres productos escalares y pregúntate qué documento puntúa más cuando la consulta es uno de los documentos.',
      solution:
        'La última línea está mal: la fila 0 es la propia consulta, y su puntuación consigo misma es 1, la más alta posible (`puntos` vale `[1, 0.6, 0]`). `np.argmax` devuelve `0`, la propia palabra, y no su vecino. Hay que dejarla fuera antes, por ejemplo con `puntos[0] = -np.inf`; entonces `vecino` vale `1`, con coseno $0{,}6$.',
      lines: [
        'P = np.array([[1, 0], [0.6, 0.8], [0, 1]])',
        'q = P[0]',
        'puntos = P @ q',
        'vecino = np.argmax(puntos)',
      ],
      faultyLine: 3,
    },
    {
      id: 'vecinos.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula el recall@k de un buscador para una consulta. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Escribe qué cuenta el numerador del recall y qué cuenta el denominador.',
        'Después, decide qué le pasa al recall cuando se sube $k$ y se devuelven más documentos.',
      ],
      explain:
        'Revisa cada línea con la definición: de los documentos relevantes, qué fracción aparece entre los `k` devueltos. Comprueba el numerador, el denominador y el efecto de subir `k`.',
      solution:
        'No hay ningún error. El numerador son los relevantes que aparecen entre los devueltos (3) y el denominador, todos los relevantes (4): $3/4=0{,}75$. Al subir `k` se devuelven más documentos, así que no puede perderse ninguno de los ya encontrados: el recall no baja, aunque a cambio entra más ruido en el contexto.',
      lines: [
        'Hay 4 documentos relevantes para la consulta en una base de 1000',
        'Con k = 5, entre los 5 documentos devueltos hay 3 relevantes',
        'recall@5 = 3 / 4 = 0,75: se encuentra el 75 % de los relevantes',
        'Con k = 10 el recall no puede ser menor que 0,75, porque los 5 primeros siguen entre los 10',
      ],
      faultyLine: null,
    },
  ],
};
