import { Button, Card } from '@components/ui';
import { DEMO_PATIENT } from '@constants/demo-accounts';

export function TestAccounts({ onFill }: { onFill: (account: typeof DEMO_PATIENT) => void }) {
  return (
    <section aria-labelledby="test-accounts-title">
      <Card className="flex flex-col gap-3 px-6 py-5 sm:px-10">
        <h2 id="test-accounts-title" className="text-text text-base font-semibold">
          Contas de teste
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-text text-sm font-semibold">Paciente</h3>
            <dl className="text-text-secondary grid grid-cols-[auto_1fr] gap-x-2 text-sm">
              <dt>E-mail:</dt>
              <dd className="break-all">{DEMO_PATIENT.email}</dd>
              <dt>Senha:</dt>
              <dd>{DEMO_PATIENT.password}</dd>
            </dl>
          </div>
          <Button
            variant="secondary"
            aria-label="Preencher com a conta de paciente"
            onClick={() => onFill(DEMO_PATIENT)}
          >
            Preencher
          </Button>
        </div>
      </Card>
    </section>
  );
}
