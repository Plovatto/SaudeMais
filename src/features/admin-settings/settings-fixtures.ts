import { serveApi, type ApiRoute } from '@/test/render-app';

export const page = <T>(items: T[], total = items.length, current = 1) => ({
  items,
  page: current,
  pageSize: 20,
  total,
});

export const policy = {
  appointmentLateWindowHours: 24,
  examLateWindowHours: 2,
  maxReschedules: 2,
  bookingHorizonDays: 60,
  minLeadMinutes: 60,
  maxActiveBookings: 5,
  maxActiveAppointments: 5,
  maxActiveExams: 5,
  updatedAt: '2026-11-20T12:00:00.000Z',
};

const emptyList = () => ({ status: 200, body: page([]) });

export const serveSettings = (routes: Record<string, ApiRoute>) =>
  serveApi(['admin'], {
    '/api/admin/specialties': emptyList,
    '/api/admin/exam-types': emptyList,
    '/api/admin/units': emptyList,
    '/api/admin/integration-clients': emptyList,
    '/api/admin/policy': () => ({ status: 200, body: policy }),
    ...routes,
  });
