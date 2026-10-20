import type { BankEntry } from '../../content/schema';

/**
 * Entradas fijas del banco de examen de la Órbita 3 para el proyecto «Por qué falla un RAG». La
 * pregunta con números variables (cuántos documentos pasan un umbral) la añade otro paso, como
 * entrada `generada`. Ids: `examen-3.<tema>`, únicos en todo el juego (también frente a las
 * preguntas de proyecto).
 */
export const examen3FallosRag: BankEntry[] = [
  {
    project: 'fallos-rag',
    question: {
      id: 'examen-3.negacion',
      type: 'opcion',
      prompt:
        'Con el modelo paraphrase-multilingual-MiniLM-L12-v2, «El hotel admite mascotas.» y «El hotel no admite mascotas.» tienen coseno $0{,}57$, y «El hotel admite mascotas.» con «Se aceptan perros y gatos.», que dice lo mismo, $0{,}61$. ¿Qué conclusión es correcta?',
      hints: [
        'Compara los dos cosenos: ¿cuál de las dos frases se parece más a la primera, la que dice lo contrario o la que dice lo mismo?',
        'Piensa qué mide el coseno entre dos embeddings: el sentido de la frase o su tema y su forma.',
      ],
      explain:
        'Una frase y su negación hablan de lo mismo y se escriben casi igual. Mira qué hace un coseno con esa información y si el sentido de la frase se puede leer en él.',
      solution:
        'El coseno mide parecido de tema y de forma, no si dos frases dicen lo mismo o lo contrario. La frase con el sentido opuesto ($0{,}57$) puntúa casi igual que la que dice lo mismo ($0{,}61$), así que el coseno no las distingue. Un umbral tampoco: separar $0{,}57$ de $0{,}61$ rechazaría muchas frases buenas. Ayuda una reordenación con un modelo que lea las dos frases juntas, y, al final, el modelo de lenguaje que lee el documento. Una negación no invierte el vector: de ser así, el coseno estaría cerca de $-1$.',
      options: [
        'El coseno mide parecido de tema y de forma: la frase con el sentido opuesto puntúa casi como la que dice lo mismo, y ayuda una reordenación que lea las dos frases juntas',
        'La negación invierte el vector, así que el coseno tendría que ser cercano a −1: el modelo ha fallado con estas dos frases',
        'Un coseno de 0,57 es bajo, así que el sistema sabe que las dos frases dicen cosas opuestas',
        'Basta un umbral de 0,60 para separar una frase de su negación en cualquier base de documentos',
      ],
      correct: 0,
    },
  },
  {
    project: 'fallos-rag',
    question: {
      id: 'examen-3.umbral-alto',
      type: 'numero',
      prompt:
        'En una base de 16 documentos del hotel hay 10 consultas etiquetadas y la consulta q5, «¿Cuál es el código de la tarifa CONG-2025?», no tiene respuesta, pero su mejor documento puntúa $0{,}86$. Estos son los mejores cosenos de las otras: q0 $0{,}77$, q1 $0{,}33$, q2 $0{,}64$, q3 $0{,}70$, q4 $0{,}62$, q6 $0{,}59$, q7 $0{,}41$, q8 $0{,}72$ y q9 $0{,}56$. La consulta q7 tampoco tiene respuesta; las otras ocho sí. Para que q5 se rechace, alguien sube el umbral a $0{,}87$. ¿Cuántas de las 10 consultas se contestan ahora bien? (Se contesta bien devolviendo el documento correcto, o «no lo sé» si no hay respuesta.)',
      hints: [
        'Con un umbral de $0{,}87$, ¿cuántas consultas tienen un mejor coseno que lo alcance?',
        'Las consultas sin respuesta se contestan bien cuando el sistema se calla; las que tienen respuesta, solo cuando lo dice el documento correcto.',
      ],
      explain:
        'Mira cuántas consultas siguen recibiendo documento con ese umbral y cuáles de las diez eran las que no debían recibirlo.',
      solution:
        'Con $0{,}87$ ninguna consulta alcanza el umbral: el mayor coseno es $0{,}86$. El sistema dice «no lo sé» a las diez. Eso es correcto en q5 y en q7, que no tienen respuesta, y un fallo en las otras ocho, que sí la tenían: se contestan bien $2$ de $10$. Subir el umbral hasta rechazar el falso positivo de q5 silencia al sistema entero.',
      answer: 2,
      tol: 0,
    },
  },
  {
    project: 'fallos-rag',
    question: {
      id: 'examen-3.filtro-capacidad',
      type: 'codigo',
      prompt:
        'La consulta 2 de `Q`, «¿Hay una sala para 250 asistentes?», recupera con los datos reales de `embeddings` un documento equivocado. Un filtro por metadatos trata la capacidad como un dato exacto y no como parecido: el array `capacidad` da las personas de la sala que describe cada documento (`0` si no habla de una sala). Guarda en `validos` un array de verdadero y falso con los documentos de capacidad de al menos 250, en `cosenos` el coseno de la consulta 2 con cada documento y en `elegido` la posición del documento válido que más se parece a la consulta (la posición en los 16 documentos, no entre los válidos). `np.where(c, a, b)` toma de `a` donde `c` es verdadero y de `b` donde no.',
      hints: [
        'Los documentos de `D` son las filas de una matriz; `D @ Q[2]` da el coseno de la consulta con cada uno.',
        'Para quedarte con el mejor de los válidos sin perder la posición, anula el coseno de los documentos no válidos con un valor que nunca gane, por ejemplo `-1`.',
      ],
      explain:
        'Los documentos que no cumplen el filtro no pueden ganar, pero el resultado tiene que seguir siendo una posición de los 16. Mira qué sale si buscas el máximo solo entre los válidos, que son pocos.',
      solution:
        '`validos = capacidad >= 250` solo es verdadero en el documento `4`, la sala Mediterráneo. `cosenos = D @ Q[2]` da `0,64` para d12 y `0,61` para d5, que serían los ganadores sin filtro, y `0,54` para d4. Con `np.where(validos, cosenos, -1)` los no válidos quedan en `-1` y `elegido = np.argmax(np.where(validos, cosenos, -1))` vale `4`: la sala de 300 personas.',
      requirements: [
        '`validos` es un array de NumPy de verdadero y falso con 16 valores, uno por documento, verdadero solo en los de 250 personas o más.',
        '`cosenos` es un array de NumPy con 16 números decimales, uno por documento: el coseno de la consulta 2 con cada uno.',
        '`elegido` es un número entero: la posición, entre los 16 documentos, del documento válido de mayor coseno.',
      ],
      starter: `import numpy as np
from embeddings import D, Q, documentos, consultas

# Capacidad en personas de la sala que describe cada documento (0: el documento no habla de una sala)
capacidad = np.array([0, 0, 0, 0, 300, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
# Guarda en validos los documentos con capacidad de al menos 250, en cosenos el coseno de la consulta 2
# con cada documento y en elegido la posición del documento válido más parecido a la consulta
validos = None
cosenos = None
elegido = None
`,
      checks: `import embeddings as _e
_cap = np.array([0, 0, 0, 0, 300, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
_v = _cap >= 250
_c = _e.D @ _e.Q[2]
_vv = isinstance(validos, np.ndarray) and validos.dtype == bool
_cc = isinstance(cosenos, np.ndarray) and np.issubdtype(cosenos.dtype, np.floating)
_el = isinstance(elegido, (int, np.integer)) and not isinstance(elegido, bool)
check(_vv, "\`validos\` tiene que ser un array de NumPy de verdadero y falso: uno por documento, verdadero si cumple el filtro.")
check((not _vv) or validos.shape == (16,), "\`validos\` tiene que tener 16 valores, uno por documento.")
check((not _vv) or validos.shape != (16,) or validos.sum() != 2, "\`validos\` deja pasar 2 documentos: está dejando pasar también la sala de 30 personas. El filtro pide 250 personas o más.")
check((not _vv) or validos.shape != (16,) or validos.sum() == 2 or np.array_equal(validos, _v), "\`validos\` tiene que ser verdadero solo en los documentos de 250 personas o más.")
check(_cc, "\`cosenos\` tiene que ser un array de NumPy con números decimales: el coseno de la consulta 2 con cada documento.")
check((not _cc) or cosenos.shape == (16,), "\`cosenos\` tiene que tener 16 números, uno por documento.")
check((not _cc) or cosenos.shape != (16,) or np.allclose(cosenos, _c, atol=1e-6), "\`cosenos\` tiene que ser el producto escalar de cada documento con la consulta 2, la fila 2 de \`Q\`.")
check(_el, "\`elegido\` tiene que ser un número entero: la posición del documento que gana.")
check((not _el) or elegido != 12, "\`elegido\` vale 12: es el documento de mayor coseno sin filtrar. Los documentos que no cumplen el filtro no pueden ganar.")
check((not _el) or elegido != 5, "\`elegido\` vale 5: es la sala de 30 personas, que tampoco cumple el filtro.")
check((not _el) or elegido != 0, "\`elegido\` vale 0: parece la posición dentro de los documentos ya filtrados, no entre los 16 de la base. Hay que conservar la posición original.")
check((not _el) or elegido in (12, 5, 0) or elegido == 4, "\`elegido\` tiene que ser la posición, entre los 16 documentos, del documento válido de mayor coseno.")
`,
      reference: `import numpy as np
from embeddings import D, Q, documentos, consultas

# Capacidad en personas de la sala que describe cada documento (0: el documento no habla de una sala)
capacidad = np.array([0, 0, 0, 0, 300, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
# Guarda en validos los documentos con capacidad de al menos 250, en cosenos el coseno de la consulta 2
# con cada documento y en elegido la posición del documento válido más parecido a la consulta
validos = capacidad >= 250
cosenos = D @ Q[2]
elegido = np.argmax(np.where(validos, cosenos, -1))
`,
    },
  },
];
