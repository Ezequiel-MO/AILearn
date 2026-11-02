# Encargo: generadores del examen de la Órbita 3 de matrices

Worktree: `/home/olive/projects/AIlearn/.claude/worktrees/orbita-3-matrices` (branch `worktree-orbita-3-matrices`). Work ONLY inside this directory and run every command from it. `node_modules` is a symlink: never `npm install`, never `git add` it. Read `CLAUDE.md` and `README.md` first (strict TS, visible text in Spanish, identifiers in English, decimal comma, `// contract:` on every test expectation). Light process: do not spawn agents, no superpowers skills, no plan files.

Context: the game «Matrices y transformaciones» gets its Órbita 3 «Descomponer y aproximar» with three projects: `svd` (singular values: A = UΣVᵀ, σ ≥ 0 ordered from largest to smallest, σ² are the eigenvalues of AᵀA, with perpendicular columns the σ are the column lengths), `rango-bajo` (low-rank approximation and LoRA: ΔW = BA with B of d×r and A of r×k, r·(d + k) trainable parameters instead of d·k) and `atencion` (attention scores qᵢ·kⱼ/√d_k, softmax per row, weighted average of values). Each orbit's exam bank has one generated entry per project, so every exam has different numbers.

## Your files (only these)

`src/content/generators.ts` and `src/content/generators.test.ts`. Other implementers are writing project files in `src/games/matrices/` at the same time: do not touch anything else. `npm run check` may show errors in their files: ignore them (mention them in the report). Commit only your two files by name; never `git add -A`, `git stash`, `git reset`, never push; if `index.lock` exists, wait and retry.

## The three generators

Follow exactly the pattern of the Órbita 2 generators (`autovalores`, `covarianza`, `varianza-explicada`): `Generator` with `id`, `bounds` (limits of every component of the answer), `make(id, params, rng)` returning a `numeroQ` or `vectorQ` built with the helpers (`tex`, `tuple`, `paren`, `matrix2Tex`, `int`, `clean`…), a prompt, two hints, an `explain` that addresses the likely mistake, and a `solution` that shows the numbers of this draw and the typical wrong result. Register them in `generators` and add them to `IDS` and to the bounds table in `generators.test.ts` (each generator also gets its own `describe` with a few checks of its maths over many seeds, like the Órbita 2 ones). Generator ids are global to all games.

1. `valores-singulares` (project `svd`), `vector`, answer [σ₁, σ₂] from largest to smallest, tol 0. A 2×2 matrix with integer entries and PERPENDICULAR columns of integer lengths, so σ are the column lengths. Build it as A = R·diag(s₁, s₂)·P where R is either a signed permutation or the 3-4-5 rotation/reflection ((3 −4; 4 3)/5 and its variants), the s are positive integers (multiples of 5 when R is a 3-4-5 one) and P is a signed permutation, so that sometimes the shorter column comes first (ordering matters) and sometimes entries are negative (signs do not matter). Keep entries within |12|, never a diagonal matrix with both entries positive and already ordered (too easy), and σ₁ ≠ σ₂. Hints: σ² are the eigenvalues of AᵀA; when the columns are perpendicular, AᵀA is diagonal and σ are the lengths of the columns. Solution: AᵀA computed, its diagonal, the square roots, the ordering. Typical mistakes: answering in column order instead of from largest to smallest; a negative σ.
2. `parametros-lora` (project `rango-bajo`), `numero`, tol 0. A frozen weight matrix W of d×k (d and k drawn from {64, 128, 256, 512, 768, 1024}, may be different) and a LoRA update ΔW = BA of rank r ∈ {1, 2, 4, 8, 16}; how many parameters are trained? → r·(d + k). Hints: the shapes of B and A; count the entries of each. Solution: d·r + r·k, and the comparison with d·k (the fraction trained). Typical mistakes: d·k·r, or d·k. Write large numbers without thousands dots in the text (a dot looks like a decimal point).
3. `puntuacion-atencion` (project `atencion`), `numero`, tol 0. A query q and a key k with 4 integer components in [−3, 3] each (d_k = 4, so √d_k = 2), not both null, with q·k ≠ 0; the scaled score q·k/√d_k → a multiple of 0,5. Hints: the dot product; divide by √d_k, not by d_k. Solution: the products term by term, the sum, the division. Typical mistakes: dividing by 4 (d_k instead of its root), not dividing.

The ids of the generated bank entries will be `examen-3.valores-singulares`, `examen-3.parametros-lora` and `examen-3.puntuacion-atencion` (the parent adds them to the bank; you only write the generators).

Prose rules: the generated questions are checked by the content tests once the parent registers the bank (`tests/content/prose-helpers.ts`: KaTeX strict, decimal comma, pairs with decimals separated by «; », no loose `$`). Test yourself that a draw's prompt, hints, explain and solution pass those rules: look at how `generators.test.ts` already does it for the existing generators and do the same for the new ones (if it does not, apply `defineProseTests` or the prose rules to a few resolved draws in your describe).

Recompute your maths: there is a launcher with the project's Pyodide and NumPy if you want to cross-check (`node docs/handoffs/2026-11-02-orbita-3-matrices/pyrun.mjs <script.py>` from the worktree root; keep scratch scripts in your session scratch directory, never in the repo).

## Checks before finishing

- `npm run check`: no errors in your files.
- `npx vitest run src/content/generators.test.ts` green (200 seeds per generator: schema, bounds, own answer accepted).
- `npx prettier --check` on your two files.
- Commit: `feat(matrices): generadores valores-singulares, parametros-lora y puntuacion-atencion para el examen de la Órbita 3`, ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

Report: what each generator draws (ranges, how many distinct questions roughly), one example draw of each (prompt and answer), the tests you observed, the commit hash, and `RISKS:`.
