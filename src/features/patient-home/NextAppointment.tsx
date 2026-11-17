import type { UseQueryResult } from '@tanstack/react-query';
import { LuCalendar } from 'react-icons/lu';
import { Link } from 'react-router';
import { bookingStatus, bookingTitle } from '@components/bookings/booking-display';
import { DateTile } from '@components/bookings/DateTile';
import { Chevron, IconSlot, QueryError, Skeleton, StatusChip } from '@components/ui';
import { overline } from '@components/ui/styles';
import { bookingUrl } from '@constants/areas';
import type { PatientBooking } from '@lib/api/models';
import { cx } from '@lib/cx';
import { formatLongDay, formatShortDay, formatTime } from '@lib/date';

const cardClass =
  'rounded-card border-border bg-surface flex flex-col gap-3.5 border px-4 pt-[18px] pb-5 lg:px-5';

const waitingText = (count: number) =>
  count === 0
    ? 'Agende uma consulta ou um exame.'
    : `${count} ${count > 1 ? 'pedidos aguardam' : 'pedido aguarda'} a confirmação do médico.`;

export interface NextAppointmentProps {
  query: UseQueryResult<unknown>;
  next: PatientBooking | undefined;
  waiting: number;
}

export function NextAppointment({ query, next, waiting }: NextAppointmentProps) {
  if (query.isPending) return <Skeleton className="rounded-card h-[132px]" />;
  if (query.isError && !query.data)
    return <QueryError error={query.error} onRetry={() => void query.refetch()} />;
  if (!next) {
    return (
      <section aria-label="Próximo compromisso" className={cx(cardClass, 'shadow-card')}>
        <p className={overline}>Próximo compromisso</p>
        <div className="flex items-center gap-3.5 lg:gap-[18px]">
          <IconSlot className="bg-surface-strong text-text-secondary size-14 justify-center rounded-[14px] text-[22px]">
            <LuCalendar />
          </IconSlot>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-text text-lg leading-tight font-[650] tracking-[-0.015em] lg:text-xl">
              Nenhum compromisso confirmado
            </p>
            <p className="text-text-secondary text-sm">{waitingText(waiting)}</p>
          </div>
        </div>
      </section>
    );
  }
  const status = bookingStatus(next, 'patient');
  const { title, kindLabel } = bookingTitle(next);
  const when = `${formatShortDay(next.startsAt)} · ${formatTime(next.startsAt)}`;
  return (
    <Link
      to={bookingUrl(next.id)}
      aria-label={`Próximo compromisso: ${formatLongDay(next.startsAt)}, ${formatTime(next.startsAt)}, ${title}, ${kindLabel}, ${status.label}. Ver detalhes`}
      className={cx(
        cardClass,
        'shadow-raised group can-hover:border-role-soft-strong transition-[border-color,box-shadow] duration-150',
      )}
    >
      <span className="flex items-center justify-between gap-3">
        <span className={overline}>Próximo compromisso</span>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
      </span>
      <span className="flex items-center gap-3.5 lg:gap-[18px]">
        <DateTile startsAt={next.startsAt} size="lg" className="motion-safe:animate-pop" />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-text text-lg leading-tight font-[650] tracking-[-0.015em] tabular-nums lg:text-xl">
            {when}
          </span>
          <span className="text-text-secondary truncate text-sm">
            {title} · {kindLabel}
          </span>
        </span>
        <Chevron />
      </span>
    </Link>
  );
}
