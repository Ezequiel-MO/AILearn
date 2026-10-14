import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('muestra el título en la ruta /', async () => {
    window.location.hash = '#/';
    render(<App />);
    // contract: spec sección 4/brief tarea 1: la ruta `/` muestra el título «AIlearn»
    // el inicio es una pantalla `lazy` (tarea 14): se espera a que cargue
    expect(await screen.findByRole('heading', { name: 'AIlearn' })).toBeInTheDocument();
  });
});
