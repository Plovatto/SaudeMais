import { request } from '@playwright/test';
import type { components } from '../../src/lib/api/schema';
import { addDays, todayInSaoPaulo } from '../../src/lib/date';
import { API_URL } from './env';
import type { Person } from './people';

type Schemas = components['schemas'];

interface CallOptions {
  token?: string;
  data?: unknown;
  params?: Record<string, string>;
}

const AVAILABILITY_DAYS = 30;

async function call<T>(
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  { token, data, params }: CallOptions = {},
) {
  const context = await request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: token ? { authorization: `Bearer ${token}` } : {},
  });
  try {
    const response = await context.fetch(path, { method, data, ...(params && { params }) });
    if (!response.ok())
      throw new Error(`${method} ${path} answered ${response.status()}: ${await response.text()}`);
    return (await response.json()) as T;
  } finally {
    await context.dispose();
  }
}

export const api = {
  login: async ({ email, password }: Pick<Person, 'email' | 'password'>) =>
    (
      await call<Schemas['LoginResponse']>('POST', '/api/users/login', {
        data: { email, password, remember: true },
      })
    ).token,
  register: ({ fullName, email, password }: Person) =>
    call<Schemas['User']>('POST', '/api/users/register', {
      data: { fullName, email, password, passwordConfirmation: password, acceptTerms: true },
    }),
  doctor: async (token: string, fullName: string) => {
    const page = await call<Schemas['DoctorPage']>('GET', '/api/doctors', {
      token,
      params: { search: fullName },
    });
    const doctor = page.items.find((item) => item.fullName === fullName);
    if (!doctor) throw new Error(`Doctor ${fullName} not found`);
    return doctor;
  },
  firstFreeSlot: async (token: string, doctorId: string) => {
    const from = todayInSaoPaulo();
    const { days } = await call<Schemas['DoctorAvailability']>(
      'GET',
      `/api/doctors/${doctorId}/availability`,
      {
        token,
        params: { from, to: addDays(from, AVAILABILITY_DAYS) },
      },
    );
    const slot = days[0]?.slots[0];
    if (!slot) throw new Error(`Doctor ${doctorId} has no free slot`);
    return slot.startsAt;
  },
  bookAppointment: (token: string, data: Schemas['BookAppointmentRequest']) =>
    call<Schemas['Appointment']>('POST', '/api/appointments', { token, data }),
  unreadCount: async (token: string, role: 'patient' | 'doctor') =>
    (
      await call<Schemas['UnreadNotificationCount']>('GET', '/api/notifications/unread-count', {
        token,
        params: { role },
      })
    ).count,
  saveSchedule: (token: string, data: Schemas['SaveDoctorScheduleRequest']) =>
    call<Schemas['SavedDoctorSchedule']>('PUT', '/api/doctor/schedule', { token, data }),
};
