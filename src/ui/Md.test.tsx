import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Md } from './Md';

describe('Md', () => {
  // contract: tarea 9, tabla de casos: Md con $x^2$ -> hay un elemento con clase katex
  it('renderiza fórmulas con KaTeX', () => {
    const { container } = render(<Md>{'Sea $x^2$ el cuadrado.'}</Md>);
    expect(container.querySelector('.katex')).not.toBeNull();
  });

  // contract: tarea 9, tabla de casos: Md con <script> en el texto -> no se crea ningún elemento script
  it('no ejecuta HTML del contenido', () => {
    const { container } = render(
      <Md>{'Hola <script>alert(1)</script> <img src=x onerror="alert(1)">'}</Md>,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  // contract: addendum de la tarea 9: \lVert, \dfrac y coma decimal 3{,}5 (como emite src/content/generators.ts) sin katex-error
  it('renderiza las fórmulas que emiten los generadores sin error de KaTeX', () => {
    const { container } = render(
      <Md>{'Calcula $\\lVert \\vec{v} \\rVert = \\dfrac{3{,}5}{2}$ y $$\\dfrac{1}{3{,}5}$$'}</Md>,
    );
    expect(container.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector('.katex-error')).toBeNull();
  });

  // contract: tarea 9, contrato de Md: inline? -> sin bloque de párrafo
  it('en modo inline no crea párrafos', () => {
    const { container } = render(<Md inline>{'valor $x$'}</Md>);
    expect(container.querySelector('p')).toBeNull();
    expect(container.querySelector('.katex')).not.toBeNull();
  });

  // contract: tarea 9, contrato de Md: Markdown (negrita)
  it('interpreta Markdown', () => {
    const { container } = render(<Md>{'Una **negrita**'}</Md>);
    expect(container.querySelector('strong')?.textContent).toBe('negrita');
  });

  describe('puntuación pegada a la fórmula (18b fix B, R46)', () => {
    const wrappers = (c: HTMLElement) => Array.from(c.querySelectorAll('.md__nowrap'));

    // contract: fix 18b-B R46 («$a$:» deja la fórmula y «:» dentro del mismo elemento sin partir)
    it('«$a$:» pone la fórmula y los dos puntos en el mismo elemento', () => {
      const { container } = render(<Md>{'Mira $a$: y sigue'}</Md>);
      const [w, ...rest] = wrappers(container);
      expect(rest).toHaveLength(0);
      expect(w.querySelector('.katex')).not.toBeNull();
      expect(w.lastChild?.textContent).toBe(':');
      expect(w.parentElement?.textContent).toContain(' y sigue');
      expect(w.textContent).not.toContain('y sigue');
    });

    // contract: fix 18b-B R46 (puntos «.», «,», «;» y «)» detrás de la fórmula)
    it.each(['.', ',', ';', ')'])('también con «%s»', (sign) => {
      const { container } = render(<Md inline>{`Es $a$${sign} Luego.`}</Md>);
      const [w] = wrappers(container);
      expect(w.lastChild?.textContent).toBe(sign);
      expect(container.textContent?.endsWith(` Luego.`)).toBe(true);
    });

    // contract: fix 18b-B R46 (se pega toda la puntuación contigua: «).»)
    it('pega varios signos seguidos', () => {
      const { container } = render(<Md>{'(ver $a$). Fin'}</Md>);
      expect(wrappers(container)[0].lastChild?.textContent).toBe(').');
    });

    // contract: fix 18b-B R46 (texto sin puntuación tras la fórmula: sin cambios)
    it('sin puntuación detrás no añade ningún envoltorio', () => {
      const { container } = render(<Md>{'Sea $a$ y $b$ dos números'}</Md>);
      expect(wrappers(container)).toHaveLength(0);
    });

    // contract: fix 18b-B R46 (una puntuación separada de la fórmula por un espacio no se pega)
    it('un signo separado por un espacio no se pega', () => {
      const { container } = render(<Md>{'Sea $a$ : así'}</Md>);
      expect(wrappers(container)).toHaveLength(0);
    });

    // contract: fix 18b-B R46 (el texto del contenido no cambia)
    it('no cambia el texto', () => {
      const { container } = render(<Md inline>{'a $x$: b'}</Md>);
      expect(container.textContent).toBe(`a ${container.querySelector('.katex')!.textContent}: b`);
    });

    // contract: fix 18b-B R46 (una fórmula en bloque no se envuelve)
    it('una fórmula en bloque no se envuelve', () => {
      const { container } = render(<Md>{'$$a$$\n\n. Fin'}</Md>);
      expect(wrappers(container)).toHaveLength(0);
    });
  });
});
