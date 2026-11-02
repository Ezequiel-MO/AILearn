import type { PlaneSpec, PlaneVector, Project } from '../../content/schema';
import { py } from '../py';
import { atencionWarmup } from './atencion.calentamiento';
import { transformPlane } from './plane';

/** Un vector del plano con su propia etiqueta. */
const vec = (id: string, label: string, x: number, y: number, movable: boolean): PlaneVector => ({
  id,
  label,
  x,
  y,
  movable,
});

/** Plano sin transformación: la consulta $q$ y las claves, para leer sus productos escalares. */
const scorePlane: PlaneSpec = {
  range: 3,
  snap: 1,
  vectors: [vec('k1', 'k₁', 2, 1, false), vec('k2', 'k₂', -1, 2, false), vec('q', 'q', 1, 0, true)],
  readouts: ['dot'],
  pair: ['q', 'k1'],
};

/**
 * Cuarto proyecto de la Órbita 3 de matrices: la atención como producto de matrices. Aquí, las
 * puntuaciones QKᵀ, el softmax por filas y la mezcla de valores; la parte de código, en la fase siguiente.
 */
export const atencion: Project = {
  id: 'atencion',
  name: 'Atención como matriz',
  sub: 'Quién mira a quién',
  warmup: atencionWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'atencion.ex00.1',
          type: 'manipular',
          purpose: {
            why: 'En un modelo de lenguaje, cada palabra del contexto genera una **consulta** (lo que busca) y una **clave** (lo que ofrece). La puntuación con que una mira a otra es el producto escalar de la consulta con la clave. Entender qué consulta puntúa alto con qué clave es entender por qué una cabeza de atención se fija en unas palabras y no en otras.',
            aim: 'Vas a mover una consulta $q$ hasta que puntúe lo pedido con dos claves a la vez, guiándote por la lectura de una de ellas y por lo que sabes del producto escalar.',
            takeaway:
              'La consulta $(2, 1)$ puntúa $5$ con $k_1$ y $0$ con $k_2$: se alinea con la clave que quiere y es perpendicular a la que ignora. Lo que hace una capa de atención es, en el fondo, esto, repetido para todas las parejas de palabras del contexto.',
          },
          prompt:
            'En un modelo de **atención**, cada palabra del texto genera una **consulta** $q$ (lo que busca) y una **clave** $k$ (lo que ofrece). La **puntuación** con que una palabra mira a otra es el producto escalar $q\\cdot k$. Aquí hay dos claves fijas, $k_1=(2, 1)$ y $k_2=(-1, 2)$, y una consulta $q$ que parte de $(1, 0)$. El panel te enseña $q\\cdot k_1$; la puntuación con $k_2$ la calculas tú con las coordenadas de $q$. Mueve $q$ hasta que puntúe **5** con $k_1$ y **0** con $k_2$.',
          hints: [
            'Una puntuación de $0$ con $k_2$ pide un $q$ perpendicular a $k_2$. Las dos claves son perpendiculares entre sí: ¿qué dirección es perpendicular a $k_2$?',
            'Con $q$ en esa dirección, solo falta su longitud: la lectura con $k_1$ tiene que llegar a $5$.',
          ],
          explain:
            'La puntuación es el producto escalar: grande y positiva si la consulta y la clave apuntan hacia el mismo lado, $0$ si son perpendiculares y negativa si apuntan en sentidos opuestos. Con dos claves perpendiculares, cada una fija una condición distinta sobre $q$.',
          solution:
            'Hay que poner $q=(2, 1)$. Entonces $q\\cdot k_1=2\\cdot 2+1\\cdot 1=5$ y $q\\cdot k_2=2\\cdot(-1)+1\\cdot 2=0$. Desde $(1, 0)$ las puntuaciones eran $2$ y $-1$. Como $q$ coincide con la dirección de $k_1$, que es perpendicular a $k_2$, ninguna otra posición de la rejilla cumple las dos condiciones.',
          plane: scorePlane,
          goals: [
            { metric: 'dot', of: ['q', 'k1'], target: 5, tol: 0.01 },
            { metric: 'dot', of: ['q', 'k2'], target: 0, tol: 0.01 },
          ],
        },
        {
          id: 'atencion.ex00.2',
          type: 'manipular',
          purpose: {
            why: 'Las claves de todas las palabras se apilan, una por fila, en una matriz $K$. Multiplicar $K$ por una consulta da de golpe sus puntuaciones con todas las palabras. Y si se apilan también las consultas en una matriz $Q$, el producto $QK^{T}$ da la tabla de puntuaciones entera en una sola operación, que es lo que hace una GPU.',
            aim: 'Vas a buscar la consulta $q$ cuyas dos puntuaciones, con dos claves, son las pedidas, leyendo el resultado de $K\\,q$ como un solo vector.',
            takeaway:
              'La consulta $(1, 1)$ da el vector de puntuaciones $(3, 1)$: la primera con $k_1$ y la segunda con $k_2$. Una matriz de claves convierte una consulta en todas sus puntuaciones, y apilar muchas consultas convierte esa operación en una tabla.',
          },
          prompt:
            'Apila las claves de dos palabras, $k_1=(2, 1)$ y $k_2=(0, 1)$, como **filas** de una matriz $K=\\begin{pmatrix}2&1\\\\0&1\\end{pmatrix}$. Entonces $K\\,q$ contiene en una sola columna las dos puntuaciones de la consulta $q$: la primera es $q\\cdot k_1$ y la segunda, $q\\cdot k_2$. El panel llama $A$ a esa matriz $K$ y dibuja $A\\,q$, la columna de puntuaciones. Mueve $q$, que parte de $(1, 0)$, hasta que puntúe **3** con $k_1$ y **1** con $k_2$.',
          hints: [
            'La lectura $A\\,q$ tiene dos coordenadas: la primera es la puntuación con $k_1$ y la segunda, la puntuación con $k_2$. Mira cuál de las dos depende solo de una coordenada de $q$.',
            'Como $k_2=(0, 1)$, la segunda puntuación es la $y$ de $q$. Con ella fijada, ajusta la $x$ para la primera.',
          ],
          explain:
            'Cada fila de $K$ multiplica a $q$ como un producto escalar, así que $K\\,q$ reúne todas las puntuaciones en un vector. Esto es una matriz que transforma un vector, como en la Órbita 0, solo que ahora sus filas son claves y su resultado, puntuaciones.',
          solution:
            'Hay que poner $q=(1, 1)$. Entonces $K\\,q=(2\\cdot 1+1\\cdot 1,\\ 0\\cdot 1+1\\cdot 1)=(3, 1)$. La segunda puntuación es solo la $y$ de $q$, porque $k_2=(0, 1)$, y la primera, $2x+y=3$, deja $x=1$. Con las consultas de todas las palabras como filas de una matriz $Q$, $QK^{T}$ reúne estas columnas de puntuaciones, una por consulta, en una tabla.',
          plane: transformPlane({
            i: [2, 0],
            j: [1, 1],
            extra: [vec('q', 'q', 1, 0, true)],
            apply: ['q'],
            readouts: ['matrix', 'image'],
            range: 3,
          }),
          goals: [
            { metric: 'img_x', of: ['i', 'j', 'q'], target: 3, tol: 0.01 },
            { metric: 'img_y', of: ['i', 'j', 'q'], target: 1, tol: 0.01 },
          ],
        },
        {
          id: 'atencion.ex00.3',
          type: 'manipular',
          purpose: {
            why: 'Una puntuación de atención no es un coseno: depende también de lo largas que sean la consulta y la clave. Por eso un modelo puede dar más peso a una palabra no solo por hacia dónde apunta su clave, sino por lo grande que es. Y por eso hay que controlar las longitudes, con el escalado y con la normalización, para que el softmax no se sature.',
            aim: 'Vas a buscar una clave $k$ con una puntuación y un ángulo dados respecto de una consulta fija, y a ver cómo se reparten entre la longitud y la dirección.',
            takeaway:
              'Una clave de longitud $2\\sqrt{2}$ a $45°$ de $q$ puntúa $4$, lo mismo que una clave de longitud $2$ perfectamente alineada. Para la atención, una clave más larga compensa un ángulo peor, cosa que el coseno del juego 1 no ve.',
          },
          prompt:
            'La consulta $q=(2, 0)$ queda fija. Mueve la clave $k$, que parte de $(1, 0)$, hasta que su puntuación con $q$ valga **4** y el ángulo entre las dos sea de **45°**. Recuerda que $q\\cdot k=|q|\\,|k|\\cos\\theta$.',
          hints: [
            'Con $k=(1, 0)$ el ángulo es $0°$ y la puntuación, $2$. Para abrir el ángulo y no perder puntuación, ¿qué le pasa a la longitud de $k$?',
            'A $45°$, el coseno vale $\\frac{\\sqrt{2}}{2}$, menos que $1$. Para compensar, $|k|$ tiene que crecer.',
          ],
          explain:
            'La puntuación depende de la longitud de $k$ y del ángulo con $q$. Para una puntuación fija hay muchas claves: una por cada ángulo, con la longitud que haga falta. Fijar además el ángulo deja solo dos, simétricas respecto de $q$.',
          solution:
            'Sirve $k=(2, 2)$: $q\\cdot k=2\\cdot 2+0\\cdot 2=4$ y su ángulo con $q$ es de $45°$. También sirve $(2, -2)$, el simétrico. La longitud de $k$ es $2\\sqrt{2}\\approx 2{,}83$: con $\\cos 45°=\\frac{\\sqrt{2}}{2}$, $|q|\\,|k|\\cos\\theta=2\\cdot 2\\sqrt{2}\\cdot\\frac{\\sqrt{2}}{2}=4$. Una clave alineada con $q$ habría necesitado longitud $2$.',
          plane: {
            range: 3,
            snap: 1,
            vectors: [vec('q', 'q', 2, 0, false), vec('k', 'k', 1, 0, true)],
            readouts: ['dot', 'angle'],
            pair: ['q', 'k'],
          },
          goals: [
            { metric: 'dot', of: ['q', 'k'], target: 4, tol: 0.01 },
            { metric: 'angle', of: ['q', 'k'], target: 45, tol: 0.5 },
          ],
        },
        {
          id: 'atencion.ex00.4',
          type: 'manipular',
          purpose: {
            why: 'La consulta de una palabra no es su embedding: es el resultado de multiplicarlo por una matriz $W_Q$ que el modelo aprende, y la clave sale de otra, $W_K$. Por eso una palabra puede mirar a otra cuyo embedding no se le parece en nada: lo que busca lo decide lo aprendido, no la dirección de su propio vector.',
            aim: 'Vas a buscar el embedding $x$ cuya consulta, tras pasar por $W_Q$, coincide con una clave dada, y a comparar esa consulta con el propio $x$.',
            takeaway:
              'El embedding $(2, 0)$ es perpendicular a la clave, con coseno $0$, y aun así su consulta $(0, 2)$ coincide con ella y puntúa $4$. Qué busca una palabra lo decide la matriz aprendida, no la dirección de su embedding; entrenar la atención es aprender esas matrices.',
          },
          prompt:
            'La consulta no es el embedding $x$ de la palabra, sino $W_Q\\,x$. Aquí $W_Q$ gira $90°$: $\\hat{\\imath}=(0, 1)$ y $\\hat{\\jmath}=(-1, 0)$ son sus columnas (el panel la llama $A$). Una clave $k=(0, 2)$ queda fija. Mueve el embedding $x$, que parte de $(1, 0)$, hasta que su consulta $W_Q\\,x$ valga **$(0, 2)$**, igual que la clave. Fíjate en la lectura del coseno entre $x$ y $k$.',
          hints: [
            'Escribe $W_Q\\,x$ con $x=(a, b)$: la primera coordenada es $-b$ y la segunda, $a$. ¿Qué $a$ y qué $b$ dan $(0, 2)$?',
            'Compara la dirección de $x$ con la de $k$ cuando lo tengas.',
          ],
          explain:
            'La matriz $W_Q$ transforma el embedding antes de compararlo con las claves, así que lo que cuenta es la imagen $W_Q\\,x$, no $x$. Con un giro, $x$ y su consulta apuntan a sitios distintos.',
          solution:
            'Hay que poner $x=(2, 0)$. Entonces $W_Q\\,x=(0\\cdot 2+(-1)\\cdot 0,\\ 1\\cdot 2+0\\cdot 0)=(0, 2)$, que coincide con $k$ y puntúa $0\\cdot 0+2\\cdot 2=4$. Sin embargo, $x$ y $k$ son perpendiculares: su coseno es $0$. Lo que busca una palabra no se lee en su embedding, sino en lo que $W_Q$ hace con él.',
          plane: {
            ...transformPlane({
              i: [0, 1],
              j: [-1, 0],
              extra: [vec('k', 'k', 0, 2, false), vec('x', 'x', 1, 0, true)],
              apply: ['x'],
              readouts: ['matrix', 'image', 'cos'],
              range: 3,
            }),
            pair: ['x', 'k'],
          },
          goals: [
            { metric: 'img_x', of: ['i', 'j', 'x'], target: 0, tol: 0.01 },
            { metric: 'img_y', of: ['i', 'j', 'x'], target: 2, tol: 0.01 },
          ],
        },
        {
          id: 'atencion.ex00.5',
          type: 'manipular',
          purpose: {
            why: 'Después de las puntuaciones y del softmax, cada palabra recibe una salida que es una mezcla de los **valores** de las palabras del contexto, ponderada por sus pesos. Esa mezcla es lo que pasa a la capa siguiente: así una palabra incorpora información de las que ha mirado.',
            aim: 'Vas a buscar los pesos con que hay que mezclar dos valores para obtener una salida dada, comprobando que los pesos suman $1$.',
            takeaway:
              'Los pesos $(0{,}75; 0{,}25)$ dan la salida $(3, 1)$, tres cuartos de $v_1$ y un cuarto de $v_2$. Con pesos que no son negativos y suman $1$, la salida queda en el segmento que une los valores: una media ponderada, y no una suma.',
          },
          prompt:
            'Dos palabras tienen por **valores** $v_1=(4, 0)$ y $v_2=(0, 4)$, que son las columnas de la matriz del panel ($\\hat{\\imath}$ y $\\hat{\\jmath}$; el panel la llama $A$). Los **pesos** de atención $w=(w_1, w_2)$ mezclan los valores: la salida es $w_1\\,v_1+w_2\\,v_2=A\\,w$. Mueve $w$, que parte de $(0{,}5; 0{,}5)$, hasta que la salida valga **$(3, 1)$** y los pesos sumen **1**. El vector fijo $(1, 1)$ sirve para leer esa suma: el producto escalar $w\\cdot(1, 1)$ es $w_1+w_2$.',
          hints: [
            'Con los pesos de partida, la salida es $(2, 2)$: la media de los dos valores. Para acercarla a $v_1$ hay que darle más peso.',
            'Como $v_1$ y $v_2$ son los ejes, cada coordenada de la salida es $4$ por el peso de su valor.',
          ],
          explain:
            'La salida es una combinación de los valores con los pesos como coeficientes. Si los pesos son positivos y suman $1$, es una media ponderada, y queda entre los valores: cuanto más peso, más cerca del valor correspondiente.',
          solution:
            'Hay que poner $w=(0{,}75; 0{,}25)$. Entonces $A\\,w=0{,}75\\cdot(4, 0)+0{,}25\\cdot(0, 4)=(3, 0)+(0, 1)=(3, 1)$, y $w\\cdot(1, 1)=0{,}75+0{,}25=1$. La salida está a tres cuartos del camino de $v_2$ a $v_1$, sobre el segmento que los une.',
          plane: {
            ...transformPlane({
              i: [4, 0],
              j: [0, 4],
              extra: [vec('w', 'w', 0.5, 0.5, true), vec('unos', '(1, 1)', 1, 1, false)],
              apply: ['w'],
              readouts: ['matrix', 'image', 'dot'],
              range: 4,
              snap: 0.25,
            }),
            pair: ['w', 'unos'],
          },
          goals: [
            { metric: 'img_x', of: ['i', 'j', 'w'], target: 3, tol: 0.01 },
            { metric: 'img_y', of: ['i', 'j', 'w'], target: 1, tol: 0.01 },
            { metric: 'dot', of: ['w', 'unos'], target: 1, tol: 0.01 },
          ],
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
            why: 'Cada vez que un modelo de lenguaje genera una palabra, cada capa de atención calcula la puntuación de la consulta con la clave de cada palabra del contexto, y las divide entre $\\sqrt{d_k}$, con $d_k$ el número de componentes de la consulta y de la clave. Es la fórmula del Transformer original (Vaswani et al., 2017), repetida para cada pareja.',
            aim: 'Vas a calcular una puntuación escalada completa: el producto escalar de una consulta con una clave y su división entre $\\sqrt{d_k}$.',
            takeaway:
              'La puntuación escalada es $2$: el producto escalar, $4$, entre $\\sqrt{4}=2$. El escalado no cambia cuál es la clave que más puntúa para una consulta, porque divide todas por lo mismo; solo mantiene las puntuaciones en un tamaño con el que el softmax trabaja bien.',
          },
          prompt:
            'Una consulta $q=(1, 2, 0, 1)$ y una clave $k=(2, 1, 1, 0)$ tienen $d_k=4$ componentes. ¿Cuál es su **puntuación escalada** $\\dfrac{q\\cdot k}{\\sqrt{d_k}}$?',
          hints: [
            'Calcula primero el producto escalar: multiplica componente a componente y suma.',
            'Después divide entre la raíz de $d_k$, no entre $d_k$.',
          ],
          explain:
            'La puntuación es un producto escalar dividido entre la raíz del número de componentes. Dividir entre $d_k$ en vez de entre su raíz da otro número, y no escalar da el producto escalar a secas.',
          solution:
            '$q\\cdot k=1\\cdot 2+2\\cdot 1+0\\cdot 1+1\\cdot 0=4$ y $\\sqrt{4}=2$, así que la puntuación es $\\frac{4}{2}=2$. Si te sale $4$, falta dividir; si te sale $1$, has dividido entre $d_k$ y no entre su raíz.',
          answer: 2,
          tol: 0,
        },
        {
          id: 'atencion.ex01.2',
          type: 'vector',
          purpose: {
            why: 'El softmax convierte las puntuaciones de una palabra en pesos de atención: números no negativos que suman $1$ y que dicen cuánto mira a cada palabra del contexto. Mirar esos pesos es la forma habitual de inspeccionar qué ha atendido una cabeza de atención.',
            aim: 'Vas a calcular los pesos que salen de tres puntuaciones, con el exponencial de cada una dividido entre la suma de los exponenciales.',
            takeaway:
              'Una puntuación mayor se queda con casi el $79\\,\\%$ del peso, aunque solo supera en dos puntos a las otras. El softmax exagera las diferencias, y por eso importa el tamaño de las puntuaciones; sus pesos, además, suman siempre $1$.',
          },
          prompt:
            'Una palabra tiene tres puntuaciones con las claves del contexto: $(2, 0, 0)$. El **softmax** las convierte en pesos: cada peso es $e^{s}$ dividido entre la suma de los tres $e^{s}$. Calcula los tres pesos (usa $e^{2}\\approx 7{,}39$) con dos decimales.',
          hints: [
            'Los exponenciales son $e^{2}\\approx 7{,}39$, $e^{0}=1$ y $e^{0}=1$. Súmalos.',
            'Divide cada exponencial entre esa suma. Los tres pesos tienen que sumar $1$.',
          ],
          explain:
            'Cada peso es positivo y la suma de los tres es $1$. Las dos puntuaciones iguales reciben el mismo peso, y la mayor se lleva mucho más que la mitad.',
          solution:
            'La suma de exponenciales es $7{,}39+1+1=9{,}39$, y los pesos son $\\frac{7{,}39}{9{,}39}\\approx 0{,}79$ y $\\frac{1}{9{,}39}\\approx 0{,}11$ para cada una de las otras dos. Con más decimales, $0{,}787$ y $0{,}107$. Si no te suman $1$, revisa que has dividido entre la suma de los tres exponenciales y no entre $e^{2}$ solo.',
          answer: [0.79, 0.11, 0.11],
          tol: 0.01,
        },
        {
          id: 'atencion.ex01.3',
          type: 'vector',
          purpose: {
            why: 'La salida de una palabra en una capa de atención es la media de los valores de las demás ponderada por sus pesos, y es lo que se pasa a la capa siguiente. Es la manera en que un modelo mezcla información de unas palabras en otras: el resultado de una pregunta como «¿a qué se refiere este pronombre?» se construye así.',
            aim: 'Vas a calcular la salida de una palabra a partir de sus pesos y de los valores de tres palabras, sumando cada valor multiplicado por su peso.',
            takeaway:
              'La salida es $(3, 2)$, más cerca de los valores con más peso. No es la suma de los valores ni su media sin más: cada uno entra en la proporción que marca la atención. En forma de matrices es $\\text{pesos}\\cdot V$, para todas las palabras a la vez.',
          },
          prompt:
            'Tres palabras tienen por valores $v_1=(4, 0)$, $v_2=(0, 4)$ y $v_3=(4, 4)$. Una palabra les reparte los pesos de atención $(0{,}5; 0{,}25; 0{,}25)$. ¿Cuál es su **salida**, la combinación de los valores con esos pesos? Escribe primero la $x$ y después la $y$.',
          hints: [
            'Multiplica cada valor por su peso: $0{,}5\\,v_1$, $0{,}25\\,v_2$ y $0{,}25\\,v_3$.',
            'Suma los tres vectores resultantes, coordenada a coordenada.',
          ],
          explain:
            'La salida es la suma de cada valor por su peso. Como los pesos suman $1$, es una media ponderada y queda entre los valores, no fuera de ellos.',
          solution:
            '$0{,}5\\,(4, 0)+0{,}25\\,(0, 4)+0{,}25\\,(4, 4)=(2, 0)+(0, 1)+(1, 1)=(3, 2)$. Si sumas los valores sin pesos sale $(8, 8)$, y si los promedias a partes iguales, $(2{,}67; 2{,}67)$.',
          answer: [3, 2],
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
          type: 'opcion',
          purpose: {
            why: 'Las puntuaciones de atención se dividen entre $\\sqrt{d_k}$ antes del softmax. Quien implementa o ajusta un modelo se pregunta a menudo por qué esa raíz y no otro número, porque olvidarla, o cambiar $d_k$ sin cambiarla, empeora el entrenamiento aunque el código no dé ningún error.',
            aim: 'Vas a decidir para qué sirve dividir entre $\\sqrt{d_k}$, descartando las funciones que corresponden a otros pasos de la atención.',
            takeaway:
              'Dividir entre $\\sqrt{d_k}$ compensa que el producto escalar de dos vectores sin relación crece en dispersión con el número de componentes. Sin esa división, las puntuaciones grandes saturan el softmax y casi todo el peso va a una sola clave. Es una cuestión de tamaños, no de probabilidades ni de longitudes.',
          },
          prompt:
            'En la atención, las puntuaciones $q\\cdot k$ se dividen entre $\\sqrt{d_k}$ antes del softmax. ¿**Para qué**?',
          hints: [
            'Un producto escalar suma $d_k$ términos. ¿Qué le pasa a su tamaño típico cuando hay más términos?',
            'Pregúntate qué hace el softmax con puntuaciones muy grandes, y qué paso del cálculo es el que convierte en probabilidades.',
          ],
          explain:
            'El producto escalar suma tantos términos como componentes, y esa suma se dispersa más cuanto mayor es $d_k$. Dividir entre su raíz mantiene las puntuaciones en un tamaño estable. Convertir en probabilidades lo hace el softmax, y normalizar la longitud es otra operación, la del coseno.',
          solution:
            'Para que las puntuaciones no crezcan con el número de componentes. Si las componentes son independientes y de tamaño parecido, la dispersión de $q\\cdot k$ crece como $\\sqrt{d_k}$; con puntuaciones muy grandes, el softmax pone casi todo el peso en una sola clave y su gradiente es casi nulo, de modo que el modelo aprende mal. Convertir en probabilidades es trabajo del softmax, y la división no vuelve unitarios los vectores ni acelera nada.',
          options: [
            'Para convertir las puntuaciones en probabilidades que suman $1$',
            'Para que la consulta y la clave tengan longitud $1$, como en el coseno',
            'Para que las puntuaciones no crezcan con el número de componentes y el softmax no ponga casi todo el peso en una sola clave',
            'Para que la tabla de puntuaciones se calcule más deprisa',
          ],
          correct: 2,
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
                'print(m)                                # True por encima de la diagonal, y la diagonal False',
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
