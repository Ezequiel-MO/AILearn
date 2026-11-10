import type { Project } from '../../content/schema';
import { py } from '../py';
import { columnasWarmup } from './columnas.calentamiento';
import { CORREOS, RESENAS, RESENAS_NEGATIVIDAD, capaLab } from './datos';

/** Lo que mide casi toda meta de este proyecto: la neurona que viene detrás de la capa. */
const ACIERTOS = {
  metric: 'acc',
  op: 'gte',
  target: 1,
  label: 'Aciertos de la neurona siguiente',
  format: 'percent',
} as const;

/** La neurona siguiente solo mira la primera salida de la capa: responde al grupo 1 si es positiva. */
const MIRA_SALIDA_1 = { w: [1, 0] as [number, number], b: 0 };

/**
 * Primer proyecto de la Órbita 0: cada columna de la matriz de una capa dice adónde manda la capa un
 * rasgo, y de eso depende lo que puede leer la neurona que viene detrás.
 */
export const columnas: Project = {
  id: 'columnas',
  name: 'Columnas',
  sub: 'Adónde manda la capa cada rasgo',
  bigPicture: {
    parts: ['linear'],
    text: 'Cada capa lineal de una red guarda una matriz de pesos $W$ y la aplica a todos los vectores que le llegan. Leer sus columnas como «adónde va cada eje» es leer qué hace la capa. En el GPT-2 pequeño, la primera capa del MLP de cada bloque es una matriz de $3072\\times 768$; aquí la ves en $2\\times 2$, donde cabe en un dibujo.',
  },
  warmup: columnasWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'columnas.ex00.1',
          type: 'laboratorio',
          purpose: {
            why: 'Una capa de una red es una matriz: recoloca todos los embeddings a la vez para que la neurona que viene detrás pueda decidir. Lo que esa neurona no tiene delante, no lo puede usar.',
            aim: 'Vas a mover las columnas de una capa hasta que la neurona siguiente, que solo mira la primera salida, distinga las reseñas positivas de las negativas.',
            takeaway:
              'Cada columna dice adónde manda la capa un rasgo. La neurona acierta cuando la columna del tono apunta a la salida que ella mira; la intensidad, que no distingue, puede ir a otra parte. Entrenar una capa es encontrar esas columnas.',
          },
          prompt:
            'Seis reseñas de una palabra, con dos rasgos: **intensidad** y **tono**. La neurona siguiente solo mira la primera salida de la capa (el eje horizontal) y responde «positiva» a lo que cae en la zona sombreada. Ahora mismo ahí llega la intensidad, y dice «positiva» a todo.\n\nMueve las columnas de la capa hasta que acierte con las seis.',
          hints: [
            'Mira qué distingue a «genial» de «horrible»: no es la intensidad, que es la misma. La columna de ese otro rasgo es la que tiene que apuntar hacia la zona sombreada.',
            'Lleva la punta de $\\hat{\\jmath}$ (el tono) sobre el eje horizontal, hacia la derecha, y saca $\\hat{\\imath}$ (la intensidad) de ese eje: súbela o llévala al origen.',
          ],
          explain:
            'La primera salida es lo que la capa pone en el eje horizontal: la intensidad por la primera coordenada de $\\hat{\\imath}$ más el tono por la primera de $\\hat{\\jmath}$. Para que su signo sea el del tono, tiene que pesar el tono y no la intensidad.',
          solution:
            'Una capa que vale: $\\hat{\\imath}$ en $(0, 1)$ y $\\hat{\\jmath}$ en $(1, 0)$. La primera salida pasa a ser el tono: positivo en «genial», «feliz» y «bueno», negativo en las otras tres, y la neurona acierta las seis. Hay muchas más: basta con que en la primera salida el tono pese bastante más que la intensidad. Al entrenar pasa igual: muchas matrices valen.',
          lab: capaLab(RESENAS, { readout: MIRA_SALIDA_1 }),
          goals: [ACIERTOS],
          solved: { ix: 0, iy: 1, jx: 1, jy: 0 },
        },
        {
          id: 'columnas.ex00.2',
          type: 'laboratorio',
          purpose: {
            why: 'Una neurona no responde a cualquier señal: tiene un umbral (su sesgo) y solo se activa si lo que le llega lo supera. Una señal débil se queda sin contar, aunque apunte al lado correcto.',
            aim: 'Vas a hacer que una capa que ya manda el tono a la salida correcta lo mande con fuerza suficiente para una neurona que exige más.',
            takeaway:
              'La longitud de una columna es cuánto pesa su rasgo en la salida. Alargar la columna del tono aleja las palabras de la frontera, y «bueno» pasa el umbral. Un peso grande en una capa es eso: un rasgo que cuenta mucho.',
          },
          prompt:
            'La capa ya manda el tono a la primera salida, pero esta neurona es más exigente: solo dice «positiva» si le llega más de $1{,}5$ (su zona sombreada empieza más a la derecha). «bueno» y «feliz» se quedan cortas.\n\nCambia la capa para que acierte con las seis.',
          hints: [
            'Las palabras positivas están en el lado bueno, pero demasiado cerca del origen. ¿Qué columna decide cuánto avanzan hacia la derecha?',
            'Alarga $\\hat{\\jmath}$ (el tono) sobre el eje horizontal: cada palabra avanza su tono multiplicado por la longitud de esa columna.',
          ],
          explain:
            'La primera salida de cada palabra es su tono multiplicado por la primera coordenada de $\\hat{\\jmath}$. Con esa coordenada en $1$, «bueno» llega a $1$ y «feliz» a $1{,}5$: ninguna pasa de $1{,}5$. Hace falta un peso mayor.',
          solution:
            'Con $\\hat{\\jmath}$ en $(2, 0)$ el tono cuenta el doble: «bueno» llega a $2$, «feliz» a $3$ y «genial» a $4$, y las negativas se alejan hacia la izquierda. Con $(1{,}5;\\ 0)$ no basta: «bueno» se queda en $1{,}5$, justo sobre la frontera. También vale ayudarse de la intensidad, con $\\hat{\\imath}$ en $(1, 1)$: suma a todas, pero solo las positivas pasan el umbral.',
          lab: capaLab(RESENAS, {
            range: 5,
            i: [0, 1],
            j: [1, 0],
            readout: { w: [1, 0], b: -1.5 },
          }),
          goals: [ACIERTOS],
          solved: { jx: 2 },
        },
        {
          id: 'columnas.ex00.3',
          type: 'laboratorio',
          purpose: {
            why: 'El signo de un rasgo es una convención: un equipo mide «tono» y otro, «negatividad». A la red le da igual, porque el signo de cada peso se aprende. Un peso negativo no es un error: es un rasgo que cuenta en contra.',
            aim: 'Vas a arreglar una capa que falla con todas las reseñas porque su segundo rasgo llega medido al revés, tocando una sola columna.',
            takeaway:
              'El sentido de una columna dice si su rasgo empuja a favor o en contra. Al darle la vuelta, el cuadrado unidad cambia de color y el determinante, de signo: la capa ha volteado el plano, y la neurona acierta igual.',
          },
          prompt:
            'Las mismas reseñas, pero el segundo rasgo ahora es la **negatividad**: cuanto peor la reseña, más alto. La capa de antes, que mandaba ese rasgo a la primera salida, falla con las seis.\n\nArréglala para que la neurona acierte con todas.',
          hints: [
            'La capa manda la negatividad hacia la zona sombreada, y por eso las reseñas negativas caen dentro. ¿Hacia dónde tendría que mandarla?',
            'Da la vuelta a $\\hat{\\jmath}$: llévala al otro lado del origen, sobre el eje horizontal. Lo que antes sumaba ahora resta.',
          ],
          explain:
            'La primera salida es la negatividad multiplicada por la primera coordenada de $\\hat{\\jmath}$. Con esa coordenada positiva, cuanto más negativa la reseña, más a la derecha cae. Hace falta que ese peso sea negativo.',
          solution:
            'Con $\\hat{\\jmath}$ en $(-1, 0)$, la primera salida es la negatividad cambiada de signo, que vuelve a ser el tono: la neurona acierta las seis. Dar la vuelta a $\\hat{\\imath}$ no arregla nada, porque la intensidad no llega a esa salida. Fíjate en el determinante: ha pasado de $-1$ a $1$. La capa ha dado la vuelta al plano y no se ha perdido nada.',
          lab: capaLab(RESENAS_NEGATIVIDAD, {
            i: [0, 1],
            j: [1, 0],
            readout: MIRA_SALIDA_1,
            readouts: ['det'],
          }),
          goals: [ACIERTOS],
          solved: { jx: -1 },
        },
        {
          id: 'columnas.ex00.4',
          type: 'laboratorio',
          purpose: {
            why: 'Casi nunca hay un rasgo que decida por sí solo. Un filtro de spam, como cualquier clasificador, combina señales: unas suman y otras restan. Cada neurona de una red lee una combinación así de los rasgos que le llegan.',
            aim: 'Vas a construir una capa cuya primera salida mezcle dos rasgos, porque con uno solo no hay manera de separar el spam del correo normal.',
            takeaway:
              'La primera salida es «enlaces − saludos»: una mezcla que ningún rasgo da por separado. Las dos columnas aportan a la misma salida, una a favor y otra en contra. Eso es una neurona: una suma de rasgos con pesos.',
          },
          prompt:
            'Seis correos con dos rasgos: cuántos **enlaces** llevan y cuántos **saludos** personales. La neurona responde «spam» a lo que cae en la zona sombreada. Hay spam que saluda y correo normal con enlaces: ningún rasgo basta.\n\nMueve las columnas hasta que acierte con los seis.',
          hints: [
            'Compara un correo de spam con uno normal: en el spam hay más enlaces que saludos, y en el normal, al revés. La primera salida tiene que medir esa diferencia.',
            'Deja $\\hat{\\imath}$ (enlaces) apuntando a la derecha y lleva $\\hat{\\jmath}$ (saludos) hacia la izquierda: los enlaces suman y los saludos restan.',
          ],
          explain:
            'Con una sola columna sobre el eje horizontal, la primera salida es un solo rasgo y siempre queda algún correo en el lado equivocado. Con las dos, la salida es enlaces por un peso más saludos por otro: si el segundo es negativo, mide lo que sobra de un rasgo sobre el otro.',
          solution:
            'Una capa que vale: $\\hat{\\imath}$ en $(1, 0)$ y $\\hat{\\jmath}$ en $(-1, 1)$. La primera salida es enlaces menos saludos: $2$, $1{,}5$ y $0{,}5$ en el spam, y $-1$ en los tres normales. La segunda coordenada de las columnas le da igual a esta neurona: solo decide la altura a la que queda cada correo.',
          lab: capaLab(CORREOS, { readout: MIRA_SALIDA_1 }),
          goals: [ACIERTOS],
          solved: { jx: -1, jy: 1 },
        },
        {
          id: 'columnas.ex00.5',
          type: 'laboratorio',
          purpose: {
            why: 'Detrás de una capa no hay una neurona, hay cientos, y cada una mira otra cosa. Una capa que acierta para una tirando el resto deja a las demás sin nada que leer: lo que una capa borra, ninguna posterior lo recupera.',
            aim: 'Vas a rehacer una capa que acierta, pero ha aplastado las reseñas sobre una recta, para que acierte igual sin tirar la intensidad.',
            takeaway:
              'Acertar y conservar no están reñidos: el tono va a una salida y la intensidad, a la otra. Cuando el cuadrado unidad tiene área, la capa no aplasta y las palabras se siguen distinguiendo por los dos rasgos.',
          },
          prompt:
            'Esta capa acierta con las seis reseñas, pero ha mandado la intensidad al origen: todas las palabras han caído sobre una recta y el cuadrado unidad se ha quedado sin área. Otra neurona necesitará la intensidad.\n\nRecupérala sin que esta neurona deje de acertar.',
          hints: [
            '$\\hat{\\imath}$ (la intensidad) está en el origen: por eso el cuadrado no tiene área. Hay que sacarla de ahí, pero no hacia cualquier sitio.',
            'Sube $\\hat{\\imath}$ por el eje vertical: la intensidad va a la segunda salida, que esta neurona no mira, y la primera sigue siendo solo el tono.',
          ],
          explain:
            'Si $\\hat{\\imath}$ se mueve en horizontal, la intensidad entra en la primera salida y empuja a «horrible» hacia la zona sombreada. En vertical no toca esa salida. El área del cuadrado unidad mide cuánto espacio deja la capa: si vale $0$, todo ha caído en una recta.',
          solution:
            'Con $\\hat{\\imath}$ en $(0, 1)$ y $\\hat{\\jmath}$ en $(1, 0)$, la primera salida sigue siendo el tono (la neurona acierta las seis) y la segunda es la intensidad: el cuadrado unidad vuelve a tener área $1$. Con $\\hat{\\imath}$ en $(1, 1)$ el área también es $1$, pero «horrible» pasa a la zona sombreada y «malo» y «triste» se quedan sobre la frontera: la intensidad se ha colado en la salida que mira la neurona.',
          lab: capaLab(RESENAS, {
            i: [0, 0],
            j: [1, 0],
            readout: MIRA_SALIDA_1,
            readouts: ['det'],
          }),
          goals: [
            ACIERTOS,
            {
              metric: 'area',
              op: 'gte',
              target: 1,
              label: 'Área que deja la capa al cuadrado unidad',
            },
          ],
          solved: { ix: 0, iy: 1 },
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'columnas.ex01.1',
          type: 'vector',
          purpose: {
            why: 'En el código, una capa es una tabla de pesos: una fila por salida y una columna por rasgo de entrada. Leer y escribir esa tabla sin dudar de qué va en cada casilla es lo primero que hace falta para entender cualquier modelo.',
            aim: 'Vas a escribir los cuatro pesos de la capa de un filtro de spam a partir de lo que debe hacer cada salida con los enlaces y los saludos.',
            takeaway:
              'Cada fila es una salida y cada columna, un rasgo: el peso de la fila 1 y la columna 2 es cuánto cuentan los saludos en la primera salida. Así se lee la matriz de pesos de cualquier capa, tenga 4 números o millones.',
          },
          prompt:
            'El filtro de spam necesita una capa con estas dos salidas para cada correo:\n\n$$\\text{salida 1}=\\text{enlaces}-\\text{saludos}\\qquad\\text{salida 2}=\\text{saludos}$$\n\nEscribe su matriz de pesos: una fila por salida y una columna por rasgo (primero los enlaces, después los saludos). Puedes construirla en el laboratorio y mirar adónde van los correos.',
          hints: [
            'La primera fila son los pesos de la salida 1: cuánto cuentan los enlaces y cuánto los saludos. Un rasgo que resta lleva peso negativo.',
            'La salida 2 copia los saludos y no usa los enlaces: su fila tiene un $0$ y un $1$. Cuida el orden: los enlaces son la primera columna.',
          ],
          explain:
            'Cada salida es una suma de los rasgos con sus pesos, y esos pesos forman una fila. Leída por columnas, la misma tabla dice adónde manda la capa cada rasgo: los enlaces van a $(1, 0)$ y los saludos, a $(-1, 1)$.',
          solution:
            '$A=\\begin{pmatrix}1&-1\\\\0&1\\end{pmatrix}$. Fila 1: $1$ por los enlaces y $-1$ por los saludos. Fila 2: $0$ por los enlaces y $1$ por los saludos. En el laboratorio es dejar $\\hat{\\imath}$ en $(1, 0)$ y llevar $\\hat{\\jmath}$ a $(-1, 1)$. Con las filas puestas como columnas sale otra capa: la que da de segunda salida saludos menos enlaces.',
          lab: capaLab(CORREOS, { readout: MIRA_SALIDA_1 }),
          shape: [2, 2],
          answer: [1, -1, 0, 1],
          tol: 0,
        },
        {
          id: 'columnas.ex01.2',
          type: 'numero',
          purpose: {
            why: 'El tamaño de un modelo se mide en parámetros, y casi todos están en las matrices de sus capas. Contarlos a partir de las dimensiones dice cuánta memoria pide una capa y dónde se va el peso de un modelo.',
            aim: 'Vas a contar los parámetros de una capa real, la que ensancha los vectores en cada bloque del GPT-2 pequeño, a partir de sus entradas y sus salidas.',
            takeaway:
              'Son $2\\,362\\,368$ parámetros en una sola capa, casi todos pesos de la matriz. El GPT-2 pequeño tiene 12 bloques con una capa así y otra que deshace el ensanche: ahí está buena parte de sus 124 millones de parámetros.',
          },
          prompt:
            'En cada bloque del GPT-2 pequeño, una capa recibe vectores de $768$ números y devuelve vectores de $3072$. Su matriz de pesos tiene una fila por salida y una columna por entrada, y además hay un sesgo por salida.\n\n¿Cuántos parámetros tiene la capa, entre pesos y sesgos?',
          hints: [
            'La matriz tiene $3072$ filas y $768$ columnas: multiplica para contar sus pesos.',
            'Suma un sesgo por cada salida: $3072$ más.',
          ],
          explain:
            'Cada salida tiene un peso por cada entrada: los pesos son filas por columnas. El sesgo es un número más por salida, y no depende de cuántas entradas haya.',
          solution:
            'Pesos: $3072\\cdot 768=2\\,359\\,296$. Sesgos: $3072$. En total, $2\\,359\\,296+3072=2\\,362\\,368$ parámetros. Los sesgos son poco más de uno de cada mil: el tamaño de una capa lo decide su matriz.',
          answer: 2362368,
          tol: 0,
        },
        {
          id: 'columnas.ex01.3',
          type: 'numero',
          purpose: {
            why: 'Cada salida de una capa es una neurona haciendo una cuenta corta: multiplica cada rasgo de la entrada por su peso y suma. Un modelo de lenguaje repite esa cuenta miles de millones de veces por cada palabra que escribe.',
            aim: 'Vas a hacer a mano la cuenta de una neurona para una palabra: sus dos rasgos, cada uno por su peso, y la suma.',
            takeaway:
              'La primera salida de «feliz» es $0{,}5\\cdot 2+1\\cdot 1{,}5=2{,}5$: el producto escalar de la primera fila de pesos con la palabra. Una capa entera son tantas cuentas como filas, todas sobre la misma entrada.',
          },
          prompt:
            'Una capa tiene estos pesos:\n\n$$A=\\begin{pmatrix}0{,}5&1\\\\1&0\\end{pmatrix}$$\n\nLe llega «feliz», con intensidad $2$ y tono $1{,}5$. ¿Cuánto vale su primera salida? Después puedes construir la capa en el laboratorio y ver dónde cae la palabra.',
          hints: [
            'La primera salida usa solo la primera fila de $A$: un peso para la intensidad y otro para el tono.',
            'Multiplica cada rasgo de «feliz» por su peso y suma los dos productos.',
          ],
          explain:
            'La salida 1 es la fila 1 por la palabra: peso de la intensidad por intensidad más peso del tono por tono. La segunda fila no interviene: es otra neurona, con su propia cuenta.',
          solution:
            '$0{,}5\\cdot 2+1\\cdot 1{,}5=1+1{,}5=2{,}5$. En el laboratorio, con $\\hat{\\imath}$ en $(0{,}5;\\ 1)$ y $\\hat{\\jmath}$ en $(1, 0)$, «feliz» cae en $(2{,}5;\\ 2)$: su primera coordenada es esa salida. La segunda, $2$, es la cuenta de la fila 2: $1\\cdot 2+0\\cdot 1{,}5$.',
          lab: capaLab(RESENAS),
          answer: 2.5,
          tol: 0,
        },
        {
          id: 'columnas.ex01.4',
          type: 'opcion',
          purpose: {
            why: 'Los rasgos cambian de escala a menudo: otra unidad, otra normalización. Saber qué parte de la matriz toca cada rasgo dice qué hay que ajustar en la capa, y por qué normalizar los datos cambia los pesos que se aprenden.',
            aim: 'Vas a decidir qué parte de una matriz de pesos hay que cambiar para que un rasgo cuente el doble en todas las salidas, sin tocar el otro.',
            takeaway:
              'Un rasgo es una columna: doblar la segunda columna dobla lo que el tono aporta a cada salida y deja la intensidad como estaba. Una fila, en cambio, es una salida: doblarla cambia el peso de todos los rasgos en esa neurona.',
          },
          prompt:
            'Los datos van a llegar con el tono medido en otra escala: cada valor, la mitad que ahora. Para que las dos salidas de esta capa no cambien, el tono tiene que contar el doble en ambas. ¿Qué cambias en la matriz?\n\n$$A=\\begin{pmatrix}0&1\\\\1&0{,}5\\end{pmatrix}$$',
          hints: [
            'El tono aparece en las dos salidas. Busca en la matriz los dos números que lo multiplican: ¿están en una fila o en una columna?',
            'En el laboratorio, $\\hat{\\jmath}$ es la columna del tono. Alárgala al doble y mira cuánto se mueve cada palabra.',
          ],
          explain:
            'Los pesos de un rasgo están uno debajo de otro, en su columna: uno por salida. Los de una salida están en una fila. Cambiar la escala de un rasgo de entrada es cambiar la de su columna.',
          solution:
            'La segunda columna, $(1;\\ 0{,}5)$, son los pesos del tono en la salida 1 y en la 2. Doblada, $(2, 1)$, compensa que el tono llegue a la mitad. Doblar la segunda fila cambiaría la salida 2 entera, intensidad incluida; doblar la primera columna tocaría la intensidad, y doblar toda la matriz, los dos rasgos.',
          lab: capaLab(RESENAS, { range: 5, i: [0, 1], j: [1, 0.5] }),
          options: [
            'Multiplicar por 2 la segunda fila',
            'Multiplicar por 2 la segunda columna',
            'Multiplicar por 2 la primera columna',
            'Multiplicar por 2 toda la matriz',
          ],
          correct: 1,
        },
        {
          id: 'columnas.ex01.5',
          type: 'numero',
          purpose: {
            why: 'Un error de formas es el fallo más corriente al montar un modelo: una matriz que no casa con el vector que le llega. Saber qué dimensión va en las filas y cuál en las columnas lo evita antes de ejecutar nada.',
            aim: 'Vas a deducir la forma de la matriz de una capa que reduce embeddings, a partir del tamaño de lo que entra y de lo que sale.',
            takeaway:
              'Hay una columna por cada número de la entrada, $384$, y una fila por cada número de la salida, $128$: la matriz es de $128\\times 384$. En NumPy y en PyTorch, esa forma se escribe (salidas, entradas).',
          },
          prompt:
            'Un buscador guarda embeddings de frases de $384$ números. Para ahorrar memoria, una capa los convierte en vectores de $128$. ¿Cuántas columnas tiene la matriz de pesos de esa capa?',
          hints: [
            'Cada columna de la matriz dice adónde va un rasgo de la entrada. ¿Cuántos rasgos tiene cada embedding que llega?',
            'El $128$ es el número de salidas: una fila por cada una.',
          ],
          explain:
            'Las columnas se cuentan con la entrada y las filas, con la salida. En las capas de $2\\times 2$ de este proyecto coinciden y no se nota; en una capa real casi nunca coinciden.',
          solution:
            '$384$ columnas, una por cada número del embedding que entra. Las filas son $128$, una por salida, así que la matriz es de $128\\times 384$ y guarda $128\\cdot 384=49\\,152$ pesos.',
          answer: 384,
          tol: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'columnas.ex02.1',
          type: 'codigo',
          prompt:
            'Una transformación manda $\\hat{\\imath}$ a `img_i` y $\\hat{\\jmath}$ a `img_j`. NumPy lee una lista de listas por **filas**, pero aquí cada imagen tiene que ir en una **columna**. Construye en `A` la matriz de la transformación.',
          hints: [
            'El plan es una sola línea: `A` tiene que tener `img_i` en su primera columna y `img_j` en la segunda. El error típico es escribir `np.array([img_i, img_j])`: NumPy lee cada lista como una fila y sale la matriz traspuesta, con las imágenes en las filas. Hay que colocarlas como columnas, con una función que apila como columnas o con una traspuesta.',
            'Las piezas, con otros vectores:\n\n' +
              py(
                'a = np.array([5, 6])',
                'b = np.array([7, 8])',
                'print(np.array([a, b]))          # dos filas: [5 6] y [7 8]',
                'print(np.array([a, b]).T)        # .T traspone: las filas pasan a ser columnas',
                'print(np.column_stack([a, b]))   # apila a y b como columnas, en un solo paso',
              ) +
              '\n\nLas dos últimas líneas imprimen la misma matriz: `a` en la primera columna y `b` en la segunda.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('A = np.column_stack([___, ___])') +
              '\n\nEl orden importa: la primera va a la primera columna. Si las intercambias, `î` y `ĵ` cambian de sitio.',
          ],
          explain:
            'Si metes `img_i` e `img_j` en una lista de listas, cada una queda como una fila, y la matriz sale traspuesta: la imagen de $\\hat{\\imath}$ acaba en la primera fila y no en la primera columna. Hay que colocarlas como columnas.',
          solution:
            'Se puede escribir `A = np.column_stack([img_i, img_j])`, que apila los vectores como columnas, o `A = np.array([img_i, img_j]).T`, que los apila como filas y traspone. El resultado es $\\begin{pmatrix}2&-1\\\\1&3\\end{pmatrix}$.',
          requirements: [
            '`A` existe y es un array de NumPy con números, de 2 filas y 2 columnas.',
            'La primera columna de `A` es `img_i`, la imagen de î, y la segunda es `img_j`, la de ĵ: las imágenes van en las columnas y no en las filas.',
          ],
          starter: `import numpy as np

# Ya está hecho: no hace falta tocarlo.
# img_i es adónde va î: un array de NumPy con 2 números (x e y), aquí [2 1].
# img_j es adónde va ĵ: otro array con 2 números, aquí [-1 3].
img_i = np.array([2, 1])
img_j = np.array([-1, 3])

# PASO 1. Construir A, la matriz de la transformación: su primera columna es
# img_i y su segunda columna es img_j.
# Por qué: una matriz guarda en sus columnas adónde van î y ĵ. Así, multiplicar
# por la matriz mueve cada punto como lo mueve la transformación.
# Cuidado: np.array([[1, 2], [3, 4]]) lee cada lista interior como una FILA, así
# que si le das [img_i, img_j] las imágenes quedan en las filas, y es la matriz
# traspuesta. Hay que colocarlas como columnas. Dos herramientas:
#   - np.column_stack([x, y]) apila los arrays x e y como columnas.
#   - Apilarlos como filas y añadir .T al final, que traspone (filas por columnas).
# Resultado esperado: un array de NumPy de 2 filas y 2 columnas.
A = None

# Para ver qué vale algo antes de entregar: print(A) y pulsa «Ejecutar».
`,
          checks: `_ok = isinstance(A, np.ndarray) and A.shape == (2, 2) and np.issubdtype(A.dtype, np.number)
_filas = _ok and np.allclose(A, [[2, 1], [-1, 3]])
_bien = _ok and np.allclose(A, [[2, -1], [1, 3]])
check(_ok, "\`A\` tiene que ser un array de NumPy de 2 filas y 2 columnas, con números: la matriz de la transformación.")
check(not _filas, "\`A\` tiene las imágenes de î y de ĵ en las filas, y tienen que ir en las columnas: es la matriz traspuesta de la pedida. La imagen de î va en la primera columna.")
check((not _ok) or _bien or _filas, "\`A\` no tiene las columnas pedidas: la primera tiene que ser (2, 1), la imagen de î, y la segunda, (-1, 3), la de ĵ.")
`,
          reference:
            'import numpy as np\n\nimg_i = np.array([2, 1])\nimg_j = np.array([-1, 3])\nA = np.column_stack([img_i, img_j])\n',
        },
        {
          id: 'columnas.ex02.2',
          type: 'codigo',
          prompt:
            'En una matriz de NumPy, `A[:, k]` es la columna `k` entera (el `:` del primer sitio significa «todas las filas»; se cuenta desde 0). Esas columnas son las imágenes de $\\hat{\\imath}$ y de $\\hat{\\jmath}$. Guarda en `col_i` la imagen de $\\hat{\\imath}$ y en `col_j` la de $\\hat{\\jmath}$.',
          hints: [
            'El plan son dos líneas. `col_i` es la primera columna de `A`, y la primera se cuenta con el número 0. `col_j` es la segunda columna, con el número 1. En los dos casos hay que dejar libre el primer sitio de los corchetes, el de las filas, para quedarte con todas. El error típico es escribir `A[0]`: con un solo número eliges una fila, no una columna.',
            'Las piezas, con otra matriz de 2 filas y 3 columnas:\n\n' +
              py(
                'M = np.array([[5, 6, 7], [8, 9, 10]])',
                'print(M[:, 0])   # la columna 0 entera: sus números son 5 y 8',
                'print(M[:, 2])   # la columna 2 entera: sus números son 7 y 10',
                'print(M[1])      # un solo número elige una FILA: la fila 1, con 8, 9 y 10',
              ) +
              '\n\nEn `M[:, k]`, lo que va antes de la coma son las filas (`:` es «todas») y lo que va después, la columna.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('col_i = A[:, ___]', 'col_j = A[:, ___]') +
              '\n\nEl número del hueco va después de la coma. Si lo pones solo, entre los corchetes, sale una fila.',
          ],
          explain:
            'La imagen de cada flecha es una columna, y para elegir una columna hay que dejar libre la primera posición, la de las filas, y poner el número de columna en la segunda. Con un solo número se elige una fila.',
          solution:
            '`col_i = A[:, 0]` vale $(3, 2)$ y `col_j = A[:, 1]` vale $(-1, 4)$. Con `A[0]` y `A[1]` se obtienen las filas $(3, -1)$ y $(2, 4)$, que son otra cosa.',
          requirements: [
            '`col_i` y `col_j` existen y son arrays de NumPy con 2 componentes, todas números.',
            '`col_i` es la imagen de î, la primera columna de `A` de arriba abajo, y no la primera fila.',
            '`col_j` es la imagen de ĵ, la segunda columna de `A` de arriba abajo, y no la segunda fila.',
          ],
          starter: `import numpy as np

# Ya está hecho: no hace falta tocarlo.
# A es la matriz de una transformación: un array de NumPy de 2 filas y 2 columnas.
# Sus filas son [3 -1] y [2 4]; sus columnas, [3 2] y [-1 4].
# Con un número, A[0] es la fila 0 entera (la primera). Las posiciones se cuentan desde 0.
A = np.array([[3, -1], [2, 4]])

# PASO 1. Guardar en col_i la imagen de î: la primera columna de A.
# Por qué: la columna 0 de una matriz dice adónde va î, y la columna 1, adónde va ĵ.
# Herramienta: A[:, k] elige la columna k entera. Antes de la coma van las filas:
# el : significa «todas». Después de la coma, el número de columna, contado desde 0.
# Ejemplo con otra matriz: M = np.array([[5, 6], [7, 8]]) y M[:, 1] vale [6 8].
# Resultado esperado: un array de NumPy con 2 números, uno por fila de A.
col_i = None

# PASO 2. Guardar en col_j la imagen de ĵ: la segunda columna de A, con la misma herramienta.
# Resultado esperado: otro array de NumPy con 2 números.
col_j = None

# Para ver qué vale algo antes de entregar: print(col_i) y pulsa «Ejecutar».
`,
          checks: `def _vec(a):
    return isinstance(a, np.ndarray) and a.shape == (2,) and np.issubdtype(a.dtype, np.number)

check(_vec(col_i), "\`col_i\` tiene que ser un array de NumPy con 2 números: la imagen de î.")
check((not _vec(col_i)) or not np.allclose(col_i, [3, -1]), "\`col_i\` vale (3, -1): es la primera fila de \`A\`, no la primera columna. Una columna recorre todas las filas, así que hace falta \`:\` en el primer sitio.")
check((not _vec(col_i)) or np.allclose(col_i, [3, -1]) or np.allclose(col_i, [3, 2]), "\`col_i\` tiene que valer (3, 2): los números de la primera columna de \`A\`, de arriba abajo.")
check(_vec(col_j), "\`col_j\` tiene que ser un array de NumPy con 2 números: la imagen de ĵ.")
check((not _vec(col_j)) or not np.allclose(col_j, [2, 4]), "\`col_j\` vale (2, 4): es la segunda fila de \`A\`, no la segunda columna. Una columna recorre todas las filas, así que hace falta \`:\` en el primer sitio.")
check((not _vec(col_j)) or np.allclose(col_j, [2, 4]) or np.allclose(col_j, [-1, 4]), "\`col_j\` tiene que valer (-1, 4): los números de la segunda columna de \`A\`, de arriba abajo.")
`,
          reference:
            'import numpy as np\n\nA = np.array([[3, -1], [2, 4]])\ncol_i = A[:, 0]\ncol_j = A[:, 1]\n',
        },
        {
          id: 'columnas.ex02.3',
          type: 'codigo',
          prompt:
            'La **identidad** es la transformación que deja cada punto donde estaba: manda $\\hat{\\imath}$ a $\\hat{\\imath}$ y $\\hat{\\jmath}$ a $\\hat{\\jmath}$, así que sus columnas son $(1, 0)$ y $(0, 1)$. NumPy la crea con `np.eye(n)`, donde `n` es el número de filas y de columnas.\n\nCrea en `I` la identidad de 2 filas y 2 columnas, y guarda en `w` el resultado de multiplicar `I` por `v`, con `@`.',
          hints: [
            'El plan son dos líneas. Primero `I`: la identidad de 2 filas y 2 columnas, que NumPy crea con `np.eye(...)` y el número de filas y de columnas entre paréntesis. Después `w`: `I` multiplicada por `v` con `@`, en ese orden, la matriz primero. Como la identidad no mueve nada, `w` tiene que salir igual que `v`. El error típico es el tamaño: `np.eye(3)` es de 3 filas y 3 columnas.',
            'Las piezas, con otros tamaños y otra matriz:\n\n' +
              py(
                'print(np.eye(3))   # identidad de 3 filas y 3 columnas: unos en la diagonal, ceros fuera',
                'M = np.array([[2, 0], [0, 3]])',
                'x = np.array([1, 1])',
                'print(M @ x)       # @ multiplica la matriz por el vector: sale [2 3]',
              ) +
              '\n\nEn `M @ x`, la matriz va a la izquierda y el vector a la derecha.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('I = np.eye(___)', 'w = ___ @ ___') +
              '\n\nEl número del primer hueco es el de filas y columnas que pide el enunciado, y en `w` van la matriz y el vector, en ese orden.',
          ],
          explain:
            'La identidad tiene unos en la diagonal y ceros fuera de ella, y por eso cada columna es una de las flechas de partida. Multiplicar por ella no cambia ningún vector.',
          solution:
            'Se escribe `I = np.eye(2)`, que vale $\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}$, y `w = I @ v`. El resultado es $(3, -2)$, el mismo `v`: la identidad no mueve nada. Una matriz de unos o la de `np.eye(3)` no sirven: la primera mueve los puntos y la segunda tiene otro tamaño.',
          requirements: [
            '`I` existe y es un array de NumPy con números, de 2 filas y 2 columnas: ni de otro tamaño ni una matriz con unos también fuera de la diagonal.',
            '`I` es la identidad: sus columnas son (1, 0), la imagen de î, y (0, 1), la de ĵ.',
            '`w` existe y es un array de NumPy con 2 componentes, las dos números: el resultado de multiplicar `I` por `v`.',
          ],
          starter: `import numpy as np

# Ya está hecho: no hace falta tocarlo.
# v es un vector: un array de NumPy con 2 números (x e y), aquí [3 -2].
v = np.array([3, -2])

# PASO 1. Crear I, la identidad de 2 filas y 2 columnas.
# Por qué: la identidad es la transformación que deja todo donde estaba, y su
# matriz tiene por columnas las flechas de partida: î en la primera y ĵ en la segunda.
# Herramienta: np.eye(n) crea la identidad de n filas y n columnas, con unos en
# la diagonal y ceros fuera. Ejemplo: np.eye(3) es la de 3 filas y 3 columnas.
# Resultado esperado: un array de NumPy de 2 filas y 2 columnas.
I = None

# PASO 2. Guardar en w el resultado de multiplicar I por v.
# Por qué: así compruebas que la identidad no mueve ningún vector.
# Herramienta: a @ b multiplica una matriz por un vector (o por otra matriz).
# La matriz va a la izquierda del @ y el vector a la derecha.
# Resultado esperado: un array de NumPy con 2 números.
w = None

# Para ver qué vale algo antes de entregar: print(w) y pulsa «Ejecutar».
`,
          checks: `_I = isinstance(I, np.ndarray) and I.shape == (2, 2) and np.issubdtype(I.dtype, np.number)
_w = isinstance(w, np.ndarray) and w.shape == (2,) and np.issubdtype(w.dtype, np.number)
check(_I, "\`I\` tiene que ser un array de NumPy de 2 filas y 2 columnas, con números. Si has usado \`np.eye(3)\`, tiene 3 filas y 3 columnas: aquí hacen falta 2.")
check((not _I) or np.allclose(I, np.eye(2)) or np.allclose(I, np.ones((2, 2))), "\`I\` no es la identidad: sus columnas tienen que ser (1, 0), la imagen de î, y (0, 1), la de ĵ.")
check((not _I) or not np.allclose(I, np.ones((2, 2))), "\`I\` tiene unos también fuera de la diagonal: esa matriz aplasta el plano. La identidad solo tiene unos de la esquina de arriba a la izquierda a la de abajo a la derecha.")
check(_w, "\`w\` tiene que ser un array de NumPy con 2 números: el resultado de multiplicar \`I\` por \`v\`, con \`@\`.")
check((not _w) or np.allclose(w, [3, -2]), "\`w\` tiene que valer (3, -2), el mismo \`v\`: la identidad no mueve ningún vector.")
`,
          reference: 'import numpy as np\n\nv = np.array([3, -2])\nI = np.eye(2)\nw = I @ v\n',
        },
        {
          id: 'columnas.ex02.4',
          type: 'codigo',
          prompt:
            'Una **función** guarda un cálculo para repetirlo con otros datos. Se define con `def`, su cuerpo va sangrado y `return` dice qué devuelve. Un ejemplo con otra tarea, la media de dos números:\n\n```python\ndef media(x, y):\n    return (x + y) / 2\n```\n\nCompleta `matriz_desde(img_i, img_j)` para que reciba las imágenes de $\\hat{\\imath}$ y de $\\hat{\\jmath}$, como arrays de 2 números, y devuelva la matriz de 2 filas y 2 columnas de la transformación.',
          hints: [
            'El plan es una sola línea dentro de la función: `return` seguido de la matriz que tiene `img_i` en su primera columna e `img_j` en la segunda. Es la misma construcción del primer ejercicio, ahora con los nombres de los parámetros. El error típico es devolver las imágenes en las filas, que da la matriz traspuesta; y olvidar el `return`, con lo que la función no devuelve nada.',
            'Las piezas, con otra función y otros vectores:\n\n' +
              py(
                'def suma(x, y):',
                '    return x + y   # return devuelve el valor y termina la función',
                '',
                'print(suma(np.array([1, 2]), np.array([10, 20])))   # [11 22]',
                'print(np.column_stack([np.array([5, 6]), np.array([7, 8])]))   # [[5 7]',
                '                                                               #  [6 8]]: [5 6] es la primera columna',
              ) +
              '\n\nLo que va dentro de la función lleva 4 espacios de sangría: así sabe Python que es parte de ella.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('def matriz_desde(img_i, img_j):', '    return np.column_stack([___, ___])') +
              '\n\nLa primera va a la primera columna. Con las dos intercambiadas, la matriz sale con las columnas cambiadas de sitio.',
          ],
          explain:
            'Es la misma construcción de antes, ahora guardada para usarla con cualquier pareja de imágenes. Si la función devuelve las imágenes en filas, el resultado sale traspuesto.',
          solution:
            'El cuerpo de la función es `return np.column_stack([img_i, img_j])`. Con `img_i = (1, 2)` e `img_j = (3, 4)` devuelve $\\begin{pmatrix}1&3\\\\2&4\\end{pmatrix}$. Con `np.array([img_i, img_j])` saldría la traspuesta, $\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}$.',
          requirements: [
            '`matriz_desde` existe y es una función que recibe dos vectores de 2 componentes, las imágenes de î y de ĵ.',
            'La función devuelve un array de NumPy con números, de 2 filas y 2 columnas, cuya primera columna es la imagen de î y cuya segunda columna es la de ĵ.',
            'Se prueba con otros pares de imágenes además del ejemplo del enunciado, y la función no puede dar ningún error con ellos.',
          ],
          starter: `import numpy as np


def matriz_desde(img_i, img_j):
    # img_i e img_j llegan como arrays de NumPy de 2 números: adónde van î y ĵ.
    # Por ejemplo, con [1 2] y [3 4] la función tiene que devolver la matriz de
    # filas [1 3] y [2 4]. Usa los nombres img_i e img_j, no números escritos a
    # mano: así la función sirve para cualquier pareja, y las comprobaciones la
    # prueban con otras.
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría):
    # así sabe Python que es parte de ella.

    # PASO 1. Devolver la matriz de 2 filas y 2 columnas cuyas columnas son img_i e img_j.
    # Por qué: es la construcción de antes, guardada para repetirla con cualquier pareja.
    # Herramienta: np.column_stack([x, y]) apila x e y como columnas. (Si los
    # apilas como filas con np.array([x, y]), sale la traspuesta.)
    # return devuelve un valor y termina la función en ese momento. Sin return, la función no devuelve nada.
    # Resultado esperado: un array de NumPy de 2 filas y 2 columnas.
    return None


# Para ver qué vale algo antes de entregar: print(matriz_desde(np.array([1, 2]), np.array([3, 4]))) y pulsa «Ejecutar».
`,
          checks: `_f = matriz_desde


def _llamar(a, b):
    try:
        r = np.asarray(_f(np.array(a), np.array(b)))
    except BaseException:
        return None
    if np.issubdtype(r.dtype, np.number) and r.shape == (2, 2):
        return r.astype(float)
    return None


_casos = [((1, 2), (3, 4), [[1, 3], [2, 4]]), ((2, -1), (0, 5), [[2, 0], [-1, 5]]), ((0, 0), (1, 1), [[0, 1], [0, 1]]), ((-3, 1), (2, -2), [[-3, 2], [1, -2]])]
_r = [_llamar(a, b) for a, b, _e in _casos]
_p = _r[0]
_filas = _p is not None and np.allclose(_p, [[1, 2], [3, 4]])
_mal = any(r is None or not np.allclose(r, e) for r, (_a, _b, e) in zip(_r, _casos))
check(_p is not None, "\`matriz_desde(img_i, img_j)\` tiene que devolver un array de NumPy de 2 filas y 2 columnas. Prueba con \`img_i = np.array([1, 2])\` e \`img_j = np.array([3, 4])\`: si no devuelve nada, falta el \`return\`; si da un error, revisa la construcción.")
check(not _filas, "Con \`img_i = (1, 2)\` e \`img_j = (3, 4)\` tu función devuelve las imágenes en las filas: es la matriz traspuesta. Las imágenes de î y de ĵ tienen que ir en las columnas.")
check((not _mal) or _p is None or _filas, "Tu función no devuelve la matriz correcta en todos los casos. Con \`(1, 2)\` y \`(3, 4)\` tiene que devolver la matriz de filas (1, 3) y (2, 4), y con \`(2, -1)\` y \`(0, 5)\`, la de filas (2, 0) y (-1, 5).")
`,
          reference: `import numpy as np


def matriz_desde(img_i, img_j):
    return np.column_stack([img_i, img_j])
`,
        },
        {
          id: 'columnas.ex02.5',
          type: 'codigo',
          prompt:
            'En una capa lineal de un clasificador de reseñas, la matriz de pesos `W` tiene 3 filas, una por salida («positiva», «neutra» y «negativa»), y 4 columnas, una por característica de entrada. La **columna** `k` de `W` dice cuánto empuja la característica `k` a cada una de las tres salidas.\n\nGuarda en `col` la columna de la característica 2 (se cuenta desde 0) y en `posicion` la posición de la salida a la que más empuja.',
          hints: [
            'El plan son dos líneas. `col` es la columna de la característica 2 de `W`, es decir, la tercera, porque se cuenta desde 0: hay que dejar libre el sitio de las filas para quedarte con todas. `posicion` es la posición, dentro de `col`, del peso más grande; y es la posición, no el peso. El error típico es devolver el propio peso mayor o la posición del menor.',
            'Las piezas, con otra matriz de 2 filas y 3 columnas:\n\n' +
              py(
                'M = np.array([[1, 9, 4], [7, 2, 8]])',
                'c = M[:, 1]                # la columna 1 entera: sus números son 9 y 2',
                'print(np.argmax(c))        # 0: la posición del 9, que es el mayor',
                'print(c[np.argmax(c)])     # 9: así se lee el mayor, pero eso es el peso y no la posición',
                'print(np.argmin(c))        # 1: la posición del menor, que es lo contrario',
              ) +
              '\n\nLas posiciones se cuentan desde 0, como las columnas.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('col = W[:, ___]', 'posicion = np.___(col)') +
              '\n\nEl segundo hueco es la función que busca el mayor, no el menor. Y `posicion` se queda con lo que devuelve, sin leer el peso.',
          ],
          explain:
            'Cada columna de `W` es el efecto de una característica sobre todas las salidas. Para saber a cuál empuja más, se busca la posición del peso mayor dentro de esa columna.',
          solution:
            '`col = W[:, 2]` vale $(-2, 1, 6)$: la característica empuja hacia abajo la primera salida y hacia arriba las otras dos. El peso mayor es $6$, que está en la posición 2, así que `posicion = np.argmax(col)` vale $2$, la salida «negativa». Si tomas la fila `W[2]` en lugar de la columna, buscas otra cosa: cómo reciben las cuatro características a una sola salida.',
          requirements: [
            '`col` existe y es un array de NumPy con 3 componentes, todas números, una por salida.',
            '`col` es la columna de la característica 2 de `W`, de arriba abajo, y no una de sus filas.',
            '`posicion` existe y es un número entero: el lugar que ocupa dentro de `col` la salida a la que más empuja la característica, y no el valor de ese peso.',
          ],
          starter: `import numpy as np

# Ya está hecho: no hace falta tocarlo.
# W es la matriz de pesos de una capa lineal: un array de NumPy de 3 filas y 4 columnas.
# Cada fila es una salida (positiva, neutra, negativa) y cada columna, una característica de entrada.
# Las posiciones se cuentan desde 0: la característica 2 es la tercera columna.
W = np.array([
    [2, -1, -2, 0],
    [0, 4, 1, 1],
    [-1, 0, 6, 9],
])

# PASO 1. Guardar en col la columna de la característica 2 de W.
# Por qué: la columna k dice cuánto empuja la característica k a cada salida,
# así que con ella sabes el efecto de esa característica sobre las tres.
# Herramienta: W[:, k] elige la columna k entera. Antes de la coma van las filas
# (el : significa «todas») y después el número de columna, contado desde 0.
# Con un solo número, W[2] sería una fila, que es otra cosa.
# Resultado esperado: un array de NumPy con 3 números, uno por salida.
col = None

# PASO 2. Guardar en posicion la posición de la salida a la que más empuja.
# Por qué: la salida a la que más empuja es la del peso mayor de col, y lo que
# se pide es su posición (0, 1 o 2), no el valor del peso.
# Herramienta: np.argmax(x) devuelve la posición del número más grande de x.
# Ejemplo: np.argmax(np.array([4, 9, 1])) vale 1. (np.argmin da la del menor.)
# Resultado esperado: un número entero.
posicion = None

# Para ver qué vale algo antes de entregar: print(col) y pulsa «Ejecutar».
`,
          checks: `def _vec(a):
    return isinstance(a, np.ndarray) and a.shape == (3,) and np.issubdtype(a.dtype, np.number)

_fila = isinstance(col, np.ndarray) and col.shape == (4,) and np.issubdtype(col.dtype, np.number) and np.allclose(col, W[2])
_ent = isinstance(posicion, (int, np.integer)) and not isinstance(posicion, bool)
check(_vec(col) or _fila, "\`col\` tiene que ser un array de NumPy con 3 números, uno por salida: la columna de la característica 2.")
check(not _fila, "\`col\` vale (-1, 0, 6, 9): es una fila de \`W\`, con un peso por característica. Una columna tiene un peso por salida, así que hace falta \`:\` en el primer sitio.")
check((not _vec(col)) or np.allclose(col, [-2, 1, 6]), "\`col\` tiene que valer (-2, 1, 6): los pesos de la tercera columna de \`W\`, de arriba abajo.")
check(_ent, "\`posicion\` tiene que ser un número entero: la posición de la salida, no su peso. \`np.argmax\` da la posición del mayor.")
check((not _ent) or posicion != 6, "\`posicion\` vale 6, que es el peso mayor de la columna y no su posición. Necesitas la posición del mayor, que es lo que da \`np.argmax\`.")
check((not _ent) or posicion != 0, "\`posicion\` vale 0: es la salida a la que menos empuja, la del peso más pequeño. Busca la posición del peso mayor.")
check((not _ent) or posicion in (0, 6) or posicion == 2, "\`posicion\` tiene que valer 2: el peso mayor de la columna es 6, y está en la tercera posición.")
`,
          reference:
            'import numpy as np\n\nW = np.array([\n    [2, -1, -2, 0],\n    [0, 4, 1, 1],\n    [-1, 0, 6, 9],\n])\ncol = W[:, 2]\nposicion = np.argmax(col)\n',
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'columnas.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere la matriz `A` de la transformación que manda $\\hat{\\imath}$ a $(2, 1)$ y $\\hat{\\jmath}$ a $(-1, 3)$, y la comprueba multiplicándola por $\\hat{\\imath}$ (NumPy ya está importado como `np`). ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        '¿Dónde acaba cada imagen dentro de la matriz, en una fila o en una columna?',
        'Mira qué debería imprimir la última línea y qué imprimiría con la matriz tal como está construida.',
      ],
      explain:
        'Una lista de listas de NumPy se lee por filas. Piensa dónde queda cada imagen y qué columna de la matriz se obtiene al multiplicar por la primera flecha.',
      solution:
        'La tercera línea está mal. `np.array([img_i, img_j])` coloca las imágenes como filas, y la matriz sale traspuesta: la primera columna es $(2, -1)$ y no $(2, 1)$. La última línea imprime $(2, -1)$ en lugar de la imagen de $\\hat{\\imath}$. Lo correcto es `np.column_stack([img_i, img_j])` o añadir `.T`.',
      lines: [
        'img_i = np.array([2, 1])',
        'img_j = np.array([-1, 3])',
        'A = np.array([img_i, img_j])',
        'print(A @ np.array([1, 0]))',
      ],
      faultyLine: 2,
    },
    {
      id: 'columnas.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula adónde manda $\\hat{\\imath}$ una transformación. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Con un solo número, `A[0]` elige la primera línea horizontal de números de la matriz.',
        '¿Qué parte de la matriz es la imagen de $\\hat{\\imath}$: una fila o una columna?',
      ],
      explain:
        'Revisa cada línea: ¿lo que se afirma sobre `A[0]` es cierto? ¿De ahí se deduce lo que se dice después?',
      solution:
        'La segunda línea está mal. `A[0]` es la primera **fila** de la matriz, $(1, 3)$, y la imagen de $\\hat{\\imath}$ es la primera **columna**, $(1, 2)$. Para sacarla se escribe `A[:, 0]`. Por eso la tercera línea, que da $(1, 3)$, arrastra el error.',
      lines: [
        'La matriz es A = [[1, 3], [2, 4]], escrita por filas',
        'A[0] es la imagen de î',
        'Entonces î va a (1, 3)',
      ],
      faultyLine: 1,
    },
    {
      id: 'columnas.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento interpreta una matriz de pesos de una capa lineal. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Cuenta los números de cada columna y compáralos con las salidas.',
        'Una columna es la imagen de una flecha de entrada: decide a qué característica corresponde cada una.',
      ],
      explain:
        'Revisa cada línea: ¿el tamaño de la matriz cuadra con lo que se dice de las salidas y de las características? ¿La columna que se elige corresponde a la característica que se nombra?',
      solution:
        'No hay ningún error. Con 3 filas y 4 columnas, cada columna tiene 3 números, uno por salida, y hay una columna por característica. La columna de índice 1 es la de la segunda característica y dice cuánto la empuja a cada una de las tres salidas.',
      lines: [
        'W tiene 3 filas y 4 columnas: 3 salidas y 4 características de entrada',
        'Cada columna de W tiene 3 números, uno por salida',
        'La columna de índice 1, la segunda, dice cómo la segunda característica empuja a cada una de las 3 salidas',
      ],
      faultyLine: null,
    },
  ],
};
