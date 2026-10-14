// El arnés: Python que ejecuta el código del jugador y sus comprobaciones.
// Se evalúa en un diccionario de nombres nuevo en cada ejecución (ver core.ts), que
// recibe `__code`, `__checks`, `__has_checks`, `__player_file`, `__input_msg` y `__name_msg` desde TypeScript.
// Los textos con comillas invertidas viajan desde TypeScript para no escaparlos aquí.

export const PLAYER_FILENAME = '<tu código>';
export const INPUT_MESSAGE = '`input()` no está disponible aquí: escribe el valor en el código';
export const NAME_MESSAGE = 'No encuentro `{name}`. ¿Lo has definido con ese nombre exacto?';

export const HARNESS = String.raw`
import base64
import builtins
import contextlib
import io
import json
import re
import sys
import warnings

MAX_TRACE_LINES = 10


def _restore_builtins():
    # El jugador puede pisar nombres de builtins; la copia se guarda la primera vez y se restaura siempre.
    live = vars(builtins)
    snapshot = getattr(sys, "_ailearn_builtins", None)
    if snapshot is None:
        sys._ailearn_builtins = dict(live)
        return
    for key in [k for k in live if k not in snapshot]:
        del live[key]
    live.update(snapshot)


def _reset_numpy():
    # Solo si la instancia ya lo había importado: el arnés no fuerza su importación.
    np = sys.modules.get("numpy")
    if np is None:
        return
    # Cada reinicio va protegido: el jugador puede haber pisado estas funciones (np.set_printoptions = None)
    # y un fallo aquí no debe rechazar la ejecución ni las siguientes.
    try:
        np.set_printoptions(
            edgeitems=3, infstr="inf", linewidth=75, nanstr="nan", precision=8, suppress=False,
            threshold=1000, formatter=None, sign="-", floatmode="maxprec", legacy=False,
        )
    except BaseException:
        pass
    try:
        np.seterr(divide="warn", over="warn", under="ignore", invalid="warn")
    except BaseException:
        pass


def _explain(exc, line):
    # R43: una frase en castellano delante de la traza original. Cada frase dice qué error es y,
    # como mucho, «puede ser» o «puede pasar si»: nunca afirma una causa que el error no demuestra.
    name = type(exc).__name__
    msg = str(exc)
    at = "En la línea %d" % line if line else "En tu código"
    if name == "AxisError":
        return "%s se pide un eje que el array no tiene. Los ejes se numeran desde 0: un array de 2 dimensiones tiene los ejes 0 y 1." % at
    if name == "UFuncTypeError":
        return "%s se opera con algo que no es un número (por ejemplo un texto) como si lo fuera. Puede pasar si se resta, suma o multiplica un array con una palabra." % at
    if isinstance(exc, IndentationError):
        return "%s la sangría (los espacios al principio) no es la que Python espera. Puede faltar sangrar un bloque tras los dos puntos, o sobrar un espacio." % at
    if isinstance(exc, SyntaxError):
        return "%s Python no entiende cómo está escrita la instrucción. Mira bien lo que hay en esa línea y en la anterior: paréntesis, comillas, dos puntos u operadores." % at
    if isinstance(exc, NameError):
        missing = getattr(exc, "name", None)
        if not missing:
            found = re.search(r"name '([^']+)' is not defined", msg)
            missing = found.group(1) if found else None
        if missing:
            return "%s, «%s» no está definido. Puede ser un nombre mal escrito (las mayúsculas cuentan), o un texto al que le faltan las comillas." % (at, missing)
        return "%s hay un nombre que no está definido. Puede ser un nombre mal escrito." % at
    if isinstance(exc, KeyError):
        key = exc.args[0] if exc.args else ""
        return "%s se busca la clave «%s» y no está en el diccionario. Puede pasar si está escrita distinto: las mayúsculas y las comillas cuentan." % (at, key)
    if isinstance(exc, IndexError):
        return "%s se pide una posición que no existe. Se empieza a contar en 0, así que la última posición es una menos que el tamaño." % at
    if isinstance(exc, ValueError) and "truth value of an array" in msg:
        return "%s Python no sabe si un array con varios números es verdadero o falso. El error aparece cuando se usa como condición (por ejemplo en un «if») un array entero. ¿Falta reducirlo a un solo número, por ejemplo con la norma?" % at
    if isinstance(exc, ValueError) and "could not be broadcast" in msg:
        shapes = re.search(r"shapes (\(.*?\)) (\(.*?\))", msg)
        detail = " (formas %s y %s)" % shapes.groups() if shapes else ""
        return "%s se operan dos arrays de formas distintas%s. Para sumar, restar o comparar componente a componente, los dos tienen que tener las mismas." % (at, detail)
    if isinstance(exc, TypeError) and "Cannot interpret" in msg and "as a data type" in msg:
        return "%s np.array recibe una lista con los números, no varios números sueltos: np.array([3, 2]) en vez de np.array(3, 2). Puede pasar si se le dan los números sin los corchetes." % at
    return "%s Python ha parado con un error de tipo %s. Lee el mensaje de abajo para ver qué ha pasado." % (at, name)


def _format_error(exc, code, player_file):
    lines = code.splitlines()

    def source(n):
        return lines[n - 1].strip() if n and 0 < n <= len(lines) else ""

    frames = []
    last_line = 0
    tb = exc.__traceback__
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == player_file:
            n = tb.tb_lineno
            last_line = n
            where = tb.tb_frame.f_code.co_name
            where = "" if where == "<module>" else ", en " + where
            frames.append("  línea %d%s: %s" % (n, where, source(n)))
        tb = tb.tb_next
    if len(frames) > MAX_TRACE_LINES:
        half = MAX_TRACE_LINES // 2
        hidden = len(frames) - 2 * half
        frames = frames[:half] + ["  … %d líneas repetidas …" % hidden] + frames[-half:]
    out = ["Error en tu código:"] + frames
    if isinstance(exc, SyntaxError) and exc.filename == player_file:
        n = exc.lineno or 0
        last_line = n
        out.append("  línea %d: %s" % (n, source(n)))
        out.append("%s: %s" % (type(exc).__name__, exc.msg))
    else:
        out.append("%s: %s" % (type(exc).__name__, exc))
    try:
        phrase = _explain(exc, last_line)
    except BaseException:
        phrase = "En tu código ha saltado un error de tipo %s." % type(exc).__name__
    return phrase + "\n\n" + "\n".join(out)


def _export_figures(plt):
    figures = []
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        for num in plt.get_fignums():
            buffer = io.BytesIO()
            plt.figure(num).savefig(buffer, format="png")
            figures.append(
                "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")
            )
    return figures


def _run(code, checks_src, has_checks, player_file, input_msg, name_msg):
    _restore_builtins()
    import matplotlib

    matplotlib.rcdefaults()
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    _reset_numpy()
    plt.close("all")
    # El backend Agg no muestra nada: plt.show() no hace nada (y no avisa).
    plt.show = lambda *args, **kwargs: None

    def _input(*args, **kwargs):
        raise RuntimeError(input_msg)

    player_builtins = dict(vars(builtins))
    player_builtins["input"] = _input
    namespace = {"__name__": "__main__", "__builtins__": player_builtins}

    captured = io.StringIO()
    error = None
    with contextlib.redirect_stdout(captured), contextlib.redirect_stderr(captured):
        try:
            exec(compile(code, player_file, "exec"), namespace)
        except BaseException as exc:
            error = _format_error(exc, code, player_file)
    _restore_builtins()
    stdout = captured.getvalue()

    figures = []
    try:
        figures = _export_figures(plt)
    except BaseException as exc:
        figures = []
        if error is None:
            error = "No se ha podido dibujar la figura: %s: %s" % (type(exc).__name__, exc)

    results = None
    if has_checks:
        results = []
        if error is None:
            import numpy as np

            def check(condition, message):
                results.append({"passed": bool(condition), "message": str(message)})

            namespace["np"] = np
            namespace["plt"] = plt
            namespace["check"] = check
            sink = io.StringIO()
            with contextlib.redirect_stdout(sink), contextlib.redirect_stderr(sink):
                try:
                    exec(compile(checks_src, "<comprobaciones>", "exec"), namespace)
                except NameError as exc:
                    name = getattr(exc, "name", None)
                    message = name_msg.replace("{name}", name) if name else str(exc)
                    results.append({"passed": False, "message": message})
                except BaseException as exc:
                    results.append({"passed": False, "message": str(exc) or type(exc).__name__})
            _restore_builtins()

    plt.close("all")
    # El veredicto (passed) lo calcula core.ts: no depende de ningún nombre de Python.
    return json.dumps(
        {"stdout": stdout, "error": error, "figures": figures, "checks": results}
    )


_run(__code, __checks, __has_checks, __player_file, __input_msg, __name_msg)
`;
