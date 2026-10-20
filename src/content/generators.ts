import { makeRng } from '../engine/rng';
import type { GeneradaQ, NumeroQ, VectorQ } from './schema';

type Params = Record<string, number | string | boolean>;

export interface Generator {
  id: string;
  /** Límites de cada componente de la respuesta. */
  bounds: { min: number; max: number };
  make(id: string, params: Params, rng: () => number): NumeroQ | VectorQ;
}

// ---------- utilidades de sorteo y de texto ----------

/** Entero uniforme en [lo, hi]. */
const int = (rng: () => number, lo: number, hi: number): number =>
  lo + Math.floor(rng() * (hi - lo + 1));

const component = (rng: () => number): number => int(rng, -6, 6);
const point = (rng: () => number, dim = 2): number[] =>
  Array.from({ length: dim }, () => component(rng));

/** Quita el cero negativo para que la solución no arrastre «-0». */
const clean = (n: number): number => n + 0;

const isZero = (v: readonly number[]): boolean => v.every((x) => x === 0);

/** Número en LaTeX: dos decimales como mucho, coma decimal, sin ceros sobrantes. */
const tex = (n: number): string => {
  const rounded = clean(Math.round(n * 100) / 100);
  return String(rounded).replace('.', '{,}');
};

/** Número que puede ir entre paréntesis si es negativo (potencias, productos). */
const paren = (n: number): string => (n < 0 ? `(${tex(n)})` : tex(n));

/** `=` si redondear a dos decimales no cambia el valor y `\approx ` si lo cambia. */
const equalsOrApprox = (n: number): string =>
  Math.abs(n - Math.round(n * 100) / 100) < 1e-9 ? '=' : '\\approx ';

/** `=` si ninguna componente cambia al redondear a dos decimales y `\approx ` si alguna cambia. */
const allEqualsOrApprox = (xs: readonly number[]): string =>
  xs.every((x) => equalsOrApprox(x) === '=') ? '=' : '\\approx ';

/** Tupla en LaTeX; con decimales separa con punto y coma para no mezclarlo con la coma decimal. */
const tuple = (v: readonly number[]): string => {
  const rounded = v.map((x) => clean(Math.round(x * 100) / 100));
  const sep = rounded.every(Number.isInteger) ? ',\\ ' : ';\\ ';
  return `(${rounded.map(tex).join(sep)})`;
};

const vectorQ = (
  id: string,
  body: Pick<VectorQ, 'prompt' | 'hints' | 'explain' | 'solution'>,
  answer: number[],
  tol: number,
  shape?: [number, number],
): VectorQ => ({
  type: 'vector',
  id,
  ...body,
  answer: answer.map(clean),
  tol,
  ...(shape ? { shape } : {}),
});

const numeroQ = (
  id: string,
  body: Pick<NumeroQ, 'prompt' | 'hints' | 'explain' | 'solution'>,
  answer: number,
  tol: number,
): NumeroQ => ({ type: 'numero', id, ...body, answer: clean(answer), tol });

// ---------- generadores ----------

const desplazamiento: Generator = {
  id: 'desplazamiento',
  bounds: { min: -12, max: 12 },
  make(id, _params, rng) {
    const a = point(rng);
    const b = point(rng);
    const answer = b.map((x, i) => x - a[i]!);
    return vectorQ(
      id,
      {
        prompt: `Los puntos son $A=${tuple(a)}$ y $B=${tuple(b)}$. Escribe las componentes del vector que va de $A$ a $B$.`,
        hints: [
          'Un vector que va de un punto a otro se obtiene restando las coordenadas del punto de llegada menos las del punto de salida.',
          'Resta componente a componente: primero la $x$, después la $y$.',
        ],
        explain:
          'El vector de $A$ a $B$ es $\\overrightarrow{AB}=B-A$: llegada menos salida. El fallo habitual es restar al revés, y el vector sale con el signo cambiado.',
        solution: `$\\overrightarrow{AB}=B-A=${tuple(b)}-${tuple(a)}=(${b
          .map((x, i) => `${tex(x)}-${paren(a[i]!)}`)
          .join(',\\ ')})=${tuple(answer)}$`,
      },
      answer,
      0,
    );
  },
};

const suma: Generator = {
  id: 'suma',
  bounds: { min: -12, max: 12 },
  make(id, _params, rng) {
    const u = point(rng);
    const v = point(rng);
    const answer = u.map((x, i) => x + v[i]!);
    return vectorQ(
      id,
      {
        prompt: `Sean $\\vec{u}=${tuple(u)}$ y $\\vec{v}=${tuple(v)}$. Calcula $\\vec{u}+\\vec{v}$.`,
        hints: [
          'Los vectores se suman componente a componente.',
          'La primera componente de la suma es la suma de las primeras componentes.',
        ],
        explain:
          'La suma de vectores es componente a componente. Geométricamente, se coloca $\\vec{v}$ a continuación de $\\vec{u}$ y la suma va del origen al extremo.',
        solution: `$\\vec{u}+\\vec{v}=(${u
          .map((x, i) => `${tex(x)}+${paren(v[i]!)}`)
          .join(',\\ ')})=${tuple(answer)}$`,
      },
      answer,
      0,
    );
  },
};

const COEFFICIENTS = [-3, -2, -1, 1, 2, 3];

const combinacion: Generator = {
  id: 'combinacion',
  bounds: { min: -36, max: 36 },
  make(id, _params, rng) {
    const a = COEFFICIENTS[int(rng, 0, COEFFICIENTS.length - 1)]!;
    const b = COEFFICIENTS[int(rng, 0, COEFFICIENTS.length - 1)]!;
    const u = point(rng);
    const v = point(rng);
    const answer = u.map((x, i) => a * x + b * v[i]!);
    const expr = `${a}\\,\\vec{u} ${b < 0 ? '-' : '+'} ${Math.abs(b)}\\,\\vec{v}`;
    return vectorQ(
      id,
      {
        prompt: `Calcula $${expr}$ con $\\vec{u}=${tuple(u)}$ y $\\vec{v}=${tuple(v)}$.`,
        hints: [
          'Multiplica cada vector por su número, componente a componente, y después suma.',
          'Cuidado con los signos: un coeficiente negativo cambia el sentido del vector.',
        ],
        explain:
          'Una combinación lineal escala cada vector y suma los resultados. Se hace componente a componente; el fallo típico es olvidar aplicar el coeficiente a una de las componentes.',
        solution: `$${expr}=(${u
          .map((x, i) => `${paren(a)}\\cdot ${paren(x)}+${paren(b)}\\cdot ${paren(v[i]!)}`)
          .join(',\\ ')})=${tuple(answer)}$`,
      },
      answer,
      0,
    );
  },
};

const centroide: Generator = {
  id: 'centroide',
  bounds: { min: -6, max: 6 },
  make(id, _params, rng) {
    const points = [point(rng), point(rng), point(rng)];
    const answer = [0, 1].map((i) => points.reduce((s, p) => s + p[i]!, 0) / 3);
    const sums = [0, 1].map((i) => points.reduce((s, p) => s + p[i]!, 0));
    return vectorQ(
      id,
      {
        prompt: `Calcula el centroide de los puntos $P_1=${tuple(points[0]!)}$, $P_2=${tuple(points[1]!)}$ y $P_3=${tuple(points[2]!)}$. Si no sale exacto, redondea a dos decimales.`,
        hints: [
          'El centroide es la media de los puntos: la media de las $x$ y la media de las $y$.',
          'Suma las tres coordenadas $x$ y divide entre 3; haz lo mismo con las $y$.',
        ],
        explain:
          'El centroide es el punto medio de un conjunto de puntos: la media componente a componente. Es la idea que hay detrás del «vector medio» de un conjunto de embeddings.',
        solution: `$\\bar{P}=\\left(\\dfrac{${points
          .map((p) => paren(p[0]!))
          .join(
            '+',
          )}}{3};\\ \\dfrac{${points.map((p) => paren(p[1]!)).join('+')}}{3}\\right)=\\left(\\dfrac{${tex(
          sums[0]!,
        )}}{3};\\ \\dfrac{${tex(sums[1]!)}}{3}\\right)${allEqualsOrApprox(answer)}${tuple(answer)}$`,
      },
      answer,
      0.01,
    );
  },
};

const norma: Generator = {
  id: 'norma',
  bounds: { min: 0, max: 10.4 },
  make(id, params, rng) {
    const dim = params['dim'] ?? 2;
    if (dim !== 2 && dim !== 3) {
      throw new Error(`Generador norma: dim debe ser 2 o 3, no ${String(dim)}`);
    }
    let v = point(rng, dim);
    while (isZero(v)) v = point(rng, dim);
    const squares = v.map((x) => x * x);
    const total = squares.reduce((s, x) => s + x, 0);
    const answer = Math.sqrt(total);
    const where = dim === 2 ? 'del plano' : 'del espacio';
    return numeroQ(
      id,
      {
        prompt: `Calcula la norma $\\lVert\\vec{v}\\rVert$ del vector $\\vec{v}=${tuple(v)}$ ${where}. Redondea a dos decimales.`,
        hints: [
          'La norma es la longitud del vector: la raíz cuadrada de la suma de los cuadrados de sus componentes.',
          'Eleva cada componente al cuadrado (un negativo al cuadrado sale positivo), suma y saca la raíz.',
        ],
        explain:
          'La norma generaliza el teorema de Pitágoras: $\\lVert\\vec{v}\\rVert=\\sqrt{v_1^2+v_2^2+\\dots}$. Sale siempre cero o positiva; un fallo común es olvidar la raíz.',
        solution: `$\\lVert\\vec{v}\\rVert=\\sqrt{${v
          .map((x) => `${paren(x)}^2`)
          .join(
            '+',
          )}}=\\sqrt{${squares.map(tex).join('+')}}=\\sqrt{${tex(total)}}${equalsOrApprox(answer)}${tex(answer)}$`,
      },
      answer,
      0.01,
    );
  },
};

const distancia: Generator = {
  id: 'distancia',
  bounds: { min: 0, max: 17 },
  make(id, _params, rng) {
    const a = point(rng);
    let b = point(rng);
    while (a[0] === b[0] && a[1] === b[1]) b = point(rng);
    const diff = b.map((x, i) => x - a[i]!);
    const total = diff.reduce((s, x) => s + x * x, 0);
    const answer = Math.sqrt(total);
    return numeroQ(
      id,
      {
        prompt: `Calcula la distancia entre los puntos $A=${tuple(a)}$ y $B=${tuple(b)}$. Redondea a dos decimales.`,
        hints: [
          'La distancia entre dos puntos es la norma del vector que los une.',
          'Resta las coordenadas, eleva al cuadrado cada diferencia, suma y saca la raíz.',
        ],
        explain:
          'La distancia entre $A$ y $B$ es $\\lVert B-A\\rVert$. Es la medida con la que se comparan embeddings: cuanto menor es la distancia, más se parecen.',
        solution: `$d(A,B)=\\sqrt{(${tex(b[0]!)}-${paren(a[0]!)})^2+(${tex(b[1]!)}-${paren(a[1]!)})^2}=\\sqrt{${paren(
          diff[0]!,
        )}^2+${paren(diff[1]!)}^2}=\\sqrt{${tex(total)}}${equalsOrApprox(answer)}${tex(answer)}$`,
      },
      answer,
      0.01,
    );
  },
};

const unitario: Generator = {
  id: 'unitario',
  bounds: { min: -1, max: 1 },
  make(id, _params, rng) {
    let v = point(rng);
    while (isZero(v)) v = point(rng);
    const n = Math.hypot(...v);
    const answer = v.map((x) => x / n);
    const total = v.reduce((s, x) => s + x * x, 0);
    return vectorQ(
      id,
      {
        prompt: `Calcula el vector unitario en la dirección de $\\vec{v}=${tuple(v)}$. Redondea las componentes a dos decimales.`,
        hints: [
          'Un vector unitario tiene norma 1 y apunta en la misma dirección que $\\vec{v}$.',
          'Divide cada componente de $\\vec{v}$ entre su norma.',
        ],
        explain:
          'Normalizar es dividir un vector entre su norma: conserva la dirección y deja la longitud en 1. Olvidar normalizar es un fallo clásico al comparar embeddings.',
        solution: `$\\lVert\\vec{v}\\rVert=\\sqrt{${tex(total)}}${equalsOrApprox(n)}${tex(n)}$, así que $\\hat{v}=\\dfrac{\\vec{v}}{\\lVert\\vec{v}\\rVert}${equalsOrApprox(n)}\\left(${v
          .map((x) => `\\dfrac{${tex(x)}}{${tex(n)}}`)
          .join(';\\ ')}\\right)${allEqualsOrApprox(answer)}${tuple(answer)}$`,
      },
      answer,
      0.01,
    );
  },
};

// ---------- Órbita 1: el ángulo ----------

/** Producto escalar con los pasos escritos: `a_1 b_1 + a_2 b_2 = … = total`. */
const dotSteps = (a: readonly number[], b: readonly number[]): string => {
  const total = a.reduce((s, x, i) => s + x * b[i]!, 0);
  const terms = a.map((x, i) => `${paren(x)}\\cdot ${paren(b[i]!)}`).join('+');
  const products = a.map((x, i) => paren(clean(x * b[i]!))).join('+');
  return `${terms}=${products}=${tex(total)}`;
};

const producto: Generator = {
  id: 'producto',
  bounds: { min: -72, max: 72 },
  make(id, _params, rng) {
    const u = point(rng);
    const v = point(rng);
    const answer = u.reduce((s, x, i) => s + x * v[i]!, 0);
    return numeroQ(
      id,
      {
        prompt: `Sean $\\vec{u}=${tuple(u)}$ y $\\vec{v}=${tuple(v)}$. Calcula el producto escalar $\\vec{u}\\cdot\\vec{v}$.`,
        hints: [
          'El producto escalar multiplica las componentes que ocupan el mismo lugar y suma los resultados.',
          'Multiplica las dos $x$, multiplica las dos $y$ y suma. Cuidado con los signos.',
        ],
        explain:
          'El producto escalar es $\\vec{u}\\cdot\\vec{v}=u_1v_1+u_2v_2$: da un número, no un vector. Es positivo si las flechas apuntan hacia el mismo lado, cero si son perpendiculares y negativo si apuntan a lados opuestos.',
        solution: `$\\vec{u}\\cdot\\vec{v}=${dotSteps(u, v)}$`,
      },
      answer,
      0,
    );
  },
};

const coseno: Generator = {
  id: 'coseno',
  bounds: { min: -1, max: 1 },
  make(id, _params, rng) {
    let u = point(rng);
    while (isZero(u)) u = point(rng);
    let v = point(rng);
    while (isZero(v)) v = point(rng);
    const d = u.reduce((s, x, i) => s + x * v[i]!, 0);
    const uu = u.reduce((s, x) => s + x * x, 0);
    const vv = v.reduce((s, x) => s + x * x, 0);
    const answer = d / Math.sqrt(uu * vv);
    return numeroQ(
      id,
      {
        prompt: `Sean $\\vec{u}=${tuple(u)}$ y $\\vec{v}=${tuple(v)}$. Calcula el coseno del ángulo que forman. Redondea a dos decimales.`,
        hints: [
          'El coseno es el producto escalar dividido entre el producto de las dos normas.',
          'Calcula primero $\\vec{u}\\cdot\\vec{v}$, después $\\lVert\\vec{u}\\rVert$ y $\\lVert\\vec{v}\\rVert$, y divide.',
        ],
        explain:
          'El coseno es $\\cos\\theta=\\dfrac{\\vec{u}\\cdot\\vec{v}}{\\lVert\\vec{u}\\rVert\\,\\lVert\\vec{v}\\rVert}$ y siempre queda entre $-1$ y $1$. Si te sale fuera, has olvidado dividir entre alguna de las dos normas.',
        solution: `$\\vec{u}\\cdot\\vec{v}=${dotSteps(u, v)}$, $\\lVert\\vec{u}\\rVert=\\sqrt{${tex(uu)}}$ y $\\lVert\\vec{v}\\rVert=\\sqrt{${tex(vv)}}$, así que $\\cos\\theta=\\dfrac{${tex(d)}}{\\sqrt{${tex(uu)}}\\,\\sqrt{${tex(vv)}}}${equalsOrApprox(answer)}${tex(answer)}$`,
      },
      answer,
      0.01,
    );
  },
};

const proyeccion: Generator = {
  id: 'proyeccion',
  bounds: { min: -8.5, max: 8.5 },
  make(id, _params, rng) {
    const a = point(rng);
    let b = point(rng);
    while (isZero(b)) b = point(rng);
    const d = a.reduce((s, x, i) => s + x * b[i]!, 0);
    const bb = b.reduce((s, x) => s + x * x, 0);
    const answer = d / Math.sqrt(bb);
    return numeroQ(
      id,
      {
        prompt: `Sean $\\vec{a}=${tuple(a)}$ y $\\vec{b}=${tuple(b)}$. Calcula la proyección escalar de $\\vec{a}$ sobre $\\vec{b}$, es decir, la longitud con signo de la sombra de $\\vec{a}$ sobre la recta de $\\vec{b}$. Redondea a dos decimales.`,
        hints: [
          'La proyección escalar es el producto escalar dividido entre la norma del vector sobre el que se proyecta.',
          'Calcula $\\vec{a}\\cdot\\vec{b}$ y divídelo entre $\\lVert\\vec{b}\\rVert$, no entre $\\lVert\\vec{a}\\rVert$.',
        ],
        explain:
          'La proyección escalar de $\\vec{a}$ sobre $\\vec{b}$ es $\\dfrac{\\vec{a}\\cdot\\vec{b}}{\\lVert\\vec{b}\\rVert}$: se divide entre la norma de $\\vec{b}$, la dirección sobre la que cae la sombra. Es negativa si la sombra cae hacia el lado opuesto a $\\vec{b}$.',
        solution: `$\\vec{a}\\cdot\\vec{b}=${dotSteps(a, b)}$ y $\\lVert\\vec{b}\\rVert=\\sqrt{${tex(bb)}}$, así que la proyección escalar es $\\dfrac{${tex(d)}}{\\sqrt{${tex(bb)}}}${equalsOrApprox(answer)}${tex(answer)}$`,
      },
      answer,
      0.01,
    );
  },
};

// ---------- Órbita 2: muchas dimensiones ----------

const productoRn: Generator = {
  id: 'producto-rn',
  bounds: { min: -100, max: 100 },
  make(id, _params, rng) {
    const u = Array.from({ length: 4 }, () => int(rng, -5, 5));
    const v = Array.from({ length: 4 }, () => int(rng, -5, 5));
    const answer = u.reduce((s, x, i) => s + x * v[i]!, 0);
    return numeroQ(
      id,
      {
        prompt: `En $\\mathbb{R}^4$, sean $\\vec{u}=${tuple(u)}$ y $\\vec{v}=${tuple(v)}$. Calcula el producto escalar $\\vec{u}\\cdot\\vec{v}$.`,
        hints: [
          'En cuatro dimensiones el producto escalar se calcula igual que en el plano, con cuatro productos en lugar de dos.',
          'Multiplica las componentes que ocupan el mismo lugar, una a una, y suma los cuatro resultados. Cuidado con los signos.',
        ],
        explain:
          'El producto escalar en $\\mathbb{R}^n$ es $\\vec{u}\\cdot\\vec{v}=u_1v_1+u_2v_2+\\dots+u_nv_n$: un producto por cada componente y una suma. Da un número, no un vector.',
        solution: `$\\vec{u}\\cdot\\vec{v}=${dotSteps(u, v)}$`,
      },
      answer,
      0,
    );
  },
};

/** Vectores enteros de ℝ³ con norma entera: (componentes, norma). */
const INTEGER_NORMS: readonly (readonly [readonly number[], number])[] = [
  [[1, 2, 2], 3],
  [[2, 3, 6], 7],
  [[1, 4, 8], 9],
  [[4, 4, 7], 9],
  [[2, 6, 9], 11],
  [[6, 6, 7], 11],
];

const normalizar: Generator = {
  id: 'normalizar',
  bounds: { min: -1, max: 1 },
  make(id, _params, rng) {
    const [base, n] = INTEGER_NORMS[int(rng, 0, INTEGER_NORMS.length - 1)]!;
    // permutación al azar de las tres componentes y signo al azar en cada una
    const rest = [...base];
    const v: number[] = [];
    while (rest.length > 0) {
      const [x] = rest.splice(int(rng, 0, rest.length - 1), 1);
      v.push(int(rng, 0, 1) === 0 ? x! : -x!);
    }
    const answer = v.map((x) => x / n);
    const squares = v.map((x) => `${paren(x)}^2`).join('+');
    const sum = v.reduce((s, x) => s + x * x, 0);
    return vectorQ(
      id,
      {
        prompt: `Normaliza $\\vec{v}=${tuple(v)}$: escribe el vector unitario que apunta en la misma dirección y con el mismo sentido. Redondea cada componente a dos decimales.`,
        hints: [
          'Normalizar es dividir el vector entre su norma.',
          'Calcula primero $\\lVert\\vec{v}\\rVert$ (en este vector sale un número entero) y divide cada componente entre ella.',
        ],
        explain:
          'El unitario de $\\vec{v}$ es $\\dfrac{\\vec{v}}{\\lVert\\vec{v}\\rVert}$: cada componente se divide entre la norma, de modo que la dirección no cambia y la longitud pasa a ser $1$. Todas sus componentes quedan entre $-1$ y $1$.',
        solution: `$\\lVert\\vec{v}\\rVert=\\sqrt{${squares}}=\\sqrt{${tex(sum)}}=${tex(n)}$, así que $\\dfrac{\\vec{v}}{\\lVert\\vec{v}\\rVert}${allEqualsOrApprox(answer)}${tuple(answer)}$`,
      },
      answer,
      0.01,
    );
  },
};

/** Dimensiones cuyo 1/√d tiene como mucho dos decimales. */
const RANDOM_DIMS = [100, 400, 625, 2500, 10000] as const;

const cosenoAzar: Generator = {
  id: 'coseno-azar',
  bounds: { min: 0, max: 0.1 },
  make(id, _params, rng) {
    const d = RANDOM_DIMS[int(rng, 0, RANDOM_DIMS.length - 1)]!;
    const root = Math.sqrt(d);
    const answer = 1 / root;
    return numeroQ(
      id,
      {
        prompt: `Se sortean muchos pares de vectores al azar en $\\mathbb{R}^{${d}}$, con componentes independientes y centradas en $0$, y se calcula el coseno de cada par. ¿Cuánto vale, aproximadamente, la desviación típica de esos cosenos? Escríbelo con dos decimales.`,
        hints: [
          'La media de esos cosenos es $0$: al azar, dos vectores no tienden a apuntar hacia el mismo lado ni hacia lados opuestos.',
          'La desviación típica del coseno se hace más pequeña al crecer la dimensión $d$: es $1/\\sqrt{d}$.',
        ],
        explain:
          'En dimensión alta, dos vectores al azar son casi perpendiculares: su coseno se agrupa en torno a $0$ con una desviación típica de $1/\\sqrt{d}$. Cuanto mayor es $d$, más estrecha es la campana.',
        solution: `La desviación típica es $\\dfrac{1}{\\sqrt{d}}=\\dfrac{1}{\\sqrt{${d}}}=\\dfrac{1}{${tex(root)}}=${tex(answer)}$. Un coseno muy por encima de este valor ya no se explica por azar.`,
      },
      answer,
      0.005,
    );
  },
};

// ---------- Órbita 3: búsqueda ----------

const mejorPuntuacion: Generator = {
  id: 'mejor-puntuacion',
  bounds: { min: -27, max: 27 },
  make(id, _params, rng) {
    const draw = (): number[] => Array.from({ length: 3 }, () => int(rng, -3, 3));
    let q = draw();
    while (isZero(q)) q = draw();
    const dot = (d: readonly number[]): number => d.reduce((s, x, i) => s + x * q[i]!, 0);
    // Se sortea de nuevo hasta que un solo documento gane: la pregunta no admite empates arriba.
    let docs: number[][];
    let scores: number[];
    do {
      docs = Array.from({ length: 4 }, draw);
      scores = docs.map(dot);
    } while (scores.filter((s) => s === Math.max(...scores)).length > 1);
    const answer = Math.max(...scores);
    const winner = scores.indexOf(answer) + 1;
    const docList = docs.map((d, i) => `$\\vec{d}_${i + 1}=${tuple(d)}$`);
    const steps = docs.map((d, i) => `$\\vec{d}_${i + 1}\\cdot\\vec{q}=${dotSteps(d, q)}$`);
    return numeroQ(
      id,
      {
        prompt: `Un buscador puntúa cada documento con el producto escalar entre su embedding y el de la consulta, y se queda con el que más puntúa. Con embeddings inventados de $\\mathbb{R}^3$, la consulta es $\\vec{q}=${tuple(q)}$ y los documentos son ${docList.slice(0, 3).join(', ')} y ${docList[3]!}. ¿Qué puntuación tiene el documento que gana?`,
        hints: [
          'Calcula las cuatro puntuaciones $\\vec{d}_i\\cdot\\vec{q}$ y quédate con la mayor.',
          'Cada producto escalar es una suma de tres productos de componentes. Cuidado con los signos: la mayor puntuación puede ser negativa si todas lo son.',
        ],
        explain:
          'La búsqueda por vecinos más cercanos puntúa todos los documentos contra la consulta y ordena de mayor a menor: el top-1 es el primero de esa lista. Se pide la puntuación del ganador, no su número.',
        solution: `${steps.join('; ')}. Gana $\\vec{d}_${winner}$ con $${tex(answer)}$.`,
      },
      answer,
      0,
    );
  },
};

/** Analogías clásicas «b es a a como c es a…»: el vector buscado es a − b + c. */
const ANALOGIES: readonly (readonly [string, string, string])[] = [
  ['rey', 'hombre', 'mujer'],
  ['padre', 'hombre', 'mujer'],
  ['Roma', 'Italia', 'Alemania'],
  ['Lisboa', 'Portugal', 'Francia'],
  ['príncipe', 'hombre', 'mujer'],
];

const analogia: Generator = {
  id: 'analogia',
  bounds: { min: -15, max: 15 },
  make(id, _params, rng) {
    const [wa, wb, wc] = ANALOGIES[int(rng, 0, ANALOGIES.length - 1)]!;
    const draw = (): number[] => Array.from({ length: 3 }, () => int(rng, -5, 5));
    const a = draw();
    const b = draw();
    const c = draw();
    const answer = a.map((x, i) => x - b[i]! + c[i]!);
    const steps = a.map((x, i) => `${tex(x)}-${paren(b[i]!)}+${paren(c[i]!)}`).join(',\\ ');
    return vectorQ(
      id,
      {
        prompt: `Con embeddings inventados de $\\mathbb{R}^3$, «${wa}» es $\\vec{a}=${tuple(a)}$, «${wb}» es $\\vec{b}=${tuple(b)}$ y «${wc}» es $\\vec{c}=${tuple(c)}$. Para completar la analogía «${wb} es a ${wa} como ${wc} es a…» se calcula $\\vec{a}-\\vec{b}+\\vec{c}$ y se busca la palabra más cercana a ese vector. Escribe $\\vec{a}-\\vec{b}+\\vec{c}$.`,
        hints: [
          '$\\vec{a}-\\vec{b}$ es lo que separa las dos primeras palabras; sumarle $\\vec{c}$ traslada esa misma diferencia a la tercera.',
          'Opera componente a componente: la primera de $\\vec{a}$, menos la primera de $\\vec{b}$, más la primera de $\\vec{c}$; y así con las otras dos.',
        ],
        explain:
          'Una analogía se resuelve con aritmética de vectores: la diferencia $\\vec{a}-\\vec{b}$ representa la relación, y sumada a $\\vec{c}$ apunta hacia la palabra que falta. Restar $\\vec{b}$ es restar cada una de sus componentes, con su signo.',
        solution: `$\\vec{a}-\\vec{b}+\\vec{c}=(${steps})=${tuple(answer)}$`,
      },
      answer,
      0,
    );
  },
};

const umbral: Generator = {
  id: 'umbral',
  bounds: { min: 0, max: 5 },
  make(id, _params, rng) {
    const t = int(rng, 4, 8) / 10;
    // Cosenos de dos decimales entre 0,10 y 0,95, ninguno igual al umbral.
    const scores: number[] = [];
    while (scores.length < 5) {
      const s = int(rng, 10, 95) / 100;
      if (Math.abs(s - t) > 1e-9) scores.push(s);
    }
    const passing = scores.filter((s) => s > t);
    const answer = passing.length;
    const list = scores.map(tex).join(';\\ ');
    const which =
      answer === 0
        ? 'ninguno lo pasa, así que el buscador responde «no lo sé»'
        : `lo pasan $${passing.map(tex).join(';\\ ')}$`;
    return numeroQ(
      id,
      {
        prompt: `Un buscador solo usa los documentos cuyo coseno con la consulta llega al umbral $${tex(t)}$; si ninguno llega, responde «no lo sé». Los cinco documentos de la base puntúan $${list}$. ¿Cuántos documentos pasan el umbral?`,
        hints: [
          `Compara cada coseno con $${tex(t)}$, uno a uno.`,
          'Fíjate en las décimas antes que en las centésimas: $0{,}69$ no llega a $0{,}7$.',
        ],
        explain:
          'Un umbral sobre el coseno deja fuera los documentos poco parecidos a la consulta. Cuenta solo los que llegan al umbral, y cero también es una respuesta posible.',
        solution: `Con umbral $${tex(t)}$: ${which}. En total, $${answer}$.`,
      },
      answer,
      0,
    );
  },
};

// ---------- Juego 2: matrices y transformaciones ----------

/** Matriz en LaTeX; `rows` va por filas. */
const matrixTex = (rows: readonly (readonly (number | string)[])[]): string =>
  `\\begin{pmatrix}${rows
    .map((r) => r.map((x) => (typeof x === 'number' ? tex(x) : x)).join(' & '))
    .join(' \\\\ ')}\\end{pmatrix}`;

/** Matriz 2×2 guardada por filas en cuatro números: `[a, b, c, d]`. */
const matrix2Tex = (m: readonly number[]): string =>
  matrixTex([
    [m[0]!, m[1]!],
    [m[2]!, m[3]!],
  ]);

const columnTex = (v: readonly (number | string)[]): string => matrixTex(v.map((x) => [x]));

const draw2x2 = (rng: () => number): number[] => Array.from({ length: 4 }, () => int(rng, -3, 3));

const isIdentity2 = (m: readonly number[]): boolean =>
  m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1;

/** Producto de dos matrices 2×2 guardadas por filas. */
const mul2 = (a: readonly number[], b: readonly number[]): number[] => [
  a[0]! * b[0]! + a[1]! * b[2]!,
  a[0]! * b[1]! + a[1]! * b[3]!,
  a[2]! * b[0]! + a[3]! * b[2]!,
  a[2]! * b[1]! + a[3]! * b[3]!,
];

/** `A v` con los pasos escritos, fila por fila: una columna de expresiones `a·x + b·y`. */
const mulSteps = (m: readonly number[], v: readonly number[]): string =>
  columnTex([
    `${paren(m[0]!)}\\cdot ${paren(v[0]!)}+${paren(m[1]!)}\\cdot ${paren(v[1]!)}`,
    `${paren(m[2]!)}\\cdot ${paren(v[0]!)}+${paren(m[3]!)}\\cdot ${paren(v[1]!)}`,
  ]);

const matrizVector: Generator = {
  id: 'matriz-vector',
  bounds: { min: -18, max: 18 },
  make(id, _params, rng) {
    const drawV = (): number[] => [int(rng, -3, 3), int(rng, -3, 3)];
    let a = draw2x2(rng);
    while (isZero(a) || isIdentity2(a)) a = draw2x2(rng);
    let v = drawV();
    while (isZero(v)) v = drawV();
    const [x, y] = v as [number, number];
    const answer = [a[0]! * x + a[1]! * y, a[2]! * x + a[3]! * y].map(clean);
    const scaled = columnTex([
      `${tex(x * a[0]!)}+${paren(y * a[1]!)}`,
      `${tex(x * a[2]!)}+${paren(y * a[3]!)}`,
    ]);
    return vectorQ(
      id,
      {
        prompt: `Sean $A=${matrix2Tex(a)}$ y $\\vec{v}=${columnTex(v)}$. Calcula $A\\vec{v}$.`,
        hints: [
          '$A\\vec{v}$ es $v_1$ veces la primera columna de $A$ más $v_2$ veces la segunda.',
          'También puedes calcular cada componente como una fila de $A$ por $\\vec{v}$: multiplica las componentes que ocupan el mismo lugar y suma.',
        ],
        explain:
          'Hay dos formas de ver el mismo producto. Por columnas: $A\\vec{v}=v_1\\,\\vec{c}_1+v_2\\,\\vec{c}_2$, una combinación lineal de las columnas de $A$, que son las imágenes de $\\hat{\\imath}$ y $\\hat{\\jmath}$. Por filas: cada componente es el producto escalar de una fila de $A$ con $\\vec{v}$.',
        solution: `Por columnas: $A\\vec{v}=${paren(x)}${columnTex([a[0]!, a[2]!])}+${paren(y)}${columnTex([a[1]!, a[3]!])}=${scaled}=${columnTex(answer)}$. Por filas: $A\\vec{v}=${mulSteps(a, v)}=${columnTex(answer)}$.`,
      },
      answer,
      0,
    );
  },
};

const productoMatrices: Generator = {
  id: 'producto-matrices',
  bounds: { min: -18, max: 18 },
  make(id, _params, rng) {
    let a = draw2x2(rng);
    let b = draw2x2(rng);
    // Se sortea de nuevo hasta que el orden importe: AB ≠ BA (ninguna es nula).
    const orderMatters = (): boolean => {
      const ba = mul2(b, a);
      return !isZero(a) && !isZero(b) && mul2(a, b).some((x, i) => x !== ba[i]);
    };
    while (!orderMatters()) {
      a = draw2x2(rng);
      b = draw2x2(rng);
    }
    const ab = mul2(a, b).map(clean);
    const ba = mul2(b, a).map(clean);
    const col = (m: readonly number[], k: number): number[] => [m[k]!, m[2 + k]!];
    const colSteps = [0, 1]
      .map((k) => `$A${columnTex(col(b, k))}=${mulSteps(a, col(b, k))}=${columnTex(col(ab, k))}$`)
      .join(' y ');
    return vectorQ(
      id,
      {
        prompt: `Sean $A=${matrix2Tex(a)}$ y $B=${matrix2Tex(b)}$. Calcula $AB$, la transformación que resulta de componer las dos: primero se aplica $B$ y después $A$. Escribe la matriz $AB$.`,
        hints: [
          'En $AB$ se aplica primero $B$ y después $A$: la primera columna de $AB$ es $A$ por la primera columna de $B$.',
          'Calcula $A$ por cada una de las dos columnas de $B$, como una matriz por un vector; las dos columnas que salen son las columnas de $AB$.',
        ],
        explain:
          'La columna $k$ de $AB$ es $A$ por la columna $k$ de $B$: dice adónde va cada vector de la base cuando se aplica $B$ y después $A$. El orden importa: en general $AB\\neq BA$.',
        solution: `Columna 1 y columna 2 de $AB$: ${colSteps}. Así, $AB=${matrix2Tex(ab)}$. Con el orden contrario saldría otra matriz: $BA=${matrix2Tex(ba)}\\neq AB$.`,
      },
      ab,
      0,
      [2, 2],
    );
  },
};

/** Tamaños realistas de aprendizaje automático, mezclados con tamaños pequeños. */
const SHAPE_SIZES = [3, 10, 64, 128, 256, 384, 512, 768] as const;

const formaProducto: Generator = {
  id: 'forma-producto',
  bounds: { min: 2, max: 800 },
  make(id, _params, rng) {
    const size = (): number =>
      int(rng, 0, 1) === 0 ? SHAPE_SIZES[int(rng, 0, SHAPE_SIZES.length - 1)]! : int(rng, 2, 20);
    let m = size();
    let n = size();
    let p = size();
    // La dimensión interior distinta de las otras dos: así la respuesta no se adivina por simetría.
    while (n === m || n === p) {
      m = size();
      n = size();
      p = size();
    }
    const layer = int(rng, 0, 1) === 1;
    const prompt = layer
      ? `Una capa lineal tiene una matriz de pesos $W$ de forma $(${m}, ${n})$ y recibe un lote de $${p}$ embeddings de dimensión $${n}$, colocados como columnas de una matriz $X$. ¿Qué forma tiene $WX$? Escribe filas y columnas.`
      : `Se multiplica una matriz $A$ de forma $(${m}, ${n})$ por una matriz $B$ de forma $(${n}, ${p})$. ¿Qué forma tiene $AB$? Escribe filas y columnas.`;
    return vectorQ(
      id,
      {
        prompt,
        hints: [
          'El producto solo se puede hacer si las columnas de la primera matriz coinciden con las filas de la segunda.',
          'La dimensión que se repite se «consume» en el producto: el resultado tiene las filas de la primera matriz y las columnas de la segunda.',
        ],
        explain: layer
          ? 'Cada columna de $X$ es un embedding y $W$ lo lleva a otro espacio. El producto $WX$ tiene tantas filas como $W$ y tantas columnas como embeddings hay en el lote.'
          : 'En $(m, n)\\cdot(n, p)$ la dimensión $n$ desaparece: es la longitud de cada producto escalar de una fila por una columna. El resultado tiene la forma $(m, p)$.',
        solution: `$(${m}, ${n})\\cdot(${n}, ${p})$: coinciden las $${n}$ del medio y desaparecen. La forma del resultado es $(${m}, ${p})$.`,
      },
      [m, p],
      0,
    );
  },
};

// ---------- Juego 2, Órbita 1: el área ----------

const det2 = (m: readonly number[]): number => m[0]! * m[3]! - m[1]! * m[2]!;

/** Matriz 2×2 de entradas de -3 a 3, con a lo sumo un cero y determinante distinto de 0. */
const drawInvertible2x2 = (rng: () => number): number[] => {
  for (;;) {
    const m = draw2x2(rng);
    if (m.filter((x) => x === 0).length <= 1 && det2(m) !== 0) return m;
  }
};

const determinante: Generator = {
  id: 'determinante',
  bounds: { min: -18, max: 18 },
  make(id, _params, rng) {
    const m = drawInvertible2x2(rng);
    const [a, b, c, d] = m as [number, number, number, number];
    const r = det2(m);
    const effect =
      r > 0
        ? 'Como el determinante es positivo, $A$ conserva la orientación del plano.'
        : 'Como el determinante es negativo, $A$ además voltea el plano: cambia su orientación.';
    return numeroQ(
      id,
      {
        prompt: `Sea $A=${matrix2Tex(m)}$. Calcula su determinante, $\\det A$.`,
        hints: [
          'Para una matriz $2\\times 2$, $\\det A=ad-bc$: el producto de la diagonal principal menos el de la otra diagonal.',
          'Fíjate en el orden y en el signo: primero $a\\cdot d$, después se resta $b\\cdot c$, y cuidado con los números negativos.',
        ],
        explain:
          'El determinante de $\\begin{pmatrix}a & b\\\\ c & d\\end{pmatrix}$ es $ad-bc$. Los fallos habituales son sumar en lugar de restar ($ad+bc$) y multiplicar la diagonal equivocada ($ab-cd$ o $ac-bd$). Su valor absoluto es el factor por el que $A$ multiplica las áreas; el signo dice si el plano se voltea.',
        solution: `$\\det A=a\\cdot d-b\\cdot c=${paren(a)}\\cdot ${paren(d)}-${paren(b)}\\cdot ${paren(c)}=${tex(a * d)}-${paren(b * c)}=${tex(r)}$. El valor absoluto, $${tex(Math.abs(r))}$, es el factor por el que $A$ multiplica las áreas. ${effect}`,
      },
      r,
      0,
    );
  },
};

const resolverSistema: Generator = {
  id: 'resolver-sistema',
  bounds: { min: -3, max: 3 },
  make(id, _params, rng) {
    const drawX = (): number[] => [int(rng, -3, 3), int(rng, -3, 3)];
    let x = drawX();
    while (isZero(x)) x = drawX();
    // Con A diagonal el sistema se lee a ojo: se exige b ≠ 0 o c ≠ 0.
    let m = draw2x2(rng);
    while (det2(m) === 0 || (m[1] === 0 && m[2] === 0)) m = draw2x2(rng);
    const [a, b, c, d] = m as [number, number, number, number];
    const rhs = [a * x[0]! + b * x[1]!, c * x[0]! + d * x[1]!].map(clean);
    const dt = det2(m);
    const adj = [d, -b, -c, a].map(clean);
    const scaled = [
      adj[0]! * rhs[0]! + adj[1]! * rhs[1]!,
      adj[2]! * rhs[0]! + adj[3]! * rhs[1]!,
    ].map(clean);
    // El signo del determinante va delante de la fracción: nunca \dfrac{1}{-5}.
    const sign = dt < 0 ? '-' : '';
    const factor = Math.abs(dt) === 1 ? sign : `${sign}\\dfrac{1}{${Math.abs(dt)}}`;
    const adjTex = matrix2Tex(adj);
    return vectorQ(
      id,
      {
        prompt: `Resuelve $A\\vec{x}=\\vec{b}$ con $A=${matrix2Tex(m)}$ y $\\vec{b}=${columnTex(rhs)}$. Escribe $\\vec{x}$.`,
        hints: [
          'Si $\\det A\\neq 0$, $A$ tiene inversa y $\\vec{x}=A^{-1}\\vec{b}$. Para una matriz $2\\times 2$, $A^{-1}=\\dfrac{1}{\\det A}\\begin{pmatrix}d & -b\\\\ -c & a\\end{pmatrix}$.',
          'Cuando tengas $\\vec{x}$, compruébalo: calcula $A\\vec{x}$ y mira si sale $\\vec{b}$.',
        ],
        explain:
          'Resolver $A\\vec{x}=\\vec{b}$ es preguntar qué vector $\\vec{x}$ aterriza en $\\vec{b}$ al aplicar $A$. Si $A$ no aplasta el plano ($\\det A\\neq 0$), se deshace la transformación con la inversa: $\\vec{x}=A^{-1}\\vec{b}$. La inversa intercambia $a$ y $d$, cambia el signo de $b$ y $c$, y divide entre $\\det A$.',
        solution: `$\\det A=${paren(a)}\\cdot ${paren(d)}-${paren(b)}\\cdot ${paren(c)}=${tex(dt)}$. La matriz adjunta (intercambia $a$ y $d$, cambia el signo de $b$ y $c$) es $${adjTex}$. Entonces $\\vec{x}=A^{-1}\\vec{b}=${factor}${adjTex}${columnTex(rhs)}=${factor}${mulSteps(adj, rhs)}=${factor}${columnTex(scaled)}=${columnTex(x)}$. Comprobación: $A\\vec{x}=${mulSteps(m, x)}=${columnTex(rhs)}=\\vec{b}$.`,
      },
      x,
      0,
    );
  },
};

const ORDINAL = ['primera', 'segunda', 'tercera'] as const;

/** Determinante de una matriz 3×3 guardada por filas en nueve números. */
const det3 = (m: readonly number[]): number =>
  m[0]! * (m[4]! * m[8]! - m[5]! * m[7]!) -
  m[1]! * (m[3]! * m[8]! - m[5]! * m[6]!) +
  m[2]! * (m[3]! * m[7]! - m[4]! * m[6]!);

const cross = (u: readonly number[], v: readonly number[]): number[] => [
  u[1]! * v[2]! - u[2]! * v[1]!,
  u[2]! * v[0]! - u[0]! * v[2]!,
  u[0]! * v[1]! - u[1]! * v[0]!,
];

const drawCol3 = (rng: () => number): number[] => [
  int(rng, -3, 3),
  int(rng, -3, 3),
  int(rng, -3, 3),
];

/** «$m$ veces la primera»; el caso -1 se lee «la opuesta de la primera». */
const multipleText = (m: number, name: string): string =>
  m === 1 ? name : m === -1 ? `la opuesta de ${name}` : `$${tex(m)}$ veces ${name}`;

const rango: Generator = {
  id: 'rango',
  bounds: { min: 1, max: 3 },
  make(id, _params, rng) {
    const target = int(rng, 1, 3);
    const MULTIPLES = [-2, -1, 2, 3];
    const MIXES = [-2, -1, 1, 2];
    const pick = (xs: readonly number[]): number => xs[int(rng, 0, xs.length - 1)]!;
    const combine = (p: number, u: readonly number[], q: number, v: readonly number[]): number[] =>
      u.map((x, i) => p * x + q * v[i]!);
    // Columnas en el orden sorteado: `cols`, y `how` dice cómo se reparte la dependencia.
    let cols: number[][] = [];
    let coefficients: number[] = [];
    if (target === 1) {
      let c1 = drawCol3(rng);
      while (isZero(c1)) c1 = drawCol3(rng);
      coefficients = [pick(MULTIPLES), pick(MULTIPLES)];
      cols = [c1, c1.map((x) => coefficients[0]! * x), c1.map((x) => coefficients[1]! * x)];
    } else if (target === 2) {
      for (;;) {
        const c1 = drawCol3(rng);
        const c2 = drawCol3(rng);
        if (isZero(cross(c1, c2))) continue;
        coefficients = [pick(MIXES), pick(MIXES)];
        const c3 = combine(coefficients[0]!, c1, coefficients[1]!, c2);
        if (c3.some((x) => Math.abs(x) > 9)) continue;
        cols = [c1, c2, c3];
        break;
      }
    } else {
      for (;;) {
        cols = [drawCol3(rng), drawCol3(rng), drawCol3(rng)];
        const rows = [0, 1, 2].flatMap((i) => cols.map((c) => c[i]!));
        if (det3(rows) !== 0) break;
      }
    }
    // Se baraja el orden de las columnas: la dependiente no cae siempre en el mismo sitio.
    const order = [0, 1, 2];
    for (let i = 2; i > 0; i--) {
      const j = int(rng, 0, i);
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    const shuffled = order.map((k) => cols[k]!);
    const rows = [0, 1, 2].map((i) => shuffled.map((c) => c[i]!));
    const flat = rows.flat();
    // Posición (0, 1 o 2) en la matriz mostrada de la columna original k.
    const posOf = (k: number): number => order.indexOf(k);
    let solution: string;
    if (target === 1) {
      const others = [1, 2]
        .map((k) => ({ pos: posOf(k), m: coefficients[k - 1]! }))
        .sort((u, v) => u.pos - v.pos);
      const base = ORDINAL[posOf(0)]!;
      solution = `Todas las columnas son múltiplos de una misma: la ${ORDINAL[others[0]!.pos]} columna es ${multipleText(others[0]!.m, `la ${base}`)} y la ${ORDINAL[others[1]!.pos]} columna es ${multipleText(others[1]!.m, `la ${base}`)}. Entonces solo hay una dirección independiente: todo el espacio cae sobre una recta y el rango es $1$.`;
    } else if (target === 2) {
      const parts = [0, 1]
        .map((k) => ({ pos: posOf(k), p: coefficients[k]!, col: cols[k]! }))
        .sort((u, v) => u.pos - v.pos);
      const [first, second] = parts as [(typeof parts)[number], (typeof parts)[number]];
      const lead = multipleText(first.p, `la ${ORDINAL[first.pos]}`);
      const tail = `${second.p > 0 ? 'más' : 'menos'} ${multipleText(Math.abs(second.p), `la ${ORDINAL[second.pos]}`)}`;
      solution = `La ${ORDINAL[posOf(2)]} columna es ${lead} ${tail}: $${columnTex(cols[2]!)}=${paren(first.p)}${columnTex(first.col)}+${paren(second.p)}${columnTex(second.col)}$. Esas dos columnas no son paralelas (ninguna es múltiplo de la otra), así que generan un plano: la imagen es un plano y el rango es $2$.`;
    } else {
      solution = `$\\det A=${tex(det3(flat))}\\neq 0$, así que las tres columnas son linealmente independientes: ninguna es combinación de las otras. La imagen llena todo el espacio y el rango es $3$.`;
    }
    return numeroQ(
      id,
      {
        prompt: `¿Cuál es el rango de $A=${matrixTex(rows)}$?`,
        hints: [
          'El rango es el número de columnas linealmente independientes de $A$, es decir, la dimensión de su imagen.',
          'Busca una columna que sea combinación de las otras (un múltiplo de una, o una suma de múltiplos de las otras dos). Si no hay ninguna, el rango es $3$.',
        ],
        explain:
          'El rango cuenta cuántas direcciones independientes quedan en la imagen de $A$: una recta (rango 1), un plano (rango 2) o todo el espacio (rango 3). Cada columna que sea combinación de las demás no aporta una dirección nueva. En una matriz $3\\times 3$, rango 3 equivale a $\\det A\\neq 0$.',
        solution,
      },
      target,
      0,
    );
  },
};

export const generators: Record<string, Generator> = {
  desplazamiento,
  suma,
  combinacion,
  centroide,
  norma,
  distancia,
  unitario,
  producto,
  coseno,
  proyeccion,
  'producto-rn': productoRn,
  normalizar,
  'coseno-azar': cosenoAzar,
  'mejor-puntuacion': mejorPuntuacion,
  analogia,
  umbral,
  'matriz-vector': matrizVector,
  'producto-matrices': productoMatrices,
  'forma-producto': formaProducto,
  determinante,
  'resolver-sistema': resolverSistema,
  rango,
};

/** Convierte una entrada `generada` en una pregunta concreta con una semilla entera. */
export const resolve = (q: GeneradaQ, seed: number): NumeroQ | VectorQ => {
  const generator = Object.hasOwn(generators, q.generator) ? generators[q.generator] : undefined;
  if (!generator) throw new Error(`Generador inexistente: ${q.generator}`);
  return generator.make(q.id, q.params, makeRng(seed));
};
