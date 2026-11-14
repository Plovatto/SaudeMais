import { useId, useState, type ReactNode } from 'react';
import {
  LuCalendar,
  LuChevronDown,
  LuCircleX,
  LuMapPin,
  LuPhone,
  LuStethoscope,
  LuSyringe,
  LuTriangleAlert,
} from 'react-icons/lu';
import { Button, Card, FormAlert, IconSlot, StatusChip } from '@components/ui';
import { cx } from '@lib/cx';
import { formatDateTime } from '@lib/date';
import { formatPhone } from '@lib/phone';
import { blockedNotes, bookingStatus, bookingTitle, cancelledBy } from './booking-text';
import type { PatientBooking } from './bookings-api';

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
  const status = bookingStatus(booking);
  const { title, subtitle } = bookingTitle(booking);
  const { unit, notes, publicCode, cancellation, actions } = booking;
  const blocked = actions.cancelBlockedReason && blockedNotes[actions.cancelBlockedReason];

  return (
    <Card variant="outlined" className="flex flex-col gap-4">
      <h3>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((open) => !open)}
          className="rounded-field -m-1 flex w-[calc(100%+0.5rem)] items-start gap-3 p-1 text-start"
        >
          <span data-role="doctor" className="contents">
            <IconSlot badge="strong" className="rounded-tile size-12 text-2xl">
              {booking.kind === 'exam' ? <LuSyringe /> : <LuStethoscope />}
            </IconSlot>
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-text font-semibold">{title}</span>
            <span className="text-text-secondary text-sm">{subtitle}</span>
            <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="text-text-secondary flex items-center gap-1.5 text-sm whitespace-nowrap">
                <IconSlot>
                  <LuCalendar />
                </IconSlot>
                <time dateTime={booking.startsAt}>{formatDateTime(booking.startsAt)}</time>
              </span>
              <StatusChip tone={status.tone} icon={status.icon}>
                {status.label}
              </StatusChip>
            </span>
          </span>
          <IconSlot
            className={cx(
              'text-text-secondary mt-0.5 text-lg transition-transform',
              expanded && 'rotate-180',
            )}
          >
            <LuChevronDown />
          </IconSlot>
        </button>
      </h3>
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
