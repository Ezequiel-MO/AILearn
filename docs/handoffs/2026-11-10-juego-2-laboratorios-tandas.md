# Terminar de reescribir «Manipular» y «Calcular» del juego 2 de AIlearn con laboratorios: comprobar la tanda 1 de agentes, lanzar las que faltan (Órbitas 1 a 3 y el despegue) y cerrar el juego con sus pruebas, en el worktree `ia-grafica-roadmap`

## CONTEXT

Oliver pidió el 2026-11-10 rehacer el juego 2 «Matrices y transformaciones» porque en «Manipular» acababa «moviendo vectores sin ningún sentido» y «Calcular» eran «ejercicios irrelevantes». La respuesta es la pregunta `laboratorio` (datos de IA a la vista, metas que son consecuencias). El traspaso anterior, que sigue siendo la referencia de fondo, es `docs/handoffs/2026-11-10-laboratorios-y-ruta.md`; léelo solo si te falta contexto.

Se trabaja en `/home/olive/projects/AIlearn/.claude/worktrees/ia-grafica-roadmap`, rama `worktree-ia-grafica-roadmap`, desde `origin/main` 64ae89f. Nada se ha subido ni fusionado. Esta sesión se cortó por la regla de contexto de Oliver (el guardián avisó a 312k tokens), no por un bloqueo.

Hecho en esta sesión, con commit y comprobado:

- `8357eeb`: **el ejemplo resuelto**, el proyecto Columnas. Sus cinco «Manipular» son laboratorios `capa` (reseñas y correos, neurona que mira la salida 1; metas `acc` y `area`) y sus cinco «Calcular», pasos de una capa real (tres con `lab`). Banco: `examen-0.capa-mascotas` (laboratorio) y `examen-0.parametros-capa` en lugar de las dos entradas viejas; la de código se queda. Con él llegaron:
  - `src/games/matrices/datos.ts`: nubes `RESENAS`, `RESENAS_CUATRO`, `RESENAS_NEGATIVIDAD`, `CORREOS`, `ANIMALES`, `NUBE_ALARGADA`, `NUBE_CON_ATIPICO`, `NUBE_SIN_ATIPICO`, `NUBE_CLASES_CRUZADAS` y el ayudante `capaLab(nube, opciones)`; `datos.test.ts` afirma lo que cada nube promete.
  - `tests/content/lab-helpers.ts`: `defineLabProjectTests(proyecto, banco)` (toda «Manipular» es laboratorio, ninguna meta sobre `m11`…`m22`, rótulos de meta sin números, 3 de «Calcular» con `lab`, ninguna lectura que valga la respuesta, palabras y dianas dentro de la ventana, una entrada laboratorio en el banco, presupuestos de texto) y `labQuestion`, `labAt`, `solves`.
  - Laboratorio `capa`: con la capa a la vista los ejes son «salida 1» y «salida 2», la tabla de pesos rotula sus filas y los rótulos de palabra no pisan los nombres de eje.
  - `#/dev/contenido/<juego>/<proyecto|despegue>` (`src/ui/dev/ContenidoDev.tsx`) y `docs/handoffs/2026-11-10-laboratorios-y-ruta/contenidoshot.mjs`: cada pregunta abierta y, si es laboratorio, cerrada con «Ver una solución», para capturas.
  - `tests/e2e/smoke.spec.ts`, paso 15: resuelve `columnas.ex00.1` con el teclado.
  - Visto: `npm run check` limpio; 25 ficheros y 823 pruebas en verde (`src/games/matrices/columnas.test.ts`, `datos.test.ts`, `examen-0.test.ts`, `src/ui/labs`, `src/engine/labs`, `src/content`, `tests/content/purpose|games|big-picture`, `tests/lint`, `tests/deps`); `npm run build` en verde; el paso 15 de e2e en verde; las 18 capturas de Columnas miradas a 1100 y a 390 px.
- `abc2a05`: `docs/handoffs/2026-11-10-laboratorios-y-ruta/brief-proyecto-comun.md`, **el encargo común que recibe cada agente**, y el ayudante con la comprobación de la ventana.

En vuelo al cortar (NO comprobado por la sesión principal): **tanda 1**, cuatro `implementer` promovidos a opus, uno por proyecto: `matriz-vector`, `componer` (Órbita 0), `determinante`, `inversa` (Órbita 1). Cada uno toca solo `src/games/matrices/<proyecto>.ts`, `<proyecto>.test.ts` y `examen-N-<proyecto>.ts`, y hace su propio commit `feat(matrices): <Proyecto> con laboratorios`. Su estado al cerrar esta sesión está en la tabla del final de este fichero («Estado de la tanda 1»); si la tabla dice «sin volver», mira `git log --oneline` y `git status --short` para saber qué dejó cada uno.

Sin hacer:

- Proyectos `rango` (Órbita 1), `autovectores`, `simetricas`, `pca` (Órbita 2), `svd`, `rango-bajo`, `atencion` (Órbita 3) y el **despegue** (`despegue.3` y `despegue.5` son `manipular`; `despegue.1`, `.2`, `.4`, `.6`, `.10` son de cálculo; `.7` a `.9`, de código, no se tocan).
- Datos de la Órbita 3 en `datos.ts`: `FRASE_ANIMAL` (para `atencion`), `DIGITO_8X8` y `PESOS_4X6` (para `compresion`). Parte de las muestras de `src/ui/dev/labs/atencion.ts` y `compresion.ts`, que ya se vieron en pantalla.
- `src/games/matrices/orbita-2-planos.test.ts` afirma planos `manipular` que desaparecen: se borra cuando la Órbita 2 esté reescrita (su intención ya vive en `defineLabProjectTests`, «caben en la ventana»).
- `npm test` entero (Pyodide), `npm run e2e` entero, `README.md` (no nombra los laboratorios ni `datos.ts`), `CLAUDE.md` («Dónde vive cada cosa»: `datos.ts`, `lab-helpers.ts`, `#/dev/contenido`).
- Nadie ha arrastrado un laboratorio con ratón o dedo: solo teclado (e2e) y capturas.
- Retoques de laboratorio heredados y sin hacer (lista para Oliver, no bloquean): `atencion` (nota «mira desde aquí» cortada, rótulo de la consulta pisa un token), `descenso` (bandas a escalones, escalas, decimales), `compresion` (rótulos de fila de más de 8 caracteres), `GoalMeters` (sin separador de miles).

## TARGET FILE(S)

- `docs/handoffs/2026-11-10-laboratorios-y-ruta/brief-proyecto-comun.md`: el encargo común de cada agente (qué leer, qué entregar, cómo comprobar, capturas, commit, informe con `RISKS:`). Cada encargo concreto añade: proyecto, órbita, sus tres ficheros, su sección de `brief-juego-2.md`, su carpeta temporal y dos o tres avisos propios.
- `docs/handoffs/2026-11-10-laboratorios-y-ruta/brief-juego-2.md`: el diseño pregunta a pregunta de cada proyecto y del despegue. `guia-contenido.md`: las cinco reglas.
- `src/games/matrices/columnas.ts` (líneas 1 a ~330), `columnas.test.ts`, `examen-0-columnas.ts`: el modelo que copian los agentes.
- `src/games/matrices/datos.ts` y `datos.test.ts`: las nubes; aquí entran los datos de la Órbita 3 antes de lanzar esa tanda.
- `tests/content/lab-helpers.ts`: las reglas comunes; un defecto que encuentre un revisor se convierte aquí en comprobación.
- `src/games/matrices/<proyecto>.ts`, `<proyecto>.test.ts`, `examen-N-<proyecto>.ts` de cada proyecto pendiente; `despegue.ts` y `despegue.test.ts`.
- `src/games/matrices/orbita-2-planos.test.ts`: a retirar con la Órbita 2. `src/games/matrices/examen-3.test.ts`: afirma los tipos de las cuatro entradas de cada proyecto de la Órbita 3 (líneas 38 a 56); léelo antes de encargar esa tanda.
- `src/engine/labs/<kind>.ts` (cabecera: mandos y métricas) y `src/ui/dev/labs/<kind>.ts` (muestras válidas) de `atencion`, `compresion`, `lora`.

## GOAL

Que el juego 2 entero quede reescrito y comprobado en la rama: revisar lo que dejó la tanda 1 (commits, pruebas, un vistazo a una o dos capturas por proyecto), lanzar la tanda 2 (`rango`, `autovectores`, `simetricas`, `pca`), añadir los datos de la Órbita 3 y lanzar la tanda 3 (`svd`, `rango-bajo`, `atencion` y el despegue), retirar `orbita-2-planos.test.ts`, y cerrar con `npx vitest run src/games/matrices tests/content`, `npm test`, `npm run build` y `npm run e2e` en verde, `README.md` y `CLAUDE.md` al día, una revisión ligera (`code-reviewer` sobre `origin/main...HEAD`) y el informe para Oliver con la lista de hallazgos. El juego 3 (órbitas 1 a 3, `plan-ruta.md`) es otra sesión.

## LOAD-BEARING DETAILS

1. **Proceso ligero** (memoria `ailearn-light-process`): nada de skills de superpowers. `implementer` con su encargo, pruebas como red, una revisión ligera al final, hallazgos a una lista para Oliver.
2. **No leas ficheros grandes en la sesión principal.** Esta sesión llegó a 312k por leer el proyecto, sus pruebas y las capturas del ejemplo; ya no hace falta: el ejemplo existe. La sesión nueva lee este traspaso, `brief-proyecto-comun.md` y los informes de los agentes, y mira como mucho dos capturas por proyecto.
3. **Cada agente es un `implementer` con `model: opus`** y la descripción `[opus: contenido didáctico] <Proyecto> con laboratorios`: es diseño de preguntas, no edición mecánica. Cuatro a la vez como mucho, ninguno lanza otros agentes, y cada uno hace commit solo de sus tres ficheros con `git commit -m … -- <rutas>`.
4. **El encargo concreto de cada agente** copia la forma de los cuatro ya lanzados: «lee entero `brief-proyecto-comun.md` y síguelo»; id, órbita y los tres ficheros; la prueba de órbita que no edita (`examen-N.test.ts`); su sección de `brief-juego-2.md` con la idea en dos líneas; su carpeta `<tmp del trabajo>/<proyecto>/` y la orden de `contenidoshot.mjs`; y avisos propios. Avisos que ya se sabe que hacen falta:
   - `rango`: `merged` cuenta parejas en el **mismo punto exacto**; `probe` da `var_frac`; «det = 0» sí vale como meta `eq`.
   - `autovectores`: `probe` movible e `iterate` (1 a 8); `img_angle`, `stretch`, `iter_norm`, `iter_turn`; los autovectores tienen que caer en la rejilla de 0,5.
   - `simetricas` y `pca`: `probe` con `on: 'input'`; `NUBE_ALARGADA` (96,7 % sobre (2, 1)), `NUBE_CON_ATIPICO` (91,6 % sobre (3; 2,5); sus seis frutas están apiñadas: mirar que los rótulos no se pisen), `NUBE_CLASES_CRUZADAS` (la dirección que separa lleva el 9,8 %). `pca` conserva `pca.ex01.5`.
   - Órbita 3: `rango-bajo` conserva `rango-bajo.ex01.5` y `atencion` conserva `atencion.ex01.4`; las tres usan `atencion`, `compresion` o `lora`, cuyo contrato está en la cabecera de su modelo; `svd.ex00.4` vuelve a `capa` con `circle` y `probe`.
   - Despegue: no hay banco; `purpose` en sus dos laboratorios (lo exige `purpose.test.ts`, el despegue de matrices no está en `PENDING`); usa `RESENAS_CUATRO`.
5. **Se conservan los ids de pregunta** (`<proyecto>.ex00.1`…, `despegue.N`): el progreso guardado (local y Firestore) los nombra. Los ids del banco que cambian de tema sí cambian.
6. **Las expectativas viejas se sustituyen a propósito**, con `// contract:` que nombre la petición de Oliver del 2026-11-10. No se relajan una a una, y no se cambia una expectativa nueva para que pase: se arregla el contenido.
7. **Una palabra justo sobre la frontera no cuenta como acierto** en `capa` (ni para un grupo ni para el otro). Ya engañó una vez en el ejemplo (`columnas.ex00.5`): los agentes lo comprueban con `labAt` antes de escribir «falla una».
8. **`checkLab` manda**: `solved` en la rejilla y cumple; el estado inicial no; cada meta nombra una métrica que el laboratorio mide. `eq` con decimales necesita `tol`.
9. **El contrato de los laboratorios no se cambia sin motivo** (nombres de mandos y métricas). Si un agente pide algo que el laboratorio no mide o no dibuja, va a su informe; lo decide y lo cablea la sesión principal, no el agente.
10. **Bash sencillo**: una orden por llamada, desde la raíz del worktree, sin `cd`, tuberías ni heredocs. Para sustituir un bloque largo de un fichero sirve un guion `.mjs` en la carpeta temporal del trabajo (se hizo con `splice.mjs`: cabecera nueva más las líneas que se conservan).
11. **Vite** para las capturas: `npx vite --port 4320 --strictPort` en segundo plano desde la raíz del worktree (el de esta sesión muere con ella). Tras tocar código, la primera carga puede fallar con `ERR_NETWORK_CHANGED`: `contenidoshot.mjs` ya reintenta. `node_modules` es copia con enlaces duros: no ejecutes `npm install`.
12. **En examen, nada que diga si una entrega está bien** (`GoalMeters` con `quiet`, sin «Ver una solución»): lo afirma `src/ui/labs/labs.test.tsx`; consérvalo.
13. **`npm test` entero y `npm run e2e` entero, solo al final**; las pruebas de Pyodide tardan y necesitan red: si una falla por carga, lánzala sola antes de concluir nada.
14. **Regla de contexto**: al pasar de unos 200k, traspaso en la siguiente frontera de tarea (una tanda de agentes es una frontera).

## CONSTRAINTS

- Solo dentro del worktree. Sin `npm install`, sin `git add -A`, `git stash` ni `git reset`; commits por nombre de fichero.
- Sin push ni merge a ninguna rama y sin despliegue salvo que Oliver lo pida: un push a `main` publica en producción.
- En el juego 2 no se tocan «Programar», las hojas, el calentamiento ni las reglas del motor (3 ejercicios de 5 preguntas, examen de 6). El juego 1 queda fuera de este arco (va a la lista para Oliver: sus «Manipular» tienen el mismo problema).
- Todo texto visible en castellano, coma decimal (`{,}` en fórmulas); identificadores en inglés; toda expectativa con `// contract:`.
- Sin librerías nuevas: SVG y CSS propios, colores de los tokens del tema.

## HOW TO VERIFY

1. Arranque: `git log --oneline -8` enseña `abc2a05` y `8357eeb` sobre `e233480`, más los commits que dejara la tanda 1; `git status --short` limpio (si no, es un agente que no llegó a hacer commit: mira qué ficheros son y decide con sus pruebas). `npm run check` limpio.
2. Tanda 1: `npx vitest run src/games/matrices/matriz-vector.test.ts src/games/matrices/componer.test.ts src/games/matrices/determinante.test.ts src/games/matrices/inversa.test.ts src/games/matrices/examen-0.test.ts src/games/matrices/examen-1.test.ts` en verde; y una captura abierta y otra cerrada de cada proyecto con `contenidoshot.mjs`, miradas.
3. Tras cada tanda: lo mismo con sus proyectos, más `tests/content/purpose.test.ts tests/content/games.test.ts`.
4. De fondo, tras el juego entero: `grep -c "type: 'manipular'" src/games/matrices/*.ts` da 0 en todos los ficheros, y `defineLabProjectTests` está llamado en los 12 `<proyecto>.test.ts` (`grep -l defineLabProjectTests src/games/matrices/*.test.ts` da 12).
5. Cierre: `npx vitest run src/games/matrices tests/content`, `npm test`, `npm run build`, `npm run e2e`, todo en verde, con los números observados en el informe.
6. Revisión ligera (`code-reviewer` sobre `origin/main...HEAD`), hallazgos a la lista, sin ronda de arreglo automática.
7. Informe para Oliver: rama, commits, pruebas observadas, capturas miradas, lo que queda de la ruta (`plan-ruta.md`), la lista de hallazgos (incluidos los `RISKS:` de cada agente y los retoques de laboratorio heredados) y el recordatorio de que no se ha subido nada.

## Estado de la tanda 1

| Proyecto | Estado al cerrar la sesión | Commit | Lo que dijo su informe |
| --- | --- | --- | --- |
| `matriz-vector` | sin volver | | |
| `componer` | sin volver | | |
| `determinante` | sin volver | | |
| `inversa` | sin volver | | |
