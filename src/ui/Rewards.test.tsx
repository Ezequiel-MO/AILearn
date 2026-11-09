import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACHIEVEMENTS } from '../engine/rewards';
import { setSoundOn } from './fx/sound';
import { AchievementList, LevelBar, Stars, SoundToggle } from './Rewards';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Stars', () => {
  it('dice cuántas estrellas hay y enciende esas', () => {
    render(<Stars n={2} />);
    // contract: brief «juego más visual»: las estrellas tienen nombre para el lector
    expect(screen.getByRole('img', { name: '2 de 3 estrellas' })).toBeInTheDocument();
    expect(document.querySelectorAll('.stars__star--on')).toHaveLength(2);
  });
});

describe('LevelBar', () => {
  it('llena la parte recorrida del nivel y dice lo que falta', () => {
    render(<LevelBar points={200} />);
    const bar = document.querySelector('.xpbar')!;
    // contract: 200 XP = nivel 1,33: un tercio del nivel 2, faltan 100 (engine/rewards.levelProgress)
    expect(bar.getAttribute('title')).toBe('Faltan 100 XP para el nivel 2');
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('33.3%');
    // contract: repite el texto «Nivel …»: oculta al lector
    expect(bar.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('AchievementList', () => {
  it('enseña todos los logros y marca los que faltan', () => {
    render(<AchievementList earned={['launch', 'firstProject']} />);
    // contract: brief «juego más visual»: cuenta de conseguidos sobre el total
    expect(screen.getByText(`2 de ${ACHIEVEMENTS.length} conseguidos`)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(ACHIEVEMENTS.length);
    expect(screen.getAllByText('Aún no')).toHaveLength(ACHIEVEMENTS.length - 2);
  });
});

describe('SoundToggle', () => {
  it('no sale donde no hay efectos (jsdom sin matchMedia)', () => {
    render(<SoundToggle />);
    // contract: sin efectos no hay sonido que apagar; las pantallas no ganan un botón en las pruebas
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('enciende y apaga el sonido', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    setSoundOn(true);
    render(<SoundToggle />);
    const button = screen.getByRole('button', { name: 'Sonido' });
    // contract: brief «juego más visual»: interruptor con estado (aria-pressed)
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    setSoundOn(true);
  });
});
