import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('muestra el título en la ruta /', async () => {
    window.location.hash = '#/';
    render(<App />);
    // contract: spec sección 4/brief tarea 1: la ruta `/` muestra el título «AIlearn»
    // el inicio es una pantalla `lazy` (tarea 14): se espera a que cargue. En Vitest su primera carga
    // transforma todo su árbol de módulos y ya pasa de 1 s (el plazo por defecto): se dan 5 s.
    expect(
      await screen.findByRole('heading', { name: 'AIlearn' }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });
});
