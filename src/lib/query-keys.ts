export const queryKeys = {
  health: ['health'] as const,
  session: ['session'] as const,
  sessions: ['sessions'] as const,
  adminHome: ['admin-home'] as const,
  adminUsers: {
    all: ['admin-users'] as const,
    lists: ['admin-users', 'list'] as const,
    list: (params: object) => ['admin-users', 'list', params] as const,
    detail: (id: string) => ['admin-users', 'detail', id] as const,
    impact: (id: string) => ['admin-users', 'impact', id] as const,
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
