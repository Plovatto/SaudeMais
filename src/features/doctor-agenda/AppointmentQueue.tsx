import type { ReactNode, Ref } from 'react';
import { Avatar, CountBadge, RowText, SectionCard, SectionLink } from '@components/ui';
import type { DoctorAppointment } from '@lib/api/models';

export interface AppointmentQueueProps {
  title: string;
  total: number | undefined;
  items: DoctorAppointment[] | undefined;
  more: string;
  meta: (appointment: DoctorAppointment) => string;
  actions: (appointment: DoctorAppointment) => ReactNode;
  onView: (appointment: DoctorAppointment) => void;
  badge: string;
  placeholder: ReactNode;
  sectionRef?: Ref<HTMLElement>;
}

export function AppointmentQueue({
  title,
  total,
  items,
  more,
  meta,
  actions,
  onView,
  badge,
  placeholder,
  sectionRef,
}: AppointmentQueueProps) {
  return (
    <SectionCard
      ref={sectionRef}
      tabIndex={-1}
      title={title}
      flush
      aria-busy={items === undefined}
      action={
        total !== undefined &&
        total > 0 && (
          <>
            <CountBadge inline className={badge}>
              {total}
            </CountBadge>
            <span className="sr-only">{total} no total</span>
            {items && total > items.length && <SectionLink to={more}>Ver todos</SectionLink>}
          </>
        )
      }
    >
      {items?.length ? (
        <ul className="divide-border divide-y">
          {items.map((appointment) => (
            <li
              key={appointment.id}
              className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 px-4 py-3 max-[560px]:gap-y-[22px] max-[560px]:pt-[18px] max-[560px]:pb-5 lg:px-5 lg:py-3.5"
            >
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => onView(appointment)}
                className="group rounded-field flex min-h-11 min-w-0 flex-1 items-center gap-3.5 text-start max-[560px]:basis-full"
              >
                <Avatar name={appointment.patient.fullName} seed={appointment.patient.id} />
                <RowText
                  title={
                    <>
                      {appointment.patient.fullName}
                      <span className="sr-only">, ver detalhes</span>
                    </>
                  }
                  meta={meta(appointment)}
                  titleClassName="group-hover:text-role-text transition-colors duration-150"
                  metaClassName="tabular-nums"
                />
              </button>
              <div className="max-[560px]:*:rounded-tile flex shrink-0 gap-2 max-[560px]:grid max-[560px]:basis-full max-[560px]:auto-cols-fr max-[560px]:grid-flow-col max-[560px]:gap-2.5 max-[560px]:*:min-h-[46px] max-[560px]:*:w-full max-[560px]:*:text-[0.9375rem] max-lg:*:min-h-11 min-[561px]:*:min-w-28">
                {actions(appointment)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        placeholder
      )}
    </SectionCard>
  );
}
