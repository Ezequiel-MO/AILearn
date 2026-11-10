# Rehacer «Manipular» y «Calcular» del juego 2 de AIlearn con laboratorios (datos de IA a la vista, metas que son consecuencias) y seguir completando la ruta, en el worktree `ia-grafica-roadmap`

## CONTEXT

Oliver pidió el 2026-11-10, jugando lo que hay en producción (`origin/main` = 64ae89f, que ya incluye `purpose`, `bigPicture`, la Órbita 3 de matrices, la Órbita 0 del juego 3 y la pasada «más visual y jugable»):

> «mejora los gráficos de la sección "Matrices y transformaciones" en adelante, la jugabilidad, y las siguientes secciones tienen que ser más gráficas, y me tienen que enseñar mejor cómo funciona la IA. Actualmente, la sección "Manipular" suele tener ejemplos mal explicados, y acabo moviendo vectores sin ningún sentido, y la parte de calcular suelen ser ejercicios irrelevantes que no me enseñan cómo funciona realmente la IA. Mejora todo el juego para enseñarme bien, y completa el roadmap.»

Diagnóstico (auditoría de ese día, con capturas): de las 62 preguntas «Manipular» del juego 2, ninguna muestra datos, palabras ni la salida de un modelo (son «arrastra î hasta (1, 0)» o «gira v hasta que la lectura marque 4»; el PCA ni dibuja los puntos); de las 60 de «Calcular», 18 tratan una magnitud real de IA. El texto de `purpose` habla de IA y la pantalla no. La respuesta es un tipo de pregunta nuevo, el **laboratorio**: una escena con datos de IA, mandos y la consecuencia medida en vivo, con metas que son desigualdades sobre esa consecuencia.

Se trabaja en `/home/olive/projects/AIlearn/.claude/worktrees/ia-grafica-roadmap`, rama `worktree-ia-grafica-roadmap`, desde `origin/main` 64ae89f. El `main` local del checkout principal va 41 commits por detrás de `origin/main`: no lo toques ni leas de él. Nada se ha subido (push) ni fusionado. La sesión se cortó aquí por la regla de contexto de Oliver (más de 300k tokens), no por un bloqueo.

Hecho, con commit y comprobado (`npm run check` limpio; `npx vitest run src/engine src/content src/ui src/storage tests/content tests/deps tests/lint --exclude "**/*.python.test.ts"`: 58 ficheros, 3309 pruebas en verde; `npm run build` en verde; cada laboratorio visto en Chrome en `#/dev/labs` a 1100 px):

- `34fde58`: el marco. Pregunta `laboratorio` en el esquema (`labQSchema`: `lab`, `goals`, `solved`, `purpose`), admitida en el ejercicio «Manipular», el despegue y el banco; `lab` como figura para explorar en `numero`, `vector` y `opcion`. Corrección en `grade.ts`, `checkLab` en `validate.ts` (dentro de `gameProblems`), `answerOf` en `exam.ts`. Interfaz: `src/ui/labs/` (`parts.tsx` con `Handle`, `Slider`, `Choice`, `Readouts`, `LabFrame`; `GoalMeters.tsx`, medidores de meta en vivo; `Lab.tsx`; `labs.css`), `src/ui/questions/LabQuestion.tsx` (con «Ver una solución» al cerrarse), ruta de desarrollo `#/dev/labs`. `tests/content/purpose.test.ts` y `prose-helpers.ts` ya cuentan las `laboratorio`. Y el laboratorio `capa`: una nube de palabras pasa por una capa lineal.
- `b83a9e2`: laboratorios `atencion`, `compresion` (SVD) y `lora`, cableados. `capa` gana `cov_xy`, `asym` e `iter_turn`.
- `bf8e38d`: laboratorio `descenso` (descenso de gradiente sobre un paisaje de dos parámetros) y los laboratorios descritos en `CLAUDE.md`.

Hecho pero NO comprobado, o a medias:

- Ningún laboratorio se ha visto a 390 px, ni arrastrando con ratón o dedo (solo teclado, en pruebas de jsdom, y capturas estáticas).
- No se ha lanzado `npm test` entero (las pruebas de Pyodide) ni `npm run e2e`. Ningún juego usa todavía una pregunta `laboratorio`: el contenido que juega Oliver no ha cambiado.
- Retoques vistos en las capturas y sin hacer:
  - `atencion`: la nota «mira desde aquí» bajo la ficha del token queda cortada y el rótulo de la consulta pisa a un token cercano.
  - `descenso`: las bandas del mapa se ven a escalones; la muestra del valle usa escalas distintas en cada eje y el valle no parece estrecho; la gráfica de pérdida ocupa todo el ancho cuando va sola; sus lecturas usan 3 decimales y los medidores de meta 2 (una meta de 0,004 se leería «0»).
  - `compresion`: rótulos de fila de más de unos 8 caracteres se recortan.
  - `GoalMeters`: solo formatea `percent` e `integer`; los recuentos grandes de `lora` salen sin separador de miles.
- `README.md` no nombra los laboratorios (solo `CLAUDE.md`).
- Los encargos y este traspaso van en un cuarto commit de solo documentación (`docs: traspaso de los laboratorios…`), encima de `bf8e38d`.

## TARGET FILE(S)

- `docs/handoffs/2026-11-10-laboratorios-y-ruta/guia-contenido.md`: **la autoridad para escribir preguntas**: las cinco reglas, la forma de una pregunta `laboratorio`, «Calcular» con laboratorio, pruebas por proyecto.
- `docs/handoffs/2026-11-10-laboratorios-y-ruta/brief-juego-2.md`: **el encargo que ejecutar primero**: historia del juego 2, las nubes de palabras de `datos.ts` y el diseño pregunta a pregunta de «Manipular» y «Calcular» del despegue y los 12 proyectos, con el orden de trabajo.
- `docs/handoffs/2026-11-10-laboratorios-y-ruta/laboratorios.md`: catálogo: los 5 construidos, los 6 pasos de cableado y las fichas de los 12 por construir (`grafo`, `ajuste`, `distribucion`, `muestra`, `umbral`, `red`, `pixeles`, `tokens`, `bloque`, `contexto`, `rag`, `agente`).
- `docs/handoffs/2026-11-10-laboratorios-y-ruta/brief-laboratorio-comun.md`: el encargo común para quien construye un laboratorio (se usó tal cual con los cuatro últimos y funcionó).
- `docs/handoffs/2026-11-10-laboratorios-y-ruta/plan-ruta.md`: juegos 3 a 9, proyecto a proyecto: laboratorio, qué se descubre, cálculo y código.
- `docs/handoffs/2026-11-10-laboratorios-y-ruta/labshot.mjs` y `shots.mjs`: guiones de Playwright para capturas (`node --input-type=module - <carpeta> [filtro] < labshot.mjs` desde la raíz del worktree, con `npx vite --port 4320 --strictPort` en marcha; `BASE` y `W` por variables de entorno).
- `src/engine/labs/<kind>.ts`: la cabecera de cada modelo lista sus mandos y métricas; es la referencia al escribir metas. `src/ui/dev/labs/<kind>.ts`: preguntas de muestra válidas que copiar.
- `src/games/matrices/columnas.ts`, `columnas.test.ts`, `examen-0-columnas.ts`: el primer proyecto que se reescribe (ejercicios 0 y 1). Hoy sus cinco «Manipular» son metas de coordenadas sobre `transformPlane`.
- `src/games/matrices/index.ts`, `despegue.ts`, `orbita-2-planos.test.ts`: el montaje del juego 2, su despegue y una prueba que afirma los planos viejos de la Órbita 2.
- Solo lectura: `docs/handoffs/2026-11-04-juego-3-gradiente/guia-contenido-juego-3.md` (presupuestos de texto, siguen en pie) y `src/games/gradiente/minimos.ts` (el mejor patrón que había: pérdida enlazada a sus datos).

## GOAL

El juego 2 «Matrices y transformaciones» deja de tener preguntas de «mover vectores sin sentido»: los ejercicios «Manipular» y «Calcular» de sus 12 proyectos y las preguntas equivalentes de su despegue quedan reescritos según `brief-juego-2.md` (toda «Manipular» es un `laboratorio` con palabras o tokens a la vista y metas que son consecuencias; toda «Calcular» es un paso real de la máquina, al menos tres por proyecto con `lab`), con sus `*.test.ts` y bancos de examen al día, capturas miradas de cada pregunta de «Manipular», y `npm test`, `npm run build` y `npm run e2e` en verde, en commits de la rama `worktree-ia-grafica-roadmap`. Si queda margen antes de la regla de contexto, seguir con el juego 3 (órbitas 1 a 3) según `plan-ruta.md`; cada juego posterior es su propia sesión con su traspaso.

## LOAD-BEARING DETAILS

1. **Proceso ligero** (memoria `ailearn-light-process`): nada de skills de superpowers (ni brainstorming, ni writing-plans, ni subagent-driven-development); Oliver lo ha corregido dos veces. `implementer` con su encargo, `npm run check` y las pruebas como red, una revisión ligera al final y los hallazgos a una lista para Oliver.
2. **Las cinco reglas de `guia-contenido.md` son el encargo**, no un adorno: datos de IA a la vista, meta = consecuencia, varias soluciones, cada pregunta una sorpresa, «Calcular» = paso de una máquina real. Una pregunta nueva que diga «pon î en…» o «hasta que la lectura valga…» repite el fallo del que Oliver se queja. Añadir más texto de `purpose` no lo arregla: ya se probó dos veces (2026-10-28).
3. **Primero el ejemplo resuelto.** `datos.ts` y el proyecto Columnas entero los hace la sesión principal (o un `implementer` promovido a opus, `[opus: proyecto ejemplar]`), se miran en capturas, y su diff es el modelo que se entrega a los demás agentes. Sin ejemplo, cuatro agentes inventan cuatro estilos.
4. **Se conservan los ids de pregunta** (`<proyecto>.ex00.1`…, `despegue.N`): el progreso guardado (local y Firestore) guarda intentos por id y marcas por `proyecto/ejercicio`. Reescribir el contenido bajo el mismo id no rompe nada; renombrar ids deja intentos huérfanos.
5. **Las expectativas viejas se reescriben a propósito, no se relajan.** Cada `<proyecto>.test.ts` afirma las metas y respuestas actuales con `// contract:`. Al cambiar el contenido cambia el contrato: sustituye esas pruebas por las de `guia-contenido.md` («Pruebas por proyecto») y di en el `// contract:` que es la petición de Oliver del 2026-11-10. `orbita-2-planos.test.ts` se retira o se reescribe con la Órbita 2.
6. **`checkLab` manda**: `solved` tiene que caer en la rejilla de los mandos (`stateProblems`) y cumplir las metas, el estado inicial no, y cada meta debe nombrar una métrica que el laboratorio mide. Comprueba cada pregunta con `labMeasure` antes de escribirla. Una meta `eq` sobre un valor con decimales necesita `tol`.
7. **El contrato de los laboratorios construidos no se cambia sin motivo**: nombres de mandos (`ix`, `iy`, `jx`, `jy`, `vx`, `vy` en `capa`; `qx`, `qy`, `temp`, `mask` en `atencion`; `k`, `c1`… en `compresion`; `b1`, `b2`, `a1`, `a2`, `r` en `lora`; `sx`, `sy`, `lr`, `n`, `opt`, `beta`, `batch` en `descenso`) y de métricas: los usan `solved` y `goals` de las muestras y los afirman sus pruebas. Añadir una métrica es libre; renombrar, no.
8. **Cableado de un laboratorio nuevo: seis ediciones** (`laboratorios.md`). Los agentes que construyen laboratorios no tocan los ficheros de cableado (varios a la vez los pisarían); lo hace la sesión principal y después lo mira en `#/dev/labs`.
9. **El gancho del worktree rechaza órdenes de Bash complejas** (heredocs, scripts en línea, cadenas largas): una orden sencilla por llamada, desde la raíz del worktree, sin `cd`. Ficheros con Write y Edit. A los agentes hay que decírselo (está en `brief-laboratorio-comun.md`).
10. **`node_modules` del worktree es una copia con enlaces duros** del checkout principal (`cp -al`): el servidor de desarrollo de Vite funciona aquí (`npx vite --port 4320 --strictPort`), al contrario que en worktrees anteriores con enlace simbólico. No ejecutes `npm install`.
11. **En examen, nada que diga si una entrega está bien**: `GoalMeters` recibe `quiet` y `LabQuestion` no ofrece «Ver una solución» con `hideChecks`. Lo afirma `src/ui/labs/labs.test.tsx`; consérvalo.
12. **Listas mantenidas a mano que un juego nuevo rompe**: `tests/content/games.test.ts` (`toHaveLength(3)`), `GameGlyph` en `src/ui/MapGlyphs.tsx` (un emblema por id de juego), las órbitas citadas en `src/games/network.ts`, y `bigPicture` en todo juego y proyecto (120 a 480 caracteres, sin repetir). Bancos de examen de juegos nuevos: entradas fijas, sin generadores nuevos (ids globales con tablas a mano en `generators.test.ts`).
13. **Las pruebas de Pyodide tardan y necesitan red**; lanza sola la que falle antes de concluir que el contenido está mal. `npm test` entero, solo al final de un arco.
14. **Regla de contexto de Oliver**: al pasar de unos 200k tokens, traspaso en la siguiente frontera de tarea. Esta sesión y las dos anteriores se cortaron por eso: reparte el trabajo en agentes y no leas ficheros grandes en la sesión principal.

## CONSTRAINTS

- Solo dentro del worktree. Sin `npm install` ni cambios de versión. Sin `git add -A`, `git stash` ni `git reset`: commits por nombre de fichero.
- Sin push ni merge a ninguna rama y sin despliegue salvo que Oliver lo pida: un push a `main` publica en producción. La rama se queda lista y Oliver decide.
- En el juego 2 no se tocan «Programar», las hojas ni el calentamiento (salvo una referencia a una pregunta que desaparece), ni las reglas del motor (`src/engine/types.ts`: 3 ejercicios de 5 preguntas, examen de 6). Si convendría aligerar un proyecto, va a la lista para Oliver.
- El juego 1 queda fuera de este arco (Oliver dijo «de Matrices en adelante»). Va en la lista: sus «Manipular» tienen el mismo problema y sigue en `PENDING` de `purpose.test.ts`.
- Todo texto visible en castellano, con coma decimal (`{,}` en fórmulas); identificadores en inglés. Toda expectativa nueva lleva `// contract:`. Como mucho 4 agentes a la vez, y ninguno lanza otros agentes.
- Sin librerías nuevas: SVG y CSS propios, colores de los tokens del tema (`--lab-*`, `--color-*`).

## HOW TO VERIFY

1. Arranque: `git log --oneline -5` enseña el commit de documentación y `bf8e38d`, `b83a9e2`, `34fde58` sobre `64ae89f`; `npm run check` limpio; `npx vitest run src/engine/labs src/ui/labs` da 10 ficheros y 205 pruebas en verde.
2. Tras cada proyecto reescrito: `npx vitest run src/games/matrices/<proyecto>.test.ts` en verde (incluye `checkProject`, que ejecuta `checkLab` en cada `laboratorio`), y capturas a 390 y 1100 px de sus cinco «Manipular» con `?abierto`, miradas: se ven palabras o tokens, la meta se entiende sin leer el `purpose`, y lo que cambia al mover se ve.
3. Tras el juego 2 entero: `npx vitest run src/games/matrices tests/content` (recorre `games.test.ts`, `purpose.test.ts`, `big-picture.test.ts`, `python.test.ts`, `warmup*.test.ts`), después `npm test` entero, `npm run build` y `npm run e2e`, todo en verde. Añade a `tests/e2e/smoke.spec.ts` un paso que resuelva con el teclado una pregunta `laboratorio` del juego 2.
4. Una comprobación de fondo, no solo de forma: en `src/games/matrices/` no queda ninguna pregunta de tipo `manipular` en el ejercicio 0 de ningún proyecto (`grep -c "type: 'manipular'"` por fichero), y ninguna meta `laboratorio` es una posición disfrazada (las métricas `m11`…`m22` no aparecen en `goals`).
5. Revisión ligera al final (`code-reviewer` sobre `origin/main...HEAD`), hallazgos a la lista, sin ronda de arreglo automática.
6. Informe para Oliver: rama, commits, pruebas observadas, capturas miradas, lo que queda de la ruta según `plan-ruta.md` y la lista de hallazgos (incluidos los retoques de laboratorio de CONTEXT). Recuerda que no se ha subido nada.
