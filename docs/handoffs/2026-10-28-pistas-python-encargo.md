# Encargo: preguntas de código que llevan de la mano (un proyecto)

## Contexto

AIlearn (repo en el worktree `/home/olive/projects/AIlearn/.claude/worktrees/python-hand-holding`, rama
`worktree-python-hand-holding`) son juegos para aprender ingeniería de IA. Lee `CLAUDE.md` y, en `README.md`,
«Añadir una pregunta», punto 3 y sus tres viñetas: es la pauta que vas a aplicar.

Oliver, el único jugador, practica poco Python y se atasca en los ejercicios «Programar». Ha pedido, con sus
palabras: «Necesito más hand holding para suplir mi poca práctica en python: los comentarios en el código deben
ser más hand holding, y comentar más en concreto el porqué de cada cosa; la pista debe ser más hand-holding.»
La guía general de Python ya se ha quitado. El proyecto Analogías ya está hecho y es el **modelo que copias**:

- `git show 98b1234 -- src/games/vectores/analogias.ts` (el antes y el después de las cinco preguntas).
- El estado actual: `src/games/vectores/analogias.ts`, ejercicio `programar` (preguntas `analogias.ex02.1` a `.5`).
- Las pruebas: `src/games/vectores/analogias.python.test.ts`, bloque `SKELETON_FILLS` + `defineHintTests(...)`.
- Los ayudantes: `src/games/py.ts` (`py(...)`) y, en `tests/content/python-helpers.ts`, `hintBlocks`,
  `fillSkeleton` y `defineHintTests`.

## Qué cambias en cada pregunta de código de tu proyecto

Solo `starter` y `hints`. No toques `prompt`, `explain`, `solution`, `requirements`, `checks` ni `reference`.

**`starter`** (lo que Oliver ve en el editor al empezar):
- Comenta qué es cada cosa importada o dada (forma, qué contiene, un ejemplo de acceso si ayuda). Las funciones y
  datos que ya vienen hechos dicen «Ya está hecha: no hace falta tocarla» y qué devuelven.
- Antes de cada línea `variable = None` va un bloque `# PASO N.` con: qué calcular, en palabras; **por qué**
  (la idea de la pregunta, no solo la orden); la herramienta de Python que hace falta y cómo se comporta (con un
  mini ejemplo con otros datos si ayuda: `["sol", "luna", "mar"].index("luna") vale 1`); y qué tipo de resultado
  se espera. Si hay un bucle, dilo: «empieza con `x = []`, recorre … con `for … in …:` y añade con `.append(...)`».
  Dentro de una función, explica la sangría la primera vez que haga falta.
- Termina con `# Para ver qué vale algo antes de entregar: print(...) y pulsa «Ejecutar».`
- Conserva **todas** las líneas `nombre = None` existentes, con el mismo nombre (las pruebas de alternativas
  añaden código al final del `starter`, y las sondas de basura buscan esas líneas). Puedes añadir una línea
  `= None` para una variable intermedia si ayuda (como `ref = None` en `analogias.ex02.4`), nunca quitar.
  Conserva el código dado (funciones, datos) tal cual; solo cambian y se añaden comentarios.
- El `starter` sigue sin aprobar (todo lo que se pide queda en `None` o `return None`).
- Nada de dar la línea de la solución en el `starter`: explica la herramienta, no escribas la respuesta.

**`hints`**: tres, de menos a más (sustituyen a las que haya):
1. El plan en palabras, paso a paso, nombrando variables y herramientas. Si hay un error típico conocido (lo
   dicen los `checks` y los `rejects` del `*.python.test.ts`), avísalo aquí o en la 3.
2. Las piezas de Python en un bloque `py(...)`, **con otros datos o con un solo caso** (no la respuesta), cada
   línea con un comentario que dice qué hace o qué imprime. Después del bloque, una o dos frases con lo que falte
   (cómo se lee una tupla, `==`, etc.).
3. El esqueleto de la solución en un bloque `py(...)` con huecos `___` donde va la decisión de la pregunta (el
   concepto: qué se resta de qué, `argmin` o `argmax`, qué se devuelve…); la estructura de Python (bucles,
   `append`, sangría) va escrita. Después, una frase sobre el error típico.

Formato: `'Texto…\n\n' + py('línea 1', 'línea 2') + '\n\nTexto…'`, **importando `py` de `'../py'`** (no
copies la función en el fichero: dos implementadores lo hicieron y hubo que deshacerlo). Dentro de
`py(...)` las cadenas de Python van con comillas dobles. Mira cómo lo hace Analogías.

## Reglas que las pruebas hacen cumplir (y que muerden)

- En el `starter`, ningún `dígito,dígito` (ni en comentarios): escribe `0, 1` con espacio. En Python `-0,5` es una tupla.
- En la prosa de las pistas (fuera de código): sin punto decimal (`0,5`, nunca `0.5`); fórmulas `$…$` emparejadas
  y válidas en KaTeX; pares con decimales separados por `; `; nada de «que ya conoces» ni «como ya sabes/viste»;
  texto en castellano; las palabras del juego (p. ej. «opuesto», no «vector contrario»).
- Los ejemplos de la pista 2 **se ejecutan tras el `starter`** y deben ir sin error: no pueden usar variables que
  Oliver aún no ha escrito (si necesitas una, defínela en el ejemplo, como el `ref = …   # el paso 1` de
  `analogias.ex02.4`). Todo bloque `py(...)` sin `___` cuenta como ejemplo.
- Lo que dice cada comentario de un ejemplo (`# [2 0 1]`, `# Bea`) tiene que ser lo que de verdad imprime.
  Compruébalo ejecutándolo (abajo, cómo).
- Si un fichero de pruebas del proyecto contrasta las cifras de los textos (p. ej. `fallos-rag.python.test.ts`
  junta `prompt`, `explain`, `solution` y `hints`) o fija un trozo del `starter`, tiene que seguir pasando: no
  escribas cifras que no hayas comprobado, y conserva lo que esté fijado.
- Una frase de una pista que hable de formas o de errores (p. ej. «si traspones `X`, sale de 2 por 4») tiene que
  ser cierta tal cual: si el gesto literal da un error de Python en vez de esa forma, nombra la expresión exacta.
- No cambies ninguna expectativa existente para que pase. Si una prueba fija el texto viejo de una pista,
  para y dilo en el informe.

## Pruebas que añades

En `<proyecto>.python.test.ts`, como en Analogías: un `SKELETON_FILLS` con lo que va en cada `___`, en orden,
para cada pregunta de código del proyecto (no las del banco de examen), y
`defineHintTests(<preguntas de código del proyecto>, SKELETON_FILLS, () => pyodide)`. Importa `defineHintTests`
de `tests/content/python-helpers`. Los rellenos son lo que escribiría alguien que entiende la pregunta.

## Cómo comprobar

Desde la raíz del worktree (la caché de Pyodide usa el directorio actual):
- `npm run check`
- `npx vitest run src/games/<juego>/<proyecto>.test.ts src/games/<juego>/<proyecto>.python.test.ts`
  (más `src/games/vectores/prosa.test.ts` si el proyecto es del juego `vectores`).
- `npx prettier --check <tus ficheros>` (o `--write`).
- **Lo que imprime cada ejemplo hay que verlo ejecutándolo, no a ojo** (en esta tanda dos implementadores lo
  hicieron a ojo y había un comentario falso). Crea, **fuera del repo** (en `$CLAUDE_JOB_DIR/tmp/<proyecto>/`),
  estos dos ficheros, cambiando `<RAIZ>` por la ruta absoluta del worktree (con `/` final) y `<DIR>` por ese
  directorio:

  `vitest.any.ts`:
  ```ts
  export default { test: { include: ['<DIR>/*.test.ts'], environment: 'node' } };
  ```
  `hints-any.test.ts`:
  ```ts
  import { writeFileSync } from 'node:fs';
  import { beforeAll, it } from 'vitest';
  import type { CodigoQ, Question } from '<RAIZ>src/content/schema';
  import { runInPyodide } from '<RAIZ>src/python/core';
  import { getPyodide, hintBlocks } from '<RAIZ>tests/content/python-helpers';

  let py: unknown;
  beforeAll(async () => { py = await getPyodide(); }, 120000);

  it('salida de los ejemplos', async () => {
    const mod = (await import('<RAIZ>' + process.env.HINTS_FILE!)) as Record<string, unknown>;
    const value = mod[process.env.HINTS_EXPORT!] as { exercises?: { questions: Question[] }[] } | Question[];
    const qs: Question[] = Array.isArray(value) ? value : value.exercises!.flatMap((e) => e.questions);
    const out: string[] = [];
    for (const q of qs.filter((x): x is CodigoQ => x.type === 'codigo')) {
      for (const b of hintBlocks(q).filter((x) => !x.code.includes('___'))) {
        const r = await runInPyodide(py, q.starter + b.code, q.checks);
        out.push(`=== ${q.id} pista ${b.hint + 1}\n--- código\n${b.code}--- salida\n${r.stdout}${r.error ?? ''}`);
      }
    }
    writeFileSync(process.env.HINTS_OUT!, out.join('\n'));
  }, 120000);
  ```
  Desde la raíz del worktree:
  `HINTS_FILE=src/games/matrices/<proyecto>.ts HINTS_EXPORT=<exportación> HINTS_OUT=<DIR>/salida.txt npx vitest run --config <DIR>/vitest.any.ts --root .`
  y compara cada comentario con la salida (también los espacios: NumPy imprime `[ 80. 130.]`).
- Las pruebas de Pyodide tardan; si una falla por carga o plazo, relánzala sola antes de concluir nada.

## Límites

- Toca solo `src/games/<juego>/<proyecto>.ts` y `src/games/<juego>/<proyecto>.python.test.ts`.
- **No hagas `git add` ni `git commit`** (otros implementadores trabajan en el mismo worktree a la vez; el que
  coordina hace el commit). Nada de `git stash`, `git reset` ni `git checkout` de ficheros ajenos.
- No lances otros agentes.
- Informe final, breve: qué cambiaste por pregunta (una línea cada una), el resultado de cada comprobación (lo
  que viste, con el recuento de pruebas), y una lista `RISKS:` con lo que pueda romperse o dudes.
