import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  ManipularQ,
  NumeroQ,
  OpcionQ,
  PlaneSpec,
  Question,
  RevisionQ,
  VectorQ,
} from '../../content/schema';
import { QuestionView } from './QuestionView';

const base = { hints: [], explain: 'e', solution: 's' };
const INVALID = 'Escribe un número, por ejemplo 3,5';

const numero = (over: Partial<NumeroQ> = {}): NumeroQ => ({
  ...base,
  id: 'n1',
  type: 'numero',
  prompt: 'Calcula **cinco**',
  answer: 5,
  tol: 0.01,
  ...over,
});
const vector = (over: Partial<VectorQ> = {}): VectorQ => ({
  ...base,
  id: 'v1',
  type: 'vector',
  prompt: 'Normaliza',
  answer: [0.6, 0.8],
  tol: 0.01,
  ...over,
});
const opcion = (over: Partial<OpcionQ> = {}): OpcionQ => ({
  ...base,
  id: 'o1',
  type: 'opcion',
  prompt: 'Elige',
  options: ['Uno', 'Dos', 'Tres'],
  correct: 1,
  ...over,
});
const revision = (over: Partial<RevisionQ> = {}): RevisionQ => ({
  ...base,
  id: 'r1',
  type: 'revision',
  prompt: 'Revisa',
  format: 'codigo',
  lines: ['a = 1', 'b = a +', 'c = 3'],
  faultyLine: 1,
  ...over,
});
const plane = (over: Partial<PlaneSpec> = {}): PlaneSpec => ({
  range: 6,
  snap: 1,
  vectors: [{ id: 'v', label: 'v', x: 1, y: 1, movable: true }],
  readouts: ['components'],
  ...over,
});
const manipular = (over: Partial<ManipularQ> = {}): ManipularQ => ({
  ...base,
  id: 'm1',
  type: 'manipular',
  prompt: 'Lleva v a la meta',
  plane: plane(),
  goals: [
    { metric: 'x', of: ['v'], target: 3, tol: 0.01 },
    { metric: 'y', of: ['v'], target: 2, tol: 0.01 },
  ],
  ...over,
});

const setup = (question: Question, locked = false) => {
  const onSubmit = vi.fn();
  const view = render(<QuestionView question={question} locked={locked} onSubmit={onSubmit} />);
  return { onSubmit, user: userEvent.setup(), ...view };
};
const submitButton = () => screen.getByRole('button', { name: 'Entregar' });

afterEach(() => {
  vi.useRealTimers();
});

describe('QuestionView: despacho', () => {
  // contract: tarea 10, reglas: cada componente muestra el enunciado con Md
  it('muestra el enunciado como Markdown', () => {
    setup(numero());
    expect(screen.getByText('cinco').tagName).toBe('STRONG');
  });

  // contract: tarea 10, reglas: figura estática si la hay (plano sin asas)
  it('numero con plano muestra la figura sin asas', () => {
    setup(numero({ plane: plane() }));
    expect(screen.getByRole('img', { name: 'Plano de vectores' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Asa/ })).toBeNull();
  });
});

describe('numero', () => {
  // contract: tarea 10, tabla: numero respuesta 5, escribir «5» y pulsar Intro -> onSubmit(true)
  it('Intro entrega una respuesta correcta', async () => {
    const { onSubmit, user } = setup(numero());
    await user.type(screen.getByRole('textbox', { name: 'Tu respuesta' }), '5{Enter}');
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(true);
  });

  // contract: tarea 10, tabla: numero respuesta 5, un valor distinto -> onSubmit(false) (la corrección es grade)
  it('una respuesta equivocada entrega false', async () => {
    const { onSubmit, user } = setup(numero());
    await user.type(screen.getByRole('textbox', { name: 'Tu respuesta' }), '4');
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(false);
  });

  // contract: tarea 10, tabla: numero «abc» y entregar -> aviso visible, onSubmit no llamado
  it('«abc» muestra el aviso y no entrega', async () => {
    const { onSubmit, user } = setup(numero());
    await user.type(screen.getByRole('textbox', { name: 'Tu respuesta' }), 'abc');
    await user.click(submitButton());
    expect(screen.getByText(INVALID)).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // contract: tarea 10, tabla: numero campo vacío y entregar -> aviso visible, onSubmit no llamado
  it('el campo vacío muestra el aviso y no entrega', async () => {
    const { onSubmit, user } = setup(numero());
    await user.click(submitButton());
    expect(screen.getByText(INVALID)).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // contract: tarea 10, tabla: numero respuesta 3,5, escribir «3,5» -> onSubmit(true)
  it('acepta la coma decimal', async () => {
    const { onSubmit, user } = setup(numero({ answer: 3.5 }));
    await user.type(screen.getByRole('textbox', { name: 'Tu respuesta' }), '3,5');
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(true);
  });

  // contract: tarea 10, restricciones globales: se aceptan decimales con punto
  it('acepta el punto decimal', async () => {
    const { onSubmit, user } = setup(numero({ answer: 3.5 }));
    await user.type(screen.getByRole('textbox', { name: 'Tu respuesta' }), '3.5');
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(true);
  });

  // contract: tarea 10, reglas: el aviso es de una entrada rechazada; al corregirla y entregar desaparece
  it('el aviso se retira al volver a entregar con un número válido', async () => {
    const { onSubmit, user } = setup(numero());
    const box = screen.getByRole('textbox', { name: 'Tu respuesta' });
    await user.type(box, 'abc');
    await user.click(submitButton());
    expect(screen.getByText(INVALID)).toBeVisible();
    await user.clear(box);
    await user.type(box, '5{Enter}');
    expect(screen.queryByText(INVALID)).toBeNull();
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(true);
  });
});

describe('vector', () => {
  // contract: tarea 10, reglas: vector con tantos campos como componentes tiene la respuesta, entre paréntesis
  it('hay un campo por componente de la respuesta', () => {
    setup(vector({ answer: [1, 2, 3] }));
    expect(screen.getAllByRole('textbox')).toHaveLength(3);
    expect(
      screen.getByRole('group', { name: 'Tu respuesta, componente a componente' }).textContent,
    ).toMatch(/^\(.*\)$/s);
  });

  // contract: tarea 10, tabla: vector [0.6, 0.8], escribir «0,6» y «0,8» -> onSubmit(true)
  it('acepta coma en cada componente', async () => {
    const { onSubmit, user } = setup(vector());
    await user.type(screen.getByRole('textbox', { name: 'Componente 1 de 2' }), '0,6');
    await user.type(screen.getByRole('textbox', { name: 'Componente 2 de 2' }), '0,8{Enter}');
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(true);
  });

  // contract: tarea 10, tabla: vector con un campo vacío -> aviso y sin llamada
  it('con un campo vacío muestra el aviso y no entrega', async () => {
    const { onSubmit, user } = setup(vector());
    await user.type(screen.getByRole('textbox', { name: 'Componente 1 de 2' }), '0,6');
    await user.click(submitButton());
    expect(screen.getByText(INVALID)).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // contract: tarea 10, reglas: una entrada que parseNumber rechaza -> aviso, sin onSubmit (aquí en un componente)
  it('con un componente ilegible muestra el aviso y no entrega', async () => {
    const { onSubmit, user } = setup(vector());
    await user.type(screen.getByRole('textbox', { name: 'Componente 1 de 2' }), '0,6');
    await user.type(screen.getByRole('textbox', { name: 'Componente 2 de 2' }), 'x');
    await user.click(submitButton());
    expect(screen.getByText(INVALID)).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // contract: tarea 10, reglas: se corrige con grade (vector distinto -> false)
  it('un vector equivocado entrega false', async () => {
    const { onSubmit, user } = setup(vector());
    await user.type(screen.getByRole('textbox', { name: 'Componente 1 de 2' }), '0,8');
    await user.type(screen.getByRole('textbox', { name: 'Componente 2 de 2' }), '0,6');
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(false);
  });
});

describe('vector con shape (respuesta en forma de matriz)', () => {
  const matrix = (over: Partial<VectorQ> = {}) =>
    vector({ answer: [1, 2, 3, 4], tol: 0.01, shape: [2, 2], ...over });
  const cell = (r: number, c: number) =>
    screen.getByRole('textbox', { name: `Fila ${r}, columna ${c}` });

  // contract: tarea T1 del juego 2: con shape [filas, columnas] los campos son una rejilla, con aria-label «Fila r, columna c»
  it('hay un campo por celda, con su fila y columna, sin paréntesis de tupla', () => {
    setup(matrix({ answer: [1, 2, 3, 4, 5, 6], shape: [2, 3] }));
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
    expect(cell(2, 3)).toBeInTheDocument();
    const group = screen.getByRole('group', { name: 'Tu respuesta, fila a fila' });
    expect(group.style.getPropertyValue('--matrix-cols')).toBe('3'); // contract: tarea T1: tantas columnas como pide shape
    expect(
      screen.queryByRole('group', { name: 'Tu respuesta, componente a componente' }),
    ).toBeNull();
  });

  // contract: tarea T1: el orden de tabulación es por filas (el de la respuesta)
  it('el orden de tabulación es por filas', async () => {
    const { user } = setup(matrix());
    await user.tab();
    expect(cell(1, 1)).toHaveFocus();
    await user.tab();
    expect(cell(1, 2)).toHaveFocus();
    await user.tab();
    expect(cell(2, 1)).toHaveFocus();
    await user.tab();
    expect(cell(2, 2)).toHaveFocus();
  });

  // contract: tarea T1: la respuesta va por filas y se corrige como un vector (coma o punto)
  it('se corrige por filas, con coma o punto decimal', async () => {
    const { onSubmit, user } = setup(matrix({ answer: [0.5, 2, -3, 4] }));
    await user.type(cell(1, 1), '0,5');
    await user.type(cell(1, 2), '2');
    await user.type(cell(2, 1), '-3');
    await user.type(cell(2, 2), '4.0{Enter}');
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(true);
  });

  // contract: tarea T1: celdas intercambiadas (por columnas en vez de por filas) no es la respuesta
  it('una matriz traspuesta entrega false', async () => {
    const { onSubmit, user } = setup(matrix());
    await user.type(cell(1, 1), '1');
    await user.type(cell(1, 2), '3');
    await user.type(cell(2, 1), '2');
    await user.type(cell(2, 2), '4');
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(false);
  });

  // contract: tarea 10, reglas: una celda vacía o ilegible -> aviso, sin onSubmit
  it('con una celda vacía muestra el aviso y no entrega', async () => {
    const { onSubmit, user } = setup(matrix());
    await user.type(cell(1, 1), '1');
    await user.click(submitButton());
    expect(screen.getByText(INVALID)).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('opcion', () => {
  // contract: tarea 10, tabla: opcion, pulsar una opción sin entregar -> onSubmit no llamado
  it('elegir una opción no entrega', async () => {
    const { onSubmit, user } = setup(opcion());
    await user.click(screen.getByRole('radio', { name: 'Dos' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // contract: tarea 10, tabla: opcion incorrecta y entregar -> onSubmit(false)
  it('una opción incorrecta entrega false', async () => {
    const { onSubmit, user } = setup(opcion());
    await user.click(screen.getByRole('radio', { name: 'Uno' }));
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(false);
  });

  // contract: tarea 10, reglas: opción correcta y entregar -> onSubmit(true)
  it('la opción correcta entrega true', async () => {
    const { onSubmit, user } = setup(opcion());
    await user.click(screen.getByRole('radio', { name: 'Dos' }));
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(true);
  });

  // contract: tarea 10, reglas: las opciones son elegibles con teclado
  it('se elige con el teclado y se entrega con otro botón', async () => {
    const { onSubmit, user } = setup(opcion());
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Dos' })).toBeChecked();
    await user.tab();
    expect(submitButton()).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(true);
  });

  // contract: tarea 10, reglas: sin elegir opción no hay respuesta que entregar (botón desactivado)
  it('sin opción elegida no se puede entregar', () => {
    setup(opcion());
    expect(submitButton()).toBeDisabled();
  });

  // contract: tarea 10, reglas: opciones en Markdown (Md)
  it('las opciones se muestran como Markdown', () => {
    setup(opcion({ options: ['**negrita**', 'b'] }));
    expect(screen.getByText('negrita').tagName).toBe('STRONG');
  });
});

describe('revision', () => {
  // contract: tarea 10, tabla: revision faultyLine 1, «Tiene un error», línea 2 (índice 1), entregar -> onSubmit(true)
  it('señalar la línea errónea entrega true', async () => {
    const { onSubmit, user } = setup(revision());
    await user.click(screen.getByRole('radio', { name: 'Tiene un error' }));
    await user.click(screen.getByRole('button', { name: /^Línea 2:/ }));
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(true);
  });

  // contract: tarea 10, tabla: revision, señalar otra línea -> onSubmit(false)
  it('señalar otra línea entrega false', async () => {
    const { onSubmit, user } = setup(revision());
    await user.click(screen.getByRole('radio', { name: 'Tiene un error' }));
    await user.click(screen.getByRole('button', { name: /^Línea 1:/ }));
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(false);
  });

  // contract: tarea 10, tabla: revision faultyLine null, «Está bien», entregar -> onSubmit(true)
  it('«Está bien» con faultyLine null entrega true', async () => {
    const { onSubmit, user } = setup(revision({ faultyLine: null }));
    await user.click(screen.getByRole('radio', { name: 'Está bien' }));
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(true);
  });

  // contract: tarea 10, reglas: «Está bien» cuando sí hay un error -> false (grade compara faultyLine)
  it('«Está bien» con una línea errónea entrega false', async () => {
    const { onSubmit, user } = setup(revision());
    await user.click(screen.getByRole('radio', { name: 'Está bien' }));
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(false);
  });

  // contract: tarea 10, tabla: «Tiene un error» sin elegir línea -> botón de entregar desactivado
  it('«Tiene un error» sin línea deja el botón desactivado', async () => {
    const { user } = setup(revision());
    expect(submitButton()).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'Tiene un error' }));
    expect(submitButton()).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /^Línea 3:/ }));
    expect(submitButton()).toBeEnabled();
  });

  // contract: tarea 10, reglas: líneas numeradas desde 1; monoespaciada si format es codigo
  it('numera las líneas y usa monoespaciada solo con format codigo', () => {
    const { unmount } = setup(revision());
    const list = screen.getByRole('list', { name: 'Líneas' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(within(list).getByText('3')).toBeInTheDocument();
    expect(list).toHaveClass('question__lines--code');
    unmount();
    setup(revision({ format: 'texto' }));
    expect(screen.getByRole('list', { name: 'Líneas' })).not.toHaveClass('question__lines--code');
  });

  // contract: tarea 10, reglas: la línea errónea se pulsa solo con la opción «Tiene un error»
  it('sin «Tiene un error» las líneas no se pulsan', () => {
    setup(revision());
    expect(screen.queryByRole('button', { name: /^Línea/ })).toBeNull();
  });
});

describe('manipular', () => {
  // contract: tarea 10, tabla: manipular meta (3,2) desde (1,1): mover con teclado y entregar -> onSubmit(true)
  it('mover con teclado hasta la meta y entregar', async () => {
    const { onSubmit, user } = setup(manipular());
    await user.tab();
    expect(screen.getByRole('button', { name: /Asa del vector v/ })).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowUp}');
    expect(screen.getByRole('button', { name: 'Asa del vector v, en (3, 2)' })).toBeInTheDocument();
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(true);
  });

  // contract: tarea 10, reglas: entregar sin mover (fuera de la meta) -> onSubmit(false)
  it('entregar sin mover entrega false', async () => {
    const { onSubmit, user } = setup(manipular());
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(false);
  });

  // contract: tarea 10, tabla: manipular, «Recolocar» -> vuelve a la posición inicial
  it('«Recolocar» devuelve el vector a su posición inicial', async () => {
    const { user } = setup(manipular());
    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowUp}');
    expect(screen.getByRole('button', { name: 'Asa del vector v, en (2, 2)' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Recolocar' }));
    expect(screen.getByRole('button', { name: 'Asa del vector v, en (1, 1)' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: 'Lecturas' })).getByText('(1, 1)'),
    ).toBeInTheDocument();
  });
});

describe('manipular: el sentido del ejercicio', () => {
  const purpose = { why: 'PARA QUE', aim: 'OBJETIVO', takeaway: 'CONCLUSION' };

  // contract: petición de Oliver 2026-10-28: «Para qué sirve» y «Qué vas a conseguir» antes del enunciado
  it('con purpose, enseña para qué sirve y qué se busca antes del enunciado', () => {
    setup(manipular({ purpose }));
    const box = screen.getByRole('region', { name: 'El sentido del ejercicio' });
    expect(within(box).getByRole('heading', { name: 'Para qué sirve' })).toBeInTheDocument();
    expect(within(box).getByText('PARA QUE')).toBeInTheDocument();
    expect(within(box).getByRole('heading', { name: 'Qué vas a conseguir' })).toBeInTheDocument();
    expect(within(box).getByText('OBJETIVO')).toBeInTheDocument();
    const prompt = screen.getByText('Lleva v a la meta');
    expect(box.compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // contract: la conclusión se guarda para el cierre de la pregunta (la enseña el ejecutor)
    expect(screen.queryByText('CONCLUSION')).not.toBeInTheDocument();
  });

  // contract: las preguntas sin purpose (proyectos pendientes, bancos de examen) se ven como antes
  it('sin purpose, no hay bloque', () => {
    setup(manipular());
    expect(screen.queryByRole('region', { name: 'El sentido del ejercicio' })).toBeNull();
  });
});

describe('locked', () => {
  // contract: tarea 10, tabla: cualquiera con locked -> entradas desactivadas
  it('numero: campo y botón desactivados', () => {
    setup(numero(), true);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(submitButton()).toBeDisabled();
  });

  // contract: review-10 m12 — tarea 10, tabla: cualquiera con locked -> entradas desactivadas
  it('vector: todos los campos desactivados', () => {
    setup(vector(), true);
    for (const box of screen.getAllByRole('textbox')) expect(box).toBeDisabled();
  });

  // contract: review-10 m12 — tarea 10, tabla: cualquiera con locked -> entradas desactivadas
  it('opcion: opciones y botón desactivados', () => {
    setup(opcion(), true);
    for (const r of screen.getAllByRole('radio')) expect(r).toBeDisabled();
    expect(submitButton()).toBeDisabled();
  });

  // contract: review-10 m12 — tarea 10, tabla: cualquiera con locked -> entradas desactivadas
  it('revision: veredicto desactivado', () => {
    setup(revision(), true);
    for (const r of screen.getAllByRole('radio')) expect(r).toBeDisabled();
    expect(submitButton()).toBeDisabled();
  });

  // contract: review-10 m12 — tarea 10, tabla: cualquiera con locked -> entradas desactivadas
  it('manipular: sin asas y sin botones', () => {
    setup(manipular(), true);
    expect(screen.queryByRole('button', { name: /Asa/ })).toBeNull();
    expect(submitButton()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Recolocar' })).toBeDisabled();
  });

  // contract: tarea 10, reglas: con locked las entradas conservan lo último que puso el jugador
  it('numero: conserva el texto al bloquearse', async () => {
    const onSubmit = vi.fn();
    const q = numero();
    const { rerender } = render(<QuestionView question={q} locked={false} onSubmit={onSubmit} />);
    await userEvent.setup().type(screen.getByRole('textbox'), '4,2');
    rerender(<QuestionView question={q} locked onSubmit={onSubmit} />);
    expect(screen.getByRole('textbox')).toHaveValue('4,2');
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  // contract: tarea 10, reglas: con locked conserva la opción elegida
  it('opcion: conserva la opción elegida al bloquearse', async () => {
    const onSubmit = vi.fn();
    const q = opcion();
    const { rerender } = render(<QuestionView question={q} locked={false} onSubmit={onSubmit} />);
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Tres' }));
    rerender(<QuestionView question={q} locked onSubmit={onSubmit} />);
    expect(screen.getByRole('radio', { name: 'Tres' })).toBeChecked();
  });

  // contract: tarea 10, reglas: con locked conserva las posiciones colocadas por el jugador
  it('manipular: conserva las posiciones al bloquearse', async () => {
    const onSubmit = vi.fn();
    const q = manipular();
    const { rerender } = render(<QuestionView question={q} locked={false} onSubmit={onSubmit} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowRight}');
    rerender(<QuestionView question={q} locked onSubmit={onSubmit} />);
    expect(
      within(screen.getByRole('group', { name: 'Lecturas' })).getByText('(2, 1)'),
    ).toBeInTheDocument();
  });

  // contract: tarea 10, QuestionView: otra pregunta (otro id) empieza de cero
  it('una pregunta distinta no hereda el texto de la anterior', async () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <QuestionView question={numero()} locked={false} onSubmit={onSubmit} />,
    );
    await userEvent.setup().type(screen.getByRole('textbox'), '4');
    rerender(<QuestionView question={numero({ id: 'n2' })} locked={false} onSubmit={onSubmit} />);
    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});

describe('doble pulsación', () => {
  // contract: tarea 10, tabla: doble pulsación rápida en «Entregar» -> onSubmit llamado una vez
  it('dos clics seguidos entregan una vez', async () => {
    const { onSubmit, user } = setup(opcion());
    await user.click(screen.getByRole('radio', { name: 'Dos' }));
    fireEvent.click(submitButton());
    fireEvent.click(submitButton());
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  // contract: tarea 10, reglas: tras una entrega el botón queda desactivado 450 ms
  it('el botón se desactiva 450 ms tras entregar', async () => {
    vi.useFakeTimers();
    const onSubmit = vi.fn();
    render(<QuestionView question={opcion()} locked={false} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Dos' }));
    fireEvent.click(submitButton());
    expect(submitButton()).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(449);
    });
    expect(submitButton()).toBeDisabled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(submitButton()).toBeEnabled();
  });

  // contract: tarea 10, tabla: doble pulsación rápida -> una vez, aunque el evento llegue con el botón ya desactivado (Intro)
  it('dos envíos del formulario seguidos entregan una vez', async () => {
    const { onSubmit, user } = setup(numero());
    const box = screen.getByRole('textbox', { name: 'Tu respuesta' });
    await user.type(box, '5');
    const form = box.closest('form');
    if (!form) throw new Error('sin formulario');
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  // contract: tarea 10, tabla: Intro dos veces seguidas en un campo -> una sola entrega
  it('Intro repetido en numero entrega una vez', async () => {
    const { onSubmit, user } = setup(numero());
    await user.type(screen.getByRole('textbox', { name: 'Tu respuesta' }), '5{Enter}{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('ronda de arreglo 1 (revisión de la tarea 10)', () => {
  const themeCss = readFileSync(path.join(process.cwd(), 'src/ui/theme.css'), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );
  const ruleFor = (selector: string): string => {
    const found = [...themeCss.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) =>
      (m[1] ?? '')
        .split(',')
        .map((x) => x.trim())
        .includes(selector),
    );
    return found?.[2] ?? '';
  };

  // contract: review-10 I2 — el teclado decimal de iOS no trae el signo menos
  it('los campos de numero y de vector no fuerzan el teclado decimal', () => {
    const { unmount } = setup(numero());
    expect(screen.getByRole('textbox', { name: 'Tu respuesta' })).not.toHaveAttribute('inputmode');
    unmount();
    setup(vector());
    for (const box of screen.getAllByRole('textbox')) expect(box).not.toHaveAttribute('inputmode');
  });

  // contract: review-10 I2 — respuesta -3, escrita con guion «-» y con signo menos «−» (U+2212), entrega true
  it.each([
    ['guion', '-3'],
    ['signo menos U+2212', '−3'],
  ])('numero acepta un negativo escrito con %s', async (_name, text) => {
    const { onSubmit, user } = setup(numero({ answer: -3 }));
    await user.type(screen.getByRole('textbox', { name: 'Tu respuesta' }), `${text}{Enter}`);
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(true);
  });

  // contract: review-10 I2 — respuesta [4, -1], el segundo componente es negativo, entrega true
  it('vector acepta un componente negativo', async () => {
    const { onSubmit, user } = setup(vector({ answer: [4, -1] }));
    await user.type(screen.getByRole('textbox', { name: 'Componente 1 de 2' }), '4');
    await user.type(screen.getByRole('textbox', { name: 'Componente 2 de 2' }), '−1');
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(true);
  });

  // contract: review-10 I3 — formato texto lleva la clase modificadora (se parte en líneas); codigo no
  it('la lista de revision lleva la clase de texto solo con format texto', () => {
    const { unmount } = setup(revision({ format: 'texto' }));
    expect(screen.getByRole('list', { name: 'Líneas' })).toHaveClass('question__lines--text');
    unmount();
    setup(revision());
    expect(screen.getByRole('list', { name: 'Líneas' })).not.toHaveClass('question__lines--text');
  });

  // contract: review-10 I3 — texto: pre-wrap con overflow-wrap anywhere (a 360 px no se corta sin barra)
  it('theme.css parte las líneas de texto con pre-wrap y overflow-wrap anywhere', () => {
    const rule = ruleFor('.question__lines--text .question__line-text');
    expect(rule).toMatch(/white-space:\s*pre-wrap/);
    expect(rule).toMatch(/overflow-wrap:\s*anywhere/);
  });

  // contract: review-10 I3 — código: pre y la fila ocupa su contenido (min-width: max-content) para que el resalte acompañe al desplazamiento
  it('theme.css mantiene pre en código y da a la fila min-width: max-content', () => {
    expect(ruleFor('.question__line-text')).toMatch(/white-space:\s*pre\s*;/);
    expect(ruleFor('.question__lines--code .question__line')).toMatch(/min-width:\s*max-content/);
  });

  // contract: review-10 m6 — el contorno de foco de las líneas no se recorta por el overflow del contenedor
  it('theme.css mete el contorno de foco de las líneas hacia dentro', () => {
    expect(ruleFor('.question__line-button:focus-visible')).toMatch(/outline-offset:\s*-/);
  });

  // contract: re-revisión de la 10, N1 — un botón desactivado no cambia de fondo al pasar el ratón
  it('theme.css aplica el hover de las líneas solo a los botones activos', () => {
    expect(ruleFor('.question__line-button:hover:not(:disabled)')).toMatch(/background:/);
    expect(ruleFor('.question__line-button:hover')).toBe('');
  });

  // contract: re-revisión de la 10, N2 — las bandas del código miden lo mismo: una columna tan ancha como la línea más larga
  it('theme.css da al conjunto de líneas de código una columna del ancho de la más larga', () => {
    const rule = ruleFor('.question__lines--code');
    expect(rule).toMatch(/display:\s*grid/);
    expect(rule).toMatch(/grid-template-columns:\s*minmax\(max-content,\s*1fr\)/);
  });

  // contract: review-10 m11 — los radios usan el acento del tema para distinguir marcado y sin marcar
  it('theme.css da accent-color a los radios', () => {
    expect(ruleFor('.question__option input')).toMatch(/accent-color:\s*var\(--color-accent\)/);
  });

  // contract: review-10 m8 — la línea elegida expone aria-pressed también con locked
  it('revision: la línea elegida sigue marcada con aria-pressed al bloquearse', async () => {
    const onSubmit = vi.fn();
    const q = revision();
    const { rerender } = render(<QuestionView question={q} locked={false} onSubmit={onSubmit} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: 'Tiene un error' }));
    await user.click(screen.getByRole('button', { name: /^Línea 2:/ }));
    expect(screen.getByRole('button', { name: /^Línea 2:/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    rerender(<QuestionView question={q} locked onSubmit={onSubmit} />);
    expect(screen.getByRole('button', { name: /^Línea 2:/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /^Línea 1:/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: /^Línea 2:/ })).toBeDisabled();
  });

  // contract: review-10 m10 — aria-invalid solo en los campos que parseNumber rechaza
  it('vector: aria-invalid solo marca el campo inválido', async () => {
    const { user } = setup(vector());
    await user.type(screen.getByRole('textbox', { name: 'Componente 1 de 2' }), '0,6');
    await user.type(screen.getByRole('textbox', { name: 'Componente 2 de 2' }), 'abc');
    await user.click(submitButton());
    expect(screen.getByText(INVALID)).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Componente 1 de 2' })).toHaveAttribute(
      'aria-invalid',
      'false',
    );
    expect(screen.getByRole('textbox', { name: 'Componente 2 de 2' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  // contract: review-10 m12(a) — vector conserva el texto de cada campo al bloquearse
  it('vector: conserva el texto al bloquearse', async () => {
    const onSubmit = vi.fn();
    const q = vector();
    const { rerender } = render(<QuestionView question={q} locked={false} onSubmit={onSubmit} />);
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: 'Componente 1 de 2' }), '0,6');
    await user.type(screen.getByRole('textbox', { name: 'Componente 2 de 2' }), '0,8');
    rerender(<QuestionView question={q} locked onSubmit={onSubmit} />);
    expect(screen.getByRole('textbox', { name: 'Componente 1 de 2' })).toHaveValue('0,6');
    expect(screen.getByRole('textbox', { name: 'Componente 2 de 2' })).toHaveValue('0,8');
  });

  // contract: review-10 m12(a) — revision conserva veredicto y línea elegida al bloquearse
  it('revision: conserva veredicto y línea al bloquearse', async () => {
    const onSubmit = vi.fn();
    const q = revision();
    const { rerender } = render(<QuestionView question={q} locked={false} onSubmit={onSubmit} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: 'Tiene un error' }));
    await user.click(screen.getByRole('button', { name: /^Línea 3:/ }));
    rerender(<QuestionView question={q} locked onSubmit={onSubmit} />);
    expect(screen.getByRole('radio', { name: 'Tiene un error' })).toBeChecked();
    expect(screen.getByRole('button', { name: /^Línea 3:/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  // contract: review-10 m12(c) — elegir «Está bien» borra la línea elegida (muere si se revierte setLine(null))
  it('revision: «Está bien» borra la línea elegida', async () => {
    const { onSubmit, user } = setup(revision());
    await user.click(screen.getByRole('radio', { name: 'Tiene un error' }));
    await user.click(screen.getByRole('button', { name: /^Línea 2:/ }));
    await user.click(screen.getByRole('radio', { name: 'Está bien' }));
    await user.click(screen.getByRole('radio', { name: 'Tiene un error' }));
    expect(screen.getByRole('button', { name: /^Línea 2:/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(submitButton()).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
