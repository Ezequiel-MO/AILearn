import { expect, test as base, type Locator, type Page } from '@playwright/test';
import { componentes } from '../../src/games/vectores/componentes';

// Prueba de humo en Chrome sobre la compilación (`npm run preview`). No se usa `?abierto`:
// el progreso se siembra en `localStorage` con la clave real y un documento válido para el
// esquema de `src/storage`. Cada prueba parte de un contexto nuevo (almacenamiento y caché vacíos).

const PROGRESS_KEY = 'ailearn:v1:local:vectores';
const DRAFTS_KEY = `${PROGRESS_KEY}:borradores`;
const PROJECTS = ['componentes', 'suma-escala', 'norma-distancia'] as const;

// Contrato de la 19a: la semilla 5021 del examen de la órbita 0 trae la pregunta de código `examen-0.bici-y`
// la primera y `examen-0.centroide-animales` la segunda. `ExamScreen` toma `Date.now()` como semilla.
const EXAM_SEED = 5021;

// Las cargas de Pyodide tardan de 7 a 14 s en frío; una carga tras un plazo agotado, otro tanto.
const PYTHON_LOAD_MS = 90_000;

interface Doc {
  schema: 1;
  summary: {
    launch: boolean;
    firsts: Record<string, number>;
    examsPassed: number[];
    sheets: string[];
  };
  attempts: {
    q: string;
    at: string;
    correct: boolean;
    submissions: number;
    hinted: boolean;
    context: 'despegue' | 'proyecto' | 'hoja' | 'examen';
  }[];
}

const doc = (summary: Partial<Doc['summary']> = {}): Doc => ({
  schema: 1,
  summary: { launch: true, firsts: {}, examsPassed: [], sheets: [], ...summary },
  attempts: [],
});

/** Despegue superado: la Órbita 0 está abierta y ningún proyecto validado. */
const OPEN = doc();

/** Despegue superado y los tres proyectos de la Órbita 0 validados (todas las marcas a 5 de 5). */
const VALIDATED = doc({
  firsts: Object.fromEntries(
    PROJECTS.flatMap((p) => [0, 1, 2].map((ex) => [`${p}/${ex}`, 5] as const)),
  ),
});

// La consola tiene que quedar limpia: el 404 de `favicon.ico` ya no existe (hay un icono propio).
// Las pruebas que bloquean la red a propósito la desactivan.
const test = base.extend<{ cleanConsole: boolean; consoleErrors: string[] }>({
  cleanConsole: [true, { option: true }],
  consoleErrors: [
    async ({ page, cleanConsole }, use) => {
      const errors: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      page.on('pageerror', (e) => errors.push(e.message));
      await use(errors);
      if (cleanConsole) expect(errors, 'errores de consola').toEqual([]);
    },
    { auto: true },
  ],
});

/** Abre una ruta con el progreso sembrado. La semilla se escribe y se recarga: el almacén lee al arrancar. */
async function openWith(page: Page, hash: string, seeded?: Doc): Promise<void> {
  await page.goto('/');
  if (seeded) {
    await page.evaluate(
      ([key, value]) => localStorage.setItem(key as string, value as string),
      [PROGRESS_KEY, JSON.stringify(seeded)],
    );
  }
  await page.goto(`/#${hash}`);
  await page.reload();
}

const storedDoc = (page: Page): Promise<Doc> =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null') as Doc, PROGRESS_KEY);

const storedDrafts = (page: Page): Promise<Record<string, string>> =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, string>,
    DRAFTS_KEY,
  );

const editorOf = (page: Page): Locator =>
  page.getByRole('textbox', { name: 'Editor de código Python' });

/** Sustituye el código del editor de una vez (teclear carácter a carácter lo altera el sangrado automático). */
async function setCode(page: Page, code: string): Promise<void> {
  const editor = editorOf(page);
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(code);
}

const results = (page: Page): Locator => page.getByRole('status', { name: 'Resultado' });
const runButton = (page: Page): Locator => page.getByRole('button', { name: 'Ejecutar' });
const submitButton = (page: Page): Locator => page.getByRole('button', { name: 'Entregar' });
const nextButton = (page: Page): Locator => page.getByRole('button', { name: 'Siguiente' });
const progress = (page: Page): Locator => page.locator('.runner__progress');

/** Responde cualquier pregunta que no sea de código (mala o buena, da igual) y la cierra. */
async function skipNonCode(page: Page): Promise<void> {
  if (await page.getByRole('group', { name: 'Tu respuesta, componente a componente' }).count()) {
    await page.getByRole('textbox', { name: /^Componente 1 de/ }).fill('0');
    await page.getByRole('textbox', { name: /^Componente 2 de/ }).fill('0');
  } else if (await page.getByRole('radio').count()) {
    await page.getByRole('radio').first().check();
  } else if (await page.getByRole('textbox', { name: 'Tu respuesta' }).count()) {
    await page.getByRole('textbox', { name: 'Tu respuesta' }).fill('0');
  }
  await submitButton(page).click();
  await nextButton(page).click();
}

// ---------------------------------------------------------------------------------------------------

test('1. del inicio al mapa: Despegue abierto y Órbita 0 cerrada', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'AIlearn' })).toBeVisible();
  await page.getByRole('link', { name: 'Vectores y embeddings' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Vectores y embeddings' }),
  ).toBeVisible();

  const launch = page.getByRole('region', { name: 'Despegue' });
  await expect(launch).toContainText('Abierto');
  await expect(launch.getByRole('link', { name: 'Jugar el despegue' })).toBeVisible();

  const orbit = page.getByRole('region', { name: 'La flecha' });
  await expect(orbit).toContainText('Órbita cerrada');
  // R47: la órbita y su examen dicen lo mismo mientras la órbita está cerrada.
  await expect(orbit.getByText('Completa el despegue')).toHaveCount(2);
  await expect(orbit.getByRole('link', { name: 'Hacer el examen' })).toHaveCount(0);
});

test('2. Despegue, pregunta 1: se mueve el vector con el teclado y se entrega', async ({
  page,
}) => {
  await page.goto('/#/j/vectores');
  await page.getByRole('link', { name: 'Jugar el despegue' }).click();
  await expect(progress(page)).toHaveText('1 de 10');

  const handle = page.getByRole('button', { name: /^Asa del vector v/ });
  await handle.focus();
  // De (1, 1) a (3, 2) con la rejilla de 1 en 1.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowUp');
  await expect(handle).toHaveAccessibleName(/\(3; 2\)|\(3, 2\)/);

  await submitButton(page).click();
  await expect(page.locator('.runner__feedback')).toContainText('¡Correcto!');
  await expect(nextButton(page)).toBeFocused();
});

test('3 y 4. código del ejercicio 3: bucle infinito, print y entrega', async ({ page }) => {
  await openWith(page, '/j/vectores/p/componentes/ex/2', OPEN);
  await expect(editorOf(page)).toBeVisible();
  await expect(progress(page)).toHaveText('1 de 5');
  // Python no se descarga hasta la primera ejecución (idle): ahora no hay aviso de carga.
  await expect(page.getByText('Cargando Python…')).toHaveCount(0);

  await test.step('el código de partida falla y solo enseña los mensajes de lo que falla (R44)', async () => {
    await submitButton(page).click();
    await expect(page.getByRole('status').filter({ hasText: 'Cargando Python…' })).toBeVisible();
    await expect(results(page)).toContainText('1 de 4 comprobaciones superadas', {
      timeout: PYTHON_LOAD_MS,
    });
    await expect(results(page).locator('.code__check')).toHaveCount(3);
    // La tercera comprobación pasa con `v = None`: su mensaje no se enseña.
    await expect(results(page)).not.toContainText('Las componentes tienen que ser números');
  });

  await test.step('4. `while True: pass` agota el plazo y la página sigue respondiendo', async () => {
    await setCode(page, 'while True: pass');
    await page.evaluate(() => {
      const w = window as unknown as { __ticks: number };
      w.__ticks = 0;
      setInterval(() => (w.__ticks += 1), 100);
    });
    await runButton(page).click();
    await expect(page.getByRole('status').filter({ hasText: 'Ejecutando…' })).toBeVisible();
    // Durante el bucle (plazo de 10 s) el hilo principal sigue vivo: el reloj de 100 ms avanza.
    await page.waitForTimeout(3_000);
    const ticks = await page.evaluate(() => (window as unknown as { __ticks: number }).__ticks);
    expect(ticks).toBeGreaterThan(20);
    await expect(
      page.getByRole('alert').filter({ hasText: 'Tu código tardó demasiado' }),
    ).toBeVisible({
      timeout: 30_000,
    });
    // Sigue respondiendo después: el editor acepta código nuevo y la salida llega tras la recarga.
    await setCode(page, 'print(1)');
    await runButton(page).click();
    await expect(page.locator('.code__output').first()).toHaveText(/^1\s*$/, {
      timeout: PYTHON_LOAD_MS,
    });
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  await test.step('3. la solución correcta pasa todas las comprobaciones', async () => {
    await setCode(page, 'import numpy as np\n\nv = np.array([4, 3])\n');
    await submitButton(page).click();
    await expect(results(page)).toContainText('4 de 4 comprobaciones superadas', {
      timeout: PYTHON_LOAD_MS,
    });
    // R44: ninguna comprobación superada enseña su mensaje; si todas pasan, no hay lista.
    await expect(results(page).locator('.code__check')).toHaveCount(0);
    await expect(page.locator('.runner__feedback')).toContainText('¡Correcto!');
  });
});

test('5. el borrador de código sigue tras recargar', async ({ page }) => {
  await openWith(page, '/j/vectores/p/componentes/ex/2', OPEN);
  await expect(editorOf(page)).toBeVisible();
  await setCode(page, 'v = np.array([9, 9])');
  // El borrador se guarda cada 500 ms mientras se escribe.
  await expect
    .poll(async () => (await storedDrafts(page))['componentes.ex02.1'])
    .toBe('v = np.array([9, 9])');
  await page.reload();
  await expect(editorOf(page)).toContainText('v = np.array([9, 9])');
});

/** Mide el panel de resultado de la pregunta cerrada: relleno izquierdo > 0 y caja dentro de `.runner`. */
async function expectPanelInsideRunner(page: Page): Promise<void> {
  const panel = page.locator('.runner__feedback');
  const paddingLeft = await panel.evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
  expect(paddingLeft).toBeGreaterThan(0);
  const box = await panel.boundingBox();
  const runner = await page.locator('.runner').boundingBox();
  if (!box || !runner) throw new Error('Sin caja');
  expect(box.x).toBeGreaterThanOrEqual(runner.x - 0.5);
  expect(box.x + box.width).toBeLessThanOrEqual(runner.x + runner.width + 0.5);
}

test('6. el ejercicio 2 de componentes entero: la marca sigue en el panel tras recargar', async ({
  page,
}) => {
  await openWith(page, '/j/vectores/p/componentes/ex/1', OPEN);
  await expect(progress(page)).toHaveText('1 de 5');

  // Pregunta 1 (vector): se entrega con Intro y se mide el panel de resultado.
  await page.getByRole('textbox', { name: 'Componente 1 de 2' }).fill('-3');
  await page.getByRole('textbox', { name: 'Componente 2 de 2' }).fill('2');
  await page.getByRole('textbox', { name: 'Componente 2 de 2' }).press('Enter');
  await expect(page.locator('.runner__feedback')).toContainText('¡Correcto!');
  await expect(nextButton(page)).toBeFocused();
  await expectPanelInsideRunner(page);

  // Intro mantenido tras entregar no salta de pregunta (la guarda de «Siguiente» tarda 450 ms sin teclas).
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.down('Enter');
    await page.waitForTimeout(60);
  }
  await page.keyboard.up('Enter');
  await expect(progress(page)).toHaveText('1 de 5');
  // Pasada la espera, un Intro deliberado sí avanza.
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter');
  await expect(progress(page)).toHaveText('2 de 5');

  // Pregunta 2 (numero).
  await page.getByRole('textbox', { name: 'Tu respuesta' }).fill('-2');
  await submitButton(page).click();
  await nextButton(page).click();
  // Pregunta 3 (opcion).
  await page.getByRole('radio', { name: '4', exact: true }).check();
  await submitButton(page).click();
  await nextButton(page).click();
  // Pregunta 4 (vector).
  await page.getByRole('textbox', { name: 'Componente 1 de 2' }).fill('3');
  await page.getByRole('textbox', { name: 'Componente 2 de 2' }).fill('4');
  await submitButton(page).click();
  await nextButton(page).click();
  // Pregunta 5 (opcion).
  await page.getByRole('radio', { name: 'Una lista de 768 números' }).check();
  await submitButton(page).click();
  await nextButton(page).click();

  await expect(page.getByText('Tanda terminada')).toBeVisible();
  await expect(page.getByText('Este intento: 5 de 5 a la primera.')).toBeVisible();

  // El panel del proyecto: la marca del ejercicio 2 («N de 5»), también tras recargar.
  await page.getByRole('link', { name: 'Volver al proyecto' }).click();
  const row = page.getByRole('listitem').filter({ hasText: 'Ejercicio 2 · Calcular' });
  await expect(row).toContainText('5 de 5');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Componentes' })).toBeVisible();
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Ejercicio 2 · Calcular' }),
  ).toContainText('5 de 5');
  // Un ejercicio sin jugar sigue diciendo «sin hacer».
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Ejercicio 1 · Manipular' }),
  ).toContainText('sin hacer');
});

test('6b. a 360 px el panel de resultado no sale de la tanda', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openWith(page, '/j/vectores/p/componentes/ex/1', OPEN);
  await page.getByRole('textbox', { name: 'Componente 1 de 2' }).fill('-3');
  await page.getByRole('textbox', { name: 'Componente 2 de 2' }).fill('2');
  await submitButton(page).click();
  await expect(page.locator('.runner__feedback')).toContainText('¡Correcto!');
  await expectPanelInsideRunner(page);
});

// Estas pruebas bloquean la red a propósito: los errores de carga salen en la consola y no se vigilan.
test.describe('sin red para Pyodide', () => {
  test.use({ cleanConsole: false });

  test('7. sin red para Pyodide: mensaje de carga fallida y reintento; una pregunta numero sigue', async ({
    page,
  }) => {
    await page.context().route(/jsdelivr/, (route) => route.abort());
    await openWith(page, '/j/vectores/p/componentes/ex/2', OPEN);
    await expect(editorOf(page)).toBeVisible();
    // Python se pide al ejecutar por primera vez.
    await runButton(page).click();
    const alert = page.getByRole('alert');
    await expect(alert).toContainText('No se ha podido cargar Python. Comprueba la conexión.', {
      timeout: 60_000,
    });
    await expect(alert.getByRole('button', { name: 'Reintentar' })).toBeVisible();

    // Una pregunta numero sigue funcionando en la misma sesión (ejercicio 2, pregunta 2, tras la 1).
    await page.evaluate(() => {
      window.location.hash = '#/j/vectores/p/componentes/ex/1';
    });
    await page.getByRole('textbox', { name: 'Componente 1 de 2' }).fill('-3');
    await page.getByRole('textbox', { name: 'Componente 2 de 2' }).fill('2');
    await submitButton(page).click();
    await nextButton(page).click();
    await page.getByRole('textbox', { name: 'Tu respuesta' }).fill('-2');
    await submitButton(page).click();
    await expect(page.locator('.runner__feedback')).toContainText('¡Correcto!');
  });

  test('7b. con la red de vuelta, «Reintentar» carga Python', async ({ page }) => {
    const blocked = (url: URL) => /jsdelivr/.test(url.href);
    await page.context().route(blocked, (route) => route.abort());
    await openWith(page, '/j/vectores/p/componentes/ex/2', OPEN);
    await expect(editorOf(page)).toBeVisible();
    // Python se pide al ejecutar por primera vez.
    await runButton(page).click();
    const alert = page.getByRole('alert');
    await expect(alert).toContainText('No se ha podido cargar Python', { timeout: 60_000 });
    await page.context().unroute(blocked);
    await alert.getByRole('button', { name: 'Reintentar' }).click();
    await setCode(page, 'print(7)');
    await runButton(page).click();
    await expect(page.locator('.code__output').first()).toHaveText(/^7\s*$/, {
      timeout: PYTHON_LOAD_MS,
    });
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('7c. con los paquetes de Python bloqueados la carga también falla con aviso', async ({
    page,
  }) => {
    await page.context().route(/\.whl($|\?)/, (route) => route.abort());
    await openWith(page, '/j/vectores/p/componentes/ex/2', OPEN);
    await expect(editorOf(page)).toBeVisible();
    // Python se pide al ejecutar por primera vez.
    await runButton(page).click();
    await expect(page.getByRole('alert')).toContainText('No se ha podido cargar Python', {
      timeout: 60_000,
    });
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
  });
});

test('8. examen con código: no se ven comprobaciones, pistas ni solución; el intento se graba al pulsar «Siguiente»', async ({
  page,
}) => {
  await page.addInitScript((seed) => {
    Date.now = () => seed;
  }, EXAM_SEED);
  await openWith(page, '/j/vectores/examen/0', VALIDATED);
  await expect(page.getByRole('heading', { level: 1, name: 'Examen · La flecha' })).toBeVisible();

  // La semilla 5021 pone una pregunta de código en primer lugar.
  await expect(editorOf(page)).toBeVisible();
  await expect(progress(page)).toHaveText('1 de 6');
  await expect(page.getByRole('button', { name: 'Dame una pista' })).toHaveCount(0);

  await submitButton(page).click();
  await expect(nextButton(page)).toBeVisible({ timeout: PYTHON_LOAD_MS });
  await expect(page.locator('.runner__feedback')).toContainText('Respuesta registrada');
  for (const hidden of ['Comprobaciones', 'Fallida', 'Solución', 'Explicación', '¡Correcto!']) {
    await expect(page.getByText(hidden)).toHaveCount(0);
  }
  await expect(page.getByRole('button', { name: 'Dame una pista' })).toHaveCount(0);
  await expect(page.locator('.runner__hints')).toHaveCount(0);

  // El intento se graba al pulsar «Siguiente», no al entregar.
  expect((await storedDoc(page)).attempts).toHaveLength(0);
  await nextButton(page).click();
  await expect(progress(page)).toHaveText('2 de 6');
  const after = await storedDoc(page);
  expect(after.attempts).toHaveLength(1);
  expect(after.attempts[0]).toMatchObject({ q: 'examen-0.bici-y', context: 'examen' });

  // La segunda es de código también: se recorre sin comprobaciones a la vista.
  await expect(editorOf(page)).toBeVisible();
  await submitButton(page).click();
  await expect(nextButton(page)).toBeVisible({ timeout: PYTHON_LOAD_MS });
  await expect(page.getByText('Comprobaciones')).toHaveCount(0);
  await nextButton(page).click();
  // El resto (vector, opcion, vector, numero) se contesta y se cierra.
  for (let n = 3; n <= 6; n += 1) {
    await expect(progress(page)).toHaveText(`${n} de 6`);
    await skipNonCode(page);
  }
  await expect(page.getByText('Tanda terminada')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Resultado del examen' })).toBeVisible();
  expect((await storedDoc(page)).attempts).toHaveLength(6);
});

test('9. la solución de referencia de componentes.ex02.5 (con figura) pasa todas las comprobaciones', async ({
  page,
}) => {
  const question = componentes.exercises[2]!.questions[4]!;
  if (question.type !== 'codigo') throw new Error('componentes.ex02.5 deja de ser de código');
  expect(question.id).toBe('componentes.ex02.5');
  await openWith(page, '/j/vectores/p/componentes/ex/2', OPEN);
  // Se pasa a la pregunta 5 contestando mal las cuatro primeras (cada una se revela con dos entregas).
  for (let n = 1; n <= 4; n += 1) {
    await expect(progress(page)).toHaveText(`${n} de 5`);
    await expect(editorOf(page)).toBeVisible();
    await submitButton(page).click();
    await expect(page.locator('.runner__feedback')).toContainText('Todavía no', {
      timeout: PYTHON_LOAD_MS,
    });
    await submitButton(page).click();
    await expect(nextButton(page)).toBeVisible();
    await nextButton(page).click();
  }
  await expect(progress(page)).toHaveText('5 de 5');
  await setCode(page, question.reference);
  await expect
    .poll(async () => (await storedDrafts(page))['componentes.ex02.5'])
    .toBe(question.reference);
  await submitButton(page).click();
  await expect(results(page)).toContainText('4 de 4 comprobaciones superadas', {
    timeout: PYTHON_LOAD_MS,
  });
  await expect(results(page).locator('.code__check')).toHaveCount(0);
  await expect(page.getByRole('img', { name: 'Figura 1' })).toBeVisible();
});

test('10. hoja «Caza el error»: las líneas desactivadas no cambian con el cursor y las bandas miden lo mismo', async ({
  page,
}) => {
  await openWith(page, '/j/vectores/p/componentes/hoja/0', VALIDATED);
  await expect(page.getByRole('heading', { level: 1, name: /Caza el error 1/ })).toBeVisible();
  await page.getByRole('radio', { name: 'Tiene un error' }).check();

  const lines = page.locator('.question__line-button');
  await expect(lines).toHaveCount(2);
  const widths = async () =>
    Promise.all(
      (await lines.all()).map(async (l) => Math.round(((await l.boundingBox())?.width ?? 0) * 10)),
    );
  const before = await widths();
  expect(before[0]).toBeGreaterThan(0);
  expect(new Set(before).size, 'bandas de la misma anchura').toBe(1);

  await lines.nth(1).click();
  await submitButton(page).click();
  await expect(page.locator('.runner__feedback')).toContainText('¡Correcto!');
  await expect(lines.nth(0)).toBeDisabled();
  const background = () => lines.nth(0).evaluate((el) => getComputedStyle(el).backgroundColor);
  const idle = await background();
  await lines.nth(0).hover({ force: true });
  expect(await background()).toBe(idle);
  expect(await widths()).toEqual(before);

  await nextButton(page).click();
  await expect(page.getByText('Hoja resuelta.')).toBeVisible();
});

test('11. con los tres proyectos validados el mapa ofrece el examen de la Órbita 0', async ({
  page,
}) => {
  // Todo validado y el despegue superado: la órbita está abierta y su examen se puede sentar (R47).
  await openWith(page, '/j/vectores', VALIDATED);
  const orbit = page.getByRole('region', { name: 'La flecha' });
  await expect(orbit).toContainText('Órbita abierta');
  await expect(orbit.getByRole('link', { name: 'Hacer el examen' })).toBeVisible();
  await expect(orbit.getByText('Completa el despegue')).toHaveCount(0);
});

test('12. calentamiento de Columnas: el ejemplo se ejecuta y el reto se comprueba sin puntuar', async ({
  page,
}) => {
  await openWith(page, '/j/matrices/p/columnas/calentamiento?abierto');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Columnas · Calentamiento de Python',
  );
  const card = page.getByRole('region', { name: /^Filas y columnas de una matriz/ });

  await test.step('el ejemplo se ejecuta tal cual y enseña su salida', async () => {
    await card.getByRole('button', { name: 'Ejecutar' }).first().click();
    await expect(card.locator('.code__output').first()).toContainText('forma: (2, 3)', {
      timeout: PYTHON_LOAD_MS,
    });
  });

  await test.step('el código de partida del reto no pasa y dice por qué', async () => {
    await card.getByRole('button', { name: 'Comprobar' }).click();
    await expect(card).toContainText('tiene que ser un array de NumPy con 3 números', {
      timeout: PYTHON_LOAD_MS,
    });
    await expect(card.getByText(/¡Conseguido!/)).toHaveCount(0);
  });

  await test.step('con una solución correcta, «¡Conseguido!»', async () => {
    const editor = card.getByRole('textbox', { name: 'Editor de código Python' }).nth(1);
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText(
      'import numpy as np\nT = np.array([[2, 7, 1], [8, 3, 9], [4, 6, 5]])\nfila = T[2]\ncolumna = T[:, 0]\nesquina = T[2, 2]\n',
    );
    await card.getByRole('button', { name: 'Comprobar' }).click();
    await expect(card.getByText(/¡Conseguido!/)).toBeVisible({ timeout: PYTHON_LOAD_MS });
  });
});
