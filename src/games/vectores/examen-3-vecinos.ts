import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 3 para el proyecto «Vecinos y top-k». La pregunta
 * con números variables (la puntuación del documento que gana) la añade otro paso, como entrada
 * `generada`. Ids: `examen-3.<tema>`, únicos en todo el juego (también frente a las preguntas de proyecto).
 */
export const examen3Vecinos: BankEntry[] = [
  {
    project: 'vecinos',
    question: {
      id: 'examen-3.coste-busqueda',
      type: 'numero',
      prompt:
        'Una base de conocimiento tiene 3 millones de documentos y cada uno tiene un embedding de 384 componentes (los de all-MiniLM-L6-v2 tienen 384). La búsqueda exacta puntúa una consulta contra todos los documentos con `E @ q`, con una multiplicación por cada número de `E`. ¿Cuántos millones de multiplicaciones cuesta puntuar **una** consulta?',
      hints: [
        '`E` tiene una fila por documento y una columna por componente: cuenta cuántos números tiene en total.',
        'Multiplica el número de documentos por el de componentes, y pasa el resultado a millones.',
      ],
      explain:
        'El coste de una consulta es el número de documentos por el de componentes. Con la base entera, el cálculo se repite en cada consulta, y por eso se buscan índices que no puntúen todos los documentos.',
      solution:
        '$3\\,000\\,000\\cdot384=1\\,152\\,000\\,000$, es decir, $1152$ millones de multiplicaciones por cada consulta. Los índices de vecinos aproximados (ANN, por ejemplo HNSW) existen para no recorrer todos los documentos: ganan velocidad a cambio de poder dejar fuera algún vecino de los mejores.',
      answer: 1152,
      tol: 0,
    },
  },
  {
    project: 'vecinos',
    question: {
      id: 'examen-3.elegir-k',
      type: 'opcion',
      prompt:
        'Un RAG recupera los `k` trozos más parecidos a la pregunta y los pone en el contexto del modelo de lenguaje. Se sube `k` de 3 a 10. ¿Qué es lo que ocurre, en general?',
      hints: [
        'Piensa en lo que ya estaba entre los 3 primeros: ¿sigue entre los 10 primeros?',
        'Cada trozo de más tiene un coste y puede ser un trozo poco relacionado con la pregunta.',
      ],
      explain:
        'Al subir `k` se añaden resultados al final de la lista, sin quitar ninguno de los de antes. Pregúntate qué se gana y qué se paga con los añadidos.',
      solution:
        'El recall@k no baja: los 3 primeros siguen entre los 10, y pueden entrar relevantes que antes quedaban fuera. A cambio, entran 7 trozos más, con más coste y más probabilidad de ruido que distraiga al modelo. No es que una opción sea siempre mejor: `k` es un compromiso que se ajusta midiendo con el recall@k.',
      options: [
        'El recall@k no baja y puede subir, pero el contexto se llena de más trozos, con más coste y más ruido',
        'El recall@k baja, porque con más documentos devueltos se encuentra menos de lo relevante',
        'No cambia nada, porque los trozos que entran de más tienen puntuación exactamente igual a los primeros',
        'El orden de los 3 primeros trozos cambia, porque `np.argsort` los vuelve a ordenar con los nuevos',
      ],
      correct: 0,
    },
  },
  {
    project: 'vecinos',
    question: {
      id: 'examen-3.vecinos-berlin',
      type: 'codigo',
      prompt:
        'Las filas de `P` son 32 palabras sueltas con embeddings reales (paraphrase-multilingual-MiniLM-L12-v2, de 384 componentes) y norma $1$; la palabra de la fila `j` es `palabras[j]`. `top_k(M, q, k)` devuelve las posiciones de las `k` filas de `M` que más puntúan con `q`, de mayor a menor, y ya está escrita. Guarda en `vecinos2` la lista de las 2 palabras más parecidas a «Berlín», sin contar a «Berlín», de la más parecida a la menos.',
      hints: [
        'La palabra más parecida a «Berlín» es ella misma, con coseno $1$: hay que dejarla fuera de los vecinos.',
        '`top_k` entrega posiciones. Se traducen a palabras mirando en la lista `palabras`.',
      ],
      explain:
        'Sin quitarla, «Berlín» aparece la primera de su propia lista. Y las posiciones que da `top_k` no son palabras: cada una se busca en `palabras`.',
      solution:
        "`top_k(P, q, 3)` empieza por «Berlín»; quitada la primera, `vecinos2` vale `['Alemania', 'París']`, con cosenos $0{,}79$ y $0{,}67$. Se obtiene con `[palabras[j] for j in top_k(P, q, 3)[1:]]`.",
      starter: `import numpy as np
from embeddings import P, palabras


def top_k(M, q, k):
    return np.argsort(-(M @ q))[:k]


i = palabras.index('Berlín')
q = P[i]
# Guarda en vecinos2 la lista de las 2 palabras más parecidas a Berlín, sin contarla a ella, de la más parecida a la menos
vecinos2 = None
`,
      checks: `import embeddings as _e
_i = _e.palabras.index("Berlín")
_s = _e.P @ _e.P[_i]
_orden = [_e.palabras[int(j)] for j in np.argsort(-_s) if int(j) != _i]
_exp = _orden[:2]
_v = [x for x in vecinos2] if isinstance(vecinos2, (list, tuple)) or (isinstance(vecinos2, np.ndarray) and vecinos2.ndim == 1) else None
_txt = _v is not None and all(isinstance(x, str) for x in _v)
_dos = _txt and len(_v) == 2
_v = [str(x) for x in _v] if _txt else _v
check(_v is not None, "\`vecinos2\` tiene que ser una lista con las 2 palabras más parecidas.")
check((_v is None) or _txt, "\`vecinos2\` tiene que contener palabras y no números: las posiciones que devuelve \`top_k\` se traducen a palabras mirando en la lista \`palabras\`.")
check((not _txt) or len(_v) == 2, "\`vecinos2\` tiene que tener exactamente 2 palabras.")
check((not _dos) or "Berlín" not in _v, "«Berlín» está entre sus propios resultados: su coseno consigo misma es 1, la puntuación más alta posible, y por eso aparece la primera. Hay que dejarla fuera y quedarse con las 2 siguientes.")
check((not _dos) or "Berlín" in _v or _v != _exp[::-1], "\`vecinos2\` tiene las palabras buenas pero en orden contrario: tiene que empezar por la más parecida.")
check((not _dos) or "Berlín" in _v or set(_v) != set(_orden[-2:]), "\`vecinos2\` tiene las 2 palabras menos parecidas a «Berlín». Se buscan las más parecidas, que están al principio de la lista ordenada por puntuación de mayor a menor.")
check((not _dos) or "Berlín" in _v or _v == _exp or _v == _exp[::-1] or set(_v) == set(_orden[-2:]), "\`vecinos2\` tiene que contener las 2 palabras de mayor coseno con «Berlín», sin contarla a ella, de la más a la menos parecida.")
`,
      reference: `import numpy as np
from embeddings import P, palabras


def top_k(M, q, k):
    return np.argsort(-(M @ q))[:k]


i = palabras.index('Berlín')
q = P[i]
vecinos2 = [palabras[j] for j in top_k(P, q, 3)[1:]]
`,
    },
  },
];
