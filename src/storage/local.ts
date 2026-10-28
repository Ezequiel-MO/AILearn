import { emptySummary } from '../engine/types';
import { migrate, renameLaunchId } from './migrate';
import type { ProgressDoc, ProgressStore } from './types';

// Avisos para el jugador. `storage` es una capa por debajo de `ui` y no puede importar de
// ella, así que los textos viven aquí y la pantalla los recibe ya redactados desde `warning()`.
export const WARNINGS = {
  unavailable:
    'Este navegador no deja guardar datos (¿modo privado?). Puedes jugar, pero el progreso se perderá al cerrar la página.',
  readFailed:
    'No se ha podido leer el progreso guardado. Puedes jugar, pero no se sobrescribirá lo anterior mientras no se pueda leer.',
  writeFailed:
    'No se ha podido guardar el progreso (¿almacenamiento lleno?). Puedes seguir jugando, pero se perderá al cerrar la página.',
  corrupt:
    'Los datos guardados estaban dañados o eran de una versión desconocida. Se ha guardado una copia aparte y se empieza de cero.',
  keptAside:
    'No se ha podido guardar una copia aparte de los datos anteriores, así que no se sobrescribirán. Puedes jugar, pero el progreso no se guardará.',
  recovered:
    'El progreso guardado no se pudo leer al empezar. Lo que había se ha guardado en una copia aparte y se sigue con el progreso actual.',
  draftsReadFailed:
    'No se han podido leer los borradores de código guardados. Puedes seguir, pero no se sobrescribirán los anteriores mientras no se puedan leer.',
  draftsWriteFailed:
    'No se han podido guardar los borradores de código (¿almacenamiento lleno?). Se perderán al cerrar la página.',
  draftsCorrupt:
    'Los borradores de código guardados estaban dañados. Se ha guardado una copia aparte; tu progreso no se ha tocado.',
  draftsKeptAside:
    'No se ha podido guardar una copia aparte de los borradores anteriores, así que no se sobrescribirán. Los borradores nuevos no se guardarán.',
  draftsRecovered:
    'Los borradores de código guardados no se pudieron leer al empezar. Se ha guardado una copia aparte de lo que había; tu progreso no se ha tocado.',
  runsReadFailed:
    'No se ha podido leer dónde dejaste los ejercicios a medias. Puedes seguir, pero no se sobrescribirá lo anterior mientras no se pueda leer.',
  runsWriteFailed:
    'No se ha podido guardar por qué pregunta vas (¿almacenamiento lleno?). Si sales del ejercicio, tendrás que empezarlo de nuevo.',
  runsCorrupt:
    'Lo guardado de los ejercicios a medias estaba dañado. Se ha guardado una copia aparte; tu progreso no se ha tocado.',
  runsKeptAside:
    'No se ha podido guardar una copia aparte de los ejercicios a medias anteriores, así que no se sobrescribirán. No se guardará por qué pregunta vas.',
  runsRecovered:
    'Lo guardado de los ejercicios a medias no se pudo leer al empezar. Se ha guardado una copia aparte de lo que había; tu progreso no se ha tocado.',
} as const;

interface SlotTexts {
  readFailed: string;
  writeFailed: string;
  corrupt: string;
  keptAside: string;
  recovered: string;
}

const PROGRESS_TEXTS: SlotTexts = {
  readFailed: WARNINGS.readFailed,
  writeFailed: WARNINGS.writeFailed,
  corrupt: WARNINGS.corrupt,
  keptAside: WARNINGS.keptAside,
  recovered: WARNINGS.recovered,
};

const DRAFTS_TEXTS: SlotTexts = {
  readFailed: WARNINGS.draftsReadFailed,
  writeFailed: WARNINGS.draftsWriteFailed,
  corrupt: WARNINGS.draftsCorrupt,
  keptAside: WARNINGS.draftsKeptAside,
  recovered: WARNINGS.draftsRecovered,
};

const RUNS_TEXTS: SlotTexts = {
  readFailed: WARNINGS.runsReadFailed,
  writeFailed: WARNINGS.runsWriteFailed,
  corrupt: WARNINGS.runsCorrupt,
  keptAside: WARNINGS.runsKeptAside,
  recovered: WARNINGS.runsRecovered,
};

const PREFIX = 'ailearn:v1:local:';

/** Un valor guardado bajo una clave, con su copia en memoria y su estado de avisos. */
interface Slot<T> {
  load(): T;
  save(value: T): void;
  /** Avisos vigentes de este valor. */
  messages(): string[];
}

/** Lo que impide escribir con seguridad: nunca se pisa algo que no se ha leído o apartado. */
type Problem = null | 'read' | 'aside' | 'write';

const getGlobalStorage = (): Storage | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

export const createLocalStore = (injected?: Storage): ProgressStore => {
  const storage: Storage | null = injected ?? getGlobalStorage();
  const slots: Slot<unknown>[] = [];

  /** ¿Existe ya una copia apartada con este texto exacto? Nunca lanza. */
  const hasAside = (prefix: string, raw: string): boolean => {
    if (storage === null) return false;
    try {
      for (let i = 0; i < storage.length; i += 1) {
        const k = storage.key(i);
        if (k !== null && k.startsWith(prefix) && storage.getItem(k) === raw) return true;
      }
    } catch {
      // Sin poder mirar, se intenta escribir la copia.
    }
    return false;
  };

  const makeSlot = <T>(
    key: string,
    texts: SlotTexts,
    parse: (raw: string) => T | null,
    empty: () => T,
  ): Slot<T> => {
    const asidePrefix = `${key}:apartado:`;
    let memory: T | undefined;
    /** La copia en memoria tiene algo que el almacenamiento no. */
    let dirty = false;
    let problem: Problem = null;
    /** Aviso informativo que dura toda la sesión. */
    let notice: 'corrupt' | 'recovered' | null = null;
    /**
     * Texto que hay en la clave y del que deriva el documento que la sesión tiene en las manos:
     * lo último leído sin sospecha o escrito por este slot. `undefined`: no se sabe.
     */
    let known: string | null | undefined;
    /**
     * Un `load` falló (lectura bloqueada o copia imposible): el llamante puede tener en las manos
     * un documento de reserva que no deriva de lo guardado. Hasta el siguiente `save` correcto,
     * los `load` ya no actualizan `known`, y el `save` aparta cualquier texto distinto de `known`.
     */
    let suspect = false;

    /** Guarda una copia del texto original, sin duplicarla. Devuelve si la copia existe. */
    const preserve = (raw: string): boolean => {
      if (storage === null) return false;
      if (hasAside(asidePrefix, raw)) return true;
      try {
        // La clave no se reutiliza: dos textos apartados en el mismo milisegundo no se pisan.
        let stamp = Date.now();
        while (storage.getItem(`${asidePrefix}${stamp}`) !== null) stamp += 1;
        storage.setItem(`${asidePrefix}${stamp}`, raw);
        return true;
      } catch {
        return false;
      }
    };

    const slot: Slot<T> = {
      load() {
        if (dirty && memory !== undefined) return memory;
        if (storage === null) return memory ?? empty();
        let raw: string | null;
        try {
          raw = storage.getItem(key);
        } catch {
          problem = 'read';
          suspect = true;
          return memory ?? empty();
        }
        if (raw === null) {
          problem = null;
          if (!suspect) {
            known = null;
            memory = undefined;
          }
          return empty();
        }
        const value = parse(raw);
        if (value !== null) {
          problem = null;
          if (!suspect) {
            known = raw;
            memory = value;
          }
          return value;
        }
        // Ilegible: copia del texto original aparte; el original se queda donde está
        // hasta el siguiente `save`.
        if (preserve(raw)) {
          problem = null;
          notice = 'corrupt';
          if (!suspect) {
            known = raw;
            memory = undefined;
          }
        } else {
          problem = 'aside';
          suspect = true;
        }
        return empty();
      },
      save(value) {
        memory = value;
        if (storage === null) return;
        if (suspect) {
          // La sesión puede no haber visto lo que hay guardado: si no es el texto del que
          // deriva el documento, se aparta antes de escribir encima.
          let raw: string | null;
          try {
            raw = storage.getItem(key);
          } catch {
            problem = 'read';
            dirty = true;
            return;
          }
          if (raw !== null && raw !== known) {
            if (!preserve(raw)) {
              problem = 'aside';
              dirty = true;
              return;
            }
            notice = parse(raw) === null ? 'corrupt' : 'recovered';
          }
          problem = null;
          suspect = false;
        }
        try {
          const text = JSON.stringify(value);
          storage.setItem(key, text);
          known = text;
          dirty = false;
          problem = null;
        } catch {
          dirty = true;
          problem = 'write';
        }
      },
      messages() {
        const out: string[] = [];
        if (problem === 'read') out.push(texts.readFailed);
        if (problem === 'aside') out.push(texts.keptAside);
        if (problem === 'write') out.push(texts.writeFailed);
        // Con la copia pendiente o la escritura fallida, «se guardó una copia» no es lo
        // importante (ni, en el primer caso, cierto): no se muestra.
        if (problem !== 'aside' && problem !== 'write' && notice !== null) out.push(texts[notice]);
        return out;
      },
    };
    slots.push(slot as Slot<unknown>);
    return slot;
  };

  const parseJson = (raw: string): unknown => {
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  };

  const parseDoc = (raw: string): ProgressDoc | null => migrate(parseJson(raw));

  const parseDrafts = (raw: string): Record<string, string> | null => {
    const value = parseJson(raw);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const entries = Object.entries(value);
    if (!entries.every(([, v]) => typeof v === 'string')) return null;
    // Los borradores guardados con el nombre antiguo del despegue (`piscina.N`) pasan al nuevo.
    return Object.fromEntries(entries.map(([k, v]) => [renameLaunchId(k), v])) as Record<
      string,
      string
    >;
  };

  /** Cada tanda se guarda tal cual; el motor la valida al retomarla (`resumeSession`). */
  const parseRuns = (raw: string): Record<string, unknown> | null => {
    const value = parseJson(raw);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  };

  const emptyDoc = (): ProgressDoc => ({ schema: 1, summary: emptySummary(), attempts: [] });

  const docSlots = new Map<string, Slot<ProgressDoc>>();
  const draftSlots = new Map<string, Slot<Record<string, string>>>();
  const runSlots = new Map<string, Slot<Record<string, unknown>>>();

  const docSlot = (gameId: string): Slot<ProgressDoc> => {
    let slot = docSlots.get(gameId);
    if (slot === undefined) {
      const key = `${PREFIX}${gameId}`;
      slot = makeSlot(key, PROGRESS_TEXTS, parseDoc, emptyDoc);
      docSlots.set(gameId, slot);
    }
    return slot;
  };

  const draftSlot = (gameId: string): Slot<Record<string, string>> => {
    let slot = draftSlots.get(gameId);
    if (slot === undefined) {
      const key = `${PREFIX}${gameId}:borradores`;
      slot = makeSlot(key, DRAFTS_TEXTS, parseDrafts, () => ({}));
      draftSlots.set(gameId, slot);
    }
    return slot;
  };

  const runSlot = (gameId: string): Slot<Record<string, unknown>> => {
    let slot = runSlots.get(gameId);
    if (slot === undefined) {
      const key = `${PREFIX}${gameId}:tandas`;
      slot = makeSlot(key, RUNS_TEXTS, parseRuns, () => ({}));
      runSlots.set(gameId, slot);
    }
    return slot;
  };

  return {
    load: (gameId) => docSlot(gameId).load(),
    save: (gameId, doc) => docSlot(gameId).save(doc),
    loadDraft: (gameId, questionId) => {
      const drafts = draftSlot(gameId).load();
      return Object.hasOwn(drafts, questionId) ? drafts[questionId] : null;
    },
    saveDraft: (gameId, questionId, code) => {
      const slot = draftSlot(gameId);
      slot.save({ ...slot.load(), [questionId]: code });
    },
    loadRun: (gameId, runId) => {
      const runs = runSlot(gameId).load();
      return Object.hasOwn(runs, runId) ? runs[runId] : null;
    },
    saveRun: (gameId, runId, run) => {
      const slot = runSlot(gameId);
      const runs = slot.load();
      if (run === null) {
        if (!Object.hasOwn(runs, runId)) return;
        const rest = { ...runs };
        delete rest[runId];
        slot.save(rest);
      } else {
        slot.save({ ...runs, [runId]: run });
      }
    },
    warning: () => {
      const all = [
        ...(storage === null ? [WARNINGS.unavailable] : []),
        ...slots.flatMap((slot) => slot.messages()),
      ];
      const distinct = [...new Set(all)];
      return distinct.length === 0 ? null : distinct.join(' ');
    },
  };
};
