# AIlearn

Juegos para aprender ingeniería de IA con la matemática como columna vertebral. Cada juego enseña un bloque de matemáticas y lo aplica a un tema de IA. Los niveles tienen un despegue de entrada, órbitas con proyectos de tres ejercicios que se validan con nota 80 y un examen por órbita, con XP y nivel decimal.

Esta entrega contiene el motor de la trayectoria, el despegue, la órbita 0 («La flecha»), la órbita 1 («El ángulo»), la órbita 2 («Muchas dimensiones») y la órbita 3 («Búsqueda», con embeddings reales) del juego 1, «Vectores y embeddings», y el despegue, la órbita 0 («La máquina»: Columnas, Matriz por vector, Componer), la órbita 1 («El área»: Determinante, Inversa, Rango), la órbita 2 («Direcciones propias»: Autovectores, Matrices simétricas, PCA) y la órbita 3 («Descomponer y aproximar»: SVD, Rango bajo y LoRA, Atención como matriz) del juego 2, «Matrices y transformaciones», y el despegue y la órbita 0 («La pendiente»: Derivada como pendiente, Reglas de derivación, Mínimos) del juego 3, «Derivadas y gradiente». Todo el texto visible está en castellano.

Con la órbita 3, el juego 2 tiene construidas todas las órbitas que prevé `src/games/roadmap.ts`. El juego 3 estrena el plano de curvas (preguntas `curva` y figuras `graph`): funciones de una variable con su tangente, sus secantes, su derivada y, en una pérdida, el ajuste de los datos.

Cada juego y cada proyecto dice dónde encaja en una red neuronal (`bigPicture`). Se ve como una tarjeta, «Dónde encaja en la red», con el dibujo de un modelo de lenguaje pequeño y sus piezas resaltadas, en el panel del proyecto, en el mapa del juego y en el despegue. La página `#/red`, «La red por dentro», enseña la red entera y, por pieza, dónde se practica.

El diseño está en `docs/superpowers/specs/2026-10-13-motor-y-juego-1-vectores-design.md`. La ruta completa (los nueve juegos previstos, con sus órbitas y proyectos) vive en `src/games/roadmap.ts` y se ve en `#/ruta`, enlazada desde el inicio; lo que no está construido sale como «Próximamente».

## Arrancarlo

Necesita Node 22 y npm 10.

```
npm install
npm run dev
```

`npm run dev` sirve el juego en el navegador. `?abierto` (por ejemplo `#/j/vectores?abierto`) salta las puertas de la trayectoria para probar cualquier pantalla, también en producción; dura hasta recargar la página. El progreso se guarda en `localStorage` y sobrevive a recargar. Con «Entrar con Google» (opcional) se guarda además en Firebase y se comparte entre dispositivos: al entrar, lo local y lo de la nube se fusionan sin perder nada.

Python (NumPy y matplotlib) corre en el navegador con Pyodide, que se descarga de su CDN la primera vez que una pregunta de código lo necesita. Esa primera carga necesita conexión y tarda entre 7 y 14 s en frío.

## Órdenes

| Orden             | Qué hace                                                                            |
| ----------------- | ----------------------------------------------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo                                                              |
| `npm run check`   | `tsc --noEmit` y ESLint                                                             |
| `npm test`        | Vitest: motor, contenido, almacenamiento, interfaz y Pyodide en Node                |
| `npm run build`   | `npm run check` y compilación de producción en `dist/`                              |
| `npm run preview` | Sirve `dist/`                                                                       |
| `npm run e2e`     | Prueba de humo con Playwright en Chrome del sistema, sobre la compilación (`dist/`) |
| `npm run format`  | Prettier sobre todo el proyecto                                                     |

`npm run e2e` es un guion que añade la tarea 19a junto a `playwright.config.ts` y `tests/e2e/smoke.spec.ts`. Playwright no descarga navegadores: usa `/usr/bin/google-chrome` y arranca `npm run preview`, así que hay que compilar antes (`npm run build`).

Las pruebas de código cargan Pyodide en Node y guardan su caché de paquetes en el directorio actual: lanza Vitest siempre desde la raíz del repositorio.

## Estructura

```
src/
  engine/     Reglas de la trayectoria (nota, validación, puertas, examen, XP, nivel), métricas del plano de vectores y del de curvas (`curves.ts`). TypeScript puro.
  content/    Esquema del contenido (Zod), validación, generadores, corrección y sorteo del examen.
  python/     Worker de Pyodide, su interfaz, el arnés que ejecuta código y comprobaciones, y el módulo `embeddings` (embeddings reales precalculados).
  storage/    Interfaz de progreso y su implementación sobre localStorage, con migración.
  ui/         Marco, plano de vectores, editor, tipos de pregunta, pantallas y textos fijos.
  games/      Registro de juegos (index.ts) y, por juego, su contenido.
    vectores/ Juego 1: Despegue, proyectos de las Órbitas 0 a 3, sus bancos de examen, embeddings de juguete.
    matrices/ Juego 2: Despegue, proyectos de las Órbitas 0 a 3, sus bancos de examen y `plane.ts` (plano con î y ĵ como columnas).
    gradiente/ Juego 3: Despegue, proyectos de la Órbita 0 y su banco de examen.
    network.ts Fichas de las piezas de la red que dibuja «La red por dentro» (`#/red`).
tests/
  content/    Pruebas que recorren el registro de juegos y ayudantes compartidos.
  deps/       Imports declarados en package.json y versión única de KaTeX.
  lint/       Pruebas de las reglas de ESLint propias.
  e2e/        Prueba de humo de Playwright (tarea 19a; Vitest no la recoge).
scripts/      embeddings.py: regenera src/python/embeddings.py con el modelo (en un entorno de Python aparte).
docs/         Spec, planes y relevos.
```

Dónde viven las cosas:

- Reglas de puntuación y desbloqueo: solo en `src/engine`. `src/engine` no importa nada de fuera de `src/engine` (lo impone ESLint).
- Textos fijos de la interfaz: `src/ui/strings.ts`, un grupo `t.<área>` por área.
- Almacenamiento: solo `src/storage` toca `localStorage`. Clave de progreso `ailearn:v1:local:<juego>`; los borradores de código van en `ailearn:v1:local:<juego>:borradores` y las tandas a medias (un ejercicio o el despegue sin terminar) en `ailearn:v1:local:<juego>:tandas`. Los ajustes del jugador (hoy, si suena el juego) van en `ailearn:v1:ajustes` (`src/storage/prefs.ts`), comunes a todos los juegos y sin subir a la nube.
- Constantes de las reglas: `src/engine/types.ts`.
- Rutas (con `HashRouter`): `src/App.tsx`.

## El contenido es dato

Las preguntas, los proyectos y los juegos son objetos serializables validados con el esquema de `src/content/schema.ts`: nunca contienen funciones. Se escriben en ficheros TypeScript para tener tipos al editarlos.

- Un proyecto tiene `id`, `name`, `sub`, 3 ejercicios, 3 hojas, `warmup` y `bigPicture`. Los ejercicios son, en este orden, `manipular`, `calcular` y `programar`; cada uno tiene 5 preguntas. Las hojas son preguntas `revision` («Caza el error»).
- `bigPicture` dice dónde encaja el proyecto en una red neuronal: `parts`, de 1 a 4 piezas de `NETWORK_PARTS` (`src/content/schema.ts`), de la más directa a la menos, y `text`, de 2 a 4 frases (de 120 a 480 caracteres). La ficha de cada pieza vive en `src/games/network.ts`. `tests/content/big-picture.test.ts` lo exige en todo juego y proyecto registrado.
- Una órbita tiene `name`, `projects` y `examBank` (el banco del que se sortean las 6 preguntas del examen).
- Un juego tiene `id`, `title`, `bigPicture`, `launch` (lista de preguntas) y `orbits`.
- Toda pregunta tiene `id` estable, `prompt` (Markdown, fórmulas entre `$...$` y `$$...$$`), `hints`, `explain` (primer fallo) y `solution` (segundo fallo).

Tipos de pregunta y qué ejercicio los admite:

| Tipo        | Ejercicio | Campos propios                                                                               |
| ----------- | --------- | -------------------------------------------------------------------------------------------- |
| `manipular` | manipular | `plane` (vectores, `range`, `snap`, lecturas) y `goals` (métrica, vectores, `target`, `tol`) |
| `curva`     | manipular | `graph` (plano de curvas) y `goals` (métrica, puntos, `target`, `tol`)                       |
| `numero`    | calcular  | `answer`, `tol`, `plane` o `graph` opcional                                                  |
| `vector`    | calcular  | `answer` (lista), `tol`, `plane` o `graph` opcional                                          |
| `opcion`    | calcular  | `options`, `correct` (índice), `plane` o `graph` opcional                                    |
| `codigo`    | programar | `starter`, `checks`, `reference`, `requirements`                                             |
| `revision`  | hojas     | `format` (`codigo` o `texto`), `lines`, `faultyLine` (índice, o `null` si está bien)         |

Los decimales se muestran con coma y se aceptan con coma o con punto. En el texto, los pares con algún decimal se separan con «; ».

Matrices en el plano y en las respuestas:

- `plane.transform: { columns: [idI, idJ], apply? }` convierte el plano en una transformación lineal: la matriz $A$ tiene por columnas las posiciones actuales de esos dos vectores (si son móviles, cambia al arrastrarlos). Se dibuja la rejilla transformada, la imagen del cuadrado unidad (en rojo si $\det A < 0$) y, para cada id de `apply`, la flecha discontinua $A\vec v$. Las lecturas `matrix` y `det` exigen `transform`.
- Métricas de meta: `det` (dos ids) y `img_x`, `img_y` (tres ids: `[i, j, v]`, las componentes de $A\vec v$), `img_angle` (tres ids: el ángulo en grados entre $\vec v$ y $A\vec v$) `rayleigh` (tres ids: $\vec v^\top A\vec v / \vec v^\top\vec v$; vale $\lambda$ si $\vec v$ es autovector, y en una matriz de covarianza es la varianza en la dirección de $\vec v$) y `stretch` (tres ids: $|A\vec v| / |\vec v|$, cuánto estira $A$ la dirección de $\vec v$; su máximo y su mínimo son los valores singulares $\sigma_1$ y $\sigma_2$).
- Lecturas de `readouts` por cada id de `transform.apply` (exigen `transform` con al menos un `apply`): `image` ($A\vec v$), `img_angle`, `rayleigh` y `stretch`. La opción `circleImage: true` del plano (exige `circle` y `transform`) dibuja la imagen por $A$ de la circunferencia `circle`: una elipse.
- Un `vector` con `shape: [filas, columnas]` pide una matriz: `answer` va fila a fila.

El plano de curvas (`graph`, juego 3; esquema en `src/content/schema.ts`, métricas en `src/engine/curves.ts`, dibujo en `src/ui/CurvePlane.tsx`, ejemplos en `#/dev/curvas`):

- Una ventana `x`, `y` con escala propia en cada eje, `snap` (el paso de la rejilla al arrastrar), una `curve` opcional y `points`. La curva es `poly` (`coefs`, del término independiente al de mayor grado) o `mse` (la pérdida media de ŷ = w·x sobre los pares de `data`; la variable del plano es w). Un punto va sobre la curva (`onCurve: true`, sin `y`: su altura es siempre f(x) y se arrastra en horizontal) o libre (con `y`). Como mucho 2 puntos móviles.
- Lecturas de `readouts`: `coords`, `slope` (la tangente en cada punto de la curva), `secant` (entre los dos puntos de `pair`, sobre la curva) y `line` (la recta por los dos puntos libres de `pair`, con su triángulo de avance y subida). `secant` y `line` no van juntas. Solo dibujan: `tangent`, `derivative` (f′ discontinua), `step` (el paso de descenso de x a x − rate·f′(x)) y `fit` (con `mse`: un panel con los datos, la recta ŷ = w·x y los cuadrados de los errores).
- Métricas de meta: `x`; `y` (punto libre); `fx` y `slope` (un punto sobre la curva); `secant` (dos sobre la curva); `line_slope` y `line_icpt` (dos libres). La meta tiene que alcanzarse en la rejilla y no cumplirse al empezar.
- En `numero`, `vector` y `opcion`, `graph` es una figura estática, que no lleva la lectura que da la respuesta (sin `slope` si se pide la pendiente).

### Añadir una pregunta

1. Escríbela en el fichero de su proyecto (`src/games/vectores/<proyecto>.ts`) con el tipo que admita su ejercicio. Id con el patrón del proyecto: `<proyecto>.ex0N.<n>` para ejercicios y `<proyecto>.hoja.<n>` para hojas; `despegue.<n>` en el despegue.
2. `manipular` y `curva`: la meta debe ser alcanzable desde el plano y no cumplirse en la posición inicial. Como mucho 2 vectores o puntos móviles (la comprobación de alcanzabilidad recorre todas las colocaciones de la rejilla).
   - Lleva `purpose`, el sentido del ejercicio (petición de Oliver, 2026-10-28). `why` («Para qué sirve») y `aim` («Qué vas a conseguir») se ven siempre, antes del enunciado; `takeaway` («Lo que te llevas»), al cerrar la pregunta, también si se acierta a la primera (la `explain` solo sale tras un fallo). `why` dice dónde aparece eso en un sistema de IA real y qué decisión ayuda a tomar, sin inventar datos; `aim`, qué construye el jugador en el plano y qué le deja ver, sin la posición que resuelve; `takeaway`, la conclusión y su consecuencia en el sistema real. De 60 a 700 caracteres cada uno y distintos dentro del proyecto. `tests/content/purpose.test.ts` lo exige en todo despegue y proyecto salvo los de su lista `PENDING`, que solo encoge. Modelo: `src/games/vectores/fallos-rag.ts`.
3. Las preguntas del ejercicio «Calcular» (`numero`, `vector`, `opcion`) también llevan `purpose` (petición de Oliver, 2026-10-28: las explicaciones no decían dónde se usa lo que se calcula). Se ven igual que en `manipular`. `why` da el contexto: en qué sistema de IA real aparece esa cuenta, con un caso de uso concreto, y qué decisión ayuda a tomar; `aim`, qué vas a calcular o decidir y qué te deja ver, sin el resultado; `takeaway`, qué significa el resultado en ese sistema y qué se hace con él. Mismos límites (de 60 a 700 caracteres, sin repetir textos dentro del proyecto, también con los de su «Manipular») y misma lista `PENDING` en `tests/content/purpose.test.ts`. Los despegues, las hojas y los bancos de examen no lo llevan. Modelo: el «Calcular» de `src/games/vectores/fallos-rag.ts`.
4. `codigo`: `reference` es una solución que pasa `checks`; `starter` no los pasa. `checks` llama a `check(condición, "mensaje")`, y cada mensaje debe orientar al jugador. Se comprueban resultados (variables, funciones, figuras), nunca el texto del código. `requirements` (de 1 a 6 frases) dice, antes de entregar, qué miran las comprobaciones: nombre, tipo y forma de cada variable, con qué otros datos se prueba una función, el orden, la tolerancia. Nunca da el valor esperado, el código de la solución ni el eje (`axis`) que decide la pregunta.
   - El `starter` lleva de la mano a quien practica poco Python: dice qué es cada cosa importada o ya hecha («Ya está hecha: no hace falta tocarla» y qué devuelve), y antes de cada variable que queda en `None` pone un bloque `# PASO N.` con qué calcular, **por qué** (la idea, no solo la orden), la herramienta de Python que hace falta con un mini ejemplo de otros datos si ayuda, y qué tipo de resultado se espera (un número, una lista de seis palabras…). Termina recordando `print(...)` y «Ejecutar». Sin decimales con coma (regla de prosa).
   - Las pistas son tres, de menos a más: (1) el plan en palabras, paso a paso, nombrando las herramientas; (2) las piezas de Python en un bloque de código Python con otros datos o con un solo caso, cada línea comentada con lo que hace o lo que imprime; (3) el esqueleto de la solución en un bloque de código Python con huecos `___` donde va la decisión de la pregunta, y una frase sobre el error típico. En el contenido, el ayudante `py(...)` arma el bloque.
   - Su `*.python.test.ts` comprueba las pistas: cada ejemplo sin huecos se ejecuta sin error tras el `starter`, y el esqueleto rellenado aprueba (`hintBlocks` y `fillSkeleton` de `tests/content/python-helpers.ts`; modelo: `src/games/vectores/analogias.python.test.ts`).
5. Un número variable en el examen se escribe como entrada `generada` del banco, que nombra un generador de `src/content/generators.ts` (con sus límites `bounds`) y no lleva la función.
6. Lanza `npm test`.

Los ejercicios y las hojas tienen un número fijo de preguntas: añadir una más no es posible sin quitar otra.

### Añadir un proyecto

1. Crea `src/games/<juego>/<proyecto>.ts` que exporte un `Project`: 3 ejercicios (`manipular`, `calcular`, `programar`) de 5 preguntas y 3 hojas. Ids de pregunta únicos dentro del proyecto, y el id del proyecto único en el juego.
2. Añádelo a `projects` de la órbita en `src/games/<juego>/index.ts`.
3. Añade al `examBank` de la órbita las entradas del proyecto (`{ project: '<id>', question }`). El banco tiene que sostener al menos 3 exámenes distintos y el sorteo reparte las 6 preguntas entre los proyectos de la órbita.
4. Escribe su calentamiento de Python en `src/games/<juego>/<proyecto>.calentamiento.ts` y enlázalo con `warmup:` en el proyecto (modelo: `src/games/matrices/columnas.calentamiento.ts`). Son de 1 a 4 fichas con lo nuevo de Python o de NumPy de su ejercicio «Programar», para probarlo antes del ejercicio que puntúa: explicación, un ejemplo que se ejecuta y escribe con `print`, cambios para probar («Prueba a…») y un reto «Ahora tú» con `starter`, `checks` y `reference`, con nombres y datos propios (no resuelve ninguna pregunta). No cuenta para la nota. Las pruebas de `tests/content/warmup*.test.ts` lo recorren solas: exigen calentamiento en cada proyecto, aplican las reglas de prosa y ejecutan ejemplos y retos en Pyodide.
5. Cablea las pruebas propias del proyecto, que no se descubren solas: `defineProseTests('proyecto <id>', projectQuestions(<proyecto>))` (reglas de prosa, de `tests/content/prose-helpers.ts`) y, para sus preguntas de código, una prueba `*.python.test.ts` con soluciones válidas distintas de la de referencia y errores típicos. Copia `src/games/vectores/suma-escala.test.ts` y `suma-escala.python.test.ts`.

### Añadir un juego

1. Crea `src/games/<id>/` con un `index.ts` que exporte un `Game`, con el mismo `id`, título y nombres de órbitas y proyectos que su entrada en `src/games/roadmap.ts` (lo comprueba `tests/content/roadmap.test.ts`). Al registrarlo, deja de salir como «Próximamente».
2. Regístralo en la lista `games` de `src/games/index.ts`. Con eso quedan cubiertos por las pruebas genéricas de `tests/content` sin escribir nada por juego.
3. El id del juego da la clave de progreso (`ailearn:v1:local:<id>`) y la ruta (`#/j/<id>`).
4. Si hace falta una métrica nueva del plano, se añade en `src/engine/vectors.ts` y en `METRICS` de `src/content/schema.ts`; las reglas del motor no se tocan.
5. Como en un proyecto nuevo, cablea sus pruebas de prosa y de código.

## Recompensas y efectos

El juego celebra lo que se consigue y enseña el avance con dibujos. Nada de esto se guarda aparte ni cambia la nota o el XP: todo sale del resumen que ya existe, con reglas en `src/engine/rewards.ts` y en `streak` de `src/engine/session.ts`.

- **Racha**: preguntas seguidas acertadas a la primera dentro de una tanda («Racha ×3» en la cabecera del ejecutor, desde 2). Un fallo o una pista la cortan. En examen no hay racha ni efectos que digan si una entrega está bien.
- **Al entregar**: acierto con confeti desde el botón y un sonido que sube con la racha; fallo con una sacudida suave del botón y un tono grave; en examen, un clic neutro.
- **Estrellas** de una tanda de ejercicio: 3 de 5 a la primera dan una, 4 (la nota de validar) dos, las 5 tres. Se ven en el resultado, con el XP ganado.
- **Nivel**: barra de avance hacia el siguiente nivel en la cabecera, en el mapa y en el inicio. Al subir de nivel, fanfarria, confeti y aviso.
- **Logros** (11 por juego, de «Despegue» a «Juego completo»): se calculan del resumen (`achievements`), se listan en Estadísticas y avisan al conseguirse. Solo avisa un cambio hecho en esta sesión (`useSummaryChanges` de `src/ui/useProgress.ts`): lo que llega de la nube al entrar con Google no celebra nada.
- **Mapa ilustrado**: cada órbita es un planeta con una luna por proyecto; cada proyecto lleva su icono de estado y una barra de nota con la raya del 80; «Siguiente paso» señala lo que conviene jugar (`nextStep`). El estado sigue escrito en texto: los dibujos son adorno, ocultos al lector de pantalla.
- **Plano animado** (al estilo de 3Blue1Brown y de Mafs): una figura fija con `transform` deforma la rejilla desde la identidad hasta la matriz al aparecer, y el botón «Ver la transformación» lo repite; una figura fija sin transformación hace crecer sus vectores desde el origen. En el plano de curvas (juego 3), una figura fija traza su curva (y su derivada) de izquierda a derecha, sus puntos bajan por la curva hasta su sitio (la tangente gira con ellos y, en una pérdida, la recta del ajuste rota y los cuadrados de error cambian) y al final el paso de descenso recorre la curva; «Ver cómo se dibuja» lo repite. Las lecturas y el rótulo del ajuste enseñan siempre los valores finales. Un plano interactivo no se anima, tampoco al cerrarse la pregunta (`src/ui/fx/useIntro.ts`).

Los efectos viven en `src/ui/fx/` sin librerías: el confeti, el texto que sube y los avisos son piezas de DOM con animación CSS, al estilo de canvas-confetti, y los sonidos se sintetizan con WebAudio, al estilo de ZzFX, sin ficheros ni red. Con `prefers-reduced-motion` no hay confeti, sacudidas ni animación del plano; los avisos y el sonido siguen. El botón de la cabecera apaga el sonido. En las pruebas con jsdom (sin `matchMedia`) no se pinta ningún efecto ni el botón de sonido, y el plano sale ya en su estado final.

## Qué garantizan las pruebas de contenido

`tests/content/games.test.ts` recorre `games` y exige que `gameProblems` (`src/content/validate.ts`) no devuelva nada:

- Todo el juego cumple el esquema.
- Los ids son únicos en todo el despegue, los proyectos (preguntas y hojas) y el banco.
- La meta de cada `manipular` y de cada `curva` (también en el banco) es alcanzable desde su plano, y la posición inicial no la cumple ya.
- El banco de cada órbita permite al menos tres exámenes distintos (semillas 1, 2 y 3).
- Cada entrada generada nombra un generador que existe y se resuelve con las semillas 1 a 10; su respuesta se corrige como correcta.
- La respuesta declarada de cada pregunta se corrige como correcta, escrita con dos decimales y coma.
- Las opciones de una pregunta `opcion` no se repiten.

`src/content/generators.test.ts` comprueba, para 200 semillas por generador, que la pregunta cumple el esquema, queda dentro de sus `bounds` y acepta su propia respuesta.

`tests/content/python.test.ts` ejecuta Pyodide en Node sobre toda pregunta de código del registro, incluidos el despegue y los bancos: la `reference` supera sus `checks`, el `starter` no, y `checks` contiene al menos una llamada a `check(`.

Las pruebas de prosa (`tests/content/prose-helpers.ts`) revisan el texto visible: sin `$` sueltos, fórmulas que pasan KaTeX estricto, sin punto decimal en prosa, pares con decimales separados por «; », mensajes de las comprobaciones sin Markdown peligroso ni errores de NumPy en inglés, y vocabulario del juego. Se cablean por proyecto.

Lo que no garantizan: que una pregunta enseñe bien. Eso lo decide quien juega.

## Más pruebas

- `src/engine/*.test.ts`: cada regla de la trayectoria.
- `src/storage/local.test.ts`: guardar, cargar, migración y documento corrupto.
- `tests/deps`: todo paquete importado desde `src/` está declarado en `package.json`, y KaTeX tiene una sola versión.
- `tests/lint`: las reglas de ESLint que protegen el aislamiento del motor y `localStorage`.
- `npm run e2e`: la prueba de humo con navegador real.

## Sin ganchos ni despliegue

El proyecto no tiene ganchos de git ni despliegue. No hay red de seguridad automática: quien hace push es la última barrera. Antes, `npm run check`, `npm test` y `npm run build`.
