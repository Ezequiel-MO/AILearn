# Juego 3, Órbita 0 «La pendiente»: hallazgos para Oliver

Rama `worktree-juego-3-gradiente`, sin push. Salen de la revisión de código (`code-reviewer` sobre `origin/main...HEAD`), de la revisión con capturas a 390 px de las 30 preguntas de «Manipular» y «Calcular», y de la sesión anterior. No se ha arreglado ninguno: decide Oliver.

Estado al cerrar el montaje: `npm test` 8066 de 8066, `npm run build` y `npm run e2e` 16 de 16, todos en verde.

## Importantes (convendría arreglarlos antes de publicar)

**Arreglados los siete el 2026-11-05**, cada uno con su prueba: 3, 4 y 6 en af649b0; 7 en 00a89e5 (`src/ui/labelPlacement.ts`); 1, 2 y 5 en 80ea424. El 1 añade a `defineHintTests` la comprobación de que un `print` comentado con un valor imprime ese valor, y destapó cinco comentarios más (ya corregidos). El 5 añade `tests/content/loss.test.ts`. También queda arreglada, de paso, la salida `np.float64(…)` de `reglas-derivacion.ts:662` (menores). Los menores siguen pendientes.

1. **Una pista da un resultado falso.** `src/games/gradiente/reglas-derivacion.ts:662` comenta `# [-28.0, -9.0]` y en Pyodide sale `[-14.0, -9.0]`: −28 es la suma, no la media, que es justo la confusión que enseña la pregunta. Además, `defineHintTests` (`tests/content/python-helpers.ts`) solo comprueba que los ejemplos no den error, no que impriman lo que dicen sus comentarios.
2. **El `check` de `error_max` aprueba cualquier número casi cero.** En `reglas-derivacion.ts:731` pasan `error_max = 0`, el mínimo, el máximo con signo y la media, porque las diferencias reales son de 1e-13 a 3e-12.
3. **«+−» en la solución del generador `derivada-polinomio`.** En `src/content/generators.ts:1338-1339` y `:1360` los términos se juntan con `join('+')` sin `paren`, y sale `3·2^2+-6·2=0` en 194 de 300 sorteos. La línea 293 del mismo fichero ya usa `paren`.
4. **La figura de `minimo-perdida` enseña pérdida negativa, y el enunciado no casa con la curva.** En `generators.ts:1385-1388`, el margen de `yWindow` (línea 1274) se calcula antes de recortar el techo: con la semilla 1 la ventana es `y: [-38, 76]`, un tercio negativo, y el valle queda aplastado. En `:1399`, el enunciado dice «el error cuadrático $\sum(\dots)^2$», pero la curva `mse` es la media.
5. **Curvas con valores negativos llamadas «pérdida».** Es lo contrario de lo que enseña el juego: la pérdida cuadrática media nunca es negativa.
   - `src/games/gradiente/examen-0-minimos.ts:42`: «la pérdida vale −0,2».
   - `examen-0-reglas-derivacion.ts:30`: la curva llamada «pérdida» baja hasta unos −4,4.
   - `derivada-pendiente.ts:178,184`: una cúbica con las etiquetas de pérdida y el valle en −2.
6. **Una prueba que no puede fallar.** `src/content/generators.test.ts:1049` hace `toContain(String(answer))` con respuestas enteras de 0 a 40, y esos dígitos casi siempre salen en otra parte de la solución.
7. **Etiquetas que chocan en el plano de curvas** (`src/ui/CurvePlane.tsx`: las etiquetas no se apartan unas de otras; un arreglo ahí cambia todas las curvas).
   - «un paso» se monta sobre la etiqueta del punto y se lee «un pBso», «wn paso» o «un pRso»: Mínimos ex00.2, ex00.4 y ex01.5.
   - Al cumplir la meta de Derivada como pendiente ex00.1 y ex00.2, el aro de Q tapa P y las etiquetas P y Q se superponen. Justo en el estado que enseña la lección, la figura no se lee.

## Menores

- **Panel `fit` con los datos apiñados en una esquina.** El eje x llega a 28 en Mínimos ex00.1, a 65 en ex00.3 y a 18 en la pregunta 4 del despegue, con datos entre 1 y 4. Amplía el hallazgo de la sesión anterior sobre el espacio vacío a la derecha.
- **Más etiquetas montadas.** «f» y «f′» caen sobre el extremo de la curva (Reglas ex00.2, ex00.4, donde la «f′» queda recortada arriba, ex00.5, ex01.1 y ex01.3; Derivada como pendiente ex01.5). En Reglas ex00.5, «subida» y «avance» quedan tachadas por la recta.
- **Se habla de una secante que la figura no dibuja.** Pasa en `derivada-pendiente.ts:202`, en el generador `pendiente-secante` (`generators.ts:1306`) y en `examen-0-derivada-pendiente.ts:16`. `CurvePlane` solo dibuja la secante con la lectura `secant`, que enseña la respuesta. Haría falta un indicador de solo dibujo, como `tangent: true`.
- **«Por la derecha» no se exige** en Derivada como pendiente ex00.1 (`derivada-pendiente.ts:32,59`): Q = 2,9, a la izquierda, también aprueba. En ex00.2 sí se exige con una meta `x`.
- **Tangente y «pendiente en Q» en todos los puntos.** Salen también en ex00.1 y ex00.2, aunque el enunciado solo compara con la tangente en P (`CurvePlane.tsx:349,398-403`).
- **La figura casi da la respuesta.** En Mínimos ex01.3 el mínimo en 1,25 se lee a ojo; en ex01.4, la curva entera de x³ deja ver que 0 no es un mínimo.
- **Preguntas gemelas en el examen.** Cada generada tiene una fija gemela en su proyecto: secante, f′(x₀) y w*. Un examen trae al menos una pareja repetida un 42 % de las veces. Viene del encargo.
- **Repeticiones entre el despegue y los proyectos**, que van contra el «tedioso»:
  - llevar la pendiente a 0 en el fondo de una parábola, 4 veces;
  - la media de 2x(wx − y) programada, 4 veces;
  - la búsqueda en rejilla con `argmin`, 3 veces;
  - la cúbica con cima y valle, 2 veces;
  - la misma cuártica con el mismo arranque en Mínimos ex00.4 y ex01.5;
  - la pendiente entre dos puntos, 5 veces;
  - una comprobación de gradiente en el ex02.5 de A y en el de B.
- **Frases que hay que pulir.** `reglas-derivacion.ts:127`: «aunque en uno suba y en el otro, también». `derivada-pendiente.ts:863`: «sube unos 1». `reglas-derivacion.ts:753`: el arreglo de la solución reescribe también la línea 2.
- **Salida fea con NumPy 2.** Un `print` de una lista de `np.float64` saca `[np.float64(13.0), …]` (`despegue.ts:295`, `reglas-derivacion.ts:662`).
- **Accesibilidad.**
  - Un punto sobre la curva es un botón que solo se mueve con ← y →; ↑ y ↓ se ignoran sin aviso. Un `role="slider"` sería más fiel.
  - Los puntos fijos no se anuncian si no hay lectura `coords`.
- **La solución revelada de una `curva` solo da texto**: no dibuja la posición correcta.
- **El «)» de cierre baja a otra línea** en Reglas ex01.2, a 390 px.
- **Código.**
  - `CurvePlane.tsx:571-578` tiene una rama muerta.
  - `CurvePlane.tsx:404-426` repite la cuenta de la secante y de la recta en vez de usar `measureCurve`.
  - `BigPicture.tsx:33` pasa `?abierto` en el enlace.
  - El `// contract:` de `tests/content/games.test.ts:23` dice que las órbitas llegan en otros encargos, y ya no es cierto.
  - La regla «un `graph` estático no lleva la lectura de la respuesta» solo la comprueban las pruebas de cada proyecto; no hay prueba genérica para un juego futuro.

## De la sesión anterior

- **Pregunta 8 del despegue.** Quien elige w = 3 ve el mensaje de «has devuelto la posición», porque 3 es también el índice de la respuesta.
- **La tarjeta «Dónde encaja».** Va encima del ejecutor del despegue y empuja la primera pregunta hacia abajo.
- **Enlaces de `NetworkScreen`.** Casa las órbitas por nombre exacto: si se renombra una, su enlace pasa a «Próximamente» sin avisar.
- **Piezas de `NetworkDiagram`.** Las coloca a mano: una pieza nueva obliga a editarlo.
- **Peso de cada nivel.** Bajar el número de preguntas por ejercicio (5, en `src/engine/types.ts`) es una regla del motor: la decide Oliver.

## Cambios del montaje en pruebas compartidas (revisados y correctos)

- **`tests/content/prose-helpers.ts`.** `garbageProbes` antepone `import numpy as np`: un reto de Python puro no lo importa, y las sondas usan `np.array(...)`.
- **`src/App.test.tsx`.** `findByRole` espera 5 s en lugar de 1. La portada en diferido ya tardaba más de 1 s en Vitest antes del montaje: 1,14 s sin la órbita y 1,2 s con ella.
