import { createContext, useContext, useSyncExternalStore } from 'react';
import type { Account as AccountApi } from '../cloud/store';
import { t } from './strings';

/** La cuenta de la aplicación; null fuera de ella (pruebas, rutas de desarrollo): no se pinta nada. */
export const AccountContext = createContext<AccountApi | null>(null);

/** Inicio de sesión con Google y estado del guardado en la nube, en la cabecera. */
export function Account() {
  const account = useContext(AccountContext);
  if (account === null) return null;
  return <AccountView account={account} />;
}

function AccountView({ account }: { account: AccountApi }) {
  const state = useSyncExternalStore(account.subscribe, account.get);
  if (state.status === 'loading') return null;
  if (state.status === 'out') {
    return (
      <div className="account">
        <button type="button" className="account__button" onClick={account.signIn}>
          {t.account.signIn}
        </button>
      </div>
    );
  }
  const note = state.syncing
    ? t.account.syncing
    : state.failed
      ? t.account.failed
      : t.account.synced;
  return (
    <div className="account">
      <span className="account__name">{state.name}</span>
      <span className="account__note" role="status">
        {note}
      </span>
      <button type="button" className="account__button" onClick={account.signOut}>
        {t.account.signOut}
      </button>
    </div>
  );
}
