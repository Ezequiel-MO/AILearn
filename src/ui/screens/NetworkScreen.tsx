import { useContext, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { Game, NetworkPart } from '../../content/schema';
import { NETWORK_PARTS } from '../../content/schema';
import { NETWORK_GROUPS, network } from '../../games/network';
import { roadmap } from '../../games/roadmap';
import { GamesContext } from '../GamesContext';
import { Layout } from '../Layout';
import { Md } from '../Md';
import { NetworkDiagram } from '../NetworkDiagram';
import { t } from '../strings';
import { mapPath, projectPath, useFocusTitle } from './lookup';

const isPart = (value: string | null): value is NetworkPart =>
  value !== null && (NETWORK_PARTS as readonly string[]).includes(value);

/** `/red`: la red pieza a pieza; con `?pieza=` llega con una elegida. */
export function NetworkScreen() {
  const games = useContext(GamesContext);
  const [params, setParams] = useSearchParams();
  const raw = params.get('pieza');
  const selected = isPart(raw) ? raw : undefined;
  useFocusTitle();

  // La ficha queda a la vista al elegir una pieza.
  useEffect(() => {
    if (selected) document.getElementById('red-sheet')?.scrollIntoView?.({ block: 'nearest' });
  }, [selected]);

  const select = (part: NetworkPart) => {
    const next = new URLSearchParams(params);
    next.set('pieza', part);
    setParams(next, { replace: true });
  };

  return (
    <Layout title={t.network.title} back="/">
      <p className="net__intro">{t.network.intro}</p>
      <div className="net__figure">
        <NetworkDiagram
          highlight={selected ? [selected] : []}
          selected={selected}
          onSelect={select}
        />
      </div>

      <section id="red-sheet" className="net__sheet" aria-live="polite">
        {selected ? <Sheet part={selected} games={games} /> : <p>{t.network.pickHint}</p>}
      </section>

      <section className="net__groups" aria-labelledby="red-groups">
        <h2 id="red-groups" className="panel__heading">
          {t.network.groupsHeading}
        </h2>
        <dl className="net__group-list">
          {NETWORK_GROUPS.map((g) => (
            <div key={g.id} className="net__group">
              <dt>{g.name}</dt>
              <dd>{g.short}</dd>
            </div>
          ))}
        </dl>
      </section>
    </Layout>
  );
}

function Sheet({ part, games }: { part: NetworkPart; games: readonly Game[] }) {
  const info = network[part];
  const practice = games.flatMap((game) =>
    game.orbits.flatMap((orbit) =>
      orbit.projects
        .filter((p) => p.bigPicture?.parts.includes(part))
        .map((p) => ({ game, project: p })),
    ),
  );
  return (
    <div className="net__sheet-body">
      <h2 className="net__sheet-name">{info.name}</h2>
      <p className="net__sheet-short">{info.short}</p>
      <Md>{info.detail}</Md>

      <h3 className="net__sheet-heading">{t.network.practiceHeading}</h3>
      {practice.length === 0 ? (
        <p className="net__none">{t.network.practiceNone}</p>
      ) : (
        <ul className="net__links">
          {practice.map(({ game, project }) => (
            <li key={`${game.id}/${project.id}`}>
              <Link className="net__link" to={projectPath(game.id, project.id)}>
                {project.name}
              </Link>
              <span className="net__link-game">{game.title}</span>
            </li>
          ))}
        </ul>
      )}

      <h3 className="net__sheet-heading">{t.network.roadmapHeading}</h3>
      <ul className="net__links">
        {info.roadmap.map(({ game: gameId, orbit }) => {
          const registered = games.find((g) => g.id === gameId);
          const built = registered?.orbits.some((o) => o.name === orbit) ?? false;
          const title = roadmap.find((g) => g.id === gameId)?.title ?? gameId;
          return (
            <li key={`${gameId}/${orbit}`}>
              {built ? (
                <Link className="net__link" to={mapPath(gameId)}>
                  {t.network.roadmapItem(orbit)}
                </Link>
              ) : (
                <>
                  <span>{t.network.roadmapItem(orbit)}</span>{' '}
                  <span className="net__soon">{t.network.soon}</span>
                </>
              )}
              <span className="net__link-game">{title}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
