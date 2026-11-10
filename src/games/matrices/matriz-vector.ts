import type { Project } from '../../content/schema';
import { py } from '../py';
import { matrizVectorWarmup } from './matriz-vector.calentamiento';
import { ANIMALES, RESENAS, capaLab, type Cloud } from './datos';

/** La neurona siguiente solo mira la primera salida de la capa: responde al grupo 1 si es positiva. */
const MIRA_SALIDA_1 = { w: [1, 0] as [number, number], b: 0 };

/** Cuántas palabras caen justo en su diana. */
const EN_SU_DIANA = (target: number) =>
  ({
    metric: 'on_target',
    op: 'gte',
    target,
    label: 'Palabras en su diana',
    format: 'integer',
  }) as const;

/**
 * Tres palabras del español con un embedding de juguete. Sus traducciones al inglés («cat», «dog»,
 * «house») son los mismos puntos girados 45° y estirados por √2: la capa î = (1, 1), ĵ = (−1, 1).
 */
const IDIOMAS: Cloud = {
  points: [
    { id: 'gato', label: 'gato', x: 1.5, y: 1 },
    { id: 'perro', label: 'perro', x: 2, y: 0.5 },
    { id: 'casa', label: 'casa', x: -1, y: 2 },
  ],
  axes: ['rasgo 1', 'rasgo 2'],
};

/** Dónde caen «cat», «dog» y «house» en el espacio del inglés: las dianas de `IDIOMAS`. */
const TRADUCCIONES: Record<string, [number, number]> = {
  gato: [0.5, 2.5],
  perro: [1.5, 2.5],
  casa: [-3, 1],
};

/**
 * Segundo proyecto de la Órbita 0: lo que la capa le hace a una palabra es mezclar sus columnas con
 * los rasgos de la palabra como receta, y los ejemplos con diana son los que fijan la matriz.
 */
export const matrizVector: Project = {
  id: 'matriz-vector',
  name: 'Matriz por vector',
  sub: 'Lo que le pasa a una palabra',
  bigPicture: {
    parts: ['linear', 'attention'],
    text: 'Multiplicar una matriz por un vector es combinar sus columnas con los números del vector como pesos. Es la cuenta que hace cada capa lineal, y también la que calcula $Q$, $K$ y $V$ en la atención a partir de cada embedding. Aquí la haces a mano con dos números; la red la hace con cientos a la vez.',
  },
  warmup: matrizVectorWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'matriz-vector.ex00.1',
          type: 'laboratorio',
          purpose: {
            why: 'Lo que una capa hace con una palabra es mezclar sus columnas: tantas veces la columna de un rasgo como valga ese rasgo en la palabra. Así sale cada vector de una capa lineal, también en un modelo de lenguaje.',
            aim: 'Vas a mover una sola columna de la capa hasta que «genial» caiga en su diana, el sitio donde la espera la capa siguiente.',
            takeaway:
              '«genial» sale en $2{,}5\\cdot\\hat{\\imath}+2\\cdot\\hat{\\jmath}$: esa es su receta. Por eso se mueve el doble que el tirador de $\\hat{\\jmath}$, y «bueno», con tono $1$, lo mismo que él. Cada palabra sigue a las columnas en la medida de sus rasgos.',
          },
          prompt:
            'Seis reseñas pasan por la capa. La capa siguiente espera «genial» en un sitio concreto: su diana. La columna de la intensidad, $\\hat{\\imath}$, está fija; solo se mueve la del tono, $\\hat{\\jmath}$.\n\nMueve $\\hat{\\jmath}$ hasta que «genial» caiga en su diana. Fíjate en cuánto se mueve cada palabra al mover el tirador.',
          hints: [
            '«genial» tiene tono $2$: cada paso que das con el tirador de $\\hat{\\jmath}$, ella da dos en la misma dirección. «bueno», con tono $1$, da uno.',
            'Mira cuánto le falta a «genial» para llegar a la diana y mueve $\\hat{\\jmath}$ la mitad de eso: un poco a la derecha y un poco hacia arriba.',
          ],
          explain:
            'La salida de una palabra es su intensidad por $\\hat{\\imath}$ más su tono por $\\hat{\\jmath}$. Con $\\hat{\\imath}$ quieta, lo único que cambia la posición de «genial» es $2\\cdot\\hat{\\jmath}$: mover el tirador una distancia mueve la palabra el doble.',
          solution:
            'Con $\\hat{\\jmath}$ en $(0{,}5;\\ 1{,}5)$, «genial» sale en $2{,}5\\cdot(1, 0)+2\\cdot(0{,}5;\\ 1{,}5)=(3{,}5;\\ 3)$, su diana. Es la única colocación: la columna tiene dos números y la diana fija dos. Las otras cinco palabras se han movido a la vez, cada una según su tono.',
          lab: capaLab(RESENAS, { movable: 'j', targets: { genial: [3.5, 3] } }),
          goals: [EN_SU_DIANA(1)],
          solved: { jx: 0.5, jy: 1.5 },
        },
        {
          id: 'matriz-vector.ex00.2',
          type: 'laboratorio',
          purpose: {
            why: 'Entrenar una capa es buscar la matriz que lleva cada ejemplo de entrenamiento adonde debe ir. Cada ejemplo es una entrada con la salida que se desea, y cada uno descarta muchas matrices.',
            aim: 'Vas a mover las dos columnas hasta que «bueno» y «malo» caigan a la vez en su diana, y a ver cuántas capas lo consiguen.',
            takeaway:
              'Con dos ejemplos de dos rasgos, la capa queda fijada: solo una matriz cumple los dos. Eso es «aprender una matriz»: los ejemplos deciden los pesos. Una capa real tiene muchos más pesos, y por eso pide muchos más ejemplos.',
          },
          prompt:
            'Ahora hay dos dianas, una para «bueno» y otra para «malo». Son dos ejemplos de entrenamiento: dicen dónde debe dejar la capa cada palabra. Las dos columnas se mueven.\n\nConsigue que las dos palabras caigan en su diana a la vez. Prueba primero a acertar con una sola y mira qué le pasa a la otra.',
          hints: [
            '«bueno» sale en $\\hat{\\imath}+\\hat{\\jmath}$ y «malo», en $\\hat{\\imath}-\\hat{\\jmath}$: comparten la intensidad y tienen el tono opuesto. Lo que las separa es $\\hat{\\jmath}$.',
            'Lleva $\\hat{\\imath}$ al punto medio entre las dos dianas, y $\\hat{\\jmath}$, a lo que va de ese punto a la diana de «bueno».',
          ],
          explain:
            'Cada diana pone dos condiciones, una por coordenada, y la capa tiene cuatro números. Con dos palabras de rasgos distintos hay cuatro condiciones para cuatro pesos: las cumple una sola matriz. Si aciertas con una palabra, la otra suele quedar lejos.',
          solution:
            'Con $\\hat{\\imath}$ en $(0, 1)$ y $\\hat{\\jmath}$ en $(2, 0)$: «bueno» sale en $(0, 1)+(2, 0)=(2, 1)$ y «malo», en $(0, 1)-(2, 0)=(-2, 1)$. No hay otra. La capa manda el tono, doblado, a la salida 1 y la intensidad a la salida 2: es lo que le han enseñado los dos ejemplos.',
          lab: capaLab(RESENAS, { range: 5, targets: { bueno: [2, 1], malo: [-2, 1] } }),
          goals: [EN_SU_DIANA(2)],
          solved: { ix: 0, iy: 1, jx: 2, jy: 0 },
        },
        {
          id: 'matriz-vector.ex00.3',
          type: 'laboratorio',
          purpose: {
            why: 'Un solo ejemplo deja muchas capas posibles: todas lo aciertan y cada una hace otra cosa con el resto. Por eso un modelo se entrena con muchos datos y se comprueba con datos que no ha visto.',
            aim: 'Vas a llevar «bueno» a su diana con una capa que, además, le sirva a la neurona siguiente para clasificar las seis reseñas.',
            takeaway:
              'Muchas capas llevan «bueno» a su diana, pero no todas mandan el tono a la salida que mira la neurona. Acertar un ejemplo no es haber aprendido: lo que decide entre las capas posibles son los demás datos.',
          },
          prompt:
            '«bueno» tiene su diana, y detrás de la capa hay una neurona que solo mira la primera salida y dice «positiva» en la zona sombreada. Hay muchas capas que llevan «bueno» a la diana; casi ninguna le sirve a la neurona.\n\nLleva «bueno» a su diana y consigue, a la vez, que la neurona acierte con las seis reseñas.',
          hints: [
            'Lleva primero «bueno» a la diana moviendo solo $\\hat{\\jmath}$ y mira la zona sombreada: las negativas siguen dentro. ¿Qué rasgo llega a la primera salida?',
            'Saca la intensidad de la salida 1 subiendo $\\hat{\\imath}$ por el eje vertical, y corrige $\\hat{\\jmath}$ para que «bueno», que sale en $\\hat{\\imath}+\\hat{\\jmath}$, vuelva a su diana.',
          ],
          explain:
            'La diana solo fija $\\hat{\\imath}+\\hat{\\jmath}$, la suma de las dos columnas, y esa suma se puede repartir de muchas maneras. La neurona pide algo más: que en la salida 1 pese el tono y no la intensidad. Las dos condiciones juntas dejan menos capas.',
          solution:
            'Una capa que vale: $\\hat{\\imath}$ en $(0, 1)$ y $\\hat{\\jmath}$ en $(1, 1)$. «bueno» sale en $(1, 2)$ y la salida 1 es el tono: la neurona acierta las seis. Con $\\hat{\\jmath}$ en $(0, 2)$ y $\\hat{\\imath}$ sin tocar, «bueno» también llega, pero la salida 1 es la intensidad y la neurona dice «positiva» a todo. También vale $\\hat{\\imath}$ en $(0;\\ 0{,}5)$ con $\\hat{\\jmath}$ en $(1;\\ 1{,}5)$.',
          lab: capaLab(RESENAS, { range: 5, readout: MIRA_SALIDA_1, targets: { bueno: [1, 2] } }),
          goals: [
            EN_SU_DIANA(1),
            {
              metric: 'acc',
              op: 'gte',
              target: 1,
              label: 'Aciertos de la neurona siguiente',
              format: 'percent',
            },
          ],
          solved: { ix: 0, iy: 1, jx: 1, jy: 1 },
        },
        {
          id: 'matriz-vector.ex00.4',
          type: 'laboratorio',
          purpose: {
            why: 'Los embeddings de dos idiomas, entrenados por separado, tienen formas parecidas: «gato» y «perro» quedan cerca en los dos. En 2013, un equipo de Google mostró que una sola matriz lleva bastante bien un espacio al otro, y así tradujo palabras.',
            aim: 'Vas a buscar la capa que lleva tres palabras del español a sus traducciones en un espacio de embeddings entrenado en inglés.',
            takeaway:
              'Una sola matriz lleva las tres palabras a su traducción: basta fijarla con dos, y la tercera cae sola. Si dos espacios tienen la misma forma, girada y estirada, una capa lineal traduce de uno a otro.',
          },
          prompt:
            'Tres palabras del español con su embedding: «gato», «perro» y «casa». Cada diana es el embedding de su traducción en un modelo entrenado en inglés, «cat», «dog» y «house» (las dianas no llevan rótulo). La nube del inglés es la del español, girada y estirada.\n\nBusca la capa que lleva las tres palabras a la vez a su traducción.',
          hints: [
            'La diana de «house» es la que está sola, a la izquierda; las de «cat» y «dog» quedan juntas, como «gato» y «perro». Mira cuánto ha girado la nube entera.',
            'Ajusta primero «gato» y «casa» con las dos columnas; si la capa es la buena, «perro» llega sola. Las dos columnas giran lo mismo, hacia la izquierda.',
          ],
          explain:
            'Dos palabras de rasgos distintos fijan las cuatro casillas de la capa. La tercera ya no deja libertad: o cae en su diana o no hay capa lineal que traduzca. Aquí cae, porque el espacio del inglés es el del español girado y estirado.',
          solution:
            'Con $\\hat{\\imath}$ en $(1, 1)$ y $\\hat{\\jmath}$ en $(-1, 1)$, la capa gira $45°$ y estira por $\\sqrt{2}$: «gato» va a $(0{,}5;\\ 2{,}5)$, «perro» a $(1{,}5;\\ 2{,}5)$ y «casa» a $(-3, 1)$. Las dos columnas miden lo mismo y forman ángulo recto: la nube no se deforma, solo gira y crece.',
          lab: capaLab(IDIOMAS, { targets: TRADUCCIONES }),
          goals: [
            {
              metric: 'target_err',
              op: 'lte',
              target: 0,
              label: 'Distancia de la palabra más lejana a su traducción',
            },
          ],
          solved: { ix: 1, iy: 1, jx: -1, jy: 1 },
        },
        {
          id: 'matriz-vector.ex00.5',
          type: 'laboratorio',
          purpose: {
            why: 'Una neurona que acierta por poco cambia de respuesta con cualquier ruido en la entrada. Al entrenar un clasificador se busca holgura, que cada ejemplo quede lejos de la frontera: es la idea de las máquinas de vectores soporte.',
            aim: 'Vas a alejar las reseñas de la frontera todo lo que se pueda sin sacar a «malo» de su diana, y a descubrir hasta dónde se puede llegar.',
            takeaway:
              'La diana de «malo» fija su distancia a la frontera en $1$, y más holgura la sacaría de ahí: lo máximo es $1$. Los ejemplos que la capa debe cumplir limitan lo que puede conseguir con todo lo demás.',
          },
          prompt:
            'La neurona ya acierta las seis reseñas, pero «bueno» y «malo» quedan muy cerca de la frontera: cualquier ruido las cambiaría de lado. La holgura es la distancia a la frontera de la palabra más justa. Y «malo» tiene diana: un ejemplo que la capa debe cumplir.\n\nDa a la neurona la mayor holgura que puedas sin sacar a «malo» de su diana.',
          hints: [
            'Las palabras quedan cerca de la frontera porque el tono llega a la salida 1 con poco peso. ¿Qué columna dice cuánto pesa?',
            'Alarga $\\hat{\\jmath}$ hacia la derecha y mira la diana: hay una longitud en la que «malo» cae justo en ella. Pasarse da más holgura, pero la saca.',
          ],
          explain:
            'La salida 1 de «malo» es su intensidad por la primera coordenada de $\\hat{\\imath}$ más su tono, $-1$, por la de $\\hat{\\jmath}$. La diana fija esa salida en $-1$: «malo» queda a $1$ de la frontera, y la holgura, que es la de la palabra más justa, no puede pasar de ahí.',
          solution:
            'Con $\\hat{\\jmath}$ en $(1, 0)$ la salida 1 es el tono: «malo» llega a $(-1;\\ 1{,}5)$, su diana, y «bueno» y «malo» quedan a $1$ de la frontera. Con $\\hat{\\jmath}$ en $(2, 0)$ la holgura sube a $2$, pero «malo» sale de su diana. También vale $\\hat{\\imath}$ en $(0{,}5;\\ 1{,}5)$ con $\\hat{\\jmath}$ en $(1{,}5;\\ 0)$: la holgura sigue en $1$.',
          lab: capaLab(RESENAS, {
            range: 5,
            i: [0, 1.5],
            j: [0.5, 0],
            readout: MIRA_SALIDA_1,
            targets: { malo: [-1, 1.5] },
          }),
          goals: [
            {
              metric: 'margin',
              op: 'gte',
              target: 1,
              label: 'Holgura de la palabra más justa',
            },
            EN_SU_DIANA(1),
          ],
          solved: { jx: 1 },
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'matriz-vector.ex01.1',
          type: 'vector',
          purpose: {
            why: 'Al final de un clasificador, una capa da una puntuación por clase, el logit: pesos por rasgos más un sesgo. Gana la clase de mayor puntuación. Así decide un detector de sentimiento, y así elige un modelo de lenguaje su siguiente palabra entre miles.',
            aim: 'Vas a calcular las dos puntuaciones que da una capa con sesgo para la reseña «triste», y a ver cuál de las dos clases gana.',
            takeaway:
              '«triste» da $-1$ a «positiva» y $2$ a «negativa»: gana «negativa». Cada puntuación es una fila de pesos por la palabra, más su sesgo. El sesgo mueve la puntuación de una clase lo mismo para todas las palabras.',
          },
          prompt:
            'Una capa puntúa cada reseña para dos clases: la salida 1 es «positiva» y la 2, «negativa».\n\n$$W=\\begin{pmatrix}0&1\\\\1&-1\\end{pmatrix},\\qquad \\vec{b}=(0{,}5;\\ -1)$$\n\n«triste» tiene intensidad $1{,}5$ y tono $-1{,}5$. Calcula $W\\vec{x}+\\vec{b}$, primero la puntuación de «positiva». En el laboratorio, la capa es $W$, sin el sesgo.',
          hints: [
            'Cada puntuación usa una fila de $W$: la de «positiva» solo mira el tono, y la de «negativa», la intensidad menos el tono.',
            'En el laboratorio, «triste» cae en $W\\vec{x}$. Súmale a cada coordenada su sesgo.',
          ],
          explain:
            'La fila 1 por la palabra da la puntuación de «positiva» antes del sesgo, y la fila 2, la de «negativa». El sesgo se suma después, uno por clase. Gana la mayor.',
          solution:
            'Fila 1: $0$ por la intensidad y $1$ por el tono dan $-1{,}5$, y con su sesgo, $-1{,}5+0{,}5=-1$. Fila 2: la intensidad menos el tono, $1{,}5+1{,}5=3$, y $3-1=2$. Sale $(-1, 2)$: gana «negativa». En el laboratorio «triste» cae en $(-1{,}5;\\ 3)$, que es $W\\vec{x}$ sin el sesgo.',
          lab: capaLab(RESENAS, { range: 5, i: [0, 1], j: [1, -1], movable: 'none' }),
          answer: [-1, 2],
          tol: 0,
        },
        {
          id: 'matriz-vector.ex01.2',
          type: 'numero',
          purpose: {
            why: 'Cada fila de la matriz de una capa es una neurona: sus pesos dicen cuánto le importa cada rasgo. Para saber qué hace una neurona con una palabra no hace falta calcular la capa entera: basta su fila.',
            aim: 'Vas a calcular solo la segunda salida de una capa para «horrible», con la segunda fila de pesos, y a comprobarla después en el laboratorio.',
            takeaway:
              '«horrible» da $3{,}25$ en la segunda salida: $1{,}25$ por su intensidad y $2$ por su tono negativo. Esta neurona responde a las quejas intensas. Cada salida es el producto escalar de una fila con la palabra.',
          },
          prompt:
            'Una capa tiene estos pesos:\n\n$$A=\\begin{pmatrix}1&0{,}5\\\\0{,}5&-1\\end{pmatrix}$$\n\nLe llega «horrible», con intensidad $2{,}5$ y tono $-2$. ¿Cuánto vale su segunda salida? Después puedes construir la capa en el laboratorio: la segunda salida es la altura a la que cae la palabra.',
          hints: [
            'La segunda salida usa solo la segunda fila: $0{,}5$ por la intensidad y $-1$ por el tono.',
            'Multiplica cada rasgo por su peso y suma. El tono es negativo y su peso también.',
          ],
          explain:
            'La salida 2 es la fila 2 por la palabra. La primera fila no interviene: es otra neurona. Un peso negativo por un rasgo negativo suma.',
          solution:
            '$0{,}5\\cdot 2{,}5+(-1)\\cdot(-2)=1{,}25+2=3{,}25$. En el laboratorio, con $\\hat{\\imath}$ en $(1;\\ 0{,}5)$ y $\\hat{\\jmath}$ en $(0{,}5;\\ -1)$, «horrible» cae en $(1{,}5;\\ 3{,}25)$: su altura es esa salida. La primera, $1{,}5$, sale de $1\\cdot 2{,}5+0{,}5\\cdot(-2)$.',
          lab: capaLab(RESENAS),
          answer: 3.25,
          tol: 0,
        },
        {
          id: 'matriz-vector.ex01.3',
          type: 'vector',
          purpose: {
            why: 'Un modelo no procesa las palabras de una en una: las apila en una matriz, una fila por palabra, y la multiplica entera por los pesos. Saber la forma de lo que sale evita los errores de formas, los más corrientes al montar un modelo.',
            aim: 'Vas a deducir cuántas filas y cuántas columnas tiene la salida de una capa cuando le llega un lote de palabras a la vez.',
            takeaway:
              'Salen $32$ filas de $128$ números: una fila por palabra, con su salida de la capa. El lote no cambia la cuenta de cada palabra; la repite $32$ veces de una sola vez, que es lo que una GPU hace rápido.',
          },
          prompt:
            'Un buscador convierte $32$ palabras en embeddings de $384$ números y las apila en una matriz $X$ de $32\\times 384$, una fila por palabra. Una capa de $384$ entradas y $128$ salidas las transforma todas de una vez con $XW^{\\top}$.\n\n¿Qué forma tiene el resultado? Escribe primero las filas y después las columnas.',
          hints: [
            'Cada palabra sigue siendo una fila del resultado: la capa no junta palabras.',
            'Cada fila del resultado es la salida de la capa para una palabra: tantos números como salidas tiene la capa.',
          ],
          explain:
            'En un producto de matrices, las filas salen de la primera y las columnas, de la segunda. $X$ tiene una fila por palabra y $W^{\\top}$, de $384\\times 128$, una columna por salida. Los $384$ se emparejan y desaparecen.',
          solution:
            '$(32\\times 384)\\cdot(384\\times 128)=32\\times 128$: $32$ filas, una por palabra, y $128$ columnas, una por salida. Son $32\\cdot 128=4096$ números. Con $WX$ las formas no casarían: $W$ es de $128\\times 384$ y $X$, de $32\\times 384$.',
          answer: [32, 128],
          tol: 0,
        },
        {
          id: 'matriz-vector.ex01.4',
          type: 'opcion',
          purpose: {
            why: 'Para entender qué ha aprendido una red se busca qué entradas activan más cada neurona. Con los modelos de lenguaje se hace a gran escala: se pasan muchos textos y se miran los que más encienden una neurona concreta.',
            aim: 'Vas a predecir cuál de cuatro animales activa más una neurona, con sus pesos y los rasgos de cada uno, y a comprobarlo en el dibujo.',
            takeaway:
              '«perro» da $2\\cdot 1{,}5+2=5$, más que «oso» y «gato», que dan $4{,}5$. La neurona pesa el doble el tamaño, pero también suma la domesticidad: el más grande no es el que más la activa.',
          },
          prompt:
            'Una neurona lee el embedding de cada animal con peso $2$ para el tamaño y $1$ para la domesticidad, sin sesgo:\n\n$$\\text{activación}=2\\cdot\\text{tamaño}+1\\cdot\\text{domesticidad}$$\n\n¿Qué animal la activa más? Para comprobarlo, pon esos pesos como primera fila de la capa del laboratorio: la salida 1 de cada animal será su activación.',
          hints: [
            'Calcula la activación de cada uno: dos veces su tamaño más su domesticidad. Los salvajes tienen domesticidad negativa.',
            'En el laboratorio, lleva $\\hat{\\imath}$ a $(2, 0)$ y $\\hat{\\jmath}$ a $(1, 1)$: la salida 1 es la activación. Busca el animal que queda más a la derecha.',
          ],
          explain:
            'La activación es el producto escalar de los pesos con el animal. Un rasgo grande con peso grande suma mucho, pero un rasgo negativo resta: la domesticidad negativa de «oso» compensa en parte su tamaño.',
          solution:
            'Activaciones: «perro», $2\\cdot 1{,}5+2=5$; «oso», $2\\cdot 3-1{,}5=4{,}5$; «gato», $2\\cdot 1+2{,}5=4{,}5$; «tigre», $2\\cdot 2{,}5-2{,}5=2{,}5$. Gana «perro». En el laboratorio, con la fila $(2, 1)$ arriba, «perro» queda en $x=5$, la más a la derecha.',
          lab: capaLab(ANIMALES, { range: 6 }),
          options: ['«oso»', '«perro»', '«gato»', '«tigre»'],
          correct: 1,
        },
        {
          id: 'matriz-vector.ex01.5',
          type: 'numero',
          purpose: {
            why: 'Para traducir con una matriz entre dos espacios de embeddings hay que aprenderla de un diccionario de pares de palabras. Cuántos pares hacen falta depende del tamaño de la matriz: lo decide quien prepara los datos.',
            aim: 'Vas a contar cuántos pares de palabras hacen falta, como mínimo, para fijar una matriz de traducción entre embeddings de $300$ números.',
            takeaway:
              'Hacen falta $300$ pares: cada uno fija $300$ de los $90\\,000$ pesos. En la práctica se usan miles, porque los embeddings no encajan exactos y se busca la matriz que menos se equivoca con todos a la vez.',
          },
          prompt:
            'En el laboratorio, dos palabras con su diana fijan la capa de $2\\times 2$: cada par da dos condiciones y la matriz tiene cuatro pesos. Ahora los embeddings tienen $300$ números, como los de word2vec, y la matriz de traducción es de $300\\times 300$.\n\n¿Cuántos pares de palabras hacen falta, como mínimo, para fijarla, si ninguno repite lo que dicen los demás?',
          hints: [
            'Cuenta los pesos de la matriz y las condiciones que pone cada par: una por cada número de la traducción.',
            'Divide los pesos entre las condiciones que pone cada par.',
          ],
          explain:
            'Cada par dice dónde debe caer una palabra: tantas condiciones como números tiene su traducción. La matriz queda fijada cuando las condiciones igualan a los pesos, si ningún par repite lo que dicen otros.',
          solution:
            'La matriz tiene $300\\cdot 300=90\\,000$ pesos y cada par fija $300$: hacen falta $90\\,000/300=300$ pares. Es lo mismo que en el laboratorio: $2\\times 2$ son $4$ pesos y cada par fija $2$, así que bastan $2$.',
          lab: capaLab(IDIOMAS, { targets: TRADUCCIONES }),
          answer: 300,
          tol: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'matriz-vector.ex02.1',
          type: 'codigo',
          prompt:
            'El operador `@` multiplica una matriz por un vector, y cada componente del resultado sale de una fila de la matriz. Ya tienes `A`, una matriz de 3 filas y 2 columnas, y `v`, un vector de 2 componentes. Guarda en `w`, como array de NumPy, la imagen de `v` por `A`.',
          hints: [
            'El plan es una sola línea: `w` es `A` y `v` unidos por el operador `@`, con la matriz a la izquierda y el vector a la derecha. Cuidado con `*`: en NumPy multiplica elemento a elemento, sin sumar, y deja una matriz en vez de un vector.',
            'La forma de cada pieza, con otra matriz y otro vector:\n\n' +
              py(
                'M = np.array([[1, 2], [0, 1]])',
                'u = np.array([3, 1])',
                'print(M @ u)   # [5 1]: cada componente sale de una fila de M con u',
                'print(M * u)   # [[3 2] [0 1]]: con * sale una matriz, no es lo que se pide',
              ) +
              '\n\nEl resultado de `@` tiene una componente por cada fila de la matriz. Aquí `A` tiene 3 filas, así que `w` tendrá 3 componentes.',
            'El esqueleto, con el hueco `___` donde decides tú:\n\n' +
              py('w = A ___ v') +
              '\n\nEl operador es el de multiplicar matrices, no el `*` de siempre: con `*` te saldría una matriz de 3 filas y 2 columnas.',
          ],
          explain:
            'El operador `@` hace el producto de una matriz por un vector. Con `*` no sale lo mismo: multiplica elemento a elemento, sin sumar nada, y deja una matriz.',
          solution:
            'Se escribe `w = A @ v`. El resultado es `[2, 3, -5]`: la primera componente es $1\\cdot 2+0\\cdot(-1)=2$, la segunda $2\\cdot 2+1\\cdot(-1)=3$ y la tercera $-1\\cdot 2+3\\cdot(-1)=-5$.',
          requirements: [
            '`w` existe y es un array de NumPy con números, con una componente por cada fila de `A`.',
            '`w` es la imagen de `v` por `A`: el producto de la matriz por el vector, no el producto componente a componente.',
          ],
          starter: `import numpy as np

A = np.array([[1, 0], [2, 1], [-1, 3]])
v = np.array([2, -1])
# A es una matriz: un array de NumPy con 3 filas y 2 columnas.
# Cada fila es una lista de 2 números, y A[0] es la primera fila.
# v es un vector: un array de NumPy con 2 componentes.

# PASO 1. La imagen de v por A: el vector que sale de pasar v por la matriz.
# Por qué: esa es la idea del producto de una matriz por un vector. Cada
# componente del resultado sale de una fila de A multiplicada por v, y como
# A tiene 3 filas, w tiene 3 componentes.
# En NumPy el producto de una matriz por un vector se escribe con el operador @,
# con la matriz a la izquierda y el vector a la derecha.
# No lo confundas con *: multiplica elemento a elemento, sin sumar nada, y deja
# una matriz. El resultado que se espera es un array de 3 números.
w = None

# Para ver qué vale algo antes de entregar: print(w) y pulsa «Ejecutar».
`,
          checks: `_arr = isinstance(w, np.ndarray) and np.issubdtype(w.dtype, np.number)
_ok = _arr and w.shape == (3,)
check(_arr, "\`w\` tiene que ser un array de NumPy con números: la imagen de \`v\` por \`A\`.")
check((not _arr) or w.shape != (3, 2), "\`w\` es una matriz de 3 filas y 2 columnas: eso es lo que da \`A * v\`, que multiplica cada columna de \`A\` por una componente de \`v\` pero no suma las columnas. El producto de una matriz por un vector se escribe con \`@\`.")
check((not _arr) or w.shape in ((3,), (3, 2)), "\`w\` tiene que ser un vector de 3 componentes: una por cada fila de \`A\`.")
check((not _ok) or np.allclose(w, [2, 3, -5]), "\`w\` tiene que valer (2, 3, -5): cada componente sale de multiplicar una fila de \`A\` por \`v\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 0], [2, 1], [-1, 3]])\nv = np.array([2, -1])\nw = A @ v\n',
        },
        {
          id: 'matriz-vector.ex02.2',
          type: 'codigo',
          prompt:
            'Por columnas, $A\\vec{v}=v_1\\cdot\\text{col}_1+v_2\\cdot\\text{col}_2+\\dots$. En NumPy, `A[:, k]` es la columna `k` de `A` (se empieza a contar en 0) y `v[k]` es la componente `k` de `v`. `np.zeros(n)` crea un vector de `n` ceros.\n\nEscribe la función `aplicar(A, v)` para que devuelva `A` por `v` **construyéndolo con las columnas**, sin usar `@` ni `np.dot`. `A` tiene `m` filas y `n` columnas, y `v` tiene `n` componentes.',
          hints: [
            'El plan, dentro de `aplicar`: crea `w`, un vector de ceros con una componente por cada fila de `A`. Después recorre las columnas, de la 0 a la última, y en cada vuelta súmale a `w` la columna `k` de `A` multiplicada por `v[k]`. Al terminar, devuelve `w`. Usa `len(v)` para saber cuántas columnas hay, y no un número escrito a mano, para que sirva con cualquier matriz.',
            'Las piezas, con otra matriz:\n\n' +
              py(
                'M = np.array([[1, 2, 5], [3, 4, 6]])',
                'print(M.shape)       # (2, 3): 2 filas y 3 columnas',
                'print(M.shape[0])    # 2: el número de filas',
                'print(M[:, 1])       # [2 4]: la columna 1 entera',
                'print(len(np.array([7, 8, 9])))   # 3: cuántas componentes tiene el vector',
                't = np.zeros(2)      # un vector de 2 ceros',
                'for k in range(3):',
                '    t = t + 10 * M[:, k]   # en cada vuelta se suma una columna',
                '    print(k, t)            # imprime 0 [10. 30.], después 1 [30. 70.], después 2 [ 80. 130.]',
              ) +
              '\n\n`for k in range(n):` repite lo que va debajo, con 4 espacios más de sangría, con `k` valiendo 0, 1, y así hasta `n - 1`. `return w` va con la sangría de la función, fuera del `for`: si estuviera dentro, saldría en la primera vuelta.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def aplicar(A, v):',
                '    w = np.zeros(___)',
                '    for k in range(___):',
                '        w = w + v[k] * ___',
                '    return w',
              ) +
              '\n\nLa columna `k` de `A` no es `A[k]`, que es la fila `k`: se escribe con los dos puntos, `A[:, k]`.',
          ],
          explain:
            'El resultado es una suma con tantos términos como columnas tiene `A`, y cada término es una columna multiplicada por su componente de `v`. Con un bucle sobre las columnas sirve para cualquier forma de matriz.',
          solution:
            'Se acumulan las columnas: `w = np.zeros(A.shape[0])`, y para cada `k` en `range(len(v))`, `w = w + v[k] * A[:, k]`. Al final se devuelve `w`. Con `A` de 2 filas y 2 columnas y `v = (1, 1)`, suma las dos columnas enteras. Un bucle fijo de dos vueltas fallaría con una matriz de 3 columnas.',
          requirements: [
            '`aplicar` existe y es una función que recibe una matriz `A` y un vector `v`.',
            'La función devuelve un array de NumPy con números y con una componente por cada fila de `A`: el producto de `A` por `v`.',
            'Se prueba con otras matrices y vectores además del ejemplo del enunciado, entre ellas matrices con 3 filas y matrices con 3 columnas, y la función no puede dar ningún error con ellas.',
            'La función no usa `@`, `np.dot` ni ninguna otra forma ya hecha del producto de matrices: el resultado se construye sumando columnas.',
          ],
          starter: `import numpy as np


# aplicar(A, v) recibe una matriz A (un array de NumPy de m filas y n columnas)
# y un vector v (un array de n componentes), y tiene que devolver A por v.
def aplicar(A, v):
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría):
    # así sabe Python que es parte de ella. Si la función tiene un bucle, lo de
    # dentro del bucle lleva otros 4 espacios más.
    #
    # PASO 1. Un vector de ceros donde ir acumulando el resultado.
    # Por qué: A por v es una suma de columnas, y una suma empieza en cero.
    # np.zeros(n) crea un array con n ceros. Tiene que haber un cero por cada
    # fila de A, y A.shape[0] te da cuántas filas tiene (A.shape es (filas, columnas)).
    #
    # PASO 2. Un bucle que recorre las columnas de A.
    # Por qué: A por v es v[0] por la columna 0, más v[1] por la columna 1, y así
    # con todas. Un bucle sirve para cualquier número de columnas.
    # for k in range(n): repite lo que va debajo con k valiendo 0, 1, ... hasta n - 1.
    # len(v) te da cuántas componentes tiene v, que son tantas como columnas de A.
    # Dentro del bucle, A[:, k] es la columna k de A y v[k] es la componente k de v.
    # Para sumar a lo acumulado: w = w + (un número) * (un vector).
    #
    # PASO 3. Devolver el resultado con return, ya fuera del bucle (con la sangría
    # de la función, no la del for). return termina la función y entrega ese valor.
    # Se espera un array de NumPy con una componente por fila de A.
    # No uses @ ni np.dot: la gracia es construir el resultado con las columnas.
    return None


# Para ver qué vale algo antes de entregar: print(aplicar(np.array([[1, 2], [3, 4]]), np.array([1, 1])))
# y pulsa «Ejecutar».
`,
          checks: `_f = aplicar
_usa = []


class _M(np.ndarray):
    def __matmul__(self, otro):
        _usa.append(1)
        return np.matmul(np.asarray(self), np.asarray(otro))

    def __rmatmul__(self, otro):
        _usa.append(1)
        return np.matmul(np.asarray(otro), np.asarray(self))

    def dot(self, otro, out=None):
        _usa.append(1)
        return np.asarray(self).dot(np.asarray(otro))

    def __array_function__(self, func, types, args, kwargs):
        if func.__name__ in ("dot", "matmul", "tensordot", "einsum", "inner", "vdot"):
            _usa.append(1)
        return super().__array_function__(func, types, args, kwargs)


def _llamar(A, v):
    try:
        r = np.asarray(_f(np.array(A).view(_M), np.array(v).view(_M)))
    except BaseException:
        return None
    if np.issubdtype(r.dtype, np.number) and r.shape == (len(A),):
        return r.astype(float)
    return None


_casos = [
    ([[1, 2], [3, 4]], [1, 1]),
    ([[2, 0], [1, 3]], [3, -1]),
    ([[1, 0], [2, 1], [-1, 3]], [2, -1]),
    ([[1, 2, 0], [3, -1, 2]], [2, 1, -1]),
]
_r = [_llamar(A, v) for A, v in _casos]
_e = [np.array(A) @ np.array(v) for A, v in _casos]
_p = _r[0]
_bien = all(r is not None and np.allclose(r, e) for r, e in zip(_r, _e))
check(_p is not None, "\`aplicar(A, v)\` tiene que devolver un array de NumPy con una componente por cada fila de \`A\`. Prueba con \`A = [[1, 2], [3, 4]]\` y \`v = (1, 1)\`: si no devuelve nada, falta el \`return\`; si da un error, revisa el cálculo.")
check(len(_usa) == 0, "Tu función usa \`@\` o \`np.dot\`: se pide construir el resultado a mano, sumando las columnas de \`A\`, cada una multiplicada por su componente de \`v\`.")
check(_p is None or len(_usa) > 0 or _bien, "Tu función no calcula bien \`A\` por \`v\` en todos los casos. Con \`A = [[1, 2], [3, 4]]\` y \`v = (1, 1)\` tiene que dar (3, 7), y también tiene que servir con 3 filas o con 3 columnas.")
`,
          reference: `import numpy as np


def aplicar(A, v):
    w = np.zeros(A.shape[0])
    for k in range(len(v)):
        w = w + v[k] * A[:, k]
    return w
`,
        },
        {
          id: 'matriz-vector.ex02.3',
          type: 'codigo',
          prompt:
            'Por filas, cada componente de $A\\vec{v}$ es el producto escalar de una fila de `A` con `v`. En NumPy, `A[0]` es la primera fila de `A` y `np.dot(a, b)` calcula el producto escalar de dos vectores.\n\nGuarda en `c0` el producto escalar de la primera fila de `A` con `v` y en `c1`, el de la segunda. Guarda en `w`, como array de NumPy, el vector con esas dos componentes, en ese orden.',
          hints: [
            'El plan son tres líneas. `c0` es el producto escalar de la primera fila de `A`, que es `A[0]`, con `v`. `c1` es lo mismo con la segunda fila, `A[1]`. Y `w` junta los dos números en un array, con `c0` primero y `c1` después. Tanto `c0` como `c1` son un número suelto, no un vector: si te sale una lista de números, falta sumar los productos.',
            'Las piezas, con otra matriz y otro vector:\n\n' +
              py(
                'M = np.array([[1, 2], [3, 4]])',
                'u = np.array([5, 6])',
                'print(M[1])              # [3 4]: la segunda fila de M',
                'print(np.dot(M[1], u))   # 39: 3 por 5 más 4 por 6, un solo número',
                'print(M[1] * u)          # [15 24]: con * se multiplica sin sumar, y sale una lista',
                'print(np.array([7, 8]))  # [7 8]: así se junta una lista de números en un array',
              ) +
              '\n\nLas filas se cuentan desde 0: la primera es `[0]` y la segunda, `[1]`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('c0 = np.dot(___, v)', 'c1 = np.dot(___, v)', 'w = np.array([___, ___])') +
              '\n\nEn `w` van `c0` y `c1`, en ese orden, y no las filas de `A`.',
          ],
          explain:
            'Cada componente del resultado es un producto escalar, y un producto escalar es un solo número. Cuidado con `*`: multiplica sin sumar y deja un vector, no un número.',
          solution:
            'Se escribe `c0 = np.dot(A[0], v)` y `c1 = np.dot(A[1], v)`, que valen $1\\cdot 2+2\\cdot 1+0\\cdot(-1)=4$ y $3\\cdot 2+(-1)\\cdot 1+2\\cdot(-1)=3$. El resultado, `w`, es `[4, 3]`: los dos números, uno por fila de `A`, metidos en un array.',
          requirements: [
            '`c0` y `c1` existen y cada una es un solo número, no un vector: el producto escalar de una fila de `A` con `v`.',
            '`c0` es el de la primera fila de `A` y `c1`, el de la segunda, sin intercambiarlos.',
            '`w` existe y es un array de NumPy con 2 componentes, las dos números: `c0` y `c1`, en ese orden.',
          ],
          starter: `import numpy as np

A = np.array([[1, 2, 0], [3, -1, 2]])
v = np.array([2, 1, -1])
# A es una matriz: un array de NumPy con 2 filas y 3 columnas.
# A[0] es su primera fila y A[1], la segunda (se empieza a contar en 0).
# v es un vector: un array de NumPy con 3 componentes.

# PASO 1. El producto escalar de la primera fila de A con v, y el de la segunda.
# Por qué: cada componente de A por v es justo eso, el producto escalar de una
# fila de A con v. Aquí lo haces a mano, componente a componente.
# np.dot(a, b) multiplica las componentes de a y b de dos en dos y suma todo:
# da UN solo número, no una lista.
# Se espera un número en c0 (el de la primera fila) y otro en c1 (el de la segunda).
c0 = None
c1 = None

# PASO 2. Juntar los dos números en un array de NumPy, c0 primero y c1 después.
# Por qué: así w es el vector que sale de A por v, con una componente por fila.
# np.array([x, y]) construye un array con los números de la lista, en ese orden.
w = None

# Para ver qué vale algo antes de entregar: print(c0, c1, w) y pulsa «Ejecutar».
`,
          checks: `def _esc(x):
    if isinstance(x, (bool, np.bool_)):
        return False
    if isinstance(x, np.ndarray):
        return x.ndim == 0 and np.issubdtype(x.dtype, np.number)
    return isinstance(x, (int, float, np.integer, np.floating))


_e0 = _esc(c0)
_e1 = _esc(c1)
_lista0 = isinstance(c0, np.ndarray) and c0.ndim == 1
_lista1 = isinstance(c1, np.ndarray) and c1.ndim == 1
_w = isinstance(w, np.ndarray) and w.shape == (2,) and np.issubdtype(w.dtype, np.number)
_cambio = _e0 and _e1 and abs(c0 - 3) < 1e-9 and abs(c1 - 4) < 1e-9
check(_e0 or _lista0, "\`c0\` tiene que ser un número: el producto escalar de la primera fila de \`A\` con \`v\`.")
check(not _lista0, "\`c0\` es una lista de números, no uno solo: has multiplicado la fila por \`v\` componente a componente y falta sumar los productos. Eso es lo que hace el producto escalar.")
check(_e1 or _lista1, "\`c1\` tiene que ser un número: el producto escalar de la segunda fila de \`A\` con \`v\`.")
check(not _lista1, "\`c1\` es una lista de números, no uno solo: has multiplicado la fila por \`v\` componente a componente y falta sumar los productos. Eso es lo que hace el producto escalar.")
check(not _cambio, "\`c0\` y \`c1\` están intercambiados: \`c0\` es de la primera fila de \`A\` y \`c1\`, de la segunda.")
check((not _e0) or _cambio or abs(c0 - 4) < 1e-9, "\`c0\` tiene que valer 4: el producto escalar de la primera fila de \`A\`, (1, 2, 0), con \`v\`, (2, 1, -1).")
check((not _e1) or _cambio or abs(c1 - 3) < 1e-9, "\`c1\` tiene que valer 3: el producto escalar de la segunda fila de \`A\`, (3, -1, 2), con \`v\`, (2, 1, -1).")
check(_w or not (_e0 and _e1), "\`w\` tiene que ser un array de NumPy con 2 números: las componentes \`c0\` y \`c1\`.")
check((not _w) or _cambio or np.allclose(w, [4, 3]), "\`w\` tiene que valer (4, 3): sus componentes son \`c0\` y \`c1\`, en ese orden.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 2, 0], [3, -1, 2]])\nv = np.array([2, 1, -1])\nc0 = np.dot(A[0], v)\nc1 = np.dot(A[1], v)\nw = np.array([c0, c1])\n',
        },
        {
          id: 'matriz-vector.ex02.4',
          type: 'codigo',
          prompt:
            'Una matriz también puede guardar **muchos vectores a la vez**, uno por fila. Aquí, `X` guarda cuatro vectores de 2 componentes: $(1, 0)$, $(0, 1)$, $(2, 3)$ y $(-1, 1)$. Se quiere transformarlos todos con `A` de una sola vez.\n\nMultiplicar `X @ A` no sirve: usa las filas de `A` como si fueran sus columnas. La traspuesta `A.T` cambia filas por columnas. Guarda en `Y` las cuatro imágenes, una por fila: en la fila `k` de `Y` va la imagen de la fila `k` de `X`.',
          hints: [
            'El plan es una sola línea. Los vectores de `X` están en filas, y `@` combina las filas de la izquierda con las columnas de la derecha. Por eso `X` va a la izquierda, y a la derecha va la traspuesta de `A`, que es `A.T`: así las filas de `A` pasan a ser columnas. Si pones `A` sin trasponer, usarás sus filas como si fueran columnas y saldrá otra transformación.',
            'Las piezas, con otra matriz y otros vectores:\n\n' +
              py(
                'M = np.array([[1, 2], [3, 4]])',
                'print(M.T)          # [[1 3] [2 4]]: las filas de M pasan a ser columnas',
                'P = np.array([[1, 0], [0, 1], [1, 1]])   # tres vectores, uno por fila',
                'print(P.shape)      # (3, 2): 3 filas y 2 columnas',
                'print(P @ M.T)      # [[1 3] [2 4] [3 7]]: una fila por vector, la imagen de cada uno',
              ) +
              '\n\nEl resultado tiene tantas filas como vectores hay en la matriz de la izquierda. Aquí, `X` tiene 4, así que `Y` tendrá 4 filas.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('Y = ___ @ ___.T') +
              '\n\nLa traspuesta es la de la matriz que transforma, no la de los vectores: si escribes `A @ X.T`, `Y` te sale con 2 filas y 4 columnas, con cada resultado en una columna en vez de en una fila.',
          ],
          explain:
            'Cada fila de `X` es un vector que se transforma con `A`. Para hacerlo todo con una sola multiplicación, `A` tiene que ir a la derecha y traspuesta, porque así cada fila de `X` se empareja con las columnas de la traspuesta, que son las filas de `A`.',
          solution:
            'Se escribe `Y = X @ A.T`. Las filas de `Y` son `[2, 0]`, `[1, 3]`, `[7, 9]` y `[-1, 3]`: por ejemplo, la imagen de $(2, 3)$ es $2\\cdot(2, 0)+3\\cdot(1, 3)=(7, 9)$. Con `X @ A` saldrían las imágenes por la traspuesta de `A`: `[2, 1]`, `[0, 3]`, `[4, 11]` y `[-2, 2]`, que es otra transformación.',
          requirements: [
            '`Y` existe y es un array de NumPy con números, de 4 filas y 2 columnas: una fila por cada vector de `X`.',
            'La fila `k` de `Y` es la imagen por `A` de la fila `k` de `X`; no vale dejar una columna por vector ni transformar con las filas de `A` tomadas como columnas.',
          ],
          starter: `import numpy as np

A = np.array([[2, 1], [0, 3]])
# A es la matriz que transforma: un array de NumPy con 2 filas y 2 columnas.
# X guarda cuatro vectores, un vector por fila: (1, 0), (0, 1), (2, 3) y (-1, 1).
# Es un array de 4 filas y 2 columnas; X[2] es el tercer vector.
X = np.array([[1, 0], [0, 1], [2, 3], [-1, 1]])

# PASO 1. Transformar los cuatro vectores con A de una sola multiplicación.
# Por qué: así no hace falta un bucle. Con @, cada fila de la matriz de la izquierda
# se combina con las columnas de la de la derecha. Los vectores de X están en
# filas, así que X va a la izquierda; y para que A los transforme bien, sus
# filas tienen que pasar a ser columnas.
# A.T es la traspuesta de A: cambia filas por columnas.
# Se espera un array de 4 filas y 2 columnas: la fila k de Y es la imagen de la fila k de X.
Y = None

# Para ver qué vale algo antes de entregar: print(Y) y pulsa «Ejecutar».
`,
          checks: `_A = np.array([[2, 1], [0, 3]])
_X = np.array([[1, 0], [0, 1], [2, 3], [-1, 1]])
_bien = _X @ _A.T
_arr = isinstance(Y, np.ndarray) and np.issubdtype(Y.dtype, np.number)
_ok = _arr and Y.shape == (4, 2)
_tras = _arr and Y.shape == (2, 4) and np.allclose(Y, _bien.T)
_sinT = _ok and np.allclose(Y, _X @ _A)
check(_arr, "\`Y\` tiene que ser un array de NumPy con números: las imágenes de los cuatro vectores.")
check(not _tras, "\`Y\` tiene una columna por vector y 2 filas: está traspuesta. Se pide una fila por cada vector de \`X\`, así que tiene que tener 4 filas y 2 columnas.")
check(not _sinT, "\`Y\` es \`X @ A\`, que usa las filas de \`A\` como si fueran columnas: aplica la traspuesta de \`A\` y no \`A\`. Las filas de \`X\` son vectores, y para transformarlos hay que multiplicar por \`A.T\`.")
check((not _arr) or _tras or Y.shape == (4, 2), "\`Y\` tiene que tener 4 filas y 2 columnas: una fila por cada vector de \`X\`.")
check((not _ok) or _sinT or np.allclose(Y, _bien), "\`Y\` no tiene los valores esperados: la primera fila, la imagen de (1, 0), tiene que ser (2, 0), la primera columna de \`A\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[2, 1], [0, 3]])\nX = np.array([[1, 0], [0, 1], [2, 3], [-1, 1]])\nY = X @ A.T\n',
        },
        {
          id: 'matriz-vector.ex02.5',
          type: 'codigo',
          prompt:
            'Una **capa lineal** de una red calcula $\\vec{y}=W\\vec{x}+\\vec{b}$. Tienes la capa `W`, de 2 filas y 3 columnas, con su sesgo `b` de 2 componentes, y `X`, con un vector de entrada de 3 componentes por fila.\n\nEscribe `capa(W, b, x)`, que devuelve la salida de la capa para un vector `x`, y guarda en `y` la salida para el vector $(1, 2, 1)$. Después guarda en `Y` las salidas para las tres filas de `X` de una sola vez, una por fila: se multiplica `X` por la traspuesta de `W`, y al sumar un vector de 2 componentes a una matriz de 3 filas y 2 columnas, NumPy se lo suma a cada fila.',
          hints: [
            'El plan: la función devuelve `W @ x` más `b`, primero la multiplicación y después el sesgo. `y` es la llamada `capa(W, b, ...)` con el vector $(1, 2, 1)$ convertido en array con `np.array([...])`. `Y` hace lo mismo con las tres filas de `X` de una vez: `X` a la izquierda, la traspuesta de `W` a la derecha, y el sesgo `b` sumado al final, una sola vez. NumPy se lo suma a cada fila.',
            'Las piezas, con otra capa:\n\n' +
              py(
                'M = np.array([[1, 0], [0, 2]])',
                'c = np.array([10, 20])',
                't = np.array([3, 4])',
                'print(M @ t + c)    # [13 28]: primero M @ t, que es [3 8], y después se suma c',
                'lote = np.array([[1, 1], [2, 0], [0, 3]])   # tres vectores, uno por fila',
                'print(lote @ M.T + c)   # [[11 22] [12 20] [10 26]]: c se suma a cada fila',
              ) +
              '\n\nUna función termina con `return`, que entrega el valor, y todo lo de dentro lleva 4 espacios de sangría.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def capa(W, b, x):',
                '    return ___ @ x + ___',
                '',
                'y = capa(W, b, np.array([___, ___, ___]))',
                'Y = X @ ___ + ___',
              ) +
              '\n\nEl sesgo se suma después de multiplicar, y en el lote la matriz va traspuesta: `W.T`, y no `W`.',
          ],
          explain:
            'La capa para un vector y la capa para un lote hacen el mismo cálculo: el lote se escribe con la matriz traspuesta porque sus vectores están en filas. Fíjate en que el sesgo se suma después de multiplicar, no antes.',
          solution:
            'La función es `return W @ x + b`. Con $(1, 2, 1)$: $W\\vec{x}=(0, 6)$ y, sumando $\\vec{b}=(0, -2)$, `y` vale `[0, 4]`. Para el lote, `Y = X @ W.T + b`: las filas de `Y` son `[0, 4]`, `[-1, -1]` y `[6, -2]`. La primera coincide con `y`, que es lo esperado: es el mismo cálculo hecho de golpe. Si te olvidas del sesgo, `Y` sale con la columna 2 más grande en 2 unidades.',
          requirements: [
            '`capa` existe y es una función que recibe `W`, `b` y un vector `x`.',
            'La función devuelve un array de NumPy con números y con una componente por cada fila de `W`: el producto de `W` por `x` más el sesgo `b`.',
            'Se prueba con otras capas y otras entradas además del ejemplo del enunciado, de otros tamaños y con otros sesgos, y la función no puede dar ningún error con ellas.',
            '`y` existe y es un array de NumPy con 2 componentes, las dos números: la salida de la capa para el vector $(1, 2, 1)$.',
            '`Y` existe y es un array de NumPy con números, de 3 filas y 2 columnas: una fila por cada vector de `X`, con el sesgo `b` ya sumado a cada una.',
          ],
          starter: `import numpy as np


# PASO 1. La función capa(W, b, x): la salida de la capa lineal para UN vector x.
# W es la matriz de la capa, b su sesgo y x el vector de entrada (arrays de NumPy).
def capa(W, b, x):
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría):
    # así sabe Python que es parte de ella.
    # Por qué: la capa lineal calcula W por x y después le suma b. Primero se
    # multiplica y luego se suma el sesgo. W por x se escribe W @ x, con la matriz
    # a la izquierda; sumar b a un vector es b con un +, componente a componente.
    # return devuelve un valor y termina la función. Se espera un array con una
    # componente por cada fila de W.
    return None


# W tiene 2 filas y 3 columnas; b tiene 2 componentes (uno por fila de W).
W = np.array([[2, -1, 0], [1, 1, 3]])
b = np.array([0, -2])
# X guarda tres vectores de entrada, de 3 componentes cada uno, un vector por fila.
X = np.array([[1, 2, 1], [0, 1, 0], [3, 0, -1]])

# PASO 2. La salida de la capa para el vector (1, 2, 1).
# Llama a capa(W, b, ...) con ese vector. La función espera un array de NumPy,
# así que conviértelo con np.array([...]), poniendo sus tres números entre corchetes.
y = None

# PASO 3. Las salidas para los tres vectores de X, de una sola vez.
# Por qué: es el mismo cálculo que la función, pero para todo el lote. Los vectores
# de X están en filas, así que X va a la izquierda y la traspuesta de W (W.T,
# que cambia filas por columnas) va a la derecha. El sesgo b se suma al final,
# una sola vez: NumPy suma un vector de 2 componentes a cada fila de una matriz.
# Se espera un array de 3 filas y 2 columnas: la fila k es la salida para la fila k de X.
Y = None

# Para ver qué vale algo antes de entregar: print(y) y print(Y) y pulsa «Ejecutar».
`,
          checks: `_f = capa


def _llamar(W, b, x):
    try:
        r = np.asarray(_f(np.array(W), np.array(b), np.array(x)))
    except BaseException:
        return None
    if np.issubdtype(r.dtype, np.number) and r.shape == (len(W),):
        return r.astype(float)
    return None


_casos = [
    ([[2, -1, 0], [1, 1, 3]], [0, -2], [1, 2, 1]),
    ([[1, 0], [0, 1]], [5, -5], [3, 4]),
    ([[1, 2, 3]], [1], [1, 1, 1]),
    ([[1, -1], [2, 0], [0, 3]], [0, 0, 1], [2, 1]),
]
_r = [_llamar(W_, b_, x_) for W_, b_, x_ in _casos]
_e = [np.array(W_) @ np.array(x_) + np.array(b_) for W_, b_, x_ in _casos]
_sinb = [np.array(W_) @ np.array(x_) for W_, b_, x_ in _casos]
_p = _r[0]
_bien = all(r is not None and np.allclose(r, e) for r, e in zip(_r, _e))
_nob = all(r is not None and np.allclose(r, s) for r, s in zip(_r, _sinb))
check(_p is not None, "\`capa(W, b, x)\` tiene que devolver un array de NumPy con una componente por cada fila de \`W\`. Prueba con \`x = (1, 2, 1)\`: si no devuelve nada, falta el \`return\`; si da un error, revisa el cálculo.")
check(not _nob, "Tu función no suma el sesgo \`b\`: la capa lineal calcula \`W\` por \`x\` y después le suma \`b\`.")
check(_p is None or _nob or _bien, "Tu función no calcula bien la capa en todos los casos. Con \`x = (1, 2, 1)\` tiene que dar (0, 4): \`W\` por \`x\` es (0, 6) y el sesgo resta 2 a la segunda componente.")
_ey = isinstance(y, np.ndarray) and y.shape == (2,) and np.issubdtype(y.dtype, np.number)
check(_ey, "\`y\` tiene que ser un array de NumPy con 2 números: la salida de la capa para el vector (1, 2, 1).")
check((not _ey) or np.allclose(y, [0, 4]), "\`y\` tiene que valer (0, 4): la capa aplicada al vector (1, 2, 1).")
_Xa = np.array([[1, 2, 1], [0, 1, 0], [3, 0, -1]])
_Wa = np.array([[2, -1, 0], [1, 1, 3]])
_ba = np.array([0, -2])
_arr = isinstance(Y, np.ndarray) and np.issubdtype(Y.dtype, np.number)
_okY = _arr and Y.shape == (3, 2)
_nobY = _okY and np.allclose(Y, _Xa @ _Wa.T)
check(_arr, "\`Y\` tiene que ser un array de NumPy con números: las salidas de la capa para los tres vectores de \`X\`.")
check((not _arr) or Y.shape == (3, 2), "\`Y\` tiene que tener 3 filas y 2 columnas: una fila por cada vector de \`X\`, con las 2 salidas de la capa.")
check(not _nobY, "\`Y\` no incluye el sesgo \`b\`: falta sumárselo a cada fila.")
check((not _okY) or _nobY or np.allclose(Y, _Xa @ _Wa.T + _ba), "\`Y\` no tiene los valores esperados: cada fila tiene que ser la salida de la capa para la fila correspondiente de \`X\`. La primera es (0, 4).")
`,
          reference: `import numpy as np


def capa(W, b, x):
    return W @ x + b


W = np.array([[2, -1, 0], [1, 1, 3]])
b = np.array([0, -2])
X = np.array([[1, 2, 1], [0, 1, 0], [3, 0, -1]])
y = capa(W, b, np.array([1, 2, 1]))
Y = X @ W.T + b
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'matriz-vector.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere guardar en `w` la imagen del vector `v` por la matriz `A`, que es el vector $(3, 7)$ (NumPy ya está importado como `np`). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        '¿Cuántas componentes tiene que tener `w`? ¿Y qué forma tiene lo que da la última línea?',
        'Piensa en lo que hace el signo `*` entre un array de dos ejes y uno de un eje: ¿multiplica una matriz por un vector?',
      ],
      explain:
        'Comprueba la forma del resultado: una imagen de `v` es un vector con una componente por fila de `A`. Después revisa si la operación escrita hace el producto de la matriz por el vector.',
      solution:
        'La tercera línea está mal. `A * v` multiplica elemento a elemento: cada columna de `A` por una componente de `v`, sin sumar nada. Con `v = (1, 1)` devuelve la propia `A`, una matriz, no el vector $(3, 7)$. Lo correcto es `w = A @ v`.',
      lines: ['A = np.array([[1, 2], [3, 4]])', 'v = np.array([1, 1])', 'w = A * v'],
      faultyLine: 2,
    },
    {
      id: 'matriz-vector.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula la salida de una capa lineal, $\\vec{y}=W\\vec{x}+\\vec{b}$, con $W=\\begin{pmatrix}1&2\\\\0&-1\\end{pmatrix}$, $\\vec{x}=(3, 1)$ y $\\vec{b}=(1, 1)$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Repasa el orden de las operaciones de una capa lineal: ¿qué se hace primero, multiplicar por $W$ o sumar $\\vec{b}$?',
        'Las columnas de $W$ son $(1, 0)$ y $(2, -1)$. Calcula $W\\vec{x}$ aparte y compara con lo que se hace aquí.',
      ],
      explain:
        'Cada línea hay que leerla contra la fórmula de la capa. Mira a qué vector se le suma el sesgo y cuándo se multiplica por la matriz.',
      solution:
        'La primera línea está mal: el sesgo se suma a la salida $W\\vec{x}$, no a la entrada. Lo correcto es $W\\vec{x}=3\\cdot(1, 0)+1\\cdot(2, -1)=(5, -1)$ y después $\\vec{y}=(5, -1)+(1, 1)=(6, 0)$. Sumar antes $\\vec{b}$ a $\\vec{x}$ calcula $W(\\vec{x}+\\vec{b})=W\\vec{x}+W\\vec{b}$, que añade $W\\vec{b}=(3, -1)$ y no $\\vec{b}$.',
      lines: [
        'x + b = (3, 1) + (1, 1) = (4, 2)',
        'W (4, 2) = 4 · (1, 0) + 2 · (2, −1) = (8, −2)',
        'y = (8, −2)',
      ],
      faultyLine: 0,
    },
    {
      id: 'matriz-vector.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula $A\\vec{v}$ por filas, con $A=\\begin{pmatrix}2&1\\\\-1&3\\end{pmatrix}$ y $\\vec{v}=(1, 2)$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Cada componente del resultado es el producto escalar de una fila de $A$ con $\\vec{v}$.',
        'Haz tú mismo los dos productos escalares y compáralos con los de cada línea, con cuidado con los signos.',
      ],
      explain:
        'Revisa cada paso: ¿se usa la fila correcta? ¿Se multiplican las componentes por posición y se suman? ¿El resultado final reúne los dos números en su orden?',
      solution:
        'No hay ningún error. La primera fila da $2\\cdot 1+1\\cdot 2=4$, la segunda da $-1\\cdot 1+3\\cdot 2=5$, y $A\\vec{v}=(4, 5)$. Por columnas sale lo mismo: $1\\cdot(2, -1)+2\\cdot(1, 3)=(4, 5)$.',
      lines: [
        '(2, 1) · (1, 2) = 2 · 1 + 1 · 2 = 4',
        '(−1, 3) · (1, 2) = −1 · 1 + 3 · 2 = 5',
        'A v = (4, 5)',
      ],
      faultyLine: null,
    },
  ],
};
