# Proyecto `atencion` — «Atención como matriz», sub «Quién mira a quién»

Idea: each token's embedding x gives a query q = W_Q x, a key k = W_K x and a value v = W_V x. Token i scores token j with qᵢ·kⱼ/√d_k; stacking the tokens as ROWS (Q = X W_Q, as in code and in the paper), the whole score table is the n×n matrix QKᵀ/√d_k. A softmax per ROW turns each row into weights ≥ 0 that add up to 1, and the output of token i is the weighted average of the values: salida = pesos · V. QKᵀ has rank at most d_k (a low-rank matrix, link with `rango-bajo`), its size is n×n (cost grows with the square of the context), and decoders mask the upper triangle (a token does not look at later ones). The learner knows dot product and cosine from game 1 and matrix products from Órbita 0. In the plane vectors are columns; in code the tokens are rows: say it once where it matters.

## ex00 Manipular (verified with NumPy on the snap grid)

1. `atencion.ex00.1` — fixed keys k₁ = (2, 1), k₂ = (−1, 2) (perpendicular); query q movable from (1, 0) (scores 2 and −1). Goals `dot(q, k1) = 5`, `dot(q, k2) = 0` → unique q = (2, 1). Teach: the score is the dot product; a query aligned with a key scores high, one perpendicular to a key scores 0.
2. `atencion.ex00.2` — the key matrix K with rows k₁ = (2, 1) and k₂ = (0, 1) as the plane's transformation: î = (2, 0), ĵ = (1, 1) (the columns of K). q movable from (1, 0), in `apply`, readout `image` (the panel shows it as A·q: say that A is K). Goals `img_x = 3`, `img_y = 1` → unique q = (1, 1). Teach: K·q puts all the scores of q in one vector; stacking all queries as rows of Q, QKᵀ is the whole table of scores in one product.
3. `atencion.ex00.3` — fixed q = (2, 0); key k movable from (1, 0) (score 2, angle 0). Goals `dot(q, k) = 4` and `angle(q, k) = 45` (tol 0.5 on the angle) → k = (2, 2) or (2, −2). Teach: score = |q|·|k|·cos θ; a longer key at 45° scores as much as an aligned key of length 2. Unlike the cosine of game 1, attention scores depend on length too.
4. `atencion.ex00.4` — the query is not the embedding: W_Q = rotation by 90° (î = (0, 1), ĵ = (−1, 0)), fixed key k = (0, 2) shown as a fixed vector; embedding x movable from (1, 0), in `apply` (readout `image`). Goals `img_x(i,j,x) = 0`, `img_y = 2` → unique x = (2, 0). Teach: x = (2, 0) is perpendicular to k (cosine 0), yet its query W_Q x = (0, 2) aligns with k and scores |k|² = 4: what a token looks for is decided by the learned W_Q, not by the direction of its own embedding.
5. `atencion.ex00.5` — mixing the values: the plane's matrix has the value vectors as columns, v₁ = (4, 0) (î) and v₂ = (0, 4) (ĵ); weights w movable from (0,5; 0,5) (output (2, 2)), snap 0.25, range 4 (so the values fit); a fixed helper vector of ones (1, 1) for the goal `dot(w, ones) = 1`; readout `image`. Goals `img_x = 3`, `img_y = 1` and `dot(w, ones) = 1` → unique w = (0,75; 0,25). Teach: the output is a weighted average of the values; with weights ≥ 0 that add up to 1 it lies on the segment between v₁ and v₂, here three quarters of v₁ and one quarter of v₂.

## ex01 Calcular (recompute everything)

1. `numero`: scaled score with d_k = 4: q = (1, 2, 0, 1), k = (2, 1, 1, 0) → (2 + 2 + 0 + 0)/√4 = 2.
2. `vector`: softmax of a row of scores, e.g. (1, 0) → (0,73; 0,27), or (2, 0, 0) → (0,79; 0,11; 0,11); tol 0.01. Recompute with NumPy.
3. `vector`: output from weights (0,5; 0,25; 0,25) and values (4, 0), (0, 4), (4, 4) → (3, 2).
4. `numero`: the score table has n×n entries; if the context goes from 1000 to 4000 tokens, by how much does the number of scores multiply? → 16.
5. `opcion`: why divide by √d_k: with d_k components the dot products of unrelated vectors grow (their spread grows like √d_k) and large scores make the softmax put almost all the weight on one key, which also leaves tiny gradients. Distractors: to turn scores into probabilities (that is the softmax), to make the vectors unit length (that is the cosine), to make it faster.

## Sheets (3)

- `codigo`: a softmax with `axis=0` (columns add up to 1 instead of rows) — faulty.
- `texto`: a reasoning that scales by √n (the number of tokens) instead of √d_k — faulty line.
- one correct (`faultyLine: null`), e.g. reading which token a row of weights attends to.

## Exam (fixed entries)

- Phase A: one `opcion` (e.g. what the causal mask does to the weights, or what row i of the weights means) and one `numero`/`vector` (e.g. the output of one token from given weights and values, or the shape of QKᵀ). The generated entry `examen-3.puntuacion-atencion` (q·k/√4 with random integer q, k of 4 components) is the parent's: do not duplicate it.
- Phase B: one `codigo` (e.g. scores and row softmax for given Q and K).

## ex02 Programar (phase B) — suggestions, one step each

1. Scores: Q (3×4) and K (5×4) → `d = Q.shape[1]`, `S = Q @ K.T / np.sqrt(d)`, shape (3, 5); maybe also `np.linalg.matrix_rank(Q @ K.T)` ≤ d with more tokens than d. Typical mistakes: `Q @ K` (shape error), forgetting the scaling, dividing by √n.
2. A function `softmax_filas(S)` that is stable (subtract the row maximum) and normalizes each row with `axis=1, keepdims=True`; tested with other data, including large scores that overflow without the subtraction. Typical mistakes: `axis=0`, no `keepdims`, no maximum subtracted.
3. Output: `pesos`, `salida = pesos @ V`, `mas_atendido = pesos.argmax(axis=1)`. Typical mistakes: `V @ pesos`, `argmax` along the wrong axis.
4. A function `atencion(Q, K, V)` returning `(salida, pesos)`, tested with other shapes (number of queries ≠ number of keys, d_v ≠ d_k).
5. AI application, causal mask: `mascara = np.triu(np.ones((n, n), dtype=bool), k=1)`, scores set to `-np.inf` there (`np.where`), then the softmax: the first row is (1, 0, …, 0) and the upper triangle of the weights is 0. Typical mistakes: `k=0` (masks the diagonal too: the first row becomes nan), masking after the softmax.

Warm-up (phase B): `.T`, `np.exp`, `axis=1, keepdims=True` and why, `np.triu`, `np.where`, `-np.inf` in a softmax, `argmax(axis=1)`. Own names and data.
