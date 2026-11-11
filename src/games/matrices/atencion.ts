import type { Project } from '../../content/schema';
import type { AtencionSpec, AtencionToken } from '../../engine/labs/atencion';
import { py } from '../py';
import { atencionWarmup } from './atencion.calentamiento';
import { FRASE_ANIMAL, FRASE_ANIMAL_MIRA } from './datos';

/** Índice de «cruzó» en `FRASE_ANIMAL`: quien mira en la pregunta de la máscara causal. */
const CRUZO = 3;
/** Índice de «cansado» en `FRASE_ANIMAL`: el token cuya clave se arrastra. */
const CANSADO = 6;

/**
 * El laboratorio de la frase del animal: mira «estaba», con la consulta (0; 1,5) del principio, que
 * se va sobre todo a «cansado» (65,8 %) y no pisa ninguna clave. Cada pregunta cambia lo que hace falta.
 */
const frase = (extra: Partial<AtencionSpec> = {}): AtencionSpec => ({
  kind: 'atencion',
  tokens: FRASE_ANIMAL,
  focus: FRASE_ANIMAL_MIRA,
  query: [0, 1.5],
  range: 3,
  snap: 0.5,
  ...extra,
});

/**
 * «el gato duerme»: mira «duerme». Con la consulta (2, 0) las puntuaciones son 0, 2 y 0; el
 * laboratorio empieza en (−1, 1), con 1, −1 y −1, para que la cuenta se compruebe moviéndola.
 */
const GATO_DUERME: AtencionToken[] = [
  { id: 'el', text: 'el', key: [0, 1] },
  { id: 'gato', text: 'gato', key: [1, 0] },
  { id: 'duerme', text: 'duerme', key: [0, -1] },
];

/** «el perro come su pienso», con consulta en cada token, para el mapa completo de atención. */
const PERRO_PIENSO: AtencionToken[] = [
  { id: 'el', text: 'el', key: [-1, -1], query: [0, 1] },
  { id: 'perro', text: 'perro', key: [0, 2], query: [1, 0] },
  { id: 'come', text: 'come', key: [2, 0], query: [0, 2] },
  { id: 'su', text: 'su', key: [-1, 1], query: [1, 1] },
  { id: 'pienso', text: 'pienso', key: [1, -1], query: [2, 0] },
];

/**
 * Cuarto proyecto de la Órbita 3 de matrices: la atención como producto de matrices. Un token decide a
 * quién mirar comparando su consulta con la clave de cada uno; el softmax convierte las puntuaciones en
 * pesos, y su salida es la mezcla de los valores con esos pesos.
 */
export const atencion: Project = {
  id: 'atencion',
  name: 'Atención como matriz',
  sub: 'Quién mira a quién',
  bigPicture: {
    parts: ['attention', 'linear'],
    text: 'La atención de un bloque cabe en una matriz: sus filas dicen cuánto mira cada token a los demás, y la salida es esa matriz por los valores $V$. Con softmax, cada fila suma $1$. Aquí construyes esa matriz con pocos tokens y ves en la cuenta quién mira a quién, que es lo mismo que ocurre con textos de miles de ellos.',
  },
  warmup: atencionWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'atencion.ex00.1',
          type: 'laboratorio',
          purpose: {
            why: 'En un modelo de lenguaje, cada token busca en la frase los que le dan contexto. Lo que busca es su consulta; lo que ofrece cada token es su clave. El producto escalar de la consulta con cada clave decide a quién mira.',
            aim: 'Vas a girar y alargar la consulta de «estaba» hasta que se fije en el token que de verdad estaba cansado.',
            takeaway:
              'Cada token puntúa su clave por la consulta: alto cuando apuntan hacia el mismo lado. El softmax da casi todo el peso a la puntuación mayor. Mirar a «animal» es lo que deja a «estaba» saber quién estaba cansado.',
          },
          prompt:
            'En «el animal no cruzó porque estaba cansado», el token «estaba» necesita saber quién estaba cansado. Cada flecha gris es la **clave** de un token: lo que ofrece. La amarilla es la **consulta** de «estaba»: lo que busca. Ahora apunta hacia arriba y la mayor parte de la atención se la lleva «cansado».\n\nMueve la consulta hasta que casi toda la atención vaya a «animal».',
          hints: [
            'Las barras dicen cuánto se lleva cada token y con qué puntuación. Puntúa más la clave que queda hacia donde apunta la consulta, y tanto más cuanto más larga es la flecha.',
            'Gira la consulta hacia la clave de «animal», a la derecha. Si ya apunta hacia ella y no basta, alárgala.',
          ],
          explain:
            'La puntuación de un token es el producto escalar de su clave con la consulta: crece cuanto más alineadas y más largas son. El softmax convierte las puntuaciones en pesos que suman 1, y la mayor se lleva bastante más que su parte.',
          solution:
            'Con la consulta en $(1{,}5;\\ 1)$, «animal» puntúa $4$ y se lleva el 90,7 %; sobre su misma clave, $(2, 1)$, el 96,6 %. También vale $(1, 1)$: puntúa $3$ y se lleva el 75,3 %. Con $(0{,}5;\\ 0{,}5)$ apunta bien pero es corta: puntúa $1{,}5$, las demás quedan cerca y «animal» se queda en el 45,6 %. No hace falta una consulta exacta: vale cualquiera que apunte hacia «animal» y sea bastante larga.',
          lab: frase({ readouts: ['top'] }),
          goals: [
            {
              metric: 'w_animal',
              op: 'gte',
              target: 0.7,
              label: 'Atención que «estaba» da a «animal»',
              format: 'percent',
            },
          ],
          solved: { qx: 1.5, qy: 1 },
        },
        {
          id: 'atencion.ex00.2',
          type: 'laboratorio',
          purpose: {
            why: 'Un softmax se afila o se suaviza dividiendo antes las puntuaciones entre una temperatura. En la atención, la división entre $\\sqrt{d_k}$ hace ese papel; al generar texto, la temperatura decide si el modelo elige casi siempre el token más probable.',
            aim: 'Vas a cambiar la temperatura de la atención de «estaba», sin tocar su consulta, hasta que deje de repartirse entre todos los tokens.',
            takeaway:
              'Bajar la temperatura separa las puntuaciones, y el softmax concentra el peso en la mayor; subirla lo reparte. Dividir entre la temperatura es como cambiar la longitud de la consulta: por eso una consulta corta mira de forma difusa.',
          },
          prompt:
            'La consulta de «estaba» ya apunta hacia «animal», pero es corta y no se puede mover. Antes del softmax, las puntuaciones se dividen entre la **temperatura**. Con la de ahora, la atención se reparte entre todos los tokens: la **entropía**, que mide lo repartida que está, pasa de 2 bits.\n\nMueve la temperatura hasta que la atención quede afilada.',
          hints: [
            'Mira las puntuaciones de las barras al mover la temperatura: todas se acercan a 0 o se alejan de 0 a la vez. ¿Cuándo se separa más «animal» de las demás?',
            'Baja la temperatura: dividir entre un número pequeño agranda las diferencias entre puntuaciones, y el softmax las exagera.',
          ],
          explain:
            'El softmax depende de las diferencias entre puntuaciones. Dividirlas entre una temperatura alta las junta, y los pesos se igualan; entre una baja, las separa, y casi todo el peso va a la mayor. La entropía vale 0 bits si un token se lo lleva todo y $\\log_2 7\\approx 2{,}81$ si se reparte por igual entre los siete.',
          solution:
            'Con temperatura $0{,}75$ la entropía baja a $0{,}9$ bits y «animal» se lleva el 85,5 %; con $0{,}5$, a $0{,}28$ bits. Con $1$ no basta: $1{,}48$ bits. Fíjate: temperatura $0{,}5$ da los mismos pesos que la consulta $(2, 1)$ con temperatura $1$. Dividir las puntuaciones entre $0{,}5$ es lo mismo que alargar la consulta al doble.',
          lab: frase({
            query: [1, 0.5],
            movable: 'none',
            temperature: { min: 0.25, max: 3, step: 0.25, start: 2 },
            readouts: ['w_max'],
          }),
          goals: [
            {
              metric: 'entropy',
              op: 'lte',
              target: 1,
              label: 'Entropía de los pesos, en bits',
            },
          ],
          solved: { temp: 0.5 },
        },
        {
          id: 'atencion.ex00.3',
          type: 'laboratorio',
          purpose: {
            why: 'Un modelo que genera texto, como GPT, escribe un token cada vez y solo puede usar los que ya ha escrito. Al entrenarlo con frases enteras, una máscara tapa lo que viene después para que no aprenda a mirar el futuro.',
            aim: 'Vas a activar la máscara causal y orientar la consulta de «cruzó» para que mire solo lo ya escrito, y sobre todo a quién cruzó.',
            takeaway:
              'La máscara no baja unas puntuaciones: las saca del softmax, y lo que queda vuelve a sumar 1. Por eso el peso del futuro es 0 exacto y pasa a lo anterior. Ninguna consulta, por larga que sea, consigue ese 0.',
          },
          prompt:
            'Ahora mira «cruzó». Un modelo que escribe la frase token a token aún no ha escrito «porque estaba cansado» cuando llega a «cruzó», pero aquí su atención se va sobre todo a esos tokens. El interruptor activa la **máscara causal**.\n\nHaz que «cruzó» no mire nada de lo que viene detrás y que casi toda su atención vaya a «animal», el que cruzó.',
          hints: [
            'Los tokens posteriores a «cruzó» se llevan la mayor parte. Gira la consulta y mira sus barras: ninguna llega a quedarse en 0.',
            'Activa la máscara y mira adónde va el peso que sobraba. Después gira la consulta hacia la clave de «animal».',
          ],
          explain:
            'La máscara quita del softmax a los tokens posteriores: su peso es 0, y lo que queda vuelve a sumar 1 entre «cruzó» y los anteriores. Sin máscara, una puntuación muy baja da un peso pequeño, pero nunca 0.',
          solution:
            'Con la máscara, el peso que iba al futuro se reparte entre los cuatro primeros tokens, y «animal» pasa del 14,7 % al 77,9 %. Con la consulta en $(1, 1)$ llega al 94,8 %; en $(2, 1)$, al 99 %. Sin máscara, la consulta $(2, 1)$ da a «animal» el 96,6 %, pero un 2,4 % sigue yendo a lo que viene después: solo la máscara lo deja en 0.',
          lab: frase({ focus: CRUZO, mask: 'toggle', readouts: ['masked'] }),
          goals: [
            {
              metric: 'future',
              op: 'lte',
              target: 0,
              label: 'Atención sobre lo que viene después',
              format: 'percent',
            },
            {
              metric: 'w_animal',
              op: 'gte',
              target: 0.9,
              label: 'Atención que «cruzó» da a «animal»',
              format: 'percent',
            },
          ],
          solved: { mask: 1, qx: 1, qy: 1 },
        },
        {
          id: 'atencion.ex00.4',
          type: 'laboratorio',
          purpose: {
            why: 'Al entrenar, el modelo no solo aprende qué busca cada token: también qué ofrece. La matriz $W_K$ fabrica la clave de cada token a partir de su embedding, y cambiarla decide qué tokens atraen la atención de los demás.',
            aim: 'Vas a mover la clave de «cansado», con la consulta de «estaba» fija, hasta que deje de quitarle la atención.',
            takeaway:
              'La clave es lo que un token ofrece. Con la misma consulta, cambiar una clave reparte de nuevo la atención: el token que la baja pierde peso y los demás lo ganan. Entrenar la atención es ajustar consultas y claves a la vez.',
          },
          prompt:
            'La consulta de «estaba» vuelve a la del principio, y ahora no se toca: lo que se ajusta es la **clave** de «cansado», lo que ese token ofrece a los demás. Con la clave de ahora, «cansado» se lleva casi dos tercios de la atención de «estaba».\n\nMueve la clave de «cansado» hasta que deje de llevársela.',
          hints: [
            'La consulta apunta hacia arriba. Mira la puntuación de «cansado» al mover su clave de lado y al moverla de arriba abajo: solo una de las dos cosas la cambia.',
            'Baja la clave de «cansado» hasta la altura del origen o por debajo. Moverla de lado no cambia nada con esta consulta.',
          ],
          explain:
            'La puntuación de «cansado» es su clave por la consulta. Como la consulta solo tiene componente vertical, solo cuenta la altura de la clave. Al bajarla, la puntuación cae y su peso pasa a los demás.',
          solution:
            'Con la clave en $(1, 0)$, «cansado» puntúa $0$ y se queda con el 8,7 %; más abajo, aún menos. Moverla a $(3, 2)$ no cambia nada: la altura sigue siendo $2$. Copiar la clave de «animal», $(2, 1)$, tampoco basta: empata con «animal» y «estaba» y se lleva el 30 %. Lo que recibe un token depende de su clave tanto como de la consulta de quien mira.',
          lab: frase({ movable: 'key', keyOf: CANSADO, readouts: ['top'] }),
          goals: [
            {
              metric: 'w_cansado',
              op: 'lte',
              target: 0.1,
              label: 'Atención que «estaba» da a «cansado»',
              format: 'percent',
            },
          ],
          solved: { kx: 1, ky: 0 },
        },
        {
          id: 'atencion.ex00.5',
          type: 'laboratorio',
          purpose: {
            why: 'Los pesos de atención no son el resultado: la capa siguiente recibe la mezcla de los valores con esos pesos. Así entra en «estaba» la información de «animal». En el GPT-2 pequeño, cada valor tiene 64 números por cabeza.',
            aim: 'Vas a orientar la consulta de «estaba» para que su salida traiga todo lo posible del valor de «animal», y a ver hasta dónde se puede llegar.',
            takeaway:
              'La salida es una media de los valores con los pesos de atención: queda siempre entre ellos y nunca pasa del mayor. Para traer la información de un solo token hace falta darle casi todo el peso. Por eso importa una atención afilada.',
          },
          prompt:
            'Cada token lleva también un **valor**: lo que entrega a quien lo mira. La salida de «estaba» es la mezcla de los valores con sus pesos, y pasa a la capa siguiente. El valor de «animal» es $(2, 2)$, el de primera coordenada más alta; el de «cansado», $(-2, 1)$.\n\nLleva la primera coordenada de la salida todo lo cerca que puedas de la de «animal».',
          hints: [
            'La salida es una media ponderada: cada peso que va a otro token la aparta de «animal». Ahora la mayor parte se la lleva «cansado», y la salida queda en negativo.',
            'Gira la consulta hacia la clave de «animal» y alárgala hasta cerca del borde: cuanto más larga, menos les queda a los demás.',
          ],
          explain:
            'La salida es $\\sum_j w_j\\,v_j$, una media ponderada de los valores, porque los pesos suman 1. Nunca pasa del valor más alto. Para acercarse a él hace falta que casi todo el peso vaya a ese token, y eso pide una puntuación muy por encima de las demás.',
          solution:
            'Con la consulta en $(2, 1)$, «animal» se lleva el 96,6 % y la primera coordenada de la salida llega a $1{,}94$: no basta. En $(3;\\ 1{,}5)$ se lleva el 99,6 % y la salida llega a $1{,}99$; también vale $(3, 1)$. Ninguna consulta llega a $2$, el valor de «animal»: siempre queda algo de peso en los demás. Es el límite de una media.',
          lab: frase({ readouts: ['out_x', 'out_y'] }),
          goals: [
            {
              metric: 'out_x',
              op: 'gte',
              target: 1.98,
              label: 'Primera coordenada de la salida de «estaba»',
            },
          ],
          solved: { qx: 3, qy: 1.5 },
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'atencion.ex01.1',
          type: 'numero',
          purpose: {
            why: 'Cada cabeza de atención calcula, para cada pareja de tokens, el producto escalar de una consulta con una clave. En el GPT-2 pequeño, consultas y claves tienen 64 números por cabeza; aquí tienen 2 y se ven en el plano.',
            aim: 'Vas a calcular la puntuación que una consulta da a una clave, coordenada por coordenada, antes de comprobarla en el laboratorio.',
            takeaway:
              'La puntuación es $1{,}5\\cdot 1+1\\cdot(-2)=-0{,}5$: negativa, porque la clave de «cruzó» apunta hacia abajo y la consulta, hacia arriba. Una puntuación negativa no anula el peso: solo lo hace pequeño.',
          },
          prompt:
            'Si la consulta de «estaba» pasa a ser $(1{,}5;\\ 1)$, ¿qué puntuación da a «cruzó», cuya clave es $(1, -2)$? Calcúlala y después lleva la consulta a ese punto en el laboratorio para comprobarla en su barra.',
          hints: [
            'La puntuación es el producto escalar: primera coordenada por primera coordenada, más segunda por segunda.',
            'Cuida el signo de la segunda coordenada de la clave: ese producto resta.',
          ],
          explain:
            'El producto escalar suma los productos de las coordenadas. Una clave que apunta hacia el lado contrario al de la consulta da una puntuación negativa.',
          solution:
            '$1{,}5\\cdot 1+1\\cdot(-2)=1{,}5-2=-0{,}5$. En el laboratorio, con la consulta en $(1{,}5;\\ 1)$, la barra de «cruzó» marca esa puntuación y un peso pequeño. Si te sale $3{,}5$, has sumado el $2$ en vez de restarlo.',
          lab: frase(),
          answer: -0.5,
          tol: 0,
        },
        {
          id: 'atencion.ex01.2',
          type: 'vector',
          purpose: {
            why: 'El softmax convierte las puntuaciones de un token en pesos de atención: positivos y que suman 1. Las herramientas que enseñan «a qué mira» un modelo dibujan justamente estos pesos.',
            aim: 'Vas a pasar tres puntuaciones por el softmax a mano: el exponencial de cada una, dividido entre la suma de los tres.',
            takeaway:
              'Dos puntos de diferencia bastan para que «gato» se lleve el 79 %: el softmax exagera las diferencias. Las dos puntuaciones iguales reciben el mismo peso, y los tres pesos suman 1.',
          },
          prompt:
            'En «el gato duerme», mira «duerme». Con la consulta $(2, 0)$, sus puntuaciones con «el», «gato» y «duerme» son $0$, $2$ y $0$. ¿Qué pesos da el softmax? Escríbelos en ese orden, con dos decimales (usa $e^{2}\\approx 7{,}39$). Después lleva la consulta a ese punto y compruébalo.',
          hints: [
            'Los exponenciales son $e^{0}=1$, $e^{2}\\approx 7{,}39$ y $e^{0}=1$. Súmalos.',
            'Divide cada exponencial entre esa suma. Los tres pesos tienen que sumar 1.',
          ],
          explain:
            'Cada peso es $e^{s}$ entre la suma de todos los $e^{s}$. El exponencial hace positivo cada peso, y dividir entre la suma hace que sumen 1.',
          solution:
            'La suma es $1+7{,}39+1=9{,}39$. Los pesos: $\\frac{1}{9{,}39}\\approx 0{,}11$ para «el», $\\frac{7{,}39}{9{,}39}\\approx 0{,}79$ para «gato» y $0{,}11$ para «duerme». Si no suman 1, has dividido entre $e^{2}$ en vez de entre la suma.',
          lab: {
            kind: 'atencion',
            tokens: GATO_DUERME,
            focus: 2,
            query: [-1, 1],
            range: 3,
            snap: 0.5,
          },
          answer: [0.11, 0.79, 0.11],
          tol: 0.01,
        },
        {
          id: 'atencion.ex01.3',
          type: 'vector',
          purpose: {
            why: 'Una cabeza de atención no calcula pareja por pareja: apila las consultas de todos los tokens en una matriz $Q$ y las claves en $K$, y un solo producto $QK^{T}$ da todas las puntuaciones. Es la operación que la GPU hace de golpe.',
            aim: 'Vas a deducir la forma de la tabla de puntuaciones a partir de las formas de $Q$ y $K$ en una cabeza del GPT-2 pequeño.',
            takeaway:
              'La tabla es de $10\\times 10$: una fila por token que mira y una columna por token mirado. Los 64 números de cada consulta desaparecen en el producto: cada casilla es un producto escalar.',
          },
          prompt:
            'En una cabeza de atención del GPT-2 pequeño, un texto de $10$ tokens da una matriz $Q$ de $10\\times 64$ (una fila por token) y una $K$ de la misma forma. ¿Qué forma tiene $QK^{T}$? Escribe primero las filas y después las columnas.',
          hints: [
            '$K^{T}$ es $K$ traspuesta: sus filas pasan a ser columnas. ¿Qué forma tiene?',
            'En un producto, las filas salen del primer factor y las columnas, del segundo; el número del medio desaparece.',
          ],
          explain:
            'Una matriz de $a\\times b$ por una de $b\\times c$ da una de $a\\times c$. Aquí $b$ es 64, el tamaño de consultas y claves, y queda dentro de cada producto escalar.',
          solution:
            '$Q$ es de $10\\times 64$ y $K^{T}$, de $64\\times 10$, así que $QK^{T}$ es de $10\\times 10$: la casilla de la fila $i$ y la columna $j$ es la puntuación con que el token $i$ mira al $j$. Si te sale $64\\times 64$, has multiplicado $K^{T}Q$. Sin la traspuesta, $QK$ ni se puede multiplicar: 64 columnas frente a 10 filas.',
          answer: [10, 10],
          tol: 0,
        },
        {
          id: 'atencion.ex01.4',
          type: 'numero',
          purpose: {
            why: 'La tabla de puntuaciones tiene una fila y una columna por cada palabra del contexto, de modo que su tamaño crece con el cuadrado de la longitud del contexto. Por eso alargar el contexto de un modelo es caro en memoria y en cálculo, y es un límite práctico de la atención tal como se define.',
            aim: 'Vas a calcular por cuánto se multiplica el número de puntuaciones cuando el contexto se alarga, contando las entradas de la tabla $n\\times n$.',
            takeaway:
              'Cuadruplicar el contexto multiplica por $16$ el número de puntuaciones: el coste crece con el cuadrado de la longitud, no con ella. Por eso hay tantos esfuerzos para que los contextos largos no salgan tan caros.',
          },
          prompt:
            'La tabla de puntuaciones $QK^{T}$ de un contexto de $n$ palabras tiene una fila y una columna por palabra, es decir, $n\\times n$ puntuaciones. Si el contexto pasa de **1000** palabras a **4000**, ¿**por cuánto se multiplica** el número de puntuaciones?',
          hints: [
            'Con $n$ palabras hay $n^{2}$ puntuaciones. Calcula cuántas hay con $1000$ y con $4000$.',
            'Divide las segundas entre las primeras. También sale de elevar al cuadrado el factor $4$ del contexto.',
          ],
          explain:
            'El número de puntuaciones es $n^{2}$, así que si $n$ se multiplica por un factor, las puntuaciones se multiplican por ese factor al cuadrado.',
          solution:
            'Con $1000$ palabras hay un millón de puntuaciones y con $4000$, dieciséis millones: se multiplican por $\\frac{4000^{2}}{1000^{2}}=4^{2}=16$. Si te sale $4$, has contado como si el coste creciera con $n$ y no con $n^{2}$.',
          answer: 16,
          tol: 0,
        },
        {
          id: 'atencion.ex01.5',
          type: 'numero',
          purpose: {
            why: 'En un modelo que genera texto, la máscara causal se aplica en todas las cabezas de todos los bloques. Saber cuántos pesos anula dice cuánta tabla se calcula para nada, y por qué algunas implementaciones se ahorran ese triángulo.',
            aim: 'Vas a contar cuántas casillas del mapa de atención de cinco tokens anula la máscara causal, fila a fila.',
            takeaway:
              'Se anulan $4+3+2+1+0=10$ de los 25: el triángulo por encima de la diagonal. Quedan 15, con la diagonal, porque cada token sí puede mirarse a sí mismo. Con $n$ tokens se anulan $\\frac{n(n-1)}{2}$.',
          },
          prompt:
            'Un modelo que genera texto procesa «el perro come su pienso» con máscara causal: cada token solo mira a sí mismo y a los anteriores. El mapa de atención tiene $5\\times 5=25$ pesos. ¿Cuántos quedan a $0$ por la máscara? Piénsalo y después activa la máscara en el laboratorio para contarlos.',
          hints: [
            'Cada fila del mapa es un token que mira. El primero no puede mirar a los cuatro siguientes; el segundo, a tres…',
            'Suma lo que se anula en cada fila. La diagonal no se anula: un token sí puede mirarse a sí mismo.',
          ],
          explain:
            'La máscara anula, en la fila de cada token, las columnas de los tokens que vienen después. Es el triángulo por encima de la diagonal, sin la diagonal.',
          solution:
            'Fila a fila: $4+3+2+1+0=10$ pesos a $0$. Quedan $25-10=15$ distintos de $0$, la diagonal incluida. Si te sale $15$, has contado los que quedan en vez de los anulados.',
          lab: {
            kind: 'atencion',
            tokens: PERRO_PIENSO,
            focus: 4,
            query: [1, 1],
            movable: 'none',
            range: 3,
            snap: 0.5,
            mask: 'toggle',
            heatmap: true,
          },
          answer: 10,
          tol: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'atencion.ex02.1',
          type: 'codigo',
          prompt:
            '`Q` y `K` guardan las consultas y las claves de **6 palabras**, una palabra por fila y tres componentes por fila. Guarda en `d` el número de componentes de cada fila (un entero), en `S` la tabla de puntuaciones escaladas, de 6 filas y 6 columnas (en la fila $i$ y la columna $j$, el producto escalar de la consulta $i$ con la clave $j$, dividido entre la raíz de $d$) y en `rango` el rango de `S`, que da `np.linalg.matrix_rank` (un entero).',
          hints: [
            'El plan son tres líneas. `d`: el número de columnas de `Q`, que da `.shape`. `S`: `Q` por la **traspuesta** de `K` (`.T`), para que encajen las columnas de una con las filas de la otra, y todo ello dividido entre `np.sqrt(d)`. `rango`: `np.linalg.matrix_rank` de la tabla `S`. Fíjate en qué número te sale y compáralo con el de filas de `S`.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'a = np.array([[1, 2], [3, 4], [5, 6]])',
                'print(a.shape)                  # (3, 2): 3 filas y 2 columnas',
                'print(a.shape[1])               # 2: el número de columnas',
                'print((a @ a.T).shape)          # (3, 3): cada fila con cada fila',
                'print(np.sqrt(4))               # 2.0: la raíz cuadrada',
                'b = np.array([[1, 2], [2, 4], [3, 6]])',
                'print(np.linalg.matrix_rank(b)) # 1: todas las filas son múltiplos de la primera',
              ) +
              '\n\n`a @ a.T` encaja porque `a` tiene 2 columnas y `a.T` tiene 2 filas; `a @ a` daría un error de formas.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'd = Q.shape[___]',
                'S = Q @ K.___ / np.sqrt(d)',
                'rango = np.linalg.matrix_rank(___)',
              ) +
              '\n\nEl error típico es dividir entre la raíz del número de palabras en vez de la de componentes.',
          ],
          explain:
            'Cada puntuación es el producto escalar de una consulta con una clave, y la tabla entera es un producto de matrices. Se divide entre la raíz del número de componentes, no del número de palabras. Mira la forma de cada array antes de multiplicar, y compara el rango que sale con el número de filas de la tabla: ¿cabe esperar que sea igual?',
          solution:
            'Cada fila de `Q` y de `K` tiene $3$ componentes, así que `d` vale $3$. `S = Q @ K.T / np.sqrt(d)` tiene $6$ filas y $6$ columnas; por ejemplo, la consulta $0$ con la clave $0$ da $1/\\sqrt{3}\\approx 0{,}58$ y con la clave $2$ da $4/\\sqrt{3}\\approx 2{,}31$. Aunque la tabla es de $6\\times 6$, su rango es $3$: es el producto de una matriz de $6\\times 3$ por otra de $3\\times 6$, y no puede pasar del número de componentes. Errores típicos: dividir entre la raíz de $6$, el número de palabras; no dividir; o dejar la tabla traspuesta, con las consultas en las columnas.',
          requirements: [
            '`d` es un número entero: cuántos componentes tiene cada fila de `Q` y de `K`.',
            '`S` es un array de NumPy de 6 filas y 6 columnas: en la fila de una palabra, sus puntuaciones con todas las claves, ya escaladas.',
            '`rango` es un número entero: el rango de la tabla `S`.',
          ],
          starter: `import numpy as np

Q = np.array([[1, 0, 2], [2, 1, 0], [0, 1, 1], [1, 1, 1], [2, 0, 1], [0, 2, 1]])
K = np.array([[1, 1, 0], [0, 2, 1], [2, 0, 1], [1, 0, 1], [0, 1, 2], [1, 2, 0]])
# Q y K: arrays de NumPy de 6 filas y 3 columnas. La fila i de Q es la consulta de la palabra i,
# y la fila j de K, la clave de la palabra j. Aquí las palabras van por FILAS (en el plano, los vectores iban por columnas).

# PASO 1. d: cuántos componentes tiene cada consulta (y cada clave).
# Por qué: el producto escalar suma tantos términos como componentes, y esa suma crece con su número.
# Q.shape es la pareja (filas, columnas); Q.shape[0] es el número de filas y Q.shape[1], el de columnas.
# Resultado esperado: un número entero.
d = None

# PASO 2. S: la tabla de puntuaciones, ya escalada.
# Por qué: la puntuación de la palabra i con la j es la consulta i por la clave j, y todas a la vez son Q por K traspuesta.
# A @ B pide que las columnas de A sean tantas como las filas de B, y K.T cambia filas por columnas de K.
# Para escalar, divide la tabla entera entre np.sqrt(d): la raíz cuadrada de los componentes.
# Resultado esperado: un array de 6 filas y 6 columnas.
S = None

# PASO 3. rango: el rango de la tabla S.
# Por qué: el rango dice cuántas filas son independientes, y QKᵀ no puede pasar del número de componentes.
# np.linalg.matrix_rank(M) devuelve el rango de M, un entero.
# Resultado esperado: un número entero.
rango = None

# Para ver qué vale algo antes de entregar: print(S) y pulsa «Ejecutar».
`,
          checks: `_Q = np.array([[1, 0, 2], [2, 1, 0], [0, 1, 1], [1, 1, 1], [2, 0, 1], [0, 2, 1]], dtype=float)
_K = np.array([[1, 1, 0], [0, 2, 1], [2, 0, 1], [1, 0, 1], [0, 1, 2], [1, 2, 0]], dtype=float)
_R = _Q @ _K.T / np.sqrt(3)
_d = isinstance(d, (int, np.integer)) and not isinstance(d, (bool, np.bool_))
_s = isinstance(S, np.ndarray) and S.shape == (6, 6) and np.issubdtype(S.dtype, np.number)
_sok = _s and bool(np.allclose(S, _R))
_k = isinstance(rango, (int, np.integer)) and not isinstance(rango, (bool, np.bool_))
check(_d, "\`d\` tiene que ser un número entero: cuántos componentes tiene cada fila de \`Q\`.")
check((not _d) or d != 6, "\`d\` vale 6, el número de palabras (las filas de \`Q\`). Tiene que ser el número de componentes de cada una, o sea, de columnas.")
check((not _d) or d in (3, 6), "\`d\` tiene que ser el número de columnas de \`Q\`: los componentes de cada consulta.")
check(_s, "\`S\` tiene que ser un array de NumPy de 6 filas y 6 columnas: la puntuación de cada palabra con cada clave.")
check((not _s) or _sok or not np.allclose(S, _Q @ _K.T), "\`S\` no está dividida entre la raíz de \`d\`: falta escalar las puntuaciones.")
check((not _s) or _sok or not np.allclose(S, _Q @ _K.T / np.sqrt(6)), "\`S\` está dividida entre la raíz del número de palabras. Hay que dividir entre la raíz de \`d\`, el número de componentes de cada consulta.")
check((not _s) or _sok or not np.allclose(S, _R.T), "\`S\` está traspuesta: la fila de una palabra tiene que llevar sus puntuaciones como consulta, con todas las claves.")
check((not _s) or _sok or np.allclose(S, _Q @ _K.T) or np.allclose(S, _Q @ _K.T / np.sqrt(6)) or np.allclose(S, _R.T), "\`S\` tiene que ser \`Q\` por la traspuesta de \`K\`, dividido entre la raíz de \`d\`.")
check(_k, "\`rango\` tiene que ser un número entero: el rango de \`S\`, que calcula \`np.linalg.matrix_rank\`.")
check((not _k) or rango != 6, "\`rango\` vale 6, el número de filas de \`S\`. Pero \`S\` es el producto de dos matrices con 3 columnas y su rango no puede pasar de ahí: revisa qué le has pasado a \`np.linalg.matrix_rank\`.")
check((not _k) or rango in (3, 6), "\`rango\` tiene que ser el rango de la tabla \`S\`, que calcula \`np.linalg.matrix_rank\`.")
`,
          reference: `import numpy as np

Q = np.array([[1, 0, 2], [2, 1, 0], [0, 1, 1], [1, 1, 1], [2, 0, 1], [0, 2, 1]])
K = np.array([[1, 1, 0], [0, 2, 1], [2, 0, 1], [1, 0, 1], [0, 1, 2], [1, 2, 0]])
# Guarda en d los componentes de cada fila, en S las puntuaciones escaladas y en rango el rango de S
d = Q.shape[1]
S = Q @ K.T / np.sqrt(d)
rango = np.linalg.matrix_rank(S)
`,
        },
        {
          id: 'atencion.ex02.2',
          type: 'codigo',
          prompt:
            'Escribe `softmax_filas(S)`: recibe `S`, un array de puntuaciones con una fila por consulta y una columna por clave, y devuelve un array de la misma forma en el que **cada fila** son pesos no negativos que suman 1 (el softmax de esa fila). Tiene que aguantar puntuaciones muy grandes, como 1000, sin devolver `nan` ni infinito.',
          hints: [
            'El plan son dos pasos dentro de la función. Primero, el exponencial de cada puntuación, pero restando antes a cada fila **su máximo**: no cambia el reparto y evita que `np.exp` se desborde con puntuaciones grandes. Después, divide cada fila entre su propia suma. La suma de una fila sale con `sum` por el eje de las columnas, y tiene que **conservar la forma** (`keepdims=True`) para poder dividir la tabla entre ella.',
            'Las piezas, con una tabla pequeña:\n\n' +
              py(
                'T = np.array([[1.0, 3.0], [2.0, 2.0], [0.0, 4.0]])',
                'print(T.max(axis=1))                         # [3. 2. 4.]: el máximo de cada fila',
                'print(T.max(axis=1, keepdims=True).shape)    # (3, 1): una columna',
                'print((T - T.max(axis=1, keepdims=True))[0]) # [-2.  0.]: ahora el mayor de cada fila es 0',
                'print(np.exp(-2.0))                          # 0.1353...: el exponencial es siempre positivo',
                'print(T.sum(axis=1, keepdims=True).shape)    # (3, 1): la suma de cada fila, en columna',
              ) +
              '\n\nEn una función todo lo de dentro lleva 4 espacios de sangría, y lo que devuelve va con `return`. Si quitas `keepdims`, la división de una tabla de 3 filas entre 3 números da un error de formas.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def softmax_filas(S):',
                '    E = np.exp(S - S.max(axis=___, keepdims=True))',
                '    return E / E.sum(axis=___, keepdims=___)',
              ) +
              '\n\nLos dos ejes tienen que ser el mismo: el que recorre cada fila.',
          ],
          explain:
            'Cada fila es el reparto de atención de una consulta, y es esa fila la que tiene que sumar 1, no las columnas. Restar el máximo de cada fila no cambia el resultado, porque el softmax solo depende de las diferencias, pero evita el desbordamiento. Prueba con puntuaciones enormes y con una tabla que no sea cuadrada.',
          solution:
            'Se resta a cada fila su máximo con `S.max(axis=1, keepdims=True)`, se exponencia y se divide cada fila entre su suma, `E.sum(axis=1, keepdims=True)`. Con `keepdims=True` la suma sale como una columna y la división normaliza fila a fila. El resultado no cambia por restar el máximo, porque el factor $e^{-m}$ aparece arriba y abajo, pero sin restarlo, $e^{1000}$ se desborda y salen `nan`. Errores típicos: normalizar con `axis=0`, de modo que suman 1 las columnas y no las filas; olvidar `keepdims` y obtener un error de formas en una tabla no cuadrada; o no restar el máximo, que falla con puntuaciones grandes.',
          requirements: [
            '`softmax_filas` es una función que recibe un array `S` de NumPy con varias filas y columnas y devuelve un array de la misma forma.',
            'Se llama a la función con varias tablas que no son cuadradas, además de una con puntuaciones muy grandes (del orden de mil); no debe dar error ni devolver `nan`.',
            'Cada fila de lo que devuelve suma 1 y no tiene números negativos.',
            'Cada fila es el softmax de la fila correspondiente de `S`: las puntuaciones mayores reciben más peso. Se acepta una diferencia diminuta de redondeo.',
          ],
          starter: `import numpy as np


# Aquí no hay datos hechos: la función recibe su tabla. Las comprobaciones la llaman con
# varias tablas, algunas con puntuaciones enormes.

def softmax_filas(S):
    # S: un array de NumPy de n filas (una por consulta) y m columnas (una por clave).
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría).

    # PASO 1. Restar a cada fila su máximo.
    # Por qué: el softmax no cambia al restar lo mismo a toda una fila, y así el mayor exponente
    # de cada fila es 0 y np.exp no se desborda con puntuaciones grandes (e elevado a 1000 es infinito).
    # S.max(axis=...) da el máximo a lo largo de ese eje; keepdims=True conserva el eje como una columna.

    # PASO 2. El exponencial: np.exp(...) de cada número, siempre positivo.

    # PASO 3. Dividir cada fila entre su suma y devolver el resultado con return.
    # Por qué: así cada fila suma 1. E.sum(axis=..., keepdims=True) da la suma de cada fila como una columna,
    # y dividir la tabla entre una columna divide cada fila entre su número.
    return None

# Para probarla antes de entregar: crea una tabla con np.array(...), llama a softmax_filas(tabla),
# imprime el resultado con print(...) y pulsa «Ejecutar».
`,
          checks: `_tablas = [
    np.array([[1.0, 2.0, 3.0, 0.0], [0.0, 0.0, 0.0, 0.0], [-1.0, 4.0, 2.0, 1.0]]),
    np.array([[0.5, -1.5], [2.0, 2.5], [-3.0, 0.0], [1.0, 1.0], [4.0, -4.0]]),
    np.array([[2.0, 0.0, 1.0, -2.0, 3.0]]),
]
_grande = np.array([[1000.0, 1001.0, 1002.0], [-1000.0, 0.0, 5.0], [800.0, 800.0, 790.0]])
_f = callable(globals().get("softmax_filas"))
def _call(T):
    try:
        with np.errstate(all="ignore"):
            return softmax_filas(T.copy())
    except Exception:
        return None
def _ref(T):
    E = np.exp(T - T.max(axis=1, keepdims=True))
    return E / E.sum(axis=1, keepdims=True)
_out = [_call(T) for T in _tablas] if _f else []
_shape = _f and all(isinstance(o, np.ndarray) and o.shape == T.shape and np.issubdtype(o.dtype, np.floating) for o, T in zip(_out, _tablas))
_fin = _shape and all(bool(np.all(np.isfinite(o))) and bool(np.all(o >= 0)) for o in _out)
_rows = _fin and all(bool(np.allclose(o.sum(axis=1), 1)) for o in _out)
_cols = _fin and (not _rows) and all(bool(np.allclose(o.sum(axis=0), 1)) for o in _out)
_same = _rows and all(bool(np.allclose(o, _ref(T))) for o, T in zip(_out, _tablas))
_og = _call(_grande) if _f else None
_gok = _same and isinstance(_og, np.ndarray) and _og.shape == _grande.shape and bool(np.all(np.isfinite(_og)))
check(_f, "Hay que definir una función \`softmax_filas\` que reciba la tabla de puntuaciones.")
check((not _f) or _shape, "\`softmax_filas\` tiene que devolver un array de NumPy con la misma forma que la tabla que recibe, y con números decimales. Con una tabla de más filas que columnas, comprueba que la división es compatible con la forma.")
check((not _shape) or _fin, "\`softmax_filas\` tiene que devolver números finitos y no negativos: los exponenciales nunca son negativos.")
check((not _fin) or (not _cols), "Lo que devuelve \`softmax_filas\` suma 1 por columnas, no por filas. Cada fila es el reparto de una consulta, y es ella la que tiene que sumar 1.")
check((not _fin) or _cols or _rows, "Cada fila de lo que devuelve \`softmax_filas\` tiene que sumar 1.")
check((not _rows) or _same, "Las filas de lo que devuelve \`softmax_filas\` suman 1, pero no son el softmax de las puntuaciones: los pesos tienen que ser proporcionales al exponencial de cada puntuación.")
check((not _same) or _gok, "Con puntuaciones muy grandes (como 1000), \`softmax_filas\` devuelve \`nan\` o infinito: antes de exponenciar hay que restar a cada fila su máximo.")
`,
          reference: `import numpy as np


def softmax_filas(S):
    E = np.exp(S - S.max(axis=1, keepdims=True))
    return E / E.sum(axis=1, keepdims=True)
`,
        },
        {
          id: 'atencion.ex02.3',
          type: 'codigo',
          prompt:
            '`pesos` guarda los pesos de atención de **4 palabras**: una fila por palabra, y cada fila suma 1. `V` guarda los valores de esas palabras, uno por fila. Guarda en `salida` lo que sale de la capa (para cada palabra, la media de los valores ponderada con sus pesos, una fila por palabra), en `mas_atendido` a qué palabra mira más cada una (la posición de su peso mayor, contando desde 0, un entero por palabra) y en `recibida` cuánta atención recibe en total cada palabra, sumando lo que le dan todas (un número por palabra).',
          hints: [
            'El plan son tres líneas. `salida`: el producto de matrices `pesos @ V`, que mezcla los valores: cada fila de `pesos` pondera las filas de `V`. `mas_atendido`: `argmax` de `pesos`, buscando el mayor **a lo largo de cada fila**. `recibida`: la suma de `pesos`, pero ahora lo que se suma es lo que recibe cada palabra, que está en su **columna**. Dos ejes distintos para dos preguntas distintas.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'p = np.array([[0.2, 0.8], [0.3, 0.7]])',
                'v = np.array([[10, 0], [0, 20]])',
                'print(p @ v)                    # [[ 2. 16.] [ 3. 14.]]: cada fila mezcla las filas de v',
                'print(p.argmax(axis=1))         # [1 1]: la columna mayor de cada fila',
                'print(p.argmax(axis=0))         # [1 0]: la fila mayor de cada columna',
                'print(p.sum(axis=0))            # [0.5 1.5]: lo que suma cada columna',
                'print(p.sum(axis=1))            # [1. 1.]: lo que suma cada fila',
              ) +
              '\n\nUna fila de `p` es el reparto de una palabra, y una columna, lo que reciben de las demás.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'salida = ___ @ V',
                'mas_atendido = pesos.argmax(axis=___)',
                'recibida = pesos.sum(axis=___)',
              ) +
              '\n\nEl error típico es sumar por filas: cada fila suma 1 siempre, y no dice nada.',
          ],
          explain:
            'Cada fila de los pesos reparte la atención de una palabra, y la salida de esa palabra mezcla los valores con ese reparto. Para saber a quién mira más una palabra se mira su fila; para saber cuánta atención recibe una palabra se mira su columna. Comprueba que `salida` tiene una fila por palabra y una columna por componente de `V`.',
          solution:
            '`pesos @ V` da `salida`; por ejemplo, la primera palabra reparte $0{,}5$, $0{,}25$ y $0{,}25$ entre las tres primeras, y su salida es $(2{,}5;\\ 1{,}5)$. `pesos.argmax(axis=1)` da `[0, 1, 3, 3]`: la primera palabra se mira a sí misma, la segunda también, y las dos últimas miran a la última. `pesos.sum(axis=0)` da `[0,9; 1,2; 0,8; 1,1]`: la segunda palabra es la que más atención recibe. Errores típicos: usar `pesos.T @ V`, que mezcla con las columnas; buscar el mayor con `axis=0`, que da la fila mayor de cada columna; o sumar con `axis=1`, que da 1 para todas.',
          requirements: [
            '`salida` es un array de NumPy de 4 filas y 2 columnas: una fila por palabra y una columna por componente de `V`.',
            '`mas_atendido` es un array de 4 números enteros: la posición del peso mayor de cada palabra, contando desde 0.',
            '`recibida` es un array de 4 números: la atención total que recibe cada palabra de todas las demás y de sí misma.',
          ],
          starter: `import numpy as np

pesos = np.array([[0.5, 0.25, 0.25, 0.0], [0.1, 0.6, 0.1, 0.2], [0.0, 0.25, 0.25, 0.5], [0.3, 0.1, 0.2, 0.4]])
V = np.array([[4, 0], [0, 4], [2, 2], [1, 3]])
# pesos: 4 filas y 4 columnas; la fila i es el reparto de atención de la palabra i y suma 1.
# V: 4 filas y 2 columnas; la fila j es el valor de la palabra j.

# PASO 1. salida: la salida de cada palabra, la media de los valores ponderada con sus pesos.
# Por qué: es lo que la capa de atención entrega. Cada palabra recoge un poco de los valores de las demás.
# a @ b con a de 4 por 4 y b de 4 por 2 da 4 por 2: cada fila de a pondera las filas de b.
# Resultado esperado: un array de 4 filas y 2 columnas.
salida = None

# PASO 2. mas_atendido: a qué palabra mira más cada palabra.
# Por qué: el peso mayor de una fila señala la palabra que más le importa.
# M.argmax(axis=...) devuelve la posición del mayor a lo largo de ese eje. axis=0 recorre las filas
# de cada columna y axis=1 recorre las columnas de cada fila; las posiciones empiezan en 0.
# Resultado esperado: un array con 4 números enteros.
mas_atendido = None

# PASO 3. recibida: cuánta atención recibe cada palabra en total.
# Por qué: una palabra muy mirada por las demás es importante para el texto.
# Lo que recibe una palabra es lo que le da cada fila a su columna. M.sum(axis=...) suma a lo largo de ese eje:
# con axis=0 se suma cada columna y con axis=1, cada fila.
# Resultado esperado: un array con 4 números.
recibida = None

# Para ver qué vale algo antes de entregar: print(salida) y pulsa «Ejecutar».
`,
          checks: `_P = np.array([[0.5, 0.25, 0.25, 0.0], [0.1, 0.6, 0.1, 0.2], [0.0, 0.25, 0.25, 0.5], [0.3, 0.1, 0.2, 0.4]])
_V = np.array([[4, 0], [0, 4], [2, 2], [1, 3]], dtype=float)
_s = isinstance(salida, np.ndarray) and salida.shape == (4, 2) and np.issubdtype(salida.dtype, np.number)
_sok = _s and bool(np.allclose(salida, _P @ _V))
_m = isinstance(mas_atendido, np.ndarray) and mas_atendido.shape == (4,) and np.issubdtype(mas_atendido.dtype, np.integer)
_r = isinstance(recibida, np.ndarray) and recibida.shape == (4,) and np.issubdtype(recibida.dtype, np.number)
check(_s, "\`salida\` tiene que ser un array de NumPy de 4 filas y 2 columnas: una fila por palabra y una columna por componente de \`V\`.")
check((not _s) or _sok or not np.allclose(salida, _P.T @ _V), "\`salida\` mezcla los valores con las columnas de \`pesos\` en vez de con sus filas: la salida de una palabra usa su propia fila de pesos.")
check((not _s) or _sok or np.allclose(salida, _P.T @ _V), "\`salida\` tiene que ser, para cada palabra, la media de los valores ponderada con su fila de \`pesos\`: el producto de \`pesos\` por \`V\`.")
check(_m, "\`mas_atendido\` tiene que ser un array de NumPy con 4 números enteros: la posición del peso mayor de cada palabra.")
check((not _m) or not np.array_equal(mas_atendido, _P.argmax(axis=0)), "\`mas_atendido\` busca el mayor dentro de cada columna. Cada palabra reparte su atención en su fila: el mayor se busca a lo largo de la fila.")
check((not _m) or np.array_equal(mas_atendido, _P.argmax(axis=0)) or np.array_equal(mas_atendido, _P.argmax(axis=1)), "\`mas_atendido\` tiene que ser, para cada palabra, la posición de su peso mayor, contando desde 0.")
check(_r, "\`recibida\` tiene que ser un array de NumPy con 4 números: la atención que recibe cada palabra.")
check((not _r) or not np.allclose(recibida, _P.sum(axis=1)), "\`recibida\` vale 1 para todas las palabras: es la suma de cada fila, que siempre da 1. Lo que recibe una palabra está en su columna.")
check((not _r) or np.allclose(recibida, _P.sum(axis=1)) or np.allclose(recibida, _P.sum(axis=0)), "\`recibida\` tiene que sumar, para cada palabra, los pesos que todas las filas le dan: la suma de su columna.")
`,
          reference: `import numpy as np

pesos = np.array([[0.5, 0.25, 0.25, 0.0], [0.1, 0.6, 0.1, 0.2], [0.0, 0.25, 0.25, 0.5], [0.3, 0.1, 0.2, 0.4]])
V = np.array([[4, 0], [0, 4], [2, 2], [1, 3]])
# Guarda en salida la mezcla de valores, en mas_atendido la posición del peso mayor de cada fila y en recibida lo que suma cada columna
salida = pesos @ V
mas_atendido = pesos.argmax(axis=1)
recibida = pesos.sum(axis=0)
`,
        },
        {
          id: 'atencion.ex02.4',
          type: 'codigo',
          prompt:
            'Junta los pasos. Escribe `atencion(Q, K, V)`: recibe las consultas `Q` (`m` filas y `d` columnas), las claves `K` (`n` filas y `d` columnas) y los valores `V` (`n` filas y `dv` columnas), y devuelve la pareja `(salida, pesos)`: `salida`, de `m` filas y `dv` columnas, y `pesos`, de `m` filas y `n` columnas, el softmax por filas de las puntuaciones escaladas.',
          hints: [
            'El plan son cuatro pasos dentro de la función, y ya conoces los cuatro. Las puntuaciones: `Q` por la traspuesta de `K`, divididas entre la raíz del número de **columnas** de `Q` (los componentes, no las filas). El softmax de cada fila, restando antes su máximo y dividiendo cada fila entre su suma, con `keepdims=True`. La salida: los pesos por `V`. Y devuelve las dos cosas con `return salida, pesos`, en ese orden. Ahora `m`, `n`, `d` y `dv` pueden ser distintos, y las formas tienen que encajar.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'q = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])   # 3 consultas, 2 componentes',
                'k = np.array([[1.0, 2.0], [0.0, 1.0]])               # 2 claves',
                's = q @ k.T / np.sqrt(q.shape[1])',
                'print(s.shape)                                       # (3, 2): una fila por consulta',
                'e = np.exp(s - s.max(axis=1, keepdims=True))',
                'w = e / e.sum(axis=1, keepdims=True)',
                'print(w.sum(axis=1))                                 # [1. 1. 1.]',
                'v = np.array([[5.0, 0.0, 1.0], [0.0, 4.0, 2.0]])     # 2 valores de 3 componentes',
                'print((w @ v).shape)                                 # (3, 3): una fila por consulta',
              ) +
              '\n\nAhí `m` vale 3, `n` vale 2 y `dv` vale 3: la salida lleva las filas de las consultas y las columnas de los valores.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def atencion(Q, K, V):',
                '    S = Q @ K.___ / np.sqrt(Q.shape[___])',
                '    E = np.exp(S - S.max(axis=1, keepdims=True))',
                '    pesos = E / E.sum(axis=___, keepdims=True)',
                '    return ___ @ V, pesos',
              ) +
              '\n\nEl error típico es dividir entre la raíz del número de palabras, o normalizar por columnas.',
          ],
          explain:
            'Es el paso completo de una cabeza de atención: puntuar, repartir y mezclar. Cada paso usa el anterior, y las formas lo comprueban: los pesos tienen una fila por consulta y una columna por clave, y la salida tiene una fila por consulta. Si el número de consultas y el de claves coinciden, un error de eje puede pasar sin avisar: prueba con formas distintas.',
          solution:
            'Se puntúa con `S = Q @ K.T / np.sqrt(Q.shape[1])`, se hace el softmax de cada fila de `S` (restando su máximo y dividiendo entre su suma con `axis=1, keepdims=True`) y se devuelve `pesos @ V, pesos`. La salida de cada consulta es una media de los valores. Con $2$ consultas, $4$ claves, $3$ componentes y valores de $5$ componentes, `salida` es de $2\\times 5$ y `pesos` de $2\\times 4$. Errores típicos: escalar con la raíz del número de palabras en vez de la de los componentes; normalizar con `axis=0`, de modo que suman 1 las columnas; o devolver solo la salida.',
          requirements: [
            '`atencion` es una función que recibe `Q`, `K` y `V` como arrays de NumPy y devuelve dos arrays, en este orden: la salida y los pesos.',
            'Se llama a la función con varios conjuntos de datos en los que el número de consultas, el de claves, el de componentes y el de componentes de los valores son distintos; no debe dar error.',
            'Los pesos tienen una fila por consulta y una columna por clave, y cada fila suma 1.',
            'La salida tiene una fila por consulta y una columna por componente de los valores. Se acepta una diferencia diminuta de redondeo.',
          ],
          starter: `import numpy as np


# Aquí no hay datos hechos: la función recibe los suyos. Las comprobaciones la llaman con
# varios conjuntos de datos y formas distintas.

def atencion(Q, K, V):
    # Q: m filas (una por consulta) y d columnas. K: n filas (una por clave) y d columnas.
    # V: n filas (un valor por clave) y dv columnas. Todo lo de dentro lleva 4 espacios de sangría.

    # PASO 1. Las puntuaciones escaladas: Q por la traspuesta de K, entre la raíz de d.
    # Por qué: d es el número de COLUMNAS de Q (Q.shape[1]); las filas son consultas, no componentes.
    # Q @ K.T da una tabla de m filas y n columnas.

    # PASO 2. Los pesos: el softmax de cada fila.
    # Por qué: así cada consulta reparte su atención, con pesos positivos que suman 1.
    # Resta a cada fila su máximo, aplica np.exp y divide cada fila entre su suma,
    # usando axis=... y keepdims=True para que la división encaje.

    # PASO 3. La salida: los pesos por V.
    # Por qué: mezcla los valores de las claves con el reparto de cada consulta.
    # (m por n) @ (n por dv) da m por dv.

    # PASO 4. Devolver las dos cosas, la salida y después los pesos, con return salida, pesos.
    return None

# Para probarla antes de entregar: crea Q, K y V con np.array(...), llama a atencion(Q, K, V),
# imprime el resultado con print(...) y pulsa «Ejecutar».
`,
          checks: `_rng = np.random.default_rng(7)
_dims = [(2, 4, 3, 5), (3, 3, 2, 4), (4, 2, 4, 3)]
_data = []
for _m, _n, _d, _dv in _dims:
    _data.append((_rng.integers(-2, 3, (_m, _d)).astype(float), _rng.integers(-2, 3, (_n, _d)).astype(float), _rng.integers(-3, 4, (_n, _dv)).astype(float)))
_f = callable(globals().get("atencion"))
def _call(Q, K, V):
    try:
        return atencion(Q.copy(), K.copy(), V.copy())
    except Exception:
        return None
def _soft(S):
    E = np.exp(S - S.max(axis=1, keepdims=True))
    return E / E.sum(axis=1, keepdims=True)
def _pesos(Q, K, esc=None):
    d = Q.shape[1] if esc is None else esc
    return _soft(Q @ K.T / np.sqrt(d))
_out = [_call(Q, K, V) for Q, K, V in _data] if _f else []
_two = _f and all(isinstance(o, tuple) and len(o) == 2 and all(isinstance(a, np.ndarray) for a in o) for o in _out)
_shape = _two and all(o[0].shape == (Q.shape[0], V.shape[1]) and o[1].shape == (Q.shape[0], K.shape[0]) for o, (Q, K, V) in zip(_out, _data))
_fin = _shape and all(bool(np.all(np.isfinite(o[1]))) and bool(np.all(np.isfinite(o[0]))) for o in _out)
_rows = _fin and all(bool(np.allclose(o[1].sum(axis=1), 1)) and bool(np.all(o[1] >= 0)) for o in _out)
_cols = _fin and (not _rows) and all(bool(np.allclose(o[1].sum(axis=0), 1)) for o in _out)
_pok = _rows and all(bool(np.allclose(o[1], _pesos(Q, K))) for o, (Q, K, V) in zip(_out, _data))
_nsc = _rows and (not _pok) and all(bool(np.allclose(o[1], _soft(Q @ K.T))) for o, (Q, K, V) in zip(_out, _data))
_nrow = _rows and (not _pok) and all(bool(np.allclose(o[1], _pesos(Q, K, K.shape[0]))) for o, (Q, K, V) in zip(_out, _data))
_sok = _pok and all(bool(np.allclose(o[0], _pesos(Q, K) @ V)) for o, (Q, K, V) in zip(_out, _data))
check(_f, "Hay que definir una función \`atencion\` que reciba \`Q\`, \`K\` y \`V\`.")
check((not _f) or _two, "\`atencion\` tiene que devolver dos arrays de NumPy, en este orden: la salida y los pesos.")
check((not _two) or _shape, "Las formas de lo que devuelve \`atencion\` no son las pedidas: la salida, con una fila por consulta y una columna por componente de \`V\`, y los pesos, con una fila por consulta y una columna por clave.")
check((not _shape) or _fin, "\`atencion\` devuelve \`nan\` o infinito: revisa el softmax y que la división encaje con la forma de las sumas.")
check((not _fin) or (not _cols), "Los pesos que devuelve \`atencion\` suman 1 por columnas, no por filas. Cada fila es el reparto de una consulta.")
check((not _fin) or _cols or _rows, "Cada fila de los pesos que devuelve \`atencion\` tiene que sumar 1, y ninguno puede ser negativo.")
check((not _rows) or (not _nsc), "Los pesos de \`atencion\` salen de puntuaciones sin escalar: falta dividir entre la raíz del número de componentes.")
check((not _rows) or (not _nrow), "Los pesos de \`atencion\` se escalan con la raíz del número de claves. Hay que usar la del número de componentes de cada consulta.")
check((not _rows) or _pok or _nsc or _nrow, "Los pesos de \`atencion\` tienen que ser el softmax de cada fila de las puntuaciones \`Q\` por la traspuesta de \`K\`, escaladas.")
check((not _pok) or _sok, "La salida de \`atencion\` tiene que ser el producto de los pesos por \`V\`: cada consulta mezcla los valores con su reparto.")
`,
          reference: `import numpy as np


def atencion(Q, K, V):
    S = Q @ K.T / np.sqrt(Q.shape[1])
    E = np.exp(S - S.max(axis=1, keepdims=True))
    pesos = E / E.sum(axis=1, keepdims=True)
    return pesos @ V, pesos
`,
        },
        {
          id: 'atencion.ex02.5',
          type: 'codigo',
          prompt:
            'Un modelo que genera texto no puede mirar las palabras que vienen después. `Q`, `K` y `V` guardan las consultas, claves y valores de **5 palabras**, `S` ya tiene las puntuaciones escaladas y `softmax_filas(S)` está escrita. Guarda en `mascara` una tabla de `True` y `False` que valga `True` donde una palabra mira a otra **posterior**, en `S_enm` las puntuaciones con `-np.inf` en esas posiciones, en `pesos` el softmax por filas de `S_enm` y en `salida` la mezcla de los valores con esos pesos.',
          hints: [
            'El plan son cuatro líneas, y cada una usa la anterior. `mascara`: `np.triu` de una tabla de `True` de 5 por 5, que conserva lo que queda por encima de la diagonal; con `k=1` la diagonal no entra, porque una palabra sí puede mirarse a sí misma. `S_enm`: `np.where(mascara, -np.inf, S)`. `pesos`: `softmax_filas(S_enm)`, **después** de la máscara, para que cada fila vuelva a sumar 1 con lo que queda. `salida`: `pesos @ V`.',
            'Las piezas, con una tabla de 3 por 3:\n\n' +
              py(
                'm = np.triu(np.ones((3, 3), dtype=bool), k=1)',
                'print(m)                                # [[False  True  True]',
                '                                        #  [False False  True]',
                '                                        #  [False False False]]: True por encima de la diagonal, y la diagonal False',
                't = np.array([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]])',
                'print(np.where(m, -np.inf, t)[0])       # [  1. -inf -inf]: lo de la máscara pasa a -inf',
                'print(np.exp(-np.inf))                  # 0.0: un softmax no da peso a -inf',
                'print(softmax_filas(np.where(m, -np.inf, t))[0])   # [1. 0. 0.]: la primera fila solo se mira a sí misma',
              ) +
              '\n\nCon `k=0` la diagonal también valdría `True`, y la primera fila quedaría toda en `-inf`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'mascara = np.triu(np.ones((5, 5), dtype=bool), k=___)',
                'S_enm = np.where(mascara, ___, S)',
                'pesos = softmax_filas(___)',
                'salida = pesos @ V',
              ) +
              '\n\nEl error típico es poner ceros en los pesos después del softmax: las filas dejan de sumar 1.',
          ],
          explain:
            'La máscara se aplica a las puntuaciones, antes del softmax, y no a los pesos: así el softmax reparte todo el peso entre las palabras permitidas. Si tapas también la diagonal, la primera palabra se queda sin nada que mirar. Comprueba que la primera fila de los pesos vale 1 en la primera posición y que por encima de la diagonal no hay peso.',
          solution:
            '`np.triu(np.ones((5, 5), dtype=bool), k=1)` tapa los $10$ pares de una palabra con otra posterior. `np.where(mascara, -np.inf, S)` pone `-inf` ahí, y `softmax_filas` da a esas posiciones el peso $0$ y reparte el $1$ entre las demás. La primera fila de `pesos` es $(1; 0; 0; 0; 0)$, y la última, $(0{,}08; 0{,}26; 0{,}15; 0{,}05; 0{,}46)$. La salida de la última palabra es $(0{,}84;\\ 0{,}82)$. Errores típicos: `k=0`, que tapa la diagonal y deja la primera fila en `nan`; o poner ceros después del softmax, de modo que las filas suman menos de 1.',
          requirements: [
            '`mascara` es un array de NumPy de 5 filas y 5 columnas con valores `True` y `False`: `True` en cada posición en la que una palabra mira a una posterior.',
            '`S_enm` es un array de 5 filas y 5 columnas: las puntuaciones de `S`, con `-np.inf` donde la máscara es `True`.',
            '`pesos` es un array de 5 filas y 5 columnas: el softmax de cada fila de `S_enm`. Cada fila suma 1.',
            '`salida` es un array de 5 filas y 2 columnas: la mezcla de los valores con `pesos`.',
          ],
          starter: `import numpy as np

Q = np.array([[1, 0, 1], [0, 2, 1], [1, 1, 0], [2, 0, 0], [0, 1, 2]])
K = np.array([[1, 1, 0], [0, 1, 1], [2, 0, 1], [1, 0, 0], [0, 2, 1]])
V = np.array([[1, 0], [0, 1], [2, 0], [0, 2], [1, 1]])
S = Q @ K.T / np.sqrt(Q.shape[1])


def softmax_filas(S):
    E = np.exp(S - S.max(axis=1, keepdims=True))
    return E / E.sum(axis=1, keepdims=True)


# S: 5 filas y 5 columnas; la fila i son las puntuaciones de la palabra i con todas las palabras.
# La palabra i solo puede mirar a las palabras 0, 1, ..., i (ella misma y las anteriores).

# PASO 1. mascara: True donde la palabra i mira a una posterior (columna j mayor que la fila i).
# Por qué: son las posiciones por encima de la diagonal, y no se pueden usar.
# np.triu(t, k=1) conserva lo que queda por encima de la diagonal y pone False en el resto; k=0 conservaría la diagonal también.
# np.ones((5, 5), dtype=bool) es una tabla de 5 por 5 con True en todo.
# Resultado esperado: un array de 5 filas y 5 columnas con True y False.
mascara = None

# PASO 2. S_enm: las puntuaciones con -np.inf en las posiciones de la máscara.
# Por qué: np.exp(-np.inf) vale 0, así que el softmax no da peso a esas posiciones.
# np.where(m, a, b) toma a donde m es True y b donde es False.
# Resultado esperado: un array de 5 filas y 5 columnas.
S_enm = None

# PASO 3. pesos: el softmax por filas de las puntuaciones ya tapadas. Hazlo DESPUÉS de tapar.
# Por qué: así cada fila vuelve a sumar 1 con las palabras que sí puede mirar.
# Resultado esperado: un array de 5 filas y 5 columnas.
pesos = None

# PASO 4. salida: la mezcla de los valores con los pesos.
# Resultado esperado: un array de 5 filas y 2 columnas.
salida = None

# Para ver qué vale algo antes de entregar: print(pesos) y pulsa «Ejecutar».
`,
          checks: `_Q = np.array([[1, 0, 1], [0, 2, 1], [1, 1, 0], [2, 0, 0], [0, 1, 2]], dtype=float)
_K = np.array([[1, 1, 0], [0, 1, 1], [2, 0, 1], [1, 0, 0], [0, 2, 1]], dtype=float)
_V = np.array([[1, 0], [0, 1], [2, 0], [0, 2], [1, 1]], dtype=float)
_S0 = _Q @ _K.T / np.sqrt(3)
_M = np.triu(np.ones((5, 5), dtype=bool), k=1)
with np.errstate(all="ignore"):
    _E = np.exp(np.where(_M, -np.inf, _S0) - np.where(_M, -np.inf, _S0).max(axis=1, keepdims=True))
    _W = _E / _E.sum(axis=1, keepdims=True)
_m = isinstance(mascara, np.ndarray) and mascara.shape == (5, 5) and mascara.dtype == bool
_mok = _m and bool(np.array_equal(mascara, _M))
_diag = _m and bool(np.array_equal(mascara, np.triu(np.ones((5, 5), dtype=bool), k=0)))
_baj = _m and bool(np.array_equal(mascara, np.tril(np.ones((5, 5), dtype=bool), k=-1)))
_e = isinstance(S_enm, np.ndarray) and S_enm.shape == (5, 5) and np.issubdtype(S_enm.dtype, np.floating)
_eok = _mok and _e and bool(np.array_equal(np.isneginf(S_enm), _M)) and bool(np.allclose(S_enm[~_M], _S0[~_M]))
_p = isinstance(pesos, np.ndarray) and pesos.shape == (5, 5) and np.issubdtype(pesos.dtype, np.floating)
_rows = _p and bool(np.all(np.isfinite(pesos))) and bool(np.allclose(pesos.sum(axis=1), 1))
_pok = _p and bool(np.allclose(pesos, _W))
_s = isinstance(salida, np.ndarray) and salida.shape == (5, 2) and np.issubdtype(salida.dtype, np.floating)
check(_m, "\`mascara\` tiene que ser un array de NumPy de 5 filas y 5 columnas con \`True\` y \`False\`, no con unos y ceros.")
check((not _m) or not _diag, "\`mascara\` incluye la diagonal: una palabra sí puede mirarse a sí misma, y con la diagonal tapada la primera fila se queda sin ninguna palabra que mirar.")
check((not _m) or not _baj, "\`mascara\` tapa por debajo de la diagonal: lo que hay que tapar son las palabras posteriores, que quedan por encima.")
check((not _m) or _mok or _diag or _baj, "\`mascara\` tiene que ser \`True\` solo por encima de la diagonal: la palabra i no puede mirar a las palabras j con j mayor que i.")
check(_e, "\`S_enm\` tiene que ser un array de NumPy de 5 filas y 5 columnas con números decimales: las puntuaciones con la máscara aplicada.")
check((not _e) or (not _mok) or _eok, "\`S_enm\` tiene que valer \`-np.inf\` en las posiciones de la máscara y lo mismo que \`S\` en el resto.")
check(_p, "\`pesos\` tiene que ser un array de NumPy de 5 filas y 5 columnas con números decimales: el softmax de cada fila.")
check((not _p) or (not _eok) or _rows, "Las filas de \`pesos\` no suman 1: la máscara tiene que ir antes del softmax, que es el que reparte el peso entre las palabras que quedan.")
check((not _rows) or (not _eok) or _pok, "\`pesos\` tiene que ser el softmax por filas de \`S_enm\`: cada fila reparte su peso solo entre las palabras que puede mirar.")
check(_s, "\`salida\` tiene que ser un array de NumPy de 5 filas y 2 columnas: la mezcla de los valores con \`pesos\`.")
check((not _s) or (not _pok) or bool(np.allclose(salida, _W @ _V)), "\`salida\` tiene que ser el producto de \`pesos\` por \`V\`: cada palabra mezcla los valores con su fila de pesos.")
`,
          reference: `import numpy as np

Q = np.array([[1, 0, 1], [0, 2, 1], [1, 1, 0], [2, 0, 0], [0, 1, 2]])
K = np.array([[1, 1, 0], [0, 1, 1], [2, 0, 1], [1, 0, 0], [0, 2, 1]])
V = np.array([[1, 0], [0, 1], [2, 0], [0, 2], [1, 1]])
S = Q @ K.T / np.sqrt(Q.shape[1])


def softmax_filas(S):
    E = np.exp(S - S.max(axis=1, keepdims=True))
    return E / E.sum(axis=1, keepdims=True)


# Guarda en mascara los pares con una palabra posterior, en S_enm las puntuaciones tapadas, en pesos su softmax y en salida la mezcla
mascara = np.triu(np.ones((5, 5), dtype=bool), k=1)
S_enm = np.where(mascara, -np.inf, S)
pesos = softmax_filas(S_enm)
salida = pesos @ V
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'atencion.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien calcula la salida de una capa de atención. `Q`, `K` y `V` son arrays de NumPy con **un token por fila**, y NumPy ya está importado como `np`. Los pesos de cada token tienen que ser no negativos y sumar 1 sobre las palabras que mira. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Los pesos de un token son su fila de `pesos`. ¿Qué suma da cada fila en la tercera línea?',
        'Fíjate en el eje de cada suma: ¿por cuál se normaliza en la tercera línea?',
      ],
      explain:
        'Cada token reparte su atención en una fila de la tabla, y es esa fila la que tiene que sumar 1. Un cálculo que normaliza por el otro eje da números que parecen pesos, pero cada columna los suma, y la mezcla de valores deja de ser una media. Revisa si cada línea usa lo que la anterior debería haber preparado.',
      solution:
        'La tercera línea está mal. `E.sum(axis=0, keepdims=True)` suma cada columna, así que son las columnas las que suman 1 y no las filas: la fila de un token no es un reparto de su atención. Las filas se normalizan con `axis=1`. La línea siguiente arrastra el error, porque `pesos @ V` ya no es una media de los valores. La primera y la segunda están bien: se escala entre la raíz de las componentes y se resta el máximo de cada fila para que el exponencial no se desborde.',
      lines: [
        'S = Q @ K.T / np.sqrt(Q.shape[1])',
        'E = np.exp(S - S.max(axis=1, keepdims=True))',
        'pesos = E / E.sum(axis=0, keepdims=True)',
        'salida = pesos @ V',
      ],
      faultyLine: 2,
    },
    {
      id: 'atencion.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento escala las puntuaciones de atención. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Pregúntate qué hace crecer un producto escalar: el número de palabras del texto o el de componentes de cada vector.',
        'Comprueba qué número se usa como divisor en la segunda línea y de dónde sale.',
      ],
      explain:
        'El escalado compensa que un producto escalar suma tantos términos como componentes tienen la consulta y la clave. Lo que decide el divisor es ese número de componentes, no cuántas palabras tiene el texto. Revisa de dónde sale cada número.',
      solution:
        'La segunda línea está mal. El divisor es la raíz de $d_k$, el número de componentes de la consulta y de la clave, que aquí es $4$, de modo que se divide entre $\\sqrt{4}=2$. Dividir entre la raíz del número de palabras, $\\sqrt{9}=3$, hace que el escalado cambie al alargar el texto sin que el producto escalar haya cambiado. La tercera línea arrastra el divisor erróneo, aunque la forma de la tabla, de $9\\times 9$, sí es correcta.',
      lines: [
        'Un texto tiene 9 palabras, y cada consulta y cada clave tiene 4 componentes',
        'Para que las puntuaciones no crezcan y saturen el softmax, se dividen entre la raíz de 9, que es 3, la raíz del número de palabras',
        'Luego la tabla de puntuaciones tiene 9 filas y 9 columnas, con cada puntuación dividida entre 3',
      ],
      faultyLine: 1,
    },
    {
      id: 'atencion.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento lee una matriz de pesos de atención de un texto de tres palabras, con cifras inventadas. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Suma cada fila, y después cada columna, antes de decidir.',
        'Piensa por qué eje se normaliza el softmax de la atención.',
      ],
      explain:
        'El softmax normaliza cada fila, que es el reparto de atención de una palabra. Las columnas no están obligadas a sumar nada. Comprueba cada afirmación con las sumas.',
      solution:
        'No hay ningún error. Las filas $(0{,}7; 0{,}2; 0{,}1)$, $(0{,}1; 0{,}8; 0{,}1)$ y $(0{,}3; 0{,}3; 0{,}4)$ suman $1$ cada una, la primera columna suma $0{,}7+0{,}1+0{,}3=1{,}1$ y eso no es un problema, porque la normalización es por filas. La tercera palabra reparte su atención de forma más pareja, y su peso mayor, $0{,}4$, cae sobre sí misma.',
      lines: [
        'Los pesos de atención de un texto de tres palabras son las filas (0,7; 0,2; 0,1), (0,1; 0,8; 0,1) y (0,3; 0,3; 0,4)',
        'Cada fila suma 1, así que cada palabra reparte toda su atención entre las tres',
        'La primera columna suma 1,1, y no pasa nada, porque el softmax normaliza por filas y no por columnas',
        'La tercera palabra es la que reparte su atención de forma más pareja, y su peso mayor, 0,4, cae sobre sí misma',
      ],
      faultyLine: null,
    },
  ],
};
