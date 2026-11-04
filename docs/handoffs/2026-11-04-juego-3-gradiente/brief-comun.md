# Juego 3 «Derivadas y gradiente»: reglas comunes para todos los encargos

Worktree: `/home/olive/projects/AIlearn/.claude/worktrees/juego-3-gradiente` (rama `worktree-juego-3-gradiente`, desde `origin/main` 129f540). `node_modules` es un enlace simbólico al checkout principal: sale como `?? node_modules` y **nunca se añade**. Trabaja solo dentro del worktree. Lanza Vitest siempre desde la raíz del worktree.

## Por qué existe este trabajo

Oliver (el único jugador) pidió el 2026-11-04: «completa el siguiente paso en el roadmap para comprender cómo funciona la IA, pero necesito que incorpores algunos visuales más, más intuición, más visualización y más contexto sobre cómo se relacionan los ejercicios que estoy haciendo con el big picture de una red neuronal. Estoy haciendo un gran esfuerzo para aprender, pero completar cada nivel está siendo tedioso.»

Los juegos 1 y 2 están completos y publicados. El siguiente paso es el juego 3, «Derivadas y gradiente» (`src/games/roadmap.ts`): su despegue y su Órbita 0 «La pendiente» (Derivada como pendiente, Reglas de derivación, Mínimos). Tres cosas nuevas:

1. **Plano de curvas** (`curva`): funciones de una variable con tangentes, secantes, la derivada dibujada y, para una pérdida, el panel de ajuste (datos, recta ŷ = w·x y sus errores). Contrato ya escrito y probado: `src/engine/curves.ts`, `graphSpecSchema`, `curvaQSchema` y `graphPositions` en `src/content/schema.ts` y `src/content/grade.ts`, `checkReachableCurva` en `src/content/validate.ts`, pruebas en `src/content/curva.test.ts` (commit 4053d36). **No cambies ese contrato**; si te falta algo, dilo en el informe.
2. **El big picture**: el dibujo de una red (un modelo de lenguaje pequeño) con las piezas que toca cada proyecto resaltadas, en el panel del proyecto, en el mapa del juego y en una página `#/red`. Datos: `bigPictureSchema`, `NETWORK_PARTS` en `schema.ts` y las fichas de `src/games/network.ts`.
3. **Menos tedio**: menos texto, más dibujo. Lo hace cumplir cada encargo de contenido (presupuestos de texto abajo).

## Reglas del repositorio (resumen; la autoridad es `CLAUDE.md` y `README.md`)

- Proceso ligero (Oliver lo ha pedido dos veces): sin skills de superpowers. Trabajo directo, `npm run check` y las pruebas afectadas como red.
- TypeScript estricto, sin `any`. `src/engine` no importa nada de fuera de `src/engine`. Solo `src/storage` toca `localStorage`.
- Todo texto visible en castellano; identificadores en inglés. Textos fijos de la interfaz en `src/ui/strings.ts`, un grupo `t.<área>` por área.
- Decimales con coma al mostrarlos (`fmt`, `fmtPair` de `src/ui/format.ts`); pares con algún decimal separados por «; ». En fórmulas KaTeX, la coma decimal se escribe `{,}`.
- Sin librería de gráficos: SVG propio. Sin librerías nuevas, sin `npm install`, sin cambiar versiones.
- Toda expectativa de una prueba lleva un comentario `// contract:` con su procedencia. No cambies una expectativa existente para que pase; arregla el código o el contenido. (Excepción: una prueba que enumera los juegos registrados o las órbitas del juego, cuando el cambio es justo añadir uno: amplía la lista y di por qué en el `// contract:`.)
- Sin `git add -A`, sin `git stash`, sin `git reset`, sin push, sin merge. Commit solo de **tus** ficheros, por nombre, con el mensaje en castellano al estilo del repositorio (`feat(<área>): …`) y la línea final `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Ficheros compartidos entre agentes que trabajan a la vez**: `src/ui/strings.ts` y `src/ui/theme.css`. Edita solo tu grupo o tu sección (con un comentario de cabecera propio), vuelve a leer el fichero justo antes de cada edición, y **no los incluyas en tu commit**: los sube la sesión principal. Di en el informe qué añadiste en ellos.
- Si `npm run check` o una prueba falla en un fichero que no es tuyo, probablemente es trabajo a medias de otro agente: no lo toques, vuelve a probar más tarde y dilo en el informe.
- No lances otros agentes.

## Comprobaciones visuales

La interfaz solo se da por buena tras verla. `npm run dev` sirve el juego (elige un puerto libre con `--port`), y `?abierto` salta las puertas. Para ver una pantalla, escribe fuera del repositorio (en `/home/olive/.claude/jobs/fe55296f/tmp/<tu-carpeta>/`) un guion de Playwright que la abra con `/usr/bin/google-chrome` (`chromium.launch({ executablePath: '/usr/bin/google-chrome' })`; Playwright ya está en `node_modules`) y saque capturas a 390 px y a 1200 px de ancho, y míralas con la herramienta Read (lee imágenes). El tema es solo oscuro (`src/ui/theme.css`, sus tokens en `:root`; respeta su organización, descrita en la cabecera del fichero). Mata el servidor al acabar.

## Informe final (tu último mensaje)

1. Qué ficheros creaste o cambiaste, y el hash del commit.
2. Qué comprobaste y qué viste (órdenes y resultados, capturas miradas).
3. Lo que añadiste en `strings.ts` y `theme.css` (sin commit).
4. `RISKS:` una lista de lo que podría romper el trabajo de otros (una forma de datos que cambia, una lista mantenida a mano, un componente que comparten dos pantallas), o «ninguno».
