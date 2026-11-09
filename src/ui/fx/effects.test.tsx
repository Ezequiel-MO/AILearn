import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { burst, floatText, shake, toast } from './effects';

const stubMotion = (reduce: boolean) => vi.stubGlobal('matchMedia', () => ({ matches: reduce }));

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('burst', () => {
  it('pone las piezas en una capa oculta al lector y la quita al acabar', () => {
    stubMotion(false);
    burst({ x: 100, y: 200 }, { count: 12 });
    const layer = document.querySelector('.fx-burst')!;
    // contract: brief «juego más visual»: el confeti es adorno, nunca información
    expect(layer.getAttribute('aria-hidden')).toBe('true');
    expect(layer.querySelectorAll('.fx-burst__bit')).toHaveLength(12);
    vi.advanceTimersByTime(2000);
    // contract: la capa no se queda en la página
    expect(document.querySelector('.fx-burst')).toBeNull();
  });

  it('con movimiento reducido o sin navegador no pinta nada', () => {
    stubMotion(true);
    burst({ x: 0, y: 0 });
    floatText({ x: 0, y: 0 }, '+10 XP');
    // contract: prefers-reduced-motion manda (brief «juego más visual»)
    expect(document.body.children).toHaveLength(0);
    vi.unstubAllGlobals();
    burst({ x: 0, y: 0 });
    // contract: sin matchMedia (jsdom) no hay efectos
    expect(document.body.children).toHaveLength(0);
  });
});

describe('shake', () => {
  it('anima el elemento solo con movimiento permitido', () => {
    const el = document.createElement('button');
    const animate = vi.fn();
    el.animate = animate as unknown as typeof el.animate;
    stubMotion(true);
    shake(el);
    // contract: con movimiento reducido no se sacude nada
    expect(animate).not.toHaveBeenCalled();
    stubMotion(false);
    shake(el);
    // contract: sacudida corta (Web Animations), sin tocar el estilo del elemento
    expect(animate).toHaveBeenCalledTimes(1);
  });
});

describe('toast', () => {
  it('se anuncia en una región viva y se va solo', () => {
    stubMotion(true);
    toast({ icon: '★', title: 'Logro: Pleno', text: 'Acierta las 5.' });
    const region = document.querySelector('.fx-toasts')!;
    // contract: el aviso de logro se lee (aria-live), también con movimiento reducido
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.textContent).toContain('Logro: Pleno');
    vi.advanceTimersByTime(6000);
    // contract: el aviso dura unos segundos
    expect(region.querySelector('.fx-toast')).toBeNull();
  });
});
