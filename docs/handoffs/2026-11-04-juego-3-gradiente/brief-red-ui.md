# Encargo: «La red por dentro», el big picture de cada proyecto

Lee antes `brief-comun.md` (misma carpeta). Trabajas en paralelo con otros tres agentes: uno hace el plano de curvas, otro escribe los textos `bigPicture` de los 24 proyectos de los juegos 1 y 2 y de los dos juegos, y otro registra el juego 3 con su despegue (con su propio `bigPicture`).

## La idea

Oliver hace ejercicios sueltos (una matriz 2×2, un coseno, una derivada) y no ve dónde encajan en una red neuronal. Cada proyecto dirá ahora dónde encaja, y lo enseñará en **un dibujo de un modelo de lenguaje pequeño** con sus piezas resaltadas. Una página entera, `#/red`, explica la red pieza a pieza y lleva a los proyectos que enseñan cada una.

## Qué hay ya (no lo cambies)

- `src/content/schema.ts`: `NETWORK_PARTS` (13 ids), `NetworkPart`, `bigPictureSchema` (`parts`: de 1 a 4 piezas, de la más directa a la menos; `text`: Markdown), y `bigPicture` opcional en `projectSchema` y en `gameSchema`.
- `src/games/network.ts`: la ficha de cada pieza (`name`, `short`, `detail` en Markdown con KaTeX, `roadmap`: órbitas de la ruta que la enseñan), los tres grupos `NETWORK_GROUPS` («Responder», «Aprender», «Alrededor») y `BLOCK_PARTS` (las que se repiten en cada bloque). Es contenido: si un texto suyo te parece mal, dilo en el informe; no lo reescribas.
- `src/games/roadmap.ts` (la ruta de los nueve juegos) y el registro `games` de `src/games/index.ts`, que lee la interfaz con `GamesContext` (mira cómo lo usa `RoadmapScreen.tsx`).

## Qué construir

1. **`src/ui/NetworkDiagram.tsx`**: SVG propio del modelo. Props: `highlight: NetworkPart[]`, `selected?: NetworkPart`, `onSelect?: (p) => void`, `compact?: boolean`.
   - Camino «Responder», de arriba abajo: Tokens → Embeddings → un marco «bloque × N» con Atención, Capas lineales (con la Activación como pastilla dentro del MLP) y Residual y normalización → Salida. Bajo cada nombre, su `short` (en `compact` se puede omitir).
   - Bucle «Aprender» al lado: de la Salida sale una flecha a Pérdida («compara con la respuesta»), luego Gradiente, luego Actualizar pesos, y una flecha de vuelta a las piezas con pesos («ajusta los pesos»). Que se entienda que es un bucle.
   - «Alrededor»: Búsqueda con embeddings, Mirar por dentro y Comprimir y afinar, como etiquetas enganchadas a la pieza que usan (embeddings; embeddings; capas lineales).
   - Resaltado: las piezas de `highlight` con el color de acento y borde fuerte; las demás atenuadas pero legibles. `selected` con un anillo de foco.
   - Con `onSelect`, cada pieza es un control accesible (botón con nombre, foco visible, Enter y espacio). Sin él, es una figura con `role="img"` y un `aria-label` que nombra las piezas resaltadas.
   - **Legible a 390 px de ancho**: diseña la geometría pensando en el móvil (texto de 11 a 13 px en pantalla); si dos columnas no caben, el bucle de entrenamiento puede ir debajo o en una columna estrecha. Mira las capturas.
2. **`src/ui/BigPicture.tsx`**: la tarjeta «Dónde encaja en la red» para un `BigPicture`: el diagrama en `compact` con sus piezas resaltadas, el `text` con `Md`, la lista de las piezas resaltadas con su `name` y su `short`, y un enlace «Ver la red entera» a `#/red` con la primera pieza seleccionada (por ejemplo `#/red?pieza=loss`; respeta `?abierto` si la ruta actual lo trae, mira `useOpenOverride` y `lookup.ts`).
3. **Dónde sale la tarjeta**: en `ProjectPanel.tsx`, arriba, tras el subtítulo y la nota, antes de los ejercicios, si el proyecto tiene `bigPicture`; en `GameMap.tsx`, arriba, con el `bigPicture` del juego; en `LaunchScreen.tsx`, el del juego, en la introducción del despegue si hay un sitio natural (si no lo hay, dilo). Sin `bigPicture`, nada: los textos llegan en paralelo.
4. **`src/ui/screens/NetworkScreen.tsx`**, ruta `/red` en `src/App.tsx` (perezosa, como las demás): título «La red por dentro» y una frase de entrada; los tres grupos con su `short`; el diagrama grande y clicable; al elegir una pieza (y al llegar con `?pieza=`), su ficha: `name`, `detail` con `Md`, **«Dónde lo practicas»**: los proyectos construidos de todos los juegos registrados cuyo `bigPicture.parts` incluye la pieza, enlazados a su panel, y **«En la ruta»**: las órbitas de `roadmap` de la ficha, enlazadas al mapa del juego si ese juego está registrado y tiene esa órbita, o con «Próximamente» si no. Enlaza `#/red` desde el inicio (`Hub.tsx`), desde la cabecera o el pie del mapa del juego y desde `RoadmapScreen.tsx`.
5. Textos fijos en `t.network` de `strings.ts`. Estilos en tu sección «=== Red ===» de `theme.css`.
6. Pruebas: el diagrama pinta las 13 piezas y marca las resaltadas; con `onSelect`, elegir una pieza llama con su id y es accesible por teclado; `#/red?pieza=attention` enseña su ficha y enlaza los proyectos que la tocan (crea un juego de prueba en la prueba si los textos de contenido aún no han llegado; mira cómo montan juegos de prueba `map.test.tsx` o `roadmap.test.tsx`); una órbita no construida sale como «Próximamente»; `ProjectPanel` enseña la tarjeta con `bigPicture` y no la enseña sin él.

## Ficheros

Tuyos: `src/ui/NetworkDiagram.tsx`, `src/ui/BigPicture.tsx`, `src/ui/screens/NetworkScreen.tsx`, `ProjectPanel.tsx`, `GameMap.tsx`, `LaunchScreen.tsx`, `Hub.tsx`, `RoadmapScreen.tsx`, `lookup.ts`, `src/App.tsx` y las pruebas nuevas o las que toques en `src/ui/screens/`. Compartidos (sin commit): `strings.ts` (grupo `t.network`) y `theme.css` (sección «=== Red ===»). El agente del despegue puede tocar pruebas de `src/ui/screens/` que enumeran los juegos registrados: si tienes que editar la misma prueba, vuelve a leerla justo antes.

## Hecho cuando

`npm run check` limpio; `npx vitest run src/ui` en verde; capturas a 390 y 1200 px de `#/red` (con una pieza elegida) y del panel de un proyecto con tarjeta (con `?abierto`; si aún no hay textos, pon uno provisional sin commit para la captura y quítalo) miradas; commit de tus ficheros; informe según `brief-comun.md`.
