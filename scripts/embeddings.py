"""Genera src/python/embeddings.py: embeddings reales precalculados para la Órbita 3.

En el navegador no hay modelo, así que los vectores se calculan aquí una vez y viajan como datos.
No forma parte de la compilación ni de las pruebas. Para regenerarlos hace falta un entorno de Python
aparte (no el del proyecto), por ejemplo:

    python3 -m venv /tmp/venv
    /tmp/venv/bin/pip install --index-url https://download.pytorch.org/whl/cpu torch
    /tmp/venv/bin/pip install sentence-transformers==6.1.0 numpy
    /tmp/venv/bin/python scripts/embeddings.py

Cambiar un texto cambia los números de las preguntas que lo usan: después, `npm test`.
"""

import base64
import pathlib
import textwrap

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
OUT = pathlib.Path(__file__).resolve().parent.parent / "src" / "python" / "embeddings.py"

PALABRAS = [
    "rey", "reina", "hombre", "mujer", "príncipe", "princesa", "padre", "madre", "hijo", "hija",
    "París", "Francia", "Madrid", "España", "Roma", "Italia", "Berlín", "Alemania", "Lisboa", "Portugal",
    "gato", "perro", "lobo", "tigre", "león", "coche", "bici", "camión", "tren", "avión",
    "manzana", "naranja",
]

DOCUMENTOS = [
    "El desayuno se sirve de 7:00 a 10:30 en el restaurante de la planta baja.",
    "El hotel admite mascotas de menos de 10 kilos con un suplemento de 20 euros por noche.",
    "La piscina exterior abre de junio a septiembre.",
    "El aparcamiento cuesta 25 euros al día y hay que reservarlo con antelación.",
    "La sala Mediterráneo tiene capacidad para 300 personas en formato teatro.",
    "La sala Levante tiene capacidad para 30 personas en formato reunión.",
    "El check-in es a partir de las 15:00 y el check-out antes de las 12:00.",
    "La conexión wifi es gratuita en todo el hotel.",
    "Para cancelar sin coste hay que avisar con 48 horas de antelación.",
    "El hotel está a 20 minutos del aeropuerto en taxi.",
    "El gimnasio está abierto las 24 horas para los huéspedes.",
    "El restaurante ofrece menús vegetarianos y sin gluten bajo petición.",
    "Los grupos de más de 20 habitaciones tienen una persona de contacto asignada.",
    "El código de la tarifa para congresos es CONG-2026.",
    "El spa no está incluido en la tarifa y se paga aparte.",
    "En las habitaciones no se puede fumar.",
]

CONSULTAS = [
    "¿A qué hora puedo desayunar?",
    "¿Puedo llevar a mi perro?",
    "¿Hay una sala para 250 asistentes?",
    "¿Hay una sala para 25 asistentes?",
    "¿El spa está incluido en el precio?",
    "¿Cuál es el código de la tarifa CONG-2025?",
    "¿Cuánto cuesta aparcar el coche?",
    "¿Cuánto cuesta un vuelo a Roma?",
    "¿Se puede fumar en la habitación?",
    "¿Cómo llego desde el aeropuerto?",
]

FRASES = [
    "El hotel admite mascotas.",
    "El hotel no admite mascotas.",
    "Se aceptan perros y gatos.",
    "El spa está incluido en la tarifa.",
    "El spa no está incluido en la tarifa.",
    "La sala tiene capacidad para 300 personas.",
    "La sala tiene capacidad para 30 personas.",
    "Me encanta este hotel.",
    "Odio este hotel.",
]

HEADER = '''"""Embeddings reales, precalculados: en el navegador no hay modelo que los calcule.

Modelo: {model} ({dim} dimensiones).
Cada fila es el embedding de un texto, normalizado a norma 1. Se guardan en float16 (la mitad de
bytes que float32) y se vuelven a normalizar al cargarlos, así que el redondeo apenas cambia los cosenos.

    palabras, P      {n_p} palabras sueltas y su matriz ({n_p}, {dim})
    documentos, D    {n_d} frases de la base de conocimiento de un hotel y su matriz
    consultas, Q     {n_q} preguntas de huéspedes y su matriz
    frases, F        {n_f} frases para comparar de dos en dos y su matriz
    vector(texto)    el embedding de cualquiera de esos textos

Generado por scripts/embeddings.py. No lo edites a mano.
"""

import base64 as _base64

import numpy as _np

modelo = "{short}"
dimension = {dim}
'''

FOOTER = '''

def _matriz(datos, filas):
    m = _np.frombuffer(_base64.b64decode(datos), dtype="<f2").astype(_np.float64)
    m = m.reshape(filas, dimension)
    return m / _np.linalg.norm(m, axis=1, keepdims=True)


P = _matriz(_P, len(palabras))
D = _matriz(_D, len(documentos))
Q = _matriz(_Q, len(consultas))
F = _matriz(_F, len(frases))

_todos = {}
for _textos, _m in ((palabras, P), (documentos, D), (consultas, Q), (frases, F)):
    for _i, _t in enumerate(_textos):
        _todos.setdefault(_t, _m[_i])


def vector(texto):
    """El embedding de un texto de las listas. Solo esos: aquí no hay modelo para textos nuevos."""
    if texto not in _todos:
        raise KeyError(
            "No tengo el embedding de %r: solo los de palabras, documentos, consultas y frases." % texto
        )
    return _todos[texto].copy()
'''


def encode(model: SentenceTransformer, texts: list[str]) -> str:
    m = model.encode(texts, normalize_embeddings=True).astype("<f2")
    b64 = base64.b64encode(m.tobytes()).decode("ascii")
    return "\n".join(textwrap.wrap(b64, 100))


def main() -> None:
    model = SentenceTransformer(MODEL, device="cpu")
    dim = model.get_sentence_embedding_dimension()
    lists = {"palabras": PALABRAS, "documentos": DOCUMENTOS, "consultas": CONSULTAS, "frases": FRASES}
    for name, texts in lists.items():
        assert len(set(texts)) == len(texts), f"textos repetidos en {name}"
    parts = [
        HEADER.format(
            model=MODEL, short=MODEL.split("/")[-1], dim=dim,
            n_p=len(PALABRAS), n_d=len(DOCUMENTOS), n_q=len(CONSULTAS), n_f=len(FRASES),
        )
    ]
    for name, texts in lists.items():
        parts.append(f"{name} = [\n" + "".join(f"    {t!r},\n" for t in texts) + "]\n")
    for var, texts in (("_P", PALABRAS), ("_D", DOCUMENTOS), ("_Q", CONSULTAS), ("_F", FRASES)):
        parts.append(f'{var} = """\n{encode(model, texts)}\n"""\n')
    OUT.write_text("\n".join(parts) + FOOTER, encoding="utf-8")
    print(f"{OUT}: {OUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()
