import { LuSyringe } from 'react-icons/lu';
import { BookingPage } from '@components/booking-form/BookingPage';
import { formatDateTime } from '@lib/date';
import type { ExamBooking } from './exam-api';
import { ExamForm } from './ExamForm';

const describe = ({ examType, unit, startsAt, publicCode }: ExamBooking) =>
  `${examType.name} em ${unit.name}, ${formatDateTime(startsAt)}. Apresente o código ${publicCode} na unidade.`;

export function BookExamPage() {
  return (
    <BookingPage<ExamBooking>
      title="Agendar exame"
      subtitle="Preencha os dados para o seu exame"
      icon={<LuSyringe />}
      bookedTitle="Exame agendado!"
      describe={describe}
    >
      {(onBooked) => <ExamForm onBooked={onBooked} />}
    </BookingPage>
  );
}
