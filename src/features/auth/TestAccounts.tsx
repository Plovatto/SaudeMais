import { Button, Card } from '@components/ui';
import { DEMO_ACCOUNTS, type DemoAccount } from '@constants/demo-accounts';

export function TestAccounts({ onFill }: { onFill: (account: DemoAccount) => void }) {
  return (
    <section aria-labelledby="test-accounts-title">
      <Card className="flex flex-col gap-3 px-6 py-5 sm:px-10">
        <h2 id="test-accounts-title" className="text-text text-base font-semibold">
          Contas de teste
        </h2>
        <ul className="divide-border flex flex-col divide-y">
          {DEMO_ACCOUNTS.map((account) => (
            <li
              key={account.email}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-text text-sm font-semibold">{account.label}</h3>
                <dl className="text-text-secondary grid grid-cols-[auto_1fr] gap-x-2 text-sm">
                  <dt>E-mail:</dt>
                  <dd className="break-all">{account.email}</dd>
                  <dt>Senha:</dt>
                  <dd>{account.password}</dd>
                </dl>
              </div>
              <Button
                variant="secondary"
                aria-label={`Preencher com a conta de ${account.label.toLowerCase()}`}
                onClick={() => onFill(account)}
              >
                Preencher
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
