# Proyecto `rango-bajo` — «Rango bajo y LoRA», sub «Comprimir y afinar»

Idea: A = σ₁u₁v₁ᵀ + σ₂u₂v₂ᵀ + …, a sum of rank-1 pieces (outer products). A rank-1 matrix u vᵀ reads its input only along v (the number v·x) and always writes along u: it erases the whole hyperplane perpendicular to v. Keeping the k largest pieces gives the best rank-k approximation A_k (Eckart–Young): its error in the worst direction is σ_{k+1}, its Frobenius error is √(sum of the dropped σ²), and it keeps the fraction (σ₁² + … + σ_k²)/(sum of all σ²) of the «energy». Storing A_k costs k·(m + n) numbers (two thin factors) instead of m·n. LoRA fine-tunes a frozen W (d×k) by training only ΔW = BA, with B of d×r and A of r×k: r·(d + k) parameters instead of d·k, rank(BA) ≤ r, B starts at zero, and W + BA can be merged after training. The learner knows SVD from the previous project (it opens at the same time, so recall the essentials briefly: σ, u, v, `np.linalg.svd`, without depending on its exercises).

## ex00 Manipular (verified with NumPy on the snap grid)

Readouts `stretch` and/or `image`; `circle: 1, circleImage: true` where the ellipse (or the segment it collapses into) helps; tol 0.01.

1. `rango-bajo.ex00.1` — rank-1 A = (2,1)·(1,1)ᵀ = (2 2; 1 1): î = ĵ = (2, 1). v from (1, 0). Goal `stretch = 0` (a null v gives NaN and does not count) → v on the line of (1, −1). Teach: a rank-1 matrix reads only v·x with v = (1, 1); everything perpendicular to it is erased; the ellipse collapses to a segment along u = (2, 1); σ₂ = 0.
2. `rango-bajo.ex00.2` — same A, v from (1, 0) (stretch √5 ≈ 2,24). Goal `stretch = 3.16` (√10) → v on the line of (1, 1). Teach: the only non-zero singular value of u vᵀ is |u|·|v| = √5·√2 = √10; every image lies on the line of u; A = σ₁u₁v₁ᵀ with u₁ = u/|u|, v₁ = v/|v|.
3. `rango-bajo.ex00.3` — build a rank-1 update: î and ĵ movable from the identity (1, 0), (0, 1), snap 1, range 3; fixed probes p = (1, 1) and q = (1, −1) in `apply`, readout `image`. Goals `img_x(p) = 2`, `img_y(p) = 4`, `img_x(q) = 0`, `img_y(q) = 0` → unique solution î = ĵ = (1, 2). Teach: ΔW = (1,2)·(1,1)ᵀ reacts only to the part of the input along (1, 1) and always writes along (1, 2): that is LoRA with r = 1 — B (a column) says where it writes, A (a row) what it reads. Mention that the panel calls the matrix $A$.
4. `rango-bajo.ex00.4` — best rank-1 approximation of A = (2 1; 1 2) (σ = 3 and 1, v₁ = (1,1)/√2): î, ĵ movable starting AT A, (2, 1) and (1, 2); snap 0.5, range 3; probes p = (1, 1), q = (1, −1). Goals `img_x(p) = 3`, `img_y(p) = 3`, `img_x(q) = 0`, `img_y(q) = 0` → unique solution î = ĵ = (1,5; 1,5). At the start A·p = (3, 3) already but A·q = (1, −1), so it is not solved. Teach: A₁ = σ₁u₁v₁ᵀ = (1,5 1,5; 1,5 1,5) keeps what A does along its main direction and sends the weak one to 0; the error in the worst direction is σ₂ = 1; it keeps 9/10 = 90 % of the energy.
5. `rango-bajo.ex00.5` — same rank-1 A as ex00.1, v from (1, 0) (A·v = (2, 1)). Goals `img_x = 4`, `img_y = 2` → many solutions: any v with x + y = 2, e.g. (2, 0), (1, 1), (0, 2), (3, −1). Teach: a rank-1 layer cannot tell apart inputs with the same v·x: that information is gone. That is the price of low rank (a compressed layer loses detail) and also why a LoRA update with small r can only change the model in a few directions.

## ex01 Calcular (recompute everything)

1. `vector` with `shape: [2, 3]`: outer product u vᵀ with u = (1, 2), v = (3, −1, 2) → [[3, −1, 2], [6, −2, 4]] (rows proportional: rank 1).
2. `numero`: storage. A 1000×800 matrix and its rank-20 approximation stored as two thin factors (1000×20 and 20×800, the σ absorbed into one of them): 20·(1000 + 800) = 36000 numbers instead of 800000. State the storage convention explicitly in the prompt.
3. `opcion`: σ = (6, 3, 2, 1); the smallest k that keeps at least 90 % of the energy → k = 2 (k = 1 keeps 36/50 = 72 %; k = 2, 45/50 = 90 %).
4. `numero`: same σ, Frobenius error of the best rank-2 approximation → √(2² + 1²) = √5 ≈ 2,24 (tol 0.01).
5. `numero`: LoRA on a 4096×4096 matrix with r = 8 → trainable parameters 8·(4096 + 4096) = 65536 (vs 16777216 for the full ΔW). Write the big numbers without thousands dots.

## Sheets (3)

- `codigo`: truncation with `Vt[:, :k]` instead of `Vt[:k, :]` (or `U[:k]`) — faulty.
- `texto`: a LoRA parameter count that multiplies d·k·r — faulty line.
- one correct (`faultyLine: null`), e.g. the energy percentage of a truncation.

## Exam (fixed entries)

- Phase A: one `opcion` (e.g. why B starts at zero: the fine-tuned model starts identical to the original; or the rank of BA is at most r) and one `numero`/`vector` (e.g. the error σ_{k+1} in the worst direction, or a storage count with other sizes). The generated entry `examen-3.parametros-lora` (r·(d + k) with random d, k, r) is the parent's: do not duplicate it.
- Phase B: one `codigo` (e.g. truncate a given matrix to rank 1 and report its error).

## ex02 Programar (phase B) — suggestions, one step each

1. `np.outer(u, v)` builds a rank-1 matrix; `np.linalg.matrix_rank` gives 1; for an input x, `A @ x` equals `(v @ x) * u`. Typical mistakes: `u * v` (element-wise), `np.outer(v, u)` (transposed).
2. Truncated SVD of a fixed 4×4 (or 5×4) matrix: `A1` and `A2` with `U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]`; they equal the sum of the first k outer products σᵢuᵢvᵢᵀ. Typical mistakes: `Vt[:, :k]`, `U[:k]`.
3. Energy and error: `energia = np.cumsum(S**2) / np.sum(S**2)`, `k90` = the smallest k with energy ≥ 0,9, and the Frobenius error `np.linalg.norm(A - A_k)` equals `np.sqrt(np.sum(S[k:]**2))`. Typical mistakes: S without squaring, off-by-one in k.
4. Compress a weight matrix W (with a fixed seed): factors `B = U[:, :k] * S[:k]` (scales the columns) and `A = Vt[:k]`, `numeros = B.size + A.size` vs `W.size`, `np.allclose(B @ A, W_k)`. Typical mistakes: `U[:, :k] @ S[:k]` (a vector), scaling rows instead of columns.
5. AI application, LoRA: frozen W (6×4), B = zeros (6×2), A random (2×4): at the start `W @ x + B @ (A @ x)` equals `W @ x`; with a given trained B, `W_fusionada = W + B @ A` gives the same output in one product; `entrenables = B.size + A.size`; `np.linalg.matrix_rank(B @ A) <= 2`. Typical mistake: `A @ B` (an r×r matrix).

Warm-up (phase B): `np.outer`, slicing the first k columns/rows (`M[:, :k]`, `M[:k]`), broadcasting a row of factors over columns (`M * s`), `.size`, `np.cumsum`. Own names and data.
