import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptySummary } from '../engine/types';
import { WARNINGS, createLocalStore } from './local';
import { migrate } from './migrate';
import type { Attempt, ProgressDoc } from './types';

/** Storage falso en memoria; `failGet` / `failSet` simulan modo privado o cuota llena. */
class FakeStorage implements Storage {
  data = new Map<string, string>();
  failGet = false;
  failSet = false;
  /** Lanza solo al escribir las claves para las que devuelve `true`. */
  failSetOn: ((key: string) => boolean) | null = null;
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(key: string): string | null {
    if (this.failGet) throw new Error('lectura bloqueada');
    return this.data.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  setItem(key: string, value: string): void {
    if (this.failSet || this.failSetOn?.(key) === true) throw new Error('cuota llena');
    this.data.set(key, value);
  }
  keysWith(fragment: string): string[] {
    return [...this.data.keys()].filter((k) => k.includes(fragment));
  }
}

const KEY = 'ailearn:v1:local:vectores';

const emptyDoc = (): ProgressDoc => ({ schema: 1, summary: emptySummary(), attempts: [] });

const attempt = (i: number): Attempt => ({
  q: `q${i}`,
  at: new Date(Date.UTC(2026, 9, 13, 12, 0, 0, i)).toISOString(),
  correct: i % 2 === 0,
  submissions: 1 + (i % 3),
  hinted: i % 5 === 0,
  context: (['despegue', 'proyecto', 'hoja', 'examen'] as const)[i % 4],
});

const sampleDoc = (): ProgressDoc => ({
  schema: 1,
  summary: {
    launch: true,
    firsts: { 'componentes/0': 5, 'componentes/1': 3 },
    examsPassed: [0],
    sheets: ['h1'],
  },
  attempts: [attempt(1), attempt(2)],
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('createLocalStore', () => {
  it('load sin datos devuelve el documento vacío y ningún aviso', () => {
    const store = createLocalStore(new FakeStorage());
    // contract: brief tarea 5, «load sin datos» -> documento vacío, sin aviso
    expect(store.load('vectores')).toEqual(emptyDoc());
    expect(store.warning()).toBeNull();
  });

  it('save y load devuelven el mismo documento bajo la clave exacta', () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    const doc = sampleDoc();
    store.save('vectores', doc);
    // contract: brief tarea 5 y common.md, clave de progreso `ailearn:v1:local:<juego>`
    expect([...storage.data.keys()]).toEqual([KEY]);
    expect(createLocalStore(storage).load('vectores')).toEqual(doc);
    expect(store.load('vectores')).toEqual(doc);
    expect(store.warning()).toBeNull();
  });

  it.each([
    ['texto que no es JSON', '{no json'],
    ['schema desconocido', JSON.stringify({ ...emptyDoc(), schema: 99 })],
    [
      'firsts fuera de rango (9)',
      JSON.stringify({ ...emptyDoc(), summary: { ...emptySummary(), firsts: { 'a/0': 9 } } }),
    ],
  ])('documento ilegible (%s): vacío, aviso y copia apartada con el texto original', (_n, raw) => {
    const storage = new FakeStorage();
    storage.data.set(KEY, raw);
    const store = createLocalStore(storage);
    // contract: brief tarea 5, filas {no json / schema 99 / firsts 9}: vacío + aviso + clave …:apartado:…
    expect(store.load('vectores')).toEqual(emptyDoc());
    expect(store.warning()).toBe(WARNINGS.corrupt);
    const apartadas = storage.keysWith(`${KEY}:apartado:`);
    expect(apartadas).toHaveLength(1);
    expect(storage.data.get(apartadas[0])).toBe(raw);
    // contract: brief tarea 5, «No borra el original hasta el siguiente save»
    expect(storage.data.get(KEY)).toBe(raw);
  });

  it('un segundo load del mismo texto ilegible no duplica la copia apartada', () => {
    const storage = new FakeStorage();
    storage.data.set(KEY, '{no json');
    const store = createLocalStore(storage);
    store.load('vectores');
    store.load('vectores');
    // contract: spec sección 8, «no borra nada»; una sola copia por texto
    expect(storage.keysWith(':apartado:')).toHaveLength(1);
  });

  it('tras un documento ilegible, el siguiente save lo sustituye y la copia sigue ahí', () => {
    const storage = new FakeStorage();
    storage.data.set(KEY, '{no json');
    const store = createLocalStore(storage);
    store.load('vectores');
    store.save('vectores', sampleDoc());
    // contract: brief tarea 5, «hasta el siguiente save»
    expect(createLocalStore(storage).load('vectores')).toEqual(sampleDoc());
    const apartadas = storage.keysWith(':apartado:');
    expect(apartadas.map((k) => storage.data.get(k))).toEqual(['{no json']);
  });

  it('si la copia apartada no se puede escribir, el save no pisa el original ilegible', () => {
    const storage = new FakeStorage();
    storage.data.set(KEY, '{no json');
    storage.failSet = true;
    const store = createLocalStore(storage);
    expect(store.load('vectores')).toEqual(emptyDoc());
    store.save('vectores', sampleDoc());
    // contract: spec sección 8, «Un documento ilegible … no borra nada»
    expect(storage.data.get(KEY)).toBe('{no json');
    expect(store.load('vectores')).toEqual(sampleDoc());
    expect(store.warning()).toBe(WARNINGS.keptAside);
    // al volver el almacenamiento, se aparta la copia y luego se guarda
    storage.failSet = false;
    store.save('vectores', sampleDoc());
    expect(storage.keysWith(':apartado:').map((k) => storage.data.get(k))).toEqual(['{no json']);
    expect(createLocalStore(storage).load('vectores')).toEqual(sampleDoc());
  });

  it('setItem que lanza: save no lanza, load devuelve lo guardado en memoria y hay aviso', () => {
    const storage = new FakeStorage();
    storage.failSet = true;
    const store = createLocalStore(storage);
    const doc = sampleDoc();
    // contract: brief tarea 5, fila «Storage cuyo setItem lanza»
    expect(() => store.save('vectores', doc)).not.toThrow();
    expect(store.load('vectores')).toEqual(doc);
    expect(store.warning()).toBe(WARNINGS.writeFailed);
  });

  it('getItem que lanza: load no lanza, devuelve vacío y hay aviso', () => {
    const storage = new FakeStorage();
    storage.failGet = true;
    const store = createLocalStore(storage);
    // contract: brief tarea 5, fila «Storage cuyo getItem lanza»
    expect(() => store.load('vectores')).not.toThrow();
    expect(store.load('vectores')).toEqual(emptyDoc());
    expect(store.warning()).toBe(WARNINGS.readFailed);
  });

  it('getItem que lanza: un save posterior no pisa lo que no se pudo leer', () => {
    const storage = new FakeStorage();
    storage.data.set(KEY, JSON.stringify(sampleDoc()));
    storage.failGet = true;
    const store = createLocalStore(storage);
    store.load('vectores');
    const nuevo = emptyDoc();
    expect(() => store.save('vectores', nuevo)).not.toThrow();
    // contract: spec sección 8, no perder el documento anterior
    expect(JSON.parse(storage.data.get(KEY) as string)).toEqual(sampleDoc());
    expect(store.load('vectores')).toEqual(nuevo);
  });

  it('sin localStorage global: funciona en memoria y avisa', () => {
    vi.stubGlobal('localStorage', undefined);
    const store = createLocalStore();
    const doc = sampleDoc();
    expect(() => store.save('vectores', doc)).not.toThrow();
    // contract: brief tarea 5, «Si localStorage no existe … sigue funcionando en memoria … y deja un aviso»
    expect(store.load('vectores')).toEqual(doc);
    expect(store.warning()).toBe(WARNINGS.unavailable);
  });

  it('sin argumento usa el localStorage global cuando existe', () => {
    const storage = new FakeStorage();
    vi.stubGlobal('localStorage', storage);
    const store = createLocalStore();
    store.save('vectores', sampleDoc());
    // contract: brief tarea 5, clave exacta del progreso
    expect(storage.data.has(KEY)).toBe(true);
    expect(store.warning()).toBeNull();
  });

  it('un localStorage global cuyo acceso lanza no rompe la creación', () => {
    vi.stubGlobal('localStorage', undefined);
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError');
      },
    });
    try {
      const store = createLocalStore();
      expect(() => store.load('vectores')).not.toThrow();
      // contract: brief tarea 5, «Si localStorage no existe o lanza …» -> aviso de no disponible
      expect(store.warning()).toBe(WARNINGS.unavailable);
    } finally {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });

  it('borradores: saveDraft y loadDraft; otra pregunta devuelve null', () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    expect(store.loadDraft('vectores', 'q1')).toBeNull();
    store.saveDraft('vectores', 'q1', 'import numpy as np\n');
    // contract: brief tarea 5, fila «saveDraft y loadDraft»
    expect(store.loadDraft('vectores', 'q1')).toBe('import numpy as np\n');
    expect(store.loadDraft('vectores', 'q2')).toBeNull();
    // contract: brief tarea 5, clave de borradores `ailearn:v1:local:<juego>:borradores`
    expect(JSON.parse(storage.data.get(`${KEY}:borradores`) as string)).toEqual({
      q1: 'import numpy as np\n',
    });
    expect(createLocalStore(storage).loadDraft('vectores', 'q1')).toBe('import numpy as np\n');
  });

  it('borradores: varias preguntas conviven y la última versión gana', () => {
    const store = createLocalStore(new FakeStorage());
    store.saveDraft('vectores', 'q1', 'a');
    store.saveDraft('vectores', 'q2', 'b');
    store.saveDraft('vectores', 'q1', 'c');
    // contract: spec sección 8, «Los borradores de código van en una clave aparte»
    expect(store.loadDraft('vectores', 'q1')).toBe('c');
    expect(store.loadDraft('vectores', 'q2')).toBe('b');
  });

  it('borradores: los datos de progreso y los borradores no se pisan', () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    // contract: brief tarea 5, claves distintas para progreso y borradores
    store.save('vectores', sampleDoc());
    store.saveDraft('vectores', 'q1', 'x');
    expect(store.load('vectores')).toEqual(sampleDoc());
    expect(store.loadDraft('vectores', 'q1')).toBe('x');
  });

  it('borradores: setItem que lanza guarda en memoria, avisa y no lanza', () => {
    const storage = new FakeStorage();
    storage.failSet = true;
    const store = createLocalStore(storage);
    // contract: brief tarea 5 / contexto, los borradores siguen las mismas reglas de «nunca lanza»
    expect(() => store.saveDraft('vectores', 'q1', 'abc')).not.toThrow();
    expect(store.loadDraft('vectores', 'q1')).toBe('abc');
    expect(store.warning()).toBe(WARNINGS.draftsWriteFailed);
  });

  it('borradores: getItem que lanza devuelve null, avisa y no lanza', () => {
    const storage = new FakeStorage();
    storage.failGet = true;
    const store = createLocalStore(storage);
    // contract: contexto de la tarea 5, los borradores siguen las mismas reglas de «nunca lanza»
    expect(() => store.loadDraft('vectores', 'q1')).not.toThrow();
    expect(store.loadDraft('vectores', 'q1')).toBeNull();
    expect(() => store.saveDraft('vectores', 'q1', 'abc')).not.toThrow();
    expect(store.warning()).toBe(WARNINGS.draftsReadFailed);
  });

  it('borradores ilegibles: se apartan, devuelven null y avisan', () => {
    const storage = new FakeStorage();
    storage.data.set(`${KEY}:borradores`, '[1,2');
    const store = createLocalStore(storage);
    expect(store.loadDraft('vectores', 'q1')).toBeNull();
    // contract: ronda 1 punto 4, texto propio para borradores (no alarma sobre el progreso)
    expect(store.warning()).toBe(WARNINGS.draftsCorrupt);
    expect(store.warning()).not.toBe(WARNINGS.corrupt);
    // contract: spec sección 8, un documento ilegible no borra nada
    expect(storage.keysWith('borradores:apartado:').map((k) => storage.data.get(k))).toEqual([
      '[1,2',
    ]);
    store.saveDraft('vectores', 'q1', 'ok');
    expect(store.loadDraft('vectores', 'q1')).toBe('ok');
  });

  it('borradores con valores que no son texto se tratan como ilegibles', () => {
    const storage = new FakeStorage();
    storage.data.set(`${KEY}:borradores`, JSON.stringify({ q1: 5 }));
    const store = createLocalStore(storage);
    // contract: spec sección 8, un documento ilegible se aparta (un valor no textual lo es)
    expect(store.loadDraft('vectores', 'q1')).toBeNull();
    expect(storage.keysWith('borradores:apartado:')).toHaveLength(1);
  });

  it('tandas a medias: saveRun y loadRun en su propia clave; otra tanda devuelve null', () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    const run = { questionIds: ['a', 'b'], events: [{ type: 'submit' as const, correct: true }] };
    expect(store.loadRun('vectores', 'p/0')).toBeNull();
    store.saveRun('vectores', 'p/0', run);
    // contract: petición de Oliver 2026-10-28 («que se guarde el nivel en el que lo dejé»)
    expect(store.loadRun('vectores', 'p/0')).toEqual(run);
    expect(store.loadRun('vectores', 'p/1')).toBeNull();
    // contract: clave aparte `ailearn:v1:local:<juego>:tandas`, como los borradores; el progreso no se escribe
    expect(JSON.parse(storage.data.get(`${KEY}:tandas`) as string)).toEqual({ 'p/0': run });
    expect(storage.data.has(KEY)).toBe(false);
    expect(createLocalStore(storage).loadRun('vectores', 'p/0')).toEqual(run);
  });

  it('tandas a medias: saveRun con null quita solo esa tanda', () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    const run = { questionIds: ['a'], events: [] };
    store.saveRun('vectores', 'p/0', run);
    store.saveRun('vectores', 'despegue', run);
    store.saveRun('vectores', 'p/0', null);
    // contract: al terminar la tanda se quita; las demás siguen
    expect(store.loadRun('vectores', 'p/0')).toBeNull();
    expect(store.loadRun('vectores', 'despegue')).toEqual(run);
    expect(JSON.parse(storage.data.get(`${KEY}:tandas`) as string)).toEqual({ despegue: run });
  });

  it('tandas a medias: quitar una que no existe no escribe nada', () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    store.saveRun('vectores', 'p/0', null);
    // contract: nada que quitar, nada que escribir
    expect(storage.data.size).toBe(0);
  });

  it('tandas a medias ilegibles: se apartan, devuelven null y avisan con su propio texto', () => {
    const storage = new FakeStorage();
    storage.data.set(`${KEY}:tandas`, '[1,2');
    const store = createLocalStore(storage);
    expect(store.loadRun('vectores', 'p/0')).toBeNull();
    // contract: spec sección 8, un documento ilegible no borra nada y el jugador ve un aviso
    expect(store.warning()).toBe(WARNINGS.runsCorrupt);
    expect(storage.keysWith('tandas:apartado:').map((k) => storage.data.get(k))).toEqual(['[1,2']);
  });

  it('tandas a medias: setItem que lanza no lanza y avisa', () => {
    const storage = new FakeStorage();
    storage.failSet = true;
    const store = createLocalStore(storage);
    // contract: el almacén nunca lanza (ProgressStore)
    expect(() => store.saveRun('vectores', 'p/0', { questionIds: [], events: [] })).not.toThrow();
    expect(store.warning()).toBe(WARNINGS.runsWriteFailed);
  });

  it('lectura que falla y luego se recupera: el save aparta el documento anterior antes de escribir', () => {
    const storage = new FakeStorage();
    const antiguo = sampleDoc();
    storage.data.set(KEY, JSON.stringify(antiguo));
    storage.failGet = true;
    const store = createLocalStore(storage);
    expect(store.load('vectores')).toEqual(emptyDoc());
    storage.failGet = false;
    const nuevo = { ...emptyDoc(), attempts: [attempt(9)] };
    store.save('vectores', nuevo);
    // contract: ronda 1 punto 1 / spec sección 8, «no se pierde el documento anterior»
    const apartadas = storage.keysWith(`${KEY}:apartado:`);
    expect(apartadas).toHaveLength(1);
    expect(JSON.parse(storage.data.get(apartadas[0]) as string)).toEqual(antiguo);
    expect(createLocalStore(storage).load('vectores')).toEqual(nuevo);
    expect(store.warning()).toBe(WARNINGS.recovered);
  });

  it('lectura recuperada y copia imposible: el save no pisa el documento anterior', () => {
    const storage = new FakeStorage();
    storage.data.set(KEY, JSON.stringify(sampleDoc()));
    storage.failGet = true;
    const store = createLocalStore(storage);
    store.load('vectores');
    storage.failGet = false;
    storage.failSet = true;
    store.save('vectores', emptyDoc());
    // contract: ronda 1 punto 1, «seguir bloqueado si esa copia falla»
    expect(JSON.parse(storage.data.get(KEY) as string)).toEqual(sampleDoc());
    expect(store.warning()).toBe(WARNINGS.keptAside);
    storage.failSet = false;
    store.save('vectores', emptyDoc());
    expect(storage.keysWith(`${KEY}:apartado:`)).toHaveLength(1);
    expect(store.warning()).toBe(WARNINGS.recovered);
  });

  it('borradores: lectura que falla y se recupera aparta los borradores anteriores', () => {
    const storage = new FakeStorage();
    const antiguos = { q1: 'uno', q2: 'dos' };
    storage.data.set(`${KEY}:borradores`, JSON.stringify(antiguos));
    storage.failGet = true;
    const store = createLocalStore(storage);
    expect(store.loadDraft('vectores', 'q1')).toBeNull();
    store.saveDraft('vectores', 'q3', 'tres');
    storage.failGet = false;
    store.saveDraft('vectores', 'q4', 'cuatro');
    // contract: ronda 1 punto 1, el mismo camino para los borradores
    const apartadas = storage.keysWith('borradores:apartado:');
    expect(apartadas).toHaveLength(1);
    expect(JSON.parse(storage.data.get(apartadas[0]) as string)).toEqual(antiguos);
    expect(store.loadDraft('vectores', 'q3')).toBe('tres');
    expect(store.loadDraft('vectores', 'q4')).toBe('cuatro');
    expect(store.warning()).toBe(WARNINGS.draftsRecovered);
  });

  it('varias instancias sobre el mismo texto ilegible dejan una sola copia apartada', () => {
    const storage = new FakeStorage();
    storage.data.set(KEY, '{no json');
    storage.data.set(`${KEY}:borradores`, '[1,2');
    let clock = 1_800_000_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => (clock += 1000));
    for (let i = 0; i < 4; i += 1) {
      const store = createLocalStore(storage);
      store.load('vectores');
      store.loadDraft('vectores', 'q1');
    }
    // contract: ronda 1 punto 2, una recarga de página no añade copias del mismo texto
    expect(storage.keysWith(`${KEY}:apartado:`).map((k) => storage.data.get(k))).toEqual([
      '{no json',
    ]);
    expect(storage.keysWith('borradores:apartado:').map((k) => storage.data.get(k))).toEqual([
      '[1,2',
    ]);
  });

  it('un texto ilegible distinto sí genera otra copia, aunque sea en el mismo milisegundo', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
    const storage = new FakeStorage();
    storage.data.set(KEY, '{uno');
    createLocalStore(storage).load('vectores');
    storage.data.set(KEY, '{dos');
    createLocalStore(storage).load('vectores');
    // contract: ronda 1 punto 2, solo se deduplica el mismo texto
    expect(
      storage
        .keysWith(`${KEY}:apartado:`)
        .map((k) => storage.data.get(k))
        .sort(),
    ).toEqual(['{dos', '{uno']);
  });

  it('el aviso de escritura fallida se retira cuando una escritura posterior tiene éxito', () => {
    const storage = new FakeStorage();
    storage.failSet = true;
    const store = createLocalStore(storage);
    store.save('vectores', sampleDoc());
    expect(store.warning()).toBe(WARNINGS.writeFailed);
    storage.failSet = false;
    store.save('vectores', sampleDoc());
    // contract: ronda 1 punto 3, el aviso no sigue diciendo «se perderá» con el documento ya guardado
    expect(store.warning()).toBeNull();
    expect(createLocalStore(storage).load('vectores')).toEqual(sampleDoc());
  });

  it('el aviso de borradores se retira al recuperarse la escritura', () => {
    const storage = new FakeStorage();
    storage.failSet = true;
    const store = createLocalStore(storage);
    store.saveDraft('vectores', 'q1', 'a');
    expect(store.warning()).toBe(WARNINGS.draftsWriteFailed);
    storage.failSet = false;
    store.saveDraft('vectores', 'q1', 'b');
    // contract: ronda 1 punto 3
    expect(store.warning()).toBeNull();
  });

  it('nunca salen a la vez «copia guardada» y «copia no guardada»', () => {
    const storage = new FakeStorage();
    storage.data.set(KEY, '{no json');
    storage.failSet = true;
    const store = createLocalStore(storage);
    store.load('vectores');
    // contract: ronda 1 punto 3, avisos contradictorios
    expect(store.warning()).toBe(WARNINGS.keptAside);
    storage.failSet = false;
    store.save('vectores', sampleDoc());
    expect(store.warning()).toBe(WARNINGS.corrupt);
    expect(store.warning()).not.toContain(WARNINGS.keptAside);
  });

  it('un fallo de lectura pasajero no aparta lo que la propia sesión guardó', () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    let doc = sampleDoc();
    store.save('vectores', doc);
    for (let i = 0; i < 3; i += 1) {
      storage.failGet = true;
      const duringFailure = store.load('vectores');
      // contract: ronda 2 M1, la lectura fallida devuelve lo que la sesión guardó y avisa
      expect(duringFailure).toEqual(doc);
      expect(store.warning()).toBe(WARNINGS.readFailed);
      storage.failGet = false;
      doc = { ...doc, attempts: [...doc.attempts, attempt(10 + i)] };
      expect(store.load('vectores').attempts).toHaveLength(doc.attempts.length - 1);
      store.save('vectores', doc);
    }
    // contract: ronda 2 M1, ninguna copia apartada ni aviso `recovered` falso
    expect(storage.keysWith(':apartado:')).toEqual([]);
    expect(store.warning()).toBeNull();
    expect(createLocalStore(storage).load('vectores')).toEqual(doc);
  });

  it('M1: tres veces (load que falla, save) tras un save correcto no dejan ninguna copia apartada', () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    let doc = sampleDoc();
    store.save('vectores', doc);
    for (let i = 0; i < 3; i += 1) {
      storage.failGet = true;
      store.load('vectores');
      storage.failGet = false;
      doc = { ...doc, attempts: [...doc.attempts, attempt(20 + i)] };
      store.save('vectores', doc);
    }
    // contract: ronda 2 M1, secuencia reproducida: sin copias y sin `recovered` falso
    expect(storage.keysWith(':apartado:')).toEqual([]);
    expect(store.warning()).toBeNull();
    expect(createLocalStore(storage).load('vectores')).toEqual(doc);
  });

  it('F1: un load fallido y otro correcto no dejan al save pisar el documento antiguo sin copia', () => {
    const storage = new FakeStorage();
    const antiguo = sampleDoc();
    storage.data.set(KEY, JSON.stringify(antiguo));
    const store = createLocalStore(storage);
    storage.failGet = true;
    const derivedFromFirst = { ...store.load('vectores'), attempts: [attempt(9)] };
    storage.failGet = false;
    // contract: ronda 2 F1, el segundo load ve el documento antiguo...
    expect(store.load('vectores')).toEqual(antiguo);
    store.save('vectores', derivedFromFirst);
    // contract: ronda 2 F1, ...pero el save de lo derivado del primero aparta el antiguo y avisa
    const apartadas = storage.keysWith(`${KEY}:apartado:`);
    expect(apartadas).toHaveLength(1);
    expect(JSON.parse(storage.data.get(apartadas[0]) as string)).toEqual(antiguo);
    expect(createLocalStore(storage).load('vectores')).toEqual(derivedFromFirst);
    expect(store.warning()).toBe(WARNINGS.recovered);
  });

  it('F1: tras un load correcto, un fallo y otro correcto, el save derivado del primero no aparta nada', () => {
    const storage = new FakeStorage();
    const antiguo = sampleDoc();
    storage.data.set(KEY, JSON.stringify(antiguo));
    const store = createLocalStore(storage);
    const first = store.load('vectores');
    storage.failGet = true;
    // contract: ronda 2 F1, el documento de reserva es el último cargado
    expect(store.load('vectores')).toEqual(antiguo);
    storage.failGet = false;
    store.load('vectores');
    store.save('vectores', { ...first, attempts: [...first.attempts, attempt(9)] });
    expect(storage.keysWith(':apartado:')).toEqual([]);
    expect(store.warning()).toBeNull();
  });

  it('F1: con el documento vacío cargado, un fallo pasajero y un load correcto no apartan nada', () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    store.load('vectores');
    storage.failGet = true;
    store.load('vectores');
    storage.failGet = false;
    store.save('vectores', sampleDoc());
    // contract: ronda 2 F1, no había nada guardado, nada que apartar
    expect(storage.keysWith(':apartado:')).toEqual([]);
    expect(store.warning()).toBeNull();
  });

  it('M2: copia apartada correcta y escritura sin cuota: solo sale el aviso de escritura fallida', () => {
    const storage = new FakeStorage();
    storage.data.set(KEY, JSON.stringify(sampleDoc()));
    storage.failGet = true;
    const store = createLocalStore(storage);
    store.load('vectores');
    storage.failGet = false;
    storage.failSetOn = (key) => key === KEY;
    store.save('vectores', emptyDoc());
    // contract: ronda 2 M2, «se perderá al cerrar» y «copia guardada» no salen juntos
    expect(storage.keysWith(`${KEY}:apartado:`)).toHaveLength(1);
    expect(store.warning()).toBe(WARNINGS.writeFailed);
    storage.failSetOn = null;
    store.save('vectores', emptyDoc());
    expect(store.warning()).toBe(WARNINGS.recovered);
    expect(storage.keysWith(`${KEY}:apartado:`)).toHaveLength(1);
  });

  it('M3: un documento ilegible ya apartado y otro que no se puede apartar: solo sale «no se pudo apartar»', () => {
    const storage = new FakeStorage();
    storage.data.set(KEY, '{uno');
    const store = createLocalStore(storage);
    store.load('vectores');
    expect(store.warning()).toBe(WARNINGS.corrupt);
    storage.data.set(KEY, '{dos');
    storage.failSet = true;
    store.load('vectores');
    // contract: ronda 2 M3, con la copia pendiente el aviso «se guardó una copia» sería falso
    expect(store.warning()).toBe(WARNINGS.keptAside);
    storage.failSet = false;
    store.save('vectores', emptyDoc());
    expect(store.warning()).toBe(WARNINGS.corrupt);
  });

  it('M3: lo mismo por el camino del save tras una lectura fallida', () => {
    const storage = new FakeStorage();
    storage.data.set(KEY, '{uno');
    const store = createLocalStore(storage);
    store.load('vectores');
    storage.failGet = true;
    store.load('vectores');
    storage.failGet = false;
    storage.data.set(KEY, JSON.stringify(sampleDoc()));
    storage.failSet = true;
    store.save('vectores', emptyDoc());
    // contract: ronda 2 M3, `corrupt` previo + copia imposible = solo `keptAside`
    expect(store.warning()).toBe(WARNINGS.keptAside);
    expect(JSON.parse(storage.data.get(KEY) as string)).toEqual(sampleDoc());
  });

  it('el aviso `recovered` dice que lo anterior queda aparte', () => {
    // contract: ronda 2 M4, lo apartado es el progreso anterior; no «el progreso nuevo»
    expect(WARNINGS.recovered).not.toContain('el progreso nuevo se guarda aparte');
    expect(WARNINGS.recovered).toContain('Lo que había se ha guardado en una copia aparte');
  });

  it('dos juegos distintos no se mezclan', () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    const a = sampleDoc();
    const b = { ...emptyDoc(), attempts: [attempt(7)] };
    store.save('vectores', a);
    store.save('matrices', b);
    store.saveDraft('vectores', 'q1', 'uno');
    store.saveDraft('matrices', 'q1', 'dos');
    // contract: brief tarea 5, fila «Dos juegos distintos»
    expect(store.load('vectores')).toEqual(a);
    expect(store.load('matrices')).toEqual(b);
    expect(store.loadDraft('vectores', 'q1')).toBe('uno');
    expect(store.loadDraft('matrices', 'q1')).toBe('dos');
    expect(storage.data.has('ailearn:v1:local:matrices')).toBe(true);
  });

  it('2 000 intentos se conservan todos y en orden', () => {
    const storage = new FakeStorage();
    const store = createLocalStore(storage);
    const attempts = Array.from({ length: 2000 }, (_, i) => attempt(i));
    store.save('vectores', { ...emptyDoc(), attempts });
    // contract: brief tarea 5, fila «2 000 intentos guardados»
    const loaded = createLocalStore(storage).load('vectores');
    expect(loaded.attempts).toHaveLength(2000);
    expect(loaded.attempts).toEqual(attempts);
    expect(storage.keysWith(':apartado:')).toHaveLength(0);
  });

  it.each([
    ['contexto inválido', { context: 'otro' }],
    ['fecha inválida', { at: 'ayer por la tarde' }],
  ])('un intento con %s hace ilegible el documento', (_n, patch) => {
    const storage = new FakeStorage();
    const bad = { ...emptyDoc(), attempts: [{ ...attempt(1), ...patch }] };
    storage.data.set(KEY, JSON.stringify(bad));
    const store = createLocalStore(storage);
    // contract: brief tarea 5, «no cumple el esquema» -> vacío y copia apartada; `at` es ISO (tipo Attempt)
    expect(store.load('vectores')).toEqual(emptyDoc());
    expect(storage.keysWith(':apartado:')).toHaveLength(1);
  });
});

describe('migrate', () => {
  it('acepta la versión 1', () => {
    // contract: brief tarea 5, «migrate existe ya con la versión 1 como único caso»
    expect(migrate(sampleDoc())).toEqual(sampleDoc());
  });

  it.each([
    ['null', null],
    ['un número', 3],
    ['schema 99', { ...emptyDoc(), schema: 99 }],
    ['sin schema', { summary: emptySummary(), attempts: [] }],
    ['firsts 6', { ...emptyDoc(), summary: { ...emptySummary(), firsts: { 'a/0': 6 } } }],
    ['firsts negativo', { ...emptyDoc(), summary: { ...emptySummary(), firsts: { 'a/0': -1 } } }],
    ['firsts decimal', { ...emptyDoc(), summary: { ...emptySummary(), firsts: { 'a/0': 2.5 } } }],
    [
      'clave de firsts sin ejercicio',
      { ...emptyDoc(), summary: { ...emptySummary(), firsts: { a: 1 } } },
    ],
    [
      'clave de firsts con ejercicio 3',
      { ...emptyDoc(), summary: { ...emptySummary(), firsts: { 'a/3': 1 } } },
    ],
    ['attempts no es lista', { ...emptyDoc(), attempts: {} }],
  ])('devuelve null para %s', (_n, raw) => {
    // contract: brief tarea 5, «null si no se reconoce»; spec sección 5, marca por ejercicio 0..5
    expect(migrate(raw)).toBeNull();
  });
});
