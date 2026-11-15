import { LuSyringe } from 'react-icons/lu';
import { BookingPage } from '@components/booking-form/BookingPage';
import { describeExam, type ExamBooking } from './exam-api';
import { ExamForm } from './ExamForm';

export function BookExamPage() {
  return (
    <BookingPage<ExamBooking>
      title="Agendar exame"
      subtitle="Preencha os dados para o seu exame"
      icon={<LuSyringe />}
      bookedTitle="Exame agendado!"
      describe={describeExam}
    >
      {(onBooked) => <ExamForm onBooked={onBooked} />}
    </BookingPage>
  );
}
