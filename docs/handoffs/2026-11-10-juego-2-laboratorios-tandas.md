# Terminar de reescribir «Manipular» y «Calcular» del juego 2 de AIlearn con laboratorios: mirar lo que dejó la tanda 1 (5 de 12 proyectos hechos), lanzar las tandas que faltan (7 proyectos y el despegue) y cerrar el juego con sus pruebas, en el worktree `ia-grafica-roadmap`

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

**Tanda 1, hecha**: cuatro `implementer` promovidos a opus, uno por proyecto, cada uno con su commit: `componer` (`9811e2e`), `inversa` (`cbbc999`), `determinante` (`abfe493`), `matriz-vector` (`faa93cb`). Cada uno tocó solo `src/games/matrices/<proyecto>.ts`, `<proyecto>.test.ts` y `examen-N-<proyecto>.ts`. Comprobado por la sesión principal el 2026-11-11, con los cuatro commits dentro: árbol limpio, `npm run check` limpio y 11 ficheros con 524 pruebas en verde (`matriz-vector`, `componer`, `determinante`, `inversa`, `columnas`, `datos`, `examen-0`, `examen-1`, `purpose`, `games`, `big-picture`). **No comprobado por la sesión principal**: sus capturas (cada agente dice haber mirado las diez de «Manipular» a 1100 px y tres a 390 px; `matriz-vector` no volvió a mirar tras su último arreglo de `ex01.4`), sus `*.python.test.ts` (no cambian, pero importan el proyecto) y la calidad de la prosa, que nadie más que el agente ha leído. Lo que dijo cada informe, con sus desvíos y sus `RISKS:`, está en la tabla del final («Estado de la tanda 1»).

Decisiones que la tanda 1 deja a la sesión principal (ninguna bloquea las tandas siguientes; las tres primeras conviene resolverlas antes de lanzar la Órbita 2, porque cambian lo que ven los agentes):

1. **Tabla de pesos con una capa delante.** `CapaLab` rotula cada columna con el rasgo de entrada («î: adónde va «intensidad»») aunque haya `before` y a la capa del jugador le llegue una mezcla. `componer` lo esquivó con nubes de `axes` cambiado (ayudante `llegan(...)` en `componer.ts`); `inversa` no hizo nada. Lo limpio es que el laboratorio lo sepa: con `before`, rotular las columnas «adónde va la entrada 1/2» (o un campo `inputs` en `CapaSpec`), y quitar el apaño de `componer`.
2. **La prueba común de ventana no mira los cuadraditos del paso intermedio** (`before`): `inversa` añadió una propia. Llévala a `defineLabProjectTests` (`capaScene(...).middle`).
3. **Con `readout`, la nota del panel usa los nombres de los grupos** («responde «mascota» a lo sombreado»): en un laboratorio para explorar con una neurona cualquiera engaña (`matriz-vector.ex01.4` quitó el `readout` por eso).
4. Las dianas no llevan rótulo en el dibujo (en `matriz-vector.ex00.4`, «cat», «dog» y «house» solo se nombran en el texto). El laboratorio no tiene ReLU (`componer.ex01.5` va sin laboratorio) ni ruido sobre el paso intermedio (`inversa.ex00.5`). Ninguna métrica excluye la capa que lo manda todo al origen (`determinante.ex00.2` la da por buena). Para la lista de Oliver o para un retoque del laboratorio.
5. **Preguntas con una sola solución** (contra la regla 3 de la guía): `matriz-vector.ex00.1`, `.2` y `.4`; `componer.ex00.2` y `.5`; `inversa.ex00.1`, `.2`, `.3` y `.5`. En casi todas es la lección (dos ejemplos fijan la matriz; la inversa es una); `matriz-vector.ex00.1` es la más floja («mueve una columna hasta la diana»). Y `determinante` no tiene ninguna pregunta que enseñe un límite (regla 4).
6. Cifras de sistemas reales sin contrastar: «124 millones» de parámetros del GPT-2 pequeño (también en `columnas.ex01.2`), la traducción con una matriz de Mikolov y otros en 2013 y los «300 números» de word2vec (`matriz-vector`), `solve` frente a `inv` e `inverse_transform` de scikit-learn (`inversa`). Un `code-reviewer` o una búsqueda las cierra.
7. En el banco de la Órbita 0 hay dos laboratorios con `ANIMALES` (`examen-0.capa-mascotas` y `examen-0.dianas-animales`): pueden caer en el mismo examen.
8. Los agentes gastaron de 69 a 95 llamadas, por encima de las 60 del encargo, y firmaron sus commits como «Claude Opus 5.5» (es el modelo que los hizo; el encargo común pedía otra línea: corrígelo para que diga «la atribución que te dé tu sistema»).

Sin hacer:

- Las decisiones 1 a 8 de arriba.
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

Que el juego 2 entero quede reescrito y comprobado en la rama: mirar una o dos capturas por proyecto de la tanda 1, resolver las decisiones 1 a 3 de CONTEXT (rótulos de la tabla con `before`, ventana con cuadraditos, nota de la neurona), lanzar la tanda 2 (`rango`, `autovectores`, `simetricas`, `pca`), añadir los datos de la Órbita 3 y lanzar la tanda 3 (`svd`, `rango-bajo`, `atencion` y el despegue), retirar `orbita-2-planos.test.ts`, y cerrar con `npx vitest run src/games/matrices tests/content`, `npm test`, `npm run build` y `npm run e2e` en verde, `README.md` y `CLAUDE.md` al día, una revisión ligera (`code-reviewer` sobre `origin/main...HEAD`) y el informe para Oliver con la lista de hallazgos. El juego 3 (órbitas 1 a 3, `plan-ruta.md`) es otra sesión.

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

1. Arranque: `git log --oneline -9` enseña, de arriba abajo, el commit de este traspaso, `faa93cb`, `abfe493`, `cbbc999`, `9811e2e`, `1fa0a8a`, `abc2a05` y `8357eeb` sobre `e233480`; `git status --short` limpio; `npm run check` limpio.
2. Tanda 1: `npx vitest run src/games/matrices/matriz-vector.test.ts src/games/matrices/componer.test.ts src/games/matrices/determinante.test.ts src/games/matrices/inversa.test.ts src/games/matrices/columnas.test.ts src/games/matrices/datos.test.ts src/games/matrices/examen-0.test.ts src/games/matrices/examen-1.test.ts tests/content/purpose.test.ts tests/content/games.test.ts tests/content/big-picture.test.ts` da 11 ficheros y 524 pruebas en verde (así quedó el 2026-11-11); y una captura abierta y otra cerrada de cada proyecto con `contenidoshot.mjs`, miradas (arranca antes Vite: detalle 11).
3. Tras cada tanda: lo mismo con sus proyectos, más `tests/content/purpose.test.ts tests/content/games.test.ts`.
4. De fondo, tras el juego entero: `grep -c "type: 'manipular'" src/games/matrices/*.ts` da 0 en todos los ficheros, y `defineLabProjectTests` está llamado en los 12 `<proyecto>.test.ts` (`grep -l defineLabProjectTests src/games/matrices/*.test.ts` da 12).
5. Cierre: `npx vitest run src/games/matrices tests/content`, `npm test`, `npm run build`, `npm run e2e`, todo en verde, con los números observados en el informe.
6. Revisión ligera (`code-reviewer` sobre `origin/main...HEAD`), hallazgos a la lista, sin ronda de arreglo automática.
7. Informe para Oliver: rama, commits, pruebas observadas, capturas miradas, lo que queda de la ruta (`plan-ruta.md`), la lista de hallazgos (incluidos los `RISKS:` de cada agente y los retoques de laboratorio heredados) y el recordatorio de que no se ha subido nada.

## Estado de la tanda 1

| Proyecto | Estado al cerrar la sesión | Commit | Lo que dijo su informe |
| --- | --- | --- | --- |
| `matriz-vector` | hecho; pruebas en verde vistas por la sesión principal, capturas no | `faa93cb` | 61 pruebas propias. `capa` con dianas: una palabra y su receta, dos ejemplos fijan la capa, diana más neurona, nube propia `IDIOMAS` (gato, perro, casa → «cat», «dog», «house»), y `margin` con diana como pregunta de límite. Banco: `examen-0.dianas-animales` y `examen-0.logits-correo`. Se apartó en: `ex00.5` añade una diana para tener un límite; `ex01.5` nueva (pares para fijar una matriz de traducción de 300×300); `ex01.4` con laboratorio libre y sin `readout`; `sub` «Lo que le pasa a una palabra». RISKS: tres preguntas de solución única; la diana de «bueno» en `ex00.2` toca el rótulo de «feliz»; `ex00.3` y `ex00.5` comparten escena; las búsquedas de unicidad recorren ±3 y no ±5; `ex01.4` no se ha visto en pantalla tras el último arreglo |
| `componer` | hecho; pruebas en verde vistas por la sesión principal, capturas no | `9811e2e` | 68 pruebas propias y 189 con órbita, `purpose` y `games` en verde; 18 capturas por ancho. Banco: `examen-0.capa-tras-mezcla` y `examen-0.capa-equivalente`. Se apartó del diseño en: `ex00.5` con primera capa fija y dianas del otro orden; `ex01.5` nueva, con ReLU y sin laboratorio; `sub` «Dos capas seguidas»; nubes con `axes` cambiado (ayudante `llegan(...)`) porque la tabla de pesos nombra las columnas con los rasgos de entrada aunque haya una capa delante. RISKS: `ex00.2` y `ex00.5` tienen una sola solución; en `ex00.3` los rótulos de palabras fundidas se tapan; cifra «124 millones» del GPT-2 sin comprobar; firmó el commit como Opus 5.5 |
| `determinante` | hecho; pruebas en verde vistas por la sesión principal, capturas no | `abfe493` | 68 pruebas propias. Cinco laboratorios sobre `RESENAS` con la neurona mirando la **segunda** salida: estirar separa, aplastar funde parejas, aplastar lo que no importa, el signo no pierde nada, casi plano deja las palabras casi encima (`pair` genial/feliz). Banco: `examen-1.aplastar-animales` y `examen-1.densidad-flujo`. Se apartó en: `ex00.5` usa `RESENAS` y no `ANIMALES`; `ex01.4` con tres capas; `sub` «Cuánto espacio deja la capa». RISKS: ninguna pregunta obliga a un límite; en `ex00.2` mandar todo al origen cumple las metas; la meta `merged` de `ex00.5` es redundante con `det`; `examen-1.densidad-flujo` responde 0,1 con `tol` 0; sus últimos cambios (`range` 6 en `ex00.1`, sin lectura en `ex00.5`) no se vieron a 1100 px |
| `inversa` | hecho; pruebas en verde vistas por la sesión principal, capturas no | `cbbc999` | 72 pruebas propias y 194 con órbita, `purpose` y `games` en verde; `inversa.python.test.ts` sin lanzar. Autoencoder sobre `RESENAS` (`before` + dianas). Banco: `examen-1.decodificar-correos` y `examen-1.recuperar-correo`. Se apartó del diseño en: `ex00.4` borra la intensidad y no el tono (con el tono, los rótulos se apilaban); `ex01.3` pide el determinante de la capa que deshace; `ex01.4` nueva (deshacer una estandarización); `sub` «Deshacer una capa». Pide al laboratorio: ruido sobre el código para ver cómo se amplifica el error; que la prueba común de ventana mire también los cuadraditos intermedios (añadió una propia). RISKS: en `ex00.5` el codificador de determinante 0,25 no se ve «casi aplastado»; `ex01.2` casi se responde mirando el dibujo; afirmaciones sobre `solve` frente a `inv` y `inverse_transform` de scikit-learn sin contrastar; solapes leves de rótulos en `ex00.1` y `ex00.3`; firmó el commit como Opus 5.5 |
