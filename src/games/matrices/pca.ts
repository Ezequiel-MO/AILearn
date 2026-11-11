import type { Project } from '../../content/schema';
import { py } from '../py';
import { pcaWarmup } from './pca.calentamiento';
import {
  NUBE_ALARGADA,
  NUBE_CLASES_CRUZADAS,
  NUBE_CON_ATIPICO,
  NUBE_SIN_ATIPICO,
  capaLab,
} from './datos';

/** La recta de v sobre la nube de entrada, que el jugador gira, sin capa que mover. */
const recta = (x: number, y: number, movable = true) =>
  ({ movable: 'none', probe: { x, y, movable, on: 'input' } }) as const;

/** Lo que mide casi toda meta de este proyecto: la parte de la varianza que guarda una coordenada. */
const CONSERVA = {
  metric: 'var_frac',
  label: 'Parte de la varianza que conserva la coordenada',
  format: 'percent',
} as const;

/**
 * Tercer proyecto de la Órbita 2 de matrices: PCA como quedarse con una sola coordenada de cada dato,
 * eligiendo la dirección que menos pierde, y sus dos trampas: no sabe de etiquetas y un dato atípico
 * secuestra la primera componente. Al final, PCA como la capa que gira la nube.
 */
export const pca: Project = {
  id: 'pca',
  name: 'PCA',
  sub: 'Ver en dos dimensiones',
  bigPicture: {
    parts: ['inspect', 'embedding'],
    text: 'Para mirar embeddings de cientos de dimensiones, el PCA los proyecta sobre las dos direcciones en las que más varían, y en el dibujo se ve qué se agrupa con qué. Es una forma habitual de explorar lo que aprende una red. Aquí lo haces con pocos puntos, para entender qué conserva el dibujo y qué se pierde.',
  },
  warmup: pcaWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'pca.ex00.1',
          type: 'laboratorio',
          purpose: {
            why: 'Para dibujar embeddings de cientos de números en una pantalla, o para guardarlos más pequeños, uno se queda con pocas coordenadas por dato. Cada coordenada es la sombra del dato sobre una recta, y lo que no cae en la sombra se pierde.',
            aim: 'Vas a girar la recta de $v$ hasta que, guardando una sola coordenada por palabra, se pierda lo menos posible de la nube.',
            takeaway:
              'Lo que pierde cada palabra es su distancia a la recta: la línea fina que la une a su sombra. La recta que las deja más cortas sigue el eje largo de la nube, y es la primera componente principal. Elegirla es lo primero que hace PCA.',
          },
          prompt:
            'Siete palabras de tres temas, con dos coordenadas cada una. Quieres guardar **una sola**: la sombra de cada palabra sobre la recta de $v$, unida a ella por una línea fina. Lo que esa sombra no recoge se pierde. Ahora la recta va en vertical y se pierde casi todo.\n\nGira $v$ hasta que se pierda muy poco.',
          hints: [
            'Mira las líneas finas: cada una es lo que pierde una palabra. Con la recta en vertical son largas, porque la nube se extiende de izquierda a derecha.',
            'Tumba $v$ hacia la derecha, sin llegar a la horizontal, hasta que la recta pase a lo largo de la nube, de «perro» a «coche».',
          ],
          explain:
            'La varianza de la nube se reparte entre la recta y su perpendicular: lo que se conserva más lo que se pierde da siempre el total. Por eso buscar la recta que menos pierde es lo mismo que buscar la que más conserva.',
          solution:
            'Vale $v$ en $(2, 1)$, o en $(4, 2)$ o $(-2, -1)$, que dan la misma recta: se pierde $0{,}17$ de una varianza total de $5{,}14$. También valen rectas cercanas, como la de $(2{,}5;\\ 1{,}5)$ o la de $(3{,}5;\\ 2)$. La diagonal, $(1, 1)$, a ojo, pierde $0{,}64$, y la horizontal, $1{,}14$.',
          lab: capaLab(NUBE_ALARGADA, { ...recta(0, 2), readouts: ['var_v'] }),
          goals: [
            {
              metric: 'lost',
              op: 'lte',
              target: 0.25,
              label: 'Varianza que se pierde al guardar una coordenada',
            },
          ],
          solved: { vx: 2, vy: 1 },
        },
        {
          id: 'pca.ex00.2',
          type: 'laboratorio',
          purpose: {
            why: 'Que una sola coordenada baste depende de la forma de los datos. Si la nube es casi redonda, cualquier recta deja fuera mucho, y PCA lo avisa: la parte de la varianza que conserva la primera componente dice si hacen falta más.',
            aim: 'Vas a buscar cuánto, como mucho, puede conservar una sola coordenada de una nube de frutas que no forma una línea.',
            takeaway:
              'Ninguna recta pasa del $78\\,\\%$: es el máximo, y lo da la horizontal. El $22\\,\\%$ restante está en la otra dirección y una sola coordenada no lo puede guardar. Por eso PCA se queda con varias componentes cuando la primera no basta.',
          },
          prompt:
            'Seis frutas, apiñadas sin formar una línea. Vuelves a guardar una sola coordenada de cada una: su sombra sobre la recta de $v$. El medidor dice qué parte de la varianza de la nube conserva esa sombra.\n\nNo hay recta que lo conserve todo. Busca la que conserva más: la meta pide ese máximo.',
          hints: [
            'Mira hacia dónde se extienden más las frutas: de «manzana» a «melón» hay más distancia que de «uva» a «pera».',
            'Gira $v$ poco a poco y mira el medidor: sube al acercarte a la horizontal y baja al pasarla.',
          ],
          explain:
            'La parte que conserva una recta es su varianza entre la varianza total. Es máxima sobre la primera componente principal, y aquí ese máximo es bajo porque la nube es ancha en las dos direcciones.',
          solution:
            'El máximo, $77{,}9\\,\\%$, está en la horizontal: $v$ en $(1, 0)$, $(2, 0)$ o $(-1{,}5;\\ 0)$, que dan la misma recta. Basta inclinarla un poco, a $(2;\\ 0{,}5)$, para bajar al $74{,}6\\,\\%$. La diagonal conserva solo el $50\\,\\%$, y la vertical, el $22\\,\\%$.',
          lab: capaLab(NUBE_SIN_ATIPICO, { ...recta(0, 1.5), range: 2 }),
          goals: [{ ...CONSERVA, op: 'gte', target: 0.77 }],
          solved: { vx: 2, vy: 0 },
        },
        {
          id: 'pca.ex00.3',
          type: 'laboratorio',
          purpose: {
            why: 'Es habitual reducir los datos con PCA antes de entrenar un clasificador. PCA elige las direcciones sin mirar las etiquetas: si lo que distingue las clases varía poco, puede ser lo primero que tira.',
            aim: 'Vas a buscar una coordenada que deje separar las reseñas positivas de las negativas, y a ver cuánta varianza conserva.',
            takeaway:
              'La coordenada que separa las clases conserva menos del $15\\,\\%$ de la varianza, y la de PCA, el $90\\,\\%$ sin separar nada. Ninguna recta da las dos cosas. PCA no sabe de etiquetas: antes de clasificar, comprueba que no ha tirado lo que importa.',
          },
          prompt:
            'Ocho reseñas de comida y de tecnología, positivas y negativas. La recta de $v$ empieza en la dirección de PCA, la que más conserva, y una regla que solo mire esa coordenada confunde la mitad.\n\nGira $v$ hasta que, mirando solo su coordenada, se separen todas las positivas de las negativas.',
          hints: [
            'Mira las sombras sobre la recta: positivas y negativas se alternan. Lo que más varía aquí es el tema, comida abajo y tecnología arriba, no la opinión.',
            'Lleva $v$ a la perpendicular de la nube: hacia arriba a la izquierda, cruzándola a lo ancho.',
          ],
          explain:
            'PCA ordena las direcciones por varianza, y la varianza no sabe de grupos. Aquí la opinión mueve las palabras poco, en perpendicular al tema: esa dirección conserva poca varianza y es la que separa.',
          solution:
            'Vale $v$ en $(-1, 1)$: las positivas quedan a un lado y las negativas al otro, con el $9{,}8\\,\\%$ de la varianza. También valen $(-2;\\ 1{,}5)$ o $(-3;\\ 2{,}5)$. En la dirección de PCA, $(1, 1)$, se conserva el $90\\,\\%$ y la regla acierta la mitad.',
          lab: capaLab(NUBE_CLASES_CRUZADAS, recta(2, 2)),
          goals: [
            {
              metric: 'acc_v',
              op: 'gte',
              target: 1,
              label: 'Aciertos mirando solo la coordenada',
              format: 'percent',
            },
            { ...CONSERVA, op: 'lte', target: 0.5 },
          ],
          solved: { vx: -1, vy: 1 },
        },
        {
          id: 'pca.ex00.4',
          type: 'laboratorio',
          purpose: {
            why: 'Entre miles de embeddings siempre se cuela alguno roto: un texto basura, un error de codificación. Como la varianza eleva al cuadrado las distancias, un solo dato muy lejos puede pesar más que todos los demás juntos.',
            aim: 'Vas a buscar la coordenada que más conserva de las seis frutas cuando entre ellas se ha colado un texto basura, lejos de todas.',
            takeaway:
              'La primera componente pasa a apuntar a «asdf»: conserva más del $90\\,\\%$ y no dice nada de las frutas, que caen casi en el mismo sitio. Un dato atípico secuestra PCA. Por eso se limpian los datos raros antes de ajustarlo.',
          },
          prompt:
            'Las seis frutas y un texto basura, «asdf», lejos de ellas. La recta de $v$ empieza en la horizontal, la que mejor resume las frutas solas: ahora conserva poco más de la mitad de la varianza.\n\nGira $v$ hasta que su coordenada conserve casi toda la varianza, y mira hacia dónde apunta.',
          hints: [
            'La varianza mide distancias al cuadrado: «asdf» está tan lejos que su sombra pesa más que las de todas las frutas.',
            'Lleva $v$ hacia «asdf», arriba a la derecha, y mira dónde caen entonces las sombras de las frutas.',
          ],
          explain:
            'Cada dato aporta a la varianza su distancia al centro al cuadrado. «asdf» está a más de tres unidades del centro; las frutas, a menos de dos. La recta que más conserva es la que recoge a «asdf».',
          solution:
            'Vale $v$ en $(3;\\ 2{,}5)$, hacia «asdf», que conserva el $91{,}6\\,\\%$, o en $(1, 1)$ o $(2;\\ 1{,}5)$. La horizontal, la mejor para las frutas solas, baja al $56\\,\\%$. Sobre la nueva recta, las seis frutas caen apiñadas y «asdf», lejos: la coordenada solo dice «raro o no».',
          lab: capaLab(NUBE_CON_ATIPICO, recta(2, 0)),
          goals: [{ ...CONSERVA, op: 'gte', target: 0.9 }],
          solved: { vx: 3, vy: 2.5 },
        },
        {
          id: 'pca.ex00.5',
          type: 'laboratorio',
          purpose: {
            why: 'PCA es también una capa lineal: gira los datos para que la primera salida sea la primera componente y la segunda, la siguiente, sin relación entre ellas. Quedarse con $k$ componentes es quedarse con las primeras $k$ salidas.',
            aim: 'Vas a construir la capa que hace PCA con la nube alargada: que casi toda la variación salga por la primera salida y que las dos salidas no tengan relación.',
            takeaway:
              'La capa cuyas filas siguen los ejes de la nube la deja tumbada: la primera salida lleva casi todo, la segunda casi nada, y su covarianza es cero. Tirar la segunda salida es reducir a una coordenada. Aplicar PCA a un dato nuevo es esa multiplicación.',
          },
          prompt:
            'La nube alargada pasa por una capa cuyas columnas puedes mover. Ahora es la identidad: las dos salidas suben a la vez, porque la nube va en diagonal, y la variación se reparte entre ellas.\n\nCambia la capa para que casi toda la variación salga por la primera salida, la segunda varíe muy poco y las dos queden sin relación.',
          hints: [
            'La nube va en diagonal: por eso, cuando sube la salida 1, sube la 2. Hay que tumbarla sobre el eje horizontal.',
            'La salida 1 tiene que leer la dirección larga de la nube y la 2, la corta. Baja $\\hat{\\imath}$ un poco por debajo del eje y lleva $\\hat{\\jmath}$ hacia arriba, inclinada a la derecha.',
          ],
          explain:
            'La salida 1 es la fila 1 de la capa por la palabra: si esa fila apunta a lo largo de la nube, recoge su dirección larga. Si la fila 2 es perpendicular a ella, recoge la corta, y la covarianza entre las dos salidas se anula.',
          solution:
            'Vale $\\hat{\\imath}$ en $(1;\\ -0{,}5)$ y $\\hat{\\jmath}$ en $(0{,}5;\\ 1)$: filas $(1;\\ 0{,}5)$ y $(-0{,}5;\\ 1)$, perpendiculares. La salida 1 varía $6{,}21$, la 2 solo $0{,}21$ y la covarianza es $0{,}02$. Con $\\hat{\\imath}$ en $(1, 0)$ y $\\hat{\\jmath}$ en $(0{,}5;\\ 0)$ la segunda salida se anula: es quedarse con una componente, y también vale. Un giro de 45° a ojo deja covarianza $-2{,}86$.',
          lab: capaLab(NUBE_ALARGADA),
          goals: [
            { metric: 'spread_x', op: 'gte', target: 5, label: 'Varianza de la primera salida' },
            { metric: 'spread_y', op: 'lte', target: 0.25, label: 'Varianza de la segunda salida' },
            {
              metric: 'cov_xy',
              op: 'eq',
              target: 0,
              tol: 0.05,
              label: 'Covarianza entre las dos salidas',
            },
          ],
          solved: { ix: 1, iy: -0.5, jx: 0.5, jy: 1 },
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'pca.ex01.1',
          type: 'numero',
          purpose: {
            why: 'Todo informe de PCA da la parte de la varianza que explica cada componente; en scikit-learn, `explained_variance_ratio_`. Dice si un mapa de pocas coordenadas es fiel a los datos o engaña.',
            aim: 'Vas a buscar en el laboratorio la recta que más conserva de la nube alargada y a calcular, con lo que conserva y lo que pierde, qué parte del total es.',
            takeaway:
              'La primera componente explica el $96{,}7\\,\\%$: la nube es casi una línea y una coordenada la resume bien. Lo conservado y lo perdido suman el total, así que el porcentaje es lo conservado entre esa suma.',
          },
          prompt:
            'En el laboratorio, la nube alargada y la recta de $v$, que puedes girar. El panel da la varianza que conserva la sombra sobre la recta y la que se pierde.\n\nPon $v$ en la recta que más conserva. ¿Qué **porcentaje** de la varianza total explica esa primera componente? Escribe el número con un decimal, sin el símbolo %.',
          hints: [
            'Gira $v$ hasta que la varianza sobre la recta sea la mayor posible: es la del eje largo de la nube.',
            'La varianza total es la conservada más la perdida. Divide la conservada entre esa suma y multiplica por $100$.',
          ],
          explain:
            'Cada componente explica su varianza entre la varianza total. La total no depende de la recta: es lo conservado más lo perdido, en cualquier posición de $v$.',
          solution:
            'Sobre la recta de $(2, 1)$ se conservan $4{,}97$ y se pierden $0{,}17$, de un total de $5{,}14$: $\\frac{4{,}97}{5{,}14}\\approx 0{,}967$, el $96{,}7\\,\\%$. Si divides $4{,}97$ entre $0{,}17$ comparas las dos componentes entre sí, que es otra cosa.',
          lab: capaLab(NUBE_ALARGADA, { ...recta(0, 2), readouts: ['var_v', 'lost'] }),
          answer: 96.7,
          tol: 0.1,
        },
        {
          id: 'pca.ex01.2',
          type: 'numero',
          purpose: {
            why: 'Para reducir un dato nuevo con PCA se hace un producto escalar por componente: el dato centrado por un vector de norma $1$. Es lo que hace `transform` en scikit-learn, y el número que se guarda en lugar del dato.',
            aim: 'Vas a calcular la coordenada de «coche» en la primera componente de la nube alargada: el único número que se guarda de esa palabra.',
            takeaway:
              '«coche» queda en $3{,}13$, en un extremo de la recta, lejos de los animales, que caen en negativo. Con una coordenada, la palabra sigue en su sitio respecto a las demás, aunque se pierda su pequeño desvío fuera de la recta.',
          },
          prompt:
            'La primera componente de la nube alargada es la recta de $(2, 1)$; con norma $1$, $u\\approx(0{,}894;\\ 0{,}447)$. La nube está centrada, y «coche» es el dato $(3, 1)$.\n\n¿Cuál es su coordenada en esa componente? En el laboratorio ves su sombra sobre la recta.',
          hints: [
            'La coordenada sobre una dirección de norma $1$ es el producto escalar del dato con ella.',
            'Multiplica cada coordenada de «coche» por la de $u$ y suma.',
          ],
          explain:
            'La sombra de un dato sobre la recta de $u$ está, con signo, a una distancia del origen igual a $u\\cdot p$. Con $(2, 1)$ tal cual, sin dividir entre su norma, sale un número $\\sqrt{5}$ veces mayor.',
          solution:
            '$0{,}894\\cdot 3+0{,}447\\cdot 1\\approx 2{,}683+0{,}447=3{,}13$. Exacto: $\\frac{2\\cdot 3+1\\cdot 1}{\\sqrt{5}}=\\frac{7}{\\sqrt{5}}\\approx 3{,}13$. Con $(2, 1)$ sin normalizar saldría $7$.',
          lab: capaLab(NUBE_ALARGADA, recta(2, 1, false)),
          answer: 3.13,
          tol: 0.01,
        },
        {
          id: 'pca.ex01.3',
          type: 'numero',
          purpose: {
            why: 'PCA también sirve para vigilar: se ajusta con datos buenos y, a cada dato nuevo, se mide cuánto pierde al reducirlo. Un dato que pierde mucho no se parece a nada de lo visto: un aviso de dato raro o de texto basura.',
            aim: 'Vas a calcular cuánto pierde «asdf» al quedarse con su coordenada en la componente de las frutas: su distancia a la recta.',
            takeaway:
              '«asdf» pierde $3$, y ninguna fruta pierde más de $0{,}5$. Por eso el error de reconstrucción de PCA sirve para detectar datos raros: lo que no cabe en las componentes de los datos normales salta a la vista.',
          },
          prompt:
            'PCA se ajustó con las seis frutas, y su primera componente es la recta horizontal. Llega «asdf», el dato $(3, 3)$. Al guardar solo su coordenada en esa componente, lo que se pierde es su distancia a la recta.\n\n¿Cuánto vale esa distancia? En el laboratorio, la línea fina de cada dato hasta su sombra es lo que pierde.',
          hints: [
            'La sombra de «asdf» sobre la recta horizontal es el punto de la recta justo debajo de él.',
            'La distancia de un punto a la recta horizontal que pasa por el origen es su altura, en valor absoluto.',
          ],
          explain:
            'Lo que se pierde al reducir es la parte del dato perpendicular a la componente. Con la componente horizontal, esa parte es la segunda coordenada; en las frutas nunca pasa de $0{,}5$.',
          solution:
            'La sombra de $(3, 3)$ es $(3, 0)$: se pierde la distancia entre los dos, $3$. Es seis veces lo que pierde la fruta que más pierde. Si respondes $3\\sqrt{2}\\approx 4{,}24$, has medido la distancia al origen, no a la recta.',
          lab: capaLab(NUBE_CON_ATIPICO, recta(2, 0, false)),
          answer: 3,
          tol: 0,
        },
        {
          id: 'pca.ex01.4',
          type: 'numero',
          purpose: {
            why: 'Al comprimir con PCA, quien diseña el sistema decide cuántas componentes guarda. Una regla común: las primeras, hasta explicar una parte fijada de la varianza, por ejemplo el $90\\,\\%$. Cada componente de más es memoria y cálculo.',
            aim: 'Vas a acumular la varianza explicada por las componentes, de la primera en adelante, hasta llegar al $90\\,\\%$.',
            takeaway:
              'Con cinco componentes se llega al $95\\,\\%$; con cuatro, solo al $88\\,\\%$. La sexta no hace falta. El umbral es una decisión: se prueba el modelo que viene detrás con distintos números de componentes.',
          },
          prompt:
            'Un PCA sobre unos datos de seis rasgos da estas partes de la varianza, de la primera componente a la última: $40\\,\\%$, $25\\,\\%$, $15\\,\\%$, $8\\,\\%$, $7\\,\\%$ y $5\\,\\%$.\n\n¿Cuántas componentes hay que guardar, como mínimo, para conservar al menos el $90\\,\\%$ de la varianza?',
          hints: [
            'Suma las partes empezando por la primera y para en cuanto llegues al $90\\,\\%$.',
            'Cuenta cuántas has sumado, no la posición de la última empezando en $0$.',
          ],
          explain:
            'Las componentes salen ordenadas de más a menos varianza, así que las primeras son las que más conservan. Se acumula hasta el umbral y se cuentan las que hacen falta.',
          solution:
            'Acumulados: $40$, $65$, $80$, $88$ y $95\\,\\%$. Con cuatro no se llega al $90\\,\\%$; con cinco, sí: hacen falta $5$. Se tira solo la última, que explica el $5\\,\\%$.',
          answer: 5,
          tol: 0,
        },
        {
          id: 'pca.ex01.5',
          type: 'opcion',
          purpose: {
            why: 'Los mapas de embeddings en dos dimensiones, de palabras o de documentos de una base de consulta, se usan para explorar grupos y detectar rarezas. Pero un mapa es una sombra: tira la varianza de casi todas las direcciones, y dos puntos que se tocan en la sombra pueden estar lejos en el espacio real.',
            aim: 'Vas a decidir qué se puede afirmar de dos palabras juntas en un mapa de dos componentes. Verás si la cercanía en el dibujo basta para hablar de parecido.',
            takeaway:
              'La cercanía en un mapa de PCA es una pista, no una prueba. Para saber si dos embeddings se parecen, se calcula el coseno en el espacio original, con todas sus componentes. El mapa sirve para explorar y dar ideas; la decisión se toma con los vectores completos.',
          },
          prompt:
            'Se dibujan en un plano embeddings de 384 dimensiones con PCA, quedándose con las dos primeras componentes. En ese mapa, dos palabras quedan muy juntas. ¿Qué se puede concluir con seguridad?',
          hints: [
            'El mapa solo guarda la parte de la varianza que explican dos componentes. ¿Qué pasa con la del resto?',
            'Dos puntos pueden coincidir en dos direcciones y estar muy separados en las otras 382.',
          ],
          explain:
            'Proyectar a dos componentes tira la varianza de todas las demás direcciones, y esa parte puede ser la mayoría. Dos puntos cercanos en el mapa solo son cercanos en esas dos direcciones.',
          solution:
            'No se puede concluir nada seguro sobre su parecido real. Si las dos primeras componentes explican, por ejemplo, un cuarto de la varianza, las otras 382 direcciones guardan el resto, y en ellas las dos palabras pueden diferir mucho. PCA no conserva todas las distancias. Un mapa en dos dimensiones sirve para explorar, no para demostrar.',
          options: [
            'Que sus embeddings son casi iguales en las 384 dimensiones',
            'Que PCA conserva todas las distancias, así que también están cerca en el espacio original',
            'Nada seguro: el mapa descarta la varianza de las otras direcciones, y en ellas pueden diferir mucho',
            'Que son la misma palabra o sinónimos seguros',
          ],
          correct: 2,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'pca.ex02.1',
          type: 'codigo',
          prompt:
            '`X` guarda seis datos con dos variables cada uno (seis filas y dos columnas), **sin centrar**. El PCA sigue una cadena de pasos, y cada uno usa el anterior. Guarda en `media` la media de cada variable; en `Xc`, los datos con la media restada; en `C`, la matriz de covarianza de las dos variables (de 2 filas y 2 columnas, con la división entre $n-1$); en `pc1`, la **primera componente principal**: el autovector de norma 1 de `C` con el autovalor mayor; y en `z`, la coordenada de cada dato centrado en esa componente, un número por dato.\n\n`np.linalg.eigh(C)` devuelve los autovalores y los autovectores de una matriz simétrica como `C`; el código de partida explica en qué orden y con qué forma los da. El signo de `pc1` es arbitrario: si cambia, cambia el de `z`, y las dos soluciones valen.',
          hints: [
            'El plan son cinco líneas, y cada una usa la anterior. `media`: la media de cada columna de `X`. `Xc`: `X` menos `media`. `C`: la covarianza de `Xc`; ojo, `np.cov` espera una variable por fila y `Xc` tiene una por columna, así que hay que darle la traspuesta (`.T`): con `np.cov(Xc)` sale de 6 por 6 en vez de 2 por 2. Con `np.linalg.eigh(C)` sacas los autovalores y los autovectores: recógelos en `vals, vecs`. `pc1` es una **columna** de `vecs` (los autovectores van en columnas, no en filas): la del autovalor mayor, y `eigh` ordena los autovalores de menor a mayor. Por último `z`: los datos centrados por `pc1`.',
            'Las piezas, con otros datos (tres puntos en vez de seis):\n\n' +
              py(
                'datos = np.array([[1, 2], [3, 6], [5, 4]])',
                'm = datos.mean(axis=0)',
                'print(m)                   # [3. 4.]: una media por columna',
                'c = datos - m',
                'print(c[0])                # [-2. -2.]: a cada dato se le resta la media de su columna',
                'cov = np.cov(c.T)',
                'print(cov.shape)           # (2, 2): con la traspuesta, una variable por fila',
                'vals, vecs = np.linalg.eigh(cov)',
                'print(vals)                # [2. 6.]: los autovalores, de menor a mayor',
                'u = vecs[:, 0]             # la columna 0 de vecs (-1 sería la última)',
                'print(u.shape)             # (2,): un autovector, con 2 números',
                'print((c @ u).shape)       # (3,): una coordenada por dato',
              ) +
              '\n\nCada autovalor va con la columna de `vecs` que ocupa su misma posición. El signo de la columna es arbitrario: si sale al revés, `z` sale al revés y vale igual.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'media = X.mean(axis=___)',
                'Xc = X ___ media',
                'C = np.cov(___)',
                'vals, vecs = np.linalg.eigh(C)',
                'pc1 = vecs[:, ___]',
                'z = ___ @ pc1',
              ) +
              '\n\nEl error típico es coger `vecs[:, 0]`: es la dirección de **menor** varianza. La de mayor es la última columna.',
          ],
          explain:
            'Cada paso usa el anterior. Sin centrar, la componente apunta al promedio de los datos y no a su dirección de mayor variación. Revisa también qué devuelve `eigh`: en qué orden salen los autovalores y dónde están los autovectores. Comprueba que `pc1` mide 1 y que `C` solo la estira.',
          solution:
            'Las medias son $(5{,}67;\\ 4{,}83)$ y `Xc` resta esa pareja a cada dato. `np.cov(Xc.T)` da `C`, con autovalores $1{,}40$ y $14{,}63$; la primera componente es $\\pm(0{,}76;\\ 0{,}65)$ y se saca de la última **columna** de `vecs`. Con el signo que devuelve `eigh`, el primer valor de `z` vale $3{,}98$ en valor absoluto. Errores típicos: no centrar, de modo que `z` sale desplazada; `np.cov(X)` sin trasponer, que da una matriz de $6\\times 6$ y no de $2\\times 2$; coger `vecs[:, 0]`, la dirección de menor varianza; o leer una fila de `vecs` en vez de una columna (en una matriz de $2\\times 2$ como esta puede coincidir por casualidad, pero en general una fila no es un autovector).',
          requirements: [
            '`media` es un array de NumPy con 2 números: la media de cada una de las dos variables, no la de cada dato.',
            '`Xc` es un array de 6 filas y 2 columnas: los datos de `X` con la media de su variable restada.',
            '`C` es un array de 2 filas y 2 columnas: la covarianza de las dos variables, dividida entre $n-1$.',
            '`pc1` es un array de 2 números y norma 1: la dirección de mayor varianza. Se acepta cualquiera de sus dos signos.',
            '`z` es un array de 6 números: la coordenada de cada dato centrado en `pc1`. Si `pc1` cambia de signo, `z` cambia con él. Se acepta una diferencia diminuta de redondeo.',
          ],
          starter: `import numpy as np

X = np.array([[2, 3], [3, 1], [5, 6], [6, 4], [8, 8], [10, 7]])
# X: un array de NumPy de 6 filas y 2 columnas. Cada fila es un dato (X[0] es el primero, [2 3])
# y cada columna es una variable (X[:, 0] son los seis valores de la primera variable).

# PASO 1. media: la media de cada variable, o sea, de cada columna.
# Por qué: el PCA mira cómo se reparten los datos alrededor de su centro, y para
# eso primero hay que saber dónde está.
# X.mean(axis=0) promedia hacia abajo, a lo largo de las filas, y da una media por
# columna. Por ejemplo, con np.array([[1, 10], [3, 20]]) da 2 y 15.
# Resultado esperado: un array con 2 números.
media = None

# PASO 2. Xc: los datos centrados, o sea, X menos la media.
# Por qué: al restar la media, el centro de los datos pasa al origen, y las
# direcciones de variación se miden desde ahí. Sin esto la primera componente
# apuntaría hacia el promedio de los datos y no hacia donde más se reparten.
# Restar a un array de 6 filas y 2 columnas otro de 2 números resta ese par a cada fila:
# NumPy lo repite solo.
# Resultado esperado: un array de 6 filas y 2 columnas.
Xc = None

# PASO 3. C: la matriz de covarianza de las dos variables.
# Por qué: C guarda cuánto varía cada variable (en la diagonal) y cuánto varían
# juntas (fuera de ella). Sus autovectores serán las direcciones que buscamos.
# np.cov(M) divide entre n - 1 por su cuenta, pero espera UNA VARIABLE POR FILA, y
# Xc tiene una por columna. M.T (la traspuesta) cambia filas por columnas: de 6 por 2 a 2 por 6.
# Resultado esperado: un array de 2 filas y 2 columnas.
C = None

# PASO 4. pc1: la primera componente principal, la dirección de mayor varianza.
# Por qué: es el autovector de C con el autovalor mayor, y mide 1.
# np.linalg.eigh(C) devuelve DOS cosas a la vez, y se recogen así: vals, vecs = np.linalg.eigh(C)
#   vals: los autovalores, ordenados de menor a mayor.
#   vecs: una matriz cuyas COLUMNAS son los autovectores; la columna j va con vals[j].
# Escribe esa línea antes de pc1.
# M[:, j] saca la columna j entera de una matriz M; el índice -1 es el último.
# Resultado esperado: un array con 2 números.
pc1 = None

# PASO 5. z: la coordenada de cada dato centrado sobre pc1.
# Por qué: es el «dónde cae» cada dato a lo largo de la componente, un número por dato.
# El producto de matrices a @ b, con a de 6 por 2 y b de 2 números, hace el
# producto escalar de cada fila de a con b y da 6 números.
# El signo de pc1 es arbitrario: si cambia, z cambia con él, y las dos soluciones valen.
# Resultado esperado: un array con 6 números.
z = None

# Para ver qué vale algo antes de entregar: print(z) y pulsa «Ejecutar».
`,
          checks: `_X = np.array([[2, 3], [3, 1], [5, 6], [6, 4], [8, 8], [10, 7]], dtype=float)
_m = _X.mean(axis=0)
_Xc = _X - _m
_C = np.cov(_X.T)
_w, _V = np.linalg.eigh(_C)
_u = _V[:, -1]
def _arr(a, s):
    return isinstance(a, np.ndarray) and a.shape == s and (np.issubdtype(a.dtype, np.floating) or np.issubdtype(a.dtype, np.integer))
_a = _arr(media, (2,))
_aok = _a and bool(np.allclose(media, _m))
check(_a, "\`media\` tiene que ser un array de NumPy con 2 números: el promedio de cada una de las dos variables.")
check((not _a) or _aok, "\`media\` tiene que ser el promedio de cada columna de \`X\`, uno por variable: no el de cada dato ni el de todos los datos juntos.")
_b = _arr(Xc, (6, 2))
_bok = _b and bool(np.allclose(Xc, _Xc))
check(_b, "\`Xc\` tiene que ser un array de NumPy de 6 filas y 2 columnas: los datos de \`X\` con el promedio de su variable restado.")
check((not _b) or not _aok or _bok or not np.allclose(Xc, _X), "\`Xc\` es igual a \`X\`: falta restar a los datos el promedio de cada variable.")
check((not _b) or not _aok or _bok or np.allclose(Xc, _X), "\`Xc\` tiene que ser \`X\` menos el promedio de cada variable, restado a todos los datos de esa columna.")
_c = _arr(C, (2, 2))
_cok = _c and bool(np.allclose(C, _C))
_c66 = isinstance(C, np.ndarray) and C.shape == (6, 6)
check(_c or not _c66, "\`C\` sale de 6 filas y 6 columnas: \`np.cov\` está tomando cada fila de los datos como una variable. Tiene que ser de 2 filas y 2 columnas, una por variable.")
check(_c or _c66, "\`C\` tiene que ser un array de NumPy de 2 filas y 2 columnas: la covarianza de las dos variables.")
check((not _c) or (not _bok) or _cok or not np.allclose(C, _X.T @ _X / 5), "\`C\` sale de multiplicar los datos sin centrar: falta centrarlos antes de calcular la covarianza.")
check((not _c) or (not _bok) or _cok or np.allclose(C, _X.T @ _X / 5) or not np.allclose(C, _C * 5 / 6), "\`C\` está dividida entre n, el número de datos. La covarianza se divide entre n - 1.")
check((not _c) or (not _bok) or _cok or np.allclose(C, _X.T @ _X / 5) or np.allclose(C, _C * 5 / 6), "\`C\` tiene que ser la covarianza de los datos centrados: el producto de su traspuesta por ellos, dividido entre n - 1.")
_p = _arr(pc1, (2,))
_pn = _p and abs(float(np.linalg.norm(pc1)) - 1) < 1e-6
_pok = _pn and abs(float(pc1 @ _u)) > 0.999999
_pgate = _a and _b and _c and _aok and _bok and _cok
check(_p, "\`pc1\` tiene que ser un array de NumPy con 2 números: la primera componente principal.")
check((not _p) or (not _pgate) or _pn, "\`pc1\` tiene que medir 1, como los autovectores que devuelve \`eigh\`.")
check((not _pn) or (not _pgate) or abs(float(pc1 @ _V[:, 0])) < 0.999999, "\`pc1\` es la componente de menor varianza. \`eigh\` ordena los autovalores de menor a mayor: la de mayor varianza es la última.")
check((not _pn) or (not _pgate) or _pok or abs(float(pc1 @ _V[:, 0])) > 0.999999, "\`pc1\` no es un autovector de \`C\`. Los autovectores son las columnas de la matriz que devuelve \`eigh\`, no sus filas.")
_z = _arr(z, (6,))
check(_z, "\`z\` tiene que ser un array de NumPy con 6 números: la coordenada de cada dato en \`pc1\`.")
_zgate = _z and _pok and _pgate
check((not _zgate) or bool(np.allclose(np.abs(z), np.abs(_Xc @ _u), atol=1e-6)), "\`z\` tiene que salir de los datos centrados proyectados sobre \`pc1\`: un número por dato. Los datos sin centrar dan otros números.")
check((not _zgate) or (not np.allclose(np.abs(z), np.abs(_Xc @ _u), atol=1e-6)) or bool(np.allclose(z, _Xc @ pc1, atol=1e-6)), "\`z\` no corresponde al signo de \`pc1\`: si \`pc1\` cambia de signo, \`z\` cambia con él.")
`,
          reference: `import numpy as np

X = np.array([[2, 3], [3, 1], [5, 6], [6, 4], [8, 8], [10, 7]])
# Guarda en media la media de cada columna, en Xc los datos centrados, en C su covarianza,
# en pc1 la primera componente principal (norma 1) y en z la coordenada de cada dato en ella
media = X.mean(axis=0)
Xc = X - media
C = np.cov(Xc.T)
vals, vecs = np.linalg.eigh(C)
pc1 = vecs[:, -1]
z = Xc @ pc1
`,
        },
        {
          id: 'pca.ex02.2',
          type: 'codigo',
          prompt:
            'Escribe `pca(X, k)`: recibe `X`, un array de NumPy con un dato por fila y una variable por columna, sin centrar, y un entero `k`, y devuelve `Z`, un array de `n` filas y `k` columnas con las **coordenadas** de los datos en las `k` primeras componentes principales. Las columnas van ordenadas de la componente de mayor varianza a la de menor. Así, `Z` es una versión de los datos en `k` dimensiones que conserva la mayor parte de la varianza posible.',
          hints: [
            'El plan, dentro de `pca`, son los pasos del ejercicio anterior hechos con `X` y `k` en vez de con datos fijos. Centra `X` (le restas la media de cada columna). Calcula la covarianza de los datos centrados; `np.cov` quiere una variable por fila, así que recibe `Xc.T`. Saca los autovalores y autovectores con `np.linalg.eigh`. `eigh` ordena los autovalores de menor a mayor, y tú quieres de mayor a menor: da la vuelta a las columnas de `vecs` y quédate con las `k` primeras. Por último proyecta: los datos centrados por esas columnas. Lo que devuelves son las coordenadas de los datos, no las componentes.',
            'Las piezas, con una matriz pequeña en vez de los datos:\n\n' +
              py(
                'datos = np.array([[1, 2, 3], [4, 5, 6]])',
                'print(datos[0])                      # [1 2 3]: la primera fila',
                'print(datos[:, ::-1][0])             # [3 2 1]: las mismas columnas, en orden inverso',
                'print(datos[:, :2].shape)            # (2, 2): solo las 2 primeras columnas',
                'print(datos[:, ::-1][:, :2][0])      # [3 2]: primero al revés y luego las 2 primeras',
                'print((datos - datos.mean(axis=0))[0])   # [-1.5 -1.5 -1.5]: la primera fila ya centrada',
                'print((datos @ np.array([[1], [0], [0]])).shape)   # (2, 1): una columna de coordenadas',
              ) +
              '\n\nEn una función todo lo de dentro lleva 4 espacios de sangría, y lo que devuelve va con `return`. `k` te dice cuántas columnas quedarte: `[:, :k]`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def pca(X, k):',
                '    Xc = X - X.mean(axis=___)',
                '    vals, vecs = np.linalg.eigh(np.cov(___))',
                '    mejores = vecs[:, ___][:, :k]',
                '    return ___ @ mejores',
              ) +
              '\n\nEl error típico es dejar las columnas en el orden de `eigh`, de menor a mayor varianza: primero hay que darles la vuelta.',
          ],
          explain:
            'Lo que devuelve la función son las coordenadas de los datos, una fila por dato, no las componentes. Comprueba el orden de las columnas: con `eigh`, el autovalor mayor es el último. Un resultado con la media de cada columna distinta de cero señala que los datos no estaban centrados.',
          solution:
            'Se centra `X`, se calcula `np.cov` de los datos centrados trasponiéndolos, se obtienen `vals, vecs` con `eigh` y se proyecta sobre `vecs[:, ::-1][:, :k]`, que son las `k` columnas de mayor autovalor, de mayor a menor. La varianza de cada columna de `Z` es el autovalor de su componente, y las columnas no están correlacionadas. Errores típicos: dejar las columnas en el orden de `eigh`, de menor a mayor; proyectar los datos sin centrar, de modo que las columnas no tienen media 0; o devolver las componentes (`vecs`) en vez de las coordenadas.',
          requirements: [
            '`pca` es una función que recibe un array `X` de `n` filas y `d` columnas y un entero `k`, y devuelve un array de NumPy de `n` filas y `k` columnas.',
            'Se llama a la función con varios conjuntos de datos sin centrar y distintos valores de `k` (con `k` menor que `d`), además de los del enunciado; no debe dar error.',
            'La primera columna es la coordenada en la componente de mayor varianza, y las siguientes siguen de mayor a menor varianza.',
            'Se acepta cualquier signo en cada columna (una componente y su opuesta valen igual) y una diferencia diminuta de redondeo.',
          ],
          starter: `import numpy as np


# Aquí no hay datos hechos: la función recibe los suyos. Las comprobaciones la llaman
# con varios conjuntos de datos y distintos valores de k.

def pca(X, k):
    # X: un array de NumPy de n filas (un dato cada una) y d columnas (una variable cada una),
    # SIN centrar. k: cuántas componentes principales quieres, un número entero.
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría):
    # así sabe Python que es parte de ella. Usa X y k, no datos escritos a mano.

    # PASO 1. Centrar X: restarle la media de cada columna.
    # Por qué: las componentes se miden desde el centro de los datos.
    # X.mean(axis=0) da una media por columna, y restarla a X la resta a todas las filas.

    # PASO 2. La covarianza de los datos centrados.
    # np.cov(M) espera UNA VARIABLE POR FILA; tus datos tienen una por columna,
    # así que dale la traspuesta M.T. Divide entre n - 1 por su cuenta.

    # PASO 3. Los autovalores y autovectores: vals, vecs = np.linalg.eigh(...)
    # vals va de menor a mayor, y la columna j de vecs va con vals[j].

    # PASO 4. Quedarte con las k componentes de mayor varianza, de mayor a menor.
    # Por qué: eigh las deja al revés de lo que se pide.
    # M[:, ::-1] da la vuelta al orden de las columnas de M.
    # M[:, :k] se queda con las k primeras columnas.

    # PASO 5. Proyectar los datos centrados sobre esas columnas y devolverlos.
    # a @ b con a de n por d y b de d por k da n filas y k columnas: una fila por dato
    # y una columna por componente. Devuelve ese array con return.
    # Por qué: Z son las coordenadas de cada dato en las nuevas direcciones.
    return None

# Para probarla antes de entregar: crea unos datos con np.array(...), llama a pca(datos, 1),
# imprime el resultado con print(...) y pulsa «Ejecutar».
`,
          checks: `_data = [
    (np.array([[3, 2, 3], [6, 8, 6], [3, 3, 5], [10, 7, 4], [2, 7, 7], [0, 3, 4], [3, 3, 4]], dtype=float), 2),
    (np.array([[7, 5, 4, 5], [8, 1, 3, 5], [4, 1, 4, 5], [4, 2, 3, 3], [0, 4, 3, 4], [8, 0, 4, 5], [5, 5, 1, 3], [4, 8, 4, 4]], dtype=float), 3),
    (np.array([[2, 2], [2, 5], [7, 9], [7, 7], [8, 6], [5, 6]], dtype=float), 1),
]
_f = callable(globals().get("pca"))
def _call(X, k):
    try:
        return pca(X.copy(), k)
    except Exception:
        return None
def _ref(X, k):
    Xc = X - X.mean(axis=0)
    w, V = np.linalg.eigh(np.cov(Xc.T))
    idx = np.argsort(w)[::-1][:k]
    return w[idx], Xc @ V[:, idx]
_out = [_call(X, k) for X, k in _data] if _f else []
_exp = [_ref(X, k) for X, k in _data]
_shape = _f and all(isinstance(o, np.ndarray) and o.shape == (X.shape[0], k) and np.issubdtype(o.dtype, np.floating) for o, (X, k) in zip(_out, _data))
_mean = _shape and all(np.abs(o.mean(axis=0)).max() < 1e-8 for o in _out)
_var = _mean and all(np.allclose(np.var(o, axis=0, ddof=1), e[0], rtol=1e-6) for o, e in zip(_out, _exp))
_rev = _mean and (not _var) and all(np.allclose(np.var(o, axis=0, ddof=1)[::-1], e[0], rtol=1e-6) for o, e in zip(_out, _exp))
_unc = _var and all(np.allclose(np.cov(o.T).reshape(o.shape[1], o.shape[1]) - np.diag(np.var(o, axis=0, ddof=1)), 0, atol=1e-8) for o in _out)
_same = _unc and all(np.allclose(np.abs(o), np.abs(e[1]), atol=1e-6) for o, e in zip(_out, _exp))
check(_f, "Hay que definir una función \`pca\` que reciba los datos y \`k\`.")
check((not _f) or _shape, "\`pca\` tiene que devolver un array de NumPy de n filas y k columnas: las coordenadas de cada dato, un número por componente. No son las componentes mismas.")
check((not _shape) or _mean, "Las columnas de lo que devuelve \`pca\` tienen que tener media 0: las coordenadas se calculan con los datos centrados, restando la media de cada variable.")
check((not _mean) or _var or _rev, "Las varianzas de las columnas que devuelve \`pca\` tienen que ser los k autovalores mayores de la covarianza de los datos. Revisa qué componentes eliges.")
check((not _mean) or (not _rev), "Las columnas de lo que devuelve \`pca\` salen de menor a mayor varianza. Tienen que ir de la componente de mayor varianza a la de menor.")
check((not _var) or _unc, "Las columnas de lo que devuelve \`pca\` tienen que estar sin correlacionar entre sí: cada una es la coordenada en una componente distinta, y las componentes son perpendiculares.")
check((not _unc) or _same, "Las columnas de lo que devuelve \`pca\` tienen la varianza correcta pero no coinciden con las coordenadas en las componentes principales, salvo el signo.")
`,
          reference: `import numpy as np


def pca(X, k):
    Xc = X - X.mean(axis=0)
    vals, vecs = np.linalg.eigh(np.cov(Xc.T))
    return Xc @ vecs[:, ::-1][:, :k]
`,
        },
        {
          id: 'pca.ex02.3',
          type: 'codigo',
          prompt:
            '`vals` guarda los autovalores de una covarianza tal como los devuelve `eigh`: de **menor a mayor**. Cada componente explica la fracción de la varianza total que es su autovalor entre la suma de todos. Guarda en `ratio` esa fracción de cada componente, ordenadas de **mayor a menor** (un array con tantos números como autovalores, que suman 1) y en `k90` el **menor número de componentes**, empezando por la de mayor varianza, que conserva al menos el 90 % de la varianza (un entero que cuenta componentes, no posiciones).',
          hints: [
            'El plan son dos líneas. `ratio`: `vals` al revés, para que vaya de mayor a menor, dividido entre la suma de todos los autovalores. `k90`: primero los acumulados de `ratio` con `np.cumsum`; después se compara cada acumulado con 0,9 y `np.argmax` da la posición del primer `True`. Esa posición empieza en 0, y tú quieres un número de componentes: súmale 1. Si la dejas sin sumar 1, te sale una componente de menos.',
            'Las piezas, con otros autovalores:\n\n' +
              py(
                'parte = np.array([1, 3, 6])',
                'print(parte[::-1])                  # [6 3 1]: el mismo array, al revés',
                'print(parte / parte.sum())          # [0.1 0.3 0.6]: cada uno entre la suma, que es 10',
                'acum = np.cumsum([0.5, 0.3, 0.2])',
                'print(acum)                         # [0.5 0.8 1. ]: cada número suma los anteriores',
                'print(acum >= 0.7)                  # [False  True  True]: ¿llega ya al 70 %?',
                'print(np.argmax(acum >= 0.7))       # 1: la posición del primer True, contando desde 0',
              ) +
              '\n\nAhí la posición 1 es la segunda componente, así que harían falta 2. Para que `k90` sea un entero, envuelve el resultado en `int(...)`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'ratio = vals[___] / vals.sum()',
                'acumulado = np.cumsum(ratio)',
                'k90 = int(np.argmax(acumulado >= ___)) + ___',
              ) +
              '\n\nEl error típico es dejar `k90` como la posición, sin sumar 1: te quedas con una componente de menos y no llegas al 90 %.',
          ],
          explain:
            'Dos errores habituales: acumular en el orden de `eigh`, que empieza por las componentes que menos explican, y confundir la posición con el número de componentes. Cuando una posición vale `p`, ya llevas `p + 1` componentes.',
          solution:
            'Con `ratio = vals[::-1] / vals.sum()` sale $0{,}5;\\ 0{,}27;\\ 0{,}11;\\ 0{,}07;\\ 0{,}035$ y $0{,}015$. Los acumulados son $50\\,\\%$, $77\\,\\%$, $88\\,\\%$ y $95\\,\\%$: se pasa del $90\\,\\%$ en la posición 3, que es la cuarta componente, luego `k90` vale 4. Si tomas la posición sin sumar 1 sale 3, que solo conserva el $88\\,\\%$; si acumulas de menor a mayor, necesitas casi todas.',
          requirements: [
            '`ratio` es un array de NumPy con un número por autovalor, de mayor a menor, que suman 1. Es una fracción entre 0 y 1, no un porcentaje.',
            '`k90` es un número entero: cuántas componentes, empezando por la de mayor autovalor, hacen falta como mínimo para llegar al 90 %.',
            'Se acepta una diferencia diminuta de redondeo en `ratio`.',
          ],
          starter: `import numpy as np

# vals: un array de NumPy con 6 autovalores, tal como los devuelve eigh: de MENOR a MAYOR.
# Cada autovalor es la varianza de una componente principal. vals[0] es el primero (0.3)
# y vals[-1] es el último (10.0).
vals = np.array([0.3, 0.7, 1.4, 2.2, 5.4, 10.0])

# PASO 1. ratio: qué fracción de la varianza total explica cada componente, de mayor a menor.
# Por qué: la varianza de una componente, entre la suma de todas, dice cuánto de la
# variación de los datos se queda en ella.
# vals[::-1] es vals al revés (de mayor a menor). vals.sum() suma todos los autovalores.
# Un array dividido entre un número divide cada uno de sus elementos:
# np.array([1, 3]) / 4 da 0.25 y 0.75.
# Resultado esperado: un array de 6 números (fracciones entre 0 y 1 que suman 1, no porcentajes).
ratio = None

# PASO 2. k90: cuántas componentes hacen falta, de la mayor en adelante, para llegar al 90 %.
# Por qué: es la pregunta de la compresión, cuántas dimensiones puedes quedarte sin perder
# demasiado.
# Tres herramientas, una detrás de otra:
#   np.cumsum(x) da los acumulados: np.cumsum([0.5, 0.3, 0.2]) da 0.5, 0.8 y 1.0.
#   acum >= 0.7 compara cada número y da un array de True y False.
#   np.argmax(...) de ese array da la POSICIÓN del primer True, y las posiciones empiezan en 0.
# Con los acumulados 0.5, 0.8 y 1.0 y un 70 %, la posición es 1, pero ahí ya llevas 2 componentes.
# Resultado esperado: un número entero.
k90 = None

# Para ver qué vale algo antes de entregar: print(ratio) y pulsa «Ejecutar».
`,
          checks: `_want = np.array([0.5, 0.27, 0.11, 0.07, 0.035, 0.015])
_r = isinstance(ratio, np.ndarray) and ratio.shape == (6,) and np.issubdtype(ratio.dtype, np.floating)
_rok = _r and bool(np.allclose(ratio, _want, atol=1e-9))
_k = isinstance(k90, (int, np.integer)) and not isinstance(k90, (bool, np.bool_))
check(_r, "\`ratio\` tiene que ser un array de NumPy con 6 números: la fracción de varianza de cada componente.")
check((not _r) or _rok or not np.allclose(ratio, _want[::-1], atol=1e-9), "\`ratio\` va de menor a mayor, el orden de \`vals\`. Tiene que empezar por la componente que más varianza explica.")
check((not _r) or _rok or not np.allclose(ratio, _want * 100, atol=1e-6), "\`ratio\` está en porcentajes. Tiene que ser una fracción entre 0 y 1, y sumar 1.")
check((not _r) or _rok or np.allclose(ratio, _want[::-1], atol=1e-9) or np.allclose(ratio, _want * 100, atol=1e-6), "\`ratio\` tiene que ser, para cada componente, su autovalor entre la suma de todos, de mayor a menor.")
check(_k, "\`k90\` tiene que ser un número entero: cuántas componentes hacen falta.")
check((not _k) or k90 != 3, "\`k90\` vale 3: con tres componentes solo se conserva el 88 %. Parece una posición contada desde 0, y se pide un número de componentes.")
check((not _k) or k90 in (3, 6) or k90 == 4, "\`k90\` tiene que ser el menor número de componentes, empezando por la de mayor varianza, cuyo acumulado llega al 90 %.")
check((not _k) or k90 != 6, "\`k90\` pide casi todas las componentes: si acumulas de menor a mayor, empiezas por las que menos explican. Acumula de mayor a menor.")
`,
          reference: `import numpy as np

vals = np.array([0.3, 0.7, 1.4, 2.2, 5.4, 10.0])
# Guarda en ratio la fracción de varianza de cada componente, de mayor a menor,
# y en k90 el menor número de componentes que conserva al menos el 90 %
ratio = vals[::-1] / vals.sum()
k90 = int(np.argmax(np.cumsum(ratio) >= 0.9)) + 1
`,
        },
        {
          id: 'pca.ex02.4',
          type: 'codigo',
          prompt:
            'Comprimir datos de dos variables a una sola componente pierde información. `X` guarda seis datos, uno por fila. Calcula su primera componente principal `pc1` y la coordenada `z` de cada dato centrado en ella, y **reconstruye** los datos con solo esa componente: `X_rec` vale la media más cada coordenada multiplicada por `pc1`. Guarda en `X_rec` los datos reconstruidos (seis filas y dos columnas) y en `error` la suma de las distancias al cuadrado entre cada dato de `X` y su reconstrucción, dividida entre $n-1$. Ese número coincide con el autovalor de la componente que se ha descartado.',
          hints: [
            'El plan: primero la cadena de siempre, `media`, `Xc`, `pc1` (con `np.linalg.eigh` de la covarianza, la columna del autovalor mayor) y `z`. Después `X_rec`: reconstruir es deshacer la proyección, así que cada dato vuelve al plano como la media más su coordenada `z` por la dirección `pc1`; `np.outer(z, pc1)` hace ese producto para los seis datos a la vez. Por último `error`: las diferencias entre `X` y `X_rec`, al cuadrado, sumadas todas, y divididas entre $n-1$.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'a = np.array([1, 2, 3])',
                'u = np.array([10, 20])',
                'print(np.outer(a, u).shape)      # (3, 2): una fila por cada número de a',
                'print(np.outer(a, u)[1])         # [20 40]: la fila 1 es a[1] por u',
                'dif = np.array([[1, 2], [3, 4]]) - np.array([[0, 2], [1, 1]])',
                'print((dif ** 2).sum())          # 14: 1 + 0 + 4 + 9, todos los cuadrados sumados',
                'print(len(dif))                  # 2: el número de filas, o sea, de datos',
              ) +
              '\n\nSumar un array de 2 números a una matriz de 6 filas y 2 columnas lo suma a cada fila, igual que al restar. Y `len(X) - 1` es $n-1$.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'media = X.mean(axis=0)',
                'Xc = X - media',
                'vals, vecs = np.linalg.eigh(np.cov(Xc.T))',
                'pc1 = vecs[:, ___]',
                'z = Xc @ pc1',
                'X_rec = ___ + np.outer(___, pc1)',
                'error = ((X - X_rec) ** 2).sum() / (len(X) - ___)',
              ) +
              '\n\nEl error típico es olvidar sumar la media: sin ella, la reconstrucción queda centrada en el origen en vez de sobre los datos.',
          ],
          explain:
            'La reconstrucción vive en el mismo sitio que los datos, no en el de los datos centrados: hay que devolverle la media. Y se reconstruye con la componente de mayor varianza, no con la otra. El error de la compresión es la varianza que se tira.',
          solution:
            'Con `pc1` de la última columna de `vecs`, `z = Xc @ pc1` y `X_rec = media + np.outer(z, pc1)`, cada dato queda sobre la recta de la primera componente. El error, $\\frac{1}{n-1}\\sum\\lVert x-\\hat{x}\\rVert^2$, vale $1{,}61$ y es justo el autovalor menor de la covarianza, la varianza que se descarta. Errores típicos: olvidar sumar la media, de modo que la reconstrucción queda centrada en el origen, o reconstruir con la componente menor, que deja un error enorme. La próxima órbita lleva esta misma idea a matrices enteras: quedarse con las direcciones que más cuentan es aproximarlas con un **rango bajo**.',
          requirements: [
            '`X_rec` es un array de NumPy de 6 filas y 2 columnas, en la misma escala y posición que `X`: cada dato reconstruido con una sola componente. No depende del signo que se elija para la componente.',
            '`error` es un número: la suma de las distancias al cuadrado entre los datos y su reconstrucción, dividida entre $n-1$. Se acepta una diferencia diminuta de redondeo.',
          ],
          starter: `import numpy as np

# X: un array de NumPy de 6 filas (los datos) y 2 columnas (las variables).
X = np.array([[1, 4], [2, 2], [4, 5], [5, 3], [6, 6], [8, 4]])

# PASO 1. media: la media de cada columna de X (X.mean(axis=0)).
# Resultado esperado: un array con 2 números.
media = None

# PASO 2. Xc: los datos centrados, X menos la media.
# Por qué: las componentes se miden desde el centro de los datos.
# Resultado esperado: un array de 6 filas y 2 columnas.
Xc = None

# PASO 3. pc1: la primera componente principal, como en el ejercicio de la cadena de pasos.
# Calcula la covarianza de Xc con np.cov (que espera una variable por fila: dale Xc.T),
# recoge los resultados con vals, vecs = np.linalg.eigh(...) (escribe esa línea antes de pc1)
# y coge de vecs la COLUMNA del autovalor mayor. eigh ordena los autovalores de menor a mayor.
# M[:, j] saca la columna j de una matriz M; el índice -1 es el último.
# Resultado esperado: un array con 2 números.
pc1 = None

# PASO 4. z: la coordenada de cada dato centrado sobre pc1 (Xc @ pc1).
# Por qué: es lo único que se guarda de cada dato al comprimirlo a una sola componente.
# Resultado esperado: un array con 6 números.
z = None

# PASO 5. X_rec: los datos reconstruidos con solo esa componente.
# Por qué: reconstruir es deshacer la compresión. Cada dato vuelve a ser su punto sobre la
# recta de pc1, que es z veces pc1, y como al centrar se restó la media, hay que sumársela otra vez.
# np.outer(a, b) con a de 6 números y b de 2 da una matriz de 6 filas y 2 columnas
# cuya fila i es a[i] * b. Por ejemplo, np.outer([1, 2], [10, 20]) tiene las filas
# [10 20] y [20 40].
# Sumar a una matriz de 6 por 2 un array de 2 números lo suma a cada fila.
# Resultado esperado: un array de 6 filas y 2 columnas.
X_rec = None

# PASO 6. error: la suma de las distancias al cuadrado entre cada dato de X y su reconstrucción,
# dividida entre n - 1.
# Por qué: es lo que se pierde al comprimir, la varianza de la componente que se ha descartado.
# X - X_rec resta dato a dato; ** 2 eleva cada número al cuadrado; .sum() los suma todos
# (los de las dos columnas, que juntos dan las distancias al cuadrado).
# len(X) es el número de datos, 6, y n - 1 es len(X) - 1.
# Resultado esperado: un solo número.
error = None

# Para ver qué vale algo antes de entregar: print(error) y pulsa «Ejecutar».
`,
          checks: `_X = np.array([[1, 4], [2, 2], [4, 5], [5, 3], [6, 6], [8, 4]], dtype=float)
_m = _X.mean(axis=0)
_Xc = _X - _m
_w, _V = np.linalg.eigh(np.cov(_Xc.T))
_u = _V[:, -1]
_rec = _m + np.outer(_Xc @ _u, _u)
_r = isinstance(X_rec, np.ndarray) and X_rec.shape == (6, 2) and np.issubdtype(X_rec.dtype, np.number)
_rok = _r and bool(np.allclose(X_rec, _rec, atol=1e-6))
_e = isinstance(error, (int, float, np.integer, np.floating)) and not isinstance(error, (bool, np.bool_))
check(_r, "\`X_rec\` tiene que ser un array de NumPy de 6 filas y 2 columnas: cada dato reconstruido.")
check((not _r) or _rok or not np.allclose(X_rec, _rec - _m, atol=1e-6), "\`X_rec\` queda centrada en el origen: falta devolverle el promedio de los datos a la reconstrucción.")
check((not _r) or _rok or not np.allclose(X_rec, _m + np.outer(_Xc @ _V[:, 0], _V[:, 0]), atol=1e-6), "\`X_rec\` está reconstruida con la componente de menor varianza. Tiene que ser con la de mayor: la última que devuelve \`eigh\`.")
check((not _r) or _rok or not np.allclose(X_rec, _X, atol=1e-6), "\`X_rec\` es igual a \`X\`: no se ha perdido nada, así que se han usado las dos componentes. Hay que quedarse con una sola.")
check((not _r) or _rok or np.allclose(X_rec, _rec - _m, atol=1e-6) or np.allclose(X_rec, _m + np.outer(_Xc @ _V[:, 0], _V[:, 0]), atol=1e-6) or np.allclose(X_rec, _X, atol=1e-6), "\`X_rec\` tiene que ser el promedio de los datos más, para cada dato, su coordenada en la primera componente por esa componente.")
check(_e, "\`error\` tiene que ser un número: la suma de las distancias al cuadrado entre \`X\` y \`X_rec\`, dividida entre n - 1.")
check((not _e) or (not _rok) or not np.isclose(error, _w[0] * 5 / 6), "\`error\` está dividido entre n. Se divide entre n - 1, como la covarianza.")
check((not _e) or (not _rok) or not np.isclose(error, _w[0] * 5), "\`error\` es la suma sin dividir. Falta dividirla entre n - 1.")
check((not _e) or (not _rok) or np.isclose(error, _w[0] * 5 / 6) or np.isclose(error, _w[0] * 5) or np.isclose(error, _w[0]), "\`error\` tiene que valer lo mismo que el autovalor que se descarta: la suma de las distancias al cuadrado entre n - 1.")
`,
          reference: `import numpy as np

X = np.array([[1, 4], [2, 2], [4, 5], [5, 3], [6, 6], [8, 4]])
# Reconstruye los datos con solo la primera componente principal: guarda en X_rec la reconstrucción
# y en error la suma de las distancias al cuadrado entre X y X_rec, dividida entre n - 1
media = X.mean(axis=0)
Xc = X - media
vals, vecs = np.linalg.eigh(np.cov(Xc.T))
pc1 = vecs[:, -1]
z = Xc @ pc1
X_rec = media + np.outer(z, pc1)
error = ((X - X_rec) ** 2).sum() / (len(X) - 1)
`,
        },
        {
          id: 'pca.ex02.5',
          type: 'codigo',
          prompt:
            'El módulo `embeddings` trae embeddings **reales** de 32 palabras: `palabras` es la lista y `P`, la matriz de 32 filas y 384 columnas, una fila por palabra. Para verlos en una pantalla hay que bajar a dos dimensiones con PCA. Guarda en `mapa` un array de 32 filas y 2 columnas con las coordenadas de cada palabra, en el mismo orden que `palabras`, en las dos primeras componentes principales de `P`; en `explicada`, la fracción de la varianza total que conservan esas dos componentes; y dibuja el mapa con `plt.scatter` y, junto a cada punto, el nombre de su palabra (con `plt.annotate` o `plt.text`).\n\nEl mapa es una vista parcial: `explicada` te dice cuánta variación se queda fuera. Con 32 palabras la covarianza de 384 variables tiene como mucho 31 autovalores distintos de cero, y las demás direcciones valen cero.',
          hints: [
            'Es el mismo PCA de antes, ahora con 384 variables en lugar de 2. El plan: centra `P` (le restas la media de cada columna); saca los autovalores y autovectores con `np.linalg.eigh` de la covarianza de los datos centrados (`np.cov` quiere una variable por fila: dale la traspuesta). `mapa` son los datos centrados por las dos columnas de `vecs` de mayor autovalor, la mayor primero. `explicada` es la suma de los dos autovalores mayores dividida entre la suma de todos. Para dibujar: `plt.scatter` con la primera columna de `mapa` en horizontal y la segunda en vertical, y un `plt.annotate` por palabra.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'M = np.array([[1, 2, 3], [4, 5, 6]])',
                'print(M[:, 0])                  # [1 4]: la columna 0 entera',
                'print(M[:, [2, 0]][0])          # [3 1]: las columnas 2 y 0, en ese orden',
                'print(np.cov(M.T).shape)        # (3, 3): tres variables, una por columna de M',
                'frutas = ["pera", "uva", "kiwi"]',
                'for i, fruta in enumerate(frutas):',
                '    print(i, fruta)             # 0 pera, luego 1 uva, luego 2 kiwi',
                'plt.scatter(M[:, 0], M[:, 1])    # un punto por fila de M: las columnas 0 y 1 son x e y',
                'plt.annotate("a", (1, 4))       # escribe «a» junto al punto de coordenadas (1, 4)',
              ) +
              '\n\nEn `vals`, que va de menor a mayor, el índice `-1` es el mayor y `-2` el siguiente.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'Pc = P ___ P.mean(axis=0)',
                'vals, vecs = np.linalg.eigh(np.cov(Pc.T))',
                'mapa = Pc @ vecs[:, [___, ___]]',
                'explicada = (vals[___] + vals[___]) / vals.sum()',
                'plt.scatter(mapa[:, 0], mapa[:, 1])',
                'for i, palabra in enumerate(palabras):',
                '    plt.annotate(palabra, (mapa[i, 0], mapa[i, 1]))',
              ) +
              '\n\nEl error típico es coger las columnas del principio de `vecs`: son las de menor varianza, y el mapa mostraría lo menos importante.',
          ],
          explain:
            'Comprueba la forma de `mapa`, una fila por palabra y una columna por componente, y que las dos componentes son las de mayor autovalor, no las de menor. `explicada` es una fracción entre 0 y 1 y no la suma de dos varianzas. Mira cuánto vale: si es baja, el mapa deja fuera casi todo.',
          solution:
            'Se centra `P`, se calcula `np.cov` de los datos centrados trasponiéndolos (una matriz de $384\\times 384$) y se proyecta sobre sus dos autovectores de mayor autovalor. Las dos varianzas son $0{,}114$ y $0{,}062$, y la varianza total es $0{,}621$: `explicada` vale $0{,}28$. El mapa muestra **solo el $28\\,\\%$** de la variación; el $72\\,\\%$ restante está en otras direcciones que no se ven. Por eso un mapa así engaña a veces: dos palabras cercanas en él pueden estar lejos en el espacio real.',
          requirements: [
            '`mapa` es un array de NumPy de 32 filas y 2 columnas, con las filas en el orden de `palabras`. Cada columna tiene media 0, y sus varianzas son las de las dos componentes de mayor varianza, de mayor a menor. Se acepta cualquier signo en cada columna.',
            '`explicada` es un número entre 0 y 1: la fracción de la varianza total que conservan esas dos componentes.',
            'La figura tiene 32 puntos, que son las coordenadas de `mapa`, y el nombre de cada una de las 32 palabras escrito en la figura.',
            'Las varianzas y la fracción se comparan con una tolerancia de una milésima en términos relativos.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt
from embeddings import palabras, P

# palabras: la lista de las 32 palabras (palabras[0] es la primera).
# P: una matriz de 32 filas y 384 columnas. La fila i es el embedding de palabras[i]: cada
# palabra es un dato, y cada una de las 384 columnas, una variable.
# plt es matplotlib, para dibujar.

# PASO 1. Pc: P centrada, o sea, P menos la media de cada columna.
# Por qué: las componentes se miden desde el centro de los datos.
# P.mean(axis=0) da 384 medias, una por columna, y restarlas a P las resta de cada fila.
# Resultado esperado: un array de 32 filas y 384 columnas.
Pc = None

# PASO 2. mapa: las coordenadas de cada palabra en las dos primeras componentes principales.
# Por qué: con dos números por palabra se pueden dibujar en una pantalla.
# Es el mismo cálculo que con dos variables, solo que más grande:
#   - np.cov(M) espera una variable por fila, así que dale la traspuesta M.T: la covarianza
#     sale de 384 por 384.
#   - vals, vecs = np.linalg.eigh(...) (escribe esa línea antes de mapa): los autovalores van de
#     menor a mayor y las COLUMNAS de vecs son los autovectores.
#   - M[:, [a, b]] saca las columnas a y b de M, en ese orden. El índice -1 es la última columna
#     y -2 la penúltima.
#   - Pc @ (esas dos columnas) da una fila por palabra y una columna por componente.
# Resultado esperado: un array de 32 filas y 2 columnas, con la componente de mayor varianza primero.
mapa = None

# PASO 3. explicada: la fracción de la varianza total que conservan esas dos componentes.
# Por qué: el mapa es una vista parcial, y este número dice cuánto de la variación enseña.
# vals[-1] es el mayor autovalor y vals[-2] el siguiente; vals.sum() es la varianza total.
# Resultado esperado: un número entre 0 y 1.
explicada = None

# PASO 4. Dibuja el mapa (no hay variable que guardar).
# plt.scatter(x, y) pone un punto por cada pareja de x e y: usa la primera columna de mapa para x
# y la segunda para y (mapa[:, 0] es la primera columna).
# plt.annotate(texto, (x, y)) escribe un texto junto al punto (x, y).
# for i, palabra in enumerate(palabras): da en cada vuelta la posición i y la palabra; con
# mapa[i, 0] y mapa[i, 1] tienes las coordenadas de esa palabra. Lo que va dentro del for
# lleva 4 espacios de sangría.

# Para ver qué vale algo antes de entregar: print(explicada) y pulsa «Ejecutar».
`,
          checks: `import embeddings as _e
_P = _e.P
_Pc = _P - _P.mean(axis=0)
_g = np.sort(np.linalg.eigvalsh(_Pc @ _Pc.T / 31))[::-1]
_tot = float((_Pc ** 2).sum() / 31)
_s = [float(_g[0]), float(_g[1])]
_exp = (_s[0] + _s[1]) / _tot
_m = isinstance(mapa, np.ndarray) and mapa.shape == (32, 2) and np.issubdtype(mapa.dtype, np.floating)
_mean = _m and bool(np.abs(mapa.mean(axis=0)).max() < 1e-6)
_var = _mean and bool(np.allclose(np.var(mapa, axis=0, ddof=1), _s, rtol=1e-3))
_swap = _mean and (not _var) and bool(np.allclose(np.var(mapa, axis=0, ddof=1), _s[::-1], rtol=1e-3))
_unc = _var and abs(float(np.cov(mapa.T)[0, 1])) < 1e-6
check(_m, "\`mapa\` tiene que ser un array de NumPy de 32 filas y 2 columnas: las coordenadas de cada palabra en las dos componentes.")
check((not _m) or _mean, "Las columnas de \`mapa\` tienen que tener media 0: las coordenadas se calculan con los datos centrados, restando la media de cada variable.")
check((not _mean) or _var or _swap, "Las varianzas de las columnas de \`mapa\` no son las de las dos componentes de mayor varianza. Revisa qué columnas eliges de lo que devuelve \`eigh\`, que ordena de menor a mayor.")
check((not _mean) or (not _swap), "Las columnas de \`mapa\` están en el orden contrario: la primera tiene que ser la componente de mayor varianza.")
check((not _var) or _unc, "Las dos columnas de \`mapa\` tienen que estar sin correlacionar: cada una es la coordenada en una componente distinta.")
_x = isinstance(explicada, (int, float, np.integer, np.floating)) and not isinstance(explicada, (bool, np.bool_))
check(_x, "\`explicada\` tiene que ser un número entre 0 y 1: la fracción de la varianza que conservan las dos componentes.")
check((not _x) or not abs(float(explicada) - (_s[0] + _s[1])) < 1e-3, "\`explicada\` es la suma de las dos varianzas, no una fracción. Hay que dividirla entre la varianza total, la suma de todos los autovalores.")
check((not _x) or not abs(float(explicada) - _s[0] / _tot) < 1e-3 * _s[0] / _tot, "\`explicada\` solo cuenta la primera componente. Tiene que sumar las dos primeras.")
check((not _x) or abs(float(explicada) - (_s[0] + _s[1])) < 1e-3 or abs(float(explicada) - _s[0] / _tot) < 1e-3 * _s[0] / _tot or abs(float(explicada) - _exp) < 1e-3 * _exp, "\`explicada\` tiene que ser la suma de los dos autovalores mayores dividida entre la suma de todos.")
_fig = len(plt.get_fignums()) > 0
check(_fig, "No hay ninguna figura: dibuja la figura con \`plt.scatter\`.")
_axs = plt.gcf().axes if _fig else []
_pts = [np.asarray(c.get_offsets(), dtype=float) for ax in _axs for c in ax.collections if type(c).__name__ == "PathCollection"]
_np = sum(len(p) for p in _pts)
check((not _fig) or _np >= 32, "Faltan puntos: tiene que haber 32 puntos en la figura, uno por palabra.")
check((not _fig) or _np <= 32, "Sobran puntos: dibuja solo las 32 palabras.")
check((not _fig) or _np != 32 or not _m or bool(np.allclose(np.abs(np.vstack(_pts)), np.abs(mapa), atol=1e-6)), "Los puntos de la figura no son las coordenadas de \`mapa\`, fila a fila: la primera columna va en horizontal y la segunda, en vertical.")
_txt = [t.get_text() for ax in _axs for t in ax.texts]
check((not _fig) or all(w in _txt for w in _e.palabras), "Falta el nombre de alguna palabra en la figura: escribe el de cada una con \`plt.annotate\` o \`plt.text\`.")
`,
          reference: `import numpy as np
import matplotlib.pyplot as plt
from embeddings import palabras, P

# P tiene una fila por palabra y 384 columnas. Guarda en mapa las coordenadas de cada palabra en las
# dos primeras componentes principales, en explicada la fracción de varianza que conservan,
# y dibuja el mapa con el nombre de cada palabra
Pc = P - P.mean(axis=0)
vals, vecs = np.linalg.eigh(np.cov(Pc.T))
mapa = Pc @ vecs[:, [-1, -2]]
explicada = (vals[-1] + vals[-2]) / vals.sum()
plt.scatter(mapa[:, 0], mapa[:, 1])
for i, palabra in enumerate(palabras):
    plt.annotate(palabra, (mapa[i, 0], mapa[i, 1]))
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'pca.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere la primera componente principal de unos datos. `X` es un array de NumPy con un dato por fila, **sin centrar**, y NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'La covarianza se calcula con datos centrados. ¿Qué hace el cálculo de `C` con la media?',
        'Las líneas de después usan `C` como viene. Si `C` no es la covarianza, sus autovectores tampoco son las componentes.',
      ],
      explain:
        'La covarianza mide cómo varían los datos alrededor de su media. Un producto de los datos consigo mismos, sin restarla, mezcla esa variación con la posición de los datos respecto del origen. Revisa si cada línea usa lo que la anterior debería haber preparado.',
      solution:
        'La primera línea está mal. `X.T @ X / (len(X) - 1)` no resta la media: es la covarianza solo si los datos ya están centrados, y aquí no lo están. Su autovector de mayor autovalor apunta hacia el centro de la nube y no hacia su dirección de mayor variación. Hay que centrar antes: `Xc = X - X.mean(axis=0)` y `C = Xc.T @ Xc / (len(X) - 1)` o `C = np.cov(X.T)`. Las otras dos líneas están bien, ya que `eigh` ordena de menor a mayor y la última columna es la del autovalor mayor.',
      lines: ['C = X.T @ X / (len(X) - 1)', 'vals, vecs = np.linalg.eigh(C)', 'pc1 = vecs[:, -1]'],
      faultyLine: 0,
    },
    {
      id: 'pca.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula cuánta varianza se conserva al quedarse con dos componentes principales. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Suma los autovalores y calcula tú la fracción de las dos primeras.',
        'Comprueba que cada línea usa el resultado de la anterior.',
      ],
      explain:
        'La fracción de varianza que conserva un conjunto de componentes es la suma de sus autovalores entre la suma de todos. Revisa cada paso con esa regla, y mira que lo que se pierde sea el complemento de lo que se conserva.',
      solution:
        'No hay ningún error. Los autovalores $6$, $3$ y $1$ suman $10$. Las dos primeras componentes conservan $\\frac{6+3}{10}=90\\,\\%$, y lo que se pierde es lo que explica la tercera, $\\frac{1}{10}=10\\,\\%$.',
      lines: [
        'Una covarianza tiene autovalores 6, 3 y 1, así que la varianza total es 6 + 3 + 1 = 10',
        'Las dos primeras componentes explican (6 + 3) / 10 = 90 % de la varianza',
        'Luego quedarse con 2 componentes pierde el 10 % de la varianza',
      ],
      faultyLine: null,
    },
    {
      id: 'pca.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento interpreta un mapa PCA en 2D de embeddings de 384 dimensiones, con cifras inventadas. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Una proyección a dos componentes conserva solo una parte de la varianza. Fíjate en qué parte, según la primera línea.',
        'Pregúntate si estar cerca en el mapa quiere decir estar cerca en las 384 dimensiones.',
      ],
      explain:
        'Quedarse con dos componentes tira la varianza de las demás. Lo primero que se afirma dice cuánta se conserva, y de ello depende qué se puede deducir de la distancia en el mapa.',
      solution:
        'La tercera línea está mal. Si las dos componentes solo explican el $25\\,\\%$ de la varianza, el $75\\,\\%$ restante está en otras direcciones que el mapa no enseña, y en ellas «gato» y «coche» pueden estar muy lejos. Que queden cerca en el mapa no prueba que sus embeddings sean casi iguales.',
      lines: [
        'Los embeddings tienen 384 dimensiones y las dos primeras componentes explican el 25 % de la varianza',
        'En el mapa de esas dos componentes, «gato» y «coche» quedan a una distancia de 0,1',
        'Luego sus embeddings son casi iguales en las 384 dimensiones',
      ],
      faultyLine: 2,
    },
  ],
};
