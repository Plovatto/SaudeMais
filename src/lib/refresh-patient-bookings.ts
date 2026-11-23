import type { QueryClient } from '@tanstack/react-query';
import { invalidateNotifications } from './api/notifications-api';
import { queryKeys } from './query-keys';

export const refreshPatientBookings = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.patient.all }),
    queryClient.resetQueries({ queryKey: queryKeys.booking.availabilities }),
    invalidateNotifications(queryClient),
  ]);
