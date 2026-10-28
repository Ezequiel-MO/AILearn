import type { Goal, PlaneSpec, PlaneVector, Project } from '../../content/schema';
import { py } from '../py';
import { pcaWarmup } from './pca.calentamiento';
import { transformPlane, type TransformPlaneOptions } from './plane';

/** Un vector de datos del plano. */
const vec = (id: string, x: number, y: number, movable: boolean): PlaneVector => ({
  id,
  label: id,
  x,
  y,
  movable,
});

/** Plano de covarianza: la matriz C fija en las columnas î y ĵ y la elipse imagen de la circunferencia unidad. */
const covPlane = (o: TransformPlaneOptions): PlaneSpec => ({
  ...transformPlane(o),
  circle: 1,
  circleImage: true,
});

/** Meta sobre la varianza (el cociente de Rayleigh) en la dirección de un vector. */
const varianceGoal = (id: string, target: number): Goal => ({
  metric: 'rayleigh',
  of: ['i', 'j', id],
  target,
  tol: 0.01,
});

/** Tercer proyecto de la Órbita 2 de matrices: componentes principales y PCA. */
export const pca: Project = {
  id: 'pca',
  name: 'PCA',
  sub: 'Ver en dos dimensiones',
  warmup: pcaWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'pca.ex00.1',
          type: 'manipular',
          purpose: {
            why: 'Los embeddings tienen cientos de dimensiones y una pantalla, dos. Para ver cómo se agrupan, se proyectan sobre las dos direcciones en las que más se separan los puntos, y esas son las dos primeras componentes de **PCA**. Elegir la dirección de mayor varianza conserva en el dibujo la mayor dispersión posible.',
            aim: 'Vas a girar $v$ buscando la dirección en la que los datos varían más, guiándote por la lectura de la varianza y por la forma de la elipse.',
            takeaway:
              'La varianza máxima, $4$, está en la recta de $(1, 1)$, que es un autovector de $C$: la primera componente principal es el autovector del autovalor mayor de la covarianza. Una biblioteca de PCA calcula exactamente eso, solo que en cientos de dimensiones.',
          },
          prompt:
            'El análisis de componentes principales (**PCA**) busca las direcciones en las que más varían unos datos. Unos datos centrados tienen matriz de **covarianza** $C=\\begin{pmatrix}3&1\\\\1&3\\end{pmatrix}$: la diagonal dice cuánto varía cada variable y los otros números, cuánto varían juntas. En el plano, sus columnas son $\\hat{\\imath}$ y $\\hat{\\jmath}$, y la elipse es lo que queda de la circunferencia unidad al aplicarle $C$.\n\nLa lectura $v^{T}Av\\,/\\,v^{T}v$ del panel, con $A=C$, es la **varianza de los datos en la dirección de $v$**, y no depende de la longitud de $v$. Mueve $v$ hasta que esa varianza valga **4**, la mayor posible.',
          hints: [
            'Prueba primero $v=(1, 0)$ y $v=(0, 1)$, las dos variables sueltas, y mira la lectura. ¿Está entre las dos la dirección que da más?',
            'La varianza es mayor donde la elipse se estira más. Alinea $v$ con su eje largo.',
          ],
          explain:
            'La varianza depende de la dirección de $v$, no de su longitud: duplicar $v$ no cambia la lectura. Aquí, la dirección de máxima varianza no es la de ninguna de las dos variables sueltas: es la que mejor resume cómo varían las dos juntas.',
          solution:
            'Sirve cualquier $v$ sobre la recta de $(1, 1)$: $(1, 1)$, $(2, 2)$ o $(-1, -1)$. Con $v=(1, 1)$, $Cv=(4, 4)=4v$: $C$ solo estira esa flecha, sin girarla, por un factor $4$. Un vector así es un **autovector** de $C$ y $4$, su **autovalor**. La varianza mínima, $2$, está en la recta perpendicular: $C(1, -1)=(2, -2)=2\\,(1, -1)$. La dirección de máxima varianza es la primera **componente principal**.',
          plane: covPlane({
            i: [3, 1],
            j: [1, 3],
            extra: [vec('v', 1, 0, true)],
            apply: ['v'],
            readouts: ['matrix', 'rayleigh'],
            range: 4,
          }),
          goals: [varianceGoal('v', 4)],
        },
        {
          id: 'pca.ex00.2',
          type: 'manipular',
          purpose: {
            why: 'PCA elige las direcciones con más varianza, y la varianza depende de las unidades: un rasgo medido en euros varía mucho más, en números, que uno medido en años, y acapara la primera componente solo por eso. Por eso, antes de PCA, se suele **normalizar** cada rasgo para que todos tengan varianza $1$, salvo que sus escalas sean comparables de verdad.',
            aim: 'Vas a buscar la dirección de máxima varianza cuando las dos variables no están correladas y a ver cómo queda la elipse en ese caso.',
            takeaway:
              'Sin correlación, las componentes principales son los propios ejes y PCA solo ordena las variables por su varianza: aquí gana la primera, con $4$ frente a $1$. Si esa diferencia viene de las unidades y no de los datos, la componente no dice nada útil.',
          },
          prompt:
            'Dos variables **sin correlación** tienen covarianza $0$ fuera de la diagonal. Aquí $C=\\begin{pmatrix}4&0\\\\0&1\\end{pmatrix}$: varianza $4$ en la primera variable y $1$ en la segunda. La elipse es lo que $C$ hace con la circunferencia unidad. La lectura $v^{T}Av\\,/\\,v^{T}v$, con $A=C$, es la varianza de los datos en la dirección de $v$. Ahora $v$ parte de $(1, 1)$. Muévelo hasta que la varianza en su dirección valga **4**.',
          hints: [
            'En $(1, 1)$ la lectura es $2{,}5$, un promedio de $4$ y $1$. Busca una dirección donde no se mezclen.',
            'La elipse queda alineada con los ejes. ¿Cuál de los dos es el largo?',
          ],
          explain:
            'Si la covarianza es $0$, las variables no se mezclan, y las direcciones de varianza extrema son las de las propias variables: los ejes. En cualquier dirección intermedia la varianza es un promedio de las dos y queda entre ellas.',
          solution:
            'Hay que poner $v$ sobre el eje $x$: $(1, 0)$, $(2, 0)$ o $(-1, 0)$. Entonces $Cv=(4a, 0)=4v$ y la varianza es $4$, la de la primera variable. El eje $y$ da la mínima, $1$, y $(1, 1)$ da $\\frac{4+1}{2}=2{,}5$. Sin correlación, las componentes principales son los propios ejes de partida.',
          plane: covPlane({
            i: [4, 0],
            j: [0, 1],
            extra: [vec('v', 1, 1, true)],
            apply: ['v'],
            readouts: ['rayleigh'],
            range: 4,
          }),
          goals: [varianceGoal('v', 4)],
        },
        {
          id: 'pca.ex00.3',
          type: 'manipular',
          purpose: {
            why: 'Una componente principal se lee por sus pesos, los números de su dirección: si dos rasgos tienen pesos del mismo signo, la componente mide cuánto suben juntos; si los tienen de signo contrario, mide un contraste entre ellos. Leer así las primeras componentes es una forma habitual de averiguar qué ha encontrado PCA en unos datos o en un conjunto de embeddings.',
            aim: 'Vas a sacar $v$ de la dirección de mínima varianza y a buscar la de máxima, en unos datos donde una variable baja cuando la otra sube.',
            takeaway:
              'Con covarianza negativa, la primera componente es descendente, la recta de $(1, -1)$ con varianza $3$, y la diagonal ascendente se queda con la mínima, $1$. Sus pesos de signo contrario dicen que esa componente mide un contraste entre las dos variables.',
          },
          prompt:
            'Cuando una variable sube y la otra baja, la covarianza es **negativa**. Aquí $C=\\begin{pmatrix}2&-1\\\\-1&2\\end{pmatrix}$, con $\\hat{\\imath}=(2, -1)$ y $\\hat{\\jmath}=(-1, 2)$; la elipse es lo que $C$ hace con la circunferencia unidad. El vector $v$ parte de $(1, 1)$, donde la varianza es la **mínima**. Llévalo a una dirección donde la varianza valga **3**, la máxima. La lectura $A\\,v$ te dice adónde lo manda $C$.',
          hints: [
            'En $(1, 1)$ la varianza vale $1$ y $C$ no cambia su dirección. Prueba direcciones que no estén sobre los ejes ni sobre esa diagonal.',
            'Si una variable sube cuando la otra baja, la nube de datos cae de izquierda a derecha. Mira hacia dónde se estira la elipse.',
          ],
          explain:
            'La elipse se estira a lo largo de la dirección en que los datos varían más. Con covarianza negativa esa dirección es descendente, y la diagonal ascendente, la de partida, es justo la de menor varianza.',
          solution:
            'Sirve cualquier $v$ sobre la recta de $(1, -1)$: $(1, -1)$, $(2, -2)$ o $(-1, 1)$. Con $v=(1, -1)$, $Cv=(2+1,\\ -1-2)=(3, -3)=3v$, así que la varianza es $3$. En $(1, 1)$, $Cv=(1, 1)$ y la varianza es $1$. La primera componente principal es descendente porque cuando una variable sube, la otra baja.',
          plane: covPlane({
            i: [2, -1],
            j: [-1, 2],
            extra: [vec('v', 1, 1, true)],
            apply: ['v'],
            readouts: ['rayleigh', 'image'],
            range: 3,
          }),
          goals: [varianceGoal('v', 3)],
        },
        {
          id: 'pca.ex00.4',
          type: 'manipular',
          purpose: {
            why: 'Para abaratar un índice de búsqueda se puede guardar cada embedding como sus coordenadas en unas pocas componentes principales, en vez de en sus cientos de dimensiones. Esas coordenadas son proyecciones, y su signo depende del sentido de la componente: dos ejecuciones o dos bibliotecas pueden devolver la misma componente con el sentido cambiado.',
            aim: 'Vas a orientar $u$ en la dirección de máxima varianza y a elegir su sentido para que la coordenada del dato $p$ salga positiva.',
            takeaway:
              'La coordenada de $p$ en la primera componente es $2{,}83$ o $-2{,}83$ según el sentido de $u$, y las dos describen lo mismo. Al comprimir embeddings, la consulta y los documentos se proyectan siempre con la misma matriz de componentes, guardada una vez, para que los signos casen.',
          },
          prompt:
            'Con $C=\\begin{pmatrix}3&1\\\\1&3\\end{pmatrix}$, un dato centrado $p=(3, 1)$ queda fijo. La **coordenada** de un dato en una dirección es su proyección sobre ella: la lectura «proy de p sobre u». Mueve $u$, que parte de $(0, 1)$, hasta que apunte en la dirección de **máxima varianza** (lectura $u^{T}Au\\,/\\,u^{T}u$ igual a $4$, con $A=C$) y que la coordenada de $p$ en esa dirección valga **$2{,}83$**, positiva.',
          hints: [
            'La varianza $4$ se da en una recta, y en ella hay dos sentidos. Mira cuál de los dos da una proyección positiva.',
            'La proyección de $p$ sobre $u$ solo depende de la dirección de $u$, no de su longitud, pero sí de su sentido.',
          ],
          explain:
            'Una componente principal es una dirección, y $u$ y $-u$ son la misma dirección. La coordenada de un dato en ella cambia de signo con el sentido elegido, y el valor absoluto no cambia.',
          solution:
            'Hay que poner $u$ en un múltiplo positivo de $(1, 1)$: $(1, 1)$ o $(2, 2)$. La varianza es $4$ y la proyección de $p$ vale $\\frac{3\\cdot 1+1\\cdot 1}{\\sqrt{2}}=\\frac{4}{\\sqrt{2}}\\approx 2{,}83$. Con $(-1, -1)$ la varianza sigue siendo $4$ y la coordenada sale $-2{,}83$: el signo de una componente principal es una elección, y las dos valen.',
          plane: {
            ...covPlane({
              i: [3, 1],
              j: [1, 3],
              extra: [vec('p', 3, 1, false), vec('u', 0, 1, true)],
              apply: ['u'],
              readouts: ['rayleigh', 'projection'],
              range: 4,
            }),
            pair: ['p', 'u'],
          },
          goals: [
            varianceGoal('u', 4),
            { metric: 'proj', of: ['p', 'u'], target: 2.83, tol: 0.01 },
          ],
        },
        {
          id: 'pca.ex00.5',
          type: 'manipular',
          purpose: {
            why: 'La pregunta práctica de PCA es con cuántas componentes quedarse. Se responde con la **varianza explicada**: el autovalor de cada componente dividido entre la suma de todos. Es habitual quedarse con las suficientes para explicar, por ejemplo, el $90\\,\\%$ de la varianza, y saber así cuánto se pierde al comprimir.',
            aim: 'Vas a construir una covarianza con las varianzas de la diagonal fijadas y una dirección propia dada, y a leer en la elipse cuánto domina esa dirección.',
            takeaway:
              'Sale $C=\\begin{pmatrix}3&2\\\\2&3\\end{pmatrix}$, con autovalores $5$ y $1$: la primera componente explica $\\frac{5}{6}\\approx 83\\,\\%$ de la varianza. Proyectar estos datos sobre una sola recta conserva la mayor parte de su variación y pierde el $17\\,\\%$ restante.',
          },
          prompt:
            'Construye una matriz de covarianza. Mueve $\\hat{\\imath}$ y $\\hat{\\jmath}$ (sus coordenadas son las columnas de la matriz) hasta que las dos varianzas, los números de la diagonal, valgan **3**; que $v=(1, 1)$, fijo, **no gire** al aplicarle la matriz (la lectura de su ángulo con $A\\,v$ vale $0$°); y que la varianza en la dirección de $v$ valga **5**. La elipse, imagen de la circunferencia unidad, cambia con la matriz que vas formando.',
          hints: [
            'La diagonal fija la $x$ de $\\hat{\\imath}$ y la $y$ de $\\hat{\\jmath}$. Quedan libres la $y$ de $\\hat{\\imath}$ y la $x$ de $\\hat{\\jmath}$. Llámalas $c$ y $b$.',
            'Con $A=\\begin{pmatrix}3&b\\\\c&3\\end{pmatrix}$, $A\\,v=(3+b,\\ c+3)$. Que esté en la recta de $v$ obliga a que sus dos coordenadas coincidan.',
          ],
          explain:
            'Que $v$ no gire pide que $A\\,v$ vaya en su misma dirección, y eso relaciona los dos números libres. La varianza en la dirección de $v$ fija después su suma. Piensa también qué relación guardan entre sí los números de fuera de la diagonal en una covarianza.',
          solution:
            'Con $A=\\begin{pmatrix}3&b\\\\c&3\\end{pmatrix}$ y $v=(1, 1)$, $A\\,v=(3+b,\\ c+3)$. Sobre la recta de $v$, $3+b=c+3$, luego $b=c$. La varianza es $\\frac{v^{T}Av}{v^{T}v}=\\frac{6+b+c}{2}=5$, luego $b+c=4$ y $b=c=2$: $\\hat{\\imath}=(3, 2)$ y $\\hat{\\jmath}=(2, 3)$. La matriz es simétrica, como toda covarianza, con autovalores $5$ y $1$: la primera componente explica $\\frac{5}{6}\\approx 83\\,\\%$ de la varianza.',
          plane: covPlane({
            movable: true,
            extra: [vec('v', 1, 1, false)],
            apply: ['v'],
            readouts: ['matrix', 'img_angle', 'rayleigh'],
            range: 5,
            snap: 1,
          }),
          goals: [
            { metric: 'x', of: ['i'], target: 3, tol: 0.01 },
            { metric: 'y', of: ['j'], target: 3, tol: 0.01 },
            { metric: 'img_angle', of: ['i', 'j', 'v'], target: 0, tol: 0.5 },
            varianceGoal('v', 5),
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'pca.ex01.1',
          type: 'vector',
          prompt:
            'Antes de buscar direcciones, los datos se **centran**: a cada dato se le resta la media de cada variable. Tres datos tienen dos variables cada uno: $(2, 3)$, $(4, 5)$ y $(6, 10)$. Calcula la media de cada variable y escribe el **primer dato centrado**: primero la $x$ y después la $y$.',
          hints: [
            'La media de cada variable es la suma de sus valores entre el número de datos: una para las $x$ y otra para las $y$.',
            'Resta a cada coordenada del primer dato la media de su propia variable.',
          ],
          explain:
            'Centrar es restar un vector de medias, uno por variable, no un único número para todo. Tras centrar, la media de cada variable es $0$.',
          solution:
            'Las medias son $\\frac{2+4+6}{3}=4$ y $\\frac{3+5+10}{3}=6$, es decir, $(4, 6)$. El primer dato centrado es $(2-4,\\ 3-6)=(-2, -3)$. Si te sale $(2, 3)$ no has restado nada; si restas una sola media a las dos coordenadas, la segunda sale mal.',
          answer: [-2, -3],
          tol: 0,
        },
        {
          id: 'pca.ex01.2',
          type: 'numero',
          prompt:
            'La matriz de covarianza de unos datos tiene autovalores $6$ y $2$. Cada autovalor es la varianza de los datos a lo largo de su componente principal. ¿Qué **porcentaje** de la varianza total explica la primera componente, la del autovalor mayor? Escribe solo el número, sin el símbolo %.',
          hints: [
            'La varianza total es la suma de los dos autovalores.',
            'La fracción que explica una componente es su autovalor entre esa suma.',
          ],
          explain:
            'La varianza total es la suma de todos los autovalores, y cada componente explica su parte de ella. Dividir el autovalor mayor entre el menor compara las dos componentes entre sí, que es otra cosa.',
          solution:
            '$\\frac{6}{6+2}=0{,}75$, es decir, el $75\\,\\%$. Si te sale $300$, has dividido $6$ entre $2$; si te sale $25$, has calculado lo que explica la segunda componente.',
          answer: 75,
          tol: 0,
        },
        {
          id: 'pca.ex01.3',
          type: 'numero',
          prompt:
            'La primera componente principal de unos datos es el vector $u=(0{,}6; 0{,}8)$, de norma $1$. Un dato centrado es $(2, 1)$. ¿Cuál es su **coordenada** en la primera componente?',
          hints: [
            'La coordenada de un dato en una dirección de norma $1$ es su proyección sobre ella, es decir, un producto escalar.',
            'Multiplica componente a componente y suma.',
          ],
          explain:
            'La coordenada en una componente es el producto escalar del dato centrado con la componente, que tiene norma $1$. Es un solo número por dato, no un vector.',
          solution:
            '$0{,}6\\cdot 2+0{,}8\\cdot 1=1{,}2+0{,}8=2$. Con la componente $-u$ saldría $-2$: la misma recta con el sentido contrario.',
          answer: 2,
          tol: 0,
        },
        {
          id: 'pca.ex01.4',
          type: 'numero',
          prompt:
            'Unos datos con cuatro variables tienen una covarianza con autovalores $5$, $3$, $1{,}5$ y $0{,}5$. Se conservan las primeras componentes, de mayor a menor autovalor. ¿Cuántas hacen falta, como mínimo, para conservar al menos el $90\\,\\%$ de la varianza?',
          hints: [
            'La varianza total es la suma de los cuatro autovalores.',
            'Acumula los autovalores de mayor a menor y mira en qué componente se pasa del $90\\,\\%$ del total.',
          ],
          explain:
            'Se suman los autovalores empezando por el mayor, y se para en el primero cuyo acumulado llega al $90\\,\\%$ del total. Contar posiciones desde $0$ da una componente menos de las que hacen falta.',
          solution:
            'El total es $10$. El acumulado es $5$ ($50\\,\\%$), $8$ ($80\\,\\%$) y $9{,}5$ ($95\\,\\%$): con dos componentes no se llega al $90\\,\\%$ y con tres sí. Hacen falta $3$. Con todas las componentes se conservaría el $100\\,\\%$, pero no se ganaría nada.',
          answer: 3,
          tol: 0,
        },
        {
          id: 'pca.ex01.5',
          type: 'opcion',
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
