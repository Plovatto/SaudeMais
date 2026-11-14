import { areas } from './areas';

export const AGENDA_TABS = {
  pending: 'a-confirmar',
  confirmed: 'confirmadas',
  awaiting: 'aguardando-registro',
  history: 'historico',
} as const;

type AgendaSlug = (typeof AGENDA_TABS)[keyof typeof AGENDA_TABS];

const AGENDA_URL = `${areas.doctor.base}/agenda`;

export const doctorAgendaUrl = (slug?: AgendaSlug) => (slug ? `${AGENDA_URL}?aba=${slug}` : AGENDA_URL);
