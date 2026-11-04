# Encargo: el juego 3 «Derivadas y gradiente» entra en el registro con su despegue

Lee antes `brief-comun.md` y `guia-contenido-juego-3.md` (misma carpeta). En paralelo, otro agente construye `CurvePlane` y `CurvaQuestion` (la interfaz de tus preguntas `curva`), otro el dibujo de la red y otro los textos `bigPicture` de los juegos 1 y 2.

## Qué construir

1. **`src/games/gradiente/index.ts`**: `export const gradiente: Game` con `id: 'gradiente'`, `title: 'Derivadas y gradiente'` (los de `src/games/roadmap.ts`), `bigPicture` del juego (piezas `loss`, `gradient`, `update`: qué parte de la red construye este juego, la de aprender, y por qué va después de vectores y matrices), `launch` y `orbits: []` (la Órbita 0 llega en otro encargo). Regístralo en `src/games/index.ts` tras `matrices`.
2. **`src/games/gradiente/despegue.ts`**: el despegue, **8 preguntas**, ids `despegue.1` a `despegue.8`. Matemática: la pendiente de una recta y la tasa de cambio. IA: aprender es ajustar números para equivocarse menos. La secuencia (ajústala si al calcularla algo no funciona, y dilo):
   1. `curva`: la pendiente de una recta. A fijo, B móvil, lectura `line` (se ve el triángulo de avance y subida). Mover B hasta que la recta suba 2 por cada paso a la derecha.
   2. `numero` con `graph`: una recta que baja (curva `poly` de grado 1, dos puntos marcados con `coords`, sin la lectura de la pendiente). ¿Cuál es su pendiente? Una pendiente negativa es una recta que baja.
   3. `numero` con `graph`: tasa de cambio media en un registro de entrenamiento: la pérdida en dos pasos de entrenamiento (dos puntos, la recta entre ellos). ¿Cuánto baja por paso? Números redondos.
   4. `curva`, **el momento clave del despegue**: curva `mse` con `fit` (el panel con los datos, la recta ŷ = w·x y los cuadrados de los errores). Mover w hasta que la pérdida sea la menor posible (meta `fx` en el mínimo, o `slope` 0, con la tolerancia de la rejilla). El `purpose` y el `takeaway` dicen la idea del juego: entrenar es esto, con millones de pesos a la vez. Elige datos con una historia de IA y un mínimo que caiga en la rejilla.
   5. `opcion` con `graph`: la misma pérdida con un punto y su tangente dibujada (`tangent: true`), con pendiente positiva. ¿Hacia dónde hay que mover w para que la pérdida baje? (La respuesta: al lado contrario de la pendiente.)
   6. `curva` con `step` (la flecha del paso, «un paso» cuesta abajo, con `rate` pequeño): colocar w donde la pendiente valga un número negativo dado y ver que el paso apunta a la derecha. Que se lea en el `takeaway` que la regla es «paso = −tasa × pendiente», sin desarrollarla (es la Órbita 1).
   7. `codigo`: una función `pendiente(p, q)` que da la pendiente de la recta por dos puntos; se prueba con otros puntos.
   8. `codigo`: la pérdida de ŷ = w·x con NumPy (arrays `x` e `y` dados) para una lista de valores de w, y el w de la lista con menor pérdida (`np.argmin`); el `starter` trae ya hecha la figura de matplotlib de la pérdida frente a w.
3. **Pruebas**: `src/games/gradiente/despegue.test.ts` (modelo `src/games/matrices/despegue.test.ts`: identidad y título del juego, número de preguntas y secuencia de tipos, `defineProseTests('Despegue de gradiente', launch)`, los valores de cada pregunta calculados aparte, la alcanzabilidad con `gameProblems(gradiente)` vacía, los presupuestos de texto de la guía) y `despegue.python.test.ts` (modelo `src/games/matrices/despegue.python.test.ts`: referencia y starter, soluciones alternativas, errores típicos, pistas). Las pruebas que enumeran los juegos registrados (busca en `src/ui/screens/*.test.tsx`, `tests/content/roadmap.test.ts` y donde aparezca `[vectores, matrices]` o los ids de juego) se amplían con el tercero, con su `// contract:`.

## Ficheros

Tuyos: `src/games/gradiente/` entera, `src/games/index.ts` y las pruebas que tengas que ampliar por el juego nuevo. Si una de esas pruebas es de `src/ui/screens/`, el agente de la red puede estar editándola: vuelve a leerla justo antes de tocarla.

## Hecho cuando

`npm run check` limpio; `npx vitest run src/games/gradiente tests/content src/ui/screens` en verde (salvo fallos que vengan de ficheros a medias de otros agentes; dilo); si `CurvePlane` ya existe, capturas a 390 px de las preguntas 1, 4 y 6 miradas; commit de tus ficheros; informe según `brief-comun.md`.
