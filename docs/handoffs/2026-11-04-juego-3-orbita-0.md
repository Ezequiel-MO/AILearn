# Terminar el juego 3 «Derivadas y gradiente» de AIlearn: su Órbita 0 «La pendiente» (tres proyectos, generadores del examen y montaje), en el worktree `juego-3-gradiente`

## CONTEXT

Oliver pidió el 2026-11-04: «completa el siguiente paso en el roadmap para comprender cómo funciona la IA, pero necesito que incorpores algunos visuales más, más intuición, más visualización y más contexto sobre cómo se relacionan los ejercicios que estoy haciendo con el big picture de una red neuronal. Estoy haciendo un gran esfuerzo para aprender, pero completar cada nivel está siendo tedioso.»

Los juegos 1 y 2 están completos y publicados: `origin/main` = 129f540 incluye la Órbita 3 de matrices. El `main` local del checkout principal va 17 commits por detrás; no lo toques. El siguiente paso de la ruta es el juego 3. Se trabaja en el worktree `/home/olive/projects/AIlearn/.claude/worktrees/juego-3-gradiente`, rama `worktree-juego-3-gradiente`, desde 129f540. Nada se ha subido (push) ni fusionado.

Hecho, con commit y comprobado: `npm run check` limpio y `npx vitest run src/ui src/content src/engine tests/content src/games/gradiente --exclude '**/*.python.test.ts'` en verde, 2827 pruebas.

- `4053d36`: el contrato del plano de curvas.
  - `src/engine/curves.ts` define `Curve`: `poly` por coeficientes y `mse`, la pérdida media de ŷ = w·x. Calcula f y f′ exactas, `mseBest` y las métricas `x`, `y`, `fx`, `slope`, `secant`, `line_slope` y `line_icpt`.
  - En el esquema: `graphSpecSchema`, la pregunta `curva` (va en el ejercicio Manipular) y `graph` como figura estática en `numero`, `vector` y `opcion`.
  - `graphPositions` y la corrección en `grade.ts`; `checkReachableCurva` en `validate.ts`.
  - `bigPictureSchema`, `NETWORK_PARTS` (13 piezas) y `src/games/network.ts` (la ficha de cada pieza).
  - Pruebas en `src/content/curva.test.ts` y `src/engine/curves.test.ts`.
- `af1a1ea`: `bigPicture` («Dónde encaja en la red») en los 24 proyectos y en los dos juegos 1 y 2. `tests/content/big-picture.test.ts` lo exige en todo juego y proyecto registrado, sin lista de pendientes (texto de 120 a 480 caracteres, reglas de prosa). Hay un ayudante nuevo, `plainTextProblems`, en `tests/content/prose-helpers.ts`.
- `f4f3e9b`: `src/ui/NetworkDiagram.tsx` (SVG de un modelo de lenguaje: camino «Responder», bucle «Aprender» y herramientas «Alrededor»), la tarjeta `src/ui/BigPicture.tsx` y la página `#/red` «La red por dentro» (`src/ui/screens/NetworkScreen.tsx`).
  - La tarjeta sale en el panel del proyecto, en el mapa del juego y encima del ejecutor del despegue. Se enlaza desde el inicio, el mapa y la ruta.
  - Capturas a 390 y 1200 px miradas: el panel de Coseno se lee bien en el móvil.
- `dae11c0`: `src/ui/CurvePlane.tsx`, `CurvaQuestion.tsx`, el `Stem` con `graph` y la ruta de desarrollo `#/dev/curvas`.
  - `CurvePlane` dibuja la curva, la tangente, la secante, la recta con su triángulo de avance y subida, f′ discontinua, la flecha «un paso» cuesta abajo y el panel `fit` (datos, recta ŷ = w·x y cuadrados de los errores, en la misma escala en los dos ejes).
  - Capturas miradas.
- `f0a2865`: el juego 3 registrado (`src/games/index.ts` = `[vectores, matrices, gradiente]`), con `bigPicture` y un despegue de 8 preguntas. Las de tipo `curva` son la 1, la 4 y la 6. Sus datos `mse` son x = (1, 2, 3, 4) e y = (2, 2, 5, 6), con w* = 1,5.
  - `despegue.python.test.ts`: 36 de 36 en verde, lanzado solo.
- `63dbb03`: `t.curve` y `t.network` en `strings.ts`, las secciones «=== Curvas ===» y «=== Red ===» de `theme.css`, y los encargos de la Órbita 0.

Hecho pero NO comprobado:

- Ninguna pregunta `curva` del despegue real se ha visto en pantalla; solo los ejemplos de `#/dev/curvas`.
- No se han lanzado `npm run build` ni `npm run e2e`.
- `npm test` entero no se ha lanzado tras juntar todo. Los `*.python.test.ts` se lanzaron cada uno solo, por su agente.

## TARGET FILE(S)

- `docs/handoffs/2026-11-04-juego-3-gradiente/brief-orbita-0.md`: **los encargos que ejecutar**. Lo común a A, B y C; el diseño pregunta a pregunta de A «Derivada como pendiente», B «Reglas de derivación» y C «Mínimos»; D, los generadores del examen; y E, el montaje. Es la autoridad.
- `docs/handoffs/2026-11-04-juego-3-gradiente/brief-comun.md`: reglas para todo agente (ficheros propios, commits por nombre, capturas con Playwright, formato del informe con `RISKS:`).
- `docs/handoffs/2026-11-04-juego-3-gradiente/guia-contenido-juego-3.md`: historia del juego, presupuestos de texto (que cada `*.test.ts` hace cumplir), visual primero, Programar de la mano, calentamiento de 1 o 2 fichas, modelos que copiar y el lanzador de NumPy `docs/handoffs/2026-11-02-orbita-3-matrices/pyrun.mjs`.
- `src/games/gradiente/index.ts`: el `Game` con `orbits: []`; el montaje (E) le añade la Órbita 0.
- `src/games/gradiente/despegue.ts`: hay que leerlo antes de escribir los proyectos, para no repetir preguntas ni datos.
- `src/games/gradiente/despegue.test.ts`: la línea 28 afirma `orbits` vacía; el montaje la amplía con `['La pendiente']`.
- `src/content/generators.ts` y `generators.test.ts`: el encargo D añade `pendiente-secante`, `derivada-polinomio` y `minimo-perdida` (a `IDS` y a la tabla de límites).
- Solo lectura: `src/content/schema.ts` (comentarios de `graphSpecSchema` y `curvaQSchema`), `src/engine/curves.ts`, `src/ui/CurvePlane.tsx`, y el modelo de proyecto completo `src/games/matrices/svd.ts` con `svd.test.ts`, `svd.python.test.ts`, `svd.calentamiento.ts` y `examen-3-svd.ts`.

## GOAL

La Órbita 0 «La pendiente» entra en el juego 3 con sus tres proyectos completos: Manipular con 5 preguntas `curva`, Calcular con 5 preguntas (al menos 3 con `graph`), Programar con 5 preguntas de código de la mano, 3 hojas, calentamiento, `bigPicture` y `purpose`. Lleva su banco `examen-0`: por proyecto, 3 entradas fijas y 1 generada. Queda registrada en `src/games/gradiente/index.ts`, con README y CLAUDE.md al día, y en verde `npm test`, `npm run build` y `npm run e2e`, todo en commits de la rama `worktree-juego-3-gradiente`. Al final, capturas miradas y una revisión ligera cuyos hallazgos van a una lista para Oliver.

## LOAD-BEARING DETAILS

1. **Proceso ligero** (memoria `ailearn-light-process`): nada de skills de superpowers (ni brainstorming, ni planes, ni subagent-driven-development). Oliver lo ha corregido dos veces («es un workflow demasiado pesado»). Se trabaja con `implementer` y su encargo, con `npm run check` y las pruebas como red, y una revisión ligera al final.
2. **A, B, C y D en paralelo, cuatro agentes `implementer`**, el máximo. Sus ficheros no se solapan: A, B y C escriben solo en `src/games/gradiente/<id>.*` y `examen-0-<id>.ts`, y D solo en `generators.ts` y su prueba. A cada uno se le pide: «Implement section X of `docs/handoffs/2026-11-04-juego-3-gradiente/brief-orbita-0.md`, following `brief-comun.md` and `guia-contenido-juego-3.md`», en este worktree, sin lanzar agentes, con commit solo de sus ficheros y por nombre.
3. **No registrar la órbita antes de que A a D estén en verde.** Un proyecto a medias rompe `gameProblems` (`tests/content/games.test.ts`) en todo el juego. El montaje (E) lo hace la sesión principal.
4. **El contrato de curvas no se cambia** (4053d36; lo afirman `curva.test.ts` y `curves.test.ts`).
   - Un punto `onCurve` no lleva `y`: su altura es siempre f(x) (`graphPositions`).
   - Como mucho hay 2 puntos móviles.
   - La meta tiene que ser alcanzable en la rejilla y no cumplirse al empezar. Lo comprueban `checkReachableCurva` y `checkStartNotSolved`, vía `checkProject`.
   - En una figura estática no va la lectura que da la respuesta (sin `slope` si se pide la pendiente).
5. **`purpose` en toda pregunta `curva` y de Calcular de un proyecto**, y **`bigPicture` en todo proyecto**. `tests/content/purpose.test.ts` y `big-picture.test.ts` recorren el registro: al montar, un proyecto sin ellos tumba esas pruebas. Los presupuestos de texto de la guía son la respuesta al «tedioso» de Oliver: no se amplían.
6. **Ids**: los de pregunta son `<id>.ex0N.k` y `<id>.hoja.k`; los del banco, `examen-0.<tema>` (únicos en todo el juego); las generadas, `examen-0.pendiente-secante`, `examen-0.derivada-polinomio` y `examen-0.minimo-perdida`. Los nombres de los proyectos son exactamente los de `src/games/roadmap.ts`: «Derivada como pendiente», «Reglas de derivación» y «Mínimos», en la órbita «La pendiente». Lo comprueba `tests/content/roadmap.test.ts`.
7. **El servidor de desarrollo de Vite no sirve en este worktree** (página en blanco). `node_modules` es un enlace al checkout principal y cae fuera de la lista de permitidos de Vite. Para ver pantallas, compila con `npx vite build --outDir <carpeta fuera del repo>`, sírvela con `npx vite preview --outDir <la misma> --port <libre>`, y saca capturas con Playwright usando `executablePath: '/usr/bin/google-chrome'`; míralas con Read. `node_modules` sale como `?? node_modules` y **nunca se añade**.
8. **Las pruebas de Pyodide tardan.** `despegue.python.test.ts` carga matplotlib y tarda unos 66 s, y puede pasarse del gancho `beforeAll` de 60 s con otros agentes en marcha. Antes de concluir que el contenido está mal, lanza sola la prueba que falle. Lo mismo con `play.test.tsx` y `vectores/prosa.test.ts`, que con la máquina cargada se pasan del plazo de 5 s.
9. **`despegue.test.ts:28`** afirma `gradiente.orbits` vacía: en el montaje se amplía a `['La pendiente']`, con un `// contract:` que diga la fecha de entrega. Es la excepción a «no cambies una expectativa»: afirma el andamiaje, no contenido.
10. **Regla de contexto de Oliver**: si esta sesión pasa de unos 200k tokens, haz el traspaso en la siguiente frontera de tarea. La sesión anterior se cortó por eso.

## CONSTRAINTS

- Solo dentro del worktree. Sin `npm install` ni cambios de versión. Sin `git add -A`, `git stash` ni `git reset`: los commits van por nombre de fichero.
- Sin push ni merge a ninguna rama, y sin despliegue, salvo que Oliver lo pida. Un push a `main` publica en producción. La rama se queda lista; Oliver decide.
- Los agentes A, B, C y D no tocan la interfaz, el esquema, el motor, `index.ts`, README ni CLAUDE.md. Si les falta algo compartido, lo dicen en su informe y lo hace la sesión principal.
- Todo texto visible va en castellano y con coma decimal (`{,}` en fórmulas). Toda expectativa nueva lleva `// contract:`.
- Lista para Oliver al final, sin arreglo automático (son de la sesión anterior):
  - En la pregunta 8 del despegue, quien elige w = 3 ve el mensaje de «has devuelto la posición», porque 3 es también el índice de la respuesta.
  - La tarjeta «Dónde encaja» va encima del ejecutor del despegue y empuja la primera pregunta hacia abajo.
  - El panel `fit` deja mucho espacio vacío a la derecha cuando la recta está muy inclinada.
  - `NetworkScreen` casa las órbitas por nombre exacto: si se renombra una, su enlace pasa a «Próximamente» sin avisar.
  - `NetworkDiagram` coloca las 13 piezas a mano: una pieza nueva obliga a editarlo.
  - Si se cambia el número de preguntas por ejercicio (5, en `src/engine/types.ts`) para que cada nivel pese menos, es una regla del motor y la decide Oliver.

## HOW TO VERIFY

1. Tras cada agente: `npx vitest run src/games/gradiente/<id>` en verde, incluido su `.python.test.ts` lanzado solo, y `npm run check` limpio. Para D: `npx vitest run src/content/generators.test.ts`.
2. Tras el montaje: `npx vitest run tests/content src/games`, que ya recorre la órbita en `games.test.ts`, `purpose.test.ts`, `big-picture.test.ts`, `warmup*.test.ts`, `python.test.ts` y `roadmap.test.ts`. Después, `npm test` entero en verde.
3. `npm run build` y luego `npm run e2e` en verde. Añade a `tests/e2e/smoke.spec.ts` un paso que abra `#/red` y uno que mueva con el teclado un punto de una `curva` del despegue del juego 3.
4. Mira capturas a 390 px (compilación servida, detalle 7, con `?abierto`):
   - `#/j/gradiente`: el mapa con la Órbita 0 y su tarjeta.
   - El panel de un proyecto con «Dónde encaja en la red».
   - La pregunta 4 del despegue: la pérdida con su panel de ajuste, entera y sin solapes.
   - Una `curva` de cada proyecto.
   - `#/red?pieza=gradient`, que debe enlazar los tres proyectos nuevos en «Dónde lo practicas».
   - `#/ruta`, donde «La pendiente» ya no sale como «Próximamente».
5. Revisión ligera: una pasada de `code-reviewer` sobre `origin/main...HEAD`. Sus hallazgos se suman a la lista de CONSTRAINTS en el informe final, sin ronda de arreglo.
6. Informe final para Oliver: rama, commits, pruebas observadas, capturas miradas y la lista de hallazgos. Recuerda que no se ha subido nada.
