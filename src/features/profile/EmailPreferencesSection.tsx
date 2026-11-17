import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment } from 'react';
import { QueryError, SectionCard, Skeleton, Switch, useToast } from '@components/ui';
import { overline } from '@components/ui/styles';
import { areas } from '@constants/areas';
import { isProtectedAccount } from '@lib/auth/protected-account';
import { cx } from '@lib/cx';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { queryKeys } from '@lib/query-keys';
import { listEmailPreferences, updateEmailPreference, type EmailPreference } from './profile-api';

const topics: Record<EmailPreference['topic'], { title: string; description: string }> = {
  booking_reminder: {
    title: 'Lembrete por e-mail',
    description: 'Enviado 24 horas antes de consultas e exames.',
  },
  booking_decision: {
    title: 'Confirmações',
    description: 'Quando um pedido for confirmado, cancelado ou não puder ser confirmado.',
  },
  exam_result: { title: 'Resultado disponível', description: 'Quando um exame for liberado.' },
  appointment_request: {
    title: 'Novos pedidos',
    description: 'Quando um paciente pedir ou reagendar uma consulta.',
  },
  appointment_cancellation: { title: 'Cancelamentos', description: 'Quando uma consulta for cancelada.' },
  user_registration: { title: 'Novos cadastros', description: 'Quando uma conta nova for criada.' },
};

function PreferenceRow({
  preference,
  disabled,
  onChange,
}: {
  preference: EmailPreference;
  disabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  const { title, description } = topics[preference.topic];
  return (
    <li className="border-border flex items-center gap-4 py-3.5 not-first:border-t">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-text text-sm font-semibold">{title}</p>
        <p className="text-text-secondary text-[0.8125rem]">{description}</p>
      </div>
      <Switch
        checked={preference.enabled}
        onCheckedChange={onChange}
        label={title}
        labelHidden
        disabled={disabled}
      />
    </li>
  );
}

export function EmailPreferencesSection({
  locked,
  onProtected,
}: {
  locked: boolean;
  onProtected: () => void;
}) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const query = useQuery({
    queryKey: queryKeys.emailPreferences,
    queryFn: ({ signal }) => listEmailPreferences(signal),
  });
  const mutation = useMutation({
    mutationFn: updateEmailPreference,
    onMutate: (changed) => {
      const previous = queryClient.getQueryData<EmailPreference[]>(queryKeys.emailPreferences);
      queryClient.setQueryData<EmailPreference[]>(queryKeys.emailPreferences, (items) =>
        items?.map((item) => (item.topic === changed.topic ? changed : item)),
      );
      return previous;
    },
    onSuccess: (items) => queryClient.setQueryData(queryKeys.emailPreferences, items),
    onError: (error, _changed, previous) => {
      queryClient.setQueryData(queryKeys.emailPreferences, previous);
      if (isProtectedAccount(error)) onProtected();
      else show({ message: errorMessage(error), tone: 'danger' });
    },
  });
  const items = query.data;
  const roles = [...new Set(items?.map((item) => item.role))];

  return (
    <SectionCard title="Avisos por e-mail" className="lg:flex-1" aria-busy={query.isPending}>
      {query.isError && !items ? (
        <QueryError error={query.error} onRetry={() => void query.refetch()} />
      ) : items ? (
        <div className="-my-2 flex flex-col">
          {roles.map((role) => (
            <Fragment key={role}>
              {roles.length > 1 && <p className={cx(overline, 'pt-3.5')}>{areas[role].label}</p>}
              <ul className="flex flex-col">
                {items
                  .filter((item) => item.role === role)
                  .map((item) => (
                    <PreferenceRow
                      key={item.topic}
                      preference={item}
                      disabled={locked}
                      onChange={(enabled) => mutation.mutate({ ...item, enabled })}
                    />
                  ))}
              </ul>
            </Fragment>
          ))}
        </div>
      ) : (
        <Skeleton className="h-32" />
      )}
    </SectionCard>
  );
}
