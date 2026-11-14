import { useQuery } from '@tanstack/react-query';
import { LuPlus, LuSyringe } from 'react-icons/lu';
import { PageTitle } from '@components/layout/PageTitle';
import { ButtonLink, IconSlot, Skeleton } from '@components/ui';
import { areas } from '@constants/areas';
import { queryKeys } from '@lib/query-keys';
import { HealthSummary } from './HealthSummary';
import { LastNotification } from './LastNotification';
import { fetchPatientHome } from './patient-home-api';
import { UpcomingBookings } from './UpcomingBookings';

const PATIENT = areas.patient.base;

const SHORTCUTS = [
  {
    to: `${PATIENT}/consultas/nova`,
    label: 'Agendar Consulta',
    icon: <LuPlus />,
    variant: 'primary',
    badge: 'bg-on-role/25',
  },
  {
    to: `${PATIENT}/exames/novo`,
    label: 'Agendar Exame',
    icon: <LuSyringe />,
    variant: 'secondary',
    badge: 'bg-role-soft',
  },
] as const;

export function PatientHomePage() {
  const query = useQuery({
    queryKey: queryKeys.patient.home,
    queryFn: ({ signal }) => fetchPatientHome(signal),
  });
  const notification = query.data?.lastNotification;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle className="sr-only">Início</PageTitle>
      {query.isPending && <Skeleton className="rounded-card h-24" />}
      {notification && <LastNotification notification={notification} />}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:[grid-template-areas:'actions_health''list_list']">
        <nav aria-label="Agendar" className="grid grid-cols-2 gap-4 lg:[grid-area:actions]">
          {SHORTCUTS.map(({ to, label, icon, variant, badge }) => (
            <ButtonLink
              key={to}
              to={to}
              variant={variant}
              size="lg"
              className="rounded-card h-full flex-col gap-3 px-3 py-5 text-center text-base"
            >
              <IconSlot className={`${badge} size-10 justify-center rounded-full text-2xl`}>{icon}</IconSlot>
              {label}
            </ButtonLink>
          ))}
        </nav>
        <UpcomingBookings query={query} className="lg:[grid-area:list]" />
        <HealthSummary className="lg:[grid-area:health]" />
      </div>
    </div>
  );
}
