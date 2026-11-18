import { screen, within } from '@testing-library/react';
import type { renderApp } from '@/test/render-app';
import { serveApi, type ApiCall, type MockResponse } from '@/test/render-app';
import type { DoctorAppointment } from '@lib/api/models';
import { civilDateInSaoPaulo } from '@lib/date';
import type { AgendaTab, DoctorHome } from './doctor-api';

export const FUTURE = '2030-01-10T13:00:00.000Z';
export const PAST = '2020-01-10T13:00:00.000Z';
export const LIST = '/api/doctor/appointments';
export const HOME = '/api/doctor/home';

export const actions = (
  overrides: Partial<DoctorAppointment['actions']> = {},
): DoctorAppointment['actions'] => ({
  canConfirm: false,
  canCancel: false,
  canComplete: false,
  canNoShow: false,
  ...overrides,
});

export const appointment = (id: string, overrides: Partial<DoctorAppointment> = {}): DoctorAppointment => ({
  id,
  status: 'pending',
  visitType: 'routine',
  startsAt: FUTURE,
  endsAt: '2030-01-10T13:30:00.000Z',
  notes: null,
  patient: { id: `p-${id}`, fullName: 'Andreia Soares', phone: '+5511987654321' },
  specialty: { id: 's1', name: 'Cardiologia', council: 'CRM' },
  unit: { id: 'u1', name: 'Hospital Central', address: 'Rua das Flores, 123', phone: '+551133334444' },
  cancellation: null,
  actions: actions({ canConfirm: true, canCancel: true }),
  ...overrides,
});

export const confirmed = (id: string, overrides: Partial<DoctorAppointment> = {}) =>
  appointment(id, { status: 'confirmed', actions: actions({ canCancel: true }), ...overrides });

export const unrecorded = (id: string, overrides: Partial<DoctorAppointment> = {}) =>
  confirmed(id, { startsAt: PAST, actions: actions({ canComplete: true, canNoShow: true }), ...overrides });

export const counts = { pending: 0, confirmed: 0, awaiting: 0, history: 0 };

export const home = (overrides: Partial<DoctorHome> = {}): DoctorHome => ({
  today: {
    date: '2030-01-10',
    total: 6,
    pending: 2,
    confirmed: 0,
    awaitingRecord: 0,
    completed: 4,
    noShow: 0,
    cancelled: 0,
    expired: 0,
  },
  pending: [],
  awaitingRecord: [],
  counts,
  lastNotification: null,
  ...overrides,
});

const withinDays = (params: URLSearchParams, day: string) => {
  const from = params.get('from');
  const to = params.get('to');
  return (!from || day >= from) && (!to || day <= to);
};

type Lists = Partial<Record<AgendaTab | 'all', DoctorAppointment[]>>;

interface Serve {
  lists?: Lists;
  homeData?: DoctorHome;
  action?: (path: string) => MockResponse;
  totals?: Partial<Record<AgendaTab, number>>;
}

export const serve = ({ lists = {}, homeData = home(), action, totals = {} }: Serve) =>
  serveApi(['doctor'], {
    [HOME]: () => ({ status: 200, body: homeData }),
    [LIST]: (_method, _body, url) => {
      const tab = url.searchParams.get('tab') as AgendaTab | 'all';
      const count = (key: AgendaTab) => totals[key] ?? lists[key]?.length ?? 0;
      const items =
        tab === 'all'
          ? (lists.all ?? Object.values(lists).flat())
              .filter(({ startsAt }) => withinDays(url.searchParams, civilDateInSaoPaulo(new Date(startsAt))))
              .toSorted((a, b) => a.startsAt.localeCompare(b.startsAt))
          : (lists[tab] ?? []);
      return {
        status: 200,
        body: {
          items,
          page: Number(url.searchParams.get('page')),
          pageSize: 10,
          total: tab === 'all' ? items.length : count(tab),
          counts: {
            pending: count('pending'),
            confirmed: count('confirmed'),
            awaiting: count('awaiting'),
            history: count('history'),
          },
        },
      };
    },
    ...(action && {
      '/api/appointments/a1/confirm': () => action('confirm'),
      '/api/appointments/a1/cancel': () => action('cancel'),
      '/api/appointments/a1/complete': () => action('complete'),
      '/api/appointments/a1/no-show': () => action('no-show'),
    }),
  });

export const posts = (calls: ApiCall[]) => calls.filter((call) => call.method === 'POST');

export type User = ReturnType<typeof renderApp>['user'];

export type Scope = Pick<typeof screen, 'getByRole'>;

export const openComplete = async (user: User, scope: Scope) => {
  await user.click(scope.getByRole('button', { name: /^Concluir/ }));
  return within(screen.getByRole('dialog', { name: 'Concluir consulta' }));
};

export const complete = async (user: User, scope: Scope) => {
  const dialog = await openComplete(user, scope);
  await user.click(dialog.getByRole('button', { name: 'Concluir consulta' }));
  return dialog;
};
