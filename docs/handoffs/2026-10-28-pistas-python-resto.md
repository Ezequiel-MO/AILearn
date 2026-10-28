**Terminar las preguntas de código que llevan de la mano en los seis proyectos que faltan del juego 2 (Determinante, Inversa, Rango, Autovectores, Simétricas, PCA) y dejar la rama lista para que Oliver decida el merge.**

## CONTEXT

Oliver practica poco Python y se atascaba en los ejercicios «Programar». El 2026-10-28 pidió: quitar la guía
general «Python para esta pregunta» (no ayudaba) y que el código de partida y las pistas «lleven de la mano»,
explicando el porqué de cada paso, desde Analogías (juego 1, Órbita 3) en adelante.

Hecho y verificado en la rama `worktree-python-hand-holding` (worktree
`/home/olive/projects/AIlearn/.claude/worktrees/python-hand-holding`, 8 commits sobre `main`, árbol limpio,
**sin push**):

- `a919212`: fuera la guía (`PythonGuide.tsx`, `src/content/python-guide.ts` y su prueba, estilos, textos y los
  botones de fichas de «Cómo seguir»). Pruebas de `CodigoQuestion` adaptadas.
- `98b1234`: Analogías, las 5 preguntas de código: es el **modelo**. Pauta escrita en `README.md` («Añadir una
  pregunta», punto 3) y en `CLAUDE.md` («Contenido: reglas…»).
- `d7b42eb`: ayudantes comunes `py(...)` (`src/games/py.ts`) y `hintBlocks`, `fillSkeleton`, `defineHintTests`
  (`tests/content/python-helpers.ts`).
- Ya pasados con la pauta: despegue del juego 2 (`despegue.7` a `.9`), Columnas, Matriz por vector, Componer
  (juego 2) y Fallos de RAG (juego 1). Los cinco los hicieron implementadores; el coordinador revisó cada diff,
  ejecutó los ejemplos de las pistas en Pyodide y corrigió el `py()` copiado, un comentario de salida y una frase
  falsa sobre formas.
- Comprobación final de lo hecho: `npm run build` limpio; `npx vitest run tests/content src/ui` 1928 de 1928;
  pruebas de cada proyecto tocado en verde; `npm run e2e` 14 de 14 (una primera vuelta con la máquina cargada dio
  dos fallos por tiempo, `3 y 4` y `12`; repetida, todo verde).

Fuera de alcance por decisión: los exámenes (no enseñan pistas y miden lo aprendido) y Vecinos (Oliver ya lo había
hecho). Los calentamientos no se tocaron.

## TARGET FILE(S)

En el worktree, para cada proyecto `<p>` de `determinante`, `inversa`, `rango` (Órbita 1) y `autovectores`,
`simetricas`, `pca` (Órbita 2):

- `src/games/matrices/<p>.ts`: 5 preguntas de código `<p>.ex02.1` a `.5` en el ejercicio `programar`, aún con el
  `starter` breve antiguo y 2 pistas cortas. Ninguno importa `py`.
- `src/games/matrices/<p>.python.test.ts`: `accepts`/`rejects` de cada pregunta; aún sin `defineHintTests`.

Referencia (solo lectura): `src/games/vectores/analogias.ts` y `analogias.python.test.ts` (el modelo),
`src/games/matrices/componer.ts` (un proyecto del juego 2 ya pasado).

## GOAL

Que las 30 preguntas de código de esos seis proyectos sigan la pauta (código de partida con `# PASO N.` y el
porqué; tres pistas: plan, piezas con ejemplo, esqueleto con huecos `___`), con sus `defineHintTests` en verde, en
un commit por proyecto en la misma rama; y la comprobación final repetida, para que Oliver decida el merge a
`main` (que publica en producción).

## LOAD-BEARING DETAILS

1. **El encargo de implementador ya está escrito**: `docs/handoffs/2026-10-28-pistas-python-encargo.md`. Lánzalo
   tal cual, un `implementer` por proyecto, como mucho 4 a la vez, con el proyecto, sus ficheros y su comprobación
   en el prompt. Incluye el script para ver lo que imprimen los ejemplos.
2. **Solo cambian `starter` y `hints`.** `prompt`, `explain`, `solution`, `requirements`, `checks`, `reference` y
   los bancos de examen quedan igual: las reglas de prosa comparan `explain` y `requirements` con la `reference`.
3. **Todas las líneas `nombre = None` del `starter` se conservan.** Las pruebas `accepts`/`rejects` añaden código
   al final del `starter` y `garbageProbes` busca esas líneas. El `starter` no debe aprobar.
4. **Sin `dígito,dígito` en el `starter`, ni en comentarios** (regla de prosa: en Python `-0,5` es una tupla).
   En la prosa de las pistas: decimales con coma, `$` emparejados, nada de «que ya conoces».
5. **Los ejemplos de la pista 2 se ejecutan tras el `starter`** (`defineHintTests`): no pueden usar variables que
   el jugador aún no ha escrito. **Lo que dice cada comentario de salida no lo contrasta ninguna prueba**: hay que
   ejecutarlo (script del encargo) y compararlo. Es el fallo que más se repitió.
6. **`py` se importa de `'../py'`**, no se copia en el fichero.
7. **Los implementadores no hacen commit**: comparten worktree. El coordinador revisa cada diff, ejecuta el script
   de salida y hace `git add` de los dos ficheros por nombre y un commit por proyecto.
8. En el Pyodide del juego, `np.linalg.inv` de una matriz singular devuelve `nan` y no lanza `LinAlgError`
   (`CLAUDE.md`): ninguna pista de Inversa puede decir que salta un error.

## CONSTRAINTS

- Nada fuera de esos 12 ficheros, salvo que una prueba revele un hueco en los ayudantes comunes (dilo antes).
- No cambiar ninguna expectativa existente para que pase. Si una prueba fija el texto viejo de una pista, parar y
  decírselo a Oliver.
- AIlearn es proceso ligero (memoria `ailearn-light-process`): nada de skills de superpowers ni bucles de revisión.
- **Sin push ni merge sin que Oliver lo pida.** Push a `main` = despliegue a producción.
- Sin `git add -A`, `git stash` ni `git reset`.

## HOW TO VERIFY

Desde la raíz del worktree:

1. Por proyecto: `npx vitest run src/games/matrices/<p>.test.ts src/games/matrices/<p>.python.test.ts`, con las
   pruebas `pistas de las preguntas de código del proyecto` incluidas y en verde; y la salida del script del
   encargo coincide con cada comentario de los ejemplos.
2. `grep -l defineHintTests src/games/*/*.python.test.ts` lista 12 ficheros (hoy son 6).
3. Al final: `npm run build`, `npx vitest run tests/content src/ui` en verde, y `npm run e2e` 14 de 14. Si falla
   por tiempo con la máquina cargada, lanzar solo esa prueba (`npx playwright test -g "<nombre>"`) y repetir la
   tanda antes de concluir nada.
4. Informe a Oliver con la rama, los commits y la pregunta de si se hace merge a `main` y push.
