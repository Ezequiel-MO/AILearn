import { describe, expect, it } from 'vitest';
import { loadPrefs, PREFS_KEY, savePrefs } from './prefs';

const memoryStorage = (initial: Record<string, string> = {}): Storage => {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
};

describe('prefs', () => {
  it('sin nada guardado, el juego suena', () => {
    // contract: brief «juego más visual»: sonido activado por defecto
    expect(loadPrefs(memoryStorage())).toEqual({ sound: true });
  });

  it('guarda y relee el sonido apagado', () => {
    const storage = memoryStorage();
    savePrefs({ sound: false }, storage);
    // contract: clave única de ajustes, fuera de las claves de progreso de cada juego
    expect(storage.getItem(PREFS_KEY)).toBe('{"sound":false}');
    expect(loadPrefs(storage)).toEqual({ sound: false });
  });

  it('lo dañado vale como lo de por defecto', () => {
    // contract: los ajustes no son progreso: lo ilegible no se aparta ni se avisa
    expect(loadPrefs(memoryStorage({ [PREFS_KEY]: '{roto' }))).toEqual({ sound: true });
    expect(loadPrefs(memoryStorage({ [PREFS_KEY]: '{"sound":"no"}' }))).toEqual({ sound: true });
  });

  it('un almacenamiento que lanza no rompe nada', () => {
    const broken = memoryStorage();
    broken.getItem = () => {
      throw new Error('bloqueado');
    };
    broken.setItem = () => {
      throw new Error('lleno');
    };
    // contract: sin almacenamiento, los ajustes viven en memoria
    expect(loadPrefs(broken)).toEqual({ sound: true });
    expect(() => savePrefs({ sound: false }, broken)).not.toThrow();
  });
});
