# Encargo: la interfaz del plano de curvas y la pregunta `curva`

Lee antes `brief-comun.md` (misma carpeta). Trabajas en paralelo con otros tres agentes: uno hace el dibujo de la red (`NetworkDiagram`, `#/red`), otro escribe textos de contenido y otro el despegue del juego 3, que usará tu componente.

## Qué hay ya (no lo cambies)

- `src/engine/curves.ts`: `Curve` (`poly` por coeficientes; `mse`, la pérdida media de ŷ = w·x sobre unos datos), `curveAt`, `curveSlope` (exacta), `mseBest`, `measureCurve`.
- `src/content/schema.ts`: `graphSpecSchema` (ventana `x`, `y` con escalas propias, `snap`, `curve`, `points`, `readouts` de `coords | slope | secant | line`, `pair`, `labels`, `tangent`, `derivative`, `step`, `fit`) y `curvaQSchema`. Lee sus comentarios: dicen qué dibuja cada campo. Numero, vector y opcion llevan `graph` opcional como figura estática.
- `src/content/grade.ts`: `graphPositions(graph, moved)` da las posiciones [x, y] (un punto `onCurve` siempre en (x, f(x))) y `grade(q, { type: 'curva', points })`.
- Modelos: `src/ui/VectorPlane.tsx` (SVG propio, asas, teclado con `STEP_KEYS`, lecturas en un `<dl>`, accesibilidad) y `src/ui/questions/ManipularQuestion.tsx`.

## Qué construir

1. **`src/ui/CurvePlane.tsx`** (+ `CurvePlane.test.tsx`): `CurvePlane({ spec, positions, onMove? })`. Sin `onMove`, figura estática sin asas.
   - Ejes con escalas independientes para `spec.x` y `spec.y`, marcas con números «bonitos» (con coma decimal), rejilla tenue, nombres de los ejes (`spec.labels`, por defecto «x» e «y»).
   - La curva como polilínea muestreada (unos 200 puntos), recortada a la ventana (`clipPath`): una curva que se sale por arriba no debe pintar fuera.
   - `derivative`: f′ como segunda curva discontinua, con su nombre («f′», o «pendiente» si la curva es una pérdida). Es la idea «la pendiente de f se convierte en la altura de f′»: que se lea.
   - Puntos: un punto `onCurve` va en (x, f(x)); si es móvil se arrastra solo en horizontal (su altura la da la curva) y su x cae en múltiplos de `snap` dentro de la ventana. Un punto libre se arrastra en 2D con la misma rejilla. Teclado: flechas por `snap` (en uno `onCurve`, solo izquierda y derecha), como en `VectorPlane`. Etiqueta junto a cada punto.
   - Tangente en cada punto de la curva si `readouts` incluye `slope` o si `spec.tangent`: un segmento por el punto con pendiente f′(x), de largo fijo en pantalla (que se vea como tangente, no como recta infinita).
   - `secant`: la recta por los dos puntos de `pair`, prolongada a toda la ventana, en otro color que la tangente.
   - `line`: la recta por los dos puntos libres de `pair`, prolongada, con su **triángulo de avance y subida** (cateto horizontal «avance» Δx y vertical «subida» Δy, con sus valores). Es lo que enseña qué es una pendiente.
   - `step`: desde el punto `step.of`, una flecha hasta x − rate·f′(x) y un punto fantasma donde caería (sobre la curva), con el rótulo «un paso». Debe leerse que el paso va **cuesta abajo**.
   - `fit` (solo con curva `mse`): un **segundo panel** con los datos (xᵢ, yᵢ), la recta ŷ = w·x para la w actual del punto `fit.of` y, por cada dato, su error: el segmento vertical hasta la recta y el cuadrado de ese lado, con relleno tenue («la pérdida es la media de las áreas de estos cuadrados»). Este panel usa la **misma escala en los dos ejes**, para que los cuadrados sean cuadrados; su ventana sale de los datos (con margen, y que quepa la recta en todo w de la ventana o, si no, recortada). Al lado del plano de la pérdida en pantalla ancha y debajo en el móvil. Al arrastrar w, se mueven a la vez la recta, los cuadrados y el punto sobre la curva de la pérdida: esa simultaneidad es el corazón del juego.
   - Lecturas (`<dl>` como en `VectorPlane`, textos en `t.curve`): `coords` → cada punto, «P = (x; y)» con `fmtPair`; con curva `mse`, «w = …» y «pérdida = …» usando `labels`. `slope` → «pendiente en P». `secant` → «pendiente de la secante PQ». `line` → «pendiente» y «corta el eje y en». Valores no finitos con la raya de `fmt` y un texto como «sin pendiente» para la recta vertical.
   - Colores: tokens nuevos en `:root` de `theme.css` (curva, derivada, tangente, secante, paso, errores), en tu sección «=== Curvas ===». Legible a 390 px de ancho.
2. **`src/ui/questions/CurvaQuestion.tsx`**: como `ManipularQuestion`: `Purpose`, enunciado, `CurvePlane` con `graphPositions`, «Comprobar» con `grade(question, { type: 'curva', points })` y «Volver a empezar». Bloqueada (`locked`), la figura queda estática con lo que dejó el jugador. Añade el caso `'curva'` a `QuestionView.tsx` (hoy cae fuera del `switch` y no pinta nada).
3. **Figura estática en Calcular**: `Stem` (`src/ui/questions/parts.tsx`) acepta `graph` y pinta un `CurvePlane` estático; `NumeroQuestion`, `VectorQuestion` y `OpcionQuestion` le pasan `question.graph`.
4. Busca otros sitios que distingan tipos de pregunta en la interfaz (`ExerciseReview.tsx`, `labels.ts`, las rutas de desarrollo de `src/ui/dev/`) y añade `curva` donde haga falta. En `src/ui/dev/` añade ejemplos del plano de curvas (una parábola con tangente y derivada, una secante, una recta con su triángulo, una pérdida `mse` con `fit` y `step`), para verlo en `#/dev/...`.
5. Pruebas (Testing Library, como `VectorPlane.test.tsx` y `questions.test.tsx`): el punto `onCurve` se mueve con el teclado solo en x y su altura es f(x); el `snap` y los bordes de la ventana; las lecturas con coma decimal y «; »; la tangente, la secante y el triángulo se pintan cuando toca; el panel de ajuste pinta un error por dato y se actualiza al mover w; la figura estática no tiene asas; `CurvaQuestion` corrige bien una meta cumplida y una no cumplida.

## Ficheros

Tuyos: `src/ui/CurvePlane.tsx`, `src/ui/CurvePlane.test.tsx`, `src/ui/questions/CurvaQuestion.tsx`, `QuestionView.tsx`, `parts.tsx`, `NumeroQuestion.tsx`, `VectorQuestion.tsx`, `OpcionQuestion.tsx`, `questions.test.tsx`, lo que toques en `ExerciseReview.tsx`, `labels.ts` y `src/ui/dev/`. Compartidos (sin commit): `strings.ts` (grupo `t.curve`) y `theme.css` (sección «=== Curvas ===» y sus tokens).

## Hecho cuando

`npm run check` limpio; `npx vitest run src/ui` en verde; capturas a 390 y 1200 px de tus ejemplos de desarrollo miradas (la parábola con tangente y derivada, la recta con triángulo, la pérdida con su panel de ajuste y el paso); commit de tus ficheros; informe según `brief-comun.md`.
