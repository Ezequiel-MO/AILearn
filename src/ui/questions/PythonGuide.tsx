import {
  memo,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
} from 'react';
import {
  GLOSSARY,
  type GlossaryEntry,
  type GuideCard,
  type QuestionGuide,
} from '../../content/python-guide';
import { Md } from '../Md';
import { t } from '../strings';

export interface PythonGuideHandle {
  /** Abre el panel y la ficha, y le pasa el foco (desde «Cómo seguir»). */
  open: (cardId: string) => void;
}

/** Id de la ficha del glosario de la pregunta, para abrirla como una ficha más. */
export const GLOSSARY_CARD_ID = 'glosario';

/**
 * La guía de Python de una pregunta de código: un panel plegado con fichas plegables. Primero las que
 * usa su código, después lo básico y al final el resto, con el glosario completo.
 *
 * Son más de cien trozos de Markdown: el contenido solo se pinta la primera vez que se abre el panel, y
 * `memo` evita volver a pintarlo con cada tecla del editor (la guía y la ref no cambian).
 */
export const PythonGuide = memo(function PythonGuide({
  guide,
  ref,
}: {
  guide: QuestionGuide;
  ref?: Ref<PythonGuideHandle>;
}) {
  const base = useId();
  const panel = useRef<HTMLDetailsElement>(null);
  const [shown, setShown] = useState(false);
  // Ficha pedida desde fuera: se abre y se enfoca cuando ya está en el DOM.
  const [request, setRequest] = useState<{ id: string } | null>(null);
  const domId = (id: string) => `${base}-${id}`;

  useImperativeHandle(
    ref,
    () => ({
      open: (cardId: string) => {
        if (panel.current) panel.current.open = true;
        setShown(true);
        setRequest({ id: cardId });
      },
    }),
    [],
  );

  useLayoutEffect(() => {
    if (request === null) return;
    const card = document.getElementById(`${base}-${request.id}`);
    if (card === null) return;
    // La ficha y todos los paneles que la contienen quedan abiertos.
    for (let el: HTMLElement | null = card; el !== null; el = el.parentElement) {
      if (el instanceof HTMLDetailsElement) el.open = true;
      if (el === panel.current) break;
    }
    card.querySelector('summary')?.focus();
  }, [request, base]);

  const card = (c: GuideCard) => (
    <details key={c.id} id={domId(c.id)} className="guide__card">
      <summary className="guide__card-title">{c.title}</summary>
      <div className="guide__card-body">
        <Md>{c.body}</Md>
      </div>
    </details>
  );

  const glossary = (entries: readonly GlossaryEntry[], id: string, title: string) =>
    entries.length > 0 ? (
      <details key={id} id={domId(id)} className="guide__card">
        <summary className="guide__card-title">{title}</summary>
        <dl className="guide__glossary">
          {entries.map((g) => (
            <div key={g.name} className="guide__term">
              <dt>
                <code>{g.name}</code>
              </dt>
              <dd>
                <Md inline>{g.text}</Md>
              </dd>
            </div>
          ))}
        </dl>
      </details>
    ) : null;

  const specific = guide.cards.length + (guide.glossary.length > 0 ? 1 : 0);

  return (
    <details
      className="guide"
      ref={panel}
      onToggle={(e) => {
        if (e.currentTarget.open) setShown(true);
      }}
    >
      <summary className="guide__summary">
        {t.guide.label}
        {specific > 0 ? <span className="guide__count"> · {t.guide.count(specific)}</span> : null}
      </summary>
      {shown ? (
        <div className="guide__body">
          {specific > 0 ? (
            <section className="guide__group">
              <p className="guide__group-title">{t.guide.here}</p>
              {guide.cards.map(card)}
              {glossary(guide.glossary, GLOSSARY_CARD_ID, t.guide.glossaryHere)}
            </section>
          ) : null}
          <section className="guide__group">
            <p className="guide__group-title">{t.guide.basics}</p>
            {guide.basics.map(card)}
          </section>
          <section className="guide__group">
            <p className="guide__group-title">{t.guide.rest}</p>
            {guide.rest.map(card)}
            {glossary(GLOSSARY, 'glosario-completo', t.guide.glossaryAll)}
          </section>
        </div>
      ) : null}
    </details>
  );
});
