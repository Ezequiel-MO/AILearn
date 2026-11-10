# Juego 2 «Matrices y transformaciones»: rediseño de «Manipular» y «Calcular»

Lee antes `guia-contenido.md` (las cinco reglas) y `laboratorios.md`. Se reescriben los ejercicios 0 («Manipular») y 1 («Calcular») de los 12 proyectos y las preguntas equivalentes del despegue. **No se tocan** «Programar», las hojas ni el calentamiento (salvo que nombren una pregunta que desaparece). Se conservan los ids de pregunta.

## La historia del juego

Una capa de una red es una matriz: **recoloca todos los embeddings a la vez para que la capa siguiente pueda hacer su trabajo**. La escena que vuelve una y otra vez es el laboratorio `capa`: una nube de palabras con dos rasgos legibles, la capa A (sus columnas se arrastran) y **lo que viene detrás**: una neurona que clasifica mirando la salida, unas dianas, una dirección sobre la que se proyecta. Mover una columna ya no es «poner î en (1, 0)»: es decidir adónde manda la capa un rasgo y ver qué le pasa a cada palabra y a la neurona.

## Datos (primer encargo: `src/games/matrices/datos.ts`)

Nubes con nombre, exportadas como constantes y reutilizadas. Coordenadas en múltiplos de 0,5, dentro de ±3 para que quepan transformadas en una ventana de ±4 a ±6. Comprueba cada una con `labMeasure`.

- `RESENAS` (ejes «intensidad», «tono»; grupos «negativa», «positiva»): genial (2,5; 2), bueno (1; 1), feliz (2; 1,5), horrible (2,5; −2), malo (1; −1), triste (1,5; −1,5). El rasgo que separa es el segundo.
- `CORREOS` (ejes «enlaces», «saludos»; grupos «normal», «spam»): seis correos que ningún rasgo separa por sí solo y sí la diferencia «enlaces − saludos».
- `ANIMALES` (ejes «tamaño», «domesticidad»; sin grupos o con «mascota», «salvaje»): gato, perro, hámster, lobo, tigre, oso; con parejas casi sinónimas (gato y perro cerca) para las preguntas de distancia.
- `NUBE_ALARGADA` (sin ejes con nombre; tres temas a lo largo de una diagonal): para covarianza y PCA; una variante `NUBE_CON_ATIPICO` y una `NUBE_CLASES_CRUZADAS` en la que la dirección de más varianza **no** separa los dos grupos.
- `FRASE_ANIMAL`: los tokens de «el animal no cruzó porque estaba cansado» con claves, valores y consultas para `atencion`.
- `DIGITO_8X8` y `PESOS_4X6` (rango 2) para `compresion`.

## Proyecto a proyecto

Cada línea de «Manipular» es una pregunta `laboratorio`: escenario → meta (métrica) → lo que se descubre. Son la guía; quien escribe ajusta números y comprueba `solved`. «Calcular»: cinco pasos reales, al menos tres con `lab`.

### Despegue (las preguntas manipular y de cálculo; ids `despegue.N`)

- M: `RESENAS` reducida a cuatro palabras; la neurona mira la salida 1 → `acc` = 100 %. Tu primera capa: mover una columna mueve todas las palabras a la vez.
- M: lo mismo, pero una capa que borra el tono → `merged` ≥ 2. Una capa puede destruir información.
- C: cuántos números tiene la matriz de una capa de 3 entradas y 2 salidas; la salida de una neurona para «genial» (producto escalar de su fila con la palabra).

### Columnas («adónde manda la capa cada rasgo»)

1. `RESENAS`, neurona w = (1, 0), b = 0 → `acc` = 100 %. Hay que llevar el tono a la primera salida: cada columna dice adónde va un rasgo.
2. Neurona con umbral, b = −3 → `acc` = 100 %. Hay que amplificar el tono: el tamaño de una columna es cuánto pesa su rasgo.
3. `CORREOS` → `acc` = 100 %. Ningún rasgo basta: la salida 1 tiene que ser una mezcla (enlaces − saludos). Una neurona lee una combinación de rasgos.
4. `RESENAS` con el eje «tono» cambiado por «negatividad» (signos invertidos) → `acc` = 100 %; el cuadrado unidad sale rojo y el determinante negativo: la capa ha dado la vuelta al plano y a la neurona le da igual.
5. Dos metas: `acc` = 100 % y `merged` ≤ 0 con `area` ≥ 1. Acertar sin aplastar: otra neurona puede necesitar lo que esta no mira.

C: leer los pesos de una capa dibujada (matriz 2×2, con `lab` fijo); parámetros de una capa 768 → 3072 con sesgo; salida de la neurona 1 para «feliz»; qué columna cambiar para que el tono cuente el doble (`opcion`); dimensión de salida de una capa 128×384.

### Matriz por vector («lo que le pasa a una palabra»)

1. Una palabra con diana → `on_target` ≥ 1 moviendo una columna. La salida es x₁·î + x₂·ĵ: la receta de la palabra.
2. Dos palabras, dos dianas → `on_target` ≥ 2. Con dos ejemplos la capa queda fijada: eso es «aprender una matriz».
3. Una palabra con diana y las dos columnas libres, segunda meta `acc` = 100 % sobre el resto. Muchas capas valen para un ejemplo; los demás datos deciden.
4. Alinear idiomas: las dianas de gato, perro y casa son las posiciones de «cat», «dog» y «house» (los mismos puntos girados y escalados) → `target_err` ≤ 0. Una sola matriz traduce un espacio de embeddings a otro (se hace de verdad).
5. `margin` ≥ 1: no basta con acertar, que acierte con holgura. Cuanto más lejos de la frontera, más segura la respuesta.

C: Wx + b con rasgos con nombre y qué clase gana (dos logits); la salida 2 como producto escalar de la fila 2; forma de la salida de un lote de 32 palabras de dimensión 384 por una capa 384 → 128; qué palabra de tres activa más una neurona dada (`opcion` con `lab`).

### Componer («dos capas seguidas»)

Todas con `before` (se ven los cuadraditos del paso intermedio).

1. La primera capa ya mezcla; construir la segunda → `acc` = 100 %. Cada capa prepara el trabajo de la siguiente.
2. Sin `before` y con dianas = donde dejan las palabras dos capas dadas (C·B·x) → `target_err` ≤ 0. Dos capas lineales seguidas son una sola: por eso hace falta algo no lineal entre ellas.
3. La primera capa aplasta (det 0) → `hits` ≥ 4 (el máximo posible con ese aplastamiento; dilo en el enunciado como reto: «¿cuántas puedes salvar?»). Lo que una capa destruye, la siguiente no lo recupera.
4. `det_total` entre 0,9 y 1,1 con una primera capa de determinante 4. Las áreas se multiplican: det(A·B) = det A · det B.
5. Mismo par de capas en el otro orden (dianas = B·A·x con `before` = A no vale: usa dianas calculadas) → `target_err` ≤ 0, con un enunciado que avisa de que el orden cambia el resultado.

C: formas y parámetros del bloque MLP de un transformer (768 → 3072 → 768); un producto 2×2 con significado («primero mezcla, luego amplifica»: qué peso final tiene el tono); por qué apilar capas lineales sin activación no añade nada (`opcion`); determinante de dos capas juntas.

### Determinante («cuánto espacio deja la capa»)

1. `area` ≥ 4 con `acc` = 100 %: separar más los datos es estirar el espacio.
2. `det` = 0 y `merged` ≥ 2: aplastar junta palabras; ya no hay forma de distinguirlas.
3. `det` = 0 **y** `acc` = 100 %: aplastar en la dirección que no importa. Así comprime bien un cuello de botella.
4. `det` < 0 (meta `det` ≤ −1) y `acc` = 100 %: la orientación cambia y nada se pierde. El signo no es información perdida.
5. Par de casi sinónimos: `pair_dist` ≤ 0,5 con `merged` ≤ 0 y `det` ≥ 0,1. Un determinante casi nulo no borra, pero deja las palabras casi encima: problemas numéricos (número de condición).

C: ¿pierde información esta capa? (determinante con rasgos con nombre, `opcion` con `lab`); por cuánto multiplica el área de una región de palabras; cuántas salidas distintas quedan de seis palabras con una capa dada (`lab` sin la lectura `merged`); determinante de dos capas.

### Inversa («deshacer una capa»)

Autoencoder: una capa fija codifica (`before`) y el jugador construye la que decodifica; dianas = las posiciones originales.

1. Codificador que escala → `target_err` ≤ 0.
2. Codificador que inclina (cizalla) → `target_err` ≤ 0.
3. Codificador que mezcla y gira → `target_err` ≤ 0.
4. Codificador que aplasta → `on_target` ≥ 2 (las que se pueden salvar) y el enunciado pregunta cuántas: no hay decodificador que recupere todo.
5. Codificador casi singular (det 0,25): la decodificadora necesita columnas enormes (ventana ±6) → `target_err` ≤ 0. Deshacer una capa que casi aplasta amplifica cualquier error.

C: qué palabra de entrada produjo esta salida (resolver un sistema 2×2 con significado, con `lab`); ¿tiene inversa? (`opcion`); deshacer una normalización (la inversa de escalar por 0,5); por qué en código se usa `solve` y no `inv` (`opcion`, enlaza con «Programar»).

### Rango («por cuántas dimensiones pasa la información»)

1. Capa de rango 1 (meta `det` = 0) con `acc` = 100 % en `RESENAS`: todo cae en una recta; hay que elegir cuál.
2. `pair_dist` = 0 para «genial» y «horrible» con `merged` ≤ 1: dos palabras se confunden si solo se diferencian en la dirección que la capa borra (el núcleo).
3. `before` de rango 1 → `hits` ≥ 4: tras un cuello de botella de una dimensión, el máximo es el que es.
4. Con dirección v sobre la salida (`probe`): `var_frac` ≥ 95 % con `det` = 0: una capa de rango 1 bien elegida conserva casi toda la variación.
5. `CORREOS`: `det` = 0 y `acc` = 100 %: el cuello de botella ideal es exactamente la combinación que la neurona necesita.

C: rango de una capa a la vista de su dibujo (`opcion` con `lab`); números que guarda una matriz 1000×1000 de rango 10 escrita como producto (20 000 frente a 1 000 000); dimensión de lo que se pierde; qué palabras se confundirán (`opcion` con `lab`).

### Autovectores («direcciones que la capa solo estira»)

Con `probe` e `iterate`.

1. Capa fija; mover v → `img_angle` ≤ 1°: la capa no gira esa dirección, solo la estira.
2. Red recurrente (la misma capa 5 veces): elegir v → `iter_norm` ≥ 8: sobre el autovector de autovalor mayor que 1, la señal explota.
3. Lo contrario → `iter_norm` ≤ 0,1: sobre el de autovalor menor que 1, se desvanece.
4. Columnas movibles, v fija: → `iter_norm` entre 0,9 y 1,1 tras 5 pasos y `det` ≥ 0,5: una capa que ni explota ni desvanece (autovalor 1 en esa dirección). Por eso se cuida la inicialización.
5. Cualquier v de partida: `iter_turn` ≤ 2° con 6 pasos partiendo de una v que no sea autovector (meta adicional `img_angle` ≥ 20°): el camino acaba alineado con la dirección dominante (iteración de potencias, PageRank).

C: autovalor de una dirección dada (cuánto estira, con `lab` sin `stretch`); tras 10 pasos con autovalor 1,1 y 0,9, por cuánto se multiplica (explotar y desvanecer con números); ¿es autovector? (`opcion` con `lab`); nada de polinomios característicos.

### Matrices simétricas («la forma de una nube»)

Con `NUBE_ALARGADA` y `probe` sobre la entrada (`on: 'input'`).

1. `var_frac` ≥ 90 %: la dirección en la que los datos más varían.
2. `var_frac` ≤ 10 %: la que menos; resulta perpendicular a la anterior.
3. La capa fija es la matriz de covarianza de la nube (con `circle`): mover v → `img_angle` ≤ 1° y `stretch` alto: los autovectores de la covarianza son los ejes de la nube y su autovalor es la varianza (`rayleigh`).
4. Columnas movibles: `cov_xy` entre −0,05 y 0,05 con `area` ≥ 0,5: una capa que deja las dos salidas sin relación (decorrelar, como se hace al normalizar datos).
5. `asym` ≤ 0 y `acc` = 100 % en `RESENAS`: una capa simétrica estira sobre ejes perpendiculares, sin girar; se ve en la elipse.

C: varianza de un rasgo y covarianza de dos a partir de cuatro palabras; qué significa una covarianza positiva (`opcion` con `lab`); varianza en una dirección a partir de la matriz de covarianza (una cuenta de dos líneas); por qué los ejes salen perpendiculares (`opcion`).

### PCA («ver cientos de dimensiones en un plano»)

1. `NUBE_ALARGADA`: `var_frac` ≥ 95 % (ahora con los puntos dibujados y sus proyecciones).
2. `lost` ≤ umbral: lo que se pierde al quedarse con una sola coordenada es la distancia a la recta.
3. `NUBE_CLASES_CRUZADAS`: `acc_v` = 100 % con `var_frac` ≤ 50 %: la dirección que separa las clases no es la de más varianza. PCA no sabe de etiquetas.
4. `NUBE_CON_ATIPICO`: `var_frac` ≥ 90 %: la dirección apunta al dato raro. Un valor atípico secuestra la primera componente.
5. Columnas movibles: `spread_x` ≥ 95 % de la varianza total (meta sobre `spread_y` ≤ umbral) y `cov_xy` ≈ 0: la capa que gira la nube hasta dejar la primera componente en la primera salida es lo que hace PCA.

C: parte de la varianza que explica la primera componente dados dos autovalores; coordenada de una palabra sobre la primera componente; cerca en el mapa 2D no implica cerca en 384 dimensiones (conservar la actual `pca.ex01.5`); cuántas componentes para el 90 % (lectura de una lista de autovalores).

### SVD («capas de más a menos importantes»)

1. `compresion` con `DIGITO_8X8`: `error` ≤ 25 % y `stored` ≤ (el de k = 2).
2. `PESOS_4X6` (con signo, rango 2): `error` ≤ 0 con `stored` ≤ 22.
3. Modo `pick`: `kept` ≥ 90 % con `k` ≤ 2: las capas importantes son las primeras.
4. `capa` con `circle` y `probe`: `stretch` ≥ (σ₁ − 0,1): la dirección que la capa más estira es el primer vector singular; la elipse lo enseña.
5. `compresion`, matriz ruidosa de rango 1 + ruido: `k` = 1 deja `error` ≤ 20 %: tirar las capas pequeñas quita ruido.

C: números guardados con rango k (k·(m + n + 1)); parte de la «energía» de los dos primeros valores singulares; rango de una matriz a partir de sus valores singulares; cuánto se ahorra en una matriz 4096×4096 con k = 64.

### Rango bajo y LoRA

1. `lora` con `RESENAS` y un modelo original que falla → `acc` = 100 % moviendo B y A.
2. Dianas de rango 1 → `target_err` ≤ 0; todas las flechas de desplazamiento salen paralelas a B.
3. Dianas que piden rango 2, en modo `lora` → `on_target` ≥ (lo máximo posible): una corrección de rango 1 no llega a todo.
4. Contador (d = k = 4096): `saving` ≤ 1 % moviendo r.
5. `acc` = 100 % con `delta_norm` ≤ umbral: afinar moviendo lo mínimo (no alejarse del modelo original).

C: parámetros de LoRA para d, k y r dados (conservar `rango-bajo.ex01.5`); porcentaje frente al ajuste completo; rango máximo de B·A; qué ocurre al empezar con B = 0 (`opcion`); memoria en MB de la corrección en float32.

### Atención como matriz

1. `atencion` con `FRASE_ANIMAL`: arrastrar la consulta de «estaba» → `w_animal` ≥ 70 %.
2. Temperatura → `entropy` ≤ 1 bit: atención afilada o repartida.
3. Máscara causal (interruptor) → `future` ≤ 0 y el peso de un token anterior ≥ 60 %: un modelo que genera no puede mirar lo que aún no ha escrito.
4. Mover la **clave** de un token (`movable: 'key'`) → que deje de llevarse la atención (`w_<id>` ≤ 10 %): la clave es lo que un token ofrece.
5. Con valores: `out_x` ≥ umbral: la salida es la mezcla de los valores con esos pesos; mirar a «animal» trae su información.

C: puntuación q·k de un par; peso tras softmax de tres puntuaciones (con `lab` sin esa lectura); celdas del mapa de atención con 1000 tokens y con 2000 (el coste crece con n²: conservar `atencion.ex01.4`); forma de Q·Kᵀ; cuántos pesos pone a 0 la máscara causal con n = 5.

## Orden de trabajo

1. `datos.ts` y el proyecto **Columnas** entero (ejercicios 0 y 1, su `columnas.test.ts`, su banco `examen-0-columnas.ts`), con capturas miradas: es el ejemplo resuelto que se da a los demás agentes. Hazlo en la sesión principal o con un `implementer` promovido a `opus` (`[opus: proyecto ejemplar]`).
2. Órbitas 0 a 2 (los otros 8 proyectos) y el despegue, de cuatro en cuatro agentes; cada uno solo toca `src/games/matrices/<proyecto>.ts`, `<proyecto>.test.ts` y `examen-N-<proyecto>.ts`. `orbita-2-planos.test.ts` afirma los planos viejos de la órbita 2: se retira o se reescribe con el último proyecto de esa órbita.
3. Órbita 3 cuando `atencion`, `compresion` y `lora` estén cableados y vistos.
4. Al final: `npx vitest run src/games/matrices tests/content`, `npm run check`, `npm run build`, `npm run e2e`, capturas de una pregunta por proyecto, y `tests/content/purpose.test.ts` sigue en verde.
