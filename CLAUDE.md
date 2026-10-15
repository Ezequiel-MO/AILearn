# AIlearn: guía para el agente

Juegos para aprender ingeniería de IA (React, Vite, TypeScript estricto, Pyodide). Hoy: el motor de la trayectoria y el juego 1, «Vectores y embeddings» (Despegue, Órbita 0 y Órbita 1). Spec, la autoridad: `docs/superpowers/specs/2026-10-13-motor-y-juego-1-vectores-design.md`. Cómo arrancar y cómo añadir contenido: `README.md`.

## Cómo comprobar

Node 22 y npm 10. No ejecutes `npm install` ni cambies versiones sin que se pida.

- `npm run check`: `tsc --noEmit` y ESLint. Tras cualquier cambio.
- `npm test`: Vitest entero (motor, contenido, almacenamiento, interfaz, Pyodide en Node). Lento y pesado. Para un cambio, lanza solo el fichero: `npx vitest run <ruta>`. Lanza siempre Vitest desde la raíz del repositorio: la caché de paquetes de Pyodide usa el directorio actual.
- `npm run build`: `check` y compilación en `dist/`.
- `npm run e2e`: prueba de humo con Playwright en el Chrome del sistema (`/usr/bin/google-chrome`), sobre la compilación servida con `npm run preview`. Compila antes. Es el guion que añade la tarea 19a (`playwright.config.ts`, `tests/e2e/smoke.spec.ts`). Vitest no recoge `tests/e2e`.
- `npm run format`: Prettier. Comprueba un fichero con `npx prettier --check <ruta>`.

Un fallo de la prueba de humo se arregla en el código, no relajando la prueba. La prueba de contenido que falla se arregla en el contenido.

Despliegue: el remoto `origin` es `github.com/Ezequiel-MO/AILearn`, enlazado a Vercel. Un push a `main` publica en producción (https://ailearn-peach.vercel.app/); un push a otra rama crea una vista previa. No hay ganchos de git: nada comprueba por ti al hacer commit o push, y Vercel solo compila. Quien hace push es la última barrera, así que ejecuta antes `build` (incluye `check`), las pruebas afectadas y, si cambia la interfaz, `e2e`.

## Qué no romper

- TypeScript en modo `strict`. Sin `any` salvo en la frontera con Pyodide.
- `src/engine` no importa nada de fuera de `src/engine` (ni paquetes). Lo impone ESLint con la regla local `engine-isolation`.
- Ninguna regla de puntuación o desbloqueo fuera de `src/engine`. La interfaz pregunta al motor.
- Solo `src/storage` toca `localStorage` (ESLint lo impone; `tests/e2e` está exento para sembrar progreso).
- El contenido es dato serializable: sin funciones. Una pregunta con números variables nombra un generador de `src/content/generators.ts`; la meta de un `manipular` es una condición declarativa; la corrección de código es texto Python con `check(...)`.
- Todo texto visible, en castellano. Identificadores del código, en inglés. Los textos fijos de la interfaz viven en `src/ui/strings.ts`, un grupo `t.<área>` por área.
- Decimales con coma al mostrarlos; se aceptan con coma o con punto. Pares con algún decimal separados por «; ».
- Sin librería de estado global, sin librería de gráficos para el plano (SVG propio) y sin librería de internacionalización.
- Tipografías servidas desde el propio sitio. Ninguna llamada a red en tiempo de juego salvo la descarga de Pyodide y sus paquetes (CDN, versión fijada en `src/python/config.ts` y en `package.json`: deben coincidir) y Firebase (sesión y progreso en la nube).
- Constantes de las reglas (`src/engine/types.ts`): validación 80; proyecto de 3 ejercicios de 5 preguntas; examen de 6 preguntas, aprobado con 5; XP 50 por el despegue, 50 por examen, 10 por hoja y la nota por proyecto validado; nivel = XP / 150 con dos decimales.
- Clave de progreso `ailearn:v1:local:<juego>`; borradores en `ailearn:v1:local:<juego>:borradores`.
- Todo paquete importado desde `src/` debe estar declarado en `package.json` (`tests/deps`). KaTeX tiene una sola versión.
- `?abierto` salta las puertas, también en producción (el sitio es solo para Oliver). Dura hasta recargar la página; el mapa y el panel lo respetan.
- No se hace push (a ninguna rama) ni se despliega sin que se pida. `.vercel/` y `.env*` no se suben.
- Sin `git add -A`, `git stash` ni `git reset`: haz commit de los ficheros que cambias, por nombre.

## Dónde vive cada cosa

- `src/engine/`: reglas (`progression.ts`: nota, validación, puertas, examen, XP, nivel; `vectors.ts`: métricas del plano, también producto escalar, coseno, ángulo en grados y proyección; `rng.ts`; `session.ts`; `types.ts`).
- `src/content/`: `schema.ts` (esquema Zod de pregunta, proyecto, órbita y juego), `validate.ts` (`gameProblems`), `generators.ts`, `grade.ts`, `exam.ts` (sorteo del examen).
- `src/python/`: `worker.ts`, `runner.ts` (la interfaz que usa la interfaz), `core.ts` y `harness.ts` (ejecución y comprobaciones), `node.ts` (Pyodide en Node para las pruebas), `config.ts`.
- `src/storage/`: `local.ts` (sobre `localStorage`), `migrate.ts`, `merge.ts` (fusión de dos documentos del mismo jugador), `types.ts`. Un documento ilegible se aparta, no se borra.
- `src/cloud/`: `firebase.ts` (configuración, sesión con Google, sincronización en Firestore; se carga en diferido) y `store.ts` (envuelve el almacén local: lo local manda y la nube se fusiona al entrar, al cargar y tras cada guardado). Progreso en `users/{uid}/progress/{juego}` como texto JSON; los borradores no suben. Reglas en `firestore.rules`, publicadas a mano en la consola.
- `src/ui/`: `Layout`, `Account` (inicio de sesión en la cabecera), `VectorPlane`, `CodeEditor`, `ExerciseRunner`, `Md`; `questions/` (un componente por tipo); `screens/` (pantallas y puertas); `dev/` (rutas `#/dev/*`, solo en desarrollo); `strings.ts`.
- `src/games/index.ts`: registro de juegos; `src/games/vectores/`: contenido del juego 1.
- `src/App.tsx`: rutas con `HashRouter`: `/`, `/j/:game`, `/j/:game/p/:project`, `/j/:game/estadisticas` (estas cuatro, de la tarea 14), `/j/:game/despegue`, `/j/:game/p/:project/ex/:n`, `/j/:game/p/:project/hoja/:n`, `/j/:game/examen/:c`.
- `tests/content/`: pruebas que recorren `games` y ayudantes (`python-helpers.ts`, `prose-helpers.ts`). `tests/deps/`, `tests/lint/`, `tests/e2e/`.
- `docs/superpowers/`: specs y planes.

## Contenido: reglas que las pruebas hacen cumplir

- Añadir un juego: exportar un `Game` y registrarlo en `src/games/index.ts`. Las pruebas genéricas lo recorren solas (esquema, ids únicos, metas de `manipular` alcanzables y no resueltas al inicio, banco con 3 exámenes distintos, generadores y respuestas declaradas, opciones no repetidas; en las de código, `reference` pasa, `starter` no y hay `check(`).
- Lo que NO se descubre solo y hay que cablear por proyecto: `defineProseTests(...)` (reglas de prosa) y las pruebas `*.python.test.ts` de soluciones alternativas y errores típicos de cada pregunta de código. Un proyecto nuevo sin ellas pasa `npm test` pero queda sin revisar.
- Un `manipular` admite como mucho 2 vectores móviles.
- Toda expectativa de una prueba lleva un comentario `// contract:` con su procedencia. No cambies una expectativa existente para que pase: arregla el código o el contenido.
- Las pruebas que cargan Pyodide tardan (7 a 14 s en frío) y necesitan red la primera vez. Si fallan por carga o por plazo, lánzalas solas antes de concluir que el contenido está mal.
