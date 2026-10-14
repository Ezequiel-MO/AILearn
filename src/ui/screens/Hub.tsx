import { useContext, useId, useMemo } from 'react';
import { Link } from 'react-router';
import type { Game } from '../../content/schema';
import { toShape } from '../../content/schema';
import { level, xp } from '../../engine/progression';
import { GamesContext } from '../GamesContext';
import { Layout } from '../Layout';
import { t } from '../strings';
import { useProgress } from '../useProgress';
import { mapPath, useFocusTitle } from './lookup';

/** `/`: una tarjeta por juego registrado, con su nivel y su XP. */
export function Hub() {
  const games = useContext(GamesContext);
  useFocusTitle();
  return (
    <Layout title={t.appTitle}>
      <p className="hub__intro">{t.hub.chooseGame}</p>
      <ul className="hub__list">
        {games.map((game) => (
          <HubCard key={game.id} game={game} />
        ))}
      </ul>
    </Layout>
  );
}

function HubCard({ game }: { game: Game }) {
  const { summary } = useProgress(game.id);
  const titleId = useId();
  const shape = useMemo(() => toShape(game), [game]);
  const points = xp(shape, summary);
  return (
    <li className="hub__card" aria-labelledby={titleId}>
      <Link id={titleId} className="hub__game" to={mapPath(game.id)}>
        {game.title}
      </Link>
      <span className="hub__figures">
        <span>{t.layout.level(level(points))}</span>
        <span className="num">{t.hub.xp(points)}</span>
      </span>
    </li>
  );
}
