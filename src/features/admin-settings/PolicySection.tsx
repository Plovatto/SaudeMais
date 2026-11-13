import { useQuery } from '@tanstack/react-query';
import { Button, Card, FormAlert, Input, Skeleton } from '@components/ui';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { queryKeys } from '@lib/query-keys';
import { FormShell } from './FormShell';
import { policyApi, type Policy } from './settings-api';
import { policySchema, type PolicyValues } from './settings-schemas';
import { SettingsSection } from './SettingsSection';
import { useCatalogForm } from './useCatalogForm';

const FIELDS: { name: keyof PolicyValues; label: string; hint: string }[] = [
  {
    name: 'appointmentLateWindowHours',
    label: 'Janela de cancelamento de consultas (horas)',
    hint: 'Abaixo dessa antecedência, cancelar é tardio e reagendar fica bloqueado. De 0 a 168.',
  },
  {
    name: 'examLateWindowHours',
    label: 'Janela de cancelamento de exames (horas)',
    hint: 'O mesmo, para exames. De 0 a 168.',
  },
  { name: 'maxReschedules', label: 'Reagendamentos por agendamento', hint: 'De 0 a 10.' },
  { name: 'bookingHorizonDays', label: 'Agendar até (dias à frente)', hint: 'De 1 a 365.' },
  {
    name: 'minLeadMinutes',
    label: 'Antecedência mínima para agendar (minutos)',
    hint: 'De 0 a 10080 (7 dias).',
  },
];

function PolicyForm({ policy }: { policy: Policy }) {
  const { updatedAt: _updatedAt, ...values } = policy;
  const form = useCatalogForm({
    schema: policySchema,
    defaultValues: values,
    fields: FIELDS.map((field) => field.name),
    save: (body) => policyApi.update(body),
    invalidate: queryKeys.catalog.policy,
    success: 'Política atualizada.',
  });
  const { errors, isSubmitting } = form.formState;
  return (
    <Card>
      <FormShell
        label="Política de agendamento"
        onSubmit={form.onSubmit}
        alert={form.alert}
        submitting={isSubmitting}
      >
        {FIELDS.map(({ name, label, hint }) => (
          <Input
            key={name}
            label={label}
            hint={hint}
            type="number"
            inputMode="numeric"
            error={errors[name]?.message}
            {...form.register(name, { valueAsNumber: true })}
          />
        ))}
      </FormShell>
    </Card>
  );
}

export function PolicySection() {
  const policy = useQuery({
    queryKey: queryKeys.catalog.policy,
    queryFn: ({ signal }) => policyApi.get(signal),
  });
  return (
    <SettingsSection
      title="Política de agendamento"
      description="Regras de cancelamento, reagendamento e antecedência. As mudanças valem para os próximos agendamentos."
    >
      {policy.isPending && <Skeleton className="h-96" />}
      {policy.isError && (
        <div className="flex flex-col items-start gap-3">
          <FormAlert>{errorMessage(policy.error)}</FormAlert>
          <Button variant="secondary" onClick={() => void policy.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}
      {policy.data && <PolicyForm key={policy.data.updatedAt} policy={policy.data} />}
    </SettingsSection>
  );
}
