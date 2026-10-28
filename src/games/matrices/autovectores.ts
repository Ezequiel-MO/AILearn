import type { Goal, PlaneVector, Project } from '../../content/schema';
import { py } from '../py';
import { autovectoresWarmup } from './autovectores.calentamiento';
import { transformPlane } from './plane';

/** El vector suelto `v` que se transforma con `apply`. */
const vec = (x: number, y: number, movable: boolean): PlaneVector => ({
  id: 'v',
  label: 'v',
  x,
  y,
  movable,
});

/** Meta sobre el ángulo (en grados) entre v y su imagen A·v. */
const angleGoal = (target: number): Goal => ({
  metric: 'img_angle',
  of: ['i', 'j', 'v'],
  target,
  tol: 0.5,
});

/** Primer proyecto de la Órbita 2 «Direcciones propias»: las flechas que A deja en su recta. */
export const autovectores: Project = {
  id: 'autovectores',
  name: 'Autovectores',
  sub: 'Las flechas que no giran',
  warmup: autovectoresWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'autovectores.ex00.1',
          type: 'manipular',
          purpose: {
            why: 'El algoritmo **PageRank**, con el que Google empezó a ordenar páginas web, multiplica un vector de puntuaciones por la misma matriz una y otra vez. Tras muchas vueltas el vector deja de cambiar de dirección: ha caído en un autovector, y ese autovector es la clasificación. El mismo truco, la iteración de potencias, calcula la primera componente de un PCA sin resolver ninguna ecuación.',
            aim: 'Vas a buscar a mano las flechas que $A$ no saca de su recta y a ver que son muy pocas: casi todas giran, y solo unas direcciones concretas se limitan a estirarse.',
            takeaway:
              'Esta matriz tiene dos rectas propias: la de $(1, 1)$, con $\\lambda=3$, y la de $(1, -1)$, con $\\lambda=1$. Al aplicar $A$ muchas veces, la recta del autovalor mayor arrastra hacia ella a casi cualquier vector: por eso repetir una matriz revela su autovector dominante.',
          },
          prompt:
            'Casi todo vector cambia de dirección cuando se le aplica una matriz. Aquí $A=\\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$: $\\hat{\\imath}$ va a $(2, 1)$ y $\\hat{\\jmath}$ va a $(1, 2)$. La flecha continua es $\\vec{v}$ y la discontinua, su imagen $A\\vec{v}$. Un **autovector** de $A$ es un vector no nulo que la matriz deja en su propia recta, $A\\vec{v}=\\lambda\\vec{v}$, y el número $\\lambda$ es su **autovalor**.\n\nMueve $\\vec{v}$ hasta que la lectura del ángulo entre $\\vec{v}$ y $A\\vec{v}$ sea de $0$ grados, con la coordenada $x$ de $\\vec{v}$ igual a $1$.',
          hints: [
            'Un ángulo de $0$ grados significa que $A\\vec{v}$ apunta exactamente donde apunta $\\vec{v}$. Prueba vectores con $x=1$ y mira cuáles dejan la lectura en $0$.',
            'Con $\\vec{v}=(1, y)$ la imagen es $A\\vec{v}=(2+y,\\ 1+2y)$. Para que sea un múltiplo de $(1, y)$, su segunda componente tiene que ser $y$ veces la primera: $1+2y=y(2+y)$.',
          ],
          explain:
            'Que $A\\vec{v}$ sea más largo o más corto que $\\vec{v}$ no importa: lo que decide si $\\vec{v}$ es un autovector es hacia dónde apunta su imagen. Si el ángulo no es $0$, la matriz ha girado el vector y ya no está en su recta.',
          solution:
            'La ecuación $1+2y=y(2+y)$ se reduce a $y^2=1$, así que hay dos soluciones. Con $\\vec{v}=(1, 1)$, $A\\vec{v}=(3, 3)=3\\vec{v}$: autovalor $\\lambda=3$. Con $\\vec{v}=(1, -1)$, $A\\vec{v}=(1, -1)=1\\cdot\\vec{v}$: autovalor $\\lambda=1$. Cualquiera de las dos vale. Los demás vectores, como el $(1, 0)$ de partida, cuya imagen es $(2, 1)$, cambian de dirección.',
          plane: transformPlane({
            i: [2, 1],
            j: [1, 2],
            extra: [vec(1, 0, true)],
            apply: ['v'],
            readouts: ['matrix', 'image', 'img_angle'],
            range: 4,
            snap: 1,
          }),
          goals: [angleGoal(0), { metric: 'x', of: ['v'], target: 1, tol: 0.01 }],
        },
        {
          id: 'autovectores.ex00.2',
          type: 'manipular',
          purpose: {
            why: 'En la versión más simple de una red recurrente, sin activación, el estado se multiplica por la misma matriz en cada paso de la secuencia. La parte del estado que va en la dirección de un autovector de autovalor $\\lambda$ queda multiplicada por $\\lambda^{n}$ tras $n$ pasos: si $\\lambda$ vale más que $1$, explota; si está entre $-1$ y $1$, se apaga. Es la raíz de la explosión y el desvanecimiento del gradiente.',
            aim: 'Vas a encontrar la segunda dirección propia de una matriz que ya enseña una, y a usar el cociente para leer cuánto estira cada dirección.',
            takeaway:
              'Cada autovector tiene su propio factor: aquí $3$ en el eje $x$ y $2$ en la recta de $(1, -1)$. El cociente solo da ese factor cuando el ángulo es $0$; en otra dirección puede coincidir con un autovalor sin que la flecha sea un autovector, como le pasa a $(0, 1)$.',
          },
          prompt:
            'Ahora $A=\\begin{pmatrix}3&1\\\\0&2\\end{pmatrix}$: $\\hat{\\imath}$ va a $(3, 0)$ y $\\hat{\\jmath}$ va a $(1, 2)$. El vector de partida, $\\vec{v}=(1, 0)$, **ya es** un autovector: $A\\vec{v}=(3, 0)=3\\vec{v}$. Busca el otro, el que $A$ estira por $2$.\n\nLa tercera lectura es el cociente $\\dfrac{\\vec{v}^{T}A\\vec{v}}{\\vec{v}^{T}\\vec{v}}$, que vale $\\lambda$ cuando $\\vec{v}$ es un autovector. Deja el ángulo en $0$ grados y esa lectura en $2$.',
          hints: [
            'Mueve $\\vec{v}$ y mira el ángulo: solo vale $0$ en dos rectas. Una es el eje $x$, donde la lectura marca $3$; en la otra, la lectura es distinta.',
            'La otra recta tiene una coordenada $y$ negativa. Prueba $\\vec{v}=(1, -1)$ y calcula $A\\vec{v}$ a mano.',
          ],
          explain:
            'La lectura del cociente puede valer $2$ en direcciones que no son autovectores, así que sola no basta: tiene que cumplirse a la vez que el ángulo sea $0$. Y el ángulo $0$ también se cumple en el autovector de $\\lambda=3$, donde la lectura vale otra cosa.',
          solution:
            '$A(1, -1)=(3\\cdot 1+1\\cdot(-1),\\ 0\\cdot 1+2\\cdot(-1))=(2, -2)=2\\cdot(1, -1)$: es un autovector de autovalor $\\lambda=2$. Sirve cualquier múltiplo, como $(2, -2)$ o $(3, -3)$, y también el opuesto $(-1, 1)$. En cambio, el vector $(0, 1)$ tiene la lectura en $2$, pero su imagen es $(1, 2)$ y el ángulo no es $0$: no es un autovector.',
          plane: transformPlane({
            i: [3, 0],
            j: [1, 2],
            extra: [vec(1, 0, true)],
            apply: ['v'],
            readouts: ['image', 'img_angle', 'rayleigh'],
            range: 3,
            snap: 1,
          }),
          goals: [angleGoal(0), { metric: 'rayleigh', of: ['i', 'j', 'v'], target: 2, tol: 0.01 }],
        },
        {
          id: 'autovectores.ex00.3',
          type: 'manipular',
          purpose: {
            why: 'El descenso de gradiente sobre una pérdida cuadrática multiplica el error por la misma matriz en cada paso. Si en una dirección propia el autovalor de esa matriz es negativo, el error cambia de signo a cada paso y el entrenamiento salta de un lado a otro del mínimo; si además es menor que $-1$, los saltos crecen y diverge. Es lo que ocurre cuando la tasa de aprendizaje es demasiado alta.',
            aim: 'Vas a encontrar una flecha a la que el espejo da la vuelta sin sacarla de su recta: un autovector de autovalor negativo, con la imagen apuntando al lado contrario.',
            takeaway:
              'Un ángulo de $180$ grados entre $\\vec{v}$ y $A\\vec{v}$ es un autovalor negativo, aquí $\\lambda=-1$: la recta se conserva y el sentido se invierte. Al repetir la matriz, esa componente alterna de signo: en el descenso de gradiente, es el parámetro que salta de un lado a otro del mínimo en cada paso.',
          },
          prompt:
            '$A=\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}$ es el espejo en la diagonal: $\\hat{\\imath}$ y $\\hat{\\jmath}$ se intercambian, $\\hat{\\imath}$ va a $(0, 1)$ y $\\hat{\\jmath}$ va a $(1, 0)$. Un autovector también puede salir **al revés**: si $\\lambda$ es negativo, $A\\vec{v}$ apunta justo al lado opuesto de $\\vec{v}$, pero en la misma recta.\n\nMueve $\\vec{v}$ hasta que la lectura del ángulo entre $\\vec{v}$ y $A\\vec{v}$ sea de $180$ grados.',
          hints: [
            'El espejo intercambia las dos coordenadas: la imagen de $(x, y)$ es $(y, x)$. Para que apunte al lado opuesto de $(x, y)$ hace falta $(y, x)=-k\\cdot(x, y)$, con $k$ positivo.',
            'Prueba con vectores que tengan las dos coordenadas del mismo tamaño y de signo contrario.',
          ],
          explain:
            'Un ángulo de $180$ grados no es un vector que ha girado: es un vector que ha dado la vuelta sin salir de su recta. Eso es un autovector con autovalor negativo. Fíjate en la lectura del cociente, que dice cuál es.',
          solution:
            'Sirve $\\vec{v}=(1, -1)$: $A\\vec{v}=(-1, 1)=-1\\cdot\\vec{v}$, con autovalor $\\lambda=-1$ (la lectura del cociente marca $-1$). Valen también $(2, -2)$, $(3, -3)$ y sus opuestos. Los múltiplos de $(1, 1)$ son el otro autovector del espejo: $A(1, 1)=(1, 1)$, con $\\lambda=1$ y un ángulo de $0$ grados. El espejo deja en su sitio la diagonal y le da la vuelta a la otra.',
          plane: transformPlane({
            i: [0, 1],
            j: [1, 0],
            extra: [vec(2, 1, true)],
            apply: ['v'],
            readouts: ['image', 'img_angle', 'rayleigh'],
            range: 3,
            snap: 1,
          }),
          goals: [angleGoal(180)],
        },
        {
          id: 'autovectores.ex00.4',
          type: 'manipular',
          purpose: {
            why: 'Si una capa de una red neuronal tiene dos columnas en la misma recta, los dos rasgos de entrada que las mueven producen el mismo efecto, y hay una dirección de entrada que la capa manda al origen. Esa información se pierde y ninguna capa posterior la recupera. Lo mismo delata una matriz de covarianza con un autovalor $0$: dos rasgos de los datos son redundantes.',
            aim: 'Vas a buscar la flecha que $A$ aplasta hasta el origen y a ver que, aunque su imagen no tiene dirección, cumple la definición de autovector con $\\lambda=0$.',
            takeaway:
              'El vector $(1, -2)$ y sus múltiplos forman el **núcleo** de $A$: son autovectores de autovalor $0$. Una matriz tiene un $\\lambda=0$ exactamente cuando su determinante es $0$, y entonces no tiene inversa: lo que se aplastó no se puede deshacer.',
          },
          prompt:
            '$A=\\begin{pmatrix}2&1\\\\4&2\\end{pmatrix}$ lleva $\\hat{\\imath}$ a $(2, 4)$ y $\\hat{\\jmath}$ a $(1, 2)$: las dos columnas están en la misma recta y el plano entero se aplasta sobre ella. Un autovector puede tener $\\lambda=0$: es un vector al que $A$ aplasta en el origen, $A\\vec{v}=\\vec{0}=0\\cdot\\vec{v}$.\n\nMueve $\\vec{v}$ hasta que $A\\vec{v}$ llegue a $(0, 0)$, con la coordenada $x$ de $\\vec{v}$ igual a $1$. Cuando lo consigas, la lectura del ángulo dirá «sin ángulo»: el vector nulo no tiene dirección.',
          hints: [
            'Con $\\vec{v}=(1, y)$, la imagen es $A\\vec{v}=(2+y,\\ 4+2y)=(2+y)\\cdot(1, 2)$. Solo hace falta que el número $2+y$ valga $0$.',
            'Mira la lectura de $A\\vec{v}$ mientras mueves $\\vec{v}$: los dos números tienen que ser cero a la vez.',
          ],
          explain:
            'Cuando la matriz aplasta el plano sobre una recta, los vectores que caen en el origen forman una recta entera: el núcleo. Sus vectores cumplen $A\\vec{v}=0\\cdot\\vec{v}$, así que son autovectores de autovalor $0$.',
          solution:
            '$\\vec{v}=(1, -2)$ da $A\\vec{v}=(2\\cdot 1+1\\cdot(-2),\\ 4\\cdot 1+2\\cdot(-2))=(0, 0)$. Con $x=1$ es la única posición, y sin la condición $x=1$ valdría cualquier múltiplo. Un autovector de autovalor $0$ es un vector del núcleo, y una matriz tiene un $\\lambda=0$ cuando su determinante es $0$.',
          plane: transformPlane({
            i: [2, 4],
            j: [1, 2],
            extra: [vec(1, 0, true)],
            apply: ['v'],
            readouts: ['matrix', 'image', 'img_angle'],
            range: 5,
            snap: 1,
          }),
          goals: [
            { metric: 'img_x', of: ['i', 'j', 'v'], target: 0, tol: 0.01 },
            { metric: 'img_y', of: ['i', 'j', 'v'], target: 0, tol: 0.01 },
            { metric: 'x', of: ['v'], target: 1, tol: 0.01 },
          ],
        },
        {
          id: 'autovectores.ex00.5',
          type: 'manipular',
          purpose: {
            why: 'Decir qué direcciones conserva una matriz y cuánto estira cada una basta para fijarla entera. Así se diseña un **filtro**: unas direcciones se mantienen y otras se atenúan o se refuerzan. Las redes neuronales de grafos con filtros espectrales trabajan así, y PCA hace lo mismo cuando conserva unas componentes y descarta las demás.',
            aim: 'Vas a montar la matriz a partir de lo que debe hacer con dos flechas fijas, moviendo sus columnas, y a ver cuántas matrices cumplen las dos condiciones.',
            takeaway:
              'Con $\\vec{v}$ estirado por $2$ y $\\vec{w}$ quieto sale $A=\\begin{pmatrix}3&-1\\\\2&0\\end{pmatrix}$, cuyos cuatro números no dejan ver nada de eso. Los autovectores y autovalores son la descripción legible de una matriz; sus números, la que guarda el ordenador.',
          },
          prompt:
            'Ahora se construye la matriz a partir de sus autovectores. Los vectores $\\vec{v}=(1, 1)$ y $\\vec{w}=(1, 2)$ están fijos, y lo que se mueve son $\\hat{\\imath}$ y $\\hat{\\jmath}$, que son las columnas de $A$. Coloca las columnas para que $A\\vec{v}=(2, 2)$ y $A\\vec{w}=(1, 2)$: así $\\vec{v}$ es un autovector de autovalor $2$ y $\\vec{w}$ lo es de autovalor $1$.\n\nAl empezar, con la identidad, $\\vec{w}$ ya cumple su meta porque la identidad deja quieto cualquier vector. Cuando muevas las columnas dejará de cumplirla, y tendrás que recuperarla.',
          hints: [
            'La matriz lleva $(x, y)$ a $x\\cdot\\hat{\\imath}+y\\cdot\\hat{\\jmath}$. Por tanto $A\\vec{v}=\\hat{\\imath}+\\hat{\\jmath}$ y $A\\vec{w}=\\hat{\\imath}+2\\hat{\\jmath}$.',
            'Resta las dos ecuaciones para despejar $\\hat{\\jmath}$ y después despeja $\\hat{\\imath}$.',
          ],
          explain:
            'Las condiciones $A\\vec{v}=(2, 2)$ y $A\\vec{w}=(1, 2)$ son dos ecuaciones con vectores, y sus incógnitas son las dos columnas. Cada una combina $\\hat{\\imath}$ y $\\hat{\\jmath}$ con las coordenadas del vector al que se aplica.',
          solution:
            'De $\\hat{\\imath}+\\hat{\\jmath}=(2, 2)$ y $\\hat{\\imath}+2\\hat{\\jmath}=(1, 2)$, restando, $\\hat{\\jmath}=(-1, 0)$, y entonces $\\hat{\\imath}=(2, 2)-(-1, 0)=(3, 2)$. La matriz es $A=\\begin{pmatrix}3&-1\\\\2&0\\end{pmatrix}$ y es la única que cumple las dos condiciones. Comprobación: $A\\vec{v}=(3-1,\\ 2+0)=(2, 2)=2\\vec{v}$ y $A\\vec{w}=(3-2,\\ 2+0)=(1, 2)=\\vec{w}$.',
          plane: transformPlane({
            movable: true,
            extra: [vec(1, 1, false), { id: 'w', label: 'w', x: 1, y: 2, movable: false }],
            apply: ['v', 'w'],
            readouts: ['matrix', 'image'],
            range: 3,
            snap: 1,
          }),
          goals: [
            { metric: 'img_x', of: ['i', 'j', 'v'], target: 2, tol: 0.01 },
            { metric: 'img_y', of: ['i', 'j', 'v'], target: 2, tol: 0.01 },
            { metric: 'img_x', of: ['i', 'j', 'w'], target: 1, tol: 0.01 },
            { metric: 'img_y', of: ['i', 'j', 'w'], target: 2, tol: 0.01 },
          ],
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
            why: 'Muchos sistemas repiten un paso de transición: un navegante que salta entre pantallas de una aplicación, un recomendador que pasa de un producto a otro. La proporción de tiempo que se pasa en cada sitio a largo plazo es un autovector de la matriz de transición, con autovalor $1$. Comprobar que un candidato lo es se hace con $A\\vec{v}=\\lambda\\vec{v}$.',
            aim: 'Vas a calcular $A\\vec{v}$ para una flecha concreta y a decidir si sale un múltiplo de ella. Verás que la comprobación de un autovector es una sola multiplicación, y que además te da el factor.',
            takeaway:
              'Cuando $A\\vec{v}$ sale paralelo a $\\vec{v}$, el factor es el autovalor y la flecha es una dirección propia. Es la prueba que se usa para validar lo que devuelve una biblioteca, como `np.linalg.eig`: si $A\\vec{v}$ y $\\lambda\\vec{v}$ no coinciden, algo falla en el cálculo.',
          },
          prompt:
            'Sea $A=\\begin{pmatrix}4&1\\\\2&3\\end{pmatrix}$ y $\\vec{v}=(1, -2)$. Comprueba que $\\vec{v}$ es un autovector de $A$ calculando $A\\vec{v}$, y escribe su autovalor $\\lambda$, el número con $A\\vec{v}=\\lambda\\vec{v}$.',
          hints: [
            'Calcula $A\\vec{v}$: cada componente es una fila de $A$ por $\\vec{v}$.',
            'Compara $A\\vec{v}$ con $\\vec{v}$: ¿por qué número hay que multiplicar $(1, -2)$ para obtener $A\\vec{v}$? Tiene que ser el mismo en las dos componentes.',
          ],
          explain:
            'Un autovector conserva su recta: la matriz solo lo estira, lo encoge o le da la vuelta. El factor es el autovalor, y tiene que salir igual en las dos componentes; si saliesen dos factores distintos, el vector no sería un autovector.',
          solution:
            '$A\\vec{v}=(4\\cdot 1+1\\cdot(-2),\\ 2\\cdot 1+3\\cdot(-2))=(2, -4)=2\\cdot(1, -2)$. El factor $2$ sale en las dos componentes, así que $\\vec{v}$ es un autovector y $\\lambda=2$. Si te sale $4$, has leído una entrada de la matriz en vez de comparar $A\\vec{v}$ con $\\vec{v}$.',
          answer: 2,
          tol: 0,
        },
        {
          id: 'autovectores.ex01.2',
          type: 'vector',
          purpose: {
            why: 'Al depurar código que usa `np.linalg.eig`, o al estudiar si un sistema que se repite en bucle se mantiene estable, conviene tener una forma rápida de saber cuánto estira la matriz. En $2\\times 2$ la traza y el determinante bastan para obtener los dos autovalores a mano y contrastarlos con lo que devuelve la máquina.',
            aim: 'Vas a plantear la ecuación de segundo grado con la traza y el determinante y a resolverla. Verás que dos números de la matriz resumen los dos factores de estiramiento.',
            takeaway:
              'La traza es la suma de los autovalores y el determinante, su producto: con eso se pueden comprobar de un vistazo los resultados de cualquier biblioteca. Los autovalores dicen cuánto estira la matriz en cada dirección, y de su tamaño depende si repetirla acaba en una explosión, en un olvido o en algo estable.',
          },
          prompt:
            'Los autovalores de $A$ son las soluciones de $\\det(A-\\lambda I)=0$. Para una matriz de $2\\times 2$ esa ecuación es $\\lambda^2-t\\lambda+d=0$, con $t$ la traza (la suma de los dos números de la diagonal) y $d=\\det A$. Con la misma $A=\\begin{pmatrix}4&1\\\\2&3\\end{pmatrix}$, escribe sus dos autovalores, de menor a mayor.',
          hints: [
            'La traza es la suma de los dos números de la diagonal, y el determinante es $ad-bc$.',
            'Resuelve $\\lambda^2-t\\lambda+d=0$: busca dos números que sumen $t$ y que multipliquen $d$.',
          ],
          explain:
            'Un autovalor hace que $A-\\lambda I$ aplaste el plano, y eso ocurre justo cuando su determinante vale $0$. Al desarrollarlo sale una ecuación de segundo grado con dos soluciones; cuida el orden pedido.',
          solution:
            'La traza es $4+3=7$ y el determinante es $4\\cdot 3-1\\cdot 2=10$, luego $\\lambda^2-7\\lambda+10=(\\lambda-2)(\\lambda-5)=0$ y los autovalores son $2$ y $5$. Comprobación: $2+5=7$ es la traza y $2\\cdot 5=10$ es el determinante.',
          answer: [2, 5],
          tol: 0,
        },
        {
          id: 'autovectores.ex01.3',
          type: 'vector',
          purpose: {
            why: 'En el agrupamiento espectral, los puntos o los documentos se unen en una red según lo parecidos que son, y los grupos se leen en los autovectores de una matriz de esa red. Sacar el autovector de un autovalor dado, resolviendo $(A-\\lambda I)\\vec{v}=\\vec{0}$, es el paso que hace cualquier biblioteca por dentro.',
            aim: 'Vas a resolver el sistema de ecuaciones de $(A-5I)\\vec{v}=\\vec{0}$ y a dar la flecha que sale. Verás que el autovector no es un número único, sino una recta entera, y que se fija con la primera componente.',
            takeaway:
              'Un autovector está definido salvo escala: cualquier múltiplo de $(1, 1)$ sirve, y por eso las bibliotecas lo devuelven con norma $1$. En el agrupamiento espectral lo que importa de un autovector no es su tamaño, sino cómo se reparten sus componentes entre los puntos, porque esa repartición decide a qué grupo va cada uno.',
          },
          prompt:
            'Con la misma $A=\\begin{pmatrix}4&1\\\\2&3\\end{pmatrix}$, un autovector de autovalor $\\lambda=5$ cumple $(A-5I)\\vec{v}=\\vec{0}$. Escribe el autovector de $\\lambda=5$ cuya primera componente es $1$.',
          hints: [
            'Escribe $A-5I$, restando $5$ a cada número de la diagonal, y plantea las dos ecuaciones de $(A-5I)\\vec{v}=\\vec{0}$ con $\\vec{v}=(1, y)$.',
            'Las dos ecuaciones dicen lo mismo. Despeja $y$ en cualquiera de ellas.',
          ],
          explain:
            'Al restar $\\lambda I$ con un autovalor, las dos filas de la matriz quedan alineadas, y por eso las dos ecuaciones son la misma. Queda una recta de soluciones, no un solo vector; la primera componente fija cuál se pide.',
          solution:
            '$A-5I=\\begin{pmatrix}-1&1\\\\2&-2\\end{pmatrix}$. Con $\\vec{v}=(1, y)$ la primera fila da $-1+y=0$, o sea $y=1$, y la segunda da $2-2y=0$, el mismo resultado. El autovector es $(1, 1)$, y se comprueba con $A(1, 1)=(5, 5)=5\\cdot(1, 1)$. El $(1, -2)$ de antes no vale: es el autovector de $\\lambda=2$.',
          answer: [1, 1],
          tol: 0,
        },
        {
          id: 'autovectores.ex01.4',
          type: 'opcion',
          purpose: {
            why: 'Algunos modelos de lenguaje codifican la posición de cada palabra girando pares de componentes de su vector. Una transformación así no estira nada, solo gira, y por eso no deja ninguna dirección en su sitio. Saber detectar a ojo qué matrices no tienen autovectores reales evita buscar direcciones propias donde no las hay.',
            aim: 'Vas a revisar cuatro matrices, cada una con su efecto sobre el plano, y a decidir cuál no conserva ninguna recta. Verás que la ecuación de segundo grado de los autovalores lo anuncia sin dibujar nada.',
            takeaway:
              'Un giro tiene sus autovalores complejos: no hay recta que se conserve, solo se cambia la orientación. En una red recurrente, autovalores complejos con módulo cercano a $1$ son señal de oscilación, no de crecimiento ni de olvido. Cuando $\\lambda^2-t\\lambda+d=0$ no tiene solución real, hay que mirar los autovalores complejos.',
          },
          prompt:
            'Un autovector real es un vector que la matriz deja en su recta. ¿Cuál de estas matrices **no deja ninguna recta en su sitio**, es decir, no tiene autovectores reales?',
          hints: [
            'Piensa en cada matriz como una transformación del plano: las columnas dicen adónde van $\\hat{\\imath}$ y $\\hat{\\jmath}$. Busca para cada una una recta que se quede donde estaba.',
            'Una de las cuatro cambia la dirección de todos los vectores. Escribe su ecuación $\\lambda^2-t\\lambda+d=0$ y mira si tiene solución real.',
          ],
          explain:
            'Los autovalores reales son las soluciones reales de $\\lambda^2-t\\lambda+d=0$. Si esa ecuación no tiene solución real, no hay ningún vector que la matriz deje en su recta. Revisa las cuatro.',
          solution:
            'El giro $\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$ tiene traza $0$ y determinante $1$, así que $\\lambda^2+1=0$, que no tiene solución real: gira todos los vectores un cuarto de vuelta y ninguno se queda en su recta. La cizalla $\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$ deja el eje $x$ en su sitio, con $\\lambda=1$. El espejo $\\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}$ deja los dos ejes, con $\\lambda=1$ y $\\lambda=-1$. La escala $\\begin{pmatrix}2&0\\\\0&3\\end{pmatrix}$ también deja los dos ejes, con $\\lambda=2$ y $\\lambda=3$.',
          options: [
            '$\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$',
            '$\\begin{pmatrix}2&0\\\\0&3\\end{pmatrix}$',
            '$\\begin{pmatrix}0&-1\\\\1&0\\end{pmatrix}$',
            '$\\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}$',
          ],
          correct: 2,
        },
        {
          id: 'autovectores.ex01.5',
          type: 'numero',
          purpose: {
            why: 'Al entrenar una red recurrente, el gradiente vuelve hacia atrás por la secuencia y en cada paso se multiplica otra vez por la misma matriz. Si en una dirección el factor es mayor que $1$, el gradiente crece como una potencia con el número de pasos, y el entrenamiento se desboca.',
            aim: 'Vas a aplicar $W$ diez veces a un autovector, en lugar de hacer diez multiplicaciones de matrices, y a calcular cuánto mide el resultado. Verás qué ocurre con un factor aparentemente pequeño cuando se repite.',
            takeaway:
              'Un autovector de autovalor $\\lambda=2$ queda con longitud $2^{10}=1024$ tras diez pasos: con $\\lambda$ mayor que $1$, la señal crece como una potencia. Por eso, en secuencias largas, se recorta el gradiente cuando supera un tope, o se usan arquitecturas que controlan este factor para que no explote ni se apague.',
          },
          prompt:
            'Una red recurrente aplica la misma matriz $W$ en cada paso: el estado $\\vec{h}$ pasa a $W\\vec{h}$, después a $W^2\\vec{h}$, y así sucesivamente. Si el estado inicial $\\vec{v}$ es un autovector de $W$ con autovalor $\\lambda=2$ y mide $1$, ¿cuánto mide el estado tras $10$ pasos, $W^{10}\\vec{v}$?',
          hints: [
            'Calcula $W^2\\vec{v}=W(W\\vec{v})$ y fíjate en qué le pasa al factor $\\lambda$.',
            'Cada paso multiplica el vector por el mismo número. ¿Cuántas veces se multiplica en $10$ pasos?',
          ],
          explain:
            'Aplicar $W$ a un autovector solo lo multiplica por $\\lambda$, y el resultado sigue siendo un autovector con el mismo $\\lambda$. Así, cada paso añade un factor: se elevan los autovalores a una potencia, no se suman ni se multiplican por el número de pasos.',
          solution:
            '$W\\vec{v}=2\\vec{v}$, $W^2\\vec{v}=4\\vec{v}$, y en general $W^{10}\\vec{v}=2^{10}\\vec{v}$, que mide $1024$. Si fuera $\\lambda=0{,}5$, el estado se apagaría: $0{,}5^{10}\\approx 0{,}001$. Es la razón por la que los gradientes de una red recurrente explotan cuando $\\lvert\\lambda\\rvert>1$ y se desvanecen cuando $\\lvert\\lambda\\rvert<1$. Si te sale $20$, has multiplicado $10$ por $2$ en vez de elevar.',
          answer: 1024,
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
