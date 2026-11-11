import type { Project } from '../../content/schema';
import { py } from '../py';
import { svdWarmup } from './svd.calentamiento';
import { CARA_8X8, PESOS_4X6, PESOS_4X6_ROTULOS, capaLab, type Cloud } from './datos';

/** El error de la aproximación: cuánto de la tabla se queda fuera de las capas que se suman. */
const ERROR = (target: number) =>
  ({
    metric: 'error',
    op: 'lte',
    target,
    label: 'Error de la aproximación',
    format: 'percent',
  }) as const;

/** Los números que cuesta guardar las capas que se suman. */
const GUARDADOS = (target: number) =>
  ({
    metric: 'stored',
    op: 'lte',
    target,
    label: 'Números guardados',
    format: 'integer',
  }) as const;

/**
 * Pesos de una capa de 4×4 con valores singulares 4, 2, 1 y 1: las columnas de una matriz de Hadamard
 * (divididas entre 2, para que tengan longitud 1) multiplicadas por esos cuatro números.
 */
export const PESOS_4X4_HADAMARD: number[][] = [
  [2, 1, 0.5, 0.5],
  [2, -1, 0.5, -0.5],
  [2, 1, -0.5, -0.5],
  [2, -1, -0.5, 0.5],
];

/**
 * Unas rayas de 6×6 (la fila (0,5; 1; 1; 0,5; 0,5; 1) repetida con fuerza 0,3; 0,6; 0,9; 0,9; 0,6 y
 * 0,3: rango 1) con ruido de ±0,05 escrito a mano. Un σ grande y cinco pequeños.
 */
export const RAYAS_CON_RUIDO: number[][] = [
  [0.2, 0.3, 0.25, 0.1, 0.2, 0.35],
  [0.25, 0.65, 0.55, 0.35, 0.25, 0.6],
  [0.5, 0.85, 0.95, 0.4, 0.5, 0.9],
  [0.4, 0.95, 0.85, 0.5, 0.4, 0.85],
  [0.35, 0.55, 0.65, 0.25, 0.35, 0.6],
  [0.1, 0.35, 0.3, 0.2, 0.1, 0.25],
];

/**
 * Cuatro reseñas cortas, de dos en dos a la misma distancia del origen: «genial» y «horrible» miden
 * √2, «bueno» y «malo», la mitad. La capa de ex00.4 las alarga de forma muy distinta.
 */
export const RESENAS_CORTAS: Cloud = {
  points: [
    { id: 'genial', label: 'genial', x: 1, y: 1, group: 1 },
    { id: 'bueno', label: 'bueno', x: 0.5, y: 0.5, group: 1 },
    { id: 'horrible', label: 'horrible', x: 1, y: -1, group: 0 },
    { id: 'malo', label: 'malo', x: 0.5, y: -0.5, group: 0 },
  ],
  groups: ['negativa', 'positiva'],
  axes: ['intensidad', 'tono'],
};

/**
 * Primer proyecto de la Órbita 3 de matrices: la descomposición en valores singulares (SVD). Toda tabla
 * de números (una imagen, los pesos de una capa) es una suma de capas de rango 1 ordenadas de más a
 * menos importantes; quedarse con las primeras guarda mucho menos y pierde poco.
 */
export const svd: Project = {
  id: 'svd',
  name: 'SVD',
  sub: 'Capas de más a menos importantes',
  bigPicture: {
    parts: ['compress', 'linear'],
    text: 'Toda matriz se puede ver como un giro, un estirado y otro giro: es la SVD. Con ella se ve cuántas direcciones importan de verdad en una matriz de pesos y cuáles aportan poco. Aquí lo ves con transformaciones de dos dimensiones; la misma descomposición sirve para aproximar matrices grandes con pocas direcciones.',
  },
  warmup: svdWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'svd.ex00.1',
          type: 'laboratorio',
          purpose: {
            why: 'Cualquier tabla de números, una foto o los pesos de una capa, se puede escribir como una suma de capas sencillas ordenadas de la que más aporta a la que menos. Es la descomposición en valores singulares, la SVD.',
            aim: 'Vas a sumar capas de una cara de 8×8 píxeles hasta que se reconozca, sin guardar más números que la propia imagen.',
            takeaway:
              'Las primeras capas llevan casi toda la imagen: con 2 de las 4 la cara ya se reconoce. Cada capa cuesta una columna, una fila y un número, así que comprimir es quedarse con pocas.',
          },
          prompt:
            'Una imagen es una tabla de números: esta cara de 8×8 píxeles son 64. La SVD la parte en capas, cada una una columna por una fila, ordenadas de más a menos importantes. Con una sola capa la cara no se reconoce.\n\nSuma capas hasta que se reconozca, sin guardar más números que la imagen entera.',
          hints: [
            'Mira la aproximación junto a la original: con una capa solo queda un borrón. Cada capa suma detalle y cuesta una columna de 8 números, una fila de 8 y su σ.',
            'Sube el deslizador de una en una. Para en cuanto el error baje del límite, antes de que los números guardados pasen de los 64 de la imagen.',
          ],
          explain:
            'Una capa guarda 8 + 8 + 1 = 17 números, y $k$ capas, $17\\,k$. El error mide qué parte de la imagen se queda fuera de la suma: baja con cada capa, y mucho más con las primeras, porque la SVD las ordena por lo que aportan.',
          solution:
            'Valen 2 o 3 capas. Con 2 el error baja al 19 % y se guardan 34 números, poco más de la mitad de 64. Con 3, al 7,5 % con 51 números. Con 4 la cara sale exacta, pero cuesta 68 números, más que la imagen: la compresión solo compensa con pocas capas.',
          lab: {
            kind: 'compresion',
            rows: CARA_8X8,
            caption: 'Una cara de 8×8 píxeles',
            start: 1,
          },
          goals: [ERROR(0.25), GUARDADOS(64)],
          solved: { k: 2 },
        },
        {
          id: 'svd.ex00.2',
          type: 'laboratorio',
          purpose: {
            why: 'Las matrices de pesos de una red no siempre usan todo su tamaño: a menudo sus filas se parecen y la información real cabe en pocas capas. Detectarlo permite guardar la capa entera con menos números.',
            aim: 'Vas a buscar cuántas capas de la SVD reproducen sin pérdida una tabla de pesos con signo, gastando menos números que la tabla.',
            takeaway:
              'El rango de una tabla es cuántas capas tiene de verdad: a partir de ahí los σ valen 0 y sumar más capas solo gasta memoria. Una capa de rango bajo se guarda entera con pocos números.',
          },
          prompt:
            'Ahora no es una foto: son los pesos de una capa, con signo, de 6 rasgos de entrada a 4 palabras de salida. Los colores dicen el signo de cada peso. Son 24 números, pero llevan menos información de la que parece.\n\nReprodúcela sin perder nada y guardando menos números que la tabla entera.',
          hints: [
            'Mira la lista de σ del panel: cuenta cuántos no son cero. Cada uno es una capa que aporta algo.',
            'Sube el deslizador hasta que el error llegue a 0 y no lo pases: una capa más ya no quita error y cuesta 11 números.',
          ],
          explain:
            'La tabla es la suma de exactamente dos capas: tiene rango 2. Con dos capas el error es 0; las otras dos tienen σ = 0 y no añaden nada. Cada capa cuesta 4 + 6 + 1 = 11 números.',
          solution:
            'Con 2 capas el error es 0 y se guardan 2·11 = 22 números en vez de 24. Con 1 capa se pierde el 65 % de la tabla. Con 3 el error sigue en 0, pero se guardan 33: la tercera capa tiene $\\sigma_3=0$ y es un gasto sin nada dentro.',
          lab: {
            kind: 'compresion',
            rows: PESOS_4X6,
            signed: true,
            caption: 'Pesos de una capa',
            labels: { rows: PESOS_4X6_ROTULOS.rows },
            start: 1,
          },
          goals: [ERROR(0), GUARDADOS(22)],
          solved: { k: 2 },
        },
        {
          id: 'svd.ex00.3',
          type: 'laboratorio',
          purpose: {
            why: 'Al comprimir una matriz no se eligen capas al azar: la SVD las entrega ordenadas, y la primera suele llevar más que todas las demás juntas. Entender ese orden es entender por qué basta con quedarse con las primeras.',
            aim: 'Vas a encender a mano como mucho dos capas de la cara y a descubrir cuáles se llevan más imagen.',
            takeaway:
              'La primera capa es imprescindible: sin ella no se llega ni al 15 %. La parte conservada va con $\\sigma^{2}$, y como los σ están ordenados, las primeras capas son siempre la mejor elección.',
          },
          prompt:
            'La misma cara, pero ahora cada capa tiene su interruptor y puedes encender las que quieras, en cualquier orden. La «parte conservada» es cuánta imagen se llevan las capas encendidas.\n\nEnciende como mucho dos capas y conserva al menos el 90 % de la cara.',
          hints: [
            'Compara los σ del panel: el primero es más del triple que el segundo. Lo que lleva cada capa va con el cuadrado de su σ.',
            'Empieza por la capa 1 y prueba a acompañarla con otra. Prueba también a dejarla apagada y encender dos de las otras.',
          ],
          explain:
            'La parte conservada suma $\\sigma^{2}$ de las capas encendidas y la divide entre la suma de todos. Con $\\sigma_1\\approx 4{,}26$, la primera capa sola ya lleva el 88 %; las demás reparten el resto.',
          solution:
            'Valen la 1 con la 2 (96 %) o la 1 con la 3 (91 %). La 1 con la 4 se queda en el 89 %. Sin la primera no hay manera: la 2 y la 3 juntas conservan el 11 %. Por eso la SVD ordena las capas y comprimir es quedarse con las primeras.',
          lab: {
            kind: 'compresion',
            mode: 'pick',
            rows: CARA_8X8,
            caption: 'Una cara de 8×8 píxeles',
          },
          goals: [
            {
              metric: 'kept',
              op: 'gte',
              target: 0.9,
              label: 'Parte de la cara conservada',
              format: 'percent',
            },
            { metric: 'k', op: 'lte', target: 2, label: 'Capas encendidas', format: 'integer' },
          ],
          solved: { c1: 1, c2: 1 },
        },
        {
          id: 'svd.ex00.4',
          type: 'laboratorio',
          purpose: {
            why: 'El primer valor singular de una capa, $\\sigma_1$, es lo máximo que puede alargar una entrada. Acota cuánto puede crecer un cambio pequeño al cruzar la capa, y hay técnicas de entrenamiento que lo vigilan.',
            aim: 'Vas a buscar la dirección de entrada que una capa fija alarga más, mirando cómo deforma la circunferencia y cuatro reseñas.',
            takeaway:
              'La capa alarga más la dirección de «genial»: es $v_1$, y su alargamiento, $\\sigma_1\\approx 2{,}83$, es el techo. Sale hacia $u_1$, el eje largo de la elipse: la primera capa de la SVD es $\\sigma_1\\,u_1 v_1^{T}$.',
          },
          prompt:
            'Una capa fija no alarga igual en todas las direcciones: la circunferencia de radio 1 sale convertida en una elipse. «genial» y «horrible» empiezan a la misma distancia del origen; mira dónde acaba cada una.\n\nApunta la flecha $v$ a la dirección de entrada que la capa más alarga: más que ahí no se puede.',
          hints: [
            'Compara cada palabra con su imagen: «genial» acaba el doble de lejos que «horrible», aunque las dos salían igual de lejos.',
            'Apunta $v$ hacia «genial». No hacia el eje largo de la elipse: ese es adónde llega la salida, no de dónde sale la entrada.',
          ],
          explain:
            'Lo que la capa alarga una dirección es la longitud de $A\\,v$ entre la de $v$: no depende de lo larga que sea $v$, solo de adónde apunta. El máximo es el primer valor singular, $\\sigma_1$, y se alcanza en una sola recta de entrada.',
          solution:
            'La recta de $(1, 1)$, la de «genial»: $A\\,(1, 1)=(4, 0)$ y $4/\\sqrt{2}\\approx 2{,}83=\\sigma_1$. Vale cualquier $v$ en esa recta o muy cerca, como $(2;\\ 1{,}5)$. Apuntar al eje largo de la elipse, $(1, 0)$, da solo $\\sqrt{5}\\approx 2{,}24$: la elipse dice adónde llega la salida ($u_1$), y $v_1$ es otra dirección.',
          lab: capaLab(RESENAS_CORTAS, {
            range: 4.5,
            i: [2, -1],
            j: [2, 1],
            movable: 'none',
            circle: true,
            probe: { x: 0, y: 1, movable: true, on: 'input' },
            iterate: 1,
          }),
          goals: [
            {
              metric: 'stretch',
              op: 'gte',
              target: 2.73,
              label: 'Cuánto alarga la capa la dirección de v',
            },
          ],
          solved: { vx: 1, vy: 1 },
        },
        {
          id: 'svd.ex00.5',
          type: 'laboratorio',
          purpose: {
            why: 'Los datos reales y los pesos aprendidos traen ruido: pequeñas variaciones que no son patrón. El ruido se reparte en muchas capas con σ pequeños, y quitarlas limpia la señal en vez de estropearla.',
            aim: 'Vas a quitar capas a una tabla con ruido, empezando por todas, hasta guardarla con menos números que la tabla sin perder el patrón.',
            takeaway:
              'Una sola capa guarda el patrón con un error del 9 %, y ese 9 % es casi todo ruido: la capa 1 queda cinco veces más cerca de las rayas limpias que la tabla original. Tirar las capas pequeñas quita ruido.',
          },
          prompt:
            'Esta tabla de 6×6 es un patrón muy sencillo, unas rayas que se repiten más o menos fuertes, estropeado por ruido de medida. Mira los σ: uno grande y los demás muy pequeños. Ahora se suman las seis capas y se guardan más números que la tabla.\n\nQuita capas hasta guardar menos números que la tabla, sin que el error pase del límite.',
          hints: [
            'Compara la aproximación con la original mientras bajas el deslizador: hasta que llegues a la última capa, apenas cambia.',
            'Baja el deslizador de uno en uno y mira el error: sube muy poco hasta que te quedas sin la capa 1.',
          ],
          explain:
            'El patrón es una sola columna por una sola fila: es la capa 1. El ruido no tiene patrón, así que se reparte en las demás capas con σ pequeños. Quitarlas quita sobre todo ruido.',
          solution:
            'Valen 1 o 2 capas: el error es del 9 % o del 4 %, con 13 o 26 números frente a 36. Con 0 capas se pierde todo; con 3 se guardan 39. El 9 % que deja la capa 1 es casi todo ruido: su aproximación se aleja un 2 % de las rayas limpias, y la tabla original, un 9 %.',
          lab: {
            kind: 'compresion',
            rows: RAYAS_CON_RUIDO,
            caption: 'Unas rayas con ruido',
            start: 6,
          },
          goals: [ERROR(0.1), GUARDADOS(36)],
          solved: { k: 1 },
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'svd.ex01.1',
          type: 'numero',
          purpose: {
            why: 'Guardar una matriz como unas pocas capas de la SVD es una forma de comprimir pesos: en vez de la tabla entera se guardan unos vectores. Antes de decidirlo, un ingeniero cuenta cuánto ocupa cada opción.',
            aim: 'Vas a contar los números que cuesta guardar una tabla de pesos como suma de capas, a partir de sus filas, sus columnas y cuántas capas se guardan.',
            takeaway:
              'Con $k$ capas se guardan $k\\cdot(m+n+1)$ números en vez de $m\\cdot n$. La tabla de 4×6 apenas ahorra; la de 40×60 guarda un 8 %. El ahorro crece con el tamaño, porque $m+n$ crece mucho más despacio que $m\\cdot n$.',
          },
          prompt:
            'Para guardar una capa de la SVD hacen falta su columna, su fila y su σ. En el laboratorio, una tabla de pesos de 4×6 y rango 2: mira cuánto cuesta guardar 1 capa y 2.\n\nOtra tabla de pesos tiene 40 filas, 60 columnas y también rango 2. ¿Cuántos números hay que guardar para sus 2 capas?',
          hints: [
            'En el laboratorio, una capa de la tabla de 4×6 cuesta 11 números: 4 de la columna, 6 de la fila y 1 de σ.',
            'Haz la misma cuenta con 40 filas y 60 columnas, y multiplícala por las 2 capas.',
          ],
          explain:
            'Una capa de rango 1 es $\\sigma\\,u\\,v^{T}$: $u$ tiene un número por fila, $v$ uno por columna y σ es uno solo. Con $k$ capas, $k$ veces eso.',
          solution:
            'Cada capa guarda una columna de 40 números, una fila de 60 y su σ: $40+60+1=101$. Dos capas, $2\\cdot 101=202$, frente a los $40\\cdot 60=2400$ de la tabla: un 8 %. En la de 4×6 eran 22 frente a 24. Si olvidas los σ sale 200.',
          lab: {
            kind: 'compresion',
            rows: PESOS_4X6,
            signed: true,
            caption: 'Pesos de una capa',
            labels: { rows: PESOS_4X6_ROTULOS.rows },
            start: 1,
          },
          answer: 202,
          tol: 0,
        },
        {
          id: 'svd.ex01.2',
          type: 'numero',
          purpose: {
            why: 'Para elegir cuántas capas guardar se mira qué parte de la matriz conserva cada opción. Esa parte se mide con la suma de los $\\sigma^{2}$, igual que en PCA se mira la varianza explicada.',
            aim: 'Vas a calcular qué parte de una tabla de pesos se lleva quedarse con sus dos primeras capas, a partir de sus valores singulares.',
            takeaway:
              'Las dos primeras capas conservan el 90,9 %, y el error que queda es la raíz de lo que falta: $\\sqrt{2/22}\\approx 30\\,\\%$. Elevar al cuadrado hace que unos pocos σ grandes se lleven casi todo.',
          },
          prompt:
            'Lo que lleva cada capa se mide con el cuadrado de su σ: su «energía». Las capas de esta tabla de pesos tienen $\\sigma=4$, $2$, $1$ y $1$; las ves en el panel.\n\n¿Qué parte de la energía total conservan las dos primeras capas? Escríbela en tanto por ciento, con un decimal.',
          hints: [
            'Eleva cada σ al cuadrado y suma los cuatro: esa es la energía total.',
            'Divide la energía de las dos primeras capas entre el total y multiplica por 100.',
          ],
          explain:
            'La energía de una tabla es la suma de los cuadrados de todos sus números, y coincide con la suma de los $\\sigma^{2}$. Cada capa se lleva su $\\sigma^{2}$; la parte conservada es la de las capas que se guardan entre el total.',
          solution:
            'Energías: $16$, $4$, $1$ y $1$, en total $22$. Las dos primeras, $16+4=20$, y $20/22\\approx 90{,}9\\,\\%$. Si sumas los σ sin elevarlos sale $6/8=75\\,\\%$: la energía va con el cuadrado, por eso los σ grandes mandan tanto.',
          lab: {
            kind: 'compresion',
            rows: PESOS_4X4_HADAMARD,
            signed: true,
            caption: 'Pesos de una capa de 4×4',
            start: 1,
          },
          answer: 90.9,
          tol: 0.1,
        },
        {
          id: 'svd.ex01.3',
          type: 'numero',
          purpose: {
            why: 'Que una tabla grande tenga rango bajo dice que sus filas se repiten unas a otras: hay menos información de la que parece. Es lo que se busca al comprimir una capa, y se lee en sus valores singulares.',
            aim: 'Vas a leer el rango de una imagen en la lista de sus valores singulares y a comprobar que coincide con las capas que la reconstruyen sin error.',
            takeaway:
              'El rango es el número de σ distintos de cero, y coincide con las capas que hacen falta para no perder nada. Con datos reales los σ casi nunca son cero exacto: se cuentan los que no son despreciables frente a $\\sigma_1$.',
          },
          prompt:
            'El panel enseña los ocho valores singulares de la cara de 8×8 píxeles. El **rango** de una tabla es cuántos de ellos no son cero: cuántas capas tiene de verdad.\n\n¿Cuál es el rango de la cara? Después sube el deslizador y busca con cuántas capas el error llega a 0.',
          hints: [
            'Recorre la lista de σ de mayor a menor y para en el primero que vale 0.',
            'Fíjate en la cara: cada fila es simétrica, su mitad derecha repite la izquierda. ¿Cuántas columnas distintas le quedan?',
          ],
          explain:
            'Cada σ que no es cero es una capa que aporta algo. Si una tabla tiene columnas repetidas, esas columnas no añaden direcciones nuevas y el rango baja.',
          solution:
            'Rango 4: $\\sigma_1\\approx 4{,}26$, $\\sigma_2\\approx 1{,}28$, $\\sigma_3\\approx 0{,}79$ y $\\sigma_4\\approx 0{,}34$; los otros cuatro valen 0. Con 4 capas el error es 0. La cara es simétrica: la columna 8 repite la 1, la 7 la 2, y así, de modo que solo hay 4 columnas distintas.',
          lab: {
            kind: 'compresion',
            rows: CARA_8X8,
            caption: 'Una cara de 8×8 píxeles',
            start: 1,
          },
          answer: 4,
          tol: 0,
        },
        {
          id: 'svd.ex01.4',
          type: 'numero',
          purpose: {
            why: 'Las matrices de los modelos de lenguaje grandes tienen millones de números cada una. Aproximarlas con unas pocas capas de la SVD es una forma de ahorrar memoria, y la cuenta de cuánto se ahorra se hace antes de probarla.',
            aim: 'Vas a contar cuántos números cuesta guardar una matriz de atención de un modelo real con sus 64 primeras capas.',
            takeaway:
              'Con 64 capas la matriz ocupa un 3 % de lo que ocupaba. Si sus valores singulares caen deprisa, se pierde poco. La misma cuenta explica por qué LoRA entrena tan pocos números: aprende solo un cambio de rango bajo.',
          },
          prompt:
            'En Llama 2 7B, cada bloque de atención tiene matrices de $4096\\times 4096$. Una de ellas se aproxima con sus $k=64$ primeras capas de la SVD.\n\n¿Cuántos números hay que guardar?',
          hints: [
            'Una capa guarda una columna de 4096 números, una fila de 4096 y su σ.',
            'Multiplica lo que cuesta una capa por las 64 capas.',
          ],
          explain:
            'Con $k$ capas se guardan $k\\cdot(m+n+1)$ números. Lo que cuesta cada capa crece con la suma de filas y columnas, no con su producto: por eso en una matriz grande el ahorro es enorme.',
          solution:
            '$64\\cdot(4096+4096+1)=64\\cdot 8193=524\\,352$ números, frente a $4096\\cdot 4096=16\\,777\\,216$: alrededor del 3 %, unas 32 veces menos. Si olvidas los σ sale $524\\,288$.',
          answer: 524352,
          tol: 0,
        },
        {
          id: 'svd.ex01.5',
          type: 'numero',
          purpose: {
            why: 'Si una capa alarga demasiado algunas entradas, al encadenar capas el efecto se multiplica y el entrenamiento se desestabiliza. La normalización espectral, que se usa en las GAN, divide los pesos de cada capa entre su $\\sigma_1$ para ponerle techo.',
            aim: 'Vas a acotar la longitud de la salida de una capa conociendo solo sus valores singulares y la longitud de la entrada.',
            takeaway:
              'La salida mide como mucho $\\sigma_1\\cdot 3=18$, y solo llega ahí si $x$ apunta en la dirección $v_1$. Dividir $W$ entre $\\sigma_1=6$ deja el techo en 3: ninguna entrada sale más larga de lo que entró.',
          },
          prompt:
            'Una capa $W$ tiene valores singulares $6$, $2$ y $0{,}5$. Le llega una entrada $x$ de longitud $3$, y no sabes hacia dónde apunta.\n\n¿Cuál es la mayor longitud que puede tener la salida $W x$?',
          hints: [
            'Cada dirección de entrada sale alargada por un factor entre el menor y el mayor valor singular.',
            'El factor máximo es $\\sigma_1$. Multiplícalo por la longitud de $x$.',
          ],
          explain:
            'El mayor alargamiento posible es $\\sigma_1$, y la salida más larga se da cuando $x$ va en la dirección $v_1$. Las otras direcciones se alargan menos.',
          solution:
            '$|W x|\\le\\sigma_1\\,|x|=6\\cdot 3=18$, y se alcanza con $x$ en la dirección de $v_1$. La menor sería $0{,}5\\cdot 3=1{,}5$. Si te sale $6$, falta multiplicar por la longitud de $x$; si te sale $1{,}5$, has usado el menor valor singular.',
          answer: 18,
          tol: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'svd.ex02.1',
          type: 'codigo',
          prompt:
            '`A` es una matriz de $2\\times 2$. Su descomposición en valores singulares la parte en tres factores, y de ella salen la dirección que más estira, cuánto la estira y adónde la manda. Guarda en `sigma1` el mayor valor singular (un solo número); en `v1`, la dirección de entrada que lo da (un array de 2 números y norma 1); y en `u1`, la dirección de salida correspondiente (otro array de 2 números y norma 1).\n\nSe cumple $A\\,v_1=\\sigma_1\\,u_1$. El signo de `v1` es arbitrario, pero si cambia, el de `u1` cambia con él: las dos soluciones valen.',
          hints: [
            'El plan son cuatro líneas. Primero, `np.linalg.svd(A)` devuelve tres cosas que recoges a la vez en `U, S, Vt`. `sigma1` es el primer elemento de `S`, que viene de mayor a menor. `v1` es una **fila** de `Vt`, la primera, porque `Vt` es la traspuesta de $V$ y las direcciones de entrada van en filas. `u1` es una **columna** de `U`, la primera, porque las de salida van en columnas. Fila para `v1` y columna para `u1`: es el error más fácil de cometer.',
            'Las piezas, con otra matriz:\n\n' +
              py(
                'M = np.array([[0, 2], [1, 0]])',
                'P, T, Qt = np.linalg.svd(M)',
                'print(T)             # [2. 1.]: los valores singulares, de mayor a menor',
                'print(T[0])          # 2.0: el mayor, un solo número',
                'print(Qt[0])         # la primera FILA de Qt: una dirección de entrada, 2 números',
                'print(P[:, 0])       # la primera COLUMNA de P: una dirección de salida, 2 números',
                'print(Qt[:, 0])      # la primera columna de Qt: no es una dirección de entrada',
              ) +
              '\n\nLa primera fila de `Qt` y la primera columna de `P` van juntas con `T[0]`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'U, S, Vt = np.linalg.svd(A)',
                'sigma1 = S[___]',
                'v1 = Vt[___]',
                'u1 = U[:, ___]',
              ) +
              '\n\nEl error típico es escribir `Vt[:, 0]` o `U[0]`: la columna de `Vt` y la fila de `U` no son las direcciones.',
          ],
          explain:
            'Cada valor singular `S[k]` va con una fila de `Vt` (la dirección de entrada) y una columna de `U` (la de salida). Si te sale que $A\\,v_1$ no es $\\sigma_1\\,u_1$, revisa si has sacado una fila donde iba una columna o al revés: `Vt` guarda las direcciones de entrada en filas, `U` las de salida en columnas.',
          solution:
            'Los valores singulares de $A=\\begin{pmatrix}3&2\\\\0&2\\end{pmatrix}$ son $\\sigma_1\\approx 3{,}81$ y $\\sigma_2\\approx 1{,}57$. La dirección de entrada es $v_1\\approx\\pm(0{,}74;\\ 0{,}68)$ y la de salida, $u_1\\approx\\pm(0{,}93;\\ 0{,}36)$, con el mismo signo que $v_1$. Comprobación: $A\\,v_1\\approx(3{,}56;\\ 1{,}35)=\\sigma_1\\,u_1$. Errores típicos: `Vt[:, 0]`, que da $(0{,}74;\\ -0{,}68)$ en vez de la fila; `U[0]`, que da $(0{,}93;\\ -0{,}36)$; y `sigma1 = S`, que es el array entero.',
          requirements: [
            '`sigma1` es un solo número: el mayor valor singular de `A`.',
            '`v1` es un array de NumPy con 2 números y norma 1: la dirección de entrada del mayor valor singular. Se acepta cualquiera de sus dos signos.',
            '`u1` es un array de NumPy con 2 números y norma 1: la dirección de salida correspondiente, de forma que $A\\,v_1=\\sigma_1\\,u_1$ con el signo de `v1`. Se acepta una diferencia diminuta de redondeo.',
          ],
          starter: `import numpy as np

A = np.array([[3, 2], [0, 2]])
# A: un array de NumPy de 2 filas y 2 columnas.

# PASO 1. sigma1: el mayor valor singular de A.
# Por qué: es lo máximo que A puede alargar una flecha. Es la longitud del semieje largo
# de la elipse en que A convierte la circunferencia unidad.
# np.linalg.svd(A) devuelve TRES cosas a la vez, y se recogen así: U, S, Vt = np.linalg.svd(A)
#   U: una matriz cuyas COLUMNAS son las direcciones de salida.
#   S: un array con los valores singulares, de mayor a menor.
#   Vt: una matriz cuyas FILAS son las direcciones de entrada.
# Escribe esa línea antes de sigma1. Un elemento de un array se saca con S[0] (el primero).
# Resultado esperado: un solo número.
sigma1 = None

# PASO 2. v1: la dirección de entrada que A estira más.
# Por qué: es la flecha que, al entrar en A, sale con la longitud sigma1.
# Vt guarda las direcciones de entrada en sus FILAS. Vt[0] saca la fila 0 entera.
# Resultado esperado: un array con 2 números y norma 1.
v1 = None

# PASO 3. u1: la dirección de salida de ese estiramiento.
# Por qué: A manda v1 a sigma1 por u1; u1 dice hacia dónde apunta esa flecha estirada.
# U guarda las direcciones de salida en sus COLUMNAS. U[:, 0] saca la columna 0 entera.
# Resultado esperado: un array con 2 números y norma 1.
u1 = None

# Para ver qué vale algo antes de entregar: print(A @ v1) y print(sigma1 * u1) deben coincidir.
`,
          checks: `_A = np.array([[3, 2], [0, 2]], dtype=float)
_U, _S, _Vt = np.linalg.svd(_A)
def _vec(a):
    return isinstance(a, np.ndarray) and a.shape == (2,) and (np.issubdtype(a.dtype, np.floating) or np.issubdtype(a.dtype, np.integer))
_s = isinstance(sigma1, (int, float, np.integer, np.floating)) and not isinstance(sigma1, (bool, np.bool_))
_sok = _s and abs(float(sigma1) - float(_S[0])) < 1e-6
check(_s, "\`sigma1\` tiene que ser un solo número: el mayor valor singular de \`A\`, no el array \`S\` entero.")
check((not _s) or _sok, "\`sigma1\` no es el mayor valor singular de \`A\`. \`S\` los trae de mayor a menor: el mayor es el primero.")
_v = _vec(v1)
_vn = _v and abs(float(np.linalg.norm(v1)) - 1) < 1e-6
_vok = _vn and abs(float(v1 @ _Vt[0])) > 0.999999
_vcol = _vn and not _vok and abs(float(v1 @ _Vt[:, 0])) > 0.999999
check(_v, "\`v1\` tiene que ser un array de NumPy con 2 números: la dirección de entrada.")
check((not _v) or _vn, "\`v1\` tiene que medir 1, como las filas de \`Vt\`.")
check((not _vcol), "\`v1\` es la primera columna de \`Vt\`. Las direcciones de entrada van en las filas de \`Vt\`, no en las columnas: la primera es \`Vt[0]\`.")
check((not _vn) or _vok or _vcol, "\`v1\` no es la dirección de entrada del mayor valor singular. Es la primera fila de \`Vt\`.")
_u = _vec(u1)
_gate = _sok and _vok
_un = _u and abs(float(np.linalg.norm(u1)) - 1) < 1e-6
_uok = _un and _gate and bool(np.allclose(_A @ v1, sigma1 * u1, atol=1e-6))
_urow = _un and (not _uok) and abs(float(u1 @ _U[0])) > 0.999999 and abs(float(u1 @ _U[:, 0])) < 0.999999
check(_u, "\`u1\` tiene que ser un array de NumPy con 2 números: la dirección de salida.")
check((not _u) or _un, "\`u1\` tiene que medir 1, como las columnas de \`U\`.")
check((not _urow) or (not _gate), "\`u1\` es la primera fila de \`U\`. Las direcciones de salida van en las columnas de \`U\`: la primera es \`U[:, 0]\`.")
check((not _un) or (not _gate) or _uok or _urow, "\`u1\` no cumple que \`A @ v1\` sea \`sigma1 * u1\`. Tiene que ser la primera columna de \`U\`, con el signo que acompaña al de \`v1\`.")
`,
          reference: `import numpy as np

A = np.array([[3, 2], [0, 2]])
# Guarda en sigma1 el mayor valor singular de A, en v1 su dirección de entrada y en u1 la de salida
U, S, Vt = np.linalg.svd(A)
sigma1 = S[0]
v1 = Vt[0]
u1 = U[:, 0]
`,
        },
        {
          id: 'svd.ex02.2',
          type: 'codigo',
          prompt:
            '`A` es una capa que lleva vectores de 2 números a vectores de 3 números: una matriz de 3 filas y 2 columnas. Guarda en `U`, `S` y `Vt` su descomposición **reducida** (`U` de 3 filas y 2 columnas, `S` con 2 números y `Vt` de 2 filas y 2 columnas); en `A_rec`, la matriz que sale de volver a multiplicar los tres factores; y en `reconstruye`, si `A_rec` coincide con `A` (un `True` o un `False`, comparados con `np.allclose`).',
          hints: [
            'El plan son tres líneas. `np.linalg.svd(A, full_matrices=False)` da la versión reducida, la que encaja para multiplicar. `S` es un array de una dimensión y no se puede multiplicar tal cual: hay que convertirlo en una matriz con los valores en la diagonal, con `np.diag(S)`. El producto en este orden es `U`, la diagonal y `Vt`. Y el parecido con `A` se mide con `np.allclose`, no con `==`, porque el redondeo deja diferencias diminutas.',
            'Las piezas, con otra matriz:\n\n' +
              py(
                'M = np.array([[1, 0], [0, 2], [3, 0]])',
                'P, T, Qt = np.linalg.svd(M, full_matrices=False)',
                'print(P.shape, T.shape, Qt.shape)   # (3, 2) (2,) (2, 2)',
                'D = np.diag(T)',
                'print(D.shape)                      # (2, 2): T puesta en la diagonal',
                'R = P @ D @ Qt',
                'print(R.shape)                      # (3, 2): la forma de M',
                'print(np.allclose(M, R))            # True: coinciden salvo el redondeo',
              ) +
              '\n\nSin `full_matrices=False`, `P` sería de 3 por 3 y el producto no encajaría.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'U, S, Vt = np.linalg.svd(A, full_matrices=___)',
                'A_rec = U @ np.___(S) @ Vt',
                'reconstruye = np.___(A, A_rec)',
              ) +
              '\n\nEl error típico es olvidar `S` y escribir `U @ Vt`: sale de la forma correcta, pero no es `A`.',
          ],
          explain:
            'Una capa de 2 a 3 dimensiones tiene una `U` de 3 por 2: con `full_matrices=False` solo salen las columnas que corresponden a un valor singular. `S` va entre medias, como matriz diagonal. Que la reconstrucción coincida con `A` es la prueba de que los tres factores contienen toda la información de la matriz.',
          solution:
            '$A=\\begin{pmatrix}1&0\\\\2&1\\\\0&3\\end{pmatrix}$ tiene valores singulares $3{,}27$ y $2{,}07$. Con `full_matrices=False`, `U` es de $3\\times 2$, `S` tiene 2 números y `Vt` es de $2\\times 2$; `np.diag(S)` es de $2\\times 2$ y `U @ np.diag(S) @ Vt` vuelve a ser de $3\\times 2$ y coincide con `A`. Errores típicos: no pedir la versión reducida, con lo que `U` sale de $3\\times 3$; y `U @ Vt`, que olvida `S` y no es `A`.',
          requirements: [
            '`U` es un array de NumPy de 3 filas y 2 columnas, `S` tiene 2 números y `Vt` es de 2 filas y 2 columnas: la descomposición reducida de `A`.',
            '`A_rec` es un array de 3 filas y 2 columnas: el producto de `U`, la matriz diagonal de `S` y `Vt`, que coincide con `A` salvo un redondeo diminuto.',
            '`reconstruye` es un solo `True` o `False`: el resultado de `np.allclose` entre `A` y `A_rec`.',
          ],
          starter: `import numpy as np

A = np.array([[1, 0], [2, 1], [0, 3]])
# A: un array de NumPy de 3 filas y 2 columnas (una capa que pasa de 2 a 3 números).

# PASO 1. U, S y Vt: la descomposición REDUCIDA de A.
# Por qué: con una matriz que no es cuadrada, np.linalg.svd(A) devuelve por defecto una U
# de 3 por 3 que lleva una columna de más, y no encaja al multiplicar. La versión reducida
# se pide con el argumento full_matrices=False.
# Se recogen las tres cosas a la vez: U, S, Vt = np.linalg.svd(A, full_matrices=False)
# Escribe esa línea y deja U, S y Vt con sus valores.
# Resultado esperado: U de 3 filas y 2 columnas, S con 2 números, Vt de 2 filas y 2 columnas.
U = None
S = None
Vt = None

# PASO 2. A_rec: la matriz reconstruida con los tres factores.
# Por qué: si multiplicar U, Sigma y Vt devuelve A, no se ha perdido nada.
# S es un array de una dimensión, y para multiplicar hace falta una matriz: np.diag(S)
# la pone en la diagonal de una matriz de 2 por 2. Por ejemplo, np.diag([5, 7]) es
# [[5, 0], [0, 7]]. El producto de matrices se escribe con @.
# Resultado esperado: un array de 3 filas y 2 columnas.
A_rec = None

# PASO 3. reconstruye: si A_rec coincide con A.
# Por qué: con decimales, un == falla por el redondeo. np.allclose(a, b) dice si dos
# arrays son iguales salvo una diferencia diminuta, y devuelve un solo True o False.
# Resultado esperado: True o False.
reconstruye = None

# Para ver qué vale algo antes de entregar: print(A_rec) y pulsa «Ejecutar».
`,
          checks: `_A = np.array([[1, 0], [2, 1], [0, 3]], dtype=float)
_U0, _S0, _Vt0 = np.linalg.svd(_A, full_matrices=False)
def _arr(a, s):
    return isinstance(a, np.ndarray) and a.shape == s and (np.issubdtype(a.dtype, np.floating) or np.issubdtype(a.dtype, np.integer))
_full = isinstance(U, np.ndarray) and U.shape == (3, 3)
_ua = _arr(U, (3, 2))
_sa = _arr(S, (2,))
_va = _arr(Vt, (2, 2))
check(_ua or not _full, "\`U\` sale de 3 filas y 3 columnas: es la descomposición completa, con una columna que sobra. Pide la reducida con \`full_matrices=False\`.")
check(_ua or _full, "\`U\` tiene que ser un array de NumPy de 3 filas y 2 columnas: la \`U\` de la descomposición reducida de \`A\`.")
check(_sa, "\`S\` tiene que ser un array de NumPy con 2 números: los valores singulares de \`A\`.")
check(_va, "\`Vt\` tiene que ser un array de NumPy de 2 filas y 2 columnas: la \`Vt\` de la descomposición reducida de \`A\`.")
_ok = _ua and _sa and _va and bool(np.allclose(S, _S0))
_r = _arr(A_rec, (3, 2))
_rok = _r and bool(np.allclose(A_rec, _A))
check(_r, "\`A_rec\` tiene que ser un array de NumPy de 3 filas y 2 columnas: la reconstrucción de \`A\`.")
check((not _r) or (not _ok) or _rok or not np.allclose(A_rec, _U0 @ _Vt0), "\`A_rec\` es \`U @ Vt\`, sin \`S\`: no recupera \`A\`. Falta multiplicar por la matriz diagonal de \`S\` entre \`U\` y \`Vt\`.")
check((not _r) or (not _ok) or _rok or np.allclose(A_rec, _U0 @ _Vt0), "\`A_rec\` no coincide con \`A\`: tiene que ser \`U\` por la matriz diagonal de \`S\` por \`Vt\`, en ese orden.")
_b = isinstance(reconstruye, (bool, np.bool_))
check(_b, "\`reconstruye\` tiene que ser un solo \`True\` o \`False\`: el resultado de \`np.allclose\`.")
check((not _b) or (not _rok) or bool(reconstruye), "\`reconstruye\` vale \`False\`, pero \`A_rec\` coincide con \`A\`. Compáralas con \`np.allclose(A, A_rec)\`.")
`,
          reference: `import numpy as np

A = np.array([[1, 0], [2, 1], [0, 3]])
# Guarda en U, S y Vt la descomposición reducida de A, en A_rec la reconstrucción y en reconstruye si coincide con A
U, S, Vt = np.linalg.svd(A, full_matrices=False)
A_rec = U @ np.diag(S) @ Vt
reconstruye = np.allclose(A, A_rec)
`,
        },
        {
          id: 'svd.ex02.3',
          type: 'codigo',
          prompt:
            '`A` es una matriz de 3 filas y 2 columnas. Los valores singulares se pueden calcular de dos formas, y las dos tienen que dar lo mismo. Guarda en `S` los valores singulares que da `np.linalg.svd` (sin `U` ni `Vt`); en `vals`, los autovalores de $A^{T}A$ de mayor a menor; en `sigma_eig`, las raíces cuadradas de esos autovalores; y en `coinciden`, si `S` y `sigma_eig` son iguales (un `True` o un `False`, comparados con `np.allclose`).',
          hints: [
            'El plan son cuatro líneas. `S`: `np.linalg.svd(A, compute_uv=False)` devuelve solo los valores singulares, sin las matrices. `vals`: la matriz es `A.T @ A`, simétrica y de 2 por 2, y `np.linalg.eigvalsh` da sus autovalores **de menor a mayor**, así que hay que darles la vuelta con `[::-1]`. `sigma_eig`: los valores singulares son las **raíces** de esos autovalores, con `np.sqrt`. Por último, `np.allclose` compara los dos arrays.',
            'Las piezas, con otra matriz:\n\n' +
              py(
                'M = np.array([[1, 0], [0, 2], [0, 0]])',
                'print(np.linalg.svd(M, compute_uv=False))   # [2. 1.]: solo los valores singulares',
                'G = M.T @ M',
                'print(G.shape)                              # (2, 2): de columnas por columnas',
                'w = np.linalg.eigvalsh(G)',
                'print(w)                                    # [1. 4.]: de menor a mayor',
                'print(w[::-1])                              # [4. 1.]: de mayor a menor',
                'print(np.sqrt(w[::-1]))                     # [2. 1.]: la raíz de cada uno',
              ) +
              '\n\nLas raíces de los autovalores de $M^{T}M$ coinciden con los valores singulares.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'S = np.linalg.svd(A, compute_uv=___)',
                'vals = np.linalg.eigvalsh(A.___ @ A)[___]',
                'sigma_eig = np.___(vals)',
                'coinciden = np.allclose(S, sigma_eig)',
              ) +
              '\n\nLos errores típicos son no dar la vuelta a los vals, olvidar la raíz y usar `A @ A.T`, que es de 3 por 3 y trae un autovalor de más.',
          ],
          explain:
            'Los valores singulares de $A$ son las raíces cuadradas de los autovalores de $A^{T}A$, que es simétrica. Por eso `eigvalsh` sirve aquí, y por eso el orden importa: `eigvalsh` va de menor a mayor y `svd`, de mayor a menor. Con $AA^{T}$ también salen los mismos valores distintos de cero, pero al ser de 3 por 3 trae un autovalor 0 más.',
          solution:
            'Con $A=\\begin{pmatrix}2&1\\\\0&2\\\\1&0\\end{pmatrix}$, $A^{T}A=\\begin{pmatrix}5&2\\\\2&5\\end{pmatrix}$ tiene autovalores $7$ y $3$, de mayor a menor, y `sigma_eig` vale $(\\sqrt{7};\\ \\sqrt{3})\\approx(2{,}65;\\ 1{,}73)$, que es también `S`. Errores típicos: dejar los autovalores de menor a mayor, con lo que no coinciden con `S`; olvidar la raíz, con lo que salen $7$ y $3$; y usar `A @ A.T`, de $3\\times 3$, con un tercer autovalor 0.',
          requirements: [
            '`S` es un array de NumPy con 2 números: los valores singulares de `A`, de mayor a menor.',
            '`vals` es un array con 2 números: los autovalores de $A^{T}A$, de mayor a menor.',
            '`sigma_eig` es un array con 2 números: la raíz cuadrada de cada autovalor, en el mismo orden.',
            '`coinciden` es un solo `True` o `False`: el resultado de comparar `S` y `sigma_eig` con `np.allclose`.',
          ],
          starter: `import numpy as np

A = np.array([[2, 1], [0, 2], [1, 0]])
# A: un array de NumPy de 3 filas y 2 columnas.

# PASO 1. S: los valores singulares de A, calculados por la vía directa.
# Por qué: es el resultado de referencia con el que se compara el otro camino.
# np.linalg.svd(A, compute_uv=False) devuelve SOLO los valores singulares, de mayor a menor,
# sin las matrices U y Vt.
# Resultado esperado: un array con 2 números.
S = None

# PASO 2. vals: los autovalores de A.T @ A, de mayor a menor.
# Por qué: los valores singulares salen de A.T @ A, una matriz cuadrada y simétrica.
# A.T es la traspuesta de A. np.linalg.eigvalsh(G) da los autovalores de una matriz simétrica G,
# de MENOR a MAYOR. x[::-1] da la vuelta a un array: np.array([1, 2, 3])[::-1] es [3, 2, 1].
# Resultado esperado: un array con 2 números, de mayor a menor.
vals = None

# PASO 3. sigma_eig: las raíces cuadradas de esos autovalores.
# Por qué: los autovalores de A.T @ A son los cuadrados de los valores singulares.
# np.sqrt(x) saca la raíz cuadrada de cada número de un array.
# Resultado esperado: un array con 2 números.
sigma_eig = None

# PASO 4. coinciden: si S y sigma_eig son lo mismo.
# Por qué: con decimales, un == falla por el redondeo. np.allclose(a, b) dice si dos
# arrays son iguales salvo una diferencia diminuta, y devuelve un solo True o False.
# Resultado esperado: True o False.
coinciden = None

# Para ver qué vale algo antes de entregar: print(S, sigma_eig) y pulsa «Ejecutar».
`,
          checks: `_A = np.array([[2, 1], [0, 2], [1, 0]], dtype=float)
_S = np.linalg.svd(_A, compute_uv=False)
_w = np.linalg.eigvalsh(_A.T @ _A)[::-1]
def _arr(a, n):
    return isinstance(a, np.ndarray) and a.shape == (n,) and (np.issubdtype(a.dtype, np.floating) or np.issubdtype(a.dtype, np.integer))
_a = _arr(S, 2)
_aok = _a and bool(np.allclose(S, _S))
check(_a, "\`S\` tiene que ser un array de NumPy con 2 números: los valores singulares de \`A\`.")
check((not _a) or _aok, "\`S\` no son los valores singulares de \`A\`. Usa \`np.linalg.svd(A, compute_uv=False)\`.")
_b3 = isinstance(vals, np.ndarray) and vals.shape == (3,)
_b = _arr(vals, 2)
_bok = _b and bool(np.allclose(vals, _w))
check(_b or not _b3, "\`vals\` trae 3 números: se ha usado \`A @ A.T\`, de 3 por 3. Tiene que ser \`A.T @ A\`, de 2 por 2, con un autovalor por columna de \`A\`.")
check(_b or _b3, "\`vals\` tiene que ser un array de NumPy con 2 números: los autovalores de \`A.T @ A\`.")
check((not _b) or _bok or not np.allclose(vals, _w[::-1]), "\`vals\` está de menor a mayor, el orden de \`eigvalsh\`. Tienen que ir de mayor a menor: dale la vuelta con \`[::-1]\`.")
check((not _b) or _bok or np.allclose(vals, _w[::-1]) or not np.allclose(vals, _S), "\`vals\` ya son los valores singulares. Los autovalores de \`A.T @ A\` son sus cuadrados; la raíz va en el paso siguiente.")
check((not _b) or _bok or np.allclose(vals, _w[::-1]) or np.allclose(vals, _S), "\`vals\` tiene que ser los dos autovalores de \`A.T @ A\`, de mayor a menor.")
_c = _arr(sigma_eig, 2)
_cok = _c and bool(np.allclose(sigma_eig, _S))
check(_c, "\`sigma_eig\` tiene que ser un array de NumPy con 2 números: la raíz de cada autovalor.")
check((not _c) or (not _bok) or _cok or not np.allclose(sigma_eig, _w), "\`sigma_eig\` son los autovalores sin más: falta la raíz cuadrada. Los autovalores son los cuadrados de los valores singulares.")
check((not _c) or (not _bok) or _cok or np.allclose(sigma_eig, _w), "\`sigma_eig\` tiene que ser la raíz cuadrada de cada autovalor, en el mismo orden.")
_d = isinstance(coinciden, (bool, np.bool_))
check(_d, "\`coinciden\` tiene que ser un solo \`True\` o \`False\`: el resultado de \`np.allclose\`.")
check((not _d) or (not _aok) or (not _cok) or bool(coinciden), "\`coinciden\` vale \`False\`, pero \`S\` y \`sigma_eig\` son iguales salvo el redondeo. Compáralas con \`np.allclose(S, sigma_eig)\`.")
`,
          reference: `import numpy as np

A = np.array([[2, 1], [0, 2], [1, 0]])
# Guarda en S los valores singulares, en vals los de A.T @ A de mayor a menor, en sigma_eig sus raíces y en coinciden si S y sigma_eig son iguales
S = np.linalg.svd(A, compute_uv=False)
vals = np.linalg.eigvalsh(A.T @ A)[::-1]
sigma_eig = np.sqrt(vals)
coinciden = np.allclose(S, sigma_eig)
`,
        },
        {
          id: 'svd.ex02.4',
          type: 'codigo',
          prompt:
            'Las tres columnas de `A` parecen independientes, pero la tercera es la suma de las otras dos más un ruido diminuto de medida. Guarda en `S` los valores singulares de `A`; en `umbral`, un número que separe los valores singulares reales del ruido (mayor que el valor singular del ruido y menor que el menor de los reales); y en `rango`, como entero, el **rango numérico**: cuántos valores singulares superan ese umbral.',
          hints: [
            'El plan son tres líneas. `S`: los valores singulares, sin las matrices, con `compute_uv=False`. Míralos con `print(S)`: dos son grandes y uno es diminuto. Ese diminuto es ruido, no una dirección de verdad. `umbral` es un número entre los dos grupos; un valor pequeño y fijo como `1e-6` sirve, y se escribe así en Python. `rango`: cuántos de `S` están por encima del umbral; la comparación `S > umbral` da `True` o `False` por elemento y `np.sum` los cuenta.',
            'Las piezas, con otros valores:\n\n' +
              py(
                'T = np.array([5.0, 0.8, 3e-12])',
                'print(T > 1e-6)              # [ True  True False]: uno por elemento',
                'print(np.sum(T > 1e-6))      # 2: los True cuentan como 1',
                'print(np.sum(T > 0))         # 3: con umbral 0 el ruido también cuenta',
                'print(int(np.sum(T > 1e-6))) # 2, como entero normal de Python',
              ) +
              '\n\nEl ruido es positivo y por eso `S > 0` lo cuenta: el umbral tiene que estar por encima.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'S = np.linalg.svd(A, compute_uv=___)',
                'umbral = ___',
                'rango = int(np.sum(S ___ umbral))',
              ) +
              '\n\nLos errores típicos son `len(S)` y `np.sum(S > 0)`: los dos dan 3, porque el ruido cuenta.',
          ],
          explain:
            'En un ordenador, un valor singular que debería ser 0 sale como un número diminuto, y contarlo da un rango de más. El rango numérico cuenta solo los valores singulares por encima de un umbral. Esta es la idea de fondo de `np.linalg.matrix_rank`, que fija el umbral por su cuenta a partir del tamaño de la matriz y del mayor valor singular.',
          solution:
            'Los valores singulares son aproximadamente $5{,}93$, $2{,}21$ y $2{,}3\\cdot 10^{-10}$. El tercero es ruido, así que el rango numérico es 2: la tercera columna no aporta una dirección nueva. Un umbral como `1e-6` los separa. Errores típicos: `len(S)` y `np.sum(S > 0)`, que dan 3, porque el ruido es positivo; y un umbral demasiado grande, como 3, que dejaría solo uno.',
          requirements: [
            '`S` es un array de NumPy con 3 números: los valores singulares de `A`, de mayor a menor.',
            '`umbral` es un número mayor que el valor singular del ruido y menor que el menor de los valores singulares reales.',
            '`rango` es un número entero: cuántos valores singulares de `S` superan `umbral`.',
          ],
          starter: `import numpy as np

A = np.array([[1.0, 0.0, 1.0], [2.0, 1.0, 3.0], [0.0, 3.0, 3.0], [1.0, 1.0, 2.0]])
A[:, 2] = A[:, 0] + A[:, 1] + np.array([2e-10, -3e-10, 1e-10, 2e-10])
# A: 4 filas y 3 columnas. La tercera columna es la suma de las otras dos, más un ruido diminuto.

# PASO 1. S: los valores singulares de A.
# Por qué: cuántas direcciones aporta de verdad la matriz se lee en ellos.
# np.linalg.svd(A, compute_uv=False) devuelve SOLO los valores singulares, de mayor a menor.
# Míralos con print(S): los números pequeños, como 3e-12, son 0.000000000003.
# Resultado esperado: un array con 3 números.
S = None

# PASO 2. umbral: un número que separa los valores singulares reales del ruido.
# Por qué: el ruido no es exactamente 0, y hace falta decidir a partir de dónde un valor
# singular deja de contar. Tiene que quedar entre el ruido y el menor valor singular real.
# En Python, 1e-6 es 0.000001.
# Resultado esperado: un número.
umbral = None

# PASO 3. rango: cuántos valores singulares superan el umbral.
# Por qué: es el rango numérico, el número de direcciones independientes de verdad.
# Una comparación como S > umbral da un True o False por elemento; np.sum cuenta los True
# (cada uno vale 1). int(...) lo convierte en un entero normal de Python.
# Resultado esperado: un número entero.
rango = None

# Para ver qué vale algo antes de entregar: print(S) y pulsa «Ejecutar».
`,
          checks: `_A = np.array([[1.0, 0.0, 1.0], [2.0, 1.0, 3.0], [0.0, 3.0, 3.0], [1.0, 1.0, 2.0]])
_A[:, 2] = _A[:, 0] + _A[:, 1] + np.array([2e-10, -3e-10, 1e-10, 2e-10])
_S = np.linalg.svd(_A, compute_uv=False)
_a = isinstance(S, np.ndarray) and S.shape == (3,) and np.issubdtype(S.dtype, np.floating)
_aok = _a and bool(np.allclose(S, _S))
check(_a, "\`S\` tiene que ser un array de NumPy con 3 números: los valores singulares de \`A\`.")
check((not _a) or _aok, "\`S\` no son los valores singulares de \`A\`. Usa \`np.linalg.svd(A, compute_uv=False)\`.")
_u = isinstance(umbral, (int, float, np.integer, np.floating)) and not isinstance(umbral, (bool, np.bool_))
check(_u, "\`umbral\` tiene que ser un solo número: el valor a partir del cual un valor singular cuenta.")
check((not _u) or float(umbral) > float(_S[2]), "\`umbral\` es menor que el valor singular del ruido (el menor de \`S\`): el ruido también pasaría. Tiene que quedar por encima de él.")
check((not _u) or float(umbral) <= float(_S[2]) or float(umbral) < float(_S[1]), "\`umbral\` es mayor que un valor singular real: dejaría fuera una dirección de verdad. Tiene que quedar por debajo del menor de los reales.")
_r = isinstance(rango, (int, np.integer)) and not isinstance(rango, (bool, np.bool_))
check(_r, "\`rango\` tiene que ser un número entero: cuántos valores singulares superan ese valor.")
check((not _r) or rango != 3, "\`rango\` vale 3: cuenta el ruido como si fuera un valor singular. Cuenta solo los que superan ese valor, no todos ni los mayores que 0.")
check((not _r) or rango == 3 or rango == 2, "\`rango\` tiene que ser cuántos valores singulares superan ese valor: dos de ellos son reales y uno es ruido.")
`,
          reference: `import numpy as np

A = np.array([[1.0, 0.0, 1.0], [2.0, 1.0, 3.0], [0.0, 3.0, 3.0], [1.0, 1.0, 2.0]])
A[:, 2] = A[:, 0] + A[:, 1] + np.array([2e-10, -3e-10, 1e-10, 2e-10])
# Guarda en S los valores singulares, en umbral un número que separe el ruido de los reales y en rango cuántos superan el umbral
S = np.linalg.svd(A, compute_uv=False)
umbral = 1e-6
rango = int(np.sum(S > umbral))
`,
        },
        {
          id: 'svd.ex02.5',
          type: 'codigo',
          prompt:
            '`W` es la matriz de pesos de una capa y `x` es una entrada de norma 1. La **normalización espectral** divide los pesos entre su mayor valor singular, para que la capa nunca pueda alargar una entrada. Guarda en `sigma_max` el mayor valor singular de `W`; en `W_sn`, la matriz `W` dividida entre `sigma_max`; en `sigma_despues`, el mayor valor singular de `W_sn`; y en `norma_y`, la norma de la salida de la capa normalizada para la entrada `x`, es decir, `W_sn @ x`.',
          hints: [
            'El plan son cuatro líneas. `sigma_max` es el primer valor singular de `W`, el mayor, y se saca con `np.linalg.svd(W, compute_uv=False)`. `W_sn` es `W` dividida entre ese número: NumPy divide toda la matriz de golpe. `sigma_despues` es el mismo cálculo sobre `W_sn`, y tiene que salir 1. `norma_y` es la longitud de `W_sn @ x`, que se mide con `np.linalg.norm`: no puede pasar de 1.',
            'Las piezas, con otra matriz:\n\n' +
              py(
                'M = np.array([[4.0, 0.0], [0.0, 1.0]])',
                'sv = np.linalg.svd(M, compute_uv=False)',
                'print(sv)                       # [4. 1.]: de mayor a menor',
                'N = M / sv[0]',
                'print(N)                        # [[1.   0.  ] [0.   0.25]]: todo dividido entre 4',
                'print(np.linalg.svd(N, compute_uv=False)[0])   # 1.0',
                'print(np.linalg.norm(N @ np.array([0.0, 1.0])))  # 0.25: la longitud de la salida',
              ) +
              '\n\nDespués de dividir, el mayor valor singular vale exactamente 1.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'sigma_max = np.linalg.svd(W, compute_uv=False)[___]',
                'W_sn = W ___ sigma_max',
                'sigma_despues = np.linalg.svd(___, compute_uv=False)[0]',
                'norma_y = np.linalg.___(W_sn @ x)',
              ) +
              '\n\nEl error típico es dividir entre otra cosa, como la suma de los valores singulares: entonces el mayor ya no vale 1.',
          ],
          explain:
            'El mayor valor singular de una matriz es lo máximo que alarga una entrada. Al dividir los pesos entre él, el nuevo mayor valor singular es 1, y la capa ya no puede alargar ninguna entrada. La normalización espectral usa esta idea para mantener estable el entrenamiento de las redes que la llevan.',
          solution:
            'Para $W=\\begin{pmatrix}3&1&0\\\\1&2&-1\\\\0&2&2\\end{pmatrix}$, los valores singulares son $3{,}82$, $2{,}62$ y $1{,}60$. Así `sigma_max` es $3{,}82$ y `W_sn` es `W` dividida entre ese número. El mayor valor singular de `W_sn` pasa a ser $1$. Para $x=(0{,}6;\\ 0;\\ 0{,}8)$, la capa original da una salida de norma $2{,}42$, más larga que la entrada, y la normalizada da $0{,}63$, que no supera 1. Errores típicos: dividir entre la norma de toda la matriz o entre la suma de los valores singulares, con lo que `sigma_despues` no vale 1.',
          requirements: [
            '`sigma_max` es un solo número: el mayor valor singular de `W`.',
            '`W_sn` es un array de NumPy de 3 filas y 3 columnas: `W` dividida entre `sigma_max`.',
            '`sigma_despues` es un solo número: el mayor valor singular de `W_sn`, calculado igual que `sigma_max`.',
            '`norma_y` es un solo número: la norma de `W_sn @ x`. Se acepta una diferencia diminuta de redondeo.',
          ],
          starter: `import numpy as np

W = np.array([[3.0, 1.0, 0.0], [1.0, 2.0, -1.0], [0.0, 2.0, 2.0]])
x = np.array([0.6, 0.0, 0.8])
# W: 3 filas y 3 columnas, los pesos de la capa. x: una entrada de 3 números y norma 1.

# PASO 1. sigma_max: el mayor valor singular de W.
# Por qué: es lo máximo que la capa puede alargar una entrada.
# np.linalg.svd(W, compute_uv=False) devuelve SOLO los valores singulares, de mayor a menor.
# Un elemento de un array se saca con un índice: el primero, con [0].
# Resultado esperado: un solo número.
sigma_max = None

# PASO 2. W_sn: los pesos con la normalización espectral.
# Por qué: al dividir todos los pesos entre sigma_max, el mayor valor singular queda en 1.
# Dividir una matriz entre un número divide cada uno de sus elementos.
# Resultado esperado: un array de 3 filas y 3 columnas.
W_sn = None

# PASO 3. sigma_despues: el mayor valor singular de W_sn.
# Por qué: es la comprobación de que ahora la capa no puede alargar nada: debe valer 1.
# Es el mismo cálculo del paso 1, pero sobre W_sn.
# Resultado esperado: un solo número.
sigma_despues = None

# PASO 4. norma_y: la norma de la salida de la capa normalizada para x.
# Por qué: con x de norma 1, la salida no puede ser más larga que 1.
# W_sn @ x es la salida de la capa. np.linalg.norm(v) da la longitud de un vector v.
# Resultado esperado: un solo número.
norma_y = None

# Para ver qué vale algo antes de entregar: print(sigma_max, norma_y) y pulsa «Ejecutar».
`,
          checks: `_W = np.array([[3.0, 1.0, 0.0], [1.0, 2.0, -1.0], [0.0, 2.0, 2.0]])
_x = np.array([0.6, 0.0, 0.8])
_m = float(np.linalg.svd(_W, compute_uv=False)[0])
def _num(v):
    return isinstance(v, (int, float, np.integer, np.floating)) and not isinstance(v, (bool, np.bool_))
_a = _num(sigma_max)
_aok = _a and abs(float(sigma_max) - _m) < 1e-6
check(_a, "\`sigma_max\` tiene que ser un solo número: el mayor valor singular de \`W\`, no el array entero.")
check((not _a) or _aok or abs(float(sigma_max) - float(np.linalg.norm(_W))) > 1e-6, "\`sigma_max\` es la norma de toda la matriz (Frobenius), no su mayor valor singular. Usa \`np.linalg.svd(W, compute_uv=False)\` y toma el primero.")
check((not _a) or _aok or abs(float(sigma_max) - float(np.linalg.norm(_W))) < 1e-6, "\`sigma_max\` tiene que ser el mayor valor singular de \`W\`, el primero de los que da \`svd\`.")
_b = isinstance(W_sn, np.ndarray) and W_sn.shape == (3, 3) and np.issubdtype(W_sn.dtype, np.floating)
_bok = _b and bool(np.allclose(W_sn, _W / _m))
check(_b, "\`W_sn\` tiene que ser un array de NumPy de 3 filas y 3 columnas: \`W\` dividida entre \`sigma_max\`.")
check((not _b) or (not _aok) or _bok, "\`W_sn\` tiene que ser \`W\` dividida entre \`sigma_max\`, el mayor valor singular. Con otro divisor, el nuevo mayor no queda en 1.")
_c = _num(sigma_despues)
check(_c, "\`sigma_despues\` tiene que ser un solo número: el mayor valor singular de \`W_sn\`.")
check((not _c) or (not _bok) or abs(float(sigma_despues) - 1) < 1e-6, "\`sigma_despues\` tiene que valer 1: es el mayor valor singular de \`W_sn\`, calculado igual que \`sigma_max\`.")
_d = _num(norma_y)
check(_d, "\`norma_y\` tiene que ser un solo número: la norma de \`W_sn @ x\`.")
check((not _d) or (not _bok) or abs(float(norma_y) - float(np.linalg.norm((_W / _m) @ _x))) < 1e-6, "\`norma_y\` tiene que ser la longitud de \`W_sn @ x\`, medida con \`np.linalg.norm\`: la salida de la capa normalizada para \`x\`.")
`,
          reference: `import numpy as np

W = np.array([[3.0, 1.0, 0.0], [1.0, 2.0, -1.0], [0.0, 2.0, 2.0]])
x = np.array([0.6, 0.0, 0.8])
# Guarda en sigma_max el mayor valor singular de W, en W_sn W normalizada, en sigma_despues el mayor valor singular de W_sn y en norma_y la norma de W_sn @ x
sigma_max = np.linalg.svd(W, compute_uv=False)[0]
W_sn = W / sigma_max
sigma_despues = np.linalg.svd(W_sn, compute_uv=False)[0]
norma_y = np.linalg.norm(W_sn @ x)
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'svd.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere la dirección de entrada que una matriz `A` de $2\\times 2$ estira más, y cuánto la estira. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        '`np.linalg.svd` devuelve `Vt`, no `V`. ¿Dónde están las direcciones, en las filas o en las columnas de `Vt`?',
        'La tercera línea usa `v1` tal como viene. Si `v1` no es la dirección buscada, su resultado tampoco lo es.',
      ],
      explain:
        '`Vt` es la traspuesta de `V`, así que las direcciones de entrada están en sus filas. Revisa si cada línea usa lo que la anterior debería haber preparado.',
      solution:
        'La segunda línea está mal. `Vt[:, 0]` es la primera **columna** de `Vt`, y la dirección de entrada $v_1$ es su primera **fila**: `Vt[0]`. La primera línea está bien. La tercera arrastra el error: con una dirección que no es $v_1$, `np.linalg.norm(A @ v1)` no da el estiramiento máximo.',
      lines: [
        'U, S, Vt = np.linalg.svd(A)',
        'v1 = Vt[:, 0]',
        'estiramiento = np.linalg.norm(A @ v1)',
      ],
      faultyLine: 1,
    },
    {
      id: 'svd.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula los valores singulares de una matriz simétrica. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Piensa en qué mide un valor singular y si una medida así puede ser negativa.',
        'Comprueba el resultado con el determinante: el producto de los valores singulares es su valor absoluto.',
      ],
      explain:
        'Un valor singular es un estiramiento y nunca es negativo: el signo de un autovalor se guarda en $U$. Revisa cada línea con esa regla.',
      solution:
        'La segunda línea está mal. Para una matriz simétrica, los valores singulares son los **valores absolutos** de los autovalores: $|3|=3$ y $|-1|=1$. Un valor singular no puede valer $-1$. Comprobación: $\\sigma_1\\sigma_2=3\\cdot 1=3=|\\det A|$, y $\\det A=1-4=-3$.',
      lines: [
        'A tiene filas (1, 2) y (2, 1), es simétrica y sus autovalores son 3 y −1',
        'Luego los valores singulares de A son 3 y −1',
        'Ordenados de mayor a menor, σ₁ = 3 y σ₂ = −1',
      ],
      faultyLine: 1,
    },
    {
      id: 'svd.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento estudia cómo estira una matriz que solo gira. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Si una matriz no cambia la longitud de ninguna flecha, ¿cuánto estira en cada dirección?',
        'Comprueba que cada línea se sigue de la anterior.',
      ],
      explain:
        'Una matriz que solo gira conserva todas las longitudes, así que estira igual en todas las direcciones. Revisa cada paso con esa idea y con lo que son los valores singulares.',
      solution:
        'No hay ningún error. Un giro no cambia la longitud de ninguna flecha, así que el estiramiento es $1$ en todas las direcciones y el mayor y el menor coinciden: $\\sigma_1=\\sigma_2=1$. La imagen de la circunferencia unidad es ella misma y el número de condición, $\\sigma_1/\\sigma_2$, vale $1$.',
      lines: [
        'Q gira cada flecha 30° y no cambia su longitud, así que |Qx| = |x| para toda x',
        'Entonces el estiramiento es 1 en todas las direcciones, y el mayor y el menor valen lo mismo: σ₁ = σ₂ = 1',
        'Luego la imagen de la circunferencia unidad es ella misma, y el número de condición σ₁/σ₂ vale 1',
      ],
      faultyLine: null,
    },
  ],
};
