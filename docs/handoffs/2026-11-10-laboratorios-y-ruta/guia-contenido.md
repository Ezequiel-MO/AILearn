# Guía de contenido con laboratorios

Para todo encargo de contenido desde el 2026-11-10 (reescritura del juego 2 y juegos 3 a 9). Siguen en pie `README.md` («El contenido es dato», «Añadir una pregunta», «Añadir un proyecto»), `CLAUDE.md` («Contenido: reglas que las pruebas hacen cumplir») y los presupuestos de texto de `docs/handoffs/2026-11-04-juego-3-gradiente/guia-contenido-juego-3.md` (tabla «Menos tedio»: no se amplían).

## La queja que hay que resolver

Oliver, 2026-11-10, con todo lo anterior ya publicado (incluidos `purpose` y `bigPicture`):

> «mejora los gráficos de la sección "Matrices y transformaciones" en adelante, la jugabilidad, y las siguientes secciones tienen que ser más gráficas, y me tienen que enseñar mejor cómo funciona la IA. Actualmente, la sección "Manipular" suele tener ejemplos mal explicados, y acabo moviendo vectores sin ningún sentido, y la parte de calcular suelen ser ejercicios irrelevantes que no me enseñan cómo funciona realmente la IA.»

La auditoría de ese día lo confirma con números: de las 62 preguntas «Manipular» del juego 2, **ninguna** muestra datos, palabras ni la salida de un modelo (son «arrastra î hasta (1, 0)» o «gira v hasta que la lectura marque 4»); de las 60 de «Calcular», solo 18 tratan una magnitud real de IA. El texto de `purpose` habla de IA, pero la pantalla no: explicar más no lo arregla. Lo arregla **cambiar lo que se hace y lo que se ve**.

## Las cinco reglas

1. **Datos de IA a la vista.** Toda pregunta de «Manipular» es un `laboratorio` (o una `curva` con panel de datos): palabras con rasgos, tokens de una frase, puntos con clase, una pérdida con sus datos, una distribución sobre tokens. Si en la pantalla solo hay flechas y una rejilla, la pregunta está mal.
2. **La meta es una consecuencia, no una posición.** «Consigue que la neurona siguiente acierte las seis palabras», «baja la pérdida de 0,5 en 20 pasos», «que “animal” reciba al menos el 70 % de la atención». Nunca «pon î en (0, 1)» ni «hasta que la lectura valga 2,83». Las metas son desigualdades (`gte`, `lte`) siempre que se pueda; `eq` solo cuando el concepto es un valor exacto (determinante 0).
3. **Varias soluciones.** Si solo una colocación resuelve, el jugador teclea coordenadas. Diseña para que haya muchas (igual que al entrenar hay muchas matrices que valen) y, si quieres estrechar, añade una segunda meta que sea otra consecuencia («…y sin que ninguna pareja de palabras caiga en el mismo punto»).
4. **Cada pregunta, una sorpresa.** Las cinco de un ejercicio forman una historia con el mismo escenario y una cosa nueva cada vez; al menos una enseña un límite («con una capa que aplasta antes, lo máximo son 4 de 6»: la meta pide ese máximo). Ninguna repite la mecánica de otra con otros números.
5. **«Calcular» es un paso de una máquina real.** Cada pregunta calcula algo que un sistema de IA calcula o que un ingeniero decide: la salida de una neurona para una palabra, los parámetros de una capa de 768 a 3072, la forma de un producto, el peso de atención de un token, la pérdida de un ejemplo, el coste de una petición. Con su laboratorio o figura al lado para verlo (`lab` o `graph`), y **sin** la lectura que da la respuesta. Prohibido el procedimiento de biblioteca a mano (polinomio característico, fórmula de la inversa, AᵀA) salvo que la cuenta sea de dos líneas y diga algo del sistema.

## Cómo es una pregunta `laboratorio`

```ts
{
  id: 'columnas.ex00.1',
  type: 'laboratorio',
  purpose: { why, aim, takeaway },          // cortos: 60 a 300 / 60 a 200 / 60 a 260 caracteres
  prompt: 'La neurona siguiente solo mira la primera coordenada de salida… Mueve las columnas de la capa hasta que acierte con las seis reseñas.',
  lab: { kind: 'capa', … },                  // el escenario: sale de `datos.ts` del juego, no se inventa en cada pregunta
  goals: [{ metric: 'acc', op: 'gte', target: 1, label: 'Aciertos de la neurona siguiente', format: 'percent' }],
  solved: { ix: 0, iy: 1, jx: 1, jy: 0 },    // un estado que cumple las metas; lo que enseña «Ver una solución»
  hints: [/* 2 pistas: qué mirar en el dibujo; qué mando mover hacia dónde */],
  explain: '…', solution: '…',
}
```

- `label` de la meta dice qué se mide, sin el número (el medidor lo enseña con «al menos / como mucho»). De 1 a 3 metas.
- El enunciado dice **qué pasa en el sistema** y qué conseguir; no nombra coordenadas ni el valor de los mandos. Las pistas señalan lo que hay que mirar en el dibujo; la segunda puede decir hacia dónde mover.
- `solved` tiene que caer en la rejilla de los mandos y cumplir las metas, y el estado inicial no (`checkLab`, vía `checkProject`). Antes de escribir la pregunta, compruébalo con el modelo (`labMeasure` en un `*.test.ts` o en un guion fuera del repositorio).
- Los escenarios (nubes de palabras, frases, datos) viven en un fichero de datos del juego (`src/games/<juego>/datos.ts`) y se reutilizan: el jugador reconoce las palabras de una pregunta a otra.
- En examen (banco), una pregunta `laboratorio` vale igual; los medidores no dicen si la meta está cumplida.

## «Calcular» con laboratorio

`numero`, `vector` y `opcion` admiten `lab` (un laboratorio para explorar, no puntúa) además de `graph` y `plane`. Úsalo en al menos 3 de las 5. El enunciado remite a lo que se ve. Si la respuesta es una métrica del laboratorio, no la pongas en `readouts`; si la pregunta es de predecir («¿qué pasará con la atención si la temperatura baja a la mitad?»), deja los mandos para que lo compruebe después.

## «Programar», hojas y calentamiento

Sin cambios de formato (de la mano: `# PASO N.`, tres pistas, `requirements`; 1 o 2 fichas de calentamiento). El contenido sí sigue las reglas de arriba: el código construye la pieza de IA del proyecto con NumPy (la capa, la atención, un paso de descenso), con datos con nombre, y cuando ayude deja una figura de matplotlib ya hecha.

## Pruebas por proyecto

- `<proyecto>.test.ts`: `checkProject` vacío, `defineProseTests`, presupuestos de texto, y por cada `laboratorio`: que su `solved` cumple y una colocación «tentadora pero mala» no (con `// contract:` que diga por qué). Nada de tablas que copian el contenido.
- `<proyecto>.python.test.ts`: como hasta ahora (alternativas, errores típicos, `defineHintTests`).
- Al reescribir preguntas existentes se conservan los **ids** (`<proyecto>.ex00.1`…): el progreso guardado los nombra. Las expectativas viejas de su `*.test.ts` describen el contenido que se sustituye: se reescriben a propósito (es un cambio de contrato pedido por Oliver el 2026-11-10; dilo en el `// contract:`), no se relajan una a una.
- Los bancos de examen (`examen-N-<proyecto>.ts`) se actualizan a la vez: una entrada `laboratorio` y dos de cálculo del estilo nuevo por proyecto, y se conserva la generada si su cuenta sigue teniendo sentido.

## Ver lo que escribes

Con `npx vite --port <libre>` y `?abierto` (por ejemplo `#/j/matrices?abierto`, y desde ahí al ejercicio), capturas con Playwright (`/usr/bin/google-chrome`) a 390 y 1100 px de **cada** pregunta de «Manipular». Míralas: que las palabras no se pisen, que la meta se entienda sin leer el `purpose`, que lo que cambia al mover se vea.
