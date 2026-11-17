import { ReschedulePage } from '@components/booking-form/ReschedulePage';
import { visitTypeLabels } from '@constants/visit-types';
import { queryKeys } from '@lib/query-keys';
import { bookingApi, type Appointment } from './booking-api';
import { describeAppointment } from './booking-text';

export function RescheduleAppointmentPage() {
  return (
    <ReschedulePage<Appointment>
      kind="appointment"
      title="Reagendar consulta"
      subtitle="Escolha a nova data e o novo horário"
      bookedTitle="Consulta reagendada"
      describe={describeAppointment}
      load={bookingApi.detail}
      actionsOf={({ patientActions }) => patientActions}
      formLabel="Novo horário da consulta"
      notice={({ status }) =>
        status === 'pending'
          ? 'A consulta fica aguardando confirmação do médico.'
          : 'A consulta volta a aguardar confirmação do médico.'
      }
      emptyNote="Este médico não tem outras vagas livres nas próximas semanas."
      locked={({ doctor, specialty, visitType, unit }) => [
        { label: 'Médico', value: doctor.fullName, hint: `${unit.name} · ${unit.address}` },
        { label: 'Especialidade', value: specialty.name },
        { label: 'Tipo de consulta', value: visitTypeLabels[visitType] },
      ]}
      availability={({ id, doctor }) => ({
        queryKey: queryKeys.booking.availability(doctor.id, id),
        load: (signal) => bookingApi.availability(doctor.id, signal, id),
      })}
      reschedule={bookingApi.reschedule}
    />
  );
}
