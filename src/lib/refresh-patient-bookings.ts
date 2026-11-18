import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

export const refreshPatientBookings = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.patient.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.booking.availabilities }),
  ]);
