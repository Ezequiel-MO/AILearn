import { describe, expect, it } from 'vitest';
import { createLocalStore } from './local';
import { migrate } from './migrate';

const KEY = 'ailearn:v1:local:vectores';

/** Almacenamiento mínimo en memoria. */
const memoryStorage = (): Storage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
};

const at = (n: number): string => new Date(Date.UTC(2026, 9, 13, 12, 0, n)).toISOString();

/** Un documento v1 tal como lo guardaba la versión con Piscina y Círculo (campo `piscina`, contexto `piscina`, ids `piscina.N`). */
const oldDoc = () => ({
  schema: 1,
  summary: {
    piscina: true,
    firsts: { 'componentes/0': 5, 'componentes/1': 3 },
    examsPassed: [0],
    sheets: ['h1'],
  },
  attempts: [
    { q: 'piscina.1', at: at(1), correct: true, submissions: 1, hinted: false, context: 'piscina' },
    {
      q: 'piscina.10',
      at: at(2),
      correct: false,
      submissions: 2,
      hinted: true,
      context: 'piscina',
    },
    {
      q: 'componentes.1',
      at: at(3),
      correct: true,
      submissions: 1,
      hinted: false,
      context: 'proyecto',
    },
    { q: 'h1.1', at: at(4), correct: true, submissions: 1, hinted: false, context: 'hoja' },
    { q: 'examen-0.2', at: at(5), correct: true, submissions: 1, hinted: false, context: 'examen' },
  ],
});

/** El mismo progreso con los nombres nuevos. */
const newDoc = () => ({
  schema: 1,
  summary: {
    launch: true,
    firsts: { 'componentes/0': 5, 'componentes/1': 3 },
    examsPassed: [0],
    sheets: ['h1'],
  },
  attempts: [
    {
      q: 'despegue.1',
      at: at(1),
      correct: true,
      submissions: 1,
      hinted: false,
      context: 'despegue',
    },
    {
      q: 'despegue.10',
      at: at(2),
      correct: false,
      submissions: 2,
      hinted: true,
      context: 'despegue',
    },
    {
      q: 'componentes.1',
      at: at(3),
      correct: true,
      submissions: 1,
      hinted: false,
      context: 'proyecto',
    },
    { q: 'h1.1', at: at(4), correct: true, submissions: 1, hinted: false, context: 'hoja' },
    { q: 'examen-0.2', at: at(5), correct: true, submissions: 1, hinted: false, context: 'examen' },
  ],
});

describe('migrate: progreso guardado con Piscina y Círculo', () => {
  it('un documento antiguo se lee con los nombres nuevos', () => {
    // contract: renombrado despegue/órbita; summary.piscina pasa a summary.launch, el contexto piscina a despegue y los ids piscina.N a despegue.N
    expect(migrate(oldDoc())).toEqual(newDoc());
  });

  it('un documento ya nuevo no cambia', () => {
    // contract: renombrado despegue/órbita; lo escrito con los nombres nuevos se lee igual
    expect(migrate(newDoc())).toEqual(newDoc());
  });

  it('solo cambian los ids que empiezan por «piscina.»', () => {
    const doc = oldDoc();
    doc.attempts[2] = { ...doc.attempts[2]!, q: 'x-piscina.1' };
    // contract: renombrado despegue/órbita; solo el prefijo `piscina.` de un id es del despegue
    expect(migrate(doc)?.attempts[2]?.q).toBe('x-piscina.1');
  });

  it('con summary.launch y summary.piscina a la vez, manda summary.launch', () => {
    const doc = oldDoc();
    const both = { ...doc, summary: { ...doc.summary, launch: false } };
    // contract: renombrado despegue/órbita; el campo nuevo gana al antiguo si están los dos
    expect(migrate(both)?.summary.launch).toBe(false);
  });
});

describe('createLocalStore: progreso guardado con Piscina y Círculo', () => {
  it('carga un documento antiguo sin apartarlo y con el progreso intacto', () => {
    const storage = memoryStorage();
    storage.setItem(KEY, JSON.stringify(oldDoc()));
    const store = createLocalStore(storage);
    // contract: renombrado despegue/órbita; el progreso de Oliver se conserva entero
    expect(store.load('vectores')).toEqual(newDoc());
    // contract: renombrado despegue/órbita; un documento antiguo NO es un documento dañado
    expect(store.warning()).toBeNull();
    expect([...storage.data.keys()].filter((k) => k.includes(':apartado:'))).toEqual([]);
  });

  it('guardado y releído, el documento sigue intacto y ya con los nombres nuevos', () => {
    const storage = memoryStorage();
    storage.setItem(KEY, JSON.stringify(oldDoc()));
    const store = createLocalStore(storage);
    store.save('vectores', store.load('vectores'));
    // contract: renombrado despegue/órbita; lo guardado ya no lleva ningún nombre antiguo
    expect(JSON.parse(storage.data.get(KEY) as string)).toEqual(newDoc());
    const again = createLocalStore(storage);
    expect(again.load('vectores')).toEqual(newDoc());
    expect(again.warning()).toBeNull();
    expect([...storage.data.keys()].filter((k) => k.includes(':apartado:'))).toEqual([]);
  });

  it('los borradores con clave «piscina.N» pasan a «despegue.N» y los demás se quedan', () => {
    const storage = memoryStorage();
    storage.setItem(
      `${KEY}:borradores`,
      JSON.stringify({ 'piscina.7': 'a = 1\n', 'componentes.3': 'b = 2\n' }),
    );
    const store = createLocalStore(storage);
    // contract: renombrado despegue/órbita; el borrador de una pregunta del despegue sigue ligado a ella
    expect(store.loadDraft('vectores', 'despegue.7')).toBe('a = 1\n');
    expect(store.loadDraft('vectores', 'componentes.3')).toBe('b = 2\n');
    expect(store.loadDraft('vectores', 'piscina.7')).toBeNull();
    expect(store.warning()).toBeNull();
    expect([...storage.data.keys()].filter((k) => k.includes(':apartado:'))).toEqual([]);
  });
});
