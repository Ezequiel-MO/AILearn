import type { PlaneSpec, PlaneVector, Project } from '../../content/schema';
import { transformPlane, type TransformPlaneOptions } from './plane';

/** Un vector del plano. */
const vec = (id: string, x: number, y: number, movable: boolean): PlaneVector => ({
  id,
  label: id,
  x,
  y,
  movable,
});

/** Plano de la SVD: la matriz A fija en las columnas î y ĵ y la elipse imagen de la circunferencia unidad. */
const svdPlane = (o: TransformPlaneOptions): PlaneSpec => ({
  ...transformPlane(o),
  circle: 1,
  circleImage: true,
});

/** Como `svdPlane`, pero con ĵ móvil y î fija. */
const svdPlaneJMovable = (o: TransformPlaneOptions): PlaneSpec => {
  const plane = svdPlane(o);
  return {
    ...plane,
    vectors: plane.vectors.map((v) => (v.id === 'j' ? { ...v, movable: true } : v)),
  };
};

/** Primer proyecto de la Órbita 3 de matrices: la descomposición en valores singulares (SVD). */
export const svd: Project = {
  id: 'svd',
  name: 'SVD',
  sub: 'Girar, estirar, girar',
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'svd.ex00.1',
          type: 'manipular',
          purpose: {
            why: 'Una capa de red neuronal es una matriz, y muchas giran las flechas sin dejar ninguna dirección propia. Aun así, una pregunta sigue en pie: cuál es la dirección que más alarga. Ese factor, el mayor **valor singular** $\\sigma_1$, es lo máximo que la capa puede amplificar una entrada, y se mide para vigilar que el entrenamiento no se desboque.',
            aim: 'Vas a mover $v$ hasta dar con la dirección que esta matriz estira más, guiándote por la lectura del estiramiento y por la forma de la elipse.',
            takeaway:
              'La dirección de máximo estiramiento es la recta de $(1, 1)$, que $A$ manda a $(4, 0)$, y su factor es $\\sigma_1=2\\sqrt{2}\\approx 2{,}83$. Esta matriz no tiene autovalores reales y aun así siempre hay una dirección que más alarga: la **descomposición en valores singulares** existe para toda matriz.',
          },
          prompt:
            'Esta matriz gira todas las flechas: $A=\\begin{pmatrix}2&2\\\\-1&1\\end{pmatrix}$, con $\\hat{\\imath}=(2, -1)$ y $\\hat{\\jmath}=(2, 1)$. No tiene autovalores reales ($\\lambda^{2}-3\\lambda+4=0$ no tiene solución real), así que ninguna dirección se conserva. Pero la elipse, imagen de la circunferencia unidad, tiene un eje largo.\n\nLa lectura $|A\\,v|\\,/\\,|v|$ del panel es **cuánto estira $A$ la dirección de $v$**, y no depende de la longitud de $v$. Mueve $v$, que parte de $(1, 0)$, hasta que valga **$2{,}83$**, el mayor estiramiento posible.',
          hints: [
            'Prueba $v=(1, 0)$ y $v=(0, 1)$ y mira la lectura. Después busca la dirección que queda entre las dos.',
            'El mayor estiramiento está hacia donde la elipse llega más lejos del centro: apunta $v$ al extremo de su eje largo.',
          ],
          explain:
            'El estiramiento depende de la dirección de $v$, no de su longitud. Que no haya autovectores reales no impide que una dirección se estire más que las demás: la elipse siempre tiene un eje más largo.',
          solution:
            'Sirve cualquier $v$ sobre la recta de $(1, 1)$: $(1, 1)$, $(2, 2)$ o $(-1, -1)$. Con $v=(1, 1)$, $A\\,v=(4, 0)$, y $\\frac{|(4, 0)|}{|(1, 1)|}=\\frac{4}{\\sqrt{2}}=2\\sqrt{2}\\approx 2{,}83$. Ese es el **valor singular** mayor, $\\sigma_1$, y $v$ es la dirección de entrada que lo da. Con $v=(1, 0)$ el estiramiento es solo $\\sqrt{5}\\approx 2{,}24$.',
          plane: svdPlane({
            i: [2, -1],
            j: [2, 1],
            extra: [vec('v', 1, 0, true)],
            apply: ['v'],
            readouts: ['matrix', 'stretch'],
            range: 4,
          }),
          goals: [{ metric: 'stretch', of: ['i', 'j', 'v'], target: 2.83, tol: 0.01 }],
        },
        {
          id: 'svd.ex00.2',
          type: 'manipular',
          purpose: {
            why: 'Los valores singulares pequeños son las direcciones que una capa casi borra: lo que entra por ahí sale apagado, y si una señal útil va por ahí, el modelo apenas la ve. Por eso importa conocer también el estiramiento **mínimo**, $\\sigma_2$, y saber en qué dirección de entrada se da.',
            aim: 'Vas a buscar, con la misma matriz, la dirección que menos estira, y a fijarte en cómo cae respecto de la que más estira.',
            takeaway:
              'El estiramiento mínimo es $\\sigma_2=\\sqrt{2}\\approx 1{,}41$, en la recta de $(1, -1)$, perpendicular a la del máximo. Además $\\sigma_1\\sigma_2=4=|\\det A|$: la capa multiplica las áreas por $4$. Una capa con un $\\sigma$ casi nulo aplasta una dirección del espacio y pierde lo que había en ella.',
          },
          prompt:
            'Misma matriz $A=\\begin{pmatrix}2&2\\\\-1&1\\end{pmatrix}$, con $\\hat{\\imath}=(2, -1)$ y $\\hat{\\jmath}=(2, 1)$, y $v$ vuelve a partir de $(1, 0)$. Ahora busca la dirección que $A$ **menos** estira: mueve $v$ hasta que la lectura $|A\\,v|\\,/\\,|v|$ valga **$1{,}41$**. Fíjate en cómo queda esa dirección respecto de la del mayor estiramiento, y hacia dónde cae $A\\,v$.',
          hints: [
            'En $(1, 0)$ el estiramiento es $2{,}24$, y en la dirección de $(1, 1)$ es el máximo, $2{,}83$. El mínimo está lejos de esa.',
            'La dirección de menor estiramiento apunta al eje corto de la elipse, que forma un ángulo recto con el eje largo.',
          ],
          explain:
            'La dirección de menor estiramiento es perpendicular a la de mayor, y sus imágenes también lo son. Eso es lo que hace especial a la descomposición en valores singulares: dos direcciones de entrada perpendiculares que se mandan a dos de salida perpendiculares.',
          solution:
            'Sirve cualquier $v$ sobre la recta de $(1, -1)$: $(1, -1)$, $(2, -2)$ o $(-1, 1)$. Con $v=(1, -1)$, $A\\,v=(0, -2)$ y $\\frac{|(0, -2)|}{|(1, -1)|}=\\frac{2}{\\sqrt{2}}=\\sqrt{2}\\approx 1{,}41$: es $\\sigma_2$. Las direcciones $(1, 1)$ y $(1, -1)$ son perpendiculares, y sus imágenes $(4, 0)$ y $(0, -2)$ también. Las de entrada son las columnas de $V$ y las de salida, una vez quitada su longitud, las de $U$. Además $\\sigma_1\\sigma_2=2\\sqrt{2}\\cdot\\sqrt{2}=4=|\\det A|$.',
          plane: svdPlane({
            i: [2, -1],
            j: [2, 1],
            extra: [vec('v', 1, 0, true)],
            apply: ['v'],
            readouts: ['stretch', 'image'],
            range: 4,
          }),
          goals: [{ metric: 'stretch', of: ['i', 'j', 'v'], target: 1.41, tol: 0.01 }],
        },
        {
          id: 'svd.ex00.3',
          type: 'manipular',
          purpose: {
            why: 'El caso más sencillo da el patrón de todos los demás: si las columnas de una matriz ya son perpendiculares, no hay que buscar direcciones especiales y los valores singulares se leen como las longitudes de las columnas. La SVD de una matriz cualquiera es la manera de reducir cada capa a ese caso limpio.',
            aim: 'Vas a colocar dos vectores, $v$ y $w$, cada uno en la dirección de uno de los dos estiramientos extremos, y a ver qué direcciones resultan ser.',
            takeaway:
              'Con las columnas perpendiculares, las direcciones de entrada son los propios ejes y los valores singulares son las longitudes de las columnas: $|(2, -2)|=2\\sqrt{2}\\approx 2{,}83$ y $|(1, 1)|=\\sqrt{2}\\approx 1{,}41$. En una matriz cualquiera esas dos direcciones hay que buscarlas, y la SVD las encuentra.',
          },
          prompt:
            'Aquí $A=\\begin{pmatrix}2&1\\\\-2&1\\end{pmatrix}$, con $\\hat{\\imath}=(2, -2)$ y $\\hat{\\jmath}=(1, 1)$: dos columnas **perpendiculares**, porque su producto escalar es $2-2=0$. Hay dos vectores móviles: $v$, que parte de $(1, 1)$, y $w$, que parte de $(1, -1)$. Cada uno tiene su lectura de estiramiento. Colócalos de modo que el estiramiento de $v$ valga **$2{,}83$**, el mayor, y el de $w$ valga **$1{,}41$**, el menor.',
          hints: [
            'Los dos parten con estiramiento $2{,}24$. Calcula $A\\,(1, 0)$ y $A\\,(0, 1)$: son las propias columnas.',
            'Mide las dos columnas. ¿Con qué estiramientos extremos se corresponden?',
          ],
          explain:
            'Las imágenes de los ejes son las propias columnas, y como son perpendiculares, los ejes ya son las direcciones de entrada que buscas. Los estiramientos son las longitudes de las columnas, y no hace falta buscar nada más.',
          solution:
            'Pon $v$ sobre el eje $x$ ($(1, 0)$, $(2, 0)$ o $(-1, 0)$) y $w$ sobre el eje $y$ ($(0, 1)$, $(0, 2)$ o $(0, -1)$). $A\\,(1, 0)=(2, -2)$, de longitud $2\\sqrt{2}\\approx 2{,}83$, y $A\\,(0, 1)=(1, 1)$, de longitud $\\sqrt{2}\\approx 1{,}41$. Aquí las direcciones de entrada son $(1, 0)$ y $(0, 1)$, y los valores singulares son lo que miden las columnas.',
          plane: svdPlane({
            i: [2, -2],
            j: [1, 1],
            extra: [vec('v', 1, 1, true), vec('w', 1, -1, true)],
            apply: ['v', 'w'],
            readouts: ['stretch', 'image'],
            range: 3,
          }),
          goals: [
            { metric: 'stretch', of: ['i', 'j', 'v'], target: 2.83, tol: 0.01 },
            { metric: 'stretch', of: ['i', 'j', 'w'], target: 1.41, tol: 0.01 },
          ],
        },
        {
          id: 'svd.ex00.4',
          type: 'manipular',
          purpose: {
            why: 'Cuando una matriz es simétrica, como una covarianza o $X^{T}X$, la SVD y la descomposición en autovalores hablan de lo mismo, con una diferencia: los valores singulares nunca son negativos. Saber qué pasa con un autovalor negativo evita leer mal el estiramiento de una capa.',
            aim: 'Vas a buscar la dirección de menor estiramiento de una matriz simétrica con un autovalor negativo y a ver qué hace $A$ con esa flecha.',
            takeaway:
              'Los autovalores son $3$ y $-1$, y los valores singulares, $3$ y $1$: en una simétrica $\\sigma=|\\lambda|$. El signo no desaparece, pasa a $U$: $A$ voltea la flecha en lugar de acortarla sin más. Con una covarianza, de autovalores positivos, las dos descomposiciones coinciden.',
          },
          prompt:
            'La matriz $A=\\begin{pmatrix}1&2\\\\2&1\\end{pmatrix}$, con $\\hat{\\imath}=(1, 2)$ y $\\hat{\\jmath}=(2, 1)$, es simétrica y sus autovalores son $3$ y $-1$. Mueve $v$, que parte de $(1, 0)$, hasta que la lectura $|A\\,v|\\,/\\,|v|$ valga **1**, y mira hacia dónde cae $A\\,v$ respecto de $v$.',
          hints: [
            'Las dos direcciones propias de una simétrica son perpendiculares. La de autovalor $3$ está en la recta de $(1, 1)$.',
            'Con un autovalor $-1$ el estiramiento es $|-1|=1$: busca la dirección propia que le corresponde.',
          ],
          explain:
            'Un autovalor negativo estira y además voltea la flecha. El estiramiento solo mide la longitud, así que cuenta $|\\lambda|$. En la SVD ese signo se guarda en $U$ y los valores singulares quedan siempre positivos.',
          solution:
            'Sirve cualquier $v$ sobre la recta de $(1, -1)$: $(1, -1)$, $(2, -2)$ o $(-1, 1)$. Con $v=(1, -1)$, $A\\,v=(-1, 1)=-v$: la flecha se voltea y mide lo mismo, así que el estiramiento es $1$. Es el autovector de autovalor $-1$, y $\\sigma_2=|-1|=1$. En $(1, 1)$, $A\\,v=3v$ y $\\sigma_1=3$. En $A=U\\Sigma V^{T}$ eso se ve en que $u_2=-v_2$: el signo va en $U$.',
          plane: svdPlane({
            i: [1, 2],
            j: [2, 1],
            extra: [vec('v', 1, 0, true)],
            apply: ['v'],
            readouts: ['stretch', 'image'],
            range: 3,
          }),
          goals: [{ metric: 'stretch', of: ['i', 'j', 'v'], target: 1, tol: 0.01 }],
        },
        {
          id: 'svd.ex00.5',
          type: 'manipular',
          purpose: {
            why: 'Cuando todos los valores singulares de una capa valen lo mismo, la capa estira por igual en todas las direcciones: no favorece ninguna y no deforma. Es la idea de la inicialización ortogonal, que parte de matrices así para que la señal no se apague ni se dispare al pasar por muchas capas, y de medir cuánto se desvía una capa de eso con el cociente $\\sigma_1/\\sigma_2$.',
            aim: 'Vas a mover $\\hat{\\jmath}$ hasta que dos flechas perpendiculares, $p$ y $q$, se estiren lo mismo, y a ver en qué se convierte la elipse.',
            takeaway:
              'Con $\\hat{\\jmath}=(-1, 2)$ o $(1, -2)$ la elipse es una circunferencia de radio $\\sqrt{5}\\approx 2{,}24$: $\\sigma_1=\\sigma_2=\\sqrt{5}$ y el cociente $\\sigma_1/\\sigma_2$ vale $1$. La matriz es un giro (o una simetría) seguido de multiplicar por $\\sqrt{5}$: no hay direcciones favorecidas.',
          },
          prompt:
            '$\\hat{\\imath}=(2, 1)$ queda fija y puedes mover $\\hat{\\jmath}$, la segunda columna de $A$. Hay dos flechas fijas, $p=(1, 1)$ y $q=(1, -1)$, perpendiculares entre sí, cada una con su lectura de estiramiento. Mueve $\\hat{\\jmath}$, que parte de $(0, 1)$, hasta que las dos lecturas valgan **$2{,}24$**. Mira qué le pasa a la elipse, imagen de la circunferencia unidad.',
          hints: [
            'Ahora las lecturas son distintas, $2$ y $1{,}41$. Mueve $\\hat{\\jmath}$ de uno en uno y mira cómo cambian las dos.',
            'Una matriz que estira igual en todas las direcciones tiene columnas perpendiculares y del mismo largo. ¿Cuánto mide $\\hat{\\imath}$?',
          ],
          explain:
            'Una matriz que estira igual en todas las direcciones convierte la circunferencia en otra circunferencia: sus valores singulares son iguales. Pasa cuando las columnas son perpendiculares y miden lo mismo; entonces la matriz es un giro, o una simetría, por un factor.',
          solution:
            'Hay dos posiciones en la rejilla: $\\hat{\\jmath}=(-1, 2)$ y $\\hat{\\jmath}=(1, -2)$. Son perpendiculares a $\\hat{\\imath}=(2, 1)$ y miden como ella, $\\sqrt{5}$: $(2, 1)\\cdot(-1, 2)=0$. Con $\\hat{\\jmath}=(-1, 2)$, $A\\,p=(1, 3)$ y $A\\,q=(3, -1)$, las dos de longitud $\\sqrt{10}$, y $\\frac{\\sqrt{10}}{\\sqrt{2}}=\\sqrt{5}\\approx 2{,}24$. La elipse es una circunferencia de radio $\\sqrt{5}$: $\\sigma_1=\\sigma_2=\\sqrt{5}$. Con $(-1, 2)$ la matriz es un giro por $\\sqrt{5}$; con $(1, -2)$, una simetría.',
          plane: svdPlaneJMovable({
            i: [2, 1],
            j: [0, 1],
            extra: [vec('p', 1, 1, false), vec('q', 1, -1, false)],
            apply: ['p', 'q'],
            readouts: ['matrix', 'stretch'],
            range: 3,
          }),
          goals: [
            { metric: 'stretch', of: ['i', 'j', 'p'], target: 2.24, tol: 0.01 },
            { metric: 'stretch', of: ['i', 'j', 'q'], target: 2.24, tol: 0.01 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'svd.ex01.1',
          type: 'vector',
          purpose: {
            why: 'Lo primero que se mira al analizar una capa es su lista de valores singulares: dice cuánto estira en cada una de sus direcciones principales. `np.linalg.svd` la devuelve siempre en el mismo orden y sin signos negativos, y esa convención hay que saber leerla.',
            aim: 'Vas a leer los estiramientos de una matriz diagonal con un número negativo y a ordenarlos como lo hace una biblioteca.',
            takeaway:
              'Los valores singulares de esta matriz son $5$ y $3$: positivos y de mayor a menor. El $-5$ voltea una flecha, y ese volteo se guarda en $U$, no en $\\Sigma$. Por eso las listas que devuelven las bibliotecas se leen directamente como estiramientos.',
          },
          prompt:
            'La matriz $A=\\begin{pmatrix}3&0\\\\0&-5\\end{pmatrix}$ estira el eje $x$ por $3$ y el eje $y$ por $5$, y además voltea este último. Escribe sus dos **valores singulares**, de mayor a menor: primero $\\sigma_1$ y después $\\sigma_2$.',
          hints: [
            'Un valor singular mide cuánto estira la matriz una dirección, es decir, una longitud, y una longitud no es negativa.',
            'Ordénalos de mayor a menor.',
          ],
          explain:
            'Un valor singular es un estiramiento, y un estiramiento no puede ser negativo: el signo de $-5$ describe un volteo, que va en $U$. Y se dan siempre de mayor a menor.',
          solution:
            '$\\sigma_1=|-5|=5$ y $\\sigma_2=3$, es decir, $(5, 3)$. Si escribes $(3, -5)$ has copiado la diagonal; si escribes $(3, 5)$, los has dejado sin ordenar.',
          answer: [5, 3],
          tol: 0,
        },
        {
          id: 'svd.ex01.2',
          type: 'numero',
          purpose: {
            why: 'Los $\\sigma^{2}$ son los autovalores de $A^{T}A$, una matriz simétrica y por tanto fácil de tratar. Esa conexión explica por qué PCA y SVD son parientes: la covarianza de unos datos centrados es, salvo un factor, $X^{T}X$.',
            aim: 'Vas a calcular $A^{T}A$, sacar su autovalor mayor y hacerle la raíz cuadrada para llegar al estiramiento máximo de $A$.',
            takeaway:
              'Los autovalores de $A^{T}A$ son $45$ y $5$, y $\\sigma_1=\\sqrt{45}\\approx 6{,}71$. Esta ruta, de $A^{T}A$ a $\\sigma$ con una raíz, sirve para entender qué es un valor singular; las bibliotecas usan métodos numéricos más estables que formar $A^{T}A$.',
          },
          prompt:
            'Sea $A=\\begin{pmatrix}3&0\\\\4&5\\end{pmatrix}$. Los valores singulares de $A$ son las raíces cuadradas de los autovalores de $A^{T}A$. Calcula $A^{T}A$ y escribe $\\sigma_1$, el mayor, con dos decimales.',
          hints: [
            '$A^{T}A$ es una matriz simétrica de $2\\times 2$: sus entradas son los productos escalares de las columnas de $A$ entre sí.',
            'Para una simétrica $\\begin{pmatrix}a&b\\\\b&a\\end{pmatrix}$, los autovalores son $a+b$ y $a-b$.',
          ],
          explain:
            'Los autovalores de $A^{T}A$ son los **cuadrados** de los valores singulares. Si respondes con el autovalor, falta la raíz.',
          solution:
            '$A^{T}A=\\begin{pmatrix}25&20\\\\20&25\\end{pmatrix}$, con autovalores $25+20=45$ y $25-20=5$. Entonces $\\sigma_1=\\sqrt{45}\\approx 6{,}71$ y $\\sigma_2=\\sqrt{5}\\approx 2{,}24$. Si te sale $45$, falta la raíz cuadrada. Comprobación: $\\sigma_1\\sigma_2=\\sqrt{225}=15=|\\det A|$.',
          answer: 6.71,
          tol: 0.01,
        },
        {
          id: 'svd.ex01.3',
          type: 'numero',
          purpose: {
            why: 'El factor con el que una matriz multiplica las áreas (en dimensión alta, los volúmenes) es el producto de sus valores singulares. Si alguno es casi cero, la capa aplasta el espacio en esa dirección y pierde información, y es una de las señales que se miran al diagnosticar una capa.',
            aim: 'Vas a multiplicar los valores singulares de una matriz para saber cómo cambian las áreas.',
            takeaway:
              'La matriz multiplica las áreas por $4\\cdot 0{,}5=2$: la elipse imagen de la circunferencia unidad tiene semiejes $4$ y $0{,}5$ y área $2\\pi$, frente a $\\pi$. Si el valor singular pequeño bajara hacia $0$, el área se hundiría hacia $0$ y la matriz dejaría de ser invertible.',
          },
          prompt:
            'Una matriz de $2\\times 2$ tiene valores singulares $4$ y $0{,}5$. ¿Por cuánto multiplica las áreas?',
          hints: [
            'La circunferencia unidad se convierte en una elipse cuyos semiejes miden los valores singulares.',
            'El área de una elipse de semiejes $a$ y $b$ es $\\pi a b$, y la de la circunferencia unidad es $\\pi$.',
          ],
          explain:
            'El factor de áreas es $|\\det A|$, que es el producto de los valores singulares. Sumarlos o dividirlos no tiene ese sentido.',
          solution:
            'La elipse tiene semiejes $4$ y $0{,}5$ y su área es $\\pi\\cdot 4\\cdot 0{,}5=2\\pi$, el doble de la de la circunferencia unidad, $\\pi$. Las áreas se multiplican por $4\\cdot 0{,}5=2$, que es $|\\det A|$. Si te sale $4{,}5$ has sumado; si te sale $8$, has dividido.',
          answer: 2,
          tol: 0,
        },
        {
          id: 'svd.ex01.4',
          type: 'numero',
          purpose: {
            why: 'Un valor singular mayor que $1$ en una capa amplifica algunas entradas, y al encadenar capas esas amplificaciones se multiplican y el entrenamiento se desestabiliza. La **normalización espectral**, usada en los discriminadores de las GAN, divide los pesos de cada capa entre $\\sigma_1$ para acotar cuánto puede alargar una entrada.',
            aim: 'Vas a usar $\\sigma_1$ para acotar la norma de la salida de una capa, sin conocer la entrada exacta, solo su tamaño.',
            takeaway:
              'Ninguna entrada de norma $3$ sale con norma mayor que $\\sigma_1\\cdot 3=18$, y esa cota se alcanza si la entrada va en la dirección de $v_1$. Si se divide $W$ entre $\\sigma_1=6$, la cota pasa a $3$: ninguna entrada se alarga.',
          },
          prompt:
            'Una capa $W$ tiene valores singulares $6$, $2$ y $0{,}5$. Una entrada $x$ tiene norma $3$. Según la dirección en que apunte $x$, ¿cuál es la **mayor** norma que puede tener $Wx$?',
          hints: [
            'Cada dirección se estira por un factor entre el menor y el mayor de los valores singulares.',
            'El factor máximo es $\\sigma_1$. Multiplícalo por la norma de $x$.',
          ],
          explain:
            'El mayor estiramiento posible es $\\sigma_1$ (la norma espectral), y la salida más larga se da cuando $x$ va en la dirección de $v_1$. Los otros valores singulares dan salidas más cortas.',
          solution:
            '$|Wx|\\le\\sigma_1|x|=6\\cdot 3=18$, y se alcanza con $x$ en la dirección de $v_1$. La menor norma posible sería $0{,}5\\cdot 3=1{,}5$. Si te sale $6$, falta multiplicar por la norma de $x$; si te sale $1{,}5$, has usado el menor valor singular.',
          answer: 18,
          tol: 0,
        },
        {
          id: 'svd.ex01.5',
          type: 'opcion',
          purpose: {
            why: 'En la práctica una matriz casi nunca tiene un valor singular exactamente cero: el redondeo de los decimales deja ruido. Saber cuántos valores singulares cuentan de verdad decide cuánto se puede comprimir un peso y si una capa pierde información.',
            aim: 'Vas a decidir cuántos de los valores singulares de una capa son reales y cuántos son ruido de redondeo.',
            takeaway:
              'El rango efectivo es $2$: el tercer valor, del orden de $10^{-10}$, es ruido de redondeo junto a $8{,}3$. `np.linalg.matrix_rank` lo decide con una tolerancia relativa al mayor valor singular, y contar los valores distintos de cero con `S > 0` daría $3$, un error.',
          },
          prompt:
            'Una matriz de pesos de $3\\times 3$ pasa por `np.linalg.svd`, que devuelve los valores singulares $8{,}3$; $2{,}1$ y $4\\cdot 10^{-10}$ (es decir, $0{,}0000000004$). ¿Cuál es su rango en la práctica?',
          hints: [
            'Compara el tamaño del tercer valor con el de los otros dos.',
            'Con decimales en el ordenador, un cero exacto casi nunca aparece: lo que se mira es si un valor es ridículamente pequeño frente al mayor.',
          ],
          explain:
            'El rango es el número de valores singulares que no son cero, y en un ordenador «cero» se decide con una tolerancia relativa al mayor valor singular. Un valor del orden de $10^{-10}$ junto a un $8{,}3$ es ruido, y la matriz es, a todos los efectos, de rango $2$.',
          solution:
            'Rango $2$. La capa aplasta una dirección del espacio, y lo que sale por ahí es ruido de redondeo. Contar los valores distintos de cero daría $3$, pero con decimales esa cuenta no sirve; el rango $1$ ignora el $2{,}1$, que es una cuarta parte del mayor y no es ruido; y no hace falta ver la matriz: los valores singulares bastan.',
          options: [
            'Rango 3, porque los tres valores singulares son distintos de cero',
            'Rango 2: el tercer valor es tan pequeño frente a los otros que es ruido de redondeo',
            'Rango 1, porque solo hay un valor singular grande',
            'No se puede saber sin ver la matriz entera',
          ],
          correct: 1,
        },
      ],
    },
    { kind: 'programar', questions: [] },
  ],
  sheets: [
    {
      id: 'svd.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere la dirección de entrada que una matriz `A` de $2\\times 2$ estira más, y cuánto la estira. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        '`np.linalg.svd` devuelve `Vt`, no `V`. ¿Dónde están las direcciones, en las filas o en las columnas de `Vt`?',
        'La tercera línea usa `v1` tal como viene. Si `v1` no es la dirección buscada, su resultado tampoco lo es.',
      ],
      explain:
        '`Vt` es la traspuesta de `V`, así que las direcciones de entrada están en sus filas. Revisa si cada línea usa lo que la anterior debería haber preparado.',
      solution:
        'La segunda línea está mal. `Vt[:, 0]` es la primera **columna** de `Vt`, y la dirección de entrada $v_1$ es su primera **fila**: `Vt[0]`. La primera línea está bien. La tercera arrastra el error: con una dirección que no es $v_1$, `np.linalg.norm(A @ v1)` no da el estiramiento máximo.',
      lines: [
        'U, S, Vt = np.linalg.svd(A)',
        'v1 = Vt[:, 0]',
        'estiramiento = np.linalg.norm(A @ v1)',
      ],
      faultyLine: 1,
    },
    {
      id: 'svd.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento calcula los valores singulares de una matriz simétrica. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Piensa en qué mide un valor singular y si una medida así puede ser negativa.',
        'Comprueba el resultado con el determinante: el producto de los valores singulares es su valor absoluto.',
      ],
      explain:
        'Un valor singular es un estiramiento y nunca es negativo: el signo de un autovalor se guarda en $U$. Revisa cada línea con esa regla.',
      solution:
        'La segunda línea está mal. Para una matriz simétrica, los valores singulares son los **valores absolutos** de los autovalores: $|3|=3$ y $|-1|=1$. Un valor singular no puede valer $-1$. Comprobación: $\\sigma_1\\sigma_2=3\\cdot 1=3=|\\det A|$, y $\\det A=1-4=-3$.',
      lines: [
        'A tiene filas (1, 2) y (2, 1), es simétrica y sus autovalores son 3 y −1',
        'Luego los valores singulares de A son 3 y −1',
        'Ordenados de mayor a menor, σ₁ = 3 y σ₂ = −1',
      ],
      faultyLine: 1,
    },
    {
      id: 'svd.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento estudia cómo estira una matriz que solo gira. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Si una matriz no cambia la longitud de ninguna flecha, ¿cuánto estira en cada dirección?',
        'Comprueba que cada línea se sigue de la anterior.',
      ],
      explain:
        'Una matriz que solo gira conserva todas las longitudes, así que estira igual en todas las direcciones. Revisa cada paso con esa idea y con lo que son los valores singulares.',
      solution:
        'No hay ningún error. Un giro no cambia la longitud de ninguna flecha, así que el estiramiento es $1$ en todas las direcciones y el mayor y el menor coinciden: $\\sigma_1=\\sigma_2=1$. La imagen de la circunferencia unidad es ella misma y el número de condición, $\\sigma_1/\\sigma_2$, vale $1$.',
      lines: [
        'Q gira cada flecha 30° y no cambia su longitud, así que |Qx| = |x| para toda x',
        'Entonces el estiramiento es 1 en todas las direcciones, y el mayor y el menor valen lo mismo: σ₁ = σ₂ = 1',
        'Luego la imagen de la circunferencia unidad es ella misma, y el número de condición σ₁/σ₂ vale 1',
      ],
      faultyLine: null,
    },
  ],
};
