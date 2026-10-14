import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { Layout } from './Layout';

const renderLayout = (props: Partial<Parameters<typeof Layout>[0]> = {}) =>
  render(
    <MemoryRouter>
      <Layout title="Órbita 0" {...props}>
        <p>contenido</p>
      </Layout>
    </MemoryRouter>,
  );

describe('Layout', () => {
  // contract: addendum de la tarea 9: «Nivel 1,33»; «Nivel 0» cuando es 0
  it('muestra el nivel con coma y sin ceros de más', () => {
    renderLayout({ level: 1.33 });
    expect(screen.getByText('Nivel 1,33')).toBeInTheDocument();
  });

  it('muestra «Nivel 0» cuando es 0', () => {
    renderLayout({ level: 0 });
    expect(screen.getByText('Nivel 0')).toBeInTheDocument();
  });

  // contract: tarea 9, contrato de Layout: level, back y warning son opcionales
  it('sin nivel ni enlace no los dibuja', () => {
    renderLayout();
    expect(screen.queryByText(/Nivel/)).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Órbita 0' })).toBeInTheDocument();
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });

  it('dibuja el enlace de vuelta hacia la ruta dada', () => {
    renderLayout({ back: '/juego' });
    expect(screen.getByRole('link', { name: 'Volver' })).toHaveAttribute('href', '/juego');
  });

  // contract: tarea 9, contrato de Layout: zona de avisos; existe siempre (región viva) y lleva el texto si hay aviso
  it('la zona de avisos existe siempre y muestra el aviso', () => {
    const { rerender } = renderLayout();
    const zone = screen.getByRole('status');
    expect(zone).toBeEmptyDOMElement();
    rerender(
      <MemoryRouter>
        <Layout title="x" warning="Progreso apartado">
          <p>c</p>
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Progreso apartado');
  });
});
