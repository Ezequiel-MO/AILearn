# Cerrar el juego 2 de AIlearn reescrito con laboratorios: pasar `npm test`, `build` y `e2e` enteros, mirar las capturas que faltan, una revisión ligera y el informe para Oliver con la lista de hallazgos, en el worktree `ia-grafica-roadmap`

## CONTEXT

Oliver pidió el 2026-11-10 rehacer «Manipular» y «Calcular» del juego 2 «Matrices y transformaciones» con preguntas `laboratorio` (datos de IA a la vista, metas que son consecuencias). El arco está **escrito entero y con commit**: los 12 proyectos y el despegue. Falta solo cerrarlo. Los traspasos anteriores (`docs/handoffs/2026-11-10-juego-2-laboratorios-tandas.md` y `2026-11-10-laboratorios-y-ruta.md`) son el fondo; léelos solo si te falta contexto.

Se trabaja en `/home/olive/projects/AIlearn/.claude/worktrees/ia-grafica-roadmap`, rama `worktree-ia-grafica-roadmap`, desde `origin/main` 64ae89f. **Nada se ha subido ni fusionado.** Esta sesión se cortó por la regla de contexto (el guardián avisó a 245k tokens), no por un bloqueo.

Hecho y comprobado por la sesión principal el 2026-11-11, con todos los commits dentro: árbol limpio; `npm run check` limpio; `npx vitest run src/games/matrices tests/content/purpose.test.ts tests/content/games.test.ts tests/content/big-picture.test.ts src/ui/labs src/engine/labs src/content` da **51 ficheros y 2982 pruebas en verde** (incluye las `*.python.test.ts` del juego 2, que cargaron Pyodide); `grep -c "type: 'manipular'"` da 0 en los 13 ficheros de contenido y los 12 de banco; `defineLabProjectTests` está llamado en los 12 `<proyecto>.test.ts`.

Commits de esta sesión, de abajo arriba:

- `771eae5`: decisiones 1 a 3 de la tanda 1. `CapaSpec` gana `inputs` (nombre de lo que le llega a A; con `before` y sin `inputs`, las columnas se llaman «entrada 1» y «entrada 2») y `readout.says` (lo que dice la nota del panel si la neurona no es el detector del grupo 1); `defineLabProjectTests` comprueba que los cuadraditos del paso intermedio caben en la ventana; `componer` deja el apaño `llegan(...)` y usa `inputs`. Pruebas en `src/ui/labs/labs.test.tsx` («rótulos del laboratorio capa»).
- `4b4d5bc`: datos de la Órbita 3 en `src/games/matrices/datos.ts` (`FRASE_ANIMAL`, `FRASE_ANIMAL_MIRA`, `CARA_8X8`, `PESOS_4X6`, `PESOS_4X6_ROTULOS`), afirmados en `datos.test.ts`.
- `fa642c7`: `README.md` y `CLAUDE.md` nombran los laboratorios, `datos.ts`, `lab-helpers.ts` y `#/dev/contenido`.
- `c02f64f`: `examen-3.test.ts` exige por proyecto un `laboratorio`, una cuenta (`numero`, `vector` u `opcion`), un `codigo` y la generada.
- `67dc64c`: `showValue` separa los miles de un entero de cinco cifras o más con espacio fino (`src/ui/labs/show.ts`, `show.test.ts`).
- `e59db2e` (`pca`), `cdce202` (`autovectores`), `285d48b` (`rango`), `6395bff` (`simetricas`): tanda 2.
- `8793301`: en `capa`, una capa fija identidad ya no pinta la tabla «Pesos de la capa A» ni el cuadrado unidad (la tabla llevaba `hidden`, pero `display: grid` lo anulaba). Con prueba.
- `2274b99`: retirado `src/games/matrices/orbita-2-planos.test.ts`.
- `4efc9c0` (despegue), `80fae87` (`atencion`), `86dde01` (`svd`), `0aa3bb3` (`rango-bajo`): tanda 3.

**No comprobado por la sesión principal:**

- `npm test` entero, `npm run build` y `npm run e2e` (el paso 15 resuelve `columnas.ex00.1`; el despegue de matrices no se juega en la prueba de humo).
- Capturas de la tanda 3: ninguna vista por la sesión principal (cada agente miró las suyas; `rango-bajo` no miró ninguna de «Calcular» ni `ex00.4` cerrada; `svd` no miró a 390 px `ex00.1`, `.3`, `.5` ni el banco).
- Capturas de la tanda 2 vistas por la sesión principal: `pca.ex00.3` y `.4`, `autovectores.ex00.2`, `rango.ex00.3`, `simetricas.ex00.3`. De la tanda 1: cinco, una o dos por proyecto.
- Las capturas de los agentes de la tanda 2 son anteriores a `8793301`: lo que enseñan de más (la tabla identidad) ya no sale.
- La prosa de los proyectos: solo la ha leído el agente que la escribió.
- Nadie ha arrastrado un laboratorio con ratón o dedo: solo teclado (e2e) y capturas.

## TARGET FILE(S)

- `src/games/matrices/<proyecto>.ts`, `<proyecto>.test.ts`, `examen-N-<proyecto>.ts` (12 proyectos) y `despegue.ts`, `despegue.test.ts`: el contenido reescrito. No se leen enteros: se mira su resultado en pantalla.
- `src/games/matrices/datos.ts`, `datos.test.ts`: nubes y datos de los laboratorios.
- `tests/content/lab-helpers.ts`: `defineLabProjectTests`, `labQuestion`, `labAt`, `solves`. Un defecto que encuentre la revisión se convierte aquí (o en la prueba del proyecto) en comprobación.
- `src/ui/labs/CapaLab.tsx`, `capa.strings.ts`, `show.ts`, `labs.test.tsx`; `src/engine/labs/capa.ts`; `src/content/labs.ts`: lo tocado del laboratorio `capa` en esta sesión.
- `docs/handoffs/2026-11-10-laboratorios-y-ruta/contenidoshot.mjs`: capturas de un proyecto (`node --input-type=module - <carpeta> matrices <proyecto|despegue> [filtro] < …/contenidoshot.mjs`; `W=390` delante para móvil). `plan-ruta.md`, en la misma carpeta: lo que queda de la ruta (juego 3, órbitas 1 a 3).
- `tests/e2e/smoke.spec.ts`: la prueba de humo; no se relaja.

## GOAL

Dejar el arco cerrado y contado: `npm test`, `npm run build` y `npm run e2e` en verde con los números observados; una captura abierta y otra cerrada de cada proyecto de la tanda 3 y del despegue miradas (y arreglado lo que sea un defecto claro y barato, con su prueba); una revisión ligera con `code-reviewer` sobre `origin/main...HEAD` cuyos hallazgos van a la lista, sin ronda de arreglo automática; y el informe para Oliver: rama, commits, pruebas, capturas, la lista de hallazgos de abajo puesta al día y el recordatorio de que no se ha subido nada. Push o merge, solo si Oliver lo pide. El juego 3 es otra sesión.

## LOAD-BEARING DETAILS

1. **Proceso ligero** (memoria `ailearn-light-process`): nada de skills de superpowers. Pruebas como red, una revisión ligera al final, hallazgos a una lista para Oliver, sin rondas de arreglo automáticas.
2. **No leas ficheros grandes en la sesión principal.** Cada proyecto tiene 700 a 900 líneas. Para una duda de contenido, `grep` o un agente; para ver cómo queda, capturas (como mucho dos por proyecto).
3. **Vite para las capturas**: `npx vite --port 4320 --strictPort` en segundo plano desde la raíz del worktree (el de esta sesión muere con ella). `contenidoshot.mjs` ya reintenta la primera carga.
4. **`npm test` carga Pyodide** (lento, necesita red la primera vez). Si una prueba falla por carga o plazo, lánzala sola antes de concluir nada. Se lanza desde la raíz del repositorio. En esta sesión la red se cayó una vez a media tarea (`EAI_AGAIN`): si pasa, espera y repite.
5. **Las expectativas no se cambian para que pasen**: se arregla el contenido o el código. Toda expectativa lleva `// contract:`.
6. **Se conservan los ids de pregunta**; el progreso guardado los nombra. Las tandas a medias guardan ids y eventos (acierto, siguiente, pista), no respuestas (`SavedRun` en `src/engine/session.ts`): que una pregunta haya cambiado de tipo con el mismo id no rompe la carga. Varios agentes lo dieron como riesgo; está mirado.
7. **En examen, nada que diga si una entrega está bien** (`GoalMeters` con `quiet`, sin «Ver una solución»): lo afirma `src/ui/labs/labs.test.tsx`; consérvalo.
8. **El contrato de los laboratorios no se cambia sin motivo** (nombres de mandos y métricas). Los retoques de dibujo de la lista de abajo son para que los decida Oliver, salvo defecto claro y barato.
9. **Bash sencillo**: una orden por llamada, desde la raíz del worktree, sin `cd`, tuberías ni heredocs. Commits por nombre de fichero (`git commit -m … -- <rutas>`).
10. **Regla de contexto**: al pasar de unos 200k, traspaso en la siguiente frontera de tarea.

## CONSTRAINTS

- Solo dentro del worktree. Sin `npm install`, sin `git add -A`, `git stash` ni `git reset`.
- Sin push ni merge a ninguna rama y sin despliegue salvo que Oliver lo pida: un push a `main` publica en producción.
- No se tocan «Programar», las hojas, el calentamiento ni las reglas del motor. El juego 1 queda fuera (va a la lista: sus «Manipular» tienen el mismo problema).
- Todo texto visible en castellano, coma decimal; identificadores en inglés.
- Sin librerías nuevas.

## HOW TO VERIFY

1. Arranque: `git log --oneline -5` enseña el commit de este traspaso sobre `0aa3bb3`, `86dde01`, `80fae87` y `4efc9c0`; `git status --short` limpio; `npm run check` limpio.
2. `npm test`: todo en verde, con el número de ficheros y pruebas en el informe.
3. `npm run build` y después `npm run e2e`: en verde.
4. Capturas: una abierta y una cerrada de `svd`, `rango-bajo`, `atencion` y `despegue`, miradas a 1100 px, y una de cada a 390 px. De `rango-bajo`, alguna de «Calcular» (`ex01.3` o `ex01.4`: laboratorio con `size` y sin neurona, nunca visto).
5. `code-reviewer` sobre `origin/main...HEAD`: en su encargo, que contraste las cifras de modelos reales de la lista (punto C) y que no proponga rondas de arreglo. Hallazgos a la lista.
6. Informe para Oliver con la lista de hallazgos al día y lo que queda de la ruta (`plan-ruta.md`).

## Lista de hallazgos para Oliver (se entrega en el informe; lo que ya está resuelto no aparece)

**A. Del laboratorio (dibujo e interfaz), sin arreglar**

- `capa`: las dianas no llevan rótulo; no hay ReLU ni ruido sobre el paso intermedio; ninguna métrica excluye la capa que lo manda todo al origen (cada proyecto lo afirma en su prueba donde importa); los rótulos de palabras fundidas en un punto se apilan (`componer.ex00.3`, `despegue.5` con otra solución); con `probe` sobre la entrada y una capa a la vista, el dibujo mezcla proyecciones de entrada con puntos de salida (`simetricas.ex00.3`, muy cargada); con `probe` siempre se pintan las proyecciones aunque la escena no las use (`autovectores`); la leyenda de grupos sale aunque no haya neurona; los medidores de meta no tienen formato de grados («26,57» sin «°»); no hay métrica «parte de la varianza de la entrada que conserva A».
- `atencion`: la nota «mira desde aquí» sale cortada; no dibuja los valores ni el punto de salida (`atencion.ex00.5` los escribe en el enunciado); los medidores redondean a porcentaje entero («100 %» con 99,6 %); el mapa deja en blanco las casillas de peso casi 0 aun sin máscara; a 390 px la tira de tokens es muy pequeña.
- `compresion`: siempre enseña la lista de σ y los números guardados (una cuenta sobre esa misma tabla deja ver la respuesta: `svd.ex01.3`); los rótulos de columna de `PESOS_4X6_ROTULOS` se pisan a 1100 px (`svd` usa solo los de fila); mide el error frente a su propia tabla, no frente a una señal limpia.
- `lora`: los ejes llevan el nombre de los rasgos de entrada aunque se pintan salidas W·x; los deslizadores «B, arriba (b₁)» y «B, abajo (b₂)» nombran la casilla, no la dirección.
- `descenso` (heredado): bandas a escalones, escalas, decimales.
- `inversa` enseña «entrada 1» y «entrada 2» en la tabla: con `inputs: ['código 1', 'código 2']` quedaría mejor.
- `matriz-vector.ex01.4` quitó su `readout` porque la nota engañaba: con `readout.says` ya podría volver.

**B. De contenido**

- Preguntas con una sola solución (regla 3), casi todas porque la unicidad es la lección: `matriz-vector.ex00.1` (la más floja), `.2` y `.4`; `componer.ex00.2` y `.5`; `inversa.ex00.1`, `.2`, `.3` y `.5`; `pca.ex00.2` (una sola dirección; es su límite); `autovectores.ex00.2` (límite); `simetricas.ex00.3` (límite); `svd.ex00.2` (`k` = 2); `despegue.5` (ĵ siempre en el origen); `atencion.ex00.2` (tres temperaturas).
- `determinante` no tiene ninguna pregunta de límite (regla 4).
- Parecidos entre proyectos: `rango.ex00.4` y PCA (`probe` sobre `NUBE_ALARGADA`); `examen-2.decorrelar-nube` (simétricas) y `pca.ex00.5`; `rango-bajo.ex00.4` y la muestra `contador` de `#/dev/labs`; `rango-bajo.ex00.1` y `.5` y `examen-3.lora-mascotas` comparten escena; en el banco de la Órbita 0 hay dos laboratorios con `ANIMALES` que pueden caer en el mismo examen.
- Metas que dependen de un 0 exacto en coma flotante, sin tolerancia: `svd.ex00.2` (`error` ≤ 0) y `rango-bajo.ex00.2` (`target_err` ≤ 0). Pasan hoy.
- Rótulos apretados: `rango.ex00.3` («triste», «malo», «horrible» junto a la frontera; la columna î se llama «nada»); `pca.ex00.4` (frutas apiñadas, obligado por el dato atípico); `simetricas.ex00.4` (el tirador de î tapa «cuento» al empezar); `rango-bajo.ex00.2` y `.3`; `matriz-vector.ex00.2`; `inversa.ex00.1` y `.3`.
- Tolerancias que pueden rechazar una respuesta razonable: `svd.ex01.2` (90,9 con 0,1: rechaza 0,909); `examen-1.densidad-flujo` (0,1 con tolerancia 0); `pca.ex01.1` (96,7 con 0,1).
- `simetricas.ex01.1` divide entre n (como el laboratorio) y «Programar» usa n − 1 (`np.cov`): la solución lo dice.
- `pca.ex01.3` trata la componente de las frutas como la horizontal por el origen (su media en y es 0,083).
- `svd`: su `bigPicture` dice «aquí lo ves con transformaciones de dos dimensiones», que ya solo encaja con `ex00.4`.
- `pca.ex01.5` se recortó cinco caracteres para caber en el presupuesto; `atencion.ex01.4` y `rango-bajo.ex01.5` se conservan intactas.
- En prosa, «95 %» con espacio normal parte a 390 px (`rango`).
- El juego 1 tiene el mismo problema en sus «Manipular» y no se ha tocado.

**C. Cifras de sistemas reales sin contrastar con una fuente** (todas plausibles; que las cierre la revisión)

- GPT-2 pequeño: 124 millones de parámetros, capa de 3072×768, 12 cabezas de 64 números, 768 dimensiones (`columnas`, `svd`, `atencion`, `simetricas`, `despegue`).
- Llama 2 7B: matrices de 4096×4096 en la atención y de 11 008×4096 en el MLP (`svd`, `rango-bajo`).
- LoRA (Hu y otros, 2021): afina consultas y valores, A al azar y B a cero (`rango-bajo`, `rango`).
- Traducción con una matriz (Mikolov y otros, 2013) y los 300 números de word2vec (`matriz-vector`).
- `np.linalg.solve` frente a `inv`, `inverse_transform`, `explained_variance_ratio_` y `transform` de scikit-learn (`inversa`, `pca`).
- PageRank por iteración de potencias, inicialización ortogonal, redes de estado de eco, desvanecimiento del gradiente (`autovectores`); normalización espectral en las GAN (`svd`); `nn.Linear.weight` con forma (salidas, entradas) (`despegue`); implementaciones que se ahorran el triángulo de la máscara causal (`atencion`).

**D. De proceso**

- Los agentes gastaron de 55 a 97 llamadas, por encima de las 60 del encargo.
- `README.md` y `CLAUDE.md` están al día; `docs/handoffs/2026-11-10-laboratorios-y-ruta/brief-proyecto-comun.md` ya nombra `inputs` y `readout.says`.
