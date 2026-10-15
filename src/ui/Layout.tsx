import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Account } from './Account';
import { t } from './strings';

/**
 * Marco de página: cabecera con enlace de vuelta, título y nivel, y la zona de avisos.
 * La zona de avisos existe siempre (región viva): así el lector de pantalla anuncia
 * un aviso que aparece después de pintar la página.
 */
export function Layout({
  title,
  back,
  level,
  warning,
  children,
}: {
  title: string;
  back?: string;
  level?: number;
  warning?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="layout">
      <Account />
      <header className="layout__header">
        {back !== undefined && (
          <Link className="layout__back" to={back}>
            {t.layout.back}
          </Link>
        )}
        <h1 className="layout__title">{title}</h1>
        {level !== undefined && <span className="layout__level">{t.layout.level(level)}</span>}
      </header>
      <div className="layout__warnings" role="status">
        {warning ? <p className="layout__warning">{warning}</p> : null}
      </div>
      <main className="layout__main">{children}</main>
    </div>
  );
}
