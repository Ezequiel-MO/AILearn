import type { Project } from '../../content/schema';
import type { CapaSpec } from '../../engine/labs/capa';
import { py } from '../py';
import { simetricasWarmup } from './simetricas.calentamiento';
import { RESENAS, capaLab, type Cloud } from './datos';

/**
 * Seis textos medidos por sus palabras y sus tokens, contados respecto a la media (la nube está
 * centrada). Los dos rasgos suben juntos: su covarianza es (1,25 1; 1 1,25), con varianza 2,25 a lo
 * largo de (1, 1), la longitud, y 0,25 a lo largo de (1, −1), los tokens por palabra: el 90 % y el
 * 10 %. Propia de este proyecto porque la covarianza de `NUBE_ALARGADA`, usada como capa, saca las
 * palabras de la ventana y no tiene los ejes en la rejilla.
 */
const TEXTOS: Cloud = {
  points: [
    { id: 'saludo', label: 'saludo', x: -2, y: -1.5 },
    { id: 'receta', label: 'receta', x: -0.5, y: -1 },
    { id: 'tuit', label: 'tuit', x: -0.5, y: 0 },
    { id: 'cuento', label: 'cuento', x: 1, y: 0 },
    { id: 'noticia', label: 'noticia', x: 1, y: 0.5 },
    { id: 'codigo', label: 'código', x: 1, y: 2 },
  ],
  axes: ['palabras', 'tokens'],
};

/** Cuatro textos centrados para la cuenta de la covarianza: productos 4, 0, 0 y 4. */
const CUATRO_TEXTOS: Cloud = {
  points: [
    { id: 'aviso', label: 'aviso', x: -2, y: -2 },
    { id: 'tuit', label: 'tuit', x: -1, y: 0 },
    { id: 'correo', label: 'correo', x: 1, y: 0 },
    { id: 'informe', label: 'informe', x: 2, y: 2 },
  ],
  axes: ['palabras', 'tokens'],
};

/** La recta de v sobre los textos, sin capa: el medidor es la parte de la variación que recoge. */
const sobreTextos = (x: number, y: number, movable = true): CapaSpec =>
  capaLab(TEXTOS, { movable: 'none', probe: { x, y, movable, on: 'input' } });

/** La matriz de covarianza de `TEXTOS` como capa fija, con la circunferencia unidad y su elipse. */
const covarianzaComoCapa: CapaSpec = capaLab(TEXTOS, {
  range: 5,
  i: [1.25, 1],
  j: [1, 1.25],
  movable: 'none',
  probe: { x: 1, y: 0, movable: true, on: 'input' },
  circle: true,
  readouts: ['var_v', 'rayleigh'],
});

/** La meta de las dos primeras preguntas: qué parte de la variación cae sobre la recta de v. */
const PARTE_SOBRE_V = 'Parte de la variación de la nube a lo largo de v';

/**
 * Segundo proyecto de la Órbita 2 de matrices: una nube de datos tiene forma, y esa forma es una
 * matriz simétrica, la de covarianza. Sus direcciones propias son los ejes de la nube, salen
 * perpendiculares, y su autovalor es la varianza en esa dirección.
 */
export const simetricas: Project = {
  id: 'simetricas',
  name: 'Matrices simétricas',
  sub: 'Ejes perpendiculares y covarianza',
  bigPicture: {
    parts: ['inspect', 'compress'],
    text: 'La covarianza de un conjunto de vectores es una matriz simétrica, y sus autovectores son los ejes en los que los datos más varían. Son perpendiculares, lo que los hace cómodos de usar. Aquí los ves en un plano; la misma matriz con embeddings de $768$ números es la que se usa para explorarlos y comprimirlos.',
  },
  warmup: simetricasWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'simetricas.ex00.1',
          type: 'laboratorio',
          purpose: {
            why: 'Un conjunto de embeddings no es una bola: se estira más en unas direcciones que en otras. Saber hacia dónde varían más los datos es lo primero que se mira al explorarlos, y es lo que buscan PCA y los mapas de embeddings.',
            aim: 'Vas a mover una dirección sobre una nube de textos hasta encontrar aquella en la que los textos más se diferencian entre sí.',
            takeaway:
              'La nube varía sobre todo a lo largo de la diagonal: los textos con más palabras tienen también más tokens. Esa dirección, la longitud, recoge el 90 % de la variación; la horizontal y la vertical, solo la mitad.',
          },
          prompt:
            'Seis textos, medidos por sus **palabras** y sus **tokens**, contados respecto a la media. Cada texto se proyecta sobre la recta de $\\vec{v}$, y el medidor dice qué parte de toda la variación de la nube cae a lo largo de esa recta. Ahora $\\vec{v}$ mira solo las palabras y recoge la mitad.\n\nMueve $\\vec{v}$ hasta la dirección en la que los textos más varían.',
          hints: [
            'Mira las proyecciones sobre la recta: cuanto más repartidas quedan, más variación recoge. ¿Hacia dónde se alarga la nube?',
            'Lleva la punta de $\\vec{v}$ hacia arriba a la derecha, siguiendo la nube de «saludo» a «noticia». Apuntar al texto más alejado no basta: cuenta la forma de toda la nube.',
          ],
          explain:
            'La variación sobre $\\vec{v}$ es la media de los cuadrados de las proyecciones, porque la nube está centrada. Las palabras y los tokens suben juntos, así que la nube se alarga en diagonal y casi toda su variación cae a lo largo de esa diagonal.',
          solution:
            'Con $\\vec{v}$ en $(1, 1)$, o cualquier múltiplo, la recta sigue la nube y recoge el 90 % de la variación, el máximo. Valen también direcciones cercanas, como $(2;\\ 1{,}5)$ o $(1{,}5;\\ 2)$. Apuntar a «código», $(1, 2)$, se queda en el 82 %: ese texto se sale de la diagonal. La horizontal y la vertical recogen el 50 % cada una.',
          lab: sobreTextos(1, 0),
          goals: [
            {
              metric: 'var_frac',
              op: 'gte',
              target: 0.85,
              label: PARTE_SOBRE_V,
              format: 'percent',
            },
          ],
          solved: { vx: 1, vy: 1 },
        },
        {
          id: 'simetricas.ex00.2',
          type: 'laboratorio',
          purpose: {
            why: 'La dirección en la que los datos apenas varían también informa: es la que se puede descartar al comprimir sin perder casi nada, y la que mide en qué se distinguen textos que por lo demás se parecen.',
            aim: 'Vas a buscar la dirección en la que los seis textos menos se diferencian y a mirar qué ángulo forma con la que sigue la nube.',
            takeaway:
              'La dirección de menos variación es perpendicular a la de más: es la de los tokens por palabra, que separa «código» de «cuento». Ninguna baja del 10 %, y entre las dos se reparten toda la variación: el 90 % y el 10 %.',
          },
          prompt:
            'Los mismos seis textos. Ahora $\\vec{v}$ sigue la nube y recoge casi toda su variación. Busca lo contrario: la dirección en la que los textos menos se diferencian, la que casi no separa unos de otros.\n\nMueve $\\vec{v}$ hasta que recoja muy poca variación.',
          hints: [
            'Busca una recta sobre la que las proyecciones queden apiñadas cerca del centro. Fíjate en el ancho de la nube, no en su largo.',
            'Lleva $\\vec{v}$ a cruzar la nube de través, hacia arriba a la izquierda o hacia abajo a la derecha, en ángulo recto con la diagonal.',
          ],
          explain:
            'La nube es como una elipse: larga en una dirección y estrecha en otra. Las proyecciones se apiñan cuando la recta va a lo ancho. Las direcciones intermedias recogen algo de las dos.',
          solution:
            'Con $\\vec{v}$ en $(1, -1)$, o $(-1, 1)$, la recta cruza la nube en ángulo recto con la diagonal y recoge el 10 %, el mínimo. Sobre ella cuenta lo que cada texto tiene de tokens de más o de menos para sus palabras: «código» queda en un extremo y «cuento», en el otro. La horizontal se queda en el 50 %: no basta con salir de la diagonal.',
          lab: sobreTextos(1, 1),
          goals: [
            {
              metric: 'var_frac',
              op: 'lte',
              target: 0.15,
              label: PARTE_SOBRE_V,
              format: 'percent',
            },
          ],
          solved: { vx: 1, vy: -1 },
        },
        {
          id: 'simetricas.ex00.3',
          type: 'laboratorio',
          purpose: {
            why: 'La forma de una nube se guarda en una matriz, la de covarianza: la varianza de cada rasgo en la diagonal y lo que varían juntos fuera de ella. Es simétrica, y con embeddings de cientos de números es la que se descompone para hallar sus ejes.',
            aim: 'Vas a usar la matriz de covarianza de los seis textos como una capa y a buscar la dirección que esa capa estira más sin girarla.',
            takeaway:
              'La capa estira la diagonal por 2,25 sin girarla, y ninguna dirección más: es su autovalor mayor, y es la varianza de la nube en esa dirección. Los autovectores de la covarianza son los ejes de la nube, y sus autovalores, cuánto varía en cada uno.',
          },
          prompt:
            'La capa es ahora la matriz de covarianza de los seis textos: en la diagonal, la varianza de las palabras y la de los tokens; fuera, cuánto varían juntos. La circunferencia unidad sale convertida en una elipse. El panel da la varianza de la nube sobre $\\vec{v}$ y el cociente $\\vec{v}^{T}A\\vec{v}/\\vec{v}^{T}\\vec{v}$, con $A=C$.\n\nBusca la dirección que la capa estira más, sin girarla.',
          hints: [
            'Compara $\\vec{v}$ con su imagen: casi siempre apunta a otro lado. Compara también la elipse con la nube: ¿hacia dónde se alargan las dos?',
            'Lleva $\\vec{v}$ a lo largo del eje largo de la elipse, que es el de la nube. En el eje corto tampoco gira, pero casi no estira.',
          ],
          explain:
            'Una dirección que la capa no gira es un autovector: $C\\vec{v}=\\lambda\\vec{v}$, y lo que estira es $\\lambda$. Para ella, el cociente del panel también vale $\\lambda$, y ese cociente es siempre la varianza de la nube sobre $\\vec{v}$. Por eso los ejes de la elipse son los de la nube.',
          solution:
            'Con $\\vec{v}$ en $(-1, -1)$, o cualquier múltiplo como $(1, 1)$, $C\\vec{v}=(-2{,}25;\\ -2{,}25)$: la capa estira por $2{,}25$ y no gira. Es el máximo: ninguna dirección estira más, y la varianza de la nube sobre esa recta también es $2{,}25$. En $(1, -1)$ tampoco gira, pero estira solo $0{,}25$: el otro autovalor, la varianza a lo ancho.',
          lab: covarianzaComoCapa,
          goals: [
            {
              metric: 'img_angle',
              op: 'lte',
              target: 1,
              label: 'Lo que la capa gira a v, en grados',
            },
            { metric: 'stretch', op: 'gte', target: 2.2, label: 'Cuánto estira la capa a v' },
          ],
          solved: { vx: -1, vy: -1 },
        },
        {
          id: 'simetricas.ex00.4',
          type: 'laboratorio',
          purpose: {
            why: 'Muchos modelos aprenden mejor si sus rasgos de entrada no van juntos: dos rasgos que suben a la vez dicen casi lo mismo dos veces. Por eso, al preparar los datos, a veces se aplica una capa fija que los decorrela, como hace el blanqueo.',
            aim: 'Vas a construir una capa cuyas dos salidas no tengan relación entre sí en los seis textos, sin aplastarlos.',
            takeaway:
              'Girar la nube hasta sus ejes deja las salidas sin covarianza: una es la longitud y la otra, los tokens por palabra. No es la única capa que vale. Aplastar una salida también da covarianza cero, pero tira información.',
          },
          prompt:
            'Los seis textos pasan por una capa que ahora puedes mover. Con la capa en la identidad, sus dos salidas van juntas: la covarianza es alta. La parte siguiente del modelo funcionaría mejor si no tuvieran relación.\n\nMueve las columnas hasta que la covarianza de las dos salidas sea casi cero, sin que la capa aplaste la nube.',
          hints: [
            'Mira la nube de salida: mientras se alargue en diagonal, las dos salidas van juntas. Tiene que quedar alargada a lo largo de un eje del dibujo.',
            'Gira la nube un octavo de vuelta para que su eje largo caiga sobre la salida 1: $\\hat{\\imath}$ hacia abajo a la derecha y $\\hat{\\jmath}$ hacia arriba a la derecha, igual de largas.',
          ],
          explain:
            'La covarianza de las salidas mide si una sube cuando sube la otra. Si la nube de salida queda alargada sobre un eje del dibujo, conocer una salida no dice nada de la otra. Llevarlo todo a una recta también da covarianza $0$, pero entonces el área se pierde.',
          solution:
            'Con $\\hat{\\imath}$ en $(1, -1)$ y $\\hat{\\jmath}$ en $(1, 1)$, la salida 1 es palabras más tokens, la longitud, y la salida 2, tokens menos palabras: covarianza $0$ y área $2$. También vale $\\hat{\\imath}$ en $(1, -2)$ y $\\hat{\\jmath}$ en $(0;\\ 2{,}5)$: deja las palabras en la salida 1 y quita de la 2 lo que se explica por ellas. Con $\\hat{\\jmath}$ en el origen la covarianza es $0$, pero la capa aplasta.',
          lab: capaLab(TEXTOS, { readouts: ['spread_x', 'spread_y'] }),
          goals: [
            {
              metric: 'cov_xy',
              op: 'eq',
              target: 0,
              tol: 0.05,
              label: 'Covarianza de las dos salidas',
            },
            {
              metric: 'area',
              op: 'gte',
              target: 0.5,
              label: 'Área que deja la capa al cuadrado unidad',
            },
          ],
          solved: { ix: 1, iy: -1, jx: 1, jy: 1 },
        },
        {
          id: 'simetricas.ex00.5',
          type: 'laboratorio',
          purpose: {
            why: 'Las matrices simétricas aparecen por toda una red: la covarianza de los datos, la matriz de similitudes entre embeddings, el hessiano de la pérdida. Todas actúan igual: estiran a lo largo de dos ejes en ángulo recto, sin girar.',
            aim: 'Vas a cambiar una capa que acierta con las reseñas pero gira el plano por otra simétrica que acierte igual, y a mirar su elipse.',
            takeaway:
              'Con el mismo peso arriba a la derecha y abajo a la izquierda, la capa es simétrica: la elipse tiene los ejes en ángulo recto y la capa solo estira o voltea a lo largo de ellos. Aquí, eso basta para que la neurona siga acertando.',
          },
          prompt:
            'Seis reseñas con **intensidad** y **tono**. La neurona siguiente solo mira la primera salida y responde «positiva» a lo sombreado. Esta capa ya acierta con las seis, pero no es simétrica: el peso de arriba a la derecha y el de abajo a la izquierda no coinciden, y la capa gira el plano.\n\nHazla simétrica sin que la neurona deje de acertar.',
          hints: [
            'En la tabla de pesos, compara lo que la intensidad pone en la salida 2 con lo que el tono pone en la salida 1. Esos dos pesos tienen que coincidir.',
            'Sube $\\hat{\\imath}$ hasta que su altura sea el avance de $\\hat{\\jmath}$ hacia la derecha. Llevar $\\hat{\\jmath}$ hacia la izquierda también iguala, pero estropea el acierto.',
          ],
          explain:
            'Una matriz es simétrica si el peso de la fila 1 y la columna 2 es el de la fila 2 y la columna 1. En el dibujo, la altura de $\\hat{\\imath}$ tiene que ser el avance de $\\hat{\\jmath}$. La primera salida depende solo de la fila 1: si no la tocas, la neurona sigue acertando.',
          solution:
            'Con $\\hat{\\imath}$ en $(0, 1)$, la capa es $\\begin{pmatrix}0&1\\\\1&0{,}5\\end{pmatrix}$: simétrica, y la salida 1 sigue siendo el tono. La elipse queda con los ejes en ángulo recto. También vale bajar los dos pesos a $0{,}5$. Con $\\hat{\\jmath}$ en $(-1;\\ 0{,}5)$ también sería simétrica, pero la salida 1 pasaría a ser el tono cambiado de signo, y la neurona fallaría con las seis.',
          lab: capaLab(RESENAS, {
            i: [0, -1],
            j: [1, 0.5],
            readout: { w: [1, 0], b: 0 },
            circle: true,
          }),
          goals: [
            {
              metric: 'acc',
              op: 'gte',
              target: 1,
              label: 'Aciertos de la neurona siguiente',
              format: 'percent',
            },
            {
              metric: 'asym',
              op: 'lte',
              target: 0,
              label: 'Lo que le falta a la capa para ser simétrica',
            },
          ],
          solved: { iy: 1 },
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'simetricas.ex01.1',
          type: 'numero',
          purpose: {
            why: 'Antes de entrenar se mira qué rasgos van juntos: dos rasgos con covarianza alta dicen casi lo mismo. Es una de las primeras cuentas de cualquier análisis de datos, y es lo que va fuera de la diagonal en la matriz de covarianza.',
            aim: 'Vas a calcular, con cuatro textos, cuánto varían juntas sus palabras y sus tokens.',
            takeaway:
              'La covarianza vale $2$: positiva, porque los textos con más palabras que la media tienen también más tokens. Es el número que va fuera de la diagonal en la matriz de covarianza, arriba y abajo.',
          },
          prompt:
            'Cuatro textos, con sus palabras y sus tokens contados respecto a la media (la media de cada rasgo es $0$): «aviso» $(-2, -2)$, «tuit» $(-1, 0)$, «correo» $(1, 0)$ e «informe» $(2, 2)$.\n\nLa covarianza de los dos rasgos es la media de los productos de palabras por tokens. ¿Cuánto vale?',
          hints: [
            'Multiplica las dos coordenadas de cada texto: salen cuatro productos.',
            'Suma los cuatro productos y divide entre $4$, el número de textos.',
          ],
          explain:
            'Como las medias son $0$, cada coordenada ya es la desviación respecto a la media. Un producto positivo dice que el texto está del mismo lado de la media en los dos rasgos; uno negativo, que está en lados opuestos.',
          solution:
            'Los productos son $4$, $0$, $0$ y $4$. Suman $8$, y entre $4$ textos dan $2$. `np.cov` divide entre $n-1$ por defecto y daría $8/3$: las dos convenciones existen, y en el laboratorio se divide entre $n$.',
          lab: capaLab(CUATRO_TEXTOS, { movable: 'none' }),
          answer: 2,
          tol: 0,
        },
        {
          id: 'simetricas.ex01.2',
          type: 'opcion',
          purpose: {
            why: 'Leer una covarianza es leer una relación entre rasgos. En embeddings, una covarianza positiva entre dos coordenadas dice que suelen moverse juntas: eso alarga la nube y hace que esas dos coordenadas se repitan en parte.',
            aim: 'Vas a interpretar el signo de la covarianza entre palabras y tokens de los seis textos mirando cómo se reparte la nube.',
            takeaway:
              'Covarianza positiva: un texto por encima de la media en palabras suele estarlo también en tokens, y la nube se alarga hacia arriba a la derecha. Es una tendencia de la nube, no una regla que cumpla cada texto.',
          },
          prompt:
            'En el laboratorio están los seis textos, con sus palabras y sus tokens contados respecto a la media. El panel da su covarianza, que es positiva. ¿Qué dice ese signo?',
          hints: [
            'Mira la nube: si un texto está a la derecha del centro, ¿suele estar también arriba?',
            'El signo de cada producto dice si el texto se aparta de la media hacia el mismo lado en los dos rasgos. La covarianza es la media de esos productos.',
          ],
          explain:
            'La covarianza es la media de los productos de las desviaciones. Sale positiva cuando pesan más los textos que se apartan de la media hacia el mismo lado en los dos rasgos. Habla de cómo se reparte la nube, no de cada texto.',
          solution:
            'La segunda: en la nube, los textos de la derecha están arriba y los de la izquierda, abajo. No dice que haya más tokens que palabras: mira cómo se apartan de la media, no los valores. Tampoco que cada texto esté por encima en los dos: «saludo» está por debajo en ambos y suma a favor. Y no son el mismo rasgo: «código» se sale de la diagonal.',
          lab: capaLab(TEXTOS, { movable: 'none', readouts: ['cov_xy'] }),
          options: [
            'Que todo texto tiene más tokens que palabras',
            'Que los textos con más palabras que la media suelen tener también más tokens que la media',
            'Que cada texto tiene sus dos rasgos por encima de la media',
            'Que las palabras y los tokens son el mismo rasgo medido dos veces',
          ],
          correct: 1,
        },
        {
          id: 'simetricas.ex01.3',
          type: 'numero',
          purpose: {
            why: 'La varianza de los datos en una dirección dice cuánta información lleva esa dirección. Con la matriz de covarianza ya calculada no hace falta volver a los datos: basta una cuenta con la matriz, que es como se hace con embeddings de cientos de números.',
            aim: 'Vas a calcular la varianza de los seis textos en una dirección dada, usando solo su matriz de covarianza.',
            takeaway:
              'La varianza en la dirección de $\\vec{u}$ es $\\vec{u}^{T}C\\vec{u}=2{,}21$, entre el $0{,}25$ del eje corto y el $2{,}25$ del largo. La matriz de covarianza guarda la varianza en todas las direcciones a la vez.',
          },
          prompt:
            'La matriz de covarianza de los seis textos es\n\n$$C=\\begin{pmatrix}1{,}25&1\\\\1&1{,}25\\end{pmatrix}$$\n\nEn el laboratorio, la recta de $\\vec{v}$ va en la dirección del vector de longitud $1$ $\\vec{u}=(0{,}6;\\ 0{,}8)$. ¿Qué varianza tiene la nube sobre esa recta, es decir, cuánto vale $\\vec{u}^{T}C\\vec{u}$?',
          hints: [
            'Calcula primero $C\\vec{u}$, que es un vector, y después su producto escalar con $\\vec{u}$.',
            'Por componentes: $1{,}25\\,u_1^2+2\\cdot 1\\cdot u_1u_2+1{,}25\\,u_2^2$. Cuida el doble producto cruzado.',
          ],
          explain:
            'La varianza de las proyecciones sobre una dirección de longitud $1$ es $\\vec{u}^{T}C\\vec{u}$: sale de la matriz, sin volver a los datos. Tiene que quedar entre la varianza del eje corto de la nube y la del largo.',
          solution:
            '$C\\vec{u}=(1{,}25\\cdot 0{,}6+0{,}8;\\ 0{,}6+1{,}25\\cdot 0{,}8)=(1{,}55;\\ 1{,}6)$, y $\\vec{u}^{T}C\\vec{u}=0{,}6\\cdot 1{,}55+0{,}8\\cdot 1{,}6=0{,}93+1{,}28=2{,}21$. Es casi el máximo, $2{,}25$: la recta va a unos $8°$ de la diagonal.',
          lab: sobreTextos(1.5, 2, false),
          answer: 2.21,
          tol: 0.01,
        },
        {
          id: 'simetricas.ex01.4',
          type: 'opcion',
          purpose: {
            why: 'Los ejes de una nube de embeddings se usan como un sistema de coordenadas nuevo: la coordenada de cada dato en cada eje sale con un producto escalar. Eso funciona así de limpio porque los ejes salen en ángulo recto.',
            aim: 'Vas a explicar por qué los dos ejes de la nube de textos, la longitud y los tokens por palabra, salen perpendiculares.',
            takeaway:
              'La covarianza es simétrica, y las direcciones propias de una matriz simétrica con autovalores distintos son perpendiculares: es el teorema espectral. Sin simetría no está garantizado: una capa cualquiera puede tenerlas a $45°$.',
          },
          prompt:
            'En el laboratorio, la capa es la matriz de covarianza de los seis textos. Sus dos direcciones propias, las que no gira, son los ejes de la nube, y forman un ángulo recto. ¿Por qué tiene que ser así, sea cual sea la nube?',
          hints: [
            'Mueve $\\vec{v}$ y busca las dos direcciones que la capa no gira. ¿Qué tiene de especial esta matriz frente a una capa cualquiera?',
            'Compara el peso de arriba a la derecha con el de abajo a la izquierda: en una covarianza, los dos son la covarianza de los mismos dos rasgos.',
          ],
          explain:
            'La covarianza de las palabras con los tokens es la de los tokens con las palabras: la matriz de covarianza es simétrica siempre. Y para las matrices simétricas hay un teorema que garantiza ejes propios perpendiculares. Una capa que no es simétrica no tiene esa garantía.',
          solution:
            'La tercera. $C=\\begin{pmatrix}1{,}25&1\\\\1&1{,}25\\end{pmatrix}$ es simétrica, y sus direcciones propias, $(1, 1)$ y $(1, -1)$, cumplen $(1, 1)\\cdot(1, -1)=0$. Centrar la nube no basta, y no toda matriz cumple: $\\begin{pmatrix}2&1\\\\0&1\\end{pmatrix}$ tiene direcciones propias $(1, 0)$ y $(1, -1)$, a $45°$. Y no se eligen a mano: salen de la matriz.',
          lab: { ...covarianzaComoCapa, readouts: [] },
          options: [
            'Porque la nube está centrada en el origen',
            'Porque toda matriz de $2\\times 2$ tiene sus direcciones propias en ángulo recto',
            'Porque la matriz de covarianza es simétrica, y las direcciones propias de una matriz simétrica son perpendiculares',
            'Porque al calcular los ejes se eligen perpendiculares a propósito',
          ],
          correct: 2,
        },
        {
          id: 'simetricas.ex01.5',
          type: 'numero',
          purpose: {
            why: 'Para estudiar embeddings reales se calcula su matriz de covarianza, con una fila y una columna por coordenada. Con $768$ coordenadas, como en BERT base o en el GPT-2 pequeño, son más de medio millón de casillas, y la simetría ahorra casi la mitad.',
            aim: 'Vas a contar cuántos números distintos hay que guardar de la covarianza de unos embeddings de $768$ coordenadas, aprovechando que es simétrica.',
            takeaway:
              'Son $295\\,296$: las $768$ varianzas de la diagonal y una sola vez cada covarianza de fuera. Las bibliotecas numéricas tienen formatos que guardan solo esa mitad de una matriz simétrica.',
          },
          prompt:
            'Unos embeddings tienen $768$ coordenadas. Su matriz de covarianza es de $768\\times 768$: la varianza de cada coordenada en la diagonal y la covarianza de cada pareja fuera de ella. Como es simétrica, cada covarianza aparece dos veces.\n\n¿Cuántos números distintos hay que guardar, como mucho?',
          hints: [
            'Cuenta por separado la diagonal, $768$ números, y las casillas de fuera, que son todas las demás.',
            'Las de fuera van por parejas iguales, una a cada lado de la diagonal. Basta guardar una de cada pareja.',
          ],
          explain:
            'La matriz tiene $768^2$ casillas. Las de la diagonal son únicas; las de fuera se repiten en espejo, así que cuentan la mitad. Con $n$ coordenadas, la cuenta corta es $n(n+1)/2$.',
          solution:
            'Fuera de la diagonal hay $768^2-768=589\\,056$ casillas, que forman $294\\,528$ parejas. Con las $768$ varianzas, $294\\,528+768=295\\,296$, que es $768\\cdot 769/2$. Sin aprovechar la simetría serían $589\\,824$.',
          answer: 295296,
          tol: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'simetricas.ex02.1',
          type: 'codigo',
          prompt:
            'En `X` hay 6 muestras (una por fila) de 2 variables (una por columna). La **matriz de covarianza** tiene las varianzas en la diagonal y la covarianza fuera de ella, con las sumas divididas entre $n-1$, y se calcula con `np.cov`. Guarda en `C` la matriz de covarianza de las dos variables, en `var_x` la varianza de la primera y en `cov_xy` la covarianza entre las dos.',
          hints: [
            'El plan: la matriz de covarianza `C` sale de una sola función de NumPy, `np.cov`, aplicada a `X`. Ojo con lo que toma por defecto como una variable: una fila o una columna. En `X` las variables están en las columnas, así que hay que avisarle (con un parámetro de la función o dándole los datos traspuestos). Con `C` ya hecha, `var_x` es la entrada de la diagonal que corresponde a la primera variable, y `cov_xy` la entrada de fuera de la diagonal que cruza las dos variables; las lees con `C[fila, columna]`, contando desde 0.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'datos = np.array([[1, 5], [2, 7], [3, 6]])   # 3 muestras (filas), 2 variables (columnas)',
                'print(datos.shape)                        # (3, 2)',
                'print(np.cov(datos).shape)                # (3, 3): por defecto, cada FILA es una variable',
                'print(np.cov(datos, rowvar=False).shape)  # (2, 2): ahora cada columna es una variable',
                'print(np.cov(datos.T).shape)              # (2, 2): la traspuesta lleva a lo mismo',
                '',
                'M = np.array([[4, 1], [1, 9]])',
                'print(M[1, 1])   # 9: fila 1, columna 1',
                'print(M[0, 1])   # 1: fila 0, columna 1',
              ) +
              '\n\nLa forma `(3, 2)` es una tupla: 3 filas y 2 columnas. En una matriz de covarianza, la diagonal tiene las varianzas de cada variable y fuera de ella están las covarianzas.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('C = np.cov(X, ___)', 'var_x = C[___, ___]', 'cov_xy = C[___, ___]') +
              '\n\nEl primer hueco es cómo avisar a `np.cov` de que las variables están en las columnas. Si `C` te sale de 6 por 6, no se lo has dicho: ha tratado cada muestra como una variable.',
          ],
          explain:
            '`np.cov` supone por defecto que cada **fila** es una variable y cada columna, una observación: la convención contraria a la de una tabla de datos, donde cada fila es una muestra. Con 6 filas, calcula cómo se parecen entre sí las 6 muestras, y sale una matriz de 6 por 6 en lugar de la de las 2 variables.',
          solution:
            '`C = np.cov(X, rowvar=False)` (o `np.cov(X.T)`) da $\\begin{pmatrix}3{,}5&4{,}6\\\\4{,}6&6{,}8\\end{pmatrix}$: la varianza de la primera variable es `C[0, 0]`, igual a $3{,}5$, y la covarianza, `C[0, 1]`, igual a $4{,}6$. Con `np.cov(X)` sale una matriz de 6 por 6, porque trata cada muestra como una variable, y la covarianza que se lee en ella es la de dos muestras.',
          requirements: [
            '`C` es un array de NumPy de 2 filas y 2 columnas, una por cada variable, con las sumas divididas entre $n-1$.',
            '`var_x` es un número: la varianza de la primera variable, con el mismo divisor.',
            '`cov_xy` es un número: la covarianza entre las dos variables.',
            'Se aceptan diferencias diminutas de redondeo.',
          ],
          starter: `import numpy as np

# X es la tabla de datos: 6 filas (una por muestra) y 2 columnas (una por variable).
# X[2] sería la tercera muestra, y X[:, 0] la primera columna entera.
X = np.array([
    [1, 2],
    [2, 3],
    [3, 5],
    [4, 4],
    [5, 7],
    [6, 9],
])

# PASO 1. La matriz de covarianza de las dos variables de X, en C.
# Por qué: en una sola matriz cuenta cuánto varía cada variable (la diagonal) y cuánto varían
# a la vez las dos (fuera de la diagonal). Es simétrica, y por eso luego tendrá autovectores
# perpendiculares.
# Herramienta: np.cov(M) recibe un array y devuelve su matriz de covarianza. Cuidado: por
# defecto toma cada FILA de M como una variable. Si M tiene 10 filas y 3 columnas (3 variables),
# np.cov(M) sale de 10 por 10, y no es lo que se busca. Para cambiar esa convención, np.cov
# admite el parámetro rowvar (mira su valor por defecto), o puedes pasarle M.T, la traspuesta
# (filas y columnas intercambiadas). Esperado: un array de 2 filas y 2 columnas.
C = None

# PASO 2. La varianza de la primera variable, en var_x.
# Por qué: es lo que varía la primera variable por sí sola, y vive en la diagonal de C.
# Herramienta: C[fila, columna] lee una entrada de un array de dos ejes, contando desde 0:
# si M = np.array([[4, 1], [1, 9]]), M[1, 1] vale 9 y M[0, 1] vale 1.
# Esperado: un número.
var_x = None

# PASO 3. La covarianza entre las dos variables, en cov_xy.
# Por qué: dice si las dos suben a la vez (positiva) o una sube cuando la otra baja (negativa).
# Está fuera de la diagonal de C; se lee igual que en el paso 2, con C[fila, columna].
# Esperado: un número.
cov_xy = None

# Para ver qué vale algo antes de entregar: print(C) y pulsa «Ejecutar».
`,
          checks: `_n = lambda x: isinstance(x, (int, float, np.integer, np.floating)) and not isinstance(x, (bool, np.bool_))
_c = isinstance(C, np.ndarray) and C.ndim == 2 and C.dtype.kind in "iuf"
_big = _c and C.shape == (6, 6)
_ok = _c and C.shape == (2, 2)
_v = _n(var_x)
_k = _n(cov_xy)
check(_c, "\`C\` tiene que ser un array de NumPy de dos ejes: la matriz de covarianza.")
check((not _c) or not _big, "\`C\` tiene 6 filas y 6 columnas, una por cada muestra. \`np.cov\` toma por defecto cada fila como una variable; aquí las variables están en las columnas.")
check((not _c) or _big or _ok, "\`C\` tiene que tener 2 filas y 2 columnas: una fila y una columna por cada variable.")
check((not _ok) or np.allclose(C, [[3.5, 4.6], [4.6, 6.8]]), "\`C\` no tiene las varianzas y la covarianza de las dos variables de \`X\`, divididas entre el número de muestras menos 1.")
check(_v, "\`var_x\` tiene que ser un número: la varianza de la primera variable.")
check((not _v) or not np.isclose(var_x, 35 / 12), "\`var_x\` sale de dividir entre el número de muestras. La varianza de unos datos que son una muestra se divide entre ese número menos 1; con \`np.var\` se pide con \`ddof=1\`.")
check((not _v) or np.isclose(var_x, 35 / 12) or np.isclose(var_x, 3.5), "\`var_x\` tiene que valer 3,5: es la varianza de la primera variable, la primera entrada de la diagonal de la matriz de covarianza.")
check(_k, "\`cov_xy\` tiene que ser un número: la covarianza entre las dos variables.")
check((not _k) or np.isclose(cov_xy, 4.6), "\`cov_xy\` tiene que valer 4,6: es la covarianza entre las dos variables, una de las dos entradas de fuera de la diagonal.")
`,
          reference:
            'import numpy as np\n\nX = np.array([\n    [1, 2],\n    [2, 3],\n    [3, 5],\n    [4, 4],\n    [5, 7],\n    [6, 9],\n])\nC = np.cov(X, rowvar=False)\nvar_x = C[0, 0]\ncov_xy = C[0, 1]\n',
        },
        {
          id: 'simetricas.ex02.2',
          type: 'codigo',
          prompt:
            'La matriz de covarianza de unos datos con una muestra por fila se calcula restando a cada columna su media y multiplicando: $C=\\dfrac{X_c^{T}X_c}{n-1}$, con $X_c$ los datos sin la media y $n$ el número de muestras. Escribe `covarianza(X)`, que recibe un array de NumPy con las muestras en las filas y devuelve su matriz de covarianza, **sin usar `np.cov`**. Después guarda en `C_datos` el resultado para `datos`.',
          hints: [
            'El plan: dentro de `covarianza`, (1) crea `Xc`, la tabla con la media de cada columna restada, con `X.mean(axis=0)`; (2) multiplica la traspuesta de `Xc` por `Xc` con `@` y divide entre el número de filas menos 1 (`len(X) - 1`); (3) devuelve ese resultado con `return`. Fuera de la función, `C_datos` es `covarianza(datos)`. Ojo: el orden de los factores decide la forma, y la covarianza tiene una fila y una columna por cada variable, no por cada muestra.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'tabla = np.array([[1, 10], [3, 30], [5, 20]])   # 3 muestras, 2 variables',
                'medias = tabla.mean(axis=0)   # una media por columna',
                'print(medias)                 # [ 3. 20.]',
                'centrada = tabla - medias     # a cada fila se le restan esas medias',
                'print(centrada[0])            # [ -2. -10.]: la primera muestra, sin la media',
                'print(centrada.T.shape)       # (2, 3): la traspuesta intercambia filas y columnas',
                'print((centrada.T @ centrada).shape)   # (2, 2): una fila y una columna por variable',
                'print((centrada @ centrada.T).shape)   # (3, 3): una por muestra',
                'print(len(tabla))             # 3: el número de filas',
              ) +
              '\n\n`axis=0` recorre las filas hacia abajo, es decir, saca una media por columna. Dentro de una función, todo lo que va a su cargo se escribe con 4 espacios de sangría.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def covarianza(X):',
                '    Xc = X - X.mean(axis=___)',
                '    return ___ @ ___ / (len(X) - ___)',
                '',
                'C_datos = covarianza(datos)',
              ) +
              '\n\nLos dos factores del producto son `Xc` y su traspuesta, pero en un orden que da una matriz de una fila y una columna por variable. Si te sale de 5 por 5, está al revés.',
          ],
          explain:
            'Hay cuatro tropiezos clásicos: no restar la media, restarla por muestra y no por variable, dividir entre $n$ en lugar de $n-1$, y multiplicar en el orden que da una matriz con una fila por cada muestra, en vez de una por cada variable.',
          solution:
            'Se centra `X` restándole la media de cada columna, y se devuelve `Xc.T @ Xc` dividido entre `len(X) - 1`. Con `datos`, la media es $(3, 3)$ y la matriz es $\\begin{pmatrix}2{,}5&2\\\\2&2{,}5\\end{pmatrix}$. Multiplicar `Xc @ Xc.T` daría una matriz de 5 por 5, una fila por muestra, y sin centrar los valores dependerían de dónde están los datos y no de cómo varían.',
          requirements: [
            '`covarianza` es una función que recibe un array de NumPy con las muestras en las filas y devuelve un array de NumPy: una fila y una columna por cada variable.',
            'Se llama a la función con otros datos además de `datos`, de otras formas (con 2 y con 3 variables) y con medias distintas de cero; no debe dar error.',
            'La matriz devuelta es la de covarianza, con las sumas divididas entre $n-1$, y no cambia el array que se le pasa.',
            '`C_datos` es un array de NumPy: lo que devuelve `covarianza` para `datos`.',
          ],
          starter: `import numpy as np


def covarianza(X):
    # Aquí escribes tú. Todo lo que va dentro de una función lleva sangría (4 espacios a la
    # izquierda), y el valor que devuelve se pone tras la palabra return.
    # X llega como un array de NumPy: una fila por muestra y una columna por variable.
    #
    # PASO 1. Centrar los datos: restar a cada columna su media. Guárdalo en una variable
    # propia, por ejemplo Xc (X centrada).
    # Por qué: la covarianza mide cómo varían los datos respecto a su media, no dónde están.
    # Sin restar la media, dos datos iguales colocados en otro sitio darían otro resultado.
    # Herramienta: X.mean(axis=0) saca la media de cada columna (una por variable) como un
    # array. Con axis=0 se recorren las filas hacia abajo. Por ejemplo,
    # np.array([[1, 10], [3, 30]]).mean(axis=0) vale [ 2. 20.]. Si a un array de dos ejes le
    # restas un array con un número por columna, NumPy se lo resta a todas las filas de golpe.
    #
    # PASO 2. Multiplicar y dividir.
    # Por qué: el producto de Xc por su traspuesta suma, para cada par de variables, los
    # productos de sus desviaciones, y eso dividido entre n - 1 (n = número de muestras) es la
    # covarianza de unas muestras.
    # Herramienta: Xc.T es la traspuesta (filas por columnas) y @ multiplica matrices. Con Xc de
    # n filas y p columnas, Xc.T tiene p filas y n columnas: según el orden de los factores
    # sale una matriz de p por p o de n por n, y aquí se necesita una por variable. len(X) es el
    # número de filas, n.
    # Se devuelve con return; el resultado esperado es un array de p filas y p columnas.
    return None


datos = np.array([
    [1, 2],
    [2, 1],
    [3, 4],
    [4, 3],
    [5, 5],
])
# PASO 3. Guarda en C_datos la matriz de covarianza de datos: lo que devuelve tu función
# cuando le pasas datos. Se llama a una función escribiendo su nombre y entre paréntesis lo
# que recibe. Esperado: un array de 2 filas y 2 columnas.
C_datos = None

# Para ver qué vale algo antes de entregar: print(C_datos) y pulsa «Ejecutar».
`,
          checks: `_f = callable(globals().get("covarianza"))
def _call(X):
    try:
        return covarianza(np.array(X, dtype=float))
    except Exception:
        return None
def _centered(x):
    return x - x.mean(axis=0)
def _right(x):
    xc = _centered(x)
    return xc.T @ xc / (len(x) - 1)
_data = [np.array(c, dtype=float) for c in [
    [[1, 2], [3, 6], [5, 4], [7, 8]],
    [[2, 0, 1], [4, 3, 1], [3, 9, 5], [8, 6, 2], [1, 1, 7]],
    [[4, 1], [6, 3], [5, 8]],
]]
_res = [_call(x) for x in _data] if _f else []
_arr = _f and all(isinstance(r, np.ndarray) and r.dtype.kind in "iuf" for r in _res)
_fits = _arr and all(r.shape == (x.shape[1], x.shape[1]) for r, x in zip(_res, _data))
_per_sample = _arr and not _fits and all(r.shape == (len(x), len(x)) for r, x in zip(_res, _data))
def _same(refs):
    return _fits and all(np.allclose(r, w) for r, w in zip(_res, refs))
_good = _same([_right(x) for x in _data])
_nomean = _same([x.T @ x / (len(x) - 1) for x in _data])
_divn = _same([_right(x) * (len(x) - 1) / len(x) for x in _data])
_byrow = _same([(x - x.mean(axis=1, keepdims=True)).T @ (x - x.mean(axis=1, keepdims=True)) / (len(x) - 1) for x in _data])
_cd = isinstance(C_datos, np.ndarray) and C_datos.shape == (2, 2) and C_datos.dtype.kind in "iuf"
_want = _right(np.array([[1, 2], [2, 1], [3, 4], [4, 3], [5, 5]], dtype=float))
check(_f, "Hay que definir una función \`covarianza\` que reciba la tabla de muestras.")
check((not _f) or _arr, "\`covarianza\` tiene que devolver un array de NumPy con números: la matriz de covarianza.")
check((not _per_sample), "\`covarianza\` devuelve una matriz con una fila y una columna por cada muestra. La de covarianza tiene una por cada variable: el orden de los factores del producto da una forma o la otra.")
check((not _arr) or _fits or _per_sample, "\`covarianza\` tiene que devolver una matriz cuadrada con una fila y una columna por cada variable, es decir, por cada columna de la tabla.")
check((not _fits) or not _nomean, "\`covarianza\` no resta la media: sin restarla, los valores dependen de dónde están los números y no de cómo varían.")
check((not _fits) or not _byrow, "\`covarianza\` resta la media de cada muestra, la de cada fila. Hay que restar a cada variable su propia media, la de cada columna.")
check((not _fits) or not _divn, "\`covarianza\` divide entre el número de muestras. La covarianza de unas muestras se divide entre ese número menos 1.")
check((not _fits) or _good or _nomean or _byrow or _divn, "\`covarianza\` tiene que dar la matriz de covarianza de las columnas de la tabla: sus productos centrados, divididos entre el número de muestras menos 1.")
check((not _good) or _cd, "\`C_datos\` tiene que ser un array de NumPy de 2 filas y 2 columnas: lo que devuelve \`covarianza\` para \`datos\`.")
check((not _good) or (not _cd) or np.allclose(C_datos, _want), "\`C_datos\` tiene que ser lo que devuelve \`covarianza\` para \`datos\`.")
`,
          reference: `import numpy as np


def covarianza(X):
    Xc = X - X.mean(axis=0)
    return Xc.T @ Xc / (len(X) - 1)


datos = np.array([
    [1, 2],
    [2, 1],
    [3, 4],
    [4, 3],
    [5, 5],
])
C_datos = covarianza(datos)
`,
        },
        {
          id: 'simetricas.ex02.3',
          type: 'codigo',
          prompt:
            'Una matriz simétrica como `C` tiene autovalores reales y autovectores perpendiculares, y `np.linalg.eigh` los calcula: devuelve los autovalores y una matriz cuyas **columnas** son los autovectores. Guarda en `vals` y `vecs` lo que devuelve `np.linalg.eigh(C)`, en `lam_max` el autovalor mayor, en `u` su autovector, y en `perpendiculares` si los dos autovectores son perpendiculares, es decir, si su producto escalar es $0$ salvo redondeo (un solo `True` o `False`).',
          hints: [
            'El plan: (1) `np.linalg.eigh(C)` devuelve dos cosas, los autovalores y la matriz de autovectores; guárdalas de una vez en `vals` y `vecs`. (2) `eigh` da los autovalores de menor a mayor, así que el mayor es el último de `vals`. (3) El autovector de cada autovalor está en la columna de `vecs` con su mismo número de posición: tómala con `vecs[:, posición]`. (4) Los dos autovectores son las dos columnas de `vecs`; su producto escalar con `@` es casi 0 si son perpendiculares, y como es un decimal, compara con `np.isclose` y no con `==`. Ojo: los autovectores están en las columnas, no en las filas.',
            'Las piezas, con otra matriz simétrica:\n\n' +
              py(
                'S = np.array([[2, 1], [1, 2]])',
                'w, V = np.linalg.eigh(S)   # dos resultados a la vez: autovalores y autovectores',
                'print(w)                   # [1. 3.]: de menor a mayor',
                'print(w[-1])               # 3.0: la posición -1 es la última, el mayor',
                'print(V.shape)             # (2, 2)',
                'col = V[:, 1]              # todas las filas de la columna 1: un autovector',
                'print(col.shape)           # (2,): dos números',
                'fila = V[1]                # la fila 1: no es un autovector',
                'print(np.isclose(V[:, 0] @ V[:, 1], 0))   # True: su producto escalar es casi 0',
                'print(0.1 + 0.2 == 0.3, np.isclose(0.1 + 0.2, 0.3))   # False True',
              ) +
              '\n\n`V[:, 1]` se lee «todas las filas, columna 1». Los autovectores pueden salir con el signo cambiado; da igual, siguen siendo autovectores.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'vals, vecs = np.linalg.eigh(C)',
                'lam_max = vals[___]',
                'u = vecs[:, ___]',
                'perpendiculares = np.isclose(vecs[:, 0] @ vecs[:, 1], ___)',
              ) +
              '\n\nLos dos primeros huecos son la misma posición: la del mayor autovalor, que es el último. Con `vecs[1]` (sin los dos puntos) lees una fila, y eso no es un autovector.',
          ],
          explain:
            '`np.linalg.eigh` devuelve los autovalores **ordenados** de menor a mayor, y los autovectores en las columnas de la matriz, no en sus filas. Con el mayor autovalor en una posición, su autovector está en esa misma posición de las columnas.',
          solution:
            'Los autovalores de `C` son $-3$ y $2$, y `eigh` los da en ese orden: el mayor es el último, `vals[-1]`, y no `vals[0]`. Su autovector es la última columna de `vecs`, `vecs[:, -1]`, proporcional a $(2, 1)$ (el signo puede salir de cualquier manera). Las dos columnas tienen producto escalar $0$, luego `perpendiculares` vale `True`. Tomar `vecs[1]` en lugar de la columna da la segunda fila, que no es un autovector.',
          requirements: [
            '`vals` es un array de NumPy con los 2 autovalores de `C`, y `vecs` es un array de NumPy de 2 filas y 2 columnas; juntos tienen que ser lo que devuelve la función de NumPy para matrices simétricas.',
            '`lam_max` es un número: el autovalor mayor.',
            '`u` es un array de NumPy con 2 números: el autovector de `lam_max`, de longitud 1. Se acepta con cualquiera de sus dos signos.',
            '`perpendiculares` es un solo `True` o `False`.',
          ],
          starter: `import numpy as np

# C es simétrica: 2 filas y 2 columnas.
C = np.array([[1, 2], [2, -2]])

# PASO 1. Los autovalores en vals y los autovectores en vecs.
# Por qué: una matriz simétrica tiene autovalores reales y autovectores perpendiculares, y
# np.linalg.eigh está hecha justo para ellas.
# Herramienta: np.linalg.eigh(C) devuelve DOS cosas a la vez: un array con los autovalores y una
# matriz cuyas COLUMNAS son los autovectores. Para guardarlas de una vez se escribe
# a, b = función(...): la primera cosa queda en a y la segunda en b. Los autovalores salen de menor
# a mayor. Esperado: vals con 2 números y vecs de 2 filas y 2 columnas.
vals = None
vecs = None

# PASO 2. El autovalor mayor, en lam_max.
# Por qué: es el que mide la dirección en la que la matriz estira más.
# Herramienta: un array se lee por posición, contando desde 0, y la posición -1 es la última:
# si a = np.array([5, 8, 9]), a[0] vale 5 y a[-1] vale 9. Como vals va de menor a mayor,
# piensa en qué posición queda el mayor. Esperado: un número.
lam_max = None

# PASO 3. El autovector de lam_max, en u.
# Por qué: cada autovalor tiene su autovector, y está en la columna de vecs con la misma posición
# que el autovalor en vals.
# Herramienta: vecs[:, k] lee la columna k entera (los dos puntos significan «todas las
# filas»); vecs[k] leería la fila k, y eso no es un autovector. Esperado: un array de 2 números.
u = None

# PASO 4. Si los dos autovectores son perpendiculares, en perpendiculares.
# Por qué: dos vectores son perpendiculares si su producto escalar es 0, y en una matriz
# simétrica siempre lo son (salvo el redondeo de los decimales).
# Herramienta: a @ b es el producto escalar de dos vectores. Como es un decimal, no se compara
# con ==: np.isclose(x, 0) dice True si x es casi 0. Por ejemplo, np.isclose(0.1 + 0.2, 0.3)
# es True, mientras que 0.1 + 0.2 == 0.3 es False. Esperado: un solo True o False.
perpendiculares = None

# Para ver qué vale algo antes de entregar: print(vals) y pulsa «Ejecutar».
`,
          checks: `_n = lambda x: isinstance(x, (int, float, np.integer, np.floating)) and not isinstance(x, (bool, np.bool_))
def _arr(a, shape):
    return isinstance(a, np.ndarray) and a.shape == shape and a.dtype.kind in "iuf"
def _par(a, b):
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    return na > 0 and nb > 0 and abs(float(a @ b)) / (na * nb) > 1 - 1e-6
_C = np.array([[1.0, 2.0], [2.0, -2.0]])
_v = _arr(vals, (2,))
_V = _arr(vecs, (2, 2))
_vok = _v and np.allclose(np.sort(vals), [-3, 2])
_Vok = _vok and _V and np.allclose(_C @ vecs, vecs * vals)
_l = _n(lam_max)
_u = _arr(u, (2,))
_uok = _u and _par(u, np.array([2.0, 1.0]))
_rows = _u and _V and any(_par(u, vecs[k]) for k in range(2))
_p = isinstance(perpendiculares, (bool, np.bool_))
check(_v, "\`vals\` tiene que ser un array de NumPy con 2 números: los autovalores de \`C\`.")
check((not _v) or _vok, "\`vals\` no tiene los autovalores de \`C\`. Son los que devuelve \`np.linalg.eigh\`.")
check(_V, "\`vecs\` tiene que ser un array de NumPy de 2 filas y 2 columnas: la matriz de autovectores que devuelve \`np.linalg.eigh\`.")
check((not _V) or (not _vok) or _Vok, "\`vecs\` no es la matriz de autovectores de \`C\`: cada columna tiene que ser el autovector del autovalor que está en su misma posición de \`vals\`.")
check(_l, "\`lam_max\` tiene que ser un número: el autovalor mayor de \`C\`.")
check((not _l) or not np.isclose(lam_max, -3), "\`lam_max\` vale -3, el menor. \`np.linalg.eigh\` devuelve los autovalores de menor a mayor, así que el mayor no está en la primera posición.")
check((not _l) or np.isclose(lam_max, -3) or np.isclose(lam_max, 2), "\`lam_max\` tiene que ser el autovalor mayor de \`C\`.")
check(_u, "\`u\` tiene que ser un array de NumPy con 2 números: el autovector de \`lam_max\`.")
check((not _u) or _uok or not _rows, "\`u\` es una fila de \`vecs\`. Los autovectores están en las columnas de \`vecs\`, no en las filas.")
check((not _u) or _uok or _rows, "\`u\` tiene que ser el autovector del autovalor mayor: la columna de \`vecs\` que está en la misma posición que \`lam_max\` en \`vals\`.")
check((not _uok) or np.isclose(np.linalg.norm(u), 1), "\`u\` tiene que ser una columna de \`vecs\`, de longitud 1, sin cambiarle el tamaño.")
check(_p, "\`perpendiculares\` tiene que ser un solo \`True\` o \`False\`, no el producto escalar: la respuesta a si los dos autovectores forman un ángulo recto.")
check((not _p) or bool(perpendiculares), "\`perpendiculares\` vale \`False\`: los autovectores de una matriz simétrica forman un ángulo recto, y su producto escalar es 0 salvo el redondeo. Compara con \`np.isclose\`.")
`,
          reference: `import numpy as np

C = np.array([[1, 2], [2, -2]])
vals, vecs = np.linalg.eigh(C)
lam_max = vals[-1]
u = vecs[:, -1]
perpendiculares = np.isclose(vecs[:, 0] @ vecs[:, 1], 0)
`,
        },
        {
          id: 'simetricas.ex02.4',
          type: 'codigo',
          prompt:
            'Los autovectores de una matriz simétrica son perpendiculares y de longitud 1 (se dice **ortonormales**), y con ellos la matriz se reconstruye: $C=V\\Lambda V^{T}$, con $V$ la matriz que tiene los autovectores en las columnas y $\\Lambda$ la matriz con los autovalores en la diagonal y ceros fuera. Guarda en `vals` y `vecs` lo que devuelve `np.linalg.eigh(C)`, en `ortonormal` si las columnas de `vecs` son ortonormales (un solo `True` o `False`) y en `C2` el producto $V\\Lambda V^{T}$ calculado con ellos, que tiene que coincidir con `C`.',
          hints: [
            'El plan: (1) `vals, vecs = np.linalg.eigh(C)`. (2) `ortonormal`: las columnas de `vecs` son perpendiculares y de longitud 1 si la traspuesta de `vecs` por `vecs` es la matriz identidad; compárala con `np.eye(3)` mediante `np.allclose`, que devuelve un solo `True` o `False`. (3) `C2`: encadena con `@` los autovectores, la matriz diagonal de autovalores (que se construye con `np.diag`, porque `vals` es solo un array de números, no una matriz) y la traspuesta de los autovectores. Error típico: olvidar la traspuesta del último factor, o multiplicar por `vals` en lugar de por la matriz diagonal.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'w = np.array([2, 5])',
                'D = np.diag(w)             # matriz de 2 por 2 con w en la diagonal y ceros fuera',
                'print(D[0, 0], D[0, 1], D[1, 1])   # 2 0 5',
                'print(np.eye(2)[1, 1])     # 1.0: np.eye(2) es la identidad de 2 por 2',
                '',
                'Q = np.array([[0, 1], [1, 0]])',
                'print(np.allclose(Q.T @ Q, np.eye(2)))   # True: la traspuesta por Q es la identidad',
                'print((Q @ D @ Q.T)[0, 0])   # 5: con @ se encadenan tres factores, de izquierda a derecha',
                'print(np.allclose(1.0, 1.0000001))   # True: casi iguales cuentan como iguales',
              ) +
              '\n\n`.T` es la traspuesta: cambia filas por columnas. `np.allclose(A, B)` compara dos arrays entrada a entrada y responde con un solo `True` o `False`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'vals, vecs = np.linalg.eigh(C)',
                'ortonormal = np.allclose(vecs.___ @ vecs, np.eye(___))',
                'C2 = vecs @ np.diag(___) @ vecs.___',
              ) +
              '\n\nEl último factor lleva lo mismo que el primer hueco de la segunda línea. Sin él, `C2` no sale igual a `C`.',
          ],
          explain:
            'Dos errores frecuentes: olvidar la traspuesta del último factor, que cambia el producto, y multiplicar por el array de autovalores en lugar de por la matriz diagonal: un array y una matriz no se combinan como dos matrices, y el resultado ya no tiene la forma de `C`.',
          solution:
            '`vals, vecs = np.linalg.eigh(C)` da los autovalores $1$, $4$ y $7$. `ortonormal = np.allclose(vecs.T @ vecs, np.eye(3))` vale `True`, y `C2 = vecs @ np.diag(vals) @ vecs.T` reconstruye `C` salvo redondeo. Sin la traspuesta, `vecs @ np.diag(vals) @ vecs` no es `C`; y `vecs @ vals @ vecs.T` no da una matriz de 3 por 3.',
          requirements: [
            '`vals` y `vecs` tienen que ser lo que devuelve la función de NumPy para matrices simétricas: 3 autovalores y una matriz de 3 filas y 3 columnas.',
            '`ortonormal` es un solo `True` o `False`.',
            '`C2` es un array de NumPy de 3 filas y 3 columnas que coincide con `C` salvo diferencias diminutas de redondeo.',
          ],
          starter: `import numpy as np

# C es simétrica: 3 filas y 3 columnas.
C = np.array([
    [5, -2, 0],
    [-2, 4, -2],
    [0, -2, 3],
])

# PASO 1. Los autovalores en vals y los autovectores en vecs.
# Por qué: con ellos se puede reconstruir la matriz, y eso comprueba que se han entendido.
# Herramienta: np.linalg.eigh(C) devuelve DOS cosas a la vez, un array con los autovalores y una
# matriz con los autovectores en las columnas. Se guardan de una vez con a, b = función(...).
# Esperado: vals con 3 números y vecs de 3 filas y 3 columnas.
vals = None
vecs = None

# PASO 2. Si las columnas de vecs son ortonormales, en ortonormal.
# Por qué: ortonormales quiere decir perpendiculares entre sí y de longitud 1. Entonces la
# traspuesta de vecs (.T, filas por columnas) multiplicada por vecs tiene en cada posición el
# producto escalar de dos columnas: 1 con ella misma y 0 con las otras. Es la matriz identidad.
# Herramienta: np.eye(n) es la identidad de n por n. np.allclose(A, B) compara dos arrays
# entrada a entrada, tolerando el redondeo, y devuelve un solo True o False. @ multiplica
# matrices. Esperado: un solo True o False.
ortonormal = None

# PASO 3. La matriz reconstruida con los autovectores, en C2.
# Por qué: la matriz es lo que hacen sus autovectores: gira a la base de autovectores, estira cada
# eje por su autovalor y gira de vuelta. Tiene que salir C.
# Herramienta: vals es un array con una fila de números, no una matriz; np.diag(v) construye la matriz con v
# en la diagonal y ceros fuera. Con @ se encadenan tres factores, de izquierda a derecha:
# los autovectores, la matriz diagonal de autovalores y la traspuesta de los autovectores.
# Esperado: un array de 3 filas y 3 columnas igual a C.
C2 = None

# Para ver qué vale algo antes de entregar: print(C2) y pulsa «Ejecutar».
`,
          checks: `def _arr(a, shape):
    return isinstance(a, np.ndarray) and a.shape == shape and a.dtype.kind in "iuf"
_C = np.array([[5.0, -2.0, 0.0], [-2.0, 4.0, -2.0], [0.0, -2.0, 3.0]])
_v = _arr(vals, (3,))
_V = _arr(vecs, (3, 3))
_vok = _v and np.allclose(np.sort(vals), [1, 4, 7])
_Vok = _vok and _V and np.allclose(_C @ vecs, vecs * vals)
_o = isinstance(ortonormal, (bool, np.bool_))
_c2 = isinstance(C2, np.ndarray) and C2.dtype.kind in "iuf"
_c2shape = _c2 and C2.shape == (3, 3)
_notrans = _Vok and _c2shape and np.allclose(C2, vecs @ np.diag(vals) @ vecs)
check(_v, "\`vals\` tiene que ser un array de NumPy con 3 números: los autovalores de \`C\`.")
check((not _v) or _vok, "\`vals\` no tiene los autovalores de \`C\`. Son los que devuelve \`np.linalg.eigh\`.")
check(_V, "\`vecs\` tiene que ser un array de NumPy de 3 filas y 3 columnas: la matriz de autovectores que devuelve \`np.linalg.eigh\`.")
check((not _V) or (not _vok) or _Vok, "\`vecs\` no es la matriz de autovectores de \`C\`: cada columna tiene que ser el autovector del autovalor que está en su misma posición de \`vals\`.")
check(_o, "\`ortonormal\` tiene que ser un solo \`True\` o \`False\`, no una matriz: la respuesta a si las columnas de \`vecs\` son ortonormales.")
check((not _o) or bool(ortonormal), "\`ortonormal\` vale \`False\`: las columnas de \`vecs\` son perpendiculares y de longitud 1, y entonces la traspuesta de \`vecs\` por \`vecs\` es la identidad, salvo el redondeo. Compara con \`np.allclose\`.")
check(_c2, "\`C2\` tiene que ser un array de NumPy: la matriz reconstruida con los autovectores.")
check((not _c2) or _c2shape, "\`C2\` tiene que ser una matriz de 3 filas y 3 columnas. Multiplicar por el array \`vals\` no es multiplicar por la matriz con los autovalores en la diagonal.")
check((not _c2shape) or not _notrans, "\`C2\` no coincide con \`C\`: falta la traspuesta de \`vecs\` en el último factor.")
check((not _c2shape) or _notrans or np.allclose(C2, _C), "\`C2\` tiene que coincidir con \`C\`: los autovectores, la matriz diagonal de autovalores y la traspuesta de los autovectores, en ese orden.")
`,
          reference: `import numpy as np

C = np.array([
    [5, -2, 0],
    [-2, 4, -2],
    [0, -2, 3],
])
vals, vecs = np.linalg.eigh(C)
ortonormal = np.allclose(vecs.T @ vecs, np.eye(3))
C2 = vecs @ np.diag(vals) @ vecs.T
`,
        },
        {
          id: 'simetricas.ex02.5',
          type: 'codigo',
          prompt:
            'Si `C` es la matriz de covarianza de unos datos y $\\vec{u}$ una dirección, la **varianza** de los datos en esa dirección es la varianza de las proyecciones de las muestras sobre ella, con las sumas divididas entre $n-1$; es el cociente $\\vec{u}^{T}C\\vec{u}\\,/\\,\\vec{u}^{T}\\vec{u}$, y no depende de la longitud de $\\vec{u}$. Escribe `varianza_en(X, u)`, que recibe `X` (una muestra por fila) y una dirección `u`, de la longitud que sea, y devuelve esa varianza. Después guarda en `mejor` la posición (contando desde 0) de la fila de `candidatas` con más varianza en `X`.',
          hints: [
            'El plan: dentro de `varianza_en`, (1) normaliza `u` dividiéndola entre su norma; (2) proyecta todas las muestras con `X @ u_unit`, que da un número por muestra; (3) devuelve la varianza de esas proyecciones, dividida entre $n-1$ (`np.var` con `ddof=1`; `np.var` ya resta la media por su cuenta). Fuera de la función, recorre las filas de `candidatas` con un bucle `for`, guarda la varianza de cada una en una lista, y `mejor` es la posición del mayor valor de la lista. Ojo: si no normalizas `u`, gana la candidata más larga solo por serlo.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'v = np.array([3, 4])',
                'print(np.linalg.norm(v))       # 5.0: la longitud de v',
                'print(v / np.linalg.norm(v))   # [0.6 0.8]: v con longitud 1',
                '',
                'tabla = np.array([[1, 2], [3, 0], [5, 4]])',
                'p = tabla @ np.array([1, 0])   # un producto escalar por fila',
                'print(p)                       # [1 3 5]',
                'print(np.var(p))               # 2.6666666666666665: divide entre n',
                'print(np.var(p, ddof=1))       # 4.0: divide entre n - 1',
                '',
                'varianzas = []                 # lista vacía',
                'for fila in tabla:             # una vuelta por fila',
                '    varianzas.append(int(fila[0]))   # añade un valor al final',
                'print(varianzas)               # [1, 3, 5]',
                'print(np.argmax(varianzas))    # 2: la posición del mayor',
              ) +
              '\n\nUna función se escribe con `def` y todo lo que va a su cargo lleva sangría (4 espacios). `ddof=1` quiere decir «un grado menos»: divide entre $n-1$.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def varianza_en(X, u):',
                '    u_unit = u / np.linalg.___(u)',
                '    proy = X @ ___',
                '    return np.var(proy, ddof=___)',
                '',
                'varianzas = []',
                'for c in candidatas:',
                '    varianzas.append(varianza_en(X, ___))',
                'mejor = np.___(varianzas)',
              ) +
              '\n\nSe proyecta sobre la versión de longitud 1 de `u`, no sobre `u`. Y para quedarte con la posición del mayor valor, no con el valor, usa la función de NumPy que devuelve la posición.',
          ],
          explain:
            'La varianza en una dirección es una propiedad de la dirección, no del vector que la representa: si $\\vec{u}$ se alarga, la varianza no puede crecer. Los fallos habituales son no normalizar `u`, dividir entre $n$, y proyectar sin quitar la media de los datos.',
          solution:
            'Se normaliza `u`, se proyecta `X` sobre ella y se calcula la varianza con `ddof=1`. Para `X`, la matriz de covarianza es $\\begin{pmatrix}10&3{,}5\\\\3{,}5&3{,}5\\end{pmatrix}$ y las varianzas de las cuatro candidatas son $10$, $3{,}5$, $10{,}25$ y $3{,}25$: gana la de la posición 2, la de $(1, 1)$. Sin normalizar, ganaría la posición 1, la de $(0, 3)$, solo por ser la más larga. Con `np.var` sin `ddof=1` todas las varianzas salen más pequeñas.',
          requirements: [
            '`varianza_en` es una función que recibe un array de NumPy `X` con las muestras en las filas y un array `u` con una dirección, y devuelve un solo número: la varianza.',
            'Se llama a la función con otros datos además de `X`, de otras formas y con direcciones de longitudes distintas; no debe dar error ni cambiar los arrays que recibe.',
            'La varianza se calcula con el divisor $n-1$, y no cambia si se multiplica `u` por un número positivo.',
            '`mejor` es un número entero: la posición de la candidata con más varianza.',
          ],
          starter: `import numpy as np


def varianza_en(X, u):
    # Aquí escribes tú. Todo lo que va dentro de una función lleva sangría (4 espacios), y lo
    # que devuelve se pone tras return. X es un array con una muestra por fila; u es un array
    # con una dirección, de la longitud que sea.
    #
    # PASO 1. Quedarse solo con la dirección de u: dividirla entre su longitud. Guárdalo en una
    # variable, por ejemplo u_unit.
    # Por qué: la varianza es de una dirección, no del tamaño de la flecha. Si u se alarga, la
    # varianza no puede crecer, así que hay que dejarla con longitud 1.
    # Herramienta: np.linalg.norm(v) da la longitud de v (norm([3, 4]) vale 5.0). Un array dividido
    # entre un número divide todas sus entradas.
    #
    # PASO 2. Proyectar las muestras sobre esa dirección. Guárdalo en una variable, por ejemplo proy.
    # Por qué: la varianza en una dirección es la de las posiciones de las muestras a lo largo de
    # ella: un número por muestra.
    # Herramienta: X @ v hace el producto escalar de cada fila de X con v, y devuelve un array
    # con un número por fila.
    #
    # PASO 3. Devolver la varianza de las proyecciones.
    # Herramienta: np.var(p) calcula la varianza de un array, restándole antes su media. Por
    # defecto divide entre n (el número de datos), pero unas muestras se dividen entre n - 1: se
    # pide con el parámetro ddof=1. Se devuelve con return; esperado: un solo número.
    return None


X = np.array([
    [2, 1],
    [4, 3],
    [6, 2],
    [8, 6],
    [10, 3],
])
# Cuatro direcciones candidatas, una por fila (cada una con una longitud distinta).
candidatas = np.array([
    [1, 0],
    [0, 3],
    [1, 1],
    [1, -1],
])
# PASO 4. La posición (contando desde 0) de la candidata con más varianza, en mejor.
# Por qué: es la dirección en la que los datos más se extienden.
# Herramienta: empieza con varianzas = [], recorre las filas con for c in candidatas: (c es
# una fila en cada vuelta, con sangría el cuerpo) y añade cada varianza con
# varianzas.append(...), usando tu función. Después np.argmax(lista) da la POSICIÓN del valor
# mayor (np.argmax([4, 9, 2]) vale 1), que es lo que se guarda, no la varianza.
# Esperado: un número entero.
mejor = None

# Para ver qué vale algo antes de entregar: print(varianza_en(X, candidatas[0])) y pulsa «Ejecutar».
`,
          checks: `_f = callable(globals().get("varianza_en"))
def _call(X, u):
    try:
        return varianza_en(np.array(X, dtype=float), np.array(u, dtype=float))
    except Exception:
        return None
_n = lambda x: isinstance(x, (int, float, np.integer, np.floating)) and not isinstance(x, (bool, np.bool_))
_X1 = [[1, 2], [3, 1], [2, 5], [6, 4]]
_X2 = [[2, 0, 1], [4, 3, 1], [3, 9, 5], [8, 6, 2], [1, 1, 7]]
_cases = [(_X1, [3, 4]), (_X2, [1, 2, 2]), (_X1, [0, 1])]
def _right(X, u):
    X = np.array(X, dtype=float)
    u = np.array(u, dtype=float)
    Xc = X - X.mean(axis=0)
    return float(u @ (Xc.T @ Xc / (len(X) - 1)) @ u / (u @ u))
_want = [_right(X, u) for X, u in _cases]
_long = [_right(X, u) * float(np.array(u, dtype=float) @ np.array(u, dtype=float)) for X, u in _cases]
_divn = [_right(X, u) * (len(X) - 1) / len(X) for X, u in _cases]
_raw = [float((np.array(X, dtype=float) @ (np.array(u, dtype=float))) @ (np.array(X, dtype=float) @ (np.array(u, dtype=float))) / (len(X) - 1) / (np.array(u, dtype=float) @ np.array(u, dtype=float))) for X, u in _cases]
_r = [_call(X, u) for X, u in _cases] if _f else []
_all = _f and all(_n(x) for x in _r)
def _is(refs):
    return _all and all(np.isclose(a, b) for a, b in zip(_r, refs))
_good = _is(_want)
_m = isinstance(mejor, (int, np.integer)) and not isinstance(mejor, (bool, np.bool_))
check(_f, "Hay que definir una función \`varianza_en\` que reciba los datos y la dirección.")
check((not _f) or _all, "\`varianza_en\` tiene que devolver un solo número: la varianza de los datos en esa dirección.")
check((not _all) or not _is(_long), "\`varianza_en\` crece al alargar \`u\`: no normaliza la dirección. La varianza es la de las proyecciones sobre una dirección de longitud 1.")
check((not _all) or not _is(_divn), "\`varianza_en\` divide entre el número de muestras n. Para la varianza de unos datos que son una muestra hay que dividir entre n menos 1; con \`np.var\` se pide con \`ddof=1\`.")
check((not _all) or not _is(_raw), "\`varianza_en\` proyecta los datos sin quitarles antes la media: la varianza mide cuánto se separan los datos de su media, y no dónde están.")
check((not _all) or _good or _is(_long) or _is(_divn) or _is(_raw), "\`varianza_en\` tiene que dar la varianza, dividida entre n menos 1, de las proyecciones de las muestras sobre la dirección de \`u\`, sea cual sea la longitud de \`u\`.")
check(_m, "\`mejor\` tiene que ser un número entero: la posición de la candidata con más varianza.")
check((not _m) or mejor != 1, "\`mejor\` señala la candidata más larga. Una dirección no gana por ser más larga: la varianza no depende de la longitud de \`u\`.")
check((not _m) or mejor == 1 or mejor == 2, "\`mejor\` tiene que ser la posición, contando desde 0, de la candidata con más varianza en \`X\`.")
`,
          reference: `import numpy as np


def varianza_en(X, u):
    u = u / np.linalg.norm(u)
    return np.var(X @ u, ddof=1)


X = np.array([
    [2, 1],
    [4, 3],
    [6, 2],
    [8, 6],
    [10, 3],
])
candidatas = np.array([
    [1, 0],
    [0, 3],
    [1, 1],
    [1, -1],
])
mejor = int(np.argmax([varianza_en(X, u) for u in candidatas]))
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'simetricas.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Se quiere la matriz de covarianza de dos variables, de 100 muestras cada una, guardadas en `X` con una muestra por fila. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Piensa en la forma que debería tener la matriz de covarianza de dos variables, y en qué toma `np.cov` por defecto como una variable.',
        'Si `C` tiene una fila por cada muestra, ¿qué mide `C[0, 1]`?',
      ],
      explain:
        'La covarianza de dos variables cabe en una matriz de dos filas y dos columnas. Revisa qué forma saldría con el código tal como está y qué cuenta cada entrada.',
      solution:
        'La segunda línea está mal. `np.cov(X)` toma cada fila como una variable, y `X` tiene 100 filas, así que `C` sale de 100 por 100. La tercera arrastra el error: imprime la covarianza entre dos muestras, no entre las dos variables. Hay que usar `np.cov(X, rowvar=False)` o `np.cov(X.T)`, que dan una matriz de 2 por 2.',
      lines: [
        'X = np.random.default_rng(0).normal(size=(100, 2))',
        'C = np.cov(X)',
        'print(C[0, 1])',
      ],
      faultyLine: 1,
    },
    {
      id: 'simetricas.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula los autovalores y los autovectores de una matriz simétrica. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Los autovalores se pueden comprobar con la suma de la diagonal y el determinante. Después comprueba cada autovector multiplicándolo por la matriz.',
        'Piensa qué forman entre sí los autovectores de una matriz simétrica con autovalores distintos.',
      ],
      explain:
        'Cada línea afirma algo que se puede comprobar: unas con la suma de la diagonal y el determinante, y otras multiplicando la matriz por el vector. Una línea puede contradecir lo que se dice en otra.',
      solution:
        'La tercera línea está mal. $A(1, 2)=(2+2,\\ 1+4)=(4, 5)$, que no es un múltiplo de $(1, 2)$: no es un autovector. Además $(1, 2)$ no es perpendicular a $(1, 1)$, porque su producto escalar es $3$. El autovector de $\\lambda=1$ es $(1, -1)$, con $A(1, -1)=(1, -1)$. La cuarta línea arrastra el error.',
      lines: [
        'A = (2 1; 1 2) es simétrica: sus autovalores son reales y sus autovectores, perpendiculares',
        'Sus autovalores son 3 y 1, porque la suma de la diagonal es 4 y el determinante es 3',
        'Sus autovectores son (1, 1) para λ = 3 y (1, 2) para λ = 1',
        'Luego esos dos autovectores forman una base de ejes perpendiculares',
      ],
      faultyLine: 2,
    },
    {
      id: 'simetricas.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento lee una matriz de covarianza de dos variables, $x$ e $y$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'En una matriz de covarianza, la diagonal tiene las varianzas y las entradas de fuera, la covarianza.',
        'El signo de la covarianza dice si las dos variables suben a la vez o una sube cuando la otra baja.',
      ],
      explain:
        'Revisa cada afirmación con lo que mide cada entrada de la matriz: las varianzas dicen cuánto se dispersa cada variable, la covarianza dice cómo se mueven juntas, y la simetría tiene su motivo.',
      solution:
        'No hay ningún error. La diagonal da las varianzas, $4$ para $x$ y $9$ para $y$, así que $y$ se dispersa más. La covarianza es $-3$: negativa, luego cuando $x$ sube, $y$ tiende a bajar. Y la matriz es simétrica porque la covarianza de $x$ con $y$ es la de $y$ con $x$, y eso pasa con toda matriz de covarianza.',
      lines: [
        'C = (4 −3; −3 9) es la matriz de covarianza de dos variables, x e y',
        'La diagonal da las varianzas: x vale 4 e y vale 9, luego y se dispersa más que x',
        'La covarianza es −3, negativa: cuando x sube, y tiende a bajar',
        'C es simétrica, como toda matriz de covarianza, porque la covarianza de x con y es la de y con x',
      ],
      faultyLine: null,
    },
  ],
};
