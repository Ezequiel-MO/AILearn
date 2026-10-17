import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../../App';
import type { Game } from '../../content/schema';
import { vectores } from '../../games/vectores';
import { GamesContext } from '../GamesContext';

// Pantalla de la ruta completa. El registro se inyecta: el juego 1 con solo sus dos primeras órbitas,
// para ver a la vez lo disponible y lo «Próximamente» dentro de un juego registrado.

const partial: Game = { ...vectores, orbits: vectores.orbits.slice(0, 2) };

const setup = async (route: string, registered: Game[] = [partial]) => {
  render(
    <GamesContext.Provider value={registered}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </GamesContext.Provider>,
  );
  await waitFor(() => expect(document.querySelector('.layout__title')).not.toBeNull(), {
    timeout: 15000,
  });
};

const card = (title: string) => within(screen.getByRole('listitem', { name: title }));

describe('Ruta completa', () => {
  it('enseña los nueve juegos con sus totales y vuelve al inicio', async () => {
    await setup('/ruta');
    // contract: petición del propietario (2026-10-17): la ruta entera, con lo no construido como «Próximamente»
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('La ruta completa');
    // contract: spec, sección 2: 9 juegos; 4 órbitas de 3 proyectos cada uno (tests/content/roadmap.test.ts)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(9);
    // contract: mismos recuentos; con un juego registrado, «1 juego disponible»
    expect(
      screen.getByText('9 juegos · 36 órbitas · 108 proyectos · 1 juego disponible'),
    ).toBeInTheDocument();
    // contract: Layout con `back="/"`, como el mapa
    expect(screen.getByRole('link', { name: 'Volver' })).toHaveAttribute('href', '/');
  });

  it('un juego registrado está disponible, enlaza a su mapa y marca «Próximamente» las órbitas que aún no tiene', async () => {
    await setup('/ruta');
    const game = card('Vectores y embeddings');
    // contract: registrado = disponible, con enlace al mapa (`mapPath`)
    expect(game.getByRole('link', { name: 'Ir al juego' })).toHaveAttribute('href', '/j/vectores');
    const built = within(game.getByRole('listitem', { name: 'Órbita 1 · El ángulo' }));
    // contract: órbita 1 < 2 órbitas registradas
    expect(built.getByText('Disponible')).toBeInTheDocument();
    expect(built.getByText('Coseno')).toBeInTheDocument();
    const pending = within(game.getByRole('listitem', { name: 'Órbita 3 · Búsqueda' }));
    // contract: la órbita 3 no está en el juego registrado
    expect(pending.getByText('Próximamente')).toBeInTheDocument();
    expect(pending.getByText('Por qué falla un RAG')).toBeInTheDocument();
  });

  it('un juego sin registrar dice «Próximamente», no enlaza y enseña sus órbitas y proyectos', async () => {
    await setup('/ruta');
    const game = card('Matrices y transformaciones');
    // contract: no registrado = «Próximamente», sin enlace a un mapa que no existe
    expect(game.queryByRole('link')).toBeNull();
    const despegue = within(game.getByRole('listitem', { name: 'Despegue' }));
    expect(despegue.getByText('Próximamente')).toBeInTheDocument();
    const orbit = within(
      game.getByRole('listitem', { name: 'Órbita 3 · Descomponer y aproximar' }),
    );
    // contract: la ruta enseña también el contenido de lo no construido (petición del propietario)
    expect(orbit.getByText('Rango bajo y LoRA')).toBeInTheDocument();
    expect(orbit.getByText('Próximamente')).toBeInTheDocument();
  });

  it('el inicio enlaza a la ruta', async () => {
    await setup('/');
    // contract: la ruta se alcanza desde el inicio
    expect(screen.getByRole('link', { name: 'Ver la ruta completa' })).toHaveAttribute(
      'href',
      '/ruta',
    );
  });
});
