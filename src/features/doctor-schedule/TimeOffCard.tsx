import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type RefObject } from 'react';
import { LuCalendarOff, LuPlus } from 'react-icons/lu';
import { DateTile } from '@components/bookings/DateTile';
import {
  Button,
  CloseButton,
  ConfirmDialog,
  EmptyState,
  ListSkeleton,
  QueryError,
  SectionCard,
  SettingRow,
  useToast,
} from '@components/ui';
import { sectionPad } from '@components/ui/styles';
import { ApiError } from '@lib/api/api-error';
import { formatLongDay, middayOf } from '@lib/date';
import { errorMessage } from '@lib/messages/errors.pt-BR';
import { timeOffApi, timeOffQuery, type ScheduleWarning, type TimeOff } from './schedule-api';
import { WarningAlert } from './WarningAlert';

interface TimeOffCardProps {
  warnings: readonly ScheduleWarning[];
  addRef: RefObject<HTMLButtonElement | null>;
  onAdd: () => void;
  onRemoved: (date: string) => void;
}

const removalMessages = {
  PAST_DATE: 'Esta data já passou e não pode mais ser desbloqueada.',
} as const;

const dayOf = (date: string) => formatLongDay(middayOf(date));

const isClientError = (error: unknown) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;

export function TimeOffCard({ warnings, addRef, onAdd, onRemoved }: TimeOffCardProps) {
  const queryClient = useQueryClient();
  const { show } = useToast();
  const list = useQuery(timeOffQuery);
  const [pending, setPending] = useState<TimeOff | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: timeOffQuery.queryKey });
  const removal = useMutation({
    mutationFn: timeOffApi.remove,
    onSuccess: async (_result, date) => {
      await refresh();
      onRemoved(date);
      show({ message: 'Bloqueio removido.', tone: 'success' });
    },
    onError: async (error) => {
      show({ message: errorMessage(error, removalMessages), tone: 'danger' });
      if (isClientError(error)) await refresh();
    },
    onSettled: () => setPending(null),
  });

  return (
    <SectionCard
      title="Folgas e bloqueios"
      description="Dias sem horários livres para os pacientes."
      flush
      className="lg:flex-[1_0_auto]"
      action={
        <Button
          ref={addRef}
          variant="secondary"
          size="sm"
          icon={<LuPlus />}
          aria-label="Bloquear uma data"
          onClick={onAdd}
        >
          Bloquear
        </Button>
      }
    >
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
            const day = dayOf(item.date);
            return (
              <SettingRow
                key={item.date}
                as="li"
                className="gap-3.5 px-4 py-3 lg:px-5"
                leading={<DateTile startsAt={middayOf(item.date)} />}
                title={day}
                meta={item.reason ?? 'Sem motivo informado'}
                trailing={
                  <CloseButton
                    label={`Remover bloqueio de ${day}${item.reason ? ` (${item.reason})` : ''}`}
                    onClick={() => setPending(item)}
                  />
                }
              />
            );
          })}
        </ul>
      ) : list.isPending ? (
        <ListSkeleton />
      ) : (
        <EmptyState
          icon={<LuCalendarOff />}
          title="Nenhuma data bloqueada"
          description="Bloqueie dias de férias, congressos ou feriados."
          className="py-8"
        />
      )}
      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending ? `Desbloquear ${dayOf(pending.date).toLowerCase()}?` : 'Desbloquear a data?'}
        description="Os pacientes voltam a ver os horários livres deste dia."
        confirmLabel="Desbloquear"
        loading={removal.isPending}
        fallbackFocus={addRef}
        onConfirm={() => pending && removal.mutate(pending.date)}
      />
    </SectionCard>
  );
}
