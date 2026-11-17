import { formatDate, formatSince, todayInSaoPaulo } from '@lib/date';
import { formatPhone } from '@lib/phone';

export function ageOf(birthDate: string, today = todayInSaoPaulo()): number {
  const years = Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4));
  return today.slice(5) < birthDate.slice(5) ? years - 1 : years;
}

export const ageText = (birthDate: string) => {
  const age = ageOf(birthDate);
  return age === 1 ? '1 ano' : `${age} anos`;
};

export const birthDateText = (birthDate: string) => `${formatDate(birthDate)} · ${ageText(birthDate)}`;

export const phoneText = (phone: string | null) => (phone ? formatPhone(phone) : null);

export const passwordChangeText = (changedAt: string | null | undefined) =>
  changedAt ? `Última alteração ${formatSince(changedAt)}` : 'Ainda não foi alterada';
