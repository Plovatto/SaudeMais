export const queryKeys = {
  health: ['health'] as const,
  session: ['session'] as const,
  sessions: ['sessions'] as const,
  catalog: {
    specialties: ['catalog', 'specialties'] as const,
    units: ['catalog', 'units'] as const,
    examTypes: ['catalog', 'exam-types'] as const,
    offers: ['catalog', 'offers'] as const,
    policy: ['catalog', 'policy'] as const,
  },
};
