import type { GraphSpec, Project } from '../../content/schema';
import { py } from '../py';
import { minimosWarmup } from './minimos.calentamiento';

/**
 * Los datos del hilo del proyecto: la longitud de una respuesta (cientos de tokens, `x`) y lo que
 * cuesta (céntimos, `y`). Con ŷ = w·x, la pérdida es L(w) = 7,5·(w − 2)² + 0,75: el mínimo cae en
 * w = 2 (Σxy / Σxx = 60 / 30), calculado con NumPy. No son los datos del despegue.
 */
const DATA_A: [number, number][] = [
  [1, 1],
  [2, 4],
  [3, 5],
  [4, 9],
];

/** Los mismos datos más uno atípico, (2, 21): el mínimo pasa a w = 3 (102 / 34) y vale 51,6. */
const DATA_OUTLIER: [number, number][] = [...DATA_A, [2, 21]];

/** Tres datos para calcular w*: Σxy = 23 y Σxx = 14, luego w* = 23/14 ≈ 1,64. */
const DATA_B: [number, number][] = [
  [1, 2],
  [2, 3],
  [3, 5],
];

/** Cuatro datos con w* = 2 y una pérdida mínima de 0,5 (errores 1, −1, 0 y 0). */
const DATA_C: [number, number][] = [
  [1, 1],
  [1, 3],
  [2, 4],
  [2, 4],
];

const LABELS = { x: 'w', y: 'pérdida' };

/** La pérdida de DATA_A: la parábola entera, de w = 0 a 4 (en ambos extremos vale 30,75). */
const WINDOW_A = { x: [0, 4], y: [0, 32] } satisfies Pick<GraphSpec, 'x' | 'y'>;

/** La pérdida con el dato atípico: en w = 0 vale 112,8. */
const WINDOW_OUTLIER = { x: [0, 4], y: [0, 120] } satisfies Pick<GraphSpec, 'x' | 'y'>;

/**
 * Una cuártica con dos valles: f′(x) = (x + 2)(x − 1)(x − 3), así que f′ vale 0 en −2 (mínimo global,
 * altura −12,67), en 1 (cima, 3,08) y en 3 (mínimo local, −2,25).
 */
const QUARTIC: GraphSpec['curve'] = { kind: 'poly', coefs: [0, 6, -2.5, -2 / 3, 0.25] };
const WINDOW_QUARTIC = { x: [-3, 4], y: [-14, 8] } satisfies Pick<GraphSpec, 'x' | 'y'>;

/**
 * Una cúbica con una cima y un valle: f′(x) = (x + 1)(x − 3). Pendiente 0 en −1 (máximo local, altura
 * 3,67) y en 3 (mínimo local, altura −7).
 */
const CUBIC: GraphSpec['curve'] = { kind: 'poly', coefs: [2, -3, -1, 1 / 3] };
const WINDOW_CUBIC = { x: [-3, 5], y: [-9, 6] } satisfies Pick<GraphSpec, 'x' | 'y'>;

/** Tercer proyecto de la Órbita 0 del juego 3: donde la pendiente es cero. */
export const minimos: Project = {
  id: 'minimos',
  name: 'Mínimos',
  sub: 'Donde la pendiente es cero',
  bigPicture: {
    parts: ['loss', 'update'],
    text: 'La pérdida mide cuánto se equivoca el modelo, y entrenar es bajar a su mínimo moviendo los pesos. Ese mínimo es el punto donde la pendiente vale $0$: allí el entrenamiento se detiene. Aquí lo buscas con una pérdida de un solo peso; la red real lo busca a ciegas, con millones.',
  },
  warmup: minimosWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'minimos.ex00.1',
          type: 'curva',
          prompt:
            'Un modelo predice cuánto **cuesta** una respuesta (en céntimos) según su longitud (en cientos de tokens): $\\hat y=w\\cdot x$. Mueve $w$ hasta que la **pendiente** de la pérdida valga $0$ y mira qué les pasa a los cuadrados de los errores.',
          hints: [
            'Lejos del valle la pendiente es grande; al acercarte se hace pequeña.',
            'La tangente se aplana (queda horizontal) justo en el fondo del valle.',
          ],
          explain:
            'Con la pendiente en $0$ la tangente es horizontal: la pérdida deja de bajar. Es el fondo del valle, y ahí los cuadrados de los errores son lo más pequeños que pueden ser.',
          solution:
            'En $w=2$ la pendiente vale $0$ y la pérdida es $0{,}75$, la menor posible. A los lados la pendiente cambia de signo: negativa a la izquierda, positiva a la derecha.',
          purpose: {
            why: 'Un entrenamiento termina cuando los pesos dejan de mejorar, y eso ocurre donde la pendiente de la pérdida vale $0$. Es la señal de parada de todo descenso de gradiente.',
            aim: 'Arrastras $w$ y ves la pendiente caer a $0$ mientras los cuadrados de los errores encogen y el punto llega al fondo.',
            takeaway:
              'Mínimo y pendiente $0$ van juntos: en el fondo del valle la tangente es horizontal. Una red entrena buscando ese punto sin ver la curva: solo mide la pendiente.',
          },
          graph: {
            ...WINDOW_A,
            snap: 0.1,
            curve: { kind: 'mse', data: DATA_A },
            points: [{ id: 'p', label: 'w', x: 0.5, movable: true, onCurve: true }],
            readouts: ['coords', 'slope'],
            labels: LABELS,
            fit: { of: 'p' },
          },
          goals: [{ metric: 'slope', of: ['p'], target: 0, tol: 0.05 }],
        },
        {
          id: 'minimos.ex00.2',
          type: 'curva',
          prompt:
            'En la misma pérdida, la flecha marca el **paso de descenso**. Coloca $w$ donde la pendiente valga $9$ y mira hacia qué lado apunta la flecha: «cuesta abajo» es el lado contrario de la pendiente.',
          hints: [
            'La pendiente es positiva a la derecha del valle (el mínimo está en $w=2$): prueba con valores mayores.',
            'Mira el número de la pendiente mientras arrastras y párate cuando valga $9$.',
          ],
          explain:
            'Con pendiente positiva la curva **sube** hacia la derecha, así que el paso va a la izquierda: siempre al lado contrario de la pendiente.',
          solution:
            'Con $w=2{,}6$ la pendiente vale $9$ y la flecha apunta a la izquierda, hacia el mínimo: el paso es $0{,}04\\times 9=0{,}36$ y cae en $w=2{,}24$.',
          purpose: {
            why: 'Una red no ve la curva de su pérdida: solo conoce la pendiente donde está. Con ella decide hacia dónde mover cada peso, y la regla es la misma a cada lado del valle.',
            aim: 'Colocas $w$ a la derecha del mínimo, donde la pendiente es positiva, y miras hacia qué lado cae el paso de descenso.',
            takeaway:
              'Pendiente positiva, paso a la izquierda; pendiente negativa, paso a la derecha. El signo da el sentido y el tamaño de la pendiente, cuánto avanzar. Es el paso de todo entrenamiento.',
          },
          graph: {
            ...WINDOW_A,
            snap: 0.1,
            curve: { kind: 'mse', data: DATA_A },
            points: [{ id: 'p', label: 'w', x: 0.5, movable: true, onCurve: true }],
            readouts: ['coords', 'slope'],
            labels: LABELS,
            step: { of: 'p', rate: 0.04 },
            fit: { of: 'p' },
          },
          goals: [{ metric: 'slope', of: ['p'], target: 9, tol: 0.05 }],
        },
        {
          id: 'minimos.ex00.3',
          type: 'curva',
          prompt:
            'Los mismos datos más uno **atípico**, el punto $(2, 21)$: una respuesta que costó mucho más de lo normal. Antes el mínimo estaba en $w=2$. Mueve $w$ hasta el **nuevo** mínimo (pendiente $0$) y mira el cuadrado del dato raro.',
          hints: [
            'En $w=2$ la pendiente ya no es $0$: su signo dice hacia qué lado está el nuevo valle.',
            'El error al cuadrado castiga mucho los errores grandes: el dato atípico tira del mínimo hacia sí.',
          ],
          explain:
            'Un error grande pesa al cuadrado, así que un solo dato lejano mueve el mínimo. Con pendiente negativa en $w=2$, el nuevo valle queda a la derecha.',
          solution:
            'El mínimo pasa de $w=2$ a $w=3$: un solo dato atípico lo desplaza una unidad entera. La pérdida mínima sube de $0{,}75$ a $51{,}6$, porque ningún $w$ ajusta bien el dato raro y los demás.',
          purpose: {
            why: 'Los datos reales traen errores y valores raros. Como la pérdida cuadrática castiga mucho los errores grandes, un dato atípico puede arrastrar los pesos que aprende el modelo.',
            aim: 'Añades un dato lejano y buscas el nuevo mínimo, comparando la recta y los cuadrados con los de la pregunta anterior.',
            takeaway:
              'El mínimo depende de los datos: un solo dato atípico lo movió de $2$ a $3$. Por eso se limpian los datos o se usan pérdidas que castigan menos los errores grandes.',
          },
          graph: {
            ...WINDOW_OUTLIER,
            snap: 0.1,
            curve: { kind: 'mse', data: DATA_OUTLIER },
            points: [{ id: 'p', label: 'w', x: 2, movable: true, onCurve: true }],
            readouts: ['coords', 'slope'],
            labels: LABELS,
            fit: { of: 'p' },
          },
          goals: [{ metric: 'slope', of: ['p'], target: 0, tol: 0.1 }],
        },
        {
          id: 'minimos.ex00.4',
          type: 'curva',
          prompt:
            'Esta curva tiene **dos valles**. Mueve A al más hondo (el mínimo **global**) y B al otro (un mínimo **local**), los dos con pendiente $0$. La flecha de B es adónde bajaría un descenso desde donde está.',
          hints: [
            'Un mínimo es un punto de pendiente $0$ donde la curva baja antes y sube después. Hay otro, en la cima entre los valles, que no vale.',
            'El global es el que tiene la altura más baja.',
          ],
          explain:
            'Una curva puede tener varios mínimos. El descenso de gradiente solo ve la pendiente de donde está, así que cae en el valle que tiene más cerca, sea o no el más hondo.',
          solution:
            'A en $x=-2$ (altura $-12{,}67$, el global) y B en $x=3$ (altura $-2{,}25$, un local). En $x=1$ también hay pendiente $0$, pero es la cima entre los dos valles.',
          purpose: {
            why: 'La pérdida de una red de verdad tiene muchísimos valles. El descenso de gradiente baja al que le queda más cerca y no puede saber si hay otro más hondo.',
            aim: 'Colocas dos puntos en los dos valles de una curva y comparas sus alturas para distinguir el global del local.',
            takeaway:
              'Pendiente $0$ no basta para decir «el mejor»: hay que comparar alturas. Dónde empieza el descenso decide en qué valle acaba, y por eso importa cómo se inicializan los pesos.',
          },
          graph: {
            ...WINDOW_QUARTIC,
            snap: 0.1,
            curve: QUARTIC,
            points: [
              { id: 'a', label: 'A', x: 0, movable: true, onCurve: true },
              { id: 'b', label: 'B', x: 2.5, movable: true, onCurve: true },
            ],
            readouts: ['coords', 'slope'],
            step: { of: 'b', rate: 0.1 },
          },
          goals: [
            { metric: 'slope', of: ['a'], target: 0, tol: 0.05 },
            { metric: 'fx', of: ['a'], target: -12.67, tol: 0.1 },
            { metric: 'slope', of: ['b'], target: 0, tol: 0.05 },
            { metric: 'fx', of: ['b'], target: -2.25, tol: 0.1 },
          ],
        },
        {
          id: 'minimos.ex00.5',
          type: 'curva',
          prompt:
            'Una curva con una cima y un valle. La pendiente vale $0$ en los dos, pero solo uno es un **mínimo**. Coloca P en el punto de pendiente $0$ que es un mínimo: la curva baja a su izquierda y sube a su derecha.',
          hints: [
            'Hay dos puntos de pendiente $0$. Mira qué hace la curva a cada lado de ellos.',
            'En un mínimo la pendiente pasa de negativa a positiva; en un máximo, al revés.',
          ],
          explain:
            'Que la pendiente sea $0$ no basta: un máximo también la tiene. Se distinguen por el signo de la pendiente a cada lado: de negativa a positiva es un mínimo; de positiva a negativa, un máximo.',
          solution:
            'P en $x=3$: altura $-7$ y la pendiente pasa de negativa a positiva. En $x=-1$ la pendiente también vale $0$, pero es un máximo local, de altura $3{,}67$.',
          purpose: {
            why: 'Cuando la pendiente de la pérdida vale $0$ el entrenamiento se detiene. Hace falta saber si ese punto es un valle (bien) o una cima (mala señal): la pendiente a cada lado lo dice.',
            aim: 'Mueves P por los dos puntos de pendiente $0$ de una cúbica y te fijas en cómo cambia la pendiente antes y después de cada uno.',
            takeaway:
              'Los puntos de pendiente $0$ son candidatos, no mínimos seguros: un mínimo es donde la pendiente pasa de negativa a positiva. En una red real se llaman puntos críticos.',
          },
          graph: {
            ...WINDOW_CUBIC,
            snap: 0.5,
            curve: CUBIC,
            points: [{ id: 'p', label: 'P', x: 0, movable: true, onCurve: true }],
            readouts: ['coords', 'slope'],
          },
          goals: [
            { metric: 'slope', of: ['p'], target: 0, tol: 0.05 },
            { metric: 'fx', of: ['p'], target: -7, tol: 0.1 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'minimos.ex01.1',
          type: 'numero',
          prompt:
            'Tres datos, $(1, 2)$, $(2, 3)$ y $(3, 5)$. La figura es la pérdida de $\\hat y=w\\cdot x$ con ellos, y su valle está en $w^{*}=\\dfrac{\\sum x_iy_i}{\\sum x_i^{2}}$. Calcula $w^{*}$, con dos decimales.',
          hints: [
            'Calcula primero $\\sum x_iy_i=1\\cdot2+2\\cdot3+3\\cdot5$ y después $\\sum x_i^{2}$.',
            'Divide la primera suma entre la segunda. Un error típico: elevar al cuadrado la suma de los $x$ en vez de sumar sus cuadrados.',
          ],
          explain:
            'La fórmula sale de pedir que la pendiente de la pérdida valga $0$: suma de productos $x\\,y$ entre suma de cuadrados $x^{2}$. En la figura, el valle cae por ahí.',
          solution:
            '$\\sum x_iy_i=2+6+15=23$ y $\\sum x_i^{2}=1+4+9=14$, luego $w^{*}=\\dfrac{23}{14}\\approx 1{,}64$. El valle de la figura cae entre $1{,}5$ y $1{,}75$.',
          answer: 1.643,
          tol: 0.005,
          purpose: {
            why: 'Ajustar un modelo de un solo peso a unos datos tiene respuesta cerrada: se calcula el fondo del valle sin tantear. Es la regresión lineal más sencilla, y de ahí parte el entrenamiento.',
            aim: 'Calculas el peso que hace mínima la pérdida de tres datos y lo comparas con el valle de la figura.',
            takeaway:
              'El mínimo es $w^{*}=\\sum xy/\\sum x^{2}$. Con millones de pesos no hay una fórmula así y se baja al valle paso a paso: por eso hace falta la pendiente.',
          },
          graph: {
            x: [0, 3],
            y: [0, 14],
            snap: 0.1,
            curve: { kind: 'mse', data: DATA_B },
            points: [{ id: 'p', label: 'w', x: 1, movable: false, onCurve: true }],
            readouts: ['coords'],
            labels: LABELS,
            fit: { of: 'p' },
          },
        },
        {
          id: 'minimos.ex01.2',
          type: 'numero',
          prompt:
            'Cuatro datos: $(1, 1)$, $(1, 3)$, $(2, 4)$ y $(2, 4)$. Su mínimo está en $w=2$, el punto P de la figura. ¿Cuánto vale la pérdida allí, la media de los errores al cuadrado?',
          hints: [
            'El error de cada dato es $w\\,x-y$ con $w=2$: calcula los cuatro y míralos en los cuadrados de la figura.',
            'Eleva cada error al cuadrado y haz la media de los cuatro.',
          ],
          explain:
            'La pérdida es la media de los cuadrados de los errores, no su suma ni su media sin elevar. Los cuadrados de la figura son esos errores al cuadrado.',
          solution:
            'Los errores son $2-1=1$, $2-3=-1$, $4-4=0$ y $4-4=0$. Sus cuadrados suman $2$ y la media es $2\\div4=0{,}5$.',
          answer: 0.5,
          tol: 0.01,
          purpose: {
            why: 'El valor de la pérdida en el mínimo es lo que queda de error cuando el modelo ya no puede mejorar. Los entrenamientos lo vigilan para saber si el modelo se ajusta bien o mal.',
            aim: 'Calculas el error de cada dato en el mínimo, los elevas al cuadrado y los promedias; en la figura son los cuadrados.',
            takeaway:
              'Aun en el mejor $w$ la pérdida no es $0$: aquí queda $0{,}5$, porque una recta por el origen no pasa por todos los datos. Ese resto es el error que el modelo no puede quitar.',
          },
          graph: {
            x: [0, 4],
            y: [0, 12],
            snap: 0.1,
            curve: { kind: 'mse', data: DATA_C },
            points: [{ id: 'p', label: 'P', x: 2, movable: false, onCurve: true }],
            readouts: [],
            labels: LABELS,
            fit: { of: 'p' },
          },
        },
        {
          id: 'minimos.ex01.3',
          type: 'numero',
          prompt:
            'La pérdida de un modelo es $L(w)=4w^{2}-10w+9$ (la figura). El mínimo de $a\\,w^{2}+b\\,w+c$, con $a>0$, está donde la pendiente vale $0$: en $w=-\\dfrac{b}{2a}$. ¿En qué $w$ está el mínimo? Con dos decimales.',
          hints: [
            'Lee $a=4$ y $b=-10$. Cuidado con el signo de $b$.',
            'Compruébalo con la pendiente: $L^{\\prime}(w)=8w-10$ debe valer $0$ en tu respuesta.',
          ],
          explain:
            'La pendiente de la parábola es $2a\\,w+b$ y vale $0$ en $-b/(2a)$. Con $a>0$ la parábola abre hacia arriba y ese punto es un mínimo.',
          solution:
            '$w=-\\dfrac{-10}{2\\cdot4}=\\dfrac{10}{8}=1{,}25$. Con ese $w$ la pérdida vale $2{,}75$ y, a los dos lados, sube.',
          answer: 1.25,
          tol: 0.005,
          purpose: {
            why: 'La pérdida de un modelo de un peso con error cuadrático es siempre una parábola. Saber dónde está su fondo sin tantear permite comprobar a mano lo que el entrenamiento debería encontrar.',
            aim: 'Lees $a$ y $b$ de la fórmula, calculas el fondo de la parábola y lo contrastas con la figura.',
            takeaway:
              'El fondo de una parábola está en $-b/(2a)$, donde la pendiente $2a\\,w+b$ se anula. Es el mismo «pendiente cero» de todo el proyecto, en su versión de fórmula.',
          },
          graph: {
            x: [-1, 3],
            y: [0, 24],
            snap: 0.25,
            curve: { kind: 'poly', coefs: [9, -10, 4] },
            points: [],
            readouts: [],
            labels: LABELS,
          },
        },
        {
          id: 'minimos.ex01.4',
          type: 'opcion',
          prompt:
            'La curva de la figura es $x^{3}$. En P la tangente es **horizontal**: la pendiente vale $0$. ¿Es P un mínimo?',
          hints: [
            'Mira la curva a la izquierda y a la derecha de P: ¿está más abajo o más arriba que P?',
            'En un mínimo la curva queda **por encima** de P a los dos lados.',
          ],
          explain:
            'Pendiente $0$ es una condición necesaria para un mínimo, pero no suficiente. Hay que mirar cómo sigue la curva a cada lado del punto.',
          solution:
            'A la izquierda de P la curva está por debajo y a la derecha, por encima. La pendiente vale $0$ solo en P y es positiva a los dos lados: no es mínimo ni máximo, sino un punto de inflexión.',
          options: [
            'Sí: toda pendiente $0$ es un mínimo',
            'No: la curva sigue subiendo a los dos lados de P y solo se aplana en él',
            'No: es un máximo, porque la curva baja a los dos lados',
            'No se puede saber: la pendiente no da ninguna información',
          ],
          correct: 1,
          purpose: {
            why: 'Cuando el entrenamiento se para con pendiente $0$, no siempre ha llegado a un valle: puede estar en una cima o en una zona plana. Hay que saber distinguirlo.',
            aim: 'Miras una curva con pendiente $0$ en un punto y decides si es un mínimo observando cómo sigue a ambos lados.',
            takeaway:
              'Pendiente $0$ no garantiza un mínimo. En redes grandes abundan los puntos planos como este, y por eso los optimizadores no se fían solo de la pendiente de un instante.',
          },
          graph: {
            x: [-2, 2],
            y: [-8, 8],
            snap: 0.5,
            curve: { kind: 'poly', coefs: [0, 0, 0, 1] },
            points: [{ id: 'p', label: 'P', x: 0, movable: false, onCurve: true }],
            readouts: ['coords'],
            tangent: true,
          },
        },
        {
          id: 'minimos.ex01.5',
          type: 'opcion',
          prompt:
            'La curva tiene dos valles, y el descenso de gradiente parte de P (la flecha es su primer paso). Si repite ese paso una y otra vez, ¿dónde acaba?',
          hints: [
            'La flecha apunta cuesta abajo desde donde está P, no hacia el punto más bajo de toda la curva.',
            'Cerca del fondo de un valle la pendiente se acerca a $0$ y los pasos se hacen cada vez más cortos.',
          ],
          explain:
            'El descenso solo conoce la pendiente local: baja por donde la curva baja desde P. Al llegar al fondo de ese valle la pendiente es $0$ y se detiene, aunque haya otro valle más hondo.',
          solution:
            'Acaba en el mínimo local de $x=3$: allí la pendiente es $0$ y no hay paso que dar. Para llegar al valle de $x=-2$ habría que empezar a la izquierda de la cima, en $x=1$.',
          options: [
            'En el valle de la derecha, el más cercano: solo ve la pendiente de donde está',
            'En el valle de la izquierda, porque es el más hondo de la curva',
            'En la cima entre los dos valles, porque allí la pendiente es $0$',
            'Salta al otro valle cuando el paso se hace grande',
          ],
          correct: 0,
          purpose: {
            why: 'El descenso de gradiente es la base del entrenamiento y tiene un límite: baja al valle más cercano. La pérdida de una red tiene muchos, y el punto de partida pesa.',
            aim: 'Sigues el primer paso de descenso desde un punto y deduces dónde acabaría si lo repitiera, mirando la curva entera.',
            takeaway:
              'El descenso puede quedarse en un mínimo local. Por eso se prueban distintos puntos de partida y se usan trucos para no caer en valles poco profundos.',
          },
          graph: {
            ...WINDOW_QUARTIC,
            snap: 0.1,
            curve: QUARTIC,
            points: [{ id: 'p', label: 'P', x: 2.5, movable: false, onCurve: true }],
            readouts: ['coords'],
            step: { of: 'p', rate: 0.1 },
          },
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'minimos.ex02.1',
          type: 'codigo',
          prompt:
            'Ya tienes los datos `x` e `y` y 41 pesos candidatos en `ws` (de $0$ a $4$). Guarda en `perdidas` la pérdida de **todos** los pesos a la vez, sin bucle (una fila por peso, con `ws[:, None]`), y en `mejor_w` el peso con la menor pérdida. La figura ya está hecha: tu mínimo cae en su valle.',
          hints: [
            'El plan son dos líneas. `ws[:, None] * x` da una tabla con una fila por peso y una columna por dato: se resta `y`, se eleva al cuadrado y la media de cada **fila** (`axis=1`) es la pérdida de ese peso. Para `mejor_w`, `np.argmin` da la **posición** de la menor pérdida, y con ella se saca el peso de `ws`.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'a = np.array([1, 2])',
                'b = np.array([1, 5])',
                'pesos = np.array([0, 1, 2])',
                'print(pesos[:, None] * a)   # una fila por peso, una columna por dato',
                'print(((pesos[:, None] * a - b) ** 2).mean(axis=1))   # la pérdida de cada peso: 13, 4.5 y 1',
                'print(np.argmin([5.0, 2.0, 9.0]))   # 1: la posición del menor, no el menor',
              ),
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'perdidas = ((ws[:, None] * x - y) ** 2).mean(axis=___)',
                'mejor_w = ws[np.___(perdidas)]',
              ) +
              '\n\nEl primer hueco es el número del eje que promedia cada fila. El segundo, la función que da la posición del menor.',
          ],
          explain:
            'Con `[:, None]` NumPy repite la cuenta para cada peso sin bucle. La media se hace por filas, una por peso, y `np.argmin` devuelve una posición: el peso hay que sacarlo de `ws`. Compara con la figura.',
          solution:
            'Con la tabla de errores al cuadrado y su media por filas salen 41 pérdidas. La menor es $0{,}715$ y está en la posición 23 de `ws`, así que `mejor_w` vale $2{,}3$. Si guardas la posición, `mejor_w` vale $23$: no es un peso.',
          requirements: [
            '`perdidas` existe y es un array de NumPy (o una lista) con 41 números, uno por cada peso de `ws` y en su mismo orden.',
            'Cada número de `perdidas` es la media, sobre los datos, de los errores al cuadrado de ese peso: ni la suma, ni los errores sin elevar al cuadrado.',
            '`mejor_w` existe y es un número: el peso de `ws` con la menor pérdida, no su posición ni el valor de la pérdida.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt

# x e y son los datos: la longitud de la respuesta (en cientos de tokens) y lo que cuesta (en céntimos).
# ws son los 41 pesos w que se van a probar, de 0 a 4, a un décimo de distancia.
# Ya están hechos: no hace falta tocarlos.
x = np.array([2, 3, 4, 5])
y = np.array([3, 7, 9, 12])
ws = np.linspace(0, 4, 41)

# PASO 1. perdidas: la pérdida de cada peso de ws, un número por peso, sin bucle.
# Qué: el error de cada dato es w * x - y; se eleva al cuadrado (**) y se promedia (.mean).
# Por qué: con un número por peso se pueden comparar todos y quedarse con el mejor.
# Cómo: ws[:, None] convierte los pesos en una columna; al multiplicarla por x sale una tabla con una
# fila por peso y una columna por dato. Con otros datos, a = [1, 2] y pesos [0, 1], la tabla es
# [[0, 0], [1, 2]]. Se promedia cada fila con .mean(axis=...). Sale un array con 41 números.
perdidas = None

# PASO 2. mejor_w: el peso de ws con la menor pérdida.
# Qué: no la pérdida más baja, sino el peso que la produce.
# Cómo: np.argmin(v) devuelve la POSICIÓN del número menor de v (no el número). Con esa posición,
# ws[posición] saca el peso. Ejemplo: si v = [5, 2, 9], np.argmin(v) es 1. Sale un solo número.
mejor_w = None

# Ya está hecha: no hace falta tocarla. Dibuja la pérdida para todos los pesos y marca el tuyo.
ww = np.linspace(0, 4, 200)
plt.plot(ww, ((ww[:, None] * x - y) ** 2).mean(axis=1))
if mejor_w is not None:
    plt.axvline(mejor_w, color="tab:red")
plt.xlabel("w")
plt.ylabel("pérdida")

# Para ver qué vale algo antes de entregar: print(perdidas) o print(mejor_w) y pulsa «Ejecutar».
`,
          checks: `_x = np.array([2, 3, 4, 5])
_y = np.array([3, 7, 9, 12])
_ws = np.linspace(0, 4, 41)
_exp = ((_ws[:, None] * _x - _y) ** 2).mean(axis=1)
try:
    _pa = np.asarray(perdidas, dtype=float)
except Exception:
    _pa = None
_p = _pa is not None and _pa.shape == (41,)
_pf = _p and bool(np.all(np.isfinite(_pa)))
_pok = _pf and bool(np.allclose(_pa, _exp))
_psum = _pf and bool(np.allclose(_pa, 4 * _exp))
_psq = _pf and bool(np.allclose(_pa, (_ws[:, None] * _x - _y).mean(axis=1)))
_m = isinstance(mejor_w, (int, float, np.integer, np.floating)) and not isinstance(mejor_w, (bool, np.bool_))
_best = float(_ws[np.argmin(_exp)])
check(_p, "\`perdidas\` tiene que ser un array de NumPy (o una lista) con 41 números: una pérdida por cada peso de \`ws\`.")
check((not _p) or _pf, "\`perdidas\` tiene que tener números normales, sin huecos ni infinitos.")
check((not _pf) or not _psum, "\`perdidas\` está sumando los errores al cuadrado en vez de promediarlos. La pérdida es la media: usa \`.mean\` o divide entre el número de datos.")
check((not _pf) or not _psq, "\`perdidas\` no eleva los errores al cuadrado: sin el cuadrado, los errores de un signo compensan a los del otro. Eleva con \`**\`.")
check((not _pf) or _pok or _psum or _psq, "\`perdidas\` tiene que valer, para cada peso de \`ws\`, la media de los errores al cuadrado, \`(w * x - y) ** 2\`, sobre los datos.")
check(_m, "\`mejor_w\` tiene que ser un número: el peso de \`ws\` con la menor pérdida.")
check((not _m) or mejor_w != 23, "\`mejor_w\` vale 23: es la posición del mejor peso en \`ws\`, no el peso. Saca el peso de \`ws\` con esa posición.")
check((not _m) or abs(float(mejor_w) - float(np.min(_exp))) > 1e-9, "\`mejor_w\` es la menor pérdida, no el peso que la produce. Hace falta el peso de \`ws\` que está en esa posición.")
check((not _m) or mejor_w == 23 or abs(float(mejor_w) - float(np.min(_exp))) < 1e-9 or abs(float(mejor_w) - _best) < 1e-9, "\`mejor_w\` no es el peso de menor pérdida. Compara con la figura: el punto más bajo de la curva.")
`,
          reference:
            'import numpy as np\n\nx = np.array([2, 3, 4, 5])\ny = np.array([3, 7, 9, 12])\nws = np.linspace(0, 4, 41)\n\nperdidas = ((ws[:, None] * x - y) ** 2).mean(axis=1)\nmejor_w = ws[np.argmin(perdidas)]\n',
        },
        {
          id: 'minimos.ex02.2',
          type: 'codigo',
          prompt:
            'Escribe la función `w_optimo(x, y)`: recibe dos arrays de NumPy con los datos y devuelve el peso $w^{*}$ que hace mínima la pérdida de $\\hat y=w\\cdot x$, con la fórmula $\\sum x_iy_i\\,/\\sum x_i^{2}$. Se prueba con varios conjuntos de datos, de distinto tamaño.',
          hints: [
            'El plan son tres líneas dentro de la función: la suma de los productos `x * y` (elemento a elemento), la suma de los cuadrados `x ** 2`, y `return` de la primera entre la segunda. Un error típico: `np.sum(x) ** 2`, que es el cuadrado de la suma, no la suma de cuadrados.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'a = np.array([1, 2, 3])',
                'b = np.array([2, 2, 2])',
                'print(a * b)               # [2 4 6]: producto elemento a elemento',
                'print(np.sum(a * b))       # 12: la suma de los productos',
                'print(a ** 2, np.sum(a ** 2))   # [1 4 9] 14: la suma de los cuadrados',
                'print(np.sum(a) ** 2)      # 36: el cuadrado de la suma, que NO es lo mismo',
              ) +
              '\n\nEn una función todo lo de dentro lleva 4 espacios de sangría, y lo que devuelve va con `return`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def w_optimo(x, y):',
                '    arriba = np.sum(x ___ y)',
                '    abajo = np.sum(x ___ 2)',
                '    return arriba / ___',
              ) +
              '\n\nEl primer hueco es el operador de multiplicar; el segundo, el de elevar a una potencia; el tercero, la variable que has calculado para dividir.',
          ],
          explain:
            'El fondo del valle se calcula sin tantear: suma de productos entre suma de cuadrados. Cuida la diferencia entre la suma de los cuadrados y el cuadrado de la suma. Compara con la figura: la línea roja cae en el fondo.',
          solution:
            'Se calcula `arriba`, la suma de `x * y`, y `abajo`, la suma de `x ** 2`, y se devuelve su cociente. Para $x=(1, 2, 3)$ e $y=(2, 3, 5)$ salen $23$ y $14$, y $w^{*}\\approx 1{,}64$.',
          requirements: [
            '`w_optimo` es una función que recibe dos arrays de NumPy del mismo tamaño y devuelve un número.',
            'Se llama con varios conjuntos de datos, de 2 a 5 datos, con valores positivos y negativos; no debe dar error.',
            'El número que devuelve es el peso que hace mínima la pérdida de $\\hat y=w\\cdot x$ sobre esos datos.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt

# Los datos: la longitud de la respuesta (en cientos de tokens) y lo que cuesta (en céntimos).
# Ya están hechos: no hace falta tocarlos.
x = np.array([1, 2, 3])
y = np.array([2, 3, 5])

# La función recibe sus datos. Las comprobaciones la llaman con varios conjuntos distintos.
# Todo lo que va dentro de la función lleva 4 espacios delante (la sangría).
def w_optimo(x, y):
    # PASO 1. arriba: la suma de los productos de cada x por su y.
    # Por qué: es la mitad de la fórmula del fondo del valle. x * y multiplica elemento a elemento
    # y np.sum suma. Con otros datos, a = [1, 2, 3] y b = [2, 2, 2], da 2 + 4 + 6 = 12.

    # PASO 2. abajo: la suma de los cuadrados de las x.
    # Por qué: es la otra mitad. x ** 2 eleva cada x al cuadrado y np.sum los suma. Con a = [1, 2, 3]
    # da 1 + 4 + 9 = 14. Ojo: np.sum(a) ** 2 sería 36, que es otra cosa.

    # PASO 3. Devolver arriba entre abajo, con return.
    return None

# Ya está hecha: no hace falta tocarla. Dibuja la pérdida y marca con una línea roja tu resultado.
ww = np.linspace(0, 3, 100)
plt.plot(ww, ((ww[:, None] * x - y) ** 2).mean(axis=1))
w_c = w_optimo(x, y)
if w_c is not None:
    plt.axvline(w_c, color="tab:red")
plt.xlabel("w")
plt.ylabel("pérdida")

# Para probarla antes de entregar: print(w_optimo(x, y)) y pulsa «Ejecutar».
`,
          checks: `import numbers
_casos = [([1, 2, 3], [2, 3, 5]), ([1, 1, 2, 2], [1, 3, 4, 4]), ([2, 4], [1, 1]), ([1, 2, 3, 4, 5], [0, 0, 0, 0, 0]), ([1, 2], [-1, -2]), ([-1, 2, 3], [1, 2, -3])]
_f = callable(globals().get("w_optimo"))
def _try(a, b):
    try:
        return w_optimo(np.array(a), np.array(b))
    except Exception:
        return None
_got = [_try(a, b) for a, b in _casos] if _f else []
_run = _f and all(g is not None for g in _got)
_num = _run and all(isinstance(g, numbers.Real) and not isinstance(g, bool) and g == g for g in _got)
_exp = [float(np.sum(np.array(a) * np.array(b)) / np.sum(np.array(a) ** 2)) for a, b in _casos]
_ok = _num and all(abs(g - e) < 1e-9 for g, e in zip(_got, _exp))
_sq = _num and all(abs(g - float(np.sum(np.array(a) * np.array(b)) / np.sum(np.array(a)) ** 2)) < 1e-9 for g, (a, b) in zip(_got, _casos))
_ratio = _num and all(abs(g - float(np.sum(b) / np.sum(a))) < 1e-9 for g, (a, b) in zip(_got, _casos))
_inv = _num and all(abs(g - 1 / e) < 1e-9 for g, e in zip(_got, _exp) if abs(e) > 1e-9)
check(_f, "Hay que definir una función \`w_optimo\` que reciba los dos arrays de datos.")
check((not _f) or _run, "\`w_optimo\` da un error con algún conjunto de datos, o devuelve \`None\`. Recibe dos arrays y la función tiene que terminar con \`return\` y el resultado.")
check((not _run) or _num, "\`w_optimo\` tiene que devolver un solo número: el peso que hace mínima la pérdida.")
check((not _num) or _ok or not _sq, "\`w_optimo\` divide entre el cuadrado de la suma de las x. Hay que dividir entre la suma de los cuadrados: eleva cada x al cuadrado y suma después.")
check((not _num) or _ok or not _ratio, "\`w_optimo\` está dividiendo la suma de las y entre la suma de las x. La fórmula usa la suma de los productos x por y, y la suma de los cuadrados de las x.")
check((not _num) or _ok or not _inv, "\`w_optimo\` está al revés: has dividido la suma de cuadrados entre la suma de productos. Va la suma de productos arriba.")
check((not _num) or _ok or _sq or _ratio or _inv, "\`w_optimo\` no da el fondo del valle. Calcula la suma de los productos \`x * y\` y la suma de los cuadrados \`x ** 2\`, y divide la primera entre la segunda.")
`,
          reference:
            'import numpy as np\n\n\ndef w_optimo(x, y):\n    arriba = np.sum(x * y)\n    abajo = np.sum(x ** 2)\n    return arriba / abajo\n',
        },
        {
          id: 'minimos.ex02.3',
          type: 'codigo',
          prompt:
            'La pérdida de $\\hat y=w\\cdot x$ tiene pendiente $L^{\\prime}(w)$ igual a la media de $2\\,x_i\\,(w\\,x_i-y_i)$. Con `x` e `y` ya hechos, escribe `pendiente(w)`, que la devuelve; y guarda en `en_minimo` su valor en `w_star`, el fondo del valle (ya calculado). Debe salir casi $0$.',
          hints: [
            'El plan son dos pasos. Dentro de la función: los errores, `w * x - y`, y la media de `2 * x * errores`. Fuera: llamar a la función con `w_star`. Errores típicos: olvidar el factor $2$, o devolver la pérdida (los errores al cuadrado) en vez de la pendiente.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'a = np.array([1, 2])',
                'b = np.array([1, 5])',
                'print(0 * a - b)                     # [-1 -5]: los errores con w = 0',
                'print(2 * a * (0 * a - b))           # [ -2 -20]: 2 · x · error, dato a dato',
                'print(np.mean(2 * a * (0 * a - b)))  # -11.0: la pendiente en w = 0',
              ),
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def pendiente(w):',
                '    errores = w * x - ___',
                '    return np.mean(2 * x * ___)',
                'en_minimo = pendiente(___)',
              ) +
              '\n\nLos errores usan las `y`; la media usa los errores; y se evalúa en el peso del fondo del valle.',
          ],
          explain:
            'La pendiente de la pérdida en un peso es la media de $2\\,x\\,(w\\,x-y)$: cada dato empuja según su error. En el fondo del valle los empujes se compensan y sale $0$, salvo un resto minúsculo de redondeo.',
          solution:
            'Los errores son `w * x - y` y la pendiente es la media de `2 * x * errores`. En `w_star`, de aproximadamente $1{,}64$, sale un número del orden de $10^{-16}$: casi $0$, no exactamente por el redondeo del ordenador.',
          requirements: [
            '`pendiente` es una función que recibe un número `w` y devuelve un solo número.',
            'Se llama con varios pesos, positivos, negativos y cero; no debe dar error. Con cada uno devuelve la pendiente de la pérdida de $\\hat y=w\\cdot x$ sobre `x` e `y`, no la pérdida.',
            '`en_minimo` existe y es un número: el valor de esa pendiente en `w_star`.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt

# Los datos: la longitud de la respuesta (en cientos de tokens) y lo que cuesta (en céntimos).
# w_star es el peso del fondo del valle, ya calculado con la fórmula de la pregunta anterior.
# Ya están hechos: no hace falta tocarlos.
x = np.array([1, 2, 3])
y = np.array([2, 3, 5])
w_star = np.sum(x * y) / np.sum(x ** 2)

def pendiente(w):
    # Todo lo que va dentro de la función lleva 4 espacios delante (la sangría).

    # PASO 1. errores: lo que se equivoca el modelo en cada dato, con este w.
    # Por qué: la pendiente se construye con el error de cada dato. Es w * x - y, un array con un
    # número por dato. Con otros datos, a = [1, 2] y b = [1, 5], con w = 0: [-1, -5].

    # PASO 2. Devolver la pendiente: la media de 2 * x * errores, con return.
    # Por qué: cada dato empuja según su error y según su x; la media junta los empujes.
    # Ojo: sin el 2, o con los errores al cuadrado, sale otra cosa.
    return None

# PASO 3. en_minimo: la pendiente en el fondo del valle, llamando a la función.
# Qué: pendiente evaluada en w_star. Tiene que salir casi 0: ahí la tangente es horizontal.
en_minimo = None

# Ya está hecha: no hace falta tocarla. Dibuja la pérdida y marca con un punto rojo el fondo del valle.
ww = np.linspace(0, 3, 100)
plt.plot(ww, ((ww[:, None] * x - y) ** 2).mean(axis=1))
plt.plot([w_star], [((w_star * x - y) ** 2).mean()], "o", color="tab:red")
plt.xlabel("w")
plt.ylabel("pérdida")

# Para probarla antes de entregar: print(pendiente(0)) o print(en_minimo) y pulsa «Ejecutar».
`,
          checks: `import numbers
_x = np.array([1, 2, 3])
_y = np.array([2, 3, 5])
_ws = [0, 1, 2.5, -1]
_f = callable(globals().get("pendiente"))
def _try(w):
    try:
        return pendiente(w)
    except Exception:
        return None
_got = [_try(w) for w in _ws] if _f else []
_run = _f and all(g is not None for g in _got)
_num = _run and all(isinstance(g, numbers.Real) and not isinstance(g, bool) and g == g for g in _got)
_exp = [float(np.mean(2 * _x * (w * _x - _y))) for w in _ws]
_ok = _num and all(abs(g - e) < 1e-9 for g, e in zip(_got, _exp))
_half = _num and all(abs(g - e / 2) < 1e-9 for g, e in zip(_got, _exp))
_loss = _num and all(abs(g - float(np.mean((w * _x - _y) ** 2))) < 1e-9 for g, w in zip(_got, _ws))
_sum = _num and all(abs(g - 3 * e) < 1e-9 for g, e in zip(_got, _exp))
_nox = _num and all(abs(g - float(np.mean(2 * (w * _x - _y)))) < 1e-9 for g, w in zip(_got, _ws))
_w = 23 / 14
_m = isinstance(en_minimo, (int, float, np.integer, np.floating)) and not isinstance(en_minimo, (bool, np.bool_))
check(_f, "Hay que definir una función \`pendiente\` que reciba el peso \`w\`.")
check((not _f) or _run, "\`pendiente\` da un error con algún peso, o devuelve \`None\`. La función tiene que terminar con \`return\` y el resultado.")
check((not _run) or _num, "\`pendiente\` tiene que devolver un solo número: la media de 2 · x · error.")
check((not _num) or _ok or not _half, "\`pendiente\` sale la mitad de lo que debe: falta el factor 2 de la derivada del cuadrado.")
check((not _num) or _ok or not _loss, "\`pendiente\` está devolviendo la pérdida (la media de los errores al cuadrado), no su pendiente. La pendiente es la media de 2 · x · error.")
check((not _num) or _ok or not _sum, "\`pendiente\` está sumando en vez de promediar: sale el triple de lo que debe. Usa la media de los datos.")
check((not _num) or _ok or not _nox, "\`pendiente\` no multiplica cada error por su x. La pendiente es la media de 2 · x · error, no solo de 2 · error.")
check((not _num) or _ok or _half or _loss or _sum or _nox, "\`pendiente\` no da la pendiente de la pérdida. Calcula los errores \`w * x - y\` y promedia \`2 * x * errores\`.")
check(_m, "\`en_minimo\` tiene que ser un número: la pendiente evaluada en \`w_star\`.")
check((not _m) or abs(float(en_minimo)) < 1e-9, "\`en_minimo\` tiene que ser casi 0, porque en el fondo del valle la tangente es horizontal. Llama a \`pendiente\` con \`w_star\`.")
`,
          reference:
            'import numpy as np\n\nx = np.array([1, 2, 3])\ny = np.array([2, 3, 5])\nw_star = np.sum(x * y) / np.sum(x ** 2)\n\n\ndef pendiente(w):\n    errores = w * x - y\n    return np.mean(2 * x * errores)\n\n\nen_minimo = pendiente(w_star)\n',
        },
        {
          id: 'minimos.ex02.4',
          type: 'codigo',
          prompt:
            'Con `w_optimo(x, y)` ya hecha, llega un dato atípico: `x_nuevo = 4` y `y_nuevo = 20`. Guarda en `w_sin` el peso óptimo de los datos de siempre; en `w_con`, el de los datos **con el nuevo añadido** (con `np.append`); y en `salto`, cuánto se ha movido el mínimo (`w_con` menos `w_sin`).',
          hints: [
            'El plan son tres líneas. `w_sin` es llamar a `w_optimo` con `x` e `y`. Para `w_con`, `np.append(x, x_nuevo)` y `np.append(y, y_nuevo)` dan los datos ampliados. `salto` es una resta. Un error típico: pasar a `w_optimo` solo el dato nuevo.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'a = np.array([1, 2, 3])',
                'print(np.append(a, 7))   # [1 2 3 7]: un array nuevo con el 7 al final',
                'print(a)                 # [1 2 3]: a no cambia',
                'print(w_optimo(a, np.array([2, 4, 6])))   # 2.0: la pérdida es mínima en w = 2',
              ),
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'w_sin = w_optimo(x, y)',
                'w_con = w_optimo(np.___(x, x_nuevo), np.append(y, ___))',
                'salto = w_con - ___',
              ) +
              '\n\nEl primer hueco es la función que añade al final; el segundo, el valor nuevo de las `y`; el tercero, el peso de antes.',
          ],
          explain:
            'Añadir un solo dato cambia el mínimo: el error al cuadrado castiga mucho los errores grandes, y un dato lejano tira de la recta hacia sí. `np.append` no modifica los datos de siempre, y así puedes comparar los dos pesos.',
          solution:
            '`w_sin` vale $23/14\\approx 1{,}64$. Con el dato atípico, $\\sum x_iy_i=103$ y $\\sum x_i^{2}=30$, así que `w_con` es $\\approx 3{,}43$ y `salto` $\\approx 1{,}79$: un solo dato más que el doble del peso.',
          requirements: [
            '`w_sin` y `w_con` existen y son números: el peso óptimo de los datos de siempre y el de esos mismos datos con el dato nuevo añadido.',
            '`salto` existe y es un número: lo que cambia el peso óptimo al añadir el dato, con su signo.',
            '`x` e `y` siguen siendo los datos de siempre, sin el dato nuevo: ampliarlos no debe modificarlos.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt

# Los datos de siempre y el dato atípico que llega. Ya están hechos: no hace falta tocarlos.
x = np.array([1, 2, 3])
y = np.array([2, 3, 5])
x_nuevo = 4
y_nuevo = 20

# La función del fondo del valle, ya hecha: no hace falta tocarla.
def w_optimo(x, y):
    return np.sum(x * y) / np.sum(x ** 2)

# Ya está hecha: no hace falta tocarla. Dibuja los datos y el dato atípico, en rojo.
plt.scatter(x, y)
plt.scatter([x_nuevo], [y_nuevo], color="tab:red")
plt.xlabel("longitud")
plt.ylabel("coste")

# PASO 1. w_sin: el peso óptimo de los datos de siempre.
# Qué: llamar a w_optimo con x e y. Sale un solo número.
w_sin = None

# PASO 2. w_con: el peso óptimo con el dato atípico añadido.
# Qué: los mismos datos con el nuevo al final. np.append(a, 7) da un array nuevo con el 7 detrás
# (a no cambia). Hay que ampliar x con x_nuevo y y con y_nuevo, y llamar a w_optimo con los dos.
w_con = None

# PASO 3. salto: cuánto se ha movido el mínimo.
# Qué: el peso de ahora menos el de antes. Sale un solo número.
salto = None

# Para ver qué vale algo antes de entregar: print(w_sin) o print(w_con) y pulsa «Ejecutar».
`,
          checks: `_x = np.array([1, 2, 3])
_y = np.array([2, 3, 5])
_sin = 23 / 14
_con = 103 / 30
_n = lambda v: isinstance(v, (int, float, np.integer, np.floating)) and not isinstance(v, (bool, np.bool_))
_a, _b, _c = _n(w_sin), _n(w_con), _n(salto)
check(_a, "\`w_sin\` tiene que ser un número: el peso óptimo de los datos de siempre.")
check((not _a) or abs(float(w_sin) - _sin) < 1e-6, "\`w_sin\` no es el peso óptimo de los datos de siempre. Llama a \`w_optimo\` con \`x\` e \`y\`.")
check(_b, "\`w_con\` tiene que ser un número: el peso óptimo con el dato nuevo añadido.")
check((not _b) or abs(float(w_con) - _sin) > 1e-6 or not _a, "\`w_con\` es igual a \`w_sin\`: no has añadido el dato nuevo. Amplía \`x\` e \`y\` con \`np.append\`.")
check((not _b) or abs(float(w_con) - 5.0) > 1e-6, "\`w_con\` es el peso de solo el dato nuevo. Hay que usar los datos de siempre y, además, el nuevo.")
check((not _b) or abs(float(w_con) - _sin) < 1e-6 or abs(float(w_con) - 5.0) < 1e-6 or abs(float(w_con) - _con) < 1e-6, "\`w_con\` no es el peso óptimo de los datos con el nuevo añadido. Amplía \`x\` con \`x_nuevo\` y \`y\` con \`y_nuevo\`.")
check(_c, "\`salto\` tiene que ser un número: \`w_con\` menos \`w_sin\`.")
check((not _c) or (not _a) or (not _b) or abs(float(salto) - (float(w_con) - float(w_sin))) < 1e-9, "\`salto\` tiene que ser \`w_con\` menos \`w_sin\`, en ese orden.")
check(len(x) == 3 and len(y) == 3, "\`x\` e \`y\` tienen que seguir siendo los datos de siempre, con 3 datos: \`np.append\` no los modifica, pero no los reasignes.")
`,
          reference:
            'import numpy as np\n\nx = np.array([1, 2, 3])\ny = np.array([2, 3, 5])\nx_nuevo = 4\ny_nuevo = 20\n\n\ndef w_optimo(x, y):\n    return np.sum(x * y) / np.sum(x ** 2)\n\n\nw_sin = w_optimo(x, y)\nw_con = w_optimo(np.append(x, x_nuevo), np.append(y, y_nuevo))\nsalto = w_con - w_sin\n',
        },
        {
          id: 'minimos.ex02.5',
          type: 'codigo',
          prompt:
            '`f(x)` es la curva con dos valles de las preguntas de manipular, y `xs` son 701 puntos de $-3$ a $4$. Guarda en `fx` las alturas de `f` en `xs`; en `es_min`, un array de verdadero o falso que marca los puntos de `xs` (sin los dos extremos) más bajos que su vecino de la izquierda **y** que el de la derecha; en `minimos`, esos valores de `xs`; y en `x_global`, el de menor altura de ellos.',
          hints: [
            'El plan son cuatro líneas. `fx = f(xs)`. Un punto es un valle si `fx[1:-1]` (los del centro) es menor que `fx[:-2]` (su vecino de la izquierda) y menor que `fx[2:]` (el de la derecha): las dos condiciones se unen con `&`. Con esa máscara se eligen los `xs[1:-1]`. Y `np.argmin` elige el más bajo de entre los `minimos`.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'v = np.array([5, 2, 6, 3, 8])',
                'print(v[1:-1], v[:-2], v[2:])   # centro, vecino izquierdo, vecino derecho',
                'm = (v[1:-1] < v[:-2]) & (v[1:-1] < v[2:])',
                'print(m)                         # [ True False  True]: los dos valles',
                'print(np.array([10, 20, 30, 40, 50])[1:-1][m])   # [20 40]: se queda con los marcados',
              ),
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'fx = f(___)',
                'es_min = (fx[1:-1] < fx[:-2]) ___ (fx[1:-1] < fx[2:])',
                'minimos = xs[1:-1][___]',
                'x_global = minimos[np.___(f(minimos))]',
              ) +
              '\n\nEl segundo hueco une las dos condiciones (las dos a la vez). El último es la función que da la posición del menor.',
          ],
          explain:
            'Un valle es un punto más bajo que sus dos vecinos. Con trozos desplazados del array se comparan todos a la vez, sin bucle, y la máscara elige los puntos. Para decidir cuál es el global hay que comparar las alturas, no las posiciones.',
          solution:
            'Hay dos valles, en $x=-2$ y en $x=3$, así que `minimos` vale $(-2, 3)$. Sus alturas son $-12{,}67$ y $-2{,}25$: el global es `x_global`$=-2$. El de $x=3$ es un mínimo local.',
          requirements: [
            '`fx` es un array de NumPy con las alturas de `f` en cada punto de `xs` (701 números).',
            '`es_min` es un array de verdadero o falso con 699 elementos, uno por cada punto de `xs` sin sus dos extremos.',
            '`minimos` es un array de NumPy con los valores de `xs` que son valles, en el orden de `xs`.',
            '`x_global` es un número: el valor de `xs` con menor altura entre los valles, no su altura.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt

# f es la curva con dos valles y xs son los puntos donde se mira, a una centésima de distancia.
# Ya están hechos: no hace falta tocarlos.
def f(x):
    return x ** 4 / 4 - 2 * x ** 3 / 3 - 5 * x ** 2 / 2 + 6 * x

xs = np.linspace(-3, 4, 701)

# PASO 1. fx: la altura de la curva en cada punto de xs.
# Qué: llamar a f con el array xs entero; la cuenta se hace de golpe en todos los puntos.
fx = None

# PASO 2. es_min: qué puntos son un valle.
# Qué: un punto es un valle si es más bajo que su vecino de la izquierda Y que el de la derecha.
# Cómo: fx[1:-1] son los puntos del centro (sin los extremos), fx[:-2] sus vecinos de la izquierda y
# fx[2:] los de la derecha. Se comparan con < y se unen las dos condiciones con & (con paréntesis).
# Con v = [5, 2, 6, 3, 8] sale [True, False, True]. Sale un array de 699 verdaderos o falsos.
es_min = None

# PASO 3. minimos: los valores de xs que son valles.
# Cómo: la máscara elige elementos: xs[1:-1][es_min] se queda con los xs[1:-1] marcados.
minimos = None

# PASO 4. x_global: de los valles, el de menor altura.
# Cómo: np.argmin(v) da la POSICIÓN del menor de v. Hay que mirar las alturas, f(minimos), y sacar
# de minimos el que está en esa posición. Sale un solo número.
x_global = None

# Ya está hecha: no hace falta tocarla. Dibuja la curva y marca tus valles con puntos rojos.
plt.plot(xs, f(xs))
if minimos is not None:
    plt.plot(minimos, f(minimos), "o", color="tab:red")
plt.xlabel("x")
plt.ylabel("f(x)")

# Para ver qué vale algo antes de entregar: print(minimos) o print(x_global) y pulsa «Ejecutar».
`,
          checks: `_f = lambda x: x ** 4 / 4 - 2 * x ** 3 / 3 - 5 * x ** 2 / 2 + 6 * x
_xs = np.linspace(-3, 4, 701)
_fx = _f(_xs)
def _arr(v):
    try:
        return np.asarray(v, dtype=float)
    except Exception:
        return None
_a = _arr(fx)
_fa = _a is not None and _a.shape == (701,) and bool(np.allclose(_a, _fx))
try:
    _e = np.asarray(es_min)
    _eb = _e.dtype == bool and _e.shape == (699,)
except Exception:
    _e = None
    _eb = False
_mi = _arr(minimos)
_ml = _mi is not None and _mi.ndim == 1
_mok = _ml and _mi.shape == (2,) and bool(np.allclose(_mi, [-2, 3]))
_nt = int(np.sum(_e)) if _eb else -1
_cima = _eb and _nt == 1 and bool(np.allclose(_xs[1:-1][_e], [1.0]))
_eok = _eb and bool(np.array_equal(_e, (_fx[1:-1] < _fx[:-2]) & (_fx[1:-1] < _fx[2:])))
_g = isinstance(x_global, (int, float, np.integer, np.floating)) and not isinstance(x_global, (bool, np.bool_))
check(_fa, "\`fx\` tiene que ser un array con la altura de \`f\` en cada punto de \`xs\`: 701 números. Llama a \`f\` con \`xs\`.")
check(_eb, "\`es_min\` tiene que ser un array de verdadero o falso con 699 elementos: uno por cada punto de \`xs\` sin sus dos extremos.")
check(not _cima, "\`es_min\` marca la cima y no los valles: los valles son más bajos que sus vecinos, no más altos.")
check((not _eb) or _nt <= 2, "\`es_min\` marca demasiados puntos: un valle es más bajo que su vecino de la izquierda y que el de la derecha. Une las dos condiciones con \`&\`.")
check((not _eb) or _nt >= 2 or _cima, "\`es_min\` marca muy pocos puntos: la curva tiene dos valles y los dos tienen que salir marcados.")
check((not _eb) or _eok or _nt != 2, "\`es_min\` marca dos puntos, pero no los dos valles. Compara cada punto del centro con su vecino de la izquierda y con el de la derecha.")
check(_ml, "\`minimos\` tiene que ser un array de NumPy con los valores de \`xs\` que son valles.")
check((not _ml) or _mok or (_eb and _nt != 2), "\`minimos\` no tiene los valores de \`xs\` donde hay un valle. Elige los \`xs[1:-1]\` que marca \`es_min\`.")
check(_g, "\`x_global\` tiene que ser un número: el valor de \`xs\` del valle más hondo.")
check((not _g) or abs(float(x_global) - float(_f(-2))) > 1e-6, "\`x_global\` es la altura del valle, no su posición. Hace falta el valor de \`x\` donde está.")
check((not _g) or abs(float(x_global) - 3) > 1e-6, "\`x_global\` es el valle de la derecha, que es un mínimo local: su altura es mayor. El global es el de menor altura.")
check((not _g) or abs(float(x_global) - (-2)) < 1e-6 or abs(float(x_global) - 3) < 1e-6 or abs(float(x_global) - float(_f(-2))) < 1e-6, "\`x_global\` tiene que ser uno de los valles: el de menor altura.")
`,
          reference:
            'import numpy as np\n\n\ndef f(x):\n    return x ** 4 / 4 - 2 * x ** 3 / 3 - 5 * x ** 2 / 2 + 6 * x\n\n\nxs = np.linspace(-3, 4, 701)\n\nfx = f(xs)\nes_min = (fx[1:-1] < fx[:-2]) & (fx[1:-1] < fx[2:])\nminimos = xs[1:-1][es_min]\nx_global = minimos[np.argmin(f(minimos))]\n',
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'minimos.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien calcula el peso $w^{*}$ que hace mínima la pérdida de $\\hat y=w\\cdot x$ y luego su valor. NumPy ya está importado como `np`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'La fórmula es suma de productos $x\\,y$ entre **suma de cuadrados** $x^{2}$. Mira qué se eleva al cuadrado en cada línea.',
        'Comprueba con los datos: $\\sum xy=23$ y $\\sum x^{2}=14$, luego $w^{*}\\approx1{,}64$.',
      ],
      explain:
        'La fórmula sale de pedir pendiente $0$: el denominador es la suma de los cuadrados de cada $x$. El cuadrado de la suma da otro número. Revisa si cada línea usa lo que la anterior preparó.',
      solution:
        'La tercera línea está mal: `np.sum(x) ** 2` es el cuadrado de la suma ($36$), no la suma de cuadrados ($14$). Debe ser `np.sum(x ** 2)`. Así sale $23/14\\approx 1{,}64$ y no $23/36\\approx 0{,}64$. La última línea arrastra el error.',
      lines: [
        'x = np.array([1, 2, 3])',
        'y = np.array([2, 3, 5])',
        'w = np.sum(x * y) / np.sum(x) ** 2',
        'perdida = np.mean((w * x - y) ** 2)',
      ],
      faultyLine: 2,
    },
    {
      id: 'minimos.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento estudia dónde parar un entrenamiento. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Piensa en una cima: ¿qué pendiente tiene justo arriba?',
        'Para saber si un punto de pendiente $0$ es un valle, mira cómo cambia la pendiente a sus lados.',
      ],
      explain:
        'Una pendiente $0$ da un punto candidato, pero una cima y una zona plana también la tienen. Revisa cada paso con esa idea.',
      solution:
        'La segunda línea está mal. Una pendiente $0$ no basta para asegurar un mínimo: una cima también la tiene. Hay que ver que la pendiente pasa de negativa a positiva. La tercera línea arrastra el error.',
      lines: [
        'Un entrenamiento se para cuando la pendiente de la pérdida vale 0',
        'Luego, si la pendiente vale 0 en w = 2, w = 2 es siempre un mínimo',
        'Entonces la pérdida no puede bajar más moviendo w',
      ],
      faultyLine: 1,
    },
    {
      id: 'minimos.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento usa los datos de la pregunta del dato atípico: el mínimo estaba en $w=2$ y llega el dato $(2, 21)$. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'El dato nuevo pide un coste mucho mayor que el que da $w=2$: ¿hacia dónde empuja?',
        'Con pendiente negativa, la pérdida baja hacia la derecha.',
      ],
      explain:
        'El dato atípico empuja la pendiente de $w=2$ hacia valores negativos, y el descenso va al lado contrario de la pendiente. Comprueba que cada paso se sigue del anterior.',
      solution:
        'No hay ningún error. En $w=2$ la pendiente antes valía $0$, y el dato nuevo la deja en $-13{,}6$. Es negativa, así que la pérdida baja hacia la derecha y el nuevo mínimo queda a la derecha de $2$ (está en $w=3$).',
      lines: [
        'En w = 2 la pendiente de la pérdida valía 0, antes del dato nuevo',
        'Con el dato (2, 21) la pendiente en w = 2 pasa a ser negativa, porque ese dato pide un w mayor',
        'Con pendiente negativa hay que ir a la derecha: el nuevo mínimo está a la derecha de w = 2',
      ],
      faultyLine: null,
    },
  ],
};
