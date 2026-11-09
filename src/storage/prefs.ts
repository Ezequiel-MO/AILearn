// Ajustes del jugador en este navegador, comunes a todos los juegos. No suben a la nube ni son progreso:
// si la clave falta o está dañada, valen los de por defecto y no se avisa.

export const PREFS_KEY = 'ailearn:v1:ajustes';

export interface Prefs {
  /** Si el juego suena (aciertos, fallos, subidas de nivel). */
  sound: boolean;
}

export const defaultPrefs = (): Prefs => ({ sound: true });

const storageOf = (injected?: Storage): Storage | null => {
  if (injected) return injected;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

export const loadPrefs = (injected?: Storage): Prefs => {
  const prefs = defaultPrefs();
  try {
    const raw = storageOf(injected)?.getItem(PREFS_KEY);
    if (!raw) return prefs;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      const { sound } = parsed as { sound?: unknown };
      if (typeof sound === 'boolean') prefs.sound = sound;
    }
  } catch {
    // Ilegible: los de por defecto.
  }
  return prefs;
};

/** Guarda los ajustes. Si el navegador no deja, siguen valiendo en memoria hasta recargar. */
export const savePrefs = (prefs: Prefs, injected?: Storage): void => {
  try {
    storageOf(injected)?.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Sin almacenamiento: no pasa nada.
  }
};
