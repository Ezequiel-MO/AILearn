import type { Goal, PlaneSpec, PlaneVector, Project } from '../../content/schema';
import { py } from '../py';
import { rangoBajoWarmup } from './rango-bajo.calentamiento';
import { transformPlane, type TransformPlaneOptions } from './plane';

/** Un vector del plano. */
const vec = (id: string, x: number, y: number, movable: boolean): PlaneVector => ({
  id,
  label: id,
  x,
  y,
  movable,
});

/** Plano con la matriz en las columnas î y ĵ y la elipse imagen de la circunferencia unidad (con rango 1, un segmento). */
const ellipsePlane = (o: TransformPlaneOptions): PlaneSpec => ({
  ...transformPlane(o),
  circle: 1,
  circleImage: true,
});

/** Meta sobre cuánto estira la matriz la dirección de un vector: |A·v| / |v|. */
const stretchGoal = (id: string, target: number): Goal => ({
  metric: 'stretch',
  of: ['i', 'j', id],
  target,
  tol: 0.01,
});

/** Meta sobre una componente de la imagen A·v de un vector. */
const imageGoal = (axis: 'x' | 'y', id: string, target: number): Goal => ({
  metric: axis === 'x' ? 'img_x' : 'img_y',
  of: ['i', 'j', id],
  target,
  tol: 0.01,
});

/** Segundo proyecto de la Órbita 3 de matrices: aproximación de rango bajo y LoRA. */
export const rangoBajo: Project = {
  id: 'rango-bajo',
  name: 'Rango bajo y LoRA',
  sub: 'Comprimir y afinar',
  bigPicture: {
    parts: ['compress', 'linear'],
    text: 'LoRA afina un modelo sin tocar sus pesos originales: aprende solo un cambio de rango bajo, $\\Delta W=BA$, con una fracción pequeña de los parámetros. Es la idea del rango y de la SVD puesta a trabajar. Aquí aproximas una matriz con pocas direcciones y cuentas cuánto ahorras y cuánto pierdes.',
  },
  warmup: rangoBajoWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'rango-bajo.ex00.1',
          type: 'manipular',
          purpose: {
            why: 'Una capa lineal cuya matriz tiene rango bajo ignora casi todo lo que recibe: solo mira unas pocas combinaciones de la entrada. Saber qué entradas borra una matriz de rango $1$ ayuda a decidir si una capa comprimida, o una actualización de rango pequeño, puede distinguir lo que necesita distinguir.',
            aim: 'Vas a mover $v$ para encontrar las entradas que esta matriz borra por completo y a ver cómo la elipse imagen de la circunferencia unidad se aplasta hasta ser un segmento.',
            takeaway:
              'Una matriz de rango $1$ lee un solo número de la entrada, su producto escalar con $(1, 1)$, y borra toda la recta perpendicular. Su segundo valor singular es $0$. Una capa así tiene una sola dirección de salida: todo lo que no pase por esa lectura se pierde.',
          },
          prompt:
            'Una matriz de **rango 1** es un producto de una columna por una fila: $A=u\\,w^{T}$ con $u=(2, 1)$ y $w^{T}=(1, 1)$, es decir, $A=\\begin{pmatrix}2&2\\\\1&1\\end{pmatrix}$. Sus dos columnas, $\\hat{\\imath}$ y $\\hat{\\jmath}$, son iguales. La elipse es lo que $A$ hace con la circunferencia unidad. La lectura $|Av|\\,/\\,|v|$ dice cuánto estira $A$ la dirección de $v$, sin depender de su longitud. Mueve $v$, que parte de $(1, 0)$, hasta que esa lectura valga **0**: una entrada que $A$ borra por completo. El vector nulo no vale.',
          hints: [
            'Fíjate en la elipse: si todas las imágenes caen en una recta, hay una dirección de entrada que se aplasta contra el origen.',
            'Escribe $Av$ con $v=(a, b)$: sale $(2a+2b,\\ a+b)$. ¿Cuándo es nulo?',
          ],
          explain:
            'Como $\\hat{\\imath}=\\hat{\\jmath}$, $Av$ solo depende de la suma $a+b$ de las coordenadas de $v$. Para que $Av$ sea nulo esa suma tiene que ser $0$, y eso fija la dirección de $v$ sin fijar su longitud.',
          solution:
            'Sirve cualquier $v$ sobre la recta de $(1, -1)$: $(1, -1)$, $(2, -2)$ o $(-1, 1)$. Con $v=(1, -1)$, $Av=(2-2,\\ 1-1)=(0, 0)$. En general $Av=(v_x+v_y)\\,(2, 1)$: solo cuenta la suma $v_x+v_y$, el producto escalar de $v$ con $(1, 1)$. La recta de $(1, -1)$ es perpendicular a $(1, 1)$ y $A$ la borra entera. Por eso la elipse queda reducida a un segmento sobre la recta de $(2, 1)$ y el segundo valor singular es $0$.',
          plane: ellipsePlane({
            i: [2, 1],
            j: [2, 1],
            extra: [vec('v', 1, 0, true)],
            apply: ['v'],
            readouts: ['matrix', 'stretch'],
            range: 3,
          }),
          goals: [stretchGoal('v', 0)],
        },
        {
          id: 'rango-bajo.ex00.2',
          type: 'manipular',
          purpose: {
            why: 'El mayor valor singular de una matriz es lo máximo que puede alargar una capa a su entrada, y se vigila para que el entrenamiento sea estable. En una matriz de rango $1$ ese valor sale de las dos flechas que la forman, y entender de dónde sale ayuda a leer el tamaño de una actualización de rango pequeño.',
            aim: 'Vas a mover $v$ hasta la dirección que más estira esta matriz y a comprobar que ese estiramiento máximo no depende de la longitud de $v$.',
            takeaway:
              'El único valor singular distinto de cero de $u\\,w^{T}$ es $|u|\\cdot|w|=\\sqrt{5}\\cdot\\sqrt{2}=\\sqrt{10}$. Todas las imágenes caen en la recta de $u$ y el máximo se da al entrar por la dirección de $w$. Una actualización de rango $1$ es grande si lo son sus dos flechas.',
          },
          prompt:
            'La misma matriz $A=\\begin{pmatrix}2&2\\\\1&1\\end{pmatrix}=u\\,w^{T}$, con $u=(2, 1)$ y $w=(1, 1)$. Ahora se busca lo contrario: la dirección que más estira. La lectura $|Av|\\,/\\,|v|$ vale hoy $2{,}24$ con $v=(1, 0)$. Mueve $v$ hasta que valga **3,16**, que es el mayor valor singular de $A$, $\\sigma_{1}$.',
          hints: [
            'Prueba $v=(0, 1)$ y $v=(1, 1)$, y compara con $v=(1, 0)$. Las lecturas no son iguales.',
            'Calcula $|u|=\\sqrt{5}$ y $|w|=\\sqrt{2}$ y multiplícalos. ¿Con qué dirección de entrada se alcanza?',
          ],
          explain:
            'En una matriz $u\\,w^{T}$ la salida siempre va en la dirección de $u$, y su tamaño es $|u|$ por la parte de $v$ que va en la dirección de $w$. Esa parte es la mayor cuando $v$ apunta como $w$.',
          solution:
            'Sirve cualquier $v$ sobre la recta de $(1, 1)$: $(1, 1)$, $(2, 2)$ o $(-1, -1)$. Con $v=(1, 1)$, $Av=(4, 2)$ y $\\frac{|Av|}{|v|}=\\frac{\\sqrt{20}}{\\sqrt{2}}=\\sqrt{10}\\approx 3{,}16$. Es $|u|\\cdot|w|=\\sqrt{5}\\cdot\\sqrt{2}$. Cualquier otra dirección da menos: $(1, 0)$ da $\\sqrt{5}\\approx 2{,}24$ y $(1, -1)$ da $0$. Con $\\sigma_{1}=\\sqrt{10}$, $u_{1}=u/|u|$ y $v_{1}=w/|w|$, $A=\\sigma_{1}\\,u_{1}v_{1}^{T}$.',
          plane: ellipsePlane({
            i: [2, 1],
            j: [2, 1],
            extra: [vec('v', 1, 0, true)],
            apply: ['v'],
            readouts: ['stretch', 'image'],
            range: 3,
          }),
          goals: [stretchGoal('v', 3.16)],
        },
        {
          id: 'rango-bajo.ex00.3',
          type: 'manipular',
          purpose: {
            why: 'LoRA afina un modelo grande sin tocar sus pesos $W$: entrena una actualización $\\Delta W=BA$ de rango pequeño, donde $B$ es una columna (o unas pocas) y $A$ una fila. Con rango $1$, $B$ dice hacia dónde escribe el cambio y $A$ qué lee de la entrada. Entenderlo ayuda a elegir cuántas direcciones se dejan cambiar.',
            aim: 'Vas a construir con $\\hat{\\imath}$ y $\\hat{\\jmath}$ una actualización de rango $1$ que reaccione a una entrada y se quede muda ante otra.',
            takeaway:
              'Sale $\\Delta W=(1, 2)^{T}(1, 1)$, es decir, $\\hat{\\imath}=\\hat{\\jmath}=(1, 2)$. La columna $(1, 2)$ es lo que escribe y la fila $(1, 1)$ es lo que lee: la actualización solo reacciona a la parte de la entrada que va en esa dirección. Una actualización de rango pequeño solo puede cambiar el modelo en pocas direcciones.',
          },
          prompt:
            'En LoRA, la actualización $\\Delta W=BA$ de rango $r=1$ es una columna $B$ por una fila $A$. Aquí el panel la llama $A$ y sus columnas son $\\hat{\\imath}$ y $\\hat{\\jmath}$, que parten de la identidad. Hay dos entradas de prueba fijas, $p=(1, 1)$ y $q=(1, -1)$, y el panel enseña la salida de cada una. Construye la matriz de modo que la actualización mande $p$ a **$(2, 4)$** y deje **muda** a $q$: su salida tiene que ser $(0, 0)$.',
          hints: [
            'La salida de $q=(1, -1)$ es $\\hat{\\imath}-\\hat{\\jmath}$. ¿Cuándo es eso nulo?',
            'La salida de $p=(1, 1)$ es $\\hat{\\imath}+\\hat{\\jmath}$. Si ya sabes cómo son las dos columnas, esa suma es el doble de una de ellas.',
          ],
          explain:
            'Dejar muda a $q$ obliga a que las dos columnas sean iguales, y por eso la matriz tiene rango $1$. Después, la salida de $p$ fija esa columna. Solo hay una solución.',
          solution:
            'Con $\\hat{\\imath}-\\hat{\\jmath}=(0, 0)$ las dos columnas coinciden, y con $\\hat{\\imath}+\\hat{\\jmath}=2\\hat{\\imath}=(2, 4)$ sale $\\hat{\\imath}=\\hat{\\jmath}=(1, 2)$. La matriz es $\\begin{pmatrix}1&1\\\\2&2\\end{pmatrix}=(1, 2)^{T}(1, 1)$: $B=(1, 2)^{T}$ es la columna donde escribe y $A=(1, 1)$ la fila con la que lee. Es una actualización de rango $r=1$: toda salida va en la recta de $(1, 2)$.',
          plane: transformPlane({
            movable: true,
            extra: [vec('p', 1, 1, false), vec('q', 1, -1, false)],
            apply: ['p', 'q'],
            readouts: ['matrix', 'image'],
            range: 3,
            snap: 1,
          }),
          goals: [
            imageGoal('x', 'p', 2),
            imageGoal('y', 'p', 4),
            imageGoal('x', 'q', 0),
            imageGoal('y', 'q', 0),
          ],
        },
        {
          id: 'rango-bajo.ex00.4',
          type: 'manipular',
          purpose: {
            why: 'Comprimir una capa es sustituir su matriz por una de rango menor que haga casi lo mismo. Las direcciones que la matriz apenas usa se descartan, y las que más estira se conservan. Ver con una matriz pequeña qué se queda y qué se pierde enseña a juzgar si una compresión es razonable.',
            aim: 'Vas a partir de una matriz con una dirección fuerte y otra débil y a construir su mejor aproximación de rango $1$, conservando lo que hace en la dirección fuerte.',
            takeaway:
              'La mejor aproximación de rango $1$ es $A_{1}=\\sigma_{1}u_{1}v_{1}^{T}=\\begin{pmatrix}1{,}5&1{,}5\\\\1{,}5&1{,}5\\end{pmatrix}$: hace lo mismo que $A$ en la dirección fuerte y manda a $0$ la débil. El error en la peor dirección es $\\sigma_{2}=1$ y se conserva $\\frac{9}{9+1}=90\\,\\%$ de la energía.',
          },
          prompt:
            'La matriz $A=\\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$ tiene valores singulares $3$ y $1$. Estira por $3$ la dirección de $p=(1, 1)$, la fuerte, y por $1$ la de $q=(1, -1)$, la débil. El panel llama $A$ a la matriz que forman $\\hat{\\imath}$ y $\\hat{\\jmath}$, que parten de ella. Modifícalos hasta tener la **mejor aproximación de rango 1**: que siga mandando $p$ a **$(3, 3)$**, como $A$, pero que mande $q$ a **$(0, 0)$**.',
          hints: [
            'Con $A$ ya se cumple lo de $p$ y lo de $q$ no. ¿Qué tienen que cumplir las dos columnas para que $q$ vaya a cero?',
            'Si las columnas son iguales, $\\hat{\\imath}+\\hat{\\jmath}=2\\hat{\\imath}$ tiene que ser $(3, 3)$.',
          ],
          explain:
            'Quedarse con la dirección fuerte y descartar la débil es la aproximación de rango $1$. Las dos columnas se hacen iguales, y su valor lo fija lo que debe seguir pasando con $p$.',
          solution:
            'Hay que poner $\\hat{\\imath}=\\hat{\\jmath}=(1{,}5;\\ 1{,}5)$. Entonces $A_{1}p=(3, 3)$ y $A_{1}q=(0, 0)$. Es $\\sigma_{1}u_{1}v_{1}^{T}=3\\cdot\\frac{(1, 1)}{\\sqrt{2}}\\cdot\\frac{(1, 1)}{\\sqrt{2}}=\\frac{3}{2}\\begin{pmatrix}1&1\\\\1&1\\end{pmatrix}$. Se ha descartado $\\sigma_{2}=1$, que es lo más que se equivoca $A_{1}$ en una dirección, y se conserva $\\frac{3^{2}}{3^{2}+1^{2}}=90\\,\\%$ de la energía.',
          plane: ellipsePlane({
            i: [2, 1],
            j: [1, 2],
            movable: true,
            extra: [vec('p', 1, 1, false), vec('q', 1, -1, false)],
            apply: ['p', 'q'],
            readouts: ['matrix', 'image'],
            range: 3,
            snap: 0.5,
          }),
          goals: [
            imageGoal('x', 'p', 3),
            imageGoal('y', 'p', 3),
            imageGoal('x', 'q', 0),
            imageGoal('y', 'q', 0),
          ],
        },
        {
          id: 'rango-bajo.ex00.5',
          type: 'manipular',
          purpose: {
            why: 'Comprimir una capa tiene un precio: la matriz de rango bajo no distingue entradas que antes distinguía. Lo mismo vale para una actualización de LoRA con $r$ pequeño, que solo cambia el modelo en unas pocas direcciones. Ver cuántas entradas dan la misma salida ayuda a medir lo que se pierde.',
            aim: 'Vas a buscar entradas distintas que esta matriz de rango $1$ transforma en la misma salida, y a ver que no es una sola.',
            takeaway:
              'Todas las entradas con $x+y=2$ dan la misma salida, $(4, 2)$, y la matriz no puede distinguirlas: esa información se ha perdido. Es el precio del rango bajo, y por eso hay que elegir cuánto rango se deja.',
          },
          prompt:
            'La misma matriz de rango $1$, $A=\\begin{pmatrix}2&2\\\\1&1\\end{pmatrix}$, con $\\hat{\\imath}=\\hat{\\jmath}=(2, 1)$ fijos. La lectura de la imagen enseña $Av$, que hoy vale $(2, 1)$ con $v=(1, 0)$. Mueve $v$ hasta que $Av$ sea **$(4, 2)$**. Hay más de una posición que lo logra: encuentra una y mira qué tienen en común las que valen.',
          hints: [
            'Con $v=(a, b)$, $Av=(a+b)\\,(2, 1)$. ¿Qué valor tiene que tomar $a+b$?',
            'Prueba una posición y luego otra distinta: la lectura se queda igual si mantienes la suma.',
          ],
          explain:
            'Como la salida solo depende de $a+b$, entradas muy diferentes comparten salida. Con una matriz de rango $1$ no se puede recuperar la entrada a partir de la salida.',
          solution:
            'Sirve cualquier $v$ con $v_x+v_y=2$: $(2, 0)$, $(1, 1)$, $(0, 2)$ o $(3, -1)$. Todas dan $Av=2\\,(2, 1)=(4, 2)$. La información de en qué punto de esa recta estaba la entrada se ha perdido. Una capa de rango bajo hace eso con muchas direcciones, y es el precio de usar pocos números.',
          plane: transformPlane({
            i: [2, 1],
            j: [2, 1],
            extra: [vec('v', 1, 0, true)],
            apply: ['v'],
            readouts: ['image'],
            range: 3,
          }),
          goals: [imageGoal('x', 'v', 4), imageGoal('y', 'v', 2)],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'rango-bajo.ex01.1',
          type: 'vector',
          purpose: {
            why: 'Una actualización de LoRA es el producto de dos matrices delgadas, y con rango $1$ es el producto de una columna por una fila. Saber construirlo, y ver su patrón, ayuda a reconocer en los pesos de un modelo una matriz que guarda en realidad muy poca información.',
            aim: 'Vas a multiplicar una columna por una fila y a escribir la matriz que resulta. Verás cómo se repiten sus filas.',
            takeaway:
              'Cada fila del resultado es un múltiplo de $(3, -1, 2)$: la segunda es el doble de la primera. Por eso el rango es $1$. Se describe con los $5$ números de $u$ y $v$ en lugar de los $6$ de la matriz, y con matrices grandes el ahorro es enorme.',
          },
          prompt:
            'Una matriz de rango $1$ es un **producto exterior**: una columna $u$ por una fila $v^{T}$, de modo que el elemento de la fila $i$ y la columna $j$ vale $u_{i}\\,v_{j}$. Con $u=(1, 2)$ y $v=(3, -1, 2)$, calcula $u\\,v^{T}$, una matriz de 2 filas y 3 columnas. Escríbela fila por fila.',
          hints: [
            'La primera fila es $u_{1}=1$ por $v$; la segunda es $u_{2}=2$ por $v$.',
            'El resultado tiene tantas filas como $u$ y tantas columnas como $v$.',
          ],
          explain:
            'Cada fila del producto exterior es la fila $v^{T}$ multiplicada por un número de $u$. Si multiplicas elemento a elemento, o pones $v$ como columna, las formas no son las de $2\\times 3$.',
          solution:
            'La fila 1 es $1\\cdot(3, -1, 2)=(3, -1, 2)$ y la fila 2 es $2\\cdot(3, -1, 2)=(6, -2, 4)$. La matriz es $\\begin{pmatrix}3&-1&2\\\\6&-2&4\\end{pmatrix}$. Si te sale de 3 filas y 2 columnas, has calculado $v\\,u^{T}$, que es la traspuesta.',
          answer: [3, -1, 2, 6, -2, 4],
          shape: [2, 3],
          tol: 0,
        },
        {
          id: 'rango-bajo.ex01.2',
          type: 'numero',
          purpose: {
            why: 'Guardar y servir un modelo cuesta memoria, y las matrices de pesos son lo que más ocupa. Una matriz grande se puede sustituir por dos factores delgados cuando su información cabe en pocas direcciones. Contar los números de cada forma permite decidir si compensa comprimir una capa.',
            aim: 'Vas a contar los números que se guardan con la matriz entera y con sus dos factores de rango $20$, y a ver cuánto se ahorra.',
            takeaway:
              'Se pasa de $800000$ a $36000$ números, unas $22$ veces menos. Pero solo sale a cuenta si al truncar la matriz se pierde poco, y eso lo dicen sus valores singulares: si decaen despacio, el rango necesario es alto y el ahorro desaparece.',
          },
          prompt:
            'Una matriz de pesos tiene $1000$ filas y $800$ columnas. Se sustituye por su mejor aproximación de rango $20$, que se guarda como dos factores delgados: uno de $1000\\times 20$ y otro de $20\\times 800$ (los valores singulares ya van multiplicados dentro de uno de ellos). ¿Cuántos números se guardan en total con los dos factores? Escribe el número sin separadores.',
          hints: [
            'Cada factor guarda tantos números como filas por columnas tiene.',
            'Suma los números de los dos factores, y compáralo con las $1000\\cdot 800$ de la matriz entera.',
          ],
          explain:
            'Se guardan los dos factores, no su producto: $1000\\cdot 20$ del primero más $20\\cdot 800$ del segundo. Es la regla $k\\,(m+n)$ para una matriz de $m\\times n$ y rango $k$.',
          solution:
            '$1000\\cdot 20+20\\cdot 800=20000+16000=36000$, es decir, $20\\,(1000+800)$. La matriz entera tiene $1000\\cdot 800=800000$ números. Si te sale $16000000$, has multiplicado los tres tamaños; si te sale $1840$, has sumado los tamaños en vez de multiplicarlos por el rango.',
          answer: 36000,
          tol: 0,
        },
        {
          id: 'rango-bajo.ex01.3',
          type: 'opcion',
          purpose: {
            why: 'Al comprimir una matriz hay que elegir el rango $k$ que se queda. Un criterio habitual es conservar una fracción de la energía, la suma de los cuadrados de los valores singulares, igual que la varianza explicada en PCA. Es la decisión entre comprimir mucho y perder poco.',
            aim: 'Vas a calcular la energía que conserva cada rango con unos valores singulares dados y a elegir el menor que llega al $90\\,\\%$.',
            takeaway:
              'Hacen falta $2$ piezas, que conservan $\\frac{36+9}{50}=90\\,\\%$ de la energía; con una sola se queda en el $72\\,\\%$. Si se acumularan los valores singulares sin elevarlos al cuadrado saldrían $3$ piezas, y se guardaría más de lo necesario.',
          },
          prompt:
            'Una matriz tiene valores singulares $6$, $3$, $2$ y $1$. La **energía** que conserva su aproximación de rango $k$ es la suma de los cuadrados de sus $k$ primeros valores singulares dividida entre la suma de los cuadrados de todos. ¿Cuál es el menor $k$ que conserva al menos el $90\\,\\%$ de la energía?',
          hints: [
            'Eleva al cuadrado cada valor singular y suma los cuatro: ese es el total.',
            'Acumula los cuadrados de mayor a menor y mira cuándo llegas al $90\\,\\%$ del total.',
          ],
          explain:
            'La energía se mide con los cuadrados de los valores singulares, no con ellos mismos. Se acumula desde el mayor y se para en el primer $k$ que llega al umbral.',
          solution:
            'Los cuadrados son $36$, $9$, $4$ y $1$, y suman $50$. Con $k=1$ se conserva $\\frac{36}{50}=72\\,\\%$, y con $k=2$, $\\frac{36+9}{50}=90\\,\\%$, que llega justo al umbral. Hace falta $k=2$. Si acumulas los valores singulares sin elevarlos al cuadrado, $\\frac{6+3}{12}=75\\,\\%$ y $\\frac{6+3+2}{12}\\approx 92\\,\\%$, sale $k=3$.',
          options: ['k = 1', 'k = 2', 'k = 3', 'k = 4'],
          correct: 1,
        },
        {
          id: 'rango-bajo.ex01.4',
          type: 'numero',
          purpose: {
            why: 'Cuando se trunca una matriz hay que saber cuánto se pierde para decidir si el modelo comprimido sigue sirviendo. El error de Frobenius, la raíz de la suma de los cuadrados de los elementos de la diferencia, se sabe sin construir la aproximación: basta con los valores singulares descartados.',
            aim: 'Vas a calcular el error de la mejor aproximación de rango $2$ a partir de los valores singulares que se descartan, sin calcular la matriz aproximada.',
            takeaway:
              'El error es $\\sqrt{2^{2}+1^{2}}=\\sqrt{5}\\approx 2{,}24$, frente a un tamaño total de $\\sqrt{50}\\approx 7{,}07$. Ninguna otra matriz de rango $2$ se acerca más a $A$ (Eckart y Young), así que ese es el mínimo error que cuesta comprimir a ese rango.',
          },
          prompt:
            'La misma matriz, con valores singulares $6$, $3$, $2$ y $1$, se aproxima por su mejor matriz de rango $2$, $A_{2}$, la que conserva los dos valores singulares mayores. El error de Frobenius $\\lVert A-A_{2}\\rVert_{F}$ es la raíz cuadrada de la suma de los cuadrados de los valores singulares que se descartan. Calcúlalo, con dos decimales.',
          hints: [
            'Se descartan los dos últimos valores singulares. ¿Cuáles son?',
            'Eleva esos dos al cuadrado, suma y saca la raíz cuadrada.',
          ],
          explain:
            'El error depende solo de lo que se descarta, y se mide con la suma de cuadrados y su raíz. Restar los valores singulares sin más, o sumar los conservados, no es esa cuenta.',
          solution:
            'Se descartan $2$ y $1$: $\\sqrt{2^{2}+1^{2}}=\\sqrt{5}\\approx 2{,}24$. Si te sale $3$ es que has sumado $2+1$ sin cuadrados, y si te sale $6{,}71$ has calculado la raíz de lo que se conserva, $\\sqrt{36+9}$.',
          answer: 2.24,
          tol: 0.01,
        },
        {
          id: 'rango-bajo.ex01.5',
          type: 'numero',
          purpose: {
            why: 'LoRA permite afinar un modelo grande entrenando solo dos matrices delgadas por cada matriz de pesos elegida, en lugar de la matriz entera. Eso reduce la memoria del entrenamiento y deja un archivo de cambios pequeño. Contar los parámetros entrenables es la cuenta básica para decidir el rango $r$.',
            aim: 'Vas a contar los parámetros que se entrenan con $B$ y $A$ en una matriz cuadrada grande y a compararlos con entrenarla entera.',
            takeaway:
              'Se entrenan $65536$ números en lugar de los $16777216$ de una $\\Delta W$ completa, unas $256$ veces menos. El coste crece con $r$, de forma que duplicar el rango duplica los parámetros, y por eso se usan rangos pequeños, como $4$, $8$ o $16$.',
          },
          prompt:
            'LoRA afina una matriz de pesos congelada $W$ de $4096\\times 4096$ sumándole $\\Delta W=BA$, con $B$ de $4096\\times r$ y $A$ de $r\\times 4096$. Solo se entrenan $B$ y $A$. Con $r=8$, ¿cuántos parámetros se entrenan en total entre $B$ y $A$? Escribe el número sin separadores.',
          hints: [
            'Cuenta los números de $B$ y los de $A$ por separado.',
            'Hay una fórmula: $r\\,(d+k)$ para una matriz de $d\\times k$. Compárala con $d\\cdot k$.',
          ],
          explain:
            'Se suman los números de las dos matrices delgadas, no se multiplican los tres tamaños. Y solo se entrenan $B$ y $A$: $W$ sigue congelada.',
          solution:
            '$B$ tiene $4096\\cdot 8=32768$ números y $A$ tiene $8\\cdot 4096=32768$, así que $65536$ en total, es decir, $8\\,(4096+4096)$. Entrenar una $\\Delta W$ completa serían $4096\\cdot 4096=16777216$. Si te sale $134217728$, has multiplicado los tres tamaños, $4096\\cdot 4096\\cdot 8$.',
          answer: 65536,
          tol: 0,
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'rango-bajo.ex02.1',
          type: 'codigo',
          prompt:
            '`u` y `v` son dos vectores de 3 números y `x` es una entrada de 3 números. Una matriz de **rango 1** se construye con una sola pareja: una columna `u` por una fila `v`. Guarda en `A` esa matriz de 3 filas y 3 columnas (el **producto exterior** de `u` y `v`: en la fila $i$ y la columna $j$ vale $u_i\\cdot v_j$); en `rango_A` su rango; en `lee` el único número que `A` saca de `x`, que es el producto escalar de `v` con `x`; y en `y` la salida `A @ x`. Si todo va bien, `y` es `lee` veces `u`: la matriz solo lee `x` a lo largo de `v` y siempre escribe a lo largo de `u`.',
          hints: [
            'El plan son cuatro líneas. `A`: `np.outer(u, v)` multiplica cada número de `u` por cada número de `v` y da la tabla de 3 por 3; ojo, `u * v` multiplica posición a posición y da solo 3 números, y `np.outer(v, u)` da la traspuesta. `rango_A`: `np.linalg.matrix_rank(A)`. `lee`: el producto escalar `v @ x`, un solo número. `y`: `A @ x`. Al final, `y` debe ser `lee` veces `u`.',
            'Las piezas, con otros números:\n\n' +
              py(
                'a = np.array([1, 2])',
                'b = np.array([10, 20, 30])',
                'T = np.outer(a, b)',
                'print(T)                          # [[10 20 30] [20 40 60]]: fila i = a[i] por b',
                'print(T.shape)                    # (2, 3): una fila por número de a, una columna por número de b',
                'print(a * a)                      # [1 4]: posición a posición, NO es el producto exterior',
                'print(np.linalg.matrix_rank(T))   # 1: todas las filas son múltiplos de b',
                'print(b @ b)                      # 1400: el producto escalar es un solo número',
                'print(T @ b)                      # [1400 2800]: es 1400 veces a',
              ) +
              '\n\nCada salida de una matriz de rango 1 es un múltiplo de la columna: aquí, de `a`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'A = np.outer(___, ___)',
                'rango_A = np.linalg.matrix_rank(___)',
                'lee = v @ ___',
                'y = A @ ___',
              ) +
              '\n\nEl error típico es `np.outer(v, u)`: sale una matriz de la misma forma, pero traspuesta, y lee por donde tendría que escribir.',
          ],
          explain:
            'El producto exterior `np.outer(u, v)` es la matriz de rango 1 más pequeña que existe: una columna por una fila. Su salida para cualquier entrada es siempre un múltiplo de `u`, y el múltiplo lo decide `v @ x`. Por eso `A` solo ve de `x` ese único número, y lo demás se pierde. Revisa el orden de los dos vectores: invertirlos traspone la matriz.',
          solution:
            '`np.outer(u, v)` da $\\begin{pmatrix}2&-2&4\\\\1&-1&2\\\\3&-3&6\\end{pmatrix}$, con rango 1: cada fila es un múltiplo de $(1;\\ -1;\\ 2)$. Con $x=(4;\\ 3;\\ 1)$, `lee` vale $4-3+2=3$ y `y` vale $3\\,u=(6;\\ 3;\\ 9)$. Errores típicos: `u * v`, que multiplica posición a posición y deja solo 3 números; `np.outer(v, u)`, que da la traspuesta; o `u @ x` en lugar de `v @ x`, que es lo que lee la matriz por la derecha y vale 14.',
          requirements: [
            '`A` es un array de NumPy de 3 filas y 3 columnas: el producto exterior de `u` por `v`, con `u` en las filas y `v` en las columnas.',
            '`rango_A` es un número entero: el rango de `A`.',
            '`lee` es un solo número: el producto escalar de `v` con `x`.',
            '`y` es un array de 3 números: la salida de `A` para `x`.',
          ],
          starter: `import numpy as np

u = np.array([2, 1, 3])
v = np.array([1, -1, 2])
x = np.array([4, 3, 1])
# u, v y x: arrays de NumPy con 3 números cada uno. u va en las filas de A y v en sus columnas.

# PASO 1. A: la matriz de rango 1 hecha con u y v.
# Por qué: es la pieza más sencilla de una descomposición, una columna por una fila.
# np.outer(a, b) multiplica cada número de a por cada número de b y da una tabla con una
# fila por número de a y una columna por número de b. Por ejemplo, np.outer([1, 2], [10, 20, 30])
# da [[10, 20, 30], [20, 40, 60]]. Ojo con el orden: np.outer(b, a) es la traspuesta.
# Resultado esperado: un array de 3 filas y 3 columnas.
A = None

# PASO 2. rango_A: el rango de A.
# Por qué: dice cuántas direcciones independientes tiene la matriz. Una pareja da una sola.
# np.linalg.matrix_rank(M) devuelve el rango de M, un número entero.
# Resultado esperado: un número entero.
rango_A = None

# PASO 3. lee: el único número que A saca de x.
# Por qué: A solo mira la parte de x que va a lo largo de v. Lo demás lo borra.
# El producto escalar de dos arrays de la misma longitud se escribe a @ b y da un solo número:
# np.array([1, 2]) @ np.array([3, 4]) da 11.
# Resultado esperado: un solo número.
lee = None

# PASO 4. y: lo que devuelve A al recibir x.
# Por qué: comprueba que la salida es siempre un múltiplo de u.
# M @ x, con M de 3 por 3 y x de 3 números, da otro array de 3 números.
# Resultado esperado: un array con 3 números.
y = None

# Para ver qué vale algo antes de entregar: print(y) y pulsa «Ejecutar».
`,
          checks: `_u = np.array([2, 1, 3])
_v = np.array([1, -1, 2])
_x = np.array([4, 3, 1])
_A = np.outer(_u, _v)
_a = isinstance(A, np.ndarray) and A.shape == (3, 3) and np.issubdtype(A.dtype, np.number)
_a3 = isinstance(A, np.ndarray) and A.shape == (3,)
_aok = _a and bool(np.allclose(A, _A))
check(_a or not _a3, "\`A\` tiene solo 3 números: parece el producto posición a posición. El producto exterior tiene una fila por número de \`u\` y una columna por número de \`v\`, 3 filas y 3 columnas.")
check(_a or _a3, "\`A\` tiene que ser un array de NumPy de 3 filas y 3 columnas: el producto exterior de \`u\` por \`v\`.")
check((not _a) or _aok or not np.allclose(A, _A.T), "\`A\` está traspuesta: la fila i tiene que ser el número i de \`u\` por \`v\`, no al revés.")
check((not _a) or _aok or np.allclose(A, _A.T), "\`A\` tiene que tener en la fila i y la columna j el número i de \`u\` por el número j de \`v\`.")
_r = isinstance(rango_A, (int, np.integer)) and not isinstance(rango_A, (bool, np.bool_))
check(_r, "\`rango_A\` tiene que ser un número entero: el rango de \`A\`.")
check((not _r) or (not _aok) or rango_A == 1, "\`rango_A\` tiene que ser el rango de \`A\`. Una matriz hecha con una sola columna por una sola fila tiene un rango muy bajo.")
_l = isinstance(lee, (int, float, np.integer, np.floating)) and not isinstance(lee, (bool, np.bool_))
check(_l, "\`lee\` tiene que ser un solo número: el producto escalar de \`v\` con \`x\`.")
check((not _l) or abs(float(lee) - 14) > 1e-9, "\`lee\` vale 14, el producto escalar de \`u\` con \`x\`. La matriz mira \`x\` solo a lo largo de \`v\`, la fila que lo multiplica.")
check((not _l) or abs(float(lee) - 14) < 1e-9 or abs(float(lee) - 3) < 1e-9, "\`lee\` tiene que ser el producto escalar de \`v\` con \`x\`: multiplica los números de las mismas posiciones y suma.")
_y = isinstance(y, np.ndarray) and y.shape == (3,) and np.issubdtype(y.dtype, np.number)
check(_y, "\`y\` tiene que ser un array de NumPy con 3 números: la salida de \`A\` para \`x\`.")
check((not _y) or (not _aok) or bool(np.allclose(y, _A @ _x)), "\`y\` tiene que ser \`A\` por \`x\`, y sale un múltiplo de \`u\`: el múltiplo es lo que \`A\` toma de \`x\`.")
`,
          reference: `import numpy as np

u = np.array([2, 1, 3])
v = np.array([1, -1, 2])
x = np.array([4, 3, 1])
# Guarda en A el producto exterior de u y v, en rango_A su rango, en lee el producto escalar de v con x y en y la salida A @ x
A = np.outer(u, v)
rango_A = np.linalg.matrix_rank(A)
lee = v @ x
y = A @ x
`,
        },
        {
          id: 'rango-bajo.ex02.2',
          type: 'codigo',
          prompt:
            '`M` es una matriz de 4 filas y 3 columnas. Su descomposición en valores singulares la parte en piezas de rango 1, $M=\\sigma_{1}u_{1}v_{1}^{T}+\\sigma_{2}u_{2}v_{2}^{T}+\\sigma_{3}u_{3}v_{3}^{T}$, de la mayor a la menor. Calcula `U, S, Vt = np.linalg.svd(M, full_matrices=False)` y guarda en `A1` la mejor aproximación de **rango 1** (solo la primera pieza) y en `A2` la mejor de **rango 2** (las dos primeras piezas), las dos de 4 filas y 3 columnas. Son `M` con los detalles pequeños descartados.',
          hints: [
            'El plan: primero la línea `U, S, Vt = np.linalg.svd(M, full_matrices=False)`. Después, cada aproximación es la suma de las primeras piezas, y esa suma se escribe de una vez como un producto de tres matrices: las primeras `k` **columnas** de `U`, la matriz diagonal con los primeros `k` valores de `S` y las primeras `k` **filas** de `Vt`. Para `A1` es `k = 1` y para `A2`, `k = 2`. Ojo: cortar `Vt` por columnas en vez de por filas, o dejar fuera `S`, da otra cosa.',
            'Las piezas, con otra matriz:\n\n' +
              py(
                'N = np.array([[3, 0], [0, 2], [0, 0]])',
                'P, s, Qt = np.linalg.svd(N, full_matrices=False)',
                'print(P.shape, s, Qt.shape)       # (3, 2) [3. 2.] (2, 2): P tiene 2 columnas, s tiene 2 números',
                'print(P[:, :1].shape)             # (3, 1): la primera columna de P, como columna',
                'print(Qt[:1].shape)               # (1, 2): la primera fila de Qt, como fila',
                'print(np.diag(s[:1]))             # [[3.]]: la matriz diagonal con el primer valor',
                'pieza = P[:, :1] @ np.diag(s[:1]) @ Qt[:1]',
                'print(pieza.round(2))             # [[3. 0.] [0. 0.] [0. 0.]]: la pieza mayor de N',
              ) +
              '\n\nEn `M[:, :k]` se cortan columnas y en `M[:k]`, filas. Una pieza de rango 1 tiene siempre la forma de `M`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'U, S, Vt = np.linalg.svd(M, full_matrices=False)',
                'A1 = U[:, :___] @ np.diag(S[:___]) @ Vt[:___]',
                'A2 = U[:, :___] @ np.diag(S[:___]) @ Vt[:___]',
              ) +
              '\n\nEl error típico es cortar `Vt` por columnas, `Vt[:, :k]`, en vez de por filas: la forma deja de encajar.',
          ],
          explain:
            'Cada pieza $\\sigma_{i}u_{i}v_{i}^{T}$ tiene rango 1, y quedarse con las $k$ mayores da la mejor matriz de rango $k$. En el producto de tres matrices, `U` se corta por columnas y `Vt` por filas: una columna de `U` y una fila de `Vt` forman una pieza. Comprueba que `A1` y `A2` tienen la forma de `M`.',
          solution:
            'Los valores singulares de `M` son $4{,}71$, $3{,}09$ y $2{,}08$. `A1 = U[:, :1] @ np.diag(S[:1]) @ Vt[:1]` es la primera pieza, y `A2` añade la segunda; la primera fila de `A2` es $(2{,}96;\\ 1{,}11;\\ -0{,}08)$, cercana a la de `M`, que es $(3;\\ 1;\\ 0)$. Errores típicos: olvidar `np.diag(S[:k])`, de modo que las piezas pierden su peso; quedarse con la pieza más pequeña, cortando las últimas columnas de `U`; o tomar en `A2` solo la segunda pieza, sin la primera.',
          requirements: [
            '`A1` es un array de NumPy de 4 filas y 3 columnas: la mejor aproximación de `M` con rango 1, hecha con la primera pieza de la descomposición.',
            '`A2` es un array de NumPy de 4 filas y 3 columnas: la mejor aproximación de `M` con rango 2, hecha con las dos primeras piezas.',
            'Se acepta una diferencia diminuta de redondeo. Los signos de `U` y `Vt` pueden variar, pero el producto no cambia.',
          ],
          starter: `import numpy as np

M = np.array([[3, 1, 0], [1, 3, 1], [0, 1, 3], [2, 0, 1]])
# M: un array de NumPy de 4 filas y 3 columnas.

# PASO 1. U, S, Vt: la descomposición de M en valores singulares.
# Por qué: separa M en piezas de rango 1, ordenadas de la que más pesa a la que menos.
# np.linalg.svd(M, full_matrices=False) devuelve TRES cosas, y se recogen así:
#   U, S, Vt = np.linalg.svd(M, full_matrices=False)
#   U: 4 por 3; sus COLUMNAS son las direcciones de salida de las piezas.
#   S: un array de 3 números, los valores singulares, de MAYOR a MENOR (no es una matriz).
#   Vt: 3 por 3; sus FILAS son las direcciones de entrada de las piezas.
# Escribe esa línea antes de A1.

# PASO 2. A1: la mejor aproximación de rango 1, o sea, la primera pieza.
# Por qué: quedarse con la pieza que más pesa conserva lo principal de M.
# M[:, :k] se queda con las k primeras COLUMNAS y M[:k] con las k primeras FILAS.
# np.diag(S[:k]) hace una matriz diagonal con los k primeros valores singulares.
# U[:, :k] @ np.diag(S[:k]) @ Vt[:k] suma las k primeras piezas de una vez.
# Resultado esperado: un array de 4 filas y 3 columnas.
A1 = None

# PASO 3. A2: la mejor aproximación de rango 2, o sea, las dos primeras piezas.
# Por qué: con una pieza más, la aproximación se parece más a M.
# Es lo mismo que en el paso anterior con k = 2. Ojo: la suma de las DOS primeras, no solo la segunda.
# Resultado esperado: un array de 4 filas y 3 columnas.
A2 = None

# Para ver qué vale algo antes de entregar: print(A2.round(2)) y pulsa «Ejecutar».
`,
          checks: `_M = np.array([[3, 1, 0], [1, 3, 1], [0, 1, 3], [2, 0, 1]], dtype=float)
_U, _S, _Vt = np.linalg.svd(_M, full_matrices=False)
def _pieza(i):
    return _S[i] * np.outer(_U[:, i], _Vt[i])
_r1 = _pieza(0)
_r2 = _pieza(0) + _pieza(1)
_menor = _pieza(2)
def _arr(a):
    return isinstance(a, np.ndarray) and a.shape == (4, 3) and np.issubdtype(a.dtype, np.number)
_a = _arr(A1)
_aok = _a and bool(np.allclose(A1, _r1))
check(_a, "\`A1\` tiene que ser un array de NumPy de 4 filas y 3 columnas: la aproximación de rango 1 de \`M\`.")
check((not _a) or _aok or not np.allclose(A1, _U[:, :1] @ _Vt[:1]), "\`A1\` no usa los valores singulares: cada columna de \`U\` tiene que multiplicarse por su valor de \`S\`, por ejemplo con \`np.diag(S[:1])\` entre las dos matrices.")
check((not _a) or _aok or not np.allclose(A1, _menor), "\`A1\` es la pieza más pequeña de \`M\`. La mejor aproximación se queda con las primeras columnas de \`U\` y las primeras filas de \`Vt\`, que son las que más pesan.")
check((not _a) or _aok or np.allclose(A1, _U[:, :1] @ _Vt[:1]) or np.allclose(A1, _menor), "\`A1\` tiene que ser la primera pieza de \`M\`: la primera columna de \`U\` por el primer valor de \`S\` por la primera fila de \`Vt\`.")
_b = _arr(A2)
_bok = _b and bool(np.allclose(A2, _r2))
check(_b, "\`A2\` tiene que ser un array de NumPy de 4 filas y 3 columnas: la aproximación de rango 2 de \`M\`.")
check((not _b) or _bok or not np.allclose(A2, _r1), "\`A2\` es igual que la aproximación de rango 1: falta añadir la segunda pieza.")
check((not _b) or _bok or not np.allclose(A2, _pieza(1)), "\`A2\` solo tiene la segunda pieza. La aproximación de rango 2 suma las dos primeras piezas.")
check((not _b) or _bok or not np.allclose(A2, _U[:, :2] @ _Vt[:2]), "\`A2\` no usa los valores singulares: cada columna de \`U\` tiene que multiplicarse por su valor de \`S\`, por ejemplo con \`np.diag(S[:2])\` entre las dos matrices.")
check((not _b) or _bok or np.allclose(A2, _r1) or np.allclose(A2, _pieza(1)) or np.allclose(A2, _U[:, :2] @ _Vt[:2]), "\`A2\` tiene que ser la suma de las dos primeras piezas de \`M\`, las que más pesan.")
`,
          reference: `import numpy as np

M = np.array([[3, 1, 0], [1, 3, 1], [0, 1, 3], [2, 0, 1]])
# Calcula la descomposición de M; guarda en A1 la aproximación de rango 1 y en A2 la de rango 2
U, S, Vt = np.linalg.svd(M, full_matrices=False)
A1 = U[:, :1] @ np.diag(S[:1]) @ Vt[:1]
A2 = U[:, :2] @ np.diag(S[:2]) @ Vt[:2]
`,
        },
        {
          id: 'rango-bajo.ex02.3',
          type: 'codigo',
          prompt:
            '`A` es una matriz de 5 filas y 4 columnas, `S` guarda sus valores singulares de mayor a menor y `A2` es su aproximación de rango 2, que ya está calculada. Comprueba que el error de la aproximación se lee en los valores que se descartan. Guarda en `error_total` la norma de Frobenius de `A - A2` (la raíz de la suma de los cuadrados de todos sus números); en `error_formula` la raíz de la suma de los cuadrados de los valores singulares descartados, los de `S` desde la posición 2 en adelante; y en `error_peor` el mayor estiramiento de `A - A2`, o sea, cuánto puede diferir como máximo la salida de `A` de la de `A2` para una entrada de longitud 1. Los dos primeros coinciden.',
          hints: [
            'El plan son tres líneas. `error_total`: `np.linalg.norm(A - A2)`, que sin más argumentos es la norma de Frobenius. `error_formula`: cuadrados de los valores singulares descartados (`S[2:]` son los que quedan desde la posición 2), sumados y con raíz; si no los elevas al cuadrado, el resultado no coincide. `error_peor`: el mayor estiramiento de una matriz es su mayor valor singular, y se pide con `np.linalg.norm(A - A2, 2)`. Piensa cuál de los valores descartados es el mayor.',
            'Las piezas, con otros valores singulares:\n\n' +
              py(
                'sv = np.array([5.0, 3.0, 2.0, 1.0])',
                'print(sv[1:])                     # [3. 2. 1.]: desde la posición 1 hasta el final',
                'print(sv[1:] ** 2)                # [9. 4. 1.]: cada uno al cuadrado',
                'print(np.sqrt(np.sum(sv[1:] ** 2)))   # 3.7416573867739413: la raíz de 14',
                'D = np.diag([3.0, 4.0])',
                'print(np.linalg.norm(D))          # 5.0: Frobenius, la raíz de 9 + 16',
                'print(np.linalg.norm(D, 2))       # 4.0: el mayor estiramiento, el mayor valor singular',
              ) +
              '\n\nEl mayor de los valores descartados es el primero de los que quedan fuera: el de la posición 2.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'error_total = np.linalg.norm(___ - A2)',
                'error_formula = np.sqrt(np.sum(S[___:] ___ 2))',
                'error_peor = np.linalg.norm(A - A2, ___)',
              ) +
              '\n\nEl error típico en `error_formula` es sumar los valores sin elevarlos al cuadrado: la raíz de la suma no es la norma.',
          ],
          explain:
            'El error total de la mejor aproximación de rango $k$ es la raíz de la suma de los cuadrados de los valores singulares descartados, y el error en la peor dirección es el primero que se descarta, $\\sigma_{k+1}$. Son dos formas de medir lo mismo: una suma todos los detalles perdidos y la otra mira solo el mayor. Comprueba que `error_total` y `error_formula` coinciden.',
          solution:
            'Con $k=2$ se descartan $\\sigma_{3}=2{,}86$ y $\\sigma_{4}=1{,}69$. El error total vale $\\sqrt{2{,}86^{2}+1{,}69^{2}}=3{,}32$, y es el valor de `error_total` y el de `error_formula`. El error en la peor dirección es solo el primero que se descarta, $2{,}86$, y es `error_peor`. Errores típicos: sumar los valores singulares sin elevarlos al cuadrado, que da $2{,}13$; empezar la suma en la posición 1, que incluye un valor que la aproximación sí conserva; o dar como peor dirección el error total.',
          requirements: [
            '`error_total`, `error_formula` y `error_peor` son números, no arrays.',
            '`error_total` es la norma de Frobenius de la diferencia entre `A` y `A2`, y `error_formula` calcula lo mismo desde los valores singulares: coinciden.',
            '`error_peor` es el mayor estiramiento de la diferencia entre `A` y `A2`, no su error total.',
            'Se acepta una diferencia diminuta de redondeo.',
          ],
          starter: `import numpy as np

A = np.array([[4, 0, 2, 1], [1, 3, 0, 2], [2, 1, 5, 0], [0, 2, 1, 4], [3, 1, 2, 2]])
U, S, Vt = np.linalg.svd(A, full_matrices=False)
A2 = U[:, :2] @ np.diag(S[:2]) @ Vt[:2]
# A: un array de NumPy de 5 filas y 4 columnas. S: sus 4 valores singulares, de mayor a menor.
# A2: la mejor aproximación de A con rango 2, ya hecha. Se han descartado S[2] y S[3].

# PASO 1. error_total: cuánto se ha perdido en total al pasar de A a A2.
# Por qué: es el tamaño de todo lo que la aproximación no recoge.
# np.linalg.norm(M) es la norma de Frobenius de M: la raíz de la suma de los cuadrados de todos
# sus números. Por ejemplo, con np.array([[3, 0], [0, 4]]) da 5.
# Resultado esperado: un solo número.
error_total = None

# PASO 2. error_formula: lo mismo, calculado solo con los valores singulares descartados.
# Por qué: así se sabe cuánto se perderá antes de comprimir, sin construir A2.
# S[2:] son los valores de S desde la posición 2 hasta el final (S[0] es el primero).
# x ** 2 eleva al cuadrado cada número de x; np.sum suma; np.sqrt saca la raíz.
# Resultado esperado: un solo número, igual que error_total.
error_formula = None

# PASO 3. error_peor: lo máximo que puede diferir la salida de A de la de A2 con una entrada de longitud 1.
# Por qué: el error total reparte la pérdida entre todas las direcciones; este mira la peor.
# np.linalg.norm(M, 2) es el mayor valor singular de M, o sea, su mayor estiramiento.
# Resultado esperado: un solo número.
error_peor = None

# Para ver qué vale algo antes de entregar: print(error_total) y pulsa «Ejecutar».
`,
          checks: `_A = np.array([[4, 0, 2, 1], [1, 3, 0, 2], [2, 1, 5, 0], [0, 2, 1, 4], [3, 1, 2, 2]], dtype=float)
_u, _s, _vt = np.linalg.svd(_A, full_matrices=False)
_A2 = _u[:, :2] @ np.diag(_s[:2]) @ _vt[:2]
_tot = float(np.sqrt(np.sum(_s[2:] ** 2)))
_pe = float(_s[2])
def _num(v):
    return isinstance(v, (int, float, np.integer, np.floating)) and not isinstance(v, (bool, np.bool_))
def _is(v, w):
    return abs(float(v) - w) < 1e-6
_a = _num(error_total)
check(_a, "\`error_total\` tiene que ser un solo número: la norma de Frobenius de la diferencia entre \`A\` y \`A2\`.")
check((not _a) or _is(error_total, _tot) or not _is(error_total, _pe), "\`error_total\` es el mayor estiramiento de la diferencia, no su norma de Frobenius. Para el error total no hace falta el segundo argumento de \`np.linalg.norm\`.")
check((not _a) or _is(error_total, _tot) or _is(error_total, _pe), "\`error_total\` tiene que ser la raíz de la suma de los cuadrados de todos los números de \`A - A2\`.")
_b = _num(error_formula)
check(_b, "\`error_formula\` tiene que ser un solo número: la raíz de la suma de los cuadrados de los valores singulares descartados.")
check((not _b) or _is(error_formula, _tot) or not _is(error_formula, float(np.sqrt(np.sum(_s[2:])))), "\`error_formula\` suma los valores singulares sin elevarlos al cuadrado. Hay que elevar cada uno al cuadrado antes de sumar y sacar la raíz después.")
check((not _b) or _is(error_formula, _tot) or not _is(error_formula, float(np.sqrt(np.sum(_s[1:] ** 2)))), "\`error_formula\` incluye un valor singular que la aproximación sí conserva. Se suman solo los descartados: los de \`S\` desde la posición 2.")
check((not _b) or _is(error_formula, _tot) or _is(error_formula, float(np.sqrt(np.sum(_s[2:])))) or _is(error_formula, float(np.sqrt(np.sum(_s[1:] ** 2)))), "\`error_formula\` tiene que ser la raíz de la suma de los cuadrados de \`S[2:]\`.")
_c = _num(error_peor)
check(_c, "\`error_peor\` tiene que ser un solo número: el mayor estiramiento de la diferencia entre \`A\` y \`A2\`.")
check((not _c) or _is(error_peor, _pe) or not _is(error_peor, _tot), "\`error_peor\` es el error total. El error en la peor dirección es solo el mayor de los valores singulares descartados.")
check((not _c) or _is(error_peor, _pe) or not _is(error_peor, float(_s[1])), "\`error_peor\` es el último valor singular que se conserva. El peor error es el primero que se descarta, el de la posición siguiente.")
check((not _c) or _is(error_peor, _pe) or _is(error_peor, _tot) or _is(error_peor, float(_s[1])), "\`error_peor\` tiene que ser el mayor de los valores singulares descartados, que es el mayor estiramiento de \`A - A2\`.")
`,
          reference: `import numpy as np

A = np.array([[4, 0, 2, 1], [1, 3, 0, 2], [2, 1, 5, 0], [0, 2, 1, 4], [3, 1, 2, 2]])
U, S, Vt = np.linalg.svd(A, full_matrices=False)
A2 = U[:, :2] @ np.diag(S[:2]) @ Vt[:2]
# Guarda en error_total la norma de Frobenius de A - A2, en error_formula la raíz de la suma de los
# cuadrados de los valores singulares descartados y en error_peor el mayor estiramiento de A - A2
error_total = np.linalg.norm(A - A2)
error_formula = np.sqrt(np.sum(S[2:] ** 2))
error_peor = np.linalg.norm(A - A2, 2)
`,
        },
        {
          id: 'rango-bajo.ex02.4',
          type: 'codigo',
          prompt:
            '`W` es una matriz de pesos de 8 filas y 6 columnas, casi de rango 2, y `U, S, Vt` es su descomposición. Para guardarla comprimida, se parte en dos matrices delgadas y se guardan solo esas. Guarda en `B` la matriz de 8 filas y `k` columnas (las `k` primeras columnas de `U`, cada una multiplicada por su valor singular, con `k` = 2) y en `A` la de `k` filas y 6 columnas (las `k` primeras filas de `Vt`); así `B @ A` es la mejor aproximación de rango 2 de `W`. Guarda en `numeros` cuántos números hay entre `B` y `A`, y en `error_rel` el error relativo de la compresión: la norma de Frobenius de `W - B @ A` dividida entre la de `W`.',
          hints: [
            'El plan: `B` es la parte de `U` con los valores singulares ya aplicados. Para multiplicar **cada columna** de `U[:, :k]` por su valor, se escribe `U[:, :k] * S[:k]`: NumPy reparte los `k` valores de `S` a las `k` columnas. Con `@` no sirve, porque eso suma en vez de escalar. `A` son las `k` primeras **filas** de `Vt`. `numeros` suma el `.size` de `B` y el de `A`. `error_rel` divide la norma de Frobenius de `W - B @ A` entre la de `W`.',
            'Las piezas, con otra matriz:\n\n' +
              py(
                'P = np.array([[1, 2], [3, 4], [5, 6]])',
                'q = np.array([10, 100])',
                'print(P * q)                      # [[10 200] [30 400] [50 600]]: columna 0 por 10, columna 1 por 100',
                'print((P @ q).shape)              # (3,): con @ se suma, no se escala',
                'print(P.size)                     # 6: cuántos números tiene P',
                'print(P[:, :1].size + q.size)     # 5: una columna de P (3 números) y q (2 números)',
                'print(np.linalg.norm(P) / np.linalg.norm(2 * P))   # 0.5: una razón entre dos normas',
              ) +
              '\n\nEl reparto de los valores singulares entre `B` y `A` es libre: lo que importa es que `B @ A` salga igual.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'B = U[:, :___] * S[:___]',
                'A = Vt[:___]',
                'numeros = B.size + A.___',
                'error_rel = np.linalg.norm(W - B @ A) / np.linalg.norm(___)',
              ) +
              '\n\nEl error típico es `U[:, :k] @ S[:k]`: da un array de 8 números en vez de una matriz de 8 por 2.',
          ],
          explain:
            'Guardar `B` y `A` cuesta $k\\,(m+n)$ números en lugar de $m\\,n$, y su producto reproduce la mejor aproximación de rango $k$. Los valores singulares se pueden dar a `B`, a `A` o repartirlos entre las dos: el producto es el mismo. Con las dos matrices delgadas se ahorra espacio mientras `k` sea pequeño frente al tamaño de `W`.',
          solution:
            '`B = U[:, :k] * S[:k]` tiene 8 por 2 números y `A = Vt[:k]`, 2 por 6: `numeros` vale $16+12=28$, frente a los $48$ de `W`. `B @ A` reproduce la aproximación de rango 2, y el error relativo es del orden del $4\\,\\%$, porque los valores descartados son pequeños. Errores típicos: `U[:, :k] @ S[:k]`, que da un array de 8 números y no una matriz; olvidar `S`, de modo que `B @ A` ya no se parece a `W`; o contar `W.size` en vez de lo que ocupan `B` y `A`.',
          requirements: [
            '`B` es un array de NumPy de 8 filas y 2 columnas, y `A` es uno de 2 filas y 6 columnas, de modo que `B @ A` es la mejor aproximación de rango 2 de `W`. Se acepta repartir los valores singulares entre `B` y `A` de cualquier forma.',
            '`numeros` es un número entero: cuántos números hay entre `B` y `A`.',
            '`error_rel` es un solo número: el error de Frobenius de `W - B @ A` dividido entre la norma de Frobenius de `W`.',
            'Se acepta una diferencia diminuta de redondeo.',
          ],
          starter: `import numpy as np

rng = np.random.default_rng(0)
# W: una matriz de pesos de 8 filas y 6 columnas, casi de rango 2 (dos piezas grandes y un poco de ruido).
W = rng.normal(size=(8, 2)) @ rng.normal(size=(2, 6)) + 0.05 * rng.normal(size=(8, 6))
U, S, Vt = np.linalg.svd(W, full_matrices=False)
k = 2
# U: 8 por 6, S: 6 valores singulares de mayor a menor, Vt: 6 por 6. k: cuántas piezas se guardan.

# PASO 1. B: la mitad izquierda de la compresión, con los valores singulares ya aplicados.
# Por qué: así B @ A reproduce la aproximación de rango k con solo dos matrices delgadas.
# U[:, :k] son las k primeras COLUMNAS de U (8 por k). S[:k] son los k primeros valores singulares.
# Una matriz por un array, M * s, multiplica cada COLUMNA de M por su número de s (una por columna).
# Con @ no se escala: M @ s suma, y devuelve otra cosa.
# Resultado esperado: un array de 8 filas y 2 columnas.
B = None

# PASO 2. A: la mitad derecha, las k primeras filas de Vt.
# Por qué: son las direcciones de entrada de las k piezas que se guardan.
# Vt[:k] son las k primeras FILAS de Vt.
# Resultado esperado: un array de 2 filas y 6 columnas.
A = None

# PASO 3. numeros: cuántos números hay que guardar entre B y A.
# Por qué: es el coste de la compresión, para compararlo con los números de W.
# M.size es cuántos números tiene un array, sea cual sea su forma: una matriz de 3 por 2 tiene 6.
# Resultado esperado: un número entero.
numeros = None

# PASO 4. error_rel: cuánto se pierde, en proporción al tamaño de W.
# Por qué: un error pequeño frente a la norma de W dice que la compresión casi no cambia la capa.
# np.linalg.norm(M) es la norma de Frobenius de M. B @ A es la matriz aproximada.
# Resultado esperado: un solo número, pequeño.
error_rel = None

# Para ver qué vale algo antes de entregar: print(numeros) y pulsa «Ejecutar».
`,
          checks: `_rng = np.random.default_rng(0)
_W = _rng.normal(size=(8, 2)) @ _rng.normal(size=(2, 6)) + 0.05 * _rng.normal(size=(8, 6))
_U, _S, _Vt = np.linalg.svd(_W, full_matrices=False)
_Wk = (_U[:, :2] * _S[:2]) @ _Vt[:2]
_nw = float(np.linalg.norm(_W))
_rel = float(np.linalg.norm(_W - _Wk)) / _nw
def _arr(a, s):
    return isinstance(a, np.ndarray) and a.shape == s and np.issubdtype(a.dtype, np.number)
_b = _arr(B, (8, 2))
_a = _arr(A, (2, 6))
_bvec = isinstance(B, np.ndarray) and B.shape == (8,)
_prod = _b and _a and bool(np.allclose(B @ A, _Wk))
check(_b or not _bvec, "\`B\` tiene solo 8 números. Con \`@\` no se escala cada columna: hay que multiplicar cada columna de \`U[:, :k]\` por su valor singular con \`*\`, para que \`B\` sea de 8 filas y 2 columnas.")
check(_b or _bvec, "\`B\` tiene que ser un array de NumPy de 8 filas y 2 columnas: las dos primeras columnas de \`U\` con sus valores singulares.")
check(_a, "\`A\` tiene que ser un array de NumPy de 2 filas y 6 columnas: las dos primeras filas de \`Vt\`.")
check((not _b) or (not _a) or _prod or not np.allclose(B @ A, _U[:, :2] @ _Vt[:2]), "\`B @ A\` no usa los valores singulares: falta multiplicar las columnas de \`U\` por \`S\`, y sin ellos las dos piezas pesan lo mismo.")
check((not _b) or (not _a) or _prod or np.allclose(B @ A, _U[:, :2] @ _Vt[:2]), "\`B @ A\` tiene que reproducir la mejor aproximación de rango 2 de \`W\`: las dos primeras piezas de la descomposición.")
_n = isinstance(numeros, (int, np.integer)) and not isinstance(numeros, (bool, np.bool_))
check(_n, "\`numeros\` tiene que ser un número entero: cuántos números hay entre \`B\` y \`A\`.")
check((not _n) or numeros != 48, "\`numeros\` vale 48, lo que tiene \`W\` entera. Hay que contar los números de \`B\` y los de \`A\`, que son menos.")
check((not _n) or numeros in (28, 48), "\`numeros\` tiene que ser la suma de los números de \`B\` y los de \`A\`.")
_e = isinstance(error_rel, (int, float, np.integer, np.floating)) and not isinstance(error_rel, (bool, np.bool_))
check(_e, "\`error_rel\` tiene que ser un solo número: el error de Frobenius dividido entre la norma de Frobenius de \`W\`.")
check((not _e) or (not _prod) or abs(float(error_rel) - _rel) < 1e-6 or abs(float(error_rel) - _rel * _nw) > 1e-6, "\`error_rel\` no está dividido entre la norma de \`W\`: es el error sin más. Tiene que ser una proporción.")
check((not _e) or (not _prod) or abs(float(error_rel) - _rel) < 1e-6 or abs(float(error_rel) - _rel * _nw) < 1e-6, "\`error_rel\` tiene que ser la norma de Frobenius de \`W - B @ A\` entre la norma de Frobenius de \`W\`.")
`,
          reference: `import numpy as np

rng = np.random.default_rng(0)
W = rng.normal(size=(8, 2)) @ rng.normal(size=(2, 6)) + 0.05 * rng.normal(size=(8, 6))
U, S, Vt = np.linalg.svd(W, full_matrices=False)
k = 2
# Guarda en B las k primeras columnas de U con sus valores singulares, en A las k primeras filas de Vt,
# en numeros cuántos números hay entre B y A y en error_rel el error relativo de B @ A frente a W
B = U[:, :k] * S[:k]
A = Vt[:k]
numeros = B.size + A.size
error_rel = np.linalg.norm(W - B @ A) / np.linalg.norm(W)
`,
        },
        {
          id: 'rango-bajo.ex02.5',
          type: 'codigo',
          prompt:
            'Una capa tiene pesos congelados `W` (6 filas y 4 columnas). LoRA no los toca: añade una corrección `B @ A`, con `B` de 6 filas y 2 columnas y `A` de 2 filas y 4 columnas, y la capa calcula `W @ x + B @ (A @ x)`. Al empezar, `B` vale cero; `B_ent` es `B` ya entrenada. Guarda en `salida_inicio` lo que calcula la capa con `x` al empezar; en `W_fus` los pesos fusionados tras el entrenamiento, `W + B_ent @ A`, en una sola matriz de 6 filas y 4 columnas; en `salida_fus` la salida `W_fus @ x`; y en `rango_corr` el rango de la **corrección** `B_ent @ A` (no el de `W_fus`).',
          hints: [
            'El plan son cuatro líneas. `salida_inicio`: la salida de `W` más la de la corrección, `W @ x + B @ (A @ x)`; `B` vale cero, así que sale lo mismo que `W @ x`. `W_fus`: `W` más el producto `B_ent @ A` (cuidado con el orden: `A @ B_ent` no encaja, `A` es de 2 por 4 y `B_ent` de 6 por 2). `salida_fus`: la matriz fusionada por `x`. `rango_corr`: el rango de `B_ent @ A`, que no puede pasar de 2.',
            'Las piezas, con otras matrices:\n\n' +
              py(
                'P = np.array([[1, 2], [3, 4]])',
                'e = np.array([[1], [1]])           # una columna: 2 por 1',
                'f = np.array([[1, 0]])             # una fila: 1 por 2',
                'print((e @ f).shape)               # (2, 2): columna por fila da una matriz entera',
                'z = np.array([5, 6])',
                'print(P @ z + e @ (f @ z))         # [22 44]: la salida de P más la de la corrección',
                'print((P + e @ f) @ z)             # [22 44]: la misma suma hecha en una sola matriz',
                'print(np.linalg.matrix_rank(e @ f))   # 1: la corrección tiene el rango de sus factores',
              ) +
              '\n\nLas dos salidas coinciden siempre: sumar las matrices antes o las salidas después da lo mismo.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'salida_inicio = W @ x + B @ (A @ ___)',
                'W_fus = W + ___ @ A',
                'salida_fus = W_fus @ ___',
                'rango_corr = np.linalg.matrix_rank(___ @ A)',
              ) +
              '\n\nEl error típico es dar como `rango_corr` el de `W_fus`: la matriz fusionada tiene rango alto; el que es bajo es el de la corrección.',
          ],
          explain:
            'LoRA entrena solo `B` y `A`, y la capa calcula la salida de `W` más la de la corrección. Al empezar `B` vale cero y la capa es idéntica a la original. Tras entrenar, `W + B @ A` se guarda como una sola matriz y la capa da la misma salida con un solo producto: el coste en uso es el de antes. La corrección tiene rango como mucho 2, aunque `W_fus` sea de rango alto.',
          solution:
            '`salida_inicio` vale `W @ x`, porque `B @ (A @ x)` es cero. `W_fus = W + B_ent @ A` es de 6 por 4 y `salida_fus` coincide con `W @ x + B_ent @ (A @ x)`. El rango de `B_ent @ A` es 2, tantas direcciones como columnas de `B`, mientras que `W_fus` tiene rango 4. Errores típicos: dejar fuera `W` de `salida_inicio` o de `W_fus`; usar `B_ent` a cero (o `B`) en vez de la entrenada; o dar el rango de `W_fus`.',
          requirements: [
            '`salida_inicio` es un array de 6 números: la salida de la capa al empezar, con `B` a cero.',
            '`W_fus` es un array de 6 filas y 4 columnas: `W` más el producto `B_ent @ A`.',
            '`salida_fus` es un array de 6 números: la salida de `W_fus` para `x`.',
            '`rango_corr` es un número entero: el rango de la corrección `B_ent @ A`.',
          ],
          starter: `import numpy as np

# W: los pesos congelados de una capa, de 6 filas y 4 columnas.
W = np.array([[2, 1, 0, -1], [0, 3, 1, 1], [1, -1, 2, 0], [1, 0, 1, 3], [-1, 2, 0, 1], [0, 1, 1, 2]])
# La corrección de LoRA es B @ A, con B de 6 por 2 y A de 2 por 4.
A = np.array([[1, 0, 1, 2], [0, 1, -1, 1]])
B = np.zeros((6, 2))
# B_ent: la misma B, ya entrenada.
B_ent = np.array([[1, 0], [0, 1], [1, 1], [2, 0], [0, -1], [1, 2]])
# x: la entrada de la capa, 4 números.
x = np.array([1, 2, -1, 3])

# PASO 1. salida_inicio: lo que calcula la capa con x al empezar, con B a cero.
# Por qué: la capa de LoRA suma a la salida de W la de la corrección; con B = 0 no cambia nada.
# M @ x, con M de 6 por 4 y x de 4 números, da 6 números. Se calcula primero A @ x y luego B @ (A @ x).
# Resultado esperado: un array con 6 números.
salida_inicio = None

# PASO 2. W_fus: los pesos tras el entrenamiento, fusionados en una sola matriz.
# Por qué: así la capa ya no necesita B ni A al usarla.
# B_ent @ A, con B_ent de 6 por 2 y A de 2 por 4, da una matriz de 6 por 4 como W. El orden importa:
# A @ B_ent no encaja.
# Resultado esperado: un array de 6 filas y 4 columnas.
W_fus = None

# PASO 3. salida_fus: lo que calcula la capa fusionada con x.
# Por qué: tiene que ser la misma salida que W @ x + B_ent @ (A @ x), con un solo producto.
# Resultado esperado: un array con 6 números.
salida_fus = None

# PASO 4. rango_corr: el rango de la corrección B_ent @ A.
# Por qué: es lo que limita cuánto puede cambiar LoRA la capa: solo en tantas direcciones como el rango.
# np.linalg.matrix_rank(M) da el rango de M. Ojo: el de la corrección, no el de W_fus.
# Resultado esperado: un número entero.
rango_corr = None

# Para ver qué vale algo antes de entregar: print(salida_fus) y pulsa «Ejecutar».
`,
          checks: `_W = np.array([[2, 1, 0, -1], [0, 3, 1, 1], [1, -1, 2, 0], [1, 0, 1, 3], [-1, 2, 0, 1], [0, 1, 1, 2]])
_A = np.array([[1, 0, 1, 2], [0, 1, -1, 1]])
_Be = np.array([[1, 0], [0, 1], [1, 1], [2, 0], [0, -1], [1, 2]])
_x = np.array([1, 2, -1, 3])
_F = _W + _Be @ _A
def _arr(a, s):
    return isinstance(a, np.ndarray) and a.shape == s and np.issubdtype(a.dtype, np.number)
_a = _arr(salida_inicio, (6,))
check(_a, "\`salida_inicio\` tiene que ser un array de NumPy con 6 números: la salida de la capa al empezar.")
check((not _a) or bool(np.allclose(salida_inicio, _W @ _x)) or not np.allclose(salida_inicio, 0), "\`salida_inicio\` no incluye la salida de \`W\`: con \`B\` a cero la corrección vale cero, y lo que queda es lo que da \`W\`.")
check((not _a) or bool(np.allclose(salida_inicio, _W @ _x)) or np.allclose(salida_inicio, 0), "\`salida_inicio\` tiene que ser la salida de \`W\` más la de la corrección, que con \`B\` a cero vale cero.")
_b = _arr(W_fus, (6, 4))
_bok = _b and bool(np.allclose(W_fus, _F))
check(_b, "\`W_fus\` tiene que ser un array de NumPy de 6 filas y 4 columnas: \`W\` más la corrección \`B_ent @ A\`.")
check((not _b) or _bok or not np.allclose(W_fus, _Be @ _A), "\`W_fus\` es solo la corrección. Los pesos fusionados son los de \`W\` más la corrección.")
check((not _b) or _bok or not np.allclose(W_fus, _W), "\`W_fus\` es igual que \`W\`: falta sumar la corrección \`B_ent @ A\`, con la \`B\` ya entrenada.")
check((not _b) or _bok or np.allclose(W_fus, _Be @ _A) or np.allclose(W_fus, _W), "\`W_fus\` tiene que ser \`W\` más el producto de \`B_ent\` por \`A\`.")
_c = _arr(salida_fus, (6,))
check(_c, "\`salida_fus\` tiene que ser un array de NumPy con 6 números: la salida de la capa fusionada para \`x\`.")
check((not _c) or (not _bok) or bool(np.allclose(salida_fus, _F @ _x)), "\`salida_fus\` tiene que ser la matriz \`W_fus\` por \`x\`. Tiene que coincidir con \`W @ x + B_ent @ (A @ x)\`.")
_r = isinstance(rango_corr, (int, np.integer)) and not isinstance(rango_corr, (bool, np.bool_))
check(_r, "\`rango_corr\` tiene que ser un número entero: el rango de la corrección \`B_ent @ A\`.")
check((not _r) or rango_corr != 4, "\`rango_corr\` vale 4, el de \`W_fus\`. Se pide el rango de la corrección \`B_ent @ A\`, que es mucho más bajo.")
check((not _r) or rango_corr in (2, 4), "\`rango_corr\` tiene que ser el rango del producto \`B_ent @ A\`, que no puede pasar del número de columnas de \`B_ent\`.")
`,
          reference: `import numpy as np

W = np.array([[2, 1, 0, -1], [0, 3, 1, 1], [1, -1, 2, 0], [1, 0, 1, 3], [-1, 2, 0, 1], [0, 1, 1, 2]])
A = np.array([[1, 0, 1, 2], [0, 1, -1, 1]])
B = np.zeros((6, 2))
B_ent = np.array([[1, 0], [0, 1], [1, 1], [2, 0], [0, -1], [1, 2]])
x = np.array([1, 2, -1, 3])
# Guarda en salida_inicio la salida de la capa con B a cero, en W_fus los pesos fusionados W + B_ent @ A,
# en salida_fus su salida para x y en rango_corr el rango de la corrección B_ent @ A
salida_inicio = W @ x + B @ (A @ x)
W_fus = W + B_ent @ A
salida_fus = W_fus @ x
rango_corr = np.linalg.matrix_rank(B_ent @ A)
`,
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'rango-bajo.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere la mejor aproximación de rango $k$ de una matriz `A` de $4\\times 4$, y NumPy ya está importado como `np`. Hace la descomposición en valores singulares, se queda con las `k` piezas mayores y mide el error. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        '`np.linalg.svd` devuelve `U`, `S` y `Vt`. Mira cómo se guardan en `Vt` los vectores que giran la entrada: ¿por filas o por columnas?',
        'Comprueba las formas: `U[:, :k]` tiene $k$ columnas, `np.diag(S[:k])` es de $k\\times k$, y lo que se multiplique al final tiene que tener $k$ filas.',
      ],
      explain:
        'La aproximación es la suma de las `k` piezas $\\sigma_{i}u_{i}v_{i}^{T}$. Cada $v_{i}^{T}$ es una fila de `Vt`, y se quedan las `k` primeras filas. Revisa cada línea con las formas de lo que usa.',
      solution:
        'La tercera línea está mal. `Vt` guarda los vectores $v_{i}^{T}$ por **filas**, y `Vt[:, :k].T` toma las `k` primeras columnas, que son otra cosa: se queda con las primeras `k` coordenadas de cada vector. El código no da error, porque las formas encajan, pero no calcula la mejor aproximación. Lo correcto es `Vt[:k, :]`, las `k` primeras filas. La última línea mide bien: la norma de Frobenius de la diferencia.',
      lines: [
        'U, S, Vt = np.linalg.svd(A)',
        'k = 2',
        'A_k = U[:, :k] @ np.diag(S[:k]) @ Vt[:, :k].T',
        'error = np.linalg.norm(A - A_k)',
      ],
      faultyLine: 2,
    },
    {
      id: 'rango-bajo.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento cuenta los parámetros que entrena LoRA en una matriz de pesos, con cifras inventadas. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Mira qué dos matrices entrena LoRA y cuántos números tiene cada una.',
        'Compara la cuenta de la tercera línea con la suma de la segunda.',
      ],
      explain:
        'LoRA entrena dos matrices delgadas, $B$ y $A$, y los parámetros son los de las dos juntas. Comprueba que cada línea usa lo que la anterior acaba de contar.',
      solution:
        'La tercera línea está mal. Los parámetros entrenables son los de $B$ más los de $A$: $4000+2000=6000$, es decir, $r\\,(d+k)=4\\,(1000+500)$. Multiplicar $d\\cdot k\\cdot r$ da $2000000$, que no es el número de nada que se entrene. Y la última línea arrastra el error: con la cuenta correcta, LoRA entrena $6000$ números, muchos menos que los $500000$ de $W$.',
      lines: [
        'W es de 1000 filas y 500 columnas, y se afina con LoRA de rango r = 4: ΔW = BA, con B de 1000×4 y A de 4×500',
        'B tiene 1000·4 = 4000 números y A tiene 4·500 = 2000 números',
        'Luego LoRA entrena 1000·500·4 = 2000000 parámetros',
        'Es cuatro veces el tamaño de W (500000), así que afinar con LoRA sale más caro que entrenar W entera',
      ],
      faultyLine: 2,
    },
    {
      id: 'rango-bajo.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula cuánta energía conserva una aproximación de rango bajo, con cifras inventadas. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'La energía se suma con los cuadrados de los valores singulares. Haz la cuenta tú.',
        'Comprueba que cada línea usa el resultado de la anterior.',
      ],
      explain:
        'La energía que conserva una aproximación de rango $k$ es la suma de los cuadrados de sus $k$ primeros valores singulares entre la suma de todos. Lo que se pierde es el complemento de lo que se conserva.',
      solution:
        'No hay ningún error. Los cuadrados $64$, $16$, $16$ y $4$ suman $100$. Con $k=2$ se conserva $\\frac{64+16}{100}=80\\,\\%$, y lo que se descarta es $\\frac{16+4}{100}=20\\,\\%$.',
      lines: [
        'Una matriz tiene valores singulares 8, 4, 4 y 2',
        'La energía total es la suma de sus cuadrados: 64 + 16 + 16 + 4 = 100',
        'Con k = 2 se conserva (64 + 16) / 100 = 80 % de la energía',
        'Luego descartar las dos últimas piezas pierde el 20 % de la energía',
      ],
      faultyLine: null,
    },
  ],
};
