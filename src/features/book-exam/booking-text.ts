import { formatDateTime } from '@lib/date';
import type { ExamBooking } from './exam-api';

export const describeExam = ({ examType, unit, startsAt, publicCode }: ExamBooking) =>
  `${examType.name} em ${unit.name}, ${formatDateTime(startsAt)}. Apresente o código ${publicCode} na unidade.`;
