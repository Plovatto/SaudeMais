import { LuCheck, LuMousePointerClick, LuUsers } from 'react-icons/lu';
import { areas } from '@constants/areas';
import { EXAMPLE_ACCOUNTS, type ExampleAccount } from '@constants/example-accounts';
import { cx } from '@lib/cx';

const roleList = new Intl.ListFormat('pt-BR', { type: 'conjunction' });

function profilesOf({ roles }: ExampleAccount): string {
  const names = roles.map((role, index) =>
    index === 0 ? areas[role].label : areas[role].label.toLowerCase(),
  );
  return roleList.format(names);
}

export interface ExampleAccountsProps {
  selected: string;
  onFill: (account: ExampleAccount) => void;
}

export function ExampleAccounts({ selected, onFill }: ExampleAccountsProps) {
  return (
    <section aria-labelledby="example-accounts-title" className="flex flex-col gap-4">
      <div className="text-text-muted flex items-center gap-3">
        <span aria-hidden className="bg-border h-px flex-1" />
        <h2 id="example-accounts-title" className="text-xs font-medium">
          Contas de exemplo
        </h2>
        <span aria-hidden className="bg-border h-px flex-1" />
      </div>
      <p id="example-accounts-hint" className="sr-only">
        Preenche o e-mail e a senha da conta.
      </p>
      <div className="flex flex-col gap-2.5">
        {EXAMPLE_ACCOUNTS.map((account) => {
          const active = selected === account.email;
          return (
            <button
              key={account.email}
              type="button"
              aria-describedby="example-accounts-hint"
              aria-pressed={active}
              onClick={() => onFill(account)}
              className={cx(
                'group rounded-tile shadow-card pressable:translate-y-px flex w-full items-center gap-3.5 border p-3.5 text-start transition-[background-color,border-color,box-shadow,translate] duration-200',
                active
                  ? 'border-role-strong bg-role-soft'
                  : 'border-border bg-surface-muted can-hover:border-role-strong can-hover:bg-surface can-hover:shadow-raised',
              )}
            >
              <span
                aria-hidden
                className={cx(
                  'grid size-11 shrink-0 place-items-center rounded-[12px] text-xl transition-colors duration-200',
                  active ? 'bg-role-strong text-on-role' : 'bg-role-soft text-role-text',
                )}
              >
                {active ? <LuCheck /> : <LuUsers />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-text text-[0.9375rem] leading-tight font-semibold">
                  {account.label}
                </span>
                <span className="text-text-secondary text-[0.8125rem] leading-snug">
                  {profilesOf(account)}
                </span>
              </span>
              <span
                aria-hidden
                className={cx(
                  'hidden shrink-0 items-center gap-1.5 text-xs font-semibold sm:inline-flex',
                  active ? 'text-role-text' : 'text-text-muted group-hover:text-role-text',
                )}
              >
                {active ? (
                  'Preenchido'
                ) : (
                  <>
                    <LuMousePointerClick className="text-base" />
                    Usar
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
