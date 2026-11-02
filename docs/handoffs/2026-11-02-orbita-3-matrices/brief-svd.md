# Proyecto `svd` — «SVD», sub «Girar, estirar, girar»

Idea: every matrix, symmetric or not, with or without real eigenvectors, has two perpendicular input directions v₁, v₂ that it sends to two perpendicular output directions u₁, u₂, stretched by σ₁ ≥ σ₂ ≥ 0: A = UΣVᵀ (Vᵀ turns, Σ stretches along the axes, U turns). The unit circle becomes an ellipse whose semi-axes are σ₁u₁ and σ₂u₂. σ² are the eigenvalues of AᵀA; |det A| = σ₁σ₂; the rank is the number of non-zero σ; for a symmetric matrix σ = |λ|. AI: σ₁ is the most a layer can lengthen an input (spectral norm, spectral normalization), σ₁/σ₂ says how unevenly it stretches (condition number, orthogonal initialization), small σ mean directions the layer almost erases (numerical rank), and truncated SVD was how LSA built the first word vectors. Leave sums of rank-1 pieces and truncation for the next project (`rango-bajo`): mention them at most once as «lo verás en el siguiente proyecto».

## ex00 Manipular (verified with NumPy on the snap grid)

All five: `circle: 1, circleImage: true`, readout `stretch` (plus `image` or `matrix` where it helps), tol 0.01 on `stretch` goals. Pick `range` so the image of the expected solution fits (e.g. 4 or 5 for ex00.1–2: A·(1,1) = (4, 0)).

1. `svd.ex00.1` — A = (2 2; −1 1): î = (2, −1), ĵ = (2, 1). v movable from (1, 0) (stretch there √5 ≈ 2,24). Goal `stretch(i,j,v) = 2.83` → any v on the line of (1, 1); A·(1,1) = (4, 0). Teach: this matrix has NO real eigenvalues (λ² − 3λ + 4 = 0 has no real roots: every arrow turns), yet there is a direction it stretches the most: σ₁ = 2√2 ≈ 2,83, the long semi-axis of the ellipse. The SVD always exists.
2. `svd.ex00.2` — same A, v from (1, 0). Goal `stretch = 1.41` → v on the line of (1, −1); A·(1,−1) = (0, −2). Teach: the least-stretched direction (σ₂ = √2 ≈ 1,41) is perpendicular to v₁, and the two images (4, 0) and (0, −2) are perpendicular too: V gives the input directions, U the output ones. σ₁σ₂ = 4 = |det A|.
3. `svd.ex00.3` — A with perpendicular columns: î = (2, −2), ĵ = (1, 1). Two movable v from (1, 1) and w from (1, −1) (both start at stretch √5 ≈ 2,24); snap ≥ 0.5, range ≤ 6. Goals `stretch(v) = 2.83`, `stretch(w) = 1.41` → v on the x axis, w on the y axis. Teach: when the columns are already perpendicular, v₁ and v₂ are î and ĵ themselves and the σ are the lengths of the columns, |(2,−2)| = 2√2 and |(1,1)| = √2.
4. `svd.ex00.4` — symmetric A = (1 2; 2 1) (eigenvalues 3 and −1). v from (1, 0) (stretch √5). Goal `stretch = 1` → v on (1, −1); A·(1,−1) = (−1, 1), the arrow is flipped. Teach: singular values are never negative: for a symmetric matrix σ = |λ| = 3 and 1, and the sign goes into U (u₂ = −v₂). In PCA, with a covariance (positive eigenvalues), SVD and eigen-decomposition coincide.
5. `svd.ex00.5` — î fixed at (2, 1), ĵ movable from (0, 1); fixed probes p = (1, 1) and q = (1, −1) in `apply`, readout `stretch` for both. Goals `stretch(i,j,p) = 2.24` and `stretch(i,j,q) = 2.24` → ĵ = (−1, 2) or (1, −2) (only these two on the grid; at the start the stretches are 2 and 1,41). Teach: σ₁ = σ₂ = √5: the ellipse is a circle, A is a rotation (or a reflection) times √5, condition number 1; orthogonal initialization keeps every direction equally long through the layers.

## ex01 Calcular (types and data suggested; recompute everything)

1. `vector`: singular values of A = (3 0; 0 −5), from largest to smallest → [5, 3]. Teaches: σ ≥ 0 (the sign of −5 goes into U) and they are ordered from largest to smallest, as `np.linalg.svd` returns them.
2. `numero`: σ₁ of A = (3 0; 4 5) via AᵀA = (25 20; 20 25), eigenvalues 45 and 5 → σ₁ = √45 ≈ 6,71 (tol 0.01). Teaches σ² = eigenvalues of AᵀA.
3. `numero`: a 2×2 matrix has singular values 4 and 0,5; by how much does it multiply areas? → 2 (= |det|). Optionally ask for det's absolute value.
4. `numero`: a layer W has singular values (6; 2; 0,5); an input x has norm 3; the largest possible norm of Wx → 18 (spectral norm). The `why` can mention spectral normalization.
5. `opcion`: `np.linalg.svd` of a 3×3 weight matrix gives S = (8,3; 2,1; 0,0000000004) (write the tiny value in a readable way); its rank in practice → 2 (the third value is rounding noise; `np.linalg.matrix_rank` compares the σ with a tolerance). Distractors: 3 (all are non-zero), 1, «no se puede saber sin la matriz».

## Sheets (3)

- `codigo`: a short script that takes `v1 = Vt[:, 0]` (column instead of row) — faulty.
- `texto`: a reasoning that says the singular values of (1 2; 2 1) are 3 and −1 — faulty line.
- one correct (`faultyLine: null`), e.g. a reasoning that uses |det A| = σ₁σ₂ or the ellipse.

## Exam (fixed entries)

- Phase A: one `opcion` (e.g. a matrix with no real eigenvalues: does it have an SVD, and what does each factor of UΣVᵀ do?) and one `numero`/`vector` (e.g. condition number σ₁/σ₂ of a given diagonal or perpendicular-columns matrix, or the largest output norm). The generated entry `examen-3.valores-singulares` (singular values of a matrix with perpendicular columns) is the parent's: do not duplicate it.
- Phase B: one `codigo` (e.g. compute `S` and the condition number `kappa = S[0] / S[-1]` of a given matrix).

## ex02 Programar (phase B) — suggestions, one step each

1. `U, S, Vt = np.linalg.svd(A)` for A = (3 0; 4 5); save `sigma1`, `v1` (first ROW of `Vt`) and `u1` (first COLUMN of `U`); the check confirms `A @ v1 ≈ sigma1 * u1`. Typical mistakes: `Vt[:, 0]`, `U[0]`.
2. Rebuild a 3×2 matrix (a layer from 2 to 3 dimensions) with `full_matrices=False`: `A_rec = U @ np.diag(S) @ Vt`. Typical mistakes: `U @ S @ Vt` with S one-dimensional; the full 3×3 U that does not fit.
3. σ from eigenvalues: `np.sqrt` of `np.linalg.eigvalsh(A.T @ A)` reversed, compared with `S`. Typical mistakes: not reversing, forgetting the square root, `A @ A.T` on a non-square A (an extra zero).
4. Numerical rank: a 4×3 matrix whose third column is the sum of the other two (float noise) → `rango` = number of σ above a relative tolerance (2). Typical mistakes: `len(S)` or `np.sum(S > 0)`, both 3.
5. AI application: spectral normalization of a weight matrix W (fixed numbers or `np.random.default_rng(0)`): `sigma_max = S[0]`, `W_sn = W / sigma_max`; check that the largest singular value of `W_sn` is 1 and that no input of norm 1 comes out longer than 1.

Warm-up (phase B): `np.linalg.svd` returns three things (U, S as a 1-D array from largest to smallest, Vt whose ROWS are the v), `np.diag`, `full_matrices=False`, `compute_uv=False` if useful. Own names and data.
