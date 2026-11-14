export const queryKeys = {
  health: ['health'] as const,
  session: ['session'] as const,
  sessions: ['sessions'] as const,
  adminHome: ['admin-home'] as const,
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
    doctors: (specialtyId: string) => ['booking', 'doctors', specialtyId] as const,
    availabilities: ['booking', 'availability'] as const,
    availability: (doctorId: string) => ['booking', 'availability', doctorId] as const,
  },
  patient: {
    all: ['patient'] as const,
    home: ['patient', 'home'] as const,
    bookings: (params: object) => ['patient', 'bookings', params] as const,
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
  },
  catalog: {
    specialties: ['catalog', 'specialties'] as const,
    units: ['catalog', 'units'] as const,
    examTypes: ['catalog', 'exam-types'] as const,
    offers: ['catalog', 'offers'] as const,
    policy: ['catalog', 'policy'] as const,
    activeSpecialties: ['catalog', 'active-specialties'] as const,
    activeUnits: ['catalog', 'active-units'] as const,
  },
};
