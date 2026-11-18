import { areas } from './areas';

export const AGENDA_VIEWS = { week: 'agenda', list: 'consultas' } as const;

export const AGENDA_TABS = {
  all: 'todas',
  pending: 'a-confirmar',
  confirmed: 'confirmadas',
  awaiting: 'aguardando-registro',
  history: 'historico',
} as const;

export const AGENDA_STATUS_PARAM = 'situacao';

type AgendaSlug = (typeof AGENDA_TABS)[keyof typeof AGENDA_TABS];

const AGENDA_URL = `${areas.doctor.base}/agenda`;

export const doctorAgendaUrl = (slug?: AgendaSlug) =>
  slug ? `${AGENDA_URL}?aba=${AGENDA_VIEWS.list}&${AGENDA_STATUS_PARAM}=${slug}` : AGENDA_URL;
