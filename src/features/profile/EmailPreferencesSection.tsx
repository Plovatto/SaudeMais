import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { Fragment } from 'react';
import { QueryError, SectionCard, SettingRow, Skeleton, Switch, useToast } from '@components/ui';
import { overline } from '@components/ui/styles';
import { areas } from '@constants/areas';
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

function setPreference(queryClient: QueryClient, changed: EmailPreference) {
  queryClient.setQueryData<EmailPreference[]>(queryKeys.emailPreferences, (items) =>
    items?.map((item) => (item.topic === changed.topic ? changed : item)),
  );
}

function PreferenceRow({
  preference,
  onChange,
}: {
  preference: EmailPreference;
  onChange: (enabled: boolean) => void;
}) {
  const { title, description } = topics[preference.topic];
  return (
    <SettingRow
      as="li"
      className="border-border gap-4 py-3.5 not-first:border-t"
      title={title}
      meta={description}
      trailing={<Switch checked={preference.enabled} onCheckedChange={onChange} label={title} labelHidden />}
    />
  );
}

export function EmailPreferencesSection() {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const query = useQuery({
    queryKey: queryKeys.emailPreferences,
    queryFn: ({ signal }) => listEmailPreferences(signal),
  });
  const mutation = useMutation({
    mutationKey: queryKeys.emailPreferences,
    mutationFn: updateEmailPreference,
    onMutate: async (changed) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.emailPreferences });
      const previous = queryClient
        .getQueryData<EmailPreference[]>(queryKeys.emailPreferences)
        ?.find((item) => item.topic === changed.topic);
      setPreference(queryClient, changed);
      return previous;
    },
    onError: (error, _changed, previous) => {
      if (previous) setPreference(queryClient, previous);
      show({ message: errorMessage(error), tone: 'danger' });
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: queryKeys.emailPreferences }) === 1)
        return queryClient.invalidateQueries({ queryKey: queryKeys.emailPreferences });
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
