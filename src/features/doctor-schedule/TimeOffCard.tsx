import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RefObject } from 'react';
import { DateTile } from '@components/bookings/DateTile';
import { CloseButton, ListPlaceholder, QueryError, SectionCard, SettingRow, useToast } from '@components/ui';
import { sectionPad } from '@components/ui/styles';
import { ApiError } from '@lib/api/api-error';
import { formatLongDay, middayOf } from '@lib/date';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { AddButton } from './AddButton';
import { timeOffApi, timeOffQuery, type ScheduleWarning, type TimeOff } from './schedule-api';
import { WarningAlert } from './WarningAlert';

interface TimeOffCardProps {
  warnings: readonly ScheduleWarning[];
  addRef: RefObject<HTMLButtonElement | null>;
  onAdd: () => void;
  onRemoved: () => void;
}

const describe = ({ date, reason }: TimeOff) => {
  const day = formatLongDay(middayOf(date));
  return { day, title: reason ?? 'Dia bloqueado', label: reason ?? day };
};

export function TimeOffCard({ warnings, addRef, onAdd, onRemoved }: TimeOffCardProps) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const list = useQuery(timeOffQuery);
  const refresh = () => queryClient.invalidateQueries({ queryKey: timeOffQuery.queryKey });
  const removal = useMutation({
    mutationFn: timeOffApi.remove,
    onSuccess: async () => {
      await refresh();
      onRemoved();
      addRef.current?.focus();
      show({ message: 'Bloqueio removido.', tone: 'success' });
    },
    onError: (error) => {
      show({ message: errorMessage(error), tone: 'danger' });
      if (error instanceof ApiError && error.code === 'NOT_FOUND') void refresh();
    },
  });

  return (
    <SectionCard title="Folgas e bloqueios" flush>
      <WarningAlert
        warnings={warnings}
        one="consulta já estava marcada nesta data"
        many="consultas já estavam marcadas nesta data"
        className={sectionPad}
      />
      {list.isError ? (
        <QueryError error={list.error} onRetry={() => void list.refetch()} padded />
      ) : list.data && list.data.length > 0 ? (
        <ul aria-label="Datas bloqueadas" className="divide-border divide-y">
          {list.data.map((item) => {
            const { day, title, label } = describe(item);
            return (
              <SettingRow
                key={item.date}
                as="li"
                className="gap-3.5 px-4 py-3 lg:px-5"
                leading={<DateTile startsAt={middayOf(item.date)} />}
                title={title}
                meta={day}
                trailing={
                  <CloseButton
                    label={`Remover bloqueio de ${label}`}
                    disabled={removal.isPending && removal.variables === item.date}
                    onClick={() => removal.mutate(item.date)}
                  />
                }
              />
            );
          })}
        </ul>
      ) : (
        <ListPlaceholder pending={list.isPending} message="Nenhuma data bloqueada." />
      )}
      <div className={sectionPad}>
        <AddButton ref={addRef} onClick={onAdd}>
          Bloquear uma data
        </AddButton>
      </div>
    </SectionCard>
  );
}
