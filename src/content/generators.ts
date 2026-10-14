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
): VectorQ => ({ type: 'vector', id, ...body, answer: answer.map(clean), tol });

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

export const generators: Record<string, Generator> = {
  desplazamiento,
  suma,
  combinacion,
  centroide,
  norma,
  distancia,
  unitario,
};

/** Convierte una entrada `generada` en una pregunta concreta con una semilla entera. */
export const resolve = (q: GeneradaQ, seed: number): NumeroQ | VectorQ => {
  const generator = Object.hasOwn(generators, q.generator) ? generators[q.generator] : undefined;
  if (!generator) throw new Error(`Generador inexistente: ${q.generator}`);
  return generator.make(q.id, q.params, makeRng(seed));
};
