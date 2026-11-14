import { useRef } from 'react';
import { LuCalendarX } from 'react-icons/lu';
import { ButtonLink, EmptyState, SectionCard, Skeleton } from '@components/ui';
import type { DoctorAppointment } from '@lib/api/models';
import { AppointmentList } from './AppointmentList';

export interface HomeSectionProps {
  title: string;
  total: number | undefined;
  items: DoctorAppointment[] | undefined;
  empty: string;
  link: { to: string; label: string };
  className?: string;
}

export function HomeSection({ title, total, items, empty, link, className }: HomeSectionProps) {
  const more = useRef<HTMLAnchorElement>(null);

  return (
    <SectionCard
      title={title}
      aria-busy={items === undefined}
      className={className}
      action={
        total !== undefined && (
          <span className="border-role text-role-text rounded-full border px-3 py-0.5 text-xs font-semibold tabular-nums">
            {total} no total
          </span>
        )
      }
    >
      {items === undefined && (
        <div className="flex flex-col gap-3">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      )}
      {items?.length === 0 && <EmptyState icon={<LuCalendarX />} title={empty} className="py-6" />}
      {items && items.length > 0 && <AppointmentList items={items} fallbackFocus={more} />}
      <ButtonLink ref={more} to={link.to} fullWidth>
        {link.label}
      </ButtonLink>
    </SectionCard>
  );
}
