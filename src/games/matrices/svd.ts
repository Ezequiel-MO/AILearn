import type { PlaneSpec, PlaneVector, Project } from '../../content/schema';
import { py } from '../py';
import { svdWarmup } from './svd.calentamiento';
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
  warmup: svdWarmup,
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
    {
      kind: 'programar',
      questions: [
        {
          id: 'svd.ex02.1',
          type: 'codigo',
          prompt:
            '`A` es una matriz de $2\\times 2$. Su descomposición en valores singulares la parte en tres factores, y de ella salen la dirección que más estira, cuánto la estira y adónde la manda. Guarda en `sigma1` el mayor valor singular (un solo número); en `v1`, la dirección de entrada que lo da (un array de 2 números y norma 1); y en `u1`, la dirección de salida correspondiente (otro array de 2 números y norma 1).\n\nSe cumple $A\\,v_1=\\sigma_1\\,u_1$. El signo de `v1` es arbitrario, pero si cambia, el de `u1` cambia con él: las dos soluciones valen.',
          hints: [
            'El plan son cuatro líneas. Primero, `np.linalg.svd(A)` devuelve tres cosas que recoges a la vez en `U, S, Vt`. `sigma1` es el primer elemento de `S`, que viene de mayor a menor. `v1` es una **fila** de `Vt`, la primera, porque `Vt` es la traspuesta de $V$ y las direcciones de entrada van en filas. `u1` es una **columna** de `U`, la primera, porque las de salida van en columnas. Fila para `v1` y columna para `u1`: es el error más fácil de cometer.',
            'Las piezas, con otra matriz:\n\n' +
              py(
                'M = np.array([[0, 2], [1, 0]])',
                'P, T, Qt = np.linalg.svd(M)',
                'print(T)             # [2. 1.]: los valores singulares, de mayor a menor',
                'print(T[0])          # 2.0: el mayor, un solo número',
                'print(Qt[0])         # la primera FILA de Qt: una dirección de entrada, 2 números',
                'print(P[:, 0])       # la primera COLUMNA de P: una dirección de salida, 2 números',
                'print(Qt[:, 0])      # la primera columna de Qt: no es una dirección de entrada',
              ) +
              '\n\nLa primera fila de `Qt` y la primera columna de `P` van juntas con `T[0]`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'U, S, Vt = np.linalg.svd(A)',
                'sigma1 = S[___]',
                'v1 = Vt[___]',
                'u1 = U[:, ___]',
              ) +
              '\n\nEl error típico es escribir `Vt[:, 0]` o `U[0]`: la columna de `Vt` y la fila de `U` no son las direcciones.',
          ],
          explain:
            'Cada valor singular `S[k]` va con una fila de `Vt` (la dirección de entrada) y una columna de `U` (la de salida). Si te sale que $A\\,v_1$ no es $\\sigma_1\\,u_1$, revisa si has sacado una fila donde iba una columna o al revés: `Vt` guarda las direcciones de entrada en filas, `U` las de salida en columnas.',
          solution:
            'Los valores singulares de $A=\\begin{pmatrix}3&2\\\\0&2\\end{pmatrix}$ son $\\sigma_1\\approx 3{,}81$ y $\\sigma_2\\approx 1{,}57$. La dirección de entrada es $v_1\\approx\\pm(0{,}74;\\ 0{,}68)$ y la de salida, $u_1\\approx\\pm(0{,}93;\\ 0{,}36)$, con el mismo signo que $v_1$. Comprobación: $A\\,v_1\\approx(3{,}56;\\ 1{,}35)=\\sigma_1\\,u_1$. Errores típicos: `Vt[:, 0]`, que da $(0{,}74;\\ -0{,}68)$ en vez de la fila; `U[0]`, que da $(0{,}93;\\ -0{,}36)$; y `sigma1 = S`, que es el array entero.',
          requirements: [
            '`sigma1` es un solo número: el mayor valor singular de `A`.',
            '`v1` es un array de NumPy con 2 números y norma 1: la dirección de entrada del mayor valor singular. Se acepta cualquiera de sus dos signos.',
            '`u1` es un array de NumPy con 2 números y norma 1: la dirección de salida correspondiente, de forma que $A\\,v_1=\\sigma_1\\,u_1$ con el signo de `v1`. Se acepta una diferencia diminuta de redondeo.',
          ],
          starter: `import numpy as np

A = np.array([[3, 2], [0, 2]])
# A: un array de NumPy de 2 filas y 2 columnas.

# PASO 1. sigma1: el mayor valor singular de A.
# Por qué: es lo máximo que A puede alargar una flecha. Es la longitud del semieje largo
# de la elipse en que A convierte la circunferencia unidad.
# np.linalg.svd(A) devuelve TRES cosas a la vez, y se recogen así: U, S, Vt = np.linalg.svd(A)
#   U: una matriz cuyas COLUMNAS son las direcciones de salida.
#   S: un array con los valores singulares, de mayor a menor.
#   Vt: una matriz cuyas FILAS son las direcciones de entrada.
# Escribe esa línea antes de sigma1. Un elemento de un array se saca con S[0] (el primero).
# Resultado esperado: un solo número.
sigma1 = None

# PASO 2. v1: la dirección de entrada que A estira más.
# Por qué: es la flecha que, al entrar en A, sale con la longitud sigma1.
# Vt guarda las direcciones de entrada en sus FILAS. Vt[0] saca la fila 0 entera.
# Resultado esperado: un array con 2 números y norma 1.
v1 = None

# PASO 3. u1: la dirección de salida de ese estiramiento.
# Por qué: A manda v1 a sigma1 por u1; u1 dice hacia dónde apunta esa flecha estirada.
# U guarda las direcciones de salida en sus COLUMNAS. U[:, 0] saca la columna 0 entera.
# Resultado esperado: un array con 2 números y norma 1.
u1 = None

# Para ver qué vale algo antes de entregar: print(A @ v1) y print(sigma1 * u1) deben coincidir.
`,
          checks: `_A = np.array([[3, 2], [0, 2]], dtype=float)
_U, _S, _Vt = np.linalg.svd(_A)
def _vec(a):
    return isinstance(a, np.ndarray) and a.shape == (2,) and (np.issubdtype(a.dtype, np.floating) or np.issubdtype(a.dtype, np.integer))
_s = isinstance(sigma1, (int, float, np.integer, np.floating)) and not isinstance(sigma1, (bool, np.bool_))
_sok = _s and abs(float(sigma1) - float(_S[0])) < 1e-6
check(_s, "\`sigma1\` tiene que ser un solo número: el mayor valor singular de \`A\`, no el array \`S\` entero.")
check((not _s) or _sok, "\`sigma1\` no es el mayor valor singular de \`A\`. \`S\` los trae de mayor a menor: el mayor es el primero.")
_v = _vec(v1)
_vn = _v and abs(float(np.linalg.norm(v1)) - 1) < 1e-6
_vok = _vn and abs(float(v1 @ _Vt[0])) > 0.999999
_vcol = _vn and not _vok and abs(float(v1 @ _Vt[:, 0])) > 0.999999
check(_v, "\`v1\` tiene que ser un array de NumPy con 2 números: la dirección de entrada.")
check((not _v) or _vn, "\`v1\` tiene que medir 1, como las filas de \`Vt\`.")
check((not _vcol), "\`v1\` es la primera columna de \`Vt\`. Las direcciones de entrada van en las filas de \`Vt\`, no en las columnas: la primera es \`Vt[0]\`.")
check((not _vn) or _vok or _vcol, "\`v1\` no es la dirección de entrada del mayor valor singular. Es la primera fila de \`Vt\`.")
_u = _vec(u1)
_gate = _sok and _vok
_un = _u and abs(float(np.linalg.norm(u1)) - 1) < 1e-6
_uok = _un and _gate and bool(np.allclose(_A @ v1, sigma1 * u1, atol=1e-6))
_urow = _un and (not _uok) and abs(float(u1 @ _U[0])) > 0.999999 and abs(float(u1 @ _U[:, 0])) < 0.999999
check(_u, "\`u1\` tiene que ser un array de NumPy con 2 números: la dirección de salida.")
check((not _u) or _un, "\`u1\` tiene que medir 1, como las columnas de \`U\`.")
check((not _urow) or (not _gate), "\`u1\` es la primera fila de \`U\`. Las direcciones de salida van en las columnas de \`U\`: la primera es \`U[:, 0]\`.")
check((not _un) or (not _gate) or _uok or _urow, "\`u1\` no cumple que \`A @ v1\` sea \`sigma1 * u1\`. Tiene que ser la primera columna de \`U\`, con el signo que acompaña al de \`v1\`.")
`,
          reference: `import numpy as np

A = np.array([[3, 2], [0, 2]])
# Guarda en sigma1 el mayor valor singular de A, en v1 su dirección de entrada y en u1 la de salida
U, S, Vt = np.linalg.svd(A)
sigma1 = S[0]
v1 = Vt[0]
u1 = U[:, 0]
`,
        },
        {
          id: 'svd.ex02.2',
          type: 'codigo',
          prompt:
            '`A` es una capa que lleva vectores de 2 números a vectores de 3 números: una matriz de 3 filas y 2 columnas. Guarda en `U`, `S` y `Vt` su descomposición **reducida** (`U` de 3 filas y 2 columnas, `S` con 2 números y `Vt` de 2 filas y 2 columnas); en `A_rec`, la matriz que sale de volver a multiplicar los tres factores; y en `reconstruye`, si `A_rec` coincide con `A` (un `True` o un `False`, comparados con `np.allclose`).',
          hints: [
            'El plan son tres líneas. `np.linalg.svd(A, full_matrices=False)` da la versión reducida, la que encaja para multiplicar. `S` es un array de una dimensión y no se puede multiplicar tal cual: hay que convertirlo en una matriz con los valores en la diagonal, con `np.diag(S)`. El producto en este orden es `U`, la diagonal y `Vt`. Y el parecido con `A` se mide con `np.allclose`, no con `==`, porque el redondeo deja diferencias diminutas.',
            'Las piezas, con otra matriz:\n\n' +
              py(
                'M = np.array([[1, 0], [0, 2], [3, 0]])',
                'P, T, Qt = np.linalg.svd(M, full_matrices=False)',
                'print(P.shape, T.shape, Qt.shape)   # (3, 2) (2,) (2, 2)',
                'D = np.diag(T)',
                'print(D.shape)                      # (2, 2): T puesta en la diagonal',
                'R = P @ D @ Qt',
                'print(R.shape)                      # (3, 2): la forma de M',
                'print(np.allclose(M, R))            # True: coinciden salvo el redondeo',
              ) +
              '\n\nSin `full_matrices=False`, `P` sería de 3 por 3 y el producto no encajaría.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'U, S, Vt = np.linalg.svd(A, full_matrices=___)',
                'A_rec = U @ np.___(S) @ Vt',
                'reconstruye = np.___(A, A_rec)',
              ) +
              '\n\nEl error típico es olvidar `S` y escribir `U @ Vt`: sale de la forma correcta, pero no es `A`.',
          ],
          explain:
            'Una capa de 2 a 3 dimensiones tiene una `U` de 3 por 2: con `full_matrices=False` solo salen las columnas que corresponden a un valor singular. `S` va entre medias, como matriz diagonal. Que la reconstrucción coincida con `A` es la prueba de que los tres factores contienen toda la información de la matriz.',
          solution:
            '$A=\\begin{pmatrix}1&0\\\\2&1\\\\0&3\\end{pmatrix}$ tiene valores singulares $3{,}27$ y $2{,}07$. Con `full_matrices=False`, `U` es de $3\\times 2$, `S` tiene 2 números y `Vt` es de $2\\times 2$; `np.diag(S)` es de $2\\times 2$ y `U @ np.diag(S) @ Vt` vuelve a ser de $3\\times 2$ y coincide con `A`. Errores típicos: no pedir la versión reducida, con lo que `U` sale de $3\\times 3$; y `U @ Vt`, que olvida `S` y no es `A`.',
          requirements: [
            '`U` es un array de NumPy de 3 filas y 2 columnas, `S` tiene 2 números y `Vt` es de 2 filas y 2 columnas: la descomposición reducida de `A`.',
            '`A_rec` es un array de 3 filas y 2 columnas: el producto de `U`, la matriz diagonal de `S` y `Vt`, que coincide con `A` salvo un redondeo diminuto.',
            '`reconstruye` es un solo `True` o `False`: el resultado de `np.allclose` entre `A` y `A_rec`.',
          ],
          starter: `import numpy as np

A = np.array([[1, 0], [2, 1], [0, 3]])
# A: un array de NumPy de 3 filas y 2 columnas (una capa que pasa de 2 a 3 números).

# PASO 1. U, S y Vt: la descomposición REDUCIDA de A.
# Por qué: con una matriz que no es cuadrada, np.linalg.svd(A) devuelve por defecto una U
# de 3 por 3 que lleva una columna de más, y no encaja al multiplicar. La versión reducida
# se pide con el argumento full_matrices=False.
# Se recogen las tres cosas a la vez: U, S, Vt = np.linalg.svd(A, full_matrices=False)
# Escribe esa línea y deja U, S y Vt con sus valores.
# Resultado esperado: U de 3 filas y 2 columnas, S con 2 números, Vt de 2 filas y 2 columnas.
U = None
S = None
Vt = None

# PASO 2. A_rec: la matriz reconstruida con los tres factores.
# Por qué: si multiplicar U, Sigma y Vt devuelve A, no se ha perdido nada.
# S es un array de una dimensión, y para multiplicar hace falta una matriz: np.diag(S)
# la pone en la diagonal de una matriz de 2 por 2. Por ejemplo, np.diag([5, 7]) es
# [[5, 0], [0, 7]]. El producto de matrices se escribe con @.
# Resultado esperado: un array de 3 filas y 2 columnas.
A_rec = None

# PASO 3. reconstruye: si A_rec coincide con A.
# Por qué: con decimales, un == falla por el redondeo. np.allclose(a, b) dice si dos
# arrays son iguales salvo una diferencia diminuta, y devuelve un solo True o False.
# Resultado esperado: True o False.
reconstruye = None

# Para ver qué vale algo antes de entregar: print(A_rec) y pulsa «Ejecutar».
`,
          checks: `_A = np.array([[1, 0], [2, 1], [0, 3]], dtype=float)
_U0, _S0, _Vt0 = np.linalg.svd(_A, full_matrices=False)
def _arr(a, s):
    return isinstance(a, np.ndarray) and a.shape == s and (np.issubdtype(a.dtype, np.floating) or np.issubdtype(a.dtype, np.integer))
_full = isinstance(U, np.ndarray) and U.shape == (3, 3)
_ua = _arr(U, (3, 2))
_sa = _arr(S, (2,))
_va = _arr(Vt, (2, 2))
check(_ua or not _full, "\`U\` sale de 3 filas y 3 columnas: es la descomposición completa, con una columna que sobra. Pide la reducida con \`full_matrices=False\`.")
check(_ua or _full, "\`U\` tiene que ser un array de NumPy de 3 filas y 2 columnas: la \`U\` de la descomposición reducida de \`A\`.")
check(_sa, "\`S\` tiene que ser un array de NumPy con 2 números: los valores singulares de \`A\`.")
check(_va, "\`Vt\` tiene que ser un array de NumPy de 2 filas y 2 columnas: la \`Vt\` de la descomposición reducida de \`A\`.")
_ok = _ua and _sa and _va and bool(np.allclose(S, _S0))
_r = _arr(A_rec, (3, 2))
_rok = _r and bool(np.allclose(A_rec, _A))
check(_r, "\`A_rec\` tiene que ser un array de NumPy de 3 filas y 2 columnas: la reconstrucción de \`A\`.")
check((not _r) or (not _ok) or _rok or not np.allclose(A_rec, _U0 @ _Vt0), "\`A_rec\` es \`U @ Vt\`, sin \`S\`: no recupera \`A\`. Falta multiplicar por la matriz diagonal de \`S\` entre \`U\` y \`Vt\`.")
check((not _r) or (not _ok) or _rok or np.allclose(A_rec, _U0 @ _Vt0), "\`A_rec\` no coincide con \`A\`: tiene que ser \`U\` por la matriz diagonal de \`S\` por \`Vt\`, en ese orden.")
_b = isinstance(reconstruye, (bool, np.bool_))
check(_b, "\`reconstruye\` tiene que ser un solo \`True\` o \`False\`: el resultado de \`np.allclose\`.")
check((not _b) or (not _rok) or bool(reconstruye), "\`reconstruye\` vale \`False\`, pero \`A_rec\` coincide con \`A\`. Compáralas con \`np.allclose(A, A_rec)\`.")
`,
          reference: `import numpy as np

A = np.array([[1, 0], [2, 1], [0, 3]])
# Guarda en U, S y Vt la descomposición reducida de A, en A_rec la reconstrucción y en reconstruye si coincide con A
U, S, Vt = np.linalg.svd(A, full_matrices=False)
A_rec = U @ np.diag(S) @ Vt
reconstruye = np.allclose(A, A_rec)
`,
        },
        {
          id: 'svd.ex02.3',
          type: 'codigo',
          prompt:
            '`A` es una matriz de 3 filas y 2 columnas. Los valores singulares se pueden calcular de dos formas, y las dos tienen que dar lo mismo. Guarda en `S` los valores singulares que da `np.linalg.svd` (sin `U` ni `Vt`); en `vals`, los autovalores de $A^{T}A$ de mayor a menor; en `sigma_eig`, las raíces cuadradas de esos autovalores; y en `coinciden`, si `S` y `sigma_eig` son iguales (un `True` o un `False`, comparados con `np.allclose`).',
          hints: [
            'El plan son cuatro líneas. `S`: `np.linalg.svd(A, compute_uv=False)` devuelve solo los valores singulares, sin las matrices. `vals`: la matriz es `A.T @ A`, simétrica y de 2 por 2, y `np.linalg.eigvalsh` da sus autovalores **de menor a mayor**, así que hay que darles la vuelta con `[::-1]`. `sigma_eig`: los valores singulares son las **raíces** de esos autovalores, con `np.sqrt`. Por último, `np.allclose` compara los dos arrays.',
            'Las piezas, con otra matriz:\n\n' +
              py(
                'M = np.array([[1, 0], [0, 2], [0, 0]])',
                'print(np.linalg.svd(M, compute_uv=False))   # [2. 1.]: solo los valores singulares',
                'G = M.T @ M',
                'print(G.shape)                              # (2, 2): de columnas por columnas',
                'w = np.linalg.eigvalsh(G)',
                'print(w)                                    # [1. 4.]: de menor a mayor',
                'print(w[::-1])                              # [4. 1.]: de mayor a menor',
                'print(np.sqrt(w[::-1]))                     # [2. 1.]: la raíz de cada uno',
              ) +
              '\n\nLas raíces de los autovalores de $M^{T}M$ coinciden con los valores singulares.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'S = np.linalg.svd(A, compute_uv=___)',
                'vals = np.linalg.eigvalsh(A.___ @ A)[___]',
                'sigma_eig = np.___(vals)',
                'coinciden = np.allclose(S, sigma_eig)',
              ) +
              '\n\nLos errores típicos son no dar la vuelta a los vals, olvidar la raíz y usar `A @ A.T`, que es de 3 por 3 y trae un autovalor de más.',
          ],
          explain:
            'Los valores singulares de $A$ son las raíces cuadradas de los autovalores de $A^{T}A$, que es simétrica. Por eso `eigvalsh` sirve aquí, y por eso el orden importa: `eigvalsh` va de menor a mayor y `svd`, de mayor a menor. Con $AA^{T}$ también salen los mismos valores distintos de cero, pero al ser de 3 por 3 trae un autovalor 0 más.',
          solution:
            'Con $A=\\begin{pmatrix}2&1\\\\0&2\\\\1&0\\end{pmatrix}$, $A^{T}A=\\begin{pmatrix}5&2\\\\2&5\\end{pmatrix}$ tiene autovalores $7$ y $3$, de mayor a menor, y `sigma_eig` vale $(\\sqrt{7};\\ \\sqrt{3})\\approx(2{,}65;\\ 1{,}73)$, que es también `S`. Errores típicos: dejar los autovalores de menor a mayor, con lo que no coinciden con `S`; olvidar la raíz, con lo que salen $7$ y $3$; y usar `A @ A.T`, de $3\\times 3$, con un tercer autovalor 0.',
          requirements: [
            '`S` es un array de NumPy con 2 números: los valores singulares de `A`, de mayor a menor.',
            '`vals` es un array con 2 números: los autovalores de $A^{T}A$, de mayor a menor.',
            '`sigma_eig` es un array con 2 números: la raíz cuadrada de cada autovalor, en el mismo orden.',
            '`coinciden` es un solo `True` o `False`: el resultado de comparar `S` y `sigma_eig` con `np.allclose`.',
          ],
          starter: `import numpy as np

A = np.array([[2, 1], [0, 2], [1, 0]])
# A: un array de NumPy de 3 filas y 2 columnas.

# PASO 1. S: los valores singulares de A, calculados por la vía directa.
# Por qué: es el resultado de referencia con el que se compara el otro camino.
# np.linalg.svd(A, compute_uv=False) devuelve SOLO los valores singulares, de mayor a menor,
# sin las matrices U y Vt.
# Resultado esperado: un array con 2 números.
S = None

# PASO 2. vals: los autovalores de A.T @ A, de mayor a menor.
# Por qué: los valores singulares salen de A.T @ A, una matriz cuadrada y simétrica.
# A.T es la traspuesta de A. np.linalg.eigvalsh(G) da los autovalores de una matriz simétrica G,
# de MENOR a MAYOR. x[::-1] da la vuelta a un array: np.array([1, 2, 3])[::-1] es [3, 2, 1].
# Resultado esperado: un array con 2 números, de mayor a menor.
vals = None

# PASO 3. sigma_eig: las raíces cuadradas de esos autovalores.
# Por qué: los autovalores de A.T @ A son los cuadrados de los valores singulares.
# np.sqrt(x) saca la raíz cuadrada de cada número de un array.
# Resultado esperado: un array con 2 números.
sigma_eig = None

# PASO 4. coinciden: si S y sigma_eig son lo mismo.
# Por qué: con decimales, un == falla por el redondeo. np.allclose(a, b) dice si dos
# arrays son iguales salvo una diferencia diminuta, y devuelve un solo True o False.
# Resultado esperado: True o False.
coinciden = None

# Para ver qué vale algo antes de entregar: print(S, sigma_eig) y pulsa «Ejecutar».
`,
          checks: `_A = np.array([[2, 1], [0, 2], [1, 0]], dtype=float)
_S = np.linalg.svd(_A, compute_uv=False)
_w = np.linalg.eigvalsh(_A.T @ _A)[::-1]
def _arr(a, n):
    return isinstance(a, np.ndarray) and a.shape == (n,) and (np.issubdtype(a.dtype, np.floating) or np.issubdtype(a.dtype, np.integer))
_a = _arr(S, 2)
_aok = _a and bool(np.allclose(S, _S))
check(_a, "\`S\` tiene que ser un array de NumPy con 2 números: los valores singulares de \`A\`.")
check((not _a) or _aok, "\`S\` no son los valores singulares de \`A\`. Usa \`np.linalg.svd(A, compute_uv=False)\`.")
_b3 = isinstance(vals, np.ndarray) and vals.shape == (3,)
_b = _arr(vals, 2)
_bok = _b and bool(np.allclose(vals, _w))
check(_b or not _b3, "\`vals\` trae 3 números: se ha usado \`A @ A.T\`, de 3 por 3. Tiene que ser \`A.T @ A\`, de 2 por 2, con un autovalor por columna de \`A\`.")
check(_b or _b3, "\`vals\` tiene que ser un array de NumPy con 2 números: los autovalores de \`A.T @ A\`.")
check((not _b) or _bok or not np.allclose(vals, _w[::-1]), "\`vals\` está de menor a mayor, el orden de \`eigvalsh\`. Tienen que ir de mayor a menor: dale la vuelta con \`[::-1]\`.")
check((not _b) or _bok or np.allclose(vals, _w[::-1]) or not np.allclose(vals, _S), "\`vals\` ya son los valores singulares. Los autovalores de \`A.T @ A\` son sus cuadrados; la raíz va en el paso siguiente.")
check((not _b) or _bok or np.allclose(vals, _w[::-1]) or np.allclose(vals, _S), "\`vals\` tiene que ser los dos autovalores de \`A.T @ A\`, de mayor a menor.")
_c = _arr(sigma_eig, 2)
_cok = _c and bool(np.allclose(sigma_eig, _S))
check(_c, "\`sigma_eig\` tiene que ser un array de NumPy con 2 números: la raíz de cada autovalor.")
check((not _c) or (not _bok) or _cok or not np.allclose(sigma_eig, _w), "\`sigma_eig\` son los autovalores sin más: falta la raíz cuadrada. Los autovalores son los cuadrados de los valores singulares.")
check((not _c) or (not _bok) or _cok or np.allclose(sigma_eig, _w), "\`sigma_eig\` tiene que ser la raíz cuadrada de cada autovalor, en el mismo orden.")
_d = isinstance(coinciden, (bool, np.bool_))
check(_d, "\`coinciden\` tiene que ser un solo \`True\` o \`False\`: el resultado de \`np.allclose\`.")
check((not _d) or (not _aok) or (not _cok) or bool(coinciden), "\`coinciden\` vale \`False\`, pero \`S\` y \`sigma_eig\` son iguales salvo el redondeo. Compáralas con \`np.allclose(S, sigma_eig)\`.")
`,
          reference: `import numpy as np

A = np.array([[2, 1], [0, 2], [1, 0]])
# Guarda en S los valores singulares, en vals los de A.T @ A de mayor a menor, en sigma_eig sus raíces y en coinciden si S y sigma_eig son iguales
S = np.linalg.svd(A, compute_uv=False)
vals = np.linalg.eigvalsh(A.T @ A)[::-1]
sigma_eig = np.sqrt(vals)
coinciden = np.allclose(S, sigma_eig)
`,
        },
        {
          id: 'svd.ex02.4',
          type: 'codigo',
          prompt:
            'Las tres columnas de `A` parecen independientes, pero la tercera es la suma de las otras dos más un ruido diminuto de medida. Guarda en `S` los valores singulares de `A`; en `umbral`, un número que separe los valores singulares reales del ruido (mayor que el valor singular del ruido y menor que el menor de los reales); y en `rango`, como entero, el **rango numérico**: cuántos valores singulares superan ese umbral.',
          hints: [
            'El plan son tres líneas. `S`: los valores singulares, sin las matrices, con `compute_uv=False`. Míralos con `print(S)`: dos son grandes y uno es diminuto. Ese diminuto es ruido, no una dirección de verdad. `umbral` es un número entre los dos grupos; un valor pequeño y fijo como `1e-6` sirve, y se escribe así en Python. `rango`: cuántos de `S` están por encima del umbral; la comparación `S > umbral` da `True` o `False` por elemento y `np.sum` los cuenta.',
            'Las piezas, con otros valores:\n\n' +
              py(
                'T = np.array([5.0, 0.8, 3e-12])',
                'print(T > 1e-6)              # [ True  True False]: uno por elemento',
                'print(np.sum(T > 1e-6))      # 2: los True cuentan como 1',
                'print(np.sum(T > 0))         # 3: con umbral 0 el ruido también cuenta',
                'print(int(np.sum(T > 1e-6))) # 2, como entero normal de Python',
              ) +
              '\n\nEl ruido es positivo y por eso `S > 0` lo cuenta: el umbral tiene que estar por encima.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'S = np.linalg.svd(A, compute_uv=___)',
                'umbral = ___',
                'rango = int(np.sum(S ___ umbral))',
              ) +
              '\n\nLos errores típicos son `len(S)` y `np.sum(S > 0)`: los dos dan 3, porque el ruido cuenta.',
          ],
          explain:
            'En un ordenador, un valor singular que debería ser 0 sale como un número diminuto, y contarlo da un rango de más. El rango numérico cuenta solo los valores singulares por encima de un umbral. Esta es la idea de fondo de `np.linalg.matrix_rank`, que fija el umbral por su cuenta a partir del tamaño de la matriz y del mayor valor singular.',
          solution:
            'Los valores singulares son aproximadamente $5{,}93$, $2{,}21$ y $2{,}3\\cdot 10^{-10}$. El tercero es ruido, así que el rango numérico es 2: la tercera columna no aporta una dirección nueva. Un umbral como `1e-6` los separa. Errores típicos: `len(S)` y `np.sum(S > 0)`, que dan 3, porque el ruido es positivo; y un umbral demasiado grande, como 3, que dejaría solo uno.',
          requirements: [
            '`S` es un array de NumPy con 3 números: los valores singulares de `A`, de mayor a menor.',
            '`umbral` es un número mayor que el valor singular del ruido y menor que el menor de los valores singulares reales.',
            '`rango` es un número entero: cuántos valores singulares de `S` superan `umbral`.',
          ],
          starter: `import numpy as np

A = np.array([[1.0, 0.0, 1.0], [2.0, 1.0, 3.0], [0.0, 3.0, 3.0], [1.0, 1.0, 2.0]])
A[:, 2] = A[:, 0] + A[:, 1] + np.array([2e-10, -3e-10, 1e-10, 2e-10])
# A: 4 filas y 3 columnas. La tercera columna es la suma de las otras dos, más un ruido diminuto.

# PASO 1. S: los valores singulares de A.
# Por qué: cuántas direcciones aporta de verdad la matriz se lee en ellos.
# np.linalg.svd(A, compute_uv=False) devuelve SOLO los valores singulares, de mayor a menor.
# Míralos con print(S): los números pequeños, como 3e-12, son 0.000000000003.
# Resultado esperado: un array con 3 números.
S = None

# PASO 2. umbral: un número que separa los valores singulares reales del ruido.
# Por qué: el ruido no es exactamente 0, y hace falta decidir a partir de dónde un valor
# singular deja de contar. Tiene que quedar entre el ruido y el menor valor singular real.
# En Python, 1e-6 es 0.000001.
# Resultado esperado: un número.
umbral = None

# PASO 3. rango: cuántos valores singulares superan el umbral.
# Por qué: es el rango numérico, el número de direcciones independientes de verdad.
# Una comparación como S > umbral da un True o False por elemento; np.sum cuenta los True
# (cada uno vale 1). int(...) lo convierte en un entero normal de Python.
# Resultado esperado: un número entero.
rango = None

# Para ver qué vale algo antes de entregar: print(S) y pulsa «Ejecutar».
`,
          checks: `_A = np.array([[1.0, 0.0, 1.0], [2.0, 1.0, 3.0], [0.0, 3.0, 3.0], [1.0, 1.0, 2.0]])
_A[:, 2] = _A[:, 0] + _A[:, 1] + np.array([2e-10, -3e-10, 1e-10, 2e-10])
_S = np.linalg.svd(_A, compute_uv=False)
_a = isinstance(S, np.ndarray) and S.shape == (3,) and np.issubdtype(S.dtype, np.floating)
_aok = _a and bool(np.allclose(S, _S))
check(_a, "\`S\` tiene que ser un array de NumPy con 3 números: los valores singulares de \`A\`.")
check((not _a) or _aok, "\`S\` no son los valores singulares de \`A\`. Usa \`np.linalg.svd(A, compute_uv=False)\`.")
_u = isinstance(umbral, (int, float, np.integer, np.floating)) and not isinstance(umbral, (bool, np.bool_))
check(_u, "\`umbral\` tiene que ser un solo número: el valor a partir del cual un valor singular cuenta.")
check((not _u) or float(umbral) > float(_S[2]), "\`umbral\` es menor que el valor singular del ruido (el menor de \`S\`): el ruido también pasaría. Tiene que quedar por encima de él.")
check((not _u) or float(umbral) <= float(_S[2]) or float(umbral) < float(_S[1]), "\`umbral\` es mayor que un valor singular real: dejaría fuera una dirección de verdad. Tiene que quedar por debajo del menor de los reales.")
_r = isinstance(rango, (int, np.integer)) and not isinstance(rango, (bool, np.bool_))
check(_r, "\`rango\` tiene que ser un número entero: cuántos valores singulares superan ese valor.")
check((not _r) or rango != 3, "\`rango\` vale 3: cuenta el ruido como si fuera un valor singular. Cuenta solo los que superan ese valor, no todos ni los mayores que 0.")
check((not _r) or rango == 3 or rango == 2, "\`rango\` tiene que ser cuántos valores singulares superan ese valor: dos de ellos son reales y uno es ruido.")
`,
          reference: `import numpy as np

A = np.array([[1.0, 0.0, 1.0], [2.0, 1.0, 3.0], [0.0, 3.0, 3.0], [1.0, 1.0, 2.0]])
A[:, 2] = A[:, 0] + A[:, 1] + np.array([2e-10, -3e-10, 1e-10, 2e-10])
# Guarda en S los valores singulares, en umbral un número que separe el ruido de los reales y en rango cuántos superan el umbral
S = np.linalg.svd(A, compute_uv=False)
umbral = 1e-6
rango = int(np.sum(S > umbral))
`,
        },
        {
          id: 'svd.ex02.5',
          type: 'codigo',
          prompt:
            '`W` es la matriz de pesos de una capa y `x` es una entrada de norma 1. La **normalización espectral** divide los pesos entre su mayor valor singular, para que la capa nunca pueda alargar una entrada. Guarda en `sigma_max` el mayor valor singular de `W`; en `W_sn`, la matriz `W` dividida entre `sigma_max`; en `sigma_despues`, el mayor valor singular de `W_sn`; y en `norma_y`, la norma de la salida de la capa normalizada para la entrada `x`, es decir, `W_sn @ x`.',
          hints: [
            'El plan son cuatro líneas. `sigma_max` es el primer valor singular de `W`, el mayor, y se saca con `np.linalg.svd(W, compute_uv=False)`. `W_sn` es `W` dividida entre ese número: NumPy divide toda la matriz de golpe. `sigma_despues` es el mismo cálculo sobre `W_sn`, y tiene que salir 1. `norma_y` es la longitud de `W_sn @ x`, que se mide con `np.linalg.norm`: no puede pasar de 1.',
            'Las piezas, con otra matriz:\n\n' +
              py(
                'M = np.array([[4.0, 0.0], [0.0, 1.0]])',
                'sv = np.linalg.svd(M, compute_uv=False)',
                'print(sv)                       # [4. 1.]: de mayor a menor',
                'N = M / sv[0]',
                'print(N)                        # [[1.   0.  ] [0.   0.25]]: todo dividido entre 4',
                'print(np.linalg.svd(N, compute_uv=False)[0])   # 1.0',
                'print(np.linalg.norm(N @ np.array([0.0, 1.0])))  # 0.25: la longitud de la salida',
              ) +
              '\n\nDespués de dividir, el mayor valor singular vale exactamente 1.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'sigma_max = np.linalg.svd(W, compute_uv=False)[___]',
                'W_sn = W ___ sigma_max',
                'sigma_despues = np.linalg.svd(___, compute_uv=False)[0]',
                'norma_y = np.linalg.___(W_sn @ x)',
              ) +
              '\n\nEl error típico es dividir entre otra cosa, como la suma de los valores singulares: entonces el mayor ya no vale 1.',
          ],
          explain:
            'El mayor valor singular de una matriz es lo máximo que alarga una entrada. Al dividir los pesos entre él, el nuevo mayor valor singular es 1, y la capa ya no puede alargar ninguna entrada. La normalización espectral usa esta idea para mantener estable el entrenamiento de las redes que la llevan.',
          solution:
            'Para $W=\\begin{pmatrix}3&1&0\\\\1&2&-1\\\\0&2&2\\end{pmatrix}$, los valores singulares son $3{,}82$, $2{,}62$ y $1{,}60$. Así `sigma_max` es $3{,}82$ y `W_sn` es `W` dividida entre ese número. El mayor valor singular de `W_sn` pasa a ser $1$. Para $x=(0{,}6;\\ 0;\\ 0{,}8)$, la capa original da una salida de norma $2{,}42$, más larga que la entrada, y la normalizada da $0{,}63$, que no supera 1. Errores típicos: dividir entre la norma de toda la matriz o entre la suma de los valores singulares, con lo que `sigma_despues` no vale 1.',
          requirements: [
            '`sigma_max` es un solo número: el mayor valor singular de `W`.',
            '`W_sn` es un array de NumPy de 3 filas y 3 columnas: `W` dividida entre `sigma_max`.',
            '`sigma_despues` es un solo número: el mayor valor singular de `W_sn`, calculado igual que `sigma_max`.',
            '`norma_y` es un solo número: la norma de `W_sn @ x`. Se acepta una diferencia diminuta de redondeo.',
          ],
          starter: `import numpy as np

W = np.array([[3.0, 1.0, 0.0], [1.0, 2.0, -1.0], [0.0, 2.0, 2.0]])
x = np.array([0.6, 0.0, 0.8])
# W: 3 filas y 3 columnas, los pesos de la capa. x: una entrada de 3 números y norma 1.

# PASO 1. sigma_max: el mayor valor singular de W.
# Por qué: es lo máximo que la capa puede alargar una entrada.
# np.linalg.svd(W, compute_uv=False) devuelve SOLO los valores singulares, de mayor a menor.
# Un elemento de un array se saca con un índice: el primero, con [0].
# Resultado esperado: un solo número.
sigma_max = None

# PASO 2. W_sn: los pesos con la normalización espectral.
# Por qué: al dividir todos los pesos entre sigma_max, el mayor valor singular queda en 1.
# Dividir una matriz entre un número divide cada uno de sus elementos.
# Resultado esperado: un array de 3 filas y 3 columnas.
W_sn = None

# PASO 3. sigma_despues: el mayor valor singular de W_sn.
# Por qué: es la comprobación de que ahora la capa no puede alargar nada: debe valer 1.
# Es el mismo cálculo del paso 1, pero sobre W_sn.
# Resultado esperado: un solo número.
sigma_despues = None

# PASO 4. norma_y: la norma de la salida de la capa normalizada para x.
# Por qué: con x de norma 1, la salida no puede ser más larga que 1.
# W_sn @ x es la salida de la capa. np.linalg.norm(v) da la longitud de un vector v.
# Resultado esperado: un solo número.
norma_y = None

# Para ver qué vale algo antes de entregar: print(sigma_max, norma_y) y pulsa «Ejecutar».
`,
          checks: `_W = np.array([[3.0, 1.0, 0.0], [1.0, 2.0, -1.0], [0.0, 2.0, 2.0]])
_x = np.array([0.6, 0.0, 0.8])
_m = float(np.linalg.svd(_W, compute_uv=False)[0])
def _num(v):
    return isinstance(v, (int, float, np.integer, np.floating)) and not isinstance(v, (bool, np.bool_))
_a = _num(sigma_max)
_aok = _a and abs(float(sigma_max) - _m) < 1e-6
check(_a, "\`sigma_max\` tiene que ser un solo número: el mayor valor singular de \`W\`, no el array entero.")
check((not _a) or _aok or abs(float(sigma_max) - float(np.linalg.norm(_W))) > 1e-6, "\`sigma_max\` es la norma de toda la matriz (Frobenius), no su mayor valor singular. Usa \`np.linalg.svd(W, compute_uv=False)\` y toma el primero.")
check((not _a) or _aok or abs(float(sigma_max) - float(np.linalg.norm(_W))) < 1e-6, "\`sigma_max\` tiene que ser el mayor valor singular de \`W\`, el primero de los que da \`svd\`.")
_b = isinstance(W_sn, np.ndarray) and W_sn.shape == (3, 3) and np.issubdtype(W_sn.dtype, np.floating)
_bok = _b and bool(np.allclose(W_sn, _W / _m))
check(_b, "\`W_sn\` tiene que ser un array de NumPy de 3 filas y 3 columnas: \`W\` dividida entre \`sigma_max\`.")
check((not _b) or (not _aok) or _bok, "\`W_sn\` tiene que ser \`W\` dividida entre \`sigma_max\`, el mayor valor singular. Con otro divisor, el nuevo mayor no queda en 1.")
_c = _num(sigma_despues)
check(_c, "\`sigma_despues\` tiene que ser un solo número: el mayor valor singular de \`W_sn\`.")
check((not _c) or (not _bok) or abs(float(sigma_despues) - 1) < 1e-6, "\`sigma_despues\` tiene que valer 1: es el mayor valor singular de \`W_sn\`, calculado igual que \`sigma_max\`.")
_d = _num(norma_y)
check(_d, "\`norma_y\` tiene que ser un solo número: la norma de \`W_sn @ x\`.")
check((not _d) or (not _bok) or abs(float(norma_y) - float(np.linalg.norm((_W / _m) @ _x))) < 1e-6, "\`norma_y\` tiene que ser la longitud de \`W_sn @ x\`, medida con \`np.linalg.norm\`: la salida de la capa normalizada para \`x\`.")
`,
          reference: `import numpy as np

W = np.array([[3.0, 1.0, 0.0], [1.0, 2.0, -1.0], [0.0, 2.0, 2.0]])
x = np.array([0.6, 0.0, 0.8])
# Guarda en sigma_max el mayor valor singular de W, en W_sn W normalizada, en sigma_despues el mayor valor singular de W_sn y en norma_y la norma de W_sn @ x
sigma_max = np.linalg.svd(W, compute_uv=False)[0]
W_sn = W / sigma_max
sigma_despues = np.linalg.svd(W_sn, compute_uv=False)[0]
norma_y = np.linalg.norm(W_sn @ x)
`,
        },
      ],
    },
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
