import { useBookedRedirect } from '@components/booking-form/useBookedRedirect';
import type { ExamBooking } from './exam-api';
import { ExamForm } from './ExamForm';

export function BookExamPage() {
  const onBooked = useBookedRedirect<ExamBooking>(
    ({ publicCode }) => `Exame agendado. Apresente o código ${publicCode} na unidade.`,
  );
  return <ExamForm onBooked={onBooked} />;
}
