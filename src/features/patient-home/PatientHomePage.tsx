import { useQuery } from '@tanstack/react-query';
import { LuFlaskConical, LuStethoscope } from 'react-icons/lu';
import { bookingStatus, bookingTitle } from '@components/bookings/booking-display';
import { NextCard } from '@components/bookings/NextCard';
import { PageTitle } from '@components/layout/PageTitle';
import { LastNotification } from '@components/notifications/LastNotification';
import { QuickActions, stagger, StatusChip, type QuickAction } from '@components/ui';
import { areas, bookingUrl } from '@constants/areas';
import type { PatientBooking } from '@lib/api/models';
import { cx } from '@lib/cx';
import { formatShortDay, formatTime } from '@lib/date';
import { plural } from '@lib/plural';
import { HealthSummary } from './HealthSummary';
import { LaterBookings } from './LaterBookings';
import { patientHomeQuery } from './patient-home-api';
import { RecentResults } from './RecentResults';

const PATIENT = areas.patient.base;

const ACTIONS: readonly QuickAction[] = [
  {
    to: `${PATIENT}/consultas/nova`,
    title: 'Agendar consulta',
    hint: 'Escolha o médico e o horário',
    icon: LuStethoscope,
    primary: true,
  },
  {
    to: `${PATIENT}/exames/novo`,
    title: 'Agendar exame',
    hint: 'Sangue, urina e imagem',
    icon: LuFlaskConical,
  },
];

const waitingText = (count: number) =>
  count === 0
    ? 'Agende uma consulta ou um exame.'
    : `${plural(count, 'pedido aguarda', 'pedidos aguardam')} a confirmação do médico.`;

function nextItem(booking: PatientBooking) {
  const status = bookingStatus(booking, 'patient');
  const { title, kindLabel } = bookingTitle(booking);
  return {
    to: bookingUrl(booking.id),
    startsAt: booking.startsAt,
    when: `${formatShortDay(booking.startsAt)} · ${formatTime(booking.startsAt)}`,
    detail: `${title} · ${kindLabel}`,
    tag: <StatusChip tone={status.tone}>{status.label}</StatusChip>,
  };
}

export function PatientHomePage() {
  const query = useQuery(patientHomeQuery);
  const upcoming = query.data?.upcoming ?? [];
  const next = upcoming.find((booking) => booking.status === 'confirmed');
  const later = upcoming.filter((booking) => booking !== next);
  const notification = query.data?.lastNotification;

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <PageTitle className="sr-only">Início</PageTitle>
      {notification && <LastNotification notification={notification} role="patient" />}
      <div className="@container">
        <div className="grid grid-cols-1 items-start gap-4 lg:gap-5 @min-[880px]:grid-cols-[minmax(0,1fr)_360px] @min-[880px]:items-stretch">
          <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
            <div className={stagger(0)}>
              <NextCard
                label="Próximo compromisso"
                query={query}
                next={next && nextItem(next)}
                empty={{
                  title: 'Nenhum compromisso confirmado',
                  text: waitingText(upcoming.filter((booking) => booking.status === 'pending').length),
                }}
              />
            </div>
            <div className={stagger(1)}>
              <QuickActions label="Agendar" actions={ACTIONS} />
            </div>
            <div className={stagger(2)}>
              <LaterBookings items={query.data ? later : undefined} pending={query.isPending} />
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
            <div className={stagger(3)}>
              <HealthSummary metrics={query.data?.metrics} />
            </div>
            <div className={cx(stagger(4), 'flex flex-1 flex-col *:flex-1')}>
              <RecentResults />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
