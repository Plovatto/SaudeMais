import { BookingPage } from '@components/booking-form/BookingPage';
import { describeExam } from './booking-text';
import type { ExamBooking } from './exam-api';
import { ExamForm } from './ExamForm';

export function BookExamPage() {
  return (
    <BookingPage<ExamBooking>
      title="Agendar exame"
      subtitle="Preencha os dados para o seu exame"
      bookedTitle="Exame agendado!"
      describe={describeExam}
    >
      {(onBooked) => <ExamForm onBooked={onBooked} />}
    </BookingPage>
  );
}
