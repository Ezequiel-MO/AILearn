# Plan del resto de la ruta: juegos 3 a 9

Los nombres de juegos, órbitas y proyectos son los de `src/games/roadmap.ts` (lo comprueba `tests/content/roadmap.test.ts`). Cada proyecto sigue `guia-contenido.md`: «Manipular» son cinco preguntas `laboratorio` con una historia; «Calcular», cinco pasos reales de la máquina, al menos tres con `lab`; «Programar», la pieza en NumPy, de la mano. Para cada proyecto se da: **Lab** (qué laboratorio y qué escenario), **Se descubre** (las sorpresas que deben salir de las cinco preguntas), **Cálculo** y **Código**. Quien encarga un proyecto convierte «Se descubre» en cinco metas comprobadas con `labMeasure`.

Cada juego se construye así: (1) sus laboratorios (encargo, cableado, mirarlos), (2) `datos.ts` y un proyecto ejemplar, (3) el resto de proyectos de cuatro en cuatro, (4) despegue, bancos de examen y montaje (`index.ts`, `src/games/index.ts`, `GameGlyph` en `src/ui/MapGlyphs.tsx`, `games.test.ts`, fichas de `src/games/network.ts`, README y CLAUDE.md), (5) `npm test`, `build`, `e2e`, capturas y commit. Un juego es una sesión (o dos): al acabar cada uno, traspaso.

Bancos de examen de los juegos nuevos: entradas fijas (una `laboratorio`, dos de cálculo y una de código por proyecto), sin generadores nuevos (los ids de generador son globales y llevan tablas a mano); se añaden solo si un examen sale repetitivo.

## Juego 3 «Derivadas y gradiente»

Hilo: un modelo se equivoca menos moviendo sus pesos cuesta abajo. Laboratorios: `curva` (ya existe, plano de curvas con panel de datos), `descenso`, `ajuste`, `grafo`.

**Órbita 0 «La pendiente»** (construida): repasar con la guía nueva `derivada-pendiente` y `reglas-derivacion`: hoy varias preguntas son polinomios rotulados «pérdida» sin modelo detrás. Pasar sus `curva` a curvas `mse` con panel `fit` (el patrón de `minimos.ex00.1`), y sus cálculos a pasos de un entrenamiento (cuánto cambia la pérdida si w sube 0,1).

**Órbita 1 «Bajar la colina»**
- *Derivadas parciales*. Lab: `descenso` con `regression`, sin pasos (0 pasos) y el punto movible: el mapa de la pérdida de una recta con dos pesos y sus datos al lado. Se descubre: mover solo w o solo b corta el paisaje en dos curvas; en el fondo las dos pendientes valen 0; un dato nuevo mueve el fondo. Cálculo: ∂L/∂w y ∂L/∂b de un ejemplo concreto (error × entrada, error × 1). Código: las dos parciales con NumPy sobre un lote.
- *El gradiente*. Lab: `descenso` con 1 paso y la flecha del gradiente a la vista. Se descubre: el gradiente apunta cuesta arriba y es perpendicular a la curva de nivel; su longitud dice lo empinado; el paso va en contra. Cálculo: gradiente en un punto, la nueva posición tras un paso con tasa 0,1. Código: función `gradiente(w, b, X, y)`.
- *Descenso de gradiente*. Lab: `descenso` completo (tasa y pasos movibles) sobre regresión. Se descubre: tasa pequeña no llega; tasa grande rebota; aún mayor, diverge; el valle estrecho zigzaguea; con minilotes el camino tiembla pero llega. Cálculo: pérdida tras dos pasos a mano; la mayor tasa que no diverge en una parábola (2/a). Código: el bucle de entrenamiento entero de una regresión.

**Órbita 2 «La cadena»**
- *Regla de la cadena*. Lab: `grafo` con una cadena de tres operaciones y `nudge`. Se descubre: empujar la entrada mueve la salida el producto de las derivadas locales; una derivada local 0 (ReLU apagada) corta el paso. Cálculo: derivada de (wx + b)² por pasos. Código: derivada numérica frente a la de la cadena.
- *Grafos de cómputo*. Lab: `grafo` de una neurona con su pérdida (x, w, b, suma, activación, error²). Se descubre: hacia delante valores, hacia atrás gradientes; un nodo que alimenta dos caminos suma sus gradientes. Cálculo: rellenar los valores hacia delante y un gradiente hacia atrás. Código: evaluar el grafo con un diccionario en orden topológico.
- *Backpropagation a mano*. Lab: `grafo` de una red 2-2-1 con pesos movibles. Se descubre: el peso con más gradiente es el que más baja la pérdida si lo mueves; tras moverlo, la culpa se reparte de otro modo; el gradiente de la primera capa pasa por la segunda. Cálculo: un paso completo de actualización de un peso. Código: backprop de una red de dos capas en NumPy, comprobada con diferencias finitas.

**Órbita 3 «Gradientes con matrices»**
- *Gradiente de una capa*. Lab: `capa` con dianas más una lectura nueva del gradiente (o `grafo` con nodos matriciales): la corrección de W es error × entradaᵀ. Se descubre: el gradiente de una capa es un producto exterior (de rango 1 por ejemplo: enlaza con LoRA). Cálculo: ∂L/∂W de un ejemplo 2×2; su forma para una capa 768 → 3072. Código: `dW = X.T @ dY / n`.
- *Activaciones*. Lab: `grafo` o `curva` con la activación elegible y su derivada dibujada. Se descubre: la sigmoide se satura (derivada casi 0 en los extremos); ReLU deja pasar 1 o 0; sin activación la red es una sola capa. Cálculo: derivada de sigmoide y ReLU en puntos concretos. Código: activaciones y sus derivadas vectorizadas.
- *Gradientes que se desvanecen*. Lab: `grafo` con una cadena de 6 a 8 capas y `bars`. Se descubre: con sigmoides el gradiente se divide por 4 o más en cada capa; con ReLU y pesos bien escalados llega; una conexión residual abre un atajo (nodo suma). Cálculo: 0,25 elevado a 10; el producto de autovalores (enlaza con Autovectores). Código: medir la norma del gradiente capa a capa en una red profunda.

## Juego 4 «Probabilidad y siguiente token»

Hilo: un modelo de lenguaje reparte probabilidad entre las palabras posibles y elige. Laboratorios: `distribucion`, `muestra`.

**Despegue**: `muestra` con una moneda y un dado (frecuencias que se estabilizan) y `distribucion` con «El gato se sentó en la ___».

**Órbita 0 «Azar»**
- *Sucesos y probabilidad*. Lab: `muestra` (dado, bolsa de tokens). Se descubre: la frecuencia se acerca a la probabilidad al crecer n y con n pequeño engaña. Cálculo: probabilidades de sucesos sobre un vocabulario de juguete. Código: simular con `rng` y contar.
- *Probabilidad condicionada*. Lab: `distribucion` con contexto cambiable (un mando elige la palabra anterior): la tabla de bigramas de un corpus diminuto. Se descubre: la siguiente palabra depende de la anterior; Bayes le da la vuelta (dado «ladra», ¿era perro?). Cálculo: P(siguiente | anterior) desde recuentos; un Bayes con un filtro de spam. Código: la tabla de bigramas de un texto.
- *Distribuciones*. Lab: `distribucion` con muestreo. Se descubre: muestrear muchas veces reproduce las barras; la media y la varianza de una distribución; generar texto es muestrear una y otra vez. Cálculo: esperanza del número de tokens; probabilidad de una frase como producto. Código: generar frases con el modelo de bigramas.

**Órbita 1 «Softmax»**
- *Logits*. Lab: `distribucion` con logits movibles. Se descubre: solo importan las diferencias entre logits (sumar una constante no cambia nada); cada +1 multiplica la probabilidad relativa por e. Cálculo: razón de probabilidades de dos logits. Código: logits de una capa de salida (W·h).
- *Softmax*. Lab: `distribucion`. Se descubre: las probabilidades suman 1; subir un logit baja a los demás; el mayor logit no se lo lleva todo. Cálculo: softmax de tres logits; qué logit hace falta para un 90 %. Código: softmax estable (restar el máximo).
- *Temperatura y muestreo*. Lab: `distribucion` con temperatura, top-k y top-p y muestreo. Se descubre: T baja afila hasta el argmax, T alta aplana; top-k corta una cola fija y top-p una cola que depende de lo seguro que esté el modelo; con T = 0 siempre sale lo mismo. Cálculo: probabilidad tras T = 2; qué tokens sobreviven a top-p 0,9. Código: muestreo con temperatura y top-p.

**Órbita 2 «Sorpresa»**
- *Información*. Lab: `distribucion` con `truth`. Se descubre: acertar algo improbable da más bits; la sorpresa de p = 0,5 es 1 bit. Cálculo: −log₂ p de varios tokens. Código: sorpresa de cada token de una frase.
- *Entropía*. Lab: `distribucion` con logits movibles y medidor de entropía. Se descubre: máxima con todo igual (log₂ n), 0 con una sola opción; la temperatura la sube. Cálculo: entropía de distribuciones de 2 y 4 tokens. Código: entropía con máscara para los ceros.
- *Entropía cruzada*. Lab: `distribucion` con `truth` y logits movibles (el jugador hace de optimizador). Se descubre: la pérdida solo mira la probabilidad dada al token correcto; equivocarse con seguridad cuesta muchísimo; el gradiente es «probabilidades menos uno en el correcto». Cálculo: pérdida de un ejemplo y de un lote; pérdida de un modelo que adivina al azar entre 50 000 tokens (15,6 bits). Código: entropía cruzada desde logits.

**Órbita 3 «Comparar distribuciones»**
- *Divergencia KL*. Lab: `distribucion` con `target`. Se descubre: 0 solo si coinciden; no es simétrica; dar probabilidad 0 a algo que ocurre cuesta infinito. Cálculo: KL de dos distribuciones de tres tokens. Código: KL estable.
- *Máxima verosimilitud*. Lab: `distribucion` con una muestra fija y logits movibles: maximizar la probabilidad de lo observado. Se descubre: la mejor distribución es la de las frecuencias; minimizar entropía cruzada es lo mismo. Cálculo: verosimilitud y log-verosimilitud de una muestra. Código: ajustar por descenso los logits a unos recuentos.
- *Perplejidad*. Lab: `distribucion` con una frase paso a paso (un mando recorre las posiciones). Se descubre: perplejidad = 2 elevado a la pérdida media = «entre cuántas opciones duda»; un token muy mal predicho la dispara. Cálculo: perplejidad de una frase de cuatro tokens. Código: perplejidad de un texto con el modelo de bigramas.

## Juego 5 «Estadística y evaluación»

Hilo: un modelo no se juzga por un ejemplo. Laboratorios: `muestra`, `comparar`, `umbral`, `ajuste` (correlación).

**Órbita 0 «Describir datos»**: *Media y varianza* (`muestra` con valores: latencias de un modelo; un atípico arrastra la media y no la mediana), *La normal* (`muestra` con campana ajustable; puntuación z; el 68-95-99,7), *Correlación* (`ajuste` con recta: correlación frente a pendiente; correlación 0 con dependencia clara; normalizar activaciones, la idea de LayerNorm: media 0 y varianza 1).

**Órbita 1 «Muestras»**: *Ley de los grandes números* (`muestra` bernoulli: la exactitud medida con 20 ejemplos baila; con 2000, no), *Teorema central del límite* (`muestra` con `repeat`: medias de cualquier población forman campana; su anchura cae con √n), *Intervalos de confianza* (`muestra` con `ci`: cuántos ejemplos hacen falta para ±2 puntos; 95 de cada 100 intervalos contienen la verdad).

**Órbita 2 «Medir un clasificador»**: *Matriz de confusión* (`umbral`: cuatro casillas; exactitud engañosa con clases desbalanceadas), *Precisión y exhaustividad* (`umbral`: tirar una de la otra; F1; un filtro de spam frente a un detector de fraude piden cosas distintas), *Umbrales y ROC* (`umbral` con costes: elegir el umbral que minimiza el coste; AUC).

**Órbita 3 «¿Es mejor de verdad?»**: *Contraste de hipótesis* (`comparar`: ¿la diferencia de 2 puntos es ruido?; valor p como «cuántas veces saldría por azar»), *Comparar dos modelos* (`comparar` con bootstrap y prueba pareada: mismo banco, mismas preguntas), *Trampas de la evaluación* (laboratorio de un banco contaminado: ejemplos vistos en el entrenamiento que inflan la nota; LLM como juez con sesgo; se puede hacer con `umbral` y `muestra`).

## Juego 6 «Optimización»

Hilo: entrenar es optimizar una pérdida con millones de parámetros. Laboratorios: `descenso` (todas sus variantes) y `ajuste` (polinomio, validación).

**Órbita 0 «El paisaje»**: *Convexidad* (`descenso` con cuenco frente a `wells`: en un cuenco todo camino llega), *Mínimos locales y puntos de silla* (`descenso` con `wells` y con silla: el inicio decide; en la silla el descenso se frena sin estar en un mínimo), *Tasa de aprendizaje* (`descenso` en valle estrecho: la tasa máxima la fija la dirección más empinada; condicionamiento).

**Órbita 1 «Por lotes»**: *Descenso estocástico* (`descenso` con `batch` 1: ruidoso pero barato), *Minilotes* (tamaño de lote movible: menos ruido, más coste por paso), *Ruido y convergencia* (el ruido saca de un mínimo local poco hondo; bajar la tasa al final asienta).

**Órbita 2 «Con inercia»**: *Momentum* (valle estrecho: el zigzag se cancela y la bajada se acumula), *RMSProp* (paso propio por parámetro), *Adam* (los dos a la vez; por qué es el de por defecto).

**Órbita 3 «Generalizar»**: *Sobreajuste* (`ajuste` polinomio: grado alto, error de entrenamiento 0 y validación disparada), *Regularización* (`ajuste` con L2: los coeficientes encogen y la validación mejora), *Calendarios de aprendizaje* (`descenso` con tasa que calienta y decae; leer curvas de entrenamiento y parar a tiempo).

## Juego 7 «Redes neuronales desde cero»

Hilo: construir un MLP con NumPy y entender cada pieza. Laboratorios: `red`, `pixeles`, `grafo`, `descenso`.

**Órbita 0 «La neurona»**: *Perceptrón* (`red` con una neurona: la recta que separa; pesos = dirección, sesgo = desplazamiento), *Activaciones* (`red` con activación elegible: de escalón a sigmoide, la frontera se vuelve gradual), *Frontera de decisión* (`red` con XOR: una neurona acierta como mucho 3 de 4).

**Órbita 1 «Capas»**: *Paso hacia delante* (`red` con dos ocultas: XOR resuelto con dos rectas y una combinación), *Inicializar pesos* (`red` con `train` y semillas: todo a 0 no aprende, simetría; demasiado grande satura), *Clasificar con softmax* (`red` más `distribucion`: tres clases, regiones de colores).

**Órbita 2 «Autograd»**: *Un valor con gradiente*, *Backprop automática*, *Entrenar el MLP* (`grafo` construido paso a paso; el código es un autograd mínimo al estilo de micrograd).

**Órbita 3 «Entrenar de verdad»**: *Clasificar dígitos* (`pixeles`: moldes por clase; un dígito propio dibujado; ejemplo adversario con tres píxeles), *Diagnosticar el entrenamiento* (curvas de pérdida de entrenamiento y validación: reconocer tasa alta, sobreajuste, no aprende), *Residuales y normalización* (`grafo` con atajo y con normalización: el gradiente llega; enlaza con el juego 3).

## Juego 8 «El transformer por dentro»

Hilo: de texto a números, atención, bloque, y un GPT pequeño. Laboratorios: `tokens`, `atencion`, `bloque`, `distribucion`.

**Órbita 0 «Tokens»**: *Caracteres y palabras* (`tokens` con 0 fusiones frente a palabras: vocabulario pequeño y secuencias largas, o al revés), *BPE* (`tokens`: fusionar el par más frecuente; una palabra rara se parte en trozos; por qué cuenta mal las letras), *Embeddings y posiciones* (`capa` o `atencion` con la tabla de embeddings: la misma palabra en dos posiciones; sumar la posición).

**Órbita 1 «Atención»**: *Consultas, claves y valores* (`atencion`), *Máscara causal* (`atencion` con mapa: triángulo), *Multicabeza* (dos `atencion` lado a lado, o un modo de dos cabezas: una mira a la sintaxis y otra al tema).

**Órbita 2 «El bloque»**: *Bloque transformer* (esquema con residuales: `grafo` o `bloque`), *Apilar bloques* (`bloque` con capas movibles), *Contar parámetros* (`bloque`: dónde viven los miles de millones; el MLP pesa el doble que la atención).

**Órbita 3 «Un GPT pequeño»**: *Entrenar con un texto* (`descenso` o curva de pérdida de un modelo de caracteres precalculada: de 4,2 a 1,5 bits), *Generar* (`distribucion` paso a paso con temperatura), *Coste del contexto* (`bloque`: rejilla n²; caché de claves y valores).

## Juego 9 «Ingeniería de sistemas con IA»

Hilo: de un modelo suelto a un producto. Laboratorios: `contexto`, `rag`, `umbral`, `agente`, `lora`, `distribucion`.

**Órbita 0 «Contexto y coste»**: *Ventana de contexto* (`contexto`: qué cabe y qué se cae), *Tokens y precio* (`contexto`: coste por petición y al mes; la salida cuesta más que la entrada), *Caché y latencia* (`contexto` con partes cacheadas: el prefijo estable abarata; tiempo hasta el primer token).

**Órbita 1 «RAG completo»**: *Trocear documentos* (`rag` troceado: trozos demasiado grandes diluyen, demasiado pequeños parten la respuesta; solape), *Recuperar y reordenar* (`rag`: top-k, umbral, reordenador), *Evaluar un RAG* (`rag` y `umbral`: exhaustividad a k, MRR, respuestas sin respaldo).

**Órbita 2 «Agentes»**: *Llamar herramientas* (esquema de una llamada: el modelo emite una petición estructurada y recibe el resultado), *El bucle del agente* (`agente`: 0,95 elevado a 20 es 0,36; verificar entre pasos), *Fallos y seguridad* (inyección de prompts: texto de una herramienta que el modelo toma por instrucción; permisos mínimos).

**Órbita 3 «Adaptar el modelo»**: *Prompt, RAG o fine-tuning* (decisión con costes: `contexto`), *LoRA en la práctica* (`lora` con contador: rango, memoria, fusionar adaptadores), *Alineamiento y preferencias* (`distribucion` con `target`: subir la respuesta preferida sin alejarse del modelo original: penalización KL; RLHF y DPO a vista de pájaro).

## Juego 1 «Vectores y embeddings»

Oliver pidió mejorar «de Matrices en adelante»: el juego 1 no entra en este arco. Queda en la lista: sus «Manipular» tienen el mismo problema (salvo la Órbita 3, con palabras) y `tests/content/purpose.test.ts` aún lo tiene en `PENDING` hasta Analogías. El laboratorio `capa` con `movable: 'none'` y `probe`/`pair` ya sirve para rehacerlo con palabras.
