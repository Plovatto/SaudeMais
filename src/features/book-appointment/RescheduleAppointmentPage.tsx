import { LuStethoscope } from 'react-icons/lu';
import { ReschedulePage } from '@components/booking-form/ReschedulePage';
import { visitTypeLabels } from '@constants/visit-types';
import { queryKeys } from '@lib/query-keys';
import { bookingApi, type Appointment } from './booking-api';

export function RescheduleAppointmentPage() {
  return (
    <ReschedulePage<Appointment>
      kind="appointment"
      load={bookingApi.detail}
      actionsOf={({ patientActions }) => patientActions}
      formLabel="Novo horário da consulta"
      notice={({ status }) =>
        status === 'pending'
          ? 'A consulta fica aguardando confirmação do médico.'
          : 'A consulta volta a aguardar confirmação do médico.'
      }
      confirmNote="O médico precisa confirmar o novo horário."
      bookedMessage="Pedido de novo horário enviado ao médico."
      emptyNote="Este médico não tem outras vagas livres nas próximas semanas."
      details={({ doctor, specialty, visitType, unit }) => ({
        icon: <LuStethoscope />,
        kindLabel: 'Consulta',
        title: doctor.fullName,
        subtitle: `${specialty.name} · ${visitTypeLabels[visitType]}`,
        unitName: unit.name,
        unitAddress: unit.address,
        changeHint: 'Para trocar o médico ou o tipo de consulta, cancele e faça um novo agendamento.',
        calendarHint: `Agenda de ${doctor.fullName}`,
      })}
      availability={({ id, doctor }) => ({
        queryKey: queryKeys.booking.availability(doctor.id, id),
        load: (signal, page) => bookingApi.availability(doctor.id, page, signal, id),
      })}
      reschedule={bookingApi.reschedule}
    />
  );
}
