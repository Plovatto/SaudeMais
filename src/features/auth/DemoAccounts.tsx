import { pill } from '@components/ui/styles';
import { DEMO_ACCOUNTS, type DemoAccount } from '@constants/demo-accounts';
import { cx } from '@lib/cx';
import { plural } from '@lib/plural';

export interface DemoAccountsProps {
  selected: string;
  onFill: (account: DemoAccount) => void;
}

export function DemoAccounts({ selected, onFill }: DemoAccountsProps) {
  return (
    <section
      aria-labelledby="demo-accounts-title"
      className="border-border-strong mt-1.5 flex flex-col gap-2.5 border-t border-dashed pt-[18px]"
    >
      <h2 id="demo-accounts-title" className="text-text-muted text-xs font-normal">
        Contas de exemplo
      </h2>
      <p id="demo-accounts-hint" className="sr-only">
        Preenche o e-mail e a senha da conta.
      </p>
      <div className="flex flex-wrap gap-2">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            aria-describedby="demo-accounts-hint"
            onClick={() => onFill(account)}
            className={cx(
              pill.base,
              'inline-flex items-center gap-2 px-3.5 text-[0.8125rem] lg:min-h-9',
              selected === account.email
                ? 'border-role-strong bg-role-soft text-role-text'
                : 'border-border bg-surface text-text-secondary can-hover:border-border-strong',
            )}
          >
            {account.label}{' '}
            <span className="text-text-muted text-xs font-medium">
              {plural(account.roles.length, 'perfil', 'perfis')}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
