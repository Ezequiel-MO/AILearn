# Encargo común: Órbita 3 «Descomponer y aproximar» del juego 2 «Matrices y transformaciones»

Worktree: `/home/olive/projects/AIlearn/.claude/worktrees/orbita-3-matrices` (branch `worktree-orbita-3-matrices`). Work ONLY inside this directory and run every command from it. `node_modules` is a symlink to the main checkout: never `npm install`, never `git add` it (it shows as untracked; that is expected).

Read first: `CLAUDE.md` and `README.md` of the worktree (they are the authority: strict TS, all visible text in Spanish, identifiers in English, decimal comma in prose, `// contract:` on every test expectation, content is serializable data, no `any`). Light process: do not spawn agents, no superpowers skills, no plan/spec files.

## Where this orbit sits

The game already has Despegue, Órbita 0 «La máquina» (columns as images of î and ĵ, A·v, composition), Órbita 1 «El área» (determinant, inverse, rank, image and kernel) and Órbita 2 «Direcciones propias» (eigenvectors, symmetric matrices and covariance, PCA with `np.linalg.eigh`). The learner already knows all of that: build on it, do not re-teach it, do not repeat its questions.

Órbita 3 «Descomponer y aproximar» has three projects, in this order, opened at the same time:

| id | `name` (exact, from `src/games/roadmap.ts`) | `sub` | export | exam file / export |
|---|---|---|---|---|
| `svd` | `SVD` | `Girar, estirar, girar` | `svd` | `examen-3-svd.ts` / `examen3Svd` |
| `rango-bajo` | `Rango bajo y LoRA` | `Comprimir y afinar` | `rangoBajo` | `examen-3-rango-bajo.ts` / `examen3RangoBajo` |
| `atencion` | `Atención como matriz` | `Quién mira a quién` | `atencion` | `examen-3-atencion.ts` / `examen3Atencion` |

Roadmap line: math «Descomposición en valores singulares, aproximación de rango bajo, matriz de similitudes QKᵀ»; AI «Comprimir pesos, afinar un modelo con LoRA y leer la atención como producto de matrices». The arc: SVD (every matrix is rotate · stretch · rotate) → keep only the big pieces (low rank, compression, LoRA) → attention, where QKᵀ is a matrix of dot products of rank at most d_k. Each project ends its arc with an AI application. Your project file tells you the question-by-question design.

## Models to copy (the latest standard)

Órbita 2 of this same game is the model, especially PCA: `src/games/matrices/pca.ts`, `pca.test.ts`, `pca.python.test.ts`, `pca.calentamiento.ts`, `examen-2-pca.ts` (also `autovectores.*`, `simetricas.*`). Copy their structure, tone and length exactly:
- ids `<proj>.ex00.N`, `<proj>.ex01.N`, `<proj>.ex02.N` (N = 1..5) and `<proj>.hoja.N` (N = 1..3); kinds in order `manipular`, `calcular`, `programar`, 5 questions each; 3 `revision` sheets mixing `format: 'codigo'` and `'texto'`, exactly one with `faultyLine: null`, prompts ending with the common sentence the models use.
- every `manipular` and every «Calcular» question (`numero`, `vector`, `opcion`) carries `purpose` (`why`, `aim`, `takeaway`; 60 to 700 characters each, all distinct within the project). Rules in README «Añadir una pregunta», points 2 and 3, enforced by `tests/content/purpose.test.ts` (your projects are NOT in its `PENDING` list). `why` says where this shows up in a real AI system and which decision it helps make, **without inventing data or figures**; `aim` what the learner builds/calculates, without the answer; `takeaway` the conclusion and its consequence in the real system.
- every `codigo` question of a project «lleva de la mano»: README «Añadir una pregunta», point 4 (starter with `# PASO N.` blocks, three hints: plan / pieces with `py(...)` / skeleton with `___`, `requirements`, gated `check` messages). Model: `pca.ts` ex02 and `pca.python.test.ts` (it uses `hintBlocks`/`fillSkeleton`/`defineHintTests` from `tests/content/python-helpers.ts`).
- plane helper `src/games/matrices/plane.ts`: `transformPlane({ i?, j?, movable?, extra?, apply?, readouts?, range?, snap? })` → vectors `i` (label î) and `j` (label ĵ) as the matrix columns, plus `extra`. PCA adds `circle: 1, circleImage: true` to draw the image of the unit circle (an ellipse; with a singular matrix it degenerates into a segment, which is fine).

## Plane features available (README «Matrices en el plano»)

- Goal metrics: `x`, `y`, `norm`, `distance`, `sum_x`, `sum_y`, `dot`, `cos`, `angle` (degrees), `proj`, `det` (of [a, b]), `img_x`, `img_y`, `img_angle`, `rayleigh` and — **new for this orbit, commit c001064** — `stretch`: of `['i','j','v']`, value |A·v| / |v|, independent of the length of v, NaN when v is null (so a null v never satisfies a `stretch` goal). Its maximum over directions is σ₁ and its minimum σ₂.
- Readouts per id of `transform.apply`: `image` (A·v), `img_angle`, `rayleigh` and the new `stretch` (shown as `|A·v| / |v|`). `matrix`, `det` need `transform`. Pair readouts (`distance`, `sum`, `dot`, `cos`, `angle`, `projection`) compare the two ids of `pair`. Choose readouts on purpose: show the instrument the question is about, hide what the learner should reason out.
- Goals are equalities with tolerance (no inequalities). At most 2 movable vectors; with 2 movable keep `range` ≤ 6 and `snap` ≥ 0.5. The goal must be reachable on the snap grid and not solved at the start (the generic tests and `checkReachable` / `checkStartNotSolved` from `src/content/validate.ts` check both).
- Make the plane fit: every fixed vector within `range` (see `src/games/matrices/orbita-2-planos.test.ts`), and pick `range` so the ellipse and the image of the expected solution are visible.
- The plane always calls the matrix `A` in its readouts. If your prose calls it `K`, `W` or `ΔW`, say once in the prompt that the panel shows it as $A$.
- `vector` questions accept `shape: [rows, cols]` (row-major `answer`) when the answer is a matrix.

## Content rules that bite

- Prose rules (`tests/content/prose-helpers.ts`, wired with `defineProseTests`): no loose `$`, KaTeX strict, no decimal point in prose (use `{,}` in formulas and «,» in text), pairs with decimals separated by «; », no English NumPy errors or dangerous Markdown in check messages, game vocabulary. Large integers: write them without thousands dots (a dot looks like a decimal point), e.g. `$65\,536$` or `65536`.
- Python in the game: Pyodide, NumPy as `np`, matplotlib as `plt`, `check(cond, "mensaje")` in `checks`, messages in Spanish that guide the learner, no checking of code text. In this Pyodide `np.linalg.inv` of a singular matrix returns `nan` instead of raising. Floats from `svd`/`eigh` carry rounding noise and arbitrary signs: checks use `np.allclose` / `np.isclose` and accept both signs of a singular vector when the sign is arbitrary.
- Recompute every number yourself. A wrong answer is the worst defect. To run NumPy locally there is a launcher with the project's Pyodide: write a scratch script in your session scratch directory (never inside the repo) and run, from the worktree root, `node docs/handoffs/2026-11-02-orbita-3-matrices/pyrun.mjs <script.py>`.
- Real AI facts you may use in `why`/`takeaway` (stay with these or with things you are certain of; no invented percentages or model sizes): LSA (latent semantic analysis) built word and document vectors with a truncated SVD of a term–document matrix, an ancestor of embeddings; the largest singular value σ₁ (spectral norm) is the most a layer can lengthen an input, and spectral normalization divides a weight matrix by σ₁ to keep training stable (used in GAN discriminators); the condition number σ₁/σₙ measures how unevenly a matrix stretches, and orthogonal initialization makes every σ equal to 1; LoRA (Hu et al., 2021) freezes W and trains ΔW = BA with B of d×r and A of r×k, r small (4, 8, 16 are typical), B starts at zero so the model starts unchanged, and BA can be merged into W after training, so inference costs nothing extra; the original paper applied it to the attention projection matrices; attention (Vaswani et al., 2017) is softmax(QKᵀ/√d_k)·V, the √d_k keeps the dot products from growing with the dimension and saturating the softmax; decoders like GPT use a causal mask so a token cannot look at later tokens; the score matrix is n×n, so the cost grows with the square of the context length.

## Exam bank

Each project gets 3 FIXED entries in its `examen-3-<proj>.ts` (`project: '<proj>'`, ids `examen-3.<tema>`, unique in the whole game, also against project question ids): one `opcion`, one `numero` or `vector`, one `codigo`. Bank questions carry no `purpose` and need not «llevar de la mano», but the `codigo` one has `requirements` and is tested in `<proj>.python.test.ts`. Reserved ids (generated entries added by the parent; do not use them): `examen-3.valores-singulares`, `examen-3.parametros-lora`, `examen-3.puntuacion-atencion`. Do not repeat a project question in the bank; vary the numbers and the angle.

## Two phases per project

Each project is built in two sequential tasks by different implementers.

**Phase A — Manipular, Calcular, hojas, two exam entries.** Create:
- `src/games/matrices/<proj>.ts` exporting the `Project` with exercises `manipular` and `calcular` complete (5 + 5), the 3 sheets, and the programar exercise as a placeholder `{ kind: 'programar', questions: [] }` (phase B fills it; no `warmup` yet). Header comment like the models.
- `src/games/matrices/examen-3-<proj>.ts` with the `opcion` and the `numero`/`vector` fixed entries (phase B adds the `codigo` one).
- `src/games/matrices/<proj>.test.ts`: `defineProseTests('proyecto <proj>', projectQuestions(X))` and `defineProseTests('banco examen-3 <proj>', bankQuestions)`; identity (id, name, sub); kinds and counts (programar may be empty for now); id patterns; per-question values with `// contract: encargo de la Órbita 3 de matrices, ...`: goals, plane matrices, that the intended solution positions satisfy the goals and that the didactic wrong positions do not (recompute with `measure` from `src/engine/vectors.ts`), `checkReachable(q)` and `checkStartNotSolved(q)` empty for every manipular, fixed vectors inside `range`, every calcular answer recomputed in the test from its data (like `pca.test.ts` does) and graded correct with `grade`, sheets' faulty lines, bank entries valid with `bankEntrySchema`. Do NOT assert `checkProject(X)` yet (the empty programar fails the schema; phase B adds that test).

**Phase B — Programar, calentamiento, the `codigo` exam entry.** Edit `<proj>.ts` (fill ex02 with 5 `codigo` questions «de la mano»; add `warmup: <camel>Warmup`), create `src/games/matrices/<proj>.calentamiento.ts` (1 to 4 fichas with what is new in Python/NumPy for this project's ex02; own names and data; self-contained, since the three projects open at the same time; model `pca.calentamiento.ts`), create `src/games/matrices/<proj>.python.test.ts` (for every codigo question of the project and of its bank: reference passes, starter fails, 1–2 alternative correct solutions accepted, 1–3 typical mistakes rejected with a Spanish message and no Python error, hint examples run and the filled skeleton passes — copy `pca.python.test.ts`), add the `codigo` entry to `examen-3-<proj>.ts`, and extend `<proj>.test.ts` (`checkProject(X)` is `[]`, warmup of 1 to 4 fichas, ex02 has five codigo questions, figures in ex02 solutions recomputed, the checks' messages wrapped like the models'). The «Programar» questions must not repeat each other or the warm-up's reto; each teaches one step and the last one is the AI application.

## Parallel work — strict file ownership

Other implementers work at the same time in this worktree on the other projects and on `src/content/generators.ts`. You own ONLY the files of your project listed above. Do NOT edit `src/games/matrices/index.ts`, `plane.ts`, other projects, `src/games/index.ts`, generators, schema, engine, UI, README, CLAUDE.md or any shared file: the parent assembles the orbit afterwards. If you need a helper, define it locally in your file. If you think a shared change is needed, say so in the report.

While others work, `npm run check` may show errors in THEIR files; only errors in your files are yours. Do not fix theirs; mention them. Commit only your files by name (`git add <files>` then `git commit`); never `git add -A`, `git stash`, `git reset`, never push. If git reports that `index.lock` exists, wait a few seconds and retry.

## Checks before finishing

- `npm run check`: no errors in your files.
- `npx vitest run src/games/matrices/<proj>` green, from the worktree root (Pyodide tests need 10+ s cold; if one times out, rerun it alone before concluding).
- `npx prettier --check` on your files (`npx prettier --write` them first).
- Commit message — phase A: `feat(matrices): proyecto <Nombre>, Manipular, Calcular, hojas y dos entradas del examen`; phase B: `feat(matrices): proyecto <Nombre>, Programar de la mano, calentamiento y entrada de código del examen`. End with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

If you pass about 60 tool calls, stop at the next green/red checkpoint and report what remains.

Report: files; a one-line summary of each question you wrote (and of each sheet, exam entry and ficha); the test results you observed; the commit hash; anything you think should change in shared files; and `RISKS:` (anything that could break when the parent registers the orbit in the game, or that a later phase must know).
