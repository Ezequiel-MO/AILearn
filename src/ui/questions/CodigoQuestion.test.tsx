import { readFileSync } from 'node:fs';
import path from 'node:path';
import { indentUnit } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CodigoQ } from '../../content/schema';
import type { RunResult } from '../../python/core';
import { PythonLoadError, type PythonRunner, type RunnerStatus } from '../../python/runner';
import { CodigoQuestion } from './CodigoQuestion';
import { QuestionView } from './QuestionView';

const STARTER = 'x = 1\nprint(x)';
const LOADING = 'Cargando Python…';
const FAILED = 'No se ha podido cargar Python. Comprueba la conexión.';
const TIMED_OUT = 'Tu código tardó demasiado. ¿Hay un bucle que no termina?';
const TAB_HELP = 'Tab sangra. Para salir del editor con el teclado, pulsa Esc y después Tab.';
const HARNESS_FAILED = 'Algo ha fallado al ejecutar. Vuelve a intentarlo.';
const EDITOR_LOADING = 'Cargando el editor…';

const question = (over: Partial<CodigoQ> = {}): CodigoQ => ({
  id: 'c1',
  type: 'codigo',
  requirements: ['`x` es un número.', '`x` vale 1.'],
  prompt: 'Escribe **código**',
  hints: [],
  explain: 'e',
  solution: 's',
  starter: STARTER,
  checks: 'check(x == 1, "x vale 1")',
  reference: 'x = 1',
  ...over,
});

const result = (over: Partial<RunResult> = {}): RunResult => ({
  stdout: '',
  error: null,
  figures: [],
  checks: null,
  passed: false,
  timedOut: false,
  ...over,
});

// Ejecutor falso: el test decide qué contesta `run` y en qué estado está.
const fakeRunner = (initial: RunnerStatus = 'ready') => {
  let state = initial;
  const listeners = new Set<(s: RunnerStatus) => void>();
  const run = vi.fn<PythonRunner['run']>(() => Promise.resolve(result()));
  const retry = vi.fn();
  const runner: PythonRunner = {
    run,
    status: () => state,
    onStatus: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    retry,
    dispose: vi.fn(),
  };
  const setState = (s: RunnerStatus) => {
    state = s;
    act(() => listeners.forEach((cb) => cb(s)));
  };
  return { runner, run, retry, setState, listeners };
};

const view = (): EditorView => {
  const found = EditorView.findFromDOM(document.querySelector<HTMLElement>('.cm-editor')!);
  if (!found) throw new Error('no hay editor');
  return found;
};
const editorText = () => view().state.doc.toString();
const type = (text: string) =>
  act(() => view().dispatch({ changes: { from: 0, to: view().state.doc.length, insert: text } }));

const setup = (
  over: {
    q?: Partial<CodigoQ>;
    draft?: string | null;
    locked?: boolean;
    hideChecks?: boolean;
    status?: RunnerStatus;
  } = {},
) => {
  const fake = fakeRunner(over.status);
  const onSubmit = vi.fn();
  const onDraft = vi.fn();
  const props = {
    question: question(over.q),
    locked: over.locked ?? false,
    hideChecks: over.hideChecks,
    onSubmit,
    draft: over.draft ?? null,
    onDraft,
    runner: fake.runner,
  };
  const utils = render(<CodigoQuestion {...props} />);
  return { ...fake, onSubmit, onDraft, props, ...utils };
};

const click = async (name: string) => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
};

describe('CodigoQuestion: editor', () => {
  it('sin borrador, el editor contiene el código de partida', () => {
    setup();
    // contract: tarea 11, tabla de casos («Sin borrador»)
    expect(editorText()).toBe(STARTER);
  });

  it('con borrador, el editor contiene el borrador', () => {
    setup({ draft: 'y = 2' });
    // contract: tarea 11, tabla de casos («Con borrador»)
    expect(editorText()).toBe('y = 2');
  });

  it('numera las líneas y el editor tiene nombre accesible', () => {
    setup();
    // contract: tarea 11, regla «Editor CodeMirror 6 con ... sangrado de 4 espacios y numeración de líneas»
    expect(document.querySelector('.cm-lineNumbers')).not.toBeNull();
    expect(document.querySelector('.cm-content')?.getAttribute('aria-label')).toBe(
      'Editor de código Python',
    );
  });
});

describe('CodigoQuestion: editor (review-11 I3, I4)', () => {
  it('el sangrado del editor es de cuatro espacios', () => {
    setup();
    // contract: review-11 I3 (mutación «quitar indentUnit.of»: CodeMirror vuelve a 2 espacios)
    expect(view().state.facet(indentUnit)).toBe('    ');
  });

  it('resalta la sintaxis de Python con clases tok-*', () => {
    setup({ q: { starter: 'import numpy as np' } });
    // contract: review-11 I3 (mutaciones «quitar python()» y «quitar syntaxHighlighting»)
    expect(document.querySelector('.cm-content .tok-keyword')).not.toBeNull();
  });

  it('Tab sangra con cuatro espacios y no mueve el foco', () => {
    setup({ q: { starter: 'if x:\npass' } });
    act(() => view().dispatch({ selection: { anchor: 6 } }));
    const content = document.querySelector<HTMLElement>('.cm-content')!;
    let notPrevented = true;
    act(() => {
      notPrevented = fireEvent.keyDown(content, { key: 'Tab', keyCode: 9 });
    });
    // contract: review-11 I4 (R24: Tab sangra 4 espacios)
    expect(editorText()).toBe('if x:\n    pass');
    // contract: rereview-11 N5 (Tab se captura: el navegador no mueve el foco; fireEvent da false si hubo preventDefault)
    expect(notPrevented).toBe(false);
  });

  it('Mayús+Tab quita un nivel de sangrado', () => {
    setup({ q: { starter: 'if x:\n        pass' } });
    act(() => view().dispatch({ selection: { anchor: 15 } }));
    const content = document.querySelector<HTMLElement>('.cm-content')!;
    act(() => {
      fireEvent.keyDown(content, { key: 'Tab', keyCode: 9, shiftKey: true });
    });
    // contract: review-11 I4 (R24: Mayús+Tab quita sangrado)
    expect(editorText()).toBe('if x:\n    pass');
  });

  it('Tab sangra todas las líneas de una selección', () => {
    setup({ q: { starter: 'a\nb' } });
    act(() => view().dispatch({ selection: { anchor: 0, head: 3 } }));
    act(() => {
      fireEvent.keyDown(document.querySelector<HTMLElement>('.cm-content')!, {
        key: 'Tab',
        keyCode: 9,
      });
    });
    // contract: review-11 I4 (R24: indentWithTab sangra el bloque seleccionado)
    expect(editorText()).toBe('    a\n    b');
  });

  it('Esc y después Tab dejan salir del editor aunque Esc cierre la lista de sugerencias', () => {
    setup({ q: { starter: 'if x:\n' } });
    const content = document.querySelector<HTMLElement>('.cm-content')!;
    // Escribir (con el origen de una pulsación) abre la consulta de sugerencias de CodeMirror.
    act(() =>
      view().dispatch({
        changes: { from: 6, insert: 'pri' },
        selection: { anchor: 9 },
        userEvent: 'input.type',
      }),
    );
    const key = (name: string, keyCode: number) => {
      const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
      Object.defineProperty(event, 'keyCode', { value: keyCode });
      act(() => {
        content.dispatchEvent(event);
      });
      return event;
    };
    key('Escape', 27);
    const tab = key('Tab', 9);
    // contract: review-11 I4 (R24: Esc y después Tab mueven el foco fuera; el navegador hace el resto)
    expect(editorText()).toBe('if x:\npri');
    expect(tab.defaultPrevented).toBe(false);
  });

  it('en locked Tab no cambia el texto (se deja pasar al navegador)', () => {
    setup({ locked: true, q: { starter: 'if x:\npass' } });
    const content = document.querySelector<HTMLElement>('.cm-content')!;
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      keyCode: 9,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      content.dispatchEvent(event);
    });
    // contract: review-11 I4 (en locked Tab mueve el foco sin más: no se captura la tecla)
    expect(editorText()).toBe('if x:\npass');
    expect(event.defaultPrevented).toBe(false);
  });

  it('la ayuda de Tab es visible y el editor la tiene como descripción', () => {
    setup();
    const help = screen.getByText(TAB_HELP);
    // contract: review-11 I4 (texto de ayuda visible y asociado al editor con aria-describedby)
    expect(help).toBeVisible();
    const content = document.querySelector('.cm-content')!;
    expect(content.getAttribute('aria-describedby')).toBe(help.id);
    expect(help.id).not.toBe('');
  });

  it('en locked no hay ayuda de Tab ni descripción', () => {
    setup({ locked: true });
    // contract: review-11 I4 (en locked Tab no sangra: la ayuda sería falsa)
    expect(screen.queryByText(TAB_HELP)).toBeNull();
    expect(document.querySelector('.cm-content')?.getAttribute('aria-describedby')).toBeNull();
  });
});

describe('CodigoQuestion: Tab como indentMore / indentLess (rereview-11 N1)', () => {
  const pressTab = (shiftKey = false) =>
    act(() => {
      fireEvent.keyDown(document.querySelector<HTMLElement>('.cm-content')!, {
        key: 'Tab',
        keyCode: 9,
        shiftKey,
      });
    });
  const select = (anchor: number, head = anchor) =>
    act(() => view().dispatch({ selection: { anchor, head } }));
  const sel = () => view().state.selection.main;

  it('Tab en una línea vacía al final del documento la sangra y deja el cursor después', () => {
    setup({ q: { starter: 'x = 1\n' } });
    select(6);
    pressTab();
    // contract: rereview-11 N1 (indentMore sangra la línea vacía donde está el cursor y mueve el cursor con mapPos(…, 1))
    expect(editorText()).toBe('x = 1\n    ');
    // contract: rereview-11 N1 (cursor en 6 + 4 espacios insertados = 10)
    expect(sel().head).toBe(10);
    expect(sel().anchor).toBe(10);
  });

  it('Tab en un documento vacío inserta cuatro espacios y deja el cursor en 4', () => {
    setup({ q: { starter: '' } });
    select(0);
    pressTab();
    // contract: rereview-11 N1 (documento vacío: Tab sangra igual)
    expect(editorText()).toBe('    ');
    // contract: rereview-11 N1 (el cursor queda después de la sangría insertada)
    expect(sel().head).toBe(4);
  });

  it('Tab con el cursor en la columna 0 deja el cursor después de la sangría', () => {
    setup({ q: { starter: 'pass' } });
    select(0);
    pressTab();
    act(() => view().dispatch(view().state.replaceSelection('Z')));
    // contract: rereview-11 N1 (con indentMore, «pass» + Tab + Z da «    Zpass», no «Z    pass»)
    expect(editorText()).toBe('    Zpass');
  });

  it('Tab sobre una selección de varias líneas sangra también la línea vacía del medio', () => {
    setup({ q: { starter: 'a\n\nb' } });
    select(0, 4);
    pressTab();
    // contract: rereview-11 N1 (indentMore sangra las líneas vacías dentro de la selección)
    expect(editorText()).toBe('    a\n    \n    b');
    // contract: rereview-11 N1 (la selección se desplaza con mapPos(…, 1): empieza tras la sangría de «a» y acaba al final)
    expect([sel().anchor, sel().head]).toEqual([4, 16]);
  });

  it('Mayús+Tab sobre una línea de solo espacios quita un nivel y mueve el cursor', () => {
    setup({ q: { starter: '      ' } });
    select(6);
    pressTab(true);
    // contract: rereview-11 N1 (indentLess quita 4 de 6 espacios en una línea de solo espacios)
    expect(editorText()).toBe('  ');
    // contract: rereview-11 N1 (el cursor del final de la línea sigue al final: 6 − 4 = 2)
    expect(sel().head).toBe(2);
  });

  it('en locked Tab no sangra una línea vacía ni la captura', () => {
    setup({ locked: true, q: { starter: 'x = 1\n' } });
    select(6);
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      keyCode: 9,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      document.querySelector<HTMLElement>('.cm-content')!.dispatchEvent(event);
    });
    // contract: rereview-11 N1 (en solo lectura el comando devuelve false: Tab no edita aunque ahora sangre líneas vacías)
    expect(editorText()).toBe('x = 1\n');
    expect(event.defaultPrevented).toBe(false);
  });
});

describe('CodigoQuestion: hoja de estilos (rereview-11 N2)', () => {
  const css = readFileSync(path.join(process.cwd(), 'src/ui/theme.css'), 'utf8');
  const rule = (selector: string): string => {
    const escaped = selector.replace(/[.[\]()*+?^$|\\:-]/g, '\\$&');
    const match = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm').exec(
      css.replace(/\/\*[\s\S]*?\*\//g, ''),
    );
    if (!match) throw new Error(`No hay regla para ${selector}`);
    return match[1]!;
  };

  it('la región de resultados vacía sale del flujo sin quitarse del árbol de accesibilidad', () => {
    // contract: rereview-11 N2 (medido en Chrome: en flujo la región vacía añadía 12 px bajo los botones)
    expect(rule('.code__results:empty')).toMatch(/position:\s*absolute/);
    // contract: rereview-11 N2 (display: none la quitaría del árbol de accesibilidad y no se anunciaría)
    expect(rule('.code__results:empty')).not.toMatch(/display:\s*none/);
  });
});

describe('CodigoQuestion: ejecutar y entregar', () => {
  it('«Ejecutar» llama a run sin comprobaciones, muestra la salida y no llama a onSubmit', async () => {
    const { run, onSubmit } = setup();
    run.mockResolvedValue(result({ stdout: 'hola mundo\n' }));
    await click('Ejecutar');
    // contract: tarea 11, tabla de casos («Ejecutar»)
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(STARTER);
    expect(await screen.findByText(/hola mundo/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('Ctrl+Intro ejecuta como el botón', async () => {
    const { run } = setup();
    await act(async () => {
      fireEvent.keyDown(document.querySelector('.cm-content')!, { key: 'Enter', ctrlKey: true });
    });
    // contract: tarea 11, regla «Ejecutar (también Ctrl+Intro)»
    expect(run).toHaveBeenCalledTimes(1);
    expect(editorText()).toBe(STARTER);
  });

  it('«Entregar» con passed true llama a run con las comprobaciones y a onSubmit(true)', async () => {
    const { run, onSubmit } = setup();
    run.mockResolvedValue(
      result({ checks: [{ passed: true, message: 'x vale 1' }], passed: true }),
    );
    await click('Entregar');
    // contract: tarea 11, tabla de casos («Entregar» con resultado passed true)
    expect(run).toHaveBeenCalledWith(STARTER, { checks: 'check(x == 1, "x vale 1")' });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(true);
    // contract: fix 18b-B R44 (una comprobación superada no enseña su mensaje: solo cuenta en el resumen)
    expect(await screen.findByText('1 de 1 comprobación superada')).toBeInTheDocument();
    expect(screen.queryByText('x vale 1')).toBeNull();
  });

  it('«Entregar» con una comprobación fallida muestra su mensaje y llama a onSubmit(false)', async () => {
    const { run, onSubmit } = setup();
    run.mockResolvedValue(
      result({
        checks: [
          { passed: true, message: 'Bien' },
          { passed: false, message: 'x debería valer 1' },
        ],
        passed: false,
      }),
    );
    await click('Entregar');
    // contract: tarea 11, tabla de casos («Entregar» con una comprobación fallida)
    expect(await screen.findByText('x debería valer 1')).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledWith(false);
  });

  it('un resultado con error muestra la traza', async () => {
    const { run } = setup();
    run.mockResolvedValue(result({ error: 'Error en tu código:\nLínea 2: NameError' }));
    await click('Ejecutar');
    // contract: tarea 11, tabla de casos («Resultado con error»)
    expect(await screen.findByText(/Línea 2: NameError/)).toBeInTheDocument();
  });

  it('un plazo agotado al entregar muestra el mensaje y cuenta como incorrecta', async () => {
    const { run, onSubmit } = setup();
    run.mockResolvedValue(result({ timedOut: true }));
    await click('Entregar');
    // contract: tarea 11, tabla de casos («Resultado con timedOut al entregar»)
    expect(await screen.findByText(TIMED_OUT)).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledWith(false);
  });

  it('un plazo agotado deja vacía la región de resultados aunque el resultado traiga salida', async () => {
    const { run } = setup();
    run.mockResolvedValue(result({ timedOut: true, stdout: 'parcial' }));
    await click('Ejecutar');
    expect(await screen.findByText(TIMED_OUT)).toBeInTheDocument();
    // contract: rereview-11 N3 (la guarda !result.timedOut: con plazo agotado no se pinta nada del resultado)
    expect(screen.getByRole('status', { name: 'Resultado' })).toBeEmptyDOMElement();
    expect(screen.queryByText(/parcial/)).toBeNull();
  });

  it('un plazo agotado al ejecutar muestra el mensaje y no llama a onSubmit', async () => {
    const { run, onSubmit } = setup();
    run.mockResolvedValue(result({ timedOut: true }));
    await click('Ejecutar');
    // contract: tarea 11, regla «Un resultado con timedOut muestra ... y, si era una entrega, cuenta como incorrecta»
    expect(await screen.findByText(TIMED_OUT)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('una figura se muestra como imagen con su src', async () => {
    const { run } = setup();
    run.mockResolvedValue(result({ figures: ['data:image/png;base64,AAAA'] }));
    await click('Ejecutar');
    // contract: tarea 11, tabla de casos («Resultado con 1 figura»)
    const img = await screen.findByRole('img', { name: 'Figura 1' });
    expect(img).toHaveAttribute('src', 'data:image/png;base64,AAAA');
  });

  it('un doble clic en «Ejecutar» lanza una sola ejecución', async () => {
    const { run } = setup();
    let finish!: (r: RunResult) => void;
    run.mockReturnValue(new Promise<RunResult>((resolve) => (finish = resolve)));
    const button = screen.getByRole('button', { name: 'Ejecutar' });
    await act(async () => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    // contract: runner-risks.md («Doble clic en Ejecutar encola dos ejecuciones; deshabilitar el botón»)
    expect(run).toHaveBeenCalledTimes(1);
    // review-12 I5: durante la ejecución el botón es aria-disabled (conserva el foco), no disabled
    expect(screen.getByRole('button', { name: 'Ejecutar' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await act(async () => finish(result()));
    expect(screen.getByRole('button', { name: 'Ejecutar' })).not.toHaveAttribute('aria-disabled');
  });

  it('un doble clic en «Entregar» da una sola entrega', async () => {
    const { run, onSubmit } = setup();
    let finish!: (r: RunResult) => void;
    run.mockReturnValue(new Promise<RunResult>((resolve) => (finish = resolve)));
    const button = screen.getByRole('button', { name: 'Entregar' });
    await act(async () => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    // contract: review-12 I5 (con aria-disabled la guarda del manejador es lo único que frena el segundo clic)
    expect(run).toHaveBeenCalledTimes(1);
    await act(async () => finish(result({ checks: [], passed: true })));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('si el ejecutor pasa a loading por la propia entrega (primera carga), «Entregar» conserva el foco', async () => {
    const { run, setState } = setup();
    let finish!: (r: RunResult) => void;
    run.mockReturnValue(new Promise<RunResult>((resolve) => (finish = resolve)));
    const button = screen.getByRole('button', { name: 'Entregar' });
    act(() => button.focus());
    await act(async () => {
      fireEvent.click(button);
    });
    setState('loading');
    // contract: review-12 I5 (medido en Chrome: en la primera carga el botón pasaba a disabled y el foco a body)
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Ejecutar' })).not.toBeDisabled();
    setState('ready');
    await act(async () => finish(result()));
  });

  it('con una entrega en curso «Entregar» conserva el foco (aria-disabled, no disabled)', async () => {
    const { run } = setup();
    let finish!: (r: RunResult) => void;
    run.mockReturnValue(new Promise<RunResult>((resolve) => (finish = resolve)));
    const button = screen.getByRole('button', { name: 'Entregar' });
    act(() => button.focus());
    await act(async () => {
      fireEvent.click(button);
    });
    // contract: review-12 I5 (el foco caía en body durante los 8-12 s de la entrega)
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveFocus();
    expect(document.activeElement).not.toBe(document.body);
    await act(async () => finish(result()));
  });

  it('un fallo del arnés (Error corriente) pide volver a ejecutar, sin trazas ni onSubmit ni reintento', async () => {
    const { run, onSubmit } = setup();
    run.mockRejectedValue(new Error('Traceback crudo del arnés'));
    await click('Entregar');
    // contract: runner-risks.md, ronda 1 («tratar ese rechazo como algo falló, vuelve a ejecutar, sin ofrecer retry()»)
    expect(
      await screen.findByText('Algo ha fallado al ejecutar. Vuelve a intentarlo.'),
    ).toBeVisible();
    expect(screen.queryByText(/Traceback crudo/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('un PythonLoadError al entregar no cuenta como respuesta y no enseña el mensaje técnico', async () => {
    const { run, onSubmit, setState } = setup();
    run.mockImplementation(() => {
      setState('failed');
      return Promise.reject(new PythonLoadError('Failed to fetch pyodide.asm.wasm'));
    });
    await click('Entregar');
    // contract: runner-risks.md («No mostrar error.message de PythonLoadError al jugador»)
    expect(screen.queryByText(/Failed to fetch/)).toBeNull();
    expect(screen.getByText(FAILED)).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('CodigoQuestion: guardas (review-11 I3)', () => {
  it.each<RunnerStatus>(['loading', 'failed'])(
    'Ctrl+Intro con el ejecutor en %s no ejecuta',
    async (status) => {
      const { run } = setup({ status });
      await act(async () => {
        fireEvent.keyDown(document.querySelector('.cm-content')!, { key: 'Enter', ctrlKey: true });
      });
      // contract: review-11 I3 (mutación «quitar la guarda de estado de execute»; tarea 11 «loading: botones desactivados»)
      expect(run).not.toHaveBeenCalled();
    },
  );

  it('un plazo agotado al entregar entrega false aunque el resultado diga passed true', async () => {
    const { run, onSubmit } = setup();
    run.mockResolvedValue(result({ timedOut: true, passed: true }));
    await click('Entregar');
    // contract: review-11 I3 (mutación «submit(outcome.passed)»; tarea 11 «si era una entrega, cuenta como incorrecta»)
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('ejecutar sin haber tecleado guarda el código de partida como borrador', async () => {
    const { run, onDraft } = setup();
    await click('Ejecutar');
    // contract: review-11 I3 (mutación «flushDraft(false)»; tarea 11 «siempre antes de ejecutar o entregar»)
    expect(onDraft).toHaveBeenCalledExactlyOnceWith(STARTER);
    expect(onDraft.mock.invocationCallOrder[0]!).toBeLessThan(run.mock.invocationCallOrder[0]!);
  });

  it('entregar sin haber tecleado guarda el código de partida como borrador', async () => {
    const { onDraft } = setup();
    await click('Entregar');
    // contract: review-11 I3 (misma regla, por la vía de entregar)
    expect(onDraft).toHaveBeenCalledExactlyOnceWith(STARTER);
  });

  it('si la pregunta se desmonta con una entrega en curso, onSubmit no se llama', async () => {
    const { run, onSubmit, unmount } = setup();
    let finish!: (r: RunResult) => void;
    run.mockReturnValue(new Promise<RunResult>((resolve) => (finish = resolve)));
    await click('Entregar');
    unmount();
    await act(async () => finish(result({ passed: true })));
    // contract: review-11 I3 (mutación «quitar if (!alive.current) return»; RISKS «onSubmit no se llama tras desmontar»)
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('un PythonLoadError no enseña además el aviso de fallo del arnés', async () => {
    const { run, setState } = setup();
    run.mockImplementation(() => {
      setState('failed');
      return Promise.reject(new PythonLoadError('x'));
    });
    await click('Ejecutar');
    // contract: review-11 I3 (mutación «setHarnessFailed también para PythonLoadError»: dos avisos a la vez)
    expect(screen.getByText(FAILED)).toBeVisible();
    expect(screen.queryByText(HARNESS_FAILED)).toBeNull();
  });

  it('mientras se ejecuta se ve «Ejecutando…» como estado', async () => {
    const { run } = setup();
    let finish!: (r: RunResult) => void;
    run.mockReturnValue(new Promise<RunResult>((resolve) => (finish = resolve)));
    await click('Ejecutar');
    // contract: review-11 I3 (mutación «busy && status !== loading → false»; tarea 11 indicador de ejecución)
    expect(screen.getByText('Ejecutando…')).toHaveAttribute('role', 'status');
    await act(async () => finish(result()));
    expect(screen.queryByText('Ejecutando…')).toBeNull();
  });
});

describe('CodigoQuestion: resultados (review-11 M5, M7)', () => {
  it('los mensajes de las comprobaciones se pintan como Markdown en línea', async () => {
    const { run } = setup();
    run.mockResolvedValue(
      result({ checks: [{ passed: false, message: 'No encuentro `x`.' }], passed: false }),
    );
    await click('Entregar');
    const item = await screen.findByText(/No encuentro/);
    // contract: review-11 M5 (Md en línea, como las opciones de OpcionQuestion)
    expect(item.closest('.code__check')!.querySelector('code')).toHaveTextContent('x');
    expect(item.closest('.code__check')!.textContent).not.toContain('`');
  });

  it('la salida, la traza y las comprobaciones están en una región viva con nombre', async () => {
    const { run } = setup();
    run.mockResolvedValue(
      result({
        stdout: 'salida 42\n',
        checks: [{ passed: true, message: 'Bien' }],
        passed: true,
      }),
    );
    const region = screen.getByRole('status', { name: 'Resultado' });
    // contract: review-11 M7 (región viva acotada: existe antes del resultado para que se anuncie)
    expect(region).toBeEmptyDOMElement();
    await click('Entregar');
    expect(within(region).getByText(/salida 42/)).toBeInTheDocument();
    // contract: fix 18b-B R44 (la comprobación superada sigue dentro de la región viva, como resumen y sin su mensaje)
    expect(within(region).getByText('1 de 1 comprobación superada')).toBeInTheDocument();
    expect(within(region).queryByText('Bien')).toBeNull();
  });
});

describe('CodigoQuestion: resumen de comprobaciones (18b fix B, R44)', () => {
  const three = (flags: boolean[]) =>
    result({
      checks: flags.map((passed, i) => ({ passed, message: `diagnóstico ${i + 1}` })),
      passed: flags.every(Boolean),
    });

  it('con las tres superadas solo se ve el resumen: ningún mensaje, ninguna marca ni lista', async () => {
    const { run } = setup();
    run.mockResolvedValue(three([true, true, true]));
    await click('Entregar');
    const region = screen.getByRole('status', { name: 'Resultado' });
    // contract: fix 18b-B R44 («N de M comprobaciones superadas»; con todas superadas, solo el resumen)
    expect(await within(region).findByText('3 de 3 comprobaciones superadas')).toBeInTheDocument();
    expect(within(region).queryByText(/diagnóstico/)).toBeNull();
    expect(within(region).queryByText('Superada')).toBeNull();
    expect(within(region).queryByText('Fallida')).toBeNull();
    expect(region.querySelector('.code__checks')).toBeNull();
  });

  it('con una fallida de tres: el resumen «2 de 3» y solo el mensaje de la que falla', async () => {
    const { run } = setup();
    run.mockResolvedValue(three([true, false, true]));
    await click('Entregar');
    const region = screen.getByRole('status', { name: 'Resultado' });
    // contract: fix 18b-B R44 (debajo del resumen, solo las que fallan, cada una con su mensaje)
    expect(await within(region).findByText('2 de 3 comprobaciones superadas')).toBeInTheDocument();
    expect(within(region).getByText('diagnóstico 2')).toBeInTheDocument();
    expect(within(region).queryByText('diagnóstico 1')).toBeNull();
    expect(within(region).queryByText('diagnóstico 3')).toBeNull();
    expect(region.querySelectorAll('.code__check')).toHaveLength(1);
    expect(within(region).getByText('Fallida')).toBeInTheDocument();
  });

  it('con todas fallidas: «0 de 3» y los tres mensajes', async () => {
    const { run } = setup();
    run.mockResolvedValue(three([false, false, false]));
    await click('Entregar');
    // contract: fix 18b-B R44 (cada comprobación que falla da su mensaje, spec sección 7)
    expect(await screen.findByText('0 de 3 comprobaciones superadas')).toBeInTheDocument();
    expect(screen.getAllByText(/diagnóstico/)).toHaveLength(3);
  });

  it('el resumen de «Ejecutar» sigue el mismo criterio', async () => {
    const { run } = setup();
    run.mockResolvedValue(three([true, false, true]));
    await click('Ejecutar');
    // contract: fix 18b-B R44 (el panel es el mismo en Ejecutar y en Entregar)
    expect(await screen.findByText('2 de 3 comprobaciones superadas')).toBeInTheDocument();
    expect(screen.queryByText('diagnóstico 1')).toBeNull();
    expect(screen.getByText('diagnóstico 2')).toBeInTheDocument();
  });

  it('en examen (hideChecks) no se ve ni el resumen ni ningún mensaje', async () => {
    const { run } = setup({ hideChecks: true });
    run.mockResolvedValue(three([true, false, true]));
    await click('Entregar');
    // contract: ruling R28 (en examen no se enseñan las comprobaciones) se mantiene con R44
    expect(screen.queryByText(/comprobaciones? superadas?/)).toBeNull();
    expect(screen.queryByText(/diagnóstico/)).toBeNull();
    expect(screen.queryByText('Comprobaciones')).toBeNull();
  });
});

describe('CodigoQuestion: hideChecks (examen)', () => {
  const failedChecks = result({ checks: [{ passed: false, message: 'x debería valer 3' }] });

  it('con hideChecks la entrega no pinta las comprobaciones y onSubmit llega con su resultado', async () => {
    const { run, onSubmit } = setup({ hideChecks: true });
    run.mockResolvedValue(failedChecks);
    await click('Entregar');
    // contract: review-12 I2 / ruling R28 (en examen la entrega no enseña la corrección)
    expect(onSubmit).toHaveBeenCalledWith(false);
    expect(screen.queryByText('Fallida')).not.toBeInTheDocument();
    expect(screen.queryByText(/x debería valer 3/)).not.toBeInTheDocument();
    expect(screen.queryByText('Comprobaciones')).not.toBeInTheDocument();
  });

  it('con hideChecks «Ejecutar» sigue enseñando salida y errores, y la región queda vacía si no hay nada', async () => {
    const { run } = setup({ hideChecks: true });
    run.mockResolvedValue(result({ stdout: 'salida 7\n', error: 'Traceback X' }));
    await click('Ejecutar');
    // contract: review-12 I2 («Ejecutar» sigue mostrando salida, figura y errores)
    expect(screen.getByText(/salida 7/)).toBeInTheDocument();
    expect(screen.getByText(/Traceback X/)).toBeInTheDocument();
    run.mockResolvedValue(failedChecks);
    await click('Entregar');
    expect(screen.getByRole('status', { name: 'Resultado' })).toBeEmptyDOMElement();
  });

  it('por defecto (sin hideChecks) las comprobaciones se ven', async () => {
    const { run } = setup();
    run.mockResolvedValue(failedChecks);
    await click('Entregar');
    // contract: review-12 I2 (por defecto false; control de las pruebas anteriores)
    expect(screen.getByText('Fallida')).toBeInTheDocument();
    expect(screen.getByText(/x debería valer 3/)).toBeInTheDocument();
  });
});

describe('CodigoQuestion: estado del ejecutor', () => {
  it('en loading, los botones de acción están desactivados y se ve el indicador', () => {
    setup({ status: 'loading' });
    // contract: tarea 11, tabla de casos («Estado loading»)
    expect(screen.getByText(LOADING)).toBeVisible();
    // contract: rereview-12 N2, N3: aria-disabled (no disabled) para que el foco no caiga en body
    for (const name of ['Ejecutar', 'Entregar']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByRole('button', { name })).not.toBeDisabled();
    }
  });

  it('el indicador sigue al estado del ejecutor y se da de baja al desmontar', () => {
    const { setState, listeners, unmount } = setup({ status: 'ready' });
    expect(screen.queryByText(LOADING)).toBeNull();
    setState('loading');
    expect(screen.getByText(LOADING)).toBeVisible();
    setState('ready');
    expect(screen.queryByText(LOADING)).toBeNull();
    expect(listeners.size).toBe(1);
    unmount();
    // contract: runner-risks.md («Darse de baja al desmontar»)
    expect(listeners.size).toBe(0);
  });

  it('en failed se ve el mensaje y «Reintentar» llama a retry', () => {
    const { retry } = setup({ status: 'failed' });
    // contract: tarea 11, tabla de casos («Estado failed»)
    expect(screen.getByText(FAILED)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(retry).toHaveBeenCalledTimes(1);
    // contract: rereview-12b m-a (jsdom no mueve el foco de un disabled: se comprueba el atributo)
    for (const name of ['Ejecutar', 'Entregar']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByRole('button', { name })).not.toBeDisabled();
    }
  });

  it.each<RunnerStatus>(['loading', 'failed'])(
    'con el ejecutor en %s, un clic en «Ejecutar» o «Entregar» no lanza ninguna ejecución',
    async (status) => {
      const { run, onSubmit } = setup({ status });
      await click('Ejecutar');
      await click('Entregar');
      // contract: rereview-12 N2, N3 (con aria-disabled la guarda de execute es lo único que frena el clic)
      expect(run).not.toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    },
  );

  it('N3: tras un plazo agotado en «Ejecutar» (el ejecutor se recarga) el botón conserva el foco', async () => {
    const { run, setState } = setup();
    run.mockImplementation(() => {
      setState('loading');
      return Promise.resolve(result({ timedOut: true }));
    });
    const button = screen.getByRole('button', { name: 'Ejecutar' });
    act(() => button.focus());
    await act(async () => {
      fireEvent.click(button);
    });
    // contract: rereview-12 N3 (medido en Chrome: tras un bucle infinito el foco acababa en BODY y no volvía)
    expect(screen.getByText(TIMED_OUT)).toBeVisible();
    expect(screen.getByText(LOADING)).toBeVisible();
    expect(button).toHaveFocus();
    expect(document.activeElement).not.toBe(document.body);
    // jsdom no saca el foco de un botón que pasa a disabled (el navegador sí): el atributo es lo único
    // observable del foco que se perdería en Chrome, así que se comprueba aparte de toHaveFocus
    for (const name of ['Ejecutar', 'Entregar']) {
      expect(screen.getByRole('button', { name })).not.toBeDisabled();
    }
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await act(async () => {
      fireEvent.click(button);
    });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('N2: si el ejecutor pasa a failed durante una entrega, «Entregar» conserva el foco', async () => {
    const { run, onSubmit, setState } = setup();
    run.mockImplementation(() => {
      setState('failed');
      return Promise.reject(new PythonLoadError('Failed to fetch pyodide.asm.wasm'));
    });
    const button = screen.getByRole('button', { name: 'Entregar' });
    act(() => button.focus());
    await act(async () => {
      fireEvent.click(button);
    });
    // contract: rereview-12 N2 (medido en Chrome con el CDN bloqueado: el foco acababa en BODY)
    expect(screen.getByText(FAILED)).toBeVisible();
    expect(button).toHaveFocus();
    expect(document.activeElement).not.toBe(document.body);
    // jsdom no saca el foco de un botón que pasa a disabled (el navegador sí): el atributo es lo único
    // observable del foco que se perdería en Chrome, así que se comprueba aparte de toHaveFocus
    for (const name of ['Ejecutar', 'Entregar']) {
      expect(screen.getByRole('button', { name })).not.toBeDisabled();
    }
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await act(async () => {
      fireEvent.click(button);
    });
    expect(run).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('un estado failed sin ninguna ejecución pendiente también se muestra', () => {
    const { setState } = setup({ status: 'loading' });
    setState('failed');
    // contract: task-6b-report.md, RISKS («el aviso llega solo por onStatus»)
    expect(screen.getByText(FAILED)).toBeVisible();
    expect(screen.queryByText(LOADING)).toBeNull();
  });
});

describe('CodigoQuestion: restablecer', () => {
  it('pide confirmación en la interfaz y solo entonces vuelve al código de partida', () => {
    const { onDraft } = setup({ draft: 'y = 2' });
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }));
    // contract: tarea 11, regla «Restablecer ... con confirmación en la propia interfaz»
    expect(editorText()).toBe('y = 2');
    expect(
      screen.getByText('¿Volver al código de partida? Se perderá lo que has escrito.'),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(editorText()).toBe('y = 2');
    expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, restablecer' }));
    expect(editorText()).toBe(STARTER);
    expect(onDraft).toHaveBeenLastCalledWith(STARTER);
  });
});

describe('CodigoQuestion: restablecer, resultados y foco (review-11 M2, M3)', () => {
  it('restablecer borra la salida, las comprobaciones y las figuras anteriores', async () => {
    const { run } = setup();
    run.mockResolvedValue(
      result({
        stdout: 'resultado 42\n',
        figures: ['data:image/png;base64,AAAA'],
        checks: [{ passed: false, message: 'x debería valer 1' }],
      }),
    );
    await click('Entregar');
    expect(await screen.findByText(/resultado 42/)).toBeInTheDocument();
    await click('Restablecer');
    await click('Sí, restablecer');
    // contract: review-11 M2 (restablecer vuelve a la pantalla inicial: nada de la ejecución anterior)
    expect(screen.queryByText(/resultado 42/)).toBeNull();
    expect(screen.queryByText('x debería valer 1')).toBeNull();
    expect(screen.queryByRole('img', { name: 'Figura 1' })).toBeNull();
  });

  it('restablecer también borra el aviso de fallo del arnés', async () => {
    const { run } = setup();
    run.mockRejectedValue(new Error('x'));
    await click('Ejecutar');
    expect(await screen.findByText(HARNESS_FAILED)).toBeVisible();
    await click('Restablecer');
    await click('Sí, restablecer');
    // contract: review-11 M2
    expect(screen.queryByText(HARNESS_FAILED)).toBeNull();
  });

  it('tras «Sí, restablecer» el foco vuelve al editor', async () => {
    setup({ draft: 'y = 2' });
    await click('Restablecer');
    await click('Sí, restablecer');
    // contract: review-11 M3 (el panel de confirmación desaparece con el foco dentro: vuelve al editor)
    expect(document.activeElement).toBe(document.querySelector('.cm-content'));
  });

  it('restablecer no programa otro guardado del borrador', () => {
    vi.useFakeTimers();
    try {
      const { onDraft } = setup({ draft: 'y = 2' });
      fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }));
      fireEvent.click(screen.getByRole('button', { name: 'Sí, restablecer' }));
      act(() => vi.advanceTimersByTime(1000));
      // contract: review-11 I3 (mutación «quitar la anotación External»: el cambio del padre volvía por onChange)
      expect(onDraft).toHaveBeenCalledExactlyOnceWith(STARTER);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('CodigoQuestion: borrador', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('llama a onDraft con el texto tras la espera de 500 ms', () => {
    const { onDraft } = setup();
    type('a = 1');
    // contract: tarea 11, tabla de casos («Escribir») y regla «como mucho una vez cada 500 ms»
    expect(onDraft).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(499));
    expect(onDraft).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onDraft).toHaveBeenCalledTimes(1);
    expect(onDraft).toHaveBeenCalledWith('a = 1');
  });

  it('varias pulsaciones dentro de la ventana dan una sola llamada con el último texto', () => {
    const { onDraft } = setup();
    type('a');
    act(() => vi.advanceTimersByTime(200));
    type('ab');
    act(() => vi.advanceTimersByTime(200));
    type('abc');
    act(() => vi.advanceTimersByTime(100));
    // contract: tarea 11, regla «como mucho una vez cada 500 ms mientras se escribe»
    expect(onDraft).toHaveBeenCalledTimes(1);
    expect(onDraft).toHaveBeenCalledWith('abc');
    type('abcd');
    act(() => vi.advanceTimersByTime(500));
    expect(onDraft).toHaveBeenCalledTimes(2);
    expect(onDraft).toHaveBeenLastCalledWith('abcd');
  });

  it('dos guardados quedan al menos 500 ms uno del otro', () => {
    const { onDraft } = setup();
    type('a');
    act(() => vi.advanceTimersByTime(200));
    type('ab');
    act(() => vi.advanceTimersByTime(200));
    type('abc');
    act(() => vi.advanceTimersByTime(100)); // t = 500: primer guardado
    type('abcd');
    act(() => vi.advanceTimersByTime(200)); // t = 700
    // contract: review-11 I3 (mutación «timer.current = setTimeout»: temporizadores sueltos guardan antes de tiempo)
    expect(onDraft).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(300)); // t = 1000
    expect(onDraft).toHaveBeenCalledTimes(2);
    expect(onDraft).toHaveBeenLastCalledWith('abcd');
  });

  it('guarda el borrador antes de ejecutar y antes de entregar, sin esperar', async () => {
    const { onDraft, run } = setup();
    type('z = 9');
    expect(onDraft).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Ejecutar' }));
    });
    // contract: tarea 11, regla «siempre antes de ejecutar o entregar»
    expect(onDraft).toHaveBeenCalledWith('z = 9');
    expect(onDraft.mock.invocationCallOrder[0]!).toBeLessThan(run.mock.invocationCallOrder[0]!);
    // y el temporizador pendiente se canceló: no hay una segunda llamada
    act(() => vi.advanceTimersByTime(1000));
    expect(onDraft).toHaveBeenCalledTimes(1);
  });

  it('al desmontar con un borrador pendiente lo guarda', () => {
    const { onDraft, unmount } = setup();
    type('q = 3');
    unmount();
    // contract: tarea 11, regla «El borrador se guarda ...» (no se pierde lo tecleado si se cambia de pregunta)
    expect(onDraft).toHaveBeenCalledWith('q = 3');
  });
});

describe('CodigoQuestion: locked', () => {
  it('el editor es de solo lectura, «Ejecutar» sigue activo y «Entregar» y «Restablecer» no', async () => {
    const { run } = setup({ locked: true });
    // contract: tarea 11, tabla de casos («locked»)
    expect(view().state.readOnly).toBe(true);
    expect(screen.getByRole('button', { name: 'Ejecutar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Entregar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Restablecer' })).toBeDisabled();
    await click('Ejecutar');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('al pasar a locked conserva lo tecleado y deja de ser editable por el jugador', () => {
    const { props, rerender } = setup();
    type('w = 5');
    expect(view().state.readOnly).toBe(false);
    rerender(<CodigoQuestion {...props} locked />);
    // contract: task-10-report.md, RISKS («el estado local se conserva mientras el componente siga montado»)
    expect(editorText()).toBe('w = 5');
    expect(view().state.readOnly).toBe(true);
  });

  it('un reintento con el mismo id no reinicia el código', () => {
    const { props, rerender } = setup();
    type('w = 5');
    rerender(<CodigoQuestion {...props} question={question()} />);
    // contract: task-10-report.md, RISKS («una misma pregunta con el mismo id no reinicia el estado»)
    expect(editorText()).toBe('w = 5');
  });
});

describe('QuestionView: pregunta de código', () => {
  it('muestra «Cargando el editor…» y acaba montando el editor (carga diferida)', async () => {
    render(<QuestionView question={question()} locked={false} onSubmit={vi.fn()} />);
    // contract: review-11 R20 (CodigoQuestion se carga con lazy + Suspense; el fallback es un status)
    expect(screen.getByRole('status')).toHaveTextContent(EDITOR_LOADING);
    expect(await screen.findByLabelText('Editor de código Python')).toBeInTheDocument();
    expect(screen.queryByText(EDITOR_LOADING)).toBeNull();
  });

  it('pasa draft y onDraft al componente de código', async () => {
    const onDraft = vi.fn();
    const { unmount } = render(
      <QuestionView
        question={question()}
        locked={false}
        onSubmit={vi.fn()}
        draft="d = 4"
        onDraft={onDraft}
      />,
    );
    await screen.findByLabelText('Editor de código Python');
    // contract: tarea 11, «QuestionView recibe draft y onDraft opcionales y los pasa»
    expect(editorText()).toBe('d = 4');
    type('d = 5');
    unmount();
    expect(onDraft).toHaveBeenCalledWith('d = 5');
  });

  it('sin draft ni onDraft empieza con el código de partida', async () => {
    render(<QuestionView question={question()} locked={false} onSubmit={vi.fn()} />);
    await screen.findByLabelText('Editor de código Python');
    // contract: tarea 11, «draft y onDraft opcionales»
    expect(editorText()).toBe(STARTER);
  });
});

describe('CodigoQuestion: ayuda para quien no programa (petición de Oliver, 2026-10-20)', () => {
  const MATMUL_REF = 'import numpy as np\nM = np.array([[1, 2]])\nr = M @ M.T\n';
  const MATMUL_CARD = 'Producto de matrices: @';
  const failing = result({ checks: [{ passed: false, message: 'x debería valer 1' }] });
  const nextSteps = () => screen.queryByRole('heading', { name: 'Cómo seguir' });
  const groupTitles = () =>
    [...document.querySelectorAll('.guide__group-title')].map((p) => p.textContent);
  /** Abre el panel de la guía como lo haría el jugador (el navegador cambia `open` y lanza `toggle`). */
  const openGuide = () => {
    const guide = document.querySelector<HTMLDetailsElement>('details.guide')!;
    act(() => {
      guide.open = true;
      fireEvent(guide, new Event('toggle'));
    });
  };

  it('enseña «Qué se comprueba al entregar» con cada punto, antes de ejecutar nada', () => {
    setup();
    const box = screen
      .getByRole('heading', { name: 'Qué se comprueba al entregar' })
      .closest('section')!;
    // contract: petición 2026-10-20: «qué pruebas hay que pasar para que se considere válida»
    expect(
      within(box)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['x es un número.', 'x vale 1.']);
    // contract: la nota dice que tiene que cumplirse cada punto y que «Ejecutar» no gasta intento
    expect(within(box).getByText(/tiene que cumplirse cada punto/)).toBeInTheDocument();
    // contract: prueba de humo 8: en el examen no aparece la palabra «comprobaciones»
    expect(box.textContent).not.toMatch(/comprobaciones/i);
  });

  it('la guía de Python, plegada, propone las fichas de lo que usa la referencia', () => {
    setup({ q: { reference: MATMUL_REF } });
    const guide = document.querySelector<HTMLDetailsElement>('details.guide')!;
    // contract: plegada al empezar (el editor no baja hasta que el jugador la abre)
    expect(guide.open).toBe(false);
    // contract: las fichas (más de cien trozos de Markdown) no se pintan hasta abrir la guía
    expect(document.querySelectorAll('.guide__card')).toHaveLength(0);
    openGuide();
    expect(groupTitles()).toEqual(['Lo que usa esta pregunta', 'Lo básico', 'El resto de la guía']);
    const here = document.querySelector('.guide__group')!;
    // contract: la referencia usa @: la ficha del producto de matrices sale en la pregunta
    expect(within(here as HTMLElement).getByText(MATMUL_CARD)).toBeInTheDocument();
  });

  it('en examen la guía sale del código inicial: la referencia no insinúa la respuesta', () => {
    setup({ hideChecks: true, q: { starter: 'x = None', reference: MATMUL_REF } });
    openGuide();
    // contract: con hideChecks la guía se calcula solo con el `starter` (sin @)
    expect(groupTitles()).toEqual(['Lo básico', 'El resto de la guía']);
    expect(screen.getByText(MATMUL_CARD)).toBeInTheDocument();
  });

  it('«Ejecutar» sin salida ni figuras explica cómo ver los valores con print', async () => {
    const { run } = setup();
    run.mockResolvedValue(result());
    await click('Ejecutar');
    // contract: petición 2026-10-20: quien no programa no sabe que hace falta print
    expect(screen.getByText(/no ha escrito nada/)).toBeInTheDocument();
    run.mockResolvedValue(result({ figures: ['data:image/png;base64,AAAA'] }));
    await click('Ejecutar');
    // contract: con una figura el código sí ha enseñado algo
    expect(screen.queryByText(/no ha escrito nada/)).toBeNull();
  });

  it('una entrega fallida enseña «Cómo seguir»: la primera comprobación, print, la lista y las fichas', async () => {
    const { run } = setup({ q: { reference: MATMUL_REF } });
    run.mockResolvedValue(failing);
    await click('Entregar');
    const box = nextSteps()!.closest('section')!;
    // contract: petición 2026-10-20: «si no está bien, dar más dirección sobre el contexto general»
    expect(within(box).getByText(/primera comprobación fallida/)).toBeInTheDocument();
    expect(within(box).getByText(/Qué se comprueba al entregar/)).toBeInTheDocument();
    // contract: primero la ficha más concreta; las generales (import, listas, arrays) no, si hay otras
    expect(within(box).getAllByRole('button')[0]).toHaveTextContent(MATMUL_CARD);
    expect(within(box).queryByRole('button', { name: 'import: traer módulos' })).toBeNull();
    // contract: el resumen recuerda que tienen que pasar todas
    expect(
      screen.getByText('Para que la respuesta cuente como correcta tienen que pasar todas.'),
    ).toBeInTheDocument();
  });

  it('con un error, «Cómo seguir» pide arreglarlo primero y propone la ficha de errores', async () => {
    const { run } = setup();
    run.mockResolvedValue(result({ error: 'Error en tu código', checks: [] }));
    await click('Entregar');
    const box = nextSteps()!.closest('section')!;
    // contract: con error las comprobaciones no llegan a mirar nada
    expect(within(box).getByText(/se ha parado en un error/)).toBeInTheDocument();
    expect(
      within(box).getByRole('button', { name: 'Cuando Python se para: errores' }),
    ).toBeInTheDocument();
  });

  it('el botón de una ficha abre la guía y la ficha, y le pasa el foco', async () => {
    const { run } = setup({ q: { reference: MATMUL_REF } });
    run.mockResolvedValue(failing);
    await click('Entregar');
    await click(MATMUL_CARD);
    const guide = document.querySelector<HTMLDetailsElement>('details.guide')!;
    const summary = document.activeElement as HTMLElement;
    // contract: la ficha queda abierta, dentro del panel abierto, con el foco en su título
    expect(guide.open).toBe(true);
    expect(summary.textContent).toBe(MATMUL_CARD);
    expect((summary.parentElement as HTMLDetailsElement).open).toBe(true);
  });

  it('sin «Cómo seguir» si la entrega acierta, en examen o con la pregunta ya bloqueada', async () => {
    const ok = setup();
    ok.run.mockResolvedValue(
      result({ checks: [{ passed: true, message: 'x vale 1' }], passed: true }),
    );
    await click('Entregar');
    // contract: un acierto no necesita dirección
    expect(nextSteps()).toBeNull();
    ok.unmount();

    const exam = setup({ hideChecks: true });
    exam.run.mockResolvedValue(failing);
    await click('Entregar');
    // contract: el examen no corrige a la vista (review-12)
    expect(nextSteps()).toBeNull();
    exam.unmount();

    const last = setup();
    last.run.mockResolvedValue(failing);
    await click('Entregar');
    expect(nextSteps()).not.toBeNull();
    last.rerender(<CodigoQuestion {...last.props} locked />);
    // contract: bloqueada (segundo fallo: sale la solución) ya no se puede volver a entregar
    expect(nextSteps()).toBeNull();
  });
});
