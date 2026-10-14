import { Link } from 'react-router';
import { Layout } from '../Layout';
import { t } from '../strings';
import { mapPath, useFocusTitle } from './lookup';

/**
 * Pantalla de una etapa que no se puede ver: «Todavía no está abierto» (cerrada según el motor) o
 * «No existe» (juego, proyecto, ejercicio o órbita que no están). Siempre trae un enlace de salida.
 * Sin juego no hay mapa: el enlace va al inicio.
 */
export function Gate({
  kind,
  gameId,
  level,
  warning,
}: {
  kind: 'closed' | 'missing';
  /** Juego al que pertenece la ruta, si existe: el enlace va a su mapa. */
  gameId?: string;
  level?: number;
  warning?: string | null;
}) {
  useFocusTitle();
  const closed = kind === 'closed';
  return (
    <Layout title={closed ? t.play.closed : t.play.missing} level={level} warning={warning}>
      <div className="play__gate">
        <p className="play__gate-text">{closed ? t.play.closedHelp : t.play.missingHelp}</p>
        <Link className="play__action" to={gameId === undefined ? '/' : mapPath(gameId)}>
          {gameId === undefined ? t.play.toHome : t.play.toMap}
        </Link>
      </div>
    </Layout>
  );
}
