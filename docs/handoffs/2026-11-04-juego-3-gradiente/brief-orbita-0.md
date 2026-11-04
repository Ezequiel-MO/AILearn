# Encargos de la Órbita 0 «La pendiente» del juego 3

Lee antes `brief-comun.md` y `guia-contenido-juego-3.md` (misma carpeta). Hay cinco encargos: tres proyectos (A, B, C), que corren en paralelo porque sus ficheros no se solapan; los generadores del examen (D), que puede correr a la vez que ellos; y el montaje (E), que hace la sesión principal cuando A a D están en verde.

Cifras: todo número de un enunciado, de una meta o de una respuesta se calcula antes con NumPy (`pyrun.mjs`, ver la guía). Lo que sigue son diseños: si una cifra no funciona en la rejilla, cámbiala y dilo en el informe.

## Lo común a A, B y C

- Identidad (la de `src/games/roadmap.ts`, la comprueba `tests/content/roadmap.test.ts` al montar): A `derivada-pendiente`, «Derivada como pendiente», sub «Acercar la secante»; B `reglas-derivacion`, «Reglas de derivación», sub «Derivar sin límites»; C `minimos`, «Mínimos», sub «Donde la pendiente es cero».
- Ficheros de cada proyecto, en `src/games/gradiente/`: `<id>.ts`, `<id>.calentamiento.ts`, `<id>.test.ts`, `<id>.python.test.ts` y `examen-0-<id>.ts` (sus **3 entradas fijas** del banco, ids `examen-0.<tema>`, únicos en todo el juego). Nada más: ni `index.ts`, ni `generators.ts`, ni la interfaz. La órbita no se registra hasta el montaje (E), así que las pruebas genéricas de `tests/content` aún no te recorren: tu `<id>.test.ts` llama a `checkProject(<proyecto>)` y aplica `defineProseTests` a las preguntas del proyecto y a las del banco; tu `<id>.python.test.ts` comprueba referencia y starter de tus preguntas de código (`codeQuestionProblems`), sus alternativas, sus errores típicos y sus pistas, y el reto de tus fichas de calentamiento (mira cómo lo hace `tests/content/warmup.python.test.ts` y reutiliza sus ayudantes).
- Estructura: ex00 «Manipular» (5 `curva`), ex01 «Calcular» (5 entre `numero`, `vector` y `opcion`, al menos 3 con `graph`), ex02 «Programar» (5 `codigo` de la mano), 3 hojas «Caza el error» (`revision`, cortas), `warmup` de 1 o 2 fichas, `bigPicture`. Ids `<id>.ex0N.k` y `<id>.hoja.k`.
- Presupuestos de texto de la guía, con su prueba.
- Entre los tres proyectos se reparten las ideas; no repitas una pregunta de otro proyecto ni la del despegue (lee `src/games/gradiente/despegue.ts` antes de empezar).

## A. Derivada como pendiente

La derivada es la pendiente de la tangente, el límite de las pendientes de las secantes, y se lee como «cuánto cambia la pérdida por cada poco que se mueve un peso».

- ex00 (curva), una historia sobre f(x) = x² o una parábola que parezca una pérdida:
  1. P fijo, Q móvil sobre la curva, lecturas `secant` y `slope`: acercar Q a P hasta que la pendiente de la secante quede a 0,1 de la de la tangente. Lo que se ve: la secante gira hasta pegarse a la tangente.
  2. Lo mismo desde el otro lado (Q a la izquierda de P): la secante se acerca por debajo; la derivada no depende del lado.
  3. Un punto móvil: dónde la tangente es horizontal (pendiente 0).
  4. Dónde la pendiente vale un número dado (la curva sube más deprisa cuanto más lejos del mínimo).
  5. Una cúbica con un máximo y un mínimo locales, dos puntos móviles: los dos sitios de pendiente 0 (metas `slope` 0 y `fx` para distinguirlos). Es la antesala de los mínimos locales de C.
- ex01 (calcular): pendiente de una secante en la figura; la secante con h = 0,01 (el límite); el signo de la pendiente en tres puntos marcados (opcion); la derivada como tasa: si L′(w) = 4, ¿cuánto cambia L al mover w en 0,1? (aproximación lineal L′·Δw); la recta tangente (su ordenada en el origen) en un punto.
- ex02 (programar): `pendiente_secante(f, a, b)`; derivada numérica hacia delante `derivada(f, x, h)`; la diferencia centrada y su error frente a la hacia delante para varios h (arrays de NumPy); la **comprobación de gradiente** que hace un ingeniero de verdad: derivada numérica frente a la exacta de la pérdida de ŷ = w·x sobre unos datos; la tangente en un punto (pendiente y ordenada) con la figura de matplotlib ya hecha en el `starter`.
- Calentamiento: pasar una función como argumento (y `lambda`), `np.linspace` y operar con arrays.
- `bigPicture`: `gradient`, `loss`.
- Banco: 3 fijas (una `numero` de secante en contexto, una `opcion` de leer una tangente, una `codigo` corta de derivada numérica).

## B. Reglas de derivación

Derivar sin límites: la regla de la potencia, la constante, la suma y el producto, y aplicarlas a una pérdida para obtener la fórmula del gradiente de un modelo de un peso.

- ex00 (curva), con `derivative: true` en casi todas (f y f′ a la vez: «la pendiente de f es la altura de f′»):
  1. f = x² y f′ = 2x: mover P a donde la pendiente vale 3; se ve que la altura de f′ en esa x es 3.
  2. f = 3x²: multiplicar por una constante multiplica la pendiente (mover P a donde la pendiente vale 3 ahora cae en otra x).
  3. f = x² + 2x: la suma; dónde la tangente es horizontal.
  4. f = x³: los dos puntos con pendiente 3 (dos móviles, `fx` para distinguirlos): una cúbica tiene la misma pendiente en x y en −x.
  5. **Construye la tangente**: una curva y dos puntos libres; mover los dos puntos para que la recta que pasa por ellos (lectura `line`) sea la tangente a f en x = 1 (metas `line_slope` y `line_icpt`). Juntas la derivada y la recta del despegue.
- ex01 (calcular): la derivada de un polinomio en un punto; los coeficientes de f′ como `vector`; la regla del producto en un punto; la derivada de la pérdida de un solo dato, L(w) = (2w − 3)², y su valor en w = 1 (con la figura de la pérdida); opcion: qué es la derivada de xⁿ.
- ex02 (programar): un polinomio como array de coeficientes (del término independiente al de mayor grado, como `coefs` del plano); `evaluar(coefs, x)`; `derivar(coefs)` con la regla de la potencia (con `np.arange`, sin bucle); comparar con `np.polyder` (cuidado: NumPy ordena los coeficientes al revés; que una pista lo diga); la derivada de la pérdida de ŷ = w·x sobre arrays `x`, `y`, `media(2·x·(w·x − y))`, comparada con la numérica; la figura de f y f′ juntas ya hecha.
- Calentamiento: arrays de coeficientes, `np.arange`, operaciones elemento a elemento, `[::-1]`.
- `bigPicture`: `gradient`.
- Banco: 3 fijas (derivada de un polinomio en un punto, coeficientes de una derivada como `vector`, una `codigo` corta de `derivar`).

## C. Mínimos

Donde la pendiente es cero: mínimos y máximos, mínimos locales y globales, y el peso que hace mínima la pérdida de un modelo de un solo parámetro, w* = Σxᵢyᵢ / Σxᵢ².

- ex00 (curva), la pérdida `mse` con su panel `fit` como protagonista:
  1. El mínimo de la pérdida de unos datos con historia de IA (los cuadrados de los errores encogen a la vez que la pendiente llega a 0).
  2. Con `step`: colocar w donde la pendiente vale un número positivo dado y ver que el paso va a la izquierda; «cuesta abajo» es el lado contrario de la pendiente.
  3. Un dato atípico: los mismos datos más uno lejano; el mínimo se desplaza (el error al cuadrado castiga mucho los errores grandes).
  4. Una cuártica con dos valles, dos puntos móviles: los dos mínimos (metas `slope` 0 y `fx`); el global es el más bajo. Un descenso que empieza cerca del otro valle se queda allí.
  5. Una cúbica: de sus dos puntos de pendiente 0, el que es mínimo (la pendiente pasa de negativa a positiva).
- ex01 (calcular): w* = Σxy / Σx² con tres datos (con la figura de la pérdida); la pérdida en el mínimo; el mínimo de a·w² + b·w + c en −b/(2a); opcion: un punto de pendiente 0 que no es mínimo; opcion: por qué el descenso de gradiente puede quedarse en un mínimo local (figura de la cuártica).
- ex02 (programar): la pérdida para muchos w a la vez con NumPy (`w[:, None] * x`) y el mínimo por búsqueda en rejilla (`np.argmin`); w* por la fórmula cerrada; comprobar que la pendiente en w* es casi 0; el efecto del dato atípico; la figura de la pérdida con su mínimo marcado ya hecha en el `starter`.
- Calentamiento: `np.argmin`, `np.linspace` y la difusión (`[:, None]`).
- `bigPicture`: `loss`, `update`.
- Banco: 3 fijas (w* de unos datos, el mínimo de una parábola, una `codigo` corta de búsqueda en rejilla).

## D. Generadores del examen

En `src/content/generators.ts` (y sus ids en `IDS` y en la tabla de límites de `src/content/generators.test.ts`), tres generadores que devuelven `NumeroQ` con su `purpose` corto si los demás lo llevan (mira `valores-singulares` y `puntuacion-atencion`, los más recientes), cifras que se teclean con dos decimales y una solución con la cuenta:

- `pendiente-secante` (proyecto `derivada-pendiente`): la pendiente de la secante de una parábola a·x² + b·x + c entre dos x enteras.
- `derivada-polinomio` (proyecto `reglas-derivacion`): f′(x₀) de una cúbica con coeficientes enteros pequeños.
- `minimo-perdida` (proyecto `minimos`): el w* = Σxy / Σx² de tres datos enteros pequeños.

Si encaja, cada uno lleva un `graph` con la curva (sin la lectura que da la respuesta). Ficheros: `src/content/generators.ts` y `src/content/generators.test.ts`. Hecho cuando `npx vitest run src/content/generators.test.ts` está en verde y `npm run check` limpio.

## E. Montaje (sesión principal)

1. `src/games/gradiente/examen-0.ts` (modelo `src/games/matrices/examen-2.ts`): por proyecto, sus 3 fijas y una `generada` (`examen-0.pendiente-secante`, `examen-0.derivada-polinomio`, `examen-0.minimo-perdida`), y `examen-0.test.ts` (modelo `examen-2.test.ts`).
2. `src/games/gradiente/index.ts`: `orbits: [{ name: 'La pendiente', projects: [derivadaPendiente, reglasDerivacion, minimos], examBank: examen0 }]`; amplía la lista de órbitas que afirme `despegue.test.ts`.
3. `README.md` y `CLAUDE.md` (primer párrafo, estructura, «Dónde vive cada cosa»): el juego 3 con su despegue y su Órbita 0; el plano de curvas (`curva`, `graph`) en la tabla de tipos de pregunta; `bigPicture`, `src/games/network.ts` y la ruta `/red`.
4. `npx vitest run tests/content src/games`, después `npm test` entero, `npm run build` y `npm run e2e`. Añade a `tests/e2e/smoke.spec.ts` un paso que abra `#/red` y uno que arrastre (con el teclado) un punto de una `curva` del despegue del juego 3, si encaja en su estilo.
5. Capturas a 390 px del panel de un proyecto con su tarjeta, de `#/red` y de una `curva` con `fit`, miradas.
6. Revisión ligera al final (una pasada de `code-reviewer` sobre `origin/main...HEAD`); sus hallazgos van a una lista para Oliver, sin ronda de arreglo automática. Nada de push ni de merge sin que Oliver lo pida.
