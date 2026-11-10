# Catálogo de laboratorios

Un laboratorio es una escena con datos de un sistema de IA a la vista, mandos y la consecuencia medida en vivo (ver `brief-laboratorio-comun.md`). La referencia de cada laboratorio ya construido es la cabecera de su modelo, `src/engine/labs/<kind>.ts` (mandos y métricas), y sus muestras, `src/ui/dev/labs/<kind>.ts`, que se ven en `#/dev/labs` con `npx vite --port <libre>`.

Para encargar uno: «Construye el laboratorio `<kind>`. Lee `docs/handoffs/2026-11-10-laboratorios-y-ruta/brief-laboratorio-comun.md` y síguelo» + la ficha de abajo. Después, la sesión principal lo **cablea** (seis ediciones de una línea):

1. `src/engine/labs/index.ts`: el tipo en `LabSpec` y el modelo en `MODELS`.
2. `src/content/labs.ts`: su esquema en `labSpecSchema` (una `z.discriminatedUnion('kind', [...])` en cuanto haya dos).
3. `src/ui/labs/Lab.tsx`: su `case` en el `switch`.
4. `src/ui/strings.ts`: `t.labs.<kind>: <kind>Strings`.
5. `src/ui/dev/LabsDev.tsx`: sus muestras en `samples`.
6. `src/ui/labs/labs.test.tsx`: sus muestras en `samples` (ya con `QuestionView` y `checkLab`), y quitar de sus ficheros el `as unknown as LabQ['lab']`.

Y lo **mira**: capturas de `#/dev/labs` a 1100 y a 390 px (`tmp/labshot.mjs` de la sesión del 2026-11-10 es un guion de Playwright de 25 líneas: abre la página y saca una imagen por `data-testid`). Un laboratorio no se da por bueno sin verlo.

## Construidos

| kind | Qué enseña | Estado |
| --- | --- | --- |
| `capa` | Una nube de palabras pasa por una capa lineal (matriz 2×2 con columnas arrastrables): neurona siguiente que clasifica, dianas, capa previa fija, dirección v con proyecciones, iterar A, circunferencia y elipse | Cableado, visto, commit 34fde58 |
| `atencion` | Consulta, claves y valores: pesos de atención de un token sobre una frase, temperatura, máscara causal, mapa n×n | Encargado el 2026-11-10 (ver el traspaso para su estado) |
| `compresion` | SVD de una imagen o tabla de pesos: suma de capas de rango 1, error frente a almacenamiento | Encargado el 2026-11-10 |
| `lora` | W congelada + B·A: todas las palabras se mueven en la dirección de B; contador de parámetros | Encargado el 2026-11-10 |
| `descenso` | Descenso de gradiente sobre un paisaje de dos parámetros: tasa, pasos, optimizadores, minilotes, regresión enlazada a sus datos | Encargado el 2026-11-10 |

## Por construir

Las fichas son el punto de partida del encargo: afínalas al encargar (nombres de campos, límites), manteniendo lo que debe VERSE.

### `grafo`: grafo de cómputo y retropropagación (juego 3, órbitas 2 y 3; juego 7, órbita «Autograd»)

- Enseña: una red es una cadena de operaciones pequeñas; hacia delante se calculan valores, hacia atrás cada arista multiplica por su derivada local y así cada peso recibe «su parte de culpa» del error.
- Especificación: `nodes: { id, op: 'input' | 'param' | 'const' | 'add' | 'sub' | 'mul' | 'square' | 'neg' | 'relu' | 'sigmoid' | 'tanh', label, inputs?: id[], value?: number, control?: { min, max, step } }[]` (hasta 14), `output: id` (la pérdida), `at?: Record<id, [columna, fila]>` (colocación; si falta, por profundidad), `phase?: 'forward' | 'backward' | 'toggle'` (con `toggle`, un interruptor `back`), `nudge?: { of: id; eps: { min, max, step, start } }` (empujar un nodo y ver cuánto cambia la salida frente a gradiente × empujón), `bars?: id[]` (barras con |gradiente| de esos nodos: capas de una cadena profunda), `readouts`.
- Mandos: uno por nodo con `control` (su id), `back`, `eps`.
- Métricas: `v_<id>` (valor), `g_<id>` (∂salida/∂nodo), `out`, `grad_max` (mayor |gradiente| entre los `param`), `grad_min`, `nudge_real` (cambio real de la salida), `nudge_pred` (gradiente × eps), `nudge_err`.
- Dibujo: cajas con el símbolo de la operación, aristas con flecha; encima de cada arista el valor que viaja hacia delante (color `--lab-t1`), debajo el gradiente que vuelve (color `--lab-t0`), con la derivada local escrita en pequeño; grosor de la arista de vuelta por |gradiente|; las barras de `bars` en el panel (se ve desvanecerse o explotar el gradiente capa a capa).
- Preguntas tipo: «baja la pérdida de 0,1 moviendo solo el peso con más gradiente»; «deja el gradiente de w₂ en 0»; con una cadena de 6 sigmoides, «consigue que a la primera capa le llegue un gradiente ≥ 0,01» cambiando la activación (mando de elección) o la escala de los pesos.

### `ajuste`: un modelo que se ajusta a datos (juegos 3, 5 y 6)

- Enseña: la pérdida es la media de los cuadrados de los errores; una recta con dos pesos; un polinomio con demasiada libertad se aprende el ruido (sobreajuste): el error de entrenamiento baja y el de validación sube; la regularización lo frena.
- Especificación: `data: { x, y, set?: 'train' | 'val' }[]`, `window`, `labels?: [x, y]`, `model: { kind: 'line'; w: rango; b: rango } | { kind: 'poly'; degree: número | rango; l2?: número | rango }` (el polinomio se ajusta por mínimos cuadrados con penalización L2, resolviendo las ecuaciones normales en el motor, grado ≤ 9), `squares?: true` (residuos como cuadrados, si no como segmentos).
- Mandos: `w`, `b` (recta); `degree`, `l2` (polinomio).
- Métricas: `loss` (error cuadrático medio de entrenamiento), `val` (de validación), `gap` (`val − loss`), `resid_max`, `w_norm` (norma de los coeficientes), `best_loss` (el del mejor ajuste de la recta, para metas «a menos de 0,1 del mejor»), `corr` (correlación de los datos).
- Dibujo: dispersión (entrenamiento relleno, validación hueco), la curva del modelo, los residuos; dos barras «error de entrenamiento / de validación»; con polinomio, una gráfica pequeña de los dos errores según el grado con el grado actual marcado (la U del sobreajuste).

### `distribucion`: de logits a la siguiente palabra (juego 4 entero; juego 8, «Generar»; juego 9, alineamiento)

- Enseña: un modelo de lenguaje da una puntuación (logit) por token; softmax las convierte en probabilidades; la temperatura las aplana o las afila; top-k y top-p recortan la cola; la sorpresa de la respuesta correcta es la pérdida (entropía cruzada); KL mide cuánto se aleja una distribución de otra.
- Especificación: `context?: string` («El gato se sentó en la ___»), `tokens: { id, text, logit }[]` (2 a 10), `movable?: id[]` (logits con mando `z_<id>`, de `limit` en pasos `step`), `temperature?: rango` (`temp`), `topk?: rango` (`k`), `topp?: rango` (`p`), `truth?: id` (el token correcto) o `target?: Record<id, número>` (distribución objetivo), `samples?: { n: número | rango; seed }` (muestreo determinista con `src/engine/rng.ts`: frecuencias sobre las barras).
- Métricas: `p_<id>`, `p_max`, `entropy` (bits), `perplexity` (2^entropía), `ce` (−log₂ p del correcto, o entropía cruzada con `target`), `kl` (KL(objetivo ‖ modelo), bits), `kept` (tokens que sobreviven al recorte), `mass` (probabilidad que conservan antes de renormalizar), `f_<id>` (frecuencia en la muestra), `tv` (distancia entre frecuencias y probabilidades).
- Dibujo: dos filas de barras enlazadas, logits (con signo) → probabilidades (con su %), el token correcto marcado, los recortados en gris; la muestra como puntos apilados sobre cada barra; un medidor de entropía («seguro ↔ dudoso»).

### `muestra`: muestras, medias e intervalos (juego 4, órbita 0; juego 5, órbitas 0, 1 y 3)

- Enseña: la media de una muestra baila alrededor de la verdadera y baila menos cuanto mayor es la muestra (√n); las medias de muchas muestras forman una campana; un intervalo de confianza dice cuánto fiarse de una evaluación con n ejemplos.
- Especificación: `population: { kind: 'bernoulli'; p } | { kind: 'normal'; mean; sd } | { kind: 'values'; values: number[] } | { kind: 'dice'; sides }`, `n: número | rango` (`n`), `seed` y `draws?: número` (mando `draw`: qué muestra de la serie se mira), `ci?: 0.9 | 0.95 | 0.99`, `repeat?: número` (repite el muestreo y dibuja el histograma de las medias), `normal?: { mean: rango; sd: rango }` (campana superpuesta con mandos `mu`, `sigma`), `mark?: número` (un valor para su puntuación z), `names?` (por ejemplo «acierto / fallo» de un modelo sobre un banco de pruebas).
- Métricas: `mean`, `sd`, `se`, `ci_low`, `ci_high`, `ci_width`, `covers` (1 si el intervalo contiene la media verdadera), `coverage` (fracción de los `repeat` intervalos que la contienen), `means_sd`, `z`, `fit_err` (distancia de la campana a los datos), `truth`.
- Dibujo: la muestra como puntos o histograma, la media verdadera y la de la muestra, el intervalo como barra; con `repeat`, el histograma de medias y una pila de intervalos (los que fallan, en `--lab-bad`).
- Un laboratorio hermano `comparar` (dos modelos sobre el mismo banco: diferencia de aciertos, bootstrap, valor p, prueba pareada) cubre la órbita «¿Es mejor de verdad?»; decide al encargarlo si es otro `kind` o un modo de este.

### `umbral`: medir un clasificador (juego 5, órbita 2; juego 9, «Evaluar un RAG»)

- Enseña: un clasificador da una puntuación y un umbral decide; mover el umbral cambia falsos positivos por falsos negativos; precisión y exhaustividad tiran en sentidos opuestos; la curva ROC es el recorrido de todos los umbrales.
- Especificación: `items: { id, score, positive: boolean, label?: string }[]` (hasta 40), `names: [negativo, positivo]` («correo normal», «spam»), `threshold: rango` (`t`), `costs?: { fp, fn }`.
- Métricas: `tp`, `fp`, `tn`, `fn`, `precision`, `recall`, `f1`, `accuracy`, `fpr`, `cost`, `auc`.
- Dibujo: el eje de puntuación con los ejemplos apilados (color por clase verdadera, forma por acierto o fallo), el umbral como línea arrastrable; la matriz de confusión 2×2 con sus recuentos; la curva ROC con el punto actual; barras de precisión y exhaustividad.

### `red`: una neurona, una capa oculta, una frontera (juego 7, órbitas 0, 1 y 3)

- Enseña: una neurona es una recta que parte el plano; no puede resolver XOR; dos neuronas ocultas dibujan dos rectas y la de salida las combina; entrenar mueve esas rectas solo.
- Especificación: `points: { x, y, group: 0 | 1, label? }[]`, `window`, `hidden: 0 | 1 | 2 | 3 | 4` (0: una sola neurona), cada unidad con mandos `a<k>` (ángulo de su recta) y `o<k>` (desplazamiento), o fija; `activation: 'step' | 'sigmoid' | 'relu' | 'tanh'` o lista elegible (`act`); `combine: 'and' | 'or' | 'sum'` o pesos de salida con mando; `train?: { rate, seed, epochs: rango }` (mando `epochs`: descenso determinista desde una inicialización con semilla; se ve la curva de pérdida).
- Métricas: `acc`, `hits`, `loss`, `margin`, `epochs`.
- Dibujo: el plano con los puntos, las regiones de decisión sombreadas (rejilla de unas 40×40 celdas coloreadas por la salida), la recta de cada unidad con su lado positivo; el esquema de la red con sus pesos; la curva de pérdida si hay `train`.

### `pixeles`: un clasificador de dígitos por dentro (juego 7, órbita 3 y despegue)

- Enseña: una imagen es una lista de números; un clasificador lineal tiene un «molde» de pesos por clase y puntúa cuánto se parece la imagen a cada molde; pocos píxeles bien elegidos cambian la respuesta (ejemplo adversario).
- Especificación: `size: [filas, columnas]` (hasta 8×8), `start: number[][]` (0 o 1), `classes: { name, weights: number[][] }[]`, `editable?: boolean` (mandos `p_<f>_<c>`), `show?: índice de clase` (su molde como mapa rojo y azul).
- Métricas: `score_<k>`, `prob_<k>`, `top`, `p_top`, `changed` (píxeles distintos del inicio), `on`.
- Dibujo: la rejilla de píxeles (clic o teclado), las barras de puntuación por clase, el molde de la clase elegida y la contribución de cada píxel.

### `tokens`: trocear texto con BPE (juego 8, órbita 0)

- Enseña: un LLM no ve letras ni palabras sino trozos frecuentes; BPE fusiona una y otra vez el par más frecuente; una palabra rara se parte en muchos trozos, y por eso el modelo «cuenta mal las letras».
- Especificación: `corpus: string` (el texto del que se aprenden las fusiones), `text?: string` (el texto que se trocea; por defecto el corpus), `merges: número | rango` (`m`).
- Métricas: `tokens` (cuántos quedan), `vocab` (tamaño del vocabulario), `chars`, `ratio` (caracteres por token), `next_count` (frecuencia del par que se fusionaría ahora).
- Dibujo: el texto como fichas de colores (un color por token), la tabla de pares con sus recuentos y el siguiente resaltado, la lista de fusiones aprendidas, barras «tokens» y «vocabulario».

### `bloque`: dónde están los parámetros de un transformer (juego 8, órbitas 2 y 3)

- Mandos: `d` (ancho), `layers`, `heads`, `vocab`, `ctx`. Métricas: `params_emb`, `params_attn`, `params_mlp`, `params_total`, `share_*`, `attn_cells` (ctx² por capa), `kv_cache`. Dibujo: el bloque con sus formas (d×d, d×4d…) y una barra apilada de dónde viven los parámetros; una rejilla ctx×ctx que crece al cuadrado.

### `contexto`: la ventana de contexto y su coste (juego 9, órbita 0)

- Especificación: `window`, `parts: { id, name, tokens: número | rango, cached?: boolean }[]`, `output: rango`, `price: { input, output, cached }` (por millón de tokens), `requests?: rango`. Métricas: `used`, `free`, `fits`, `cost`, `cost_total`, `cached_share`, `latency`. Dibujo: la ventana como barra apilada (lo que no cabe, en `--lab-bad`), y barras de coste con y sin caché.

### `rag`: recuperar y ordenar (juego 9, órbita 1)

- Especificación: `query`, `chunks: { id, text, score, relevant, rerank?: número }[]`, mandos `k`, `threshold` y `rerank` (interruptor); variante de troceado con mandos `size` y `overlap` sobre un documento con la respuesta marcada. Métricas: `recall`, `precision`, `mrr`, `tokens_used`, `answer_whole` (1 si la respuesta cabe entera en un trozo). Dibujo: la lista ordenada con barras de similitud, la línea de corte y las marcas de relevante; el documento como tira troceada.

### `agente`: un bucle de pasos que pueden fallar (juego 9, órbita 2)

- Mandos: `p` (acierto por paso), `n` (pasos), `retries`, `check` (verificación entre pasos). Métricas: `success` (p elevado a n, con reintentos), `cost`. Dibujo: la cadena de pasos sombreada por la probabilidad de seguir vivo y la curva éxito según pasos.
