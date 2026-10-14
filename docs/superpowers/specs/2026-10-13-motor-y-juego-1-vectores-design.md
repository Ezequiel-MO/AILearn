# AIlearn: motor de la trayectoria y juego 1 «Vectores y embeddings»

Fecha: 2026-10-13. Estado: pendiente de revisión del propietario.

## 1. Propósito

AIlearn es una colección de juegos para aprender ingeniería de IA con la matemática como columna vertebral: cada juego enseña un bloque de matemáticas y lo aplica de inmediato a un tema de IA. El primer jugador es el propietario (52 años, matemáticas de primero de ingeniería, experiencia práctica desarrollando con IA un producto en producción). La meta a largo plazo es formar a otras personas hasta niveles altos, de forma divertida.

Los niveles tienen un despegue de entrada, órbitas con proyectos de tres ejercicios que se validan con nota 80 y un examen por órbita, con XP y nivel decimal.

Este documento cubre dos cosas:

1. El **motor común** de la trayectoria, escrito una sola vez (no se copia en cada juego).
2. El **juego 1**, «Vectores y embeddings».

### Qué dijo el propietario y qué se supone

Dicho por el propietario:

- La prioridad es comprender las matemáticas y cómo se aplican a cada tema.
- El juego 1 trata de vectores y embeddings y debe ser muy visual; usar librerías de Python para calcular y dibujar es deseable.
- Stack aprobado: web con TypeScript, React y Vite, y Python en el navegador con Pyodide.
- En el futuro puede convertirse en una plataforma para terceros.

Supuestos de este documento (corregir si no encajan):

- La interfaz y el contenido están en castellano.
- Hay un solo jugador y no hay cuentas.
- En parte de los ejercicios el jugador escribe Python (NumPy y matplotlib).
- La plataforma no se construye ahora; solo se evitan las decisiones que la cerrarían.

### Criterios de éxito de la primera entrega

- Con `npm run dev`, el propietario juega en el navegador el despegue y la Órbita 0 completos, incluido su examen, y el progreso sobrevive a recargar la página.
- `npm test` pasa, e incluye la comprobación de todo el contenido (sección 9).
- Añadir la Órbita 1 exige ficheros de contenido y, como mucho, una métrica nueva del plano de vectores. No exige tocar las reglas del motor.

## 2. Mapa de la trayectoria completa

Guía inicial; se ajustará al avanzar. Cada juego tendrá su propio ciclo de diseño, plan y construcción.

| # | Matemática | Aplicación en IA |
|---|---|---|
| 1 | Vectores, producto escalar, normas, proyecciones | Embeddings, similitud coseno, búsqueda semántica, RAG |
| 2 | Matrices, transformaciones lineales, rango, autovalores, SVD | Capas lineales, atención como producto de matrices, LoRA |
| 3 | Derivadas, gradiente, regla de la cadena | Función de pérdida, descenso de gradiente, backpropagation |
| 4 | Probabilidad, softmax, entropía, divergencia KL | Siguiente token, temperatura, entropía cruzada, perplejidad |
| 5 | Estadística e inferencia | Evaluación de modelos, intervalos de confianza |
| 6 | Optimización | SGD, momentum, Adam, regularización, sobreajuste |
| 7 | Redes neuronales desde cero en Python | MLP con NumPy, autograd propio |
| 8 | El transformer por dentro | Tokenización, atención multi-cabeza, un GPT pequeño |
| 9 | Ingeniería de sistemas con IA | RAG, coste y contexto, agentes, fine-tuning |

## 3. Alcance

### Primera entrega (el plan que sigue a este documento)

- Proyecto nuevo con el stack de la sección 4.
- Motor común completo (sección 5).
- Los seis tipos de pregunta (sección 6).
- Ejecución de Python en el navegador (sección 7).
- Persistencia local (sección 8).
- Contenido: Despegue y Órbita 0 del juego 1, con su «Caza el error» y su examen.

### Entregas posteriores del juego 1

Órbitas 1, 2 y 3, uno por entrega. Son sobre todo contenido. La Órbita 3 necesita además un conjunto de embeddings precalculados, que se decidirá en su propio diseño.

### Fuera de alcance

- Cuentas, sincronización en la nube y corrección en servidor.
- Despliegue público. El resultado es un sitio estático que se podrá publicar cuando se decida.
- PyTorch. No se necesita hasta los juegos 7 y 8.
- Repaso espaciado. Se guardan los datos que lo harán posible (sección 8), pero no se construye.
- Varios idiomas.

## 4. Stack

| Pieza | Elección | Motivo |
|---|---|---|
| Construcción | Vite | Sitio estático; gestiona Web Workers y WebAssembly |
| Lenguaje | TypeScript en modo estricto | La forma del contenido y del progreso se declara una vez |
| Interfaz | React | Componentes reutilizables entre juegos |
| Rutas | React Router con rutas hash | Funciona en cualquier alojamiento estático |
| Python | Pyodide en un Web Worker | NumPy y matplotlib sin servidor |
| Editor de código | CodeMirror 6 con modo Python | Ligero y sin dependencias de servidor |
| Fórmulas | KaTeX | Rápido y sin llamadas externas |
| Esquema del contenido | Zod | Un nivel mal escrito falla en las pruebas, no al jugar |
| Pruebas | Vitest; una prueba de humo con Playwright | Sección 9 |
| Calidad | ESLint y Prettier | Mantienen el código y el contenido legibles y con formato uniforme |

No se usa librería de estado global, ni librería de gráficos para el plano de vectores (es SVG propio), ni librería de internacionalización. Las versiones concretas las fija el plan tras comprobar las actuales.

Las tipografías se sirven desde el propio sitio. Pyodide y sus paquetes se cargan desde su CDN con la versión fijada; el navegador los guarda en caché. Consecuencia aceptada: la primera carga de Python necesita conexión.

## 5. Motor común

### Estructura del código

```
src/
  engine/     Reglas de la trayectoria. TypeScript puro, sin React ni DOM.
  content/    Esquema del contenido, validación y carga.
  python/     Worker de Pyodide y su interfaz.
  storage/    Interfaz de progreso y su implementación local.
  ui/         Componentes compartidos: mapa, panel de proyecto, marco de
              ejercicio, plano de vectores, editor, fórmula, gráfica.
  games/
    vectores/ Contenido del juego 1 y lo que sea solo suyo.
```

Reglas de dependencia: `engine` no importa nada del resto. `games/*` solo contiene datos y, si hace falta, componentes propios del juego. Ninguna regla de puntuación o desbloqueo vive fuera de `engine`.

### Jerarquía

Un juego tiene un despegue y una lista de órbitas. Una órbita tiene proyectos y un examen. Un proyecto tiene tres ejercicios (ex00, ex01, ex02) de cinco preguntas cada uno, y tres hojas de «Caza el error».

- **ex00, manipular.** El jugador mueve objetos y ve cambiar los números.
- **ex01, predecir y calcular.** Sin manipulable salvo que pida una pista.
- **ex02, programar.** El jugador lo escribe en Python y lo dibuja.

### Reglas

Son las reglas de la trayectoria, con una adaptación para el código.

- **Acierto a la primera.** Una pregunta cuenta si se acierta en la primera entrega y sin haber pedido pista.
- **Nota del proyecto.** `nota = round(100 × aciertos_a_la_primera / 15)`. Se conserva la mejor nota.
- **Validación.** Un proyecto queda validado con nota de 80 o más.
- **Segundo fallo.** El primer fallo muestra una explicación; el segundo muestra la solución completa.
- **Preguntas de código.** «Ejecutar» es libre e ilimitado y no cuenta como intento. Solo «Entregar» cuenta.
- **Despegue.** Se completa al terminarlo; no tiene nota. Sirve además de tutorial de los tipos de pregunta y de primera carga de Python.
- **Apertura de órbitas.** La Órbita 0 se abre al completar el despegue. La órbita `c` se abre cuando la órbita `c − 1` está abierta y su examen aprobado.
- **Proyectos.** Todos los proyectos de una órbita abierta están disponibles a la vez.
- **Examen.** Se abre cuando todos los proyectos de la órbita están validados. Son 6 preguntas sacadas del banco de la órbita, sin pistas y con un solo intento por pregunta. Se aprueba con 5. Se puede repetir con preguntas nuevas y un aprobado no se revoca. Al suspender, el panel nombra los proyectos que conviene repasar.
- **Caza el error.** Las hojas de un proyecto se abren al validarlo.
- **XP.** 50 por el despegue, la nota de cada proyecto validado, 50 por examen aprobado y 10 por hoja de «Caza el error» resuelta.
- **Nivel.** `nivel = XP / 150`, mostrado con dos decimales.

XP, nivel e insignias se calculan a partir del progreso guardado y no se almacenan.

El parámetro `?abierto` abre todo, también en producción (cambio del 2026-10-14: el sitio es de un solo jugador). Dura hasta recargar la página.

## 6. Contenido y tipos de pregunta

El contenido es **dato serializable**, no código: objetos sin funciones, validados con el esquema. Se escribe en ficheros TypeScript para tener tipos al editarlo. Así, más adelante, podrá venir de una base de datos o de un editor sin cambiar el motor.

Consecuencias de esa regla:

- Una pregunta con números variables nombra un **generador** registrado en el motor y le pasa parámetros y una semilla. El contenido no contiene la función.
- La meta de un ejercicio de manipular es una **condición declarativa** (métrica, vectores implicados, valor objetivo y tolerancia), no un predicado.
- La corrección de una pregunta de código es **texto Python** con comprobaciones.

Toda pregunta tiene identificador estable, enunciado (Markdown con fórmulas), pistas, explicación del primer fallo y solución.

| Tipo | El jugador | Se corrige |
|---|---|---|
| `manipular` | Arrastra vectores en el plano | Cumple la condición declarada, dentro de la tolerancia |
| `numero` | Escribe un número | Coincide dentro de la tolerancia declarada |
| `vector` | Escribe las componentes | Cada componente dentro de la tolerancia |
| `opcion` | Elige una respuesta | Coincide con la correcta |
| `codigo` | Escribe Python | Las comprobaciones pasan sobre su resultado |
| `revision` | Juzga una hoja resuelta y, si está mal, señala la línea | Veredicto y línea coinciden |

«Caza el error» usa el tipo `revision`. Cada hoja muestra un razonamiento o un fragmento de código ya resuelto, que puede estar bien o contener un fallo realista (olvidar normalizar, confundir producto escalar con coseno, un eje equivocado en NumPy). Hace de evaluación entre pares y entrena revisar código generado por una IA.

### El plano de vectores

Es el manipulable central del juego 1 y un componente compartido. Dibuja en SVG vectores en dos dimensiones, permite arrastrar los que el ejercicio marque como móviles y muestra en vivo las magnitudes que el ejercicio pida: componentes, norma, distancia, suma, y en órbitas posteriores ángulo, producto escalar, coseno y proyección. Se maneja también con teclado.

## 7. Python en el navegador

- Pyodide se ejecuta en un Web Worker y se carga la primera vez que un ejercicio lo necesita, con indicador de progreso.
- Cada ejecución usa un espacio de nombres nuevo, de modo que un ejercicio no hereda variables del anterior.
- Una ejecución que supere el tiempo límite termina el worker y lo recrea. Un bucle infinito del jugador no congela la página.
- La salida estándar, los errores (con su traza, recortada al código del jugador) y las figuras de matplotlib se devuelven a la interfaz. Las figuras se muestran junto al editor.
- **Corrección.** Tras el código del jugador se ejecutan las comprobaciones de la pregunta, que inspeccionan sus variables y funciones y, si hace falta, sus figuras. Se comprueban resultados, nunca el texto del código. Cada comprobación que falla da un mensaje pensado para orientar, no solo «incorrecto».
- El borrador de cada pregunta de código se guarda para no perderlo al recargar.

## 8. Persistencia

Una única puerta, la interfaz de progreso, con una implementación sobre `localStorage`. Ningún otro módulo toca el almacenamiento.

- Claves con espacio de nombres, versión, perfil y juego: `ailearn:v1:local:vectores`. El perfil es siempre `local` por ahora; existe en la clave para que las cuentas futuras no obliguen a migrar.
- Un solo esquema de progreso para todos los juegos, con número de versión y una función de migración entre versiones.
- El documento guarda dos cosas:
  - El **resumen**, que decide los desbloqueos: Despegue completado, mejor nota por proyecto, exámenes aprobados y hojas resueltas.
  - El **registro de intentos**, que solo crece: pregunta, fecha, si fue correcta, número de entregas y si hubo pista.
- En esta entrega nada lee el registro salvo una vista de estadísticas sencilla. Se guarda desde el primer día porque el repaso espaciado lo necesitará y no se puede reconstruir después.
- Los borradores de código van en una clave aparte.
- Un documento ilegible o de versión desconocida no borra nada: se aparta con otra clave y el jugador ve un aviso.

## 9. Pruebas

- **Motor.** Pruebas unitarias de cada regla de la sección 5: nota, validación, apertura de órbitas y de examen, examen aprobado y suspendido, XP y nivel.
- **Contenido, para todos los juegos y sin escribir nada por juego:**
  - Todo el contenido cumple el esquema y los identificadores son únicos.
  - Cada proyecto tiene 3 ejercicios de 5 preguntas y 3 hojas.
  - El banco de examen de cada órbita permite al menos tres exámenes distintos.
  - Cada generador produce, para muchas semillas, preguntas con respuesta dentro de los límites que declara.
  - La meta de cada pregunta de manipular es alcanzable desde su posición inicial.
- **Código.** Cada pregunta de código lleva una solución de referencia. Las pruebas ejecutan Pyodide en Node y exigen que la referencia pase sus comprobaciones y que el código inicial no las pase.
- **Persistencia.** Guardar y cargar, migración y documento corrupto.
- **Humo en navegador.** Una prueba que resuelve una pregunta de manipular y una de código de principio a fin.

## 10. Juego 1: contenido

| Etapa | Proyectos | Matemática | Aplicación en IA |
|---|---|---|---|
| Despegue | (10 preguntas) | Coordenadas, leer un plano, primer array en NumPy | Qué es un embedding, sin fórmulas |
| Órbita 0: La flecha | Componentes; Suma y escala; Norma y distancia | Vector como flecha y como lista, combinación lineal, norma euclídea, distancia, vector unitario | Un texto como punto; el centroide de varios textos; el punto más cercano |
| Órbita 1: El ángulo | Producto escalar; Coseno; Proyección | Producto escalar, coseno, ortogonalidad, proyección | Similitud coseno frente a distancia euclídea |
| Órbita 2: Muchas dimensiones | ℝⁿ en NumPy; Normalizar; Dimensión alta | Operar con matrices de vectores, equivalencias entre métricas en vectores unitarios, casi ortogonalidad | Por qué los embeddings tienen cientos de dimensiones y se normalizan |
| Órbita 3: Búsqueda | Vecinos y top-k; Analogías; Por qué falla un RAG | Vecinos más cercanos, aritmética de vectores, umbrales | Búsqueda semántica con embeddings reales y sus fallos típicos |

En total, 12 proyectos y 4 exámenes. La primera entrega contiene el despegue y los tres proyectos de la Órbita 0: 10 preguntas de Despegue, 45 de proyecto, 9 hojas y el banco del examen.

Dirección visual: sobria y oscura, con aire de instrumento técnico y no de juego infantil; el plano de vectores es el protagonista de la pantalla. El detalle visual se trabaja durante la construcción.

## 11. Riesgos

Riesgos conocidos de un diseño de partida con el progreso en el cliente, cada uno con su destino:

| Riesgo de partida | Destino aquí |
|---|---|
| El progreso manda en el cliente y no se valida en servidor | Aceptado mientras haya un solo jugador. Pendiente para la fase de plataforma; el motor es TypeScript puro para poder ejecutarse también en servidor |
| La fusión monótona no admite reinicios ni repaso espaciado | Resuelto: no hay sincronización, y se guarda el registro de intentos |
| Cada juego tiene su forma de progreso y migraciones a mano | Resuelto: un esquema común con versión y migración |
| Identidad de «cuenta familiar con perfiles locales» | Fuera de alcance. El perfil figura en la clave de almacenamiento |
| Respuestas y umbrales viajan en el cliente | Aceptado para aprendizaje propio. Pendiente para la fase de plataforma (exámenes corregidos en servidor) |
| El contenido es código | Resuelto: contenido como dato serializable con esquema |
| Solo algunos juegos tienen comprobaciones | Resuelto: las pruebas de contenido son genéricas y cubren todo juego |
| Sin rutas ni modelo de componentes | Resuelto: React y React Router |
| Sin entorno de Python | Resuelto: Pyodide |

Riesgos propios de este diseño:

- **Peso y tiempo de carga de Pyodide con matplotlib.** Se carga bajo demanda y con indicador. Si la espera resulta molesta al jugar, se precarga en segundo plano al entrar en un proyecto.
- **Pyodide en Node para las pruebas de código.** No está verificado que matplotlib funcione igual en Node que en el navegador. El plan lo comprueba en su primera tarea de Python; si no funciona, esas pruebas pasan a ejecutarse en navegador.
- **PyTorch no está disponible en Pyodide**, hasta donde se sabe. Afecta a los juegos 7 y 8, donde se elegirá entre un autograd propio en NumPy o ejecución en servidor.
- **Volumen de contenido.** El juego completo son unas 180 preguntas más bancos de examen. Por eso se entrega por órbitas.
- **Calidad didáctica.** Las pruebas garantizan que una pregunta es correcta, no que enseñe bien. Eso lo decide el propietario jugando, y es la razón de entregar pronto una órbita completa.
