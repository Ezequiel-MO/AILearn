import { describe, expect, it } from 'vitest';
import { capaSchema } from '../../content/labs';
import { labMeasure } from '../../engine/labs';
import {
  ANIMALES,
  CARA_8X8,
  CORREOS,
  FRASE_ANIMAL,
  FRASE_ANIMAL_MIRA,
  NUBE_ALARGADA,
  NUBE_CLASES_CRUZADAS,
  NUBE_CON_ATIPICO,
  NUBE_SIN_ATIPICO,
  PESOS_4X6,
  PESOS_4X6_ROTULOS,
  RESENAS,
  RESENAS_CUATRO,
  RESENAS_NEGATIVIDAD,
  capaLab,
  type Cloud,
} from './datos';

const CLOUDS: Record<string, Cloud> = {
  RESENAS,
  RESENAS_CUATRO,
  RESENAS_NEGATIVIDAD,
  CORREOS,
  ANIMALES,
  NUBE_ALARGADA,
  NUBE_CON_ATIPICO,
  NUBE_SIN_ATIPICO,
  NUBE_CLASES_CRUZADAS,
};

/** La neurona siguiente mira solo la primera salida. */
const READOUT = { w: [1, 0] as [number, number], b: 0 };

/** Aciertos de la neurona cuando la primera salida es `a`·rasgo 1 + `b`·rasgo 2. */
const accWith = (cloud: Cloud, a: number, b: number): number =>
  labMeasure(capaLab(cloud, { i: [a, 0], j: [b, 1], movable: 'none', readout: READOUT }), {}).acc!;

/** Lo que mide la dirección v sobre los puntos de entrada de una nube. */
const along = (cloud: Cloud, x: number, y: number) =>
  labMeasure(capaLab(cloud, { movable: 'none', probe: { x, y, movable: false, on: 'input' } }), {});

describe('datos del juego 2: forma', () => {
  for (const [name, cloud] of Object.entries(CLOUDS)) {
    it(`${name} es una nube válida para el laboratorio capa`, () => {
      // contract: capaSchema es el esquema del laboratorio capa
      expect(capaSchema.safeParse(capaLab(cloud)).success).toBe(true);
    });

    it(`${name}: coordenadas en múltiplos de 0,5 dentro de ±3`, () => {
      for (const p of cloud.points) {
        // contract: brief-juego-2.md, «Datos»: múltiplos de 0,5, dentro de ±3, para que quepan transformadas
        expect(Number.isInteger(p.x * 2) && Number.isInteger(p.y * 2), p.id).toBe(true);
        expect(Math.max(Math.abs(p.x), Math.abs(p.y)), p.id).toBeLessThanOrEqual(3);
      }
    });

    it(`${name}: ningún rótulo pasa de 8 caracteres`, () => {
      // contract: traspaso 2026-11-10: los rótulos largos se pisan o se recortan en el dibujo a 390 px
      expect(cloud.points.filter((p) => p.label.length > 8).map((p) => p.label)).toEqual([]);
    });
  }
});

describe('datos del juego 2: lo que cada nube promete', () => {
  it('RESENAS: el tono separa y la intensidad no', () => {
    // contract: brief-juego-2.md: en RESENAS «el rasgo que separa es el segundo»
    expect(accWith(RESENAS, 0, 1)).toBe(1);
    expect(accWith(RESENAS, 1, 0)).toBe(0.5);
  });

  it('RESENAS_CUATRO conserva dos positivas y dos negativas, separadas por el tono', () => {
    // contract: brief-juego-2.md, despegue: «RESENAS reducida a cuatro palabras»
    expect(RESENAS_CUATRO.points.map((p) => p.group)).toEqual([1, 1, 0, 0]);
    expect(accWith(RESENAS_CUATRO, 0, 1)).toBe(1);
  });

  it('RESENAS_NEGATIVIDAD: el segundo rasgo separa solo con peso negativo', () => {
    // contract: brief-juego-2.md, Columnas: el eje «tono» cambiado por «negatividad» (signos invertidos)
    expect(accWith(RESENAS_NEGATIVIDAD, 0, 1)).toBe(0);
    expect(accWith(RESENAS_NEGATIVIDAD, 0, -1)).toBe(1);
  });

  it('CORREOS: ningún rasgo separa por sí solo y la diferencia «enlaces − saludos» sí', () => {
    // contract: brief-juego-2.md: «seis correos que ningún rasgo separa por sí solo y sí la diferencia»
    expect(accWith(CORREOS, 1, -1)).toBe(1);
    for (const [a, b] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      expect(accWith(CORREOS, a, b), `${a}, ${b}`).toBeLessThan(1);
    }
    // contract: comentario de CORREOS: tampoco con umbral; hay spam con tantos enlaces como un correo normal y con más saludos que otro
    const of = (group: number, key: 'x' | 'y') =>
      CORREOS.points.filter((p) => p.group === group).map((p) => p[key]);
    expect(Math.min(...of(1, 'x'))).toBeLessThanOrEqual(Math.max(...of(0, 'x')));
    expect(Math.max(...of(1, 'y'))).toBeGreaterThanOrEqual(Math.min(...of(0, 'y')));
  });

  it('ANIMALES: la domesticidad separa mascotas de salvajes y el tamaño no', () => {
    // contract: brief-juego-2.md: ANIMALES con ejes «tamaño» y «domesticidad» y grupos mascota y salvaje
    expect(accWith(ANIMALES, 0, 1)).toBe(1);
    expect(accWith(ANIMALES, 1, 0)).toBe(0.5);
  });

  it('ANIMALES: «gato» y «perro» quedan cerca; «lobo» y «perro», lejos', () => {
    const dist = (a: string, b: string): number =>
      labMeasure(capaLab(ANIMALES, { movable: 'none', pair: [a, b] }), {}).pair_dist0!;
    // contract: brief-juego-2.md: «parejas casi sinónimas (gato y perro cerca) para las preguntas de distancia»
    expect(dist('gato', 'perro')).toBeLessThan(1);
    expect(dist('lobo', 'perro')).toBeGreaterThan(3);
  });

  it('NUBE_ALARGADA: una dirección lleva casi toda la varianza y su perpendicular, casi nada', () => {
    // contract: guion de exploración (media y varianza a mano): (2, 1) lleva el 96,7 % y (−1, 2), el 3,3 %
    expect(along(NUBE_ALARGADA, 2, 1).var_frac).toBeCloseTo(0.967, 3);
    expect(along(NUBE_ALARGADA, -1, 2).var_frac).toBeCloseTo(0.033, 3);
  });

  it('NUBE_CON_ATIPICO: el dato raro se lleva la dirección de más varianza', () => {
    // contract: guion de exploración: sin el dato raro manda la horizontal (77,9 %); con él baja al 56,1 % y (3; 2,5) llega al 91,6 %
    expect(along(NUBE_SIN_ATIPICO, 1, 0).var_frac).toBeCloseTo(0.779, 3);
    expect(along(NUBE_CON_ATIPICO, 1, 0).var_frac).toBeCloseTo(0.561, 3);
    expect(along(NUBE_CON_ATIPICO, 3, 2.5).var_frac).toBeCloseTo(0.916, 3);
  });

  it('NUBE_CLASES_CRUZADAS: la dirección de más varianza mezcla las clases y la que las separa lleva poca', () => {
    const main = along(NUBE_CLASES_CRUZADAS, 1, 1);
    const cross = along(NUBE_CLASES_CRUZADAS, -1, 1);
    // contract: brief-juego-2.md: «la dirección de más varianza no separa los dos grupos»; guion de exploración: 90,2 % y 9,8 %
    expect(main.var_frac).toBeCloseTo(0.902, 3);
    expect(main.acc_v).toBe(0.5);
    expect(cross.var_frac).toBeCloseTo(0.098, 3);
    expect(cross.acc_v).toBe(1);
  });
});

describe('datos del juego 2: la Órbita 3', () => {
  /** Lo que mide la atención de «estaba» con la consulta q. */
  const looking = (q: [number, number]) =>
    labMeasure(
      {
        kind: 'atencion',
        tokens: FRASE_ANIMAL,
        focus: FRASE_ANIMAL_MIRA,
        query: q,
        range: 3,
        snap: 0.5,
      },
      {},
    );
  /** Lo que mide la compresión de `rows` con las k capas más importantes. */
  const keeping = (rows: number[][], k: number) => labMeasure({ kind: 'compresion', rows }, { k });

  it('FRASE_ANIMAL: quien mira es «estaba», y sus claves y valores caben en una ventana de ±3', () => {
    // contract: brief-juego-2.md, «Datos»: los tokens de «el animal no cruzó porque estaba cansado» con claves y valores
    expect(FRASE_ANIMAL.map((t) => t.text).join(' ')).toBe(
      'el animal no cruzó porque estaba cansado',
    );
    expect(FRASE_ANIMAL[FRASE_ANIMAL_MIRA]!.id).toBe('estaba');
    for (const t of FRASE_ANIMAL) {
      for (const n of [...t.key, ...t.value!]) {
        // contract: la consulta y las claves se arrastran en una rejilla de 0,5 dentro de ±3
        expect(Math.abs(n)).toBeLessThanOrEqual(3);
        expect(Number.isInteger(n * 2)).toBe(true);
      }
    }
  });

  it('FRASE_ANIMAL: con la consulta (2, 1) «animal» se lleva la atención; con (0, 1), «cansado»', () => {
    const toAnimal = looking([2, 1]);
    const start = looking([0, 1]);
    // contract: brief-juego-2.md, Atención 1: arrastrar la consulta de «estaba» → `w_animal` ≥ 70 %; softmax de (−2, 5, −1, 0, −5, 1, 0) da 0,966 a «animal»
    expect(toAnimal.s_animal).toBe(5);
    expect(toAnimal.w_animal).toBeCloseTo(0.966, 3);
    // contract: el estado inicial no resuelve: con (0, 1) la mayor puntuación es la de «cansado» (índice 6), con peso 0,503
    expect(start.top).toBe(6);
    expect(start.w_cansado).toBeCloseTo(0.503, 3);
    expect(start.w_animal!).toBeLessThan(0.7);
  });

  it('CARA_8X8: una imagen de 8×8 de rango 4 que se reconoce con dos capas y no con una', () => {
    // contract: brief-juego-2.md, «Datos»: una imagen de 8×8 para `compresion`, con valores de 0 (negro) a 1 (blanco)
    expect(CARA_8X8).toHaveLength(8);
    for (const row of CARA_8X8) {
      expect(row).toHaveLength(8);
      for (const n of row) expect([0, 0.5, 1]).toContain(n);
    }
    // contract: cabecera de CARA_8X8: rango 4; SVD 1 del brief: `error` ≤ 25 % con k = 2 (34 números) y no con k = 1
    expect(keeping(CARA_8X8, 1).rank).toBe(4);
    expect(keeping(CARA_8X8, 1).error!).toBeGreaterThan(0.25);
    expect(keeping(CARA_8X8, 2).error!).toBeLessThanOrEqual(0.25);
    expect(keeping(CARA_8X8, 2).stored).toBe(34);
  });

  it('PESOS_4X6: una tabla de pesos de rango 2 que dos capas reproducen entera con 22 números', () => {
    // contract: brief-juego-2.md, «Datos» y SVD 2: `PESOS_4X6` (rango 2), `error` ≤ 0 con `stored` ≤ 22
    expect(PESOS_4X6).toHaveLength(4);
    for (const row of PESOS_4X6) expect(row).toHaveLength(6);
    expect(PESOS_4X6_ROTULOS.rows).toHaveLength(4);
    expect(PESOS_4X6_ROTULOS.cols).toHaveLength(6);
    expect(keeping(PESOS_4X6, 1).rank).toBe(2);
    expect(keeping(PESOS_4X6, 1).error!).toBeGreaterThan(0.1);
    expect(keeping(PESOS_4X6, 2).error).toBeCloseTo(0, 9);
    expect(keeping(PESOS_4X6, 2).stored).toBe(22);
    expect(keeping(PESOS_4X6, 2).full).toBe(24);
  });
});
