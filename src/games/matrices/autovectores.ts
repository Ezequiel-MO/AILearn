import type { Project } from '../../content/schema';
import type { CapaSpec } from '../../engine/labs/capa';
import { py } from '../py';
import { autovectoresWarmup } from './autovectores.calentamiento';
import { RESENAS, capaLab, type CapaOptions } from './datos';

/**
 * La capa recurrente de la escena, la misma en cada paso: estira por 1,5 la diagonal (1, 1) y encoge
 * por 0,5 la (1, −1). Sus dos direcciones propias caen en la rejilla de 0,5 por la que se arrastra v.
 */
const RECURRENTE: CapaOptions = { i: [1, 0.5], j: [0.5, 1], movable: 'none' };

/** El estado de memoria v de una red recurrente que lee reseñas, y la capa aplicada `iterate` veces. */
const memoria = (probe: NonNullable<CapaSpec['probe']>, iterate: number, extra: CapaOptions = {}) =>
  capaLab(RESENAS, { ...RECURRENTE, probe, iterate, ...extra });

/** Lo que miden las metas de las preguntas de iterar. */
const TRAS_CINCO = 'Tamaño de la memoria tras cinco pasos';
const PARTIDA = 'Tamaño del estado de partida';

/**
 * Primer proyecto de la Órbita 2 «Direcciones propias»: una red recurrente aplica la misma capa a su
 * memoria en cada paso. Hay direcciones que la capa no gira, solo estira; sobre ellas la señal explota
 * o se apaga según el autovalor, y cualquier otra acaba alineada con la dominante.
 */
export const autovectores: Project = {
  id: 'autovectores',
  name: 'Autovectores',
  sub: 'Direcciones que la capa solo estira',
  bigPicture: {
    parts: ['linear', 'inspect'],
    text: 'Cada matriz tiene unas direcciones especiales, sus autovectores, que solo estira sin girarlas. Mirar una matriz por esas direcciones es entender qué hace en lo esencial. Es el primer paso para ver dentro de una capa lineal: en vez de una tabla de números, un par de ejes y cuánto estira cada uno.',
  },
  warmup: autovectoresWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'autovectores.ex00.1',
          type: 'laboratorio',
          purpose: {
            why: 'Una red recurrente lee un texto palabra a palabra y guarda lo leído en un estado, su memoria. En cada paso, la misma capa transforma ese estado. Casi todo estado sale girado, con sus rasgos mezclados. Unas pocas direcciones, no.',
            aim: 'Vas a buscar un estado de memoria que la capa recurrente no gire: que salga apuntando hacia donde entró, solo más largo o más corto.',
            takeaway:
              'Esta capa deja dos rectas sin girar: la de $(1, 1)$, que estira por $1{,}5$, y la de $(1, -1)$, que encoge a la mitad. Son sus **autovectores**, y cuánto estira cada una, su **autovalor**. Vale cualquier punto de esas rectas, en los dos sentidos.',
          },
          prompt:
            'Una red recurrente guarda lo que ha leído de una reseña en un estado $\\vec{v}$ con dos rasgos, **intensidad** y **tono**. En cada paso le aplica la misma capa: las reseñas enseñan cómo recoloca la capa todo el plano, y el punto al final del camino es $A\\vec{v}$. Casi todo estado sale girado.\n\nMueve $\\vec{v}$ hasta que la capa no lo gire.',
          hints: [
            'Compara la recta de $\\vec{v}$ con el punto $A\\vec{v}$: si el punto se sale de la recta, la capa ha girado el estado. Fíjate también hacia dónde se tuercen las reseñas.',
            'Prueba estados con los dos rasgos iguales, o con los dos opuestos: sobre esas diagonales, $A\\vec{v}$ se queda en la recta de $\\vec{v}$.',
          ],
          explain:
            'La capa manda el estado a $A\\vec{v}$, la intensidad por $\\hat{\\imath}$ más el tono por $\\hat{\\jmath}$. Sale en la misma recta solo si esa suma es un múltiplo del estado, $A\\vec{v}=\\lambda\\vec{v}$: un **autovector**, con su **autovalor** $\\lambda$. La lectura de cuánto estira A a v da $\\lambda$ cuando el ángulo es $0$.',
          solution:
            'Con $\\vec{v}=(1, 1)$, $A\\vec{v}=(1{,}5;\\ 1{,}5)=1{,}5\\,\\vec{v}$: autovalor $1{,}5$. Con $\\vec{v}=(1, -1)$, $A\\vec{v}=(0{,}5;\\ -0{,}5)=0{,}5\\,\\vec{v}$: autovalor $0{,}5$. Vale cualquier punto de esas dos rectas, largo o corto, en un sentido o en el otro, como $(-2, -2)$. El $(0, 1)$, tentador, sale a $(0{,}5;\\ 1)$: girado unos $27$ grados.',
          lab: memoria({ x: 1, y: 0, movable: true }, 1, { readouts: ['stretch'] }),
          goals: [
            {
              metric: 'img_angle',
              op: 'lte',
              target: 1,
              label: 'Ángulo que gira la capa el estado',
            },
          ],
          solved: { vx: 1, vy: 1 },
        },
        {
          id: 'autovectores.ex00.2',
          type: 'laboratorio',
          purpose: {
            why: 'Al entrenar una red recurrente, la señal recorre la secuencia pasando una y otra vez por la misma capa. Lo que la capa estira en un paso, en veinte pasos lo estira veinte veces seguidas: es la explosión del gradiente, un problema clásico de estas redes.',
            aim: 'Vas a elegir un estado de partida pequeño que crezca lo más posible al pasar cinco veces por la misma capa, y a ver que hay un tope.',
            takeaway:
              'Lo máximo es $1{,}5^5\\approx 7{,}6$ veces el tamaño de partida, y solo lo da la recta que la capa estira por $1{,}5$. Cualquier otra dirección mezcla una parte que crece con otra que se apaga, y crece menos. El autovalor mayor marca el tope.',
          },
          prompt:
            'Ahora la capa se aplica cinco veces seguidas, como en cinco palabras: el camino de puntos va de $\\vec{v}$ a $A^5\\vec{v}$. El estado de partida tiene que ser pequeño, de tamaño $1{,}5$ como mucho. Desde el de ahora, la memoria llega a algo más de $5$.\n\n¿Hasta dónde puede crecer? Consigue que pase de $10$ tras los cinco pasos.',
          hints: [
            'Mira qué tramo del camino se alarga más en cada paso. Al final, todos los pasos van en la misma dirección: es la que más crece.',
            'Pon $\\vec{v}$ sobre la diagonal que la capa estira, con los dos rasgos iguales y tan largo como deje el límite de partida.',
          ],
          explain:
            'Un estado sobre un autovector se multiplica por $\\lambda$ en cada paso: tras cinco, por $\\lambda^5$. Cualquier otro estado es la suma de un trozo en cada recta propia, y cada trozo crece con su propio $\\lambda$. Para crecer lo más posible, todo el estado tiene que ir en la recta del autovalor mayor.',
          solution:
            'Con $\\vec{v}=(1, 1)$, de tamaño $\\sqrt2\\approx 1{,}41$, cada paso multiplica por $1{,}5$: tras cinco, por $1{,}5^5\\approx 7{,}59$, y la memoria llega a $10{,}74$. También vale $(-1, -1)$. Un estado más largo de esa recta, como $(1{,}5;\\ 1{,}5)$, se pasa del límite de partida. El $(1{,}5;\\ 0)$, con el tamaño máximo, solo llega a $8{,}05$: parte de él va en la recta que se apaga.',
          lab: memoria({ x: 1, y: 0, movable: true }, 5),
          goals: [
            { metric: 'iter_norm', op: 'gte', target: 10, label: TRAS_CINCO },
            { metric: 'v_norm', op: 'lte', target: 1.5, label: PARTIDA },
          ],
          solved: { vx: 1, vy: 1 },
        },
        {
          id: 'autovectores.ex00.3',
          type: 'laboratorio',
          purpose: {
            why: 'Lo contrario también pasa: en las direcciones que la capa encoge, lo leído al principio se apaga paso a paso. Es el desvanecimiento del gradiente, y por él una red recurrente sencilla aprende mal lo que depende del principio de un texto largo.',
            aim: 'Vas a buscar un estado de partida de buen tamaño que, tras cinco pasos por la misma capa, casi desaparezca de la memoria.',
            takeaway:
              'Sobre la recta de autovalor $0{,}5$, cada paso deja la mitad: tras cinco, $0{,}5^5\\approx 0{,}03$ del estado. Pero hay que estar justo en ella: la menor parte en otra dirección crece con $1{,}5$ y acaba mandando. Olvidar una dirección del todo es frágil.',
          },
          prompt:
            'La misma capa, cinco pasos. Ahora se busca lo contrario: un estado de partida de tamaño $1$ o más que, al cabo de los cinco pasos, se haya casi borrado de la memoria.\n\nMueve $\\vec{v}$ hasta que la memoria se apague.',
          hints: [
            'Busca la recta en la que los puntos del camino se acercan al origen en vez de alejarse. Cerca de ella no basta: mira adónde va el último punto.',
            'Pon $\\vec{v}$ con los dos rasgos del mismo tamaño y de signo contrario: es la dirección que la capa encoge.',
          ],
          explain:
            'En la recta que la capa encoge, el estado se multiplica por $0{,}5$ en cada paso. Si $\\vec{v}$ se sale un poco de ella, tiene un trozo en la recta que se estira por $1{,}5$: ese trozo crece cinco veces seguidas y la memoria no se apaga.',
          solution:
            'Con $\\vec{v}=(1, -1)$, tras cinco pasos queda $\\sqrt2\\cdot 0{,}5^5\\approx 0{,}044$. Valen $(-1{,}5;\\ 1{,}5)$ y cualquier punto de esa recta, en los dos sentidos, hasta $(2, -2)$: el $(2{,}5;\\ -2{,}5)$ ya deja $0{,}11$. El $(1;\\ -0{,}5)$, casi en la recta, acaba en $2{,}7$: lo poco que tenía en la otra dirección ha crecido.',
          lab: memoria({ x: 1, y: 0, movable: true }, 5),
          goals: [
            { metric: 'iter_norm', op: 'lte', target: 0.1, label: TRAS_CINCO },
            { metric: 'v_norm', op: 'gte', target: 1, label: PARTIDA },
          ],
          solved: { vx: 1, vy: -1 },
        },
        {
          id: 'autovectores.ex00.4',
          type: 'laboratorio',
          purpose: {
            why: 'Antes de entrenar, los pesos de una red se eligen al azar, pero no de cualquier manera. Si una capa recurrente estira la señal, explota; si la encoge, se apaga. Por eso hay inicializaciones pensadas para conservar su tamaño, como las matrices ortogonales, que solo giran.',
            aim: 'Vas a cambiar las columnas de la capa que hacía explotar la memoria para que el estado llegue al quinto paso con su tamaño de partida, sin aplastar el plano.',
            takeaway:
              'Basta con que la capa deje el estado con su tamaño: con $A\\vec{v}=\\vec{v}$, un autovalor $1$, o con una capa que solo gira. Lo que no vale es aplastar: una capa sin área conserva esa dirección y borra las demás.',
          },
          prompt:
            'Esta es la capa que hacía explotar la memoria: con el estado $\\vec{v}$ fijo, tras cinco pasos pasa de $1{,}41$ a más de $10$. Ahora lo que se mueve es la capa.\n\nCambia sus columnas para que la memoria llegue al quinto paso con un tamaño parecido al de partida, sin que la capa aplaste el plano.',
          hints: [
            'El estado tiene los dos rasgos iguales a $1$, así que $A\\vec{v}$ es la suma de las dos columnas. Mira dónde cae ahora el primer punto del camino.',
            'Acorta $\\hat{\\imath}$ hasta que la suma de las dos columnas vuelva a ser el propio estado. Vigila que el cuadrado unidad no se quede sin área.',
          ],
          explain:
            'Tras cinco pasos, el estado ha pasado cinco veces por la capa. Si $A\\vec{v}=\\vec{v}$, cada paso lo deja igual. También vale que la capa lo gire sin cambiarle el tamaño. Con área $0$ se conserva $\\vec{v}$, pero el plano entero cae en una recta.',
          solution:
            'Con $\\hat{\\imath}$ en $(0{,}5;\\ 0)$ y $\\hat{\\jmath}$ en $(0{,}5;\\ 1)$, $A\\vec{v}=(1, 1)=\\vec{v}$: autovalor $1$, y el área es $0{,}5$. Valen muchas más: la identidad, o $\\hat{\\imath}$ en $(0, 1)$ y $\\hat{\\jmath}$ en $(-1, 0)$, un giro de un cuarto de vuelta. Con las dos columnas en $(0{,}5;\\ 0{,}5)$ también $A\\vec{v}=\\vec{v}$, pero el área es $0$: todo el plano cae sobre la diagonal.',
          lab: capaLab(RESENAS, {
            i: [1, 0.5],
            j: [0.5, 1],
            probe: { x: 1, y: 1, movable: false },
            iterate: 5,
          }),
          goals: [
            { metric: 'iter_norm', op: 'gte', target: 1.2, label: TRAS_CINCO },
            { metric: 'iter_norm', op: 'lte', target: 1.6, label: TRAS_CINCO },
            {
              metric: 'area',
              op: 'gte',
              target: 0.5,
              label: 'Área que deja la capa al cuadrado unidad',
            },
          ],
          solved: { ix: 0.5, iy: 0 },
        },
        {
          id: 'autovectores.ex00.5',
          type: 'laboratorio',
          purpose: {
            why: 'PageRank, el algoritmo con el que Google empezó a ordenar la web, aplica la misma matriz a un vector de puntuaciones una y otra vez. Da igual por dónde empiece: el vector acaba apuntando al autovector dominante, y esa dirección es la clasificación.',
            aim: 'Vas a elegir un estado de partida que la capa sí gire y a mirar adónde apunta su camino después de seis pasos.',
            takeaway:
              'Desde casi cualquier estado, el camino acaba en la recta de autovalor $1{,}5$: lo que crece tapa a lo que se apaga. Es la **iteración de potencias**. La otra recta propia tampoco se tuerce, pero su camino se apaga.',
          },
          prompt:
            'La misma capa, ahora seis pasos. Este estado de partida está en una recta que la capa no gira, y su camino no se tuerce nunca.\n\nElige uno que la capa sí gire en el primer paso y mira el camino: consigue que, al final, el último paso ya casi no gire.',
          hints: [
            'Mira los primeros tramos del camino: se tuercen. Los últimos van todos en la misma dirección. ¿Cuál es?',
            'Saca $\\vec{v}$ de las dos diagonales: casi cualquier estado vale. Si el giro del primer paso se queda corto, aléjalo más de ellas.',
          ],
          explain:
            'Un estado cualquiera es un trozo en la recta que la capa estira por $1{,}5$ más otro en la que encoge por $0{,}5$. Tras seis pasos, el primer trozo se ha multiplicado por $11{,}4$ y el segundo por $0{,}016$: lo que queda apunta casi solo en la dirección dominante.',
          solution:
            'Con $\\vec{v}=(1, 0)$, la capa lo gira $27$ grados en el primer paso, y el último paso gira menos de medio grado: el camino ya va por la diagonal $(1, 1)$. Vale casi cualquier estado fuera de las diagonales, como $(-2, 1)$ o $(0, 3)$. En $(-1, 1)$, el de partida, el camino no gira nunca, pero se apaga: no es la dirección dominante.',
          lab: memoria({ x: -1, y: 1, movable: true }, 6),
          goals: [
            {
              metric: 'iter_turn',
              op: 'lte',
              target: 1,
              label: 'Ángulo que gira el último paso',
            },
            {
              metric: 'img_angle',
              op: 'gte',
              target: 20,
              label: 'Ángulo que gira la capa el estado de partida',
            },
          ],
          solved: { vx: 1, vy: 0 },
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'autovectores.ex01.1',
          type: 'numero',
          purpose: {
            why: 'Para saber si una red recurrente va a explotar o a olvidar no hace falta seguirla cientos de pasos: basta con saber cuánto estira la capa sus direcciones propias. Ese número, el autovalor, sale de multiplicar una vez.',
            aim: 'Vas a calcular por cuánto multiplica una capa recurrente un estado que no gira, a partir de sus pesos y del estado.',
            takeaway:
              'La capa lleva $(1, 1)$ a $(1{,}6;\\ 1{,}6)$: autovalor $1{,}6$. Tras diez pasos, ese estado sería $1{,}6^{10}\\approx 110$ veces más grande. Un autovalor algo mayor que $1$ ya basta para que la memoria explote.',
          },
          prompt:
            'Una capa recurrente tiene estos pesos:\n\n$$A=\\begin{pmatrix}1{,}2&0{,}4\\\\0{,}2&1{,}4\\end{pmatrix}$$\n\nEl estado $\\vec{v}=(1, 1)$ es una dirección que la capa no gira. ¿Por cuánto lo multiplica en cada paso? En el laboratorio puedes mover $\\vec{v}$ y mirar el camino.',
          hints: [
            'Calcula $A\\vec{v}$: cada rasgo de la salida es una fila de $A$ por el estado.',
            'Compara $A\\vec{v}$ con $(1, 1)$: el número por el que hay que multiplicar es el mismo en los dos rasgos.',
          ],
          explain:
            'Si $\\vec{v}$ no gira, $A\\vec{v}=\\lambda\\vec{v}$, y $\\lambda$ se lee comparando cualquier rasgo de $A\\vec{v}$ con el de $\\vec{v}$. Tiene que salir el mismo en los dos; si no, el estado sí gira.',
          solution:
            '$A\\vec{v}=(1{,}2+0{,}4;\\ 0{,}2+1{,}4)=(1{,}6;\\ 1{,}6)=1{,}6\\cdot(1, 1)$: el autovalor es $1{,}6$. La otra dirección propia de esta capa es $(2, -1)$, con autovalor $1$: la deja igual. Si te sale $1{,}2$ o $1{,}4$, has leído un peso de la diagonal en vez de multiplicar.',
          lab: capaLab(RESENAS, {
            i: [1.2, 0.2],
            j: [0.4, 1.4],
            movable: 'none',
            probe: { x: 1, y: 1, movable: true },
            iterate: 1,
          }),
          answer: 1.6,
          tol: 0,
        },
        {
          id: 'autovectores.ex01.2',
          type: 'vector',
          purpose: {
            why: 'Una capa recurrente con autovalores de $1{,}1$ y $0{,}9$ parece casi neutra: un $10$ % de más y un $10$ % de menos. Pero una frase tiene decenas de palabras, y la señal pasa por la capa una vez por palabra.',
            aim: 'Vas a calcular por cuánto queda multiplicado, tras diez pasos, un estado en cada una de las dos direcciones propias de una capa.',
            takeaway:
              'Tras diez pasos, una dirección ha crecido a $2{,}59$ veces y la otra ha bajado a $0{,}35$. Tras cien, serían unas $13\\,800$ veces y $0{,}00003$: en un texto largo, una se desboca y la otra se olvida.',
          },
          prompt:
            'Una capa recurrente tiene dos direcciones propias: en una estira por $1{,}1$ y en la otra encoge por $0{,}9$. Un estado de tamaño $1$ sobre cada una pasa por la capa diez veces, una por palabra.\n\n¿Por cuánto queda multiplicado en cada dirección? Escribe los dos factores, primero el de $1{,}1$, con dos decimales.',
          hints: [
            'Cada paso multiplica por el mismo autovalor. Diez pasos son diez multiplicaciones seguidas: una potencia.',
            'Calcula $1{,}1^{10}$ y $0{,}9^{10}$. No es $1+10\\cdot 0{,}1$: el factor se aplica sobre lo que ya ha crecido.',
          ],
          explain:
            'Sobre un autovector, cada paso multiplica por $\\lambda$ lo que hay, no lo que había al principio. Tras $n$ pasos, el factor es $\\lambda^n$. Por encima de $1$ crece cada vez más deprisa, y por debajo se acerca a $0$.',
          solution:
            '$1{,}1^{10}\\approx 2{,}59$ y $0{,}9^{10}\\approx 0{,}35$. Si te sale $2$ y $0$, has sumado y restado el $10$ % del principio diez veces en vez de multiplicar. Con cien pasos, $1{,}1^{100}\\approx 13\\,781$ y $0{,}9^{100}\\approx 0{,}00003$.',
          answer: [2.59, 0.35],
          tol: 0.01,
        },
        {
          id: 'autovectores.ex01.3',
          type: 'opcion',
          purpose: {
            why: 'Una dirección con autovalor $1$ es una memoria perfecta: la capa la deja igual paso tras paso, ni crece ni se olvida. Encontrar esas direcciones dice qué puede recordar una red recurrente sin desbocarse.',
            aim: 'Vas a decidir cuál de cuatro estados es una dirección que esta capa no gira, probándolos en el laboratorio o multiplicando.',
            takeaway:
              'Solo $(2, 1)$ sale igual: $A(2, 1)=(2, 1)$, autovalor $1$. Los otros tres giran, aunque alguno, como $(0, 1)$, conserve su tamaño: no girar y no cambiar de tamaño son cosas distintas.',
          },
          prompt:
            'Una capa recurrente tiene estos pesos:\n\n$$A=\\begin{pmatrix}0{,}5&1\\\\0{,}5&0\\end{pmatrix}$$\n\n¿Cuál de estos estados es una dirección que la capa no gira? Puedes poner $\\vec{v}$ en cada uno y mirar el camino.',
          hints: [
            'Un estado que no gira tiene el punto $A\\vec{v}$ sobre su propia recta.',
            'Calcula $A\\vec{v}$ para cada opción: cada rasgo de la salida es una fila de $A$ por el estado. Compáralo con el estado.',
          ],
          explain:
            'No girar es salir en la misma recta: $A\\vec{v}=\\lambda\\vec{v}$, con el mismo $\\lambda$ en los dos rasgos. Que la salida tenga el mismo tamaño que el estado no basta.',
          solution:
            '$A(1, 0)=(0{,}5;\\ 0{,}5)$, girado $45$ grados. $A(1, 1)=(1{,}5;\\ 0{,}5)$, girado. $A(2, 1)=(2, 1)$: no gira, con autovalor $1$. $A(0, 1)=(1, 0)$: mismo tamaño, pero girado un cuarto de vuelta. La otra dirección propia de esta capa es $(1, -1)$, con autovalor $-0{,}5$: le da la vuelta y la encoge.',
          lab: capaLab(RESENAS, {
            i: [0.5, 0.5],
            j: [1, 0],
            movable: 'none',
            probe: { x: 1, y: 0, movable: true },
            iterate: 1,
          }),
          options: ['$(1, 0)$', '$(1, 1)$', '$(2, 1)$', '$(0, 1)$'],
          correct: 2,
        },
        {
          id: 'autovectores.ex01.4',
          type: 'numero',
          purpose: {
            why: 'Hay redes que no entrenan su capa recurrente: la eligen al azar y la reescalan para que su autovalor de mayor tamaño quede por debajo de $1$. Son las redes de estado de eco. Reescalar es multiplicar todos los pesos por un mismo número.',
            aim: 'Vas a calcular por cuánto hay que multiplicar los pesos de una capa para que su autovalor mayor pase a valer $1$.',
            takeaway:
              'Multiplicar la capa por $c$ multiplica por $c$ todos sus autovalores, y las direcciones propias no cambian. Con $c=0{,}5$, el $2$ pasa a $1$ y el $1$, a $0{,}5$: la memoria ya no explota, aunque una dirección se va olvidando.',
          },
          prompt:
            'Esta capa recurrente estira la diagonal $(1, 1)$ por $2$ y deja igual la $(1, -1)$:\n\n$$A=\\begin{pmatrix}1{,}5&0{,}5\\\\0{,}5&1{,}5\\end{pmatrix}$$\n\n¿Por qué número hay que multiplicar todos sus pesos para que el autovalor mayor pase a ser $1$? En el laboratorio puedes acortar las columnas y mirar el camino.',
          hints: [
            'Si todos los pesos se multiplican por $c$, también $A\\vec{v}$ se multiplica por $c$: el autovalor pasa de $\\lambda$ a $c\\lambda$.',
            'Busca el $c$ con $c\\cdot 2=1$. Comprueba en el laboratorio que, con las columnas a ese tamaño, el camino de $(1, 1)$ no crece.',
          ],
          explain:
            'Escalar la capa no cambia qué direcciones no gira: solo cuánto las estira. Cada autovalor queda multiplicado por el mismo número, así que basta con mirar el mayor.',
          solution:
            '$c=0{,}5$: los pesos pasan a $\\begin{pmatrix}0{,}75&0{,}25\\\\0{,}25&0{,}75\\end{pmatrix}$, el autovalor $2$ pasa a $1$ y el $1$, a $0{,}5$. Si te sale $2$, has dividido al revés. Las redes de estado de eco suelen dejarlo algo por debajo de $1$, para que la memoria se apague despacio.',
          lab: capaLab(RESENAS, {
            range: 5,
            snap: 0.25,
            i: [1.5, 0.5],
            j: [0.5, 1.5],
            probe: { x: 1, y: 1, movable: false },
            iterate: 3,
          }),
          answer: 0.5,
          tol: 0,
        },
        {
          id: 'autovectores.ex01.5',
          type: 'numero',
          purpose: {
            why: 'La iteración de potencias, la de PageRank, encuentra el autovector dominante aplicando la matriz una y otra vez. Cuántas vueltas necesita depende de un cociente: el segundo autovalor entre el primero. Cuanto más pequeño, antes se borra lo que sobra.',
            aim: 'Vas a contar cuántos pasos de una capa hacen falta para que la parte de un estado fuera de la dirección dominante quede por debajo del $1$ %.',
            takeaway:
              'Cada paso divide entre $3$ la parte que sobra, comparada con la dominante: tras cinco, queda menos del $0{,}5$ %. Con dos autovalores parecidos, el mismo trabajo pide muchos más pasos.',
          },
          prompt:
            'La capa recurrente de las reseñas estira la diagonal $(1, 1)$ por $1{,}5$ y encoge la $(1, -1)$ por $0{,}5$. El estado $\\vec{v}=(1, 0)$ lleva lo mismo de cada una: $\\tfrac12(1, 1)+\\tfrac12(1, -1)$.\n\n¿Tras cuántos pasos es la parte de $(1, -1)$ menos del $1$ % de la de $(1, 1)$?',
          hints: [
            'En cada paso, la parte de $(1, 1)$ se multiplica por $1{,}5$ y la de $(1, -1)$ por $0{,}5$: su cociente se multiplica por $1/3$.',
            'Busca el primer $n$ con $(1/3)^n<0{,}01$. Puedes contar los pasos en el camino del laboratorio.',
          ],
          explain:
            'Las dos partes empiezan iguales. Tras $n$ pasos, la que sobra es $(0{,}5/1{,}5)^n=(1/3)^n$ veces la dominante. Hay que ver cuándo baja del $1$ %, es decir, de $0{,}01$.',
          solution:
            '$(1/3)^4=1/81\\approx 0{,}012$, todavía por encima del $1$ %, y $(1/3)^5=1/243\\approx 0{,}004$, ya por debajo: hacen falta $5$ pasos. Con autovalores $1{,}5$ y $1{,}2$, el cociente sería $0{,}8$ y harían falta $21$.',
          lab: memoria({ x: 1, y: 0, movable: true }, 6),
          answer: 5,
          tol: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'autovectores.ex02.1',
          type: 'codigo',
          prompt:
            '`np.linalg.eig(A)` devuelve **dos** resultados a la vez: los autovalores, en un array, y los autovectores, que van en las **columnas** de una matriz. Ya tienes `A`. Guarda en `vals` y `vecs` esos dos resultados; en `lam`, el autovalor mayor; en `v`, su autovector, el que le corresponde; y en `ok`, si `A @ v` y `lam * v` coinciden, comparados con `np.allclose` (un solo `True` o `False`).',
          hints: [
            'El plan: llama a `np.linalg.eig(A)` y guarda sus dos resultados a la vez en `vals` y `vecs`. NumPy no garantiza en qué orden entrega los autovalores, así que el mayor no tiene por qué ir primero: busca su posición con `np.argmax` y guárdala en una variable `k`. Con esa posición sacas `lam` de `vals` y `v` de `vecs`. Por último, `ok` es la comparación de `A @ v` con `lam * v` hecha con `np.allclose`. Cuidado: el autovector del autovalor `k` es la columna `k` de `vecs`, no la fila `k`.',
            'Las piezas, con otra matriz y otros números:\n\n' +
              py(
                'B = np.array([[2, 0], [0, 3]])',
                'w, U = np.linalg.eig(B)   # una llamada, dos resultados: w los autovalores y U los autovectores',
                'print(w)                  # [2. 3.]: con esta matriz salen así; en general NumPy no promete el orden',
                'print(U)                  # dos filas, [1. 0.] y [0. 1.]: cada COLUMNA es un autovector',
                'k = np.argmax(w)          # la POSICIÓN del valor más alto de w',
                'print(k, w[k])            # 1 3.0: la posición y el autovalor que hay en ella',
                'print(U[:, k])            # [0. 1.]: la columna 1, el autovector del autovalor 3',
                'print(U[0])               # [1. 0.]: la fila 0, que NO es un autovector de ese 3',
                'print(np.allclose(B @ U[:, k], w[k] * U[:, k]))   # True: ¿coinciden salvo el redondeo?',
              ) +
              '\n\nEn `U[:, k]` los dos puntos significan «todas las filas» y `k` elige la columna: así se saca una columna entera. Con `U[0]` se saca una fila, y eso no es un autovector.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'vals, vecs = np.linalg.eig(___)',
                'k = np.___(vals)',
                'lam = vals[k]',
                'v = vecs[___, k]',
                'ok = np.allclose(A @ v, ___ * v)',
              ) +
              '\n\nEl error típico es sacar una fila de `vecs` en vez de una columna: los dos puntos van delante de la coma, para quedarte con la columna entera.',
          ],
          explain:
            'Los autovalores y los autovectores van emparejados por posición: el autovalor número `k` y la columna número `k`. Si tomas una fila de la matriz, tienes unos números que no son un autovector, y la comprobación sale `False` aunque el autovalor sea el correcto. Tampoco se debe suponer que el mayor autovalor va primero.',
          solution:
            '`vals, vecs = np.linalg.eig(A)`; con `k = np.argmax(vals)` se obtiene la posición del mayor, `lam = vals[k]` y `v = vecs[:, k]`, la columna entera. Salen $\\lambda=5$ y un vector proporcional a $(1, 1)$ (NumPy lo entrega de norma $1$, y el signo puede variar), y `A @ v` coincide con `lam * v` salvo el redondeo, por eso se compara con `np.allclose` y no con `==`. Con la fila `vecs[0]` no sale un autovector, y con `np.argmin` saldría el autovalor $2$.',
          requirements: [
            '`vals` y `vecs` son arrays de NumPy: los autovalores de `A` y la matriz de 2 filas y 2 columnas de sus autovectores, tal como los devuelve la función.',
            '`lam` es un número: el autovalor de mayor valor. No se puede suponer en qué posición lo entrega NumPy.',
            '`v` es un array de NumPy con 2 números: un autovector de `A` que corresponde a `lam`.',
            '`ok` es un solo `True` o `False`, y dice que `A @ v` y `lam * v` coinciden salvo el error de redondeo.',
          ],
          starter: `import numpy as np

# A es la matriz de 2 filas y 2 columnas de la que buscamos los autovectores.
A = np.array([[4, 1], [2, 3]])

# Un autovector de A es un vector que A no gira: solo lo estira (o lo encoge) por un número, su autovalor.
# Aquí: A @ v == lam * v.

# PASO 1. Los autovalores y los autovectores de A, los dos a la vez.
# np.linalg.eig(A) devuelve DOS cosas, y se recogen con dos nombres a la izquierda del =, separados
# por coma: igual que x, y = (1, 2) deja 1 en x y 2 en y.
# El primero es un array con los autovalores; el segundo, una matriz de 2 filas y 2 columnas
# con los autovectores, un autovector en cada COLUMNA.
# Por qué los dos a la vez: van emparejados por posición, el autovalor número k con la columna número k.
vals = None
vecs = None

# PASO 2. El autovalor mayor, en lam (un número).
# NumPy no promete en qué orden entrega los autovalores, así que no vale suponer que el mayor va primero.
# np.argmax(un_array) da la POSICIÓN del valor más alto: np.argmax([7, 3, 9]) vale 2.
# Con la posición, vals[posición] es el valor. Guarda la posición en una variable intermedia para el paso 3.
lam = None

# PASO 3. El autovector de ese autovalor, en v (un array con 2 números).
# Es la columna de vecs que tiene la MISMA posición que lam en vals.
# En una matriz M, M[:, 1] es la columna 1 entera (los dos puntos: «todas las filas»), y M[1] es la fila 1.
# Un autovector va en columna: con una fila salen números que no son un autovector.
v = None

# PASO 4. Si A @ v coincide con lam * v, en ok (un solo True o False).
# Por qué no con ==: los decimales llevan un error diminuto de redondeo, y == lo ve como una diferencia.
# np.allclose(a, b) dice True si a y b son casi iguales, y hace la comparación con ese margen.
ok = None

# Para ver qué vale algo antes de entregar: print(vals) y pulsa «Ejecutar».
`,
          checks: `_n = lambda x: isinstance(x, (int, float, np.integer, np.floating)) and not isinstance(x, (bool, np.bool_))
_a = lambda x, s: isinstance(x, np.ndarray) and x.shape == s and np.issubdtype(x.dtype, np.number) and not np.iscomplexobj(x)
_vals = _a(vals, (2,))
_vecs = _a(vecs, (2, 2))
_lam = _n(lam)
_v = _a(v, (2,))
_b = isinstance(ok, (bool, np.bool_))
_lam5 = _lam and bool(np.isclose(lam, 5))
_vok = _v and bool(np.linalg.norm(v) > 1e-9) and bool(np.allclose(A @ v, 5 * v))
_row = _v and _vecs and any(bool(np.allclose(v, r)) or bool(np.allclose(v, -r)) for r in vecs)
check(_vals, "\`vals\` tiene que ser un array de NumPy con los 2 autovalores: el primer resultado de \`np.linalg.eig\`.")
check((not _vals) or bool(np.allclose(np.sort(vals), [2, 5])), "\`vals\` tiene que contener los dos autovalores de \`A\`.")
check(_vecs, "\`vecs\` tiene que ser un array de NumPy de 2 filas y 2 columnas: el segundo resultado de \`np.linalg.eig\`.")
check((not _vecs) or (not _vals) or bool(np.allclose(A @ vecs, vecs * vals)), "\`vecs\` tiene que ser lo que devuelve \`np.linalg.eig\` junto a \`vals\`: cada autovector va en una columna, emparejado con el autovalor de su misma posición.")
check(_lam, "\`lam\` tiene que ser un número: el autovalor mayor de \`A\`.")
check((not _lam) or not np.isclose(lam, 2), "\`lam\` vale 2, el autovalor menor. Se pide el mayor.")
check((not _lam) or _lam5 or np.isclose(lam, 2), "\`lam\` tiene que ser el autovalor mayor de \`A\`.")
check(_v, "\`v\` tiene que ser un array de NumPy con 2 números: un autovector de \`A\`.")
check((not _lam5) or (not _row) or _vok, "\`v\` es una fila de \`vecs\`, y los autovectores van en las columnas. Una fila no cumple la definición de autovector.")
check((not _lam5) or (not _v) or _row or _vok, "\`v\` tiene que ser el autovector que corresponde a \`lam\`: un vector no nulo con \`A @ v\` igual a \`lam * v\`.")
check(_b, "\`ok\` tiene que ser un solo \`True\` o \`False\`: el resultado de \`np.allclose\`.")
check((not _b) or (not _vok) or bool(ok), "\`ok\` vale \`False\`: \`A @ v\` y \`lam * v\` solo difieren en el redondeo. Compáralos con \`np.allclose\` y no con \`==\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[4, 1], [2, 3]])\nvals, vecs = np.linalg.eig(A)\nk = np.argmax(vals)\nlam = vals[k]\nv = vecs[:, k]\nok = np.allclose(A @ v, lam * v)\n',
        },
        {
          id: 'autovectores.ex02.2',
          type: 'codigo',
          prompt:
            'Escribe `es_autovector(A, v)`, que recibe una matriz `A` de 2 filas y 2 columnas y un vector `v` de 2 números (arrays de NumPy) y devuelve `True` si `v` es un autovector de `A`: `v` no es el vector nulo y $A\\vec{v}$ queda en la recta de $\\vec{v}$, con el mismo sentido o con el opuesto. Después guarda en `propio` lo que devuelve la función para $A=\\begin{pmatrix}3&1\\\\0&2\\end{pmatrix}$ y $\\vec{v}=(1, -1)$.',
          hints: [
            'El plan: dentro de la función, calcula `w = A @ v`, la imagen de `v`. Si `v` es el vector nulo, devuelve `False` enseguida: el vector nulo no cuenta como autovector. En otro caso, `v` es un autovector si `w` queda en su misma recta, y eso se comprueba con el determinante de la matriz que forman `v` y `w`, que vale $0$ cuando están en la misma recta. Con decimales, «vale $0$» se comprueba con `np.isclose` y no con `==`. Después llama a la función con los datos del enunciado y guarda el resultado en `propio`. Cuidado: un autovector puede tener autovalor negativo o cero, así que no pidas que `w` apunte al mismo lado.',
            'Las piezas, con otros números:\n\n' +
              py(
                'u = np.array([2, 5])',
                'z = np.array([4, 10])',
                'print(u[0] * z[1] - u[1] * z[0])         # 0: el determinante de u y z, y z está en la recta de u',
                'print(np.isclose(0.1 + 0.2, 0.3))        # True: casi iguales, con margen de redondeo',
                'print(0.1 + 0.2 == 0.3)                  # False: con == el redondeo estorba',
                'print(np.allclose(np.array([0, 0]), 0))  # True: todos los números son casi 0 (así se detecta el vector nulo)',
                '',
                'def es_par(n):',
                '    if n % 2 == 1:      # si se cumple, se ejecuta la línea con sangría de debajo',
                '        return False    # return sale de la función con ese valor',
                '    return True         # si no se salió antes, se llega aquí',
                '',
                'print(es_par(3), es_par(4))   # False True',
              ) +
              '\n\nLa sangría (los espacios al inicio de una línea) marca qué líneas pertenecen a la función o al `if`. El determinante de dos vectores `a` y `b` es `a[0] * b[1] - a[1] * b[0]`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def es_autovector(A, v):',
                '    w = A @ ___',
                '    if np.allclose(v, 0):',
                '        return ___',
                '    return bool(np.isclose(v[0] * w[1] - v[1] * w[0], ___))',
                '',
                'propio = es_autovector(np.array([[3, 1], [0, 2]]), np.array([1, -1]))',
              ) +
              '\n\nEl error típico es devolver `True` para el vector nulo, o exigir que `w` apunte al mismo lado que `v`: así se pierden los autovectores de autovalor negativo.',
          ],
          explain:
            'El vector nulo cumple $A\\vec{0}=\\lambda\\vec{0}$ para cualquier $\\lambda$, y por eso se excluye por definición. Que $A\\vec{v}$ apunte al lado opuesto de $\\vec{v}$ o valga $\\vec{0}$ no impide que $\\vec{v}$ sea un autovector: $\\lambda$ puede ser negativo o cero. Con decimales, una igualdad exacta falla por el redondeo.',
          solution:
            'Se calcula `w = A @ v`; si `v` es nulo se devuelve `False`; en otro caso se comprueba con `np.isclose` que el determinante de `v` y `w`, `v[0] * w[1] - v[1] * w[0]`, vale $0$. Con los datos del enunciado, $A\\vec{v}=(2, -2)=2\\vec{v}$, luego `propio` vale `True`. Los errores típicos son contestar `True` para el vector nulo, exigir el mismo sentido (se pierden los autovalores negativos), o comparar con `==` (con decimales, falla).',
          requirements: [
            '`es_autovector` es una función que recibe `A`, un array de NumPy de 2 filas y 2 columnas, y `v`, un array con 2 números, y devuelve un solo `True` o `False`.',
            'Se llama a la función con otras matrices y vectores además de los del enunciado: autovectores de autovalor positivo, negativo y cero, vectores que no lo son, el vector nulo y datos con decimales; no debe dar error.',
            'El vector nulo no es un autovector. Un vector que la matriz aplasta en el vector nulo sí lo es.',
            'Los decimales se aceptan salvo un error diminuto de redondeo.',
            '`propio` es un solo `True` o `False`: lo que devuelve la función con los datos del enunciado.',
          ],
          starter: `import numpy as np


# PASO 1. La función es_autovector(A, v).
# Recibe A, un array de NumPy de 2 filas y 2 columnas, y v, un array con 2 números.
# Devuelve un solo True o False: True si v es un autovector de A.
# Por qué: v es un autovector si A @ v queda en la misma recta que v (aunque apunte al lado contrario),
# y además v no puede ser el vector nulo, que cumple eso con cualquier matriz y por eso no cuenta.
# Cómo se comprueba, dentro de la función (la sangría, los espacios del inicio de cada línea, dice que
# esas líneas son de la función):
#   - w = A @ v es la imagen de v. Guárdala en una variable.
#   - np.allclose(v, 0) dice True si todos los números de v son casi 0, es decir, si v es el vector nulo.
#     Con un if que lo detecte, la función sale con return False.
#   - Dos vectores a y b están en la misma recta si su determinante a[0] * b[1] - a[1] * b[0] vale 0.
#     Con decimales no se compara con ==: np.isclose(x, 0) dice True si x es casi 0.
#   - np.isclose devuelve un tipo de NumPy; envuélvelo en bool(...) para devolver un True o False normal.
def es_autovector(A, v):
    return None


# PASO 2. Lo que devuelve la función para A = [[3, 1], [0, 2]] y v = [1, -1].
# Llama a la función con np.array([[3, 1], [0, 2]]) y np.array([1, -1]) (la matriz y el vector van
# como arrays de NumPy) y guarda el resultado, un solo True o False.
propio = None

# Para ver qué vale algo antes de entregar: print(propio) y pulsa «Ejecutar».
`,
          checks: `_f = callable(globals().get("es_autovector"))
def _call(A, v):
    try:
        with np.errstate(all="ignore"):
            return es_autovector(np.array(A), np.array(v))
    except Exception:
        return None
_cases = [
    ([[3, 1], [0, 2]], [1, -1]),
    ([[0, 1], [1, 0]], [1, -1]),
    ([[2, 1], [4, 2]], [1, -2]),
    ([[2, 1], [1, 2]], [1, 0]),
    ([[2, 1], [1, 2]], [0, 0]),
    ([[0.5, 0.2], [0.2, 0.8]], [0.1, 0.2]),
    ([[3, 1], [0, 2]], [1, 1]),
    ([[2, 0], [0, 3]], [1, 1]),
    ([[2, 1], [1, 2]], [3, 3]),
]
_r = [_call(A_, v_) for A_, v_ in _cases] if _f else []
_all = _f and all(isinstance(x, (bool, np.bool_)) for x in _r)
_g = [bool(x) for x in _r] if _all else []
_nul = _all and _g[4]
_neg = _all and not _g[1]
_nuc = _all and not _g[2]
_dec = _all and not _g[5]
_fp = _all and (_g[3] or _g[6] or _g[7])
_fn = _all and not (_g[0] and _g[8])
_good = _all and _g == [True, True, True, False, False, True, False, False, True]
check(_f, "Hay que definir una función \`es_autovector\` que reciba la matriz y el vector.")
check((not _f) or _all, "\`es_autovector\` tiene que devolver un solo \`True\` o \`False\`.")
check((not _all) or not _nul, "\`es_autovector\` devuelve \`True\` para el vector nulo. El vector nulo está en la recta de cualquier vector, pero no cuenta como autovector.")
check((not _all) or not _neg, "\`es_autovector\` dice que no a un vector cuya imagen apunta al lado opuesto. Un autovector puede tener autovalor negativo: la imagen vuelve del otro lado pero sigue en la misma recta.")
check((not _all) or not _nuc, "\`es_autovector\` dice que no a un vector que la matriz aplasta en el vector nulo. Ese vector es un autovector de autovalor 0.")
check((not _all) or not _dec, "\`es_autovector\` falla con decimales: dos números que en matemáticas coinciden pueden diferir en el redondeo. Compara con una tolerancia pequeña y no con una igualdad exacta.")
check((not _all) or not _fp, "\`es_autovector\` dice que sí a un vector cuya imagen cambia de dirección. Para estar en su recta, la imagen tiene que ser un múltiplo del vector, no solo más larga o más corta.")
check((not _all) or not _fn or _nul or _neg or _nuc or _dec or _fp, "\`es_autovector\` dice que no a un vector no nulo cuya imagen es un múltiplo positivo suyo; ese vector sí es un autovector.")
check((not _good) or (isinstance(propio, (bool, np.bool_)) and bool(propio)), "\`propio\` tiene que ser \`True\`: es lo que devuelve la función para la matriz y el vector del enunciado.")
`,
          reference: `import numpy as np


def es_autovector(A, v):
    w = A @ v
    if np.allclose(v, 0):
        return False
    return bool(np.isclose(v[0] * w[1] - v[1] * w[0], 0))


propio = es_autovector(np.array([[3, 1], [0, 2]]), np.array([1, -1]))
`,
        },
        {
          id: 'autovectores.ex02.3',
          type: 'codigo',
          prompt:
            'Hay un método para encontrar un autovector sin resolver ninguna ecuación: partir de un vector, multiplicarlo por $A$, dividirlo entre su longitud, y repetir. Cada multiplicación estira más la dirección del autovalor de mayor valor absoluto, y al cabo de muchos pasos solo queda esa dirección. Escribe `iteracion_potencia(A, pasos)`, que parte de `v0` y repite `pasos` veces «multiplicar por `A` y dividir entre la norma», y devuelve el vector final, de norma 1. Después guarda en `direccion` lo que devuelve para $A=\\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$ con $50$ pasos.',
          hints: [
            'El plan: dentro de la función, empieza con `v = v0`. Después un bucle `for _ in range(pasos):` que en cada vuelta hace dos cosas: multiplica, `v = A @ v`, y normaliza, dividiendo `v` entre su longitud, que se calcula con `np.linalg.norm(v)`. Al acabar el bucle, devuelve `v`. Fuera de la función, llámala con la matriz del enunciado y $50$ pasos y guarda el resultado en `direccion`. Cuidado: hay que dividir en cada vuelta; si divides solo al final, los números crecen sin freno y con muchos pasos acaban en `inf`.',
            'Las piezas, con otros números:\n\n' +
              py(
                'x = np.array([3.0, 4.0])',
                'print(np.linalg.norm(x))       # 5.0: la longitud del vector',
                'print(x / np.linalg.norm(x))   # [0.6 0.8]: el mismo vector con longitud 1',
                '',
                'total = 0',
                'for _ in range(3):             # repite lo que tiene sangría debajo 3 veces',
                '    total = total + 10         # cada vuelta cambia total, y la siguiente parte de ese valor',
                'print(total)                   # 30',
              ) +
              '\n\nEl nombre `_` en el `for` significa «no necesito el número de la vuelta». `range(pasos)` cuenta `pasos` vueltas. Una función que no acaba en un `return` con valor devuelve `None`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def iteracion_potencia(A, pasos):',
                '    v = ___',
                '    for _ in range(___):',
                '        v = ___ @ v',
                '        v = v / np.linalg.norm(___)',
                '    return v',
                '',
                'direccion = iteracion_potencia(np.array([[2, 1], [1, 2]]), ___)',
              ) +
              '\n\nEl error típico es normalizar solo después del bucle: dentro, en cada vuelta, es lo que evita que los números se desborden.',
          ],
          explain:
            'Aplicar $A$ muchas veces multiplica cada parte del vector, en la base de autovectores, por una potencia de su autovalor, y la del autovalor de mayor valor absoluto acaba dominando. Dividir entre la norma en cada paso no cambia la dirección y evita que los números se desborden. El signo del resultado puede salir positivo o negativo: la recta es la misma.',
          solution:
            'Un bucle con `for _ in range(pasos)` hace `v = A @ v` y `v = v / np.linalg.norm(v)` en cada vuelta, y al final devuelve `v`. Para $A$ del enunciado sale $\\pm(1, 1)/\\sqrt{2}\\approx\\pm(0{,}71; 0{,}71)$, el autovector de $\\lambda=3$. Sin dividir en cada paso, con mil pasos $3^{1000}$ se desborda a `inf` y todo se vuelve `nan`. Así calcula PageRank el vector que ordena las páginas web, y así se alinea el estado de una red recurrente con la dirección dominante de su matriz.',
          requirements: [
            '`iteracion_potencia` es una función que recibe `A`, un array de NumPy de 2 filas y 2 columnas, y `pasos`, un número entero, y devuelve un array de NumPy con 2 números.',
            'La iteración parte siempre del vector `v0` del código inicial, que no se debe modificar.',
            'Se llama a la función con otras matrices y con hasta mil pasos; no debe dar error ni devolver `nan` o `inf`.',
            'El vector devuelto tiene norma 1 y apunta en la dirección del autovector de mayor valor absoluto, con cualquiera de sus dos sentidos.',
            '`direccion` es un array de NumPy: lo que devuelve la función con los datos del enunciado.',
          ],
          starter: `import numpy as np

v0 = np.array([1.0, 0.0])


# v0 ya está hecho: es el vector de partida, de 2 números. No hace falta tocarlo.

# PASO 1. La función iteracion_potencia(A, pasos).
# Recibe A, un array de NumPy de 2 filas y 2 columnas, y pasos, un número entero.
# Devuelve un array de NumPy con 2 números: el vector final, de longitud 1.
# Por qué: si multiplicas un vector por A una y otra vez, la parte que apunta hacia el autovalor de
# mayor tamaño crece más que las demás, y al final casi solo queda esa dirección. Pero los números
# crecen sin freno, así que en cada vuelta se divide el vector entre su longitud (se «normaliza»).
# Cómo, dentro de la función (la sangría, los espacios del inicio de cada línea, dice qué es de la función):
#   - Empieza con una variable v que valga v0.
#   - Un bucle for _ in range(pasos): repite pasos veces las líneas con sangría que tiene debajo.
#   - En cada vuelta: multiplica con v = A @ v, y después divide v entre su longitud, que da np.linalg.norm(v).
#   - Cuando acaba el bucle, return v devuelve el vector final.
def iteracion_potencia(A, pasos):
    return None


# PASO 2. Lo que devuelve la función para A = [[2, 1], [1, 2]] con 50 pasos.
# Llama a la función con np.array([[2, 1], [1, 2]]) y 50, y guarda el resultado, un array de 2 números.
direccion = None

# Para ver qué vale algo antes de entregar: print(direccion) y pulsa «Ejecutar».
`,
          checks: `_f = callable(globals().get("iteracion_potencia"))
def _call(A, n):
    try:
        with np.errstate(all="ignore"):
            return iteracion_potencia(np.array(A, dtype=float), n)
    except Exception:
        return None
_M = [[[2, 1], [1, 2]], [[4, 1], [2, 3]], [[1, 2], [2, 1]], [[-3, 1], [1, -1]], [[2, 1], [1, 2]]]
_N = [50, 60, 40, 200, 1000]
def _dom(A):
    w, V = np.linalg.eig(np.array(A, dtype=float))
    return V[:, np.argmax(np.abs(w))]
_num = lambda x: isinstance(x, (int, float, np.integer, np.floating)) and not isinstance(x, (bool, np.bool_))
_isvec = lambda x: isinstance(x, np.ndarray) and x.shape == (2,) and np.issubdtype(x.dtype, np.number) and not np.iscomplexobj(x)
_r = [_call(a, n) for a, n in zip(_M, _N)] if _f else []
_scalar = _f and any(_num(x) for x in _r)
_shape = _f and all(_isvec(x) for x in _r)
_fin = _shape and all(bool(np.all(np.isfinite(x))) for x in _r)
_unit = _fin and all(abs(np.linalg.norm(x) - 1) < 1e-6 for x in _r)
_dir = _unit and all(abs(abs(np.dot(x, _dom(a))) - 1) < 1e-6 for x, a in zip(_r, _M))
check(_f, "Hay que definir una función \`iteracion_potencia\` que reciba la matriz y el número de pasos.")
check((not _f) or _shape or _scalar, "\`iteracion_potencia\` tiene que devolver un array de NumPy con 2 números: el vector final.")
check(not _scalar, "\`iteracion_potencia\` devuelve un solo número. Hay que devolver el vector final, de 2 números, y no el autovalor.")
check((not _shape) or _fin, "El vector final tiene \`nan\` o \`inf\`: sin normalizar en cada paso, los números crecen sin freno y con muchos pasos se desbordan. No basta con normalizar solo al final.")
check((not _fin) or _unit, "El vector final no tiene norma 1: falta dividirlo entre su longitud.")
check((not _unit) or _dir, "El vector final tiene norma 1, pero no apunta en la dirección del autovector de mayor valor absoluto. Hay que repetir el paso, multiplicar por la matriz y normalizar, tantas veces como indique \`pasos\`, partiendo de \`v0\`.")
_okd = isinstance(direccion, np.ndarray) and direccion.shape == (2,) and np.issubdtype(direccion.dtype, np.number) and not np.iscomplexobj(direccion)
check((not _dir) or (_okd and abs(abs(float(np.dot(direccion, [1, 1])) / np.sqrt(2)) - 1) < 1e-6 and abs(np.linalg.norm(direccion) - 1) < 1e-6), "\`direccion\` tiene que ser lo que devuelve la función para la matriz del enunciado con 50 pasos: un vector de norma 1 sobre la recta de (1, 1).")
`,
          reference: `import numpy as np

v0 = np.array([1.0, 0.0])


def iteracion_potencia(A, pasos):
    v = v0
    for _ in range(pasos):
        v = A @ v
        v = v / np.linalg.norm(v)
    return v


direccion = iteracion_potencia(np.array([[2, 1], [1, 2]]), 50)
`,
        },
        {
          id: 'autovectores.ex02.4',
          type: 'codigo',
          prompt:
            'Una red recurrente de juguete (las reales tienen cientos de dimensiones) aplica en cada paso una matriz de pesos de $2\\times 2$. Su estado se apaga si todos los autovalores de la matriz son pequeños y explota si alguno es grande. El **radio espectral** de una matriz es el mayor tamaño de sus autovalores, y la red es **estable** si es menor que $1$. Cuidado: los autovalores pueden ser negativos, e incluso complejos. `Ws` guarda cinco de esas matrices. Guarda en `radios` un array con el radio espectral de cada una, y en `estables` un array de cinco valores `True` o `False`: `True` si esa red es estable.',
          hints: [
            'El plan: `np.linalg.eigvals(Ws)` calcula los autovalores de las cinco matrices de una vez y los devuelve en una fila por matriz. Pásalos por `np.abs`, que da el tamaño de cada autovalor: el valor absoluto si es real y el módulo si es complejo. En cada fila, el mayor de esos tamaños es el radio espectral; se saca con `.max(axis=1)`, que busca el mayor a lo largo de cada fila. Eso es `radios`. Para `estables`, compara `radios` con $1$ usando `<`: NumPy compara los cinco a la vez y da cinco `True` o `False`. Cuidado: un autovalor de $-1{,}5$ pesa más que uno de $0{,}5$, así que no tomes el mayor sin pasarlo por `np.abs`.',
            'Las piezas, con otras matrices:\n\n' +
              py(
                'Ms = np.array([[[1, 0], [0, -3]], [[2, 0], [0, 1]]])   # dos matrices apiladas',
                'tam = np.abs(np.linalg.eigvals(Ms))',
                'print(tam)                   # dos filas, [1. 3.] y [2. 1.]: el tamaño de cada autovalor, una fila por matriz',
                'print(tam.max(axis=1))       # [3. 2.]: el mayor de cada fila',
                'print(np.abs(-4), np.abs(3 + 4j))   # 4 5.0: valor absoluto, y módulo de un complejo',
                'print(np.array([0.4, 1.5]) < 1)     # [ True False]: compara cada número con 1',
              ) +
              '\n\n`axis=1` significa «a lo largo de cada fila, una respuesta por fila»; con `axis=0` sería por columnas.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'autovalores = np.linalg.eigvals(___)',
                'radios = np.___(autovalores).max(axis=1)',
                'estables = radios ___ 1',
              ) +
              '\n\nEl error típico es tomar el mayor autovalor sin `np.abs`: un autovalor muy negativo, o complejo, también hace explotar la red.',
          ],
          explain:
            'Lo que importa de un autovalor es su tamaño, no su signo ni su parte real. Un autovalor muy negativo hace explotar el estado igual que uno positivo, y un complejo gira el vector y a la vez lo estira por su módulo. Si tomas el mayor autovalor sin más, o solo su parte real, una red inestable parece estable.',
          solution:
            'Con `np.abs(np.linalg.eigvals(Ws))` se obtiene el tamaño de cada autovalor, y el mayor de cada fila es el radio espectral. Los radios son $1{,}5$; $1{,}2$; $0{,}8$; $0{,}9$ y $1{,}3$, así que `estables` es `False`, `False`, `True`, `True`, `False`. La primera matriz tiene autovalores $0{,}5$ y $-1{,}5$: el mayor sin valor absoluto es $0{,}5$ y parecería estable. La segunda gira el plano y sus autovalores son $\\pm 1{,}2i$, con parte real $0$ y módulo $1{,}2$. La tercera no es diagonal y tiene autovalores $0{,}8$ y $0{,}3$.',
          requirements: [
            '`radios` es un array de NumPy con 5 números reales, uno por cada matriz de `Ws` y en el mismo orden: el mayor tamaño de sus autovalores.',
            'Un autovalor negativo o complejo cuenta por su tamaño, no por su signo ni por su parte real.',
            '`estables` es un array de NumPy con 5 valores `True` o `False`, uno por matriz: `True` solo si el radio espectral de esa matriz es menor que 1.',
          ],
          starter: `import numpy as np

Ws = np.array([
    [[0.5, 1.0], [0.0, -1.5]],
    [[0.0, -1.2], [1.2, 0.0]],
    [[0.6, 0.3], [0.2, 0.5]],
    [[0.9, 0.0], [0.0, -0.7]],
    [[1.3, 0.2], [0.0, 0.3]],
])
# Ws es un array de NumPy de forma (5, 2, 2): cinco matrices de 2 filas y 2 columnas apiladas.
# Ws[0] es la primera matriz, Ws[1] la segunda, y así hasta Ws[4].

# PASO 1. El radio espectral de cada matriz, en radios (un array de 5 números reales).
# El radio espectral es el mayor TAMAÑO entre los autovalores de la matriz. Por qué el tamaño y no el
# valor: un autovalor de -1.5 hace explotar la red igual que uno de 1.5, y uno complejo gira el vector
# y lo estira por su módulo.
# np.linalg.eigvals(Ws) calcula los autovalores de las cinco matrices de una vez: una fila por matriz.
# np.abs(x) da el tamaño de cada número: el valor absoluto si es real y el módulo si es complejo.
# a.max(axis=1) da el mayor de cada fila de a: una respuesta por fila. Así tienes un número por matriz.
radios = None

# PASO 2. Si cada red es estable, en estables (un array de 5 valores True o False).
# Una red es estable si su radio espectral es menor que 1.
# Comparar un array con un número compara cada elemento: np.array([0, 3]) < 1 da [ True False].
estables = None

# Para ver qué vale algo antes de entregar: print(radios) y pulsa «Ejecutar».
`,
          checks: `_r = isinstance(radios, np.ndarray) and radios.shape == (5,) and np.issubdtype(radios.dtype, np.number) and not np.iscomplexobj(radios)
_e = isinstance(estables, np.ndarray) and estables.shape == (5,) and estables.dtype == bool
_want = [1.5, 1.2, 0.8, 0.9, 1.3]
_ok = _r and bool(np.allclose(radios, _want))
_noabs = _r and bool(np.isclose(radios[0], 0.5))
_real = _r and bool(np.isclose(radios[1], 0.0))
_got = [bool(x) for x in estables] if _e else []
check(_r, "\`radios\` tiene que ser un array de NumPy con 5 números reales, uno por matriz de \`Ws\`.")
check((not _r) or not _noabs, "\`radios\` toma el mayor autovalor tal cual, y un autovalor negativo grande, como -1,5, pesa más que uno positivo pequeño. Falta el valor absoluto.")
check((not _r) or not _real, "\`radios\` da 0 para la matriz que gira el plano: sus autovalores son complejos, y su tamaño es el módulo, no la parte real. \`np.abs\` también lo calcula.")
check((not _r) or _noabs or _real or _ok, "\`radios\` tiene que ser el mayor tamaño de los autovalores de cada matriz: el mayor de sus valores absolutos, o módulos si son complejos.")
check(_e, "\`estables\` tiene que ser un array de NumPy con 5 valores \`True\` o \`False\`, uno por matriz.")
check((not _e) or (not _ok) or _got != [True, True, False, False, True], "\`estables\` está al revés: una red es estable cuando su radio es menor que 1, y entonces vale \`True\`.")
check((not _e) or (not _ok) or _got == [False, False, True, True, False] or _got == [True, True, False, False, True], "\`estables\` tiene que ser \`True\` solo donde el radio espectral es menor que 1: la tercera y la cuarta matriz.")
`,
          reference:
            'import numpy as np\n\nWs = np.array([\n    [[0.5, 1.0], [0.0, -1.5]],\n    [[0.0, -1.2], [1.2, 0.0]],\n    [[0.6, 0.3], [0.2, 0.5]],\n    [[0.9, 0.0], [0.0, -0.7]],\n    [[1.3, 0.2], [0.0, 0.3]],\n])\nradios = np.abs(np.linalg.eigvals(Ws)).max(axis=1)\nestables = radios < 1\n',
        },
        {
          id: 'autovectores.ex02.5',
          type: 'codigo',
          prompt:
            'Una matriz con autovectores por columnas en $V$ y autovalores en la diagonal de $D$ se puede escribir $A=VDV^{-1}$, y eso permite calcular sus potencias con facilidad: $A^{10}=VD^{10}V^{-1}$, donde $D^{10}$ solo eleva cada autovalor a $10$. Ya tienes `A`, `vals` y `vecs`, que son los autovalores y los autovectores de `A`. Guarda en `D` la matriz diagonal de los autovalores, de 2 filas y 2 columnas; en `A2` la matriz que se reconstruye con $VDV^{-1}$; en `igual`, si `A2` coincide con `A`, comparadas con `np.allclose` (un solo `True` o `False`); y en `A10` la potencia décima de `A` calculada con los autovalores. Debe coincidir con `np.linalg.matrix_power(A, 10)`, que multiplica `A` por sí misma diez veces.',
          hints: [
            'El plan: `D` es `np.diag(vals)`, la matriz con los autovalores en la diagonal y ceros fuera. `A2` es el producto de tres matrices, en este orden: `vecs`, luego `D`, luego la inversa de `vecs`, que se calcula con `np.linalg.inv(vecs)`; el producto de matrices se escribe con `@`. `igual` compara `A2` con `A` usando `np.allclose`. Para `A10`, haz el mismo producto, pero con los autovalores elevados a $10$ antes de ponerlos en la diagonal: `vals ** 10`. Cuidado: multiplicar los autovalores por $10$ no es elevarlos a $10$, y da otra matriz.',
            'Las piezas, con otros números:\n\n' +
              py(
                'w = np.array([2, 3])',
                'print(np.diag(w))       # dos filas, [2 0] y [0 3]: los números en la diagonal',
                'print(w ** 2)           # [4 9]: cada número elevado a 2',
                'print(w * 2)            # [4 6]: cada número multiplicado por 2 (no es lo mismo)',
                '',
                'M = np.array([[2, 0], [0, 4]])',
                'print(np.linalg.inv(M))                   # [[0.5  0.  ]',
                '                                          #  [0.   0.25]]: la inversa',
                'print(M @ np.linalg.inv(M))               # dos filas, [1. 0.] y [0. 1.]: la matriz identidad',
                'print(np.allclose(M @ np.linalg.inv(M), np.eye(2)))   # True: casi la matriz identidad',
              ) +
              '\n\nEn un producto de matrices el orden importa: `P @ Q` y `Q @ P` no suelen ser iguales. Una cadena como `P @ Q @ R` se calcula de izquierda a derecha.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'D = np.diag(___)',
                'A2 = vecs @ ___ @ np.linalg.inv(vecs)',
                'igual = np.___(A2, A)',
                'A10 = vecs @ np.diag(vals ___ 10) @ np.linalg.inv(vecs)',
              ) +
              '\n\nEl error típico es cambiar el orden de los tres factores, o escribir `vals * 10` donde va `vals ** 10`.',
          ],
          explain:
            'El producto de matrices no es conmutativo, así que el orden de los tres factores importa: $V$ primero, luego $D$ y luego la inversa de $V$. Para las potencias, $A^{10}$ conserva los autovectores y eleva cada autovalor a $10$; los autovalores multiplicados por $10$ darían otra matriz, diez veces mayor.',
          solution:
            '`D = np.diag(vals)` y `A2 = vecs @ D @ np.linalg.inv(vecs)` reconstruyen `A`: `igual` es `True` con `np.allclose`, porque el producto lleva un pequeño error de redondeo. Para la potencia, `vals ** 10` eleva cada autovalor, $2^{10}=1024$ y $5^{10}=9765625$, y `A10 = vecs @ np.diag(vals ** 10) @ np.linalg.inv(vecs)` da la matriz de entradas $6510758$, $3254867$, $6509734$ y $3255891$, la misma que `np.linalg.matrix_power(A, 10)`. Con `vals * 10` saldría `10 * A`, y con `A ** 10` se elevaría cada entrada, que no es multiplicar la matriz por sí misma.',
          requirements: [
            '`D` es un array de NumPy de 2 filas y 2 columnas: los autovalores de `A` en la diagonal y ceros fuera.',
            '`A2` es un array de NumPy de 2 filas y 2 columnas, y vuelve a ser la matriz `A` salvo el error de redondeo.',
            '`igual` es un solo `True` o `False`, y dice que `A2` y `A` coinciden salvo el error de redondeo.',
            '`A10` es un array de NumPy de 2 filas y 2 columnas con la potencia décima de `A`, que se acepta salvo un error diminuto de redondeo.',
          ],
          starter: `import numpy as np

A = np.array([[4, 1], [2, 3]])
vals, vecs = np.linalg.eig(A)
# Ya están hechos: A es la matriz de 2 filas y 2 columnas; vals, un array con sus 2 autovalores; y vecs,
# la matriz de 2 filas y 2 columnas con sus autovectores, uno en cada columna.
# La idea: A = V D V^-1, con V = vecs y D la matriz diagonal de los autovalores. Con eso, la potencia
# de A solo necesita elevar los autovalores.

# PASO 1. La matriz diagonal de los autovalores, en D (2 filas y 2 columnas).
# np.diag(un_array) crea una matriz con esos números en la diagonal y ceros fuera:
# np.diag([2, 3]) es la matriz con el 2 y el 3 en la diagonal.
D = None

# PASO 2. La reconstrucción de A, en A2 (2 filas y 2 columnas).
# Es el producto de tres matrices, con @, en este orden: vecs, D y la inversa de vecs.
# El orden importa: el producto de matrices no es conmutativo.
# np.linalg.inv(M) calcula la inversa de la matriz M.
A2 = None

# PASO 3. Si A2 coincide con A, en igual (un solo True o False).
# Por qué no con ==: A2 sale de varias multiplicaciones con decimales y lleva un error diminuto de redondeo.
# np.allclose(a, b) dice True si a y b son casi iguales.
igual = None

# PASO 4. La potencia décima de A, en A10 (2 filas y 2 columnas).
# Por qué se puede con los autovalores: A elevada a 10 tiene los mismos autovectores, y cada autovalor
# pasa a estar elevado a 10. Es el mismo producto del paso 2, pero con los autovalores elevados a 10.
# Con un array, el operador ** actúa sobre cada elemento: np.array([2, 3]) ** 2 vale [4 9].
# Ojo: multiplicar por 10 (con *) no es elevar a 10.
A10 = None

# Para ver qué vale algo antes de entregar: print(A2) y pulsa «Ejecutar».
`,
          checks: `_m = lambda x: isinstance(x, np.ndarray) and x.shape == (2, 2) and np.issubdtype(x.dtype, np.number) and not np.iscomplexobj(x)
_D = _m(D)
_A2 = _m(A2)
_b = isinstance(igual, (bool, np.bool_))
_A10 = _m(A10)
_T = np.linalg.matrix_power(A, 10)
_diag = _D and bool(np.allclose(D, np.diag(np.diag(D)))) and bool(np.allclose(np.sort(np.diag(D)), [2, 5]))
_back = _A2 and bool(np.allclose(A2, A))
_x10 = _A10 and bool(np.allclose(A10, 10 * A))
_pw = _A10 and bool(np.allclose(A10, A ** 10))
_good10 = _A10 and bool(np.allclose(A10, _T))
check(_D, "\`D\` tiene que ser un array de NumPy de 2 filas y 2 columnas, no un array de autovalores: los autovalores van en la diagonal y los demás números son 0.")
check((not _D) or _diag, "\`D\` tiene que tener los dos autovalores de \`A\` en la diagonal y ceros fuera.")
check(_A2, "\`A2\` tiene que ser un array de NumPy de 2 filas y 2 columnas: el producto de tres matrices.")
check((not _A2) or _back or not _D, "\`A2\` no coincide con \`A\`. En un producto de matrices el orden de los factores importa, y la inversa también es de la matriz de autovectores.")
check(_b, "\`igual\` tiene que ser un solo \`True\` o \`False\`.")
check((not _b) or (not _back) or bool(igual), "\`igual\` vale \`False\`: \`A2\` y \`A\` solo difieren en el redondeo. Compáralas con \`np.allclose\` y no con \`==\`.")
check(_A10, "\`A10\` tiene que ser un array de NumPy de 2 filas y 2 columnas: la potencia décima de \`A\`.")
check((not _A10) or not _x10, "\`A10\` vale 10 veces \`A\`: has multiplicado los autovalores por 10. Para una potencia hay que elevarlos a 10.")
check((not _A10) or not _pw, "\`A10\` eleva cada número de \`A\` a 10 por separado, y eso no es multiplicar la matriz por sí misma diez veces. La potencia de la matriz se calcula con sus autovalores.")
check((not _A10) or _x10 or _pw or _good10, "\`A10\` tiene que coincidir con la matriz que da \`np.linalg.matrix_power(A, 10)\`: los autovectores se mantienen y cada autovalor se eleva a 10.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[4, 1], [2, 3]])\nvals, vecs = np.linalg.eig(A)\nD = np.diag(vals)\nA2 = vecs @ D @ np.linalg.inv(vecs)\nigual = np.allclose(A2, A)\nA10 = vecs @ np.diag(vals ** 10) @ np.linalg.inv(vecs)\n',
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'autovectores.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere comprobar con NumPy que un autovector de `A` cumple su definición. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        '`np.linalg.eig` devuelve los autovalores y una matriz de autovectores. Piensa en qué parte de esa matriz va cada autovector.',
        'Si `v` fuese de verdad un autovector, ¿qué contestaría la última línea? Mira si lo hace.',
      ],
      explain:
        'Cada autovalor va emparejado con un autovector, y NumPy los entrega con una forma concreta. Revisa qué parte de la matriz de autovectores se toma y si de verdad es un vector que cumple la definición.',
      solution:
        'La tercera línea está mal. `vecs[0]` es la primera **fila** de `vecs`, y los autovectores están en las **columnas**: hace falta `vecs[:, 0]`, que es el autovector de `vals[0]`. Con la fila, `A @ v` no es un múltiplo de `v` y la última línea imprime `False`, aunque `vals[0]` sea un autovalor de `A`.',
      lines: [
        'A = np.array([[4, 1], [2, 3]])',
        'vals, vecs = np.linalg.eig(A)',
        'v = vecs[0]',
        'print(np.allclose(A @ v, vals[0] * v))',
      ],
      faultyLine: 2,
    },
    {
      id: 'autovectores.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento intenta decidir si un vector es un autovector de una matriz de $2\\times 2$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Calcula $A\\vec{v}$ tú y compara su dirección con la de $\\vec{v}$.',
        'Recuerda la definición: un autovector es un vector cuya imagen es un múltiplo suyo, $A\\vec{v}=\\lambda\\vec{v}$.',
      ],
      explain:
        'Un autovector se reconoce por la dirección de su imagen, no por su longitud. Revisa cada paso con la definición $A\\vec{v}=\\lambda\\vec{v}$.',
      solution:
        'La tercera línea está mal. $A\\vec{v}=(2, 3)$ está bien calculado, pero $(2, 3)$ no es un múltiplo de $(1, 1)$: la matriz ha cambiado la dirección del vector, y que la imagen sea más larga no dice nada. Para ser un autovector tendría que ser de la forma $(\\lambda, \\lambda)$. Los autovectores de esta $A$ son los ejes: $(1, 0)$ con $\\lambda=2$ y $(0, 1)$ con $\\lambda=3$.',
      lines: [
        'Tomamos A = (2 0; 0 3) y v = (1, 1)',
        'A·v = (2 · 1 + 0 · 1, 0 · 1 + 3 · 1) = (2, 3)',
        'Como A·v es más largo que v, v es un autovector y λ es el cociente de las longitudes',
      ],
      faultyLine: 2,
    },
    {
      id: 'autovectores.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula los autovalores de una matriz de $2\\times 2$ con su ecuación característica. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Para una matriz de $2\\times 2$, la ecuación es $\\lambda^2-t\\lambda+d=0$, con $t$ la traza y $d$ el determinante.',
        'Calcula tú la traza y el determinante, y resuelve la ecuación.',
      ],
      explain:
        'Revisa cada paso: la traza y el determinante, la ecuación y sus soluciones. Una buena comprobación final es que los autovalores sumen la traza y multipliquen el determinante.',
      solution:
        'No hay ningún error. La traza es $5+2=7$ y el determinante $5\\cdot 2-2\\cdot 2=6$, luego $\\lambda^2-7\\lambda+6=(\\lambda-1)(\\lambda-6)=0$, con $\\lambda=1$ y $\\lambda=6$. Se comprueba: $1+6=7$ y $1\\cdot 6=6$.',
      lines: [
        'A = (5 2; 2 2) tiene traza 5 + 2 = 7 y determinante 5 · 2 − 2 · 2 = 6',
        'La ecuación λ² − 7λ + 6 = 0 se factoriza como (λ − 1)(λ − 6) = 0, luego λ = 1 y λ = 6',
        'Comprobación: 1 + 6 = 7, la traza, y 1 · 6 = 6, el determinante',
      ],
      faultyLine: null,
    },
  ],
};
