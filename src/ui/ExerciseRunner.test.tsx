import { readFileSync } from 'node:fs';
import path from 'node:path';
import { EditorView } from '@codemirror/view';
import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CodigoQ, NumeroQ, Question } from '../content/schema';
import type { Mode, QuestionResult } from '../engine/session';
import type { RunResult } from '../python/core';
import type { PythonRunner, RunnerStatus } from '../python/runner';
import { ExerciseRunner } from './ExerciseRunner';
import { SUBMIT_COOLDOWN_MS } from './questions/parts';

// Ejecutor falso para la pregunta de código: el test decide qué contesta `run`.
const fake = vi.hoisted(() => ({ run: undefined as unknown, status: 'ready' as string }));
vi.mock('../python/runner', async (importOriginal) => {
  const original = await importOriginal<typeof import('../python/runner')>();
  const runner: PythonRunner = {
    run: (...args) => (fake.run as PythonRunner['run'])(...args),
    status: () => fake.status as RunnerStatus,
    onStatus: () => () => undefined,
    retry: () => undefined,
    dispose: () => undefined,
  };
  return { ...original, getRunner: () => runner };
});

const passedResult: RunResult = {
  stdout: '',
  error: null,
  figures: [],
  checks: [{ passed: true, message: 'ok' }],
  passed: true,
  timedOut: false,
};

const numero = (n: number, over: Partial<NumeroQ> = {}): NumeroQ => ({
  id: `q${n}`,
  type: 'numero',
  prompt: `Enunciado ${n}`,
  answer: 5,
  tol: 0.01,
  hints: [],
  explain: `EXPLICACION ${n}`,
  solution: `SOLUCION ${n}`,
  ...over,
});
const five = (): Question[] => [1, 2, 3, 4, 5].map((n) => numero(n));
const codigo = (): CodigoQ => ({
  id: 'c1',
  type: 'codigo',
  requirements: ['r'],
  prompt: 'Escribe código',
  hints: [],
  explain: 'EXPLICACION c1',
  solution: 'SOLUCION c1',
  starter: 'x = 1',
  checks: 'check(x == 1, "ok")',
  reference: 'x = 1',
});

const setup = (
  questions: Question[],
  over: {
    mode?: Mode;
    getDraft?: (id: string) => string | null;
    onDraft?: (id: string, code: string) => void;
  } = {},
) => {
  const onResult = vi.fn<(r: QuestionResult) => void>();
  const onDone = vi.fn();
  const user = userEvent.setup();
  const utils = render(
    <ExerciseRunner
      mode={over.mode ?? 'proyecto'}
      questions={questions}
      onResult={onResult}
      onDone={onDone}
      getDraft={over.getDraft}
      onDraft={over.onDraft}
    />,
  );
  return { onResult, onDone, user, ...utils };
};

const submitButton = () => screen.getByRole('button', { name: 'Entregar' });
const nextButton = () => screen.getByRole('button', { name: 'Siguiente' });
const hintButton = () => screen.queryByRole('button', { name: 'Dame una pista' });

// El botón «Entregar» queda desactivado 450 ms tras cada entrega: se espera a que vuelva.
const answer = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  await waitFor(() => expect(submitButton()).toBeEnabled());
  const field = screen.getByLabelText('Tu respuesta');
  await user.clear(field);
  await user.type(field, text);
  await user.click(submitButton());
};

const editor = (): EditorView => {
  const found = EditorView.findFromDOM(document.querySelector<HTMLElement>('.cm-editor')!);
  if (!found) throw new Error('no hay editor');
  return found;
};

// «Siguiente» no admite el teclado en sus primeros instantes: se espera a que pase el plazo.
const afterGuard = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, SUBMIT_COOLDOWN_MS + 50));
  });

const failedCodeResult: RunResult = {
  stdout: '',
  error: null,
  figures: [],
  checks: [{ passed: false, message: 'x debería valer 3' }],
  passed: false,
  timedOut: false,
};

afterEach(() => {
  fake.run = undefined;
  fake.status = 'ready';
});

describe('ExerciseRunner: flujo de la tanda', () => {
  // Plazo propio de 20 s: son 5 preguntas con userEvent real (unos 3 s en una máquina tranquila) y el
  // plazo de 5 s por defecto se agotaba con la máquina cargada (5097 ms medidos), sin que nada fallase.
  it('acertar las 5 a la primera: onDone con firsts 5 y onResult 5 veces', async () => {
    const { onResult, onDone, user } = setup(five());
    for (let n = 1; n <= 5; n++) {
      expect(screen.getByText(`${n} de 5`)).toBeInTheDocument();
      await answer(user, '5');
      expect(screen.getByText('¡Correcto!')).toBeInTheDocument();
      // onResult llega al cerrar la pregunta (Siguiente), no al entregar
      expect(onResult).toHaveBeenCalledTimes(n - 1);
      await user.click(nextButton());
      expect(onResult).toHaveBeenCalledTimes(n);
    }
    // contract: brief tarea 12, tabla de casos («Acertar las 5 a la primera»)
    expect(onDone).toHaveBeenCalledTimes(1);
    const summary = onDone.mock.calls[0]![0] as {
      firsts: number;
      correct: number;
      results: QuestionResult[];
    };
    expect(summary.firsts).toBe(5);
    expect(summary.correct).toBe(5);
    expect(summary.results).toHaveLength(5);
    expect(onResult).toHaveBeenCalledTimes(5);
  }, 20_000);

  it('fallar una vez y acertar: se ve explain y el resultado es firstTry false, correct true', async () => {
    const { onResult, user } = setup(five());
    await answer(user, '9');
    // contract: brief tarea 12, tabla de casos («Fallar una vez y acertar»)
    expect(screen.getByText('EXPLICACION 1')).toBeInTheDocument();
    expect(screen.queryByText('SOLUCION 1')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
    await answer(user, '5');
    // fase solved sin ser a la primera: acierto y también la solución
    expect(screen.getByText('¡Correcto!')).toBeInTheDocument();
    expect(screen.getByText('SOLUCION 1')).toBeInTheDocument();
    await user.click(nextButton());
    expect(onResult).toHaveBeenCalledWith({
      questionId: 'q1',
      correct: true,
      submissions: 2,
      hinted: false,
      firstTry: false,
    });
  });

  it('acertar a la primera no muestra la solución', async () => {
    const { user } = setup(five());
    await answer(user, '5');
    // contract: brief tarea 12, regla «Fase solved: ... si no fue a la primera, también solution»
    expect(screen.queryByText('SOLUCION 1')).not.toBeInTheDocument();
  });

  it('fallar dos veces: se ve solution y correct false', async () => {
    const { onResult, user } = setup(five());
    await answer(user, '9');
    await answer(user, '8');
    // contract: brief tarea 12, tabla de casos («Fallar dos veces»)
    expect(screen.getByText('SOLUCION 1')).toBeInTheDocument();
    await user.click(nextButton());
    expect(onResult.mock.calls[0]![0]).toMatchObject({
      questionId: 'q1',
      correct: false,
      firstTry: false,
      submissions: 2,
    });
  });

  it('pedir pista y acertar: firstTry false', async () => {
    const qs = [numero(1, { hints: ['PISTA A'] }), ...five().slice(1)];
    const { onResult, user } = setup(qs);
    await user.click(screen.getByRole('button', { name: 'Dame una pista' }));
    expect(screen.getByText('PISTA A')).toBeInTheDocument();
    await answer(user, '5');
    await user.click(nextButton());
    // contract: brief tarea 12, tabla de casos («Pedir pista y acertar»)
    expect(onResult.mock.calls[0]![0]).toMatchObject({
      correct: true,
      firstTry: false,
      hinted: true,
    });
  });

  it('dos pistas, tres pulsaciones: se ven dos y el botón desaparece', async () => {
    const qs = [numero(1, { hints: ['PISTA A', 'PISTA B'] }), ...five().slice(1)];
    const { user } = setup(qs);
    await user.click(hintButton()!);
    expect(screen.getByText('PISTA A')).toBeInTheDocument();
    expect(screen.queryByText('PISTA B')).not.toBeInTheDocument();
    await user.click(hintButton()!);
    // contract: brief tarea 12, tabla de casos («Dos pistas disponibles, pulsar tres veces»)
    expect(screen.getByText('PISTA A')).toBeInTheDocument();
    expect(screen.getByText('PISTA B')).toBeInTheDocument();
    expect(hintButton()).toBeNull();
    // el botón desaparece con el foco encima: el foco pasa a la lista de pistas
    expect(document.activeElement).toBe(screen.getByRole('list', { name: 'Pistas' }));
  });

  it('sin pistas en la pregunta no hay botón de pista', () => {
    setup(five());
    // contract: brief tarea 12, regla «ni cuando la pregunta no tiene pistas»
    expect(hintButton()).toBeNull();
  });

  it('una pista nueva no se pierde al fallar: sigue visible en explained', async () => {
    const qs = [numero(1, { hints: ['PISTA A', 'PISTA B'] }), ...five().slice(1)];
    const { user } = setup(qs);
    await user.click(hintButton()!);
    await answer(user, '9');
    expect(screen.getByText('PISTA A')).toBeInTheDocument();
    expect(hintButton()).not.toBeNull();
  });

  it('entrada no numérica: no cambia de fase', async () => {
    const { onResult, user } = setup(five());
    await answer(user, 'abc');
    // contract: brief tarea 12, tabla de casos («Entrada no numérica»)
    expect(screen.getByRole('alert')).toHaveTextContent('Escribe un número, por ejemplo 3,5');
    expect(screen.queryByText('EXPLICACION 1')).not.toBeInTheDocument();
    expect(screen.queryByText('¡Correcto!')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
    expect(onResult).not.toHaveBeenCalled();
    expect(submitButton()).toBeInTheDocument();
  });

  it('Intro en fase solved pasa a la siguiente', async () => {
    const { user } = setup(five());
    await answer(user, '5');
    // contract: brief tarea 12, reglas («Siguiente» recibe el foco; Intro lo activa)
    expect(nextButton()).toHaveFocus();
    await afterGuard(); // review-12 I1: el teclado espera el plazo de reentrega
    await user.keyboard('{Enter}');
    expect(screen.getByText('2 de 5')).toBeInTheDocument();
    expect(screen.getByText('Enunciado 2')).toBeInTheDocument();
  });

  it('tras un fallo con segunda oportunidad el foco pasa al panel de la explicación', async () => {
    const { user } = setup(five());
    await answer(user, '9');
    // contract: ui-conventions, añadido 1 (el botón «Entregar» queda desactivado y el foco cae en body)
    expect(screen.getByText('EXPLICACION 1').closest('.runner__feedback')).toHaveFocus();
  });

  it('el foco llega a «Siguiente» también en revealed', async () => {
    const { user } = setup(five());
    await answer(user, '9');
    await answer(user, '8');
    // contract: ui-conventions, añadido 1 (el control enfocado queda disabled y el foco cae en body)
    expect(nextButton()).toHaveFocus();
  });

  it('al pasar de pregunta el foco va al indicador de progreso y la pregunta empieza de cero', async () => {
    const { user } = setup(five());
    await answer(user, '5');
    await user.click(nextButton());
    // contract: ui-conventions, añadido 1 (el foco no puede caer en body)
    expect(screen.getByText('2 de 5')).toHaveFocus();
    expect(screen.getByLabelText('Tu respuesta')).toHaveValue('');
  });
});

describe('ExerciseRunner: la tecla en curso no cierra la pregunta (review-12 I1, m1)', () => {
  it('un keydown repetido (tecla mantenida) sobre «Siguiente» se ignora aun pasado el plazo', async () => {
    const { user } = setup(five());
    await answer(user, '9');
    await answer(user, '8');
    await afterGuard();
    const next = nextButton();
    // contract: review-12 I1 (Intro mantenido tras entregar saltaba a la pregunta siguiente)
    expect(fireEvent.keyDown(next, { key: 'Enter', repeat: true })).toBe(false);
    expect(fireEvent.keyDown(next, { key: ' ', repeat: true })).toBe(false);
    expect(screen.getByText('1 de 5')).toBeInTheDocument();
  });

  it('una pulsación de Intro en los primeros instantes tras bloquear no avanza; pasado el plazo sí', async () => {
    const { user, onResult } = setup(five());
    await answer(user, '5');
    // contract: review-12 I1 (la pulsación que estaba en curso no puede activar «Siguiente»)
    await user.keyboard('{Enter}');
    expect(screen.getByText('1 de 5')).toBeInTheDocument();
    expect(screen.getByText('¡Correcto!')).toBeInTheDocument();
    expect(onResult).not.toHaveBeenCalled();
    await afterGuard();
    await user.keyboard('{Enter}');
    expect(screen.getByText('2 de 5')).toBeInTheDocument();
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('Espacio en los primeros instantes tampoco activa «Siguiente» (ni al soltar)', async () => {
    const { user } = setup(five());
    await answer(user, '5');
    const next = nextButton();
    // contract: review-12 I1 (Espacio activa el botón al soltar la tecla)
    expect(fireEvent.keyDown(next, { key: ' ' })).toBe(false);
    expect(fireEvent.keyUp(next, { key: ' ' })).toBe(false);
    await afterGuard();
    expect(fireEvent.keyDown(next, { key: ' ' })).toBe(true);
    expect(fireEvent.keyUp(next, { key: ' ' })).toBe(true);
  });

  describe('N1: el plazo se cuenta desde la última tecla que llega a «Siguiente»', () => {
    // Reloj a mano: performance.now avanza solo cuando la prueba lo dice.
    let clock = 0;
    const setClock = () => {
      clock = 10_000;
      vi.spyOn(performance, 'now').mockImplementation(() => clock);
    };
    afterEach(() => vi.restoreAllMocks());

    it('el tecleo continuo tras bloquear mantiene la guarda; tras una pausa, Intro sí avanza', async () => {
      setClock();
      const { user, onResult } = setup(five());
      await answer(user, '5');
      const next = nextButton();
      clock += SUBMIT_COOLDOWN_MS + 50; // ya pasó el plazo desde el bloqueo
      // tecleo continuo de 2,5 s (una tecla cada 100 ms, con y sin repeat), sin pausa de 450 ms
      for (let i = 0; i < 25; i++) {
        clock += 100;
        fireEvent.keyDown(next, { key: 'a', repeat: i % 2 === 0 });
      }
      // contract: rereview-12 N1 (el tecleo continuo cerraba la pregunta a los 0,8 s y disparaba onDone)
      expect(fireEvent.keyDown(next, { key: 'Enter' })).toBe(false);
      expect(screen.getByText('1 de 5')).toBeInTheDocument();
      expect(onResult).not.toHaveBeenCalled();
      // el Espacio 100 ms después del Intro tragado también se traga
      clock += 100;
      expect(fireEvent.keyDown(next, { key: ' ' })).toBe(false);
      // contract: encargo task-12-fix2 N1 («un Intro tras una pausa de más del plazo sí avanza»)
      clock += SUBMIT_COOLDOWN_MS + 1;
      await user.keyboard('{Enter}');
      expect(screen.getByText('2 de 5')).toBeInTheDocument();
      expect(onResult).toHaveBeenCalledTimes(1);
    });

    it('la tecla mantenida (repeat) alarga el plazo: tras soltarla, un Intro inmediato no avanza', async () => {
      setClock();
      const { user, onResult } = setup(five());
      await answer(user, '5');
      const next = nextButton();
      clock += SUBMIT_COOLDOWN_MS + 50; // el plazo desde el bloqueo ya pasó
      // el jugador mantiene Retroceso (solo repeat) durante 1 s, sin ninguna tecla sin repeat
      for (let i = 0; i < 20; i++) {
        clock += 50;
        fireEvent.keyDown(next, { key: 'Backspace', repeat: true });
      }
      // contract: rereview-12b m-b (la regla cuenta desde la ÚLTIMA tecla, con o sin repeat)
      expect(fireEvent.keyDown(next, { key: 'Enter' })).toBe(false);
      expect(screen.getByText('1 de 5')).toBeInTheDocument();
      expect(onResult).not.toHaveBeenCalled();
      clock += SUBMIT_COOLDOWN_MS + 1;
      expect(fireEvent.keyDown(next, { key: 'Enter' })).toBe(true);
    });

    it('un Intro tragado alarga el plazo: otro Intro 300 ms después también se traga', async () => {
      setClock();
      const { user, onResult } = setup(five());
      await answer(user, '5');
      const next = nextButton();
      // contract: rereview-12b m-b (fija la regla actual: el Intro tragado cuenta como última tecla; 300 ms
      // desde el bloqueo y otros 300 ms desde el Intro tragado: 600 ms desde el bloqueo, pero solo 300 desde la última tecla)
      clock += 300;
      expect(fireEvent.keyDown(next, { key: 'Enter' })).toBe(false);
      clock += 300;
      expect(fireEvent.keyDown(next, { key: 'Enter' })).toBe(false);
      expect(screen.getByText('1 de 5')).toBeInTheDocument();
      expect(onResult).not.toHaveBeenCalled();
      clock += SUBMIT_COOLDOWN_MS + 1;
      expect(fireEvent.keyDown(next, { key: 'Enter' })).toBe(true);
    });

    it('con una entrega de código, el tecleo continuo más allá del resultado no dispara onDone', async () => {
      setClock();
      let resolveRun: (r: RunResult) => void = () => undefined;
      fake.run = vi.fn(() => new Promise<RunResult>((res) => (resolveRun = res)));
      const { user, onResult, onDone } = setup([codigo()]);
      await screen.findByLabelText('Editor de código Python');
      await user.click(screen.getByRole('button', { name: 'Entregar' }));
      act(() => editor().focus());
      await act(async () => resolveRun(passedResult));
      const next = nextButton();
      expect(next).toHaveFocus();
      // el jugador sigue tecleando (y pulsando Intro) 2,5 s después del resultado
      for (let i = 0; i < 25; i++) {
        clock += 100;
        await user.keyboard(i % 8 === 7 ? '{Enter}' : 'a');
      }
      // contract: rereview-12 N1 (medido en Chrome: «dev-codigo» se cerraba y lanzaba onDone a los 0,8 s)
      expect(screen.getByText('¡Correcto!')).toBeInTheDocument();
      expect(onResult).not.toHaveBeenCalled();
      expect(onDone).not.toHaveBeenCalled();
    });

    it('el clic de ratón no espera aunque se esté tecleando', async () => {
      setClock();
      const { user } = setup(five());
      await answer(user, '5');
      const next = nextButton();
      clock += 100;
      fireEvent.keyDown(next, { key: 'a' });
      // contract: encargo task-12-fix2 N1 («el clic de ratón no espera»)
      await user.click(next);
      expect(screen.getByText('2 de 5')).toBeInTheDocument();
    });
  });

  it('el clic de ratón no espera el plazo', async () => {
    const { user } = setup(five());
    await answer(user, '5');
    // contract: encargo task-12-fix1 I1 («El clic de ratón no espera»)
    await user.click(nextButton());
    expect(screen.getByText('2 de 5')).toBeInTheDocument();
  });

  it('con una entrega de código en curso, al llegar un fallo el foco sigue en el editor', async () => {
    let resolveRun: (r: RunResult) => void = () => undefined;
    fake.run = vi.fn(() => new Promise<RunResult>((res) => (resolveRun = res)));
    const { user } = setup([codigo(), numero(2)]);
    await screen.findByLabelText('Editor de código Python');
    await user.click(screen.getByRole('button', { name: 'Entregar' }));
    act(() => editor().focus());
    await act(async () => resolveRun(failedCodeResult));
    // contract: review-12 I1 (de 76 teclas, 31 se perdieron al saltar el foco al panel)
    expect(screen.getByText('EXPLICACION c1')).toBeInTheDocument();
    expect(document.activeElement?.closest('.cm-editor')).not.toBeNull();
  });

  it('con una entrega de código en curso, un acierto y un Intro inmediato no cierran la pregunta', async () => {
    let resolveRun: (r: RunResult) => void = () => undefined;
    fake.run = vi.fn(() => new Promise<RunResult>((res) => (resolveRun = res)));
    const { user, onResult, onDone } = setup([codigo()]);
    await screen.findByLabelText('Editor de código Python');
    await user.click(screen.getByRole('button', { name: 'Entregar' }));
    act(() => editor().focus());
    await act(async () => resolveRun(passedResult));
    // el editor quedó de solo lectura: el foco pasa a «Siguiente»
    expect(nextButton()).toHaveFocus();
    // contract: review-12 I1 (el siguiente Intro del tecleo activaba «Siguiente» y disparaba onDone)
    await user.keyboard('{Enter}');
    expect(screen.getByText('¡Correcto!')).toBeInTheDocument();
    expect(onResult).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('m1: tras fallar con Intro dentro del campo, el campo conserva el foco', async () => {
    const { user } = setup(five());
    await waitFor(() => expect(submitButton()).toBeEnabled());
    const field = screen.getByLabelText('Tu respuesta');
    await user.type(field, '9{Enter}');
    expect(screen.getByText('EXPLICACION 1')).toBeInTheDocument();
    // contract: review-12 m1 (el foco solo se mueve si el control quedó desactivado o es body)
    expect(field).toHaveFocus();
  });
});

describe('ExerciseRunner: indicadores', () => {
  it('en proyecto cuenta los aciertos a la primera; en hoja no', async () => {
    const proyecto = setup(five());
    expect(screen.getByText('A la primera: 0')).toBeInTheDocument();
    await answer(proyecto.user, '5');
    await proyecto.user.click(nextButton());
    // contract: brief tarea 12, regla «en modo proyecto, el contador de aciertos a la primera»
    expect(screen.getByText('A la primera: 1')).toBeInTheDocument();
    proyecto.unmount();
    setup(five(), { mode: 'hoja' });
    expect(screen.queryByText(/A la primera/)).not.toBeInTheDocument();
  });
});

describe('ExerciseRunner: color del panel (review-12 I4)', () => {
  const panel = () => document.querySelector('.runner__feedback')!;

  it('acierto: modificador ok; fallo con segunda oportunidad y solución: fail', async () => {
    const { user } = setup(five());
    expect(panel().className).toBe('runner__feedback');
    await answer(user, '9');
    // contract: review-12 I4 (barra por estado: acierto, fallo)
    expect(panel()).toHaveClass('runner__feedback--fail');
    await answer(user, '5');
    expect(panel()).toHaveClass('runner__feedback--ok');
    await user.click(nextButton());
    await answer(user, '9');
    await answer(user, '8');
    expect(panel()).toHaveClass('runner__feedback--fail');
  });

  it('en examen el panel es neutro: ni ok ni fail', async () => {
    const { user } = setup(five(), { mode: 'examen' });
    await answer(user, '5');
    // contract: review-12 I4 (neutro en examen: no delata el acierto)
    expect(panel().className).toBe('runner__feedback');
  });
});

describe('ExerciseRunner: modo examen', () => {
  it('sin botón de pista; tras fallar no se ve explain ni solution y solo cabe «Siguiente»', async () => {
    const qs = [numero(1, { hints: ['PISTA A'] }), ...five().slice(1)];
    const { onResult, user } = setup(qs, { mode: 'examen' });
    // contract: brief tarea 12, tabla de casos («Modo examen»)
    expect(hintButton()).toBeNull();
    await answer(user, '9');
    expect(screen.queryByText('EXPLICACION 1')).not.toBeInTheDocument();
    expect(screen.queryByText('SOLUCION 1')).not.toBeInTheDocument();
    expect(screen.getByText('Respuesta registrada')).toBeInTheDocument();
    expect(screen.getByLabelText('Tu respuesta')).toBeDisabled();
    expect(submitButton()).toBeDisabled();
    expect(nextButton()).toHaveFocus();
    await user.click(nextButton());
    expect(onResult.mock.calls[0]![0]).toMatchObject({ correct: false, submissions: 1 });
  });

  it('acertar en examen tampoco revela nada: solo «Respuesta registrada»', async () => {
    const { user } = setup(five(), { mode: 'examen' });
    await answer(user, '5');
    // contract: brief tarea 12, regla «En modo examen ... solo Respuesta registrada y Siguiente»
    expect(screen.getByText('Respuesta registrada')).toBeInTheDocument();
    expect(screen.queryByText('¡Correcto!')).not.toBeInTheDocument();
    expect(screen.queryByText('SOLUCION 1')).not.toBeInTheDocument();
  });
});

describe('ExerciseRunner: tanda terminada y vacía', () => {
  it('tras la última pregunta ya no hay pregunta que entregar y onDone se llama una vez', async () => {
    const { onDone, user } = setup([numero(1)]);
    await answer(user, '5');
    await user.click(nextButton());
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Tu respuesta')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
    expect(screen.getByText('Tanda terminada')).toHaveFocus();
  });

  it('una tanda vacía llama a onDone una vez con ceros y no pinta pregunta', () => {
    const { onDone, onResult } = setup([]);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith({ firsts: 0, correct: 0, results: [] });
    expect(onResult).not.toHaveBeenCalled();
  });
});

describe('ExerciseRunner: examen con pregunta de código (review-12 I2)', () => {
  it('la entrega no enseña las comprobaciones ni sus mensajes; «Respuesta registrada» sí', async () => {
    fake.run = vi.fn(() => Promise.resolve(failedCodeResult));
    const { user } = setup([codigo(), numero(2)], { mode: 'examen' });
    await screen.findByLabelText('Editor de código Python');
    await user.click(screen.getByRole('button', { name: 'Entregar' }));
    await screen.findByText('Respuesta registrada');
    // contract: review-12 I2 / ruling R28 (en examen no se enseña si la respuesta era correcta)
    expect(screen.queryByText('Fallida')).not.toBeInTheDocument();
    expect(screen.queryByText('Superada')).not.toBeInTheDocument();
    expect(screen.queryByText(/x debería valer 3/)).not.toBeInTheDocument();
  });

  it('fuera de examen las comprobaciones sí se ven (la prueba anterior muerde)', async () => {
    fake.run = vi.fn(() => Promise.resolve(failedCodeResult));
    const { user } = setup([codigo(), numero(2)], { mode: 'proyecto' });
    await screen.findByLabelText('Editor de código Python');
    await user.click(screen.getByRole('button', { name: 'Entregar' }));
    // contract: review-12 I2 (control de la prueba anterior)
    expect(await screen.findByText('Fallida')).toBeInTheDocument();
    expect(screen.getByText(/x debería valer 3/)).toBeInTheDocument();
  });

  it('en examen la entrega cuenta igual: onResult sale con correct false', async () => {
    fake.run = vi.fn(() => Promise.resolve(failedCodeResult));
    const { user, onResult } = setup([codigo()], { mode: 'examen' });
    await screen.findByLabelText('Editor de código Python');
    await user.click(screen.getByRole('button', { name: 'Entregar' }));
    await screen.findByText('Respuesta registrada');
    await afterGuard();
    await user.click(nextButton());
    // contract: review-12 I2 (hideChecks solo oculta lo que se pinta)
    expect(onResult.mock.calls[0]![0]).toMatchObject({ questionId: 'c1', correct: false });
  });
});

describe('ExerciseRunner: mutaciones que sobrevivían (review-12 I3)', () => {
  it('dos preguntas de código seguidas: cada una lee SU borrador, y getDraft solo se llama con código', async () => {
    const getDraft = vi.fn<(id: string) => string | null>((id) => `# borrador de ${id}`);
    fake.run = vi.fn(() => Promise.resolve(passedResult));
    const { user } = setup([codigo(), { ...codigo(), id: 'c2' }, numero(3)], {
      getDraft,
      onDraft: vi.fn(),
    });
    await screen.findByLabelText('Editor de código Python');
    // contract: review-12 I3 (M08: key de la pregunta; las dos compartían el borrador de la primera)
    expect(editor().state.doc.toString()).toBe('# borrador de c1');
    await user.click(screen.getByRole('button', { name: 'Entregar' }));
    await screen.findByText('¡Correcto!');
    await user.click(nextButton());
    await screen.findByText('2 de 3');
    await waitFor(() => expect(editor().state.doc.toString()).toBe('# borrador de c2'));
    await user.click(screen.getByRole('button', { name: 'Entregar' }));
    await screen.findByText('¡Correcto!');
    await user.click(nextButton());
    await screen.findByText('3 de 3');
    // contract: review-12 m7 (M24: getDraft solo para preguntas de código)
    expect(getDraft.mock.calls.map(([id]) => id)).toEqual(['c1', 'c2']);
  });

  it('una pista pedida con una entrega de código en curso no la borra la entrega tardía', async () => {
    let resolveRun: (r: RunResult) => void = () => undefined;
    fake.run = vi.fn(() => new Promise<RunResult>((res) => (resolveRun = res)));
    const { onResult, user } = setup([{ ...codigo(), hints: ['PISTA C'] }, numero(2)]);
    await screen.findByLabelText('Editor de código Python');
    await user.click(screen.getByRole('button', { name: 'Entregar' }));
    await user.click(screen.getByRole('button', { name: 'Dame una pista' }));
    expect(screen.getByText('PISTA C')).toBeInTheDocument();
    await act(async () => resolveRun(passedResult));
    expect(screen.getByText('PISTA C')).toBeInTheDocument();
    await user.click(nextButton());
    // contract: review-12 I3 (M12: la entrega se aplica sobre el estado de ahora, no sobre el del clic)
    expect(onResult.mock.calls[0]![0]).toMatchObject({
      correct: true,
      hinted: true,
      firstTry: false,
    });
  });

  it('el resumen separa «a la primera» de «acertadas»', async () => {
    const { onDone, user } = setup([numero(1), numero(2), numero(3)]);
    await answer(user, '5'); // a la primera
    await user.click(nextButton());
    await answer(user, '9');
    await answer(user, '5'); // a la segunda
    await user.click(nextButton());
    await answer(user, '9');
    await answer(user, '8'); // fallada
    await user.click(nextButton());
    // contract: review-12 I3 (M15: summaryOf.correct no es firsts)
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone.mock.calls[0]![0]).toMatchObject({ firsts: 1, correct: 2 });
  });

  it('StrictMode: una tanda vacía llama a onDone una vez', () => {
    const onDone = vi.fn();
    render(
      <StrictMode>
        <ExerciseRunner mode="proyecto" questions={[]} onResult={vi.fn()} onDone={onDone} />
      </StrictMode>,
    );
    // contract: review-12 I3 (P4: el efecto de la tanda vacía corre dos veces en StrictMode)
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('StrictMode: una tanda de una pregunta da un onResult y un onDone', async () => {
    const onDone = vi.fn();
    const onResult = vi.fn();
    const user = userEvent.setup();
    render(
      <StrictMode>
        <ExerciseRunner
          mode="proyecto"
          questions={[numero(1)]}
          onResult={onResult}
          onDone={onDone}
        />
      </StrictMode>,
    );
    await answer(user, '5');
    await user.click(nextButton());
    // contract: review-12 I3 (P5: los efectos de los manejadores no se duplican en StrictMode)
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('ExerciseRunner: pregunta de código (borrador y entrega tardía)', () => {
  it('getDraft se lee al montar la pregunta; onDraft recibe el id de SU pregunta al desmontar', async () => {
    const getDraft = vi.fn<(id: string) => string | null>((id) => (id === 'c1' ? 'x = 7' : null));
    const onDraft = vi.fn<(id: string, code: string) => void>();
    fake.run = vi.fn(() => Promise.resolve(passedResult));
    const { user } = setup([codigo(), numero(2)], { getDraft, onDraft });
    await screen.findByLabelText('Editor de código Python');
    // contract: review-11 RISKS («draft solo se lee al montar»; getDraft con el id de la pregunta pintada)
    expect(editor().state.doc.toString()).toBe('x = 7');
    expect(getDraft).toHaveBeenCalledWith('c1');
    expect(getDraft).toHaveBeenCalledTimes(1);

    act(() => editor().dispatch({ changes: { from: 0, to: 5, insert: 'x = 1' } }));
    await user.click(screen.getByRole('button', { name: 'Entregar' }));
    // la entrega llega después del clic; hasta entonces no hay «Siguiente»
    await screen.findByText('¡Correcto!');
    await user.click(nextButton());
    // contract: review-11 RISKS («onDraft se llama al desmontar»; la tanda cierra sobre el id de la pregunta pintada)
    const calls = onDraft.mock.calls.filter(([, code]) => code === 'x = 1');
    expect(calls.length).toBeGreaterThan(0);
    expect(onDraft.mock.calls.every(([id]) => id === 'c1')).toBe(true);
  });

  it('sin onDraft la pregunta de código funciona (el borrador se descarta)', async () => {
    fake.run = vi.fn(() => Promise.resolve(passedResult));
    const { user, onResult } = setup([codigo()]);
    await screen.findByLabelText('Editor de código Python');
    await user.click(screen.getByRole('button', { name: 'Entregar' }));
    await screen.findByText('¡Correcto!');
    await user.click(nextButton());
    expect(onResult.mock.calls[0]![0]).toMatchObject({ questionId: 'c1', correct: true });
  });

  it('la entrega de código llega tras el clic: hasta entonces no hay panel y onResult espera a «Siguiente»', async () => {
    // contract: review-11 RISKS («onSubmit se llama aunque locked haya pasado a true durante la espera»)
    let resolveRun: (r: RunResult) => void = () => undefined;
    fake.run = vi.fn(() => new Promise<RunResult>((res) => (resolveRun = res)));
    const qs: Question[] = [codigo(), numero(2)];
    const { onResult, user } = setup(qs);
    await screen.findByLabelText('Editor de código Python');
    await user.click(screen.getByRole('button', { name: 'Entregar' }));
    // la entrega sigue en curso: aún no hay panel de resultado
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument();
    await act(async () => resolveRun(passedResult));
    expect(nextButton()).toBeInTheDocument();
    expect(onResult).not.toHaveBeenCalled();
    fireEvent.click(nextButton());
    expect(onResult).toHaveBeenCalledTimes(1);
  });
});

describe('ExerciseRunner: hoja de estilos', () => {
  const css = readFileSync(path.join(process.cwd(), 'src/ui/theme.css'), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );
  const ruleFor = (selector: string): string => {
    const escaped = selector.replace(/[.[\]()*+?^$|\\:-]/g, '\\$&');
    const match = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm').exec(css);
    if (!match) throw new Error(`No hay regla para ${selector}`);
    return match[1]!;
  };

  it('el panel de explicación se desplaza por sí mismo en vez de ensanchar la página', () => {
    // contract: ui-conventions, añadido 5 (fórmulas en línea sin overflow-x; medido a 360 px en Chrome)
    expect(ruleFor('.runner__feedback')).toMatch(/overflow-x:\s*auto/);
    expect(ruleFor('.runner__feedback')).toMatch(/min-width:\s*0/);
  });

  it('el panel de resultado es una tarjeta: relleno, fondo, borde y barra de estado con los tokens', () => {
    const card = ruleFor('.runner__feedback:not(:empty)');
    // contract: review-12 I4 (el panel era texto suelto: padding 0, sin fondo ni borde)
    expect(card).toMatch(/padding:\s*var\(--space-3\)\s+var\(--space-4\)/);
    expect(card).toMatch(/background:\s*var\(--color-surface\)/);
    expect(card).toMatch(/border:\s*var\(--border-width\)\s+solid\s+var\(--color-border\)/);
    expect(card).toMatch(/border-left:\s*4px\s+solid\s+var\(--color-text-muted\)/);
    expect(ruleFor('.runner__feedback--ok:not(:empty)')).toMatch(/var\(--color-ok\)/);
    expect(ruleFor('.runner__feedback--fail:not(:empty)')).toMatch(/var\(--color-warn\)/);
    // sin colores literales en las reglas del panel
    expect(card + ruleFor('.runner__feedback--ok:not(:empty)')).not.toMatch(/#[0-9a-f]{3,6}/i);
  });

  it('el anillo de foco del panel va por dentro y el panel no recorta en vertical', () => {
    // contract: review-12 I4, m3 (el anillo sobresalía 4 px y rozaba el texto; overflow-y: hidden recortaba 2 px)
    expect(ruleFor('.runner__feedback:focus-visible')).toMatch(/outline-offset:\s*-\d+px/);
    expect(ruleFor('.runner__feedback')).not.toMatch(/overflow-y:\s*hidden/);
  });

  it('el anillo de foco del panel no tapa la barra de estado (el desplazamiento supera su ancho)', () => {
    const offset = Number(
      /outline-offset:\s*-(\d+)px/.exec(ruleFor('.runner__feedback:focus-visible'))?.[1],
    );
    const bar = Number(
      /border-left:\s*(\d+)px/.exec(ruleFor('.runner__feedback:not(:empty)'))?.[1],
    );
    // contract: rereview-12 N4 (con -2px el anillo cubría la mitad de la barra de 4 px; Chrome, captura del fallo)
    expect(bar).toBe(4);
    expect(offset).toBeGreaterThanOrEqual(bar + 2);
  });

  it('el panel vacío no ocupa sitio pero no sale del árbol de accesibilidad', () => {
    const empty = ruleFor('.runner__feedback:empty');
    // contract: review-12 m2 (display: none sacaba la región viva del árbol de accesibilidad)
    expect(empty).toMatch(/position:\s*absolute/);
    expect(empty).not.toMatch(/display:\s*none/);
  });

  it('los bloques de código cercados del Markdown se desplazan ellos y conservan el sangrado', () => {
    const block = ruleFor('.md pre');
    // contract: encargo task-12-fix1, «Añadido» (norma-distancia ex02.5 lleva un bloque ```python)
    expect(block).toMatch(/font-family:\s*var\(--font-mono\)/);
    expect(block).toMatch(/overflow-x:\s*auto/);
    expect(block).toMatch(/white-space:\s*pre\b(?!-)/);
    expect(block).toMatch(/background:\s*var\(--plane-area\)/);
    expect(block).toMatch(/border:\s*var\(--border-width\)\s+solid\s+var\(--color-border\)/);
    expect(block).toMatch(/padding:\s*var\(--space-3\)/);
    expect(ruleFor('.md pre code')).toMatch(/background:\s*none/);
  });

  it('el botón con una ejecución en curso (aria-disabled) se ve como desactivado', () => {
    // contract: review-12 I5 (aria-disabled no pinta nada por sí solo)
    expect(css).toMatch(/\.question__button\[aria-disabled='true'\]\s*\{[^}]*opacity:\s*0\.5/);
  });

  it('el área de la pregunta puede encogerse (min-width: 0)', () => {
    // contract: ui-conventions, añadido 5 (un hijo de rejilla sin min-width: 0 ensancha la página)
    expect(ruleFor('.runner')).toMatch(/min-width:\s*0/);
  });
});
