import type { GraphSpec, Project } from '../../content/schema';
import { py } from '../py';
import { derivadaPendienteWarmup } from './derivada-pendiente.calentamiento';

/**
 * La pérdida de las cuatro primeras `curva`: L(w) = (w − 2)² = 4 − 4w + w², con el fondo en w = 2 y
 * pendiente 2w − 4 (cifras comprobadas con NumPy). La ventana la enseña entera, de w = −1 a 5, donde
 * vale 9 en ambos extremos.
 */
const LOSS: GraphSpec['curve'] = { kind: 'poly', coefs: [4, -4, 1] };
const LOSS_WINDOW = { x: [-1, 5], y: [-1, 10] } satisfies Pick<GraphSpec, 'x' | 'y'>;
const LOSS_LABELS = { x: 'w', y: 'pérdida' };

/** Primer proyecto de la Órbita 0 del juego 3: la derivada como pendiente de la tangente. */
export const derivadaPendiente: Project = {
  id: 'derivada-pendiente',
  name: 'Derivada como pendiente',
  sub: 'Acercar la secante',
  bigPicture: {
    parts: ['gradient', 'loss'],
    text: 'La pérdida mide cuánto se equivoca la red, y el gradiente dice cuánto cambia esa pérdida por cada poco que se mueve un peso. Es la derivada: la pendiente de la tangente a la curva de la pérdida. Aquí la ves con un solo peso, y la comprobación numérica que haces al final es la que usa un ingeniero para fiarse de un gradiente.',
  },
  warmup: derivadaPendienteWarmup,
  exercises: [
    {
      kind: 'manipular',
      questions: [
        {
          id: 'derivada-pendiente.ex00.1',
          type: 'curva',
          prompt:
            'La curva es una pérdida, $L(w)=(w-2)^2$. La recta por P y Q es una **secante**. Acerca Q a P por la derecha hasta que la pendiente de la secante quede a $0{,}1$ o menos de la pendiente de la tangente en P.',
          hints: [
            'La pendiente de la tangente en P está en el panel. Compárala con la de la secante mientras mueves Q.',
            'No hace falta llegar a P (con los dos puntos juntos no hay secante): basta con acercarse mucho.',
          ],
          explain:
            'Cuanto más cerca está Q de P, más se parece la secante a la tangente. La derivada es el límite de las pendientes de las secantes cuando Q llega a P.',
          solution:
            'Con Q en $w=3{,}1$ la secante vale $2{,}1$, a $0{,}1$ de la tangente (que vale $2$). La secante entre $w=3$ y $w=q$ tiene pendiente $q-1$ y se acerca a $2$.',
          purpose: {
            why: 'Una red no ve la curva de su pérdida: solo puede probar un peso y otro cercano y comparar. Esa comparación es una pendiente, y la derivada es lo que queda al acercar los dos pesos hasta casi tocarse.',
            aim: 'Mueves Q hacia P y ves cómo la secante gira hasta pegarse a la tangente, mientras su pendiente se acerca a la de la tangente.',
            takeaway:
              'La derivada de la pérdida en un peso es la pendiente de la tangente: el límite de las secantes. Es la cantidad que una red calcula para cada peso en cada paso.',
          },
          graph: {
            ...LOSS_WINDOW,
            snap: 0.1,
            curve: LOSS,
            points: [
              { id: 'p', label: 'P', x: 3, movable: false, onCurve: true },
              { id: 'q', label: 'Q', x: 5, movable: true, onCurve: true },
            ],
            readouts: ['secant', 'slope'],
            pair: ['p', 'q'],
            labels: LOSS_LABELS,
          },
          goals: [{ metric: 'secant', of: ['p', 'q'], target: 2, tol: 0.1 }],
        },
        {
          id: 'derivada-pendiente.ex00.2',
          type: 'curva',
          prompt:
            'Es la misma curva y el mismo P. Ahora Q viene por la **izquierda** de P. Acércalo, sin pasar de P, hasta que la secante quede a $0{,}1$ o menos de la tangente. ¿A qué pendiente se acerca?',
          hints: [
            'Mueve Q hacia P por la izquierda y mira el número de la secante.',
            'Compáralo con lo que viste desde la derecha: ¿es la misma tangente?',
          ],
          explain:
            'Se llegue a P por un lado o por el otro, la secante se pega a la misma tangente: la derivada no depende del lado por el que te acerques.',
          solution:
            'Con Q en $w=2{,}9$ la secante vale $1{,}9$, a $0{,}1$ de la tangente. Desde la izquierda la secante queda por debajo de la tangente (en la pregunta anterior, por encima), y las dos tienden a $2$.',
          purpose: {
            why: 'Al probar un peso un poco menor o un poco mayor, una red obtiene pendientes algo distintas. Que las dos se acerquen al mismo valor es lo que hace útil la derivada como brújula.',
            aim: 'Acercas Q a P desde el lado contrario y ves que la secante se pega a la misma tangente que antes.',
            takeaway:
              'La derivada de una curva suave es un solo número en cada punto: dé igual por qué lado te acerques, la tangente es la misma.',
          },
          graph: {
            ...LOSS_WINDOW,
            snap: 0.1,
            curve: LOSS,
            points: [
              { id: 'p', label: 'P', x: 3, movable: false, onCurve: true },
              { id: 'q', label: 'Q', x: 1, movable: true, onCurve: true },
            ],
            readouts: ['secant', 'slope'],
            pair: ['p', 'q'],
            labels: LOSS_LABELS,
          },
          goals: [
            { metric: 'secant', of: ['p', 'q'], target: 2, tol: 0.1 },
            { metric: 'x', of: ['q'], target: 2.5, tol: 0.5 },
          ],
        },
        {
          id: 'derivada-pendiente.ex00.3',
          type: 'curva',
          prompt:
            'Una tangente **horizontal** es una pendiente $0$. Mueve P por la pérdida hasta que la pendiente valga $0$ y mira dónde está P: ¿en qué parte de la curva?',
          hints: [
            'Mira la lectura de la pendiente mientras arrastras P: ¿pasa de negativa a positiva?',
            'La tangente deja de subir o bajar justo cuando cambia de un signo al otro.',
          ],
          explain:
            'La pendiente vale $0$ en el fondo del valle: ahí la pérdida deja de bajar y empieza a subir, y la tangente es horizontal. Donde la pendiente es cero, no hay cuesta que seguir.',
          solution:
            'En $w=2$ la pendiente es $0$ y la pérdida vale $0$: el fondo de la curva. A la izquierda la pendiente es negativa; a la derecha, positiva.',
          purpose: {
            why: 'Una red que entrena baja por la curva de su pérdida y se detiene cuando ya no hay cuesta. Ese lugar es el que se busca: dónde la pendiente es cero.',
            aim: 'Arrastras P hasta que la tangente queda horizontal y ves en qué parte de la curva ocurre.',
            takeaway:
              'Pendiente cero significa tangente horizontal: aquí, el fondo. Entrenar es acercarse a ese punto, y la pendiente avisa de cuándo se ha llegado.',
          },
          graph: {
            ...LOSS_WINDOW,
            snap: 0.1,
            curve: LOSS,
            points: [{ id: 'p', label: 'P', x: 0.5, movable: true, onCurve: true }],
            readouts: ['coords', 'slope'],
            labels: LOSS_LABELS,
          },
          goals: [{ metric: 'slope', of: ['p'], target: 0, tol: 0.01 }],
        },
        {
          id: 'derivada-pendiente.ex00.4',
          type: 'curva',
          prompt:
            'Cuanto más lejos del fondo, más empinada es la curva. Mueve P hasta un $w$ donde la pendiente de la tangente valga $3$, y fíjate en cuánto se aleja P del fondo.',
          hints: [
            'En el fondo la pendiente es $0$ y crece al alejarte. Prueba hacia la derecha.',
            'Mira el número de la pendiente: sube a saltos de $0{,}2$ cada vez que mueves P un paso de la rejilla.',
          ],
          explain:
            'La pendiente crece al alejarte del fondo: cuanto más lejos, más deprisa sube la pérdida. Un paso de la rejilla ($0{,}1$) cambia la pendiente en $0{,}2$.',
          solution:
            'En $w=3{,}5$ la pendiente vale $3$. Está a $1{,}5$ del fondo ($w=2$): la pendiente vale $2$ por cada unidad de distancia al fondo. A la izquierda del fondo, la pendiente $-3$ cae en $w=0{,}5$.',
          purpose: {
            why: 'La pendiente de la pérdida dice cuánto se equivoca de rumbo un peso: grande, está lejos de su valor bueno; casi cero, está cerca.',
            aim: 'Colocas P donde la pendiente vale lo que se pide y ves a qué distancia del fondo queda.',
            takeaway:
              'Cuanto más lejos del fondo, mayor es la pendiente. Por eso los pasos de descenso, que se calculan con ella, son grandes al principio y se encogen al acercarse al fondo.',
          },
          graph: {
            ...LOSS_WINDOW,
            snap: 0.1,
            curve: LOSS,
            points: [{ id: 'p', label: 'P', x: 0.5, movable: true, onCurve: true }],
            readouts: ['coords', 'slope'],
            labels: LOSS_LABELS,
          },
          goals: [{ metric: 'slope', of: ['p'], target: 3, tol: 0.01 }],
        },
        {
          id: 'derivada-pendiente.ex00.5',
          type: 'curva',
          prompt:
            'Esta curva es un paisaje de pérdida con una colina y un valle: hay **dos** sitios de pendiente $0$. Coloca A en la cima de la colina y B en el fondo del valle. Los dos tienen tangente horizontal; los distingue su altura.',
          hints: [
            'Mueve A y B hasta que sus pendientes valgan $0$. Hay dos sitios: uno a cada lado del centro.',
            'La cima es el sitio de pendiente $0$ más alto y el valle, el más bajo: mira la altura de cada punto.',
          ],
          explain:
            'Pendiente $0$ no basta para saber dónde se está: la cima y el fondo tienen tangente horizontal. Hay que mirar también la altura, o cómo cambia la pendiente a cada lado.',
          solution:
            'A en $w=-1$ (altura $2$, la cima) y B en $w=1$ (altura $-2$, el fondo). Las dos tangentes son horizontales, pero a un lado de la cima la curva sube y al otro baja, al revés que en el fondo.',
          purpose: {
            why: 'La pérdida de una red de verdad tiene muchos valles y colinas. El descenso se detiene en cualquier sitio de pendiente cero, sea el fondo más bajo o solo uno cualquiera.',
            aim: 'Buscas los dos puntos de pendiente cero de una curva y los distingues por su altura.',
            takeaway:
              'Pendiente cero es una condición necesaria para un mínimo, no suficiente: también la cumplen las cimas. Es la antesala de los mínimos locales y globales.',
          },
          graph: {
            x: [-2, 2],
            y: [-3, 3],
            snap: 0.1,
            curve: { kind: 'poly', coefs: [0, -3, 0, 1] },
            points: [
              { id: 'a', label: 'A', x: 0.5, movable: true, onCurve: true },
              { id: 'b', label: 'B', x: -0.5, movable: true, onCurve: true },
            ],
            readouts: ['coords', 'slope'],
            labels: LOSS_LABELS,
          },
          goals: [
            { metric: 'slope', of: ['a'], target: 0, tol: 0.01 },
            { metric: 'fx', of: ['a'], target: 2, tol: 0.05 },
            { metric: 'slope', of: ['b'], target: 0, tol: 0.01 },
            { metric: 'fx', of: ['b'], target: -2, tol: 0.05 },
          ],
        },
      ],
    },
    {
      kind: 'calcular',
      questions: [
        {
          id: 'derivada-pendiente.ex01.1',
          type: 'numero',
          prompt:
            'La figura es la pérdida de un modelo según su peso $w$. La recta que une P y Q es una secante. ¿Cuál es su pendiente? Lee las coordenadas de P y de Q en el panel.',
          hints: [
            'Resta las alturas y las posiciones de Q y de P, en el mismo orden.',
            'La pendiente de la secante es lo que cambia la pérdida dividido entre lo que cambia $w$.',
          ],
          explain:
            'La pendiente de una secante es la subida entre el avance: $\\dfrac{L(q)-L(p)}{q-p}$. Es la tasa de cambio media de la pérdida entre los dos pesos.',
          solution:
            'De P $(1;\\,2)$ a Q $(4;\\,11)$ la pérdida sube $9$ en un avance de $3$: la pendiente es $\\dfrac{9}{3}=3$. Entre esos dos pesos la pérdida sube $3$ por cada unidad de $w$.',
          answer: 3,
          tol: 0,
          purpose: {
            why: 'Para saber si un cambio de peso ayuda, se compara la pérdida antes y después. Esa comparación, dividida entre cuánto se movió el peso, es la pendiente de la secante.',
            aim: 'Lees dos puntos de la pérdida y calculas la pendiente de la recta que los une.',
            takeaway:
              'Una secante da la tasa de cambio media entre dos pesos. Cuanto más juntos están los dos, más se parece a la pendiente exacta en ese lugar: la derivada.',
          },
          graph: {
            x: [0, 4.5],
            y: [0, 15],
            snap: 0.5,
            curve: { kind: 'poly', coefs: [3, -2, 1] },
            points: [
              { id: 'p', label: 'P', x: 1, movable: false, onCurve: true },
              { id: 'q', label: 'Q', x: 4, movable: false, onCurve: true },
            ],
            readouts: ['coords'],
            labels: LOSS_LABELS,
          },
        },
        {
          id: 'derivada-pendiente.ex01.2',
          type: 'numero',
          prompt:
            'La pérdida es $L(w)=w^2$. Calcula la pendiente de la secante entre $w=3$ y $w=3{,}01$, es decir, $\\dfrac{L(w_2)-L(w_1)}{w_2-w_1}$ con $w_1=3$ y $w_2=3{,}01$. Con una distancia tan pequeña, el resultado es casi la derivada en $w=3$.',
          hints: [
            'Calcula $3{,}01^2$ y réstale $3^2$. Después divide entre $0{,}01$.',
            '$3{,}01^2=9{,}0601$, y $3^2=9$.',
          ],
          explain:
            'Con una distancia de $0{,}01$ la secante ya es casi la tangente: la pendiente exacta en $w=3$ queda muy cerca de lo que sale aquí.',
          solution:
            'Con $w=3{,}01$ la pérdida vale $9{,}0601$ y con $w=3$, $9$: la pérdida sube $0{,}0601$ en un avance de $0{,}01$, y la pendiente es $\\dfrac{0{,}0601}{0{,}01}=6{,}01$. La derivada en $w=3$ es $6$.',
          answer: 6.01,
          tol: 0.005,
          purpose: {
            why: 'Cuando no hay una fórmula para la derivada, se estima a mano: se mueve el peso una cantidad diminuta y se mide cuánto cambia la pérdida. Así se comprueban los gradientes de una red.',
            aim: 'Calculas una secante con un avance de $0{,}01$ y ves que su pendiente ya es casi la derivada.',
            takeaway:
              'Una secante muy corta da la derivada casi exacta: aquí $6{,}01$ frente a $6$. Es la derivada numérica, y se programa en el ejercicio siguiente.',
          },
        },
        {
          id: 'derivada-pendiente.ex01.3',
          type: 'opcion',
          prompt:
            'La figura es una pérdida con tres pesos marcados: A, B y C. Sin calcular nada, mira cómo va la curva en cada uno. ¿Qué signo tiene la pendiente de la tangente en A, en B y en C?',
          hints: [
            'Una pendiente es positiva si la curva sube hacia la derecha, negativa si baja y cero si no sube ni baja.',
            'Recorre la curva de izquierda a derecha: A está en el tramo que baja y C, en el que sube.',
          ],
          explain:
            'La pendiente es positiva donde la curva sube hacia la derecha, negativa donde baja y cero en el fondo, donde cambia de bajar a subir.',
          solution:
            'En A la curva baja hacia la derecha: pendiente negativa. B está en el fondo: pendiente cero. En C la curva sube: pendiente positiva.',
          purpose: {
            why: 'El signo de la pendiente es lo primero que mira un entrenamiento: dice si subir un peso aumenta o reduce la pérdida, y por tanto hacia dónde moverlo.',
            aim: 'Lees en la figura el signo de la pendiente en tres puntos, sin calcular.',
            takeaway:
              'Pendiente negativa: bajar hacia la derecha; cero: el fondo; positiva: subir hacia la derecha. La actualización de pesos va siempre al lado contrario de la pendiente.',
          },
          options: [
            'A negativa, B cero y C positiva',
            'A positiva, B cero y C negativa',
            'A negativa, B negativa y C positiva',
            'Las tres son positivas, porque la pérdida nunca es negativa',
          ],
          correct: 0,
          graph: {
            x: [0, 6],
            y: [0, 11],
            snap: 0.5,
            curve: { kind: 'poly', coefs: [10, -6, 1] },
            points: [
              { id: 'a', label: 'A', x: 1, movable: false, onCurve: true },
              { id: 'b', label: 'B', x: 3, movable: false, onCurve: true },
              { id: 'c', label: 'C', x: 4.5, movable: false, onCurve: true },
            ],
            readouts: ['coords'],
            labels: LOSS_LABELS,
          },
        },
        {
          id: 'derivada-pendiente.ex01.4',
          type: 'numero',
          prompt:
            "En el peso P de la figura la pendiente de la pérdida vale $L'(w)=4$ (es la de la tangente). Si subes $w$ un poquito, $0{,}1$, ¿en cuánto cambia la pérdida, más o menos? Usa la pendiente como tasa de cambio.",
          hints: [
            'La pendiente dice cuánto cambia la pérdida por cada unidad que se mueve $w$.',
            'Para un movimiento pequeño, multiplica la pendiente por lo que mueves $w$.',
          ],
          explain:
            "Para un cambio pequeño, la pérdida cambia más o menos la pendiente por lo que cambia $w$: $\\Delta L\\approx L'(w)\\,\\Delta w$. Es una aproximación lineal, por la tangente.",
          solution:
            '$\\Delta L\\approx 4\\times 0{,}1=0{,}4$: la pérdida sube unos $0{,}4$. El valor exacto es $0{,}41$: la curva se separa un poco de su tangente.',
          answer: 0.4,
          tol: 0.05,
          purpose: {
            why: 'Una red usa la derivada para predecir qué pasará con la pérdida antes de mover un peso: el cambio es, más o menos, la pendiente por el movimiento.',
            aim: 'Aplicas la pendiente como tasa de cambio para calcular el cambio de la pérdida ante un movimiento pequeño.',
            takeaway:
              'Cambio de pérdida $\\approx$ pendiente $\\times$ cambio de peso. Es la aproximación lineal, y la razón de que los pasos de descenso sean pequeños.',
          },
          graph: {
            ...LOSS_WINDOW,
            snap: 0.5,
            curve: LOSS,
            points: [{ id: 'p', label: 'P', x: 4, movable: false, onCurve: true }],
            readouts: ['coords'],
            labels: LOSS_LABELS,
            tangent: true,
          },
        },
        {
          id: 'derivada-pendiente.ex01.5',
          type: 'numero',
          prompt:
            'En P $(2;\\,5)$ de la figura, la tangente tiene pendiente $4$. La tangente es una recta $y=m\\,x+b$. ¿Cuánto vale $b$, la altura a la que corta el eje vertical?',
          hints: [
            'La recta pasa por P y tiene pendiente $m=4$: sustituye $x=2$ e $y=5$ en $y=m\\,x+b$.',
            'Despeja $b$: $b=5-4\\cdot 2$.',
          ],
          explain:
            'La recta tangente es $y=L(w_0)+m\\,(x-w_0)$. Su ordenada en el origen es $b=L(w_0)-m\\,w_0$: la altura en el punto, menos lo que sube la pendiente hasta el eje.',
          solution:
            'Con $m=4$ y P $(2;\\,5)$: $5=4\\cdot 2+b$, luego $b=5-8=-3$. La tangente es $y=4x-3$, y corta el eje vertical por debajo del origen.',
          answer: -3,
          tol: 0,
          purpose: {
            why: 'La tangente es el modelo lineal de la pérdida alrededor de un peso: lo que una red cree que pasará si se mueve poco. Su pendiente es la derivada y su altura, la pérdida actual.',
            aim: 'Calculas la ecuación de la tangente en un punto a partir de su pendiente y de la altura de la curva ahí.',
            takeaway:
              'La tangente $y=L(w_0)+m\\,(x-w_0)$ resume la curva cerca de $w_0$ con dos números: la pérdida y su pendiente.',
          },
          graph: {
            x: [-1, 4],
            y: [-5, 10],
            snap: 0.5,
            curve: { kind: 'poly', coefs: [1, 0, 1] },
            points: [{ id: 'p', label: 'P', x: 2, movable: false, onCurve: true }],
            readouts: ['coords'],
          },
        },
      ],
    },
    {
      kind: 'programar',
      questions: [
        {
          id: 'derivada-pendiente.ex02.1',
          type: 'codigo',
          prompt:
            'Escribe la función `pendiente_secante(f, a, b)`: recibe una función `f` y dos números `a` y `b`, y devuelve la pendiente de la secante entre `a` y `b`: lo que cambia `f` entre los dos puntos dividido entre lo que avanza la `x`. Se prueba con varias funciones y con `a` mayor que `b`.',
          hints: [
            'El plan son tres líneas dentro de la función. La subida: `f(b)` menos `f(a)`. El avance: `b` menos `a`. Y `return` de la subida entre el avance. Un error típico: restar en un orden la subida y en otro el avance, que da el signo cambiado.',
            'Las piezas, con otra función:\n\n' +
              py(
                'g = lambda x: x ** 2',
                'print(g(3))                # 9: así se usa una función que te dan',
                'print(g(3) - g(1))         # 8: la subida de 1 a 3',
                'print(3 - 1)               # 2: el avance, en el mismo orden',
                'print(8 / 2)               # 4.0: la subida entre el avance',
              ) +
              '\n\nEn una función todo lo de dentro lleva 4 espacios de sangría, y lo que devuelve va con `return`.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def pendiente_secante(f, a, b):',
                '    subida = f(___) - f(a)',
                '    avance = b - ___',
                '    return subida / ___',
              ) +
              '\n\nLa subida va de `a` a `b`: `f(b)` menos `f(a)`. El avance, en el mismo orden: `b` menos `a`.',
          ],
          explain:
            'La secante entre dos puntos de una curva es la recta que los une, y su pendiente es la subida entre el avance. Lo nuevo es que `f` llega como argumento: se usa como cualquier función, `f(a)`.',
          solution:
            'Se calcula la subida, `f(b) - f(a)`, y el avance, `b - a`, y se devuelve el cociente. Con `x ** 2` entre $1$ y $3$ sale $\\dfrac{8}{2}=4$. Si `a` es mayor que `b`, sale lo mismo: cambian los dos signos.',
          requirements: [
            '`pendiente_secante` es una función con tres parámetros: una función `f` y dos números `a` y `b`. Devuelve un número.',
            'Se llama con varias funciones (de segundo grado, rectas y constantes) y con `a` mayor y menor que `b`; no debe dar error.',
            'El número que devuelve es lo que cambia `f` entre `a` y `b` dividido entre lo que cambia `x`, con el signo correcto.',
          ],
          starter: `import numpy as np


# Aquí no hay datos hechos: la función recibe f, a y b. Las comprobaciones la llaman con varias
# funciones, y a veces con a mayor que b.

def pendiente_secante(f, a, b):
    # f es una función: f(a) es lo que vale f en a. Todo lo de dentro lleva 4 espacios delante.

    # PASO 1. La subida: cuánto cambia f al ir de a a b.
    # Por qué: la pendiente de la secante es cuánto sube la curva entre los dos puntos.
    # Es f(b) menos f(a). Con otra función, g = lambda x: x ** 2, y a = 1, b = 3, sube g(3) - g(1) = 9 - 1 = 8.

    # PASO 2. El avance: cuánto cambia la x en el mismo recorrido, de a a b.
    # Por qué: la pendiente es la subida POR cada paso a la derecha. Resta en el mismo orden que antes
    # (b menos a), o el signo sale al revés. Con a = 1 y b = 3, el avance es 3 - 1 = 2.

    # PASO 3. Devolver la subida dividida entre el avance, con return.
    # Con esos números: 8 / 2 = 4, la pendiente de la secante de g entre 1 y 3.
    return None

# Para probarla antes de entregar: llama a pendiente_secante(lambda x: x ** 2, 1, 3), imprime el resultado
# con print(...) y pulsa «Ejecutar».
`,
          checks: `import numbers
_casos = [(lambda x: x ** 2, 1, 3, 4), (lambda x: 3 * x + 1, 0, 5, 3), (lambda x: x ** 3, 1, 2, 7), (lambda x: x ** 2, 3, 1, 4), (lambda x: 5, 0, 2, 0), (lambda x: 2 - x, 1, 4, -1)]
_f = callable(globals().get("pendiente_secante"))
def _try(f, a, b):
    try:
        return pendiente_secante(f, a, b)
    except Exception:
        return None
_got = [_try(f, a, b) for f, a, b, _e in _casos] if _f else []
_run = _f and all(g is not None for g in _got)
_num = _run and all(isinstance(g, numbers.Real) and not isinstance(g, bool) and g == g for g in _got)
_ok = _num and all(abs(g - e) < 1e-9 for g, (_g, _a, _b, e) in zip(_got, _casos))
_sign = _num and (not _ok) and all(abs(g + e) < 1e-9 for g, (_g, _a, _b, e) in zip(_got, _casos))
_inv = _f and all(g is not None and isinstance(g, numbers.Real) and abs(g - 1 / e) < 1e-9 for g, (_g, _a, _b, e) in zip(_got, _casos) if e != 0)
_nodiv = _num and all(abs(g - (f(b) - f(a))) < 1e-9 for g, (f, a, b, _e) in zip(_got, _casos))
check(_f, "Hay que definir una función \`pendiente_secante\` con los parámetros \`f\`, \`a\` y \`b\`.")
check((not _f) or _run or _inv, "\`pendiente_secante\` da un error con alguna función, o devuelve \`None\`. Tiene que terminar con \`return\` y el resultado.")
check((not _run) or _num, "\`pendiente_secante\` tiene que devolver un número: la subida dividida entre el avance.")
check((not _num) or not _nodiv, "\`pendiente_secante\` devuelve solo la subida. Falta dividir entre el avance, \`b - a\`.")
check(not _inv, "\`pendiente_secante\` está al revés: has dividido el avance entre la subida. La pendiente es la subida entre el avance.")
check((not _num) or _ok or not _sign, "\`pendiente_secante\` sale con el signo cambiado. Resta en el mismo orden la subida y el avance: la de \`b\` menos la de \`a\` en las dos.")
check((not _num) or _ok or _sign or _nodiv, "\`pendiente_secante\` no da la subida entre el avance. La subida es \`f(b) - f(a)\` y el avance, \`b - a\`.")
`,
          reference:
            'import numpy as np\n\n\ndef pendiente_secante(f, a, b):\n    return (f(b) - f(a)) / (b - a)\n',
        },
        {
          id: 'derivada-pendiente.ex02.2',
          type: 'codigo',
          prompt:
            'Escribe `derivada(f, x, h)`: la derivada **numérica** de `f` en `x`, que es la pendiente de la secante entre `x` y `x + h`. Cuanto menor sea `h`, más se parece a la derivada exacta. Se prueba con varias funciones y varios `h`.',
          hints: [
            'El plan son dos líneas. El cambio de `f` al avanzar `h` desde `x`: `f(x + h)` menos `f(x)`. Y `return` de ese cambio dividido entre `h`. Un error típico: partir hacia atrás, con `x - h`, o dividir entre `x` en vez de entre `h`.',
            'Las piezas, con otra función:\n\n' +
              py(
                'g = lambda t: t ** 2',
                'print(g(2 + 0.1))          # 4.41: la función un poco más a la derecha',
                'print(g(2 + 0.1) - g(2))   # 0.41: cuánto cambia (con algún decimal de ruido)',
                'print(0.41 / 0.1)          # 4.1: ese cambio entre h, cerca de la derivada 4',
              ) +
              '\n\nEl `h` es el paso: lo que te dan, no una cifra que debas escribir tú.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'def derivada(f, x, h):',
                '    cambio = f(x + ___) - f(___)',
                '    return cambio / ___',
              ) +
              '\n\nLos tres huecos son `h`, `x` y `h`, aunque no en ese orden.',
          ],
          explain:
            'La derivada numérica es la secante entre `x` y un punto muy cercano, `x + h`. No es exacta, pero con `h` pequeño se acerca mucho: así se comprueba el gradiente que calcula una red.',
          solution:
            'Se calcula `f(x + h) - f(x)` y se divide entre `h`. Con `x ** 2` en $3$ y $h=0{,}1$ sale $6{,}1$, y con $h=0{,}001$, $6{,}001$: se acerca a la derivada exacta, $6$.',
          requirements: [
            '`derivada` es una función con tres parámetros: una función `f`, un número `x` y un paso `h`. Devuelve un número.',
            'Se llama con varias funciones y varios pasos `h`, grandes y pequeños; el resultado cambia con `h`.',
            'El número es la pendiente de la secante entre `x` y el punto que queda `h` a su derecha.',
          ],
          starter: `import numpy as np


# Aquí no hay datos hechos: la función recibe f, x y h. Las comprobaciones la llaman con varias funciones
# y varios pasos h.

def derivada(f, x, h):
    # f es una función, x el punto donde se mide y h el paso: lo que te alejas de x hacia la derecha.

    # PASO 1. El cambio de f al dar el paso: f en el punto de la derecha menos f en x.
    # Por qué: es la subida de la secante entre x y x + h.
    # Con otra función, g = lambda t: t ** 2, en x = 2 y h = 0.1: g(2 + 0.1) - g(2) = 4.41 - 4 = 0.41.

    # PASO 2. Devolver ese cambio dividido entre h, con return.
    # Por qué: dividir entre el avance da la pendiente. Con esos números: 0.41 / 0.1 = 4.1, cerca de la
    # derivada exacta de g en 2, que es 4.
    return None

# Para probarla antes de entregar: llama a derivada(lambda t: t ** 2, 3, 0.1), imprime el resultado con
# print(...) y pulsa «Ejecutar».
`,
          checks: `import numbers
_casos = [(lambda t: t ** 2, 3, 0.1), (lambda t: t ** 2, 3, 0.001), (lambda t: t ** 3, 2, 0.01), (lambda t: 4 * t + 1, 5, 0.5), (lambda t: t ** 2, 0, 0.1), (lambda t: 7, 2, 0.1)]
_f = callable(globals().get("derivada"))
def _try(f, x, h):
    try:
        return derivada(f, x, h)
    except Exception:
        return None
_got = [_try(f, x, h) for f, x, h in _casos] if _f else []
_run = _f and all(g is not None for g in _got)
_num = _run and all(isinstance(g, numbers.Real) and not isinstance(g, bool) and g == g for g in _got)
_ok = _num and all(abs(g - (f(x + h) - f(x)) / h) < 1e-6 for g, (f, x, h) in zip(_got, _casos))
_cen = _num and all(abs(g - (f(x + h) - f(x - h)) / (2 * h)) < 1e-6 for g, (f, x, h) in zip(_got, _casos))
_atras = _num and all(abs(g - (f(x) - f(x - h)) / h) < 1e-6 for g, (f, x, h) in zip(_got, _casos))
_nodiv = _num and all(abs(g - (f(x + h) - f(x))) < 1e-6 for g, (f, x, h) in zip(_got, _casos))
_divx = _num and all(abs(g - (f(x + h) - f(x)) / x) < 1e-6 for g, (f, x, h) in zip(_got, _casos) if x != 0)
check(_f, "Hay que definir una función \`derivada\` con los parámetros \`f\`, \`x\` y \`h\`.")
check((not _f) or _run, "\`derivada\` da un error con alguna función, o devuelve \`None\`. Tiene que terminar con \`return\` y el resultado.")
check((not _run) or _num, "\`derivada\` tiene que devolver un número: el cambio de \`f\` dividido entre el paso.")
check((not _num) or not _nodiv, "\`derivada\` devuelve solo el cambio de \`f\`. Falta dividir entre el paso \`h\`.")
check((not _num) or not _divx, "\`derivada\` divide entre \`x\` y no entre \`h\`. La pendiente de la secante es el cambio entre lo que avanza la \`x\`, que es \`h\`.")
check((not _num) or not _atras, "\`derivada\` parte hacia atrás, con \`x - h\`. Aquí la secante es entre \`x\` y \`x + h\`, hacia la derecha.")
check((not _num) or not _cen, "\`derivada\` usa la secante centrada, entre \`x - h\` y \`x + h\`. Aquí se pide la de hacia delante: entre \`x\` y \`x + h\`.")
check((not _num) or _ok or _nodiv or _divx or _atras or _cen, "\`derivada\` no da la pendiente de la secante entre \`x\` y \`x + h\`: el cambio es \`f(x + h) - f(x)\` y se divide entre \`h\`.")
`,
          reference:
            'import numpy as np\n\n\ndef derivada(f, x, h):\n    return (f(x + h) - f(x)) / h\n',
        },
        {
          id: 'derivada-pendiente.ex02.3',
          type: 'codigo',
          prompt:
            'Ya tienes `f`, el punto `x0`, la derivada exacta `exacta` y varios pasos `hs`, y la estimación `delante` (hacia delante) calculada. Guarda en `centrada` la diferencia **centrada** para todos los `hs` a la vez, y en `err_delante` y `err_centrada` el error absoluto de cada estimación frente a `exacta`. La figura ya está hecha.',
          hints: [
            'El plan son tres líneas. `centrada`: `f(x0 + hs)` menos `f(x0 - hs)`, dividido entre `2 * hs`; NumPy lo hace para todos los `hs` a la vez. Los errores: `np.abs` de la estimación menos `exacta`. Un error típico: olvidar el `2` al dividir, que duplica el resultado.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'g = lambda t: t ** 2',
                'pasos = np.array([0.5, 0.1])',
                'print(g(1 + pasos))                         # [2.25 1.21]: g en varios puntos a la vez',
                'print((g(1 + pasos) - g(1 - pasos)) / (2 * pasos))   # [2. 2.]: la diferencia centrada',
                'print(np.abs(np.array([2.1, 1.9]) - 2))     # [0.1 0.1]: el error, siempre positivo',
              ) +
              '\n\nCon `np.abs` el error es un tamaño, nunca negativo.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'centrada = (f(x0 + hs) - f(x0 - ___)) / (___ * hs)',
                'err_delante = np.abs(___ - exacta)',
                'err_centrada = np.abs(centrada - ___)',
              ) +
              '\n\nLos huecos de la primera línea son `hs` y `2`; los demás, la estimación hacia delante y `exacta`.',
          ],
          explain:
            'La diferencia centrada mira a los dos lados de `x0`, y los errores de cada lado se compensan: con $h$ diez veces menor, su error es cien veces menor, y el de hacia delante, solo diez. Compáralo en la figura.',
          solution:
            'La centrada es `(f(x0 + hs) - f(x0 - hs)) / (2 * hs)`. Los errores son `np.abs(estimación - exacta)`. Con $h=0{,}1$ el error de hacia delante es $0{,}61$ y el de la centrada, $0{,}01$.',
          requirements: [
            '`centrada` existe y es un array de NumPy con 3 números, uno por cada paso de `hs` y en su mismo orden.',
            '`err_delante` y `err_centrada` existen y son arrays de NumPy con 3 números cada uno: el error de cada estimación, sin signo.',
            'Los errores son los de las estimaciones de `delante` y de `centrada`, frente a la derivada exacta.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt

# f es la función, x0 el punto, exacta la derivada exacta en x0 y hs los pasos que se prueban, del grande
# al pequeño. delante es la estimación hacia delante, una por paso. Ya están hechos: no hace falta tocarlos.
f = lambda x: x ** 3
x0 = 2.0
exacta = 12.0
hs = np.array([0.1, 0.01, 0.001])
delante = (f(x0 + hs) - f(x0)) / hs

# PASO 1. centrada: la estimación centrada para cada paso de hs, un número por paso.
# Qué: la pendiente de la secante entre x0 - h y x0 + h: (f(x0 + h) - f(x0 - h)) / (2 * h).
# Por qué: mira a los dos lados de x0, y los errores de cada lado se compensan.
# Cómo: NumPy opera con todo el array hs a la vez, sin bucle. Cuidado con el 2 de 2 * hs: es la distancia
# entre los dos puntos. Con g = lambda t: t ** 2 en 1 y pasos [0.5, 0.1], sale [2. 2.].
centrada = None

# PASO 2. err_delante: cuánto se equivoca delante, un número por paso.
# Qué: el valor absoluto de la estimación menos exacta, con np.abs(...).
# Por qué: el error es un tamaño: no importa si te pasas o te quedas corto. Con [2.1, 1.9] y exacta 2, sale [0.1 0.1].
err_delante = None

# PASO 3. err_centrada: lo mismo para la estimación centrada.
err_centrada = None

# Ya está hecha: no hace falta tocarla. Dibuja los dos errores frente al paso h, en escala logarítmica,
# cuando los tres números de arriba están hechos. El error centrado cae mucho más deprisa.
if err_delante is not None and err_centrada is not None:
    plt.loglog(hs, err_delante, "o-", label="hacia delante")
    plt.loglog(hs, err_centrada, "o-", label="centrada")
    plt.xlabel("paso h")
    plt.ylabel("error")
    plt.legend()
    plt.title("Error de la derivada numérica de x^3 en x = 2")

# Para ver qué vale algo antes de entregar: print(centrada) o print(err_centrada) y pulsa «Ejecutar».
`,
          checks: `_f = lambda x: x ** 3
_hs = np.array([0.1, 0.01, 0.001])
_exacta = 12.0
_del = (_f(2.0 + _hs) - _f(2.0)) / _hs
_cen = (_f(2.0 + _hs) - _f(2.0 - _hs)) / (2 * _hs)
_ed = np.abs(_del - _exacta)
_ec = np.abs(_cen - _exacta)
def _arr(v):
    try:
        a = np.asarray(v, dtype=float)
    except Exception:
        return None
    return a if a.shape == (3,) and bool(np.all(np.isfinite(a))) else None
_c, _d, _e = _arr(centrada), _arr(err_delante), _arr(err_centrada)
_cok = _c is not None and bool(np.allclose(_c, _cen, rtol=1e-6, atol=1e-9))
_cdoble = _c is not None and bool(np.allclose(_c, 2 * _cen, rtol=1e-6, atol=1e-9))
_dok = _d is not None and bool(np.allclose(_d, _ed, rtol=1e-4, atol=1e-9))
_eok = _e is not None and bool(np.allclose(_e, _ec, rtol=1e-3, atol=1e-8))
_dneg = _d is not None and bool(np.allclose(_d, -_ed, rtol=1e-4, atol=1e-9))
_eneg = _e is not None and bool(np.allclose(_e, -_ec, rtol=1e-3, atol=1e-8))
_edel = _e is not None and bool(np.allclose(_e, _ed, rtol=1e-3, atol=1e-8))
check(_c is not None, "\`centrada\` tiene que ser un array de NumPy con 3 números: una estimación por cada paso de \`hs\`.")
check((_c is None) or _cok or not _cdoble, "\`centrada\` sale el doble de grande: falta el \`2\` del denominador. La distancia entre \`x0 - h\` y \`x0 + h\` es \`2 * h\`.")
check((_c is None) or _cok or _cdoble, "\`centrada\` no es la pendiente de la secante entre \`x0 - h\` y \`x0 + h\`: \`(f(x0 + hs) - f(x0 - hs)) / (2 * hs)\`.")
check(_d is not None, "\`err_delante\` tiene que ser un array de NumPy con 3 números: un error por cada paso de \`hs\`.")
check((_d is None) or not _dneg, "\`err_delante\` sale negativo: el error es un tamaño. Usa \`np.abs(...)\`, o resta en el otro orden.")
check((_d is None) or _dok or _dneg, "\`err_delante\` no es el error de la estimación hacia delante: \`np.abs(delante - exacta)\`.")
check(_e is not None, "\`err_centrada\` tiene que ser un array de NumPy con 3 números: un error por cada paso de \`hs\`.")
check((_e is None) or not _eneg, "\`err_centrada\` sale negativo: el error es un tamaño. Usa \`np.abs(...)\`.")
check((_e is None) or not _edel or _eok, "\`err_centrada\` es el error de la estimación hacia delante. Tiene que salir de \`centrada\`.")
check((_e is None) or _eok or _eneg or _edel, "\`err_centrada\` no es el error de la estimación centrada: \`np.abs(centrada - exacta)\`.")
`,
          reference:
            'import numpy as np\n\nf = lambda x: x ** 3\nx0 = 2.0\nexacta = 12.0\nhs = np.array([0.1, 0.01, 0.001])\ndelante = (f(x0 + hs) - f(x0)) / hs\n\ncentrada = (f(x0 + hs) - f(x0 - hs)) / (2 * hs)\nerr_delante = np.abs(delante - exacta)\nerr_centrada = np.abs(centrada - exacta)\n',
        },
        {
          id: 'derivada-pendiente.ex02.4',
          type: 'codigo',
          prompt:
            'Es la **comprobación de gradiente**. Ya tienes los datos `x` e `y`, `w` y `perdida(w)`. Guarda en `numerica` la derivada numérica centrada de `perdida` en `w`, en `exacta` la derivada de la fórmula ($\\text{media de }2\\,x\\,(w\\,x-y)$) y en `coincide` si las dos casi coinciden (`True` o `False`).',
          hints: [
            'El plan son tres líneas. `numerica`: `perdida(w + h)` menos `perdida(w - h)`, entre `2 * h`. `exacta`: la media, con `np.mean`, de `2 * x * (w * x - y)`. `coincide`: `np.isclose` de las dos. Un error típico: olvidar el factor `x` de la fórmula, y `coincide` sale `False`.',
            'Las piezas, con otros datos:\n\n' +
              py(
                'a = np.array([1, 2])',
                'b = np.array([3, 3])',
                'print(2 * a * (1 * a - b))             # [-4 -4]: un término por dato',
                'print(np.mean(2 * a * (1 * a - b)))    # -4.0: su media',
                'print(np.isclose(-4.0, -4.0000001))    # True: casi iguales',
              ) +
              '\n\n`np.isclose` compara con un margen pequeño: dos decimales distintos en el último lugar siguen siendo «iguales».',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py(
                'numerica = (perdida(w + h) - perdida(w - ___)) / (2 * ___)',
                'exacta = np.mean(2 * ___ * (w * x - y))',
                'coincide = bool(np.isclose(numerica, ___))',
              ) +
              '\n\nLos huecos de la primera línea son `h` los dos. El de la segunda es `x`; el de la tercera, `exacta`.',
          ],
          explain:
            'Un ingeniero no se fía de un gradiente escrito a mano hasta compararlo con la derivada numérica: si no coinciden, hay un error en la fórmula. Aquí la derivada exacta y la numérica salen casi iguales.',
          solution:
            'Con $w=1$ la derivada numérica es `(perdida(w + h) - perdida(w - h)) / (2 * h)`, y la exacta, `np.mean(2 * x * (w * x - y))`: las dos valen unos $-8{,}67$ y `coincide` es `True`. Con una fórmula equivocada, `coincide` sería `False`.',
          requirements: [
            '`numerica` y `exacta` existen y son un solo número cada una. `coincide` existe y es `True` o `False`.',
            '`numerica` es la derivada de `perdida` en `w` estimada con un paso muy pequeño, mirando a los dos lados.',
            '`exacta` es la derivada de la fórmula de la pérdida sobre los datos, con un término por dato. `coincide` es la comparación de las dos.',
          ],
          starter: `import numpy as np

# Los datos y el peso: la longitud de un prompt (x) y lo que tarda el modelo (y), con ŷ = w * x.
# Ya están hechos: no hace falta tocarlos.
x = np.array([1, 2, 3])
y = np.array([2, 5, 5])
w = 1.0
h = 1e-4

def perdida(w):
    # El error cuadrático medio de ŷ = w * x sobre los datos. Ya está hecha.
    return np.mean((w * x - y) ** 2)

# PASO 1. numerica: la derivada de perdida en w, estimada con la diferencia centrada.
# Qué: (perdida(w + h) - perdida(w - h)) / (2 * h), con el paso h de arriba.
# Por qué: es la pendiente de una secante muy corta, sin necesitar la fórmula.
# Con otra función, g = lambda t: t ** 2, en 3 y h = 0.1, sale (3.1 ** 2 - 2.9 ** 2) / 0.2 = 6.
numerica = None

# PASO 2. exacta: la derivada de la fórmula, la que usaría una red al entrenar.
# Qué: la media, con np.mean, de 2 * x * (w * x - y): un término por cada dato.
# Por qué: es la derivada de la media de (w * x - y) ** 2 respecto de w. Sale un solo número.
# Con otros datos, a = [1, 2] y b = [3, 3] y w = 1, 2 * a * (w * a - b) es [-4 -4], y su media, -4.
exacta = None

# PASO 3. coincide: True si numerica y exacta casi coinciden, False si no.
# Cómo: np.isclose(a, b) compara dos números con un margen pequeño; con bool(...) sale True o False.
# Si coincide es False, la fórmula de exacta tiene un error.
coincide = None

# Para ver qué vale algo antes de entregar: print(numerica, exacta, coincide) y pulsa «Ejecutar».
`,
          checks: `_x = np.array([1, 2, 3])
_y = np.array([2, 5, 5])
_w = 1.0
_ex = float(np.mean(2 * _x * (_w * _x - _y)))
def _num(v):
    return isinstance(v, (int, float, np.integer, np.floating)) and not isinstance(v, (bool, np.bool_)) and bool(np.isfinite(float(v)))
_n = _num(numerica)
_e = _num(exacta)
_cb = isinstance(coincide, (bool, np.bool_))
_nok = _n and abs(float(numerica) - _ex) < 1e-4
_eok = _e and abs(float(exacta) - _ex) < 1e-6
_esin2 = _e and abs(float(exacta) - _ex / 2) < 1e-6
_esinx = _e and abs(float(exacta) - float(np.mean(2 * (_w * _x - _y)))) < 1e-6
check(_n, "\`numerica\` tiene que ser un solo número: la derivada de \`perdida\` en \`w\`.")
check((not _n) or _nok, "\`numerica\` no es la derivada de \`perdida\` en \`w\`: \`(perdida(w + h) - perdida(w - h)) / (2 * h)\`. Mira que dividas entre \`2 * h\` y no entre \`h\`.")
check(_e, "\`exacta\` tiene que ser un solo número: la media de los términos de todos los datos, con \`np.mean\`.")
check((not _e) or not _esin2, "\`exacta\` sale la mitad: falta el \`2\` de la derivada de un cuadrado, \`2 * x * (w * x - y)\`.")
check((not _e) or not _esinx, "\`exacta\` no lleva el factor \`x\` de cada dato: la derivada de \`(w * x - y) ** 2\` respecto de \`w\` es \`2 * x * (w * x - y)\`.")
check((not _e) or _eok or _esin2 or _esinx, "\`exacta\` no es la media de \`2 * x * (w * x - y)\` sobre los datos.")
check(_cb, "\`coincide\` tiene que ser \`True\` o \`False\`: la comparación de \`numerica\` con \`exacta\`.")
check((not _cb) or (not _n) or (not _e) or bool(coincide) == bool(np.isclose(float(numerica), float(exacta))), "\`coincide\` no refleja la comparación de \`numerica\` con \`exacta\`: usa \`np.isclose(numerica, exacta)\`.")
`,
          reference:
            'import numpy as np\n\nx = np.array([1, 2, 3])\ny = np.array([2, 5, 5])\nw = 1.0\nh = 1e-4\n\n\ndef perdida(w):\n    return np.mean((w * x - y) ** 2)\n\n\nnumerica = (perdida(w + h) - perdida(w - h)) / (2 * h)\nexacta = np.mean(2 * x * (w * x - y))\ncoincide = bool(np.isclose(numerica, exacta))\n',
        },
        {
          id: 'derivada-pendiente.ex02.5',
          type: 'codigo',
          prompt:
            'La función es $f(x)=x^2-4x+5$ y el punto, `x0`. Guarda en `m` la pendiente de la tangente en `x0` (derivada numérica centrada, con el paso `h`) y en `b` la altura a la que la tangente corta el eje vertical. La figura dibuja tu tangente sobre la curva: ya está hecha.',
          hints: [
            'El plan son dos líneas. `m`: `f(x0 + h)` menos `f(x0 - h)`, entre `2 * h`. `b`: la tangente pasa por `(x0, f(x0))` con pendiente `m`, así que `b` es `f(x0)` menos `m * x0`. Un error típico: quedarse en `f(x0)` sin restar lo que sube la pendiente hasta el eje.',
            'Las piezas, con otra función:\n\n' +
              py(
                'g = lambda t: t ** 2',
                'p = 1.0',
                'print((g(p + 0.1) - g(p - 0.1)) / 0.2)   # 2.0: la pendiente en 1',
                'print(g(p) - 2.0 * p)                    # -1.0: la altura al llegar al eje: g(p) menos m * p',
              ) +
              '\n\nLa tangente es la recta $y=m\\,x+b$, y pasa por el punto de la curva.',
            'El esqueleto, con huecos `___` donde decides tú:\n\n' +
              py('m = (f(x0 + h) - f(x0 - ___)) / (2 * ___)', 'b = f(___) - m * x0') +
              '\n\nLos huecos de la primera línea son `h` los dos. El de la segunda es `x0`.',
          ],
          explain:
            'La tangente en `x0` es la recta que pasa por `(x0, f(x0))` con la pendiente de la derivada. Mira la figura: si tu `m` y tu `b` son buenos, la recta toca la curva solo en ese punto.',
          solution:
            'Con la derivada centrada, `m` sale $2$. La recta pasa por `(3, f(3))`, así que `b = f(x0) - m * x0`: $2-2\\cdot 3=-4$. La tangente es $y=2x-4$.',
          requirements: [
            '`m` y `b` existen y son un solo número cada una.',
            '`m` es la pendiente de la tangente a la curva en `x0`, estimada mirando a los dos lados con el paso `h`.',
            '`b` es la altura a la que corta la tangente el eje vertical, con la recta pasando por el punto de la curva en `x0`.',
          ],
          starter: `import numpy as np
import matplotlib.pyplot as plt

# f es la función, x0 el punto donde se traza la tangente y h el paso de la derivada numérica.
# Ya están hechos: no hace falta tocarlos.
f = lambda x: x ** 2 - 4 * x + 5
x0 = 3.0
h = 1e-4

# PASO 1. m: la pendiente de la tangente en x0.
# Qué: la derivada numérica centrada, (f(x0 + h) - f(x0 - h)) / (2 * h).
# Por qué: la tangente es la recta que mejor sigue a la curva en x0, y su pendiente es la derivada.
# Con g = lambda t: t ** 2 en 1 y h = 0.1, sale (g(1.1) - g(0.9)) / 0.2 = 2.
m = None

# PASO 2. b: la altura a la que la tangente corta el eje vertical (x = 0).
# Qué: la tangente es la recta y = m * x + b y pasa por (x0, f(x0)), así que f(x0) = m * x0 + b.
# Despeja: b = f(x0) menos m * x0. Con g, en 1, con m = 2: b = 1 - 2 * 1 = -1.
b = None

# Ya está hecha: no hace falta tocarla. Dibuja la curva y, cuando m y b están hechos, tu tangente.
xs = np.linspace(0, 6, 100)
plt.plot(xs, f(xs), label="f")
plt.plot(x0, f(x0), "o")
if m is not None and b is not None:
    plt.plot(xs, m * xs + b, "--", label="tu tangente")
plt.ylim(0, 12)
plt.legend()
plt.title("La tangente en x0")

# Para ver qué vale algo antes de entregar: print(m, b) y pulsa «Ejecutar».
`,
          checks: `_f = lambda x: x ** 2 - 4 * x + 5
_m = 2.0
_b = -4.0
def _num(v):
    return isinstance(v, (int, float, np.integer, np.floating)) and not isinstance(v, (bool, np.bool_)) and bool(np.isfinite(float(v)))
_mn, _bn = _num(m), _num(b)
_mok = _mn and abs(float(m) - _m) < 1e-3
_bok = _bn and abs(float(b) - _b) < 1e-3
_bsolo = _bn and abs(float(b) - _f(3.0)) < 1e-3
_bsigno = _bn and abs(float(b) + _b) < 1e-3
_bsinx = _bn and abs(float(b) - (_f(3.0) - _m)) < 1e-3
check(_mn, "\`m\` tiene que ser un solo número: la pendiente de la tangente en \`x0\`.")
check((not _mn) or _mok, "\`m\` no es la pendiente de la tangente en \`x0\`: \`(f(x0 + h) - f(x0 - h)) / (2 * h)\`. Mira que dividas entre \`2 * h\`.")
check(_bn, "\`b\` tiene que ser un solo número: la altura a la que la tangente corta el eje vertical.")
check((not _bn) or not _bsolo, "\`b\` es la altura de la curva en \`x0\`, \`f(x0)\`. Falta restar lo que sube la tangente hasta el eje: \`m * x0\`.")
check((not _bn) or not _bsigno, "\`b\` sale con el signo cambiado. La recta es \`y = m * x + b\`, así que \`b\` es \`f(x0)\` menos \`m * x0\`.")
check((not _bn) or not _bsinx, "\`b\` resta \`m\` y no \`m * x0\`. La recta pasa por \`(x0, f(x0))\`, y a la pendiente le falta multiplicar por \`x0\`.")
check((not _bn) or _bok or _bsolo or _bsigno or _bsinx, "\`b\` no es la altura a la que la tangente corta el eje vertical: \`f(x0) - m * x0\`.")
`,
          reference:
            'import numpy as np\n\nf = lambda x: x ** 2 - 4 * x + 5\nx0 = 3.0\nh = 1e-4\n\nm = (f(x0 + h) - f(x0 - h)) / (2 * h)\nb = f(x0) - m * x0\n',
        },
      ],
    },
  ],
  sheets: [
    {
      id: 'derivada-pendiente.hoja.1',
      type: 'revision',
      format: 'codigo',
      prompt:
        'Alguien quiere calcular la pendiente de la secante de una función `f` entre `a` y `b`. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'Para una recta que sube, la pendiente tiene que salir positiva. Prueba con `f(x) = x`, `a = 0` y `b = 1`.',
        'La subida y el avance tienen que restarse en el mismo orden.',
      ],
      explain:
        'Si la subida y el avance se restan en órdenes distintos, el signo de la pendiente sale cambiado. Revisa si cada línea mantiene el mismo orden.',
      solution:
        'La tercera línea está mal: `avance = a - b` resta al revés que la subida, `f(b) - f(a)`. Con `f(x) = x`, `a = 0` y `b = 1` sale $\\dfrac{1}{-1}=-1$ y la recta sube. Es `b - a`.',
      lines: [
        'def pendiente_secante(f, a, b):',
        '    subida = f(b) - f(a)',
        '    avance = a - b',
        '    return subida / avance',
      ],
      faultyLine: 2,
    },
    {
      id: 'derivada-pendiente.hoja.2',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento usa una secante para hablar de una tangente. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'La secante une dos puntos de la curva. La tangente toca la curva en uno solo.',
        'Piensa en el fondo de un valle: dos puntos a su misma altura, uno a cada lado.',
      ],
      explain:
        'Una secante da la pendiente media entre dos puntos, no la de la curva en uno de ellos. Solo cuando los dos puntos se juntan, la secante se convierte en la tangente.',
      solution:
        'La tercera línea está mal. Dos puntos a la misma altura dan una secante horizontal, pero la pendiente en $w=1$ vale $-2$: la curva baja ahí hacia el fondo, en $w=2$. La secante solo vale como tangente si los dos puntos se juntan.',
      lines: [
        'La pérdida es L(w) = (w − 2)². Se miran los pesos w = 1 y w = 3.',
        'L(1) = 1 y L(3) = 1: la pérdida vale lo mismo en los dos, así que la secante entre ellos es horizontal.',
        'Luego la tangente en w = 1 también es horizontal: su pendiente es 0.',
      ],
      faultyLine: 2,
    },
    {
      id: 'derivada-pendiente.hoja.3',
      type: 'revision',
      format: 'texto',
      prompt:
        'Este razonamiento usa la derivada como tasa de cambio. ¿Está bien, o hay una línea errónea? Si hay error, señala la línea donde se comete (las siguientes pueden arrastrarlo); si todo cuadra, no hay error.',
      hints: [
        'La pendiente es lo que cambia la pérdida por cada unidad que se mueve el peso. Para saber el cambio total, ¿se multiplica o se divide?',
        'Prueba con números enteros: pendiente $2$ y un movimiento de $1$. ¿Cuánto cambia la pérdida?',
      ],
      explain:
        'El cambio de la pérdida es, más o menos, la pendiente por lo que se mueve el peso. Dividir da otra cosa: cuánto habría que mover el peso para cambiar la pérdida en una unidad.',
      solution:
        'La segunda línea está mal: el cambio es la pendiente por el movimiento, $2\\times 0{,}5=1$, no $2\\div 0{,}5=4$. La pérdida sube unos $1$ al pasar de $w=3$ a $w=3{,}5$.',
      lines: [
        'En w = 3 la pendiente de la pérdida vale 2.',
        'Al mover w de 3 a 3,5, la pérdida cambia más o menos 2 ÷ 0,5 = 4.',
        'Luego en w = 3,5 la pérdida vale unos 4 más que en w = 3.',
      ],
      faultyLine: 1,
    },
  ],
};
