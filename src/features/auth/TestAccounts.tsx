import { Button, Card } from '@components/ui';
import { DEMO_PATIENT } from './demo-accounts';

export function TestAccounts({ onFill }: { onFill: (account: typeof DEMO_PATIENT) => void }) {
  return (
    <Card className="flex flex-col gap-3 px-6 py-5 sm:px-10" aria-labelledby="test-accounts-title">
      <h2 id="test-accounts-title" className="text-text text-base font-semibold">
        Contas de teste
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <dl className="text-text-secondary grid grid-cols-[auto_1fr] gap-x-2 text-sm">
          <dt className="text-text col-span-2 font-semibold">Paciente</dt>
          <dt>E-mail:</dt>
          <dd className="break-all">{DEMO_PATIENT.email}</dd>
          <dt>Senha:</dt>
          <dd>{DEMO_PATIENT.password}</dd>
        </dl>
        <Button
          variant="secondary"
          aria-label="Preencher com a conta de paciente"
          onClick={() => onFill(DEMO_PATIENT)}
        >
          Preencher
        </Button>
      </div>
    </Card>
  );
}
