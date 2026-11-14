import { useId, useState, type ReactNode } from 'react';
import { LuChevronDown, LuCircleX, LuMapPin, LuPhone, LuTriangleAlert } from 'react-icons/lu';
import { bookingTitle } from '@components/bookings/booking-display';
import { BookingHeadline } from '@components/bookings/BookingHeadline';
import { Button, Card, FormAlert, IconSlot, StatusChip } from '@components/ui';
import type { PatientBooking } from '@lib/api/models';
import { cx } from '@lib/cx';
import { formatDateTime } from '@lib/date';
import { formatPhone } from '@lib/phone';
import { blockedNotes, cancelledBy } from './booking-text';

export interface BookingCardProps {
  booking: PatientBooking;
  onCancel: (booking: PatientBooking) => void;
}

function Detail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <IconSlot className="text-text-secondary mt-0.5">{icon}</IconSlot>
      <dt className="sr-only">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function Note({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-surface-muted rounded-field flex flex-col gap-1 px-3 py-2.5">
      <dt className="text-text-secondary text-xs font-semibold">{label}</dt>
      <dd className="text-text break-words">{children}</dd>
    </div>
  );
}

export function BookingCard({ booking, onCancel }: BookingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const { title } = bookingTitle(booking);
  const { unit, notes, publicCode, cancellation, actions } = booking;
  const blocked = actions.cancelBlockedReason && blockedNotes[actions.cancelBlockedReason];

  return (
    <Card variant="outlined" className="flex flex-col gap-4">
      <h2>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((open) => !open)}
          className="rounded-field -m-1 flex w-[calc(100%+0.5rem)] items-start gap-3 p-1 text-start"
        >
          <BookingHeadline booking={booking} />
          <IconSlot
            className={cx(
              'text-text-secondary mt-0.5 text-lg transition-transform',
              expanded && 'rotate-180',
            )}
          >
            <LuChevronDown />
          </IconSlot>
        </button>
      </h2>
      <div id={detailsId} hidden={!expanded} className="flex flex-col gap-4">
        <dl className="text-text-secondary flex flex-col gap-3 text-sm">
          <Detail icon={<LuMapPin />} label="Local">
            <span className="text-text block font-medium">{unit.name}</span>
            {unit.address}
          </Detail>
          <Detail icon={<LuPhone />} label="Telefone">
            <a href={`tel:${unit.phone}`} className="text-role-text font-medium underline underline-offset-2">
              {formatPhone(unit.phone)}
            </a>
          </Detail>
          {publicCode && <Note label="Código do exame">{publicCode}</Note>}
          {notes && <Note label="Observações">{notes}</Note>}
          {cancellation && (
            <Note
              label={`${cancelledBy[cancellation.byRole]} em ${formatDateTime(cancellation.cancelledAt)}`}
            >
              {cancellation.reason ? `Motivo: ${cancellation.reason}` : 'Nenhum motivo informado.'}
              {cancellation.late && (
                <StatusChip tone="warning" icon={<LuTriangleAlert />} className="mt-2 flex w-fit">
                  Cancelamento tardio
                </StatusChip>
              )}
            </Note>
          )}
        </dl>
        {blocked && (
          <FormAlert tone="warning" role="note">
            {blocked}
          </FormAlert>
        )}
        {actions.canCancel && (
          <Button variant="danger-outline" icon={<LuCircleX />} onClick={() => onCancel(booking)}>
            Cancelar
            <span className="sr-only">
              : {title}, {formatDateTime(booking.startsAt)}
            </span>
          </Button>
        )}
      </div>
    </Card>
  );
}
