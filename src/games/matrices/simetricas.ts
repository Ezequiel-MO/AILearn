import type { Goal, PlaneSpec, PlaneVector, Project } from '../../content/schema';
import { py } from '../py';
import { simetricasWarmup } from './simetricas.calentamiento';
import { transformPlane, type TransformPlaneOptions } from './plane';

/** Plano de transformación con î fijo y ĵ arrastrable. */
const fixedIPlane = (o: TransformPlaneOptions): PlaneSpec => {
  const p = transformPlane({ ...o, movable: true });
  return {
    ...p,
    vectors: p.vectors.map((v) => (v.id === 'i' ? { ...v, movable: false } : v)),
  };
};

/** Un vector de la figura que no es una columna de la matriz. */
const vec = (id: string, x: number, y: number, movable: boolean): PlaneVector => ({
  id,
  label: id,
  x,
  y,
  movable,
});

/** Meta: A·v va en la misma dirección que v (el ángulo entre los dos, en grados, es 0). */
const sameDirection = (v: string): Goal => ({
  metric: 'img_angle',
  of: ['i', 'j', v],
  target: 0,
  tol: 0.5,
});

/** Meta: el cociente vᵀAv / vᵀv vale `target`. */
const rayleighGoal = (v: string, target: number, tol: number): Goal => ({
  metric: 'rayleigh',
  of: ['i', 'j', v],
  target,
  tol,
});

/** Segundo proyecto de la Órbita 2 de matrices: simetría, perpendicularidad y covarianza. */
export const simetricas: Project = {
  id: 'simetricas',
  name: 'Matrices simétricas',
  sub: 'Ejes perpendiculares y covarianza',
  warmup: simetricasWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'simetricas.ex00.1',
          type: 'manipular',
          purpose: {
            why: 'La matriz de similitudes de un conjunto de embeddings, con el coseno de cada par, es **simétrica**: el parecido de $a$ con $b$ es el de $b$ con $a$. La matriz de puntuaciones de la atención de un transformer, en cambio, no suele serlo: compara la consulta de un token con la clave de otro, y lo que un token atiende a otro no es lo que el otro le atiende a él.',
            aim: 'Vas a fijar la coordenada de $\\hat{\\jmath}$ que decide la simetría y a ajustar la otra para el determinante, viendo que son dos condiciones independientes.',
            takeaway:
              'Simetría y determinante fijan cada uno una coordenada de $\\hat{\\jmath}$, y sale $A=\\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$. En una matriz de similitudes basta con calcular la mitad de los pares fuera de la diagonal: la otra mitad es la misma.',
          },
          prompt:
            'Una matriz es **simétrica** si es igual a su traspuesta, $A=A^{T}$: lo que hay arriba a la derecha es igual a lo que hay abajo a la izquierda. En el plano, arriba a la derecha está la $x$ de $\\hat{\\jmath}$, y abajo a la izquierda, la $y$ de $\\hat{\\imath}$. Aquí $\\hat{\\imath}=(2, 1)$ está fijo. Mueve $\\hat{\\jmath}$ para que la matriz sea simétrica **y** tenga $\\det A=3$.',
          hints: [
            'Ser simétrica pide que la $x$ de $\\hat{\\jmath}$ valga lo mismo que la $y$ de $\\hat{\\imath}$. Eso ya fija una de las dos coordenadas de $\\hat{\\jmath}$.',
            'Con $\\hat{\\jmath}=(a, b)$ y $a$ ya decidida, el determinante es $2b-a\\cdot 1$. Resuelve $2b-a=3$.',
          ],
          explain:
            'La simetría no mira el determinante, y el determinante no mira la simetría: son dos condiciones distintas, y cada una fija una coordenada de $\\hat{\\jmath}$. Si cumples una y falla la otra, mira cuál de las dos coordenadas has dejado sin ajustar.',
          solution:
            'La simetría pide $x_{\\hat{\\jmath}}=y_{\\hat{\\imath}}=1$, luego $\\hat{\\jmath}=(1, b)$. Con ese valor, $\\det A=2b-1\\cdot 1=3$ da $b=2$. La solución es única: $\\hat{\\jmath}=(1, 2)$, con $A=\\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$ y $\\det A=4-1=3$. Si dejas la $x$ de $\\hat{\\jmath}$ en otro valor, el determinante puede salir $3$ pero la matriz deja de ser simétrica.',
          plane: fixedIPlane({ i: [2, 1], range: 3, readouts: ['matrix', 'det'] }),
          goals: [
            { metric: 'x', of: ['j'], target: 1, tol: 0.01 },
            { metric: 'det', of: ['i', 'j'], target: 3, tol: 0.01 },
          ],
        },
        {
          id: 'simetricas.ex00.2',
          type: 'manipular',
          purpose: {
            why: 'Antes de entrenar, a veces se **blanquean** los datos: se giran hasta los ejes de su matriz de covarianza y se escala cada eje para que los rasgos varíen lo mismo y dejen de estar correlacionados. Ese giro existe porque la covarianza es simétrica: sus direcciones propias son perpendiculares, y pasar a ellas es una rotación que no deforma la nube.',
            aim: 'Vas a buscar dos direcciones que $A$ solo estira y que además formen ángulo recto, y a comprobar dónde caen respecto a la elipse.',
            takeaway:
              'En una matriz simétrica las direcciones propias son perpendiculares y coinciden con los ejes de la elipse: aquí, $(1, 1)$ con $\\lambda=3$ y $(1, -1)$ con $\\lambda=1$. Es el teorema espectral, y garantiza que toda covarianza tiene unos ejes propios en ángulo recto.',
          },
          prompt:
            'La matriz $A=\\begin{pmatrix}2&1\\\\1&2\\end{pmatrix}$ es simétrica y está fija. La curva discontinua, la **elipse**, es lo que $A$ hace con la circunferencia de radio $1$. Mueve $\\vec{v}$ y $\\vec{w}$ hasta cumplir las tres condiciones a la vez: que $A\\vec{v}$ vaya en la misma dirección que $\\vec{v}$ (la lectura «ángulo(v, A·v)» vale $0°$), que $A\\vec{w}$ vaya en la misma dirección que $\\vec{w}$, y que $\\vec{v}$ y $\\vec{w}$ formen $90°$. Después fíjate en dónde caen respecto a los ejes de la elipse y en lo que vale cada cociente $\\vec{v}^{T}A\\vec{v}\\,/\\,\\vec{v}^{T}\\vec{v}$: dice cuánto estira $A$ en la dirección de $\\vec{v}$, y vale $\\lambda$ cuando $\\vec{v}$ solo se estira, $A\\vec{v}=\\lambda\\vec{v}$.',
          hints: [
            'Una flecha que $A$ solo estira, sin girarla, tiene el ángulo con su imagen en $0°$. Prueba con $A\\cdot(1, 1)$ a mano: $(2\\cdot 1+1\\cdot 1,\\ 1\\cdot 1+2\\cdot 1)$.',
            'Coloca una de las flechas en la dirección que acabas de encontrar. Para la otra, busca una dirección que forme $90°$ con ella y comprueba que la imagen tampoco gira.',
          ],
          explain:
            'No todas las direcciones sirven: la mayoría de las flechas giran al aplicarles $A$, y entonces el ángulo con su imagen no es $0°$. Mira esa lectura mientras mueves cada flecha, y recuerda que la tercera condición pide un ángulo entre las dos flechas, no entre cada una y su imagen.',
          solution:
            '$A(1, 1)=(3, 3)=3\\,(1, 1)$ y $A(1, -1)=(1, -1)=1\\,(1, -1)$. Sirven $\\vec{v}=(1, 1)$ y $\\vec{w}=(1, -1)$, en cualquier orden y con cualquier múltiplo: sus imágenes no giran, solo se estiran por $3$ y por $1$, y el cociente de cada una vale ese factor. Las dos direcciones son perpendiculares, $(1, 1)\\cdot(1, -1)=0$, y caen sobre los ejes de la elipse, cuyos semiejes miden $3$ y $1$.',
          plane: {
            ...transformPlane({
              i: [2, 1],
              j: [1, 2],
              extra: [vec('v', 1, 0, true), vec('w', 0, 1, true)],
              apply: ['v', 'w'],
              readouts: ['img_angle', 'rayleigh', 'angle'],
              range: 3,
              snap: 1,
            }),
            pair: ['v', 'w'],
            circle: 1,
            circleImage: true,
          },
          goals: [
            sameDirection('v'),
            sameDirection('w'),
            { metric: 'angle', of: ['v', 'w'], target: 90, tol: 0.5 },
          ],
        },
        {
          id: 'simetricas.ex00.3',
          type: 'manipular',
          purpose: {
            why: 'La matriz de pesos de una capa de una red neuronal casi nunca es simétrica, y sus direcciones propias no tienen por qué formar ángulo recto (a veces ni siquiera existen en el plano real, como en un giro). Para describir cómo deforma el espacio una capa se usan los valores singulares, que dan siempre ejes perpendiculares porque salen de la matriz simétrica $A^{T}A$.',
            aim: 'Vas a encontrar las dos direcciones que una matriz no simétrica solo estira y a medir el ángulo que forman entre ellas.',
            takeaway:
              'Las direcciones propias de esta matriz forman $45^\\circ$, no $90^\\circ$: sin simetría no hay ejes perpendiculares garantizados. Un análisis que necesita ejes en ángulo recto, como PCA, tiene que partir de una matriz simétrica.',
          },
          prompt:
            'Esta matriz **no** es simétrica: $A=\\begin{pmatrix}2&1\\\\0&1\\end{pmatrix}$ tiene un $1$ arriba a la derecha y un $0$ abajo a la izquierda. Aun así hay direcciones que solo estira. Coloca $\\vec{v}$ para que $A\\vec{v}$ vaya en su misma dirección y el cociente $\\vec{v}^{T}A\\vec{v}\\,/\\,\\vec{v}^{T}\\vec{v}$ valga $2$; coloca $\\vec{w}$ para que también conserve su dirección y su cociente valga $1$. Después mira el ángulo entre $\\vec{v}$ y $\\vec{w}$.',
          hints: [
            'Con el ángulo en $0°$, la imagen es un múltiplo de la flecha. El cociente dice cuál: $2$ para $\\vec{v}$ y $1$ para $\\vec{w}$.',
            'Calcula $A(x, y)=(2x+y,\\ y)$. Para que la imagen de $\\vec{v}$ sea $2\\vec{v}$ hace falta $y=0$. Para $\\vec{w}$, que la imagen sea $\\vec{w}$ pide $x+y=0$.',
          ],
          explain:
            'Pedir el ángulo $0°$ y el cociente a la vez evita tomar por buena una dirección que solo se parece. Y mira bien la última lectura: aunque las dos flechas se dejen estirar sin girar, nada obliga a que estén en ángulo recto.',
          solution:
            '$A(x, y)=(2x+y,\\ y)$. Con $\\vec{v}=(1, 0)$ (o cualquier $(t, 0)$), $A\\vec{v}=(2, 0)=2\\vec{v}$. Con $\\vec{w}=(1, -1)$ (o cualquier múltiplo), $A\\vec{w}=(1, -1)=\\vec{w}$. Esas dos direcciones forman $45°$ (o $135°$, si eliges $\\vec{w}=(-1, 1)$), no $90°$: $(1, 0)\\cdot(1, -1)=1\\neq 0$. Sin simetría no hay perpendicularidad garantizada.',
          plane: {
            ...transformPlane({
              i: [2, 0],
              j: [1, 1],
              extra: [vec('v', 0, 1, true), vec('w', 1, 1, true)],
              apply: ['v', 'w'],
              readouts: ['img_angle', 'rayleigh', 'angle'],
              range: 3,
              snap: 1,
            }),
            pair: ['v', 'w'],
          },
          goals: [
            sameDirection('v'),
            rayleighGoal('v', 2, 0.01),
            sameDirection('w'),
            rayleighGoal('w', 1, 0.01),
          ],
        },
        {
          id: 'simetricas.ex00.4',
          type: 'manipular',
          purpose: {
            why: 'Un modelo que describe unos datos con una campana gaussiana, como los que detectan anomalías, guarda la forma de la nube en una matriz de covarianza. Esa matriz se puede construir al revés: eligiendo primero los ejes de la nube y cuánto se extiende en cada uno.',
            aim: 'Vas a montar la matriz a partir de dos direcciones perpendiculares fijas y de lo que estira cada una, y a mirar qué forma tiene la matriz que sale.',
            takeaway:
              'Sale $A=\\begin{pmatrix}3&1\\\\1&3\\end{pmatrix}$, simétrica: dos direcciones perpendiculares con factores reales dan siempre una matriz simétrica. Es la otra cara del teorema espectral: una covarianza se puede guardar como sus ejes y sus factores, y recomponerse cuando haga falta.',
          },
          prompt:
            'Ahora, al revés: se fijan las dos direcciones y se construye la matriz. Las flechas $\\vec{v}=(1, 1)$ y $\\vec{w}=(1, -1)$ están fijas, y también se dibuja la imagen de la circunferencia por $A$. Mueve $\\hat{\\imath}$ y $\\hat{\\jmath}$ para que $A\\vec{v}=(4, 4)$ y $A\\vec{w}=(2, -2)$: la matriz estira $\\vec{v}$ por $4$ y $\\vec{w}$ por $2$. Al terminar, mira si la matriz que ha salido es simétrica.',
          hints: [
            'Para $\\vec{v}=(1, 1)$, $A\\vec{v}$ es la suma de las dos columnas de $A$. ¿Y para $\\vec{w}=(1, -1)$?',
            'Tienes dos ecuaciones entre vectores, $\\hat{\\imath}+\\hat{\\jmath}=(4, 4)$ y $\\hat{\\imath}-\\hat{\\jmath}=(2, -2)$. Súmalas y réstalas.',
          ],
          explain:
            'Cada flecha fija da una ecuación sobre las dos columnas, y hacen falta las dos a la vez: si colocas las columnas para que $\\vec{v}$ salga bien, $\\vec{w}$ se descoloca. Resuelve el sistema antes de mover.',
          solution:
            'Como $A(1, 1)=\\hat{\\imath}+\\hat{\\jmath}$ y $A(1, -1)=\\hat{\\imath}-\\hat{\\jmath}$, al sumar las dos ecuaciones sale $2\\hat{\\imath}=(6, 2)$, es decir, $\\hat{\\imath}=(3, 1)$, y al restarlas, $2\\hat{\\jmath}=(2, 6)$, es decir, $\\hat{\\jmath}=(1, 3)$. La solución es única: $A=\\begin{pmatrix}3&1\\\\1&3\\end{pmatrix}$, y sale simétrica sin pedirlo. Dos direcciones perpendiculares con autovalores reales, $4$ y $2$, dan siempre una matriz simétrica.',
          plane: {
            ...transformPlane({
              movable: true,
              extra: [vec('v', 1, 1, false), vec('w', 1, -1, false)],
              apply: ['v', 'w'],
              readouts: ['matrix', 'image'],
              range: 4,
              snap: 1,
            }),
            circle: 1,
            circleImage: true,
          },
          goals: [
            { metric: 'img_x', of: ['i', 'j', 'v'], target: 4, tol: 0.01 },
            { metric: 'img_y', of: ['i', 'j', 'v'], target: 4, tol: 0.01 },
            { metric: 'img_x', of: ['i', 'j', 'w'], target: 2, tol: 0.01 },
            { metric: 'img_y', of: ['i', 'j', 'w'], target: -2, tol: 0.01 },
          ],
        },
        {
          id: 'simetricas.ex00.5',
          type: 'manipular',
          purpose: {
            why: 'La curvatura de una función de pérdida en una dirección es este mismo cociente aplicado a su matriz de segundas derivadas, el **hessiano**, que es simétrica. Su valor más alto limita la tasa de aprendizaje: un paso demasiado largo en esa dirección hace divergir el entrenamiento. Un valor negativo señala una dirección en la que la pérdida baja: el punto no es un mínimo.',
            aim: 'Vas a recorrer direcciones con $\\vec{v}$ buscando dónde el cociente se vuelve negativo, y a comprobar que alargar la flecha no lo cambia.',
            takeaway:
              'El cociente de una matriz simétrica va siempre de su menor autovalor a su mayor, aquí de $-1$ a $3$, y alcanza los extremos en las direcciones propias. Buscar la dirección que lo hace máximo es una forma de encontrar autovectores sin calcularlos: así estiman algunos métodos la curvatura de una red sin construir el hessiano entero.',
          },
          prompt:
            'La matriz $A=\\begin{pmatrix}1&2\\\\2&1\\end{pmatrix}$ es simétrica y está fija. El cociente $\\vec{v}^{T}A\\vec{v}\\,/\\,\\vec{v}^{T}\\vec{v}$ no depende de la longitud de $\\vec{v}$: solo de su dirección. Mueve $\\vec{v}$ hasta que el cociente valga $-1$.',
          hints: [
            'Recorre varias direcciones y mira el cociente: con $\\vec{v}=(1, 0)$ vale $1$. ¿Qué dirección lo hace bajar?',
            'Si $A\\vec{v}$ apunta en sentido opuesto a $\\vec{v}$, el cociente es negativo. Prueba una dirección perpendicular a una diagonal.',
          ],
          explain:
            'El cociente cambia al girar $\\vec{v}$, pero no al alargarlo: no sirve buscar una flecha más larga. Y para que sea negativo, la imagen tiene que formar más de $90°$ con la flecha.',
          solution:
            'Con $\\vec{v}=(1, -1)$ (o cualquier múltiplo), $A\\vec{v}=(1-2,\\ 2-1)=(-1, 1)=-\\vec{v}$, y el cociente vale $-1$. Es el valor más pequeño que alcanza: el máximo, $3$, está en la dirección de $(1, 1)$, perpendicular a esta. El cociente de una matriz simétrica queda siempre entre su menor autovalor, $-1$, y el mayor, $3$.',
          plane: transformPlane({
            i: [1, 2],
            j: [2, 1],
            extra: [vec('v', 1, 0, true)],
            apply: ['v'],
            readouts: ['image', 'rayleigh'],
            range: 3,
            snap: 1,
          }),
          goals: [rayleighGoal('v', -1, 0.01)],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'simetricas.ex01.1',
          type: 'opcion',
          prompt:
            'Una matriz es **simétrica** si es igual a su traspuesta: lo que hay arriba a la derecha es igual a lo que hay abajo a la izquierda. ¿Cuál de estas matrices es simétrica?',
          hints: [
            'Compara solo las dos entradas que están fuera de la diagonal principal. Las de la diagonal no cuentan.',
            'Que dos entradas tengan el mismo valor absoluto no basta: han de ser iguales, con el mismo signo.',
          ],
          explain:
            'Basta mirar la entrada de arriba a la derecha y la de abajo a la izquierda: si son iguales, la matriz es simétrica. Cuida el signo, porque un número y su opuesto no son iguales.',
          solution:
            'En la primera, $2\\neq 3$. En la segunda, $-1\\neq 1$: tienen el mismo tamaño y signo contrario. En la tercera, las dos son $-2$, luego es simétrica. En la cuarta, $1\\neq 0$. Solo la tercera cumple $A=A^{T}$.',
          options: [
            '$\\begin{pmatrix}1&2\\\\3&2\\end{pmatrix}$',
            '$\\begin{pmatrix}2&-1\\\\1&2\\end{pmatrix}$',
            '$\\begin{pmatrix}4&-2\\\\-2&1\\end{pmatrix}$',
            '$\\begin{pmatrix}0&1\\\\0&0\\end{pmatrix}$',
          ],
          correct: 2,
        },
        {
          id: 'simetricas.ex01.2',
          type: 'numero',
          prompt:
            'La **covarianza** de dos variables mide si suben juntas (positiva) o si una baja cuando la otra sube (negativa). Con $n$ muestras, es $\\dfrac{1}{n-1}\\sum_i (x_i-\\bar{x})(y_i-\\bar{y})$, con $\\bar{x}$ y $\\bar{y}$ las medias. Calcula la covarianza de $x=(2, 4, 9)$ e $y=(1, 5, 6)$.',
          hints: [
            'Empieza por las medias de $x$ y de $y$, y resta cada media a sus tres valores.',
            'Multiplica las desviaciones de cada muestra, súmalas y divide entre $n-1$, que aquí es $2$.',
          ],
          explain:
            'Hay que restar la media antes de multiplicar: la covarianza mide cómo se mueven los datos alrededor de su media, no dónde están. Y se divide entre $n-1$, no entre $n$.',
          solution:
            'Las medias son $5$ y $4$. Las desviaciones son $(-3, -1, 4)$ y $(-3, 1, 2)$, y sus productos, $9$, $-1$ y $8$, suman $16$. Entonces la covarianza vale $16/2=8$. Si te sale $5{,}33$, has dividido entre $n=3$; si te sale $38$, has multiplicado los datos sin restar las medias.',
          answer: 8,
          tol: 0,
        },
        {
          id: 'simetricas.ex01.3',
          type: 'vector',
          prompt:
            'Tres puntos del plano, $(0, 1)$, $(2, 5)$ y $(4, 3)$, son tres muestras de dos variables, $x$ e $y$. Calcula su matriz de covarianza $C=\\begin{pmatrix}\\operatorname{var}(x)&\\operatorname{cov}(x, y)\\\\\\operatorname{cov}(x, y)&\\operatorname{var}(y)\\end{pmatrix}$, dividiendo entre $n-1$. Escríbela fila a fila.',
          hints: [
            'Las medias de $x$ y de $y$ salen de las dos coordenadas de los puntos, por separado. Resta cada media a sus tres valores.',
            'La varianza es la covarianza de una variable consigo misma: suma los cuadrados de las desviaciones y divide entre $2$.',
          ],
          explain:
            'La diagonal reúne las varianzas, y las dos entradas de fuera, la misma covarianza: por eso la matriz es simétrica. Calcula las tres cantidades con las mismas desviaciones y con el mismo divisor.',
          shape: [2, 2],
          solution:
            'La media es $(2, 3)$. Las desviaciones de $x$ son $(-2, 0, 2)$ y las de $y$, $(-2, 2, 0)$. Entonces $\\operatorname{var}(x)=8/2=4$, $\\operatorname{var}(y)=8/2=4$ y $\\operatorname{cov}(x, y)=(4+0+0)/2=2$. La matriz es $C=\\begin{pmatrix}4&2\\\\2&4\\end{pmatrix}$, es decir, $[4, 2, 2, 4]$ fila a fila.',
          answer: [4, 2, 2, 4],
          tol: 0,
        },
        {
          id: 'simetricas.ex01.4',
          type: 'numero',
          prompt:
            'Un **autovalor** de una matriz $C$ es un número $\\lambda$ por el que $C$ estira alguna dirección: $C\\vec{u}=\\lambda\\vec{u}$. Los de una matriz de $2\\times 2$ son las raíces de $\\lambda^2-t\\lambda+d=0$, con $t$ la suma de la diagonal y $d$ el determinante. Calcula el autovalor **mayor** de $C=\\begin{pmatrix}4&2\\\\2&4\\end{pmatrix}$.',
          hints: [
            'Aquí $t=4+4$ y $d=4\\cdot 4-2\\cdot 2$. Escribe la ecuación.',
            'La ecuación $\\lambda^2-8\\lambda+12=0$ se factoriza buscando dos números que sumen $8$ y multipliquen $12$.',
          ],
          explain:
            'Hay dos autovalores y se pide el mayor. Calcula el determinante con cuidado: es el producto de la diagonal menos el producto de las otras dos entradas, no su suma.',
          solution:
            '$t=8$ y $d=16-4=12$, luego $\\lambda^2-8\\lambda+12=0$ da $\\lambda=6$ y $\\lambda=2$. El mayor es $6$. Si $C$ es la covarianza de unos datos, $6$ es la varianza de los datos en la dirección $(1, 1)$, la dirección en que más varían; $2$ es la menor, en la dirección $(1, -1)$.',
          answer: 6,
          tol: 0,
        },
        {
          id: 'simetricas.ex01.5',
          type: 'vector',
          prompt:
            'Una matriz simétrica de $2\\times 2$ tiene a $(2, 1)$ como autovector, y sus dos autovalores son distintos. Da la dirección del otro autovector, escrita con primera componente $-1$.',
          hints: [
            'Los autovectores de una matriz simétrica con autovalores distintos tienen una relación geométrica entre sí. ¿Cuál?',
            'Si el otro autovector es $(-1, b)$, su producto escalar con $(2, 1)$ tiene que ser $0$.',
          ],
          explain:
            'No hace falta conocer la matriz: la simetría ya fija la dirección del otro autovector. Piensa qué ángulo forman los dos, y qué dice el producto escalar de ese ángulo.',
          solution:
            'Son perpendiculares, luego el producto escalar es $0$: $2\\cdot(-1)+1\\cdot b=0$ da $b=2$. El otro autovector es $(-1, 2)$. Se ve girando $(2, 1)$ un cuarto de vuelta, que da $(-1, 2)$.',
          answer: [-1, 2],
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
