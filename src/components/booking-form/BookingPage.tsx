import { useRef, useState, type ReactNode } from 'react';
import { LuCheck } from 'react-icons/lu';
import { PageHeader } from '@components/layout/PageHeader';
import { ButtonLink, Card, Dialog } from '@components/ui';
import { PATIENT_BOOKINGS_PATH } from '@constants/areas';

interface BookingPageProps<R> {
  title: string;
  subtitle: string;
  bookedTitle: string;
  describe: (booked: R) => string;
  children: (onBooked: (booked: R) => void) => ReactNode;
}

export function BookingPage<R>({ title, subtitle, bookedTitle, describe, children }: BookingPageProps<R>) {
  const [booked, setBooked] = useState<R | null>(null);
  const detailsLink = useRef<HTMLAnchorElement>(null);
  return (
    <div className="mx-auto w-full max-w-[520px]">
      <PageHeader title={title} subtitle={subtitle} />
      <Card className="px-5 py-8 sm:px-8">{children(setBooked)}</Card>
      <Dialog
        open={booked !== null}
        onClose={() => setBooked(null)}
        title={bookedTitle}
        description={booked && describe(booked)}
        icon={<LuCheck />}
        centered
        initialFocus={detailsLink}
      >
        <ButtonLink ref={detailsLink} to={PATIENT_BOOKINGS_PATH} className="min-w-48">
          Ver detalhes
        </ButtonLink>
      </Dialog>
    </div>
  );
}
