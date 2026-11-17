export const queryKeys = {
  health: ['health'] as const,
  session: ['session'] as const,
  sessions: ['sessions'] as const,
  emailPreferences: ['email-preferences'] as const,
  adminHome: ['admin-home'] as const,
  adminReport: (period: object) => ['admin-report', period] as const,
  doctorSchedule: ['doctor-schedule'] as const,
  adminUsers: {
    all: ['admin-users'] as const,
    lists: ['admin-users', 'list'] as const,
    list: (params: object) => ['admin-users', 'list', params] as const,
    detail: (id: string) => ['admin-users', 'detail', id] as const,
    impact: (id: string) => ['admin-users', 'impact', id] as const,
  },
  booking: {
    doctorLists: ['booking', 'doctors'] as const,
    doctors: (specialtyId: string, search = '') => ['booking', 'doctors', specialtyId, search] as const,
    availabilities: ['booking', 'availability'] as const,
    availability: (doctorId: string, rescheduling = '') =>
      ['booking', 'availability', doctorId, rescheduling] as const,
    examAvailability: (unitId: string, examTypeId: string, rescheduling = '') =>
      ['booking', 'availability', 'exam', unitId, examTypeId, rescheduling] as const,
  },
  patient: {
    all: ['patient'] as const,
    home: ['patient', 'home'] as const,
    bookings: (params: object) => ['patient', 'bookings', params] as const,
    booking: (kind: string, id: string) => ['patient', 'booking', kind, id] as const,
    examResult: (bookingId: string) => ['patient', 'exam-result', bookingId] as const,
    examResults: (params: object) => ['patient', 'exam-results', params] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unread: (role: string) => ['notifications', 'unread', role] as const,
    list: (role: string, params: object) => ['notifications', 'list', role, params] as const,
  },
  doctor: {
    all: ['doctor'] as const,
    home: ['doctor', 'home'] as const,
    appointments: (params: object) => ['doctor', 'appointments', params] as const,
    patientResults: (patientId: string, page: number) =>
      ['doctor', 'patient-results', patientId, page] as const,
  },
  catalog: {
    specialties: ['catalog', 'specialties'] as const,
    units: ['catalog', 'units'] as const,
    examTypes: ['catalog', 'exam-types'] as const,
    offers: ['catalog', 'offers'] as const,
    policy: ['catalog', 'policy'] as const,
    integrations: ['catalog', 'integrations'] as const,
    activeSpecialties: ['catalog', 'active-specialties'] as const,
    activeUnits: ['catalog', 'active-units'] as const,
    activeUnitsFor: (examTypeId: string) => ['catalog', 'active-units', examTypeId] as const,
    activeExamTypes: ['catalog', 'active-exam-types'] as const,
  },
};
