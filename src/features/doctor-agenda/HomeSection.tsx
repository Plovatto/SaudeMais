import { useId, useRef } from 'react';
import { LuCalendarX } from 'react-icons/lu';
import { ButtonLink, Card, EmptyState, Skeleton } from '@components/ui';
import { AppointmentList } from './AppointmentList';
import type { DoctorAppointment } from './doctor-api';

export interface HomeSectionProps {
  title: string;
  total: number | undefined;
  items: DoctorAppointment[] | undefined;
  empty: string;
  link: { to: string; label: string };
  className?: string;
}

export function HomeSection({ title, total, items, empty, link, className }: HomeSectionProps) {
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);

  return (
    <section aria-labelledby={titleId} className={className}>
      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id={titleId}
            ref={heading}
            tabIndex={-1}
            className="text-text text-lg font-semibold focus-visible:outline-none"
          >
            {title}
          </h2>
          {total !== undefined && (
            <span className="border-role text-role-text rounded-full border px-3 py-0.5 text-xs font-semibold tabular-nums">
              {total} no total
            </span>
          )}
        </div>
        {items === undefined && (
          <div aria-busy="true" className="grid gap-3 lg:grid-cols-2">
            {[0, 1].map((index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        )}
        {items?.length === 0 && <EmptyState icon={<LuCalendarX />} title={empty} className="py-6" />}
        {items && items.length > 0 && <AppointmentList items={items} fallbackFocus={heading} />}
        <ButtonLink to={link.to} fullWidth>
          {link.label}
        </ButtonLink>
      </Card>
    </section>
  );
}
