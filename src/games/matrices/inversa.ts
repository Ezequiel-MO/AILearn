import type { Project } from '../../content/schema';
import { py } from '../py';
import { inversaWarmup } from './inversa.calentamiento';
import { RESENAS, capaLab, type CapaOptions } from './datos';

/** Las dianas del autoencoder: cada reseña, donde estaba antes de que el codificador la moviera. */
const DIANAS: Record<string, [number, number]> = Object.fromEntries(
  RESENAS.points.map((p) => [p.id, [p.x, p.y] as [number, number]]),
);

/**
 * Un autoencoder sobre las reseñas: la capa fija `before` codifica (los cuadraditos) y la del
 * jugador, que empieza en la identidad, decodifica hacia las dianas.
 */
const autoencoder = (before: NonNullable<CapaOptions['before']>, options: CapaOptions = {}) =>
  capaLab(RESENAS, { before, targets: DIANAS, ...options });

/** La meta de casi todo el ejercicio: que ninguna reseña quede lejos de su diana. */
const RECONSTRUYE = {
  metric: 'target_err',
  op: 'lte',
  target: 0,
  label: 'Distancia a su diana de la palabra más lejana',
} as const;

/**
 * Segundo proyecto de la Órbita 1 «El área»: la inversa como la capa que deshace otra. La escena es un
 * autoencoder: un codificador fijo mueve las reseñas y el jugador construye la decodificadora.
 */
export const inversa: Project = {
  id: 'inversa',
  name: 'Inversa',
  sub: 'Deshacer una capa',
  bigPicture: {
    parts: ['linear'],
    text: 'Deshacer una transformación es aplicar su matriz inversa, y solo se puede si la transformación no aplasta nada. Es una pregunta útil sobre una capa: ¿se puede recuperar la entrada a partir de la salida? Aquí calculas la inversa en dos dimensiones y compruebas cuándo no existe, que es cuando la matriz pierde una dirección.',
  },
  warmup: inversaWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'inversa.ex00.1',
          type: 'laboratorio',
          purpose: {
            why: 'Un autoencoder aprende dos capas: una codifica cada dato y otra lo reconstruye. Se entrena para que la salida sea igual a la entrada, así que la segunda capa tiene que deshacer lo que hizo la primera.',
            aim: 'Vas a construir la capa que decodifica un codificador que estira la intensidad y encoge el tono, hasta que cada reseña vuelva a su sitio.',
            takeaway:
              'La decodificadora divide cada rasgo entre lo que el codificador lo multiplicó: la intensidad, a la mitad; el tono, por dos. Deshacer una capa es aplicar su inversa, y la de una capa que escala es escalar al revés.',
          },
          prompt:
            'Un autoencoder: una capa fija codifica las seis reseñas (los cuadraditos) y la tuya las decodifica. Las dianas son donde estaba cada palabra antes de codificarla. Ahora tu capa no hace nada, y las palabras se quedan en su código: estiradas a lo ancho y encogidas a lo alto.\n\nConstruye la capa que devuelve cada reseña a su diana.',
          hints: [
            'Compara cada cuadradito con su diana: ¿cuánto más lejos está en horizontal? ¿Y en vertical? Cada rasgo se ha estirado o encogido por separado.',
            'Acorta $\\hat{\\imath}$ (la intensidad) sobre el eje horizontal y alarga $\\hat{\\jmath}$ (el tono) sobre el vertical, hasta que las palabras se posen en sus dianas.',
          ],
          explain:
            'El codificador multiplica la intensidad por $2$ y el tono por $0{,}5$. Tu capa recibe ese código: para volver al original, la primera salida tiene que dividir entre $2$ y la segunda, multiplicar por $2$.',
          solution:
            'La decodificadora: $\\hat{\\imath}$ en $(0{,}5;\\ 0)$ y $\\hat{\\jmath}$ en $(0, 2)$. «genial», codificada en $(5, 1)$, vuelve a $(2{,}5;\\ 2)$. Si solo arreglas la intensidad, el tono sigue a la mitad y «genial» y «horrible» se quedan a $1$ de su diana. La inversa es una sola: no hay otra capa que valga.',
          lab: autoencoder({ i: [2, 0], j: [0, 0.5] }, { range: 6 }),
          goals: [RECONSTRUYE],
          solved: { ix: 0.5, jy: 2 },
        },
        {
          id: 'inversa.ex00.2',
          type: 'laboratorio',
          purpose: {
            why: 'Muchos rasgos llegan contaminados por otros: una medida que arrastra parte de otra. Una capa que suma un rasgo a otro es una cizalla, y la que la deshace tiene que restar justo lo que se sumó.',
            aim: 'Vas a decodificar un código cuya primera salida lleva la intensidad más el tono, y a descubrir qué columna hay que tocar y cuál no.',
            takeaway:
              'Solo cambia la columna del tono: la decodificadora resta a la primera salida el tono que el codificador le sumó. La inversa de inclinar es inclinar hacia el otro lado, y lo que el codificador no tocó, la inversa tampoco.',
          },
          prompt:
            'Otro codificador: su primera salida es la intensidad **más** el tono, y la segunda, el tono tal cual. Las positivas se han ido a la derecha y las negativas, a la izquierda, cada una a la altura de su diana.\n\nConstruye la capa que devuelve cada reseña a su diana.',
          hints: [
            'Las palabras ya están a la altura de su diana: falla la posición horizontal, y más cuanto mayor es el tono. ¿Qué columna lleva el tono?',
            'Deja $\\hat{\\imath}$ donde está y lleva la punta de $\\hat{\\jmath}$ hacia la izquierda, sin cambiar su altura.',
          ],
          explain:
            'Cada palabra se ha corrido en horizontal tanto como vale su tono. Para devolverla, la primera salida tiene que restar el tono, y la columna que manda el tono a esa salida es $\\hat{\\jmath}$.',
          solution:
            'Con $\\hat{\\jmath}$ en $(-1, 1)$, la primera salida es la del código menos la segunda: la intensidad más el tono, menos el tono. «genial», en $(4{,}5;\\ 2)$, vuelve a $(2{,}5;\\ 2)$. Mover $\\hat{\\imath}$ no sirve: el error de cada palabra depende de su tono, y $\\hat{\\imath}$ solo multiplica la primera salida del código.',
          lab: autoencoder({ i: [1, 0], j: [1, 1] }, { range: 5 }),
          goals: [RECONSTRUYE],
          solved: { jx: -1 },
        },
        {
          id: 'inversa.ex00.3',
          type: 'laboratorio',
          purpose: {
            why: 'Una capa entrenada casi nunca deja un rasgo en una sola salida: cada salida mezcla todos. Para reconstruir la entrada hay que deshacer la mezcla entera, no rasgo a rasgo.',
            aim: 'Vas a decodificar un codificador que gira las reseñas un octavo de vuelta y las aleja del origen, moviendo las dos columnas a la vez.',
            takeaway:
              'Cada columna de la decodificadora mezcla las dos salidas del código, y además encoge: el codificador doblaba las áreas y tu capa las reduce a la mitad. Juntas dan determinante $1$, el producto del de una capa y el de su inversa.',
          },
          prompt:
            'Este codificador mezcla los dos rasgos: su primera salida es la intensidad menos el tono, y la segunda, la suma. Las reseñas han girado un octavo de vuelta y se han alejado del origen. Las lecturas dan el determinante de tu capa y el de las dos juntas.\n\nConstruye la capa que devuelve cada reseña a su diana.',
          hints: [
            'Las positivas están arriba y las negativas, a la derecha: hay que girar hacia atrás. Y todas están más lejos del origen que sus dianas, así que también hay que encoger.',
            'Gira las dos columnas un octavo de vuelta en sentido horario y acórtalas. El determinante de las dos capas juntas tiene que llegar a $1$.',
          ],
          explain:
            'Cada salida del código mezcla los dos rasgos, así que ninguna columna se ajusta por separado. Sumando las dos salidas sale el doble de la intensidad; restándolas, el doble del tono: por eso salen medios.',
          solution:
            'La decodificadora: $\\hat{\\imath}$ en $(0{,}5;\\ -0{,}5)$ y $\\hat{\\jmath}$ en $(0{,}5;\\ 0{,}5)$. La intensidad es la mitad de la suma de las dos salidas y el tono, la mitad de su diferencia. Su determinante es $0{,}5$ y el de las dos capas juntas, $1$. Con $\\hat{\\imath}$ en $(1, -1)$ y $\\hat{\\jmath}$ en $(1, 1)$ el giro se deshace, pero cada palabra queda al doble de lejos.',
          lab: autoencoder({ i: [1, 1], j: [-1, 1] }, { range: 6, readouts: ['det', 'det_total'] }),
          goals: [RECONSTRUYE],
          solved: { ix: 0.5, iy: -0.5, jx: 0.5, jy: 0.5 },
        },
        {
          id: 'inversa.ex00.4',
          type: 'laboratorio',
          purpose: {
            why: 'Un cuello de botella de verdad tira información. Si el codificador borra un rasgo, ningún decodificador lo recupera: como mucho lo adivina para algunas palabras, las que siguen una regla que la capa pueda aprender.',
            aim: 'Vas a buscar la decodificadora que devuelve a su diana el mayor número posible de reseñas, cuando el codificador ha borrado la intensidad.',
            takeaway:
              'Solo se salvan dos: «malo» y «triste», cuya intensidad es su tono con el signo cambiado. A las demás, la capa no puede devolverles la intensidad que el código ya no lleva. Una capa que aplasta no tiene inversa: lo que borra no vuelve.',
          },
          prompt:
            'Este codificador se queda con el tono y borra la intensidad: todas las reseñas caen sobre el eje vertical, a la altura de su tono. Lo que el código no lleva, tu capa tendrá que adivinarlo, y ningún decodificador devuelve las seis a su diana.\n\n¿Cuántas puedes salvar? Consigue el máximo.',
          hints: [
            'Tu capa solo recibe el tono: cada palabra acaba en su tono por $\\hat{\\jmath}$, y $\\hat{\\imath}$ no hace nada. Busca palabras cuya intensidad salga de su tono con la misma regla.',
            'En «malo» y «triste», la intensidad es el tono con el signo cambiado. Inclina $\\hat{\\jmath}$ hacia la izquierda hasta que las dos se posen en su diana.',
          ],
          explain:
            'Sin la intensidad, el código de cada palabra es $(0,\\ \\text{tono})$, y tu capa la manda a su tono por $\\hat{\\jmath}$. Todas las salidas caen en una misma recta: solo aciertan las palabras cuya diana está en esa recta, a la distancia justa.',
          solution:
            'Con $\\hat{\\jmath}$ en $(-1, 1)$, «malo» vuelve a $(1, -1)$ y «triste», a $(1{,}5;\\ -1{,}5)$: dos. «bueno» acaba en $(-1, 1)$, lejos de su diana: la recta que pasa por las otras dos no pasa por la suya. Ninguna otra regla junta dos palabras: el máximo es dos, y $\\hat{\\imath}$ puede quedar donde quieras.',
          lab: autoencoder({ i: [0, 0], j: [0, 1] }),
          goals: [
            {
              metric: 'on_target',
              op: 'gte',
              target: 2,
              label: 'Palabras que vuelven a su diana',
              format: 'integer',
            },
          ],
          solved: { jx: -1 },
        },
        {
          id: 'inversa.ex00.5',
          type: 'laboratorio',
          purpose: {
            why: 'Un codificador que casi aplasta deja palabras distintas casi en el mismo código. Para separarlas, la decodificadora necesita pesos enormes, y esos pesos amplifican igual cualquier ruido del código: un redondeo, un error de medida.',
            aim: 'Vas a decodificar un codificador que deja las reseñas apiñadas cerca de una recta, y a ver qué tamaño necesita la capa que las separa.',
            takeaway:
              'La decodificadora tiene columnas de casi $3$ y casi $4{,}5$ de largo, y multiplica las áreas por $4$. Un error de $0{,}25$ en la segunda salida del código acaba a más de $1$ de la diana: deshacer una capa casi singular amplifica el ruido.',
          },
          prompt:
            'Este codificador casi aplasta: deja las reseñas apiñadas cerca de una recta, con «malo» y «triste» casi en el mismo cuadradito. Su determinante es solo $0{,}25$. La lectura da el determinante de tu capa.\n\nConstruye la capa que devuelve cada reseña a su diana. Vas a necesitar columnas largas.',
          hints: [
            'Las palabras están mucho más juntas que sus dianas: la decodificadora tiene que separarlas, y estirar mucho en la dirección en la que el codificador apretó.',
            'Las dos columnas van lejos: $\\hat{\\imath}$ hacia abajo a la derecha y $\\hat{\\jmath}$ hacia arriba a la izquierda, más larga. El determinante de tu capa tiene que acabar en $4$.',
          ],
          explain:
            'El codificador deja cada región con $0{,}25$ veces el área de antes. La capa que lo deshace tiene que multiplicarla por $4$, y unas columnas cortas no pueden: la inversa crece cuando el determinante se acerca a $0$.',
          solution:
            'La decodificadora: $\\hat{\\imath}$ en $(2, -2)$ y $\\hat{\\jmath}$ en $(-2, 4)$, con determinante $4$. «malo» y «triste», a $0{,}25$ en el código, vuelven a $(1, -1)$ y $(1{,}5;\\ -1{,}5)$, a más de $0{,}7$. Con $\\hat{\\jmath}$ medio paso más corta, en $(-2;\\ 3{,}5)$, «genial» se queda a más de $1$ de su diana.',
          lab: autoencoder({ i: [1, 0.5], j: [0.5, 0.5] }, { range: 5, readouts: ['det'] }),
          goals: [RECONSTRUYE],
          solved: { ix: 2, iy: -2, jx: -2, jy: 4 },
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'inversa.ex01.1',
          type: 'vector',
          purpose: {
            why: 'Con un codificador conocido, saber qué entrada produjo un código es resolver un sistema: dos salidas y dos rasgos desconocidos. Es lo que hace un decodificador, y lo que se pregunta al inspeccionar qué guarda una capa.',
            aim: 'Vas a deducir los dos rasgos de una reseña nueva a partir de su código, sabiendo cómo mezcla el codificador la intensidad y el tono.',
            takeaway:
              'Sumando las dos salidas sale el doble de la intensidad y restándolas, el doble del tono: la reseña tenía intensidad $1$ y tono $2$. Resolver el sistema es aplicar la inversa sin escribirla.',
          },
          prompt:
            'El codificador mezcla los rasgos: $\\text{salida 1}=\\text{intensidad}-\\text{tono}$ y $\\text{salida 2}=\\text{intensidad}+\\text{tono}$. Llega el código de una reseña nueva: $(-1, 3)$. ¿Qué intensidad y qué tono tenía? El laboratorio enseña adónde manda el codificador otras seis.',
          hints: [
            'Escribe las dos ecuaciones: intensidad menos tono da $-1$, e intensidad más tono da $3$.',
            'Suma las dos ecuaciones: el tono desaparece. Después, resta la primera de la segunda.',
          ],
          explain:
            'El código son dos ecuaciones con dos incógnitas. Como cada salida mezcla los dos rasgos, ninguno se lee directamente: hay que combinar las dos salidas.',
          solution:
            'Sumando, $2\\cdot\\text{intensidad}=2$: intensidad $1$. Restando la primera de la segunda, $2\\cdot\\text{tono}=4$: tono $2$. La reseña es $(1, 2)$, y se comprueba: $1-2=-1$ y $1+2=3$. Es la inversa del codificador aplicada al código.',
          lab: capaLab(RESENAS, { range: 5, i: [1, 1], j: [-1, 1], movable: 'none' }),
          answer: [1, 2],
          tol: 0,
        },
        {
          id: 'inversa.ex01.2',
          type: 'opcion',
          purpose: {
            why: 'Antes de entrenar un decodificador conviene saber si el codificador se puede deshacer. Si manda dos entradas distintas al mismo código, ningún decodificador sabrá de cuál venía.',
            aim: 'Vas a decidir si existe una capa que deshaga esta, mirando adónde manda las seis reseñas.',
            takeaway:
              'Sus dos columnas son paralelas: todas las reseñas caen en una recta y «horrible» y «triste» salen iguales. No hay inversa: ninguna capa separa lo que esta ha juntado. Su determinante es $0$.',
          },
          prompt:
            'Esta capa tiene $\\hat{\\imath}$ en $(0{,}5;\\ 0{,}5)$ y $\\hat{\\jmath}$ en $(1, 1)$. Un equipo quiere entrenar un decodificador que reconstruya las reseñas a partir de su salida. Mira en el laboratorio adónde las manda. ¿Existe una capa que la deshaga?',
          hints: [
            'Mira la salida: ¿quedan las seis reseñas en sitios distintos? ¿Por dónde se reparten?',
            'Las dos columnas apuntan en la misma dirección. Busca dos palabras que hayan caído en el mismo punto.',
          ],
          explain:
            'Una capa se puede deshacer si manda cada entrada a un sitio distinto. Si dos entradas acaban en el mismo punto, a la salida no queda nada que las distinga.',
          solution:
            'Cada reseña sale en $(0{,}5\\cdot\\text{intensidad}+\\text{tono})$ veces $(1, 1)$: todas caen en la diagonal. «horrible» da $1{,}25-2=-0{,}75$ y «triste», $0{,}75-1{,}5=-0{,}75$: el mismo punto. El determinante es $0{,}5\\cdot 1-1\\cdot 0{,}5=0$. Que no haya ceros en la matriz no decide nada.',
          lab: capaLab(RESENAS, { i: [0.5, 0.5], j: [1, 1], movable: 'none' }),
          options: [
            'Sí: una capa con columnas $(2, 2)$ y $(1, 1)$ la deshace',
            'No: manda «horrible» y «triste» al mismo punto, y ninguna capa puede saber de cuál venía',
            'Sí, porque ninguno de sus pesos es $0$',
            'Solo si antes se gira el plano un cuarto de vuelta',
          ],
          correct: 1,
        },
        {
          id: 'inversa.ex01.3',
          type: 'numero',
          purpose: {
            why: 'Antes de entrar en una red, los datos se suelen normalizar: cada rasgo se multiplica por un factor para dejarlo en una escala parecida. Para devolver una reconstrucción a las unidades de verdad, hay que deshacer ese paso.',
            aim: 'Vas a calcular por cuánto multiplica las áreas la capa que deshace una normalización que reduce los dos rasgos a la mitad.',
            takeaway:
              'La normalización deja las áreas en la cuarta parte, $0{,}5\\cdot 0{,}5$; la capa que la deshace las multiplica por $4$. El determinante de la inversa es siempre $1$ entre el de la capa.',
          },
          prompt:
            'Una normalización multiplica la intensidad y el tono por $0{,}5$ antes de entrar en la red: es la capa fija de los cuadraditos. ¿Cuál es el determinante de la capa que la deshace? Puedes construirla en el laboratorio: las dianas son las reseñas sin normalizar.',
          hints: [
            '¿Por cuánto tiene que multiplicar cada rasgo la capa que deshace la normalización?',
            'El determinante de una capa que solo escala es el producto de sus dos factores.',
          ],
          explain:
            'La capa que deshace la normalización devuelve cada rasgo a su tamaño, así que multiplica los dos por $2$. Su determinante dice por cuánto multiplica las áreas.',
          solution:
            'La capa que deshace es $\\begin{pmatrix}2&0\\\\0&2\\end{pmatrix}$, y su determinante, $2\\cdot 2=4$. El de la normalización es $0{,}25$, y $4\\cdot 0{,}25=1$: juntas, las áreas no cambian. Contestar $2$ es dar el factor de cada rasgo, no el de las áreas.',
          lab: autoencoder({ i: [0.5, 0], j: [0, 0.5] }),
          answer: 4,
          tol: 0,
        },
        {
          id: 'inversa.ex01.4',
          type: 'numero',
          purpose: {
            why: 'Un modelo de precios se suele entrenar con el precio estandarizado: menos la media, entre la desviación. Lo que predice sale en esas unidades, y antes de enseñarlo hay que deshacer el paso, como hace `inverse_transform` en scikit-learn.',
            aim: 'Vas a devolver a euros la predicción de un modelo entrenado con precios estandarizados, deshaciendo los dos pasos en el orden contrario.',
            takeaway:
              'Se deshace al revés: primero se multiplica por la desviación y después se suma la media, $0{,}5\\cdot 60+240=270$ mil euros. Deshacer en el orden en que se aplicó da otro número, y el modelo parece fallar cuando el fallo está en la cuenta.',
          },
          prompt:
            'Un modelo de precios de pisos se entrenó con el precio estandarizado: al precio se le restó la media, $240$ mil euros, y se dividió entre la desviación típica, $60$ mil. Para un piso, el modelo predice $0{,}5$. ¿Cuántos miles de euros vale, según el modelo?',
          hints: [
            'La estandarización restó y después dividió. Para deshacerla, empieza por lo último que se hizo.',
            'Multiplica la predicción por la desviación y súmale la media.',
          ],
          explain:
            'Estandarizar es restar la media y dividir entre la desviación. Deshacerlo es multiplicar por la desviación y sumar la media: los mismos pasos, al revés y en orden contrario.',
          solution:
            '$0{,}5\\cdot 60=30$ mil por encima de la media, y $240+30=270$ mil euros. En el otro orden, sumando antes la media, saldría $(0{,}5+240)\\cdot 60=14\\,430$, sin sentido. Un $0{,}5$ estandarizado es media desviación por encima de la media.',
          answer: 270,
          tol: 0,
        },
        {
          id: 'inversa.ex01.5',
          type: 'opcion',
          purpose: {
            why: 'Al ajustar una regresión lineal o deshacer una capa en código hay que resolver sistemas. Las librerías numéricas ofrecen dos caminos, y elegir mal hace el programa más lento y menos preciso, sobre todo con matrices grandes.',
            aim: 'Vas a elegir por qué un ingeniero escribe `np.linalg.solve(W, y)` en vez de `np.linalg.inv(W) @ y` para recuperar una entrada a partir de una salida.',
            takeaway:
              '`solve` resuelve el sistema sin construir la inversa entera: hace menos cuentas y redondea menos. Con matrices grandes o casi singulares, esa diferencia se nota. Si la matriz aplasta, ninguna de las dos recupera la entrada.',
          },
          prompt:
            'Una capa $W$ ha producido la salida $\\vec{y}$, y quieres recuperar la entrada $\\vec{x}$ con $W\\vec{x}=\\vec{y}$. En NumPy puedes escribir `np.linalg.inv(W) @ y` o `np.linalg.solve(W, y)`. Las dos dan el mismo vector, salvo redondeos. ¿Por qué se prefiere `solve`?',
          hints: [
            'Piensa en lo que hace cada una: una construye una matriz entera y después multiplica; la otra va directa al vector.',
            'Si el determinante es $0$, ninguna de las dos puede recuperar la entrada: dos entradas dieron la misma salida.',
          ],
          explain:
            'Construir $W^{-1}$ entera es más trabajo que resolver un solo sistema, y cada cuenta de más añade redondeo. Si $W$ aplasta, ninguna de las dos recupera la entrada, porque la información ya no está.',
          solution:
            '`solve` factoriza $W$ y despeja el vector en orden, sin construir la inversa: menos operaciones y menos error de redondeo. Con una matriz singular, tampoco `solve` da una entrada válida. Y `inv` no exige que la matriz sea diagonal ni cambia $W$.',
          options: [
            'Porque `inv` solo sirve para matrices diagonales',
            'Porque resuelve el sistema sin construir la inversa: hace menos cuentas y acumula menos error de redondeo',
            'Porque `solve` encuentra la entrada aunque el determinante sea $0$',
            'Porque `inv` modifica la matriz $W$ al calcular su inversa',
          ],
          correct: 1,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'inversa.ex02.1',
          type: 'codigo',
          prompt:
            'NumPy calcula la inversa de una matriz con `np.linalg.inv`. Ya tienes `A`. Guarda en `Ainv` su inversa y en `es_inversa` si `A @ Ainv` es la identidad, como un solo `True` o `False`. Con decimales de por medio no se compara con `==`: `np.allclose` compara con una tolerancia para el redondeo.',
          hints: [
            'El plan son dos líneas. Primero `Ainv`: la inversa de `A`, que te da `np.linalg.inv` con `A` dentro del paréntesis. Después `es_inversa`: multiplica `A` por `Ainv` con `@` y comprueba con `np.allclose` si lo que sale es la identidad de $2\\times 2$, que en NumPy se escribe `np.eye(2)`. No uses `==`: da una matriz de `True` y `False`, no uno solo.',
            'Así se escribe cada pieza, con otra matriz para que veas la forma sin que sea la respuesta:\n\n' +
              py(
                'M = np.array([[2, 1], [1, 1]])',
                'Minv = np.linalg.inv(M)                 # la inversa de M: otra matriz de 2 filas y 2 columnas',
                'print(np.eye(2))                        # [[1. 0.]',
                '                                        #  [0. 1.]]: la identidad de 2 por 2',
                'print(np.allclose(M @ Minv, np.eye(2))) # True: allclose compara con tolerancia y da un solo valor',
              ) +
              '\n\n`@` es el producto de matrices. `np.allclose(X, Y)` dice `True` si todas las entradas de `X` e `Y` coinciden salvo el redondeo.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('Ainv = np.linalg.inv(___)', 'es_inversa = np.allclose(A @ Ainv, ___)') +
              '\n\nEn el primer hueco va la matriz que quieres invertir; en el segundo, la matriz con la que tiene que coincidir el producto. No calcules `1 / A`: eso es el inverso de cada entrada por separado, no la inversa de la matriz.',
          ],
          explain:
            'El producto de `A` por su inversa es la identidad solo salvo errores de redondeo, del orden de $10^{-16}$. Comparar con `==` exige igualdad exacta y puede dar `False` aunque la inversa sea correcta, y además da un array de valores, no uno solo.',
          solution:
            'Se escribe `Ainv = np.linalg.inv(A)`, que vale $\\begin{pmatrix}1&-3\\\\-1&4\\end{pmatrix}$, y `es_inversa = np.allclose(A @ Ainv, np.eye(2))`, que da `True`. Con `1 / A` se obtendría el inverso de cada entrada por separado, que no es la inversa de la matriz.',
          requirements: [
            '`Ainv` es un array de NumPy con 2 filas y 2 columnas de números: la matriz que, multiplicada por `A`, da la identidad. Se acepta con un pequeño error de redondeo.',
            '`es_inversa` es un solo `True` o `False` (no una matriz de valores), y dice que el producto de `A` por `Ainv` es la identidad salvo el redondeo.',
          ],
          starter: `import numpy as np

# A es una matriz de NumPy con 2 filas y 2 columnas: A[0, 0] vale 4, el de arriba a la izquierda.
# A @ B es el producto de matrices (no multiplica entrada a entrada).
A = np.array([[4, 3], [1, 1]])

# PASO 1. La inversa de A: la matriz que deshace lo que hace A.
# Por qué: si A @ Ainv es la identidad, Ainv deshace a A. Es lo que quieres comprobar en el paso 2.
# np.linalg.inv(M) devuelve la inversa de la matriz que pongas entre los paréntesis.
# El resultado es una matriz de NumPy de 2 filas y 2 columnas.
Ainv = None

# PASO 2. Comprobar que A @ Ainv es la identidad.
# Por qué: con decimales, el producto sale con un error de redondeo diminuto, y comparar con ==
# daría False aunque la inversa fuera buena (además daría una matriz de True y False, no uno solo).
# np.eye(2) es la identidad de 2 por 2.
# np.allclose(X, Y) compara dos matrices con una pequeña tolerancia y devuelve un solo True o False.
es_inversa = None

# Para ver qué vale algo antes de entregar: print(Ainv) y pulsa «Ejecutar».
`,
          checks: `_m = isinstance(Ainv, np.ndarray) and Ainv.shape == (2, 2) and np.issubdtype(Ainv.dtype, np.number)
_good = _m and np.allclose(Ainv, [[1, -3], [-1, 4]])
_b = isinstance(es_inversa, (bool, np.bool_))
check(_m, "\`Ainv\` tiene que ser una matriz de NumPy de 2 filas y 2 columnas: la inversa de \`A\`.")
check((not _m) or not np.allclose(Ainv, 1 / A), "\`Ainv\` tiene el inverso de cada entrada por separado. La inversa de una matriz no se calcula entrada a entrada: para eso está \`np.linalg.inv\`.")
check((not _m) or np.allclose(Ainv, 1 / A) or _good, "\`Ainv\` tiene que valer (1, -3) en la primera fila y (-1, 4) en la segunda: es la matriz que, multiplicada por \`A\`, da la identidad.")
check(_b, "\`es_inversa\` tiene que ser un solo \`True\` o \`False\`. La comparación con \`==\` da una matriz de valores; \`np.allclose\` da uno solo.")
check((not _b) or (not _good) or bool(es_inversa), "\`es_inversa\` vale \`False\`, pero el producto de \`A\` por su inversa es la identidad salvo redondeo. Compara con \`np.allclose\`, que tiene tolerancia, y no con \`==\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[4, 3], [1, 1]])\nAinv = np.linalg.inv(A)\nes_inversa = np.allclose(A @ Ainv, np.eye(2))\n',
        },
        {
          id: 'inversa.ex02.2',
          type: 'codigo',
          prompt:
            'Para resolver $A\\vec{x}=\\vec{b}$ en código, `np.linalg.solve(A, b)` es mejor que calcular la inversa y multiplicar: es más rápida y pierde menos precisión. Ya tienes `A` y `b`. Guarda en `x` la solución y en `coincide` si `A @ x` coincide con `b`, como un solo `True` o `False`.',
          hints: [
            'El plan son dos líneas. Primero `x`: `np.linalg.solve` resuelve el sistema, y recibe primero la matriz y después el vector del lado derecho, en ese orden. Después `coincide`: multiplica `A` por tu `x` con `@` y compara con `b` usando `np.allclose`, que da un solo `True` o `False` (con `==` saldría un array).',
            'Así se escribe cada pieza, con otro sistema para que veas la forma sin que sea la respuesta:\n\n' +
              py(
                'M = np.array([[1, 1], [1, -1]])',
                'c = np.array([4, 2])',
                'sol = np.linalg.solve(M, c)             # primero la matriz, después el vector: M @ sol = c',
                'print(sol)                              # [3. 1.]: un array con 2 números',
                'print(np.allclose(M @ sol, c))          # True: M @ sol sí da c',
              ) +
              '\n\n`@` multiplica la matriz por el vector. `np.allclose(X, Y)` compara con una pequeña tolerancia y da un solo valor.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('x = np.linalg.solve(___, ___)', 'coincide = np.allclose(___ @ x, ___)') +
              '\n\nEl orden importa en `solve`: la matriz va primero y el vector de la derecha después. Si los cambias, no resuelves el sistema que quieres.',
          ],
          explain:
            'La matriz va primero y el vector de la derecha después. La comprobación multiplica la matriz por la solución: si no sale `b`, la solución es otra.',
          solution:
            'Se escribe `x = np.linalg.solve(A, b)`, que vale $(1, 3)$, y `coincide = np.allclose(A @ x, b)`, que da `True`. Es lo mismo que $A^{-1}\\vec{b}$ sin construir la inversa entera. Con `np.linalg.inv(A) @ b` sale el mismo vector, pero con un paso más y algo más de error de redondeo.',
          requirements: [
            '`x` es un array de NumPy con 2 números: el vector que `A` lleva hasta `b`, es decir, el que cumple $A\\vec{x}=\\vec{b}$.',
            '`coincide` es un solo `True` o `False` (no una matriz de valores), y dice que `A @ x` es igual a `b` salvo el redondeo.',
          ],
          starter: `import numpy as np

# A es una matriz de NumPy con 2 filas y 2 columnas.
# b es un array de NumPy con 2 números: el lado derecho del sistema.
A = np.array([[2, 1], [1, 3]])
b = np.array([5, 10])

# PASO 1. La solución de A x = b: el vector x que A lleva hasta b.
# Por qué: es la entrada que, pasada por A, produce b. Es lo mismo que invertir A y multiplicar,
# pero resolverlo directo es más rápido y pierde menos precisión.
# np.linalg.solve(M, c) resuelve el sistema M x = c: primero la matriz, después el vector.
# El resultado es un array de NumPy con 2 números.
x = None

# PASO 2. Comprobar que A @ x da b.
# Por qué: así sabes que x es de verdad una solución, y no solo un vector que lo parece.
# A @ x multiplica la matriz por el vector. Con decimales, no se compara con ==: da un array de
# True y False, y puede fallar por el redondeo.
# np.allclose(X, Y) compara con una pequeña tolerancia y devuelve un solo True o False.
coincide = None

# Para ver qué vale algo antes de entregar: print(x) y pulsa «Ejecutar».
`,
          checks: `_x = isinstance(x, np.ndarray) and x.shape == (2,) and np.issubdtype(x.dtype, np.number)
_good = _x and np.allclose(x, [1, 3])
_b = isinstance(coincide, (bool, np.bool_))
check(_x, "\`x\` tiene que ser un array de NumPy con 2 números: la solución del sistema.")
check((not _x) or _good, "\`x\` tiene que valer (1, 3): es el vector que \`A\` lleva hasta \`b\`, es decir, \`A @ x\` tiene que dar \`b\`.")
check(_b, "\`coincide\` tiene que ser un solo \`True\` o \`False\`. La comparación con \`==\` da una matriz de valores; \`np.allclose\` da uno solo.")
check((not _b) or (not _good) or bool(coincide), "\`coincide\` vale \`False\`, pero \`A @ x\` sí da \`b\`. Compara con \`np.allclose\`, que tiene tolerancia para el redondeo.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[2, 1], [1, 3]])\nb = np.array([5, 10])\nx = np.linalg.solve(A, b)\ncoincide = np.allclose(A @ x, b)\n',
        },
        {
          id: 'inversa.ex02.3',
          type: 'codigo',
          prompt:
            'No toda matriz tiene inversa, y `np.linalg.inv` no avisa si no la tiene: según el entorno lanza un error o devuelve una matriz de `nan`. Escribe `inversa_segura(M)`, que devuelve la inversa de `M` si existe y `None` si `M` es singular, es decir, de determinante $0$. Después guarda en `Ainv` lo que devuelve para `A`. Con decimales, el determinante casi nunca es exactamente $0$: compáralo con `np.isclose`.',
          hints: [
            'El plan, dentro de `inversa_segura`: calcula el determinante de `M` con `np.linalg.det(M)` y guárdalo en `d`. Si `d` es casi $0$ (compruébalo con `np.isclose(d, 0)`, no con `==`), la matriz es singular y devuelves `None`. Si no, devuelves `np.linalg.inv(M)`. Mira el determinante antes de invertir, no después. Fuera de la función, `Ainv` es una llamada: `inversa_segura(...)` con `A` dentro.',
            'Las piezas, probadas con una matriz singular de ejemplo:\n\n' +
              py(
                'N = np.array([[1, 2], [2, 4]])          # la segunda fila es el doble de la primera',
                'd = np.linalg.det(N)',
                'print(d)                                # 0.0: el determinante de N',
                'print(np.isclose(d, 0))                 # True: casi cero, así que N es singular',
                'print(np.isclose(5.0, 0))               # False: 5 no es casi cero',
              ) +
              '\n\nUn `if` ejecuta lo que lleva debajo (con 4 espacios más de sangría) solo si su condición es `True`. `return None` sale de la función en ese momento, y el `return` de más abajo ya no se ejecuta.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def inversa_segura(M):',
                '    d = np.linalg.det(M)',
                '    if np.isclose(d, ___):',
                '        return ___',
                '    return np.linalg.___(M)',
                '',
                'Ainv = ___(A)',
              ) +
              '\n\nNo devuelvas la inversa sin mirar antes el determinante: con una matriz singular no hay inversa que devolver, y la función tiene que contestar `None`.',
          ],
          explain:
            'Hay que mirar el determinante antes de invertir: pedir la inversa de una matriz singular no da una inversa, sino que lanza un error o devuelve `nan`. Comparar el determinante con `== 0` es frágil, porque el redondeo puede dejar un valor diminuto en lugar de cero.',
          solution:
            'Se calcula el determinante `d = np.linalg.det(M)`; si `np.isclose(d, 0)`, se devuelve `None`, y si no, `np.linalg.inv(M)`. Para `A` el determinante vale $1\\cdot 7-2\\cdot 3=1$ y `Ainv` es $\\begin{pmatrix}7&-2\\\\-3&1\\end{pmatrix}$. Para $\\begin{pmatrix}2&4\\\\1&2\\end{pmatrix}$, de columnas paralelas, la función devuelve `None`.',
          requirements: [
            '`inversa_segura` es una función que recibe una matriz de $2\\times 2$ y devuelve su inversa, un array de NumPy de 2 filas y 2 columnas, si la tiene.',
            'Se llama a la función con otras matrices de $2\\times 2$, varias con inversa y alguna sin ella; la inversa devuelta, multiplicada por la matriz, da la identidad.',
            'Con una matriz singular la función no lanza un error ni devuelve una matriz de `nan`: devuelve `None`.',
            '`Ainv` es un array de NumPy con 2 filas y 2 columnas de números: lo que devuelve `inversa_segura` para `A`.',
          ],
          starter: `import numpy as np

# A es una matriz de NumPy con 2 filas y 2 columnas; A[0, 1] vale 2.
A = np.array([[1, 2], [3, 7]])


def inversa_segura(M):
    # M llega como parámetro: una matriz de NumPy de 2 filas y 2 columnas, distinta cada vez que
    # se llama a la función (las comprobaciones la prueban con otras). Usa M, no A.
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría): así sabe Python
    # que es parte de ella.
    #
    # PASO 1. El determinante de M.
    # Por qué: una matriz sin inversa (singular) es la que aplasta el plano, y eso se nota en que
    # su determinante vale 0. Hay que mirarlo antes de invertir.
    # np.linalg.det(M) devuelve el determinante: un solo número.
    #
    # PASO 2. Decidir si M es singular.
    # Por qué: con decimales el determinante casi nunca sale exactamente 0, así que se compara con
    # np.isclose(d, 0), que dice True si d es casi 0. Con == 0 se escaparían casos.
    # if condición: ejecuta lo que lleva debajo (4 espacios más de sangría) solo si la condición es True.
    # Si es singular, devuelve None con return None.
    #
    # PASO 3. Si no es singular, devuelve su inversa con np.linalg.inv(M).
    # return saca el valor de la función y termina: lo que haya debajo ya no se ejecuta.
    #
    # Mientras no escribas los pasos, la función devuelve siempre None.
    return None


# PASO 4. Llamar a la función con A.
# Por qué: así compruebas que funciona con una matriz real. Una función se llama escribiendo su
# nombre y, entre paréntesis, lo que recibe: inversa_segura(...).
# El resultado es una matriz de NumPy de 2 filas y 2 columnas.
Ainv = None

# Para ver qué vale algo antes de entregar: print(Ainv) y pulsa «Ejecutar».
`,
          checks: `_f = callable(globals().get("inversa_segura"))
def _run(M):
    try:
        return ("ok", inversa_segura(M))
    except Exception:
        return ("error", None)
def _inv_of(r, M):
    return r[0] == "ok" and isinstance(r[1], np.ndarray) and r[1].shape == (2, 2) and bool(np.allclose(r[1] @ M, np.eye(2)))
_G = np.array([[1, 2], [3, 7]])
_H = np.array([[2, 1], [5, 3]])
_K = np.array([[3, 1], [1, 2]])
_S = np.array([[2, 4], [1, 2]])
_T = np.array([[0, 0], [1, 5]])
_ok = _f and _inv_of(_run(_G), _G) and _inv_of(_run(_H), _H) and _inv_of(_run(_K), _K)
_s = _run(_S) if _f else ("ok", None)
_t = _run(_T) if _f else ("ok", None)
_arr = isinstance(Ainv, np.ndarray) and Ainv.shape == (2, 2) and np.issubdtype(Ainv.dtype, np.number)
check(_f, "Hay que definir una función \`inversa_segura\` que reciba la matriz.")
check((not _f) or _ok, "\`inversa_segura\` tiene que devolver la inversa de una matriz que sí la tiene: un array de NumPy de 2 filas y 2 columnas que, multiplicado por la matriz, da la identidad.")
check((not _ok) or (_s[0] != "error" and _t[0] != "error"), "\`inversa_segura\` lanza un error con una matriz singular. Hay que mirar el determinante antes de calcular la inversa.")
check((not _ok) or _s[0] == "error" or _t[0] == "error" or (_s[1] is None and _t[1] is None), "\`inversa_segura\` tiene que devolver \`None\` con una matriz singular, y no una matriz: \`np.linalg.inv\` no avisa, y puede dar una matriz de \`nan\`.")
check(_arr, "\`Ainv\` tiene que ser una matriz de NumPy de 2 filas y 2 columnas: la inversa de \`A\`.")
check((not _arr) or np.allclose(Ainv, [[7, -2], [-3, 1]]), "\`Ainv\` tiene que valer (7, -2) en la primera fila y (-3, 1) en la segunda: es lo que devuelve \`inversa_segura\` para \`A\`.")
`,
          reference: `import numpy as np

A = np.array([[1, 2], [3, 7]])


def inversa_segura(M):
    d = np.linalg.det(M)
    if np.isclose(d, 0):
        return None
    return np.linalg.inv(M)


Ainv = inversa_segura(A)
`,
        },
        {
          id: 'inversa.ex02.4',
          type: 'codigo',
          prompt:
            'Dos capas lineales se aplican seguidas a una entrada `x`: primero `A` y después `B`, así que la salida es `y = B @ (A @ x)`. Ya tienes `A`, `B` e `y`. Recupera la entrada: guarda en `x` el vector que produce esa salida. Las capas se deshacen en el orden contrario al que se aplicaron.',
          hints: [
            'El plan: la entrada pasó primero por `A` y después por `B`, así que para volver hay que deshacer primero la capa que actuó la última, `B`, y después `A`. Deshacer una capa es multiplicar por su inversa, que da `np.linalg.inv`. Escribe en `x` la cuenta con las dos inversas y `y`, en el orden en que actúan: lo que actúa primero sobre `y` va más a la derecha del producto. Si las pones al revés, sale otro vector.',
            'Así se escribe cada pieza, con otras capas para que veas la forma sin que sea la respuesta:\n\n' +
              py(
                'C = np.array([[2, 0], [0, 1]])          # primera capa: dobla la primera componente',
                'D = np.array([[1, 1], [0, 1]])          # segunda capa',
                'z = np.array([5, 2])                    # lo que sale tras pasar por C y después por D',
                'ultima = np.linalg.inv(D) @ z           # deshace D, la última capa: un array con 2 números',
                'print(ultima)                           # [3. 2.]',
                'print(np.linalg.inv(C) @ ultima)        # [1.5 2. ]: deshace también C y recupera la entrada',
              ) +
              '\n\nCon `@` el producto se lee de derecha a izquierda: en `inv(C) @ inv(D) @ z`, la primera inversa en actuar sobre `z` es la de `D`. Como alternativa, `np.linalg.solve(D @ C, z)` resuelve las dos capas juntas.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'h = np.linalg.inv(___) @ y              # deshace la última capa',
                'x = np.linalg.inv(___) @ h              # deshace la primera',
              ) +
              '\n\nEn el primer hueco va la capa que actuó la última. Si pones primero la inversa de `A`, deshaces las capas en el mismo orden en que se aplicaron, y sale otro vector.',
          ],
          explain:
            'La entrada pasó por `A` y después por `B`; para volver hay que deshacer `B` y luego `A`. La inversa de `B` actúa primero sobre `y`, así que va a la derecha del producto. Con las inversas en el otro orden sale un vector distinto.',
          solution:
            'Se escribe `x = np.linalg.inv(A) @ np.linalg.inv(B) @ y`: la inversa de `B` actúa primero sobre `y` y da $(4, 1)$, y la de `A` da $(2, 1)$. Equivale a $(BA)^{-1}\\vec{y}$, es decir, a `np.linalg.solve(B @ A, y)`. Con las inversas en el orden `inv(B) @ inv(A)` saldría $(-6, 11)$, que no es la entrada.',
          requirements: [
            '`x` es un array de NumPy con 2 números: la entrada que, pasada por la capa `A` y después por la capa `B`, da la salida `y`.',
            'El orden importa: se deshace primero la última capa que actuó y después la primera. Deshacerlas en el mismo orden en que actuaron da otro vector.',
          ],
          starter: `import numpy as np

# A y B son dos capas: matrices de NumPy con 2 filas y 2 columnas.
# La entrada x pasó primero por A y después por B, así que y = B @ (A @ x).
# y es un array de NumPy con 2 números: la salida que ya tienes.
A = np.array([[1, 2], [0, 1]])
B = np.array([[1, 0], [1, 1]])
y = np.array([4, 5])

# PASO 1. Recuperar la entrada x.
# Por qué: para volver atrás hay que deshacer las capas en el orden contrario al que se aplicaron,
# como quitarse los calcetines y luego los zapatos: la última capa, B, se deshace primero; después, A.
# Deshacer una capa es multiplicar por su inversa: np.linalg.inv(M) es la inversa de M.
# M @ N @ y se lee de derecha a izquierda: N actúa primero sobre y, y M después.
# El resultado es un array de NumPy con 2 números.
x = None

# Para ver qué vale algo antes de entregar: print(x) y pulsa «Ejecutar».
`,
          checks: `_x = isinstance(x, np.ndarray) and x.shape == (2,) and np.issubdtype(x.dtype, np.number)
_rev = _x and np.allclose(x, [-6, 11])
check(_x, "\`x\` tiene que ser un array de NumPy con 2 números: la entrada que se busca.")
check((not _x) or not _rev, "\`x\` sale de deshacer las capas en el mismo orden en que se aplicaron. La última capa que actuó, \`B\`, es la primera que hay que deshacer: su inversa va a la derecha del producto.")
check((not _x) or _rev or np.allclose(x, [2, 1]), "\`x\` tiene que valer (2, 1): al pasarlo por la capa \`A\` y después por la capa \`B\` tiene que salir \`y\`.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[1, 2], [0, 1]])\nB = np.array([[1, 0], [1, 1]])\ny = np.array([4, 5])\nx = np.linalg.inv(A) @ np.linalg.inv(B) @ y\n',
        },
        {
          id: 'inversa.ex02.5',
          type: 'codigo',
          prompt:
            'Una capa lineal de una red calcula `y = W @ x + b`: multiplica la entrada `x` por `W` y le suma el sesgo `b`. Si `W` es invertible, la entrada se puede recuperar a partir de la salida. Ya tienes `W`, `b` y la salida `y`. Guarda en `x` la entrada que produjo `y`, y en `reconstruye` si volver a pasarla por la capa da `y`, como un solo `True` o `False`.',
          hints: [
            'El plan son dos líneas. Primero `x`: la capa hizo `W @ x + b`, con el sesgo sumado al final, así que lo primero es quitárselo a `y` (`y - b` es lo que salió de multiplicar por `W`) y después resolver `W @ x = y - b` con `np.linalg.solve`. Después `reconstruye`: vuelve a pasar `x` por la capa, `W @ x + b`, y compara con `y` usando `np.allclose`, que da un solo `True` o `False`. Error típico: restar el sesgo después de resolver, o no restarlo.',
            'Así se escribe cada pieza, con otra capa para que veas la forma sin que sea la respuesta:\n\n' +
              py(
                'V = np.array([[1, 0], [1, 1]])',
                'sesgo = np.array([1, 1])',
                'salida = np.array([3, 6])',
                'resto = salida - sesgo                  # [2 5]: la salida sin el sesgo, lo que dejó V',
                'entrada = np.linalg.solve(V, resto)     # resuelve V @ entrada = resto',
                'print(entrada)                          # [2. 3.]',
                'print(np.allclose(V @ entrada + sesgo, salida))  # True: volver a pasar por la capa da la salida',
              ) +
              '\n\n`solve` recibe primero la matriz y después el lado derecho. `np.allclose(X, Y)` compara con una pequeña tolerancia.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('x = np.linalg.solve(W, y ___ b)', 'reconstruye = np.allclose(___ @ x + b, y)') +
              '\n\nEl sesgo se quita de `y` antes de resolver, dentro del segundo argumento de `solve`. Restarlo a `x` después da otro vector.',
          ],
          explain:
            'El sesgo se suma después de multiplicar, así que se resta antes de deshacer la multiplicación. Si se resuelve con `y` sin más, el sesgo se cuela en la entrada recuperada; y restarlo al final tampoco vale, porque la inversa de `W` ya lo ha multiplicado.',
          solution:
            'Se escribe `x = np.linalg.solve(W, y - b)`, que vale $(1, 2, 3)$, y `reconstruye = np.allclose(W @ x + b, y)`, que da `True`. Si $\\det W=0$, la capa aplasta el espacio: varias entradas dan la misma salida y no hay forma de recuperar la entrada (`solve` no podría darte una solución válida). Por eso la mayoría de las capas de una red real no se pueden deshacer: pasan de muchas componentes a pocas.',
          requirements: [
            '`x` es un array de NumPy con 3 números: la entrada que, pasada por la capa de `W` y `b`, produce la salida `y`.',
            'El sesgo `b` se tiene en cuenta: al pasar `x` por la capa, con el sesgo sumado al final, tiene que salir `y`.',
            '`reconstruye` es un solo `True` o `False` (no un array de valores), y dice que al volver a pasar `x` por la capa sale `y`, salvo el redondeo.',
          ],
          starter: `import numpy as np

# W es una matriz de NumPy con 3 filas y 3 columnas: los pesos de la capa.
# b es un array de NumPy con 3 números: el sesgo, que la capa suma al final.
# y es un array de NumPy con 3 números: la salida. La capa calculó y = W @ x + b.
W = np.array([[2, 0, 1], [1, 1, 0], [0, 1, 1]])
b = np.array([1, -1, 2])
y = np.array([6, 2, 7])

# PASO 1. Recuperar la entrada x que produjo y.
# Por qué: la capa multiplicó por W y después sumó b. Para volver atrás se deshace en orden
# contrario: primero se quita el sesgo (y - b), y después se deshace la multiplicación por W.
# np.linalg.solve(M, c) resuelve M x = c: primero la matriz, después el vector.
# Resta el sesgo antes de resolver, no después.
# El resultado es un array de NumPy con 3 números.
x = None

# PASO 2. Comprobar que volver a pasar x por la capa da y.
# Por qué: así sabes que x es de verdad la entrada, y no un vector que lo parece.
# La capa es W @ x + b. np.allclose(X, Y) compara con una pequeña tolerancia y devuelve un solo
# True o False (con == saldría un array de True y False).
reconstruye = None

# Para ver qué vale algo antes de entregar: print(x) y pulsa «Ejecutar».
`,
          checks: `_x = isinstance(x, np.ndarray) and x.shape == (3,) and np.issubdtype(x.dtype, np.number)
_good = _x and np.allclose(x, [1, 2, 3])
_nobias = _x and np.allclose(x, np.linalg.solve(W, y))
_after = _x and np.allclose(x, np.linalg.solve(W, y) - b)
_b = isinstance(reconstruye, (bool, np.bool_))
check(_x, "\`x\` tiene que ser un array de NumPy con 3 números: la entrada que produjo \`y\`.")
check((not _x) or not _nobias, "\`x\` se ha calculado sin quitar el sesgo: el vector \`b\` se sumó al final de la capa, así que hay que restarlo de \`y\` antes de resolver.")
check((not _x) or not _after, "\`x\` resta el sesgo después de resolver. Hay que restarlo antes: la inversa de \`W\` se aplica a \`y - b\` entero, no solo a \`y\`.")
check((not _x) or _nobias or _after or _good, "\`x\` tiene que valer (1, 2, 3): al pasarlo por la capa, \`W @ x + b\`, tiene que salir \`y\`.")
check(_b, "\`reconstruye\` tiene que ser un solo \`True\` o \`False\`. La comparación con \`==\` da un array de valores; \`np.allclose\` da uno solo.")
check((not _b) or (not _good) or bool(reconstruye), "\`reconstruye\` vale \`False\`, pero \`W @ x + b\` sí da \`y\`. Compara con \`np.allclose\`, que tiene tolerancia para el redondeo.")
`,
          reference:
            'import numpy as np\n\nW = np.array([[2, 0, 1], [1, 1, 0], [0, 1, 1]])\nb = np.array([1, -1, 2])\ny = np.array([6, 2, 7])\nx = np.linalg.solve(W, y - b)\nreconstruye = np.allclose(W @ x + b, y)\n',
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'inversa.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere guardar en `Ainv` la inversa de `A` con la fórmula de $2\\times 2$: se intercambian $a$ y $d$, se cambian de signo $b$ y $c$, y se divide entre el determinante. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Escribe la fórmula en papel con $a, b, c, d$ y compárala con el lugar que ocupa cada entrada en el código.',
        'Fíjate en qué entrada hay arriba a la izquierda del resultado: en la fórmula es $d$.',
      ],
      explain:
        'Compara la posición de cada entrada del resultado con la de la fórmula, y piensa si la matriz que sale, multiplicada por `A`, podría dar la identidad.',
      solution:
        'La tercera línea está mal: no intercambia $a$ y $d$. La matriz de la fórmula es $\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}$, con `A[1, 1]` arriba a la izquierda y `A[0, 0]` abajo a la derecha. Con estos datos, $\\det A=3\\cdot 2-1\\cdot 5=1$ y la inversa es $\\begin{pmatrix}2&-1\\\\-5&3\\end{pmatrix}$; la línea dada produce $\\begin{pmatrix}3&-1\\\\-5&2\\end{pmatrix}$ y la comprobación final daría `False`.',
      lines: [
        'A = np.array([[3, 1], [5, 2]])',
        'det = A[0, 0] * A[1, 1] - A[0, 1] * A[1, 0]',
        'Ainv = np.array([[A[0, 0], -A[0, 1]], [-A[1, 0], A[1, 1]]]) / det',
        'ok = np.allclose(A @ Ainv, np.eye(2))',
      ],
      faultyLine: 2,
    },
    {
      id: 'inversa.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula la inversa de un producto de dos matrices invertibles, $A$ y $B$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'En $AB\\vec{v}$, ¿cuál de las dos matrices actúa primero sobre $\\vec{v}$?',
        'Para deshacer, ¿cuál de las dos inversas tiene que actuar primero? Esa va a la derecha del producto.',
      ],
      explain:
        'Comprueba en qué orden quedan escritas las inversas, con la regla de que en un producto actúa primero la matriz de la derecha.',
      solution:
        'La tercera línea está mal. Para deshacer $AB$ hay que deshacer primero lo último que se aplicó, $A$, así que $A^{-1}$ actúa primero y va a la derecha: $(AB)^{-1}=B^{-1}A^{-1}$. Es como vestirse con calcetines y zapatos: para deshacerlo se quitan primero los zapatos. Con $A^{-1}B^{-1}$ se deshace $B$ antes que $A$, que no es el orden.',
      lines: [
        'AB aplica primero B y después A',
        'Para deshacerla hay que deshacer en orden inverso: primero A y después B',
        'Luego (AB)⁻¹ = A⁻¹B⁻¹, con las inversas en el mismo orden que A y B',
      ],
      faultyLine: 2,
    },
    {
      id: 'inversa.hoja.3',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere recuperar la entrada `x` de una capa lineal, $\\vec{y}=W\\vec{x}+\\vec{b}$, a partir de su salida `y`. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Mira qué se hace con el sesgo `b` y en qué momento.',
        'Prueba el resultado: $W\\vec{x}+\\vec{b}$ tiene que dar $\\vec{y}$.',
      ],
      explain:
        'Pasa la entrada recuperada por la capa y comprueba si vuelve a salir la salida de partida.',
      solution:
        'No hay ningún error. Primero se quita el sesgo, `y - b`, que es lo que salió de multiplicar por `W`, y con eso se resuelve el sistema: sale $(1, 3)$. Resolver con `y` sin más, o restar el sesgo después de resolver, daría otra entrada.',
      lines: [
        'W = np.array([[2, 1], [1, 3]])',
        'b = np.array([1, -1])',
        'y = np.array([6, 9])',
        'x = np.linalg.solve(W, y - b)',
      ],
      faultyLine: null,
    },
  ],
};
