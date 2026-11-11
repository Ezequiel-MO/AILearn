import type { Project } from '../../content/schema';
import { py } from '../py';
import { rangoWarmup } from './rango.calentamiento';
import { CORREOS, NUBE_ALARGADA, RESENAS, capaLab } from './datos';

/** La neurona siguiente acierta con todas las palabras. */
const ACIERTOS = {
  metric: 'acc',
  op: 'gte',
  target: 1,
  label: 'Aciertos de la neurona siguiente',
  format: 'percent',
} as const;

/** La capa aplasta el plano: rango 1 (o 0). */
const APLASTA = {
  metric: 'det',
  op: 'eq',
  target: 0,
  label: 'Determinante de la capa',
} as const;

/** La neurona siguiente solo mira la primera salida de la capa: responde al grupo 1 si es positiva. */
const MIRA_SALIDA_1 = { w: [1, 0] as [number, number], b: 0 };

/**
 * Tercer proyecto de la Órbita 1 «El área»: el rango, por cuántas dimensiones pasa la información.
 * Una capa de rango 1 es un cuello de botella que lo deja todo en una recta: hay que elegir qué
 * combinación de rasgos sobrevive, y lo que cae en la dirección borrada (el núcleo) se confunde.
 */
export const rango: Project = {
  id: 'rango',
  name: 'Rango',
  sub: 'Cuántas direcciones sobreviven',
  bigPicture: {
    parts: ['linear', 'compress'],
    text: 'El rango cuenta cuántas direcciones independientes sobreviven a una matriz. Una matriz de pesos de rango bajo hace menos de lo que su tamaño promete, y eso es lo que permite comprimirla. Aquí lo ves con planos que se aplastan en una línea; la idea de que una matriz grande pueda guardarse con pocos números sale de ahí.',
  },
  warmup: rangoWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'rango.ex00.1',
          type: 'laboratorio',
          purpose: {
            why: 'Un cuello de botella es una capa que deja pasar menos dimensiones de las que recibe: así se comprime un embedding. En un plano, una capa de rango 1 lo deja todo sobre una recta, y de cada palabra sobrevive un solo número.',
            aim: 'Vas a aplastar las reseñas sobre una recta con una capa de determinante cero, eligiendo cuál, para que la neurona siguiente siga acertando con las seis.',
            takeaway:
              'Con el determinante en cero, cada palabra queda reducida a un número. Si ese número es el tono, la neurona no pierde nada; si es la intensidad, ya no hay quien separe. Comprimir es elegir qué combinación de rasgos sobrevive.',
          },
          prompt:
            'Seis reseñas con dos rasgos: **intensidad** y **tono**. Hay que comprimirlas: la capa tiene que dejarlas todas sobre una recta (determinante $0$), así que de cada palabra quedará un solo número. La neurona siguiente mira la primera salida y responde «positiva» a lo que cae en la zona sombreada.\n\nAplasta el plano sin que la neurona deje de acertar con las seis.',
          hints: [
            'Al aplastar, las dos columnas acaban sobre la misma recta, o una en el origen. Mira qué rasgo separa «genial» de «horrible»: ese es el que tiene que sobrevivir en la primera salida.',
            'Lleva $\\hat{\\imath}$ (la intensidad) al origen y deja $\\hat{\\jmath}$ (el tono) apuntando hacia la zona sombreada.',
          ],
          explain:
            'Con determinante $0$, la salida de cada palabra es un solo número multiplicado por una dirección fija. La neurona acierta si ese número tiene el signo del tono. Aplastar quitando el tono, en cambio, deja positivas y negativas mezcladas sobre la recta.',
          solution:
            'Una capa que vale: $\\hat{\\imath}$ en $(0, 0)$ y $\\hat{\\jmath}$ en $(1, 1)$. Cada reseña queda en su tono, sobre la diagonal: $2$, $1$ y $1{,}5$ las positivas, y $-2$, $-1$ y $-1{,}5$ las negativas. También valen $\\hat{\\jmath}$ en $(1, 0)$ con $\\hat{\\imath}$ en el origen, o $\\hat{\\imath}$ en $(0{,}5;\\ 0)$ con $\\hat{\\jmath}$ en $(1, 0)$. Quedarse con la intensidad deja la neurona en 3 de 6.',
          lab: capaLab(RESENAS, { readout: MIRA_SALIDA_1, readouts: ['det'] }),
          goals: [APLASTA, ACIERTOS],
          solved: { ix: 0, iy: 0, jx: 1, jy: 1 },
        },
        {
          id: 'rango.ex00.2',
          type: 'laboratorio',
          purpose: {
            why: 'Lo que una capa borra no se recupera después. Una capa de rango 1 manda una dirección entera al origen, su núcleo: dos palabras que solo se diferencian en esa dirección salen idénticas, y ninguna capa posterior las vuelve a separar.',
            aim: 'Vas a hacer que una capa confunda «genial» con «horrible» y a mirar qué otras palabras se confunden de paso.',
            takeaway:
              '«genial» y «horrible» solo se diferencian en el tono: para confundirlas hay que borrarlo. Y al borrarlo, «bueno» y «malo» también caen juntas. El núcleo no borra una palabra: borra una diferencia, en todas las parejas que la tengan.',
          },
          prompt:
            '«genial» y «horrible» tienen la misma intensidad y tonos opuestos. Construye una capa que las deje en el mismo punto, sin mandar todas las reseñas al origen: el medidor de parejas confundidas no puede pasar de dos.\n\nMira después qué otra pareja se ha confundido.',
          hints: [
            'Compara las dos palabras: ¿en qué rasgo se diferencian? La capa tiene que mandar ese rasgo a ninguna parte.',
            'Lleva $\\hat{\\jmath}$ (el tono) al origen y deja $\\hat{\\imath}$ en cualquier sitio que no sea el origen.',
          ],
          explain:
            'La salida de una palabra es su intensidad por $\\hat{\\imath}$ más su tono por $\\hat{\\jmath}$. Dos palabras con la misma intensidad solo se separan por el tono: si $\\hat{\\jmath}$ vale $(0, 0)$, salen iguales. Esa dirección que la capa manda al origen es su núcleo.',
          solution:
            'Con $\\hat{\\jmath}$ en $(0, 0)$ y $\\hat{\\imath}$ en cualquier sitio menos el origen, cada reseña sale en su intensidad por $\\hat{\\imath}$. «genial» y «horrible» tienen intensidad $2{,}5$ y caen juntas; «bueno» y «malo», con $1$, también. Por eso no se puede confundir una sola pareja. Con $\\hat{\\imath}$ también en el origen, las seis caen en el mismo punto: quince parejas.',
          lab: capaLab(RESENAS, { pair: ['genial', 'horrible'], readouts: ['det'] }),
          goals: [
            {
              metric: 'pair_dist',
              op: 'eq',
              target: 0,
              label: 'Distancia entre «genial» y «horrible»',
            },
            {
              metric: 'merged',
              op: 'lte',
              target: 2,
              label: 'Parejas de palabras confundidas',
              format: 'integer',
            },
          ],
          solved: { ix: 1.5, iy: 1, jx: 0, jy: 0 },
        },
        {
          id: 'rango.ex00.3',
          type: 'laboratorio',
          purpose: {
            why: 'En una red, una capa solo trabaja con lo que le deja la anterior. Si delante hay un cuello de botella de una dimensión, lo que se perdió al pasar por él se perdió para siempre, por bien que se entrene lo que viene después.',
            aim: 'Vas a ajustar la capa que va detrás de un cuello de botella fijo y a descubrir cuántas reseñas puede clasificar bien, como mucho, la neurona siguiente.',
            takeaway:
              'Cinco de seis es el máximo: «bueno» y «horrible» salen del cuello de botella con el mismo número y ninguna capa posterior las separa. Entrenar más no arregla una compresión mal elegida; hay que cambiar la capa que comprime.',
          },
          prompt:
            'Delante de tu capa hay otra, fija, que comprime cada reseña en un solo número: intensidad más medio tono. Son los cuadraditos, todos sobre el eje vertical. La neurona responde «positiva» si la primera salida pasa de $1$, y ahora acierta con cuatro.\n\n¿Cuántas puedes salvar moviendo $\\hat{\\jmath}$? Consigue al menos cinco.',
          hints: [
            'Busca los cuadraditos de «bueno» y «horrible»: la capa de delante los ha dejado en el mismo sitio. Lo que le hagas a uno se lo haces al otro.',
            'Acorta $\\hat{\\jmath}$ sobre el eje horizontal: las reseñas se acercan al origen y las negativas salen de la zona sombreada.',
          ],
          explain:
            'Tu capa solo recibe un número por reseña y lo multiplica por $\\hat{\\jmath}$. Puede estirar o encoger la recta, pero no separar dos palabras que llegan con el mismo número. «bueno» y «horrible» llegan las dos con $1{,}5$: una de las dos falla siempre.',
          solution:
            'Con $\\hat{\\jmath}$ en $(1, 0)$, las salidas son $3{,}5$, $2{,}75$ y $1{,}5$ las positivas, y $1{,}5$, $0{,}75$ y $0{,}5$ las negativas: falla «horrible», cinco de seis. Con $(0{,}5;\\ 0)$ falla «bueno» en su lugar. Seis es imposible: lo que distinguía a esas dos se perdió en la capa de delante. Subir o bajar la punta de $\\hat{\\jmath}$ no cambia la primera salida.',
          lab: capaLab(RESENAS, {
            range: 6,
            j: [1.5, 0],
            movable: 'j',
            before: { i: [0, 1], j: [0, 0.5] },
            inputs: ['nada', 'intensidad + ½ tono'],
            readout: { w: [1, 0], b: -1 },
          }),
          goals: [
            {
              metric: 'hits',
              op: 'gte',
              target: 5,
              label: 'Reseñas bien clasificadas',
              format: 'integer',
            },
          ],
          solved: { jx: 1 },
        },
        {
          id: 'rango.ex00.4',
          type: 'laboratorio',
          purpose: {
            why: 'Para ver o guardar embeddings con menos números, se proyectan sobre unas pocas direcciones. Con una sola, cada palabra se reduce a su sombra sobre una recta, y la cuestión es qué recta pierde menos.',
            aim: 'Vas a girar la recta de un cuello de botella de una dimensión hasta que conserve casi toda la variación de una nube de palabras.',
            takeaway:
              'Una buena recta conserva casi todo, el 96,7 % aquí, porque la nube ya es casi una recta. Un cuello de botella de rango bajo funciona cuando los datos varían sobre todo en pocas direcciones. Lo que queda fuera de la recta se pierde siempre.',
          },
          prompt:
            'Siete palabras de tres temas. Un cuello de botella de una dimensión se queda con un solo número de cada una: su sombra sobre la recta de $\\vec{v}$ (las proyecciones dibujadas). Lo que queda fuera de la recta se pierde.\n\nGira $\\vec{v}$ hasta que la recta conserve al menos el 95 % de la variación de la nube.',
          hints: [
            'Mira la forma de la nube: es alargada. La recta conserva más cuanto más cortas son las líneas que van de cada palabra a su sombra.',
            'Lleva la punta de $\\vec{v}$ a lo largo de la nube, hacia arriba a la derecha y más tumbada que la diagonal.',
          ],
          explain:
            'La variación de la nube es la media de las distancias al cuadrado a su centro. Al proyectar, cada palabra conserva la parte a lo largo de $\\vec{v}$ y pierde la perpendicular. La recta que más conserva es la del eje largo de la nube.',
          solution:
            'Con $\\vec{v}$ en $(2, 1)$ la recta conserva el $96{,}7$ % de la variación: es el eje largo de la nube. También valen $(3, 2)$ o $(2{,}5;\\ 1)$, con algo más del 95 %. En horizontal se queda en el $77{,}8$ % y en la diagonal $(1, 1)$, en el $87{,}5$ %. Más del $96{,}7$ % no se puede: los temas tienen algo de anchura fuera de la recta, y eso se pierde siempre.',
          lab: capaLab(NUBE_ALARGADA, {
            movable: 'none',
            probe: { x: 0, y: 2, movable: true, on: 'input' },
          }),
          goals: [
            {
              metric: 'var_frac',
              op: 'gte',
              target: 0.95,
              label: 'Variación que conserva la recta',
              format: 'percent',
            },
          ],
          solved: { vx: 2, vy: 1 },
        },
        {
          id: 'rango.ex00.5',
          type: 'laboratorio',
          purpose: {
            why: 'Una capa de compresión no tiene que guardarlo todo: solo lo que va a necesitar la tarea siguiente. Un filtro de spam que reduce cada correo a un número puede acertar igual, si ese número es la mezcla adecuada de rasgos.',
            aim: 'Vas a comprimir seis correos en una sola dimensión eligiendo la mezcla de rasgos que sobrevive, de modo que la neurona del spam acierte con todos.',
            takeaway:
              'El cuello de botella ideal guarda justo la mezcla que la neurona necesita, «enlaces − saludos». Los tres correos normales caen en el mismo punto, y no importa: lo perdido es lo que la tarea no usaba. Comprimir bien es tirar lo que sobra.',
          },
          prompt:
            'Seis correos con dos rasgos: **enlaces** y **saludos**. El filtro de spam tiene que comprimirlos sobre una recta (determinante $0$). La neurona responde «spam» a lo que cae en la zona sombreada, y ningún rasgo basta por sí solo.\n\nElige qué número sobrevive de cada correo para que acierte con los seis.',
          hints: [
            'Quedarse solo con los enlaces no basta: hay correo normal con muchos. Lo que separa el spam es cuánto superan los enlaces a los saludos.',
            'Deja $\\hat{\\imath}$ (enlaces) hacia la derecha y lleva $\\hat{\\jmath}$ (saludos) justo al lado contrario, sobre la misma recta.',
          ],
          explain:
            'Con determinante $0$, la primera salida de cada correo es un solo número: una mezcla de enlaces y saludos. Si es «enlaces − saludos», el spam sale positivo y el correo normal, negativo. Quedarse con un solo rasgo, en cambio, deja la mitad mal.',
          solution:
            'Una capa que vale: $\\hat{\\imath}$ en $(1, 1)$ y $\\hat{\\jmath}$ en $(-1, -1)$. Sobrevive enlaces menos saludos: $2$, $1{,}5$ y $0{,}5$ en el spam y $-1$ en los tres normales, que caen en el mismo punto. A la neurona le da igual: no tiene que distinguirlos entre ellos. También vale $\\hat{\\imath}$ en $(1, 0)$ con $\\hat{\\jmath}$ en $(-1, 0)$, o $\\hat{\\imath}$ en $(2, 0)$ con $\\hat{\\jmath}$ en $(-1{,}5;\\ 0)$.',
          lab: capaLab(CORREOS, { readout: MIRA_SALIDA_1, readouts: ['det'] }),
          goals: [APLASTA, ACIERTOS],
          solved: { ix: 1, iy: 1, jx: -1, jy: -1 },
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'rango.ex01.1',
          type: 'opcion',
          purpose: {
            why: 'El rango de una capa es el número de dimensiones por las que pasa la información: las que quedan tras la capa. Una capa de rango 1 en un plano lo deja todo sobre una recta, aunque su matriz tenga cuatro números.',
            aim: 'Vas a mirar adónde manda una capa fija las seis reseñas y a decidir, por la forma de lo que sale, cuál es su rango.',
            takeaway:
              'Todas las reseñas caen en una recta: rango $1$. Se ve también en las columnas, que apuntan en la misma dirección: la segunda es la mitad de la primera. El rango se lee en lo que sale, no en el tamaño de la matriz.',
          },
          prompt:
            'Esta capa tiene cuatro pesos, todos distintos de cero:\n\n$$A=\\begin{pmatrix}1&0{,}5\\\\-1&-0{,}5\\end{pmatrix}$$\n\nMira en el laboratorio adónde manda las seis reseñas. ¿Cuál es su rango, el número de dimensiones que deja pasar?',
          hints: [
            'Fíjate en las palabras de salida, no en la matriz: ¿ocupan el plano o se alinean?',
            'Compara las dos columnas: ¿apuntan en direcciones distintas o en la misma?',
          ],
          explain:
            'El rango es la dimensión de lo que sale de la capa. Si todas las salidas se alinean, la capa deja pasar una sola dimensión. Las columnas lo dicen también: si una es múltiplo de la otra, solo hay una dirección.',
          solution:
            'Rango $1$. La segunda columna, $(0{,}5;\\ -0{,}5)$, es la mitad de la primera, $(1, -1)$: cada reseña sale en (intensidad $+$ medio tono) por $(1, -1)$, sobre la recta de esa dirección. «bueno» y «horrible» dan $1{,}5$ y caen juntas. Contar los pesos distintos de cero no da el rango.',
          lab: capaLab(RESENAS, { i: [1, -1], j: [0.5, -0.5], movable: 'none' }),
          options: [
            '$2$: las reseñas siguen ocupando el plano',
            '$1$: todas caen sobre una recta',
            '$0$: todas caen en el origen',
            '$4$: uno por cada peso distinto de cero',
          ],
          correct: 1,
        },
        {
          id: 'rango.ex01.2',
          type: 'numero',
          purpose: {
            why: 'Una matriz de rango bajo se puede guardar como el producto de dos matrices estrechas. En eso se basa LoRA, una técnica para ajustar modelos grandes: en lugar de cambiar una matriz entera, entrena dos finas cuyo producto es el cambio.',
            aim: 'Vas a contar cuántos números hacen falta para guardar una matriz grande de rango bajo escrita como producto de dos matrices finas.',
            takeaway:
              'Bastan $20\\,000$ números en lugar de $1\\,000\\,000$: cincuenta veces menos. Cuanto más bajo el rango, más se ahorra; por eso ajustar un modelo con matrices de rango bajo cabe en mucha menos memoria.',
          },
          prompt:
            'Una matriz de $1000\\times 1000$ tiene rango $10$. Se puede escribir como $U\\cdot V$, con $U$ de $1000\\times 10$ y $V$ de $10\\times 1000$: los $10$ del medio son las dimensiones por las que pasa la información.\n\n¿Cuántos números hay que guardar entre $U$ y $V$?',
          hints: [
            'Cuenta los números de cada matriz: filas por columnas.',
            'Suma los de $U$ y los de $V$.',
          ],
          explain:
            'Una matriz de rango $r$ cabe en dos matrices, una de $r$ columnas y otra de $r$ filas. Guardarlas cuesta filas por $r$ más $r$ por columnas, en lugar de filas por columnas.',
          solution:
            '$U$: $1000\\cdot 10=10\\,000$. $V$: $10\\cdot 1000=10\\,000$. Entre las dos, $20\\,000$ números, frente a los $1\\,000\\,000$ de la matriz entera: cincuenta veces menos. Multiplicar las dos da la matriz completa, número a número.',
          answer: 20000,
          tol: 0,
        },
        {
          id: 'rango.ex01.3',
          type: 'numero',
          purpose: {
            why: 'Un autoencoder comprime cada embedding en pocos números y luego lo vuelve a expandir. Lo que no cabe por el cuello de botella se pierde: hay direcciones de la entrada que llegan al final convertidas en cero.',
            aim: 'Vas a contar cuántas dimensiones de la entrada pierde una red que comprime embeddings de 384 números a 64 y los devuelve a 384.',
            takeaway:
              'Se pierden $320$ dimensiones: el rango y el núcleo suman siempre el tamaño de la entrada. En el plano pasa igual: con rango $1$ se pierde una dimensión de dos, la que va al origen.',
          },
          prompt:
            'Una red comprime embeddings de $384$ números a $64$ y los vuelve a llevar a $384$. Juntas, las dos capas son una matriz de $384\\times 384$ de rango $64$. Su núcleo son las direcciones de la entrada que acaban en cero.\n\n¿Qué dimensión tiene el núcleo? En el laboratorio tienes la versión pequeña: una capa de rango $1$ en un plano.',
          hints: [
            'El rango más la dimensión del núcleo es el número de entradas.',
            'En el laboratorio, una de las dos direcciones de la entrada (el tono) va al origen: rango $1$, núcleo de dimensión $1$, dos entradas.',
          ],
          explain:
            'Cada dirección de la entrada o sobrevive o acaba en cero. Las que sobreviven cuentan el rango; las que se anulan, el núcleo. Entre las dos tienen que cubrir todas las entradas.',
          solution:
            '$384-64=320$. De cada embedding solo llegan al final $64$ dimensiones; hay $320$ direcciones independientes de la entrada que la red manda a cero, y su información se pierde. En el plano del laboratorio, $2-1=1$: la dirección del tono, que la capa borra.',
          lab: capaLab(RESENAS, { j: [0, 0] }),
          answer: 320,
          tol: 0,
        },
        {
          id: 'rango.ex01.4',
          type: 'opcion',
          purpose: {
            why: 'Antes de comprimir conviene saber qué se va a confundir. En un buscador, dos documentos que el cuello de botella deja en el mismo punto ya no se pueden ordenar: el sistema no ve diferencia entre ellos.',
            aim: 'Vas a predecir qué reseñas deja en el mismo punto una capa de rango 1, a partir de sus pesos, y a comprobarlo construyéndola.',
            takeaway:
              'Se confunden las palabras cuya diferencia cae en el núcleo, no las que se parecen. «malo» y «triste» tienen rasgos distintos, pero su diferencia es justo la dirección que la capa borra.',
          },
          prompt:
            'Una capa tiene estos pesos:\n\n$$A=\\begin{pmatrix}0{,}5&0{,}5\\\\0{,}5&0{,}5\\end{pmatrix}$$\n\nSin construirla todavía, ¿qué pareja de reseñas sale en el mismo punto? Después puedes construirla en el laboratorio y comprobarlo.',
          hints: [
            'Cada salida es media intensidad más medio tono. Calcula intensidad más tono para cada reseña.',
            'Busca dos reseñas con la misma suma de rasgos.',
          ],
          explain:
            'Las dos filas son iguales: la capa reduce cada reseña a un número, intensidad más tono, y lo pone sobre la diagonal. Dos reseñas con la misma suma caen juntas, aunque sus rasgos sean distintos.',
          solution:
            '«malo» $(1, -1)$ y «triste» $(1{,}5;\\ -1{,}5)$ suman $0$ las dos: caen en el origen. Su diferencia, $(0{,}5;\\ -0{,}5)$, está en el núcleo de la capa, la recta de $(1, -1)$. «genial» y «horrible» suman $4{,}5$ y $0{,}5$, y «bueno» y «malo», $2$ y $0$: siguen separadas.',
          lab: capaLab(RESENAS),
          options: [
            '«genial» y «horrible»',
            '«malo» y «triste»',
            '«bueno» y «malo»',
            'Ninguna: las seis salen en puntos distintos',
          ],
          correct: 1,
        },
        {
          id: 'rango.ex01.5',
          type: 'numero',
          purpose: {
            why: 'Una capa de rango 1 se guarda como dos vectores: uno que lee un solo número de cada entrada y otro que lo reparte entre las salidas. Así se escriben las piezas de una matriz de rango bajo, una dirección cada vez.',
            aim: 'Vas a calcular la salida de un correo en una capa de rango 1 escrita como dos vectores: primero el número que lee, después cómo lo reparte.',
            takeaway:
              '«urgente» se reduce a un número, $2{,}5-2=0{,}5$, y sale en $0{,}5\\cdot(2, 1)=(1;\\ 0{,}5)$. Toda capa de rango 1 hace eso: lee una mezcla de rasgos y la escribe a lo largo de una sola dirección.',
          },
          prompt:
            'Una capa de rango 1 lee de cada correo un solo número, $\\vec{w}\\cdot\\vec{x}$ con $\\vec{w}=(1, -1)$, y lo escribe a lo largo de $\\vec{u}=(2, 1)$. Su matriz es $\\vec{u}\\,\\vec{w}^{\\top}$.\n\n«urgente» tiene $2{,}5$ enlaces y $2$ saludos. ¿Cuánto vale su primera salida? Después puedes construir la capa en el laboratorio.',
          hints: [
            'Primero el número que lee la capa: los enlaces por $1$ más los saludos por $-1$.',
            'La primera salida es ese número por la primera coordenada de $\\vec{u}$.',
          ],
          explain:
            'En una capa $\\vec{u}\\,\\vec{w}^{\\top}$ la salida es $\\vec{u}$ multiplicado por el número $\\vec{w}\\cdot\\vec{x}$: un número por una dirección fija. Por eso todas las salidas caen en la recta de $\\vec{u}$.',
          solution:
            '$\\vec{w}\\cdot\\vec{x}=2{,}5-2=0{,}5$, y la salida es $0{,}5\\cdot(2, 1)=(1;\\ 0{,}5)$: la primera vale $1$. La matriz es $\\begin{pmatrix}2&-2\\\\1&-1\\end{pmatrix}$; en el laboratorio, $\\hat{\\imath}$ en $(2, 1)$ y $\\hat{\\jmath}$ en $(-2, -1)$.',
          lab: capaLab(CORREOS),
          answer: 1,
          tol: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'rango.ex02.1',
          type: 'codigo',
          prompt:
            'NumPy calcula el rango con `np.linalg.matrix_rank(M)`, que devuelve un número entero. Ya tienes dos matrices: `A`, de $2\\times 2$, y `B`, de $3\\times 3$. Guarda en `rA` el rango de `A` y en `rB` el de `B`.',
          hints: [
            'El plan: `rA` y `rB` son, cada una, una llamada a `np.linalg.matrix_rank`: la primera con `A` dentro del paréntesis y la segunda con `B`. La función mira las columnas de la matriz y cuenta cuántas aportan una dirección nueva. No uses el determinante: dice si el rango baja, pero no cuánto.',
            'Las piezas, probadas con otras matrices:\n\n' +
              py(
                'M = np.array([[1, 3], [2, 6]])',
                'print(np.linalg.matrix_rank(M))             # 1: la segunda columna es el triple de la primera',
                'print(np.linalg.matrix_rank(np.eye(3)))     # 3: np.eye(3) es la identidad, tres columnas independientes',
                'print(np.linalg.matrix_rank(np.zeros((2, 2))))  # 0: una matriz de ceros no tiene ninguna dirección',
              ) +
              '\n\nLa llamada devuelve un número entero, y se guarda como cualquier otro valor: `nombre = np.linalg.matrix_rank(matriz)`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('rA = np.linalg.matrix_rank(___)', 'rB = np.linalg.matrix_rank(___)') +
              '\n\nEl rango no tiene por qué ser el tamaño de la matriz: si una columna se obtiene de las otras, sobra y no cuenta.',
          ],
          explain:
            'La función cuenta las direcciones independientes de las columnas. El determinante de una matriz con columnas dependientes sale $0$, que no es su rango.',
          solution:
            'Se escribe `rA = np.linalg.matrix_rank(A)` y `rB = np.linalg.matrix_rank(B)`. `A` tiene la segunda columna igual al doble de la primera, y su rango es $1$. `B` tiene la tercera columna igual a la suma de las dos primeras, y su rango es $2$, no $3$.',
          requirements: [
            '`rA` es un número entero: el rango de `A`.',
            '`rB` es un número entero: el rango de `B`.',
          ],
          starter: `import numpy as np

A = np.array([[1, 2], [2, 4]])
B = np.array([[1, 0, 1], [0, 1, 1], [1, 1, 2]])
# Ya están hechas: no hace falta tocarlas.
# A es una matriz de 2 filas y 2 columnas, y B una de 3 filas y 3 columnas.
# Cada una es un array de NumPy: A[0] es su primera fila.

# PASO 1. El rango de A.
# Por qué: el rango cuenta cuántas direcciones independientes tienen las columnas
# de una matriz. Una columna que se obtiene de las otras no aporta una dirección nueva.
# np.linalg.matrix_rank(M) recibe una matriz M y devuelve su rango, un número entero.
# Por ejemplo, con una matriz de ceros devuelve 0.
rA = None

# PASO 2. El rango de B, con la misma herramienta.
# El rango no tiene por qué ser el tamaño de la matriz: puede ser menor.
rB = None

# Para ver qué vale algo antes de entregar: print(...) y pulsa «Ejecutar».
`,
          checks: `def _int(n):
    return isinstance(n, (int, np.integer)) and not isinstance(n, bool)

_a = _int(rA)
_b = _int(rB)
check(_a, "\`rA\` tiene que ser un número entero: el rango de \`A\`.")
check((not _a) or rA == 1, "\`rA\` tiene que valer 1: la segunda columna de \`A\` es el doble de la primera, y solo queda una dirección independiente.")
check(_b, "\`rB\` tiene que ser un número entero: el rango de \`B\`.")
check((not _b) or rB != 3, "\`rB\` vale 3, el tamaño de la matriz. Pero la tercera columna de \`B\` es la suma de las dos primeras y no aporta una dirección nueva.")
check((not _b) or rB in (2, 3), "\`rB\` tiene que valer 2: hay dos columnas independientes y la otra sobra.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 2], [2, 4]])\nB = np.array([[1, 0, 1], [0, 1, 1], [1, 1, 2]])\nrA = np.linalg.matrix_rank(A)\nrB = np.linalg.matrix_rank(B)\n',
        },
        {
          id: 'rango.ex02.2',
          type: 'codigo',
          prompt:
            'Una matriz de datos tiene una fila por muestra y una columna por característica. Aquí, `X` tiene 5 muestras y 4 características, y una de ellas se calcula a partir de otras dos. Guarda en `r` el rango de `X` y en `quitables` la lista de los índices `k` de las columnas que se pueden quitar **sin que baje el rango**. La llamada `np.delete(X, k, axis=1)` devuelve `X` sin la columna `k`.',
          hints: [
            'El plan: primero `r`, el rango de `X` con `np.linalg.matrix_rank`. Después `quitables` empieza como una lista vacía, `[]`. Recorre los índices de las columnas con `for k in range(X.shape[1]):` (`X.shape[1]` es el número de columnas). Para cada `k`, calcula `X` sin la columna `k` con `np.delete`, saca su rango y, si es igual a `r`, añade `k` a la lista con `.append(k)`.',
            'Las piezas, probadas con otra matriz de 2 filas y 3 columnas:\n\n' +
              py(
                'Y = np.array([[1, 0, 1], [0, 1, 1]])',
                'print(Y.shape[1])                                     # 3: el número de columnas',
                'print(np.delete(Y, 0, axis=1).shape)                  # (2, 2): Y sin su columna 0',
                'print(np.linalg.matrix_rank(np.delete(Y, 2, axis=1)))  # 2: el rango de Y sin la columna 2',
                'vistos = []',
                'for k in range(3):',
                '    if k != 1:',
                '        vistos.append(k)',
                'print(vistos)                                         # [0, 2]: solo entran los k que cumplen el if',
              ) +
              '\n\n`np.delete(Y, 0, axis=1)` devuelve una copia sin la columna 0 y no cambia `Y`; `axis=1` significa «columnas». `==` pregunta si dos números son iguales y da `True` o `False`. Lo que va dentro del `for` y del `if` lleva 4 espacios más de sangría cada vez.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'r = np.linalg.matrix_rank(___)',
                'quitables = []',
                'for k in range(X.shape[1]):',
                '    sin_k = np.delete(X, k, axis=1)',
                '    if np.linalg.matrix_rank(sin_k) ___ r:',
                '        quitables.append(___)',
              ) +
              '\n\nCada columna se prueba por separado, quitando solo esa. No te quedes con la primera que sirva: hay más de una.',
          ],
          explain:
            'Cada columna se prueba por separado: se quita, se calcula el rango y se compara con el de la matriz entera. Una columna que sobra porque se calcula con otras dos no es la única que se puede quitar: mira cuáles son las tres implicadas.',
          solution:
            'El rango de `X` es $3$. Las columnas 0, 1 y 2 están relacionadas, porque la 2 es la suma de la 0 y la 1, y quitar cualquiera de las tres deja el rango en $3$: `quitables` es `[0, 1, 2]`. La columna 3 apunta a una dirección que no tiene ninguna otra, y al quitarla el rango baja a $2$. Las tres se pueden quitar de una en una, pero no a la vez: la dependencia es de las tres juntas, no de una sola.',
          requirements: [
            '`r` es un número entero: el rango de `X`.',
            '`quitables` es una lista de índices de columna de `X`, contados desde $0$, sin repetir y en cualquier orden.',
            '`quitables` contiene todas las columnas que se pueden quitar sin que baje el rango, cada una probada por separado, y ninguna que lo haga bajar.',
          ],
          starter: `import numpy as np

X = np.array([[1, 0, 1, 1], [0, 1, 1, 0], [1, 1, 2, 0], [2, 1, 3, 1], [0, 0, 0, 1]])
# Ya está hecha: no hace falta tocarla.
# X es una matriz de 5 filas (muestras) y 4 columnas (características).
# X.shape vale (5, 4), así que X.shape[1] es el número de columnas.

# PASO 1. El rango de X.
# Por qué: es el número de direcciones independientes que hay entre las columnas,
# y es el valor con el que vas a comparar después.
# np.linalg.matrix_rank(M) devuelve el rango de M, un número entero.
r = None

# PASO 2. Las columnas que se pueden quitar sin que baje el rango.
# Por qué: una columna sobra si las demás ya dan las mismas direcciones. Para saberlo
# se quita esa columna y se mira si el rango sigue siendo r.
# Empieza con una lista vacía, quitables = [], recorre los índices de las columnas con
# for k in range(X.shape[1]): y añade el que cumpla con quitables.append(k).
# Dentro del for, lo que lleva 4 espacios de sangría se repite en cada vuelta.
# np.delete(X, k, axis=1) devuelve X sin la columna k (axis=1 son las columnas).
# a == b da True si a y b son iguales. Un if ejecuta su sangría solo si la condición es True.
# Cada columna se prueba por separado, quitando solo esa.
# El resultado es una lista de índices de columna (números enteros).
quitables = None

# Para ver qué vale algo antes de entregar: print(...) y pulsa «Ejecutar».
`,
          checks: `def _lista(a):
    try:
        return sorted(int(k) for k in a)
    except Exception:
        return None

_r = isinstance(r, (int, np.integer)) and not isinstance(r, bool)
_q = _lista(quitables)
check(_r, "\`r\` tiene que ser un número entero: el rango de \`X\`.")
check((not _r) or r == 3, "\`r\` tiene que valer 3: de las 4 columnas de \`X\`, una se calcula con otras dos y sobra.")
check(_q is not None, "\`quitables\` tiene que ser una lista de índices de columna, por ejemplo \`[0, 1]\`.")
check((_q is None) or _q != [2], "\`quitables\` solo tiene la columna 2, que es la suma de otras dos. Pero la columna 0 también se puede quitar sin perder nada, porque se recupera como la 2 menos la 1: la dependencia es de las tres juntas.")
check((_q is None) or _q != [0, 1, 2, 3], "\`quitables\` incluye todas las columnas. Al quitar la 3 el rango sí baja, porque es la única que apunta a una dirección nueva.")
check((_q is None) or _q in ([2], [0, 1, 2, 3], [0, 1, 2]), "\`quitables\` tiene que ser la lista de las columnas cuya ausencia no cambia el rango: prueba las columnas una a una.")
`,
          reference:
            'import numpy as np\n\nX = np.array([[1, 0, 1, 1], [0, 1, 1, 0], [1, 1, 2, 0], [2, 1, 3, 1], [0, 0, 0, 1]])\nr = np.linalg.matrix_rank(X)\nquitables = [k for k in range(X.shape[1]) if np.linalg.matrix_rank(np.delete(X, k, axis=1)) == r]\n',
        },
        {
          id: 'rango.ex02.3',
          type: 'codigo',
          prompt:
            'Una matriz de rango $1$ se construye con un **producto exterior**: `np.outer(u, v)` da la matriz que tiene en la fila $i$ y la columna $j$ el producto $u_iv_j$, es decir, $\\vec{u}\\vec{v}^{\\top}$. Ya tienes `u`, de 4 números, y `v`, de 3. Guarda en `M` su producto exterior y en `r` su rango.',
          hints: [
            'El plan: `M` es la llamada a `np.outer` con `u` y `v`, en ese orden: `u` da las filas y `v` las columnas. Después `r` es el rango de esa `M`, con `np.linalg.matrix_rank`, igual que con cualquier otra matriz.',
            'Las piezas, probadas con otros dos vectores:\n\n' +
              py(
                'a = np.array([1, 2])',
                'b = np.array([10, 20, 30])',
                'print(np.outer(a, b).shape)       # (2, 3): una fila por número de a, una columna por número de b',
                'print(np.outer(a, b)[1])          # [20 40 60]: la fila 1 es a[1] por cada número de b',
                'print(np.linalg.matrix_rank(np.array([[1, 0], [0, 1]])))  # 2: el rango de otra matriz',
              ) +
              '\n\nLa forma `(2, 3)` se lee «2 filas y 3 columnas». Si cambias el orden y escribes `np.outer(b, a)`, sale de 3 filas y 2 columnas.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('M = np.outer(___, ___)', 'r = np.linalg.matrix_rank(___)') +
              '\n\nEl error típico es poner `u` y `v` al revés: la matriz sale de la forma traspuesta. Mira cuántos números tiene cada vector.',
          ],
          explain:
            'Todas las filas de un producto exterior son múltiplos de una misma fila, la de `v`. Por eso sale rango $1$ por muchas filas que tenga. Si `M` sale de 3 filas y 4 columnas, el orden de `u` y `v` está cambiado.',
          solution:
            'Se escribe `M = np.outer(u, v)` y `r = np.linalg.matrix_rank(M)`. `M` es de 4 filas y 3 columnas, y todas sus filas son múltiplos de `v`: $1$, $-1$, $2$ y $0$ veces $(3, 1, 2)$. El rango es $1$.',
          requirements: [
            '`M` es un array de NumPy de 4 filas y 3 columnas: la fila $i$ y la columna $j$ contienen el producto del número $i$ de `u` por el número $j$ de `v`.',
            '`r` es un número entero: el rango de `M`.',
          ],
          starter: `import numpy as np

u = np.array([1, -1, 2, 0])
v = np.array([3, 1, 2])
# Ya están hechos: no hace falta tocarlos.
# u es un array de 4 números y v un array de 3 números.

# PASO 1. El producto exterior de u y v.
# Por qué: es la forma de construir una matriz de rango 1. Cada fila es la de v
# multiplicada por un número de u, así que todas las filas apuntan a la misma dirección.
# np.outer(a, b) devuelve una matriz con una fila por cada número de a y una columna
# por cada número de b. En la fila i y la columna j está a[i] * b[j].
# El orden importa: np.outer(a, b) y np.outer(b, a) tienen formas distintas.
# El resultado es un array de NumPy de 4 filas y 3 columnas.
M = None

# PASO 2. El rango de M.
# Por qué: es lo que comprueba que M, aunque tenga muchas filas, solo tiene una dirección.
# np.linalg.matrix_rank(M) devuelve el rango de M, un número entero.
r = None

# Para ver qué vale algo antes de entregar: print(...) y pulsa «Ejecutar».
`,
          checks: `_arr = isinstance(M, np.ndarray) and np.issubdtype(M.dtype, np.number)
_m = _arr and M.shape == (4, 3)
_r = isinstance(r, (int, np.integer)) and not isinstance(r, bool)
check(_arr, "\`M\` tiene que ser un array de NumPy con números: el producto exterior de \`u\` y \`v\`.")
check((not _arr) or M.shape != (3, 4), "\`M\` es de 3 filas y 4 columnas: has puesto \`u\` y \`v\` al revés. En el producto exterior, \`u\` da las filas y \`v\` las columnas.")
check((not _arr) or M.shape in ((3, 4), (4, 3)), "\`M\` tiene que ser de 4 filas y 3 columnas: una fila por cada número de \`u\` y una columna por cada número de \`v\`.")
check((not _m) or np.allclose(M, np.outer(u, v)), "\`M\` tiene que tener en la fila \`i\` y la columna \`j\` el producto de \`u[i]\` por \`v[j]\`.")
check(_r, "\`r\` tiene que ser un número entero: el rango de \`M\`.")
check((not _r) or r == 1, "\`r\` tiene que valer 1: todas las filas de \`M\` son múltiplos de \`v\`, y solo hay una dirección independiente.")
`,
          reference:
            'import numpy as np\n\nu = np.array([1, -1, 2, 0])\nv = np.array([3, 1, 2])\nM = np.outer(u, v)\nr = np.linalg.matrix_rank(M)\n',
        },
        {
          id: 'rango.ex02.4',
          type: 'codigo',
          prompt:
            'Una capa con **cuello de botella** lleva una entrada de 5 números a 2 y la devuelve a 5: primero actúa `A`, de $2\\times 5$, y después `B`, de $5\\times 2$. Las dos juntas equivalen a una sola matriz. Guarda en `W` esa matriz única, en `r` su rango y en `invertible` si `W` puede tener inversa: un solo `True` o `False`.',
          hints: [
            'El plan: `W` es el producto de las dos matrices con `@`, y la capa que actúa primero va a la derecha. Después `r` es el rango de `W` con `np.linalg.matrix_rank`. Por último, `invertible` es una comparación: una matriz cuadrada tiene inversa solo si su rango es igual a su tamaño, que es su número de filas.',
            'Las piezas, probadas con otras matrices:\n\n' +
              py(
                'C = np.array([[1, 2], [0, 1], [1, 0]])    # 3 filas y 2 columnas',
                'D = np.array([[1, 0, 1], [0, 1, 1]])      # 2 filas y 3 columnas',
                'print((C @ D).shape)    # (3, 3): D actúa primero y C después',
                'print((D @ C).shape)    # (2, 2): al revés, C actúa primero',
                'print(C.shape[0])       # 3: el número de filas de C',
                'print(3 == 2)           # False: == compara y da True o False',
              ) +
              '\n\nEn `X @ Y` hace falta que las columnas de `X` sean tantas como las filas de `Y`. Una comparación como `r == 5` ya es un `True` o un `False`, y se guarda tal cual.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('W = ___ @ ___', 'r = np.linalg.matrix_rank(W)', 'invertible = r ___ W.shape[0]') +
              '\n\nEl error típico es multiplicar en el orden en que se leen las capas: `W` sale entonces de 2 filas y 2 columnas, y tiene que salir de 5 por 5.',
          ],
          explain:
            'Todo lo que sale de `W` pasó antes por un espacio de 2 números, así que no puede ocupar más de 2 direcciones, aunque `W` sea de 5 por 5. Para decidir la inversa, compara el rango con el tamaño en vez de fiarte del determinante calculado en coma flotante.',
          solution:
            'Se escribe `W = B @ A`, `r = np.linalg.matrix_rank(W)` y `invertible = r == 5`. `W` es de $5\\times 5$ pero su rango es $2$: no se puede invertir y la capa comprime la información, porque 5 números entran y solo 2 direcciones sobreviven. Cualquier `B @ A` por un cuello de 2 números tiene rango $2$ como mucho.',
          requirements: [
            '`W` es un array de NumPy con 5 filas y 5 columnas: la matriz que equivale a aplicar a una entrada primero la capa `A` y después la `B`.',
            '`r` es un número entero: el rango de `W`.',
            '`invertible` es un solo `True` o `False`, coherente con el rango de `W`: una matriz cuadrada tiene inversa solo si su rango llega a su tamaño.',
          ],
          starter: `import numpy as np

A = np.array([[1, 0, 2, 1, 0], [0, 1, 1, 0, 1]])
B = np.array([[1, 0], [0, 1], [1, 1], [2, 0], [0, 3]])
# Ya están hechas: no hace falta tocarlas.
# A es la primera capa: una matriz de 2 filas y 5 columnas (lleva 5 números a 2).
# B es la segunda capa: una matriz de 5 filas y 2 columnas (lleva 2 números a 5).

# PASO 1. La matriz única que equivale a las dos capas.
# Por qué: aplicar una capa y después la otra es lo mismo que aplicar una sola matriz,
# el producto de las dos. La capa que actúa primero va a la derecha del producto.
# X @ Y multiplica dos matrices; hace falta que las columnas de X sean tantas como las filas de Y.
# Si no estás seguro de la forma, mira W.shape: es (filas, columnas).
# El resultado es un array de NumPy de 5 filas y 5 columnas.
W = None

# PASO 2. El rango de W.
# Por qué: dice cuántas direcciones sobreviven a las dos capas.
# np.linalg.matrix_rank(M) devuelve el rango de M, un número entero.
r = None

# PASO 3. Si W puede tener inversa.
# Por qué: una matriz cuadrada tiene inversa solo si su rango es igual a su tamaño,
# es decir, a su número de filas, que es W.shape[0].
# a == b da True si son iguales y False si no. Guarda ese True o False en invertible.
invertible = None

# Para ver qué vale algo antes de entregar: print(...) y pulsa «Ejecutar».
`,
          checks: `_w = isinstance(W, np.ndarray) and np.issubdtype(W.dtype, np.number)
_ok = _w and W.shape == (5, 5)
_r = isinstance(r, (int, np.integer)) and not isinstance(r, bool)
_b = isinstance(invertible, (bool, np.bool_))
check(_w, "\`W\` tiene que ser un array de NumPy con números: la matriz única que equivale a las dos capas.")
check((not _w) or W.shape != (2, 2), "\`W\` es de 2 filas y 2 columnas: has multiplicado \`A @ B\`. La capa que actúa primero, \`A\`, va a la derecha: la matriz que lleva 5 números a 5 es \`B @ A\`.")
check((not _w) or W.shape in ((2, 2), (5, 5)), "\`W\` tiene que ser una matriz de 5 filas y 5 columnas: lleva la entrada de 5 números a una salida de 5.")
check((not _ok) or np.allclose(W, B @ A), "\`W\` tiene que ser la segunda capa por la primera, \`B @ A\`.")
check(_r, "\`r\` tiene que ser un número entero: el rango de \`W\`.")
check((not _r) or r != 5, "\`r\` vale 5, el tamaño de \`W\`. Pero todo lo que sale de \`W\` ha pasado por un cuello de 2 números, y el rango no puede superar 2.")
check((not _r) or r in (2, 5), "\`r\` tiene que valer 2: el cuello de botella solo deja pasar 2 direcciones.")
check(_b, "\`invertible\` tiene que ser un solo \`True\` o \`False\`.")
check((not _b) or not bool(invertible), "\`invertible\` vale \`True\`, pero \`W\` no tiene inversa: su rango es menor que su tamaño, y la información que se pierde en el cuello no se recupera.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 0, 2, 1, 0], [0, 1, 1, 0, 1]])\nB = np.array([[1, 0], [0, 1], [1, 1], [2, 0], [0, 3]])\nW = B @ A\nr = np.linalg.matrix_rank(W)\ninvertible = r == W.shape[0]\n',
        },
        {
          id: 'rango.ex02.5',
          type: 'codigo',
          prompt:
            'Una capa de un modelo tiene una matriz de $768\\times 768$: unos $590000$ números. Si se sabe que su rango es como mucho $64$, se puede guardar como `B @ A`, con `B` de $768\\times 64$ y `A` de $64\\times 768$. Con `d` y `r` ya definidos, guarda en `n_densa` cuántos números tiene la matriz entera, en `n_baja` cuántos tienen `B` y `A` juntas, y en `razon` cuántas veces es mayor `n_densa` que `n_baja`.',
          hints: [
            'El plan: `n_densa` son los números de una matriz de `d` filas y `d` columnas. `n_baja` es la suma de los números de `B` (`d` filas y `r` columnas) y los de `A` (`r` filas y `d` columnas). `razon` es `n_densa` dividido entre `n_baja`: la matriz entera va arriba.',
            'Las piezas, probadas con otros tamaños:\n\n' +
              py(
                'f = 10',
                'c = 4',
                'print(f * c)            # 40: los números de una matriz de f filas y c columnas',
                'print(f * c + c * f)    # 80: los de dos matrices, una de f por c y otra de c por f',
                'print(80 / 40)          # 2.0: / divide el de la izquierda entre el de la derecha',
                'print(40 / 80)          # 0.5: al revés sale otro número',
              ) +
              '\n\nEn una división importa el orden: `a / b` no es `b / a`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('n_densa = d * ___', 'n_baja = d * r + ___ * d', 'razon = ___ / ___') +
              '\n\nEl error típico es contar una sola de las dos matrices pequeñas, o dividir al revés. Pregúntate cuál de las dos cantidades es la mayor.',
          ],
          explain:
            'Hay que sumar los números de las dos matrices pequeñas, no quedarse con una. Y la razón pedida es la de la matriz entera frente a las dos pequeñas, y no al revés.',
          solution:
            'La matriz entera tiene `d * d` $=589824$ números. `B` y `A` juntas tienen `d * r + r * d` $=98304$. La razón es $6$: guardar la matriz de rango bajo ocupa seis veces menos. Es la idea que permite ajustar modelos enormes con muy pocos números, y que se verá más adelante.',
          requirements: [
            '`n_densa` es un número: cuántos números tiene la matriz entera de $768\\times 768$.',
            '`n_baja` es un número: cuántos números tienen `B` y `A` juntas.',
            '`razon` es un número: el cociente de `n_densa` entre `n_baja`, y no al revés.',
          ],
          starter: `import numpy as np

d = 768  # tamaño de la entrada y de la salida
r = 64   # rango máximo
# Ya están hechos: no hace falta tocarlos. d y r son dos números enteros.
# La matriz entera es de d filas y d columnas. B es de d filas y r columnas, y A de r filas y d columnas.

# PASO 1. Cuántos números tiene la matriz entera.
# Por qué: es lo que cuesta guardarla sin ninguna trampa.
# Una matriz de f filas y c columnas tiene f * c números. Aquí f y c valen d.
# El resultado es un número entero.
n_densa = None

# PASO 2. Cuántos números tienen B y A juntas.
# Por qué: la versión de rango bajo se guarda como dos matrices pequeñas, y hay que
# contar las dos, no solo una. Cuenta los de B (d * r) y suma los de A.
# El resultado es un número entero.
n_baja = None

# PASO 3. Cuántas veces es mayor n_densa que n_baja.
# Por qué: es el ahorro de guardar la versión de rango bajo.
# a / b divide a entre b. El orden importa: la cantidad mayor va a la izquierda.
# El resultado es un número, y no hace falta que sea entero.
razon = None

# Para ver qué vale algo antes de entregar: print(...) y pulsa «Ejecutar».
`,
          checks: `def _num(n):
    return isinstance(n, (int, float, np.integer, np.floating)) and not isinstance(n, bool)

_a = _num(n_densa)
_b = _num(n_baja)
_z = _num(razon)
check(_a, "\`n_densa\` tiene que ser un número: cuántos números tiene una matriz de 768 por 768.")
check((not _a) or n_densa == 589824, "\`n_densa\` tiene que valer 589824: 768 filas por 768 columnas.")
check(_b, "\`n_baja\` tiene que ser un número: los números de \`B\` y de \`A\` juntas.")
check((not _b) or n_baja != 49152, "\`n_baja\` vale 49152, la mitad: falta una de las dos matrices. \`B\` tiene 768 por 64 números y \`A\` tiene otros 64 por 768.")
check((not _b) or n_baja in (49152, 98304), "\`n_baja\` tiene que valer 98304: los números de \`B\` más los de \`A\`.")
check(_z, "\`razon\` tiene que ser un número: cuántas veces cabe \`n_baja\` en \`n_densa\`.")
check((not _z) or abs(razon - 1 / 6) > 1e-9, "\`razon\` está al revés: es \`n_baja\` entre \`n_densa\`. Tiene que ser la matriz entera dividida entre las dos pequeñas.")
check((not _z) or abs(razon - 1 / 6) < 1e-9 or abs(razon - 6) < 1e-9, "\`razon\` tiene que valer 6: la matriz entera tiene seis veces más números que las dos pequeñas.")
`,
          reference:
            'import numpy as np\n\nd = 768\nr = 64\nn_densa = d * d\nn_baja = d * r + r * d\nrazon = n_densa / n_baja\n',
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'rango.hoja.1',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento habla de una matriz $A$ de $2\\times 2$ con determinante $0$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Si el determinante es $0$, ¿cuántas direcciones sobreviven como mínimo? ¿Puede no sobrevivir ninguna?',
        'Recuerda qué matriz es la única con rango $0$.',
      ],
      explain:
        'Revisa cada paso y comprueba si la conclusión se sigue de lo que se ha establecido antes. Pregúntate qué dice exactamente un determinante nulo.',
      solution:
        'La tercera línea está mal. El determinante $0$ solo dice que el rango es menor que $2$. Si la imagen es una recta, sobrevive una dirección y el rango es $1$; el rango $0$ solo lo tiene la matriz nula, cuya imagen es un solo punto.',
      lines: [
        'A es de 2×2 y su determinante es 0',
        'Con determinante 0 el plano se aplasta: la imagen de A es una recta o un solo punto',
        'Luego A no deja pasar ninguna dirección: el rango de A es 0',
      ],
      faultyLine: 2,
    },
    {
      id: 'rango.hoja.2',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere guardar en `r` el rango de `A`. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Mira la segunda fila de `A` y compárala con la primera.',
        '`A.any(axis=1)` dice, para cada fila, si tiene algún número distinto de cero. ¿Basta eso para contar direcciones independientes?',
      ],
      explain:
        'Contar filas que no son todo ceros no cuenta direcciones independientes: una fila puede no ser nula y aun así repetir a otra. Compara lo que calcula la línea con lo que mide el rango.',
      solution:
        'La segunda línea está mal. Cuenta 3 filas no nulas, pero la segunda fila es el doble de la primera y no aporta una dirección nueva: el rango es $2$. Se obtiene con `r = np.linalg.matrix_rank(A)`. Contar las filas no nulas solo sirve cuando la matriz ya está reducida.',
      lines: [
        'A = np.array([[1, 2, 3], [2, 4, 6], [1, 0, 1]])',
        'r = np.count_nonzero(A.any(axis=1))',
        'print(r)',
      ],
      faultyLine: 1,
    },
    {
      id: 'rango.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento habla de una capa con cuello de botella, $W=BA$, con $B$ de $5\\times 2$ y $A$ de $2\\times 5$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Piensa en qué espacio caen las columnas de $W$.',
        'Compara el rango con el tamaño de $W$ para decidir si tiene inversa.',
      ],
      explain: 'Revisa cada paso y comprueba si la conclusión se sigue de los pasos anteriores.',
      solution:
        'No hay ningún error. Cada columna de $W$ es una combinación de las 2 columnas de $B$, así que la imagen de $W$ no pasa de un plano: rango $2$ como mucho en una matriz de $5\\times 5$, y por eso no tiene inversa.',
      lines: [
        'W = BA es de 5×5, y cada columna de W es B por una columna de A',
        'Luego cada columna de W es una combinación de las 2 columnas de B',
        'Por eso el rango de W es 2 como mucho y W no se puede invertir: la información pasa por un cuello de 2 números',
      ],
      faultyLine: null,
    },
  ],
};
