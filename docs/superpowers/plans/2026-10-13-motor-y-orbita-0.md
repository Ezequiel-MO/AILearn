# Motor de la trayectoria, Despegue y Órbita 0 del juego 1: plan de implementación

> **Para quien lo ejecute:** SUB-SKILL OBLIGATORIA: `superpowers:subagent-driven-development`, con los roles y reglas del `CLAUDE.md` global del propietario (`implementer`, `spec-reviewer`, canalización de tareas con ficheros disjuntos, revisión por riesgo). Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** que el propietario juegue en el navegador el despegue y la Órbita 0 de «Vectores y embeddings», con examen, Python real y progreso guardado.

**Arquitectura:** sitio estático. Las reglas de la trayectoria son TypeScript puro en `src/engine`. El contenido es dato serializable validado con Zod. El Python del jugador corre con Pyodide en un Web Worker, y el mismo núcleo de ejecución se usa en las pruebas sobre Node. El progreso pasa por una única interfaz sobre `localStorage`.

**Stack:** Vite, TypeScript estricto, React, React Router (rutas hash), Pyodide, CodeMirror 6, KaTeX, Zod, Vitest, Playwright, ESLint, Prettier.

**Spec:** `docs/superpowers/specs/2026-10-13-motor-y-juego-1-vectores-design.md`. Quien ejecute una tarea lee el spec y su tarea.

## Cómo leer este plan

- El plan fija reglas, ficheros, interfaces, valores esperados y la comprobación de cada tarea. **No trae la implementación escrita**: la escribe el implementador. Esto sigue la regla del propietario y sustituye al «código completo en cada paso» de la skill.
- Los bloques de código de este plan son **contratos** (tipos y firmas) o expresiones donde la expresión exacta es la decisión. Todos están **sin verificar** hasta que compilen o pase su prueba. Si un contrato no compila o resulta incómodo, el implementador lo ajusta y lo dice en su informe; no lo rodea en silencio.
- Cada tarea sigue TDD: primero la prueba que falla, luego el código mínimo, luego la comprobación, luego un commit con solo sus ficheros, añadidos por nombre.
- Un implementador que pase de unas 60 llamadas a herramientas informa en su siguiente punto de control para que la sesión principal divida lo que queda.

## Restricciones globales

- Node 22 y npm 10 (lo instalado: Node 22.21.0, npm 10.9.4).
- Versiones observadas el 2026-10-13 con `npm view`: vite 8.3.4, react 19.3.0, zod 4.6.7, vitest 5.0.4, @playwright/test 1.64.0, pyodide 314.0.7. La tarea 1 instala las actuales y `package-lock.json` las fija. La versión de Pyodide se escribe además como constante, porque la URL de su CDN la lleva.
- TypeScript en modo `strict`. Sin `any` salvo en la frontera con Pyodide.
- `src/engine` no importa nada de fuera de `src/engine`. Una regla de ESLint lo impone (tarea 1).
- Ninguna regla de puntuación o desbloqueo fuera de `src/engine`.
- Solo `src/storage` toca `localStorage`.
- El contenido no contiene funciones.
- Todo texto visible está en castellano. Los identificadores del código, en inglés. Los textos fijos de la interfaz viven en `src/ui/strings.ts`.
- Los decimales se muestran con coma y se aceptan con coma o con punto.
- Sin librería de estado global, sin librería de gráficos para el plano y sin librería de internacionalización.
- Tipografías servidas desde el propio sitio. Ninguna llamada a red en tiempo de juego salvo la descarga de Pyodide y sus paquetes.
- Constantes de las reglas, copiadas del spec: validación 80; proyecto de 3 ejercicios de 5 preguntas; examen de 6 preguntas, aprobado con 5; XP 50 por el despegue, 50 por examen, 10 por hoja; nivel = XP / 150 con dos decimales.
- Clave de progreso `ailearn:v1:local:<juego>`.
- No se crea remoto de git ni se despliega.

## Decisiones de este plan que precisan el spec

El propietario debe conocerlas porque el spec no las fijaba:

1. **La mejor marca se guarda por ejercicio, no por proyecto.** Se guarda el mejor número de aciertos a la primera (0 a 5) de cada ejercicio, y la nota del proyecto es `round(100 × suma de los tres / 15)`. Así se puede hacer un ejercicio por sesión, y recargar la página a mitad solo reinicia ese ejercicio. Es algo más benévolo que rehacer las 15 preguntas seguidas.
2. **Un examen interrumpido no cuenta como suspenso.** Al volver se sortea un examen nuevo.
3. **El examen reparte sus 6 preguntas por igual entre los proyectos de la órbita** (2 por proyecto en la Órbita 0), para que el panel pueda decir qué proyecto repasar.
4. **Los generadores de preguntas viven en `src/content`**, que es código compartido por todos los juegos. El spec decía «en el motor»; `src/engine` queda solo para reglas.
5. **Una entrada que no es un número no gasta intento.** Se avisa y se deja corregir.
6. **Tipografías:** IBM Plex Sans para texto e IBM Plex Mono para código y números, instaladas con `@fontsource`.

## Foco de revisión

Situaciones que el spec implica y que más pueden morder al jugador. Cada una tiene su prueba en la tarea indicada.

1. **Número con coma, espacios, signo menos tipográfico o texto.** Se espera que `3,5`, ` 3.5 ` y `−3,5` valgan y que `abc` o un campo vacío avisen sin gastar intento. Tarea 3.
2. **Bucle infinito en el código del jugador.** Se espera que la página siga respondiendo, que aparezca un mensaje de tiempo agotado y que la siguiente ejecución funcione. Tareas 6 y 11.
3. **Almacenamiento no disponible, lleno o con datos corruptos.** Se espera poder jugar igualmente, ver un aviso y no perder el documento anterior. Tarea 5.
4. **Python no carga (sin conexión).** Se espera un mensaje claro con botón de reintento, y que las preguntas que no son de código sigan funcionando. Tarea 11.
5. **Recarga a mitad de ejercicio.** Se espera conservar el borrador de código y las marcas de los ejercicios ya entregados; solo se reinicia el ejercicio en curso. Tareas 5 y 13.

## Estructura de ficheros

```
index.html
package.json  vite.config.ts  tsconfig.json  eslint.config.js  .prettierrc  playwright.config.ts
src/
  main.tsx  App.tsx
  engine/
    types.ts        Summary, constantes de las reglas
    progression.ts       Nota, validación, apertura, XP, nivel
    session.ts      Máquina de estados de una tanda de preguntas
    rng.ts          Generador pseudoaleatorio con semilla
    vectors.ts      Operaciones y métricas de vectores
  content/
    schema.ts       Esquemas Zod y tipos del contenido
    grade.ts        Corrección de respuestas que no son código; parseNumber
    generators.ts   Registro de generadores y generadores de vectores
    exam.ts         Sorteo de examen
    validate.ts     Comprobaciones de contenido reutilizables por las pruebas
  python/
    config.ts       Versión y URL de Pyodide, tiempo límite
    harness.ts      Código Python del arnés, como texto
    core.ts         runInPyodide: ejecutar y corregir, sin depender del entorno
    worker.ts       Web Worker
    runner.ts       Interfaz para la interfaz de usuario; tiempo límite y recreación
    node.ts         Carga de Pyodide en Node para las pruebas
  storage/
    types.ts        ProgressDoc, Attempt, ProgressStore
    local.ts        Implementación sobre localStorage
    migrate.ts      Migración entre versiones
  ui/
    theme.css  strings.ts  format.ts
    Md.tsx  Layout.tsx  VectorPlane.tsx  CodeEditor.tsx
    questions/      Un componente por tipo de pregunta y QuestionView
    ExerciseRunner.tsx
    screens/        Hub, GameMap, ProjectPanel, LaunchScreen, ExerciseScreen,
                    SheetScreen, ExamScreen, StatsScreen
    useProgress.ts  Acceso al progreso desde las pantallas
  games/
    index.ts        Registro de juegos
    vectores/
      index.ts  toy.ts  despegue.ts  componentes.ts  suma-escala.ts
      norma-distancia.ts  examen-0.ts
tests/
  content/games.test.ts      Pruebas genéricas sobre todo juego registrado
  content/python.test.ts     Referencias de las preguntas de código, en Pyodide sobre Node
  e2e/smoke.spec.ts
```

Las pruebas unitarias van junto a su fichero (`progression.test.ts` al lado de `progression.ts`).

## Orden, dependencias y revisión

| Tarea | Depende de | Revisión |
|---|---|---|
| 1 Andamiaje | — | En lote con la 2 |
| 2 Reglas de la trayectoria | 1 | `spec-reviewer` (reglas de puntuación), con la 1 |
| 3 Esquema, vectores y corrección | 1 | En lote con la 4 |
| 4 Máquina de la tanda | 2 | `spec-reviewer`, con la 3 |
| 5 Persistencia | 2 | `spec-reviewer` propio (persistencia) |
| 6 Python: núcleo, worker y Node | 1 | `spec-reviewer` propio |
| 7 Generadores y examen | 3 | En lote con la 8 |
| 8 Pruebas genéricas de contenido | 3, 6, 7 | `spec-reviewer`, con la 7 |
| 9 Base visual y plano de vectores | 1, 3 | `spec-reviewer` propio (maquetación) |
| 10 Componentes de pregunta | 3, 9 | En lote con la 12 |
| 11 Pregunta de código | 6, 9 | `spec-reviewer` propio |
| 12 Ejecutor de tandas | 4, 10, 11 | `spec-reviewer`, con la 10 (maquetación) |
| 13 Pantallas de juego y guardado | 5, 7, 12 | `spec-reviewer` propio (persistencia) |
| 14 Mapa, panel y estadísticas | 13 | En lote con la 13 |
| 15 Contenido: Despegue y Componentes | 8 | `spec-reviewer` propio (corrección matemática); es el ejemplo para 16 y 17 |
| 16 Contenido: Suma y escala | 15 | En lote con la 18 |
| 17 Contenido: Norma y distancia | 15 | En lote con la 18 |
| 18 Banco de examen y registro | 16, 17 | `spec-reviewer` (corrección matemática), con 16 y 17 |
| 19 Humo en navegador y README | todas | `code-reviewer` de la rama entera |

Canalización posible, por ficheros disjuntos: 2, 3 y 6 a la vez tras la 1. Las tareas de contenido 15 a 18 pueden avanzar en paralelo con las de interfaz 9 a 14 en cuanto la 8 esté hecha. 16 y 17 van en paralelo entre sí: ninguna toca `src/games/vectores/index.ts`. Nunca más de 4 subagentes a la vez.

Cada defecto que encuentre un revisor se convierte, en la misma ronda de arreglo, en una prueba que lo detecte.

---

### Tarea 1: Andamiaje

**Ficheros:** crear `package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `.gitignore`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/ui/theme.css`, `src/ui/strings.ts`, `src/App.test.tsx`.

**Produce:**
- Guiones de npm: `dev`, `build` (ejecuta `check` antes), `preview`, `test` (Vitest, una pasada), `check` (`tsc --noEmit` y ESLint), `format`.
- Vitest con entorno `jsdom` para ficheros `.test.tsx` y `node` para `.test.ts`; React Testing Library instalada.
- React Router con rutas hash y una ruta `/` que muestra el título «AIlearn».
- `src/ui/strings.ts`: `export const t = { appTitle: 'AIlearn', ... } as const`. Las tareas posteriores añaden claves.
- `src/ui/theme.css`: variables CSS de color, espaciado y tipografía. Tema oscuro y sobrio, aire de instrumento técnico. Fuentes IBM Plex Sans e IBM Plex Mono con `@fontsource`.
- Regla de ESLint `no-restricted-imports` (o equivalente) que impide a `src/engine/**` importar de fuera de `src/engine`, y a todo lo que no sea `src/storage/**` usar `localStorage`.

**Pasos:**
- [ ] Crear el proyecto con las versiones actuales y los guiones.
- [ ] Escribir `src/App.test.tsx`: renderiza `App` y encuentra el texto «AIlearn».
- [ ] Añadir temporalmente en `src/engine/` un fichero que importe de `src/ui` y comprobar que `npm run check` falla; quitarlo.
- [ ] Comprobación: `npm run check`, `npm test` y `npm run build` terminan sin errores.
- [ ] Commit.

---

### Tarea 2: Reglas de la trayectoria

**Ficheros:** crear `src/engine/types.ts`, `src/engine/progression.ts`, `src/engine/rng.ts`, `src/engine/progression.test.ts`, `src/engine/rng.test.ts`.

**Produce** (contrato sin verificar):

```ts
// types.ts
export const VALID = 80, QUESTIONS_PER_EXERCISE = 5, EXERCISES_PER_PROJECT = 3,
  EXAM_SIZE = 6, EXAM_PASS = 5, XP_LAUNCH = 50, XP_EXAM = 50, XP_SHEET = 10, XP_PER_LEVEL = 150;

export interface Summary {
  launch: boolean;
  firsts: Record<string, number>; // clave `${projectId}/${0|1|2}`, valor 0..5
  examsPassed: number[];          // índices de órbita
  sheets: string[];               // ids de hojas resueltas
}
export const emptySummary: () => Summary;

/** Lo mínimo que las reglas necesitan saber de un juego. */
export interface Shape { orbits: { projects: { id: string; sheetIds: string[] }[] }[] }

// progression.ts
export const mark: (firsts: number) => number;                 // round(100 * firsts / 15)
export const projectMark: (s: Summary, projectId: string) => number;
export const isValidated: (s: Summary, projectId: string) => boolean;
export const orbitOpen: (shape: Shape, s: Summary, c: number) => boolean;
export const examOpen: (shape: Shape, s: Summary, c: number) => boolean;
export const sheetsOpen: (s: Summary, projectId: string) => boolean;
export const completeLaunch: (s: Summary) => Summary;
export const handInExercise: (s: Summary, projectId: string, ex: 0 | 1 | 2, firsts: number) => Summary;
export const handInExam: (s: Summary, c: number, correct: number) => Summary;
export const solveSheet: (s: Summary, sheetId: string) => Summary;
export const xp: (shape: Shape, s: Summary) => number;
export const level: (xp: number) => number;                    // xp / 150, sin redondear

// rng.ts
export const makeRng: (seed: number) => () => number;          // [0, 1), determinista
export const pick: <T>(rng: () => number, items: readonly T[], n: number) => T[]; // n distintos
```

Todas las funciones devuelven un `Summary` nuevo y no modifican el recibido.

**Casos de prueba** (`shape` de ejemplo: órbita 0 con proyectos `a`, `b`; órbita 1 con `c`; cada proyecto con 3 hojas):

| Caso | Esperado |
|---|---|
| `mark(15)`, `mark(12)`, `mark(11)`, `mark(0)` | 100, 80, 73, 0 |
| `projectMark` con firsts `a/0`=5, `a/1`=4, `a/2`=3 | 80, validado |
| `projectMark` con `a/0`=5, `a/1`=4, sin `a/2` | 60, no validado |
| `handInExercise(a, 0, 3)` tras tener 5 | sigue 5 |
| `handInExercise(a, 0, 5)` tras tener 3 | pasa a 5 |
| `orbitOpen(0)` sin el despegue / con el despegue | false / true |
| `orbitOpen(1)` con el despegue, sin examen 0 | false |
| `orbitOpen(1)` con el despegue y examen 0 | true |
| `orbitOpen(2)` (no existe) | false |
| `examOpen(0)` con `a` validado y `b` no | false |
| `examOpen(0)` con `a` y `b` validados | true |
| `handInExam(0, 4)` | no aprobado |
| `handInExam(0, 5)` y después `handInExam(0, 2)` | sigue aprobado, sin duplicados en `examsPassed` |
| `sheetsOpen(a)` con nota 79 / 80 | false / true |
| `solveSheet` dos veces con la misma hoja | aparece una sola vez |
| `xp` con el despegue, `a` a 80, `b` a 60, examen 0 aprobado, 2 hojas | 50 + 80 + 0 + 50 + 20 = 200 |
| `level(200)` | 1,3333… (la interfaz muestra «1,33») |
| `xp` ignora hojas cuyo id no está en `shape` | no suman |
| `makeRng(7)` dos veces | misma secuencia; semillas distintas, secuencias distintas |
| `pick(rng, [1..10], 6)` | 6 valores distintos; con `n` mayor que la lista, lanza error |

**Pasos:**
- [ ] Escribir las pruebas de la tabla y ver que fallan.
- [ ] Implementar hasta que pasen.
- [ ] Comprobación: `npx vitest run src/engine` en verde; `npm run check` limpio.
- [ ] Commit.

---

### Tarea 3: Esquema del contenido, vectores y corrección

**Ficheros:** crear `src/engine/vectors.ts`, `src/engine/vectors.test.ts`, `src/content/schema.ts`, `src/content/schema.test.ts`, `src/content/grade.ts`, `src/content/grade.test.ts`.

**Produce** (contrato sin verificar; los tipos se infieren de los esquemas Zod):

```ts
// engine/vectors.ts
export type Vec = readonly number[];
export const add: (a: Vec, b: Vec) => number[];
export const scale: (k: number, a: Vec) => number[];
export const norm: (a: Vec) => number;
export const distance: (a: Vec, b: Vec) => number;
export type Metric = 'x' | 'y' | 'norm' | 'distance' | 'sum_x' | 'sum_y';
/** `of` son ids de vectores del plano: uno para x, y, norm; dos para el resto. */
export const measure: (metric: Metric, of: string[], vectors: Record<string, Vec>) => number;

// content/schema.ts
type Md = string; // Markdown; fórmulas entre $...$ y $$...$$

interface PlaneVector { id: string; label: string; x: number; y: number; movable: boolean }
interface PlaneSpec {
  range: number;                    // ejes de -range a range
  snap: number;                     // paso de la rejilla al arrastrar
  vectors: PlaneVector[];
  readouts: ('components' | 'norm' | 'distance' | 'sum')[];
  pair?: [string, string];          // vectores a los que se refieren distance y sum
}
interface Goal { metric: Metric; of: string[]; target: number; tol: number }

interface Base { id: string; prompt: Md; hints: Md[]; explain: Md; solution: Md }
type ManipularQ = Base & { type: 'manipular'; plane: PlaneSpec; goals: Goal[] };
type NumeroQ    = Base & { type: 'numero'; answer: number; tol: number; plane?: PlaneSpec };
type VectorQ    = Base & { type: 'vector'; answer: number[]; tol: number; plane?: PlaneSpec };
type OpcionQ    = Base & { type: 'opcion'; options: Md[]; correct: number; plane?: PlaneSpec };
type CodigoQ    = Base & { type: 'codigo'; starter: string; checks: string; reference: string };
type RevisionQ  = Base & { type: 'revision'; format: 'codigo' | 'texto'; lines: string[];
                           faultyLine: number | null }; // índice desde 0; null si la hoja está bien
export type Question = ManipularQ | NumeroQ | VectorQ | OpcionQ | CodigoQ | RevisionQ;

/** Solo en bancos de examen. Se convierte en Question con una semilla (tarea 7). */
interface GeneradaQ { type: 'generada'; id: string; generator: string;
                      params: Record<string, number | string | boolean> }

interface Exercise { kind: 'manipular' | 'calcular' | 'programar'; questions: Question[] } // 5
interface Project { id: string; name: string; sub: string; exercises: Exercise[] /* 3 */;
                    sheets: RevisionQ[] /* 3 */ }
interface BankEntry { project: string; question: Question | GeneradaQ }
interface Orbit { name: string; projects: Project[]; examBank: BankEntry[] }
export interface Game { id: string; title: string; launch: Question[]; orbits: Orbit[] }

export const gameSchema: z.ZodType<Game>;   // y un esquema exportado por cada tipo
export const toShape: (game: Game) => Shape; // Shape de engine/types

// content/grade.ts
export type ParsedNumber = { ok: true; value: number } | { ok: false };
export const parseNumber: (text: string) => ParsedNumber;

export type Answer =
  | { type: 'manipular'; vectors: Record<string, [number, number]> }
  | { type: 'numero'; value: number }
  | { type: 'vector'; value: number[] }
  | { type: 'opcion'; index: number }
  | { type: 'revision'; faultyLine: number | null };
/** Las preguntas de código no pasan por aquí: las corrige Python. */
export const grade: (q: Exclude<Question, CodigoQ>, a: Answer) => boolean;
```

Reglas del esquema: `id` no vacío; `hints` puede estar vacío; `tol` mayor o igual que 0; `correct` dentro de `options`, con al menos 2 opciones; `faultyLine` dentro de `lines` o `null`; cada `Goal.of` nombra vectores existentes y con el número que su métrica exige; `pair` obligatorio si `readouts` incluye `distance` o `sum`; `exercises` con longitud 3 y `kind` en el orden manipular, calcular, programar; 5 preguntas por ejercicio; 3 hojas por proyecto; cada `BankEntry.project` existe en su órbita.

**Casos de prueba:**

| Caso | Esperado |
|---|---|
| `norm([3,4])`, `norm([1,-2,2])` | 5, 3 |
| `distance([3,4],[4,-2])` | √37 ≈ 6,0828 |
| `add([2,-1],[-5,4])`, `scale(3,[-2,1])` | [-3,3], [-6,3] |
| `add` con dimensiones distintas | lanza error |
| `measure('sum_x', ['u','v'], {u:[2,1], v:[3,2]})` | 5 |
| `measure('distance', ['u'], …)` | lanza error (faltan vectores) |
| `parseNumber('3,5')`, `' 3.5 '`, `'−3,5'` (menos tipográfico U+2212), `'-0,5'`, `'.5'` | 3,5; 3,5; −3,5; −0,5; 0,5 |
| `parseNumber('')`, `'abc'`, `'3,5,2'`, `'1e400'`, `'NaN'` | `{ ok: false }` |
| `grade` numero: respuesta 6,0828 y tol 0,01 con 6,08 / 6,1 | true / false |
| `grade` vector: [0.6,0.8] tol 0,01 con [0.6,0.8] / [0.8,0.6] / [0.6] | true / false / false |
| `grade` opcion: índice correcto / otro | true / false |
| `grade` revision: `null` con `null`; `null` con 1; 1 con 1; 1 con 0 | true, false, true, false |
| `grade` manipular: metas x=3 e y=2, vector en (3,2) / (3,1) | true / false |
| `grade` manipular: meta norm=5 tol 0,01, vector en (3,4) / (5,0) / (4,4) | true, true, false |
| Esquema: proyecto con 4 preguntas en un ejercicio | rechazado |
| Esquema: `correct: 5` con 4 opciones | rechazado |
| Esquema: meta que nombra un vector inexistente | rechazado |
| Esquema: objeto con una función en un campo | rechazado |
| Esquema: juego mínimo válido | aceptado; `toShape` devuelve ids de proyecto y de hojas |

**Pasos:**
- [ ] Escribir las pruebas y ver que fallan.
- [ ] Implementar.
- [ ] Comprobación: `npx vitest run src/engine/vectors.test.ts src/content` en verde; `npm run check` limpio.
- [ ] Commit.

---

### Tarea 4: Máquina de estados de una tanda

Una «tanda» es una lista de preguntas que se resuelven en orden: un ejercicio, el despegue, una hoja o un examen. Esta tarea es lógica pura; la interfaz llega en la tarea 12.

**Ficheros:** crear `src/engine/session.ts`, `src/engine/session.test.ts`.

**Produce** (contrato sin verificar):

```ts
export type Mode = 'proyecto' | 'despegue' | 'hoja' | 'examen';
export type Phase = 'answering' | 'explained' | 'solved' | 'revealed';
export interface QuestionResult { questionId: string; correct: boolean; submissions: number;
                                  hinted: boolean; firstTry: boolean }
export interface SessionState {
  mode: Mode; questionIds: string[]; index: number; phase: Phase;
  submissions: number; hinted: boolean; hintsShown: number;
  results: QuestionResult[]; done: boolean;
}
export type SessionEvent =
  | { type: 'hint'; available: number }   // cuántas pistas tiene la pregunta
  | { type: 'submit'; correct: boolean }
  | { type: 'next' };
export const startSession: (mode: Mode, questionIds: string[]) => SessionState;
export const step: (s: SessionState, e: SessionEvent) => SessionState;
export const firsts: (s: SessionState) => number;
export const correctCount: (s: SessionState) => number;
```

**Reglas:**
- `answering` + entrega correcta → `solved`.
- `answering` + primera entrega incorrecta → `explained` (se muestra la explicación y se puede volver a entregar).
- `explained` + entrega correcta → `solved`. `explained` + entrega incorrecta → `revealed` (se muestra la solución).
- `next` solo actúa en `solved` o `revealed`: guarda el resultado y pasa a la siguiente, o marca `done`.
- `firstTry` es verdadero solo si la primera entrega fue correcta y no se pidió pista.
- `hint` sube `hintsShown` hasta `available` y marca `hinted`. En modo `examen` no hace nada.
- En modo `examen` una entrega incorrecta pasa directamente a `revealed`, sin segunda oportunidad.
- Un evento que no corresponde a la fase devuelve el mismo estado.

**Casos de prueba:** una prueba por regla anterior, y además: tanda de 5 con 4 aciertos a la primera y uno con pista da `firsts` 4 y `correctCount` 5; pista después de `solved` no cambia `hinted`; `submit` con `done` no cambia nada; examen de 6 con un fallo da `correctCount` 5; tanda de una sola pregunta termina en `done` tras `next`.

**Pasos:**
- [ ] Pruebas, fallo, implementación.
- [ ] Comprobación: `npx vitest run src/engine/session.test.ts` en verde.
- [ ] Commit.

---

### Tarea 5: Persistencia

**Ficheros:** crear `src/storage/types.ts`, `src/storage/local.ts`, `src/storage/migrate.ts`, `src/storage/local.test.ts`.

**Produce** (contrato sin verificar):

```ts
export interface Attempt { q: string; at: string; /* ISO */ correct: boolean; submissions: number;
                           hinted: boolean; context: 'despegue' | 'proyecto' | 'hoja' | 'examen' }
export interface ProgressDoc { schema: 1; summary: Summary; attempts: Attempt[] }
export interface ProgressStore {
  load(gameId: string): ProgressDoc;                 // nunca lanza; devuelve vacío si no hay nada
  save(gameId: string, doc: ProgressDoc): void;      // nunca lanza
  loadDraft(gameId: string, questionId: string): string | null;
  saveDraft(gameId: string, questionId: string, code: string): void;
  warning(): string | null;                          // aviso pendiente para el jugador, o null
}
export const createLocalStore: (storage?: Storage) => ProgressStore;
export const migrate: (raw: unknown) => ProgressDoc | null; // null si no se reconoce
```

**Reglas:**
- Claves: progreso en `ailearn:v1:local:<juego>`; borradores en `ailearn:v1:local:<juego>:borradores` (un objeto de id de pregunta a código); documento apartado en `ailearn:v1:local:<juego>:apartado:<marca de tiempo>`.
- `load` valida lo leído con un esquema Zod. Si no es JSON, no cumple el esquema o su `schema` es desconocido, copia el texto original a la clave de apartado, devuelve un documento vacío y deja un aviso. No borra el original hasta el siguiente `save`.
- Si `localStorage` no existe o lanza al leer o escribir (modo privado, cuota), el almacén sigue funcionando en memoria durante la sesión y deja un aviso.
- `migrate` existe ya con la versión 1 como único caso, para que la versión 2 tenga dónde ir.
- El esquema Zod del documento vive en `src/storage` y reutiliza el tipo `Summary` del motor.

**Casos de prueba** (con un `Storage` falso inyectado):

| Caso | Esperado |
|---|---|
| `load` sin datos | documento vacío, sin aviso |
| `save` y `load` | mismo documento; la clave es exactamente `ailearn:v1:local:vectores` |
| Texto guardado `{no json` | documento vacío, aviso, existe una clave `…:apartado:…` con el texto original |
| JSON con `schema: 99` | igual que el anterior |
| JSON con `summary.firsts` de valor 9 | igual que el anterior (fuera de rango 0..5) |
| `Storage` cuyo `setItem` lanza | `save` no lanza; `load` devuelve lo guardado en memoria; hay aviso |
| `Storage` cuyo `getItem` lanza | `load` no lanza; documento vacío; hay aviso |
| `saveDraft` y `loadDraft` | devuelve el código; otra pregunta devuelve `null` |
| Dos juegos distintos | no se mezclan |
| 2 000 intentos guardados | `save` y `load` conservan todos y en orden |

**Pasos:**
- [ ] Pruebas, fallo, implementación.
- [ ] Comprobación: `npx vitest run src/storage` en verde; `npm run check` limpio (la regla de `localStorage` no salta aquí y sí en cualquier otro directorio).
- [ ] Commit.

---

### Tarea 6: Python: núcleo, worker y ejecución en Node

Esta tarea resuelve además la incógnita del spec: si matplotlib funciona en Pyodide sobre Node.

**Ficheros:** crear `src/python/config.ts`, `src/python/harness.ts`, `src/python/core.ts`, `src/python/worker.ts`, `src/python/runner.ts`, `src/python/node.ts`, `src/python/core.test.ts`.

**Produce** (contrato sin verificar):

```ts
// config.ts
export const PYODIDE_VERSION: string;       // la instalada por npm
export const PYODIDE_INDEX_URL: string;     // CDN con esa versión
export const PACKAGES = ['numpy', 'matplotlib'] as const;
export const DEFAULT_TIMEOUT_MS = 10_000;

// core.ts
export interface CheckResult { passed: boolean; message: string }
export interface RunResult {
  stdout: string;
  error: string | null;          // traza recortada al código del jugador, o null
  figures: string[];             // imágenes PNG como data URL
  checks: CheckResult[] | null;  // null si no se pidieron comprobaciones
  passed: boolean;               // sin error, con al menos una comprobación y todas superadas
  timedOut: boolean;
}
export const runInPyodide: (pyodide: unknown, code: string, checks?: string) => Promise<RunResult>;

// runner.ts
export type RunnerStatus = 'idle' | 'loading' | 'ready' | 'running' | 'failed';
export interface PythonRunner {
  run(code: string, opts?: { checks?: string; timeoutMs?: number }): Promise<RunResult>;
  status(): RunnerStatus;
  onStatus(cb: (s: RunnerStatus) => void): () => void;
  retry(): void;                 // tras 'failed'
  dispose(): void;
}
export const getRunner: () => PythonRunner; // única instancia; carga perezosa

// node.ts
export const loadNodePyodide: () => Promise<unknown>; // con numpy y matplotlib cargados
```

**Reglas del arnés** (`harness.ts` contiene el Python; `core.ts` lo invoca):
- El código del jugador se compila con nombre de fichero `<tu código>` y se ejecuta en un diccionario de nombres nuevo en cada ejecución.
- matplotlib usa el backend `Agg`. Antes de ejecutar se cierran todas las figuras. Al terminar, cada figura abierta se exporta a PNG.
- La salida estándar y la de error se capturan.
- Si el código del jugador lanza una excepción, `error` contiene el tipo, el mensaje y solo los marcos de `<tu código>`, con su número de línea. Las comprobaciones no se ejecutan y `passed` es falso.
- Las comprobaciones son texto Python que se ejecuta después, en el mismo diccionario de nombres, con tres nombres añadidos: `np`, `plt` y `check(condición, mensaje)`. Cada llamada a `check` añade un resultado.
- Si el texto de comprobaciones lanza `NameError`, se añade un resultado fallido con el mensaje «No encuentro `<nombre>`. ¿Lo has definido con ese nombre exacto?». Cualquier otra excepción añade un resultado fallido con su mensaje. En ambos casos no se propaga.
- `input()` lanza un error con el mensaje «`input()` no está disponible aquí: escribe el valor en el código».
- El tiempo límite lo aplica `runner.ts`, no el núcleo: empieza a contar cuando el entorno está listo, y al agotarse termina el worker, crea otro y devuelve un resultado con `timedOut` verdadero.

**Casos de prueba** (`core.test.ts`, en Node, con `loadNodePyodide` cargado una vez por fichero y tiempo de espera amplio):

| Código | Comprobaciones | Esperado |
|---|---|---|
| `print("hola")` | — | `stdout` «hola\n», `checks` null, `passed` false |
| `import numpy as np; v = np.array([3, 4])` | `check(np.linalg.norm(v) == 5, "norma")` | `passed` true, un resultado superado |
| `v = 1` | `check(v == 2, "debe valer 2")` | `passed` false, mensaje «debe valer 2» |
| `x = 1` | `check(v == 2, "…")` | `passed` false, mensaje que nombra `v` |
| `1/0` | `check(True, "…")` | `error` contiene `ZeroDivisionError` y «línea 1»; no contiene rutas internas de Pyodide; `checks` vacío o null; `passed` false |
| `def f(:` | — | `error` contiene `SyntaxError` |
| `import matplotlib.pyplot as plt; plt.plot([1,2]); ` | `check(len(plt.get_fignums()) == 1, "figura")` | `figures` con 1 elemento que empieza por `data:image/png;base64,`; `passed` true |
| Dos ejecuciones seguidas: primero `a = 1`, luego `print(a)` | — | la segunda da `NameError` |
| Dos ejecuciones seguidas que dibujan | — | la segunda devuelve 1 figura, no 2 |
| `input()` | — | `error` con el mensaje de `input()` |
| `check(True, "ok")` sin comprobaciones | — | `NameError`: `check` no existe para el jugador |

Si matplotlib no funciona en Node, el implementador se detiene e informa con el error exacto. La alternativa prevista es ejecutar `core.test.ts` y `tests/content/python.test.ts` en navegador con el modo navegador de Vitest; la decide la sesión principal.

**Comprobación del worker** (el tiempo límite no se puede probar en Node con el núcleo): un `runner.test.ts` con un worker falso que nunca responde comprueba que `run` devuelve `timedOut` verdadero al agotarse el plazo, que se crea un worker nuevo y que la siguiente llamada se resuelve. El bucle infinito real se prueba en el navegador en la tarea 19.

**Pasos:**
- [ ] Escribir `core.test.ts` y ver que falla.
- [ ] Implementar `config`, `harness`, `core` y `node` hasta que pase.
- [ ] Escribir `runner.test.ts`, implementar `worker` y `runner`.
- [ ] Comprobación: `npx vitest run src/python` en verde; `npm run build` empaqueta el worker sin avisos.
- [ ] Informe: decir expresamente si matplotlib funcionó en Node y cuánto tardó la carga.
- [ ] Commit.

---

### Tarea 7: Generadores y sorteo de examen

**Ficheros:** crear `src/content/generators.ts`, `src/content/generators.test.ts`, `src/content/exam.ts`, `src/content/exam.test.ts`.

**Produce** (contrato sin verificar):

```ts
// generators.ts
export interface Generator {
  id: string;
  /** Límites de cada componente de la respuesta. */
  bounds: { min: number; max: number };
  make(id: string, params: Record<string, number | string | boolean>, rng: () => number):
    NumeroQ | VectorQ;
}
export const generators: Record<string, Generator>;
export const resolve: (q: GeneradaQ, seed: number) => NumeroQ | VectorQ; // error si no existe

// exam.ts
export interface ExamQuestion { project: string; question: Question }
export const drawExam: (orbit: Orbit, seed: number) => ExamQuestion[];
export const projectsToRevise: (exam: ExamQuestion[], correct: boolean[]) => string[];
```

**Generadores** (todos con componentes enteras entre −6 y 6 salvo indicación; cada uno escribe enunciado, explicación y solución en castellano con los números sorteados):

| id | Pregunta | Tipo | Respuesta | `bounds` |
|---|---|---|---|---|
| `desplazamiento` | Vector que va de A a B | vector | B − A | −12..12 |
| `suma` | u + v | vector | suma | −12..12 |
| `combinacion` | a·u + b·v, con a y b enteros entre −3 y 3 distintos de 0 | vector | resultado | −36..36 |
| `centroide` | Centroide de 3 puntos | vector, tol 0,01 | media | −6..6 |
| `norma` | ‖v‖ en 2 o 3 dimensiones (`params.dim`) | numero, tol 0,01 | norma | 0..10,4 |
| `distancia` | Distancia entre dos puntos 2D | numero, tol 0,01 | distancia | 0..17 |
| `unitario` | Vector unitario en la dirección de v, con v no nulo | vector, tol 0,01 | v/‖v‖ | −1..1 |

**Reglas del sorteo:**
- `drawExam` toma `EXAM_SIZE` entradas del banco repartidas por igual entre los proyectos de la órbita, en rotación si no es divisible. Dentro de cada proyecto elige sin repetir. Las entradas `generada` se resuelven con una semilla derivada de la del examen y del id de la entrada.
- Misma órbita y misma semilla dan el mismo examen.
- El orden final se baraja con la semilla.
- `projectsToRevise` devuelve, sin repetir y en el orden de la órbita, los proyectos con alguna pregunta fallada.

**Casos de prueba:**
- Cada generador, con 200 semillas: la pregunta cumple su esquema; toda componente de la respuesta es finita y está dentro de `bounds`; `grade(q, respuesta)` es verdadero; `unitario` nunca recibe el vector nulo; `norma` con `dim` 2 y 3.
- `resolve` con la misma semilla da preguntas idénticas; con un generador inexistente lanza un error que lo nombra.
- `drawExam` sobre una órbita de prueba con 3 proyectos y 4 entradas por proyecto: 6 preguntas, 2 por proyecto, ids distintos.
- Semillas 1, 2 y 3: tres exámenes distintos entre sí.
- Órbita con 2 proyectos: 3 y 3. Con 4 proyectos: reparto 2, 2, 1, 1.
- Un proyecto con menos entradas de las que le tocan: error que nombra el proyecto.
- `projectsToRevise` con fallos en preguntas de `a` y `c`: `['a', 'c']`; sin fallos: lista vacía.

**Pasos:**
- [ ] Pruebas, fallo, implementación.
- [ ] Comprobación: `npx vitest run src/content/generators.test.ts src/content/exam.test.ts` en verde.
- [ ] Commit.

---

### Tarea 8: Pruebas genéricas de contenido

Estas pruebas son la red de todo el contenido presente y futuro. Recorren el registro de juegos, de modo que un juego nuevo queda cubierto sin escribir nada.

**Ficheros:** crear `src/content/validate.ts`, `src/content/validate.test.ts`, `src/games/index.ts`, `tests/content/games.test.ts`, `tests/content/python.test.ts`.

**Produce** (contrato sin verificar):

```ts
// games/index.ts
export const games: Game[];   // vacío en esta tarea; la 15 añade «vectores»

// content/validate.ts : cada función devuelve la lista de problemas, vacía si no hay
export const checkIds: (game: Game) => string[];              // ids únicos en todo el juego
export const checkReachable: (q: ManipularQ) => string[];     // la meta es alcanzable
export const checkStartNotSolved: (q: ManipularQ) => string[];// la posición inicial no cumple ya la meta
export const checkExamBank: (orbit: Orbit) => string[];     // permite tres exámenes distintos
export const checkProject: (project: Project) => string[];    // esquema + las anteriores, para un proyecto suelto
export const codeQuestions: (game: Game) => CodigoQ[];        // todas, incluidas las del despegue y los bancos
```

**Reglas:**
- `checkReachable` busca por fuerza bruta en la rejilla (`range` y `snap`) alguna colocación de los vectores móviles que cumpla todas las metas. Con más de dos vectores móviles devuelve un problema («demasiados vectores móviles para comprobar»).
- `checkExamBank`: `drawExam` con las semillas 1, 2 y 3 no lanza y da tres exámenes distintos.
- `tests/content/games.test.ts`, para cada juego de `games`: cumple `gameSchema`; `checkIds`, `checkReachable`, `checkStartNotSolved` y `checkExamBank` no devuelven problemas; toda entrada `generada` nombra un generador que existe; toda pregunta que no es de código y tiene respuesta declarada se corrige como correcta con esa respuesta; toda `opcion` tiene opciones distintas entre sí.
- `tests/content/python.test.ts`, para cada pregunta de `codeQuestions`: la `reference` supera sus `checks` (`passed` verdadero); el `starter` no las supera; las `checks` contienen al menos una llamada a `check(`.
- Con `games` vacío ambos ficheros pasan sin casos, sin fallar por «no hay pruebas».

**Casos de prueba de `validate.test.ts`** (con un juego de prueba pequeño escrito en el propio test):

| Caso | Esperado |
|---|---|
| Dos preguntas con el mismo id | un problema que nombra el id |
| Meta x=3,5 con `snap` 1 | no alcanzable |
| Meta norm=5 tol 0,01, `range` 6, `snap` 1 | alcanzable |
| Meta norm=1 y x=0,6 con `snap` 0,2 y `range` 2 | alcanzable |
| Vector móvil que empieza ya en la meta | un problema |
| Tres vectores móviles | problema «demasiados vectores móviles» |
| Banco con 2 entradas fijas por proyecto y ninguna generada | problema (no hay tres exámenes distintos) |
| Juego de prueba correcto | ninguna función devuelve problemas |

**Pasos:**
- [ ] Pruebas, fallo, implementación.
- [ ] Demostrar que la red atrapa: con el juego de prueba registrado temporalmente y una `reference` rota, `tests/content/python.test.ts` falla; deshacerlo.
- [ ] Comprobación: `npm test` en verde.
- [ ] Commit.

---

### Tarea 9: Base visual y plano de vectores

Antes de escribir, el implementador carga la skill `frontend-design:frontend-design`.

**Ficheros:** crear `src/ui/Md.tsx`, `src/ui/Md.test.tsx`, `src/ui/format.ts`, `src/ui/format.test.ts`, `src/ui/Layout.tsx`, `src/ui/VectorPlane.tsx`, `src/ui/VectorPlane.test.tsx`; modificar `src/ui/theme.css`, `src/ui/strings.ts`, `src/App.tsx`.

**Produce** (contrato sin verificar):

```ts
// format.ts
export const fmt: (n: number, decimals?: number) => string; // coma decimal; sin ceros de más

// Md.tsx : Markdown con fórmulas KaTeX; no ejecuta HTML del contenido
export function Md(props: { children: string; inline?: boolean }): JSX.Element;

// Layout.tsx : cabecera con título, nivel y enlace de vuelta; zona de avisos
export function Layout(props: { title: string; back?: string; level?: number;
                                warning?: string | null; children: ReactNode }): JSX.Element;

// VectorPlane.tsx
export function VectorPlane(props: {
  spec: PlaneSpec;
  positions: Record<string, [number, number]>;                 // controlado desde fuera
  onMove?: (id: string, to: [number, number]) => void;         // ausente: figura estática
}): JSX.Element;
```

**Reglas del plano:**
- SVG que se adapta al ancho disponible y mantiene la proporción 1:1. Ejes, rejilla según `snap`, marcas numeradas.
- Cada vector es una flecha desde el origen con su etiqueta. Los móviles tienen un asa visible en la punta; los fijos, no.
- Arrastre con eventos de puntero (ratón y táctil). La posición se ajusta a la rejilla y se limita a `range`.
- Teclado: el asa recibe el foco con tabulador; las flechas mueven un paso de `snap`. Cada asa tiene `aria-label` con su nombre y posición.
- Lecturas en vivo según `readouts`, junto al plano: componentes de cada vector; norma de cada vector; distancia entre los dos de `pair`; suma de los dos de `pair`, que además se dibuja como tercera flecha con el paralelogramo en línea discontinua.
- Los números usan `fmt` y la tipografía monoespaciada.
- Sin desbordamiento horizontal a 360 px de ancho.

**Casos de prueba:**

| Caso | Esperado |
|---|---|
| `fmt(3.5)`, `fmt(6.0828, 2)`, `fmt(5)`, `fmt(-0.5)`, `fmt(1/3, 3)` | «3,5», «6,08», «5», «−0,5», «0,333» |
| `Md` con `$x^2$` | hay un elemento con clase `katex` |
| `Md` con `<script>` en el texto | no se crea ningún elemento `script` |
| Plano con un vector móvil en (1,1): foco en el asa y flecha derecha | `onMove('v', [2, 1])` con `snap` 1 |
| Igual, en el borde (`range` 6, vector en (6,0)) y flecha derecha | no se llama o se llama con (6,0) |
| Vector fijo | no hay asa enfocable |
| `readouts: ['norm']` con vector (3,4) | aparece «5» |
| `readouts: ['sum']`, `pair` u=(2,1), v=(3,2) | aparece «(5, 3)» |
| Sin `onMove` | ningún asa enfocable |

**Pasos:**
- [ ] Pruebas, fallo, implementación.
- [ ] Añadir una ruta de desarrollo `/#/dev/plano` (solo en compilación de desarrollo) con un plano de ejemplo con dos vectores móviles y todas las lecturas.
- [ ] Verificación visual: abrir esa ruta en el navegador a 1280 px y a 360 px, arrastrar con el ratón, y guardar dos capturas en el directorio temporal de la sesión. Describir en el informe lo observado.
- [ ] Comprobación: `npx vitest run src/ui` en verde; `npm run check` limpio.
- [ ] Commit.

---

### Tarea 10: Componentes de pregunta

**Ficheros:** crear `src/ui/questions/QuestionView.tsx`, `ManipularQuestion.tsx`, `NumeroQuestion.tsx`, `VectorQuestion.tsx`, `OpcionQuestion.tsx`, `RevisionQuestion.tsx`, y `src/ui/questions/questions.test.tsx`; modificar `src/ui/strings.ts`.

**Produce** (contrato sin verificar):

```ts
export interface QuestionProps<Q> {
  question: Q;
  locked: boolean;                       // fase 'solved' o 'revealed': no admite cambios
  onSubmit: (correct: boolean) => void;  // solo se llama con una respuesta válida
}
/** Elige el componente por `question.type`. El de código llega en la tarea 11. */
export function QuestionView(props: QuestionProps<Question>): JSX.Element;
```

**Reglas:**
- Cada componente muestra el enunciado con `Md`, la figura si la hay (plano estático) y su entrada. Corrige con `grade` y llama a `onSubmit`.
- `numero` y `vector`: campos de texto. Con una entrada que `parseNumber` rechaza, muestra «Escribe un número, por ejemplo 3,5» y **no** llama a `onSubmit`. Intro entrega.
- `vector`: tantos campos como componentes tiene la respuesta, entre paréntesis.
- `opcion`: botones de opción, elegibles con teclado; se entrega con un botón «Entregar», no al pulsar la opción.
- `revision`: muestra las líneas numeradas, en monoespaciada si `format` es `codigo`. El jugador elige «Está bien» o «Tiene un error»; con la segunda, pulsa la línea errónea. Se entrega con un botón.
- `manipular`: plano con `onMove`, estado local de posiciones a partir de `spec`, botones «Entregar» y «Recolocar».
- Tras una entrega, el botón queda desactivado 450 ms para evitar la doble pulsación.
- Con `locked`, las entradas quedan desactivadas y conservan lo último que puso el jugador.

**Casos de prueba:**

| Caso | Esperado |
|---|---|
| `numero` respuesta 5: escribir «5» y pulsar Intro | `onSubmit(true)` |
| `numero`: escribir «abc» y entregar | aviso visible, `onSubmit` no llamado |
| `numero`: campo vacío y entregar | aviso visible, `onSubmit` no llamado |
| `numero` respuesta 3,5: escribir «3,5» | `onSubmit(true)` |
| `vector` [0.6, 0.8]: escribir «0,6» y «0,8» | `onSubmit(true)`; con un campo vacío, aviso y sin llamada |
| `opcion`: pulsar una opción sin entregar | `onSubmit` no llamado |
| `opcion`: opción incorrecta y entregar | `onSubmit(false)` |
| `revision` con `faultyLine` 1: «Tiene un error», línea 2 (índice 1), entregar | `onSubmit(true)` |
| `revision` con `faultyLine` null: «Está bien», entregar | `onSubmit(true)` |
| `revision`: «Tiene un error» sin elegir línea | botón de entregar desactivado |
| `manipular` meta (3,2) desde (1,1): mover con teclado y entregar | `onSubmit(true)` |
| `manipular`: «Recolocar» | vuelve a la posición inicial |
| Cualquiera con `locked` | entradas desactivadas |
| Doble pulsación rápida en «Entregar» | `onSubmit` llamado una vez |

**Pasos:**
- [ ] Pruebas, fallo, implementación.
- [ ] Comprobación: `npx vitest run src/ui/questions` en verde.
- [ ] Commit.

---

### Tarea 11: Pregunta de código

**Ficheros:** crear `src/ui/CodeEditor.tsx`, `src/ui/questions/CodigoQuestion.tsx`, `src/ui/questions/CodigoQuestion.test.tsx`; modificar `src/ui/questions/QuestionView.tsx`, `src/ui/strings.ts`.

**Consume:** `getRunner`, `RunResult`, `RunnerStatus` (tarea 6); `QuestionProps` (tarea 10).

**Produce** (contrato sin verificar):

```ts
export function CodeEditor(props: { value: string; onChange: (v: string) => void;
                                    readOnly?: boolean; onRun?: () => void }): JSX.Element;
export function CodigoQuestion(props: QuestionProps<CodigoQ> & {
  draft: string | null;                         // borrador guardado, si lo hay
  onDraft: (code: string) => void;
  runner?: PythonRunner;                        // por defecto getRunner(); inyectable en pruebas
}): JSX.Element;
```

`QuestionView` recibe `draft` y `onDraft` opcionales y los pasa.

**Reglas:**
- Editor CodeMirror 6 con resaltado de Python, sangrado de 4 espacios y numeración de líneas. Empieza con el borrador si existe; si no, con `starter`.
- Botones «Ejecutar» (también Ctrl+Intro) y «Entregar», y «Restablecer» para volver a `starter`, con confirmación en la propia interfaz (no un diálogo del navegador).
- «Ejecutar» llama a `run(code)` sin comprobaciones y muestra salida, error y figuras. No llama a `onSubmit`.
- «Entregar» llama a `run(code, { checks })`, muestra la lista de comprobaciones con su mensaje y llama a `onSubmit(result.passed)`.
- Un resultado con `timedOut` muestra «Tu código tardó demasiado. ¿Hay un bucle que no termina?» y, si era una entrega, cuenta como incorrecta.
- Estado `loading`: indicador «Cargando Python…» y botones desactivados. Estado `failed`: mensaje «No se ha podido cargar Python. Comprueba la conexión.» y botón «Reintentar» que llama a `retry()`.
- El borrador se guarda con `onDraft` como mucho una vez cada 500 ms mientras se escribe, y siempre antes de ejecutar o entregar.
- Las figuras se muestran a la derecha del editor en pantallas anchas y debajo en estrechas.

**Casos de prueba** (con un `PythonRunner` falso):

| Caso | Esperado |
|---|---|
| Sin borrador | el editor contiene `starter` |
| Con borrador | el editor contiene el borrador |
| «Ejecutar» | `run` llamado sin `checks`; se ve la salida; `onSubmit` no llamado |
| «Entregar» con resultado `passed` true | `run` llamado con `checks`; `onSubmit(true)` |
| «Entregar» con una comprobación fallida | se ve su mensaje; `onSubmit(false)` |
| Resultado con `error` | se ve la traza |
| Resultado con `timedOut` al entregar | mensaje de tiempo agotado; `onSubmit(false)` |
| Resultado con 1 figura | hay una imagen con ese `src` |
| Estado `loading` | botones desactivados e indicador visible |
| Estado `failed` | mensaje y botón «Reintentar» que llama a `retry` |
| Escribir | `onDraft` llamado con el texto tras la espera |
| `locked` | editor de solo lectura; «Ejecutar» sigue activo; «Entregar» no |

**Pasos:**
- [ ] Pruebas, fallo, implementación.
- [ ] Verificación en navegador: en una ruta de desarrollo `/#/dev/codigo`, ejecutar un código que dibuje con matplotlib y ver la figura; ejecutar `while True: pass` y ver el mensaje de tiempo agotado sin que la página se congele; ejecutar después `print(1)` y ver «1». Anotar en el informe el tiempo de la primera carga.
- [ ] Comprobación: `npx vitest run src/ui/questions/CodigoQuestion.test.tsx` en verde.
- [ ] Commit.

---

### Tarea 12: Ejecutor de tandas

**Ficheros:** crear `src/ui/ExerciseRunner.tsx`, `src/ui/ExerciseRunner.test.tsx`; modificar `src/ui/strings.ts`, `src/ui/theme.css`.

**Consume:** `startSession`, `step`, `firsts`, `correctCount`, `QuestionResult` (tarea 4); `QuestionView` (tareas 10 y 11).

**Produce** (contrato sin verificar):

```ts
export function ExerciseRunner(props: {
  mode: Mode;
  questions: Question[];
  onResult: (r: QuestionResult) => void;      // al cerrar cada pregunta
  onDone: (summary: { firsts: number; correct: number; results: QuestionResult[] }) => void;
  getDraft?: (questionId: string) => string | null;
  onDraft?: (questionId: string, code: string) => void;
}): JSX.Element;
```

**Reglas:**
- Muestra una pregunta cada vez, con indicador de progreso («2 de 5») y, en modo `proyecto`, el contador de aciertos a la primera.
- Botón «Dame una pista» cuando quedan pistas; cada pulsación muestra una más. No aparece en modo `examen` ni cuando la pregunta no tiene pistas.
- Fase `explained`: muestra `explain` y deja volver a entregar. Fase `revealed`: muestra `solution`. Fase `solved`: mensaje de acierto y, si no fue a la primera, también `solution`.
- En `solved` y `revealed` aparece «Siguiente», que recibe el foco; Intro lo activa.
- En modo `examen` no se muestra `explain` ni `solution` durante el examen; solo «Respuesta registrada» y «Siguiente».
- Todo el estado sale de `step`. Este componente no decide ninguna regla.
- Al cambiar de pregunta, el componente de pregunta se monta de nuevo (clave por id).

**Casos de prueba** (con preguntas `numero` sencillas):

| Caso | Esperado |
|---|---|
| Acertar las 5 a la primera | `onDone` con `firsts` 5; `onResult` llamado 5 veces |
| Fallar una vez y acertar | se ve `explain`; el resultado tiene `firstTry` false y `correct` true |
| Fallar dos veces | se ve `solution`; `correct` false |
| Pedir pista y acertar | `firstTry` false |
| Dos pistas disponibles, pulsar tres veces | se ven dos; el botón desaparece |
| Modo `examen` | no hay botón de pista; tras fallar no se ve `explain` ni `solution` y solo cabe «Siguiente» |
| Entrada no numérica | no cambia de fase |
| Intro en fase `solved` | pasa a la siguiente |

**Pasos:**
- [ ] Pruebas, fallo, implementación.
- [ ] Verificación visual a 1280 px y 360 px en una ruta de desarrollo con una tanda de cinco preguntas de tipos distintos; dos capturas.
- [ ] Comprobación: `npx vitest run src/ui/ExerciseRunner.test.tsx` en verde.
- [ ] Commit.

---

### Tarea 13: Pantallas de juego y guardado

**Ficheros:** crear `src/ui/useProgress.ts`, `src/ui/useProgress.test.tsx`, `src/ui/screens/LaunchScreen.tsx`, `ExerciseScreen.tsx`, `SheetScreen.tsx`, `ExamScreen.tsx`, `src/ui/screens/play.test.tsx`; modificar `src/App.tsx`, `src/ui/strings.ts`.

**Consume:** `ProgressStore`, `Attempt` (tarea 5); reglas de la tarea 2; `drawExam`, `projectsToRevise` (tarea 7); `ExerciseRunner` (tarea 12); `games` (tarea 8).

**Produce** (contrato sin verificar):

```ts
// useProgress.ts : único punto por el que las pantallas leen y escriben progreso
export function useProgress(gameId: string): {
  summary: Summary;
  warning: string | null;
  record(result: QuestionResult, context: Attempt['context']): void;   // añade al registro
  completeLaunch(): void;
  handInExercise(projectId: string, ex: 0 | 1 | 2, firsts: number): void;
  handInExam(c: number, correct: number): void;
  solveSheet(sheetId: string): void;
  getDraft(questionId: string): string | null;
  saveDraft(questionId: string, code: string): void;
};
export const StoreContext: React.Context<ProgressStore>;   // inyectable en pruebas
```

**Rutas:**

| Ruta | Pantalla |
|---|---|
| `/j/:game/despegue` | `LaunchScreen` |
| `/j/:game/p/:project/ex/:n` | `ExerciseScreen` (n de 0 a 2) |
| `/j/:game/p/:project/hoja/:n` | `SheetScreen` (n de 0 a 2) |
| `/j/:game/examen/:c` | `ExamScreen` |

**Reglas:**
- Cada mutación de `useProgress` aplica la función del motor correspondiente y guarda de inmediato.
- `record` añade un `Attempt` con la fecha actual por cada pregunta cerrada, en cualquier modo.
- Una pantalla cuya etapa está cerrada según el motor (órbita no abierta, examen no abierto, hojas no abiertas) muestra «Todavía no está abierto» y un enlace al mapa. No basta con ocultar el enlace: se comprueba al entrar por URL. El parámetro `?abierto` lo salta solo en compilación de desarrollo.
- Juego, proyecto, ejercicio o órbita inexistentes: «No existe» y enlace al mapa.
- `ExerciseScreen`: al terminar llama a `handInExercise` y muestra el resultado del ejercicio, la nota actual del proyecto y si queda validado.
- `LaunchScreen`: al terminar llama a `completeLaunch`.
- `SheetScreen`: una tanda de una sola pregunta en modo `hoja`; llama a `solveSheet` solo si se acertó.
- `ExamScreen`: sortea el examen con una semilla nueva al entrar. Al terminar llama a `handInExam`. Aprobado: mensaje y XP. Suspenso: nota obtenida y los proyectos de `projectsToRevise` por su nombre. Botón para repetir con otra semilla.
- Salir a mitad de una tanda no guarda la marca del ejercicio ni el examen; los intentos ya cerrados sí quedan en el registro.

**Casos de prueba** (con almacén en memoria y un juego de prueba):

| Caso | Esperado |
|---|---|
| Completar el despegue | `summary.launch` true y guardado en el almacén |
| Ejercicio con 4 a la primera | `firsts['p/0']` 4; 5 intentos añadidos con contexto `proyecto` |
| Repetir el ejercicio con 2 | sigue 4; el registro crece en 5 |
| Entrar por URL a un ejercicio de la órbita 1 sin examen 0 | «Todavía no está abierto» |
| Entrar al examen sin proyectos validados | «Todavía no está abierto» |
| Entrar a una hoja de un proyecto no validado | «Todavía no está abierto» |
| Examen con 5 aciertos | `examsPassed` contiene la órbita |
| Examen con 4 aciertos | no aprobado; se nombran los proyectos a repasar |
| Hoja acertada / fallada | se añade a `sheets` / no se añade |
| Abandonar un ejercicio en la pregunta 3 y volver | empieza en la 1; `firsts` sin cambios; 2 intentos en el registro |
| Borrador guardado en una pregunta de código, desmontar y volver a montar | el borrador sigue |
| Almacén con aviso | el aviso se ve en la cabecera |
| Ruta de proyecto inexistente | «No existe» |

**Pasos:**
- [ ] Pruebas, fallo, implementación.
- [ ] Comprobación: `npx vitest run src/ui/screens/play.test.tsx src/ui/useProgress.test.tsx` en verde; `npm run check` limpio.
- [ ] Commit.

---

### Tarea 14: Mapa, panel de proyecto y estadísticas

**Ficheros:** crear `src/ui/screens/Hub.tsx`, `GameMap.tsx`, `ProjectPanel.tsx`, `StatsScreen.tsx`, `src/ui/screens/map.test.tsx`; modificar `src/App.tsx`, `src/ui/strings.ts`, `src/ui/theme.css`.

**Consume:** `useProgress` y `StoreContext` (tarea 13). Esta tarea empieza cuando la 13 ha terminado y no modifica `useProgress.ts`.

**Rutas:** `/` (`Hub`), `/j/:game` (`GameMap`), `/j/:game/p/:project` (`ProjectPanel`), `/j/:game/estadisticas` (`StatsScreen`).

**Reglas:**
- `Hub`: una tarjeta por juego registrado con título, nivel y XP. Con un solo juego sigue siendo una lista.
- `GameMap`: cabecera con XP y nivel con dos decimales («Nivel 1,33»). Despegue arriba; después las órbitas en orden. Cada órbita muestra su nombre, sus proyectos con nota y estado (cerrado, abierto, validado), y su examen (cerrado, abierto, aprobado). Lo cerrado se ve pero no se puede abrir, y dice qué falta («Completa el despegue», «Aprueba el examen de la órbita anterior», «Valida todos los proyectos»).
- `ProjectPanel`: nombre y subtítulo, nota del proyecto y umbral de 80, los tres ejercicios con su mejor marca («4 de 5» o «sin hacer») y enlace para jugarlos, y las tres hojas de «Caza el error», cerradas hasta validar, con marca de resuelta.
- `StatsScreen`: lee el registro de intentos. Muestra total de preguntas respondidas, porcentaje de acierto a la primera, y una tabla por proyecto con intentos y aciertos. Enlace desde el mapa.
- Todos los estados salen de las funciones del motor; estas pantallas no recalculan reglas.
- Sin desbordamiento horizontal a 360 px.

**Casos de prueba:**

| Caso | Esperado |
|---|---|
| Progreso vacío | Despegue abierto; órbita 0 cerrada con «Completa el despegue»; «Nivel 0» |
| Despegue completado | órbita 0 abierta; examen cerrado con «Valida todos los proyectos» |
| Todos los proyectos de la órbita 0 validados | examen abierto |
| XP 200 | «Nivel 1,33» |
| Panel con `firsts` 5, 4 y sin tercero | nota 60; ejercicios «5 de 5», «4 de 5», «sin hacer»; hojas cerradas |
| Panel con nota 80 | hojas abiertas |
| Estadísticas con 10 intentos, 7 a la primera | «10» y «70 %» |
| Estadísticas sin intentos | mensaje «Aún no hay datos», sin dividir por cero |

**Pasos:**
- [ ] Pruebas, fallo, implementación.
- [ ] Verificación visual del mapa y del panel a 1280 px y 360 px con un progreso a medias; capturas.
- [ ] Comprobación: `npx vitest run src/ui/screens/map.test.tsx` en verde.
- [ ] Commit.

---

## Contenido: reglas comunes a las tareas 15 a 18

- Cada pregunta enseña algo: el enunciado dice qué se pide y por qué importa; `explain` orienta sin dar la respuesta; `solution` la da razonada, con los pasos. Las `hints` van de menos a más.
- En cada proyecto, al menos una pregunta de cada ejercicio enlaza con IA usando los embeddings de juguete.
- Los embeddings de juguete se presentan siempre como inventados y de dos dimensiones para poder dibujarlos, y se dice que los reales tienen cientos de dimensiones.
- Ids de pregunta: `<etapa>.<ejercicio>.<n>`, por ejemplo `componentes.ex01.3`, `despegue.7`, `suma-escala.hoja.2`, `examen-0.norma`.
- Preguntas de código: `starter` ya importa NumPy (y matplotlib si se dibuja) y define los datos; el jugador escribe entre 1 y 6 líneas. `checks` comprueba valor, tipo y forma, con un mensaje distinto para cada fallo probable. `reference` es la solución modelo. Nunca se comprueba el texto del código.
- Los valores esperados de las tablas siguientes son obligatorios. La redacción es del implementador.
- Tolerancias: 0 para resultados enteros; 0,01 para el resto. En `manipular`, 0,01 salvo que la tabla diga otra cosa.

**Embeddings de juguete** (`src/games/vectores/toy.ts`). Eje x: ser vivo (positivo) o máquina (negativo). Eje y: doméstico (positivo) o salvaje o industrial (negativo).

| Palabra | Vector | Palabra | Vector |
|---|---|---|---|
| gato | (3, 4) | coche | (−3, 2) |
| perro | (4, 3) | bici | (−2, 3) |
| lobo | (4, −2) | camión | (−4, −1) |
| tigre | (3, −3) | tractor | (−3, −3) |

---

### Tarea 15: Contenido del despegue y del proyecto «Componentes»

Su diff es el ejemplo que reciben las tareas 16 y 17.

**Ficheros:** crear `src/games/vectores/toy.ts`, `despegue.ts`, `componentes.ts`, `index.ts`, `src/games/vectores/componentes.test.ts`; modificar `src/games/index.ts`.

**Produce:** `export const toy: Record<string, [number, number]>`; `export const launch: Question[]`; `export const componentes: Project`; `export const vectores: Game`. En esta tarea `vectores` tiene el despegue y un Órbita 0 llamado «La flecha» con el proyecto `componentes` y un banco de examen provisional con las entradas de este proyecto; la tarea 18 lo completa. Con un solo proyecto, el sorteo le pide las 6 preguntas a él, así que el banco provisional lleva 6 entradas de `componentes`: tres `generada` con el generador `desplazamiento` e ids distintos, y tres fijas. Así las pruebas genéricas, incluida `checkExamBank`, pasan desde esta tarea.

`componentes.test.ts` llama a `checkProject(componentes)` y espera una lista vacía.

**Despegue** (10 preguntas; rango 6 y `snap` 1 en los planos):

| # | Tipo | Contenido | Respuesta |
|---|---|---|---|
| 1 | manipular | Lleva v desde (1, 1) hasta (3, 2) | metas x=3, y=2 |
| 2 | opcion | Componentes de la flecha dibujada, (−2, 3) | (−2, 3) frente a (3, −2), (2, 3), (−2, −3) |
| 3 | vector | Componentes del vector dibujado | (4, −1) |
| 4 | numero | Componente y de (5, −3) | −3 |
| 5 | opcion | Qué es un embedding | Una lista de números que sitúa un texto como un punto, de modo que textos parecidos queden cerca |
| 6 | manipular | gato fijo en (3, 4); coloca «perro», que empieza en (−3, −3), cerca de gato | distancia(perro, gato): objetivo 1, tolerancia 0,5 |
| 7 | codigo | Crea `v = np.array([3, 2])` | `v` es un array de forma (2,) con valores 3 y 2 |
| 8 | codigo | Dado `v = np.array([5, -3])`, guarda sus componentes en `x` e `y` | x = 5, y = −3 |
| 9 | codigo | Completa las componentes para dibujar v = (3, 2) con `plt.quiver` (el `starter` trae casi todo) | `v` vale (3, 2) y hay al menos una figura |
| 10 | opcion | Valor de `np.array([1, 2, 3]).shape` | `(3,)` frente a `3`, `(1, 3)`, `(3, 1)` |

**Proyecto `componentes`**, nombre «Componentes», subtítulo «Un vector es una flecha y es una lista».

ex00, manipular (rango 6, `snap` 1, lectura de componentes):

| # | Contenido | Metas |
|---|---|---|
| 1 | Lleva v a (4, 3) | x=4, y=3 |
| 2 | Lleva v a (−2, 5) | x=−2, y=5 |
| 3 | Lleva v a (0, −4), sobre un eje | x=0, y=−4 |
| 4 | Lleva u a (3, 1) y v a su opuesto | u: x=3, y=1; v: x=−3, y=−1 |
| 5 | El embedding de «camión» es (−4, −1): colócalo | x=−4, y=−1 |

ex01, calcular:

| # | Tipo | Contenido | Respuesta |
|---|---|---|---|
| 1 | vector | Componentes del vector dibujado | (−3, 2) |
| 2 | numero | Con `v = np.array([7, -2])`, valor de `v[1]` | −2 |
| 3 | opcion | Dimensiones del vector (1, 0, −2, 5) | 4 frente a 3, 5, 1 |
| 4 | vector | Vector que va de A(1, 2) a B(4, 6) | (3, 4) |
| 5 | opcion | Un embedding de 768 dimensiones es | Una lista de 768 números, frente a una matriz de 768 × 768, 768 palabras, un número entre 0 y 768 |

ex02, programar:

| # | Contenido | Comprobaciones |
|---|---|---|
| 1 | Crea `v = np.array([4, 3])` | array, forma (2,), valores |
| 2 | Dado `v = np.array([1, 0, -2, 5, 3])`, guarda en `dim` su número de dimensiones | `dim == 5` |
| 3 | Dados `A = np.array([1, 2])` y `B = np.array([4, 6])`, calcula `d`, el vector de A a B | `d` vale (3, 4); mensaje propio si vale (−3, −4) |
| 4 | Dado el diccionario `emb` con gato, perro, coche y bici, guarda en `v` el embedding de «perro» y en `primera` su primera componente | `v` vale (4, 3); `primera == 4` |
| 5 | Dibuja los cuatro puntos de `emb` con `plt.scatter` | hay una figura y sus colecciones suman 4 puntos |

Hojas:

| # | Formato | Líneas | Línea errónea |
|---|---|---|---|
| 1 | codigo | `v = np.array([3, 4])` / `y = v[2]` | la segunda (índice fuera de rango: se cuenta desde 0) |
| 2 | texto | «A = (2, 1) y B = (5, 5)» / «El vector de A a B es B − A» / «B − A = (3, 4)» | ninguna |
| 3 | codigo | `v = np.array(3, 4)` / `print(v.shape)` | la primera (faltan los corchetes) |

**Pasos:**
- [ ] Escribir `componentes.test.ts` y registrar el juego; ver que `npm test` falla.
- [ ] Escribir el contenido.
- [ ] Comprobación: `npm test` en verde, incluidos `tests/content/games.test.ts` y `tests/content/python.test.ts` sobre el juego ya registrado.
- [ ] Jugar el despegue entero en el navegador y anotar en el informe cualquier enunciado que se lea mal o cualquier comprobación de código que rechace una solución correcta distinta de la de referencia.
- [ ] Commit.

---

### Tarea 16: Contenido del proyecto «Suma y escala»

**Ficheros:** crear `src/games/vectores/suma-escala.ts`, `src/games/vectores/suma-escala.test.ts`. **No** modifica `index.ts`.

**Consume:** `toy` (tarea 15); `checkProject` (tarea 8). El brief incluye el diff de la tarea 15 como ejemplo.

**Produce:** `export const sumaEscala: Project`, id `suma-escala`, nombre «Suma y escala», subtítulo «Combinar flechas».

ex00, manipular (lectura de componentes y de suma cuando hay `pair`):

| # | Contenido | Rango, `snap` | Metas |
|---|---|---|---|
| 1 | u fijo en (2, 1). Mueve v para que u + v = (5, 3) | 6, 1 | sum_x=5, sum_y=3 |
| 2 | u fijo en (4, −1). Mueve v para que u + v sea el vector nulo | 6, 1 | sum_x=0, sum_y=0 |
| 3 | u fijo en (1, 2). Lleva w a 2u | 6, 1 | w: x=2, y=4 |
| 4 | u fijo en (4, 2). Lleva w a −0,5u | 6, 1 | w: x=−2, y=−1 |
| 5 | gato (3, 4) y perro (4, 3) fijos. Coloca c en su centroide | 6, 0,5 | c: x=3,5, y=3,5 |

ex01, calcular:

| # | Tipo | Contenido | Respuesta |
|---|---|---|---|
| 1 | vector | (2, −1) + (−5, 4) | (−3, 3) |
| 2 | vector | 3 · (−2, 1) | (−6, 3) |
| 3 | vector | 2u − v con u = (1, 3) y v = (4, −2) | (−2, 8) |
| 4 | vector | Centroide de coche (−3, 2), bici (−2, 3) y camión (−4, −1) | (−3, 1,333), tolerancia 0,01 |
| 5 | opcion | Sumar un vector de 2 dimensiones y uno de 3 | No está definido; NumPy da un error de formas. Frente a «se rellena con ceros», «se suman las dos primeras», «da un vector de 5» |

ex02, programar:

| # | Contenido | Comprobaciones |
|---|---|---|
| 1 | Con u = (2, 1) y v = (3, 2), calcula `s = u + v` | `s` vale (5, 3) |
| 2 | Con u = (4, 2), calcula `w`, que es −0,5 veces u | `w` vale (−2, −1) |
| 3 | Con u = (1, 3) y v = (4, −2), calcula `c = 2u − v` | `c` vale (−2, 8) |
| 4 | Con la matriz `E` de 3 × 2 (coche, bici, camión), calcula `centroide` con `np.mean` | forma (2,) y valores (−3, 1,3333); mensaje propio si la forma es (3,) («has promediado por filas: prueba `axis=0`») y si es un número suelto |
| 5 | Dibuja u, v y u + v con `plt.quiver` | `s` correcto y hay una figura |

Hojas:

| # | Formato | Líneas | Línea errónea |
|---|---|---|---|
| 1 | codigo | `E = np.array([[-3, 2], [-2, 3], [-4, -1]])` / `centroide = np.mean(E, axis=1)` | la segunda (eje equivocado) |
| 2 | texto | «2 · (3, −1) = (6, −2)» / «(6, −2) − (1, 1) = (5, −3)» | ninguna |
| 3 | texto | «(1, 2) + (3, 4) = (4, 6)» / «3 · (4, 6) = (12, 6)» | la segunda (debe ser (12, 18)) |

**Pasos:**
- [ ] `suma-escala.test.ts` con `checkProject(sumaEscala)` y con la comprobación de sus preguntas de código (referencia pasa, `starter` no), usando los mismos ayudantes que `tests/content/python.test.ts`. Ver que falla.
- [ ] Escribir el contenido.
- [ ] Comprobación: `npx vitest run src/games/vectores/suma-escala.test.ts` en verde.
- [ ] Commit.

---

### Tarea 17: Contenido del proyecto «Norma y distancia»

**Ficheros:** crear `src/games/vectores/norma-distancia.ts`, `src/games/vectores/norma-distancia.test.ts`. **No** modifica `index.ts`.

**Consume:** como la tarea 16.

**Produce:** `export const normaDistancia: Project`, id `norma-distancia`, nombre «Norma y distancia», subtítulo «Cuánto mide y cuánto separa».

ex00, manipular (lecturas de norma y distancia):

| # | Contenido | Rango, `snap` | Metas |
|---|---|---|---|
| 1 | Mueve v hasta que su norma sea 5 | 6, 1 | norm(v)=5 |
| 2 | u fijo en (1, 1). Coloca v, que empieza en (1, 2), a distancia 5 de u | 6, 1 | distance(u, v)=5 |
| 3 | Haz que v sea unitario con componente x igual a 0,6 | 2, 0,2 | norm(v)=1, x=0,6 |
| 4 | perro fijo en (4, 3). Coloca la consulta q a menos de 1,5 de «perro» sin ponerla encima | 6, 1 | distance(q, perro): objetivo 1,2, tolerancia 0,3 |
| 5 | u fijo en (3, 4). Coloca w en la misma dirección que u y con norma 10 | 10, 1 | norm(w)=10, distance(w, u)=5 |

ex01, calcular:

| # | Tipo | Contenido | Respuesta |
|---|---|---|---|
| 1 | numero | ‖(3, 4)‖ | 5 |
| 2 | numero | ‖(1, −2, 2)‖ | 3 |
| 3 | numero | Distancia entre gato (3, 4) y lobo (4, −2) | 6,083, tolerancia 0,01 |
| 4 | vector | Vector unitario en la dirección de (3, 4) | (0,6, 0,8) |
| 5 | opcion | Palabra más cercana a la consulta q = (2, 4) | gato (distancia 1), frente a perro (2,24), bici (4,12), lobo (6,32) |

ex02, programar:

| # | Contenido | Comprobaciones |
|---|---|---|
| 1 | Con v = (3, 4), calcula `n` con `np.linalg.norm` | `n == 5` |
| 2 | Con v = (1, −2, 2), calcula `n` sin `np.linalg.norm`, con la raíz de la suma de cuadrados | `n == 3`; mensaje propio si vale 9 («falta la raíz») o 1 («has sumado sin elevar al cuadrado») |
| 3 | Con gato y lobo, calcula la distancia `d` | 6,0828; mensaje propio si vale 0,5279 («has restado las normas, no los vectores») |
| 4 | Con v = (3, 4), calcula el unitario `u` | (0,6, 0,8) y norma 1 |
| 5 | Con el diccionario `emb` y q = (2, 4), guarda en `mas_cercana` la palabra más cercana | `mas_cercana == "gato"` |

Hojas:

| # | Formato | Líneas | Línea errónea |
|---|---|---|---|
| 1 | texto | «v = (1, 2, 2)» / «‖v‖ = 1 + 2 + 2» / «‖v‖ = 5» | la segunda (faltan los cuadrados y la raíz; vale 3) |
| 2 | codigo | `a = np.array([3, 4])` / `b = np.array([4, -2])` / `d = np.linalg.norm(a) - np.linalg.norm(b)` | la tercera |
| 3 | codigo | `v = np.array([3, 4])` / `u = v / np.linalg.norm(v)` | ninguna |

La meta 4 de ex00 admite los puntos de rejilla a distancia 1 o √2 de perro. La meta 5 solo la cumple (6, 8) entre los puntos de rejilla; el implementador lo confirma con `checkReachable` y con una comprobación de unicidad en su test.

**Pasos:**
- [ ] `norma-distancia.test.ts` como en la tarea 16, más la unicidad de la meta 5 de ex00. Ver que falla.
- [ ] Escribir el contenido.
- [ ] Comprobación: `npx vitest run src/games/vectores/norma-distancia.test.ts` en verde.
- [ ] Commit.

---

### Tarea 18: Banco de examen y registro de la órbita completa

**Ficheros:** crear `src/games/vectores/examen-0.ts`; modificar `src/games/vectores/index.ts`.

**Produce:** `export const examen0: BankEntry[]`. `vectores` queda con la Órbita 0 completa: proyectos `componentes`, `suma-escala`, `norma-distancia` y el banco definitivo, que sustituye al provisional.

**Banco** (4 entradas por proyecto):

| Proyecto | Entradas |
|---|---|
| `componentes` | generada `desplazamiento`; opcion: forma de `np.array([[1, 2], [3, 4], [5, 6]])`, que es `(3, 2)`; vector: componentes de un vector dibujado, (−5, 2); codigo: dado `emb`, guarda en `y` la segunda componente de «bici», que es 3 |
| `suma-escala` | generada `suma`; generada `combinacion`; generada `centroide`; codigo: centroide de gato, perro, lobo y tigre con `np.mean`, que es (3,5, 0,5) |
| `norma-distancia` | generada `norma` con `dim` 2; generada `norma` con `dim` 3; generada `distancia`; generada `unitario` |

**Pasos:**
- [ ] Registrar los tres proyectos y el banco; ver qué pruebas genéricas fallan y corregir el contenido, no las pruebas.
- [ ] Comprobación: `npm test` en verde. `tests/content/games.test.ts` informa de 1 juego, 3 proyectos, 45 preguntas de proyecto, 9 hojas y 10 de Despegue (añadir esos recuentos como aserciones para «vectores»).
- [ ] Jugar un examen completo en el navegador con `?abierto`.
- [ ] Commit.

---

### Tarea 19: Humo en navegador, README y revisión final

**Ficheros:** crear `playwright.config.ts`, `tests/e2e/smoke.spec.ts`, `README.md`, `CLAUDE.md`; modificar `package.json` (guion `e2e`).

**Reglas:**
- Playwright usa el Chrome del sistema (`channel: 'chrome'`; hay `/usr/bin/google-chrome`) y arranca `npm run preview` sobre la compilación.
- `README.md`: qué es, cómo arrancarlo, estructura de carpetas, cómo añadir una pregunta, un proyecto y un juego, y qué garantizan las pruebas de contenido.
- `CLAUDE.md` del proyecto: guiones de comprobación, las restricciones globales de este plan que siguen vigentes, y que el proyecto no tiene ganchos de git ni despliegue (quien haga push es la última barrera).

**Prueba de humo**, con el almacenamiento vacío:

1. Abre `/`, entra en el juego y ve el despegue abierto y la Órbita 0 cerrada.
2. En el despegue, resuelve la pregunta 1 moviendo el vector con el teclado y la entrega: acierto.
3. Con `?abierto`, abre `componentes`, ex02, pregunta 1; escribe `v = np.array([4, 3])` y entrega: comprobaciones superadas. Tiempo de espera amplio para la primera carga de Python.
4. En esa misma pantalla ejecuta `while True: pass`: aparece el mensaje de tiempo agotado y la página sigue respondiendo; después `print(1)` muestra «1».
5. Escribe código, recarga la página: el borrador sigue.
6. Completa entero el ejercicio ex01 de `componentes`, recarga, y la marca del ejercicio sigue en el panel del proyecto.
7. Con la red bloqueada para el dominio del CDN de Pyodide y la caché vacía, una pregunta de código muestra el mensaje de carga fallida y el botón de reintento, y una pregunta `numero` sigue funcionando.

**Pasos:**
- [ ] Escribir la prueba de humo y hacerla pasar; un fallo aquí se arregla en el código, no relajando la prueba.
- [ ] Escribir `README.md` y `CLAUDE.md`.
- [ ] Comprobación: `npm run check`, `npm test`, `npm run build` y `npm run e2e` en verde, con la salida en el informe.
- [ ] Commit.
- [ ] La sesión principal lanza `code-reviewer` sobre la rama entera y, tras sus arreglos, comprueba los criterios de éxito del spec: Despegue y Órbita 0 jugables con `npm run dev`, progreso tras recargar, `npm test` en verde.

## Riesgos que viajan con el plan

Del spec, sección 11, siguen abiertos y deben figurar en cada brief al que afecten:

- **matplotlib en Pyodide sobre Node no está verificado.** Lo resuelve la tarea 6; de su respuesta dependen las tareas 8, 15, 16, 17 y 18.
- **Peso y tiempo de carga de Pyodide.** La tarea 11 lo mide. Si la primera carga supera unos 15 segundos, la sesión principal decide si precargar al entrar en un proyecto.
- **Las comprobaciones de código pueden rechazar soluciones correctas distintas de la de referencia.** Las pruebas solo garantizan que la referencia pasa. Cada tarea de contenido prueba a mano al menos una solución alternativa por pregunta de código y, si una comprobación resulta estrecha, la amplía y añade esa alternativa como caso de prueba.
- **Calidad didáctica.** Ninguna prueba la mide. El revisor de las tareas 15 a 18 lee cada enunciado, pista, explicación y solución en busca de errores matemáticos y de textos que no enseñen; el juicio final es del propietario al jugar.
- **`index.ts` del juego es un punto compartido.** Solo lo tocan las tareas 15 y 18, por eso 16 y 17 pueden ir en paralelo.
- **`strings.ts` y `theme.css` los modifican varias tareas de interfaz.** Las tareas que los tocan no se ejecutan a la vez entre sí: 9, 10, 11, 12, 13 y 14 van en ese orden. Sí pueden ir en paralelo con las de contenido (15 a 18), que no tocan `src/ui`.
