# Encargo común: construir un laboratorio de AIlearn

Trabajas en `/home/olive/projects/AIlearn/.claude/worktrees/ia-grafica-roadmap` (React 19, Vite, TypeScript estricto). Lee antes `CLAUDE.md` (reglas del proyecto) y, como ejemplo resuelto, el laboratorio «capa» completo:

- `src/engine/labs/types.ts` (estado, mandos, metas, utilidades) y `src/engine/labs/capa.ts` (modelo puro)
- `src/content/labs.ts` (esquema Zod de `capa`)
- `src/ui/labs/parts.tsx` (piezas comunes: `Handle`, `Slider`, `Choice`, `Readouts`, `LabFrame`, `linear`, `ticks`), `src/ui/labs/CapaLab.tsx`, `capa.css`, `capa.strings.ts`, `show.ts`, `labs.css`
- `src/ui/dev/labs/capa.ts` (muestras) y `src/ui/labs/labs.test.tsx`, `src/engine/labs/labs.test.ts` (pruebas)

## Qué es un laboratorio

Oliver (el único jugador; no es matemático; quiere entender cómo funciona la IA por dentro) se quejó de que en «Manipular» acababa «moviendo vectores sin ningún sentido». Un laboratorio es la respuesta: una escena con **datos de un sistema de IA a la vista** (palabras, tokens, puntos con clase, una pérdida, una distribución), **mandos** que el jugador mueve y **la consecuencia medida en vivo**. Las metas de una pregunta son desigualdades sobre esas medidas («Aciertos ≥ 100 %», «Pérdida ≤ 0,5»), nunca «pon el mando en 3». El dibujo tiene que dejar ver POR QUÉ cambia la medida: es lo que enseña.

Piezas, con el mismo `kind` en todas:

1. **Modelo puro** `src/engine/labs/<kind>.ts`: exporta la interfaz `<Kind>Spec` (con `kind: '<kind>'`, cada campo comentado en castellano) y `export const <kind>: LabModel<<Kind>Spec> = { controls, measure }`.
   - `controls(spec)`: los mandos (`id`, `min`, `max`, `step`, `start`). El estado es `Record<string, number>`: un deslizador es un número; una elección, su índice (step 1); un punto arrastrable, dos mandos `<id>x` y `<id>y`; un interruptor, 0 o 1.
   - `measure(spec, state)`: TODAS las métricas como `Record<string, number>`. Es determinista: nada de `Math.random` ni fechas; si hace falta azar, usa `src/engine/rng.ts` con una semilla de la especificación. Un valor imposible es `NaN` (no cumple ninguna meta).
   - Si el dibujo necesita datos derivados (trayectorias, curvas, matrices), exporta una función `<kind>Scene(spec, state)` que los calcule y úsala también en `measure`: el dibujo y la medida no pueden discrepar.
   - `src/engine` no importa nada de fuera de `src/engine` (ni paquetes): lo impone ESLint.
   - La cabecera del fichero documenta, en un comentario, la lista de **mandos** (ids) y de **métricas** (nombre y significado): es la referencia que leerán quienes escriban preguntas.
2. **Esquema** `src/content/labs/<kind>.ts`: `export const <kind>Schema = z.strictObject({...}).superRefine(...) satisfies z.ZodType<<Kind>Spec>`. Valida lo que haría fallar al modelo o al dibujo (ids repetidos, referencias a ids que no existen, rangos vacíos, tamaños máximos razonables).
3. **Dibujo** `src/ui/labs/<Kind>Lab.tsx`: `export function <Kind>Lab({ spec, state, onChange }: LabProps<<Kind>Spec>)`. SVG propio (sin librerías de gráficos), dentro de `LabFrame`. Sin `onChange` la figura queda quieta (sin tiradores, mandos desactivados). `onChange` recibe solo los mandos que cambian (`{ id: valor }`); quien monta el laboratorio los asienta en su rejilla.
   - Estilos en `src/ui/labs/<kind>.css` con prefijo `.<kind>__` (lo común ya está en `labs.css`: úsalo). Colores solo con las variables CSS existentes (`--lab-g0…g3` grupos de datos, `--lab-t0…t3` lo que mueve el jugador, `--lab-good`, `--lab-bad`, `--lab-neutral`, `--plane-area`, `--color-*`). Tema oscuro.
   - Textos fijos en `src/ui/labs/<kind>.strings.ts` (`export const <kind>Strings = {...}` con una función `metric(nombre, spec)` que rotula cada lectura, y `export const <kind>Formats` con el formato de cada métrica). En castellano, decimales con coma (usa `fmt` de `src/ui/format.ts` y `showValue` de `show.ts`), nunca un punto decimal a la vista.
   - Accesibilidad: el SVG lleva `role="group"` si es interactivo o `role="img"` si no, con `aria-label`; las capas de adorno, `aria-hidden`; todo mando se puede usar con teclado (`Slider` y `Choice` ya lo son; un tirador usa `Handle`); las lecturas son texto real (`Readouts`).
   - Se ve bien a 360 px de ancho (el marco apila figura y panel) y a 1100 px.
   - El panel enseña las lecturas que pida `spec.readouts` (lista de nombres de métrica), en ese orden.
   - Animación solo como adorno y respetando `prefers-reduced-motion`; en jsdom no hay `matchMedia` (mira `src/ui/fx/motion.ts`).
4. **Muestras** `src/ui/dev/labs/<kind>.ts`: `export const <kind>Samples: (LabQ | NumeroQ)[]`, de 3 a 5 preguntas de muestra (ids `dev-<kind>-…`) que ejerciten todas las variantes de la especificación, con un escenario de IA creíble, metas y `solved` válidos. Al menos una es `numero` con el laboratorio como figura para explorar.
5. **Pruebas**: `src/engine/labs/<kind>.test.ts` (el modelo: casos con valores calculados a mano; cada expectativa con su comentario `// contract:` que dice de dónde sale el número) y `src/ui/labs/<kind>.test.tsx` (las muestras cumplen `labQSchema`/`numeroQSchema`, `checkLab(q)` devuelve `[]`, se pintan, y una interacción real con teclado o `fireEvent.change` en un deslizador cambia una lectura). Copia la forma de `labs.test.ts` y `labs.test.tsx`.

## El cableado NO es tuyo

No toques `src/engine/labs/index.ts`, `src/content/labs.ts`, `src/content/schema.ts`, `src/ui/labs/Lab.tsx`, `src/ui/strings.ts`, `src/ui/dev/LabsDev.tsx`, `src/ui/labs/parts.tsx`, `labs.css` ni ningún fichero de otro laboratorio: varios agentes trabajan a la vez y esos ficheros los cablea quien coordina. Si echas en falta algo en una pieza común, dilo en el informe.

Mientras no esté cableado, `LabQ['lab']` todavía no admite tu `kind`. En tus muestras y pruebas escribe la especificación con tu tipo `<Kind>Spec` y convierte en la frontera con un único `as unknown as LabQ['lab']` comentado («se cablea después»); en la prueba de esquema usa tu `<kind>Schema` directamente para el laboratorio, y prueba el componente montando `<Kind>Lab` con un estado propio (un pequeño componente de prueba con `useState` y `settle(model.controls(spec), {...prev, ...patch})`). No uses `QuestionView` ni `checkLab` (aún no conocen tu `kind`): comprueba tú, con tu modelo, que `solved` cumple las metas (`goalMet`) y que el estado inicial no.

## Órdenes

- El gancho del worktree rechaza órdenes complejas: lanza órdenes sencillas, una por llamada, desde la raíz del worktree, sin `cd`, sin heredocs ni scripts en línea. Para crear o editar ficheros usa las herramientas Write y Edit.
- `npx tsc --noEmit` y `npx eslint src/engine/labs src/content/labs src/ui/labs src/ui/dev/labs` (otros agentes pueden tener ficheros a medias: céntrate en los errores de TUS ficheros y no arregles los de otros).
- `npx vitest run src/engine/labs/<kind>.test.ts src/ui/labs/<kind>.test.tsx`
- `npx prettier --write <tus ficheros>`
- No ejecutes `npm install`, ni `npm test` entero, ni git (ni `add`, ni `commit`, ni `stash`): el commit lo hace quien coordina.
- No lances otros agentes.

## Informe final

Lista de ficheros creados; la tabla de mandos y de métricas tal como quedó; qué has verificado (órdenes y resultado); lo que NO has podido verificar (no has visto el dibujo en un navegador: dilo); y `RISKS:` con cualquier cosa que pueda romperse al cablear o al escribir contenido con este laboratorio.
