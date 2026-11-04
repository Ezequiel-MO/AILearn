import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../App';
import type { Game } from '../../content/schema';
import { NETWORK_PARTS } from '../../content/schema';
import { network } from '../../games/network';
import { vectores } from '../../games/vectores';
import { GamesContext } from '../GamesContext';
import { NetworkDiagram } from '../NetworkDiagram';
import { resetOpenOverride } from './lookup';

// El dibujo de la red, la tarjeta «Dónde encaja» del panel y la página #/red. El juego es el real con
// un `bigPicture` propio en su primer proyecto, para no depender de los textos de contenido.

const FIRST = vectores.orbits[0].projects[0];
const BIG = {
  parts: ['attention', 'embedding'] as const,
  text: 'Texto de prueba del big picture.',
};
const withPicture: Game = {
  ...vectores,
  orbits: vectores.orbits.map((o, i) =>
    i === 0
      ? {
          ...o,
          projects: o.projects.map((p) =>
            p.id === FIRST.id ? { ...p, bigPicture: { ...BIG, parts: [...BIG.parts] } } : p,
          ),
        }
      : o,
  ),
};
const without: Game = {
  ...vectores,
  orbits: vectores.orbits.map((o) => ({
    ...o,
    projects: o.projects.map((p) => ({ ...p, bigPicture: undefined })),
  })),
};

const setup = async (route: string, game: Game) => {
  render(
    <GamesContext.Provider value={[game]}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </GamesContext.Provider>,
  );
  await waitFor(() => expect(document.querySelector('.layout__title')).not.toBeNull(), {
    timeout: 15000,
  });
};

afterEach(() => resetOpenOverride());

describe('NetworkDiagram', () => {
  it('pinta las 13 piezas y marca las resaltadas', () => {
    const { container } = render(<NetworkDiagram highlight={['loss', 'gradient']} />);
    // contract: `NETWORK_PARTS` de schema.ts, 13 piezas, cada una con su `data-part`
    expect(container.querySelectorAll('[data-part]')).toHaveLength(NETWORK_PARTS.length);
    const on = [...container.querySelectorAll('[data-on="true"]')].map((n) =>
      n.getAttribute('data-part'),
    );
    // contract: solo las pasadas en `highlight`
    expect(on).toEqual(['loss', 'gradient']);
    // contract: sin `onSelect` es una figura que nombra las piezas resaltadas
    expect(screen.getByRole('img')).toHaveAccessibleName(/Pérdida, Gradiente/);
  });

  it('con onSelect cada pieza es un botón: clic, Enter y espacio llaman con su id', async () => {
    const onSelect = vi.fn();
    render(<NetworkDiagram highlight={[]} selected="norm" onSelect={onSelect} />);
    const user = userEvent.setup();
    // contract: un botón por pieza, con el nombre de `network[...]`
    expect(screen.getAllByRole('button')).toHaveLength(NETWORK_PARTS.length);
    await user.click(screen.getByRole('button', { name: network.attention.name }));
    expect(onSelect).toHaveBeenLastCalledWith('attention');
    screen.getByRole('button', { name: network.loss.name }).focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith('loss');
    screen.getByRole('button', { name: network.update.name }).focus();
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenLastCalledWith('update');
    // contract: la pieza elegida queda marcada como pulsada
    expect(screen.getByRole('button', { name: network.norm.name })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('#/red', () => {
  it('con ?pieza=attention enseña su ficha y enlaza los proyectos que la tocan', async () => {
    await setup('/red?pieza=attention', withPicture);
    // contract: título de la petición de Oliver
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('La red por dentro');
    expect(
      screen.getByRole('heading', { level: 2, name: network.attention.name }),
    ).toBeInTheDocument();
    // contract: «Dónde lo practicas» enlaza al panel de cada proyecto con esa pieza en su bigPicture
    expect(screen.getByRole('link', { name: FIRST.name })).toHaveAttribute(
      'href',
      `/j/${vectores.id}/p/${FIRST.id}`,
    );
  });

  it('una pieza sin proyectos lo dice, y una órbita no construida sale como «Próximamente»', async () => {
    await setup('/red?pieza=tokens', without);
    // contract: ningún proyecto del juego de prueba toca `tokens`
    expect(
      screen.getByText('Aún no hay ningún proyecto construido que la toque.'),
    ).toBeInTheDocument();
    // contract: network.tokens.roadmap = juego «transformer», órbita «Tokens»; ese juego no está registrado
    const soon = screen.getByText('Órbita «Tokens»').closest('li');
    expect(within(soon as HTMLElement).getByText('Próximamente')).toBeInTheDocument();
  });

  it('una órbita construida enlaza al mapa de su juego', async () => {
    await setup('/red?pieza=embedding', without);
    // contract: network.embedding.roadmap incluye vectores / «La flecha», y el juego está registrado
    expect(screen.getByRole('link', { name: 'Órbita «La flecha»' })).toHaveAttribute(
      'href',
      `/j/${vectores.id}`,
    );
  });

  it('sin ?pieza= pide elegir una', async () => {
    await setup('/red', without);
    expect(screen.getByText('Elige una pieza del dibujo.')).toBeInTheDocument();
  });
});

describe('Tarjeta «Dónde encaja en la red»', () => {
  it('el panel del proyecto la enseña con su bigPicture, con su texto, sus piezas y el enlace a #/red', async () => {
    await setup(`/j/${vectores.id}/p/${FIRST.id}?abierto`, withPicture);
    const card = within(screen.getByRole('region', { name: 'Dónde encaja en la red' }));
    // contract: el `text` del bigPicture se enseña con Md
    expect(card.getByText(BIG.text)).toBeInTheDocument();
    // contract: la lista de piezas, con el nombre de `network`
    expect(
      within(card.getByRole('list', { name: 'Piezas que toca' })).getByText(network.attention.name),
    ).toBeInTheDocument();
    // contract: el enlace lleva a la primera pieza y conserva ?abierto
    expect(card.getByRole('link', { name: 'Ver la red entera' })).toHaveAttribute(
      'href',
      '/red?pieza=attention&abierto',
    );
  });

  it('el panel no la enseña sin bigPicture', async () => {
    await setup(`/j/${vectores.id}/p/${FIRST.id}?abierto`, without);
    expect(screen.queryByRole('region', { name: 'Dónde encaja en la red' })).toBeNull();
  });
});
