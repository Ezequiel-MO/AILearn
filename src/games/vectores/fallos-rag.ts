import type { PlaneSpec, PlaneVector, Project } from '../../content/schema';
import { fallosRagWarmup } from './fallos-rag.calentamiento';
import { py } from '../py';

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

/** Los datos reales que se cuentan en los enunciados: mejor documento de cada consulta y su coseno. */
const MEJORES = [
  'q0 «¿A qué hora puedo desayunar?»: 0,77',
  'q1 «¿Puedo llevar a mi perro?»: 0,33',
  'q2 «¿Hay una sala para 250 asistentes?»: 0,64',
  'q3 «¿Hay una sala para 25 asistentes?»: 0,70',
  'q4 «¿El spa está incluido en el precio?»: 0,62',
  'q5 «¿Cuál es el código de la tarifa CONG-2025?»: 0,86',
  'q6 «¿Cuánto cuesta aparcar el coche?»: 0,59',
  'q7 «¿Cuánto cuesta un vuelo a Roma?»: 0,41',
  'q8 «¿Se puede fumar en la habitación?»: 0,72',
  'q9 «¿Cómo llego desde el aeropuerto?»: 0,56',
];

/** Tercer y último proyecto de la Órbita 3: dónde falla la búsqueda semántica de un RAG y qué se hace. */
export const fallosRag: Project = {
  id: 'fallos-rag',
  name: 'Por qué falla un RAG',
  sub: 'Parecido no es correcto',
  warmup: fallosRagWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'fallos-rag.ex00.1',
          type: 'manipular',
          purpose: {
            why: 'Un RAG siempre encuentra un documento «más parecido», aunque ninguno responda a la pregunta. Si le pasa al modelo un documento que no viene al caso, el modelo contesta igual, con aplomo, y se inventa la respuesta. El **umbral** de similitud es el filtro que decide cuándo es mejor decir «no lo sé»: elegirlo es una de las primeras decisiones al poner un RAG en marcha.',
            aim: 'Vas a ver qué zona del espacio acepta un umbral. Al colocar la consulta justo en el borde descubres que «coseno mayor o igual que $0{,}8$» dibuja un **cono** alrededor del documento, y que la longitud de las flechas no cuenta.',
            takeaway:
              'Un umbral sobre el coseno es un ángulo máximo: pasa todo lo que cae dentro del cono, sea largo o corto. Subir el umbral estrecha el cono (menos respuestas, más fiables); bajarlo lo ensancha (más respuestas, y más documentos fuera de tema). En un RAG real se elige probando con preguntas cuya respuesta ya sabes.',
          },
          prompt:
            'Un RAG fija un **umbral** sobre el coseno y solo acepta un documento si su coseno con la consulta es mayor o igual que él. Este plano es un juguete **inventado** de dos dimensiones (los embeddings reales tienen cientos) que sirve de ventana. Como el coseno solo depende del ángulo, un umbral de $0{,}8$ equivale a un ángulo de como mucho $36{,}9^\\circ$: acepta todo lo que cae dentro de un **cono** alrededor de la consulta.\n\nUn documento está en $\\vec{d}=(3, 4)$, fijo. Coloca la consulta $\\vec{q}$, de longitud $5$, justo en el borde del cono: coseno $0{,}8$ con $\\vec{d}$.',
          hints: [
            'La lectura del ángulo tiene que marcar unos $36{,}9^\\circ$ entre $\\vec{q}$ y $\\vec{d}$, y la de la norma, $5$.',
            'A $36{,}9^\\circ$ de $\\vec{d}$ hay dos direcciones, una a cada lado. Con longitud $5$ y la rejilla de $1$, solo una de las dos cae en un punto de la rejilla.',
          ],
          explain:
            'La longitud de $\\vec{q}$ no interviene en el coseno: la meta de la norma solo sirve para que la posición sea única. Lo que importa es el ángulo con $\\vec{d}$, y el borde del cono es donde ese ángulo vale justo lo que marca el umbral.',
          solution:
            '$\\vec{q}=(0, 5)$: $\\cos\\theta=\\dfrac{3\\cdot0+4\\cdot5}{5\\cdot5}=0{,}8$, es decir, $\\theta\\approx36{,}9^\\circ$. El otro borde del cono, al otro lado de $\\vec{d}$, no cae en un punto de la rejilla. Cualquier consulta dentro del cono, más larga o más corta, pasa el umbral; fuera, no.',
          plane: plane(
            [arrow('d', [3, 4], false), arrow('q', [4, 0], true)],
            ['components', 'norm', 'cos', 'angle'],
            ['q', 'd'],
          ),
          goals: [
            { metric: 'cos', of: ['q', 'd'], target: 0.8, tol: 0.01 },
            { metric: 'norm', of: ['q'], target: 5, tol: 0.01 },
          ],
        },
        {
          id: 'fallos-rag.ex00.2',
          type: 'manipular',
          purpose: {
            why: 'Cuando la base tiene muchos documentos parecidos, el umbral decide cuáles llegan al modelo como contexto. Si deja pasar de más, el modelo recibe ruido que lo despista; si deja pasar de menos, le falta la información para contestar. Ver qué documentos caen dentro del cono de una consulta es la forma de razonar sobre ese reparto.',
            aim: 'Vas a colocar una consulta que deje un documento dentro de su cono y otro fuera, por poco, y a comprobar que dos cosenos bastan para fijar la dirección de la consulta.',
            takeaway:
              'Con un umbral de $0{,}9$, un coseno de $0{,}96$ entra y uno de $0{,}80$ se queda fuera, aunque los dos documentos se parezcan bastante a la consulta. El umbral es una frontera dura: documentos casi igual de parecidos pueden caer a lados distintos. Por eso un RAG suele combinarlo con el top-k en vez de fiarse solo de uno de los dos.',
          },
          prompt:
            'Con un umbral de $0{,}9$, la búsqueda devuelve los documentos cuyo coseno con la consulta alcanza ese valor, y ninguno más. Los documentos de este juguete **inventado** (de dos dimensiones; los reales tienen cientos) son $\\vec{a}=(5, 0)$ y $\\vec{b}=(3, 4)$, fijos. Coloca la consulta $\\vec{q}$ con coseno $0{,}80$ con $\\vec{a}$ y $0{,}96$ con $\\vec{b}$: así $\\vec{b}$ pasa el umbral y $\\vec{a}$ no. La lectura compara $\\vec{q}$ con $\\vec{a}$; el coseno con $\\vec{b}$ lo calculas con las componentes.',
          hints: [
            'Un coseno de $0{,}80$ con $\\vec{a}$, que está sobre el eje horizontal, quiere decir que $\\vec{q}$ forma $36{,}9^\\circ$ con ese eje: hay dos direcciones, una por encima y otra por debajo.',
            'Calcula $\\vec{q}\\cdot\\vec{b}$ en las dos direcciones y comprueba cuál da $0{,}96$ al dividir entre las dos normas.',
          ],
          explain:
            'Cada documento que pasa el umbral es un documento dentro del cono de la consulta. Aquí la consulta tiene a $\\vec{b}$ dentro de su cono y a $\\vec{a}$ fuera, por poco. La condición con $\\vec{a}$ deja dos direcciones; la de $\\vec{b}$ elige una.',
          solution:
            '$\\vec{q}=(4, 3)$: $\\cos(\\vec{q},\\vec{a})=\\dfrac{20}{5\\cdot5}=0{,}80$ y $\\cos(\\vec{q},\\vec{b})=\\dfrac{12+12}{5\\cdot5}=0{,}96$. La otra posición con $0{,}80$ de $\\vec{a}$, $(4, -3)$, puntúa $0$ con $\\vec{b}$. Con el umbral $0{,}9$ la búsqueda devuelve solo $\\vec{b}$.',
          plane: plane(
            [arrow('a', [5, 0], false), arrow('b', [3, 4], false), arrow('q', [1, 1], true)],
            ['components', 'cos', 'angle'],
            ['q', 'a'],
          ),
          goals: [
            { metric: 'cos', of: ['q', 'a'], target: 0.8, tol: 0.01 },
            { metric: 'cos', of: ['q', 'b'], target: 0.96, tol: 0.01 },
          ],
        },
        {
          id: 'fallos-rag.ex00.3',
          type: 'manipular',
          purpose: {
            why: 'Las preguntas que mezclan dos temas, o que la base no cubre, son las que más respuestas inventadas provocan: la búsqueda encuentra algo a medias y el modelo rellena el resto. Un RAG bien hecho detecta ese caso y contesta «no lo sé» o pide que se concrete la pregunta.',
            aim: 'Vas a colocar una consulta que se parezca lo mismo a dos documentos de temas distintos y a comprobar que, con un umbral de $0{,}8$, se queda fuera de los dos conos a la vez.',
            takeaway:
              'El umbral no busca «el menos malo»: si ningún coseno lo alcanza, no hay contexto y lo honesto es no contestar. Sin umbral, la búsqueda habría devuelto uno de los dos documentos con $0{,}71$ y el modelo habría contestado sobre un solo tema, como si la pregunta fuera solo de ese.',
          },
          prompt:
            'Con un umbral de $0{,}8$ puede ocurrir que **ningún** documento pase, y entonces el sistema contesta «no lo sé». Los documentos de este juguete **inventado** (de dos dimensiones; los reales tienen cientos) son $\\vec{a}=(5, 0)$ y $\\vec{b}=(0, 5)$, fijos, de temas distintos. Coloca la consulta $\\vec{q}$, que mezcla los dos temas, con coseno $0{,}71$ con $\\vec{a}$ y $0{,}71$ con $\\vec{b}$. La lectura compara $\\vec{q}$ con $\\vec{a}$; el coseno con $\\vec{b}$ lo calculas con las componentes.',
          hints: [
            'Si el coseno con $\\vec{a}$ y con $\\vec{b}$ es el mismo, $\\vec{q}$ forma el mismo ángulo con los dos ejes: está en la bisectriz.',
            'La lectura del ángulo tiene que marcar unos $45^\\circ$. La longitud de $\\vec{q}$ no importa.',
          ],
          explain:
            'Una consulta entre dos temas queda lejos de los dos conos de aceptación por igual. El umbral no elige «el menos malo»: si nadie lo alcanza, no hay resultado.',
          solution:
            '$\\vec{q}=(3, 3)$: $\\cos(\\vec{q},\\vec{a})=\\dfrac{15}{\\sqrt{18}\\cdot5}\\approx0{,}71$ y lo mismo con $\\vec{b}$. Como $0{,}71<0{,}8$, ningún documento pasa y la respuesta es «no lo sé». Sirve cualquier punto de la bisectriz, de $(1, 1)$ a $(6, 6)$.',
          plane: plane(
            [arrow('a', [5, 0], false), arrow('b', [0, 5], false), arrow('q', [5, 1], true)],
            ['components', 'cos', 'angle'],
            ['q', 'a'],
          ),
          goals: [
            { metric: 'cos', of: ['q', 'a'], target: 0.71, tol: 0.01 },
            { metric: 'cos', of: ['q', 'b'], target: 0.71, tol: 0.01 },
          ],
        },
        {
          id: 'fallos-rag.ex00.4',
          type: 'manipular',
          purpose: {
            why: 'Los embeddings recogen **de qué habla** una frase mucho mejor que **lo que afirma**. «El hotel admite mascotas.» y «El hotel no admite mascotas.» hablan de lo mismo, así que quedan juntos. Un RAG puede recuperar justo el documento que dice lo contrario, y el modelo contestar lo opuesto a la verdad sin dudar.',
            aim: 'Vas a colocar el documento negado casi en la misma dirección que el afirmativo y a ver que la consulta puntúa casi igual con los dos: ningún umbral los separa.',
            takeaway:
              'La similitud entre embeddings no distingue un «sí» de un «no». En un RAG real, el filtro por coseno se completa con un paso que lee el texto: un reordenador (*reranker*) que lee la pregunta y el documento juntos, o el propio modelo comprobando qué dice cada documento antes de responder.',
          },
          prompt:
            'La **negación** cambia el sentido de una frase, pero casi no mueve su embedding. Este juguete es **inventado** y de dos dimensiones (los embeddings reales tienen cientos): $\\vec{q}=(4, 1)$ es la consulta «¿admite mascotas?», $\\vec{a}=(5, 1)$ el documento «El hotel admite mascotas.» (los dos fijos) y $\\vec{b}$ el documento «El hotel no admite mascotas.». Coloca $\\vec{b}$ con coseno $0{,}98$ con $\\vec{q}$ y $0{,}97$ con $\\vec{a}$: casi en la dirección de $\\vec{a}$. La lectura compara $\\vec{q}$ con $\\vec{b}$; el coseno con $\\vec{a}$ lo calculas con las componentes.',
          hints: [
            'La lectura del coseno de $\\vec{q}$ con $\\vec{b}$ tiene que marcar $0{,}98$: $\\vec{b}$ forma un ángulo pequeño con $\\vec{q}$, de unos $11^\\circ$.',
            'Para el segundo coseno, calcula $\\vec{a}\\cdot\\vec{b}$ y divide entre las dos normas. Pruébalo con las posiciones que ya cumplen la primera condición.',
          ],
          explain:
            'Con $\\vec{b}$ casi paralelo a $\\vec{a}$, la consulta puntúa casi lo mismo con los dos documentos. Un umbral que aceptase a uno y rechazase al otro tendría que caer en un hueco diminuto.',
          solution:
            '$\\vec{b}=(4, 2)$: $\\cos(\\vec{q},\\vec{b})=\\dfrac{18}{\\sqrt{17}\\sqrt{20}}\\approx0{,}98$ y $\\cos(\\vec{a},\\vec{b})=\\dfrac{22}{\\sqrt{26}\\sqrt{20}}\\approx0{,}96$. La consulta puntúa prácticamente $1$ con $\\vec{a}$ y $0{,}98$ con $\\vec{b}$, y ningún umbral razonable los separa. Con los embeddings reales de esta órbita pasa algo parecido: «El hotel admite mascotas.» y «El hotel no admite mascotas.» tienen coseno $0{,}57$, casi como «El hotel admite mascotas.» y «Se aceptan perros y gatos.», que dice lo mismo ($0{,}61$).',
          plane: plane(
            [
              arrow('q', [4, 1], false, '¿admite?'),
              arrow('a', [5, 1], false, 'admite'),
              arrow('b', [-3, 2], true, 'no admite'),
            ],
            ['components', 'cos', 'angle'],
            ['q', 'b'],
          ),
          goals: [
            { metric: 'cos', of: ['q', 'b'], target: 0.98, tol: 0.01 },
            { metric: 'cos', of: ['a', 'b'], target: 0.97, tol: 0.01 },
          ],
        },
        {
          id: 'fallos-rag.ex00.5',
          type: 'manipular',
          purpose: {
            why: 'Es tentador fijar un solo umbral para todas las preguntas, pero cada consulta tiene su propia escala de cosenos: una pregunta puede puntuar bajo con todos los documentos aunque uno la conteste, y otra puntuar alto con alguno sin que ninguno la conteste. Un umbral fijo acaba rechazando preguntas que tienen respuesta y aceptando preguntas que no la tienen.',
            aim: 'Vas a colocar dos consultas, una con respuesta en la base y otra sin ella, de modo que la que no tiene respuesta puntúe **más** que la que sí. Verás que ningún umbral acierta con las dos a la vez.',
            takeaway:
              'Un coseno de $0{,}8$ no significa «buena respuesta» en general: solo se compara bien con los demás cosenos de la misma consulta. En un RAG real, el umbral se ajusta con un conjunto de preguntas de prueba y se combina con otras señales: el top-k, un reordenador y un modelo al que se le permite decir «no está en los documentos».',
          },
          prompt:
            'Otro fallo: **las puntuaciones de consultas distintas no son comparables**. Este juguete es **inventado** y de dos dimensiones (los embeddings reales tienen cientos). Dos documentos fijos: $\\vec{m}=(5, 0)$, la política de mascotas, y $\\vec{p}=(0, 5)$, el aparcamiento. La consulta $\\vec{q}_1$, «¿Puedo llevar a mi perro?», tiene su respuesta en $\\vec{m}$; la consulta $\\vec{q}_2$, «¿Cuánto cuesta un vuelo a Roma?», no tiene respuesta en la base, y su documento más parecido es $\\vec{p}$. Coloca $\\vec{q}_1$ con coseno $0{,}6$ con $\\vec{m}$ y $\\vec{q}_2$ con coseno $0{,}8$ con $\\vec{p}$. La lectura compara $\\vec{q}_1$ con $\\vec{m}$; la otra la calculas con las componentes.',
          hints: [
            'Para $\\vec{q}_1$, un coseno de $0{,}6$ con $\\vec{m}$ (sobre el eje horizontal) corresponde a un ángulo de unos $53^\\circ$ con ese eje.',
            'Para $\\vec{q}_2$, el coseno con $\\vec{p}$ (sobre el eje vertical) es la componente vertical de $\\vec{q}_2$ dividida entre su longitud.',
          ],
          explain:
            'Cada consulta tiene su propia escala de cosenos. Aquí la consulta que sí tiene respuesta puntúa menos que la que no la tiene; mira qué le pasaría a cualquier umbral.',
          solution:
            '$\\vec{q}_1=(3, 4)$ da $\\cos(\\vec{q}_1,\\vec{m})=\\dfrac{15}{5\\cdot5}=0{,}6$, y $\\vec{q}_2=(3, 4)$ da $\\cos(\\vec{q}_2,\\vec{p})=\\dfrac{20}{5\\cdot5}=0{,}8$ (para $\\vec{q}_1$ sirve también $(3, -4)$ y para $\\vec{q}_2$, $(-3, 4)$). Un umbral que deje pasar el $0{,}6$ de la consulta buena deja pasar el $0{,}8$ de la que no tiene respuesta. En los datos reales ocurre: la respuesta de «¿Puedo llevar a mi perro?» puntúa $0{,}33$ y el mejor documento de «¿Cuánto cuesta un vuelo a Roma?», $0{,}41$.',
          plane: plane(
            [
              arrow('m', [5, 0], false, 'm: mascotas'),
              arrow('p', [0, 5], false, 'p: aparcamiento'),
              arrow('q1', [1, 1], true, 'q₁: perro'),
              arrow('q2', [-1, 1], true, 'q₂: vuelo'),
            ],
            ['components', 'cos', 'angle'],
            ['q1', 'm'],
          ),
          goals: [
            { metric: 'cos', of: ['q1', 'm'], target: 0.6, tol: 0.01 },
            { metric: 'cos', of: ['q2', 'p'], target: 0.8, tol: 0.01 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'fallos-rag.ex01.1',
          type: 'vector',
          purpose: {
            why: 'Antes de poner un RAG delante de clientes, por ejemplo en el chat de reservas de un hotel, hay que decidir a cuántas preguntas se atreve a contestar. Esa parte se llama **cobertura**, y la fija el umbral. Con un umbral alto, muchos clientes se quedan sin respuesta y pasan a una persona; con uno bajo, el sistema contesta a todo, también a lo que su base no cubre.',
            aim: 'Vas a aplicar tres umbrales a los cosenos reales de diez preguntas de huéspedes y a contar a cuántas contesta el sistema con cada uno. Verás cómo cae la cobertura al subir el corte y qué preguntas se quedan fuera primero.',
            takeaway:
              'Al subir el umbral la cobertura solo puede bajar, y se pierden primero las preguntas de coseno más bajo, tengan o no respuesta: q1, la del perro, cae igual que q7, la del vuelo. La cobertura dice a cuántas se contesta, no a cuántas se contesta bien. Para elegir el umbral hace falta además un recuento de aciertos con preguntas cuya respuesta se conoce.',
          },
          prompt: `Estos son los cosenos **reales** (modelo paraphrase-multilingual-MiniLM-L12-v2, 384 componentes) entre cada consulta de un huésped y su documento más parecido, en la base de conocimiento de un hotel de congresos con 16 documentos:\n\n${MEJORES.map((m) => `- ${m}`).join('\n')}\n\nUn sistema con umbral $u$ contesta a una consulta si su mejor coseno es mayor o igual que $u$ y, si no, dice «no lo sé». ¿A cuántas de las 10 consultas contesta con $u=0{,}30$, con $u=0{,}45$ y con $u=0{,}60$? Escribe los tres números, en ese orden.`,
          hints: [
            'Para cada umbral, cuenta las consultas cuyo mejor coseno lo alcanza. Con el más bajo, mira cuáles se quedan fuera, si hay alguna.',
            'Subir el umbral nunca hace que el sistema conteste a más consultas: los tres números no pueden crecer.',
          ],
          explain:
            'Cada umbral es un corte sobre la misma lista de diez cosenos. Las consultas de coseno más bajo son las primeras que se quedan sin respuesta al subir el corte, tengan o no tengan respuesta en la base.',
          solution:
            'Con $u=0{,}30$ pasan las diez consultas (el coseno más bajo es $0{,}33$). Con $u=0{,}45$ quedan fuera q1 ($0{,}33$) y q7 ($0{,}41$): contesta a $8$. Con $u=0{,}60$ quedan fuera además q6 ($0{,}59$) y q9 ($0{,}56$): contesta a $6$. Los tres números son $10$, $8$ y $6$. Fíjate en que q1 sí tiene respuesta en la base (la política de mascotas) y q7 no, y el umbral las trata igual.',
          answer: [10, 8, 6],
          tol: 0,
        },
        {
          id: 'fallos-rag.ex01.2',
          type: 'opcion',
          purpose: {
            why: 'Muchas consultas reales llevan una cantidad que tiene que cumplirse: una sala para 250 personas, un portátil por menos de 1000 euros, una habitación para cuatro. El buscador de una tienda o la base de conocimiento de un hotel de congresos las recibe a diario, y la búsqueda por embeddings las trata como texto parecido, no como una condición que se cumple o no.',
            aim: 'Vas a leer los cuatro documentos mejor puntuados para la consulta de la sala y a decidir qué devuelve la búsqueda y por qué no sirve. Verás si el coseno ordena las salas por su capacidad o por lo mucho que se parecen sus frases.',
            takeaway:
              'Un embedding guarda que una frase habla de capacidad, no cuánta capacidad dice: «30 personas» y «300 personas» quedan casi en el mismo sitio. Cuando la pregunta lleva una condición numérica, un RAG la saca de la búsqueda semántica y la aplica como filtro sobre datos estructurados (la capacidad de cada sala en su propio campo); al coseno le deja solo el tema.',
          },
          prompt:
            'La consulta q2, «¿Hay una sala para 250 asistentes?», se compara con los 16 documentos de la base del hotel con el modelo paraphrase-multilingual-MiniLM-L12-v2. Los cuatro cosenos más altos son:\n\n- d12 «Los grupos de más de 20 habitaciones tienen una persona de contacto asignada.»: 0,64\n- d5 «La sala Levante tiene capacidad para 30 personas en formato reunión.»: 0,61\n- d4 «La sala Mediterráneo tiene capacidad para 300 personas en formato teatro.»: 0,54\n- d10 «El gimnasio está abierto las 24 horas para los huéspedes.»: 0,42\n\nLa única sala donde caben 250 personas es la Mediterráneo. ¿Qué devuelve la búsqueda y por qué es un fallo?',
          hints: [
            'La búsqueda devuelve el documento de mayor coseno. Mira de qué trata y si responde a la pregunta.',
            'Compara el coseno de la sala de 30 personas con el de la sala de 300 y piensa qué mide el coseno y qué no mide.',
          ],
          explain:
            'El documento que gana no es el que responde. Fíjate en qué dato de la pregunta (un número) tendría que pesar y si un coseno entre embeddings hace cuentas con él.',
          solution:
            'Devuelve d12, que no habla de salas, y la sala de $30$ personas ($0{,}61$) queda por delante de la de $300$ ($0{,}54$), que es la única que sirve. El coseno mide el parecido de tema y de forma de las frases, no si $250$ cabe en $300$ y no en $30$: para el modelo «300 personas» y «30 personas» son casi la misma frase (su coseno es $0{,}84$). Ni siquiera un umbral lo arregla: el documento correcto es el tercero.',
          options: [
            'Devuelve d12, que no habla de salas, y pone la sala de 30 personas por delante de la de 300: el coseno mide parecido de tema, no si el número encaja',
            'Devuelve d4 con 0,54, y acierta: el modelo ha comprobado que 300 es mayor que 250',
            'Devuelve d12, pero no es un fallo: tiene el coseno más alto y, por definición, es el documento más relevante',
            'Devuelve d5 con 0,61, y el fallo es que la sala de 30 personas debería puntuar 0 porque 30 es menor que 250',
          ],
          correct: 0,
        },
        {
          id: 'fallos-rag.ex01.3',
          type: 'numero',
          purpose: {
            why: 'Nadie sabe si su RAG funciona sin medirlo. La práctica habitual es reunir un conjunto de preguntas **etiquetadas**, con la respuesta correcta de cada una (también «no está en la base»), y contar los aciertos cada vez que se cambia algo: el umbral, el modelo de embeddings o los documentos. Es la misma idea que el conjunto de prueba de cualquier modelo de aprendizaje automático.',
            aim: 'Vas a corregir a mano el sistema del hotel con un umbral de $0{,}35$: decidir en cada consulta si contesta, si devuelve el documento correcto y si se calla cuando debe. Verás qué tipos de fallo quedan y si el umbral ayuda o estorba.',
            takeaway:
              'Los fallos no son todos iguales: callarse cuando había respuesta, devolver el documento equivocado y contestar sin tener respuesta piden arreglos distintos. Contarlos por separado, y no solo el total, dice qué cambiar. Y el umbral se elige con este recuento: si al ponerlo bajan los aciertos, está mal puesto, por razonable que parezca.',
          },
          prompt: `Un conjunto de 10 consultas **etiquetadas** permite medir un sistema. Para cada consulta de la base del hotel (16 documentos, d0 a d15; cosenos reales del modelo paraphrase-multilingual-MiniLM-L12-v2) se conoce el documento mejor puntuado, su coseno y la respuesta correcta:\n\n- q0: recupera d0 con 0,77; correcto: d0\n- q1: recupera d1 con 0,33; correcto: d1\n- q2: recupera d12 con 0,64; correcto: d4\n- q3: recupera d5 con 0,70; correcto: d5\n- q4: recupera d14 con 0,62; correcto: d14\n- q5: recupera d13 con 0,86; correcto: ninguno, la base no tiene el código CONG-2025\n- q6: recupera d3 con 0,59; correcto: d3\n- q7: recupera d3 con 0,41; correcto: ninguno, la base no habla de vuelos\n- q8: recupera d15 con 0,72; correcto: d15\n- q9: recupera d9 con 0,56; correcto: d9\n\nCon umbral $u=0{,}35$, el sistema devuelve el documento si su coseno alcanza $u$ y, si no, dice «no lo sé». Es un acierto devolver el documento correcto, o decir «no lo sé» cuando no hay respuesta. ¿Cuántas de las 10 consultas se contestan bien?`,
          hints: [
            'Con $u=0{,}35$ dicen «no lo sé» las consultas cuyo mejor coseno es menor que $0{,}35$. Mira cuáles son y si era lo correcto.',
            'Para las demás, compara el documento que devuelve con el correcto. Las dos consultas sin respuesta solo se contestan bien si el sistema se calla.',
          ],
          explain:
            'En cada consulta hay que decidir dos cosas: si el sistema contesta y, cuando contesta, si el documento es el correcto. Comprueba también qué pasa con las consultas sin respuesta.',
          solution:
            'Con $u=0{,}35$ solo q1 ($0{,}33$) dice «no lo sé», y tenía respuesta (d1): fallo. q2 devuelve d12 en vez de d4: fallo. q5 devuelve d13 y no tenía respuesta: fallo. q7 ($0{,}41$) alcanza el umbral y devuelve d3, y tampoco tenía respuesta: fallo. Las otras seis (q0, q3, q4, q6, q8 y q9) aciertan: son $6$ de $10$. Sin umbral serían $7$: un umbral mal elegido puede empeorar el sistema.',
          answer: 6,
          tol: 0,
        },
        {
          id: 'fallos-rag.ex01.4',
          type: 'opcion',
          purpose: {
            why: 'Un RAG tiene dos piezas con dos trabajos: la búsqueda elige qué documentos se leen y el modelo de lenguaje decide qué se contesta. Cuando el chat de atención al cliente responde mal, lo primero es saber cuál de las dos ha fallado, porque se arreglan de forma distinta: la búsqueda, con otro modelo de embeddings o un reordenador; la respuesta, con otras instrucciones o con otro modelo.',
            aim: 'Vas a leer una recuperación real, la del spa, y a decidir qué dice el coseno y qué no dice. Verás dónde termina el trabajo de la búsqueda y dónde empieza el del modelo que redacta la respuesta.',
            takeaway:
              'Un coseno alto confirma que la búsqueda ha traído el documento del tema, nada más; si el documento dice «sí» o «no» lo lee el modelo. Por eso se evalúan las dos piezas por separado: si se ha recuperado el documento correcto y si la respuesta es fiel a lo que ese documento dice. Medirlas juntas esconde dónde está el fallo.',
          },
          prompt:
            'La consulta q4, «¿El spa está incluido en el precio?», recupera con el modelo paraphrase-multilingual-MiniLM-L12-v2 el documento d14, «El spa no está incluido en la tarifa y se paga aparte.», con coseno $0{,}62$, el más alto de los 16 documentos de la base del hotel. ¿Qué se puede afirmar?',
          hints: [
            'Pregúntate qué mide el coseno entre la pregunta y el documento y si esa medida distingue un «sí» de un «no».',
            'Piensa quién lee el documento recuperado y decide la respuesta final en un RAG.',
          ],
          explain:
            'Recuperar el documento adecuado y contestar bien son dos pasos distintos. Revisa qué dice el documento y qué información da el coseno.',
          solution:
            'La recuperación ha acertado: d14 es el documento que habla del spa. Pero el coseno solo dice que pregunta y documento tratan lo mismo, no si la respuesta es sí o no. Eso lo decide el modelo de lenguaje que lee el documento, y d14 dice que **no** está incluido. Un coseno alto con un documento tampoco prueba que el documento dé la razón a la pregunta.',
          options: [
            'La recuperación ha acertado, pero el coseno no dice si la respuesta es sí o no: eso lo decide el modelo de lenguaje al leer el documento, que dice que no',
            'El coseno alto indica que la respuesta es sí: pregunta y documento hablan de lo mismo y se parecen mucho',
            'La recuperación ha fallado: tendría que devolver un documento que diga que el spa está incluido',
            'Basta subir el umbral por encima de 0,62 para que el sistema conteste que no está incluido',
          ],
          correct: 0,
        },
        {
          id: 'fallos-rag.ex01.5',
          type: 'opcion',
          purpose: {
            why: 'Los RAG que funcionan en producción casi nunca se quedan en la búsqueda por embeddings sola: la combinan con búsqueda por palabras clave, filtros por metadatos, un reordenador y la opción de no contestar. Saber qué fallo arregla cada pieza evita añadirlas todas a ciegas, porque cada una cuesta tiempo de respuesta, dinero o mantenimiento.',
            aim: 'Vas a casar cuatro fallos reales del hotel con cuatro remedios habituales, mirando la causa de cada fallo: un código exacto, una cantidad, una negación y una pregunta sin respuesta. Verás que cada remedio ataca una causa distinta.',
            takeaway:
              'Ante un fallo, primero se busca la causa y después la pieza: coincidencia literal para códigos y nombres propios, filtros para condiciones exactas, reordenación para lo que la frase afirma y un umbral para callarse. Ninguna sustituye a las demás, y el conjunto de preguntas etiquetadas dice si cada pieza nueva mejora el sistema o no.',
          },
          prompt:
            'Un RAG tiene cuatro fallos de recuperación y cada uno tiene un remedio habitual. Los fallos son: (1) la consulta lleva un código exacto, CONG-2025, y recupera el documento con CONG-2026 con coseno $0{,}86$; (2) la consulta pide una sala para 250 y el sistema pone por delante la de 30 personas; (3) «El hotel no admite mascotas.» puntúa casi como «El hotel admite mascotas.»; (4) la pregunta no tiene respuesta en la base y el sistema devuelve, aun así, el documento que más puntúa. Los remedios son: búsqueda por palabras clave o híbrida, filtro por metadatos (la capacidad de cada sala como dato aparte), reordenación con un modelo que lee consulta y documento juntos, y umbral con respuesta «no lo sé». ¿Qué remedio encaja con cada fallo, en el orden (1), (2), (3), (4)?',
          hints: [
            'Un código exacto se busca por coincidencia literal de las palabras, que es lo que hace la búsqueda por palabras clave. Un número que debe cumplir una condición se puede tratar como un dato aparte, no como parecido.',
            'Para la negación hace falta algo que lea las dos frases a la vez. Para la pregunta sin respuesta, algo que permita no contestar.',
          ],
          explain:
            'Cada remedio ataca la causa de un fallo: una busca coincidencias literales, otra descarta por reglas exactas, otra lee consulta y documento juntos y otra se niega a contestar si no hay un buen candidato. Casa cada causa con su remedio.',
          solution:
            'El código (1) se resuelve con búsqueda por palabras clave o híbrida, que exige que «CONG-2025» aparezca tal cual. La capacidad (2) se resuelve con un filtro por metadatos: «capacidad $\\ge 250$» es una condición exacta, no un parecido. La negación (3) mejora con una reordenación: un modelo que lee consulta y documento juntos ve el «no», que el embedding apenas refleja. La pregunta sin respuesta (4) pide un umbral y la respuesta «no lo sé», aunque, como has visto, un solo umbral no separa bien: por eso conviene medir con un conjunto de preguntas etiquetadas.',
          options: [
            '(1) palabras clave o híbrida; (2) filtro por metadatos; (3) reordenación; (4) umbral y «no lo sé»',
            '(1) umbral y «no lo sé»; (2) palabras clave o híbrida; (3) filtro por metadatos; (4) reordenación',
            '(1) filtro por metadatos; (2) reordenación; (3) umbral y «no lo sé»; (4) palabras clave o híbrida',
            '(1) reordenación; (2) umbral y «no lo sé»; (3) palabras clave o híbrida; (4) filtro por metadatos',
          ],
          correct: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'fallos-rag.ex02.1',
          type: 'codigo',
          prompt:
            'Aquí los embeddings son **reales**. El módulo `embeddings` del juego trae los del modelo paraphrase-multilingual-MiniLM-L12-v2 (384 componentes) de 16 frases de la base de conocimiento de un hotel de congresos (`documentos`, matriz `D`) y de 10 preguntas de huéspedes (`consultas`, matriz `Q`). Las filas tienen norma 1, así que el producto escalar de una consulta con un documento **es** su coseno. No hay modelo para frases nuevas: solo estas.\n\n`Q @ D.T` multiplica `Q` por la traspuesta de `D` (`D.T` intercambia filas y columnas) y da una matriz con el coseno de cada consulta con cada documento: el elemento de la fila `i` y la columna `j` es el de la consulta `i` con el documento `j`. De cada fila, `np.argmax(x, axis=1)` da la posición del mayor valor y `np.max(x, axis=1)`, el valor; el `axis=1` recorre las columnas de cada fila.\n\nGuarda en `S` la matriz de cosenos, en `mejor` el documento más parecido a cada consulta y en `punt` su coseno.',
          hints: [
            'El plan son tres líneas. Primero `S`: la matriz `Q` multiplicada por la traspuesta de `D` (`D.T`), con `@`; tiene que salir con 10 filas (una por consulta) y 16 columnas (una por documento). Después `mejor`: de cada fila de `S`, la posición del valor mayor, con `np.argmax`. Por último `punt`: de cada fila, el valor mayor, con `np.max`. Cuida el eje: con `axis=1` se busca dentro de cada fila y salen 10 números; con `axis=0` saldrían 16.',
            'Así se comporta cada pieza, con una matriz pequeña de otros datos:\n\n' +
              py(
                'M = np.array([[1, 5, 2], [7, 3, 4]])   # 2 filas y 3 columnas',
                'print(M.shape)                         # (2, 3)',
                'print(M.T.shape)                       # (3, 2): .T intercambia filas y columnas',
                'print(np.argmax(M, axis=1))            # [1 0]: dentro de cada fila, la posición del mayor',
                'print(np.max(M, axis=1))               # [5 7]: dentro de cada fila, el valor mayor',
                'print(np.argmax(M, axis=0))            # [1 0 1]: con axis=0 se mira por columnas, y salen 3',
              ) +
              '\n\nEl `@` entre dos matrices las multiplica; para que encajen, las columnas de la primera tienen que ser tantas como las filas de la segunda, y por eso `Q` va con `D.T` y no con `D`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('S = Q ___ D.T', 'mejor = np.___(S, axis=___)', 'punt = np.___(S, axis=___)') +
              '\n\nUn error típico es confundir las dos últimas líneas: `np.argmax` da la posición (un entero de 0 a 15) y `np.max` da el coseno (un decimal); `punt` lleva el coseno.',
          ],
          explain:
            'Cada consulta elige el documento de mayor coseno de su fila. Si te salen 16 números en vez de 10, la búsqueda del mayor recorre el eje que no toca. Después, no confundas la posición con el valor.',
          solution:
            '`S = Q @ D.T` tiene forma `(10, 16)`. `mejor = np.argmax(S, axis=1)` da `[0, 1, 12, 5, 14, 13, 3, 3, 15, 9]` y `punt = np.max(S, axis=1)`, los cosenos `[0,77; 0,33; 0,64; 0,70; 0,62; 0,86; 0,59; 0,41; 0,72; 0,56]`. Ya se ven dos problemas: q2 devuelve d12 en vez de la sala de 300 personas (d4), y q5, que pide un código que no existe, devuelve d13 con $0{,}86$, el coseno más alto de toda la tabla.',
          requirements: [
            '`S` existe y es un array de NumPy con números: 10 filas, una por consulta, y 16 columnas, una por documento. Cada elemento es el coseno de una consulta con un documento.',
            '`mejor` es una lista o un array de NumPy con 10 posiciones enteras, de 0 a 15, una por consulta: la del documento de mayor coseno.',
            '`punt` es una lista o un array de NumPy con 10 números, uno por consulta: el mayor coseno de esa consulta, no su posición.',
          ],
          starter: `import numpy as np
from embeddings import D, Q, documentos, consultas

# D: una matriz de 16 filas y 384 columnas. La fila j es el embedding del documento j.
# Q: una matriz de 10 filas y 384 columnas. La fila i es el embedding de la consulta i.
# Todas las filas miden 1, así que el producto escalar de una consulta con un documento es su coseno.
# documentos y consultas: las listas con los textos (documentos[0] es el texto del documento 0).

# PASO 1. La matriz de cosenos S: el coseno de cada consulta con cada documento.
# Por qué: con todos los cosenos juntos puedes elegir, para cada consulta, el documento que más se parece.
# Q @ D.T multiplica Q por la traspuesta de D. D.T es D con filas y columnas intercambiadas
# (de 16 filas y 384 columnas pasa a 384 filas y 16 columnas), y así las dos matrices encajan.
# El resultado tiene 10 filas (una por consulta) y 16 columnas (una por documento):
# el elemento de la fila i y la columna j es el coseno de la consulta i con el documento j.
S = None

# PASO 2. mejor: de cada consulta, la POSICIÓN del documento con mayor coseno.
# Por qué: la posición te dice qué documento recupera el sistema (el 0, el 12...).
# np.argmax(S, axis=1) busca el mayor dentro de cada fila (axis=1 recorre las columnas de cada fila)
# y devuelve su posición. Salen 10 números enteros, uno por consulta.
# Si usaras axis=0 buscarías por columnas y saldrían 16 números: no es lo que se pide.
mejor = None

# PASO 3. punt: de cada consulta, el VALOR de ese mayor coseno.
# Por qué: la posición dice cuál es el documento, pero no cuánto se parece. Ese valor es el que
# luego se compara con un umbral.
# np.max(S, axis=1) hace la misma búsqueda por filas que np.argmax, pero devuelve el valor y no la posición.
punt = None

# Para ver qué vale algo antes de entregar: print(S.shape) o print(mejor) y pulsa «Ejecutar».
`,
          checks: `import embeddings as _e
_S = _e.Q @ _e.D.T
_m = np.argmax(_S, axis=1)
_p = np.max(_S, axis=1)
_s = isinstance(S, np.ndarray) and np.issubdtype(S.dtype, np.number)
_a = np.asarray(mejor) if isinstance(mejor, (np.ndarray, list, tuple)) else None
_ai = _a is not None and np.issubdtype(_a.dtype, np.integer)
_af = _a is not None and np.issubdtype(_a.dtype, np.floating)
_b = np.asarray(punt) if isinstance(punt, (np.ndarray, list, tuple)) else None
_bn = _b is not None and np.issubdtype(_b.dtype, np.number)
check(_s, "\`S\` tiene que ser un array de NumPy con números: el coseno de cada consulta con cada documento.")
check((not _s) or S.shape != (16, 10), "\`S\` tiene 16 filas y 10 columnas: está al revés. Cada fila tiene que ser una consulta y cada columna un documento.")
check((not _s) or S.shape in ((16, 10), (10, 16)), "\`S\` tiene que tener 10 filas, una por consulta, y 16 columnas, una por documento.")
check((not _s) or S.shape != (10, 16) or np.allclose(S, _S, atol=1e-6), "\`S\` tiene la forma buena pero no los cosenos de \`Q\` con \`D\`: cada elemento es el producto escalar de una consulta con un documento.")
check(_ai or _af, "\`mejor\` tiene que ser un array de NumPy (o una lista) de posiciones: números enteros del 0 al 15.")
check(not _af, "\`mejor\` tiene números decimales: parecen cosenos y no posiciones. La posición del valor mayor la da \`np.argmax\`.")
check((not _ai) or _a.shape != (16,), "\`mejor\` tiene 16 posiciones, una por documento: la búsqueda del mayor recorre el eje de las consultas en vez del de los documentos. Hace falta una posición por consulta, 10 en total.")
check((not _ai) or _a.shape in ((16,), (10,)), "\`mejor\` tiene que tener 10 posiciones, una por consulta.")
check((not _ai) or _a.shape != (10,) or np.array_equal(_a, _m), "\`mejor\` tiene que ser la posición del documento de mayor coseno de cada consulta, contando desde 0.")
check(_bn, "\`punt\` tiene que ser un array de NumPy (o una lista) con 10 números: el mayor coseno de cada consulta.")
check((not _bn) or _b.shape != (16,), "\`punt\` tiene 16 números, uno por documento: hace falta uno por consulta, el mayor de su fila.")
check((not _bn) or _b.shape != (10,) or not _ai or _a.shape != (10,) or not np.array_equal(_b, _a), "\`punt\` repite las posiciones de \`mejor\`. Falta el valor del coseno, que da \`np.max\`.")
check((not _bn) or _b.shape != (10,) or (_ai and _a.shape == (10,) and np.array_equal(_b, _a)) or np.allclose(_b, _p, atol=1e-6), "\`punt\` tiene que ser el coseno del documento más parecido de cada consulta, el mayor valor de su fila de \`S\`.")
`,
          reference: `import numpy as np
from embeddings import D, Q, documentos, consultas

# Guarda en S los cosenos de cada consulta con cada documento, en mejor la posición del documento
# más parecido a cada consulta y en punt su coseno
S = Q @ D.T
mejor = np.argmax(S, axis=1)
punt = np.max(S, axis=1)
`,
        },
        {
          id: 'fallos-rag.ex02.2',
          type: 'codigo',
          prompt:
            'Un **umbral** devuelve «no lo sé» cuando el mejor documento no se parece bastante: la respuesta es la posición del documento si su coseno alcanza el umbral y `None` (la ausencia de valor en Python) si no. `[a if cond else b for x in lista]` construye una lista aplicando esa regla a cada elemento, y `zip(l1, l2)` recorre dos listas a la vez.\n\nYa tienes, con los datos reales de `embeddings`, `mejor` (el documento más parecido a cada consulta), `punt` (su coseno) y un umbral de $0{,}58$. Guarda en `respuestas` la lista de 10 respuestas, una por consulta, y en `sin_respuesta` cuántas consultas se quedan con «no lo sé».',
          hints: [
            'El plan son dos líneas. `respuestas` es una lista con un elemento por consulta: se recorren a la vez `mejor` y `punt` con `zip`, y cada elemento es la posición de `mejor` si el coseno de `punt` alcanza `umbral` (condición «mayor o igual») y `None` si no. Cuida que no quede al revés. `sin_respuesta` se cuenta sobre la propia lista `respuestas`: cuántos elementos son `None`.',
            'Las piezas, con otros datos y un solo caso de cada:\n\n' +
              py(
                'notas = [8, 3, 6]          # un valor por alumno',
                'codigos = [10, 11, 12]     # un código por alumno',
                'for c, x in zip(codigos, notas):',
                '    print(c, x)            # 10 8, después 11 3, después 12 6: zip los junta por parejas',
                '',
                'print([c if x >= 5 else None for c, x in zip(codigos, notas)])   # [10, None, 12]',
                'print([10, None, 12].count(None))                               # 1: cuántos None hay',
              ) +
              '\n\nLa lista por comprensión se lee así: «para cada pareja `c, x`, pon `c` si se cumple la condición y `None` si no». Lo de antes de `for` es el valor de cada elemento. `int(m)` convierte un número de NumPy en un entero normal de Python.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'respuestas = [int(m) if p ___ umbral else ___ for m, p in zip(mejor, punt)]',
                'sin_respuesta = respuestas.___(None)',
              ) +
              '\n\nEl error típico es poner la condición al revés (`None` cuando sí llega): comprueba que q0, con un coseno alto, conserva su documento. Y la posición `0` es una respuesta válida, no un `None`.',
          ],
          explain:
            'Cada consulta se decide por separado comparando su coseno con el umbral. Si te salen respuestas donde el coseno es bajo y `None` donde es alto, la condición está al revés. Y una posición `0` es una respuesta válida: no es lo mismo que `None`.',
          solution:
            'Con el umbral $0{,}58$ quedan en «no lo sé» q1 ($0{,}33$), q7 ($0{,}41$) y q9 ($0{,}56$): `respuestas = [int(m) if p >= umbral else None for m, p in zip(mejor, punt)]` da `[0, None, 12, 5, 14, 13, 3, None, 15, None]` y `sin_respuesta = respuestas.count(None)` vale `3`. Un umbral que calla a q7, que no tiene respuesta, calla también a q1 y a q9, que sí la tienen.',
          requirements: [
            '`respuestas` es una lista de 10 elementos, uno por consulta, y cada uno es un número entero o `None`.',
            'Si el coseno de la consulta alcanza el umbral, su elemento es la posición del documento más parecido; si no lo alcanza, es `None`, y no un número como `0` o `-1`.',
            '`sin_respuesta` es un número entero: cuántas consultas se quedan sin respuesta, es decir, con `None`.',
          ],
          starter: `import numpy as np
from embeddings import D, Q, documentos, consultas

# Ya están hechas: no hace falta tocarlas.
S = Q @ D.T                    # los cosenos de cada consulta con cada documento: 10 filas y 16 columnas
mejor = np.argmax(S, axis=1)   # 10 posiciones: el documento más parecido a cada consulta
punt = np.max(S, axis=1)       # 10 cosenos: el de ese documento, uno por consulta
umbral = 0.58                  # el coseno mínimo para fiarse de la respuesta

# PASO 1. respuestas: una lista con 10 elementos, uno por consulta.
# Qué va en cada elemento: la posición del documento (el número de mejor) si su coseno (el de punt)
# llega al umbral, y None si no llega. None es la ausencia de valor en Python: aquí quiere decir «no lo sé».
# Por qué: un sistema que se fía de cualquier coseno contesta cosas absurdas cuando la base no tiene la
# respuesta; con un umbral prefiere callar.
# Cómo: [a if condicion else b for x in lista] construye una lista aplicando esa regla a cada elemento.
# Por ejemplo, [n if n >= 5 else None for n in [8, 3]] vale [8, None].
# zip(mejor, punt) junta las dos listas por parejas (la posición 1 con el coseno 1, la 2 con el 2...),
# y for m, p in zip(mejor, punt) saca en cada vuelta una pareja: m la posición y p su coseno.
# x >= y vale True si x es mayor o igual que y.
# int(m) convierte la posición (un número de NumPy) en un entero normal de Python.
respuestas = None

# PASO 2. sin_respuesta: cuántas consultas se quedan sin respuesta, es decir, con None.
# Por qué: es lo que el umbral calla, y luego hay que mirar si calla las que debía.
# lista.count(x) cuenta cuántas veces aparece x en la lista: [4, None, None].count(None) vale 2.
# Si ya tienes la lista respuestas, no hace falta recorrer nada más.
sin_respuesta = None

# Para ver qué vale algo antes de entregar: print(respuestas) y pulsa «Ejecutar».
`,
          checks: `import embeddings as _e
_S = _e.Q @ _e.D.T
_mj = np.argmax(_S, axis=1)
_pt = np.max(_S, axis=1)
_ex = [int(m) if p >= 0.58 else None for m, p in zip(_mj, _pt)]
_rev = [None if p >= 0.58 else int(m) for m, p in zip(_mj, _pt)]
_l = (isinstance(respuestas, (list, tuple)) or (isinstance(respuestas, np.ndarray) and respuestas.ndim == 1)) and len(respuestas) == 10
_it = list(respuestas) if _l else []
_fl = any(isinstance(x, (float, np.floating)) for x in _it)
_good = _l and not _fl
_rv = _good and all((x is None and y is None) or (x is not None and y is not None and int(x) == y) for x, y in zip(_it, _rev))
_sob = _good and not _rv and any(x is not None and y is None for x, y in zip(_it, _ex))
_fal = _good and not _rv and any(x is None and y is not None for x, y in zip(_it, _ex))
_doc = _good and not _rv and any(x is not None and y is not None and int(x) != y for x, y in zip(_it, _ex))
_n = isinstance(sin_respuesta, (int, np.integer)) and not isinstance(sin_respuesta, bool)
check(_l, "\`respuestas\` tiene que ser una lista con 10 elementos, uno por consulta.")
check(not _fl, "\`respuestas\` tiene números decimales: parecen cosenos o valores perdidos. Cada elemento tiene que ser la posición del documento, un número entero, o \`None\`.")
check(not _rv, "\`respuestas\` está al revés: devuelve el documento justo cuando el coseno no llega y \`None\` cuando sí llega.")
check(not _sob, "\`respuestas\` devuelve un documento en una consulta cuyo coseno no llega a \`umbral\`. Para «no lo sé» el elemento tiene que ser \`None\`, no un número como \`0\` o \`-1\`.")
check(not _fal, "\`respuestas\` tiene \`None\` en una consulta cuyo coseno sí alcanza \`umbral\`.")
check(not _doc, "\`respuestas\` tiene un documento que no es el más parecido a su consulta: tiene que ser el de \`mejor\`.")
check(_n, "\`sin_respuesta\` tiene que ser un número entero: cuántas consultas se quedan sin respuesta.")
check((not _n) or sin_respuesta != 7, "\`sin_respuesta\` vale 7: es el número de consultas a las que sí se contesta. Hay que contar las que se quedan con \`None\`.")
check((not _n) or sin_respuesta in (7, 3), "\`sin_respuesta\` tiene que ser el número de elementos \`None\` de \`respuestas\`: 3.")
`,
          reference: `import numpy as np
from embeddings import D, Q, documentos, consultas

S = Q @ D.T
mejor = np.argmax(S, axis=1)
punt = np.max(S, axis=1)
umbral = 0.58
# Guarda en respuestas la lista de 10 respuestas (la posición del documento o None si su coseno no llega
# al umbral) y en sin_respuesta cuántas consultas se quedan sin respuesta
respuestas = [int(m) if p >= umbral else None for m, p in zip(mejor, punt)]
sin_respuesta = respuestas.count(None)
`,
        },
        {
          id: 'fallos-rag.ex02.3',
          type: 'codigo',
          prompt:
            'Para medir un sistema de búsqueda hace falta un conjunto de preguntas **etiquetadas**: se sabe la respuesta correcta de cada una, y `None` cuando la base no la tiene. Ya tienes las `respuestas` del ejercicio anterior (umbral $0{,}58$, con los datos reales de `embeddings`) y las `correctas`, y las dos listas tienen un elemento por consulta. En Python, `None == None` es `True`, y `sum(...)` suma `True` como $1$; `a is None` comprueba si algo es `None`.\n\nGuarda en `aciertos` cuántas consultas se contestan bien (el documento correcto, o `None` cuando no hay respuesta), en `falsos` la lista de las consultas **sin** respuesta que reciben un documento (falsos positivos) y en `perdidas` la lista de las consultas **con** respuesta que reciben `None`. `enumerate(x)` recorre `x` dando parejas de posición y elemento.',
          hints: [
            'El plan son tres líneas, y las tres recorren `respuestas` y `correctas` a la vez con `zip`. `aciertos`: cuántas parejas coinciden (`==`); una consulta sin respuesta bien rechazada también coincide, porque las dos valen `None`. `falsos`: las posiciones de las consultas cuya etiqueta es `None` pero cuya respuesta no lo es. `perdidas`: al revés, etiqueta con valor y respuesta `None`. En `falsos` y `perdidas` se guarda la posición de la consulta, no la respuesta; la posición la da `enumerate`.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'a = [3, None, 5]',
                'b = [3, None, 7]',
                'print(a[1] == b[1])                          # True: None == None es True',
                'print(sum(x == y for x, y in zip(a, b)))     # 2: sum suma los True como 1',
                'print(a[1] is None)                          # True: así se comprueba si algo es None',
                'print(a[0] is not None)                      # True: y así que no lo es',
                '',
                'for i, (x, y) in enumerate(zip(a, b)):',
                '    print(i, x, y)                           # 0 3 3, después 1 None None, después 2 5 7',
                '',
                'print([i for i, (x, y) in enumerate(zip(a, b)) if x != y])   # [2]: posiciones donde difieren',
              ) +
              '\n\n`enumerate` da en cada vuelta la posición `i` y el elemento, y como el elemento es una pareja de `zip`, se escribe `i, (x, y)`: los paréntesis agrupan la pareja. Al final de la lista por comprensión, `if` deja pasar solo las posiciones que cumplen la condición; las condiciones se unen con `and`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'aciertos = sum(r ___ c for r, c in zip(respuestas, correctas))',
                'falsos = [i for i, (r, c) in enumerate(zip(respuestas, correctas)) if c ___ None and r ___ None]',
                'perdidas = [i for i, (r, c) in enumerate(zip(respuestas, correctas)) if c ___ None and r ___ None]',
              ) +
              '\n\nEn `falsos` la etiqueta `c` es `None` y la respuesta `r` no; en `perdidas`, al revés. Para «no es `None`» se escribe `is not None`. Si `falsos` te sale con la posición 7, revisa: esa consulta no tiene respuesta y el sistema dijo «no lo sé», que está bien.',
          ],
          explain:
            'Los tres resultados salen de comparar cada respuesta con su etiqueta. Una consulta mal contestada puede serlo de tres maneras distintas: el documento equivocado, un documento donde no había respuesta, o ninguno donde sí la había. Aquí solo se apartan dos de ellas.',
          solution:
            '`aciertos = sum(r == c for r, c in zip(respuestas, correctas))` da `6`: q0, q3, q4, q6, q7 y q8 (q7 acierta porque las dos valen `None`). `falsos = [i for i, (r, c) in enumerate(zip(respuestas, correctas)) if c is None and r is not None]` da `[5]`: q5 recibe d13, pero la base no tiene el código CONG-2025. `perdidas`, con la condición contraria, da `[1, 9]`: q1 y q9 tenían respuesta y el umbral las calla. Falta la cuarta consulta que falla, q2, que recibe un documento equivocado: $6+1+2+1=10$.',
          requirements: [
            '`aciertos` es un número entero: cuántas consultas tienen una respuesta igual a su etiqueta, contando también las que valen `None` en las dos.',
            '`falsos` es una lista de posiciones de consulta (números enteros, contando desde $0$): las que no tienen respuesta en la base y a las que el sistema devuelve un documento.',
            '`perdidas` es una lista de posiciones de consulta (números enteros, contando desde $0$): las que sí tienen respuesta en la base y a las que el sistema devuelve `None`.',
          ],
          starter: `import numpy as np

# Dos listas con un elemento por consulta (10 en total); el elemento i es el de la consulta i.
# Respuesta del sistema a cada consulta con umbral 0.58 (None: «no lo sé»)
respuestas = [0, None, 12, 5, 14, 13, 3, None, 15, None]
# Respuesta correcta según las etiquetas (None: la base no tiene la respuesta)
correctas = [0, 1, 4, 5, 14, None, 3, None, 15, 9]

# PASO 1. aciertos: cuántas consultas se contestan bien.
# Por qué: es la nota del sistema. Contestar bien es dar el documento correcto, y también decir
# «no lo sé» (None) cuando la base no tiene la respuesta (la etiqueta es None).
# zip(respuestas, correctas) recorre las dos listas a la vez, por parejas: la respuesta 1 con la
# etiqueta 1, la 2 con la 2... Con for r, c in zip(respuestas, correctas) sacas una pareja por vuelta.
# a == b vale True si a y b son iguales, y None == None también vale True.
# sum(...) suma una serie de valores, y cuenta True como 1: sum([True, False, True]) vale 2.
# Puedes sumar así: sum(condición for r, c in zip(...)).
aciertos = None

# PASO 2. falsos: las posiciones de las consultas SIN respuesta (la etiqueta es None) a las que el
# sistema les da igualmente un documento (la respuesta no es None).
# Por qué: es el fallo más peligroso, contestar con seguridad algo que no existe.
# enumerate(x) recorre x dando en cada vuelta la posición y el elemento: for i, v in enumerate(["a", "b"])
# da i = 0 y v = "a", y luego i = 1 y v = "b". Con una lista de parejas de zip, se escribe i, (r, c).
# a is None comprueba si a es None; a is not None comprueba que no lo es.
# Una lista por comprensión [i for ... in ... if condición] guarda i solo en las vueltas que cumplen la condición;
# dos condiciones se unen con and. Se guarda la posición i, no la respuesta.
falsos = None

# PASO 3. perdidas: las posiciones de las consultas CON respuesta (la etiqueta no es None) a las que el
# sistema contesta None.
# Por qué: es el coste del umbral, callar cuando sí se sabía. Es lo mismo que el paso 2 con las dos
# condiciones intercambiadas.
perdidas = None

# Para ver qué vale algo antes de entregar: print(falsos) y pulsa «Ejecutar».
`,
          checks: `_ok = lambda v: isinstance(v, (int, np.integer)) and not isinstance(v, bool)
_ls = lambda v: isinstance(v, (list, tuple, np.ndarray)) and np.ndim(v) == 1 and all(_ok(x) for x in v)
_a = _ok(aciertos)
_f = _ls(falsos)
_p = _ls(perdidas)
_fs = sorted(int(x) for x in falsos) if _f else []
_ps = sorted(int(x) for x in perdidas) if _p else []
check(_a, "\`aciertos\` tiene que ser un número entero: cuántas consultas se contestan bien.")
check((not _a) or aciertos != 5, "\`aciertos\` vale 5: no cuentas el acierto de decir «no lo sé» cuando la base no tiene la respuesta. Si la etiqueta y la respuesta son \`None\`, la comparación con \`==\` da \`True\`.")
check((not _a) or aciertos != 7, "\`aciertos\` vale 7: es el número de consultas a las que el sistema contesta con un documento, sean correctos o no.")
check((not _a) or aciertos != 4, "\`aciertos\` vale 4: son las consultas mal contestadas, no las bien contestadas.")
check((not _a) or aciertos in (5, 7, 4) or aciertos == 6, "\`aciertos\` tiene que contar las consultas cuya respuesta coincide con su etiqueta, incluidas las que valen \`None\` en las dos.")
check(_f, "\`falsos\` tiene que ser una lista de posiciones de consulta: números enteros.")
check((not _f) or _fs != [7], "\`falsos\` es [7]: la consulta 7 no tiene respuesta y el sistema ha dicho «no lo sé», así que lo ha hecho bien. Un falso positivo es una consulta sin respuesta a la que el sistema devuelve un documento.")
check((not _f) or 2 not in _fs, "\`falsos\` incluye la consulta 2: esa consulta sí tiene respuesta, y el sistema se ha equivocado de documento. No es una consulta sin respuesta.")
check((not _f) or _fs in ([7], [5]) or 2 in _fs or _fs == [5], "\`falsos\` tiene que ser la lista de las consultas cuya etiqueta es \`None\` y cuya respuesta no lo es.")
check(_p, "\`perdidas\` tiene que ser una lista de posiciones de consulta: números enteros.")
check((not _p) or 7 not in _ps, "\`perdidas\` incluye la consulta 7: no tiene respuesta, y el sistema ha dicho «no lo sé» con razón. Aquí solo cuentan las consultas que sí tenían respuesta.")
check((not _p) or 7 in _ps or _ps == [1, 9], "\`perdidas\` tiene que ser la lista de las consultas cuya respuesta es \`None\` y cuya etiqueta no lo es.")
`,
          reference: `import numpy as np

# Respuesta del sistema a cada consulta con umbral 0.58 (None: «no lo sé»)
respuestas = [0, None, 12, 5, 14, 13, 3, None, 15, None]
# Respuesta correcta según las etiquetas (None: la base no tiene la respuesta)
correctas = [0, 1, 4, 5, 14, None, 3, None, 15, 9]
# Guarda en aciertos cuántas consultas se contestan bien, en falsos la lista de posiciones de las consultas
# sin respuesta que reciben un documento y en perdidas la lista de las consultas con respuesta que reciben None
aciertos = sum(r == c for r, c in zip(respuestas, correctas))
falsos = [i for i, (r, c) in enumerate(zip(respuestas, correctas)) if c is None and r is not None]
perdidas = [i for i, (r, c) in enumerate(zip(respuestas, correctas)) if c is not None and r is None]
`,
        },
        {
          id: 'fallos-rag.ex02.4',
          type: 'codigo',
          prompt:
            '¿Hay un umbral que arregle el sistema? Se puede buscar probando muchos. `np.linspace(0, 1, 101)` da los 101 valores de $0$ a $1$ de $0{,}01$ en $0{,}01$, y `plt.plot(x, y)` dibuja una línea con un punto por cada pareja de valores.\n\nYa tienes, con los datos reales de `embeddings`, `mejor`, `punt`, las `correctas` y los `umbrales`. Para cada umbral, el sistema responde con el documento de `mejor` si su coseno de `punt` lo alcanza y con `None` si no; se contesta bien si la respuesta coincide con la etiqueta (`None` incluido). Guarda en `aciertos` un array con las consultas bien contestadas para cada umbral (101 números), dibuja las consultas bien contestadas frente al umbral con una línea y guarda en `techo` el mayor número de aciertos.',
          hints: [
            'El plan: un bucle `for` por los `umbrales`. En cada vuelta se hace lo de los ejercicios anteriores: se construyen las `respuestas` de ese umbral, se cuentan cuántas coinciden con `correctas` y ese número se añade a la lista `aciertos`, que empieza vacía. Al terminar el bucle, `aciertos` tiene 101 números; se convierte en array de NumPy, se dibuja contra `umbrales` con `plt.plot` y `techo` es su valor mayor (no la posición donde está).',
            'Las piezas, con otros datos:\n\n' +
              py(
                'cuentas = []                     # una lista vacía',
                'for t in [1, 2, 3]:              # t vale 1, luego 2, luego 3',
                '    cuentas.append(t * 10)       # añade un elemento al final; la sangría marca lo que repite el for',
                'print(cuentas)                   # [10, 20, 30]',
                'cuentas = np.array(cuentas)      # la lista pasa a ser un array de NumPy',
                'print(cuentas.max())             # 30: el valor mayor, no su posición',
              ) +
              '\n\nTodo lo que va dentro del `for` lleva 4 espacios más a la izquierda: así Python sabe qué se repite en cada vuelta. Dentro van dos líneas de los ejercicios anteriores: la de las `respuestas` con `if ... else None` y la del recuento con `sum(... for r, c in zip(...))`, usando `u`, el umbral de la vuelta.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'aciertos = []',
                'for u in ___:',
                '    respuestas = [int(m) if p ___ u else None for m, p in zip(mejor, punt)]',
                '    aciertos.append(sum(r ___ c for r, c in zip(respuestas, correctas)))',
                'aciertos = np.array(aciertos)',
                'plt.plot(___, ___)',
                'techo = aciertos.___()',
              ) +
              '\n\n`plt.plot(x, y)` lleva primero lo que va en el eje horizontal y después lo del vertical. Un error típico es dejar `aciertos` como lista: sin convertirla con `np.array`, no tiene el método para el valor mayor.',
          ],
          explain:
            'La línea muestra cómo cambian los aciertos al mover el umbral. Mira su altura máxima: fíjate en si llega a $10$ y si el umbral mejora algo a no poner ninguno (el umbral $0$).',
          solution:
            'Las respuestas de cada umbral `u` son `[int(m) if p >= u else None for m, p in zip(mejor, punt)]` y los aciertos son los elementos que coinciden con `correctas`. Con `aciertos = np.array(...)`, `plt.plot(umbrales, aciertos)` dibuja la curva y `techo = aciertos.max()` vale `7`. Con el umbral $0$ ya se aciertan $7$; la curva baja a $6$ entre $0{,}33$ y $0{,}40$, vuelve a $7$ entre $0{,}41$ y $0{,}56$ y cae después. Nunca llega a $8$: q2 y q5 fallan con cualquier umbral, porque su error no es de confianza, sino de contenido.',
          requirements: [
            '`aciertos` es una lista o un array de NumPy con 101 números, uno por umbral: las consultas bien contestadas con ese umbral, de $0$ a $10$ (un recuento, no una fracción).',
            'Una consulta se contesta bien cuando su respuesta coincide con su etiqueta, incluida la que vale `None` en las dos.',
            '`techo` es un número: el mayor valor de `aciertos`, no el lugar donde se alcanza.',
            'Hay una figura con una línea de 101 puntos, uno por umbral, cuya altura es el número de consultas bien contestadas con ese umbral.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt
from embeddings import D, Q, documentos, consultas

# Ya están hechas: no hace falta tocarlas.
S = Q @ D.T                    # los cosenos de cada consulta con cada documento
mejor = np.argmax(S, axis=1)   # 10 posiciones: el documento más parecido a cada consulta
punt = np.max(S, axis=1)       # 10 cosenos: el de ese documento
correctas = [0, 1, 4, 5, 14, None, 3, None, 15, 9]   # la respuesta correcta de cada consulta (None: no hay)
umbrales = np.linspace(0, 1, 101)   # 101 umbrales, de 0 a 1 de 0.01 en 0.01

# PASO 1. aciertos: para cada umbral, cuántas consultas se contestan bien (101 números).
# Por qué: así se ve si algún umbral arregla el sistema.
# Para cada umbral, haz lo mismo que en los ejercicios anteriores:
#   respuestas = [int(m) if p >= umbral else None for m, p in zip(mejor, punt)]
#   y cuenta las respuestas que coinciden con correctas: sum(r == c for r, c in zip(respuestas, correctas))
# Para repetirlo con los 101 umbrales hace falta un bucle:
#   empieza con una lista vacía, aciertos = []
#   recórrela con for u in umbrales: (u vale un umbral en cada vuelta; úsalo en lugar de umbral)
#   y añade el recuento de cada vuelta con aciertos.append(...)
# Todo lo que va dentro del for lleva 4 espacios delante (la sangría): así Python sabe que se repite.
# Al terminar, convierte la lista en un array de NumPy con np.array(aciertos).
aciertos = None

# PASO 2. Dibuja los aciertos frente al umbral con una línea (no hay variable que guardar).
# plt.plot(x, y) dibuja una línea con un punto por cada pareja de valores: x en el eje horizontal
# (aquí, los umbrales) e y en el vertical (aquí, los aciertos).

# PASO 3. techo: el mayor número de aciertos de toda la curva.
# Por qué: es lo mejor que consigue ningún umbral. Si no llega a 10, los fallos no son de confianza.
# aciertos.max() da el valor mayor del array (un número); aciertos.argmax() daría su posición, que no se pide.
techo = None

# Para ver qué vale algo antes de entregar: print(aciertos) y pulsa «Ejecutar».
`,
          checks: `import embeddings as _e
_S = _e.Q @ _e.D.T
_mj = np.argmax(_S, axis=1)
_pt = np.max(_S, axis=1)
_cor = [0, 1, 4, 5, 14, None, 3, None, 15, 9]
_ex = np.array([sum((int(m) if p >= u else None) == c for m, p, c in zip(_mj, _pt, _cor)) for u in np.linspace(0, 1, 101)])
_a = np.asarray(aciertos) if isinstance(aciertos, (np.ndarray, list, tuple)) else None
_an = _a is not None and np.issubdtype(_a.dtype, np.number)
_a101 = _an and _a.shape == (101,)
_t = isinstance(techo, (int, float, np.integer, np.floating)) and not isinstance(techo, bool)
check(_an, "\`aciertos\` tiene que ser un array de NumPy (o una lista) con números: las consultas bien contestadas con cada umbral.")
check((not _an) or _a.shape == (101,), "\`aciertos\` tiene que tener 101 números, uno por umbral.")
check((not _a101) or _a.max() > 1, "\`aciertos\` tiene valores entre 0 y 1: parece una fracción. Aquí se cuentan las consultas bien contestadas, de 0 a 10.")
check((not _a101) or _a.max() <= 1 or np.allclose(_a, _ex), "\`aciertos\` no coincide con el recuento: para cada umbral, las consultas bien contestadas (incluidas las que valen \`None\` en la respuesta y en la etiqueta).")
check(_t, "\`techo\` tiene que ser un número: el máximo de consultas bien contestadas.")
check((not _t) or techo != 0, "\`techo\` vale 0: es la posición del mayor valor de \`aciertos\`, el primer umbral que lo alcanza, y no el valor mismo.")
check((not _t) or techo == 0 or abs(techo - 7) < 1e-9, "\`techo\` tiene que ser el mayor valor de \`aciertos\`: las consultas bien contestadas en el umbral más favorable.")
_fig = len(plt.get_fignums()) > 0
_ln = [np.asarray(l.get_ydata(), dtype=float) for ax in plt.gcf().axes for l in ax.lines] if _fig else []
_l101 = [y for y in _ln if y.shape == (101,)]
check(_fig, "No hay ninguna figura: dibuja las consultas bien contestadas frente al umbral con \`plt.plot\`.")
check((not _fig) or len(_ln) > 0, "No hay ninguna línea en la figura: dibújala con \`plt.plot\`.")
check(len(_ln) == 0 or len(_l101) > 0, "La línea tiene que tener 101 puntos, uno por umbral.")
check(len(_l101) == 0 or any(np.allclose(y, _ex) for y in _l101), "La altura de cada punto de la línea tiene que ser el número de consultas bien contestadas con su umbral.")
`,
          reference: `import numpy as np
import matplotlib.pyplot as plt
from embeddings import D, Q, documentos, consultas

S = Q @ D.T
mejor = np.argmax(S, axis=1)
punt = np.max(S, axis=1)
correctas = [0, 1, 4, 5, 14, None, 3, None, 15, 9]
umbrales = np.linspace(0, 1, 101)
# Guarda en aciertos cuántas consultas se contestan bien con cada umbral (101 números), dibuja los aciertos
# frente al umbral con una línea y guarda en techo el mayor número de aciertos
aciertos = []
for u in umbrales:
    respuestas = [int(m) if p >= u else None for m, p in zip(mejor, punt)]
    aciertos.append(sum(r == c for r, c in zip(respuestas, correctas)))
aciertos = np.array(aciertos)
plt.plot(umbrales, aciertos)
techo = aciertos.max()
`,
        },
        {
          id: 'fallos-rag.ex02.5',
          type: 'codigo',
          prompt:
            'Ningún umbral llega a $10$ porque los fallos son de otra clase. Un remedio sencillo para los **códigos exactos** es la parte de palabras clave de una búsqueda híbrida: si la consulta trae un código, el documento tiene que contenerlo **tal cual**. `re.findall(patron, texto)` devuelve la lista de trozos de `texto` que encajan con `patron`, y `c in texto` comprueba si `c` aparece en `texto`; `all(...)` es `True` si todos los elementos de la lista lo son, y también si la lista está vacía.\n\nYa tienes, con los datos reales de `embeddings`, `mejor`, las `correctas` y el `patron` de un código (letras mayúsculas, un guion y cifras). Guarda en `respuestas` la lista de 10 respuestas: el documento de `mejor`, salvo que la consulta traiga algún código que ese documento no contenga, y entonces `None`. Guarda en `aciertos` cuántas consultas se contestan bien.',
          hints: [
            'El plan: `respuestas` empieza vacía y un bucle recorre `mejor` con `enumerate`, que da en cada vuelta el número de la consulta `i` y la posición `m` de su documento. Dentro: saca los códigos del texto de la consulta (`consultas[i]`) con `re.findall(patron, ...)`; si todos aparecen tal cual en el texto del documento (`documentos[m]`), añade `int(m)`; si alguno falta, añade `None`. Una consulta sin códigos no tiene nada que exigir y conserva su documento. Después, `aciertos` se cuenta como en el ejercicio anterior, con `zip` y `==`.',
            'Las piezas, con otro texto y otros códigos:\n\n' +
              py(
                'texto = "El plano es AB-12 y el otro CD-345"',
                "print(re.findall(r\"[A-Z]+-\\d+\", texto))      # ['AB-12', 'CD-345']: lista con los trozos que encajan",
                'print(re.findall(r"[A-Z]+-\\d+", "sin código"))   # []: lista vacía si no hay ninguno',
                'print("AB-12" in texto)                         # True: c in texto comprueba si aparece tal cual',
                'print(all(c in texto for c in ["AB-12", "ZZ-9"]))   # False: basta que uno falte',
                'print(all(c in texto for c in []))              # True: con la lista vacía, all da True',
                '',
                'for i, m in enumerate([7, 9]):',
                '    print(i, m)                                 # 0 7, después 1 9',
              ) +
              '\n\nEl `if` decide qué rama se ejecuta: lo que va debajo del `if` (con 4 espacios más) se hace si la condición es `True`, y lo de debajo del `else` si no. Con `lista.append(x)` añades `x` al final de `lista`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'respuestas = []',
                'for i, m in enumerate(mejor):',
                '    codigos = re.findall(patron, consultas[i])',
                '    if all(c in documentos[___] for c in codigos):',
                '        respuestas.append(int(m))',
                '    else:',
                '        respuestas.append(___)',
                'aciertos = sum(r ___ c for r, c in zip(respuestas, correctas))',
              ) +
              '\n\nEn `documentos[...]` va la posición del documento recuperado, no el número de la consulta `i`. Y rechazar es añadir `None`, no `0` ni `-1`: `0` es un documento válido.',
          ],
          explain:
            'La regla solo actúa sobre las consultas con código; las demás quedan como estaban. Después, `aciertos` se cuenta igual que antes. Mira qué consulta cambia de respuesta y cuáles siguen mal, aunque la regla no las toque.',
          solution:
            'Para q5, `re.findall(patron, consultas[5])` da `["CONG-2025"]`, que no está en d13 («…es CONG-2026.»): la respuesta pasa a ser `None`, que es lo correcto. Las demás consultas no traen código y se quedan como estaban: `respuestas = [0, 1, 12, 5, 14, None, 3, 3, 15, 9]` y `aciertos` vale `8`. Sigue habiendo dos fallos: q2, que necesita un filtro por metadatos (capacidad $\\ge 250$), y q7, una pregunta sin respuesta cuyo mejor coseno ($0{,}41$) no se puede separar del de q1 ($0{,}33$).',
          requirements: [
            '`respuestas` es una lista de 10 elementos, uno por consulta, y cada uno es un número entero o `None`.',
            'Cada elemento es el documento de `mejor` o `None`: nunca otro documento, y `None` solo si la consulta trae un código que ese documento no contiene tal cual.',
            'Una consulta sin ningún código conserva el documento de `mejor`.',
            '`aciertos` es un número entero: cuántas consultas tienen una respuesta igual a su etiqueta, incluidas las que valen `None` en las dos.',
          ],
          starter: `import re
import numpy as np
from embeddings import D, Q, documentos, consultas

# Ya están hechas: no hace falta tocarlas.
S = Q @ D.T                    # los cosenos de cada consulta con cada documento
mejor = np.argmax(S, axis=1)   # 10 posiciones: el documento más parecido a cada consulta
correctas = [0, 1, 4, 5, 14, None, 3, None, 15, 9]   # la respuesta correcta de cada consulta (None: no hay)
# documentos y consultas son listas de textos: documentos[m] es el texto del documento m
# y consultas[i], el de la consulta i.
# patron describe un código: letras mayúsculas, un guion y cifras (por ejemplo, AB-12).
patron = r"[A-Z]+-\\d+"

# PASO 1. respuestas: una lista de 10 respuestas, una por consulta.
# Qué va en cada una: el documento de mejor, salvo que la consulta traiga algún código que ese documento
# NO contenga escrito tal cual; entonces, None.
# Por qué: el coseno no distingue CONG-2025 de CONG-2026, pero una palabra clave sí: exigir que el
# código aparezca igual en el documento corrige lo que los embeddings no ven.
# Para hacerlo consulta a consulta hace falta un bucle:
#   empieza con una lista vacía, respuestas = []
#   recorre las consultas con for i, m in enumerate(mejor): (en cada vuelta, i es el número de la consulta
#   y m la posición de su documento)
#   dentro del for (con 4 espacios de sangría delante), saca los códigos de la consulta:
#   re.findall(patron, texto) devuelve la lista de los trozos de texto que encajan con el patrón
#   (una lista vacía si no hay ninguno)
#   all(c in documentos[m] for c in codigos) vale True si TODOS los códigos aparecen en el texto del documento
#   (c in texto comprueba si c aparece en texto), y también si la lista está vacía
#   con if ...: añade int(m) a la lista con respuestas.append(int(m)); con else: añade None
respuestas = None

# PASO 2. aciertos: cuántas consultas se contestan bien.
# Por qué: es la nota del sistema con la regla nueva, para compararla con la de antes.
# Se acierta cuando la respuesta es igual a su etiqueta de correctas, y None == None también cuenta.
# sum(condición for r, c in zip(respuestas, correctas)) cuenta cuántas parejas cumplen la condición
# (sum suma los True como 1, y zip junta las dos listas por parejas).
aciertos = None

# Para ver qué vale algo antes de entregar: print(respuestas) y pulsa «Ejecutar».
`,
          checks: `import embeddings as _e
_ex = [0, 1, 12, 5, 14, None, 3, 3, 15, 9]
_l = (isinstance(respuestas, (list, tuple)) or (isinstance(respuestas, np.ndarray) and respuestas.ndim == 1)) and len(respuestas) == 10
_it = list(respuestas) if _l else []
_fl = any(isinstance(x, (float, np.floating)) for x in _it)
_good = _l and not _fl
_igual = _good and all(x is None or int(x) == y for x, y in zip(_it, _ex) if y is not None) and all(x is None for x, y in zip(_it, _ex) if y is None)
_cod = _good and _it[5] is not None
_extra = _good and any(x is None and y is not None for x, y in zip(_it, _ex))
_doc = _good and any(x is not None and y is not None and int(x) != y for x, y in zip(_it, _ex))
_n = isinstance(aciertos, (int, np.integer)) and not isinstance(aciertos, bool)
check(_l, "\`respuestas\` tiene que ser una lista con 10 elementos, uno por consulta.")
check(not _fl, "\`respuestas\` tiene números decimales. Cada elemento tiene que ser la posición del documento, un número entero, o \`None\`.")
check(not _cod, "La consulta 5 pide el código CONG-2025 y su documento más parecido (el 13) contiene CONG-2026: el código no aparece tal cual y la respuesta tiene que ser \`None\`.")
check(not _extra, "\`respuestas\` tiene \`None\` en una consulta que no trae ningún código. Sin código no hay nada que exigir, y el documento de \`mejor\` se queda.")
check(not _doc, "\`respuestas\` cambia el documento de una consulta: la regla solo puede dejar el de \`mejor\` o sustituirlo por \`None\`.")
check(_n, "\`aciertos\` tiene que ser un número entero: cuántas consultas se contestan bien.")
check((not _n) or aciertos != 7, "\`aciertos\` vale 7: es lo que se acierta sin el remedio. Falta contar la consulta del código, que ahora se rechaza bien.")
check((not _n) or aciertos == 7 or aciertos == 8, "\`aciertos\` tiene que contar las consultas cuya respuesta coincide con su etiqueta, incluidas las que valen \`None\` en las dos.")
`,
          reference: `import re
import numpy as np
from embeddings import D, Q, documentos, consultas

S = Q @ D.T
mejor = np.argmax(S, axis=1)
correctas = [0, 1, 4, 5, 14, None, 3, None, 15, 9]
patron = r"[A-Z]+-\\d+"
# Guarda en respuestas la lista de 10 respuestas (el documento de mejor, o None si la consulta trae un código
# que ese documento no contiene tal cual) y en aciertos cuántas consultas se contestan bien
respuestas = []
for i, m in enumerate(mejor):
    codigos = re.findall(patron, consultas[i])
    if all(c in documentos[m] for c in codigos):
        respuestas.append(int(m))
    else:
        respuestas.append(None)
aciertos = sum(r == c for r, c in zip(respuestas, correctas))
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'fallos-rag.hoja.1',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento busca un umbral para un RAG con los cosenos reales del modelo paraphrase-multilingual-MiniLM-L12-v2. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Comprueba cada número con la comparación que se hace: ¿de qué lado queda cada coseno respecto del umbral?',
        'Escribe las dos condiciones de la tercera línea como desigualdades sobre un mismo umbral y mira si puede cumplirlas un número.',
      ],
      explain:
        'Las dos consultas ponen condiciones contrarias sobre el mismo umbral. Antes de dar por bueno un valor, compruébalo contra las dos.',
      solution:
        'Falla la última línea: con $0{,}37$ la consulta q1 se queda sin respuesta, porque su coseno ($0{,}33$) no llega. Para contestar a q1 hace falta un umbral de $0{,}33$ o menos, y para rechazar q7 hace falta uno mayor que $0{,}41$: ningún número cumple las dos cosas. Los datos reales no se dejan separar con un solo umbral.',
      lines: [
        'q1 «¿Puedo llevar a mi perro?» tiene su respuesta en la base, y su mejor coseno es 0,33',
        'q7 «¿Cuánto cuesta un vuelo a Roma?» no tiene respuesta en la base, y su mejor coseno es 0,41',
        'Para contestar a q1 hace falta un umbral de 0,33 o menos; para rechazar q7 hace falta uno mayor que 0,41',
        'Con un umbral de 0,37 se cumplen las dos cosas a la vez',
      ],
      faultyLine: 3,
    },
    {
      id: 'fallos-rag.hoja.2',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Este código lista las consultas a las que el sistema contesta «no lo sé» con un umbral de 0,5. `Q` y `D` vienen del módulo `embeddings` y NumPy ya está importado como `np`. Debería quedar `sin_respuesta` igual a `[1, 7]`: q1 y q7. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Piensa en la respuesta de q0: ¿qué valor tiene en `respuestas` y cómo la trata la última línea?',
        'En Python, `0` cuenta como falso en una condición. Piensa si eso es compatible con que `0` sea una posición válida.',
      ],
      explain:
        'Una posición `0` es una respuesta válida, pero en una condición se comporta como `None`. Ejecuta mentalmente el código para la primera consulta.',
      solution:
        'La cuarta línea está mal: `not r` es verdadero para `None`, pero también para `0`, y q0 recupera el documento `0` (el desayuno) con coseno $0{,}77$, así que acaba en `sin_respuesta`: sale `[0, 1, 7]` en vez de `[1, 7]`. Se arregla preguntando por lo que se quiere, `r is None`.',
      lines: [
        'S = Q @ D.T',
        'mejor = np.argmax(S, axis=1)',
        'respuestas = [int(m) if S[i, m] >= 0.5 else None for i, m in enumerate(mejor)]',
        'sin_respuesta = [i for i, r in enumerate(respuestas) if not r]',
      ],
      faultyLine: 3,
    },
    {
      id: 'fallos-rag.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento analiza un fallo del RAG del hotel con los embeddings reales del modelo paraphrase-multilingual-MiniLM-L12-v2. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Comprueba los cosenos que cita y el orden en que los compara.',
        'Pregúntate si la solución que propone ataca la causa del fallo o solo el síntoma.',
      ],
      explain:
        'Revisa cada línea por separado: el dato, la causa que se le atribuye y el remedio que se propone.',
      solution:
        'No hay ningún error. El coseno de q2 es $0{,}61$ con la sala de $30$ personas y $0{,}54$ con la de $300$; para el modelo, «300 personas» y «30 personas» son casi la misma frase ($0{,}84$). Subir el umbral no ayuda, porque la respuesta mala puntúa más que la buena; un filtro por metadatos, que trata la capacidad como un dato exacto, sí.',
      lines: [
        'Para «¿Hay una sala para 250 asistentes?», la sala de 30 personas puntúa 0,61 y la de 300, 0,54',
        'El modelo da un coseno de 0,84 a «300 personas» y «30 personas»: para él son casi la misma frase',
        'Subir el umbral no lo arregla, porque la sala equivocada puntúa más que la correcta',
        'Un filtro por metadatos que exija capacidad de al menos 250 descarta la sala de 30 y deja la de 300',
      ],
      faultyLine: null,
    },
  ],
};
