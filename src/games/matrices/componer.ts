import type { Project } from '../../content/schema';
import { componerWarmup } from './componer.calentamiento';
import { py } from '../py';
import { RESENAS, capaLab, type Cloud } from './datos';

/**
 * Las reseñas tal como llegan a la capa del jugador cuando hay otra delante: la tabla de pesos nombra
 * cada columna por lo que entra en ella, que ya no es un rasgo suelto sino lo que dejó la primera capa.
 */
const llegan = (axes: [string, string]): Cloud => ({ ...RESENAS, axes });

/** Lo que mide la meta de las preguntas con neurona: la que viene detrás de las dos capas. */
const ACIERTOS = {
  metric: 'acc',
  op: 'gte',
  target: 1,
  label: 'Aciertos de la neurona siguiente',
  format: 'percent',
} as const;

/** Cada palabra llega a la diana a la que la habrían llevado dos capas: la peor distancia es 0. */
const EN_SU_DIANA = {
  metric: 'target_err',
  op: 'lte',
  target: 0,
  label: 'Distancia de la palabra más lejana a su diana',
} as const;

/** La neurona siguiente solo mira la primera salida: responde «positiva» si es mayor que 0. */
const MIRA_SALIDA_1 = { w: [1, 0] as [number, number], b: 0 };

/** Una primera capa que mezcla: la salida 1 es intensidad + tono, y la 2, intensidad − tono. */
const MEZCLA = { i: [1, 1] as [number, number], j: [1, -1] as [number, number] };

/** Una primera capa que intercambia los rasgos: el tono pasa a la salida 1 y la intensidad, a la 2. */
const INTERCAMBIA = { i: [0, 1] as [number, number], j: [1, 0] as [number, number] };

/** Dónde deja cada reseña una capa, dada por lo que hace con sus dos rasgos. */
const dianas = (f: (x: number, y: number) => [number, number]): Record<string, [number, number]> =>
  Object.fromEntries(RESENAS.points.map((p) => [p.id, f(p.x, p.y)]));

/**
 * Tercer proyecto de la Órbita 0: dos capas seguidas. Cada capa prepara el trabajo de la siguiente;
 * dos capas lineales se funden en una sola matriz (por eso hace falta algo no lineal entre ellas);
 * lo que una capa destruye no lo recupera la siguiente; las áreas se multiplican y el orden importa.
 */
export const componer: Project = {
  id: 'componer',
  name: 'Componer',
  sub: 'Dos capas seguidas',
  bigPicture: {
    parts: ['linear', 'activation'],
    text: 'Un bloque del modelo encadena varias transformaciones, una tras otra: el orden en que se aplican importa. Dos capas lineales seguidas equivalen a una sola, la matriz producto, y por eso entre ellas se pone una activación que las dobla. Aquí ves cómo se componen dos transformaciones y por qué $AB$ no es $BA$.',
  },
  warmup: componerWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'componer.ex00.1',
          type: 'laboratorio',
          purpose: {
            why: 'En una red, cada capa recibe lo que deja la anterior, no los datos originales. Si la primera ha mezclado los rasgos, la segunda trabaja con esa mezcla: su tarea es dejarle a la neurona siguiente lo que necesita.',
            aim: 'Vas a construir la segunda capa de una red cuya primera capa ya ha mezclado los rasgos, hasta que la neurona del final distinga las reseñas.',
            takeaway:
              'La primera capa dejó «intensidad + tono» y «intensidad − tono». Restar una salida de la otra deja el tono solo, y la neurona acierta. Cada capa prepara el trabajo de la siguiente: la segunda se entrena sobre lo que le da la primera.',
          },
          prompt:
            'Una primera capa, fija, ya ha mezclado los dos rasgos de cada reseña: los cuadraditos marcan dónde las deja. Tu capa va detrás, y la neurona siguiente solo mira tu primera salida. Ahora mismo le llega «intensidad + tono» y solo acierta con la mitad.\n\nConstruye la segunda capa para que la neurona acierte con las seis.',
          hints: [
            'Mira los cuadraditos: las reseñas positivas están abajo a la derecha y las negativas, arriba a la izquierda. Lo que las separa es la diferencia entre las dos coordenadas.',
            'Tu primera salida tiene que restar la segunda coordenada de los cuadraditos a la primera. Lleva $\\hat{\\jmath}$ hacia la izquierda, al otro lado del eje vertical.',
          ],
          explain:
            'Tu capa no ve los rasgos originales, sino la mezcla. La primera coordenada de un cuadradito es intensidad más tono, y la segunda, intensidad menos tono. Su diferencia es el doble del tono: la intensidad se cancela.',
          solution:
            'Una capa que vale: $\\hat{\\imath}$ en $(1, 0)$ y $\\hat{\\jmath}$ en $(-1, 1)$. La primera salida es la primera coordenada menos la segunda, el doble del tono: positiva en las tres buenas y negativa en las tres malas. Valen muchas, siempre que la primera fila reste una coordenada de la otra. Intercambiar las columnas no basta: deja la segunda coordenada, que mezcla los dos rasgos.',
          lab: capaLab(llegan(['intensidad + tono', 'intensidad − tono']), {
            range: 5.5,
            before: MEZCLA,
            readout: MIRA_SALIDA_1,
          }),
          goals: [ACIERTOS],
          solved: { jx: -1 },
        },
        {
          id: 'componer.ex00.2',
          type: 'laboratorio',
          purpose: {
            why: 'Dos capas lineales seguidas, sin nada en medio, hacen lo mismo que una sola: la matriz producto. Por eso las redes ponen una función no lineal, como ReLU, entre capa y capa. Sin ella, apilar diez capas no da más que una.',
            aim: 'Vas a sustituir dos capas seguidas por una sola, llevando cada reseña a la diana donde la dejaban las dos.',
            takeaway:
              'Una sola capa, con $\\hat{\\imath}$ en $(0, 1)$ y $\\hat{\\jmath}$ en $(2, 0)$, hace el trabajo de las dos: es su producto. Lo que puede hacer una cadena de capas lineales lo hace una matriz. Para ganar algo al apilarlas hace falta una activación entre ellas.',
          },
          prompt:
            'Una red tenía dos capas lineales seguidas: la primera intercambia los rasgos (el tono pasa a la primera salida) y la segunda dobla la primera salida. Las dianas marcan dónde dejaban las dos, juntas, cada reseña.\n\nHaz que una sola capa lleve las seis palabras a sus dianas.',
          hints: [
            'Fíjate en «genial» y en «horrible»: tienen la misma intensidad y su diana está a la misma altura. La altura de las dianas es la intensidad, y la distancia al eje vertical, el tono.',
            'La intensidad tiene que acabar en la segunda salida: sube $\\hat{\\imath}$ al eje vertical. El tono, doblado, en la primera: lleva $\\hat{\\jmath}$ sobre el eje horizontal y alárgala.',
          ],
          explain:
            'Sigue cada rasgo por las dos capas. La intensidad: el intercambio la manda a la segunda salida, y la segunda capa no la toca. El tono: el intercambio lo manda a la primera, y la segunda capa lo dobla. Las columnas de la capa única son esos dos recorridos.',
          solution:
            'Con $\\hat{\\imath}$ en $(0, 1)$ y $\\hat{\\jmath}$ en $(2, 0)$, todas las palabras caen en su diana: la capa es el producto $\\begin{pmatrix}2&0\\\\0&1\\end{pmatrix}\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}=\\begin{pmatrix}0&2\\\\1&0\\end{pmatrix}$. Con dos palabras de distinta dirección la capa ya queda fijada. Con $\\hat{\\imath}$ en $(0, 2)$ y $\\hat{\\jmath}$ en $(1, 0)$ se dobla la intensidad: es el otro orden, y no llega.',
          lab: capaLab(RESENAS, { range: 5, targets: dianas((x, y) => [2 * y, x]) }),
          goals: [EN_SU_DIANA],
          solved: { ix: 0, iy: 1, jx: 2, jy: 0 },
        },
        {
          id: 'componer.ex00.3',
          type: 'laboratorio',
          purpose: {
            why: 'Una capa que aplasta el plano sobre una recta tira información, y ninguna capa posterior la recupera: trabaja con lo que le llega. Por eso, en una red, un cuello de botella mal entrenado limita todo lo que viene detrás.',
            aim: 'Vas a buscar la segunda capa que más reseñas salva cuando la primera ha borrado el tono, y a entender por qué no se puede pasar de ahí.',
            takeaway:
              'La primera capa deja cada reseña según su intensidad. «genial» y «horrible» caen en el mismo punto, y también «bueno» y «malo»: de cada pareja se acierta una como mucho. Cuatro de seis es el techo. Lo que una capa destruye, la siguiente no lo recupera.',
          },
          prompt:
            'Esta primera capa aplasta: lleva cada reseña a la diagonal según su intensidad, y el tono se pierde. Detrás va tu capa, y la neurona siguiente dice «positiva» si tu primera salida pasa de $3{,}5$. Ahora no lo pasa ninguna.\n\n¿Cuántas reseñas puedes salvar? Busca la capa que acierte con el máximo posible.',
          hints: [
            'Mira los cuadraditos: hay menos de seis. Las palabras con la misma intensidad han caído en el mismo punto, y a partir de ahí tu capa las mueve juntas.',
            'Solo cuenta cuánto avanza la diagonal en tu primera salida: suma la primera coordenada de $\\hat{\\imath}$ y la de $\\hat{\\jmath}$. Prueba a que entre las dos sumen $2$.',
          ],
          explain:
            'Tras la primera capa, cada reseña es un punto de la diagonal, a la altura de su intensidad. Tu primera salida es esa intensidad por un número, y la neurona corta por un umbral. Una palabra positiva y una negativa con la misma intensidad reciben siempre la misma respuesta.',
          solution:
            'Con $\\hat{\\imath}$ en $(1, 0)$ y $\\hat{\\jmath}$ en $(1, 1)$ la primera salida es el doble de la intensidad: «genial» y «feliz» pasan de $3{,}5$, «triste» y «malo» no, y se aciertan cuatro. Vale cualquier capa cuyas dos primeras coordenadas sumen $2$. No se puede más: «genial» y «horrible» son el mismo punto, «bueno» y «malo» también, y de cada pareja falla una.',
          lab: capaLab(llegan(['intensidad', 'intensidad, otra vez']), {
            range: 5.5,
            before: { i: [1, 1], j: [0, 0] },
            readout: { w: [1, 0], b: -3.5 },
          }),
          goals: [
            {
              metric: 'hits',
              op: 'gte',
              target: 4,
              label: 'Reseñas que acierta la neurona siguiente',
              format: 'integer',
            },
          ],
          solved: { jx: 1 },
        },
        {
          id: 'componer.ex00.4',
          type: 'laboratorio',
          purpose: {
            why: 'Los flujos normalizadores, unos modelos generativos, encadenan capas y necesitan saber cuánto estira o encoge el espacio la cadena entera: es el producto de los determinantes de cada capa. Las áreas no se suman: se multiplican.',
            aim: 'Vas a construir una segunda capa que compense a una primera que multiplica las áreas por cuatro, para que las dos juntas dejen el espacio con su tamaño.',
            takeaway:
              'Encoger cada columna a la mitad divide el área entre cuatro: $\\det(AB)=\\det A\\cdot\\det B=\\frac{1}{4}\\cdot 4=1$. Encoger una sola columna la deja en $2$. La escala de una cadena de capas es el producto de la de cada una.',
          },
          prompt:
            'La primera capa, fija, estira el plano al doble en las dos direcciones: los cuadraditos quedan lejos del origen y cada área se multiplica por $4$. Detrás va tu capa.\n\nHaz que las dos juntas dejen las áreas como estaban: ni más grandes ni más pequeñas. El medidor lee el determinante de las dos capas juntas.',
          hints: [
            'El medidor empieza en $4$: tu capa no hace nada todavía. Encoge una columna a la mitad y mira cuánto baja.',
            'Encoger una columna divide el área entre dos. Hace falta dividir entre cuatro: encoge también la otra.',
          ],
          explain:
            'El determinante de las dos capas juntas es el de la primera por el de la segunda. La primera vale $4$, así que la tuya tiene que valer $\\frac{1}{4}$. Encoger una sola columna da $\\frac{1}{2}$, y el total se queda en $2$.',
          solution:
            'Con $\\hat{\\imath}$ en $(0{,}5;\\ 0)$ y $\\hat{\\jmath}$ en $(0;\\ 0{,}5)$ tu capa tiene determinante $\\frac{1}{4}$ y las palabras vuelven a su sitio. Vale cualquier capa de determinante $\\frac{1}{4}$, como $\\hat{\\imath}$ en $(0{,}5;\\ 0)$ y $\\hat{\\jmath}$ en $(0{,}5;\\ 0{,}5)$, que además inclina. Con $\\hat{\\imath}$ en $(-0{,}5;\\ 0)$ el determinante total es $-1$: el tamaño está bien, pero el plano queda volteado.',
          lab: capaLab(llegan(['intensidad × 2', 'tono × 2']), {
            range: 5.5,
            before: { i: [2, 0], j: [0, 2] },
          }),
          goals: [
            {
              metric: 'det_total',
              op: 'eq',
              target: 1,
              tol: 0.1,
              label: 'Determinante de las dos capas juntas',
            },
          ],
          solved: { ix: 0.5, jy: 0.5 },
        },
        {
          id: 'componer.ex00.5',
          type: 'laboratorio',
          purpose: {
            why: 'Intercambiar dos capas de una red no da error: las formas casan y todo corre, pero sale otra red. El producto de matrices no es conmutativo, y el orden de las capas es parte del modelo, igual que sus pesos.',
            aim: 'Vas a llevar las reseñas a las dianas de «primero doblar la intensidad, después intercambiar», con el intercambio ya puesto delante.',
            takeaway:
              'Tras el intercambio, la intensidad vive en la segunda salida: doblarla allí es doblar la segunda salida, no la primera. La misma operación es otra matriz según lo que haya delante. Por eso $BA$ y $AB$ casi nunca coinciden.',
          },
          prompt:
            'Las dianas marcan dónde quedan las reseñas si primero se dobla la intensidad y después se intercambian los rasgos. Pero aquí el orden es el contrario: la capa que intercambia ya va delante (los cuadraditos) y la tuya, detrás. Cuidado: poner detrás «doblar la primera salida» no da lo mismo.\n\nLleva las seis palabras a sus dianas.',
          hints: [
            'Mira los cuadraditos: tras el intercambio, la intensidad está en el eje vertical. Las dianas están el doble de altas.',
            'Hay que doblar la salida en la que está ahora la intensidad, la segunda: alarga $\\hat{\\jmath}$ hacia arriba y deja $\\hat{\\imath}$ donde está.',
          ],
          explain:
            'Doblar la intensidad antes del intercambio es doblar la primera coordenada. Después del intercambio, esa intensidad ya está en la segunda. Tu capa actúa sobre los cuadraditos, así que tiene que doblar la coordenada donde está ahora.',
          solution:
            'Con $\\hat{\\jmath}$ en $(0, 2)$ tu capa dobla la segunda salida y todas las palabras caen en su diana. Con $\\hat{\\imath}$ en $(2, 0)$, que dobla la primera, se dobla el tono: es el orden contrario y las palabras se alejan en horizontal. Las dos capas juntas son $\\begin{pmatrix}1&0\\\\0&2\\end{pmatrix}\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}=\\begin{pmatrix}0&1\\\\2&0\\end{pmatrix}$.',
          lab: capaLab(llegan(['tono', 'intensidad']), {
            range: 5.5,
            before: INTERCAMBIA,
            targets: dianas((x, y) => [y, 2 * x]),
          }),
          goals: [EN_SU_DIANA],
          solved: { jy: 2 },
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'componer.ex01.1',
          type: 'numero',
          purpose: {
            why: 'En cada bloque de un transformer hay dos capas seguidas, el MLP: una ensancha los vectores y otra los devuelve a su tamaño, con una activación en medio. Ahí está buena parte de los parámetros del modelo.',
            aim: 'Vas a contar los parámetros de las dos capas del MLP de un bloque del GPT-2 pequeño, entre pesos y sesgos.',
            takeaway:
              'Son $4\\,722\\,432$ parámetros por bloque, casi todos pesos de las dos matrices. Con 12 bloques, el MLP pasa de 56 millones: casi la mitad de los 124 millones del GPT-2 pequeño.',
          },
          prompt:
            'En cada bloque del GPT-2 pequeño, el MLP son dos capas seguidas: la primera lleva vectores de $768$ números a $3072$, y la segunda los devuelve de $3072$ a $768$. Cada capa tiene un peso por pareja de entrada y salida, y un sesgo por salida.\n\n¿Cuántos parámetros tienen las dos capas juntas?',
          hints: [
            'Cuenta cada capa por separado: pesos (salidas por entradas) más un sesgo por salida.',
            'Las dos matrices tienen los mismos pesos, $3072\\cdot 768$, pero los sesgos no: la primera tiene $3072$ salidas y la segunda, $768$.',
          ],
          explain:
            'Los pesos de una capa son salidas por entradas, y los sesgos se cuentan con las salidas. Las dos matrices del MLP guardan los mismos pesos, $3072$ por $768$, pero tienen distinto número de salidas.',
          solution:
            'Primera capa: $3072\\cdot 768+3072=2\\,362\\,368$. Segunda: $768\\cdot 3072+768=2\\,360\\,064$. Juntas, $4\\,722\\,432$ parámetros. Contar $3072$ sesgos en las dos daría $2304$ de más.',
          answer: 4722432,
          tol: 0,
        },
        {
          id: 'componer.ex01.2',
          type: 'numero',
          purpose: {
            why: 'Para entender qué hace una red con un rasgo hay que seguirlo por todas sus capas: llega a cada salida por varios caminos, y su peso final es la suma de lo que aporta cada uno. Es lo que calcula el producto de matrices.',
            aim: 'Vas a seguir el tono por dos capas seguidas y a sumar lo que llega a la primera salida por cada camino.',
            takeaway:
              'El tono llega a la salida 1 por dos caminos: directo, con peso $1\\cdot 1$, y pasando por la salida 2, con peso $2\\cdot 1$. Suman $3$: la entrada de la fila 1 y la columna 2 del producto es esa suma de caminos.',
          },
          prompt:
            'Dos capas seguidas. La primera, $B=\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$, suma el tono a la intensidad en la salida 1 y deja el tono en la 2. La segunda, $A=\\begin{pmatrix}1&2\\\\0&1\\end{pmatrix}$, suma a su salida 1 el doble de su salida 2.\n\nEn la capa única que equivale a las dos, ¿cuánto pesa el tono en la salida 1? Puedes construir $A$ en el laboratorio.',
          hints: [
            'El tono sale de $B$ por dos sitios: con peso $1$ en la salida 1 y con peso $1$ en la salida 2. Sigue cada uno por $A$.',
            'Lo que está en la salida 1 de $B$ llega a la salida 1 de $A$ por $1$; lo que está en la salida 2, por $2$. Multiplica en cada camino y suma.',
          ],
          explain:
            'Cada camino de un rasgo a una salida multiplica los pesos que recorre, y los caminos se suman. Es la cuenta de la fila 1 de $A$ por la columna 2 de $B$.',
          solution:
            '$(AB)_{12}=1\\cdot 1+2\\cdot 1=3$. La capa única es $AB=\\begin{pmatrix}1&3\\\\0&1\\end{pmatrix}$. Si tomas solo el camino directo sale $1$, y si multiplicas $1\\cdot 2$ sale $2$: el camino que pasa por la salida 2 se suma al otro.',
          lab: capaLab(llegan(['intensidad + tono', 'tono']), {
            range: 5.5,
            before: { i: [1, 0], j: [1, 1] },
          }),
          answer: 3,
          tol: 0,
        },
        {
          id: 'componer.ex01.3',
          type: 'opcion',
          purpose: {
            why: 'Si al montar una red se olvida la activación entre dos capas, el modelo entrena sin quejarse, pero es una sola matriz disfrazada de dos: gasta más memoria y no aprende nada que una capa no pueda.',
            aim: 'Vas a decidir por qué apilar capas lineales sin nada entre ellas no hace la red más capaz.',
            takeaway:
              'Dos capas lineales seguidas son el producto de sus matrices: una capa más. Por mucho que mezclen, la frontera de la neurona sigue siendo una recta. Una activación como ReLU entre ellas es lo que rompe esa cuenta.',
          },
          prompt:
            'Una red tiene dos capas lineales seguidas y nada entre ellas. En el laboratorio, la primera está fija y la segunda es tuya: muévela y mira cómo se mueven las reseñas. ¿Por qué esta red no puede aprender nada que una sola capa lineal no pueda?',
          hints: [
            'Cada vez que mueves tu capa, las seis palabras se mueven juntas, como con una sola matriz. ¿Hay alguna colocación que no consiga una capa sola?',
            'Escribe la salida de las dos capas, $A(B\\vec{x})$, y agrupa las matrices.',
          ],
          explain:
            '$A(B\\vec{x})=(AB)\\vec{x}$: las dos capas actúan como una matriz, su producto. Cualquier cosa que hagan juntas la hace una capa con esa matriz.',
          solution:
            'Las dos capas equivalen a una sola, $AB$: cada palabra acaba donde la dejaría esa matriz, y la frontera de la neurona sigue siendo una recta. No es que la segunda deshaga a la primera, ni que haga falta otro tamaño: es que todo producto de matrices es otra matriz. Una función no lineal entre ellas lo evita.',
          lab: capaLab(llegan(['intensidad + tono', 'intensidad − tono']), {
            range: 5.5,
            before: MEZCLA,
            readout: MIRA_SALIDA_1,
          }),
          options: [
            'Porque la segunda capa siempre deshace lo que hace la primera',
            'Porque dos capas lineales seguidas equivalen a una sola matriz, su producto',
            'Porque las dos capas tienen el mismo tamaño; con tamaños distintos sí ganaría',
            'Porque una red solo aprende si tiene más de dos capas',
          ],
          correct: 1,
        },
        {
          id: 'componer.ex01.4',
          type: 'numero',
          purpose: {
            why: 'Un modelo generativo que encadena capas, como un flujo normalizador, lleva la cuenta de cuánto estira el espacio la cadena entera. No multiplica las matrices: multiplica sus determinantes, que es más barato.',
            aim: 'Vas a calcular cuánto multiplican las áreas dos capas seguidas a partir del determinante de cada una.',
            takeaway:
              'La primera capa multiplica las áreas por $2$ y la segunda por $0{,}75$: juntas, por $1{,}5$. $\\det(AB)=\\det A\\cdot\\det B$, y no hace falta calcular el producto.',
          },
          prompt:
            'La primera capa es $B=\\begin{pmatrix}1&1\\\\-1&1\\end{pmatrix}$ y la segunda, $A=\\begin{pmatrix}0{,}5&0{,}5\\\\-0{,}5&1\\end{pmatrix}$. En el laboratorio están puestas las dos.\n\n¿Por cuánto multiplican las dos juntas el área de cualquier figura? Es el determinante de $AB$.',
          hints: [
            'Calcula el determinante de cada capa por separado: $ad-bc$ con sus cuatro números.',
            'Las áreas se multiplican al encadenar capas: multiplica los dos determinantes.',
          ],
          explain:
            'Cada capa multiplica las áreas por su determinante, y la segunda actúa sobre lo que deja la primera: los factores se multiplican. $\\det(AB)=\\det A\\cdot\\det B$.',
          solution:
            '$\\det B=1\\cdot 1-1\\cdot(-1)=2$ y $\\det A=0{,}5\\cdot 1+0{,}5\\cdot 0{,}5=0{,}75$. Juntas: $0{,}75\\cdot 2=1{,}5$. Sumarlos daría $2{,}75$, que no es nada: las escalas se componen multiplicando.',
          lab: capaLab(llegan(['intensidad + tono', 'tono − intensidad']), {
            range: 5.5,
            before: { i: [1, -1], j: [1, 1] },
            i: [0.5, -0.5],
            j: [0.5, 1],
          }),
          answer: 1.5,
          tol: 0,
        },
        {
          id: 'componer.ex01.5',
          type: 'vector',
          purpose: {
            why: 'En una red de verdad, entre dos capas va una activación: ReLU deja pasar lo positivo y pone a cero lo negativo. Esa cuenta tan corta es la que impide que las dos capas se fundan en una sola matriz.',
            aim: 'Vas a pasar una palabra por dos capas con ReLU en medio, paso a paso, y a ver qué cambia el corte de lo negativo.',
            takeaway:
              'Con ReLU, «feliz» acaba en $(3{,}5;\\ 0)$; sin ella, en $(2{,}5;\\ -0{,}5)$. El corte de un valor negativo cambia la salida, y ninguna matriz sola reproduce ese corte para todas las palabras.',
          },
          prompt:
            '«feliz» tiene intensidad $2$ y tono $1{,}5$. La primera capa es $B=\\begin{pmatrix}1&1\\\\-1&1\\end{pmatrix}$; después, ReLU pone a cero cada número negativo; al final, la segunda capa, $A=\\begin{pmatrix}1&2\\\\0&1\\end{pmatrix}$.\n\n¿Qué dos números salen de la red para «feliz»?',
          hints: [
            'Primero $B$ por la palabra: cada salida es una fila de $B$ por $(2;\\ 1{,}5)$. Una de las dos sale negativa.',
            'ReLU cambia la negativa por $0$ y deja la otra. Después multiplica $A$ por ese vector.',
          ],
          explain:
            'Se hace en orden: la primera capa, la activación sobre cada número y la segunda capa. ReLU actúa entre las dos, así que no se puede saltar multiplicando $AB$ de antemano.',
          solution:
            '$B$ da $(2+1{,}5;\\ -2+1{,}5)=(3{,}5;\\ -0{,}5)$. ReLU lo deja en $(3{,}5;\\ 0)$. $A$ da $(3{,}5+2\\cdot 0;\\ 0)=(3{,}5;\\ 0)$. Sin ReLU saldría $AB$ por la palabra: $(3{,}5-1;\\ -0{,}5)=(2{,}5;\\ -0{,}5)$.',
          answer: [3.5, 0],
          tol: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'componer.ex02.1',
          type: 'codigo',
          prompt:
            'En NumPy, `A @ B` entre dos matrices es su producto: la matriz que aplica primero `B` y después `A`. Ya tienes las matrices `A` y `B`. Guarda en `C` el producto de `A` por `B`.',
          hints: [
            'El plan es una sola línea: `C` es `A` por `B` con el operador `@`, el mismo que multiplica una matriz por un vector, ahora entre dos matrices. Ojo con el orden: la matriz que actúa primero se escribe a la derecha, y aquí actúa primero `B`.',
            'La pieza, con otras matrices:\n\n' +
              py(
                'P = np.array([[1, 0], [0, 2]])',
                'Q = np.array([[0, 1], [1, 0]])',
                'print(P @ Q)   # [[0 1] [2 0]]: el producto de matrices, Q actúa primero',
                'print(P * Q)   # [[0 0] [0 0]]: con * se multiplica casilla con casilla, que es otra cosa',
              ) +
              '\n\nLa primera fila de `P @ Q` sale de la primera fila de `P` por cada columna de `Q`; no es lo mismo que multiplicar casilla con casilla.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('C = ___ @ ___') +
              '\n\nEn el primer hueco va la matriz que actúa después y en el segundo la que actúa primero. Si pones `B @ A`, sale el producto en el orden contrario.',
          ],
          explain:
            'El operador `@` entre matrices calcula el producto, con el orden de la escritura matemática: la matriz de la derecha actúa primero. Si sale una matriz con los productos entrada a entrada, se ha usado otra operación.',
          solution:
            'Se escribe `C = A @ B`, que vale $\\begin{pmatrix}4&6\\\\1&3\\end{pmatrix}$ y aplica primero `B` y después `A`. Con `A * B` se multiplicaría entrada a entrada y saldría $\\begin{pmatrix}2&0\\\\0&3\\end{pmatrix}$, que no es la composición.',
          requirements: [
            '`C` existe y es un array de NumPy con números, de 2 filas y 2 columnas.',
            '`C` es el producto de matrices de `A` por `B`, que aplica primero `B` y después `A`: no vale el producto entrada a entrada ni el producto en el orden contrario.',
          ],
          starter: `import numpy as np

# A y B son matrices de 2 filas y 2 columnas (arrays de NumPy).
# A[0] es la primera fila de A y A[:, 0] su primera columna.
A = np.array([[1, 2], [0, 1]])
B = np.array([[2, 0], [1, 3]])

# PASO 1. El producto de A por B: la matriz que aplica primero B y después A.
# Por qué: dos transformaciones seguidas se resumen en una sola matriz, el producto.
# Se lee de derecha a izquierda: en el producto de A por B actúa primero B, la más
# cercana al vector.
# El operador @ entre dos matrices calcula el producto de matrices. No lo confundas
# con *, que multiplica casilla con casilla y no es una composición.
# El resultado es otra matriz de 2 filas y 2 columnas.
C = None

# Para ver qué vale algo antes de entregar: print(C) y pulsa «Ejecutar».
`,
          checks: `_arr = isinstance(C, np.ndarray) and np.issubdtype(C.dtype, np.number)
_ok = _arr and C.shape == (2, 2)
_elem = _ok and np.allclose(C, A * B)
_rev = _ok and np.allclose(C, B @ A)
check(_arr, "\`C\` tiene que ser un array de NumPy con números: la matriz producto.")
check((not _arr) or C.shape == (2, 2), "\`C\` tiene que ser una matriz de 2 filas y 2 columnas.")
check((not _ok) or not _elem, "\`C\` sale de multiplicar entrada a entrada, con \`*\`. El producto de matrices es otra operación, y se escribe con \`@\`.")
check((not _ok) or not _rev, "\`C\` es el producto en orden contrario: el de \`B\` por \`A\`. La matriz que actúa primero va a la derecha.")
check((not _ok) or _elem or _rev or np.allclose(C, [[4, 6], [1, 3]]), "\`C\` tiene que valer (4, 6) en la primera fila y (1, 3) en la segunda: cada entrada sale de una fila de \`A\` por una columna de \`B\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 2], [0, 1]])\nB = np.array([[2, 0], [1, 3]])\nC = A @ B\n',
        },
        {
          id: 'componer.ex02.2',
          type: 'codigo',
          prompt:
            'Cada columna de un producto es la matriz de la izquierda por la columna correspondiente de la de la derecha: la primera columna de $AB$ es $A$ por la primera columna de $B$. Ya tienes `A` y `B`. Calcula una a una las dos columnas de $AB$ y guárdalas en `col0` y `col1`; guarda en `C` la matriz que las tiene por columnas. La columna `k` de `B` se coge con `B[:, k]`.',
          hints: [
            'El plan son tres líneas. `col0` es `A` por la primera columna de `B`: la columna se coge con `B[:, 0]` y se multiplica con `@`. `col1` es lo mismo con la segunda columna, `B[:, 1]`. Y `C` junta las dos columnas, una al lado de la otra. Ojo: `B[0]` es la primera fila, no la columna.',
            'Las piezas, con otras matrices:\n\n' +
              py(
                'P = np.array([[1, 0], [2, 1]])',
                'Q = np.array([[3, 4], [5, 6]])',
                'print(Q[:, 1])                  # [4 6]: la segunda columna de Q',
                'print(Q[1])                     # [5 6]: la segunda fila de Q, que no es lo mismo',
                'u = P @ Q[:, 0]                 # P por la primera columna de Q',
                'print(u)                        # [ 3 11]',
                'print(np.column_stack([u, u]))  # [[ 3  3] [11 11]]: u dos veces, una al lado de la otra',
                'print(np.array([u, u]))         # [[ 3 11] [ 3 11]]: u dos veces, pero como filas',
              ) +
              '\n\nEn `B[:, k]`, los dos puntos significan «todas las filas» y `k` elige la columna.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'col0 = A @ B[:, ___]',
                'col1 = A @ B[:, ___]',
                'C = np.column_stack([___, ___])',
              ) +
              '\n\nEn los dos últimos huecos van `col0` y `col1`, en ese orden. Con `np.array([col0, col1])` las columnas quedarían como filas y `C` saldría traspuesta.',
          ],
          explain:
            'Cada columna de `C` es la imagen por `A` de una columna de `B`. Al juntarlas tienen que quedar como columnas, no como filas.',
          solution:
            'Se escribe `col0 = A @ B[:, 0]`, `col1 = A @ B[:, 1]` y `C = np.column_stack([col0, col1])`. Con los datos, `col0` vale $(7, 6)$ y `col1` vale $(2, 6)$, y `C` es $\\begin{pmatrix}7&2\\\\6&6\\end{pmatrix}$, igual que el producto completo. Si las juntas con `np.array([col0, col1])`, salen como filas y la matriz queda traspuesta.',
          requirements: [
            '`col0` y `col1` existen y son arrays de NumPy con 2 componentes, todas números.',
            '`col0` y `col1` son la primera y la segunda columna de $AB$, cada una calculada con una columna de `B` y no con una fila.',
            '`C` existe y es un array de NumPy con números, de 2 filas y 2 columnas, que tiene `col0` como primera columna y `col1` como segunda: no vale ponerlas como filas.',
          ],
          starter: `import numpy as np

# A y B son matrices de 2 filas y 2 columnas (arrays de NumPy).
# B[:, 0] es la primera columna de B y B[:, 1] la segunda: los dos puntos significan
# «todas las filas» y el número elige la columna. B[0], en cambio, es la primera FILA.
A = np.array([[1, 2], [3, 1]])
B = np.array([[1, 2], [3, 0]])

# PASO 1. col0: la primera columna del producto AB.
# Por qué: cada columna de AB es A multiplicada por la columna correspondiente de B.
# Es decir, A transforma cada columna de B, igual que transforma cualquier vector.
# A @ v multiplica la matriz A por el vector v y da otro vector (un array de 2 números).
# Aquí v es la primera columna de B.
col0 = None

# PASO 2. col1: la segunda columna de AB, con la misma idea y la segunda columna de B.
col1 = None

# PASO 3. C: la matriz que tiene col0 como primera columna y col1 como segunda.
# Por qué: al juntarlas tienen que quedar una al lado de la otra, como columnas.
# np.column_stack([u, v]) coloca u y v como columnas de una matriz.
# Ojo: np.array([u, v]) las pondría como filas, y la matriz saldría traspuesta.
C = None

# Para ver qué vale algo antes de entregar: print(col0) y pulsa «Ejecutar».
`,
          checks: `def _v(a):
    return isinstance(a, np.ndarray) and a.shape == (2,) and np.issubdtype(a.dtype, np.number)

_m = isinstance(C, np.ndarray) and C.shape == (2, 2) and np.issubdtype(C.dtype, np.number)
check(_v(col0), "\`col0\` tiene que ser un array de NumPy con 2 números: la primera columna del producto.")
check((not _v(col0)) or np.allclose(col0, [7, 6]), "\`col0\` tiene que valer (7, 6): es \`A\` multiplicada por la primera columna de \`B\`, que se coge con \`B[:, 0]\`. Con \`B[0]\` se coge la primera fila.")
check(_v(col1), "\`col1\` tiene que ser un array de NumPy con 2 números: la segunda columna del producto.")
check((not _v(col1)) or np.allclose(col1, [2, 6]), "\`col1\` tiene que valer (2, 6): es \`A\` multiplicada por la segunda columna de \`B\`, que se coge con \`B[:, 1]\`.")
check(_m, "\`C\` tiene que ser una matriz de NumPy de 2 filas y 2 columnas, con \`col0\` y \`col1\` como columnas.")
check((not _m) or not np.allclose(C, [[7, 6], [2, 6]]), "\`C\` está traspuesta: \`col0\` y \`col1\` han quedado como filas. Para colocarlas como columnas sirve \`np.column_stack\`.")
check((not _m) or np.allclose(C, [[7, 6], [2, 6]]) or np.allclose(C, [[7, 2], [6, 6]]), "\`C\` tiene que valer (7, 2) en la primera fila y (6, 6) en la segunda: \`col0\` es su primera columna y \`col1\` la segunda.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 2], [3, 1]])\nB = np.array([[1, 2], [3, 0]])\ncol0 = A @ B[:, 0]\ncol1 = A @ B[:, 1]\nC = np.column_stack([col0, col1])\n',
        },
        {
          id: 'componer.ex02.3',
          type: 'codigo',
          prompt:
            'Una transformación compuesta aplica varias matrices **en el orden dado**: la primera de la lista actúa primero. Escribe `componer(lista)`, que recibe una lista de matrices de $2\\times 2$ y devuelve la matriz que las aplica en ese orden. Después, guarda en `C` lo que devuelve para `[R, S]`: primero el giro `R` y luego el estiramiento `S`.',
          hints: [
            'El plan, dentro de `componer`: empieza con `M` igual a la identidad, `np.eye(2)`, la matriz que no cambia nada. Recorre la lista con un `for` y, para cada matriz `N`, actualiza `M` multiplicando `N` por la izquierda de lo que ya hay. Al final devuelve `M`. Fuera de la función, `C` es la llamada con la lista `[R, S]`. Ojo: si multiplicas por la derecha, la composición sale en el orden contrario.',
            'Las piezas, con otra función y otros datos:\n\n' +
              py(
                'def suma_todo(lista):',
                '    total = 0               # el valor de partida, antes de mirar la lista',
                '    for n in lista:         # n toma cada elemento de la lista, uno por vuelta',
                '        total = total + n   # el resultado nuevo sustituye al anterior',
                '    return total            # devuelve el valor y termina la función',
                '',
                'print(suma_todo([4, 5, 6]))   # 15',
                'print(np.eye(2))              # [[1. 0.] [0. 1.]]: la identidad',
                'print(np.eye(2) @ R)          # [[ 0. -1.] [ 1.  0.]]: es R, sin cambios',
              ) +
              '\n\nLo que va dentro de `def` y de `for` lleva 4 espacios más de sangría que la línea de arriba. Multiplicar por la identidad no altera una matriz. Y una lista se escribe con corchetes: `[R, S]`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def componer(lista):',
                '    M = np.eye(2)',
                '    for N in lista:',
                '        M = ___ @ ___',
                '    return M',
                '',
                'C = componer(___)',
              ) +
              '\n\nEn `M = ___ @ ___` va `N` a la izquierda de `M`: la matriz nueva actúa después. En el último hueco va la lista de `R` y `S`, en ese orden.',
          ],
          explain:
            'Cada matriz nueva actúa después de las anteriores, así que se coloca a la izquierda de lo que ya hay. Si se coloca a la derecha, la composición sale en el orden contrario.',
          solution:
            'Se parte de la identidad y, para cada matriz `N` de la lista, se hace `M = N @ M`: la nueva queda a la izquierda. Con `[R, S]` sale `S @ R`, es decir $\\begin{pmatrix}0&-2\\\\1&0\\end{pmatrix}$. Con `M = M @ N` la composición saldría al revés, como `R @ S`, que es $\\begin{pmatrix}0&-1\\\\2&0\\end{pmatrix}$.',
          requirements: [
            '`componer` existe y es una función que recibe una lista de matrices de $2\\times 2$.',
            'La función devuelve un array de NumPy con números, de 2 filas y 2 columnas, que aplica las matrices de la lista en el orden dado: la primera de la lista actúa primero.',
            'Se prueba con otras listas además de `[R, S]`, entre ellas la misma en el orden contrario y una con tres matrices, y la función no puede dar ningún error con ellas.',
            '`C` es lo que devuelve `componer` para la lista de `R` y `S`.',
          ],
          starter: `import numpy as np

# R: el giro de un cuarto de vuelta. S: el estiramiento al doble en horizontal.
# Las dos son arrays de NumPy de 2 filas y 2 columnas.
R = np.array([[0, -1], [1, 0]])
S = np.array([[2, 0], [0, 1]])


def componer(lista):
    # lista es una lista de matrices de 2 por 2, por ejemplo [R, S].
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría):
    # así sabe Python que es parte de ella.
    # La función tiene que servir para cualquier lista, también más larga: las
    # comprobaciones la prueban con otras.

    # PASO 1. Devuelve la matriz que aplica las de la lista en orden.
    # La primera de la lista actúa primero.
    # Por qué: en un producto, la matriz que actúa primero es la de la derecha;
    # cada matriz nueva de la lista actúa después de las anteriores, así que
    # se coloca a la izquierda de lo que ya llevas acumulado.
    # Cómo: empieza con M = np.eye(2), la identidad (la matriz que no cambia nada,
    # el punto de partida de un producto). Recorre la lista con
    # for N in lista: (N toma cada matriz, una por vuelta) y, dentro del for,
    # actualiza M con el producto de N y M: M = ... @ ...
    # Al terminar el bucle, return M devuelve el resultado y termina la función.
    return None


# PASO 2. Llama a la función con la lista [R, S] y guarda lo que devuelve.
# Por qué: primero actúa el giro R y después el estiramiento S.
C = None

# Para ver qué vale algo antes de entregar: print(C) y pulsa «Ejecutar».
`,
          checks: `_R = np.array([[0, -1], [1, 0]])
_S = np.array([[2, 0], [0, 1]])
_H = np.array([[1, 1], [0, 1]])
_f = callable(globals().get("componer"))
def _call(*args):
    try:
        return componer(*args)
    except Exception:
        return None
def _mat(m):
    return isinstance(m, np.ndarray) and m.shape == (2, 2) and np.issubdtype(m.dtype, np.number)
_a = _call([_R, _S]) if _f else None
_b = _call([_S, _R]) if _f else None
_c = _call([_R, _S, _H]) if _f else None
_all = _f and _mat(_a) and _mat(_b) and _mat(_c)
_rev = _all and np.allclose(_a, _R @ _S) and np.allclose(_b, _S @ _R) and np.allclose(_c, _R @ _S @ _H)
_good = _all and np.allclose(_a, _S @ _R) and np.allclose(_b, _R @ _S) and np.allclose(_c, _H @ _S @ _R)
check(_f, "Hay que definir una función \`componer\` que reciba la lista de matrices.")
check((not _f) or _all, "\`componer\` tiene que devolver una matriz de NumPy de 2 filas y 2 columnas.")
check((not _all) or not _rev, "\`componer\` devuelve el producto en orden contrario: la primera matriz de la lista es la que actúa primero, y la que actúa primero va a la derecha del producto.")
check((not _all) or _rev or _good, "Con la lista de \`R\` y \`S\` la función tiene que devolver la matriz que gira primero y estira después, \`S\` por \`R\`. Cada matriz nueva de la lista se multiplica por la izquierda de lo acumulado.")
check((not _good) or (_mat(C) and np.allclose(C, _S @ _R)), "\`C\` tiene que ser lo que devuelve \`componer\` con la lista de \`R\` y \`S\`.")
`,
          reference: `import numpy as np

R = np.array([[0, -1], [1, 0]])
S = np.array([[2, 0], [0, 1]])


def componer(lista):
    M = np.eye(2)
    for N in lista:
        M = N @ M
    return M


C = componer([R, S])
`,
        },
        {
          id: 'componer.ex02.4',
          type: 'codigo',
          prompt:
            'Con matrices el orden importa: `A @ B` y `B @ A` casi nunca coinciden. Ya tienes `A`, una inclinación, y `B`, un estiramiento. Guarda en `AB` el producto de `A` por `B`, en `BA` el de `B` por `A`, y en `iguales` si las dos matrices son iguales: un solo `True` o `False`. Para comparar matrices, `np.allclose(X, Y)` devuelve un solo valor.',
          hints: [
            'El plan son tres líneas. `AB` es el producto con `A` a la izquierda y `B` a la derecha. `BA` es el producto con `B` a la izquierda. Y `iguales` compara las dos matrices con `np.allclose(AB, BA)`, que da un solo `True` o `False`. No uses `==`: entre arrays da otro array de `True` y `False`, uno por casilla.',
            'Las piezas, con otras matrices:\n\n' +
              py(
                'P = np.array([[1, 0], [0, 2]])',
                'Q = np.array([[1, 0], [0, 2]])',
                'print(P == Q)                  # [[ True  True] [ True  True]]: un array, no un solo valor',
                'print(np.allclose(P, Q))       # True: un solo valor, porque todas las casillas coinciden',
                'print(np.allclose(P, 3 * Q))   # False: basta una casilla distinta',
              ) +
              '\n\n`np.allclose(X, Y)` da `True` solo si todas las casillas de `X` y de `Y` son iguales (o casi).',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('AB = ___ @ ___', 'BA = ___ @ ___', 'iguales = np.allclose(___, ___)') +
              '\n\nEn `AB` va `A` a la izquierda de `B`, y en `BA` al revés. Comparar con `==` dejaría `iguales` como un array y no como un solo valor.',
          ],
          explain:
            'Los dos productos usan los mismos factores en distinto orden: se calcula cada uno por separado y se comparan al final. Para obtener un único valor, hay que comparar con una función y no con el operador de igualdad.',
          solution:
            '`AB = A @ B` vale $\\begin{pmatrix}2&1\\\\0&1\\end{pmatrix}$ y `BA = B @ A` vale $\\begin{pmatrix}2&2\\\\0&1\\end{pmatrix}$. Se comparan con `np.allclose(AB, BA)`, que da `False`. Estirar y después inclinar ($AB$) no es lo mismo que inclinar y después estirar ($BA$).',
          requirements: [
            '`AB` y `BA` existen y son arrays de NumPy con números, de 2 filas y 2 columnas: el producto de `A` por `B` y el de `B` por `A`, cada uno en su orden.',
            '`iguales` existe y es un solo `True` o `False`, no una matriz de valores: dice si `AB` y `BA` son iguales.',
          ],
          starter: `import numpy as np

# A es una inclinación y B un estiramiento: dos arrays de NumPy de 2 filas y 2 columnas.
A = np.array([[1, 1], [0, 1]])
B = np.array([[2, 0], [0, 1]])

# PASO 1. AB: el producto de A por B, que aplica primero B y después A.
# Por qué: en un producto de matrices el orden importa, así que hay que calcular
# los dos productos por separado antes de compararlos.
# El operador @ entre dos matrices es el producto (la matriz de la derecha actúa primero).
AB = None

# PASO 2. BA: el producto de B por A, con los mismos factores en el orden contrario.
BA = None

# PASO 3. iguales: un solo True o False que diga si AB y BA son iguales.
# Por qué: es lo que demuestra que el orden de los factores sí altera el producto.
# Si comparas dos arrays con ==, el resultado es otro array, con un True o un False
# por casilla. Para obtener un solo valor, usa np.allclose(X, Y): da True si todas
# las casillas de X e Y coinciden y False si alguna es distinta.
iguales = None

# Para ver qué vale algo antes de entregar: print(iguales) y pulsa «Ejecutar».
`,
          checks: `def _mat(m):
    return isinstance(m, np.ndarray) and m.shape == (2, 2) and np.issubdtype(m.dtype, np.number)

_ab = _mat(AB)
_ba = _mat(BA)
_b = isinstance(iguales, (bool, np.bool_))
check(_ab, "\`AB\` tiene que ser una matriz de NumPy de 2 filas y 2 columnas: el producto de \`A\` por \`B\`.")
check((not _ab) or np.allclose(AB, [[2, 1], [0, 1]]), "\`AB\` tiene que valer (2, 1) en la primera fila y (0, 1) en la segunda: es el producto de \`A\` por \`B\`, que aplica primero \`B\`.")
check(_ba, "\`BA\` tiene que ser una matriz de NumPy de 2 filas y 2 columnas: el producto de \`B\` por \`A\`.")
check((not _ba) or np.allclose(BA, [[2, 2], [0, 1]]), "\`BA\` tiene que valer (2, 2) en la primera fila y (0, 1) en la segunda: es el producto de \`B\` por \`A\`, que aplica primero \`A\`.")
check(_b, "\`iguales\` tiene que ser un solo \`True\` o \`False\`. La comparación con \`==\` da una matriz de valores; \`np.allclose\` da uno solo.")
check((not _b) or not bool(iguales), "\`iguales\` vale \`True\`, pero \`AB\` y \`BA\` no coinciden: el orden de los factores sí altera el producto de matrices.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 1], [0, 1]])\nB = np.array([[2, 0], [0, 1]])\nAB = A @ B\nBA = B @ A\niguales = np.allclose(AB, BA)\n',
        },
        {
          id: 'componer.ex02.5',
          type: 'codigo',
          prompt:
            'Una red tiene dos capas lineales seguidas, sin función de activación entre ellas: primero `W1` y después `W2`, así que para una entrada `x` la salida es `W2 @ (W1 @ x)`. Ya tienes las dos matrices y la entrada. Guarda en `W` la matriz única que equivale a las dos capas, y en `y` la salida de esa capa única para `x`.',
          hints: [
            'El plan son dos líneas. `W` es el producto de las dos capas: `W1` actúa primero, así que va a la derecha, y `W2` va a la izquierda. `y` es la salida de la capa única: `W` multiplicada por `x` con `@`. Para comprobar, `W` tiene que ser de 2 filas y 2 columnas; si te sale de 3 por 3, has puesto las capas al revés.',
            'Las piezas, con otras matrices:\n\n' +
              py(
                'P = np.array([[1, 2, 0], [0, 1, 1]])     # 2 filas, 3 columnas: lleva 3 números a 2',
                'Q = np.array([[1, 0], [0, 1], [1, 1]])   # 3 filas, 2 columnas: lleva 2 números a 3',
                'print((P @ Q).shape)   # (2, 2): primero actúa Q y luego P',
                'print((Q @ P).shape)   # (3, 3): en el orden contrario sale otra forma',
                'v = np.array([1, 2])',
                'print(P @ Q @ v)       # [5 5]: la matriz producto por un vector',
              ) +
              '\n\n`.shape` da el tamaño de una matriz como (filas, columnas). En un producto, las columnas de la de la izquierda tienen que ser tantas como las filas de la de la derecha.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('W = ___ @ ___', 'y = ___ @ x') +
              '\n\nEn `W` va primero `W2` y después `W1`. En `y` va la capa única `W`, no `W1` ni `W2`.',
          ],
          explain:
            'La capa que actúa después va a la izquierda del producto. Comprueba los tamaños: la matriz única tiene que llevar la entrada de 2 componentes a una salida de 2, y si sale de $3\\times 3$ las capas están al revés.',
          solution:
            'Se escribe `W = W2 @ W1`, de tamaño $2\\times 2$: $\\begin{pmatrix}1&5\\\\1&1\\end{pmatrix}$. Con `x` en $(1, 2)$, `y` vale $(11, 3)$, igual que la salida de las dos capas por separado. Con `W1 @ W2` saldría una matriz de $3\\times 3$ que no sirve para `x`. Por eso hace falta una activación no lineal entre capas: sin ella, apilar capas lineales no aprende más que una sola.',
          requirements: [
            '`W` existe y es un array de NumPy con números, de 2 filas y 2 columnas: lleva una entrada de 2 componentes a una salida de 2.',
            '`W` equivale a las dos capas: la primera, `W1`, actúa primero y la segunda, `W2`, después.',
            '`y` existe y es un array de NumPy con 2 componentes, las dos números: la salida de la capa única `W` para `x`.',
          ],
          starter: `import numpy as np

# W1: la primera capa, una matriz de 3 filas y 2 columnas: lleva 2 números a 3.
# W2: la segunda capa, de 2 filas y 3 columnas: lleva esos 3 números a 2.
# x: la entrada, un array con 2 números.
W1 = np.array([[1, 2], [0, 1], [-1, 1]])
W2 = np.array([[2, 0, 1], [1, -1, 0]])
x = np.array([1, 2])

# PASO 1. W: la matriz única que equivale a las dos capas.
# Por qué: sin una función de activación entre ellas, dos capas lineales seguidas
# se funden en una sola matriz, que es el producto de las dos.
# Primero actúa W1 y después W2; en un producto, la que actúa primero va a la
# derecha. Se multiplican con @, como cualquier par de matrices.
# Comprueba el resultado con W.shape: tiene que ser (2, 2), de 2 filas y 2 columnas,
# porque lleva la entrada de 2 números a una salida de 2.
W = None

# PASO 2. y: la salida de esa capa única para la entrada x.
# Por qué: tiene que dar lo mismo que dar x a W1 y lo que salga a W2.
# La salida de una capa lineal es la matriz multiplicada por la entrada.
# El resultado es un array de 2 números.
y = None

# Para ver qué vale algo antes de entregar: print(W) y pulsa «Ejecutar».
`,
          checks: `_arr = isinstance(W, np.ndarray) and np.issubdtype(W.dtype, np.number)
_w = _arr and W.shape == (2, 2)
_y = isinstance(y, np.ndarray) and y.shape == (2,) and np.issubdtype(y.dtype, np.number)
check(_arr, "\`W\` tiene que ser un array de NumPy con números: la matriz única que equivale a las dos capas.")
check((not _arr) or W.shape != (3, 3), "\`W\` es de 3 filas y 3 columnas: has multiplicado las capas en orden contrario. La primera capa, \`W1\`, actúa primero y va a la derecha.")
check((not _arr) or W.shape == (3, 3) or W.shape == (2, 2), "\`W\` tiene que ser una matriz de 2 filas y 2 columnas: lleva la entrada de 2 componentes a una salida de 2.")
check((not _w) or np.allclose(W, [[1, 5], [1, 1]]), "\`W\` tiene que valer (1, 5) en la primera fila y (1, 1) en la segunda: es la segunda capa multiplicada por la primera.")
check(_y, "\`y\` tiene que ser un array de NumPy con 2 números: la salida de la capa única para \`x\`.")
check((not _y) or np.allclose(y, [11, 3]), "\`y\` tiene que valer (11, 3), la misma salida que dan las dos capas por separado.")
`,
          reference:
            'import numpy as np\n\nW1 = np.array([[1, 2], [0, 1], [-1, 1]])\nW2 = np.array([[2, 0, 1], [1, -1, 0]])\nx = np.array([1, 2])\nW = W2 @ W1\ny = W @ x\n',
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'componer.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere guardar en `C` la matriz que aplica **primero** `R`, un giro de un cuarto de vuelta, y **después** `S`, un estiramiento horizontal. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'En un producto, la matriz que actúa primero es la más cercana al vector, la de la derecha.',
        'Piensa qué transformación se aplica primero en el producto de la última línea.',
      ],
      explain:
        'Pregúntate qué transformación actúa primero en el producto que se calcula y compáralo con el orden que pide el enunciado.',
      solution:
        'La tercera línea está mal. `R @ S` aplica primero `S` y después `R`, al revés de lo pedido: la que actúa primero va a la derecha. Hace falta `C = S @ R`, que vale $\\begin{pmatrix}0&-2\\\\1&0\\end{pmatrix}$.',
      lines: ['R = np.array([[0, -1], [1, 0]])', 'S = np.array([[2, 0], [0, 1]])', 'C = R @ S'],
      faultyLine: 2,
    },
    {
      id: 'componer.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento habla de una red con dos capas lineales, $W_1$ y $W_2$, sin función de activación entre ellas. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Mira en qué se convierte la red en la línea intermedia: ¿cuántas matrices hacen falta?',
        'Si una sola capa puede hacer lo mismo que las dos, ¿qué ha ganado la segunda?',
      ],
      explain:
        'Revisa cada paso y comprueba si la conclusión se sigue de lo que se ha establecido antes.',
      solution:
        'La tercera línea está mal. Según la segunda, las dos capas equivalen a una sola, de matriz $W_2W_1$: no aprenden nada que una capa no pueda. Para que una red profunda gane capacidad hace falta una función de activación no lineal entre las capas.',
      lines: [
        'La salida de la red es W₂(W₁x), con las dos capas seguidas y sin activación',
        'Como el producto de matrices es asociativo, W₂(W₁x) = (W₂W₁)x, y W₂W₁ es una sola matriz',
        'Luego dos capas lineales seguidas pueden aprender cosas que una sola capa no puede',
      ],
      faultyLine: 2,
    },
    {
      id: 'componer.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento comprueba tamaños con $A$ de $2\\times 3$ y $B$ de $3\\times 4$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Para cada producto, mira solo los dos números del medio.',
        'El tamaño del resultado sale de los dos números de los extremos.',
      ],
      explain:
        'Revisa cada paso con la regla de los tamaños: los interiores han de coincidir y los exteriores dan el tamaño del resultado.',
      solution:
        'No hay ningún error. En $AB$, $(2\\times 3)(3\\times 4)$, el 3 coincide y queda $2\\times 4$. En $BA$, $(3\\times 4)(2\\times 3)$, el 4 y el 2 no coinciden. Por eso el orden importa incluso para saber si se puede multiplicar.',
      lines: [
        'Los tamaños interiores de AB son 3 y 3: coinciden, así que AB está definido',
        'AB tiene tantas filas como A y tantas columnas como B: es de 2 × 4',
        'En BA los tamaños interiores serían 4 y 2: no coinciden, así que BA no está definido',
      ],
      faultyLine: null,
    },
  ],
};
