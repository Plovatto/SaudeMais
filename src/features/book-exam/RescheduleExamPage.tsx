import { ReschedulePage } from '@components/booking-form/ReschedulePage';
import { queryKeys } from '@lib/query-keys';
import { describeExam } from './booking-text';
import { examApi, type ExamBooking } from './exam-api';

export function RescheduleExamPage() {
  return (
    <ReschedulePage<ExamBooking>
      kind="exam"
      title="Reagendar exame"
      subtitle="Escolha a nova data e o novo horário. O exame continua confirmado."
      bookedTitle="Exame reagendado"
      describe={describeExam}
      load={examApi.detail}
      actionsOf={({ actions }) => actions}
      formLabel="Novo horário do exame"
      emptyNote="Este local não tem outras vagas livres para o exame nas próximas semanas."
      stacked
      locked={({ examType, unit }) => [
        {
          label: 'Tipo de exame',
          value: examType.name,
          hint: examType.preparationNotes ? `Preparo: ${examType.preparationNotes}` : undefined,
        },
        { label: 'Local do exame', value: unit.name, hint: unit.address },
      ]}
      availability={({ id, examType, unit }) => ({
        queryKey: queryKeys.booking.examAvailability(unit.id, examType.id, id),
        load: (signal) => examApi.availability(unit.id, examType.id, signal, id),
      })}
      reschedule={examApi.reschedule}
    />
  );
}
