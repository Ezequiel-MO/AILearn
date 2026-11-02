# Terminar la Órbita 3 «Descomponer y aproximar» del juego 2 de AIlearn: fase B de los tres proyectos (Programar, calentamiento, prueba de Python) y montaje de la órbita en el juego

## CONTEXT

Trabajo en el worktree `/home/olive/projects/AIlearn/.claude/worktrees/orbita-3-matrices`, rama `worktree-orbita-3-matrices`, creada desde `origin/main` (9b41d1d; el `main` local va por detrás, en 9e714ef). `node_modules` es un enlace simbólico al checkout principal: sale como `?? node_modules` y nunca se añade. Nada se ha subido (push) ni fusionado.

Hecho y comprobado (`npm run check` limpio; `npx vitest run src/games/matrices/svd src/games/matrices/rango-bajo src/games/matrices/atencion src/content/generators.test.ts`: 304 pruebas en verde):

- `c001064` métrica y lectura `stretch` del plano (|A·v| / |v|; NaN con v nulo; su máximo y su mínimo son σ₁ y σ₂): motor, esquema, `VectorPlane`, `strings.ts`, README y pruebas (230 en verde en sus cuatro ficheros).
- `5317be8` generadores `valores-singulares`, `parametros-lora` y `puntuacion-atencion` en `src/content/generators.ts` (+ pruebas, 159 en verde).
- Fase A de los tres proyectos, cada uno con Manipular (5) y Calcular (5) completos con `purpose`, 3 hojas, 2 entradas fijas del examen y su `<proyecto>.test.ts`: `240d851` Atención como matriz, `912049d` Rango bajo y LoRA, `1858c0e` SVD.

Hecho pero NO comprobado: nada de la Órbita 3 se ha visto en pantalla (planos nuevos, elipse que degenera en segmento, KaTeX). `tests/content/purpose.test.ts` y las pruebas genéricas de `tests/content` aún no recorren los proyectos nuevos porque la órbita no está registrada; los implementadores comprobaron longitud y unicidad de los `purpose` con pruebas temporales que borraron.

Sin commit todavía: la carpeta `docs/handoffs/2026-11-02-orbita-3-matrices/` y este fichero (si al empezar siguen sin commit, haz commit de ellos por nombre).

## TARGET FILE(S)

Encargos ya escritos, en `docs/handoffs/2026-11-02-orbita-3-matrices/` (son la autoridad para los implementadores; se les pasa la ruta, no se copian):
- `brief-comun.md`: reglas comunes, propiedad de ficheros, modelos a copiar (PCA de la Órbita 2), alcance de la fase A y de la fase B, comprobaciones, mensaje de commit e informe.
- `brief-svd.md`, `brief-rango-bajo.md`, `brief-atencion.md`: diseño pregunta a pregunta; su sección «ex02 Programar (phase B)» y «Warm-up» son lo que falta.
- `notas-fase-b.md`: lo que cada fase A dejó dicho para la fase B (qué pruebas de andamiaje cambiar, qué datos e ids ya están usados). Pásalo a cada implementador de la fase B junto con los otros dos.
- `brief-generadores.md`: encargo ya cumplido (5317be8), solo como referencia.
- `pyrun.mjs`: lanzador de NumPy con el Pyodide del proyecto: `node docs/handoffs/2026-11-02-orbita-3-matrices/pyrun.mjs <guion.py>` desde la raíz del worktree (guiones fuera del repositorio).

Proyectos (en `src/games/matrices/`):
- `svd.ts`, `rango-bajo.ts`, `atencion.ts`: ex00 y ex01 completos, 3 hojas, y el tercer ejercicio como marcador `{ kind: 'programar', questions: [] }`; sin `warmup`.
- `svd.test.ts`, `rango-bajo.test.ts`, `atencion.test.ts`: prosa, identidad, valores y alcanzabilidad; afirman hoy el marcador vacío (recuentos `[5, 5, 0]`).
- `examen-3-svd.ts`, `examen-3-rango-bajo.ts`, `examen-3-atencion.ts`: 2 entradas fijas cada uno (opcion y numero).

Montaje (los toca solo la sesión principal, después de la fase B):
- `src/games/matrices/index.ts`: hoy las Órbitas 0 a 2; falta la Órbita 3.
- `src/games/matrices/examen-3.ts` y `examen-3.test.ts`: no existen; modelo `examen-2.ts` y `examen-2.test.ts`.
- `src/games/matrices/despegue.test.ts`: afirma la lista de órbitas `['La máquina', 'El área', 'Direcciones propias']`.
- `README.md` (líneas 5, 7 y el árbol de `src/games/matrices`) y `CLAUDE.md` (primer párrafo): dicen que la Órbita 3 está prevista.

## GOAL

La Órbita 3 «Descomponer y aproximar» (SVD, Rango bajo y LoRA, Atención como matriz) entra en el juego 2 con sus tres proyectos completos y su examen: cada proyecto con Programar de 5 preguntas de código «de la mano» y su calentamiento, cada banco con 3 entradas fijas más 1 generada (12 en total), registrada en `index.ts`, con `npm test`, `npm run build` y `npm run e2e` en verde, todo en commits de la rama `worktree-orbita-3-matrices`. Al final, una pasada de revisión ligera cuyos hallazgos van a una lista para Oliver, no a rondas de arreglo.

## LOAD-BEARING DETAILS

1. **Proceso ligero (memoria `ailearn-light-process`).** Nada de skills de superpowers (ni brainstorming, ni planes, ni subagent-driven-development). Implementadores con su encargo, `npm run check` y `npm test` como red, y una revisión ligera al final. Si se salta, Oliver lo ha corregido dos veces: «es un workflow demasiado pesado».
2. **Fase B en paralelo, un `implementer` por proyecto (tres a la vez, como mucho cuatro agentes).** Sus ficheros no se solapan. Cada encargo: «Implement PHASE B of the project `<id>`», leyendo `brief-comun.md` (sección «Phase B»), `brief-<id>.md` y `notas-fase-b.md`, en este worktree, sin lanzar agentes, commit solo de sus ficheros por nombre. Ficheros de cada uno: editar `<id>.ts`, `<id>.test.ts` y `examen-3-<id>.ts`; crear `<id>.calentamiento.ts` y `<id>.python.test.ts`.
3. **SVD ex02.1 no usa A = (3 0; 4 5).** `brief-svd.md` la sugiere, pero ex01.2 ya la usa (lo dice `notas-fase-b.md`). Díselo al implementador de SVD en el encargo. Si no, la pregunta repite datos.
4. **Las pruebas de andamiaje de la fase A sí se cambian.** Los recuentos `[5, 5, 0]`, las pruebas de «programar vacío» y los recuentos del banco de dos entradas afirman el marcador, no contenido. La regla «no cambies una expectativa para que pase» no se aplica a ellas. Las demás expectativas de la fase A no se tocan.
5. **No registrar la órbita antes de que las tres fases B estén en verde.** El marcador vacío no cumple el esquema y `gameProblems` (`tests/content/games.test.ts`) fallaría en todo el juego.
6. **El banco `examen-3.ts`** sigue el patrón de `examen-2.ts`: por proyecto, las entradas fijas y una `generada`. Ids `examen-3.valores-singulares` (generador `valores-singulares`, proyecto `svd`), `examen-3.parametros-lora` (`parametros-lora`, `rango-bajo`) y `examen-3.puntuacion-atencion` (`puntuacion-atencion`, `atencion`). Los generadores ya existen y sus ids están en `IDS` de `generators.test.ts`. `checkExamBank` exige 3 exámenes distintos (semillas 1 a 3).
7. **`index.ts`**: órbita `{ name: 'Descomponer y aproximar', projects: [svd, rangoBajo, atencion], examBank: examen3 }`. Nombres exactos de `src/games/roadmap.ts`: `SVD`, `Rango bajo y LoRA`, `Atención como matriz`. Lo comprueba `tests/content/roadmap.test.ts`.
8. **`despegue.test.ts`**: amplía la lista de órbitas con `'Descomponer y aproximar'` y su comentario `// contract:` con la fecha de entrega. Así se hizo en `ecfdfd7` con la Órbita 2.
9. **La métrica `stretch` no se toca.** Los planos de SVD y Rango bajo dependen de ella. Su NaN con v nulo impide que «v = 0» cumpla una meta de estiramiento 0 (`rango-bajo.ex00.1`).
10. **Planos con dos vectores móviles** (`svd.ex00.3`, `rango-bajo.ex00.3` y `.ex00.4`): no ampliar `range` ni bajar `snap`. La comprobación de alcanzabilidad recorre todas las colocaciones. Además, `rango-bajo.ex00.4` solo tiene solución (1,5; 1,5) con snap 0,5.

## CONSTRAINTS

- Solo dentro del worktree. Sin `npm install` ni cambios de versión. Sin `git add -A`, `git stash` ni `git reset`: commits por nombre de fichero.
- Sin push ni merge a ninguna rama, y sin despliegue, salvo que Oliver lo pida. Un push a `main` publica en producción. La rama se queda lista; Oliver decide.
- Las fases B no tocan ficheros compartidos (generadores, esquema, motor, interfaz, `index.ts`, README, CLAUDE.md). Si hace falta un cambio compartido, lo dicen en su informe y lo hace la sesión principal.
- Todo texto visible en castellano, con coma decimal. Toda expectativa nueva lleva `// contract:`.
- Las pruebas de Pyodide se lanzan siempre desde la raíz del worktree. Tardan de 7 a 14 s en frío: si una falla por plazo, se relanza sola antes de concluir.
- Regla de contexto de Oliver: si esta sesión pasa de unos 200k tokens, haz el traspaso en la siguiente frontera de tarea.

## HOW TO VERIFY

1. Tras cada fase B: `npx vitest run src/games/matrices/<id>` en verde (incluye `<id>.python.test.ts`), y `npm run check` limpio.
2. Tras el montaje:
   - `npx vitest run tests/content src/games/matrices`: pruebas genéricas, `purpose.test.ts`, `warmup.test.ts`, `warmup.python.test.ts`, `python.test.ts`, `games.test.ts` y `roadmap.test.ts`, que ya recorren la órbita nueva.
   - Después, `npm test` entero en verde.
3. `npm run build` en verde, y luego `npm run e2e` (prueba de humo en `/usr/bin/google-chrome`) en verde.
4. Comprobación de contenido:
   - `examen-3.test.ts` recorre el banco: 12 entradas, 4 por proyecto, una generada en cada uno, ids únicos y sin chocar con los de proyecto.
   - En `#/ruta`, la Órbita 3 del juego 2 deja de salir como «Próximamente».
   - Con `npm run dev` y `?abierto`, `#/j/matrices` muestra la Órbita 3 con sus tres proyectos. Abre un Manipular de SVD y uno de Atención y mira que la lectura `|A·v| / |v|` y la elipse se ven.
5. Revisión ligera al final: una pasada de `code-reviewer` (o `spec-reviewer`) sobre el diff `origin/main...HEAD`. Sus hallazgos van a una lista en el informe final para Oliver, sin ronda de arreglo automática.
6. Informe final: rama, commits, pruebas observadas y la lista de hallazgos. Recuerda que no se ha subido nada.
