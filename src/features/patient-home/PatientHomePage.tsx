import { useQuery } from '@tanstack/react-query';
import { PageTitle } from '@components/layout/PageTitle';
import { LastNotification } from '@components/notifications/LastNotification';
import { HealthSummary } from './HealthSummary';
import { LaterBookings } from './LaterBookings';
import { NextAppointment } from './NextAppointment';
import { patientHomeQuery } from './patient-home-api';
import { QuickActions } from './QuickActions';
import { RecentResults } from './RecentResults';

const STAGGER = [
  'motion-safe:animate-rise',
  'motion-safe:animate-rise motion-safe:[animation-delay:50ms]',
  'motion-safe:animate-rise motion-safe:[animation-delay:100ms]',
  'motion-safe:animate-rise motion-safe:[animation-delay:150ms]',
  'motion-safe:animate-rise motion-safe:[animation-delay:200ms]',
];

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
      <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1fr)_360px] lg:gap-5">
        <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
          <div className={STAGGER[0]}>
            <NextAppointment
              query={query}
              next={next}
              waiting={upcoming.filter((booking) => booking.status === 'pending').length}
            />
          </div>
          <div className={STAGGER[1]}>
            <QuickActions />
          </div>
          <div className={STAGGER[2]}>
            <LaterBookings items={later} pending={query.isPending} failed={query.isError} />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
          <div className={STAGGER[3]}>
            <HealthSummary metrics={query.data?.metrics} />
          </div>
          <div className={STAGGER[4]}>
            <RecentResults />
          </div>
        </div>
      </div>
    </div>
  );
}
