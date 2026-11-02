import type { PlaneSpec, PlaneVector, Project } from '../../content/schema';
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
      questions: [],
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
