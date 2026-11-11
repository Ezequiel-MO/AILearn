# Encargo común: reescribir «Manipular» y «Calcular» de un proyecto del juego 2

Para quien reescribe **un** proyecto de `src/games/matrices/` (o su despegue). El encargo concreto te dice cuál. Trabajas en `/home/olive/projects/AIlearn/.claude/worktrees/ia-grafica-roadmap`, en la rama que ya está puesta. Otros agentes reescriben otros proyectos a la vez en el mismo árbol: **toca solo tus ficheros**.

## Qué se arregla

Oliver, 2026-11-10: «la sección "Manipular" suele tener ejemplos mal explicados, y acabo moviendo vectores sin ningún sentido, y la parte de calcular suelen ser ejercicios irrelevantes que no me enseñan cómo funciona realmente la IA». Las preguntas viejas son «arrastra î hasta (1, 0)» sobre una rejilla vacía. Las nuevas son **laboratorios**: palabras con rasgos a la vista, una capa cuyas columnas se arrastran y la consecuencia medida en vivo (los aciertos de la neurona que viene detrás, las palabras que dejan de distinguirse). Explicar más no lo arregla; lo arregla cambiar lo que se hace y lo que se ve.

## Lee esto, en este orden

1. `docs/handoffs/2026-11-10-laboratorios-y-ruta/guia-contenido.md`: las cinco reglas. Son el encargo.
2. La sección de tu proyecto en `docs/handoffs/2026-11-10-laboratorios-y-ruta/brief-juego-2.md` (y «La historia del juego», arriba). Es la guía de cada pregunta; los números los ajustas tú.
3. **El ejemplo resuelto**, el proyecto Columnas (commit `8357eeb`). Copia su forma y su tono:
   - `src/games/matrices/columnas.ts`, de la línea 1 al final del ejercicio `calcular` (unas 330 líneas). No leas «Programar» ni las hojas.
   - `src/games/matrices/columnas.test.ts` entero y `src/games/matrices/examen-0-columnas.ts` (las dos primeras entradas).
   - `src/games/matrices/datos.ts`: las nubes de palabras y `capaLab`. `tests/content/lab-helpers.ts`: `defineLabProjectTests`, `labQuestion`, `labAt`, `solves`.
4. El contrato del laboratorio: la cabecera de `src/engine/labs/capa.ts` (mandos, métricas y los campos de `CapaSpec`). Si tu proyecto usa otro laboratorio (`atencion`, `compresion`, `lora`), la cabecera de `src/engine/labs/<kind>.ts` y sus muestras en `src/ui/dev/labs/<kind>.ts`.
5. De tu proyecto, solo los ejercicios 0 y 1 de `src/games/matrices/<proyecto>.ts` (búscalos con `grep -n "kind: '"`), su `<proyecto>.test.ts` y su `examen-N-<proyecto>.ts`.

## Qué entregas

- `src/games/matrices/<proyecto>.ts`: los ejercicios `manipular` y `calcular` reescritos. Cinco preguntas cada uno, **con los mismos ids** (`<proyecto>.ex00.1`… `<proyecto>.ex01.5`): el progreso guardado los nombra. `sub` y el comentario de cabecera, al día si ya no describen el proyecto. **No toques** «Programar», las hojas, el calentamiento ni `bigPicture` (salvo una frase que nombre una pregunta que desaparece: busca «primera pregunta», «ejercicio anterior»).
- `src/games/matrices/examen-N-<proyecto>.ts`: siguen siendo **tres entradas fijas**. Una pasa a ser `laboratorio` (otra escena o otros datos que los del proyecto: mide transferencia) y otra, una cuenta del estilo nuevo; la de `codigo`, si la hay, se queda como está. Ids nuevos `examen-N.<tema>` para lo que cambia de tema.
- `src/games/matrices/<proyecto>.test.ts`: las pruebas de lo que no tocas (ejercicio 2, hojas, mensajes de código) se quedan; las que afirman el contenido viejo de ex00, ex01 y el banco se **sustituyen** (cambio de contrato pedido por Oliver el 2026-11-10: dilo en el `// contract:`), con la forma de `columnas.test.ts`.

No toques nada más. En particular: ni `datos.ts`, ni `tests/content/lab-helpers.ts`, ni `src/engine`, ni `src/ui`, ni `examen-N.ts`, ni las pruebas de órbita (`examen-N.test.ts`, `orbita-2-planos.test.ts`), ni `columnas.*`. Si necesitas una nube que no está en `datos.ts`, defínela como constante en tu fichero de proyecto con el tipo `Cloud` (coordenadas en múltiplos de 0,5, dentro de ±3, rótulos de 8 caracteres como mucho) y dilo en el informe. Si el laboratorio no mide o no dibuja algo que necesitas, no lo cambies: rediseña la pregunta con lo que hay y apúntalo en el informe.

## Cómo es una buena pregunta

- **«Manipular»** (`laboratorio`): el enunciado dice qué pasa en el sistema y qué conseguir, sin coordenadas ni valores de los mandos. La meta es una consecuencia (`acc`, `merged`, `hits`, `target_err`, `var_frac`…), nunca los números de la matriz (`m11`…`m22` están prohibidos en `goals`). Tiene que haber varias soluciones, o una segunda meta que sea otra consecuencia. Las cinco forman una historia con la misma escena y **una cosa nueva cada vez**; ninguna repite la mecánica de otra con otros números, y al menos una enseña un límite (lo máximo que se puede conseguir).
- Lo que el jugador ve en un laboratorio `capa`: cada palabra en su sitio de salida, con un círculo hueco y una línea de puntos desde donde estaba; las columnas î y ĵ con su tirador; la tabla «Pesos de la capa A» con una columna por rasgo («î: adónde va «intensidad»») y una fila por salida; los ejes del dibujo son «salida 1» y «salida 2»; con `readout`, la frontera y la zona sombreada del grupo 1; con `targets`, dianas; con `before`, cuadraditos en el paso intermedio; con `probe`, la recta de v y las proyecciones. Sin capa que mover ni capa fija distinta de la identidad, el dibujo es solo la nube, con los ejes de `axes`.
- **Una palabra justo sobre la frontera no cuenta como acierto**, sea del grupo que sea. Compruébalo antes de escribir «falla una».
- `solved` nombra solo los mandos que se mueven; los demás quedan como empiezan. Tiene que caer en la rejilla (`snap`), cumplir las metas, y el estado inicial no. Las palabras y las dianas tienen que caber en la ventana (`range`) al empezar y resuelto: sube `range` si hace falta.
- `label` de una meta: qué se mide, sin números («Aciertos de la neurona siguiente»). `format: 'percent'` para fracciones, `'integer'` para recuentos. `eq` solo si el concepto es un valor exacto, y con `tol` si el valor tiene decimales.
- **«Calcular»**: cada pregunta es una cuenta que un sistema de IA hace o que un ingeniero decide, con números reales cuando existan (768, 3072, 384, 12 bloques…). Al menos tres de las cinco llevan `lab` para explorar; si la respuesta es una métrica del laboratorio, no la pongas en `readouts`. Si es de predecir, deja los mandos libres para que lo compruebe después. Nada de procedimientos de biblioteca a mano (polinomio característico, fórmula de la inversa).
- Toda pregunta de los dos ejercicios lleva `purpose` (`why`: dónde pasa esto en un sistema real; `aim`: qué vas a hacer, sin la respuesta; `takeaway`: la conclusión). Distintos entre sí, sin datos inventados sobre modelos reales: si citas una cifra de un modelo, que sea cierta.
- Presupuestos (los comprueba `defineLabProjectTests`): `prompt` 420 caracteres; exactamente 2 pistas de 220 como mucho (la primera, qué mirar en el dibujo; la segunda, qué mover y hacia dónde); `explain` 380; `solution` 480; `why` 60 a 300, `aim` 60 a 200, `takeaway` 60 a 260.
- Prosa: castellano, comillas «», decimales con coma (`$1{,}5$` en fórmula, 1,5 en prosa), un par con decimales separado por «; » (`$(1{,}5;\ 0)$`), nada de «que ya conoces» ni «como ya viste» (los proyectos de una órbita se abren a la vez). Frases cortas. La solución puede nombrar coordenadas; el enunciado, no.

## Cómo trabajar

- **Diseña con el modelo, no de cabeza.** Antes de escribir la prosa de una pregunta, comprueba sus números: escribe primero las pruebas con `labAt` y `solves` (o un guion `.mjs` propio en tu carpeta temporal) y ajusta el laboratorio hasta que el estado inicial, la solución y la colocación «tentadora pero mala» den lo que vas a contar.
- Tu `<proyecto>.test.ts` lleva: `defineProseTests` (proyecto y banco), `defineLabProjectTests(<proyecto>, <banco>)`, `checkProject` vacío, y por cada laboratorio una prueba con lo que afirma su enunciado al empezar, que `solved` y al menos otra solución cumplen, y que una colocación tentadora no (con `// contract:` que diga de qué frase sale). En «Calcular», las respuestas recalculadas. Toda expectativa lleva `// contract:`. Nada de tablas que copian el contenido.
- Órdenes de Bash **sencillas**: una por llamada, desde la raíz del worktree, sin `cd`, sin tuberías, sin heredocs ni `&&`. Ficheros con Write y Edit. Guiones y capturas, en tu carpeta `/home/olive/.claude/jobs/963d647c/tmp/<proyecto>/`, nunca en el repositorio.
- No ejecutes `npm install`, ni `git add -A`, `git stash` o `git reset`, ni lances otros agentes. No arranques ni pares Vite: ya hay uno en `http://localhost:4320`.
- Comprueba con: `npx vitest run src/games/matrices/<proyecto>.test.ts`; después `npx vitest run src/games/matrices/examen-N.test.ts tests/content/purpose.test.ts tests/content/games.test.ts`; `npx eslint <tus ficheros>`; `npx tsc --noEmit`; `npx prettier --write <tus ficheros>`. Si `tsc` o una prueba de órbita falla por un fichero que no es tuyo (otro agente a medio escribir), no lo arregles: dilo en el informe. `orbita-2-planos.test.ts` va a fallar en la Órbita 2: se retira al final, no la toques.
- **Mira lo que has escrito.** Capturas a los dos anchos:
  - `node --input-type=module - /home/olive/.claude/jobs/963d647c/tmp/<proyecto> matrices <proyecto> < docs/handoffs/2026-11-10-laboratorios-y-ruta/contenidoshot.mjs`
  - lo mismo con `W=390` delante.
  Lee con Read las diez imágenes de «Manipular» a 1100 px (abierta y `--cerrada`, que enseña la solución) y al menos tres a 390 px (acaban en `-m`). Comprueba: las palabras se leen y no se apilan, nada importante cae fuera de la ventana, la meta se entiende sin leer el `purpose`, y lo que cambia al mover se ve. Corrige y repite hasta que sea así.
- Unas 60 llamadas a herramientas. Si a las 60 no has acabado, termina la pregunta que tengas a medias, deja las pruebas en verde o di cuáles están en rojo, y entrega el informe con lo que falta.
- Al acabar, un commit solo con tus ficheros: `git commit -m "feat(matrices): <Proyecto> con laboratorios" -m "<la línea Co-Authored-By que te dé tu sistema>" -- <ruta1> <ruta2> <ruta3>`. Si git dice que el índice está bloqueado, repite la orden.

## El informe

Corto y con hechos: qué preguntas han quedado (una línea por pregunta: escena → meta → qué se descubre); qué órdenes ejecutaste y qué viste (número de pruebas en verde); qué capturas miraste y qué enseñaban; en qué te apartaste de `brief-juego-2.md` y por qué; lo que el laboratorio no te dejó hacer; el hash del commit. Y al final una lista `RISKS:` con lo que podría estar mal o romperse (una cifra de un modelo real de la que no estás seguro, una pregunta con una sola solución, un rótulo que se pisa).
