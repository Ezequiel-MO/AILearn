import type { Summary } from '../engine/types';

export interface Attempt {
  /** Id de la pregunta. */
  q: string;
  /** Fecha del intento, ISO 8601. */
  at: string;
  correct: boolean;
  /** Entregas hechas en esta pregunta. */
  submissions: number;
  hinted: boolean;
  context: 'despegue' | 'proyecto' | 'hoja' | 'examen';
}

export interface ProgressDoc {
  schema: 1;
  summary: Summary;
  /** Solo crece: el repaso espaciado futuro lo necesita entero. */
  attempts: Attempt[];
}

export interface ProgressStore {
  /** Nunca lanza; devuelve un documento vacío si no hay nada o no se puede leer. */
  load(gameId: string): ProgressDoc;
  /** Nunca lanza. */
  save(gameId: string, doc: ProgressDoc): void;
  loadDraft(gameId: string, questionId: string): string | null;
  saveDraft(gameId: string, questionId: string, code: string): void;
  /** Aviso pendiente para el jugador (en castellano), o null. */
  warning(): string | null;
  /**
   * Avisa cuando el progreso de un juego cambia por fuera de `save` (p. ej. al traerlo de la nube).
   * Devuelve la baja. Opcional: el almacén local no lo necesita.
   */
  onExternalChange?(listener: (gameId: string) => void): () => void;
}
