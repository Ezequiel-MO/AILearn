// Efectos de celebración y aviso, fuera del árbol de React: se pintan en una capa fija sobre la página,
// ocultos al lector de pantalla (salvo los avisos, que se anuncian) y sin recibir clics. Nunca llevan
// información que no esté también en la página.
// Confeti al estilo de canvas-confetti (github.com/catdad/canvas-confetti), con piezas de DOM y CSS.

import { browserFx, motionAllowed } from './motion';

const COLORS = [
  'var(--color-accent)',
  'var(--color-ok)',
  'var(--color-warn)',
  'var(--plane-v1)',
  'var(--plane-v2)',
  '#f2f5f8',
];

export interface BurstOptions {
  /** Cuántas piezas. */
  count?: number;
  /** Dirección central en grados (90 = hacia arriba, 0 = derecha). */
  angle?: number;
  /** Apertura del abanico, en grados. */
  spread?: number;
  /** Fuerza: multiplica la distancia que recorren. */
  power?: number;
}

/** El centro de un elemento, en coordenadas de la ventana. */
export const centerOf = (el: Element | null | undefined): { x: number; y: number } => {
  const r = el?.getBoundingClientRect();
  if (!r || (r.width === 0 && r.height === 0)) return { x: innerWidth / 2, y: innerHeight / 2 };
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** Confeti desde un punto de la ventana. Con movimiento reducido no sale nada. */
export const burst = (
  at: { x: number; y: number },
  { count = 26, angle = 90, spread = 70, power = 1 }: BurstOptions = {},
): void => {
  if (!motionAllowed()) return;
  const layer = document.createElement('div');
  layer.className = 'fx-burst';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.left = `${at.x}px`;
  layer.style.top = `${at.y}px`;
  for (let i = 0; i < count; i++) {
    const bit = document.createElement('span');
    bit.className = `fx-burst__bit${i % 3 === 0 ? ' fx-burst__bit--round' : ''}`;
    const a = ((angle + (Math.random() - 0.5) * spread) * Math.PI) / 180;
    const dist = (70 + Math.random() * 110) * power;
    bit.style.setProperty('--dx', `${(Math.cos(a) * dist).toFixed(1)}px`);
    bit.style.setProperty('--dy', `${(-Math.sin(a) * dist).toFixed(1)}px`);
    bit.style.setProperty('--fall', `${(90 + Math.random() * 120).toFixed(1)}px`);
    bit.style.setProperty('--rot', `${Math.round((Math.random() - 0.5) * 1080)}deg`);
    bit.style.setProperty('--delay', `${Math.round(Math.random() * 90)}ms`);
    bit.style.setProperty('--color', COLORS[i % COLORS.length] ?? '#fff');
    layer.append(bit);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 1600);
};

/** La gran celebración: dos cañones de confeti desde las esquinas de abajo. */
export const fireworks = (): void => {
  burst({ x: innerWidth * 0.12, y: innerHeight }, { count: 46, angle: 65, spread: 40, power: 3.2 });
  burst(
    { x: innerWidth * 0.88, y: innerHeight },
    { count: 46, angle: 115, spread: 40, power: 3.2 },
  );
};

/** Un texto corto que sube y se desvanece («+80 XP», «Racha ×3»). Decorativo: oculto al lector. */
export const floatText = (at: { x: number; y: number }, text: string): void => {
  if (!motionAllowed()) return;
  const el = document.createElement('span');
  el.className = 'fx-float num';
  el.setAttribute('aria-hidden', 'true');
  el.textContent = text;
  el.style.left = `${at.x}px`;
  el.style.top = `${at.y}px`;
  document.body.append(el);
  setTimeout(() => el.remove(), 1300);
};

/** Sacude un elemento (un fallo). Con movimiento reducido, nada. */
export const shake = (el: Element | null | undefined): void => {
  if (!el || !motionAllowed() || typeof el.animate !== 'function') return;
  el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(-3px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 320, easing: 'ease-out' },
  );
};

let toasts: HTMLElement | null = null;

/**
 * Un aviso que aparece abajo unos segundos (logro nuevo, subida de nivel). Va en una región viva para que
 * el lector de pantalla lo lea. Solo en un navegador de verdad: en las pruebas con jsdom no se pinta.
 */
export const toast = ({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}): void => {
  if (!browserFx()) return;
  if (!toasts || !toasts.isConnected) {
    toasts = document.createElement('div');
    toasts.className = 'fx-toasts';
    toasts.setAttribute('aria-live', 'polite');
    document.body.append(toasts);
  }
  const item = document.createElement('div');
  item.className = 'fx-toast';
  const badge = document.createElement('span');
  badge.className = 'fx-toast__icon';
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = icon;
  const body = document.createElement('div');
  const strong = document.createElement('strong');
  strong.className = 'fx-toast__title';
  strong.textContent = title;
  const p = document.createElement('span');
  p.className = 'fx-toast__text';
  p.textContent = text;
  body.append(strong, p);
  item.append(badge, body);
  toasts.append(item);
  setTimeout(() => item.classList.add('fx-toast--out'), 4600);
  setTimeout(() => item.remove(), 5200);
};
