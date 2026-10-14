import { z } from 'zod';
import type { Summary } from '../engine/types';
import type { Attempt, ProgressDoc } from './types';

const summarySchema = z.object({
  launch: z.boolean(),
  // Clave `<proyecto>/<0|1|2>`, valor 0..5.
  firsts: z.record(z.string().regex(/^.+\/[012]$/), z.number().int().min(0).max(5)),
  examsPassed: z.array(z.number().int().min(0)),
  sheets: z.array(z.string()),
});

const attemptSchema = z.object({
  q: z.string(),
  at: z.iso.datetime({ offset: true }),
  correct: z.boolean(),
  submissions: z.number().int().min(0),
  hinted: z.boolean(),
  context: z.enum(['despegue', 'proyecto', 'hoja', 'examen']),
});

export const progressSchemaV1 = z.object({
  schema: z.literal(1),
  summary: summarySchema,
  attempts: z.array(attemptSchema),
});

// Ata el esquema a los tipos: si `Summary`, `Attempt` o `ProgressDoc` cambian y el
// esquema no, esta comprobación deja de compilar (en ambos sentidos).
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const summaryMatches: Equal<z.infer<typeof summarySchema>, Summary> = true;
const attemptMatches: Equal<z.infer<typeof attemptSchema>, Attempt> = true;
const docMatches: Equal<z.infer<typeof progressSchemaV1>, ProgressDoc> = true;
void [summaryMatches, attemptMatches, docMatches];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Id de pregunta guardado con el nombre antiguo del despegue (`piscina.N`). */
export const renameLaunchId = (id: string): string =>
  id.startsWith('piscina.') ? `despegue.${id.slice('piscina.'.length)}` : id;

/**
 * El renombrado «Piscina» → «Despegue» no cambió la versión del formato: un documento v1 guardado
 * antes lleva `summary.piscina`, intentos con `context: 'piscina'` y ids `piscina.N`. Se lee
 * como el nuevo; si `summary.launch` ya existe, manda este. Lo que no es un documento
 * reconocible se devuelve tal cual para que el esquema lo rechace.
 */
const renameLaunch = (raw: unknown): unknown => {
  if (!isRecord(raw)) return raw;
  let { summary, attempts } = raw;
  if (isRecord(summary) && 'piscina' in summary) {
    const { piscina, ...rest } = summary;
    summary = 'launch' in rest ? rest : { ...rest, launch: piscina };
  }
  if (Array.isArray(attempts)) {
    attempts = attempts.map((a: unknown) => {
      if (!isRecord(a)) return a;
      return {
        ...a,
        ...(typeof a.q === 'string' ? { q: renameLaunchId(a.q) } : {}),
        ...(a.context === 'piscina' ? { context: 'despegue' } : {}),
      };
    });
  }
  return { ...raw, summary, attempts };
};

/**
 * Convierte lo leído del almacenamiento en un documento actual, o `null` si no se
 * reconoce. La versión 1 es el único caso (con los nombres antiguos del despegue
 * traducidos); la versión 2 añadirá aquí su rama (leer la 2 tal cual y, para la 1,
 * transformarla).
 */
export const migrate = (raw: unknown): ProgressDoc | null => {
  const parsed = progressSchemaV1.safeParse(renameLaunch(raw));
  return parsed.success ? parsed.data : null;
};
