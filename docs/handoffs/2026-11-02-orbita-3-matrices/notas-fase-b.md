# Notas de la fase A para la fase B (Órbita 3 de matrices)

## atencion (fase A: commit 240d851, 49/49 en `npx vitest run src/games/matrices/atencion`)

- `atencion.ts` no importa `py` ni el calentamiento: añadir `import { py } from '../py';`, `import { atencionWarmup } from './atencion.calentamiento';` y `warmup: atencionWarmup`.
- Sustituir `{ kind: 'programar', questions: [] }` (tercer ejercicio). La prueba espera `[5, 5, 0]` y tiene un caso «ex02: queda como marcador vacío» que hay que cambiar (es una prueba de la fase A sobre el marcador, no una expectativa de contenido).
- La prueba de patrones de id solo lista ex00 y ex01; falta `checkProject`, la prueba del calentamiento y los valores de ex02.
- Reglas de prosa que muerden en ex02: no «dimensión» para la forma (usar «ejes»); el `explain` no puede contener la última línea ni el eje; `requirements` no da el eje. `hoja.1` ya usa `axis=1` y `axis=0` en `lines` y `solution` (ahí está permitido).
- `examen-3-atencion.ts` ya tiene `examen-3.mascara-causal` (opcion) y `examen-3.pesos-no-nulos` (numero, 21 pesos no nulos con 6 tokens): la entrada `codigo` del banco NO debe ser de máscara causal (que sea, por ejemplo, puntuaciones y softmax por filas). Ex02.5 (máscara causal) sí puede quedarse.
- En la prueba, `grade` toma `Exclude<Question, CodigoQ>`: hay un tipo local `Graded`.
- Ids de vectores en los planos: `k1`, `k2`, `q`, `k`, `x`, `w`, `unos`.
- Riesgos anotados: ex00.5 lleva una meta redundante (dot(w, unos) = 1, pedida en el encargo); ex00.3 acepta (2, 2) y (2, −2); en ex00.1 el panel solo enseña q·k₁ (un solo `pair`); ex01.2 espera (0,79; 0,11; 0,11) con tol 0,01; los planos de ex00.4 y ex00.5 no se han mirado en pantalla.

## svd (fase A: commit 1858c0e, 51 pruebas en `npx vitest run src/games/matrices/svd`)

- En `svd.ts`: rellenar ex02, `import { svdWarmup } from './svd.calentamiento'`, `warmup: svdWarmup` y `import { py } from '../py'`. Ayudantes locales: `vec`, `svdPlane` (añade `circle: 1, circleImage: true`) y `svdPlaneJMovable` (î fija y ĵ móvil, que `transformPlane` no da).
- En `svd.test.ts`: la prueba «ex02: programar está vacío hasta la fase B» y los recuentos `[5, 5, 0]` son de la fase A sobre el marcador y se cambian; añadir `checkProject(svd)` igual a `[]`, el calentamiento y los cinco `codigo`; la prueba del banco espera hoy 2 entradas de tipos `['opcion', 'numero']`: actualizarla al añadir la entrada `codigo`.
- `hoja.1` ya es la trampa `v1 = Vt[:, 0]`: ex02.1 no puede ser la misma trampa sin variarla (sí vale como error típico rechazado en la prueba de Python).
- ex01.2 ya usa A = (3 0; 4 5) y AᵀA = (25 20; 20 25): usar otros datos en ex02.1, ex02.3 y en el calentamiento, y tampoco las matrices de ex00 (por ejemplo (2 2; −1 1)). El encargo de `brief-svd.md` sugiere (3 0; 4 5) para ex02.1: cámbiala.
- Banco ya usado: `examen-3.svd-sin-autovalores` (opcion) y `examen-3.numero-de-condicion` (numero, WᵀW con autovalores 36 y 4, κ = 3): la entrada `codigo` debe ser distinta (por ejemplo S y κ de otra matriz, o el rango numérico).
- Riesgos anotados: no registrar la órbita hasta que la fase B haya llenado ex02 (el marcador vacío no cumple el esquema); ex00.3 tiene dos vectores móviles con range 3 y snap 1; nada visto en pantalla.

## rango-bajo (fase A: commit 912049d)

- En `rango-bajo.ts`: rellenar ex02, `import { rangoBajoWarmup } from './rango-bajo.calentamiento'` y `warmup: rangoBajoWarmup` (añadir también `import { py } from '../py'`).
- En `rango-bajo.test.ts`: los recuentos pasan a `[5, 5, 5]` y la prueba de ids a `[0, 1, 2]` (son pruebas de la fase A sobre el marcador vacío); añadir `checkProject(rangoBajo)` igual a `[]`, la prueba del calentamiento y la de los cinco `codigo` de ex02; al añadir la entrada `codigo` del banco, actualizar las pruebas de `examen3RangoBajo` que cuentan dos entradas y dos tipos, y extender las pruebas de «mensajes» como en `pca.test.ts`.
- No repetir en ex02 ni en el banco: el espectro (6, 3, 2, 1), la matriz 1000×800, 4096 con r = 8, ni la idea energía-y-k de ex01.3 como pregunta suelta. Ids del banco ya usados: `examen-3.lora-b-cero` (opcion) y `examen-3.error-peor-direccion` (numero).
- `hoja.1` usa `Vt[:, :k].T` como línea errónea (encaja en forma y falla en silencio), no `Vt[:, :k]` a secas.
- Riesgos anotados: ex00.3 y ex00.4 tienen dos vectores móviles (rejillas de 7×7 y 13×13); ex00.4 depende de snap 0,5 (solución (1,5; 1,5)); ex01.3 tiene un empate exacto en el 90 % (45/50); nada visto en pantalla.

## generadores (commit 5317be8, 159/159 en `npx vitest run src/content/generators.test.ts`)

- `valores-singulares` (vector, bounds [1, 15]), `parametros-lora` (numero, [128, 32768]), `puntuacion-atencion` (numero, [−18, 18]).
- El montaje añade al banco `examen-3.valores-singulares`, `examen-3.parametros-lora` y `examen-3.puntuacion-atencion` con esos generadores.
- `generators.test.ts` importa ahora `defineProseTests` de `tests/content/prose-helpers.ts` (primera vez que `src/` importa de `tests/` en una prueba; ESLint no se queja).
- `parametros-lora` escribe el porcentaje entrenado con dos decimales; valores pequeños salen «aproximadamente el 0,2 %»: mirar que se lea bien en el juego.
