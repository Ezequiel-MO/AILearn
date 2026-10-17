# AIlearn

Juegos para aprender ingeniería de IA con la matemática como columna vertebral. Cada juego enseña un bloque de matemáticas y lo aplica a un tema de IA. Los niveles tienen un despegue de entrada, órbitas con proyectos de tres ejercicios que se validan con nota 80 y un examen por órbita, con XP y nivel decimal.

Esta entrega contiene el motor de la trayectoria, el despegue, la órbita 0 («La flecha»), la órbita 1 («El ángulo»), la órbita 2 («Muchas dimensiones») y la órbita 3 («Búsqueda», con embeddings reales) del juego 1, «Vectores y embeddings». Todo el texto visible está en castellano.

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
  engine/     Reglas de la trayectoria (nota, validación, puertas, examen, XP, nivel). TypeScript puro.
  content/    Esquema del contenido (Zod), validación, generadores, corrección y sorteo del examen.
  python/     Worker de Pyodide, su interfaz, el arnés que ejecuta código y comprobaciones, y el módulo `embeddings` (embeddings reales precalculados).
  storage/    Interfaz de progreso y su implementación sobre localStorage, con migración.
  ui/         Marco, plano de vectores, editor, tipos de pregunta, pantallas y textos fijos.
  games/      Registro de juegos (index.ts) y, por juego, su contenido.
    vectores/ Juego 1: Despegue, proyectos de las Órbitas 0 a 3, sus bancos de examen, embeddings de juguete.
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
- Almacenamiento: solo `src/storage` toca `localStorage`. Clave de progreso `ailearn:v1:local:<juego>`; los borradores de código van en `ailearn:v1:local:<juego>:borradores`.
- Constantes de las reglas: `src/engine/types.ts`.
- Rutas (con `HashRouter`): `src/App.tsx`.

## El contenido es dato

Las preguntas, los proyectos y los juegos son objetos serializables validados con el esquema de `src/content/schema.ts`: nunca contienen funciones. Se escriben en ficheros TypeScript para tener tipos al editarlos.

- Un proyecto tiene `id`, `name`, `sub`, 3 ejercicios y 3 hojas. Los ejercicios son, en este orden, `manipular`, `calcular` y `programar`; cada uno tiene 5 preguntas. Las hojas son preguntas `revision` («Caza el error»).
- Una órbita tiene `name`, `projects` y `examBank` (el banco del que se sortean las 6 preguntas del examen).
- Un juego tiene `id`, `title`, `launch` (lista de preguntas) y `orbits`.
- Toda pregunta tiene `id` estable, `prompt` (Markdown, fórmulas entre `$...$` y `$$...$$`), `hints`, `explain` (primer fallo) y `solution` (segundo fallo).

Tipos de pregunta y qué ejercicio los admite:

| Tipo        | Ejercicio | Campos propios                                                                               |
| ----------- | --------- | -------------------------------------------------------------------------------------------- |
| `manipular` | manipular | `plane` (vectores, `range`, `snap`, lecturas) y `goals` (métrica, vectores, `target`, `tol`) |
| `numero`    | calcular  | `answer`, `tol`, `plane` opcional                                                            |
| `vector`    | calcular  | `answer` (lista), `tol`, `plane` opcional                                                    |
| `opcion`    | calcular  | `options`, `correct` (índice), `plane` opcional                                              |
| `codigo`    | programar | `starter`, `checks`, `reference`                                                             |
| `revision`  | hojas     | `format` (`codigo` o `texto`), `lines`, `faultyLine` (índice, o `null` si está bien)         |

Los decimales se muestran con coma y se aceptan con coma o con punto. En el texto, los pares con algún decimal se separan con «; ».

### Añadir una pregunta

1. Escríbela en el fichero de su proyecto (`src/games/vectores/<proyecto>.ts`) con el tipo que admita su ejercicio. Id con el patrón del proyecto: `<proyecto>.ex0N.<n>` para ejercicios y `<proyecto>.hoja.<n>` para hojas; `despegue.<n>` en el despegue.
2. `manipular`: la meta debe ser alcanzable desde el plano y no cumplirse en la posición inicial. Como mucho 2 vectores móviles (la comprobación de alcanzabilidad recorre todas las colocaciones de la rejilla).
3. `codigo`: `reference` es una solución que pasa `checks`; `starter` no los pasa. `checks` llama a `check(condición, "mensaje")`, y cada mensaje debe orientar al jugador. Se comprueban resultados (variables, funciones, figuras), nunca el texto del código.
4. Un número variable en el examen se escribe como entrada `generada` del banco, que nombra un generador de `src/content/generators.ts` (con sus límites `bounds`) y no lleva la función.
5. Lanza `npm test`.

Los ejercicios y las hojas tienen un número fijo de preguntas: añadir una más no es posible sin quitar otra.

### Añadir un proyecto

1. Crea `src/games/<juego>/<proyecto>.ts` que exporte un `Project`: 3 ejercicios (`manipular`, `calcular`, `programar`) de 5 preguntas y 3 hojas. Ids de pregunta únicos dentro del proyecto, y el id del proyecto único en el juego.
2. Añádelo a `projects` de la órbita en `src/games/<juego>/index.ts`.
3. Añade al `examBank` de la órbita las entradas del proyecto (`{ project: '<id>', question }`). El banco tiene que sostener al menos 3 exámenes distintos y el sorteo reparte las 6 preguntas entre los proyectos de la órbita.
4. Cablea las pruebas propias del proyecto, que no se descubren solas: `defineProseTests('proyecto <id>', projectQuestions(<proyecto>))` (reglas de prosa, de `tests/content/prose-helpers.ts`) y, para sus preguntas de código, una prueba `*.python.test.ts` con soluciones válidas distintas de la de referencia y errores típicos. Copia `src/games/vectores/suma-escala.test.ts` y `suma-escala.python.test.ts`.

### Añadir un juego

1. Crea `src/games/<id>/` con un `index.ts` que exporte un `Game`, con el mismo `id`, título y nombres de órbitas y proyectos que su entrada en `src/games/roadmap.ts` (lo comprueba `tests/content/roadmap.test.ts`). Al registrarlo, deja de salir como «Próximamente».
2. Regístralo en la lista `games` de `src/games/index.ts`. Con eso quedan cubiertos por las pruebas genéricas de `tests/content` sin escribir nada por juego.
3. El id del juego da la clave de progreso (`ailearn:v1:local:<id>`) y la ruta (`#/j/<id>`).
4. Si hace falta una métrica nueva del plano, se añade en `src/engine/vectors.ts` y en `METRICS` de `src/content/schema.ts`; las reglas del motor no se tocan.
5. Como en un proyecto nuevo, cablea sus pruebas de prosa y de código.

## Qué garantizan las pruebas de contenido

`tests/content/games.test.ts` recorre `games` y exige que `gameProblems` (`src/content/validate.ts`) no devuelva nada:

- Todo el juego cumple el esquema.
- Los ids son únicos en todo el despegue, los proyectos (preguntas y hojas) y el banco.
- La meta de cada `manipular` (también en el banco) es alcanzable desde su plano, y la posición inicial no la cumple ya.
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
