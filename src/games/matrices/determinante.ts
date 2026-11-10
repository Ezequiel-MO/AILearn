import type { Project } from '../../content/schema';
import { py } from '../py';
import { determinanteWarmup } from './determinante.calentamiento';
import { RESENAS, capaLab } from './datos';

/** La neurona siguiente mira la segunda salida de la capa: responde «positiva» si es positiva. */
const MIRA_SALIDA_2 = { w: [0, 1] as [number, number], b: 0 };

/** Lo que mide casi toda meta de este proyecto, además del determinante. */
const ACIERTOS = {
  metric: 'acc',
  op: 'gte',
  target: 1,
  label: 'Aciertos de la neurona siguiente',
  format: 'percent',
} as const;

/** Determinante 0: la capa aplasta el plano sobre una recta. */
const APLASTA = { metric: 'det', op: 'eq', target: 0, label: 'Determinante de la capa' } as const;

/** Parejas de palabras que la capa deja en el mismo punto. */
const FUNDIDAS = 'Parejas de palabras fundidas';

/**
 * Primer proyecto de la Órbita 1 de matrices: el determinante mide cuánto espacio deja la capa a los
 * datos. Estirar separa, aplastar junta palabras para siempre, aplastar en la dirección que no importa
 * es comprimir bien, el signo no pierde nada y un determinante casi nulo deja palabras casi encima.
 */
export const determinante: Project = {
  id: 'determinante',
  name: 'Determinante',
  sub: 'Cuánto espacio deja la capa',
  bigPicture: {
    parts: ['linear'],
    text: 'El determinante de una matriz dice cuánto escala las áreas la transformación que representa, y si vale $0$, la aplasta en una línea y pierde información. Una capa lineal que aplasta direcciones pierde parte de lo que le llega. Aquí lo ves como área con signo, lo que ayuda a entender cuándo una capa conserva información y cuándo no.',
  },
  warmup: determinanteWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'determinante.ex00.1',
          type: 'laboratorio',
          purpose: {
            why: 'Una capa de una red recoloca todos los embeddings a la vez. Si los junta, a la capa siguiente le queda menos sitio para distinguirlos; si los separa, le deja más. El determinante de la capa mide eso: por cuánto multiplica las áreas.',
            aim: 'Vas a estirar una capa que ha apiñado las reseñas cerca del origen, hasta que deje mucho más espacio, sin que la neurona siguiente deje de acertar.',
            takeaway:
              'El área del cuadrado unidad tras la capa es el valor absoluto del determinante, y toda región de palabras crece con él. Con $\\hat{\\imath}$ en $(2, 0)$ y $\\hat{\\jmath}$ en $(0, 2)$, el área es $4$ y las palabras quedan al doble de distancia que sin capa.',
          },
          prompt:
            'Seis reseñas con dos rasgos: **intensidad** y **tono**. La neurona siguiente mira la segunda salida (el eje vertical) y responde «positiva» a lo que cae en la zona sombreada. Esta capa lo encoge todo a la mitad: las palabras se apiñan y el cuadrado unidad se queda en un cuarto de su área.\n\nEstira la capa hasta que el cuadrado unidad mida al menos $4$, sin que la neurona falle.',
          hints: [
            'El cuadrado unidad es el que forman las dos columnas: su área está en el medidor. Las palabras se separan a la vez que él crece.',
            'Alarga $\\hat{\\imath}$ y $\\hat{\\jmath}$ sin cambiarles el sentido. Si das la vuelta a $\\hat{\\jmath}$ (el tono), el área también crece, pero la neurona falla.',
          ],
          explain:
            'Una capa multiplica todas las áreas por el mismo factor: el valor absoluto de su determinante. Con las dos columnas sobre los ejes, es el producto de sus longitudes: $0{,}5\\cdot 0{,}5=0{,}25$ al empezar. Para llegar a $4$, ese producto tiene que valer $4$ o más.',
          solution:
            'Con $\\hat{\\imath}$ en $(2, 0)$ y $\\hat{\\jmath}$ en $(0, 2)$, el determinante es $2\\cdot 2=4$ y la segunda salida sigue siendo el tono, al doble: la neurona acierta las seis. Vale cualquier pareja de columnas que no dé la vuelta al tono y cuyo cuadrado mida $4$ o más. Con $\\hat{\\jmath}$ en $(0, -2)$ el área es $4$, pero el determinante es $-4$ y el tono llega al revés: la neurona falla con las seis.',
          lab: capaLab(RESENAS, { range: 6, i: [0.5, 0], j: [0, 0.5], readout: MIRA_SALIDA_2 }),
          goals: [
            ACIERTOS,
            {
              metric: 'area',
              op: 'gte',
              target: 4,
              label: 'Área que deja la capa al cuadrado unidad',
            },
          ],
          solved: { ix: 2, jy: 2 },
        },
        {
          id: 'determinante.ex00.2',
          type: 'laboratorio',
          purpose: {
            why: 'Una capa que aplasta el plano sobre una recta tiene determinante $0$. Dos entradas distintas pueden salir iguales, y a partir de ahí ninguna capa posterior las separa: para el resto de la red son la misma palabra.',
            aim: 'Vas a aplastar la capa sobre una recta y a buscar qué dirección hay que perder para que se fundan dos parejas de reseñas.',
            takeaway:
              'Al borrar el tono, «genial» cae sobre «horrible» y «bueno» sobre «malo»: solo se distinguían por ese rasgo. Qué palabras se funden depende de la dirección que aplasta la capa, y lo fundido ya no se recupera.',
          },
          prompt:
            'Las mismas reseñas y la misma neurona. Una capa con determinante $0$ manda todo el plano a una recta, y dos palabras distintas pueden caer en el mismo punto: quedan **fundidas**.\n\nAplasta la capa de modo que se fundan al menos dos parejas de reseñas.',
          hints: [
            'Busca palabras que solo se diferencien en un rasgo: «genial» y «horrible» tienen la misma intensidad. Si la capa pierde el rasgo en el que difieren, caen juntas.',
            'Lleva $\\hat{\\jmath}$ (el tono) al origen: la capa deja de ver el tono. Poner $\\hat{\\jmath}$ sobre la recta de $\\hat{\\imath}$ también aplasta, pero funde una sola pareja.',
          ],
          explain:
            'Con determinante $0$ hay una dirección que la capa manda al origen. Dos palabras se funden cuando su diferencia apunta justo en esa dirección. Las parejas que solo difieren en el tono tienen su diferencia vertical: hay que perder la dirección del tono.',
          solution:
            'Con $\\hat{\\jmath}$ en $(0, 0)$ la salida de cada palabra solo depende de su intensidad. Con $\\hat{\\imath}$ en $(0, 1)$, «genial» y «horrible» caen en $(0;\\ 2{,}5)$, y «bueno» y «malo» en $(0, 1)$; con $\\hat{\\imath}$ en otro sitio pasa igual. Si la llevas al origen, se funde todo en un punto. Con $\\hat{\\jmath}$ en $(1, 0)$ también hay determinante $0$, pero solo se funden «malo» y «triste».',
          lab: capaLab(RESENAS, { readout: MIRA_SALIDA_2 }),
          goals: [
            APLASTA,
            { metric: 'merged', op: 'gte', target: 2, label: FUNDIDAS, format: 'integer' },
          ],
          solved: { ix: 0, iy: 1, jy: 0 },
        },
        {
          id: 'determinante.ex00.3',
          type: 'laboratorio',
          purpose: {
            why: 'Muchas redes tienen un cuello de botella: una capa que deja pasar menos dimensiones de las que recibe, como el centro de un autocodificador. Perder una dirección es inevitable; la cuestión es cuál. Si la capa tira lo que no sirve para la tarea, no se pierde nada que importe.',
            aim: 'Vas a rehacer una capa que aplasta y ha borrado el tono, para que siga aplastando pero tire el rasgo que a la neurona no le hace falta.',
            takeaway:
              'Con $\\hat{\\imath}$ en el origen el determinante sigue en $0$, pero lo que se pierde es la intensidad: ninguna pareja se funde y la neurona acierta las seis. Comprimir bien es aplastar en la dirección que no importa.',
          },
          prompt:
            'Esta capa aplasta (determinante $0$) y ha borrado el tono: las reseñas han caído sobre el eje vertical, ordenadas por su intensidad, y la neurona dice «positiva» a todas. Hay que conservar el cuello de botella: la capa tiene que seguir aplastando.\n\nCámbiala para que siga con determinante $0$ y la neurona acierte las seis.',
          hints: [
            'Las seis caen en la zona sombreada porque la segunda salida es ahora la intensidad, positiva en todas. El rasgo que distingue a las positivas tiene que volver a esa salida.',
            'Sube $\\hat{\\jmath}$ (el tono) y lleva $\\hat{\\imath}$ (la intensidad) al origen: la capa sigue aplastando, pero ahora pierde la intensidad.',
          ],
          explain:
            'Con determinante $0$, la capa manda una dirección al origen. Antes era la del tono, la que separa los grupos. Si es la de la intensidad, las palabras caen en una recta ordenadas por su tono, y la neurona solo necesita ese número.',
          solution:
            'Con $\\hat{\\imath}$ en $(0, 0)$ y $\\hat{\\jmath}$ en $(0, 1)$, cada palabra cae en el eje vertical, a la altura de su tono: determinante $0$ y seis aciertos. También vale $\\hat{\\imath}$ en $(0;\\ 0{,}5)$ y $\\hat{\\jmath}$ en $(0, 2)$. Si subes $\\hat{\\jmath}$ sin tocar $\\hat{\\imath}$, el determinante sigue en $0$, pero la salida 2 suma intensidad y tono: «horrible» entra en la zona y «malo» y «triste» quedan en la frontera.',
          lab: capaLab(RESENAS, { i: [0, 1], j: [0, 0], readout: MIRA_SALIDA_2 }),
          goals: [APLASTA, ACIERTOS],
          solved: { iy: 0, jy: 1 },
        },
        {
          id: 'determinante.ex00.4',
          type: 'laboratorio',
          purpose: {
            why: 'El signo del determinante dice si la capa da la vuelta al plano, como un espejo. Al entrenar, una red llega a capas con determinante negativo igual que positivo: voltear no borra nada, y la capa siguiente se adapta al nuevo sentido.',
            aim: 'Vas a conseguir una capa que voltee el plano sin que la neurona siguiente note la diferencia.',
            takeaway:
              'Dar la vuelta a la intensidad hace el determinante negativo y la neurona acierta igual: lo que mira no ha cambiado. Voltear el tono también da $-1$, pero lo que lee llega al revés. El signo no es información perdida: el área sigue ahí.',
          },
          prompt:
            'Las mismas reseñas y la misma neurona, con una capa que no cambia nada. Un determinante negativo significa que la capa voltea el plano: el cuadrado unidad sale del revés.\n\nHaz que el determinante sea $-1$ o menos sin que la neurona deje de acertar con las seis.',
          hints: [
            'Hay dos maneras de voltear: dar la vuelta a una columna o a la otra. Mira cuál de los dos rasgos lee la neurona en el eje vertical.',
            'Lleva $\\hat{\\imath}$ (la intensidad) al otro lado del origen, hacia la izquierda. El tono sigue subiendo y bajando como antes.',
          ],
          explain:
            'El determinante cambia de signo cuando una columna cruza al otro lado de la recta de la otra. Si la que cruza es la intensidad, la segunda salida sigue siendo el tono. Si es el tono, las positivas caen abajo, fuera de la zona sombreada.',
          solution:
            'Con $\\hat{\\imath}$ en $(-1, 0)$ el determinante es $-1$: las palabras pasan al lado izquierdo, a la misma altura, y la neurona acierta las seis. Con $(-2, 0)$ también, con determinante $-2$. Con $\\hat{\\jmath}$ en $(0, -1)$ el determinante es $-1$ y falla con todas. Intercambiar las columnas también da $-1$, pero la segunda salida pasa a ser la intensidad y acierta solo tres.',
          lab: capaLab(RESENAS, { readout: MIRA_SALIDA_2 }),
          goals: [
            { metric: 'det', op: 'lte', target: -1, label: 'Determinante de la capa' },
            ACIERTOS,
          ],
          solved: { ix: -1 },
        },
        {
          id: 'determinante.ex00.5',
          type: 'laboratorio',
          purpose: {
            why: 'Una capa con determinante muy pequeño no llega a aplastar, pero casi: dos entradas distintas salen casi en el mismo sitio. Un poco de redondeo o de ruido basta para confundirlas, y deshacer la capa amplifica cualquier error. Lo mide el número de condición.',
            aim: 'Vas a construir una capa casi plana que deje «genial» y «feliz» casi encima, sin fundir ninguna pareja y sin que llegue a aplastar.',
            takeaway:
              'Con una capa casi plana nada se funde y la neurona acierta, pero «genial» y «feliz» quedan casi encima. Si la capa aplasta del todo, se funden. Entre «casi» y «del todo» solo cambia un número: por eso preocupa un determinante pequeño.',
          },
          prompt:
            '«genial» y «feliz» son casi sinónimos: están a $0{,}71$. Una capa casi plana los acercaría aún más sin llegar a fundirlos.\n\nConstruye una capa que los deje a $0{,}5$ o menos, sin fundir ninguna pareja y con un determinante de al menos $0{,}1$: que no llegue a aplastar.',
          hints: [
            'La línea entre «genial» y «feliz» va en diagonal: difieren lo mismo en intensidad que en tono. La capa tiene que encoger esa dirección.',
            'Inclina $\\hat{\\jmath}$ hacia la izquierda y acórtala, hacia el lado opuesto de $\\hat{\\imath}$, sin llegar a su recta: si cae en ella, el determinante es $0$.',
          ],
          explain:
            '«genial» y «feliz» se diferencian en $0{,}5$ de intensidad y $0{,}5$ de tono: tras la capa, su distancia es la mitad de lo que mide $\\hat{\\imath}+\\hat{\\jmath}$. Para acercarlas, esa suma tiene que encoger: las columnas quedan casi opuestas, el cuadrado unidad se adelgaza y el determinante baja.',
          solution:
            'Con $\\hat{\\jmath}$ en $(-0{,}5;\\ 0{,}5)$ el determinante es $0{,}5$: «genial» y «feliz» quedan a $0{,}35$, ninguna pareja se funde y la neurona acierta las seis. Encoger toda la capa a la mitad también vale. Con $\\hat{\\jmath}$ en $(-1, 0)$ quedan a $0$: el determinante es $0$ y se funden. Una capa así es invertible en teoría, pero un error pequeño a la salida crece mucho al deshacerla.',
          lab: capaLab(RESENAS, { readout: MIRA_SALIDA_2, pair: ['genial', 'feliz'] }),
          goals: [
            {
              metric: 'pair_dist',
              op: 'lte',
              target: 0.5,
              label: 'Distancia entre «genial» y «feliz»',
            },
            { metric: 'merged', op: 'lte', target: 0, label: FUNDIDAS, format: 'integer' },
            { metric: 'det', op: 'gte', target: 0.1, label: 'Determinante de la capa' },
          ],
          solved: { jx: -0.5, jy: 0.5 },
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'determinante.ex01.1',
          type: 'opcion',
          purpose: {
            why: 'Antes de fiarse de una capa conviene saber si pierde información: si su matriz tiene determinante $0$, hay entradas distintas que salen iguales. Con los pesos delante, la comprobación es una cuenta de dos productos.',
            aim: 'Vas a decidir si una capa con pesos con nombre pierde información, calculando su determinante a partir de lo que hace cada salida.',
            takeaway:
              'La salida 2 es la salida 1 cambiada de signo: la capa solo da un número útil y su determinante es $0$. «horrible» y «triste» salen en el mismo punto, y nada posterior las separa.',
          },
          prompt:
            'Una capa calcula, para cada reseña:\n\n$$\\text{salida 1}=0{,}5\\cdot\\text{intensidad}+\\text{tono}\\qquad\\text{salida 2}=-0{,}5\\cdot\\text{intensidad}-\\text{tono}$$\n\n¿Pierde información? Puedes construir la capa en el laboratorio y mirar dónde caen las palabras.',
          hints: [
            'Escribe la matriz: una fila por salida y una columna por rasgo. Después calcula $ad-bc$, con el signo de cada producto.',
            'En el laboratorio, $\\hat{\\imath}$ es la columna de la intensidad y $\\hat{\\jmath}$ la del tono. Mira si las palabras caen sobre una recta.',
          ],
          explain:
            'Una capa pierde información cuando su determinante es $0$: manda una dirección entera al origen y las palabras que difieren en esa dirección salen iguales. Que ningún peso sea $0$ no dice nada.',
          solution:
            'La matriz es $\\begin{pmatrix}0{,}5&1\\\\-0{,}5&-1\\end{pmatrix}$ : el producto de la diagonal, $-0{,}5$, menos el de la otra, también $-0{,}5$, da $\\det=0$. Sí pierde: «horrible» y «triste» salen las dos en $(-0{,}75;\\ 0{,}75)$. Si te sale $-1$, has sumado los dos productos en vez de restarlos.',
          lab: capaLab(RESENAS),
          options: [
            'Sí: su determinante es $0$, y hay reseñas distintas que salen en el mismo punto',
            'No: ningún peso de la matriz es $0$',
            'No: su determinante es $-1$, y un determinante negativo solo voltea el plano',
            'Sí: tiene pesos negativos, y un peso negativo borra su rasgo',
          ],
          correct: 0,
        },
        {
          id: 'determinante.ex01.2',
          type: 'numero',
          purpose: {
            why: 'Un flujo normalizador, un tipo de modelo generativo, transforma datos simples con capas invertibles. Para saber cuánta probabilidad cae en cada sitio necesita saber cuánto estira cada capa las áreas: el valor absoluto de su determinante.',
            aim: 'Vas a calcular el área de una región de reseñas después de una capa, a partir del área que tiene antes y del determinante.',
            takeaway:
              'El área pasa de $4{,}5$ a $9$: toda región se multiplica por $\\lvert\\det A\\rvert=2$, sea cual sea su forma. El signo menos solo dice que sale volteada; en un flujo, la densidad se dividiría por ese $2$.',
          },
          prompt:
            'El cuadrilátero con esquinas en «bueno», «malo», «horrible» y «genial» mide $4{,}5$ de área. Una capa da la vuelta a la intensidad y dobla el tono:\n\n$$A=\\begin{pmatrix}-1&0\\\\0&2\\end{pmatrix}$$\n\n¿Qué área tiene ese cuadrilátero a la salida? Puedes construir la capa en el laboratorio y mirarlo.',
          hints: [
            'Una capa multiplica todas las áreas por el mismo número. Calcula el determinante de $A$.',
            'Un área no es negativa: usa el valor absoluto del determinante.',
          ],
          explain:
            'Las áreas se multiplican por $\\lvert\\det A\\rvert$: vale para el cuadrado unidad y para cualquier otra región. Aquí la matriz es diagonal, y el determinante es el producto de la diagonal.',
          solution:
            '$\\det A=(-1)\\cdot 2-0\\cdot 0=-2$, así que el área se multiplica por $2$: $4{,}5\\cdot 2=9$. Si te sale $-9$, falta el valor absoluto. En el laboratorio, con $\\hat{\\imath}$ en $(-1, 0)$ y $\\hat{\\jmath}$ en $(0, 2)$, las reseñas pasan a la izquierda y se alargan en vertical.',
          lab: capaLab(RESENAS),
          answer: 9,
          tol: 0,
        },
        {
          id: 'determinante.ex01.3',
          type: 'numero',
          purpose: {
            why: 'Un buscador de frases guarda un vector por frase y devuelve las más cercanas. Si la capa que hace esos vectores aplasta, frases distintas acaban con el mismo vector y el buscador ya no puede elegir entre ellas.',
            aim: 'Vas a contar cuántos puntos de salida distintos deja una capa que aplasta, sabiendo qué rasgo pierde.',
            takeaway:
              'Quedan $4$ salidas para $6$ palabras: la capa solo ve la intensidad, y las reseñas con la misma intensidad se funden. Con determinante $0$, las palabras que solo se distinguían por lo que se pierde caen juntas.',
          },
          prompt:
            'Una capa calcula, para cada reseña:\n\n$$\\text{salida 1}=\\text{intensidad}\\qquad\\text{salida 2}=2\\cdot\\text{intensidad}$$\n\nLe llegan las seis reseñas. ¿En cuántos puntos distintos caen? Puedes construir la capa en el laboratorio y mirarlo.',
          hints: [
            'El tono no aparece en ninguna salida: dos reseñas con la misma intensidad salen en el mismo sitio.',
            'Mira las intensidades de las seis reseñas y cuenta cuántos valores distintos hay.',
          ],
          explain:
            'La salida solo depende de la intensidad, así que cada valor distinto de la intensidad da un punto. Las palabras que comparten intensidad comparten salida, aunque su tono sea opuesto.',
          solution:
            'Las intensidades son $2{,}5$, $1$, $2$, $2{,}5$, $1$ y $1{,}5$: cuatro valores distintos. «genial» y «horrible» caen en $(2{,}5;\\ 5)$, y «bueno» y «malo» en $(1, 2)$. Quedan $4$ puntos para $6$ palabras. Si respondes $6$, cuentas palabras y no salidas.',
          lab: capaLab(RESENAS, { range: 5 }),
          answer: 4,
          tol: 0,
        },
        {
          id: 'determinante.ex01.4',
          type: 'numero',
          purpose: {
            why: 'Un flujo normalizador encadena capas y necesita el factor de área del conjunto. No multiplica las matrices: multiplica sus determinantes, porque cada capa escala lo que le deja la anterior.',
            aim: 'Vas a obtener el determinante de tres capas seguidas a partir del de cada una, sin multiplicar ninguna matriz.',
            takeaway:
              'El conjunto tiene determinante $-3$: las áreas se triplican y la orientación sale volteada, porque solo una capa voltea. La capa que encoge a la mitad compensa a la que dobla.',
          },
          prompt:
            'Tres capas de $2\\times 2$ van seguidas, sin activación en medio. Sus determinantes son $2$, $0{,}5$ y $-3$. ¿Cuánto vale el determinante de la capa única que equivale a las tres?',
          hints: [
            'Cada capa multiplica por su determinante las áreas que le llegan.',
            'Multiplica los tres, con su signo: $2$ por $0{,}5$ primero.',
          ],
          explain:
            'Las áreas se escalan capa a capa: el determinante de un producto es el producto de los determinantes. Los determinantes se multiplican, no se suman.',
          solution:
            '$2\\cdot 0{,}5\\cdot(-3)=-3$. Las dos primeras juntas dejan el área igual ($2\\cdot 0{,}5=1$) y la tercera la triplica y voltea el plano. Si sumas, sale $-0{,}5$, que no es el factor de ninguna de las tres.',
          answer: -3,
          tol: 0,
        },
        {
          id: 'determinante.ex01.5',
          type: 'opcion',
          purpose: {
            why: 'En las capas grandes de un modelo, el determinante sale a menudo diminuto o enorme aunque la capa no pierda nada, porque multiplica cientos de factores. Por eso los flujos normalizadores usan su logaritmo, y para saber si una capa casi aplasta se mira el número de condición.',
            aim: 'Vas a interpretar el determinante de una capa de 768 dimensiones que encoge un poco cada eje, y a decidir si pierde información.',
            takeaway:
              'Cada eje solo se encoge un 10 %, y la capa se deshace dividiendo por $0{,}9$: no pierde nada. Su determinante es diminuto solo porque multiplica 768 factores. Su número de condición es $1$, el mejor posible.',
          },
          prompt:
            'Una capa de $768\\times 768$ multiplica cada coordenada del embedding por $0{,}9$ y no mezcla ninguna con otra. Su determinante es $0{,}9^{768}\\approx 7\\cdot 10^{-36}$. ¿Qué dice ese número?',
          hints: [
            'Piensa en una sola coordenada: ¿cuánto se acercan dos palabras que solo se diferencian en ella?',
            'El determinante de una matriz diagonal es el producto de su diagonal: $0{,}9$ multiplicado $768$ veces.',
          ],
          explain:
            'Una capa diagonal multiplica cada dirección por su número de la diagonal, y su determinante es el producto de todos. Muchos factores algo menores que $1$ dan un producto minúsculo, aunque ninguna dirección se aplaste.',
          solution:
            'La segunda. La distancia entre dos palabras cualesquiera se multiplica por $0{,}9$: nada se funde ni queda casi encima, y la capa se deshace multiplicando por $1/0{,}9$. El logaritmo del determinante, $768\\cdot\\ln 0{,}9\\approx -80{,}9$, es la cifra con la que trabaja un flujo. El determinante es positivo: no voltea nada.',
          options: [
            'Que la capa casi aplasta: habrá palabras que queden casi encima',
            'Que la capa no pierde nada: encoge un poco cada uno de los 768 ejes, y esos 768 factores multiplicados dan un número diminuto',
            'Que la capa voltea el espacio',
            'Que hay un error: un determinante no puede ser tan pequeño sin ser $0$',
          ],
          correct: 1,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'determinante.ex02.1',
          type: 'codigo',
          prompt:
            'Para $A=\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}$, el determinante exacto es $1\\cdot 4-2\\cdot 3=-2$, pero `np.linalg.det` calcula con decimales binarios y no devuelve justo ese número. Ya tienes `A`. Guarda en `d` su determinante con `np.linalg.det`; en `bien`, si `d` es $-2$, comparándolo con `np.isclose`; y en `d_int`, el determinante redondeado al entero más cercano con `round`.',
          hints: [
            'El plan son tres líneas. `d` es el determinante de `A`, que calcula `np.linalg.det`. `bien` dice si `d` vale $-2$, y se compara con `np.isclose`, no con `==`, porque `d` es un decimal con un error diminuto en las últimas cifras. `d_int` es `d` redondeado al entero más cercano, con `round`. `d` es un número; `bien`, un `True` o `False`; y `d_int`, un entero.',
            'Las piezas, con otra matriz y otros números:\n\n' +
              py(
                'M = np.array([[3, 1], [2, 5]])',
                'x = np.linalg.det(M)           # el determinante de M: un número decimal, casi 13',
                'print(np.isclose(x, 13))       # True: isclose acepta una diferencia diminuta',
                'print(0.1 + 0.2 == 0.3)        # False: con == una diferencia en la última cifra ya cuenta',
                'print(np.isclose(0.1 + 0.2, 0.3))  # True',
                'print(round(12.6))             # 13: round da el entero más cercano',
              ) +
              '\n\n`np.isclose(x, y)` compara dos números y devuelve `True` si son casi iguales.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('d = np.linalg.det(___)', 'bien = np.isclose(d, ___)', 'd_int = round(___)') +
              '\n\nEl error típico es comparar con `==`: sale `False` aunque `d` sea, para todo fin práctico, $-2$.',
          ],
          explain:
            'NumPy calcula el determinante con una factorización en decimales, y el resultado suele arrastrar un error de redondeo en las últimas cifras. Por eso se compara con tolerancia y no con una igualdad exacta; y si se espera un entero, se redondea.',
          solution:
            '`d = np.linalg.det(A)` vale `-2.0000000000000004`, no `-2`. Con `d == -2` saldría `False`; con `np.isclose(d, -2)` sale `True`, y `round` devuelve `-2`. Es la misma razón por la que un determinante casi cero no se compara con `== 0`.',
          requirements: [
            '`d` es un número: el determinante de `A`, que se acepta con el pequeño error de redondeo de los decimales.',
            '`bien` es un solo `True` o `False`, y dice que `d` coincide con el valor exacto del determinante aunque lleve un error de redondeo.',
            '`d_int` es un número: el determinante redondeado al entero más cercano.',
          ],
          starter: `import numpy as np

A = np.array([[1, 2], [3, 4]])
# A es una matriz: un array de NumPy con 2 filas y 2 columnas.
# Su determinante exacto es 1 por 4 menos 2 por 3, que vale -2.

# PASO 1. El determinante de A, guardado en d.
# Por qué: el determinante es el factor por el que A multiplica las áreas. Aquí te
# interesa ver que el ordenador no lo da exacto.
# np.linalg.det(M) devuelve el determinante de la matriz M como un número decimal.
# Se espera un número en d.
d = None

# PASO 2. Si d vale -2, guardado en bien.
# Por qué: d se calcula con decimales binarios y puede traer un error diminuto en las
# últimas cifras, así que una igualdad exacta (==) diría False. Se compara "casi igual".
# np.isclose(x, y) devuelve True si x e y son casi iguales (por ejemplo,
# np.isclose(0.1 + 0.2, 0.3) vale True aunque 0.1 + 0.2 == 0.3 sea False).
# Se espera un solo True o False en bien.
bien = None

# PASO 3. d redondeado al entero más cercano, guardado en d_int.
# Por qué: si sabes que el resultado debe ser un entero, redondear quita ese error.
# round(x) devuelve el entero más cercano a x (round(12.6) vale 13).
# Se espera un número entero en d_int.
d_int = None

# Para ver qué vale algo antes de entregar: print(d, bien, d_int) y pulsa «Ejecutar».
`,
          checks: `_n = lambda x: isinstance(x, (int, float, np.integer, np.floating)) and not isinstance(x, (bool, np.bool_))
_d = _n(d)
_b = isinstance(bien, (bool, np.bool_))
_e = _n(d_int)
check(_d, "\`d\` tiene que ser un número: el determinante de \`A\`, que se calcula con \`np.linalg.det\`.")
check((not _d) or np.isclose(d, -2), "\`d\` tiene que valer -2 (salvo el redondeo): es el determinante de \`A\`, 1 por 4 menos 2 por 3.")
check(_b, "\`bien\` tiene que ser un solo \`True\` o \`False\`: el resultado de comparar \`d\` con -2.")
check((not _b) or bool(bien), "\`bien\` vale \`False\`: \`d\` lleva un error de redondeo en las últimas cifras, y una igualdad exacta lo toma como una diferencia. Para comparar decimales sirve \`np.isclose\`.")
check(_e, "\`d_int\` tiene que ser un número: el determinante redondeado al entero más cercano.")
check((not _e) or d_int == -2, "\`d_int\` tiene que valer -2: el determinante redondeado al entero más cercano, con \`round\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 2], [3, 4]])\nd = np.linalg.det(A)\nbien = np.isclose(d, -2)\nd_int = round(d)\n',
        },
        {
          id: 'determinante.ex02.2',
          type: 'codigo',
          prompt:
            'El área de un triángulo de vértices `a`, `b` y `c` es la mitad de la del paralelogramo que forman `b - a` y `c - a`, y esa se obtiene con un determinante. Escribe `area_triangulo(a, b, c)`, que recibe tres arrays de NumPy con 2 números y devuelve el área. Después guarda en `area` el área del triángulo de vértices $(1, 1)$, $(2, 4)$ y $(5, 2)$.',
          hints: [
            'El plan, dentro de la función: (1) los dos lados que salen de `a` son `b - a` y `c - a`; (2) con ellos como filas, arma una matriz de 2 filas y 2 columnas con `np.array([lado1, lado2])` y llámala `M`; (3) su determinante, `np.linalg.det(M)`, es el área del paralelogramo, pero puede salir negativo según el orden de los vértices, así que quítale el signo con `abs`; (4) el triángulo es la mitad del paralelogramo. Con `return` devuelves ese número. Fuera de la función, `area` es lo que devuelve `area_triangulo` con los vértices del enunciado, como arrays de NumPy.',
            'Las piezas, con otros puntos:\n\n' +
              py(
                'p = np.array([1, 2])',
                'q = np.array([4, 6])',
                'print(q - p)                        # [3 4]: restar arrays resta componente a componente',
                'M = np.array([p, q])                # una matriz con p y q como filas',
                'print(M.shape)                      # (2, 2): 2 filas y 2 columnas',
                'print(round(np.linalg.det(M)))      # -2: el determinante de M, redondeado',
                'print(abs(-7))                      # 7: abs quita el signo',
              ) +
              '\n\nDentro de una función, las líneas llevan sangría (4 espacios) y `return` devuelve el resultado.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def area_triangulo(a, b, c):',
                '    M = np.array([___, ___])',
                '    return ___(np.linalg.det(M)) / ___',
                '',
                '',
                'area = area_triangulo(np.array([1, 1]), np.array([2, 4]), np.array([5, 2]))',
              ) +
              '\n\nLos errores típicos son olvidar el valor absoluto, que puede dar un área negativa, y no dividir entre 2, que da el doble.',
          ],
          explain:
            'El determinante de los dos lados es el área del paralelogramo, con signo, y el triángulo ocupa la mitad. El signo depende del orden en que se dan los vértices, y un área no puede ser negativa.',
          solution:
            'Se arma una matriz con `b - a` y `c - a`, y se devuelve el valor absoluto de su determinante dividido entre 2. Con los vértices del enunciado, `b - a` es $(1, 3)$ y `c - a` es $(4, 1)$: $\\det=1\\cdot 1-3\\cdot 4=-11$, y el área es $11/2=5{,}5$. Con otro orden de vértices cambia el signo del determinante, y el área no.',
          requirements: [
            '`area_triangulo` es una función que recibe tres arrays de NumPy con 2 números, los vértices, y devuelve un solo número: el área del triángulo.',
            'Se llama a la función con otros vértices además de los del enunciado, entre ellos los mismos vértices en otro orden y tres vértices alineados; no debe dar error.',
            'El área devuelta nunca es negativa, no depende del orden de los vértices y vale cero si los tres están alineados. Es la del triángulo, no la del paralelogramo.',
            '`area` es un número: lo que devuelve `area_triangulo` con los vértices del enunciado.',
          ],
          starter: `import numpy as np


# Ya está hecha la importación de NumPy; no hace falta tocarla.


def area_triangulo(a, b, c):
    # a, b y c son los tres vértices: cada uno es un array de NumPy con 2 números.
    # Por ejemplo, a[0] y a[1] son las dos coordenadas de a.
    # Todo lo de dentro de la función lleva sangría (4 espacios); eso es lo que le dice
    # a Python qué líneas son de la función.
    #
    # Qué tienes que hacer (quita el return None y escribe tus líneas):
    # 1. Los dos lados que salen de a son b - a y c - a (restar arrays resta componente
    #    a componente, y el resultado es otro array de 2 números).
    # 2. np.array([lado1, lado2]) con los dos lados como filas da una matriz de 2 por 2.
    # 3. np.linalg.det(M) es el determinante de esa matriz: el área del paralelogramo
    #    que forman los dos lados, pero con signo, que cambia según el orden de los vértices.
    #    abs(x) quita el signo de x.
    # 4. El triángulo ocupa la mitad del paralelogramo.
    # return x termina la función y devuelve x: se espera un solo número (el área).
    return None


# PASO 1. El área del triángulo de vértices (1, 1), (2, 4) y (5, 2), guardada en area.
# Por qué: es comprobar que tu función sirve con datos concretos.
# Llama a la función con tres arrays de NumPy: area_triangulo(np.array([1, 1]), ...).
# Se espera un número en area.
area = None

# Para ver qué vale algo antes de entregar: print(area) y pulsa «Ejecutar».
`,
          checks: `_f = callable(globals().get("area_triangulo"))
def _call(a, b, c):
    try:
        return area_triangulo(np.array(a), np.array(b), np.array(c))
    except Exception:
        return None
def _num(x):
    return isinstance(x, (int, float, np.integer, np.floating)) and not isinstance(x, (bool, np.bool_))
_r = [_call((1, 1), (2, 4), (5, 2)), _call((1, 1), (5, 2), (2, 4)), _call((0, 0), (4, 0), (0, 3)), _call((0, 0), (1, 1), (2, 2))] if _f else []
_all = _f and all(_num(x) for x in _r)
_neg = _all and np.isclose(_r[0], -5.5)
_dbl = _all and np.isclose(_r[0], 11) and np.isclose(_r[2], 12)
_good = _all and np.isclose(_r[0], 5.5) and np.isclose(_r[1], 5.5) and np.isclose(_r[2], 6) and np.isclose(_r[3], 0)
check(_f, "Hay que definir una función \`area_triangulo\` que reciba los tres vértices.")
check((not _f) or _all, "\`area_triangulo\` tiene que devolver un número: el área del triángulo.")
check((not _all) or not _neg, "\`area_triangulo\` devuelve un área negativa: el determinante cambia de signo según el orden de los vértices, y un área nunca es negativa.")
check((not _all) or not _dbl, "\`area_triangulo\` devuelve el área del paralelogramo, que es el doble de la del triángulo.")
check((not _all) or _neg or _dbl or _good, "\`area_triangulo\` tiene que dar 5,5 para los vértices (1, 1), (2, 4) y (5, 2), con cualquier orden de los vértices, y 0 si los tres están alineados.")
check((not _good) or (_num(area) and np.isclose(area, 5.5)), "\`area\` tiene que ser lo que devuelve \`area_triangulo\` para los vértices (1, 1), (2, 4) y (5, 2).")
`,
          reference: `import numpy as np


def area_triangulo(a, b, c):
    M = np.array([b - a, c - a])
    return abs(np.linalg.det(M)) / 2


area = area_triangulo(np.array([1, 1]), np.array([2, 4]), np.array([5, 2]))
`,
        },
        {
          id: 'determinante.ex02.3',
          type: 'codigo',
          prompt:
            'El signo de un determinante dice de qué lado está un punto. Para la recta que pasa por `a` y `b`, recorrida de `a` a `b`, el punto `c` está a la **izquierda** si el determinante de `b - a` y `c - a` es positivo (como $\\hat{\\jmath}$ respecto de $\\hat{\\imath}$ en la identidad). Escribe `a_la_izquierda(a, b, c)`, que devuelve `True` si `c` está estrictamente a la izquierda, y `False` si está a la derecha o sobre la recta. Guarda en `lado` lo que devuelve para `a` $=(0, 0)$, `b` $=(4, 1)$ y `c` $=(1, 3)$.',
          hints: [
            'El plan, dentro de la función: (1) los dos lados que salen de `a` son `b - a` y `c - a`; (2) con ellos como filas, arma la matriz `M` con `np.array([lado1, lado2])`; (3) calcula `np.linalg.det(M)`: aquí solo importa su signo; (4) devuelve si ese determinante es mayor que cero, con una comparación. Fuera de la función, `lado` es lo que devuelve con los puntos del enunciado. Cuidado: un punto sobre la recta tiene determinante $0$, y $0$ no es positivo.',
            'Las piezas, con otros números:\n\n' +
              py(
                'print(3 > 0)     # True',
                'print(0 > 0)     # False: el cero no es mayor que cero',
                'print(-2 > 0)    # False',
                'print(0 >= 0)    # True: con >= el cero sí cuenta, y aquí no queremos eso',
                'I = np.array([[1, 0], [0, 1]])',
                'print(np.linalg.det(I) > 0)   # True: el determinante de la identidad es 1',
              ) +
              '\n\nUna comparación como `x > 0` da un `True` o `False`, y eso es lo que tiene que devolver `return`.',
            'El esqueleto, con un hueco `___` donde decides tú:\n\n' +
              py(
                'def a_la_izquierda(a, b, c):',
                '    M = np.array([b - a, c - a])',
                '    return np.linalg.det(M) ___ 0',
                '',
                '',
                'lado = a_la_izquierda(np.array([0, 0]), np.array([4, 1]), np.array([1, 3]))',
              ) +
              '\n\nEl error típico es poner `>=` (un punto sobre la recta contaría como izquierda) o `<` (la respuesta sale al revés).',
          ],
          explain:
            'El determinante de `b - a` y `c - a` es positivo si el giro de `b - a` hacia `c - a` es antihorario, y negativo si es horario. Vale $0$ cuando los tres puntos están alineados, y estar alineado no es estar a la izquierda.',
          solution:
            'Se calcula el determinante de la matriz con `b - a` y `c - a`, y se devuelve si es mayor que cero. Con los datos, `b - a` es $(4, 1)$ y `c - a` es $(1, 3)$: $\\det=4\\cdot 3-1\\cdot 1=11>0$, luego `c` queda a la izquierda. Con la condición «menor que cero» se contestaría al revés, y con «mayor o igual que cero» un punto sobre la recta contaría como izquierda. Este test es la base de muchos algoritmos de geometría, como el cierre convexo.',
          requirements: [
            '`a_la_izquierda` es una función que recibe tres arrays de NumPy con 2 números, `a`, `b` y `c`, y devuelve un solo `True` o `False`.',
            'Se llama a la función con otros puntos además de los del enunciado: a la izquierda, a la derecha y sobre la recta, y también recorriendo la recta en sentido contrario; no debe dar error.',
            'Un punto sobre la recta no cuenta como estar a la izquierda: la función da `True` solo si está estrictamente a la izquierda.',
            '`lado` es un solo `True` o `False`: lo que devuelve la función con los puntos del enunciado.',
          ],
          starter: `import numpy as np


# Ya está hecha la importación de NumPy; no hace falta tocarla.


def a_la_izquierda(a, b, c):
    # a, b y c son tres puntos: cada uno es un array de NumPy con 2 números.
    # La recta va de a a b, y la pregunta es si c queda a su izquierda.
    # Todo lo de dentro de la función lleva sangría (4 espacios); eso es lo que le dice
    # a Python qué líneas son de la función.
    #
    # Qué tienes que hacer (quita el return None y escribe tus líneas):
    # 1. Los dos lados que salen de a son b - a y c - a (restar arrays resta componente
    #    a componente).
    # 2. np.array([lado1, lado2]) con los dos lados como filas da una matriz de 2 por 2.
    # 3. np.linalg.det(M) es su determinante. Es positivo si el giro de b - a hacia c - a
    #    es antihorario (c a la izquierda), negativo si es horario y 0 si están alineados.
    # 4. Una comparación como x > 0 da un solo True o False; return lo devuelve.
    #    Piensa qué hace falta con un determinante de 0.
    return None


# PASO 1. Lo que devuelve la función para a = (0, 0), b = (4, 1) y c = (1, 3), guardado en lado.
# Por qué: es comprobar que tu función sirve con datos concretos.
# Llama a la función con tres arrays de NumPy: a_la_izquierda(np.array([0, 0]), ...).
# Se espera un solo True o False en lado.
lado = None

# Para ver qué vale algo antes de entregar: print(lado) y pulsa «Ejecutar».
`,
          checks: `_f = callable(globals().get("a_la_izquierda"))
def _call(a, b, c):
    try:
        return a_la_izquierda(np.array(a), np.array(b), np.array(c))
    except Exception:
        return None
_cases = [((0, 0), (4, 1), (1, 3)), ((0, 0), (4, 1), (3, 0)), ((1, 1), (1, 5), (0, 3)), ((0, 0), (2, 1), (4, 2)), ((4, 1), (0, 0), (1, 3))]
_want = [True, False, True, False, False]
_r = [_call(*c) for c in _cases] if _f else []
_all = _f and all(isinstance(x, (bool, np.bool_)) for x in _r)
_got = [bool(x) for x in _r] if _all else []
_rev = _all and _got == [False, True, False, False, True]
_wide = _all and _got == [True, False, True, True, False]
check(_f, "Hay que definir una función \`a_la_izquierda\` que reciba los tres puntos.")
check((not _f) or _all, "\`a_la_izquierda\` tiene que devolver un solo \`True\` o \`False\`.")
check((not _all) or not _rev, "\`a_la_izquierda\` contesta al revés: dice que un punto está a la izquierda cuando está a la derecha. Un determinante positivo es el giro antihorario, el de la izquierda.")
check((not _all) or not _wide, "\`a_la_izquierda\` da \`True\` para un punto sobre la recta, que tiene determinante 0. Tiene que ser estrictamente a la izquierda.")
check((not _all) or _rev or _wide or _got == _want, "\`a_la_izquierda\` tiene que dar \`True\` para (1, 3) respecto de la recta de (0, 0) a (4, 1), \`False\` para (3, 0), y \`False\` para un punto sobre la recta. Si se recorre la recta al revés, la respuesta cambia.")
check((not _all) or _got != _want or (isinstance(lado, (bool, np.bool_)) and bool(lado)), "\`lado\` tiene que ser \`True\`: es lo que devuelve la función para (0, 0), (4, 1) y (1, 3).")
`,
          reference: `import numpy as np


def a_la_izquierda(a, b, c):
    M = np.array([b - a, c - a])
    return bool(np.linalg.det(M) > 0)


lado = a_la_izquierda(np.array([0, 0]), np.array([4, 1]), np.array([1, 3]))
`,
        },
        {
          id: 'determinante.ex02.4',
          type: 'codigo',
          prompt:
            'El determinante de un producto es el producto de los determinantes: $\\det(AB)=\\det A\\cdot\\det B$, porque las áreas se multiplican en cada paso. Compruébalo con `A` y `B`. Guarda en `dAB` el determinante de `A @ B`, en `dA_dB` el producto del determinante de `A` por el de `B`, y en `coincide` si los dos valores son iguales, comparados con `np.isclose` (un solo `True` o `False`).',
          hints: [
            'El plan son tres líneas. `dAB` es el determinante de la matriz `A @ B` (primero se multiplican las matrices y luego se calcula un determinante). `dA_dB` va por la otra ruta: el determinante de `A` por el determinante de `B`, multiplicados con `*`, no sumados. `coincide` compara los dos números con `np.isclose`, porque los redondeos son distintos y una igualdad exacta puede dar `False`.',
            'Las piezas, con otras matrices:\n\n' +
              py(
                'P = np.array([[1, 2], [0, 1]])',
                'Q = np.array([[2, 0], [0, 3]])',
                'print((P @ Q)[0])    # [2 6]: la primera fila del producto de matrices',
                'print(np.isclose(np.linalg.det(P @ Q), np.linalg.det(P) * np.linalg.det(Q)))   # True: las dos rutas coinciden',
                'print(0.1 + 0.2 == 0.3)               # False: con == una diferencia diminuta ya cuenta',
                'print(np.isclose(0.1 + 0.2, 0.3))     # True',
              ) +
              '\n\n`@` multiplica matrices y `*` multiplica números (o, en arrays, entrada por entrada).',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'dAB = np.linalg.det(___)',
                'dA_dB = np.linalg.det(A) ___ np.linalg.det(B)',
                'coincide = np.isclose(___, ___)',
              ) +
              '\n\nEl error típico es sumar los dos determinantes en vez de multiplicarlos, o comparar con `==`.',
          ],
          explain:
            'En matemáticas las dos rutas dan el mismo número, pero NumPy las calcula con redondeos distintos y pueden diferir en la última cifra. Por eso se compara con tolerancia. Si sale un número muy distinto, comprueba que multiplicas los determinantes en lugar de sumarlos.',
          solution:
            '`dAB = np.linalg.det(A @ B)` y `dA_dB = np.linalg.det(A) * np.linalg.det(B)` valen $10$ salvo el redondeo: $\\det A=5$, $\\det B=2$, y $AB=\\begin{pmatrix}4&-2\\\\7&-1\\end{pmatrix}$ tiene $\\det=-4+14=10$. Con `np.isclose` en `coincide` sale `True`; una igualdad exacta daría `False`, por `9.999999999999998` frente a `10.000000000000002`.',
          requirements: [
            '`dAB` es un número: el determinante del producto de `A` por `B`.',
            '`dA_dB` es un número: el determinante de `A` multiplicado por el de `B`, calculados por separado.',
            '`coincide` es un solo `True` o `False`, y dice que los dos valores son iguales salvo el error de redondeo.',
            'Los dos números se aceptan con una diferencia diminuta de redondeo.',
          ],
          starter: `import numpy as np

A = np.array([[2, 1], [1, 3]])
B = np.array([[1, -1], [2, 0]])
# A y B son matrices: arrays de NumPy con 2 filas y 2 columnas.
# A @ B es el producto de las dos matrices (otra matriz de 2 por 2).

# PASO 1. El determinante de A @ B, guardado en dAB.
# Por qué: es la primera ruta: multiplicar las matrices y calcular un solo determinante.
# np.linalg.det(M) devuelve el determinante de la matriz M como un número decimal.
# Se espera un número en dAB.
dAB = None

# PASO 2. El determinante de A multiplicado por el de B, guardado en dA_dB.
# Por qué: es la segunda ruta: dos determinantes por separado y se multiplican. Las
# áreas se multiplican en cada paso, y por eso las dos rutas deberían dar lo mismo.
# Multiplicar dos números se escribe con *.
# Se espera un número en dA_dB.
dA_dB = None

# PASO 3. Si dAB y dA_dB son iguales, guardado en coincide.
# Por qué: cada ruta redondea distinto, y con == una diferencia en la última cifra ya
# daría False. Se compara "casi igual".
# np.isclose(x, y) devuelve True si x e y son casi iguales.
# Se espera un solo True o False en coincide.
coincide = None

# Para ver qué vale algo antes de entregar: print(dAB, dA_dB, coincide) y pulsa «Ejecutar».
`,
          checks: `_n = lambda x: isinstance(x, (int, float, np.integer, np.floating)) and not isinstance(x, (bool, np.bool_))
_1 = _n(dAB)
_2 = _n(dA_dB)
_3 = isinstance(coincide, (bool, np.bool_))
check(_1, "\`dAB\` tiene que ser un número: el determinante del producto de \`A\` por \`B\`.")
check((not _1) or np.isclose(dAB, 10), "\`dAB\` tiene que valer 10: es el determinante de \`A @ B\`, no el de \`A\` ni el de \`B\`.")
check(_2, "\`dA_dB\` tiene que ser un número: el producto del determinante de \`A\` por el de \`B\`.")
check((not _2) or np.isclose(dA_dB, 10), "\`dA_dB\` tiene que valer 10: el determinante de \`A\` (5) multiplicado por el de \`B\` (2). Los determinantes se multiplican, no se suman.")
check(_3, "\`coincide\` tiene que ser un solo \`True\` o \`False\`.")
check((not _3) or bool(coincide), "\`coincide\` vale \`False\`: los dos valores son iguales salvo el redondeo, y una igualdad exacta los distingue. Compáralos con \`np.isclose\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[2, 1], [1, 3]])\nB = np.array([[1, -1], [2, 0]])\ndAB = np.linalg.det(A @ B)\ndA_dB = np.linalg.det(A) * np.linalg.det(B)\ncoincide = np.isclose(dAB, dA_dB)\n',
        },
        {
          id: 'determinante.ex02.5',
          type: 'codigo',
          prompt:
            'Una capa lineal de $2\\times 2$ con pesos $W$ multiplica las áreas por $\\lvert\\det W\\rvert$. Si ese valor está cerca de $0$, la capa casi aplasta el plano sobre una recta y pierde información: entradas distintas acaban casi en el mismo punto. `pesos` guarda cinco matrices de pesos de una capa de juguete (las capas reales tienen cientos de dimensiones). Guarda en `colapsan` un array de cinco valores `True` o `False`: `True` si $\\lvert\\det W\\rvert<10^{-6}$ para esa matriz; y en `cuantas`, cuántas colapsan.',
          hints: [
            'El plan son dos líneas. `colapsan` sale de los determinantes de las cinco matrices de una vez: `np.linalg.det(pesos)` devuelve un determinante por matriz, y de cada uno hay que mirar el valor absoluto (con `np.abs`, que actúa sobre todo el array) y ver si es menor que `1e-6`. Esa comparación da un array de cinco `True` o `False`. `cuantas` es cuántos `True` hay, y `.sum()` los cuenta; envuélvelo en `int(...)`. Dos errores típicos: un determinante «cero» puede salir como `1e-17`, así que `== 0` no sirve; y un determinante muy negativo no es un colapso sino un volteo, por eso el valor absoluto.',
            'Las piezas, con otras matrices:\n\n' +
              py(
                'pila = np.array([[[2, 0], [0, 1]], [[1, 2], [2, 4]], [[0, 1], [1, 0]]])',
                'dets = np.linalg.det(pila)           # un determinante por matriz',
                'print(dets.shape)                    # (3,): tres determinantes',
                'print(np.abs(np.array([-3, 2, -5])))   # [3 2 5]: np.abs quita el signo de cada uno',
                'peq = np.array([3, 1e-9, 5]) < 1e-6   # compara cada número con el umbral',
                'print(peq)                           # [False  True False]',
                'print(peq.sum())                     # 1: .sum() cuenta los True',
                'print(1e-17 == 0)                    # False: un casi cero no es un cero exacto',
              ) +
              '\n\n`1e-6` es la forma de escribir $10^{-6}$ en Python.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('colapsan = ___(np.linalg.det(pesos)) < ___', 'cuantas = int(colapsan.sum())') +
              '\n\nEl error típico es olvidar el valor absoluto: un espejo, con determinante negativo, contaría como colapso.',
          ],
          explain:
            'Una matriz que casi aplasta el plano tiene un factor de área casi nulo, y eso depende del tamaño del determinante, no de su signo. Los ceros calculados con decimales no son exactos, así que «casi cero» se mide con un umbral y no con una igualdad. Un determinante negativo da la vuelta al plano, pero no lo aplasta.',
          solution:
            'Se compara `np.abs(np.linalg.det(pesos))` con `1e-6`. Los determinantes son $0{,}5$; del orden de $10^{-17}$ (las filas de la segunda matriz son proporcionales, pero el redondeo no deja un cero exacto); del orden de $10^{-9}$; $-1$; y $0{,}005$. Colapsan la segunda y la tercera, así que `cuantas` vale 2. Con una igualdad exacta con cero no se detecta ninguna; sin el valor absoluto, la cuarta, un espejo que no pierde nada, contaría como colapso; y con un umbral demasiado grande entraría la quinta. Una capa así no tiene inversa fiable: los dos proyectos siguientes de esta órbita, la inversa y el rango, explican por qué.',
          requirements: [
            '`colapsan` es un array de NumPy con 5 valores `True` o `False`, uno por cada matriz de `pesos` y en el mismo orden.',
            '`colapsan` vale `True` solo en las matrices cuyo determinante, en valor absoluto, es menor que el umbral del enunciado: una matriz que solo da la vuelta al plano no cuenta.',
            '`cuantas` es un número entero: cuántas matrices marca `colapsan`.',
          ],
          starter: `import numpy as np

pesos = np.array([
    [[1, 0], [0, 0.5]],
    [[0.3, 0.1], [0.9, 0.3]],
    [[1, 2], [0.5, 1.000000001]],
    [[0, 1], [1, 0]],
    [[1, 0], [0, 0.005]],
])
# pesos es un array de NumPy de forma (5, 2, 2): cinco matrices de 2 por 2.
# pesos[0] es la primera matriz, pesos[1] la segunda, y así (se empieza a contar en 0).

# PASO 1. Cinco True o False, uno por matriz, guardados en colapsan.
# Por qué: una capa colapsa si aplasta casi todo el plano sobre una recta, y eso pasa
# cuando el valor absoluto de su determinante es casi 0. Un determinante muy negativo no
# aplasta: solo da la vuelta al plano, por eso se mira el valor absoluto. Y "casi 0" no es
# 0 exacto (puede salir 1e-17), así que se compara con un umbral, no con ==.
# np.linalg.det(pesos) calcula el determinante de las cinco matrices a la vez y devuelve
# un array de 5 números. np.abs(x) quita el signo de cada número de x. Comparar un array
# con un número (x < 1e-6) da un array de True y False, uno por elemento.
# Se espera un array de NumPy con 5 valores True o False.
colapsan = None

# PASO 2. Cuántas matrices colapsan, guardado en cuantas.
# Por qué: contar los True de colapsan dice cuántas capas pierden información.
# colapsan.sum() cuenta los True (cada True vale 1 y cada False vale 0).
# Se espera un número entero en cuantas (envuélvelo en int(...)).
cuantas = None

# Para ver qué vale algo antes de entregar: print(colapsan, cuantas) y pulsa «Ejecutar».
`,
          checks: `_c = isinstance(colapsan, np.ndarray) and colapsan.shape == (5,) and colapsan.dtype == bool
_got = [bool(x) for x in colapsan] if _c else []
_want = [False, True, True, False, False]
_eq0 = _c and _got == [False, False, False, False, False]
_noabs = _c and _got == [False, True, True, True, False]
_big = _c and _got == [False, True, True, False, True]
_ok = _c and _got == _want
_n = isinstance(cuantas, (int, np.integer)) and not isinstance(cuantas, (bool, np.bool_))
check(_c, "\`colapsan\` tiene que ser un array de NumPy con 5 valores \`True\` o \`False\`, uno por matriz.")
check((not _c) or not _eq0, "\`colapsan\` no marca ninguna matriz: un determinante casi cero no vale exactamente 0 y una igualdad exacta no lo detecta. Compara con un umbral pequeño.")
check((not _c) or not _noabs, "\`colapsan\` marca una matriz que no aplasta el plano, solo lo voltea: un determinante muy negativo no es casi cero. Hay que usar el valor absoluto.")
check((not _c) or not _big, "\`colapsan\` marca una matriz cuyo determinante es pequeño pero no menor que el umbral de 1e-6.")
check((not _c) or _eq0 or _noabs or _big or _ok, "\`colapsan\` tiene que ser \`True\` solo para la segunda y la tercera matriz, las que tienen un valor absoluto del determinante menor que 1e-6.")
check((not _ok) or _n, "\`cuantas\` tiene que ser un número entero: cuántas matrices casi aplastan el plano.")
check((not _ok) or (not _n) or cuantas == 2, "\`cuantas\` tiene que valer 2: son las matrices que marca \`colapsan\`.")
`,
          reference:
            'import numpy as np\n\npesos = np.array([\n    [[1, 0], [0, 0.5]],\n    [[0.3, 0.1], [0.9, 0.3]],\n    [[1, 2], [0.5, 1.000000001]],\n    [[0, 1], [1, 0]],\n    [[1, 0], [0, 0.005]],\n])\ncolapsan = np.abs(np.linalg.det(pesos)) < 1e-6\ncuantas = int(colapsan.sum())\n',
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'determinante.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere saber si una matriz aplasta el plano sobre una recta, es decir, si su determinante es cero. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Las filas de `A` son proporcionales, así que su determinante exacto es $0$. Piensa si NumPy lo calcula exactamente.',
        'NumPy calcula con decimales y redondeos. ¿Qué da una igualdad exacta entre un decimal así obtenido y un entero?',
      ],
      explain:
        'Un determinante calculado con decimales arrastra errores de redondeo en las últimas cifras, y una igualdad exacta los toma como una diferencia real. Piensa qué valor tendrá de verdad el determinante de esta matriz y qué contesta entonces la última comparación.',
      solution:
        'La tercera línea está mal. El determinante exacto es $0{,}3\\cdot 0{,}3-0{,}1\\cdot 0{,}9=0$, pero NumPy devuelve algo como `-1.2e-17`, y `det_A == 0` da `False`: la matriz aplasta el plano y el código dice que no. Hay que comparar con tolerancia, por ejemplo `aplasta = np.isclose(det_A, 0)`.',
      lines: [
        'A = np.array([[0.3, 0.1], [0.9, 0.3]])',
        'det_A = np.linalg.det(A)',
        'aplasta = det_A == 0',
      ],
      faultyLine: 2,
    },
    {
      id: 'determinante.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula el área de un paralelogramo a partir de sus lados. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Calcula tú el determinante y comprueba la segunda línea.',
        'Pregúntate qué valores puede tomar un área y cuáles un determinante.',
      ],
      explain:
        'El determinante mide el área y además lleva un signo. Revisa si cada paso respeta lo que puede ser un área.',
      solution:
        'La tercera línea está mal. El determinante $-5$ es correcto, pero el área es su valor absoluto, $5$: un área nunca es negativa. El signo solo dice que $\\vec{v}$ queda a la derecha de $\\vec{u}$, es decir, la orientación.',
      lines: [
        'Los lados del paralelogramo son u = (1, 2) y v = (3, 1), y van en las columnas de A',
        'det A = 1 · 1 − 3 · 2 = −5',
        'Luego el área del paralelogramo es −5',
      ],
      faultyLine: 2,
    },
    {
      id: 'determinante.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento habla de dos capas lineales de $2\\times 2$ seguidas, $W_1$ y luego $W_2$, sin activación en medio. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Para cada capa, el valor absoluto del determinante es el factor de área y el signo es la orientación.',
        'Comprueba cómo se combinan los determinantes de dos transformaciones seguidas.',
      ],
      explain:
        'Revisa cada paso con la regla del determinante de un producto: los factores de área se multiplican y los signos se componen. No hace falta calcular el producto de las matrices.',
      solution:
        'No hay ningún error. Con $\\det W_1=3$ y $\\det W_2=-2$, las áreas se multiplican por $3$ y por $2$ en cada paso, y $W_2$ voltea la orientación. Juntas, $\\det(W_2W_1)=3\\cdot(-2)=-6$: el área se multiplica por $6$ y la orientación queda volteada.',
      lines: [
        'det W₁ = 3 y det W₂ = −2: W₁ multiplica las áreas por 3, y W₂ por 2 y voltea la orientación',
        'Aplicadas una tras otra, las áreas se multiplican por 3 · 2 = 6',
        'Luego det(W₂W₁) = 3 · (−2) = −6: el área se multiplica por 6 y la orientación queda volteada',
      ],
      faultyLine: null,
    },
  ],
};
