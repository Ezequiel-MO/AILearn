import { python } from '@codemirror/lang-python';
import { getIndentUnit, indentUnit, syntaxHighlighting } from '@codemirror/language';
import {
  Annotation,
  Compartment,
  EditorSelection,
  EditorState,
  type Line,
  Prec,
  type ChangeSpec,
  type StateCommand,
} from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { classHighlighter } from '@lezer/highlight';
import { basicSetup, EditorView } from 'codemirror';
import { useEffect, useId, useImperativeHandle, useRef, type Ref } from 'react';
import { t } from './strings';

/** Marca los cambios que vienen del padre (`value`): no se devuelven por `onChange`. */
const External = Annotation.define<boolean>();

/**
 * Aplica `f` a cada línea que toca la selección, sin repetir, y devuelve la transacción con la
 * selección movida hacia delante (`mapPos(…, 1)`): el cursor queda después de lo insertado en su
 * posición. Es la lógica de `changeBySelectedLine` de @codemirror/commands.
 */
function changeBySelectedLine(state: EditorState, f: (line: Line, changes: ChangeSpec[]) => void) {
  let atLine = -1;
  return state.changeByRange((range) => {
    const changes: ChangeSpec[] = [];
    for (let pos = range.from; pos <= range.to;) {
      const line = state.doc.lineAt(pos);
      // Una selección que acaba justo al principio de una línea no incluye esa línea.
      if (line.number > atLine && (range.empty || range.to > line.from)) {
        f(line, changes);
        atLine = line.number;
      }
      pos = line.to + 1;
    }
    const set = state.changes(changes);
    return {
      changes,
      range: EditorSelection.range(set.mapPos(range.anchor, 1), set.mapPos(range.head, 1)),
    };
  });
}

// Equivalentes de `indentMore` / `indentLess` de @codemirror/commands, que no está en `dependencies`
// (no se declara): añaden o quitan un nivel (`indentUnit`) a cada línea seleccionada, también a las
// vacías. En solo lectura devuelven false y Tab sigue su camino (mueve el foco).
const tabCommand =
  (direction: 'more' | 'less'): StateCommand =>
  ({ state, dispatch }) => {
    if (state.readOnly) return false;
    const unit = getIndentUnit(state);
    const spec = changeBySelectedLine(state, (line, changes) => {
      if (direction === 'more') {
        changes.push({ from: line.from, insert: state.facet(indentUnit) });
        return;
      }
      const lead = /^[ \t]*/.exec(line.text)![0];
      let remove = 0;
      for (let col = 0; remove < lead.length && col < unit; remove++) {
        col += lead[remove] === '\t' ? state.tabSize - (col % state.tabSize) : 1;
      }
      if (remove > 0) changes.push({ from: line.from, to: line.from + remove });
    });
    if (spec.changes.empty) return true;
    dispatch(state.update(spec, { userEvent: 'input.indent', scrollIntoView: true }));
    return true;
  };

/** Tiempo tras Esc durante el que el siguiente Tab saca el foco del editor (el de CodeMirror). */
const TAB_FOCUS_MS = 2000;

export interface CodeEditorHandle {
  focus: () => void;
}

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  /** Ctrl+Intro (Cmd+Intro en Mac). */
  onRun?: () => void;
  /** Permite al padre devolver el foco al editor. */
  ref?: Ref<CodeEditorHandle>;
}

/**
 * Editor CodeMirror 6 para Python: resaltado por clases `tok-*` (colores en theme.css), sangrado de
 * 4 espacios y numeración de líneas. El texto vive en el editor; `value` solo lo sustituye cuando
 * difiere del que ya tiene. Tab sangra (Mayús+Tab quita sangrado); para sacar el foco con el teclado,
 * Esc y después Tab (lo resuelve CodeMirror). En solo lectura Tab mueve el foco sin más. Una línea de
 * ayuda visible, asociada al editor con `aria-describedby`, lo explica.
 */
export function CodeEditor({ value, onChange, readOnly = false, onRun, ref }: CodeEditorProps) {
  const helpId = useId();
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const lock = useRef(new Compartment());
  const initial = useRef({ value, readOnly, helpId });
  useImperativeHandle(ref, () => ({ focus: () => viewRef.current?.focus() }), []);
  const handlers = useRef({ onChange, onRun });

  useEffect(() => {
    handlers.current = { onChange, onRun };
  });

  useEffect(() => {
    const view = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: initial.current.value,
        extensions: [
          // Antes que el mapa de teclas de basicSetup, que usa Mod-Intro para insertar una línea.
          Prec.highest(
            keymap.of([
              {
                key: 'Mod-Enter',
                run: () => {
                  handlers.current.onRun?.();
                  return true;
                },
              },
            ]),
          ),
          // Antes que basicSetup, para que Tab sangre en vez de dejar pasar el foco.
          Prec.high(
            keymap.of([{ key: 'Tab', run: tabCommand('more'), shift: tabCommand('less') }]),
          ),
          // Esc también cierra la lista de sugerencias (con precedencia máxima), y entonces CodeMirror
          // no llega a activar «el siguiente Tab sale del editor»: se activa aquí antes y se deja
          // seguir al resto de manejadores.
          Prec.highest(
            keymap.of([
              {
                key: 'Escape',
                run: (view) => {
                  view.setTabFocusMode(TAB_FOCUS_MS);
                  return false;
                },
              },
            ]),
          ),
          basicSetup,
          python(),
          indentUnit.of('    '),
          EditorState.tabSize.of(4),
          syntaxHighlighting(classHighlighter),
          EditorView.theme({}, { dark: true }),
          lock.current.of(lockExtensions(initial.current.readOnly, initial.current.helpId)),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            if (update.transactions.some((tr) => tr.annotation(External))) return;
            handlers.current.onChange(update.state.doc.toString());
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
      annotations: External.of(true),
    });
  }, [value]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: lock.current.reconfigure(lockExtensions(readOnly, helpId)),
    });
  }, [readOnly, helpId]);

  return (
    <>
      <div ref={host} className="code-editor" />
      {readOnly ? null : (
        <p id={helpId} className="code-editor__help">
          {t.code.tabHelp}
        </p>
      )}
    </>
  );
}

/** Solo lectura y atributos del editor: la ayuda de Tab solo describe al editor si se puede escribir. */
function lockExtensions(readOnly: boolean, helpId: string) {
  return [
    EditorState.readOnly.of(readOnly),
    EditorView.contentAttributes.of({
      'aria-label': t.code.editorLabel,
      ...(readOnly ? {} : { 'aria-describedby': helpId }),
    }),
  ];
}
