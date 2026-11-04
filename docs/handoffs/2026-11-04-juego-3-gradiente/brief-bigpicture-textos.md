# Encargo: «Dónde encaja en la red» para los juegos 1 y 2

Lee antes `brief-comun.md` (misma carpeta). Otro agente construye en paralelo la tarjeta que enseña estos textos (`src/ui/BigPicture.tsx`) y la página `#/red`; otro registra el juego 3 con su despegue y su propio `bigPicture`.

## Qué hacer

1. Añade `bigPicture: { parts, text }` (`bigPictureSchema` de `src/content/schema.ts`) a **cada proyecto** de los juegos `vectores` (12) y `matrices` (12), y al **objeto `Game`** de cada uno (`src/games/vectores/index.ts`, `src/games/matrices/index.ts`). `parts`: de 1 a 4 ids de `NETWORK_PARTS`, de la pieza más directa a la menos; lee las fichas de `src/games/network.ts` para elegirlas bien. Para saber qué enseña cada proyecto, lee su `sub`, sus enunciados y sus `purpose` (no hace falta leerlo entero).
2. Crea **`tests/content/big-picture.test.ts`**, que recorre el registro `games`:
   - todo juego registrado y todo proyecto tienen `bigPicture` (sin lista de pendientes: si el juego 3 aún no lo tiene cuando lo ejecutes, es que su agente no ha llegado; dilo en el informe);
   - las claves de `network` son exactamente `NETWORK_PARTS`; cada pieza de `NETWORK_GROUPS` sale una sola vez y entre todos los grupos están las 13;
   - cada `{ game, orbit }` de las fichas existe en `src/games/roadmap.ts`;
   - cada `text` mide de 120 a 480 caracteres y no se repite entre proyectos;
   - las reglas de prosa que tengan sentido para un texto suelto (fórmulas con `$` emparejados que pasan KaTeX estricto, sin punto decimal en prosa, coma decimal con `{,}` en fórmula, pares con decimales separados por «; », nada «que ya conoces» de otro proyecto) sobre los `text` y sobre `short` y `detail` de las fichas. Hoy esas reglas viven en `tests/content/prose-helpers.ts` atadas a preguntas: exporta desde allí un ayudante para textos sueltos que reutilice la misma lógica, sin cambiar lo que ya comprueba.

## Cómo escribir cada texto

- **De dos a cuatro frases, de 120 a 480 caracteres.** Oliver lo lee antes de cada proyecto: corto y con una idea.
- Primera frase: **qué hace esa pieza dentro de la red**, en concreto. Segunda: **el puente** con lo que se practica en el proyecto («Lo que aquí haces con dos dimensiones es…»). Una tercera, si cabe: qué decisión o qué intuición le da eso a quien construye un sistema.
- Solo datos verificables y conocidos (el GPT-2 pequeño: embeddings de $768$ números, $12$ bloques, el MLP de cada bloque pasa de $768$ a $3072$ y vuelve, vocabulario de $50\,257$ tokens). Nada de cifras inventadas ni de «millones de veces por segundo».
- Castellano llano, sin jerga sin explicar; fórmulas solo si ayudan, entre `$...$`, con la coma decimal como `{,}`.
- Los textos de un mismo juego cuentan una historia: que, leídos en orden, se vea cómo el juego construye una pieza de la red.

Ejemplos del tono (puedes usarlos tal cual):

```ts
// matrices / columnas
bigPicture: {
  parts: ['linear'],
  text: 'Cada capa lineal de una red guarda una matriz de pesos $W$ y la aplica a todos los vectores que le llegan. Leer sus columnas como «adónde va cada eje» es leer qué hace la capa. En el GPT-2 pequeño, la primera capa del MLP de cada bloque es una matriz de $3072\\times 768$; aquí la ves en $2\\times 2$, donde cabe en un dibujo.',
},

// vectores / coseno
bigPicture: {
  parts: ['search', 'attention'],
  text: 'Para buscar los documentos que responden a una pregunta, un sistema RAG compara sus embeddings con el coseno: cuanto más cerca de $1$, más se parecen. La atención hace una cuenta hermana, el producto escalar $q\\cdot k$, para decidir cuánto mira un token a otro. El ángulo que mides aquí entre dos flechas es esa misma medida de parecido.',
},
```

Y uno de juego (`Game.bigPicture`, el que se ve en el mapa): dice qué pieza o piezas de la red construye el juego entero y por qué va en ese lugar de la ruta.

## Ficheros

Tuyos: los 24 ficheros de proyecto y los dos `index.ts` de `src/games/vectores/` y `src/games/matrices/` (solo añades el campo `bigPicture`), `tests/content/big-picture.test.ts` y `tests/content/prose-helpers.ts` (solo el ayudante nuevo). No toques `src/games/network.ts` (si un texto suyo no pasa las reglas de prosa, dilo en el informe y deja esa prueba fallando).

## Hecho cuando

`npm run check` limpio; `npx vitest run tests/content src/games` en verde salvo, si aún no ha llegado, la falta de `bigPicture` del juego 3; commit de tus ficheros; informe según `brief-comun.md`.
