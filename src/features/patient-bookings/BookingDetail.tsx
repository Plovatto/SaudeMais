import { useId } from 'react';
import { LuCalendar, LuClock, LuFileText, LuHash, LuMapPin, LuPhone } from 'react-icons/lu';
import { CancellationNote, PhoneLink } from '@components/bookings/BookingDetails';
import { bookingStatus, bookingTitle, hasStarted, isMuted } from '@components/bookings/booking-display';
import { DateTile } from '@components/bookings/DateTile';
import { rescheduleBlockedNotes, reschedulesLeftText } from '@components/bookings/reschedule-text';
import {
  Button,
  ButtonLink,
  CloseButton,
  FormAlert,
  InfoList,
  SheetMore,
  StatusChip,
  type InfoItem,
} from '@components/ui';
import { footerBar, headerBar, overline } from '@components/ui/styles';
import { areas, examResultUrl } from '@constants/areas';
import { cx } from '@lib/cx';
import type { PatientBooking } from '@lib/api/models';
import { formatDuration, formatLongDay, formatTime } from '@lib/date';
import { blockedNotes } from './booking-text';

const rescheduleUrl = ({ kind, id }: PatientBooking) =>
  `${areas.patient.base}/${kind === 'exam' ? 'exames' : 'consultas'}/${id}/reagendar`;

function tipsFor(booking: PatientBooking): { title: string; items: string[] } {
  if (!hasStarted(booking.startsAt) && (booking.status === 'pending' || booking.status === 'confirmed')) {
    return {
      title: 'Antes de ir',
      items: [
        'Chegue 15 minutos antes do horário.',
        `Leve um documento com foto${booking.kind === 'exam' ? ' e o pedido médico' : ''}.`,
        'Se não puder ir, cancele ou reagende com antecedência.',
      ],
    };
  }
  if (booking.hasResult) {
    return {
      title: 'Sobre o resultado',
      items: [
        'O resultado já pode ser consultado.',
        'Baixe o laudo em PDF para levar à próxima consulta.',
        'Converse com seu médico sobre os valores fora da referência.',
      ],
    };
  }
  if (booking.status === 'completed' || booking.status === 'confirmed') {
    return { title: 'Sobre este agendamento', items: ['Este atendimento já aconteceu.'] };
  }
  return {
    title: 'Sobre este agendamento',
    items: ['O horário foi liberado para outras pessoas.', 'Você pode agendar de novo quando quiser.'],
  };
}

function detailItems(booking: PatientBooking): InfoItem[] {
  const { unit, publicCode, notes, startsAt, endsAt } = booking;
  const items: InfoItem[] = [
    {
      key: 'when',
      icon: <LuClock />,
      label: 'Quando',
      boxed: false,
      value: formatLongDay(startsAt),
      hint: (
        <span className="tabular-nums">{`${formatTime(startsAt)} · ${formatDuration(startsAt, endsAt)}`}</span>
      ),
    },
    {
      key: 'unit',
      icon: <LuMapPin />,
      label: 'Onde',
      boxed: false,
      value: unit.name,
      hint: unit.address,
    },
    {
      key: 'phone',
      icon: <LuPhone />,
      label: 'Telefone da unidade',
      boxed: false,
      value: <PhoneLink phone={unit.phone} />,
    },
  ];
  if (publicCode) {
    items.push({
      key: 'code',
      icon: <LuHash />,
      label: 'Código do exame',
      boxed: false,
      value: <span className="tabular-nums">{publicCode}</span>,
      hint: 'Apresente este código na unidade.',
    });
  }
  if (notes) {
    items.push({
      key: 'notes',
      icon: <LuFileText />,
      label: 'Observações',
      boxed: false,
      value: <span className="font-normal whitespace-pre-line">{notes}</span>,
    });
  }
  return items;
}

export interface BookingDetailProps {
  booking: PatientBooking;
  titleId: string;
  onCancel: (booking: PatientBooking) => void;
  onClose?: () => void;
  tips?: boolean;
}

const footerButton = 'h-[46px] flex-1 basis-32 rounded-[12px] text-[0.9375rem]';

export function BookingDetail({ booking, titleId, onCancel, onClose, tips = false }: BookingDetailProps) {
  const leftId = useId();
  const tipsId = useId();
  const status = bookingStatus(booking, 'patient');
  const { title, kindLabel } = bookingTitle(booking);
  const [lead, detail] =
    booking.kind === 'exam' ? ['Exame'] : [booking.specialty?.name ?? 'Consulta', kindLabel];
  const { actions, cancellation } = booking;
  const muted = isMuted(booking);
  const blocked = [
    actions.cancelBlockedReason && blockedNotes[actions.cancelBlockedReason],
    actions.rescheduleBlockedReason && rescheduleBlockedNotes[actions.rescheduleBlockedReason],
  ].filter((note): note is string => Boolean(note));

  return (
    <article aria-labelledby={titleId} className="flex flex-col">
      <header className={cx(headerBar, 'py-3.5')}>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
        <span className="flex-1" />
        {onClose && <CloseButton onClick={onClose} />}
      </header>
      <div className="flex flex-col gap-[18px] px-4 pb-5 lg:px-5">
        <div className="border-border flex items-center gap-4 border-b pb-[18px]">
          <DateTile startsAt={booking.startsAt} size="lg" muted={muted} />
          <div className="flex min-w-0 flex-col">
            <h2
              id={titleId}
              className="text-text text-xl leading-tight font-bold tracking-[-0.02em] text-balance break-words"
            >
              {title}
            </h2>
            <p className="text-text-secondary mt-1.5 text-sm">{lead}</p>
            {detail && <p className="text-text-muted text-[0.8125rem]">{detail}</p>}
          </div>
        </div>
        <InfoList items={detailItems(booking)} />
        {cancellation && (
          <dl>
            <CancellationNote cancellation={cancellation} viewer="patient" />
          </dl>
        )}
        {blocked.map((note) => (
          <FormAlert key={note} tone="warning" role="note">
            {note}
          </FormAlert>
        ))}
        {tips && <Tips id={tipsId} {...tipsFor(booking)} />}
      </div>
      {(actions.canCancel || actions.canReschedule || booking.hasResult) && (
        <footer className={cx(footerBar, 'flex flex-wrap gap-x-2.5 gap-y-2 px-4 pt-[22px] pb-4 lg:px-5')}>
          {actions.canCancel && (
            <Button variant="danger-soft-outline" onClick={() => onCancel(booking)} className={footerButton}>
              Cancelar
            </Button>
          )}
          {actions.canReschedule && (
            <ButtonLink to={rescheduleUrl(booking)} aria-describedby={leftId} className={footerButton}>
              <LuCalendar aria-hidden />
              Reagendar
            </ButtonLink>
          )}
          {booking.hasResult && (
            <ButtonLink to={examResultUrl(booking.id)} className={footerButton}>
              <LuFileText aria-hidden />
              Ver resultado
            </ButtonLink>
          )}
          {actions.canReschedule && (
            <p id={leftId} className="text-text-muted basis-full text-center text-xs">
              {reschedulesLeftText(actions.reschedulesLeft)}
            </p>
          )}
        </footer>
      )}
    </article>
  );
}

function Tips({ id, title, items }: { id: string; title: string; items: string[] }) {
  return (
    <SheetMore className="border-border flex flex-col gap-3 border-t pt-5">
      <p id={id} className={overline}>
        {title}
      </p>
      <ul aria-labelledby={id} className="text-text-secondary flex flex-col gap-3 text-sm leading-[1.45]">
        {items.map((tip) => (
          <li
            key={tip}
            className="before:bg-role flex gap-3 before:mt-2 before:size-1.5 before:shrink-0 before:rounded-full"
          >
            {tip}
          </li>
        ))}
      </ul>
    </SheetMore>
  );
}
