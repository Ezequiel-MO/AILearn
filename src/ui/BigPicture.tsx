import { useId } from 'react';
import { Link } from 'react-router';
import type { BigPicture as BigPictureData } from '../content/schema';
import { network } from '../games/network';
import { Md } from './Md';
import { NetworkDiagram } from './NetworkDiagram';
import { networkPath, useOpenOverride } from './screens/lookup';
import { t } from './strings';

/** La tarjeta «Dónde encaja en la red»: el dibujo con las piezas del proyecto resaltadas y qué hacen. */
export function BigPicture({ bigPicture }: { bigPicture: BigPictureData }) {
  const titleId = useId();
  const override = useOpenOverride();
  return (
    <section className="bigpic" aria-labelledby={titleId}>
      <h2 id={titleId} className="bigpic__heading">
        {t.network.cardHeading}
      </h2>
      <div className="bigpic__body">
        <div className="bigpic__figure">
          <NetworkDiagram highlight={bigPicture.parts} compact />
        </div>
        <div className="bigpic__text">
          <Md>{bigPicture.text}</Md>
          <ul className="bigpic__parts" aria-label={t.network.cardPieces}>
            {bigPicture.parts.map((part) => (
              <li key={part} className="bigpic__part">
                <strong>{network[part].name}</strong>
                <span className="bigpic__short">{network[part].short}</span>
              </li>
            ))}
          </ul>
          <Link className="play__action" to={networkPath(bigPicture.parts[0], override)}>
            {t.network.cardMore}
          </Link>
        </div>
      </div>
    </section>
  );
}
