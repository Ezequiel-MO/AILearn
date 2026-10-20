import katex from 'katex';
import { describe, expect, it } from 'vitest';
import {
  GLOSSARY,
  GUIDE_CARDS,
  pythonGuide,
  withoutComments,
} from '../../src/content/python-guide';
import { codeQuestions } from '../../src/content/validate';
import { games } from '../../src/games';

const ids = (code: string) => pythonGuide(code).cards.map((c) => c.id);
const names = (code: string) => pythonGuide(code).glossary.map((g) => g.name);

/** El texto sin bloques de código cercados ni código en línea. */
const prose = (md: string) => md.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');

const allCode = games.flatMap(codeQuestions).map((q) => `${q.starter}\n${q.reference}`);

describe('guía de Python: qué fichas salen para un código', () => {
  it('una función propia trae «funciones» y «bloques»', () => {
    // contract: petición de Oliver 2026-10-20 (contexto de Python para quien no programa)
    expect(ids('def f(x):\n    return 2 * x\n')).toEqual(
      expect.arrayContaining(['funciones', 'bloques']),
    );
  });

  it('el producto con @ trae «producto»; sin @ no sale', () => {
    // contract: el juego de matrices usa @ en 52 referencias (encuesta del 2026-10-20)
    expect(ids('import numpy as np\nr = A @ v\n')).toContain('producto');
    expect(ids('import numpy as np\nr = A * v\n')).not.toContain('producto');
  });

  it('los índices y los cortes traen «indices»; una lista literal no', () => {
    // contract: `np.array([2, 1])` no elige elementos; `M[:, 0]` sí
    expect(ids('c = M[:, 0]\n')).toContain('indices');
    expect(ids('import numpy as np\nv = np.array([2, 1])\n')).not.toContain('indices');
  });

  it('`axis=` trae «ejes» y la entrada de np.mean del glosario', () => {
    // contract: la ficha de ejes acompaña a toda función con axis
    expect(ids('m = np.mean(E, axis=0)\n')).toContain('ejes');
    expect(names('m = np.mean(E, axis=0)\n')).toContain('np.mean(x)');
  });

  it('las palabras de los comentarios no cuentan como Python', () => {
    // contract: el código inicial explica en comentarios («# for each…», «# usa @»)
    expect(ids('# for x in v: usa @ y def\nx = None\n')).toEqual([]);
    expect(withoutComments('s = "a # b"  # nota')).toBe('s = "a # b"  ');
  });

  it('`np.max` no se confunde con el método `x.max()`', () => {
    // contract: el patrón de método excluye `np.` (np.max es una función)
    expect(names('m = np.max(S)\n')).toEqual(['np.max(x)']);
    expect(names('t = d.max()\n')).toEqual(['x.max()']);
  });

  it('`print(` no trae `int(` ni `np.sum(` trae `sum(`', () => {
    // contract: las funciones de serie no se confunden con un trozo de otro nombre
    expect(names('print(x)\n')).toEqual(['print(x)']);
    expect(names('s = np.sum(v)\n')).toEqual(['np.sum(x)']);
  });

  it('las fichas básicas salen siempre y fuera de las de la pregunta', () => {
    const g = pythonGuide('x = None\n');
    // contract: «Lo básico» (leer, variables, números, print, errores) se ofrece en toda pregunta
    expect(g.basics.map((c) => c.id)).toEqual(['leer', 'variables', 'numeros', 'print', 'errores']);
    expect(g.cards).toEqual([]);
    expect(g.rest.length + g.basics.length).toBe(GUIDE_CARDS.length);
  });
});

describe('guía de Python: el texto', () => {
  it('ids de ficha y nombres del glosario sin repetir', () => {
    // contract: los ids forman el id del DOM de cada ficha
    expect(new Set(GUIDE_CARDS.map((c) => c.id)).size).toBe(GUIDE_CARDS.length);
    expect(new Set(GLOSSARY.map((g) => g.name)).size).toBe(GLOSSARY.length);
  });

  it('acentos graves y dólares con pareja, y KaTeX acepta cada fórmula', () => {
    const texts = [...GUIDE_CARDS.map((c) => c.body), ...GLOSSARY.map((g) => g.text)];
    for (const md of texts) {
      const outside = md.replace(/```[\s\S]*?```/g, '');
      // contract: reglas de prosa de las preguntas (prose-helpers: acentos y fórmulas)
      expect((outside.match(/`/g) ?? []).length % 2, md).toBe(0);
      const formulas = [...prose(md).matchAll(/\$([^$]+)\$/g)].map((m) => m[1]!);
      expect((prose(md).match(/\$/g) ?? []).length % 2, md).toBe(0);
      for (const f of formulas)
        expect(() => katex.renderToString(f, { throwOnError: true })).not.toThrow();
    }
  });

  it('en la prosa los decimales llevan coma, no punto', () => {
    // contract: CLAUDE.md, «Decimales con coma al mostrarlos» (el código va con punto)
    for (const md of [...GUIDE_CARDS.map((c) => c.body), ...GLOSSARY.map((g) => g.text)]) {
      expect(prose(md).replace(/\$[^$]*\$/g, ''), md).not.toMatch(/\d\.\d/);
    }
  });
});

describe('guía de Python y los juegos', () => {
  it('toda ficha que no es básica la usa alguna pregunta de código', () => {
    const used = new Set(allCode.flatMap(ids));
    const unused = GUIDE_CARDS.filter((c) => c.match !== 'basico' && !used.has(c.id)).map(
      (c) => c.id,
    );
    // contract: la guía explica lo que usan los juegos; una ficha que nadie usa es ruido
    expect(unused).toEqual([]);
  });

  it('toda entrada del glosario, salvo print, la usa alguna pregunta de código', () => {
    const used = new Set(allCode.flatMap(names));
    const unused = GLOSSARY.map((g) => g.name).filter((n) => n !== 'print(x)' && !used.has(n));
    // contract: el glosario de «Todas las funciones» describe lo que aparece en los juegos
    expect(unused).toEqual([]);
  });

  it('toda función de NumPy, de linalg y de plt que usan las referencias tiene su entrada o su ficha', () => {
    const calls = new Set(
      allCode.flatMap((code) =>
        [...withoutComments(code).matchAll(/\bnp\.[\w.]+(?=\()/g)].map((m) => m[0]),
      ),
    );
    const missing = [...calls].filter((c) => !names(`${c}(x)`).length);
    // contract: «máximo contexto» de Python: ninguna función de NumPy sin explicar
    expect(missing).toEqual([]);
  });
});
