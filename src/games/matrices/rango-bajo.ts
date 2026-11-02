import type { Goal, PlaneSpec, PlaneVector, Project } from '../../content/schema';
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
      questions: [],
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
