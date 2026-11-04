# Guía de contenido del juego 3 «Derivadas y gradiente»

Para todo encargo de contenido del juego 3 (despegue y proyectos). Lee antes `brief-comun.md`. Las reglas de contenido de siempre siguen en pie: `README.md` («El contenido es dato», «Añadir una pregunta», «Añadir un proyecto») y `CLAUDE.md` («Contenido: reglas que las pruebas hacen cumplir»).

## La historia del juego

Una red aprende moviendo sus pesos para equivocarse menos. Este juego enseña la brújula de ese movimiento: **la pendiente**. El hilo que recorre todo el juego es un **modelo de un solo peso**, ŷ = w·x, su **pérdida** L(w) (el error cuadrático medio sobre unos datos, la curva `mse` de `src/engine/curves.ts`) y su **panel de ajuste** (`fit`): al arrastrar w, la recta se mueve sobre los datos, los cuadrados de los errores crecen o encogen y el punto se desliza por la curva de la pérdida. La derivada dice hacia dónde bajar; el mínimo es donde la pendiente vale 0. Cada pregunta vuelve, cuando tenga sentido, a esa imagen.

## Menos tedio: presupuestos de texto (los hace cumplir tu prueba)

Oliver ha dicho que completar cada nivel es tedioso. Menos palabras, más dibujo:

| Campo | Máximo |
| --- | --- |
| `prompt` de una pregunta no de código | 420 caracteres (contando las fórmulas) |
| `prompt` de una pregunta de código | 600 |
| cada `hints[i]` de una pregunta no de código | 220 (y 2 pistas) |
| `explain` | 380 |
| `solution` | 480 |
| `purpose.why` / `aim` / `takeaway` | 60 a 300 / 60 a 200 / 60 a 260 |
| `bigPicture.text` | 120 a 480 |

Tu `*.test.ts` lleva una prueba que recorre las preguntas y comprueba estos máximos (con `// contract: guía de contenido del juego 3, presupuestos de texto`). Un enunciado que no cabe es un enunciado que tiene que apoyarse más en la figura.

## Visual primero

- Las 5 preguntas del ejercicio «Manipular» son de tipo **`curva`** (plano de curvas). Una idea por pregunta, y las 5 forman una historia: misma curva o misma familia, cambiando una cosa cada vez.
- Al menos 3 de las 5 de «Calcular» llevan **`graph`** (figura estática: la curva, los puntos, la tangente) y el enunciado remite a lo que se ve («mira la tangente en P»). En una figura estática no pongas la lectura que da la respuesta: si se pide la pendiente, no lleves `slope` en `readouts`.
- En «Programar», cuando ayude, el `starter` trae ya hecha una figura de matplotlib que pinta lo que calcula el jugador (la curva y su tangente, la pérdida y su mínimo), marcada «Ya está hecha: no hace falta tocarla». El jugador calcula; la figura se lo enseña.
- Con `curva`: como mucho 2 puntos móviles; la meta tiene que ser alcanzable en la rejilla (`snap`) y no cumplirse al empezar (lo comprueban `checkReachableCurva` y `checkStartNotSolved`; tu prueba llama a `checkProject`). Pon las tolerancias a la vista de la rejilla: con `snap` 0,1, una pendiente 2x − 4 toma valores de 0,2 en 0,2.
- En una curva `mse`, los datos y la ventana tienen que hacer que el mínimo caiga en la rejilla (o que la tolerancia lo recoja) y que la parábola se vea entera. Calcula con NumPy antes de escribir.

## El sentido de cada pregunta y el big picture

- Toda `curva` y toda pregunta de «Calcular» lleva `purpose` (`why`, `aim`, `takeaway`; lo exige `tests/content/purpose.test.ts`): `why` dice dónde aparece esto al entrenar una red de verdad, sin inventar datos; `aim`, qué construyes o calculas, sin la respuesta; `takeaway`, la conclusión y qué cambia en el sistema real. Cortos (tabla de arriba) y distintos entre sí.
- Todo proyecto lleva `bigPicture` (lo exige `tests/content/big-picture.test.ts`): piezas de `NETWORK_PARTS` (en este juego, sobre todo `loss`, `gradient` y `update`; lee sus fichas en `src/games/network.ts`) y un texto de dos a cuatro frases: qué hace esa pieza en la red y qué tiene que ver con lo que se practica aquí.

## Programar «de la mano»

Como en el resto del juego (`README.md`, «Añadir una pregunta», punto 3): `starter` con un bloque `# PASO N.` antes de cada variable en `None` (qué, por qué y con qué herramienta, con un mini ejemplo de otros datos), `requirements` (sin el valor ni el código de la solución), tres pistas (plan; piezas con ejemplo en `py(...)`; esqueleto con huecos `___`), y su `*.python.test.ts` con soluciones alternativas, errores típicos y la comprobación de las pistas (`hintBlocks`, `fillSkeleton`, `defineHintTests` de `tests/content/python-helpers.ts`). En el Pyodide del juego hay NumPy y matplotlib.

Para probar NumPy antes de escribir: `node docs/handoffs/2026-11-02-orbita-3-matrices/pyrun.mjs <guion.py>` desde la raíz del worktree, con el guion fuera del repositorio (en tu carpeta de `/home/olive/.claude/jobs/fe55296f/tmp/`).

## Calentamiento

Cada proyecto lleva `warmup` en `<proyecto>.calentamiento.ts`, **1 o 2 fichas** (no más: menos tedio), con lo nuevo de Python o NumPy de su «Programar» y su reto «Ahora tú» con datos propios. Lo recorren solas `tests/content/warmup*.test.ts`.

## Modelos que copiar

El proyecto más reciente y completo es `src/games/matrices/svd.ts`, con `svd.test.ts`, `svd.python.test.ts`, `svd.calentamiento.ts` y `examen-3-svd.ts`. Para las pistas: `src/games/vectores/analogias.python.test.ts`. Para un despegue: `src/games/matrices/despegue.ts`, `despegue.test.ts` y `despegue.python.test.ts`. El plano de curvas, sus campos y sus reglas: los comentarios de `graphSpecSchema` y `curvaQSchema` en `src/content/schema.ts`, y `src/content/curva.test.ts`.

## Ver lo que escribes

Otro agente construye en paralelo `src/ui/CurvePlane.tsx`. Si ya existe cuando acabes, abre tus preguntas con `npm run dev` y `?abierto` y saca capturas a 390 px (ver `brief-comun.md`): que la curva se vea entera, que el punto no quede tapado y que el enunciado case con lo que se ve. Si aún no existe, dilo en el informe.
