import { LuFlaskConical } from 'react-icons/lu';
import { ReschedulePage } from '@components/booking-form/ReschedulePage';
import { queryKeys } from '@lib/query-keys';
import { examApi, type ExamBooking } from './exam-api';
import { preparationText } from './preparation';

export function RescheduleExamPage() {
  return (
    <ReschedulePage<ExamBooking>
      kind="exam"
      load={examApi.detail}
      actionsOf={({ actions }) => actions}
      formLabel="Novo horário do exame"
      confirmNote="O novo horário já fica confirmado."
      bookedMessage="Exame reagendado."
      emptyNote="Este local não tem outras vagas livres para o exame nas próximas semanas."
      details={({ examType, unit }) => ({
        icon: <LuFlaskConical />,
        kindLabel: 'Exame',
        title: examType.name,
        subtitle: preparationText(examType.preparationNotes),
        unitName: unit.name,
        unitAddress: unit.address,
        changeHint: 'Para trocar o exame ou a unidade, cancele e faça um novo agendamento.',
        calendarHint: `Horários da ${unit.name}`,
      })}
      availability={({ id, examType, unit }) => ({
        queryKey: queryKeys.booking.examAvailability(unit.id, examType.id, id),
        load: (signal, page) => examApi.availability(unit.id, examType.id, page, signal, id),
      })}
      reschedule={examApi.reschedule}
    />
  );
}
